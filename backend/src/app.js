//TODO: add auth

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

import locations from "./public/resources/locations.json" with {type: "json"}

dotenv.config("../");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const secretKey = process.env.TOKEN_SECRET;

const pool = new pg.Pool({
    host: process.env.DB_HOST,
    port: process.env.POSTGRESDB_DOCKER_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const roles = [
    {role: "admin", password: process.env.USER_ADMIN_PASSWORD},
    {role: "adder", password: process.env.USER_ADD_PASSWORD},
    {role: "referee", password: process.env.USER_TOURNAMENT_PASSWORD},
]

const App = express();

const corsOptions ={
    origin:'*',
    credentials:true,
    optionSuccessStatus:200,
}

App.use(cors(corsOptions))
App.use(express.json());
App.use(express.urlencoded({ extended: true }));
App.use(express.static(path.join(__dirname, 'public')));

async function initDB(){
    await pool.query("CREATE table IF NOT EXISTS competitors(" +
        "id serial," +
        "name varchar," +
        "surname varchar," +
        "age integer," +
        "weight integer," +
        "level integer," +
        "location varchar)")
}

await initDB();

function authenticateToken(req, res, next){
    const token = req.body.token || req.query.token;
    if(!token)
        return res.sendStatus(401)

    jwt.verify(token, secretKey, (err, role) => {
        if (err) return res.sendStatus(403);
        req.role = role;
        next();
    })
}

App.post('/login', async(req, res) => {
    const { role, password } = req.body;
    const user = roles.find(r => r.role === role);
    if (!user || !(password == user.password)) {
        return res.status(401).send({
            error: true,
            errorType: "InvalidCredentials",
            token: null
        });
    }
    const token = jwt.sign({ userId: user.username }, secretKey, { expiresIn: '168h'});
    res.status(200).send({
        error: false,
        errorType: null,
        token: token
    })
});

App.post('/verify', authenticateToken, async(req, res) => {
   res.sendStatus(200);
})

App.post('/addCompetitors', authenticateToken, async (req, res) => {
    try{
        let wrong = [];
        const {
            location,
            changes,
            newCompetitors
        } = req.body;
        for (const competitor of newCompetitors) {
            const {
                id,
                name,
                surname,
                age,
                weight,
                level,
                exists
            } = competitor;
            if(exists){
                await pool.query("INSERT INTO competitors (name, surname, age, weight, level, location) VALUES ($1, $2, $3, $4, $5, $6)",
                    [name, surname, age, weight, level, location]);
            }
        }
        const IDs = await pool.query("SELECT id FROM competitors")
        const IDarray = IDs.rows.map(row => row.id);
        for(const change of changes) {
            const{
                id,
                name,
                value
            } = change;
            if(!(["name", "surname", "age", "weight", "level", "remove"].includes(name)
            && IDarray.includes(id)))
                continue;
            if(name === "remove"){
                await pool.query('DELETE FROM competitors WHERE id = $1', [id]);
            }else{
                await pool.query(`UPDATE competitors SET ${name}= $1 WHERE id = $2`, [value, id])
            }
        }
        res.sendStatus(200);
    }catch(error){
        res.sendStatus(500);
    }
})

App.get('/getCompetitors', async (req, res) => {
    const getCompetitorsQuery = await pool.query("SELECT id, name, surname, age, weight, level, location FROM competitors");
    res.send(getCompetitorsQuery.rows);
})

App.get("/getCompetitors/school/:school", authenticateToken, async (req, res) => {
    const getCompetitorsQuery = await pool.query("SELECT id, name, surname, age, weight, level FROM competitors WHERE location=$1", [req.params.school]);
    res.send(getCompetitorsQuery.rows);
})

App.listen(3000, () => {
    console.log('http://localhost:3000')
});
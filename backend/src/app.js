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
        "location varchar," +
        "category_id integer)")
    await pool.query("CREATE table IF NOT EXISTS categories(" +
        "id serial," +
        "level integer)")
    await pool.query("CREATE table IF NOT EXISTS fightResults(" +
        "category_id integer," +
        "winner_id integer," +
        "winner_points integer," +
        "loser_id integer," +
        "loser_points integer," +
        "reason varchar)")
}

await initDB();

function authenticateToken(req, res, next){
    const token = req.body.token || req.query.token;
    if(!token)
        return res.sendStatus(401)

    jwt.verify(token, secretKey, (err, role) => {
        if (err) return res.sendStatus(403);
        req.role = role;
        delete req.body.token;
        delete req.query.token;
        next();
    })
}

App.post('/login', async(req, res) => {
    try{
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
    }catch (error){
        console.log(error);
    }
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
                await pool.query("DELETE FROM categories_competitors WHERE id = $1", [id]);
            }else{
                await pool.query(`UPDATE competitors SET ${name}= $1 WHERE id = $2`, [value, id])
            }
        }
        res.sendStatus(200);
    }catch(error){
        res.sendStatus(500);
    }
})

App.get('/getCompetitors', authenticateToken, async (req, res) => {
    try{
        const getCompetitorsQuery = await pool.query("SELECT id, name, surname, age, weight, level, location FROM competitors");
        res.send(getCompetitorsQuery.rows);
    }catch(error){
        res.sendStatus(500);
    }
})

App.get("/getCompetitor/:id", authenticateToken, async (req, res) => {
    try{
        const getCompetitorQuery = await pool.query("SELECT id, name, surname, location, category_id FROM competitors WHERE id = $1", [req.params.id]);
        res.send(getCompetitorQuery.rows);
    }catch(error){
        console.log(error);
        res.sendStatus(500);
    }
})

App.get("/getCompetitors/school/:school", authenticateToken, async (req, res) => {
    try{
        const getCompetitorsQuery = await pool.query("SELECT id, name, surname, age, weight, level FROM competitors WHERE location=$1", [req.params.school]);
        res.send(getCompetitorsQuery.rows);
    }catch(error){
        console.log(error);
        res.sendStatus(500);
    }
})

App.get("/getCategories", authenticateToken, async (req, res) => {
    try{
        const getCategoriesQuery = await pool.query("SELECT id, name, surname, age, weight, level, category_id FROM competitors WHERE category_id IS NOT NULL");
        const getCategoryNumbers = await pool.query("SELECT DISTINCT category_id FROM competitors WHERE category_id IS NOT NULL ORDER BY category_id ASC");
        res.send({kategorie: getCategoryNumbers.rows, zawodnicy: getCategoriesQuery.rows});
    }catch(error){
        console.log(error);
        res.sendStatus(500);
    }
})

App.get("/getCompetitorsWithoutCategories", authenticateToken, async (req, res) => {
    try {
        const getCompetitorsQuery = await pool.query("SELECT id, name, surname, age, weight, level, category_id FROM competitors WHERE category_id IS NULL");
        res.send(getCompetitorsQuery.rows);
    }catch (error){
        console.log(error);
        res.sendStatus(500);
    }
})

App.post("/saveCategories", authenticateToken, async(req, res) => {
    try{
        await pool.query("UPDATE competitors SET category_id = NULL");
        req.body.categories.forEach(async (category) => {
            await pool.query("UPDATE competitors SET category_id = $1 WHERE id = ANY($2::int[])", [category.kategoria, category.zawodnicy])
        })
        res.send(200)
    }catch(error){
        console.log(error);
        res.send(500);
    }
})

App.post("/saveFightResults", authenticateToken, async (req, res) => {
    try{
        const {
            winner_ID,
            winner_points,
            loser_ID,
            loser_points,
            category_ID,
            reason
        } = req.body;
        if(winner_ID && winner_points && loser_ID && loser_points && category_ID && reason){
            await pool.query("INSERT INTO fightResults (category_id, winner_id, winner_points, loser_id, loser_points, reason) " +
                "VALUES ($1, $2, $3, $4, $5, $6)", [category_ID, winner_ID, winner_points, loser_ID, loser_points, reason])
            res.send(200)
        }else{
            res.send(400)
        }
    }catch(error){
        console.log(error);
        res.sendStatus(500)
    }
})

App.get("/getFightResults", async (req, res) => {
    const fightResultsQuery = await pool.query("SELECT * FROM fightResults");
    res.send(fightResultsQuery.rows);
})

App.get("/getFightResults/:id", async(req, res) => {
   const fightResultsQuery = await pool.query("SELECT * FROM fightResults WHERE winner_id = $1 UNION SELECT * FROM fightResults WHERE loser_id = $1", [req.params.id]);
   res.send(fightResultsQuery.rows);
})

App.listen(3000, () => {
    console.log('http://localhost:3000')
});
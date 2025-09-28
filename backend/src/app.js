//TODO: add auth

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

import locations from "./public/resources/locations.json" with {type: "json"}

dotenv.config("../");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new pg.Pool({
    host: process.env.DB_HOST,
    port: process.env.POSTGRESDB_DOCKER_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const app = express();

const corsOptions ={
    origin:'*',
    credentials:true,
    optionSuccessStatus:200,
}

app.use(cors(corsOptions))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

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

initDB();

app.post('/addCompetitors', async (req, res) => {
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
        console.log(error)
        res.sendStatus(500);
    }
})

app.get('/getCompetitors', async (req, res) => {
    const getCompetitorsQuery = await pool.query("SELECT id, name, surname, age, weight, level, location FROM competitors");
    res.send(getCompetitorsQuery.rows);
})

app.get("/getCompetitors/school/:school", async (req, res) => {
    const getCompetitorsQuery = await pool.query("SELECT id, name, surname, age, weight, level FROM competitors WHERE location=$1", [req.params.school]);
    res.send(getCompetitorsQuery.rows);
})

app.listen(3000, () => {
    console.log('http://localhost:3000')
});
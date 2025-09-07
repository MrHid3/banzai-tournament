import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

import pool from './server_scripts/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    let wrong = [];
    console.log(req.body);
    // req.body.competitors.forEach(async (competitor, index) => {
    //     if(competitor[0] != "" && competitor[1] != "" && competitor[2] != "" && competitor[3] != "" && req.body.location != null){
    //         await pool.query("INSERT INTO competitors (name, surname, age, weight, level, location) values ($1, $2, $3, $4, $5, $6)",
    //             [competitor.name, competitor.surname, competitor.age, competitor.weight, competitor.level, req.body.location])
    //     }else{
    //         wrong.push(index)
    //     }
    // });
    // if(wrong.length > 0){
    //     res.send({
    //         error: true,
    //         wrong: wrong
    //     })
    // }
    // res.send({
    //     error: false,
    //     wrong: null
    // })
})

app.get('/getCompetitors', async (req, res) => {
    const getCompetitorsQuery = await pool.query("SELECT id, name, surname, age, weight, level, location FROM competitors");
    res.send(getCompetitorsQuery.rows);
})

app.get("/getCompetitors/school/:school", async (req, res) => {
    const getCompetitorsQuery = await pool.query("SELECT id, name, surname, age, weight, level, location FROM competitors WHERE location=$1", [req.params.school]);
    res.send(getCompetitorsQuery.rows);
})

app.listen(3000, () => {
    console.log('http://localhost:3000')
});
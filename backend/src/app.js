import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { createServer } from "node:http"
import { Server  } from "socket.io";

dotenv.config("../");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const secretKey = process.env.TOKEN_SECRET;
const isTest = (process.env.ENV === 'dev');

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
    {role: "bigReferee", password: process.env.USER_BIG_REFEREE_PASSWORD},
    {role: "referee", password: process.env.USER_REFEREE_PASSWORD},
]

if(isTest){
    roles.push({role: "test", password: process.env.USER_TEST_PASSWORD});
}

const App = express();
const server = createServer(App);
const io = new Server(server, {
    cors: {
        origin: [process.env.FRONTEND_URL]
    }
});

const corsOptions ={
    origin:'*',
    credentials:true,
    optionSuccessStatus:200,
}

App.use(cors(corsOptions))
App.use(express.json());
App.use(express.urlencoded({ extended: true }));
App.use(express.static(path.join(__dirname, 'public')));

// await pool.query("DROP TABLE IF EXISTS tables; DROP TABLE IF EXISTS fightResults; DROP TABLE IF EXISTS competitors; DROP TABLE IF EXISTS categories");
await pool.query("CREATE TABLE IF NOT EXISTS categories(" +
        "id integer primary key," +
        "level integer," +
        "half integer," +
        "played_out boolean);" +
    "CREATE TABLE IF NOT EXISTS competitors(" +
        "id serial primary key," +
        "name varchar," +
        "surname varchar," +
        "age integer," +
        "weight numeric(4, 1)," +
        "level integer," +
        "location varchar," +
        "category_id integer references categories(id)," +
        "place integer," +
        "is_name_duplicate boolean);" +
    "CREATE table IF NOT EXISTS fightResults(" +
        "category_id integer references categories(id)," +
        "winner_id integer references competitors(id)," +
        "winner_points integer," +
        "loser_id integer references competitors(id)," +
        "loser_points integer," +
        "reason varchar);" +
    "CREATE table IF NOT EXISTS config(" +
        "key varchar primary key," +
        "value varchar);" +
    "CREATE table IF NOT EXISTS tables(" +
        "table_number int," +
        "category_id int references categories(id) primary key);" +
    "INSERT INTO config (key, value) values ('half', '1') ON CONFLICT (key) DO NOTHING;" +
    "INSERT INTO config (key, value) values ('numberOfTables', '5') ON CONFLICT (key) DO NOTHING;" +
    "INSERT INTO config (key, value) values ('fightsEnabled', 0) ON CONFLICT (key) DO NOTHING;" +
    "CREATE OR REPLACE PROCEDURE update_duplicates(r_name varchar, r_surname varchar) " +
    "LANGUAGE plpgsql " +
    "AS $$ " +
    "BEGIN " +
    "   UPDATE competitors" +
    "   SET is_name_duplicate = " +
    "   ((SELECT COUNT(1) FROM competitors WHERE name = r_name AND surname = r_surname) > 1)" +
    "   WHERE name = r_name AND surname = r_surname;" +
    "END; " +
    "$$;")

let config = {};
async function loadConfig(){
    (await pool.query("SELECT key, value FROM config")).rows.forEach(async (row) => {
        config[row.key] = row.value;
    })
}
await loadConfig();

function authenticateToken(req, res, next){
    delete req.pass;
    delete req.role;
    const token = req.body.token || req.query.token;
    if(!token)
        return res.sendStatus(401)

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) return res.sendStatus(403);
        req.role = decoded.role;
        delete req.body.token;
        delete req.query.token;
        next()
    })
}

function authenticateAdder(req, res, next){
    if(req.role === "adder" || req.role === "test") {
        req.pass = true;
    }
    next();
}

function authenticateReferee(req, res, next){
    if(req.role === "referee" || req.role === "test") {
        req.pass = true;
    }
    next();
}

function authenticateAdmin(req, res, next) {
    if (req.role === "admin" || req.role === "test") {
        req.pass = true;
    }
    next();
}

function authenticateBigReferee(req, res, next){
    if (req.role === "bigReferee" || req.role === "test"){
        req.pass = true;
    }
    next();
}

function authenticateRole(req, res, next){
    if(req.pass){
        next();
    }else{
        res.sendStatus(403);
    }
}

if(isTest){
    App.post("/clearBase", authenticateToken, authenticateAdmin, authenticateRole, async (req, res) => {
        try{
            await pool.query("TRUNCATE fightResults CASCADE; TRUNCATE competitors CASCADE; TRUNCATE categories CASCADE; TRUNCATE tables CASCADE")
            res.sendStatus(200);
        }catch(error){
            console.log(error);
            res.sendStatus(500);
        }
    })

    App.post("/resetFights", authenticateToken, authenticateAdmin, authenticateRole, async (req, res) => {
        try{
            await pool.query(`TRUNCATE fightResults CASCADE; TRUNCATE tables CASCADE; UPDATE competitors SET place = null; UPDATE categories SET played_out = false;`);
            res.sendStatus(200);
        }catch(error){
            console.log(error);
            res.sendStatus(500);
        }
    })
}

App.get("/", (req, res) => {
    res.sendStatus(200);
})

App.post('/login', async(req, res) => {
    try{
        const { role, password } = req.body;
        const user = roles.find(r => r.role === role);
        if (!user || !(password === user.password)) {
            return res.status(401).send({
                error: true,
                errorType: "InvalidCredentials",
                token: null
            });
        }
        const token = jwt.sign({ role: user.role }, secretKey, { expiresIn: '168h'});
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

App.post('/addCompetitors', authenticateToken, authenticateAdder, authenticateAdmin, authenticateRole, async (req, res) => {
    try{
        if(config.fightsEnabled == 1){
            res.send(400);
            return;
        }
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
                await pool.query("INSERT INTO competitors (name, surname, age, weight, level, location) VALUES ($1, $2, $3, $4, $5, $6);",
                    [name, surname, age, weight, level, location]);
                await pool.query("CALL update_duplicates($1, $2)", [name, surname]);
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
                const data = (await pool.query("SELECT name, surname FROM competitors WHERE id = $1", [id])).rows[0];
                await pool.query('DELETE FROM competitors WHERE id = $1', [id]);
                await pool.query('CALL update_duplicates($1, $2)', [data.name, data.surname])
            }else{
                const dataOld = (await pool.query("SELECT name, surname FROM competitors WHERE id = $1", [id])).rows[0];
                await pool.query(`UPDATE competitors SET ${name}= $1 WHERE id = $2`, [value, id]);
                if(name === "name" || name === "surname"){
                    const data = (await pool.query("SELECT name, surname FROM competitors WHERE id = $1", [id])).rows[0];
                    await pool.query('CALL update_duplicates($1, $2)', [data.name, data.surname]);
                    await pool.query('CALL update_duplicates($1, $2)', [dataOld.name, dataOld.surname]);
                }
            }
        }
        res.sendStatus(200);
    }catch(error){
        console.log(error)
        res.sendStatus(500);
    }
})

App.get('/getCompetitors', authenticateToken, async (req, res) => {
    try{
        const getCompetitorsQuery = await pool.query("SELECT id, name, surname, age, weight, level, location, place, category_id, is_name_duplicate FROM competitors ORDER BY id ASC");
        res.send(getCompetitorsQuery.rows);
    }catch(error){
        res.sendStatus(500);
    }
})

App.get("/getCompetitor/:id", authenticateToken, async (req, res) => {
    try{
        const getCompetitorQuery = await pool.query("SELECT id, name, surname, age, weight, level, location, category_id, place, is_name_duplicate FROM competitors WHERE id = $1 ORDER BY id ASC", [req.params.id]);
        res.send(getCompetitorQuery.rows);
    }catch(error){
        console.log(error);
        res.sendStatus(500);
    }
})

App.get("/getCompetitors/school/:school", authenticateToken, async (req, res) => {
    try{
        const getCompetitorsQuery = await pool.query("SELECT id, name, surname, age, weight, level, category_id, is_name_duplicate FROM competitors WHERE location=$1 ORDER BY id ASC", [req.params.school]);
        res.send(getCompetitorsQuery.rows);
    }catch(error){
        console.log(error);
        res.sendStatus(500);
    }
})

App.get("/getCategories", authenticateToken, authenticateAdmin, authenticateRole, async (req, res) => {
    try{
        const categoriesQuery = await pool.query("SELECT DISTINCT(ca.id), ca.level, ca.half FROM categories ca RIGHT JOIN competitors co ON co.category_id = ca.id WHERE ca.ID IS NOT NULL ORDER BY ca.id ASC")
        let result = [];
        let index = 0;
        for (const category of categoriesQuery.rows) {
            result.push({kategorie: category.id, half: category.half, level: category.level, zawodnicy: []});
            const competitorsQuery = await pool.query("SELECT co.id, co.name, co.surname, co.age, co.weight, co.level, co.location, ca.half FROM competitors co LEFT JOIN categories ca ON ca.id = co.category_id WHERE co.category_id = $1", [category.id]);
            for(const competitor of competitorsQuery.rows){
                result[index].zawodnicy.push(competitor);
            }
            index++;
        }
        res.send(result)
    }catch(error){
        console.log(error);
        res.sendStatus(500);
    }
})

App.get("/getCategory/:id", authenticateToken, authenticateReferee, authenticateRole, async (req, res) => {
    const competitorsQuery = await pool.query("SELECT id, name, surname, level FROM competitors WHERE category_id = $1", [req.params.id]);
    res.send(competitorsQuery.rows);
})

App.get("/getCompetitorsWithoutCategories", authenticateToken, authenticateAdmin, authenticateRole, async (req, res) => {
    try {
        const getCompetitorsQuery = await pool.query("SELECT id, name, surname, age, weight, level, location FROM competitors WHERE category_id IS NULL");
        res.send(getCompetitorsQuery.rows);
    }catch (error){
        console.log(error);
        res.sendStatus(500);
    }
})

App.post("/saveCategories", authenticateToken, authenticateAdmin, authenticateRole, async(req, res) => {
    try{
        if(config.fightsEnabled == 1){
            res.send(400);
            return;
        }
        await pool.query("UPDATE competitors SET category_id = NULL")
        await pool.query("DELETE FROM categories");
        if(req.body.categories == []){
            res.sendStatus(200)
            return;
        }
        req.body.categories.forEach(async (category) => {
            const parametersQuery = await pool.query("SELECT level, age FROM competitors WHERE id = ANY($1::int[]) ORDER BY age ASC LIMIT 1", [category.zawodnicy]);
            await pool.query("INSERT INTO categories(id, level, half, played_out) VALUES ($1, $2, $3, $4)", [category.kategoria, parametersQuery.rows[0].level, category.half, false])
            await pool.query("UPDATE competitors SET category_id = $1 WHERE id = ANY($2::int[]) AND level = $3", [category.kategoria, category.zawodnicy, parametersQuery.rows[0].level])
        })
        res.sendStatus(200)
    }catch(error){
        console.log(error);
        res.sendStatus(500);
    }
})

App.post("/saveFightResults", authenticateToken, authenticateReferee, authenticateRole, async (req, res) => {
    try{
        if(config.fightsEnabled == 0){
            res.send(400);
            return;
        }
        const {
            winner_ID,
            winner_points,
            loser_ID,
            loser_points,
            category_ID,
            reason
        } = req.body;
        await pool.query("DELETE FROM fightResults WHERE (winner_id = $1 AND loser_id = $2) OR (winner_id = $2 AND loser_id = $1)", [winner_ID, loser_ID])
        await pool.query("INSERT INTO fightResults (category_id, winner_id, winner_points, loser_id, loser_points, reason) " +
            "VALUES ($1, $2, $3, $4, $5, $6)", [category_ID, winner_ID, winner_points, loser_ID, loser_points, reason])
        res.sendStatus(200)
    }catch(error){
        console.log(error);
        res.sendStatus(500)
    }
})

App.get("/getFightResults", authenticateToken, authenticateAdmin, authenticateRole, async (req, res) => {
    try{
        const fightResultsQuery = await pool.query("SELECT * FROM fightResults");
        res.send(fightResultsQuery.rows);
    }catch(error){
        console.log(error);
        res.sendStatus(500);
    }
})

App.get("/getFightResults/:id", authenticateToken, authenticateAdmin, authenticateRole, async (req, res) => {
    try{
        const fightResultsQuery = await pool.query("SELECT * FROM fightResults WHERE winner_id = $1 OR loser_id = $1", [req.params.id]);
        res.send(fightResultsQuery.rows);
    }catch(error){
        console.log(error);
        res.sendStatus(500);
    }
})

App.get("/getCategoryResults/:id", authenticateToken, authenticateAdmin, authenticateReferee, authenticateRole, async (req, res) => {
    try{
        const fightResultsQuery = await pool.query("SELECT * FROM fightResults WHERE category_id = $1", [req.params.id]);
        res.send(fightResultsQuery.rows);
    }catch(error){
        console.log(error);
        res.sendStatus(500);
    }
})

App.get("/getGroups", authenticateToken, authenticateReferee, authenticateRole, async (req, res) => {
    try{
        const tableNumber = req.query.tableNumber;
        const currentCategories = await pool.query("SELECT category_id FROM tables WHERE table_number = $1", [tableNumber]);
        let categories;
        if (currentCategories.rows.length === 0) {
            categories = (await pool.query("SELECT id FROM categories WHERE half = $1 AND played_out IS FALSE AND id NOT IN (SELECT category_id FROM tables) ORDER BY id ASC LIMIT 2 ", [config.half])).rows.map(c => c.id);
            categories.forEach(async (category) => {
                await pool.query("INSERT INTO tables (table_number, category_id) values ($1, $2)", [tableNumber, category])
            })
        }else{
            categories = currentCategories.rows.map(c => c.category_id);
        }
        res.send(categories);
    }catch(error){
        console.log(error);
        res.sendStatus(500);
    }
})

App.post("/callCompetitors", authenticateToken, authenticateReferee, authenticateRole, async (req, res) => {
    try{
        if(config.fightsEnabled == 0){
            res.send(400);
            return;
        }
        const {competitors, matNumber} = req.body;
        let competitorsQ = (await pool.query("SELECT name, surname, location, is_name_duplicate FROM competitors WHERE id = ANY($1::int[])", [competitors])).rows;
        competitorsQ.forEach(c => {if(!c.is_name_duplicate) delete c.location; delete c.is_name_duplicate});
        io.sockets.emit("call", {matNumber: matNumber , competitors: competitorsQ});
        res.sendStatus(200);
    }catch(error){
        console.log(error);
        res.sendStatus(500);
    }
})

App.post("/endCategory", authenticateToken, authenticateReferee, authenticateRole, async (req, res) => {
    try{
        if(config.fightsEnabled == 0){
            res.send(400);
            return;
        }
        const {category_id} = req.body;
        const fights = (await pool.query("SELECT * FROM fightResults WHERE category_id = $1", [category_id])).rows;
        const competitors = (await pool.query("SELECT id, name, surname, location, is_name_duplicate FROM competitors WHERE category_id = $1", [category_id])).rows;
        if(fights.length < competitors.length * (competitors.length - 1) / 2){
            res.sendStatus(400);
            return;
        }
        await pool.query("DELETE FROM tables WHERE category_id = $1", [category_id]);
        await pool.query("UPDATE categories SET played_out = TRUE WHERE id = $1", [category_id]);
        for(let competitor of competitors){
            competitor.wins = {};
            competitor.points = 0;
            competitor.noShow = 0;
            for(let fight of fights){
                if(((fight.winner_id === competitor.id || fight.loser_id === competitor.id) && fight.reason === "default") || (fight.loser_id === competitor.id && fight.reason === "walkover"))
                    competitor.noShow++;
                if(fight.winner_id === competitor.id && fight.reason !== "default"){
                    competitor.wins[fight.loser_id] = true;
                    competitor.points += fight.winner_points;
                    if(fight.reason == "tap")
                        competitor.points += 99;
                }
                if(fight.loser_id === competitor.id)
                    competitor.points += fight.loser_points;
            }
        }
        competitors.sort((a,b) => b.points - a.points);
        competitors.sort((a,b) => a.noShow - b.noShow);
        competitors.sort((a, b) => {
            if(Object.keys(a.wins).length === Object.keys(b.wins).length){
                if(a.wins[b.id]) return -1;
                if(b.wins[a.id]) return 1;
            }
            return Object.keys(b.wins).length - Object.keys(a.wins).length;
        })
        for(let i in competitors){
            if(i == 0){
                competitors[i].place = 1;
            } else if(competitors[i - 1].place == 3){
                competitors[i].place = 3;
            // } else if (competitors[i - 1].points === competitors[i].points){
            //     competitors[i].place = competitors[i - 1].place;
            } else {
                competitors[i].place = competitors[i - 1].place + 1;
            }
        }
        for(let c of competitors){
            delete c.points;
            delete c.wins;
            if(!c.is_name_duplicate)
                delete c.location;
            delete c.is_name_duplicate;
            await pool.query("UPDATE competitors SET place = $1 WHERE id = $2", [c.place, c.id]);
            if(c.noShow === competitors.length - 1 && competitors.length !== 1)
                c.absent = true;
            delete c.noShow;
        }
        // competitors.filter((c) => c.default);
        io.sockets.emit("award", {category: category_id, competitors: competitors})
        res.sendStatus(200);
    }catch(error){
        console.log(error);
        res.sendStatus(500);
    }
})

App.post("/config", authenticateToken, authenticateReferee, authenticateRole, async(req, res) => {
    try{
        const {key, value} = req.body;
        await pool.query("UPDATE config SET value = $1 WHERE key = $2", [value, key]);
        config[key] = value;
        res.send(200)
    }catch(error){
        console.log(error);
        res.sendStaus(500)
    }
})

App.get("/getConfig", authenticateToken, authenticateAdder, authenticateAdmin, authenticateRole, async(req, res) => {
    try{
        res.send(config);
    }catch(error){
        console.log(error);
        res.send(500);
    }
})

// App.post("/switchHalf", authenticateToken, authenticateAdmin, async(req, res) => {
//     const {categoryID, half} = req.body;
//     await pool.query("UPDATE categories SET half = $1 WHERE id = $2", [half, categoryID]);
//     res.send(200);
// })

App.get("/getAllResults", authenticateToken, authenticateAdmin, authenticateRole, async(req, res) => {
    try{
        const result = (await (pool.query("SELECT ca.id, co.name, co.surname, co.location, co.is_name_duplicate, co.place, co.category_id FROM competitors co LEFT JOIN categories ca ON co.category_id = ca.id WHERE ca.played_out IS TRUE ORDER BY ca.id, co.place ASC"))).rows
        res.send(result);
    }catch(error){
        console.log(error);
        res.sendStatus(500);
    }
})

server.listen(3000, () => {
    console.log(`Backend is up`);
});

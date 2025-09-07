import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { engine } from 'express-handlebars';
import "dotenv/config"
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', cors(), (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/index.html'));
})

app.get('/dodawanie', cors(), (req, res) => {
    res.render("addCompetitors", {backendURL: process.env.BACKEND_URL});
})

app.listen(4000, () => {
    console.log('http://localhost:4000')
});
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { engine } from 'express-handlebars';
import "dotenv/config"
import cors from 'cors';
import dotenv from "dotenv";

dotenv.config("../")

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const App = express();

App.engine('handlebars', engine());
App.set('view engine', 'handlebars');
App.set('views', path.join(__dirname, 'views'));

App.use(express.json());
App.use(express.urlencoded({ extended: true }));
App.use(express.static(path.join(__dirname, 'public')));

App.get('/', cors(), (req, res) => {
    res.redirect("/menu");
})

App.get('/login', cors(), (req, res) => {
    res.render('login', {backendURL: process.env.BACKEND_URL, login: true});
})

App.get('/menu', cors(), (req, res) => {
    res.render('menu', {backendURL: process.env.BACKEND_URL, menu: true});
})

App.get('/dodawanie', cors(), (req, res) => {
    res.render("addCompetitors", {backendURL: process.env.BACKEND_URL});
})

App.get("/kategorie", cors(), (req, res) => {
    res.render('categories', {backendURL: process.env.BACKEND_URL});
})

App.get('/zegar', cors(), (req, res) => {
    res.render("clock", {backendURL: process.env.BACKEND_URL, clock: true});
})

App.get("/test", cors(), (req, res) => {
    res.render("test", {backendURL: process.env.BACKEND_URL});
})

App.listen(4000, () => {
    console.log('Frontend is up at http://localhost:4000')
});
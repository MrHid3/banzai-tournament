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
App.locals.test = (process.env.ENVIRONMENT === "test");
App.locals.backendURL = process.env.BACKEND_URL;

App.get('/', cors(), (req, res) => {
    res.redirect("/menu");
})

App.get('/login', cors(), (req, res) => {
    res.render('login', {login: true});
})

App.get('/menu', cors(), (req, res) => {
    res.render('menu', {menu: true});
})

App.get('/dodawanie', cors(), (req, res) => {
    res.render("addCompetitors", {beforeFightsStart: true, wrongTimeText: "Nie można już dodawać zawodników", redirectOnWrongtime: false});
})

App.get("/kategorie", cors(), (req, res) => {
    res.render('categories', {beforeFightsStart: true, wrongTimeText: "Nie można już edytować kategorii", redirectOnWrongtime: false});
})

App.get('/zegar', cors(), (req, res) => {
    res.render("clock", {clock: true, afterFightsStart: true, redirectOnWrongtime: true});
})

App.get("/stolikGlowny", cors(), (req, res) => {
    res.render("mainTable", {afterFightsStart: true, redirectOnWrongtime: false});
})

if(process.env.ENVIRONMENT === "DEV"){
    App.get("/test", cors(), (req, res) => {
        res.render("test");
    })
}

App.get("/wybierzStolik", cors(), (req, res) => {
    res.render("chooseTable", {afterFightsStart: true, redirectOnWrongtime: false});
})

App.get("/stolikMaly", cors(), (req, res) => {
    res.render("smallTable", {afterFightsStart: true, redirectOnWrongtime: false});
})

App.get("/wynikiKategorii", cors(), (req, res) => {
    res.render("categoryResults", {afterFightsStart: true, redirectOnWrongtime: false});
})

App.get("/konfiguracja", cors(), (req, res) => {
    res.render("config");
})

App.listen(4000, () => {
    console.log(`Frontend is up at ${process.env.FRONTEND_URL}`);
});
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
const isTest = (process.env.ENV === "dev");

const App = express();

App.engine('handlebars', engine());
App.set('view engine', 'handlebars');
App.set('views', path.join(__dirname, 'views'));

App.use(express.json());
App.use(express.urlencoded({ extended: true }));
App.use(express.static(path.join(__dirname, 'public')));
App.use("/favicon.ico", express.static(path.join(__dirname, 'public/images/favicon-transparent.ico')));
App.locals.test = isTest;
App.locals.backendURL = process.env.BACKEND_URL;

if(isTest){
    App.get("/test", cors(), (req, res) => {
        res.render("test");
    })
}

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
    res.render("addCompetitors", {beforeFightsStart: true, wrongTimeText: "Nie można już dodawać zawodników", redirectOnWrongTime: false});
})

App.get("/kategorie", cors(), (req, res) => {
    res.render('categories', {beforeFightsStart: true, wrongTimeText: "Nie można już edytować kategorii", redirectOnWrongTime: false});
})

App.get('/zegar', cors(), (req, res) => {
    res.render("clock", {clock: true, afterFightsStart: true, redirectOnWrongTime: true});
})

App.get("/stolikGlowny", cors(), (req, res) => {
    res.render("mainTable", {afterFightsStart: true, redirectOnWrongTime: false});
})

App.get("/wybierzStolik", cors(), (req, res) => {
    res.render("chooseTable", {afterFightsStart: true, redirectOnWrongTime: true});
})

App.get("/stolikMaly", cors(), (req, res) => {
    res.render("smallTable", {afterFightsStart: true, redirectOnWrongTime: true});
})

App.get("/wynikiKategorii", cors(), (req, res) => {
    res.render("categoryResults", {afterFightsStart: true, redirectOnWrongTime: false});
})

App.get("/konfiguracja", cors(), (req, res) => {
    res.render("config");
})

App.listen(4000, () => {
    console.log(`Frontend is up at ${process.env.FRONTEND_URL}`);
});
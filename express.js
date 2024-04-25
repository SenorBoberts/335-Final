const express = require("express"); /* Accessing express module */
const path = require("path");
const bodyParser = require("body-parser");
const badWords = require("bad-words-next");
const en = require("bad-words-next/data/en.json");
const BadWordsNext = require("bad-words-next");
const app = express(); /* app is a request handler function */
const filter = new BadWordsNext({data: en})
require("dotenv").config();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
    res.render("index");
});

app.listen(5001);

function safeForWork(s){
    return filter.filter(s);
}

function removeSwears(s){
    return s.replace, (/\*/g, '');
}

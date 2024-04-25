const express = require("express"); /* Accessing express module */
const path = require("path");
const bodyParser = require("body-parser");
const { SwearShield } = require("swear-shield");
const app = express(); /* app is a request handler function */
const filter = new SwearShield();
require("dotenv").config();

app.get("/", (req, res) => {
    res.send("hello!");
});

app.listen(5001);

function safeForWork(s){
    let san = filter.sanitize(s);
    return san;
}

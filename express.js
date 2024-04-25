const express = require("express"); /* Accessing express module */
const path = require("path");
const bodyParser = require("body-parser");
const app = express(); /* app is a request handler function */
require("dotenv").config();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
    res.render("index");
});

app.listen(5001);

const express = require("express"); /* Accessing express module */
const path = require("path");
const bodyParser = require("body-parser");
const app = express(); /* app is a request handler function */
require("dotenv").config();

app.get("/", (req, res) => {
    res.send("hello!");
});

app.listen(5001);

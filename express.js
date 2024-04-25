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

app.post("/song", async (req, res) => {
    const title = req.body.title;
    const artist = req.body.artist;

    const lyrics = await fetchLyrics(artist, title);

    const variables = {
        title: title,
        artist: artist,
        lyrics: lyrics,
    };

    res.render("result", variables);
});

const fetchLyrics = async (artist, title) => {
    const lyrics = await fetch(`https://api.lyrics.ovh/v1/${artist}/${title}`)
        .then((res) => res.json())
        .then((json) => {
            if (json.error) {
                res.render("error");
            }
            return json.lyrics.substring(json.lyrics.indexOf(",") + 1);
        });

    return lyrics;
};

app.listen(5001);

function safeForWork(s){
    return filter.filter(s);
}

function removeSwears(s){
    return s.replace, (/\*/g, '');
}

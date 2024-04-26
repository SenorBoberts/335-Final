const express = require("express"); /* Accessing express module */
const path = require("path");
const bodyParser = require("body-parser");
const badWords = require("bad-words-next");
const en = require("bad-words-next/data/en.json");
const BadWordsNext = require("bad-words-next");
const app = express(); /* app is a request handler function */
const filter = new BadWordsNext({ data: en });
require("dotenv").config();

const uri = process.env.MONGO_URI;

const { MongoClient, ServerApiVersion } = require("mongodb");

let db;

async function setUpMongo() {
    const client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverApi: ServerApiVersion.v1,
    });

    try {
        const conn = await client.connect();

        db = conn.db(process.env.MONGO_DB_NAME);

        await db.command({ ping: 1 });
    } catch (e) {
        console.error(e);
    }
}

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/song", async (req, res) => {
    const title = req.query.title;
    const artist = req.query.artist;

    const lyrics = await fetchLyrics(artist, title);

    const dbSearch = await db
        .collection(process.env.MONGO_COLLECTION_NAME)
        .findOne({ title: title, artist: artist, lyrics: lyrics });

    let likeCount = 0;
    if (dbSearch) {
        likeCount = dbSearch.likeCount;
    }

    const variables = {
        title: title,
        artist: artist,
        lyrics: lyrics,
        likeCount: likeCount,
    };

    res.render("result", variables);
});

app.get("/topSongs", async (req, res) => {
    //get all songs (find w/ empty query)
    const songs = await db.collection(process.env.MONGO_COLLECTION_NAME).find({}).toArray();

    songs.sort((a, b) => {
        return b.likeCount - a.likeCount;
    });

    let divs = "";

    for (let s of songs) {
        const lyricsTrimmed = s.lyrics.trim().substring(0, 100) + "...";
        let currDiv = `<div class="mt-3 col-lg-4"><h4>${s.title} - ${s.artist}</h4><div><b>Lyrics:</b> ${lyricsTrimmed}</div><div>&#128077; <b>${s.likeCount}</b></div></div>`;
        divs += currDiv;
    }

    const variables = {
        topSongs: divs,
    };

    res.render("topSongs", variables);
});

app.post("/likeSong", async (req, res) => {
    try {
        await db
            .collection(process.env.MONGO_COLLECTION_NAME)
            .updateOne(
                { title: req.body.title, artist: req.body.artist, lyrics: req.body.lyrics },
                { $inc: { likeCount: 1 } },
                { upsert: true }
            );

        res.json({ success: true });
    } catch (e) {
        console.log(e);
        res.json({ error: true });
    }
});

const fetchLyrics = async (artist, title) => {
    const lyrics = await fetch(`https://api.lyrics.ovh/v1/${artist}/${title}`)
        .then((res) => res.json())
        .then((json) => {
            if (json.error) {
                return "";
            }
            return json.lyrics.substring(json.lyrics.indexOf(",") + 1);
        });

    return lyrics;
};

setUpMongo()
    .catch(console.error)
    .then(() => {
        app.listen(5001);
    });

function safeForWork(s) {
    return filter.filter(s);
}

function removeSwears(s) {
    return s.replace, (/\*/g, "");
}

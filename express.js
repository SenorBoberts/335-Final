const express = require("express"); /* Accessing express module */
const path = require("path");
const bodyParser = require("body-parser");
const BadWordsNext = require("bad-words-next");
const app = express(); /* app is a request handler function */
const en = require("bad-words-next/data/en.json");
const filter = new BadWordsNext({ data: en });
require("dotenv").config();

const PORT_NUMBER = 5001;

const uri = process.env.MONGO_URI;

const { MongoClient, ServerApiVersion } = require("mongodb");

let db;

async function setUpMongo() {
    const client = new MongoClient(uri, {
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
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("index", {
        HTMLTitle: "Song Finder",
    });
});

app.get("/song", async (req, res) => {
    const song = await fetchSongInfo(req.query.artist, req.query.title);

    if (song == "error") {
        res.render("error", {
            rawTitle: req.query.title,
            rawArtist: req.query.artist,
            HTMLTitle: "No Song Found",
        });

        return;
    }

    const { title, artist } = song;
    let { lyrics } = song;

    // testing without removing the ***'s, lyrics make more sense to end user with them imo
    lyrics = safeForWork(lyrics);
    // lyrics = removeSwears(lyrics);

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
        HTMLTitle: title + " - " + artist,
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
        let currDiv = `<div class="mt-3 col-lg-4"><a href='/song?artist=${s.artist}&title=${s.title}'><h4>${s.title} - ${s.artist}</h4></a><div><b>Lyrics:</b> ${lyricsTrimmed}</div><div>&#128077; <b>${s.likeCount}</b></div></div>`;
        divs += currDiv;
    }

    const variables = {
        topSongs: divs,
        HTMLTitle: "Top Songs",
    };

    res.render("topsongs", variables);
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

const fetchSongInfo = async (artist, title) => {
    const lyrics = await fetch(`https://api.lyrics.ovh/v1/${artist}/${title}`)
        .then((res) => res.json())
        .then((json) => {
            if (json.error) {
                return "error";
            }
            return processAPIResponse(json.lyrics, artist);
        });

    return lyrics;
};

const processAPIResponse = (response) => {
    // API response (in french!) has the form:
    // Paroles de la chanson <Song Title> par <Artist> \r <Lyrics>
    const songInfoAndLyrics = response.split("\r");
    const titleAndArtist = songInfoAndLyrics[0].replace("Paroles de la chanson ", "");
    const titleAndArtistSplit = titleAndArtist.split(" par");

    const title = titleAndArtistSplit[0].trim();
    const artist = titleAndArtistSplit[1].trim();
    const lyrics = songInfoAndLyrics[1].trim();

    return {
        title: title,
        artist: artist,
        lyrics: lyrics,
    };
};

setUpMongo()
    .catch(console.error)
    .then(() => {
        app.listen(PORT_NUMBER);
        console.log("website live at: http://localhost:" + PORT_NUMBER);
    });

function safeForWork(s) {
    return filter.filter(s);
}

function removeSwears(s) {
    return s.replace(/\*/g, "");
}

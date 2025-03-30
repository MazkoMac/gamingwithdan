const express = require("express");
const log = console.log;
const app = express();
const path = require("path");
const hbs = require("hbs");
const bodyParser = require("body-parser");
const session = require("express-session");
const { request } = require("http");
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.sqlite', sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});



const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.render("index.hbs");
});

app.use(express.static(__dirname + "/style"));
app.use("/style", express.static("style"));

app.use(express.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);


app.set("view engine", "hbs");
hbs.registerPartials(__dirname + "/views/partials");

// Routes for Challenge Pages

app.get("/yearly-challenge-2020", (req, res) => {
  db.all("SELECT * FROM challenge", (err, rows) => {
    if (err) {
      console.error("SQLite error:", err.message);
      res.status(500).send("Database error");
    } else {
      res.render("challenge.hbs", { result: rows });
      console.log(rows);
    }
  });
});


app.get("/yearly-challenge-2021", (req, res) => {
  db.all("SELECT * FROM challenge_2021", (err, rows) => {
    if (err) {
      console.error("SQLite error:", err.message);
      res.status(500).send("Database error");
    } else {
      res.render("challenge_2021.hbs", { result: rows });
      console.log(rows);
    }
  });
});


app.get("/yearly-challenge-2022", (req, res) => {
  db.all("SELECT * FROM challenge_2022", (err, rows) => {
    if (err) {
      console.error("SQLite error:", err.message);
      res.status(500).send("Database error");
    } else {
      res.render("challenge_2022.hbs", { result: rows });
      console.log(rows);
    }
  });
});

app.get("/yearly-challenge-2023", (req, res) => {
  db.all("SELECT * FROM challenge_2023", (err, rows) => {
    if (err) {
      console.error("SQLite error:", err.message);
      res.status(500).send("Database error");
    } else {
      res.render("challenge_2023.hbs", { result: rows });
      console.log(rows);
    }
  });
});

app.get("/yearly-challenge-2024", (req, res) => {
  db.all("SELECT * FROM challenge_2024", (err, rows) => {
    if (err) {
      console.error("SQLite error:", err.message);
      res.status(500).send("Database error");
    } else {
      res.render("challenge_2024.hbs", { result: rows });
      console.log(rows);
    }
  });
});

app.get("/yearly-challenge-2025", (req, res) => {
  db.all("SELECT * FROM challenge_2025", (err, rows) => {
    if (err) {
      console.error("SQLite error:", err.message);
      res.status(500).send("Database error");
    } else {
      res.render("challenge_2025.hbs", { result: rows });
      console.log(rows);
    }
  });
});

// Route for Kaizo Page

app.get("/kaizo-hacks", (req, res) => {
  db.all("SELECT * FROM kaizo", (err, rows) => {
    if (err) {
      console.error("SQLite error:", err.message);
      res.status(500).send("Database error");
    } else {
      res.render("kaizo.hbs", { result: rows });
      console.log(rows);
    }
  });
});


//Route for About Page

app.get("/about", (req, res) => {
  res.render("about.hbs");
});

//Route for Challenge Page


app.get("/challenges", (req, res) => {
  let gamesCount = 0;
  let kaizoCount = 0;

  db.get("SELECT COUNT(*) as gamesCount FROM challenge_2025", (err, row1) => {
    if (err) {
      console.error("SQLite error (challenge_2025):", err.message);
      return res.status(500).send("Database error");
    }

    gamesCount = row1.gamesCount;

    db.get("SELECT COUNT(*) as kaizoCount FROM kaizo", (err, row2) => {
      if (err) {
        console.error("SQLite error (kaizo):", err.message);
        return res.status(500).send("Database error");
      }

      kaizoCount = row2.kaizoCount + 24;

      res.render("challenges.hbs", {
        gamesCount,
        kaizoCount,
      });

      console.log("Kaizo Count:", kaizoCount);
    });
  });
});


//Listening Port

app.listen(PORT, () => console.log(`Server is starting on PORT ${PORT}`));

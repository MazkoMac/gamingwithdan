const express = require("express");
const { engine } = require("express-handlebars")
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const sqlite3 = require('sqlite3').verbose();
const hbs = require("hbs");

const app = express();
const log = console.log;
const PORT = process.env.PORT || 3000;

// SQLite DB connection
const db = new sqlite3.Database('./db.sqlite', sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// View engine setup
app.engine('hbs', engine({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  helpers: {
    eq: (a, b) => a === b
  }
}));

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));
hbs.registerPartials(path.join(__dirname, "views/partials"));


// Static files
app.use(express.static(path.join(__dirname, "style")));
app.use("/style", express.static("style"));

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Root route
app.get("/", (req, res) => {
  res.render("index.hbs");
});


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
      res.render("kaizo.hbs", { result: rows, currentPage: "challenges" });
      console.log(rows);
    }
  });
});


//Route for About Page

app.get("/about", (req, res) => {
  res.render("about", { currentPage: "about" });
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
        currentPage: "challenges"
      });

      console.log("Kaizo Count:", kaizoCount);
    });
  });
});

//Backlog route

app.get("/backlog", (req, res) => {
  res.render("backlog", { currentPage: "backlog" });
});

//Select 5 Games at Random API Route

app.get("/api/backlog/random", (req, res) => {
  const count = parseInt(req.query.count) || 6;
  const query = "SELECT name FROM backlog ORDER BY RANDOM() LIMIT ?";

  db.all(query, [count], (err, rows) => {
    if (err) {
      console.error("SQLite error (backlog):", err.message);
      return res.status(500).json({ error: "Database error" });
    }

    const games = rows.map(row => row.name);
    res.json(games);
  });
});

app.get("/api/backlog/sample", (req, res) => {
  const query = `SELECT name FROM backlog ORDER BY RANDOM() LIMIT 100`;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB error" });
    const games = rows.map(row => row.name);
    res.json(games);
  });
});



//Listening Port

app.listen(PORT, () => console.log(`Server is starting on PORT ${PORT}`));

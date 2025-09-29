const express = require("express");
const { db } = require('./db');
const { engine } = require("express-handlebars");
const path = require("path");
// const bodyParser = require("body-parser");
const session = require("express-session");
// const sqlite3 = require('sqlite3').verbose();
const hbs = require("hbs");

const app = express();
const log = console.log;
const PORT = process.env.PORT || 3000;

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
// app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: true }));

// Root route
app.get("/", (req, res) => {
  res.render("index.hbs", { title: "Home" });
});

// -------- Challenge Pages (read-only) --------

app.get("/yearly-challenge-2020", (req, res, next) => {
  try {
    const rows = db.prepare("SELECT * FROM challenge").all();
    res.render("challenge.hbs", { result: rows, currentPage: "yearly-challenge", activeYear: 2020, title: "2020 Challenge" });
  } catch (err) {
    console.error("SQLite error:", err.message);
    next(err);
  }
});

app.get("/yearly-challenge-2021", (req, res, next) => {
  try {
    const rows = db.prepare("SELECT * FROM challenge_2021").all();
    res.render("challenge_2021.hbs", { result: rows, currentPage: "yearly-challenge", activeYear: 2021, title: "2021 Challenge"  });
  } catch (err) {
    console.error("SQLite error:", err.message);
    next(err);
  }
});

app.get("/yearly-challenge-2022", (req, res, next) => {
  try {
    const rows = db.prepare("SELECT * FROM challenge_2022").all();
    res.render("challenge_2022.hbs", { result: rows, currentPage: "yearly-challenge", activeYear: 2022, title: "2022 Challenge"  });
  } catch (err) {
    console.error("SQLite error:", err.message);
    next(err);
  }
});

app.get("/yearly-challenge-2023", (req, res, next) => {
  try {
    const rows = db.prepare("SELECT * FROM challenge_2023").all();
    res.render("challenge_2023.hbs", { result: rows, currentPage: "yearly-challenge", activeYear: 2023, title: "2023 Challenge"  });
  } catch (err) {
    console.error("SQLite error:", err.message);
    next(err);
  }
});

app.get("/yearly-challenge-2024", (req, res, next) => {
  try {
    const rows = db.prepare("SELECT * FROM challenge_2024").all();
    res.render("challenge_2024.hbs", { result: rows, currentPage: "yearly-challenge", activeYear: 2024, title: "2024 Challenge"  });
  } catch (err) {
    console.error("SQLite error:", err.message);
    next(err);
  }
});

app.get("/yearly-challenge-2025", (req, res, next) => {
  try {
    // Order however you want to *display* the list.
    // If “beaten order” == insert order, id ASC is fine.
    const rows = db.prepare("SELECT * FROM challenge_2025 ORDER BY id ASC").all();

    // Add a sequential display number (1..N) regardless of id gaps
    rows.forEach((row, i) => { row.displayNumber = i + 1; });

    res.render("challenge_2025.hbs", { result: rows, currentPage: "yearly-challenge", activeYear: 2025, title: "2025 Challenge"  });
  } catch (err) {
    console.error("SQLite error:", err.message);
    next(err);
  }
});

// -------- Kaizo Page --------

app.get("/kaizo-hacks", (req, res, next) => {
  try {
    const rows = db.prepare("SELECT * FROM kaizo").all();
    res.render("kaizo.hbs", { result: rows, currentPage: "kaizo-hacks", title: "Kaizo" });
  } catch (err) {
    console.error("SQLite error:", err.message);
    next(err);
  }
});

// -------- About --------

app.get("/about", (req, res) => {
  res.render("about", { currentPage: "about", title: "About" });
});

// -------- Challenges summary (counts) --------

app.get("/challenges", (req, res, next) => {
  try {
    const row1 = db.prepare("SELECT COUNT(*) as gamesCount FROM challenge_2025").get();
    const row2 = db.prepare("SELECT COUNT(*) as kaizoCount FROM kaizo").get();

    const gamesCount = row1?.gamesCount ?? 0;
    const kaizoCount = (row2?.kaizoCount ?? 0) + 24;

    res.render("challenges.hbs", {
      gamesCount,
      kaizoCount,
      currentPage: "challenges",
      title: "Challenges"
    });
  } catch (err) {
    console.error("SQLite error (summary):", err.message);
    next(err);
  }
});

// -------- Backlog --------

app.get("/backlog", (req, res) => {
  res.render("backlog", { currentPage: "backlog", title: "Backlog" });
});

// Select N Games at Random (API)
app.get("/api/backlog/random", (req, res) => {
  const countRaw = parseInt(req.query.count, 10);
  const count = Number.isNaN(countRaw) ? 6 : Math.max(1, Math.min(100, countRaw)); // clamp 1..100
  try {
    const rows = db.prepare("SELECT name FROM backlog ORDER BY RANDOM() LIMIT ?").all(count);
    const games = rows.map(r => r.name);
    res.json(games);
  } catch (err) {
    console.error("SQLite error (backlog/random):", err.message);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/backlog/sample", (req, res) => {
  try {
    const rows = db.prepare("SELECT name FROM backlog ORDER BY RANDOM() LIMIT 100").all();
    const games = rows.map(r => r.name);
    res.json(games);
  } catch (err) {
    console.error("SQLite error (backlog/sample):", err.message);
    res.status(500).json({ error: "Database error" });
  }
});

//------------ADMIN PAGES-------------

// -------- Admin (UI only page) --------
app.get('/admin', (req, res) => {
  res.render('admin/simple', { title: 'Admin' });
});

// -------- Admin save (INSERT) --------
function clean(s) {
  return (s ?? '').toString().trim();
}

app.post('/admin/save', (req, res) => {
  try {
    const name        = clean(req.body.name);
    const image       = clean(req.body.image);
    const difficulty  = clean(req.body.difficulty);
    const platform    = clean(req.body.platform);
    const description = clean(req.body.description);
    let rating        = parseInt(req.body.rating, 10);

    if (!name) {
      return res.status(400).send('Name is required. <a href="/admin">Back</a>');
    }
    if (Number.isNaN(rating)) rating = null;
    if (rating !== null && (rating < 1 || rating > 10)) {
      return res.status(400).send('Rating must be 1–10. <a href="/admin">Back</a>');
    }

    const info = db.prepare(`
      INSERT INTO challenge_2025 (name, rating, description, image, difficulty, platform)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, rating, description, image, difficulty || 'Normal', platform);

    res.status(201).send(`Saved! New id = ${info.lastInsertRowid}. <a href="/admin">Add another</a>`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving row. <a href="/admin">Back</a>');
  }
});

// --- Admin: Backlog (UI) ---
app.get('/admin/backlog', (req, res) => {
  res.render('admin/backlog', { title: 'Add Backlog Game' });
});

// --- Admin: Backlog (INSERT) ---
app.post('/admin/backlog/save', (req, res) => {
  try {
    const clean = (s) => (s ?? '').toString().trim();
    // Optional: collapse inner whitespace so "Super   Mario" == "Super Mario"
    const normalize = (s) => s.replace(/\s+/g, ' ');

    let name = clean(req.body.name);
    if (!name) {
      return res.status(400).send('Name is required. <a href="/admin/backlog">Back</a>');
    }
    name = normalize(name);

    // 🔍 dup check (case-insensitive)
    const dup = db.prepare('SELECT id FROM backlog WHERE name = ? COLLATE NOCASE').get(name);
    if (dup) {
      return res.status(409).send('Game already in backlog. <a href="/admin/backlog">Back</a>');
    }

    const info = db.prepare('INSERT INTO backlog (name) VALUES (?)').run(name);
    res
      .status(201)
      .send(`Saved to backlog! New id = ${info.lastInsertRowid}. <a href="/admin/backlog">Add another</a>`);
  } catch (err) {
    console.error('Backlog insert error:', err);
    res.status(500).send('Error saving backlog entry. <a href="/admin/backlog">Back</a>');
  }
});

// Listening Port
app.listen(PORT, () => console.log(`Server is starting on PORT ${PORT}`));

const express = require("express");
const { db } = require('./db');
const { engine } = require("express-handlebars");
const path = require("path");
const session = require("express-session");
const hbs = require("hbs");

const app = express();
const log = console.log;
const PORT = process.env.PORT || 3000;

const crypto = require('crypto');

// View engine setup
app.engine('hbs', engine({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  helpers: {
    eq: (a, b) => a === b,
    startsWith: (str = '', prefix = '') => str.startsWith(prefix),
    json: (context) => JSON.stringify(context, null, 2)
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
app.use(express.urlencoded({ extended: true }));


// Read creds from env (set these below)
const ADMIN_USER = process.env.ADMIN_USER || 'mazkomac';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Danisafly1!';

// constant-time string compare
function safeEq(a, b) {
  const ab = Buffer.from(a || '');
  const bb = Buffer.from(b || '');
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

const VALID_YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

function getChallengeForYear(year) {
  if (!VALID_YEARS.includes(year)) {
    return [];
  }

  const tableName = year === 2000 ? 'challenge' : `challenge_${year}`;

  try {
    const stmt = db.prepare(`
      SELECT *
      FROM ${tableName}
      ORDER BY id ASC
    `);
    const rows = stmt.all();

    // ✅ assign sequential numbers for display
    const result = rows.map((row, i) => ({
      ...row,
      displayNumber: i + 1
    }));

    return result;
  } catch (err) {
    console.error(`Error reading table ${tableName}:`, err.message);
    return [];
  }
}


function getSetting(key, defaultValue = '0') {
  const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key);
  return row ? row.value : defaultValue;
}

function setSetting(key, value) {
  db.prepare(`
    INSERT INTO app_settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value);
}


// Protect /admin routes (all of them)
function requireBasicAuth(req, res, next) {
  if (!req.path.startsWith('/admin')) return next();

  const header = req.headers.authorization || '';
  const [type, creds] = header.split(' ');
  if (type !== 'Basic' || !creds) {
    res.set('WWW-Authenticate', 'Basic realm="GamingWithDan Admin"');
    return res.status(401).send('Authentication required');
  }

  const [user, pass] = Buffer.from(creds, 'base64').toString().split(':');

  if (safeEq(user, ADMIN_USER) && safeEq(pass, ADMIN_PASS)) {
    return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="GamingWithDan Admin"');
  return res.status(401).send('Access denied');
}

app.use(requireBasicAuth);


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

app.get('/yearly-challenge-:year', (req, res) => {
  const year = Number(req.params.year);

  if (Number.isNaN(year)) {
    return res.status(400).send('Invalid year');
  }

  const result = getChallengeForYear(year);

  res.render('challenge', {
    title: `${year} Challenge`,
    year,
    activeYear: year,
    result,
    currentPage: `/yearly-challenge-${year}`

  });
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

// -------- Challenges summary (counts) --------
app.get("/challenges", (req, res, next) => {
  try {
    console.log("✅ /challenges using challenge_2026");

    const row1 = db.prepare("SELECT COUNT(*) as gamesCount FROM challenge_2026").get();
    const row2 = db.prepare("SELECT COUNT(*) as kaizoCount FROM kaizo").get();

    const gamesCount = row1?.gamesCount ?? 0;
    const kaizoCount = (row2?.kaizoCount ?? 0) + 24;

    // ✅ pull app_settings too
    const rogueliteStreak = getSetting('roguelite_streak', '0');
    const fallGuysCrowns = getSetting('fall_guys_crowns', '0');
    const rocketLeagueRank = getSetting('rocket_league_rank', 'Unranked');

    res.render("challenges.hbs", {
      gamesCount,
      kaizoCount,
      rogueliteStreak,
      fallGuysCrowns,
      rocketLeagueRank,

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
  const count = Number.isNaN(countRaw)
    ? 6
    : Math.max(1, Math.min(100, countRaw)); // clamp 1..100

  try {
    const rows = db.prepare(`
      SELECT id, name, COALESCE(source, '') AS source
      FROM backlog
      ORDER BY RANDOM()
      LIMIT ?
    `).all(count);

    // now we return full objects, not just name strings
    res.json(rows);
  } catch (err) {
    console.error("SQLite error (backlog/random):", err.message);
    res.status(500).json({ error: "Database error" });
  }
});


// --- API: sample backlog names for background ---
app.get('/api/backlog/sample', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT name
      FROM backlog
      ORDER BY RANDOM()
      LIMIT 80
    `).all();

    res.json(rows.map(r => r.name));
  } catch (err) {
    console.error('Error fetching backlog sample:', err);
    res.status(500).json({ error: 'Failed to fetch backlog sample' });
  }
});

//------------ADMIN PAGES-------------

// -------- Admin (UI only page) --------
app.get('/admin', (req, res) => {
  const rogueliteStreak = getSetting('roguelite_streak', '0');
  const fallGuysCrowns = getSetting('fall_guys_crowns', '0');
  const rocketLeagueRank = getSetting('rocket_league_rank', 'Unranked');

  res.render('admin/simple', {
    title: 'Admin',
    rogueliteStreak,
    fallGuysCrowns,
    rocketLeagueRank
  });
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
      INSERT INTO challenge_2026 (name, rating, description, image, difficulty, platform)
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
  // 1) existing backlog list
  const backlogRows = db
    .prepare(`
      SELECT id, name, COALESCE(source, '') AS source
      FROM backlog
      ORDER BY name COLLATE NOCASE
    `)
    .all();

  // 2) pull all challenge tables dynamically (future-proof)
  //    includes: challenge (legacy/2020) and challenge_2021, challenge_2022, etc.
const challengeTables = db
  .prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND (
        name = 'challenge'
        OR name LIKE 'challenge_%'
      )
    ORDER BY name
  `)
  .all()
  .map(r => r.name);


  // 3) build one UNION query across all challenge tables
  //    - we select name
  //    - optional: include a "year" label
  let beatenGames = [];

  if (challengeTables.length) {
    // IMPORTANT: safely quote identifiers (table names) after constraining them above
    const parts = challengeTables.map((t) => {
      const safeTable =
        t === 'challenge' || /^challenge_\d{4}$/.test(t) ? t : null;

      if (!safeTable) return null;

      const yearLabel = (safeTable === 'challenge')
        ? '2020' // your legacy table is used for 2020
        : safeTable.replace('challenge_', '');

      return `
        SELECT
          TRIM(name) AS name,
          '${yearLabel}' AS year
        FROM "${safeTable}"
        WHERE name IS NOT NULL AND TRIM(name) <> ''
      `;
    }).filter(Boolean);

    if (parts.length) {
      const unionSql = `
        SELECT name, year
        FROM (
          ${parts.join('\nUNION ALL\n')}
        )
        GROUP BY name COLLATE NOCASE
        ORDER BY name COLLATE NOCASE
      `;

      beatenGames = db.prepare(unionSql).all();
    }
  }

  res.render('admin/backlog', {
    title: 'Manage Backlog',
    items: backlogRows,
    beatenGames, // <- NEW
  });
});



// --- Admin: Backlog (INSERT) ---
app.post('/admin/backlog/save', (req, res) => {
  try {
    const clean = (s) => (s ?? '').toString().trim();
    const normalize = (s) => s.replace(/\s+/g, ' ');

    // incoming fields
    let name = clean(req.body.name);
    let source = clean(req.body.source); // <- new

    if (!name) {
      return res
        .status(400)
        .send('Name is required. <a href="/admin/backlog">Back</a>');
    }

    name = normalize(name);

    // dup check (case-insensitive)
    const dup = db
      .prepare('SELECT id FROM backlog WHERE name = ? COLLATE NOCASE')
      .get(name);
    if (dup) {
      return res
        .status(409)
        .send('Game already in backlog. <a href="/admin/backlog">Back</a>');
    }

    // insert with source
    const info = db
      .prepare('INSERT INTO backlog (name, source) VALUES (?, ?)')
      .run(name, source || '');

    res
      .status(201)
      .send(
        `Saved to backlog! New id = ${info.lastInsertRowid}. <a href="/admin/backlog">Add another</a>`
      );
    // or: res.redirect('/admin/backlog');
  } catch (err) {
    console.error('Backlog insert error:', err);
    res
      .status(500)
      .send('Error saving backlog entry. <a href="/admin/backlog">Back</a>');
  }
});


// ---Admin : Backlog (DELETE) ---

app.post('/admin/backlog/delete', (req, res) => {
  try {
    const id = parseInt(req.body.id, 10);
    if (!id) {
      return res.status(400).send('ID is required. <a href="/admin/backlog">Back</a>');
    }

    const info = db.prepare('DELETE FROM backlog WHERE id = ?').run(id);
    if (info.changes === 0) {
      return res.status(404).send('No such backlog entry. <a href="/admin/backlog">Back</a>');
    }

    // go back to the list
    res.redirect('/admin/backlog');
  } catch (err) {
    console.error('Backlog delete error:', err);
    res.status(500).send('Error deleting backlog entry. <a href="/admin/backlog">Back</a>');
  }
});

// increment rogue streak
app.post('/admin/roguelite-streak/increment', (req, res) => {
  const current = Number(getSetting('roguelite_streak', '0')) || 0;
  const next = current + 1;
  setSetting('roguelite_streak', String(next));
  res.redirect('/admin'); // or back to the challenges admin page
});

// reset rogue streak
app.post('/admin/roguelite-streak/reset', (req, res) => {
  setSetting('roguelite_streak', '0');
  res.redirect('/admin');
});

// --- Fall Guys crowns: increment ---
app.post('/admin/fall-guys/increment', (req, res) => {
  const current = Number(getSetting('fall_guys_crowns', '0')) || 0;
  const next = current + 1;
  setSetting('fall_guys_crowns', String(next));
  res.redirect('/admin');
});

// --- Fall Guys crowns: set explicit value ---
app.post('/admin/fall-guys/update', (req, res) => {
  const raw = (req.body.crowns || '').toString().trim();
  const num = Number(raw);
  const safe = Number.isFinite(num) && num >= 0 ? Math.floor(num) : 0;
  setSetting('fall_guys_crowns', String(safe));
  res.redirect('/admin');
});

// --- Rocket League rank: free-text update ---
app.post('/admin/rocket-league/update', (req, res) => {
  const rank = (req.body.rank || '').toString().trim() || 'Unranked';
  setSetting('rocket_league_rank', rank);
  res.redirect('/admin');
});


// ---------------------------------------------------
// Admin: Manage challenge tables (2021-2025 + legacy)
// ---------------------------------------------------

// helper: map "2025" -> "challenge_2025", "2000" or "legacy" -> "challenge"
function getChallengeTableFromParam(yearParam) {
  // legacy / original table
  if (yearParam === '2000' || yearParam === 'legacy') {
    return { table: 'challenge', yearLabel: '2000 / Legacy', legacy: true };
  }

  const candidate = `challenge_${yearParam}`;
  // make sure the table actually exists
  const row = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name = ?"
    )
    .get(candidate);

  if (!row) return null;

  return { table: candidate, yearLabel: yearParam, legacy: false };
}

// list all challenge tables
app.get('/admin/challenges', (req, res) => {
  // pull real tables from DB so this stays future-proof
  const rows = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'challenge%' ORDER BY name")
    .all();

  // map to something nicer for the view
  const tables = rows.map((r) => {
    if (r.name === 'challenge') {
      return { year: '2000', table: r.name, label: '2000 / Legacy' };
    }
    // r.name = "challenge_2024" -> "2024"
    const year = r.name.replace('challenge_', '');
    return { year, table: r.name, label: year };
  });

  res.render('admin/challenges', {
    title: 'Manage Challenge Entries',
    tables,
  });
});

// list entries for a given year
app.get('/admin/challenges/:year', (req, res) => {
  const info = getChallengeTableFromParam(req.params.year);
  if (!info) {
    return res.status(404).send('Unknown challenge year/table. <a href="/admin/challenges">Back</a>');
  }

  const rows = db
    .prepare(`SELECT * FROM ${info.table} ORDER BY id DESC`)
    .all();

  res.render('admin/challenges_list', {
    title: `Manage ${info.yearLabel} Challenges`,
    year: req.params.year,
    table: info.table,
    legacy: info.legacy,
    items: rows,
  });
});

// show edit form for a single entry
app.get('/admin/challenges/:year/edit/:id', (req, res) => {
  const info = getChallengeTableFromParam(req.params.year);
  if (!info) {
    return res.status(404).send('Unknown challenge year/table. <a href="/admin/challenges">Back</a>');
  }

  const item = db
    .prepare(`SELECT * FROM ${info.table} WHERE id = ?`)
    .get(req.params.id);

  if (!item) {
    return res.status(404).send('Entry not found. <a href="/admin/challenges">Back</a>');
  }

  res.render('admin/challenge_edit', {
    title: `Edit Challenge (${info.yearLabel})`,
    year: req.params.year,
    table: info.table,
    legacy: info.legacy,
    item,
  });
});

// process edit submit
app.post('/admin/challenges/:year/edit/:id', (req, res) => {
  const info = getChallengeTableFromParam(req.params.year);
  if (!info) {
    return res.status(404).send('Unknown challenge year/table. <a href="/admin/challenges">Back</a>');
  }

  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).send('Bad ID. <a href="/admin/challenges">Back</a>');
  }

  // clean inputs
  const clean = (v) => (v ?? '').toString().trim();
  const name = clean(req.body.name);
  const description = clean(req.body.description);
  const image = clean(req.body.image);
  const rating = clean(req.body.rating);
  const difficulty = clean(req.body.difficulty);
  const platform = clean(req.body.platform);

  if (!name) {
    return res.status(400).send('Name is required. <a href="javascript:history.back()">Back</a>');
  }

  try {
    if (info.legacy) {
      // original `challenge` table (no difficulty/platform)
      db.prepare(
        `UPDATE ${info.table}
         SET name = ?, rating = ?, description = ?, image = ?
         WHERE id = ?`
      ).run(name, rating || null, description || null, image || null, id);
    } else {
      // 2021+ tables
      db.prepare(
        `UPDATE ${info.table}
         SET name = ?, rating = ?, description = ?, image = ?, difficulty = ?, platform = ?
         WHERE id = ?`
      ).run(
        name,
        rating || null,
        description || null,
        image || null,
        difficulty || null,
        platform || null,
        id
      );
    }

    // back to list for that year
    res.redirect(`/admin/challenges/${req.params.year}`);
  } catch (err) {
    console.error('Challenge update error:', err);
    res.status(500).send('Error updating challenge. <a href="/admin/challenges">Back</a>');
  }
});

// optional: delete
app.post('/admin/challenges/:year/delete/:id', (req, res) => {
  const info = getChallengeTableFromParam(req.params.year);
  if (!info) {
    return res.status(404).send('Unknown challenge year/table. <a href="/admin/challenges">Back</a>');
  }

  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).send('Bad ID. <a href="/admin/challenges">Back</a>');
  }

  const result = db.prepare(`DELETE FROM ${info.table} WHERE id = ?`).run(id);
  if (result.changes === 0) {
    return res.status(404).send('Nothing deleted. <a href="/admin/challenges">Back</a>');
  }

  res.redirect(`/admin/challenges/${req.params.year}`);
});


// Listening Port
app.listen(PORT, () => console.log(`Server is starting on PORT ${PORT}`));

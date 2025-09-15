// db.js (CommonJS)
const Database = require('better-sqlite3');
const DB_PATH = process.env.SQLITE_PATH || './db.sqlite'; // local default
const db = new Database(DB_PATH, { fileMustExist: true });
module.exports = { db };

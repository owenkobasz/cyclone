// set up creation of database in this file
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Use a writable data directory in production (Render Disk mounted at /data)
// Falls back to repo-local databases dir for local dev
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'databases');
try {
  fs.mkdirSync(dataDir, { recursive: true });
} catch (e) {
  // ignore if already exists
}
const dbPath = path.join(dataDir, 'users.db');
const dbUsers = new sqlite3.Database(dbPath);

// Initialize database at startup
dbUsers.run(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    firstname TEXT,
    lastname TEXT,
    password TEXT)
    `
);

module.exports = dbUsers;
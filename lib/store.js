// Tiny file-backed JSON store. Mirrors the original project's "no database needed"
// philosophy so the platform still deploys for free on Render/Railway, while giving
// us a structured collection model instead of one opaque blob.
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'drivev.json');

const EMPTY = { users: [], vehicles: [], trips: [], redemptions: [], meta: {} };

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function read() {
  ensureDir();
  try {
    if (!fs.existsSync(DB_FILE)) return { ...EMPTY };
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return { ...EMPTY, ...parsed };
  } catch (e) {
    return { ...EMPTY };
  }
}

function write(db) {
  ensureDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  return db;
}

// Mutate the DB under a single read/write so concurrent requests stay consistent
// for our single-process server.
function update(mutator) {
  const db = read();
  const result = mutator(db);
  write(db);
  return result;
}

function exists() {
  ensureDir();
  return fs.existsSync(DB_FILE);
}

function reset() {
  ensureDir();
  if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
}

module.exports = { read, write, update, exists, reset, DB_FILE };

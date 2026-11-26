// Database layer for the Gallery Notebook.
// Every SQL query the app uses is listed in this file, each with a label.
// The functions hand their results back to the routes in app.js,
// which decide what page to show.

const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// The database is one file in the project folder.
const DB_PATH = path.join(__dirname, 'notebook.db');

// Open the file for reading and writing; create it if it is missing.
// The app cannot do its job without the database, so if the file cannot be
// opened we report the problem and stop, rather than leave pages waiting.
const db = new sqlite3.Database(
  DB_PATH,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) {
      console.error('Could not open the database:', err.message);
      process.exit(1);
    }
  }
);

// Run statements one at a time, in the order they are issued.
db.serialize();

/* ---------- QUERY: create the notes table (runs at startup) ---------- */
// IF NOT EXISTS leaves an existing table and its data untouched.
// rating may be empty, or a whole number from 1 to 5.
db.run(`
  CREATE TABLE IF NOT EXISTS notes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    artwork_id INTEGER NOT NULL,
    title      TEXT    NOT NULL,
    artist     TEXT,
    image_id   TEXT,
    note       TEXT    NOT NULL,
    rating     INTEGER CHECK (rating BETWEEN 1 AND 5),
    created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

/* ---------- Helpers ---------- */
// sqlite3 reports results through callbacks. These three helpers wrap its
// methods in Promises so that routes can use "await".
//   run: INSERT, UPDATE and DELETE
//   all: SELECT that returns many rows
//   get: SELECT that returns one row
// The "?" marks in each query are filled in from the params list. This is a
// parameterized query, which protects against SQL injection.

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        return reject(err);
      }
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

/* ---------- QUERY 1: CREATE - save a new note ---------- */
// entry is an object: { artworkId, title, artist, imageId, note, rating }
// Resolves with { id, changes }, where id is the new note's id.
function createNote(entry) {
  return run(
    `INSERT INTO notes (artwork_id, title, artist, image_id, note, rating)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [entry.artworkId, entry.title, entry.artist, entry.imageId, entry.note, entry.rating]
  );
}

/* ---------- QUERY 2: RETRIEVE - list every note, newest first ---------- */
function getAllNotes() {
  return all(
    `SELECT id, artwork_id, title, artist, image_id, note, rating, created_at
     FROM notes
     ORDER BY created_at DESC, id DESC`
  );
}

/* ---------- QUERY 3: RETRIEVE - fetch one note by its id ---------- */
// Resolves with the row, or undefined when no note has that id.
function getNoteById(id) {
  return get(
    `SELECT id, artwork_id, title, artist, image_id, note, rating, created_at
     FROM notes
     WHERE id = ?`,
    [id]
  );
}

/* ---------- QUERY 4: UPDATE - change a note's text and rating ---------- */
// Resolves with { changes }, which is 1 when the note existed.
function updateNote(id, note, rating) {
  return run(
    `UPDATE notes
     SET note = ?, rating = ?
     WHERE id = ?`,
    [note, rating, id]
  );
}

/* ---------- QUERY 5: DELETE - remove one note ---------- */
function deleteNote(id) {
  return run(`DELETE FROM notes WHERE id = ?`, [id]);
}

/* ---------- QUERY 6: DELETE - remove every note (used by reset-db.js) ---------- */
// Also restarts the id numbering at 1.
async function deleteAllNotes() {
  await run(`DELETE FROM notes`);
  await run(`DELETE FROM sqlite_sequence WHERE name = 'notes'`);
}

// Close the database file. Used by scripts that finish and exit.
function close() {
  return new Promise((resolve, reject) => {
    db.close((err) => (err ? reject(err) : resolve()));
  });
}

module.exports = {
  createNote,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote,
  deleteAllNotes,
  close
};

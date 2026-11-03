'use strict';

const sqlite = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const constants = require('../utils/constants.js');

const DB_DIR = path.join(__dirname, '../database');
const DBSOURCE = path.join(DB_DIR, 'database.db');

// RESET_DB=true recreates the database with the sample data; a missing database is created empty
const resetDb = process.env.RESET_DB === 'true';
const createDb = resetDb || !fs.existsSync(DBSOURCE);

function removeDbFiles() {
    for (const suffix of ['', '-wal', '-shm', '-journal'])
        fs.rmSync(DBSOURCE + suffix, { force: true });
}

if (resetDb)
    removeDbFiles();
if (createDb) {
    // image files are named after the image IDs, which restart from 1 in a new database
    fs.rmSync(constants.IMAGES_DIR, { recursive: true, force: true });
    fs.mkdirSync(constants.IMAGES_DIR, { recursive: true });
}

var sql = 'PRAGMA foreign_keys = ON;';
if (createDb) {
    sql += 'BEGIN;' + fs.readFileSync(path.join(DB_DIR, 'schema.sql'), 'utf8');
    if (resetDb)
        sql += fs.readFileSync(path.join(DB_DIR, 'seed.sql'), 'utf8');
    sql += 'COMMIT;';
}

var db;

// resolved once the database is open and, if needed, created and seeded
const ready = new Promise((resolve, reject) => {
    db = new sqlite.Database(DBSOURCE, (err) => {
        if (err)
            return reject(err);
        db.exec(sql, (err) => {
            if (err && createDb)
                // do not leave a half-created database, otherwise the next start would not create it again
                return db.close(() => { removeDbFiles(); reject(err); });
            if (err)
                return reject(err);
            if (resetDb)
                console.log('Database reset with the sample data');
            else if (createDb)
                console.log('Database created with an empty schema');
            resolve();
        });
    });
});

db.ready = ready;

module.exports = db;

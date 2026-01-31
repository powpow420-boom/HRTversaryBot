import sqlite3 from "sqlite3";

export const db = new sqlite3.Database(
  "./repository/anniversary.db",
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) return console.error(err.message);

    console.log("Connected to the anniversary database.");
  },
);

export function createTable() {
  return new Promise((resolve, reject) => {
    db.run(`CREATE TABLE IF NOT EXISTS anniversaries(
      id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      anniversary_date TEXT NOT NULL,
      timezone TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL)`, (err) => {
        if (err) {
          console.error('Error creating table:', err);
          reject(err);
        } else {
          console.log('✅ Anniversaries table ready');
          resolve();
        }
      });
  });
}

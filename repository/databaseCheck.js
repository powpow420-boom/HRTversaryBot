import sqlite3 from "sqlite3";

const DEFAULT_DATE_FORMAT = 'DD/MM/YYYY';

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
      date_format TEXT DEFAULT '${DEFAULT_DATE_FORMAT}',
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL)`, (err) => {
        if (err) {
          console.error('Error creating table:', err);
          reject(err);
        } else {
          db.all(`PRAGMA table_info(anniversaries)`, [], (pragmaErr, columns) => {
            if (pragmaErr) {
              console.error('Error checking anniversaries schema:', pragmaErr);
              reject(pragmaErr);
              return;
            }

            const hasDateFormatColumn = columns.some((column) => column.name === 'date_format');

            const finalize = () => {
              db.run(
                `UPDATE anniversaries SET date_format = ? WHERE date_format IS NULL OR TRIM(date_format) = ''`,
                [DEFAULT_DATE_FORMAT],
                (updateErr) => {
                  if (updateErr) {
                    console.error('Error applying default date_format:', updateErr);
                    reject(updateErr);
                    return;
                  }

                  console.log('✅ Anniversaries table ready');
                  resolve();
                },
              );
            };

            if (hasDateFormatColumn) {
              finalize();
              return;
            }

            db.run(
              `ALTER TABLE anniversaries ADD COLUMN date_format TEXT DEFAULT '${DEFAULT_DATE_FORMAT}'`,
              (alterErr) => {
                if (alterErr) {
                  console.error('Error adding date_format column:', alterErr);
                  reject(alterErr);
                  return;
                }

                finalize();
              },
            );
          });
        }
      });
  });
}

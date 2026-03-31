import { db } from "./databaseCheck.js";
import { User } from "../models/user.js";

const DEFAULT_DATE_FORMAT = 'DD/MM/YYYY';

export function databaseSave(UserData) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO anniversaries(user_id, anniversary_date, timezone, date_format, guild_id, channel_id) VALUES (?, ?, ?, ?, ?, ?)`;

    db.run(
      sql,
      [
        UserData.userId,
        UserData.anniversaryDate,
        UserData.timezone,
        UserData.dateFormat || DEFAULT_DATE_FORMAT,
        UserData.guildId,
        UserData.channelId,
      ],
      function(err) {
        if (err) {
          console.error(err.message);
          return reject(err);
        }
        console.log("New anniversary data added!");
        resolve(this.lastID);
      },
    );
  });
}

export function getUserAnniversary(userId, guildId){
  const hasGuildId = typeof guildId === 'string' && guildId.length > 0;
  const sql = hasGuildId
    ? `SELECT * FROM anniversaries WHERE user_id = ? AND guild_id = ?`
    : `SELECT * FROM anniversaries WHERE user_id = ? ORDER BY id DESC`;
  const params = hasGuildId ? [userId, guildId] : [userId];

  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error(err.message);
        return reject(err);
      }
      if (row) {
        const user = new User();
        user.id = row.id;
        user.userId = row.user_id;
        user.anniversaryDate = row.anniversary_date;
        user.timezone = row.timezone;
        user.dateFormat = row.date_format || DEFAULT_DATE_FORMAT;
        user.guildId = row.guild_id;
        user.channelId = row.channel_id;
        resolve(user);
      } else {
        resolve(null); 
      }
    });
  });
}

export function getAllAnniversaries() {
  const sql = `SELECT * FROM anniversaries`;

  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error(err.message);
        return reject(err);
      }
      resolve(rows);
    });
  });
}

export function updateUserAnniversary(userId, guildId, anniversaryDate, timezone, dateFormat, channelId) {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE anniversaries SET anniversary_date = ?, timezone = ?, date_format = ?, channel_id = ? WHERE user_id = ? AND guild_id = ?`;

    db.run(
      sql,
      [anniversaryDate, timezone, dateFormat || DEFAULT_DATE_FORMAT, channelId, userId, guildId],
      function(err) {
        if (err) {
          console.error(err.message);
          return reject(err);
        }
        if (this.changes === 0) {
          return reject(new Error('No anniversary found for this user'));
        }
        console.log("Anniversary data updated!");
        resolve(this.changes);
      },
    );
  });
}


import { db } from "./databaseCheck.js";
import { User } from "../models/user.js";

export function databaseSave(UserData) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO anniversaries(user_id, anniversary_date, timezone, guild_id, channel_id) VALUES (?, ?, ?, ?, ?)`;

    db.run(
      sql,
      [UserData.userId, UserData.anniversaryDate, UserData.timezone, UserData.guildId, UserData.channelId],
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

export function databaseGet(userId) {
  const sql = `SELECT * FROM anniversaries`;

  db.all(sql, [], (err, rows) => {
    if (err) return console.error(err.message);

    rows.forEach((element) => {
      console.log(element);
    });
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

export function updateUserAnniversary(userId, guildId, anniversaryDate, timezone, channelId) {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE anniversaries SET anniversary_date = ?, timezone = ?, channel_id = ? WHERE user_id = ? AND guild_id = ?`;

    db.run(
      sql,
      [anniversaryDate, timezone, channelId, userId, guildId],
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

export function getUserTimezone(userId, channelId){
  const sql = 'SELECT * FROM anniversaries WHERE user_id = ? AND channel_id = ?';

  return new Promise((resolve, reject) => {
    db.get(sql, [userId, channelId], (err, row) => {
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
        user.guildId = row.guild_id;
        user.channelId = row.channel_id;
        resolve(user);
      } else {
        resolve(null); 
      }
    });
  });
}
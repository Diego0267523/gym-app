const db = require("../config/db");

exports.getComments = (postId, callback) => {
  const sql = `
    SELECT c.id, c.comment, c.created_at AS time, u.nombre AS user
    FROM comments c
    JOIN usuarios u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `;
  db.query(sql, [postId], (err, rows) => {
    if (err) {
      return callback(err);
    }
    const comments = rows.map((row) => ({
      id: row.id,
      user: row.user,
      comment: row.comment,
      time: row.time,
    }));
    callback(null, comments);
  });
};

exports.addComment = (userId, postId, comment, callback) => {
  const sql = `INSERT INTO comments (user_id, post_id, comment) VALUES (?, ?, ?)`;
  db.query(sql, [userId, postId, comment], (err, result) => {
    if (err) {
      return callback(err);
    }

    const selectSql = `
      SELECT c.id, c.comment, c.created_at AS time, u.nombre AS user
      FROM comments c
      JOIN usuarios u ON c.user_id = u.id
      WHERE c.id = ?
    `;
    db.query(selectSql, [result.insertId], (err, rows) => {
      if (err) {
        return callback(err);
      }
      callback(null, rows[0]);
    });
  });
};
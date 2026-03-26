const db = require("../config/db");

exports.getComments = (postId, callback) => {
  const sql = `
    SELECT c.id, c.comment, c.created_at AS time, u.nombre
    FROM comments c
    JOIN usuarios u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `;
  db.query(sql, [postId], (err, results) => {
    if (err) {
      console.error("Error getting comments", err);
      return callback(err);
    }
    callback(null, results);
  });
};

exports.addComment = (userId, postId, comment, callback) => {
  const sql = `INSERT INTO comments (user_id, post_id, comment) VALUES (?, ?, ?)`;
  db.query(sql, [userId, postId, comment], (err, result) => {
    if (err) {
      console.error("Error adding comment", err);
      return callback(err);
    }

    const selectSql = `
      SELECT c.id, c.comment, c.created_at AS time, u.nombre
      FROM comments c
      JOIN usuarios u ON c.user_id = u.id
      WHERE c.id = ?
    `;

    db.query(selectSql, [result.insertId], (selectErr, rows) => {
      if (selectErr) {
        console.error("Error fetching new comment", selectErr);
        return callback(selectErr);
      }
      callback(null, rows[0]);
    });
  });
};
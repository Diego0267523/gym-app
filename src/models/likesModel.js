const db = require("../config/db");

exports.toggleLike = (userId, postId, callback) => {
  const checkSql = `SELECT * FROM likes WHERE user_id = ? AND post_id = ?`;
  db.query(checkSql, [userId, postId], (err, rows) => {
    if (err) {
      return callback(err);
    }

    if (rows.length > 0) {
      const deleteSql = `DELETE FROM likes WHERE user_id = ? AND post_id = ?`;
      db.query(deleteSql, [userId, postId], (err) => {
        if (err) {
          return callback(err);
        }
        callback(null, { action: "unliked" });
      });
    } else {
      const insertSql = `INSERT INTO likes (user_id, post_id) VALUES (?, ?)`;
      db.query(insertSql, [userId, postId], (err) => {
        if (err) {
          return callback(err);
        }
        callback(null, { action: "liked" });
      });
    }
  });
};

exports.getLikesCount = (postId, callback) => {
  const sql = `SELECT COUNT(*) AS count FROM likes WHERE post_id = ?`;
  db.query(sql, [postId], (err, rows) => {
    if (err) {
      return callback(err);
    }
    callback(null, rows[0]?.count || 0);
  });
};
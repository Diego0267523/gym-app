const db = require("../config/db");

exports.toggleLike = (userId, postId, callback) => {
  const checkSql = `SELECT * FROM likes WHERE user_id = ? AND post_id = ?`;
  db.query(checkSql, [userId, postId], (err, rows) => {
    if (err) {
      console.error("Error checking like", err);
      return callback(err);
    }

    if (rows.length > 0) {
      const deleteSql = `DELETE FROM likes WHERE user_id = ? AND post_id = ?`;
      return db.query(deleteSql, [userId, postId], (deleteErr) => {
        if (deleteErr) {
          console.error("Error deleting like", deleteErr);
          return callback(deleteErr);
        }
        exports.getLikesCount(postId, callback);
      });
    }

    const insertSql = `INSERT INTO likes (user_id, post_id) VALUES (?, ?)`;
    db.query(insertSql, [userId, postId], (insertErr) => {
      if (insertErr) {
        console.error("Error inserting like", insertErr);
        return callback(insertErr);
      }
      exports.getLikesCount(postId, callback);
    });
  });
};

exports.getLikesCount = (postId, callback) => {
  const sql = `SELECT COUNT(*) AS count FROM likes WHERE post_id = ?`;
  db.query(sql, [postId], (err, results) => {
    if (err) {
      console.error("Error getting likes count", err);
      return callback(err);
    }
    const count = results[0]?.count || 0;
    callback(null, count);
  });
};
const db = require("../config/db");

exports.createPost = (user_id, image_url, caption, callback) => {
  const sql = `
    INSERT INTO posts (user_id, image_url, caption)
    VALUES (?, ?, ?)
  `;
  db.query(sql, [user_id, image_url, caption], callback);
};

exports.getPosts = (limit, offset, callback) => {
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
  const safeOffset = Number.isInteger(offset) && offset >= 0 ? offset : 0;
  const sql = `
    SELECT p.id, p.image_url, p.caption, p.created_at AS time, u.nombre, u.avatar AS avatar
    FROM posts p
    JOIN usuarios u ON p.user_id = u.id
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `;
  db.query(sql, [safeLimit, safeOffset], callback);
};

exports.getPostById = (postId, callback) => {
  const sql = `SELECT * FROM posts WHERE id = ?`;
  db.query(sql, [postId], (err, rows) => {
    if (err) {
      return callback(err);
    }
    callback(null, rows[0]);
  });
};
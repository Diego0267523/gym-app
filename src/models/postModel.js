const db = require("../config/db");

exports.createPost = (user_id, image_url, caption, callback) => {
  const sql = `
    INSERT INTO posts (user_id, image_url, caption)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [user_id, image_url, caption], callback);
};

exports.getPosts = (offset, limit, callback) => {
  const sql = `
    SELECT posts.*, users.nombre
    FROM posts
    JOIN users ON users.id = posts.user_id
    ORDER BY posts.created_at DESC
    LIMIT ? OFFSET ?
  `;

  db.query(sql, [limit, offset], callback);
};
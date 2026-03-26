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
    SELECT p.id, p.image_url, p.caption, p.created_at AS time, u.nombre
    FROM posts p
    JOIN usuarios u ON p.user_id = u.id
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `;

  console.log("Executing getPosts query:", sql, "Params:", [limit, offset]);
  db.query(sql, [limit, offset], (err, results) => {
    if (err) {
      console.error("DB Error in getPosts:", err);
      return callback(err);
    }
    console.log("DB Results:", results?.length || 0, "rows");
    callback(null, results);
  });
};
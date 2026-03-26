const db = require("../config/db");

exports.createPost = async (user_id, image_url, caption) => {
  const sql = `
    INSERT INTO posts (user_id, image_url, caption)
    VALUES (?, ?, ?)
  `;
  const [result] = await db.execute(sql, [user_id, image_url, caption]);
  return result;
};

exports.getPosts = async (limit, offset) => {
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
  const safeOffset = Number.isInteger(offset) && offset >= 0 ? offset : 0;
  const sql = `
    SELECT p.id, p.image_url, p.caption, p.created_at AS time, u.nombre
    FROM posts p
    JOIN usuarios u ON p.user_id = u.id
    ORDER BY p.created_at DESC
    LIMIT ${safeLimit} OFFSET ${safeOffset}
  `;
  const [rows] = await db.execute(sql);
  return rows;
};

exports.getPostById = async (postId) => {
  const sql = `SELECT * FROM posts WHERE id = ?`;
  const [rows] = await db.execute(sql, [postId]);
  return rows[0];
};
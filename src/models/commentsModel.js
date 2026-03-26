const db = require("../config/db");

exports.getComments = async (postId) => {
  const sql = `
    SELECT c.id, c.comment, c.created_at AS time, u.nombre AS user
    FROM comments c
    JOIN usuarios u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `;
  const [rows] = await db.execute(sql, [postId]);
  return rows.map((row) => ({
    id: row.id,
    user: row.user,
    comment: row.comment,
    time: row.time,
  }));
};

exports.addComment = async (userId, postId, comment) => {
  const sql = `INSERT INTO comments (user_id, post_id, comment) VALUES (?, ?, ?)`;
  const [result] = await db.execute(sql, [userId, postId, comment]);

  const selectSql = `
    SELECT c.id, c.comment, c.created_at AS time, u.nombre AS user
    FROM comments c
    JOIN usuarios u ON c.user_id = u.id
    WHERE c.id = ?
  `;
  const [rows] = await db.execute(selectSql, [result.insertId]);
  return rows[0];
};
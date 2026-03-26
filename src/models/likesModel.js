const db = require("../config/db");

exports.toggleLike = async (userId, postId) => {
  const checkSql = `SELECT * FROM likes WHERE user_id = ? AND post_id = ?`;
  const [rows] = await db.execute(checkSql, [userId, postId]);

  if (rows.length > 0) {
    const deleteSql = `DELETE FROM likes WHERE user_id = ? AND post_id = ?`;
    await db.execute(deleteSql, [userId, postId]);
    return { action: "unliked" };
  }

  const insertSql = `INSERT INTO likes (user_id, post_id) VALUES (?, ?)`;
  await db.execute(insertSql, [userId, postId]);
  return { action: "liked" };
};

exports.getLikesCount = async (postId) => {
  const sql = `SELECT COUNT(*) AS count FROM likes WHERE post_id = ?`;
  const [rows] = await db.execute(sql, [postId]);
  return rows[0]?.count || 0;
};
const db = require("../config/db");

exports.getComments = (postId, callback) => {
  const sql = `
    SELECT c.id, c.comment, c.created_at AS time, u.nombre AS user, u.avatar
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
      avatar: row.avatar,
      comment: row.comment,
      time: row.time,
    }));
    callback(null, comments);
  });
};

exports.getCommentsCount = (postId, callback) => {
  const sql = `SELECT COUNT(*) AS count FROM comments WHERE post_id = ?`;
  db.query(sql, [postId], (err, rows) => {
    if (err) {
      return callback(err);
    }
    callback(null, rows[0]?.count || 0);
  });
};

exports.addComment = (userId, postId, comment, callback) => {
  const sql = `INSERT INTO comments (user_id, post_id, comment) VALUES (?, ?, ?)`;
  db.query(sql, [userId, postId, comment], (err, result) => {
    if (err) {
      return callback(err);
    }

    // 🔥 CREAR NOTIFICACIÓN PARA EL DUEÑO DEL POST
    createCommentNotification(userId, postId, result.insertId, comment, (notifErr) => {
      if (notifErr) {
        console.error("Error creando notificación de comentario:", notifErr);
      }
    });

    const selectSql = `
      SELECT c.id, c.comment, c.created_at AS time, u.nombre AS user, u.avatar
      FROM comments c
      JOIN usuarios u ON c.user_id = u.id
      WHERE c.id = ?
    `;
    db.query(selectSql, [result.insertId], (err, rows) => {
      if (err) {
        return callback(err);
      }
      callback(null, {
        id: rows[0].id,
        user: rows[0].user,
        avatar: rows[0].avatar,
        comment: rows[0].comment,
        time: rows[0].time,
      });
    });
  });
};

exports.deleteCommentsByPostId = (postId, callback) => {
  const sql = `DELETE FROM comments WHERE post_id = ?`;
  db.query(sql, [postId], callback);
};

// 🔥 Función auxiliar para crear notificación de comentario
const createCommentNotification = (fromUserId, postId, commentId, commentText, callback) => {
  // Obtener el dueño del post
  const getPostOwnerSql = `SELECT user_id FROM posts WHERE id = ?`;
  db.query(getPostOwnerSql, [postId], (err, rows) => {
    if (err || rows.length === 0) {
      return callback(err);
    }

    const postOwnerId = rows[0].user_id;

    // No crear notificación si el usuario se comenta a sí mismo
    if (fromUserId === postOwnerId) {
      return callback(null);
    }

    // Obtener nombre del usuario que comentó
    const getUserNameSql = `SELECT nombre FROM usuarios WHERE id = ?`;
    db.query(getUserNameSql, [fromUserId], (err, userRows) => {
      if (err || userRows.length === 0) {
        return callback(err);
      }

      const userName = userRows[0].nombre;
      // Limitar el comentario a 50 caracteres para la notificación
      const shortComment = commentText.length > 50 ? commentText.substring(0, 47) + "..." : commentText;
      const message = `${userName} comentó: "${shortComment}"`;

      const insertNotifSql = `
        INSERT INTO notificaciones (user_id, from_user_id, type, post_id, comment_id, message)
        VALUES (?, ?, 'comment', ?, ?, ?)
      `;
      db.query(insertNotifSql, [postOwnerId, fromUserId, postId, commentId, message], callback);
    });
  });
};
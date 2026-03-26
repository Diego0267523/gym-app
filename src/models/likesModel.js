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

        // 🔥 CREAR NOTIFICACIÓN PARA EL DUEÑO DEL POST
        createLikeNotification(userId, postId, (notifErr) => {
          if (notifErr) {
            console.error("Error creando notificación de like:", notifErr);
          }
        });

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

// 🔥 Función auxiliar para crear notificación de like
const createLikeNotification = (fromUserId, postId, callback) => {
  // Obtener el dueño del post
  const getPostOwnerSql = `SELECT user_id FROM posts WHERE id = ?`;
  db.query(getPostOwnerSql, [postId], (err, rows) => {
    if (err || rows.length === 0) {
      return callback(err);
    }

    const postOwnerId = rows[0].user_id;

    // No crear notificación si el usuario se da like a sí mismo
    if (fromUserId === postOwnerId) {
      return callback(null);
    }

    // Obtener nombre del usuario que dio like
    const getUserNameSql = `SELECT nombre FROM usuarios WHERE id = ?`;
    db.query(getUserNameSql, [fromUserId], (err, userRows) => {
      if (err || userRows.length === 0) {
        return callback(err);
      }

      const userName = userRows[0].nombre;
      const message = `${userName} le dio like a tu publicación`;

      const insertNotifSql = `
        INSERT INTO notificaciones (user_id, from_user_id, type, post_id, message)
        VALUES (?, ?, 'like', ?, ?)
      `;
      db.query(insertNotifSql, [postOwnerId, fromUserId, postId, message], callback);
    });
  });
};
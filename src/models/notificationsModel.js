const db = require("../config/db");

// Obtener notificaciones de un usuario
exports.getNotifications = (userId, callback) => {
  const sql = `
    SELECT
      n.id,
      n.type,
      n.message,
      n.is_read,
      n.created_at,
      u.nombre AS from_user_name,
      u.avatar AS from_user_avatar,
      n.post_id,
      n.comment_id
    FROM notificaciones n
    JOIN usuarios u ON n.from_user_id = u.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT 50
  `;
  db.query(sql, [userId], (err, rows) => {
    if (err) {
      return callback(err);
    }
    callback(null, rows);
  });
};

// Marcar notificación como leída
exports.markAsRead = (notificationId, userId, callback) => {
  const sql = `UPDATE notificaciones SET is_read = TRUE WHERE id = ? AND user_id = ?`;
  db.query(sql, [notificationId, userId], callback);
};

// Obtener conteo de notificaciones no leídas
exports.getUnreadCount = (userId, callback) => {
  const sql = `SELECT COUNT(*) AS count FROM notificaciones WHERE user_id = ? AND is_read = FALSE`;
  db.query(sql, [userId], (err, rows) => {
    if (err) {
      return callback(err);
    }
    callback(null, rows[0]?.count || 0);
  });
};

// Marcar todas las notificaciones como leídas
exports.markAllAsRead = (userId, callback) => {
  const sql = `UPDATE notificaciones SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE`;
  db.query(sql, [userId], callback);
};
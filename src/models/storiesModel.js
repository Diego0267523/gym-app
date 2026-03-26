const db = require("../config/db");

// Crear una historia
exports.createStory = (user_id, image_url, callback) => {
  const sql = `
    INSERT INTO stories (user_id, image_url, created_at)
    VALUES (?, ?, NOW())
  `;
  db.query(sql, [user_id, image_url], callback);
};

// Obtener todas las historias (máximo 24 horas)
exports.getStories = (callback) => {
  const sql = `
    SELECT s.id, s.user_id, s.image_url, s.created_at AS time, u.nombre
    FROM stories s
    JOIN usuarios u ON s.user_id = u.id
    WHERE s.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    ORDER BY s.created_at DESC
  `;
  db.query(sql, callback);
};

// Obtener historias de un usuario específico
exports.getUserStories = (user_id, callback) => {
  const sql = `
    SELECT s.id, s.user_id, s.image_url, s.created_at AS time, u.nombre
    FROM stories s
    JOIN usuarios u ON s.user_id = u.id
    WHERE s.user_id = ? AND s.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    ORDER BY s.created_at DESC
  `;
  db.query(sql, [user_id], callback);
};

// Eliminar historias viejas (> 24 horas) - ejecutar periódicamente
exports.deleteOldStories = (callback) => {
  const sql = `
    DELETE FROM stories 
    WHERE created_at <= DATE_SUB(NOW(), INTERVAL 24 HOUR)
  `;
  db.query(sql, callback);
};

// Obtener una historia por ID
exports.getStoryById = (storyId, callback) => {
  const sql = `SELECT * FROM stories WHERE id = ?`;
  db.query(sql, [storyId], (err, rows) => {
    if (err) {
      return callback(err);
    }
    callback(null, rows[0]);
  });
};

// Eliminar una historia por ID
exports.deleteStory = (storyId, callback) => {
  const sql = `DELETE FROM stories WHERE id = ?`;
  db.query(sql, [storyId], callback);
};

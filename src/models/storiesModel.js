const db = require("../config/db");

// Crear una historia
exports.createStory = async (user_id, image_url) => {
  const sql = `
    INSERT INTO stories (user_id, image_url, created_at)
    VALUES (?, ?, NOW())
  `;
  const [result] = await db.execute(sql, [user_id, image_url]);
  return result;
};

// Obtener todas las historias (máximo 24 horas)
exports.getStories = async () => {
  const sql = `
    SELECT s.id, s.user_id, s.image_url, s.created_at AS time, u.nombre
    FROM stories s
    JOIN usuarios u ON s.user_id = u.id
    WHERE s.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    ORDER BY s.created_at DESC
  `;
  const [rows] = await db.execute(sql);
  return rows;
};

// Obtener historias de un usuario específico
exports.getUserStories = async (user_id) => {
  const sql = `
    SELECT s.id, s.user_id, s.image_url, s.created_at AS time, u.nombre
    FROM stories s
    JOIN usuarios u ON s.user_id = u.id
    WHERE s.user_id = ? AND s.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    ORDER BY s.created_at DESC
  `;
  const [rows] = await db.execute(sql, [user_id]);
  return rows;
};

// Eliminar historias viejas (> 24 horas) - ejecutar periódicamente
exports.deleteOldStories = async () => {
  const sql = `
    DELETE FROM stories 
    WHERE created_at <= DATE_SUB(NOW(), INTERVAL 24 HOUR)
  `;
  const [result] = await db.execute(sql);
  return result;
};

// Obtener una historia por ID
exports.getStoryById = async (storyId) => {
  const sql = `SELECT * FROM stories WHERE id = ?`;
  const [rows] = await db.execute(sql, [storyId]);
  return rows[0];
};

// Eliminar una historia por ID
exports.deleteStory = async (storyId) => {
  const sql = `DELETE FROM stories WHERE id = ?`;
  const [result] = await db.execute(sql, [storyId]);
  return result;
};

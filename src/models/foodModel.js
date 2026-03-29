const db = require("../config/db");

// ==========================
// 🍽️ ENTRADAS DE COMIDA
// ==========================

// Crear entrada de comida
const createFoodEntry = (entry, callback) => {
    const sql = `
        INSERT INTO food_entries (user_id, fecha, descripcion, calorias, proteina, carbohidratos, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        entry.user_id,
        entry.fecha || new Date(),  // 🔥 Cambio: Guardar como DATETIME (UTC), no como string DATE
        entry.descripcion,
        entry.calorias || 0,
        entry.proteina || 0,
        entry.carbohidratos || 0,
        entry.image_url
    ];
    db.query(sql, values, callback);
};

// Crear múltiples entradas de comida (bulk)
const createFoodEntriesBulk = (entries, callback) => {
    if (!entries || entries.length === 0) {
        return callback(null, { affectedRows: 0, insertId: null });
    }

    const placeholders = entries.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
    const values = [];

    entries.forEach(entry => {
      values.push(
        entry.user_id,
        entry.fecha || new Date().toISOString().split('T')[0],
        entry.descripcion,
        entry.calorias || 0,
        entry.proteina || 0,
        entry.carbohidratos || 0,
        entry.image_url || null
      );
    });

    const sql = `
        INSERT INTO food_entries (user_id, fecha, descripcion, calorias, proteina, carbohidratos, image_url)
        VALUES ${placeholders}
    `;

    db.query(sql, values, callback);
};

// Obtener entradas de comida por usuario y fecha (día específico)
const getFoodEntriesByUserAndDate = (userId, fecha, callback) => {
    const sql = `
        SELECT id, descripcion, calorias, proteina, carbohidratos, image_url, created_at
        FROM food_entries
        WHERE user_id = ? AND fecha = ?
        ORDER BY created_at DESC
    `;
    db.query(sql, [userId, fecha], callback);
};

// Obtener todas las entradas de comida de un usuario (últimos 30 días)
const getFoodEntriesByUser = (userId, callback) => {
    const sql = `
        SELECT id, fecha, descripcion, calorias, proteina, carbohidratos, image_url, created_at
        FROM food_entries
        WHERE user_id = ? AND fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ORDER BY fecha DESC, created_at DESC
    `;
    db.query(sql, [userId], callback);
};

// Eliminar entrada de comida
const deleteFoodEntry = (entryId, userId, callback) => {
    const sql = `
        DELETE FROM food_entries
        WHERE id = ? AND user_id = ?
    `;
    db.query(sql, [entryId, userId], callback);
};

// Obtener totales diarios por usuario y fecha
const getDailyTotals = (userId, fecha, callback) => {
    const sql = `
        SELECT
            SUM(calorias) AS total_calorias,
            SUM(proteina) AS total_proteina,
            SUM(carbohidratos) AS total_carbohidratos
        FROM food_entries
        WHERE user_id = ? AND fecha = ?
    `;
    db.query(sql, [userId, fecha], callback);
};

// Obtener totales de calorías de la semana actual (con timezone local)
const getWeeklyTotals = (userId, callback) => {
    const sql = `
        SELECT 
            DATE(CONVERT_TZ(created_at, '+00:00', '-05:00')) AS fecha_local,
            COALESCE(SUM(calorias), 0) AS total_calorias
        FROM food_entries
        WHERE user_id = ?
        AND created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)
        GROUP BY fecha_local
        ORDER BY fecha_local ASC
    `;
    db.query(sql, [userId], callback);
};

module.exports = {
    createFoodEntry,
    createFoodEntriesBulk,
    getFoodEntriesByUserAndDate,
    getFoodEntriesByUser,
    deleteFoodEntry,
    getDailyTotals,
    getWeeklyTotals
};
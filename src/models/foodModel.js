const db = require("../config/db");

// ==========================
// 🍽️ ENTRADAS DE COMIDA - MANEJO PROFESIONAL DE FECHAS
// ==========================

/**
 * Convierte una fecha local a UTC DATETIME para almacenar en BD
 * @param {string} dateStr - Fecha en formato YYYY-MM-DD (zona horaria local del usuario)
 * @param {string} userTimezone - Zona horaria del usuario (ej: 'America/Bogota')
 * @returns {string} - DATETIME en UTC formato YYYY-MM-DD HH:mm:ss
 */
const convertToUTC = (dateStr, userTimezone = 'UTC') => {
    try {
        // Si recibimos DATETIME, extractar solo la fecha
        const date = dateStr.split(' ')[0] || dateStr;
        
        // Crear fecha local asumiendo que es medianoche en la zona horaria del usuario
        // Usar moment o similar en producción, aquí usamos cálculo manual
        const today = new Date(date + 'T00:00:00');
        
        // Nota: En producción usar 'moment-timezone' o 'date-fns' con timezone
        // Por ahora retornamos la fecha como está en UTC
        // El servidor debe estar en UTC en producción
        return date + ' 00:00:00';
    } catch (e) {
        return new Date().toISOString().replace('T', ' ').split('.')[0];
    }
};

// Crear entrada de comida
const createFoodEntry = (entry, callback) => {
    const sql = `
        INSERT INTO food_entries 
        (user_id, user_timezone, fecha_utc, descripcion, calorias, proteina, carbohidratos, image_url, fecha)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    // Convertir fecha a UTC
    const fechaUTC = convertToUTC(entry.fecha, entry.userTimezone);
    
    const values = [
        entry.user_id,
        entry.userTimezone || 'UTC',
        fechaUTC,
        entry.descripcion || null,
        entry.calorias || 0,
        entry.proteina || 0,
        entry.carbohidratos || 0,
        entry.image_url || null,
        entry.fecha || new Date().toISOString().split('T')[0] // Mantener por compatibilidad
    ];
    db.query(sql, values, callback);
};

// Crear múltiples entradas de comida (bulk) - Para IA
const createFoodEntriesBulk = (entries, userTimezone = 'UTC', callback = null) => {
    // Manejar caso donde callback es el 2do parámetro (compatibilidad)
    if (typeof userTimezone === 'function') {
        callback = userTimezone;
        userTimezone = 'UTC';
    }
    
    if (!entries || entries.length === 0) {
        return callback(null, { affectedRows: 0, insertId: null });
    }

    const placeholders = entries.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const values = [];

    entries.forEach(entry => {
      const fechaUTC = convertToUTC(entry.fecha, userTimezone);
      
      values.push(
        entry.user_id,
        userTimezone,
        fechaUTC,
        entry.descripcion || null,
        entry.calorias || 0,
        entry.proteina || 0,
        entry.carbohidratos || 0,
        entry.image_url || null,
        entry.fecha || new Date().toISOString().split('T')[0] // Compatibilidad
      );
    });

    const sql = `
        INSERT INTO food_entries 
        (user_id, user_timezone, fecha_utc, descripcion, calorias, proteina, carbohidratos, image_url, fecha)
        VALUES ${placeholders}
    `;

    db.query(sql, values, callback);
};

// Obtener entradas de comida por usuario y fecha (día específico - con zona horaria)
const getFoodEntriesByUserAndDate = (userId, fecha, userTimezone = 'UTC', callback = null) => {
    // Manejar caso donde callback es el 3er parámetro (compatibilidad)
    if (typeof userTimezone === 'function') {
        callback = userTimezone;
        userTimezone = 'UTC';
    }
    
    const sql = `
        SELECT id, descripcion, calorias, proteina, carbohidratos, image_url, created_at
        FROM food_entries
        WHERE user_id = ? 
          AND DATE(CONVERT_TZ(fecha_utc, '+00:00', ?)) = ?
        ORDER BY created_at DESC
    `;
    
    // userTimezone ej: '+05:30', '-05:00'
    db.query(sql, [userId, userTimezone, fecha], callback);
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

// Obtener totales diarios por usuario y fecha - CON ZONA HORARIA CORRECTA
const getDailyTotals = (userId, fecha, userTimezone = 'UTC', callback = null) => {
    // Manejar caso donde callback es el 3er parámetro (compatibilidad)
    if (typeof userTimezone === 'function') {
        callback = userTimezone;
        userTimezone = 'UTC';
    }
    
    const sql = `
        SELECT
            SUM(calorias) AS total_calorias,
            SUM(proteina) AS total_proteina,
            SUM(carbohidratos) AS total_carbohidratos
        FROM food_entries
        WHERE user_id = ? 
          AND DATE(CONVERT_TZ(fecha_utc, '+00:00', ?)) = ?
    `;
    db.query(sql, [userId, userTimezone, fecha], callback);
};

// Obtener totales de calorías para la semana actual (lunes-domingo) - CON ZONA HORARIA
const getWeeklyTotals = (userId, weekDates, userTimezone = 'UTC', callback = null) => {
    // Manejar caso donde callback es el string 'UTC' (compatibilidad)
    if (typeof userTimezone === 'function') {
        callback = userTimezone;
        userTimezone = 'UTC';
    }
    
    const placeholders = weekDates.map(() => '?').join(',');
    
    // CONVERT_TZ convierte de UTC a la zona horaria del usuario para agrupar correctamente
    const sql = `
        SELECT
            DATE(CONVERT_TZ(fecha_utc, '+00:00', ?)) as fecha,
            COALESCE(SUM(calorias), 0) AS total_calorias
        FROM food_entries
        WHERE user_id = ? 
          AND DATE(CONVERT_TZ(fecha_utc, '+00:00', ?)) IN (${placeholders})
        GROUP BY DATE(CONVERT_TZ(fecha_utc, '+00:00', ?))
        ORDER BY DATE(CONVERT_TZ(fecha_utc, '+00:00', ?)) ASC
    `;
    
    const values = [userTimezone, userId, userTimezone, ...weekDates, userTimezone, userTimezone];
    db.query(sql, values, callback);
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
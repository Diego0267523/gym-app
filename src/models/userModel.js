const db = require("../config/db");

// Crear usuario
const createUser = (user, callback) => {
    const sql = "INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)";
    db.query(sql, [user.nombre, user.email, user.password], callback);
};

// Buscar usuario
const findUserByEmail = (email, callback) => {
    const sql = "SELECT * FROM usuarios WHERE email = ?";
    db.query(sql, [email], callback);
};

// 🔥 Guardar medidas (FIXED)
const saveMeasurements = (userId, measurements, callback) => {
    const sql = `
        INSERT INTO medidas (user_id, peso, altura) 
        VALUES (?, ?, ?)
    `;
    db.query(sql, [userId, measurements.peso, measurements.altura], callback);
};

// Obtener medidas
const getMeasurementsByUserId = (userId, callback) => {
    const sql = `
        SELECT * FROM medidas 
        WHERE user_id = ? 
        ORDER BY created_at DESC
    `;
    db.query(sql, [userId], callback);
};

// 🔥 EXPORTAR TODO (TE FALTABA ESTO)
module.exports = {
    createUser,
    findUserByEmail,
    saveMeasurements,
    getMeasurementsByUserId
};
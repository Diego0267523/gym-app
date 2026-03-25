const db = require("../config/db");

// ==========================
// 👤 USUARIO
// ==========================

// Crear usuario
const createUser = (user, callback) => {
    const sql = `
        INSERT INTO usuarios (nombre, email, password) 
        VALUES (?, ?, ?)
    `;
    db.query(sql, [user.nombre, user.email, user.password], callback);
};

// Buscar usuario por email
const findUserByEmail = (email, callback) => {
    const sql = `
        SELECT * FROM usuarios 
        WHERE email = ?
    `;
    db.query(sql, [email], callback);
};


// ==========================
// 📏 MEDIDAS
// ==========================

const saveMeasurements = (userId, measurements, callback) => {
    const sql = `
        INSERT INTO medidas (user_id, peso, altura) 
        VALUES (?, ?, ?)
    `;
    db.query(sql, [
        userId,
        measurements.peso || null,
        measurements.altura || null
    ], callback);
};

const getMeasurementsByUserId = (userId, callback) => {
    const sql = `
        SELECT * FROM medidas 
        WHERE user_id = ? 
        ORDER BY created_at DESC
    `;
    db.query(sql, [userId], callback);
};


// ==========================
// 🎯 PERFIL FITNESS
// ==========================

const saveProfile = (userId, data, callback) => {
    const sql = `
        INSERT INTO perfil 
        (user_id, genero, objetivo, frecuencia, nivel_actividad, tiempo_objetivo, profesion, sueno)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(sql, [
        userId,
        data.genero || null,
        data.objetivo || null,
        data.frecuencia || null,
        data.nivelActividad || null,
        data.tiempoObjetivo || null,
        data.profesion || null,
        data.sueno || null
    ], callback);
};


// ==========================
// 🏥 SALUD
// ==========================

const saveHealth = (userId, data, callback) => {
    const sql = `
        INSERT INTO salud 
        (user_id, condiciones, medicamentos, lesiones, restricciones)
        VALUES (?, ?, ?, ?, ?)
    `;
    db.query(sql, [
        userId,
        data.condiciones || null,
        data.medicamentos || null,
        data.lesiones || null,
        data.restricciones || null
    ], callback);
};


// ==========================
// 🚀 EXPORTS
// ==========================

module.exports = {
    createUser,
    findUserByEmail,
    saveMeasurements,
    getMeasurementsByUserId,
    saveProfile,
    saveHealth
};
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

const getFullProfileById = (userId, callback) => {
    const sql = `
        SELECT 
            u.id,
            u.nombre,
            u.email,
            p.objetivo,
            p.nivel_actividad AS nivelActividad,
            m.peso,
            m.altura
        FROM usuarios u
        LEFT JOIN perfil p ON u.id = p.user_id
        LEFT JOIN medidas m ON u.id = m.user_id
        WHERE u.id = ?
        ORDER BY m.created_at DESC
        LIMIT 1
    `;

    db.query(sql, [userId], callback);
};

// Buscar usuario por email
const findUserByEmail = (email, callback) => {
    const sql = `
        SELECT * FROM usuarios 
        WHERE email = ?
    `;
    db.query(sql, [email], callback);
};
// Buscar usuario por ID
const findUserById = (id, callback) => {
    const sql = `
        SELECT id, nombre, email 
        FROM usuarios 
        WHERE id = ?
    `;
    db.query(sql, [id], callback);
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
    findUserById,
    getFullProfileById, // 🔥 AÑADE ESTO
    saveMeasurements,
    getMeasurementsByUserId,
    saveProfile,
    saveHealth
};
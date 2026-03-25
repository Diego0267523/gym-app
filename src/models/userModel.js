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

// Guardar medidas
const saveMeasurements = (userId, measurements, callback) => {
    const sql = "INSERT INTO medidas (user_id, peso, altura, ) VALUES (?, ?, ?)";
    db.query(sql, [userId, measurements.peso, measurements.altura], callback);
};

// obtener todas las medidas en ordend e un usuario
const getMeasurementsByUserId = (userId, callback) => {
    const sql = "SELECT * FROM medidas WHERE user_id = ? ORDER BY created_at DESC";
    db.query(sql, [userId], callback);
};


// 👇 MUY IMPORTANTE
module.exports = {
    createUser,
    findUserByEmail
};
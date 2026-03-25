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

// 👇 MUY IMPORTANTE
module.exports = {
    createUser,
    findUserByEmail
};
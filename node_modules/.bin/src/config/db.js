require("dotenv").config();
const mysql = require("mysql2");

// 👇 POOL DE CONEXIONES (LA SOLUCIÓN)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,

    waitForConnections: true,
    connectionLimit: 5, // 🔥 importante para Clever Cloud
    queueLimit: 0
});

// Mensaje opcional de conexión
pool.getConnection((err, connection) => {
    if (err) {
        console.log("❌ Error de conexión:", err);
    } else {
        console.log("✅ Conectado a Clever Cloud (POOL)");
        connection.release(); // 👈 libera la conexión
    }
});

module.exports = pool;
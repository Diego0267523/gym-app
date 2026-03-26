require("dotenv").config();
const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  port: process.env.DB_PORT || 3306,
});

// Nota: No intentamos levantamiento inmediato de conexión para evitar consumir
// conexiones de más en entornos con límite estricto (max_user_connections).
// Las consultas gestionarán automáticamente la conexión por pedido.

console.log("✅ DB pool configurado");

module.exports = pool;
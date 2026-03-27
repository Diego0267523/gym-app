require("dotenv").config();
const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 1, // 🔥 Más conservador
  queueLimit: 0,
  port: process.env.DB_PORT || 3306,
  connectTimeout: 10000,
});

// Nota: No intentamos levantamiento inmediato de conexión para evitar consumir
// conexiones de más en entornos con límite estricto (max_user_connections).
// Las consultas gestionarán automáticamente la conexión por pedido.

pool.on('acquire', () => console.log('🔌 DB connection acquired (pool)'));
pool.on('release', () => console.log('✅ DB connection released (pool)'));
pool.on('enqueue', () => console.log('⏳ DB connection queueing (pool)'));

const shutdown = () => {
  console.log('🛑 cerrando pool DB...');
  pool.end((err) => {
    if (err) console.error('❌ Error cerrando pool DB:', err);
    else console.log('✅ Pool DB cerrado');
    process.exit(err ? 1 : 0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log("✅ DB pool configurado");

module.exports = pool;
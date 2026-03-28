require("dotenv").config();
const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 2, // ✅ Reducido a 2 (Render limita a 5 totales)
  queueLimit: 0,
  port: process.env.DB_PORT || 3306,
  connectTimeout: 10000,
  enableKeepAlive: true,
});

// Event listeners para debugging (opcional, reducir en producción)
pool.on('acquire', () => console.log('[DB] 🔌 Connection acquired'));
pool.on('release', () => console.log('[DB] ✅ Connection released'));
pool.on('enqueue', () => console.log('[DB] ⏳ Connection queued'));
pool.on('error', (err) => console.error('[DB] ❌ Pool error:', err.message));

const shutdown = () => {
  console.log('[DB] 🛑 Closing pool...');
  pool.end((err) => {
    if (err) console.error('[DB] ❌ Error closing pool:', err);
    else console.log('[DB] ✅ Pool closed');
    process.exit(err ? 1 : 0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log("[DB] ✅ Pool configured (limit: 5)");

module.exports = pool;
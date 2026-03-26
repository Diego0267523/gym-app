const db = require("./config/db");
const fs = require("fs");
const path = require("path");

// Verificar y crear tablas si no existen
const initDatabase = () => {
  const createTablesSQL = fs.readFileSync(path.join(__dirname, "create_tables.sql"), "utf8");

  // Ejecutar el SQL completo
  db.query(createTablesSQL, (err, result) => {
    if (err) {
      console.error("❌ Error creando tablas:", err);
    } else {
      console.log("✅ Tablas verificadas/creadas correctamente");
    }
  });

  // Verificar columna avatar
  const checkAvatarSQL = `
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME='usuarios' AND COLUMN_NAME='avatar' AND TABLE_SCHEMA=DATABASE()
  `;

  db.query(checkAvatarSQL, (err, results) => {
    if (err) {
      console.error("❌ Error verificando columna avatar:", err);
      return;
    }

    if (results.length === 0) {
      const alterSQL = `ALTER TABLE usuarios ADD COLUMN avatar VARCHAR(500) DEFAULT NULL`;
      db.query(alterSQL, (err2, result2) => {
        if (err2) {
          console.error("❌ Error agregando columna avatar:", err2);
        } else {
          console.log("✅ Columna avatar agregada");
        }
      });
    } else {
      console.log("✅ Columna avatar ya existe");
    }
  });
};

module.exports = initDatabase;

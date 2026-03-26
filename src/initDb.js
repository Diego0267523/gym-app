const db = require("./config/db");

// Verificar y crear columna avatar si no existe
const initDatabase = () => {
  // Verificar si la columna existe
  const checkSql = `
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME='usuarios' AND COLUMN_NAME='avatar' AND TABLE_SCHEMA=DATABASE()
  `;
  
  db.query(checkSql, (err, results) => {
    if (err) {
      console.error("❌ Error verificando columna:", err);
      return;
    }
    
    // Si no existe, agregarla
    if (results.length === 0) {
      const alterSql = `ALTER TABLE usuarios ADD COLUMN avatar VARCHAR(500) DEFAULT NULL`;
      db.query(alterSql, (err2, result2) => {
        if (err2) {
          console.error("❌ Error agregando columna avatar:", err2);
        } else {
          console.log("✅ Columna avatar agregada a tabla usuarios");
        }
      });
    } else {
      console.log("✅ Columna avatar ya existe en tabla usuarios");
    }
  });
};

module.exports = initDatabase;

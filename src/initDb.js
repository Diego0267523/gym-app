const db = require("./config/db");
const fs = require("fs");
const path = require("path");

// Verificar y crear tablas si no existen
const initDatabase = () => {
  const createTablesSQL = fs.readFileSync(path.join(__dirname, "create_tables.sql"), "utf8");

  // Remover comments y dividir en statements individuales
  const cleanSQL = createTablesSQL
    .split('\n')
    .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
    .join('\n');

  // Dividir por punto y coma, pero solo statements completos
  const statements = cleanSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && (stmt.toUpperCase().includes('CREATE TABLE') || stmt.toUpperCase().includes('ALTER TABLE')));

  console.log(`📋 Encontrados ${statements.length} statements CREATE TABLE`);

  // Ejecutar cada statement de manera secuencial para evitar sobrecargar conexiones
  let completed = 0;
  const total = statements.length;

  if (statements.length === 0) {
    console.log("❌ No se encontraron statements CREATE TABLE válidos");
    return;
  }

  const executeNext = () => {
    if (completed >= total) {
      console.log("✅ Inicialización de BD completada");
      return;
    }

    const statement = statements[completed];
    const fullStatement = statement + ';'; // Agregar el punto y coma que se perdió en el split

    db.query(fullStatement, (err, result) => {
      if (err) {
        console.error(`❌ Error en tabla ${completed + 1}:`, err.message);
        console.error(`SQL: ${fullStatement.substring(0, 100)}...`);
      } else {
        console.log(`✅ Tabla ${completed + 1}/${total} creada/verificada`);
      }

      completed++;
      // Ejecutar el siguiente statement después de un delay mayor
      setTimeout(executeNext, 500);
    });
  };

  // Iniciar la ejecución secuencial
  executeNext();

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

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

  // Crear array de tareas incluyendo la verificación de avatar
  const tasks = [
    ...statements.map(stmt => ({ type: 'create_table', sql: stmt + ';' })),
    { type: 'check_avatar' }
  ];

  let completed = 0;
  const total = tasks.length;

  const executeNext = () => {
    if (completed >= total) {
      console.log("✅ Inicialización de BD completada");
      return;
    }

    const task = tasks[completed];

    if (task.type === 'create_table') {
      db.query(task.sql, (err, result) => {
        if (err) {
          console.error(`❌ Error en tabla ${completed + 1}:`, err.message);
        } else {
          console.log(`✅ Tabla ${completed + 1}/${total} creada/verificada`);
        }
        completed++;
        setTimeout(executeNext, 200); // Delay reducido
      });
    } else if (task.type === 'check_avatar') {
      const checkAvatarSQL = `
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME='usuarios' AND COLUMN_NAME='avatar' AND TABLE_SCHEMA=DATABASE()
      `;

      db.query(checkAvatarSQL, (err, results) => {
        if (err) {
          console.error("❌ Error verificando columna avatar:", err.message);
          completed++;
          setTimeout(executeNext, 200);
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
            completed++;
            setTimeout(executeNext, 200);
          });
        } else {
          console.log("✅ Columna avatar ya existe");
          completed++;
          setTimeout(executeNext, 200);
        }
      });
    }
  };

  // Iniciar la ejecución secuencial
  executeNext();
};

module.exports = initDatabase;

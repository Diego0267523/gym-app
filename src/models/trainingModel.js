const db = require("../config/db");

const getTrainingsByUser = (user_id, callback) => {
    const sql = `
        SELECT 
            t.id AS entrenamiento_id,
            t.fecha,
            s.ejercicio,
            s.peso,
            s.repeticiones
        FROM entrenamientos t
        JOIN series s ON t.id = s.entrenamiento_id
        WHERE t.user_id = ?
        ORDER BY t.id DESC
    `;

    db.query(sql, [user_id], callback);
};

module.exports = {
    getTrainingsByUser
};
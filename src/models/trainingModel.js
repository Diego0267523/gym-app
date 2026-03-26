const db = require("../config/db");

const createTraining = (user_id, series, callback) => {
    const sqlTraining = "INSERT INTO entrenamientos (user_id) VALUES (?)";

    db.query(sqlTraining, [user_id], (err, result) => {
        if (err) {
            return callback(err);
        }

        const entrenamiento_id = result.insertId;

        // 🔥 PREPARAR SERIES
        const sqlSeries = `
            INSERT INTO series (entrenamiento_id, ejercicio, peso, repeticiones)
            VALUES ?
        `;

        const values = series.map(s => [
            entrenamiento_id,
            s.ejercicio.trim(),
            Number(s.peso),
            Number(s.repeticiones)
        ]);

        db.query(sqlSeries, [values], (err2, result2) => {
            if (err2) {
                return callback(err2);
            }
            callback(null, result2);
        });
    });
};

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
    createTraining,
    getTrainingsByUser
};
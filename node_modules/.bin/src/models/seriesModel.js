const db = require("../config/db");

const createSerie = (data, callback) => {
    const sql = "INSERT INTO series (entrenamiento_id, ejercicio, peso, repeticiones) VALUES (?, ?, ?, ?)";
    db.query(sql, [data.entrenamiento_id, data.ejercicio, data.peso, data.repeticiones], callback);
};

module.exports = {
    createSerie
};
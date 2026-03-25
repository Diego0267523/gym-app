const trainingModel = require("../models/trainingModel");
const db = require("../config/db");

// Crear entrenamiento completo con series
exports.createTraining = (req, res) => {
    const user_id = req.user.id;
    const { series } = req.body;

    // 1. Crear entrenamiento
    const sqlTraining = "INSERT INTO entrenamientos (user_id) VALUES (?)";

    db.query(sqlTraining, [user_id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error creando entrenamiento" });
        }

        const entrenamiento_id = result.insertId;

        // 2. Insertar todas las series
        const sqlSeries = "INSERT INTO series (entrenamiento_id, ejercicio, peso, repeticiones) VALUES ?";

        const values = series.map(s => [
            entrenamiento_id,
            s.ejercicio,
            s.peso,
            s.repeticiones
        ]);

        db.query(sqlSeries, [values], (err2) => {
            if (err2) {
                console.log(err2);
                return res.status(500).json({ error: "Error guardando series" });
            }

            res.json({ message: "Entrenamiento completo guardado 🔥" });
        });
    });
};
exports.getTrainings = (req, res) => {
    const user_id = req.user.id;

    trainingModel.getTrainingsByUser(user_id, (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error obteniendo datos" });
        }

        // 🔥 AGRUPAR ENTRENAMIENTOS
        const trainings = {};

        results.forEach(row => {
            if (!trainings[row.entrenamiento_id]) {
                trainings[row.entrenamiento_id] = {
                    id: row.entrenamiento_id,
                    fecha: row.fecha,
                    series: []
                };
            }

            trainings[row.entrenamiento_id].series.push({
                ejercicio: row.ejercicio,
                peso: row.peso,
                repeticiones: row.repeticiones
            });
        });

        res.json(Object.values(trainings));
    });
};
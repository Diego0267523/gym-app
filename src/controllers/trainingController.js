const trainingModel = require("../models/trainingModel");

// Crear entrenamiento completo con series
exports.createTraining = (req, res) => {
    const user_id = req.user.id;
    const { series } = req.body;

    // 🔥 VALIDAR SERIES
    if (!series || !Array.isArray(series) || series.length === 0) {
        return res.status(400).json({
            message: "Debes agregar al menos una serie ⚠️"
        });
    }

    // 🔥 VALIDAR CADA SERIE
    for (let s of series) {
        if (!s.ejercicio || s.ejercicio.trim() === "") {
            return res.status(400).json({
                message: "El ejercicio es obligatorio ⚠️"
            });
        }

        if (!s.peso || s.peso <= 0) {
            return res.status(400).json({
                message: "El peso debe ser mayor a 0 ⚠️"
            });
        }

        if (!s.repeticiones || s.repeticiones <= 0) {
            return res.status(400).json({
                message: "Las repeticiones deben ser mayores a 0 ⚠️"
            });
        }
    }

    // 🔥 CREAR ENTRENAMIENTO
    const sqlTraining = "INSERT INTO entrenamientos (user_id) VALUES (?)";

    trainingModel.createTraining(user_id, series, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: "Error creando entrenamiento" });
        }

        if (err) {
            console.log(err);
            return res.status(500).json({ message: "Error creando entrenamiento" });
        }

        res.json({
            message: "Entrenamiento completo guardado 🔥"
        });
    });
};
exports.getTrainings = (req, res) => {
    const user_id = req.user.id;

    trainingModel.getTrainingsByUser(user_id, (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Error obteniefndo datos" });
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
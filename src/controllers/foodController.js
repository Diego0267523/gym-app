// src/controllers/foodController.js
const foodModel = require("../models/foodModel");
const logger = require("../config/logger");
const { createFoodEntrySchema } = require("../middlewares/validation");
const axios = require("axios");
const FormData = require("form-data");

// ==========================
// 🍽️ CONTROLADOR DE COMIDA
// ==========================

// Crear entrada de comida
exports.createFoodEntry = (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ success: false, message: "Usuario no autenticado" });

    const { error } = createFoodEntrySchema.validate(req.body, { abortEarly: false, convert: true });
    if (error) {
      const errors = error.details.map((d) => d.message);
      logger.warn("validacion createFoodEntry fallida", { user_id, errors, body: req.body });
      return res.status(400).json({ success: false, message: "Datos inválidos", errors });
    }

    const { descripcion, calorias, proteina, carbohidratos, grasas, fibra, sodio, fecha } = req.body;
    let { aiJson } = req.body;
    const image_url = req.file ? (req.file.secure_url || req.file.path || req.file.url) : null;

    if (typeof aiJson === 'string') {
      try { aiJson = JSON.parse(aiJson); } catch (e) { aiJson = null; }
    }

    if (aiJson?.items?.length > 0) {
      const entries = aiJson.items.map(item => ({
        user_id,
        descripcion: item.nombre || descripcion || 'Comida de IA',
        calorias: Number(item.calorias || 0),
        proteina: Number(item.proteina || 0),
        carbohidratos: Number(item.carbohidratos || 0),
        grasas: Number(item.grasas || 0),
        fibra: Number(item.fibra || 0),
        sodio: Number(item.sodio || 0),
        fecha: fecha || new Date().toISOString().split('T')[0],
        image_url
      })).filter(e => e.calorias > 0 || e.proteina > 0 || e.carbohidratos > 0 || e.grasas > 0 || e.fibra > 0 || e.sodio > 0 || e.descripcion);

      if (entries.length === 0) return res.status(400).json({ success: false, message: "No hay valores nutricionales válidos en aiJson" });

      return foodModel.createFoodEntriesBulk(entries, (err, result) => {
        if (err) {
          logger.error("Error en createFoodEntriesBulk:", { error: err.message, user_id, aiJson });
          return res.status(500).json({ success: false, message: "Error al guardar entradas de comida" });
        }
        logger.info("Entradas de comida bulk creadas", { user_id, entries: entries.length });
        return res.json({ success: true, message: "Entradas de comida guardadas (bulk)", insertedCount: entries.length });
      });
    }

    const entry = {
      user_id,
      descripcion: descripcion || '',
      calorias: parseFloat(calorias) || 0,
      proteina: parseFloat(proteina) || 0,
      carbohidratos: parseFloat(carbohidratos) || 0,
      grasas: parseFloat(grasas) || 0,
      fibra: parseFloat(fibra) || 0,
      sodio: parseFloat(sodio) || 0,
      fecha: fecha || new Date().toISOString().split('T')[0],
      image_url
    };

    foodModel.createFoodEntry(entry, (err, result) => {
      if (err) {
        logger.error("Error en createFoodEntry:", { error: err.message, user_id, entry });
        return res.status(500).json({ success: false, message: "Error al guardar entrada de comida" });
      }
      logger.info("Entrada de comida creada exitosamente", { user_id, entry_id: result.insertId });
      return res.json({ success: true, message: "Entrada de comida guardada", id: result.insertId });
    });
  } catch (error) {
    logger.error("Error en createFoodEntry:", { error: error.message, stack: error.stack, user_id: req.user?.id });
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};

// Obtener entradas del día
exports.getFoodEntries = (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ success: false, message: "Usuario no autenticado" });

    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];
    foodModel.getFoodEntriesByUserAndDate(user_id, fecha, (err, results) => {
      if (err) {
        logger.error("Error en getFoodEntries:", { error: err.message, user_id, fecha });
        return res.status(500).json({ success: false, message: "Error al obtener entradas de comida" });
      }
      logger.info("Entradas de comida obtenidas", { user_id, fecha, count: results.length });
      return res.json({ success: true, entries: results });
    });
  } catch (error) {
    logger.error("Error en getFoodEntries:", { error: error.message, stack: error.stack, user_id: req.user?.id });
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};

// Obtener totales diarios
exports.getDailyTotals = (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ success: false, message: "Usuario no autenticado" });

    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];
    foodModel.getDailyTotals(user_id, fecha, (err, results) => {
      if (err) {
        logger.error("Error en getDailyTotals:", { error: err.message, user_id, fecha });
        return res.status(500).json({ success: false, message: "Error al obtener totales diarios" });
      }
      const totals = results[0] || { total_calorias: 0, total_proteina: 0, total_carbohidratos: 0 };
      logger.info("Totales diarios obtenidos", { user_id, fecha, totals });
      return res.json({ success: true, totals });
    });
  } catch (error) {
    logger.error("Error en getDailyTotals:", { error: error.message, stack: error.stack, user_id: req.user?.id });
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};

// Obtener totales semanales
exports.getWeeklyTotals = (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ success: false, message: "Usuario no autenticado" });

    foodModel.getWeeklyTotals(user_id, (err, results) => {
      if (err) {
        logger.error("Error en getWeeklyTotals:", { error: err.message, user_id });
        return res.status(500).json({ success: false, message: "Error al obtener totales semanales" });
      }

      const week = [];
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .split('T')[0];
        const found = results.find(r => r.fecha_local === localDate);
        week.push({ fecha: localDate, total_calorias: found ? Number(found.total_calorias) : 0 });
      }

      logger.info("Totales semanales obtenidos", { user_id, week });
      return res.json({ success: true, week });
    });
  } catch (error) {
    logger.error("Error en getWeeklyTotals:", { error: error.message, stack: error.stack, user_id: req.user?.id });
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};

// Eliminar entrada
exports.deleteFoodEntry = (req, res) => {
  try {
    const user_id = req.user?.id;
    const entryId = req.params.id;

    if (!user_id) return res.status(401).json({ success: false, message: "Usuario no autenticado" });
    if (!entryId) return res.status(400).json({ success: false, message: "ID de entrada requerido" });

    foodModel.deleteFoodEntry(entryId, user_id, (err, result) => {
      if (err) {
        logger.error("Error en deleteFoodEntry:", { error: err.message, user_id, entryId });
        return res.status(500).json({ success: false, message: "Error al eliminar entrada de comida" });
      }
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Entrada no encontrada o no autorizada" });
      logger.info("Entrada de comida eliminada", { user_id, entryId });
      return res.json({ success: true, message: "Entrada eliminada" });
    });
  } catch (error) {
    logger.error("Error en deleteFoodEntry:", { error: error.message, stack: error.stack, user_id: req.user?.id, entryId: req.params.id });
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};

// 🔹 ANALIZAR IMAGEN O TEXTO CON LOGMEAL
exports.analyzeFood = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ success: false, message: "Usuario no autenticado" });

    const text = req.body.text || "";
    const imageFile = req.file?.buffer;

    if (!imageFile && !text) return res.status(400).json({ success: false, message: "Debes enviar imagen o descripción" });

    const formData = new FormData();
    if (imageFile) formData.append("image", imageFile, "food.jpg");
    if (text) formData.append("text", text);

    const response = await axios.post(
      "https://api.logmeal.com/imagen/segmentación/completa",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${process.env.LOGMEAL_API_KEY}`,
        },
      }
    );

    const apiData = response.data;
    const calories = apiData?.total?.calorias ?? 0;
    const proteina = apiData?.total?.proteina ?? 0;
    const carbohidratos = apiData?.total?.carbohidratos ?? 0;
    const aiJson = apiData?.aiJson ?? apiData;

    return res.json({
      success: true,
      calories,
      proteina,
      carbohidratos,
      details: { aiJson },
    });

  } catch (error) {
    console.error("Error LogMeal analizar imagen:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Error analizando la imagen",
      error: error.response?.data || error.message,
    });
  }
};
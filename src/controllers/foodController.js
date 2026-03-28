const foodModel = require("../models/foodModel");
const logger = require("../config/logger");
const { createFoodEntrySchema } = require("../middlewares/validation");

// ==========================
// 🍽️ CONTROLADOR DE COMIDA - MANEJO PROFESIONAL DE ZONAS HORARIAS
// ==========================

/**
 * Función auxiliar para obtener zona horaria del usuario
 * @param {object} user - Usuario JWT decodificado
 * @returns {string} - Offset en formato "+HH:MM" o "-HH:MM"
 */
const getUserTimezoneOffset = (req) => {
    // Opción 1: De header (recomendado para frontend)
    const tzFromHeader = req.headers['x-timezone-offset'];
    if (tzFromHeader) return tzFromHeader;
    
    // Opción 2: De BD (si almacenan perfil)
    const tzFromUser = req.user?.timezone_offset;
    if (tzFromUser) return tzFromUser;
    
    // Fallback: UTC
    return '+00:00';
};

// Crear entrada de comida
exports.createFoodEntry = (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ success: false, message: "Usuario no autenticado" });
    }

    const { error } = createFoodEntrySchema.validate(req.body, { abortEarly: false, convert: true });
    if (error) {
      const errors = error.details.map((d) => d.message);
      logger.warn("validacion createFoodEntry fallida", { user_id, errors, body: req.body });
      return res.status(400).json({ success: false, message: "Datos inválidos", errors });
    }

    const userTimezone = getUserTimezoneOffset(req);
    const { descripcion, calorias, proteina, carbohidratos, fecha } = req.body;
    let { aiJson } = req.body;
    const image_url = req.file ? (req.file.secure_url || req.file.path || req.file.url) : null;

    if (typeof aiJson === 'string') {
      try {
        aiJson = JSON.parse(aiJson);
      } catch (e) {
        aiJson = null;
      }
    }

    // Si el payload trae items de IA, guardamos todos ellos (bulk)
    if (aiJson && aiJson.items && Array.isArray(aiJson.items) && aiJson.items.length > 0) {
      const entries = aiJson.items.map(item => ({
        user_id,
        userTimezone,
        descripcion: item.nombre || descripcion || 'Comida de IA',
        calorias: Number(item.calorias || 0),
        proteina: Number(item.proteina || 0),
        carbohidratos: Number(item.carbohidratos || 0),
        fecha: fecha || new Date().toISOString().split('T')[0],
        image_url
      })).filter(e => e.calorias > 0 || e.proteina > 0 || e.carbohidratos > 0 || e.descripcion);

      if (entries.length === 0) {
        return res.status(400).json({ success: false, message: "No hay valores nutricionales válidos en aiJson" });
      }

      return foodModel.createFoodEntriesBulk(entries, userTimezone, (err, result) => {
        if (err) {
          logger.error("Error en createFoodEntriesBulk:", { error: err.message, user_id, aiJson });
          return res.status(500).json({ success: false, message: "Error al guardar entradas de comida" });
        }
        logger.info("Entradas de comida bulk creadas", { user_id, entries: entries.length, timezone: userTimezone });
        return res.json({ success: true, message: "Entradas de comida guardadas (bulk)", insertedCount: entries.length });
      });
    }

    const entry = {
      user_id,
      userTimezone,
      descripcion: descripcion || '',
      calorias: parseFloat(calorias) || 0,
      proteina: parseFloat(proteina) || 0,
      carbohidratos: parseFloat(carbohidratos) || 0,
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
    logger.error("Error en createFoodEntry:", { error: error.message, stack: error.stack, user_id });
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};

// Obtener entradas de comida del día actual
exports.getFoodEntries = (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ success: false, message: "Usuario no autenticado" });
    }

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
    logger.error("Error en getFoodEntries:", { error: error.message, stack: error.stack, user_id });
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};

// Obtener totales diarios - CON ZONA HORARIA CORRECTA
exports.getDailyTotals = (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ success: false, message: "Usuario no autenticado" });
    }

    const userTimezone = getUserTimezoneOffset(req);
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];

    foodModel.getDailyTotals(user_id, fecha, userTimezone, (err, results) => {
      if (err) {
        logger.error("Error en getDailyTotals:", { error: err.message, user_id, fecha, timezone: userTimezone });
        return res.status(500).json({ success: false, message: "Error al obtener totales diarios" });
      }
      const totals = results[0] || { total_calorias: 0, total_proteina: 0, total_carbohidratos: 0 };
      logger.info("Totales diarios obtenidos", { user_id, fecha, timezone: userTimezone, totals });
      return res.json({ success: true, totals });
    });
  } catch (error) {
    logger.error("Error en getDailyTotals:", { error: error.message, stack: error.stack, user_id: req.user?.id });
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};

// Obtener totales de la semana - CON ZONA HORARIA CORRECTA
exports.getWeeklyTotals = (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ success: false, message: "Usuario no autenticado" });
    }

    const userTimezone = getUserTimezoneOffset(req);

    // Generar los 7 días de la semana actual (lunes a domingo)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = domingo, 1 = lunes
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysFromMonday);
    
    // Generar array de 7 fechas en formato YYYY-MM-DD
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDates.push(d.toISOString().split('T')[0]);
    }

    foodModel.getWeeklyTotals(user_id, weekDates, userTimezone, (err, results) => {
      if (err) {
        logger.error("Error en getWeeklyTotals:", { error: err.message, user_id, timezone: userTimezone });
        return res.status(500).json({ success: false, message: "Error al obtener totales semanales" });
      }

      // Mapear resultados a los 7 días
      const week = [];
      for (let i = 0; i < 7; i++) {
        const day = weekDates[i];
        const item = results.find(r => r.fecha === day);
        week.push({ fecha: day, total_calorias: item ? Number(item.total_calorias) : 0 });
      }

      logger.info("Totales semanales obtenidos", { user_id, timezone: userTimezone, week });
      return res.json({ success: true, week });
    });
  } catch (error) {
    logger.error("Error en getWeeklyTotals:", { error: error.message, stack: error.stack, user_id: req.user?.id });
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};

// Eliminar entrada de comida
exports.deleteFoodEntry = (req, res) => {
  try {
    const user_id = req.user?.id;
    const entryId = req.params.id;

    if (!user_id) {
      return res.status(401).json({ success: false, message: "Usuario no autenticado" });
    }

    if (!entryId) {
      return res.status(400).json({ success: false, message: "ID de entrada requerido" });
    }

    foodModel.deleteFoodEntry(entryId, user_id, (err, result) => {
      if (err) {
        logger.error("Error en deleteFoodEntry:", { error: err.message, user_id, entryId });
        return res.status(500).json({ success: false, message: "Error al eliminar entrada de comida" });
      }
      if (result.affectedRows === 0) {
        logger.warn("Intento de eliminar entrada no encontrada", { user_id, entryId });
        return res.status(404).json({ success: false, message: "Entrada no encontrada o no autorizada" });
      }
      logger.info("Entrada de comida eliminada", { user_id, entryId });
      return res.json({ success: true, message: "Entrada eliminada" });
    });
  } catch (error) {
    logger.error("Error en deleteFoodEntry:", { error: error.message, stack: error.stack, user_id, entryId });
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};
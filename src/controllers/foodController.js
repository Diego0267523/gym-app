const foodModel = require("../models/foodModel");
const logger = require("../config/logger");
const { createFoodEntrySchema } = require("../middlewares/validation");
// const sharp = require("sharp"); // 🔥 Para compresión de imágenes - instalar con npm install sharp

// === Helpers para manejo de zona horaria y fechas ===
const DEFAULT_TZ_OFFSET = process.env.SERVER_TZ_OFFSET || '-05:00'; // fallback UTC-5

function parseOffsetToMinutes(offset) {
  const m = /^([+-])(\d{2}):(\d{2})$/.exec(offset);
  if (!m) return 0;
  const sign = m[1] === '-' ? -1 : 1;
  return sign * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10));
}

function formatDateFromMs(ms) {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function localNowMs(offset) {
  const mins = parseOffsetToMinutes(offset);
  return Date.now() + mins * 60000;
}

function generateWeekDatesForOffset(offset) {
  const nowMs = localNowMs(offset);
  const dayOfWeek = new Date(nowMs).getUTCDay(); // 0=domingo
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const mondayMs = nowMs - daysFromMonday * 24 * 60 * 60 * 1000;
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    weekDates.push(formatDateFromMs(mondayMs + i * 24 * 60 * 60 * 1000));
  }
  return weekDates;
}


// ==========================
// 🍽️ CONTROLADOR DE COMIDA
// ==========================

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

    // 🔥 Si el payload trae items de IA, guardamos todos ellos (bulk) para evitar invalid datos.
    if (aiJson && aiJson.items && Array.isArray(aiJson.items) && aiJson.items.length > 0) {
      const entries = aiJson.items.map(item => ({
        user_id,
        descripcion: item.nombre || descripcion || 'Comida de IA',
        calorias: Number(item.calorias || 0),
        proteina: Number(item.proteina || 0),
        carbohidratos: Number(item.carbohidratos || 0),
        // almacenar como DATETIME/TIMESTAMP: si se recibió fecha, crear Date, sino now
        fecha: fecha ? new Date(fecha) : new Date(),
        image_url
      })).filter(e => e.calorias > 0 || e.proteina > 0 || e.carbohidratos > 0 || e.descripcion);

      if (entries.length === 0) {
        return res.status(400).json({ success: false, message: "No hay valores nutricionales válidos en aiJson" });
      }

      return foodModel.createFoodEntriesBulk(entries, (err, result) => {
        if (err) {
          logger.error("Error en createFoodEntriesBulk:", { error: err.message, user_id, aiJson });
          return res.status(500).json({ success: false, message: "Error al guardar entradas de comida" });
        }
        logger.info("Entradas de comida bulk creadas", { user_id, entries: entries.length });
        return res.json({ success: true, message: "Entradas de comida guardadas (bulk)", insertedCount: entries.length });
      });
    }

    // 🔥 OPTIMIZACIÓN: Comprimir imagen si existe
    if (req.file && req.file.buffer) {
      try {
        // const compressedBuffer = await sharp(req.file.buffer)
        //   .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        //   .jpeg({ quality: 80 })
        //   .toBuffer();
        // req.file.buffer = compressedBuffer; // Reemplazar buffer comprimido
        logger.info("Imagen comprimida (implementar con sharp)");
      } catch (compressError) {
        logger.warn("Error comprimiendo imagen:", compressError.message);
      }
    }

    const entry = {
      user_id,
      descripcion: descripcion || '',
      calorias: parseFloat(calorias) || 0,
      proteina: parseFloat(proteina) || 0,
      carbohidratos: parseFloat(carbohidratos) || 0,
      // almacenar fecha como Date (DATETIME/TIMESTAMP en BD)
      fecha: fecha ? new Date(fecha) : new Date(),
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

    const tz = req.query.tz || DEFAULT_TZ_OFFSET;
    const fecha = req.query.fecha || formatDateFromMs(localNowMs(tz));

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

// Obtener totales diarios
exports.getDailyTotals = (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ success: false, message: "Usuario no autenticado" });
    }

    const tz = req.query.tz || DEFAULT_TZ_OFFSET;
    const fecha = req.query.fecha || formatDateFromMs(localNowMs(tz));

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
    logger.error("Error en getDailyTotals:", { error: error.message, stack: error.stack, user_id });
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};

// Obtener totales de la semana
exports.getWeeklyTotals = (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ success: false, message: "Usuario no autenticado" });
    }

    // Determinar timezone (puede venir por query ?tz= or usar default server)
    const tz = req.query.tz || DEFAULT_TZ_OFFSET;
    // Generar array de 7 fechas locales (lunes a domingo) según tz
    const weekDates = generateWeekDatesForOffset(tz);

    foodModel.getWeeklyTotals(user_id, weekDates, tz, (err, results) => {
      if (err) {
        logger.error("Error en getWeeklyTotals:", { error: err.message, user_id });
        return res.status(500).json({ success: false, message: "Error al obtener totales semanales" });
      }

      // Mapear resultados a los 7 días (results usa campo fecha_local)
      const week = weekDates.map(day => {
        const item = results.find(r => r.fecha_local === day || r.fecha === day);
        return { fecha: day, total_calorias: item ? Number(item.total_calorias) : 0 };
      });

      logger.info("Totales semanales obtenidos", { user_id, week });
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
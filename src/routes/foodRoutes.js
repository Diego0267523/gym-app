const express = require("express");
const router = express.Router();
const foodController = require("../controllers/foodController");
const verifyToken = require("../middlewares/authMiddleware");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const { createFoodEntrySchema, validate } = require("../middlewares/validation");
const axios = require("axios");
const FormData = require("form-data");

// 🔥 Configurar storages
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "gym-app",
    allowed_formats: ["jpg", "png", "jpeg"]
  }
});
const memoryStorage = multer.memoryStorage();
const uploadCloudinary = multer({ storage: cloudinaryStorage });
const uploadMemory = multer({ storage: memoryStorage });

// ==========================
// 🍽️ FOOD ENTRIES
// ==========================

// Crear entrada de comida (con imagen opcional) - usa Cloudinary para almacenamiento permanente
router.post("/entries", verifyToken, uploadCloudinary.single("image"), foodController.createFoodEntry);

// Obtener entradas de comida del día
router.get("/entries", verifyToken, foodController.getFoodEntries);

// Obtener totales diarios
router.get("/totals", verifyToken, foodController.getDailyTotals);

// Obtener totales de la semana
router.get("/weekly-totals", verifyToken, foodController.getWeeklyTotals);

// Eliminar entrada de comida
router.delete("/entries/:id", verifyToken, foodController.deleteFoodEntry);

// ==========================
// 🍴 ANALIZAR IMAGEN / TEXTO CON LOGMEAL
// ==========================
router.post("/ai/calories", verifyToken, uploadMemory.single("image"), async (req, res) => { // 🔥 Cambiado: usar uploadMemory para buffer
  try {
    const text = req.body.text || "";
    const imageFile = req.file?.buffer;

    if (!imageFile && !text) {
      return res.status(400).json({ success: false, message: "Debes enviar imagen o descripción" });
    }

    // 🔥 Si hay imagen, enviar a LogMeal; si solo texto, usar IA (LogMeal no soporta texto puro)
    if (imageFile) {
      const formData = new FormData();
      formData.append("image", imageFile, "food.jpg");

      const response = await axios.post(
        "https://api.logmeal.es/v2/image/segmentation/complete/v1.0?language=es", // 🔥 Corregido: endpoint correcto de LogMeal
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${process.env.LOGMEAL_API_KEY}`,
          },
        }
      );

      const apiData = response.data;
      // 🔥 Asumir estructura de respuesta de LogMeal (ajustar según docs reales)
      const calories = apiData?.nutrition?.calories?.value ?? 0;
      const proteina = apiData?.nutrition?.protein?.value ?? 0;
      const carbohidratos = apiData?.nutrition?.carbs?.value ?? 0;
      const aiJson = apiData;

      return res.json({
        success: true,
        calories,
        proteina,
        carbohidratos,
        details: { aiJson },
      });
    } else {
      // 🔥 Para texto solo, usar Gemini (ya que LogMeal es para imágenes)
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `Analiza la siguiente descripción de comida y responde ÚNICAMENTE con JSON válido: {"total":{"calorias":number,"proteina":number,"carbohidratos":number},"items":[{"nombre":"...","calorias":number,"proteina":number,"carbohidratos":number}]}. Descripción: ${text}`;

      const result = await model.generateContent(prompt);
      const outputText = result?.response?.text() || "{}";

      let aiJson;
      try {
        aiJson = JSON.parse(outputText);
      } catch (e) {
        aiJson = { total: { calorias: 0, proteina: 0, carbohidratos: 0 }, items: [] };
      }

      return res.json({
        success: true,
        calories: aiJson.total?.calorias ?? 0,
        proteina: aiJson.total?.proteina ?? 0,
        carbohidratos: aiJson.total?.carbohidratos ?? 0,
        details: { aiJson },
      });
    }

  } catch (error) {
    console.error("Error analizando comida:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Error analizando la comida",
      error: error.response?.data || error.message,
    });
  }
});

module.exports = router;
const express = require("express");
const router = express.Router();
const foodController = require("../controllers/foodController");
const verifyToken = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");
const { createFoodEntrySchema, validate } = require("../middlewares/validation");
const axios = require("axios");
const FormData = require("form-data");

// ==========================
// 🍽️ FOOD ENTRIES
// ==========================

// Crear entrada de comida (con imagen opcional)
router.post("/entries", verifyToken, upload.single("image"), foodController.createFoodEntry);

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
router.post("/ai/calories", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const text = req.body.text || "";
    const imageFile = req.file?.buffer;

    if (!imageFile && !text) {
      return res.status(400).json({ success: false, message: "Debes enviar imagen o descripción" });
    }

    const formData = new FormData();
    if (imageFile) formData.append("image", imageFile, "food.jpg");
    if (text) formData.append("text", text);

    const response = await axios.post(
      "https://api.logmeal.com/imagen/segmentación/completa",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${process.env.LOGMEAL_API_KEY}`, // <-- tu API key aquí
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
});

module.exports = router;
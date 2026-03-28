const express = require("express");
const router = express.Router();
const foodController = require("../controllers/foodController");
const verifyToken = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");
const { createFoodEntrySchema, validate } = require("../middlewares/validation");

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

module.exports = router;
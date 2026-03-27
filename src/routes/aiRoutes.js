const express = require("express");
const router = express.Router();

const { generateRoutine, chatAssistant, countCalories } = require("../controllers/aiController");
const verifyToken = require("../middlewares/authMiddleware"); // 👈 AJUSTA SI CAMBIASTE NOMBRE
const upload = require("../middlewares/upload");
const { aiLimiter } = require("../middlewares/rateLimiter");

// ==========================
// 🤖 AI ROUTES (PROTEGIDAS)
// ==========================

// Generar rutina
router.post("/routine", verifyToken, aiLimiter, generateRoutine);

// Chat con IA
router.post("/chat", verifyToken, aiLimiter, chatAssistant);

// Conteo de calorías por texto / imagen (upload optional)
router.post("/calories", verifyToken, aiLimiter, upload.single("image"), countCalories);

module.exports = router;
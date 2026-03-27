const express = require("express");
const router = express.Router();

const { generateRoutine, chatAssistant, countCalories } = require("../controllers/aiController");
const verifyToken = require("../middlewares/authMiddleware"); // 👈 AJUSTA SI CAMBIASTE NOMBRE
const upload = require("../middlewares/upload");

// ==========================
// 🤖 AI ROUTES (PROTEGIDAS)
// ==========================

// Generar rutina
router.post("/routine", verifyToken, generateRoutine);

// Chat con IA
router.post("/chat", verifyToken, chatAssistant);

// Conteo de calorías por texto / imagen (upload optional)
router.post("/calories", verifyToken, upload.single("image"), countCalories);

module.exports = router;
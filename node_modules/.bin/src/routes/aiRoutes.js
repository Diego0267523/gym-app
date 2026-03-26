const express = require("express");
const router = express.Router();

const { generateRoutine, chatAssistant } = require("../controllers/aiController");
const verifyToken = require("../middlewares/authMiddleware"); // 👈 AJUSTA SI CAMBIASTE NOMBRE

// ==========================
// 🤖 AI ROUTES (PROTEGIDAS)
// ==========================

// Generar rutina
router.post("/routine", verifyToken, generateRoutine);

// Chat con IA
router.post("/chat", verifyToken, chatAssistant);

module.exports = router;
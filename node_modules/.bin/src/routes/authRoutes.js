const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const verifyToken = require("../middlewares/authMiddleware"); // 👈 IMPORTANTE

// ==========================
// 🔐 AUTH
// ==========================

// REGISTRO
router.post("/register", authController.register);

// LOGIN
router.post("/login", authController.login);

// ==========================
// 👤 PERFIL (NUEVO 🔥)
// ==========================

// Obtener datos del usuario logueado
router.get("/profile", verifyToken, authController.getProfile);

module.exports = router;
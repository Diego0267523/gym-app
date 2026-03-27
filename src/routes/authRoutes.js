const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const notificationsController = require("../controllers/notificationsController");
const verifyToken = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");
const { authLimiter } = require("../middlewares/rateLimiter");
const { loginSchema, registerSchema, validate } = require("../middlewares/validation");

// ==========================
// 🔐 AUTH
// ==========================

// REGISTRO
router.post("/register", authLimiter, validate(registerSchema), authController.register);

// LOGIN
router.post("/login", authLimiter, validate(loginSchema), authController.login);

// ==========================
// 🧪 TEST ROUTES (SIN RATE LIMITER)
// ==========================
router.post("/test/register", validate(registerSchema), authController.register);
router.post("/test/login", validate(loginSchema), authController.login);

// ==========================
// 👤 PERFIL (NUEVO 🔥)
// ==========================

// Obtener datos del usuario logueado
router.get("/profile", verifyToken, authController.getProfile);

// 📸 Actualizar avatar
router.put("/profile/avatar", verifyToken, upload.single("avatar"), authController.updateAvatar);

// ==========================
// 🔔 NOTIFICACIONES
// ==========================

// Obtener notificaciones
router.get("/notifications", verifyToken, notificationsController.getNotifications);

// Obtener conteo de notificaciones no leídas
router.get("/notifications/unread", verifyToken, notificationsController.getUnreadCount);

// Marcar notificación como leída
router.put("/notifications/:id/read", verifyToken, notificationsController.markAsRead);

// Marcar todas las notificaciones como leídas
router.put("/notifications/read-all", verifyToken, notificationsController.markAllAsRead);

module.exports = router;
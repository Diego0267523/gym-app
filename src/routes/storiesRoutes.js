const express = require("express");
const router = express.Router();

const verifyToken = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");
const storiesController = require("../controllers/storiesController");

// 🔥 crear historia (protegido)
router.post("/", verifyToken, upload.uploadCloudinary.single("image"), storiesController.createStory);

// 🔥 obtener todas las historias (máximo 24 horas)
router.get("/", storiesController.getStories);

// 🔥 obtener historias de un usuario específico
router.get("/user/:userId", storiesController.getUserStories);

// 🔥 eliminar historia propia
router.delete("/:id", verifyToken, storiesController.deleteStory);

// 🔥 limpiar historias viejas (ejecutar periódicamente)
router.post("/clean/old", storiesController.cleanOldStories);

module.exports = router;

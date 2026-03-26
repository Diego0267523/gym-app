const express = require("express");
const router = express.Router();

const trainingController = require("../controllers/trainingController");
const verifyToken = require("../middlewares/authMiddleware");

// 👇 ESTA LÍNEA ES LA CLAVE
router.post("/create", verifyToken, trainingController.createTraining);
router.get("/", verifyToken, trainingController.getTrainings);
module.exports = router;
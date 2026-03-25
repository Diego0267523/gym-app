const express = require("express");
const router = express.Router();
const { generateRoutine } = require("../controllers/aiController");
const { chatAssistant } = require("../controllers/aiController");

router.post("/routine", generateRoutine);
router.post("/chat", chatAssistant);
module.exports = router;
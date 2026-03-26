const express = require("express");
const router = express.Router();

const verifyToken = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");
const postsController = require("../controllers/postsController");

// 🔥 crear post (protegido)
router.post("/", verifyToken, upload.single("image"), postsController.createPost);

// 🔥 obtener feed
router.get("/", postsController.getPosts);

module.exports = router;
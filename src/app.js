require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cron = require('node-cron');

const aiRoutes = require("./routes/aiRoutes");
const postRoutes = require("./routes/postRoutes");
const authRoutes = require("./routes/authRoutes");
const trainingRoutes = require("./routes/trainingRoutes");
const storiesRoutes = require("./routes/storiesRoutes");

const PORT = process.env.PORT || 10000;

require("./config/db");

// 🔥 CRON para limpiar historias viejas cada hora
const storiesModel = require("./models/storiesModel");

cron.schedule('0 * * * *', async () => {
  try {
    console.log('🧹 [CRON] Limpiando historias antiguas (> 24 horas)...');
    await storiesModel.deleteOldStories();
    console.log('✅ [CRON] Historias antiguas eliminadas');
  } catch (error) {
    console.error('❌ [CRON] Error al limpiar historias:', error.message);
  }
});

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "https://gym-frontend-s8up.onrender.com",
  "http://localhost:3001",
  "http://localhost:3000"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 👇 RUTAS
app.use("/api/auth", authRoutes);
app.use("/api/training", trainingRoutes);
app.use("/api/stories", storiesRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/posts", postRoutes);
app.use("/uploads", express.static("uploads"));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Servidor corriendo" });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
  console.log(`🔥 CRON job configurado para limpiar historias cada hora`);
});

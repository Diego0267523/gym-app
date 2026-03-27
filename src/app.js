require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cron = require('node-cron');
const initDatabase = require("./initDb");
const db = require("./config/db");

const aiRoutes = require("./routes/aiRoutes");
const postRoutes = require("./routes/postRoutes");
const authRoutes = require("./routes/authRoutes");
const trainingRoutes = require("./routes/trainingRoutes");
const storiesRoutes = require("./routes/storiesRoutes");

const PORT = process.env.PORT || 10000;

require("./config/db");
initDatabase(); // 🔥 Inicializar BD

// 🔥 CRON para limpiar historias viejas cada hora
const storiesModel = require("./models/storiesModel");

cron.schedule('0 * * * *', async () => {
  try {
    console.log('🧹 [CRON] Limpiando historias antiguas (> 24 horas)...');
    storiesModel.deleteOldStories((err, result) => {
      if (err) {
        console.error('❌ [CRON] Error al limpiar historias:', err.message);
      } else {
        console.log('✅ [CRON] Historias antiguas eliminadas');
      }
    });
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

// DB status endpoint
app.get("/status", (req, res) => {
  db.query("SELECT 1 + 1 AS value", (err, results) => {
    if (err) {
      console.error("DB health check falló:", err);
      return res.status(500).json({ status: "error", message: "DB no disponible" });
    }
    return res.json({ status: "ok", db: "available", value: results[0].value });
  });
});

// Middleware global para errores no capturados (no explota el server)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    success: false,
    message: "Error interno del servidor. Intente nuevamente más tarde."
  });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
  console.log(`🔥 CRON job configurado para limpiar historias cada hora`);
});

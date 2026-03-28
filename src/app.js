require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cron = require('node-cron');
const initDatabase = require("./initDb");
const db = require("./config/db");
const logger = require("./config/logger");
const { apiLimiter } = require("./middlewares/rateLimiter");

const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const aiRoutes = require("./routes/aiRoutes");
const postRoutes = require("./routes/postRoutes");
const authRoutes = require("./routes/authRoutes");
const trainingRoutes = require("./routes/trainingRoutes");
const storiesRoutes = require("./routes/storiesRoutes");
const foodRoutes = require("./routes/foodRoutes");

const PORT = process.env.PORT || 9090;

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

// Security middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.cloudinary.com"],
    },
  },
}));
app.use(apiLimiter);

// Logging middleware
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.url} - ${req.ip}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 👇 RUTAS
app.use("/api/auth", authRoutes);
app.use("/api/training", trainingRoutes);
app.use("/api/stories", storiesRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/food", foodRoutes);
app.use("/uploads", express.static("uploads"));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Servidor corriendo" });
});

// 🌐 Socket.IO configuration
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const { runChatAssistant } = require("./controllers/aiController");

const likesModel = require("./models/likesModel");
const commentsModel = require("./models/commentsModel");

io.on("connection", (socket) => {
  console.log(`✨ Socket conectado: ${socket.id}`);

  // JWT authentication
  const token = socket.handshake.auth.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.userId = decoded.id;
      console.log(`👤 Usuario autenticado: ${socket.data.userId}`);
    } catch (err) {
      console.log(`❌ Token inválido para socket: ${socket.id}`);
    }
  }

  // Join/Leave post rooms
  socket.on("join_post", (data) => {
    if (data.postId) {
      socket.join(`post_${data.postId}`);
      console.log(`📱 Socket ${socket.id} joined post_${data.postId}`);
    }
  });

  socket.on("leave_post", (data) => {
    if (data.postId) {
      socket.leave(`post_${data.postId}`);
      console.log(`📱 Socket ${socket.id} left post_${data.postId}`);
    }
  });

  // Like post
  socket.on("like_post", async (data) => {
    if (!socket.data.userId || !data.postId) return;

    try {
      await likesModel.toggleLike(socket.data.userId, data.postId);
      const likesCount = await likesModel.getLikesCount(data.postId);
      const isLiked = await likesModel.isLikedByUser(socket.data.userId, data.postId);

      io.to(`post_${data.postId}`).emit("post_like_updated", {
        postId: data.postId,
        likesCount,
        isLiked
      });
    } catch (err) {
      console.error("❌ Error toggling like:", err);
    }
  });

  // Comment post
  socket.on("comment_post", async (data) => {
    if (!socket.data.userId || !data.postId || !data.comment) return;

    try {
      const comment = await commentsModel.addComment(socket.data.userId, data.postId, data.comment);
      const commentsCount = await commentsModel.getCommentsCount(data.postId);

      io.to(`post_${data.postId}`).emit("post_comment_added", {
        postId: data.postId,
        comment,
        commentsCount
      });
    } catch (err) {
      console.error("❌ Error adding comment:", err);
    }
  });

  socket.on("ask_ai", async (data) => {
    try {
      if (!data?.pregunta || !data.pregunta.trim()) {
        socket.emit("ai_error", "La pregunta no puede estar vacía");
        return;
      }

      const respuesta = await runChatAssistant(data.pregunta);
      socket.emit("ai_response", { pregunta: data.pregunta, respuesta });
    } catch (err) {
      console.error("🔥 Error socket AI:", err);
      socket.emit("ai_error", "Error en el asistente IA. Intenta de nuevo.");
    }
  });

  socket.on("disconnect", () => {
    console.log(`⚡ Socket desconectado: ${socket.id}`);
  });
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
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack, url: req.url, method: req.method, ip: req.ip });
  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    success: false,
    message: "Error interno del servidor. Intente nuevamente más tarde."
  });
});

server.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
  console.log(`🔥 CRON job configurado para limpiar historias cada hora`);
});

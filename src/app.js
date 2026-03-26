require("dotenv").config();
const express = require("express");
const cors = require("cors");
const aiRoutes = require("./routes/aiRoutes");
const postRoutes = require("./routes/postRoutes");
const PORT = process.env.PORT || 10000;

require("./config/db");

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


// 👇 PRIMERO IMPORTAS
const authRoutes = require("./routes/authRoutes");
const trainingRoutes = require("./routes/trainingRoutes");

// 👇 DESPUÉS LOS USAS
app.use("/api/auth", authRoutes);
app.use("/api/training", trainingRoutes);

app.use("/api/ai", aiRoutes);
app.use("/api/posts", postRoutes);
app.use("/uploads", express.static("uploads"));
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});

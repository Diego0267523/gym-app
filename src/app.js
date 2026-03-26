require("dotenv").config();
const express = require("express");
const cors = require("cors");
const aiRoutes = require("./routes/aiRoutes");
const postRoutes = require("./routes/postRoutes");
const PORT = process.env.PORT || 3000;

require("./config/db");

const app = express();

app.use(cors());
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

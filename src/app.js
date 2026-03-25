require("dotenv").config();
const express = require("express");
const cors = require("cors");
const aiRoutes = require("./routes/aiRoutes");

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

app.listen(3000, () => {
    console.log("Servidor corriendo en http://localhost:3000");
});
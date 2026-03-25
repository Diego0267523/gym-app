const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  try {
    let authHeader = req.headers.authorization;

    console.log("🔐 AUTH HEADER:", authHeader);

    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    // 🔥 soporte para "Bearer token" o solo "token"
    let token = authHeader;

    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    console.log("❌ JWT ERROR:", error.message);
    return res.status(401).json({ error: "Token inválido" });
  }
};

module.exports = verifyToken;

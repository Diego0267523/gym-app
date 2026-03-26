const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 🔐 Validar header
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No autorizado: token requerido"
      });
    }

    // 🔥 Soporta:
    // "Bearer token"
    // "token"
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    // 🔐 Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 👤 Guardar usuario en request como id (compatibilidad con payload de JWT)
    req.user = { id: decoded.id || decoded.user_id || decoded.userId };

    next();

  } catch (error) {
    console.error("❌ Error JWT:", error.message);

    return res.status(401).json({
      success: false,
      message: "Token inválido o expirado"
    });
  }
};

module.exports = verifyToken;
const jwt = require("jsonwebtoken");

// 🔐 Middleware de autenticación OPCIONAL
// Si hay token, lo valida y establece req.user
// Si no hay token, continúa sin req.user
const verifyTokenOptional = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Si no hay header, continuar sin usuario
    if (!authHeader) {
      return next();
    }

    // Extraer token
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Guardar usuario en request
    req.user = { id: decoded.id || decoded.user_id || decoded.userId };

    next();

  } catch (error) {
    // Si hay error en JWT, ignor ar y continuar sin usuario
    // (para que posts públicos funcionen siempre)
    console.log("⚠️ Token JWT no válido o expirado (autenticación opcional)", error.message);
    next();
  }
};

module.exports = verifyTokenOptional;

const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 login attempts per windowMs (más flexible para pruebas)
  message: {
    success: false,
    message: 'Demasiados intentos de login desde esta IP, por favor intenta más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter for AI endpoints (expensive operations)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 AI requests per hour
  message: {
    success: false,
    message: 'Demasiadas solicitudes de IA desde esta IP, por favor intenta más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter for file uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 uploads per hour
  message: {
    success: false,
    message: 'Demasiadas subidas de archivos desde esta IP, por favor intenta más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter for profile endpoint (more permissive since it's called on app load)
const profileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 profile requests per windowMs
  message: {
    success: false,
    message: 'Demasiadas solicitudes de perfil desde esta IP, por favor intenta más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
  aiLimiter,
  uploadLimiter,
  profileLimiter,
};
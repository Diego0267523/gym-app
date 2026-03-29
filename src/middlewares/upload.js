const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// 🔥 Para análisis de imagen con LogMeal, usar memory storage para obtener buffer
const memoryStorage = multer.memoryStorage();

// 🔥 Para subida de archivos a Cloudinary (comida, historias), usar Cloudinary storage
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "gym-app",
    allowed_formats: ["jpg", "png", "jpeg"]
  }
});

// 🔥 Exportar middlewares para usar en rutas
module.exports = {
  uploadCloudinary: multer({ storage: cloudinaryStorage }),
  uploadMemory: multer({ storage: memoryStorage }),
};
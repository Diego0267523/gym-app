const storiesModel = require("../models/storiesModel");

// Crear una historia
exports.createStory = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const file = req.file;

    if (!user_id) {
      return res.status(401).json({ success: false, message: "Usuario no autenticado" });
    }

    if (!file) {
      return res.status(400).json({ success: false, message: "Imagen requerida" });
    }

    const image_url = file.secure_url || file.path || file.url;
    if (!image_url) {
      return res.status(500).json({ success: false, message: "Error al procesar la imagen" });
    }

    await storiesModel.createStory(user_id, image_url);
    return res.json({ success: true, message: "Historia creada exitosamente" });
  } catch (error) {
    console.error("Error en createStory:", error);
    return res.status(500).json({ success: false, message: "Error al crear historia" });
  }
};

// Obtener todas las historias (máximo 24 horas)
exports.getStories = async (req, res) => {
  try {
    const stories = await storiesModel.getStories();
    return res.json({ success: true, stories });
  } catch (error) {
    console.error("Error getting stories:", error);
    return res.status(500).json({ success: false, message: "Error obteniendo historias" });
  }
};

// Obtener historias de un usuario específico
exports.getUserStories = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ success: false, message: "ID de usuario inválido" });
    }

    const stories = await storiesModel.getUserStories(userId);
    return res.json({ success: true, stories });
  } catch (error) {
    console.error("Error getting user stories:", error);
    return res.status(500).json({ success: false, message: "Error obteniendo historias del usuario" });
  }
};

// Eliminar una historia propia
exports.deleteStory = async (req, res) => {
  try {
    const userId = req.user?.id;
    const storyId = parseInt(req.params.id, 10);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Usuario no autenticado" });
    }

    if (!storyId || isNaN(storyId)) {
      return res.status(400).json({ success: false, message: "ID de historia inválido" });
    }

    const story = await storiesModel.getStoryById(storyId);
    if (!story) {
      return res.status(404).json({ success: false, message: "Historia no encontrada" });
    }

    // Verificar que el usuario sea el propietario
    if (story.user_id !== userId) {
      return res.status(403).json({ success: false, message: "No tienes permisos para eliminar esta historia" });
    }

    await storiesModel.deleteStory(storyId);
    return res.json({ success: true, message: "Historia eliminada" });
  } catch (error) {
    console.error("Error deleting story:", error);
    return res.status(500).json({ success: false, message: "Error al eliminar historia" });
  }
};

// Ejecutar limpieza de historias viejas (> 24 horas)
exports.cleanOldStories = async (req, res) => {
  try {
    await storiesModel.deleteOldStories();
    return res.json({ success: true, message: "Historias antiguas eliminadas" });
  } catch (error) {
    console.error("Error cleaning old stories:", error);
    return res.status(500).json({ success: false, message: "Error al limpiar historias" });
  }
};

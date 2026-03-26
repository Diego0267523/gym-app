const postModel = require("../models/postModel");

exports.createPost = (req, res) => {
  try {
    const caption = req.body.caption;
    const user_id = req.user.id;
    const file = req.file;

    console.log("📸 Archivo recibido:", JSON.stringify(file, null, 2));

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Imagen requerida"
      });
    }

    // Verificar que existe la URL de Cloudinary
    const image_url = file.secure_url || file.path || file.url;

    console.log("🔗 URL extraída:", image_url);

    if (!image_url) {
      console.error("❌ Error: No se obtuvo URL de imagen", { 
        secure_url: file.secure_url,
        path: file.path,
        url: file.url,
        allKeys: Object.keys(file)
      });
      return res.status(500).json({
        success: false,
        message: "Error al procesar la imagen"
      });
    }

    postModel.createPost(user_id, image_url, caption, (err, result) => {
      if (err) {
        console.error("❌ Error al guardar post en BD:", err);
        return res.status(500).json({ 
          success: false, 
          message: "Error al guardar el post en BD" 
        });
      }

      console.log("✅ Post guardado correctamente:", result);
      res.json({
        success: true,
        message: "Post creado 🚀"
      });
    });
    

  } catch (error) {
    console.error("❌ Error en createPost:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getPosts = (req, res) => {
  postModel.getPosts((err, posts) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: "Error obteniendo posts" });
    }

    res.json({ success: true, posts });
  });
};
const postModel = require("../models/postModel");

exports.createPost = (req, res) => {
  try {
    const caption = req.body.caption;
    const user_id = req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Imagen requerida"
      });
    }

    // Verificar que existe la URL de Cloudinary o bien la URL de multer-storage
    const image_url = file.secure_url || file.path || file.url;

    if (!image_url) {
      console.error("Error: No se obtuvo URL de imagen desde Cloudinary", file);
      return res.status(500).json({
        success: false,
        message: "Error al procesar la imagen"
      });
    }

    // image_url ya apunta a una URL pública válida
    postModel.createPost(user_id, image_url, caption, (err) => {
      if (err) {
        console.error("Error al guardar post en BD:", err);
        return res.status(500).json({ 
          success: false, 
          message: "Error al guardar el post" 
        });
      }

      res.json({
        success: true,
        message: "Post creado 🚀"
      });
    });
    

  } catch (error) {
    console.error("Error en createPost:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getPosts = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  console.log("Fetching posts - Page:", page, "Limit:", limit, "Offset:", offset, "User:", req.user?.id);

  postModel.getPosts(offset, limit, (err, posts) => {
    if (err) {
      console.error("Error in getPosts:", err);
      return res.status(500).json({ success: false, message: "Error obteniendo posts" });
    }

    console.log("Posts fetched:", posts?.length || 0);
    const normalizedPosts = (posts || []).map((post) => ({
      ...post,
      nombre: post.nombre || "Usuario"
    }));
    res.json({ success: true, posts: normalizedPosts, page, limit });
  });
};
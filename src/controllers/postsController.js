const postModel = require("../models/postModel");
const likesModel = require("../models/likesModel");
const commentsModel = require("../models/commentsModel");

exports.createPost = async (req, res) => {
  try {
    const caption = req.body.caption;
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

    await postModel.createPost(user_id, image_url, caption);
    return res.json({ success: true, message: "Post creado" });
  } catch (error) {
    console.error("Error en createPost:", error);
    return res.status(500).json({ success: false, message: "Error al crear post" });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const posts = await postModel.getPosts(limit, offset);
    return res.json({ success: true, posts, page, limit });
  } catch (error) {
    console.error("Error in getPosts:", error);
    return res.status(500).json({ success: false, message: "Error obteniendo posts" });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const userId = req.user?.id;
    const postId = parseInt(req.params.id, 10);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Usuario no autenticado" });
    }
    if (!postId || isNaN(postId)) {
      return res.status(400).json({ success: false, message: "ID de post inválido" });
    }

    const likeResult = await likesModel.toggleLike(userId, postId);
    const likeCount = await likesModel.getLikesCount(postId);

    return res.json({ success: true, data: { action: likeResult.action, likes: likeCount } });
  } catch (error) {
    console.error("Error toggleLike:", error);
    return res.status(500).json({ success: false, message: "Error toggling like" });
  }
};

exports.getComments = async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    if (!postId || isNaN(postId)) {
      return res.status(400).json({ success: false, message: "ID de post inválido" });
    }

    const comments = await commentsModel.getComments(postId);
    return res.json({ success: true, comments });
  } catch (error) {
    console.error("Error getComments:", error);
    return res.status(500).json({ success: false, message: "Error obteniendo comentarios" });
  }
};

exports.addComment = async (req, res) => {
  try {
    const userId = req.user?.id;
    const postId = parseInt(req.params.id, 10);
    const comment = (req.body.comment || "").trim();

    if (!userId) {
      return res.status(401).json({ success: false, message: "Usuario no autenticado" });
    }
    if (!postId || isNaN(postId)) {
      return res.status(400).json({ success: false, message: "ID de post inválido" });
    }
    if (!comment) {
      return res.status(400).json({ success: false, message: "El comentario no puede estar vacío" });
    }

    const newComment = await commentsModel.addComment(userId, postId, comment);
    return res.json({ success: true, comment: newComment });
  } catch (error) {
    console.error("Error addComment:", error);
    return res.status(500).json({ success: false, message: "Error creando comentario" });
  }
};
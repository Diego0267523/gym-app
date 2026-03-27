const postModel = require("../models/postModel");
const likesModel = require("../models/likesModel");
const commentsModel = require("../models/commentsModel");

exports.createPost = (req, res) => {
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

    postModel.createPost(user_id, image_url, caption, (err, result) => {
      if (err) {
        console.error("Error en createPost:", err);
        return res.status(500).json({ success: false, message: "Error al crear post" });
      }
      return res.json({ success: true, message: "Post creado" });
    });
  } catch (error) {
    console.error("Error en createPost:", error);
    return res.status(500).json({ success: false, message: "Error al crear post" });
  }
};

const fetchPosts = (limit, offset) => {
  return new Promise((resolve, reject) => {
    postModel.getPosts(limit, offset, (err, posts) => {
      if (err) return reject(err);
      resolve(posts);
    });
  });
};

const fetchPostsWithRetry = async (limit, offset, maxAttempts = 2) => {
  let attempt = 0;
  while (attempt < maxAttempts) {
    attempt++;
    try {
      const posts = await fetchPosts(limit, offset);
      return posts;
    } catch (error) {
      console.warn(`Intento ${attempt} getPosts falló:`, error.message);
      if (attempt >= maxAttempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
};

exports.getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const authUserId = req.user?.id || null;

    let posts;
    try {
      posts = await fetchPostsWithRetry(limit, offset, 2);
    } catch (err) {
      console.error("getPosts total failed after retry:", err);
      return res.status(500).json({ success: false, message: "Error obteniendo posts" });
    }

    const safePosts = Array.isArray(posts) ? posts : [];

    try {
      const enriched = await Promise.all(safePosts.map(async (post) => {
        try {
          const likeCount = await new Promise((resolve, reject) => {
            likesModel.getLikesCount(post.id, (likeErr, likeCountResult) => {
              if (likeErr) return reject(likeErr);
              resolve(likeCountResult || 0);
            });
          });

          const commentCount = await new Promise((resolve, reject) => {
            commentsModel.getCommentsCount(post.id, (commentErr, commentCountResult) => {
              if (commentErr) return reject(commentErr);
              resolve(commentCountResult || 0);
            });
          });

          let isLiked = false;
          if (authUserId) {
            isLiked = await new Promise((resolve, reject) => {
              likesModel.isPostLikedByUser(authUserId, post.id, (likedErr, likedResult) => {
                if (likedErr) return reject(likedErr);
                resolve(Boolean(likedResult));
              });
            });
          }

          return {
            ...post,
            likes: likeCount,
            commentsCount: commentCount,
            liked: isLiked,
          };
        } catch (itemErr) {
          console.error(`Error enriching post ${post.id}:`, itemErr);
          return {
            ...post,
            likes: 0,
            commentsCount: 0,
            liked: false,
          };
        }
      }));

      return res.json({ success: true, posts: enriched, page, limit });
    } catch (enrichErr) {
      console.error("Error enriching posts:", enrichErr);
      return res.status(500).json({ success: false, message: "Error obteniendo posts" });
    }
  } catch (error) {
    console.error("Error in getPosts:", error);
    return res.status(500).json({ success: false, message: "Error obteniendo posts" });
  }
};

exports.toggleLike = (req, res) => {
  try {
    const userId = req.user?.id;
    const postId = parseInt(req.params.id, 10);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Usuario no autenticado" });
    }
    if (!postId || isNaN(postId)) {
      return res.status(400).json({ success: false, message: "ID de post inválido" });
    }

    likesModel.toggleLike(userId, postId, (err, likeResult) => {
      if (err) {
        console.error("Error toggleLike:", err);
        return res.status(500).json({ success: false, message: "Error toggling like" });
      }

      likesModel.getLikesCount(postId, (err, likeCount) => {
        if (err) {
          console.error("Error getLikesCount:", err);
          return res.status(500).json({ success: false, message: "Error toggling like" });
        }

        return res.json({ success: true, data: { action: likeResult.action, likes: likeCount } });
      });
    });
  } catch (error) {
    console.error("Error toggleLike:", error);
    return res.status(500).json({ success: false, message: "Error toggling like" });
  }
};

exports.getComments = (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    if (!postId || isNaN(postId)) {
      return res.status(400).json({ success: false, message: "ID de post inválido" });
    }

    commentsModel.getComments(postId, (err, comments) => {
      if (err) {
        console.error("Error getComments:", err);
        return res.status(500).json({ success: false, message: "Error obteniendo comentarios" });
      }
      return res.json({ success: true, comments });
    });
  } catch (error) {
    console.error("Error getComments:", error);
    return res.status(500).json({ success: false, message: "Error obteniendo comentarios" });
  }
};

exports.addComment = (req, res) => {
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

    commentsModel.addComment(userId, postId, comment, (err, newComment) => {
      if (err) {
        console.error("Error addComment:", err);
        return res.status(500).json({ success: false, message: "Error creando comentario" });
      }
      return res.json({ success: true, comment: newComment });
    });
  } catch (error) {
    console.error("Error addComment:", error);
    return res.status(500).json({ success: false, message: "Error creando comentario" });
  }
};
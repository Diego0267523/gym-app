const db = require("../config/db");
const postModel = require("../models/postModel");
const likesModel = require("../models/likesModel");
const commentsModel = require("../models/commentsModel");
const cache = require("../utils/cache");

//  Cache config
const CACHE_TTL = 15000; // 15 segundos
const CACHE_PREFIX = 'feed:';

/**
 * Crear un nuevo post
 */
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
        console.error("[PostController] createPost error:", err);
        return res.status(500).json({ success: false, message: "Error al crear post" });
      }

      const postId = result.insertId;

      // Obtener el post completo + datos de usuario para retorno inmediato
      postModel.getPostByIdWithUser(postId, user_id, (err2, newPost) => {
        if (err2) {
  console.error("[PostController] getPostByIdWithUser error:", err2);

  // ⚠️ IMPORTANTE: el post SÍ se creó
  return res.json({
    success: true,
    message: "Post creado (sin datos completos)",
    post: {
      id: postId,
      user_id,
      image_url,
      caption,
      likes: 0,
      commentsCount: 0,
      liked: 0
    }
  });
}

        cache.clearByPrefix(CACHE_PREFIX);

        // Emitir evento de nueva publicación (para Socket.IO)
        process.emit('new_post', { post: newPost });

        return res.json({ success: true, message: "Post creado", post: newPost });
      });
    });
  } catch (error) {
    console.error("[PostController] createPost exception:", error);
    return res.status(500).json({ success: false, message: "Error al crear post" });
  }
};

/**
 *  OPTIMIZADO: Obtener posts con caché + SQL agregado
 * Antes: ~30 queries para 10 posts (1 main + 3 per post)
 * Ahora: 1 query con aggregates + caché
 * Resultado esperado: <500ms en first page, <10ms en cache hit
 */
exports.getPosts = (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const authUserId = req.user?.id || null;

    // Intentar caché (solo para first page)
    const cacheKey = CACHE_PREFIX + `page_${page}_limit_${limit}`;
    if (page === 1) {
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log('[PostController]  Cache HIT for page 1 - 0ms query time');
        return res.json({ success: true, posts: cached, page, limit, cached: true, queryTimeMs: 0 });
      }
    }

    // Inicio del timer de query
    const queryStart = Date.now();

    //  Una sola query en lugar de N+1
    postModel.getPostsWithUserLikeStatus(limit, offset, authUserId, (err, posts) => {
      if (err) {
        console.error("[PostController] getPosts query error:", err);
        return res.status(500).json({ success: false, message: "Error obteniendo posts" });
      }

      const queryTime = Date.now() - queryStart;
      
      // Guardar en caché si es first page
      if (page === 1) {
        cache.set(cacheKey, posts || [], CACHE_TTL);
        console.log(`[PostController] Cached page 1 (${posts?.length || 0} posts, query=${queryTime}ms, ttl=${CACHE_TTL}ms)`);
      }

      return res.json({ 
        success: true, 
        posts: posts || [], 
        page, 
        limit,
        queryTimeMs: queryTime
      });
    });
  } catch (error) {
    console.error("[PostController] getPosts exception:", error);
    return res.status(500).json({ success: false, message: "Error obteniendo posts" });
  }
};

/**
 * Toggle like de un post (con invalidación de caché)
 */
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
        console.error("[PostController] toggleLike error:", err);
        return res.status(500).json({ success: false, message: "Error toggling like" });
      }

      // Invalidar cache al cambiar likes
      cache.clearByPrefix(CACHE_PREFIX);

      likesModel.getLikesCount(postId, (err, likeCount) => {
        if (err) {
          console.error("[PostController] getLikesCount error:", err);
          return res.status(500).json({ success: false, message: "Error toggling like" });
        }

        return res.json({ success: true, data: { action: likeResult.action, likes: likeCount } });
      });
    });
  } catch (error) {
    console.error("[PostController] toggleLike exception:", error);
    return res.status(500).json({ success: false, message: "Error toggling like" });
  }
};

/**
 * Obtener comentarios de un post
 */
exports.getComments = (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    if (!postId || isNaN(postId)) {
      return res.status(400).json({ success: false, message: "ID de post inválido" });
    }

    commentsModel.getComments(postId, (err, comments) => {
      if (err) {
        console.error("[PostController] getComments error:", err);
        return res.status(500).json({ success: false, message: "Error obteniendo comentarios" });
      }
      return res.json({ success: true, comments });
    });
  } catch (error) {
    console.error("[PostController] getComments exception:", error);
    return res.status(500).json({ success: false, message: "Error obteniendo comentarios" });
  }
};

/**
 * Agregar comentario (con invalidación de caché)
 */
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
        console.error("[PostController] addComment error:", err);
        return res.status(500).json({ success: false, message: "Error creando comentario" });
      }
      
      // Invalidar cache al agregar comentario
      cache.clearByPrefix(CACHE_PREFIX);
      
      return res.json({ success: true, comment: newComment });
    });
  } catch (error) {
    console.error("[PostController] addComment exception:", error);
    return res.status(500).json({ success: false, message: "Error creando comentario" });
  }
};

/**
 * Eliminar post (con invalidación de caché)
 */
exports.deletePost = async (req, res) => {
  try {
    const userId = req.user?.id;
    const postId = parseInt(req.params.id, 10);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Usuario no autenticado" });
    }

    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ success: false, message: "ID de post inválido" });
    }

    const [postRows] = await db.promise().query("SELECT id, user_id FROM posts WHERE id = ?", [postId]);
    if (!Array.isArray(postRows) || postRows.length === 0) {
      return res.status(404).json({ success: false, message: "Post no encontrado" });
    }

    const post = postRows[0];
    if (post.user_id !== userId) {
      return res.status(403).json({ success: false, message: "No autorizado para eliminar este post" });
    }

    // Borrado manual de relaciones cuando no hay ON DELETE CASCADE
    await db.promise().query("DELETE FROM comments WHERE post_id = ?", [postId]);
    await db.promise().query("DELETE FROM likes WHERE post_id = ?", [postId]);

    const [deleteResult] = await db.promise().query("DELETE FROM posts WHERE id = ?", [postId]);
    if (!deleteResult || deleteResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Post no encontrado al eliminar" });
    }

    cache.clearByPrefix(CACHE_PREFIX);

    // Emitir evento global para sockets
    process.emit('post_deleted', { postId });

    return res.status(200).json({ success: true, message: "Post eliminado" });
  } catch (error) {
    console.error("[PostController] deletePost exception:", error);
    return res.status(500).json({ success: false, message: error?.message || "Error eliminando post" });
  }
};

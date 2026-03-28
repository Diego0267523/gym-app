const db = require("../config/db");

/**
 * Crear un nuevo post
 * @param {number} user_id User ID
 * @param {string} image_url URL de imagen
 * @param {string} caption Caption del post
 * @param {function} callback Callback(err, result)
 */
exports.createPost = (user_id, image_url, caption, callback) => {
  const sql = `
    INSERT INTO posts (user_id, image_url, caption, created_at)
    VALUES (?, ?, ?, NOW())
  `;
  db.query(sql, [user_id, image_url, caption], callback);
};

/**
 * ⚡ OPTIMIZADO: Obtener posts con aggregates de likes/comments en una sola query
 * Usa LEFT JOIN y COUNT para evitar N+1 queries
 * @param {number} limit Limit
 * @param {number} offset Offset
 * @param {function} callback Callback(err, posts)
 */
exports.getPosts = (limit, offset, callback) => {
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
  const safeOffset = Number.isInteger(offset) && offset >= 0 ? offset : 0;
  
  const sql = `
    SELECT 
      p.id,
      p.user_id,
      p.image_url,
      p.caption,
      p.created_at AS time,
      u.nombre,
      u.avatar,
      COALESCE(COUNT(DISTINCT l.id), 0) AS likes,
      COALESCE(COUNT(DISTINCT c.id), 0) AS commentsCount
    FROM posts p
    INNER JOIN usuarios u ON p.user_id = u.id
    LEFT JOIN likes l ON p.id = l.post_id
    LEFT JOIN comments c ON p.id = c.post_id
    GROUP BY p.id, p.user_id, p.image_url, p.caption, p.created_at, u.id, u.nombre, u.avatar
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  db.query(sql, [safeLimit, safeOffset], (err, posts) => {
    if (err) {
      console.error('[PostModel] Error in getPosts:', err.message);
      return callback(err);
    }
    callback(null, posts || []);
  });
};

/**
 * ⚡ OPTIMIZADO: Obtener posts con info de si el usuario actual los ha likeado
 * (para cuando se necesita info de "current user")
 * @param {number} limit Limit
 * @param {number} offset Offset
 * @param {number} authUserId User ID autenticado (para LEFT JOIN a likes)
 * @param {function} callback Callback(err, posts)
 */
exports.getPostsWithUserLikeStatus = (limit, offset, authUserId, callback) => {
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
  const safeOffset = Number.isInteger(offset) && offset >= 0 ? offset : 0;
  
  const sql = `
    SELECT 
      p.id,
      p.user_id,
      p.image_url,
      p.caption,
      p.created_at AS time,
      u.nombre,
      u.avatar,
      COALESCE(COUNT(DISTINCT l.id), 0) AS likes,
      COALESCE(COUNT(DISTINCT c.id), 0) AS commentsCount,
      IF(MAX(ul.user_id IS NOT NULL), 1, 0) AS liked
    FROM posts p
    INNER JOIN usuarios u ON p.user_id = u.id
    LEFT JOIN likes l ON p.id = l.post_id
    LEFT JOIN comments c ON p.id = c.post_id
    LEFT JOIN likes ul ON p.id = ul.post_id AND ul.user_id = ?
    GROUP BY p.id, p.user_id, p.image_url, p.caption, p.created_at, u.id, u.nombre, u.avatar
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  db.query(sql, [authUserId, safeLimit, safeOffset], (err, posts) => {
    if (err) {
      console.error('[PostModel] Error in getPostsWithUserLikeStatus:', err.message);
      return callback(err);
    }
    callback(null, posts || []);
  });
};

/**
 * Obtener post por ID (con agregates)
 * @param {number} postId Post ID
 * @param {function} callback Callback(err, post)
 */
exports.getPostById = (postId, callback) => {
  const sql = `
    SELECT 
      p.id,
      p.user_id,
      p.image_url,
      p.caption,
      p.created_at AS time,
      COALESCE(COUNT(DISTINCT l.id), 0) AS likes,
      COALESCE(COUNT(DISTINCT c.id), 0) AS commentsCount
    FROM posts p
    LEFT JOIN likes l ON p.id = l.post_id
    LEFT JOIN comments c ON p.id = c.post_id
    WHERE p.id = ?
    GROUP BY p.id, p.user_id, p.image_url, p.caption, p.created_at
  `;
  
  db.query(sql, [postId], (err, rows) => {
    if (err) {
      console.error('[PostModel] Error in getPostById:', err.message);
      return callback(err);
    }
    callback(null, rows?.[0] || null);
  });
};
exports.getPostByIdWithUser = (postId, authUserId, callback) => {
  const sql = `
    SELECT
      p.id,
      p.user_id,
      p.image_url,
      p.caption,
      p.created_at AS time,
      u.nombre,
      u.avatar,
      COALESCE(COUNT(DISTINCT l.id), 0) AS likes,
      COALESCE(COUNT(DISTINCT c.id), 0) AS commentsCount,
      IF(MAX(ul.user_id IS NOT NULL), 1, 0) AS liked
    FROM posts p
    INNER JOIN usuarios u ON p.user_id = u.id
    LEFT JOIN likes l ON p.id = l.post_id
    LEFT JOIN comments c ON p.id = c.post_id
    LEFT JOIN likes ul ON p.id = ul.post_id AND ul.user_id = ?
    WHERE p.id = ?
    GROUP BY p.id, p.user_id, p.image_url, p.caption, p.created_at, u.id, u.nombre, u.avatar
  `;

  db.query(sql, [authUserId, postId], (err, rows) => {
    if (err) {
      console.error('[PostModel] Error in getPostByIdWithUser:', err.message);
      return callback(err);
    }
    callback(null, rows?.[0] || null);
  });
};

/**
 * Eliminar post
 * @param {number} postId Post ID
 * @param {function} callback Callback(err, result)
 */
exports.deletePost = (postId, callback) => {
  const sql = `DELETE FROM posts WHERE id = ?`;
  db.query(sql, [postId], (err, result) => {
    if (err) {
      console.error('[PostModel] Error in deletePost:', err.message);
      return callback(err);
    }
    callback(null, result);
  });
};
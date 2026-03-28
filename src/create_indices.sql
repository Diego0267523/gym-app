-- ⚡ Índices para optimizar /posts endpoint
-- Reducen búsquedas de O(n) a O(log n)

-- Índice en posts(created_at DESC) para ordenamiento rápido
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Índice en posts(user_id) para filtros y joins
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);

-- Índice en likes(post_id) para agregados COUNT
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);

-- Índice compuesto en likes(post_id, user_id) para búsqueda de like específico
CREATE INDEX IF NOT EXISTS idx_likes_post_user ON likes(post_id, user_id);

-- Índice en comments(post_id) para agregados COUNT
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);

-- Índices adicionales para otras operaciones frecuentes
CREATE INDEX IF NOT EXISTS idx_usuarios_id ON usuarios(id);
CREATE INDEX IF NOT EXISTS idx_posts_id ON posts(id);

-- Validar índices creados
SHOW INDEX FROM posts;
SHOW INDEX FROM likes;
SHOW INDEX FROM comments;
SHOW INDEX FROM usuarios;

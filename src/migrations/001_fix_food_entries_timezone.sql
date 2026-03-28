-- Migración: Arreglar manejo de zonas horarias en food_entries
-- Fecha: 2026-03-28
-- Problema: DATE no almacena zona horaria, causando desfases

-- 1. Agregar columna para almacenar zona horaria del usuario
ALTER TABLE food_entries 
ADD COLUMN IF NOT EXISTS user_timezone VARCHAR(50) DEFAULT 'UTC' AFTER user_id,
ADD COLUMN IF NOT EXISTS fecha_utc DATETIME DEFAULT CURRENT_TIMESTAMP AFTER fecha;

-- 2. Migrar datos existentes
UPDATE food_entries 
SET fecha_utc = CONCAT(fecha, ' 00:00:00')
WHERE fecha_utc IS NULL AND fecha IS NOT NULL;

-- 3. Crear índice mejorado para queries eficientes
ALTER TABLE food_entries DROP INDEX IF EXISTS idx_user_fecha;
CREATE INDEX idx_user_fecha_utc ON food_entries (user_id, fecha_utc);

-- 4. Garantizar que created_at esté siempre en UTC
ALTER TABLE food_entries MODIFY created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Nota: La columna 'fecha' se mantiene por compatibilidad, pero no se usa más en queries

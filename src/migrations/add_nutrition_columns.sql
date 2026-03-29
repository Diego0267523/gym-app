-- Migración para agregar columnas nutricionales faltantes a food_entries
-- Ejecutar después de que la tabla food_entries ya exista

ALTER TABLE food_entries
ADD COLUMN grasas DECIMAL(8,2) DEFAULT 0.00 AFTER carbohidratos,
ADD COLUMN fibra DECIMAL(8,2) DEFAULT 0.00 AFTER grasas,
ADD COLUMN sodio DECIMAL(8,2) DEFAULT 0.00 AFTER fibra;
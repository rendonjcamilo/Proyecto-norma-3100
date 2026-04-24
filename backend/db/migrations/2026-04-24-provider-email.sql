-- Migración: agregar campo email a la tabla providers
ALTER TABLE providers ADD COLUMN IF NOT EXISTS email VARCHAR(255);

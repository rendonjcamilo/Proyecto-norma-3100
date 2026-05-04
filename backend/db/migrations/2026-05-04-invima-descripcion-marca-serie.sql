-- Agregar campos descripción, marca y serie a invima_registros
ALTER TABLE invima_registros
  ADD COLUMN IF NOT EXISTS descripcion  TEXT,
  ADD COLUMN IF NOT EXISTS marca        VARCHAR(255),
  ADD COLUMN IF NOT EXISTS serie        VARCHAR(255);

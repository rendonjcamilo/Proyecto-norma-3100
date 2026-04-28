-- Agrega campos de contacto y REPS a la tabla providers
ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS nombre_sede VARCHAR(255),
  ADD COLUMN IF NOT EXISTS codigo_habilitacion VARCHAR(50);

COMMENT ON COLUMN providers.phone IS 'Número de teléfono del prestador (autocompleta desde REPS)';
COMMENT ON COLUMN providers.nombre_sede IS 'Nombre de la sede (autocompleta desde REPS)';
COMMENT ON COLUMN providers.codigo_habilitacion IS 'Código de habilitación REPS del prestador';

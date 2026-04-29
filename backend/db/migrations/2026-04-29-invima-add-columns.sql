-- Agregar columnas faltantes a invima_registros
ALTER TABLE invima_registros
  ADD COLUMN IF NOT EXISTS titular_fabricante   VARCHAR(300),
  ADD COLUMN IF NOT EXISTS titular_importador   VARCHAR(300),
  ADD COLUMN IF NOT EXISTS pais_origen          VARCHAR(100),
  ADD COLUMN IF NOT EXISTS fecha_emision        DATE,
  ADD COLUMN IF NOT EXISTS presentaciones_autorizadas TEXT,
  ADD COLUMN IF NOT EXISTS fuente_datos         VARCHAR(100) DEFAULT 'datos_gov',
  ADD COLUMN IF NOT EXISTS updated_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

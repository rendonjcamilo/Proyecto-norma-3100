-- Agregar fecha de vencimiento de habilitación al prestador
-- Permite alertas automáticas 30 días antes del vencimiento

ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS habilitacion_fecha_vencimiento DATE;

-- Índice para que el cron job consulte eficientemente prestadores próximos a vencer
CREATE INDEX IF NOT EXISTS idx_providers_habilitacion_vencimiento
  ON providers(habilitacion_fecha_vencimiento)
  WHERE habilitacion_fecha_vencimiento IS NOT NULL;

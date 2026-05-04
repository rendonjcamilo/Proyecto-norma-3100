-- Agrega fecha_vencimiento a reps_verificaciones y providers
-- Permite identificar prestadores cuya vigencia REPS está próxima a vencer

ALTER TABLE reps_verificaciones
  ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE;

COMMENT ON COLUMN reps_verificaciones.fecha_vencimiento IS 'Fecha de vencimiento de la vigencia del prestador según REPS (datos.gov.co)';

-- Índice para consultas de alertas de vencimiento próximo
CREATE INDEX IF NOT EXISTS idx_reps_verificaciones_vencimiento
  ON reps_verificaciones (fecha_vencimiento)
  WHERE fecha_vencimiento IS NOT NULL;

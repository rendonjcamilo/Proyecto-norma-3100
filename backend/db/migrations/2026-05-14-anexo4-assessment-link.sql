-- Migración: vincular anexo4_verificaciones con assessments
-- Permite asociar una Verificación H.C. (Anexo 4) a una auditoría específica.

ALTER TABLE anexo4_verificaciones
  ADD COLUMN IF NOT EXISTS assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_anexo4_assessment_id
  ON anexo4_verificaciones(assessment_id)
  WHERE assessment_id IS NOT NULL;

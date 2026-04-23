-- Migración: añadir columnas requeridas por AssessmentService.submitAssessment()
-- a la tabla findings que fue creada originalmente en schema.sql sin estas columnas

ALTER TABLE findings
  ADD COLUMN IF NOT EXISTS assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS assessment_response_id UUID,
  ADD COLUMN IF NOT EXISTS finding_type VARCHAR(50) DEFAULT 'assessment',
  ADD COLUMN IF NOT EXISTS evidence_references JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS semaforo_color VARCHAR(20) DEFAULT 'naranja';

-- Índices útiles para consultas por evaluación
CREATE INDEX IF NOT EXISTS idx_findings_assessment_id ON findings(assessment_id);
CREATE INDEX IF NOT EXISTS idx_findings_finding_type ON findings(finding_type);

-- Migración: Tabla Plan de Mejoramiento (Matriz Plan de Mejora Visita Auditoría)
-- Auto-generada desde hallazgos NC al enviar evaluación

CREATE TABLE IF NOT EXISTS improvement_plan_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id       UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  finding_id          UUID REFERENCES findings(id) ON DELETE SET NULL,
  numero              INTEGER NOT NULL,
  estandar            VARCHAR(255) NOT NULL,
  criterio            TEXT NOT NULL,
  hallazgo_encontrado TEXT NOT NULL,
  actividad_mejora    TEXT,
  responsable         VARCHAR(255),
  fecha_inicio        DATE,
  fecha_terminacion   DATE,
  fecha_ejecucion     DATE,
  observaciones       TEXT,
  seguimiento_1       TEXT,
  seguimiento_2       TEXT,
  seguimiento_3       TEXT,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_improvement_plan_assessment ON improvement_plan_items(assessment_id);
CREATE INDEX IF NOT EXISTS idx_improvement_plan_finding ON improvement_plan_items(finding_id);

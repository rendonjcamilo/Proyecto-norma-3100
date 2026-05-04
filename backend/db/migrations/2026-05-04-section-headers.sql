-- Migración: marcar títulos de sección en evaluation_criteria
-- Estos ítems son encabezados de sección en la Norma 3100, no criterios evaluables.
-- Aparecen en el formulario como divisores visuales (sin Cumple/No Cumple/No Aplica).
BEGIN;

ALTER TABLE evaluation_criteria
  ADD COLUMN IF NOT EXISTS is_section_header BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE evaluation_criteria
SET is_section_header = TRUE
WHERE code IN (
  -- TSTH
  'TSTH-024',
  -- TSINF (12 títulos)
  'TSINF-001', 'TSINF-011', 'TSINF-014', 'TSINF-029', 'TSINF-059',
  'TSINF-149', 'TSINF-155', 'TSINF-156', 'TSINF-162', 'TSINF-166',
  'TSINF-179', 'TSINF-185', 'TSINF-191',
  -- TSDOT
  'TSDOT-039', 'TSDOT-046',
  -- TSPP
  'TSPP-094', 'TSPP-095', 'TSPP-099', 'TSPP-108',
  -- TSHCR
  'TSHCR-011', 'TSHCR-030', 'TSHCR-032', 'TSHCR-038', 'TSHCR-047'
);

-- Recalcular total_criteria en cuestionarios existentes excluyendo títulos de sección
UPDATE questionnaires q
SET total_criteria = (
  SELECT COUNT(*)
  FROM questionnaire_criteria qc
  JOIN evaluation_criteria ec ON qc.criterion_id = ec.id
  WHERE qc.questionnaire_id = q.id
    AND ec.is_section_header = FALSE
);

COMMIT;

-- Migración: crear cuestionarios maestros publicados para annual, year4 y pre-novelty
-- Copian exactamente los mismos 487 criterios del cuestionario inicial (Res. 3100/2019)
BEGIN;

-- annual
INSERT INTO questionnaires (name, version_type, status, total_criteria, created_by)
SELECT
  'Cuestionario Maestro - Evaluación Anual (Res. 3100/2019)',
  'annual',
  'published',
  total_criteria,
  created_by
FROM questionnaires
WHERE version_type = 'initial' AND status = 'published' AND service_id IS NULL
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
SELECT
  (SELECT id FROM questionnaires WHERE version_type = 'annual' AND status = 'published' AND service_id IS NULL LIMIT 1),
  criterion_id
FROM questionnaire_criteria
WHERE questionnaire_id = (
  SELECT id FROM questionnaires WHERE version_type = 'initial' AND status = 'published' AND service_id IS NULL LIMIT 1
)
ON CONFLICT DO NOTHING;

-- year4
INSERT INTO questionnaires (name, version_type, status, total_criteria, created_by)
SELECT
  'Cuestionario Maestro - Evaluación a los 4 Años (Res. 3100/2019)',
  'year4',
  'published',
  total_criteria,
  created_by
FROM questionnaires
WHERE version_type = 'initial' AND status = 'published' AND service_id IS NULL
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
SELECT
  (SELECT id FROM questionnaires WHERE version_type = 'year4' AND status = 'published' AND service_id IS NULL LIMIT 1),
  criterion_id
FROM questionnaire_criteria
WHERE questionnaire_id = (
  SELECT id FROM questionnaires WHERE version_type = 'initial' AND status = 'published' AND service_id IS NULL LIMIT 1
)
ON CONFLICT DO NOTHING;

-- pre-novelty
INSERT INTO questionnaires (name, version_type, status, total_criteria, created_by)
SELECT
  'Cuestionario Maestro - Pre-Novedad (Res. 3100/2019)',
  'pre-novelty',
  'published',
  total_criteria,
  created_by
FROM questionnaires
WHERE version_type = 'initial' AND status = 'published' AND service_id IS NULL
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
SELECT
  (SELECT id FROM questionnaires WHERE version_type = 'pre-novelty' AND status = 'published' AND service_id IS NULL LIMIT 1),
  criterion_id
FROM questionnaire_criteria
WHERE questionnaire_id = (
  SELECT id FROM questionnaires WHERE version_type = 'initial' AND status = 'published' AND service_id IS NULL LIMIT 1
)
ON CONFLICT DO NOTHING;

COMMIT;

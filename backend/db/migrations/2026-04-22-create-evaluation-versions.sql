-- =============================================================================
-- MIGRACIÓN: Crear cuestionarios maestros para todas las versiones de evaluación
-- Fecha: 2026-04-22
-- Resolución 3100 de 2019 — Versiones de evaluación
-- =============================================================================
-- Esta migración clona el cuestionario maestro "Evaluación Inicial" para crear:
-- - Evaluación a los 4 Años (year4)
-- - Evaluación Anual (annual)
-- - Evaluación Previa a Novedad (pre-novelty)
--
-- Todos los cuestionarios maestros contienen los mismos 512 criterios transversales
-- y se identifican por service_id IS NULL

BEGIN;

-- Obtener el ID del cuestionario inicial maestro
WITH initial_questionnaire AS (
    SELECT id, created_by FROM questionnaires
    WHERE version_type = 'initial'
    AND service_id IS NULL
    AND status = 'published'
    LIMIT 1
),

-- Crear los 3 cuestionarios nuevos
new_questionnaires AS (
    INSERT INTO questionnaires (
        name, service_id, version_type, status, total_criteria,
        created_by, created_at, published_at
    )
    SELECT
        CASE
            WHEN version = 'year4' THEN 'Norma 3100 - Cuestionario Maestro - Evaluación a los 4 Años (7 Estándares - 512 Criterios)'
            WHEN version = 'annual' THEN 'Norma 3100 - Cuestionario Maestro - Evaluación Anual (7 Estándares - 512 Criterios)'
            WHEN version = 'pre-novelty' THEN 'Norma 3100 - Cuestionario Maestro - Evaluación Previa a Novedad (7 Estándares - 512 Criterios)'
        END,
        NULL::UUID, -- service_id IS NULL para cuestionarios maestros
        version,
        'published',
        512, -- Todos tienen 512 criterios transversales
        iq.created_by,
        NOW(),
        NOW()
    FROM (
        VALUES ('year4'), ('annual'), ('pre-novelty')
    ) AS v(version)
    CROSS JOIN initial_questionnaire iq
    RETURNING id, version_type
)

-- Copiar los criterios del cuestionario inicial a los nuevos
INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id, created_at)
SELECT
    nq.id,
    qc.criterion_id,
    NOW()
FROM new_questionnaires nq
CROSS JOIN initial_questionnaire iq
JOIN questionnaire_criteria qc ON qc.questionnaire_id = iq.id;

COMMIT;

-- Verificación (ejecutar después de la migración):
-- SELECT version_type, status, COUNT(*) as criterios_count
-- FROM questionnaires
-- LEFT JOIN questionnaire_criteria ON questionnaires.id = questionnaire_criteria.questionnaire_id
-- WHERE service_id IS NULL
-- GROUP BY questionnaires.id, version_type, status
-- ORDER BY version_type;

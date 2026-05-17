-- =============================================================================
-- Corrección: eliminar criterios de servicios específicos del cuestionario maestro
-- Causa: los criterios RXO (sección headers) fueron enlazados accidentalmente
-- al master questionnaire durante la migración 2026-05-09-service-specific-questionnaires.sql
--
-- El cuestionario maestro (service_id IS NULL) debe contener SOLO los 512
-- criterios transversales. Los criterios específicos de servicios (RXO, SF, etc.)
-- pertenecen únicamente a sus propios questionnaires de servicio.
-- =============================================================================

BEGIN;

DELETE FROM questionnaire_criteria qc
USING questionnaires q
JOIN evaluation_criteria ec ON ec.id = qc.criterion_id
WHERE qc.questionnaire_id = q.id
  AND q.service_id IS NULL                 -- cuestionario maestro (transversal)
  AND ec.service_id IS NOT NULL;           -- criterio de servicio específico (no transversal)

COMMIT;

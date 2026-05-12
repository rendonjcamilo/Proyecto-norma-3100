-- =============================================================================
-- Migración: Corregir CEG (criterio extra) y eliminar servicio OBN
-- Fuente de verdad: Archivo_Consolidaddo_Resolucion_3100-2019.xlsx
--
-- 1. CEG: El criterio CEG-DOT-010 ("19,9. Báscula grado médico...") no existe
--    en el Excel. El Excel va directo de 19.8 a 19.10. Se marca como
--    is_section_header=TRUE para excluirlo del conteo (tiene 1 respuesta activa,
--    no se elimina). total_criteria corregido a 105.
--
-- 2. OBN: "Obstetricia Neonatal" no tiene hoja en el Excel de la Norma 3100.
--    Tenía 0 evaluaciones activas. Se elimina completo (criterios + cuestionario
--    + servicio).
-- =============================================================================

BEGIN;

-- =============================================================================
-- PARTE 1: CEG - Marcar CEG-DOT-010 como cabecera (excluir del conteo)
-- =============================================================================
UPDATE evaluation_criteria
SET is_section_header = TRUE
WHERE code = 'CEG-DOT-010';

UPDATE questionnaires
SET total_criteria = 105
WHERE service_id = (SELECT id FROM services WHERE code = 'CEG')
  AND status = 'published';

-- =============================================================================
-- PARTE 2: OBN - Eliminar servicio sin respaldo en Excel
-- =============================================================================

-- Desvincular criterios del cuestionario
DELETE FROM questionnaire_criteria
WHERE questionnaire_id IN (
  SELECT q.id FROM questionnaires q
  JOIN services s ON s.id = q.service_id
  WHERE s.code = 'OBN'
);

-- Eliminar criterios específicos de OBN
DELETE FROM evaluation_criteria
WHERE code LIKE 'OBN-%';

-- Eliminar cuestionario
DELETE FROM questionnaires
WHERE service_id = (SELECT id FROM services WHERE code = 'OBN');

-- Eliminar servicio
DELETE FROM services WHERE code = 'OBN';

COMMIT;

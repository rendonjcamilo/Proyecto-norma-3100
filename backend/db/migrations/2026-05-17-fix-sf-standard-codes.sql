-- =============================================================================
-- Corrección: códigos de estándares SF alineados con fuente de verdad Excel
-- Fuente: docs/Norma 3100/Archivo_Consolidaddo_Resolucion_3100-2019.xlsx hoja 11.3.2.SF
--
-- Cambios:
--   SF_MD  → SF_MED  (Medicamentos, Dispositivos Médicos e Insumos)
--   SF_HCR → SF_HC   (Historia Clínica y Registros)
--
-- Los IDs (UUID) no cambian — solo los códigos de texto.
-- Los criteria UUIDs tampoco cambian, por lo que assessment_responses_detailed
-- y questionnaire_criteria no se ven afectados.
-- =============================================================================

BEGIN;

-- 1. Actualizar código del estándar Medicamentos
UPDATE evaluation_standards
SET code = 'SF_MED'
WHERE code = 'SF_MD'
  AND service_id = '7ac74504-ceb9-4c49-88ad-f3742c14cc10';

-- 2. Actualizar código del estándar Historia Clínica
UPDATE evaluation_standards
SET code = 'SF_HC'
WHERE code = 'SF_HCR'
  AND service_id = '7ac74504-ceb9-4c49-88ad-f3742c14cc10';

-- 3. Actualizar códigos de criterios de Medicamentos (SF-MD-* → SF-MED-*)
UPDATE evaluation_criteria
SET code = REPLACE(code, 'SF-MD-', 'SF-MED-')
WHERE service_id = '7ac74504-ceb9-4c49-88ad-f3742c14cc10'
  AND code LIKE 'SF-MD-%';

-- 4. Actualizar códigos de criterios de Historia Clínica (SF-HCR-* → SF-HC-*)
UPDATE evaluation_criteria
SET code = REPLACE(code, 'SF-HCR-', 'SF-HC-')
WHERE service_id = '7ac74504-ceb9-4c49-88ad-f3742c14cc10'
  AND code LIKE 'SF-HCR-%';

COMMIT;

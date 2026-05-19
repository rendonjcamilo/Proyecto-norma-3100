-- =============================================================================
-- TAS (Transporte Asistencial): corrección completa de estándares y criterios
-- Fuente Excel: hoja '11.6.2.S_TR_AS'
--
-- Estado previo en BD (tras migración 2026-05-13-fix-wrong-standard-assignments):
--   TAS_MD  — existe con 10 criterios MED (TAS-MD-001..010) ← nombre incorrecto
--   TAS_HCR — existe con 12 criterios HC  (TAS-HCR-001..012) ← nombre incorrecto
--   TAS_DOT — tiene 9 criterios MED duplicados (TAS-DOT-057..065, criterios 36-40.1)
--   TAS_PP  — tiene 12 criterios HC duplicados (TAS-PP-009..020, criterios 43-44)
--
-- Correcciones aplicadas:
--   1. Eliminar 9 criterios MED duplicados de TAS_DOT (TAS-DOT-057 a 065)
--   2. Eliminar 12 criterios HC duplicados de TAS_PP  (TAS-PP-009 a 020)
--   3. Renombrar TAS_MD  → TAS_MED (alineación con Excel: TR_AS_MED)
--   4. Renombrar TAS_HCR → TAS_HC  (alineación con Excel: TR_AS_HC)
--   5. Renombrar códigos TAS-MD-*  → TAS-MED-*
--   6. Renombrar códigos TAS-HCR-* → TAS-HC-*
--   7. Eliminar section headers previos de TAS (si existen)
--   8. Insertar 60 encabezados de sección del Excel
--   9. Agregar encabezados al cuestionario TAS
-- =============================================================================

-- ── 1. Eliminar referencias al cuestionario de los criterios MED duplicados ──
DELETE FROM questionnaire_criteria
WHERE criterion_id IN (
  SELECT ec.id FROM evaluation_criteria ec
  JOIN services s ON s.id = ec.service_id
  WHERE s.code = 'TAS'
    AND ec.code IN (
      'TAS-DOT-057','TAS-DOT-058','TAS-DOT-059','TAS-DOT-060','TAS-DOT-061',
      'TAS-DOT-062','TAS-DOT-063','TAS-DOT-064','TAS-DOT-065'
    )
);

-- ── 2. Eliminar referencias al cuestionario de los criterios HC duplicados ───
DELETE FROM questionnaire_criteria
WHERE criterion_id IN (
  SELECT ec.id FROM evaluation_criteria ec
  JOIN services s ON s.id = ec.service_id
  WHERE s.code = 'TAS'
    AND ec.code IN (
      'TAS-PP-009','TAS-PP-010','TAS-PP-011','TAS-PP-012','TAS-PP-013','TAS-PP-014',
      'TAS-PP-015','TAS-PP-016','TAS-PP-017','TAS-PP-018','TAS-PP-019','TAS-PP-020'
    )
);

-- ── 3. Eliminar criterios MED duplicados de evaluation_criteria ───────────────
DELETE FROM evaluation_criteria
WHERE code IN (
  'TAS-DOT-057','TAS-DOT-058','TAS-DOT-059','TAS-DOT-060','TAS-DOT-061',
  'TAS-DOT-062','TAS-DOT-063','TAS-DOT-064','TAS-DOT-065'
)
AND service_id = (SELECT id FROM services WHERE code = 'TAS');

-- ── 4. Eliminar criterios HC duplicados de evaluation_criteria ────────────────
DELETE FROM evaluation_criteria
WHERE code IN (
  'TAS-PP-009','TAS-PP-010','TAS-PP-011','TAS-PP-012','TAS-PP-013','TAS-PP-014',
  'TAS-PP-015','TAS-PP-016','TAS-PP-017','TAS-PP-018','TAS-PP-019','TAS-PP-020'
)
AND service_id = (SELECT id FROM services WHERE code = 'TAS');

-- ── 5. Renombrar estándar TAS_MD → TAS_MED ────────────────────────────────────
UPDATE evaluation_standards SET code = 'TAS_MED'
WHERE code = 'TAS_MD'
  AND service_id = (SELECT id FROM services WHERE code = 'TAS');

-- ── 6. Renombrar estándar TAS_HCR → TAS_HC ────────────────────────────────────
UPDATE evaluation_standards SET code = 'TAS_HC'
WHERE code = 'TAS_HCR'
  AND service_id = (SELECT id FROM services WHERE code = 'TAS');

-- ── 7. Renombrar códigos de criterios TAS-MD-* → TAS-MED-* ───────────────────
UPDATE evaluation_criteria
SET code = REPLACE(code, 'TAS-MD-', 'TAS-MED-')
WHERE service_id = (SELECT id FROM services WHERE code = 'TAS')
  AND code LIKE 'TAS-MD-%';

-- ── 8. Renombrar códigos de criterios TAS-HCR-* → TAS-HC-* ──────────────────
UPDATE evaluation_criteria
SET code = REPLACE(code, 'TAS-HCR-', 'TAS-HC-')
WHERE service_id = (SELECT id FROM services WHERE code = 'TAS')
  AND code LIKE 'TAS-HCR-%';

-- ── 9. Limpiar section headers previos de TAS (idempotente) ──────────────────
DELETE FROM questionnaire_criteria
WHERE criterion_id IN (
  SELECT ec.id FROM evaluation_criteria ec
  JOIN services s ON s.id = ec.service_id
  WHERE s.code = 'TAS' AND ec.is_section_header = true
);

DELETE FROM evaluation_criteria
WHERE service_id = (SELECT id FROM services WHERE code = 'TAS')
  AND is_section_header = true;

-- ── 10. Insertar 60 encabezados de sección ────────────────────────────────────
-- Extraídos de la hoja 11.6.2.S_TR_AS del Excel fuente de verdad
INSERT INTO evaluation_criteria
  (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT v.code, '', v.name, v.name, es.id, s.id, true, 'active', true
FROM (VALUES
  ('TAS_TH',  'TAS-TH-H01',  'Complejidad baja'),
  ('TAS_TH',  'TAS-TH-H02',  'Modalidades extramural y telemedicina - prestador remisor'),
  ('TAS_TH',  'TAS-TH-H03',  'Para ambulancias terrestres:'),
  ('TAS_TH',  'TAS-TH-H04',  'Para ambulancias fluviales y marítimas:'),
  ('TAS_TH',  'TAS-TH-H05',  'Complejidad mediana'),
  ('TAS_TH',  'TAS-TH-H06',  'Modalidades extramural y telemedicina - prestador remisor'),
  ('TAS_TH',  'TAS-TH-H07',  'Para ambulancias terrestres, fluviales y marítimas'),
  ('TAS_TH',  'TAS-TH-H08',  'Para ambulancias fluviales y marítimas'),
  ('TAS_TH',  'TAS-TH-H09',  'Para ambulancias aéreas'),
  ('TAS_TH',  'TAS-TH-H10',  'Complejidades baja y mediana'),
  ('TAS_TH',  'TAS-TH-H11',  'Modalidad de telemedicina - prestador de referencia'),
  ('TAS_INF', 'TAS-INF-H01', 'Complejidad baja'),
  ('TAS_INF', 'TAS-INF-H02', 'Modalidades extramural y telemedicina - prestador remisor'),
  ('TAS_INF', 'TAS-INF-H03', 'Para ambulancias terrestres, fluviales y marítimas'),
  ('TAS_INF', 'TAS-INF-H04', 'Para ambulancias terrestres'),
  ('TAS_INF', 'TAS-INF-H05', 'Carrocería del vehículo'),
  ('TAS_INF', 'TAS-INF-H06', 'Interior del vehículo'),
  ('TAS_INF', 'TAS-INF-H07', 'Sistema sonoro y de comunicaciones'),
  ('TAS_INF', 'TAS-INF-H08', 'Otras condiciones generales de seguridad del vehículo'),
  ('TAS_INF', 'TAS-INF-H09', 'Para ambulancias marítimas y fluviales'),
  ('TAS_INF', 'TAS-INF-H10', 'Condiciones generales de la embarcación'),
  ('TAS_INF', 'TAS-INF-H11', 'Otras condiciones generales de seguridad del vehículo'),
  ('TAS_INF', 'TAS-INF-H12', 'Área del paciente'),
  ('TAS_INF', 'TAS-INF-H13', 'Luces y otros elementos del vehículo'),
  ('TAS_INF', 'TAS-INF-H14', 'Sistema de comunicaciones'),
  ('TAS_INF', 'TAS-INF-H15', 'Complejidad mediana'),
  ('TAS_INF', 'TAS-INF-H16', 'Modalidades extramural y telemedicina - prestador remisor'),
  ('TAS_INF', 'TAS-INF-H17', 'Para ambulancias terrestres'),
  ('TAS_INF', 'TAS-INF-H18', 'Carrocería del vehículo'),
  ('TAS_INF', 'TAS-INF-H19', 'Para ambulancias aéreas:'),
  ('TAS_INF', 'TAS-INF-H20', 'Condiciones generales para cualquier tipo de aeronave'),
  ('TAS_INF', 'TAS-INF-H21', 'Sistema eléctrico'),
  ('TAS_INF', 'TAS-INF-H22', 'Sistema de comunicaciones'),
  ('TAS_INF', 'TAS-INF-H23', 'Complejidades baja y mediana'),
  ('TAS_INF', 'TAS-INF-H24', 'Modalidad de telemedicina - prestador de referencia'),
  ('TAS_DOT', 'TAS-DOT-H01', 'Complejidad baja'),
  ('TAS_DOT', 'TAS-DOT-H02', 'Modalidades extramural y telemedicina - prestador remisor'),
  ('TAS_DOT', 'TAS-DOT-H03', 'Para las ambulancias terrestres, fluviales y marítimas'),
  ('TAS_DOT', 'TAS-DOT-H04', 'Complejidad mediana'),
  ('TAS_DOT', 'TAS-DOT-H05', 'Modalidades extramural y telemedicina - prestador remisor'),
  ('TAS_DOT', 'TAS-DOT-H06', 'Para las ambulancias terrestres, fluviales y marítimas:'),
  ('TAS_DOT', 'TAS-DOT-H07', 'Para ambulancias aéreas'),
  ('TAS_DOT', 'TAS-DOT-H08', 'Complejidades baja y mediana'),
  ('TAS_DOT', 'TAS-DOT-H09', 'Modalidad de telemedicina prestador de referencia'),
  ('TAS_MED', 'TAS-MED-H01', 'Complejidad baja'),
  ('TAS_MED', 'TAS-MED-H02', 'Modalidades extramural y telemedicina - prestador remisor'),
  ('TAS_MED', 'TAS-MED-H03', 'Para las ambulancias terrestres, fluviales y marítimas:'),
  ('TAS_MED', 'TAS-MED-H04', 'Complejidad mediana'),
  ('TAS_MED', 'TAS-MED-H05', 'Modalidades extramural y telemedicina - prestador remisor'),
  ('TAS_MED', 'TAS-MED-H06', 'Para las ambulancias terrestres, fluviales y marítimas:'),
  ('TAS_MED', 'TAS-MED-H07', 'Para ambulancias aéreas'),
  ('TAS_PP',  'TAS-PP-H01',  'Complejidades baja y mediana'),
  ('TAS_PP',  'TAS-PP-H02',  'Modalidades extramural y telemedicina - prestador remisor'),
  ('TAS_PP',  'TAS-PP-H03',  'Para las ambulancias terrestres, fluviales, marítimas y aéreas:'),
  ('TAS_PP',  'TAS-PP-H04',  'Modalidad de telemedicina - prestador de referencia'),
  ('TAS_HC',  'TAS-HC-H01',  'Complejidades baja y mediana'),
  ('TAS_HC',  'TAS-HC-H02',  'Modalidades extramural y telemedicina - prestador remisor'),
  ('TAS_HC',  'TAS-HC-H03',  'Modalidad telemedicina - prestador de referencia'),
  ('TAS_INT', 'TAS-INT-H01', 'Complejidades baja y mediana'),
  ('TAS_INT', 'TAS-INT-H02', 'Modalidades extramural y telemedicina - prestador remisor- prestador de referencia')
) AS v(std_code, code, name)
JOIN evaluation_standards es ON es.code = v.std_code
JOIN services s ON s.id = es.service_id AND s.code = 'TAS'
ON CONFLICT (code, service_id) DO NOTHING;

-- ── 11. Agregar los 60 encabezados al cuestionario TAS ───────────────────────
INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
SELECT q.id, ec.id
FROM questionnaires q
JOIN services s ON s.id = q.service_id
JOIN evaluation_criteria ec ON ec.service_id = s.id
WHERE s.code = 'TAS'
  AND q.version_type = 'initial'
  AND ec.is_section_header = true
  AND ec.code LIKE 'TAS-%-H%'
ON CONFLICT DO NOTHING;

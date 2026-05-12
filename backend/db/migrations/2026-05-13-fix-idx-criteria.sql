-- =============================================================================
-- Migración: Corregir criterios IDX - Imágenes Diagnósticas
-- =============================================================================
-- El Excel de la Norma 3100 tiene DOS secciones para IDX:
--   Sección 1 (filas 6-154):  Radiaciones IONIZANTES   (criterios 1-41)
--   Sección 2 (filas 159+):   Radiaciones NO ionizantes (criterios 1-17, re-numerados)
--
-- La migración 2026-05-09 mezcló ambas secciones en el mismo servicio IDX.
-- Esto causó:
--   - Duplicación de números (1, 2, 3 aparecen dos veces en IDX_TH)
--   - El usuario veía "criterio 7 → criterio 1 → 1.1" al navegar IDX_TH
--
-- Esta migración:
--   1. Elimina los criterios no-ionizantes incorrectamente mezclados
--   2. Agrega sub-criterios faltantes de "2. Cuenta con:" y "3. Disponibilidad de:"
--   3. Marca headers de sección explícitamente en la BD
--   4. Agrega etiquetas de complejidad/modalidad como section headers
--   5. Actualiza questionnaire_criteria y total_criteria
-- =============================================================================

BEGIN;

-- =============================================================================
-- PASO 1: Eliminar criterios no-ionizantes (de la Sección 2 del Excel)
--         mezclados incorrectamente en los estándares ionizantes IDX
-- =============================================================================

-- Eliminar respuestas de evaluaciones existentes para estos criterios
DELETE FROM assessment_responses_detailed
WHERE criterion_id IN (
  SELECT id FROM evaluation_criteria WHERE code IN (
    -- IDX_TH no-ionizante (Excel filas 164-169)
    'IDX-TH-012', 'IDX-TH-013', 'IDX-TH-014', 'IDX-TH-015', 'IDX-TH-016',
    -- IDX_INF no-ionizante (Excel filas 172-183)
    'IDX-INF-029', 'IDX-INF-030', 'IDX-INF-031', 'IDX-INF-032', 'IDX-INF-033',
    'IDX-INF-034', 'IDX-INF-035', 'IDX-INF-036', 'IDX-INF-037', 'IDX-INF-038',
    -- IDX_DOT no-ionizante (Excel filas 186-195)
    'IDX-DOT-021', 'IDX-DOT-022', 'IDX-DOT-023', 'IDX-DOT-024',
    'IDX-DOT-025', 'IDX-DOT-026',
    -- IDX_MD no-ionizante (Excel fila 198)
    'IDX-MD-003',
    -- IDX_PP no-ionizante (Excel filas 200+)
    'IDX-PP-013', 'IDX-PP-014', 'IDX-PP-015', 'IDX-PP-016',
    'IDX-PP-017', 'IDX-PP-018',
    -- IDX_HCR no-ionizante
    'IDX-HCR-009', 'IDX-HCR-010',
    -- IDX_INT no-ionizante
    'IDX-INT-009'
  )
);

-- Eliminar de questionnaire_criteria
DELETE FROM questionnaire_criteria
WHERE criterion_id IN (
  SELECT id FROM evaluation_criteria WHERE code IN (
    'IDX-TH-012', 'IDX-TH-013', 'IDX-TH-014', 'IDX-TH-015', 'IDX-TH-016',
    'IDX-INF-029', 'IDX-INF-030', 'IDX-INF-031', 'IDX-INF-032', 'IDX-INF-033',
    'IDX-INF-034', 'IDX-INF-035', 'IDX-INF-036', 'IDX-INF-037', 'IDX-INF-038',
    'IDX-DOT-021', 'IDX-DOT-022', 'IDX-DOT-023', 'IDX-DOT-024',
    'IDX-DOT-025', 'IDX-DOT-026',
    'IDX-MD-003',
    'IDX-PP-013', 'IDX-PP-014', 'IDX-PP-015', 'IDX-PP-016',
    'IDX-PP-017', 'IDX-PP-018',
    'IDX-HCR-009', 'IDX-HCR-010',
    'IDX-INT-009'
  )
);

-- Eliminar de evaluation_criteria
DELETE FROM evaluation_criteria WHERE code IN (
  'IDX-TH-012', 'IDX-TH-013', 'IDX-TH-014', 'IDX-TH-015', 'IDX-TH-016',
  'IDX-INF-029', 'IDX-INF-030', 'IDX-INF-031', 'IDX-INF-032', 'IDX-INF-033',
  'IDX-INF-034', 'IDX-INF-035', 'IDX-INF-036', 'IDX-INF-037', 'IDX-INF-038',
  'IDX-DOT-021', 'IDX-DOT-022', 'IDX-DOT-023', 'IDX-DOT-024',
  'IDX-DOT-025', 'IDX-DOT-026',
  'IDX-MD-003',
  'IDX-PP-013', 'IDX-PP-014', 'IDX-PP-015', 'IDX-PP-016',
  'IDX-PP-017', 'IDX-PP-018',
  'IDX-HCR-009', 'IDX-HCR-010',
  'IDX-INT-009'
);

-- =============================================================================
-- PASO 2: Marcar explícitamente los headers de sección en la BD
--         (ya auto-detectados por ':' en el frontend, pero buena práctica
--          marcarlos para que total_criteria sea exacto)
-- =============================================================================
UPDATE evaluation_criteria SET is_section_header = TRUE
WHERE code IN (
  -- IDX_TH
  'IDX-TH-002',  -- '2. Cuenta con:'
  'IDX-TH-003',  -- '3. Disponibilidad de:'
  'IDX-TH-004',  -- '4. Cumple con... adicionalmente cuenta con:'
  'IDX-TH-007',  -- '5. Cumple con... adicionalmente cuenta con:'
  -- IDX_INF
  'IDX-INF-001', -- '8. Cumple con... adicionalmente cuenta con:'
  'IDX-INF-005', -- '9. Disponibilidad de:'
  'IDX-INF-009', -- '10. Cuando se realicen... adicionalmente cuenta con:'
  'IDX-INF-013', -- '12. Cuando se realicen... cuenta con:'
  'IDX-INF-020', -- '15. Cuando se realicen procedimientos de radiología intervencionista... cuenta con:'
  -- IDX_DOT
  'IDX-DOT-002', -- '19. Cuenta con:'
  'IDX-DOT-005', -- '19.3. Elementos de protección... especificaciones del equipo:'
  'IDX-DOT-010', -- '20. Adicional... procedimientos invasivos... cuenta con:'
  'IDX-DOT-012', -- '21. Adicional... procedimientos especiales menores... cuenta con:'
  'IDX-DOT-016', -- '23. Cumple con... adicionalmente cuenta con:'
  -- IDX_PP
  'IDX-PP-001',  -- '28. Cumple con... información documentada:'
  'IDX-PP-007',  -- '29. Cumple con... información documentada:'
  'IDX-PP-009',  -- '30. Cumple con... información documentada:'
  'IDX-PP-011',  -- '31. Adicional... información documentada:'
  -- IDX_HCR
  'IDX-HCR-001', -- '33. Cumple con... registros:'
  -- IDX_INT
  'IDX-INT-004'  -- '39. Cuando se realicen... disponibilidad de:'
);

-- =============================================================================
-- PASO 3: Agregar sub-criterios FALTANTES de IDX_TH Complejidad baja
--         (existían en el Excel filas 10 y 12 pero no en la BD)
-- =============================================================================

-- Sub-criterio de "2. Cuenta con:" (Excel fila 10, Estado=NC en ejemplo)
INSERT INTO evaluation_criteria
  (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT
  'IDX-TH-002A', '2.1',
  'Técnico profesional o tecnólogo en imágenes diagnósticas, para la operación de equipos y adquisición de imágenes.',
  'Técnico profesional o tecnólogo en imágenes diagnósticas, para la operación de equipos y adquisición de imágenes.',
  es.id, s.id, true, 'active'
FROM evaluation_standards es
JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_TH' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

-- Sub-criterio de "3. Disponibilidad de:" (Excel fila 12, Estado=NA en ejemplo)
INSERT INTO evaluation_criteria
  (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT
  'IDX-TH-003A', '3.1',
  'Médico especializado en radiología e imágenes diagnósticas o aquellos médicos especialistas quienes en su pensum o formación académica hayan adquirido los conocimientos del manejo e interpretación del espectro electromagnético, del ultrasonido especialmente, así como de las radiaciones ionizantes para establecer el diagnóstico y/o el tratamiento de las enfermedades inherentes a sus especialidades, para lo cual deberán acreditar el respectivo certificado. La interpretación de las radiografías e imágenes diagnósticas y la supervisión del técnico profesional o tecnólogo en imágenes diagnósticas es realizada por dichos profesionales.',
  'Médico especializado en radiología e imágenes diagnósticas o aquellos médicos especialistas quienes en su pensum o formación académica hayan adquirido los conocimientos del manejo e interpretación del espectro electromagnético, del ultrasonido especialmente, así como de las radiaciones ionizantes para establecer el diagnóstico y/o el tratamiento de las enfermedades inherentes a sus especialidades, para lo cual deberán acreditar el respectivo certificado. La interpretación de las radiografías e imágenes diagnósticas y la supervisión del técnico profesional o tecnólogo en imágenes diagnósticas es realizada por dichos profesionales.',
  es.id, s.id, true, 'active'
FROM evaluation_standards es
JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_TH' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

-- =============================================================================
-- PASO 4: Agregar etiquetas de complejidad/modalidad como section headers
--         Los códigos usan sufijos A/B para ordenar ANTES de los criterios
--         que introducen (el backend ordena por ec.code ASC)
--
-- Convención de nombres:
--   IDX-TH-000A, 000B → antes de IDX-TH-001 (criterio 1, Complejidad baja)
--   IDX-TH-003B, 003C → después de IDX-TH-003A, antes de IDX-TH-004 (Complejidad mediana)
--   IDX-TH-006A, 006B → después de IDX-TH-006, antes de IDX-TH-007 (Complejidades mediana y alta)
--   IDX-TH-009A, 009B → después de IDX-TH-009, antes de IDX-TH-010 (Complejidad baja, mediana y alta)
-- =============================================================================

-- ---- IDX_TH section headers ----
INSERT INTO evaluation_criteria
  (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-TH-000A', '', 'Complejidad baja', 'Complejidad baja',
  es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_TH' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria
  (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-TH-000B', '', 'Modalidades intramural, extramural unidad móvil, telemedicina - prestador remisor',
  'Modalidades intramural, extramural unidad móvil, telemedicina - prestador remisor',
  es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_TH' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria
  (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-TH-003B', '', 'Complejidad mediana', 'Complejidad mediana',
  es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_TH' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria
  (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-TH-003C', '', 'Modalidades extramural unidad móvil, telemedicina - prestador remisor',
  'Modalidades extramural unidad móvil, telemedicina - prestador remisor',
  es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_TH' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria
  (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-TH-006A', '', 'Complejidades mediana y alta', 'Complejidades mediana y alta',
  es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_TH' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria
  (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-TH-006B', '', 'Modalidades intramural, telemedicina - prestador remisor',
  'Modalidades intramural, telemedicina - prestador remisor',
  es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_TH' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria
  (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-TH-009A', '', 'Complejidad baja, mediana y alta', 'Complejidad baja, mediana y alta',
  es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_TH' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria
  (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-TH-009B', '', 'Modalidad telemedicina - prestador de referencia',
  'Modalidad telemedicina - prestador de referencia',
  es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_TH' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

-- ---- IDX_INF section headers ----
-- IDX-INF-000A, 000B → antes de IDX-INF-001 (criterio 8)
-- IDX-INF-008A, 008B → después de IDX-INF-008 (9.3), antes de IDX-INF-009 (criterio 10)
-- IDX-INF-011A, 011B → después de IDX-INF-011 (10.2), antes de IDX-INF-012 (criterio 11)
-- IDX-INF-017A, 017B → después de IDX-INF-017 (12.4), antes de IDX-INF-018 (criterio 13)
-- IDX-INF-026A, 026B → después de IDX-INF-026 (15.6), antes de IDX-INF-027 (criterio 16)
-- IDX-INF-027A, 027B → después de IDX-INF-027 (criterio 16), antes de IDX-INF-028 (criterio 17)

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-INF-000A', '', 'Complejidades baja, mediana y alta', 'Complejidades baja, mediana y alta', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_INF' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-INF-000B', '', 'Modalidades intramural, telemedicina - prestador remisor', 'Modalidades intramural, telemedicina - prestador remisor', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_INF' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-INF-008A', '', 'Complejidad baja', 'Complejidad baja', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_INF' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-INF-008B', '', 'Modalidades intramural, telemedicina - prestador remisor', 'Modalidades intramural, telemedicina - prestador remisor', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_INF' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-INF-011A', '', 'Complejidad mediana', 'Complejidad mediana', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_INF' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-INF-011B', '', 'Modalidades intramural, telemedicina - prestador remisor', 'Modalidades intramural, telemedicina - prestador remisor', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_INF' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-INF-017A', '', 'Complejidad alta', 'Complejidad alta', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_INF' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-INF-017B', '', 'Modalidades intramural, telemedicina - prestador remisor', 'Modalidades intramural, telemedicina - prestador remisor', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_INF' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-INF-026A', '', 'Complejidades baja y mediana', 'Complejidades baja y mediana', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_INF' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-INF-026B', '', 'Modalidades extramural unidad móvil, telemedicina - prestador remisor', 'Modalidades extramural unidad móvil, telemedicina - prestador remisor', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_INF' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-INF-027A', '', 'Complejidades baja, mediana y alta', 'Complejidades baja, mediana y alta', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_INF' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-INF-027B', '', 'Modalidad telemedicina - prestador de referencia', 'Modalidad telemedicina - prestador de referencia', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_INF' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

-- ---- IDX_DOT section headers ----
-- IDX-DOT-000A, 000B → antes de IDX-DOT-001 (criterio 18, Complejidad baja)
-- IDX-DOT-009A, 009B → después de IDX-DOT-009 (19.3.4), antes de IDX-DOT-010 (Complejidades mediana y alta)
-- IDX-DOT-015A, 015B → después de IDX-DOT-015 (criterio 22), antes de IDX-DOT-016 (criterio 23, extramural)
-- IDX-DOT-018A, 018B, 018C → después de IDX-DOT-018 (23.2), antes de IDX-DOT-019 (telemedicina)

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-DOT-000A', '', 'Complejidad baja', 'Complejidad baja', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_DOT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-DOT-000B', '', 'Modalidades intramural, telemedicina - prestador remisor', 'Modalidades intramural, telemedicina - prestador remisor', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_DOT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-DOT-009A', '', 'Complejidades mediana y alta', 'Complejidades mediana y alta', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_DOT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-DOT-009B', '', 'Modalidades intramural, telemedicina - prestador remisor', 'Modalidades intramural, telemedicina - prestador remisor', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_DOT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-DOT-015A', '', 'Complejidades baja y mediana', 'Complejidades baja y mediana', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_DOT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-DOT-015B', '', 'Modalidades extramural unidad móvil, telemedicina - prestador remisor', 'Modalidades extramural unidad móvil, telemedicina - prestador remisor', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_DOT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-DOT-018A', '', 'Complejidades baja, mediana y alta', 'Complejidades baja, mediana y alta', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_DOT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-DOT-018B', '', 'Modalidad telemedicina - prestador remisor', 'Modalidad telemedicina - prestador remisor', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_DOT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-DOT-019A', '', 'Modalidad telemedicina - prestador de referencia', 'Modalidad telemedicina - prestador de referencia', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_DOT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

-- ---- IDX_MD section headers ----
INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-MD-000A', '', 'Complejidades baja, mediana y alta', 'Complejidades baja, mediana y alta', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_MD' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-MD-000B', '', 'Modalidades intramural, telemedicina - prestador remisor', 'Modalidades intramural, telemedicina - prestador remisor', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_MD' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-MD-001A', '', 'Complejidades mediana y alta', 'Complejidades mediana y alta', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_MD' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-MD-001B', '', 'Modalidades intramural, telemedicina - prestador remisor', 'Modalidades intramural, telemedicina - prestador remisor', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_MD' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

-- ---- IDX_PP section headers ----
INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-PP-000A', '', 'Complejidad baja', 'Complejidad baja', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_PP' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-PP-000B', '', 'Modalidades intramural, telemedicina - prestador remisor', 'Modalidades intramural, telemedicina - prestador remisor', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_PP' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-PP-006A', '', 'Complejidad mediana', 'Complejidad mediana', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_PP' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-PP-006B', '', 'Modalidades intramural, telemedicina - prestador remisor', 'Modalidades intramural, telemedicina - prestador remisor', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_PP' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-PP-008A', '', 'Complejidad alta', 'Complejidad alta', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_PP' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-PP-008B', '', 'Modalidades intramural, telemedicina - prestador remisor', 'Modalidades intramural, telemedicina - prestador remisor', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_PP' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-PP-010A', '', 'Complejidades baja y mediana', 'Complejidades baja y mediana', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_PP' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-PP-010B', '', 'Modalidades extramural unidad móvil, telemedicina - prestador remisor', 'Modalidades extramural unidad móvil, telemedicina - prestador remisor', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_PP' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-PP-011A', '', 'Complejidades baja, mediana y alta', 'Complejidades baja, mediana y alta', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_PP' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-PP-011B', '', 'Modalidad telemedicina - prestador de referencia', 'Modalidad telemedicina - prestador de referencia', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_PP' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

-- ---- IDX_HCR section headers ----
INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-HCR-000A', '', 'Complejidades baja, mediana y alta', 'Complejidades baja, mediana y alta', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_HCR' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-HCR-000B', '', 'Modalidades intramural, telemedicina - prestador remisor', 'Modalidades intramural, telemedicina - prestador remisor', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_HCR' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-HCR-006A', '', 'Complejidades baja y mediana', 'Complejidades baja y mediana', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_HCR' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-HCR-006B', '', 'Modalidades extramural unidad móvil, telemedicina - prestador remisor', 'Modalidades extramural unidad móvil, telemedicina - prestador remisor', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_HCR' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-HCR-007A', '', 'Complejidades baja, mediana y alta', 'Complejidades baja, mediana y alta', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_HCR' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-HCR-007B', '', 'Modalidad telemedicina - prestador de referencia', 'Modalidad telemedicina - prestador de referencia', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_HCR' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

-- ---- IDX_INT section headers ----
INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-INT-000A', '', 'Complejidad baja', 'Complejidad baja', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_INT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-INT-000B', '', 'Modalidad intramural', 'Modalidad intramural', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_INT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-INT-002A', '', 'Complejidades mediana y alta', 'Complejidades mediana y alta', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_INT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-INT-002B', '', 'Modalidad intramural', 'Modalidad intramural', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_INT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-INT-006A', '', 'Complejidad baja, mediana y alta', 'Complejidad baja, mediana y alta', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_INT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-INT-006B', '', 'Modalidad extramural unidad móvil', 'Modalidad extramural unidad móvil', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_INT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-INT-007A', '', 'Complejidad baja, mediana y alta', 'Complejidad baja, mediana y alta', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_INT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-INT-007B', '', 'Modalidad telemedicina – prestador remisor – prestador de referencia',
  'Modalidad telemedicina – prestador remisor – prestador de referencia', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id WHERE es.code = 'IDX_INT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

-- =============================================================================
-- PASO 5: Vincular TODOS los nuevos criterios IDX al cuestionario publicado de IDX
--         (tanto sub-criterios evaluables como section headers)
--         ON CONFLICT DO NOTHING por el UNIQUE(questionnaire_id, criterion_id)
-- =============================================================================
INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
SELECT q.id, ec.id
FROM questionnaires q
JOIN services s ON s.id = q.service_id AND s.code = 'IDX'
JOIN evaluation_criteria ec ON ec.service_id = s.id
WHERE q.status = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM questionnaire_criteria qc
    WHERE qc.questionnaire_id = q.id AND qc.criterion_id = ec.id
  );

-- =============================================================================
-- PASO 6: Recalcular total_criteria para el cuestionario IDX
--         (solo criterios evaluables, excluye is_section_header)
-- =============================================================================
UPDATE questionnaires q
SET total_criteria = (
  SELECT COUNT(*)
  FROM questionnaire_criteria qc
  JOIN evaluation_criteria ec ON qc.criterion_id = ec.id
  WHERE qc.questionnaire_id = q.id
    AND ec.is_section_header = FALSE
)
WHERE q.service_id IN (SELECT id FROM services WHERE code = 'IDX');

COMMIT;

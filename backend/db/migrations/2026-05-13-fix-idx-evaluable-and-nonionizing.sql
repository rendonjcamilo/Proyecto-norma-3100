-- =============================================================================
-- Migración: Corregir criterios IDX - Imágenes Diagnósticas
-- Fuente de verdad: Archivo_Consolidaddo_Resolucion_3100-2019.xlsx (hoja 11.3.4.S_IDx)
--
-- El Excel tiene DOS secciones en el mismo servicio IDX:
--   Sección 1 (criterios 1-41):  Radiaciones IONIZANTES
--   Sección 2 (criterios 1-17):  Radiaciones NO IONIZANTES
--
-- Problemas actuales en BD:
--   1. 18 criterios de la sección 1 están marcados como is_section_header=TRUE
--      pero en el Excel son evaluables (tienen Estado C/NC/NA).
--   2. Los 31 criterios de la sección 2 (no ionizantes) fueron borrados por
--      la migración anterior. Deben restaurarse.
--
-- Códigos de sección 2: prefijo IDX-NI- para no colisionar con sección 1.
-- =============================================================================

BEGIN;

-- =============================================================================
-- PASO 1: Marcar como EVALUABLES los 18 criterios de sección 1
--         que fueron incorrectamente marcados como section_header
-- =============================================================================
UPDATE evaluation_criteria SET is_section_header = FALSE
WHERE code IN (
  -- IDX_TH
  'IDX-TH-002',   -- 2. Cuenta con:
  'IDX-TH-003',   -- 3. Disponibilidad de:
  'IDX-TH-004',   -- 4. Cumple con... adicionalmente cuenta con:
  'IDX-TH-007',   -- 5. Cumple con... adicionalmente cuenta con:
  -- IDX_INF
  'IDX-INF-001',  -- 8. Cumple con...
  'IDX-INF-005',  -- 9. Disponibilidad de:
  'IDX-INF-009',  -- 10. Cuando se realicen procedimientos de radiología...
  'IDX-INF-013',  -- 12. Cuando se realicen procedimientos con medio de contraste...
  'IDX-INF-020',  -- 15. Cuando se realicen procedimientos de radiología intervencionista...
  -- IDX_DOT
  'IDX-DOT-002',  -- 19. Cuenta con:
  'IDX-DOT-005',  -- 19.3. Elementos de protección radiológica...
  'IDX-DOT-010',  -- 20. Adicional... procedimientos invasivos...
  'IDX-DOT-012',  -- 21. Adicional... procedimientos especiales menores...
  'IDX-DOT-016',  -- 23. Cumple con... modalidad intramural...
  -- IDX_PP
  'IDX-PP-001',   -- 28. Cumple con... información documentada:
  'IDX-PP-007',   -- 29. Cumple con... información documentada:
  'IDX-PP-009',   -- 30. Cumple con... información documentada:
  'IDX-PP-011',   -- 31. Adicional... información documentada:
  -- IDX_HCR
  'IDX-HCR-001',  -- 33. Cumple con... registros:
  -- IDX_INT
  'IDX-INT-004'   -- 39. Cuando se realicen procedimientos con medio de contraste...
);

-- =============================================================================
-- PASO 2: Header separador de secciones - antes de los no ionizantes
-- =============================================================================
INSERT INTO evaluation_criteria
  (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-NI-SEP', '', '── Sección: Radiaciones NO Ionizantes ──',
  'Los criterios siguientes aplican a servicios de imágenes diagnósticas con equipos de radiaciones NO ionizantes (ecografía, resonancia magnética, etc.)',
  es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_TH' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

-- =============================================================================
-- PASO 3: Agregar criterios NO IONIZANTES (sección 2, criterios 1-17)
--         Códigos: IDX-NI-[STANDARD]-[SEQ]
-- =============================================================================

-- ── IDX_TH No Ionizantes (criterios 1, 1.1, 1.2, 2, 3) ──────────────────────

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-NI-TH-H01', '', 'Complejidad mediana',
  'Complejidad mediana', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_TH' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-NI-TH-H02', '', 'Modalidades intramural, extramural jornada de salud, unidad móvil y domiciliaria',
  'Modalidades intramural, extramural jornada de salud, unidad móvil y domiciliaria', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_TH' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-TH-001', '1',
  '1. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente, cuenta con:',
  '1. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente, cuenta con:',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_TH' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-TH-002', '1.1',
  '1.1. Médico especializado en radiología e imágenes diagnósticas o aquellos médicos especialistas quienes en su pensum o formación académica hayan adquirido los conocimientos del manejo e interpretación del espectro electromagnético, del ultrasonido especialmente.',
  '1.1. Médico especializado en radiología e imágenes diagnósticas o aquellos médicos especialistas quienes en su pensum o formación académica hayan adquirido los conocimientos del manejo e interpretación del espectro electromagnético, del ultrasonido especialmente.',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_TH' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-TH-003', '1.2',
  '1.2. Cuando se realice resonancia magnética y ultrasonido cuenta con Técnico en imágenes diagnósticas o Tecnólogo en radiología e imágenes diagnósticas.',
  '1.2. Cuando se realice resonancia magnética y ultrasonido cuenta con Técnico en imágenes diagnósticas o Tecnólogo en radiología e imágenes diagnósticas.',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_TH' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-NI-TH-H03', '', 'Modalidad telemedicina - prestador de referencia',
  'Modalidad telemedicina - prestador de referencia', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_TH' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-TH-004', '2',
  '2. Cumple con los criterios que le sean aplicables de todos los servicios.',
  '2. Cumple con los criterios que le sean aplicables de todos los servicios.',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_TH' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-TH-005', '3',
  '3. La interpretación de las imágenes diagnósticas es realizada médico especializado en radiología e imágenes diagnósticas.',
  '3. La interpretación de las imágenes diagnósticas es realizada médico especializado en radiología e imágenes diagnósticas.',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_TH' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

-- ── IDX_INF No Ionizantes (criterios 4-7) ────────────────────────────────────

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-NI-INF-H01', '', 'Complejidad mediana',
  'Complejidad mediana', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_INF' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-NI-INF-H02', '', 'Modalidades intramural, extramural unidad móvil, telemedicina - prestador remisor',
  'Modalidades intramural, extramural unidad móvil, telemedicina - prestador remisor', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_INF' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-INF-001', '4',
  '4. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente cuenta con:',
  '4. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente cuenta con:',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_INF' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-INF-002', '4.1',
  '4.1 Ambiente exclusivo para el equipo generador de radiación no ionizante. La dimensión de este ambiente debe ser acorde al tipo de equipo, su ficha técnica y a los procedimientos que se realicen.',
  '4.1 Ambiente exclusivo para el equipo generador de radiación no ionizante. La dimensión de este ambiente debe ser acorde al tipo de equipo, su ficha técnica y a los procedimientos que se realicen.',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_INF' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-INF-003', '4.2',
  '4.2 Unidad sanitaria, cuando el procedimiento lo requiera.',
  '4.2 Unidad sanitaria, cuando el procedimiento lo requiera.',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_INF' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-INF-004', '5',
  '5. Disponibilidad de:',
  '5. Disponibilidad de:',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_INF' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-INF-005', '5.1',
  '5.1 Vestidor para pacientes y área para casilleros, cuando el procedimiento lo requiera.',
  '5.1 Vestidor para pacientes y área para casilleros, cuando el procedimiento lo requiera.',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_INF' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-INF-006', '5.2',
  '5.2 Área para almacenamiento de dispositivos médicos e insumos.',
  '5.2 Área para almacenamiento de dispositivos médicos e insumos.',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_INF' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-INF-007', '5.3',
  '5.3 Sala de espera.',
  '5.3 Sala de espera.',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_INF' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-INF-008', '5.4',
  '5.4 Unidades sanitarias discriminadas por sexo.',
  '5.4 Unidades sanitarias discriminadas por sexo.',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_INF' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-NI-INF-H03', '', 'Modalidades extramural jornada de salud, domiciliaria, telemedicina - prestador remisor',
  'Modalidades extramural jornada de salud, domiciliaria, telemedicina - prestador remisor', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_INF' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-INF-009', '6',
  '6. Cumple con los criterios que le sean aplicables de todos los servicios.',
  '6. Cumple con los criterios que le sean aplicables de todos los servicios.',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_INF' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-NI-INF-H04', '', 'Modalidad telemedicina - prestador de referencia',
  'Modalidad telemedicina - prestador de referencia', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_INF' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-INF-010', '7',
  '7. Cumple con los criterios que le sean aplicables de todos los servicios.',
  '7. Cumple con los criterios que le sean aplicables de todos los servicios.',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_INF' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

-- ── IDX_DOT No Ionizantes (criterios 8-11) ───────────────────────────────────

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-NI-DOT-H01', '', 'Complejidad mediana',
  'Complejidad mediana', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_DOT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-NI-DOT-H02', '', 'Modalidades intramural, telemedicina - prestador remisor',
  'Modalidades intramural, telemedicina - prestador remisor', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_DOT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-DOT-001', '8',
  '8. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente cuenta con:',
  '8. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente cuenta con:',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_DOT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-DOT-002', '8.1',
  '8.1 Cuenta con él o los equipos generadores de radiaciones no ionizantes, según los exámenes diagnósticos realizados.',
  '8.1 Cuenta con él o los equipos generadores de radiaciones no ionizantes, según los exámenes diagnósticos realizados.',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_DOT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-DOT-003', '8.2',
  '8.2 Cuando se realice resonancia magnética y ultrasonido cuenta con pantalla o monitor grado médico para imágenes radiológicas.',
  '8.2 Cuando se realice resonancia magnética y ultrasonido cuenta con pantalla o monitor grado médico para imágenes radiológicas.',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_DOT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-NI-DOT-H03', '', 'Modalidades extramural unidad móvil, domiciliaria y jornada de salud, telemedicina - prestador remisor',
  'Modalidades extramural unidad móvil, domiciliaria y jornada de salud, telemedicina - prestador remisor', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_DOT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-DOT-004', '9',
  '9. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente, el o los equipos generadores de radiaciones no ionizantes, según los exámenes diagnósticos realizados, cuyas indicaciones del fabricante refieran que está diseñado para ser instalado y operado en una unidad móvil.',
  '9. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente, el o los equipos generadores de radiaciones no ionizantes, según los exámenes diagnósticos realizados, cuyas indicaciones del fabricante refieran que está diseñado para ser instalado y operado en una unidad móvil.',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_DOT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-NI-DOT-H04', '', 'Modalidad telemedicina - prestador remisor',
  'Modalidad telemedicina - prestador remisor', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_DOT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-DOT-005', '10',
  '10. Cumple con los criterios que le sean aplicables de todos los servicios y los de la modalidad intramural y adicionalmente cuenta con equipo de captura y transmisión de datos e imágenes.',
  '10. Cumple con los criterios que le sean aplicables de todos los servicios y los de la modalidad intramural y adicionalmente cuenta con equipo de captura y transmisión de datos e imágenes.',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_DOT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-NI-DOT-H05', '', 'Modalidad telemedicina - prestador de referencia',
  'Modalidad telemedicina - prestador de referencia', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_DOT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-DOT-006', '11',
  '11. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente, cuenta con pantalla o monitor grado médico para imágenes radiológicas.',
  '11. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente, cuenta con pantalla o monitor grado médico para imágenes radiológicas.',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_DOT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

-- ── IDX_MD No Ionizantes (criterio 12) ───────────────────────────────────────

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-NI-MD-H01', '', 'Complejidad mediana',
  'Complejidad mediana', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_MD' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-NI-MD-H02', '', 'Modalidades intramural y extramural unidad móvil, domiciliaria y jornada de salud, telemedicina - prestador remisor',
  'Modalidades intramural y extramural unidad móvil, domiciliaria y jornada de salud, telemedicina - prestador remisor', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_MD' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-MD-001', '12',
  '12. Cumple con los criterios que le sean aplicables de todos los servicios.',
  '12. Cumple con los criterios que le sean aplicables de todos los servicios.',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_MD' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

-- ── IDX_PP No Ionizantes (criterios 13-14) ───────────────────────────────────

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-NI-PP-H01', '', 'Complejidad mediana',
  'Complejidad mediana', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_PP' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-NI-PP-H02', '', 'Modalidades intramural, extramural unidad móvil, domiciliaria y jornada de salud, telemedicina - prestador remisor',
  'Modalidades intramural, extramural unidad móvil, domiciliaria y jornada de salud, telemedicina - prestador remisor', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_PP' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-PP-001', '13',
  '13. Cumplen con los criterios definidos para todos los servicios y adicionalmente, cuenta con la siguiente información documentada:',
  '13. Cumplen con los criterios definidos para todos los servicios y adicionalmente, cuenta con la siguiente información documentada:',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_PP' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-PP-002', '13.1',
  '13.1 Procedimientos para la realización de los exámenes diagnósticos.',
  '13.1 Procedimientos para la realización de los exámenes diagnósticos.',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_PP' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-PP-003', '13.2',
  '13.2 Instrucciones a los pacientes sobre la preparación de los procedimientos diagnósticos.',
  '13.2 Instrucciones a los pacientes sobre la preparación de los procedimientos diagnósticos.',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_PP' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-PP-004', '13.3',
  '13.3 Verificación de la calidad de imagen cuando aplique, que incluye la toma de medidas preventivas y correctivas.',
  '13.3 Verificación de la calidad de imagen cuando aplique, que incluye la toma de medidas preventivas y correctivas.',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_PP' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-PP-005', '13.4',
  '13.4 Control de calidad del equipo cuando aplique, que incluye la toma de medidas correctivas.',
  '13.4 Control de calidad del equipo cuando aplique, que incluye la toma de medidas correctivas.',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_PP' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-NI-PP-H03', '', 'Modalidad telemedicina - prestador de referencia',
  'Modalidad telemedicina - prestador de referencia', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_PP' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-PP-006', '14',
  '14. Cumple con los criterios que le sean aplicables de todos los servicios.',
  '14. Cumple con los criterios que le sean aplicables de todos los servicios.',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_PP' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

-- ── IDX_HCR No Ionizantes (criterios 15-16) ──────────────────────────────────

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-NI-HCR-H01', '', 'Complejidad mediana',
  'Complejidad mediana', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_HCR' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-NI-HCR-H02', '', 'Modalidades intramural, extramural unidad móvil, domiciliaria y jornada de salud, telemedicina - prestador remisor',
  'Modalidades intramural, extramural unidad móvil, domiciliaria y jornada de salud, telemedicina - prestador remisor', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_HCR' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-HCR-001', '15',
  '15. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente, cuenta con los siguientes registros: Procedimientos para la realización de los exámenes diagnósticos.',
  '15. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente, cuenta con los siguientes registros: Procedimientos para la realización de los exámenes diagnósticos.',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_HCR' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-NI-HCR-H03', '', 'Modalidad telemedicina - prestador de referencia',
  'Modalidad telemedicina - prestador de referencia', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_HCR' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-HCR-002', '16',
  '16. Cumple con los criterios que le sean aplicables de todos los servicios.',
  '16. Cumple con los criterios que le sean aplicables de todos los servicios.',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_HCR' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

-- ── IDX_INT No Ionizantes (criterio 17) ──────────────────────────────────────

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-NI-INT-H01', '', 'Complejidad mediana',
  'Complejidad mediana', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_INT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT 'IDX-NI-INT-H02', '', 'Modalidades intramural, extramural unidad móvil, domiciliaria y jornada de salud, telemedicina - prestador remisor',
  'Modalidades intramural, extramural unidad móvil, domiciliaria y jornada de salud, telemedicina - prestador remisor', es.id, s.id, false, 'active', true
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_INT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status)
SELECT 'IDX-NI-INT-001', '17',
  '17. No aplica',
  '17. No aplica',
  es.id, s.id, true, 'active'
FROM evaluation_standards es JOIN services s ON s.id = es.service_id
WHERE es.code = 'IDX_INT' AND s.code = 'IDX'
ON CONFLICT (code, service_id) DO NOTHING;

-- =============================================================================
-- PASO 4: Vincular todos los nuevos criterios al cuestionario IDX publicado
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
-- PASO 5: Corregir IDX-TH-002A e IDX-TH-003A como cabeceras de sección
-- (son descripciones contextuales sin número en el Excel, no criterios evaluables)
-- =============================================================================
UPDATE evaluation_criteria
SET is_section_header = TRUE
WHERE code IN ('IDX-TH-002A', 'IDX-TH-003A');

-- =============================================================================
-- PASO 6: Recalcular total_criteria para IDX (excluye headers)
-- Resultado esperado: 89 ionizantes + 31 no ionizantes = 120 evaluables
-- =============================================================================
UPDATE questionnaires q
SET total_criteria = (
  SELECT COUNT(*)
  FROM questionnaire_criteria qc
  JOIN evaluation_criteria ec ON qc.criterion_id = ec.id
  WHERE qc.questionnaire_id = q.id
    AND ec.is_section_header = FALSE
)
WHERE q.service_id = (SELECT id FROM services WHERE code = 'IDX');

COMMIT;

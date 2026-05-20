-- HSC: Hospitalizacion Salud Mental - section headers and sort_order
-- Service ID:    19f07e08-b855-492e-be9b-b2fed1690ffc
-- Questionnaire: 35d35b63-e104-4a65-882f-349e64f0c14c
-- Standards:
--   HSC_TH:  9e0046ba-6ffe-4533-9979-61ca72965488
--   HSC_INF: 7ee08c29-634c-48c8-8a87-c998e6169421
--   HSC_DOT: 55c0aad5-a400-4ff9-a43c-35e59758b4a3
--   HSC_MD:  43ce5412-c374-4e0c-bf1c-9d023887cf4a
--   HSC_PP:  08a2c329-5841-48c5-a0ce-a0a571564c38
--   HSC_HCR: c8914ca2-095c-4ead-9af1-3a66dbc6c1f1
--   HSC_INT: 38c34b2e-253a-4960-be8b-43d2a552afd4

-- PASO 1: Marcar criterios numerados grises como is_section_header=true
UPDATE evaluation_criteria SET is_section_header = true WHERE code = 'HSC-TH-005'  AND service_id = '19f07e08-b855-492e-be9b-b2fed1690ffc';
UPDATE evaluation_criteria SET is_section_header = true WHERE code = 'HSC-TH-012'  AND service_id = '19f07e08-b855-492e-be9b-b2fed1690ffc';
UPDATE evaluation_criteria SET is_section_header = true WHERE code = 'HSC-INF-003' AND service_id = '19f07e08-b855-492e-be9b-b2fed1690ffc';
UPDATE evaluation_criteria SET is_section_header = true WHERE code = 'HSC-INF-016' AND service_id = '19f07e08-b855-492e-be9b-b2fed1690ffc';
UPDATE evaluation_criteria SET is_section_header = true WHERE code = 'HSC-DOT-013' AND service_id = '19f07e08-b855-492e-be9b-b2fed1690ffc';
UPDATE evaluation_criteria SET is_section_header = true WHERE code = 'HSC-INT-003' AND service_id = '19f07e08-b855-492e-be9b-b2fed1690ffc';

-- PASO 2: Insertar headers puros (sin número en el Excel)
INSERT INTO evaluation_criteria (id, standard_id, code, number, name, description, service_id, is_section_header, sort_order)
VALUES
    -- HSC_TH (4 headers)
    (gen_random_uuid(), '9e0046ba-6ffe-4533-9979-61ca72965488', 'HSC-TH-H01', '', 'Modalidades intramural, telemedicina - prestador remisor',                    'Modalidades intramural, telemedicina - prestador remisor',                    '19f07e08-b855-492e-be9b-b2fed1690ffc', true, 1),
    (gen_random_uuid(), '9e0046ba-6ffe-4533-9979-61ca72965488', 'HSC-TH-H02', '', 'Modalidad telemedicina - prestador de referencia',                             'Modalidad telemedicina - prestador de referencia',                             '19f07e08-b855-492e-be9b-b2fed1690ffc', true, 16),
    (gen_random_uuid(), '9e0046ba-6ffe-4533-9979-61ca72965488', 'HSC-TH-H03', '', 'Complejidad alta',                                                             'Complejidad alta',                                                             '19f07e08-b855-492e-be9b-b2fed1690ffc', true, 21),
    (gen_random_uuid(), '9e0046ba-6ffe-4533-9979-61ca72965488', 'HSC-TH-H04', '', 'Modalidad telemedicina prestador de referencia',                               'Modalidad telemedicina prestador de referencia',                               '19f07e08-b855-492e-be9b-b2fed1690ffc', true, 24),
    -- HSC_INF (3 headers)
    (gen_random_uuid(), '7ee08c29-634c-48c8-8a87-c998e6169421', 'HSC-INF-H01', '', 'Complejidades mediana y alta',                                                'Complejidades mediana y alta',                                                '19f07e08-b855-492e-be9b-b2fed1690ffc', true, 1),
    (gen_random_uuid(), '7ee08c29-634c-48c8-8a87-c998e6169421', 'HSC-INF-H02', '', 'Modalidades intramural, telemedicina - prestador remisor',                    'Modalidades intramural, telemedicina - prestador remisor',                    '19f07e08-b855-492e-be9b-b2fed1690ffc', true, 2),
    (gen_random_uuid(), '7ee08c29-634c-48c8-8a87-c998e6169421', 'HSC-INF-H03', '', 'Modalidad telemedicina - prestador de referencia',                             'Modalidad telemedicina - prestador de referencia',                             '19f07e08-b855-492e-be9b-b2fed1690ffc', true, 26),
    -- HSC_DOT (2 headers)
    (gen_random_uuid(), '55c0aad5-a400-4ff9-a43c-35e59758b4a3', 'HSC-DOT-H01', '', 'Complejidades mediana y alta',                                                'Complejidades mediana y alta',                                                '19f07e08-b855-492e-be9b-b2fed1690ffc', true, 1),
    (gen_random_uuid(), '55c0aad5-a400-4ff9-a43c-35e59758b4a3', 'HSC-DOT-H02', '', 'Modalidad telemedicina - prestador de referencia',                             'Modalidad telemedicina - prestador de referencia',                             '19f07e08-b855-492e-be9b-b2fed1690ffc', true, 17),
    -- HSC_MD (3 headers)
    (gen_random_uuid(), '43ce5412-c374-4e0c-bf1c-9d023887cf4a', 'HSC-MD-H01',  '', 'Complejidades mediana y alta',                                                'Complejidades mediana y alta',                                                '19f07e08-b855-492e-be9b-b2fed1690ffc', true, 1),
    (gen_random_uuid(), '43ce5412-c374-4e0c-bf1c-9d023887cf4a', 'HSC-MD-H02',  '', 'Modalidades intramural, telemedicina - prestador remisor',                    'Modalidades intramural, telemedicina - prestador remisor',                    '19f07e08-b855-492e-be9b-b2fed1690ffc', true, 2),
    (gen_random_uuid(), '43ce5412-c374-4e0c-bf1c-9d023887cf4a', 'HSC-MD-H03',  '', 'Modalidad telemedicina - prestador de referencia',                             'Modalidad telemedicina - prestador de referencia',                             '19f07e08-b855-492e-be9b-b2fed1690ffc', true, 8),
    -- HSC_PP (3 headers)
    (gen_random_uuid(), '08a2c329-5841-48c5-a0ce-a0a571564c38', 'HSC-PP-H01',  '', 'Complejidades mediana y alta',                                                'Complejidades mediana y alta',                                                '19f07e08-b855-492e-be9b-b2fed1690ffc', true, 1),
    (gen_random_uuid(), '08a2c329-5841-48c5-a0ce-a0a571564c38', 'HSC-PP-H02',  '', 'Modalidades intramural, telemedicina - prestador remisor',                    'Modalidades intramural, telemedicina - prestador remisor',                    '19f07e08-b855-492e-be9b-b2fed1690ffc', true, 2),
    (gen_random_uuid(), '08a2c329-5841-48c5-a0ce-a0a571564c38', 'HSC-PP-H03',  '', 'Modalidad telemedicina - prestador de referencia',                             'Modalidad telemedicina - prestador de referencia',                             '19f07e08-b855-492e-be9b-b2fed1690ffc', true, 36),
    -- HSC_HCR (2 headers)
    (gen_random_uuid(), 'c8914ca2-095c-4ead-9af1-3a66dbc6c1f1', 'HSC-HCR-H01', '', 'Complejidades mediana y alta',                                                'Complejidades mediana y alta',                                                '19f07e08-b855-492e-be9b-b2fed1690ffc', true, 1),
    (gen_random_uuid(), 'c8914ca2-095c-4ead-9af1-3a66dbc6c1f1', 'HSC-HCR-H02', '', 'Modalidades intramural, telemedicina - prestador remisor - prestador referencia', 'Modalidades intramural, telemedicina - prestador remisor - prestador referencia', '19f07e08-b855-492e-be9b-b2fed1690ffc', true, 2),
    -- HSC_INT (3 headers)
    (gen_random_uuid(), '38c34b2e-253a-4960-be8b-43d2a552afd4', 'HSC-INT-H01', '', 'Complejidad mediana y alta',                                                   'Complejidad mediana y alta',                                                   '19f07e08-b855-492e-be9b-b2fed1690ffc', true, 1),
    (gen_random_uuid(), '38c34b2e-253a-4960-be8b-43d2a552afd4', 'HSC-INT-H02', '', 'Modalidad intramural',                                                         'Modalidad intramural',                                                         '19f07e08-b855-492e-be9b-b2fed1690ffc', true, 2),
    (gen_random_uuid(), '38c34b2e-253a-4960-be8b-43d2a552afd4', 'HSC-INT-H03', '', 'Modalidad telemedicina - prestador remisor - prestador referencia',             'Modalidad telemedicina - prestador remisor - prestador referencia',             '19f07e08-b855-492e-be9b-b2fed1690ffc', true, 9)
ON CONFLICT (code, service_id) DO NOTHING;

-- PASO 3: Vincular todos los headers al cuestionario del servicio
INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
SELECT '35d35b63-e104-4a65-882f-349e64f0c14c', ec.id
FROM evaluation_criteria ec
JOIN evaluation_standards es ON ec.standard_id = es.id
WHERE es.service_id = '19f07e08-b855-492e-be9b-b2fed1690ffc'
  AND ec.is_section_header = true
ON CONFLICT DO NOTHING;

-- PASO 4: sort_order para HSC_TH (22 criterios + 2 gray+num + 4 headers = 26 filas)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'HSC-TH-H01' AND service_id = '19f07e08-b855-492e-be9b-b2fed1690ffc';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'HSC-TH-001';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'HSC-TH-002';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'HSC-TH-003';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'HSC-TH-004';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'HSC-TH-005';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'HSC-TH-006';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'HSC-TH-007';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'HSC-TH-008';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'HSC-TH-009';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'HSC-TH-010';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'HSC-TH-011';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'HSC-TH-012';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'HSC-TH-013';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'HSC-TH-014';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'HSC-TH-H02' AND service_id = '19f07e08-b855-492e-be9b-b2fed1690ffc';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'HSC-TH-015';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'HSC-TH-016';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'HSC-TH-017';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'HSC-TH-018';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'HSC-TH-H03' AND service_id = '19f07e08-b855-492e-be9b-b2fed1690ffc';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'HSC-TH-019';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'HSC-TH-020';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'HSC-TH-H04' AND service_id = '19f07e08-b855-492e-be9b-b2fed1690ffc';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'HSC-TH-021';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'HSC-TH-022';

-- PASO 5: sort_order para HSC_INF (24 criterios + 2 gray+num + 3 headers = 27 filas)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'HSC-INF-H01' AND service_id = '19f07e08-b855-492e-be9b-b2fed1690ffc';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'HSC-INF-H02' AND service_id = '19f07e08-b855-492e-be9b-b2fed1690ffc';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'HSC-INF-001';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'HSC-INF-002';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'HSC-INF-003';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'HSC-INF-004';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'HSC-INF-005';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'HSC-INF-006';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'HSC-INF-007';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'HSC-INF-008';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'HSC-INF-009';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'HSC-INF-010';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'HSC-INF-011';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'HSC-INF-012';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'HSC-INF-013';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'HSC-INF-014';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'HSC-INF-015';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'HSC-INF-016';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'HSC-INF-017';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'HSC-INF-018';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'HSC-INF-019';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'HSC-INF-020';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'HSC-INF-021';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'HSC-INF-022';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'HSC-INF-023';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'HSC-INF-H03' AND service_id = '19f07e08-b855-492e-be9b-b2fed1690ffc';
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'HSC-INF-024';

-- PASO 6: sort_order para HSC_DOT (16 criterios + 1 gray+num + 2 headers = 18 filas)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'HSC-DOT-H01' AND service_id = '19f07e08-b855-492e-be9b-b2fed1690ffc';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'HSC-DOT-001';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'HSC-DOT-002';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'HSC-DOT-003';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'HSC-DOT-004';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'HSC-DOT-005';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'HSC-DOT-006';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'HSC-DOT-007';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'HSC-DOT-008';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'HSC-DOT-009';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'HSC-DOT-010';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'HSC-DOT-011';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'HSC-DOT-012';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'HSC-DOT-013';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'HSC-DOT-014';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'HSC-DOT-015';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'HSC-DOT-H02' AND service_id = '19f07e08-b855-492e-be9b-b2fed1690ffc';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'HSC-DOT-016';

-- PASO 7: sort_order para HSC_MD (6 criterios + 3 headers = 9 filas)
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'HSC-MD-H01' AND service_id = '19f07e08-b855-492e-be9b-b2fed1690ffc';
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'HSC-MD-H02' AND service_id = '19f07e08-b855-492e-be9b-b2fed1690ffc';
UPDATE evaluation_criteria SET sort_order = 3 WHERE code = 'HSC-MD-001';
UPDATE evaluation_criteria SET sort_order = 4 WHERE code = 'HSC-MD-002';
UPDATE evaluation_criteria SET sort_order = 5 WHERE code = 'HSC-MD-003';
UPDATE evaluation_criteria SET sort_order = 6 WHERE code = 'HSC-MD-004';
UPDATE evaluation_criteria SET sort_order = 7 WHERE code = 'HSC-MD-005';
UPDATE evaluation_criteria SET sort_order = 8 WHERE code = 'HSC-MD-H03' AND service_id = '19f07e08-b855-492e-be9b-b2fed1690ffc';
UPDATE evaluation_criteria SET sort_order = 9 WHERE code = 'HSC-MD-006';

-- PASO 8: sort_order para HSC_PP (34 criterios + 3 headers = 37 filas)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'HSC-PP-H01' AND service_id = '19f07e08-b855-492e-be9b-b2fed1690ffc';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'HSC-PP-H02' AND service_id = '19f07e08-b855-492e-be9b-b2fed1690ffc';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'HSC-PP-001';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'HSC-PP-002';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'HSC-PP-003';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'HSC-PP-004';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'HSC-PP-005';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'HSC-PP-006';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'HSC-PP-007';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'HSC-PP-008';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'HSC-PP-009';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'HSC-PP-010';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'HSC-PP-011';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'HSC-PP-012';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'HSC-PP-013';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'HSC-PP-014';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'HSC-PP-015';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'HSC-PP-016';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'HSC-PP-017';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'HSC-PP-018';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'HSC-PP-019';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'HSC-PP-020';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'HSC-PP-021';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'HSC-PP-022';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'HSC-PP-023';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'HSC-PP-024';
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'HSC-PP-025';
UPDATE evaluation_criteria SET sort_order = 28 WHERE code = 'HSC-PP-026';
UPDATE evaluation_criteria SET sort_order = 29 WHERE code = 'HSC-PP-027';
UPDATE evaluation_criteria SET sort_order = 30 WHERE code = 'HSC-PP-028';
UPDATE evaluation_criteria SET sort_order = 31 WHERE code = 'HSC-PP-029';
UPDATE evaluation_criteria SET sort_order = 32 WHERE code = 'HSC-PP-030';
UPDATE evaluation_criteria SET sort_order = 33 WHERE code = 'HSC-PP-031';
UPDATE evaluation_criteria SET sort_order = 34 WHERE code = 'HSC-PP-032';
UPDATE evaluation_criteria SET sort_order = 35 WHERE code = 'HSC-PP-033';
UPDATE evaluation_criteria SET sort_order = 36 WHERE code = 'HSC-PP-H03' AND service_id = '19f07e08-b855-492e-be9b-b2fed1690ffc';
UPDATE evaluation_criteria SET sort_order = 37 WHERE code = 'HSC-PP-034';

-- PASO 9: sort_order para HSC_HCR (1 criterio + 2 headers = 3 filas)
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'HSC-HCR-H01' AND service_id = '19f07e08-b855-492e-be9b-b2fed1690ffc';
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'HSC-HCR-H02' AND service_id = '19f07e08-b855-492e-be9b-b2fed1690ffc';
UPDATE evaluation_criteria SET sort_order = 3 WHERE code = 'HSC-HCR-001';

-- PASO 10: sort_order para HSC_INT (7 criterios + 1 gray+num + 3 headers = 10 filas)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'HSC-INT-H01' AND service_id = '19f07e08-b855-492e-be9b-b2fed1690ffc';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'HSC-INT-H02' AND service_id = '19f07e08-b855-492e-be9b-b2fed1690ffc';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'HSC-INT-001';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'HSC-INT-002';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'HSC-INT-003';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'HSC-INT-004';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'HSC-INT-005';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'HSC-INT-006';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'HSC-INT-H03' AND service_id = '19f07e08-b855-492e-be9b-b2fed1690ffc';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'HSC-INT-007';

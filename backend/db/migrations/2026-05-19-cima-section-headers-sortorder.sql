-- Migration: CIMA (Cuidado Intermedio Adulto) - insert section headers, mark parents, set sort_order
-- Service ID:    a4250127-aca3-4da9-8844-6b462c17fa47
-- Questionnaire: ee68bdf3-ece2-4301-af79-9bfd5bfb6378
-- Excel sheet:   11.4.8.S_CIMA
-- Standards:
--   CIMA_TH  16221f49-a8fb-42a8-8bd6-a88a654d15e5
--   CIMA_INF 600d6fc4-f03b-4954-bcc3-4e5515beb0f4
--   CIMA_DOT a4ca04d9-7331-4772-b817-06f94799b6ec
--   CIMA_MD  f41d4dd4-6d4e-42dd-933a-837a07dd46ea
--   CIMA_PP  5615e688-f9f1-4f02-9e9d-cc4dbd7ae6c1
--   CIMA_HCR 57180d80-d156-4ea6-9c5c-4940c64037a7
--   CIMA_INT a6e7d9b7-9767-43c8-bd6a-1032d856aaa5

-- Step 1: Mark 4 numbered gray rows as section headers
UPDATE evaluation_criteria SET is_section_header = true WHERE code IN (
    'CIMA-TH-005',
    'CIMA-DOT-012',
    'CIMA-DOT-021',
    'CIMA-INT-008'
);

-- Step 2: Insert 18 pure section headers
INSERT INTO evaluation_criteria (id, standard_id, code, number, name, description, service_id, is_section_header, sort_order)
VALUES
    -- CIMA_TH (3 headers)
    (gen_random_uuid(), '16221f49-a8fb-42a8-8bd6-a88a654d15e5', 'CIMA-TH-H01', '', 'Complejidad mediana',                                                                        'Complejidad mediana',                                                                        'a4250127-aca3-4da9-8844-6b462c17fa47', true, 1),
    (gen_random_uuid(), '16221f49-a8fb-42a8-8bd6-a88a654d15e5', 'CIMA-TH-H02', '', 'Modalidad intramural, telemedicina - prestador remisor',                                     'Modalidad intramural, telemedicina - prestador remisor',                                     'a4250127-aca3-4da9-8844-6b462c17fa47', true, 2),
    (gen_random_uuid(), '16221f49-a8fb-42a8-8bd6-a88a654d15e5', 'CIMA-TH-H03', '', 'Modalidad telemedicina - prestador de referencia',                                           'Modalidad telemedicina - prestador de referencia',                                           'a4250127-aca3-4da9-8844-6b462c17fa47', true, 12),
    -- CIMA_INF (3 headers)
    (gen_random_uuid(), '600d6fc4-f03b-4954-bcc3-4e5515beb0f4', 'CIMA-INF-H01', '', 'Complejidad mediana',                                                                        'Complejidad mediana',                                                                        'a4250127-aca3-4da9-8844-6b462c17fa47', true, 1),
    (gen_random_uuid(), '600d6fc4-f03b-4954-bcc3-4e5515beb0f4', 'CIMA-INF-H02', '', 'Modalidad intramural, telemedicina - prestador remisor',                                     'Modalidad intramural, telemedicina - prestador remisor',                                     'a4250127-aca3-4da9-8844-6b462c17fa47', true, 2),
    (gen_random_uuid(), '600d6fc4-f03b-4954-bcc3-4e5515beb0f4', 'CIMA-INF-H03', '', 'Modalidad telemedicina - prestador de referencia',                                           'Modalidad telemedicina - prestador de referencia',                                           'a4250127-aca3-4da9-8844-6b462c17fa47', true, 13),
    -- CIMA_DOT (3 headers)
    (gen_random_uuid(), 'a4ca04d9-7331-4772-b817-06f94799b6ec', 'CIMA-DOT-H01', '', 'Complejidad mediana',                                                                        'Complejidad mediana',                                                                        'a4250127-aca3-4da9-8844-6b462c17fa47', true, 1),
    (gen_random_uuid(), 'a4ca04d9-7331-4772-b817-06f94799b6ec', 'CIMA-DOT-H02', '', 'Modalidad intramural, telemedicina - prestador remisor',                                     'Modalidad intramural, telemedicina - prestador remisor',                                     'a4250127-aca3-4da9-8844-6b462c17fa47', true, 2),
    (gen_random_uuid(), 'a4ca04d9-7331-4772-b817-06f94799b6ec', 'CIMA-DOT-H03', '', 'Modalidad telemedicina - prestador de referencia',                                           'Modalidad telemedicina - prestador de referencia',                                           'a4250127-aca3-4da9-8844-6b462c17fa47', true, 26),
    -- CIMA_MD (3 headers)
    (gen_random_uuid(), 'f41d4dd4-6d4e-42dd-933a-837a07dd46ea', 'CIMA-MD-H01', '', 'Complejidad mediana',                                                                         'Complejidad mediana',                                                                         'a4250127-aca3-4da9-8844-6b462c17fa47', true, 1),
    (gen_random_uuid(), 'f41d4dd4-6d4e-42dd-933a-837a07dd46ea', 'CIMA-MD-H02', '', 'Modalidad intramural, telemedicina - prestador remisor',                                      'Modalidad intramural, telemedicina - prestador remisor',                                      'a4250127-aca3-4da9-8844-6b462c17fa47', true, 2),
    (gen_random_uuid(), 'f41d4dd4-6d4e-42dd-933a-837a07dd46ea', 'CIMA-MD-H03', '', 'Modalidad telemedicina - prestador de referencia',                                            'Modalidad telemedicina - prestador de referencia',                                            'a4250127-aca3-4da9-8844-6b462c17fa47', true, 4),
    -- CIMA_PP (3 headers)
    (gen_random_uuid(), '5615e688-f9f1-4f02-9e9d-cc4dbd7ae6c1', 'CIMA-PP-H01', '', 'Complejidad mediana',                                                                         'Complejidad mediana',                                                                         'a4250127-aca3-4da9-8844-6b462c17fa47', true, 1),
    (gen_random_uuid(), '5615e688-f9f1-4f02-9e9d-cc4dbd7ae6c1', 'CIMA-PP-H02', '', 'Modalidad intramural, telemedicina - prestador remisor',                                      'Modalidad intramural, telemedicina - prestador remisor',                                      'a4250127-aca3-4da9-8844-6b462c17fa47', true, 2),
    (gen_random_uuid(), '5615e688-f9f1-4f02-9e9d-cc4dbd7ae6c1', 'CIMA-PP-H03', '', 'Modalidad telemedicina - prestador de referencia',                                            'Modalidad telemedicina - prestador de referencia',                                            'a4250127-aca3-4da9-8844-6b462c17fa47', true, 27),
    -- CIMA_HCR (1 header)
    (gen_random_uuid(), '57180d80-d156-4ea6-9c5c-4940c64037a7', 'CIMA-HCR-H01', '', 'Modalidades intramural y telemedicina - prestador remisor - prestador de referencia',       'Modalidades intramural y telemedicina - prestador remisor - prestador de referencia',       'a4250127-aca3-4da9-8844-6b462c17fa47', true, 1),
    -- CIMA_INT (2 headers)
    (gen_random_uuid(), 'a6e7d9b7-9767-43c8-bd6a-1032d856aaa5', 'CIMA-INT-H01', '', 'Modalidades intramural',                                                                      'Modalidades intramural',                                                                      'a4250127-aca3-4da9-8844-6b462c17fa47', true, 1),
    (gen_random_uuid(), 'a6e7d9b7-9767-43c8-bd6a-1032d856aaa5', 'CIMA-INT-H02', '', 'Modalidad telemedicina - prestador remisor - prestador de referencia',                       'Modalidad telemedicina - prestador remisor - prestador de referencia',                       'a4250127-aca3-4da9-8844-6b462c17fa47', true, 12)
ON CONFLICT (code, service_id) DO NOTHING;

-- Step 3: Link all section headers to the CIMA questionnaire
INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
SELECT 'ee68bdf3-ece2-4301-af79-9bfd5bfb6378', ec.id
FROM evaluation_criteria ec
JOIN evaluation_standards es ON ec.standard_id = es.id
WHERE es.service_id = 'a4250127-aca3-4da9-8844-6b462c17fa47'
  AND ec.is_section_header = true
ON CONFLICT DO NOTHING;

-- Step 4: Set sort_order for CIMA_TH (15 rows: 3 headers + 12 criteria)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CIMA-TH-H01' AND service_id = 'a4250127-aca3-4da9-8844-6b462c17fa47';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CIMA-TH-H02' AND service_id = 'a4250127-aca3-4da9-8844-6b462c17fa47';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CIMA-TH-001';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CIMA-TH-002';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CIMA-TH-003';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CIMA-TH-004';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CIMA-TH-005';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CIMA-TH-006';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CIMA-TH-007';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CIMA-TH-008';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CIMA-TH-009';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CIMA-TH-H03' AND service_id = 'a4250127-aca3-4da9-8844-6b462c17fa47';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CIMA-TH-010';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CIMA-TH-011';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CIMA-TH-012';

-- Step 5: Set sort_order for CIMA_INF (14 rows: 3 headers + 11 criteria)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CIMA-INF-H01' AND service_id = 'a4250127-aca3-4da9-8844-6b462c17fa47';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CIMA-INF-H02' AND service_id = 'a4250127-aca3-4da9-8844-6b462c17fa47';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CIMA-INF-001';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CIMA-INF-002';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CIMA-INF-003';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CIMA-INF-004';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CIMA-INF-005';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CIMA-INF-006';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CIMA-INF-007';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CIMA-INF-008';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CIMA-INF-009';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CIMA-INF-010';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CIMA-INF-H03' AND service_id = 'a4250127-aca3-4da9-8844-6b462c17fa47';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CIMA-INF-011';

-- Step 6: Set sort_order for CIMA_DOT (27 rows: 3 headers + 24 criteria)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CIMA-DOT-H01' AND service_id = 'a4250127-aca3-4da9-8844-6b462c17fa47';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CIMA-DOT-H02' AND service_id = 'a4250127-aca3-4da9-8844-6b462c17fa47';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CIMA-DOT-001';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CIMA-DOT-002';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CIMA-DOT-003';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CIMA-DOT-004';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CIMA-DOT-005';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CIMA-DOT-006';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CIMA-DOT-007';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CIMA-DOT-008';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CIMA-DOT-009';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CIMA-DOT-010';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CIMA-DOT-011';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CIMA-DOT-012';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CIMA-DOT-013';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'CIMA-DOT-014';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'CIMA-DOT-015';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'CIMA-DOT-016';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'CIMA-DOT-017';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'CIMA-DOT-018';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'CIMA-DOT-019';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'CIMA-DOT-020';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'CIMA-DOT-021';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'CIMA-DOT-022';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'CIMA-DOT-023';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'CIMA-DOT-H03' AND service_id = 'a4250127-aca3-4da9-8844-6b462c17fa47';
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'CIMA-DOT-024';

-- Step 7: Set sort_order for CIMA_MD (5 rows: 3 headers + 2 criteria)
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CIMA-MD-H01' AND service_id = 'a4250127-aca3-4da9-8844-6b462c17fa47';
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CIMA-MD-H02' AND service_id = 'a4250127-aca3-4da9-8844-6b462c17fa47';
UPDATE evaluation_criteria SET sort_order = 3 WHERE code = 'CIMA-MD-001';
UPDATE evaluation_criteria SET sort_order = 4 WHERE code = 'CIMA-MD-H03' AND service_id = 'a4250127-aca3-4da9-8844-6b462c17fa47';
UPDATE evaluation_criteria SET sort_order = 5 WHERE code = 'CIMA-MD-002';

-- Step 8: Set sort_order for CIMA_PP (28 rows: 3 headers + 25 criteria)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CIMA-PP-H01' AND service_id = 'a4250127-aca3-4da9-8844-6b462c17fa47';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CIMA-PP-H02' AND service_id = 'a4250127-aca3-4da9-8844-6b462c17fa47';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CIMA-PP-001';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CIMA-PP-002';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CIMA-PP-003';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CIMA-PP-004';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CIMA-PP-005';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CIMA-PP-006';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CIMA-PP-007';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CIMA-PP-008';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CIMA-PP-009';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CIMA-PP-010';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CIMA-PP-011';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CIMA-PP-012';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CIMA-PP-013';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'CIMA-PP-014';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'CIMA-PP-015';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'CIMA-PP-016';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'CIMA-PP-017';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'CIMA-PP-018';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'CIMA-PP-019';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'CIMA-PP-020';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'CIMA-PP-021';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'CIMA-PP-022';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'CIMA-PP-023';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'CIMA-PP-024';
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'CIMA-PP-H03' AND service_id = 'a4250127-aca3-4da9-8844-6b462c17fa47';
UPDATE evaluation_criteria SET sort_order = 28 WHERE code = 'CIMA-PP-025';

-- Step 9: Set sort_order for CIMA_HCR (2 rows: 1 header + 1 criterion)
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CIMA-HCR-H01' AND service_id = 'a4250127-aca3-4da9-8844-6b462c17fa47';
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CIMA-HCR-001';

-- Step 10: Set sort_order for CIMA_INT (13 rows: 2 headers + 11 criteria)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CIMA-INT-H01' AND service_id = 'a4250127-aca3-4da9-8844-6b462c17fa47';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CIMA-INT-001';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CIMA-INT-002';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CIMA-INT-003';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CIMA-INT-004';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CIMA-INT-005';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CIMA-INT-006';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CIMA-INT-007';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CIMA-INT-008';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CIMA-INT-009';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CIMA-INT-010';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CIMA-INT-H02' AND service_id = 'a4250127-aca3-4da9-8844-6b462c17fa47';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CIMA-INT-011';

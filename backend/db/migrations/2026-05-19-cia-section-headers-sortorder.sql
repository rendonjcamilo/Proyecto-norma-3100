-- Migration: CIA (Cuidado Intensivo Adulto) - insert section headers, mark parents, set sort_order
-- Service ID:      5d9b6120-d816-4760-b63a-2a27ffadda6b
-- Questionnaire:   ca4b023f-cb36-40f5-9a73-c568cea75977
-- Excel sheet:     11.4.9.S_CIA
-- Standards:
--   CIA_TH  a77e9f96-0acb-480e-9bcb-23215e23693f
--   CIA_INF 00ab0c60-a644-4051-a8cf-ad2874a804a4
--   CIA_DOT 5ebdbd32-0702-43b0-be9a-2e889465cd7d
--   CIA_MD  1773d985-9339-4ec9-97e2-5888c1f6aa3e
--   CIA_PP  240a4d05-930b-4cb7-8ed0-89daf22ba3cb
--   CIA_HCR 0abdab0f-e243-49f7-81f7-8a2322f1a8f8
--   CIA_INT b488198a-2299-4e48-a41a-52bcd37da39a

-- Step 1: Mark 3 numbered gray rows as section headers
UPDATE evaluation_criteria SET is_section_header = true WHERE code IN (
    'CIA-TH-006',
    'CIA-DOT-012',
    'CIA-INT-009'
);

-- Step 2: Insert 18 pure section headers
INSERT INTO evaluation_criteria (id, standard_id, code, description, is_section_header, sort_order)
VALUES
    -- CIA_TH (3 headers)
    (gen_random_uuid(), 'a77e9f96-0acb-480e-9bcb-23215e23693f', 'CIA-TH-H01', 'Complejidad alta',                                                                           true, 1),
    (gen_random_uuid(), 'a77e9f96-0acb-480e-9bcb-23215e23693f', 'CIA-TH-H02', 'Modalidades intramural, telemedicina - prestador remisor',                                  true, 2),
    (gen_random_uuid(), 'a77e9f96-0acb-480e-9bcb-23215e23693f', 'CIA-TH-H03', 'Modalidades telemedicina - prestador de referencia',                                        true, 16),
    -- CIA_INF (2 headers)
    (gen_random_uuid(), '00ab0c60-a644-4051-a8cf-ad2874a804a4', 'CIA-INF-H01', 'Modalidades intramural, telemedicina - prestador remisor',                                  true, 1),
    (gen_random_uuid(), '00ab0c60-a644-4051-a8cf-ad2874a804a4', 'CIA-INF-H02', 'Modalidades telemedicina - prestador de referencia',                                        true, 14),
    -- CIA_DOT (2 headers)
    (gen_random_uuid(), '5ebdbd32-0702-43b0-be9a-2e889465cd7d', 'CIA-DOT-H01', 'Modalidades intramural, telemedicina - prestador remisor',                                  true, 1),
    (gen_random_uuid(), '5ebdbd32-0702-43b0-be9a-2e889465cd7d', 'CIA-DOT-H02', 'Modalidades telemedicina - prestador de referencia',                                        true, 17),
    -- CIA_MD (3 headers)
    (gen_random_uuid(), '1773d985-9339-4ec9-97e2-5888c1f6aa3e', 'CIA-MD-H01',  'Complejidad alta',                                                                           true, 1),
    (gen_random_uuid(), '1773d985-9339-4ec9-97e2-5888c1f6aa3e', 'CIA-MD-H02',  'Modalidades intramural, telemedicina - prestador remisor',                                  true, 2),
    (gen_random_uuid(), '1773d985-9339-4ec9-97e2-5888c1f6aa3e', 'CIA-MD-H03',  'Modalidad telemedicina - prestador de referencia',                                          true, 4),
    -- CIA_PP (3 headers)
    (gen_random_uuid(), '240a4d05-930b-4cb7-8ed0-89daf22ba3cb', 'CIA-PP-H01',  'Complejidad alta',                                                                           true, 1),
    (gen_random_uuid(), '240a4d05-930b-4cb7-8ed0-89daf22ba3cb', 'CIA-PP-H02',  'Modalidades intramural, telemedicina - prestador remisor',                                  true, 2),
    (gen_random_uuid(), '240a4d05-930b-4cb7-8ed0-89daf22ba3cb', 'CIA-PP-H03',  'Modalidad telemedicina - prestador de referencia',                                          true, 40),
    -- CIA_HCR (2 headers)
    (gen_random_uuid(), '0abdab0f-e243-49f7-81f7-8a2322f1a8f8', 'CIA-HCR-H01', 'Complejidad alta',                                                                           true, 1),
    (gen_random_uuid(), '0abdab0f-e243-49f7-81f7-8a2322f1a8f8', 'CIA-HCR-H02', 'Modalidades intramural y telemedicina - prestador remisor - prestador de referencia',       true, 2),
    -- CIA_INT (3 headers)
    (gen_random_uuid(), 'b488198a-2299-4e48-a41a-52bcd37da39a', 'CIA-INT-H01', 'Complejidad alta',                                                                           true, 1),
    (gen_random_uuid(), 'b488198a-2299-4e48-a41a-52bcd37da39a', 'CIA-INT-H02', 'Modalidad intramural',                                                                        true, 2),
    (gen_random_uuid(), 'b488198a-2299-4e48-a41a-52bcd37da39a', 'CIA-INT-H03', 'Modalidad telemedicina - prestador remisor - prestador de referencia',                       true, 15)
ON CONFLICT (code) DO NOTHING;

-- Step 3: Link all section headers to the CIA questionnaire
INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
SELECT 'ca4b023f-cb36-40f5-9a73-c568cea75977', ec.id
FROM evaluation_criteria ec
JOIN evaluation_standards es ON ec.standard_id = es.id
WHERE es.service_id = '5d9b6120-d816-4760-b63a-2a27ffadda6b'
  AND ec.is_section_header = true
ON CONFLICT DO NOTHING;

-- Step 4: Set sort_order for CIA_TH (20 rows total)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CIA-TH-H01';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CIA-TH-H02';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CIA-TH-001';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CIA-TH-002';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CIA-TH-003';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CIA-TH-004';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CIA-TH-005';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CIA-TH-006';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CIA-TH-007';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CIA-TH-008';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CIA-TH-009';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CIA-TH-010';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CIA-TH-011';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CIA-TH-012';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CIA-TH-013';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'CIA-TH-H03';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'CIA-TH-014';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'CIA-TH-015';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'CIA-TH-016';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'CIA-TH-017';

-- Step 5: Set sort_order for CIA_INF (15 rows total)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CIA-INF-H01';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CIA-INF-001';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CIA-INF-002';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CIA-INF-003';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CIA-INF-004';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CIA-INF-005';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CIA-INF-006';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CIA-INF-007';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CIA-INF-008';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CIA-INF-009';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CIA-INF-010';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CIA-INF-011';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CIA-INF-012';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CIA-INF-H02';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CIA-INF-013';

-- Step 6: Set sort_order for CIA_DOT (18 rows total)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CIA-DOT-H01';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CIA-DOT-001';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CIA-DOT-002';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CIA-DOT-003';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CIA-DOT-004';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CIA-DOT-005';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CIA-DOT-006';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CIA-DOT-007';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CIA-DOT-008';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CIA-DOT-009';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CIA-DOT-010';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CIA-DOT-011';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CIA-DOT-012';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CIA-DOT-013';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CIA-DOT-014';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'CIA-DOT-015';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'CIA-DOT-H02';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'CIA-DOT-016';

-- Step 7: Set sort_order for CIA_MD (5 rows total)
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CIA-MD-H01';
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CIA-MD-H02';
UPDATE evaluation_criteria SET sort_order = 3 WHERE code = 'CIA-MD-001';
UPDATE evaluation_criteria SET sort_order = 4 WHERE code = 'CIA-MD-H03';
UPDATE evaluation_criteria SET sort_order = 5 WHERE code = 'CIA-MD-002';

-- Step 8: Set sort_order for CIA_PP (41 rows total)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CIA-PP-H01';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CIA-PP-H02';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CIA-PP-001';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CIA-PP-002';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CIA-PP-003';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CIA-PP-004';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CIA-PP-005';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CIA-PP-006';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CIA-PP-007';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CIA-PP-008';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CIA-PP-009';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CIA-PP-010';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CIA-PP-011';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CIA-PP-012';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CIA-PP-013';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'CIA-PP-014';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'CIA-PP-015';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'CIA-PP-016';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'CIA-PP-017';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'CIA-PP-018';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'CIA-PP-019';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'CIA-PP-020';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'CIA-PP-021';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'CIA-PP-022';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'CIA-PP-023';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'CIA-PP-024';
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'CIA-PP-025';
UPDATE evaluation_criteria SET sort_order = 28 WHERE code = 'CIA-PP-026';
UPDATE evaluation_criteria SET sort_order = 29 WHERE code = 'CIA-PP-027';
UPDATE evaluation_criteria SET sort_order = 30 WHERE code = 'CIA-PP-028';
UPDATE evaluation_criteria SET sort_order = 31 WHERE code = 'CIA-PP-029';
UPDATE evaluation_criteria SET sort_order = 32 WHERE code = 'CIA-PP-030';
UPDATE evaluation_criteria SET sort_order = 33 WHERE code = 'CIA-PP-031';
UPDATE evaluation_criteria SET sort_order = 34 WHERE code = 'CIA-PP-032';
UPDATE evaluation_criteria SET sort_order = 35 WHERE code = 'CIA-PP-033';
UPDATE evaluation_criteria SET sort_order = 36 WHERE code = 'CIA-PP-034';
UPDATE evaluation_criteria SET sort_order = 37 WHERE code = 'CIA-PP-035';
UPDATE evaluation_criteria SET sort_order = 38 WHERE code = 'CIA-PP-036';
UPDATE evaluation_criteria SET sort_order = 39 WHERE code = 'CIA-PP-037';
UPDATE evaluation_criteria SET sort_order = 40 WHERE code = 'CIA-PP-H03';
UPDATE evaluation_criteria SET sort_order = 41 WHERE code = 'CIA-PP-038';

-- Step 9: Set sort_order for CIA_HCR (3 rows total)
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CIA-HCR-H01';
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CIA-HCR-H02';
UPDATE evaluation_criteria SET sort_order = 3 WHERE code = 'CIA-HCR-001';

-- Step 10: Set sort_order for CIA_INT (16 rows total)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CIA-INT-H01';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CIA-INT-H02';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CIA-INT-001';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CIA-INT-002';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CIA-INT-003';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CIA-INT-004';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CIA-INT-005';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CIA-INT-006';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CIA-INT-007';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CIA-INT-008';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CIA-INT-009';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CIA-INT-010';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CIA-INT-011';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CIA-INT-012';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CIA-INT-H03';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'CIA-INT-013';

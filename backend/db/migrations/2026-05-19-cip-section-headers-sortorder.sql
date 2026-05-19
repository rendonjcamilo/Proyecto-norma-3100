-- Migration: CIP (Cuidado Intensivo Pediátrico) - insert section headers, mark parents, set sort_order
-- Service ID:    e3ba7178-1b5b-4957-a126-90db41c011d6
-- Questionnaire: d8ffba4c-0188-4b3f-856e-da50bacb33bc
-- Excel sheet:   11.4.7.S_CIP
-- Standards:
--   CIP_TH  49caf796-8c1f-4f62-af8f-b32b72be2d95
--   CIP_INF 255e6bc3-c7e6-43eb-844a-7e4432ad55a0
--   CIP_DOT ab478ed0-1913-4abd-b89f-a6e8ae98361a
--   CIP_MD  9c5c4de6-28c5-4dd5-8d35-8f4976675d13
--   CIP_PP  d6510d0b-2291-4f08-b8cf-ab13bd7e4d91
--   CIP_HCR 5a4bf79f-18e7-4953-9124-42aa40adfffe
--   CIP_INT e9be1c32-b8f0-46b0-adde-c5254803a86d
-- Note: CIP-TH-010 (2.4. Profesional cardiología pediátrica) is gray in Excel
--       but is an evaluable criterion — NOT marked as section header.

-- Step 1: Mark 3 numbered gray rows as section headers
UPDATE evaluation_criteria SET is_section_header = true WHERE code IN (
    'CIP-INF-012',
    'CIP-DOT-011',
    'CIP-INT-009'
);

-- Step 2: Insert 15 pure section headers
INSERT INTO evaluation_criteria (id, standard_id, code, number, name, description, service_id, is_section_header, sort_order)
VALUES
    -- CIP_TH (2 headers)
    (gen_random_uuid(), '49caf796-8c1f-4f62-af8f-b32b72be2d95', 'CIP-TH-H01', '', 'Modalidad intramural, telemedicina - prestador remisor',                                    'Modalidad intramural, telemedicina - prestador remisor',                                    'e3ba7178-1b5b-4957-a126-90db41c011d6', true, 1),
    (gen_random_uuid(), '49caf796-8c1f-4f62-af8f-b32b72be2d95', 'CIP-TH-H02', '', 'Modalidad telemedicina - prestador de referencia',                                          'Modalidad telemedicina - prestador de referencia',                                          'e3ba7178-1b5b-4957-a126-90db41c011d6', true, 19),
    -- CIP_INF (2 headers)
    (gen_random_uuid(), '255e6bc3-c7e6-43eb-844a-7e4432ad55a0', 'CIP-INF-H01', '', 'Complejidad alta',                                                                          'Complejidad alta',                                                                          'e3ba7178-1b5b-4957-a126-90db41c011d6', true, 1),
    (gen_random_uuid(), '255e6bc3-c7e6-43eb-844a-7e4432ad55a0', 'CIP-INF-H02', '', 'Modalidades intramural y telemedicina - prestador remisor',                                 'Modalidades intramural y telemedicina - prestador remisor',                                 'e3ba7178-1b5b-4957-a126-90db41c011d6', true, 2),
    -- CIP_DOT (3 headers)
    (gen_random_uuid(), 'ab478ed0-1913-4abd-b89f-a6e8ae98361a', 'CIP-DOT-H01', '', 'Complejidad alta',                                                                          'Complejidad alta',                                                                          'e3ba7178-1b5b-4957-a126-90db41c011d6', true, 1),
    (gen_random_uuid(), 'ab478ed0-1913-4abd-b89f-a6e8ae98361a', 'CIP-DOT-H02', '', 'Modalidades intramural, telemedicina - prestador remisor',                                  'Modalidades intramural, telemedicina - prestador remisor',                                  'e3ba7178-1b5b-4957-a126-90db41c011d6', true, 2),
    (gen_random_uuid(), 'ab478ed0-1913-4abd-b89f-a6e8ae98361a', 'CIP-DOT-H03', '', 'Modalidad telemedicina - prestador de referencia',                                          'Modalidad telemedicina - prestador de referencia',                                          'e3ba7178-1b5b-4957-a126-90db41c011d6', true, 28),
    -- CIP_MD (3 headers)
    (gen_random_uuid(), '9c5c4de6-28c5-4dd5-8d35-8f4976675d13', 'CIP-MD-H01', '', 'Complejidad alta',                                                                           'Complejidad alta',                                                                           'e3ba7178-1b5b-4957-a126-90db41c011d6', true, 1),
    (gen_random_uuid(), '9c5c4de6-28c5-4dd5-8d35-8f4976675d13', 'CIP-MD-H02', '', 'Modalidades intramural, telemedicina - prestador remisor',                                   'Modalidades intramural, telemedicina - prestador remisor',                                   'e3ba7178-1b5b-4957-a126-90db41c011d6', true, 2),
    (gen_random_uuid(), '9c5c4de6-28c5-4dd5-8d35-8f4976675d13', 'CIP-MD-H03', '', 'Modalidad telemedicina - prestador de referencia',                                           'Modalidad telemedicina - prestador de referencia',                                           'e3ba7178-1b5b-4957-a126-90db41c011d6', true, 4),
    -- CIP_PP (2 headers)
    (gen_random_uuid(), 'd6510d0b-2291-4f08-b8cf-ab13bd7e4d91', 'CIP-PP-H01', '', 'Modalidades intramural, telemedicina - prestador remisor',                                   'Modalidades intramural, telemedicina - prestador remisor',                                   'e3ba7178-1b5b-4957-a126-90db41c011d6', true, 1),
    (gen_random_uuid(), 'd6510d0b-2291-4f08-b8cf-ab13bd7e4d91', 'CIP-PP-H02', '', 'Modalidad telemedicina - prestador de referencia',                                           'Modalidad telemedicina - prestador de referencia',                                           'e3ba7178-1b5b-4957-a126-90db41c011d6', true, 38),
    -- CIP_HCR (1 header)
    (gen_random_uuid(), '5a4bf79f-18e7-4953-9124-42aa40adfffe', 'CIP-HCR-H01', '', 'Modalidades intramural, telemedicina - prestador remisor – prestador referencia',           'Modalidades intramural, telemedicina - prestador remisor – prestador referencia',           'e3ba7178-1b5b-4957-a126-90db41c011d6', true, 1),
    -- CIP_INT (2 headers)
    (gen_random_uuid(), 'e9be1c32-b8f0-46b0-adde-c5254803a86d', 'CIP-INT-H01', '', 'Modalidades intramural',                                                                     'Modalidades intramural',                                                                     'e3ba7178-1b5b-4957-a126-90db41c011d6', true, 1),
    (gen_random_uuid(), 'e9be1c32-b8f0-46b0-adde-c5254803a86d', 'CIP-INT-H02', '', 'Modalidad telemedicina - prestador remisor - prestador de referencia',                      'Modalidad telemedicina - prestador remisor - prestador de referencia',                      'e3ba7178-1b5b-4957-a126-90db41c011d6', true, 14)
ON CONFLICT (code, service_id) DO NOTHING;

-- Step 3: Link all section headers to CIP questionnaire
INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
SELECT 'd8ffba4c-0188-4b3f-856e-da50bacb33bc', ec.id
FROM evaluation_criteria ec
JOIN evaluation_standards es ON ec.standard_id = es.id
WHERE es.service_id = 'e3ba7178-1b5b-4957-a126-90db41c011d6'
  AND ec.is_section_header = true
ON CONFLICT DO NOTHING;

-- Step 4: Set sort_order for CIP_TH (23 rows: 2 headers + 21 criteria)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CIP-TH-H01';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CIP-TH-001';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CIP-TH-002';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CIP-TH-003';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CIP-TH-004';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CIP-TH-005';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CIP-TH-006';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CIP-TH-007';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CIP-TH-008';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CIP-TH-009';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CIP-TH-010';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CIP-TH-011';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CIP-TH-012';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CIP-TH-013';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CIP-TH-014';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'CIP-TH-015';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'CIP-TH-016';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'CIP-TH-017';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'CIP-TH-H02';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'CIP-TH-018';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'CIP-TH-019';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'CIP-TH-020';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'CIP-TH-021';

-- Step 5: Set sort_order for CIP_INF (18 rows: 2 headers + 15 criteria + 1 parent)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CIP-INF-H01';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CIP-INF-H02';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CIP-INF-001';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CIP-INF-002';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CIP-INF-003';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CIP-INF-004';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CIP-INF-005';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CIP-INF-006';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CIP-INF-007';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CIP-INF-008';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CIP-INF-009';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CIP-INF-010';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CIP-INF-011';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CIP-INF-012';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CIP-INF-013';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'CIP-INF-014';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'CIP-INF-015';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'CIP-INF-016';

-- Step 6: Set sort_order for CIP_DOT (29 rows: 3 headers + 25 criteria + 1 parent)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CIP-DOT-H01';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CIP-DOT-H02';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CIP-DOT-001';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CIP-DOT-002';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CIP-DOT-003';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CIP-DOT-004';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CIP-DOT-005';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CIP-DOT-006';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CIP-DOT-007';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CIP-DOT-008';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CIP-DOT-009';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CIP-DOT-010';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CIP-DOT-011';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CIP-DOT-012';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CIP-DOT-013';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'CIP-DOT-014';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'CIP-DOT-015';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'CIP-DOT-016';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'CIP-DOT-017';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'CIP-DOT-018';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'CIP-DOT-019';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'CIP-DOT-020';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'CIP-DOT-021';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'CIP-DOT-022';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'CIP-DOT-023';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'CIP-DOT-024';
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'CIP-DOT-025';
UPDATE evaluation_criteria SET sort_order = 28 WHERE code = 'CIP-DOT-H03';
UPDATE evaluation_criteria SET sort_order = 29 WHERE code = 'CIP-DOT-026';

-- Step 7: Set sort_order for CIP_MD (5 rows: 3 headers + 2 criteria)
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CIP-MD-H01';
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CIP-MD-H02';
UPDATE evaluation_criteria SET sort_order = 3 WHERE code = 'CIP-MD-001';
UPDATE evaluation_criteria SET sort_order = 4 WHERE code = 'CIP-MD-H03';
UPDATE evaluation_criteria SET sort_order = 5 WHERE code = 'CIP-MD-002';

-- Step 8: Set sort_order for CIP_PP (39 rows: 2 headers + 37 criteria)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CIP-PP-H01';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CIP-PP-001';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CIP-PP-002';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CIP-PP-003';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CIP-PP-004';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CIP-PP-005';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CIP-PP-006';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CIP-PP-007';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CIP-PP-008';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CIP-PP-009';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CIP-PP-010';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CIP-PP-011';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CIP-PP-012';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CIP-PP-013';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CIP-PP-014';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'CIP-PP-015';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'CIP-PP-016';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'CIP-PP-017';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'CIP-PP-018';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'CIP-PP-019';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'CIP-PP-020';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'CIP-PP-021';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'CIP-PP-022';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'CIP-PP-023';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'CIP-PP-024';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'CIP-PP-025';
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'CIP-PP-026';
UPDATE evaluation_criteria SET sort_order = 28 WHERE code = 'CIP-PP-027';
UPDATE evaluation_criteria SET sort_order = 29 WHERE code = 'CIP-PP-028';
UPDATE evaluation_criteria SET sort_order = 30 WHERE code = 'CIP-PP-029';
UPDATE evaluation_criteria SET sort_order = 31 WHERE code = 'CIP-PP-030';
UPDATE evaluation_criteria SET sort_order = 32 WHERE code = 'CIP-PP-031';
UPDATE evaluation_criteria SET sort_order = 33 WHERE code = 'CIP-PP-032';
UPDATE evaluation_criteria SET sort_order = 34 WHERE code = 'CIP-PP-033';
UPDATE evaluation_criteria SET sort_order = 35 WHERE code = 'CIP-PP-034';
UPDATE evaluation_criteria SET sort_order = 36 WHERE code = 'CIP-PP-035';
UPDATE evaluation_criteria SET sort_order = 37 WHERE code = 'CIP-PP-036';
UPDATE evaluation_criteria SET sort_order = 38 WHERE code = 'CIP-PP-H02';
UPDATE evaluation_criteria SET sort_order = 39 WHERE code = 'CIP-PP-037';

-- Step 9: Set sort_order for CIP_HCR (2 rows: 1 header + 1 criterion)
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CIP-HCR-H01';
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CIP-HCR-001';

-- Step 10: Set sort_order for CIP_INT (15 rows: 2 headers + 12 criteria + 1 parent)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CIP-INT-H01';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CIP-INT-001';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CIP-INT-002';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CIP-INT-003';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CIP-INT-004';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CIP-INT-005';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CIP-INT-006';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CIP-INT-007';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CIP-INT-008';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CIP-INT-009';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CIP-INT-010';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CIP-INT-011';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CIP-INT-012';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CIP-INT-H02';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CIP-INT-013';

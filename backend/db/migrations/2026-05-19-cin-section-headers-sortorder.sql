-- Migration: CIN (Cuidado Intermedio Neonatal) - insert section headers, mark parents, set sort_order
-- Service ID:    0ec2e7ce-52c0-48e3-9f79-37f281dcebdf
-- Questionnaire: b5bd1815-377f-47b3-821c-c42bed5b512f
-- Excel sheet:   11.4.4.S_CIN
-- Note: DB uses prefix CII_ (not CIN_) for standards and criteria codes
-- Standards:
--   CII_TH  11899f80-21e3-4a36-ad7c-da49659800e4
--   CII_INF 579b15bf-7b10-4a64-bf4b-d32c66c20934
--   CII_DOT a8753417-f448-4d07-946e-48aaea3ed4ab
--   CII_MD  836b0d41-c1c9-4b10-92ce-8cd8a14a0ea7
--   CII_PP  a5b53651-687f-4d6d-be20-31e2d992e1e6
--   CII_HCR 779d9569-1403-4e94-bdf0-ee6e250fd7a3
--   CII_INT 31e07b11-3bb9-4b1f-bd0b-3b4ef4ec1835

-- Step 1: Mark 4 numbered gray rows as section headers
UPDATE evaluation_criteria SET is_section_header = true WHERE code IN (
    'CII-TH-005',
    'CII-INF-009',
    'CII-DOT-009',
    'CII-INT-007'
);

-- Step 2: Insert 12 pure section headers
INSERT INTO evaluation_criteria (id, standard_id, code, number, name, description, service_id, is_section_header, sort_order)
VALUES
    -- CII_TH (2 headers)
    (gen_random_uuid(), '11899f80-21e3-4a36-ad7c-da49659800e4', 'CII-TH-H01', '', 'Modalidades intramural, telemedicina - prestador remisor',                                   'Modalidades intramural, telemedicina - prestador remisor',                                   '0ec2e7ce-52c0-48e3-9f79-37f281dcebdf', true, 1),
    (gen_random_uuid(), '11899f80-21e3-4a36-ad7c-da49659800e4', 'CII-TH-H02', '', 'Modalidad telemedicina - prestador de referencia',                                           'Modalidad telemedicina - prestador de referencia',                                           '0ec2e7ce-52c0-48e3-9f79-37f281dcebdf', true, 11),
    -- CII_INF (2 headers)
    (gen_random_uuid(), '579b15bf-7b10-4a64-bf4b-d32c66c20934', 'CII-INF-H01', '', 'Modalidades intramural y telemedicina - prestador remisor',                                  'Modalidades intramural y telemedicina - prestador remisor',                                  '0ec2e7ce-52c0-48e3-9f79-37f281dcebdf', true, 1),
    (gen_random_uuid(), '579b15bf-7b10-4a64-bf4b-d32c66c20934', 'CII-INF-H02', '', 'Modalidad telemedicina - prestador de referencia',                                           'Modalidad telemedicina - prestador de referencia',                                           '0ec2e7ce-52c0-48e3-9f79-37f281dcebdf', true, 13),
    -- CII_DOT (2 headers)
    (gen_random_uuid(), 'a8753417-f448-4d07-946e-48aaea3ed4ab', 'CII-DOT-H01', '', 'Modalidades intramural y telemedicina - prestador remisor',                                  'Modalidades intramural y telemedicina - prestador remisor',                                  '0ec2e7ce-52c0-48e3-9f79-37f281dcebdf', true, 1),
    (gen_random_uuid(), 'a8753417-f448-4d07-946e-48aaea3ed4ab', 'CII-DOT-H02', '', 'Modalidad telemedicina - prestador de referencia',                                           'Modalidad telemedicina - prestador de referencia',                                           '0ec2e7ce-52c0-48e3-9f79-37f281dcebdf', true, 32),
    -- CII_MD (1 header)
    (gen_random_uuid(), '836b0d41-c1c9-4b10-92ce-8cd8a14a0ea7', 'CII-MD-H01', '', 'Modalidades intramural y telemedicina - prestador remisor',                                   'Modalidades intramural y telemedicina - prestador remisor',                                   '0ec2e7ce-52c0-48e3-9f79-37f281dcebdf', true, 1),
    -- CII_PP (2 headers)
    (gen_random_uuid(), 'a5b53651-687f-4d6d-be20-31e2d992e1e6', 'CII-PP-H01', '', 'Modalidades intramural y telemedicina - prestador remisor',                                   'Modalidades intramural y telemedicina - prestador remisor',                                   '0ec2e7ce-52c0-48e3-9f79-37f281dcebdf', true, 1),
    (gen_random_uuid(), 'a5b53651-687f-4d6d-be20-31e2d992e1e6', 'CII-PP-H02', '', 'Modalidad telemedicina - prestador de referencia',                                            'Modalidad telemedicina - prestador de referencia',                                            '0ec2e7ce-52c0-48e3-9f79-37f281dcebdf', true, 24),
    -- CII_HCR (1 header)
    (gen_random_uuid(), '779d9569-1403-4e94-bdf0-ee6e250fd7a3', 'CII-HCR-H01', '', 'Modalidades intramural y telemedicina - prestador remisor - prestador de referencia',       'Modalidades intramural y telemedicina - prestador remisor - prestador de referencia',       '0ec2e7ce-52c0-48e3-9f79-37f281dcebdf', true, 1),
    -- CII_INT (2 headers)
    (gen_random_uuid(), '31e07b11-3bb9-4b1f-bd0b-3b4ef4ec1835', 'CII-INT-H01', '', 'Modalidad intramural',                                                                       'Modalidad intramural',                                                                       '0ec2e7ce-52c0-48e3-9f79-37f281dcebdf', true, 1),
    (gen_random_uuid(), '31e07b11-3bb9-4b1f-bd0b-3b4ef4ec1835', 'CII-INT-H02', '', 'Modalidad telemedicina - prestador remisor - prestador de referencia',                      'Modalidad telemedicina - prestador remisor - prestador de referencia',                      '0ec2e7ce-52c0-48e3-9f79-37f281dcebdf', true, 12)
ON CONFLICT (code, service_id) DO NOTHING;

-- Step 3: Link all section headers to the CIN questionnaire
INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
SELECT 'b5bd1815-377f-47b3-821c-c42bed5b512f', ec.id
FROM evaluation_criteria ec
JOIN evaluation_standards es ON ec.standard_id = es.id
WHERE es.service_id = '0ec2e7ce-52c0-48e3-9f79-37f281dcebdf'
  AND ec.is_section_header = true
ON CONFLICT DO NOTHING;

-- Step 4: Set sort_order for CII_TH (14 rows: 2 headers + 12 criteria)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CII-TH-H01' AND service_id = '0ec2e7ce-52c0-48e3-9f79-37f281dcebdf';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CII-TH-001';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CII-TH-002';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CII-TH-003';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CII-TH-004';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CII-TH-005';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CII-TH-006';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CII-TH-007';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CII-TH-008';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CII-TH-009';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CII-TH-H02' AND service_id = '0ec2e7ce-52c0-48e3-9f79-37f281dcebdf';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CII-TH-010';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CII-TH-011';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CII-TH-012';

-- Step 5: Set sort_order for CII_INF (14 rows: 2 headers + 12 criteria)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CII-INF-H01' AND service_id = '0ec2e7ce-52c0-48e3-9f79-37f281dcebdf';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CII-INF-001';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CII-INF-002';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CII-INF-003';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CII-INF-004';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CII-INF-005';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CII-INF-006';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CII-INF-007';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CII-INF-008';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CII-INF-009';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CII-INF-010';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CII-INF-011';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CII-INF-H02' AND service_id = '0ec2e7ce-52c0-48e3-9f79-37f281dcebdf';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CII-INF-012';

-- Step 6: Set sort_order for CII_DOT (33 rows: 2 headers + 31 criteria)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CII-DOT-H01' AND service_id = '0ec2e7ce-52c0-48e3-9f79-37f281dcebdf';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CII-DOT-001';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CII-DOT-002';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CII-DOT-003';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CII-DOT-004';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CII-DOT-005';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CII-DOT-006';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CII-DOT-007';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CII-DOT-008';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CII-DOT-009';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CII-DOT-010';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CII-DOT-011';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CII-DOT-012';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CII-DOT-013';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CII-DOT-014';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'CII-DOT-015';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'CII-DOT-016';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'CII-DOT-017';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'CII-DOT-018';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'CII-DOT-019';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'CII-DOT-020';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'CII-DOT-021';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'CII-DOT-022';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'CII-DOT-023';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'CII-DOT-024';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'CII-DOT-025';
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'CII-DOT-026';
UPDATE evaluation_criteria SET sort_order = 28 WHERE code = 'CII-DOT-027';
UPDATE evaluation_criteria SET sort_order = 29 WHERE code = 'CII-DOT-028';
UPDATE evaluation_criteria SET sort_order = 30 WHERE code = 'CII-DOT-029';
UPDATE evaluation_criteria SET sort_order = 31 WHERE code = 'CII-DOT-030';
UPDATE evaluation_criteria SET sort_order = 32 WHERE code = 'CII-DOT-H02' AND service_id = '0ec2e7ce-52c0-48e3-9f79-37f281dcebdf';
UPDATE evaluation_criteria SET sort_order = 33 WHERE code = 'CII-DOT-031';

-- Step 7: Set sort_order for CII_MD (3 rows: 1 header + 2 criteria)
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CII-MD-H01' AND service_id = '0ec2e7ce-52c0-48e3-9f79-37f281dcebdf';
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CII-MD-001';
UPDATE evaluation_criteria SET sort_order = 3 WHERE code = 'CII-MD-002';

-- Step 8: Set sort_order for CII_PP (25 rows: 2 headers + 23 criteria)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CII-PP-H01' AND service_id = '0ec2e7ce-52c0-48e3-9f79-37f281dcebdf';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CII-PP-001';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CII-PP-002';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CII-PP-003';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CII-PP-004';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CII-PP-005';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CII-PP-006';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CII-PP-007';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CII-PP-008';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CII-PP-009';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CII-PP-010';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CII-PP-011';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CII-PP-012';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CII-PP-013';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CII-PP-014';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'CII-PP-015';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'CII-PP-016';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'CII-PP-017';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'CII-PP-018';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'CII-PP-019';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'CII-PP-020';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'CII-PP-021';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'CII-PP-022';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'CII-PP-H02' AND service_id = '0ec2e7ce-52c0-48e3-9f79-37f281dcebdf';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'CII-PP-023';

-- Step 9: Set sort_order for CII_HCR (2 rows: 1 header + 1 criterion)
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CII-HCR-H01' AND service_id = '0ec2e7ce-52c0-48e3-9f79-37f281dcebdf';
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CII-HCR-001';

-- Step 10: Set sort_order for CII_INT (13 rows: 2 headers + 11 criteria)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CII-INT-H01' AND service_id = '0ec2e7ce-52c0-48e3-9f79-37f281dcebdf';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CII-INT-001';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CII-INT-002';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CII-INT-003';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CII-INT-004';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CII-INT-005';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CII-INT-006';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CII-INT-007';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CII-INT-008';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CII-INT-009';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CII-INT-010';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CII-INT-H02' AND service_id = '0ec2e7ce-52c0-48e3-9f79-37f281dcebdf';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CII-INT-011';

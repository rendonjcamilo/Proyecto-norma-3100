-- Migration: CINN (Cuidado Intensivo Neonatal) - insert section headers, mark parents, set sort_order
-- Service ID:    b60d482c-10a0-413e-a2b7-9e889ee7c74e
-- Questionnaire: a95d07d0-6a18-4a15-ac46-7747b8c30a6c
-- Excel sheet:   11.4.5.S_CINN
-- Standards:
--   CINN_TH  70804a4b-e8c7-4f70-89b2-37a29097ba1d
--   CINN_INF d5761ed5-a8e7-4b24-9bd2-0f7fec5b17f2
--   CINN_MD  3c18e4cb-78e3-45c8-ad64-550b20ef2253
--   CINN_PP  e04b4848-9cee-4148-8862-527626e63154
--   CINN_HCR a1fab558-9072-42fc-a8d1-019ff2f2fa2a
--   CINN_INT 62807d93-e57d-4de9-affc-0e71e3360b57

-- Step 1: Mark 4 numbered gray rows as section headers
UPDATE evaluation_criteria SET is_section_header = true WHERE code IN (
    'CINN-TH-006',
    'CINN-INF-009',
    'CINN-INF-034',
    'CINN-INT-009'
);

-- Step 2: Insert 12 pure section headers
INSERT INTO evaluation_criteria (id, standard_id, code, number, name, description, service_id, is_section_header, sort_order)
VALUES
    -- CINN_TH (2 headers)
    (gen_random_uuid(), '70804a4b-e8c7-4f70-89b2-37a29097ba1d', 'CINN-TH-H01', '', 'Modalidad intramural, telemedicina - prestador remisor',                                       'Modalidad intramural, telemedicina - prestador remisor',                                       'b60d482c-10a0-413e-a2b7-9e889ee7c74e', true, 1),
    (gen_random_uuid(), '70804a4b-e8c7-4f70-89b2-37a29097ba1d', 'CINN-TH-H02', '', 'Modalidad telemedicina - prestador de referencia',                                              'Modalidad telemedicina - prestador de referencia',                                              'b60d482c-10a0-413e-a2b7-9e889ee7c74e', true, 14),
    -- CINN_INF (4 headers)
    (gen_random_uuid(), 'd5761ed5-a8e7-4b24-9bd2-0f7fec5b17f2', 'CINN-INF-H01', '', 'Modalidades intramural, telemedicina - prestador remisor',                                     'Modalidades intramural, telemedicina - prestador remisor',                                     'b60d482c-10a0-413e-a2b7-9e889ee7c74e', true, 1),
    (gen_random_uuid(), 'd5761ed5-a8e7-4b24-9bd2-0f7fec5b17f2', 'CINN-INF-H02', '', 'Modalidad telemedicina - prestador de referencia',                                              'Modalidad telemedicina - prestador de referencia',                                              'b60d482c-10a0-413e-a2b7-9e889ee7c74e', true, 13),
    (gen_random_uuid(), 'd5761ed5-a8e7-4b24-9bd2-0f7fec5b17f2', 'CINN-INF-H03', '', 'Modalidades intramural y telemedicina - prestador remisor',                                    'Modalidades intramural y telemedicina - prestador remisor',                                    'b60d482c-10a0-413e-a2b7-9e889ee7c74e', true, 15),
    (gen_random_uuid(), 'd5761ed5-a8e7-4b24-9bd2-0f7fec5b17f2', 'CINN-INF-H04', '', 'Modalidad telemedicina - prestador de referencia (dotacion)',                                   'Modalidad telemedicina - prestador de referencia (dotacion)',                                   'b60d482c-10a0-413e-a2b7-9e889ee7c74e', true, 56),
    -- CINN_MD (2 headers)
    (gen_random_uuid(), '3c18e4cb-78e3-45c8-ad64-550b20ef2253', 'CINN-MD-H01', '', 'Modalidades intramural y telemedicina - prestador remisor',                                     'Modalidades intramural y telemedicina - prestador remisor',                                     'b60d482c-10a0-413e-a2b7-9e889ee7c74e', true, 1),
    (gen_random_uuid(), '3c18e4cb-78e3-45c8-ad64-550b20ef2253', 'CINN-MD-H02', '', 'Modalidad telemedicina - prestador de referencia',                                              'Modalidad telemedicina - prestador de referencia',                                              'b60d482c-10a0-413e-a2b7-9e889ee7c74e', true, 4),
    -- CINN_PP (1 header)
    (gen_random_uuid(), 'e04b4848-9cee-4148-8862-527626e63154', 'CINN-PP-H01', '', 'Modalidades intramural y telemedicina - prestador remisor',                                     'Modalidades intramural y telemedicina - prestador remisor',                                     'b60d482c-10a0-413e-a2b7-9e889ee7c74e', true, 1),
    -- CINN_HCR (1 header)
    (gen_random_uuid(), 'a1fab558-9072-42fc-a8d1-019ff2f2fa2a', 'CINN-HCR-H01', '', 'Modalidades intramural, telemedicina - prestador remisor – prestador de referencia',          'Modalidades intramural, telemedicina - prestador remisor – prestador de referencia',          'b60d482c-10a0-413e-a2b7-9e889ee7c74e', true, 1),
    -- CINN_INT (2 headers)
    (gen_random_uuid(), '62807d93-e57d-4de9-affc-0e71e3360b57', 'CINN-INT-H01', '', 'Modalidades intramural',                                                                        'Modalidades intramural',                                                                        'b60d482c-10a0-413e-a2b7-9e889ee7c74e', true, 1),
    (gen_random_uuid(), '62807d93-e57d-4de9-affc-0e71e3360b57', 'CINN-INT-H02', '', 'Modalidad telemedicina - prestador remisor - prestador de referencia',                         'Modalidad telemedicina - prestador remisor - prestador de referencia',                         'b60d482c-10a0-413e-a2b7-9e889ee7c74e', true, 13)
ON CONFLICT (code, service_id) DO NOTHING;

-- Step 3: Link all section headers to CINN questionnaire
INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
SELECT 'a95d07d0-6a18-4a15-ac46-7747b8c30a6c', ec.id
FROM evaluation_criteria ec
JOIN evaluation_standards es ON ec.standard_id = es.id
WHERE es.service_id = 'b60d482c-10a0-413e-a2b7-9e889ee7c74e'
  AND ec.is_section_header = true
ON CONFLICT DO NOTHING;

-- Step 4: Set sort_order for CINN_TH (18 rows)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CINN-TH-H01';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CINN-TH-001';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CINN-TH-002';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CINN-TH-003';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CINN-TH-004';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CINN-TH-005';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CINN-TH-006';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CINN-TH-007';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CINN-TH-008';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CINN-TH-009';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CINN-TH-010';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CINN-TH-011';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CINN-TH-012';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CINN-TH-H02';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CINN-TH-013';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'CINN-TH-014';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'CINN-TH-015';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'CINN-TH-016';

-- Step 5: Set sort_order for CINN_INF (57 rows: 4 headers + 53 criteria)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CINN-INF-H01';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CINN-INF-001';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CINN-INF-002';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CINN-INF-003';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CINN-INF-004';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CINN-INF-005';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CINN-INF-006';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CINN-INF-007';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CINN-INF-008';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CINN-INF-009';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CINN-INF-010';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CINN-INF-011';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CINN-INF-H02';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CINN-INF-012';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CINN-INF-H03';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'CINN-INF-013';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'CINN-INF-014';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'CINN-INF-015';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'CINN-INF-016';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'CINN-INF-017';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'CINN-INF-018';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'CINN-INF-019';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'CINN-INF-020';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'CINN-INF-021';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'CINN-INF-022';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'CINN-INF-023';
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'CINN-INF-024';
UPDATE evaluation_criteria SET sort_order = 28 WHERE code = 'CINN-INF-025';
UPDATE evaluation_criteria SET sort_order = 29 WHERE code = 'CINN-INF-026';
UPDATE evaluation_criteria SET sort_order = 30 WHERE code = 'CINN-INF-027';
UPDATE evaluation_criteria SET sort_order = 31 WHERE code = 'CINN-INF-028';
UPDATE evaluation_criteria SET sort_order = 32 WHERE code = 'CINN-INF-029';
UPDATE evaluation_criteria SET sort_order = 33 WHERE code = 'CINN-INF-030';
UPDATE evaluation_criteria SET sort_order = 34 WHERE code = 'CINN-INF-031';
UPDATE evaluation_criteria SET sort_order = 35 WHERE code = 'CINN-INF-032';
UPDATE evaluation_criteria SET sort_order = 36 WHERE code = 'CINN-INF-033';
UPDATE evaluation_criteria SET sort_order = 37 WHERE code = 'CINN-INF-034';
UPDATE evaluation_criteria SET sort_order = 38 WHERE code = 'CINN-INF-035';
UPDATE evaluation_criteria SET sort_order = 39 WHERE code = 'CINN-INF-036';
UPDATE evaluation_criteria SET sort_order = 40 WHERE code = 'CINN-INF-037';
UPDATE evaluation_criteria SET sort_order = 41 WHERE code = 'CINN-INF-038';
UPDATE evaluation_criteria SET sort_order = 42 WHERE code = 'CINN-INF-039';
UPDATE evaluation_criteria SET sort_order = 43 WHERE code = 'CINN-INF-040';
UPDATE evaluation_criteria SET sort_order = 44 WHERE code = 'CINN-INF-041';
UPDATE evaluation_criteria SET sort_order = 45 WHERE code = 'CINN-INF-042';
UPDATE evaluation_criteria SET sort_order = 46 WHERE code = 'CINN-INF-043';
UPDATE evaluation_criteria SET sort_order = 47 WHERE code = 'CINN-INF-044';
UPDATE evaluation_criteria SET sort_order = 48 WHERE code = 'CINN-INF-045';
UPDATE evaluation_criteria SET sort_order = 49 WHERE code = 'CINN-INF-046';
UPDATE evaluation_criteria SET sort_order = 50 WHERE code = 'CINN-INF-047';
UPDATE evaluation_criteria SET sort_order = 51 WHERE code = 'CINN-INF-048';
UPDATE evaluation_criteria SET sort_order = 52 WHERE code = 'CINN-INF-049';
UPDATE evaluation_criteria SET sort_order = 53 WHERE code = 'CINN-INF-050';
UPDATE evaluation_criteria SET sort_order = 54 WHERE code = 'CINN-INF-051';
UPDATE evaluation_criteria SET sort_order = 55 WHERE code = 'CINN-INF-052';
UPDATE evaluation_criteria SET sort_order = 56 WHERE code = 'CINN-INF-H04';
UPDATE evaluation_criteria SET sort_order = 57 WHERE code = 'CINN-INF-053';

-- Step 6: Set sort_order for CINN_MD (5 rows)
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CINN-MD-H01';
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CINN-MD-001';
UPDATE evaluation_criteria SET sort_order = 3 WHERE code = 'CINN-MD-002';
UPDATE evaluation_criteria SET sort_order = 4 WHERE code = 'CINN-MD-H02';
UPDATE evaluation_criteria SET sort_order = 5 WHERE code = 'CINN-MD-003';

-- Step 7: Set sort_order for CINN_PP (39 rows)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CINN-PP-H01';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CINN-PP-001';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CINN-PP-002';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CINN-PP-003';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CINN-PP-004';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CINN-PP-005';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CINN-PP-006';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CINN-PP-007';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CINN-PP-008';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CINN-PP-009';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CINN-PP-010';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CINN-PP-011';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CINN-PP-012';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CINN-PP-013';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CINN-PP-014';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'CINN-PP-015';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'CINN-PP-016';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'CINN-PP-017';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'CINN-PP-018';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'CINN-PP-019';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'CINN-PP-020';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'CINN-PP-021';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'CINN-PP-022';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'CINN-PP-023';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'CINN-PP-024';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'CINN-PP-025';
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'CINN-PP-026';
UPDATE evaluation_criteria SET sort_order = 28 WHERE code = 'CINN-PP-027';
UPDATE evaluation_criteria SET sort_order = 29 WHERE code = 'CINN-PP-028';
UPDATE evaluation_criteria SET sort_order = 30 WHERE code = 'CINN-PP-029';
UPDATE evaluation_criteria SET sort_order = 31 WHERE code = 'CINN-PP-030';
UPDATE evaluation_criteria SET sort_order = 32 WHERE code = 'CINN-PP-031';
UPDATE evaluation_criteria SET sort_order = 33 WHERE code = 'CINN-PP-032';
UPDATE evaluation_criteria SET sort_order = 34 WHERE code = 'CINN-PP-033';
UPDATE evaluation_criteria SET sort_order = 35 WHERE code = 'CINN-PP-034';
UPDATE evaluation_criteria SET sort_order = 36 WHERE code = 'CINN-PP-035';
UPDATE evaluation_criteria SET sort_order = 37 WHERE code = 'CINN-PP-036';
UPDATE evaluation_criteria SET sort_order = 38 WHERE code = 'CINN-PP-037';
UPDATE evaluation_criteria SET sort_order = 39 WHERE code = 'CINN-PP-038';

-- Step 8: Set sort_order for CINN_HCR (2 rows)
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CINN-HCR-H01';
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CINN-HCR-001';

-- Step 9: Set sort_order for CINN_INT (14 rows)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CINN-INT-H01';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CINN-INT-001';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CINN-INT-002';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CINN-INT-003';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CINN-INT-004';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CINN-INT-005';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CINN-INT-006';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CINN-INT-007';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CINN-INT-008';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CINN-INT-009';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CINN-INT-010';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CINN-INT-011';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CINN-INT-H02';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CINN-INT-012';

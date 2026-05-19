-- CIM: Cuidado Intermedio Pediátrico — section headers + sort_order
-- Service ID:    a6891bd2-394a-42ca-bdf4-b10949afaac2
-- Questionnaire: 59b37d1b-83bd-4eac-a775-2ba6b435cb5e
-- Standards:
--   CIM_TH:  a5554e9c-d396-48fa-8067-ee1cad35f46c
--   CIM_INF: dc591b70-1154-4876-8570-aeb4dddb090f
--   CIM_DOT: 4f8cc7b6-80f8-4e82-bc6f-f3c5157010bb
--   CIM_MD:  6dc9ee29-be62-4363-921e-47439ccc8280
--   CIM_PP:  cd490b1a-9429-4778-842e-f20c5dd42d50
--   CIM_HCR: 0f91c07d-7857-4862-b9b6-199da2ba3107
--   CIM_INT: 81366789-53ff-42b3-bfb5-608523eecfe9

-- ============================================================
-- STEP 1: Mark gray+numbered rows as section headers
-- ============================================================
UPDATE evaluation_criteria SET is_section_header = true WHERE code = 'CIM-TH-005';
UPDATE evaluation_criteria SET is_section_header = true WHERE code = 'CIM-INF-012';
UPDATE evaluation_criteria SET is_section_header = true WHERE code = 'CIM-DOT-009';
UPDATE evaluation_criteria SET is_section_header = true WHERE code = 'CIM-INT-007';

-- ============================================================
-- STEP 2: Insert pure section headers (gray rows without number)
-- ============================================================
INSERT INTO evaluation_criteria (id, standard_id, code, number, name, description, service_id, is_section_header, sort_order)
VALUES
    -- CIM_TH (2 headers)
    (gen_random_uuid(), 'a5554e9c-d396-48fa-8067-ee1cad35f46c', 'CIM-TH-H01', '', 'Modalidad intramural, telemedicina - prestador remisor',                              'Modalidad intramural, telemedicina - prestador remisor',                              'a6891bd2-394a-42ca-bdf4-b10949afaac2', true, 1),
    (gen_random_uuid(), 'a5554e9c-d396-48fa-8067-ee1cad35f46c', 'CIM-TH-H02', '', 'Modalidad telemedicina - prestador de referencia',                                    'Modalidad telemedicina - prestador de referencia',                                    'a6891bd2-394a-42ca-bdf4-b10949afaac2', true, 11),
    -- CIM_INF (3 headers)
    (gen_random_uuid(), 'dc591b70-1154-4876-8570-aeb4dddb090f', 'CIM-INF-H01', '', 'Complejidad mediana',                                                                  'Complejidad mediana',                                                                  'a6891bd2-394a-42ca-bdf4-b10949afaac2', true, 1),
    (gen_random_uuid(), 'dc591b70-1154-4876-8570-aeb4dddb090f', 'CIM-INF-H02', '', 'Modalidades intramural, telemedicina - prestador remisor',                             'Modalidades intramural, telemedicina - prestador remisor',                             'a6891bd2-394a-42ca-bdf4-b10949afaac2', true, 2),
    (gen_random_uuid(), 'dc591b70-1154-4876-8570-aeb4dddb090f', 'CIM-INF-H03', '', 'Modalidad telemedicina - prestador de referencia',                                    'Modalidad telemedicina - prestador de referencia',                                    'a6891bd2-394a-42ca-bdf4-b10949afaac2', true, 17),
    -- CIM_DOT (3 headers)
    (gen_random_uuid(), '4f8cc7b6-80f8-4e82-bc6f-f3c5157010bb', 'CIM-DOT-H01', '', 'Complejidad mediana',                                                                  'Complejidad mediana',                                                                  'a6891bd2-394a-42ca-bdf4-b10949afaac2', true, 1),
    (gen_random_uuid(), '4f8cc7b6-80f8-4e82-bc6f-f3c5157010bb', 'CIM-DOT-H02', '', 'Modalidades intramural, telemedicina - prestador remisor',                             'Modalidades intramural, telemedicina - prestador remisor',                             'a6891bd2-394a-42ca-bdf4-b10949afaac2', true, 2),
    (gen_random_uuid(), '4f8cc7b6-80f8-4e82-bc6f-f3c5157010bb', 'CIM-DOT-H03', '', 'Modalidad telemedicina - prestador de referencia',                                    'Modalidad telemedicina - prestador de referencia',                                    'a6891bd2-394a-42ca-bdf4-b10949afaac2', true, 23),
    -- CIM_MD (3 headers)
    (gen_random_uuid(), '6dc9ee29-be62-4363-921e-47439ccc8280', 'CIM-MD-H01',  '', 'Complejidad mediana',                                                                  'Complejidad mediana',                                                                  'a6891bd2-394a-42ca-bdf4-b10949afaac2', true, 1),
    (gen_random_uuid(), '6dc9ee29-be62-4363-921e-47439ccc8280', 'CIM-MD-H02',  '', 'Modalidades intramural, telemedicina - prestador remisor',                             'Modalidades intramural, telemedicina - prestador remisor',                             'a6891bd2-394a-42ca-bdf4-b10949afaac2', true, 2),
    (gen_random_uuid(), '6dc9ee29-be62-4363-921e-47439ccc8280', 'CIM-MD-H03',  '', 'Modalidad telemedicina - prestador de referencia',                                    'Modalidad telemedicina - prestador de referencia',                                    'a6891bd2-394a-42ca-bdf4-b10949afaac2', true, 4),
    -- CIM_PP (3 headers)
    (gen_random_uuid(), 'cd490b1a-9429-4778-842e-f20c5dd42d50', 'CIM-PP-H01',  '', 'Complejidad mediana',                                                                  'Complejidad mediana',                                                                  'a6891bd2-394a-42ca-bdf4-b10949afaac2', true, 1),
    (gen_random_uuid(), 'cd490b1a-9429-4778-842e-f20c5dd42d50', 'CIM-PP-H02',  '', 'Modalidades intramural, telemedicina - prestador remisor',                             'Modalidades intramural, telemedicina - prestador remisor',                             'a6891bd2-394a-42ca-bdf4-b10949afaac2', true, 2),
    (gen_random_uuid(), 'cd490b1a-9429-4778-842e-f20c5dd42d50', 'CIM-PP-H03',  '', 'Modalidad telemedicina - prestador de referencia',                                    'Modalidad telemedicina - prestador de referencia',                                    'a6891bd2-394a-42ca-bdf4-b10949afaac2', true, 30),
    -- CIM_HCR (1 header)
    (gen_random_uuid(), '0f91c07d-7857-4862-b9b6-199da2ba3107', 'CIM-HCR-H01', '', 'Modalidades intramural, telemedicina - prestador remisor - prestador referencia',      'Modalidades intramural, telemedicina - prestador remisor - prestador referencia',      'a6891bd2-394a-42ca-bdf4-b10949afaac2', true, 1),
    -- CIM_INT (2 headers)
    (gen_random_uuid(), '81366789-53ff-42b3-bfb5-608523eecfe9', 'CIM-INT-H01', '', 'Modalidad intramural',                                                                 'Modalidad intramural',                                                                 'a6891bd2-394a-42ca-bdf4-b10949afaac2', true, 1),
    (gen_random_uuid(), '81366789-53ff-42b3-bfb5-608523eecfe9', 'CIM-INT-H02', '', 'Modalidad telemedicina - prestador remisor - prestador de referencia',                 'Modalidad telemedicina - prestador remisor - prestador de referencia',                 'a6891bd2-394a-42ca-bdf4-b10949afaac2', true, 11)
ON CONFLICT (code, service_id) DO NOTHING;

-- ============================================================
-- STEP 3: Link all section headers to CIM questionnaire
-- ============================================================
INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
SELECT '59b37d1b-83bd-4eac-a775-2ba6b435cb5e', ec.id
FROM evaluation_criteria ec
JOIN evaluation_standards es ON ec.standard_id = es.id
WHERE es.service_id = 'a6891bd2-394a-42ca-bdf4-b10949afaac2'
  AND ec.is_section_header = true
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 4: sort_order — CIM_TH
-- ============================================================
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CIM-TH-H01' AND service_id = 'a6891bd2-394a-42ca-bdf4-b10949afaac2';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CIM-TH-001';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CIM-TH-002';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CIM-TH-003';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CIM-TH-004';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CIM-TH-005';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CIM-TH-006';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CIM-TH-007';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CIM-TH-008';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CIM-TH-009';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CIM-TH-H02' AND service_id = 'a6891bd2-394a-42ca-bdf4-b10949afaac2';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CIM-TH-010';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CIM-TH-011';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CIM-TH-012';

-- ============================================================
-- STEP 5: sort_order — CIM_INF
-- ============================================================
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CIM-INF-H01' AND service_id = 'a6891bd2-394a-42ca-bdf4-b10949afaac2';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CIM-INF-H02' AND service_id = 'a6891bd2-394a-42ca-bdf4-b10949afaac2';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CIM-INF-001';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CIM-INF-002';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CIM-INF-003';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CIM-INF-004';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CIM-INF-005';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CIM-INF-006';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CIM-INF-007';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CIM-INF-008';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CIM-INF-009';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CIM-INF-010';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CIM-INF-011';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CIM-INF-012';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CIM-INF-013';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'CIM-INF-014';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'CIM-INF-H03' AND service_id = 'a6891bd2-394a-42ca-bdf4-b10949afaac2';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'CIM-INF-015';

-- ============================================================
-- STEP 6: sort_order — CIM_DOT
-- ============================================================
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CIM-DOT-H01' AND service_id = 'a6891bd2-394a-42ca-bdf4-b10949afaac2';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CIM-DOT-H02' AND service_id = 'a6891bd2-394a-42ca-bdf4-b10949afaac2';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CIM-DOT-001';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CIM-DOT-002';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CIM-DOT-003';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CIM-DOT-004';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CIM-DOT-005';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CIM-DOT-006';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CIM-DOT-007';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CIM-DOT-008';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CIM-DOT-009';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CIM-DOT-010';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CIM-DOT-011';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CIM-DOT-012';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CIM-DOT-013';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'CIM-DOT-014';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'CIM-DOT-015';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'CIM-DOT-016';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'CIM-DOT-017';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'CIM-DOT-018';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'CIM-DOT-019';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'CIM-DOT-020';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'CIM-DOT-H03' AND service_id = 'a6891bd2-394a-42ca-bdf4-b10949afaac2';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'CIM-DOT-021';

-- ============================================================
-- STEP 7: sort_order — CIM_MD
-- ============================================================
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CIM-MD-H01' AND service_id = 'a6891bd2-394a-42ca-bdf4-b10949afaac2';
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CIM-MD-H02' AND service_id = 'a6891bd2-394a-42ca-bdf4-b10949afaac2';
UPDATE evaluation_criteria SET sort_order = 3 WHERE code = 'CIM-MD-001';
UPDATE evaluation_criteria SET sort_order = 4 WHERE code = 'CIM-MD-H03' AND service_id = 'a6891bd2-394a-42ca-bdf4-b10949afaac2';
UPDATE evaluation_criteria SET sort_order = 5 WHERE code = 'CIM-MD-002';

-- ============================================================
-- STEP 8: sort_order — CIM_PP
-- ============================================================
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CIM-PP-H01' AND service_id = 'a6891bd2-394a-42ca-bdf4-b10949afaac2';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CIM-PP-H02' AND service_id = 'a6891bd2-394a-42ca-bdf4-b10949afaac2';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CIM-PP-001';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CIM-PP-002';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CIM-PP-003';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CIM-PP-004';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CIM-PP-005';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CIM-PP-006';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CIM-PP-007';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CIM-PP-008';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CIM-PP-009';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CIM-PP-010';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CIM-PP-011';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CIM-PP-012';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CIM-PP-013';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'CIM-PP-014';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'CIM-PP-015';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'CIM-PP-016';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'CIM-PP-017';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'CIM-PP-018';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'CIM-PP-019';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'CIM-PP-020';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'CIM-PP-021';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'CIM-PP-022';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'CIM-PP-023';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'CIM-PP-024';
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'CIM-PP-025';
UPDATE evaluation_criteria SET sort_order = 28 WHERE code = 'CIM-PP-026';
UPDATE evaluation_criteria SET sort_order = 29 WHERE code = 'CIM-PP-027';
UPDATE evaluation_criteria SET sort_order = 30 WHERE code = 'CIM-PP-H03' AND service_id = 'a6891bd2-394a-42ca-bdf4-b10949afaac2';
UPDATE evaluation_criteria SET sort_order = 31 WHERE code = 'CIM-PP-028';

-- ============================================================
-- STEP 9: sort_order — CIM_HCR
-- ============================================================
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CIM-HCR-H01' AND service_id = 'a6891bd2-394a-42ca-bdf4-b10949afaac2';
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CIM-HCR-001';

-- ============================================================
-- STEP 10: sort_order — CIM_INT
-- ============================================================
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CIM-INT-H01' AND service_id = 'a6891bd2-394a-42ca-bdf4-b10949afaac2';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CIM-INT-001';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CIM-INT-002';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CIM-INT-003';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CIM-INT-004';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CIM-INT-005';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CIM-INT-006';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CIM-INT-007';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CIM-INT-008';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CIM-INT-009';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CIM-INT-H02' AND service_id = 'a6891bd2-394a-42ca-bdf4-b10949afaac2';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CIM-INT-010';

-- Migration: CBN (Cuidado Básico Neonatal) - mark parent headers, set sort_order
-- Service ID: d4d7f1df-7969-4fba-82e3-595c49b214bb
-- Questionnaire ID: 907b5de2-f372-40f0-bfb3-32639d3597a7
-- Excel sheet: 11.4.3.S_CBN
-- Gray rows already in DB as regular criteria → mark as is_section_header=true:
--   CBN-TH-003  "2. Disponibilidad de:"
--   CBN-INF-007 "7. Los anteriores ambientes o áreas pueden ser compartidos..."
--   CBN-DOT-004 "12. Disponibilidad en el servicio de:"

-- Step 1: Mark 3 parent criteria as section headers
UPDATE evaluation_criteria SET is_section_header = true WHERE code IN (
    'CBN-TH-003',
    'CBN-INF-007',
    'CBN-DOT-004'
);

-- Step 2: Set sort_order for CBN_TH (9 rows total)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CBN-TH-H01';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CBN-TH-001';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CBN-TH-002';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CBN-TH-003';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CBN-TH-004';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CBN-TH-005';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CBN-TH-H02';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CBN-TH-006';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CBN-TH-007';

-- Step 3: Set sort_order for CBN_INF (12 rows total)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CBN-INF-H01';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CBN-INF-001';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CBN-INF-002';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CBN-INF-003';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CBN-INF-004';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CBN-INF-005';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CBN-INF-006';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CBN-INF-007';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CBN-INF-008';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CBN-INF-009';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CBN-INF-H02';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CBN-INF-010';

-- Step 4: Set sort_order for CBN_DOT (27 rows total)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CBN-DOT-H01';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CBN-DOT-001';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CBN-DOT-002';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CBN-DOT-003';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CBN-DOT-004';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CBN-DOT-005';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CBN-DOT-006';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CBN-DOT-007';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CBN-DOT-008';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CBN-DOT-009';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CBN-DOT-010';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CBN-DOT-011';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CBN-DOT-012';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CBN-DOT-013';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CBN-DOT-014';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'CBN-DOT-015';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'CBN-DOT-016';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'CBN-DOT-017';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'CBN-DOT-018';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'CBN-DOT-019';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'CBN-DOT-020';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'CBN-DOT-021';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'CBN-DOT-022';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'CBN-DOT-023';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'CBN-DOT-024';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'CBN-DOT-H02';
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'CBN-DOT-025';

-- Step 5: Set sort_order for CBN_MD (3 rows total)
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CBN-MD-H01';
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CBN-MD-001';
UPDATE evaluation_criteria SET sort_order = 3 WHERE code = 'CBN-MD-002';

-- Step 6: Set sort_order for CBN_PP (19 rows total)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CBN-PP-H01';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CBN-PP-001';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CBN-PP-002';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CBN-PP-003';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CBN-PP-004';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CBN-PP-005';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CBN-PP-006';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CBN-PP-007';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CBN-PP-008';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CBN-PP-009';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CBN-PP-010';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CBN-PP-011';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CBN-PP-012';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CBN-PP-013';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CBN-PP-014';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'CBN-PP-015';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'CBN-PP-016';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'CBN-PP-H02';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'CBN-PP-017';

-- Step 7: Set sort_order for CBN_HCR (2 rows total)
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CBN-HCR-H01';
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CBN-HCR-001';

-- Step 8: Set sort_order for CBN_INT (10 rows total)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CBN-INT-H01';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CBN-INT-001';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CBN-INT-002';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CBN-INT-003';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CBN-INT-004';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CBN-INT-005';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CBN-INT-006';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CBN-INT-007';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CBN-INT-H02';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CBN-INT-008';

-- Step 9: Link H-coded headers to CBN questionnaire (were missing from questionnaire_criteria)
INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
SELECT '907b5de2-f372-40f0-bfb3-32639d3597a7', ec.id
FROM evaluation_criteria ec
JOIN evaluation_standards es ON ec.standard_id = es.id
WHERE es.service_id = 'd4d7f1df-7969-4fba-82e3-595c49b214bb'
  AND ec.code LIKE '%-H0%'
ON CONFLICT DO NOTHING;

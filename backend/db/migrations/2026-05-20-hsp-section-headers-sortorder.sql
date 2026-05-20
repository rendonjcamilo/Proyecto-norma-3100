-- Migración: HSP (Hospitalización Parcial) — section headers y sort_order
-- Servicio: d3298ac3-6fd8-4752-b519-f21bc6f0da0e
-- Cuestionario: c53e91d0-919c-4b0e-a14a-ca319bd2d740
-- Excel: 11.4.11.S_HSP
-- Standards: HSP_TH, HSP_INF, HSP_DOT, HSP_MD, HSP_PP, HSP_HCR, HSP_INT

-- ============================================================
-- PASO 1: Marcar criterios con numeración como is_section_header=true
-- ============================================================

UPDATE evaluation_criteria SET is_section_header = true
WHERE code = 'HSP-TH-001';  -- 1. Cuenta con:

UPDATE evaluation_criteria SET is_section_header = true
WHERE code = 'HSP-TH-004';  -- 2. Disponibilidad de:

UPDATE evaluation_criteria SET is_section_header = true
WHERE code = 'HSP-INF-004';  -- 16. Cuenta con:

UPDATE evaluation_criteria SET is_section_header = true
WHERE code = 'HSP-INF-009';  -- 17. Disponibilidad de:

UPDATE evaluation_criteria SET is_section_header = true
WHERE code = 'HSP-INF-016';  -- 21. Cuenta con:

UPDATE evaluation_criteria SET is_section_header = true
WHERE code = 'HSP-INT-003';  -- 37. Disponibilidad de:

-- ============================================================
-- PASO 2: Insertar nuevos headers H-coded
-- ============================================================

-- HSP_TH (6 headers)
INSERT INTO evaluation_criteria (id, standard_id, code, number, name, description, service_id, is_section_header, sort_order)
VALUES
    (gen_random_uuid(), 'e10c4558-4ca6-4551-a83b-c06cc40b0403', 'HSP-TH-H01', '', 'Complejidad mediana', 'Complejidad mediana', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 1),
    (gen_random_uuid(), 'e10c4558-4ca6-4551-a83b-c06cc40b0403', 'HSP-TH-H02', '', 'Para el tratamiento en salud mental y consumo de sustancias psicoactivas', 'Para el tratamiento en salud mental y consumo de sustancias psicoactivas', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 2),
    (gen_random_uuid(), 'e10c4558-4ca6-4551-a83b-c06cc40b0403', 'HSP-TH-H03', '', 'Modalidades intramural, telemedicina - prestador remisor', 'Modalidades intramural, telemedicina - prestador remisor', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 3),
    (gen_random_uuid(), 'e10c4558-4ca6-4551-a83b-c06cc40b0403', 'HSP-TH-H04', '', 'Modalidad telemedicina - prestador de referencia', 'Modalidad telemedicina - prestador de referencia', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 13),
    (gen_random_uuid(), 'e10c4558-4ca6-4551-a83b-c06cc40b0403', 'HSP-TH-H05', '', 'Complejidad mediana - Para la atención de pacientes con otras patologías', 'Complejidad mediana - Para la atención de pacientes con otras patologías', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 18),
    (gen_random_uuid(), 'e10c4558-4ca6-4551-a83b-c06cc40b0403', 'HSP-TH-H06', '', 'Modalidad telemedicina - prestador de referencia', 'Modalidad telemedicina - prestador de referencia', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 24)
ON CONFLICT (code, service_id) DO NOTHING;

-- HSP_INF (8 headers)
INSERT INTO evaluation_criteria (id, standard_id, code, number, name, description, service_id, is_section_header, sort_order)
VALUES
    (gen_random_uuid(), '81856cda-c4fc-4a91-9e28-b31b95334555', 'HSP-INF-H01', '', 'Complejidad mediana', 'Complejidad mediana', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 1),
    (gen_random_uuid(), '81856cda-c4fc-4a91-9e28-b31b95334555', 'HSP-INF-H02', '', 'Para el tratamiento en salud mental y consumo de sustancias psicoactivas', 'Para el tratamiento en salud mental y consumo de sustancias psicoactivas', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 2),
    (gen_random_uuid(), '81856cda-c4fc-4a91-9e28-b31b95334555', 'HSP-INF-H03', '', 'Modalidades intramural y telemedicina - prestador remisor', 'Modalidades intramural y telemedicina - prestador remisor', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 3),
    (gen_random_uuid(), '81856cda-c4fc-4a91-9e28-b31b95334555', 'HSP-INF-H04', '', 'Modalidad telemedicina - prestador de referencia', 'Modalidad telemedicina - prestador de referencia', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 16),
    (gen_random_uuid(), '81856cda-c4fc-4a91-9e28-b31b95334555', 'HSP-INF-H05', '', 'Complejidad mediana', 'Complejidad mediana', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 18),
    (gen_random_uuid(), '81856cda-c4fc-4a91-9e28-b31b95334555', 'HSP-INF-H06', '', 'Para la atención de pacientes con otras patologías', 'Para la atención de pacientes con otras patologías', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 19),
    (gen_random_uuid(), '81856cda-c4fc-4a91-9e28-b31b95334555', 'HSP-INF-H07', '', 'Modalidades intramural y telemedicina - prestador remisor', 'Modalidades intramural y telemedicina - prestador remisor', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 20),
    (gen_random_uuid(), '81856cda-c4fc-4a91-9e28-b31b95334555', 'HSP-INF-H08', '', 'Modalidad telemedicina - prestador de referencia', 'Modalidad telemedicina - prestador de referencia', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 27)
ON CONFLICT (code, service_id) DO NOTHING;

-- HSP_DOT (3 headers)
INSERT INTO evaluation_criteria (id, standard_id, code, number, name, description, service_id, is_section_header, sort_order)
VALUES
    (gen_random_uuid(), '237ed3d0-85f0-45df-b19c-02c880b49a45', 'HSP-DOT-H01', '', 'Complejidad mediana', 'Complejidad mediana', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 1),
    (gen_random_uuid(), '237ed3d0-85f0-45df-b19c-02c880b49a45', 'HSP-DOT-H02', '', 'Para el tratamiento en salud mental y consumo de sustancias psicoactivas', 'Para el tratamiento en salud mental y consumo de sustancias psicoactivas', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 2),
    (gen_random_uuid(), '237ed3d0-85f0-45df-b19c-02c880b49a45', 'HSP-DOT-H03', '', 'Modalidades intramural y telemedicina - prestador remisor', 'Modalidades intramural y telemedicina - prestador remisor', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 3)
ON CONFLICT (code, service_id) DO NOTHING;

-- HSP_MD (8 headers)
INSERT INTO evaluation_criteria (id, standard_id, code, number, name, description, service_id, is_section_header, sort_order)
VALUES
    (gen_random_uuid(), '479d5f92-aa72-4849-ae47-761910a6077d', 'HSP-MD-H01', '', 'Complejidad mediana', 'Complejidad mediana', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 3),
    (gen_random_uuid(), '479d5f92-aa72-4849-ae47-761910a6077d', 'HSP-MD-H02', '', 'Para el tratamiento en salud mental y consumo de sustancias psicoactivas', 'Para el tratamiento en salud mental y consumo de sustancias psicoactivas', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 4),
    (gen_random_uuid(), '479d5f92-aa72-4849-ae47-761910a6077d', 'HSP-MD-H03', '', 'Modalidades intramural y telemedicina – prestador remisor', 'Modalidades intramural y telemedicina – prestador remisor', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 5),
    (gen_random_uuid(), '479d5f92-aa72-4849-ae47-761910a6077d', 'HSP-MD-H04', '', 'Modalidad telemedicina - prestador de referencia', 'Modalidad telemedicina - prestador de referencia', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 10),
    (gen_random_uuid(), '479d5f92-aa72-4849-ae47-761910a6077d', 'HSP-MD-H05', '', 'Complejidad mediana', 'Complejidad mediana', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 12),
    (gen_random_uuid(), '479d5f92-aa72-4849-ae47-761910a6077d', 'HSP-MD-H06', '', 'Para la atención de pacientes con otras patologías', 'Para la atención de pacientes con otras patologías', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 13),
    (gen_random_uuid(), '479d5f92-aa72-4849-ae47-761910a6077d', 'HSP-MD-H07', '', 'Modalidades intramural y telemedicina - prestador remisor', 'Modalidades intramural y telemedicina - prestador remisor', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 14),
    (gen_random_uuid(), '479d5f92-aa72-4849-ae47-761910a6077d', 'HSP-MD-H08', '', 'Modalidad telemedicina - prestador de referencia', 'Modalidad telemedicina - prestador de referencia', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 16)
ON CONFLICT (code, service_id) DO NOTHING;

-- HSP_PP (12 headers)
INSERT INTO evaluation_criteria (id, standard_id, code, number, name, description, service_id, is_section_header, sort_order)
VALUES
    (gen_random_uuid(), '85f5a2ea-a68e-4cfa-a220-9e366fe0953d', 'HSP-PP-H01', '', 'Modalidad telemedicina - prestador de referencia', 'Modalidad telemedicina - prestador de referencia', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 3),
    (gen_random_uuid(), '85f5a2ea-a68e-4cfa-a220-9e366fe0953d', 'HSP-PP-H02', '', 'Complejidad mediana', 'Complejidad mediana', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 5),
    (gen_random_uuid(), '85f5a2ea-a68e-4cfa-a220-9e366fe0953d', 'HSP-PP-H03', '', 'Para la atención de pacientes con otras patologías', 'Para la atención de pacientes con otras patologías', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 6),
    (gen_random_uuid(), '85f5a2ea-a68e-4cfa-a220-9e366fe0953d', 'HSP-PP-H04', '', 'Modalidad telemedicina - prestador de referencia', 'Modalidad telemedicina - prestador de referencia', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 10),
    (gen_random_uuid(), '85f5a2ea-a68e-4cfa-a220-9e366fe0953d', 'HSP-PP-H05', '', 'Complejidad mediana', 'Complejidad mediana', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 12),
    (gen_random_uuid(), '85f5a2ea-a68e-4cfa-a220-9e366fe0953d', 'HSP-PP-H06', '', 'Para la atención y tratamiento en salud mental y consumo de sustancias psicoactivas', 'Para la atención y tratamiento en salud mental y consumo de sustancias psicoactivas', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 13),
    (gen_random_uuid(), '85f5a2ea-a68e-4cfa-a220-9e366fe0953d', 'HSP-PP-H07', '', 'Modalidades intramural y telemedicina - prestador remisor', 'Modalidades intramural y telemedicina - prestador remisor', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 14),
    (gen_random_uuid(), '85f5a2ea-a68e-4cfa-a220-9e366fe0953d', 'HSP-PP-H08', '', 'Modalidad telemedicina - prestador de referencia', 'Modalidad telemedicina - prestador de referencia', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 50),
    (gen_random_uuid(), '85f5a2ea-a68e-4cfa-a220-9e366fe0953d', 'HSP-PP-H09', '', 'Complejidad mediana', 'Complejidad mediana', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 52),
    (gen_random_uuid(), '85f5a2ea-a68e-4cfa-a220-9e366fe0953d', 'HSP-PP-H10', '', 'Para la atención de pacientes con otras patologías', 'Para la atención de pacientes con otras patologías', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 53),
    (gen_random_uuid(), '85f5a2ea-a68e-4cfa-a220-9e366fe0953d', 'HSP-PP-H11', '', 'Modalidades intramural y telemedicina - prestador remisor', 'Modalidades intramural y telemedicina - prestador remisor', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 54),
    (gen_random_uuid(), '85f5a2ea-a68e-4cfa-a220-9e366fe0953d', 'HSP-PP-H12', '', 'Modalidad telemedicina Prestador de referencia', 'Modalidad telemedicina Prestador de referencia', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 68)
ON CONFLICT (code, service_id) DO NOTHING;

-- HSP_HCR (3 headers)
INSERT INTO evaluation_criteria (id, standard_id, code, number, name, description, service_id, is_section_header, sort_order)
VALUES
    (gen_random_uuid(), 'a2ede542-214f-460d-aa2c-7fd892fba5df', 'HSP-HCR-H01', '', 'Complejidad mediana', 'Complejidad mediana', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 1),
    (gen_random_uuid(), 'a2ede542-214f-460d-aa2c-7fd892fba5df', 'HSP-HCR-H02', '', 'Para la atención y tratamiento en salud mental y consumo de sustancias psicoactivas y para la atención de pacientes con otras patologías', 'Para la atención y tratamiento en salud mental y consumo de sustancias psicoactivas y para la atención de pacientes con otras patologías', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 2),
    (gen_random_uuid(), 'a2ede542-214f-460d-aa2c-7fd892fba5df', 'HSP-HCR-H03', '', 'Modalidades intramural y telemedicina - prestador remisor – prestador de referencia', 'Modalidades intramural y telemedicina - prestador remisor – prestador de referencia', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 3)
ON CONFLICT (code, service_id) DO NOTHING;

-- HSP_INT (7 headers)
INSERT INTO evaluation_criteria (id, standard_id, code, number, name, description, service_id, is_section_header, sort_order)
VALUES
    (gen_random_uuid(), '92b95e58-7d4f-4991-a51d-44da41e06ad3', 'HSP-INT-H01', '', 'Complejidad mediana', 'Complejidad mediana', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 1),
    (gen_random_uuid(), '92b95e58-7d4f-4991-a51d-44da41e06ad3', 'HSP-INT-H02', '', 'Para la atención y tratamiento en salud mental y consumo de sustancias psicoactivas', 'Para la atención y tratamiento en salud mental y consumo de sustancias psicoactivas', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 2),
    (gen_random_uuid(), '92b95e58-7d4f-4991-a51d-44da41e06ad3', 'HSP-INT-H03', '', 'Modalidad intramural', 'Modalidad intramural', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 3),
    (gen_random_uuid(), '92b95e58-7d4f-4991-a51d-44da41e06ad3', 'HSP-INT-H04', '', 'Complejidad mediana', 'Complejidad mediana', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 10),
    (gen_random_uuid(), '92b95e58-7d4f-4991-a51d-44da41e06ad3', 'HSP-INT-H05', '', 'Para la atención de pacientes con otras patologías', 'Para la atención de pacientes con otras patologías', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 11),
    (gen_random_uuid(), '92b95e58-7d4f-4991-a51d-44da41e06ad3', 'HSP-INT-H06', '', 'Modalidad intramural', 'Modalidad intramural', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 12),
    (gen_random_uuid(), '92b95e58-7d4f-4991-a51d-44da41e06ad3', 'HSP-INT-H07', '', 'Modalidad telemedicina - prestador remisor – prestador de referencia', 'Modalidad telemedicina - prestador remisor – prestador de referencia', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e', true, 15)
ON CONFLICT (code, service_id) DO NOTHING;

-- ============================================================
-- PASO 3: Vincular todos los nuevos headers al cuestionario
-- ============================================================

INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
SELECT 'c53e91d0-919c-4b0e-a14a-ca319bd2d740', ec.id
FROM evaluation_criteria ec
JOIN evaluation_standards es ON ec.standard_id = es.id
WHERE es.service_id = 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e'
  AND ec.is_section_header = true
  AND ec.code LIKE 'HSP-%-H%'
ON CONFLICT (questionnaire_id, criterion_id) DO NOTHING;

-- ============================================================
-- PASO 4: sort_order para HSP_TH
-- ============================================================

UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'HSP-TH-001';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'HSP-TH-002';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'HSP-TH-003';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'HSP-TH-004';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'HSP-TH-005';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'HSP-TH-006';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'HSP-TH-007';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'HSP-TH-008';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'HSP-TH-009';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'HSP-TH-010';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'HSP-TH-011';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'HSP-TH-012';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'HSP-TH-013';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'HSP-TH-014';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'HSP-TH-015';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'HSP-TH-016';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'HSP-TH-017';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'HSP-TH-018';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'HSP-TH-019';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'HSP-TH-020';
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'HSP-TH-021';

-- ============================================================
-- PASO 5: sort_order para HSP_INF
-- ============================================================

UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'HSP-INF-001';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'HSP-INF-002';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'HSP-INF-003';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'HSP-INF-004';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'HSP-INF-005';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'HSP-INF-006';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'HSP-INF-007';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'HSP-INF-008';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'HSP-INF-009';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'HSP-INF-010';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'HSP-INF-011';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'HSP-INF-012';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'HSP-INF-013';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'HSP-INF-014';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'HSP-INF-015';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'HSP-INF-016';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'HSP-INF-017';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'HSP-INF-018';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'HSP-INF-019';
UPDATE evaluation_criteria SET sort_order = 28 WHERE code = 'HSP-INF-020';
UPDATE evaluation_criteria SET sort_order = 29 WHERE code = 'HSP-INF-021';
UPDATE evaluation_criteria SET sort_order = 30 WHERE code = 'HSP-INF-022';
UPDATE evaluation_criteria SET sort_order = 31 WHERE code = 'HSP-INF-023';
UPDATE evaluation_criteria SET sort_order = 32 WHERE code = 'HSP-INF-024';
UPDATE evaluation_criteria SET sort_order = 33 WHERE code = 'HSP-INF-025';

-- ============================================================
-- PASO 6: sort_order para HSP_DOT
-- ============================================================

UPDATE evaluation_criteria SET sort_order = 4 WHERE code = 'HSP-DOT-001';
UPDATE evaluation_criteria SET sort_order = 5 WHERE code = 'HSP-DOT-002';
UPDATE evaluation_criteria SET sort_order = 6 WHERE code = 'HSP-DOT-003';
UPDATE evaluation_criteria SET sort_order = 7 WHERE code = 'HSP-DOT-004';
UPDATE evaluation_criteria SET sort_order = 8 WHERE code = 'HSP-DOT-005';

-- ============================================================
-- PASO 7: sort_order para HSP_MD
-- ============================================================

UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'HSP-MD-001';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'HSP-MD-002';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'HSP-MD-003';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'HSP-MD-004';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'HSP-MD-005';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'HSP-MD-006';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'HSP-MD-007';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'HSP-MD-008';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'HSP-MD-009';

-- ============================================================
-- PASO 8: sort_order para HSP_PP
-- ============================================================

UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'HSP-PP-001';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'HSP-PP-002';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'HSP-PP-003';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'HSP-PP-004';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'HSP-PP-005';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'HSP-PP-006';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'HSP-PP-007';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'HSP-PP-008';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'HSP-PP-009';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'HSP-PP-010';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'HSP-PP-011';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'HSP-PP-012';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'HSP-PP-013';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'HSP-PP-014';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'HSP-PP-015';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'HSP-PP-016';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'HSP-PP-017';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'HSP-PP-018';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'HSP-PP-019';
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'HSP-PP-020';
UPDATE evaluation_criteria SET sort_order = 28 WHERE code = 'HSP-PP-021';
UPDATE evaluation_criteria SET sort_order = 29 WHERE code = 'HSP-PP-022';
UPDATE evaluation_criteria SET sort_order = 30 WHERE code = 'HSP-PP-023';
UPDATE evaluation_criteria SET sort_order = 31 WHERE code = 'HSP-PP-024';
UPDATE evaluation_criteria SET sort_order = 32 WHERE code = 'HSP-PP-025';
UPDATE evaluation_criteria SET sort_order = 33 WHERE code = 'HSP-PP-026';
UPDATE evaluation_criteria SET sort_order = 34 WHERE code = 'HSP-PP-027';
UPDATE evaluation_criteria SET sort_order = 35 WHERE code = 'HSP-PP-028';
UPDATE evaluation_criteria SET sort_order = 36 WHERE code = 'HSP-PP-029';
UPDATE evaluation_criteria SET sort_order = 37 WHERE code = 'HSP-PP-030';
UPDATE evaluation_criteria SET sort_order = 38 WHERE code = 'HSP-PP-031';
UPDATE evaluation_criteria SET sort_order = 39 WHERE code = 'HSP-PP-032';
UPDATE evaluation_criteria SET sort_order = 40 WHERE code = 'HSP-PP-033';
UPDATE evaluation_criteria SET sort_order = 41 WHERE code = 'HSP-PP-034';
UPDATE evaluation_criteria SET sort_order = 42 WHERE code = 'HSP-PP-035';
UPDATE evaluation_criteria SET sort_order = 43 WHERE code = 'HSP-PP-036';
UPDATE evaluation_criteria SET sort_order = 44 WHERE code = 'HSP-PP-037';
UPDATE evaluation_criteria SET sort_order = 45 WHERE code = 'HSP-PP-038';
UPDATE evaluation_criteria SET sort_order = 46 WHERE code = 'HSP-PP-039';
UPDATE evaluation_criteria SET sort_order = 47 WHERE code = 'HSP-PP-040';
UPDATE evaluation_criteria SET sort_order = 48 WHERE code = 'HSP-PP-041';
UPDATE evaluation_criteria SET sort_order = 49 WHERE code = 'HSP-PP-042';
UPDATE evaluation_criteria SET sort_order = 51 WHERE code = 'HSP-PP-043';
UPDATE evaluation_criteria SET sort_order = 55 WHERE code = 'HSP-PP-044';
UPDATE evaluation_criteria SET sort_order = 56 WHERE code = 'HSP-PP-045';
UPDATE evaluation_criteria SET sort_order = 57 WHERE code = 'HSP-PP-046';
UPDATE evaluation_criteria SET sort_order = 58 WHERE code = 'HSP-PP-047';
UPDATE evaluation_criteria SET sort_order = 59 WHERE code = 'HSP-PP-048';
UPDATE evaluation_criteria SET sort_order = 60 WHERE code = 'HSP-PP-049';
UPDATE evaluation_criteria SET sort_order = 61 WHERE code = 'HSP-PP-050';
UPDATE evaluation_criteria SET sort_order = 62 WHERE code = 'HSP-PP-051';
UPDATE evaluation_criteria SET sort_order = 63 WHERE code = 'HSP-PP-052';
UPDATE evaluation_criteria SET sort_order = 64 WHERE code = 'HSP-PP-053';
UPDATE evaluation_criteria SET sort_order = 65 WHERE code = 'HSP-PP-054';
UPDATE evaluation_criteria SET sort_order = 66 WHERE code = 'HSP-PP-055';
UPDATE evaluation_criteria SET sort_order = 67 WHERE code = 'HSP-PP-056';
UPDATE evaluation_criteria SET sort_order = 69 WHERE code = 'HSP-PP-057';
UPDATE evaluation_criteria SET sort_order = 70 WHERE code = 'HSP-PP-058';

-- ============================================================
-- PASO 9: sort_order para HSP_HCR
-- ============================================================

UPDATE evaluation_criteria SET sort_order = 4 WHERE code = 'HSP-HCR-001';

-- ============================================================
-- PASO 10: sort_order para HSP_INT
-- ============================================================

UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'HSP-INT-001';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'HSP-INT-002';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'HSP-INT-003';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'HSP-INT-004';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'HSP-INT-005';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'HSP-INT-006';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'HSP-INT-007';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'HSP-INT-008';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'HSP-INT-009';

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

SELECT es.code AS standard,
    COUNT(*) FILTER (WHERE ec.is_section_header = true) AS headers,
    COUNT(*) FILTER (WHERE ec.is_section_header = false OR ec.is_section_header IS NULL) AS criterios,
    COUNT(*) FILTER (WHERE ec.sort_order IS NULL) AS sin_sort,
    COUNT(*) FILTER (WHERE ec.is_section_header = true AND qc.criterion_id IS NULL) AS headers_sin_link
FROM evaluation_criteria ec
JOIN evaluation_standards es ON ec.standard_id = es.id
LEFT JOIN questionnaire_criteria qc
    ON qc.criterion_id = ec.id
    AND qc.questionnaire_id = 'c53e91d0-919c-4b0e-a14a-ca319bd2d740'
WHERE es.service_id = 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e'
GROUP BY es.code
ORDER BY es.code;

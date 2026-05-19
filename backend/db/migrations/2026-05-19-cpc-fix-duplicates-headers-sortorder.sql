-- CPC (Cuidado Básico - Consumo de Sustancias Psicoactivas): eliminar duplicados, section headers, sort_order
-- Excel fuente: 11.4.12.S_CB_CSP | 2026-05-19
-- Service id      : 7dc36046-7190-478a-b82f-32735378844c
-- Questionnaire id: 3e0573eb-8f3a-43e7-baaa-584c84b938e2
-- Standard ids:
--   CPC_TH  d2fbed32-6321-421b-a895-8cf36fd50efa
--   CPC_INF 50c5ad5a-de25-4b97-82b0-a635e7ab27f8
--   CPC_DOT 0b89974f-1d6e-475e-8cae-a7b4c3e20da1
--   CPC_MD  d09e81fb-073d-45c5-bb1a-d9b68c3c4c4e
--   CPC_PP  32f0c46f-11bc-463a-b6ce-105d3a045d06
--   CPC_HCR b7bdf873-6aac-4c75-8141-c63b88247f4e
--   CPC_INT ebdcbda9-4505-43e9-a595-a8340bf11195

-- ================================================================
-- 1. Eliminar duplicados en CPC_DOT (criterios 21-22 que pertenecen a CPC_MD)
-- ================================================================
DELETE FROM evaluation_criteria
WHERE code IN ('CPC-DOT-013','CPC-DOT-014','CPC-DOT-015','CPC-DOT-016','CPC-DOT-017')
  AND service_id = '7dc36046-7190-478a-b82f-32735378844c';

-- ================================================================
-- 2. Marcar criterios padres grises como section headers
-- ================================================================
UPDATE evaluation_criteria SET is_section_header = true
WHERE code IN ('CPC-TH-007', 'CPC-INF-004', 'CPC-INF-013')
  AND service_id = '7dc36046-7190-478a-b82f-32735378844c';

-- ================================================================
-- 3. Insertar section headers puros
-- ================================================================
INSERT INTO evaluation_criteria
  (id, code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header, complexity, sort_order)
VALUES
-- CPC_TH (3 headers)
  (gen_random_uuid(), 'CPC-TH-HDR-001', '', 'Complejidad mediana', 'Complejidad mediana',
   'd2fbed32-6321-421b-a895-8cf36fd50efa', '7dc36046-7190-478a-b82f-32735378844c',
   true, 'active', true, 'simple', 1),
  (gen_random_uuid(), 'CPC-TH-HDR-002', '', 'Modalidades intramural, telemedicina - prestador remisor', 'Modalidades intramural, telemedicina - prestador remisor',
   'd2fbed32-6321-421b-a895-8cf36fd50efa', '7dc36046-7190-478a-b82f-32735378844c',
   true, 'active', true, 'simple', 2),
  (gen_random_uuid(), 'CPC-TH-HDR-003', '', 'Modalidad telemedicina - prestador de referencia', 'Modalidad telemedicina - prestador de referencia',
   'd2fbed32-6321-421b-a895-8cf36fd50efa', '7dc36046-7190-478a-b82f-32735378844c',
   true, 'active', true, 'simple', 19),
-- CPC_INF (3 headers)
  (gen_random_uuid(), 'CPC-INF-HDR-001', '', 'Complejidad mediana', 'Complejidad mediana',
   '50c5ad5a-de25-4b97-82b0-a635e7ab27f8', '7dc36046-7190-478a-b82f-32735378844c',
   true, 'active', true, 'simple', 1),
  (gen_random_uuid(), 'CPC-INF-HDR-002', '', 'Modalidades intramural y telemedicina - prestador remisor', 'Modalidades intramural y telemedicina - prestador remisor',
   '50c5ad5a-de25-4b97-82b0-a635e7ab27f8', '7dc36046-7190-478a-b82f-32735378844c',
   true, 'active', true, 'simple', 2),
  (gen_random_uuid(), 'CPC-INF-HDR-003', '', 'Modalidad telemedicina - prestador de referencia', 'Modalidad telemedicina - prestador de referencia',
   '50c5ad5a-de25-4b97-82b0-a635e7ab27f8', '7dc36046-7190-478a-b82f-32735378844c',
   true, 'active', true, 'simple', 18),
-- CPC_DOT (3 headers)
  (gen_random_uuid(), 'CPC-DOT-HDR-001', '', 'Complejidad mediana', 'Complejidad mediana',
   '0b89974f-1d6e-475e-8cae-a7b4c3e20da1', '7dc36046-7190-478a-b82f-32735378844c',
   true, 'active', true, 'simple', 1),
  (gen_random_uuid(), 'CPC-DOT-HDR-002', '', 'Modalidades intramural, telemedicina - prestador remisor', 'Modalidades intramural, telemedicina - prestador remisor',
   '0b89974f-1d6e-475e-8cae-a7b4c3e20da1', '7dc36046-7190-478a-b82f-32735378844c',
   true, 'active', true, 'simple', 2),
  (gen_random_uuid(), 'CPC-DOT-HDR-003', '', 'Modalidad telemedicina - prestador de referencia', 'Modalidad telemedicina - prestador de referencia',
   '0b89974f-1d6e-475e-8cae-a7b4c3e20da1', '7dc36046-7190-478a-b82f-32735378844c',
   true, 'active', true, 'simple', 14),
-- CPC_MD (3 headers)
  (gen_random_uuid(), 'CPC-MD-HDR-001', '', 'Complejidad mediana', 'Complejidad mediana',
   'd09e81fb-073d-45c5-bb1a-d9b68c3c4c4e', '7dc36046-7190-478a-b82f-32735378844c',
   true, 'active', true, 'simple', 1),
  (gen_random_uuid(), 'CPC-MD-HDR-002', '', 'Modalidades intramural, telemedicina - prestador remisor', 'Modalidades intramural, telemedicina - prestador remisor',
   'd09e81fb-073d-45c5-bb1a-d9b68c3c4c4e', '7dc36046-7190-478a-b82f-32735378844c',
   true, 'active', true, 'simple', 2),
  (gen_random_uuid(), 'CPC-MD-HDR-003', '', 'Modalidad telemedicina - prestador de referencia', 'Modalidad telemedicina - prestador de referencia',
   'd09e81fb-073d-45c5-bb1a-d9b68c3c4c4e', '7dc36046-7190-478a-b82f-32735378844c',
   true, 'active', true, 'simple', 7),
-- CPC_PP (3 headers)
  (gen_random_uuid(), 'CPC-PP-HDR-001', '', 'Complejidad mediana', 'Complejidad mediana',
   '32f0c46f-11bc-463a-b6ce-105d3a045d06', '7dc36046-7190-478a-b82f-32735378844c',
   true, 'active', true, 'simple', 1),
  (gen_random_uuid(), 'CPC-PP-HDR-002', '', 'Modalidades intramural, telemedicina - prestador remisor', 'Modalidades intramural, telemedicina - prestador remisor',
   '32f0c46f-11bc-463a-b6ce-105d3a045d06', '7dc36046-7190-478a-b82f-32735378844c',
   true, 'active', true, 'simple', 2),
  (gen_random_uuid(), 'CPC-PP-HDR-003', '', 'Modalidad telemedicina - prestador de referencia', 'Modalidad telemedicina - prestador de referencia',
   '32f0c46f-11bc-463a-b6ce-105d3a045d06', '7dc36046-7190-478a-b82f-32735378844c',
   true, 'active', true, 'simple', 31),
-- CPC_HCR (2 headers)
  (gen_random_uuid(), 'CPC-HCR-HDR-001', '', 'Complejidad mediana', 'Complejidad mediana',
   'b7bdf873-6aac-4c75-8141-c63b88247f4e', '7dc36046-7190-478a-b82f-32735378844c',
   true, 'active', true, 'simple', 1),
  (gen_random_uuid(), 'CPC-HCR-HDR-002', '', 'Modalidades intramural y telemedicina - prestador remisor y prestador de referencia', 'Modalidades intramural y telemedicina - prestador remisor y prestador de referencia',
   'b7bdf873-6aac-4c75-8141-c63b88247f4e', '7dc36046-7190-478a-b82f-32735378844c',
   true, 'active', true, 'simple', 2),
-- CPC_INT (3 headers)
  (gen_random_uuid(), 'CPC-INT-HDR-001', '', 'Complejidad mediana', 'Complejidad mediana',
   'ebdcbda9-4505-43e9-a595-a8340bf11195', '7dc36046-7190-478a-b82f-32735378844c',
   true, 'active', true, 'simple', 1),
  (gen_random_uuid(), 'CPC-INT-HDR-002', '', 'Modalidad intramural', 'Modalidad intramural',
   'ebdcbda9-4505-43e9-a595-a8340bf11195', '7dc36046-7190-478a-b82f-32735378844c',
   true, 'active', true, 'simple', 2),
  (gen_random_uuid(), 'CPC-INT-HDR-003', '', 'Modalidad telemedicina - prestador remisor y prestador de referencia', 'Modalidad telemedicina - prestador remisor y prestador de referencia',
   'ebdcbda9-4505-43e9-a595-a8340bf11195', '7dc36046-7190-478a-b82f-32735378844c',
   true, 'active', true, 'simple', 8);

-- ================================================================
-- 4. Vincular todos los section headers al cuestionario CPC
-- ================================================================
INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
SELECT '3e0573eb-8f3a-43e7-baaa-584c84b938e2', ec.id
FROM evaluation_criteria ec
WHERE ec.service_id = '7dc36046-7190-478a-b82f-32735378844c'
  AND ec.is_section_header = true
ON CONFLICT DO NOTHING;

-- ================================================================
-- 5. sort_order — CPC_TH (23 filas: 4 headers + 19 criterios)
-- ================================================================
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CPC-TH-001' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CPC-TH-002' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CPC-TH-003' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CPC-TH-004' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CPC-TH-005' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CPC-TH-006' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CPC-TH-007' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CPC-TH-008' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CPC-TH-009' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CPC-TH-010' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CPC-TH-011' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CPC-TH-012' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CPC-TH-013' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'CPC-TH-014' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'CPC-TH-015' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'CPC-TH-016' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'CPC-TH-017' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'CPC-TH-018' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'CPC-TH-019' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'CPC-TH-020' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';

-- ================================================================
-- 6. sort_order — CPC_INF (19 filas: 5 headers + 14 criterios)
-- ================================================================
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CPC-INF-001' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CPC-INF-002' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CPC-INF-003' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CPC-INF-004' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CPC-INF-005' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CPC-INF-006' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CPC-INF-007' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CPC-INF-008' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CPC-INF-009' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CPC-INF-010' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CPC-INF-011' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CPC-INF-012' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CPC-INF-013' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'CPC-INF-014' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'CPC-INF-015' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'CPC-INF-016' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';

-- ================================================================
-- 7. sort_order — CPC_DOT (15 filas: 3 headers + 12 criterios)
-- ================================================================
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CPC-DOT-001' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CPC-DOT-002' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CPC-DOT-003' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CPC-DOT-004' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CPC-DOT-005' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CPC-DOT-006' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CPC-DOT-007' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CPC-DOT-008' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CPC-DOT-009' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CPC-DOT-010' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CPC-DOT-011' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CPC-DOT-012' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';

-- ================================================================
-- 8. sort_order — CPC_MD (8 filas: 3 headers + 5 criterios)
-- ================================================================
UPDATE evaluation_criteria SET sort_order = 3 WHERE code = 'CPC-MD-001' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 4 WHERE code = 'CPC-MD-002' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 5 WHERE code = 'CPC-MD-003' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 6 WHERE code = 'CPC-MD-004' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 8 WHERE code = 'CPC-MD-005' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';

-- ================================================================
-- 9. sort_order — CPC_PP (32 filas: 3 headers + 29 criterios)
-- ================================================================
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CPC-PP-001' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CPC-PP-002' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CPC-PP-003' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CPC-PP-004' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CPC-PP-005' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CPC-PP-006' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CPC-PP-007' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CPC-PP-008' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CPC-PP-009' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CPC-PP-010' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CPC-PP-011' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CPC-PP-012' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CPC-PP-013' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'CPC-PP-014' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'CPC-PP-015' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'CPC-PP-016' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'CPC-PP-017' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'CPC-PP-018' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'CPC-PP-019' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'CPC-PP-020' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'CPC-PP-021' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'CPC-PP-022' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'CPC-PP-023' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'CPC-PP-024' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'CPC-PP-025' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 28 WHERE code = 'CPC-PP-026' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 29 WHERE code = 'CPC-PP-027' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 30 WHERE code = 'CPC-PP-028' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 32 WHERE code = 'CPC-PP-029' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';

-- ================================================================
-- 10. sort_order — CPC_HCR (3 filas: 2 headers + 1 criterio)
-- ================================================================
UPDATE evaluation_criteria SET sort_order = 3 WHERE code = 'CPC-HCR-001' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';

-- ================================================================
-- 11. sort_order — CPC_INT (9 filas: 3 headers + 6 criterios)
-- ================================================================
UPDATE evaluation_criteria SET sort_order = 3 WHERE code = 'CPC-INT-001' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 4 WHERE code = 'CPC-INT-002' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 5 WHERE code = 'CPC-INT-003' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 6 WHERE code = 'CPC-INT-004' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 7 WHERE code = 'CPC-INT-005' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';
UPDATE evaluation_criteria SET sort_order = 9 WHERE code = 'CPC-INT-006' AND service_id = '7dc36046-7190-478a-b82f-32735378844c';

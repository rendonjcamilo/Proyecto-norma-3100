-- CEV (Vacunación): section headers + sort_order
-- Excel fuente: 11.2.3.S_CE_V | 2026-05-19
-- Service id : 807084cb-05c6-46d7-ae64-f1ed63749821
-- Questionnaire id: 6fa0ba88-39a7-43a6-9ac8-e2ef17f40075
-- Standard ids:
--   CEV_TH  99c63ef5-86ed-4507-a033-4911cfea23f6
--   CEV_INF ed2ed437-2371-4bfe-b2af-3cd7aaf2eef0
--   CEV_DOT e357a33e-eac2-494a-9435-4bc1baec0d7c
--   CEV_MD  3183b2a0-aa07-4e96-8b9d-25d82fc3c080
--   CEV_PP  82379264-d224-4225-81d3-faf6fea8f0ec
--   CEV_HCR 8601bd31-0e0e-45ec-929b-5f9743bb876d
--   CEV_INT c7e0fc2b-f5de-4036-aae6-a41fc483d71e

-- ================================================================
-- 1. Marcar criterios padres grises como section headers
-- ================================================================
UPDATE evaluation_criteria SET is_section_header = true
WHERE code IN ('CEV-TH-003', 'CEV-INF-012', 'CEV-INF-022')
  AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';

-- ================================================================
-- 2. Insertar section headers puros (gris sin número)
-- ================================================================
INSERT INTO evaluation_criteria
  (id, code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header, complexity, sort_order)
VALUES
-- CEV_TH (2 headers)
  (gen_random_uuid(), 'CEV-TH-HDR-001', '', 'Complejidad baja', 'Complejidad baja',
   '99c63ef5-86ed-4507-a033-4911cfea23f6', '807084cb-05c6-46d7-ae64-f1ed63749821',
   true, 'active', true, 'simple', 1),
  (gen_random_uuid(), 'CEV-TH-HDR-002', '', 'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria', 'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria',
   '99c63ef5-86ed-4507-a033-4911cfea23f6', '807084cb-05c6-46d7-ae64-f1ed63749821',
   true, 'active', true, 'simple', 2),
-- CEV_INF (3 headers puros; 4.3 y 4.5 son criterios existentes actualizados)
  (gen_random_uuid(), 'CEV-INF-HDR-001', '', 'Complejidad baja', 'Complejidad baja',
   'ed2ed437-2371-4bfe-b2af-3cd7aaf2eef0', '807084cb-05c6-46d7-ae64-f1ed63749821',
   true, 'active', true, 'simple', 1),
  (gen_random_uuid(), 'CEV-INF-HDR-002', '', 'Modalidad intramural', 'Modalidad intramural',
   'ed2ed437-2371-4bfe-b2af-3cd7aaf2eef0', '807084cb-05c6-46d7-ae64-f1ed63749821',
   true, 'active', true, 'simple', 2),
  (gen_random_uuid(), 'CEV-INF-HDR-003', '', 'Modalidades extramural unidad móvil, jornada de salud y domiciliaria', 'Modalidades extramural unidad móvil, jornada de salud y domiciliaria',
   'ed2ed437-2371-4bfe-b2af-3cd7aaf2eef0', '807084cb-05c6-46d7-ae64-f1ed63749821',
   true, 'active', true, 'simple', 27),
-- CEV_DOT (3 headers)
  (gen_random_uuid(), 'CEV-DOT-HDR-001', '', 'Complejidad baja', 'Complejidad baja',
   'e357a33e-eac2-494a-9435-4bc1baec0d7c', '807084cb-05c6-46d7-ae64-f1ed63749821',
   true, 'active', true, 'simple', 1),
  (gen_random_uuid(), 'CEV-DOT-HDR-002', '', 'Modalidad intramural', 'Modalidad intramural',
   'e357a33e-eac2-494a-9435-4bc1baec0d7c', '807084cb-05c6-46d7-ae64-f1ed63749821',
   true, 'active', true, 'simple', 2),
  (gen_random_uuid(), 'CEV-DOT-HDR-003', '', 'Modalidades extramural unidad móvil, jornada de salud y domiciliaria', 'Modalidades extramural unidad móvil, jornada de salud y domiciliaria',
   'e357a33e-eac2-494a-9435-4bc1baec0d7c', '807084cb-05c6-46d7-ae64-f1ed63749821',
   true, 'active', true, 'simple', 7),
-- CEV_MD (2 headers)
  (gen_random_uuid(), 'CEV-MD-HDR-001', '', 'Complejidad baja', 'Complejidad baja',
   '3183b2a0-aa07-4e96-8b9d-25d82fc3c080', '807084cb-05c6-46d7-ae64-f1ed63749821',
   true, 'active', true, 'simple', 1),
  (gen_random_uuid(), 'CEV-MD-HDR-002', '', 'Modalidad intramural, extramural unidad móvil, jornada de salud y domiciliaria', 'Modalidad intramural, extramural unidad móvil, jornada de salud y domiciliaria',
   '3183b2a0-aa07-4e96-8b9d-25d82fc3c080', '807084cb-05c6-46d7-ae64-f1ed63749821',
   true, 'active', true, 'simple', 2),
-- CEV_PP (3 headers)
  (gen_random_uuid(), 'CEV-PP-HDR-001', '', 'Complejidad baja', 'Complejidad baja',
   '82379264-d224-4225-81d3-faf6fea8f0ec', '807084cb-05c6-46d7-ae64-f1ed63749821',
   true, 'active', true, 'simple', 1),
  (gen_random_uuid(), 'CEV-PP-HDR-002', '', 'Modalidad intramural', 'Modalidad intramural',
   '82379264-d224-4225-81d3-faf6fea8f0ec', '807084cb-05c6-46d7-ae64-f1ed63749821',
   true, 'active', true, 'simple', 2),
  (gen_random_uuid(), 'CEV-PP-HDR-003', '', 'Modalidades extramural unidad móvil, jornada de salud y domiciliaria', 'Modalidades extramural unidad móvil, jornada de salud y domiciliaria',
   '82379264-d224-4225-81d3-faf6fea8f0ec', '807084cb-05c6-46d7-ae64-f1ed63749821',
   true, 'active', true, 'simple', 10),
-- CEV_HCR (2 headers)
  (gen_random_uuid(), 'CEV-HCR-HDR-001', '', 'Complejidad baja', 'Complejidad baja',
   '8601bd31-0e0e-45ec-929b-5f9743bb876d', '807084cb-05c6-46d7-ae64-f1ed63749821',
   true, 'active', true, 'simple', 1),
  (gen_random_uuid(), 'CEV-HCR-HDR-002', '', 'Modalidad intramural, extramural unidad móvil, jornada de salud y domiciliaria', 'Modalidad intramural, extramural unidad móvil, jornada de salud y domiciliaria',
   '8601bd31-0e0e-45ec-929b-5f9743bb876d', '807084cb-05c6-46d7-ae64-f1ed63749821',
   true, 'active', true, 'simple', 2),
-- CEV_INT (2 headers)
  (gen_random_uuid(), 'CEV-INT-HDR-001', '', 'Complejidad baja', 'Complejidad baja',
   'c7e0fc2b-f5de-4036-aae6-a41fc483d71e', '807084cb-05c6-46d7-ae64-f1ed63749821',
   true, 'active', true, 'simple', 1),
  (gen_random_uuid(), 'CEV-INT-HDR-002', '', 'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria', 'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria',
   'c7e0fc2b-f5de-4036-aae6-a41fc483d71e', '807084cb-05c6-46d7-ae64-f1ed63749821',
   true, 'active', true, 'simple', 2);

-- ================================================================
-- 3. Vincular todos los section headers al cuestionario CEV
-- ================================================================
INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
SELECT '6fa0ba88-39a7-43a6-9ac8-e2ef17f40075', ec.id
FROM evaluation_criteria ec
WHERE ec.service_id = '807084cb-05c6-46d7-ae64-f1ed63749821'
  AND ec.is_section_header = true
ON CONFLICT DO NOTHING;

-- ================================================================
-- 4. sort_order — CEV_TH (7 filas)
-- ================================================================
UPDATE evaluation_criteria SET sort_order = 3 WHERE code = 'CEV-TH-001' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 4 WHERE code = 'CEV-TH-002' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 5 WHERE code = 'CEV-TH-003' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 6 WHERE code = 'CEV-TH-004' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 7 WHERE code = 'CEV-TH-005' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';

-- ================================================================
-- 5. sort_order — CEV_INF (32 filas)
-- ================================================================
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CEV-INF-001' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CEV-INF-002' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CEV-INF-003' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CEV-INF-004' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CEV-INF-005' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CEV-INF-006' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CEV-INF-007' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CEV-INF-008' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CEV-INF-009' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CEV-INF-010' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'CEV-INF-011' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CEV-INF-012' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CEV-INF-013' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'CEV-INF-014' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'CEV-INF-015' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'CEV-INF-016' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'CEV-INF-017' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'CEV-INF-018' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'CEV-INF-019' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'CEV-INF-020' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'CEV-INF-021' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'CEV-INF-022' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'CEV-INF-023' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'CEV-INF-024' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 28 WHERE code = 'CEV-INF-025' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 29 WHERE code = 'CEV-INF-026' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 30 WHERE code = 'CEV-INF-027' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 31 WHERE code = 'CEV-INF-028' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 32 WHERE code = 'CEV-INF-029' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';

-- ================================================================
-- 6. sort_order — CEV_DOT (11 filas)
-- ================================================================
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CEV-DOT-001' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CEV-DOT-002' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CEV-DOT-003' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CEV-DOT-004' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CEV-DOT-005' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CEV-DOT-006' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CEV-DOT-007' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CEV-DOT-008' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';

-- ================================================================
-- 7. sort_order — CEV_MD (3 filas)
-- ================================================================
UPDATE evaluation_criteria SET sort_order = 3 WHERE code = 'CEV-MD-001' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';

-- ================================================================
-- 8. sort_order — CEV_PP (11 filas)
-- ================================================================
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'CEV-PP-001' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CEV-PP-002' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'CEV-PP-003' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'CEV-PP-004' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'CEV-PP-005' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'CEV-PP-006' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'CEV-PP-007' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'CEV-PP-008' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';

-- ================================================================
-- 9. sort_order — CEV_HCR (6 filas)
-- ================================================================
UPDATE evaluation_criteria SET sort_order = 3 WHERE code = 'CEV-HCR-001' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 4 WHERE code = 'CEV-HCR-002' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 5 WHERE code = 'CEV-HCR-003' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';
UPDATE evaluation_criteria SET sort_order = 6 WHERE code = 'CEV-HCR-004' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';

-- ================================================================
-- 10. sort_order — CEV_INT (3 filas)
-- ================================================================
UPDATE evaluation_criteria SET sort_order = 3 WHERE code = 'CEV-INT-001' AND service_id = '807084cb-05c6-46d7-ae64-f1ed63749821';

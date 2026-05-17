-- =============================================================================
-- TLC (Toma de Muestras de Laboratorio Clínico): corrección estándares + headers + sort_order
--
-- Servicio TLC:     6758b161-9816-428f-a8a7-ae01e13dad78
-- Cuestionario TLC: 4cb9e0c5-e935-4ca6-b1d0-a760c29e9cd4
-- Fuente Excel:     hoja '11.3.11.S_TMLC'
--
-- Problemas encontrados:
--   1. TLC-DOT-002 ("8. Cumple...") asignado a TLC_DOT por error — es un duplicado
--      de TLC-MD-001 que pertenece a TLC_MD (Medicamentos). Se elimina.
--   2. TLC_MD  → TLC_MED  (Excel ya usa TMLC_MED)
--   3. TLC_HCR → TLC_HC
--   4. Sin section headers en evaluation_criteria ni en questionnaire_criteria
--   5. sort_order = NULL en todos los registros
--
-- Total criterios evaluables tras corrección: 27 (era 28 con duplicado)
-- =============================================================================

BEGIN;

-- 1. Eliminar duplicado TLC-DOT-002 ("8. Cumple..." pertenece a TLC_MD, no a TLC_DOT)
--    CASCADE borra automáticamente questionnaire_criteria y assessment_responses_detailed
DELETE FROM evaluation_criteria
WHERE id = '59ab1a62-fa50-40c7-9768-6ab67c9e48bd'; -- TLC-DOT-002

UPDATE questionnaires SET total_criteria = 27
WHERE id = '4cb9e0c5-e935-4ca6-b1d0-a760c29e9cd4';

-- 2. Renombrar estándares
UPDATE evaluation_standards SET code = 'TLC_MED'
WHERE code = 'TLC_MD'  AND service_id = '6758b161-9816-428f-a8a7-ae01e13dad78';

UPDATE evaluation_standards SET code = 'TLC_HC'
WHERE code = 'TLC_HCR' AND service_id = '6758b161-9816-428f-a8a7-ae01e13dad78';

-- 3. Renombrar códigos de criterios
UPDATE evaluation_criteria
SET code = REPLACE(code, 'TLC-MD-', 'TLC-MED-')
WHERE service_id = '6758b161-9816-428f-a8a7-ae01e13dad78'
  AND code LIKE 'TLC-MD-%';

UPDATE evaluation_criteria
SET code = REPLACE(code, 'TLC-HCR-', 'TLC-HC-')
WHERE service_id = '6758b161-9816-428f-a8a7-ae01e13dad78'
  AND code LIKE 'TLC-HCR-%';

-- 4. Insertar 8 section headers en evaluation_criteria (number='' y name=descripción para headers)
INSERT INTO evaluation_criteria (id, code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES
  -- TH
  ('6fa4d297-576f-41c6-8e5d-50976970bad9', 'TLC-TH-H01', '',
   'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria',
   'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria',
   '92525e1b-4db1-4a5a-8397-75e25bd9be45', '6758b161-9816-428f-a8a7-ae01e13dad78', TRUE, 'active', TRUE),

  -- INF (2 headers)
  ('6769f6ec-185e-46de-8fc1-b1b6cff58f54', 'TLC-INF-H01', '',
   'Modalidad intramural',
   'Modalidad intramural',
   '9e1fb2fb-19b5-4815-8d46-71724d635d59', '6758b161-9816-428f-a8a7-ae01e13dad78', TRUE, 'active', TRUE),
  ('a9734bd9-1206-498d-9f75-0d0d44b567a0', 'TLC-INF-H02', '',
   'Modalidades extramural unidad móvil, jornada de salud y domiciliaria',
   'Modalidades extramural unidad móvil, jornada de salud y domiciliaria',
   '9e1fb2fb-19b5-4815-8d46-71724d635d59', '6758b161-9816-428f-a8a7-ae01e13dad78', TRUE, 'active', TRUE),

  -- DOT
  ('f4aa0b0a-e25f-4877-b641-1fa347cad80d', 'TLC-DOT-H01', '',
   'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria',
   'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria',
   'b10dd76a-3b62-474f-994d-bd55430a1606', '6758b161-9816-428f-a8a7-ae01e13dad78', TRUE, 'active', TRUE),

  -- MED (antes MD)
  ('04aef6a4-a90b-4c90-a48b-5980de064724', 'TLC-MED-H01', '',
   'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria',
   'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria',
   '163475db-e70d-428a-b700-6dc47fb28628', '6758b161-9816-428f-a8a7-ae01e13dad78', TRUE, 'active', TRUE),

  -- PP
  ('94d8d6ed-76a4-45f7-bd20-ac94683d64dd', 'TLC-PP-H01', '',
   'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria',
   'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria',
   '555e7491-e53f-4d54-b174-646e6c0250c8', '6758b161-9816-428f-a8a7-ae01e13dad78', TRUE, 'active', TRUE),

  -- HC (antes HCR)
  ('aa4c6b25-0725-410e-9568-375200ce5fc6', 'TLC-HC-H01', '',
   'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria',
   'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria',
   '1174f1d7-30d4-403d-9875-6c36b84d7a6f', '6758b161-9816-428f-a8a7-ae01e13dad78', TRUE, 'active', TRUE),

  -- INT
  ('9bcbd2b8-e099-44c0-9cc8-924545fb3f92', 'TLC-INT-H01', '',
   'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria',
   'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria',
   '33644ef7-43cd-487d-a71f-d6351bc00c06', '6758b161-9816-428f-a8a7-ae01e13dad78', TRUE, 'active', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 5. Agregar 8 section headers al cuestionario TLC
INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
VALUES
  ('4cb9e0c5-e935-4ca6-b1d0-a760c29e9cd4', '6fa4d297-576f-41c6-8e5d-50976970bad9'), -- TLC-TH-H01
  ('4cb9e0c5-e935-4ca6-b1d0-a760c29e9cd4', '6769f6ec-185e-46de-8fc1-b1b6cff58f54'), -- TLC-INF-H01
  ('4cb9e0c5-e935-4ca6-b1d0-a760c29e9cd4', 'a9734bd9-1206-498d-9f75-0d0d44b567a0'), -- TLC-INF-H02
  ('4cb9e0c5-e935-4ca6-b1d0-a760c29e9cd4', 'f4aa0b0a-e25f-4877-b641-1fa347cad80d'), -- TLC-DOT-H01
  ('4cb9e0c5-e935-4ca6-b1d0-a760c29e9cd4', '04aef6a4-a90b-4c90-a48b-5980de064724'), -- TLC-MED-H01
  ('4cb9e0c5-e935-4ca6-b1d0-a760c29e9cd4', '94d8d6ed-76a4-45f7-bd20-ac94683d64dd'), -- TLC-PP-H01
  ('4cb9e0c5-e935-4ca6-b1d0-a760c29e9cd4', 'aa4c6b25-0725-410e-9568-375200ce5fc6'), -- TLC-HC-H01
  ('4cb9e0c5-e935-4ca6-b1d0-a760c29e9cd4', '9bcbd2b8-e099-44c0-9cc8-924545fb3f92')  -- TLC-INT-H01
ON CONFLICT DO NOTHING;

-- 6. sort_order según orden exacto del Excel (hoja '11.3.11.S_TMLC')
UPDATE evaluation_criteria AS ec
SET sort_order = v.s
FROM (VALUES
  -- TH (standard: 92525e1b)
  ('6fa4d297-576f-41c6-8e5d-50976970bad9'::uuid,  1),  -- TLC-TH-H01
  ('ccb6cc4f-bf53-4935-a84a-f0a6b4064c82'::uuid,  2),  -- TLC-TH-001
  ('561c1802-9e08-4ad4-beb7-662947959a90'::uuid,  3),  -- TLC-TH-002

  -- INF (standard: 9e1fb2fb) — 2 headers intercalados
  ('6769f6ec-185e-46de-8fc1-b1b6cff58f54'::uuid,  1),  -- TLC-INF-H01
  ('7a5ad5df-6174-4540-b769-291d1340acc4'::uuid,  2),  -- TLC-INF-001
  ('8c9460e9-e3bd-479d-b845-296126efd9fa'::uuid,  3),  -- TLC-INF-002
  ('01781b8e-c232-4430-af0d-a8398df7b00a'::uuid,  4),  -- TLC-INF-003
  ('b557b418-d534-433d-a913-041349be01ce'::uuid,  5),  -- TLC-INF-004
  ('c7924728-d1bd-493b-a252-c8e9a55ad599'::uuid,  6),  -- TLC-INF-005
  ('6872dca9-cd8b-4e10-940b-6fbb00058bac'::uuid,  7),  -- TLC-INF-006
  ('ed75bab2-4db5-4b3f-afb1-05735e049d6d'::uuid,  8),  -- TLC-INF-007
  ('9cf69346-afd7-4e3b-a39d-f837dd569725'::uuid,  9),  -- TLC-INF-008
  ('86768d65-94b2-4983-8832-10bdc47a653f'::uuid, 10),  -- TLC-INF-009
  ('1e163787-5447-431a-93e6-17d455ba0dfc'::uuid, 11),  -- TLC-INF-010
  ('27967223-7239-4bd4-b647-493cdcbb8d81'::uuid, 12),  -- TLC-INF-011
  ('a9734bd9-1206-498d-9f75-0d0d44b567a0'::uuid, 13),  -- TLC-INF-H02
  ('27a1072c-dec4-4262-95de-1c6b32204ffd'::uuid, 14),  -- TLC-INF-012

  -- DOT (standard: b10dd76a)
  ('f4aa0b0a-e25f-4877-b641-1fa347cad80d'::uuid,  1),  -- TLC-DOT-H01
  ('b40efb0b-567a-4e22-8e23-ea1195893fd5'::uuid,  2),  -- TLC-DOT-001

  -- MED (standard: 163475db; era TLC_MD)
  ('04aef6a4-a90b-4c90-a48b-5980de064724'::uuid,  1),  -- TLC-MED-H01
  ('b6d3c215-5f44-413c-bc44-23300de76c3f'::uuid,  2),  -- TLC-MED-001

  -- PP (standard: 555e7491)
  ('94d8d6ed-76a4-45f7-bd20-ac94683d64dd'::uuid,  1),  -- TLC-PP-H01
  ('30932375-3f75-4e6f-b23f-4e5fe5ac9cdd'::uuid,  2),  -- TLC-PP-001
  ('28d2bc72-4ac2-48a2-ade2-bdb560f0f8c3'::uuid,  3),  -- TLC-PP-002
  ('9186bdaa-baeb-4dd0-acdd-0def4c346160'::uuid,  4),  -- TLC-PP-003
  ('44f70a4b-2906-40f8-baf3-e3f8facf9178'::uuid,  5),  -- TLC-PP-004
  ('bfb92337-6506-4558-8acd-7cba67fad247'::uuid,  6),  -- TLC-PP-005

  -- HC (standard: 1174f1d7; era TLC_HCR)
  ('aa4c6b25-0725-410e-9568-375200ce5fc6'::uuid,  1),  -- TLC-HC-H01
  ('e59b4cd6-3acc-4580-8e66-7c47ebffbc63'::uuid,  2),  -- TLC-HC-001
  ('b6334176-bd84-46ea-8690-c7906aa0f34a'::uuid,  3),  -- TLC-HC-002
  ('67e7e877-3255-4123-9e41-01b494333b2e'::uuid,  4),  -- TLC-HC-003
  ('b2568ad0-b1b1-4f00-837b-ae6e94d4adb9'::uuid,  5),  -- TLC-HC-004
  ('ad559688-8a5e-4d41-9efb-bf9c7b2442eb'::uuid,  6),  -- TLC-HC-005

  -- INT (standard: 33644ef7)
  ('9bcbd2b8-e099-44c0-9cc8-924545fb3f92'::uuid,  1),  -- TLC-INT-H01
  ('ecd4cc3e-12f1-4829-8f70-74499d89f9fd'::uuid,  2)   -- TLC-INT-001
) AS v(id, s)
WHERE ec.id = v.id;

COMMIT;

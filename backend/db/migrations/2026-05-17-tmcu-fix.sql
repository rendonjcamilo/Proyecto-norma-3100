-- =============================================================================
-- TMCU (Toma de Muestras de Cuello Uterino): corrección estándares + headers + sort_order
--
-- Servicio TMCU:     40658c0f-31e4-488e-8afe-48b5f6081fab
-- Cuestionario TMCU: 7256eee7-60fd-48fc-b859-0a724a7b1fef
-- Fuente Excel:      hoja ' 11.3.13 S_TM_CU'
--
-- Cambios:
--   TMCU_MD  → TMCU_MED  (Medicamentos, Dispositivos Médicos e Insumos)
--   TMCU_HCR → TMCU_HC   (Historia Clínica y Registros)
--   TMCU-MD-*  → TMCU-MED-*  (códigos de criterios)
--   TMCU-HCR-* → TMCU-HC-*   (códigos de criterios)
--   + Agrega 10 section headers a questionnaire_criteria
--   + Establece sort_order siguiendo el orden exacto del Excel
-- =============================================================================

BEGIN;

-- 1. Renombrar estándares
UPDATE evaluation_standards SET code = 'TMCU_MED'
WHERE code = 'TMCU_MD'  AND service_id = '40658c0f-31e4-488e-8afe-48b5f6081fab';

UPDATE evaluation_standards SET code = 'TMCU_HC'
WHERE code = 'TMCU_HCR' AND service_id = '40658c0f-31e4-488e-8afe-48b5f6081fab';

-- 2. Renombrar códigos de criterios
UPDATE evaluation_criteria
SET code = REPLACE(code, 'TMCU-MD-', 'TMCU-MED-')
WHERE service_id = '40658c0f-31e4-488e-8afe-48b5f6081fab'
  AND code LIKE 'TMCU-MD-%';

UPDATE evaluation_criteria
SET code = REPLACE(code, 'TMCU-HCR-', 'TMCU-HC-')
WHERE service_id = '40658c0f-31e4-488e-8afe-48b5f6081fab'
  AND code LIKE 'TMCU-HCR-%';

-- 3. Agregar 10 section headers al cuestionario TMCU
INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
VALUES
  -- TH
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '3094f3e7-024f-49ec-a8f0-4f9df66e1c74'), -- TMCU-TH-H01
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '261d756c-466d-4fab-931b-83239f2622d8'), -- TMCU-TH-H02

  -- INF
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', 'bdb9b158-e238-40d4-9388-91791fb4e366'), -- TMCU-INF-H01
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '9536b442-838a-4ddf-828f-784f7b19e5e4'), -- TMCU-INF-H02
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', 'f0dddcae-8bd5-4017-8709-4be59b59b02a'), -- TMCU-INF-H03

  -- DOT
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '351f0072-8957-4922-8aba-e48c31659c00'), -- TMCU-DOT-H01

  -- MED (antes MD)
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '7e7e7413-9c89-49fa-b97c-7c6ed5db197a'), -- TMCU-MED-H01

  -- PP
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', 'b084ae8f-f56b-47e6-8b3a-c718c2754b03'), -- TMCU-PP-H01

  -- HC (antes HCR)
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '572abf2e-b4aa-4024-9ebd-9d34a4ef167b'), -- TMCU-HC-H01

  -- INT
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', 'a39d35bd-adb9-43bc-8cd4-f64950d6ea06')  -- TMCU-INT-H01
ON CONFLICT DO NOTHING;

-- 4. sort_order según orden exacto del Excel (hoja ' 11.3.13 S_TM_CU')
--    sort_order es relativo dentro de cada estándar (ORDER BY standard_id, sort_order)
UPDATE evaluation_criteria AS ec
SET sort_order = v.s
FROM (VALUES
  -- TH (standard_id: 992c0e82-4938-4c1a-9e65-6ae3d947013a)
  ('3094f3e7-024f-49ec-a8f0-4f9df66e1c74'::uuid,  1),  -- TMCU-TH-H01
  ('27ac46af-c8fe-4475-ab69-fb0e28d028f4'::uuid,  2),  -- TMCU-TH-001
  ('dd6cd49a-36ec-47d5-9238-c298d7fcf3d1'::uuid,  3),  -- TMCU-TH-002
  ('6b0ca31d-c55b-4b81-a062-606fa7f2d06a'::uuid,  4),  -- TMCU-TH-003
  ('78ae618d-09f5-4e34-bdc6-03f2df443d9b'::uuid,  5),  -- TMCU-TH-004
  ('261d756c-466d-4fab-931b-83239f2622d8'::uuid,  6),  -- TMCU-TH-H02
  ('bdcac987-1e98-4036-bc94-87e63e3793a5'::uuid,  7),  -- TMCU-TH-005
  ('d73ec67f-d522-4504-9713-61ead840ca80'::uuid,  8),  -- TMCU-TH-006
  ('ee184e10-f8d6-402f-b536-3042b17d9331'::uuid,  9),  -- TMCU-TH-007

  -- INF (standard_id: 5a673a2f-6c2b-4f10-9525-9cb7374fafe2)
  ('bdb9b158-e238-40d4-9388-91791fb4e366'::uuid,  1),  -- TMCU-INF-H01
  ('4c035d52-711f-4918-b369-f41786a52bea'::uuid,  2),  -- TMCU-INF-001
  ('14a82e68-2c0a-4daf-a31c-50eb97097d61'::uuid,  3),  -- TMCU-INF-002
  ('9536b442-838a-4ddf-828f-784f7b19e5e4'::uuid,  4),  -- TMCU-INF-H02
  ('cd44daf4-00f4-4c40-b084-76ed70eff622'::uuid,  5),  -- TMCU-INF-003
  ('001ecd71-9317-410b-8f5c-8c21b8983730'::uuid,  6),  -- TMCU-INF-004
  ('4a93d974-b583-4eac-8357-f39a85deb02b'::uuid,  7),  -- TMCU-INF-005
  ('654482ff-4eae-4fc6-aac4-15e5cc72a375'::uuid,  8),  -- TMCU-INF-006
  ('2b36d1cb-43d7-4d99-bd09-5cc39f7c6e6b'::uuid,  9),  -- TMCU-INF-007
  ('9ce5180d-80ab-4525-9545-666dc9537cb8'::uuid, 10),  -- TMCU-INF-008
  ('f0dddcae-8bd5-4017-8709-4be59b59b02a'::uuid, 11),  -- TMCU-INF-H03
  ('06a0329f-f870-4739-9e39-41e0c18c9fa5'::uuid, 12),  -- TMCU-INF-009

  -- DOT (standard_id: 574fb6ea-6bb3-4b9b-b9b4-49eacc572410)
  ('351f0072-8957-4922-8aba-e48c31659c00'::uuid,  1),  -- TMCU-DOT-H01
  ('150bfed7-4776-4532-8b3f-6ca8fb1fd3b5'::uuid,  2),  -- TMCU-DOT-001
  ('9606faae-2eed-4cc8-b051-a1a5286fe3de'::uuid,  3),  -- TMCU-DOT-002
  ('89802a70-0dd6-4e26-bc5e-376756dc9b4e'::uuid,  4),  -- TMCU-DOT-003
  ('44f38540-4661-4ae7-a165-4de6e52a2a06'::uuid,  5),  -- TMCU-DOT-004

  -- MED (standard_id: 5132130a-d5ce-420f-b185-c49f36efb8c2; era TMCU_MD)
  ('7e7e7413-9c89-49fa-b97c-7c6ed5db197a'::uuid,  1),  -- TMCU-MED-H01
  ('de05e8f0-b496-40b9-bc31-d81b84fa3ab0'::uuid,  2),  -- TMCU-MED-001
  ('1a6aef75-a353-4cfd-aacd-8b7d369bf395'::uuid,  3),  -- TMCU-MED-002
  ('79d577c7-5131-4c35-9e04-7c41a18352d0'::uuid,  4),  -- TMCU-MED-003
  ('4a9cf69e-8107-4e99-9f2c-d9c139a537c3'::uuid,  5),  -- TMCU-MED-004
  ('f3025675-ac0e-4f33-b70f-b8fe7bdf96ad'::uuid,  6),  -- TMCU-MED-005
  ('6660b081-0096-41f1-a010-cbe1a89ca5ea'::uuid,  7),  -- TMCU-MED-006
  ('02c87d9a-da73-4445-b695-bbd25874d272'::uuid,  8),  -- TMCU-MED-007
  ('379d5e79-8408-4885-b100-ae8d14e349a2'::uuid,  9),  -- TMCU-MED-008
  ('54456839-3659-4cd9-b1d5-13b55fa49f1c'::uuid, 10),  -- TMCU-MED-009
  ('1b25e760-da5d-47f0-8848-eb642e68878b'::uuid, 11),  -- TMCU-MED-010
  ('686a2771-2e68-4fc5-ac8c-a030efd2e05f'::uuid, 12),  -- TMCU-MED-011

  -- PP (standard_id: d7d87e54-ff26-4320-80c7-554bc57d0e9d)
  ('b084ae8f-f56b-47e6-8b3a-c718c2754b03'::uuid,  1),  -- TMCU-PP-H01
  ('232c550f-bbcd-4099-b86a-840b4ea32348'::uuid,  2),  -- TMCU-PP-001
  ('88eaeba6-870c-43ea-9f43-5183de865e2e'::uuid,  3),  -- TMCU-PP-002
  ('7aa09fdb-bdcb-4258-8702-5b22fa05759b'::uuid,  4),  -- TMCU-PP-003
  ('1b545dfe-6123-4654-a2be-10f797550495'::uuid,  5),  -- TMCU-PP-004
  ('e537a7e2-956e-4382-a2dd-5af70306d2fc'::uuid,  6),  -- TMCU-PP-005
  ('4884fa83-613f-4eca-b573-393862bfca66'::uuid,  7),  -- TMCU-PP-006

  -- HC (standard_id: cc5c1012-b1d8-4be0-9df1-f14afa2fe0c1; era TMCU_HCR)
  ('572abf2e-b4aa-4024-9ebd-9d34a4ef167b'::uuid,  1),  -- TMCU-HC-H01
  ('e2656be4-6417-4fad-bf16-5186beac8d02'::uuid,  2),  -- TMCU-HC-001
  ('7e85558e-dea0-483c-8220-3ccc6a712e4f'::uuid,  3),  -- TMCU-HC-002
  ('d26f01d4-18ba-40a3-9088-4251dfc815b8'::uuid,  4),  -- TMCU-HC-003
  ('09c7407e-49f2-453a-bd1a-09d35a1ad500'::uuid,  5),  -- TMCU-HC-004
  ('3da0b04c-ad88-4514-9a2f-e047af2c8a3f'::uuid,  6),  -- TMCU-HC-005

  -- INT (standard_id: 89c1ea75-aa6f-45ae-a24b-8dfc6a982b15)
  ('a39d35bd-adb9-43bc-8cd4-f64950d6ea06'::uuid,  1),  -- TMCU-INT-H01
  ('666f457e-874a-47db-b9b6-1b9c9883d3b8'::uuid,  2)   -- TMCU-INT-001
) AS v(id, s)
WHERE ec.id = v.id;

COMMIT;

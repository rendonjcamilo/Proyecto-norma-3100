-- =============================================================================
-- APH (Atención Prehospitalaria): corrección estándares + headers + sort_order
--
-- Servicio APH:     b3e97ce6-df34-4c99-85cf-84908c7a9710
-- Cuestionario APH: 6a73ef10-d927-4c75-9534-3e7253be61b0
-- Fuente Excel:     hoja '11.6.3.S_AT_PH'
--
-- Cambios:
--   APH_MD  → APH_MED  (Medicamentos, Dispositivos Médicos e Insumos)
--   APH_HCR → APH_HC   (Historia Clínica y Registros)
--   APH-MD-*  → APH-MED-*  (códigos de criterios)
--   APH-HCR-* → APH-HC-*   (códigos de criterios)
--   + Corrige descripción truncada de APH-HC-001 (era "16. de todos...")
--   + Inserta 13 section headers en evaluation_criteria
--   + Agrega 13 section headers a questionnaire_criteria
--   + Establece sort_order siguiendo el orden exacto del Excel
--
-- Estructura de headers (2 por estándar, 1 para INT):
--   TH, INF, DOT, MED, PP, HC: H01 = baja+extramural | H02 = telemedicina referencia
--   INT: H01 = todas las modalidades
--
-- Total rows con sort_order: 74 criterios + 13 headers = 87
-- =============================================================================

BEGIN;

-- 1. Renombrar estándares
UPDATE evaluation_standards SET code = 'APH_MED'
WHERE code = 'APH_MD'  AND service_id = 'b3e97ce6-df34-4c99-85cf-84908c7a9710';

UPDATE evaluation_standards SET code = 'APH_HC'
WHERE code = 'APH_HCR' AND service_id = 'b3e97ce6-df34-4c99-85cf-84908c7a9710';

-- 2. Renombrar códigos de criterios
UPDATE evaluation_criteria
SET code = REPLACE(code, 'APH-MD-', 'APH-MED-')
WHERE service_id = 'b3e97ce6-df34-4c99-85cf-84908c7a9710'
  AND code LIKE 'APH-MD-%';

UPDATE evaluation_criteria
SET code = REPLACE(code, 'APH-HCR-', 'APH-HC-')
WHERE service_id = 'b3e97ce6-df34-4c99-85cf-84908c7a9710'
  AND code LIKE 'APH-HCR-%';

-- 3. Corregir descripción truncada de APH-HC-001
--    El texto original estaba cortado: "16. de todos los servicios y adicionalmente cuenta con:"
UPDATE evaluation_criteria
SET name        = '16. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente cuenta con:',
    description = '16. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente cuenta con:'
WHERE id = '1801d56d-b6e0-481d-a90a-9468389bfa66'; -- APH-HC-001

-- 4. Insertar 13 section headers en evaluation_criteria
INSERT INTO evaluation_criteria (id, code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES
  -- TH (standard: 5f71054d-3a40-466a-b8f5-4365296da5a7)
  ('5c9e08ec-63d5-47f2-bdde-345d7734275a', 'APH-TH-H01', '',
   'Complejidad baja — Modalidades extramural y telemedicina - prestador remisor',
   'Complejidad baja — Modalidades extramural y telemedicina - prestador remisor',
   '5f71054d-3a40-466a-b8f5-4365296da5a7', 'b3e97ce6-df34-4c99-85cf-84908c7a9710', TRUE, 'active', TRUE),
  ('dbf26c39-485b-4a5f-8196-545dacd9758b', 'APH-TH-H02', '',
   'Modalidad de telemedicina - prestador de referencia',
   'Modalidad de telemedicina - prestador de referencia',
   '5f71054d-3a40-466a-b8f5-4365296da5a7', 'b3e97ce6-df34-4c99-85cf-84908c7a9710', TRUE, 'active', TRUE),

  -- INF (standard: ac95c285-39b7-4703-ba8c-0235dad85487)
  ('c3e9cc39-fe82-49f2-bdec-52423b5e952e', 'APH-INF-H01', '',
   'Complejidad baja — Modalidades extramural y telemedicina - prestador remisor',
   'Complejidad baja — Modalidades extramural y telemedicina - prestador remisor',
   'ac95c285-39b7-4703-ba8c-0235dad85487', 'b3e97ce6-df34-4c99-85cf-84908c7a9710', TRUE, 'active', TRUE),
  ('e52037a4-3f1b-4cef-9b86-45e2f7e6d9cc', 'APH-INF-H02', '',
   'Modalidad de telemedicina - prestador de referencia',
   'Modalidad de telemedicina - prestador de referencia',
   'ac95c285-39b7-4703-ba8c-0235dad85487', 'b3e97ce6-df34-4c99-85cf-84908c7a9710', TRUE, 'active', TRUE),

  -- DOT (standard: bead395b-8440-43bb-8d80-c4bc07b155a7)
  ('f3372680-5543-4dd6-9560-45fe2635be95', 'APH-DOT-H01', '',
   'Complejidad baja — Modalidad telemedicina - prestador remisor',
   'Complejidad baja — Modalidad telemedicina - prestador remisor',
   'bead395b-8440-43bb-8d80-c4bc07b155a7', 'b3e97ce6-df34-4c99-85cf-84908c7a9710', TRUE, 'active', TRUE),
  ('96515fe7-8b30-4696-a13e-99e25d50af36', 'APH-DOT-H02', '',
   'Modalidad de telemedicina - prestador de referencia',
   'Modalidad de telemedicina - prestador de referencia',
   'bead395b-8440-43bb-8d80-c4bc07b155a7', 'b3e97ce6-df34-4c99-85cf-84908c7a9710', TRUE, 'active', TRUE),

  -- MED (standard: aaac4848-5951-45e9-8e4e-12ac29461261; era APH_MD)
  ('71bcdffe-3385-4442-b5ab-67b8ca7ba2d1', 'APH-MED-H01', '',
   'Complejidad baja — Modalidades extramural y telemedicina - prestador remisor',
   'Complejidad baja — Modalidades extramural y telemedicina - prestador remisor',
   'aaac4848-5951-45e9-8e4e-12ac29461261', 'b3e97ce6-df34-4c99-85cf-84908c7a9710', TRUE, 'active', TRUE),
  ('e0db3fe4-4f5e-4d41-8f66-4d6a0f559c95', 'APH-MED-H02', '',
   'Modalidad de telemedicina - prestador de referencia',
   'Modalidad de telemedicina - prestador de referencia',
   'aaac4848-5951-45e9-8e4e-12ac29461261', 'b3e97ce6-df34-4c99-85cf-84908c7a9710', TRUE, 'active', TRUE),

  -- PP (standard: 951e8f4e-5168-4249-8e42-5b2b4b473ce1)
  ('f07ed1ba-f28a-4799-8be8-f2bce31c4551', 'APH-PP-H01', '',
   'Complejidad baja — Modalidades extramural y telemedicina - prestador remisor',
   'Complejidad baja — Modalidades extramural y telemedicina - prestador remisor',
   '951e8f4e-5168-4249-8e42-5b2b4b473ce1', 'b3e97ce6-df34-4c99-85cf-84908c7a9710', TRUE, 'active', TRUE),
  ('ae1c347a-6a52-42bf-852d-c2d5e6efa41a', 'APH-PP-H02', '',
   'Modalidad de telemedicina - prestador de referencia',
   'Modalidad de telemedicina - prestador de referencia',
   '951e8f4e-5168-4249-8e42-5b2b4b473ce1', 'b3e97ce6-df34-4c99-85cf-84908c7a9710', TRUE, 'active', TRUE),

  -- HC (standard: b7ea7042-26cf-4d8a-bb05-42441c89fefa; era APH_HCR)
  ('bd329063-8bab-4834-8fb0-027feda51566', 'APH-HC-H01', '',
   'Complejidad baja — Modalidades extramural y telemedicina - prestador remisor',
   'Complejidad baja — Modalidades extramural y telemedicina - prestador remisor',
   'b7ea7042-26cf-4d8a-bb05-42441c89fefa', 'b3e97ce6-df34-4c99-85cf-84908c7a9710', TRUE, 'active', TRUE),
  ('bdc5ca6f-a061-4aeb-928a-4b43661d1f9e', 'APH-HC-H02', '',
   'Modalidad de telemedicina - prestador de referencia',
   'Modalidad de telemedicina - prestador de referencia',
   'b7ea7042-26cf-4d8a-bb05-42441c89fefa', 'b3e97ce6-df34-4c99-85cf-84908c7a9710', TRUE, 'active', TRUE),

  -- INT (standard: 8cf18455-4670-4c86-adb1-f2cfbe56b7e1)
  ('32bca21b-ed06-4f4b-9d9d-72804d72e5a5', 'APH-INT-H01', '',
   'Modalidades extramural y telemedicina - prestador remisor - prestador de referencia',
   'Modalidades extramural y telemedicina - prestador remisor - prestador de referencia',
   '8cf18455-4670-4c86-adb1-f2cfbe56b7e1', 'b3e97ce6-df34-4c99-85cf-84908c7a9710', TRUE, 'active', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 5. Agregar 13 section headers al cuestionario APH
INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
VALUES
  ('6a73ef10-d927-4c75-9534-3e7253be61b0', '5c9e08ec-63d5-47f2-bdde-345d7734275a'), -- APH-TH-H01
  ('6a73ef10-d927-4c75-9534-3e7253be61b0', 'dbf26c39-485b-4a5f-8196-545dacd9758b'), -- APH-TH-H02
  ('6a73ef10-d927-4c75-9534-3e7253be61b0', 'c3e9cc39-fe82-49f2-bdec-52423b5e952e'), -- APH-INF-H01
  ('6a73ef10-d927-4c75-9534-3e7253be61b0', 'e52037a4-3f1b-4cef-9b86-45e2f7e6d9cc'), -- APH-INF-H02
  ('6a73ef10-d927-4c75-9534-3e7253be61b0', 'f3372680-5543-4dd6-9560-45fe2635be95'), -- APH-DOT-H01
  ('6a73ef10-d927-4c75-9534-3e7253be61b0', '96515fe7-8b30-4696-a13e-99e25d50af36'), -- APH-DOT-H02
  ('6a73ef10-d927-4c75-9534-3e7253be61b0', '71bcdffe-3385-4442-b5ab-67b8ca7ba2d1'), -- APH-MED-H01
  ('6a73ef10-d927-4c75-9534-3e7253be61b0', 'e0db3fe4-4f5e-4d41-8f66-4d6a0f559c95'), -- APH-MED-H02
  ('6a73ef10-d927-4c75-9534-3e7253be61b0', 'f07ed1ba-f28a-4799-8be8-f2bce31c4551'), -- APH-PP-H01
  ('6a73ef10-d927-4c75-9534-3e7253be61b0', 'ae1c347a-6a52-42bf-852d-c2d5e6efa41a'), -- APH-PP-H02
  ('6a73ef10-d927-4c75-9534-3e7253be61b0', 'bd329063-8bab-4834-8fb0-027feda51566'), -- APH-HC-H01
  ('6a73ef10-d927-4c75-9534-3e7253be61b0', 'bdc5ca6f-a061-4aeb-928a-4b43661d1f9e'), -- APH-HC-H02
  ('6a73ef10-d927-4c75-9534-3e7253be61b0', '32bca21b-ed06-4f4b-9d9d-72804d72e5a5')  -- APH-INT-H01
ON CONFLICT DO NOTHING;

-- 6. sort_order según orden exacto del Excel (hoja '11.6.3.S_AT_PH')
UPDATE evaluation_criteria AS ec
SET sort_order = v.s
FROM (VALUES
  -- TH (standard: 5f71054d)
  ('5c9e08ec-63d5-47f2-bdde-345d7734275a'::uuid,  1),  -- APH-TH-H01
  ('3a3bf42a-ca78-4d20-b8ba-10a5674f2f48'::uuid,  2),  -- APH-TH-001
  ('ed40c678-430f-4944-ba43-9335a287f609'::uuid,  3),  -- APH-TH-002
  ('29326d5f-17a3-4e43-9722-580e69c77ce2'::uuid,  4),  -- APH-TH-003
  ('dbf26c39-485b-4a5f-8196-545dacd9758b'::uuid,  5),  -- APH-TH-H02
  ('a1deb0a8-7b3e-48c5-a82c-b6f0fc1d94e5'::uuid,  6),  -- APH-TH-004
  ('1d4a16c2-7e72-42bc-b10c-f7a4169bed21'::uuid,  7),  -- APH-TH-005
  ('b28f1197-5cae-4b29-9dbc-faff0d9f1221'::uuid,  8),  -- APH-TH-006

  -- INF (standard: ac95c285)
  ('c3e9cc39-fe82-49f2-bdec-52423b5e952e'::uuid,  1),  -- APH-INF-H01
  ('ee4e412f-3ee9-42cf-a9ab-59516d4551d9'::uuid,  2),  -- APH-INF-001
  ('d67775b3-a5e7-431e-9f1d-a2d83b8cc089'::uuid,  3),  -- APH-INF-002
  ('91589cfb-8efe-468d-bc65-47434145fecc'::uuid,  4),  -- APH-INF-003
  ('89d1ff54-90a4-4c0e-b3e9-b4a7aa4aff05'::uuid,  5),  -- APH-INF-004
  ('8e22eb35-2b8c-43dc-a050-32fe2738f808'::uuid,  6),  -- APH-INF-005
  ('b4235aa6-68ae-4b87-9222-09e2cc24ed8e'::uuid,  7),  -- APH-INF-006
  ('3a747c5f-30d9-4869-b83b-1fc4ebef525b'::uuid,  8),  -- APH-INF-007
  ('5683be2d-33bf-4c6a-89ab-cb99f963e2f3'::uuid,  9),  -- APH-INF-008
  ('b5f155be-3b02-4299-8309-27af2434257a'::uuid, 10),  -- APH-INF-009
  ('cfcb4387-b69f-445b-8f00-125b47bfc588'::uuid, 11),  -- APH-INF-010
  ('ad8cf19a-c826-4a03-87f7-2dce471492c3'::uuid, 12),  -- APH-INF-011
  ('29b31586-f10a-4be8-9a6c-7f840846305f'::uuid, 13),  -- APH-INF-012
  ('3e6dfbf7-f25b-4963-baec-153cd87616bd'::uuid, 14),  -- APH-INF-013
  ('e52037a4-3f1b-4cef-9b86-45e2f7e6d9cc'::uuid, 15),  -- APH-INF-H02
  ('49bf8faf-219a-499b-bfaa-2ea89e370ed9'::uuid, 16),  -- APH-INF-014

  -- DOT (standard: bead395b)
  ('f3372680-5543-4dd6-9560-45fe2635be95'::uuid,  1),  -- APH-DOT-H01
  ('a1edf90e-8dd7-4305-9d38-8ca7afb76322'::uuid,  2),  -- APH-DOT-001
  ('93ef3efa-4c16-41ee-a99a-db3046de0378'::uuid,  3),  -- APH-DOT-002
  ('14c526fd-d48e-4103-8687-7799a845a3c3'::uuid,  4),  -- APH-DOT-003
  ('aadfd9a1-183f-4c63-bd4d-99bd4d110fd7'::uuid,  5),  -- APH-DOT-004
  ('d4e5b78f-2b93-4e56-a6e7-cefbe46aafdd'::uuid,  6),  -- APH-DOT-005
  ('d2854dbf-5073-403c-905d-6e65933b96de'::uuid,  7),  -- APH-DOT-006
  ('a1bfa55b-db22-4da3-9934-92a77631a5b4'::uuid,  8),  -- APH-DOT-007
  ('c04b3bea-60e2-45b6-9040-f902d2942a03'::uuid,  9),  -- APH-DOT-008
  ('ada61275-2bca-4f96-9dbf-89e6c4c19d62'::uuid, 10),  -- APH-DOT-009
  ('d5b8d47f-d0e8-4f9e-ba60-a7002429f4f6'::uuid, 11),  -- APH-DOT-010
  ('88692268-838a-4a8f-974b-8c9f9806d9e6'::uuid, 12),  -- APH-DOT-011
  ('b340a012-e0ec-4f07-85db-e9002f348fa0'::uuid, 13),  -- APH-DOT-012
  ('5f889b0d-7eca-4831-8d6f-712d18b120d9'::uuid, 14),  -- APH-DOT-013
  ('82169098-ce4d-4368-96e1-0c11f54ae6f7'::uuid, 15),  -- APH-DOT-014
  ('5a66c87f-1793-4ff8-9cdb-37e39df74350'::uuid, 16),  -- APH-DOT-015
  ('cfb9dfb4-80f9-4e34-9ce9-bc919250ba12'::uuid, 17),  -- APH-DOT-016
  ('a5da2dae-675c-4714-854b-058f211ecfe3'::uuid, 18),  -- APH-DOT-017
  ('47348290-1cf4-4880-af36-ddc06eac1e50'::uuid, 19),  -- APH-DOT-018
  ('15260ec5-43c6-4e7a-8be8-eb4e55dbc1f9'::uuid, 20),  -- APH-DOT-019
  ('da9d82fe-7ab9-4d14-be5f-075f59641414'::uuid, 21),  -- APH-DOT-020
  ('d2b1cce8-73ef-4082-a007-e4f9cf9133e0'::uuid, 22),  -- APH-DOT-021
  ('9e870a70-c2c8-44e9-a1ab-e9d160a40d3f'::uuid, 23),  -- APH-DOT-022
  ('04129431-31ba-4e12-b413-d849932129a5'::uuid, 24),  -- APH-DOT-023
  ('a004051e-5ade-488c-b431-45777ea3807b'::uuid, 25),  -- APH-DOT-024
  ('c278f41a-eba5-4bdf-8d79-c0bbb632a14a'::uuid, 26),  -- APH-DOT-025
  ('35fd162c-6570-4371-97d9-a29194f5d4c5'::uuid, 27),  -- APH-DOT-026
  ('53f3dedf-7e83-4caf-9ba4-ef9b77303c08'::uuid, 28),  -- APH-DOT-027
  ('921c0950-a321-424f-a20a-779d762d1c69'::uuid, 29),  -- APH-DOT-028
  ('237e2a35-cbe0-47bc-b88e-9f1087e4965d'::uuid, 30),  -- APH-DOT-029
  ('bd5dad36-4de0-479c-af2f-2cf7550899b4'::uuid, 31),  -- APH-DOT-030
  ('a98899cd-a725-4ef1-b81d-78959ff378e1'::uuid, 32),  -- APH-DOT-031
  ('d4bf4dea-b484-4fe9-8682-165530930b6e'::uuid, 33),  -- APH-DOT-032
  ('b25f713c-8752-43a8-91a2-9f3091a45699'::uuid, 34),  -- APH-DOT-033
  ('96515fe7-8b30-4696-a13e-99e25d50af36'::uuid, 35),  -- APH-DOT-H02
  ('4407c879-b74b-444b-bb98-cacdbf084be4'::uuid, 36),  -- APH-DOT-034

  -- MED (standard: aaac4848; era APH_MD)
  ('71bcdffe-3385-4442-b5ab-67b8ca7ba2d1'::uuid,  1),  -- APH-MED-H01
  ('253994b7-9f07-4d4f-9ea3-c3ccd743a801'::uuid,  2),  -- APH-MED-001
  ('15d10677-cf86-40df-882a-f667e5790422'::uuid,  3),  -- APH-MED-002
  ('e0db3fe4-4f5e-4d41-8f66-4d6a0f559c95'::uuid,  4),  -- APH-MED-H02
  ('0bcdb79e-3387-454b-86ea-49f27eee32ae'::uuid,  5),  -- APH-MED-003

  -- PP (standard: 951e8f4e)
  ('f07ed1ba-f28a-4799-8be8-f2bce31c4551'::uuid,  1),  -- APH-PP-H01
  ('f5e33c93-f480-4205-924d-e42f5f8d5c51'::uuid,  2),  -- APH-PP-001
  ('89aa369c-7fa4-4d83-a7a0-180c101f3e7f'::uuid,  3),  -- APH-PP-002
  ('8c760b8b-884f-480e-b0ef-12d2f2195bf6'::uuid,  4),  -- APH-PP-003
  ('90e03421-e66e-42c5-9bc9-e497eee2fc2d'::uuid,  5),  -- APH-PP-004
  ('ae1c347a-6a52-42bf-852d-c2d5e6efa41a'::uuid,  6),  -- APH-PP-H02
  ('f2a5ce59-0097-4c43-9388-74ecd124389c'::uuid,  7),  -- APH-PP-005

  -- HC (standard: b7ea7042; era APH_HCR)
  ('bd329063-8bab-4834-8fb0-027feda51566'::uuid,  1),  -- APH-HC-H01
  ('1801d56d-b6e0-481d-a90a-9468389bfa66'::uuid,  2),  -- APH-HC-001
  ('392b0e21-4f6e-441f-a7b3-12d0900041ff'::uuid,  3),  -- APH-HC-002
  ('88901379-bf44-4460-b38d-3a5ae2515f1b'::uuid,  4),  -- APH-HC-003
  ('ccce745f-3436-477d-8a4d-b9d1216f74ab'::uuid,  5),  -- APH-HC-004
  ('d44d0777-61c4-459a-a35c-0c982bf61f76'::uuid,  6),  -- APH-HC-005
  ('82fef1df-1056-4057-9114-f9897406bead'::uuid,  7),  -- APH-HC-006
  ('46eca84b-fde2-4f66-adef-dfbb0456ceb9'::uuid,  8),  -- APH-HC-007
  ('59d9cecd-a9b2-4319-b5d4-52081e7b9b42'::uuid,  9),  -- APH-HC-008
  ('80a6eb58-a456-4a4f-884d-0bb9c95dc942'::uuid, 10),  -- APH-HC-009
  ('419172de-c25a-4d1d-8e4a-6dcbaf6d4b51'::uuid, 11),  -- APH-HC-010
  ('bdc5ca6f-a061-4aeb-928a-4b43661d1f9e'::uuid, 12),  -- APH-HC-H02
  ('6c72b918-00d2-401e-a89d-28b5b8b6b776'::uuid, 13),  -- APH-HC-011

  -- INT (standard: 8cf18455)
  ('32bca21b-ed06-4f4b-9d9d-72804d72e5a5'::uuid,  1),  -- APH-INT-H01
  ('a7931259-ed22-409e-a5c2-bbee1f52a295'::uuid,  2)   -- APH-INT-001
) AS v(id, s)
WHERE ec.id = v.id;

COMMIT;

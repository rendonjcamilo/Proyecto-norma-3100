-- =============================================================================
-- APR (Atención del Parto): corrección estándares + headers + sort_order
--
-- Servicio APR:     58db58f6-6243-4985-9c8f-c13b48244e71
-- Cuestionario APR: 2f560ac3-7a85-47b6-b830-77fcc7d69b81
-- Fuente Excel:     hoja '11.6.4.S_A.parto'
--
-- Cambios:
--   APR_MD  → APR_MED  (Medicamentos, Dispositivos Médicos e Insumos)
--   APR_HCR → APR_HC   (Historia Clínica y Registros)
--   APR-MD-*  → APR-MED-*  (códigos de criterios)
--   APR-HCR-* → APR-HC-*   (códigos de criterios)
--   + Inserta 21 section headers en evaluation_criteria
--   + Agrega 21 section headers a questionnaire_criteria
--   + Establece sort_order siguiendo el orden exacto del Excel
--
-- Estándares por complejidad/modalidad:
--   TH:  3 headers (baja | mediana+alta | todas+telemedicina)
--   INF: 3 headers (baja | mediana+alta | todas+telemedicina)
--   DOT: 4 headers (baja | mediana | alta | todas+telemedicina)
--   MED: 2 headers (todas+intramural | telemedicina)
--   PP:  3 headers (baja | mediana+alta | todas+telemedicina)
--   HC:  2 headers (todas+intramural | telemedicina)
--   INT: 4 headers (baja | mediana | alta | todas+telemedicina)
--
-- Total rows con sort_order: 171 criterios + 21 headers = 192
-- =============================================================================

BEGIN;

-- 1. Renombrar estándares
UPDATE evaluation_standards SET code = 'APR_MED'
WHERE code = 'APR_MD'  AND service_id = '58db58f6-6243-4985-9c8f-c13b48244e71';

UPDATE evaluation_standards SET code = 'APR_HC'
WHERE code = 'APR_HCR' AND service_id = '58db58f6-6243-4985-9c8f-c13b48244e71';

-- 2. Renombrar códigos de criterios
UPDATE evaluation_criteria
SET code = REPLACE(code, 'APR-MD-', 'APR-MED-')
WHERE service_id = '58db58f6-6243-4985-9c8f-c13b48244e71'
  AND code LIKE 'APR-MD-%';

UPDATE evaluation_criteria
SET code = REPLACE(code, 'APR-HCR-', 'APR-HC-')
WHERE service_id = '58db58f6-6243-4985-9c8f-c13b48244e71'
  AND code LIKE 'APR-HCR-%';

-- 3. Insertar 21 section headers en evaluation_criteria
INSERT INTO evaluation_criteria (id, code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES
  -- TH (standard: b65213d1-5919-441b-99d7-724efc043b4e)
  ('c782e112-2ae5-4c0a-a4a6-7827b7cc1cc8', 'APR-TH-H01', '',
   'Complejidad baja — Modalidades intramural y telemedicina - prestador remisor',
   'Complejidad baja — Modalidades intramural y telemedicina - prestador remisor',
   'b65213d1-5919-441b-99d7-724efc043b4e', '58db58f6-6243-4985-9c8f-c13b48244e71', TRUE, 'active', TRUE),
  ('8970e38d-da95-49eb-bd66-6d78b98ea4d3', 'APR-TH-H02', '',
   'Complejidades mediana y alta — Modalidades intramural y telemedicina - prestador remisor',
   'Complejidades mediana y alta — Modalidades intramural y telemedicina - prestador remisor',
   'b65213d1-5919-441b-99d7-724efc043b4e', '58db58f6-6243-4985-9c8f-c13b48244e71', TRUE, 'active', TRUE),
  ('8e68837b-98cc-4a00-be9a-255717dbcadb', 'APR-TH-H03', '',
   'Complejidades baja, mediana y alta — Modalidad telemedicina - prestador referencia',
   'Complejidades baja, mediana y alta — Modalidad telemedicina - prestador referencia',
   'b65213d1-5919-441b-99d7-724efc043b4e', '58db58f6-6243-4985-9c8f-c13b48244e71', TRUE, 'active', TRUE),

  -- INF (standard: ff847f94-54e9-4858-a0a0-c425583cc7f7)
  ('7cd7b0a5-6511-4404-9450-2bc2c4982d4e', 'APR-INF-H01', '',
   'Complejidad baja — Modalidades intramural, telemedicina - prestador remisor',
   'Complejidad baja — Modalidades intramural, telemedicina - prestador remisor',
   'ff847f94-54e9-4858-a0a0-c425583cc7f7', '58db58f6-6243-4985-9c8f-c13b48244e71', TRUE, 'active', TRUE),
  ('320e1410-2184-4bfa-a481-1d351d6eeec4', 'APR-INF-H02', '',
   'Complejidades mediana y alta — Modalidades intramural, telemedicina - prestador remisor',
   'Complejidades mediana y alta — Modalidades intramural, telemedicina - prestador remisor',
   'ff847f94-54e9-4858-a0a0-c425583cc7f7', '58db58f6-6243-4985-9c8f-c13b48244e71', TRUE, 'active', TRUE),
  ('868e1680-2155-4767-89e3-4e98671737f2', 'APR-INF-H03', '',
   'Complejidades baja, mediana y alta — Modalidad de telemedicina - prestador de referencia',
   'Complejidades baja, mediana y alta — Modalidad de telemedicina - prestador de referencia',
   'ff847f94-54e9-4858-a0a0-c425583cc7f7', '58db58f6-6243-4985-9c8f-c13b48244e71', TRUE, 'active', TRUE),

  -- DOT (standard: 0c30253a-ee98-4d46-bf1c-e843bd069593)
  ('141247a2-9c54-429f-b8e9-5ba513c1f63a', 'APR-DOT-H01', '',
   'Complejidad baja — Modalidades intramural, telemedicina - prestador remisor',
   'Complejidad baja — Modalidades intramural, telemedicina - prestador remisor',
   '0c30253a-ee98-4d46-bf1c-e843bd069593', '58db58f6-6243-4985-9c8f-c13b48244e71', TRUE, 'active', TRUE),
  ('dd854d02-3a17-47c0-a401-d04b1ba2eeab', 'APR-DOT-H02', '',
   'Complejidad mediana — Modalidades intramural, telemedicina - prestador remisor',
   'Complejidad mediana — Modalidades intramural, telemedicina - prestador remisor',
   '0c30253a-ee98-4d46-bf1c-e843bd069593', '58db58f6-6243-4985-9c8f-c13b48244e71', TRUE, 'active', TRUE),
  ('b236677f-c50a-4923-9030-1270c90375e7', 'APR-DOT-H03', '',
   'Complejidad alta — Modalidades intramural, telemedicina - prestador remisor',
   'Complejidad alta — Modalidades intramural, telemedicina - prestador remisor',
   '0c30253a-ee98-4d46-bf1c-e843bd069593', '58db58f6-6243-4985-9c8f-c13b48244e71', TRUE, 'active', TRUE),
  ('38aec372-ddb6-4261-a369-e3a7b6e89f19', 'APR-DOT-H04', '',
   'Complejidades baja, mediana y alta — Modalidad de telemedicina - prestador de referencia',
   'Complejidades baja, mediana y alta — Modalidad de telemedicina - prestador de referencia',
   '0c30253a-ee98-4d46-bf1c-e843bd069593', '58db58f6-6243-4985-9c8f-c13b48244e71', TRUE, 'active', TRUE),

  -- MED (standard: ffa3c1a7-b3a3-4bd5-a54b-2b24b45ec9eb; era APR_MD)
  ('2715a41b-4812-4992-a4e5-8f14170b1052', 'APR-MED-H01', '',
   'Complejidades baja, mediana y alta — Modalidades intramural, telemedicina - prestador remisor',
   'Complejidades baja, mediana y alta — Modalidades intramural, telemedicina - prestador remisor',
   'ffa3c1a7-b3a3-4bd5-a54b-2b24b45ec9eb', '58db58f6-6243-4985-9c8f-c13b48244e71', TRUE, 'active', TRUE),
  ('14622521-9d68-4758-ae51-741a1fb18e32', 'APR-MED-H02', '',
   'Modalidad de telemedicina — prestador de referencia',
   'Modalidad de telemedicina — prestador de referencia',
   'ffa3c1a7-b3a3-4bd5-a54b-2b24b45ec9eb', '58db58f6-6243-4985-9c8f-c13b48244e71', TRUE, 'active', TRUE),

  -- PP (standard: b4e6f70c-1a01-4588-bee5-870b26cd4f35)
  ('f06e5210-7d51-4bb5-a4b2-6f811d5b69b4', 'APR-PP-H01', '',
   'Complejidad baja — Modalidades intramural, telemedicina - prestador remisor',
   'Complejidad baja — Modalidades intramural, telemedicina - prestador remisor',
   'b4e6f70c-1a01-4588-bee5-870b26cd4f35', '58db58f6-6243-4985-9c8f-c13b48244e71', TRUE, 'active', TRUE),
  ('3bca6dcd-720b-48b2-8df7-64286fd63b76', 'APR-PP-H02', '',
   'Complejidades mediana y alta — Modalidades intramural, telemedicina - prestador remisor',
   'Complejidades mediana y alta — Modalidades intramural, telemedicina - prestador remisor',
   'b4e6f70c-1a01-4588-bee5-870b26cd4f35', '58db58f6-6243-4985-9c8f-c13b48244e71', TRUE, 'active', TRUE),
  ('3383c639-d165-473c-a92f-7f6cb7c111d6', 'APR-PP-H03', '',
   'Complejidades baja, mediana y alta — Modalidad de telemedicina - prestador de referencia',
   'Complejidades baja, mediana y alta — Modalidad de telemedicina - prestador de referencia',
   'b4e6f70c-1a01-4588-bee5-870b26cd4f35', '58db58f6-6243-4985-9c8f-c13b48244e71', TRUE, 'active', TRUE),

  -- HC (standard: 61c35936-ea04-450d-966b-223c7edf2c90; era APR_HCR)
  ('b78c2da4-873c-4f17-8264-9fcef0e6d28c', 'APR-HC-H01', '',
   'Complejidades baja, mediana y alta — Modalidades intramural, telemedicina - prestador remisor',
   'Complejidades baja, mediana y alta — Modalidades intramural, telemedicina - prestador remisor',
   '61c35936-ea04-450d-966b-223c7edf2c90', '58db58f6-6243-4985-9c8f-c13b48244e71', TRUE, 'active', TRUE),
  ('8f3f9def-8e4d-457d-9021-4d70b6aebbbc', 'APR-HC-H02', '',
   'Modalidad de telemedicina — prestador referencia',
   'Modalidad de telemedicina — prestador referencia',
   '61c35936-ea04-450d-966b-223c7edf2c90', '58db58f6-6243-4985-9c8f-c13b48244e71', TRUE, 'active', TRUE),

  -- INT (standard: 545048ea-d29c-4ade-bbb1-118f10dc1f80)
  ('aef4a42b-7f36-4755-9b23-df21c9bfe68c', 'APR-INT-H01', '',
   'Complejidad baja — Modalidades intramural',
   'Complejidad baja — Modalidades intramural',
   '545048ea-d29c-4ade-bbb1-118f10dc1f80', '58db58f6-6243-4985-9c8f-c13b48244e71', TRUE, 'active', TRUE),
  ('4dfc3c54-4212-4a46-9600-62f4a970681d', 'APR-INT-H02', '',
   'Complejidad mediana — Modalidades intramural',
   'Complejidad mediana — Modalidades intramural',
   '545048ea-d29c-4ade-bbb1-118f10dc1f80', '58db58f6-6243-4985-9c8f-c13b48244e71', TRUE, 'active', TRUE),
  ('ea9d17df-205f-4679-8a82-17738e02cc75', 'APR-INT-H03', '',
   'Complejidad alta — Modalidades intramural',
   'Complejidad alta — Modalidades intramural',
   '545048ea-d29c-4ade-bbb1-118f10dc1f80', '58db58f6-6243-4985-9c8f-c13b48244e71', TRUE, 'active', TRUE),
  ('971e3009-7ad0-45a8-b7fc-9be1b19388ab', 'APR-INT-H04', '',
   'Complejidades baja, mediana y alta — Modalidad telemedicina - prestador remisor - prestador de referencia',
   'Complejidades baja, mediana y alta — Modalidad telemedicina - prestador remisor - prestador de referencia',
   '545048ea-d29c-4ade-bbb1-118f10dc1f80', '58db58f6-6243-4985-9c8f-c13b48244e71', TRUE, 'active', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 4. Agregar 21 section headers al cuestionario APR
INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
VALUES
  -- TH
  ('2f560ac3-7a85-47b6-b830-77fcc7d69b81', 'c782e112-2ae5-4c0a-a4a6-7827b7cc1cc8'), -- APR-TH-H01
  ('2f560ac3-7a85-47b6-b830-77fcc7d69b81', '8970e38d-da95-49eb-bd66-6d78b98ea4d3'), -- APR-TH-H02
  ('2f560ac3-7a85-47b6-b830-77fcc7d69b81', '8e68837b-98cc-4a00-be9a-255717dbcadb'), -- APR-TH-H03
  -- INF
  ('2f560ac3-7a85-47b6-b830-77fcc7d69b81', '7cd7b0a5-6511-4404-9450-2bc2c4982d4e'), -- APR-INF-H01
  ('2f560ac3-7a85-47b6-b830-77fcc7d69b81', '320e1410-2184-4bfa-a481-1d351d6eeec4'), -- APR-INF-H02
  ('2f560ac3-7a85-47b6-b830-77fcc7d69b81', '868e1680-2155-4767-89e3-4e98671737f2'), -- APR-INF-H03
  -- DOT
  ('2f560ac3-7a85-47b6-b830-77fcc7d69b81', '141247a2-9c54-429f-b8e9-5ba513c1f63a'), -- APR-DOT-H01
  ('2f560ac3-7a85-47b6-b830-77fcc7d69b81', 'dd854d02-3a17-47c0-a401-d04b1ba2eeab'), -- APR-DOT-H02
  ('2f560ac3-7a85-47b6-b830-77fcc7d69b81', 'b236677f-c50a-4923-9030-1270c90375e7'), -- APR-DOT-H03
  ('2f560ac3-7a85-47b6-b830-77fcc7d69b81', '38aec372-ddb6-4261-a369-e3a7b6e89f19'), -- APR-DOT-H04
  -- MED
  ('2f560ac3-7a85-47b6-b830-77fcc7d69b81', '2715a41b-4812-4992-a4e5-8f14170b1052'), -- APR-MED-H01
  ('2f560ac3-7a85-47b6-b830-77fcc7d69b81', '14622521-9d68-4758-ae51-741a1fb18e32'), -- APR-MED-H02
  -- PP
  ('2f560ac3-7a85-47b6-b830-77fcc7d69b81', 'f06e5210-7d51-4bb5-a4b2-6f811d5b69b4'), -- APR-PP-H01
  ('2f560ac3-7a85-47b6-b830-77fcc7d69b81', '3bca6dcd-720b-48b2-8df7-64286fd63b76'), -- APR-PP-H02
  ('2f560ac3-7a85-47b6-b830-77fcc7d69b81', '3383c639-d165-473c-a92f-7f6cb7c111d6'), -- APR-PP-H03
  -- HC
  ('2f560ac3-7a85-47b6-b830-77fcc7d69b81', 'b78c2da4-873c-4f17-8264-9fcef0e6d28c'), -- APR-HC-H01
  ('2f560ac3-7a85-47b6-b830-77fcc7d69b81', '8f3f9def-8e4d-457d-9021-4d70b6aebbbc'), -- APR-HC-H02
  -- INT
  ('2f560ac3-7a85-47b6-b830-77fcc7d69b81', 'aef4a42b-7f36-4755-9b23-df21c9bfe68c'), -- APR-INT-H01
  ('2f560ac3-7a85-47b6-b830-77fcc7d69b81', '4dfc3c54-4212-4a46-9600-62f4a970681d'), -- APR-INT-H02
  ('2f560ac3-7a85-47b6-b830-77fcc7d69b81', 'ea9d17df-205f-4679-8a82-17738e02cc75'), -- APR-INT-H03
  ('2f560ac3-7a85-47b6-b830-77fcc7d69b81', '971e3009-7ad0-45a8-b7fc-9be1b19388ab')  -- APR-INT-H04
ON CONFLICT DO NOTHING;

-- 5. sort_order según orden exacto del Excel (hoja '11.6.4.S_A.parto')
UPDATE evaluation_criteria AS ec
SET sort_order = v.s
FROM (VALUES
  -- TH (standard: b65213d1)
  ('c782e112-2ae5-4c0a-a4a6-7827b7cc1cc8'::uuid,  1),  -- APR-TH-H01 (baja, intramural+telemedicina remisor)
  ('7cb1b47b-4d96-4aff-90b0-3ce783d5e2de'::uuid,  2),  -- APR-TH-001
  ('029c06b5-1867-4b2f-88f1-61675999545d'::uuid,  3),  -- APR-TH-002
  ('b08950ef-495b-4d0a-bed8-df322c469809'::uuid,  4),  -- APR-TH-003
  ('a4f62048-1e15-4e53-bf52-08a24dac243d'::uuid,  5),  -- APR-TH-004
  ('d0624a6d-81a9-4ce5-81c5-c5db64602cf4'::uuid,  6),  -- APR-TH-005
  ('8970e38d-da95-49eb-bd66-6d78b98ea4d3'::uuid,  7),  -- APR-TH-H02 (mediana+alta)
  ('6ae00735-6345-44a2-acf1-6370b1bb7e33'::uuid,  8),  -- APR-TH-006
  ('ca407099-41d9-46da-b5a9-f8c30acd2b06'::uuid,  9),  -- APR-TH-007
  ('7e640b66-8e7c-4ced-9d27-189f8f73cd67'::uuid, 10),  -- APR-TH-008
  ('9a150473-09bd-4b60-b4ee-cbdf938177c1'::uuid, 11),  -- APR-TH-009
  ('51193bd6-36e5-494c-8f46-ba3b52181e41'::uuid, 12),  -- APR-TH-010
  ('4c3d9966-0b1a-46e4-8368-4f99100a035c'::uuid, 13),  -- APR-TH-011
  ('6a0d3a7d-c36e-4bf2-b811-c9720842a01a'::uuid, 14),  -- APR-TH-012
  ('662ce8bd-038c-4ef0-bb44-7899e563f0b2'::uuid, 15),  -- APR-TH-013
  ('f5ce1d6f-91ff-4ee9-b350-c405625fff3d'::uuid, 16),  -- APR-TH-014
  ('86969b8f-2ecf-4a70-b6bd-cf3952b3852a'::uuid, 17),  -- APR-TH-015
  ('fcf92d62-0975-4293-989d-2f02b4022ade'::uuid, 18),  -- APR-TH-016
  ('a93d653c-a1c3-435e-8f12-29b8b65507ed'::uuid, 19),  -- APR-TH-017
  ('8e68837b-98cc-4a00-be9a-255717dbcadb'::uuid, 20),  -- APR-TH-H03 (todas, telemedicina referencia)
  ('4f67e64e-c2cc-453d-aed4-ef84a3abb974'::uuid, 21),  -- APR-TH-018
  ('a3349a86-8245-4644-bdc6-6b7ac5aeb044'::uuid, 22),  -- APR-TH-019
  ('dbd4ac70-57de-46a4-9d38-0ecfc1f9b67c'::uuid, 23),  -- APR-TH-020

  -- INF (standard: ff847f94)
  ('7cd7b0a5-6511-4404-9450-2bc2c4982d4e'::uuid,  1),  -- APR-INF-H01 (baja)
  ('8886d65a-ee0d-4372-81f9-2b5b16ba5154'::uuid,  2),  -- APR-INF-001
  ('eb4ff629-a434-4315-856a-d3b43f56b9f1'::uuid,  3),  -- APR-INF-002
  ('2f4a24e4-bfea-4a33-9a2c-446618c66744'::uuid,  4),  -- APR-INF-003
  ('9910c2b8-92cb-41af-860a-f6062bef5df3'::uuid,  5),  -- APR-INF-004
  ('e214a7ff-88ae-4068-8f3d-9bb27342363a'::uuid,  6),  -- APR-INF-005
  ('1f790c64-727c-4a63-9fc6-5a0681d2e39d'::uuid,  7),  -- APR-INF-006
  ('dc12c4a2-3290-4ebb-8ae4-a0816b75f86b'::uuid,  8),  -- APR-INF-007
  ('e3bb60b0-d47a-48a5-920f-3b1816a03399'::uuid,  9),  -- APR-INF-008
  ('c31e967e-470f-4e85-b6f5-316446ddfae9'::uuid, 10),  -- APR-INF-009
  ('0d9d1408-9fc4-483c-8136-e1eb7d0aa601'::uuid, 11),  -- APR-INF-010
  ('8ead1859-9698-4596-ad11-25f728d205e2'::uuid, 12),  -- APR-INF-011
  ('8f5e26d4-3ac2-48c3-8240-2dd17f3397df'::uuid, 13),  -- APR-INF-012
  ('918eb8d8-bfe0-4f57-8d2c-10d5c7a5fb22'::uuid, 14),  -- APR-INF-013
  ('3244df24-456b-4503-9e10-9bff45d4806d'::uuid, 15),  -- APR-INF-014
  ('48e2336b-d486-4a69-bae8-7543ac74ce1a'::uuid, 16),  -- APR-INF-015
  ('a554a66b-1895-43b7-ae4d-26409cc7eb9d'::uuid, 17),  -- APR-INF-016
  ('26f63974-f3ac-4bf4-9519-c4078c6c13e8'::uuid, 18),  -- APR-INF-017
  ('f45cc2f4-f05b-4194-8480-c3cd8ac2d9fc'::uuid, 19),  -- APR-INF-018
  ('67a81c02-eb69-435a-9cbb-7ac6252583dd'::uuid, 20),  -- APR-INF-019
  ('91b1a8e1-2843-4d14-a82c-b8b4cc5e942a'::uuid, 21),  -- APR-INF-020
  ('88949859-55d6-4b74-b755-75762f95cd4a'::uuid, 22),  -- APR-INF-021
  ('4c36d16f-ee66-4b2f-b9e4-a5f6afea5910'::uuid, 23),  -- APR-INF-022
  ('9931a19b-513f-4e8a-a1b1-ee4749d4dffc'::uuid, 24),  -- APR-INF-023
  ('f0feb77c-e3e4-4593-b998-f105d2ae8427'::uuid, 25),  -- APR-INF-024
  ('e932bd38-eb27-4cd0-a91c-f0fe7f612ef9'::uuid, 26),  -- APR-INF-025
  ('d2516174-a15a-4e6b-aa46-3fd3401f816f'::uuid, 27),  -- APR-INF-026
  ('e14c446a-0e46-46c5-b6d5-7a60def5e122'::uuid, 28),  -- APR-INF-027
  ('79742192-c3c0-46ee-96db-7fcb7ac09e59'::uuid, 29),  -- APR-INF-028
  ('b4b028c3-0a97-462c-94e7-1a0a2d0ff0b7'::uuid, 30),  -- APR-INF-029
  ('ece86ebf-5b08-442c-9835-137cf043fb2f'::uuid, 31),  -- APR-INF-030
  ('8f49d1c3-7573-4425-9eb4-dd5a9604a828'::uuid, 32),  -- APR-INF-031
  ('320e1410-2184-4bfa-a481-1d351d6eeec4'::uuid, 33),  -- APR-INF-H02 (mediana+alta)
  ('704810fe-0c4d-42ac-b653-1b2caa8aa7c3'::uuid, 34),  -- APR-INF-032
  ('868e1680-2155-4767-89e3-4e98671737f2'::uuid, 35),  -- APR-INF-H03 (todas, telemedicina referencia)
  ('3e686c8a-5a01-4c6b-9113-3e27f081e7e9'::uuid, 36),  -- APR-INF-033

  -- DOT (standard: 0c30253a)
  ('141247a2-9c54-429f-b8e9-5ba513c1f63a'::uuid,  1),  -- APR-DOT-H01 (baja)
  ('79db5d03-b657-4dca-8809-dab6a93204b7'::uuid,  2),  -- APR-DOT-001
  ('acd5d958-cd51-423b-b7a9-acf9adaf8adf'::uuid,  3),  -- APR-DOT-002
  ('13475d49-8424-4b3f-9bc4-140a06442db9'::uuid,  4),  -- APR-DOT-003
  ('ec8b8662-3c47-4adf-8c7b-738dc6951006'::uuid,  5),  -- APR-DOT-004
  ('beb5069d-58c8-420d-a3ed-ff62b46038f2'::uuid,  6),  -- APR-DOT-005
  ('1657a3e4-80aa-4812-8c3e-991a6505a5bb'::uuid,  7),  -- APR-DOT-006
  ('a687b812-7cb4-4a35-badc-350bc3a1fb88'::uuid,  8),  -- APR-DOT-007
  ('b7feac97-a700-4d53-9eb2-72e4383330e2'::uuid,  9),  -- APR-DOT-008
  ('994867e9-e6a8-43b5-9263-5eef55c526f8'::uuid, 10),  -- APR-DOT-009
  ('98d7e49b-c6bb-449a-b224-ff59dc10d722'::uuid, 11),  -- APR-DOT-010
  ('feaa4fcd-5eb3-47a2-ad77-8446067a17f7'::uuid, 12),  -- APR-DOT-011
  ('ddb6e909-ea7f-4980-b0f0-9b290beb782b'::uuid, 13),  -- APR-DOT-012
  ('f4ec3362-86a7-459f-9de8-6ad7011e6cfb'::uuid, 14),  -- APR-DOT-013
  ('066a5359-9ea2-44dd-b901-5bfa436d9b21'::uuid, 15),  -- APR-DOT-014
  ('e27a8ccc-73df-4ae2-9d38-6fc43c7f9eab'::uuid, 16),  -- APR-DOT-015
  ('a86f6c60-f587-4584-a777-b48a3c820e90'::uuid, 17),  -- APR-DOT-016
  ('9c7f362a-1ce3-40aa-9692-2c23cd715c05'::uuid, 18),  -- APR-DOT-017
  ('cf7e62a3-f212-4086-9c0c-73bdb50078da'::uuid, 19),  -- APR-DOT-018
  ('2a92e750-c6e4-4735-a2ac-17103e8badc0'::uuid, 20),  -- APR-DOT-019
  ('d2e89fc7-5dd9-4953-89b4-aa2509c5c5c0'::uuid, 21),  -- APR-DOT-020
  ('9af6bf75-a7a9-4c33-b49f-e7d3840c7a3f'::uuid, 22),  -- APR-DOT-021
  ('465243c8-9f8a-4c83-97ab-22c3ec9d54b1'::uuid, 23),  -- APR-DOT-022
  ('1cb24f65-bc76-4b00-9155-01a2bc67f024'::uuid, 24),  -- APR-DOT-023
  ('ddb99aa9-bf33-4379-9347-0208f693a1d6'::uuid, 25),  -- APR-DOT-024
  ('eba618ad-10c5-4c74-ba19-ea8bcf677f44'::uuid, 26),  -- APR-DOT-025
  ('6997ad3d-6c9c-4323-9ef0-77638b1e673b'::uuid, 27),  -- APR-DOT-026
  ('fe45ac9f-978e-4501-8e87-e173b6c959d8'::uuid, 28),  -- APR-DOT-027
  ('fb57775f-3799-4fa2-b214-6ea02bab3362'::uuid, 29),  -- APR-DOT-028
  ('b6e1a0e8-10e6-4ec6-8886-b56a9f9c8c9a'::uuid, 30),  -- APR-DOT-029
  ('ffdf27bf-0bc4-4803-b1bb-ad4f3397309c'::uuid, 31),  -- APR-DOT-030
  ('9f9db156-cc96-48c6-b239-86c7442ac7f0'::uuid, 32),  -- APR-DOT-031
  ('22dcfcb5-807c-4e11-b166-5dcd7354a3a0'::uuid, 33),  -- APR-DOT-032
  ('66fb1323-e9fc-4524-983a-4068faaec437'::uuid, 34),  -- APR-DOT-033
  ('6cba9b01-b0f8-4518-b7f4-fa7248e02cfc'::uuid, 35),  -- APR-DOT-034
  ('e7e32f60-6cc0-445f-a9b0-5b48caf1ddf3'::uuid, 36),  -- APR-DOT-035
  ('52b15431-bcfc-48d0-b41a-c9743295f2fd'::uuid, 37),  -- APR-DOT-036
  ('f57619d2-92d2-404b-b43e-bafca4bc16ce'::uuid, 38),  -- APR-DOT-037
  ('7f64b5e6-a051-4270-8e1b-069489777224'::uuid, 39),  -- APR-DOT-038
  ('516ff1d2-c587-4466-8d09-1b7473d00522'::uuid, 40),  -- APR-DOT-039
  ('89e10ca5-0338-4686-a61e-4b6fb3e726a3'::uuid, 41),  -- APR-DOT-040
  ('0b35b139-3d1d-4895-b900-dba19b201f32'::uuid, 42),  -- APR-DOT-041
  ('0f8b9bf5-31c7-4d4d-9be0-7633ba506d88'::uuid, 43),  -- APR-DOT-042
  ('9c165b25-2421-4c46-ae78-81e215e4f863'::uuid, 44),  -- APR-DOT-043
  ('a8a096f7-ea46-421d-b4fd-7c059d5a341c'::uuid, 45),  -- APR-DOT-044
  ('e86d2da4-3227-46d4-9372-aadb4535763d'::uuid, 46),  -- APR-DOT-045
  ('93074813-14d9-4bd5-ac8a-ee913e97f892'::uuid, 47),  -- APR-DOT-046
  ('ad14a218-2cd7-48da-ae51-2101f9ea5fda'::uuid, 48),  -- APR-DOT-047
  ('76e34083-7a7b-442e-915b-1b77cb7336b2'::uuid, 49),  -- APR-DOT-048
  ('b1e17a27-14cd-4421-a3ea-3b46847b882c'::uuid, 50),  -- APR-DOT-049
  ('dd854d02-3a17-47c0-a401-d04b1ba2eeab'::uuid, 51),  -- APR-DOT-H02 (mediana)
  ('df25e6d4-d39b-4523-9ee1-c846588f9209'::uuid, 52),  -- APR-DOT-050
  ('d1468fcd-2c4a-43dc-a885-e8038ad5ecb8'::uuid, 53),  -- APR-DOT-051
  ('671a5d32-0800-4672-8ea5-ec26062ddf8b'::uuid, 54),  -- APR-DOT-052
  ('da2a95ea-737e-4456-8d0b-61de53a346d2'::uuid, 55),  -- APR-DOT-053
  ('25af587c-575e-40d0-b844-66425223bb2a'::uuid, 56),  -- APR-DOT-054
  ('a2802529-6134-41d2-854f-fa20e298b9b7'::uuid, 57),  -- APR-DOT-055
  ('b469d3d3-9997-4e55-9fcb-b0dc8b269d81'::uuid, 58),  -- APR-DOT-056
  ('1a4ecf0c-d3f0-4760-8c89-7720210d7383'::uuid, 59),  -- APR-DOT-057
  ('e6293bdb-f8d3-46a0-bc89-856448ca0a20'::uuid, 60),  -- APR-DOT-058
  ('8954f12e-96cd-46e0-b464-5e4cb1868b73'::uuid, 61),  -- APR-DOT-059
  ('f062bb27-5507-4fb9-9c54-9b184afd4006'::uuid, 62),  -- APR-DOT-060
  ('c03b1f3f-0900-49f2-a732-253211d34cf6'::uuid, 63),  -- APR-DOT-061
  ('ecb822f5-6fd3-4e4f-b0c8-8df1313b234c'::uuid, 64),  -- APR-DOT-062
  ('b236677f-c50a-4923-9030-1270c90375e7'::uuid, 65),  -- APR-DOT-H03 (alta)
  ('4abd7c73-0119-4bc7-996d-e9c1a4eb4ad2'::uuid, 66),  -- APR-DOT-063
  ('85878ef5-8854-4c06-a7e0-824863eb625f'::uuid, 67),  -- APR-DOT-064
  ('466c94b9-d76c-45e1-a73d-7099ac18e443'::uuid, 68),  -- APR-DOT-065
  ('84a3a60c-d209-4735-97fe-0cfc1df284fc'::uuid, 69),  -- APR-DOT-066
  ('a00d9c33-46e4-4619-8baf-baff9031c3a2'::uuid, 70),  -- APR-DOT-067
  ('38aec372-ddb6-4261-a369-e3a7b6e89f19'::uuid, 71),  -- APR-DOT-H04 (todas, telemedicina referencia)
  ('4a12346f-9538-4f5e-b77e-2654e8f1223b'::uuid, 72),  -- APR-DOT-068

  -- MED (standard: ffa3c1a7; era APR_MD)
  ('2715a41b-4812-4992-a4e5-8f14170b1052'::uuid,  1),  -- APR-MED-H01
  ('9d598281-3646-47a9-9608-880c3afc0999'::uuid,  2),  -- APR-MED-001
  ('877acef6-21eb-4d23-88d5-279184c3627f'::uuid,  3),  -- APR-MED-002
  ('d654baf5-232f-4418-9e93-e64562be02e2'::uuid,  4),  -- APR-MED-003
  ('04f64ec0-8648-4c7b-9e15-80d22c991975'::uuid,  5),  -- APR-MED-004
  ('0eb46d65-1951-41bc-91ad-aa0a5c8831cd'::uuid,  6),  -- APR-MED-005
  ('4f6f0deb-a483-4b43-a94c-b2aa5a6ed84c'::uuid,  7),  -- APR-MED-006
  ('d24541e7-d9ca-4371-961a-2a8f756abe19'::uuid,  8),  -- APR-MED-007
  ('14622521-9d68-4758-ae51-741a1fb18e32'::uuid,  9),  -- APR-MED-H02 (telemedicina referencia)
  ('9a58f4f5-2dd7-463d-9c39-883e97823e67'::uuid, 10),  -- APR-MED-008

  -- PP (standard: b4e6f70c)
  ('f06e5210-7d51-4bb5-a4b2-6f811d5b69b4'::uuid,  1),  -- APR-PP-H01 (baja)
  ('71fc4bb4-768a-4d14-b856-6366f55f24a6'::uuid,  2),  -- APR-PP-001
  ('b884cdf8-1abc-4aa5-9a09-6e8f05d68731'::uuid,  3),  -- APR-PP-002
  ('8004bce3-3c74-47f9-ace4-8dc1cce935bf'::uuid,  4),  -- APR-PP-003
  ('4d7a4069-7f52-49b1-a3c1-8b788826b372'::uuid,  5),  -- APR-PP-004
  ('88cc270c-4f8e-446e-9fb1-7bdbf670a007'::uuid,  6),  -- APR-PP-005
  ('b438a96b-6670-41d2-9058-e6f4801b083e'::uuid,  7),  -- APR-PP-006
  ('95a320be-1cc5-47f2-8f63-36af8c3b1fcd'::uuid,  8),  -- APR-PP-007
  ('6dca4439-cd98-4ad8-96d6-505d67aa5e76'::uuid,  9),  -- APR-PP-008
  ('11f16144-b4f8-4c60-a32a-e6767ee70041'::uuid, 10),  -- APR-PP-009
  ('65500d34-b65d-4cd4-9c4f-6849da4575e6'::uuid, 11),  -- APR-PP-010
  ('aac03fbb-a624-42c8-b879-5490f17dd681'::uuid, 12),  -- APR-PP-011
  ('e47634c2-3a08-46f1-98ea-d77f58038e68'::uuid, 13),  -- APR-PP-012
  ('5d8cb94b-74ea-4d24-9885-ff0f1fcce8b0'::uuid, 14),  -- APR-PP-013
  ('169a523e-15fb-47d6-bd83-673a7f623188'::uuid, 15),  -- APR-PP-014
  ('33d748b7-fb75-4ba9-8577-cebada58bdbb'::uuid, 16),  -- APR-PP-015
  ('3bca6dcd-720b-48b2-8df7-64286fd63b76'::uuid, 17),  -- APR-PP-H02 (mediana+alta)
  ('d1f55565-0d89-4ec1-9eb6-a7ec9215079e'::uuid, 18),  -- APR-PP-016
  ('887f1563-e979-427c-b189-ea1047d58e0a'::uuid, 19),  -- APR-PP-017
  ('9c90b41c-8231-4e50-9f6e-cd15b70b4fca'::uuid, 20),  -- APR-PP-018
  ('3383c639-d165-473c-a92f-7f6cb7c111d6'::uuid, 21),  -- APR-PP-H03 (todas, telemedicina referencia)
  ('26df0982-f700-47b5-a980-1cb0d3143b1d'::uuid, 22),  -- APR-PP-019

  -- HC (standard: 61c35936; era APR_HCR)
  ('b78c2da4-873c-4f17-8264-9fcef0e6d28c'::uuid,  1),  -- APR-HC-H01
  ('016dc0d8-804a-4402-82cb-8dfb23b2fae8'::uuid,  2),  -- APR-HC-001
  ('8f3f9def-8e4d-457d-9021-4d70b6aebbbc'::uuid,  3),  -- APR-HC-H02 (telemedicina referencia)
  ('1c67ce0e-58ef-490f-b5e3-bb0a8196bcc9'::uuid,  4),  -- APR-HC-002

  -- INT (standard: 545048ea)
  ('aef4a42b-7f36-4755-9b23-df21c9bfe68c'::uuid,  1),  -- APR-INT-H01 (baja, intramural)
  ('b9034f65-df29-4c5a-ac2f-5c797a69a8c4'::uuid,  2),  -- APR-INT-001
  ('9299feec-6e35-4954-914f-f46e18bedb47'::uuid,  3),  -- APR-INT-002
  ('8f31abca-c594-4967-9b99-7a651798c156'::uuid,  4),  -- APR-INT-003
  ('78aba863-480d-4ed7-bad7-7280e29cb6b1'::uuid,  5),  -- APR-INT-004
  ('7e6a33c1-ec0d-4c28-8f38-4cba48c1e9aa'::uuid,  6),  -- APR-INT-005
  ('b089ae12-291d-4dc5-bd8f-0a0abd278ebe'::uuid,  7),  -- APR-INT-006
  ('8b9ecac3-34bd-4119-95fb-3f1c8f388409'::uuid,  8),  -- APR-INT-007
  ('4dfc3c54-4212-4a46-9600-62f4a970681d'::uuid,  9),  -- APR-INT-H02 (mediana, intramural)
  ('af4ad05d-fe44-4d51-b3df-d2e13c9bafe8'::uuid, 10),  -- APR-INT-008
  ('7f839162-4315-4457-ae6f-c99a63ef40ae'::uuid, 11),  -- APR-INT-009
  ('508c8f16-fbe5-4e7c-abda-79f662dd99e8'::uuid, 12),  -- APR-INT-010
  ('2823639d-9d62-493d-ab47-babf5b9b0d8d'::uuid, 13),  -- APR-INT-011
  ('c671d4db-71aa-4cee-b451-320291d483fe'::uuid, 14),  -- APR-INT-012
  ('d10ccaff-f81b-4d68-ae0c-c5d4250debf1'::uuid, 15),  -- APR-INT-013
  ('36eb7795-749f-4e45-82e6-5a5cde27be67'::uuid, 16),  -- APR-INT-014
  ('778463f6-8497-4403-a9e4-c62c39e42002'::uuid, 17),  -- APR-INT-015
  ('6fc49fda-5379-43ff-80c1-9d2c130ad38c'::uuid, 18),  -- APR-INT-016
  ('d56ef745-3039-4302-a437-547b26012902'::uuid, 19),  -- APR-INT-017
  ('ea9d17df-205f-4679-8a82-17738e02cc75'::uuid, 20),  -- APR-INT-H03 (alta, intramural)
  ('5c0ddbc1-88c2-45e3-8f37-cd37c6716b37'::uuid, 21),  -- APR-INT-018
  ('0ff7ac9f-d6c0-49cf-adc6-3a21bc02efd3'::uuid, 22),  -- APR-INT-019
  ('df025a28-d147-45c7-b1ab-1e8721f969c3'::uuid, 23),  -- APR-INT-020
  ('971e3009-7ad0-45a8-b7fc-9be1b19388ab'::uuid, 24),  -- APR-INT-H04 (todas, telemedicina remisor+referencia)
  ('598f94a9-d6a6-465b-85b1-fada7135e24f'::uuid, 25)   -- APR-INT-021
) AS v(id, s)
WHERE ec.id = v.id;

COMMIT;

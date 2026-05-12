-- =============================================================================
-- Migración: Corregir criterios asignados al estándar equivocado
-- Fuente de verdad: Archivo_Consolidaddo_Resolucion_3100-2019.xlsx
--
-- Afecta 9 servicios: CEE, TRF, RXO, TLC, DLS, HSP, CPC, QRG, TAS
-- Los totales de criterios son correctos; solo el standard_id estaba mal.
-- =============================================================================

BEGIN;

-- =============================================================
-- CEE
-- =============================================================
-- Crear estándar CEE_HCR
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('fbea6a1b-3ab0-4f12-b861-77fa8bc1cc14', 'CEE_HCR', 'Historia Clinica y Registros', '2fce81c9-9e0c-4386-8961-d1f4cbdcab11');

UPDATE evaluation_criteria
SET standard_id = 'fbea6a1b-3ab0-4f12-b861-77fa8bc1cc14', code = 'CEE-HCR-001'
WHERE id = '80e7e9f8-f956-4c43-8ce6-fd2f0553db7a';
UPDATE evaluation_criteria
SET standard_id = 'fbea6a1b-3ab0-4f12-b861-77fa8bc1cc14', code = 'CEE-HCR-002'
WHERE id = 'aad736ad-b5cd-486a-aee6-2cdb3b72dd56';

-- Crear estándar CEE_INT
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('631c6b2e-6913-42af-bb28-c7801cfae4b4', 'CEE_INT', 'Interdependencia de Servicios', '2fce81c9-9e0c-4386-8961-d1f4cbdcab11');

UPDATE evaluation_criteria
SET standard_id = '631c6b2e-6913-42af-bb28-c7801cfae4b4', code = 'CEE-INT-001'
WHERE id = 'cb970ab4-4c2e-4cee-a572-53c4840ef329';
UPDATE evaluation_criteria
SET standard_id = '631c6b2e-6913-42af-bb28-c7801cfae4b4', code = 'CEE-INT-002'
WHERE id = '5d32b12c-6d8d-4c73-ba71-bd614ed361a9';
UPDATE evaluation_criteria
SET standard_id = '631c6b2e-6913-42af-bb28-c7801cfae4b4', code = 'CEE-INT-003'
WHERE id = '68fe5971-2e70-4639-b224-76570712c67a';
UPDATE evaluation_criteria
SET standard_id = '631c6b2e-6913-42af-bb28-c7801cfae4b4', code = 'CEE-INT-004'
WHERE id = '93de64be-0dc3-4ea6-b3b0-6ede811c15d6';
UPDATE evaluation_criteria
SET standard_id = '631c6b2e-6913-42af-bb28-c7801cfae4b4', code = 'CEE-INT-005'
WHERE id = 'bb9bd29a-3074-4962-953a-0a6d63e91f43';

-- =============================================================
-- TRF
-- =============================================================
-- Crear estándar TRF_MD
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('7309fbe1-3674-4356-8226-e256f8aebf2c', 'TRF_MD', 'Medicamentos, Dispositivos Medicos e Insumos', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb');

UPDATE evaluation_criteria
SET standard_id = '7309fbe1-3674-4356-8226-e256f8aebf2c', code = 'TRF-MD-001'
WHERE id = '89276da6-ec7c-4313-b2f3-361595888720';
UPDATE evaluation_criteria
SET standard_id = '7309fbe1-3674-4356-8226-e256f8aebf2c', code = 'TRF-MD-002'
WHERE id = 'ae65d320-3e92-408f-9018-a9781fe985c9';
UPDATE evaluation_criteria
SET standard_id = '7309fbe1-3674-4356-8226-e256f8aebf2c', code = 'TRF-MD-003'
WHERE id = '8057b2e0-2d36-4afa-8a68-6e064f64331d';
UPDATE evaluation_criteria
SET standard_id = '7309fbe1-3674-4356-8226-e256f8aebf2c', code = 'TRF-MD-004'
WHERE id = '43f79713-8938-425c-9f7a-2ebbf34924ff';
UPDATE evaluation_criteria
SET standard_id = '7309fbe1-3674-4356-8226-e256f8aebf2c', code = 'TRF-MD-005'
WHERE id = 'd94e3360-29b3-46e6-a0be-85d85439774e';
UPDATE evaluation_criteria
SET standard_id = '7309fbe1-3674-4356-8226-e256f8aebf2c', code = 'TRF-MD-006'
WHERE id = 'd182e541-5695-4144-8bbe-dc13ec029d1f';
UPDATE evaluation_criteria
SET standard_id = '7309fbe1-3674-4356-8226-e256f8aebf2c', code = 'TRF-MD-007'
WHERE id = 'aefbe21b-3aa6-4baa-98de-b915f7f0edc9';

-- Crear estándar TRF_HCR
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('8f13c1f0-e0ee-4222-b5bc-771aad9baaa8', 'TRF_HCR', 'Historia Clinica y Registros', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb');

UPDATE evaluation_criteria
SET standard_id = '8f13c1f0-e0ee-4222-b5bc-771aad9baaa8', code = 'TRF-HCR-001'
WHERE id = '06cdf89e-4d01-4c79-84ea-8825f08d0d02';
UPDATE evaluation_criteria
SET standard_id = '8f13c1f0-e0ee-4222-b5bc-771aad9baaa8', code = 'TRF-HCR-002'
WHERE id = '106d0019-f982-4429-a3d6-3b9e0b602c91';

-- =============================================================
-- RXO
-- =============================================================
-- Crear estándar RXO_HCR
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('b7839b1d-0c82-4f3a-8a68-cee9b9a620ae', 'RXO_HCR', 'Historia Clinica y Registros', '54938bcc-8455-4d05-9623-855a750039b5');

UPDATE evaluation_criteria
SET standard_id = 'b7839b1d-0c82-4f3a-8a68-cee9b9a620ae', code = 'RXO-HCR-001'
WHERE id = '89bb390e-0023-40fe-941c-cacbc0609f74';
UPDATE evaluation_criteria
SET standard_id = 'b7839b1d-0c82-4f3a-8a68-cee9b9a620ae', code = 'RXO-HCR-002'
WHERE id = 'c162648d-966d-4f5e-a6bf-9083781c948a';
UPDATE evaluation_criteria
SET standard_id = 'b7839b1d-0c82-4f3a-8a68-cee9b9a620ae', code = 'RXO-HCR-003'
WHERE id = '638b5e1f-55df-485c-baed-b3863d9f5e4a';
UPDATE evaluation_criteria
SET standard_id = 'b7839b1d-0c82-4f3a-8a68-cee9b9a620ae', code = 'RXO-HCR-004'
WHERE id = 'e976813a-5ec3-4bab-9c8b-7853a8373c5c';
UPDATE evaluation_criteria
SET standard_id = 'b7839b1d-0c82-4f3a-8a68-cee9b9a620ae', code = 'RXO-HCR-005'
WHERE id = 'eee156d2-dafb-4242-a221-8cd0cff747b2';
UPDATE evaluation_criteria
SET standard_id = 'b7839b1d-0c82-4f3a-8a68-cee9b9a620ae', code = 'RXO-HCR-006'
WHERE id = 'b07204f5-b2aa-4d54-8b01-6b4eb69d8f77';
UPDATE evaluation_criteria
SET standard_id = 'b7839b1d-0c82-4f3a-8a68-cee9b9a620ae', code = 'RXO-HCR-007'
WHERE id = '34694fc3-72d5-4dfc-9416-c1c82ba825bd';
UPDATE evaluation_criteria
SET standard_id = 'b7839b1d-0c82-4f3a-8a68-cee9b9a620ae', code = 'RXO-HCR-008'
WHERE id = '987f9c3d-76a2-4cca-8639-dcd12edc2ff2';
UPDATE evaluation_criteria
SET standard_id = 'b7839b1d-0c82-4f3a-8a68-cee9b9a620ae', code = 'RXO-HCR-009'
WHERE id = 'f8a66612-d133-481e-bf86-c364e83216ce';

-- =============================================================
-- TLC
-- =============================================================
-- Crear estándar TLC_MD
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('163475db-e70d-428a-b700-6dc47fb28628', 'TLC_MD', 'Medicamentos, Dispositivos Medicos e Insumos', '6758b161-9816-428f-a8a7-ae01e13dad78');

UPDATE evaluation_criteria
SET standard_id = '163475db-e70d-428a-b700-6dc47fb28628', code = 'TLC-MD-001'
WHERE id = 'b6d3c215-5f44-413c-bc44-23300de76c3f';

-- =============================================================
-- DLS
-- =============================================================
-- Crear estándar DLS_INF
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('82d9f32f-d5f6-49ba-a558-4ef92e493c2d', 'DLS_INF', 'Infraestructura', '48eb5692-a8c9-4245-a68a-cae277293a85');

UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-001'
WHERE id = 'cdf94a07-d3a0-4065-a5d0-5254df61ffe5';
UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-002'
WHERE id = '37183376-9aaa-4ff0-bdcf-a77bf7351eb1';
UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-003'
WHERE id = '3633f8c0-18de-4d08-8fda-168835785e45';
UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-004'
WHERE id = '2cb2f74d-8347-4ccf-813c-76815b607839';
UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-005'
WHERE id = '5098f205-07fc-4d86-b405-e770b7a2ca6c';
UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-006'
WHERE id = 'dccbe1f3-844a-4a0f-a985-3b1262811b75';
UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-007'
WHERE id = '8a26daaa-44a6-4351-bba0-39930be92827';
UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-008'
WHERE id = '626a0fb8-c849-4381-a4b0-5e7c8ff6fe73';
UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-009'
WHERE id = '6d1d74e5-3b85-474d-a728-8a01792a2642';
UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-010'
WHERE id = 'af87db0d-5f2b-49f9-b663-14cc93ff40bb';
UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-011'
WHERE id = '144f6c03-142a-4b25-ae2c-944e714a8240';
UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-012'
WHERE id = '12093b36-62a9-422d-a674-72061291a57a';
UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-013'
WHERE id = '9bfc4658-a411-4f24-9fa3-4f3e41fd7261';
UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-014'
WHERE id = 'c5c51689-d915-4df1-8b96-9a7eef229480';
UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-015'
WHERE id = '0e101ab9-b592-4e4b-b6cc-0d9879dc8dd1';
UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-016'
WHERE id = '65fd6a56-d1d8-4a57-8f77-c05f64e4163d';
UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-017'
WHERE id = '7edf5eda-2086-4dba-b572-0c1f30b5260e';
UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-018'
WHERE id = '5093e6fc-ad2c-45fc-802c-c77ed431e176';
UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-019'
WHERE id = '0da23e22-f4b8-4164-a348-4d073abeaf60';
UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-020'
WHERE id = '2e1a4b6d-8f5a-4db1-aede-97c6ac6de9d3';
UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-021'
WHERE id = 'f899d226-a7a2-4aa8-94cc-57a3d15dbb7a';
UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-022'
WHERE id = 'a1002503-b3b2-47c8-84b8-5be435b39c0f';
UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-023'
WHERE id = '25c0c8ca-cec9-46bd-aabe-d47f64bb8ea6';
UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-024'
WHERE id = '6c648ae1-f60d-406c-9fec-8170a20458b1';
UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-025'
WHERE id = '49867d1c-2bad-419d-99f4-932231314952';
UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-026'
WHERE id = 'b2c9526e-29c7-4d8e-9bd4-99bd3f776f68';
UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-027'
WHERE id = '91eb7099-0e08-43a0-b98e-fe37fa9dfa7f';
UPDATE evaluation_criteria
SET standard_id = '82d9f32f-d5f6-49ba-a558-4ef92e493c2d', code = 'DLS-INF-028'
WHERE id = '396b2574-be01-4f12-9ecd-b6f24603d37b';

-- =============================================================
-- HSP
-- =============================================================
-- Crear estándar HSP_DOT
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('237ed3d0-85f0-45df-b19c-02c880b49a45', 'HSP_DOT', 'Dotacion', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e');

UPDATE evaluation_criteria
SET standard_id = '237ed3d0-85f0-45df-b19c-02c880b49a45', code = 'HSP-DOT-001'
WHERE id = '8fbedeb6-48f2-4431-9ca3-0d363b9f3f02';
UPDATE evaluation_criteria
SET standard_id = '237ed3d0-85f0-45df-b19c-02c880b49a45', code = 'HSP-DOT-002'
WHERE id = 'd06b857e-f3d3-44b8-afe0-3f64f2bdb8cb';
UPDATE evaluation_criteria
SET standard_id = '237ed3d0-85f0-45df-b19c-02c880b49a45', code = 'HSP-DOT-003'
WHERE id = '6a072ebd-d3fe-4145-96c5-aaa09543c1fc';
UPDATE evaluation_criteria
SET standard_id = '237ed3d0-85f0-45df-b19c-02c880b49a45', code = 'HSP-DOT-004'
WHERE id = 'd91a7c4f-42eb-40ea-b3b6-b577afedd164';
UPDATE evaluation_criteria
SET standard_id = '237ed3d0-85f0-45df-b19c-02c880b49a45', code = 'HSP-DOT-005'
WHERE id = '15baafa7-86a3-4a5b-a290-6b4146e9b5ed';

-- Crear estándar HSP_HCR
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('a2ede542-214f-460d-aa2c-7fd892fba5df', 'HSP_HCR', 'Historia Clinica y Registros', 'd3298ac3-6fd8-4752-b519-f21bc6f0da0e');

UPDATE evaluation_criteria
SET standard_id = 'a2ede542-214f-460d-aa2c-7fd892fba5df', code = 'HSP-HCR-001'
WHERE id = '48300b42-908f-4391-b7d6-83495f2b6920';

-- =============================================================
-- CPC
-- =============================================================
-- Crear estándar CPC_MD
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('d09e81fb-073d-45c5-bb1a-d9b68c3c4c4e', 'CPC_MD', 'Medicamentos, Dispositivos Medicos e Insumos', '7dc36046-7190-478a-b82f-32735378844c');

UPDATE evaluation_criteria
SET standard_id = 'd09e81fb-073d-45c5-bb1a-d9b68c3c4c4e', code = 'CPC-MD-001'
WHERE id = '92b53d91-88e6-460a-8a61-7fd71eb9214b';
UPDATE evaluation_criteria
SET standard_id = 'd09e81fb-073d-45c5-bb1a-d9b68c3c4c4e', code = 'CPC-MD-002'
WHERE id = '5a745c9a-fefa-46b1-a1ca-fb6aa848b0b4';
UPDATE evaluation_criteria
SET standard_id = 'd09e81fb-073d-45c5-bb1a-d9b68c3c4c4e', code = 'CPC-MD-003'
WHERE id = 'a455edea-b3c8-48c0-8e35-27e0bce1d63b';
UPDATE evaluation_criteria
SET standard_id = 'd09e81fb-073d-45c5-bb1a-d9b68c3c4c4e', code = 'CPC-MD-004'
WHERE id = '8b73f7a2-e3fb-403a-94e9-c329487c6f92';
UPDATE evaluation_criteria
SET standard_id = 'd09e81fb-073d-45c5-bb1a-d9b68c3c4c4e', code = 'CPC-MD-005'
WHERE id = '9b87cc5c-3b7b-42d2-89b4-9d4567d1f7c1';

-- =============================================================
-- QRG
-- =============================================================
-- Crear estándar QRG_HCR
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('87f39dd7-e27b-4037-a057-8c97c3784ca4', 'QRG_HCR', 'Historia Clinica y Registros', 'f3f8b89e-3462-45ae-8820-a5ab01ad7826');

UPDATE evaluation_criteria
SET standard_id = '87f39dd7-e27b-4037-a057-8c97c3784ca4', code = 'QRG-HCR-001'
WHERE id = '817211b7-77a0-4dc6-ae35-5bd32ebe02d6';
UPDATE evaluation_criteria
SET standard_id = '87f39dd7-e27b-4037-a057-8c97c3784ca4', code = 'QRG-HCR-002'
WHERE id = 'aeca5397-175f-4aa4-9a6e-7f5c28ec2796';
UPDATE evaluation_criteria
SET standard_id = '87f39dd7-e27b-4037-a057-8c97c3784ca4', code = 'QRG-HCR-003'
WHERE id = '38b5c92c-6535-429b-a817-2945f352de70';
UPDATE evaluation_criteria
SET standard_id = '87f39dd7-e27b-4037-a057-8c97c3784ca4', code = 'QRG-HCR-004'
WHERE id = 'ec5616b6-e299-4acf-a71a-9d1fe9a6757a';
UPDATE evaluation_criteria
SET standard_id = '87f39dd7-e27b-4037-a057-8c97c3784ca4', code = 'QRG-HCR-005'
WHERE id = '074f9096-bf71-47b3-902a-0d020b77f2f8';
UPDATE evaluation_criteria
SET standard_id = '87f39dd7-e27b-4037-a057-8c97c3784ca4', code = 'QRG-HCR-006'
WHERE id = 'c5c0d619-05ab-4938-a69e-d2871ec25c8b';
UPDATE evaluation_criteria
SET standard_id = '87f39dd7-e27b-4037-a057-8c97c3784ca4', code = 'QRG-HCR-007'
WHERE id = 'a8cd5a6a-b00f-42b4-a9b9-2be3d4a4dc9c';
UPDATE evaluation_criteria
SET standard_id = '87f39dd7-e27b-4037-a057-8c97c3784ca4', code = 'QRG-HCR-008'
WHERE id = '250b85f2-c70a-4534-9851-faea12246c3a';
UPDATE evaluation_criteria
SET standard_id = '87f39dd7-e27b-4037-a057-8c97c3784ca4', code = 'QRG-HCR-009'
WHERE id = 'ccd3f7ec-fad1-4c58-915c-8fbf7b226bf8';
UPDATE evaluation_criteria
SET standard_id = '87f39dd7-e27b-4037-a057-8c97c3784ca4', code = 'QRG-HCR-010'
WHERE id = '89d05045-2b0a-4fae-9cd6-0d1f94d878f6';
UPDATE evaluation_criteria
SET standard_id = '87f39dd7-e27b-4037-a057-8c97c3784ca4', code = 'QRG-HCR-011'
WHERE id = '57918bde-7297-426c-8706-6c46511bae9a';
UPDATE evaluation_criteria
SET standard_id = '87f39dd7-e27b-4037-a057-8c97c3784ca4', code = 'QRG-HCR-012'
WHERE id = '32c2a859-a49a-443b-a65d-22956009ffb4';
UPDATE evaluation_criteria
SET standard_id = '87f39dd7-e27b-4037-a057-8c97c3784ca4', code = 'QRG-HCR-013'
WHERE id = 'fa24b87d-d21d-48be-ac86-9abd34aad668';

-- =============================================================
-- TAS
-- =============================================================
-- Crear estándar TAS_MD
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('d27781ac-daa1-43bc-b8b6-5648289f81ef', 'TAS_MD', 'Medicamentos, Dispositivos Medicos e Insumos', '3a0da41a-9ff5-4ce7-a0b5-d433c2146a4b');

UPDATE evaluation_criteria
SET standard_id = 'd27781ac-daa1-43bc-b8b6-5648289f81ef', code = 'TAS-MD-001'
WHERE id = '150d241b-4f68-482c-bc31-90b0005c5a6b';
UPDATE evaluation_criteria
SET standard_id = 'd27781ac-daa1-43bc-b8b6-5648289f81ef', code = 'TAS-MD-002'
WHERE id = 'd5f15fad-8df2-438b-a4e8-9064df424d76';
UPDATE evaluation_criteria
SET standard_id = 'd27781ac-daa1-43bc-b8b6-5648289f81ef', code = 'TAS-MD-003'
WHERE id = '5c06fd77-88ee-412f-88c0-2e2e3deb9d19';
UPDATE evaluation_criteria
SET standard_id = 'd27781ac-daa1-43bc-b8b6-5648289f81ef', code = 'TAS-MD-004'
WHERE id = 'd9ccdd70-9358-48f6-b12e-7ade6082b37b';
UPDATE evaluation_criteria
SET standard_id = 'd27781ac-daa1-43bc-b8b6-5648289f81ef', code = 'TAS-MD-005'
WHERE id = '57451036-73e9-4e2a-a5c9-ec1f65a4b617';
UPDATE evaluation_criteria
SET standard_id = 'd27781ac-daa1-43bc-b8b6-5648289f81ef', code = 'TAS-MD-006'
WHERE id = '1705f00d-963a-4882-845c-2238582250cb';
UPDATE evaluation_criteria
SET standard_id = 'd27781ac-daa1-43bc-b8b6-5648289f81ef', code = 'TAS-MD-007'
WHERE id = '3beb2b75-faf0-4977-88f4-507da6d741a2';
UPDATE evaluation_criteria
SET standard_id = 'd27781ac-daa1-43bc-b8b6-5648289f81ef', code = 'TAS-MD-008'
WHERE id = '618ad1ab-9fdf-4b5e-890a-2c709393d967';
UPDATE evaluation_criteria
SET standard_id = 'd27781ac-daa1-43bc-b8b6-5648289f81ef', code = 'TAS-MD-009'
WHERE id = '1fde5640-22e0-454a-871d-d10e8d6315ac';
UPDATE evaluation_criteria
SET standard_id = 'd27781ac-daa1-43bc-b8b6-5648289f81ef', code = 'TAS-MD-010'
WHERE id = '7956c474-0b07-4dc7-ae31-67f459f3d044';

-- Crear estándar TAS_HCR
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('432043ae-f95a-4baf-94e0-b5f8cf6e0d1b', 'TAS_HCR', 'Historia Clinica y Registros', '3a0da41a-9ff5-4ce7-a0b5-d433c2146a4b');

UPDATE evaluation_criteria
SET standard_id = '432043ae-f95a-4baf-94e0-b5f8cf6e0d1b', code = 'TAS-HCR-001'
WHERE id = '456cbb55-1374-4351-ac67-401da66baf25';
UPDATE evaluation_criteria
SET standard_id = '432043ae-f95a-4baf-94e0-b5f8cf6e0d1b', code = 'TAS-HCR-002'
WHERE id = '84126552-458c-47d4-9a5e-a571d7513c6a';
UPDATE evaluation_criteria
SET standard_id = '432043ae-f95a-4baf-94e0-b5f8cf6e0d1b', code = 'TAS-HCR-003'
WHERE id = '823008bf-0fe0-47a4-b792-356b041501d8';
UPDATE evaluation_criteria
SET standard_id = '432043ae-f95a-4baf-94e0-b5f8cf6e0d1b', code = 'TAS-HCR-004'
WHERE id = 'b1071a56-9ad8-4c6e-855b-8312f0ca92bd';
UPDATE evaluation_criteria
SET standard_id = '432043ae-f95a-4baf-94e0-b5f8cf6e0d1b', code = 'TAS-HCR-005'
WHERE id = '8ff32c0e-2a2c-4de2-98e3-1a4feb878b36';
UPDATE evaluation_criteria
SET standard_id = '432043ae-f95a-4baf-94e0-b5f8cf6e0d1b', code = 'TAS-HCR-006'
WHERE id = '0208b82f-905f-412c-bf6e-9cf07afceac4';
UPDATE evaluation_criteria
SET standard_id = '432043ae-f95a-4baf-94e0-b5f8cf6e0d1b', code = 'TAS-HCR-007'
WHERE id = 'bc53779f-2af7-4f23-b324-a4e170b0cf93';
UPDATE evaluation_criteria
SET standard_id = '432043ae-f95a-4baf-94e0-b5f8cf6e0d1b', code = 'TAS-HCR-008'
WHERE id = '6c0402ed-6c18-4eab-84a0-07fe942ace19';
UPDATE evaluation_criteria
SET standard_id = '432043ae-f95a-4baf-94e0-b5f8cf6e0d1b', code = 'TAS-HCR-009'
WHERE id = '8d5e08f7-3f25-4361-9bbd-987199937a9f';
UPDATE evaluation_criteria
SET standard_id = '432043ae-f95a-4baf-94e0-b5f8cf6e0d1b', code = 'TAS-HCR-010'
WHERE id = '5a6bd5ff-0d30-4106-88df-95e78cf84acf';
UPDATE evaluation_criteria
SET standard_id = '432043ae-f95a-4baf-94e0-b5f8cf6e0d1b', code = 'TAS-HCR-011'
WHERE id = '6016d90f-8312-4597-8991-fdfc5ca006aa';
UPDATE evaluation_criteria
SET standard_id = '432043ae-f95a-4baf-94e0-b5f8cf6e0d1b', code = 'TAS-HCR-012'
WHERE id = '7ea3444e-ad31-4b92-aa71-22bd520b7cf7';

COMMIT;
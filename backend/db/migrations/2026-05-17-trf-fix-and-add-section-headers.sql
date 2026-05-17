-- =============================================================================
-- Correcciones para Servicio de Terapias (TRF) — fuente de verdad: hoja 11.3.1.S_TR
--
-- Problemas encontrados:
--  1. TRF_DOT tenía 14 criterios (15-28) cuando debería tener 5 (15-19).
--     Los criterios 20-28 eran duplicados de TRF_MD (20-26) y TRF_HCR (27-28).
--  2. Código estándar TRF_MD debe ser TRF_MED (Excel usa "MED").
--  3. Código estándar TRF_HCR debe ser TRF_HC (Excel usa "HC").
--  4. No existían títulos grises (section headers) en la BD.
-- =============================================================================

BEGIN;

-- 1. Renombrar códigos de estándares para alinear con Excel
UPDATE evaluation_standards
SET code = 'TRF_MED'
WHERE code = 'TRF_MD'
  AND service_id = 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb';

UPDATE evaluation_standards
SET code = 'TRF_HC'
WHERE code = 'TRF_HCR'
  AND service_id = 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb';

-- 2. Renombrar códigos de criterios
UPDATE evaluation_criteria
SET code = REPLACE(code, 'TRF-MD-', 'TRF-MED-')
WHERE service_id = 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb'
  AND code LIKE 'TRF-MD-%';

UPDATE evaluation_criteria
SET code = REPLACE(code, 'TRF-HCR-', 'TRF-HC-')
WHERE service_id = 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb'
  AND code LIKE 'TRF-HCR-%';

-- 3. Eliminar los 9 criterios duplicados de questionnaire_criteria (primero, por FK)
DELETE FROM questionnaire_criteria
WHERE criterion_id IN (
  '835aea4e-f90a-462b-9f43-3bd9304b156d', -- TRF-DOT-006 (duplicado de TRF-MED-001)
  'ee126e87-1868-4e0e-abf5-6ad71b3bf693', -- TRF-DOT-007 (duplicado de TRF-MED-002)
  'de8b303e-9356-482f-8171-eb640aba7522', -- TRF-DOT-008 (duplicado de TRF-MED-003)
  '4847526b-f11b-4043-b5ed-58b079a9fe1a', -- TRF-DOT-009 (duplicado de TRF-MED-004)
  '90bd7849-cd74-4d78-990b-bfe155da1535', -- TRF-DOT-010 (duplicado de TRF-MED-005)
  '9d52913e-2801-49ff-b568-22356b71d515', -- TRF-DOT-011 (duplicado de TRF-MED-006)
  'a0cbdb08-fe2d-41dd-9dc0-914eb0d79c3d', -- TRF-DOT-012 (duplicado de TRF-MED-007)
  '0bbd5946-58b2-4d25-8227-2b30956026dd', -- TRF-DOT-013 (duplicado de TRF-HC-001)
  'ecc0e533-cbf9-4e9e-a0ee-db4621dc57f7'  -- TRF-DOT-014 (duplicado de TRF-HC-002)
);

-- 4. Eliminar los 9 criterios duplicados de evaluation_criteria
DELETE FROM evaluation_criteria
WHERE id IN (
  '835aea4e-f90a-462b-9f43-3bd9304b156d',
  'ee126e87-1868-4e0e-abf5-6ad71b3bf693',
  'de8b303e-9356-482f-8171-eb640aba7522',
  '4847526b-f11b-4043-b5ed-58b079a9fe1a',
  '90bd7849-cd74-4d78-990b-bfe155da1535',
  '9d52913e-2801-49ff-b568-22356b71d515',
  'a0cbdb08-fe2d-41dd-9dc0-914eb0d79c3d',
  '0bbd5946-58b2-4d25-8227-2b30956026dd',
  'ecc0e533-cbf9-4e9e-a0ee-db4621dc57f7'
);

-- 5. Crear títulos grises (section headers) en evaluation_criteria
-- Nombres de estándares por UUID:
--   TRF_TH:  e4b165c9-9376-4307-be38-081b82c7a1af
--   TRF_INF: c634c62a-b87d-47b4-b339-cf68a94872e5
--   TRF_DOT: 275a5b77-d7ec-44f9-9349-b5ddd714ee73
--   TRF_MED: 7309fbe1-3674-4356-8226-e256f8aebf2c
--   TRF_HC:  8f13c1f0-e0ee-4222-b5bc-771aad9baaa8
--   TRF_INT: f56c5036-d1a4-49e0-8a6c-fac29b21dc31

INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_section_header)
VALUES
  -- TH — Talento Humano
  ('TRF-TH-H01', '', 'Modalidad intramural y extramural unidad móvil, jornada de salud y domiciliaria',
   'Modalidad intramural y extramural unidad móvil, jornada de salud y domiciliaria',
   'e4b165c9-9376-4307-be38-081b82c7a1af', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true),

  ('TRF-TH-H02', '', 'Modalidad telemedicina / Categoría interactiva y no interactiva - prestador de referencia',
   'Modalidad telemedicina' || chr(10) || 'Categoría interactiva y no interactiva - prestador de referencia',
   'e4b165c9-9376-4307-be38-081b82c7a1af', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true),

  ('TRF-TH-H03', '', 'Categoría telexperticia - prestador remisor',
   'Categoría telexperticia - prestador remisor',
   'e4b165c9-9376-4307-be38-081b82c7a1af', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true),

  ('TRF-TH-H04', '', 'Categoría telexperticia - prestador de referencia',
   'Categoría telexperticia - prestador de referencia',
   'e4b165c9-9376-4307-be38-081b82c7a1af', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true),

  ('TRF-TH-H05', '', 'Categoría telemonitoreo - prestador de referencia',
   'Categoría telemonitoreo - prestador de referencia',
   'e4b165c9-9376-4307-be38-081b82c7a1af', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true),

  -- INF — Infraestructura (no tiene header antes del criterio 6; los headers aplican de criterio 10 en adelante)
  ('TRF-INF-H01', '', 'Modalidad Extramural: Unidad Móvil, Jornada de Salud y Domiciliaria',
   'Modalidad Extramural: Unidad Móvil, Jornada de Salud y Domiciliaria',
   'c634c62a-b87d-47b4-b339-cf68a94872e5', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true),

  ('TRF-INF-H02', '', 'Modalidad telemedicina - Categoría interactiva y no interactiva – prestador de referencia',
   'Modalidad telemedicina - Categoría interactiva y no interactiva – prestador de referencia',
   'c634c62a-b87d-47b4-b339-cf68a94872e5', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true),

  ('TRF-INF-H03', '', 'Categoría telexperticia - prestador remisor',
   'Categoría telexperticia - prestador remisor',
   'c634c62a-b87d-47b4-b339-cf68a94872e5', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true),

  ('TRF-INF-H04', '', 'Categoría telexperticia - prestador de referencia',
   'Categoría telexperticia - prestador de referencia',
   'c634c62a-b87d-47b4-b339-cf68a94872e5', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true),

  ('TRF-INF-H05', '', 'Categoría telemonitoreo - prestador de referencia',
   'Categoría telemonitoreo - prestador de referencia',
   'c634c62a-b87d-47b4-b339-cf68a94872e5', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true),

  -- DOT — Dotación
  ('TRF-DOT-H01', '', 'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria',
   'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria',
   '275a5b77-d7ec-44f9-9349-b5ddd714ee73', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true),

  ('TRF-DOT-H02', '', 'La dotación requerida para realizar los procedimientos de acuerdo con lo documentado en el estándar de procesos prioritarios.',
   'La dotación requerida para realizar los procedimientos de acuerdo con lo documentado en el estándar de procesos prioritarios.',
   '275a5b77-d7ec-44f9-9349-b5ddd714ee73', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true),

  ('TRF-DOT-H03', '', 'Modalidad telemedicina / Categoría interactiva y no interactiva – prestador de referencia',
   'Modalidad telemedicina' || chr(10) || 'Categoría interactiva y no interactiva – prestador de referencia',
   '275a5b77-d7ec-44f9-9349-b5ddd714ee73', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true),

  ('TRF-DOT-H04', '', 'Categoría telexperticia - prestador remisor',
   'Categoría telexperticia - prestador remisor',
   '275a5b77-d7ec-44f9-9349-b5ddd714ee73', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true),

  ('TRF-DOT-H05', '', 'Categoría telexperticia - prestador de referencia',
   'Categoría telexperticia - prestador de referencia',
   '275a5b77-d7ec-44f9-9349-b5ddd714ee73', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true),

  ('TRF-DOT-H06', '', 'Categoría telemonitoreo - prestador de referencia',
   'Categoría telemonitoreo - prestador de referencia',
   '275a5b77-d7ec-44f9-9349-b5ddd714ee73', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true),

  -- MED — Medicamentos, Dispositivos Médicos e Insumos (renombrado de TRF_MD)
  ('TRF-MED-H01', '', 'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria',
   'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria',
   '7309fbe1-3674-4356-8226-e256f8aebf2c', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true),

  ('TRF-MED-H02', '', 'Modalidad telemedicina / Categoría interactiva, no interactiva, telexperticia y telemonitoreo',
   'Modalidad telemedicina' || chr(10) || 'Categoría interactiva y no interactiva – prestador de referencia' || chr(10) || 'Categoría telexperticia - prestador remisor - prestador de referencia' || chr(10) || 'Categoría telemonitoreo - prestador de referencia',
   '7309fbe1-3674-4356-8226-e256f8aebf2c', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true),

  ('TRF-MED-H03', '', 'Modalidades intramural, extramural unidad móvil, jornada de salud, y domiciliaria',
   'Modalidades intramural, extramural unidad móvil, jornada de salud, y domiciliaria',
   '7309fbe1-3674-4356-8226-e256f8aebf2c', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true),

  ('TRF-MED-H04', '', 'Modalidad telemedicina',
   'Modalidad telemedicina',
   '7309fbe1-3674-4356-8226-e256f8aebf2c', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true),

  ('TRF-MED-H05', '', 'Categoría interactiva y no interactiva – prestador de referencia',
   'Categoría interactiva y no interactiva – prestador de referencia',
   '7309fbe1-3674-4356-8226-e256f8aebf2c', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true),

  ('TRF-MED-H06', '', 'Categoría telexperticia - prestador remisor',
   'Categoría telexperticia - prestador remisor',
   '7309fbe1-3674-4356-8226-e256f8aebf2c', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true),

  ('TRF-MED-H07', '', 'Categoría telexperticia - prestador de referencia',
   'Categoría telexperticia - prestador de referencia',
   '7309fbe1-3674-4356-8226-e256f8aebf2c', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true),

  ('TRF-MED-H08', '', 'Categoría telemonitoreo - prestador de referencia',
   'Categoría telemonitoreo - prestador de referencia',
   '7309fbe1-3674-4356-8226-e256f8aebf2c', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true),

  -- HC — Historia Clínica y Registros (renombrado de TRF_HCR)
  ('TRF-HC-H01', '', 'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria',
   'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria',
   '8f13c1f0-e0ee-4222-b5bc-771aad9baaa8', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true),

  ('TRF-HC-H02', '', 'Modalidad telemedicina / Categoría interactiva, no interactiva, telexperticia y telemonitoreo',
   'Modalidad telemedicina' || chr(10) || 'Categoría interactiva y no interactiva – prestador de referencia' || chr(10) || 'Categoría telexperticia - prestador remisor - prestador de referencia' || chr(10) || 'Categoría telemonitoreo - prestador de referencia',
   '8f13c1f0-e0ee-4222-b5bc-771aad9baaa8', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true),

  -- INT — Interdependencia de Servicios
  ('TRF-INT-H01', '', 'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria',
   'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria',
   'f56c5036-d1a4-49e0-8a6c-fac29b21dc31', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true),

  ('TRF-INT-H02', '', 'Modalidad telemedicina / Categoría interactiva, no interactiva, telexperticia y telemonitoreo',
   'Modalidad telemedicina' || chr(10) || 'Categoría interactiva y no interactiva – prestador de referencia' || chr(10) || 'Categoría telexperticia - prestador remisor - prestador de referencia' || chr(10) || 'Categoría telemonitoreo - prestador de referencia',
   'f56c5036-d1a4-49e0-8a6c-fac29b21dc31', 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb', true);

-- 6. Agregar todos los section headers al cuestionario TRF
INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
SELECT '73a46a4b-e389-4751-81f9-09e2cd507e3c', ec.id
FROM evaluation_criteria ec
WHERE ec.service_id = 'fd8ec1c7-c69d-43a9-869d-e525b9b75deb'
  AND ec.is_section_header = TRUE
ON CONFLICT DO NOTHING;

COMMIT;

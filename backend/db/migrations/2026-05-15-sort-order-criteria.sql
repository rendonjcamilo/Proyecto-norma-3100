-- Agrega sort_order a evaluation_criteria para garantizar el orden correcto
-- independientemente del ordenamiento alfanumérico del campo number.
-- Resuelve: "8.10" antes de "8.2" y divisores de modalidad fuera de posición.

ALTER TABLE evaluation_criteria
  ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- ── LPT — Laboratorio de Patología (68 registros) ────────────────────────────
-- Orden fiel a la hoja 11.3.16.S_LPT del Excel maestro de Resolución 3100-2019

UPDATE evaluation_criteria SET sort_order =  1 WHERE code = 'LPT-TH-001';
UPDATE evaluation_criteria SET sort_order =  2 WHERE code = 'LPT-TH-002';
UPDATE evaluation_criteria SET sort_order =  3 WHERE code = 'LPT-TH-003';
UPDATE evaluation_criteria SET sort_order =  4 WHERE code = 'LPT-TH-M01';  -- Modalidad telemedicina - prestador de referencia
UPDATE evaluation_criteria SET sort_order =  5 WHERE code = 'LPT-TH-004';
UPDATE evaluation_criteria SET sort_order =  6 WHERE code = 'LPT-TH-005';

UPDATE evaluation_criteria SET sort_order =  7 WHERE code = 'LPT-INF-M01'; -- Modalidades intramural y telemedicina - prestador remisor
UPDATE evaluation_criteria SET sort_order =  8 WHERE code = 'LPT-INF-001';
UPDATE evaluation_criteria SET sort_order =  9 WHERE code = 'LPT-INF-002';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'LPT-INF-003';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'LPT-INF-004';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'LPT-INF-005';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'LPT-INF-006';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'LPT-INF-007';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'LPT-INF-008';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'LPT-INF-009';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'LPT-INF-010';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'LPT-INF-011';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'LPT-INF-012';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'LPT-INF-013';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'LPT-INF-014';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'LPT-INF-015';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'LPT-INF-M02'; -- Modalidad telemedicina - prestador de referencia
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'LPT-INF-016';

UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'LPT-DOT-M01'; -- Modalidades intramural y telemedicina - prestador remisor
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'LPT-DOT-001';
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'LPT-DOT-002';
UPDATE evaluation_criteria SET sort_order = 28 WHERE code = 'LPT-DOT-003';
UPDATE evaluation_criteria SET sort_order = 29 WHERE code = 'LPT-DOT-004';
UPDATE evaluation_criteria SET sort_order = 30 WHERE code = 'LPT-DOT-005';
UPDATE evaluation_criteria SET sort_order = 31 WHERE code = 'LPT-DOT-006';
UPDATE evaluation_criteria SET sort_order = 32 WHERE code = 'LPT-DOT-007';
UPDATE evaluation_criteria SET sort_order = 33 WHERE code = 'LPT-DOT-008';
UPDATE evaluation_criteria SET sort_order = 34 WHERE code = 'LPT-DOT-009';
UPDATE evaluation_criteria SET sort_order = 35 WHERE code = 'LPT-DOT-010';
UPDATE evaluation_criteria SET sort_order = 36 WHERE code = 'LPT-DOT-011';
UPDATE evaluation_criteria SET sort_order = 37 WHERE code = 'LPT-DOT-012';
UPDATE evaluation_criteria SET sort_order = 38 WHERE code = 'LPT-DOT-013';
UPDATE evaluation_criteria SET sort_order = 39 WHERE code = 'LPT-DOT-014';
UPDATE evaluation_criteria SET sort_order = 40 WHERE code = 'LPT-DOT-M02'; -- Modalidad telemedicina - prestador de referencia
UPDATE evaluation_criteria SET sort_order = 41 WHERE code = 'LPT-DOT-015';

UPDATE evaluation_criteria SET sort_order = 42 WHERE code = 'LPT-MD-M01';  -- Modalidades intramural, telemedicina - prestador remisor - referencia
UPDATE evaluation_criteria SET sort_order = 43 WHERE code = 'LPT-MD-001';

UPDATE evaluation_criteria SET sort_order = 44 WHERE code = 'LPT-PP-001';
UPDATE evaluation_criteria SET sort_order = 45 WHERE code = 'LPT-PP-002';
UPDATE evaluation_criteria SET sort_order = 46 WHERE code = 'LPT-PP-003';
UPDATE evaluation_criteria SET sort_order = 47 WHERE code = 'LPT-PP-004';
UPDATE evaluation_criteria SET sort_order = 48 WHERE code = 'LPT-PP-005';
UPDATE evaluation_criteria SET sort_order = 49 WHERE code = 'LPT-PP-006';
UPDATE evaluation_criteria SET sort_order = 50 WHERE code = 'LPT-PP-007';
UPDATE evaluation_criteria SET sort_order = 51 WHERE code = 'LPT-PP-M01'; -- Modalidad telemedicina - prestador de referencia
UPDATE evaluation_criteria SET sort_order = 52 WHERE code = 'LPT-PP-008';

UPDATE evaluation_criteria SET sort_order = 53 WHERE code = 'LPT-HCR-S01'; -- Estándar de historia clínica y registros
UPDATE evaluation_criteria SET sort_order = 54 WHERE code = 'LPT-HCR-M01'; -- Modalidades intramural y telemedicina - prestador remisor
UPDATE evaluation_criteria SET sort_order = 55 WHERE code = 'LPT-HCR-001';
UPDATE evaluation_criteria SET sort_order = 56 WHERE code = 'LPT-HCR-002';
UPDATE evaluation_criteria SET sort_order = 57 WHERE code = 'LPT-HCR-003';
UPDATE evaluation_criteria SET sort_order = 58 WHERE code = 'LPT-HCR-004';
UPDATE evaluation_criteria SET sort_order = 59 WHERE code = 'LPT-HCR-005';
UPDATE evaluation_criteria SET sort_order = 60 WHERE code = 'LPT-HCR-006';
UPDATE evaluation_criteria SET sort_order = 61 WHERE code = 'LPT-HCR-007';
UPDATE evaluation_criteria SET sort_order = 62 WHERE code = 'LPT-HCR-M02'; -- Modalidad telemedicina - prestador de referencia
UPDATE evaluation_criteria SET sort_order = 63 WHERE code = 'LPT-HCR-008';

UPDATE evaluation_criteria SET sort_order = 64 WHERE code = 'LPT-INT-S01'; -- Estándar de interdependencia
UPDATE evaluation_criteria SET sort_order = 65 WHERE code = 'LPT-INT-M01'; -- Modalidades intramural
UPDATE evaluation_criteria SET sort_order = 66 WHERE code = 'LPT-INT-001';
UPDATE evaluation_criteria SET sort_order = 67 WHERE code = 'LPT-INT-M02'; -- Modalidad telemedicina - prestador remisor - prestador de referencia
UPDATE evaluation_criteria SET sort_order = 68 WHERE code = 'LPT-INT-002';

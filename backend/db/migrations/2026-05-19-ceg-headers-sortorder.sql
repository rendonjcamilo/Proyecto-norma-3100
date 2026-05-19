-- ================================================================
-- CEG (Consulta Externa General): insertar headers + sort_order
-- Fuente Excel: hoja 11.2.1.S_CE_G
-- ================================================================

-- 1. Limpiar section headers previos de CEG
DELETE FROM questionnaire_criteria WHERE criterion_id IN (
  SELECT ec.id FROM evaluation_criteria ec JOIN services s ON s.id = ec.service_id
  WHERE s.code = 'CEG' AND ec.is_section_header = true);

DELETE FROM evaluation_criteria
WHERE service_id = (SELECT id FROM services WHERE code = 'CEG') AND is_section_header = true;

-- 2. Insertar section headers
INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT v.code, '', v.name, v.name, es.id, s.id, true, 'active', true
FROM (VALUES
  ('CEG_TH', 'CEG-TH-H01', 'Complejidad baja'),
  ('CEG_TH', 'CEG-TH-H02', 'Modalidad intramural, extramural unidad móvil, jornada de salud y domiciliaria'),
  ('CEG_TH', 'CEG-TH-H03', 'Modalidad telemedicina'),
  ('CEG_TH', 'CEG-TH-H04', 'Categoría interactiva y no interactiva-prestador de referencia'),
  ('CEG_TH', 'CEG-TH-H05', 'Categoria telexperticia- prestador de remisor'),
  ('CEG_TH', 'CEG-TH-H06', 'Categoria telexperticia-prestador de referencia'),
  ('CEG_TH', 'CEG-TH-H07', 'Categoría telemonitoreo-prestador de referencia'),
  ('CEG_INF', 'CEG-INF-H01', 'Complejidad baja'),
  ('CEG_INF', 'CEG-INF-H02', 'Modalidad intramural'),
  ('CEG_INF', 'CEG-INF-H03', 'Modalidad Extramural: Unidad móvil, Jornada de Salud y Domiciliaria'),
  ('CEG_INF', 'CEG-INF-H04', 'Modalidad telemedicina'),
  ('CEG_INF', 'CEG-INF-H05', 'Categoría interactiva y no interactiva-prestador de referencia'),
  ('CEG_INF', 'CEG-INF-H06', 'Categoría telexpeticia-prestador remisor'),
  ('CEG_INF', 'CEG-INF-H07', 'Categoría telexperticia-prestador de referencia'),
  ('CEG_INF', 'CEG-INF-H08', 'Categoría telemonitoreo-prestador de referencia'),
  ('CEG_DOT', 'CEG-DOT-H01', 'Complejidad baja'),
  ('CEG_DOT', 'CEG-DOT-H02', 'Modalidad intramural'),
  ('CEG_DOT', 'CEG-DOT-H03', 'Modalidad extramural unidad móvil, jornada de salud y domiciliaria.'),
  ('CEG_DOT', 'CEG-DOT-H04', 'Modalidad telemedicina'),
  ('CEG_DOT', 'CEG-DOT-H05', 'Categoría interactiva y no interactiva-prestador de referencia'),
  ('CEG_DOT', 'CEG-DOT-H06', 'Categoría telexperticia-prestador remisor'),
  ('CEG_DOT', 'CEG-DOT-H07', 'Categoría telexperticia-prestador referencia'),
  ('CEG_DOT', 'CEG-DOT-H08', 'Categoría telemonitoreo-prestador de referencia'),
  ('CEG_MD', 'CEG-MD-H01', 'Complejidad baja'),
  ('CEG_MD', 'CEG-MD-H02', 'Modalidad intramural, extramural unidad movil, jornada de salud y domiciliaria'),
  ('CEG_MD', 'CEG-MD-H03', 'Modalidad telemedicina'),
  ('CEG_MD', 'CEG-MD-H04', 'Categoría interactiva y no interactiva-prestador de referencia'),
  ('CEG_MD', 'CEG-MD-H05', 'Categoría telexperticia-prestador remisor-prestador referencia'),
  ('CEG_MD', 'CEG-MD-H06', 'Categoría telemonitoreo-prestador de referencia'),
  ('CEG_PP', 'CEG-PP-H01', 'Complejidad baja'),
  ('CEG_PP', 'CEG-PP-H02', 'Modalidades intramural, extramural, unidad móvil, jornada de salud y domiciliaria'),
  ('CEG_PP', 'CEG-PP-H03', 'Modalidad telemedicina'),
  ('CEG_PP', 'CEG-PP-H04', 'Categoria interactiva y no interactiva-prestador de referencia'),
  ('CEG_PP', 'CEG-PP-H05', 'Categoría telexperticia-prestador remisor'),
  ('CEG_PP', 'CEG-PP-H06', 'Categoría telexperticia-prestador de referencia'),
  ('CEG_PP', 'CEG-PP-H07', 'Categoría telemonitoreo-prestador de referencia'),
  ('CEG_HCR', 'CEG-HCR-H01', 'Complejidad baja'),
  ('CEG_HCR', 'CEG-HCR-H02', 'Modalidades intramural, extramural unidad movil, jornada de salud y domiciliaria'),
  ('CEG_HCR', 'CEG-HCR-H03', 'Modalidad telemedicina'),
  ('CEG_HCR', 'CEG-HCR-H04', 'Categoría interactiva y no interactiva-prestador de referencia'),
  ('CEG_HCR', 'CEG-HCR-H05', 'Categoría telexperticia-prestador remisor-prestador referencia'),
  ('CEG_HCR', 'CEG-HCR-H06', 'Categoría telemonitoreo-prestador de referencia'),
  ('CEG_INT', 'CEG-INT-H01', 'Complejidad baja'),
  ('CEG_INT', 'CEG-INT-H02', 'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria'),
  ('CEG_INT', 'CEG-INT-H03', 'Modalidad telemedicina'),
  ('CEG_INT', 'CEG-INT-H04', 'Categoría interactiva y no interactiva-prestador de referencia'),
  ('CEG_INT', 'CEG-INT-H05', 'Categoría telexperticia-prestador remisor-prestador referencia'),
  ('CEG_INT', 'CEG-INT-H06', 'Categoría telemonitoreo-prestador de referencia')
) AS v(std_code, code, name)
JOIN evaluation_standards es ON es.code = v.std_code
JOIN services s ON s.id = es.service_id AND s.code = 'CEG'
ON CONFLICT (code, service_id) DO NOTHING;

-- 3. Agregar headers al cuestionario CEG
INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
SELECT q.id, ec.id FROM questionnaires q
JOIN services s ON s.id = q.service_id
JOIN evaluation_criteria ec ON ec.service_id = s.id
WHERE s.code = 'CEG' AND q.version_type = 'initial'
  AND ec.is_section_header = true AND ec.code LIKE 'CEG-%-H%'
ON CONFLICT DO NOTHING;

-- 4. sort_order para criterios
UPDATE evaluation_criteria SET sort_order = 3 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_TH' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '1';
UPDATE evaluation_criteria SET sort_order = 4 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_TH' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '2';
UPDATE evaluation_criteria SET sort_order = 5 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_TH' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '3';
UPDATE evaluation_criteria SET sort_order = 6 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_TH' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '3.1';
UPDATE evaluation_criteria SET sort_order = 7 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_TH' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '3.2';
UPDATE evaluation_criteria SET sort_order = 10 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_TH' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '4';
UPDATE evaluation_criteria SET sort_order = 11 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_TH' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '4.1';
UPDATE evaluation_criteria SET sort_order = 13 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_TH' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '5';
UPDATE evaluation_criteria SET sort_order = 14 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_TH' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '5.1';
UPDATE evaluation_criteria SET sort_order = 15 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_TH' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '5.2';
UPDATE evaluation_criteria SET sort_order = 17 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_TH' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '6';
UPDATE evaluation_criteria SET sort_order = 19 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_TH' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '7';
UPDATE evaluation_criteria SET sort_order = 3 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '8';
UPDATE evaluation_criteria SET sort_order = 4 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '9';
UPDATE evaluation_criteria SET sort_order = 5 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '9.1';
UPDATE evaluation_criteria SET sort_order = 6 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '9.1.1';
UPDATE evaluation_criteria SET sort_order = 7 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '9.1.2';
UPDATE evaluation_criteria SET sort_order = 8 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '9.1.3';
UPDATE evaluation_criteria SET sort_order = 9 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '9.1.4';
UPDATE evaluation_criteria SET sort_order = 10 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '9.2';
UPDATE evaluation_criteria SET sort_order = 11 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '10';
UPDATE evaluation_criteria SET sort_order = 12 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '10.1';
UPDATE evaluation_criteria SET sort_order = 13 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '10.2';
UPDATE evaluation_criteria SET sort_order = 14 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '10.3';
UPDATE evaluation_criteria SET sort_order = 15 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '11';
UPDATE evaluation_criteria SET sort_order = 16 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '11.1';
UPDATE evaluation_criteria SET sort_order = 17 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '11.2';
UPDATE evaluation_criteria SET sort_order = 18 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '11.3';
UPDATE evaluation_criteria SET sort_order = 19 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '11.4';
UPDATE evaluation_criteria SET sort_order = 20 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '12';
UPDATE evaluation_criteria SET sort_order = 21 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '13';
UPDATE evaluation_criteria SET sort_order = 23 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '14';
UPDATE evaluation_criteria SET sort_order = 26 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '15';
UPDATE evaluation_criteria SET sort_order = 28 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '16';
UPDATE evaluation_criteria SET sort_order = 30 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '17';
UPDATE evaluation_criteria SET sort_order = 32 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '18';
UPDATE evaluation_criteria SET sort_order = 3 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '19';
UPDATE evaluation_criteria SET sort_order = 4 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '19.1';
UPDATE evaluation_criteria SET sort_order = 5 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '19.2';
UPDATE evaluation_criteria SET sort_order = 6 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '19.3';
UPDATE evaluation_criteria SET sort_order = 7 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '19.4';
UPDATE evaluation_criteria SET sort_order = 8 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '19.5';
UPDATE evaluation_criteria SET sort_order = 9 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '19.6';
UPDATE evaluation_criteria SET sort_order = 10 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '19.7';
UPDATE evaluation_criteria SET sort_order = 11 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '19.8';
UPDATE evaluation_criteria SET sort_order = 13 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '19.10';
UPDATE evaluation_criteria SET sort_order = 14 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '19.11';
UPDATE evaluation_criteria SET sort_order = 15 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '20';
UPDATE evaluation_criteria SET sort_order = 16 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '21';
UPDATE evaluation_criteria SET sort_order = 17 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '22';
UPDATE evaluation_criteria SET sort_order = 18 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '22.1';
UPDATE evaluation_criteria SET sort_order = 19 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '22.2';
UPDATE evaluation_criteria SET sort_order = 20 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '23';
UPDATE evaluation_criteria SET sort_order = 21 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '23.1';
UPDATE evaluation_criteria SET sort_order = 22 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '23.2';
UPDATE evaluation_criteria SET sort_order = 23 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '23.3';
UPDATE evaluation_criteria SET sort_order = 24 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '23.4';
UPDATE evaluation_criteria SET sort_order = 25 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '23.5';
UPDATE evaluation_criteria SET sort_order = 26 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '23.6';
UPDATE evaluation_criteria SET sort_order = 27 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '23.7';
UPDATE evaluation_criteria SET sort_order = 29 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '24';
UPDATE evaluation_criteria SET sort_order = 30 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '24.1';
UPDATE evaluation_criteria SET sort_order = 31 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '24.2';
UPDATE evaluation_criteria SET sort_order = 32 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '24.3';
UPDATE evaluation_criteria SET sort_order = 33 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '24.4';
UPDATE evaluation_criteria SET sort_order = 34 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '24.5';
UPDATE evaluation_criteria SET sort_order = 35 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '24.6';
UPDATE evaluation_criteria SET sort_order = 36 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '24.7';
UPDATE evaluation_criteria SET sort_order = 37 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '24.8';
UPDATE evaluation_criteria SET sort_order = 38 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '24.9';
UPDATE evaluation_criteria SET sort_order = 39 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '25';
UPDATE evaluation_criteria SET sort_order = 40 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '26';
UPDATE evaluation_criteria SET sort_order = 41 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '26.1';
UPDATE evaluation_criteria SET sort_order = 42 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '26.2';
UPDATE evaluation_criteria SET sort_order = 43 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '26.3';
UPDATE evaluation_criteria SET sort_order = 44 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '26.4';
UPDATE evaluation_criteria SET sort_order = 45 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '26.5';
UPDATE evaluation_criteria SET sort_order = 46 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '26.6';
UPDATE evaluation_criteria SET sort_order = 47 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '27';
UPDATE evaluation_criteria SET sort_order = 50 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '28';
UPDATE evaluation_criteria SET sort_order = 52 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '29';
UPDATE evaluation_criteria SET sort_order = 54 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '30';
UPDATE evaluation_criteria SET sort_order = 56 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '31';
UPDATE evaluation_criteria SET sort_order = 3 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_MD' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '32';
UPDATE evaluation_criteria SET sort_order = 4 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_MD' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '33';
UPDATE evaluation_criteria SET sort_order = 9 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_MD' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '34';
UPDATE evaluation_criteria SET sort_order = 3 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_PP' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '35';
UPDATE evaluation_criteria SET sort_order = 4 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_PP' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '35.1';
UPDATE evaluation_criteria SET sort_order = 5 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_PP' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '35.2';
UPDATE evaluation_criteria SET sort_order = 6 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_PP' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '35.2.1';
UPDATE evaluation_criteria SET sort_order = 7 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_PP' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '35.2.2';
UPDATE evaluation_criteria SET sort_order = 8 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_PP' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '35.2.3';
UPDATE evaluation_criteria SET sort_order = 9 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_PP' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '35.2.4';
UPDATE evaluation_criteria SET sort_order = 10 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_PP' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '36';
UPDATE evaluation_criteria SET sort_order = 11 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_PP' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '36.1';
UPDATE evaluation_criteria SET sort_order = 12 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_PP' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '36.2';
UPDATE evaluation_criteria SET sort_order = 13 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_PP' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '36.3';
UPDATE evaluation_criteria SET sort_order = 16 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_PP' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '37';
UPDATE evaluation_criteria SET sort_order = 18 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_PP' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '38';
UPDATE evaluation_criteria SET sort_order = 20 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_PP' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '39';
UPDATE evaluation_criteria SET sort_order = 22 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_PP' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '40';
UPDATE evaluation_criteria SET sort_order = 3 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_HCR' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '41';
UPDATE evaluation_criteria SET sort_order = 8 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_HCR' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '42';
UPDATE evaluation_criteria SET sort_order = 3 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_INT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '43';
UPDATE evaluation_criteria SET sort_order = 8 WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEG_INT' AND service_id = (SELECT id FROM services WHERE code = 'CEG')) AND number = '44';

-- 5. sort_order para headers
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CEG-TH-H01' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CEG-TH-H02' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 8 WHERE code = 'CEG-TH-H03' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 9 WHERE code = 'CEG-TH-H04' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CEG-TH-H05' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'CEG-TH-H06' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'CEG-TH-H07' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CEG-INF-H01' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CEG-INF-H02' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'CEG-INF-H03' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'CEG-INF-H04' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'CEG-INF-H05' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'CEG-INF-H06' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 29 WHERE code = 'CEG-INF-H07' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 31 WHERE code = 'CEG-INF-H08' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CEG-DOT-H01' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CEG-DOT-H02' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 28 WHERE code = 'CEG-DOT-H03' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 48 WHERE code = 'CEG-DOT-H04' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 49 WHERE code = 'CEG-DOT-H05' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 51 WHERE code = 'CEG-DOT-H06' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 53 WHERE code = 'CEG-DOT-H07' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 55 WHERE code = 'CEG-DOT-H08' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CEG-MD-H01' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CEG-MD-H02' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 5 WHERE code = 'CEG-MD-H03' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 6 WHERE code = 'CEG-MD-H04' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 7 WHERE code = 'CEG-MD-H05' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 8 WHERE code = 'CEG-MD-H06' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CEG-PP-H01' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CEG-PP-H02' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CEG-PP-H03' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CEG-PP-H04' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'CEG-PP-H05' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'CEG-PP-H06' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'CEG-PP-H07' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CEG-HCR-H01' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CEG-HCR-H02' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 4 WHERE code = 'CEG-HCR-H03' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 5 WHERE code = 'CEG-HCR-H04' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 6 WHERE code = 'CEG-HCR-H05' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 7 WHERE code = 'CEG-HCR-H06' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CEG-INT-H01' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CEG-INT-H02' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 4 WHERE code = 'CEG-INT-H03' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 5 WHERE code = 'CEG-INT-H04' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 6 WHERE code = 'CEG-INT-H05' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
UPDATE evaluation_criteria SET sort_order = 7 WHERE code = 'CEG-INT-H06' AND service_id = (SELECT id FROM services WHERE code = 'CEG');
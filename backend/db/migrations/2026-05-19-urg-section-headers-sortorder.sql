-- ============================================================
-- URG (Urgencias): insertar section headers + sort_order
-- Fuente Excel: hoja 11.6.1.S_UR
-- ============================================================

-- 1. Limpiar section headers previos de URG
DELETE FROM questionnaire_criteria
WHERE criterion_id IN (
  SELECT ec.id FROM evaluation_criteria ec
  JOIN services s ON s.id = ec.service_id
  WHERE s.code = 'URG' AND ec.is_section_header = true
);

DELETE FROM evaluation_criteria
WHERE service_id = (SELECT id FROM services WHERE code = 'URG')
  AND is_section_header = true;

-- 2. Insertar section headers
INSERT INTO evaluation_criteria
  (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT v.code, '', v.name, v.name, es.id, s.id, true, 'active', true
FROM (VALUES
  ('URG_TH', 'URG-TH-H01', 'Complejidad baja'),
  ('URG_TH', 'URG-TH-H02', 'Modalidades Intramural, telemedicina - prestador remisor.'),
  ('URG_TH', 'URG-TH-H03', 'Modalidad telemedicina - prestador de referencia'),
  ('URG_TH', 'URG-TH-H04', 'Complejidad media'),
  ('URG_TH', 'URG-TH-H05', 'Modalidades Intramural, telemedicina - prestador remisor.'),
  ('URG_TH', 'URG-TH-H06', 'Modalidad telemedicina - prestador de referencia'),
  ('URG_TH', 'URG-TH-H07', 'Complejidad Alta'),
  ('URG_TH', 'URG-TH-H08', 'Modalidades Intramural, telemedicina - prestador remisor.'),
  ('URG_TH', 'URG-TH-H09', 'Modalidad telemedicina - prestador de referencia'),
  ('URG_INF', 'URG-INF-H01', 'Complejidades baja, mediana y alta'),
  ('URG_INF', 'URG-INF-H02', 'Modalidades Intramural, telemedicina - prestador remisor.'),
  ('URG_INF', 'URG-INF-H03', 'Complejidad baja'),
  ('URG_INF', 'URG-INF-H04', 'Modalidades Intramural, telemedicina - prestador remisor.'),
  ('URG_INF', 'URG-INF-H05', 'Modalidad telemedicina - prestador de referencia'),
  ('URG_INF', 'URG-INF-H06', 'Complejidad mediana y alta'),
  ('URG_INF', 'URG-INF-H07', 'Modalidades Intramural, telemedicina - prestador remisor.'),
  ('URG_INF', 'URG-INF-H08', 'Modalidad telemedicina - prestador de referencia'),
  ('URG_DOT', 'URG-DOT-H01', 'Complejidad Baja'),
  ('URG_DOT', 'URG-DOT-H02', 'Modalidades Intramural, telemedicina - prestador remisor.'),
  ('URG_DOT', 'URG-DOT-H03', 'Complejidad media y alta'),
  ('URG_MD', 'URG-MD-H01', 'Modalidades intramural y telemedicina - prestador remisor'),
  ('URG_MD', 'URG-MD-H02', 'Modalidad telemedicina - prestador de referencia'),
  ('URG_MD', 'URG-MD-H03', 'Complejidades baja, mediana y alta'),
  ('URG_MD', 'URG-MD-H04', 'Modalidades intramural y telemedicina - prestador remisor'),
  ('URG_PP', 'URG-PP-H01', 'Complejidades baja, mediana y alta'),
  ('URG_PP', 'URG-PP-H02', 'Modalidades intramural y telemedicina - prestador remisor'),
  ('URG_HCR', 'URG-HCR-H01', 'Complejidades baja, mediana y alta'),
  ('URG_HCR', 'URG-HCR-H02', 'Modalidades intramural y telemedicina: prestador remisor - prestador referencia'),
  ('URG_INT', 'URG-INT-H01', 'Complejidad baja'),
  ('URG_INT', 'URG-INT-H02', 'Modalidades intramural'),
  ('URG_INT', 'URG-INT-H03', 'Modalidad telemedicina- prestador remisor - prestador referencia'),
  ('URG_INT', 'URG-INT-H04', 'Complejidad mediana'),
  ('URG_INT', 'URG-INT-H05', 'Modalidades intramural'),
  ('URG_INT', 'URG-INT-H06', 'Complejidad alta'),
  ('URG_INT', 'URG-INT-H07', 'Modalidades intramural'),
  ('URG_INT', 'URG-INT-H08', 'Modalidad telemedicina- prestador remisor- prestador referencia')
) AS v(std_code, code, name)
JOIN evaluation_standards es ON es.code = v.std_code
JOIN services s ON s.id = es.service_id AND s.code = 'URG'
ON CONFLICT (code, service_id) DO NOTHING;

-- 3. Agregar headers al cuestionario URG
INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
SELECT q.id, ec.id
FROM questionnaires q
JOIN services s ON s.id = q.service_id
JOIN evaluation_criteria ec ON ec.service_id = s.id
WHERE s.code = 'URG'
  AND q.version_type = 'initial'
  AND ec.is_section_header = true
  AND ec.code LIKE 'URG-%-H%'
ON CONFLICT DO NOTHING;

-- 4. sort_order para criterios existentes
UPDATE evaluation_criteria SET sort_order = 3
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_TH' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '1';
UPDATE evaluation_criteria SET sort_order = 4
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_TH' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '1.1';
UPDATE evaluation_criteria SET sort_order = 5
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_TH' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '1.2';
UPDATE evaluation_criteria SET sort_order = 6
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_TH' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '2';
UPDATE evaluation_criteria SET sort_order = 7
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_TH' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '2.1';
UPDATE evaluation_criteria SET sort_order = 8
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_TH' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '2.2';
UPDATE evaluation_criteria SET sort_order = 10
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_TH' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '3';
UPDATE evaluation_criteria SET sort_order = 11
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_TH' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '4';
UPDATE evaluation_criteria SET sort_order = 14
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_TH' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '5';
UPDATE evaluation_criteria SET sort_order = 15
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_TH' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '5.1';
UPDATE evaluation_criteria SET sort_order = 16
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_TH' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '5.2';
UPDATE evaluation_criteria SET sort_order = 17
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_TH' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '5.3';
UPDATE evaluation_criteria SET sort_order = 18
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_TH' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '6';
UPDATE evaluation_criteria SET sort_order = 19
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_TH' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '6.1';
UPDATE evaluation_criteria SET sort_order = 20
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_TH' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '6.2';
UPDATE evaluation_criteria SET sort_order = 21
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_TH' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '7';
UPDATE evaluation_criteria SET sort_order = 23
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_TH' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '8';
UPDATE evaluation_criteria SET sort_order = 24
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_TH' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '9';
UPDATE evaluation_criteria SET sort_order = 25
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_TH' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '10';
UPDATE evaluation_criteria SET sort_order = 28
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_TH' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '11';
UPDATE evaluation_criteria SET sort_order = 29
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_TH' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '11.1';
UPDATE evaluation_criteria SET sort_order = 30
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_TH' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '11.2';
UPDATE evaluation_criteria SET sort_order = 31
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_TH' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '11.3';
UPDATE evaluation_criteria SET sort_order = 32
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_TH' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '11.4';
UPDATE evaluation_criteria SET sort_order = 33
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_TH' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '12';
UPDATE evaluation_criteria SET sort_order = 35
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_TH' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '13';
UPDATE evaluation_criteria SET sort_order = 37
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_TH' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '14';
UPDATE evaluation_criteria SET sort_order = 3
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '15';
UPDATE evaluation_criteria SET sort_order = 4
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '16';
UPDATE evaluation_criteria SET sort_order = 5
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '16.1';
UPDATE evaluation_criteria SET sort_order = 6
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '16.2';
UPDATE evaluation_criteria SET sort_order = 7
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '16.3';
UPDATE evaluation_criteria SET sort_order = 8
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '17';
UPDATE evaluation_criteria SET sort_order = 11
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18';
UPDATE evaluation_criteria SET sort_order = 12
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.1';
UPDATE evaluation_criteria SET sort_order = 13
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.2';
UPDATE evaluation_criteria SET sort_order = 14
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.3';
UPDATE evaluation_criteria SET sort_order = 15
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.4';
UPDATE evaluation_criteria SET sort_order = 16
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.5';
UPDATE evaluation_criteria SET sort_order = 17
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.6';
UPDATE evaluation_criteria SET sort_order = 18
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.7';
UPDATE evaluation_criteria SET sort_order = 19
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.8';
UPDATE evaluation_criteria SET sort_order = 20
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.9';
UPDATE evaluation_criteria SET sort_order = 21
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.10';
UPDATE evaluation_criteria SET sort_order = 22
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.11';
UPDATE evaluation_criteria SET sort_order = 23
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.12';
UPDATE evaluation_criteria SET sort_order = 24
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.13';
UPDATE evaluation_criteria SET sort_order = 25
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.14';
UPDATE evaluation_criteria SET sort_order = 26
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.14.1';
UPDATE evaluation_criteria SET sort_order = 27
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.14.2';
UPDATE evaluation_criteria SET sort_order = 28
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.15';
UPDATE evaluation_criteria SET sort_order = 29
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.15.1';
UPDATE evaluation_criteria SET sort_order = 30
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.15.2';
UPDATE evaluation_criteria SET sort_order = 31
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.15.3';
UPDATE evaluation_criteria SET sort_order = 32
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.15.4';
UPDATE evaluation_criteria SET sort_order = 33
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.16';
UPDATE evaluation_criteria SET sort_order = 34
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.16.1';
UPDATE evaluation_criteria SET sort_order = 35
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.16.2';
UPDATE evaluation_criteria SET sort_order = 36
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.16.3';
UPDATE evaluation_criteria SET sort_order = 37
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.16.4';
UPDATE evaluation_criteria SET sort_order = 38
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.17';
UPDATE evaluation_criteria SET sort_order = 39
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.17.1';
UPDATE evaluation_criteria SET sort_order = 40
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.17.2';
UPDATE evaluation_criteria SET sort_order = 41
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '18.18';
UPDATE evaluation_criteria SET sort_order = 43
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '19';
UPDATE evaluation_criteria SET sort_order = 46
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '20';
UPDATE evaluation_criteria SET sort_order = 48
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INF' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '21';
UPDATE evaluation_criteria SET sort_order = 3
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '22';
UPDATE evaluation_criteria SET sort_order = 4
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '22.1';
UPDATE evaluation_criteria SET sort_order = 5
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '22.2';
UPDATE evaluation_criteria SET sort_order = 6
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '22.3';
UPDATE evaluation_criteria SET sort_order = 7
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '22.4';
UPDATE evaluation_criteria SET sort_order = 8
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '22.5';
UPDATE evaluation_criteria SET sort_order = 9
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '22.6';
UPDATE evaluation_criteria SET sort_order = 10
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '22.6.1';
UPDATE evaluation_criteria SET sort_order = 11
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '22.6.2';
UPDATE evaluation_criteria SET sort_order = 12
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '22.6.3';
UPDATE evaluation_criteria SET sort_order = 13
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '22.6.4';
UPDATE evaluation_criteria SET sort_order = 14
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '22.6.5';
UPDATE evaluation_criteria SET sort_order = 15
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '22.7';
UPDATE evaluation_criteria SET sort_order = 16
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '22.8';
UPDATE evaluation_criteria SET sort_order = 17
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '22.9';
UPDATE evaluation_criteria SET sort_order = 18
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '22.10';
UPDATE evaluation_criteria SET sort_order = 19
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '22.11';
UPDATE evaluation_criteria SET sort_order = 20
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '23';
UPDATE evaluation_criteria SET sort_order = 21
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '23.1';
UPDATE evaluation_criteria SET sort_order = 22
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '23.2';
UPDATE evaluation_criteria SET sort_order = 23
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '23.3';
UPDATE evaluation_criteria SET sort_order = 24
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '23.4';
UPDATE evaluation_criteria SET sort_order = 25
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '23.5';
UPDATE evaluation_criteria SET sort_order = 26
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '23.6';
UPDATE evaluation_criteria SET sort_order = 27
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '23.7';
UPDATE evaluation_criteria SET sort_order = 28
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '23.8';
UPDATE evaluation_criteria SET sort_order = 29
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '23.9';
UPDATE evaluation_criteria SET sort_order = 30
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '24';
UPDATE evaluation_criteria SET sort_order = 31
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '24.1';
UPDATE evaluation_criteria SET sort_order = 32
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '24.2';
UPDATE evaluation_criteria SET sort_order = 33
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '24.3';
UPDATE evaluation_criteria SET sort_order = 34
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '24.4';
UPDATE evaluation_criteria SET sort_order = 35
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '24.5';
UPDATE evaluation_criteria SET sort_order = 36
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '24.6';
UPDATE evaluation_criteria SET sort_order = 37
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '25';
UPDATE evaluation_criteria SET sort_order = 38
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '25.1';
UPDATE evaluation_criteria SET sort_order = 39
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '25.2';
UPDATE evaluation_criteria SET sort_order = 40
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '26';
UPDATE evaluation_criteria SET sort_order = 41
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '26.1';
UPDATE evaluation_criteria SET sort_order = 42
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '26.2';
UPDATE evaluation_criteria SET sort_order = 43
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '26.3';
UPDATE evaluation_criteria SET sort_order = 44
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '26.4';
UPDATE evaluation_criteria SET sort_order = 45
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '27';
UPDATE evaluation_criteria SET sort_order = 46
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '27.1';
UPDATE evaluation_criteria SET sort_order = 47
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '28';
UPDATE evaluation_criteria SET sort_order = 48
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '28.1';
UPDATE evaluation_criteria SET sort_order = 49
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '28.2';
UPDATE evaluation_criteria SET sort_order = 50
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '28.3';
UPDATE evaluation_criteria SET sort_order = 51
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '28.4';
UPDATE evaluation_criteria SET sort_order = 52
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '28.4.1';
UPDATE evaluation_criteria SET sort_order = 53
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '28.4.2';
UPDATE evaluation_criteria SET sort_order = 54
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '28.4.3';
UPDATE evaluation_criteria SET sort_order = 55
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '28.4.4';
UPDATE evaluation_criteria SET sort_order = 56
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '28.5';
UPDATE evaluation_criteria SET sort_order = 57
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '28.6';
UPDATE evaluation_criteria SET sort_order = 58
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '28.7';
UPDATE evaluation_criteria SET sort_order = 59
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '29';
UPDATE evaluation_criteria SET sort_order = 60
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '30';
UPDATE evaluation_criteria SET sort_order = 63
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_DOT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '31';
UPDATE evaluation_criteria SET sort_order = 2
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_MD' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '32';
UPDATE evaluation_criteria SET sort_order = 4
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_MD' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '33';
UPDATE evaluation_criteria SET sort_order = 7
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_MD' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '34';
UPDATE evaluation_criteria SET sort_order = 8
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_MD' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '34.1';
UPDATE evaluation_criteria SET sort_order = 9
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_MD' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '34.2';
UPDATE evaluation_criteria SET sort_order = 11
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_MD' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '35';
UPDATE evaluation_criteria SET sort_order = 3
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36';
UPDATE evaluation_criteria SET sort_order = 4
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.1';
UPDATE evaluation_criteria SET sort_order = 5
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.2';
UPDATE evaluation_criteria SET sort_order = 6
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.3';
UPDATE evaluation_criteria SET sort_order = 7
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.4';
UPDATE evaluation_criteria SET sort_order = 8
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.5';
UPDATE evaluation_criteria SET sort_order = 9
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.6';
UPDATE evaluation_criteria SET sort_order = 10
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.7';
UPDATE evaluation_criteria SET sort_order = 11
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.8';
UPDATE evaluation_criteria SET sort_order = 12
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.9';
UPDATE evaluation_criteria SET sort_order = 13
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.10';
UPDATE evaluation_criteria SET sort_order = 14
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.11';
UPDATE evaluation_criteria SET sort_order = 15
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.12';
UPDATE evaluation_criteria SET sort_order = 16
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.13';
UPDATE evaluation_criteria SET sort_order = 17
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.14';
UPDATE evaluation_criteria SET sort_order = 18
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.15';
UPDATE evaluation_criteria SET sort_order = 19
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.16';
UPDATE evaluation_criteria SET sort_order = 20
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.17';
UPDATE evaluation_criteria SET sort_order = 21
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.18';
UPDATE evaluation_criteria SET sort_order = 22
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.19';
UPDATE evaluation_criteria SET sort_order = 23
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.19.1';
UPDATE evaluation_criteria SET sort_order = 24
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.19.2';
UPDATE evaluation_criteria SET sort_order = 25
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.19.3';
UPDATE evaluation_criteria SET sort_order = 26
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.20';
UPDATE evaluation_criteria SET sort_order = 27
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.21';
UPDATE evaluation_criteria SET sort_order = 28
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.22';
UPDATE evaluation_criteria SET sort_order = 29
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.23';
UPDATE evaluation_criteria SET sort_order = 30
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.24';
UPDATE evaluation_criteria SET sort_order = 31
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.25';
UPDATE evaluation_criteria SET sort_order = 32
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.26';
UPDATE evaluation_criteria SET sort_order = 33
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.26.1';
UPDATE evaluation_criteria SET sort_order = 34
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.26.2';
UPDATE evaluation_criteria SET sort_order = 35
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.26.3';
UPDATE evaluation_criteria SET sort_order = 36
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '36.26.4';
UPDATE evaluation_criteria SET sort_order = 37
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '37';
UPDATE evaluation_criteria SET sort_order = 39
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_PP' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '38';
UPDATE evaluation_criteria SET sort_order = 3
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_HCR' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '39';
UPDATE evaluation_criteria SET sort_order = 3
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '40';
UPDATE evaluation_criteria SET sort_order = 4
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '41';
UPDATE evaluation_criteria SET sort_order = 5
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '41.1';
UPDATE evaluation_criteria SET sort_order = 6
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '41.2';
UPDATE evaluation_criteria SET sort_order = 7
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '41.3';
UPDATE evaluation_criteria SET sort_order = 8
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '41.4';
UPDATE evaluation_criteria SET sort_order = 9
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '41.5';
UPDATE evaluation_criteria SET sort_order = 10
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '41.6';
UPDATE evaluation_criteria SET sort_order = 12
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '42';
UPDATE evaluation_criteria SET sort_order = 15
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '43';
UPDATE evaluation_criteria SET sort_order = 16
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '43.1';
UPDATE evaluation_criteria SET sort_order = 17
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '43.2';
UPDATE evaluation_criteria SET sort_order = 18
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '43.3';
UPDATE evaluation_criteria SET sort_order = 19
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '43.4';
UPDATE evaluation_criteria SET sort_order = 20
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '43.5';
UPDATE evaluation_criteria SET sort_order = 21
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '44';
UPDATE evaluation_criteria SET sort_order = 22
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '44.1';
UPDATE evaluation_criteria SET sort_order = 23
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '44.2';
UPDATE evaluation_criteria SET sort_order = 25
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '45';
UPDATE evaluation_criteria SET sort_order = 28
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '46';
UPDATE evaluation_criteria SET sort_order = 29
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '46.1';
UPDATE evaluation_criteria SET sort_order = 30
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '46.2';
UPDATE evaluation_criteria SET sort_order = 31
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '46.3';
UPDATE evaluation_criteria SET sort_order = 32
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '46.4';
UPDATE evaluation_criteria SET sort_order = 33
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '46.5';
UPDATE evaluation_criteria SET sort_order = 34
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '46.6';
UPDATE evaluation_criteria SET sort_order = 35
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '46.7';
UPDATE evaluation_criteria SET sort_order = 36
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '47';
UPDATE evaluation_criteria SET sort_order = 37
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '47.1';
UPDATE evaluation_criteria SET sort_order = 38
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '47.2';
UPDATE evaluation_criteria SET sort_order = 40
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'URG_INT' AND service_id = (SELECT id FROM services WHERE code = 'URG'))
    AND number = '48';

-- 5. sort_order para section headers
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'URG-TH-H01' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'URG-TH-H02' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 9 WHERE code = 'URG-TH-H03' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'URG-TH-H04' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'URG-TH-H05' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'URG-TH-H06' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'URG-TH-H07' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'URG-TH-H08' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 36 WHERE code = 'URG-TH-H09' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'URG-INF-H01' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'URG-INF-H02' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 9 WHERE code = 'URG-INF-H03' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'URG-INF-H04' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 42 WHERE code = 'URG-INF-H05' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 44 WHERE code = 'URG-INF-H06' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 45 WHERE code = 'URG-INF-H07' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 47 WHERE code = 'URG-INF-H08' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'URG-DOT-H01' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'URG-DOT-H02' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 62 WHERE code = 'URG-DOT-H03' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'URG-MD-H01' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 3 WHERE code = 'URG-MD-H02' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 5 WHERE code = 'URG-MD-H03' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 6 WHERE code = 'URG-MD-H04' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'URG-PP-H01' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'URG-PP-H02' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'URG-HCR-H01' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'URG-HCR-H02' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'URG-INT-H01' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'URG-INT-H02' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'URG-INT-H03' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'URG-INT-H04' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'URG-INT-H05' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'URG-INT-H06' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'URG-INT-H07' AND service_id = (SELECT id FROM services WHERE code = 'URG');
UPDATE evaluation_criteria SET sort_order = 39 WHERE code = 'URG-INT-H08' AND service_id = (SELECT id FROM services WHERE code = 'URG');
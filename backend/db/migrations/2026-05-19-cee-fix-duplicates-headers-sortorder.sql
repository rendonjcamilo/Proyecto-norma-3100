-- ================================================================
-- CEE (Consulta Externa Especializada): fix duplicados + headers + sort_order
-- Fuente Excel: hoja 11.2.2.S_CE_E
-- ================================================================

-- 1. Eliminar referencias al cuestionario de criterios duplicados CEE_PP
DELETE FROM questionnaire_criteria
WHERE criterion_id IN (
  SELECT id FROM evaluation_criteria
  WHERE service_id = (SELECT id FROM services WHERE code = 'CEE')
    AND code IN ('CEE-PP-009','CEE-PP-010','CEE-PP-011','CEE-PP-012','CEE-PP-013','CEE-PP-014','CEE-PP-015')
);

-- 2. Eliminar criterios duplicados de CEE_PP
DELETE FROM evaluation_criteria
WHERE service_id = (SELECT id FROM services WHERE code = 'CEE')
  AND code IN ('CEE-PP-009','CEE-PP-010','CEE-PP-011','CEE-PP-012','CEE-PP-013','CEE-PP-014','CEE-PP-015');

-- 3. Limpiar section headers previos de CEE
DELETE FROM questionnaire_criteria
WHERE criterion_id IN (
  SELECT ec.id FROM evaluation_criteria ec
  JOIN services s ON s.id = ec.service_id
  WHERE s.code = 'CEE' AND ec.is_section_header = true
);

DELETE FROM evaluation_criteria
WHERE service_id = (SELECT id FROM services WHERE code = 'CEE')
  AND is_section_header = true;

-- 4. Insertar section headers
INSERT INTO evaluation_criteria
  (code, number, name, description, standard_id, service_id, is_mandatory, status, is_section_header)
SELECT v.code, '', v.name, v.name, es.id, s.id, true, 'active', true
FROM (VALUES
  ('CEE_TH', 'CEE-TH-H01', 'Complejidad mediana'),
  ('CEE_TH', 'CEE-TH-H02', 'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria'),
  ('CEE_TH', 'CEE-TH-H03', 'Modalidad telemedicina'),
  ('CEE_TH', 'CEE-TH-H04', 'Categoría interactiva y no interactiva-prestador de referencia'),
  ('CEE_TH', 'CEE-TH-H05', 'Categoría telexperticia -prestador remisor'),
  ('CEE_TH', 'CEE-TH-H06', 'Categoría telexperticia-prestador de referencia'),
  ('CEE_TH', 'CEE-TH-H07', 'Categoría telemonitoreo-prestador referencia'),
  ('CEE_INF', 'CEE-INF-H01', 'Complejidad mediana'),
  ('CEE_INF', 'CEE-INF-H02', 'Modalidades intramural'),
  ('CEE_INF', 'CEE-INF-H03', 'Modalidades extramural unidad móvil, jornada de salud y domiciliaria'),
  ('CEE_INF', 'CEE-INF-H04', 'Modalidad telemedicina'),
  ('CEE_INF', 'CEE-INF-H05', 'Categoría interactiva y no interactiva-prestador de referencia'),
  ('CEE_INF', 'CEE-INF-H06', 'Categoría telexperticia-prestador remisor'),
  ('CEE_INF', 'CEE-INF-H07', 'Categoría telexperticia-prestador referencia'),
  ('CEE_INF', 'CEE-INF-H08', 'Categoría telemonitoreo-prestador referencia'),
  ('CEE_DOT', 'CEE-DOT-H01', 'Complejidad mediana'),
  ('CEE_DOT', 'CEE-DOT-H02', 'Modalidades intramural, extramural: unidad móvil, jornada de salud y domiciliaria'),
  ('CEE_DOT', 'CEE-DOT-H03', 'Modalidad telemedicina'),
  ('CEE_DOT', 'CEE-DOT-H04', 'Categoría interactiva y no interactiva-prestador de referencia'),
  ('CEE_DOT', 'CEE-DOT-H05', 'Categoría telexperticia-prestador de remisor'),
  ('CEE_DOT', 'CEE-DOT-H06', 'Categoría telexperticia-prestador referencia'),
  ('CEE_DOT', 'CEE-DOT-H07', 'Categoría telemonitoreo-prestador referencia'),
  ('CEE_MD', 'CEE-MD-H01', 'Complejidad mediana'),
  ('CEE_MD', 'CEE-MD-H02', 'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria'),
  ('CEE_MD', 'CEE-MD-H03', 'Modalidad telemedicina'),
  ('CEE_MD', 'CEE-MD-H04', 'Categoría interactiva y no interactiva-prestador de referencia'),
  ('CEE_MD', 'CEE-MD-H05', 'Categoría telexperticia-prestador remisor -prestador de referencia'),
  ('CEE_MD', 'CEE-MD-H06', 'Categoría telemonitoreo-prestador referencia'),
  ('CEE_PP', 'CEE-PP-H01', 'Complejidad mediana'),
  ('CEE_PP', 'CEE-PP-H02', 'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria'),
  ('CEE_PP', 'CEE-PP-H03', 'Modalidad telemedicina'),
  ('CEE_PP', 'CEE-PP-H04', 'Categoría  interactiva y no interactiva -prestador de referencia'),
  ('CEE_PP', 'CEE-PP-H05', 'Categoria telexperticía - prestador remisor'),
  ('CEE_PP', 'CEE-PP-H06', 'Categoría telexperticia-prestador de referencia'),
  ('CEE_PP', 'CEE-PP-H07', 'Categoría telemonitoreo-prestador de referencia'),
  ('CEE_HCR', 'CEE-HCR-H01', 'Complejidad mediana'),
  ('CEE_HCR', 'CEE-HCR-H02', 'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria'),
  ('CEE_HCR', 'CEE-HCR-H03', 'Modalidad telemedicina'),
  ('CEE_HCR', 'CEE-HCR-H04', 'Categoría  interactiva y no interactiva -prestador de referencia'),
  ('CEE_HCR', 'CEE-HCR-H05', 'Categoría telexperticia-prestador remisor -prestador de referencia'),
  ('CEE_HCR', 'CEE-HCR-H06', 'Categoría telemonitoreo-prestador referencia'),
  ('CEE_INT', 'CEE-INT-H01', 'Complejidad mediana'),
  ('CEE_INT', 'CEE-INT-H02', 'Modalidades intramural, extramural unidad móvil, jornada de salud y domiciliaria y telemedicina'),
  ('CEE_INT', 'CEE-INT-H03', 'Modalidad telemedicina'),
  ('CEE_INT', 'CEE-INT-H04', 'Categoría  interactiva y no interactiva -prestador de referencia'),
  ('CEE_INT', 'CEE-INT-H05', 'Categoría telexperticia-prestador remisor -prestador de referencia'),
  ('CEE_INT', 'CEE-INT-H06', 'Categoría telemonitoreo-prestador referencia')
) AS v(std_code, code, name)
JOIN evaluation_standards es ON es.code = v.std_code
JOIN services s ON s.id = es.service_id AND s.code = 'CEE'
ON CONFLICT (code, service_id) DO NOTHING;

-- 5. Agregar headers al cuestionario CEE
INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
SELECT q.id, ec.id
FROM questionnaires q
JOIN services s ON s.id = q.service_id
JOIN evaluation_criteria ec ON ec.service_id = s.id
WHERE s.code = 'CEE'
  AND q.version_type = 'initial'
  AND ec.is_section_header = true
  AND ec.code LIKE 'CEE-%-H%'
ON CONFLICT DO NOTHING;

-- 6. sort_order para criterios existentes
UPDATE evaluation_criteria SET sort_order = 3
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_TH' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '1';
UPDATE evaluation_criteria SET sort_order = 4
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_TH' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '1.1';
UPDATE evaluation_criteria SET sort_order = 5
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_TH' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '1.2';
UPDATE evaluation_criteria SET sort_order = 8
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_TH' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '2';
UPDATE evaluation_criteria SET sort_order = 11
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_TH' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '3';
UPDATE evaluation_criteria SET sort_order = 12
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_TH' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '3.1';
UPDATE evaluation_criteria SET sort_order = 13
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_TH' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '3.2';
UPDATE evaluation_criteria SET sort_order = 15
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_TH' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '4';
UPDATE evaluation_criteria SET sort_order = 17
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_TH' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '5';
UPDATE evaluation_criteria SET sort_order = 3
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '6';
UPDATE evaluation_criteria SET sort_order = 4
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '7';
UPDATE evaluation_criteria SET sort_order = 6
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '8';
UPDATE evaluation_criteria SET sort_order = 9
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '9';
UPDATE evaluation_criteria SET sort_order = 11
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '10';
UPDATE evaluation_criteria SET sort_order = 13
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '11';
UPDATE evaluation_criteria SET sort_order = 15
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_INF' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '12';
UPDATE evaluation_criteria SET sort_order = 3
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '13';
UPDATE evaluation_criteria SET sort_order = 7
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '14';
UPDATE evaluation_criteria SET sort_order = 9
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '15';
UPDATE evaluation_criteria SET sort_order = 11
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '16';
UPDATE evaluation_criteria SET sort_order = 13
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_DOT' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '17';
UPDATE evaluation_criteria SET sort_order = 3
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_MD' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '18';
UPDATE evaluation_criteria SET sort_order = 8
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_MD' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '19';
UPDATE evaluation_criteria SET sort_order = 3
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_PP' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '20';
UPDATE evaluation_criteria SET sort_order = 4
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_PP' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '21';
UPDATE evaluation_criteria SET sort_order = 5
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_PP' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '21.1';
UPDATE evaluation_criteria SET sort_order = 6
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_PP' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '21.2';
UPDATE evaluation_criteria SET sort_order = 9
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_PP' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '22';
UPDATE evaluation_criteria SET sort_order = 11
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_PP' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '23';
UPDATE evaluation_criteria SET sort_order = 13
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_PP' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '24';
UPDATE evaluation_criteria SET sort_order = 15
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_PP' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '25';
UPDATE evaluation_criteria SET sort_order = 3
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_HCR' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '26';
UPDATE evaluation_criteria SET sort_order = 8
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_HCR' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '27';
UPDATE evaluation_criteria SET sort_order = 3
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_INT' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '28';
UPDATE evaluation_criteria SET sort_order = 4
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_INT' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '29';
UPDATE evaluation_criteria SET sort_order = 5
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_INT' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '29.1';
UPDATE evaluation_criteria SET sort_order = 6
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_INT' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '29.2';
UPDATE evaluation_criteria SET sort_order = 11
  WHERE standard_id = (SELECT id FROM evaluation_standards WHERE code = 'CEE_INT' AND service_id = (SELECT id FROM services WHERE code = 'CEE'))
    AND number = '30';

-- 7. sort_order para section headers
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CEE-TH-H01' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CEE-TH-H02' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 6 WHERE code = 'CEE-TH-H03' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 7 WHERE code = 'CEE-TH-H04' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CEE-TH-H05' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CEE-TH-H06' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'CEE-TH-H07' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CEE-INF-H01' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CEE-INF-H02' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 5 WHERE code = 'CEE-INF-H03' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 7 WHERE code = 'CEE-INF-H04' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 8 WHERE code = 'CEE-INF-H05' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CEE-INF-H06' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CEE-INF-H07' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CEE-INF-H08' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CEE-DOT-H01' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CEE-DOT-H02' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 5 WHERE code = 'CEE-DOT-H03' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 6 WHERE code = 'CEE-DOT-H04' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 8 WHERE code = 'CEE-DOT-H05' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CEE-DOT-H06' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CEE-DOT-H07' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CEE-MD-H01' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CEE-MD-H02' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 4 WHERE code = 'CEE-MD-H03' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 5 WHERE code = 'CEE-MD-H04' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 6 WHERE code = 'CEE-MD-H05' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 7 WHERE code = 'CEE-MD-H06' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CEE-PP-H01' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CEE-PP-H02' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 7 WHERE code = 'CEE-PP-H03' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 8 WHERE code = 'CEE-PP-H04' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CEE-PP-H05' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'CEE-PP-H06' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CEE-PP-H07' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CEE-HCR-H01' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CEE-HCR-H02' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 4 WHERE code = 'CEE-HCR-H03' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 5 WHERE code = 'CEE-HCR-H04' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 6 WHERE code = 'CEE-HCR-H05' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 7 WHERE code = 'CEE-HCR-H06' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 1 WHERE code = 'CEE-INT-H01' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 2 WHERE code = 'CEE-INT-H02' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 7 WHERE code = 'CEE-INT-H03' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 8 WHERE code = 'CEE-INT-H04' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 9 WHERE code = 'CEE-INT-H05' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'CEE-INT-H06' AND service_id = (SELECT id FROM services WHERE code = 'CEE');
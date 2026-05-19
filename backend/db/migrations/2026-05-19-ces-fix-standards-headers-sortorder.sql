-- CES fix: CES_PP -> CES_MD + headers + sort_order
DELETE FROM questionnaire_criteria WHERE criterion_id IN (SELECT id FROM evaluation_criteria WHERE service_id=(SELECT id FROM services WHERE code='CES') AND code IN ('CES-PP-001','CES-PP-002'));
DELETE FROM evaluation_criteria WHERE service_id=(SELECT id FROM services WHERE code='CES') AND code IN ('CES-PP-001','CES-PP-002');
INSERT INTO evaluation_criteria(code,number,name,description,standard_id,service_id,is_mandatory,status,is_section_header) SELECT 'CES-MD-002','11','11. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente cuenta con la siguiente info','11. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente cuenta con la siguiente info',es.id,s.id,true,'active',false FROM evaluation_standards es JOIN services s ON s.id=es.service_id WHERE es.code='CES_MD' AND s.code='CES' ON CONFLICT(code,service_id) DO NOTHING;
INSERT INTO evaluation_criteria(code,number,name,description,standard_id,service_id,is_mandatory,status,is_section_header) SELECT 'CES-MD-003','12','12.  Cumple con los criterios que le sean aplicables de todos los servicios.','12.  Cumple con los criterios que le sean aplicables de todos los servicios.',es.id,s.id,true,'active',false FROM evaluation_standards es JOIN services s ON s.id=es.service_id WHERE es.code='CES_MD' AND s.code='CES' ON CONFLICT(code,service_id) DO NOTHING;
INSERT INTO questionnaire_criteria(questionnaire_id,criterion_id) SELECT q.id,ec.id FROM questionnaires q JOIN services s ON s.id=q.service_id JOIN evaluation_criteria ec ON ec.service_id=s.id WHERE s.code='CES' AND q.version_type='initial' AND ec.code IN('CES-MD-002','CES-MD-003') ON CONFLICT DO NOTHING;
DELETE FROM questionnaire_criteria WHERE criterion_id IN(SELECT ec.id FROM evaluation_criteria ec JOIN services s ON s.id=ec.service_id WHERE s.code='CES' AND ec.is_section_header=true);
DELETE FROM evaluation_criteria WHERE service_id=(SELECT id FROM services WHERE code='CES') AND is_section_header=true;
INSERT INTO evaluation_criteria(code,number,name,description,standard_id,service_id,is_mandatory,status,is_section_header) SELECT v.code,'',v.name,v.name,es.id,s.id,true,'active',true FROM (VALUES
  ('CES_TH','CES-TH-H01','Complejidad mediana'),
  ('CES_TH','CES-TH-H02','Modalidades intramural, extramural unidad móvil y jornada de salud'),
  ('CES_TH','CES-TH-H03','Modalidad telemedicina-prestador remisor'),
  ('CES_TH','CES-TH-H04','Modalidad telemedicina-prestador de referencia'),
  ('CES_INF','CES-INF-H01','Complejidad mediana'),
  ('CES_INF','CES-INF-H02','Modalidades intramural y extramural unidad móvil, jornada de salud y telemedicina-prestador remisor'),
  ('CES_INF','CES-INF-H03','Modalidad telemedicina -prestador de referencia'),
  ('CES_DOT','CES-DOT-H01','Complejidad mediana'),
  ('CES_DOT','CES-DOT-H02','Modalidades intramural y extramural unidad móvil, jornada de salud y telemedicina-prestador remisor'),
  ('CES_DOT','CES-DOT-H03','Modalidad telemedicina-prestador de referencia'),
  ('CES_MD','CES-MD-H01','Complejidad mediana'),
  ('CES_MD','CES-MD-H02','Modalidades intramural y extramural unidad móvil, jornada de salud y telemedicina-prestador remisor y prestador de referencia.'),
  ('CES_MD','CES-MD-H03','Complejidad mediana'),
  ('CES_MD','CES-MD-H04','Modalidades intramural y extramural unidad móvil, jornada de salud y telemedicina-prestador remisor.'),
  ('CES_MD','CES-MD-H05','Modalidad telemedicina-prestador de referencia'),
  ('CES_HCR','CES-HCR-H01','Complejidad mediana'),
  ('CES_HCR','CES-HCR-H02','Modalidades instramural y extramural unidad móvil, jornada de salud y telemedicina prestador remisor-prestador de referencia.'),
  ('CES_INT','CES-INT-H01','Complejidad mediana'),
  ('CES_INT','CES-INT-H02','Modalidades intramural y extramural unidad móvil, jornada de salud y telemedicina prestador remisor-prestador de referencia')
) AS v(sc,code,name) JOIN evaluation_standards es ON es.code=v.sc JOIN services s ON s.id=es.service_id AND s.code='CES' ON CONFLICT(code,service_id) DO NOTHING;
INSERT INTO questionnaire_criteria(questionnaire_id,criterion_id) SELECT q.id,ec.id FROM questionnaires q JOIN services s ON s.id=q.service_id JOIN evaluation_criteria ec ON ec.service_id=s.id WHERE s.code='CES' AND q.version_type='initial' AND ec.is_section_header=true AND ec.code LIKE 'CES-%-H%' ON CONFLICT DO NOTHING;
UPDATE evaluation_criteria SET sort_order=3 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_TH' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='1';
UPDATE evaluation_criteria SET sort_order=4 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_TH' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='1.1';
UPDATE evaluation_criteria SET sort_order=5 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_TH' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='1.2';
UPDATE evaluation_criteria SET sort_order=7 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_TH' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='2';
UPDATE evaluation_criteria SET sort_order=8 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_TH' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='2.1';
UPDATE evaluation_criteria SET sort_order=10 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_TH' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='3';
UPDATE evaluation_criteria SET sort_order=3 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_INF' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='4';
UPDATE evaluation_criteria SET sort_order=5 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_INF' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='5';
UPDATE evaluation_criteria SET sort_order=3 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_DOT' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='6';
UPDATE evaluation_criteria SET sort_order=4 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_DOT' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='7';
UPDATE evaluation_criteria SET sort_order=5 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_DOT' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='7.1';
UPDATE evaluation_criteria SET sort_order=6 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_DOT' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='7.2';
UPDATE evaluation_criteria SET sort_order=7 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_DOT' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='7.3';
UPDATE evaluation_criteria SET sort_order=8 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_DOT' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='7.4';
UPDATE evaluation_criteria SET sort_order=9 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_DOT' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='7.5';
UPDATE evaluation_criteria SET sort_order=10 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_DOT' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='7.6';
UPDATE evaluation_criteria SET sort_order=11 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_DOT' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='7.7';
UPDATE evaluation_criteria SET sort_order=12 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_DOT' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='7.8';
UPDATE evaluation_criteria SET sort_order=13 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_DOT' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='7.9';
UPDATE evaluation_criteria SET sort_order=14 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_DOT' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='7.10';
UPDATE evaluation_criteria SET sort_order=15 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_DOT' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='7.11';
UPDATE evaluation_criteria SET sort_order=16 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_DOT' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='8';
UPDATE evaluation_criteria SET sort_order=18 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_DOT' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='9';
UPDATE evaluation_criteria SET sort_order=3 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_MD' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='10';
UPDATE evaluation_criteria SET sort_order=6 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_MD' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='11';
UPDATE evaluation_criteria SET sort_order=9 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_MD' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='12';
UPDATE evaluation_criteria SET sort_order=3 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_HCR' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='13';
UPDATE evaluation_criteria SET sort_order=3 WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_INT' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='14';
UPDATE evaluation_criteria SET sort_order=1 WHERE code='CES-TH-H01' AND service_id=(SELECT id FROM services WHERE code='CES');
UPDATE evaluation_criteria SET sort_order=2 WHERE code='CES-TH-H02' AND service_id=(SELECT id FROM services WHERE code='CES');
UPDATE evaluation_criteria SET sort_order=6 WHERE code='CES-TH-H03' AND service_id=(SELECT id FROM services WHERE code='CES');
UPDATE evaluation_criteria SET sort_order=9 WHERE code='CES-TH-H04' AND service_id=(SELECT id FROM services WHERE code='CES');
UPDATE evaluation_criteria SET sort_order=1 WHERE code='CES-INF-H01' AND service_id=(SELECT id FROM services WHERE code='CES');
UPDATE evaluation_criteria SET sort_order=2 WHERE code='CES-INF-H02' AND service_id=(SELECT id FROM services WHERE code='CES');
UPDATE evaluation_criteria SET sort_order=4 WHERE code='CES-INF-H03' AND service_id=(SELECT id FROM services WHERE code='CES');
UPDATE evaluation_criteria SET sort_order=1 WHERE code='CES-DOT-H01' AND service_id=(SELECT id FROM services WHERE code='CES');
UPDATE evaluation_criteria SET sort_order=2 WHERE code='CES-DOT-H02' AND service_id=(SELECT id FROM services WHERE code='CES');
UPDATE evaluation_criteria SET sort_order=17 WHERE code='CES-DOT-H03' AND service_id=(SELECT id FROM services WHERE code='CES');
UPDATE evaluation_criteria SET sort_order=1 WHERE code='CES-MD-H01' AND service_id=(SELECT id FROM services WHERE code='CES');
UPDATE evaluation_criteria SET sort_order=2 WHERE code='CES-MD-H02' AND service_id=(SELECT id FROM services WHERE code='CES');
UPDATE evaluation_criteria SET sort_order=4 WHERE code='CES-MD-H03' AND service_id=(SELECT id FROM services WHERE code='CES');
UPDATE evaluation_criteria SET sort_order=5 WHERE code='CES-MD-H04' AND service_id=(SELECT id FROM services WHERE code='CES');
UPDATE evaluation_criteria SET sort_order=8 WHERE code='CES-MD-H05' AND service_id=(SELECT id FROM services WHERE code='CES');
UPDATE evaluation_criteria SET sort_order=1 WHERE code='CES-HCR-H01' AND service_id=(SELECT id FROM services WHERE code='CES');
UPDATE evaluation_criteria SET sort_order=2 WHERE code='CES-HCR-H02' AND service_id=(SELECT id FROM services WHERE code='CES');
UPDATE evaluation_criteria SET sort_order=1 WHERE code='CES-INT-H01' AND service_id=(SELECT id FROM services WHERE code='CES');
UPDATE evaluation_criteria SET sort_order=2 WHERE code='CES-INT-H02' AND service_id=(SELECT id FROM services WHERE code='CES');
UPDATE evaluation_criteria SET is_section_header=true WHERE standard_id=(SELECT id FROM evaluation_standards WHERE code='CES_DOT' AND service_id=(SELECT id FROM services WHERE code='CES')) AND number='7';
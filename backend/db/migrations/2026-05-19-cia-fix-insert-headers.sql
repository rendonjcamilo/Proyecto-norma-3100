-- Fix: CIA section headers INSERT (corrected ON CONFLICT target and missing NOT NULL columns)
-- Service ID:    5d9b6120-d816-4760-b63a-2a27ffadda6b
-- Questionnaire: ca4b023f-cb36-40f5-9a73-c568cea75977

INSERT INTO evaluation_criteria (id, standard_id, code, number, name, description, service_id, is_section_header, sort_order)
VALUES
    -- CIA_TH (3 headers)
    (gen_random_uuid(), 'a77e9f96-0acb-480e-9bcb-23215e23693f', 'CIA-TH-H01', '', 'Complejidad alta',                                                                           'Complejidad alta',                                                                           '5d9b6120-d816-4760-b63a-2a27ffadda6b', true, 1),
    (gen_random_uuid(), 'a77e9f96-0acb-480e-9bcb-23215e23693f', 'CIA-TH-H02', '', 'Modalidades intramural, telemedicina - prestador remisor',                                  'Modalidades intramural, telemedicina - prestador remisor',                                  '5d9b6120-d816-4760-b63a-2a27ffadda6b', true, 2),
    (gen_random_uuid(), 'a77e9f96-0acb-480e-9bcb-23215e23693f', 'CIA-TH-H03', '', 'Modalidades telemedicina - prestador de referencia',                                        'Modalidades telemedicina - prestador de referencia',                                        '5d9b6120-d816-4760-b63a-2a27ffadda6b', true, 16),
    -- CIA_INF (2 headers)
    (gen_random_uuid(), '00ab0c60-a644-4051-a8cf-ad2874a804a4', 'CIA-INF-H01', '', 'Modalidades intramural, telemedicina - prestador remisor',                                  'Modalidades intramural, telemedicina - prestador remisor',                                  '5d9b6120-d816-4760-b63a-2a27ffadda6b', true, 1),
    (gen_random_uuid(), '00ab0c60-a644-4051-a8cf-ad2874a804a4', 'CIA-INF-H02', '', 'Modalidades telemedicina - prestador de referencia',                                        'Modalidades telemedicina - prestador de referencia',                                        '5d9b6120-d816-4760-b63a-2a27ffadda6b', true, 14),
    -- CIA_DOT (2 headers)
    (gen_random_uuid(), '5ebdbd32-0702-43b0-be9a-2e889465cd7d', 'CIA-DOT-H01', '', 'Modalidades intramural, telemedicina - prestador remisor',                                  'Modalidades intramural, telemedicina - prestador remisor',                                  '5d9b6120-d816-4760-b63a-2a27ffadda6b', true, 1),
    (gen_random_uuid(), '5ebdbd32-0702-43b0-be9a-2e889465cd7d', 'CIA-DOT-H02', '', 'Modalidades telemedicina - prestador de referencia',                                        'Modalidades telemedicina - prestador de referencia',                                        '5d9b6120-d816-4760-b63a-2a27ffadda6b', true, 17),
    -- CIA_MD (3 headers)
    (gen_random_uuid(), '1773d985-9339-4ec9-97e2-5888c1f6aa3e', 'CIA-MD-H01',  '', 'Complejidad alta',                                                                           'Complejidad alta',                                                                           '5d9b6120-d816-4760-b63a-2a27ffadda6b', true, 1),
    (gen_random_uuid(), '1773d985-9339-4ec9-97e2-5888c1f6aa3e', 'CIA-MD-H02',  '', 'Modalidades intramural, telemedicina - prestador remisor',                                  'Modalidades intramural, telemedicina - prestador remisor',                                  '5d9b6120-d816-4760-b63a-2a27ffadda6b', true, 2),
    (gen_random_uuid(), '1773d985-9339-4ec9-97e2-5888c1f6aa3e', 'CIA-MD-H03',  '', 'Modalidad telemedicina - prestador de referencia',                                          'Modalidad telemedicina - prestador de referencia',                                          '5d9b6120-d816-4760-b63a-2a27ffadda6b', true, 4),
    -- CIA_PP (3 headers)
    (gen_random_uuid(), '240a4d05-930b-4cb7-8ed0-89daf22ba3cb', 'CIA-PP-H01',  '', 'Complejidad alta',                                                                           'Complejidad alta',                                                                           '5d9b6120-d816-4760-b63a-2a27ffadda6b', true, 1),
    (gen_random_uuid(), '240a4d05-930b-4cb7-8ed0-89daf22ba3cb', 'CIA-PP-H02',  '', 'Modalidades intramural, telemedicina - prestador remisor',                                  'Modalidades intramural, telemedicina - prestador remisor',                                  '5d9b6120-d816-4760-b63a-2a27ffadda6b', true, 2),
    (gen_random_uuid(), '240a4d05-930b-4cb7-8ed0-89daf22ba3cb', 'CIA-PP-H03',  '', 'Modalidad telemedicina - prestador de referencia',                                          'Modalidad telemedicina - prestador de referencia',                                          '5d9b6120-d816-4760-b63a-2a27ffadda6b', true, 40),
    -- CIA_HCR (2 headers)
    (gen_random_uuid(), '0abdab0f-e243-49f7-81f7-8a2322f1a8f8', 'CIA-HCR-H01', '', 'Complejidad alta',                                                                           'Complejidad alta',                                                                           '5d9b6120-d816-4760-b63a-2a27ffadda6b', true, 1),
    (gen_random_uuid(), '0abdab0f-e243-49f7-81f7-8a2322f1a8f8', 'CIA-HCR-H02', '', 'Modalidades intramural y telemedicina - prestador remisor - prestador de referencia',       'Modalidades intramural y telemedicina - prestador remisor - prestador de referencia',       '5d9b6120-d816-4760-b63a-2a27ffadda6b', true, 2),
    -- CIA_INT (3 headers)
    (gen_random_uuid(), 'b488198a-2299-4e48-a41a-52bcd37da39a', 'CIA-INT-H01', '', 'Complejidad alta',                                                                           'Complejidad alta',                                                                           '5d9b6120-d816-4760-b63a-2a27ffadda6b', true, 1),
    (gen_random_uuid(), 'b488198a-2299-4e48-a41a-52bcd37da39a', 'CIA-INT-H02', '', 'Modalidad intramural',                                                                        'Modalidad intramural',                                                                        '5d9b6120-d816-4760-b63a-2a27ffadda6b', true, 2),
    (gen_random_uuid(), 'b488198a-2299-4e48-a41a-52bcd37da39a', 'CIA-INT-H03', '', 'Modalidad telemedicina - prestador remisor - prestador de referencia',                       'Modalidad telemedicina - prestador remisor - prestador de referencia',                       '5d9b6120-d816-4760-b63a-2a27ffadda6b', true, 15)
ON CONFLICT (code, service_id) DO NOTHING;

-- Link all section headers to the CIA questionnaire
INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
SELECT 'ca4b023f-cb36-40f5-9a73-c568cea75977', ec.id
FROM evaluation_criteria ec
JOIN evaluation_standards es ON ec.standard_id = es.id
WHERE es.service_id = '5d9b6120-d816-4760-b63a-2a27ffadda6b'
  AND ec.is_section_header = true
ON CONFLICT DO NOTHING;

-- Set sort_order for the newly inserted headers
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CIA-TH-H01'  AND service_id = '5d9b6120-d816-4760-b63a-2a27ffadda6b';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CIA-TH-H02'  AND service_id = '5d9b6120-d816-4760-b63a-2a27ffadda6b';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'CIA-TH-H03'  AND service_id = '5d9b6120-d816-4760-b63a-2a27ffadda6b';
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CIA-INF-H01' AND service_id = '5d9b6120-d816-4760-b63a-2a27ffadda6b';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'CIA-INF-H02' AND service_id = '5d9b6120-d816-4760-b63a-2a27ffadda6b';
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CIA-DOT-H01' AND service_id = '5d9b6120-d816-4760-b63a-2a27ffadda6b';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'CIA-DOT-H02' AND service_id = '5d9b6120-d816-4760-b63a-2a27ffadda6b';
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CIA-MD-H01'  AND service_id = '5d9b6120-d816-4760-b63a-2a27ffadda6b';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CIA-MD-H02'  AND service_id = '5d9b6120-d816-4760-b63a-2a27ffadda6b';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'CIA-MD-H03'  AND service_id = '5d9b6120-d816-4760-b63a-2a27ffadda6b';
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CIA-PP-H01'  AND service_id = '5d9b6120-d816-4760-b63a-2a27ffadda6b';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CIA-PP-H02'  AND service_id = '5d9b6120-d816-4760-b63a-2a27ffadda6b';
UPDATE evaluation_criteria SET sort_order = 40 WHERE code = 'CIA-PP-H03'  AND service_id = '5d9b6120-d816-4760-b63a-2a27ffadda6b';
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CIA-HCR-H01' AND service_id = '5d9b6120-d816-4760-b63a-2a27ffadda6b';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CIA-HCR-H02' AND service_id = '5d9b6120-d816-4760-b63a-2a27ffadda6b';
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'CIA-INT-H01' AND service_id = '5d9b6120-d816-4760-b63a-2a27ffadda6b';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'CIA-INT-H02' AND service_id = '5d9b6120-d816-4760-b63a-2a27ffadda6b';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'CIA-INT-H03' AND service_id = '5d9b6120-d816-4760-b63a-2a27ffadda6b';

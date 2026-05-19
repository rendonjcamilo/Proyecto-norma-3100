-- HGP: Hospitalización General — section headers + sort_order
-- Service ID:    04966178-fc65-4e5d-bb46-9f32b828128b
-- Questionnaire: 020ea863-5260-42ba-999e-94b6c5ef13c7
-- Standards:
--   HGP_TH:  13a24135-6a9f-45a3-bedd-4d6ec8937734
--   HGP_INF: f2bd2a81-aafa-467b-8dea-d4d025df1115
--   HGP_DOT: ddae3df6-0768-4c32-97a7-eefef73ac343
--   HGP_MD:  8624fcfe-5223-45d3-8635-448809025d20
--   HGP_PP:  06be49a6-78fe-4917-949d-b39e21e62507
--   HGP_HCR: 7e6712c9-2a50-467b-a6e0-7bb564677dce
--   HGP_INT: 25b691c2-6a3e-4211-b6eb-6bc83daf9ae6

-- ============================================================
-- STEP 1: Mark gray+numbered rows as section headers
-- ============================================================
UPDATE evaluation_criteria SET is_section_header = true WHERE code = 'HGP-TH-017';
UPDATE evaluation_criteria SET is_section_header = true WHERE code = 'HGP-INF-020';
UPDATE evaluation_criteria SET is_section_header = true WHERE code = 'HGP-DOT-004';
UPDATE evaluation_criteria SET is_section_header = true WHERE code = 'HGP-DOT-037';
UPDATE evaluation_criteria SET is_section_header = true WHERE code = 'HGP-INT-017';

-- ============================================================
-- STEP 2: Insert pure section headers (gray rows without number)
-- ============================================================
INSERT INTO evaluation_criteria (id, standard_id, code, number, name, description, service_id, is_section_header, sort_order)
VALUES
    -- HGP_TH (15 headers)
    (gen_random_uuid(), '13a24135-6a9f-45a3-bedd-4d6ec8937734', 'HGP-TH-H01', '', 'COMPLEJIDAD BAJA',                                                                                    'COMPLEJIDAD BAJA',                                                                                    '04966178-fc65-4e5d-bb46-9f32b828128b', true, 1),
    (gen_random_uuid(), '13a24135-6a9f-45a3-bedd-4d6ec8937734', 'HGP-TH-H02', '', 'Modalidad intramural y extramural domiciliaria',                                                       'Modalidad intramural y extramural domiciliaria',                                                       '04966178-fc65-4e5d-bb46-9f32b828128b', true, 2),
    (gen_random_uuid(), '13a24135-6a9f-45a3-bedd-4d6ec8937734', 'HGP-TH-H03', '', 'Modalidad telemedicina',                                                                               'Modalidad telemedicina',                                                                               '04966178-fc65-4e5d-bb46-9f32b828128b', true, 7),
    (gen_random_uuid(), '13a24135-6a9f-45a3-bedd-4d6ec8937734', 'HGP-TH-H04', '', 'Categoría telexperticia - prestador remisor',                                                          'Categoría telexperticia - prestador remisor',                                                          '04966178-fc65-4e5d-bb46-9f32b828128b', true, 8),
    (gen_random_uuid(), '13a24135-6a9f-45a3-bedd-4d6ec8937734', 'HGP-TH-H05', '', 'Categoría telexperticia - prestador de referencia',                                                    'Categoría telexperticia - prestador de referencia',                                                    '04966178-fc65-4e5d-bb46-9f32b828128b', true, 12),
    (gen_random_uuid(), '13a24135-6a9f-45a3-bedd-4d6ec8937734', 'HGP-TH-H06', '', 'Categoría telemonitoreo - prestador remisor en modalidad extramural domiciliaria',                     'Categoría telemonitoreo - prestador remisor en modalidad extramural domiciliaria',                     '04966178-fc65-4e5d-bb46-9f32b828128b', true, 14),
    (gen_random_uuid(), '13a24135-6a9f-45a3-bedd-4d6ec8937734', 'HGP-TH-H07', '', 'Categoría telemonitoreo - prestador remisor en modalidad extramural domiciliaria',                     'Categoría telemonitoreo - prestador remisor en modalidad extramural domiciliaria',                     '04966178-fc65-4e5d-bb46-9f32b828128b', true, 17),
    (gen_random_uuid(), '13a24135-6a9f-45a3-bedd-4d6ec8937734', 'HGP-TH-H08', '', 'COMPLEJIDAD MEDIANA',                                                                                  'COMPLEJIDAD MEDIANA',                                                                                  '04966178-fc65-4e5d-bb46-9f32b828128b', true, 19),
    (gen_random_uuid(), '13a24135-6a9f-45a3-bedd-4d6ec8937734', 'HGP-TH-H09', '', 'Modalidades intramural y telemedicina - prestador remisor',                                            'Modalidades intramural y telemedicina - prestador remisor',                                            '04966178-fc65-4e5d-bb46-9f32b828128b', true, 20),
    (gen_random_uuid(), '13a24135-6a9f-45a3-bedd-4d6ec8937734', 'HGP-TH-H10', '', 'Modalidad telemedicina',                                                                               'Modalidad telemedicina',                                                                               '04966178-fc65-4e5d-bb46-9f32b828128b', true, 31),
    (gen_random_uuid(), '13a24135-6a9f-45a3-bedd-4d6ec8937734', 'HGP-TH-H11', '', 'Categoría telexperticia - prestador de referencia',                                                    'Categoría telexperticia - prestador de referencia',                                                    '04966178-fc65-4e5d-bb46-9f32b828128b', true, 32),
    (gen_random_uuid(), '13a24135-6a9f-45a3-bedd-4d6ec8937734', 'HGP-TH-H12', '', 'COMPLEJIDAD ALTA',                                                                                     'COMPLEJIDAD ALTA',                                                                                     '04966178-fc65-4e5d-bb46-9f32b828128b', true, 36),
    (gen_random_uuid(), '13a24135-6a9f-45a3-bedd-4d6ec8937734', 'HGP-TH-H13', '', 'Modalidades intramural, telemedicina - prestador remisor',                                             'Modalidades intramural, telemedicina - prestador remisor',                                             '04966178-fc65-4e5d-bb46-9f32b828128b', true, 37),
    (gen_random_uuid(), '13a24135-6a9f-45a3-bedd-4d6ec8937734', 'HGP-TH-H14', '', 'Modalidad telemedicina',                                                                               'Modalidad telemedicina',                                                                               '04966178-fc65-4e5d-bb46-9f32b828128b', true, 49),
    (gen_random_uuid(), '13a24135-6a9f-45a3-bedd-4d6ec8937734', 'HGP-TH-H15', '', 'Categoría telexperticia - prestador de referencia',                                                    'Categoría telexperticia - prestador de referencia',                                                    '04966178-fc65-4e5d-bb46-9f32b828128b', true, 50),
    -- HGP_INF (9 headers)
    (gen_random_uuid(), 'f2bd2a81-aafa-467b-8dea-d4d025df1115', 'HGP-INF-H01', '', 'COMPLEJIDAD BAJA',                                                                                    'COMPLEJIDAD BAJA',                                                                                    '04966178-fc65-4e5d-bb46-9f32b828128b', true, 1),
    (gen_random_uuid(), 'f2bd2a81-aafa-467b-8dea-d4d025df1115', 'HGP-INF-H02', '', 'Modalidades intramural, telemedicina - prestador remisor - categoría telexperticia',                  'Modalidades intramural, telemedicina - prestador remisor - categoría telexperticia',                  '04966178-fc65-4e5d-bb46-9f32b828128b', true, 2),
    (gen_random_uuid(), 'f2bd2a81-aafa-467b-8dea-d4d025df1115', 'HGP-INF-H03', '', 'Modalidad extramural domiciliaria y telemedicina',                                                    'Modalidad extramural domiciliaria y telemedicina',                                                    '04966178-fc65-4e5d-bb46-9f32b828128b', true, 27),
    (gen_random_uuid(), 'f2bd2a81-aafa-467b-8dea-d4d025df1115', 'HGP-INF-H04', '', 'Categoría telexperticia - prestador remisor - prestador referencia',                                  'Categoría telexperticia - prestador remisor - prestador referencia',                                  '04966178-fc65-4e5d-bb46-9f32b828128b', true, 28),
    (gen_random_uuid(), 'f2bd2a81-aafa-467b-8dea-d4d025df1115', 'HGP-INF-H05', '', 'Categoría telemonitoreo - prestador remisor - prestador referencia',                                  'Categoría telemonitoreo - prestador remisor - prestador referencia',                                  '04966178-fc65-4e5d-bb46-9f32b828128b', true, 29),
    (gen_random_uuid(), 'f2bd2a81-aafa-467b-8dea-d4d025df1115', 'HGP-INF-H06', '', 'COMPLEJIDAD MEDIANA Y ALTA',                                                                           'COMPLEJIDAD MEDIANA Y ALTA',                                                                           '04966178-fc65-4e5d-bb46-9f32b828128b', true, 31),
    (gen_random_uuid(), 'f2bd2a81-aafa-467b-8dea-d4d025df1115', 'HGP-INF-H07', '', 'Modalidades intramural, telemedicina - prestador remisor - categoría telexperticia',                  'Modalidades intramural, telemedicina - prestador remisor - categoría telexperticia',                  '04966178-fc65-4e5d-bb46-9f32b828128b', true, 32),
    (gen_random_uuid(), 'f2bd2a81-aafa-467b-8dea-d4d025df1115', 'HGP-INF-H08', '', 'Modalidad telemedicina',                                                                               'Modalidad telemedicina',                                                                               '04966178-fc65-4e5d-bb46-9f32b828128b', true, 34),
    (gen_random_uuid(), 'f2bd2a81-aafa-467b-8dea-d4d025df1115', 'HGP-INF-H09', '', 'Categoría telexperticia - prestador referencia',                                                       'Categoría telexperticia - prestador referencia',                                                       '04966178-fc65-4e5d-bb46-9f32b828128b', true, 35),
    -- HGP_DOT (10 headers)
    (gen_random_uuid(), 'ddae3df6-0768-4c32-97a7-eefef73ac343', 'HGP-DOT-H01', '', 'COMPLEJIDAD BAJA',                                                                                    'COMPLEJIDAD BAJA',                                                                                    '04966178-fc65-4e5d-bb46-9f32b828128b', true, 1),
    (gen_random_uuid(), 'ddae3df6-0768-4c32-97a7-eefef73ac343', 'HGP-DOT-H02', '', 'Modalidades intramural, telemedicina - prestador remisor - categoría telexperticia',                  'Modalidades intramural, telemedicina - prestador remisor - categoría telexperticia',                  '04966178-fc65-4e5d-bb46-9f32b828128b', true, 2),
    (gen_random_uuid(), 'ddae3df6-0768-4c32-97a7-eefef73ac343', 'HGP-DOT-H03', '', 'Modalidad extramural domiciliaria, telemedicina - prestador remisor - categoría telexperticia y categoría telemonitoreo', 'Modalidad extramural domiciliaria, telemedicina - prestador remisor - categoría telexperticia y categoría telemonitoreo', '04966178-fc65-4e5d-bb46-9f32b828128b', true, 15),
    (gen_random_uuid(), 'ddae3df6-0768-4c32-97a7-eefef73ac343', 'HGP-DOT-H04', '', 'Modalidad telemedicina',                                                                               'Modalidad telemedicina',                                                                               '04966178-fc65-4e5d-bb46-9f32b828128b', true, 29),
    (gen_random_uuid(), 'ddae3df6-0768-4c32-97a7-eefef73ac343', 'HGP-DOT-H05', '', 'Categoría telexperticia - prestador referencia',                                                       'Categoría telexperticia - prestador referencia',                                                       '04966178-fc65-4e5d-bb46-9f32b828128b', true, 30),
    (gen_random_uuid(), 'ddae3df6-0768-4c32-97a7-eefef73ac343', 'HGP-DOT-H06', '', 'Categoría telemonitoreo - prestador referencia',                                                       'Categoría telemonitoreo - prestador referencia',                                                       '04966178-fc65-4e5d-bb46-9f32b828128b', true, 31),
    (gen_random_uuid(), 'ddae3df6-0768-4c32-97a7-eefef73ac343', 'HGP-DOT-H07', '', 'COMPLEJIDAD MEDIANA Y ALTA',                                                                           'COMPLEJIDAD MEDIANA Y ALTA',                                                                           '04966178-fc65-4e5d-bb46-9f32b828128b', true, 33),
    (gen_random_uuid(), 'ddae3df6-0768-4c32-97a7-eefef73ac343', 'HGP-DOT-H08', '', 'Modalidades intramural, telemedicina - prestador remisor - categoría telexperticia',                  'Modalidades intramural, telemedicina - prestador remisor - categoría telexperticia',                  '04966178-fc65-4e5d-bb46-9f32b828128b', true, 34),
    (gen_random_uuid(), 'ddae3df6-0768-4c32-97a7-eefef73ac343', 'HGP-DOT-H09', '', 'Modalidad telemedicina',                                                                               'Modalidad telemedicina',                                                                               '04966178-fc65-4e5d-bb46-9f32b828128b', true, 50),
    (gen_random_uuid(), 'ddae3df6-0768-4c32-97a7-eefef73ac343', 'HGP-DOT-H10', '', 'Categoría telexperticia - prestador referencia',                                                       'Categoría telexperticia - prestador referencia',                                                       '04966178-fc65-4e5d-bb46-9f32b828128b', true, 51),
    -- HGP_MD (13 headers)
    (gen_random_uuid(), '8624fcfe-5223-45d3-8635-448809025d20', 'HGP-MD-H01',  '', 'COMPLEJIDAD BAJA',                                                                                    'COMPLEJIDAD BAJA',                                                                                    '04966178-fc65-4e5d-bb46-9f32b828128b', true, 1),
    (gen_random_uuid(), '8624fcfe-5223-45d3-8635-448809025d20', 'HGP-MD-H02',  '', 'Modalidades intramural, extramural domiciliaria, telemedicina - prestador remisor - categoría telexperticia y categoría telemonitoreo', 'Modalidades intramural, extramural domiciliaria, telemedicina - prestador remisor - categoría telexperticia y categoría telemonitoreo', '04966178-fc65-4e5d-bb46-9f32b828128b', true, 2),
    (gen_random_uuid(), '8624fcfe-5223-45d3-8635-448809025d20', 'HGP-MD-H03',  '', 'Modalidad telemedicina',                                                                               'Modalidad telemedicina',                                                                               '04966178-fc65-4e5d-bb46-9f32b828128b', true, 8),
    (gen_random_uuid(), '8624fcfe-5223-45d3-8635-448809025d20', 'HGP-MD-H04',  '', 'Categoría telexperticia - prestador referencia',                                                       'Categoría telexperticia - prestador referencia',                                                       '04966178-fc65-4e5d-bb46-9f32b828128b', true, 9),
    (gen_random_uuid(), '8624fcfe-5223-45d3-8635-448809025d20', 'HGP-MD-H05',  '', 'Categoría telemonitoreo - prestador referencia',                                                       'Categoría telemonitoreo - prestador referencia',                                                       '04966178-fc65-4e5d-bb46-9f32b828128b', true, 10),
    (gen_random_uuid(), '8624fcfe-5223-45d3-8635-448809025d20', 'HGP-MD-H06',  '', 'COMPLEJIDAD MEDIANA',                                                                                  'COMPLEJIDAD MEDIANA',                                                                                  '04966178-fc65-4e5d-bb46-9f32b828128b', true, 12),
    (gen_random_uuid(), '8624fcfe-5223-45d3-8635-448809025d20', 'HGP-MD-H07',  '', 'Modalidades intramural, telemedicina - prestador remisor - categoría telexperticia',                  'Modalidades intramural, telemedicina - prestador remisor - categoría telexperticia',                  '04966178-fc65-4e5d-bb46-9f32b828128b', true, 13),
    (gen_random_uuid(), '8624fcfe-5223-45d3-8635-448809025d20', 'HGP-MD-H08',  '', 'Modalidad telemedicina',                                                                               'Modalidad telemedicina',                                                                               '04966178-fc65-4e5d-bb46-9f32b828128b', true, 15),
    (gen_random_uuid(), '8624fcfe-5223-45d3-8635-448809025d20', 'HGP-MD-H09',  '', 'Categoría telexperticia - prestador referencia',                                                       'Categoría telexperticia - prestador referencia',                                                       '04966178-fc65-4e5d-bb46-9f32b828128b', true, 16),
    (gen_random_uuid(), '8624fcfe-5223-45d3-8635-448809025d20', 'HGP-MD-H10',  '', 'COMPLEJIDAD ALTA',                                                                                     'COMPLEJIDAD ALTA',                                                                                     '04966178-fc65-4e5d-bb46-9f32b828128b', true, 18),
    (gen_random_uuid(), '8624fcfe-5223-45d3-8635-448809025d20', 'HGP-MD-H11',  '', 'Modalidades intramural, telemedicina - prestador remisor - categoría telexperticia',                  'Modalidades intramural, telemedicina - prestador remisor - categoría telexperticia',                  '04966178-fc65-4e5d-bb46-9f32b828128b', true, 19),
    (gen_random_uuid(), '8624fcfe-5223-45d3-8635-448809025d20', 'HGP-MD-H12',  '', 'Modalidad telemedicina',                                                                               'Modalidad telemedicina',                                                                               '04966178-fc65-4e5d-bb46-9f32b828128b', true, 24),
    (gen_random_uuid(), '8624fcfe-5223-45d3-8635-448809025d20', 'HGP-MD-H13',  '', 'Categoría telexperticia - prestador referencia',                                                       'Categoría telexperticia - prestador referencia',                                                       '04966178-fc65-4e5d-bb46-9f32b828128b', true, 25),
    -- HGP_PP (11 headers)
    (gen_random_uuid(), '06be49a6-78fe-4917-949d-b39e21e62507', 'HGP-PP-H01',  '', 'COMPLEJIDAD BAJA',                                                                                    'COMPLEJIDAD BAJA',                                                                                    '04966178-fc65-4e5d-bb46-9f32b828128b', true, 1),
    (gen_random_uuid(), '06be49a6-78fe-4917-949d-b39e21e62507', 'HGP-PP-H02',  '', 'Modalidades intramural, telemedicina - prestador remisor - categoría telexperticia',                  'Modalidades intramural, telemedicina - prestador remisor - categoría telexperticia',                  '04966178-fc65-4e5d-bb46-9f32b828128b', true, 2),
    (gen_random_uuid(), '06be49a6-78fe-4917-949d-b39e21e62507', 'HGP-PP-H03',  '', 'Modalidad extramural domiciliaria, telemedicina - prestador remisor - categoría telexperticia y categoría telemonitoreo', 'Modalidad extramural domiciliaria, telemedicina - prestador remisor - categoría telexperticia y categoría telemonitoreo', '04966178-fc65-4e5d-bb46-9f32b828128b', true, 20),
    (gen_random_uuid(), '06be49a6-78fe-4917-949d-b39e21e62507', 'HGP-PP-H04',  '', 'Modalidad telemedicina',                                                                               'Modalidad telemedicina',                                                                               '04966178-fc65-4e5d-bb46-9f32b828128b', true, 33),
    (gen_random_uuid(), '06be49a6-78fe-4917-949d-b39e21e62507', 'HGP-PP-H05',  '', 'Categoría telexperticia - prestador referencia',                                                       'Categoría telexperticia - prestador referencia',                                                       '04966178-fc65-4e5d-bb46-9f32b828128b', true, 34),
    (gen_random_uuid(), '06be49a6-78fe-4917-949d-b39e21e62507', 'HGP-PP-H06',  '', 'Categoría telemonitoreo - prestador referencia',                                                       'Categoría telemonitoreo - prestador referencia',                                                       '04966178-fc65-4e5d-bb46-9f32b828128b', true, 35),
    (gen_random_uuid(), '06be49a6-78fe-4917-949d-b39e21e62507', 'HGP-PP-H07',  '', 'COMPLEJIDAD MEDIANA Y ALTA',                                                                           'COMPLEJIDAD MEDIANA Y ALTA',                                                                           '04966178-fc65-4e5d-bb46-9f32b828128b', true, 37),
    (gen_random_uuid(), '06be49a6-78fe-4917-949d-b39e21e62507', 'HGP-PP-H08',  '', 'Modalidades intramural, telemedicina - prestador remisor - categoría telexperticia',                  'Modalidades intramural, telemedicina - prestador remisor - categoría telexperticia',                  '04966178-fc65-4e5d-bb46-9f32b828128b', true, 38),
    (gen_random_uuid(), '06be49a6-78fe-4917-949d-b39e21e62507', 'HGP-PP-H09',  '', 'Modalidad telemedicina',                                                                               'Modalidad telemedicina',                                                                               '04966178-fc65-4e5d-bb46-9f32b828128b', true, 48),
    (gen_random_uuid(), '06be49a6-78fe-4917-949d-b39e21e62507', 'HGP-PP-H10',  '', 'Categoría telexperticia - prestador referencia',                                                       'Categoría telexperticia - prestador referencia',                                                       '04966178-fc65-4e5d-bb46-9f32b828128b', true, 49),
    (gen_random_uuid(), '06be49a6-78fe-4917-949d-b39e21e62507', 'HGP-PP-H11',  '', 'Categoría telemonitoreo - prestador referencia',                                                       'Categoría telemonitoreo - prestador referencia',                                                       '04966178-fc65-4e5d-bb46-9f32b828128b', true, 50),
    -- HGP_HCR (5 headers)
    (gen_random_uuid(), '7e6712c9-2a50-467b-a6e0-7bb564677dce', 'HGP-HCR-H01', '', 'COMPLEJIDADES BAJA, MEDIANA Y ALTA',                                                                  'COMPLEJIDADES BAJA, MEDIANA Y ALTA',                                                                  '04966178-fc65-4e5d-bb46-9f32b828128b', true, 1),
    (gen_random_uuid(), '7e6712c9-2a50-467b-a6e0-7bb564677dce', 'HGP-HCR-H02', '', 'Modalidades intramural, extramural domiciliaria y telemedicina - prestador remisor',                  'Modalidades intramural, extramural domiciliaria y telemedicina - prestador remisor',                  '04966178-fc65-4e5d-bb46-9f32b828128b', true, 2),
    (gen_random_uuid(), '7e6712c9-2a50-467b-a6e0-7bb564677dce', 'HGP-HCR-H03', '', 'Modalidad telemedicina',                                                                               'Modalidad telemedicina',                                                                               '04966178-fc65-4e5d-bb46-9f32b828128b', true, 7),
    (gen_random_uuid(), '7e6712c9-2a50-467b-a6e0-7bb564677dce', 'HGP-HCR-H04', '', 'Categoría telexperticia - prestador referencia',                                                       'Categoría telexperticia - prestador referencia',                                                       '04966178-fc65-4e5d-bb46-9f32b828128b', true, 8),
    (gen_random_uuid(), '7e6712c9-2a50-467b-a6e0-7bb564677dce', 'HGP-HCR-H05', '', 'Categoría telemonitoreo - prestador remisor - prestador referencia',                                  'Categoría telemonitoreo - prestador remisor - prestador referencia',                                  '04966178-fc65-4e5d-bb46-9f32b828128b', true, 9),
    -- HGP_INT (8 headers)
    (gen_random_uuid(), '25b691c2-6a3e-4211-b6eb-6bc83daf9ae6', 'HGP-INT-H01', '', 'COMPLEJIDAD BAJA',                                                                                    'COMPLEJIDAD BAJA',                                                                                    '04966178-fc65-4e5d-bb46-9f32b828128b', true, 1),
    (gen_random_uuid(), '25b691c2-6a3e-4211-b6eb-6bc83daf9ae6', 'HGP-INT-H02', '', 'Modalidad intramural',                                                                                 'Modalidad intramural',                                                                                 '04966178-fc65-4e5d-bb46-9f32b828128b', true, 2),
    (gen_random_uuid(), '25b691c2-6a3e-4211-b6eb-6bc83daf9ae6', 'HGP-INT-H03', '', 'Modalidad extramural domiciliaria',                                                                    'Modalidad extramural domiciliaria',                                                                    '04966178-fc65-4e5d-bb46-9f32b828128b', true, 9),
    (gen_random_uuid(), '25b691c2-6a3e-4211-b6eb-6bc83daf9ae6', 'HGP-INT-H04', '', 'COMPLEJIDAD MEDIANA',                                                                                  'COMPLEJIDAD MEDIANA',                                                                                  '04966178-fc65-4e5d-bb46-9f32b828128b', true, 15),
    (gen_random_uuid(), '25b691c2-6a3e-4211-b6eb-6bc83daf9ae6', 'HGP-INT-H05', '', 'COMPLEJIDAD ALTA',                                                                                     'COMPLEJIDAD ALTA',                                                                                     '04966178-fc65-4e5d-bb46-9f32b828128b', true, 24),
    (gen_random_uuid(), '25b691c2-6a3e-4211-b6eb-6bc83daf9ae6', 'HGP-INT-H06', '', 'Modalidad telemedicina',                                                                               'Modalidad telemedicina',                                                                               '04966178-fc65-4e5d-bb46-9f32b828128b', true, 29),
    (gen_random_uuid(), '25b691c2-6a3e-4211-b6eb-6bc83daf9ae6', 'HGP-INT-H07', '', 'Categoría telexperticia - prestador referencia',                                                       'Categoría telexperticia - prestador referencia',                                                       '04966178-fc65-4e5d-bb46-9f32b828128b', true, 30),
    (gen_random_uuid(), '25b691c2-6a3e-4211-b6eb-6bc83daf9ae6', 'HGP-INT-H08', '', 'Categoría telemonitoreo - prestador remisor - prestador referencia',                                  'Categoría telemonitoreo - prestador remisor - prestador referencia',                                  '04966178-fc65-4e5d-bb46-9f32b828128b', true, 31)
ON CONFLICT (code, service_id) DO NOTHING;

-- ============================================================
-- STEP 3: Link all section headers to HGP questionnaire
-- ============================================================
INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
SELECT '020ea863-5260-42ba-999e-94b6c5ef13c7', ec.id
FROM evaluation_criteria ec
JOIN evaluation_standards es ON ec.standard_id = es.id
WHERE es.service_id = '04966178-fc65-4e5d-bb46-9f32b828128b'
  AND ec.is_section_header = true
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 4: sort_order — HGP_TH
-- ============================================================
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'HGP-TH-H01' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'HGP-TH-H02' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'HGP-TH-001';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'HGP-TH-002';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'HGP-TH-003';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'HGP-TH-004';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'HGP-TH-H03' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'HGP-TH-H04' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'HGP-TH-005';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'HGP-TH-006';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'HGP-TH-007';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'HGP-TH-H05' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'HGP-TH-008';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'HGP-TH-H06' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'HGP-TH-009';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'HGP-TH-010';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'HGP-TH-H07' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'HGP-TH-011';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'HGP-TH-H08' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'HGP-TH-H09' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'HGP-TH-012';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'HGP-TH-013';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'HGP-TH-014';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'HGP-TH-015';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'HGP-TH-016';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'HGP-TH-017';
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'HGP-TH-018';
UPDATE evaluation_criteria SET sort_order = 28 WHERE code = 'HGP-TH-019';
UPDATE evaluation_criteria SET sort_order = 29 WHERE code = 'HGP-TH-020';
UPDATE evaluation_criteria SET sort_order = 30 WHERE code = 'HGP-TH-021';
UPDATE evaluation_criteria SET sort_order = 31 WHERE code = 'HGP-TH-H10' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 32 WHERE code = 'HGP-TH-H11' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 33 WHERE code = 'HGP-TH-022';
UPDATE evaluation_criteria SET sort_order = 34 WHERE code = 'HGP-TH-023';
UPDATE evaluation_criteria SET sort_order = 35 WHERE code = 'HGP-TH-024';
UPDATE evaluation_criteria SET sort_order = 36 WHERE code = 'HGP-TH-H12' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 37 WHERE code = 'HGP-TH-H13' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 38 WHERE code = 'HGP-TH-025';
UPDATE evaluation_criteria SET sort_order = 39 WHERE code = 'HGP-TH-026';
UPDATE evaluation_criteria SET sort_order = 40 WHERE code = 'HGP-TH-027';
UPDATE evaluation_criteria SET sort_order = 41 WHERE code = 'HGP-TH-028';
UPDATE evaluation_criteria SET sort_order = 42 WHERE code = 'HGP-TH-029';
UPDATE evaluation_criteria SET sort_order = 43 WHERE code = 'HGP-TH-030';
UPDATE evaluation_criteria SET sort_order = 44 WHERE code = 'HGP-TH-031';
UPDATE evaluation_criteria SET sort_order = 45 WHERE code = 'HGP-TH-032';
UPDATE evaluation_criteria SET sort_order = 46 WHERE code = 'HGP-TH-033';
UPDATE evaluation_criteria SET sort_order = 47 WHERE code = 'HGP-TH-034';
UPDATE evaluation_criteria SET sort_order = 48 WHERE code = 'HGP-TH-035';
UPDATE evaluation_criteria SET sort_order = 49 WHERE code = 'HGP-TH-H14' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 50 WHERE code = 'HGP-TH-H15' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 51 WHERE code = 'HGP-TH-036';

-- ============================================================
-- STEP 5: sort_order — HGP_INF
-- ============================================================
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'HGP-INF-H01' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'HGP-INF-H02' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'HGP-INF-001';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'HGP-INF-002';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'HGP-INF-003';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'HGP-INF-004';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'HGP-INF-005';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'HGP-INF-006';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'HGP-INF-007';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'HGP-INF-008';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'HGP-INF-009';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'HGP-INF-010';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'HGP-INF-011';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'HGP-INF-012';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'HGP-INF-013';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'HGP-INF-014';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'HGP-INF-015';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'HGP-INF-016';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'HGP-INF-017';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'HGP-INF-018';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'HGP-INF-019';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'HGP-INF-020';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'HGP-INF-021';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'HGP-INF-022';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'HGP-INF-023';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'HGP-INF-024';
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'HGP-INF-H03' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 28 WHERE code = 'HGP-INF-H04' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 29 WHERE code = 'HGP-INF-H05' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 30 WHERE code = 'HGP-INF-025';
UPDATE evaluation_criteria SET sort_order = 31 WHERE code = 'HGP-INF-H06' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 32 WHERE code = 'HGP-INF-H07' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 33 WHERE code = 'HGP-INF-026';
UPDATE evaluation_criteria SET sort_order = 34 WHERE code = 'HGP-INF-H08' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 35 WHERE code = 'HGP-INF-H09' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 36 WHERE code = 'HGP-INF-027';

-- ============================================================
-- STEP 6: sort_order — HGP_DOT
-- ============================================================
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'HGP-DOT-H01' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'HGP-DOT-H02' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'HGP-DOT-001';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'HGP-DOT-002';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'HGP-DOT-003';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'HGP-DOT-004';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'HGP-DOT-005';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'HGP-DOT-006';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'HGP-DOT-007';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'HGP-DOT-008';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'HGP-DOT-009';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'HGP-DOT-010';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'HGP-DOT-011';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'HGP-DOT-012';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'HGP-DOT-H03' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'HGP-DOT-013';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'HGP-DOT-014';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'HGP-DOT-015';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'HGP-DOT-016';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'HGP-DOT-017';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'HGP-DOT-018';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'HGP-DOT-019';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'HGP-DOT-020';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'HGP-DOT-021';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'HGP-DOT-022';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'HGP-DOT-023';
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'HGP-DOT-024';
UPDATE evaluation_criteria SET sort_order = 28 WHERE code = 'HGP-DOT-025';
UPDATE evaluation_criteria SET sort_order = 29 WHERE code = 'HGP-DOT-H04' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 30 WHERE code = 'HGP-DOT-H05' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 31 WHERE code = 'HGP-DOT-H06' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 32 WHERE code = 'HGP-DOT-026';
UPDATE evaluation_criteria SET sort_order = 33 WHERE code = 'HGP-DOT-H07' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 34 WHERE code = 'HGP-DOT-H08' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 35 WHERE code = 'HGP-DOT-027';
UPDATE evaluation_criteria SET sort_order = 36 WHERE code = 'HGP-DOT-028';
UPDATE evaluation_criteria SET sort_order = 37 WHERE code = 'HGP-DOT-029';
UPDATE evaluation_criteria SET sort_order = 38 WHERE code = 'HGP-DOT-030';
UPDATE evaluation_criteria SET sort_order = 39 WHERE code = 'HGP-DOT-031';
UPDATE evaluation_criteria SET sort_order = 40 WHERE code = 'HGP-DOT-032';
UPDATE evaluation_criteria SET sort_order = 41 WHERE code = 'HGP-DOT-033';
UPDATE evaluation_criteria SET sort_order = 42 WHERE code = 'HGP-DOT-034';
UPDATE evaluation_criteria SET sort_order = 43 WHERE code = 'HGP-DOT-035';
UPDATE evaluation_criteria SET sort_order = 44 WHERE code = 'HGP-DOT-036';
UPDATE evaluation_criteria SET sort_order = 45 WHERE code = 'HGP-DOT-037';
UPDATE evaluation_criteria SET sort_order = 46 WHERE code = 'HGP-DOT-038';
UPDATE evaluation_criteria SET sort_order = 47 WHERE code = 'HGP-DOT-039';
UPDATE evaluation_criteria SET sort_order = 48 WHERE code = 'HGP-DOT-040';
UPDATE evaluation_criteria SET sort_order = 49 WHERE code = 'HGP-DOT-041';
UPDATE evaluation_criteria SET sort_order = 50 WHERE code = 'HGP-DOT-H09' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 51 WHERE code = 'HGP-DOT-H10' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 52 WHERE code = 'HGP-DOT-042';

-- ============================================================
-- STEP 7: sort_order — HGP_MD
-- ============================================================
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'HGP-MD-H01'  AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'HGP-MD-H02'  AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'HGP-MD-001';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'HGP-MD-002';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'HGP-MD-003';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'HGP-MD-004';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'HGP-MD-005';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'HGP-MD-H03'  AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'HGP-MD-H04'  AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'HGP-MD-H05'  AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'HGP-MD-006';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'HGP-MD-H06'  AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'HGP-MD-H07'  AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'HGP-MD-007';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'HGP-MD-H08'  AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'HGP-MD-H09'  AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'HGP-MD-008';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'HGP-MD-H10'  AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'HGP-MD-H11'  AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'HGP-MD-009';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'HGP-MD-010';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'HGP-MD-011';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'HGP-MD-012';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'HGP-MD-H12'  AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'HGP-MD-H13'  AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'HGP-MD-013';

-- ============================================================
-- STEP 8: sort_order — HGP_PP
-- ============================================================
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'HGP-PP-H01'  AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'HGP-PP-H02'  AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'HGP-PP-001';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'HGP-PP-002';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'HGP-PP-003';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'HGP-PP-004';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'HGP-PP-005';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'HGP-PP-006';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'HGP-PP-007';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'HGP-PP-008';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'HGP-PP-009';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'HGP-PP-010';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'HGP-PP-011';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'HGP-PP-012';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'HGP-PP-013';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'HGP-PP-014';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'HGP-PP-015';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'HGP-PP-016';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'HGP-PP-017';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'HGP-PP-H03'  AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'HGP-PP-018';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'HGP-PP-019';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'HGP-PP-020';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'HGP-PP-021';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'HGP-PP-022';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'HGP-PP-023';
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'HGP-PP-024';
UPDATE evaluation_criteria SET sort_order = 28 WHERE code = 'HGP-PP-025';
UPDATE evaluation_criteria SET sort_order = 29 WHERE code = 'HGP-PP-026';
UPDATE evaluation_criteria SET sort_order = 30 WHERE code = 'HGP-PP-027';
UPDATE evaluation_criteria SET sort_order = 31 WHERE code = 'HGP-PP-028';
UPDATE evaluation_criteria SET sort_order = 32 WHERE code = 'HGP-PP-029';
UPDATE evaluation_criteria SET sort_order = 33 WHERE code = 'HGP-PP-H04'  AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 34 WHERE code = 'HGP-PP-H05'  AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 35 WHERE code = 'HGP-PP-H06'  AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 36 WHERE code = 'HGP-PP-030';
UPDATE evaluation_criteria SET sort_order = 37 WHERE code = 'HGP-PP-H07'  AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 38 WHERE code = 'HGP-PP-H08'  AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 39 WHERE code = 'HGP-PP-031';
UPDATE evaluation_criteria SET sort_order = 40 WHERE code = 'HGP-PP-032';
UPDATE evaluation_criteria SET sort_order = 41 WHERE code = 'HGP-PP-033';
UPDATE evaluation_criteria SET sort_order = 42 WHERE code = 'HGP-PP-034';
UPDATE evaluation_criteria SET sort_order = 43 WHERE code = 'HGP-PP-035';
UPDATE evaluation_criteria SET sort_order = 44 WHERE code = 'HGP-PP-036';
UPDATE evaluation_criteria SET sort_order = 45 WHERE code = 'HGP-PP-037';
UPDATE evaluation_criteria SET sort_order = 46 WHERE code = 'HGP-PP-038';
UPDATE evaluation_criteria SET sort_order = 47 WHERE code = 'HGP-PP-039';
UPDATE evaluation_criteria SET sort_order = 48 WHERE code = 'HGP-PP-H09'  AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 49 WHERE code = 'HGP-PP-H10'  AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 50 WHERE code = 'HGP-PP-H11'  AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 51 WHERE code = 'HGP-PP-040';

-- ============================================================
-- STEP 9: sort_order — HGP_HCR
-- ============================================================
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'HGP-HCR-H01' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'HGP-HCR-H02' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'HGP-HCR-001';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'HGP-HCR-002';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'HGP-HCR-003';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'HGP-HCR-004';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'HGP-HCR-H03' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'HGP-HCR-H04' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'HGP-HCR-H05' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'HGP-HCR-005';

-- ============================================================
-- STEP 10: sort_order — HGP_INT
-- ============================================================
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'HGP-INT-H01' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'HGP-INT-H02' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'HGP-INT-001';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'HGP-INT-002';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'HGP-INT-003';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'HGP-INT-004';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'HGP-INT-005';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'HGP-INT-006';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'HGP-INT-H03' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'HGP-INT-007';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'HGP-INT-008';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'HGP-INT-009';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'HGP-INT-010';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'HGP-INT-011';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'HGP-INT-H04' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'HGP-INT-012';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'HGP-INT-013';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'HGP-INT-014';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'HGP-INT-015';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'HGP-INT-016';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'HGP-INT-017';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'HGP-INT-018';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'HGP-INT-019';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'HGP-INT-H05' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'HGP-INT-020';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'HGP-INT-021';
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'HGP-INT-022';
UPDATE evaluation_criteria SET sort_order = 28 WHERE code = 'HGP-INT-023';
UPDATE evaluation_criteria SET sort_order = 29 WHERE code = 'HGP-INT-H06' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 30 WHERE code = 'HGP-INT-H07' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 31 WHERE code = 'HGP-INT-H08' AND service_id = '04966178-fc65-4e5d-bb46-9f32b828128b';
UPDATE evaluation_criteria SET sort_order = 32 WHERE code = 'HGP-INT-024';

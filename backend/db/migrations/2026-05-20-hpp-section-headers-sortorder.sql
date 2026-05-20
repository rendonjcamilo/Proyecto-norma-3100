-- HPP: Hospitalización Paciente Crónico - section headers and sort_order
-- Service ID:    94347eba-b5bb-4bad-8312-868b4bfacfa2
-- Questionnaire: 7e20c12d-e693-4ea0-a407-a6b7755b5255
-- Standards:
--   HPP_TH:  8bed88b6-175c-48cb-9e94-588a2bcceeea (53 criterios)
--   HPP_INF: 9c9263b2-133a-4563-af60-a76894c39ec9 (24 criterios)
--   HPP_DOT: ef2c514a-f7ba-441f-a64d-a86f3c037f45 (37 criterios)
--   HPP_MD:  b0055d44-4834-46c7-8657-9ed1b4c1f9c1 (5 criterios)
--   HPP_PP:  a2cfd635-2d43-4b48-85f8-4dabe196cba6 (34 criterios)
--   HPP_HCR: ee7d7523-b1a1-4b98-9764-3cb44e5bec3d (7 criterios)
--   HPP_INT: 8db879a5-a9e9-419a-ba8d-857a087f9ccc (13 criterios)

-- PASO 1: Marcar criterios numerados grises como is_section_header=true
UPDATE evaluation_criteria SET is_section_header = true WHERE code = 'HPP-TH-005';
UPDATE evaluation_criteria SET is_section_header = true WHERE code = 'HPP-TH-021';
UPDATE evaluation_criteria SET is_section_header = true WHERE code = 'HPP-TH-037';
UPDATE evaluation_criteria SET is_section_header = true WHERE code = 'HPP-INF-019';
UPDATE evaluation_criteria SET is_section_header = true WHERE code = 'HPP-DOT-005';
UPDATE evaluation_criteria SET is_section_header = true WHERE code = 'HPP-PP-022';

-- PASO 2: Insertar headers puros
INSERT INTO evaluation_criteria (id, standard_id, code, number, name, description, service_id, is_section_header, sort_order)
VALUES
    -- HPP_TH (23 headers)
    (gen_random_uuid(), '8bed88b6-175c-48cb-9e94-588a2bcceeea', 'HPP-TH-H01', '', 'Hospitalización del paciente crónico sin ventilador',                                       'Hospitalización del paciente crónico sin ventilador',                                       '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 1),
    (gen_random_uuid(), '8bed88b6-175c-48cb-9e94-588a2bcceeea', 'HPP-TH-H02', '', 'Modalidades intramural y extramural domiciliaria',                                           'Modalidades intramural y extramural domiciliaria',                                           '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 2),
    (gen_random_uuid(), '8bed88b6-175c-48cb-9e94-588a2bcceeea', 'HPP-TH-H03', '', 'Modalidad telemedicina',                                                                     'Modalidad telemedicina',                                                                     '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 12),
    (gen_random_uuid(), '8bed88b6-175c-48cb-9e94-588a2bcceeea', 'HPP-TH-H04', '', 'Categoría telexperticia - prestador remisor',                                                'Categoría telexperticia - prestador remisor',                                                '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 13),
    (gen_random_uuid(), '8bed88b6-175c-48cb-9e94-588a2bcceeea', 'HPP-TH-H05', '', 'Categoría telexperticia - prestador de referencia',                                          'Categoría telexperticia - prestador de referencia',                                          '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 17),
    (gen_random_uuid(), '8bed88b6-175c-48cb-9e94-588a2bcceeea', 'HPP-TH-H06', '', 'Categoría telemonitoreo - prestador remisor en modalidad extramural domiciliaria',           'Categoría telemonitoreo - prestador remisor en modalidad extramural domiciliaria',           '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 21),
    (gen_random_uuid(), '8bed88b6-175c-48cb-9e94-588a2bcceeea', 'HPP-TH-H07', '', 'Categoría telemonitoreo - prestador de referencia',                                          'Categoría telemonitoreo - prestador de referencia',                                          '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 24),
    (gen_random_uuid(), '8bed88b6-175c-48cb-9e94-588a2bcceeea', 'HPP-TH-H08', '', 'Complejidad mediana',                                                                        'Complejidad mediana',                                                                        '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 26),
    (gen_random_uuid(), '8bed88b6-175c-48cb-9e94-588a2bcceeea', 'HPP-TH-H09', '', 'Hospitalización del paciente crónico sin ventilador',                                       'Hospitalización del paciente crónico sin ventilador',                                       '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 27),
    (gen_random_uuid(), '8bed88b6-175c-48cb-9e94-588a2bcceeea', 'HPP-TH-H10', '', 'Modalidades intramural y extramural domiciliaria',                                           'Modalidades intramural y extramural domiciliaria',                                           '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 28),
    (gen_random_uuid(), '8bed88b6-175c-48cb-9e94-588a2bcceeea', 'HPP-TH-H11', '', 'Modalidad telemedicina',                                                                     'Modalidad telemedicina',                                                                     '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 34),
    (gen_random_uuid(), '8bed88b6-175c-48cb-9e94-588a2bcceeea', 'HPP-TH-H12', '', 'Categoría telexperticia - prestador remisor',                                                'Categoría telexperticia - prestador remisor',                                                '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 35),
    (gen_random_uuid(), '8bed88b6-175c-48cb-9e94-588a2bcceeea', 'HPP-TH-H13', '', 'Categoría telexperticia - prestador de referencia',                                          'Categoría telexperticia - prestador de referencia',                                          '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 39),
    (gen_random_uuid(), '8bed88b6-175c-48cb-9e94-588a2bcceeea', 'HPP-TH-H14', '', 'Categoría telemonitoreo - prestador remisor en modalidad extramural domiciliaria',           'Categoría telemonitoreo - prestador remisor en modalidad extramural domiciliaria',           '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 43),
    (gen_random_uuid(), '8bed88b6-175c-48cb-9e94-588a2bcceeea', 'HPP-TH-H15', '', 'Categoría telemonitoreo - prestador de referencia',                                          'Categoría telemonitoreo - prestador de referencia',                                          '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 46),
    (gen_random_uuid(), '8bed88b6-175c-48cb-9e94-588a2bcceeea', 'HPP-TH-H16', '', 'Complejidad mediana',                                                                        'Complejidad mediana',                                                                        '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 48),
    (gen_random_uuid(), '8bed88b6-175c-48cb-9e94-588a2bcceeea', 'HPP-TH-H17', '', 'Hospitalización del paciente crónico con ventilador',                                        'Hospitalización del paciente crónico con ventilador',                                        '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 49),
    (gen_random_uuid(), '8bed88b6-175c-48cb-9e94-588a2bcceeea', 'HPP-TH-H18', '', 'Modalidades intramural y extramural domiciliaria',                                           'Modalidades intramural y extramural domiciliaria',                                           '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 50),
    (gen_random_uuid(), '8bed88b6-175c-48cb-9e94-588a2bcceeea', 'HPP-TH-H19', '', 'Modalidad telemedicina',                                                                     'Modalidad telemedicina',                                                                     '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 63),
    (gen_random_uuid(), '8bed88b6-175c-48cb-9e94-588a2bcceeea', 'HPP-TH-H20', '', 'Categoría telexperticia - prestador remisor',                                                'Categoría telexperticia - prestador remisor',                                                '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 64),
    (gen_random_uuid(), '8bed88b6-175c-48cb-9e94-588a2bcceeea', 'HPP-TH-H21', '', 'Categoría telexperticia - prestador de referencia',                                          'Categoría telexperticia - prestador de referencia',                                          '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 68),
    (gen_random_uuid(), '8bed88b6-175c-48cb-9e94-588a2bcceeea', 'HPP-TH-H22', '', 'Categoría telemonitoreo - prestador remisor en modalidad extramural domiciliaria',           'Categoría telemonitoreo - prestador remisor en modalidad extramural domiciliaria',           '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 72),
    (gen_random_uuid(), '8bed88b6-175c-48cb-9e94-588a2bcceeea', 'HPP-TH-H23', '', 'Categoría telemonitoreo - prestador de referencia',                                          'Categoría telemonitoreo - prestador de referencia',                                          '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 75),
    -- HPP_INF (6 headers)
    (gen_random_uuid(), '9c9263b2-133a-4563-af60-a76894c39ec9', 'HPP-INF-H01', '', 'Complejidades baja y mediana',                                                              'Complejidades baja y mediana',                                                              '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 1),
    (gen_random_uuid(), '9c9263b2-133a-4563-af60-a76894c39ec9', 'HPP-INF-H02', '', 'Hospitalización del paciente crónico con y sin ventilador',                                 'Hospitalización del paciente crónico con y sin ventilador',                                 '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 2),
    (gen_random_uuid(), '9c9263b2-133a-4563-af60-a76894c39ec9', 'HPP-INF-H03', '', 'Modalidades intramural, telemedicina - prestador remisor - categoría telexperticia',        'Modalidades intramural, telemedicina - prestador remisor - categoría telexperticia',        '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 3),
    (gen_random_uuid(), '9c9263b2-133a-4563-af60-a76894c39ec9', 'HPP-INF-H04', '', 'Modalidad extramural domiciliaria y telemedicina',                                          'Modalidad extramural domiciliaria y telemedicina',                                          '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 27),
    (gen_random_uuid(), '9c9263b2-133a-4563-af60-a76894c39ec9', 'HPP-INF-H05', '', 'Categoría telexperticia - prestador remisor - prestador referencia',                        'Categoría telexperticia - prestador remisor - prestador referencia',                        '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 28),
    (gen_random_uuid(), '9c9263b2-133a-4563-af60-a76894c39ec9', 'HPP-INF-H06', '', 'Categoría telemonitoreo - prestador remisor - prestador referencia',                        'Categoría telemonitoreo - prestador remisor - prestador referencia',                        '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 29),
    -- HPP_DOT (11 headers)
    (gen_random_uuid(), 'ef2c514a-f7ba-441f-a64d-a86f3c037f45', 'HPP-DOT-H01', '', 'Complejidades baja y mediana',                                                              'Complejidades baja y mediana',                                                              '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 1),
    (gen_random_uuid(), 'ef2c514a-f7ba-441f-a64d-a86f3c037f45', 'HPP-DOT-H02', '', 'Hospitalización del paciente crónico sin ventilador',                                       'Hospitalización del paciente crónico sin ventilador',                                       '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 2),
    (gen_random_uuid(), 'ef2c514a-f7ba-441f-a64d-a86f3c037f45', 'HPP-DOT-H03', '', 'Modalidades intramural, telemedicina - prestador remisor - categoría telexperticia',        'Modalidades intramural, telemedicina - prestador remisor - categoría telexperticia',        '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 3),
    (gen_random_uuid(), 'ef2c514a-f7ba-441f-a64d-a86f3c037f45', 'HPP-DOT-H04', '', 'Modalidad extramural domiciliaria, telemedicina - prestador remisor - categoría telexperticia', 'Modalidad extramural domiciliaria, telemedicina - prestador remisor - categoría telexperticia', '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 17),
    (gen_random_uuid(), 'ef2c514a-f7ba-441f-a64d-a86f3c037f45', 'HPP-DOT-H05', '', 'Modalidad telemedicina',                                                                     'Modalidad telemedicina',                                                                     '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 32),
    (gen_random_uuid(), 'ef2c514a-f7ba-441f-a64d-a86f3c037f45', 'HPP-DOT-H06', '', 'Categoría telexperticia - prestador referencia',                                             'Categoría telexperticia - prestador referencia',                                             '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 33),
    (gen_random_uuid(), 'ef2c514a-f7ba-441f-a64d-a86f3c037f45', 'HPP-DOT-H07', '', 'Categoría telemonitoreo - prestador referencia',                                             'Categoría telemonitoreo - prestador referencia',                                             '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 34),
    (gen_random_uuid(), 'ef2c514a-f7ba-441f-a64d-a86f3c037f45', 'HPP-DOT-H08', '', 'Complejidad mediana',                                                                        'Complejidad mediana',                                                                        '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 36),
    (gen_random_uuid(), 'ef2c514a-f7ba-441f-a64d-a86f3c037f45', 'HPP-DOT-H09', '', 'Hospitalización del paciente crónico con ventilador',                                        'Hospitalización del paciente crónico con ventilador',                                        '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 37),
    (gen_random_uuid(), 'ef2c514a-f7ba-441f-a64d-a86f3c037f45', 'HPP-DOT-H10', '', 'Modalidades intramural, telemedicina - prestador remisor - categoría telexperticia',        'Modalidades intramural, telemedicina - prestador remisor - categoría telexperticia',        '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 38),
    (gen_random_uuid(), 'ef2c514a-f7ba-441f-a64d-a86f3c037f45', 'HPP-DOT-H11', '', 'Modalidad extramural domiciliaria, telemedicina - prestador remisor - categoría telexperticia', 'Modalidad extramural domiciliaria, telemedicina - prestador remisor - categoría telexperticia', '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 43),
    -- HPP_MD (6 headers)
    (gen_random_uuid(), 'b0055d44-4834-46c7-8657-9ed1b4c1f9c1', 'HPP-MD-H01',  '', 'Complejidades baja y mediana',                                                              'Complejidades baja y mediana',                                                              '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 1),
    (gen_random_uuid(), 'b0055d44-4834-46c7-8657-9ed1b4c1f9c1', 'HPP-MD-H02',  '', 'Hospitalización del paciente crónico con y sin ventilador',                                 'Hospitalización del paciente crónico con y sin ventilador',                                 '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 2),
    (gen_random_uuid(), 'b0055d44-4834-46c7-8657-9ed1b4c1f9c1', 'HPP-MD-H03',  '', 'Modalidades intramural, extramural domiciliaria, telemedicina - prestador remisor - categoría telexperticia', 'Modalidades intramural, extramural domiciliaria, telemedicina - prestador remisor - categoría telexperticia', '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 3),
    (gen_random_uuid(), 'b0055d44-4834-46c7-8657-9ed1b4c1f9c1', 'HPP-MD-H04',  '', 'Modalidad telemedicina',                                                                     'Modalidad telemedicina',                                                                     '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 8),
    (gen_random_uuid(), 'b0055d44-4834-46c7-8657-9ed1b4c1f9c1', 'HPP-MD-H05',  '', 'Categoría telexperticia - prestador referencia',                                             'Categoría telexperticia - prestador referencia',                                             '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 9),
    (gen_random_uuid(), 'b0055d44-4834-46c7-8657-9ed1b4c1f9c1', 'HPP-MD-H06',  '', 'Categoría telemonitoreo - prestador referencia',                                             'Categoría telemonitoreo - prestador referencia',                                             '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 10),
    -- HPP_PP (6 headers)
    (gen_random_uuid(), 'a2cfd635-2d43-4b48-85f8-4dabe196cba6', 'HPP-PP-H01',  '', 'Complejidades baja y mediana',                                                              'Complejidades baja y mediana',                                                              '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 1),
    (gen_random_uuid(), 'a2cfd635-2d43-4b48-85f8-4dabe196cba6', 'HPP-PP-H02',  '', 'Hospitalización del paciente crónico con y sin ventilador',                                 'Hospitalización del paciente crónico con y sin ventilador',                                 '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 2),
    (gen_random_uuid(), 'a2cfd635-2d43-4b48-85f8-4dabe196cba6', 'HPP-PP-H03',  '', 'Modalidades intramural, extramural domiciliaria, telemedicina - prestador remisor - categoría telexperticia', 'Modalidades intramural, extramural domiciliaria, telemedicina - prestador remisor - categoría telexperticia', '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 3),
    (gen_random_uuid(), 'a2cfd635-2d43-4b48-85f8-4dabe196cba6', 'HPP-PP-H04',  '', 'Modalidad telemedicina',                                                                     'Modalidad telemedicina',                                                                     '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 37),
    (gen_random_uuid(), 'a2cfd635-2d43-4b48-85f8-4dabe196cba6', 'HPP-PP-H05',  '', 'Categoría telexperticia - prestador referencia',                                             'Categoría telexperticia - prestador referencia',                                             '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 38),
    (gen_random_uuid(), 'a2cfd635-2d43-4b48-85f8-4dabe196cba6', 'HPP-PP-H06',  '', 'Categoría telemonitoreo - prestador referencia',                                             'Categoría telemonitoreo - prestador referencia',                                             '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 39),
    -- HPP_HCR (7 headers)
    (gen_random_uuid(), 'ee7d7523-b1a1-4b98-9764-3cb44e5bec3d', 'HPP-HCR-H01', '', 'Complejidades baja y mediana',                                                              'Complejidades baja y mediana',                                                              '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 1),
    (gen_random_uuid(), 'ee7d7523-b1a1-4b98-9764-3cb44e5bec3d', 'HPP-HCR-H02', '', 'Hospitalización de paciente crónico con y sin ventilador',                                  'Hospitalización de paciente crónico con y sin ventilador',                                  '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 2),
    (gen_random_uuid(), 'ee7d7523-b1a1-4b98-9764-3cb44e5bec3d', 'HPP-HCR-H03', '', 'Modalidades intramural, telemedicina - prestador remisor - categoría telexperticia y categoría telemonitoreo', 'Modalidades intramural, telemedicina - prestador remisor - categoría telexperticia y categoría telemonitoreo', '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 3),
    (gen_random_uuid(), 'ee7d7523-b1a1-4b98-9764-3cb44e5bec3d', 'HPP-HCR-H04', '', 'Modalidad extramural domiciliaria, prestador remisor - categoría telexperticia y categoría telemonitoreo', 'Modalidad extramural domiciliaria, prestador remisor - categoría telexperticia y categoría telemonitoreo', '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 5),
    (gen_random_uuid(), 'ee7d7523-b1a1-4b98-9764-3cb44e5bec3d', 'HPP-HCR-H05', '', 'Modalidad telemedicina',                                                                     'Modalidad telemedicina',                                                                     '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 11),
    (gen_random_uuid(), 'ee7d7523-b1a1-4b98-9764-3cb44e5bec3d', 'HPP-HCR-H06', '', 'Categoría telexperticia - prestador referencia',                                             'Categoría telexperticia - prestador referencia',                                             '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 12),
    (gen_random_uuid(), 'ee7d7523-b1a1-4b98-9764-3cb44e5bec3d', 'HPP-HCR-H07', '', 'Categoría telemonitoreo - prestador referencia',                                             'Categoría telemonitoreo - prestador referencia',                                             '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 13),
    -- HPP_INT (7 headers)
    (gen_random_uuid(), '8db879a5-a9e9-419a-ba8d-857a087f9ccc', 'HPP-INT-H01', '', 'Complejidades baja y mediana',                                                              'Complejidades baja y mediana',                                                              '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 1),
    (gen_random_uuid(), '8db879a5-a9e9-419a-ba8d-857a087f9ccc', 'HPP-INT-H02', '', 'Hospitalización de paciente crónico con y sin ventilador',                                  'Hospitalización de paciente crónico con y sin ventilador',                                  '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 2),
    (gen_random_uuid(), '8db879a5-a9e9-419a-ba8d-857a087f9ccc', 'HPP-INT-H03', '', 'Modalidad intramural',                                                                       'Modalidad intramural',                                                                       '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 3),
    (gen_random_uuid(), '8db879a5-a9e9-419a-ba8d-857a087f9ccc', 'HPP-INT-H04', '', 'Modalidad extramural domiciliaria',                                                          'Modalidad extramural domiciliaria',                                                          '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 10),
    (gen_random_uuid(), '8db879a5-a9e9-419a-ba8d-857a087f9ccc', 'HPP-INT-H05', '', 'Modalidad telemedicina',                                                                     'Modalidad telemedicina',                                                                     '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 17),
    (gen_random_uuid(), '8db879a5-a9e9-419a-ba8d-857a087f9ccc', 'HPP-INT-H06', '', 'Categoría telexperticia - prestador remisor - prestador referencia',                        'Categoría telexperticia - prestador remisor - prestador referencia',                        '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 18),
    (gen_random_uuid(), '8db879a5-a9e9-419a-ba8d-857a087f9ccc', 'HPP-INT-H07', '', 'Categoría telemonitoreo - prestador remisor - prestador referencia',                        'Categoría telemonitoreo - prestador remisor - prestador referencia',                        '94347eba-b5bb-4bad-8312-868b4bfacfa2', true, 19)
ON CONFLICT (code, service_id) DO NOTHING;

-- PASO 3: Vincular todos los headers al cuestionario
INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
SELECT '7e20c12d-e693-4ea0-a407-a6b7755b5255', ec.id
FROM evaluation_criteria ec
JOIN evaluation_standards es ON ec.standard_id = es.id
WHERE es.service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2'
  AND ec.is_section_header = true
ON CONFLICT DO NOTHING;

-- PASO 4: sort_order HPP_TH (53 criterios + 23 headers = 76 filas)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'HPP-TH-H01' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'HPP-TH-H02' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'HPP-TH-001';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'HPP-TH-002';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'HPP-TH-003';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'HPP-TH-004';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'HPP-TH-005';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'HPP-TH-006';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'HPP-TH-007';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'HPP-TH-008';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'HPP-TH-009';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'HPP-TH-H03' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'HPP-TH-H04' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'HPP-TH-010';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'HPP-TH-011';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'HPP-TH-012';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'HPP-TH-H05' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'HPP-TH-013';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'HPP-TH-014';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'HPP-TH-015';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'HPP-TH-H06' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'HPP-TH-016';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'HPP-TH-017';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'HPP-TH-H07' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'HPP-TH-018';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'HPP-TH-H08' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'HPP-TH-H09' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 28 WHERE code = 'HPP-TH-H10' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 29 WHERE code = 'HPP-TH-019';
UPDATE evaluation_criteria SET sort_order = 30 WHERE code = 'HPP-TH-020';
UPDATE evaluation_criteria SET sort_order = 31 WHERE code = 'HPP-TH-021';
UPDATE evaluation_criteria SET sort_order = 32 WHERE code = 'HPP-TH-022';
UPDATE evaluation_criteria SET sort_order = 33 WHERE code = 'HPP-TH-023';
UPDATE evaluation_criteria SET sort_order = 34 WHERE code = 'HPP-TH-H11' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 35 WHERE code = 'HPP-TH-H12' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 36 WHERE code = 'HPP-TH-024';
UPDATE evaluation_criteria SET sort_order = 37 WHERE code = 'HPP-TH-025';
UPDATE evaluation_criteria SET sort_order = 38 WHERE code = 'HPP-TH-026';
UPDATE evaluation_criteria SET sort_order = 39 WHERE code = 'HPP-TH-H13' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 40 WHERE code = 'HPP-TH-027';
UPDATE evaluation_criteria SET sort_order = 41 WHERE code = 'HPP-TH-028';
UPDATE evaluation_criteria SET sort_order = 42 WHERE code = 'HPP-TH-029';
UPDATE evaluation_criteria SET sort_order = 43 WHERE code = 'HPP-TH-H14' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 44 WHERE code = 'HPP-TH-030';
UPDATE evaluation_criteria SET sort_order = 45 WHERE code = 'HPP-TH-031';
UPDATE evaluation_criteria SET sort_order = 46 WHERE code = 'HPP-TH-H15' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 47 WHERE code = 'HPP-TH-032';
UPDATE evaluation_criteria SET sort_order = 48 WHERE code = 'HPP-TH-H16' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 49 WHERE code = 'HPP-TH-H17' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 50 WHERE code = 'HPP-TH-H18' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 51 WHERE code = 'HPP-TH-033';
UPDATE evaluation_criteria SET sort_order = 52 WHERE code = 'HPP-TH-034';
UPDATE evaluation_criteria SET sort_order = 53 WHERE code = 'HPP-TH-035';
UPDATE evaluation_criteria SET sort_order = 54 WHERE code = 'HPP-TH-036';
UPDATE evaluation_criteria SET sort_order = 55 WHERE code = 'HPP-TH-037';
UPDATE evaluation_criteria SET sort_order = 56 WHERE code = 'HPP-TH-038';
UPDATE evaluation_criteria SET sort_order = 57 WHERE code = 'HPP-TH-039';
UPDATE evaluation_criteria SET sort_order = 58 WHERE code = 'HPP-TH-040';
UPDATE evaluation_criteria SET sort_order = 59 WHERE code = 'HPP-TH-041';
UPDATE evaluation_criteria SET sort_order = 60 WHERE code = 'HPP-TH-042';
UPDATE evaluation_criteria SET sort_order = 61 WHERE code = 'HPP-TH-043';
UPDATE evaluation_criteria SET sort_order = 62 WHERE code = 'HPP-TH-044';
UPDATE evaluation_criteria SET sort_order = 63 WHERE code = 'HPP-TH-H19' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 64 WHERE code = 'HPP-TH-H20' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 65 WHERE code = 'HPP-TH-045';
UPDATE evaluation_criteria SET sort_order = 66 WHERE code = 'HPP-TH-046';
UPDATE evaluation_criteria SET sort_order = 67 WHERE code = 'HPP-TH-047';
UPDATE evaluation_criteria SET sort_order = 68 WHERE code = 'HPP-TH-H21' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 69 WHERE code = 'HPP-TH-048';
UPDATE evaluation_criteria SET sort_order = 70 WHERE code = 'HPP-TH-049';
UPDATE evaluation_criteria SET sort_order = 71 WHERE code = 'HPP-TH-050';
UPDATE evaluation_criteria SET sort_order = 72 WHERE code = 'HPP-TH-H22' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 73 WHERE code = 'HPP-TH-051';
UPDATE evaluation_criteria SET sort_order = 74 WHERE code = 'HPP-TH-052';
UPDATE evaluation_criteria SET sort_order = 75 WHERE code = 'HPP-TH-H23' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 76 WHERE code = 'HPP-TH-053';

-- PASO 5: sort_order HPP_INF (24 criterios + 6 headers = 30 filas)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'HPP-INF-H01' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'HPP-INF-H02' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'HPP-INF-H03' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'HPP-INF-001';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'HPP-INF-002';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'HPP-INF-003';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'HPP-INF-004';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'HPP-INF-005';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'HPP-INF-006';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'HPP-INF-007';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'HPP-INF-008';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'HPP-INF-009';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'HPP-INF-010';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'HPP-INF-011';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'HPP-INF-012';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'HPP-INF-013';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'HPP-INF-014';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'HPP-INF-015';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'HPP-INF-016';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'HPP-INF-017';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'HPP-INF-018';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'HPP-INF-019';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'HPP-INF-020';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'HPP-INF-021';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'HPP-INF-022';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'HPP-INF-023';
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'HPP-INF-H04' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 28 WHERE code = 'HPP-INF-H05' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 29 WHERE code = 'HPP-INF-H06' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 30 WHERE code = 'HPP-INF-024';

-- PASO 6: sort_order HPP_DOT (37 criterios + 11 headers = 48 filas)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'HPP-DOT-H01' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'HPP-DOT-H02' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'HPP-DOT-H03' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'HPP-DOT-001';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'HPP-DOT-002';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'HPP-DOT-003';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'HPP-DOT-004';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'HPP-DOT-005';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'HPP-DOT-006';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'HPP-DOT-007';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'HPP-DOT-008';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'HPP-DOT-009';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'HPP-DOT-010';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'HPP-DOT-011';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'HPP-DOT-012';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'HPP-DOT-013';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'HPP-DOT-H04' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'HPP-DOT-014';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'HPP-DOT-015';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'HPP-DOT-016';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'HPP-DOT-017';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'HPP-DOT-018';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'HPP-DOT-019';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'HPP-DOT-020';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'HPP-DOT-021';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'HPP-DOT-022';
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'HPP-DOT-023';
UPDATE evaluation_criteria SET sort_order = 28 WHERE code = 'HPP-DOT-024';
UPDATE evaluation_criteria SET sort_order = 29 WHERE code = 'HPP-DOT-025';
UPDATE evaluation_criteria SET sort_order = 30 WHERE code = 'HPP-DOT-026';
UPDATE evaluation_criteria SET sort_order = 31 WHERE code = 'HPP-DOT-027';
UPDATE evaluation_criteria SET sort_order = 32 WHERE code = 'HPP-DOT-H05' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 33 WHERE code = 'HPP-DOT-H06' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 34 WHERE code = 'HPP-DOT-H07' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 35 WHERE code = 'HPP-DOT-028';
UPDATE evaluation_criteria SET sort_order = 36 WHERE code = 'HPP-DOT-H08' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 37 WHERE code = 'HPP-DOT-H09' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 38 WHERE code = 'HPP-DOT-H10' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 39 WHERE code = 'HPP-DOT-029';
UPDATE evaluation_criteria SET sort_order = 40 WHERE code = 'HPP-DOT-030';
UPDATE evaluation_criteria SET sort_order = 41 WHERE code = 'HPP-DOT-031';
UPDATE evaluation_criteria SET sort_order = 42 WHERE code = 'HPP-DOT-032';
UPDATE evaluation_criteria SET sort_order = 43 WHERE code = 'HPP-DOT-H11' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 44 WHERE code = 'HPP-DOT-033';
UPDATE evaluation_criteria SET sort_order = 45 WHERE code = 'HPP-DOT-034';
UPDATE evaluation_criteria SET sort_order = 46 WHERE code = 'HPP-DOT-035';
UPDATE evaluation_criteria SET sort_order = 47 WHERE code = 'HPP-DOT-036';
UPDATE evaluation_criteria SET sort_order = 48 WHERE code = 'HPP-DOT-037';

-- PASO 7: sort_order HPP_MD (5 criterios + 6 headers = 11 filas)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'HPP-MD-H01' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'HPP-MD-H02' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'HPP-MD-H03' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'HPP-MD-001';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'HPP-MD-002';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'HPP-MD-003';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'HPP-MD-004';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'HPP-MD-H04' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'HPP-MD-H05' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'HPP-MD-H06' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'HPP-MD-005';

-- PASO 8: sort_order HPP_PP (34 criterios + 6 headers = 40 filas)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'HPP-PP-H01' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'HPP-PP-H02' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'HPP-PP-H03' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'HPP-PP-001';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'HPP-PP-002';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'HPP-PP-003';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'HPP-PP-004';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'HPP-PP-005';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'HPP-PP-006';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'HPP-PP-007';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'HPP-PP-008';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'HPP-PP-009';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'HPP-PP-010';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'HPP-PP-011';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'HPP-PP-012';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'HPP-PP-013';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'HPP-PP-014';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'HPP-PP-015';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'HPP-PP-016';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'HPP-PP-017';
UPDATE evaluation_criteria SET sort_order = 21 WHERE code = 'HPP-PP-018';
UPDATE evaluation_criteria SET sort_order = 22 WHERE code = 'HPP-PP-019';
UPDATE evaluation_criteria SET sort_order = 23 WHERE code = 'HPP-PP-020';
UPDATE evaluation_criteria SET sort_order = 24 WHERE code = 'HPP-PP-021';
UPDATE evaluation_criteria SET sort_order = 25 WHERE code = 'HPP-PP-022';
UPDATE evaluation_criteria SET sort_order = 26 WHERE code = 'HPP-PP-023';
UPDATE evaluation_criteria SET sort_order = 27 WHERE code = 'HPP-PP-024';
UPDATE evaluation_criteria SET sort_order = 28 WHERE code = 'HPP-PP-025';
UPDATE evaluation_criteria SET sort_order = 29 WHERE code = 'HPP-PP-026';
UPDATE evaluation_criteria SET sort_order = 30 WHERE code = 'HPP-PP-027';
UPDATE evaluation_criteria SET sort_order = 31 WHERE code = 'HPP-PP-028';
UPDATE evaluation_criteria SET sort_order = 32 WHERE code = 'HPP-PP-029';
UPDATE evaluation_criteria SET sort_order = 33 WHERE code = 'HPP-PP-030';
UPDATE evaluation_criteria SET sort_order = 34 WHERE code = 'HPP-PP-031';
UPDATE evaluation_criteria SET sort_order = 35 WHERE code = 'HPP-PP-032';
UPDATE evaluation_criteria SET sort_order = 36 WHERE code = 'HPP-PP-033';
UPDATE evaluation_criteria SET sort_order = 37 WHERE code = 'HPP-PP-H04' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 38 WHERE code = 'HPP-PP-H05' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 39 WHERE code = 'HPP-PP-H06' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 40 WHERE code = 'HPP-PP-034';

-- PASO 9: sort_order HPP_HCR (7 criterios + 7 headers = 14 filas)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'HPP-HCR-H01' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'HPP-HCR-H02' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'HPP-HCR-H03' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'HPP-HCR-001';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'HPP-HCR-H04' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'HPP-HCR-002';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'HPP-HCR-003';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'HPP-HCR-004';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'HPP-HCR-005';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'HPP-HCR-006';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'HPP-HCR-H05' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'HPP-HCR-H06' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'HPP-HCR-H07' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'HPP-HCR-007';

-- PASO 10: sort_order HPP_INT (13 criterios + 7 headers = 20 filas)
UPDATE evaluation_criteria SET sort_order = 1  WHERE code = 'HPP-INT-H01' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 2  WHERE code = 'HPP-INT-H02' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 3  WHERE code = 'HPP-INT-H03' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 4  WHERE code = 'HPP-INT-001';
UPDATE evaluation_criteria SET sort_order = 5  WHERE code = 'HPP-INT-002';
UPDATE evaluation_criteria SET sort_order = 6  WHERE code = 'HPP-INT-003';
UPDATE evaluation_criteria SET sort_order = 7  WHERE code = 'HPP-INT-004';
UPDATE evaluation_criteria SET sort_order = 8  WHERE code = 'HPP-INT-005';
UPDATE evaluation_criteria SET sort_order = 9  WHERE code = 'HPP-INT-006';
UPDATE evaluation_criteria SET sort_order = 10 WHERE code = 'HPP-INT-H04' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 11 WHERE code = 'HPP-INT-007';
UPDATE evaluation_criteria SET sort_order = 12 WHERE code = 'HPP-INT-008';
UPDATE evaluation_criteria SET sort_order = 13 WHERE code = 'HPP-INT-009';
UPDATE evaluation_criteria SET sort_order = 14 WHERE code = 'HPP-INT-010';
UPDATE evaluation_criteria SET sort_order = 15 WHERE code = 'HPP-INT-011';
UPDATE evaluation_criteria SET sort_order = 16 WHERE code = 'HPP-INT-012';
UPDATE evaluation_criteria SET sort_order = 17 WHERE code = 'HPP-INT-H05' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 18 WHERE code = 'HPP-INT-H06' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 19 WHERE code = 'HPP-INT-H07' AND service_id = '94347eba-b5bb-4bad-8312-868b4bfacfa2';
UPDATE evaluation_criteria SET sort_order = 20 WHERE code = 'HPP-INT-013';

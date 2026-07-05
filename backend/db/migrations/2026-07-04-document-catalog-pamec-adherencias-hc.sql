-- ============================================================
-- Migración: Nuevas categorías en Gestión Documental
-- 1. PAMEC extendido a profesionales independientes
-- 2. Adherencias (ambos tipos de prestador)
-- 3. Auditoría de Historia Clínica (ambos tipos de prestador)
-- ============================================================

-- 1. PAMEC PARA PROFESIONALES INDEPENDIENTES
INSERT INTO document_catalog
  (code, name, description, category, standard_reference, is_mandatory, applies_to_all, provider_type)
VALUES
  ('IND-PAM-001', 'PAMEC teórico y cronograma',      'Documento teórico del PAMEC con cronograma de actividades.',                        'PAMEC', 'PAM', true, true, 'independiente'),
  ('IND-PAM-002', 'Matriz consolidada del PAMEC',    'Matriz consolidada con todos los procesos del PAMEC.',                              'PAMEC', 'PAM', true, true, 'independiente'),
  ('IND-PAM-003', 'Autoevaluación institucional',    'Autoevaluación de la calidad de la atención realizada por la institución.',         'PAMEC', 'PAM', true, true, 'independiente'),
  ('IND-PAM-004', 'Selección de procesos a mejorar', 'Documento de selección de procesos prioritarios a mejorar.',                       'PAMEC', 'PAM', true, true, 'independiente'),
  ('IND-PAM-005', 'Priorización de procesos',        'Matriz de priorización de procesos para el mejoramiento continuo.',                 'PAMEC', 'PAM', true, true, 'independiente'),
  ('IND-PAM-006', 'Definición de calidad esperada',  'Documento de definición de la calidad esperada en los procesos priorizados.',      'PAMEC', 'PAM', true, true, 'independiente'),
  ('IND-PAM-007', 'Medición inicial del desempeño',  'Registro de medición inicial del desempeño de los procesos seleccionados.',        'PAMEC', 'PAM', true, true, 'independiente'),
  ('IND-PAM-008', 'Formulación del plan de acción',  'Plan de acción formulado para el mejoramiento de los procesos priorizados.',       'PAMEC', 'PAM', true, true, 'independiente'),
  ('IND-PAM-009', 'Ejecución del plan de acción',    'Soportes de ejecución de las actividades del plan de acción del PAMEC.',          'PAMEC', 'PAM', true, true, 'independiente'),
  ('IND-PAM-010', 'Evaluación del plan de acción',   'Informe de evaluación de los resultados del plan de acción ejecutado.',            'PAMEC', 'PAM', true, true, 'independiente'),
  ('IND-PAM-011', 'Aprendizaje organizacional',      'Documento de aprendizaje organizacional derivado del ciclo PAMEC.',               'PAMEC', 'PAM', true, true, 'independiente')
ON CONFLICT (code) DO NOTHING;

-- 2. ADHERENCIAS — IPS
INSERT INTO document_catalog
  (code, name, description, category, standard_reference, is_mandatory, applies_to_all, provider_type)
VALUES
  ('IPS-ADHER-001', 'Medición adherencia bioseguridad',
   'Lista de chequeo de adherencia a protocolos de bioseguridad: uso de EPP, esterilización, manejo de residuos y limpieza y desinfección.',
   'Adherencias', 'ADHER', true, true, 'ips'),
  ('IPS-ADHER-002', 'Medición adherencia seguridad del paciente',
   'Lista de chequeo FCLI-014: identificación del paciente, administración segura de medicamentos, riesgo de caídas, uso racional de antibióticos y custodia de pertenencias.',
   'Adherencias', 'ADHER', true, true, 'ips'),
  ('IPS-ADHER-003', 'Medición adherencia lavado de manos',
   'Lista de chequeo de adherencia al protocolo de higiene de manos: generalidades, 5 momentos, técnica de lavado y técnica con alcohol glicerinado.',
   'Adherencias', 'ADHER', true, true, 'ips'),
  ('IPS-ADHER-004', 'Adherencia a protocolo de antibiótico',
   'Evaluación de adherencia al protocolo de uso racional de antibióticos por parte del personal asistencial.',
   'Adherencias', 'ADHER', true, true, 'ips')
ON CONFLICT (code) DO NOTHING;

-- 2. ADHERENCIAS — INDEPENDIENTES
INSERT INTO document_catalog
  (code, name, description, category, standard_reference, is_mandatory, applies_to_all, provider_type)
VALUES
  ('IND-ADHER-001', 'Medición adherencia bioseguridad',
   'Lista de chequeo de adherencia a protocolos de bioseguridad: uso de EPP, esterilización, manejo de residuos y limpieza y desinfección.',
   'Adherencias', 'ADHER', true, true, 'independiente'),
  ('IND-ADHER-002', 'Medición adherencia seguridad del paciente',
   'Lista de chequeo FCLI-014: identificación del paciente, administración segura de medicamentos, riesgo de caídas, uso racional de antibióticos y custodia de pertenencias.',
   'Adherencias', 'ADHER', true, true, 'independiente'),
  ('IND-ADHER-003', 'Medición adherencia lavado de manos',
   'Lista de chequeo de adherencia al protocolo de higiene de manos: generalidades, 5 momentos, técnica de lavado y técnica con alcohol glicerinado.',
   'Adherencias', 'ADHER', true, true, 'independiente'),
  ('IND-ADHER-004', 'Adherencia a protocolo de antibiótico',
   'Evaluación de adherencia al protocolo de uso racional de antibióticos por parte del personal asistencial.',
   'Adherencias', 'ADHER', true, true, 'independiente')
ON CONFLICT (code) DO NOTHING;

-- 3. AUDITORÍA DE HISTORIA CLÍNICA — IPS
INSERT INTO document_catalog
  (code, name, description, category, standard_reference, is_mandatory, applies_to_all, provider_type)
VALUES
  ('IPS-AHC-001', 'Evaluación de Historia Clínica (SL-FCLI-016)',
   'Formulario de auditoría de historia clínica con componente odontológico y componente administrativo. Incluye criterios de registro, orden, continuidad y calidad de la información clínica.',
   'Auditoría de Historia Clínica', 'HC', true, true, 'ips')
ON CONFLICT (code) DO NOTHING;

-- 3. AUDITORÍA DE HISTORIA CLÍNICA — INDEPENDIENTES
INSERT INTO document_catalog
  (code, name, description, category, standard_reference, is_mandatory, applies_to_all, provider_type)
VALUES
  ('IND-HC-001', 'Evaluación de Historia Clínica (SL-FCLI-016)',
   'Formulario de auditoría de historia clínica con componente odontológico y componente administrativo. Incluye criterios de registro, orden, continuidad y calidad de la información clínica.',
   'Auditoría de Historia Clínica', 'HC', true, true, 'independiente')
ON CONFLICT (code) DO NOTHING;

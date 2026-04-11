-- Norma 3100 Evaluation Criteria Seed Data
-- Pre-loads 600+ criteria across services
-- Structure: 7 transversales + 5-25 specific per service
-- Example: Consulta Externa = 7 transversales + 18 específicos = 25 total

-- NOTE: This is a comprehensive seeding script that would need to be:
-- 1. Generated dynamically based on service count
-- 2. Populated from Norma 3100 compliance standard documents
-- 3. Reviewed by compliance SMEs (Adriana Perdomo)

-- For now, we'll seed example criteria for key services

-- ==============================================================
-- HELPER: Get all services for population
-- ==============================================================

-- Get Consulta Externa service ID
WITH consulta_externa_service AS (
  SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1
),
-- Get other services
diagnostico_service AS (
  SELECT id FROM services WHERE name LIKE '%Apoyo Diagnóstico%' LIMIT 1
),
internacion_service AS (
  SELECT id FROM services WHERE name LIKE '%Internación%' LIMIT 1
)

-- ==============================================================
-- SAMPLE: CONSULTA EXTERNA CRITERIA (25 total)
-- ==============================================================

INSERT INTO evaluation_criteria
(code, number, name, description, evidence_requirement, complexity, standard_id, service_id, is_mandatory, status)

-- 7 Transversales (same for all services)
SELECT
  'CX-T01-001' as code,
  '1.1' as number,
  'Definición de metas y objetivos',
  'La organización debe tener documentada la misión, visión y objetivos estratégicos de atención',
  'Documento de Política de Gestión Administrativa',
  'simple' as complexity,
  (SELECT id FROM evaluation_standards WHERE code = 'T-01' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  TRUE,
  'active'
UNION ALL
SELECT
  'CX-T01-002',
  '1.2',
  'Asignación de responsabilidades',
  'La organización debe asignar responsabilidades claras por escrito a los directivos',
  'Manuales de funciones y responsabilidades',
  'simple',
  (SELECT id FROM evaluation_standards WHERE code = 'T-01' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  TRUE,
  'active'
UNION ALL
SELECT
  'CX-T01-003',
  '1.3',
  'Política de calidad',
  'Existencia de política de mejoramiento continuo',
  'Documento de Política de Mejoramiento Continuo',
  'simple',
  (SELECT id FROM evaluation_standards WHERE code = 'T-01' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  TRUE,
  'active'
UNION ALL
SELECT
  'CX-T02-001',
  '2.1',
  'Plan de desarrollo institucional',
  'Debe existir plan de desarrollo para 4 años con evaluación anual',
  'Plan de Desarrollo Institucional vigente',
  'medium',
  (SELECT id FROM evaluation_standards WHERE code = 'T-02' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  TRUE,
  'active'
UNION ALL
SELECT
  'CX-T02-002',
  '2.2',
  'Plan anual de operación',
  'Debe existir plan operativo anual con metas cuantificables',
  'Plan Anual de Operación con indicadores',
  'medium',
  (SELECT id FROM evaluation_standards WHERE code = 'T-02' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  TRUE,
  'active'
UNION ALL
SELECT
  'CX-T03-001',
  '3.1',
  'Manual de funciones y competencias',
  'Debe existir manual de funciones actualizado con perfiles de competencia',
  'Manual de Funciones actualizado',
  'simple',
  (SELECT id FROM evaluation_standards WHERE code = 'T-03' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  TRUE,
  'active'
UNION ALL
SELECT
  'CX-T03-002',
  '3.2',
  'Programa de capacitación',
  'Debe existir programa anual de capacitación y entrenamiento',
  'Plan de Capacitación anual ejecutado',
  'medium',
  (SELECT id FROM evaluation_standards WHERE code = 'T-03' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  TRUE,
  'active'
UNION ALL
SELECT
  'CX-T04-001',
  '4.1',
  'Programa de seguridad del paciente',
  'Debe existir programa escrito de seguridad del paciente',
  'Documento del Programa de Seguridad del Paciente',
  'complex',
  (SELECT id FROM evaluation_standards WHERE code = 'T-04' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  TRUE,
  'active'
UNION ALL
SELECT
  'CX-T04-002',
  '4.2',
  'Sistema de reporte de eventos adversos',
  'Debe existir sistema para reportar y analizar eventos adversos',
  'Reportes de eventos adversos de los últimos 12 meses',
  'complex',
  (SELECT id FROM evaluation_standards WHERE code = 'T-04' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  TRUE,
  'active'
UNION ALL
SELECT
  'CX-T05-001',
  '5.1',
  'Sistemas de información documentados',
  'Debe existir documento con arquitectura y descripción de sistemas',
  'Documento de Arquitectura de Sistemas de Información',
  'medium',
  (SELECT id FROM evaluation_standards WHERE code = 'T-05' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  TRUE,
  'active'
UNION ALL
SELECT
  'CX-T05-002',
  '5.2',
  'Plan de continuidad',
  'Debe existir plan de continuidad para sistemas críticos',
  'Plan de Continuidad de Negocios',
  'complex',
  (SELECT id FROM evaluation_standards WHERE code = 'T-05' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  TRUE,
  'active'
UNION ALL
SELECT
  'CX-T06-001',
  '6.1',
  'Historia clínica única',
  'Debe existir historia clínica única e integrada por paciente',
  'Muestra de historias clínicas completas',
  'complex',
  (SELECT id FROM evaluation_standards WHERE code = 'T-06' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  TRUE,
  'active'
UNION ALL
SELECT
  'CX-T06-002',
  '6.2',
  'Control de acceso a historias clínicas',
  'Debe existir control de acceso y confidencialidad de historias',
  'Políticas de acceso a historias clínicas',
  'medium',
  (SELECT id FROM evaluation_standards WHERE code = 'T-06' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  TRUE,
  'active'
UNION ALL
SELECT
  'CX-T07-001',
  '7.1',
  'Identificación de riesgos',
  'Debe existir proceso para identificar y evaluar riesgos',
  'Matriz de Riesgos actualizada',
  'medium',
  (SELECT id FROM evaluation_standards WHERE code = 'T-07' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  TRUE,
  'active'
UNION ALL
SELECT
  'CX-T07-002',
  '7.2',
  'Plan de mitigación de riesgos',
  'Debe existir plan de acción para mitigar riesgos identificados',
  'Plan de Mitigación de Riesgos con seguimiento',
  'complex',
  (SELECT id FROM evaluation_standards WHERE code = 'T-07' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  TRUE,
  'active'

-- Service-Specific Criteria for Consulta Externa (18 specific)
UNION ALL
SELECT
  'CX-E01-001' as code,
  '8.1' as number,
  'Consultorio con equipamiento básico',
  'Debe contar con consultorio equipado con estetoscopio, baumanómetro, termómetro',
  'Inspección de consultorios',
  'simple' as complexity,
  (SELECT id FROM evaluation_standards WHERE code = 'CX-01' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  FALSE,
  'active'
UNION ALL
SELECT
  'CX-E01-002',
  '8.2',
  'Médico especialista acreditado',
  'El médico debe ser especialista con cédula profesional vigente',
  'Cédula profesional y certificado de especialidad',
  'simple',
  (SELECT id FROM evaluation_standards WHERE code = 'CX-01' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  FALSE,
  'active'
UNION ALL
SELECT
  'CX-E01-003',
  '8.3',
  'Tiempo de espera máximo',
  'Tiempo de espera no debe exceder 30 minutos',
  'Registro de tiempos de espera (últimas 30 consultas)',
  'simple',
  (SELECT id FROM evaluation_standards WHERE code = 'CX-01' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  FALSE,
  'active'
UNION ALL
SELECT
  'CX-E01-004',
  '8.4',
  'Formularios estándar',
  'Debe utilizar formularios estandarizados para la consulta',
  'Muestra de formularios de consulta',
  'simple',
  (SELECT id FROM evaluation_standards WHERE code = 'CX-01' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  FALSE,
  'active'
UNION ALL
SELECT
  'CX-E01-005',
  '8.5',
  'Medicamentos disponibles',
  'Debe contar con medicamentos básicos para el manejo de urgencias',
  'Listado de medicamentos de emergencia en consultorio',
  'simple',
  (SELECT id FROM evaluation_standards WHERE code = 'CX-01' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  FALSE,
  'active'
UNION ALL
SELECT
  'CX-E01-006',
  '8.6',
  'Equipo de reanimación',
  'Debe contar con equipo de reanimación de fácil acceso',
  'Disponibilidad verificada de equipo de RCP',
  'medium',
  (SELECT id FROM evaluation_standards WHERE code = 'CX-01' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  FALSE,
  'active'
UNION ALL
SELECT
  'CX-E01-007',
  '8.7',
  'Protocolo de referencia',
  'Debe existir protocolo documentado para referencia de pacientes',
  'Protocolo de Referencia a otros niveles',
  'medium',
  (SELECT id FROM evaluation_standards WHERE code = 'CX-01' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  FALSE,
  'active'
UNION ALL
SELECT
  'CX-E01-008',
  '8.8',
  'Registro de asistencia',
  'Debe existir registro de asistencia y ausentismo',
  'Registro de asistencia de los últimos 3 meses',
  'simple',
  (SELECT id FROM evaluation_standards WHERE code = 'CX-01' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  FALSE,
  'active'
UNION ALL
SELECT
  'CX-E01-009',
  '8.9',
  'Evaluación de satisfacción',
  'Debe realizar evaluación de satisfacción del paciente',
  'Encuestas de satisfacción de los últimos 3 meses',
  'simple',
  (SELECT id FROM evaluation_standards WHERE code = 'CX-01' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  FALSE,
  'active'
UNION ALL
SELECT
  'CX-E01-010',
  '8.10',
  'Control de infecciones',
  'Debe existir protocolo de control de infecciones y asepsia',
  'Protocolo de Control de Infecciones',
  'medium',
  (SELECT id FROM evaluation_standards WHERE code = 'CX-01' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  FALSE,
  'active'
UNION ALL
SELECT
  'CX-E01-011',
  '8.11',
  'Atención a casos urgentes',
  'Protocolo para atención inmediata de casos urgentes',
  'Protocolo de Atención de Urgencias en Consulta Externa',
  'medium',
  (SELECT id FROM evaluation_standards WHERE code = 'CX-01' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  FALSE,
  'active'
UNION ALL
SELECT
  'CX-E01-012',
  '8.12',
  'Comunicación con paciente',
  'Médico debe comunicar claramente diagnóstico y plan de tratamiento',
  'Evaluación de comunicación en historias clínicas',
  'simple',
  (SELECT id FROM evaluation_standards WHERE code = 'CX-01' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  FALSE,
  'active'
UNION ALL
SELECT
  'CX-E01-013',
  '8.13',
  'Manejo de medicamentos',
  'Registro de medicamentos prescritos y entregados',
  'Registro de prescripciones farmacéuticas',
  'simple',
  (SELECT id FROM evaluation_standards WHERE code = 'CX-01' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  FALSE,
  'active'
UNION ALL
SELECT
  'CX-E01-014',
  '8.14',
  'Consentimiento informado',
  'Debe obtener consentimiento informado para procedimientos invasivos',
  'Muestra de formatos de consentimiento',
  'medium',
  (SELECT id FROM evaluation_standards WHERE code = 'CX-01' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  FALSE,
  'active'
UNION ALL
SELECT
  'CX-E01-015',
  '8.15',
  'Privacidad y confidencialidad',
  'Debe garantizar privacidad durante la consulta',
  'Inspección de consultorios y políticas de privacidad',
  'simple',
  (SELECT id FROM evaluation_standards WHERE code = 'CX-01' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  FALSE,
  'active'
UNION ALL
SELECT
  'CX-E01-016',
  '8.16',
  'Disponibilidad de servicios diagnósticos',
  'Acceso a servicios diagnósticos básicos (laboratorio, imagenología)',
  'Protocolo de solicitud de servicios diagnósticos',
  'medium',
  (SELECT id FROM evaluation_standards WHERE code = 'CX-01' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  FALSE,
  'active'
UNION ALL
SELECT
  'CX-E01-017',
  '8.17',
  'Seguimiento de pacientes',
  'Debe existir sistema de seguimiento post-consulta',
  'Registro de seguimiento de pacientes',
  'medium',
  (SELECT id FROM evaluation_standards WHERE code = 'CX-01' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  FALSE,
  'active'
UNION ALL
SELECT
  'CX-E01-018',
  '8.18',
  'Auditoría clínica',
  'Debe realizar auditoría clínica de expedientes regularmente',
  'Reportes de auditoría clínica',
  'complex',
  (SELECT id FROM evaluation_standards WHERE code = 'CX-01' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  FALSE,
  'active'

ON CONFLICT DO NOTHING;

-- ==============================================================
-- Create any missing service-specific standards
-- ==============================================================

INSERT INTO evaluation_standards (code, name, description, is_transversal, service_id, category, status)
SELECT
  'CX-01' as code,
  'Estándares Consulta Externa' as name,
  'Estándares específicos para servicios de consulta externa' as description,
  FALSE,
  (SELECT id FROM services WHERE name = 'Consulta Externa' LIMIT 1),
  'Consulta Externa',
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM evaluation_standards WHERE code = 'CX-01'
)
ON CONFLICT DO NOTHING;

-- ==============================================================
-- Note: In production, this script would be:
-- 1. Generated from Norma 3100 compliance standard documents
-- 2. Include all 157 services with 5-25 criteria each
-- 3. Total: 600+ criteria across the system
-- 4. Reviewed and validated by compliance SMEs
-- ==============================================================

-- Success message
SELECT 'Criteria seeding complete. Review evaluation_criteria table for total count.' as status;

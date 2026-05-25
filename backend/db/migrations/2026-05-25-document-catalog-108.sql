-- =============================================================================
-- Migración: Catálogo completo de 108 documentos — Matriz Documental
-- Resolución 3100 de 2019 — Herramienta de Auditoría de Habilitación
-- Fuente: Herramienta_Auditoria habilitación.xlsx — hoja MATRIZ DOCUMENTAL
-- =============================================================================
-- Usa ON CONFLICT (code) DO UPDATE para no romper datos existentes

-- ─── CONDICIONES TÉCNICO ADMINISTRATIVAS (2) ─────────────────────────────────
INSERT INTO document_catalog (code, name, category, is_mandatory, expiry_months, standard_reference) VALUES
('CTA-001', 'Cámara de comercio no mayor a 30 días',
 'Condiciones Técnico Administrativas', true, 1, 'RES3100-CAP8'),
('CTA-002', 'Cédula representante legal',
 'Condiciones Técnico Administrativas', true, NULL, 'RES3100-CAP8')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  is_mandatory = EXCLUDED.is_mandatory,
  expiry_months = EXCLUDED.expiry_months,
  standard_reference = EXCLUDED.standard_reference,
  updated_at = NOW();

-- ─── CONDICIONES DE SUFICIENCIA PATRIMONIAL (7) ──────────────────────────────
INSERT INTO document_catalog (code, name, category, is_mandatory, expiry_months, standard_reference) VALUES
('CSP-001', 'Cédula y tarjeta profesional del contador - revisor fiscal',
 'Suficiencia Patrimonial', true, NULL, 'RES3100-CAP9'),
('CSP-002', 'Certificado de cuenta bancaria a nombre de la IPS',
 'Suficiencia Patrimonial', true, 12, 'RES3100-CAP9'),
('CSP-003', 'Licencia del software contable',
 'Suficiencia Patrimonial', true, NULL, 'RES3100-CAP9'),
('CSP-004', 'Registro de los libros acta y socios',
 'Suficiencia Patrimonial', true, NULL, 'RES3100-CAP9'),
('CSP-005', 'RUT',
 'Suficiencia Patrimonial', true, NULL, 'RES3100-CAP9'),
('CSP-006', 'Estados financieros',
 'Suficiencia Patrimonial', true, 12, 'RES3100-CAP9'),
('CSP-007', 'Certificado condiciones de suficiencia patrimonial',
 'Suficiencia Patrimonial', true, 12, 'RES3100-CAP9')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  is_mandatory = EXCLUDED.is_mandatory,
  expiry_months = EXCLUDED.expiry_months,
  standard_reference = EXCLUDED.standard_reference,
  updated_at = NOW();

-- ─── ESTÁNDAR 1 – TALENTO HUMANO (6) ─────────────────────────────────────────
INSERT INTO document_catalog (code, name, category, is_mandatory, expiry_months, standard_reference) VALUES
('ETH-001', 'Relación del personal de la entidad',
 'Estándar 1 – Talento Humano', true, 12, 'RES3100-TSTH'),
('ETH-002', 'Hojas de vida por servicio que incluya los soportes legales',
 'Estándar 1 – Talento Humano', true, NULL, 'RES3100-TSTH'),
('ETH-003', 'Formato de capacidad instalada',
 'Estándar 1 – Talento Humano', true, 12, 'RES3100-TSTH'),
('ETH-004', 'Programa de capacitaciones y cronograma',
 'Estándar 1 – Talento Humano', true, 12, 'RES3100-TSTH'),
('ETH-005', 'Capacitaciones realizadas del año',
 'Estándar 1 – Talento Humano', true, 12, 'RES3100-TSTH'),
('ETH-006', 'Comités y cronograma',
 'Estándar 1 – Talento Humano', true, 12, 'RES3100-TSTH')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  is_mandatory = EXCLUDED.is_mandatory,
  expiry_months = EXCLUDED.expiry_months,
  standard_reference = EXCLUDED.standard_reference,
  updated_at = NOW();

-- ─── ESTÁNDAR 2 – INFRAESTRUCTURA (11) ───────────────────────────────────────
INSERT INTO document_catalog (code, name, category, is_mandatory, expiry_months, standard_reference) VALUES
('EIN-001', 'Concepto del uso del suelo',
 'Estándar 2 – Infraestructura', true, 12, 'RES3100-TSINF'),
('EIN-002', 'Licencia de construcción',
 'Estándar 2 – Infraestructura', true, NULL, 'RES3100-TSINF'),
('EIN-003', 'Plan de mantenimiento de infraestructura y cronograma',
 'Estándar 2 – Infraestructura', true, 12, 'RES3100-TSINF'),
('EIN-004', 'Certificado de bomberos (vigente, no mayor a 1 año)',
 'Estándar 2 – Infraestructura', true, 12, 'RES3100-TSINF'),
('EIN-005', 'Certificado eléctrico (vigente, no mayor a 5 años)',
 'Estándar 2 – Infraestructura', true, 60, 'RES3100-TSINF'),
('EIN-006', 'Planillas de limpieza y desinfección',
 'Estándar 2 – Infraestructura', true, 12, 'RES3100-TSINF'),
('EIN-007', 'Plano de la institución con medidas por servicio',
 'Estándar 2 – Infraestructura', true, NULL, 'RES3100-TSINF'),
('EIN-008', 'Plan hospitalario de emergencias',
 'Estándar 2 – Infraestructura', true, 12, 'RES3100-TSINF'),
('EIN-009', 'Plano ruta de evacuación por piso',
 'Estándar 2 – Infraestructura', true, NULL, 'RES3100-TSINF'),
('EIN-010', 'Mantenimiento de ascensor cuando aplica',
 'Estándar 2 – Infraestructura', false, 12, 'RES3100-TSINF'),
('EIN-011', 'Plano de ruta sanitaria',
 'Estándar 2 – Infraestructura', true, NULL, 'RES3100-TSINF')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  is_mandatory = EXCLUDED.is_mandatory,
  expiry_months = EXCLUDED.expiry_months,
  standard_reference = EXCLUDED.standard_reference,
  updated_at = NOW();

-- ─── CONCEPTO SANITARIO (15) ──────────────────────────────────────────────────
INSERT INTO document_catalog (code, name, category, is_mandatory, expiry_months, standard_reference) VALUES
('CSN-001', 'Certificado de fumigación - licencia del proveedor',
 'Concepto Sanitario', true, 12, 'RES3100-TSINF'),
('CSN-002', 'Certificado de lavado de tanques de reserva de agua',
 'Concepto Sanitario', true, 12, 'RES3100-TSINF'),
('CSN-003', 'Timbre de emergencia unidades sanitarias persona movilidad reducida',
 'Concepto Sanitario', true, NULL, 'RES3100-TSINF'),
('CSN-004', 'Alarma de emergencia',
 'Concepto Sanitario', true, NULL, 'RES3100-TSINF'),
('CSN-005', 'Existencia de Botiquín',
 'Concepto Sanitario', true, NULL, 'RES3100-TSINF'),
('CSN-006', 'Extintores',
 'Concepto Sanitario', true, 12, 'RES3100-TSINF'),
('CSN-007', 'Contrato Biosanitarios',
 'Concepto Sanitario', true, 12, 'RES3100-TSINF'),
('CSN-008', 'PGIRASA',
 'Concepto Sanitario', true, 12, 'RES3100-TSINF'),
('CSN-009', 'Acta de disposición final de residuos',
 'Concepto Sanitario', true, 12, 'RES3100-TSINF'),
('CSN-010', 'Auditoría Externa',
 'Concepto Sanitario', true, 12, 'RES3100-TSINF'),
('CSN-011', 'Auditorías internas',
 'Concepto Sanitario', true, 12, 'RES3100-TSINF'),
('CSN-012', 'Capacitaciones de PGIRASA',
 'Concepto Sanitario', true, 12, 'RES3100-TSINF'),
('CSN-013', 'Comité GAGAS',
 'Concepto Sanitario', true, 12, 'RES3100-TSINF'),
('CSN-014', 'Manifiestos de la empresa recolectora',
 'Concepto Sanitario', true, 12, 'RES3100-TSINF'),
('CSN-015', 'Certificado de concepto sanitario',
 'Concepto Sanitario', true, 12, 'RES3100-TSINF')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  is_mandatory = EXCLUDED.is_mandatory,
  expiry_months = EXCLUDED.expiry_months,
  standard_reference = EXCLUDED.standard_reference,
  updated_at = NOW();

-- ─── ESTÁNDAR 3 – DOTACIÓN Y MANTENIMIENTO (7) ───────────────────────────────
INSERT INTO document_catalog (code, name, category, is_mandatory, expiry_months, standard_reference) VALUES
('EDM-001', 'Registro de los equipos por servicio',
 'Estándar 3 – Dotación y Mantenimiento', true, 12, 'RES3100-TSDOT'),
('EDM-002', 'Programa de mantenimiento',
 'Estándar 3 – Dotación y Mantenimiento', true, 12, 'RES3100-TSDOT'),
('EDM-003', 'Hojas de vida de equipos biomédicos (factura, INVIMA, permisos)',
 'Estándar 3 – Dotación y Mantenimiento', true, NULL, 'RES3100-TSDOT'),
('EDM-004', 'Registros mantenimientos preventivos, correctivos, calibraciones',
 'Estándar 3 – Dotación y Mantenimiento', true, 12, 'RES3100-TSDOT'),
('EDM-005', 'Programa de capacitación en dispositivos médicos',
 'Estándar 3 – Dotación y Mantenimiento', true, 12, 'RES3100-TSDOT'),
('EDM-006', 'Suficiencia de equipos biomédicos',
 'Estándar 3 – Dotación y Mantenimiento', true, NULL, 'RES3100-TSDOT'),
('EDM-007', 'Hoja de vida de biomédico con soportes y contrato',
 'Estándar 3 – Dotación y Mantenimiento', true, NULL, 'RES3100-TSDOT')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  is_mandatory = EXCLUDED.is_mandatory,
  expiry_months = EXCLUDED.expiry_months,
  standard_reference = EXCLUDED.standard_reference,
  updated_at = NOW();

-- ─── ESTÁNDAR 4 – MEDICAMENTOS, DM E INSUMOS (9) ─────────────────────────────
INSERT INTO document_catalog (code, name, category, is_mandatory, expiry_months, standard_reference) VALUES
('EMD-001', 'Registro de medicamentos',
 'Estándar 4 – Medicamentos, DM e Insumos', true, 12, 'RES3100-TSMD'),
('EMD-002', 'Registro de dispositivos médicos',
 'Estándar 4 – Medicamentos, DM e Insumos', true, 12, 'RES3100-TSMD'),
('EMD-003', 'Registro de reactivos',
 'Estándar 4 – Medicamentos, DM e Insumos', false, 12, 'RES3100-TSMD'),
('EMD-004', 'Procedimiento de gestión de insumos',
 'Estándar 4 – Medicamentos, DM e Insumos', true, NULL, 'RES3100-TSMD'),
('EMD-005', 'Programas de farmacovigilancia y reportes',
 'Estándar 4 – Medicamentos, DM e Insumos', true, 12, 'RES3100-TSMD'),
('EMD-006', 'Programa de tecnovigilancia y reportes',
 'Estándar 4 – Medicamentos, DM e Insumos', true, 12, 'RES3100-TSMD'),
('EMD-007', 'Registro de temperatura y humedad',
 'Estándar 4 – Medicamentos, DM e Insumos', true, 12, 'RES3100-TSMD'),
('EMD-008', 'Procedimiento manejo de derrames y rupturas de medicamentos',
 'Estándar 4 – Medicamentos, DM e Insumos', true, NULL, 'RES3100-TSMD'),
('EMD-009', 'Protocolo de verificación de alertas sanitarias',
 'Estándar 4 – Medicamentos, DM e Insumos', true, NULL, 'RES3100-TSMD')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  is_mandatory = EXCLUDED.is_mandatory,
  expiry_months = EXCLUDED.expiry_months,
  standard_reference = EXCLUDED.standard_reference,
  updated_at = NOW();

-- ─── ESTÁNDAR 5 – PROCESOS PRIORITARIOS (25) ─────────────────────────────────
INSERT INTO document_catalog (code, name, category, is_mandatory, expiry_months, standard_reference) VALUES
('EPP-001', 'Política de seguridad del paciente',
 'Estándar 5 – Procesos Prioritarios', true, NULL, 'RES3100-TSPP'),
('EPP-002', 'Programa de seguridad del paciente',
 'Estándar 5 – Procesos Prioritarios', true, 12, 'RES3100-TSPP'),
('EPP-003', 'Acta conformación comité de seguridad del paciente',
 'Estándar 5 – Procesos Prioritarios', true, NULL, 'RES3100-TSPP'),
('EPP-004', '4 Formatos del ministerio de seguridad del paciente',
 'Estándar 5 – Procesos Prioritarios', true, NULL, 'RES3100-TSPP'),
('EPP-005', 'Procedimiento de identificación del paciente',
 'Estándar 5 – Procesos Prioritarios', true, NULL, 'RES3100-TSPP'),
('EPP-006', 'Procedimiento de comunicación asistencial',
 'Estándar 5 – Procesos Prioritarios', true, NULL, 'RES3100-TSPP'),
('EPP-007', 'Procedimiento de prevención de infecciones',
 'Estándar 5 – Procesos Prioritarios', true, NULL, 'RES3100-TSPP'),
('EPP-008', 'Procedimiento de eventos adversos',
 'Estándar 5 – Procesos Prioritarios', true, NULL, 'RES3100-TSPP'),
('EPP-009', 'Procedimiento de consentimiento informado',
 'Estándar 5 – Procesos Prioritarios', true, NULL, 'RES3100-TSPP'),
('EPP-010', 'Procedimiento de uso seguro de medicamentos',
 'Estándar 5 – Procesos Prioritarios', true, NULL, 'RES3100-TSPP'),
('EPP-011', 'Procedimiento de prevención de caídas',
 'Estándar 5 – Procesos Prioritarios', true, NULL, 'RES3100-TSPP'),
('EPP-012', 'Procedimiento de rondas de seguridad',
 'Estándar 5 – Procesos Prioritarios', true, NULL, 'RES3100-TSPP'),
('EPP-013', 'Registro de análisis de eventos adversos',
 'Estándar 5 – Procesos Prioritarios', true, 12, 'RES3100-TSPP'),
('EPP-014', 'Capacitación en seguridad del paciente',
 'Estándar 5 – Procesos Prioritarios', true, 12, 'RES3100-TSPP'),
('EPP-015', 'Documento de autocuidado del paciente',
 'Estándar 5 – Procesos Prioritarios', true, NULL, 'RES3100-TSPP'),
('EPP-016', 'Guías de manejo por servicio',
 'Estándar 5 – Procesos Prioritarios', true, NULL, 'RES3100-TSPP'),
('EPP-017', 'Procedimiento de adopción de guías',
 'Estándar 5 – Procesos Prioritarios', true, NULL, 'RES3100-TSPP'),
('EPP-018', 'Protocolos de manejo por servicios',
 'Estándar 5 – Procesos Prioritarios', true, NULL, 'RES3100-TSPP'),
('EPP-019', 'Procedimiento de aseo, limpieza y desinfección',
 'Estándar 5 – Procesos Prioritarios', true, NULL, 'RES3100-TSPP'),
('EPP-020', 'Manual de bioseguridad',
 'Estándar 5 – Procesos Prioritarios', true, NULL, 'RES3100-TSPP'),
('EPP-021', 'Procedimiento de descontaminación por derrames',
 'Estándar 5 – Procesos Prioritarios', true, NULL, 'RES3100-TSPP'),
('EPP-022', 'Política de no uso y reuso de dispositivos médicos',
 'Estándar 5 – Procesos Prioritarios', true, NULL, 'RES3100-TSPP'),
('EPP-023', 'Procedimiento de referencia de pacientes',
 'Estándar 5 – Procesos Prioritarios', true, NULL, 'RES3100-TSPP'),
('EPP-024', 'Documento para atención a víctimas de violencia sexual',
 'Estándar 5 – Procesos Prioritarios', true, NULL, 'RES3100-TSPP'),
('EPP-025', 'Conformación equipo atención integral víctimas de violencia sexual',
 'Estándar 5 – Procesos Prioritarios', true, NULL, 'RES3100-TSPP')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  is_mandatory = EXCLUDED.is_mandatory,
  expiry_months = EXCLUDED.expiry_months,
  standard_reference = EXCLUDED.standard_reference,
  updated_at = NOW();

-- ─── ESTÁNDAR 6 – HISTORIA CLÍNICA (6) ───────────────────────────────────────
INSERT INTO document_catalog (code, name, category, is_mandatory, expiry_months, standard_reference) VALUES
('EHC-001', 'Procedimiento de manejo de historia clínica',
 'Estándar 6 – Historia Clínica', true, NULL, 'RES3100-TSHCR'),
('EHC-002', 'Registro de entrada y salida de historias clínicas',
 'Estándar 6 – Historia Clínica', true, 12, 'RES3100-TSHCR'),
('EHC-003', 'Historia clínica digital',
 'Estándar 6 – Historia Clínica', true, NULL, 'RES3100-TSHCR'),
('EHC-004', 'Procedimiento de consentimiento informado',
 'Estándar 6 – Historia Clínica', true, NULL, 'RES3100-TSHCR'),
('EHC-005', 'Consentimientos informados por servicio',
 'Estándar 6 – Historia Clínica', true, NULL, 'RES3100-TSHCR'),
('EHC-006', 'Certificado del ingeniero de sistemas',
 'Estándar 6 – Historia Clínica', true, 12, 'RES3100-TSHCR')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  is_mandatory = EXCLUDED.is_mandatory,
  expiry_months = EXCLUDED.expiry_months,
  standard_reference = EXCLUDED.standard_reference,
  updated_at = NOW();

-- ─── ESTÁNDAR 7 – INTERDEPENDENCIA DE SERVICIOS (1) ──────────────────────────
INSERT INTO document_catalog (code, name, category, is_mandatory, expiry_months, standard_reference) VALUES
('EIS-001', 'Contratos interdependencia de servicios cuando aplique',
 'Estándar 7 – Interdependencia de Servicios', false, 12, 'RES3100-TSINT')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  is_mandatory = EXCLUDED.is_mandatory,
  expiry_months = EXCLUDED.expiry_months,
  standard_reference = EXCLUDED.standard_reference,
  updated_at = NOW();

-- ─── REPORTES OBLIGATORIOS (8) ────────────────────────────────────────────────
INSERT INTO document_catalog (code, name, category, is_mandatory, expiry_months, standard_reference) VALUES
('ROB-001', 'Resolución 256 – Indicadores de calidad',
 'Reportes Obligatorios', true, 12, 'RES3100-PAMEC'),
('ROB-002', 'PAMEC',
 'Reportes Obligatorios', true, 12, 'RES3100-PAMEC'),
('ROB-003', 'Resolución 2063 – Política de Participación Social en Salud',
 'Reportes Obligatorios', true, 12, 'RES3100-PAMEC'),
('ROB-004', 'RIPS',
 'Reportes Obligatorios', true, 12, 'RES3100-PAMEC'),
('ROB-005', 'Farmacovigilancia',
 'Reportes Obligatorios', true, 12, 'RES3100-TSMD'),
('ROB-006', 'Tecnovigilancia',
 'Reportes Obligatorios', true, 12, 'RES3100-TSMD'),
('ROB-007', 'Reactivovigilancia cuando aplique',
 'Reportes Obligatorios', false, 12, 'RES3100-TSMD'),
('ROB-008', 'Hemovigilancia cuando aplique',
 'Reportes Obligatorios', false, 12, 'RES3100-TSMD')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  is_mandatory = EXCLUDED.is_mandatory,
  expiry_months = EXCLUDED.expiry_months,
  standard_reference = EXCLUDED.standard_reference,
  updated_at = NOW();

-- ─── PAMEC – AUDITORÍA PARA EL MEJORAMIENTO CONTINUO (11) ────────────────────
INSERT INTO document_catalog (code, name, category, is_mandatory, expiry_months, standard_reference) VALUES
('PAM-001', 'PAMEC teórico y cronograma',
 'PAMEC – Auditoría para el Mejoramiento Continuo', true, 12, 'RES3100-PAMEC'),
('PAM-002', 'Matriz consolidada',
 'PAMEC – Auditoría para el Mejoramiento Continuo', true, 12, 'RES3100-PAMEC'),
('PAM-003', 'Autoevaluación',
 'PAMEC – Auditoría para el Mejoramiento Continuo', true, 12, 'RES3100-PAMEC'),
('PAM-004', 'Selección de procesos a mejorar',
 'PAMEC – Auditoría para el Mejoramiento Continuo', true, 12, 'RES3100-PAMEC'),
('PAM-005', 'Priorización de procesos',
 'PAMEC – Auditoría para el Mejoramiento Continuo', true, 12, 'RES3100-PAMEC'),
('PAM-006', 'Definición de calidad esperada',
 'PAMEC – Auditoría para el Mejoramiento Continuo', true, 12, 'RES3100-PAMEC'),
('PAM-007', 'Medición inicial del desempeño',
 'PAMEC – Auditoría para el Mejoramiento Continuo', true, 12, 'RES3100-PAMEC'),
('PAM-008', 'Formulación del plan de acción',
 'PAMEC – Auditoría para el Mejoramiento Continuo', true, 12, 'RES3100-PAMEC'),
('PAM-009', 'Ejecución del plan de acción',
 'PAMEC – Auditoría para el Mejoramiento Continuo', true, 12, 'RES3100-PAMEC'),
('PAM-010', 'Evaluación del plan de acción',
 'PAMEC – Auditoría para el Mejoramiento Continuo', true, 12, 'RES3100-PAMEC'),
('PAM-011', 'Aprendizaje organizacional',
 'PAMEC – Auditoría para el Mejoramiento Continuo', true, NULL, 'RES3100-PAMEC')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  is_mandatory = EXCLUDED.is_mandatory,
  expiry_months = EXCLUDED.expiry_months,
  standard_reference = EXCLUDED.standard_reference,
  updated_at = NOW();

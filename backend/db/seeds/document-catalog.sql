-- ============================================
-- DOCUMENT CATALOG SEED - NORMA 3100
-- Core required documents for healthcare providers
-- ============================================

-- Capacidad Técnico-Administrativa (Administrative)
INSERT INTO document_catalog (code, name, description, category, subcategory, standard_reference, is_mandatory, expiry_months) VALUES
('TA-001', 'Certificado de Existencia y Representación Legal', 'Cámara de Comercio, no mayor a 30 días', 'Técnico-Administrativa', 'Legal', 'NTS-1.1', true, 1),
('TA-002', 'RUT actualizado', 'Registro Único Tributario DIAN', 'Técnico-Administrativa', 'Legal', 'NTS-1.2', true, 12),
('TA-003', 'Cédula del Representante Legal', 'Documento de identidad vigente', 'Técnico-Administrativa', 'Legal', 'NTS-1.3', true, NULL),
('TA-004', 'Estatutos de constitución', 'Acta de constitución de la entidad', 'Técnico-Administrativa', 'Legal', 'NTS-1.4', true, NULL),
('TA-005', 'Licencia de funcionamiento', 'Licencia vigente emitida por Secretaría de Salud', 'Técnico-Administrativa', 'Legal', 'NTS-1.5', true, 60),
('TA-006', 'Certificado de uso del suelo', 'Certificado municipal vigente', 'Técnico-Administrativa', 'Infraestructura', 'NTS-1.6', true, 12),
('TA-007', 'Concepto sanitario favorable', 'Secretaría de Salud', 'Técnico-Administrativa', 'Infraestructura', 'NTS-1.7', true, 12),
('TA-008', 'Plan de Emergencias Hospitalarias', 'Plan documentado y vigente', 'Técnico-Administrativa', 'Gestión', 'NTS-1.8', true, 12),
('TA-009', 'Manual de Procesos y Procedimientos', 'Documentado por área', 'Técnico-Administrativa', 'Gestión', 'NTS-1.9', true, 24),
('TA-010', 'Programa de Auditoría para el Mejoramiento (PAMEC)', 'Programa vigente con evidencias', 'Técnico-Administrativa', 'Calidad', 'NTS-1.10', true, 12);

-- Suficiencia Patrimonial y Financiera
INSERT INTO document_catalog (code, name, description, category, subcategory, standard_reference, is_mandatory, expiry_months) VALUES
('SP-001', 'Estados Financieros del último año', 'Balance general y estado de resultados', 'Suficiencia Patrimonial', 'Financiero', 'NTS-2.1', true, 12),
('SP-002', 'Notas a los Estados Financieros', 'Detalles contables', 'Suficiencia Patrimonial', 'Financiero', 'NTS-2.2', true, 12),
('SP-003', 'Certificación de Revisor Fiscal', 'Firma y aval profesional', 'Suficiencia Patrimonial', 'Financiero', 'NTS-2.3', true, 12),
('SP-004', 'Declaración de Renta', 'Último período fiscal', 'Suficiencia Patrimonial', 'Tributario', 'NTS-2.4', true, 12),
('SP-005', 'Póliza de Responsabilidad Civil', 'Vigente según servicios habilitados', 'Suficiencia Patrimonial', 'Seguros', 'NTS-2.5', true, 12),
('SP-006', 'Póliza de cumplimiento contractual', 'Aplicable según contratación', 'Suficiencia Patrimonial', 'Seguros', 'NTS-2.6', false, 12),
('SP-007', 'Certificación bancaria', 'Cuenta activa de la entidad', 'Suficiencia Patrimonial', 'Financiero', 'NTS-2.7', true, 3);

-- Capacidad Tecnológica y Científica - Talento Humano
INSERT INTO document_catalog (code, name, description, category, subcategory, standard_reference, is_mandatory, expiry_months) VALUES
('TH-001', 'Contrato laboral del personal asistencial', 'Por cada profesional activo', 'Talento Humano', 'Contratos', 'NTS-3.1', true, NULL),
('TH-002', 'Tarjeta Profesional vigente', 'Para cada profesional', 'Talento Humano', 'Certificaciones', 'NTS-3.2', true, 60),
('TH-003', 'Rethus - Registro Único del Talento Humano en Salud', 'Verificación por profesional', 'Talento Humano', 'Certificaciones', 'NTS-3.3', true, 12),
('TH-004', 'Diplomas académicos', 'Títulos de educación superior', 'Talento Humano', 'Certificaciones', 'NTS-3.4', true, NULL),
('TH-005', 'Especializaciones médicas', 'Cuando aplique por servicio', 'Talento Humano', 'Certificaciones', 'NTS-3.5', false, NULL),
('TH-006', 'Certificados de capacitación continuada', 'Últimos 12 meses', 'Talento Humano', 'Capacitación', 'NTS-3.6', true, 12),
('TH-007', 'Evaluación de desempeño', 'Periódica documentada', 'Talento Humano', 'Gestión', 'NTS-3.7', true, 12),
('TH-008', 'Afiliación a seguridad social', 'Salud, pensión, ARL vigente', 'Talento Humano', 'Cumplimiento', 'NTS-3.8', true, 1),
('TH-009', 'Hojas de vida del personal', 'Completas con soportes', 'Talento Humano', 'Personal', 'NTS-3.9', true, NULL);

-- Infraestructura Física
INSERT INTO document_catalog (code, name, description, category, subcategory, standard_reference, is_mandatory, expiry_months) VALUES
('IF-001', 'Planos arquitectónicos aprobados', 'Curaduría urbana', 'Infraestructura', 'Planos', 'NTS-4.1', true, NULL),
('IF-002', 'Certificado de resistencia sísmica', 'NSR-10', 'Infraestructura', 'Seguridad', 'NTS-4.2', true, 120),
('IF-003', 'Certificado de instalaciones eléctricas (RETIE)', 'Vigente', 'Infraestructura', 'Seguridad', 'NTS-4.3', true, 24),
('IF-004', 'Certificado de instalaciones de gas', 'Cuando aplique', 'Infraestructura', 'Seguridad', 'NTS-4.4', false, 12),
('IF-005', 'Plan de mantenimiento preventivo', 'Cronograma y bitácoras', 'Infraestructura', 'Mantenimiento', 'NTS-4.5', true, 12),
('IF-006', 'Contrato de recolección de residuos hospitalarios', 'Empresa autorizada', 'Infraestructura', 'Ambiental', 'NTS-4.6', true, 12),
('IF-007', 'Plan de gestión integral de residuos hospitalarios', 'PGIRS documentado', 'Infraestructura', 'Ambiental', 'NTS-4.7', true, 12),
('IF-008', 'Concepto técnico sanitario', 'Vigente por autoridad sanitaria', 'Infraestructura', 'Sanitario', 'NTS-4.8', true, 12);

-- Dotación y Equipamiento
INSERT INTO document_catalog (code, name, description, category, subcategory, standard_reference, is_mandatory, expiry_months) VALUES
('DE-001', 'Inventario de equipos biomédicos', 'Actualizado y codificado', 'Dotación', 'Inventario', 'NTS-5.1', true, 12),
('DE-002', 'Registro INVIMA de equipos', 'Dispositivos médicos registrados', 'Dotación', 'Registros', 'NTS-5.2', true, 60),
('DE-003', 'Hojas de vida de equipos biomédicos', 'Por cada equipo activo', 'Dotación', 'Mantenimiento', 'NTS-5.3', true, NULL),
('DE-004', 'Programa de mantenimiento correctivo y preventivo', 'Cronograma documentado', 'Dotación', 'Mantenimiento', 'NTS-5.4', true, 12),
('DE-005', 'Certificado de calibración de equipos', 'Metrología vigente', 'Dotación', 'Metrología', 'NTS-5.5', true, 12),
('DE-006', 'Manuales de operación de equipos', 'Disponibles físicamente', 'Dotación', 'Operación', 'NTS-5.6', true, NULL),
('DE-007', 'Licencia software de gestión clínica', 'Historia clínica electrónica', 'Dotación', 'Software', 'NTS-5.7', true, 12);

-- Medicamentos y Dispositivos Médicos
INSERT INTO document_catalog (code, name, description, category, subcategory, standard_reference, is_mandatory, expiry_months) VALUES
('MD-001', 'Certificación de farmacia INVIMA', 'Establecimiento autorizado', 'Medicamentos', 'Registros', 'NTS-6.1', true, 60),
('MD-002', 'Manual de servicios farmacéuticos', 'Procedimientos operativos estandarizados', 'Medicamentos', 'Procedimientos', 'NTS-6.2', true, 24),
('MD-003', 'Inventario de medicamentos', 'Actualizado y trazable', 'Medicamentos', 'Inventario', 'NTS-6.3', true, 1),
('MD-004', 'Registro de medicamentos de control especial', 'Fondo Nacional de Estupefacientes', 'Medicamentos', 'Control', 'NTS-6.4', true, 12),
('MD-005', 'Plan de farmacovigilancia', 'Documentado y vigente', 'Medicamentos', 'Calidad', 'NTS-6.5', true, 12),
('MD-006', 'Tecnovigilancia', 'Reporte de dispositivos médicos', 'Medicamentos', 'Calidad', 'NTS-6.6', true, 12);

-- Procesos Prioritarios
INSERT INTO document_catalog (code, name, description, category, subcategory, standard_reference, is_mandatory, expiry_months) VALUES
('PP-001', 'Protocolo de manejo del paciente crítico', 'Documentado y vigente', 'Procesos Prioritarios', 'Protocolos', 'NTS-7.1', true, 24),
('PP-002', 'Protocolo de hemorragia obstétrica', 'Cuando aplique servicio', 'Procesos Prioritarios', 'Protocolos', 'NTS-7.2', false, 24),
('PP-003', 'Protocolo de reanimación cardiopulmonar', 'RCP actualizado', 'Procesos Prioritarios', 'Protocolos', 'NTS-7.3', true, 12),
('PP-004', 'Protocolo de bioseguridad', 'Aplicado a todas las áreas', 'Procesos Prioritarios', 'Bioseguridad', 'NTS-7.4', true, 12),
('PP-005', 'Protocolo de lavado de manos', 'OMS - 5 momentos', 'Procesos Prioritarios', 'Bioseguridad', 'NTS-7.5', true, 12),
('PP-006', 'Protocolo de manejo de residuos cortopunzantes', 'Guía de disposición', 'Procesos Prioritarios', 'Bioseguridad', 'NTS-7.6', true, 12),
('PP-007', 'Protocolo de referencia y contrarreferencia', 'Red de servicios', 'Procesos Prioritarios', 'Gestión', 'NTS-7.7', true, 24),
('PP-008', 'Plan hospitalario de emergencias', 'Con simulacros documentados', 'Procesos Prioritarios', 'Emergencias', 'NTS-7.8', true, 12),
('PP-009', 'Protocolo de consentimiento informado', 'Por servicio y procedimiento', 'Procesos Prioritarios', 'Documentación', 'NTS-7.9', true, 24),
('PP-010', 'Guías de práctica clínica', 'Basadas en evidencia', 'Procesos Prioritarios', 'Clínico', 'NTS-7.10', true, 36);

-- Historia Clínica y Registros
INSERT INTO document_catalog (code, name, description, category, subcategory, standard_reference, is_mandatory, expiry_months) VALUES
('HC-001', 'Manual de historia clínica', 'Resolución 1995 de 1999', 'Historia Clínica', 'Gestión', 'NTS-8.1', true, 24),
('HC-002', 'Política de archivo y custodia', 'Tiempo de conservación', 'Historia Clínica', 'Archivo', 'NTS-8.2', true, 24),
('HC-003', 'Formato de registro de signos vitales', 'Estándar institucional', 'Historia Clínica', 'Formatos', 'NTS-8.3', true, 24),
('HC-004', 'Registro diario de consultas', 'RIPS implementado', 'Historia Clínica', 'Registros', 'NTS-8.4', true, 12),
('HC-005', 'Sistema de información para referencia', 'Trazable entre servicios', 'Historia Clínica', 'Sistemas', 'NTS-8.5', true, 12),
('HC-006', 'Política de confidencialidad de HC', 'Habeas data implementado', 'Historia Clínica', 'Legal', 'NTS-8.6', true, 24);

-- Interdependencia de Servicios
INSERT INTO document_catalog (code, name, description, category, subcategory, standard_reference, is_mandatory, expiry_months) VALUES
('IS-001', 'Contratos de interdependencia', 'Con otros prestadores habilitados', 'Interdependencia', 'Contratos', 'NTS-9.1', false, 24),
('IS-002', 'Red prestadora de servicios', 'Mapa de red formalizada', 'Interdependencia', 'Red', 'NTS-9.2', true, 12),
('IS-003', 'Convenios docencia-servicio', 'Cuando aplique', 'Interdependencia', 'Docencia', 'NTS-9.3', false, 36);

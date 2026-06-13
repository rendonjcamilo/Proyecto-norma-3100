-- =============================================================================
-- AGREGAR CATÁLOGO DOCUMENTAL — IPS (Institución Prestadora de Servicios)
-- Basado en: Herramienta_Auditoria habilitación.xlsx — Pestaña MATRIZ DOCUMENTAL
-- 108 documentos en 12 categorías
-- =============================================================================

-- Agregar columna provider_type si no existe (PI = existentes, IPS = nuevos)
ALTER TABLE document_catalog ADD COLUMN IF NOT EXISTS provider_type VARCHAR(50) NOT NULL DEFAULT 'independiente';

-- Marcar todos los registros existentes como profesional independiente
UPDATE document_catalog SET provider_type = 'independiente' WHERE provider_type = 'independiente';

-- Limpiar catálogo IPS previo (idempotente)
DELETE FROM document_catalog WHERE provider_type = 'ips';

-- =============================================================================
-- CONDICIONES TÉCNICO-ADMINISTRATIVAS — 2 documentos
-- =============================================================================
INSERT INTO document_catalog (code, name, description, category, standard_reference, is_mandatory, applies_to_all, expiry_months, provider_type) VALUES
('IPS-CTA-001', 'Cámara de comercio', 'Cámara de comercio no mayor a 30 días.', 'Condiciones Técnico-Administrativas', 'CTA', true, true, 1, 'ips'),
('IPS-CTA-002', 'Cédula representante legal', 'Cédula del representante legal de la IPS.', 'Condiciones Técnico-Administrativas', 'CTA', true, true, NULL, 'ips');

-- =============================================================================
-- SUFICIENCIA PATRIMONIAL — 7 documentos
-- =============================================================================
INSERT INTO document_catalog (code, name, description, category, standard_reference, is_mandatory, applies_to_all, expiry_months, provider_type) VALUES
('IPS-CSP-001', 'Cédula y tarjeta profesional del contador', 'Cédula y tarjeta profesional del contador o revisor fiscal.', 'Suficiencia Patrimonial', 'CSP', true, true, NULL, 'ips'),
('IPS-CSP-002', 'Certificado de cuenta bancaria', 'Certificado de cuenta bancaria a nombre de la IPS.', 'Suficiencia Patrimonial', 'CSP', true, true, NULL, 'ips'),
('IPS-CSP-003', 'Licencia del software contable', 'Licencia del software contable utilizado por la institución.', 'Suficiencia Patrimonial', 'CSP', true, true, NULL, 'ips'),
('IPS-CSP-004', 'Registro de libros acta y socios', 'Registro de los libros de actas y socios de la institución.', 'Suficiencia Patrimonial', 'CSP', true, true, NULL, 'ips'),
('IPS-CSP-005', 'RUT', 'Registro Único Tributario de la IPS.', 'Suficiencia Patrimonial', 'CSP', true, true, NULL, 'ips'),
('IPS-CSP-006', 'Estados financieros', 'Estados financieros de la institución.', 'Suficiencia Patrimonial', 'CSP', true, true, NULL, 'ips'),
('IPS-CSP-007', 'Certificado de suficiencia patrimonial', 'Certificado de condiciones de suficiencia patrimonial.', 'Suficiencia Patrimonial', 'CSP', true, true, NULL, 'ips');

-- =============================================================================
-- TALENTO HUMANO — 6 documentos
-- =============================================================================
INSERT INTO document_catalog (code, name, description, category, standard_reference, is_mandatory, applies_to_all, expiry_months, provider_type) VALUES
('IPS-TH-001', 'Relación del personal de la entidad', 'Relación completa del personal vinculado a la institución.', 'Talento Humano', 'TH', true, true, NULL, 'ips'),
('IPS-TH-002', 'Hojas de vida por servicio', 'Hojas de vida por servicio que incluyan los soportes legales requeridos.', 'Talento Humano', 'TH', true, true, NULL, 'ips'),
('IPS-TH-003', 'Formato de capacidad instalada', 'Formato de capacidad instalada del talento humano por servicio.', 'Talento Humano', 'TH', true, true, NULL, 'ips'),
('IPS-TH-004', 'Programa de capacitaciones y cronograma', 'Programa de capacitaciones del personal con cronograma de ejecución.', 'Talento Humano', 'TH', true, true, NULL, 'ips'),
('IPS-TH-005', 'Capacitaciones realizadas del año', 'Registro y soportes de capacitaciones realizadas durante el año.', 'Talento Humano', 'TH', true, true, NULL, 'ips'),
('IPS-TH-006', 'Comités y cronograma', 'Actas de comités institucionales y cronograma de reuniones.', 'Talento Humano', 'TH', true, true, NULL, 'ips');

-- =============================================================================
-- INFRAESTRUCTURA — 11 documentos
-- =============================================================================
INSERT INTO document_catalog (code, name, description, category, standard_reference, is_mandatory, applies_to_all, expiry_months, provider_type) VALUES
('IPS-INF-001', 'Concepto del uso del suelo', 'Certificado o concepto de uso del suelo del establecimiento.', 'Infraestructura', 'INF', true, true, NULL, 'ips'),
('IPS-INF-002', 'Licencia de construcción', 'Licencia de construcción del establecimiento. CRÍTICO.', 'Infraestructura', 'INF', true, true, NULL, 'ips'),
('IPS-INF-003', 'Plan de mantenimiento de infraestructura', 'Plan de mantenimiento de infraestructura con cronograma de actividades.', 'Infraestructura', 'INF', true, true, NULL, 'ips'),
('IPS-INF-004', 'Certificado de bomberos', 'Certificado de bomberos vigente, no mayor a 1 año.', 'Infraestructura', 'INF', true, true, 12, 'ips'),
('IPS-INF-005', 'Certificado eléctrico', 'Certificado eléctrico vigente, no mayor a 5 años.', 'Infraestructura', 'INF', true, true, 60, 'ips'),
('IPS-INF-006', 'Planillas de limpieza y desinfección', 'Planillas o registros de limpieza y desinfección de instalaciones.', 'Infraestructura', 'INF', true, true, NULL, 'ips'),
('IPS-INF-007', 'Plano de la institución con medidas', 'Plano de la institución con medidas por servicio.', 'Infraestructura', 'INF', true, true, NULL, 'ips'),
('IPS-INF-008', 'Plan hospitalario de emergencias', 'Plan hospitalario de emergencias (PHE) de la institución.', 'Infraestructura', 'INF', true, true, NULL, 'ips'),
('IPS-INF-009', 'Plano de ruta de evacuación', 'Plano de ruta de evacuación por piso.', 'Infraestructura', 'INF', true, true, NULL, 'ips'),
('IPS-INF-010', 'Mantenimiento de ascensor', 'Registro de mantenimiento de ascensor cuando aplica.', 'Infraestructura', 'INF', false, true, NULL, 'ips'),
('IPS-INF-011', 'Plano de ruta sanitaria', 'Plano de ruta sanitaria de la institución.', 'Infraestructura', 'INF', true, true, NULL, 'ips');

-- =============================================================================
-- CONCEPTO SANITARIO — 15 documentos
-- =============================================================================
INSERT INTO document_catalog (code, name, description, category, standard_reference, is_mandatory, applies_to_all, expiry_months, provider_type) VALUES
('IPS-CS-001', 'Certificado de fumigación', 'Certificado de fumigación con licencia del proveedor.', 'Concepto Sanitario', 'CS', true, true, 12, 'ips'),
('IPS-CS-002', 'Certificado de lavado de tanques', 'Certificado de lavado de tanques de reserva de agua.', 'Concepto Sanitario', 'CS', true, true, 12, 'ips'),
('IPS-CS-003', 'Timbre de emergencia unidades sanitarias', 'Timbre de emergencia en unidades sanitarias para persona con movilidad reducida.', 'Concepto Sanitario', 'CS', true, true, NULL, 'ips'),
('IPS-CS-004', 'Alarma de emergencia', 'Sistema de alarma de emergencia institucional.', 'Concepto Sanitario', 'CS', true, true, NULL, 'ips'),
('IPS-CS-005', 'Existencia de botiquín', 'Evidencia de existencia y dotación del botiquín institucional.', 'Concepto Sanitario', 'CS', true, true, NULL, 'ips'),
('IPS-CS-006', 'Extintores', 'Registro y mantenimiento de extintores vigentes.', 'Concepto Sanitario', 'CS', true, true, 12, 'ips'),
('IPS-CS-007', 'Contrato biosanitarios', 'Contrato con empresa gestora de residuos biosanitarios.', 'Concepto Sanitario', 'CS', true, true, NULL, 'ips'),
('IPS-CS-008', 'PGIRASA', 'Plan de Gestión Integral de Residuos Sólidos y Peligrosos (PGIRASA).', 'Concepto Sanitario', 'CS', true, true, NULL, 'ips'),
('IPS-CS-009', 'Acta de disposición final de residuos', 'Acta de disposición final de residuos peligrosos.', 'Concepto Sanitario', 'CS', true, true, NULL, 'ips'),
('IPS-CS-010', 'Auditoría externa', 'Informe de auditoría externa realizada a la institución.', 'Concepto Sanitario', 'CS', true, true, NULL, 'ips'),
('IPS-CS-011', 'Auditorías internas', 'Registros e informes de auditorías internas realizadas.', 'Concepto Sanitario', 'CS', true, true, NULL, 'ips'),
('IPS-CS-012', 'Capacitaciones de PGIRASA', 'Soportes de capacitaciones en gestión de residuos (PGIRASA).', 'Concepto Sanitario', 'CS', true, true, NULL, 'ips'),
('IPS-CS-013', 'Comité GAGAS', 'Actas del Comité de Gestión Ambiental y Gestión Ambiental en Salud (GAGAS).', 'Concepto Sanitario', 'CS', true, true, NULL, 'ips'),
('IPS-CS-014', 'Manifiestos de empresa recolectora', 'Manifiestos de la empresa recolectora de residuos peligrosos.', 'Concepto Sanitario', 'CS', true, true, NULL, 'ips'),
('IPS-CS-015', 'Certificado de concepto sanitario', 'Certificado de concepto sanitario vigente de la institución.', 'Concepto Sanitario', 'CS', true, true, 12, 'ips');

-- =============================================================================
-- DOTACIÓN Y MANTENIMIENTO — 7 documentos
-- =============================================================================
INSERT INTO document_catalog (code, name, description, category, standard_reference, is_mandatory, applies_to_all, expiry_months, provider_type) VALUES
('IPS-DOT-001', 'Registro de equipos por servicio', 'Inventario o registro de equipos biomédicos por servicio.', 'Dotación y Mantenimiento', 'DOT', true, true, NULL, 'ips'),
('IPS-DOT-002', 'Programa de mantenimiento', 'Programa de mantenimiento preventivo y correctivo de equipos.', 'Dotación y Mantenimiento', 'DOT', true, true, NULL, 'ips'),
('IPS-DOT-003', 'Hojas de vida de equipos biomédicos', 'Hojas de vida de equipos biomédicos con factura, INVIMA y permisos.', 'Dotación y Mantenimiento', 'DOT', true, true, NULL, 'ips'),
('IPS-DOT-004', 'Registros de mantenimientos y calibraciones', 'Registros de mantenimientos preventivos, correctivos y calibraciones realizadas.', 'Dotación y Mantenimiento', 'DOT', true, true, NULL, 'ips'),
('IPS-DOT-005', 'Programa de capacitación en dispositivos médicos', 'Programa de capacitación del personal en el uso de dispositivos médicos.', 'Dotación y Mantenimiento', 'DOT', true, true, NULL, 'ips'),
('IPS-DOT-006', 'Suficiencia de equipos biomédicos', 'Documento de suficiencia o inventario de equipos biomédicos disponibles.', 'Dotación y Mantenimiento', 'DOT', true, true, NULL, 'ips'),
('IPS-DOT-007', 'Hoja de vida del biomédico', 'Hoja de vida del profesional biomédico con soportes y contrato.', 'Dotación y Mantenimiento', 'DOT', true, true, NULL, 'ips');

-- =============================================================================
-- MEDICAMENTOS, DM E INSUMOS — 9 documentos
-- =============================================================================
INSERT INTO document_catalog (code, name, description, category, standard_reference, is_mandatory, applies_to_all, expiry_months, provider_type) VALUES
('IPS-MED-001', 'Registro de medicamentos', 'Registro actualizado de medicamentos utilizados en la institución.', 'Medicamentos, DM e Insumos', 'MED', true, true, NULL, 'ips'),
('IPS-MED-002', 'Registro de dispositivos médicos', 'Registro actualizado de dispositivos médicos utilizados.', 'Medicamentos, DM e Insumos', 'MED', true, true, NULL, 'ips'),
('IPS-MED-003', 'Registro de reactivos', 'Registro de reactivos de laboratorio o diagnóstico.', 'Medicamentos, DM e Insumos', 'MED', true, true, NULL, 'ips'),
('IPS-MED-004', 'Procedimiento de gestión de insumos', 'Procedimiento documentado para la gestión de insumos médicos.', 'Medicamentos, DM e Insumos', 'MED', true, true, NULL, 'ips'),
('IPS-MED-005', 'Programa de farmacovigilancia', 'Programas de farmacovigilancia y reportes al sistema de vigilancia.', 'Medicamentos, DM e Insumos', 'MED', true, true, NULL, 'ips'),
('IPS-MED-006', 'Programa de tecnovigilancia', 'Programa de tecnovigilancia de dispositivos médicos y reportes.', 'Medicamentos, DM e Insumos', 'MED', true, true, NULL, 'ips'),
('IPS-MED-007', 'Registro de temperatura y humedad', 'Registro de control de temperatura y humedad para almacenamiento de medicamentos.', 'Medicamentos, DM e Insumos', 'MED', true, true, NULL, 'ips'),
('IPS-MED-008', 'Procedimiento manejo de derrames', 'Procedimiento para el manejo de derrames y rupturas de medicamentos.', 'Medicamentos, DM e Insumos', 'MED', true, true, NULL, 'ips'),
('IPS-MED-009', 'Protocolo de alertas sanitarias', 'Protocolo de verificación y atención de alertas sanitarias.', 'Medicamentos, DM e Insumos', 'MED', true, true, NULL, 'ips');

-- =============================================================================
-- PROCESOS PRIORITARIOS — 25 documentos
-- =============================================================================
INSERT INTO document_catalog (code, name, description, category, standard_reference, is_mandatory, applies_to_all, expiry_months, provider_type) VALUES
('IPS-PP-001', 'Política de seguridad del paciente', 'Política institucional de seguridad del paciente aprobada y vigente.', 'Procesos Prioritarios', 'PP', true, true, NULL, 'ips'),
('IPS-PP-002', 'Programa de seguridad del paciente', 'Programa institucional de seguridad del paciente con actividades y metas.', 'Procesos Prioritarios', 'PP', true, true, NULL, 'ips'),
('IPS-PP-003', 'Acta conformación comité de seguridad del paciente', 'Acta de conformación del comité institucional de seguridad del paciente.', 'Procesos Prioritarios', 'PP', true, true, NULL, 'ips'),
('IPS-PP-004', 'Formatos del ministerio de seguridad del paciente', '4 formatos del Ministerio de Salud relacionados con seguridad del paciente.', 'Procesos Prioritarios', 'PP', true, true, NULL, 'ips'),
('IPS-PP-005', 'Procedimiento de identificación del paciente', 'Procedimiento documentado para la correcta identificación del paciente.', 'Procesos Prioritarios', 'PP', true, true, NULL, 'ips'),
('IPS-PP-006', 'Procedimiento de comunicación asistencial', 'Procedimiento de comunicación efectiva en el entorno asistencial.', 'Procesos Prioritarios', 'PP', true, true, NULL, 'ips'),
('IPS-PP-007', 'Procedimiento de prevención de infecciones', 'Procedimiento para la prevención y control de infecciones asociadas a la atención en salud.', 'Procesos Prioritarios', 'PP', true, true, NULL, 'ips'),
('IPS-PP-008', 'Procedimiento de eventos adversos', 'Procedimiento para la detección, análisis y reporte de eventos adversos.', 'Procesos Prioritarios', 'PP', true, true, NULL, 'ips'),
('IPS-PP-009', 'Procedimiento de consentimiento informado', 'Procedimiento institucional de consentimiento informado al paciente.', 'Procesos Prioritarios', 'PP', true, true, NULL, 'ips'),
('IPS-PP-010', 'Procedimiento de uso seguro de medicamentos', 'Procedimiento para el uso seguro de medicamentos en la institución.', 'Procesos Prioritarios', 'PP', true, true, NULL, 'ips'),
('IPS-PP-011', 'Procedimiento de prevención de caídas', 'Procedimiento para la identificación de riesgo y prevención de caídas.', 'Procesos Prioritarios', 'PP', true, true, NULL, 'ips'),
('IPS-PP-012', 'Procedimiento de rondas de seguridad', 'Procedimiento y registros de rondas de seguridad institucional.', 'Procesos Prioritarios', 'PP', true, true, NULL, 'ips'),
('IPS-PP-013', 'Registro de análisis de eventos adversos', 'Registros del análisis de causas de eventos adversos ocurridos.', 'Procesos Prioritarios', 'PP', true, true, NULL, 'ips'),
('IPS-PP-014', 'Capacitación en seguridad del paciente', 'Soportes de capacitación del personal en seguridad del paciente.', 'Procesos Prioritarios', 'PP', true, true, NULL, 'ips'),
('IPS-PP-015', 'Documento de autocuidado del paciente', 'Documento o material educativo de autocuidado entregado al paciente.', 'Procesos Prioritarios', 'PP', true, true, NULL, 'ips'),
('IPS-PP-016', 'Guías de manejo por servicio', 'Guías de práctica clínica o de manejo adoptadas por servicio.', 'Procesos Prioritarios', 'PP', true, true, NULL, 'ips'),
('IPS-PP-017', 'Procedimiento de adopción de guías', 'Procedimiento institucional para la adopción y actualización de guías clínicas.', 'Procesos Prioritarios', 'PP', true, true, NULL, 'ips'),
('IPS-PP-018', 'Protocolos de manejo por servicios', 'Protocolos de manejo clínico adoptados por cada servicio.', 'Procesos Prioritarios', 'PP', true, true, NULL, 'ips'),
('IPS-PP-019', 'Procedimiento de aseo, limpieza y desinfección', 'Procedimiento de aseo, limpieza y desinfección de áreas asistenciales.', 'Procesos Prioritarios', 'PP', true, true, NULL, 'ips'),
('IPS-PP-020', 'Manual de bioseguridad', 'Manual institucional de bioseguridad.', 'Procesos Prioritarios', 'PP', true, true, NULL, 'ips'),
('IPS-PP-021', 'Procedimiento de descontaminación por derrames', 'Procedimiento para la descontaminación en casos de derrames de material biológico.', 'Procesos Prioritarios', 'PP', true, true, NULL, 'ips'),
('IPS-PP-022', 'Política de no uso y reuso de dispositivos médicos', 'Política institucional sobre no uso y reuso de dispositivos médicos de un solo uso.', 'Procesos Prioritarios', 'PP', true, true, NULL, 'ips'),
('IPS-PP-023', 'Procedimiento de referencia de pacientes', 'Procedimiento para la referencia y contrarreferencia de pacientes.', 'Procesos Prioritarios', 'PP', true, true, NULL, 'ips'),
('IPS-PP-024', 'Atención a víctimas de violencia sexual', 'Documento para la atención a víctimas de violencia sexual.', 'Procesos Prioritarios', 'PP', true, true, NULL, 'ips'),
('IPS-PP-025', 'Conformación equipo atención víctimas de violencia sexual', 'Acta de conformación del equipo de atención integral a víctimas de violencia sexual.', 'Procesos Prioritarios', 'PP', true, true, NULL, 'ips');

-- =============================================================================
-- HISTORIA CLÍNICA Y REGISTROS — 6 documentos
-- =============================================================================
INSERT INTO document_catalog (code, name, description, category, standard_reference, is_mandatory, applies_to_all, expiry_months, provider_type) VALUES
('IPS-HC-001', 'Procedimiento de manejo de historia clínica', 'Procedimiento documentado para el manejo, custodia y conservación de la historia clínica.', 'Historia Clínica y Registros', 'HC', true, true, NULL, 'ips'),
('IPS-HC-002', 'Registro de entrada y salida de historias clínicas', 'Registro o sistema de control de entrada y salida de historias clínicas.', 'Historia Clínica y Registros', 'HC', true, true, NULL, 'ips'),
('IPS-HC-003', 'Historia clínica digital', 'Sistema o software de historia clínica digital implementado.', 'Historia Clínica y Registros', 'HC', true, true, NULL, 'ips'),
('IPS-HC-004', 'Procedimiento de consentimiento informado', 'Procedimiento para la obtención del consentimiento informado del paciente.', 'Historia Clínica y Registros', 'HC', true, true, NULL, 'ips'),
('IPS-HC-005', 'Consentimientos informados por servicio', 'Formatos de consentimientos informados específicos por servicio.', 'Historia Clínica y Registros', 'HC', true, true, NULL, 'ips'),
('IPS-HC-006', 'Certificado del ingeniero de sistemas', 'Certificado del ingeniero de sistemas responsable del sistema de información.', 'Historia Clínica y Registros', 'HC', true, true, NULL, 'ips');

-- =============================================================================
-- INTERDEPENDENCIA DE SERVICIOS — 1 documento
-- =============================================================================
INSERT INTO document_catalog (code, name, description, category, standard_reference, is_mandatory, applies_to_all, expiry_months, provider_type) VALUES
('IPS-INT-001', 'Contratos de interdependencia de servicios', 'Contratos de interdependencia de servicios cuando aplique.', 'Interdependencia de Servicios', 'INT', false, true, NULL, 'ips');

-- =============================================================================
-- REPORTES OBLIGATORIOS — 8 documentos
-- =============================================================================
INSERT INTO document_catalog (code, name, description, category, standard_reference, is_mandatory, applies_to_all, expiry_months, provider_type) VALUES
('IPS-REP-001', 'Resolución 256 – Indicadores de calidad', 'Reporte de indicadores de calidad según Resolución 256 de 2016.', 'Reportes Obligatorios', 'REP', true, true, NULL, 'ips'),
('IPS-REP-002', 'PAMEC', 'Programa de Auditoría para el Mejoramiento de la Calidad (PAMEC) del año vigente.', 'Reportes Obligatorios', 'REP', true, true, NULL, 'ips'),
('IPS-REP-003', 'Resolución 2063 – Participación Social en Salud', 'Política de Participación Social en Salud según Resolución 2063 de 2017.', 'Reportes Obligatorios', 'REP', true, true, NULL, 'ips'),
('IPS-REP-004', 'RIPS', 'Registro Individual de Prestación de Servicios de Salud (RIPS).', 'Reportes Obligatorios', 'REP', true, true, NULL, 'ips'),
('IPS-REP-005', 'Farmacovigilancia', 'Reportes de farmacovigilancia ante el INVIMA.', 'Reportes Obligatorios', 'REP', true, true, NULL, 'ips'),
('IPS-REP-006', 'Tecnovigilancia', 'Reportes de tecnovigilancia de dispositivos médicos ante el INVIMA.', 'Reportes Obligatorios', 'REP', true, true, NULL, 'ips'),
('IPS-REP-007', 'Reactivovigilancia', 'Reportes de reactivovigilancia cuando aplique.', 'Reportes Obligatorios', 'REP', false, true, NULL, 'ips'),
('IPS-REP-008', 'Hemovigilancia', 'Reportes de hemovigilancia cuando aplique.', 'Reportes Obligatorios', 'REP', false, true, NULL, 'ips');

-- =============================================================================
-- PAMEC — 11 documentos
-- =============================================================================
INSERT INTO document_catalog (code, name, description, category, standard_reference, is_mandatory, applies_to_all, expiry_months, provider_type) VALUES
('IPS-PAM-001', 'PAMEC teórico y cronograma', 'Documento teórico del PAMEC con cronograma de actividades.', 'PAMEC', 'PAM', true, true, NULL, 'ips'),
('IPS-PAM-002', 'Matriz consolidada del PAMEC', 'Matriz consolidada con todos los procesos del PAMEC.', 'PAMEC', 'PAM', true, true, NULL, 'ips'),
('IPS-PAM-003', 'Autoevaluación institucional', 'Autoevaluación de la calidad de la atención realizada por la institución.', 'PAMEC', 'PAM', true, true, NULL, 'ips'),
('IPS-PAM-004', 'Selección de procesos a mejorar', 'Documento de selección de procesos prioritarios a mejorar.', 'PAMEC', 'PAM', true, true, NULL, 'ips'),
('IPS-PAM-005', 'Priorización de procesos', 'Matriz de priorización de procesos para el mejoramiento continuo.', 'PAMEC', 'PAM', true, true, NULL, 'ips'),
('IPS-PAM-006', 'Definición de calidad esperada', 'Documento de definición de la calidad esperada en los procesos priorizados.', 'PAMEC', 'PAM', true, true, NULL, 'ips'),
('IPS-PAM-007', 'Medición inicial del desempeño', 'Registro de medición inicial del desempeño de los procesos seleccionados.', 'PAMEC', 'PAM', true, true, NULL, 'ips'),
('IPS-PAM-008', 'Formulación del plan de acción', 'Plan de acción formulado para el mejoramiento de los procesos priorizados.', 'PAMEC', 'PAM', true, true, NULL, 'ips'),
('IPS-PAM-009', 'Ejecución del plan de acción', 'Soportes de ejecución de las actividades del plan de acción del PAMEC.', 'PAMEC', 'PAM', true, true, NULL, 'ips'),
('IPS-PAM-010', 'Evaluación del plan de acción', 'Informe de evaluación de los resultados del plan de acción ejecutado.', 'PAMEC', 'PAM', true, true, NULL, 'ips'),
('IPS-PAM-011', 'Aprendizaje organizacional', 'Documento de aprendizaje organizacional derivado del ciclo PAMEC.', 'PAMEC', 'PAM', true, true, NULL, 'ips');

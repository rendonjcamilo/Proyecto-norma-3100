-- =============================================================================
-- REEMPLAZAR CATÁLOGO DOCUMENTAL — PROFESIONAL INDEPENDIENTE
-- Basado en: AUDITORIA_PROFESIONAL PROFESIONAL INDEPENDIENTE 2026.xlsx
-- Hoja: Auditoría Documental (79 criterios documentales)
-- Resolución 3100 de 2019 — 6 estándares transversales aplicables
-- =============================================================================

-- Limpiar catálogo anterior y documentos del prestador referenciados
TRUNCATE TABLE document_catalog CASCADE;

-- =============================================================================
-- TALENTO HUMANO — 4 documentos
-- =============================================================================
INSERT INTO document_catalog (code, name, description, category, standard_reference, is_mandatory, applies_to_all, expiry_months) VALUES
('TH-001',
 'Programa de capacitación al personal',
 'Programa de capacitación al personal: i) análisis de necesidades, ii) planificación, iii) contenidos, iv) duración, v) formadores, vi) ejecución, evaluación y seguimiento. CRÍTICO.',
 'Talento Humano', 'TSTH', true, true, NULL),

('TH-002',
 'Cronograma del programa de capacitación',
 'Cronograma del programa de capacitación del personal.',
 'Talento Humano', 'TSTH', true, true, NULL),

('TH-003',
 'Soportes de ejecución del programa de capacitación',
 'Soportes de ejecución del programa de capacitación (listas de asistencia, certificados).',
 'Talento Humano', 'TSTH', true, true, NULL),

('TH-004',
 'Listado de documentos para hoja de vida del personal',
 'Listado de documentos requeridos para conformar la hoja de vida del personal.',
 'Talento Humano', 'TSTH', true, true, NULL);

-- =============================================================================
-- INFRAESTRUCTURA — 14 documentos
-- =============================================================================
INSERT INTO document_catalog (code, name, description, category, standard_reference, is_mandatory, applies_to_all, expiry_months) VALUES
('INF-001',
 'Licencia de construcción',
 'Licencia de construcción del establecimiento. CRÍTICO.',
 'Infraestructura', 'TSINF', true, true, NULL),

('INF-002',
 'Uso de suelos',
 'Certificado o documento de uso de suelos. CRÍTICO.',
 'Infraestructura', 'TSINF', true, true, NULL),

('INF-003',
 'Certificado de Bomberos',
 'Certificado de Bomberos vigente. CRÍTICO.',
 'Infraestructura', 'TSINF', true, true, 12),

('INF-004',
 'Certificado RETIE / Ingeniero eléctrico',
 'Certificado RETIE o concepto de ingeniero eléctrico sobre las instalaciones eléctricas. CRÍTICO.',
 'Infraestructura', 'TSINF', true, true, NULL),

('INF-005',
 'Acta de visita de salud pública (concepto sanitario)',
 'Acta de visita de salud pública o concepto sanitario vigente. CRÍTICO.',
 'Infraestructura', 'TSINF', true, true, 12),

('INF-006',
 'Programa de mantenimiento de infraestructura y equipos fijos',
 'Programa de mantenimiento de infraestructura y equipos fijos del establecimiento.',
 'Infraestructura', 'TSINF', true, true, NULL),

('INF-007',
 'Protocolo de lavado de tanques y caracterización del agua',
 'Protocolo de lavado de tanques y caracterización del agua.',
 'Infraestructura', 'TSINF', true, true, NULL),

('INF-008',
 'Protocolo de fumigación',
 'Protocolo de fumigación y control de plagas.',
 'Infraestructura', 'TSINF', true, true, NULL),

('INF-009',
 'Plan hospitalario de emergencia',
 'Plan hospitalario de emergencia y gestión del riesgo.',
 'Infraestructura', 'TSINF', true, true, NULL),

('INF-010',
 'Plan de gestión integral de residuos hospitalarios y RH1',
 'Plan de gestión integral de residuos hospitalarios (PGIRHS) y formato RH1. CRÍTICO.',
 'Infraestructura', 'TSINF', true, true, NULL),

('INF-011',
 'Formato RH1',
 'Formato RH1 de generación y gestión de residuos hospitalarios.',
 'Infraestructura', 'TSINF', true, true, NULL),

('INF-012',
 'Planillas de limpieza y desinfección',
 'Planillas de registro de actividades de limpieza y desinfección.',
 'Infraestructura', 'TSINF', true, true, NULL),

('INF-013',
 'Ruta de evacuación por piso',
 'Ruta de evacuación por piso (señalizada y visible), verificada documentalmente y de forma visual.',
 'Infraestructura', 'TSINF', true, true, NULL),

('INF-014',
 'Ruta sanitaria de residuos',
 'Ruta sanitaria de residuos, verificada documentalmente y de forma visual.',
 'Infraestructura', 'TSINF', true, true, NULL);

-- =============================================================================
-- DOTACIÓN — 9 documentos
-- =============================================================================
INSERT INTO document_catalog (code, name, description, category, standard_reference, is_mandatory, applies_to_all, expiry_months) VALUES
('DOT-001',
 'Relación de equipos biomédicos',
 'Relación de equipos biomédicos: nombre, marca, modelo, serie, registro sanitario, clasificación del riesgo.',
 'Dotación', 'TSDOT', true, true, NULL),

('DOT-002',
 'Hoja de vida de equipos biomédicos',
 'Formato hoja de vida de equipos biomédicos.',
 'Dotación', 'TSDOT', true, true, NULL),

('DOT-003',
 'Cronograma de mantenimientos de equipos biomédicos',
 'Formato cronograma de mantenimientos de los equipos biomédicos.',
 'Dotación', 'TSDOT', true, true, NULL),

('DOT-004',
 'Registro de mantenimientos de equipos biomédicos',
 'Registro de mantenimientos de equipos biomédicos (preventivo, correctivo, calibraciones).',
 'Dotación', 'TSDOT', true, true, NULL),

('DOT-005',
 'Programa de mantenimiento preventivo de equipos biomédicos',
 'Programa de mantenimiento preventivo de equipos biomédicos, incluye recomendaciones del fabricante.',
 'Dotación', 'TSDOT', true, true, NULL),

('DOT-006',
 'Capacitaciones en equipos biomédicos',
 'Capacitaciones en equipos biomédicos (cuando se requieran), incluidas dentro del programa de capacitaciones.',
 'Dotación', 'TSDOT', true, true, NULL),

('DOT-007',
 'Registro de suficiencia de equipos biomédicos',
 'Registro de suficiencia de equipos biomédicos.',
 'Dotación', 'TSDOT', true, true, NULL),

('DOT-008',
 'Hoja de vida del responsable de mantenimiento',
 'Hoja de vida del responsable de mantenimiento de equipos con soportes y/o contrato.',
 'Dotación', 'TSDOT', true, true, NULL),

('DOT-009',
 'Certificado telemedicina — ingeniero de sistemas',
 'Equipos para telemedicina: certificado de cumplimiento emitido por ingeniero de sistemas con tarjeta profesional vigente (cuando aplique).',
 'Dotación', 'TSDOT', false, true, NULL);

-- =============================================================================
-- MEDICAMENTOS, DISPOSITIVOS E INSUMOS — 12 documentos
-- =============================================================================
INSERT INTO document_catalog (code, name, description, category, standard_reference, is_mandatory, applies_to_all, expiry_months) VALUES
('MDI-001',
 'Relación de medicamentos',
 'Relación de medicamentos: principio activo, forma farmacéutica, concentración, lote, fecha de vencimiento, presentación comercial, unidad de medida, registro sanitario.',
 'Medicamentos, Dispositivos e Insumos', 'TSMD', true, true, NULL),

('MDI-002',
 'Relación de dispositivos médicos',
 'Relación de dispositivos médicos: descripción, marca, serie, presentación comercial, registro sanitario, clasificación de riesgo, vida útil, lote, fecha de vencimiento.',
 'Medicamentos, Dispositivos e Insumos', 'TSMD', true, true, NULL),

('MDI-003',
 'Relación de reactivos',
 'Relación de reactivos: nombre, marca, presentación comercial, registro sanitario, clasificación del riesgo, vida útil, fecha de vencimiento, lote.',
 'Medicamentos, Dispositivos e Insumos', 'TSMD', true, true, NULL),

('MDI-004',
 'Información documentada gestión de medicamentos e insumos',
 'Información documentada: selección, adquisición, transporte, recepción, almacenamiento, conservación, control de fechas de vencimiento, cadena de frío, distribución, dispensación, devolución, disposición final. CRÍTICO.',
 'Medicamentos, Dispositivos e Insumos', 'TSMD', true, true, NULL),

('MDI-005',
 'Autorización medicamentos de control — Fondo Nacional de Estupefacientes',
 'Medicamentos de control: resolución de autorización vigente expedida por el Fondo Nacional de Estupefacientes (cuando aplique). CRÍTICO.',
 'Medicamentos, Dispositivos e Insumos', 'TSMD', false, true, NULL),

('MDI-006',
 'Programa de Farmacovigilancia',
 'Programa de Farmacovigilancia: inscripción y reportes mensuales.',
 'Medicamentos, Dispositivos e Insumos', 'TSMD', true, true, NULL),

('MDI-007',
 'Programa de Tecnovigilancia',
 'Programa de Tecnovigilancia: inscripción y reportes trimestrales.',
 'Medicamentos, Dispositivos e Insumos', 'TSMD', true, true, NULL),

('MDI-008',
 'Programa de Reactivovigilancia',
 'Programa de Reactivovigilancia: inscripción y reportes trimestrales (cuando aplique).',
 'Medicamentos, Dispositivos e Insumos', 'TSMD', false, true, NULL),

('MDI-009',
 'Alertas sanitarias y seguimiento',
 'Alertas sanitarias y seguimiento a las mismas.',
 'Medicamentos, Dispositivos e Insumos', 'TSMD', true, true, NULL),

('MDI-010',
 'Formato control de temperatura y humedad',
 'Formato control de temperatura y humedad en almacenamiento.',
 'Medicamentos, Dispositivos e Insumos', 'TSMD', true, true, NULL),

('MDI-011',
 'Protocolo de lavado de manos o higienización',
 'Protocolo de lavado de manos o higienización (jabón, sistema de secado). CRÍTICO.',
 'Medicamentos, Dispositivos e Insumos', 'TSMD', true, true, NULL),

('MDI-012',
 'Información documentada sobre derrame de medicamentos',
 'Información documentada sobre derrame de medicamentos con respectivo kit.',
 'Medicamentos, Dispositivos e Insumos', 'TSMD', true, true, NULL);

-- =============================================================================
-- PROCESOS PRIORITARIOS — 32 documentos
-- =============================================================================
INSERT INTO document_catalog (code, name, description, category, standard_reference, is_mandatory, applies_to_all, expiry_months) VALUES
('PP-001',
 'Programa de seguridad del paciente',
 'Programa de seguridad del paciente: incluye lista de chequeo de seguridad del paciente. CRÍTICO.',
 'Procesos Prioritarios', 'TSPP', true, true, NULL),

('PP-002',
 'Acta de creación del comité de seguridad del paciente',
 'Acta de creación del comité de seguridad del paciente y seguimientos.',
 'Procesos Prioritarios', 'TSPP', true, true, NULL),

('PP-003',
 'Identificación correcta del paciente',
 'Información documentada para correcta identificación del paciente (mínimo 2 identificadores: nombre completo y número de identificación). CRÍTICO.',
 'Procesos Prioritarios', 'TSPP', true, true, NULL),

('PP-004',
 'Comunicación adecuada con enfoque diferencial',
 'Gestión de comunicación adecuada con enfoque diferencial (género, etnia, ciclo de vida u otros).',
 'Procesos Prioritarios', 'TSPP', true, true, NULL),

('PP-005',
 'Prevención de infecciones asociadas a la atención',
 'Detección, prevención y reducción de infecciones asociadas a la atención en salud. Incluye protocolo de higiene de manos con soluciones a base de alcohol. CRÍTICO.',
 'Procesos Prioritarios', 'TSPP', true, true, NULL),

('PP-006',
 'Gestión de eventos adversos',
 'Detección, análisis y gestión de eventos adversos.',
 'Procesos Prioritarios', 'TSPP', true, true, NULL),

('PP-007',
 'Procedimientos de consentimiento informado',
 'Garantizar la funcionalidad de los procedimientos de consentimiento informado. CRÍTICO.',
 'Procesos Prioritarios', 'TSPP', true, true, NULL),

('PP-008',
 'Seguridad en la utilización de medicamentos',
 'Mejorar la seguridad en la utilización de medicamentos (cuando aplique).',
 'Procesos Prioritarios', 'TSPP', false, true, NULL),

('PP-009',
 'Prevención y reducción de caídas',
 'Prevenir y reducir la frecuencia de caídas.',
 'Procesos Prioritarios', 'TSPP', true, true, NULL),

('PP-010',
 'Atención segura de la gestante y el recién nacido',
 'Garantizar la atención segura de la gestante y el recién nacido (donde aplique).',
 'Procesos Prioritarios', 'TSPP', false, true, NULL),

('PP-011',
 'Seguridad en transfusión sanguínea',
 'Prevenir complicaciones asociadas a disponibilidad y manejo de sangre y transfusión sanguínea (donde aplique).',
 'Procesos Prioritarios', 'TSPP', false, true, NULL),

('PP-012',
 'Prevención de úlceras por presión',
 'Prevenir úlceras por presión (donde aplique).',
 'Procesos Prioritarios', 'TSPP', false, true, NULL),

('PP-013',
 'Seguridad en procedimientos quirúrgicos',
 'Mejorar la seguridad en los procedimientos quirúrgicos (donde aplique).',
 'Procesos Prioritarios', 'TSPP', false, true, NULL),

('PP-014',
 'Capacitación en seguridad del paciente',
 'Capacitación del personal en seguridad del paciente y principales riesgos de la atención.',
 'Procesos Prioritarios', 'TSPP', true, true, NULL),

('PP-015',
 'Ilustración al paciente y allegados en autocuidado',
 'Actividades de ilustración al paciente y allegados en el autocuidado de su seguridad.',
 'Procesos Prioritarios', 'TSPP', true, true, NULL),

('PP-016',
 'Modelo de atención',
 'Modelo de atención: incluye talento humano, enfoque diferencial, equipos biomédicos, medicamentos y dispositivos médicos e insumos.',
 'Procesos Prioritarios', 'TSPP', true, true, NULL),

('PP-017',
 'Socialización de procesos documentales al personal',
 'Socialización de los procesos documentales al personal (cronograma, listas de asistencia, certificados).',
 'Procesos Prioritarios', 'TSPP', true, true, NULL),

('PP-018',
 'Guías de manejo clínico',
 'Guías de manejo (nacionales o internacionales basadas en evidencia científica). CRÍTICO.',
 'Procesos Prioritarios', 'TSPP', true, true, NULL),

('PP-019',
 'Adopción, adaptación o desarrollo de guías',
 'Información documentada de la adopción, adaptación o desarrollo de guías.',
 'Procesos Prioritarios', 'TSPP', true, true, NULL),

('PP-020',
 'Protocolos de manejo clínico',
 'Protocolos de manejo clínico.',
 'Procesos Prioritarios', 'TSPP', true, true, NULL),

('PP-021',
 'Prevención de riesgo de accidentes radiológicos',
 'Información documentada: detección, prevención y disminución del riesgo de accidentes radiológicos (donde aplique).',
 'Procesos Prioritarios', 'TSPP', false, true, NULL),

('PP-022',
 'Protocolo de aseo, limpieza y desinfección de áreas',
 'Protocolo de aseo, limpieza y desinfección de áreas y superficies. CRÍTICO.',
 'Procesos Prioritarios', 'TSPP', true, true, NULL),

('PP-023',
 'Procedimiento de reanimación (RCP)',
 'Procedimiento de reanimación cerebro-cardio-pulmonar (donde se realice).',
 'Procesos Prioritarios', 'TSPP', false, true, NULL),

('PP-024',
 'Prevención de flebitis',
 'Acciones para prevenir flebitis infecciosas, químicas y mecánicas (donde aplique).',
 'Procesos Prioritarios', 'TSPP', false, true, NULL),

('PP-025',
 'Aspectos de bioseguridad',
 'Aspectos de bioseguridad acordes con las condiciones y características del servicio. CRÍTICO.',
 'Procesos Prioritarios', 'TSPP', true, true, NULL),

('PP-026',
 'Descontaminación por derrames de fluidos corporales',
 'Descontaminación por derrames de sangre u otros fluidos corporales.',
 'Procesos Prioritarios', 'TSPP', true, true, NULL),

('PP-027',
 'Manejo de gases medicinales',
 'Manejo de gases medicinales: atención de emergencias y sistema de alarma (cuando aplique).',
 'Procesos Prioritarios', 'TSPP', false, true, NULL),

('PP-028',
 'Manual de Esterilización',
 'Manual de Esterilización (cuando aplique): recibo, transporte, lavado, empaque, etiquetado, esterilización, almacenamiento, verificación, control de calidad.',
 'Procesos Prioritarios', 'TSPP', false, true, NULL),

('PP-029',
 'Política de no reúso y reúso de dispositivos médicos',
 'Política de no reúso y reúso de dispositivos médicos.',
 'Procesos Prioritarios', 'TSPP', true, true, NULL),

('PP-030',
 'Protocolo de referencia y contrarreferencia',
 'Protocolo de referencia y contrarreferencia. CRÍTICO.',
 'Procesos Prioritarios', 'TSPP', true, true, NULL),

('PP-031',
 'Atención en salud de víctimas de violencias sexuales',
 'Documento del proceso institucional para atención en salud de víctimas de violencias sexuales (donde aplique).',
 'Procesos Prioritarios', 'TSPP', false, true, NULL),

('PP-032',
 'Equipo institucional para atención de víctimas de violencias sexuales',
 'Documento de conformación del equipo institucional para atención de víctimas de violencias sexuales (donde aplique).',
 'Procesos Prioritarios', 'TSPP', false, true, NULL);

-- =============================================================================
-- HISTORIA CLÍNICA Y REGISTROS — 8 documentos
-- =============================================================================
INSERT INTO document_catalog (code, name, description, category, standard_reference, is_mandatory, applies_to_all, expiry_months) VALUES
('HCR-001',
 'Historia clínica única y registro de archivo físico',
 'Información documentada: procedimientos para utilizar historia única y registro de entrada/salida del archivo físico.',
 'Historia Clínica y Registros', 'TSHCR', true, true, NULL),

('HCR-002',
 'HC digital: licencia de software y backup',
 'HC digital: licencia de software, backup, registro no modificable (cuando aplique).',
 'Historia Clínica y Registros', 'TSHCR', false, true, NULL),

('HCR-003',
 'Componentes y contenidos mínimos de la historia clínica',
 'Las historias clínicas cuentan con componentes y contenidos mínimos (Resolución 1995/99). CRÍTICO.',
 'Historia Clínica y Registros', 'TSHCR', true, true, NULL),

('HCR-004',
 'Diligenciamiento correcto de la historia clínica',
 'La historia clínica y registros asistenciales se diligencian en forma clara, legible, sin tachones ni enmendaduras. CRÍTICO.',
 'Historia Clínica y Registros', 'TSHCR', true, true, NULL),

('HCR-005',
 'Anotaciones con fecha, hora y firma del autor',
 'Cada anotación lleva fecha, hora, nombre completo y firma del autor.',
 'Historia Clínica y Registros', 'TSHCR', true, true, NULL),

('HCR-006',
 'Procedimiento de consentimiento informado',
 'El prestador cuenta con procedimiento de consentimiento informado con mecanismos para verificar su aplicación. CRÍTICO.',
 'Historia Clínica y Registros', 'TSHCR', true, true, NULL),

('HCR-007',
 'Certificado ingeniero de sistemas para HC electrónica',
 'Cuando se usan mecanismos electrónicos: certificado de ingeniero de sistemas con tarjeta profesional vigente.',
 'Historia Clínica y Registros', 'TSHCR', false, true, NULL),

('HCR-008',
 'Registro del proceso de esterilización',
 'Proceso de esterilización: actividades documentadas, registro de cargas, resultados de control de calidad, listas de contenido de paquetes, etiquetado de trazabilidad (cuando aplique).',
 'Historia Clínica y Registros', 'TSHCR', false, true, NULL);

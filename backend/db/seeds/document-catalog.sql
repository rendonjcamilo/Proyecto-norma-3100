-- =============================================================================
-- CATÁLOGO DE DOCUMENTOS — RESOLUCIÓN 3100 DE 2019
-- Ministerio de Salud y Protección Social de Colombia
-- Condiciones de habilitación:
--   1. Capacidad Técnico-Administrativa (Capítulo 8)
--   2. Suficiencia Patrimonial y Financiera (Capítulo 9)
--   3. Capacidad Tecnológica y Científica — 7 Estándares Transversales (Capítulo 11)
--      TSTH · TSINF · TSDOT · TSMD · TSPP · TSHCR · TSINT
-- =============================================================================

-- =============================================================================
-- CONDICIÓN 1: CAPACIDAD TÉCNICO-ADMINISTRATIVA (Capítulo 8, Res. 3100/2019)
-- =============================================================================
INSERT INTO document_catalog (code, name, description, category, subcategory, standard_reference, is_mandatory, expiry_months) VALUES
('TA-001', 'Certificado de Existencia y Representación Legal',
 'Expedido por Cámara de Comercio. Debe tener máximo 30 días de expedición al momento de la radicación en el ente territorial.',
 'Técnico-Administrativa', 'Legal', 'RES3100-CAP8', true, 1),

('TA-002', 'RUT — Registro Único Tributario actualizado',
 'Registro Único Tributario expedido por la DIAN, actualizado con la actividad económica de prestación de servicios de salud.',
 'Técnico-Administrativa', 'Legal', 'RES3100-CAP8', true, 12),

('TA-003', 'Cédula de ciudadanía del Representante Legal',
 'Documento de identidad vigente del representante legal de la institución.',
 'Técnico-Administrativa', 'Legal', 'RES3100-CAP8', true, NULL),

('TA-004', 'Estatutos de constitución o acta de constitución',
 'Documento que acredita la personería jurídica o forma legal de la organización prestadora.',
 'Técnico-Administrativa', 'Legal', 'RES3100-CAP8', true, NULL),

('TA-005', 'Acta de inscripción o radicación en el REPS',
 'Constancia de radicación del proceso de habilitación ante la Secretaría de Salud competente o acto administrativo de habilitación vigente del REPS.',
 'Técnico-Administrativa', 'REPS', 'RES3100-CAP8', true, 60),

('TA-006', 'Certificado de uso del suelo compatible con servicio de salud',
 'Expedido por la autoridad municipal o distrital de planeación. Debe ser compatible con la actividad de prestación de servicios de salud.',
 'Técnico-Administrativa', 'Infraestructura', 'RES3100-CAP8-ART19', true, 12),

('TA-007', 'Concepto sanitario favorable vigente',
 'Expedido por la Secretaría de Salud o autoridad sanitaria competente. Incluye verificación de PGIRS, vertimientos, efluentes, fumigación y control de vectores.',
 'Técnico-Administrativa', 'Sanitario', 'RES3100-CAP8-ART19', true, 12),

('TA-008', 'Plan de Emergencias y Gestión del Riesgo de Desastres',
 'Plan hospitalario para la gestión del riesgo de desastres con procedimientos de evacuación, triaje masivo y continuidad de la atención. Debe incluir registros de simulacros realizados.',
 'Técnico-Administrativa', 'Gestión del Riesgo', 'RES3100-CAP8', true, 12),

('TA-009', 'Manual de Procesos y Procedimientos documentado',
 'Manual institucional de procesos y procedimientos por área o servicio, actualizado y socializado al personal.',
 'Técnico-Administrativa', 'Gestión', 'RES3100-CAP8', true, 24),

('TA-010', 'Programa de Auditoría para el Mejoramiento de la Calidad (PAMEC)',
 'Programa de auditoría interna con prioridades, indicadores, acciones de mejora y evidencias de implementación conforme al Decreto 1011 de 2006.',
 'Técnico-Administrativa', 'Calidad', 'RES3100-CAP8', true, 12);


-- =============================================================================
-- CONDICIÓN 2: SUFICIENCIA PATRIMONIAL Y FINANCIERA (Capítulo 9, Res. 3100/2019)
-- =============================================================================
INSERT INTO document_catalog (code, name, description, category, subcategory, standard_reference, is_mandatory, expiry_months) VALUES
('SP-001', 'Estados Financieros del último período fiscal',
 'Balance general y estado de resultados firmados por contador o revisor fiscal con tarjeta profesional vigente.',
 'Suficiencia Patrimonial', 'Financiero', 'RES3100-CAP9', true, 12),

('SP-002', 'Notas a los Estados Financieros',
 'Notas explicativas a los estados financieros según normas contables aplicables (NIF o PGCP).',
 'Suficiencia Patrimonial', 'Financiero', 'RES3100-CAP9', true, 12),

('SP-003', 'Dictamen o certificación del Revisor Fiscal o Contador',
 'Certificación que acredita la razonabilidad de los estados financieros, firmada y con datos del profesional.',
 'Suficiencia Patrimonial', 'Financiero', 'RES3100-CAP9', true, 12),

('SP-004', 'Declaración de Renta del último período fiscal',
 'Declaración de renta o declaración de ingresos y patrimonio del último período fiscal radicada en la DIAN.',
 'Suficiencia Patrimonial', 'Tributario', 'RES3100-CAP9', true, 12),

('SP-005', 'Póliza de Responsabilidad Civil Extracontractual',
 'Póliza vigente que ampara la responsabilidad civil derivada de la prestación de servicios de salud, según los servicios habilitados.',
 'Suficiencia Patrimonial', 'Seguros', 'RES3100-CAP9', true, 12),

('SP-006', 'Póliza de cumplimiento contractual (cuando aplique)',
 'Aplica cuando el prestador tiene contratos de prestación de servicios con entidades del SGSSS que la exijan.',
 'Suficiencia Patrimonial', 'Seguros', 'RES3100-CAP9', false, 12),

('SP-007', 'Certificación bancaria de cuenta activa',
 'Certificado expedido por entidad bancaria que acredita cuenta corriente o de ahorros activa a nombre del prestador.',
 'Suficiencia Patrimonial', 'Financiero', 'RES3100-CAP9', true, 3);


-- =============================================================================
-- CONDICIÓN 3: CAPACIDAD TECNOLÓGICA Y CIENTÍFICA
-- Estándar TSTH — Talento Humano (Capítulo 11, Res. 3100/2019)
-- =============================================================================
INSERT INTO document_catalog (code, name, description, category, subcategory, standard_reference, is_mandatory, expiry_months) VALUES
('TH-001', 'Contrato laboral o de prestación de servicios del personal asistencial',
 'Vínculo formal documentado (contrato laboral, orden de prestación de servicios o convenio docencia-servicio) por cada profesional activo en el servicio.',
 'Talento Humano', 'Contratos', 'TSTH', true, NULL),

('TH-002', 'Tarjeta profesional o certificado habilitante vigente',
 'Tarjeta profesional expedida por tribunal ético o entidad competente según la profesión. Debe estar vigente y sin sanciones activas.',
 'Talento Humano', 'Certificaciones', 'TSTH', true, 60),

('TH-003', 'Consulta ReTHUS — Registro del Talento Humano en Salud',
 'Verificación en el sistema ReTHUS del Ministerio de Salud que el profesional está activo y sin impedimentos para ejercer, conforme a Ley 1164 de 2007.',
 'Talento Humano', 'Certificaciones', 'TSTH', true, 12),

('TH-004', 'Diplomas de educación superior (pregrado y posgrado)',
 'Títulos académicos de pregrado y posgrado reconocidos por el MEN. Deben reposar en la hoja de vida del profesional.',
 'Talento Humano', 'Certificaciones', 'TSTH', true, NULL),

('TH-005', 'Certificados de especializaciones médico-quirúrgicas (cuando aplique)',
 'Para servicios que requieren especialista: certificado o diploma de la especialización médica o quirúrgica pertinente al servicio habilitado.',
 'Talento Humano', 'Certificaciones', 'TSTH', false, NULL),

('TH-006', 'Certificados de capacitación continuada de los últimos 12 meses',
 'Constancias de asistencia o aprobación de capacitaciones realizadas en los últimos 12 meses, relacionadas con el servicio y procesos prioritarios.',
 'Talento Humano', 'Capacitación', 'TSTH', true, 12),

('TH-007', 'Evaluaciones de desempeño del personal asistencial',
 'Formatos de evaluación de desempeño aplicados al personal con resultados, compromisos de mejora y firma del evaluador y evaluado.',
 'Talento Humano', 'Gestión', 'TSTH', true, 12),

('TH-008', 'Planilla PILA — afiliación a seguridad social integral vigente',
 'Planilla de autoliquidación del Sistema de Seguridad Social (salud, pensión y ARL) del mes en curso por cada trabajador o contratista activo.',
 'Talento Humano', 'Cumplimiento Laboral', 'TSTH', true, 1),

('TH-009', 'Hojas de vida completas con soportes del personal asistencial',
 'Hojas de vida del personal asistencial activo con todos los documentos soporte: diplomas, tarjetas profesionales, contratos, afiliaciones y certificados de capacitación.',
 'Talento Humano', 'Personal', 'TSTH', true, NULL),

('TH-010', 'Convenios docencia-servicio vigentes (cuando aplique)',
 'Cuando el prestador recibe estudiantes en práctica formativa, deben existir convenios docencia-servicio suscritos entre la IPS y la Institución de Educación Superior, con supervisión garantizada.',
 'Talento Humano', 'Docencia', 'TSTH', false, 36);


-- =============================================================================
-- Estándar TSINF — Infraestructura (Capítulo 11, Res. 3100/2019)
-- =============================================================================
INSERT INTO document_catalog (code, name, description, category, subcategory, standard_reference, is_mandatory, expiry_months) VALUES
('INF-001', 'Planos arquitectónicos de la planta física',
 'Planos de distribución de planta aprobados por curaduría urbana o autoridad competente, actualizados a la distribución actual del servicio.',
 'Infraestructura', 'Planos', 'TSINF', true, NULL),

('INF-002', 'Certificado RETIE vigente para instalaciones eléctricas',
 'Certificado de Conformidad de Instalaciones Eléctricas (RETIE) vigente, emitido por organismo de inspección acreditado por ONAC.',
 'Infraestructura', 'Seguridad Eléctrica', 'TSINF', true, 24),

('INF-003', 'Certificado de uso del suelo favorable para salud',
 'Expedido por autoridad municipal o distrital de planeación, con clasificación compatible con prestación de servicios de salud.',
 'Infraestructura', 'Uso del Suelo', 'TSINF', true, 12),

('INF-004', 'Concepto favorable del cuerpo de bomberos (cuando aplique)',
 'Concepto del cuerpo de bomberos sobre condiciones de evacuación y prevención de incendios. Obligatorio para servicios de internación, urgencias y alta densidad de usuarios.',
 'Infraestructura', 'Seguridad', 'TSINF', false, 12),

('INF-005', 'Certificado de fumigación y control de vectores vigente',
 'Expedido por empresa autorizada. Debe cubrir todas las áreas del servicio habilitado.',
 'Infraestructura', 'Sanitario', 'TSINF', true, 6),

('INF-006', 'Plan de mantenimiento preventivo de infraestructura con bitácoras',
 'Programa documentado de mantenimiento de la planta física con cronograma, responsables y bitácora de ejecución actualizada.',
 'Infraestructura', 'Mantenimiento', 'TSINF', true, 12),

('INF-007', 'Contrato de recolección y disposición de residuos hospitalarios (PGIRS)',
 'Contrato vigente con empresa autorizada para la recolección, transporte y disposición de residuos hospitalarios y similares, conforme al Decreto 351 de 2014.',
 'Infraestructura', 'Gestión Ambiental', 'TSINF', true, 12),

('INF-008', 'Plan de Gestión Integral de Residuos Hospitalarios — PGIRS',
 'Documento PGIRS institucional con caracterización de residuos, rutas sanitarias, responsables y registros de disposición conforme al Decreto 351 de 2014.',
 'Infraestructura', 'Gestión Ambiental', 'TSINF', true, 12);


-- =============================================================================
-- Estándar TSDOT — Dotación (Capítulo 11, Res. 3100/2019)
-- =============================================================================
INSERT INTO document_catalog (code, name, description, category, subcategory, standard_reference, is_mandatory, expiry_months) VALUES
('DOT-001', 'Inventario de equipos biomédicos con datos INVIMA y clasificación de riesgo',
 'Inventario actualizado con: nombre del equipo, marca, modelo, número de serie, registro INVIMA y clasificación de riesgo (Clase I, IIA, IIB o III) según Decreto 4725 de 2005.',
 'Dotación', 'Inventario Biomédico', 'TSDOT', true, 12),

('DOT-002', 'Hojas de vida individuales de cada equipo biomédico',
 'Por cada equipo: fecha de adquisición, mantenimientos preventivos y correctivos realizados, calibraciones, incidentes reportados y estado actual de funcionamiento.',
 'Dotación', 'Mantenimiento', 'TSDOT', true, NULL),

('DOT-003', 'Programa de mantenimiento preventivo y correctivo de equipos',
 'Cronograma anual de mantenimiento preventivo semestral y correctivo de todos los equipos críticos, con registros de ejecución y responsables.',
 'Dotación', 'Mantenimiento', 'TSDOT', true, 12),

('DOT-004', 'Contrato con empresa de mantenimiento biomédico (equipos críticos)',
 'Contrato vigente con empresa autorizada para mantenimiento de equipos de alta complejidad o tecnología crítica del servicio.',
 'Dotación', 'Mantenimiento', 'TSDOT', false, 12),

('DOT-005', 'Certificados de calibración anual de equipos de medición',
 'Certificados de calibración vigentes (máximo 12 meses) emitidos por entidad metrológica acreditada para equipos de medición: tensiómetros, termómetros, balanzas, monitores, etc.',
 'Dotación', 'Metrología', 'TSDOT', true, 12),

('DOT-006', 'Manuales de operación de equipos biomédicos en español',
 'Manuales de operación y mantenimiento básico de todos los equipos biomédicos, disponibles físicamente en el área del servicio en idioma español.',
 'Dotación', 'Documentación Técnica', 'TSDOT', true, NULL),

('DOT-007', 'Registros de capacitación al personal en uso de equipos biomédicos',
 'Evidencia de entrenamiento documentado al personal operador de cada equipo biomédico sobre uso correcto, alarmas, limpieza y mantenimiento básico.',
 'Dotación', 'Capacitación', 'TSDOT', true, 12),

('DOT-008', 'Documento de capacidad instalada registrada en REPS',
 'Documento que acredita la capacidad instalada del servicio (camas, consultorios, sillas, quirófanos, etc.) coherente con el registro en el REPS.',
 'Dotación', 'Capacidad Instalada', 'TSDOT', true, 12);


-- =============================================================================
-- Estándar TSMD — Medicamentos, Dispositivos Médicos e Insumos (Cap. 11, Res. 3100/2019)
-- =============================================================================
INSERT INTO document_catalog (code, name, description, category, subcategory, standard_reference, is_mandatory, expiry_months) VALUES
('MD-001', 'Registro mensual de medicamentos y dispositivos médicos',
 'Registro del mes en curso con: principio activo, forma farmacéutica, concentración, número de lote, fecha de vencimiento y número de registro INVIMA de cada medicamento y dispositivo médico.',
 'Medicamentos y DM', 'Inventario', 'TSMD', true, 1),

('MD-002', 'Registro de consulta mensual de alertas INVIMA',
 'Constancia de consulta mensual del sistema de alertas sanitarias del INVIMA (farmacovigilancia y tecnovigilancia) con fecha, responsable y acciones tomadas.',
 'Medicamentos y DM', 'Farmacovigilancia', 'TSMD', true, 1),

('MD-003', 'Registros de temperatura y humedad con termohigrómetro (dos veces al día)',
 'Registro diario de lecturas de temperatura y humedad en el área de almacenamiento de medicamentos: mañana y tarde. Termohigrómetro con calibración vigente.',
 'Medicamentos y DM', 'Control de Condiciones', 'TSMD', true, 1),

('MD-004', 'Reportes trimestrales de tecnovigilancia al INVIMA',
 'Reportes de tecnovigilancia de los últimos cuatro trimestres enviados al INVIMA sobre eventos o problemas relacionados con dispositivos médicos, con acuse de recibo.',
 'Medicamentos y DM', 'Tecnovigilancia', 'TSMD', true, 3),

('MD-005', 'Reportes de farmacovigilancia de eventos adversos a medicamentos',
 'Reportes de eventos adversos a medicamentos enviados al INVIMA y a la red nacional de farmacovigilancia en los últimos 12 meses.',
 'Medicamentos y DM', 'Farmacovigilancia', 'TSMD', true, 12),

('MD-006', 'Kit de atención a derrames de medicamentos peligrosos (cuando aplique)',
 'Kit disponible en el área con guía de manejo. Aplica para servicios con manejo de citostáticos, quimioterapia u otros medicamentos peligrosos.',
 'Medicamentos y DM', 'Bioseguridad', 'TSMD', false, 12),

('MD-007', 'Procedimiento documentado de devolución y destrucción de medicamentos',
 'Procedimiento escrito para manejo de medicamentos vencidos, deteriorados o retirados por alerta INVIMA: criterios de retiro, proceso de devolución al proveedor o destrucción conforme a normativa.',
 'Medicamentos y DM', 'Gestión de Residuos', 'TSMD', true, 24),

('MD-008', 'Registro de medicamentos de control especial (Fondo Nacional de Estupefacientes)',
 'Libro reglamentario o registro del Fondo Nacional de Estupefacientes para el control de medicamentos de prescripción controlada, con balance actualizado.',
 'Medicamentos y DM', 'Control Especial', 'TSMD', false, 12);


-- =============================================================================
-- Estándar TSPP — Procesos Prioritarios (Capítulo 11, Res. 3100/2019)
-- =============================================================================
INSERT INTO document_catalog (code, name, description, category, subcategory, standard_reference, is_mandatory, expiry_months) VALUES
('PP-001', 'Programa de seguridad del paciente documentado',
 'Documento con política institucional de seguridad del paciente, estrategias, indicadores, responsables y evidencia de actividades realizadas.',
 'Procesos Prioritarios', 'Seguridad del Paciente', 'TSPP', true, 12),

('PP-002', 'Cuatro (4) formatos de reporte de seguridad del paciente implementados',
 'Formatos activos de: (1) incidentes, (2) eventos adversos, (3) casi-accidentes (near miss) y (4) eventos centinela, con registros de reporte del último trimestre.',
 'Procesos Prioritarios', 'Seguridad del Paciente', 'TSPP', true, 12),

('PP-003', 'Protocolo de cirugía segura — Lista de Verificación OMS (cuando aplique)',
 'Protocolo implementado con lista de verificación Sign in / Time out / Sign out. Aplica para prestadores habilitados para servicios quirúrgicos.',
 'Procesos Prioritarios', 'Cirugía Segura', 'TSPP', false, 24),

('PP-004', 'Protocolo de seguridad en la administración de medicamentos',
 'Protocolo con los 10 correctos de medicamentos, doble verificación para medicamentos de alto riesgo y política de abreviaturas aprobadas.',
 'Procesos Prioritarios', 'Seguridad en Medicamentos', 'TSPP', true, 24),

('PP-005', 'Protocolo de higiene de manos — 5 momentos OMS',
 'Protocolo vigente con los 5 momentos OMS para higiene de manos, disponibilidad de alcohol glicerinado e indicadores de adherencia.',
 'Procesos Prioritarios', 'Bioseguridad', 'TSPP', true, 12),

('PP-006', 'Protocolo de bioseguridad y precauciones estándar',
 'Protocolo de bioseguridad con precauciones estándar y adicionales (contacto, gotas, aéreo), manejo de cortopunzantes y dotación de EPP.',
 'Procesos Prioritarios', 'Bioseguridad', 'TSPP', true, 12),

('PP-007', 'Guías de práctica clínica basadas en evidencia adoptadas institucionalmente',
 'Acto administrativo de adopción de guías clínicas para los diagnósticos y procedimientos más frecuentes, con registros de socialización al personal.',
 'Procesos Prioritarios', 'Guías Clínicas', 'TSPP', true, 36),

('PP-008', 'Protocolos clínicos específicos del servicio habilitado',
 'Protocolos del servicio actualizados en los últimos 2 años: triaje, atención del parto, neonatología, UCI, urgencias, etc., según el tipo de servicio.',
 'Procesos Prioritarios', 'Protocolos Clínicos', 'TSPP', true, 24),

('PP-009', 'Cronograma de capacitación en procesos prioritarios con registros de asistencia',
 'Cronograma del año en curso con temas de: seguridad del paciente, higiene de manos, bioseguridad, uso de equipos y otros procesos prioritarios, con registros de asistencia.',
 'Procesos Prioritarios', 'Capacitación', 'TSPP', true, 12),

('PP-010', 'Protocolo de referencia y contrarreferencia',
 'Protocolo documentado con criterios, responsables, medios de comunicación y tiempos de respuesta para la remisión de pacientes a otros niveles de atención.',
 'Procesos Prioritarios', 'Red de Servicios', 'TSPP', true, 24);


-- =============================================================================
-- Estándar TSHCR — Historia Clínica y Registros (Capítulo 11, Res. 3100/2019)
-- Referencia normativa principal: Resolución 1995 de 1999
-- =============================================================================
INSERT INTO document_catalog (code, name, description, category, subcategory, standard_reference, is_mandatory, expiry_months) VALUES
('HC-001', 'Manual o política de historia clínica institucional',
 'Documento que define las normas institucionales para el diligenciamiento, manejo y custodia de la historia clínica, conforme a la Resolución 1995 de 1999.',
 'Historia Clínica', 'Política', 'TSHCR', true, 24),

('HC-002', 'Política de archivo, custodia y conservación de historias clínicas',
 'Documento con tiempos de conservación (mínimo 20 años para adultos, 20 años contados desde la mayoría de edad para menores) y condiciones físicas o digitales del archivo.',
 'Historia Clínica', 'Archivo', 'TSHCR', true, 24),

('HC-003', 'Política de confidencialidad y control de acceso a la historia clínica',
 'Documento con mecanismos de control de acceso, política de habeas data y procedimientos para solicitud de copia de historia clínica por el paciente.',
 'Historia Clínica', 'Confidencialidad', 'TSHCR', true, 24),

('HC-004', 'Formatos de registro por servicio (signos vitales, evoluciones, etc.)',
 'Formatos institucionales estandarizados para el registro de signos vitales, notas de evolución, valoraciones, intervenciones de enfermería y otros registros del servicio.',
 'Historia Clínica', 'Formatos', 'TSHCR', true, 24),

('HC-005', 'Sistema de información para historia clínica (licencia o constancia)',
 'Para historia clínica electrónica: contrato de licenciamiento o titularidad del software, con garantías de disponibilidad, integridad y respaldo de datos.',
 'Historia Clínica', 'Sistemas', 'TSHCR', false, 12),

('HC-006', 'Reporte RIPS del último mes generado y enviado',
 'Registros Individuales de Prestación de Servicios (RIPS) del mes anterior, generados conforme a la Resolución 3374 de 2000 y enviados a la aseguradora o SISPRO.',
 'Historia Clínica', 'RIPS', 'TSHCR', true, 1),

('HC-007', 'Formatos de consentimiento informado por procedimiento',
 'Formatos específicos de consentimiento informado para cada procedimiento o servicio que lo requiera, con versión en lenguaje comprensible para el paciente.',
 'Historia Clínica', 'Consentimiento', 'TSHCR', true, 24);


-- =============================================================================
-- Estándar TSINT — Interdependencia de Servicios (Capítulo 11, Res. 3100/2019)
-- =============================================================================
INSERT INTO document_catalog (code, name, description, category, subcategory, standard_reference, is_mandatory, expiry_months) VALUES
('INT-001', 'Contratos o convenios con prestadores de servicios de apoyo',
 'Contratos o convenios vigentes con prestadores habilitados en el REPS para los servicios de apoyo que el prestador no ofrece directamente (laboratorio, radiología, banco de sangre, UCI, etc.).',
 'Interdependencia', 'Contratos', 'TSINT', false, 24),

('INT-002', 'Verificación REPS de prestadores vinculados en la interdependencia',
 'Consultas REPS actualizadas que acreditan que cada prestador con quien se tiene convenio de interdependencia está habilitado para los servicios específicos aportados.',
 'Interdependencia', 'Verificación REPS', 'TSINT', true, 12),

('INT-003', 'Documento de red de referencia y contrarreferencia formalizada',
 'Documento de red de referencia con prestadores identificados por nivel de complejidad, contratos de respaldo y mecanismos de comunicación.',
 'Interdependencia', 'Red de Servicios', 'TSINT', true, 12),

('INT-004', 'Convenios docencia-servicio con IES (cuando aplique)',
 'Convenios docencia-servicio firmados entre la IPS y la Institución de Educación Superior cuando se reciben estudiantes en práctica formativa, con listado de estudiantes activos.',
 'Interdependencia', 'Docencia', 'TSINT', false, 36);


-- =============================================================================
-- Resumen del catálogo cargado
-- =============================================================================
SELECT
  standard_reference AS estandar,
  category AS categoria,
  COUNT(*) AS total_documentos,
  SUM(CASE WHEN is_mandatory THEN 1 ELSE 0 END) AS obligatorios
FROM document_catalog
GROUP BY standard_reference, category
ORDER BY standard_reference, category;

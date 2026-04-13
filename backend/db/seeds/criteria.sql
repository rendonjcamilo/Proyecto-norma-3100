-- =============================================================================
-- CRITERIOS DE EVALUACIÓN — RESOLUCIÓN 3100 DE 2019
-- Ministerio de Salud y Protección Social de Colombia
-- 7 Estándares Transversales (Capítulo 11, Condición 3)
-- Criterios extraídos de:
--   · Herramienta de autoevaluación oficial
--   · Herramienta de auditoría de habilitación
--   · Lineamientos de verificación
-- =============================================================================
-- Nomenclatura de códigos: {ESTÁNDAR}-{NRO_CORRELATIVO}
-- Cumplimiento: C = Cumple / NC = No Cumple / NA = No Aplica
-- =============================================================================

-- =============================================================================
-- 1. TSTH — TALENTO HUMANO
-- =============================================================================

INSERT INTO evaluation_criteria
  (code, number, name, description, evidence_requirement, complexity, standard_id, service_id, is_mandatory, status)
SELECT
  code, number, name, description, evidence_requirement, complexity,
  (SELECT id FROM evaluation_standards WHERE code = 'TSTH' LIMIT 1) AS standard_id,
  s.id AS service_id,
  TRUE,
  'active'
FROM services s
CROSS JOIN (VALUES

  ('TSTH-001', '1.1',
   'Títulos académicos del personal acreditados ante el MEN',
   'Todo el personal asistencial debe poseer título académico reconocido por el Ministerio de Educación Nacional. El diploma o acta de grado debe estar disponible en hoja de vida.',
   'Diplomas o actas de grado del personal asistencial activo',
   'simple'),

  ('TSTH-002', '1.2',
   'Tarjeta o certificado profesional vigente',
   'Cada profesional de la salud debe contar con tarjeta profesional o certificado expedido por el tribunal ético o entidad competente según la profesión.',
   'Tarjeta profesional vigente por cada profesional activo',
   'simple'),

  ('TSTH-003', '1.3',
   'Inscripción en ReTHUS (Registro del Talento Humano en Salud)',
   'Todo el personal de salud habilitado para ejercer debe estar inscrito y activo en el Registro del Talento Humano en Salud - ReTHUS, conforme a la Ley 1164 de 2007.',
   'Consulta ReTHUS actualizada por cada profesional del servicio',
   'simple'),

  ('TSTH-004', '1.4',
   'Dotación de personal suficiente según servicios habilitados',
   'El prestador debe contar con el número y tipo de profesionales requeridos por la normativa de habilitación para cada servicio activo. La dotación debe ser proporcional a la capacidad instalada.',
   'Cuadro de dotación de personal vs. capacidad instalada del servicio',
   'medium'),

  ('TSTH-005', '1.5',
   'Contratos o vínculos laborales formalizados',
   'El vínculo del personal asistencial con el prestador debe estar formalizado mediante contrato laboral, de prestación de servicios o convenio docencia-servicio, según corresponda.',
   'Contratos laborales o de prestación de servicios del personal activo',
   'simple'),

  ('TSTH-006', '1.6',
   'Afiliación vigente al Sistema de Seguridad Social Integral',
   'El personal debe estar afiliado al sistema de salud, pensión y riesgos laborales (ARL). Las planillas deben estar al día al momento de la verificación.',
   'Planilla PILA del mes en curso para todo el personal asistencial',
   'simple'),

  ('TSTH-007', '1.7',
   'Programa de inducción y entrenamiento para personal nuevo',
   'El prestador debe tener un programa documentado de inducción institucional y entrenamiento en el cargo para el personal que ingresa, con registro de asistencia.',
   'Programa de inducción y registros de asistencia del personal incorporado',
   'medium'),

  ('TSTH-008', '1.8',
   'Cronograma anual de capacitación ejecutado con registros de asistencia',
   'Debe existir un programa de educación continuada anual con temas definidos, ejecutado con evidencia de asistencia del personal asistencial.',
   'Cronograma de capacitación del año en curso y registros de asistencia',
   'medium'),

  ('TSTH-009', '1.9',
   'Capacitación en manejo del dolor y cuidados paliativos (cuando aplique)',
   'Para servicios con atención de pacientes con dolor crónico o terminal, el personal debe tener capacitación acreditada en manejo del dolor y cuidados paliativos.',
   'Certificados de capacitación en dolor y cuidados paliativos del personal',
   'medium'),

  ('TSTH-010', '1.10',
   'Capacitación en manejo del duelo (cuando aplique)',
   'Para servicios de oncología, UCI, cuidados paliativos y similares, el personal debe tener capacitación en manejo del duelo y comunicación de malas noticias.',
   'Certificados de capacitación en manejo del duelo',
   'medium'),

  ('TSTH-011', '1.11',
   'Competencia en ecografía o ultrasonido (cuando aplique)',
   'El personal que realiza ecografías debe contar con certificación o entrenamiento acreditado en ultrasonido según el tipo de servicio (obstétrico, abdominal, vascular, etc.).',
   'Certificados o acreditación en ecografía del personal que la realiza',
   'medium'),

  ('TSTH-012', '1.12',
   'Competencias del coordinador de trasplantes (cuando aplique)',
   'Los prestadores habilitados para trasplantes deben contar con coordinador de trasplantes con formación específica acreditada.',
   'Certificado de formación del coordinador de trasplantes',
   'complex'),

  ('TSTH-013', '1.13',
   'Competencias para atención a víctimas de violencia sexual (cuando aplique)',
   'El personal de urgencias y de atención integral a víctimas debe tener capacitación acreditada en atención a víctimas de violencia sexual, conforme al Protocolo de Atención Integral.',
   'Certificados de capacitación en atención a víctimas de violencia sexual',
   'complex'),

  ('TSTH-014', '1.14',
   'Competencias en manejo de agentes químicos peligrosos (cuando aplique)',
   'En servicios con riesgo de exposición a agentes químicos (oncología, quimioterapia, esterilización), el personal debe tener formación documentada en manejo seguro.',
   'Certificados de capacitación en manejo de agentes químicos peligrosos',
   'medium'),

  ('TSTH-015', '1.15',
   'Competencias para pruebas de Point-Of-Care Testing — POCT (cuando aplique)',
   'El personal que realiza pruebas rápidas o POCT debe estar capacitado y certificado para la operación de los equipos utilizados.',
   'Certificados de entrenamiento en POCT del personal operador',
   'medium'),

  ('TSTH-016', '1.16',
   'Competencias en sedación consciente grado I a IV (cuando aplique)',
   'Para procedimientos que requieran sedación, el personal debe tener formación acreditada en administración y monitoreo de sedación de acuerdo con el grado aplicado.',
   'Certificados o acreditación en sedación del personal que la administra',
   'complex'),

  ('TSTH-017', '1.17',
   'Competencias en telemedicina (cuando aplique)',
   'El personal que presta servicios a través de telemedicina debe contar con entrenamiento en la plataforma tecnológica utilizada y en las condiciones de atención remota.',
   'Certificados de formación en telemedicina y plataforma habilitada',
   'medium'),

  ('TSTH-018', '1.18',
   'Evaluación periódica de desempeño del personal documentada',
   'El prestador debe realizar evaluaciones de desempeño al personal con periodicidad definida y dejar registro escrito de los resultados y compromisos de mejora.',
   'Formatos de evaluación de desempeño aplicados al personal asistencial',
   'medium'),

  ('TSTH-019', '1.19',
   'Hojas de vida completas con soportes documentales',
   'Las hojas de vida del personal asistencial activo deben estar completas con todos los soportes: diplomas, tarjetas profesionales, contratos, afiliaciones y capacitaciones.',
   'Hojas de vida actualizadas del personal asistencial con soportes',
   'simple'),

  ('TSTH-020', '1.20',
   'Personal de apoyo asistencial con competencias verificadas',
   'El personal auxiliar y de apoyo (auxiliares de enfermería, camilleros, etc.) debe contar con formación pertinente al cargo y registro de competencias verificadas.',
   'Certificados de formación técnica y competencias del personal auxiliar',
   'simple'),

  ('TSTH-021', '1.21',
   'Supervisión de estudiantes en práctica acreditada',
   'Cuando se reciban estudiantes en práctica formativa, deben existir convenios docencia-servicio vigentes y un tutor o supervisor formalmente asignado.',
   'Convenios docencia-servicio vigentes y designación de tutores',
   'medium')

) AS t(code, number, name, description, evidence_requirement, complexity)
ON CONFLICT DO NOTHING;


-- =============================================================================
-- 2. TSINF — INFRAESTRUCTURA
-- =============================================================================

INSERT INTO evaluation_criteria
  (code, number, name, description, evidence_requirement, complexity, standard_id, service_id, is_mandatory, status)
SELECT
  code, number, name, description, evidence_requirement, complexity,
  (SELECT id FROM evaluation_standards WHERE code = 'TSINF' LIMIT 1) AS standard_id,
  s.id AS service_id,
  TRUE,
  'active'
FROM services s
CROSS JOIN (VALUES

  ('TSINF-001', '2.1',
   'Certificado RETIE vigente para instalaciones eléctricas',
   'Las instalaciones eléctricas deben contar con Certificado de Conformidad de Instalaciones Eléctricas (RETIE) vigente, emitido por organismo acreditado. Aplica a toda la planta física.',
   'Certificado RETIE vigente expedido por organismo acreditado',
   'medium'),

  ('TSINF-002', '2.2',
   'Concepto favorable de uso del suelo',
   'El inmueble debe tener concepto de uso del suelo expedido por la autoridad municipal o distrital competente que permita la actividad de prestación de servicios de salud.',
   'Certificado de uso del suelo expedido por autoridad municipal o distrital',
   'simple'),

  ('TSINF-003', '2.3',
   'Concepto sanitario favorable vigente',
   'El prestador debe contar con concepto sanitario favorable vigente expedido por la Secretaría de Salud o autoridad sanitaria competente, que incluya verificación de PGIRS, vertimientos y efluentes.',
   'Concepto sanitario vigente de la Secretaría de Salud departamental o municipal',
   'medium'),

  ('TSINF-004', '2.4',
   'Concepto del cuerpo de bomberos (cuando aplique)',
   'Para prestadores con servicios de internación, urgencias o con alta densidad de usuarios, debe existir concepto favorable del cuerpo de bomberos sobre condiciones de evacuación y prevención de incendios.',
   'Concepto del cuerpo de bomberos vigente',
   'medium'),

  ('TSINF-005', '2.5',
   'Concepto de fumigación y control de vectores',
   'El prestador debe contar con certificado vigente de fumigación y control de vectores emitido por empresa autorizada, para todas las áreas del servicio.',
   'Certificado de fumigación vigente con área cubierta y empresa ejecutora',
   'simple'),

  ('TSINF-006', '2.6',
   'Accesos y rampas para personas con movilidad reducida',
   'La planta física debe contar con accesos para personas con discapacidad o movilidad reducida: rampas con inclinación reglamentaria, pasamanos y señalización según norma técnica.',
   'Inspección visual de rampas y accesos accesibles en todas las entradas al servicio',
   'medium'),

  ('TSINF-007', '2.7',
   'Pisos continuos, impermeables y antideslizantes en áreas asistenciales',
   'Los pisos de las áreas asistenciales deben ser continuos (sin juntas), impermeables y antideslizantes para facilitar la limpieza y evitar acumulación de microorganismos.',
   'Inspección visual de pisos en áreas asistenciales',
   'simple'),

  ('TSINF-008', '2.8',
   'Paredes con acabado liso e impermeable (sin ángulos internos — media caña)',
   'Las paredes de áreas críticas deben tener acabado liso e impermeable. La unión entre pared y piso (zócalo) debe ser en media caña (cove base) para facilitar la limpieza y evitar acumulación de gérmenes.',
   'Inspección visual de paredes y unión pared-piso en áreas asistenciales y de esterilización',
   'medium'),

  ('TSINF-009', '2.9',
   'Área de esterilización con flujo unidireccional y debidamente señalizada',
   'El área de esterilización debe tener un flujo unidireccional claramente establecido (zona sucia → zona limpia → zona estéril) con separación física entre zonas y señalización visible.',
   'Plano del área de esterilización con flujo y señalización visible en sitio',
   'complex'),

  ('TSINF-010', '2.10',
   'Baño del personal separado del área de almacenamiento de insumos de limpieza',
   'El baño o camerino del personal de limpieza no debe compartir espacio físico con el área de almacenamiento de implementos y productos de aseo.',
   'Inspección visual del área de limpieza y baños de personal',
   'simple'),

  ('TSINF-011', '2.11',
   'Separación física entre áreas limpias y sucias',
   'Debe existir separación física (barreras, muros, puertas) entre áreas limpias y sucias en los servicios que generan residuos o material contaminado.',
   'Inspección visual de barreras físicas entre áreas limpias y sucias',
   'medium'),

  ('TSINF-012', '2.12',
   'Señalización de rutas de evacuación y salidas de emergencia',
   'Todas las áreas del prestador deben contar con señalización visible de rutas de evacuación, salidas de emergencia y puntos de encuentro, conforme a normas de seguridad industrial.',
   'Inspección de señalización de evacuación en todas las áreas del servicio',
   'simple'),

  ('TSINF-013', '2.13',
   'Áreas diferenciadas por función (espera, atención, procedimientos)',
   'Las áreas del servicio deben estar diferenciadas funcionalmente: sala de espera, admisión, consultorios o unidades de atención, área de procedimientos, etc.',
   'Plano de distribución de áreas aprobado o croquis funcional del servicio',
   'medium'),

  ('TSINF-014', '2.14',
   'Ventilación e iluminación adecuadas en áreas asistenciales',
   'Las áreas de atención deben contar con iluminación y ventilación suficientes, ya sea natural o artificial, según los estándares para el tipo de servicio habilitado.',
   'Inspección visual de ventilación e iluminación; mediciones cuando aplique',
   'medium'),

  ('TSINF-015', '2.15',
   'Plan de mantenimiento preventivo de la planta física con bitácoras',
   'Debe existir un programa documentado de mantenimiento preventivo de la infraestructura con cronograma, responsables y bitácora de ejecución actualizada.',
   'Plan de mantenimiento de infraestructura y bitácoras del último año',
   'medium')

) AS t(code, number, name, description, evidence_requirement, complexity)
ON CONFLICT DO NOTHING;


-- =============================================================================
-- 3. TSDOT — DOTACIÓN
-- =============================================================================

INSERT INTO evaluation_criteria
  (code, number, name, description, evidence_requirement, complexity, standard_id, service_id, is_mandatory, status)
SELECT
  code, number, name, description, evidence_requirement, complexity,
  (SELECT id FROM evaluation_standards WHERE code = 'TSDOT' LIMIT 1) AS standard_id,
  s.id AS service_id,
  TRUE,
  'active'
FROM services s
CROSS JOIN (VALUES

  ('TSDOT-001', '3.1',
   'Inventario de equipos biomédicos con datos completos',
   'El prestador debe mantener un inventario actualizado de cada equipo biomédico con: nombre del equipo, marca, modelo, número de serie, clasificación de riesgo INVIMA y número de registro INVIMA.',
   'Inventario de equipos biomédicos actualizado con todos los campos requeridos',
   'medium'),

  ('TSDOT-002', '3.2',
   'Registro INVIMA vigente por cada equipo o dispositivo médico',
   'Cada equipo biomédico y dispositivo médico en uso debe contar con registro INVIMA vigente. Se exceptúan los equipos exentos de registro conforme a normativa vigente.',
   'Registros INVIMA por equipo o constancia de exención; verificable en SIVICOS',
   'medium'),

  ('TSDOT-003', '3.3',
   'Clasificación de riesgo documentada por equipo (I, IIA, IIB, III)',
   'El inventario debe incluir la clasificación de riesgo de cada dispositivo médico según el Decreto 4725 de 2005: Clase I (bajo), IIA (moderado), IIB (alto), III (muy alto).',
   'Inventario con columna de clasificación de riesgo por equipo',
   'medium'),

  ('TSDOT-004', '3.4',
   'Hoja de vida por equipo biomédico',
   'Cada equipo biomédico debe tener su hoja de vida individual con: fecha de adquisición, mantenimientos realizados (preventivos y correctivos), calibraciones, incidentes y estado actual.',
   'Hojas de vida individuales de cada equipo biomédico activo',
   'medium'),

  ('TSDOT-005', '3.5',
   'Programa de mantenimiento preventivo y correctivo con cronograma',
   'El prestador debe tener un programa documentado de mantenimiento preventivo semestral y correctivo para todos los equipos críticos, con responsables asignados y evidencia de ejecución.',
   'Programa de mantenimiento con cronograma y registros de ejecución',
   'medium'),

  ('TSDOT-006', '3.6',
   'Contrato vigente con empresa de mantenimiento biomédico',
   'Para equipos de alta complejidad o tecnología crítica, debe existir contrato con empresa autorizada para la prestación del servicio de mantenimiento biomédico.',
   'Contrato vigente con empresa de mantenimiento biomédico para equipos críticos',
   'medium'),

  ('TSDOT-007', '3.7',
   'Calibraciones anuales de equipos de medición documentadas',
   'Los equipos de medición (tensiómetros, termómetros, balanzas, monitores, etc.) deben tener calibración anual realizada por entidad metrológica acreditada.',
   'Certificados de calibración vigentes (máximo 12 meses de antigüedad)',
   'medium'),

  ('TSDOT-008', '3.8',
   'Manuales de operación de equipos disponibles en español',
   'Los manuales de operación y mantenimiento de todos los equipos biomédicos deben estar disponibles físicamente en el servicio en idioma español.',
   'Manuales en español disponibles físicamente para cada equipo',
   'simple'),

  ('TSDOT-009', '3.9',
   'Programa de capacitación al personal en el uso de equipos biomédicos',
   'El personal asistencial que opera equipos biomédicos debe haber recibido entrenamiento documentado sobre el uso correcto, limpieza y mantenimiento básico de los equipos que opera.',
   'Registros de capacitación en equipos biomédicos por personal operador',
   'medium'),

  ('TSDOT-010', '3.10',
   'Documento de capacidad instalada del servicio actualizado',
   'El prestador debe tener documentado la capacidad instalada del servicio (número de camas, consultorios, quirófanos, sillas, etc.) actualizada en el REPS y coherente con la dotación física.',
   'Documento de capacidad instalada registrada en REPS y verificada en sitio',
   'medium'),

  ('TSDOT-011', '3.11',
   'Inventario de instrumental quirúrgico o de procedimiento (cuando aplique)',
   'Para servicios quirúrgicos, odontológicos o de procedimientos, debe existir un inventario actualizado del instrumental con código, descripción y estado de cada elemento.',
   'Inventario de instrumental con descripción, código y estado por pieza',
   'medium'),

  ('TSDOT-012', '3.12',
   'Dotación de insumos suficiente para la operación del servicio',
   'El servicio debe contar con los insumos necesarios para su operación normal disponibles en el momento de la verificación (guantes, jeringas, material de curación, etc.).',
   'Inspección de insumos disponibles en el servicio al momento de la visita',
   'simple')

) AS t(code, number, name, description, evidence_requirement, complexity)
ON CONFLICT DO NOTHING;


-- =============================================================================
-- 4. TSMD — MEDICAMENTOS, DISPOSITIVOS MÉDICOS E INSUMOS
-- =============================================================================

INSERT INTO evaluation_criteria
  (code, number, name, description, evidence_requirement, complexity, standard_id, service_id, is_mandatory, status)
SELECT
  code, number, name, description, evidence_requirement, complexity,
  (SELECT id FROM evaluation_standards WHERE code = 'TSMD' LIMIT 1) AS standard_id,
  s.id AS service_id,
  TRUE,
  'active'
FROM services s
CROSS JOIN (VALUES

  ('TSMD-001', '4.1',
   'Registro mensual de medicamentos y dispositivos con datos INVIMA',
   'El prestador debe llevar un registro mensual de medicamentos y dispositivos médicos que incluya: principio activo, forma farmacéutica, concentración, número de lote, fecha de vencimiento y número de registro INVIMA.',
   'Registro mensual de medicamentos y DM del mes en curso con todos los campos',
   'medium'),

  ('TSMD-002', '4.2',
   'Verificación mensual de alertas y retiros del INVIMA',
   'El prestador debe consultar mensualmente el sistema de alertas sanitarias del INVIMA (farmacovigilancia y tecnovigilancia) y dejar registro de la consulta y acciones tomadas.',
   'Registro de consulta mensual de alertas INVIMA con fecha y responsable',
   'medium'),

  ('TSMD-003', '4.3',
   'Control de fechas de vencimiento con metodología de semáforo',
   'El almacenamiento de medicamentos e insumos debe aplicar la metodología de semáforo: rojo (vence en ≤3 meses), amarillo (vence en 3-6 meses), verde (vence en >6 meses). Los de vencimiento próximo deben estar al frente.',
   'Inspección física del almacenamiento: organización por fechas de vencimiento y semáforo visible',
   'simple'),

  ('TSMD-004', '4.4',
   'Kit de atención a derrames de medicamentos peligrosos disponible',
   'Para servicios con manejo de medicamentos peligrosos (quimioterapia, citostáticos, etc.), debe existir kit de atención a derrames disponible en el área, con guía de manejo.',
   'Inspección visual del kit de derrames con todos los elementos y guía de uso',
   'medium'),

  ('TSMD-005', '4.5',
   'Termohigrómetro con registro de temperatura y humedad dos veces al día',
   'Las áreas de almacenamiento de medicamentos deben contar con termohigrómetro calibrado y registro documentado de temperatura y humedad con dos lecturas diarias (mañana y tarde).',
   'Termohigrómetro visible en el área y registro de lecturas de los últimos 30 días',
   'medium'),

  ('TSMD-006', '4.6',
   'Reportes trimestrales de tecnovigilancia enviados al INVIMA',
   'El prestador debe generar y enviar reportes trimestrales de tecnovigilancia al INVIMA sobre eventos o problemas relacionados con dispositivos médicos, con acuse de recibo.',
   'Reportes de tecnovigilancia de los últimos cuatro trimestres con evidencia de envío',
   'medium'),

  ('TSMD-007', '4.7',
   'Reportes de farmacovigilancia de eventos adversos a medicamentos',
   'El prestador debe reportar eventos adversos a medicamentos al INVIMA y a la red nacional de farmacovigilancia, manteniendo registro de cada reporte enviado.',
   'Reportes de farmacovigilancia generados en los últimos 12 meses',
   'medium'),

  ('TSMD-008', '4.8',
   'Almacenamiento de medicamentos bajo condiciones controladas',
   'Los medicamentos deben almacenarse bajo las condiciones de temperatura, humedad y luz indicadas por el fabricante, separados de otros insumos y en áreas de acceso restringido.',
   'Inspección del área de almacenamiento: temperatura, señalización, acceso restringido',
   'medium'),

  ('TSMD-009', '4.9',
   'Procedimiento documentado para devolución y destrucción de medicamentos',
   'Debe existir un procedimiento escrito para el manejo de medicamentos vencidos, deteriorados o con alerta INVIMA: devolución al proveedor o destrucción conforme a normativa.',
   'Procedimiento de devolución/destrucción y registros de medicamentos retirados',
   'medium'),

  ('TSMD-010', '4.10',
   'Prescripción de medicamentos conforme a normativa (Res. 1552/2013)',
   'Las prescripciones médicas deben cumplir los requisitos mínimos de la Resolución 1552 de 2013: nombre del medicamento DCI, forma farmacéutica, concentración, dosis, vía, frecuencia y duración.',
   'Muestra de 10 prescripciones médicas del último mes para verificación',
   'medium')

) AS t(code, number, name, description, evidence_requirement, complexity)
ON CONFLICT DO NOTHING;


-- =============================================================================
-- 5. TSPP — PROCESOS PRIORITARIOS
-- =============================================================================

INSERT INTO evaluation_criteria
  (code, number, name, description, evidence_requirement, complexity, standard_id, service_id, is_mandatory, status)
SELECT
  code, number, name, description, evidence_requirement, complexity,
  (SELECT id FROM evaluation_standards WHERE code = 'TSPP' LIMIT 1) AS standard_id,
  s.id AS service_id,
  TRUE,
  'active'
FROM services s
CROSS JOIN (VALUES

  ('TSPP-001', '5.1',
   'Programa de seguridad del paciente documentado y vigente',
   'Debe existir un programa de seguridad del paciente por escrito con: política institucional, estrategias de implementación, indicadores de seguimiento, responsables y evidencia de actividades realizadas.',
   'Documento del programa de seguridad del paciente con registro de actividades',
   'complex'),

  ('TSPP-002', '5.2',
   'Cuatro (4) formatos de seguridad del paciente implementados',
   'El prestador debe tener implementados como mínimo 4 formatos de reporte de seguridad del paciente: incidentes, eventos adversos, casi-accidentes (near miss) y eventos centinela. Los formatos deben estar en uso activo.',
   'Formatos de seguridad vigentes y registros de reportes del último trimestre',
   'medium'),

  ('TSPP-003', '5.3',
   'Protocolo de cirugía segura (Lista de Verificación OMS) — cuando aplique',
   'Los prestadores que realizan procedimientos quirúrgicos deben tener implementado el protocolo de cirugía segura con la lista de verificación de la OMS (Sign in / Time out / Sign out).',
   'Protocolo de cirugía segura y listas de verificación diligenciadas en los últimos 30 días',
   'complex'),

  ('TSPP-004', '5.4',
   'Protocolo de seguridad en la administración de medicamentos',
   'Debe existir protocolo documentado que incluya: los 10 correctos de medicamentos, doble verificación para medicamentos de alto riesgo y uso correcto de abreviaturas.',
   'Protocolo de seguridad en medicamentos y evidencia de capacitación al personal',
   'medium'),

  ('TSPP-005', '5.5',
   'Protocolo de higiene de manos (5 momentos OMS)',
   'Debe existir protocolo de higiene de manos basado en los 5 momentos OMS, con dispensadores de alcohol glicerinado disponibles en los puntos de atención y evidencia de adherencia.',
   'Protocolo de higiene de manos, disponibilidad de insumos e indicadores de adherencia',
   'medium'),

  ('TSPP-006', '5.6',
   'Protocolo de bioseguridad y precauciones estándar',
   'Debe existir protocolo de bioseguridad con precauciones estándar y adicionales (contacto, gotas, aéreo), manejo de elementos cortopunzantes y uso de EPP para todos los servicios.',
   'Protocolo de bioseguridad vigente y evidencia de dotación de EPP al personal',
   'medium'),

  ('TSPP-007', '5.7',
   'Guías de práctica clínica basadas en evidencia adoptadas por el prestador',
   'El prestador debe haber adoptado formalmente guías de práctica clínica basadas en evidencia para los diagnósticos y procedimientos más frecuentes del servicio, con socialización al personal.',
   'Guías clínicas adoptadas con resolución o acto administrativo y registros de socialización',
   'complex'),

  ('TSPP-008', '5.8',
   'Protocolos específicos por servicio habilitado',
   'Cada servicio habilitado debe contar con los protocolos clínicos específicos requeridos por la normativa: manejo de urgencias, triaje, atención del parto, neonatología, UCI, etc., según el servicio.',
   'Protocolos específicos del servicio vigentes y actualizados en los últimos 2 años',
   'complex'),

  ('TSPP-009', '5.9',
   'No se reutilizan empaques o bolsas de esterilización',
   'El prestador debe garantizar que no se reutilicen empaques, bolsas o contenedores de esterilización una vez abiertos. Debe existir procedimiento documentado y el personal debe conocerlo.',
   'Inspección del área de esterilización y entrevista al personal sobre política de no reutilización',
   'simple'),

  ('TSPP-010', '5.10',
   'Plan hospitalario para la gestión del riesgo de desastres',
   'El prestador debe contar con un plan hospitalario para la gestión del riesgo de desastres con procedimientos de evacuación, triaje masivo y continuidad de la atención.',
   'Plan hospitalario de gestión del riesgo y registros de simulacros realizados',
   'complex'),

  ('TSPP-011', '5.11',
   'Cronograma de capacitación al personal en procesos prioritarios',
   'El cronograma de capacitación debe incluir temas de procesos prioritarios: seguridad del paciente, higiene de manos, bioseguridad, uso de equipos, entre otros. Debe estar ejecutado con registros.',
   'Cronograma de capacitación en procesos prioritarios y registros de asistencia',
   'medium'),

  ('TSPP-012', '5.12',
   'Consentimiento informado por procedimiento o servicio (cuando aplique)',
   'Deben existir formatos de consentimiento informado específicos para los procedimientos o servicios que lo requieren, diligenciados y firmados antes de la intervención.',
   'Formatos de consentimiento informado por procedimiento y muestra diligenciada',
   'medium'),

  ('TSPP-013', '5.13',
   'Protocolo de referencia y contrarreferencia documentado',
   'Debe existir protocolo de referencia y contrarreferencia que defina criterios, responsables, medios de comunicación y tiempos de respuesta para la remisión de pacientes.',
   'Protocolo de referencia y contrarreferencia y registros de referidos del último trimestre',
   'medium')

) AS t(code, number, name, description, evidence_requirement, complexity)
ON CONFLICT DO NOTHING;


-- =============================================================================
-- 6. TSHCR — HISTORIA CLÍNICA Y REGISTROS
-- =============================================================================

INSERT INTO evaluation_criteria
  (code, number, name, description, evidence_requirement, complexity, standard_id, service_id, is_mandatory, status)
SELECT
  code, number, name, description, evidence_requirement, complexity,
  (SELECT id FROM evaluation_standards WHERE code = 'TSHCR' LIMIT 1) AS standard_id,
  s.id AS service_id,
  TRUE,
  'active'
FROM services s
CROSS JOIN (VALUES

  ('TSHCR-001', '6.1',
   'Historia clínica con los 15 campos mínimos de identificación (Res. 1995/1999)',
   'La historia clínica debe contener los 15 datos mínimos de identificación: (1) nombre completo del paciente, (2) estado civil, (3) documento de identidad tipo y número, (4) fecha de nacimiento, (5) edad, (6) sexo, (7) ocupación, (8) dirección de residencia, (9) teléfono de residencia, (10) municipio de residencia, (11) nombre y teléfono del acompañante, (12) nombre, teléfono y parentesco del responsable, (13) entidad aseguradora, (14) tipo de vinculación, (15) consentimiento informado firmado.',
   'Muestra aleatoria de 10 historias clínicas: verificar los 15 campos en cada una',
   'medium'),

  ('TSHCR-002', '6.2',
   'Consentimiento informado firmado en la historia clínica',
   'El consentimiento informado debe estar firmado por el paciente o su representante legal y debe reposar en la historia clínica antes del inicio de cualquier procedimiento que lo requiera.',
   'Historias clínicas con consentimiento informado diligenciado y firmado',
   'medium'),

  ('TSHCR-003', '6.3',
   'Registros clínicos de cada atención: anamnesis, examen físico, diagnóstico, plan',
   'Cada atención debe quedar registrada en la historia clínica con: anamnesis (motivo de consulta y enfermedad actual), examen físico, diagnóstico con código CIE-10, plan de manejo y firma del profesional.',
   'Muestra de historias clínicas con registros completos de atención',
   'medium'),

  ('TSHCR-004', '6.4',
   'Historia clínica única por paciente en la institución',
   'Cada paciente debe tener una única historia clínica que integre todas las atenciones recibidas en la institución. No puede haber duplicados por paciente.',
   'Verificación en el sistema de información de historias clínicas sin duplicados',
   'medium'),

  ('TSHCR-005', '6.5',
   'Política de archivo, custodia y conservación de historias clínicas',
   'Debe existir política documentada de archivo y custodia de historias clínicas con tiempos de conservación mínimos (20 años para adultos, según Res. 1995/1999) y condiciones de almacenamiento.',
   'Política de archivo vigente y condiciones físicas o digitales del archivo de historias',
   'medium'),

  ('TSHCR-006', '6.6',
   'Control de acceso y confidencialidad de la historia clínica',
   'El acceso a la historia clínica debe estar restringido al personal autorizado mediante mecanismos de control (claves de acceso en sistema electrónico o control físico en archivo). Debe existir política de confidencialidad.',
   'Política de confidencialidad, mecanismos de control de acceso y log de consultas',
   'medium'),

  ('TSHCR-007', '6.7',
   'Registros de signos vitales y evoluciones en internación (cuando aplique)',
   'Para servicios de internación, UCI y urgencias, los registros de signos vitales y notas de evolución deben estar completos y con la frecuencia establecida en el protocolo del servicio.',
   'Historias clínicas de pacientes internados con registros de signos vitales y evoluciones',
   'medium'),

  ('TSHCR-008', '6.8',
   'Registro de historia clínica de urgencias con hora de llegada y triaje',
   'Las historias clínicas de urgencias deben registrar: hora de llegada, categoría de triaje asignada, tiempo de atención y nombre del profesional que realiza el triaje.',
   'Historias de urgencias con datos de triaje y tiempos de atención',
   'medium'),

  ('TSHCR-009', '6.9',
   'Registros de anestesia y procedimientos quirúrgicos (cuando aplique)',
   'Los procedimientos que requieren anestesia deben tener nota preanestésica, registro anestésico durante el procedimiento y nota postanestésica en la historia clínica.',
   'Historias clínicas de cirugía con registros anestésicos completos',
   'complex'),

  ('TSHCR-010', '6.10',
   'Sistema de información habilitado para historia clínica electrónica (cuando aplique)',
   'Los prestadores que usan historia clínica electrónica deben contar con sistema habilitado que garantice integridad, disponibilidad, confidencialidad y trazabilidad del registro.',
   'Contrato de licenciamiento o titularidad del sistema, con respaldo de datos verificable',
   'complex'),

  ('TSHCR-011', '6.11',
   'Registro de RIPS conforme a Resolución 3374 de 2000',
   'El prestador debe generar y reportar los Registros Individuales de Prestación de Servicios (RIPS) conforme a la Resolución 3374 de 2000, con los campos requeridos por tipo de atención.',
   'Reporte RIPS del último mes generado y enviado a la aseguradora o SISPRO',
   'medium')

) AS t(code, number, name, description, evidence_requirement, complexity)
ON CONFLICT DO NOTHING;


-- =============================================================================
-- 7. TSINT — INTERDEPENDENCIA DE SERVICIOS
-- =============================================================================

INSERT INTO evaluation_criteria
  (code, number, name, description, evidence_requirement, complexity, standard_id, service_id, is_mandatory, status)
SELECT
  code, number, name, description, evidence_requirement, complexity,
  (SELECT id FROM evaluation_standards WHERE code = 'TSINT' LIMIT 1) AS standard_id,
  s.id AS service_id,
  TRUE,
  'active'
FROM services s
CROSS JOIN (VALUES

  ('TSINT-001', '7.1',
   'Identificación de servicios de apoyo requeridos por el servicio habilitado',
   'El prestador debe tener documentada la lista de servicios de los cuales depende para garantizar la atención continua y segura (laboratorio, radiología, banco de sangre, UCI, etc.).',
   'Documento de caracterización del servicio con identificación de servicios de apoyo',
   'medium'),

  ('TSINT-002', '7.2',
   'Contratos o convenios vigentes con prestadores de servicios de apoyo',
   'Para los servicios de apoyo que no se prestan directamente, deben existir contratos o convenios vigentes con prestadores habilitados para esos servicios en el REPS.',
   'Contratos o convenios con prestadores de servicios de apoyo y verificación REPS de cada uno',
   'medium'),

  ('TSINT-003', '7.3',
   'Acreditación REPS de los prestadores vinculados en la interdependencia',
   'Cada prestador con quien se tiene convenio de interdependencia debe estar habilitado en el REPS para los servicios específicos que aporta. El prestador debe verificar esta condición.',
   'Consulta REPS actualizada de los prestadores de la red de interdependencia',
   'medium'),

  ('TSINT-004', '7.4',
   'Red de referencia y contrarreferencia formalizada',
   'Debe existir una red de referencia y contrarreferencia documentada con los prestadores a quienes se derivan pacientes que superan la capacidad resolutiva del servicio habilitado.',
   'Documento de red de referencia con prestadores identificados y contratos de respaldo',
   'medium'),

  ('TSINT-005', '7.5',
   'Convenios docencia-servicio formalizados (cuando aplique)',
   'Cuando el prestador recibe estudiantes en práctica de programas de salud, deben existir convenios docencia-servicio firmados entre la IPS y la Institución de Educación Superior, con supervisión garantizada.',
   'Convenios docencia-servicio vigentes y listado de estudiantes activos por programa',
   'medium')

) AS t(code, number, name, description, evidence_requirement, complexity)
ON CONFLICT DO NOTHING;


-- =============================================================================
-- Resumen de carga
-- =============================================================================
SELECT
  es.code AS estandar,
  es.name AS nombre,
  COUNT(ec.id) AS criterios_cargados
FROM evaluation_standards es
LEFT JOIN evaluation_criteria ec ON ec.standard_id = es.id
WHERE es.is_transversal = TRUE
GROUP BY es.code, es.name
ORDER BY es.code;

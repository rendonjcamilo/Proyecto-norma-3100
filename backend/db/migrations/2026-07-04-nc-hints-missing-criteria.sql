-- Migración: nc_hints para criterios evaluables sin texto (261 criterios)
-- Generado: 2026-07-04
-- Idempotente: solo actualiza donde nc_hint IS NULL o vacío

-- ============================
-- CBN - Cuidado Básico Neonatal
-- ============================
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'CBN-DOT-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de incubadora abierta o cuna para recién nacido.' WHERE code = 'CBN-DOT-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de silla para el acompañante.' WHERE code = 'CBN-DOT-003' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de fonendoscopio neonatal.' WHERE code = 'CBN-DOT-005' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de tensiómetro neonatal.' WHERE code = 'CBN-DOT-006' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de monitor de signos vitales con accesorios neonatales.' WHERE code = 'CBN-DOT-007' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de oxímetro con sensor neonatal.' WHERE code = 'CBN-DOT-008' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de bomba de infusión.' WHERE code = 'CBN-DOT-009' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de resucitador pulmonar manual neonatal.' WHERE code = 'CBN-DOT-010' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de carro de paro.' WHERE code = 'CBN-DOT-011' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de glucómetro.' WHERE code = 'CBN-DOT-012' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de monitor neonatal de transporte.' WHERE code = 'CBN-DOT-013' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de incubadora neonatal de transporte.' WHERE code = 'CBN-DOT-014' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de ventilador neonatal de transporte.' WHERE code = 'CBN-DOT-015' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de lámpara de fototerapia.' WHERE code = 'CBN-DOT-016' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de báscula para bebés.' WHERE code = 'CBN-DOT-017' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de tallímetro o infantómetro.' WHERE code = 'CBN-DOT-018' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de cinta métrica.' WHERE code = 'CBN-DOT-019' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de pesa pañales.' WHERE code = 'CBN-DOT-020' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de electrocardiógrafo que permita su impresión.' WHERE code = 'CBN-DOT-021' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de equipo de órganos de los sentidos.' WHERE code = 'CBN-DOT-022' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de oxígeno medicinal mediante salida fija o portátil.' WHERE code = 'CBN-DOT-023' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de sistema de succión mediante vacío o aspirador.' WHERE code = 'CBN-DOT-024' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'CBN-DOT-025' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'CBN-HCR-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'CBN-INF-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de ambiente filtro para acceso del personal con lavamanos y área de casilleros.' WHERE code = 'CBN-INF-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de estación de enfermería.' WHERE code = 'CBN-INF-003' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de ambiente o área para brindar información a familiares.' WHERE code = 'CBN-INF-004' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de área de incubadoras o cunas señalizada y de circulación restringida.' WHERE code = 'CBN-INF-005' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de lavamanos en el servicio.' WHERE code = 'CBN-INF-006' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia que las puertas de acceso al servicio permitan el paso y giro de incubadoras y cunas.' WHERE code = 'CBN-INF-008' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de ambiente para extracción de leche materna y preparación de fórmulas artificiales.' WHERE code = 'CBN-INF-009' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'CBN-INF-010' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios de interdependencia de servicios aplicables al servicio neonatal.' WHERE code = 'CBN-INT-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad del servicio de laboratorio clínico.' WHERE code = 'CBN-INT-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad del servicio farmacéutico.' WHERE code = 'CBN-INT-003' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad del servicio de transporte asistencial.' WHERE code = 'CBN-INT-004' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad del servicio de imágenes diagnósticas.' WHERE code = 'CBN-INT-005' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad del servicio de cuidado intermedio neonatal.' WHERE code = 'CBN-INT-006' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de servicios de apoyo hospitalario (lavandería y vigilancia).' WHERE code = 'CBN-INT-007' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No aplica como criterio evaluable de forma independiente.' WHERE code = 'CBN-INT-008' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'CBN-MD-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de oxígeno medicinal.' WHERE code = 'CBN-MD-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'CBN-PP-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre ronda médica diaria de evolución de pacientes.' WHERE code = 'CBN-PP-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre solicitud de interconsultas.' WHERE code = 'CBN-PP-003' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre entrega de turno por parte de enfermería y medicina.' WHERE code = 'CBN-PP-004' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre control de líquidos.' WHERE code = 'CBN-PP-005' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre plan de cuidados de enfermería.' WHERE code = 'CBN-PP-006' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre administración de medicamentos.' WHERE code = 'CBN-PP-007' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre sujeción de pacientes.' WHERE code = 'CBN-PP-008' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre toma de muestras de laboratorio clínico.' WHERE code = 'CBN-PP-009' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre cateterismo vesical.' WHERE code = 'CBN-PP-010' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre preparación para la toma de imágenes diagnósticas.' WHERE code = 'CBN-PP-011' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre indicaciones del cuidado de la salud al familiar o responsable.' WHERE code = 'CBN-PP-012' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre transporte del recién nacido.' WHERE code = 'CBN-PP-013' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre manejo de líquidos y electrolitos.' WHERE code = 'CBN-PP-014' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre prevención de la retinopatía del recién nacido.' WHERE code = 'CBN-PP-015' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre remisión del prematuro al seguimiento en programa canguro.' WHERE code = 'CBN-PP-016' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'CBN-PP-017' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'CBN-TH-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se acredita la disponibilidad de auxiliar de enfermería.' WHERE code = 'CBN-TH-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se acredita que el profesional de la medicina cuente con constancia de formación continua en atención del paciente neonatal.' WHERE code = 'CBN-TH-004' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se acredita que el profesional de la enfermería cuente con constancia de formación continua en atención del paciente neonatal.' WHERE code = 'CBN-TH-005' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'CBN-TH-006' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia que el profesional de la salud pueda hacer uso de la telexperticia sincrónica o asincrónica entre profesionales.' WHERE code = 'CBN-TH-007' AND (nc_hint IS NULL OR nc_hint = '');

-- ============================
-- CES - Consulta Externa Especializada
-- ============================
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'CES-MD-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'CES-MD-003' AND (nc_hint IS NULL OR nc_hint = '');

-- ============================
-- DLS - Diálisis
-- ============================
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el registro del control de calidad del agua de la planta de tratamiento.' WHERE code = 'DLS-HCR-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia que la distribución de máquinas de hemodiálisis permita la movilización del talento humano, pacientes y equipos.' WHERE code = 'DLS-INF-017B' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad del servicio farmacéutico.' WHERE code = 'DLS-INT-002B' AND (nc_hint IS NULL OR nc_hint = '');

-- ============================
-- GNT - Ginecotocología
-- ============================
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia convenio o contrato vigente con banco de sangre certificado para el suministro de componentes sanguíneos.' WHERE code = 'GNT-MD-002' AND (nc_hint IS NULL OR nc_hint = '');

-- ============================
-- IDX-NI - Imágenes Diagnósticas No Ionizantes
-- ============================
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'IDX-NI-DOT-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad del o los equipos generadores de radiaciones no ionizantes según los exámenes realizados.' WHERE code = 'IDX-NI-DOT-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de pantalla o monitor grado médico para imágenes radiológicas.' WHERE code = 'IDX-NI-DOT-003' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'IDX-NI-DOT-004' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de equipo de captura y transmisión de datos e imágenes.' WHERE code = 'IDX-NI-DOT-005' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de pantalla o monitor grado médico para imágenes radiológicas.' WHERE code = 'IDX-NI-DOT-006' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'IDX-NI-HCR-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'IDX-NI-HCR-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'IDX-NI-INF-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de ambiente exclusivo para el equipo generador de radiación no ionizante.' WHERE code = 'IDX-NI-INF-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de unidad sanitaria cuando el procedimiento lo requiere.' WHERE code = 'IDX-NI-INF-003' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de vestidor para pacientes y área para casilleros cuando el procedimiento lo requiere.' WHERE code = 'IDX-NI-INF-005' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de área para almacenamiento de dispositivos médicos e insumos.' WHERE code = 'IDX-NI-INF-006' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de sala de espera.' WHERE code = 'IDX-NI-INF-007' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de unidades sanitarias discriminadas por sexo.' WHERE code = 'IDX-NI-INF-008' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'IDX-NI-INF-009' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'IDX-NI-INF-010' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No aplica como criterio evaluable de forma independiente.' WHERE code = 'IDX-NI-INT-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'IDX-NI-MD-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'IDX-NI-PP-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre procedimientos para la realización de los exámenes diagnósticos.' WHERE code = 'IDX-NI-PP-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre instrucciones a los pacientes para preparación de procedimientos diagnósticos.' WHERE code = 'IDX-NI-PP-003' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre verificación de calidad de imagen con medidas preventivas y correctivas.' WHERE code = 'IDX-NI-PP-004' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre control de calidad del equipo con medidas correctivas.' WHERE code = 'IDX-NI-PP-005' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'IDX-NI-PP-006' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'IDX-NI-TH-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se acredita la disponibilidad de médico especializado en radiología e imágenes diagnósticas para la interpretación.' WHERE code = 'IDX-NI-TH-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se acredita la disponibilidad de técnico o tecnólogo en radiología e imágenes diagnósticas para resonancia magnética y ultrasonido.' WHERE code = 'IDX-NI-TH-003' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'IDX-NI-TH-004' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia que la interpretación de imágenes diagnósticas sea realizada por médico especializado en radiología.' WHERE code = 'IDX-NI-TH-005' AND (nc_hint IS NULL OR nc_hint = '');

-- ============================
-- MNUC - Medicina Nuclear
-- ============================
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'MNUC-DOT-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia que se garantice la realización de controles de calidad de equipos PET-TC o SPECT por profesional en física médica.' WHERE code = 'MNUC-DOT-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de Gammacámara o SPECT o SPECT CT para medicina nuclear diagnóstica.' WHERE code = 'MNUC-DOT-003' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de PET-CT o PET Resonancia para medicina nuclear diagnóstica PET.' WHERE code = 'MNUC-DOT-004' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de cama hospitalaria para terapias con radionúclidos de actividad mayor a 30 mCi.' WHERE code = 'MNUC-DOT-005' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de Gammacámara para rastreos pos-terapia con radionúclidos.' WHERE code = 'MNUC-DOT-006' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de carro de paro.' WHERE code = 'MNUC-DOT-007' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de oxígeno medicinal mediante salida fija o portátil.' WHERE code = 'MNUC-DOT-008' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'MNUC-DOT-009' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'MNUC-HCR-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el registro de resultados diagnósticos de medicina nuclear.' WHERE code = 'MNUC-HCR-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el registro de resultados rechazados por el especialista en medicina nuclear y sus causas.' WHERE code = 'MNUC-HCR-003' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el registro de tratamientos realizados.' WHERE code = 'MNUC-HCR-004' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el registro de mediciones de tasa de exposición al momento del alta de pacientes sometidos a terapia.' WHERE code = 'MNUC-HCR-005' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'MNUC-HCR-006' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'MNUC-INF-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de ducha de seguridad.' WHERE code = 'MNUC-INF-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'MNUC-INF-003' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de sala de espera.' WHERE code = 'MNUC-INF-004' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de unidades sanitarias discriminadas por sexo.' WHERE code = 'MNUC-INF-005' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de sala de lectura y transcripción de resultados.' WHERE code = 'MNUC-INF-006' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de ambiente exclusivo para segregación y decaimiento de ropa.' WHERE code = 'MNUC-INF-007' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de ambiente exclusivo para segregación y decaimiento de residuos.' WHERE code = 'MNUC-INF-008' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de vestidor de pacientes con área para casilleros.' WHERE code = 'MNUC-INF-009' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia que todas las áreas cuenten con la señalización de zona controlada y supervisada usando el símbolo de radiación.' WHERE code = 'MNUC-INF-010' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de señal luminosa a la entrada indicando que el equipo está en funcionamiento.' WHERE code = 'MNUC-INF-011' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'MNUC-INF-012' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de ambiente de pacientes inyectados con unidad sanitaria de uso mixto.' WHERE code = 'MNUC-INF-013' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de ambiente exclusivo para la Gammacámara o SPECT o SPECT-CT.' WHERE code = 'MNUC-INF-014' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de ambiente para administración de radiofármacos.' WHERE code = 'MNUC-INF-015' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de ambiente o área de control/comando que permita visualización del paciente.' WHERE code = 'MNUC-INF-016' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'MNUC-INF-017' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de ambiente para PET/CT o PET RMN.' WHERE code = 'MNUC-INF-018' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de ambiente de control/comando que permita visualización del paciente para PET.' WHERE code = 'MNUC-INF-019' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de ambientes blindados para administración y captación de radiofármacos PET con lavamanos.' WHERE code = 'MNUC-INF-020' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de unidad sanitaria para pacientes inyectados de uso mixto.' WHERE code = 'MNUC-INF-021' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'MNUC-INF-022' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de ambiente o área con unidad sanitaria para terapias de radiofármacos de menor actividad.' WHERE code = 'MNUC-INF-023' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de puesto de enfermería con sistema de vigilancia y monitoreo permanente.' WHERE code = 'MNUC-INF-024' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de ambiente para aplicación y administración de radiofármacos.' WHERE code = 'MNUC-INF-025' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'MNUC-INF-026' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de puesto de enfermería con sistema de vigilancia y monitoreo permanente.' WHERE code = 'MNUC-INF-027' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de habitaciones individuales con baño y aislamiento estricto.' WHERE code = 'MNUC-INF-028' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de estación de enfermería.' WHERE code = 'MNUC-INF-029' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de habitaciones individuales con baño y aislamiento estricto.' WHERE code = 'MNUC-INF-030' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'MNUC-INF-031' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios de interdependencia de servicios aplicables al servicio.' WHERE code = 'MNUC-INT-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad del servicio de consulta externa de medicina nuclear para terapias con radionúclidos.' WHERE code = 'MNUC-INT-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad del servicio de diagnóstico vascular para estudios de perfusión miocárdica.' WHERE code = 'MNUC-INT-003' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No aplica como criterio evaluable de forma independiente.' WHERE code = 'MNUC-INT-004' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'MNUC-MD-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia certificado vigente de buenas prácticas de elaboración de radiofármacos expedido por el INVIMA.' WHERE code = 'MNUC-MD-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia acta de inspección expedida por el INVIMA para la radiofarmacia de baja complejidad.' WHERE code = 'MNUC-MD-003' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de oxígeno medicinal.' WHERE code = 'MNUC-MD-004' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'MNUC-MD-005' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'MNUC-PP-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'MNUC-PP-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre prescripción y dosificación de radiofármacos para Gammagrafías y estudios PET o SPECT CT.' WHERE code = 'MNUC-PP-003' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre procedimientos diagnósticos para gammagrafías o PET-CT o SPECT CT.' WHERE code = 'MNUC-PP-004' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre el procedimiento de perfusión miocárdica con isonitrilos.' WHERE code = 'MNUC-PP-005' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'MNUC-PP-006' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre prescripción y dosificación de radiofármacos para terapias.' WHERE code = 'MNUC-PP-007' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre el procedimiento de alta del paciente sometido a terapia con radiofármacos.' WHERE code = 'MNUC-PP-008' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre procedimientos terapéuticos realizados con radiofármacos.' WHERE code = 'MNUC-PP-009' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre procedimientos que requieren permanencia del especialista en medicina nuclear y físico médico.' WHERE code = 'MNUC-PP-010' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia que la programación de pacientes de diagnóstico y terapias con radionúclidos de actividad menor a 30 mCi se dé por separado.' WHERE code = 'MNUC-PP-011' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia que la administración de radiofármaco en terapias de actividad mayor a 30 mCi se realice en la habitación de aislamiento.' WHERE code = 'MNUC-PP-012' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'MNUC-PP-H03' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'MNUC-TH-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se acredita la disponibilidad de profesional de enfermería con constancia en protección radiológica y radiofármacos para terapias mayores a 30 mCi.' WHERE code = 'MNUC-TH-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se acredita la disponibilidad de tecnólogo en medicina nuclear o manejo de fuentes no selladas con constancia en protección radiológica.' WHERE code = 'MNUC-TH-003' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se acredita la disponibilidad de oficial de protección radiológica para la institución.' WHERE code = 'MNUC-TH-004' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'MNUC-TH-005' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se acredita la disponibilidad de médico especialista en medicina nuclear con permanencia durante los procedimientos definidos.' WHERE code = 'MNUC-TH-006' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se acredita la disponibilidad de profesional con título de postgrado en física médica con permanencia durante los procedimientos.' WHERE code = 'MNUC-TH-007' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'MNUC-TH-008' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia que el especialista en medicina nuclear pueda hacer uso de la telexperticia sincrónica entre profesionales de la salud.' WHERE code = 'MNUC-TH-009' AND (nc_hint IS NULL OR nc_hint = '');

-- ============================
-- RXO - Radiología Oral
-- ============================
UPDATE evaluation_criteria SET nc_hint = 'No se acredita la disponibilidad de profesional de odontología o tecnólogo en radiología, o auxiliar de odontología o auxiliar en salud oral.' WHERE code = 'RXO-TH-001a' AND (nc_hint IS NULL OR nc_hint = '');

-- ============================
-- SF - Servicio Farmacéutico
-- ============================
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'SF-DOT-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de dotación y mobiliario exclusivos para el cumplimiento de los objetivos del servicio.' WHERE code = 'SF-DOT-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de instrumentos para medir la humedad relativa y temperatura en las áreas de almacenamiento.' WHERE code = 'SF-DOT-003' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'SF-DOT-004' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'SF-HC-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'SF-HC-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'SF-INF-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'SF-INF-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de ambiente o área administrativa en el servicio farmacéutico.' WHERE code = 'SF-INF-003' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de ambiente o área de recepción de medicamentos y dispositivos médicos.' WHERE code = 'SF-INF-004' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de ambiente o área de dispensación de medicamentos y entrega de dispositivos médicos.' WHERE code = 'SF-INF-005' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de área de almacenamiento con condiciones de temperatura y humedad, incluyendo cadena de frío cuando aplique.' WHERE code = 'SF-INF-006' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de área independiente para medicamentos de control especial con condiciones adecuadas.' WHERE code = 'SF-INF-007' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de área para almacenamiento de productos rechazados, devueltos y retirados.' WHERE code = 'SF-INF-008' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de área para almacenamiento de productos destruidos o desnaturalizados por vencimiento o deterioro.' WHERE code = 'SF-INF-009' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de área de cuarentena de medicamentos.' WHERE code = 'SF-INF-010' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'SF-INF-011' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de lo definido en la Resolución 1403 de 2007 para el servicio farmacéutico de baja complejidad.' WHERE code = 'SF-INF-012' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'SF-INF-013' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No aplica como criterio evaluable de forma independiente.' WHERE code = 'SF-INT-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No aplica como criterio evaluable de forma independiente.' WHERE code = 'SF-INT-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'SF-MED-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'SF-MED-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios del servicio farmacéutico de baja complejidad según la normativa vigente.' WHERE code = 'SF-MED-003' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'SF-MED-004' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'SF-PP-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre los procesos generales elaborada por el responsable del servicio.' WHERE code = 'SF-PP-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información visible al usuario que prohíba la asesoría farmacológica por personal no autorizado.' WHERE code = 'SF-PP-003' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre el manejo de medicamentos de control especial.' WHERE code = 'SF-PP-004' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre seguimiento a condiciones ambientales de temperatura y humedad.' WHERE code = 'SF-PP-005' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'SF-PP-006' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada de los procesos especiales del servicio farmacéutico según la Resolución 1403 de 2007.' WHERE code = 'SF-PP-007' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'SF-PP-008' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'SF-TH-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de lo definido en el Decreto 2200 de 2005 y la Resolución 1403 de 2007 para el servicio farmacéutico.' WHERE code = 'SF-TH-001a' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'SF-TH-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia que el talento humano brinde atención farmacéutica a través de telemedicina o telexperticia.' WHERE code = 'SF-TH-003' AND (nc_hint IS NULL OR nc_hint = '');

-- ============================
-- TMCU - Toma de Muestras Cuello Uterino
-- ============================
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'TMCU-DOT-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de camilla con estribos.' WHERE code = 'TMCU-DOT-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de lámpara de cuello de cisne o su equivalente.' WHERE code = 'TMCU-DOT-003' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de escalerilla.' WHERE code = 'TMCU-DOT-004' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'TMCU-HC-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el registro de pacientes y muestras tomadas.' WHERE code = 'TMCU-HC-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el registro de muestras remitidas para procesamiento.' WHERE code = 'TMCU-HC-003' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el registro de resultados de análisis con el nombre del laboratorio procesador de las muestras.' WHERE code = 'TMCU-HC-004' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el registro de análisis del control de calidad y medidas preventivas y correctivas.' WHERE code = 'TMCU-HC-005' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'TMCU-INF-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de ambiente para toma de muestras especiales con unidad sanitaria y perchero.' WHERE code = 'TMCU-INF-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de área de información y entrega de resultados.' WHERE code = 'TMCU-INF-003' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de área de preparación, embalaje y remisión de muestras con mesón de trabajo.' WHERE code = 'TMCU-INF-004' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de área para almacenamiento de materiales, insumos y reactivos.' WHERE code = 'TMCU-INF-005' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'TMCU-INF-006' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de sala de espera.' WHERE code = 'TMCU-INF-007' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de unidades sanitarias discriminadas por sexo.' WHERE code = 'TMCU-INF-008' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'TMCU-INF-009' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de laboratorio de citología cérvico-uterinas o servicio de patología.' WHERE code = 'TMCU-INT-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'TMCU-MED-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de espéculos de diferentes tamaños con garantía de esterilización.' WHERE code = 'TMCU-MED-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de bata para el paciente.' WHERE code = 'TMCU-MED-003' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de fijador para células cuando se requiera.' WHERE code = 'TMCU-MED-004' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de cepillo endocervical y espátula desechables cuando se requiera.' WHERE code = 'TMCU-MED-005' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de láminas portaobjetos de único uso con área de rotulado.' WHERE code = 'TMCU-MED-006' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de elemento para rotulación de láminas portaobjetos.' WHERE code = 'TMCU-MED-007' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de kits para toma de pruebas de ADN-VPH cuando se realicen.' WHERE code = 'TMCU-MED-008' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de soporte para fijación de muestras.' WHERE code = 'TMCU-MED-009' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de insumos para realización de citología en base líquida.' WHERE code = 'TMCU-MED-010' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia la disponibilidad de insumos para inspección visual (ácido acético y lugol).' WHERE code = 'TMCU-MED-011' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'TMCU-PP-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre toma, identificación, transporte, conservación y remisión de muestras.' WHERE code = 'TMCU-PP-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre toma de muestras cervicouterinas, pruebas ADN/VPH y técnicas de inspección visual.' WHERE code = 'TMCU-PP-003' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre preparación de fijador de células.' WHERE code = 'TMCU-PP-004' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre control de calidad.' WHERE code = 'TMCU-PP-005' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia información documentada sobre entrega de resultados.' WHERE code = 'TMCU-PP-006' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'TMCU-TH-001' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se acredita la disponibilidad de profesional de la medicina, enfermería, bacteriología o citohistotecnólogo.' WHERE code = 'TMCU-TH-002' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se acredita que el personal que toma citologías cuente con constancia de formación continua en esta actividad.' WHERE code = 'TMCU-TH-003' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia que la técnica VIA VILI sea realizada exclusivamente por profesional de la medicina o de enfermería.' WHERE code = 'TMCU-TH-004' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se evidencia el cumplimiento de todos los criterios aplicables al servicio según la normativa vigente.' WHERE code = 'TMCU-TH-005' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se acredita la disponibilidad de auxiliar de enfermería, profesional de la medicina, bacteriología o citohistotecnólogo.' WHERE code = 'TMCU-TH-006' AND (nc_hint IS NULL OR nc_hint = '');
UPDATE evaluation_criteria SET nc_hint = 'No se acredita que el personal que realice toma de citologías cuente con constancia de formación continua.' WHERE code = 'TMCU-TH-007' AND (nc_hint IS NULL OR nc_hint = '');

-- ============================================================
-- Migración: Herramienta de Verificación Laboratorios Clínicos
-- Norma: Resolución 1619 de 2015
-- 6 estándares + 84 criterios evaluables como anexo de habilitación
-- Aplica cuando el prestador tiene servicio de Laboratorio Clínico
-- ============================================================

DO $$
DECLARE
  v_service_id  UUID;
  v_admin_id    UUID;
  v_q_id        UUID := gen_random_uuid();
BEGIN

  -- -------------------------------------------------------
  -- 1. SERVICIO
  -- -------------------------------------------------------
  SELECT id INTO v_service_id FROM services WHERE code = 'LAB-CAL';
  IF NOT FOUND THEN
    INSERT INTO services (code, name, category, description, status)
    VALUES (
      'LAB-CAL',
      'Laboratorio Clínico - Calidad (Res. 1619)',
      'Apoyo Diagnóstico y Complementación Terapéutica',
      'Herramienta de verificación de estándares de calidad para laboratorios clínicos según Resolución 1619 de 2015.',
      'available'
    )
    RETURNING id INTO v_service_id;
  END IF;

  -- Idempotencia: salir si ya existe
  IF EXISTS (SELECT 1 FROM evaluation_standards WHERE code = 'LAB-OG') THEN
    RAISE NOTICE 'Estándares LAB-CAL ya existen. Migración omitida.';
    RETURN;
  END IF;

  -- Usuario administrador para el cuestionario
  SELECT u.id INTO v_admin_id
  FROM users u
  JOIN roles r ON u.role_id = r.id
  WHERE r.name = 'ADMIN'
  ORDER BY u.created_at
  LIMIT 1;
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró usuario ADMIN. Cree uno antes de ejecutar esta migración.';
  END IF;

  -- -------------------------------------------------------
  -- 2. ESTÁNDARES (6)
  -- -------------------------------------------------------
  INSERT INTO evaluation_standards (id, code, name, service_id, is_transversal, category)
  VALUES
    (gen_random_uuid(), 'LAB-OG',  'Organización y Gestión',              v_service_id, false, 'Calidad Laboratorio Clínico'),
    (gen_random_uuid(), 'LAB-TH',  'Talento Humano',                      v_service_id, false, 'Calidad Laboratorio Clínico'),
    (gen_random_uuid(), 'LAB-ID',  'Infraestructura y Dotación',          v_service_id, false, 'Calidad Laboratorio Clínico'),
    (gen_random_uuid(), 'LAB-RC',  'Referencia y Contrareferencia',       v_service_id, false, 'Calidad Laboratorio Clínico'),
    (gen_random_uuid(), 'LAB-BIO', 'Bioseguridad y Manejo de Residuos',   v_service_id, false, 'Calidad Laboratorio Clínico'),
    (gen_random_uuid(), 'LAB-PP',  'Proceso Prioritario',                 v_service_id, false, 'Calidad Laboratorio Clínico');

  -- -------------------------------------------------------
  -- 3. CRITERIOS
  -- -------------------------------------------------------

  -- === SECCIÓN 1: ORGANIZACIÓN Y GESTIÓN (23 criterios) ===
  INSERT INTO evaluation_criteria
    (code, number, name, description, evidence_requirement, complexity, standard_id, service_id, is_mandatory, is_section_header, nc_hint)
  SELECT
    t.code, t.number, t.name, t.description, t.evidence_requirement, t.complexity,
    (SELECT id FROM evaluation_standards WHERE code = 'LAB-OG' LIMIT 1),
    v_service_id, true, false, t.nc_hint
  FROM (VALUES
    ('LAB-OG-001', '1.1',
     'El laboratorio cuenta con certificación o acreditación de su sistema de gestión de calidad',
     'Verificar documentación que soporte certificación o acreditación vigente (NTC-ISO/IEC 17025, NTC-ISO 15189 o ISO 9001). Para prestadores de salud, verificar publicación de habilitación.',
     'Certificado de acreditación o habilitación vigente con alcance documentado.',
     'medium',
     'No se evidencia certificación o acreditación del sistema de gestión de calidad (NTC-ISO/IEC 17025, NTC-ISO 15189 o ISO 9001) vigente para el laboratorio.'),

    ('LAB-OG-002', '1.2',
     'El laboratorio establece e implementa un sistema de gestión de calidad (SGC) con plataforma documental aprobada',
     'Verificar que se encuentre documentado e implementado un SGC enfocado a la mejora continua. Revisar: Manual de gestión o calidad aprobado y portafolio de servicios.',
     'Manual de calidad aprobado y portafolio de servicios coherente.',
     'complex',
     'No se evidencia un sistema de gestión de calidad documentado e implementado con plataforma documental aprobada, coherente con el portafolio de servicios del laboratorio.'),

    ('LAB-OG-003', '1.3',
     'El laboratorio hace parte del organigrama de la entidad con niveles de autoridad e interrelaciones asignadas',
     'El laboratorio debe estar representado en el organigrama de la Dirección Territorial de Salud o de la institución a la que pertenezca.',
     'Organigrama vigente donde se ubica el laboratorio con líneas de autoridad definidas.',
     'simple',
     'No se evidencia la ubicación del laboratorio en el organigrama de la entidad con los niveles de autoridad e interrelaciones asignados a cada integrante.'),

    ('LAB-OG-004', '1.4',
     'El laboratorio tiene todos los procedimientos técnicos, administrativos y de gestión documentados y aprobados',
     'Verificar elaboración, revisión y aprobación de documentación (procedimientos, instructivos, manuales) que soportan actividades administrativas y operativas, incluidos métodos de ensayo.',
     'Procedimientos técnicos y administrativos documentados, aprobados y disponibles para el personal.',
     'complex',
     'No se evidencian los procedimientos técnicos, administrativos y de gestión de pruebas documentados y aprobados para la totalidad de las actividades del laboratorio.'),

    ('LAB-OG-005', '1.5',
     'La coordinación garantiza que el recurso humano conoce, comprende e implementa los procesos del SGC',
     'Solicitar evidencias de actividades de capacitación sobre el SGC. Los documentos del SGC deben estar disponibles para el personal.',
     'Cronograma de capacitaciones y listados de asistencia del personal sobre el SGC.',
     'medium',
     'No se evidencia que la totalidad del recurso humano del laboratorio conoce, comprende e implementa los procesos, procedimientos y documentación del sistema de gestión de calidad.'),

    ('LAB-OG-006', '1.6',
     'El laboratorio implementa el Manual de Calidad que describe el SGC con los elementos mínimos requeridos',
     'Revisar contenido del manual: alcance, responsabilidades, política y objetivos de calidad, estructura documental, seguimiento y medición, análisis de datos, control de registros.',
     'Manual de calidad aprobado con los elementos mínimos requeridos y evidencias de socialización.',
     'medium',
     'No se evidencia un manual de calidad aprobado que describa el sistema de gestión de calidad con los elementos mínimos requeridos: alcance, responsabilidades, política, objetivos y estructura documental.'),

    ('LAB-OG-007', '1.7',
     'El laboratorio tiene una política de calidad emitida por la alta dirección, socializada y entendida por todo el personal',
     'El laboratorio debe tener una política de gestión de calidad que defina aspectos básicos: apropiada a la organización, mejora continua y cumplimiento de requisitos.',
     'Política de calidad publicada con registros de socialización al personal.',
     'simple',
     'No se evidencia una política de calidad emitida por la alta dirección, adecuada al objeto de la entidad, debidamente socializada y comprendida por el personal del laboratorio.'),

    ('LAB-OG-008', '1.8',
     'El laboratorio tiene definido e implementado un procedimiento de auditorías internas',
     'El plan de auditoría debe tener cronograma y registro de hallazgos. Revisar informes con hallazgos, acciones preventivas y correctivas.',
     'Procedimiento de auditoría interna, plan con cronograma e informes de auditorías realizadas.',
     'medium',
     'No se evidencia un procedimiento implementado de auditorías internas con cronograma de ejecución y registros de hallazgos, acciones preventivas y correctivas.'),

    ('LAB-OG-009', '1.9',
     'El laboratorio realiza control documental del archivo físico y magnético de acuerdo a la normatividad vigente',
     'Los documentos y archivos deben ser preservados según normatividad vigente (Tabla de Retención Documental). Verificar archivo de gestión documental.',
     'Tabla de retención documental y archivo de gestión con control de documentos y registros actualizado.',
     'medium',
     'No se evidencia control documental del archivo físico y magnético preservado de acuerdo a la normatividad vigente y las tablas de retención documental establecidas.'),

    ('LAB-OG-010', '1.10',
     'El laboratorio evalúa resultados de su gestión mediante indicadores y toma acciones frente a los resultados',
     'Solicitar hoja de vida de indicadores, seguimiento de los tres últimos periodos de medición y acciones tomadas.',
     'Indicadores de gestión con seguimiento periódico, análisis de resultados y planes de acción documentados.',
     'medium',
     'No se evidencian indicadores de gestión implementados con seguimiento periódico y análisis de resultados frente a los objetivos definidos, ni acciones derivadas de los mismos.'),

    ('LAB-OG-011', '1.11',
     'El laboratorio planifica y hace seguimiento a la adquisición de dotación, equipos, capacitaciones, reactivos e insumos',
     'En la planeación anual se deben evidenciar los requerimientos de reactivos, equipos, insumos y capacitaciones para la ejecución de actividades.',
     'POA o plan de necesidades/compras anual con seguimiento a su ejecución.',
     'medium',
     'No se evidencia planificación ni seguimiento a la adquisición de dotación, equipos, capacitaciones, reactivos, estándares e insumos suficientes para las actividades misionales del laboratorio.'),

    ('LAB-OG-012', '1.12',
     'El laboratorio mantiene un control de inventario de reactivos, insumos y materiales de ensayo',
     'Solicitar procedimientos de recepción y almacenamiento de insumos, reactivos y materiales. Verificar control de inventarios y vigencia de reactivos.',
     'Control de inventario actualizado de reactivos, insumos y materiales con verificación de vigencias.',
     'simple',
     'No se evidencia control de inventario de reactivos, insumos y materiales empleados en la realización de ensayos, incluyendo la verificación de vigencias.'),

    ('LAB-OG-013', '1.13',
     'El laboratorio participa en la evaluación técnica para la compra de insumos, reactivos, materiales y equipos',
     'Verificar que los procesos de adquisición cuenten con el concepto técnico de la dirección o coordinación del laboratorio.',
     'Conceptos técnicos emitidos por el laboratorio para evaluación de proveedores (mínimo dos).',
     'simple',
     'No se evidencia la participación técnica del laboratorio en la evaluación para la compra de insumos, reactivos, materiales, servicios y equipos mediante conceptos técnicos documentados.'),

    ('LAB-OG-014', '1.14',
     'El laboratorio documenta e implementa una estrategia de mejora continua (acciones correctivas, preventivas o de mejora)',
     'Verificar procedimiento de acciones preventivas, correctivas o de mejora y seguimiento a los planes de acción.',
     'Procedimiento de mejora continua con registro de acciones y seguimiento actualizado.',
     'medium',
     'No se evidencia una estrategia documentada e implementada de mejora continua con acciones correctivas, preventivas o de mejora y seguimiento a los planes de acción correspondientes.'),

    ('LAB-OG-015', '1.15',
     'El laboratorio tiene planes de contingencia frente a emergencias sanitarias o catástrofes naturales',
     'Deben existir documentos que evidencien planes de contingencia con causas de activación, flujograma, responsables y articulación con actores involucrados.',
     'Plan de contingencia para emergencias con listado de suplentes, cadena de llamadas y laboratorios de apoyo en red.',
     'medium',
     'No se evidencian planes de contingencia interna documentados frente a emergencias sanitarias o catástrofes naturales, con designación de suplentes y flujo de actividades definido.'),

    ('LAB-OG-016', '1.16',
     'El laboratorio asegura la confidencialidad de los resultados obtenidos en el proceso analítico',
     'Verificar documentos y procedimientos que garanticen confidencialidad. Solicitar registros de confidencialidad firmados por el personal.',
     'Procedimiento de confidencialidad y registros de compromiso firmados por el personal con acceso a información.',
     'simple',
     'No se evidencian documentos, procedimientos o registros de confidencialidad que garanticen la reserva de los resultados obtenidos en el proceso analítico del laboratorio.'),

    ('LAB-OG-017', '1.17',
     'El laboratorio realiza aseguramiento de la calidad: trazabilidad metrológica para todas las pruebas',
     'Verificar fichas técnicas y certificados de análisis de reactivos, material de referencia certificado y soportes de actividades metrológicas (certificados de calibración de proveedor acreditado con ISO 17025).',
     'Certificados de materiales de referencia, fichas técnicas de reactivos y certificados de calibración vigentes.',
     'complex',
     'No se evidencia el aseguramiento de la calidad mediante trazabilidad metrológica: certificados de calibración de proveedor acreditado, fichas técnicas de reactivos ni materiales de referencia certificados.'),

    ('LAB-OG-018', '1.18',
     'El laboratorio realiza aseguramiento de la calidad: esquemas de control de calidad para validez del ensayo',
     'Verificar control de calidad interno por sección (controles internos, controles de kit, muestras caracterizadas, análisis de duplicados) y material de referencia secundario.',
     'Registros de control de calidad interno por sección con análisis de resultados.',
     'complex',
     'No se evidencian esquemas de control de calidad internos implementados para asegurar la validez de los ensayos (controles de kit, material de referencia, muestras caracterizadas, análisis de duplicados).'),

    ('LAB-OG-019', '1.19',
     'El laboratorio realiza aseguramiento de la calidad: técnicas analíticas estandarizadas, verificadas o validadas',
     'Verificar informes de estandarización (comprobación del método, verificación o validación) y que la metodología siga guías, protocolos y lineamientos vigentes definidos por laboratorios nacionales de referencia u OPS-OMS.',
     'Informes de estandarización, verificación o validación de técnicas analíticas.',
     'complex',
     'No se evidencian técnicas analíticas estandarizadas, verificadas o validadas de acuerdo a los lineamientos nacionales vigentes y los laboratorios nacionales de referencia.'),

    ('LAB-OG-020', '1.20',
     'El laboratorio realiza aseguramiento de la calidad: control de datos e integridad de la información analítica',
     'Verificar custodia de datos, transferencia contra datos primarios, verificaciones aleatorias de cálculos, control de acceso al área y lineamientos de legibilidad de registros.',
     'Estrategias documentadas de control de datos con verificaciones aleatorias y lineamientos de diligenciamiento.',
     'medium',
     'No se evidencian estrategias implementadas de control de datos que garanticen la custodia, transferencia y verificación de la información para la generación de informes de resultados.'),

    ('LAB-OG-021', '1.21',
     'El laboratorio realiza aseguramiento de la calidad: evaluación del desempeño mediante programas externos',
     'Verificar participación en programas de evaluación externa de desempeño (PICCAP u otros), inscripción, resultados y acciones tomadas ante resultados no satisfactorios.',
     'Evidencia de participación en pruebas interlaboratorio con resultados y acciones documentadas.',
     'medium',
     'No se evidencia participación en programas de evaluación externa de desempeño (PICCAP u otros) con registro de resultados y acciones documentadas ante resultados no satisfactorios.'),

    ('LAB-OG-022', '1.22',
     'El laboratorio establece directrices que garantizan la protección de la información de resultados emitidos',
     'Verificar directrices o procedimiento para transmisión y reporte de resultados escrito y por vía electrónica, con registro de reportes por vía telefónica.',
     'Procedimiento de protección de información con directrices para cada canal de comunicación de resultados.',
     'simple',
     'No se evidencian directrices o procedimientos que garanticen la protección de la información de los resultados emitidos de manera directa (impreso) o indirecta (vía electrónica o telefónica).'),

    ('LAB-OG-023', '1.23',
     'El laboratorio cuenta con procedimiento de generación, emisión, aprobación y entrega de informes de resultados',
     'Verificar que el procedimiento incluya responsabilidades para generación, emisión, aprobación y entrega de informes, así como emisión de copias de resultados.',
     'Procedimiento de informes de resultados con responsabilidades definidas y muestra de reporte estandarizado.',
     'simple',
     'No se evidencia un procedimiento documentado que defina el contenido y las responsabilidades para la generación, emisión, aprobación y entrega de los informes o reportes de resultados del laboratorio.')

  ) AS t(code, number, name, description, evidence_requirement, complexity, nc_hint)
  ON CONFLICT (code, service_id) DO NOTHING;

  -- === SECCIÓN 2: TALENTO HUMANO (11 criterios) ===
  INSERT INTO evaluation_criteria
    (code, number, name, description, evidence_requirement, complexity, standard_id, service_id, is_mandatory, is_section_header, nc_hint)
  SELECT
    t.code, t.number, t.name, t.description, t.evidence_requirement, t.complexity,
    (SELECT id FROM evaluation_standards WHERE code = 'LAB-TH' LIMIT 1),
    v_service_id, true, false, t.nc_hint
  FROM (VALUES
    ('LAB-TH-001', '2.1',
     'El laboratorio cuenta con perfiles de puestos de trabajo para el personal administrativo, técnico y profesional',
     'Verificar manual de perfiles de cargos con nivel de competencia para todas las actividades misionales. Corroborar con hojas de vida.',
     'Manual de perfiles de puestos de trabajo actualizado y hojas de vida del personal.',
     'simple',
     'No se evidencia un manual de perfiles de puestos de trabajo documentado para el personal administrativo, técnico y profesional del laboratorio con nivel de competencia definido.'),

    ('LAB-TH-002', '2.2',
     'El laboratorio cuenta con un profesional designado para coordinar y dirigir las actividades de la organización',
     'Verificar que el coordinador/director tenga formación en ciencias de la salud (Medicina o Bacteriología) con postgrado en Salud Pública, Epidemiología, Gerencia o Auditoría en Salud, y experiencia mínima de 24 meses.',
     'Hoja de vida del coordinador con títulos académicos, postgrado y certificaciones de experiencia verificados.',
     'medium',
     'No se acredita la disponibilidad de un profesional designado como coordinador o director del laboratorio con la formación académica y experiencia requerida por la normatividad vigente (Ley 841 de 2003, Decreto 1785 de 2014).'),

    ('LAB-TH-003', '2.3',
     'El personal administrativo y de apoyo está calificado con formación y experiencia apropiada al cargo',
     'Verificar hojas de vida del personal auxiliar y técnico: títulos de formación académica correspondientes a las funciones y certificaciones de experiencia no menor a un año.',
     'Hojas de vida con títulos académicos y certificaciones de experiencia del personal auxiliar y técnico.',
     'simple',
     'No se acredita personal técnico, auxiliar y administrativo calificado con la formación académica y experiencia apropiada de acuerdo al cargo desempeñado en el laboratorio.'),

    ('LAB-TH-004', '2.4',
     'El laboratorio cuenta con personal profesional técnico con formación y experiencia certificada por área de competencia',
     'Verificar que el personal profesional (bacteriólogos, biólogos, microbiólogos) certifique formación y experiencia para el área designada, cumpliendo normatividad vigente (Decreto 1785 de 2014, Ley 841 de 2003).',
     'Títulos de formación académica y certificaciones de experiencia del personal profesional técnico por área de competencia.',
     'medium',
     'No se acredita la disponibilidad de personal profesional técnico (bacteriólogos, biólogos, microbiólogos) con formación académica y experiencia certificada para las áreas de competencia del laboratorio.'),

    ('LAB-TH-005', '2.5',
     'Desde la coordinación está asignado un responsable de calidad con formación certificada en SGC',
     'Verificar existencia de persona responsable de liderar el SGC, con título profesional preferiblemente en área de salud, formación específica en norma ISO/IEC 17025, ISO 15189 o ISO 9001, y experiencia mínima de 12 meses.',
     'Hoja de vida del responsable de calidad con formación certificada en SGC y experiencia relacionada.',
     'medium',
     'No se evidencia la designación de un responsable de calidad con formación certificada en sistemas de gestión de calidad (ISO/IEC 17025, ISO 15189 o ISO 9001) y experiencia mínima relacionada de 12 meses.'),

    ('LAB-TH-006', '2.6',
     'El laboratorio tiene asignado director o responsable técnico para supervisar las operaciones de las áreas',
     'Verificar asignación de liderazgo técnico para cada unidad del laboratorio. El responsable técnico debe garantizar cumplimiento del SGC en operaciones técnicas con formación apropiada.',
     'Asignación documentada de director o responsable técnico con perfil definido en manual de calidad.',
     'medium',
     'No se evidencia la asignación de un director o responsable técnico con la formación y experiencia requerida para supervisar el cumplimiento de las actividades operativas de las áreas del laboratorio.'),

    ('LAB-TH-007', '2.7',
     'El laboratorio dispone de una persona competente encargada de liderar la gestión ambiental',
     'Verificar existencia de profesional o técnico encargado de la gestión ambiental con hoja de vida que acredite formación y experiencia mínima de un año en temas ambientales.',
     'Hoja de vida del responsable de gestión ambiental con títulos y certificaciones de experiencia en el tema.',
     'simple',
     'No se evidencia la disponibilidad de una persona con conocimiento técnico o profesional certificado en temas ambientales, encargada de liderar la gestión ambiental del laboratorio.'),

    ('LAB-TH-008', '2.8',
     'El laboratorio documenta e implementa los procesos de entrenamiento e inducción técnica para el personal',
     'Verificar procedimiento de inducción y entrenamiento técnico con responsables, tiempos asignados y evaluación de resultados para personal nuevo o que cambia de actividad.',
     'Procedimiento de inducción y entrenamiento técnico con registros de asistencia y evaluaciones aplicadas.',
     'medium',
     'No se evidencia un procedimiento documentado e implementado de inducción y entrenamiento técnico para el personal que ingresa o cambia de actividad, con definición de responsables, tiempos y evaluación de resultados.'),

    ('LAB-TH-009', '2.9',
     'El laboratorio dispone de personal de apoyo permanente para servicios generales (aseo, mantenimiento, vigilancia)',
     'Verificar presencia permanente de personal de aseo y vigilancia de instalaciones, por vinculación directa o contratación de prestación de servicios, durante los últimos 24 meses.',
     'Contratos o registros de personal de servicios generales con continuidad demostrable de 24 meses.',
     'simple',
     'No se evidencia la disponibilidad de personal de apoyo permanente para servicios generales (aseo, mantenimiento general, vigilancia) de las instalaciones del laboratorio.'),

    ('LAB-TH-010', '2.10',
     'El personal del laboratorio participa en programas de educación continuada con periodicidad mínima semestral',
     'Verificar plan de capacitaciones, seguimiento al plan y eficacia. Solicitar mínimo dos certificaciones de capacitaciones o actualizaciones en relación con lo programado.',
     'Plan de capacitaciones semestral con seguimiento, evaluación de eficacia y certificados del personal.',
     'simple',
     'No se evidencia la participación del personal del laboratorio en programas de educación continuada o capacitaciones técnicas con periodicidad mínima semestral ni el seguimiento a su eficacia.'),

    ('LAB-TH-011', '2.11',
     'El laboratorio realiza seguimiento al desempeño técnico del personal con periodicidad definida',
     'Verificar que el procedimiento de evaluación garantice idoneidad, competencia y seguimiento para las labores asignadas del personal profesional y asistencial.',
     'Herramienta de evaluación de desempeño aplicada con frecuencia definida en el procedimiento.',
     'simple',
     'No se evidencia seguimiento periódico al desempeño técnico del personal del laboratorio con evaluación de idoneidad y competencia para las labores asignadas en cada área.')

  ) AS t(code, number, name, description, evidence_requirement, complexity, nc_hint)
  ON CONFLICT (code, service_id) DO NOTHING;

  -- === SECCIÓN 3: INFRAESTRUCTURA Y DOTACIÓN (20 criterios) ===
  INSERT INTO evaluation_criteria
    (code, number, name, description, evidence_requirement, complexity, standard_id, service_id, is_mandatory, is_section_header, nc_hint)
  SELECT
    t.code, t.number, t.name, t.description, t.evidence_requirement, t.complexity,
    (SELECT id FROM evaluation_standards WHERE code = 'LAB-ID' LIMIT 1),
    v_service_id, true, false, t.nc_hint
  FROM (VALUES
    ('LAB-ID-001', '3.1',
     'La planta física del laboratorio fue construida o remodelada cumpliendo la norma de sismoresistencia vigente',
     'Solicitar constancias de autoridad competente que certifiquen construcción bajo normas de sismoresistencia (Ley 400 de 1997, NSR 2010) y documentos del Ministerio de Salud que aprueben adecuaciones.',
     'Constancias de cumplimiento de normas de sismoresistencia o documentos de aprobación del Ministerio de Salud.',
     'simple',
     'No se evidencia que la construcción o remodelación de la planta física del laboratorio cumpla con las especificaciones de sismoresistencia vigentes (Ley 400 de 1997, NSR 2010).'),

    ('LAB-ID-002', '3.2',
     'Las instalaciones del laboratorio están distribuidas por secciones identificadas con separación eficaz de áreas',
     'Verificar infraestructura física con áreas separadas y delimitadas. El área administrativa debe estar separada del área técnica. Verificar control de acceso y señalización.',
     'Distribución visible con señalización de áreas, separación administrativa/técnica y control de acceso documentado.',
     'medium',
     'No se evidencia una distribución de las instalaciones del laboratorio por secciones o áreas debidamente identificadas y separadas para evitar contaminación cruzada, con control de acceso y señalización.'),

    ('LAB-ID-003', '3.3',
     'El laboratorio cuenta con un área específica para pesaje con condiciones adecuadas de funcionamiento',
     'Visitar área de pesaje y verificar: mesones estables, libres de corrientes de aire y vibraciones, materiales no porosos de fácil limpieza y registro de control de humedad y temperatura.',
     'Área de pesaje identificada con condiciones adecuadas y registros de control ambiental.',
     'simple',
     'No se evidencia un área específica para pesaje con condiciones de funcionamiento adecuadas (mesones estables, libres de corrientes de aire y vibraciones) ni registro de control ambiental del área.'),

    ('LAB-ID-004', '3.4',
     'El laboratorio registra y controla las condiciones ambientales y mantiene iluminación adecuada en todas las secciones',
     'Verificar registros de control de temperatura y humedad de al menos dos secciones, control de desinfección de áreas en microbiología y acciones tomadas frente a resultados.',
     'Registros de temperatura y humedad por sección con análisis y acciones correctivas cuando aplique.',
     'medium',
     'No se evidencia el registro, seguimiento y control de las condiciones ambientales (temperatura, humedad) ni iluminación adecuada en las secciones del laboratorio.'),

    ('LAB-ID-005', '3.5',
     'Todas las áreas del laboratorio tienen tomas de agua y pocetas funcionales para lavado y descontaminación',
     'Verificar existencia y especificaciones técnicas de pocetas (llaves cuello de ganso, profundidad mínima 30 cm) en todas las áreas.',
     'Tomas de agua y pocetas en cada área con especificaciones técnicas requeridas.',
     'simple',
     'No se evidencia la disponibilidad de tomas de agua y pocetas funcionales con las especificaciones técnicas requeridas en todas las áreas del laboratorio que permitan el lavado y descontaminación de materiales.'),

    ('LAB-ID-006', '3.6',
     'El laboratorio cuenta con desagües adecuados con rejilla para evitar la contaminación cruzada',
     'Verificar que todos los desagües del laboratorio cuenten con rejillas durante el recorrido por las instalaciones.',
     'Desagües con rejillas en todas las áreas del laboratorio.',
     'simple',
     'No se evidencia la disponibilidad de desagües adecuados con rejilla en todas las áreas del laboratorio para evitar la contaminación cruzada.'),

    ('LAB-ID-007', '3.7',
     'El laboratorio cuenta con áreas diferenciadas para el lavado de material en las secciones que lo requieren',
     'Verificar áreas de lavado de material y desinfección en la unidad de eventos de interés en salud pública (mínimo 1) y en las secciones de análisis fisicoquímico y microbiológico de agua (mínimo 1).',
     'Áreas de lavado de material claramente identificadas y equipadas en cada sección que lo requiere.',
     'simple',
     'No se evidencian áreas diferenciadas y debidamente equipadas para el lavado de material en cada una de las secciones del laboratorio que lo requieren.'),

    ('LAB-ID-008', '3.8',
     'Las secciones y áreas técnicas cuentan con sistema mecánico de ventilación o ventanas apropiadas',
     'Verificar sistema de ventilación que introduzca aire del exterior sin recirculación. Para micobacterias: ventilación adecuada con flujo de aire direccional y ventanas cerradas permanentemente.',
     'Sistema de ventilación mecánica o ventanas con mosquiteros según las especificaciones requeridas por área.',
     'medium',
     'No se evidencia un sistema mecánico de ventilación que introduzca aire del exterior sin recirculación, ni ventanas que puedan abrirse provistas de mosquiteros, según aplique por sección del laboratorio.'),

    ('LAB-ID-009', '3.9',
     'El laboratorio tiene espacios de almacenamiento adecuados para la integridad de las muestras almacenadas',
     'Verificar ubicación de almacenamiento en unidad de eventos de salud pública y unidad de ambiente. Revisar controles de temperatura en equipos de refrigeración o congelación.',
     'Espacios de almacenamiento de muestras identificados con controles de temperatura documentados.',
     'simple',
     'No se evidencian espacios de almacenamiento en condiciones adecuadas para asegurar la integridad continua de las muestras que requieren ser almacenadas.'),

    ('LAB-ID-010', '3.10',
     'El laboratorio tiene espacios de almacenamiento adecuados para elementos, insumos y reactivos',
     'Verificar espacios para almacenamiento de insumos, reactivos y materiales con controles de temperatura donde aplique y extractores o filtros de carbón activado.',
     'Espacios de almacenamiento de insumos y reactivos con controles de temperatura y ventilación adecuada.',
     'simple',
     'No se evidencian espacios de almacenamiento en condiciones adecuadas de temperatura y seguridad para los elementos, insumos y reactivos empleados en las secciones del laboratorio.'),

    ('LAB-ID-011', '3.11',
     'El laboratorio tiene espacios de almacenamiento adecuados para documentos, registros y resultados',
     'Verificar archivo para documentos físicos y electrónicos con tamaño adecuado al volumen o complejidad del laboratorio. Inspección visual de condiciones (humedad, acceso, volumen).',
     'Archivo de documentos físicos y electrónicos en condiciones adecuadas de conservación.',
     'simple',
     'No se evidencian espacios de almacenamiento adecuados para documentos, registros y resultados tanto en medios físicos como archivos electrónicos.'),

    ('LAB-ID-012', '3.12',
     'El laboratorio garantiza el suministro continuo de servicios públicos (energía, agua, gas)',
     'Verificar suministro continuo de energía eléctrica, agua y gas natural. Indagar disponibilidad de planta eléctrica en zonas con interrupción frecuente y mantenimiento de tanques de agua.',
     'Servicios públicos continuos y planta eléctrica con registro de mantenimiento donde aplique.',
     'simple',
     'No se evidencia el suministro continuo de los servicios públicos (energía eléctrica, agua y gas) ni disponibilidad de planta eléctrica en zonas con interrupción frecuente de energía.'),

    ('LAB-ID-013', '3.13',
     'El laboratorio cuenta con dotación y equipamiento suficiente para garantizar los ensayos o pruebas autorizados',
     'Verificar presencia de equipos básicos por sección según ensayo a autorizar, volumen y frecuencia de muestras y desarrollo tecnológico de la región.',
     'Dotación y equipamiento por sección coherente con el portafolio de ensayos autorizados.',
     'complex',
     'No se evidencia la dotación y equipamiento suficiente para garantizar el cumplimiento de los ensayos o pruebas autorizados, de acuerdo al perfil epidemiológico y complejidad del laboratorio.'),

    ('LAB-ID-014', '3.14',
     'El laboratorio tiene documentadas hojas de vida de equipos con datos de identificación e historial metrológico',
     'Revisar 5-10% de hojas de vida de equipos: identificación, número de serie, fecha de recepción y puesta en servicio, ubicación, condición (nuevo/usado/comodato), manuales y operaciones de confirmación metrológica.',
     'Hojas de vida de equipos con datos completos de identificación e historial de confirmación metrológica.',
     'medium',
     'No se evidencian hojas de vida documentadas de los equipos del laboratorio con datos completos de identificación, referencia e historial de operaciones de confirmación metrológica.'),

    ('LAB-ID-015', '3.15',
     'El laboratorio cuenta con manuales de uso o procedimientos de manipulación segura de cada equipo, disponibles para el usuario',
     'Verificar que las instrucciones de uso de cada equipo estén disponibles en español, cerca del equipo y de fácil acceso. Solicitar instructivos de uno a dos equipos.',
     'Manuales de operación o instructivos de uso en español, disponibles y accesibles en el área de cada equipo.',
     'simple',
     'No se evidencian manuales de uso o procedimientos documentados de manipulación, cuidado y utilización segura de los equipos, disponibles y de fácil acceso para el personal que los maneja.'),

    ('LAB-ID-016', '3.16',
     'El laboratorio cuenta con un plan metrológico implementado para el adecuado funcionamiento de equipos',
     'Verificar existencia de plan metrológico anual con operaciones de confirmación metrológica aplicables y seguimiento realizado.',
     'Plan metrológico anual con cronograma y evidencias de ejecución de operaciones de confirmación.',
     'medium',
     'No se evidencia un plan metrológico implementado que garantice el adecuado funcionamiento de los equipos y la seguridad de las mediciones del laboratorio.'),

    ('LAB-ID-017', '3.17',
     'El laboratorio tiene implementado un plan de mantenimiento a sus instalaciones físicas',
     'Solicitar plan de mantenimiento de infraestructura y verificar registros, cronograma y ejecución de la vigencia anterior.',
     'Plan de mantenimiento de instalaciones con cronograma y registros de ejecución de la vigencia anterior.',
     'simple',
     'No se evidencia un plan de mantenimiento implementado para las instalaciones físicas del laboratorio, con cronograma y registros de ejecución verificables.'),

    ('LAB-ID-018', '3.18',
     'El laboratorio tiene sistemas de comunicación e informática que garantizan conectividad interna y externa',
     'Verificar red telefónica funcionando (interna entre secciones y coordinación, y externa) y acceso continuo a internet.',
     'Red telefónica con extensiones internas entre secciones y acceso continuo a internet verificable.',
     'simple',
     'No se evidencia un sistema de comunicación, informática y conectividad que garantice la comunicación interna y externa del laboratorio con acceso continuo a internet.'),

    ('LAB-ID-019', '3.19',
     'El laboratorio cuenta con programas periódicos de mantenimiento, actualización y protección de software',
     'Revisar registros y fechas de programación y realización de mantenimiento de software de todos los equipos, al menos una vez al año.',
     'Registros de mantenimiento, actualización y protección de software con fechas de ejecución.',
     'simple',
     'No se evidencia un programa de mantenimiento, actualización y protección periódica de software de los equipos y sistemas del laboratorio.'),

    ('LAB-ID-020', '3.20',
     'El laboratorio mantiene copias de seguridad de la información y controla los niveles de acceso del personal',
     'Verificar existencia de copias de seguridad de información recolectada, recibida o emitida (medios físicos o magnéticos) y esquemas de protección y acceso a la información electrónica.',
     'Copias de seguridad periódicas de información y esquema de control de acceso documentado.',
     'medium',
     'No se evidencia la existencia de copias de seguridad de la información generada ni esquemas de protección y control de acceso a la información electrónica del laboratorio.')

  ) AS t(code, number, name, description, evidence_requirement, complexity, nc_hint)
  ON CONFLICT (code, service_id) DO NOTHING;

  -- === SECCIÓN 4: REFERENCIA Y CONTRAREFERENCIA (4 criterios) ===
  INSERT INTO evaluation_criteria
    (code, number, name, description, evidence_requirement, complexity, standard_id, service_id, is_mandatory, is_section_header, nc_hint)
  SELECT
    t.code, t.number, t.name, t.description, t.evidence_requirement, t.complexity,
    (SELECT id FROM evaluation_standards WHERE code = 'LAB-RC' LIMIT 1),
    v_service_id, true, false, t.nc_hint
  FROM (VALUES
    ('LAB-RC-001', '4.1',
     'El laboratorio documenta e implementa los procedimientos de recepción, manipulación, remisión y transporte de muestras',
     'Verificar procedimiento de recepción, manejo y transporte de muestras; procedimiento de envío o remisión; procedimiento de toma y transporte de muestras de agua; y tiempos de entrega de resultados.',
     'Manuales y procedimientos documentados de recepción, manipulación, remisión y transporte de muestras con tiempos de entrega definidos.',
     'medium',
     'No se evidencia documentación implementada de los procesos y procedimientos de recepción, manipulación, remisión, transporte y conservación de muestras con tiempos de entrega de resultados definidos.'),

    ('LAB-RC-002', '4.2',
     'El laboratorio tiene documentado e implementado el proceso de referencia y contrareferencia',
     'Verificar documento de referencia y contrareferencia: ensayos que remite a otros laboratorios, registro de ensayos remitidos, revisión de solicitudes y condiciones de remisión de muestras.',
     'Procedimiento de referencia y contrareferencia con contratos y registros de ensayos remitidos.',
     'medium',
     'No se evidencia un proceso documentado e implementado de referencia y contrareferencia acorde con la capacidad técnica del laboratorio, que incluya ensayos remitidos, reportes y condiciones de remisión de muestras.'),

    ('LAB-RC-003', '4.3',
     'Desde la coordinación se asegura que el personal involucrado conoce los procedimientos de referencia y contrareferencia',
     'Solicitar listado de asistencia a capacitaciones del personal en procedimientos de referencia y contrareferencia para eventos de interés en salud pública, en el último año.',
     'Registros de capacitación del personal en procedimientos de referencia y contrareferencia del último año.',
     'simple',
     'No se evidencia que el personal involucrado en referencia y contrareferencia conoce y está capacitado en los procedimientos y lineamientos establecidos para los eventos de interés en salud pública.'),

    ('LAB-RC-004', '4.4',
     'El laboratorio tiene establecidos procedimientos para la verificación de la trazabilidad de las muestras',
     'Verificar: registros de recepción, instrucciones de codificación y etiquetado, registros de ingreso y análisis, condiciones de almacenamiento, informe de resultados y disposición final de muestras.',
     'Procedimiento de trazabilidad con registros desde la recepción hasta la disposición final de muestras.',
     'medium',
     'No se evidencia un procedimiento implementado para la verificación de la trazabilidad de las muestras desde su recepción e identificación hasta la generación del informe de resultados.')

  ) AS t(code, number, name, description, evidence_requirement, complexity, nc_hint)
  ON CONFLICT (code, service_id) DO NOTHING;

  -- === SECCIÓN 5: BIOSEGURIDAD Y MANEJO DE RESIDUOS (17 criterios) ===
  INSERT INTO evaluation_criteria
    (code, number, name, description, evidence_requirement, complexity, standard_id, service_id, is_mandatory, is_section_header, nc_hint)
  SELECT
    t.code, t.number, t.name, t.description, t.evidence_requirement, t.complexity,
    (SELECT id FROM evaluation_standards WHERE code = 'LAB-BIO' LIMIT 1),
    v_service_id, true, false, t.nc_hint
  FROM (VALUES
    ('LAB-BIO-001', '5.1',
     'El laboratorio cuenta con un manual o procedimiento de bioseguridad aprobado, implementado y divulgado',
     'Verificar existencia y contenido del manual de bioseguridad en lo referente a muestras procesadas y su disponibilidad para todo el personal. Solicitar lista de asistencia de socialización de la versión vigente.',
     'Manual de bioseguridad aprobado, disponible para el personal y con registros de socialización de la versión vigente.',
     'medium',
     'No se evidencia un manual o procedimiento de bioseguridad aprobado, implementado y divulgado al personal del laboratorio con registros de socialización de la versión vigente.'),

    ('LAB-BIO-002', '5.2',
     'El manual de bioseguridad describe el tipo de muestras manipuladas y clasifica el nivel de riesgo biológico',
     'Verificar que el contenido del manual de bioseguridad clasifica al laboratorio según el nivel de riesgo biológico asociado a las muestras que manipula.',
     'Manual de bioseguridad con clasificación del nivel de riesgo biológico de las muestras procesadas en el laboratorio.',
     'simple',
     'No se evidencia que el manual de bioseguridad describe el tipo de muestras que se manipulan en el laboratorio y clasifica el nivel de riesgo biológico asociado.'),

    ('LAB-BIO-003', '5.3',
     'El personal del laboratorio usa los elementos de protección primaria de acuerdo al nivel de riesgo de los agentes manejados',
     'Observar uso de tapabocas, gorro, guantes, mascarillas, batas blancas y desechables, calzado cerrado en las áreas que aplique. Verificar uso de teléfonos móviles en micobacterias.',
     'Observación directa del uso de elementos de protección personal en todas las áreas del laboratorio.',
     'simple',
     'No se evidencia el uso de los elementos de protección primaria (tapabocas, guantes, bata, mascarilla, calzado cerrado) por parte del personal en las áreas donde aplica, de acuerdo al nivel de riesgo biológico.'),

    ('LAB-BIO-004', '5.4',
     'El laboratorio cuenta con cabinas de bioseguridad para el manejo y procesamiento de muestras infecciosas',
     'Verificar uso de cabinas de bioseguridad para muestras infecciosas, requerido para microbiológico de aguas y micobacterias (mínimo clase A2). Verificar operaciones de confirmación metrológica definidas.',
     'Cabinas de bioseguridad disponibles y operativas con operaciones de confirmación metrológica verificadas.',
     'medium',
     'No se evidencia la disponibilidad de cabinas de bioseguridad para el manejo y procesamiento de muestras infecciosas, con las operaciones de confirmación metrológica definidas y vigentes.'),

    ('LAB-BIO-005', '5.5',
     'El laboratorio tiene un plan documentado para la gestión integral de residuos de acuerdo a la normatividad vigente',
     'Solicitar plan de gestión integral de residuos y verificar que describa los procedimientos implementados (Decreto 351 de 2014, Resolución 1164 de 2002, Decreto Único 1076 de 2015).',
     'Plan de gestión integral de residuos actualizado según normatividad vigente con caracterización por sección.',
     'complex',
     'No se evidencia un plan documentado e implementado para la gestión integral de residuos generados en el laboratorio, de acuerdo al Decreto 351 de 2014 y la normatividad ambiental vigente.'),

    ('LAB-BIO-006', '5.6',
     'El laboratorio cumple con las especificaciones técnicas de los recipientes para la recolección de residuos',
     'Verificar presencia de recipientes adecuados y suficientes para la segregación de residuos en las secciones: guardianes, bolsas plásticas y canecas rotuladas con pictogramas según tipo de residuo.',
     'Recipientes adecuados por dimensión, tipo y resistencia con rotulado correcto en cada área del laboratorio.',
     'simple',
     'No se evidencia la disponibilidad de recipientes adecuados y suficientes (guardianes, bolsas, canecas) para la segregación de residuos por tipo en las secciones del laboratorio.'),

    ('LAB-BIO-007', '5.7',
     'El laboratorio adopta el código de colores para residuos y realiza correcta separación de los mismos',
     'Durante el recorrido, inspeccionar que las canecas estén dotadas con bolsas del color correcto y que su contenido corresponda al tipo de residuo.',
     'Código de colores correctamente aplicado en todos los recipientes con separación correcta de residuos por sección.',
     'simple',
     'No se evidencia la aplicación del código de colores para los recipientes de recolección de residuos con la correcta separación según el tipo de residuo generado en cada sección.'),

    ('LAB-BIO-008', '5.8',
     'El laboratorio realiza tratamiento y disposición final de residuos peligrosos con gestores externos autorizados',
     'Solicitar copia de licencia del gestor ambiental externo vigente, copia del contrato o convenio vigente y anterior, y registro de visita de verificación al gestor externo (mínimo 1 vez al año).',
     'Contrato vigente con gestor ambiental autorizado, licencia vigente y actas de disposición final de residuos.',
     'medium',
     'No se evidencia contrato o convenio vigente con gestor ambiental externo autorizado por la autoridad ambiental competente para el tratamiento y disposición final de residuos peligrosos.'),

    ('LAB-BIO-009', '5.9',
     'El laboratorio realiza pre-tratamiento in situ de los residuos como medida de bioseguridad',
     'Verificar procedimientos de desactivación in situ de residuos, incluyendo el tema de desactivación para áreas de micobacterias. Verificar que coincidan con el plan de gestión de residuos.',
     'Procedimiento de pre-tratamiento o desactivación in situ documentado e implementado, actualizado según normatividad.',
     'medium',
     'No se evidencia la implementación de procedimientos de pre-tratamiento in situ (desactivación) de residuos como medida de bioseguridad o principio de precaución, acorde a la normatividad vigente.'),

    ('LAB-BIO-010', '5.10',
     'El laboratorio establece e implementa la ruta sanitaria interna de recolección de residuos',
     'Durante el recorrido, verificar cumplimiento del esquema de ruta sanitaria con horarios, frecuencias, mecanismos de transporte de residuos, responsables y uso de EPP.',
     'Ruta sanitaria documentada con plano, horarios, frecuencias, responsables y dotación mínima (carro transportador con ruedas y tapa).',
     'medium',
     'No se evidencia una ruta sanitaria interna documentada e implementada para la recolección de residuos peligrosos y no peligrosos, con horarios, frecuencias y responsables claramente definidos.'),

    ('LAB-BIO-011', '5.11',
     'El laboratorio tiene un cuarto central de acopio para almacenamiento de residuos con dotación mínima requerida',
     'Visitar el cuarto de almacenamiento verificando: ubicación, dotación (báscula, espacios por clase de residuos), condiciones estructurales y sanitarias, acceso para vehículo recolector.',
     'Cuarto de acopio de residuos con dotación mínima exigida por la Resolución 1164 de 2002.',
     'medium',
     'No se evidencia la disponibilidad de un cuarto central de acopio para el almacenamiento de residuos que cumpla con la dotación mínima exigida por la normatividad vigente.'),

    ('LAB-BIO-012', '5.12',
     'El laboratorio cumple con el etiquetado correcto de residuos para entrega a gestores externos',
     'Verificar en el cuarto de almacenamiento que todos los residuos estén etiquetados con: tipo de residuo, lugar de origen, fecha de recolección y responsable del procedimiento.',
     'Residuos correctamente etiquetados en el cuarto de almacenamiento con todos los datos requeridos.',
     'simple',
     'No se evidencia el etiquetado correcto de los residuos para ser entregados a los gestores externos, con indicación de tipo de residuo, lugar de origen, fecha de recolección y responsable.'),

    ('LAB-BIO-013', '5.13',
     'El laboratorio diligencia los registros de cuantificación de residuos (RH1) de acuerdo a la normatividad',
     'Revisar carpeta con registros RH1 verificando cuantificación de residuos peligrosos y no peligrosos, que la sumatoria mensual coincida con lo entregado al gestor externo y las actas de disposición final.',
     'Registros RH1 actualizados con cuantificación coherente con las actas de disposición del gestor externo.',
     'simple',
     'No se evidencia el diligenciamiento de los registros de cuantificación de residuos (RH1) de acuerdo a lo establecido en la Resolución 1164 de 2002.'),

    ('LAB-BIO-014', '5.14',
     'El laboratorio cuenta con los registros o permisos de vertimientos y emisiones atmosféricas vigentes',
     'Indagar por permiso de vertimientos y caracterización de aguas residuales (Resolución 631 de 2015), y permisos de emisiones atmosféricas si el laboratorio posee fuentes fijas de emisión de gases.',
     'Permisos de vertimientos y emisiones atmosféricas vigentes emitidos por la autoridad ambiental competente.',
     'medium',
     'No se evidencian los registros o permisos de vertimientos y emisiones atmosféricas vigentes emitidos por la autoridad ambiental competente, de acuerdo al Decreto 1076 de 2015.'),

    ('LAB-BIO-015', '5.15',
     'El laboratorio cuenta con plan de contingencias para el manejo de residuos ante eventualidades',
     'Verificar plan de contingencia acorde a actividades del laboratorio con posibles eventualidades identificadas (falta de contrato para recolección, falta de personal, falta de bolsas).',
     'Plan de contingencias para residuos documentado con eventualidades identificadas y procedimientos de respuesta.',
     'medium',
     'No se evidencia un plan de contingencias documentado para el manejo de residuos ante accidentes o eventualidades, acorde a la normatividad vigente (Decreto 1076 de 2015, Art. 2.2.6.1.3.1).'),

    ('LAB-BIO-016', '5.16',
     'Las instalaciones del laboratorio disponen de duchas, lavamanos y lavaojos funcionales y accesibles',
     'Verificar presencia de lavaojos y ducha de emergencia de fácil acceso, mantenimiento y funcionamiento (nivel de bioseguridad 2 según OMS). Verificar registro de prueba de uso.',
     'Ducha de emergencia y lavaojos funcionales, de fácil acceso y con registro de prueba de uso.',
     'medium',
     'No se evidencia la disponibilidad de duchas de emergencia, lavamanos y lavaojos funcionales y de fácil acceso para el personal del laboratorio, según el nivel de bioseguridad 2 requerido.'),

    ('LAB-BIO-017', '5.17',
     'El laboratorio cuenta con medios de protección contra incendios vigentes y el personal sabe usarlos',
     'Verificar extintores con fecha de vencimiento vigente, tipo apropiado al nivel de riesgo del área y evidencia de capacitación de todo el personal en manejo de extintores.',
     'Extintores vigentes y apropiados por tipo de riesgo, con registros de capacitación de todo el personal.',
     'simple',
     'No se evidencia la disponibilidad de medios de protección contra incendios (extintores vigentes y apropiados) ni evidencia de capacitación del personal en su uso y manejo.')

  ) AS t(code, number, name, description, evidence_requirement, complexity, nc_hint)
  ON CONFLICT (code, service_id) DO NOTHING;

  -- === SECCIÓN 6: PROCESO PRIORITARIO (9 criterios) ===
  INSERT INTO evaluation_criteria
    (code, number, name, description, evidence_requirement, complexity, standard_id, service_id, is_mandatory, is_section_header, nc_hint)
  SELECT
    t.code, t.number, t.name, t.description, t.evidence_requirement, t.complexity,
    (SELECT id FROM evaluation_standards WHERE code = 'LAB-PP' LIMIT 1),
    v_service_id, true, false, t.nc_hint
  FROM (VALUES
    ('LAB-PP-001', '6.1',
     'El personal del laboratorio conoce sus funciones dentro de la Red Nacional de Laboratorios',
     'Verificar registros de capacitación en competencias frente a la normatividad vigente: Decreto 780 de 2015 (contiene Decretos 3518 y 2323 de 2006) y Resolución 1619 de 2015. Verificar asistencia a socializaciones del LSP-SSD.',
     'Registros de capacitación del personal en normatividad de la Red Nacional de Laboratorios (Decreto 780 de 2015, Resolución 1619 de 2015).',
     'simple',
     'No se evidencia que el personal del laboratorio conoce sus funciones dentro de la Red Nacional de Laboratorios según el Decreto 780 de 2015 y la Resolución 1619 de 2015.'),

    ('LAB-PP-002', '6.2',
     'El laboratorio conoce e implementa los lineamientos nacionales vigentes para eventos de interés en salud pública',
     'Verificar registros de socialización o capacitación de lineamientos nacionales vigentes: protocolos de vigilancia, guías de laboratorios, circulares, lineamientos y documentos técnicos aplicables al alcance de autorización.',
     'Registros de capacitación en lineamientos nacionales vigentes de EISP aplicables al alcance de autorización del laboratorio.',
     'medium',
     'No se evidencia que el laboratorio conoce e implementa los lineamientos nacionales vigentes para el abordaje adecuado de los eventos de interés en salud pública según su alcance de autorización.'),

    ('LAB-PP-003', '6.3',
     'El laboratorio participa en estudios de vigilancia epidemiológica del nivel territorial o nacional',
     'Indagar si el laboratorio participa en estudios de vigilancia centinela del último año. Verificar nivel de participación (envío de muestras, realización de pruebas, confirmación), protocolos y resultados.',
     'Protocolos de vigilancia centinela y evidencia de participación con informes de resultados del último año.',
     'medium',
     'No se evidencia la participación del laboratorio en estudios de vigilancia epidemiológica planteados por el nivel territorial o nacional, de acuerdo a las prioridades en salud pública.'),

    ('LAB-PP-004', '6.4',
     'El laboratorio notifica oportunamente resultados al grupo de vigilancia o autoridad competente',
     'Verificar registro de notificación periódica y sistemática hacia responsables de vigilancia de EISP y Vigilancia y Control Sanitario. Verificar evidencia de recepción por parte de la Dirección Territorial de Salud.',
     'Registros de notificación oportuna de resultados al grupo de vigilancia con evidencia de recepción por la DTS.',
     'medium',
     'No se evidencia notificación oportuna de información o resultados hacia el grupo de vigilancia o autoridad competente dentro de los flujos de información del sistema de vigilancia en salud pública.'),

    ('LAB-PP-005', '6.5',
     'El laboratorio gestiona y participa en proyectos de investigación en temas de salud pública',
     'Revisar soportes de generación de propuestas o participación en proyectos de investigación relacionados con EISP y vigilancia y control sanitario.',
     'Soportes de participación o generación de propuestas en proyectos de investigación en temas de salud pública.',
     'simple',
     'No se evidencia la participación o gestión del laboratorio en proyectos de investigación relacionados con eventos de interés en salud pública.'),

    ('LAB-PP-006', '6.6',
     'El laboratorio participa en pruebas de Evaluación Externa Directa e Indirecta del Desempeño (EEDD/EEID)',
     'Verificar registros de participación en EEDD y EEID con el LSP-SSD u otras entidades, incluyendo resultados de evaluaciones y medidas tomadas ante resultados no satisfactorios.',
     'Registros de participación en EEDD/EEID con resultados e informes de acciones tomadas ante desempeño no satisfactorio.',
     'medium',
     'No se evidencia la participación del laboratorio en las pruebas de Evaluación Externa Directa e Indirecta del Desempeño (EEDD/EEID) con análisis de resultados y acciones documentadas.'),

    ('LAB-PP-007', '6.7',
     'El laboratorio participa en las capacitaciones y talleres programados por el LSP-SSD en temas de salud pública',
     'Verificar programación anual de capacitaciones del LSP-SSD y la correspondiente participación del laboratorio. Solicitar listados de asistencia y certificados del personal.',
     'Listados de asistencia y certificados de participación en capacitaciones y talleres programados por el LSP-SSD.',
     'simple',
     'No se evidencia la participación del personal del laboratorio en las capacitaciones y talleres en temas de interés en salud pública programados por el LSP-SSD.'),

    ('LAB-PP-008', '6.8',
     'El laboratorio realiza reactivo-vigilancia de acuerdo a la normatividad vigente y reporta sus hallazgos',
     'Verificar registros de reporte de información sobre efectos indeseados no descritos o desconocidos relacionados con el uso de reactivos de diagnóstico in vitro.',
     'Registros de reporte de reactivo-vigilancia con hallazgos de efectos indeseados de reactivos de diagnóstico in vitro.',
     'medium',
     'No se evidencia la realización de reactivo-vigilancia de acuerdo a la normatividad vigente, ni el reporte de hallazgos sobre efectos indeseados de reactivos de diagnóstico in vitro.'),

    ('LAB-PP-009', '6.9',
     'El laboratorio participa de la asistencia técnica y asesoría directa brindada por el LSP-SSD',
     'Verificar informes de asesorías o asistencias técnicas realizadas por la Entidad Territorial de Salud o el LSP. Solicitar listados de asistencia.',
     'Informes de asesorías y listados de asistencia a actividades de asistencia técnica del LSP-SSD.',
     'simple',
     'No se evidencia la participación del laboratorio en las asesorías o asistencias técnicas brindadas por el Laboratorio de Salud Pública - Subdirección de Salud (LSP-SSD) según la programación establecida.')

  ) AS t(code, number, name, description, evidence_requirement, complexity, nc_hint)
  ON CONFLICT (code, service_id) DO NOTHING;

  -- -------------------------------------------------------
  -- 4. CUESTIONARIO
  -- -------------------------------------------------------
  INSERT INTO questionnaires (id, name, service_id, version_type, status, total_criteria, created_by, published_at)
  VALUES (
    v_q_id,
    'Herramienta de Verificación Laboratorios Clínicos - Res. 1619 de 2015',
    v_service_id,
    'initial',
    'published',
    84,
    v_admin_id,
    NOW()
  )
  ON CONFLICT (service_id, version_type) WHERE service_id IS NOT NULL DO NOTHING;

  -- Asegurar que se obtuvo el ID del cuestionario (puede ya existir)
  IF NOT EXISTS (SELECT 1 FROM questionnaires WHERE id = v_q_id) THEN
    SELECT id INTO v_q_id FROM questionnaires WHERE service_id = v_service_id AND version_type = 'initial';
  END IF;

  -- -------------------------------------------------------
  -- 5. QUESTIONNAIRE_CRITERIA (vincular todos los criterios)
  -- -------------------------------------------------------
  INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
  SELECT v_q_id, ec.id
  FROM evaluation_criteria ec
  WHERE ec.service_id = v_service_id
    AND ec.is_section_header = false
  ON CONFLICT (questionnaire_id, criterion_id) DO NOTHING;

  -- Actualizar total_criteria real
  UPDATE questionnaires
  SET total_criteria = (
    SELECT COUNT(*) FROM questionnaire_criteria WHERE questionnaire_id = v_q_id
  )
  WHERE id = v_q_id;

  RAISE NOTICE 'Migración LAB-CAL completada: 6 estándares y 84 criterios creados (Res. 1619 de 2015).';

END $$;

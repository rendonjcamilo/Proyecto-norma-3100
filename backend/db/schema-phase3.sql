-- Phase 3: Core Compliance Workflows - Database Schema Extensions
-- PostgreSQL 14+
-- Adds assessment, questionnaire, and enhanced finding/action tables

-- ============================================================
-- ASSESSMENT & QUESTIONNAIRE TABLES
-- ============================================================

-- Moved to evaluation-schema.sql
-- (questionnaires table removed to avoid conflict with evaluation-schema.sql definition)

-- Questionnaire Sections
CREATE TABLE IF NOT EXISTS questionnaire_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    questionnaire_id UUID NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,

    title VARCHAR(255) NOT NULL,
    description TEXT,
    section_order INT NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Questions
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES questionnaire_sections(id) ON DELETE CASCADE,

    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('checkbox', 'radio', 'text', 'scale')),
    question_order INT NOT NULL,

    is_required BOOLEAN DEFAULT FALSE,
    conditional_on UUID REFERENCES questions(id) ON DELETE SET NULL,
    conditional_value VARCHAR(255),

    risk_weight INT DEFAULT 1,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Question Options (for radio/checkbox questions)
CREATE TABLE IF NOT EXISTS question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

    option_text VARCHAR(255) NOT NULL,
    option_value VARCHAR(100) NOT NULL,
    option_order INT NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assessments (assigned to providers)
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    questionnaire_id UUID NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,

    version INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed', 'closed')),

    assigned_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deadline TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,

    risk_score INT DEFAULT 0,
    compliance_pct DECIMAL(5,2) DEFAULT 0.00,

    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assessment Responses
CREATE TABLE IF NOT EXISTS assessment_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

    response_value TEXT,
    response_type VARCHAR(50),

    answered_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    answered_by UUID REFERENCES users(id) ON DELETE SET NULL,

    UNIQUE(assessment_id, question_id)
);

-- ============================================================
-- ENHANCED FINDINGS & CORRECTIVE ACTIONS
-- ============================================================

-- Add missing columns to findings (if not present)
-- NOTE: These are already in schema.sql but we enhance them here

-- Finding Categories
CREATE TABLE IF NOT EXISTS finding_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO finding_categories (name, description) VALUES
  ('Calidad', 'Procesos de QA, estándares de documentación'),
  ('Infraestructura', 'Instalaciones, equipos, controles ambientales'),
  ('Personal', 'Entrenamiento, competencia, certificación'),
  ('Gestión', 'Gobernanza, políticas, procedimientos'),
  ('Seguridad', 'Prevención de incidentes, protocolos de emergencia'),
  ('Otro', 'Otras áreas de cumplimiento')
ON CONFLICT DO NOTHING;

-- Enhanced Findings with Category
ALTER TABLE findings
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES finding_categories(id),
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id),
  ADD COLUMN IF NOT EXISTS hallazgo_description TEXT,
  ADD COLUMN IF NOT EXISTS evidence_documents JSONB DEFAULT '{}';

-- Finding Status History
CREATE TABLE IF NOT EXISTS finding_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,

    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced Corrective Actions with proper state machine
CREATE TABLE IF NOT EXISTS action_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID NOT NULL REFERENCES corrective_actions(id) ON DELETE CASCADE,

    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Action Evidence Files
CREATE TABLE IF NOT EXISTS action_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID NOT NULL REFERENCES corrective_actions(id) ON DELETE CASCADE,

    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(50),
    content_hash VARCHAR(64),

    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Action Comments (internal only)
CREATE TABLE IF NOT EXISTS action_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID NOT NULL REFERENCES corrective_actions(id) ON DELETE CASCADE,

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mentions JSONB DEFAULT '[]',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Escalation Alerts
CREATE TABLE IF NOT EXISTS escalation_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    action_id UUID REFERENCES corrective_actions(id) ON DELETE CASCADE,
    finding_id UUID REFERENCES findings(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,

    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('deadline_warning', 'overdue', 'critical')),
    days_offset INT NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    triggered_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,

    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- SERVICE CATALOG ENHANCEMENTS
-- ============================================================

-- Seed Service Categories if not already present
INSERT INTO services (code, name, category, description, status) VALUES
  -- Consulta Externa (33 services)
  ('CX-001', 'Consulta por medicina general', 'Consulta Externa', 'Primera consulta de medicina general', 'available'),
  ('CX-002', 'Consulta de seguimiento medicina general', 'Consulta Externa', 'Consulta subsecuente', 'available'),
  ('CX-003', 'Consulta especializada cardiología', 'Consulta Externa', 'Evaluación cardiológica', 'available'),
  ('CX-004', 'Consulta especializada pediatría', 'Consulta Externa', 'Evaluación pediátrica', 'available'),
  ('CX-005', 'Consulta especializada ginecología', 'Consulta Externa', 'Evaluación ginecológica', 'available'),
  ('CX-006', 'Consulta especializada psicología', 'Consulta Externa', 'Evaluación psicológica', 'available'),
  ('CX-007', 'Consulta especializada ortopedia', 'Consulta Externa', 'Evaluación ortopédica', 'available'),
  ('CX-008', 'Consulta especializada gastroenterología', 'Consulta Externa', 'Evaluación gastroenterológica', 'available'),
  ('CX-009', 'Consulta especializada neumología', 'Consulta Externa', 'Evaluación neumológica', 'available'),
  ('CX-010', 'Consulta especializada otorrinolaringología', 'Consulta Externa', 'Evaluación otorrinolaringológica', 'available'),
  ('CX-011', 'Consulta especializada dermatología', 'Consulta Externa', 'Evaluación dermatológica', 'available'),
  ('CX-012', 'Consulta especializada oftalmología', 'Consulta Externa', 'Evaluación oftalmológica', 'available'),
  ('CX-013', 'Consulta especializada urología', 'Consulta Externa', 'Evaluación urológica', 'available'),
  ('CX-014', 'Consulta especializada endocrinología', 'Consulta Externa', 'Evaluación endocrinológica', 'available'),
  ('CX-015', 'Consulta especializada reumatología', 'Consulta Externa', 'Evaluación reumatológica', 'available'),
  ('CX-016', 'Consulta especializada neurología', 'Consulta Externa', 'Evaluación neurológica', 'available'),
  ('CX-017', 'Consulta especializada nefrología', 'Consulta Externa', 'Evaluación nefrológica', 'available'),
  ('CX-018', 'Consulta especializada oncología', 'Consulta Externa', 'Evaluación oncológica', 'available'),
  ('CX-019', 'Consulta especializada hematología', 'Consulta Externa', 'Evaluación hematológica', 'available'),
  ('CX-020', 'Consulta especializada traumatología', 'Consulta Externa', 'Evaluación traumatológica', 'available'),
  ('CX-021', 'Consulta especializada infectología', 'Consulta Externa', 'Evaluación infecciológica', 'available'),
  ('CX-022', 'Consulta especializada anestesiología', 'Consulta Externa', 'Evaluación anestesiológica', 'available'),
  ('CX-023', 'Consulta especializada medicina interna', 'Consulta Externa', 'Evaluación de medicina interna', 'available'),
  ('CX-024', 'Valoración nutricional', 'Consulta Externa', 'Evaluación nutricional', 'available'),
  ('CX-025', 'Terapia física', 'Consulta Externa', 'Sesión de fisioterapia', 'available'),
  ('CX-026', 'Terapia ocupacional', 'Consulta Externa', 'Sesión de terapia ocupacional', 'available'),
  ('CX-027', 'Fonoaudiología', 'Consulta Externa', 'Sesión de fonoaudiología', 'available'),
  ('CX-028', 'Odontología preventiva', 'Consulta Externa', 'Evaluación y limpieza dental', 'available'),
  ('CX-029', 'Enfermería especializada', 'Consulta Externa', 'Consulta de enfermería especializada', 'available'),
  ('CX-030', 'Consulta de promoción y prevención', 'Consulta Externa', 'Actividades de promoción y prevención', 'available'),
  ('CX-031', 'Asesoría farmacéutica', 'Consulta Externa', 'Consulta farmacéutica', 'available'),
  ('CX-032', 'Orientación pre-quirúrgica', 'Consulta Externa', 'Preparación pre-operatoria', 'available'),
  ('CX-033', 'Orientación post-quirúrgica', 'Consulta Externa', 'Seguimiento post-operatorio', 'available'),

  -- Apoyo Diagnóstico (28 services)
  ('AD-001', 'Radiografía simple', 'Apoyo Diagnóstico', 'Radiografía convencional', 'available'),
  ('AD-002', 'Radiografía contrastada', 'Apoyo Diagnóstico', 'Radiografía con contraste', 'available'),
  ('AD-003', 'Tomografía computarizada', 'Apoyo Diagnóstico', 'Tomografía computarizada', 'available'),
  ('AD-004', 'Resonancia magnética', 'Apoyo Diagnóstico', 'Resonancia magnética nuclear', 'available'),
  ('AD-005', 'Ecografía', 'Apoyo Diagnóstico', 'Ultrasonido diagnóstico', 'available'),
  ('AD-006', 'Ecocardiografía', 'Apoyo Diagnóstico', 'Ultrasonido cardíaco', 'available'),
  ('AD-007', 'Mamografía', 'Apoyo Diagnóstico', 'Mamografía digital', 'available'),
  ('AD-008', 'Endoscopia digestiva', 'Apoyo Diagnóstico', 'Endoscopia del tracto digestivo', 'available'),
  ('AD-009', 'Colonoscopia', 'Apoyo Diagnóstico', 'Colonoscopia', 'available'),
  ('AD-010', 'Broncoscopia', 'Apoyo Diagnóstico', 'Broncoscopia', 'available'),
  ('AD-011', 'Laparoscopia', 'Apoyo Diagnóstico', 'Laparoscopia diagnóstica', 'available'),
  ('AD-012', 'Cisteroscopia', 'Apoyo Diagnóstico', 'Cisteroscopia', 'available'),
  ('AD-013', 'Laboratorio clínico', 'Apoyo Diagnóstico', 'Análisis de laboratorio', 'available'),
  ('AD-014', 'Hemograma', 'Apoyo Diagnóstico', 'Cuadro hemático completo', 'available'),
  ('AD-015', 'Química sanguínea', 'Apoyo Diagnóstico', 'Análisis químico de sangre', 'available'),
  ('AD-016', 'Serologías', 'Apoyo Diagnóstico', 'Pruebas serológicas', 'available'),
  ('AD-017', 'Cultivos y antibiogramas', 'Apoyo Diagnóstico', 'Cultivos microbiológicos', 'available'),
  ('AD-018', 'Uroanálisis', 'Apoyo Diagnóstico', 'Análisis de orina', 'available'),
  ('AD-019', 'Análisis de heces', 'Apoyo Diagnóstico', 'Coproscopia', 'available'),
  ('AD-020', 'Pruebas de función hepática', 'Apoyo Diagnóstico', 'Pruebas hepáticas', 'available'),
  ('AD-021', 'Pruebas de función renal', 'Apoyo Diagnóstico', 'Pruebas renales', 'available'),
  ('AD-022', 'Electrocardiograma', 'Apoyo Diagnóstico', 'ECG', 'available'),
  ('AD-023', 'Holter', 'Apoyo Diagnóstico', 'Monitoreo de ECG 24h', 'available'),
  ('AD-024', 'Prueba de esfuerzo', 'Apoyo Diagnóstico', 'Prueba cardiopulmonar de esfuerzo', 'available'),
  ('AD-025', 'Electroencefalograma', 'Apoyo Diagnóstico', 'EEG', 'available'),
  ('AD-026', 'Espirometría', 'Apoyo Diagnóstico', 'Prueba de función pulmonar', 'available'),
  ('AD-027', 'Patología clínica', 'Apoyo Diagnóstico', 'Análisis de biopsias', 'available'),
  ('AD-028', 'Banco de sangre', 'Apoyo Diagnóstico', 'Servicios de transfusión', 'available'),

  -- Internación (34 services)
  ('INT-001', 'Hospitalización medicina general', 'Internación', 'Cama de hospitalización medicina general', 'available'),
  ('INT-002', 'Hospitalización pediatría', 'Internación', 'Cama de hospitalización pediatría', 'available'),
  ('INT-003', 'Hospitalización cardiología', 'Internación', 'Cama de cardiología', 'available'),
  ('INT-004', 'Hospitalización ginecología', 'Internación', 'Cama de ginecología', 'available'),
  ('INT-005', 'Hospitalización neumología', 'Internación', 'Cama de neumología', 'available'),
  ('INT-006', 'Hospitalización gastroenterología', 'Internación', 'Cama de gastroenterología', 'available'),
  ('INT-007', 'Hospitalización neurología', 'Internación', 'Cama de neurología', 'available'),
  ('INT-008', 'Hospitalización ortopedia', 'Internación', 'Cama de ortopedia', 'available'),
  ('INT-009', 'Hospitalización infecciología', 'Internación', 'Cama de infecciología', 'available'),
  ('INT-010', 'Hospitalización oncología', 'Internación', 'Cama de oncología', 'available'),
  ('INT-011', 'Unidad de cuidados intensivos', 'Internación', 'Cama de UCI', 'available'),
  ('INT-012', 'Unidad de cuidados intermedios', 'Internación', 'Cama de UCI intermedia', 'available'),
  ('INT-013', 'Unidad de cuidados neonatales', 'Internación', 'Cama de UCIN', 'available'),
  ('INT-014', 'Unidad de cuidados pediátricos', 'Internación', 'Cama de UCIP', 'available'),
  ('INT-015', 'Recuperación post-anestésica', 'Internación', 'Cama de recuperación', 'available'),
  ('INT-016', 'Hospicio/Cuidados paliativos', 'Internación', 'Cama de cuidados paliativos', 'available'),
  ('INT-017', 'Maternidad/Gestación', 'Internación', 'Cama de maternidad', 'available'),
  ('INT-018', 'Alojamiento conjunto', 'Internación', 'Cama de alojamiento conjunto', 'available'),
  ('INT-019', 'Aislamiento de infecciones', 'Internación', 'Cama de aislamiento', 'available'),
  ('INT-020', 'Quimioterapia ambulatoria', 'Internación', 'Silla de quimioterapia', 'available'),
  ('INT-021', 'Radioterapia', 'Internación', 'Sesión de radioterapia', 'available'),
  ('INT-022', 'Diálisis', 'Internación', 'Sesión de hemodiálisis', 'available'),
  ('INT-023', 'Transfusión de sangre', 'Internación', 'Transfusión de componentes sanguíneos', 'available'),
  ('INT-024', 'Nutrición parenteral', 'Internación', 'Servicio de nutrición parenteral', 'available'),
  ('INT-025', 'Ventilación mecánica', 'Internación', 'Soporte ventilatorio mecánico', 'available'),
  ('INT-026', 'Oxigenoterapia', 'Internación', 'Suministro de oxígeno', 'available'),
  ('INT-027', 'Nebulización/Inhaloterapia', 'Internación', 'Terapia inhalatoria', 'available'),
  ('INT-028', 'Drenaje de tórax/Abdomen', 'Internación', 'Manejo de drenajes', 'available'),
  ('INT-029', 'Procedimientos de enfermería especial', 'Internación', 'Procedimientos especializados de enfermería', 'available'),
  ('INT-030', 'Aseo y confort del paciente', 'Internación', 'Higiene personal del paciente', 'available'),
  ('INT-031', 'Manejo del dolor', 'Internación', 'Evaluación y control del dolor', 'available'),
  ('INT-032', 'Vigilancia y monitoreo', 'Internación', 'Monitoreo de signos vitales', 'available'),
  ('INT-033', 'Movilización temprana', 'Internación', 'Programa de movilización', 'available'),
  ('INT-034', 'Prevención de úlceras por presión', 'Internacion', 'Medidas preventivas UPP', 'available'),

  -- Quirúrgico (38 services)
  ('QX-001', 'Anestesia general', 'Quirúrgico', 'Anestesia general', 'available'),
  ('QX-002', 'Anestesia regional', 'Quirúrgico', 'Anestesia regional', 'available'),
  ('QX-003', 'Anestesia local', 'Quirúrgico', 'Anestesia local/infiltración', 'available'),
  ('QX-004', 'Cirugía general', 'Quirúrgico', 'Procedimiento de cirugía general', 'available'),
  ('QX-005', 'Cirugía laparoscópica', 'Quirúrgico', 'Procedimiento laparoscópico', 'available'),
  ('QX-006', 'Apendicectomía', 'Quirúrgico', 'Extirpación de apéndice', 'available'),
  ('QX-007', 'Colecistectomía', 'Quirúrgico', 'Extirpación de vesícula biliar', 'available'),
  ('QX-008', 'Herniorrrafia', 'Quirúrgico', 'Reparación de hernia', 'available'),
  ('QX-009', 'Mastectomía', 'Quirúrgico', 'Extirpación de mama', 'available'),
  ('QX-010', 'Lumpectomía', 'Quirúrgico', 'Resección parcial de mama', 'available'),
  ('QX-011', 'Prostatectomía', 'Quirúrgico', 'Extirpación de próstata', 'available'),
  ('QX-012', 'Cesaría', 'Quirúrgico', 'Parto por cesárea', 'available'),
  ('QX-013', 'Parto vaginal', 'Quirúrgico', 'Atención de parto vaginal', 'available'),
  ('QX-014', 'Legrado uterino', 'Quirúrgico', 'Procedimiento de legrado', 'available'),
  ('QX-015', 'Histerectomía', 'Quirúrgico', 'Extirpación de útero', 'available'),
  ('QX-016', 'Fractura de fémur/Cadera', 'Quirúrgico', 'Cirugía de cadera', 'available'),
  ('QX-017', 'Artroplastía de rodilla', 'Quirúrgico', 'Reemplazo de rodilla', 'available'),
  ('QX-018', 'Artroplastía de cadera', 'Quirúrgico', 'Reemplazo de cadera', 'available'),
  ('QX-019', 'Osteosíntesis', 'Quirúrgico', 'Fijación de fractura', 'available'),
  ('QX-020', 'Artroscopia', 'Quirúrgico', 'Artroscopia diagnóstica/terapéutica', 'available'),
  ('QX-021', 'Cirugía cardíaca', 'Quirúrgico', 'Procedimiento de cirugía cardíaca', 'available'),
  ('QX-022', 'Cateterismo cardíaco', 'Quirúrgico', 'Cateterismo diagnóstico/terapéutico', 'available'),
  ('QX-023', 'Angioplastía', 'Quirúrgico', 'Angioplastía con stent', 'available'),
  ('QX-024', 'Cirugía vascular', 'Quirúrgico', 'Procedimiento vascular', 'available'),
  ('QX-025', 'Cirugía de tórax', 'Quirúrgico', 'Toracotomía/Toracoscopia', 'available'),
  ('QX-026', 'Neurocirugía', 'Quirúrgico', 'Procedimiento neuroquirúrgico', 'available'),
  ('QX-027', 'Otorrinolaringología quirúrgica', 'Quirúrgico', 'Cirugía ORL', 'available'),
  ('QX-028', 'Cirugía oftalmológica', 'Quirúrgico', 'Cirugía ocular', 'available'),
  ('QX-029', 'Cirugía dental/Implantología', 'Quirúrgico', 'Extracción/Implante dental', 'available'),
  ('QX-030', 'Procedimientos dermatológicos', 'Quirúrgico', 'Cirugía dermatológica', 'available'),
  ('QX-031', 'Gastroscopia terapéutica', 'Quirúrgico', 'Procedimiento GI terapéutico', 'available'),
  ('QX-032', 'Colonoscopia terapéutica', 'Quirúrgico', 'Procedimiento colónico terapéutico', 'available'),
  ('QX-033', 'ERCP', 'Quirúrgico', 'Colangiopancreatografía retrógrada endoscópica', 'available'),
  ('QX-034', 'Ureteroscopia', 'Quirúrgico', 'Procedimiento ureteroscópico', 'available'),
  ('QX-035', 'Nefrolitotomía percutánea', 'Quirúrgico', 'Extirpación de cálculo renal', 'available'),
  ('QX-036', 'Transurethral resection', 'Quirúrgico', 'Resección transuretral', 'available'),
  ('QX-037', 'Pieloplastía', 'Quirúrgico', 'Cirugía de unión ureteropélvica', 'available'),
  ('QX-038', 'Trasplante', 'Quirúrgico', 'Procedimiento de trasplante de órgano', 'available'),

  -- Atención Inmediata (24 services)
  ('AI-001', 'Atención inicial de emergencia', 'Atención Inmediata', 'Triaje y evaluación inicial', 'available'),
  ('AI-002', 'Resucitación cardiopulmonar', 'Atención Inmediata', 'RCP avanzada', 'available'),
  ('AI-003', 'Trauma mayor', 'Atención Inmediata', 'Manejo de trauma grave', 'available'),
  ('AI-004', 'Quemaduras', 'Atención Inmediata', 'Atención de quemaduras', 'available'),
  ('AI-005', 'Envenenamiento/Intoxicación', 'Atención Inmediata', 'Manejo de intoxicación', 'available'),
  ('AI-006', 'Shock/Colapso circulatorio', 'Atención Inmediata', 'Manejo de shock', 'available'),
  ('AI-007', 'Síncope/Pérdida de conciencia', 'Atención Inmediata', 'Evaluación de desmayo', 'available'),
  ('AI-008', 'Infarto agudo del miocardio', 'Atención Inmediata', 'Manejo de IAM', 'available'),
  ('AI-009', 'Angina de pecho', 'Atención Inmediata', 'Evaluación de dolor torácico', 'available'),
  ('AI-010', 'Accidente cerebrovascular', 'Atención Inmediata', 'Manejo de ACV', 'available'),
  ('AI-011', 'Crisis convulsiva', 'Atención Inmediata', 'Manejo de crisis', 'available'),
  ('AI-012', 'Asma agudo', 'Atención Inmediata', 'Manejo de crisis asmática', 'available'),
  ('AI-013', 'Anafilaxia', 'Atención Inmediata', 'Manejo de reacción anafiláctica', 'available'),
  ('AI-014', 'Hemorragia/Sangrado', 'Atención Inmediata', 'Control de hemorragia', 'available'),
  ('AI-015', 'Obstrucción de vías aéreas', 'Atención Inmediata', 'Manejo de vías aéreas', 'available'),
  ('AI-016', 'Cetoacidosis diabética', 'Atención Inmediata', 'Manejo de descompensación diabética', 'available'),
  ('AI-017', 'Hipoglucemia', 'Atención Inmediata', 'Manejo de hipoglucemia', 'available'),
  ('AI-018', 'Dolor agudo severo', 'Atención Inmediata', 'Manejo del dolor agudo', 'available'),
  ('AI-019', 'Abdominal agudo', 'Atención Inmediata', 'Evaluación de abdomen agudo', 'available'),
  ('AI-020', 'Fiebre muy elevada', 'Atención Inmediata', 'Manejo de hipertermia', 'available'),
  ('AI-021', 'Hipotermia', 'Atención Inmediata', 'Manejo de hipotermia', 'available'),
  ('AI-022', 'Complicaciones obstétricas', 'Atención Inmediata', 'Manejo de emergencia obstétrica', 'available'),
  ('AI-023', 'Reacción transfusional', 'Atención Inmediata', 'Manejo de reacción transfusional', 'available'),
  ('AI-024', 'Emergencia psiquiátrica', 'Atención Inmediata', 'Evaluación psiquiátrica de emergencia', 'available')
ON CONFLICT DO NOTHING;

-- ============================================================
-- INDEXES FOR PHASE 3
-- ============================================================

CREATE INDEX idx_questionnaires_status ON questionnaires(status);
CREATE INDEX idx_questionnaires_created_at ON questionnaires(created_at DESC);

CREATE INDEX idx_questionnaire_sections_questionnaire_id ON questionnaire_sections(questionnaire_id);

CREATE INDEX idx_questions_section_id ON questions(section_id);
CREATE INDEX idx_questions_conditional_on ON questions(conditional_on);

CREATE INDEX idx_question_options_question_id ON question_options(question_id);

CREATE INDEX idx_assessments_provider_id ON assessments(provider_id);
CREATE INDEX idx_assessments_questionnaire_id ON assessments(questionnaire_id);
CREATE INDEX idx_assessments_location_id ON assessments(location_id);
CREATE INDEX idx_assessments_service_id ON assessments(service_id);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_deadline ON assessments(deadline);
CREATE INDEX idx_assessments_created_at ON assessments(created_at DESC);

CREATE INDEX idx_assessment_responses_assessment_id ON assessment_responses(assessment_id);
CREATE INDEX idx_assessment_responses_question_id ON assessment_responses(question_id);

CREATE INDEX idx_finding_status_history_finding_id ON finding_status_history(finding_id);

CREATE INDEX idx_action_status_history_action_id ON action_status_history(action_id);

CREATE INDEX idx_action_evidence_action_id ON action_evidence(action_id);

CREATE INDEX idx_action_comments_action_id ON action_comments(action_id);
CREATE INDEX idx_action_comments_user_id ON action_comments(user_id);

CREATE INDEX idx_escalation_alerts_action_id ON escalation_alerts(action_id);
CREATE INDEX idx_escalation_alerts_finding_id ON escalation_alerts(finding_id);
CREATE INDEX idx_escalation_alerts_assessment_id ON escalation_alerts(assessment_id);
CREATE INDEX idx_escalation_alerts_triggered_at ON escalation_alerts(triggered_at);
CREATE INDEX idx_escalation_alerts_is_active ON escalation_alerts(is_active);

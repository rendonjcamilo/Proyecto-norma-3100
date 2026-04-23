-- Norma 3100 Evaluation & Questionnaire Schema
-- PostgreSQL 14+
-- Implements assessment questionnaire builder with:
-- - Evaluation standards (7 transversales + N specific per service)
-- - Evaluation criteria (40-80 per service)
-- - Questionnaire versioning (initial, year4, annual, pre-novelty)
-- - Conditional logic for criteria dependencies

-- ============================================================
-- EVALUATION STANDARDS
-- ============================================================
-- 7 transversales (applicable to all services) + N specific per service

CREATE TABLE IF NOT EXISTS evaluation_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,

    -- Indicates if this standard applies to all services
    is_transversal BOOLEAN DEFAULT FALSE,

    -- If not transversal, which service(s) this applies to
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,

    -- Classification category
    category VARCHAR(100),

    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(code, service_id, is_transversal)
);

CREATE INDEX IF NOT EXISTS idx_evaluation_standards_service_transversal
    ON evaluation_standards(service_id, is_transversal);

-- ============================================================
-- EVALUATION CRITERIA
-- ============================================================
-- Individual criteria per standard/service (40-80 per service)

CREATE TABLE IF NOT EXISTS evaluation_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code VARCHAR(50) NOT NULL,
    number VARCHAR(20) NOT NULL, -- e.g., "1.1", "1.2", "2.1"
    name TEXT NOT NULL,
    description TEXT NOT NULL,

    evidence_requirement TEXT, -- What proof is needed

    complexity VARCHAR(50) DEFAULT 'medium' CHECK (complexity IN ('simple', 'medium', 'complex')),

    standard_id UUID NOT NULL REFERENCES evaluation_standards(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,

    is_mandatory BOOLEAN DEFAULT TRUE,

    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(code, service_id)
);

CREATE INDEX IF NOT EXISTS idx_evaluation_criteria_service
    ON evaluation_criteria(service_id);

CREATE INDEX IF NOT EXISTS idx_evaluation_criteria_standard
    ON evaluation_criteria(standard_id);

-- ============================================================
-- QUESTIONNAIRES (Versioned assessments)
-- ============================================================
-- Snapshots of criteria at specific points in time

CREATE TABLE IF NOT EXISTS questionnaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) NOT NULL,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,

    -- Versioning: initial | year4 | annual | pre-novelty
    version_type VARCHAR(50) NOT NULL
        CHECK (version_type IN ('initial', 'year4', 'annual', 'pre-novelty')),

    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),

    total_criteria INT DEFAULT 0,

    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(service_id, version_type)
);

CREATE INDEX IF NOT EXISTS idx_questionnaires_service
    ON questionnaires(service_id);

CREATE INDEX IF NOT EXISTS idx_questionnaires_status
    ON questionnaires(status);

-- ============================================================
-- QUESTIONNAIRE_CRITERIA (Links criteria to questionnaire)
-- ============================================================
-- Immutable snapshot of which criteria are in each questionnaire

CREATE TABLE IF NOT EXISTS questionnaire_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    questionnaire_id UUID NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
    criterion_id UUID NOT NULL REFERENCES evaluation_criteria(id) ON DELETE CASCADE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(questionnaire_id, criterion_id)
);

CREATE INDEX IF NOT EXISTS idx_questionnaire_criteria_questionnaire
    ON questionnaire_criteria(questionnaire_id);

-- ============================================================
-- CRITERIA CONDITIONAL LOGIC
-- ============================================================
-- IF criterion A is NC THEN show criterion B

CREATE TABLE IF NOT EXISTS criteria_conditional_logic (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    criterion_id UUID NOT NULL REFERENCES evaluation_criteria(id) ON DELETE CASCADE,
    dependent_criterion_id UUID NOT NULL REFERENCES evaluation_criteria(id) ON DELETE CASCADE,

    -- Type of condition
    condition_type VARCHAR(50) DEFAULT 'if_not_compliant'
        CHECK (condition_type IN ('if_not_compliant', 'if_compliant')),

    description TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(criterion_id, dependent_criterion_id)
);

CREATE INDEX IF NOT EXISTS idx_criteria_conditional_logic_criterion
    ON criteria_conditional_logic(criterion_id);

-- ============================================================
-- ASSESSMENT RESPONSES
-- ============================================================
-- Individual responses to criteria in an assessment

CREATE TABLE IF NOT EXISTS assessment_criteria_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    criterion_id UUID NOT NULL REFERENCES evaluation_criteria(id) ON DELETE CASCADE,

    -- Compliance status: C (Compliant), NC (Non-Compliant), NA (Not Applicable)
    value VARCHAR(2) NOT NULL CHECK (value IN ('C', 'NC', 'NA')),

    notes TEXT,
    evidence_references JSONB DEFAULT '[]', -- Array of document IDs/paths

    answered_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(assessment_id, criterion_id)
);

CREATE INDEX IF NOT EXISTS idx_assessment_criteria_responses_assessment
    ON assessment_criteria_responses(assessment_id);

CREATE INDEX IF NOT EXISTS idx_assessment_criteria_responses_value
    ON assessment_criteria_responses(value);

-- ============================================================
-- 7 Estándares Transversales según Resolución 3100 de 2019
-- Capítulo 11 — Condición 3: Capacidad Tecnológica y Científica
-- Aplicables a TODOS los servicios habilitados
-- ============================================================

INSERT INTO evaluation_standards (code, name, description, is_transversal, category, status)
VALUES
  ('TSTH',   'Talento Humano',
   'Requisitos de formación académica, experiencia, certificaciones, inscripción en ReTHUS y dotación de personal para cada servicio. Incluye verificación en Resolución 2003 de 2014 y normas complementarias.',
   TRUE, 'Talento Humano', 'active'),

  ('TSINF',  'Infraestructura',
   'Condiciones físicas de la planta: áreas, accesos, pisos continuos e impermeables, paredes con media caña, flujo unidireccional, concepto sanitario, RETIE, uso del suelo y cumplimiento de normas de habilitación.',
   TRUE, 'Infraestructura', 'active'),

  ('TSDOT',  'Dotación',
   'Equipos biomédicos con registro INVIMA, clasificación de riesgo, hoja de vida por equipo, programa de mantenimiento preventivo y correctivo, calibraciones anuales, manuales en español y capacitación al personal.',
   TRUE, 'Dotación', 'active'),

  ('TSMD',   'Medicamentos, Dispositivos Médicos e Insumos',
   'Gestión de medicamentos y dispositivos médicos: registros INVIMA, control de vencimientos con semáforo, alertas de tecnovigilancia y farmacovigilancia, termohigrómetro, kit de derrames y reportes trimestrales.',
   TRUE, 'Medicamentos y Dispositivos', 'active'),

  ('TSPP',   'Procesos Prioritarios',
   'Protocolos basados en evidencia para procesos críticos: seguridad del paciente, cirugía segura, manejo de medicamentos, lavado de manos, protocolo de bioseguridad, guías clínicas y cronograma de capacitación.',
   TRUE, 'Procesos Asistenciales', 'active'),

  ('TSHCR',  'Historia Clínica y Registros',
   'Gestión documental de la historia clínica: 15 campos mínimos de identificación (Res. 1995/1999), consentimiento informado, registros clínicos por servicio, archivo, custodia y confidencialidad conforme a la ley.',
   TRUE, 'Historia Clínica', 'active'),

  ('TSINT',  'Interdependencia de Servicios',
   'Relaciones de dependencia entre servicios: contratos o convenios con prestadores habilitados para servicios de apoyo, red de referencia y contrarreferencia documentada.',
   TRUE, 'Interdependencia', 'active')

ON CONFLICT DO NOTHING;

-- ============================================================
-- Indexes for Performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_evaluation_standards_code
    ON evaluation_standards(code);

CREATE INDEX IF NOT EXISTS idx_evaluation_criteria_code
    ON evaluation_criteria(code);

CREATE INDEX IF NOT EXISTS idx_questionnaires_version_type
    ON questionnaires(version_type);

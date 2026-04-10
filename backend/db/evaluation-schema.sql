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
    name VARCHAR(255) NOT NULL,
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
    name VARCHAR(255) NOT NULL,
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
-- Create default 7 transversales standards (if not already present)
-- Norma 3100: 7 estándares transversales aplicables a todos los servicios
-- ============================================================

INSERT INTO evaluation_standards (code, name, description, is_transversal, category, status)
VALUES
  ('T-01', 'Capacidad técnico-administrativa', 'Capacidad de la institución para dirigir y administrar recursos técnicos, humanos y financieros', TRUE, 'Gestión', 'active'),
  ('T-02', 'Políticas y procedimientos', 'Desarrollo y cumplimiento de políticas y procedimientos operacionales estandarizados', TRUE, 'Gestión', 'active'),
  ('T-03', 'Gestión de recursos humanos', 'Contratación, capacitación, competencia y gestión del personal', TRUE, 'Personal', 'active'),
  ('T-04', 'Gestión de información', 'Recolección, almacenamiento, seguridad y acceso a información clínica y administrativa', TRUE, 'Infraestructura', 'active'),
  ('T-05', 'Infraestructura y tecnología', 'Instalaciones físicas, equipos, tecnología de información y sistemas de soporte', TRUE, 'Infraestructura', 'active'),
  ('T-06', 'Bioseguridad y ambiente', 'Protección contra riesgos biológicos, químicos, físicos y ambientales', TRUE, 'Seguridad', 'active'),
  ('T-07', 'Evaluación y mejora continua', 'Evaluación de procesos, satisfacción de usuarios, y mejora continua de la calidad', TRUE, 'Calidad', 'active')
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

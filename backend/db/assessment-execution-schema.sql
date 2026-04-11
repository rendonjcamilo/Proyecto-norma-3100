-- Phase 3 Task 5: Assessment Execution Engine Schema
-- PostgreSQL 14+
-- Implements assessment execution, compliance calculation, and hallazgo generation
-- Based on Norma 3100 standards and published questionnaires

-- ============================================================
-- ASSESSMENT EXECUTION TABLES
-- ============================================================

-- Main assessments table (instances of questionnaires)
-- Already exists in schema-phase3.sql, but we enhance it here for Task 5
ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS questionnaire_id UUID REFERENCES questionnaires(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS assessment_version VARCHAR(50) CHECK (assessment_version IN ('initial', 'year4', 'annual', 'pre-novelty')),
  ADD COLUMN IF NOT EXISTS started_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS started_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS compliance_percent DECIMAL(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS semaforo_color VARCHAR(20) DEFAULT 'rojo' CHECK (semaforo_color IN ('verde', 'naranja', 'rojo')),
  ADD COLUMN IF NOT EXISTS hallazgos_generated BOOLEAN DEFAULT FALSE;

-- Individual criterion responses for assessment execution
-- This replaces the simpler assessment_responses from schema-phase3.sql
CREATE TABLE IF NOT EXISTS assessment_responses_detailed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    criterion_id UUID NOT NULL REFERENCES evaluation_criteria(id) ON DELETE CASCADE,

    -- Status: C (Cumple), NC (No Cumple), NA (No Aplica)
    response_status VARCHAR(2) NOT NULL CHECK (response_status IN ('C', 'NC', 'NA')),

    -- Detailed description (required for NC, optional for C/NA)
    description TEXT,

    -- Assessor comments
    comments TEXT,

    -- Evidence files linked to this response
    evidence_file_ids JSONB DEFAULT '[]',

    -- Timestamps
    responded_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    responded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(assessment_id, criterion_id)
);

CREATE INDEX IF NOT EXISTS idx_assessment_responses_assessment
    ON assessment_responses_detailed(assessment_id);

CREATE INDEX IF NOT EXISTS idx_assessment_responses_status
    ON assessment_responses_detailed(response_status);

CREATE INDEX IF NOT EXISTS idx_assessment_responses_criterion
    ON assessment_responses_detailed(criterion_id);

-- Assessment evidence files
CREATE TABLE IF NOT EXISTS assessment_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    assessment_response_id UUID NOT NULL REFERENCES assessment_responses_detailed(id) ON DELETE CASCADE,
    file_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(50),

    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_assessment_evidence_response
    ON assessment_evidence(assessment_response_id);

-- Compliance metrics per assessment (cached for performance)
CREATE TABLE IF NOT EXISTS assessment_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    assessment_id UUID NOT NULL UNIQUE REFERENCES assessments(id) ON DELETE CASCADE,

    -- Counts
    total_criteria INT DEFAULT 0,
    cumple_count INT DEFAULT 0,
    no_cumple_count INT DEFAULT 0,
    no_aplica_count INT DEFAULT 0,

    -- Calculated metrics
    compliance_percent DECIMAL(5,2) DEFAULT 0.00,
    semaforo_color VARCHAR(20) DEFAULT 'rojo' CHECK (semaforo_color IN ('verde', 'naranja', 'rojo')),

    -- Per-standard breakdown (JSONB)
    per_standard_metrics JSONB DEFAULT '{}',

    -- Timestamps
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessment_metrics_assessment
    ON assessment_metrics(assessment_id);

-- Auto-generated hallazgos (findings) from NC criteria
-- Links to findings table in schema.sql
ALTER TABLE findings
  ADD COLUMN IF NOT EXISTS assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS assessment_response_id UUID REFERENCES assessment_responses_detailed(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS criterion_id UUID REFERENCES evaluation_criteria(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS semaforo_color VARCHAR(20) DEFAULT 'naranja' CHECK (semaforo_color IN ('verde', 'naranja', 'rojo'));

CREATE INDEX IF NOT EXISTS idx_findings_assessment
    ON findings(assessment_id);

-- ============================================================
-- COMPLIANCE CALCULATION SUPPORT TABLES
-- ============================================================

-- Per-standard compliance breakdown
CREATE TABLE IF NOT EXISTS standard_compliance_breakdown (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    standard_id UUID NOT NULL REFERENCES evaluation_standards(id) ON DELETE CASCADE,

    total_criteria INT DEFAULT 0,
    cumple_count INT DEFAULT 0,
    no_cumple_count INT DEFAULT 0,
    no_aplica_count INT DEFAULT 0,

    compliance_percent DECIMAL(5,2) DEFAULT 0.00,

    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_standard_compliance_assessment
    ON standard_compliance_breakdown(assessment_id);

CREATE INDEX IF NOT EXISTS idx_standard_compliance_standard
    ON standard_compliance_breakdown(standard_id);

-- ============================================================
-- ASSESSMENT STATUS AUDIT TRAIL
-- ============================================================

-- Track assessment status changes
CREATE TABLE IF NOT EXISTS assessment_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,

    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    reason TEXT,

    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessment_status_history_assessment
    ON assessment_status_history(assessment_id);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_assessments_provider
    ON assessments(provider_id);

CREATE INDEX IF NOT EXISTS idx_assessments_service
    ON assessments(service_id);

CREATE INDEX IF NOT EXISTS idx_assessments_status
    ON assessments(status);

CREATE INDEX IF NOT EXISTS idx_assessments_location
    ON assessments(location_id);

CREATE INDEX IF NOT EXISTS idx_assessments_questionnaire
    ON assessments(questionnaire_id);

-- ============================================================
-- AUDIT & EVENT LOGGING
-- ============================================================

-- Assessment lifecycle events
CREATE TABLE IF NOT EXISTS assessment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    description TEXT,

    payload JSONB DEFAULT '{}',

    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessment_events_assessment
    ON assessment_events(assessment_id);

CREATE INDEX IF NOT EXISTS idx_assessment_events_type
    ON assessment_events(event_type);

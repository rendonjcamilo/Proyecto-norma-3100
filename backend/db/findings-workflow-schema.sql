-- Phase 3 Task 6: Findings Lifecycle & Corrective Action Planning Schema
-- PostgreSQL 14+
-- Implements findings management with corrective action workflow, follow-ups, and event sourcing

-- ============================================================
-- ENHANCE EXISTING FINDINGS TABLE
-- ============================================================

-- Update findings table with Task 6 fields for status workflow
ALTER TABLE findings
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'abierta'
    CHECK (status IN ('abierta', 'en_revision', 'asignada', 'en_progreso', 'cerrada')),
  ADD COLUMN IF NOT EXISTS severity VARCHAR(50) DEFAULT 'pendiente'
    CHECK (severity IN ('crítica', 'alta', 'media', 'baja', 'pendiente')),
  ADD COLUMN IF NOT EXISTS risk_score INT DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS closed_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS standard_id UUID REFERENCES evaluation_standards(id) ON DELETE SET NULL;

-- Add indexes for findings queries
CREATE INDEX IF NOT EXISTS idx_findings_status ON findings(status);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);
CREATE INDEX IF NOT EXISTS idx_findings_assigned_to ON findings(assigned_to);
CREATE INDEX IF NOT EXISTS idx_findings_service ON findings(service_id);
CREATE INDEX IF NOT EXISTS idx_findings_standard ON findings(standard_id);
CREATE INDEX IF NOT EXISTS idx_findings_risk_score ON findings(risk_score);

-- ============================================================
-- CORRECTIVE ACTIONS TABLE (Enhanced)
-- ============================================================

-- Update corrective_actions with Task 6 fields
ALTER TABLE corrective_actions
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'media'
    CHECK (priority IN ('crítica', 'alta', 'media', 'baja')),
  ADD COLUMN IF NOT EXISTS responsible_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS completion_percentage INT DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100);

-- Rename due_date to deadline if needed
-- Note: due_date already exists, so completion_date can serve as actual_completion

CREATE INDEX IF NOT EXISTS idx_corrective_actions_status ON corrective_actions(status);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_priority ON corrective_actions(priority);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_assigned_to ON corrective_actions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_responsible ON corrective_actions(responsible_user_id);

-- ============================================================
-- ACTION FOLLOW-UPS TABLE (New)
-- ============================================================

CREATE TABLE IF NOT EXISTS action_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    action_id UUID NOT NULL REFERENCES corrective_actions(id) ON DELETE CASCADE,

    -- Follow-up step (1-6)
    step_number INT NOT NULL CHECK (step_number >= 1 AND step_number <= 6),

    -- Step metadata
    step_name VARCHAR(100) NOT NULL
        CHECK (step_name IN ('Planificación', 'Diseño', 'Implementación', 'Pruebas', 'Validación', 'Cierre')),

    description TEXT,

    -- Status tracking
    status VARCHAR(50) DEFAULT 'pendiente'
        CHECK (status IN ('pendiente', 'en_progreso', 'completado')),

    -- Timeline
    due_date TIMESTAMP WITH TIME ZONE,

    -- Completion tracking
    completion_percentage INT DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    evidence_attachment UUID REFERENCES documents(id) ON DELETE SET NULL,

    -- Completion details
    completed_date TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Comments
    comments TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Ensure one follow-up per step per action
    UNIQUE(action_id, step_number)
);

CREATE INDEX IF NOT EXISTS idx_followups_action ON action_followups(action_id);
CREATE INDEX IF NOT EXISTS idx_followups_status ON action_followups(status);
CREATE INDEX IF NOT EXISTS idx_followups_step_number ON action_followups(step_number);

-- ============================================================
-- FINDING EVENTS TABLE (Event Sourcing)
-- ============================================================

CREATE TABLE IF NOT EXISTS finding_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,

    -- Event classification
    event_type VARCHAR(100) NOT NULL
        CHECK (event_type IN (
            'finding.created',
            'finding.assigned',
            'finding.status_changed',
            'finding.severity_set',
            'finding.risk_scored',
            'action.created',
            'action.updated',
            'action.status_changed',
            'followup.completed',
            'finding.closed'
        )),

    -- Event payload (JSON data)
    data JSONB DEFAULT '{}',

    -- Who, when
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_finding_events_finding ON finding_events(finding_id);
CREATE INDEX IF NOT EXISTS idx_finding_events_type ON finding_events(event_type);
CREATE INDEX IF NOT EXISTS idx_finding_events_user ON finding_events(user_id);
CREATE INDEX IF NOT EXISTS idx_finding_events_created ON finding_events(created_at DESC);

-- ============================================================
-- FINDING ASSIGNMENTS HISTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS finding_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,

    -- Assignment details
    assigned_to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Timestamps
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    unassigned_at TIMESTAMP WITH TIME ZONE,

    -- Status of this assignment
    is_current BOOLEAN DEFAULT TRUE,

    reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_finding_assignments_finding ON finding_assignments(finding_id);
CREATE INDEX IF NOT EXISTS idx_finding_assignments_user ON finding_assignments(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_finding_assignments_current ON finding_assignments(finding_id, is_current);

-- ============================================================
-- FINDING CLOSURE HISTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS finding_closures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,

    -- Closure details
    closed_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

    -- Reason and notes
    closure_reason TEXT,
    notes TEXT,

    -- Actions closed with this finding
    actions_closed_count INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_finding_closures_finding ON finding_closures(finding_id);
CREATE INDEX IF NOT EXISTS idx_finding_closures_closed_date ON finding_closures(closed_date DESC);

-- ============================================================
-- FINDINGS STATISTICS VIEW (For quick reporting)
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS findings_summary_stats AS
SELECT
    f.status,
    f.severity,
    COUNT(*) as finding_count,
    COUNT(CASE WHEN f.assigned_to IS NOT NULL THEN 1 END) as assigned_count,
    COUNT(CASE WHEN f.closed_date IS NOT NULL THEN 1 END) as closed_count,
    AVG(f.risk_score) as avg_risk_score,
    MAX(f.created_at) as latest_created
FROM findings f
WHERE f.created_at > CURRENT_TIMESTAMP - INTERVAL '1 year'
GROUP BY f.status, f.severity;

CREATE INDEX IF NOT EXISTS idx_findings_stats_status ON findings_summary_stats(status);

-- ============================================================
-- ACTION PROGRESS VIEW
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS action_progress_view AS
SELECT
    ca.id as action_id,
    ca.finding_id,
    ca.title,
    ca.status,
    ca.priority,
    ca.due_date,
    ca.assigned_to,
    ca.completion_percentage,
    COUNT(af.id) as followup_count,
    COUNT(CASE WHEN af.status = 'completado' THEN 1 END) as completed_followups,
    MAX(af.due_date) as last_followup_due,
    CASE
        WHEN ca.due_date < CURRENT_TIMESTAMP AND ca.status != 'cerrada' THEN 'overdue'
        WHEN ca.due_date < CURRENT_TIMESTAMP + INTERVAL '7 days' AND ca.status != 'cerrada' THEN 'due_soon'
        ELSE 'on_track'
    END as deadline_status
FROM corrective_actions ca
LEFT JOIN action_followups af ON ca.id = af.action_id
GROUP BY ca.id, ca.finding_id, ca.title, ca.status, ca.priority, ca.due_date, ca.assigned_to, ca.completion_percentage;

CREATE INDEX IF NOT EXISTS idx_action_progress_status ON action_progress_view(status);
CREATE INDEX IF NOT EXISTS idx_action_progress_deadline ON action_progress_view(deadline_status);

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================

-- For common queries
CREATE INDEX IF NOT EXISTS idx_findings_created_at ON findings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_finding_status ON corrective_actions(finding_id, status);
CREATE INDEX IF NOT EXISTS idx_followups_action_step ON action_followups(action_id, step_number);

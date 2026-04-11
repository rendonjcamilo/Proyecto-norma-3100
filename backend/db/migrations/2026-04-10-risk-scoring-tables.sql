-- ============================================================
-- Risk Scoring Tables Migration
-- Task 9: Risk Scoring Backend
-- ============================================================

-- Create risk_score_history table for trend analysis
-- Stores historical risk scores to track changes over time
CREATE TABLE IF NOT EXISTS risk_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level VARCHAR(20) NOT NULL DEFAULT 'baja',
  components JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT risk_level_check CHECK (risk_level IN ('crítica', 'alta', 'media', 'baja'))
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_risk_score_history_finding_id
  ON risk_score_history(finding_id);

CREATE INDEX IF NOT EXISTS idx_risk_score_history_created_at
  ON risk_score_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_risk_score_history_risk_level
  ON risk_score_history(risk_level);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_risk_score_history_finding_created
  ON risk_score_history(finding_id, created_at DESC);

-- Add risk_score_escalations table to track escalations
-- Escalations occur when risk score exceeds thresholds or deadlines are breached
CREATE TABLE IF NOT EXISTS risk_score_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  risk_score INTEGER NOT NULL,
  escalation_type VARCHAR(50) NOT NULL,
  escalation_level VARCHAR(20) NOT NULL DEFAULT 'warning',
  assigned_to UUID REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE,
  comments TEXT,
  CONSTRAINT escalation_type_check CHECK (
    escalation_type IN ('high_score', 'overdue', 'age_based', 'action_delayed', 'manual')
  ),
  CONSTRAINT escalation_level_check CHECK (
    escalation_level IN ('warning', 'urgent', 'critical')
  ),
  CONSTRAINT status_check CHECK (status IN ('open', 'acknowledged', 'resolved', 'escalated'))
);

-- Index for escalations
CREATE INDEX IF NOT EXISTS idx_risk_escalations_finding_id
  ON risk_score_escalations(finding_id);

CREATE INDEX IF NOT EXISTS idx_risk_escalations_status
  ON risk_score_escalations(status);

CREATE INDEX IF NOT EXISTS idx_risk_escalations_created_at
  ON risk_score_escalations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_risk_escalations_assigned_to
  ON risk_score_escalations(assigned_to);

-- Update findings table to add risk_score if not exists
-- (risk_score column should already exist, but ensure it's there)
ALTER TABLE findings ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0
  CHECK (risk_score >= 0 AND risk_score <= 100);

-- Create view for risk dashboard aggregations
CREATE OR REPLACE VIEW risk_dashboard_summary AS
SELECT
  f.provider_id,
  f.location_id,
  COUNT(*) as total_findings,
  SUM(CASE WHEN f.status = 'cerrada' THEN 1 ELSE 0 END) as closed_findings,
  SUM(CASE WHEN f.status != 'cerrada' THEN 1 ELSE 0 END) as open_findings,
  SUM(CASE WHEN rsh.risk_score > 70 THEN 1 ELSE 0 END) as high_risk_findings,
  SUM(CASE WHEN rsh.risk_score > 50 AND rsh.risk_score <= 70 THEN 1 ELSE 0 END) as medium_risk_findings,
  SUM(CASE WHEN rsh.risk_score <= 50 THEN 1 ELSE 0 END) as low_risk_findings,
  ROUND(AVG(CASE WHEN f.status != 'cerrada' THEN rsh.risk_score ELSE NULL END)::numeric, 2) as avg_risk_score,
  MAX(CASE WHEN f.status != 'cerrada' THEN rsh.risk_score ELSE 0 END) as max_risk_score,
  CASE
    WHEN ROUND(AVG(CASE WHEN f.status != 'cerrada' THEN rsh.risk_score ELSE NULL END)::numeric, 2) > 70 THEN 'crítica'
    WHEN ROUND(AVG(CASE WHEN f.status != 'cerrada' THEN rsh.risk_score ELSE NULL END)::numeric, 2) > 50 THEN 'alta'
    WHEN ROUND(AVG(CASE WHEN f.status != 'cerrada' THEN rsh.risk_score ELSE NULL END)::numeric, 2) > 30 THEN 'media'
    ELSE 'baja'
  END as overall_risk_level
FROM findings f
LEFT JOIN LATERAL (
  SELECT risk_score FROM risk_score_history
  WHERE finding_id = f.id
  ORDER BY created_at DESC LIMIT 1
) rsh ON true
GROUP BY f.provider_id, f.location_id;

-- Create view for high-risk alerts
CREATE OR REPLACE VIEW high_risk_alerts AS
SELECT
  f.id as finding_id,
  f.title as finding_title,
  f.severity,
  rsh.risk_score,
  rsh.risk_level,
  f.provider_id,
  f.location_id,
  ca.id as action_id,
  ca.deadline,
  ca.assigned_to,
  EXTRACT(DAY FROM CURRENT_TIMESTAMP - ca.deadline) as days_overdue,
  f.created_date,
  EXTRACT(DAY FROM CURRENT_TIMESTAMP - f.created_date) as finding_age_days
FROM findings f
LEFT JOIN LATERAL (
  SELECT risk_score, risk_level FROM risk_score_history
  WHERE finding_id = f.id
  ORDER BY created_at DESC LIMIT 1
) rsh ON true
LEFT JOIN corrective_actions ca ON f.id = ca.finding_id AND ca.status != 'cerrada'
WHERE f.status != 'cerrada' AND rsh.risk_score > 70
ORDER BY rsh.risk_score DESC;

-- Grant permissions
GRANT SELECT ON risk_score_history TO postgres;
GRANT SELECT ON risk_score_escalations TO postgres;
GRANT SELECT ON risk_dashboard_summary TO postgres;
GRANT SELECT ON high_risk_alerts TO postgres;

-- Add comments for documentation
COMMENT ON TABLE risk_score_history IS
  'Stores historical risk scores for findings to enable trend analysis and escalation tracking';

COMMENT ON TABLE risk_score_escalations IS
  'Tracks escalation events triggered by high risk scores or overdue actions';

COMMENT ON VIEW risk_dashboard_summary IS
  'Dashboard view showing risk metrics aggregated by provider and location';

COMMENT ON VIEW high_risk_alerts IS
  'View of high-risk findings (score > 70) with overdue action information';

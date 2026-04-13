/**
 * Notifications Tables Migration
 * Created: 2026-04-10
 * Purpose: Support real-time notifications with Socket.io
 */

-- Enable uuid extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Notifications table: Store all notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  finding_id UUID REFERENCES findings(id) ON DELETE CASCADE,
  action_id UUID REFERENCES corrective_actions(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP,
  acknowledged_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT valid_acknowledgement CHECK (
    (is_acknowledged = false AND acknowledged_at IS NULL AND acknowledged_by IS NULL) OR
    (is_acknowledged = true AND acknowledged_at IS NOT NULL)
  ),
  CONSTRAINT valid_read CHECK (
    (is_read = false AND read_at IS NULL) OR
    (is_read = true AND read_at IS NOT NULL)
  )
);

-- Notification preferences table: User notification settings
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  enable_overdue BOOLEAN DEFAULT true,
  enable_high_risk BOOLEAN DEFAULT true,
  enable_verification BOOLEAN DEFAULT true,
  min_severity VARCHAR(20) NOT NULL DEFAULT 'medium',
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT valid_quiet_hours CHECK (
    (quiet_hours_start IS NULL AND quiet_hours_end IS NULL) OR
    (quiet_hours_start IS NOT NULL AND quiet_hours_end IS NOT NULL)
  )
);

-- Notification history view: For audit trail
CREATE VIEW notification_history AS
SELECT
  n.id,
  n.type,
  n.severity,
  n.finding_id,
  n.action_id,
  n.provider_id,
  n.user_id,
  n.title,
  n.message,
  n.is_read,
  n.is_acknowledged,
  n.created_at,
  n.read_at,
  n.acknowledged_at,
  EXTRACT(EPOCH FROM (n.read_at - n.created_at)) as read_delay_seconds,
  EXTRACT(EPOCH FROM (n.acknowledged_at - n.created_at)) as ack_delay_seconds
FROM notifications n
ORDER BY n.created_at DESC;

-- Indexes for performance optimization
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_provider_id ON notifications(provider_id);
CREATE INDEX idx_notifications_finding_id ON notifications(finding_id);
CREATE INDEX idx_notifications_action_id ON notifications(action_id);
CREATE INDEX idx_notifications_severity ON notifications(severity);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notification_prefs_user_id ON notification_preferences(user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_updated_at_trigger
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION update_notifications_updated_at();

-- Trigger for notification preferences
CREATE OR REPLACE FUNCTION update_notification_prefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_prefs_updated_at_trigger
BEFORE UPDATE ON notification_preferences
FOR EACH ROW
EXECUTE FUNCTION update_notification_prefs_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_preferences TO postgres;
GRANT SELECT ON notification_history TO postgres;

-- Create dashboard view for notification stats
CREATE VIEW notification_stats_dashboard AS
SELECT
  COUNT(*) as total_notifications,
  SUM(CASE WHEN is_read = false THEN 1 ELSE 0 END) as unread_count,
  SUM(CASE WHEN is_acknowledged = false THEN 1 ELSE 0 END) as unacknowledged_count,
  COUNT(DISTINCT user_id) as users_with_notifications,
  COUNT(DISTINCT provider_id) as providers_affected,
  MAX(created_at) as latest_notification,
  STRING_AGG(DISTINCT severity, ', ') as severity_levels
FROM notifications
WHERE created_at > NOW() - INTERVAL '7 days';

-- Performance analysis view
CREATE VIEW notification_performance AS
SELECT
  type,
  severity,
  COUNT(*) as total_sent,
  AVG(EXTRACT(EPOCH FROM (read_at - created_at))) as avg_read_time_seconds,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (read_at - created_at))) as median_read_time_seconds,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (read_at - created_at))) as p95_read_time_seconds
FROM notifications
WHERE read_at IS NOT NULL
GROUP BY type, severity
ORDER BY total_sent DESC;

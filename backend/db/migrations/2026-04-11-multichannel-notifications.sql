/**
 * Multi-Channel Notifications Migration
 * Adds support for Email, SMS, and Push notifications
 * Extends the existing notification system from Sprint 1
 */

-- Email Notification Delivery Table
CREATE TABLE IF NOT EXISTS email_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  provider_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  delivery_attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  last_attempt_at TIMESTAMP,
  sent_at TIMESTAMP,
  bounce_reason TEXT,
  email_provider VARCHAR(50) NOT NULL CHECK (email_provider IN ('mailgun', 'sendgrid', 'aws_ses')),
  provider_message_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SMS Notification Delivery Table
CREATE TABLE IF NOT EXISTS sms_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  provider_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'undelivered')),
  delivery_attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  last_attempt_at TIMESTAMP,
  sent_at TIMESTAMP,
  failure_reason TEXT,
  sms_provider VARCHAR(50) NOT NULL CHECK (sms_provider IN ('twilio', 'aws_sns', 'local_provider')),
  provider_message_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Push Notification Delivery Table
CREATE TABLE IF NOT EXISTS push_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  provider_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  device_token VARCHAR(500) NOT NULL,
  device_platform VARCHAR(50) NOT NULL CHECK (device_platform IN ('ios', 'android', 'web')),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'invalid_token')),
  delivery_attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  last_attempt_at TIMESTAMP,
  sent_at TIMESTAMP,
  failure_reason TEXT,
  push_provider VARCHAR(50) NOT NULL CHECK (push_provider IN ('fcm', 'apns')),
  provider_message_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Notification Preferences Extended Table
CREATE TABLE IF NOT EXISTS user_notification_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL UNIQUE,
  provider_id VARCHAR(255) NOT NULL,

  -- Email preferences
  email_address VARCHAR(255),
  email_enabled BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP,

  -- SMS preferences
  phone_number VARCHAR(20),
  sms_enabled BOOLEAN DEFAULT false,
  sms_verified BOOLEAN DEFAULT false,
  sms_verified_at TIMESTAMP,

  -- Push preferences
  push_enabled BOOLEAN DEFAULT false,

  -- Channel-specific quiet hours
  email_quiet_hours_start TIME,
  email_quiet_hours_end TIME,
  sms_quiet_hours_start TIME,
  sms_quiet_hours_end TIME,
  push_quiet_hours_start TIME,
  push_quiet_hours_end TIME,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES notification_preferences(user_id) ON DELETE CASCADE
);

-- Notification Queue Table (for async processing)
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'sms', 'push')),
  provider_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 5,
  next_retry_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Notification Delivery Analytics Table
CREATE TABLE IF NOT EXISTS notification_delivery_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id VARCHAR(255) NOT NULL,
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'sms', 'push')),
  date DATE NOT NULL,

  -- Metrics
  total_sent INT DEFAULT 0,
  total_failed INT DEFAULT 0,
  total_bounced INT DEFAULT 0,
  success_rate DECIMAL(5, 2) DEFAULT 0,

  -- Timing
  avg_delivery_time_ms INT,
  min_delivery_time_ms INT,
  max_delivery_time_ms INT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(provider_id, channel, date)
);

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(100) NOT NULL UNIQUE,
  subject VARCHAR(255) NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  variables JSONB,
  language VARCHAR(10) DEFAULT 'es_CO',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SMS Templates Table
CREATE TABLE IF NOT EXISTS sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(100) NOT NULL UNIQUE,
  message_template TEXT NOT NULL,
  max_length INT DEFAULT 160,
  variables JSONB,
  language VARCHAR(10) DEFAULT 'es_CO',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Push Message Templates Table
CREATE TABLE IF NOT EXISTS push_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  action_url VARCHAR(500),
  icon_url VARCHAR(500),
  image_url VARCHAR(500),
  variables JSONB,
  language VARCHAR(10) DEFAULT 'es_CO',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX idx_email_deliveries_notification_id ON email_deliveries(notification_id);
CREATE INDEX idx_email_deliveries_user_id ON email_deliveries(user_id);
CREATE INDEX idx_email_deliveries_provider_id ON email_deliveries(provider_id);
CREATE INDEX idx_email_deliveries_status ON email_deliveries(status);
CREATE INDEX idx_email_deliveries_created_at ON email_deliveries(created_at);

CREATE INDEX idx_sms_deliveries_notification_id ON sms_deliveries(notification_id);
CREATE INDEX idx_sms_deliveries_user_id ON sms_deliveries(user_id);
CREATE INDEX idx_sms_deliveries_provider_id ON sms_deliveries(provider_id);
CREATE INDEX idx_sms_deliveries_status ON sms_deliveries(status);
CREATE INDEX idx_sms_deliveries_created_at ON sms_deliveries(created_at);

CREATE INDEX idx_push_deliveries_notification_id ON push_deliveries(notification_id);
CREATE INDEX idx_push_deliveries_user_id ON push_deliveries(user_id);
CREATE INDEX idx_push_deliveries_provider_id ON push_deliveries(provider_id);
CREATE INDEX idx_push_deliveries_status ON push_deliveries(status);
CREATE INDEX idx_push_deliveries_created_at ON push_deliveries(created_at);

CREATE INDEX idx_notification_queue_status ON notification_queue(status);
CREATE INDEX idx_notification_queue_channel ON notification_queue(channel);
CREATE INDEX idx_notification_queue_next_retry ON notification_queue(next_retry_at);

CREATE INDEX idx_user_notification_channels_user_id ON user_notification_channels(user_id);
CREATE INDEX idx_user_notification_channels_provider_id ON user_notification_channels(provider_id);

CREATE INDEX idx_delivery_analytics_provider_channel_date ON notification_delivery_analytics(provider_id, channel, date);

-- Views for analytics
CREATE OR REPLACE VIEW email_delivery_stats AS
SELECT
  provider_id,
  DATE(created_at) as delivery_date,
  COUNT(*) as total_emails,
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
  COUNT(CASE WHEN status = 'bounced' THEN 1 END) as bounced,
  ROUND(100.0 * COUNT(CASE WHEN status = 'sent' THEN 1 END) / COUNT(*), 2) as success_rate
FROM email_deliveries
GROUP BY provider_id, DATE(created_at)
ORDER BY delivery_date DESC;

CREATE OR REPLACE VIEW sms_delivery_stats AS
SELECT
  provider_id,
  DATE(created_at) as delivery_date,
  COUNT(*) as total_sms,
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
  COUNT(CASE WHEN status = 'undelivered' THEN 1 END) as undelivered,
  ROUND(100.0 * COUNT(CASE WHEN status = 'sent' THEN 1 END) / COUNT(*), 2) as success_rate
FROM sms_deliveries
GROUP BY provider_id, DATE(created_at)
ORDER BY delivery_date DESC;

CREATE OR REPLACE VIEW push_delivery_stats AS
SELECT
  provider_id,
  DATE(created_at) as delivery_date,
  COUNT(*) as total_pushes,
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
  COUNT(CASE WHEN status = 'invalid_token' THEN 1 END) as invalid_tokens,
  ROUND(100.0 * COUNT(CASE WHEN status = 'sent' THEN 1 END) / COUNT(*), 2) as success_rate
FROM push_deliveries
GROUP BY provider_id, DATE(created_at)
ORDER BY delivery_date DESC;

-- Triggers for updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_deliveries_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_email_deliveries_timestamp
BEFORE UPDATE ON email_deliveries
FOR EACH ROW
EXECUTE FUNCTION update_email_deliveries_timestamp();

CREATE OR REPLACE FUNCTION update_sms_deliveries_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sms_deliveries_timestamp
BEFORE UPDATE ON sms_deliveries
FOR EACH ROW
EXECUTE FUNCTION update_sms_deliveries_timestamp();

CREATE OR REPLACE FUNCTION update_push_deliveries_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_push_deliveries_timestamp
BEFORE UPDATE ON push_deliveries
FOR EACH ROW
EXECUTE FUNCTION update_push_deliveries_timestamp();

-- Additional indexes for queue performance
CREATE INDEX idx_notification_queue_user_id ON notification_queue(user_id);
CREATE INDEX idx_notification_queue_created_at ON notification_queue(created_at);

-- Norma 3100 Compliance Management System - Database Schema
-- PostgreSQL 14+
-- This schema implements event sourcing with immutable audit trail

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Providers (healthcare organizations)
CREATE TABLE IF NOT EXISTS providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut VARCHAR(20) UNIQUE NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    legal_entity_type VARCHAR(50) NOT NULL,

    -- Contact Information
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'Colombia',

    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked', 'pending')),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Locations (physical sites of providers)
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,

    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'Colombia',

    location_type VARCHAR(50) NOT NULL CHECK (location_type IN ('main', 'branch', 'satellite')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),

    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Services (healthcare services offered)
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,

    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'discontinued', 'suspended')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Services Enabled per Provider
CREATE TABLE IF NOT EXISTS services_enabled (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,

    enabled_from DATE NOT NULL DEFAULT CURRENT_DATE,
    enabled_until DATE,

    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,

    UNIQUE(provider_id, service_id, location_id)
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,

    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    role_id UUID,

    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'deleted')),

    last_login TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,

    permissions JSONB DEFAULT '[]',

    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Permissions
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    description TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(action, resource)
);

-- ============================================================
-- EVALUATION & COMPLIANCE TABLES
-- ============================================================

-- Evaluation Criteria
CREATE TABLE IF NOT EXISTS evaluation_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    category VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('critical', 'major', 'minor')),

    reference_norm VARCHAR(100) DEFAULT 'Norma 3100',

    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Findings (compliance findings/deficiencies)
CREATE TABLE IF NOT EXISTS findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,

    finding_number VARCHAR(50) UNIQUE NOT NULL,
    criterion_id UUID NOT NULL REFERENCES evaluation_criteria(id),

    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,

    severity VARCHAR(50) NOT NULL CHECK (severity IN ('critical', 'major', 'minor')),
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'rejected')),

    source VARCHAR(50) NOT NULL CHECK (source IN ('audit', 'assessment', 'external_report', 'internal')),

    found_date DATE NOT NULL,
    due_date DATE,
    resolved_date DATE,

    evidence JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Corrective Actions
CREATE TABLE IF NOT EXISTS corrective_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,

    action_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,

    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    due_date DATE NOT NULL,
    completion_date DATE,

    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'closed', 'overdue')),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),

    evidence JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Documentary Matrix (compliance documentation requirements)
CREATE TABLE IF NOT EXISTS documentary_matrix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_code VARCHAR(50) UNIQUE NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    description TEXT,

    required_by_norm VARCHAR(100) DEFAULT 'Norma 3100',

    document_type VARCHAR(50) NOT NULL,
    retention_years INT DEFAULT 7,

    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Documents (actual documents uploaded by providers)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    document_matrix_id UUID NOT NULL REFERENCES documentary_matrix(id),

    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INT NOT NULL,
    file_hash VARCHAR(255),

    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATE,

    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'archived', 'invalid')),

    uploaded_by UUID NOT NULL REFERENCES users(id),

    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- EVENT STORE (Immutable Audit Trail)
-- ============================================================

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Aggregate identification
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,

    -- Event metadata
    event_type VARCHAR(100) NOT NULL,
    event_version INT DEFAULT 1,

    -- Payload (immutable)
    payload JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',

    -- User & timestamp
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Hash chain for integrity verification
    previous_event_hash VARCHAR(64),
    event_hash VARCHAR(64) UNIQUE NOT NULL,

    -- Immutability enforcement
    is_immutable BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- AUDIT LOGGING
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User & timestamp
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Action
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,

    -- Changes
    changes_before JSONB,
    changes_after JSONB,

    -- Context
    ip_address INET,
    user_agent TEXT,
    session_id UUID,

    -- Status
    status VARCHAR(50) DEFAULT 'success' CHECK (status IN ('success', 'failure', 'denied')),
    error_message TEXT
);

-- User Sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    token_hash VARCHAR(255) UNIQUE NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    ip_address INET,
    user_agent TEXT,

    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked'))
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Providers
CREATE INDEX idx_providers_status ON providers(status);
CREATE INDEX idx_providers_created_at ON providers(created_at DESC);
CREATE INDEX idx_providers_rut ON providers(rut);

-- Locations
CREATE INDEX idx_locations_provider_id ON locations(provider_id);
CREATE INDEX idx_locations_status ON locations(status);

-- Services
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_status ON services(status);

-- Services Enabled
CREATE INDEX idx_services_enabled_provider_id ON services_enabled(provider_id);
CREATE INDEX idx_services_enabled_service_id ON services_enabled(service_id);
CREATE INDEX idx_services_enabled_status ON services_enabled(status);

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider_id ON users(provider_id);
CREATE INDEX idx_users_status ON users(status);

-- Findings
CREATE INDEX idx_findings_provider_id ON findings(provider_id);
CREATE INDEX idx_findings_status ON findings(status);
CREATE INDEX idx_findings_severity ON findings(severity);
CREATE INDEX idx_findings_created_at ON findings(created_at DESC);

-- Corrective Actions
CREATE INDEX idx_corrective_actions_finding_id ON corrective_actions(finding_id);
CREATE INDEX idx_corrective_actions_status ON corrective_actions(status);
CREATE INDEX idx_corrective_actions_assigned_to ON corrective_actions(assigned_to);
CREATE INDEX idx_corrective_actions_due_date ON corrective_actions(due_date);

-- Documents
CREATE INDEX idx_documents_provider_id ON documents(provider_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_upload_date ON documents(upload_date DESC);

-- Events (Event Store indexes)
CREATE INDEX idx_events_aggregate_id ON events(aggregate_id);
CREATE INDEX idx_events_aggregate_type ON events(aggregate_type);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX idx_events_user_id ON events(user_id);

-- Audit Logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- User Sessions
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_status ON user_sessions(status);

-- ============================================================
-- DEFAULT DATA
-- ============================================================

-- Insert default roles
INSERT INTO roles (id, name, description, permissions) VALUES
  ('550e8400-e29b-41d4-a716-446655440000'::UUID, 'ADMIN', 'System administrator with full access', '["*"]'),
  ('550e8400-e29b-41d4-a716-446655440001'::UUID, 'AUDITOR', 'Compliance auditor', '["read:*", "write:findings", "write:actions"]'),
  ('550e8400-e29b-41d4-a716-446655440002'::UUID, 'PROVIDER_ADMIN', 'Provider organization admin', '["read:own", "write:own"]'),
  ('550e8400-e29b-41d4-a716-446655440003'::UUID, 'VIEWER', 'Read-only access', '["read:*"]')
ON CONFLICT DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (action, resource) VALUES
  ('create', 'provider'),
  ('read', 'provider'),
  ('update', 'provider'),
  ('delete', 'provider'),
  ('create', 'finding'),
  ('read', 'finding'),
  ('update', 'finding'),
  ('create', 'corrective_action'),
  ('read', 'corrective_action'),
  ('update', 'corrective_action')
ON CONFLICT DO NOTHING;

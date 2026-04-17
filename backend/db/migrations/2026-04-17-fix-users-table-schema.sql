-- Fix users table schema: add missing columns for role and security
-- Resolves issues with user creation flow
-- Created: 2026-04-17

BEGIN TRANSACTION;

-- 1. Add role column to users table (VARCHAR for direct role assignment)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'provider_admin';

-- 2. Add security-related columns for password and login tracking
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_history TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE users
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Add constraints to ensure valid roles
ALTER TABLE users
ADD CONSTRAINT check_valid_role CHECK (role IN ('super_admin', 'auditor', 'provider_admin'));

-- 4. Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 5. Create index on provider_id for faster filtering by provider
CREATE INDEX IF NOT EXISTS idx_users_provider_id ON users(provider_id);

-- 6. Create index on role for filtering by role
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 7. Create index on status for filtering active users
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 8. Verify constraint on role field for existing data
-- Set any NULL roles to default 'provider_admin'
UPDATE users SET role = 'provider_admin' WHERE role IS NULL;

-- 9. Log migration completion
INSERT INTO migrations (migration_name, applied_at)
VALUES ('2026-04-17-fix-users-table-schema', NOW())
ON CONFLICT DO NOTHING;

COMMIT;

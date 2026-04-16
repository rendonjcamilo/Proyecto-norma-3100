-- Create auditor_providers table (N:M relationship)
-- Auditors can manage multiple providers; providers can have multiple auditors

CREATE TABLE IF NOT EXISTS auditor_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auditor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(auditor_id, provider_id)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_auditor_providers_auditor_id ON auditor_providers(auditor_id);
CREATE INDEX IF NOT EXISTS idx_auditor_providers_provider_id ON auditor_providers(provider_id);

-- Migrate existing auditor-provider relationships from users.provider_id
-- Only for users with role 'auditor' who have a provider_id set
INSERT INTO auditor_providers (auditor_id, provider_id)
SELECT id, provider_id FROM users
WHERE role = 'auditor' AND provider_id IS NOT NULL
ON CONFLICT (auditor_id, provider_id) DO NOTHING;

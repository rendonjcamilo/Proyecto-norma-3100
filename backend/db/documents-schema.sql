-- ============================================
-- DOCUMENTARY MATRIX SCHEMA (Phase 4.1)
-- Norma 3100 - 108 required documents tracking
-- ============================================

-- Document catalog: master list of all documents required by Norma 3100
CREATE TABLE IF NOT EXISTS document_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    standard_reference VARCHAR(100),
    is_mandatory BOOLEAN NOT NULL DEFAULT true,
    expiry_months INTEGER,
    applies_to_all BOOLEAN NOT NULL DEFAULT true,
    service_group VARCHAR(50),
    complexity_level VARCHAR(20),
    version INTEGER NOT NULL DEFAULT 1,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_catalog_category ON document_catalog(category);
CREATE INDEX IF NOT EXISTS idx_document_catalog_mandatory ON document_catalog(is_mandatory, active);
CREATE INDEX IF NOT EXISTS idx_document_catalog_code ON document_catalog(code);

-- Provider documents: actual uploaded documents per provider
CREATE TABLE IF NOT EXISTS provider_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    document_catalog_id UUID NOT NULL REFERENCES document_catalog(id),
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    checksum_sha256 VARCHAR(64) NOT NULL,
    issue_date DATE,
    expiry_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'compliant', 'expired', 'rejected', 'under_review')),
    validation_notes TEXT,
    validated_by UUID,
    validated_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1,
    previous_version_id UUID REFERENCES provider_documents(id) ON DELETE SET NULL,
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_documents_provider ON provider_documents(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_documents_catalog ON provider_documents(document_catalog_id);
CREATE INDEX IF NOT EXISTS idx_provider_documents_status ON provider_documents(status);
CREATE INDEX IF NOT EXISTS idx_provider_documents_expiry ON provider_documents(expiry_date)
    WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_provider_documents_checksum ON provider_documents(checksum_sha256);

-- Document version history view
CREATE OR REPLACE VIEW provider_documents_latest AS
SELECT DISTINCT ON (pd.provider_id, pd.document_catalog_id)
    pd.*,
    dc.name AS document_name,
    dc.category AS document_category,
    dc.is_mandatory,
    dc.expiry_months,
    CASE
        WHEN pd.expiry_date IS NOT NULL AND pd.expiry_date < CURRENT_DATE THEN 'expired'
        WHEN pd.expiry_date IS NOT NULL AND pd.expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
        ELSE pd.status
    END AS computed_status
FROM provider_documents pd
INNER JOIN document_catalog dc ON dc.id = pd.document_catalog_id
ORDER BY pd.provider_id, pd.document_catalog_id, pd.version DESC, pd.created_at DESC;

-- Document compliance summary per provider
CREATE OR REPLACE VIEW provider_document_compliance AS
SELECT
    p.id AS provider_id,
    p.legal_name AS provider_name,
    COUNT(dc.id) AS total_required,
    COUNT(DISTINCT pdl.id) FILTER (WHERE pdl.computed_status = 'compliant') AS compliant_count,
    COUNT(DISTINCT pdl.id) FILTER (WHERE pdl.computed_status = 'expired') AS expired_count,
    COUNT(DISTINCT pdl.id) FILTER (WHERE pdl.computed_status = 'expiring_soon') AS expiring_soon_count,
    COUNT(DISTINCT pdl.id) FILTER (WHERE pdl.computed_status = 'pending') AS pending_count,
    COUNT(DISTINCT pdl.id) FILTER (WHERE pdl.computed_status = 'rejected') AS rejected_count,
    CASE
        WHEN COUNT(dc.id) > 0 THEN
            ROUND((COUNT(DISTINCT pdl.id) FILTER (WHERE pdl.computed_status = 'compliant')::NUMERIC / COUNT(dc.id)) * 100, 2)
        ELSE 0
    END AS compliance_percentage
FROM providers p
CROSS JOIN document_catalog dc
LEFT JOIN provider_documents_latest pdl
    ON pdl.provider_id = p.id AND pdl.document_catalog_id = dc.id
WHERE dc.active = true AND dc.is_mandatory = true
GROUP BY p.id, p.legal_name;

-- ============================================================
-- Migración: Carpeta libre "Sistema de Información"
-- Nueva tabla para documentos sin slot predefinido en el catálogo
-- Solo aplica a IPS en la parte documental
-- ============================================================

CREATE TABLE IF NOT EXISTS provider_free_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id     UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    category        VARCHAR(100) NOT NULL DEFAULT 'Sistema de Información',
    filename        VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type       VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    storage_path    TEXT NOT NULL,
    checksum_sha256 VARCHAR(64),
    description     TEXT,
    uploaded_by     UUID NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pfd_provider_category
    ON provider_free_documents(provider_id, category);

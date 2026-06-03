-- Migración: soporte para documentos enlazados desde Google Drive
-- Los campos de archivo pasan a ser opcionales cuando se usa external_url

ALTER TABLE provider_documents ADD COLUMN IF NOT EXISTS external_url TEXT;

-- Permitir NULL en campos de archivo (solo requeridos cuando no hay external_url)
ALTER TABLE provider_documents ALTER COLUMN filename DROP NOT NULL;
ALTER TABLE provider_documents ALTER COLUMN original_filename DROP NOT NULL;
ALTER TABLE provider_documents ALTER COLUMN mime_type DROP NOT NULL;
ALTER TABLE provider_documents ALTER COLUMN file_size_bytes DROP NOT NULL;
ALTER TABLE provider_documents ALTER COLUMN storage_path DROP NOT NULL;
ALTER TABLE provider_documents ALTER COLUMN checksum_sha256 DROP NOT NULL;

-- Garantizar que siempre exista al menos una fuente (archivo o enlace)
ALTER TABLE provider_documents DROP CONSTRAINT IF EXISTS chk_doc_source;
ALTER TABLE provider_documents ADD CONSTRAINT chk_doc_source CHECK (
  external_url IS NOT NULL
  OR (filename IS NOT NULL AND storage_path IS NOT NULL AND checksum_sha256 IS NOT NULL)
);

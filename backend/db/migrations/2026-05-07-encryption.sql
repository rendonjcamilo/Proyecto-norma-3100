-- Habilitar extensión pgcrypto para funciones de criptografía a nivel BD
-- Permite: gen_random_bytes(), pgp_sym_encrypt/decrypt, digest(), hmac()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Registro de configuración de cifrado (auditoría de cuándo se habilitó y con qué versión de clave)
-- No almacena claves — solo metadatos de gestión
CREATE TABLE IF NOT EXISTS encryption_metadata (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_version   INT NOT NULL DEFAULT 1,
    algorithm     VARCHAR(50) NOT NULL DEFAULT 'AES-256-GCM',
    enabled_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    enabled_by    UUID REFERENCES users(id) ON DELETE SET NULL,
    notes         TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE encryption_metadata IS
  'Registro de versiones de clave de cifrado. No almacena claves reales — solo metadatos.';

-- Insertar registro inicial (clave v1 habilitada con migración)
INSERT INTO encryption_metadata (key_version, algorithm, notes)
VALUES (1, 'AES-256-GCM', 'Clave inicial — habilitada con migración Phase 6.1.2')
ON CONFLICT DO NOTHING;

-- Índice para consultas de estado activo
CREATE INDEX IF NOT EXISTS idx_encryption_metadata_active
    ON encryption_metadata (is_active, key_version DESC);

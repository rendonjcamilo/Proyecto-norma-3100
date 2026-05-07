-- Tabla de tokens revocados para logout real y rotación de refresh tokens
-- Soporta revocación de access tokens (por JTI) y refresh tokens
CREATE TABLE IF NOT EXISTS revoked_tokens (
  jti         UUID        PRIMARY KEY,
  user_id     UUID        NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para limpiar entradas expiradas eficientemente
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires_at ON revoked_tokens (expires_at);

-- Función para limpiar tokens ya expirados (llamada periódicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_revoked_tokens() RETURNS void AS $$
BEGIN
  DELETE FROM revoked_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

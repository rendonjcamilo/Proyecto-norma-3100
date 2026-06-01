-- =============================================================================
-- Migración: Tabla de clientes personales del auditor
-- Cada auditor mantiene su propia agenda de prestadores recurrentes
-- =============================================================================

CREATE TABLE IF NOT EXISTS auditor_clients (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rut                           VARCHAR(50),
  legal_name                    VARCHAR(255) NOT NULL,
  address                       VARCHAR(255),
  city                          VARCHAR(100),
  department                    VARCHAR(100),
  email                         VARCHAR(255),
  phone                         VARCHAR(50),
  nombre_sede                   VARCHAR(255),
  codigo_habilitacion           VARCHAR(100),
  tipo_prestador                VARCHAR(100),
  habilitacion_fecha_vencimiento DATE,
  notes                         TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditor_clients_user_id ON auditor_clients(user_id);

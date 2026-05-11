-- Anexo 4: Verificación Estándar de Historia Clínica y Registros Asistenciales
-- Formulario independiente (no ligado a un prestador específico)

CREATE TABLE IF NOT EXISTS anexo4_verificaciones (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio      VARCHAR(200) NOT NULL,
  fecha         DATE        NOT NULL DEFAULT CURRENT_DATE,
  auditor_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
  -- Array JSONB de hasta 10 registros: [{numero_hc, nombre_usuario, criterios:{key: 'C'|'NC'|null}}]
  registros     JSONB       NOT NULL DEFAULT '[]',
  observaciones TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anexo4_fecha     ON anexo4_verificaciones (fecha DESC);
CREATE INDEX IF NOT EXISTS idx_anexo4_auditor   ON anexo4_verificaciones (auditor_id);

-- REPS Alert Triggers: cron de prospección automática por vencimiento de habilitación
-- Permite agendar una consulta diaria al REPS para alertar sobre prestadores próximos a vencer

CREATE TABLE IF NOT EXISTS reps_alert_triggers (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  departamento         VARCHAR(100),
  municipio            VARCHAR(100),
  clase_prestador      VARCHAR(200),
  max_providers        INTEGER     NOT NULL DEFAULT 500,
  dias_antes_vencer    INTEGER     NOT NULL DEFAULT 30,
  solo_con_celular     BOOLEAN     NOT NULL DEFAULT true,
  hora_local           SMALLINT    NOT NULL DEFAULT 9 CHECK (hora_local BETWEEN 0 AND 23),
  is_active            BOOLEAN     NOT NULL DEFAULT false,
  last_run_at          TIMESTAMPTZ,
  last_run_total       INTEGER,
  last_run_por_vencer  INTEGER,
  last_run_con_celular INTEGER,
  last_run_error       TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE reps_alert_triggers IS 'Configuración del cron diario de alerta por vencimiento de habilitación en REPS';

CREATE TABLE IF NOT EXISTS reps_trigger_results (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_id        UUID        NOT NULL REFERENCES reps_alert_triggers(id) ON DELETE CASCADE,
  run_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_consultados INTEGER     NOT NULL DEFAULT 0,
  total_por_vencer  INTEGER     NOT NULL DEFAULT 0,
  con_celular       INTEGER     NOT NULL DEFAULT 0,
  providers         JSONB       NOT NULL DEFAULT '[]'::jsonb,
  error             TEXT
);

CREATE INDEX IF NOT EXISTS idx_reps_trigger_results_tid_run
  ON reps_trigger_results (trigger_id, run_at DESC);

COMMENT ON TABLE reps_trigger_results IS 'Resultados de cada ejecución del cron de alerta REPS';

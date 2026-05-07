-- reps_enriched: caché de fechas de vencimiento REPS por NIT
-- Almacena resultados de scraping del portal MINSALUD y entradas manuales
-- para no repetir consultas innecesarias al portal.

CREATE TABLE IF NOT EXISTS reps_enriched (
  nit                  VARCHAR(20)   PRIMARY KEY,
  fecha_vencimiento    DATE,
  codigo_habilitacion  VARCHAR(100),
  nombre_prestador     VARCHAR(400),
  fuente               VARCHAR(50)   NOT NULL DEFAULT 'manual',
  enriquecido_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  expira_at            TIMESTAMPTZ   NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  intentos_fallidos    INTEGER       NOT NULL DEFAULT 0,
  ultimo_error         TEXT
);

COMMENT ON TABLE reps_enriched IS
  'Caché de fechas de vencimiento REPS. fuente: minsalud_scrape | manual';

CREATE INDEX IF NOT EXISTS idx_reps_enriched_vencimiento
  ON reps_enriched(fecha_vencimiento)
  WHERE fecha_vencimiento IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reps_enriched_expira
  ON reps_enriched(expira_at);

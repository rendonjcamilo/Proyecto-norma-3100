-- Agrega representante_legal a providers y reps_enriched
ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS representante_legal VARCHAR(255);

ALTER TABLE reps_enriched
  ADD COLUMN IF NOT EXISTS representante_legal VARCHAR(255);

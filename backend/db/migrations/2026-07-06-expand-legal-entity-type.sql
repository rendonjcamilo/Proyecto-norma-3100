-- Amplía legal_entity_type de VARCHAR(50) a VARCHAR(255)
-- REPS devuelve tipos como "INSTITUCION PRESTADORA DE SERVICIOS DE SALUD" que superan 50 chars

ALTER TABLE providers
  ALTER COLUMN legal_entity_type TYPE VARCHAR(255);

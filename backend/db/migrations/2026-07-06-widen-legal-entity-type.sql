-- Amplía providers.legal_entity_type: REPS (datos.gov.co, dataset c36g-9fc2) reporta
-- categorías de "clase de prestador" de hasta 61 caracteres, ej.:
--   "Objeto Social Diferente a la Prestación de Servicios de Salud" (61)
--   "Instituciones Prestadoras de Servicios de Salud - IPS" (53)
-- que excedían VARCHAR(50) y hacían fallar "Crear Prestador" al autocompletar desde REPS.
ALTER TABLE providers ALTER COLUMN legal_entity_type TYPE VARCHAR(255);

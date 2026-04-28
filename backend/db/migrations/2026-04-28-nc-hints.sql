-- Migración: columna nc_hint en evaluation_criteria
-- Almacena la observación de no cumplimiento pre-generada por IA para cada criterio.
-- Se usa como sugerencia en el botón "Sugerir" del modal NC durante la autoevaluación.
ALTER TABLE evaluation_criteria
  ADD COLUMN IF NOT EXISTS nc_hint TEXT;

COMMENT ON COLUMN evaluation_criteria.nc_hint IS
  'Observación de no cumplimiento pre-generada por IA (Claude). '
  'Redactada en español formal colombiano, gramáticamente correcta y sin contradicción interna. '
  'Se usa como sugerencia editable para el auditor/prestador al marcar un criterio como NC.';

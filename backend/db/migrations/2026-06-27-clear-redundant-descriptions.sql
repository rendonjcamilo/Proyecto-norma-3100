-- Migración: limpiar descriptions redundantes en evaluation_criteria
-- Los criterios oficiales de la Res. 3100 tienen description = name (misma cadena).
-- Mostrar ambos causa duplicación visual en el formulario de evaluación.
-- Esta migración vacía description donde es semánticamente idéntico a name.

UPDATE evaluation_criteria
SET description = ''
WHERE description IS NOT NULL
  AND description <> ''
  AND LOWER(REGEXP_REPLACE(TRIM(description), '\s+', ' ', 'g'))
    = LOWER(REGEXP_REPLACE(TRIM(name), '\s+', ' ', 'g'));

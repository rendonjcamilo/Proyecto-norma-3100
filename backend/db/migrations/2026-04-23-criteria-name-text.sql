-- Migración: ampliar columna name de evaluation_criteria y evaluation_standards a TEXT
-- VARCHAR(255) estaba truncando los textos de la Norma 3100 (algunos superan 255 caracteres)

ALTER TABLE evaluation_criteria ALTER COLUMN name TYPE TEXT;

ALTER TABLE evaluation_criteria ALTER COLUMN description TYPE TEXT;

ALTER TABLE evaluation_criteria ALTER COLUMN evidence_requirement TYPE TEXT;

ALTER TABLE evaluation_standards ALTER COLUMN name TYPE TEXT;

ALTER TABLE evaluation_standards ALTER COLUMN description TYPE TEXT;

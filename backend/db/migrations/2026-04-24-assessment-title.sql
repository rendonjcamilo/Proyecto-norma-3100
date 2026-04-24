-- Migración: agregar columna title a assessments
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS title VARCHAR(255);

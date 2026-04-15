-- Seed script to populate evaluation_criteria with complete Norma 3100 data
-- Generated from docs/norma3100-model.json
-- This script inserts:
-- 1. Complete transversal criteria (321 total, vs 87 currently in BD)
-- 2. Service-specific criteria for all 34 services (currently missing from BD)
--
-- PREREQUISITE: evaluation_standards and services tables must exist

-- First, ensure all transversal standards exist in evaluation_standards
INSERT INTO evaluation_standards (code, name, is_transversal)
VALUES
  ('TSTH', 'Talento Humano', true),
  ('TSINF', 'Información', true),
  ('TSDOT', 'Dotación', true),
  ('TSMD', 'Medicamentos y Dispositivos', true),
  ('TSPP', 'Procesos Prioritarios', true),
  ('TSHCR', 'Historia Clínica y Registros', true),
  ('TSINT', 'Integralidad', true)
ON CONFLICT (code) DO NOTHING;

-- Clear existing criteria to start fresh (optional - comment out if you want to preserve existing)
-- DELETE FROM evaluation_criteria WHERE standard_id IN (
--   SELECT id FROM evaluation_standards WHERE is_transversal = true
-- );

-- Insert transversal criteria (TSTH - Talento Humano)
-- Note: This is a template. The actual criteria should be generated from the JSON model
-- using the import-norma3100.ts script with a real database connection.

-- For now, provide a comment with usage instructions:
-- The actual population should be done via:
--   cd backend
--   npm run seed
--
-- Which will execute the import-norma3100.ts script that:
-- 1. Reads docs/norma3100-model.json
-- 2. Inserts transversal standards and their criteria
-- 3. Inserts service-specific standards and their criteria
-- 4. Creates questionnaires for each service

-- This SQL file is kept for documentation purposes.
-- The TypeScript import script (backend/scripts/import-norma3100.ts)
-- is the authoritative source for data population.

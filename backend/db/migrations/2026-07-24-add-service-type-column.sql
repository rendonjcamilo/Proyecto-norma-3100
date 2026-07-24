-- Distinguishes the 157 real REPS services from the 39 internal "capitulo de cumplimiento"
-- rows that share the `services` table (see CONTEXT.md). Purely additive: does NOT touch any
-- existing FK reference (assessments, findings, services_enabled, capacidad_instalada_servicios,
-- evaluation_criteria, evaluation_standards, questionnaires all keep pointing at the exact same
-- service_id values as before this migration -- nothing is deleted or re-pointed).
--
-- Verified against PROD (read-only, 2026-07-24) before writing this: CEE, CEG, GNT and IDX
-- (capitulo rows) are already referenced by real assessments in production (8 total). Any future
-- migration that deletes or re-points those rows must account for those real assessments first --
-- this migration deliberately does not attempt that.
ALTER TABLE services ADD COLUMN IF NOT EXISTS type VARCHAR(30) NOT NULL DEFAULT 'reps_service';

UPDATE services SET type = 'compliance_chapter' WHERE code ~ '^[A-Z]' AND type <> 'compliance_chapter';

ALTER TABLE services DROP CONSTRAINT IF EXISTS services_type_check;
ALTER TABLE services ADD CONSTRAINT services_type_check CHECK (type IN ('reps_service', 'compliance_chapter'));

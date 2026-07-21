-- Removes the 157 "fictitious" placeholder services (codes CX-*/AD-*/INT-*/QX-*/AI-*) that
-- backend/db/migrations/2026-04-24-reps-services.sql already declared obsolete and superseded by
-- the 157 official numeric REPS codes ("reemplazar 157 servicios ficticios por los 157 servicios
-- oficiales REPS"), but which kept getting silently re-inserted on every deploy because the
-- migration runner (backend/db/migrations.ts) had no already-applied guard before this fix
-- (2026-07-21) -- schema-phase3.sql's seed data for them ran unconditionally every time.
--
-- Verified 2026-07-21: all 157 rows have zero evaluation_criteria attached (dead data), and
-- exactly one real services_enabled reference existed (provider "adri", a test provider, had
-- AD-018 "Uroanálisis" marked as enabled -- a fictitious, content-less service). That reference
-- is removed first so the services delete cascades cleanly.
DELETE FROM services_enabled
WHERE service_id IN (
  SELECT id FROM services WHERE code ~ '^(CX|AD|INT|QX|AI)-[0-9]+$'
);

DELETE FROM services
WHERE code ~ '^(CX|AD|INT|QX|AI)-[0-9]+$';

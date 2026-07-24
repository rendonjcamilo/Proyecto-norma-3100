-- A provider should never have a "capitulo de cumplimiento" (services.type='compliance_chapter')
-- marked as an enabled REPS service -- that is exactly the "se mezcla con los grupos de
-- servicios" bug this whole fix addresses. Soft-deletes (does not hard-delete, preserving the
-- audit trail) any such existing services_enabled row, the same way unassignServiceFromProvider
-- already does elsewhere in this codebase.
--
-- Found in dev: 2 rows (provider BEEPYRED ISP GROUP SAS -> IDX, provider CAMILO ERNESTO CABRERA
-- HURTADO -> CEE). PROD has the same 2 chapter codes (CEE, IDX) with 1 services_enabled row each
-- (verified read-only 2026-07-24) -- re-run this same migration against prod when this whole
-- change ships there, to soft-deactivate the equivalent prod rows.
UPDATE services_enabled
SET status = 'inactive', enabled_until = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP
WHERE service_id IN (SELECT id FROM services WHERE type = 'compliance_chapter') AND status = 'active';

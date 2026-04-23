-- Migración: adaptar tabla findings para auto-generacion desde AssessmentService.submitAssessment()
-- El esquema original fue disenado para hallazgos manuales (ahora se generan automaticamente)

ALTER TABLE findings ALTER COLUMN finding_number SET DEFAULT ('F-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 8));

ALTER TABLE findings ALTER COLUMN title DROP NOT NULL;

ALTER TABLE findings DROP CONSTRAINT IF EXISTS findings_severity_check;

ALTER TABLE findings DROP CONSTRAINT IF EXISTS findings_status_check;

ALTER TABLE findings DROP CONSTRAINT IF EXISTS findings_source_check;

ALTER TABLE findings ADD CONSTRAINT findings_severity_check CHECK (severity IN ('crítica', 'alta', 'media', 'baja', 'pendiente', 'critical', 'major', 'minor'));

ALTER TABLE findings ADD CONSTRAINT findings_status_check CHECK (status IN ('abierta', 'en_revision', 'asignada', 'en_progreso', 'cerrada', 'open', 'in_progress', 'resolved', 'closed', 'rejected'));

ALTER TABLE findings ALTER COLUMN source DROP NOT NULL;

ALTER TABLE findings ALTER COLUMN found_date DROP NOT NULL;

ALTER TABLE findings ALTER COLUMN found_date SET DEFAULT CURRENT_DATE;

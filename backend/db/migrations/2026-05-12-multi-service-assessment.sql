-- Allows assessments to be linked to multiple specific services at once
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS service_ids JSONB DEFAULT '[]'::jsonb;

-- Backfill existing single-service assessments
UPDATE assessments
SET service_ids = jsonb_build_array(service_id::text)
WHERE service_id IS NOT NULL
  AND (service_ids IS NULL OR service_ids = '[]'::jsonb);

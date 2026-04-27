-- Migración: normalizar findings a inglés (severity y status)
-- Elimina doble sistema español/inglés y unifica en inglés

-- 1. Quitar constraints existentes
ALTER TABLE findings DROP CONSTRAINT IF EXISTS findings_severity_check;
ALTER TABLE findings DROP CONSTRAINT IF EXISTS findings_status_check;

-- 2. Migrar severity de español a inglés
UPDATE findings SET severity = 'critical' WHERE severity IN ('crítica', 'critica');
UPDATE findings SET severity = 'high'     WHERE severity IN ('alta', 'major');
UPDATE findings SET severity = 'medium'   WHERE severity IN ('media', 'minor', 'pendiente');
UPDATE findings SET severity = 'low'      WHERE severity = 'baja';

-- 3. Migrar status de español a inglés
UPDATE findings SET status = 'open'        WHERE status IN ('abierta');
UPDATE findings SET status = 'in_progress' WHERE status IN ('en_revision', 'asignada', 'en_progreso', 'en_proceso');
UPDATE findings SET status = 'closed'      WHERE status = 'cerrada';

-- 4. Agregar constraints normalizados
ALTER TABLE findings ADD CONSTRAINT findings_severity_check
  CHECK (severity IN ('critical', 'high', 'medium', 'low'));

ALTER TABLE findings ADD CONSTRAINT findings_status_check
  CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'rejected'));

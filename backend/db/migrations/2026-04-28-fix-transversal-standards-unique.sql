-- Fix: impedir estándares transversales duplicados
-- NULL != NULL en PostgreSQL, por lo que la restricción UNIQUE (code, service_id) no evita
-- duplicados cuando service_id IS NULL. Este índice parcial lo soluciona.
CREATE UNIQUE INDEX IF NOT EXISTS idx_evaluation_standards_transversal_unique
ON evaluation_standards (code)
WHERE is_transversal = true AND service_id IS NULL;

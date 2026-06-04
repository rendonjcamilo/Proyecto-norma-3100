-- Agrega estado 'not_applicable' a documentos
-- El auditor puede marcar documentos que no aplican para el prestador
-- Estos se excluyen del cálculo de cumplimiento

-- 1. Actualizar constraint de status para incluir not_applicable
ALTER TABLE provider_documents
  DROP CONSTRAINT IF EXISTS provider_documents_status_check;

ALTER TABLE provider_documents
  ADD CONSTRAINT provider_documents_status_check
  CHECK (status IN ('pending', 'compliant', 'expired', 'rejected', 'under_review', 'not_applicable'));

-- 2. Reconstruir vista de cumplimiento excluyendo not_applicable del denominador
CREATE OR REPLACE VIEW provider_document_compliance AS
SELECT
    p.id AS provider_id,
    p.legal_name AS provider_name,
    COUNT(dc.id) AS total_required,
    COUNT(DISTINCT pdl.id) FILTER (WHERE pdl.computed_status = 'not_applicable') AS not_applicable_count,
    COUNT(DISTINCT pdl.id) FILTER (WHERE pdl.computed_status = 'compliant') AS compliant_count,
    COUNT(DISTINCT pdl.id) FILTER (WHERE pdl.computed_status = 'expired') AS expired_count,
    COUNT(DISTINCT pdl.id) FILTER (WHERE pdl.computed_status = 'expiring_soon') AS expiring_soon_count,
    COUNT(DISTINCT pdl.id) FILTER (WHERE pdl.computed_status = 'pending') AS pending_count,
    COUNT(DISTINCT pdl.id) FILTER (WHERE pdl.computed_status = 'rejected') AS rejected_count,
    CASE
        WHEN (COUNT(dc.id) - COUNT(DISTINCT pdl.id) FILTER (WHERE pdl.computed_status = 'not_applicable')) > 0 THEN
            ROUND(
                (COUNT(DISTINCT pdl.id) FILTER (WHERE pdl.computed_status = 'compliant')::NUMERIC /
                 (COUNT(dc.id) - COUNT(DISTINCT pdl.id) FILTER (WHERE pdl.computed_status = 'not_applicable')))
                * 100, 2
            )
        ELSE 0
    END AS compliance_percentage
FROM providers p
CROSS JOIN document_catalog dc
LEFT JOIN provider_documents_latest pdl
    ON pdl.provider_id = p.id AND pdl.document_catalog_id = dc.id
WHERE dc.active = true AND dc.is_mandatory = true
GROUP BY p.id, p.legal_name;

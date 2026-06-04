-- Migración: permitir verificación física sin archivo ni enlace externo
-- Caso de uso: extintores, señalización y otros ítems que solo requieren
-- confirmación presencial del auditor, sin soporte digital adjunto.

ALTER TABLE provider_documents DROP CONSTRAINT IF EXISTS chk_doc_source;

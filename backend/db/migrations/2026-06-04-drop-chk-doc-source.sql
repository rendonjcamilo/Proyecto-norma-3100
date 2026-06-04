-- Eliminar constraint chk_doc_source para permitir verificaciones físicas sin archivo
-- Caso de uso: extintores, señalización y otros ítems que el auditor verifica
-- presencialmente sin adjuntar ningún soporte digital.
-- Este archivo corre DESPUÉS de documents-external-url.sql para sobrescribirlo.

ALTER TABLE provider_documents DROP CONSTRAINT IF EXISTS chk_doc_source;

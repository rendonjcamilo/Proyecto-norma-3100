-- ============================================================
-- Migración: Subdivide "Calidad Laboratorio (Res. 1619)" en
-- 4 secciones normativas según Res. 1619 de 2015
-- + Agrega sección faltante: Referencia y Contrarreferencia (4 docs)
-- + Agrega Lista de chequeo auditoría de laboratorios clínicos v1.0
-- ============================================================

-- ── 1. RECLASIFICAR DOCUMENTOS EXISTENTES ────────────────────

-- IPS: Organización y Gestión (001–042)
UPDATE document_catalog
SET category = 'Lab. Clínico — Organización y Gestión'
WHERE code LIKE 'IPS-L19-%'
  AND code BETWEEN 'IPS-L19-001' AND 'IPS-L19-042';

-- IPS: Talento Humano (043–051)
UPDATE document_catalog
SET category = 'Lab. Clínico — Talento Humano'
WHERE code LIKE 'IPS-L19-%'
  AND code BETWEEN 'IPS-L19-043' AND 'IPS-L19-051';

-- IPS: Infraestructura y Dotación (052–056)
UPDATE document_catalog
SET category = 'Lab. Clínico — Infraestructura y Dotación'
WHERE code LIKE 'IPS-L19-%'
  AND code BETWEEN 'IPS-L19-052' AND 'IPS-L19-056';

-- Independiente: Organización y Gestión (001–042)
UPDATE document_catalog
SET category = 'Lab. Clínico — Organización y Gestión'
WHERE code LIKE 'IND-L19-%'
  AND code BETWEEN 'IND-L19-001' AND 'IND-L19-042';

-- Independiente: Talento Humano (043–051)
UPDATE document_catalog
SET category = 'Lab. Clínico — Talento Humano'
WHERE code LIKE 'IND-L19-%'
  AND code BETWEEN 'IND-L19-043' AND 'IND-L19-051';

-- Independiente: Infraestructura y Dotación (052–056)
UPDATE document_catalog
SET category = 'Lab. Clínico — Infraestructura y Dotación'
WHERE code LIKE 'IND-L19-%'
  AND code BETWEEN 'IND-L19-052' AND 'IND-L19-056';

-- ── 2. AGREGAR SECCIÓN FALTANTE: REFERENCIA Y CONTRARREFERENCIA ──

INSERT INTO document_catalog
  (code, name, description, category, standard_reference, is_mandatory, applies_to_all, provider_type)
VALUES
  -- IPS
  ('IPS-L19-057', 'Procedimientos de referencia y contrarreferencia de laboratorio',
   'Procedimiento documentado de referencia y contrarreferencia de muestras entre laboratorios de la red, incluyendo criterios de selección, condiciones de envío y responsables.',
   'Lab. Clínico — Referencia y Contrarreferencia', 'LAB19', true, true, 'ips'),
  ('IPS-L19-058', 'Procedimiento de recepción de resultados de muestras remitidas',
   'Procedimiento que establece los criterios y responsabilidades para la recepción, verificación y registro de resultados de muestras enviadas a otros laboratorios de la red.',
   'Lab. Clínico — Referencia y Contrarreferencia', 'LAB19', true, true, 'ips'),
  ('IPS-L19-059', 'Registros de temperatura de las muestras remitidas',
   'Registros de control de temperatura de los medios isotérmicos utilizados para el transporte de muestras remitidas a otros laboratorios de la red.',
   'Lab. Clínico — Referencia y Contrarreferencia', 'LAB19', true, true, 'ips'),
  ('IPS-L19-060', 'Registros o actas de disposición final de muestras',
   'Registros o actas de disposición final de muestras de los últimos 3 meses, incluyendo destrucción, devolución o archivo conforme a la normativa vigente.',
   'Lab. Clínico — Referencia y Contrarreferencia', 'LAB19', true, true, 'ips'),

  -- Independiente
  ('IND-L19-057', 'Procedimientos de referencia y contrarreferencia de laboratorio',
   'Procedimiento documentado de referencia y contrarreferencia de muestras entre laboratorios de la red, incluyendo criterios de selección, condiciones de envío y responsables.',
   'Lab. Clínico — Referencia y Contrarreferencia', 'LAB19', true, true, 'independiente'),
  ('IND-L19-058', 'Procedimiento de recepción de resultados de muestras remitidas',
   'Procedimiento que establece los criterios y responsabilidades para la recepción, verificación y registro de resultados de muestras enviadas a otros laboratorios de la red.',
   'Lab. Clínico — Referencia y Contrarreferencia', 'LAB19', true, true, 'independiente'),
  ('IND-L19-059', 'Registros de temperatura de las muestras remitidas',
   'Registros de control de temperatura de los medios isotérmicos utilizados para el transporte de muestras remitidas a otros laboratorios de la red.',
   'Lab. Clínico — Referencia y Contrarreferencia', 'LAB19', true, true, 'independiente'),
  ('IND-L19-060', 'Registros o actas de disposición final de muestras',
   'Registros o actas de disposición final de muestras de los últimos 3 meses, incluyendo destrucción, devolución o archivo conforme a la normativa vigente.',
   'Lab. Clínico — Referencia y Contrarreferencia', 'LAB19', true, true, 'independiente')
ON CONFLICT (code) DO NOTHING;

-- ── 3. AGREGAR LISTA DE CHEQUEO AUDITORÍA v1.0 ───────────────

INSERT INTO document_catalog
  (code, name, description, category, standard_reference, is_mandatory, applies_to_all, provider_type)
VALUES
  ('IPS-L19-061', 'Lista de chequeo auditoría de laboratorios clínicos v1.0',
   'Herramienta de verificación de estándares de calidad para laboratorios clínicos — Resolución 1619 de 2015. Versión 1.0 para auditorías presenciales y no presenciales. Cubre los 4 estándares: Organización y Gestión, Talento Humano, Infraestructura y Dotación, y Referencia y Contrarreferencia.',
   'Lab. Clínico — Organización y Gestión', 'LAB19', true, true, 'ips'),
  ('IND-L19-061', 'Lista de chequeo auditoría de laboratorios clínicos v1.0',
   'Herramienta de verificación de estándares de calidad para laboratorios clínicos — Resolución 1619 de 2015. Versión 1.0 para auditorías presenciales y no presenciales. Cubre los 4 estándares: Organización y Gestión, Talento Humano, Infraestructura y Dotación, y Referencia y Contrarreferencia.',
   'Lab. Clínico — Organización y Gestión', 'LAB19', true, true, 'independiente')
ON CONFLICT (code) DO NOTHING;

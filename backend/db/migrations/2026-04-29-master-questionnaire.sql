-- Migración: Cuestionario Maestro Res. 3100/2019
-- Problema raíz: questionnaires.service_id era NOT NULL pero el diseño requiere
-- un cuestionario maestro sin servicio (service_id IS NULL) que contiene los
-- 512 criterios transversales y se reutiliza para TODAS las evaluaciones.

-- 1. Permitir service_id NULL (cuestionarios maestros sin servicio específico)
ALTER TABLE questionnaires ALTER COLUMN service_id DROP NOT NULL;

-- 2. Reemplazar la restricción UNIQUE anterior por índices parciales correctos
ALTER TABLE questionnaires DROP CONSTRAINT IF EXISTS questionnaires_service_id_version_type_key;

-- Un solo cuestionario maestro por version_type (cuando service_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_questionnaires_master_version_unique
  ON questionnaires (version_type)
  WHERE service_id IS NULL;

-- Un cuestionario por servicio+versión (cuando service_id IS NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_questionnaires_service_version_unique
  ON questionnaires (service_id, version_type)
  WHERE service_id IS NOT NULL;

-- 3. Crear y publicar el cuestionario maestro inicial
DO $$
DECLARE
  quest_id  uuid;
  admin_id  uuid;
  n_criterios integer;
BEGIN
  -- Obtener usuario admin (preferir admin@prueba.com, sino cualquier ADMIN)
  SELECT id INTO admin_id FROM users WHERE email = 'admin@prueba.com' LIMIT 1;
  IF admin_id IS NULL THEN
    SELECT u.id INTO admin_id
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE r.name = 'ADMIN'
    LIMIT 1;
  END IF;

  -- Contar criterios transversales activos
  SELECT COUNT(*) INTO n_criterios
  FROM evaluation_criteria ec
  JOIN evaluation_standards es ON ec.standard_id = es.id
  WHERE es.is_transversal = true AND ec.status = 'active';

  -- Insertar cuestionario maestro publicado
  INSERT INTO questionnaires
    (name, service_id, version_type, status, created_by, total_criteria, published_at)
  VALUES (
    'Cuestionario Maestro - Evaluación Inicial (Res. 3100/2019)',
    NULL,
    'initial',
    'published',
    admin_id,
    n_criterios,
    NOW()
  )
  RETURNING id INTO quest_id;

  -- Vincular los 512 criterios transversales al cuestionario maestro
  INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
  SELECT quest_id, ec.id
  FROM evaluation_criteria ec
  JOIN evaluation_standards es ON ec.standard_id = es.id
  WHERE es.is_transversal = true AND ec.status = 'active'
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Cuestionario maestro creado: id=%, criterios=%', quest_id, n_criterios;
END;
$$;

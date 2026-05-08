-- Normalizar nombres y categorías de servicios:
-- 1. Todos los nombres pasan a Title Case (elimina MAYÚSCULAS mezcladas)
-- 2. Categorías sin tilde se unifican con las versiones correctas (con tilde)

UPDATE services
SET
  name     = INITCAP(LOWER(name)),
  category = CASE category
    WHEN 'Internacion'                                     THEN 'Internación'
    WHEN 'Apoyo Diagnostico y Complementacion Terapeutica' THEN 'Apoyo Diagnóstico y Complementación Terapéutica'
    WHEN 'Atencion Inmediata'                              THEN 'Atención Inmediata'
    WHEN 'Quirurgicos'                                     THEN 'Quirúrgicos'
    ELSE category
  END;

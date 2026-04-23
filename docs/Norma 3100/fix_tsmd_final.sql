-- FIX TSMD: reparar textos dañados por update previo y agregar faltantes
-- FIX TSINT: verificar existencia

-- 1. Reparar TSMD con textos incorrectos
UPDATE evaluation_criteria SET name = '4.13. Seguimiento al uso de medicamentos, homeopáticos, fitoterapéuticos, medicamentos biológicos, componentes anatómicos, dispositivos médicos (incluso los sobre medida, elementos de rayos X y de uso odontológico), reactivos de diagnóstico in vitro; así como de los demás insumos asistenciales que se utilicen incluidos los que se encuentran en los depósitos o almacenes del prestador de servicios de salud y en la modalidad extramural.' WHERE code = 'TSMD-038';
UPDATE evaluation_criteria SET name = '5. El prestador de servicios de salud que realice algún tipo de actividad con medicamentos de control especial para la prestación de servicios de salud cuenta con la resolución de autorización vigente, expedida por el Fondo Nacional de Estupefacientes o la entidad que haga sus veces.' WHERE code = 'TSMD-039';
UPDATE evaluation_criteria SET name = '6. El prestador de servicios de salud cuenta con información documentada de la planeación y ejecución de los programas de farmacovigilancia, tecnovigilancia y reactivovigilancia, que garanticen el seguimiento al uso de medicamentos, dispositivos médicos (incluidos los sobre medida) y reactivos de diagnóstico in vitro, cuando aplique.' WHERE code = 'TSMD-040';
UPDATE evaluation_criteria SET name = '7. El prestador de servicios de salud que cuente con reservas de medicamentos, homeopáticos, fititerapéuticos, medicamentos biológicos, componentes anatómicos, dispositivos médicos (incluidos los sobre medida), reactivos de diagnóstico in vitro, y demás insumos asistenciales, debe garantizar que se almacenen en condiciones apropiadas de temperatura, humedad, ventilación segregación y seguridad de acuerdo con las condiciones definidas por el fabricante o el banco del componente anatómico, según aplique, y contar con instrumento para medir humedad reltiva y temperatura y evidencia su registro, control y gestión.' WHERE code = 'TSMD-041';
UPDATE evaluation_criteria SET name = '10. El prestador de servicios de salud cuenta con paquete para el manejo de derrames y rupturas de medicamentos, ubicado en un lugar de fácil acceso, visible y con adecuada señalización, disponible para su uso en los servicios y ambientes donde se requieran. El prestador de servicios de salud define su contenido de acuerdo con los medicamentos utilizados y lo sugerido por el fabricante en las fichas técnicas.' WHERE code = 'TSMD-044';
UPDATE evaluation_criteria SET name = '11. En los servicios donde se requiera carro de paro, adicional a la dotación definida en el presente manual, los medicamentos, dispositivos médicos e insumos deber ser definidos por el prestador de servicios de salud de acuerdo con la morbilidad. riesgos de complicaciones más frecuentes y lo documentado para el procedimiento de reanimación cerebro cardio pulmonar.' WHERE code = 'TSMD-045';
UPDATE evaluation_criteria SET name = '13. Si el prestador de servicios de salud no tiene habilitado el servicio de gestión pre transfusional, pero realiza procedimientos de transfusión, cuenta con convenio o contrato vigente con un banco de sangre certificado por la autoridad competente para el suministro de sangre, componentes sanguíneos y la realización de las pruebas pre transfusionales cuando el prestador de servicios de salud no las realice' WHERE code = 'TSMD-047';

-- 2. Insertar 3 criterios TSMD faltantes
-- (requieren standard_id y service_id del estandar TSMD existente)
INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_transversal, complexity)
SELECT
  v.code,
  v.num,
  v.name,
  '',
  ec.standard_id,
  ec.service_id,
  TRUE,
  'simple'
FROM (VALUES
  ('TSMD-057', '057', '1.4. Lote.'),
  ('TSMD-058', '058', '2.8. Lote'),
  ('TSMD-059', '059', '3.2. Marca')
) AS v(code, num, name)
JOIN evaluation_criteria ec ON ec.code = 'TSMD-001'
WHERE NOT EXISTS (SELECT 1 FROM evaluation_criteria WHERE code = v.code);

-- 3. TSINT: mostrar los 6 criterios del Excel para verificacion
-- Excel TSINT-001: 1. Cuando el servicio interdependiente sea contratado, debe mediar un contrato o un acuerdo escrito 
-- Excel TSINT-002: 1.1 Calidad en la entrega de los productos
-- Excel TSINT-003: 1.2. Procedimientos documentados de atención en cada servicio independiente
-- Excel TSINT-004: 1.3 Tiempos de entrega de los productos
-- Excel TSINT-005: 1.4 Supervisión al contratista que garantice la seguridad del resultado del producto contratado.
-- Excel TSINT-006: 2. Cuando fuera de salas de cirugía, se realicen procedimientos bajo sedación y monitorización elect

-- Verificar que BD tiene TSINT:
-- SELECT code, SUBSTRING(name,1,80) FROM evaluation_criteria WHERE code LIKE 'TSINT-%' ORDER BY code;
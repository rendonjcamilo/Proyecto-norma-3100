-- =============================================================================
-- Migración: Agregar 4 servicios específicos faltantes
-- Fuente de verdad: Archivo_Consolidaddo_Resolucion_3100-2019.xlsx
-- Servicios: SF (36), MNUC (76), TMCU (43), CBN (70) = 225 criterios
-- =============================================================================

BEGIN;

-- =============================================================================
-- SERVICIO: SF - Servicio Farmacéutico
-- 36 criterios evaluables
-- =============================================================================

INSERT INTO services (id, code, name, category, status)
VALUES ('7ac74504-ceb9-4c49-88ad-f3742c14cc10', 'SF', 'Servicio Farmacéutico', 'Apoyo Diagnóstico y Complementación Terapéutica', 'available');

INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('c2c67c30-9224-47cd-97b3-e2e2bc5e518d', 'SF_TH', 'Talento Humano', '7ac74504-ceb9-4c49-88ad-f3742c14cc10');
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('ba73d310-c3bf-4ec1-835b-a4729ee08cc4', 'SF_INF', 'Infraestructura', '7ac74504-ceb9-4c49-88ad-f3742c14cc10');
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('c53ad60b-5c89-4ed5-b211-72c08101d58b', 'SF_DOT', 'Dotacion', '7ac74504-ceb9-4c49-88ad-f3742c14cc10');
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('d59ae712-3b03-41a4-96e6-b6a30ebecabc', 'SF_MD', 'Medicamentos, Dispositivos Medicos e Insumos', '7ac74504-ceb9-4c49-88ad-f3742c14cc10');
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('836cadfe-0721-4cc1-9629-aed8b3d1b578', 'SF_PP', 'Procesos Prioritarios', '7ac74504-ceb9-4c49-88ad-f3742c14cc10');
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('c70e8c04-09de-4003-be3e-5b4d825ef5ef', 'SF_HCR', 'Historia Clinica y Registros', '7ac74504-ceb9-4c49-88ad-f3742c14cc10');
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('d36f75ee-8124-491d-8808-acde7e4103a1', 'SF_INT', 'Interdependencia de Servicios', '7ac74504-ceb9-4c49-88ad-f3742c14cc10');

INSERT INTO questionnaires (id, name, service_id, version_type, status, total_criteria, published_at)
VALUES ('9722832d-2b41-4d67-b251-d649ded3abe9', 'Servicio Farmacéutico (Res. 3100/2019)', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', 'initial', 'published', 36, NOW());

INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('4296caf3-8ffb-43dd-abe3-d964ea869097', 'SF-TH-H01', 'Modalidades intramural y extramural domiciliaria', 'c2c67c30-9224-47cd-97b3-e2e2bc5e518d', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('3fc7f0bd-e924-43a6-8ffc-007300d60bb2', 'SF-TH-001', '1. Cumple con los criterios definidos para todos los servicios y adicionalmente:', 'c2c67c30-9224-47cd-97b3-e2e2bc5e518d', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('1d4a5145-0c1c-4ac8-9aed-af141d5e9503', 'SF-TH-H02', 'Cumple con lo definido en el Decreto 2200 de 2005 compilado en el Decreto 780 de 2016 (Art 2.5.3.10.9) y la Resolución 1403 de 2007 (Manual de condiciones esenciales y procedimientos del servicio farmacéutico Título I Capitulo II Numeral 3.2 y Capítulo III Numeral 1.2), o las normas que los modifiquen, adicionen o sustituyan.', 'c2c67c30-9224-47cd-97b3-e2e2bc5e518d', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('00a95559-78dc-456b-9a11-77f4956a54ee', 'SF-TH-H03', 'Modalidad telemedicina
Categoría interactiva y no interactiva – prestador de referencia
Categoría telexperticia – prestador remisor – prestador de referencia', 'c2c67c30-9224-47cd-97b3-e2e2bc5e518d', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('5dc7a017-7c00-48d1-a2cf-6a112de09c9c', 'SF-TH-002', '2. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente, cuenta con lo definido con el numeral 1 del servicio farmacéutico.', 'c2c67c30-9224-47cd-97b3-e2e2bc5e518d', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('346e26e9-c706-4867-b989-7c480d3391c6', 'SF-TH-003', '3. El talento humano brinda en esta modalidad lo relacionado con la atención farmacéutica a los pacientes que lo requieran, a través de telemedicina – categorías interactiva y no interactiva, telexperticia sincrónico y asincrónico.', 'c2c67c30-9224-47cd-97b3-e2e2bc5e518d', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('6b547719-ebf0-437f-bdab-6a8ed15d02f3', 'SF-TH-H04', 'El apoyo a distancia del profesional Químico Farmacéutico no reemplaza el contar con el talento humano definido en el servicio', 'c2c67c30-9224-47cd-97b3-e2e2bc5e518d', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('5e47409b-87f4-49cb-ae2f-8e139d27300c', 'SF-INF-H01', 'Complejidad baja', 'ba73d310-c3bf-4ec1-835b-a4729ee08cc4', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('a22ab031-0595-4c4b-b6fe-f21b82b4c177', 'SF-INF-H02', 'Modalidades intramural, extramural domiciliaria, telemedicina categoría telexperticia – prestador remisor', 'ba73d310-c3bf-4ec1-835b-a4729ee08cc4', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('25617e91-6701-48fe-aa4e-bff7a4cb33ab', 'SF-INF-001', '4. Cumple con los criterios que le sean aplicables a todos los servicios', 'ba73d310-c3bf-4ec1-835b-a4729ee08cc4', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('ee71e7ce-ba56-4adb-b4ef-8eead0ac56f2', 'SF-INF-002', '5. Cuenta con:', 'ba73d310-c3bf-4ec1-835b-a4729ee08cc4', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('0e1ad052-e775-4658-9311-361c0edbbbfa', 'SF-INF-003', '5.1. Ambiente o área administrativa.', 'ba73d310-c3bf-4ec1-835b-a4729ee08cc4', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('2af15430-4ca8-4e64-9d82-ba921377a2a3', 'SF-INF-004', '5.2. Ambiente o área de recepción de medicamentos y dispositivos médicos.', 'ba73d310-c3bf-4ec1-835b-a4729ee08cc4', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('e8a6e5e7-ec23-4abf-8fef-4547be0312a1', 'SF-INF-005', '5.3. Ambiente o área de dispensación de medicamentos y entrega de dispositivos médicos.', 'ba73d310-c3bf-4ec1-835b-a4729ee08cc4', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('8cac2349-ee0c-4e0c-9460-e7863f4767df', 'SF-INF-006', '5.4. Ambiente o área de almacenamiento, que garantice las condiciones temperatura y humedad recomendadas por el fabricante. Incluye cadena de frio, cuando aplique.', 'ba73d310-c3bf-4ec1-835b-a4729ee08cc4', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('fa9765c1-321d-4f57-af0a-f72249b967f2', 'SF-INF-007', '5.5. Ambiente o área independiente de medicamentos de control especial cuando aplique, que garantice las condiciones temperatura y humedad recomendadas por el fabricante.', 'ba73d310-c3bf-4ec1-835b-a4729ee08cc4', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('cb9043ce-983c-4a4f-8707-5fb142460a3d', 'SF-INF-008', '5.6. Ambiente o área para almacenamiento de productos rechazados, devueltos y retirados.', 'ba73d310-c3bf-4ec1-835b-a4729ee08cc4', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('013f055d-4d43-4ff5-af65-a4cff3c66b60', 'SF-INF-009', '5.7. Ambiente o área para almacenamiento de productos destruidos o desnaturalizados por vencimiento o deterioro.', 'ba73d310-c3bf-4ec1-835b-a4729ee08cc4', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('fa04780f-140e-45c9-a779-61618bee186b', 'SF-INF-010', '5.8. Ambiente o área de cuarentena de medicamentos.', 'ba73d310-c3bf-4ec1-835b-a4729ee08cc4', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('d99552d3-03c1-42ea-8471-7380992b1b46', 'SF-INF-H03', 'Modalidad telemedicina
Categoría interactiva y no interactiva – prestador de referencia
Categoría telexperticia – prestador de referencia', 'ba73d310-c3bf-4ec1-835b-a4729ee08cc4', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('602a4cf7-6039-42b3-9c30-b3dc55e8651b', 'SF-INF-011', '6. Cumple con los criterios que le sean aplicables de todos los servicios.', 'ba73d310-c3bf-4ec1-835b-a4729ee08cc4', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('e2403236-eeac-47c8-adc4-8dc07ba6f2ae', 'SF-INF-H04', 'Complejidades mediana y alta
Modalidades intramural, extramural domiciliaria, telemedicina categoría telexperticia – prestador remisor', 'ba73d310-c3bf-4ec1-835b-a4729ee08cc4', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('c3a37613-5722-471a-a9fe-c4eab012e62e', 'SF-INF-012', '7. Cumple con los criterios definidos para el servicio farmacéutico de baja complejidad y adicionalmente cumple con lo definido en el Manual que adopta la Resolución 1403 de 2007, en el Título I Capítulo II numeral 1.2.2 y Título I Capítulo III numeral 1, o las normas que los modifiquen, adicionen o sustituyan.', 'ba73d310-c3bf-4ec1-835b-a4729ee08cc4', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('3223f1dd-a833-4036-9b26-035e59045838', 'SF-INF-H05', 'Modalidad telemedicina
Categoría interactiva y no interactiva – prestador de referencia
Categoría telexperticia – prestador de referencia', 'ba73d310-c3bf-4ec1-835b-a4729ee08cc4', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('7fb6163c-1c9d-43a6-8cfb-c5e9e5119b8a', 'SF-INF-013', '8. Cumple con los criterios que le sean aplicables de todos los servicios.', 'ba73d310-c3bf-4ec1-835b-a4729ee08cc4', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('9c80e37a-2ce0-4a34-9467-c484b6cb287e', 'SF-DOT-H01', 'Complejidades baja, mediana y alta', 'c53ad60b-5c89-4ed5-b211-72c08101d58b', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('054ffcc7-745c-4c51-8a16-2c12a4db1a06', 'SF-DOT-H02', 'Modalidades intramural, extramural domiciliaria, telemedicina categoría telexperticia – prestador remisor', 'c53ad60b-5c89-4ed5-b211-72c08101d58b', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('1aafa0f1-7f2b-46d2-8e75-b547c486f291', 'SF-DOT-001', '9. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente cuenta con:', 'c53ad60b-5c89-4ed5-b211-72c08101d58b', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('e09ac381-e94b-413d-be6a-e3ceb8c795aa', 'SF-DOT-002', '9.1. La dotación y mobiliario exclusivos y necesarios para el cumplimiento de los objetivos de los procesos generales y especiales que brinda el servicio, de acuerdo con las recomendaciones dadas por los fabricantes.', 'c53ad60b-5c89-4ed5-b211-72c08101d58b', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('7488544d-6720-464c-be45-e4d438ce8920', 'SF-DOT-003', '9.2. Instrumentos para medir la humedad relativa y la temperatura, en donde se almacenen medicamentos y dispositivos médicos.', 'c53ad60b-5c89-4ed5-b211-72c08101d58b', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('211eb0ec-db63-4daa-aebe-d1d8ad9b4492', 'SF-DOT-H03', 'Modalidad telemedicina
Categoría interactiva y no interactiva – prestador de referencia
Categoría telexperticia – prestador de referencia', 'c53ad60b-5c89-4ed5-b211-72c08101d58b', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('0fa7782f-6661-4788-87c1-6a9146d12cd5', 'SF-DOT-004', '10. Cumple con los criterios que le sean aplicables de todos los servicios.', 'c53ad60b-5c89-4ed5-b211-72c08101d58b', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('362f64c7-38d3-4031-aeb3-a6ecd5080975', 'SF-MD-H01', 'Complejidad baja', 'd59ae712-3b03-41a4-96e6-b6a30ebecabc', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('d5a38ca7-835b-4f72-88e7-1cf5ebcc91fa', 'SF-MD-H02', 'Modalidades intramural, extramural domiciliaria, telemedicina categoría telexperticia – prestador remisor', 'd59ae712-3b03-41a4-96e6-b6a30ebecabc', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('cfcc5291-9f88-4298-a493-44c8a71dac41', 'SF-MD-001', '11. Cumple con los criterios que le sean aplicables de todos los servicios.', 'd59ae712-3b03-41a4-96e6-b6a30ebecabc', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('4debbd91-e65e-44d2-b1d4-326c95a9f250', 'SF-MD-H03', 'Modalidad telemedicina
Categoría interactiva y no interactiva – prestador de referencia
Categoría telexperticia – prestador de referencia', 'd59ae712-3b03-41a4-96e6-b6a30ebecabc', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('1dc57f58-3cbf-4ae2-9c4c-d44f5bccb349', 'SF-MD-002', '12. Cumple con los criterios que le sean aplicables de todos los servicios.', 'd59ae712-3b03-41a4-96e6-b6a30ebecabc', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('55f96241-707b-47c2-ba25-7d20a6ec8585', 'SF-MD-H04', 'Complejidades mediana y alta', 'd59ae712-3b03-41a4-96e6-b6a30ebecabc', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('ea6a17d2-623a-498a-9bb1-268ee9efb134', 'SF-MD-H05', 'Modalidades intramural, extramural domiciliaria, telemedicina categoría telexperticia – prestador remisor', 'd59ae712-3b03-41a4-96e6-b6a30ebecabc', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('fb94c00c-5848-415f-bb5a-5ab36dbbd794', 'SF-MD-003', '13. Cumple con los criterios definidos para el servicio farmacéutico de baja complejidad y adicionalmente cuenta con:', 'd59ae712-3b03-41a4-96e6-b6a30ebecabc', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('22c6b39a-87f6-4bc3-a9d0-d119a9d21f0c', 'SF-MD-H06', 'Certificación en buenas prácticas de elaboración vigente, expedida por el Invima para los procesos especiales que se realicen en la central de mezclas ya sea propia o contratada.', 'd59ae712-3b03-41a4-96e6-b6a30ebecabc', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('aa9ada64-54cd-48ce-8379-f156cef6d550', 'SF-MD-H07', 'Modalidad telemedicina
Categoría interactiva y no interactiva – prestador de referencia
Categoría telexperticia – prestador de referencia', 'd59ae712-3b03-41a4-96e6-b6a30ebecabc', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('4dd094be-0611-4c8a-8438-d98b37bbd4f1', 'SF-MD-004', '14. Cumple con los criterios que le sean aplicables de todos los servicios.', 'd59ae712-3b03-41a4-96e6-b6a30ebecabc', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('37af5c96-9182-44d7-922d-c2110743c8e8', 'SF-PP-H01', 'Complejidad baja', '836cadfe-0721-4cc1-9629-aed8b3d1b578', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('87846ccc-faa2-428d-80bd-f30f5490b59e', 'SF-PP-H02', 'Modalidades intramural, extramural domiciliaria, telemedicina categoría telexperticia - prestador remisor', '836cadfe-0721-4cc1-9629-aed8b3d1b578', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('2af4fccc-fd28-499e-8711-7fd9bbde53fd', 'SF-PP-001', '15. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente cuenta con la siguiente información documentada:', '836cadfe-0721-4cc1-9629-aed8b3d1b578', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('ff3f856e-404e-4dfc-9b70-4967a9f772a7', 'SF-PP-002', '15.1. Procesos generales que realice, elaborado por el responsable del servicio.', '836cadfe-0721-4cc1-9629-aed8b3d1b578', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('5f3f4be9-4f77-4b22-9220-ac28b9ea9558', 'SF-PP-003', '15.2. Información visible al usuario que prohíba la asesoría farmacológica, por parte de personal diferente al profesional químico farmacéutico o al Profesional en Medicina tratante.', '836cadfe-0721-4cc1-9629-aed8b3d1b578', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('f64a46f1-43de-46aa-8203-e10c6bf242f4', 'SF-PP-004', '15.3. Manejo de medicamentos de control especial cuando lo realice.', '836cadfe-0721-4cc1-9629-aed8b3d1b578', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('44f40fb9-54c3-4008-8205-69d98cd0cca1', 'SF-PP-005', '15.4. Seguimiento a condiciones ambientales de temperatura y humedad.', '836cadfe-0721-4cc1-9629-aed8b3d1b578', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('65be6a98-38cd-4a07-804f-4b0243a3035d', 'SF-PP-H03', 'Modalidad telemedicina
Categoría interactiva y no interactiva – prestador de referencia
Categoría telexperticia – prestador de referencia', '836cadfe-0721-4cc1-9629-aed8b3d1b578', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('e505d09f-2bcd-45ea-afac-35b90beef34d', 'SF-PP-006', '16. Cumple con los criterios que le sean aplicables de todos los servicios.', '836cadfe-0721-4cc1-9629-aed8b3d1b578', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('fe946162-e0d7-4a87-810d-98faae87456f', 'SF-PP-H04', 'Complejidades mediana y alta', '836cadfe-0721-4cc1-9629-aed8b3d1b578', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('f678f854-dd8c-4380-8fce-590e4503419c', 'SF-PP-H05', 'Modalidades intramural, extramural domiciliaria, telemedicina categoría telexperticia - prestador remisor', '836cadfe-0721-4cc1-9629-aed8b3d1b578', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('40170ebc-cdf6-4db3-be6a-8fe1239ff124', 'SF-PP-007', '17. Cumple con los criterios definidos para el servicio farmacéutico en baja complejidad y adicionalmente, cuenta con información documentada de cada uno de los procesos especiales que se realicen en el servicio.', '836cadfe-0721-4cc1-9629-aed8b3d1b578', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('e1b699e5-860d-491a-a703-f98b1a95c9eb', 'SF-PP-H06', 'Modalidad telemedicina
Categoría interactiva y no interactiva – prestador de referencia
Categoría telexperticia – prestador de referencia', '836cadfe-0721-4cc1-9629-aed8b3d1b578', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('0e7503ff-c7f1-42ee-8781-4cb560e90d53', 'SF-PP-008', '18. Cumple con los criterios que le sean aplicables de todos los servicios.', '836cadfe-0721-4cc1-9629-aed8b3d1b578', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('84e9aede-aa11-4b1c-82aa-2b22bdb24e16', 'SF-HCR-H01', 'Complejidades baja, mediana y alta', 'c70e8c04-09de-4003-be3e-5b4d825ef5ef', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('f10ff3a8-5ccf-403a-99dd-278c2c01ee43', 'SF-HCR-H02', 'Modalidades intramural, extramural domiciliaria, telemedicina categoría telexperticia - prestador remisor', 'c70e8c04-09de-4003-be3e-5b4d825ef5ef', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('742e29cf-4da3-4b16-abc7-cd59179e0302', 'SF-HCR-001', '19. Cumple con los criterios que le sean aplicables de todos los servicios', 'c70e8c04-09de-4003-be3e-5b4d825ef5ef', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('f1390169-5b45-4e3c-8054-12a05d80b782', 'SF-HCR-H03', 'Modalidad telemedicina
Categoría interactiva y no interactiva – prestador de referencia
Categoría telexperticia – prestador de referencia', 'c70e8c04-09de-4003-be3e-5b4d825ef5ef', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('ae92cb0d-6698-4d71-b1b2-04da8a421c86', 'SF-HCR-002', '20. Cumple con los criterios que le sean aplicables de todos los servicios', 'c70e8c04-09de-4003-be3e-5b4d825ef5ef', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('a23ef51c-a7ae-48b3-8689-339945e29517', 'SF-INT-H01', 'Complejidades baja, mediana y alta', 'd36f75ee-8124-491d-8808-acde7e4103a1', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('cec62164-092f-41d7-a433-375faec80905', 'SF-INT-H02', 'Modalidades intramural, extramural domiciliaria, telemedicina categoría telexperticia - prestador remisor', 'd36f75ee-8124-491d-8808-acde7e4103a1', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('202e24ba-ca13-4714-bc1f-4e48ccbdd13d', 'SF-INT-001', '21. No aplica.', 'd36f75ee-8124-491d-8808-acde7e4103a1', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('6c5fbfdf-cb84-440e-aaf0-18a5142ed4cd', 'SF-INT-H03', 'Modalidad telemedicina
Categoría interactiva y no interactiva – prestador de referencia
Categoría telexperticia – prestador de referencia', 'd36f75ee-8124-491d-8808-acde7e4103a1', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('8b521f23-9289-424e-9403-23b4a5e9ed56', 'SF-INT-002', '22. No aplica.', 'd36f75ee-8124-491d-8808-acde7e4103a1', '7ac74504-ceb9-4c49-88ad-f3742c14cc10', TRUE, 'active', FALSE);

INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id) VALUES
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '3fc7f0bd-e924-43a6-8ffc-007300d60bb2'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '5dc7a017-7c00-48d1-a2cf-6a112de09c9c'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '346e26e9-c706-4867-b989-7c480d3391c6'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '25617e91-6701-48fe-aa4e-bff7a4cb33ab'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', 'ee71e7ce-ba56-4adb-b4ef-8eead0ac56f2'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '0e1ad052-e775-4658-9311-361c0edbbbfa'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '2af15430-4ca8-4e64-9d82-ba921377a2a3'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', 'e8a6e5e7-ec23-4abf-8fef-4547be0312a1'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '8cac2349-ee0c-4e0c-9460-e7863f4767df'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', 'fa9765c1-321d-4f57-af0a-f72249b967f2'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', 'cb9043ce-983c-4a4f-8707-5fb142460a3d'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '013f055d-4d43-4ff5-af65-a4cff3c66b60'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', 'fa04780f-140e-45c9-a779-61618bee186b'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '602a4cf7-6039-42b3-9c30-b3dc55e8651b'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', 'c3a37613-5722-471a-a9fe-c4eab012e62e'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '7fb6163c-1c9d-43a6-8cfb-c5e9e5119b8a'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '1aafa0f1-7f2b-46d2-8e75-b547c486f291'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', 'e09ac381-e94b-413d-be6a-e3ceb8c795aa'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '7488544d-6720-464c-be45-e4d438ce8920'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '0fa7782f-6661-4788-87c1-6a9146d12cd5'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', 'cfcc5291-9f88-4298-a493-44c8a71dac41'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '1dc57f58-3cbf-4ae2-9c4c-d44f5bccb349'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', 'fb94c00c-5848-415f-bb5a-5ab36dbbd794'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '4dd094be-0611-4c8a-8438-d98b37bbd4f1'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '2af4fccc-fd28-499e-8711-7fd9bbde53fd'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', 'ff3f856e-404e-4dfc-9b70-4967a9f772a7'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '5f3f4be9-4f77-4b22-9220-ac28b9ea9558'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', 'f64a46f1-43de-46aa-8203-e10c6bf242f4'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '44f40fb9-54c3-4008-8205-69d98cd0cca1'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', 'e505d09f-2bcd-45ea-afac-35b90beef34d'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '40170ebc-cdf6-4db3-be6a-8fe1239ff124'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '0e7503ff-c7f1-42ee-8781-4cb560e90d53'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '742e29cf-4da3-4b16-abc7-cd59179e0302'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', 'ae92cb0d-6698-4d71-b1b2-04da8a421c86'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '202e24ba-ca13-4714-bc1f-4e48ccbdd13d'),
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '8b521f23-9289-424e-9403-23b4a5e9ed56');

-- =============================================================================
-- SERVICIO: MNUC - Medicina Nuclear
-- 76 criterios evaluables
-- =============================================================================

INSERT INTO services (id, code, name, category, status)
VALUES ('091d16e1-f92f-4f19-aafb-75fd2fd0f088', 'MNUC', 'Medicina Nuclear', 'Apoyo Diagnóstico y Complementación Terapéutica', 'available');

INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('a615046d-27c8-45ce-84b6-aba75ed6cf20', 'MNUC_TH', 'Talento Humano', '091d16e1-f92f-4f19-aafb-75fd2fd0f088');
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('a3b00363-68cd-442b-8bd0-6978e0779a69', 'MNUC_INF', 'Infraestructura', '091d16e1-f92f-4f19-aafb-75fd2fd0f088');
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('2761cd08-2254-4ecd-8d3a-2d3ee39fa99c', 'MNUC_DOT', 'Dotacion', '091d16e1-f92f-4f19-aafb-75fd2fd0f088');
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('9646b794-69a2-43a2-aece-412a8ded2205', 'MNUC_MD', 'Medicamentos, Dispositivos Medicos e Insumos', '091d16e1-f92f-4f19-aafb-75fd2fd0f088');
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('5a0c9dc7-5b4a-417a-ae42-7754725c90a0', 'MNUC_PP', 'Procesos Prioritarios', '091d16e1-f92f-4f19-aafb-75fd2fd0f088');
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('06e8ee49-6df8-43f0-b7d0-f090cdb7c1c0', 'MNUC_HCR', 'Historia Clinica y Registros', '091d16e1-f92f-4f19-aafb-75fd2fd0f088');
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('019dc41e-024f-4ddc-abbd-640627f3c615', 'MNUC_INT', 'Interdependencia de Servicios', '091d16e1-f92f-4f19-aafb-75fd2fd0f088');

INSERT INTO questionnaires (id, name, service_id, version_type, status, total_criteria, published_at)
VALUES ('9b753834-152b-4723-b3bb-72004f6b9841', 'Medicina Nuclear (Res. 3100/2019)', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', 'initial', 'published', 76, NOW());

INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('6b103860-3d6e-4463-92be-e6512984921e', 'MNUC-TH-H01', 'Modalidades intramural, telemedicina - prestador remisor', 'a615046d-27c8-45ce-84b6-aba75ed6cf20', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('5614df02-a6f5-4acf-9f6e-358052adeb97', 'MNUC-TH-001', '1. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente cuenta con:', 'a615046d-27c8-45ce-84b6-aba75ed6cf20', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('b1d74ab2-3dcf-4c9d-9556-9edef6eb5bb3', 'MNUC-TH-002', '1.1 Profesional de la enfermería, cuando en el servicio se administren terapias con radionúclidos con actividad mayor a 30 mCi, que cuenta con constancia de asistencia en las acciones de formación continua en protección radiológica, radiofarmacia y radiofármacos.', 'a615046d-27c8-45ce-84b6-aba75ed6cf20', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('494eaa72-0cd4-4ccc-8f31-da7fa17f73aa', 'MNUC-TH-003', '1.2 Tecnólogo en medicina nuclear o tecnólogo en manejo de fuentes no selladas de uso diagnóstico y terapéutico o tecnólogo en imágenes diagnósticas, que cuenta con constancia de asistencia en las acciones de formación continua en protección radiológica, radiofarmacia y radiofármacos.', 'a615046d-27c8-45ce-84b6-aba75ed6cf20', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('ff4ca720-6283-45aa-80e4-6211a05002d8', 'MNUC-TH-004', '1.3 Oficial de protección radiológica para toda la institución.', 'a615046d-27c8-45ce-84b6-aba75ed6cf20', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('7db2bd0c-220f-4694-bed0-b5602aa66597', 'MNUC-TH-005', '2. Disponibilidad de:', 'a615046d-27c8-45ce-84b6-aba75ed6cf20', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('b0f449e7-fb7a-495e-99f9-e2e7c7eb8081', 'MNUC-TH-006', '2.1 Profesional de la medicina especialista en medicina nuclear, con permanencia durante los procedimientos definidos por el prestador de servicios de salud en el estándar de procesos prioritarios.', 'a615046d-27c8-45ce-84b6-aba75ed6cf20', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('fa4d4238-2671-4945-a793-2bd84b5f912b', 'MNUC-TH-007', '2.2 Profesional con título de postgrado en física médica con permanencia durante los procedimientos definidos por el prestador de servicios de salud en el estándar de procesos prioritarios.', 'a615046d-27c8-45ce-84b6-aba75ed6cf20', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('790186f1-3dbb-4d59-8c61-44c467361af2', 'MNUC-TH-H02', 'Modalidad telemedicina - prestador de referencia', 'a615046d-27c8-45ce-84b6-aba75ed6cf20', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('c59def4f-8134-4f2c-80d5-72d0edca2b0e', 'MNUC-TH-008', '3. Cumple con los criterios que le sean aplicables de todos los servicios.', 'a615046d-27c8-45ce-84b6-aba75ed6cf20', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('d75c6266-af89-427e-8a7d-7051d431ca15', 'MNUC-TH-009', '4. El profesional de la medicina especialista en medicina nuclear, cuando esté en disponibilidad y no se requiera su permanencia, puede hacer uso de la categoría telexperticia sincrónica entre profesionales de la salud, de acuerdo con lo definido por el prestador de servicios de salud en el estándar de procesos prioritarios.', 'a615046d-27c8-45ce-84b6-aba75ed6cf20', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('c05e3c07-2420-4041-8cbc-8353f486c131', 'MNUC-INF-H01', 'Modalidades intramural, telemedicina - prestador remisor', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('37d16707-55f2-48ed-91a7-d3a7e9d1baee', 'MNUC-INF-001', '5. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente cuenta con:', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('bf1740a9-ceea-4a46-a151-7a1afa940b31', 'MNUC-INF-002', '5.1 Ducha de seguridad', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('784b984d-0cb7-44df-8d14-fb7de69bc527', 'MNUC-INF-003', '6. Disponibilidad de:', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('1bcf1ff5-bf90-4691-8d5e-d5fd7361e0af', 'MNUC-INF-004', '6.1 Sala de espera.', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('bc69082f-1b0a-45d8-a02e-10e279e90983', 'MNUC-INF-005', '6.2 Unidades sanitarias discriminadas por sexo.', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('a11771db-6de7-4419-93a0-739ce282e70d', 'MNUC-INF-006', '6.3 Sala de lectura y transcripción de resultados.', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('49a3beb6-156a-4cf8-989f-4832e64b9416', 'MNUC-INF-007', '6.4 Ambiente destinado únicamente para segregación y decaimiento de ropa.', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('e02b7726-235e-400b-b4a0-297aef5ea93d', 'MNUC-INF-008', '6.5 Ambiente destinado únicamente para segregación y decaimiento de residuos.', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('fe09aa54-ba98-4bad-a711-a05704966c89', 'MNUC-INF-009', '6.6 Vestidor de pacientes, con disponibilidad de área para casilleros.', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('1fc798f0-49fc-4224-b8f1-60a86d12210a', 'MNUC-INF-010', '7. Todas  las áreas  cuentan  con  la señalización  correspondiente  (zona  controlada  y  supervisada), haciendo uso del símbolo de radiación internacionalmente aceptado.', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('e396695b-3755-41bc-808a-75fb57b59087', 'MNUC-INF-011', '8. Cuenta con señal luminosa a la entrada indicado que el equipo está en funcionamiento (únicamente aplica cuando el método diagnóstico incluye CT)', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('fa6e51a7-eb53-41b9-8c66-67bb2b133855', 'MNUC-INF-012', '9. Adicional a lo anterior, cuando se realicen procedimientos de medicina nuclear diagnóstica SPECT, cuenta con:', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('88b50955-6707-4ad4-9c21-0fb79529822f', 'MNUC-INF-013', '9.1 Ambiente de pacientes inyectados, con unidad sanitaria de uso mixto.', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('fa53e6ea-26b0-4321-a9f5-9bc2fe1fa449', 'MNUC-INF-014', '9.2 Ambiente exclusivo para la Gammacámara o SPECT o SPECT-CT. La dimensión de este ambiente debe ser acorde al tipo de equipo, su ficha técnica y a los procedimientos que se realicen, debe permitir movilización de pacientes, talento humano, usuarios y equipos biomédicos.', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('4953fe3f-539a-40e8-8d77-32d1fa8dab6e', 'MNUC-INF-015', '9.3 Ambiente para administración  de  radiofármacos.  Este  ambiente  puede  ser   compartido entre los procedimientos de diagnóstico y terapéutico.', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('1ee26d67-2e36-46a8-bfcd-3201a4cae81a', 'MNUC-INF-016', '9.4 Amblente o área de control / comando, de acuerdo con la tecnología a utilizar, que permita visualización del paciente.', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('beaf4eeb-4039-4684-87e3-d52f27915032', 'MNUC-INF-017', '10. Cuando se realicen procedimientos de medicina nuclear diagnóstica PET/CT o PET RMN, cuenta con:', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('e7ccc1bb-c9df-408d-a6be-8640d69b2c49', 'MNUC-INF-018', '10.1 Ambiente de PET/CT o PET RMN. La dimensión de este ambiente debe ser acorde al tipo de equipo, su ficha técnlca y a los procedimientos que se realicen, debe permitir movilización del talento humano, pacientes, usuarios y equipos biomédicos.', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('2279b7fe-ecc8-491d-9459-cb7704296592', 'MNUC-INF-019', '10.2 Ambiente de control I comando, de acuerdo con la tecnologia a utilizar, que permita visualización del paciente.', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('88895a3f-8352-4056-baf7-9554cc4ce422', 'MNUC-INF-020', '10.3 Ambiente de administración y captación radiofármacos PET (mínimo dos ambientes blindados por equipo), que cuenta con lavamanos.', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('f16d47d6-3d4b-4f51-b81e-41d678c03666', 'MNUC-INF-021', '10.4 Unidad sanitaria para pacientes inyectados de uso mixto.', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('ecc9f935-6634-4b63-bfe8-d67d5e77a90f', 'MNUC-INF-022', '11. Cuando se realicen terapias con radiofármacos de actividad menor a 30 mCi, cuenta con:', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('0a1ed7f6-e5cf-4ac4-a962-ce4909c86f9f', 'MNUC-INF-023', '11.1 Ambiente o área con unidad sanitaria', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('c9967d39-87fe-4f40-bb45-b5d8a839ae01', 'MNUC-INF-024', '11.2 Puesto de enfermería con sistema que permita la vigilancia y monitoreo permanente.  Puede ser compartido entre terapias de mayor y menor a 30 mCi.', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('459113dd-7f73-4444-9beb-7de7f10cf176', 'MNUC-INF-025', '11.3. Ambiente para aplicación administración de radiofármacos. Este ambiente puede sercompartido entre los procedimientos de diagnóstico y terapéutico.', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('bc97e90a-6ca1-4540-9d9c-d4eaf4659b1d', 'MNUC-INF-026', '12. Cuando  se  realicen  terapias  con radiofármacos  de  actividad  mayor  a  30  mCi  y  se tienen habitaciones dentro del servicio, cuenta con:', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('1d998656-62e7-469e-a0b7-cc48190a1c23', 'MNUC-INF-027', '12.1 Puesto de enfermería con sistema que permita la vigilancia y monitoreo permanente.  Puede ser compartido entre terapias de mayor y menor a 30 mCi.', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('255dfdf9-185a-4077-b641-a6aa6492ee57', 'MNUC-INF-028', '12.2 Habitaciones individuales con baño y aislamiento estricto.', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('f00f7d2c-ab59-479f-bbf1-e41f4c1d4595', 'MNUC-INF-H02', 'Cuando  se  realicen  terapias  con  radiofármacos  de  actividad   mayor  a  30  mCi  y  se  tienen habitaciones en el servicio de hospitalización, cuenta con:', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('eb2fe0c3-b5a0-408c-9954-d5bcfdd8aaef', 'MNUC-INF-029', '13.1  Estación de enfermería.', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('301370e4-3a81-4872-9ad5-7fbbae3b7a81', 'MNUC-INF-030', '13.2. Habitaciones individuales con baño y aislamiento estricto.', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('414199fc-d010-4092-b472-cfb00a8a3ebb', 'MNUC-INF-H03', 'Modalidad telemedicina - prestador de referencia', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('dd8087d4-9a45-48cb-a5bb-7af54d78c5e2', 'MNUC-INF-031', '14. Cumple con los criterios que le sean aplicables de todos los servicios.', 'a3b00363-68cd-442b-8bd0-6978e0779a69', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('199fa96f-d96c-4c27-99ce-96d4eba42448', 'MNUC-DOT-H01', 'Modalidades intramural, telemedicina - prestador remisor', '2761cd08-2254-4ecd-8d3a-2d3ee39fa99c', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('139de527-22f1-4d6b-874d-6e7a13d0a5c2', 'MNUC-DOT-001', '15. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente, cuenta con:', '2761cd08-2254-4ecd-8d3a-2d3ee39fa99c', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('5bc1f34e-169b-4a10-99e4-83a3d146f444', 'MNUC-DOT-002', '15.1 Cuando cuente con equipos de PET-TC o SPECT CT o SPECT, se garantiza la realización de los controles de calidad, por parte de un profesional en física o ingenieria física o ingeniería biomédica o fisico médico, que cuenta con constancia de asistencia en las acciones de formación continua en control de calidad PET.', '2761cd08-2254-4ecd-8d3a-2d3ee39fa99c', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('65ec4722-3bdd-499e-ab9c-c29d3b847d2b', 'MNUC-DOT-003', '15.2 Gammacámara o SPECT o SPECT CT, cuando realice medicina nuclear diagnóstica.', '2761cd08-2254-4ecd-8d3a-2d3ee39fa99c', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('a273541e-58a2-49aa-a694-fd4baa4c42de', 'MNUC-DOT-004', '15.3 PET - CT o PET Resonancia, cuando realice medicina nuclear diagnóstica PET.', '2761cd08-2254-4ecd-8d3a-2d3ee39fa99c', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('80f1b709-6abc-4076-9173-7b10354056ed', 'MNUC-DOT-005', '15.4 Cama hospitalaria cuando realice terapias con radionúclidos de actividad mayor a 30 mCi.', '2761cd08-2254-4ecd-8d3a-2d3ee39fa99c', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('e2a815e7-d9b0-4cc4-9c04-17299b165ec8', 'MNUC-DOT-006', '15.5 Gammacámara, cuando realice terapias con radionúctidos para rastreos pos-terapia.', '2761cd08-2254-4ecd-8d3a-2d3ee39fa99c', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('be3b3e05-6d8b-4eef-aa78-cdc55a2ef266', 'MNUC-DOT-007', '15.6 Carro de paro.', '2761cd08-2254-4ecd-8d3a-2d3ee39fa99c', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('e31f58c9-55e2-4736-8b6f-658e6bc8cfa9', 'MNUC-DOT-008', '15.7 Oxígeno   medicinal.       
Puede  ser  suministrado   mediante  salida  de  oxígeno  medicinal  o mediante oxígeno medicinal portátil.', '2761cd08-2254-4ecd-8d3a-2d3ee39fa99c', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('39aa5875-cbec-4527-8b26-533ad4a2011e', 'MNUC-DOT-H02', 'Modalidad telemedicina - prestador de referencia', '2761cd08-2254-4ecd-8d3a-2d3ee39fa99c', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('f04fad88-a0d3-46fa-92be-2df7d9cf3d5e', 'MNUC-DOT-009', '16. Cumple con los cirterios que le sean aplicables de todos los servicios', '2761cd08-2254-4ecd-8d3a-2d3ee39fa99c', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('d1a01a64-07b1-4a52-af0c-aab21a38f32a', 'MNUC-MD-H01', 'Modalidades intramural, telemedicina - prestador remisor', '9646b794-69a2-43a2-aece-412a8ded2205', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('17b1afff-46ad-4b7b-99c0-b347d0bda21e', 'MNUC-MD-001', '17. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente cuenta con:', '9646b794-69a2-43a2-aece-412a8ded2205', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('6fd4e62f-2494-4b32-b998-b977d26fe5bc', 'MNUC-MD-002', '17.1 Certificado vigente de buenas prácticas de elaboración de radiofármacos expedido por el lnvima, cuando el prestador de servicios salud cuente con radiofarmacia de media  o alta complejidad. En caso de contratar con un proveedor externo, éste debe contar con dicha certificación y contrato vigente.', '9646b794-69a2-43a2-aece-412a8ded2205', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('9ede11c4-7f3a-483a-a68c-7c5c6e285ea7', 'MNUC-MD-003', '17.2 Acta de inspección expedida por el lnvima, cuando el prestador de servicios salud cuente con radiofarmacia de baja complejidad.', '9646b794-69a2-43a2-aece-412a8ded2205', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('1f9d6057-0b2a-430b-9286-52c7c7c40d5b', 'MNUC-MD-004', '17.3 Oxigeno medicinal', '9646b794-69a2-43a2-aece-412a8ded2205', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('f4886f3e-cc10-4a87-9f1a-61f90afb57e7', 'MNUC-MD-H02', 'Modalidad telemedicina - prestador de referencia', '9646b794-69a2-43a2-aece-412a8ded2205', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('b81bfa73-3391-4827-8eec-224b69b1a57b', 'MNUC-MD-005', '18. Cumple con los criterios que le sean aplicables de todos los servicios.', '9646b794-69a2-43a2-aece-412a8ded2205', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('290865c4-8c66-4912-b6cf-7861e6c79a0e', 'MNUC-PP-H01', 'Modalidades intramural, telemedicina - prestador remisor', '5a0c9dc7-5b4a-417a-ae42-7754725c90a0', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('8a23ed18-cce1-4d1d-82a1-5f09c067c736', 'MNUC-PP-001', '19. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente cuenta con la siguiente información documentada:', '5a0c9dc7-5b4a-417a-ae42-7754725c90a0', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('53186663-6753-4936-8f04-177dce80adfa', 'MNUC-PP-002', '19.1 Cuando el prestador realiza medicina nuclear diagnóstica:', '5a0c9dc7-5b4a-417a-ae42-7754725c90a0', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('088b0622-65c0-4e36-bcb6-bb4478aa30a3', 'MNUC-PP-003', '19.1.1. Prescripción   y   dosificación   de   todos   los   radiofármacos   o   radionúclidos   para Gammagrafías o estudios PET o SPEC CT.', '5a0c9dc7-5b4a-417a-ae42-7754725c90a0', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('3881026f-5218-48c3-8f53-dca2d17ae657', 'MNUC-PP-004', '19.1.2. Procedimientos diagnósticos para gammagrafías o PET - CT o SPECT CT.', '5a0c9dc7-5b4a-417a-ae42-7754725c90a0', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('71b9f26f-a7f2-4c5e-bc60-78f89f67d042', 'MNUC-PP-005', '19.1.3 Procedimiento de perfusión miocárdica con isonitrilos, cuando lo realice.', '5a0c9dc7-5b4a-417a-ae42-7754725c90a0', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('2b59be55-7108-47ac-88a8-7b0d188976db', 'MNUC-PP-006', '19.2 Cuando el prestador realiza terapias con radionúclidos:', '5a0c9dc7-5b4a-417a-ae42-7754725c90a0', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('dd716f3c-27a8-44e4-93c9-171974b58548', 'MNUC-PP-007', '19.2.1. Prescripción y dosificación de todos los radiofármacos o radionúclidos.', '5a0c9dc7-5b4a-417a-ae42-7754725c90a0', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('1369e01d-002a-4e8b-971f-19feff71d14d', 'MNUC-PP-008', '19.2.2. Alta del paciente sometido a terapia con radiofármacos.', '5a0c9dc7-5b4a-417a-ae42-7754725c90a0', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('c640046d-5757-43ff-a4fe-89254cdb1185', 'MNUC-PP-009', '19.2.3. Procedimientos terapéuticos realizados con radiofármacos', '5a0c9dc7-5b4a-417a-ae42-7754725c90a0', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('7219425e-190e-4986-832b-23db3c8088cd', 'MNUC-PP-010', '19.3. Procedimientos en los cuales se requiere la permanencia del profesional de la medicina especialista en medicina nuclear y del profesional con titulo de postgrado en física médica.', '5a0c9dc7-5b4a-417a-ae42-7754725c90a0', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('747cfd57-b26d-4264-9c0e-052356eee1e1', 'MNUC-PP-011', '19.4. Cuando en el servicio se realice diagnóstico y terapias con radionúclidos de actividad menor a 30 mCi, la programación de los pacientes debe darse por separado.', '5a0c9dc7-5b4a-417a-ae42-7754725c90a0', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('db1cfbf0-cd76-49c1-bb67-5a3df725efe5', 'MNUC-PP-012', '19.5. Cuando se realicen terapias con radionúclidos de actividad mayor a 30 mCi, la administración del radiofármaco debe realizarse en la habitación de aislamiento.', '5a0c9dc7-5b4a-417a-ae42-7754725c90a0', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('6e26cc4c-2d55-4965-aca0-61f7f749e6ea', 'MNUC-PP-H02', 'Modalidad telemedicina - prestador de referencia', '5a0c9dc7-5b4a-417a-ae42-7754725c90a0', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('c18461c4-1959-4b0a-90ee-c6cf299645a4', 'MNUC-PP-H03', 'Cumple con los criterios que le sean aplicables de todos los servicios.', '5a0c9dc7-5b4a-417a-ae42-7754725c90a0', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('aaeec4a5-cfbd-4523-876e-d5df8d5345f5', 'MNUC-HCR-H01', 'Modalidades intramural, telemedicina - prestador remisor', '06e8ee49-6df8-43f0-b7d0-f090cdb7c1c0', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('e74a17d4-876c-4012-9ccc-6890e847c020', 'MNUC-HCR-001', '21. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente cuenta con:', '06e8ee49-6df8-43f0-b7d0-f090cdb7c1c0', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('cbb62c25-3c93-4acf-bce1-bb89a03d2b44', 'MNUC-HCR-002', '21.1. Registro de resultados diagnósticos, cuando realice medicina nuclear diagnóstica.', '06e8ee49-6df8-43f0-b7d0-f090cdb7c1c0', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('cf433ae0-49da-4fab-a0b8-a645d6550ae1', 'MNUC-HCR-003', '21.2. Registro  de  resultados  rechazados  por el profesional  de  la  medicina  especialista  en medicina nuclear y sus causas, cuando se realice medicina nuclear diagnóstica.', '06e8ee49-6df8-43f0-b7d0-f090cdb7c1c0', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('66a541d3-cb48-49b3-854f-d76819285253', 'MNUC-HCR-004', '21.3. Registro de tratamientos realizados.', '06e8ee49-6df8-43f0-b7d0-f090cdb7c1c0', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('8c1ac416-b779-434a-9ce9-8c3dd136b67f', 'MNUC-HCR-005', '21.4. Registro de mediciones de tasa de exposición o tasa de dosis equivalente, al momento del alta de pacientes sometidos a terapia.', '06e8ee49-6df8-43f0-b7d0-f090cdb7c1c0', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('ccec90cf-14c8-4676-a91a-5a95a5ec0d9a', 'MNUC-HCR-H02', 'Modalidad telemedicina - prestador de referencia', '06e8ee49-6df8-43f0-b7d0-f090cdb7c1c0', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('789b1771-d246-4bc3-bd5c-28b76d2985b3', 'MNUC-HCR-006', '22. Cumple con los criterios que le sean aplicables de todos los servicios.', '06e8ee49-6df8-43f0-b7d0-f090cdb7c1c0', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('d17834a5-6035-4449-8ab1-c4d006589f13', 'MNUC-INT-H01', 'Modalidad intramural', '019dc41e-024f-4ddc-abbd-640627f3c615', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('f1ca5483-975a-4682-9d79-998bc4caebdc', 'MNUC-INT-001', '23. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente cuenta con:', '019dc41e-024f-4ddc-abbd-640627f3c615', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('5ac3dcdc-e3ba-4768-8e8f-8d93f7b5b2b8', 'MNUC-INT-002', '23.1. Servicio de consulta externa de medicina nuclear, cuando en el servicio se realicen terapias con radionúclidos.', '019dc41e-024f-4ddc-abbd-640627f3c615', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('63c1fb69-cd8b-4349-88ed-2681f2e7ab30', 'MNUC-INT-003', '23.2. Servicio de diagnóstico vascular, cuando en el servicio se realicen estudios de perfusión miocárdica.', '019dc41e-024f-4ddc-abbd-640627f3c615', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('efa82da0-c233-4cc4-ad40-669bf12f33e1', 'MNUC-INT-H02', 'Modalidad  telemedicina - prestador remisor - prestador de referencia', '019dc41e-024f-4ddc-abbd-640627f3c615', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('85b391e9-73b2-48b2-97c1-e7a4a168f2ef', 'MNUC-INT-004', '24. No aplica', '019dc41e-024f-4ddc-abbd-640627f3c615', '091d16e1-f92f-4f19-aafb-75fd2fd0f088', TRUE, 'active', FALSE);

INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id) VALUES
  ('9b753834-152b-4723-b3bb-72004f6b9841', '5614df02-a6f5-4acf-9f6e-358052adeb97'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'b1d74ab2-3dcf-4c9d-9556-9edef6eb5bb3'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '494eaa72-0cd4-4ccc-8f31-da7fa17f73aa'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'ff4ca720-6283-45aa-80e4-6211a05002d8'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '7db2bd0c-220f-4694-bed0-b5602aa66597'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'b0f449e7-fb7a-495e-99f9-e2e7c7eb8081'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'fa4d4238-2671-4945-a793-2bd84b5f912b'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'c59def4f-8134-4f2c-80d5-72d0edca2b0e'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'd75c6266-af89-427e-8a7d-7051d431ca15'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '37d16707-55f2-48ed-91a7-d3a7e9d1baee'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'bf1740a9-ceea-4a46-a151-7a1afa940b31'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '784b984d-0cb7-44df-8d14-fb7de69bc527'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '1bcf1ff5-bf90-4691-8d5e-d5fd7361e0af'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'bc69082f-1b0a-45d8-a02e-10e279e90983'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'a11771db-6de7-4419-93a0-739ce282e70d'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '49a3beb6-156a-4cf8-989f-4832e64b9416'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'e02b7726-235e-400b-b4a0-297aef5ea93d'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'fe09aa54-ba98-4bad-a711-a05704966c89'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '1fc798f0-49fc-4224-b8f1-60a86d12210a'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'e396695b-3755-41bc-808a-75fb57b59087'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'fa6e51a7-eb53-41b9-8c66-67bb2b133855'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '88b50955-6707-4ad4-9c21-0fb79529822f'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'fa53e6ea-26b0-4321-a9f5-9bc2fe1fa449'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '4953fe3f-539a-40e8-8d77-32d1fa8dab6e'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '1ee26d67-2e36-46a8-bfcd-3201a4cae81a'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'beaf4eeb-4039-4684-87e3-d52f27915032'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'e7ccc1bb-c9df-408d-a6be-8640d69b2c49'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '2279b7fe-ecc8-491d-9459-cb7704296592'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '88895a3f-8352-4056-baf7-9554cc4ce422'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'f16d47d6-3d4b-4f51-b81e-41d678c03666'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'ecc9f935-6634-4b63-bfe8-d67d5e77a90f'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '0a1ed7f6-e5cf-4ac4-a962-ce4909c86f9f'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'c9967d39-87fe-4f40-bb45-b5d8a839ae01'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '459113dd-7f73-4444-9beb-7de7f10cf176'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'bc97e90a-6ca1-4540-9d9c-d4eaf4659b1d'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '1d998656-62e7-469e-a0b7-cc48190a1c23'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '255dfdf9-185a-4077-b641-a6aa6492ee57'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'eb2fe0c3-b5a0-408c-9954-d5bcfdd8aaef'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '301370e4-3a81-4872-9ad5-7fbbae3b7a81'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'dd8087d4-9a45-48cb-a5bb-7af54d78c5e2'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '139de527-22f1-4d6b-874d-6e7a13d0a5c2'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '5bc1f34e-169b-4a10-99e4-83a3d146f444'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '65ec4722-3bdd-499e-ab9c-c29d3b847d2b'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'a273541e-58a2-49aa-a694-fd4baa4c42de'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '80f1b709-6abc-4076-9173-7b10354056ed'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'e2a815e7-d9b0-4cc4-9c04-17299b165ec8'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'be3b3e05-6d8b-4eef-aa78-cdc55a2ef266'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'e31f58c9-55e2-4736-8b6f-658e6bc8cfa9'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'f04fad88-a0d3-46fa-92be-2df7d9cf3d5e'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '17b1afff-46ad-4b7b-99c0-b347d0bda21e'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '6fd4e62f-2494-4b32-b998-b977d26fe5bc'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '9ede11c4-7f3a-483a-a68c-7c5c6e285ea7'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '1f9d6057-0b2a-430b-9286-52c7c7c40d5b'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'b81bfa73-3391-4827-8eec-224b69b1a57b'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '8a23ed18-cce1-4d1d-82a1-5f09c067c736'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '53186663-6753-4936-8f04-177dce80adfa'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '088b0622-65c0-4e36-bcb6-bb4478aa30a3'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '3881026f-5218-48c3-8f53-dca2d17ae657'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '71b9f26f-a7f2-4c5e-bc60-78f89f67d042'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '2b59be55-7108-47ac-88a8-7b0d188976db'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'dd716f3c-27a8-44e4-93c9-171974b58548'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '1369e01d-002a-4e8b-971f-19feff71d14d'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'c640046d-5757-43ff-a4fe-89254cdb1185'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '7219425e-190e-4986-832b-23db3c8088cd'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '747cfd57-b26d-4264-9c0e-052356eee1e1'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'db1cfbf0-cd76-49c1-bb67-5a3df725efe5'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'e74a17d4-876c-4012-9ccc-6890e847c020'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'cbb62c25-3c93-4acf-bce1-bb89a03d2b44'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'cf433ae0-49da-4fab-a0b8-a645d6550ae1'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '66a541d3-cb48-49b3-854f-d76819285253'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '8c1ac416-b779-434a-9ce9-8c3dd136b67f'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '789b1771-d246-4bc3-bd5c-28b76d2985b3'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', 'f1ca5483-975a-4682-9d79-998bc4caebdc'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '5ac3dcdc-e3ba-4768-8e8f-8d93f7b5b2b8'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '63c1fb69-cd8b-4349-88ed-2681f2e7ab30'),
  ('9b753834-152b-4723-b3bb-72004f6b9841', '85b391e9-73b2-48b2-97c1-e7a4a168f2ef');

-- =============================================================================
-- SERVICIO: TMCU - Toma de Muestras de Cuello Uterino
-- 43 criterios evaluables
-- =============================================================================

INSERT INTO services (id, code, name, category, status)
VALUES ('40658c0f-31e4-488e-8afe-48b5f6081fab', 'TMCU', 'Toma de Muestras de Cuello Uterino', 'Apoyo Diagnóstico y Complementación Terapéutica', 'available');

INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('992c0e82-4938-4c1a-9e65-6ae3d947013a', 'TMCU_TH', 'Talento Humano', '40658c0f-31e4-488e-8afe-48b5f6081fab');
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('5a673a2f-6c2b-4f10-9525-9cb7374fafe2', 'TMCU_INF', 'Infraestructura', '40658c0f-31e4-488e-8afe-48b5f6081fab');
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('574fb6ea-6bb3-4b9b-b9b4-49eacc572410', 'TMCU_DOT', 'Dotacion', '40658c0f-31e4-488e-8afe-48b5f6081fab');
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('5132130a-d5ce-420f-b185-c49f36efb8c2', 'TMCU_MD', 'Medicamentos, Dispositivos Medicos e Insumos', '40658c0f-31e4-488e-8afe-48b5f6081fab');
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('d7d87e54-ff26-4320-80c7-554bc57d0e9d', 'TMCU_PP', 'Procesos Prioritarios', '40658c0f-31e4-488e-8afe-48b5f6081fab');
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('cc5c1012-b1d8-4be0-9df1-f14afa2fe0c1', 'TMCU_HCR', 'Historia Clinica y Registros', '40658c0f-31e4-488e-8afe-48b5f6081fab');
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('89c1ea75-aa6f-45ae-a24b-8dfc6a982b15', 'TMCU_INT', 'Interdependencia de Servicios', '40658c0f-31e4-488e-8afe-48b5f6081fab');

INSERT INTO questionnaires (id, name, service_id, version_type, status, total_criteria, published_at)
VALUES ('7256eee7-60fd-48fc-b859-0a724a7b1fef', 'Toma de Muestras de Cuello Uterino (Res. 3100/2019)', '40658c0f-31e4-488e-8afe-48b5f6081fab', 'initial', 'published', 43, NOW());

INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('3094f3e7-024f-49ec-a8f0-4f9df66e1c74', 'TMCU-TH-H01', 'Modalidades intramural, extramural unidad móvil. Jornada de salud y domiciliaria', '992c0e82-4938-4c1a-9e65-6ae3d947013a', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('27ac46af-c8fe-4475-ab69-fb0e28d028f4', 'TMCU-TH-001', '1. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente cuenta con:', '992c0e82-4938-4c1a-9e65-6ae3d947013a', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('dd6cd49a-36ec-47d5-9238-c298d7fcf3d1', 'TMCU-TH-002', '1.1. Profesional de la medicina o profesional de la enfermería o profesional de bacteriología o citohistotecnólogo (a) o histocitotecnólogo (a)', '992c0e82-4938-4c1a-9e65-6ae3d947013a', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('6b0ca31d-c55b-4b81-a062-606fa7f2d06a', 'TMCU-TH-003', '1.2. El personal que realice toma de citologías cuenta con constancia de asistencia en las acciones de formación continua en esta actividad.', '992c0e82-4938-4c1a-9e65-6ae3d947013a', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('78ae618d-09f5-4e34-bdc6-03f2df443d9b', 'TMCU-TH-004', '1.3. La técnica VIA VILI solo podrá ser realizada por profesional de la medicina o profesional en enfermería', '992c0e82-4938-4c1a-9e65-6ae3d947013a', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('261d756c-466d-4fab-931b-83239f2622d8', 'TMCU-TH-H02', 'En zonas especiales de dispersión geográfica:', '992c0e82-4938-4c1a-9e65-6ae3d947013a', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('bdcac987-1e98-4036-bc94-87e63e3793a5', 'TMCU-TH-005', '2. Cuenta con:', '992c0e82-4938-4c1a-9e65-6ae3d947013a', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('d73ec67f-d522-4504-9713-61ead840ca80', 'TMCU-TH-006', '2.1. Auxiliar de enfermería o profesional de la medicina o profesional de la enfermería o profesional de bacteriología o citohistotecnólogo (a) o histocitotecnólogo (a).', '992c0e82-4938-4c1a-9e65-6ae3d947013a', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('ee184e10-f8d6-402f-b536-3042b17d9331', 'TMCU-TH-007', '2.2. El personal que realice toma de citologías cuenta con constancia de asistencia en las acciones de formación continua para esta actividad.', '992c0e82-4938-4c1a-9e65-6ae3d947013a', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('bdb9b158-e238-40d4-9388-91791fb4e366', 'TMCU-INF-H01', 'Modalidad intramural', '5a673a2f-6c2b-4f10-9525-9cb7374fafe2', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('4c035d52-711f-4918-b369-f41786a52bea', 'TMCU-INF-001', '3. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente cuenta con:', '5a673a2f-6c2b-4f10-9525-9cb7374fafe2', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('14a82e68-2c0a-4daf-a31c-50eb97097d61', 'TMCU-INF-002', '3.1. Ambiente para la toma de muestras especiales, con unidad sanitaria y perchero.', '5a673a2f-6c2b-4f10-9525-9cb7374fafe2', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('9536b442-838a-4ddf-828f-784f7b19e5e4', 'TMCU-INF-H02', 'Disponibilidad de:', '5a673a2f-6c2b-4f10-9525-9cb7374fafe2', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('cd44daf4-00f4-4c40-b084-76ed70eff622', 'TMCU-INF-003', '3.2. Área de información y entrega de resultados.', '5a673a2f-6c2b-4f10-9525-9cb7374fafe2', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('001ecd71-9317-410b-8f5c-8c21b8983730', 'TMCU-INF-004', '3.3. Área o ambiente de preparación, embalaje y remisión de las muestras con mesón de trabajo.', '5a673a2f-6c2b-4f10-9525-9cb7374fafe2', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('4a93d974-b583-4eac-8357-f39a85deb02b', 'TMCU-INF-005', '3.4. Área o ambiente para el almacenamiento de materiales, insumos y reactivos.', '5a673a2f-6c2b-4f10-9525-9cb7374fafe2', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('654482ff-4eae-4fc6-aac4-15e5cc72a375', 'TMCU-INF-006', '4. Disponibilidad de:', '5a673a2f-6c2b-4f10-9525-9cb7374fafe2', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('2b36d1cb-43d7-4d99-bd09-5cc39f7c6e6b', 'TMCU-INF-007', '4.1. sala de espera', '5a673a2f-6c2b-4f10-9525-9cb7374fafe2', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('9ce5180d-80ab-4525-9545-666dc9537cb8', 'TMCU-INF-008', '4.2. Unidades sanitarias discriminadas por sexo.', '5a673a2f-6c2b-4f10-9525-9cb7374fafe2', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('f0dddcae-8bd5-4017-8709-4be59b59b02a', 'TMCU-INF-H03', 'Modalidad extramural unidad móvil y jornada de salud', '5a673a2f-6c2b-4f10-9525-9cb7374fafe2', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('06a0329f-f870-4739-9e39-41e0c18c9fa5', 'TMCU-INF-009', '5. Cumple con los criterios que le sean aplicables de todos los servicios', '5a673a2f-6c2b-4f10-9525-9cb7374fafe2', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('351f0072-8957-4922-8aba-e48c31659c00', 'TMCU-DOT-H01', 'Modalidades intramural, extramural unidad móvil y jornada de salud', '574fb6ea-6bb3-4b9b-b9b4-49eacc572410', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('150bfed7-4776-4532-8b3f-6ca8fb1fd3b5', 'TMCU-DOT-001', '6. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente cuenta con:', '574fb6ea-6bb3-4b9b-b9b4-49eacc572410', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('9606faae-2eed-4cc8-b051-a1a5286fe3de', 'TMCU-DOT-002', '6.1. Camilla con estribos.', '574fb6ea-6bb3-4b9b-b9b4-49eacc572410', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('89802a70-0dd6-4e26-bc5e-376756dc9b4e', 'TMCU-DOT-003', '6.2. Lámpara de cuello de cisne o su equivalente.', '574fb6ea-6bb3-4b9b-b9b4-49eacc572410', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('44f38540-4661-4ae7-a165-4de6e52a2a06', 'TMCU-DOT-004', '6.3. Escalerilla.', '574fb6ea-6bb3-4b9b-b9b4-49eacc572410', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('7e7e7413-9c89-49fa-b97c-7c6ed5db197a', 'TMCU-MD-H01', 'Modalidades intramural, extramural unidad móvil y jornada de salud', '5132130a-d5ce-420f-b185-c49f36efb8c2', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('de05e8f0-b496-40b9-bc31-d81b84fa3ab0', 'TMCU-MD-001', '7. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente cuenta con:', '5132130a-d5ce-420f-b185-c49f36efb8c2', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('1a6aef75-a353-4cfd-aacd-8b7d369bf395', 'TMCU-MD-002', '7.1. Espéculos de diferentes tamaños desechables o reutilizables siempre y cuando se garantice el proceso de esterilización.', '5132130a-d5ce-420f-b185-c49f36efb8c2', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('79d577c7-5131-4c35-9e04-7c41a18352d0', 'TMCU-MD-003', '7.2. Bata para el paciente.', '5132130a-d5ce-420f-b185-c49f36efb8c2', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('4a9cf69e-8107-4e99-9f2c-d9c139a537c3', 'TMCU-MD-004', '7.3. Fijador para células, cuando se requiera', '5132130a-d5ce-420f-b185-c49f36efb8c2', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('f3025675-ac0e-4f33-b70f-b8fe7bdf96ad', 'TMCU-MD-005', '7.4. Cepillo endocervical y espátula, desechables, cuando se requiera.', '5132130a-d5ce-420f-b185-c49f36efb8c2', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('6660b081-0096-41f1-a010-cbe1a89ca5ea', 'TMCU-MD-006', '7.5. Lámina portaobjetos de único uso con área de rotulado, cuando se requiera', '5132130a-d5ce-420f-b185-c49f36efb8c2', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('02c87d9a-da73-4445-b695-bbd25874d272', 'TMCU-MD-007', '7.6. Elemento para rotulación de láminas portaobjetos, cuando se requiera.', '5132130a-d5ce-420f-b185-c49f36efb8c2', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('379d5e79-8408-4885-b100-ae8d14e349a2', 'TMCU-MD-008', '7.7. Kits de toma de pruebas de ADN – VPH, cuando éstas se realicen.', '5132130a-d5ce-420f-b185-c49f36efb8c2', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('54456839-3659-4cd9-b1d5-13b55fa49f1c', 'TMCU-MD-009', '7.8. Soporte para fijación de muestras.', '5132130a-d5ce-420f-b185-c49f36efb8c2', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('1b25e760-da5d-47f0-8848-eb642e68878b', 'TMCU-MD-010', '7.9. Insumos para realización de citología base líquida, cuando se realice.', '5132130a-d5ce-420f-b185-c49f36efb8c2', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('686a2771-2e68-4fc5-ac8c-a030efd2e05f', 'TMCU-MD-011', '7.10. Insumos para técnicas de inspección visual: ácido acético y lugol, cuando se realice.', '5132130a-d5ce-420f-b185-c49f36efb8c2', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('b084ae8f-f56b-47e6-8b3a-c718c2754b03', 'TMCU-PP-H01', 'Modalidades intramural, extramural unidad móvil y jornada de salud', 'd7d87e54-ff26-4320-80c7-554bc57d0e9d', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('232c550f-bbcd-4099-b86a-840b4ea32348', 'TMCU-PP-001', '8. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente, cuenta con la siguiente información documentada:', 'd7d87e54-ff26-4320-80c7-554bc57d0e9d', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('88eaeba6-870c-43ea-9f43-5183de865e2e', 'TMCU-PP-002', '8.1. Toma, identificación, transporte, conservación, embalaje y remisión de las muestras.', 'd7d87e54-ff26-4320-80c7-554bc57d0e9d', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('7aa09fdb-bdcb-4258-8702-5b22fa05759b', 'TMCU-PP-003', '8.2. Toma de muestras de tejido del cuello del útero, pruebas ADN/VPH, técnicas de inspección visual y muestras ginecológicas cuando se oferte', 'd7d87e54-ff26-4320-80c7-554bc57d0e9d', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('1b545dfe-6123-4654-a2be-10f797550495', 'TMCU-PP-004', '8.3. Preparación de fijador de células cuando se realice.', 'd7d87e54-ff26-4320-80c7-554bc57d0e9d', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('e537a7e2-956e-4382-a2dd-5af70306d2fc', 'TMCU-PP-005', '8.4. Control de calidad.', 'd7d87e54-ff26-4320-80c7-554bc57d0e9d', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('4884fa83-613f-4eca-b573-393862bfca66', 'TMCU-PP-006', '8.5. Entrega de resultados.', 'd7d87e54-ff26-4320-80c7-554bc57d0e9d', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('572abf2e-b4aa-4024-9ebd-9d34a4ef167b', 'TMCU-HCR-H01', 'Modalidades intramural, extramural unidad móvil y jornada de salud', 'cc5c1012-b1d8-4be0-9df1-f14afa2fe0c1', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('e2656be4-6417-4fad-bf16-5186beac8d02', 'TMCU-HCR-001', '9. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente cuenta con los siguientes registros:', 'cc5c1012-b1d8-4be0-9df1-f14afa2fe0c1', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('7e85558e-dea0-483c-8220-3ccc6a712e4f', 'TMCU-HCR-002', '9.1. Pacientes y muestras tomadas.', 'cc5c1012-b1d8-4be0-9df1-f14afa2fe0c1', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('d26f01d4-18ba-40a3-9088-4251dfc815b8', 'TMCU-HCR-003', '9.2. Muestras remitidas para su procesamiento.', 'cc5c1012-b1d8-4be0-9df1-f14afa2fe0c1', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('09c7407e-49f2-453a-bd1a-09d35a1ad500', 'TMCU-HCR-004', '9.3. Resultados de los análisis con el nombre del laboratorio que realizó el procesamiento o lectura de las muestras y de la persona que los realizó.', 'cc5c1012-b1d8-4be0-9df1-f14afa2fe0c1', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('3da0b04c-ad88-4514-9a2f-e047af2c8a3f', 'TMCU-HCR-005', '9.4. Análisis del control de calidad y de las medidas preventivas y correctivas', 'cc5c1012-b1d8-4be0-9df1-f14afa2fe0c1', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('a39d35bd-adb9-43bc-8cd4-f64950d6ea06', 'TMCU-INT-H01', 'Modalidades intramural, extramural unidad móvil y jornada de salud', '89c1ea75-aa6f-45ae-a24b-8dfc6a982b15', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('666f457e-874a-47db-b9b6-1b9c9883d3b8', 'TMCU-INT-001', '10. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente disponibilidad de laboratorio de citología cervico-uterinas o servicio de patología.', '89c1ea75-aa6f-45ae-a24b-8dfc6a982b15', '40658c0f-31e4-488e-8afe-48b5f6081fab', TRUE, 'active', FALSE);

INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id) VALUES
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '27ac46af-c8fe-4475-ab69-fb0e28d028f4'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', 'dd6cd49a-36ec-47d5-9238-c298d7fcf3d1'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '6b0ca31d-c55b-4b81-a062-606fa7f2d06a'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '78ae618d-09f5-4e34-bdc6-03f2df443d9b'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', 'bdcac987-1e98-4036-bc94-87e63e3793a5'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', 'd73ec67f-d522-4504-9713-61ead840ca80'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', 'ee184e10-f8d6-402f-b536-3042b17d9331'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '4c035d52-711f-4918-b369-f41786a52bea'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '14a82e68-2c0a-4daf-a31c-50eb97097d61'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', 'cd44daf4-00f4-4c40-b084-76ed70eff622'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '001ecd71-9317-410b-8f5c-8c21b8983730'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '4a93d974-b583-4eac-8357-f39a85deb02b'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '654482ff-4eae-4fc6-aac4-15e5cc72a375'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '2b36d1cb-43d7-4d99-bd09-5cc39f7c6e6b'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '9ce5180d-80ab-4525-9545-666dc9537cb8'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '06a0329f-f870-4739-9e39-41e0c18c9fa5'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '150bfed7-4776-4532-8b3f-6ca8fb1fd3b5'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '9606faae-2eed-4cc8-b051-a1a5286fe3de'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '89802a70-0dd6-4e26-bc5e-376756dc9b4e'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '44f38540-4661-4ae7-a165-4de6e52a2a06'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', 'de05e8f0-b496-40b9-bc31-d81b84fa3ab0'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '1a6aef75-a353-4cfd-aacd-8b7d369bf395'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '79d577c7-5131-4c35-9e04-7c41a18352d0'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '4a9cf69e-8107-4e99-9f2c-d9c139a537c3'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', 'f3025675-ac0e-4f33-b70f-b8fe7bdf96ad'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '6660b081-0096-41f1-a010-cbe1a89ca5ea'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '02c87d9a-da73-4445-b695-bbd25874d272'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '379d5e79-8408-4885-b100-ae8d14e349a2'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '54456839-3659-4cd9-b1d5-13b55fa49f1c'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '1b25e760-da5d-47f0-8848-eb642e68878b'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '686a2771-2e68-4fc5-ac8c-a030efd2e05f'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '232c550f-bbcd-4099-b86a-840b4ea32348'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '88eaeba6-870c-43ea-9f43-5183de865e2e'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '7aa09fdb-bdcb-4258-8702-5b22fa05759b'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '1b545dfe-6123-4654-a2be-10f797550495'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', 'e537a7e2-956e-4382-a2dd-5af70306d2fc'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '4884fa83-613f-4eca-b573-393862bfca66'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', 'e2656be4-6417-4fad-bf16-5186beac8d02'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '7e85558e-dea0-483c-8220-3ccc6a712e4f'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', 'd26f01d4-18ba-40a3-9088-4251dfc815b8'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '09c7407e-49f2-453a-bd1a-09d35a1ad500'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '3da0b04c-ad88-4514-9a2f-e047af2c8a3f'),
  ('7256eee7-60fd-48fc-b859-0a724a7b1fef', '666f457e-874a-47db-b9b6-1b9c9883d3b8');

-- =============================================================================
-- SERVICIO: CBN - Cuidado Básico Neonatal
-- 70 criterios evaluables
-- =============================================================================

INSERT INTO services (id, code, name, category, status)
VALUES ('d4d7f1df-7969-4fba-82e3-595c49b214bb', 'CBN', 'Cuidado Básico Neonatal', 'Internación', 'available');

INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('c2ebb175-0cf6-431b-97b3-71a70e5697d9', 'CBN_TH', 'Talento Humano', 'd4d7f1df-7969-4fba-82e3-595c49b214bb');
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('0e6326c5-df55-4bac-b180-443b6cc3ad2a', 'CBN_INF', 'Infraestructura', 'd4d7f1df-7969-4fba-82e3-595c49b214bb');
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('838c71ff-d5f2-48a6-ba62-602be622c1a8', 'CBN_DOT', 'Dotacion', 'd4d7f1df-7969-4fba-82e3-595c49b214bb');
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('f0988d9e-8832-44b6-b600-fc7b00d4228a', 'CBN_MD', 'Medicamentos, Dispositivos Medicos e Insumos', 'd4d7f1df-7969-4fba-82e3-595c49b214bb');
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('c7a0fd1e-e8a5-4a70-b29b-20d1d3b10fa6', 'CBN_PP', 'Procesos Prioritarios', 'd4d7f1df-7969-4fba-82e3-595c49b214bb');
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('b590c460-5ad3-412a-a432-138e4d9c7328', 'CBN_HCR', 'Historia Clinica y Registros', 'd4d7f1df-7969-4fba-82e3-595c49b214bb');
INSERT INTO evaluation_standards (id, code, name, service_id)
VALUES ('e9277a8a-3f55-46a3-9257-cc09a7b9a14e', 'CBN_INT', 'Interdependencia de Servicios', 'd4d7f1df-7969-4fba-82e3-595c49b214bb');

INSERT INTO questionnaires (id, name, service_id, version_type, status, total_criteria, published_at)
VALUES ('907b5de2-f372-40f0-bfb3-32639d3597a7', 'Cuidado Básico Neonatal (Res. 3100/2019)', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', 'initial', 'published', 70, NOW());

INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('18647248-d82f-4e5b-94db-8715e735107b', 'CBN-TH-H01', 'Modalidad intramural y telemedicina - prestador remisor', 'c2ebb175-0cf6-431b-97b3-71a70e5697d9', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('9228690d-6f54-49ca-b67c-f8b1c52343e7', 'CBN-TH-001', '1. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente,', 'c2ebb175-0cf6-431b-97b3-71a70e5697d9', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('6c78173c-8d7f-41df-a20c-ba1e7de856e7', 'CBN-TH-002', '1.1 cuenta con auxiliar de enfermería.', 'c2ebb175-0cf6-431b-97b3-71a70e5697d9', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('3b88f1e9-6e6d-42a1-a67e-d3b71a4c5abc', 'CBN-TH-003', '2. Disponibilidad de:', 'c2ebb175-0cf6-431b-97b3-71a70e5697d9', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('81777edb-a6de-4dd6-adea-eeb8c3a2916d', 'CBN-TH-004', '2.1. Profesional de la medicina con constancia de acciones de formación continua en atención del paciente neonatal.', 'c2ebb175-0cf6-431b-97b3-71a70e5697d9', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('2181388e-2947-4ea8-a465-9775dc2c2c92', 'CBN-TH-005', '2.2. Profesional de la enfermería con constancia de acciones de formación continua en atención del paciente neonatal.', 'c2ebb175-0cf6-431b-97b3-71a70e5697d9', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('36436e35-7386-4ab0-aaf0-7c95a1ad6937', 'CBN-TH-H02', 'Modalidad telemedicina - prestador de referencia', 'c2ebb175-0cf6-431b-97b3-71a70e5697d9', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('78aabfc6-d3c0-45c3-8d18-6dcbb766aaaf', 'CBN-TH-006', '3. Cumple con los criterios que le sean aplicables de todos los servicios.', 'c2ebb175-0cf6-431b-97b3-71a70e5697d9', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('8fbd52a6-f6fe-45db-89fa-c4c26382a74c', 'CBN-TH-007', '4. El profesional de la salud puede hacer uso de la telexperticia sincrónica o asincrónica entre profesionales de la salud, de acuerdo con lo definido por el prestador de servicios de salud en el estándar de procesos prioritarios.', 'c2ebb175-0cf6-431b-97b3-71a70e5697d9', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('cf693583-a5db-4bef-9508-b45c5251f615', 'CBN-INF-H01', 'Modalidades intramural, telemedicina - prestador remisor', '0e6326c5-df55-4bac-b180-443b6cc3ad2a', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('d5c99481-a767-4dff-9ea9-a3c39deb2c28', 'CBN-INF-001', '5. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente cuenta con:', '0e6326c5-df55-4bac-b180-443b6cc3ad2a', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('6963b3e4-ff69-4176-9788-50e49d0e0891', 'CBN-INF-002', '5.1. Ambiente a manera de filtro, para acceso del talento humano en salud y visitantes, con lavamanos y área de casilleros.', '0e6326c5-df55-4bac-b180-443b6cc3ad2a', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('36f980b2-2210-476e-b490-8761be47f3f5', 'CBN-INF-003', '5.2. Estación de enfermería.', '0e6326c5-df55-4bac-b180-443b6cc3ad2a', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('effc0c23-08dc-4688-808a-dd21980b45bf', 'CBN-INF-004', '5.3. Ambiente o área para brindar información a familiares.', '0e6326c5-df55-4bac-b180-443b6cc3ad2a', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('1447a99f-f5c5-45f4-9455-cfd0786673a3', 'CBN-INF-005', '5.4. Área de incubadoras o cunas (4 m2 ), señalizado y de circulación restringida solo para personal autorizado', '0e6326c5-df55-4bac-b180-443b6cc3ad2a', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('4fe5cafe-9333-400b-878e-923e2b6711b7', 'CBN-INF-006', '6. Disponibilidad en el servicio de lavamanos.', '0e6326c5-df55-4bac-b180-443b6cc3ad2a', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('63f242f7-7f94-48fa-bf3a-5725ad51ac39', 'CBN-INF-007', '7. Los anteriores ambientes o áreas pueden ser compartidos entre los servicios de cuidado básico, intermedio e intensivo neonatal.', '0e6326c5-df55-4bac-b180-443b6cc3ad2a', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('6e527d6f-5545-45b5-9f25-8948af7924c3', 'CBN-INF-008', '8. Las puertas de acceso al servicio deben permitir el paso y giro de incubadoras y cunas.', '0e6326c5-df55-4bac-b180-443b6cc3ad2a', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('90965030-de57-4a83-8427-42e6da18e426', 'CBN-INF-009', '9. Disponibilidad de ambiente para extracción de leche materna y preparación de fórmulas artificiales.', '0e6326c5-df55-4bac-b180-443b6cc3ad2a', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('a5eb6691-6965-495c-a45b-9e07cb43d68a', 'CBN-INF-H02', 'Modalidad telemedicina – prestador referencia', '0e6326c5-df55-4bac-b180-443b6cc3ad2a', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('77c71377-4846-4415-b3b4-f2aca5b0e242', 'CBN-INF-010', '10. Cumple con los criterios que le sean aplicables de todos los servicios.', '0e6326c5-df55-4bac-b180-443b6cc3ad2a', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('032c6100-bd6c-4317-9f13-c59f8b457034', 'CBN-DOT-H01', 'Modalidades intramural y telemedicina - prestador remisor', '838c71ff-d5f2-48a6-ba62-602be622c1a8', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('3e4da7e5-dbe0-420a-aaff-87e6edbf6807', 'CBN-DOT-001', '11. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente por cada paciente cuenta con:', '838c71ff-d5f2-48a6-ba62-602be622c1a8', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('ff183199-6e57-44f4-8e77-0124472496dd', 'CBN-DOT-002', '11.1. Incubadora abierta o cuna para recién nacido', '838c71ff-d5f2-48a6-ba62-602be622c1a8', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('3fb955ba-fac7-4a48-af5d-eaf6378e823d', 'CBN-DOT-003', '11.2. Silla para el acompañante.', '838c71ff-d5f2-48a6-ba62-602be622c1a8', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('c483df3b-78ec-4388-abd3-dd7a97aed330', 'CBN-DOT-004', '12. Disponibilidad en el servicio de:', '838c71ff-d5f2-48a6-ba62-602be622c1a8', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('2b5d3641-98bc-4415-b05d-1c7d594d758f', 'CBN-DOT-005', '12.1. Fonendoscopio neonatal.', '838c71ff-d5f2-48a6-ba62-602be622c1a8', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('cb228ab6-aaa9-43c4-af78-5e1b1104c526', 'CBN-DOT-006', '12.2. Tensiómetro neonatal (cuando no esté incluido en el monitor de signos vitales).', '838c71ff-d5f2-48a6-ba62-602be622c1a8', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('87fe7323-0b9e-4bb1-a8b8-d888dc2613bf', 'CBN-DOT-007', '12.3. Monitor de signos vitales que incluya frecuencia cardiaca, respiratoria, tensión arterial no invasiva y saturación de oxígeno, con accesorios neonatales', '838c71ff-d5f2-48a6-ba62-602be622c1a8', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('1a92238c-2ed5-49fc-9980-3bb22f4f970c', 'CBN-DOT-008', '12.4. Oxímetro con sensor neonatal (cuando no esté incluido en el monitor de signos vitales).', '838c71ff-d5f2-48a6-ba62-602be622c1a8', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('88033c73-59d8-485f-8420-74b721024b11', 'CBN-DOT-009', '12.5. Bomba de infusión.', '838c71ff-d5f2-48a6-ba62-602be622c1a8', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('a20bca9c-7995-445d-9adf-870a3f44ee68', 'CBN-DOT-010', '12.6. Resucitador pulmonar manual neonatal.', '838c71ff-d5f2-48a6-ba62-602be622c1a8', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('d411a68c-96b9-4923-91ee-1a2d155d28b5', 'CBN-DOT-011', '12.7. Carro de paro', '838c71ff-d5f2-48a6-ba62-602be622c1a8', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('86a4244f-bacf-41bd-93b1-e68e9980a6ab', 'CBN-DOT-012', '12.8. Glucómetro.', '838c71ff-d5f2-48a6-ba62-602be622c1a8', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('5a8e2b33-3f39-48d0-85a7-1225b169b2d6', 'CBN-DOT-013', '12.9. Monitor neonatal de transporte.', '838c71ff-d5f2-48a6-ba62-602be622c1a8', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('db9e3b9e-41b7-4d29-9300-6eacfa08809a', 'CBN-DOT-014', '12.10.Incubadora neonatal de transporte', '838c71ff-d5f2-48a6-ba62-602be622c1a8', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('490e1f01-f0e0-4e5a-808a-a7c5757c54a6', 'CBN-DOT-015', '12.11.Ventilador neonatal de transporte', '838c71ff-d5f2-48a6-ba62-602be622c1a8', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('46fb3deb-23f5-4f18-9ee1-aa9c157e563c', 'CBN-DOT-016', '12.12.Lámpara de fototerapia', '838c71ff-d5f2-48a6-ba62-602be622c1a8', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('4ffa8743-aabe-4c04-9e0d-e9295a5f634d', 'CBN-DOT-017', '12.13.Báscula para bebés', '838c71ff-d5f2-48a6-ba62-602be622c1a8', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('42bc4525-7748-46ec-bf5b-fd841399ba91', 'CBN-DOT-018', '12.14.Tallímetro – infantómetro.', '838c71ff-d5f2-48a6-ba62-602be622c1a8', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('b3b3958a-1222-4df0-a861-6f943e44b859', 'CBN-DOT-019', '12.15.Cinta métrica.', '838c71ff-d5f2-48a6-ba62-602be622c1a8', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('1f9c461f-d450-46f9-bfa9-a18a1020dd5d', 'CBN-DOT-020', '12.16.Pesa pañales.', '838c71ff-d5f2-48a6-ba62-602be622c1a8', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('d78af386-48f6-4341-869e-3cf390cc29cc', 'CBN-DOT-021', '12.17.Electrocardiógrafo, que permita su impresión, si no está incluida en el monitor de signos vitales.', '838c71ff-d5f2-48a6-ba62-602be622c1a8', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('fd244e4d-8ee0-4cfc-a36e-78b3c90b88b5', 'CBN-DOT-022', '12.18.Equipo de órganos de los sentidos.', '838c71ff-d5f2-48a6-ba62-602be622c1a8', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('92c1457f-7f4e-4d18-8c25-c8f5cf2c57e0', 'CBN-DOT-023', '12.19.Oxígeno medicinal que puede ser suministrado mediante salida de oxígeno medicinal o
mediante oxígeno medicinal portátil.', '838c71ff-d5f2-48a6-ba62-602be622c1a8', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('04272c6a-e759-4151-be9c-8a9206e97b9e', 'CBN-DOT-024', '12.20.Succión. Puede ser suministrado mediante sistema de vacío o mediante aspirador', '838c71ff-d5f2-48a6-ba62-602be622c1a8', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('ad02a3a6-4818-4970-a281-21b2287ab031', 'CBN-DOT-H02', 'Modalidad telemedicina – prestador referencia', '838c71ff-d5f2-48a6-ba62-602be622c1a8', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('63892e90-2051-446c-b351-44fc8b21fd62', 'CBN-DOT-025', '13. Cumple con los criterios que le sean aplicables de todos los servicios.', '838c71ff-d5f2-48a6-ba62-602be622c1a8', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('f9fa97e9-a03d-49e7-95ed-54f7611f88d3', 'CBN-MD-H01', 'Modalidades intramural y telemedicina - prestador remisor – prestador de referencia', 'f0988d9e-8832-44b6-b600-fc7b00d4228a', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('4d9364f0-fc32-458b-acb0-e4d754e84aee', 'CBN-MD-001', '14. Cumple con los criterios que le sean aplicables de todos los servicios, y adicionalmente', 'f0988d9e-8832-44b6-b600-fc7b00d4228a', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('56748d7b-d52c-4387-991e-6eb00413109f', 'CBN-MD-002', '14.1. cuenta con oxígeno medicinal.', 'f0988d9e-8832-44b6-b600-fc7b00d4228a', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('ed11a84a-00fd-4a86-9cad-60487ef4a2d3', 'CBN-PP-H01', 'Modalidades intramural y telemedicina - prestador remisor – prestador de referencia', 'c7a0fd1e-e8a5-4a70-b29b-20d1d3b10fa6', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('ae57840f-5ffd-435d-a964-16c3ccd75dc4', 'CBN-PP-001', '15. Cumple con los criterios que le sean aplicables de todos los servicios, y adicionalmente, cuenta con la siguiente información documentada:', 'c7a0fd1e-e8a5-4a70-b29b-20d1d3b10fa6', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('c16779eb-9a91-49aa-bdff-861ad8f3134c', 'CBN-PP-002', '15.1. Ronda médica diaria de evolución de pacientes.', 'c7a0fd1e-e8a5-4a70-b29b-20d1d3b10fa6', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('2faacc7e-2f8a-46c5-be0f-b1bd3d76c401', 'CBN-PP-003', '15.2. Solicitud de interconsultas.', 'c7a0fd1e-e8a5-4a70-b29b-20d1d3b10fa6', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('bbb6aad0-0aa5-4732-9112-63c5a3820ff6', 'CBN-PP-004', '15.3. Entrega de turno por parte de enfermería y de medicina.', 'c7a0fd1e-e8a5-4a70-b29b-20d1d3b10fa6', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('6ced1ece-bed7-4eb2-8754-112b08fd9ad4', 'CBN-PP-005', '15.4. Control de líquidos.', 'c7a0fd1e-e8a5-4a70-b29b-20d1d3b10fa6', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('93804f0c-6907-4d48-8982-f26e91d2f93d', 'CBN-PP-006', '15.5. Plan de cuidados de enfermería.', 'c7a0fd1e-e8a5-4a70-b29b-20d1d3b10fa6', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('2a7c01d2-b65b-4a71-bd7d-3e7d0c245d6e', 'CBN-PP-007', '15.6. Administración de medicamentos.', 'c7a0fd1e-e8a5-4a70-b29b-20d1d3b10fa6', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('0d8b92e7-ffd6-4826-92f3-285d69ff865b', 'CBN-PP-008', '15.7. Sujeción de pacientes.', 'c7a0fd1e-e8a5-4a70-b29b-20d1d3b10fa6', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('f0f82b25-abd3-4234-832d-141038cee86f', 'CBN-PP-009', '15.8. Toma de muestras de laboratorio clínico.', 'c7a0fd1e-e8a5-4a70-b29b-20d1d3b10fa6', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('a97a58f7-570a-4c2e-bde0-057531c6e4b1', 'CBN-PP-010', '15.9. Cateterismo vesical.', 'c7a0fd1e-e8a5-4a70-b29b-20d1d3b10fa6', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('94db1061-ad7a-4813-855a-52e83df1ab58', 'CBN-PP-011', '15.10.Preparación para la toma de imágenes diagnósticas.', 'c7a0fd1e-e8a5-4a70-b29b-20d1d3b10fa6', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('388cea5d-02a9-484f-87a6-1176e2887dd6', 'CBN-PP-012', '15.11.Indicaciones del cuidado de la salud al familiar o responsable.', 'c7a0fd1e-e8a5-4a70-b29b-20d1d3b10fa6', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('2d5eed36-4425-4270-8c58-bd6217d1c4a4', 'CBN-PP-013', '15.12.Transporte del recién nacido.', 'c7a0fd1e-e8a5-4a70-b29b-20d1d3b10fa6', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('1fa6be4f-95a4-4a65-9df3-1629128befff', 'CBN-PP-014', '15.13.Manejo de líquidos y electrolitos y alteración de los mismos.', 'c7a0fd1e-e8a5-4a70-b29b-20d1d3b10fa6', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('c4297f52-4751-41ce-94cb-4d8337bf34ad', 'CBN-PP-015', '15.14.Prevención de la retinopatía del recién nacido', 'c7a0fd1e-e8a5-4a70-b29b-20d1d3b10fa6', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('d7fa54ce-91ac-4cd9-868d-913b97cae6f5', 'CBN-PP-016', '15.15.Remisión del prematuro al seguimiento en programa canguro.', 'c7a0fd1e-e8a5-4a70-b29b-20d1d3b10fa6', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('29146c2b-dbfd-41bd-ae95-d40ca81f033a', 'CBN-PP-H02', 'Modalidad telemedicina – prestador referencia', 'c7a0fd1e-e8a5-4a70-b29b-20d1d3b10fa6', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('d493dd1c-2639-4ea6-8bb5-9f58504471d5', 'CBN-PP-017', '16. Cumple con los criterios que le sean aplicables de todos los servicios.', 'c7a0fd1e-e8a5-4a70-b29b-20d1d3b10fa6', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('40022f65-240a-4eb2-9ada-ed24bc86b3db', 'CBN-HCR-H01', 'Modalidades intramural y telemedicina - prestador remisor - prestador de referencia', 'b590c460-5ad3-412a-a432-138e4d9c7328', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('282e8cf6-40d9-4597-ba3b-3cecb1ad8f1e', 'CBN-HCR-001', '17. Cumple con los criterios que le sean aplicables de todos los servicios', 'b590c460-5ad3-412a-a432-138e4d9c7328', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('e49d0975-4e6c-4d98-a626-7162992272e2', 'CBN-INT-H01', 'Modalidades intramural', 'e9277a8a-3f55-46a3-9257-cc09a7b9a14e', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('10a4f6e4-c308-4aff-9c6c-6e635a42ccc6', 'CBN-INT-001', '18. Cumple con los criterios que le sean aplicables de todos los servicios y adicionalmente endisponibilidad:', 'e9277a8a-3f55-46a3-9257-cc09a7b9a14e', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('be2a765f-b944-4488-aee7-c4f864dd9bee', 'CBN-INT-002', '18.1. Servicio de laboratorio clínico.', 'e9277a8a-3f55-46a3-9257-cc09a7b9a14e', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('d1c0e92d-7e91-41da-9646-e28d7aa49790', 'CBN-INT-003', '18.2. Servicio farmacéutico.', 'e9277a8a-3f55-46a3-9257-cc09a7b9a14e', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('b2a18469-3210-4a07-b142-56a606a42215', 'CBN-INT-004', '18.3. Servicio de transporte asistencial', 'e9277a8a-3f55-46a3-9257-cc09a7b9a14e', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('400fb110-5927-43be-8511-ec3e70c3f715', 'CBN-INT-005', '18.4. Servicio de imágenes diagnósticas.', 'e9277a8a-3f55-46a3-9257-cc09a7b9a14e', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('15d0fde7-f417-41ea-8c9a-8cfe77fd2c07', 'CBN-INT-006', '18.5. Servicio de cuidado intermedio neonatal.', 'e9277a8a-3f55-46a3-9257-cc09a7b9a14e', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('6492efcf-a2f3-4c0a-9bc7-475d3d7ba8e8', 'CBN-INT-007', '18.6. Servicios de apoyo hospitalario (lavandería y vigilancia).', 'e9277a8a-3f55-46a3-9257-cc09a7b9a14e', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('9737e3d0-5792-4035-acc6-9d2ef96fd311', 'CBN-INT-H02', 'Modalidad telemedicina - prestador remisor - prestador referencia', 'e9277a8a-3f55-46a3-9257-cc09a7b9a14e', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', TRUE);
INSERT INTO evaluation_criteria (id, code, description, standard_id, service_id, is_mandatory, status, is_section_header)
VALUES ('8ee77af7-7cd7-4c3b-bed8-5e6674282e7d', 'CBN-INT-008', '19. No aplica.', 'e9277a8a-3f55-46a3-9257-cc09a7b9a14e', 'd4d7f1df-7969-4fba-82e3-595c49b214bb', TRUE, 'active', FALSE);

INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id) VALUES
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '9228690d-6f54-49ca-b67c-f8b1c52343e7'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '6c78173c-8d7f-41df-a20c-ba1e7de856e7'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '3b88f1e9-6e6d-42a1-a67e-d3b71a4c5abc'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '81777edb-a6de-4dd6-adea-eeb8c3a2916d'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '2181388e-2947-4ea8-a465-9775dc2c2c92'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '78aabfc6-d3c0-45c3-8d18-6dcbb766aaaf'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '8fbd52a6-f6fe-45db-89fa-c4c26382a74c'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', 'd5c99481-a767-4dff-9ea9-a3c39deb2c28'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '6963b3e4-ff69-4176-9788-50e49d0e0891'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '36f980b2-2210-476e-b490-8761be47f3f5'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', 'effc0c23-08dc-4688-808a-dd21980b45bf'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '1447a99f-f5c5-45f4-9455-cfd0786673a3'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '4fe5cafe-9333-400b-878e-923e2b6711b7'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '63f242f7-7f94-48fa-bf3a-5725ad51ac39'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '6e527d6f-5545-45b5-9f25-8948af7924c3'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '90965030-de57-4a83-8427-42e6da18e426'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '77c71377-4846-4415-b3b4-f2aca5b0e242'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '3e4da7e5-dbe0-420a-aaff-87e6edbf6807'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', 'ff183199-6e57-44f4-8e77-0124472496dd'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '3fb955ba-fac7-4a48-af5d-eaf6378e823d'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', 'c483df3b-78ec-4388-abd3-dd7a97aed330'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '2b5d3641-98bc-4415-b05d-1c7d594d758f'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', 'cb228ab6-aaa9-43c4-af78-5e1b1104c526'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '87fe7323-0b9e-4bb1-a8b8-d888dc2613bf'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '1a92238c-2ed5-49fc-9980-3bb22f4f970c'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '88033c73-59d8-485f-8420-74b721024b11'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', 'a20bca9c-7995-445d-9adf-870a3f44ee68'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', 'd411a68c-96b9-4923-91ee-1a2d155d28b5'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '86a4244f-bacf-41bd-93b1-e68e9980a6ab'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '5a8e2b33-3f39-48d0-85a7-1225b169b2d6'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', 'db9e3b9e-41b7-4d29-9300-6eacfa08809a'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '490e1f01-f0e0-4e5a-808a-a7c5757c54a6'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '46fb3deb-23f5-4f18-9ee1-aa9c157e563c'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '4ffa8743-aabe-4c04-9e0d-e9295a5f634d'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '42bc4525-7748-46ec-bf5b-fd841399ba91'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', 'b3b3958a-1222-4df0-a861-6f943e44b859'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '1f9c461f-d450-46f9-bfa9-a18a1020dd5d'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', 'd78af386-48f6-4341-869e-3cf390cc29cc'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', 'fd244e4d-8ee0-4cfc-a36e-78b3c90b88b5'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '92c1457f-7f4e-4d18-8c25-c8f5cf2c57e0'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '04272c6a-e759-4151-be9c-8a9206e97b9e'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '63892e90-2051-446c-b351-44fc8b21fd62'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '4d9364f0-fc32-458b-acb0-e4d754e84aee'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '56748d7b-d52c-4387-991e-6eb00413109f'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', 'ae57840f-5ffd-435d-a964-16c3ccd75dc4'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', 'c16779eb-9a91-49aa-bdff-861ad8f3134c'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '2faacc7e-2f8a-46c5-be0f-b1bd3d76c401'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', 'bbb6aad0-0aa5-4732-9112-63c5a3820ff6'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '6ced1ece-bed7-4eb2-8754-112b08fd9ad4'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '93804f0c-6907-4d48-8982-f26e91d2f93d'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '2a7c01d2-b65b-4a71-bd7d-3e7d0c245d6e'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '0d8b92e7-ffd6-4826-92f3-285d69ff865b'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', 'f0f82b25-abd3-4234-832d-141038cee86f'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', 'a97a58f7-570a-4c2e-bde0-057531c6e4b1'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '94db1061-ad7a-4813-855a-52e83df1ab58'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '388cea5d-02a9-484f-87a6-1176e2887dd6'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '2d5eed36-4425-4270-8c58-bd6217d1c4a4'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '1fa6be4f-95a4-4a65-9df3-1629128befff'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', 'c4297f52-4751-41ce-94cb-4d8337bf34ad'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', 'd7fa54ce-91ac-4cd9-868d-913b97cae6f5'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', 'd493dd1c-2639-4ea6-8bb5-9f58504471d5'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '282e8cf6-40d9-4597-ba3b-3cecb1ad8f1e'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '10a4f6e4-c308-4aff-9c6c-6e635a42ccc6'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', 'be2a765f-b944-4488-aee7-c4f864dd9bee'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', 'd1c0e92d-7e91-41da-9646-e28d7aa49790'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', 'b2a18469-3210-4a07-b142-56a606a42215'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '400fb110-5927-43be-8511-ec3e70c3f715'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '15d0fde7-f417-41ea-8c9a-8cfe77fd2c07'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '6492efcf-a2f3-4c0a-9bc7-475d3d7ba8e8'),
  ('907b5de2-f372-40f0-bfb3-32639d3597a7', '8ee77af7-7cd7-4c3b-bed8-5e6674282e7d');

COMMIT;
-- =============================================================================
-- Agrega los 29 títulos de sección (is_section_header = TRUE) del Servicio
-- Farmacéutico al cuestionario SF para que aparezcan en la vista de evaluación.
--
-- Cuestionario SF: 9722832d-2b41-4d67-b251-d649ded3abe9
-- Servicio SF:     7ac74504-ceb9-4c49-88ad-f3742c14cc10
--
-- La consulta GET /api/assessments/:id/questions (3er UNION) obtiene los headers
-- de sección específicos del servicio desde questionnaire_criteria, por eso
-- deben estar enlazados aquí.
-- =============================================================================

BEGIN;

INSERT INTO questionnaire_criteria (questionnaire_id, criterion_id)
VALUES
  -- TH — Talento Humano
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '4296caf3-8ffb-43dd-abe3-d964ea869097'), -- SF-TH-H01
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '00a95559-78dc-456b-9a11-77f4956a54ee'), -- SF-TH-H03
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '6b547719-ebf0-437f-bdab-6a8ed15d02f3'), -- SF-TH-H04

  -- INF — Infraestructura
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '5e47409b-87f4-49cb-ae2f-8e139d27300c'), -- SF-INF-H01
  ('9722832d-2b41-4d67-b251-d649ded3abe9', 'a22ab031-0595-4c4b-b6fe-f21b82b4c177'), -- SF-INF-H02
  ('9722832d-2b41-4d67-b251-d649ded3abe9', 'd99552d3-03c1-42ea-8471-7380992b1b46'), -- SF-INF-H03
  ('9722832d-2b41-4d67-b251-d649ded3abe9', 'e2403236-eeac-47c8-adc4-8dc07ba6f2ae'), -- SF-INF-H04
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '3223f1dd-a833-4036-9b26-035e59045838'), -- SF-INF-H05

  -- DOT — Dotación
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '9c80e37a-2ce0-4a34-9467-c484b6cb287e'), -- SF-DOT-H01
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '054ffcc7-745c-4c51-8a16-2c12a4db1a06'), -- SF-DOT-H02
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '211eb0ec-db63-4daa-aebe-d1d8ad9b4492'), -- SF-DOT-H03

  -- MED — Medicamentos, Dispositivos Médicos e Insumos (antes SF_MD)
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '362f64c7-38d3-4031-aeb3-a6ecd5080975'), -- SF-MED-H01
  ('9722832d-2b41-4d67-b251-d649ded3abe9', 'd5a38ca7-835b-4f72-88e7-1cf5ebcc91fa'), -- SF-MED-H02
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '4debbd91-e65e-44d2-b1d4-326c95a9f250'), -- SF-MED-H03
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '55f96241-707b-47c2-ba25-7d20a6ec8585'), -- SF-MED-H04
  ('9722832d-2b41-4d67-b251-d649ded3abe9', 'ea6a17d2-623a-498a-9bb1-268ee9efb134'), -- SF-MED-H05
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '22c6b39a-87f6-4bc3-a9d0-d119a9d21f0c'), -- SF-MED-H06
  ('9722832d-2b41-4d67-b251-d649ded3abe9', 'aa9ada64-54cd-48ce-8379-f156cef6d550'), -- SF-MED-H07

  -- PP — Procesos Prioritarios
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '37af5c96-9182-44d7-922d-c2110743c8e8'), -- SF-PP-H01
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '87846ccc-faa2-428d-80bd-f30f5490b59e'), -- SF-PP-H02
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '65be6a98-38cd-4a07-804f-4b0243a3035d'), -- SF-PP-H03
  ('9722832d-2b41-4d67-b251-d649ded3abe9', 'fe946162-e0d7-4a87-810d-98faae87456f'), -- SF-PP-H04
  ('9722832d-2b41-4d67-b251-d649ded3abe9', 'f678f854-dd8c-4380-8fce-590e4503419c'), -- SF-PP-H05
  ('9722832d-2b41-4d67-b251-d649ded3abe9', 'e1b699e5-860d-491a-a703-f98b1a95c9eb'), -- SF-PP-H06

  -- HC — Historia Clínica y Registros (antes SF_HCR)
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '84e9aede-aa11-4b1c-82aa-2b22bdb24e16'), -- SF-HC-H01
  ('9722832d-2b41-4d67-b251-d649ded3abe9', 'f10ff3a8-5ccf-403a-99dd-278c2c01ee43'), -- SF-HC-H02
  ('9722832d-2b41-4d67-b251-d649ded3abe9', 'f1390169-5b45-4e3c-8054-12a05d80b782'), -- SF-HC-H03

  -- INT — Interdependencia de Servicios
  ('9722832d-2b41-4d67-b251-d649ded3abe9', 'a23ef51c-a7ae-48b3-8689-339945e29517'), -- SF-INT-H01
  ('9722832d-2b41-4d67-b251-d649ded3abe9', 'cec62164-092f-41d7-a433-375faec80905'), -- SF-INT-H02
  ('9722832d-2b41-4d67-b251-d649ded3abe9', '6c5fbfdf-cb84-440e-aaf0-18a5142ed4cd')  -- SF-INT-H03
ON CONFLICT DO NOTHING;

COMMIT;

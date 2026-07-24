-- Links the 157 real REPS services (services.type='reps_service') to the 39 internal
-- "capitulo de cumplimiento" rows (services.type='compliance_chapter') whose extra
-- evaluation_criteria/evaluation_standards/questionnaires should logically apply to them.
--
-- Purely additive: does NOT touch services_enabled, assessments, findings,
-- capacidad_instalada_servicios, evaluation_criteria, evaluation_standards, or questionnaires.
-- Those keep referencing whatever service_id they already reference. This table only exists to
-- support a future "auto-suggest applicable capitulos from the provider's real enabled REPS
-- services" feature -- that feature is NOT implemented yet, this migration only lays the data
-- groundwork for it.
--
-- confidence values:
--   'high'         -- exact or near-exact name match, or an obvious synonym/singular-plural
--                     variant confirmed by manual review (e.g. TRF "Terapia Fisica" ->
--                     "Fisioterapia"). Not reviewed by a Res.3100 domain expert yet, but not
--                     expected to need correction.
--   'needs_review' -- genuinely ambiguous: either the capitulo's generic name splits into 2+
--                     distinct REPS services (e.g. DLS "Dialisis" -> Hemodialisis AND Dialisis
--                     Peritoneal), or the best candidate is a weak/uncertain name match. Query
--                     `SELECT * FROM service_chapter_mapping WHERE confidence = 'needs_review'`
--                     for Dra. Adriana's review checklist -- do not treat these as final until
--                     she confirms.
--
-- Deliberately NOT mapped (no rows inserted):
--   CEE (Consulta Externa Especializada), QRG (Quirurgico) -- these capitulos have no single
--     REPS-service analog; they conceptually span an entire category (CEE: 91 Consulta Externa
--     services, QRG: 24 Quirurgicos services). Mapping them 1:1 would misrepresent the domain.
--     Needs a design decision (category-level rule vs many-to-many) plus Adriana's confirmation
--     that a category-wide interpretation is even correct -- not just "which service".
--   LAB-CAL (Laboratorio Clinico - Calidad) -- this is Res. 1619, not Res. 3100; no REPS mapping
--     applies to it at all.

CREATE TABLE IF NOT EXISTS service_chapter_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  confidence VARCHAR(20) NOT NULL DEFAULT 'high',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (service_id, chapter_id)
);

-- ===== confidence = 'high' (28 chapters, clean 1:1 match) =====

INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence)
SELECT s.id, c.id, 'high' FROM services s, services c WHERE s.code = '1105' AND c.code = 'APH' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence)
SELECT s.id, c.id, 'high' FROM services s, services c WHERE s.code = '1101' AND c.code = 'APR' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence)
SELECT s.id, c.id, 'high' FROM services s, services c WHERE s.code = '120' AND c.code = 'CBN' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence)
SELECT s.id, c.id, 'high' FROM services s, services c WHERE s.code = '420' AND c.code = 'CEV' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence, note)
SELECT s.id, c.id, 'high', 'Singular/plural variant only: capitulo says Adulto, REPS says Adultos' FROM services s, services c WHERE s.code = '110' AND c.code = 'CIA' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence)
SELECT s.id, c.id, 'high' FROM services s, services c WHERE s.code = '105' AND c.code = 'CII' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence)
SELECT s.id, c.id, 'high' FROM services s, services c WHERE s.code = '106' AND c.code = 'CIM' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence, note)
SELECT s.id, c.id, 'high', 'Singular/plural variant only: capitulo says Adulto, REPS says Adultos' FROM services s, services c WHERE s.code = '107' AND c.code = 'CIMA' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence)
SELECT s.id, c.id, 'high' FROM services s, services c WHERE s.code = '108' AND c.code = 'CINN' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence)
SELECT s.id, c.id, 'high' FROM services s, services c WHERE s.code = '109' AND c.code = 'CIP' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence)
SELECT s.id, c.id, 'high' FROM services s, services c WHERE s.code = '138' AND c.code = 'CPC' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence)
SELECT s.id, c.id, 'high' FROM services s, services c WHERE s.code = '742' AND c.code = 'DVX' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence, note)
SELECT s.id, c.id, 'high', 'Hyphenation variant only: capitulo says Trasfusional, REPS says Transfusional' FROM services s, services c WHERE s.code = '746' AND c.code = 'GNT' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence)
SELECT s.id, c.id, 'high' FROM services s, services c WHERE s.code = '131' AND c.code = 'HSC' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence)
SELECT s.id, c.id, 'high' FROM services s, services c WHERE s.code = '132' AND c.code = 'HSP' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence)
SELECT s.id, c.id, 'high' FROM services s, services c WHERE s.code = '743' AND c.code = 'HTR' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence)
SELECT s.id, c.id, 'high' FROM services s, services c WHERE s.code = '706' AND c.code = 'LAB' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence)
SELECT s.id, c.id, 'high' FROM services s, services c WHERE s.code = '717' AND c.code = 'LAC' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence)
SELECT s.id, c.id, 'high' FROM services s, services c WHERE s.code = '731' AND c.code = 'LHT' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence, note)
SELECT s.id, c.id, 'high', 'Category-disambiguated: REPS has this name twice (383 Consulta Externa, 715 Apoyo Diagnostico) -- chose the same-category one' FROM services s, services c WHERE s.code = '715' AND c.code = 'MNUC' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence)
SELECT s.id, c.id, 'high' FROM services s, services c WHERE s.code = '709' AND c.code = 'QMT' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence, note)
SELECT s.id, c.id, 'high', 'Category-disambiguated: REPS has this name twice (408 Consulta Externa, 711 Apoyo Diagnostico) -- chose the same-category one' FROM services s, services c WHERE s.code = '711' AND c.code = 'RDT' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence, note)
SELECT s.id, c.id, 'high', 'Found via manual synonym review, not name matching: "Rayos X Odontologicos" = "Radiologia Odontologica"' FROM services s, services c WHERE s.code = '748' AND c.code = 'RXO' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence)
SELECT s.id, c.id, 'high' FROM services s, services c WHERE s.code = '714' AND c.code = 'SF' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence)
SELECT s.id, c.id, 'high' FROM services s, services c WHERE s.code = '712' AND c.code = 'TLC' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence)
SELECT s.id, c.id, 'high' FROM services s, services c WHERE s.code = '749' AND c.code = 'TMCU' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence, note)
SELECT s.id, c.id, 'high', 'Found via manual synonym review, not name matching: "Terapia Fisica" = "Fisioterapia"' FROM services s, services c WHERE s.code = '739' AND c.code = 'TRF' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence)
SELECT s.id, c.id, 'high' FROM services s, services c WHERE s.code = '1102' AND c.code = 'URG' ON CONFLICT DO NOTHING;

-- ===== confidence = 'needs_review' -- capitulo splits into 2 distinct REPS services (5 chapters, 10 rows) =====
-- Both candidates inserted; Adriana needs to say whether the chapter's extra criteria apply to
-- both, or should be split/duplicated differently.

INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence, note)
SELECT s.id, c.id, 'needs_review', 'DLS "Dialisis" is generic; REPS splits it into Hemodialisis and Dialisis Peritoneal' FROM services s, services c WHERE s.code = '733' AND c.code = 'DLS' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence, note)
SELECT s.id, c.id, 'needs_review', 'DLS "Dialisis" is generic; REPS splits it into Hemodialisis and Dialisis Peritoneal' FROM services s, services c WHERE s.code = '734' AND c.code = 'DLS' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence, note)
SELECT s.id, c.id, 'needs_review', 'HPP "Hospitalizacion Paciente Cronico" is generic; REPS splits by ventilator use' FROM services s, services c WHERE s.code = '133' AND c.code = 'HPP' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence, note)
SELECT s.id, c.id, 'needs_review', 'HPP "Hospitalizacion Paciente Cronico" is generic; REPS splits by ventilator use' FROM services s, services c WHERE s.code = '134' AND c.code = 'HPP' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence, note)
SELECT s.id, c.id, 'needs_review', 'IDX "Imagenes Diagnosticas" is generic; REPS splits by ionizing vs non-ionizing' FROM services s, services c WHERE s.code = '744' AND c.code = 'IDX' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence, note)
SELECT s.id, c.id, 'needs_review', 'IDX "Imagenes Diagnosticas" is generic; REPS splits by ionizing vs non-ionizing' FROM services s, services c WHERE s.code = '745' AND c.code = 'IDX' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence, note)
SELECT s.id, c.id, 'needs_review', 'TAS "Transporte Asistencial" is generic; REPS splits into Basico and Medicalizado' FROM services s, services c WHERE s.code = '1103' AND c.code = 'TAS' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence, note)
SELECT s.id, c.id, 'needs_review', 'TAS "Transporte Asistencial" is generic; REPS splits into Basico and Medicalizado' FROM services s, services c WHERE s.code = '1104' AND c.code = 'TAS' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence, note)
SELECT s.id, c.id, 'needs_review', 'CES "Consulta Externa Ss En El Trabajo" -- unclear if "Ss" means Medicina Del Trabajo or Seguridad Y Salud En El Trabajo; both inserted' FROM services s, services c WHERE s.code = '407' AND c.code = 'CES' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence, note)
SELECT s.id, c.id, 'needs_review', 'CES "Consulta Externa Ss En El Trabajo" -- unclear if "Ss" means Medicina Del Trabajo or Seguridad Y Salud En El Trabajo; both inserted' FROM services s, services c WHERE s.code = '423' AND c.code = 'CES' ON CONFLICT DO NOTHING;

-- ===== confidence = 'needs_review' -- single best-guess candidate, weak name match (3 chapters, 3 rows) =====

INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence, note)
SELECT s.id, c.id, 'needs_review', 'CEG "Consulta Externa General" -- best guess "Medicina General", weak name match, unconfirmed' FROM services s, services c WHERE s.code = '328' AND c.code = 'CEG' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence, note)
SELECT s.id, c.id, 'needs_review', 'HGP "Hospitalizacion General" -- best guess "Hospitalizacion Adultos", weak name match, unconfirmed. May instead mean multiple Internacion services.' FROM services s, services c WHERE s.code = '129' AND c.code = 'HGP' ON CONFLICT DO NOTHING;
INSERT INTO service_chapter_mapping (service_id, chapter_id, confidence, note)
SELECT s.id, c.id, 'needs_review', 'LPT "Laboratorio De Patologia" -- best guess "Patologia" (Apoyo Diagnostico category match), weak name match, unconfirmed' FROM services s, services c WHERE s.code = '747' AND c.code = 'LPT' ON CONFLICT DO NOTHING;

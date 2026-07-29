-- Corrects 5 spelling typos in the official REPS service catalog (codes 344, 354, 336, 355, 135)
-- found by diffing the live `services` table against the auditoria team's source of truth
-- spreadsheet (habilitaPRO - SERVICIOS.xlsx). Missing accents / a stray double space -- no
-- services were missing, extra, or mis-categorized -- this was the only real discrepancy.
UPDATE services SET name = 'Psicología' WHERE code = '344' AND name = 'Psicologa';
UPDATE services SET name = 'Toxicología' WHERE code = '354' AND name = 'Toxicologa';
UPDATE services SET name = 'Oncología Clínica' WHERE code = '336' AND name = 'Oncología Clnica';
UPDATE services SET name = 'Urología' WHERE code = '355' AND name = 'Urologa';
UPDATE services SET name = 'Hospitalización En Consumo De Sustancias Psicoactivas'
  WHERE code = '135' AND name = 'Hospitalización En  Consumo De Sustancias Psicoactivas';

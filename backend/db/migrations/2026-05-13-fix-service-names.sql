-- =============================================================================
-- Migración: Corregir nombres incorrectos de servicios específicos
-- Fuente de verdad: Archivo_Consolidaddo_Resolucion_3100-2019.xlsx
--
-- Solo se actualiza services.name (nombre visible).
-- Los criterios y sus códigos NO se modifican.
-- =============================================================================

BEGIN;

UPDATE services SET name = 'Vacunación'                                        WHERE code = 'CEV';
UPDATE services SET name = 'Hemodinamia e Intervencionismo'                    WHERE code = 'HTR';
UPDATE services SET name = 'Gestión Pre-Trasfusional'                          WHERE code = 'GNT';
UPDATE services SET name = 'Toma de Muestras de Laboratorio Clínico'           WHERE code = 'TLC';
UPDATE services SET name = 'Laboratorio de Citologías Cervico-Uterinas'        WHERE code = 'LAC';
UPDATE services SET name = 'Laboratorio de Histotecnología'                    WHERE code = 'LHT';
UPDATE services SET name = 'Hospitalización Paciente Crónico'                  WHERE code = 'HPP';
UPDATE services SET name = 'Hospitalización Parcial'                           WHERE code = 'HSP';
UPDATE services SET name = 'Cuidado Básico - Consumo de Sustancias Psicoactivas' WHERE code = 'CPC';

COMMIT;

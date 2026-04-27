/**
 * Migración: agregar 'resend' como proveedor de email válido
 * Reemplaza el CHECK constraint de email_provider en email_deliveries
 */

-- Eliminar el CHECK constraint existente y recrearlo con 'resend'
ALTER TABLE email_deliveries
  DROP CONSTRAINT IF EXISTS email_deliveries_email_provider_check;

ALTER TABLE email_deliveries
  ADD CONSTRAINT email_deliveries_email_provider_check
  CHECK (email_provider IN ('mailgun', 'sendgrid', 'aws_ses', 'resend'));

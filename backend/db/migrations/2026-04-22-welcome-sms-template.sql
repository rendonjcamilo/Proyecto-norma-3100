/**
 * Welcome SMS Template Migration
 * Adds a professional welcome SMS template for Norma 3100 audit system
 * Complements the email welcome template with a concise SMS notification
 */

INSERT INTO sms_templates (
  template_name,
  message_template,
  max_length,
  variables,
  language,
  is_active
) VALUES (
  'Bienvenida',
  '¡Hola {{name}}! Bienvenido al Sistema de Auditoría Norma 3100. Accede ahora para iniciar tu autoevaluación: {{link}}',
  160,
  '["name", "link"]'::jsonb,
  'es_CO',
  true
)
ON CONFLICT (template_name) DO UPDATE SET
  message_template = EXCLUDED.message_template,
  max_length = EXCLUDED.max_length,
  variables = EXCLUDED.variables,
  updated_at = CURRENT_TIMESTAMP;

/**
 * Welcome Email Template Migration
 * Adds a professional welcome email template for Norma 3100 audit system
 */

INSERT INTO email_templates (
  template_name,
  subject,
  html_body,
  text_body,
  variables,
  language,
  is_active
) VALUES (
  'Bienvenida',
  'Bienvenido al Sistema de Auditoría — Resolución Norma 3100',
  '
  <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; color: #333; line-height: 1.6;">
      <table width="100%" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center;">
        <tr>
          <td>
            <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Bienvenido al Sistema de Auditoría</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Resolución 3100 de 2019</p>
          </td>
        </tr>
      </table>

      <table width="100%" style="padding: 40px 20px;">
        <tr>
          <td style="max-width: 600px; margin: 0 auto;">
            <h2 style="color: #667eea; font-size: 22px; margin-bottom: 20px;">¡Hola {{name}}!</h2>

            <p>Te damos la más cordial bienvenida al <strong>Sistema de Gestión de Cumplimiento para la Resolución Norma 3100</strong>.</p>

            <p>Esta plataforma ha sido diseñada para facilitar la <strong>autoevaluación y verificación del cumplimiento</strong> de los estándares transversales establecidos por el Ministerio de Salud y Protección Social de Colombia.</p>

            <h3 style="color: #764ba2; font-size: 18px; margin-top: 30px; margin-bottom: 15px;">¿Qué puedes hacer en esta plataforma?</h3>

            <ul style="line-height: 2; font-size: 15px;">
              <li><strong>Autoevaluarse:</strong> Completa cuestionarios basados en los 7 estándares transversales</li>
              <li><strong>Rastrear hallazgos:</strong> Identifica inconformidades y oportunidades de mejora</li>
              <li><strong>Planificar acciones:</strong> Desarrolla planes de acción para mejorar el cumplimiento</li>
              <li><strong>Generar reportes:</strong> Documenta tu progreso y evidencia de conformidad</li>
            </ul>

            <div style="background: #f5f5f5; padding: 20px; margin: 30px 0; border-left: 4px solid #667eea; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                <strong>Fecha de acceso:</strong> {{date}}<br>
                <strong>Tu rol:</strong> Auditor del Sistema de Cumplimiento
              </p>
            </div>

            <h3 style="color: #764ba2; font-size: 18px; margin-top: 30px; margin-bottom: 15px;">Próximos pasos</h3>

            <ol style="line-height: 2; font-size: 15px;">
              <li>Completa tu perfil y datos de contacto</li>
              <li>Revisa la guía de uso del sistema</li>
              <li>Comienza con tu primera evaluación</li>
              <li>Consulta con soporte si tienes preguntas</li>
            </ol>

            <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #eee; text-align: center;">
              <p style="font-size: 14px; color: #999; margin: 0;">
                Para más información sobre la Resolución Norma 3100, consulta el
                <a href="#" style="color: #667eea; text-decoration: none;">sitio oficial del Ministerio de Salud</a>
              </p>
            </div>

            <p style="margin-top: 30px; font-size: 13px; color: #999; text-align: center;">
              Equipo de Auditoría — Sistema de Gestión de Cumplimiento Norma 3100
            </p>
          </td>
        </tr>
      </table>
    </body>
  </html>
  ',
  'Bienvenido al Sistema de Auditoría — Resolución Norma 3100

¡Hola {{name}}!

Te damos la más cordial bienvenida al Sistema de Gestión de Cumplimiento para la Resolución Norma 3100.

Esta plataforma ha sido diseñada para facilitar la autoevaluación y verificación del cumplimiento de los estándares transversales establecidos por el Ministerio de Salud y Protección Social de Colombia.

¿Qué puedes hacer en esta plataforma?
- Autoevaluarse: Completa cuestionarios basados en los 7 estándares transversales
- Rastrear hallazgos: Identifica inconformidades y oportunidades de mejora
- Planificar acciones: Desarrolla planes de acción para mejorar el cumplimiento
- Generar reportes: Documenta tu progreso y evidencia de conformidad

Fecha de acceso: {{date}}
Tu rol: Auditor del Sistema de Cumplimiento

Próximos pasos:
1. Completa tu perfil y datos de contacto
2. Revisa la guía de uso del sistema
3. Comienza con tu primera evaluación
4. Consulta con soporte si tienes preguntas

Equipo de Auditoría — Sistema de Gestión de Cumplimiento Norma 3100
  ',
  '["name", "date"]'::jsonb,
  'es_CO',
  true
)
ON CONFLICT (template_name) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body,
  variables = EXCLUDED.variables,
  updated_at = CURRENT_TIMESTAMP;

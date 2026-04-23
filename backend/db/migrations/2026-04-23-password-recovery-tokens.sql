-- Migración: tabla de tokens para recuperación de contraseña
-- Usada por PasswordRecoveryService

CREATE TABLE IF NOT EXISTS password_recovery_tokens (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   VARCHAR(64) NOT NULL,
  used         BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL,
  used_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_recovery_tokens_user_id    ON password_recovery_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_tokens_token_hash ON password_recovery_tokens(token_hash);

-- Template de email para recuperación de contraseña
-- Variables: {{name}}, {{reset_link}}, {{expiry_minutes}}
INSERT INTO email_templates (name, subject, html_body, text_body, variables, is_active, created_at, updated_at)
VALUES (
  'password-reset',
  'Recuperación de contraseña — Norma 3100',
  '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  h2 { color: #4f46e5; }
  .btn { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
  .note { font-size: 12px; color: #888; margin-top: 20px; }
</style></head>
<body>
  <div class="container">
    <h2>Recuperación de contraseña</h2>
    <p>Hola <strong>{{name}}</strong>,</p>
    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en el Sistema de Gestión de Cumplimiento Norma 3100.</p>
    <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
    <a href="{{reset_link}}" class="btn">Restablecer contraseña</a>
    <p>Este enlace vencerá en <strong>{{expiry_minutes}} minutos</strong>.</p>
    <p>Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña actual permanece segura.</p>
    <p class="note">Si el botón no funciona, copia y pega este enlace en tu navegador:<br>{{reset_link}}</p>
  </div>
</body>
</html>',
  'Hola {{name}}, recibimos una solicitud para restablecer tu contraseña. Visita el siguiente enlace: {{reset_link}} — Este enlace vence en {{expiry_minutes}} minutos.',
  '["name", "reset_link", "expiry_minutes"]',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO NOTHING;

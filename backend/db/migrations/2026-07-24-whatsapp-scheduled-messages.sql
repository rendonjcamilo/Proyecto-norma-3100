-- Cola de mensajes de WhatsApp diferidos fuera de horario laboral. Additive-only, nueva tabla,
-- no toca whatsapp_message_log ni ninguna tabla existente.
CREATE TABLE IF NOT EXISTS whatsapp_scheduled_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auditor_user_id UUID NOT NULL,
  phone VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  provider_nit VARCHAR(20),
  provider_name VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_scheduled_pending
  ON whatsapp_scheduled_messages (scheduled_for)
  WHERE status = 'pending';

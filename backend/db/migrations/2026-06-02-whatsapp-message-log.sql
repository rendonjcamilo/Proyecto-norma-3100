-- Registra cada mensaje de WhatsApp enviado para evitar contactos duplicados en ≤30 días
-- Permite mostrar "Mensaje enviado hace X días" en el panel REPS sin reabrir el chat

CREATE TABLE IF NOT EXISTS whatsapp_message_log (
  id          SERIAL PRIMARY KEY,
  auditor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  phone_number    VARCHAR(20) NOT NULL,
  provider_nit    VARCHAR(30),
  provider_name   TEXT,
  message_preview TEXT,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wml_phone_sent
  ON whatsapp_message_log(phone_number, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_wml_auditor_sent
  ON whatsapp_message_log(auditor_user_id, sent_at DESC);

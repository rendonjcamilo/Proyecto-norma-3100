-- =============================================================================
-- INVIMA Schema — Pharmaceutical Registry (Standard TSMD)
-- Registro de medicamentos, dispositivos médicos e insumos por prestador
-- =============================================================================

BEGIN;

-- ─── PROVIDER INVIMA ITEMS ───
-- Medicamentos, dispositivos e insumos registrados en INVIMA por prestador

CREATE TABLE IF NOT EXISTS provider_invima_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  invima_registro_id VARCHAR(50) NOT NULL, -- Número de registro INVIMA
  nombre_comercial VARCHAR(255),
  lote_actual VARCHAR(100),
  cantidad_disponible INTEGER,
  ubicacion_almacenamiento TEXT,
  condiciones_almacenamiento TEXT,
  fecha_vencimiento_lote DATE,
  fecha_vencimiento_registro DATE,
  estado_registro VARCHAR(50), -- vigente, vencido, suspendido, cancelado, en_tramite
  semaforo VARCHAR(20), -- verde, naranja, amarillo, rojo, gris
  activo BOOLEAN DEFAULT TRUE,
  motivo_inactivacion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Composite unique constraint for upsert operations
  UNIQUE(provider_id, invima_registro_id, lote_actual)
);

CREATE INDEX idx_provider_invima_items_provider_id ON provider_invima_items(provider_id);
CREATE INDEX idx_provider_invima_items_registro_id ON provider_invima_items(invima_registro_id);
CREATE INDEX idx_provider_invima_items_semaforo ON provider_invima_items(semaforo);
CREATE INDEX idx_provider_invima_items_estado ON provider_invima_items(estado_registro);

-- ─── INVIMA ALERTAS ───
-- Alertas de farmacovigilancia y tecnovigilancia

CREATE TABLE IF NOT EXISTS invima_alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  invima_registro_id VARCHAR(50) NOT NULL,
  tipo_alerta VARCHAR(50) NOT NULL, -- farmacovigilancia, tecnovigilancia
  descripcion TEXT,
  fecha_alerta DATE,
  requerimientos TEXT,
  revisada BOOLEAN DEFAULT FALSE,
  accion_tomada TEXT,
  revisada_por UUID REFERENCES users(id) ON DELETE SET NULL,
  revisada_en TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invima_alertas_provider_id ON invima_alertas(provider_id);
CREATE INDEX idx_invima_alertas_registro_id ON invima_alertas(invima_registro_id);
CREATE INDEX idx_invima_alertas_tipo ON invima_alertas(tipo_alerta);
CREATE INDEX idx_invima_alertas_revisada ON invima_alertas(revisada);

-- ─── INVIMA VERIFICACIONES ───
-- Historial de consultas a INVIMA por prestador

CREATE TABLE IF NOT EXISTS invima_verificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  consultado_por UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  resultado_json JSONB, -- Resultado completo de la consulta INVIMA
  total_registros INTEGER,
  registros_vigentes INTEGER,
  registros_vencidos INTEGER,
  registros_suspendidos INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invima_verificaciones_provider_id ON invima_verificaciones(provider_id);
CREATE INDEX idx_invima_verificaciones_consultado_por ON invima_verificaciones(consultado_por);
CREATE INDEX idx_invima_verificaciones_created_at ON invima_verificaciones(created_at DESC);

COMMIT;

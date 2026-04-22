-- =============================================================================
-- INVIMA Schema — Pharmaceutical Registry (Standard TSMD)
-- Registro de medicamentos, dispositivos médicos e insumos por prestador
-- ============================================================================

-- ─── INVIMA REGISTROS ───
-- Registros INVIMA consultados en datos.gov.co (caché de consultas)

CREATE TABLE IF NOT EXISTS invima_registros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_registro VARCHAR(50) NOT NULL UNIQUE,
  nombre_producto VARCHAR(255) NOT NULL,
  estado VARCHAR(50), -- vigente, vencido, suspendido, cancelado, en_tramite
  categoria VARCHAR(100),
  titular_registro VARCHAR(255),
  principios_activos TEXT,
  clasificacion_riesgo VARCHAR(50),
  fecha_vencimiento DATE,
  datos_completos JSONB, -- Resultado completo de datos.gov.co
  consultado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invima_registros_numero ON invima_registros(numero_registro);
CREATE INDEX idx_invima_registros_estado ON invima_registros(estado);

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

-- ─── VISTAS ───

-- Vista que resume el estado INVIMA por prestador
CREATE OR REPLACE VIEW v_provider_invima_summary AS
SELECT
  p.id AS provider_id,
  p.legal_name AS provider_name,
  COUNT(DISTINCT pii.id) AS total_items,
  COUNT(DISTINCT CASE WHEN pii.semaforo = 'verde' THEN pii.id END) AS items_verde,
  COUNT(DISTINCT CASE WHEN pii.semaforo = 'naranja' THEN pii.id END) AS items_naranja,
  COUNT(DISTINCT CASE WHEN pii.semaforo = 'amarillo' THEN pii.id END) AS items_amarillo,
  COUNT(DISTINCT CASE WHEN pii.semaforo = 'rojo' THEN pii.id END) AS items_rojo,
  COUNT(DISTINCT CASE WHEN pii.semaforo = 'gris' THEN pii.id END) AS items_gris,
  COUNT(DISTINCT CASE WHEN ir.estado = 'vigente' THEN ir.id END) AS registros_vigentes,
  COUNT(DISTINCT CASE WHEN ir.estado = 'vencido' THEN ir.id END) AS registros_vencidos,
  COUNT(DISTINCT CASE WHEN ir.estado = 'suspendido' THEN ir.id END) AS registros_suspendidos,
  COUNT(DISTINCT CASE WHEN ia.revisada = FALSE THEN ia.id END) AS alertas_sin_revisar,
  MAX(pii.updated_at) AS ultima_actualizacion
FROM providers p
LEFT JOIN provider_invima_items pii ON pii.provider_id = p.id AND pii.activo = TRUE
LEFT JOIN invima_registros ir ON ir.numero_registro = pii.invima_registro_id
LEFT JOIN invima_alertas ia ON ia.provider_id = p.id
GROUP BY p.id, p.legal_name;

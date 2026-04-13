-- ============================================================
-- INVIMA Registry Module — Resolución 3100 / Estándar TSMD
-- Automatización de extracción y verificación de registros sanitarios
-- ============================================================

-- 1. Tabla principal de registros INVIMA consultados/cacheados
CREATE TABLE IF NOT EXISTS invima_registros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificación del registro
    numero_registro VARCHAR(100) NOT NULL UNIQUE,
    tipo_registro VARCHAR(50), -- RSA, SSA, NSA, NSOC, etc.
    estado VARCHAR(50) DEFAULT 'vigente'
        CHECK (estado IN ('vigente', 'vencido', 'suspendido', 'cancelado', 'en_tramite', 'desconocido')),

    -- Datos del producto
    nombre_producto VARCHAR(500),
    categoria VARCHAR(100), -- medicamento, alimento, cosmético, dispositivo_medico, reactivo
    principios_activos TEXT, -- JSON array o texto libre
    presentaciones_autorizadas TEXT,
    clasificacion_riesgo VARCHAR(10), -- I, IIA, IIB, III (para dispositivos médicos)

    -- Titulares
    titular_registro VARCHAR(300),
    titular_fabricante VARCHAR(300),
    titular_importador VARCHAR(300),
    pais_origen VARCHAR(100),

    -- Fechas
    fecha_emision DATE,
    fecha_vencimiento DATE,

    -- Metadatos de consulta
    fuente_datos VARCHAR(100) DEFAULT 'manual'
        CHECK (fuente_datos IN ('manual', 'portal_invima', 'datos_gov', 'api_oficial', 'scraping')),
    ultima_consulta TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    datos_crudos JSONB, -- Respuesta cruda de la fuente para auditoría

    -- Control
    verificado_por UUID REFERENCES users(id),
    verificado_en TIMESTAMP WITH TIME ZONE,
    observaciones TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invima_numero ON invima_registros(numero_registro);
CREATE INDEX IF NOT EXISTS idx_invima_estado ON invima_registros(estado);
CREATE INDEX IF NOT EXISTS idx_invima_vencimiento ON invima_registros(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_invima_categoria ON invima_registros(categoria);

-- 2. Tabla de medicamentos/dispositivos por proveedor vinculados a registro INVIMA
CREATE TABLE IF NOT EXISTS provider_invima_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    invima_registro_id UUID NOT NULL REFERENCES invima_registros(id) ON DELETE CASCADE,

    -- Datos específicos del proveedor
    nombre_comercial VARCHAR(300), -- Nombre usado internamente
    lote_actual VARCHAR(100),
    cantidad_disponible INT,
    ubicacion_almacenamiento VARCHAR(200),
    condiciones_almacenamiento VARCHAR(200), -- Ej: "2-8°C", "Temp. ambiente"

    -- Control de vencimiento (semáforo)
    fecha_vencimiento_lote DATE,
    semaforo VARCHAR(10) GENERATED ALWAYS AS (
        CASE
            WHEN fecha_vencimiento_lote IS NULL THEN 'gris'
            WHEN fecha_vencimiento_lote <= CURRENT_DATE THEN 'rojo'
            WHEN fecha_vencimiento_lote <= CURRENT_DATE + INTERVAL '90 days' THEN 'amarillo'
            WHEN fecha_vencimiento_lote <= CURRENT_DATE + INTERVAL '180 days' THEN 'naranja'
            ELSE 'verde'
        END
    ) STORED,

    -- Estado del ítem
    activo BOOLEAN DEFAULT TRUE,
    motivo_inactivacion VARCHAR(200),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(provider_id, invima_registro_id, lote_actual)
);

CREATE INDEX IF NOT EXISTS idx_provider_invima_provider ON provider_invima_items(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_invima_semaforo ON provider_invima_items(semaforo);

-- 3. Historial de alertas INVIMA consultadas (farmacovigilancia/tecnovigilancia)
CREATE TABLE IF NOT EXISTS invima_alertas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    numero_registro VARCHAR(100), -- NULL = alerta general
    invima_registro_id UUID REFERENCES invima_registros(id) ON DELETE SET NULL,

    tipo_alerta VARCHAR(50) NOT NULL
        CHECK (tipo_alerta IN ('farmacovigilancia', 'tecnovigilancia', 'retiro_mercado', 'falsificado', 'calidad', 'seguridad', 'otro')),

    titulo VARCHAR(500) NOT NULL,
    descripcion TEXT,
    severidad VARCHAR(20) DEFAULT 'media'
        CHECK (severidad IN ('critica', 'alta', 'media', 'baja', 'informativa')),

    fecha_alerta DATE NOT NULL,
    fuente VARCHAR(200), -- URL o referencia de la alerta

    -- Gestión por el proveedor
    revisada_por UUID REFERENCES users(id),
    fecha_revision TIMESTAMP WITH TIME ZONE,
    accion_tomada TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invima_alertas_registro ON invima_alertas(numero_registro);
CREATE INDEX IF NOT EXISTS idx_invima_alertas_tipo ON invima_alertas(tipo_alerta);

-- 4. Log de consultas al portal INVIMA (auditoría)
CREATE TABLE IF NOT EXISTS invima_consultas_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_registro VARCHAR(100) NOT NULL,
    usuario_id UUID REFERENCES users(id),

    fuente VARCHAR(100) NOT NULL,
    resultado VARCHAR(50) NOT NULL -- 'encontrado', 'no_encontrado', 'error', 'timeout'
        CHECK (resultado IN ('encontrado', 'no_encontrado', 'error', 'timeout')),

    datos_extraidos JSONB, -- Datos recuperados
    error_detalle TEXT,
    tiempo_respuesta_ms INT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Vista resumen de estado INVIMA por proveedor
CREATE OR REPLACE VIEW v_provider_invima_summary AS
SELECT
    pi.provider_id,
    COUNT(*) AS total_items,
    COUNT(*) FILTER (WHERE pi.semaforo = 'verde') AS items_verde,
    COUNT(*) FILTER (WHERE pi.semaforo = 'naranja') AS items_naranja,
    COUNT(*) FILTER (WHERE pi.semaforo = 'amarillo') AS items_amarillo,
    COUNT(*) FILTER (WHERE pi.semaforo = 'rojo') AS items_rojo,
    COUNT(*) FILTER (WHERE ir.estado = 'vigente') AS registros_vigentes,
    COUNT(*) FILTER (WHERE ir.estado != 'vigente') AS registros_no_vigentes,
    MIN(pi.fecha_vencimiento_lote) AS proximo_vencimiento,
    ROUND(
        (COUNT(*) FILTER (WHERE ir.estado = 'vigente' AND pi.semaforo IN ('verde', 'naranja'))::NUMERIC
         / NULLIF(COUNT(*), 0)) * 100, 1
    ) AS porcentaje_cumplimiento_tsmd
FROM provider_invima_items pi
JOIN invima_registros ir ON ir.id = pi.invima_registro_id
WHERE pi.activo = TRUE
GROUP BY pi.provider_id;

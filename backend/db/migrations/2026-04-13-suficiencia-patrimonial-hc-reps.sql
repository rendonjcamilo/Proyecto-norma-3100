-- =============================================================================
-- MIGRACIÓN: Suficiencia Patrimonial, Historia Clínica y Verificación REPS
-- Fecha: 2026-04-13
-- Resolución 3100 de 2019 — Condiciones de habilitación
-- =============================================================================

-- =============================================================================
-- 1. SUFICIENCIA PATRIMONIAL Y FINANCIERA (Condición 2 — Capítulo 9)
-- Seguimiento del estado de los documentos financieros por prestador
-- =============================================================================

CREATE TABLE IF NOT EXISTS suficiencia_patrimonial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,

    -- Período de evaluación
    periodo_fiscal VARCHAR(10) NOT NULL,           -- e.g. '2025', '2024'
    fecha_verificacion DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Indicadores financieros clave
    patrimonio_neto NUMERIC(18,2),                 -- Del balance general
    activo_total NUMERIC(18,2),
    pasivo_total NUMERIC(18,2),
    ingresos_operacionales NUMERIC(18,2),
    utilidad_neta NUMERIC(18,2),

    -- Razones financieras calculadas
    razon_corriente NUMERIC(8,4),                  -- Activo corriente / Pasivo corriente
    nivel_endeudamiento NUMERIC(8,4),              -- Pasivo total / Activo total
    razon_solvencia NUMERIC(8,4),                  -- Patrimonio / Activo total

    -- Estado de cada documento requerido
    estados_financieros_estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estados_financieros_estado IN ('vigente', 'vencido', 'pendiente', 'no_aplica')),
    estados_financieros_fecha DATE,
    estados_financieros_revisor_firma BOOLEAN DEFAULT FALSE,

    poliza_rc_estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (poliza_rc_estado IN ('vigente', 'vencido', 'pendiente', 'no_aplica')),
    poliza_rc_numero VARCHAR(100),
    poliza_rc_aseguradora VARCHAR(200),
    poliza_rc_vigencia_desde DATE,
    poliza_rc_vigencia_hasta DATE,
    poliza_rc_valor_asegurado NUMERIC(18,2),

    declaracion_renta_estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (declaracion_renta_estado IN ('vigente', 'vencido', 'pendiente', 'no_aplica')),
    declaracion_renta_periodo VARCHAR(10),

    certificacion_bancaria_estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (certificacion_bancaria_estado IN ('vigente', 'vencido', 'pendiente', 'no_aplica')),
    certificacion_bancaria_banco VARCHAR(200),
    certificacion_bancaria_fecha DATE,

    -- Resultado global de la condición
    cumple_suficiencia BOOLEAN DEFAULT FALSE,
    observaciones TEXT,

    -- Auditoría
    verificado_por UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (provider_id, periodo_fiscal)
);

CREATE INDEX IF NOT EXISTS idx_suficiencia_patrimonial_provider
    ON suficiencia_patrimonial(provider_id);
CREATE INDEX IF NOT EXISTS idx_suficiencia_patrimonial_periodo
    ON suficiencia_patrimonial(periodo_fiscal);
CREATE INDEX IF NOT EXISTS idx_suficiencia_patrimonial_cumple
    ON suficiencia_patrimonial(cumple_suficiencia);


-- =============================================================================
-- 2. HISTORIA CLÍNICA — VERIFICACIÓN (Resolución 1995 de 1999)
-- Registro de verificaciones de historias clínicas con los 15 campos mínimos
-- =============================================================================

CREATE TABLE IF NOT EXISTS historia_clinica_verificacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,

    -- Fecha y responsable de la verificación
    fecha_verificacion DATE NOT NULL DEFAULT CURRENT_DATE,
    verificado_por UUID NOT NULL REFERENCES users(id),

    -- Número de historias clínicas revisadas en la muestra
    total_hc_revisadas INTEGER NOT NULL DEFAULT 0,
    total_hc_conformes INTEGER NOT NULL DEFAULT 0,
    porcentaje_conformidad NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE WHEN total_hc_revisadas > 0
             THEN ROUND((total_hc_conformes::NUMERIC / total_hc_revisadas) * 100, 2)
             ELSE 0
        END
    ) STORED,

    -- 15 CAMPOS MÍNIMOS (Resolución 1995 de 1999 — Artículo 15)
    -- true = presente y correcto en el porcentaje requerido de HC revisadas
    campo_01_nombre_completo BOOLEAN DEFAULT FALSE,            -- Nombre completo del paciente
    campo_02_estado_civil BOOLEAN DEFAULT FALSE,               -- Estado civil
    campo_03_documento_identidad BOOLEAN DEFAULT FALSE,        -- Tipo y número de documento
    campo_04_fecha_nacimiento BOOLEAN DEFAULT FALSE,           -- Fecha de nacimiento
    campo_05_edad BOOLEAN DEFAULT FALSE,                       -- Edad al momento de atención
    campo_06_sexo BOOLEAN DEFAULT FALSE,                       -- Sexo biológico
    campo_07_ocupacion BOOLEAN DEFAULT FALSE,                  -- Ocupación
    campo_08_direccion_residencia BOOLEAN DEFAULT FALSE,       -- Dirección de residencia
    campo_09_telefono_residencia BOOLEAN DEFAULT FALSE,        -- Teléfono de residencia
    campo_10_municipio_residencia BOOLEAN DEFAULT FALSE,       -- Municipio/ciudad de residencia
    campo_11_acompanante_nombre_telefono BOOLEAN DEFAULT FALSE,-- Nombre y teléfono del acompañante
    campo_12_responsable_nombre_telefono_parentesco BOOLEAN DEFAULT FALSE, -- Responsable (nombre, teléfono, parentesco)
    campo_13_entidad_aseguradora BOOLEAN DEFAULT FALSE,        -- Entidad aseguradora (EPS/ARS)
    campo_14_tipo_vinculacion BOOLEAN DEFAULT FALSE,           -- Tipo de vinculación (contributivo, subsidiado, particular)
    campo_15_consentimiento_informado BOOLEAN DEFAULT FALSE,   -- Consentimiento informado firmado

    -- Campos adicionales verificados
    tiene_registros_clinicos BOOLEAN DEFAULT FALSE,            -- Anamnesis, examen físico, diagnóstico CIE-10, plan
    tiene_registros_signos_vitales BOOLEAN DEFAULT FALSE,      -- Aplica para internación
    tiene_notas_evolucion BOOLEAN DEFAULT FALSE,               -- Aplica para internación
    tiene_registros_enfermeria BOOLEAN DEFAULT FALSE,          -- Intervenciones de enfermería

    -- Cálculo de campos mínimos cumplidos
    campos_minimos_cumplidos INTEGER GENERATED ALWAYS AS (
        (campo_01_nombre_completo::INT + campo_02_estado_civil::INT +
         campo_03_documento_identidad::INT + campo_04_fecha_nacimiento::INT +
         campo_05_edad::INT + campo_06_sexo::INT + campo_07_ocupacion::INT +
         campo_08_direccion_residencia::INT + campo_09_telefono_residencia::INT +
         campo_10_municipio_residencia::INT + campo_11_acompanante_nombre_telefono::INT +
         campo_12_responsable_nombre_telefono_parentesco::INT +
         campo_13_entidad_aseguradora::INT + campo_14_tipo_vinculacion::INT +
         campo_15_consentimiento_informado::INT)
    ) STORED,

    -- Hallazgos específicos de HC
    hallazgos_identificados JSONB DEFAULT '[]',  -- Array de { campo, descripcion, hc_count }

    observaciones TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hc_verificacion_provider
    ON historia_clinica_verificacion(provider_id);
CREATE INDEX IF NOT EXISTS idx_hc_verificacion_assessment
    ON historia_clinica_verificacion(assessment_id);
CREATE INDEX IF NOT EXISTS idx_hc_verificacion_fecha
    ON historia_clinica_verificacion(fecha_verificacion);


-- =============================================================================
-- 3. REPS — VERIFICACIONES DE HABILITACIÓN
-- Registro de consultas al REPS por prestador
-- =============================================================================

CREATE TABLE IF NOT EXISTS reps_verificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,

    fecha_consulta DATE NOT NULL DEFAULT CURRENT_DATE,
    consultado_por UUID REFERENCES users(id),

    -- Datos del prestador según REPS
    reps_codigo_habilitacion VARCHAR(100),          -- Código asignado por el ente territorial
    reps_nombre_prestador VARCHAR(400),
    reps_nit VARCHAR(20),
    reps_municipio VARCHAR(100),
    reps_departamento VARCHAR(100),
    reps_tipo_prestador VARCHAR(100),              -- IPS, Profesional Independiente, etc.
    reps_nivel_atencion VARCHAR(50),               -- I, II, III, IV

    -- Estado en REPS
    estado_habilitacion VARCHAR(50) DEFAULT 'sin_verificar'
        CHECK (estado_habilitacion IN (
            'habilitado', 'deshabilitado', 'en_tramite', 'suspendido', 'sin_verificar'
        )),
    fecha_habilitacion DATE,
    ente_territorial_habilitador VARCHAR(200),

    -- Servicios habilitados según REPS (snapshot)
    servicios_habilitados JSONB DEFAULT '[]',       -- Array de { codigo, nombre, desde, hasta }

    -- Capacidad instalada según REPS
    capacidad_instalada JSONB DEFAULT '{}',         -- { camas: N, consultorios: N, ... }

    -- Comparación con lo declarado por el prestador
    diferencias_encontradas JSONB DEFAULT '[]',     -- Array de { campo, valor_reps, valor_declarado }
    tiene_diferencias BOOLEAN DEFAULT FALSE,

    -- Sanciones y novedades
    tiene_sanciones_activas BOOLEAN DEFAULT FALSE,
    sanciones JSONB DEFAULT '[]',                   -- Array de { tipo, fecha, descripcion }
    novedades_recientes JSONB DEFAULT '[]',         -- Array de { tipo, fecha, descripcion }

    observaciones TEXT,
    url_consulta VARCHAR(500),                      -- URL del resultado de consulta REPS (si aplica)

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reps_verificaciones_provider
    ON reps_verificaciones(provider_id);
CREATE INDEX IF NOT EXISTS idx_reps_verificaciones_fecha
    ON reps_verificaciones(fecha_consulta);
CREATE INDEX IF NOT EXISTS idx_reps_verificaciones_estado
    ON reps_verificaciones(estado_habilitacion);


-- =============================================================================
-- 4. CAPACIDAD INSTALADA — COMPARACIÓN REPS vs. DECLARADO
-- =============================================================================

CREATE TABLE IF NOT EXISTS capacidad_instalada_servicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,

    -- Tipo de unidad de capacidad según el servicio
    tipo_unidad VARCHAR(100) NOT NULL,  -- 'camas', 'consultorios', 'sillas', 'quirofanos', etc.

    -- Capacidad declarada por el prestador al sistema
    cantidad_declarada INTEGER NOT NULL DEFAULT 0,

    -- Capacidad registrada en REPS
    cantidad_reps INTEGER,

    -- Capacidad verificada en visita
    cantidad_verificada_visita INTEGER,
    fecha_verificacion_visita DATE,

    -- Estado de la verificación
    estado VARCHAR(50) DEFAULT 'pendiente'
        CHECK (estado IN ('conforme', 'discrepancia', 'pendiente', 'no_aplica')),

    observaciones TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (provider_id, service_id, tipo_unidad)
);

CREATE INDEX IF NOT EXISTS idx_capacidad_instalada_provider
    ON capacidad_instalada_servicios(provider_id);
CREATE INDEX IF NOT EXISTS idx_capacidad_instalada_service
    ON capacidad_instalada_servicios(service_id);
CREATE INDEX IF NOT EXISTS idx_capacidad_instalada_estado
    ON capacidad_instalada_servicios(estado);


-- =============================================================================
-- 5. INFORME DE AUDITORÍA — ENCABEZADOS Y HALLAZGOS POR ESTÁNDAR
-- Estructura basada en el Informe de Auditoría oficial de Res. 3100
-- =============================================================================

CREATE TABLE IF NOT EXISTS informes_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,

    -- Datos del informe
    numero_informe VARCHAR(50),                    -- Número correlativo institucional
    tipo_visita VARCHAR(50) NOT NULL
        CHECK (tipo_visita IN (
            'inicial', 'seguimiento', 'anual', 'previa_novedad', 'especial'
        )),
    fecha_visita_inicio DATE NOT NULL,
    fecha_visita_fin DATE NOT NULL,

    -- Equipo auditor
    auditor_lider VARCHAR(200) NOT NULL,
    auditores_apoyo JSONB DEFAULT '[]',            -- Array de nombres
    entidad_auditora VARCHAR(200),

    -- Representante del prestador
    representante_prestador VARCHAR(200),
    cargo_representante VARCHAR(200),

    -- Servicios auditados
    servicios_auditados JSONB DEFAULT '[]',        -- Array de { codigo, nombre }

    -- Resultados globales (3 condiciones)
    resultado_capacidad_tecnico_administrativa VARCHAR(20)
        CHECK (resultado_capacidad_tecnico_administrativa IN ('cumple', 'no_cumple', 'pendiente')),
    resultado_suficiencia_patrimonial VARCHAR(20)
        CHECK (resultado_suficiencia_patrimonial IN ('cumple', 'no_cumple', 'pendiente')),
    resultado_capacidad_tecnologica VARCHAR(20)
        CHECK (resultado_capacidad_tecnologica IN ('cumple', 'no_cumple', 'pendiente')),

    -- Porcentaje de cumplimiento global
    porcentaje_cumplimiento_global NUMERIC(5,2) DEFAULT 0,
    semaforo VARCHAR(10) DEFAULT 'rojo'
        CHECK (semaforo IN ('verde', 'naranja', 'rojo')),

    -- Resultado final
    concepto_habilitacion VARCHAR(50)
        CHECK (concepto_habilitacion IN (
            'habilitado', 'no_habilitado', 'habilitado_condicionado', 'pendiente'
        )) DEFAULT 'pendiente',

    -- Conclusiones y compromisos
    fortalezas TEXT,
    oportunidades_mejora TEXT,
    compromisos_prestador TEXT,
    plazo_subsanacion INTEGER,                     -- Días para subsanar hallazgos

    estado VARCHAR(20) DEFAULT 'borrador'
        CHECK (estado IN ('borrador', 'en_revision', 'aprobado', 'notificado')),
    fecha_aprobacion DATE,
    aprobado_por UUID REFERENCES users(id),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_informes_auditoria_provider
    ON informes_auditoria(provider_id);
CREATE INDEX IF NOT EXISTS idx_informes_auditoria_fecha
    ON informes_auditoria(fecha_visita_inicio);
CREATE INDEX IF NOT EXISTS idx_informes_auditoria_concepto
    ON informes_auditoria(concepto_habilitacion);


-- Hallazgos del informe organizados por estándar (TSTH, TSINF, etc.)
CREATE TABLE IF NOT EXISTS informe_hallazgos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    informe_id UUID NOT NULL REFERENCES informes_auditoria(id) ON DELETE CASCADE,

    -- Estándar al que pertenece el hallazgo
    estandar_codigo VARCHAR(20) NOT NULL,          -- TSTH, TSINF, TSDOT, TSMD, TSPP, TSHCR, TSINT
    estandar_nombre VARCHAR(200) NOT NULL,

    -- Criterio específico
    criterio_codigo VARCHAR(50),                   -- e.g. TSTH-003
    criterio_descripcion TEXT,

    -- Hallazgo
    descripcion_hallazgo TEXT NOT NULL,
    tipo VARCHAR(20) NOT NULL
        CHECK (tipo IN ('no_conformidad', 'observacion', 'oportunidad_mejora')),
    severidad VARCHAR(20) DEFAULT 'media'
        CHECK (severidad IN ('baja', 'media', 'alta', 'critica')),

    -- Evidencia observada
    evidencia_observada TEXT,

    -- Acción correctiva requerida
    accion_correctiva_requerida TEXT,
    plazo_dias INTEGER,

    -- Vinculación con finding del sistema
    finding_id UUID REFERENCES findings(id) ON DELETE SET NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_informe_hallazgos_informe
    ON informe_hallazgos(informe_id);
CREATE INDEX IF NOT EXISTS idx_informe_hallazgos_estandar
    ON informe_hallazgos(estandar_codigo);
CREATE INDEX IF NOT EXISTS idx_informe_hallazgos_tipo
    ON informe_hallazgos(tipo);

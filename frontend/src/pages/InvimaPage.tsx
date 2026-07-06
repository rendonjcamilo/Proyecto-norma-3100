/**
 * INVIMA Registry Page — Consulta de registros sanitarios + Inventario TSMD
 * Tab 1: Consulta — busca por número o texto libre; auto-rellena al agregar al inventario
 * Tab 2: Inventario — lista de medicamentos/dispositivos del prestador con semáforo
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  invimaApi,
  type InvimaRegistro,
  type InvimaLookupResult,
  type ProviderInvimaItem,
  type InvimaSummary,
} from '../services/api';
import './InvimaPage.css';

interface InvimaPageProps {
  providerId: string;
}

// ─── Semáforo ────────────────────────────────────────────────────────────────

type Semaforo = 'verde' | 'naranja' | 'rojo' | 'sin_fecha';

const SEMAFORO_CONFIG: Record<Semaforo, { color: string; label: string; emoji: string }> = {
  verde:    { color: '#059669', label: 'Vigente',          emoji: '🟢' },
  naranja:  { color: '#f59e0b', label: 'Próximo a vencer', emoji: '🟡' },
  rojo:     { color: '#dc2626', label: 'Vencido / Urgente',emoji: '🔴' },
  sin_fecha:{ color: '#94a3b8', label: 'Sin fecha',        emoji: '⚪' },
};

function calcSemaforo(fecha: string | null | undefined): Semaforo {
  if (!fecha) return 'sin_fecha';
  const dias = Math.ceil((new Date(fecha).getTime() - Date.now()) / 86400000);
  if (dias < 0)   return 'rojo';
  if (dias <= 30) return 'rojo';
  if (dias <= 90) return 'naranja';
  return 'verde';
}

function SemaforoChip({ semaforo }: { semaforo: Semaforo }) {
  const cfg = SEMAFORO_CONFIG[semaforo];
  return (
    <span
      className="inv-semaforo-chip"
      style={{ background: cfg.color + '20', color: cfg.color, border: `1px solid ${cfg.color}55` }}
    >
      {cfg.emoji} {cfg.label}
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ESTADO_COLORS: Record<string, string> = {
  vigente: '#059669', vencido: '#dc2626', suspendido: '#d97706',
  cancelado: '#dc2626', en_tramite: '#8B5CF6', desconocido: '#64748b',
};

function normalizeEstado(estado: string | null | undefined): string {
  if (!estado) return 'desconocido';
  return estado.toLowerCase().replace(/\s+/g, '_');
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="inv-field">
      <span className="inv-field-label">{label}</span>
      <span className="inv-field-value">{value}</span>
    </div>
  );
}

// ─── Modal: Agregar al inventario ────────────────────────────────────────────

interface AddItemModalProps {
  reg: InvimaRegistro;
  providerId: string;
  onClose: () => void;
  onSaved: () => void;
}

function AddItemModal({ reg, providerId, onClose, onSaved }: AddItemModalProps) {
  const [lote, setLote] = useState('');
  const [fechaVenc, setFechaVenc] = useState('');
  const [nombreComercial, setNombreComercial] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const semaforo = calcSemaforo(fechaVenc || null);
  const estadoKey = normalizeEstado(reg.estado);
  const estadoColor = ESTADO_COLORS[estadoKey] ?? '#64748b';

  const handleSave = async () => {
    if (!lote.trim()) { setError('El lote es requerido'); return; }
    if (!fechaVenc)   { setError('La fecha de vencimiento del lote es requerida'); return; }
    setError(null);
    setSaving(true);
    try {
      await invimaApi.addProviderItem(providerId, {
        registroId: reg.id,
        nombreComercial: nombreComercial.trim() || undefined,
        loteActual: lote.trim(),
        cantidadDisponible: cantidad ? parseInt(cantidad, 10) : undefined,
        ubicacionAlmacenamiento: ubicacion.trim() || undefined,
        fechaVencimientoLote: fechaVenc,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="inv-modal-overlay" onClick={onClose}>
      <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
        <div className="inv-modal-header">
          <div>
            <div className="inv-modal-title">Agregar al inventario</div>
            <div className="inv-modal-subtitle">Los datos del registro se cargan automáticamente de INVIMA</div>
          </div>
          <button className="inv-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Datos INVIMA — solo lectura */}
        <div className="inv-modal-section-label">Datos del registro INVIMA (auto-cargados)</div>
        <div className="inv-modal-readonly-grid">
          <div className="inv-readonly-field">
            <span className="inv-field-label">N° Registro</span>
            <span className="inv-field-value inv-registro-num">{reg.numero_registro}</span>
          </div>
          <div className="inv-readonly-field">
            <span className="inv-field-label">Estado registro</span>
            <span className="inv-estado-badge" style={{ background: estadoColor + '22', color: estadoColor, border: `1px solid ${estadoColor}55` }}>
              {reg.estado ?? 'Desconocido'}
            </span>
          </div>
          {reg.nombre_producto && (
            <div className="inv-readonly-field inv-readonly-full">
              <span className="inv-field-label">Nombre del producto</span>
              <span className="inv-field-value">{reg.nombre_producto}</span>
            </div>
          )}
          {reg.titular_registro && (
            <div className="inv-readonly-field">
              <span className="inv-field-label">Titular del registro</span>
              <span className="inv-field-value">{reg.titular_registro}</span>
            </div>
          )}
          {reg.titular_fabricante && (
            <div className="inv-readonly-field">
              <span className="inv-field-label">Fabricante</span>
              <span className="inv-field-value">{reg.titular_fabricante}</span>
            </div>
          )}
          {reg.categoria && (
            <div className="inv-readonly-field">
              <span className="inv-field-label">Categoría</span>
              <span className="inv-field-value">{reg.categoria}</span>
            </div>
          )}
          {reg.clasificacion_riesgo && (
            <div className="inv-readonly-field">
              <span className="inv-field-label">Clasificación riesgo</span>
              <span className="inv-field-value">{reg.clasificacion_riesgo}</span>
            </div>
          )}
          {reg.principios_activos && (
            <div className="inv-readonly-field inv-readonly-full">
              <span className="inv-field-label">Principios activos</span>
              <span className="inv-field-value">{reg.principios_activos}</span>
            </div>
          )}
        </div>

        {/* Campos manuales */}
        <div className="inv-modal-section-label inv-modal-section-label--manual">
          Datos del insumo físico <span className="inv-required-note">(ingreso manual requerido)</span>
        </div>

        <div className="inv-modal-form">
          <div className="inv-form-group inv-form-group--required">
            <label className="inv-form-label">Lote *</label>
            <input
              className="inv-form-input"
              type="text"
              placeholder="Ej: LOT-2024-001"
              value={lote}
              onChange={(e) => setLote(e.target.value)}
            />
          </div>

          <div className="inv-form-group inv-form-group--required">
            <label className="inv-form-label">Fecha de vencimiento del lote *</label>
            <input
              className="inv-form-input"
              type="date"
              value={fechaVenc}
              onChange={(e) => setFechaVenc(e.target.value)}
            />
            {fechaVenc && (
              <div className="inv-semaforo-preview">
                <SemaforoChip semaforo={semaforo} />
                <span className="inv-semaforo-preview-text">
                  {semaforo === 'rojo' && new Date(fechaVenc) < new Date()
                    ? 'Este lote ya está vencido'
                    : semaforo === 'rojo'
                    ? 'Vence en menos de 30 días'
                    : semaforo === 'naranja'
                    ? 'Vence en menos de 90 días'
                    : 'Vigente por más de 90 días'}
                </span>
              </div>
            )}
          </div>

          <div className="inv-form-group">
            <label className="inv-form-label">Nombre comercial (opcional)</label>
            <input
              className="inv-form-input"
              type="text"
              placeholder="Nombre con que se conoce en la institución"
              value={nombreComercial}
              onChange={(e) => setNombreComercial(e.target.value)}
            />
          </div>

          <div className="inv-form-group">
            <label className="inv-form-label">Cantidad disponible (opcional)</label>
            <input
              className="inv-form-input"
              type="number"
              min="0"
              placeholder="Unidades en stock"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
          </div>

          <div className="inv-form-group inv-form-group--full">
            <label className="inv-form-label">Ubicación de almacenamiento (opcional)</label>
            <input
              className="inv-form-input"
              type="text"
              placeholder="Ej: Bodega 2 - Estante A"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
            />
          </div>
        </div>

        {error && <div className="inv-modal-error">⚠️ {error}</div>}

        <div className="inv-modal-actions">
          <button className="inv-btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="inv-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Agregar al inventario'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── RegistroCard ─────────────────────────────────────────────────────────────

function RegistroCard({
  reg,
  onBack,
  onAgregar,
}: {
  reg: InvimaRegistro;
  onBack: () => void;
  onAgregar: (reg: InvimaRegistro) => void;
}) {
  const estadoKey = normalizeEstado(reg.estado);
  const estadoColor = ESTADO_COLORS[estadoKey] ?? '#64748b';
  const rawData = reg.datos_crudos as Record<string, unknown> | null | undefined;

  return (
    <div className="inv-card">
      <div className="inv-card-toolbar">
        <button className="inv-back-btn" onClick={onBack}>← Volver</button>
        <button className="inv-agregar-btn" onClick={() => onAgregar(reg)}>
          + Agregar al inventario
        </button>
      </div>

      <div className="inv-card-header">
        <div className="inv-card-numero">{reg.numero_registro}</div>
        <span className="inv-estado-badge" style={{ background: estadoColor + '22', color: estadoColor, border: `1px solid ${estadoColor}55` }}>
          {reg.estado ?? 'Desconocido'}
        </span>
      </div>

      <h2 className="inv-card-nombre">{reg.nombre_producto ?? 'Sin nombre'}</h2>
      {reg.descripcion && <p className="inv-card-descripcion">{reg.descripcion}</p>}

      <div className="inv-fields-grid">
        <Field label="Marca"                   value={reg.marca} />
        <Field label="Serie / Modelo"          value={reg.serie} />
        <Field label="Categoría"               value={reg.categoria} />
        <Field label="Tipo de registro"        value={reg.tipo_registro} />
        <Field label="Clasificación de riesgo" value={reg.clasificacion_riesgo} />
        <Field label="País de origen"          value={reg.pais_origen} />
        <Field label="Fecha de emisión"        value={reg.fecha_emision} />
        <Field label="Fecha de vencimiento"    value={reg.fecha_vencimiento} />
        <Field label="Titular del registro"    value={reg.titular_registro} />
        <Field label="Fabricante"              value={reg.titular_fabricante} />
        <Field label="Importador"              value={reg.titular_importador} />
        <Field label="Principios activos"      value={reg.principios_activos} />
        <Field label="Presentaciones autorizadas" value={reg.presentaciones_autorizadas} />
        <Field label="Fuente de datos"         value={reg.fuente_datos} />
        <Field label="Última consulta"         value={reg.ultima_consulta ? new Date(reg.ultima_consulta).toLocaleString('es-CO') : null} />
      </div>

      {rawData && Object.keys(rawData).length > 0 && (
        <div className="inv-raw-section">
          <div className="inv-raw-title">Datos adicionales</div>
          <div className="inv-fields-grid">
            {Object.entries(rawData).map(([k, v]) =>
              v != null && String(v).trim() !== '' ? (
                <Field key={k} label={k.replace(/_/g, ' ')} value={String(v)} />
              ) : null
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Inventario ─────────────────────────────────────────────────────────

function InventarioTab({
  providerId,
  refreshKey,
}: {
  providerId: string;
  refreshKey: number;
}) {
  const [items, setItems] = useState<ProviderInvimaItem[]>([]);
  const [summary, setSummary] = useState<InvimaSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtroSemaforo, setFiltroSemaforo] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, sumRes] = await Promise.all([
        invimaApi.listProviderItems(providerId, filtroSemaforo ? { semaforo: filtroSemaforo } : {}),
        invimaApi.getResumen(providerId),
      ]);
      setItems(itemsRes.data ?? []);
      setSummary(sumRes.data ?? null);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [providerId, filtroSemaforo, refreshKey]);

  useEffect(() => { void load(); }, [load]);

  const handleDelete = async (itemId: string) => {
    if (!confirm('¿Desactivar este ítem del inventario?')) return;
    setDeletingId(itemId);
    try {
      await invimaApi.deleteProviderItem(providerId, itemId);
      await load();
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="inv-state-msg">
        <div className="page-spinner" />
        <p>Cargando inventario...</p>
      </div>
    );
  }

  return (
    <div className="inv-inventario">
      {/* Resumen */}
      {summary && (
        <div className="inv-summary-bar">
          <div className="inv-summary-stat inv-summary-total">
            <span className="inv-summary-num">{summary.totalItems}</span>
            <span className="inv-summary-lbl">Total ítems</span>
          </div>
          <div className="inv-summary-stat inv-summary-verde">
            <span className="inv-summary-num">{summary.itemsVerde}</span>
            <span className="inv-summary-lbl">🟢 Vigentes</span>
          </div>
          <div className="inv-summary-stat inv-summary-naranja">
            <span className="inv-summary-num">{(summary.itemsNaranja ?? 0) + (summary.itemsAmarillo ?? 0)}</span>
            <span className="inv-summary-lbl">🟡 Por vencer</span>
          </div>
          <div className="inv-summary-stat inv-summary-rojo">
            <span className="inv-summary-num">{summary.itemsRojo}</span>
            <span className="inv-summary-lbl">🔴 Críticos</span>
          </div>
          <div className="inv-summary-stat">
            <span className="inv-summary-num">{summary.porcentajeCumplimientoTsmd}%</span>
            <span className="inv-summary-lbl">Cumplimiento TSMD</span>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="inv-inventario-filters">
        <span className="inv-filter-label">Filtrar por semáforo:</span>
        {(['', 'verde', 'naranja', 'rojo'] as const).map((s) => (
          <button
            key={s}
            className={`inv-filter-btn ${filtroSemaforo === s ? 'inv-filter-btn--active' : ''}`}
            onClick={() => setFiltroSemaforo(s)}
          >
            {s === '' ? 'Todos' : SEMAFORO_CONFIG[s as Semaforo].emoji + ' ' + SEMAFORO_CONFIG[s as Semaforo].label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {items.length === 0 ? (
        <div className="inv-inventario-empty">
          <div style={{ fontSize: 40 }}>📦</div>
          <p>No hay ítems en el inventario{filtroSemaforo ? ' con ese filtro' : ''}.</p>
          <p style={{ fontSize: 13, color: '#888' }}>
            Busca un registro en la pestaña <strong>Consulta INVIMA</strong> y usa el botón "Agregar al inventario".
          </p>
        </div>
      ) : (
        <div className="inv-items-list">
          {items.map((item) => {
            const sem = (item.semaforo as Semaforo) ?? calcSemaforo(item.fecha_vencimiento_lote);
            const cfg = SEMAFORO_CONFIG[sem] ?? SEMAFORO_CONFIG.sin_fecha;
            return (
              <div key={item.id} className="inv-item-card" style={{ borderLeft: `4px solid ${cfg.color}` }}>
                <div className="inv-item-header">
                  <div className="inv-item-names">
                    <span className="inv-item-registro">{item.numero_registro}</span>
                    <span className="inv-item-nombre">{item.nombre_producto ?? item.nombre_comercial ?? 'Sin nombre'}</span>
                  </div>
                  <SemaforoChip semaforo={sem} />
                </div>

                <div className="inv-item-details">
                  {item.nombre_comercial && (
                    <div className="inv-item-detail">
                      <span className="inv-item-detail-lbl">Nombre comercial</span>
                      <span className="inv-item-detail-val">{item.nombre_comercial}</span>
                    </div>
                  )}
                  <div className="inv-item-detail">
                    <span className="inv-item-detail-lbl">Lote</span>
                    <span className="inv-item-detail-val inv-item-lote">{item.lote_actual ?? '—'}</span>
                  </div>
                  <div className="inv-item-detail">
                    <span className="inv-item-detail-lbl">Vence el</span>
                    <span className="inv-item-detail-val" style={{ color: cfg.color, fontWeight: 600 }}>
                      {item.fecha_vencimiento_lote
                        ? new Date(item.fecha_vencimiento_lote + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
                        : '—'}
                    </span>
                  </div>
                  {item.cantidad_disponible != null && (
                    <div className="inv-item-detail">
                      <span className="inv-item-detail-lbl">Cantidad</span>
                      <span className="inv-item-detail-val">{item.cantidad_disponible}</span>
                    </div>
                  )}
                  {item.ubicacion_almacenamiento && (
                    <div className="inv-item-detail">
                      <span className="inv-item-detail-lbl">Ubicación</span>
                      <span className="inv-item-detail-val">{item.ubicacion_almacenamiento}</span>
                    </div>
                  )}
                  {item.categoria && (
                    <div className="inv-item-detail">
                      <span className="inv-item-detail-lbl">Categoría</span>
                      <span className="inv-item-detail-val">{item.categoria}</span>
                    </div>
                  )}
                </div>

                <div className="inv-item-actions">
                  <button
                    className="inv-item-delete"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? 'Desactivando...' : 'Desactivar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export const InvimaPage: React.FC<InvimaPageProps> = ({ providerId }) => {
  const [activeTab, setActiveTab] = useState<'consulta' | 'inventario'>('consulta');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<InvimaRegistro[]>([]);
  const [lookupResult, setLookupResult] = useState<InvimaLookupResult | null>(null);
  const [selected, setSelected] = useState<InvimaRegistro | null>(null);
  const [searched, setSearched] = useState(false);
  const [addingReg, setAddingReg] = useState<InvimaRegistro | null>(null);
  const [inventarioRefresh, setInventarioRefresh] = useState(0);
  const [savedToast, setSavedToast] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setLookupResult(null);
    setSelected(null);
    setSearched(true);
    try {
      const isRegistroNumber =
        /^INVIMA\s+\d/i.test(q) ||
        /^[A-Z0-9]{2,}-?\d/i.test(q);
      if (isRegistroNumber) {
        const res = await invimaApi.lookup(q);
        setLookupResult(res.data);
        if (res.data.found && res.data.data) {
          setSelected(res.data.data as InvimaRegistro);
        }
      } else {
        const res = await invimaApi.search(q, 30);
        setResults(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      setError('Error al consultar INVIMA. Verifique su conexión e intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => { setSelected(null); setLookupResult(null); };

  const handleItemSaved = () => {
    setAddingReg(null);
    setInventarioRefresh((n) => n + 1);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3500);
  };

  const openInvimaOficial = () => {
    window.open(
      'https://consultaregistro.invima.gov.co/registrosconsultaligera/registrosanitario/consultar',
      '_blank', 'noopener,noreferrer'
    );
  };

  return (
    <div className="invima-page">
      {/* Toast */}
      {savedToast && (
        <div className="inv-toast">
          ✅ Ítem agregado al inventario correctamente
        </div>
      )}

      {/* Header */}
      <div className="inv-header">
        <div className="inv-header-text">
          <span className="inv-badge">INVIMA · TSMD</span>
          <h1>Medicamentos, Dispositivos e Insumos</h1>
          <p>Consulta registros sanitarios INVIMA y gestiona el inventario del prestador con semáforo automático</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="inv-tabs">
        <button
          className={`inv-tab ${activeTab === 'consulta' ? 'inv-tab--active' : ''}`}
          onClick={() => setActiveTab('consulta')}
        >
          🔍 Consulta INVIMA
        </button>
        <button
          className={`inv-tab ${activeTab === 'inventario' ? 'inv-tab--active' : ''}`}
          onClick={() => setActiveTab('inventario')}
        >
          📦 Inventario
        </button>
      </div>

      {/* Tab: Consulta */}
      {activeTab === 'consulta' && (
        <>
          <div className="inv-search-wrapper">
            <form className="inv-search-form" onSubmit={handleSearch}>
              <div className="inv-search-box">
                <svg className="inv-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  className="inv-search-input"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ej: RSAB-CM-21-010, Amoxicilina, Bayer, 2022M-001..."
                  autoFocus
                />
                <button className="inv-search-btn" type="submit" disabled={loading || !query.trim()}>
                  {loading ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
            </form>
          </div>

          <div className="inv-results-area">
            {loading && (
              <div className="inv-state-msg">
                <div className="page-spinner" />
                <p>Consultando base de datos INVIMA...</p>
              </div>
            )}

            {!loading && error && (
              <div className="inv-state-msg inv-state-error">
                <span>⚠️</span><p>{error}</p>
              </div>
            )}

            {!loading && selected && (
              <RegistroCard
                reg={selected}
                onBack={handleBack}
                onAgregar={(r) => setAddingReg(r)}
              />
            )}

            {!loading && !selected && searched && !error && lookupResult && !lookupResult.found && (
              <div className="inv-not-found">
                <div className="inv-not-found-icon">🔍</div>
                <p className="inv-not-found-title">No encontrado en registros históricos</p>
                <p className="inv-not-found-desc">
                  El registro <strong>{query}</strong> no está en los datos abiertos de datos.gov.co.
                  Puede estar vigente en el portal oficial de INVIMA.
                </p>
                <div className="inv-not-found-hint">
                  Seleccione <em>"Por número de registro"</em> y escriba: <code>{query}</code>
                </div>
                <button className="inv-oficial-btn" onClick={openInvimaOficial}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  Consultar en portal oficial INVIMA
                </button>
              </div>
            )}

            {!loading && !selected && results.length > 0 && (
              <div className="inv-results-list">
                <div className="inv-results-count">{results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}</div>
                {results.map((reg) => {
                  const estadoKey = normalizeEstado(reg.estado);
                  const estadoColor = ESTADO_COLORS[estadoKey] ?? '#64748b';
                  return (
                    <button key={reg.id} className="inv-result-item" onClick={() => setSelected(reg)}>
                      <div className="inv-result-main">
                        <span className="inv-result-numero">{reg.numero_registro}</span>
                        <span className="inv-result-nombre">{reg.nombre_producto ?? 'Sin nombre'}</span>
                      </div>
                      <div className="inv-result-meta">
                        {reg.titular_registro && <span>{reg.titular_registro}</span>}
                        {reg.categoria && <span>{reg.categoria}</span>}
                        <span className="inv-result-estado" style={{ color: estadoColor }}>{reg.estado}</span>
                      </div>
                      <svg className="inv-result-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  );
                })}
              </div>
            )}

            {!searched && (
              <div className="inv-placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#c7d2fe" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <p>Ingrese un número de registro o el nombre de un producto para consultar</p>
              </div>
            )}

            {!loading && !selected && searched && !error && results.length === 0 && !(lookupResult && !lookupResult.found) && !lookupResult && (
              <div className="inv-not-found">
                <div className="inv-not-found-icon">🔍</div>
                <p className="inv-not-found-title">Sin resultados</p>
                <p className="inv-not-found-desc">No hay coincidencias para <strong>{query}</strong> en los datos abiertos.</p>
                <button className="inv-oficial-btn" onClick={openInvimaOficial}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  Consultar en portal oficial INVIMA
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Tab: Inventario */}
      {activeTab === 'inventario' && (
        <InventarioTab providerId={providerId} refreshKey={inventarioRefresh} />
      )}

      {/* Modal agregar */}
      {addingReg && (
        <AddItemModal
          reg={addingReg}
          providerId={providerId}
          onClose={() => setAddingReg(null)}
          onSaved={handleItemSaved}
        />
      )}
    </div>
  );
};

export default InvimaPage;

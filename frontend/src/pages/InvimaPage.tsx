/**
 * INVIMA Registry Page — Estándar TSMD
 * Consulta automática de registros sanitarios INVIMA
 * Gestión de inventario de medicamentos/dispositivos por proveedor
 */

import React, { useEffect, useState } from 'react';
import {
  invimaApi,
  type InvimaRegistro,
  type ProviderInvimaItem,
  type InvimaLookupResult,
  type InvimaSummary,
} from '../services/api';
import { useRolePermission } from '../hooks/useRolePermission';
import './InvimaPage.css';

interface InvimaPageProps {
  providerId: string;
}

const SEMAFORO_COLORS: Record<string, string> = {
  verde: '#00875a',
  naranja: '#ff8b00',
  amarillo: '#ffab00',
  rojo: '#de350b',
  gris: '#6b778c',
};

const SEMAFORO_LABELS: Record<string, string> = {
  verde: '> 6 meses',
  naranja: '3-6 meses',
  amarillo: '< 3 meses',
  rojo: 'Vencido',
  gris: 'Sin fecha',
};

const ESTADO_COLORS: Record<string, string> = {
  vigente: '#00875a',
  vencido: '#de350b',
  suspendido: '#ff8b00',
  cancelado: '#de350b',
  en_tramite: '#6554c0',
  desconocido: '#6b778c',
};

export const InvimaPage: React.FC<InvimaPageProps> = ({ providerId }) => {
  const [items, setItems] = useState<ProviderInvimaItem[]>([]);
  const [summary, setSummary] = useState<InvimaSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lookupNumber, setLookupNumber] = useState('');
  const [lookupResult, setLookupResult] = useState<InvimaLookupResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRegistro, setSelectedRegistro] = useState<InvimaRegistro | null>(null);
  const [addForm, setAddForm] = useState({
    nombreComercial: '',
    loteActual: '',
    cantidadDisponible: '',
    ubicacionAlmacenamiento: '',
    condicionesAlmacenamiento: '',
    fechaVencimientoLote: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [filterSemaforo, setFilterSemaforo] = useState<string>('');
  const { can } = useRolePermission();

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsRes, summaryRes] = await Promise.all([
        invimaApi.listProviderItems(providerId, filterSemaforo ? { semaforo: filterSemaforo } : undefined),
        invimaApi.getResumen(providerId),
      ]);
      setItems(itemsRes.data || []);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error('Error loading INVIMA data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [providerId, filterSemaforo]);

  // ─── LOOKUP ───
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupNumber.trim()) return;

    try {
      setLookupLoading(true);
      setLookupResult(null);
      const res = await invimaApi.lookup(lookupNumber.trim());
      setLookupResult(res.data);

      if (res.data.found && res.data.data) {
        setSelectedRegistro(res.data.data as InvimaRegistro);
      }
    } catch (err) {
      showToast('error', 'Error al consultar registro INVIMA');
    } finally {
      setLookupLoading(false);
    }
  };

  // ─── ADD ITEM ───
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegistro) return;

    try {
      setIsSubmitting(true);
      await invimaApi.addProviderItem(providerId, {
        registroId: selectedRegistro.id,
        nombreComercial: addForm.nombreComercial || null,
        loteActual: addForm.loteActual || null,
        cantidadDisponible: addForm.cantidadDisponible ? parseInt(addForm.cantidadDisponible, 10) : null,
        ubicacionAlmacenamiento: addForm.ubicacionAlmacenamiento || null,
        condicionesAlmacenamiento: addForm.condicionesAlmacenamiento || null,
        fechaVencimientoLote: addForm.fechaVencimientoLote || null,
      });
      showToast('success', 'Medicamento/dispositivo agregado al inventario');
      setShowAddModal(false);
      setSelectedRegistro(null);
      setLookupResult(null);
      setLookupNumber('');
      setAddForm({
        nombreComercial: '',
        loteActual: '',
        cantidadDisponible: '',
        ubicacionAlmacenamiento: '',
        condicionesAlmacenamiento: '',
        fechaVencimientoLote: '',
      });
      await loadData();
    } catch (err) {
      showToast('error', `Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="invima-page invima-loading">
        <div className="page-spinner" />
        <p>Cargando registros INVIMA...</p>
      </div>
    );
  }

  return (
    <div className="invima-page">
      {toast && (
        <div className={`invima-toast invima-toast-${toast.type}`}>{toast.message}</div>
      )}

      {/* HEADER */}
      <header className="invima-header">
        <div>
          <h1>Registros INVIMA</h1>
          <p>Estándar TSMD — Medicamentos, Dispositivos Médicos e Insumos</p>
        </div>
        {can('assessments', 'create') && (
          <button className="invima-btn-primary" onClick={() => setShowAddModal(true)}>
            + Agregar Medicamento/Dispositivo
          </button>
        )}
      </header>

      {/* RESUMEN CARDS */}
      {summary && (
        <div className="invima-summary-grid">
          <div className="invima-summary-card">
            <div className="summary-number">{summary.totalItems}</div>
            <div className="summary-label">Total Items</div>
          </div>
          <div className="invima-summary-card" style={{ borderLeftColor: SEMAFORO_COLORS.verde }}>
            <div className="summary-number" style={{ color: SEMAFORO_COLORS.verde }}>{summary.itemsVerde}</div>
            <div className="summary-label">Vigentes OK</div>
          </div>
          <div className="invima-summary-card" style={{ borderLeftColor: SEMAFORO_COLORS.amarillo }}>
            <div className="summary-number" style={{ color: SEMAFORO_COLORS.amarillo }}>{summary.itemsAmarillo + summary.itemsNaranja}</div>
            <div className="summary-label">Por Vencer</div>
          </div>
          <div className="invima-summary-card" style={{ borderLeftColor: SEMAFORO_COLORS.rojo }}>
            <div className="summary-number" style={{ color: SEMAFORO_COLORS.rojo }}>{summary.itemsRojo}</div>
            <div className="summary-label">Vencidos</div>
          </div>
          <div className="invima-summary-card invima-compliance-card">
            <div className="summary-number">{summary.porcentajeCumplimientoTsmd}%</div>
            <div className="summary-label">Cumplimiento TSMD</div>
          </div>
        </div>
      )}

      {/* FILTROS */}
      <div className="invima-filters">
        <span className="filter-label">Filtrar por semáforo:</span>
        {['', 'verde', 'amarillo', 'naranja', 'rojo'].map((s) => (
          <button
            key={s}
            className={`filter-btn ${filterSemaforo === s ? 'active' : ''}`}
            style={s ? { borderColor: SEMAFORO_COLORS[s], color: filterSemaforo === s ? '#fff' : SEMAFORO_COLORS[s], background: filterSemaforo === s ? SEMAFORO_COLORS[s] : 'transparent' } : undefined}
            onClick={() => setFilterSemaforo(s)}
          >
            {s ? SEMAFORO_LABELS[s] : 'Todos'}
          </button>
        ))}
      </div>

      {/* TABLA DE ITEMS */}
      {items.length === 0 ? (
        <div className="invima-empty">
          <h3>Sin registros INVIMA</h3>
          <p>Agrega medicamentos o dispositivos médicos con su registro INVIMA para el control de cumplimiento TSMD</p>
        </div>
      ) : (
        <div className="invima-table-wrapper">
          <table className="invima-table">
            <thead>
              <tr>
                <th>Semáforo</th>
                <th>Registro INVIMA</th>
                <th>Producto</th>
                <th>Nombre Comercial</th>
                <th>Lote</th>
                <th>Cantidad</th>
                <th>Vence Lote</th>
                <th>Estado Registro</th>
                <th>Almacenamiento</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className={item.semaforo === 'rojo' ? 'row-alert' : ''}>
                  <td>
                    <span
                      className="semaforo-dot"
                      style={{ background: SEMAFORO_COLORS[item.semaforo] || '#ccc' }}
                      title={SEMAFORO_LABELS[item.semaforo]}
                    />
                  </td>
                  <td className="mono">{item.numero_registro}</td>
                  <td>{item.nombre_producto || '—'}</td>
                  <td>{item.nombre_comercial || '—'}</td>
                  <td className="mono">{item.lote_actual || '—'}</td>
                  <td>{item.cantidad_disponible ?? '—'}</td>
                  <td>{item.fecha_vencimiento_lote ? new Date(item.fecha_vencimiento_lote).toLocaleDateString('es-CO') : '—'}</td>
                  <td>
                    <span
                      className="estado-badge"
                      style={{
                        background: `${ESTADO_COLORS[item.estado_registro || 'desconocido']}15`,
                        color: ESTADO_COLORS[item.estado_registro || 'desconocido'],
                      }}
                    >
                      {item.estado_registro || 'N/D'}
                    </span>
                  </td>
                  <td>{item.condiciones_almacenamiento || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: AGREGAR ITEM */}
      {showAddModal && (
        <div className="invima-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="invima-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Agregar Medicamento / Dispositivo</h2>

            {/* STEP 1: Lookup */}
            <div className="lookup-section">
              <h3>1. Consultar Registro INVIMA</h3>
              <form onSubmit={handleLookup} className="lookup-form">
                <input
                  type="text"
                  placeholder="Ingresa número de registro INVIMA (Ej: INVIMA 2020M-0012345)"
                  value={lookupNumber}
                  onChange={(e) => setLookupNumber(e.target.value)}
                  className="lookup-input"
                  required
                />
                <button type="submit" className="invima-btn-primary" disabled={lookupLoading}>
                  {lookupLoading ? 'Consultando...' : 'Consultar'}
                </button>
              </form>

              {/* Resultado del lookup */}
              {lookupResult && (
                <div className={`lookup-result ${lookupResult.found ? 'found' : 'not-found'}`}>
                  {lookupResult.found && lookupResult.data ? (
                    <>
                      <div className="result-header">
                        <span className="result-badge found">Encontrado</span>
                        <span className="result-source">Fuente: {lookupResult.source}</span>
                        {lookupResult.cached && <span className="result-cached">Cache</span>}
                      </div>
                      <div className="result-grid">
                        <div><strong>Producto:</strong> {lookupResult.data.nombre_producto || 'N/D'}</div>
                        <div><strong>Categoría:</strong> {lookupResult.data.categoria || 'N/D'}</div>
                        <div><strong>Estado:</strong>
                          <span style={{ color: ESTADO_COLORS[lookupResult.data.estado || 'desconocido'] }}>
                            {' '}{lookupResult.data.estado}
                          </span>
                        </div>
                        <div><strong>Titular:</strong> {lookupResult.data.titular_registro || 'N/D'}</div>
                        <div><strong>Fabricante:</strong> {lookupResult.data.titular_fabricante || 'N/D'}</div>
                        <div><strong>Principios Activos:</strong> {lookupResult.data.principios_activos || 'N/D'}</div>
                        <div><strong>Vencimiento Registro:</strong> {lookupResult.data.fecha_vencimiento || 'N/D'}</div>
                        <div><strong>País:</strong> {lookupResult.data.pais_origen || 'N/D'}</div>
                      </div>
                    </>
                  ) : (
                    <div className="result-header">
                      <span className="result-badge not-found">No encontrado</span>
                      <p>Puedes registrarlo manualmente a continuación</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* STEP 2: Datos del proveedor */}
            {selectedRegistro && (
              <form onSubmit={handleAddItem} className="add-item-form">
                <h3>2. Datos del Inventario</h3>
                <div className="form-row">
                  <div className="form-field">
                    <label>Nombre Comercial</label>
                    <input
                      type="text"
                      value={addForm.nombreComercial}
                      onChange={(e) => setAddForm({ ...addForm, nombreComercial: e.target.value })}
                      placeholder="Nombre usado internamente"
                    />
                  </div>
                  <div className="form-field">
                    <label>Lote Actual</label>
                    <input
                      type="text"
                      value={addForm.loteActual}
                      onChange={(e) => setAddForm({ ...addForm, loteActual: e.target.value })}
                      placeholder="Número de lote"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label>Cantidad Disponible</label>
                    <input
                      type="number"
                      value={addForm.cantidadDisponible}
                      onChange={(e) => setAddForm({ ...addForm, cantidadDisponible: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="form-field">
                    <label>Fecha Vencimiento Lote</label>
                    <input
                      type="date"
                      value={addForm.fechaVencimientoLote}
                      onChange={(e) => setAddForm({ ...addForm, fechaVencimientoLote: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label>Ubicación Almacenamiento</label>
                    <input
                      type="text"
                      value={addForm.ubicacionAlmacenamiento}
                      onChange={(e) => setAddForm({ ...addForm, ubicacionAlmacenamiento: e.target.value })}
                      placeholder="Ej: Farmacia Piso 2, Bodega A"
                    />
                  </div>
                  <div className="form-field">
                    <label>Condiciones Almacenamiento</label>
                    <input
                      type="text"
                      value={addForm.condicionesAlmacenamiento}
                      onChange={(e) => setAddForm({ ...addForm, condicionesAlmacenamiento: e.target.value })}
                      placeholder="Ej: 2-8°C, Temp. ambiente"
                    />
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="invima-btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Guardando...' : 'Agregar al Inventario'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvimaPage;

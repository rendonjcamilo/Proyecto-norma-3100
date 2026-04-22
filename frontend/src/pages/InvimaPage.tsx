/**
 * INVIMA Registry Page — Estándar TSMD
 * Consulta automática de registros sanitarios INVIMA
 * Gestión de inventario de medicamentos/dispositivos por proveedor
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  invimaApi,
  type InvimaRegistro,
  type ProviderInvimaItem,
  type InvimaLookupResult,
  type InvimaSummary,
  type InvimaAlerta,
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

const ALERTA_TIPO_COLORS: Record<string, string> = {
  farmacovigilancia: '#6554c0',
  tecnovigilancia: '#0052cc',
  retiro_mercado: '#de350b',
  suspension: '#ff8b00',
  otro: '#626f86',
};

export const InvimaPage: React.FC<InvimaPageProps> = ({ providerId }) => {
  // Validate providerId early
  if (!providerId || providerId.trim() === '') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        color: '#d32f2f',
        fontSize: '16px',
      }}>
        ⚠️ Por favor selecciona un prestador en el menú superior
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'inventario' | 'por-vencer' | 'alertas' | 'exportar'>('inventario');
  const [items, setItems] = useState<ProviderInvimaItem[]>([]);
  const [porVencer, setPorVencer] = useState<ProviderInvimaItem[]>([]);
  const [alertas, setAlertas] = useState<InvimaAlerta[]>([]);
  const [summary, setSummary] = useState<InvimaSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
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
  const [showNewAlertForm, setShowNewAlertForm] = useState(false);
  const [newAlertForm, setNewAlertForm] = useState({
    numeroRegistro: '',
    tipoAlerta: '',
    descripcion: '',
  });
  const [showMarcarRevisadaForm, setShowMarcarRevisadaForm] = useState<string | null>(null);
  const [accionTomada, setAccionTomada] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [filterSemaforo, setFilterSemaforo] = useState<string>('');
  const { can } = useRolePermission();

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadTabData = useCallback(async () => {
    try {
      setLoading(true);
      if (activeTab === 'inventario') {
        const [itemsRes, summaryRes] = await Promise.all([
          invimaApi.listProviderItems(providerId, filterSemaforo ? { semaforo: filterSemaforo } : undefined),
          invimaApi.getResumen(providerId),
        ]);
        setItems(itemsRes.data || []);
        setSummary(summaryRes.data);
      } else if (activeTab === 'por-vencer') {
        const res = await invimaApi.getPorVencer(providerId, 90);
        setPorVencer(res.data || []);
      } else if (activeTab === 'alertas') {
        const res = await invimaApi.listAlertas({ sinRevisar: false });
        setAlertas(res.data || []);
      } else if (activeTab === 'exportar') {
        if (!summary) {
          const res = await invimaApi.getResumen(providerId);
          setSummary(res.data);
        }
      }
    } catch (err) {
      console.error('Error loading INVIMA tab:', err);
      showToast('error', 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [activeTab, filterSemaforo, providerId, summary]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

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
      // Reload inventory data
      const [itemsRes, summaryRes] = await Promise.all([
        invimaApi.listProviderItems(providerId, filterSemaforo ? { semaforo: filterSemaforo } : undefined),
        invimaApi.getResumen(providerId),
      ]);
      setItems(itemsRes.data || []);
      setSummary(summaryRes.data);
    } catch (err) {
      showToast('error', `Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── DELETE ITEM ───
  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este item?')) return;
    try {
      await invimaApi.deleteProviderItem(providerId, itemId);
      showToast('success', 'Item eliminado del inventario');
      // Reload inventory data
      const [itemsRes, summaryRes] = await Promise.all([
        invimaApi.listProviderItems(providerId, filterSemaforo ? { semaforo: filterSemaforo } : undefined),
        invimaApi.getResumen(providerId),
      ]);
      setItems(itemsRes.data || []);
      setSummary(summaryRes.data);
    } catch (err) {
      showToast('error', `Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // ─── NEW ALERTA ───
  const handleNewAlerta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertForm.numeroRegistro || !newAlertForm.tipoAlerta || !newAlertForm.descripcion) return;

    try {
      setIsSubmitting(true);
      await invimaApi.createAlerta({
        numeroRegistro: newAlertForm.numeroRegistro,
        tipoAlerta: newAlertForm.tipoAlerta,
        descripcion: newAlertForm.descripcion,
      });
      showToast('success', 'Alerta registrada');
      setShowNewAlertForm(false);
      setNewAlertForm({ numeroRegistro: '', tipoAlerta: '', descripcion: '' });
      // Reload alertas
      const res = await invimaApi.listAlertas({ sinRevisar: false });
      setAlertas(res.data || []);
    } catch (err) {
      showToast('error', `Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── MARCAR ALERTA REVISADA ───
  const handleMarcarRevisada = async (e: React.FormEvent, alertaId: string) => {
    e.preventDefault();
    if (!accionTomada.trim()) return;

    try {
      setIsSubmitting(true);
      await invimaApi.marcarAlertaRevisada(alertaId, accionTomada);
      showToast('success', 'Alerta marcada como revisada');
      setShowMarcarRevisadaForm(null);
      setAccionTomada('');
      // Reload alertas
      const res = await invimaApi.listAlertas({ sinRevisar: false });
      setAlertas(res.data || []);
    } catch (err) {
      showToast('error', `Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── DOWNLOAD CSV ───
  const handleDownloadCsv = async () => {
    try {
      const blob = await invimaApi.exportCsv(providerId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invima-${providerId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('success', 'CSV descargado');
    } catch (err) {
      showToast('error', `Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // ─── SEARCH INVENTORY ───
  const filteredItems = items.filter((item) => {
    const query = searchText.toLowerCase();
    return (
      (item.nombre_producto?.toLowerCase().includes(query)) ||
      (item.nombre_comercial?.toLowerCase().includes(query)) ||
      (item.numero_registro?.toLowerCase().includes(query))
    );
  });

  if (loading && !summary) {
    return (
      <div className="invima-page invima-loading">
        <div className="page-spinner" />
        <p>Cargando registros INVIMA...</p>
      </div>
    );
  }

  const alertasSinRevisar = alertas.filter((a) => !a.revisada).length;

  return (
    <div className="invima-page">
      {toast && <div className={`invima-toast invima-toast-${toast.type}`}>{toast.message}</div>}

      {/* HEADER */}
      <header className="invima-header">
        <div>
          <h1 className="dashboard-title">Registros INVIMA</h1>
          <p>Estándar TSMD — Medicamentos, Dispositivos Médicos e Insumos</p>
        </div>
        {can('invima', 'create') && (
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

      {/* TABS */}
      <nav className="invima-tabs">
        <button
          className={`invima-tab ${activeTab === 'inventario' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventario')}
        >
          Inventario
        </button>
        <button
          className={`invima-tab ${activeTab === 'por-vencer' ? 'active' : ''}`}
          onClick={() => setActiveTab('por-vencer')}
        >
          Por Vencer
        </button>
        <button
          className={`invima-tab ${activeTab === 'alertas' ? 'active' : ''}`}
          onClick={() => setActiveTab('alertas')}
        >
          Alertas {alertasSinRevisar > 0 && <span className="tab-badge">{alertasSinRevisar}</span>}
        </button>
        <button
          className={`invima-tab ${activeTab === 'exportar' ? 'active' : ''}`}
          onClick={() => setActiveTab('exportar')}
        >
          Exportar
        </button>
      </nav>

      {/* TAB: INVENTARIO */}
      {activeTab === 'inventario' && (
        <div className="invima-tab-content">
          {/* FILTROS */}
          <div className="invima-filters">
            <span className="filter-label">Filtrar por semáforo:</span>
            {['', 'verde', 'amarillo', 'naranja', 'rojo'].map((s) => (
              <button
                key={s}
                className={`filter-btn ${filterSemaforo === s ? 'active' : ''}`}
                style={
                  s
                    ? {
                        borderColor: SEMAFORO_COLORS[s],
                        color: filterSemaforo === s ? '#fff' : SEMAFORO_COLORS[s],
                        background: filterSemaforo === s ? SEMAFORO_COLORS[s] : 'transparent',
                      }
                    : undefined
                }
                onClick={() => setFilterSemaforo(s)}
              >
                {s ? SEMAFORO_LABELS[s] : 'Todos'}
              </button>
            ))}
          </div>

          {/* BÚSQUEDA */}
          <div className="search-section">
            <input
              type="text"
              placeholder="Buscar por nombre de producto, nombre comercial o registro INVIMA..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="search-input"
            />
          </div>

          {/* TABLA DE ITEMS */}
          {filteredItems.length === 0 ? (
            <div className="invima-empty">
              <h3>{searchText ? 'Sin resultados' : 'Sin registros INVIMA'}</h3>
              <p>
                {searchText
                  ? 'No hay medicamentos que coincidan con tu búsqueda'
                  : 'Agrega medicamentos o dispositivos médicos con su registro INVIMA para el control de cumplimiento TSMD'}
              </p>
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
                    <th>Venc. Registro</th>
                    <th>Estado Registro</th>
                    <th>Almacenamiento</th>
                    {can('invima', 'delete') && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
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
                      <td>{item.vencimiento_registro ? new Date(item.vencimiento_registro).toLocaleDateString('es-CO') : '—'}</td>
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
                      {can('invima', 'delete') && (
                        <td>
                          <button
                            className="btn-action-delete"
                            onClick={() => handleDeleteItem(item.id)}
                            title="Eliminar item"
                          >
                            🗑️
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: POR VENCER */}
      {activeTab === 'por-vencer' && (
        <div className="invima-tab-content">
          <div className="por-vencer-header">
            <h2>{porVencer.length} medicamentos vencen en los próximos 90 días</h2>
          </div>

          {porVencer.length === 0 ? (
            <div className="invima-empty">
              <h3>Sin medicamentos por vencer</h3>
              <p>Todos los medicamentos en el inventario tienen vigencia mayor a 90 días</p>
            </div>
          ) : (
            <div className="invima-table-wrapper">
              <table className="invima-table">
                <thead>
                  <tr>
                    <th>Semáforo</th>
                    <th>Producto</th>
                    <th>Registro INVIMA</th>
                    <th>Lote</th>
                    <th>Fecha Venc. Lote</th>
                    <th>Días Restantes</th>
                  </tr>
                </thead>
                <tbody>
                  {porVencer.map((item) => {
                    const diasRestantes = item.fecha_vencimiento_lote
                      ? Math.ceil((new Date(item.fecha_vencimiento_lote).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      : 0;
                    return (
                      <tr key={item.id} className={diasRestantes <= 0 ? 'row-alert' : ''}>
                        <td>
                          <span
                            className="semaforo-dot"
                            style={{ background: SEMAFORO_COLORS[item.semaforo] || '#ccc' }}
                            title={SEMAFORO_LABELS[item.semaforo]}
                          />
                        </td>
                        <td>{item.nombre_producto || '—'}</td>
                        <td className="mono">{item.numero_registro}</td>
                        <td className="mono">{item.lote_actual || '—'}</td>
                        <td>{item.fecha_vencimiento_lote ? new Date(item.fecha_vencimiento_lote).toLocaleDateString('es-CO') : '—'}</td>
                        <td>
                          <strong style={{ color: diasRestantes <= 0 ? SEMAFORO_COLORS.rojo : diasRestantes <= 30 ? SEMAFORO_COLORS.naranja : SEMAFORO_COLORS.verde }}>
                            {diasRestantes} días
                          </strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: ALERTAS */}
      {activeTab === 'alertas' && (
        <div className="invima-tab-content">
          {can('invima', 'create') && (
            <div className="alertas-actions">
              <button className="invima-btn-primary" onClick={() => setShowNewAlertForm(true)}>
                + Nueva Alerta
              </button>
            </div>
          )}

          {alertas.length === 0 ? (
            <div className="invima-empty">
              <h3>Sin alertas INVIMA</h3>
              <p>No hay alertas de farmacovigilancia o tecnovigilancia registradas</p>
            </div>
          ) : (
            <div className="alertas-list">
              {alertas.map((alerta) => (
                <div key={alerta.id} className="alerta-item">
                  <div className="alerta-header">
                    <span
                      className="alerta-tipo-badge"
                      style={{
                        background: `${ALERTA_TIPO_COLORS[alerta.tipo_alerta]}15`,
                        color: ALERTA_TIPO_COLORS[alerta.tipo_alerta],
                      }}
                    >
                      {alerta.tipo_alerta.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className={`alerta-status ${alerta.revisada ? 'revisada' : 'pendiente'}`}>
                      {alerta.revisada ? '✓ Revisada' : '⊘ Pendiente'}
                    </span>
                  </div>
                  <div className="alerta-content">
                    <p className="alerta-numero">
                      <strong>Registro:</strong> {alerta.numero_registro}
                    </p>
                    <p className="alerta-descripcion">{alerta.descripcion}</p>
                    <p className="alerta-fecha">
                      {new Date(alerta.fecha_alerta).toLocaleDateString('es-CO')}
                    </p>
                    {alerta.accion_tomada && <p className="alerta-accion"><strong>Acción:</strong> {alerta.accion_tomada}</p>}
                  </div>
                  {!alerta.revisada && can('invima', 'create') && (
                    <>
                      {showMarcarRevisadaForm === alerta.id ? (
                        <form onSubmit={(e) => handleMarcarRevisada(e, alerta.id)} className="alerta-form">
                          <textarea
                            placeholder="Describe la acción tomada..."
                            value={accionTomada}
                            onChange={(e) => setAccionTomada(e.target.value)}
                            className="alerta-textarea"
                            required
                          />
                          <div className="alerta-form-actions">
                            <button type="submit" className="invima-btn-primary" disabled={isSubmitting}>
                              {isSubmitting ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button
                              type="button"
                              className="btn-cancel"
                              onClick={() => {
                                setShowMarcarRevisadaForm(null);
                                setAccionTomada('');
                              }}
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button className="btn-marcar-revisada" onClick={() => setShowMarcarRevisadaForm(alerta.id)}>
                          Marcar revisada
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* FORM: NUEVA ALERTA */}
          {showNewAlertForm && (
            <div className="invima-modal-overlay" onClick={() => setShowNewAlertForm(false)}>
              <div className="invima-modal" onClick={(e) => e.stopPropagation()}>
                <h2>Registrar Nueva Alerta INVIMA</h2>
                <form onSubmit={handleNewAlerta}>
                  <div className="form-field">
                    <label>Número de Registro INVIMA</label>
                    <input
                      type="text"
                      placeholder="Ej: INVIMA 2020M-0012345"
                      value={newAlertForm.numeroRegistro}
                      onChange={(e) => setNewAlertForm({ ...newAlertForm, numeroRegistro: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Tipo de Alerta</label>
                    <select
                      value={newAlertForm.tipoAlerta}
                      onChange={(e) => setNewAlertForm({ ...newAlertForm, tipoAlerta: e.target.value })}
                      required
                    >
                      <option value="">Selecciona un tipo</option>
                      <option value="farmacovigilancia">Farmacovigilancia</option>
                      <option value="tecnovigilancia">Tecnovigilancia</option>
                      <option value="retiro_mercado">Retiro de Mercado</option>
                      <option value="suspension">Suspensión</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Descripción</label>
                    <textarea
                      placeholder="Describe los detalles de la alerta..."
                      value={newAlertForm.descripcion}
                      onChange={(e) => setNewAlertForm({ ...newAlertForm, descripcion: e.target.value })}
                      required
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn-cancel" onClick={() => setShowNewAlertForm(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="invima-btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? 'Registrando...' : 'Registrar Alerta'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: EXPORTAR */}
      {activeTab === 'exportar' && (
        <div className="invima-tab-content">
          <div className="export-section">
            <h2>Exportar Cumplimiento TSMD</h2>
            <p>Descarga el inventario completo de medicamentos y dispositivos en formato CSV para análisis en Excel.</p>

            {summary && (
              <div className="export-summary-grid">
                <div className="export-card">
                  <div className="export-number">{summary.totalItems}</div>
                  <div className="export-label">Total de Items</div>
                </div>
                <div className="export-card">
                  <div className="export-number">{summary.porcentajeCumplimientoTsmd}%</div>
                  <div className="export-label">Cumplimiento TSMD</div>
                </div>
                <div className="export-card">
                  <div className="export-number">{summary.registrosVigentes}</div>
                  <div className="export-label">Registros Vigentes</div>
                </div>
              </div>
            )}

            <div className="export-actions">
              <button className="invima-btn-primary invima-btn-large" onClick={handleDownloadCsv}>
                ⬇️ Descargar CSV
              </button>
            </div>

            <div className="export-info">
              <h3>Contenido del archivo</h3>
              <ul>
                <li>Número de Registro INVIMA</li>
                <li>Nombre del Producto</li>
                <li>Nombre Comercial</li>
                <li>Lote Actual</li>
                <li>Cantidad Disponible</li>
                <li>Fecha de Vencimiento del Lote</li>
                <li>Fecha de Vencimiento del Registro</li>
                <li>Estado del Registro</li>
                <li>Semáforo de Cumplimiento</li>
              </ul>
            </div>
          </div>
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
                        <div>
                          <strong>Producto:</strong> {lookupResult.data.nombre_producto || 'N/D'}
                        </div>
                        <div>
                          <strong>Categoría:</strong> {lookupResult.data.categoria || 'N/D'}
                        </div>
                        <div>
                          <strong>Estado:</strong>
                          <span style={{ color: ESTADO_COLORS[lookupResult.data.estado || 'desconocido'] }}>
                            {' '}
                            {lookupResult.data.estado}
                          </span>
                        </div>
                        <div>
                          <strong>Titular:</strong> {lookupResult.data.titular_registro || 'N/D'}
                        </div>
                        <div>
                          <strong>Fabricante:</strong> {lookupResult.data.titular_fabricante || 'N/D'}
                        </div>
                        <div>
                          <strong>Principios Activos:</strong> {lookupResult.data.principios_activos || 'N/D'}
                        </div>
                        <div>
                          <strong>Vencimiento Registro:</strong> {lookupResult.data.fecha_vencimiento || 'N/D'}
                        </div>
                        <div>
                          <strong>País:</strong> {lookupResult.data.pais_origen || 'N/D'}
                        </div>
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

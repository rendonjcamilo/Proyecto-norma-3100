/**
 * REPS Registry Page — Registro Especial de Prestadores de Servicios de Salud
 * Consulta de habilitación, servicios habilitados y estado en REPS
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  repsApi,
  type RepsConsultaResult,
  type RepsVerificacion,
  type RepsResumen,
} from '../services/api';
import { useRolePermission } from '../hooks/useRolePermission';
import { useProvider } from '../context/ProviderContext';
import './RepsPage.css';

interface RepsPageProps {
  providerId: string;
}

const ESTADO_COLORS: Record<string, string> = {
  habilitado: '#16a34a',    // green
  en_tramite: '#d97706',   // amber
  suspendido: '#dc2626',   // red
  deshabilitado: '#6b7280', // gray
  sin_verificar: '#9ca3af', // light gray
};

export const RepsPage: React.FC<RepsPageProps> = ({ providerId }) => {
  // Validate providerId early - MUST NOT PROCEED IF EMPTY
  if (!providerId || providerId === '' || providerId.trim() === '') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: '#d32f2f',
        fontSize: '16px',
      }}>
        ⚠️ Cargando... Por favor selecciona un prestador
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'estado' | 'historial' | 'diferencias' | 'servicios'>('estado');
  const [loading, setLoading] = useState(true);
  const [codigoHabilitacion, setCodigoHabilitacion] = useState('');
  const [consultaResult, setConsultaResult] = useState<RepsConsultaResult | null>(null);
  const [consultaLoading, setConsultaLoading] = useState(false);
  const [historial, setHistorial] = useState<RepsVerificacion[]>([]);
  const [resumen, setResumen] = useState<RepsResumen | null>(null);
  const [ultimaVerificacion, setUltimaVerificacion] = useState<RepsVerificacion | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { can } = useRolePermission();

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const { isLoading: providerLoading } = useProvider();

  const loadTabData = useCallback(async () => {
    // Don't load if providerId is empty
    if (!providerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [resumenRes, historialRes, ultimaRes] = await Promise.all([
        repsApi.getResumen(providerId),
        repsApi.getHistorial(providerId),
        repsApi.getUltimaVerificacion(providerId),
      ]);

      setResumen(resumenRes.data);
      setHistorial(historialRes.data || []);
      setUltimaVerificacion(ultimaRes.data);
    } catch (err) {
      console.error('Error loading REPS data:', err);
      showToast('error', 'Error al cargar datos REPS');
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    // Wait for provider context to finish loading before attempting API calls
    if (!providerLoading) {
      loadTabData();
    }
  }, [loadTabData, providerLoading]);

  // ─── CONSULTAR EN REPS ───
  const handleConsultar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoHabilitacion.trim()) return;

    try {
      setConsultaLoading(true);
      setConsultaResult(null);
      const res = await repsApi.consultar(codigoHabilitacion.trim());
      setConsultaResult(res.data);

      if (res.data.found) {
        showToast('success', 'Prestador encontrado en REPS');
      } else {
        showToast('error', 'Prestador no encontrado en REPS');
      }
    } catch (err) {
      showToast('error', 'Error al consultar REPS');
    } finally {
      setConsultaLoading(false);
    }
  };

  // ─── REGISTRAR VERIFICACIÓN ───
  const handleRegistrarVerificacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultaResult?.data) return;

    try {
      setIsSubmitting(true);
      await repsApi.registrar(providerId, consultaResult.data);
      showToast('success', 'Verificación REPS registrada');
      setCodigoHabilitacion('');
      setConsultaResult(null);
      // Reload data
      await loadTabData();
    } catch (err) {
      showToast('error', `Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !resumen) {
    return (
      <div className="reps-page reps-loading">
        <div className="page-spinner" />
        <p>Cargando datos REPS...</p>
      </div>
    );
  }

  return (
    <div className="reps-page">
      {toast && <div className={`reps-toast reps-toast-${toast.type}`}>{toast.message}</div>}

      {/* HEADER */}
      <div className="aud-hero">
        <div className="aud-hero-content">
          <span className="aud-hero-badge">
            <svg width="6" height="6" viewBox="0 0 6 6" fill="none"><circle cx="3" cy="3" r="3" fill="#818cf8"/></svg>
            Habilitación
          </span>
          <h1 className="aud-hero-title">REPS</h1>
          <p className="aud-hero-subtitle">Registro Especial de Prestadores de Servicios de Salud</p>
        </div>
        <div className="aud-hero-orb" />
      </div>

      {/* ESTADO CARD */}
      {resumen && (
        <div className="reps-status-card">
          <div className="status-badge" style={{ backgroundColor: ESTADO_COLORS[resumen.estado_habilitacion] }}>
            {resumen.estado_habilitacion === 'habilitado' ? '✓' : '!'}
          </div>
          <div className="status-content">
            <h3>{resumen.estado_habilitacion === 'habilitado' ? 'Habilitado' : 'No habilitado'}</h3>
            <p>
              {resumen.ultima_verificacion
                ? `Última verificación: ${new Date(resumen.ultima_verificacion).toLocaleDateString()} (${resumen.dias_desde_verificacion} días)`
                : 'Sin verificaciones registradas'}
            </p>
            {resumen.tiene_sanciones && (
              <div className="alert-inline" style={{ color: '#dc2626', marginTop: '0.5rem' }}>
                ⚠ Tiene sanciones activas
              </div>
            )}
            {resumen.tiene_diferencias && (
              <div className="alert-inline" style={{ color: '#d97706', marginTop: '0.5rem' }}>
                ⚠ Diferencias encontradas
              </div>
            )}
          </div>
        </div>
      )}

      {/* TABS */}
      <nav className="reps-tabs">
        <button
          className={`reps-tab ${activeTab === 'estado' ? 'active' : ''}`}
          onClick={() => setActiveTab('estado')}
        >
          Estado
        </button>
        <button
          className={`reps-tab ${activeTab === 'historial' ? 'active' : ''}`}
          onClick={() => setActiveTab('historial')}
        >
          Historial ({historial.length})
        </button>
        <button
          className={`reps-tab ${activeTab === 'diferencias' ? 'active' : ''}`}
          onClick={() => setActiveTab('diferencias')}
          style={{
            color: ultimaVerificacion?.tiene_diferencias ? '#d97706' : undefined,
          }}
        >
          Diferencias
        </button>
        <button
          className={`reps-tab ${activeTab === 'servicios' ? 'active' : ''}`}
          onClick={() => setActiveTab('servicios')}
        >
          Servicios REPS
        </button>
      </nav>

      {/* TAB: ESTADO */}
      {activeTab === 'estado' && (
        <section className="reps-tab-content">
          {can('reps', 'create') && (
            <div className="reps-form-section">
              <h3>Consultar en REPS</h3>
              <form onSubmit={handleConsultar} className="reps-consulta-form">
                <input
                  type="text"
                  placeholder="Código de habilitación (ej: 123456)"
                  value={codigoHabilitacion}
                  onChange={(e) => setCodigoHabilitacion(e.target.value)}
                  disabled={consultaLoading}
                  required
                />
                <button type="submit" disabled={consultaLoading}>
                  {consultaLoading ? 'Consultando...' : 'Consultar'}
                </button>
              </form>

              {consultaResult && (
                <div className="reps-consulta-result">
                  {consultaResult.found && consultaResult.data ? (
                    <>
                      <div className="result-info">
                        <div className="info-group">
                          <label>Prestador:</label>
                          <p>{consultaResult.data.nombre_prestador}</p>
                        </div>
                        <div className="info-group">
                          <label>NIT:</label>
                          <p>{consultaResult.data.nit}</p>
                        </div>
                        <div className="info-group">
                          <label>Ubicación:</label>
                          <p>{consultaResult.data.municipio}, {consultaResult.data.departamento}</p>
                        </div>
                        <div className="info-group">
                          <label>Tipo:</label>
                          <p>{consultaResult.data.tipo_prestador}</p>
                        </div>
                        <div className="info-group">
                          <label>Nivel de atención:</label>
                          <p>{consultaResult.data.nivel_atencion}</p>
                        </div>
                        <div className="info-group">
                          <label>Estado:</label>
                          <p>
                            <span style={{ color: ESTADO_COLORS[consultaResult.data.estado_habilitacion] }}>
                              {consultaResult.data.estado_habilitacion}
                            </span>
                          </p>
                        </div>
                      </div>

                      {can('reps', 'create') && (
                        <button
                          className="reps-btn-register"
                          onClick={handleRegistrarVerificacion}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Registrando...' : 'Registrar Verificación'}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="result-error">
                      {consultaResult.error || 'No se encontraron datos en REPS'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* TAB: HISTORIAL */}
      {activeTab === 'historial' && (
        <section className="reps-tab-content">
          <h3>Historial de Verificaciones</h3>
          {historial.length === 0 ? (
            <p className="reps-empty">Sin verificaciones registradas</p>
          ) : (
            <div className="reps-table-wrapper">
              <table className="reps-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Prestador</th>
                    <th>NIT</th>
                    <th>Estado</th>
                    <th>Servicios</th>
                    <th>Diferencias</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((v) => (
                    <tr key={v.id}>
                      <td>{new Date(v.fecha_consulta).toLocaleDateString()}</td>
                      <td>{v.reps_nombre_prestador}</td>
                      <td>{v.reps_nit}</td>
                      <td>
                        <span
                          style={{
                            color: ESTADO_COLORS[v.estado_habilitacion],
                            fontWeight: 600,
                          }}
                        >
                          {v.estado_habilitacion}
                        </span>
                      </td>
                      <td>{v.servicios_habilitados?.length || 0}</td>
                      <td>
                        {v.tiene_diferencias ? (
                          <span style={{ color: '#d97706' }}>Sí</span>
                        ) : (
                          <span style={{ color: '#16a34a' }}>No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB: DIFERENCIAS */}
      {activeTab === 'diferencias' && (
        <section className="reps-tab-content">
          <h3>Diferencias Encontradas</h3>
          {!ultimaVerificacion ? (
            <p className="reps-empty">Sin verificaciones registradas</p>
          ) : ultimaVerificacion.diferencias_encontradas?.length === 0 ? (
            <p className="reps-empty" style={{ color: '#16a34a' }}>
              ✓ Sin diferencias encontradas
            </p>
          ) : (
            <div className="reps-diferencias-list">
              {ultimaVerificacion.diferencias_encontradas?.map((diff, idx) => (
                <div key={idx} className="diferencia-item">
                  <div className="diferencia-campo">{diff.campo}</div>
                  <div className="diferencia-values">
                    <div>
                      <label>REPS:</label>
                      <p>{diff.valor_reps}</p>
                    </div>
                    <div>
                      <label>Sistema:</label>
                      <p>{diff.valor_declarado}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB: SERVICIOS REPS */}
      {activeTab === 'servicios' && (
        <section className="reps-tab-content">
          <h3>Servicios Habilitados en REPS</h3>
          {!ultimaVerificacion || !ultimaVerificacion.servicios_habilitados?.length ? (
            <p className="reps-empty">Sin servicios habilitados en REPS</p>
          ) : (
            <div className="reps-servicios-list">
              {ultimaVerificacion.servicios_habilitados.map((svc, idx) => (
                <div key={idx} className="servicio-item">
                  <div className="servicio-code">{svc.codigo}</div>
                  <div className="servicio-info">
                    <p className="servicio-nombre">{svc.nombre}</p>
                    {svc.desde && (
                      <p className="servicio-dates">
                        {svc.desde} {svc.hasta ? `— ${svc.hasta}` : ''}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

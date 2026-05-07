/**
 * WhatsAppPanel — Prospección comercial vía REPS para auditores
 * Consulta datos.gov.co en tiempo real y enriquece con fechas de vencimiento
 * scrapeadas del portal MINSALUD para filtrar prestadores próximos a vencer.
 */

import React, { useState, useCallback, useRef } from 'react';
import { repsApi, RepsProspecto, RepsEnrichResult } from '../../services/api';
import './WhatsAppPanel.css';

const DEPARTAMENTOS_COLOMBIA = [
  'AMAZONAS','ANTIOQUIA','ARAUCA','ATLÁNTICO','BOLÍVAR','BOYACÁ','CALDAS',
  'CAQUETÁ','CASANARE','CAUCA','CESAR','CHOCÓ','CÓRDOBA','CUNDINAMARCA',
  'GUAINÍA','GUAVIARE','HUILA','LA GUAJIRA','MAGDALENA','META','NARIÑO',
  'NORTE DE SANTANDER','PUTUMAYO','QUINDÍO','RISARALDA','SAN ANDRÉS Y PROVIDENCIA',
  'SANTANDER','SUCRE','TOLIMA','VALLE DEL CAUCA','VAUPÉS','VICHADA',
];

const CLASES_PRESTADOR = [
  'Profesional Independiente',
  'Institución Prestadora de Servicios de Salud',
  'Empresa Social del Estado',
  'Transporte Especial de Pacientes',
  'Objeto Social Diferente al de Salud',
];

const PLANTILLA_DEFAULT = `Estimado(a) {{nombre_prestador}},

Mi nombre es [Tu nombre] y me especializo en auditoría de habilitación bajo la Resolución 3100 de 2019.

He revisado su registro en el REPS y su habilitación vence el {{fecha_vencimiento}} (en {{dias_hasta_vencer}} días). Me gustaría ofrecerle nuestros servicios antes de ese plazo:

✅ Autoevaluación de los 512 criterios de la Norma 3100
✅ Preparación ante visitas de entes de control
✅ Acompañamiento en corrección de no conformidades

🏥 Código REPS: {{codigo_habilitacion}}
📍 Municipio: {{municipio}}

¿Le interesa conocer cómo podemos apoyar a su institución?

Quedo atento(a),
[Tu nombre y contacto]`;

type ClaseChip = { label: string; color: 'azul' | 'morado' | 'verde' | 'gris' };
type EnrichStatus = 'idle' | 'running' | 'done';

function chipParaClase(clase: string): ClaseChip {
  const c = clase.toLowerCase();
  if (c.includes('ese') || c.includes('empresa social')) return { label: 'ESE', color: 'azul' };
  if (c.includes('ips') || c.includes('institución') || c.includes('institucion')) return { label: 'IPS', color: 'verde' };
  if (c.includes('profesional')) return { label: 'Prof. Ind.', color: 'morado' };
  if (c.includes('transporte')) return { label: 'Transporte', color: 'gris' };
  return { label: clase.slice(0, 10) + (clase.length > 10 ? '…' : ''), color: 'gris' };
}

function formatFechaVenc(fecha: string | null): string {
  if (!fecha) return 'N/D';
  try {
    return new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  } catch {
    return fecha;
  }
}

function buildMensaje(plantilla: string, p: RepsProspecto): string {
  return plantilla
    .replace(/{{nombre_prestador}}/g, p.nombre_prestador)
    .replace(/{{codigo_habilitacion}}/g, p.codigo_habilitacion || 'N/D')
    .replace(/{{municipio}}/g, p.municipio)
    .replace(/{{fecha_vencimiento}}/g, formatFechaVenc(p.fecha_vencimiento))
    .replace(/{{dias_hasta_vencer}}/g, p.dias_hasta_vencer !== null ? String(p.dias_hasta_vencer) : 'N/D');
}

function toWaPhone(celular: string): string {
  const d = celular.replace(/\D/g, '');
  if (d.startsWith('57') && d.length === 12) return d;
  if (d.length === 10 && d.startsWith('3')) return `57${d}`;
  return d;
}

function diasBadgeClass(dias: number | null): string {
  if (dias === null) return '';
  if (dias <= 0) return 'wap-venc-badge--vencido';
  if (dias <= 15) return 'wap-venc-badge--rojo';
  if (dias <= 30) return 'wap-venc-badge--naranja';
  if (dias <= 60) return 'wap-venc-badge--amarillo';
  return 'wap-venc-badge--verde';
}

export const WhatsAppPanel: React.FC = () => {
  const [prospectos, setProspectos] = useState<RepsProspecto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalEncontrados, setTotalEncontrados] = useState<number | null>(null);

  const [departamento, setDepartamento] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [clase, setClase] = useState('');
  const [soloConCelular, setSoloConCelular] = useState(false);
  const [filtrarPorVencimiento, setFiltrarPorVencimiento] = useState(false);
  const [diasHastaVencer, setDiasHastaVencer] = useState(30);

  const [selected, setSelected] = useState<RepsProspecto | null>(null);
  const [plantilla, setPlantilla] = useState(PLANTILLA_DEFAULT);
  const [manualPhone, setManualPhone] = useState('');

  // Estado de enriquecimiento
  const [enrichStatus, setEnrichStatus] = useState<EnrichStatus>('idle');
  const [enrichProgress, setEnrichProgress] = useState({ done: 0, total: 0, exitosos: 0 });
  const [enrichErrors, setEnrichErrors] = useState<RepsEnrichResult[]>([]);
  const enrichAbort = useRef(false);

  // Modal de ingreso manual de fecha
  const [manualModal, setManualModal] = useState<{
    nit: string; nombre: string; fecha: string; saving: boolean;
  } | null>(null);

  const canSearch = departamento.trim() !== '' || municipio.trim() !== '';

  const prospectosFiltrados = filtrarPorVencimiento
    ? prospectos.filter(
        (p) => p.fecha_vencimiento !== null && p.dias_hasta_vencer !== null && p.dias_hasta_vencer <= diasHastaVencer
      )
    : prospectos;

  const enrichedCount = prospectos.filter((p) => p.fecha_vencimiento !== null).length;

  // ── Búsqueda ──────────────────────────────────────────────────────────────

  const cargar = useCallback(async () => {
    if (!canSearch) return;
    setLoading(true);
    setError('');
    setSelected(null);
    setEnrichStatus('idle');
    setEnrichProgress({ done: 0, total: 0, exitosos: 0 });
    setEnrichErrors([]);
    try {
      const res = await repsApi.getMercadoPotencial({
        departamento: departamento || undefined,
        municipio: municipio.trim().toUpperCase() || undefined,
        clase: clase || undefined,
        soloConCelular,
      });
      setProspectos(res.data || []);
      setTotalEncontrados(res.total ?? res.data.length);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('jwt') || msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('401') || msg.toLowerCase().includes('unauthorized')) {
        setError('Sesión expirada — vuelve a iniciar sesión para consultar el REPS.');
      } else {
        setError('No se pudo conectar con datos.gov.co. Verifica tu conexión e intenta de nuevo.');
      }
      setTotalEncontrados(null);
    } finally {
      setLoading(false);
    }
  }, [departamento, municipio, clase, soloConCelular, canSearch]);

  // ── Enriquecimiento por lotes ──────────────────────────────────────────────

  const handleEnriquecer = async () => {
    const nits = prospectos.map((p) => p.nit).filter(Boolean);
    if (nits.length === 0) return;

    enrichAbort.current = false;
    setEnrichStatus('running');
    setEnrichErrors([]);

    const BATCH = 10;
    let done = 0;
    let exitosos = 0;
    const allErrors: RepsEnrichResult[] = [];

    setEnrichProgress({ done: 0, total: nits.length, exitosos: 0 });

    for (let i = 0; i < nits.length; i += BATCH) {
      if (enrichAbort.current) break;

      const batch = nits.slice(i, i + BATCH);
      try {
        const res = await repsApi.enrichLote(batch);
        const results = res.data || [];

        // Actualizar prospectos con las fechas obtenidas
        setProspectos((prev) => {
          const map = new Map(results.map((r) => [r.nit, r]));
          const today = Date.now();
          return prev.map((p) => {
            const r = map.get(p.nit);
            if (r?.ok && r.fecha_vencimiento) {
              const dias = Math.floor(
                (new Date(r.fecha_vencimiento).getTime() - today) / 86_400_000
              );
              return { ...p, fecha_vencimiento: r.fecha_vencimiento, dias_hasta_vencer: dias };
            }
            return p;
          });
        });

        done += batch.length;
        exitosos += res.exitosos ?? results.filter((r) => r.ok && r.fecha_vencimiento).length;
        const errors = results.filter((r) => !r.ok || !r.fecha_vencimiento);
        allErrors.push(...errors);

        setEnrichProgress({ done, total: nits.length, exitosos });
        setEnrichErrors([...allErrors]);
      } catch {
        done += batch.length;
        setEnrichProgress({ done, total: nits.length, exitosos });
      }
    }

    setEnrichStatus('done');
  };

  // ── Ingreso manual de fecha ────────────────────────────────────────────────

  const abrirManual = (p: RepsProspecto) => {
    setManualModal({ nit: p.nit, nombre: p.nombre_prestador, fecha: '', saving: false });
  };

  const guardarManual = async () => {
    if (!manualModal || !manualModal.fecha) return;
    setManualModal((m) => m ? { ...m, saving: true } : null);
    try {
      await repsApi.setManual(manualModal.nit, manualModal.fecha, manualModal.nombre);
      const today = Date.now();
      const dias = Math.floor((new Date(manualModal.fecha).getTime() - today) / 86_400_000);
      setProspectos((prev) =>
        prev.map((p) =>
          p.nit === manualModal.nit
            ? { ...p, fecha_vencimiento: manualModal.fecha, dias_hasta_vencer: dias }
            : p
        )
      );
      // Actualizar selected si corresponde
      setSelected((s) =>
        s?.nit === manualModal.nit
          ? { ...s, fecha_vencimiento: manualModal.fecha, dias_hasta_vencer: dias }
          : s
      );
      setManualModal(null);
    } catch {
      setManualModal((m) => m ? { ...m, saving: false } : null);
    }
  };

  const handleSelect = (p: RepsProspecto) => {
    setSelected(p);
    setManualPhone(p.celular ? toWaPhone(p.celular) : '');
  };

  const handleEnviarWhatsApp = () => {
    if (!selected) return;
    const phone = manualPhone || (selected.celular ? toWaPhone(selected.celular) : '');
    if (!phone) return;
    const texto = encodeURIComponent(buildMensaje(plantilla, selected));
    window.open(`https://wa.me/${phone}?text=${texto}`, '_blank', 'noopener,noreferrer');
  };

  const phoneValido = manualPhone.replace(/\D/g, '').length >= 10;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="wap-root">
      {/* Header */}
      <div className="wap-header">
        <span className="wap-header-badge">
          <svg width="6" height="6" viewBox="0 0 6 6"><circle cx="3" cy="3" r="3" fill="#25d366"/></svg>
          WhatsApp · Prospección REPS
        </span>
        <h2>Prestadores habilitados — Prospección comercial</h2>
        <p>
          Busca prestadores del REPS nacional, carga sus fechas de vencimiento de habilitación
          y contáctalos antes de que venzan para ofrecerles servicios de auditoría Res. 3100.
        </p>
      </div>

      {/* Barra de filtros */}
      <div className="wap-filters">
        <div className="wap-filter-group">
          <label>Departamento *</label>
          <select value={departamento} onChange={(e) => setDepartamento(e.target.value)}>
            <option value="">— Selecciona departamento —</option>
            {DEPARTAMENTOS_COLOMBIA.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="wap-filter-group wap-filter-group--municipio">
          <label>Municipio (opcional)</label>
          <input
            type="text"
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
            placeholder="Ej: MEDELLÍN"
            className="wap-municipio-input"
          />
        </div>

        <div className="wap-filter-group">
          <label>Tipo de prestador</label>
          <select value={clase} onChange={(e) => setClase(e.target.value)}>
            <option value="">— Todos los tipos —</option>
            {CLASES_PRESTADOR.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="wap-filter-celular">
          <label className="wap-checkbox-label">
            <input
              type="checkbox"
              checked={soloConCelular}
              onChange={(e) => setSoloConCelular(e.target.checked)}
            />
            Solo con celular
          </label>
        </div>

        <button
          className="wap-search-btn"
          onClick={cargar}
          disabled={loading || !canSearch}
          title={!canSearch ? 'Selecciona al menos departamento o municipio' : ''}
        >
          {loading ? (
            <><div className="wap-spinner-sm" /> Consultando REPS...</>
          ) : (
            <>🔍 Buscar en REPS</>
          )}
        </button>
      </div>

      {!canSearch && (
        <div className="wap-hint-required">
          Selecciona al menos un departamento o escribe un municipio para iniciar la búsqueda.
        </div>
      )}

      {/* Barra de enriquecimiento — aparece una vez hay resultados */}
      {prospectos.length > 0 && (
        <div className="wap-enrich-bar">
          <div className="wap-enrich-bar-left">
            <span className="wap-enrich-icon">📅</span>
            <div>
              <div className="wap-enrich-title">Fechas de vencimiento MINSALUD</div>
              <div className="wap-enrich-sub">
                {enrichedCount === 0
                  ? 'Sin fechas cargadas — el filtro por vencimiento requiere este paso'
                  : `${enrichedCount} de ${prospectos.length} prestadores con fecha cargada`}
              </div>
            </div>
          </div>

          <div className="wap-enrich-bar-right">
            {/* Filtro por vencimiento — solo activo cuando hay datos */}
            <label className={`wap-checkbox-label ${enrichedCount === 0 ? 'wap-checkbox-label--disabled' : ''}`}>
              <input
                type="checkbox"
                checked={filtrarPorVencimiento}
                disabled={enrichedCount === 0}
                onChange={(e) => setFiltrarPorVencimiento(e.target.checked)}
              />
              Vence en
              <input
                type="number"
                min={7} max={365} step={1}
                value={diasHastaVencer}
                disabled={!filtrarPorVencimiento || enrichedCount === 0}
                onChange={(e) => setDiasHastaVencer(Math.max(1, Math.min(365, parseInt(e.target.value) || 30)))}
                className="wap-dias-input"
              />
              días
            </label>

            {enrichStatus !== 'running' && (
              <button
                className="wap-enrich-btn"
                onClick={handleEnriquecer}
                title="Consulta el portal MINSALUD para obtener la fecha de vencimiento de cada prestador"
              >
                {enrichStatus === 'done' && enrichedCount > 0
                  ? '🔄 Actualizar fechas'
                  : '📥 Cargar fechas de vencimiento'}
              </button>
            )}

            {enrichStatus === 'running' && (
              <div className="wap-enrich-progress">
                <div className="wap-spinner-sm" />
                <span>
                  {enrichProgress.done}/{enrichProgress.total} consultados
                  {enrichProgress.exitosos > 0 && ` · ${enrichProgress.exitosos} con fecha`}
                </span>
                <button
                  className="wap-enrich-cancel"
                  onClick={() => { enrichAbort.current = true; }}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Aviso de resultado del enriquecimiento */}
      {enrichStatus === 'done' && (
        <div className={`wap-enrich-result ${enrichedCount === 0 ? 'wap-enrich-result--warn' : 'wap-enrich-result--ok'}`}>
          {enrichedCount > 0 ? (
            <>
              ✅ <strong>{enrichedCount}</strong> prestadores con fecha de vencimiento cargada.
              {enrichErrors.length > 0 && (
                <> · <strong>{enrichErrors.length}</strong> sin resultado del portal (ingresa manualmente haciendo clic en "Fecha manual" en cada uno).</>
              )}
            </>
          ) : (
            <>
              ⚠️ El portal MINSALUD no retornó fechas automáticamente (puede requerir sesión de navegador).
              {' '}Usa el botón <strong>"Fecha manual"</strong> en cada prestador para ingresar la fecha que ves en el{' '}
              <a
                href="https://prestadores.minsalud.gov.co/habilitacion/"
                target="_blank"
                rel="noopener noreferrer"
              >
                portal oficial
              </a>.
            </>
          )}
        </div>
      )}

      <div className="wap-body">
        {/* Panel izquierdo: lista */}
        <div className="wap-list-panel">
          <div className="wap-list-header">
            {!loading && totalEncontrados !== null && prospectos.length > 0 && (
              <span className="wap-list-count">
                <strong>{prospectosFiltrados.length}</strong>
                {filtrarPorVencimiento && enrichedCount > 0
                  ? <> vencen en ≤ {diasHastaVencer} días</>
                  : <> prestadores</>}
                {departamento && <> en <strong>{departamento}</strong></>}
                {municipio && <> · <strong>{municipio.toUpperCase()}</strong></>}
                {filtrarPorVencimiento && enrichedCount === 0 && (
                  <span className="wap-list-count-hint"> (carga fechas para filtrar)</span>
                )}
              </span>
            )}
            {!loading && prospectos.length === 0 && !error && totalEncontrados === null && (
              <span className="wap-list-count">Usa los filtros y presiona Buscar</span>
            )}
          </div>

          {loading && (
            <div className="wap-state">
              <div className="wap-spinner" />
              <span>Consultando datos.gov.co — REPS nacional...</span>
              <small>Esto puede tomar unos segundos</small>
            </div>
          )}

          {!loading && error && (
            <div className="wap-state wap-state--error">
              <span>⚠️ {error}</span>
              <button onClick={cargar}>Reintentar</button>
            </div>
          )}

          {!loading && !error && prospectos.length === 0 && totalEncontrados !== null && (
            <div className="wap-state wap-state--empty">
              <span className="wap-empty-icon">🔍</span>
              <span>No se encontraron prestadores con los filtros seleccionados.</span>
              {soloConCelular && <small>Prueba desactivando "Solo con celular"</small>}
            </div>
          )}

          {!loading && !error && prospectosFiltrados.length === 0 && filtrarPorVencimiento && prospectos.length > 0 && enrichedCount > 0 && (
            <div className="wap-state wap-state--empty">
              <span className="wap-empty-icon">✅</span>
              <span>Ningún prestador vence en los próximos {diasHastaVencer} días.</span>
              <small>Prueba aumentar el rango de días o desactivar el filtro.</small>
            </div>
          )}

          {!loading && !error && prospectosFiltrados.length > 0 && (
            <ul className="wap-list">
              {prospectosFiltrados.map((p) => {
                const chip = chipParaClase(p.clase_prestador);
                const isActive = selected?.codigo_habilitacion === p.codigo_habilitacion && selected?.nit === p.nit;
                const tieneVencimiento = p.fecha_vencimiento !== null;
                return (
                  <li
                    key={`${p.codigo_habilitacion}-${p.nit}`}
                    className={`wap-item ${isActive ? 'wap-item--active' : ''}`}
                    onClick={() => handleSelect(p)}
                  >
                    <div className="wap-item-top">
                      <span className="wap-item-name">{p.nombre_prestador}</span>
                      <div className="wap-item-top-badges">
                        {tieneVencimiento ? (
                          <span className={`wap-venc-badge ${diasBadgeClass(p.dias_hasta_vencer)}`}>
                            ⏰ {p.dias_hasta_vencer !== null
                              ? (p.dias_hasta_vencer <= 0 ? 'Vencido' : `${p.dias_hasta_vencer}d`)
                              : formatFechaVenc(p.fecha_vencimiento)}
                          </span>
                        ) : enrichStatus !== 'idle' ? (
                          <button
                            className="wap-venc-manual-btn"
                            onClick={(e) => { e.stopPropagation(); abrirManual(p); }}
                            title="Ingresar fecha de vencimiento manualmente"
                          >
                            📅 Fecha manual
                          </button>
                        ) : null}
                        <span className={`wap-chip wap-chip--${chip.color}`}>{chip.label}</span>
                      </div>
                    </div>
                    <div className="wap-item-meta">
                      <span>NIT {p.nit}</span>
                      {p.codigo_habilitacion && <span>· Hab. {p.codigo_habilitacion}</span>}
                      {tieneVencimiento && (
                        <span className="wap-item-venc-date">· vence {formatFechaVenc(p.fecha_vencimiento)}</span>
                      )}
                    </div>
                    <div className="wap-item-loc">
                      📍 {p.municipio}{p.departamento ? `, ${p.departamento}` : ''}
                    </div>
                    {p.direccion && <div className="wap-item-dir">{p.direccion}</div>}
                    <div className="wap-item-phone">
                      {p.celular
                        ? <><span>📱</span> {p.celular}</>
                        : p.telefono_raw
                          ? <><span>📞</span> {p.telefono_raw} <span className="wap-no-phone">(fijo)</span></>
                          : <span className="wap-no-phone">Sin número en REPS</span>
                      }
                      {p.email && <span className="wap-item-email">· {p.email}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Panel derecho: compositor */}
        <div className="wap-composer">
          {!selected ? (
            <div className="wap-composer-empty">
              <div className="wap-composer-empty-icon">💬</div>
              <p>Selecciona un prestador de la lista para preparar el mensaje de contacto</p>
              {prospectos.length > 0 && enrichedCount === 0 && (
                <p className="wap-composer-empty-hint">
                  💡 Haz clic en <strong>"Cargar fechas de vencimiento"</strong> para identificar
                  prestadores cuya habilitación vence pronto.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="wap-composer-header">
                <div>
                  <div className="wap-composer-name">{selected.nombre_prestador}</div>
                  <div className="wap-composer-sub">
                    NIT {selected.nit}
                    {selected.codigo_habilitacion && ` · Hab. ${selected.codigo_habilitacion}`}
                    {' · '}{selected.municipio}
                    {selected.departamento && `, ${selected.departamento}`}
                  </div>
                  {selected.direccion && (
                    <div className="wap-composer-dir">{selected.direccion}</div>
                  )}
                  {selected.fecha_vencimiento ? (
                    <div className={`wap-composer-venc ${
                      (selected.dias_hasta_vencer ?? 999) <= 0 ? 'wap-composer-venc--vencido' :
                      (selected.dias_hasta_vencer ?? 999) <= 15 ? 'wap-composer-venc--rojo' :
                      (selected.dias_hasta_vencer ?? 999) <= 30 ? 'wap-composer-venc--naranja' : 'wap-composer-venc--amarillo'
                    }`}>
                      ⏰ Habilitación vence: <strong>{formatFechaVenc(selected.fecha_vencimiento)}</strong>
                      {selected.dias_hasta_vencer !== null && selected.dias_hasta_vencer > 0
                        && ` — en ${selected.dias_hasta_vencer} días`}
                      {selected.dias_hasta_vencer !== null && selected.dias_hasta_vencer <= 0
                        && ' — ¡YA VENCIÓ!'}
                    </div>
                  ) : (
                    <div className="wap-composer-venc wap-composer-venc--desconocida">
                      📅 Fecha de vencimiento no cargada —{' '}
                      <button
                        className="wap-link-btn"
                        onClick={() => abrirManual(selected)}
                      >
                        Ingresar manualmente
                      </button>
                      {' '}o consultar en el{' '}
                      <a
                        href={`https://prestadores.minsalud.gov.co/habilitacion/`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        portal MINSALUD
                      </a>
                    </div>
                  )}
                </div>
                {(() => { const chip = chipParaClase(selected.clase_prestador); return (
                  <span className={`wap-chip wap-chip--${chip.color}`}>{chip.label}</span>
                ); })()}
              </div>

              {/* Número de WhatsApp */}
              <div className="wap-field">
                <label>Número de WhatsApp</label>
                <div className="wap-phone-row">
                  <span className="wap-phone-prefix">+</span>
                  <input
                    type="tel"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="573001234567"
                    maxLength={15}
                  />
                  {selected.celular && (
                    <button
                      className="wap-phone-fill"
                      onClick={() => setManualPhone(toWaPhone(selected.celular!))}
                    >
                      Usar REPS
                    </button>
                  )}
                </div>
                {selected.celular
                  ? <small className="wap-hint">Celular extraído del REPS: {selected.celular}</small>
                  : selected.telefono_raw
                    ? <small className="wap-hint-warn">REPS solo tiene número fijo ({selected.telefono_raw}). Ingresa el celular manualmente.</small>
                    : <small className="wap-hint-warn">Este prestador no tiene teléfono en REPS. Ingresa el número manualmente.</small>
                }
                {!phoneValido && manualPhone.length > 0 && (
                  <small className="wap-hint-error">Ingresa un número colombiano válido (ej: 573001234567)</small>
                )}
              </div>

              {/* Plantilla de mensaje */}
              <div className="wap-field">
                <label>Mensaje de contacto</label>
                <textarea
                  value={plantilla}
                  onChange={(e) => setPlantilla(e.target.value)}
                  rows={11}
                />
                <small className="wap-hint">
                  Variables: <code>{'{{nombre_prestador}}'}</code> <code>{'{{codigo_habilitacion}}'}</code> <code>{'{{municipio}}'}</code> <code>{'{{fecha_vencimiento}}'}</code> <code>{'{{dias_hasta_vencer}}'}</code>
                </small>
              </div>

              {/* Vista previa */}
              <div className="wap-preview">
                <div className="wap-preview-label">Vista previa</div>
                <div className="wap-preview-bubble">
                  {buildMensaje(plantilla, selected).split('\n').map((line, i) => (
                    <React.Fragment key={i}>{line}<br /></React.Fragment>
                  ))}
                </div>
              </div>

              <button
                className="wap-send-btn"
                onClick={handleEnviarWhatsApp}
                disabled={!phoneValido}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.552 4.12 1.518 5.851L.057 23.944l6.254-1.641A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.847 0-3.574-.487-5.063-1.337l-.363-.214-3.716.975.992-3.624-.237-.375A9.955 9.955 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                Abrir en WhatsApp
              </button>

              <p className="wap-disclaimer">
                Se abrirá WhatsApp Web / app con el mensaje listo para enviar.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Modal de ingreso manual de fecha */}
      {manualModal && (
        <div className="wap-modal-overlay" onClick={() => !manualModal.saving && setManualModal(null)}>
          <div className="wap-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wap-modal-header">
              <h3>📅 Ingresar fecha de vencimiento</h3>
              <button className="wap-modal-close" onClick={() => setManualModal(null)}>×</button>
            </div>
            <div className="wap-modal-body">
              <p className="wap-modal-name">{manualModal.nombre}</p>
              <p className="wap-modal-nit">NIT: {manualModal.nit}</p>
              <p className="wap-modal-hint">
                Consulta{' '}
                <a
                  href="https://prestadores.minsalud.gov.co/habilitacion/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  el portal MINSALUD
                </a>
                {' '}con este NIT y transcribe la fecha de vencimiento:
              </p>
              <div className="wap-modal-field">
                <label>Fecha de vencimiento de habilitación</label>
                <input
                  type="date"
                  value={manualModal.fecha}
                  onChange={(e) => setManualModal((m) => m ? { ...m, fecha: e.target.value } : null)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            <div className="wap-modal-footer">
              <button
                className="wap-modal-cancel"
                onClick={() => setManualModal(null)}
                disabled={manualModal.saving}
              >
                Cancelar
              </button>
              <button
                className="wap-modal-save"
                onClick={guardarManual}
                disabled={!manualModal.fecha || manualModal.saving}
              >
                {manualModal.saving ? 'Guardando...' : 'Guardar fecha'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

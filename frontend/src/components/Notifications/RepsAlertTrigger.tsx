/**
 * RepsAlertTrigger — Panel de configuración y control del cron diario de alerta REPS
 *
 * Permite al auditor configurar una búsqueda periódica en datos.gov.co para encontrar
 * prestadores próximos a vencer la habilitación, y enviarles mensajes de WhatsApp.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { repsAlertsApi, RepsAlertTrigger as TriggerConfig, RepsAlertResult, RepsProspecto } from '../../services/api';
import { MUNICIPIOS_POR_DEPARTAMENTO } from '../../data/municipiosColombia';

const DEPARTAMENTOS_COLOMBIA = [
  'AMAZONAS','ANTIOQUIA','ARAUCA','ATLÁNTICO','BOLÍVAR','BOYACÁ','CALDAS',
  'CAQUETÁ','CASANARE','CAUCA','CESAR','CHOCÓ','CÓRDOBA','CUNDINAMARCA',
  'GUAINÍA','GUAVIARE','HUILA','LA GUAJIRA','MAGDALENA','META','NARIÑO',
  'NORTE DE SANTANDER','PUTUMAYO','QUINDÍO','RISARALDA','SAN ANDRÉS Y PROVIDENCIA',
  'SANTANDER','SUCRE','TOLIMA','VALLE DEL CAUCA','VAUPÉS','VICHADA',
];

const HORAS = Array.from({ length: 24 }, (_, i) => i);

function formatRelTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'hace un momento';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

function nextRunLabel(horaLocal: number, isActive: boolean): string {
  if (!isActive) return 'Desactivado';
  const now = new Date();
  const next = new Date(now);
  next.setHours(horaLocal, 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return `Próxima: ${next.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })} a las ${String(horaLocal).padStart(2, '0')}:00`;
}

interface Props {
  onCargarAlerta: (providers: RepsProspecto[], diasFiltro: number) => void;
}

export const RepsAlertTrigger: React.FC<Props> = ({ onCargarAlerta }) => {
  const [expanded, setExpanded] = useState(false);
  const [trigger, setTrigger] = useState<TriggerConfig | null>(null);
  const [lastResult, setLastResult] = useState<RepsAlertResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [running, setRunning] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Campos del formulario — espejo del trigger
  const [dept, setDept] = useState('');
  const [muni, setMuni] = useState('');
  const [maxP, setMaxP] = useState(5000);
  const [dias, setDias] = useState(30);
  const [celular, setCelular] = useState(true);
  const [hora, setHora] = useState(9);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await repsAlertsApi.getConfig();
      const t = res.data.trigger;
      const r = res.data.lastResult;
      setTrigger(t);
      setLastResult(r);
      // Sincronizar formulario
      setDept(t.departamento || '');
      setMuni(t.municipio || '');
      setMaxP(t.max_providers);
      setDias(t.dias_antes_vencer);
      setCelular(t.solo_con_celular);
      setHora(t.hora_local);
    } catch {
      // Silencioso: el panel simplemente no muestra datos
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const handleGuardar = async () => {
    if (!trigger) return;
    setSaving(true);
    setSaveMsg('');
    setErrorMsg('');
    try {
      const res = await repsAlertsApi.updateConfig({
        departamento: dept || null,
        municipio: muni || null,
        max_providers: maxP,
        dias_antes_vencer: dias,
        solo_con_celular: celular,
        hora_local: hora,
      });
      setTrigger(res.data);
      setSaveMsg('Configuración guardada');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!trigger) return;
    setToggling(true);
    setErrorMsg('');
    try {
      const res = trigger.is_active
        ? await repsAlertsApi.desactivar()
        : await repsAlertsApi.activar();
      setTrigger(res.data);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error al cambiar estado');
    } finally {
      setToggling(false);
    }
  };

  const handleEjecutar = async () => {
    if (!trigger) return;
    setRunning(true);
    setErrorMsg('');
    setSaveMsg('');
    try {
      const res = await repsAlertsApi.ejecutar();
      setLastResult(res.data);
      // Recargar trigger para actualizar last_run_*
      const config = await repsAlertsApi.getConfig();
      setTrigger(config.data.trigger);
      setSaveMsg(`Listo: ${res.data.total_por_vencer} prestadores vencen en ≤${trigger.dias_antes_vencer} días`);
      setTimeout(() => setSaveMsg(''), 6000);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error al ejecutar');
    } finally {
      setRunning(false);
    }
  };

  const handleVerYEnviar = () => {
    if (!lastResult || !trigger) return;
    onCargarAlerta(lastResult.providers, trigger.dias_antes_vencer);
  };

  // Badge de resultados pendientes
  const badgeCount = lastResult?.total_por_vencer ?? trigger?.last_run_por_vencer ?? null;
  const badgeCelular = lastResult?.con_celular ?? trigger?.last_run_con_celular ?? null;
  const hasResults = badgeCount !== null && badgeCount > 0;

  if (loading) {
    return (
      <div className="rat-bar rat-bar--loading">
        <div className="wap-spinner-sm" />
        <span>Cargando configuración de alerta...</span>
      </div>
    );
  }

  if (!trigger) return null;

  return (
    <div className={`rat-root${expanded ? ' rat-root--open' : ''}`}>
      {/* Cabecera — siempre visible */}
      <button className="rat-header" onClick={() => setExpanded((v) => !v)} type="button">
        <div className="rat-header-left">
          <span className="rat-icon">🔔</span>
          <div>
            <span className="rat-title">Alerta Automática REPS</span>
            <span className="rat-subtitle">
              {trigger.is_active
                ? nextRunLabel(trigger.hora_local, true)
                : 'Configura y activa para consultas diarias automáticas'}
            </span>
          </div>
          {hasResults && (
            <span className="rat-badge">
              {badgeCelular !== null ? badgeCelular : badgeCount} con celular
            </span>
          )}
        </div>
        <div className="rat-header-right">
          <span className={`rat-status${trigger.is_active ? ' rat-status--active' : ' rat-status--off'}`}>
            {trigger.is_active ? '● Activo' : '○ Inactivo'}
          </span>
          <span className={`rat-chevron${expanded ? ' rat-chevron--open' : ''}`}>▾</span>
        </div>
      </button>

      {/* Cuerpo expandible */}
      {expanded && (
        <div className="rat-body">
          {/* Formulario de configuración */}
          <div className="rat-config">
            <div className="rat-config-title">Configuración de búsqueda</div>
            <div className="rat-config-grid">
              <div className="rat-field">
                <label>Departamento *</label>
                <select value={dept} onChange={(e) => { setDept(e.target.value); setMuni(''); }}>
                  <option value="">— Selecciona —</option>
                  {DEPARTAMENTOS_COLOMBIA.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="rat-field">
                <label>Municipio</label>
                <select value={muni} onChange={(e) => setMuni(e.target.value)} disabled={!dept}>
                  <option value="">— Todos —</option>
                  {(MUNICIPIOS_POR_DEPARTAMENTO[dept] ?? []).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="rat-field rat-field--sm">
                <label>Máx. resultados</label>
                <select value={maxP} onChange={(e) => setMaxP(Number(e.target.value))}>
                  <option value={250}>250</option>
                  <option value={500}>500</option>
                  <option value={1000}>1000</option>
                  <option value={2000}>2000</option>
                  <option value={3000}>3000</option>
                  <option value={5000}>5000</option>
                </select>
              </div>

              <div className="rat-field rat-field--sm">
                <label>Días antes de vencer</label>
                <input
                  type="number" min={7} max={365} step={1}
                  value={dias}
                  onChange={(e) => setDias(Math.max(1, Math.min(365, parseInt(e.target.value) || 30)))}
                />
              </div>

              <div className="rat-field rat-field--sm">
                <label>Hora de consulta</label>
                <select value={hora} onChange={(e) => setHora(Number(e.target.value))}>
                  {HORAS.map((h) => (
                    <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>

              <div className="rat-field rat-field--check">
                <label className="rat-checkbox-label">
                  <input
                    type="checkbox"
                    checked={celular}
                    onChange={(e) => setCelular(e.target.checked)}
                  />
                  Solo con celular
                </label>
              </div>
            </div>

            <div className="rat-config-actions">
              <button
                className="rat-btn rat-btn--save"
                onClick={handleGuardar}
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar configuración'}
              </button>

              {saveMsg && <span className="rat-msg rat-msg--ok">✓ {saveMsg}</span>}
              {errorMsg && <span className="rat-msg rat-msg--error">⚠ {errorMsg}</span>}
            </div>
          </div>

          {/* Control del trigger */}
          <div className="rat-controls">
            <div className="rat-controls-left">
              <button
                className={`rat-btn${trigger.is_active ? ' rat-btn--deactivate' : ' rat-btn--activate'}`}
                onClick={handleToggle}
                disabled={toggling}
                title={trigger.is_active ? 'Desactivar consulta diaria' : 'Activar consulta diaria'}
              >
                {toggling
                  ? 'Cambiando...'
                  : trigger.is_active
                    ? '⏹ Desactivar trigger'
                    : '▶ Activar trigger'}
              </button>

              <button
                className="rat-btn rat-btn--run"
                onClick={handleEjecutar}
                disabled={running || (!dept && !muni)}
                title={(!dept && !muni) ? 'Configura departamento o municipio primero' : 'Ejecutar consulta ahora'}
              >
                {running ? <><div className="wap-spinner-sm" /> Consultando REPS...</> : '⚡ Ejecutar ahora'}
              </button>
            </div>

            {/* Último resultado */}
            {(lastResult || trigger.last_run_at) && (
              <div className="rat-last-result">
                {trigger.last_run_at && (
                  <span className="rat-last-when">
                    Última ejecución: {formatRelTime(trigger.last_run_at)}
                  </span>
                )}
                {trigger.last_run_por_vencer !== null && (
                  <span className={`rat-last-count${(trigger.last_run_por_vencer ?? 0) > 0 ? ' rat-last-count--alert' : ''}`}>
                    {trigger.last_run_por_vencer} vencen en ≤{trigger.dias_antes_vencer}d
                    {trigger.last_run_con_celular !== null && (
                      <> · {trigger.last_run_con_celular} con celular</>
                    )}
                  </span>
                )}
                {trigger.last_run_error && (
                  <span className="rat-last-error" title={trigger.last_run_error}>⚠ Error en última ejecución</span>
                )}
              </div>
            )}
          </div>

          {/* Botón Ver y Enviar */}
          {lastResult && lastResult.total_por_vencer > 0 && (
            <div className="rat-result-panel">
              <div className="rat-result-summary">
                <span className="rat-result-icon">📋</span>
                <div>
                  <div className="rat-result-title">
                    {lastResult.total_por_vencer} prestadores vencen en ≤{trigger.dias_antes_vencer} días
                  </div>
                  <div className="rat-result-sub">
                    {lastResult.con_celular} tienen celular registrado en REPS
                    {lastResult.total_consultados > 0 && (
                      <> · Consultados: {lastResult.total_consultados} en total</>
                    )}
                  </div>
                  {lastResult.error && (
                    <div className="rat-result-warn">
                      ⚠ Consulta parcial — {lastResult.error}
                    </div>
                  )}
                </div>
              </div>

              <button
                className="rat-btn rat-btn--send"
                onClick={handleVerYEnviar}
                disabled={lastResult.con_celular === 0}
                title={lastResult.con_celular === 0 ? 'Ningún prestador tiene celular registrado' : 'Cargar lista en el panel de WhatsApp'}
              >
                💬 Ver y Enviar ({lastResult.con_celular} con celular)
              </button>

              <p className="rat-result-hint">
                Al hacer clic, la lista se carga en el panel WhatsApp listo para enviar uno por uno.
              </p>
            </div>
          )}

          {lastResult && lastResult.total_por_vencer === 0 && !lastResult.error && (
            <div className="rat-result-empty">
              ✅ Sin prestadores próximos a vencer en los últimos datos consultados.
            </div>
          )}

          {/* Aviso si no hay fechas enriquecidas */}
          {!lastResult && trigger.last_run_at && trigger.last_run_por_vencer === 0 && (
            <div className="rat-hint-box">
              💡 El resultado muestra 0 prestadores porque la mayoría no tienen fecha de vencimiento en la caché local.
              Realiza primero una búsqueda manual en el panel y usa <strong>&quot;Actualizar fechas&quot;</strong> para cargar las fechas del portal MINSALUD.
            </div>
          )}

          {!trigger.departamento && !trigger.municipio && (
            <div className="rat-hint-box rat-hint-box--warn">
              ⚠ Configura un departamento o municipio y guarda antes de activar la alerta.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * WhatsAppPanel — Prospección comercial vía REPS para auditores
 * Consulta datos.gov.co en tiempo real y enriquece con fechas de vencimiento
 * scrapeadas del portal MINSALUD para filtrar prestadores próximos a vencer.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { repsApi, whatsappApi, RepsProspecto, RepsEnrichResult, WaStatus } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MUNICIPIOS_POR_DEPARTAMENTO } from '../../data/municipiosColombia';
import { RepsAlertTrigger } from './RepsAlertTrigger';
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
  'Transporte Especial de Pacientes',
  'Objeto Social Diferente al de Salud',
];

const PLANTILLA_DEFAULT = `🚨 Estimado(a) Dr(a). {{nombre_prestador}}

Mi nombre es Adriana Perdomo M., especialista en auditoría en salud y verificadora de habilitación.

Hemos identificado que su habilitación en REPS vence el {{fecha_vencimiento}}. La autoevaluación anual exigida por la Resolución 3100 de 2019 debe realizarse oportunamente para evitar retiro automático del REPS, suspensión de servicios y reprocesos ante Secretaría de Salud.
Código REPS {{codigo_habilitacion}}

✅ En AYH Consultores realizamos todo el proceso por usted:
✔ Autoevaluación REPS
✔ Actualización de vigencia
✔ Recuperación de usuario y contraseña
✔ Entrega de soportes y evidencias

⚠ El sistema deja trazabilidad y la omisión queda registrada. Evite sanciones, hallazgos y pérdidas económicas por incumplimiento.

📲 Agenda hoy mismo su proceso y deje su habilitación al día antes del vencimiento.

AYH Consultores
"Tu tranquilidad, mi compromiso".

Sus datos fueron obtenidos del REPS, fuente pública administrada por el Ministerio de Salud y Protección Social, conforme al artículo 10 de la Ley 1581 de 2012. Si no desea recibir más información, responda NO.`;

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
  const { user } = useAuth();
  const canConfigureWa = user?.role === 'auditor' || user?.role === 'super_admin';

  // Estado de conexión Evolution API
  const [waStatus, setWaStatus] = useState<WaStatus | null>(null);
  const [waStatusLoading, setWaStatusLoading] = useState(true);
  const [waQR, setWaQR] = useState<{ qrcode?: string; state: string } | null>(null);
  const [waQRLoading, setWaQRLoading] = useState(false);
  const [waQRModal, setWaQRModal] = useState(false);

  // Estado de envío automático
  const [autoSending, setAutoSending] = useState(false);
  const [autoSendResult, setAutoSendResult] = useState<'success' | 'error' | null>(null);
  const [autoSendError, setAutoSendError] = useState('');

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
  const [limitResultados, setLimitResultados] = useState<number>(100);

  const [selected, setSelected] = useState<RepsProspecto | null>(null);
  const [plantilla, setPlantilla] = useState(PLANTILLA_DEFAULT);
  const [manualPhone, setManualPhone] = useState('');

  // Estado de error del QR
  const [waQRError, setWaQRError] = useState('');

  // Estado de enriquecimiento
  const [enrichStatus, setEnrichStatus] = useState<EnrichStatus>('idle');
  const [enrichProgress, setEnrichProgress] = useState({ done: 0, total: 0, exitosos: 0 });
  const [enrichErrors, setEnrichErrors] = useState<RepsEnrichResult[]>([]);
  const enrichAbort = useRef(false);

  // Modal de ingreso manual de fecha
  const [manualModal, setManualModal] = useState<{
    nit: string; nombre: string; fecha: string; saving: boolean;
  } | null>(null);

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [tablePage, setTablePage] = useState(0);
  const [sortCol, setSortCol] = useState<'dias' | 'nombre' | 'municipio'>('dias');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Selección múltiple y envío masivo
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number; errors: number } | null>(null);
  const bulkAbort = useRef(false);

  // Cargar estado de conexión al montar
  useEffect(() => {
    whatsappApi.getStatus()
      .then((res) => setWaStatus(res.data))
      .catch(() => setWaStatus({ state: 'unknown', connected: false }))
      .finally(() => setWaStatusLoading(false));
  }, []);

  const loadQR = async () => {
    setWaQRLoading(true);
    setWaQRError('');
    setWaQRModal(true);
    try {
      const res = await whatsappApi.getQR();
      if (res.data.state === 'open') {
        // Ya conectado — cerrar modal y refrescar estado
        setWaQRModal(false);
        const s = await whatsappApi.getStatus();
        setWaStatus(s.data);
        return;
      }
      setWaQR(res.data);
    } catch (err) {
      setWaQR(null);
      setWaQRError(err instanceof Error ? err.message : 'No se pudo obtener el código QR');
    } finally {
      setWaQRLoading(false);
    }
  };

  const refreshStatus = async () => {
    setWaStatusLoading(true);
    try {
      const res = await whatsappApi.getStatus();
      setWaStatus(res.data);
      if (res.data.connected) setWaQRModal(false);
    } catch {
      setWaStatus({ state: 'unknown', connected: false });
    } finally {
      setWaStatusLoading(false);
    }
  };

  const prospKey = (p: RepsProspecto) => `${p.codigo_habilitacion}-${p.nit}`;

  const toggleSelect = (p: RepsProspecto, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(prospKey(p)) ? next.delete(prospKey(p)) : next.add(prospKey(p));
      return next;
    });
  };

  const toggleSelectAll = () => {
    const conCelular = prospectosFiltrados.filter(p => p.celular);
    if (selectedIds.size === conCelular.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(conCelular.map(prospKey)));
    }
  };

  const handleEnviarMasivo = async () => {
    const destinatarios = prospectosFiltrados.filter(
      p => selectedIds.has(prospKey(p)) && p.celular
    );
    if (!destinatarios.length) return;
    bulkAbort.current = false;
    setBulkSending(true);
    setBulkProgress({ done: 0, total: destinatarios.length, errors: 0 });
    let errors = 0;
    for (let i = 0; i < destinatarios.length; i++) {
      if (bulkAbort.current) break;
      const p = destinatarios[i];
      const phone = toWaPhone(p.celular!);
      try {
        await whatsappApi.send(phone, buildMensaje(plantilla, p));
      } catch {
        errors++;
      }
      setBulkProgress({ done: i + 1, total: destinatarios.length, errors });
      if (i < destinatarios.length - 1) await new Promise(r => setTimeout(r, 3000));
    }
    setBulkSending(false);
    setSelectedIds(new Set());
  };

  const handleEnviarAutomatico = async () => {
    if (!selected) return;
    const phone = manualPhone || (selected.celular ? toWaPhone(selected.celular) : '');
    if (!phone) return;
    setAutoSending(true);
    setAutoSendResult(null);
    setAutoSendError('');
    try {
      await whatsappApi.send(phone, buildMensaje(plantilla, selected));
      setAutoSendResult('success');
    } catch (err) {
      setAutoSendResult('error');
      setAutoSendError(err instanceof Error ? err.message : 'Error al enviar');
    } finally {
      setAutoSending(false);
      setTimeout(() => setAutoSendResult(null), 5000);
    }
  };

  const canSearch = departamento.trim() !== '' || municipio.trim() !== '';

  const prospectosFiltrados = filtrarPorVencimiento
    ? prospectos.filter(
        (p) => p.fecha_vencimiento !== null && p.dias_hasta_vencer !== null && p.dias_hasta_vencer <= diasHastaVencer
      )
    : prospectos;

  const enrichedCount = prospectos.filter((p) => p.fecha_vencimiento !== null).length;

  // ── Enriquecimiento por lotes ──────────────────────────────────────────────

  const doEnrich = useCallback(async (nits: string[], force = false) => {
    if (nits.length === 0) return;

    // Deduplicar NITs y construir entries con codigoHab como fallback de búsqueda
    const habMap = new Map(prospectos.map((p) => [p.nit, p.codigo_habilitacion]));
    const seenNits = new Set<string>();
    const uniqueEntries: Array<{ nit: string; codigoHab?: string }> = [];
    for (const nit of nits) {
      if (nit && !seenNits.has(nit)) {
        seenNits.add(nit);
        const hab = habMap.get(nit);
        uniqueEntries.push({ nit, codigoHab: hab || undefined });
      }
    }
    if (uniqueEntries.length === 0) return;

    enrichAbort.current = false;
    setEnrichStatus('running');
    setEnrichErrors([]);

    const BATCH = 10;
    const BATCH_TIMEOUT_MS = 90000;
    const INTER_BATCH_DELAY_MS = 1500;
    let done = 0;
    let exitosos = 0;
    const allErrors: RepsEnrichResult[] = [];

    setEnrichProgress({ done: 0, total: uniqueEntries.length, exitosos: 0 });

    for (let i = 0; i < uniqueEntries.length; i += BATCH) {
      if (enrichAbort.current) break;

      if (i > 0) await new Promise((r) => setTimeout(r, INTER_BATCH_DELAY_MS));

      const batch = uniqueEntries.slice(i, i + BATCH);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), BATCH_TIMEOUT_MS);
        const res = await repsApi.enrichLote(batch, controller.signal, force).finally(() => clearTimeout(timeoutId));
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

        setEnrichProgress({ done, total: uniqueEntries.length, exitosos });
        setEnrichErrors([...allErrors]);
      } catch {
        done += batch.length;
        setEnrichProgress({ done, total: uniqueEntries.length, exitosos });
      }
    }

    setEnrichStatus('done');
  }, []);

  // ── Búsqueda ──────────────────────────────────────────────────────────────

  const cargar = useCallback(async () => {
    if (!canSearch) return;
    setLoading(true);
    setError('');
    setSelected(null);
    setEnrichStatus('idle');
    setEnrichProgress({ done: 0, total: 0, exitosos: 0 });
    setEnrichErrors([]);
    let fetchedData: RepsProspecto[] = [];
    try {
      const res = await repsApi.getMercadoPotencial({
        departamento: departamento || undefined,
        municipio: municipio.trim().toUpperCase() || undefined,
        clase: clase || undefined,
        soloConCelular,
        limit: limitResultados,
      });
      fetchedData = res.data || [];
      setProspectos(fetchedData);
      setTotalEncontrados(res.total ?? fetchedData.length);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('jwt') || msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('401') || msg.toLowerCase().includes('unauthorized')) {
        setError('Sesión expirada — vuelve a iniciar sesión para consultar el REPS.');
      } else if (msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('abort') || msg.toLowerCase().includes('504') || msg.toLowerCase().includes('504')) {
        setError('La consulta tardó demasiado. Reduce el número de resultados o afina los filtros e intenta de nuevo.');
      } else {
        setError('No se pudo conectar con datos.gov.co. Verifica tu conexión e intenta de nuevo.');
      }
      setTotalEncontrados(null);
    } finally {
      setLoading(false);
    }
    // Auto-enrich: todos los registros sin fecha en caché
    if (fetchedData.length > 0) {
      await doEnrich(fetchedData.map((p) => p.nit).filter(Boolean));
    }
  }, [departamento, municipio, clase, soloConCelular, limitResultados, canSearch, doEnrich]);

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
    const mensaje = buildMensaje(plantilla, selected);
    window.open(`https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener,noreferrer');
  };

  const handleEnviarWhatsAppApp = () => {
    if (!selected) return;
    const phone = manualPhone || (selected.celular ? toWaPhone(selected.celular) : '');
    if (!phone) return;
    const mensaje = buildMensaje(plantilla, selected);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener,noreferrer');
  };

  const phoneValido = manualPhone.replace(/\D/g, '').length >= 10;

  // ── Tabla: sorting, paginación y exportación ─────────────────────────────

  const TABLE_PAGE_SIZE = 50;

  const prospectosSorted = [...prospectosFiltrados].sort((a, b) => {
    if (sortCol === 'dias') {
      const da = a.dias_hasta_vencer ?? 99999;
      const db = b.dias_hasta_vencer ?? 99999;
      return sortDir === 'asc' ? da - db : db - da;
    }
    if (sortCol === 'nombre') {
      return sortDir === 'asc'
        ? a.nombre_prestador.localeCompare(b.nombre_prestador, 'es')
        : b.nombre_prestador.localeCompare(a.nombre_prestador, 'es');
    }
    const ma = a.municipio, mb = b.municipio;
    return sortDir === 'asc' ? ma.localeCompare(mb, 'es') : mb.localeCompare(ma, 'es');
  });

  const totalTablePages = Math.ceil(prospectosSorted.length / TABLE_PAGE_SIZE);
  const prospectosPaged = prospectosSorted.slice(tablePage * TABLE_PAGE_SIZE, (tablePage + 1) * TABLE_PAGE_SIZE);

  const handleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortCol(col); setSortDir('asc'); }
    setTablePage(0);
  };

  const sortArrow = (col: typeof sortCol) =>
    sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕';

  const exportCSV = () => {
    const headers = ['Nombre', 'NIT', 'Municipio', 'Departamento', 'Clase', 'Celular', 'Teléfono', 'Email', 'Fecha Vencimiento', 'Días hasta vencer', 'Código Habilitación'];
    const rows = prospectosFiltrados.map((p) => [
      p.nombre_prestador, p.nit, p.municipio, p.departamento, p.clase_prestador,
      p.celular || '', p.telefono_raw || '', p.email || '',
      p.fecha_vencimiento || '',
      p.dias_hasta_vencer !== null ? String(p.dias_hasta_vencer) : '',
      p.codigo_habilitacion,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reps-${(departamento || 'todos').toLowerCase()}-${(municipio || 'todos').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Carga desde Alerta Automática ─────────────────────────────────────────

  const handleCargarAlerta = useCallback((providers: RepsProspecto[], diasFiltro: number) => {
    setProspectos(providers);
    setTotalEncontrados(providers.length);
    setFiltrarPorVencimiento(true);
    setDiasHastaVencer(diasFiltro);
    setError('');
    setSelected(null);
    setEnrichStatus('idle');
    setEnrichProgress({ done: 0, total: 0, exitosos: 0 });
    setViewMode('cards');
    // Precargar filtros visibles con los datos del trigger
    if (providers.length > 0) {
      const first = providers[0];
      if (first.departamento) setDepartamento(first.departamento);
      if (first.municipio) setMunicipio(first.municipio);
    }
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="wap-root">
      {/* Panel de alerta automática */}
      <RepsAlertTrigger onCargarAlerta={handleCargarAlerta} />

      {/* Header */}
      <div className="wap-header">
        <span className="wap-header-badge">
          <svg width="6" height="6" viewBox="0 0 6 6"><circle cx="3" cy="3" r="3" fill="#25d366"/></svg>
          WhatsApp · Prospección REPS
        </span>
        <h2>Prestadores habilitados — Prospección comercial</h2>
        <p>
          Busca prestadores del REPS nacional. Las fechas de vencimiento se cargan automáticamente
          para que puedas filtrar y contactar a quienes tienen habilitación próxima a vencer.
        </p>
      </div>

      {/* Barra de filtros */}
      <div className="wap-filters">
        <div className="wap-filter-group">
          <label>Departamento *</label>
          <select value={departamento} onChange={(e) => { setDepartamento(e.target.value); setMunicipio(''); }}>
            <option value="">— Selecciona departamento —</option>
            {DEPARTAMENTOS_COLOMBIA.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="wap-filter-group wap-filter-group--municipio">
          <label>Municipio (opcional)</label>
          <select
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
            disabled={!departamento}
          >
            <option value="">— Todos los municipios —</option>
            {(MUNICIPIOS_POR_DEPARTAMENTO[departamento] ?? []).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
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

        <div className="wap-filter-group wap-filter-group--limit">
          <label>Resultados</label>
          <select value={limitResultados} onChange={(e) => setLimitResultados(Number(e.target.value))}>
            <option value={100}>100 registros</option>
            <option value={250}>250 registros</option>
            <option value={500}>500 registros</option>
            <option value={1000}>1000 registros</option>
            <option value={2000}>2000 registros</option>
            <option value={3000}>3000 registros (máx.)</option>
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

      {/* Barra de fechas — aparece una vez hay resultados */}
      {prospectos.length > 0 && (
        <div className="wap-enrich-bar">
          <div className="wap-enrich-bar-left">
            <span className="wap-enrich-icon">
              {enrichStatus === 'running' ? <div className="wap-spinner-sm" /> : '📅'}
            </span>
            <div>
              <div className="wap-enrich-title">Fechas de vencimiento MINSALUD</div>
              <div className="wap-enrich-sub">
                {enrichStatus === 'running'
                  ? `Consultando MINSALUD… ${enrichProgress.done}/${enrichProgress.total}${enrichProgress.exitosos > 0 ? ` · ${enrichProgress.exitosos} con fecha` : ''}`
                  : enrichedCount === 0
                    ? 'Sin fechas disponibles en el portal MINSALUD'
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

            {enrichStatus === 'running' ? (
              <button
                className="wap-enrich-btn wap-enrich-btn--loading"
                onClick={() => { enrichAbort.current = true; }}
                title="Cancelar consulta"
              >
                Cancelar
              </button>
            ) : (
              <button
                className="wap-enrich-btn"
                onClick={() => doEnrich(
                  prospectos
                    .filter((p: RepsProspecto) => !p.fecha_vencimiento)
                    .map((p: RepsProspecto) => p.nit)
                    .filter(Boolean),
                  true
                )}
                title="Forzar consulta en MINSALUD — omite el cooldown y reintenta todos los pendientes"
              >
                🔄 Forzar actualización ({prospectos.filter((p: RepsProspecto) => !p.fecha_vencimiento).length} pendientes)
              </button>
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
                <>
                  {' '}· <strong>{enrichErrors.length}</strong> no tienen datos en el portal MINSALUD
                  {' '}— usa <strong>"📅 Fecha manual"</strong> en cada tarjeta para ingresarla
                  consultando{' '}
                  <a
                    href="https://prestadores.minsalud.gov.co/habilitacion/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    el portal oficial
                  </a>.
                </>
              )}
            </>
          ) : (
            <>
              ⚠️ El portal MINSALUD no encontró fechas para estos prestadores.
              {' '}Consulta manualmente en{' '}
              <a
                href="https://prestadores.minsalud.gov.co/habilitacion/"
                target="_blank"
                rel="noopener noreferrer"
              >
                prestadores.minsalud.gov.co
              </a>
              {' '}con el NIT de cada uno y usa <strong>"📅 Fecha manual"</strong> en cada tarjeta.
            </>
          )}
        </div>
      )}

      <div className={`wap-body${viewMode === 'table' ? ' wap-body--table' : ''}`}>
        {/* Panel izquierdo: lista */}
        <div className="wap-list-panel">
          <div className="wap-list-header">
            <div className="wap-list-header-left">
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

            {prospectosFiltrados.length > 0 && (
              <div className="wap-list-header-actions">
                <button
                  className={`wap-view-btn${viewMode === 'cards' ? ' wap-view-btn--active' : ''}`}
                  onClick={() => setViewMode('cards')}
                  title="Vista de tarjetas"
                >☰ Tarjetas</button>
                <button
                  className={`wap-view-btn${viewMode === 'table' ? ' wap-view-btn--active' : ''}`}
                  onClick={() => { setViewMode('table'); setTablePage(0); }}
                  title="Vista de tabla — recomendada para muchos registros"
                >⊞ Tabla</button>
                <button
                  className="wap-export-btn"
                  onClick={exportCSV}
                  title={`Exportar ${prospectosFiltrados.length} registros a CSV`}
                >⬇ CSV ({prospectosFiltrados.length})</button>
              </div>
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

          {/* ── Barra de selección múltiple ──────────────────────────── */}
          {!loading && !error && prospectosFiltrados.length > 0 && viewMode === 'cards' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: selectedIds.size > 0 ? '#f0fdf4' : '#f8fafc', border: '1px solid', borderColor: selectedIds.size > 0 ? '#86efac' : '#e2e8f0', borderRadius: 8, marginBottom: 6 }}>
              <input
                type="checkbox"
                checked={selectedIds.size > 0 && selectedIds.size === prospectosFiltrados.filter(p => p.celular).length}
                ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < prospectosFiltrados.filter(p => p.celular).length; }}
                onChange={toggleSelectAll}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#16a34a' }}
              />
              <span style={{ fontSize: 13, color: '#374151', flex: 1 }}>
                {selectedIds.size === 0
                  ? `${prospectosFiltrados.filter(p => p.celular).length} con celular — selecciona para envío masivo`
                  : `${selectedIds.size} seleccionado${selectedIds.size > 1 ? 's' : ''}`}
              </span>
              {selectedIds.size > 0 && (
                waStatus?.connected ? (
                  <button
                    onClick={handleEnviarMasivo}
                    disabled={bulkSending}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 6, background: '#16a34a', color: 'white', border: 'none', fontSize: 13, fontWeight: 700, cursor: bulkSending ? 'not-allowed' : 'pointer', opacity: bulkSending ? 0.7 : 1 }}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.552 4.12 1.518 5.851L.057 23.944l6.254-1.641A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.847 0-3.574-.487-5.063-1.337l-.363-.214-3.716.975.992-3.624-.237-.375A9.955 9.955 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                    {bulkSending ? `Enviando… ${bulkProgress?.done}/${bulkProgress?.total}` : `Enviar a ${selectedIds.size}`}
                  </button>
                ) : (
                  <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                    Conecta WhatsApp para enviar
                  </span>
                )
              )}
            </div>
          )}

          {!loading && !error && prospectosFiltrados.length > 0 && viewMode === 'cards' && (
            <ul className="wap-list">
              {prospectosFiltrados.map((p) => {
                const chip = chipParaClase(p.clase_prestador);
                const isActive = selected?.codigo_habilitacion === p.codigo_habilitacion && selected?.nit === p.nit;
                const isChecked = selectedIds.has(prospKey(p));
                const tieneVencimiento = p.fecha_vencimiento !== null;
                return (
                  <li
                    key={`${p.codigo_habilitacion}-${p.nit}`}
                    className={`wap-item ${isActive ? 'wap-item--active' : ''} ${isChecked ? 'wap-item--checked' : ''}`}
                    onClick={() => handleSelect(p)}
                  >
                    <div className="wap-item-top">
                      {p.celular && (
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onClick={(e) => toggleSelect(p, e)}
                          onChange={() => {}}
                          style={{ width: 15, height: 15, marginRight: 6, flexShrink: 0, accentColor: '#16a34a', cursor: 'pointer' }}
                        />
                      )}
                      <span className="wap-item-name">{p.nombre_prestador}</span>
                      <div className="wap-item-top-badges">
                        {tieneVencimiento ? (
                          <span className={`wap-venc-badge ${diasBadgeClass(p.dias_hasta_vencer)}`}>
                            ⏰ {p.dias_hasta_vencer !== null
                              ? (p.dias_hasta_vencer <= 0 ? 'Vencido' : `${p.dias_hasta_vencer}d`)
                              : formatFechaVenc(p.fecha_vencimiento)}
                          </span>
                        ) : (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              className="wap-venc-manual-btn"
                              onClick={(e) => { e.stopPropagation(); doEnrich([p.nit], true); }}
                              title={`Reintentar en MinSalud por NIT${p.codigo_habilitacion ? ' + hab code como fallback' : ''}`}
                              style={{ fontSize: '11px' }}
                            >
                              🔄
                            </button>
                            <button
                              className="wap-venc-manual-btn"
                              onClick={(e) => { e.stopPropagation(); abrirManual(p); }}
                              title="Ingresar fecha de vencimiento manualmente"
                            >
                              📅 Fecha manual
                            </button>
                          </div>
                        )}
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

          {/* ── Vista de tabla ───────────────────────────────────────── */}
          {!loading && !error && prospectosFiltrados.length > 0 && viewMode === 'table' && (
            <div className="wap-table-wrap">
              <table className="wap-table">
                <thead>
                  <tr>
                    <th className="wap-th wap-th-num">#</th>
                    <th className="wap-th wap-th-sort" onClick={() => handleSort('nombre')}>
                      Nombre{sortArrow('nombre')}
                    </th>
                    <th className="wap-th">NIT</th>
                    <th className="wap-th wap-th-sort" onClick={() => handleSort('municipio')}>
                      Municipio{sortArrow('municipio')}
                    </th>
                    <th className="wap-th">Clase</th>
                    <th className="wap-th">Celular</th>
                    <th className="wap-th">Fecha Vencimiento</th>
                    <th className="wap-th wap-th-sort" onClick={() => handleSort('dias')}>
                      Días{sortArrow('dias')}
                    </th>
                    <th className="wap-th">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {prospectosPaged.map((p, idx) => {
                    const rowNum = tablePage * TABLE_PAGE_SIZE + idx + 1;
                    const chip = chipParaClase(p.clase_prestador);
                    return (
                      <tr key={`${p.codigo_habilitacion}-${p.nit}`} className="wap-tr">
                        <td className="wap-td wap-td-num">{rowNum}</td>
                        <td className="wap-td wap-td-name" title={p.nombre_prestador}>{p.nombre_prestador}</td>
                        <td className="wap-td wap-td-mono">{p.nit}</td>
                        <td className="wap-td">{p.municipio}</td>
                        <td className="wap-td">
                          <span className={`wap-chip wap-chip--${chip.color}`}>{chip.label}</span>
                        </td>
                        <td className="wap-td wap-td-phone">
                          {p.celular
                            ? <span>📱 {p.celular}</span>
                            : p.telefono_raw
                              ? <span className="wap-no-phone">📞 {p.telefono_raw}</span>
                              : <span className="wap-no-phone">—</span>}
                        </td>
                        <td className="wap-td">
                          {p.fecha_vencimiento
                            ? <span>{formatFechaVenc(p.fecha_vencimiento)}</span>
                            : <span className="wap-no-phone">Sin fecha</span>}
                        </td>
                        <td className="wap-td">
                          {p.dias_hasta_vencer !== null
                            ? <span className={`wap-venc-badge ${diasBadgeClass(p.dias_hasta_vencer)}`}>
                                {p.dias_hasta_vencer <= 0 ? 'Vencido' : `${p.dias_hasta_vencer}d`}
                              </span>
                            : <span className="wap-no-phone">—</span>}
                        </td>
                        <td className="wap-td wap-td-actions">
                          {p.celular && (
                            <button
                              className="wap-table-wa-btn"
                              title="Preparar mensaje WhatsApp"
                              onClick={() => { handleSelect(p); setViewMode('cards'); }}
                            >💬</button>
                          )}
                          {!p.fecha_vencimiento && (
                            <button
                              className="wap-venc-manual-btn"
                              title="Ingresar fecha manualmente"
                              onClick={() => abrirManual(p)}
                            >📅</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {totalTablePages > 1 && (
                <div className="wap-pagination">
                  <button className="wap-page-btn" onClick={() => setTablePage(0)} disabled={tablePage === 0}>«</button>
                  <button className="wap-page-btn" onClick={() => setTablePage((p) => Math.max(0, p - 1))} disabled={tablePage === 0}>‹</button>
                  <span className="wap-page-info">
                    Página <strong>{tablePage + 1}</strong> de <strong>{totalTablePages}</strong>
                    <span className="wap-page-total"> · {prospectosFiltrados.length} registros totales</span>
                  </span>
                  <button className="wap-page-btn" onClick={() => setTablePage((p) => Math.min(totalTablePages - 1, p + 1))} disabled={tablePage === totalTablePages - 1}>›</button>
                  <button className="wap-page-btn" onClick={() => setTablePage(totalTablePages - 1)} disabled={tablePage === totalTablePages - 1}>»</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel derecho: compositor — oculto en vista tabla */}
        <div className={`wap-composer${viewMode === 'table' ? ' wap-composer--hidden' : ''}`}>
          {!selected ? (
            <div className="wap-composer-empty">
              <div className="wap-composer-empty-icon">💬</div>
              <p>Selecciona un prestador de la lista para preparar el mensaje de contacto</p>
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

              {/* Badge de estado Evolution API */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                {waStatusLoading ? (
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Verificando conexión…</span>
                ) : waStatus?.connected ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: '#16a34a' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                    WhatsApp conectado — envío automático disponible
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: '#dc2626' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
                    WhatsApp desconectado
                    {canConfigureWa && (
                      <button
                        onClick={loadQR}
                        disabled={waQRLoading}
                        style={{ marginLeft: 6, fontSize: '11px', padding: '2px 8px', borderRadius: 4, border: '1px solid #dc2626', background: 'transparent', color: '#dc2626', cursor: 'pointer' }}
                      >
                        {waQRLoading ? 'Cargando…' : 'Configurar'}
                      </button>
                    )}
                    <button onClick={refreshStatus} style={{ marginLeft: 4, fontSize: '11px', padding: '2px 6px', borderRadius: 4, border: '1px solid #9ca3af', background: 'transparent', color: '#6b7280', cursor: 'pointer' }}>↻</button>
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>

                {/* Botón de envío automático (solo si WhatsApp conectado) */}
                {waStatus?.connected && (
                  <>
                    <button
                      onClick={handleEnviarAutomatico}
                      disabled={!phoneValido || autoSending}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        padding: '12px 18px', borderRadius: '8px', fontSize: '15px', fontWeight: 700,
                        cursor: phoneValido && !autoSending ? 'pointer' : 'not-allowed',
                        background: autoSendResult === 'success' ? '#16a34a' : autoSendResult === 'error' ? '#dc2626' : '#16a34a',
                        color: 'white', border: 'none', transition: 'all 0.2s',
                        opacity: !phoneValido || autoSending ? 0.6 : 1,
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.552 4.12 1.518 5.851L.057 23.944l6.254-1.641A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.847 0-3.574-.487-5.063-1.337l-.363-.214-3.716.975.992-3.624-.237-.375A9.955 9.955 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                      </svg>
                      {autoSending ? 'Enviando…' : autoSendResult === 'success' ? '✅ Enviado correctamente' : autoSendResult === 'error' ? '❌ Error al enviar' : 'Enviar automáticamente'}
                    </button>
                    {autoSendResult === 'error' && autoSendError && (
                      <div style={{ padding: '8px 12px', borderRadius: 6, background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '13px' }}>
                        {autoSendError}
                      </div>
                    )}
                  </>
                )}

                {/* Botones de apertura manual (siempre disponibles como alternativa) */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="wap-send-btn"
                    onClick={handleEnviarWhatsAppApp}
                    disabled={!phoneValido}
                    style={{ flex: 1, opacity: waStatus?.connected ? 0.8 : 1, background: '#25d366', color: 'white' }}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.552 4.12 1.518 5.851L.057 23.944l6.254-1.641A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.847 0-3.574-.487-5.063-1.337l-.363-.214-3.716.975.992-3.624-.237-.375A9.955 9.955 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                    </svg>
                    App / Móvil
                  </button>
                  <button
                    className="wap-send-btn"
                    onClick={handleEnviarWhatsApp}
                    disabled={!phoneValido}
                    style={{ flex: 1, opacity: waStatus?.connected ? 0.8 : 1 }}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.552 4.12 1.518 5.851L.057 23.944l6.254-1.641A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.847 0-3.574-.487-5.063-1.337l-.363-.214-3.716.975.992-3.624-.237-.375A9.955 9.955 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                    </svg>
                    WhatsApp Web
                  </button>
                </div>
              </div>
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

      {/* Overlay de progreso — envío masivo */}
      {bulkSending && bulkProgress && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 12, padding: '28px 32px', maxWidth: 360, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📤</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>Enviando mensajes</h3>
            <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: 14 }}>3 segundos entre cada envío para evitar bloqueos</p>
            <div style={{ background: '#f3f4f6', borderRadius: 8, height: 10, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ background: '#16a34a', height: '100%', width: `${Math.round((bulkProgress.done / bulkProgress.total) * 100)}%`, transition: 'width 0.4s ease' }} />
            </div>
            <p style={{ margin: '0 0 16px', fontWeight: 700, fontSize: 16 }}>
              {bulkProgress.done} / {bulkProgress.total} enviados
              {bulkProgress.errors > 0 && <span style={{ color: '#dc2626', fontWeight: 400, fontSize: 13 }}> · {bulkProgress.errors} error{bulkProgress.errors > 1 ? 'es' : ''}</span>}
            </p>
            <button
              onClick={() => { bulkAbort.current = true; }}
              style={{ padding: '8px 20px', borderRadius: 6, background: '#f3f4f6', border: '1px solid #d1d5db', fontSize: 13, cursor: 'pointer', color: '#374151' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal QR — configuración inicial (auditor y super_admin) */}
      {waQRModal && canConfigureWa && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'white', borderRadius: 12, padding: '28px 32px', maxWidth: 380, width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center',
          }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700 }}>Conectar WhatsApp</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6b7280' }}>
              Escanea este código con la app de WhatsApp en tu teléfono.<br />
              <strong>WhatsApp → Dispositivos vinculados → Vincular dispositivo</strong>
            </p>

            {waQRError ? (
              <div style={{ width: 240, height: 'auto', minHeight: 120, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '20px 16px' }}>
                <span style={{ fontSize: 28 }}>⚠️</span>
                <span style={{ color: '#991b1b', fontSize: 12, textAlign: 'center', wordBreak: 'break-word' }}>{waQRError}</span>
                <button
                  onClick={loadQR}
                  style={{ marginTop: 8, padding: '6px 14px', borderRadius: 6, border: '1px solid #dc2626', background: '#dc2626', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}
                >
                  Reintentar
                </button>
              </div>
            ) : waQR?.qrcode ? (
              <img
                src={waQR.qrcode.startsWith('data:') ? waQR.qrcode : `data:image/png;base64,${waQR.qrcode}`}
                alt="QR WhatsApp"
                style={{ width: 240, height: 240, borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
            ) : (
              <div style={{ width: 240, height: 240, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', borderRadius: 8 }}>
                <span style={{ color: '#6b7280', fontSize: 13 }}>Generando QR…</span>
              </div>
            )}

            <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={refreshStatus}
                style={{ padding: '8px 18px', borderRadius: 6, border: '1px solid #16a34a', background: '#16a34a', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
              >
                Ya escaneé — verificar
              </button>
              <button
                onClick={() => { setWaQRModal(false); setWaQRError(''); }}
                style={{ padding: '8px 18px', borderRadius: 6, border: '1px solid #d1d5db', background: 'transparent', color: '#374151', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
              >
                Cerrar
              </button>
            </div>

            <p style={{ marginTop: 14, fontSize: 11, color: '#9ca3af' }}>
              El QR expira en ~30 segundos. Si vence, cierra y vuelve a abrir.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

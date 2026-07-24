/**
 * AnexoCuatroPage — Verificación Estándar de Historia Clínica y Registros Asistenciales
 * Formulario Anexo N° 4 (Res. 1439/2002 + 3100/2019)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { anexo4Api, Anexo4Verificacion, HCRegistro, EstadoCriterio, downloadBlob } from '../services/api';
import { DeleteConfirmationModal } from '../components/Assessment/DeleteConfirmationModal';
import { formatDateLong } from '@/utils/dateFormat';
import './AnexoCuatroPage.css';

// ─── Criterios ────────────────────────────────────────────────────────────────
const CRITERIOS = [
  { key: 'nombres_apellidos',      label: 'Nombres y apellidos completos' },
  { key: 'estado_civil',           label: 'Estado Civil' },
  { key: 'documento_identidad',    label: 'Documento de Identidad' },
  { key: 'fecha_nacimiento',       label: 'Fecha de Nacimiento' },
  { key: 'edad',                   label: 'Edad' },
  { key: 'sexo',                   label: 'Sexo' },
  { key: 'ocupacion',              label: 'Ocupación' },
  { key: 'direccion_domicilio',    label: 'Dirección del Domicilio' },
  { key: 'telefono_domicilio',     label: 'Teléfono del Domicilio' },
  { key: 'lugar_residencia',       label: 'Lugar de Residencia' },
  { key: 'nombre_acompanante',     label: 'Nombre del Acompañante' },
  { key: 'telefono_acompanante',   label: 'Teléfono del Acompañante' },
  { key: 'nombre_responsable',     label: 'Nombre de la Persona Responsable' },
  { key: 'telefono_responsable',   label: 'Teléfono de la Persona Responsable' },
  { key: 'parentesco_responsable', label: 'Parentesco de la Persona Responsable' },
  { key: 'aseguradora',            label: 'Aseguradora' },
  { key: 'tipo_vinculacion',       label: 'Tipo de Vinculación' },
  { key: 'consentimiento_informado', label: 'Consentimiento Informado' },
  { key: 'anexos',                 label: 'Anexos' },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function emptyRegistro(n: number): HCRegistro {
  const criterios: Record<string, EstadoCriterio> = {};
  CRITERIOS.forEach(c => { criterios[c.key] = null; });
  return { numero_hc: String(n), nombre_usuario: '', criterios };
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Componente principal ─────────────────────────────────────────────────────
export const AnexoCuatroPage: React.FC = () => {
  const [lista, setLista]           = useState<Anexo4Verificacion[]>([]);
  const [loadingLista, setLoadingLista] = useState(true);
  const [vista, setVista]           = useState<'lista' | 'form'>('lista');
  const [editId, setEditId]         = useState<string | null>(null);

  // Form state
  const [servicio, setServicio]     = useState('');
  const [fecha, setFecha]           = useState(todayIso());
  const [registros, setRegistros]   = useState<HCRegistro[]>([emptyRegistro(1)]);
  const [observaciones, setObs]     = useState('');
  const [saving, setSaving]         = useState(false);
  const [savingPdf, setSavingPdf]   = useState<string | null>(null);
  const [savingDoc, setSavingDoc]   = useState<string | null>(null);
  const [errorMsg, setErrorMsg]     = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Anexo4Verificacion | null>(null);
  const [deleting, setDeleting]     = useState(false);

  // ── Cargar lista ─────────────────────────────────────────────────────────
  const loadLista = useCallback(async () => {
    setLoadingLista(true);
    try {
      const res = await anexo4Api.list();
      setLista(res.data);
    } catch {
      // silencioso
    } finally {
      setLoadingLista(false);
    }
  }, []);

  useEffect(() => { loadLista(); }, [loadLista]);

  // ── Abrir formulario nuevo ────────────────────────────────────────────────
  const handleNuevo = () => {
    setEditId(null);
    setServicio('');
    setFecha(todayIso());
    setRegistros([emptyRegistro(1)]);
    setObs('');
    setErrorMsg('');
    setSuccessMsg('');
    setVista('form');
  };

  // ── Abrir formulario edición ──────────────────────────────────────────────
  const handleEditar = async (id: string) => {
    try {
      const res = await anexo4Api.getById(id);
      const v = res.data;
      setEditId(id);
      setServicio(v.servicio);
      setFecha(v.fecha.substring(0, 10));
      setRegistros(v.registros.length ? v.registros : [emptyRegistro(1)]);
      setObs(v.observaciones ?? '');
      setErrorMsg('');
      setSuccessMsg('');
      setVista('form');
    } catch {
      setErrorMsg('No se pudo cargar la verificación');
    }
  };

  // ── Eliminar ──────────────────────────────────────────────────────────────
  const handleConfirmarEliminar = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await anexo4Api.delete(deleteTarget.id);
      setDeleteTarget(null);
      await loadLista();
    } catch {
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  // ── Descargar PDF ─────────────────────────────────────────────────────────
  const handlePdf = async (v: Anexo4Verificacion) => {
    setSavingPdf(v.id);
    try {
      const blob = await anexo4Api.downloadPdf(v.id);
      const fname = `Anexo4-HC-${v.fecha}-${v.servicio.replace(/\s+/g, '_').substring(0, 25)}.pdf`;
      downloadBlob(blob, fname);
    } catch {
      alert('Error al generar el PDF');
    } finally {
      setSavingPdf(null);
    }
  };

  // ── Guardar PDF en documentos del prestador ──────────────────────────────
  const handleSaveDoc = async (v: Anexo4Verificacion) => {
    setSavingDoc(v.id);
    try {
      await anexo4Api.saveToDocuments(v.id, '');
      setSuccessMsg('PDF guardado en documentos del prestador');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      alert('Error al guardar el PDF como documento del prestador');
    } finally {
      setSavingDoc(null);
    }
  };

  // ── Guardar ───────────────────────────────────────────────────────────────
  const handleGuardar = async () => {
    setErrorMsg('');
    if (!servicio.trim()) { setErrorMsg('El servicio es requerido'); return; }
    if (!fecha)            { setErrorMsg('La fecha es requerida');    return; }

    setSaving(true);
    try {
      const body = {
        servicio: servicio.trim(),
        fecha,
        registros,
        observaciones: observaciones.trim() || undefined,
      };

      if (editId) {
        await anexo4Api.update(editId, body);
      } else {
        await anexo4Api.create(body);
      }

      setSuccessMsg('Verificación guardada correctamente');
      await loadLista();
      setTimeout(() => { setSuccessMsg(''); setVista('lista'); }, 1800);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // ── Gestión de H.C. ───────────────────────────────────────────────────────
  const addHC = () => {
    if (registros.length >= 10) return;
    setRegistros(prev => [...prev, emptyRegistro(prev.length + 1)]);
  };

  const removeHC = (idx: number) => {
    setRegistros(prev => prev.filter((_, i) => i !== idx));
  };

  const updateHCField = (idx: number, field: 'numero_hc' | 'nombre_usuario', val: string) => {
    setRegistros(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  };

  const _toggleCriterio = (hcIdx: number, key: string) => {
    setRegistros(prev => prev.map((r, i) => {
      if (i !== hcIdx) return r;
      const cur = r.criterios[key];
      const next: EstadoCriterio = cur === null ? 'C' : cur === 'C' ? 'NC' : null;
      return { ...r, criterios: { ...r.criterios, [key]: next } };
    }));
  };

  const setCriterio = (hcIdx: number, key: string, val: EstadoCriterio) => {
    setRegistros(prev => prev.map((r, i) => {
      if (i !== hcIdx) return r;
      const cur = r.criterios[key];
      // Si ya está seleccionado, deselecciona; si no, selecciona
      const next: EstadoCriterio = cur === val ? null : val;
      return { ...r, criterios: { ...r.criterios, [key]: next } };
    }));
  };

  // ── Resumen de cumplimiento ───────────────────────────────────────────────
  const totalCeldas = CRITERIOS.length * registros.length;
  const totalC  = registros.reduce((acc, r) => acc + CRITERIOS.filter(c => r.criterios[c.key] === 'C').length, 0);
  const totalNC = registros.reduce((acc, r) => acc + CRITERIOS.filter(c => r.criterios[c.key] === 'NC').length, 0);
  const pct = totalCeldas > 0 ? Math.round((totalC / totalCeldas) * 100) : 0;

  // ─────────────────────────────────────────────────────────────────────────
  // VISTA: LISTA
  // ─────────────────────────────────────────────────────────────────────────
  if (vista === 'lista') {
    return (
      <div className="a4-page">
        <div className="a4-top">
          <div>
            <h1 className="a4-title">Verificación de Historia Clínica</h1>
            <p className="a4-sub">Anexo N° 4 — Verificación Estándar TSHCR</p>
          </div>
          <button className="a4-btn a4-btn--primary" onClick={handleNuevo}>
            + Nueva verificación
          </button>
        </div>

        {deleteTarget && (
        <DeleteConfirmationModal
          title="Eliminar verificación"
          message="¿Estás seguro de que deseas eliminar esta verificación de historia clínica?"
          itemName={`${deleteTarget.servicio} — ${String(deleteTarget.fecha).substring(0, 10)}`}
          isLoading={deleting}
          onConfirm={handleConfirmarEliminar}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {loadingLista ? (
          <div className="a4-loading">Cargando...</div>
        ) : lista.length === 0 ? (
          <div className="a4-empty">
            <span className="a4-empty-icon">📋</span>
            <p>No hay verificaciones registradas aún.</p>
            <button className="a4-btn a4-btn--primary" onClick={handleNuevo}>
              Crear primera verificación
            </button>
          </div>
        ) : (
          <div className="a4-list">
            {lista.map(v => {
              const totalV  = CRITERIOS.length * v.registros.length;
              const conformV = v.registros.reduce((a, r) =>
                a + CRITERIOS.filter(c => r.criterios[c.key] === 'C').length, 0);
              const pctV = totalV > 0 ? Math.round((conformV / totalV) * 100) : 0;
              const semaforo = pctV >= 80 ? 'verde' : pctV >= 50 ? 'naranja' : 'rojo';

              return (
                <div key={v.id} className="a4-card">
                  <div className="a4-card-left">
                    <span className={`a4-semaforo a4-semaforo--${semaforo}`} />
                    <div>
                      <div className="a4-card-servicio">{v.servicio}</div>
                      <div className="a4-card-meta">
                        {(() => {
                          const [y2, m, d] = String(v.fecha).substring(0, 10).split('-');
                          return formatDateLong(new Date(Number(y2), Number(m) - 1, Number(d)).toISOString());
                        })()}
                        {' · '}
                        {v.registros.length} H.C.
                        {' · '}
                        {pctV}% conformidad
                        {v.auditor_nombre && <> · {v.auditor_nombre}</>}
                      </div>
                    </div>
                  </div>
                  <div className="a4-card-actions">
                    <button
                      className="a4-btn a4-btn--ghost"
                      onClick={() => handlePdf(v)}
                      disabled={savingPdf === v.id}
                      title="Descargar PDF"
                    >
                      {savingPdf === v.id ? '...' : '⬇ PDF'}
                    </button>
                    <button
                      className="a4-btn a4-btn--ghost"
                      onClick={() => handleSaveDoc(v)}
                      disabled={savingDoc === v.id}
                      title="Guardar en documentos del prestador"
                    >
                      {savingDoc === v.id ? '...' : '📁 Guardar'}
                    </button>
                    <button
                      className="a4-btn a4-btn--ghost"
                      onClick={() => handleEditar(v.id)}
                    >
                      ✏ Editar
                    </button>
                    <button
                      className="a4-btn a4-btn--danger-ghost"
                      onClick={() => setDeleteTarget(v)}
                    >
                      🗑
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

  // ─────────────────────────────────────────────────────────────────────────
  // VISTA: FORMULARIO
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="a4-page">
      {/* Cabecera del formulario */}
      <div className="a4-top">
        <div>
          <button className="a4-back" onClick={() => setVista('lista')}>← Volver</button>
          <h1 className="a4-title">
            {editId ? 'Editar verificación' : 'Nueva verificación'} — Anexo N° 4
          </h1>
          <p className="a4-sub">VERIFICACIÓN ESTÁNDAR DE HISTORIA CLÍNICA Y REGISTROS ASISTENCIALES</p>
        </div>
      </div>

      {errorMsg   && <div className="a4-msg a4-msg--error">⚠ {errorMsg}</div>}
      {successMsg && <div className="a4-msg a4-msg--ok">✓ {successMsg}</div>}

      {/* Campos principales */}
      <div className="a4-header-fields">
        <div className="a4-field">
          <label>Servicio *</label>
          <input
            type="text"
            value={servicio}
            onChange={e => setServicio(e.target.value)}
            placeholder="Ej: Consulta Externa, Urgencias, Hospitalización..."
          />
        </div>
        <div className="a4-field a4-field--sm">
          <label>Fecha *</label>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
        </div>
      </div>

      {/* Resumen de cumplimiento */}
      {registros.some(r => Object.values(r.criterios).some(v => v !== null)) && (
        <div className="a4-resumen">
          <span className="a4-resumen-item a4-resumen-c">✓ {totalC} conformes</span>
          <span className="a4-resumen-item a4-resumen-nc">✗ {totalNC} no conformes</span>
          <span className="a4-resumen-item">⊘ {totalCeldas - totalC - totalNC} sin evaluar</span>
          <span className={`a4-resumen-pct a4-resumen-pct--${pct >= 80 ? 'verde' : pct >= 50 ? 'naranja' : 'rojo'}`}>
            {pct}% cumplimiento
          </span>
        </div>
      )}

      {/* Tabla principal */}
      <div className="a4-table-wrapper">
        <table className="a4-table">
          <thead>
            {/* Fila 1: CRITERIOS + N° H.C. */}
            <tr>
              <th className="a4-th-crit" rowSpan={3}>
                CONTENIDOS MÍNIMOS DE IDENTIFICACIÓN
              </th>
              {registros.map((_, i) => (
                <th key={i} colSpan={2} className="a4-th-hc">
                  <div className="a4-hc-header">
                    <span className="a4-hc-num">H.C. #{i + 1}</span>
                    {registros.length > 1 && (
                      <button
                        className="a4-hc-remove"
                        onClick={() => removeHC(i)}
                        title="Eliminar esta H.C."
                      >×</button>
                    )}
                  </div>
                </th>
              ))}
              {registros.length < 10 && (
                <th className="a4-th-add">
                  <button className="a4-btn-add-hc" onClick={addHC} title="Agregar H.C.">
                    +
                  </button>
                </th>
              )}
            </tr>
            {/* Fila 2: Número y nombre por HC */}
            <tr>
              {registros.map((reg, i) => (
                <th key={i} colSpan={2} className="a4-th-inputs">
                  <input
                    className="a4-input-hc"
                    placeholder="N° H.C."
                    value={reg.numero_hc}
                    onChange={e => updateHCField(i, 'numero_hc', e.target.value)}
                  />
                  <input
                    className="a4-input-hc"
                    placeholder="Nombre del usuario"
                    value={reg.nombre_usuario}
                    onChange={e => updateHCField(i, 'nombre_usuario', e.target.value)}
                  />
                </th>
              ))}
              {registros.length < 10 && <th />}
            </tr>
            {/* Fila 3: C / NC por HC */}
            <tr className="a4-tr-cnc">
              {registros.map((_, i) => (
                <React.Fragment key={i}>
                  <th className="a4-th-c">C</th>
                  <th className="a4-th-nc">NC</th>
                </React.Fragment>
              ))}
              {registros.length < 10 && <th />}
            </tr>
          </thead>

          <tbody>
            {CRITERIOS.map((crit, ci) => (
              <tr key={crit.key} className={ci % 2 === 0 ? '' : 'a4-tr-alt'}>
                <td className="a4-td-crit">{crit.label}</td>
                {registros.map((reg, hi) => {
                  const val = reg.criterios[crit.key] ?? null;
                  return (
                    <React.Fragment key={hi}>
                      <td
                        className={`a4-td-toggle a4-td-c${val === 'C' ? ' a4-td--active-c' : ''}`}
                        onClick={() => setCriterio(hi, crit.key, 'C')}
                        title="Marcar como Conforme"
                      >
                        {val === 'C' && <span className="a4-check">✓</span>}
                      </td>
                      <td
                        className={`a4-td-toggle a4-td-nc${val === 'NC' ? ' a4-td--active-nc' : ''}`}
                        onClick={() => setCriterio(hi, crit.key, 'NC')}
                        title="Marcar como No Conforme"
                      >
                        {val === 'NC' && <span className="a4-cross">✗</span>}
                      </td>
                    </React.Fragment>
                  );
                })}
                {registros.length < 10 && <td />}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Observaciones */}
      <div className="a4-obs">
        <label>Observaciones</label>
        <textarea
          rows={3}
          value={observaciones}
          onChange={e => setObs(e.target.value)}
          placeholder="Anotaciones adicionales del auditor..."
        />
      </div>

      {/* Acciones */}
      <div className="a4-form-actions">
        <button className="a4-btn a4-btn--ghost" onClick={() => setVista('lista')}>
          Cancelar
        </button>
        <button
          className="a4-btn a4-btn--primary"
          onClick={handleGuardar}
          disabled={saving}
        >
          {saving ? 'Guardando...' : editId ? 'Actualizar' : 'Guardar verificación'}
        </button>
      </div>

      {/* Leyenda */}
      <div className="a4-legend">
        <span className="a4-legend-c">■ C = Conforme</span>
        <span className="a4-legend-nc">■ NC = No Conforme</span>
        <span>Clic en una celda para marcarla; clic de nuevo para desmarcar</span>
      </div>
    </div>
  );
};

/**
 * AnexoCuatroEmbed — Formulario Anexo N° 4 embebido dentro de una auditoría.
 * Recibe el ID de la verificación existente, permite editarla y descargar el PDF.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { anexo4Api, type Anexo4Verificacion, type HCRegistro, type EstadoCriterio, downloadBlob } from '../../services/api';
import '../../pages/AnexoCuatroPage.css';

const CRITERIOS = [
  { key: 'nombres_apellidos',        label: 'Nombres y apellidos completos' },
  { key: 'estado_civil',             label: 'Estado Civil' },
  { key: 'documento_identidad',      label: 'Documento de Identidad' },
  { key: 'fecha_nacimiento',         label: 'Fecha de Nacimiento' },
  { key: 'edad',                     label: 'Edad' },
  { key: 'sexo',                     label: 'Sexo' },
  { key: 'ocupacion',                label: 'Ocupación' },
  { key: 'direccion_domicilio',      label: 'Dirección del Domicilio' },
  { key: 'telefono_domicilio',       label: 'Teléfono del Domicilio' },
  { key: 'lugar_residencia',         label: 'Lugar de Residencia' },
  { key: 'nombre_acompanante',       label: 'Nombre del Acompañante' },
  { key: 'telefono_acompanante',     label: 'Teléfono del Acompañante' },
  { key: 'nombre_responsable',       label: 'Nombre de la Persona Responsable' },
  { key: 'telefono_responsable',     label: 'Teléfono de la Persona Responsable' },
  { key: 'parentesco_responsable',   label: 'Parentesco de la Persona Responsable' },
  { key: 'aseguradora',              label: 'Aseguradora' },
  { key: 'tipo_vinculacion',         label: 'Tipo de Vinculación' },
  { key: 'consentimiento_informado', label: 'Consentimiento Informado' },
  { key: 'anexos',                   label: 'Anexos' },
] as const;

function emptyRegistro(n: number): HCRegistro {
  const criterios: Record<string, EstadoCriterio> = {};
  CRITERIOS.forEach(c => { criterios[c.key] = null; });
  return { numero_hc: String(n), nombre_usuario: '', criterios };
}

interface Props {
  verificacionId: string;
  readOnly?: boolean;
  onUpdated?: (v: Anexo4Verificacion) => void;
}

export const AnexoCuatroEmbed: React.FC<Props> = ({ verificacionId, readOnly = false, onUpdated }) => {
  const [servicio, setServicio]   = useState('');
  const [fecha, setFecha]         = useState('');
  const [registros, setRegistros] = useState<HCRegistro[]>([emptyRegistro(1)]);
  const [observaciones, setObs]   = useState('');
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [errorMsg, setErrorMsg]   = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await anexo4Api.getById(verificacionId);
      const v = res.data;
      setServicio(v.servicio);
      setFecha(String(v.fecha).substring(0, 10));
      setRegistros(v.registros.length ? v.registros : [emptyRegistro(1)]);
      setObs(v.observaciones ?? '');
    } catch {
      setErrorMsg('No se pudo cargar la verificación de Historia Clínica.');
    } finally {
      setLoading(false);
    }
  }, [verificacionId]);

  useEffect(() => { load(); }, [load]);

  const handleGuardar = async () => {
    setErrorMsg('');
    if (!servicio.trim()) { setErrorMsg('El nombre del servicio es requerido'); return; }
    setSaving(true);
    try {
      const res = await anexo4Api.update(verificacionId, {
        servicio: servicio.trim(),
        fecha,
        registros,
        observaciones: observaciones.trim() || undefined,
      });
      setSuccessMsg('Verificación guardada correctamente');
      onUpdated?.(res.data);
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      const blob = await anexo4Api.downloadPdf(verificacionId);
      const fname = `Anexo4-HC-${fecha}-${servicio.replace(/\s+/g, '_').substring(0, 25)}.pdf`;
      downloadBlob(blob, fname);
    } catch {
      setErrorMsg('Error al generar el PDF');
    } finally {
      setPdfLoading(false);
    }
  };

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

  const setCriterio = (hcIdx: number, key: string, val: EstadoCriterio) => {
    setRegistros(prev => prev.map((r, i) => {
      if (i !== hcIdx) return r;
      const next: EstadoCriterio = r.criterios[key] === val ? null : val;
      return { ...r, criterios: { ...r.criterios, [key]: next } };
    }));
  };

  const totalCeldas = CRITERIOS.length * registros.length;
  const totalC  = registros.reduce((acc, r) => acc + CRITERIOS.filter(c => r.criterios[c.key] === 'C').length, 0);
  const totalNC = registros.reduce((acc, r) => acc + CRITERIOS.filter(c => r.criterios[c.key] === 'NC').length, 0);
  const pct = totalCeldas > 0 ? Math.round((totalC / totalCeldas) * 100) : 0;

  if (loading) {
    return <div className="a4-loading">Cargando verificación H.C.…</div>;
  }

  return (
    <div className="a4-page" style={{ padding: '0' }}>
      {errorMsg   && <div className="a4-msg a4-msg--error">⚠ {errorMsg}</div>}
      {successMsg && <div className="a4-msg a4-msg--ok">✓ {successMsg}</div>}

      {/* Subtítulo */}
      <p className="a4-sub" style={{ marginBottom: '16px' }}>
        VERIFICACIÓN ESTÁNDAR DE HISTORIA CLÍNICA Y REGISTROS ASISTENCIALES — ANEXO N° 4
      </p>

      {/* Botón PDF arriba a la derecha */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px', gap: '8px' }}>
        <button
          className="a4-btn a4-btn--ghost"
          onClick={handlePdf}
          disabled={pdfLoading}
          title="Descargar PDF del Anexo 4"
        >
          {pdfLoading ? 'Generando…' : '⬇ Descargar PDF'}
        </button>
        {!readOnly && (
          <button
            className="a4-btn a4-btn--primary"
            onClick={handleGuardar}
            disabled={saving}
          >
            {saving ? 'Guardando…' : '💾 Guardar'}
          </button>
        )}
      </div>

      {/* Campos cabecera */}
      <div className="a4-header-fields">
        <div className="a4-field">
          <label>Servicio *</label>
          <input
            type="text"
            value={servicio}
            onChange={e => setServicio(e.target.value)}
            placeholder="Ej: Consulta Externa, Urgencias, Hospitalización..."
            disabled={readOnly}
          />
        </div>
        <div className="a4-field a4-field--sm">
          <label>Fecha *</label>
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            disabled={readOnly}
          />
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

      {/* Tabla */}
      <div className="a4-table-wrapper">
        <table className="a4-table">
          <thead>
            <tr>
              <th className="a4-th-crit" rowSpan={3}>
                CONTENIDOS MÍNIMOS DE IDENTIFICACIÓN
              </th>
              {registros.map((_, i) => (
                <th key={i} colSpan={2} className="a4-th-hc">
                  <div className="a4-hc-header">
                    <span className="a4-hc-num">H.C. #{i + 1}</span>
                    {!readOnly && registros.length > 1 && (
                      <button className="a4-hc-remove" onClick={() => removeHC(i)} title="Eliminar">×</button>
                    )}
                  </div>
                </th>
              ))}
              {!readOnly && registros.length < 10 && (
                <th className="a4-th-add">
                  <button className="a4-btn-add-hc" onClick={addHC} title="Agregar H.C.">+</button>
                </th>
              )}
            </tr>
            <tr>
              {registros.map((reg, i) => (
                <th key={i} colSpan={2} className="a4-th-inputs">
                  <input
                    className="a4-input-hc"
                    placeholder="N° H.C."
                    value={reg.numero_hc}
                    onChange={e => updateHCField(i, 'numero_hc', e.target.value)}
                    disabled={readOnly}
                  />
                  <input
                    className="a4-input-hc"
                    placeholder="Nombre del usuario"
                    value={reg.nombre_usuario}
                    onChange={e => updateHCField(i, 'nombre_usuario', e.target.value)}
                    disabled={readOnly}
                  />
                </th>
              ))}
              {!readOnly && registros.length < 10 && <th />}
            </tr>
            <tr className="a4-tr-cnc">
              {registros.map((_, i) => (
                <React.Fragment key={i}>
                  <th className="a4-th-c">C</th>
                  <th className="a4-th-nc">NC</th>
                </React.Fragment>
              ))}
              {!readOnly && registros.length < 10 && <th />}
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
                        onClick={() => !readOnly && setCriterio(hi, crit.key, 'C')}
                        style={{ cursor: readOnly ? 'default' : 'pointer' }}
                        title={readOnly ? undefined : 'Marcar como Conforme'}
                      >
                        {val === 'C' && <span className="a4-check">✓</span>}
                      </td>
                      <td
                        className={`a4-td-toggle a4-td-nc${val === 'NC' ? ' a4-td--active-nc' : ''}`}
                        onClick={() => !readOnly && setCriterio(hi, crit.key, 'NC')}
                        style={{ cursor: readOnly ? 'default' : 'pointer' }}
                        title={readOnly ? undefined : 'Marcar como No Conforme'}
                      >
                        {val === 'NC' && <span className="a4-cross">✗</span>}
                      </td>
                    </React.Fragment>
                  );
                })}
                {!readOnly && registros.length < 10 && <td />}
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
          disabled={readOnly}
        />
      </div>

      {/* Leyenda */}
      {!readOnly && (
        <div className="a4-legend">
          <span className="a4-legend-c">■ C = Conforme</span>
          <span className="a4-legend-nc">■ NC = No Conforme</span>
          <span>Clic en una celda para marcarla; clic de nuevo para desmarcar</span>
        </div>
      )}
    </div>
  );
};

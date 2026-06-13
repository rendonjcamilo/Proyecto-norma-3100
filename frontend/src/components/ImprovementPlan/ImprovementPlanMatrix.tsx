import React, { useEffect, useState, useCallback, useRef } from 'react';
import { improvementPlanApi, ImprovementPlanItem } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './ImprovementPlanMatrix.css';

interface Props {
  assessmentId: string;
  assessmentStatus: string;
}

type EditingCell = {
  itemId: string;
  field: keyof ImprovementPlanItem;
} | null;

const DATE_FIELDS: (keyof ImprovementPlanItem)[] = ['fecha_inicio', 'fecha_terminacion', 'fecha_ejecucion'];

const TEXT_COLUMNS: { key: keyof ImprovementPlanItem; label: string; minWidth: number }[] = [
  { key: 'actividad_mejora',   label: 'Actividad de Mejora',      minWidth: 200 },
  { key: 'responsable',        label: 'Responsable y Cargo',       minWidth: 160 },
  { key: 'fecha_inicio',       label: 'Fecha Inicio',              minWidth: 130 },
  { key: 'fecha_terminacion',  label: 'Fecha Terminación',         minWidth: 130 },
  { key: 'fecha_ejecucion',    label: 'Fecha Ejecución',           minWidth: 130 },
  { key: 'observaciones',      label: 'Observaciones',             minWidth: 180 },
  { key: 'seguimiento_1',      label: 'Seguimiento 1',             minWidth: 160 },
  { key: 'seguimiento_2',      label: 'Seguimiento 2',             minWidth: 160 },
  { key: 'seguimiento_3',      label: 'Seguimiento 3',             minWidth: 160 },
];

export const ImprovementPlanMatrix: React.FC<Props> = ({ assessmentId, assessmentStatus }) => {
  const [items, setItems] = useState<ImprovementPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingCell>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const { user } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isAuditor = user?.role === 'auditor' || user?.role === 'super_admin';
  const isSubmitted = assessmentStatus === 'submitted' || assessmentStatus === 'completed' || assessmentStatus === 'reviewed';

  const loadItems = useCallback(async () => {
    if (!assessmentId) return;
    try {
      setLoading(true);
      const res = await improvementPlanApi.getByAssessment(assessmentId);
      setItems((res.data || []) as ImprovementPlanItem[]);
    } catch {
      // silencioso: si no hay plan aún no es un error crítico
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => { loadItems(); }, [loadItems]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editValue.length, editValue.length);
    }
  }, [editing]);

  const startEdit = (item: ImprovementPlanItem, field: keyof ImprovementPlanItem) => {
    if (!isAuditor) return;
    setEditing({ itemId: item.id, field });
    setEditValue((item[field] as string) || '');
  };

  const commitEdit = async () => {
    if (!editing) return;
    const { itemId, field } = editing;
    setEditing(null);
    setSaving(itemId);
    try {
      const updated = await improvementPlanApi.update(itemId, { [field]: editValue });
      const updatedItem = (updated as unknown as { data: ImprovementPlanItem }).data;
      if (updatedItem) {
        setItems(prev => prev.map(i => i.id === itemId ? updatedItem : i));
      }
    } catch {
      // revertir silenciosamente
      await loadItems();
    } finally {
      setSaving(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setEditing(null);
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(); }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await improvementPlanApi.generate(assessmentId);
      setItems((res.data || []) as ImprovementPlanItem[]);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (val: string | null | undefined) => {
    if (!val) return '';
    return val.substring(0, 10);
  };

  const exportToCsv = () => {
    const headers = ['Nº', 'Estándar', 'Criterio', 'Hallazgo Encontrado', 'Actividad de Mejora', 'Responsable', 'Fecha Inicio', 'Fecha Terminación', 'Fecha Ejecución', 'Observaciones', 'Seguimiento 1', 'Seguimiento 2', 'Seguimiento 3'];
    const rows = items.map(i => [
      i.numero, i.estandar, i.criterio, i.hallazgo_encontrado,
      i.actividad_mejora || '', i.responsable || '',
      formatDate(i.fecha_inicio), formatDate(i.fecha_terminacion), formatDate(i.fecha_ejecucion),
      i.observaciones || '', i.seguimiento_1 || '', i.seguimiento_2 || '', i.seguimiento_3 || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `plan-mejora-${assessmentId.substring(0, 8)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="ipm-section">
        <div className="ipm-card">
          <div className="ipm-empty">
            <div className="docs-spinner" style={{ margin: '0 auto 12px', width: 28, height: 28, borderWidth: 3 }} />
            <p>Cargando plan de mejora...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ipm-section">
      <div className="ipm-card">
        {/* Header */}
        <div className="ipm-header">
          <div className="ipm-header-left">
            <div className="ipm-header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <div>
              <div className="ipm-header-title">Plan de Mejoramiento</div>
              <div className="ipm-header-sub">Generado automáticamente desde hallazgos NC</div>
            </div>
          </div>
          <div className="ipm-header-actions">
            {items.length > 0 && <span className="ipm-badge">{items.length} hallazgos</span>}
            {isAuditor && isSubmitted && (
              <button className="ipm-btn ipm-btn-regen" onClick={handleGenerate} title="Regenerar desde hallazgos">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
                </svg>
                Regenerar
              </button>
            )}
            {items.length > 0 && (
              <button className="ipm-btn ipm-btn-export" onClick={exportToCsv}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Exportar CSV
              </button>
            )}
          </div>
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="ipm-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <h4>Sin hallazgos NC</h4>
            <p>
              {isSubmitted
                ? 'No se encontraron hallazgos No Conformes para generar el plan.'
                : 'El plan de mejora se genera automáticamente al enviar la evaluación.'}
            </p>
            {isAuditor && isSubmitted && (
              <button className="ipm-btn ipm-btn-export" style={{ margin: '12px auto 0', background: '#6366f1', color: '#fff' }} onClick={handleGenerate}>
                Generar ahora
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="ipm-table-wrapper">
              <table className="ipm-table">
                <thead>
                  <tr>
                    <th className="ipm-th-center" style={{ width: 50 }}>Nº</th>
                    <th style={{ minWidth: 130 }}>Estándar</th>
                    <th style={{ minWidth: 180 }}>Criterio</th>
                    <th style={{ minWidth: 200 }}>Hallazgo Encontrado</th>
                    {TEXT_COLUMNS.map(col => (
                      <th key={col.key} style={{ minWidth: col.minWidth }}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      {/* Número */}
                      <td className="ipm-th-center">
                        <div className="ipm-num">{item.numero}</div>
                      </td>
                      {/* Estándar (solo lectura) */}
                      <td>
                        <div className="ipm-cell-standard">{item.estandar}</div>
                      </td>
                      {/* Criterio (solo lectura) */}
                      <td>
                        <div className="ipm-cell-criterion">{item.criterio}</div>
                      </td>
                      {/* Hallazgo (solo lectura) */}
                      <td>
                        <div className="ipm-cell-finding">{item.hallazgo_encontrado}</div>
                      </td>

                      {/* Columnas editables */}
                      {TEXT_COLUMNS.map(col => {
                        const isEditingThis = editing?.itemId === item.id && editing?.field === col.key;
                        const rawValue = item[col.key] as string | null | undefined;
                        const isDate = DATE_FIELDS.includes(col.key);
                        const displayValue = isDate ? formatDate(rawValue) : rawValue;

                        return (
                          <td key={col.key}>
                            <div className="ipm-editable">
                              {saving === item.id && <span className="ipm-saving-dot" />}
                              {isEditingThis ? (
                                isDate ? (
                                  <input
                                    type="date"
                                    className="ipm-date-input"
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    onBlur={commitEdit}
                                    onKeyDown={handleKeyDown}
                                    autoFocus
                                  />
                                ) : (
                                  <textarea
                                    ref={textareaRef}
                                    className="ipm-textarea"
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    onBlur={commitEdit}
                                    onKeyDown={handleKeyDown}
                                    rows={3}
                                  />
                                )
                              ) : (
                                <span
                                  className={`ipm-editable-text${!displayValue ? ' ipm-empty-cell' : ''}`}
                                  onClick={() => startEdit(item, col.key)}
                                  title={isAuditor ? 'Clic para editar' : undefined}
                                >
                                  {displayValue || ''}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="ipm-footer">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              {isAuditor ? 'Haz clic en cualquier celda para editarla. Los cambios se guardan automáticamente.' : 'Solo el auditor puede editar este plan.'}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImprovementPlanMatrix;

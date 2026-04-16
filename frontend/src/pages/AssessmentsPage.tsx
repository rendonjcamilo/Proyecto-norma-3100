/**
 * Assessments Page — Evaluaciones de cumplimiento Norma 3100
 * Carga servicios dinámicamente desde el modelo JSON
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assessmentsApi, servicesApi, type Assessment, type HealthService } from '../services/api';
import { useRolePermission } from '../hooks/useRolePermission';
import './Pages.css';

interface AssessmentsPageProps {
  providerId: string;
}

interface Norma3100Service {
  code: string;
  name: string;
  groupName: string;
  totalCriteria: number;
}

// Servicios de Norma 3100 del modelo JSON
const NORMA3100_SERVICES: Norma3100Service[] = [
  // Consulta Externa
  { code: 'CEG', name: 'Consulta Externa General', groupName: 'Consulta Externa', totalCriteria: 128 },
  { code: 'CEE', name: 'Consulta Externa Especializada', groupName: 'Consulta Externa', totalCriteria: 64 },
  { code: 'CEV', name: 'Consulta Externa Virtual', groupName: 'Consulta Externa', totalCriteria: 60 },
  { code: 'CES', name: 'Consulta Externa Seguridad Social en el Trabajo', groupName: 'Consulta Externa', totalCriteria: 30 },
  // Apoyo Diagnóstico
  { code: 'TRF', name: 'Terapia Física', groupName: 'Apoyo Diagnóstico', totalCriteria: 59 },
  { code: 'RXO', name: 'Rayos X Odontológicos', groupName: 'Apoyo Diagnóstico', totalCriteria: 48 },
  { code: 'IDX', name: 'Imágenes Diagnósticas', groupName: 'Apoyo Diagnóstico', totalCriteria: 125 },
  { code: 'RDT', name: 'Radioterapia', groupName: 'Apoyo Diagnóstico', totalCriteria: 94 },
  { code: 'QMT', name: 'Quimioterapia', groupName: 'Apoyo Diagnóstico', totalCriteria: 86 },
  { code: 'DVX', name: 'Diagnóstico Vascular', groupName: 'Apoyo Diagnóstico', totalCriteria: 35 },
  { code: 'HTR', name: 'Hematología', groupName: 'Apoyo Diagnóstico', totalCriteria: 97 },
  { code: 'GNT', name: 'Genética', groupName: 'Apoyo Diagnóstico', totalCriteria: 43 },
  { code: 'TLC', name: 'Técnicas Mínimamente Invasivas Laparoscópicas', groupName: 'Apoyo Diagnóstico', totalCriteria: 32 },
  { code: 'LAB', name: 'Laboratorio Clínico', groupName: 'Apoyo Diagnóstico', totalCriteria: 59 },
  { code: 'LAC', name: 'Laboratorio Clínico Urgencias', groupName: 'Apoyo Diagnóstico', totalCriteria: 36 },
  { code: 'LHT', name: 'Laboratorio de Hematología', groupName: 'Apoyo Diagnóstico', totalCriteria: 33 },
  { code: 'LPT', name: 'Laboratorio de Patología', groupName: 'Apoyo Diagnóstico', totalCriteria: 57 },
  { code: 'DLS', name: 'Diálisis', groupName: 'Apoyo Diagnóstico', totalCriteria: 104 },
  // Internación
  { code: 'HGP', name: 'Hospitalización General', groupName: 'Internación', totalCriteria: 228 },
  { code: 'HPP', name: 'Hospitalización Pediatría', groupName: 'Internación', totalCriteria: 207 },
  { code: 'OBN', name: 'Obstetricia Neonatal', groupName: 'Internación', totalCriteria: 70 },
  { code: 'CII', name: 'Cuidado Intermedio Neonatal', groupName: 'Internación', totalCriteria: 123 },
  { code: 'CIP', name: 'Cuidado Intensivo Pediátrico', groupName: 'Internación', totalCriteria: 90 },
  { code: 'CIM', name: 'Cuidado Intermedio Pediátrico', groupName: 'Internación', totalCriteria: 116 },
  { code: 'CIA', name: 'Cuidado Intensivo Adulto', groupName: 'Internación', totalCriteria: 86 },
  { code: 'HSC', name: 'Hospitalización Salud Mental', groupName: 'Internación', totalCriteria: 111 },
  { code: 'HSP', name: 'Hospitalización Psiquiátrica', groupName: 'Internación', totalCriteria: 134 },
  { code: 'CPC', name: 'Cuidado Básico Psiquiátrico', groupName: 'Internación', totalCriteria: 89 },
  // Quirúrgico
  { code: 'QRG', name: 'Quirúrgico', groupName: 'Quirúrgico', totalCriteria: 205 },
  // Atención Inmediata
  { code: 'URG', name: 'Urgencias', groupName: 'Atención Inmediata', totalCriteria: 201 },
  { code: 'TAS', name: 'Transporte Asistencial', groupName: 'Atención Inmediata', totalCriteria: 250 },
  { code: 'APH', name: 'Atención Prehospitalaria', groupName: 'Atención Inmediata', totalCriteria: 74 },
  { code: 'APR', name: 'Atención del Parto', groupName: 'Atención Inmediata', totalCriteria: 173 },
];

// Fallback a servicios antiguos si algo falla
const MOCK_SERVICES = [
  { id: 'svc-cx-001', code: 'CX-001', name: 'Consulta por medicina general', category: 'Consulta Externa', status: 'available' },
  { id: 'svc-cx-002', code: 'CX-003', name: 'Consulta especializada cardiología', category: 'Consulta Externa', status: 'available' },
  { id: 'svc-int-001', code: 'INT-001', name: 'Hospitalización adultos', category: 'Internación', status: 'available' },
  { id: 'svc-int-002', code: 'INT-002', name: 'Hospitalización pediátrica', category: 'Internación', status: 'available' },
  { id: 'svc-urg-001', code: 'URG-001', name: 'Urgencias adultos', category: 'Atención Inmediata', status: 'available' },
  { id: 'svc-qx-001', code: 'QX-001', name: 'Cirugía general', category: 'Quirúrgico', status: 'available' },
  { id: 'svc-dx-001', code: 'DX-001', name: 'Laboratorio clínico', category: 'Apoyo Diagnóstico', status: 'available' },
  { id: 'svc-dx-002', code: 'DX-002', name: 'Imagenología — Radiología', category: 'Apoyo Diagnóstico', status: 'available' },
];

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  in_progress: 'En Progreso',
  completed: 'Completada',
  archived: 'Archivada',
};

const STATUS_COLORS: Record<string, string> = {
  draft: '#6b778c',
  in_progress: '#0052cc',
  completed: '#00875a',
  archived: '#42526e',
};

const ASSESSMENT_TYPES: Record<string, string> = {
  initial: 'Autoevaluación Inicial',
  year4: 'Evaluación a los 4 Años',
  annual: 'Evaluación Anual',
  'pre-novelty': 'Pre-Novedad',
};

export const AssessmentsPage: React.FC<AssessmentsPageProps> = ({ providerId }) => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState<HealthService[]>([]);
  const [modalError, setModalError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'initial',
    serviceId: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedAssessments, setSelectedAssessments] = useState<Set<string>>(new Set());
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const { can } = useRolePermission();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // Intentar cargar evaluaciones existentes
        let loadedAssessments: Assessment[] = [];

        try {
          const assessRes = await assessmentsApi.listByProvider(providerId);
          loadedAssessments = (assessRes.data || []) as Assessment[];
        } catch (err) {
          console.warn('No se pudieron cargar evaluaciones desde backend, intentando localStorage:', err);

          // Fallback: cargar desde localStorage
          try {
            const storedAssessments = localStorage.getItem('assessments');
            if (storedAssessments) {
              loadedAssessments = JSON.parse(storedAssessments) as Assessment[];
            }
          } catch (parseErr) {
            console.warn('No se pudieron cargar evaluaciones desde localStorage:', parseErr);
          }
        }

        setAssessments(loadedAssessments);

        // Cargar servicios de Norma 3100 desde el modelo JSON
        try {
          const svcRes = await fetch('/api/norma3100/services');
          if (svcRes.ok) {
            const data = await svcRes.json();
            if (data.services && data.services.length > 0) {
              // Convertir al formato esperado
              const formattedServices = data.services.map((s: Norma3100Service) => ({
                id: `svc-${s.code}`,
                code: s.code,
                name: `${s.name} (${s.totalCriteria} criterios)`,
                category: s.groupName,
                status: 'available'
              }));
              setServices(formattedServices);
            } else {
              setServices(MOCK_SERVICES);
            }
          } else {
            setServices(MOCK_SERVICES);
          }
        } catch (err) {
          console.warn('No se pudieron cargar servicios de Norma 3100, usando fallback:', err);
          setServices(MOCK_SERVICES);
        }
      } catch (err) {
        console.error('Error cargando datos:', err);
        setServices(MOCK_SERVICES);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [providerId]);

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedAssessments(new Set()); // Clear selection when toggling mode
  };

  const toggleAssessmentSelection = (assessmentId: string) => {
    const newSelected = new Set(selectedAssessments);
    if (newSelected.has(assessmentId)) {
      newSelected.delete(assessmentId);
    } else {
      newSelected.add(assessmentId);
    }
    setSelectedAssessments(newSelected);
  };

  const selectAll = () => {
    setSelectedAssessments(new Set(assessments.map((a) => a.id)));
  };

  const deselectAll = () => {
    setSelectedAssessments(new Set());
  };

  const handleDeleteSelected = () => {
    if (selectedAssessments.size === 0) return;
    setShowConfirmDelete(true);
  };

  const handleConfirmDeleteModal = async () => {
    setShowConfirmDelete(false);
    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedAssessments).map((id) =>
        assessmentsApi.delete(id)
      );
      await Promise.all(deletePromises);

      setAssessments((prev) =>
        prev.filter((a) => !selectedAssessments.has(a.id))
      );
      setSelectedAssessments(new Set());
      setSelectionMode(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar las evaluaciones';
      console.error('Delete error:', msg);
      alert(`Error: ${msg}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDeleteModal = () => {
    setShowConfirmDelete(false);
  };

  if (loading) {
    return (
      <div className="page-container page-loading">
        <div className="page-spinner" />
        <p>Cargando evaluaciones...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Evaluaciones</h1>
          <p className="page-subtitle">
            Autoevaluaciones de cumplimiento según Norma 3100 de 2019
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {can('assessments', 'delete') && assessments.length > 0 && (
            <button
              className={`page-btn-primary ${selectionMode ? 'active' : ''}`}
              onClick={toggleSelectionMode}
              style={{
                background: selectionMode ? '#de350b' : '#0052cc',
                borderColor: selectionMode ? '#de350b' : 'transparent',
              }}
            >
              {selectionMode ? '✕ Cancelar Selección' : '✓ Seleccionar'}
            </button>
          )}
          {can('assessments', 'create') && (
            <button className="page-btn-primary" onClick={() => navigate('/assessments/new')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nueva Evaluación
            </button>
          )}
        </div>
      </header>

      {assessments.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="empty-icon">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3>Sin evaluaciones</h3>
          <p>Crea tu primera autoevaluación para comenzar el seguimiento de cumplimiento</p>
        </div>
      ) : (
        <div className="card-grid">
          {assessments.map((a) => (
            <div
              key={a.id}
              className={`assessment-card ${selectionMode && selectedAssessments.has(a.id) ? 'selected' : ''}`}
              onClick={() => !selectionMode && navigate(`/assessments/${a.id}`)}
              style={{ cursor: selectionMode ? 'pointer' : 'pointer' }}
            >
              {selectionMode && (
                <div className="assessment-card-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedAssessments.has(a.id)}
                    onChange={() => toggleAssessmentSelection(a.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              <div className="assessment-card-header">
                <span
                  className="status-badge"
                  style={{
                    background: `${STATUS_COLORS[a.status]}15`,
                    color: STATUS_COLORS[a.status],
                  }}
                >
                  {STATUS_LABELS[a.status]}
                </span>
                <span className="card-type">{ASSESSMENT_TYPES[a.assessment_version] || a.assessment_version}</span>
              </div>
              <h3 className="card-title">{a.title}</h3>
              <div className="compliance-bar-container">
                <div className="compliance-bar-label">
                  <span>Cumplimiento</span>
                  <span style={{
                    fontWeight: 700,
                    color: (a.compliance_percentage ?? a.compliance_percent ?? 0) >= 80 ? '#00875a' : (a.compliance_percentage ?? a.compliance_percent ?? 0) >= 50 ? '#ff8b00' : '#de350b',
                  }}>
                    {Math.round((a.compliance_percentage ?? a.compliance_percent ?? 0))}%
                  </span>
                </div>
                <div className="compliance-bar">
                  <div
                    className="compliance-bar-fill"
                    style={{
                      width: `${(a.compliance_percentage ?? a.compliance_percent ?? 0)}%`,
                      background: (a.compliance_percentage ?? a.compliance_percent ?? 0) >= 80 ? '#00875a' : (a.compliance_percentage ?? a.compliance_percent ?? 0) >= 50 ? '#ff8b00' : '#de350b',
                    }}
                  />
                </div>
              </div>
              <div className="card-date">
                Actualizado: {new Date(a.updated_at).toLocaleDateString('es-CO')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selection Control Panel */}
      {selectionMode && (
        <div className="selection-control-panel">
          <div className="selection-control-info">
            <span className="selection-count">
              {selectedAssessments.size} de {assessments.length} evaluaciones seleccionadas
            </span>
          </div>
          <div className="selection-control-actions">
            {selectedAssessments.size > 0 && (
              <button
                className="btn-text"
                onClick={deselectAll}
                type="button"
              >
                Deseleccionar todo
              </button>
            )}
            {selectedAssessments.size < assessments.length && (
              <button
                className="btn-text"
                onClick={selectAll}
                type="button"
              >
                Seleccionar todo
              </button>
            )}
            {selectedAssessments.size > 0 && (
              <button
                className="btn-danger-action"
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                type="button"
              >
                {isDeleting ? 'Eliminando...' : `🗑️ Eliminar ${selectedAssessments.size}`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Create Assessment Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowCreateModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '20px' }}>Nueva Evaluación</h2>

            {modalError && (
              <div style={{
                padding: '12px 16px',
                background: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                color: '#991b1b',
                marginBottom: '16px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span>⚠️</span>
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();

              // Validación del formulario
              if (!formData.title.trim()) {
                setModalError('Por favor ingresa un título para la evaluación');
                return;
              }
              if (!formData.serviceId) {
                setModalError('Por favor selecciona un servicio de salud');
                return;
              }

              setModalError(null);

              try {
                setIsSubmitting(true);

                // Intentar crear via API
                try {
                  await assessmentsApi.create({
                    providerId,
                    serviceId: formData.serviceId,
                    questionnaireId: formData.serviceId,
                    assessmentVersion: formData.type,
                  });
                } catch (apiError) {
                  console.warn('No se pudo crear evaluación en BD, usando JSON model:', apiError);

                  // Fallback: crear evaluación desde modelo JSON
                  const response = await fetch(`/api/norma3100/questionnaires/${formData.serviceId}/${formData.type}`);
                  if (response.ok) {
                    const { questionnaire } = await response.json();
                    const newAssessment = {
                      id: `assess-${Date.now()}`,
                      title: formData.title,
                      status: 'in_progress',
                      type: formData.type,
                      service_id: formData.serviceId,
                      questionnaire_id: questionnaire.id,
                      compliance_percent: 0,
                      updated_at: new Date().toISOString(),
                    };
                    setAssessments(prev => [newAssessment as any, ...prev]);
                  }
                }

                setShowCreateModal(false);
                setFormData({ title: '', type: 'initial', serviceId: '' });

                // Recargar desde localStorage
                try {
                  const storedAssessments = localStorage.getItem('assessments');
                  if (storedAssessments) {
                    setAssessments(JSON.parse(storedAssessments) as Assessment[]);
                  }
                } catch (err) {
                  console.warn('No se pudo recargar lista de evaluaciones');
                }
              } catch (error) {
                console.error('Error creando evaluación:', error);
                setModalError(error instanceof Error ? error.message : 'No se pudo crear la evaluación');
              } finally {
                setIsSubmitting(false);
              }
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Título</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                  placeholder="Ej: Evaluación Norma 3100 2026"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                  Servicio de Salud <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formData.serviceId}
                  onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: formData.serviceId ? '1px solid #ddd' : '2px solid #ef4444',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    backgroundColor: formData.serviceId ? 'white' : '#fee2e2',
                  }}
                >
                  <option value="">-- Selecciona un servicio de salud --</option>
                  {/* Agrupar servicios por categoría */}
                  {['Consulta Externa', 'Apoyo Diagnóstico', 'Internación', 'Quirúrgico', 'Atención Inmediata'].map(category => {
                    const categoryServices = services.filter(s => s.category === category);
                    return categoryServices.length > 0 ? (
                      <optgroup key={category} label={`${category} (${categoryServices.length})`}>
                        {categoryServices.map(s => (
                          <option key={s.id} value={s.code}>
                            {s.name}
                          </option>
                        ))}
                      </optgroup>
                    ) : null;
                  })}
                </select>
                {!formData.serviceId && (
                  <small style={{ color: '#ef4444', display: 'block', marginTop: '4px' }}>
                    Debes seleccionar un servicio para continuar
                  </small>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Tipo de Evaluación</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="initial">Autoevaluación Inicial</option>
                  <option value="annual">Evaluación Anual</option>
                  <option value="year4">Evaluación a los 4 Años</option>
                  <option value="pre-novelty">Pre-Novedad</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    background: '#0052cc',
                    color: 'white',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    opacity: isSubmitting ? 0.6 : 1,
                  }}
                >
                  {isSubmitting ? 'Creando...' : 'Crear Evaluación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="delete-confirm-overlay" onClick={handleCancelDeleteModal}>
          <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-icon">⚠️</div>
            <h2 className="delete-confirm-title">Eliminar Evaluaciones</h2>
            <p className="delete-confirm-message">
              ¿Está seguro de que desea eliminar <strong>{selectedAssessments.size}</strong> evaluación{selectedAssessments.size > 1 ? 'es' : ''}?
            </p>
            <p className="delete-confirm-warning">Esta acción no se puede deshacer.</p>
            <div className="delete-confirm-actions">
              <button
                className="delete-confirm-btn cancel"
                onClick={handleCancelDeleteModal}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                className="delete-confirm-btn danger"
                onClick={handleConfirmDeleteModal}
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : '🗑️ Eliminar'}
              </button>
            </div>
          </div>
          <style>{`
            .delete-confirm-overlay {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 1001;
            }
            .delete-confirm-modal {
              background: white;
              border-radius: 12px;
              padding: 32px 24px;
              max-width: 400px;
              width: 90%;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
              text-align: center;
            }
            .delete-confirm-icon {
              font-size: 48px;
              margin-bottom: 16px;
            }
            .delete-confirm-title {
              margin: 0 0 12px;
              font-size: 20px;
              font-weight: 700;
              color: #172b4d;
            }
            .delete-confirm-message {
              margin: 0 0 8px;
              font-size: 14px;
              color: #42526e;
              line-height: 1.5;
            }
            .delete-confirm-warning {
              margin: 16px 0;
              padding: 12px 16px;
              background: #fff3e0;
              border: 1px solid #ffe0b2;
              border-radius: 6px;
              color: #e65100;
              font-size: 13px;
              font-weight: 500;
            }
            .delete-confirm-actions {
              display: flex;
              gap: 12px;
              margin-top: 24px;
            }
            .delete-confirm-btn {
              flex: 1;
              padding: 10px 16px;
              border: none;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
            }
            .delete-confirm-btn.cancel {
              background: #f4f5f7;
              color: #172b4d;
              border: 1px solid #dfe1e6;
            }
            .delete-confirm-btn.cancel:hover:not(:disabled) {
              background: #e9ebf0;
            }
            .delete-confirm-btn.danger {
              background: #de350b;
              color: white;
            }
            .delete-confirm-btn.danger:hover:not(:disabled) {
              background: #c42107;
              transform: translateY(-1px);
            }
            .delete-confirm-btn:disabled {
              opacity: 0.6;
              cursor: not-allowed;
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

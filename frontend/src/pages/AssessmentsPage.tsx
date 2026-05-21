/**
 * Assessments Page — Evaluaciones de cumplimiento Norma 3100
 * Carga servicios dinámicamente desde el modelo JSON
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { assessmentsApi, servicesApi, providerServicesApi, providersApi, anexo4Api, type Assessment, type HealthService, type EvaluableService } from '../services/api';
import { useRolePermission } from '../hooks/useRolePermission';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '@/utils/dateFormat';
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
  const location = useLocation();
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState<HealthService[]>([]);
  const [servicesFiltered, setServicesFiltered] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [auditorsProviders, setAuditorsProviders] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    type: 'initial',
    serviceId: '',
    providerId: providerId || '',
    includeHC: false,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingProviderServices, setLoadingProviderServices] = useState(false);
  const [evaluableServices, setEvaluableServices] = useState<EvaluableService[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [loadingEvaluable, setLoadingEvaluable] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedAssessments, setSelectedAssessments] = useState<Set<string>>(new Set());
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const { can } = useRolePermission();

  useEffect(() => {
    const load = async () => {
      // No ejecutar si no hay datos suficientes
      if (user?.role === 'auditor' && !user?.id) {
        setLoading(false);
        return;
      }
      if (user?.role !== 'auditor' && !providerId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Intentar cargar evaluaciones existentes
        let loadedAssessments: Assessment[] = [];

        console.log('[AssessmentsPage] User:', user?.role, 'ID:', user?.id);

        try {
          // Para auditors, cargar de sus providers asignados
          if (user?.role === 'auditor' && user?.id) {
            console.log('[AssessmentsPage] Loading for auditor:', user.id);
            try {
              const auditResponse = await providersApi.getAuditorProviders(user.id);
              if (auditResponse.providers && auditResponse.providers.length > 0) {
                // Guardar providers asignados para el dropdown del modal
                setAuditorsProviders(auditResponse.providers);

                if (providerId) {
                  // Prestador específico seleccionado en el top bar — solo ese
                  try {
                    const assessRes = await assessmentsApi.listByProvider(providerId);
                    loadedAssessments = (assessRes.data || []) as Assessment[];
                  } catch (err) {
                    console.warn(`No se pudieron cargar evaluaciones para provider ${providerId}:`, err);
                  }
                } else {
                  // Sin prestador seleccionado — cargar todos los asignados
                  const allAssessments: Assessment[] = [];
                  for (const provider of auditResponse.providers) {
                    try {
                      const assessRes = await assessmentsApi.listByProvider(provider.id);
                      allAssessments.push(...((assessRes.data || []) as Assessment[]));
                    } catch (err) {
                      console.warn(`No se pudieron cargar evaluaciones para provider ${provider.id}:`, err);
                    }
                  }
                  loadedAssessments = allAssessments;
                }
              }
            } catch (err) {
              console.warn('No se pudieron cargar providers del auditor:', err);
            }
          } else if (providerId) {
            // Para provider_admin, cargar solo de su provider
            const assessRes = await assessmentsApi.listByProvider(providerId);
            loadedAssessments = (assessRes.data || []) as Assessment[];
          }
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

        // Cargar servicios: filtrados por prestador (si aplica) o todos
        try {
          let loadedServices: HealthService[] = [];
          if (providerId) {
            const provSvcRes = await providerServicesApi.getForProvider(providerId);
            loadedServices = provSvcRes.data || [];
          }
          if (loadedServices.length > 0) {
            setServicesFiltered(true);
            setServices(loadedServices);
            if (loadedServices.length === 1) {
              setFormData((prev) => ({ ...prev, serviceId: loadedServices[0].id }));
            }
          } else {
            setServicesFiltered(false);
            const svcData = await servicesApi.getAll();
            if (svcData.data && svcData.data.length > 0) {
              setServices(svcData.data);
            }
          }
        } catch (svcErr) {
          console.error('Error cargando servicios:', svcErr);
          try {
            const svcData = await servicesApi.getAll();
            if (svcData.data && svcData.data.length > 0) setServices(svcData.data);
          } catch { /* sin servicios */ }
        }
      } catch (err) {
        console.error('Error cargando datos:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [providerId, user?.id, user?.role, location.key]);

  const handleProviderChange = async (newProviderId: string) => {
    setFormData((prev) => ({ ...prev, providerId: newProviderId, serviceId: '' }));
    setSelectedServiceIds(new Set());
    if (!newProviderId) {
      setServices([]);
      setServicesFiltered(false);
      return;
    }
    setLoadingProviderServices(true);
    try {
      const provSvcRes = await providerServicesApi.getForProvider(newProviderId);
      const provServices = provSvcRes.data || [];
      if (provServices.length > 0) {
        setServices(provServices);
        setServicesFiltered(true);
        if (provServices.length === 1) {
          setFormData((prev) => ({ ...prev, providerId: newProviderId, serviceId: provServices[0].id }));
        }
        // Auto-seleccionar los servicios habilitados del prestador en los checkboxes de evaluación
        setSelectedServiceIds(new Set(provServices.map((s: { id: string }) => s.id)));
      } else {
        setServicesFiltered(false);
        const svcData = await servicesApi.getAll();
        setServices(svcData.data || []);
      }
    } catch {
      setServicesFiltered(false);
      try {
        const svcData = await servicesApi.getAll();
        setServices(svcData.data || []);
      } catch { /* sin servicios */ }
    } finally {
      setLoadingProviderServices(false);
    }
  };

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
    <div className="page-container aud-page">
      <div className="aud-hero">
        <div className="aud-hero-content">
          <span className="aud-hero-badge">
            <svg width="6" height="6" viewBox="0 0 6 6" fill="none"><circle cx="3" cy="3" r="3" fill="#A78BFA"/></svg>
            Gestión de Cumplimiento
          </span>
          <h1 className="aud-hero-title">{user?.role === 'auditor' ? 'Auditoría' : 'Evaluaciones'}</h1>
          <p className="aud-hero-subtitle">{user?.role === 'auditor' ? 'Auditorías de cumplimiento bajo la Resolución 3100' : 'Auditorías y evaluaciones de cumplimiento bajo la Resolución 3100'}</p>
        </div>
        <div className="aud-hero-actions" style={{ display: 'flex', gap: '8px' }}>
          {can('assessments', 'delete') && assessments.length > 0 && (
            <button
              className="aud-hero-btn"
              onClick={toggleSelectionMode}
              style={selectionMode ? { background: '#de350b', boxShadow: '0 4px 12px rgba(222,53,11,0.32)' } : undefined}
            >
              {selectionMode ? '✕ Cancelar Selección' : '✓ Seleccionar'}
            </button>
          )}
          {can('assessments', 'create') && (
            <button className="aud-hero-btn" onClick={async () => {
              setFormData((prev) => ({ ...prev, providerId: providerId || prev.providerId, serviceId: '' }));
              setSelectedServiceIds(new Set());
              setShowCreateModal(true);
              // Cargar servicios evaluables al abrir el modal
              if (evaluableServices.length === 0) {
                setLoadingEvaluable(true);
                try {
                  const res = await servicesApi.getEvaluable();
                  setEvaluableServices(res.data || []);
                } catch {
                  setEvaluableServices([]);
                } finally {
                  setLoadingEvaluable(false);
                }
              }
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {user?.role === 'auditor' ? 'Nueva Auditoría' : 'Nueva Evaluación'}
            </button>
          )}
        </div>
        <div className="aud-hero-orb" />
      </div>

      {assessments.length === 0 ? (
        <div className="prov-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/>
            <line x1="9" y1="12" x2="15" y2="12"/>
            <line x1="9" y1="16" x2="13" y2="16"/>
          </svg>
          <h3>Sin evaluaciones</h3>
          <p>Crea tu primera evaluación para comenzar el seguimiento de cumplimiento</p>
        </div>
      ) : (
        <>
          {(() => {
            const draftAssessments = assessments.filter(a =>
              a.status === 'draft' || a.status === 'in_progress'
            );
            const completedAssessments = assessments.filter(a =>
              a.status !== 'draft' && a.status !== 'in_progress'
            );

            const getServiceName = (serviceId: string) => {
              const service = services.find(s => s.id === serviceId);
              return service?.name || '';
            };

            const getProviderName = (assessment: any) => {
              if (assessment.provider_name) return assessment.provider_name;
              const provider = auditorsProviders.find(p => p.id === assessment.provider_id);
              if (provider?.legal_name) return provider.legal_name;
              return assessment.provider_id.substring(0, 20) + (assessment.provider_id.length > 20 ? '...' : '');
            };

            const getComplianceColor = (pct: number) =>
              pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';

            const renderGrid = (list: Assessment[], sectionLabel: string, count: number) => (
              <section className="assm-section">
                <div className="assm-section-header">
                  <span className="assm-section-dot" />
                  <h2>{sectionLabel}</h2>
                  <span className="assm-section-count">{count}</span>
                </div>
                <div className="prov-grid">
                  {list.map(a => {
                    const pct = Math.round(a.compliance_percentage ?? a.compliance_percent ?? 0);
                    const compColor = getComplianceColor(pct);
                    const isSelected = selectedAssessments.has(a.id);
                    return (
                      <div
                        key={a.id}
                        className={`prov-card assm-card${isSelected ? ' assm-card-selected' : ''}`}
                        onClick={() => selectionMode ? toggleAssessmentSelection(a.id) : navigate(`/assessments/${a.id}`)}
                      >
                        {/* Accent bar con color de estado */}
                        <div className="prov-card-accent" style={{
                          background: a.status === 'completed' ? 'linear-gradient(180deg,#10b981,#34d399)'
                            : a.status === 'in_progress' ? 'linear-gradient(180deg,#8B5CF6,#A78BFA)'
                            : 'linear-gradient(180deg,#94a3b8,#cbd5e1)',
                        }} />

                        {/* Top row */}
                        <div className="prov-card-top">
                          <div className="prov-card-icon">
                            {selectionMode ? (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleAssessmentSelection(a.id)}
                                onClick={e => e.stopPropagation()}
                                style={{ width: '16px', height: '16px', accentColor: '#8B5CF6', cursor: 'pointer' }}
                              />
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                                <rect x="9" y="3" width="6" height="4" rx="1"/>
                                <line x1="9" y1="12" x2="15" y2="12"/>
                                <line x1="9" y1="16" x2="13" y2="16"/>
                              </svg>
                            )}
                          </div>
                          <span className={`prov-status prov-status-${a.status === 'completed' ? 'active' : a.status === 'in_progress' ? 'in-progress' : 'inactive'}`}>
                            <span className="prov-status-dot" />
                            {STATUS_LABELS[a.status]}
                          </span>
                        </div>

                        {/* Title */}
                        <div className="prov-card-name assm-title">
                          {a.title || a.service_name || getServiceName(a.service_id) || '—'}
                        </div>
                        {a.title && !!(a.service_name || getServiceName(a.service_id)) && (
                          <div style={{ fontSize: '11px', color: '#6b778c', marginTop: '-4px', marginBottom: '4px' }}>
                            {a.service_name || getServiceName(a.service_id)}
                          </div>
                        )}

                        {/* Compliance bar */}
                        <div className="assm-compliance">
                          <div className="assm-compliance-header">
                            <span className="prov-info-label">Cumplimiento</span>
                            <span className="assm-pct" style={{ color: compColor }}>{pct}%</span>
                          </div>
                          <div className="assm-bar-track">
                            <div className="assm-bar-fill" style={{ width: `${pct}%`, background: compColor }} />
                          </div>
                        </div>

                        {/* Info rows */}
                        <div className="prov-card-info">
                          <div className="prov-info-row">
                            <span className="prov-info-label">Prestador</span>
                            <span className="prov-info-value assm-truncate">{getProviderName(a)}</span>
                          </div>
                          <div className="prov-info-row">
                            <span className="prov-info-label">Servicio</span>
                            <span className="prov-info-value assm-truncate">{a.service_name || getServiceName(a.service_id) || 'Estándares transversales'}</span>
                          </div>
                          <div className="prov-info-row">
                            <span className="prov-info-label">Tipo</span>
                            <span className="prov-info-value">{ASSESSMENT_TYPES[a.assessment_version] || a.assessment_version}</span>
                          </div>
                          <div className="prov-info-row">
                            <span className="prov-info-label">Actualizado</span>
                            <span className="prov-info-value">{formatDate(a.updated_at)}</span>
                          </div>
                        </div>

                        {/* Action */}
                        <div className="prov-card-actions">
                          <button
                            className="prov-btn-edit assm-btn-full"
                            onClick={e => { e.stopPropagation(); navigate(`/assessments/${a.id}`); }}
                          >
                            {a.status === 'completed' ? 'Ver Evaluación' : 'Continuar →'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );

            return (
              <>
                {draftAssessments.length > 0 && renderGrid(draftAssessments, user?.role === 'auditor' ? 'Auditorías en curso' : 'Evaluaciones en curso', draftAssessments.length)}
                {completedAssessments.length > 0 && renderGrid(completedAssessments, user?.role === 'auditor' ? 'Auditorías completadas' : 'Evaluaciones completadas', completedAssessments.length)}
              </>
            );
          })()}
        </>
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
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>{user?.role === 'auditor' ? 'Nueva Auditoría' : 'Nueva Evaluación'}</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b778c', lineHeight: 1, padding: '0 4px' }}
                title="Cancelar"
              >×</button>
            </div>

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

              if (user?.role === 'auditor' && !formData.providerId) {
                setModalError('Por favor selecciona un prestador para la evaluación');
                return;
              }

              setModalError(null);

              try {
                setIsSubmitting(true);

                const finalProviderId = user?.role === 'auditor' ? formData.providerId : providerId;
                const baseTitle = formData.title.trim();
                let firstAssessmentId: string | null = null;

                // Un solo assessment: transversal + todos los servicios específicos seleccionados
                const svcIds = [...selectedServiceIds];
                const svcs = svcIds.map(id => evaluableServices.find(s => s.id === id)).filter(Boolean);
                const serviceLabel = svcs.length > 0 ? ` — ${svcs.map(s => s!.name).join(', ')}` : '';
                const res = await assessmentsApi.create({
                  providerId: finalProviderId,
                  serviceIds: svcIds,
                  questionnaireId: '',
                  assessmentVersion: formData.type,
                  title: `${baseTitle}${serviceLabel}`,
                });
                firstAssessmentId = res.data?.id || null;

                // Si el auditor marcó "Incluir Verificación H.C.", crear borrador de Anexo 4 vinculado
                if (firstAssessmentId && formData.includeHC) {
                  const today = new Date().toISOString().split('T')[0];
                  const servicioLabel = svcs.length > 0 ? svcs[0]!.name : baseTitle;
                  const emptyRegistro = { numero_hc: '1', nombre_usuario: '', criterios: {} };
                  try {
                    await anexo4Api.create({
                      servicio: servicioLabel,
                      fecha: today,
                      registros: [emptyRegistro],
                      assessment_id: firstAssessmentId,
                    });
                  } catch {
                    // No bloquear la creación de la auditoría si falla el borrador de HC
                  }
                }

                setShowCreateModal(false);
                setFormData({ title: '', type: 'initial', serviceId: '', providerId: providerId || '', includeHC: false });
                setSelectedServiceIds(new Set());

                // Navegar a la evaluación transversal recién creada
                if (firstAssessmentId) {
                  navigate(`/assessments/${firstAssessmentId}`);
                  return;
                }

                // Si no hay ID, recargar lista (fallback)
                try {
                  let updatedAssessments: Assessment[] = [];

                  if (user?.role === 'auditor' && user?.id) {
                    // Para auditors, cargar de todos sus providers asignados
                    const auditResponse = await providersApi.getAuditorProviders(user.id);
                    if (auditResponse.providers && auditResponse.providers.length > 0) {
                      const allAssessments: Assessment[] = [];
                      for (const provider of auditResponse.providers) {
                        const assessRes = await assessmentsApi.listByProvider(provider.id);
                        allAssessments.push(...((assessRes.data || []) as Assessment[]));
                      }
                      updatedAssessments = allAssessments;
                    }
                  } else if (providerId) {
                    // Para provider_admin, cargar de su provider
                    const assessRes = await assessmentsApi.listByProvider(providerId);
                    updatedAssessments = (assessRes.data || []) as Assessment[];
                  }

                  setAssessments(updatedAssessments);
                } catch (err) {
                  console.warn('No se pudieron recargar evaluaciones:', err);
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

              {user?.role === 'auditor' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                    Prestador <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formData.providerId}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: formData.providerId ? '1px solid #ddd' : '2px solid #ef4444',
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="">-- Selecciona un prestador --</option>
                    {auditorsProviders.map((p) => (
                      <option key={p.id} value={p.id}>{p.legal_name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Evaluaciones a crear */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  Evaluaciones a crear
                </label>

                {/* Evaluación transversal — siempre obligatoria */}
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '10px 12px', marginBottom: '8px',
                  background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px',
                }}>
                  <input type="checkbox" checked readOnly style={{ marginTop: '2px', accentColor: '#16a34a' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#15803d' }}>
                      Evaluación Transversal — 7 Estándares (obligatoria)
                    </div>
                    <div style={{ fontSize: '12px', color: '#4b5563' }}>
                      512 criterios · Aplica a todos los servicios de salud
                    </div>
                  </div>
                </div>

                {/* Evaluaciones de servicio específico */}
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ padding: '8px 12px', background: '#f9fafb', fontSize: '13px', fontWeight: 500, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>
                    Servicios específicos a evaluar (opcional)
                    {selectedServiceIds.size > 0 && (
                      <span style={{ marginLeft: '8px', background: '#2563eb', color: 'white', borderRadius: '10px', padding: '1px 8px', fontSize: '11px' }}>
                        {selectedServiceIds.size} seleccionado{selectedServiceIds.size > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {loadingEvaluable ? (
                    <div style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: '#6b778c' }}>
                      Cargando servicios evaluables...
                    </div>
                  ) : (
                    <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                      {[...new Set(evaluableServices.map(s => s.category))].sort().map(category => (
                        <div key={category}>
                          <div style={{ padding: '6px 12px', background: '#f3f4f6', fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {category}
                          </div>
                          {evaluableServices.filter(s => s.category === category).map(svc => (
                            <label key={svc.id} style={{
                              display: 'flex', alignItems: 'flex-start', gap: '10px',
                              padding: '8px 12px', cursor: 'pointer',
                              background: selectedServiceIds.has(svc.id) ? '#eff6ff' : 'white',
                              borderBottom: '1px solid #f3f4f6',
                            }}>
                              <input
                                type="checkbox"
                                checked={selectedServiceIds.has(svc.id)}
                                onChange={() => {
                                  setSelectedServiceIds(prev => {
                                    const next = new Set(prev);
                                    if (next.has(svc.id)) next.delete(svc.id);
                                    else next.add(svc.id);
                                    return next;
                                  });
                                }}
                                style={{ marginTop: '2px', accentColor: '#2563eb' }}
                              />
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{svc.name}</div>
                                <div style={{ fontSize: '11px', color: '#6b7280' }}>{svc.total_criteria} criterios · {svc.code}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Verificación H.C. — solo visible para auditores */}
              {user?.role === 'auditor' || user?.role === 'super_admin' ? (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                    Documentos adicionales
                  </label>
                  <label style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    padding: '10px 12px', cursor: 'pointer',
                    background: formData.includeHC ? '#f5f3ff' : '#fafafa',
                    border: formData.includeHC ? '1px solid #c4b5fd' : '1px solid #e5e7eb',
                    borderRadius: '6px', transition: 'all 0.15s',
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.includeHC}
                      onChange={(e) => setFormData({ ...formData, includeHC: e.target.checked })}
                      style={{ marginTop: '2px', accentColor: '#6255A0', cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: formData.includeHC ? '#6255A0' : '#374151' }}>
                        Verificación Historia Clínica — Anexo N° 4
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                        Incluye formulario de verificación de contenidos mínimos de identificación
                      </div>
                    </div>
                  </label>
                </div>
              ) : null}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{user?.role === 'auditor' ? 'Tipo de Auditoría' : 'Tipo de Evaluación'}</label>
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
                    color: '#172b4d',
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
                  {isSubmitting ? 'Creando...' : user?.role === 'auditor' ? 'Crear Auditoría' : 'Crear Evaluación'}
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

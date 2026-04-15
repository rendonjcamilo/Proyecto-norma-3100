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

export const AssessmentsPage: React.FC<AssessmentsPageProps> = ({ providerId }) => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState<HealthService[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    type: 'initial',
    serviceId: ''
  });
  const { can } = useRolePermission();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // Intentar cargar evaluaciones existentes
        try {
          const assessRes = await assessmentsApi.listByProvider(providerId);
          setAssessments((assessRes.data || []) as Assessment[]);
        } catch (err) {
          console.warn('No se pudieron cargar evaluaciones existentes:', err);
          setAssessments([]);
        }

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
        {can('assessments', 'create') && (
          <button className="page-btn-primary" onClick={() => setShowCreateModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nueva Evaluación
          </button>
        )}
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
              className="assessment-card"
              onClick={() => navigate(`/assessments/${a.id}`)}
              style={{ cursor: 'pointer' }}
            >
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
                <span className="card-type">{a.type}</span>
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

            <form onSubmit={async (e) => {
              e.preventDefault();

              // Validación del formulario
              if (!formData.title.trim()) {
                alert('Por favor ingresa un título para la evaluación');
                return;
              }
              if (!formData.serviceId) {
                alert('Por favor selecciona un servicio de salud');
                return;
              }

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

                // Intentar recargar lista
                try {
                  const res = await assessmentsApi.listByProvider(providerId);
                  if (res.data) {
                    setAssessments((res.data || []) as Assessment[]);
                  }
                } catch (err) {
                  console.warn('No se pudo recargar lista de evaluaciones');
                }
              } catch (error) {
                console.error('Error creando evaluación:', error);
                alert(`Error: ${error instanceof Error ? error.message : 'No se pudo crear la evaluación'}`);
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
    </div>
  );
};

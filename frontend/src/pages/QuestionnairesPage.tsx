/**
 * Questionnaires Management Page
 * For super_admin to create and manage questionnaires
 */

import React, { useState, useEffect } from 'react';
import { questionnairesApi, servicesApi, Questionnaire, HealthService } from '@services/api';
import styles from './QuestionnairesPage.module.css';

type VersionType = 'initial' | 'year4' | 'annual' | 'pre-novelty';

const VERSION_LABELS: Record<VersionType, string> = {
  initial: 'Evaluación Inicial',
  year4: 'Evaluación 4 Años',
  annual: 'Evaluación Anual',
  'pre-novelty': 'Pre-Novedad',
};

export function QuestionnairesPage(): JSX.Element {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [services, setServices] = useState<HealthService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingQuestionnaire, setCreatingQuestionnaire] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    serviceId: '',
    versionType: 'initial' as VersionType,
    name: '',
  });

  const [filterStatus, setFilterStatus] = useState<string>('published');
  const [filterVersion, setFilterVersion] = useState<string>('');

  useEffect(() => {
    fetchQuestionnaires('published');
    fetchServices();
  }, []);

  const fetchQuestionnaires = async (status?: string, version?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (status) params.status = status;
      if (version) params.versionType = version;

      const data = await questionnairesApi.list(params);
      setQuestionnaires(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading questionnaires');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const data = await servicesApi.getAll();
      setServices(data.data);
    } catch (err) {
      console.error('Error loading services:', err);
    }
  };

  const handleCreateQuestionnaire = async () => {
    if (!formData.serviceId) {
      setCreateError('Servicio es requerido');
      return;
    }

    try {
      setCreatingQuestionnaire(true);
      setCreateError(null);

      const newQuestionnaire = await questionnairesApi.create({
        serviceId: formData.serviceId,
        versionType: formData.versionType,
        name: formData.name || undefined,
      });

      setQuestionnaires([newQuestionnaire.data, ...questionnaires]);
      setShowCreateModal(false);
      setFormData({ serviceId: '', versionType: 'initial', name: '' });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Error creating questionnaire');
    } finally {
      setCreatingQuestionnaire(false);
    }
  };

  const handleDeleteQuestionnaire = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas archivar este cuestionario?')) {
      return;
    }

    try {
      await questionnairesApi.delete(id);
      setQuestionnaires(questionnaires.filter(q => q.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting questionnaire');
    }
  };

  const filteredQuestionnaires = questionnaires.filter(q => {
    if (filterStatus && q.status !== filterStatus) return false;
    if (filterVersion && q.version_type !== filterVersion) return false;
    return true;
  });

  if (loading) {
    return <div className={styles.loading}>Cargando cuestionarios...</div>;
  }

  return (
    <div className={`admin-dashboard ${styles.root}`}>

      {/* ── HERO BANNER ─────────────────────────────────────── */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>
            <svg width="6" height="6" viewBox="0 0 6 6" fill="none"><circle cx="3" cy="3" r="3" fill="#818cf8"/></svg>
            Administración del Sistema
          </span>
          <h1 className={styles.heroTitle}>Gestión de Cuestionarios</h1>
          <p className={styles.heroSubtitle}>Crear y administrar plantillas de evaluación por servicio de salud</p>
        </div>
        <div className={styles.heroActions}>
          <button onClick={() => setShowCreateModal(true)} className={styles.heroPrimaryBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Crear Cuestionario
          </button>
        </div>
        <div className={styles.heroOrb} />
      </div>

      {error && <div className={styles.alert}>{error}</div>}

      {/* Filtros */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Estado:</label>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              fetchQuestionnaires(e.target.value, filterVersion);
            }}
          >
            <option value="">Todos</option>
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
            <option value="archived">Archivado</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Versión:</label>
          <select
            value={filterVersion}
            onChange={(e) => {
              setFilterVersion(e.target.value);
              fetchQuestionnaires(filterStatus, e.target.value);
            }}
          >
            <option value="">Todas</option>
            <option value="initial">Evaluación Inicial</option>
            <option value="year4">Evaluación 4 Años</option>
            <option value="annual">Evaluación Anual</option>
            <option value="pre-novelty">Pre-Novedad</option>
          </select>
        </div>
      </div>

      <div className="dashboard-table-container">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Servicio</th>
              <th>Versión</th>
              <th>Nombre</th>
              <th>Criterios</th>
              <th>Estado</th>
              <th>Creado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuestionnaires.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  No hay cuestionarios registrados
                </td>
              </tr>
            ) : (
              filteredQuestionnaires.map((q) => (
                <tr key={q.id}>
                  <td className={styles.serviceName}>{q.service_name || 'N/A'}</td>
                  <td>{VERSION_LABELS[q.version_type as VersionType]}</td>
                  <td>{q.name || '—'}</td>
                  <td><span className={styles.badge}>{q.total_criteria}</span></td>
                  <td><span className={`${styles.statusBadge} ${styles[`status-${q.status}`]}`}>{q.status}</span></td>
                  <td>{new Date(q.created_at).toLocaleDateString('es-CO')}</td>
                  <td className={styles.actions}>
                    <button
                      onClick={() => handleDeleteQuestionnaire(q.id)}
                      className={styles.btnDelete}
                      title="Archivar cuestionario"
                    >
                      Archivar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para crear cuestionario */}
      {showCreateModal && (
        <div className="dashboard-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="dashboard-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dashboard-modal-header">
              <h2>Crear nuevo cuestionario</h2>
              <button className="dashboard-modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>

            <div className="dashboard-modal-body">
              <div className="dashboard-form-group">
                <label>Servicio de Salud *</label>
                <select
                  value={formData.serviceId}
                  onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                  disabled={creatingQuestionnaire}
                >
                  <option value="">Seleccionar servicio...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dashboard-form-group">
                <label>Tipo de Versión *</label>
                <select
                  value={formData.versionType}
                  onChange={(e) => setFormData({ ...formData, versionType: e.target.value as VersionType })}
                  disabled={creatingQuestionnaire}
                >
                  <option value="initial">{VERSION_LABELS.initial}</option>
                  <option value="year4">{VERSION_LABELS.year4}</option>
                  <option value="annual">{VERSION_LABELS.annual}</option>
                  <option value="pre-novelty">{VERSION_LABELS['pre-novelty']}</option>
                </select>
              </div>

              <div className="dashboard-form-group">
                <label>Nombre del Cuestionario (opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Evaluación Q1 2025"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={creatingQuestionnaire}
                />
              </div>

              {createError && <div style={{ fontSize: "12px", color: "var(--color-danger)", marginTop: "var(--space-2)" }}>{createError}</div>}
            </div>

            <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", padding: "var(--space-6)", borderTop: "1px solid var(--border-default)", background: "var(--neutral-50)" }}>
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={creatingQuestionnaire}
                className="btn-dashboard btn-dashboard-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateQuestionnaire}
                disabled={creatingQuestionnaire}
                className="btn-dashboard btn-dashboard-primary"
              >
                {creatingQuestionnaire ? 'Creando...' : 'Crear Cuestionario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuestionnairesPage;

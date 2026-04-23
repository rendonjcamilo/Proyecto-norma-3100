/**
 * Email Template Editor Component
 * Allows users to create and edit email notification templates
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EmailTemplateEditor.css';

interface EmailTemplate {
  id?: string;
  name?: string;
  template_name?: string;
  subject: string;
  body?: string;
  html_body?: string;
  text_body?: string;
  variables?: string[];
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

interface EmailTemplateEditorProps {
  userId: string;
  onSave?: (template: EmailTemplate) => void;
  templateId?: string;
}

const COMMON_VARIABLES = [
  '{{name}}',
  '{{email}}',
  '{{date}}',
  '{{time}}',
  '{{organizationName}}',
  '{{findingTitle}}',
  '{{status}}',
  '{{priority}}',
];

export const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({
  userId,
  onSave,
  templateId,
}) => {
  const [template, setTemplate] = useState<EmailTemplate>({
    name: '',
    subject: '',
    body: '',
    variables: [],
  });
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [mode, setMode] = useState<'new' | 'edit' | 'list'>('list');

  useEffect(() => {
    fetchTemplates();
  }, [userId]);

  useEffect(() => {
    if (templateId && mode === 'edit') {
      fetchTemplate(templateId);
    }
  }, [templateId, mode]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/multichannel/email/templates`, {
        headers: { 'x-user-id': userId },
      });
      const templates = (response.data.templates || []).map((t: any) => ({
        ...t,
        name: t.name || t.template_name,
        body: t.body || t.html_body,
      }));
      setTemplates(templates);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      setMessage('Error cargando plantillas');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplate = async (id: string) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/multichannel/email/templates/${id}`,
        {
          headers: { 'x-user-id': userId },
        }
      );
      setTemplate(response.data.template);
    } catch (error) {
      console.error('Failed to fetch template:', error);
      setMessage('Error cargando plantilla');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!template.name || !template.subject || !template.body) {
      setMessage('❌ Completa todos los campos requeridos');
      return;
    }

    try {
      setSaving(true);
      const url = template.id
        ? `/api/multichannel/email/templates/${template.id}`
        : `/api/multichannel/email/templates`;
      const method = template.id ? 'put' : 'post';

      const response = await axios({
        method,
        url,
        data: template,
        headers: { 'x-user-id': userId },
      });

      setMessage('✅ Plantilla guardada correctamente');
      setTemplate(response.data.template);
      onSave?.(response.data.template);
      setTimeout(() => {
        setMessage('');
        setMode('list');
        fetchTemplates();
      }, 1500);
    } catch (error) {
      console.error('Failed to save template:', error);
      setMessage('❌ Error al guardar plantilla');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta plantilla?')) {
      return;
    }

    try {
      await axios.delete(`/api/multichannel/email/templates/${id}`, {
        headers: { 'x-user-id': userId },
      });
      setMessage('✅ Plantilla eliminada correctamente');
      setTimeout(() => {
        setMessage('');
        fetchTemplates();
      }, 1500);
    } catch (error) {
      console.error('Failed to delete template:', error);
      setMessage('❌ Error al eliminar plantilla');
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('template-body') as HTMLTextAreaElement;
    if (textarea) {
      const cursorPos = textarea.selectionStart;
      const newBody =
        template.body.substring(0, cursorPos) +
        variable +
        template.body.substring(cursorPos);
      setTemplate({ ...template, body: newBody });
    }
  };

  const extractVariables = (text: string) => {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[0]);
    }
    return [...new Set(matches)];
  };

  const handleBodyChange = (value: string) => {
    const updatedTemplate = { ...template, body: value };
    updatedTemplate.variables = extractVariables(value);
    setTemplate(updatedTemplate);
  };

  if (loading && mode === 'list') {
    return <div className="template-loading">Cargando plantillas...</div>;
  }

  return (
    <div className="admin-dashboard">
      {/* Mode Navigation */}
      {mode !== 'list' && (
        <div className="editor-header">
          <button
            className="back-button"
            onClick={() => {
              setMode('list');
              setTemplate({ name: '', subject: '', body: '', variables: [] });
            }}
          >
            ← Volver a Plantillas
          </button>
          <h2>{mode === 'new' ? '📧 Nueva Plantilla Email' : '📧 Editar Plantilla Email'}</h2>
        </div>
      )}

      {/* Template List View */}
      {mode === 'list' && (
        <div className="templates-list">
          <div className="list-header">
            <h2>📧 Plantillas de Email</h2>
            <button
              className="btn-dashboard btn-dashboard-primary"
              onClick={() => {
                setTemplate({ name: '', subject: '', body: '', variables: [] });
                setMode('new');
              }}
            >
              + Nueva Plantilla
            </button>
          </div>

          {templates.length === 0 ? (
            <div className="no-templates">
              <p>No hay plantillas disponibles</p>
              <p>Crea tu primera plantilla para comenzar</p>
            </div>
          ) : (
            <div className="templates-grid">
              {templates.map((tpl) => (
                <div key={tpl.id} className="template-card">
                  <h3>{tpl.name}</h3>
                  <p className="template-subject">Asunto: {tpl.subject}</p>
                  <p className="template-preview">{tpl.body.substring(0, 80)}...</p>
                  {tpl.variables && tpl.variables.length > 0 && (
                    <div className="template-variables">
                      {tpl.variables.slice(0, 3).map((v, i) => (
                        <span key={i} className="variable-tag">{v}</span>
                      ))}
                      {tpl.variables.length > 3 && (
                        <span className="variable-tag">+{tpl.variables.length - 3}</span>
                      )}
                    </div>
                  )}
                  <div className="template-actions">
                    <button
                      className="btn btn-small btn-primary"
                      onClick={() => {
                        setTemplate(tpl);
                        setMode('edit');
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => tpl.id && handleDelete(tpl.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Template Editor View */}
      {(mode === 'new' || mode === 'edit') && (
        <div className="template-editor">
          <div className="editor-form">
            <div className="dashboard-form-group">
              <label>Nombre de la Plantilla *</label>
              <input
                type="text"
                value={template.name}
                onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                placeholder="ej: Bienvenida, Confirmación, Alerta"
                className="form-input"
              />
            </div>

            <div className="dashboard-form-group">
              <label>Asunto del Email *</label>
              <input
                type="text"
                value={template.subject}
                onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                placeholder="ej: Bienvenido a {{organizationName}}"
                className="form-input"
              />
            </div>

            <div className="dashboard-form-group">
              <label>Cuerpo del Email *</label>
              <div className="variables-toolbar">
                <span className="toolbar-label">Variables disponibles:</span>
                {COMMON_VARIABLES.map((variable) => (
                  <button
                    key={variable}
                    type="button"
                    className="variable-button"
                    onClick={() => insertVariable(variable)}
                  >
                    {variable}
                  </button>
                ))}
              </div>
              <textarea
                id="template-body"
                value={template.body}
                onChange={(e) => handleBodyChange(e.target.value)}
                placeholder="Escribe el contenido del email aquí... Usa {{variable}} para insertar variables dinámicas"
                className="form-textarea"
                rows={12}
              />
            </div>

            {template.variables && template.variables.length > 0 && (
              <div className="detected-variables">
                <h4>Variables Detectadas:</h4>
                <div className="variables-list">
                  {template.variables.map((v, i) => (
                    <span key={i} className="variable-tag">{v}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="editor-actions">
              <button
                className="btn-dashboard btn-dashboard-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Guardando...' : '💾 Guardar Plantilla'}
              </button>
              <button
                type="button"
                className="btn-dashboard btn-dashboard-secondary"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? '👁️ Ocultar Vista Previa' : '👁️ Vista Previa'}
              </button>
              {template.id && (
                <button
                  type="button"
                  className="btn-dashboard btn-dashboard-danger"
                  onClick={() => template.id && handleDelete(template.id)}
                >
                  🗑️ Eliminar
                </button>
              )}
            </div>
          </div>

          {/* Preview Pane */}
          {showPreview && (
            <div className="editor-preview">
              <div className="preview-header">
                <h3>Vista Previa del Email</h3>
              </div>
              <div className="preview-content">
                <div className="preview-subject">
                  <strong>Asunto:</strong> {template.subject || '(sin asunto)'}
                </div>
                <div className="preview-body">
                  {template.body || '(sin contenido)'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {message && <div className="editor-message">{message}</div>}
    </div>
  );
};

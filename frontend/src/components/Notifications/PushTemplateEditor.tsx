/**
 * Push Template Editor Component
 * Allows users to create and edit push notification templates
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PushTemplateEditor.css';

interface PushTemplate {
  id?: string;
  name: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  actionUrl?: string;
  variables?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface PushTemplateEditorProps {
  userId: string;
  onSave?: (template: PushTemplate) => void;
  templateId?: string;
}

const COMMON_VARIABLES = [
  '{{name}}',
  '{{title}}',
  '{{message}}',
  '{{date}}',
  '{{organizationName}}',
  '{{status}}',
  '{{priority}}',
  '{{id}}',
];

export const PushTemplateEditor: React.FC<PushTemplateEditorProps> = ({
  userId,
  onSave,
  templateId,
}) => {
  const [template, setTemplate] = useState<PushTemplate>({
    name: '',
    title: '',
    body: '',
    variables: [],
  });
  const [templates, setTemplates] = useState<PushTemplate[]>([]);
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
      const response = await axios.get(`/api/multichannel/push/templates`, {
        headers: { 'x-user-id': userId },
      });
      setTemplates(response.data.templates || []);
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
        `/api/multichannel/push/templates/${id}`,
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
    if (!template.name || !template.title || !template.body) {
      setMessage('❌ Completa todos los campos requeridos');
      return;
    }

    try {
      setSaving(true);
      const url = template.id
        ? `/api/multichannel/push/templates/${template.id}`
        : `/api/multichannel/push/templates`;
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
      await axios.delete(`/api/multichannel/push/templates/${id}`, {
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

  const insertVariable = (variable: string, field: 'title' | 'body') => {
    if (field === 'title') {
      const input = document.getElementById('push-title') as HTMLInputElement;
      if (input) {
        const cursorPos = input.selectionStart || 0;
        const newTitle =
          template.title.substring(0, cursorPos) +
          variable +
          template.title.substring(cursorPos);
        setTemplate({ ...template, title: newTitle });
      }
    } else {
      const textarea = document.getElementById('push-body') as HTMLTextAreaElement;
      if (textarea) {
        const cursorPos = textarea.selectionStart;
        const newBody =
          template.body.substring(0, cursorPos) +
          variable +
          template.body.substring(cursorPos);
        handleBodyChange(newBody);
      }
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
    const titleVars = extractVariables(template.title);
    const bodyVars = extractVariables(value);
    updatedTemplate.variables = [...new Set([...titleVars, ...bodyVars])];
    setTemplate(updatedTemplate);
  };

  const handleTitleChange = (value: string) => {
    const updatedTemplate = { ...template, title: value };
    const titleVars = extractVariables(value);
    const bodyVars = extractVariables(template.body);
    updatedTemplate.variables = [...new Set([...titleVars, ...bodyVars])];
    setTemplate(updatedTemplate);
  };

  if (loading && mode === 'list') {
    return <div className="template-loading">Cargando plantillas...</div>;
  }

  return (
    <div className="push-template-editor">
      {/* Mode Navigation */}
      {mode !== 'list' && (
        <div className="editor-header">
          <button
            className="back-button"
            onClick={() => {
              setMode('list');
              setTemplate({ name: '', title: '', body: '', variables: [] });
            }}
          >
            ← Volver a Plantillas
          </button>
          <h2>{mode === 'new' ? '🔔 Nueva Plantilla Push' : '🔔 Editar Plantilla Push'}</h2>
        </div>
      )}

      {/* Template List View */}
      {mode === 'list' && (
        <div className="templates-list">
          <div className="list-header">
            <h2>🔔 Plantillas de Notificaciones Push</h2>
            <button
              className="btn btn-primary"
              onClick={() => {
                setTemplate({ name: '', title: '', body: '', variables: [] });
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
                  <p className="template-title">Título: {tpl.title}</p>
                  <p className="template-preview">{tpl.body.substring(0, 60)}...</p>
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
            <div className="form-group">
              <label>Nombre de la Plantilla *</label>
              <input
                type="text"
                value={template.name}
                onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                placeholder="ej: Bienvenida, Alerta Crítica, Recordatorio"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Título de la Notificación *</label>
              <div className="variables-toolbar">
                <span className="toolbar-label">Variables:</span>
                {COMMON_VARIABLES.map((variable) => (
                  <button
                    key={variable}
                    type="button"
                    className="variable-button"
                    onClick={() => insertVariable(variable, 'title')}
                  >
                    {variable}
                  </button>
                ))}
              </div>
              <input
                id="push-title"
                type="text"
                value={template.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="ej: {{organizationName}} - {{status}}"
                className="form-input"
                maxLength={65}
              />
              <small className="field-hint">{template.title.length}/65 caracteres</small>
            </div>

            <div className="form-group">
              <label>Cuerpo de la Notificación *</label>
              <div className="variables-toolbar">
                <span className="toolbar-label">Variables:</span>
                {COMMON_VARIABLES.map((variable) => (
                  <button
                    key={variable}
                    type="button"
                    className="variable-button"
                    onClick={() => insertVariable(variable, 'body')}
                  >
                    {variable}
                  </button>
                ))}
              </div>
              <textarea
                id="push-body"
                value={template.body}
                onChange={(e) => handleBodyChange(e.target.value)}
                placeholder="Escribe el contenido de la notificación push... Usa {{variable}} para insertar variables dinámicas"
                className="form-textarea"
                rows={6}
                maxLength={240}
              />
              <small className="field-hint">{template.body.length}/240 caracteres</small>
            </div>

            <div className="form-group">
              <label>URL de Acción (Opcional)</label>
              <input
                type="url"
                value={template.actionUrl || ''}
                onChange={(e) => setTemplate({ ...template, actionUrl: e.target.value })}
                placeholder="https://ejemplo.com/path"
                className="form-input"
              />
              <small className="field-hint">URL a la que se dirigirá al hacer clic en la notificación</small>
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
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Guardando...' : '💾 Guardar Plantilla'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? '👁️ Ocultar Vista Previa' : '👁️ Vista Previa'}
              </button>
              {template.id && (
                <button
                  type="button"
                  className="btn btn-danger"
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
                <h3>Vista Previa del Push</h3>
              </div>
              <div className="preview-content">
                <div className="mobile-mockup">
                  <div className="mockup-status-bar">📱 14:35</div>
                  <div className="mockup-notification">
                    <div className="notification-icon">🔔</div>
                    <div className="notification-content">
                      <div className="notification-title">
                        {template.title || '(sin título)'}
                      </div>
                      <div className="notification-body">
                        {template.body || '(sin contenido)'}
                      </div>
                    </div>
                  </div>
                  <div className="mockup-screen">
                    <div className="screen-content">
                      <p>Contenido de la aplicación...</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="preview-footer">
                <p className="info-text">
                  {!template.title && !template.body
                    ? 'Completa el título y cuerpo para ver la vista previa'
                    : template.actionUrl
                    ? `✅ Dirigirá a: ${template.actionUrl}`
                    : 'ℹ️ Sin URL de acción configurada'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {message && <div className="editor-message">{message}</div>}
    </div>
  );
};

/**
 * SMS Template Editor Component
 * Allows users to create and edit SMS notification templates
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SmsTemplateEditor.css';

interface SmsTemplate {
  id?: string;
  name: string;
  content: string;
  variables?: string[];
  maxLength?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface SmsTemplateEditorProps {
  userId: string;
  onSave?: (template: SmsTemplate) => void;
  templateId?: string;
}

const COMMON_VARIABLES = [
  '{{name}}',
  '{{code}}',
  '{{link}}',
  '{{date}}',
  '{{time}}',
  '{{organizationName}}',
  '{{status}}',
  '{{priority}}',
];

const MAX_SMS_LENGTH = 160;
const MAX_SMS_LONG = 1600; // For concatenated SMS

export const SmsTemplateEditor: React.FC<SmsTemplateEditorProps> = ({
  userId,
  onSave,
  templateId,
}) => {
  const [template, setTemplate] = useState<SmsTemplate>({
    name: '',
    content: '',
    variables: [],
    maxLength: MAX_SMS_LENGTH,
  });
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
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
      const response = await axios.get(`/api/multichannel/sms/templates`, {
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
        `/api/multichannel/sms/templates/${id}`,
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
    if (!template.name || !template.content) {
      setMessage('❌ Completa todos los campos requeridos');
      return;
    }

    if (template.content.length > MAX_SMS_LONG) {
      setMessage(`❌ El SMS es demasiado largo (máximo ${MAX_SMS_LONG} caracteres)`);
      return;
    }

    try {
      setSaving(true);
      const url = template.id
        ? `/api/multichannel/sms/templates/${template.id}`
        : `/api/multichannel/sms/templates`;
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
      await axios.delete(`/api/multichannel/sms/templates/${id}`, {
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
    const textarea = document.getElementById('sms-content') as HTMLTextAreaElement;
    if (textarea) {
      const cursorPos = textarea.selectionStart;
      const newContent =
        template.content.substring(0, cursorPos) +
        variable +
        template.content.substring(cursorPos);
      handleContentChange(newContent);
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

  const handleContentChange = (value: string) => {
    const updatedTemplate = { ...template, content: value };
    updatedTemplate.variables = extractVariables(value);
    setTemplate(updatedTemplate);
  };

  const getSmsSegments = () => {
    return Math.ceil(template.content.length / MAX_SMS_LENGTH);
  };

  const getCharacterWarning = () => {
    const length = template.content.length;
    if (length === 0) return null;
    if (length <= MAX_SMS_LENGTH) {
      return { text: `${length}/${MAX_SMS_LENGTH}`, type: 'ok' };
    }
    if (length <= MAX_SMS_LONG) {
      return { text: `${length}/${MAX_SMS_LONG} (${getSmsSegments()} SMS)`, type: 'warning' };
    }
    return { text: `${length}/${MAX_SMS_LONG} (EXCEDIDO)`, type: 'error' };
  };

  if (loading && mode === 'list') {
    return <div className="template-loading">Cargando plantillas...</div>;
  }

  const charWarning = getCharacterWarning();

  return (
    <div className="admin-dashboard">
      {/* Mode Navigation */}
      {mode !== 'list' && (
        <div className="editor-header">
          <button
            className="back-button"
            onClick={() => {
              setMode('list');
              setTemplate({ name: '', content: '', variables: [], maxLength: MAX_SMS_LENGTH });
            }}
          >
            ← Volver a Plantillas
          </button>
          <h2>{mode === 'new' ? '💬 Nueva Plantilla SMS' : '💬 Editar Plantilla SMS'}</h2>
        </div>
      )}

      {/* Template List View */}
      {mode === 'list' && (
        <div className="templates-list">
          <div className="list-header">
            <h2>💬 Plantillas de SMS</h2>
            <button
              className="btn-dashboard btn-dashboard-primary"
              onClick={() => {
                setTemplate({
                  name: '',
                  content: '',
                  variables: [],
                  maxLength: MAX_SMS_LENGTH,
                });
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
                  <p className="template-preview">{tpl.content.substring(0, 60)}...</p>
                  <p className="template-length">
                    {tpl.content.length} caracteres
                    {tpl.content.length > MAX_SMS_LENGTH &&
                      ` (${Math.ceil(tpl.content.length / MAX_SMS_LENGTH)} SMS)`}
                  </p>
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
                placeholder="ej: Código OTP, Confirmación, Alerta"
                className="form-input"
              />
            </div>

            <div className="dashboard-form-group">
              <label>Contenido del SMS *</label>
              <div className="variables-toolbar">
                <span className="toolbar-label">Variables:</span>
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
                id="sms-content"
                value={template.content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Escribe el contenido del SMS... Usa {{variable}} para insertar variables dinámicas"
                className="form-textarea"
                rows={6}
              />
              {charWarning && (
                <div className={`character-counter counter-${charWarning.type}`}>
                  <span>{charWarning.text}</span>
                </div>
              )}
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
                disabled={saving || template.content.length > MAX_SMS_LONG}
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
                <h3>Vista Previa del SMS</h3>
                {charWarning && (
                  <span className={`preview-length counter-${charWarning.type}`}>
                    {charWarning.text}
                  </span>
                )}
              </div>
              <div className="preview-content">
                {template.content.split('\n').map((line, i) => (
                  <div key={i} className="preview-line">
                    {line}
                  </div>
                ))}
                {!template.content && <div className="preview-placeholder">(sin contenido)</div>}
              </div>
              <div className="preview-footer">
                <p className="info-text">
                  {template.content.length === 0
                    ? 'Escribe el contenido para ver vista previa'
                    : template.content.length <= MAX_SMS_LENGTH
                    ? '✅ Se enviará como 1 SMS'
                    : `⚠️ Se dividirá en ${getSmsSegments()} SMS`}
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

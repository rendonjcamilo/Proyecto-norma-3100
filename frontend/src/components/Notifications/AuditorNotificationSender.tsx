/**
 * Auditor Notification Sender
 * Permite al auditor enviar notificaciones por email a prestadores asignados
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi, providersApi, Provider, EmailTemplate } from '../../services/api';
import './AuditorNotificationSender.css';

interface PreviewData {
  providerName: string;
  date: string;
  auditorName: string;
}

export const AuditorNotificationSender: React.FC = () => {
  const { user } = useAuth();
  const [recipientMode, setRecipientMode] = useState<'provider' | 'direct'>('provider');
  const [directEmail, setDirectEmail] = useState('');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Cargar prestadores del auditor logueado al montar
  useEffect(() => {
    if (user?.id) loadProviders();
  }, [user?.id]);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Generate preview when template or variables change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selectedTemplate) {
      generatePreview();
    }
  }, [selectedTemplate, variables]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const response = await providersApi.getAuditorProviders(user!.id);
      setProviders(response.providers || []);
    } catch (err) {
      console.error('Error loading providers:', err);
      setMessage('Error cargando prestadores');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await notificationsApi.getEmailTemplates();
      setTemplates(response.templates || []);
      setSelectedTemplate('');
      setVariables({});
      setPreview('');
    } catch (err) {
      console.error('Error loading templates:', err);
      setMessage('Error cargando plantillas de email');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = () => {
    if (!selectedTemplate) {
      setPreview('');
      return;
    }

    const template = templates.find((t) => t.id === selectedTemplate) as EmailTemplate | undefined;
    if (!template) return;

    const selectedProv = providers.find((p) => p.id === selectedProvider);
    const providerName = selectedProv ? selectedProv.legal_name : (providers.length > 0 ? providers[0].legal_name : 'Prestador');
    const auditorName = user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : 'Auditor';

    const defaultVars: PreviewData = {
      providerName,
      date: new Date().toLocaleDateString('es-CO'),
      auditorName,
    };

    let text = template.html_body;

    // Replace variables
    Object.entries({ ...defaultVars, ...variables }).forEach(([key, value]) => {
      text = text.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    setPreview(text);
  };

  const handleVariableChange = (key: string, value: string) => {
    setVariables({ ...variables, [key]: value });
  };

  const handleSend = async () => {
    if (!selectedTemplate) {
      setMessage('Por favor selecciona una plantilla');
      setMessageType('error');
      return;
    }

    if (recipientMode === 'provider' && !selectedProvider) {
      setMessage('Por favor selecciona un prestador');
      setMessageType('error');
      return;
    }

    if (recipientMode === 'direct') {
      if (!directEmail.trim()) {
        setMessage('Por favor ingresa un correo electrónico');
        setMessageType('error');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(directEmail.trim())) {
        setMessage('El correo electrónico no es válido');
        setMessageType('error');
        return;
      }
    }

    try {
      setSending(true);
      const template = templates.find((t) => t.id === selectedTemplate) as EmailTemplate;

      if (recipientMode === 'direct') {
        await notificationsApi.sendDirectEmail({
          email: directEmail.trim(),
          templateName: template.template_name,
          userId: user?.id || 'auditor',
          providerId: selectedProvider || 'direct',
          variables,
        });
      } else {
        await notificationsApi.sendToProvider({
          providerId: selectedProvider,
          templateName: template.template_name,
          channel: 'email',
          variables,
        });
      }

      setMessage('✓ Notificación enviada exitosamente');
      setMessageType('success');
      setSelectedTemplate('');
      setVariables({});
      setPreview('');
      setDirectEmail('');
    } catch (err) {
      console.error('Error sending notification:', err);
      setMessage(`Error al enviar: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setMessageType('error');
    } finally {
      setSending(false);
    }
  };

  const selectedTemplateObj = templates.find((t) => t.id === selectedTemplate) as EmailTemplate | undefined;
  const templateVariables = selectedTemplateObj?.variables || [];

  return (
    <div className="auditor-notification-sender">
      <div className="ans-container">
        {/* Header */}
        <div className="ans-header">
          <span className="ans-header-badge">
            <svg width="6" height="6" viewBox="0 0 6 6" fill="none"><circle cx="3" cy="3" r="3" fill="#818cf8"/></svg>
            Comunicaciones
          </span>
          <h2>Enviar notificación</h2>
          <p>Comunícate con los prestadores asignados vía email</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`ans-message ans-message-${messageType}`}>
            {message}
          </div>
        )}

        <div className="ans-layout">
          {/* Left: Form */}
          <div className="ans-form">
            {/* Recipient Mode Toggle */}
            <div className="ans-form-group">
              <label>Destinatario</label>
              <div className="ans-toggle-group">
                <button
                  className={`ans-toggle-btn ${recipientMode === 'provider' ? 'active' : ''}`}
                  onClick={() => setRecipientMode('provider')}
                >
                  🏥 Prestador asignado
                </button>
                <button
                  className={`ans-toggle-btn ${recipientMode === 'direct' ? 'active' : ''}`}
                  onClick={() => setRecipientMode('direct')}
                >
                  ✉️ Correo libre
                </button>
              </div>
            </div>

            {/* Provider Select */}
            {recipientMode === 'provider' && (
              <div className="ans-form-group">
                <label htmlFor="provider">Prestador</label>
                <select
                  id="provider"
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  disabled={loading || providers.length === 0}
                >
                  <option value="">-- Seleccionar prestador --</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.legal_name} ({p.rut})
                    </option>
                  ))}
                </select>
                {!loading && providers.length === 0 && (
                  <small className="ans-hint">No tienes prestadores asignados</small>
                )}
              </div>
            )}

            {/* Direct Email Input */}
            {recipientMode === 'direct' && channel === 'email' && (
              <div className="ans-form-group">
                <label htmlFor="directEmail">Correo electrónico</label>
                <input
                  id="directEmail"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={directEmail}
                  onChange={(e) => setDirectEmail(e.target.value)}
                />
              </div>
            )}

            {/* Template Select */}
            <div className="ans-form-group">
              <label htmlFor="template">Plantilla</label>
              <select
                id="template"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                disabled={loading || templates.length === 0}
              >
                <option value="">Seleccionar plantilla...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.template_name}
                  </option>
                ))}
              </select>
              {templates.length === 0 && !loading && (
                <small className="ans-hint">No hay plantillas activas disponibles</small>
              )}
            </div>

            {/* Variables */}
            {selectedTemplate && templateVariables.length > 0 && (
              <div className="ans-form-group">
                <label>Variables Personalizadas</label>
                {templateVariables.map((varName) => (
                  <div key={varName} className="ans-variable-input">
                    <label>{`{{${varName}}}`}</label>
                    <input
                      type="text"
                      placeholder={`Valor para ${varName}`}
                      value={variables[varName] || ''}
                      onChange={(e) => handleVariableChange(varName, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Send Button */}
            <div className="ans-form-group">
              <button
                className="ans-send-btn"
                onClick={handleSend}
                disabled={
                  sending ||
                  !selectedTemplate ||
                  (recipientMode === 'provider' && !selectedProvider) ||
                  (recipientMode === 'direct' && !directEmail.trim())
                }
              >
                {sending ? '📤 Enviando...' : '📤 Enviar Notificación'}
              </button>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="ans-preview">
            <div className="ans-preview-header">
              <h3>Vista Previa</h3>
              <span className="ans-preview-type">📧 Email</span>
            </div>

            {selectedTemplate ? (
              <div className="ans-preview-content">
                <div className="ans-preview-subject">
                  <strong>Asunto:</strong>{' '}
                  {selectedTemplateObj?.subject || '—'}
                </div>
                <div className="ans-preview-body">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: preview || 'Selecciona plantilla y variables...',
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="ans-preview-empty">
                <p>Selecciona una plantilla para ver la vista previa</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

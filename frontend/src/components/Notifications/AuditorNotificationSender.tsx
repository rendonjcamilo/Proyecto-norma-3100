/**
 * Auditor Notification Sender
 * Permite al auditor enviar notificaciones por email/SMS a prestadores asignados
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi, providersApi, Provider, EmailTemplate, SmsTemplate } from '../../services/api';
import './AuditorNotificationSender.css';

interface PreviewData {
  providerName: string;
  date: string;
  auditorName: string;
}

export const AuditorNotificationSender: React.FC = () => {
  const { user } = useAuth();
  const [channel, setChannel] = useState<'email' | 'sms'>('email');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[] | SmsTemplate[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Load providers
  useEffect(() => {
    loadProviders();
  }, []);

  // Load templates when channel changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadTemplates();
  }, [channel]);

  // Generate preview when template or variables change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selectedTemplate) {
      generatePreview();
    }
  }, [selectedTemplate, variables, selectedProvider, channel]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      // Load only providers assigned to this auditor
      if (!user?.id) {
        setProviders([]);
        return;
      }
      const response = await providersApi.getAuditorProviders(user.id);
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
      const response =
        channel === 'email'
          ? await notificationsApi.getEmailTemplates()
          : await notificationsApi.getSmsTemplates();

      setTemplates(response.templates || []);
      setSelectedTemplate('');
      setVariables({});
      setPreview('');
    } catch (err) {
      console.error('Error loading templates:', err);
      setMessage(`Error cargando plantillas de ${channel === 'email' ? 'email' : 'SMS'}`);
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

    const template = templates.find((t) => t.id === selectedTemplate) as EmailTemplate | SmsTemplate | undefined;
    if (!template) return;

    const providerName =
      providers.find((p) => p.id === selectedProvider)?.legal_name || 'Prestador';
    const auditorName = user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : 'Auditor';

    const defaultVars: PreviewData = {
      providerName,
      date: new Date().toLocaleDateString('es-CO'),
      auditorName,
    };

    let text =
      channel === 'email'
        ? (template as EmailTemplate).html_body
        : (template as SmsTemplate).message_template;

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
    if (!selectedTemplate || !channel || providers.length === 0) {
      setMessage('Por favor selecciona plantilla y canal (debe tener al menos un prestador asignado)');
      setMessageType('error');
      return;
    }

    try {
      setSending(true);
      const template = templates.find((t) => t.id === selectedTemplate) as EmailTemplate | SmsTemplate;

      // Send to all assigned providers
      for (const provider of providers) {
        await notificationsApi.sendToProvider({
          providerId: provider.id,
          templateName: template.template_name,
          channel,
          variables,
        });
      }

      setMessage(`✓ Notificaciones enviadas a ${providers.length} prestador(es) exitosamente`);
      setMessageType('success');
      setSelectedTemplate('');
      setVariables({});
      setPreview('');
    } catch (err) {
      console.error('Error sending notification:', err);
      setMessage(`Error al enviar: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setMessageType('error');
    } finally {
      setSending(false);
    }
  };

  const selectedTemplateObj = templates.find((t) => t.id === selectedTemplate) as
    | EmailTemplate
    | SmsTemplate
    | undefined;
  const templateVariables = selectedTemplateObj?.variables || [];

  return (
    <div className="auditor-notification-sender">
      <div className="ans-container">
        {/* Header */}
        <div className="ans-header">
          <h2>Enviar notificación</h2>
          <p>Comunícate con los usuarios del prestador seleccionado</p>
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
            {/* Channel Toggle */}
            <div className="ans-form-group">
              <label>Canal de Comunicación</label>
              <div className="ans-toggle-group">
                <button
                  className={`ans-toggle-btn ${channel === 'email' ? 'active' : ''}`}
                  onClick={() => setChannel('email')}
                >
                  📧 Email
                </button>
                <button
                  className={`ans-toggle-btn ${channel === 'sms' ? 'active' : ''}`}
                  onClick={() => setChannel('sms')}
                >
                  📱 SMS
                </button>
              </div>
            </div>

            {/* Auditor Info */}
            <div className="ans-form-group">
              <label>Auditor</label>
              <div style={{
                padding: '12px',
                background: '#f0f0f0',
                borderRadius: '4px',
                color: '#333',
                fontWeight: '500',
              }}>
                👤 {user?.first_name} {user?.last_name} ({user?.email})
              </div>
              <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                Se enviará a todos tus prestadores asignados ({providers.length})
              </small>
            </div>

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
                disabled={sending || providers.length === 0 || !selectedTemplate}
              >
                {sending ? '📤 Enviando...' : '📤 Enviar Notificación'}
              </button>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="ans-preview">
            <div className="ans-preview-header">
              <h3>Vista Previa</h3>
              <span className="ans-preview-type">
                {channel === 'email' ? '📧 Email' : '📱 SMS'}
              </span>
            </div>

            {selectedTemplate ? (
              <div className="ans-preview-content">
                {channel === 'email' && (
                  <>
                    <div className="ans-preview-subject">
                      <strong>Asunto:</strong>{' '}
                      {(selectedTemplateObj as EmailTemplate)?.subject || '—'}
                    </div>
                    <div className="ans-preview-body">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: preview || 'Selecciona plantilla y variables...',
                        }}
                      />
                    </div>
                  </>
                )}
                {channel === 'sms' && (
                  <div className="ans-preview-sms">
                    <div className="ans-sms-bubble">{preview || 'Selecciona plantilla...'}</div>
                  </div>
                )}
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

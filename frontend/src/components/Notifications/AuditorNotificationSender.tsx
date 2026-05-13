/**
 * Auditor Notification Sender
 * Permite al auditor enviar notificaciones por email a prestadores asignados.
 * Modos: Plantilla (template) | Redactar (compose libre + adjuntos)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi, providersApi, Provider, EmailTemplate } from '../../services/api';
import { formatDate } from '@/utils/dateFormat';
import './AuditorNotificationSender.css';

interface PreviewData {
  providerName: string;
  date: string;
  auditorName: string;
}

interface AttachmentFile {
  filename: string;
  content: string; // base64
  contentType: string;
  size: number;
}

const MAX_ATTACHMENT_SIZE_MB = 5;
const MAX_ATTACHMENTS = 5;

export const AuditorNotificationSender: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modo principal: template | compose
  const [editorMode, setEditorMode] = useState<'template' | 'compose'>('template');

  // Campos comunes
  const [recipientMode, setRecipientMode] = useState<'provider' | 'direct'>('provider');
  const [directEmail, setDirectEmail] = useState('');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('');

  // Modo plantilla
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState('');

  // Modo redactar
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);

  // Estado general
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (user?.id) loadProviders();
  }, [user?.id]);

  useEffect(() => {
    if (editorMode === 'template') loadTemplates();
  }, [editorMode]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selectedTemplate) generatePreview();
  }, [selectedTemplate, variables, selectedProvider]);

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
    if (!selectedTemplate) { setPreview(''); return; }
    const template = templates.find((t) => t.id === selectedTemplate) as EmailTemplate | undefined;
    if (!template) return;

    const selectedProv = providers.find((p) => p.id === selectedProvider);
    const providerName = selectedProv ? selectedProv.legal_name : (providers.length > 0 ? providers[0].legal_name : 'Prestador');
    const auditorName = user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : 'Auditor';

    const defaultVars: PreviewData = { providerName, date: formatDate(new Date().toISOString()), auditorName };
    let text = template.html_body;
    Object.entries({ ...defaultVars, ...variables }).forEach(([key, value]) => {
      text = text.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    setPreview(text);
  };

  const handleVariableChange = (key: string, value: string) => {
    setVariables({ ...variables, [key]: value });
  };

  // ── Adjuntos ──────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_ATTACHMENTS - attachments.length;
    if (remaining <= 0) {
      setMessage(`Máximo ${MAX_ATTACHMENTS} archivos adjuntos`);
      setMessageType('error');
      return;
    }

    const toAdd = files.slice(0, remaining);
    const oversized = toAdd.filter(f => f.size > MAX_ATTACHMENT_SIZE_MB * 1024 * 1024);
    if (oversized.length > 0) {
      setMessage(`Algunos archivos superan ${MAX_ATTACHMENT_SIZE_MB} MB y fueron omitidos`);
      setMessageType('error');
    }

    const valid = toAdd.filter(f => f.size <= MAX_ATTACHMENT_SIZE_MB * 1024 * 1024);
    valid.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const base64 = dataUrl.split(',')[1];
        setAttachments(prev => [
          ...prev,
          { filename: file.name, content: base64, contentType: file.type || 'application/octet-stream', size: file.size },
        ]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input para permitir re-selección del mismo archivo
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ── Envío ─────────────────────────────────────────────────────
  const getRecipientEmail = (): string | null => {
    if (recipientMode === 'direct') return directEmail.trim() || null;
    const prov = providers.find(p => p.id === selectedProvider);
    return prov ? (prov as any).email || null : null;
  };

  const handleSend = async () => {
    setMessage('');

    // Validar destinatario
    if (recipientMode === 'provider' && !selectedProvider) {
      setMessage('Por favor selecciona un prestador'); setMessageType('error'); return;
    }
    if (recipientMode === 'direct') {
      if (!directEmail.trim()) { setMessage('Por favor ingresa un correo electrónico'); setMessageType('error'); return; }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(directEmail.trim())) { setMessage('El correo electrónico no es válido'); setMessageType('error'); return; }
    }

    try {
      setSending(true);

      if (editorMode === 'template') {
        if (!selectedTemplate) { setMessage('Por favor selecciona una plantilla'); setMessageType('error'); return; }
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
      } else {
        // Modo redactar
        if (!composeSubject.trim()) { setMessage('Por favor escribe el asunto'); setMessageType('error'); return; }
        if (!composeBody.trim()) { setMessage('Por favor escribe el mensaje'); setMessageType('error'); return; }

        let toEmail = directEmail.trim();
        if (recipientMode === 'provider') {
          const prov = providers.find(p => p.id === selectedProvider);
          toEmail = (prov as any)?.email || '';
          if (!toEmail) {
            // Intentar envío a todos los usuarios del prestador vía endpoint auditor/send
            // Si no hay email en el objeto provider, usamos compose con el prestador
            setMessage('No se encontró email del prestador. Usa modo "Correo libre" para especificarlo.');
            setMessageType('error');
            setSending(false);
            return;
          }
        }

        const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#334155">
<p style="white-space:pre-wrap;font-size:14px;line-height:1.7">${composeBody.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
<hr style="border:none;border-top:1px solid #e2e8f0;margin-top:32px"/>
<p style="font-size:11px;color:#94a3b8">Sistema de Gestión de Cumplimiento — Norma 3100</p>
</body></html>`;

        await notificationsApi.composeEmail({
          to: toEmail,
          subject: composeSubject.trim(),
          html,
          userId: user?.id || '',
          providerId: selectedProvider || undefined,
          attachments: attachments.length > 0 ? attachments : undefined,
        });
      }

      setMessage('✓ Correo enviado exitosamente');
      setMessageType('success');
      // Reset
      setSelectedTemplate(''); setVariables({}); setPreview('');
      setDirectEmail(''); setComposeSubject(''); setComposeBody(''); setAttachments([]);
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

  const canSend = !sending && (
    (recipientMode === 'provider' && !!selectedProvider) ||
    (recipientMode === 'direct' && !!directEmail.trim())
  ) && (
    editorMode === 'template' ? !!selectedTemplate :
    (!!composeSubject.trim() && !!composeBody.trim())
  );

  return (
    <div className="auditor-notification-sender">
      <div className="ans-container">
        {/* Header */}
        <div className="ans-header">
          <span className="ans-header-badge">
            <svg width="6" height="6" viewBox="0 0 6 6" fill="none"><circle cx="3" cy="3" r="3" fill="#A78BFA"/></svg>
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

            {/* Modo principal: Plantilla / Redactar */}
            <div className="ans-form-group">
              <label>Modo de envío</label>
              <div className="ans-toggle-group">
                <button
                  className={`ans-toggle-btn ${editorMode === 'template' ? 'active' : ''}`}
                  onClick={() => { setEditorMode('template'); setMessage(''); }}
                >
                  📋 Con plantilla
                </button>
                <button
                  className={`ans-toggle-btn ${editorMode === 'compose' ? 'active' : ''}`}
                  onClick={() => { setEditorMode('compose'); setMessage(''); }}
                >
                  ✏️ Redactar libre
                </button>
              </div>
            </div>

            {/* Destinatario */}
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
            {recipientMode === 'direct' && (
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

            {/* ── MODO PLANTILLA ─────────────────────────────── */}
            {editorMode === 'template' && (
              <>
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

                {selectedTemplate && templateVariables.length > 0 && (
                  <div className="ans-form-group">
                    <label>Variables personalizadas</label>
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
              </>
            )}

            {/* ── MODO REDACTAR ──────────────────────────────── */}
            {editorMode === 'compose' && (
              <>
                <div className="ans-form-group">
                  <label htmlFor="composeSubject">Asunto *</label>
                  <input
                    id="composeSubject"
                    type="text"
                    placeholder="Ej: Recordatorio de evaluación pendiente"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    maxLength={200}
                  />
                </div>

                <div className="ans-form-group">
                  <label htmlFor="composeBody">
                    Mensaje *
                    <span className="ans-char-count">{composeBody.length}/2000</span>
                  </label>
                  <textarea
                    id="composeBody"
                    className="ans-compose-textarea"
                    placeholder="Escribe aquí el contenido del correo..."
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    maxLength={2000}
                    rows={7}
                  />
                </div>

                {/* Adjuntos */}
                <div className="ans-form-group">
                  <label>
                    Archivos adjuntos
                    <span className="ans-hint-inline">(máx. {MAX_ATTACHMENTS} archivos · {MAX_ATTACHMENT_SIZE_MB} MB c/u)</span>
                  </label>

                  {attachments.length < MAX_ATTACHMENTS && (
                    <>
                      <button
                        type="button"
                        className="ans-file-btn"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        📎 Adjuntar archivo
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip,.txt"
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                      />
                    </>
                  )}

                  {attachments.length > 0 && (
                    <div className="ans-attachments-list">
                      {attachments.map((att, i) => (
                        <div key={i} className="ans-attachment-item">
                          <span className="ans-attachment-name">📄 {att.filename}</span>
                          <span className="ans-attachment-size">{formatBytes(att.size)}</span>
                          <button
                            type="button"
                            className="ans-attachment-remove"
                            onClick={() => removeAttachment(i)}
                            title="Quitar adjunto"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Botón enviar */}
            <div className="ans-form-group">
              <button
                className="ans-send-btn"
                onClick={handleSend}
                disabled={!canSend}
              >
                {sending ? '📤 Enviando...' : '📤 Enviar correo'}
              </button>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="ans-preview">
            <div className="ans-preview-header">
              <h3>Vista Previa</h3>
              <span className="ans-preview-type">📧 Email</span>
            </div>

            {editorMode === 'template' && selectedTemplate ? (
              <div className="ans-preview-content">
                <div className="ans-preview-subject">
                  <strong>Asunto:</strong>{' '}{selectedTemplateObj?.subject || '—'}
                </div>
                <div className="ans-preview-body">
                  <div dangerouslySetInnerHTML={{ __html: preview || 'Selecciona plantilla y variables...' }} />
                </div>
              </div>
            ) : editorMode === 'compose' && (composeSubject || composeBody) ? (
              <div className="ans-preview-content">
                <div className="ans-preview-subject">
                  <strong>Asunto:</strong>{' '}{composeSubject || '—'}
                </div>
                <div className="ans-preview-body ans-compose-preview">
                  {composeBody || <em style={{ color: '#94a3b8' }}>Sin contenido aún...</em>}
                </div>
                {attachments.length > 0 && (
                  <div className="ans-preview-attachments">
                    <strong>Adjuntos ({attachments.length}):</strong>
                    {attachments.map((a, i) => (
                      <span key={i} className="ans-preview-att-chip">📄 {a.filename}</span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="ans-preview-empty">
                <p>
                  {editorMode === 'template'
                    ? 'Selecciona una plantilla para ver la vista previa'
                    : 'Escribe el asunto y mensaje para ver la vista previa'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

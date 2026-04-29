/**
 * Multi-Channel Notification Preferences Component
 * Allows users to configure email, SMS, and push notification settings
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MultiChannelPreferences.css';

interface UserPreferences {
  userId: string;
  emailEnabled: boolean;
  emailAddress?: string;
  emailVerified: boolean;
  emailQuietHoursStart?: string;
  emailQuietHoursEnd?: string;
  smsEnabled: boolean;
  phoneNumber?: string;
  smsVerified: boolean;
  smsQuietHoursStart?: string;
  smsQuietHoursEnd?: string;
  pushEnabled: boolean;
  pushQuietHoursStart?: string;
  pushQuietHoursEnd?: string;
}

interface MultiChannelPreferencesProps {
  userId: string;
  onSave?: (preferences: UserPreferences) => void;
}

export const MultiChannelPreferences: React.FC<MultiChannelPreferencesProps> = ({
  userId,
  onSave,
}) => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'email' | 'push'>('email');

  useEffect(() => {
    fetchPreferences();
  }, [userId]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/notifications/channels/preferences`,
        {
          headers: {
            'x-user-id': userId,
          },
        }
      );
      setPreferences(response.data);
      setMessage('');
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
      setMessage('Error cargando preferencias');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      await axios.put(
        `/api/notifications/channels/preferences`,
        preferences,
        {
          headers: {
            'x-user-id': userId,
          },
        }
      );
      setMessage('✅ Preferencias guardadas correctamente');
      onSave?.(preferences);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setMessage('❌ Error al guardar preferencias');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof UserPreferences, value: any) => {
    setPreferences((prev) =>
      prev ? { ...prev, [key]: value } : null
    );
  };

  if (loading) {
    return <div className="preferences-loading">Cargando preferencias...</div>;
  }

  if (!preferences) {
    return <div className="preferences-error">No se pudieron cargar las preferencias</div>;
  }

  return (
    <div className="multichannel-preferences">
      <div className="preferences-header">
        <h2>Preferencias de Notificaciones</h2>
        <p>Configura cómo deseas recibir notificaciones en cada canal</p>
      </div>

      <div className="preferences-tabs">
        <button
          className={`tab-button ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          📧 Email
        </button>
        <button
          className={`tab-button ${activeTab === 'push' ? 'active' : ''}`}
          onClick={() => setActiveTab('push')}
        >
          🔔 Push
        </button>
      </div>

      <div className="preferences-content">
        {/* Email Tab */}
        {activeTab === 'email' && (
          <div className="preference-section">
            <h3>Preferencias de Email</h3>

            <div className="preference-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={preferences.emailEnabled}
                  onChange={(e) =>
                    updatePreference('emailEnabled', e.target.checked)
                  }
                />
                <span>Habilitar notificaciones por email</span>
              </label>
            </div>

            {preferences.emailEnabled && (
              <>
                <div className="preference-group">
                  <label>Dirección de correo:</label>
                  <input
                    type="email"
                    value={preferences.emailAddress || ''}
                    onChange={(e) =>
                      updatePreference('emailAddress', e.target.value)
                    }
                    placeholder="correo@example.com"
                  />
                  {preferences.emailVerified && (
                    <span className="verified-badge">✓ Verificado</span>
                  )}
                </div>

                <div className="preference-group">
                  <label>Horas silenciosas (opcional):</label>
                  <div className="time-range">
                    <input
                      type="time"
                      value={preferences.emailQuietHoursStart || ''}
                      onChange={(e) =>
                        updatePreference(
                          'emailQuietHoursStart',
                          e.target.value
                        )
                      }
                      placeholder="Inicio"
                    />
                    <span>a</span>
                    <input
                      type="time"
                      value={preferences.emailQuietHoursEnd || ''}
                      onChange={(e) =>
                        updatePreference('emailQuietHoursEnd', e.target.value)
                      }
                      placeholder="Fin"
                    />
                  </div>
                  <small>
                    No recibirás notificaciones en este rango horario
                  </small>
                </div>
              </>
            )}
          </div>
        )}

        {/* Push Tab */}
        {activeTab === 'push' && (
          <div className="preference-section">
            <h3>Preferencias de Notificaciones Push</h3>

            <div className="preference-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={preferences.pushEnabled}
                  onChange={(e) =>
                    updatePreference('pushEnabled', e.target.checked)
                  }
                />
                <span>Habilitar notificaciones push</span>
              </label>
            </div>

            {preferences.pushEnabled && (
              <div className="preference-group">
                <label>Horas silenciosas (opcional):</label>
                <div className="time-range">
                  <input
                    type="time"
                    value={preferences.pushQuietHoursStart || ''}
                    onChange={(e) =>
                      updatePreference('pushQuietHoursStart', e.target.value)
                    }
                    placeholder="Inicio"
                  />
                  <span>a</span>
                  <input
                    type="time"
                    value={preferences.pushQuietHoursEnd || ''}
                    onChange={(e) =>
                      updatePreference('pushQuietHoursEnd', e.target.value)
                    }
                    placeholder="Fin"
                  />
                </div>
                <small>
                  No recibirás notificaciones push en este rango horario
                </small>
              </div>
            )}
          </div>
        )}
      </div>

      {message && <div className="preferences-message">{message}</div>}

      <div className="preferences-actions">
        <button
          className="btn-dashboard btn-dashboard-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
        <button className="btn-dashboard btn-dashboard-secondary" onClick={fetchPreferences}>
          Descartar Cambios
        </button>
      </div>
    </div>
  );
};

/**
 * TopBar Component
 * Professional top navigation with breadcrumbs, search and quick actions
 */

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { ProviderSelector } from './ProviderSelector';
import { Provider } from '../../context/ProviderContext';
import './TopBar.css';

interface TopBarProps {
  onMenuToggle: () => void;
  rightSlot?: React.ReactNode;
  providers?: Provider[];
  selectedProvider?: Provider | null;
  onSelectProvider?: (provider: Provider) => void;
  userRole?: string;
}

const routeTitles: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Dashboard de Cumplimiento',
    subtitle: 'Vista general del estado de cumplimiento Norma 3100',
  },
  '/findings': {
    title: 'Hallazgos',
    subtitle: 'Gestión de hallazgos y no conformidades',
  },
  '/assessments': {
    title: 'Evaluaciones',
    subtitle: 'Auditorías y evaluaciones de cumplimiento',
  },
  '/invima': {
    title: 'Registros INVIMA',
    subtitle: 'Estándar TSMD — Medicamentos, Dispositivos Médicos e Insumos',
  },
  '/providers': {
    title: 'Prestadores',
    subtitle: 'Administración de proveedores',
  },
  '/notifications': {
    title: 'Centro de Notificaciones',
    subtitle: 'Gestión de notificaciones y comunicaciones',
  },
  '/notifications/email-templates': {
    title: 'Plantillas de Email',
    subtitle: 'Crear y editar plantillas de correo electrónico',
  },
  '/notifications/sms-templates': {
    title: 'Plantillas de SMS',
    subtitle: 'Crear y editar plantillas de mensajes SMS',
  },
  '/notifications/push-templates': {
    title: 'Plantillas Push',
    subtitle: 'Crear y editar notificaciones push',
  },
  '/notifications/preferences': {
    title: 'Preferencias',
    subtitle: 'Configuración de canales multicanal',
  },
  '/notifications/analytics': {
    title: 'Analíticas de Notificaciones',
    subtitle: 'Métricas y rendimiento de envíos',
  },
  '/notifications/delivery-status': {
    title: 'Estado de Entregas',
    subtitle: 'Seguimiento en tiempo real de notificaciones',
  },
};

export const TopBar: React.FC<TopBarProps> = ({
  onMenuToggle,
  rightSlot,
  providers = [],
  selectedProvider = null,
  onSelectProvider = () => {},
  userRole = 'provider_admin',
}) => {
  const location = useLocation();
  const meta = routeTitles[location.pathname] || routeTitles['/'];
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-menu-btn"
          onClick={onMenuToggle}
          aria-label="Alternar menú"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <h1 className="topbar-title">{meta.title}</h1>

        {providers.length > 0 && userRole !== 'super_admin' && (
          <ProviderSelector
            providers={providers}
            selectedProvider={selectedProvider}
            onSelectProvider={onSelectProvider}
          />
        )}
      </div>

      <div className="topbar-center">
        <div className="topbar-search">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar hallazgos, proveedores, evaluaciones..."
            className="search-input"
          />
          <kbd className="search-kbd">⌘K</kbd>
        </div>
      </div>

      <div className="topbar-right">
        <button type="button" className="topbar-icon-btn" title="Ayuda" onClick={() => setShowHelp(!showHelp)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>
        <button type="button" className="topbar-icon-btn" title="Configuración" onClick={() => setShowSettings(!showSettings)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m17.66-6.34l-4.24 4.24m-6.84 6.84l-4.24 4.24m0-15.32l4.24 4.24m6.84 6.84l4.24 4.24" />
          </svg>
        </button>
        <div className="topbar-divider" />
        {rightSlot}
      </div>

      {/* Help Panel */}
      {showHelp && (
        <>
          <div className="topbar-overlay" onClick={() => setShowHelp(false)} />
          <div className="topbar-panel help-panel">
            <div className="panel-header">
              <h2>Centro de Ayuda</h2>
              <button className="panel-close" onClick={() => setShowHelp(false)}>×</button>
            </div>
            <div className="panel-content">
              <div className="help-section">
                <h3>🚀 Inicio Rápido</h3>
                <p>Bienvenido a Norma 3100 Compliance System. Aquí encontrarás información sobre cómo usar la plataforma.</p>
              </div>

              <div className="help-section">
                <h3>📋 Hallazgos</h3>
                <p>Registra, gestiona y da seguimiento a los hallazgos de cumplimiento. Cada hallazgo incluye severidad, estado y fecha de vencimiento.</p>
                <strong>Acciones disponibles:</strong>
                <ul>
                  <li>Crear nuevo hallazgo</li>
                  <li>Cambiar estado (Abierto → En Progreso → Resuelto)</li>
                  <li>Asignar responsables</li>
                  <li>Adjuntar evidencia</li>
                </ul>
              </div>

              <div className="help-section">
                <h3>📊 Evaluaciones</h3>
                <p>Realiza auditorías y evaluaciones de cumplimiento Norma 3100 a tus proveedores y procesos internos.</p>
              </div>

              <div className="help-section">
                <h3>📄 Matriz Documental</h3>
                <p>Carga y gestiona documentación requerida por la Norma 3100. El sistema valida automáticamente fechas de vencimiento.</p>
              </div>

              <div className="help-section">
                <h3>📈 Reportes</h3>
                <p>Descarga reportes ejecutivos en PDF o Excel con métricas de cumplimiento, hallazgos y recomendaciones.</p>
              </div>

              <div className="help-section">
                <h3>🔐 Roles y Permisos</h3>
                <ul>
                  <li><strong>Super Admin:</strong> Acceso total a todas las funciones</li>
                  <li><strong>Auditor:</strong> Crear evaluaciones, ver reportes</li>
                  <li><strong>Admin Prestador:</strong> Gestionar su proveedor únicamente</li>
                  <li><strong>Visualizador:</strong> Solo lectura</li>
                </ul>
              </div>

              <div className="help-section">
                <h3>❓ Preguntas Frecuentes</h3>
                <p><strong>¿Cómo creo un hallazgo?</strong><br />Ve a la sección &quot;Hallazgos&quot; y haz clic en &quot;Nuevo Hallazgo&quot;.</p>
                <p><strong>¿Cuáles son los niveles de severidad?</strong><br />Baja, Media, Alta y Crítica.</p>
                <p><strong>¿Cómo descargo un reporte?</strong><br />Ve a &quot;Reportes&quot; y selecciona PDF o Excel.</p>
              </div>

              <div className="help-section">
                <h3>📞 Soporte</h3>
                <p>Para más información, contáctanos a: <strong>support@norma3100.com</strong></p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <>
          <div className="topbar-overlay" onClick={() => setShowSettings(false)} />
          <div className="topbar-panel settings-panel">
            <div className="panel-header">
              <h2>Configuración</h2>
              <button className="panel-close" onClick={() => setShowSettings(false)}>×</button>
            </div>
            <div className="panel-content">
              <div className="settings-section">
                <label className="settings-label">
                  <input type="checkbox" defaultChecked />
                  <span>Notificaciones por correo</span>
                </label>
                <p className="settings-hint">Recibe actualizaciones de hallazgos y evaluaciones</p>
              </div>

              <div className="settings-section">
                <label className="settings-label">
                  <input type="checkbox" defaultChecked />
                  <span>Notificaciones por navegador</span>
                </label>
                <p className="settings-hint">Alertas en tiempo real en el sistema</p>
              </div>

              <div className="settings-section">
                <label className="settings-label">
                  <input type="checkbox" />
                  <span>Auto-actualizar datos (cada 5 min)</span>
                </label>
                <p className="settings-hint">Mantén los datos siempre actualizados</p>
              </div>

              <div className="settings-section">
                <label className="settings-label">
                  <input type="checkbox" defaultChecked />
                  <span>Modo compacto</span>
                </label>
                <p className="settings-hint">Interfaz más compacta</p>
              </div>

              <div className="settings-section">
                <h4>Idioma</h4>
                <select style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  marginTop: '8px',
                }}>
                  <option>Español</option>
                  <option>English</option>
                  <option>Português</option>
                </select>
              </div>

              <div className="settings-section">
                <h4>Zona Horaria</h4>
                <select style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  marginTop: '8px',
                }}>
                  <option>America/Bogota (UTC-5)</option>
                  <option>America/New_York (UTC-4)</option>
                  <option>Europe/Madrid (UTC+1)</option>
                </select>
              </div>

              <div className="settings-section">
                <h4>Apariencia</h4>
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setTheme('light')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: theme === 'light' ? '2px solid #0052cc' : '1px solid #ddd',
                      background: theme === 'light' ? 'white' : '#f5f5f5',
                      color: theme === 'light' ? '#0052cc' : '#666',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: theme === 'light' ? 500 : 400,
                      transition: 'all 0.2s',
                    }}>
                    ☀️ Claro
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: theme === 'dark' ? '2px solid #0052cc' : '1px solid #ddd',
                      background: theme === 'dark' ? 'white' : '#f5f5f5',
                      color: theme === 'dark' ? '#0052cc' : '#666',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: theme === 'dark' ? 500 : 400,
                      transition: 'all 0.2s',
                    }}>
                    🌙 Oscuro
                  </button>
                  <button
                    onClick={() => setTheme('auto')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: theme === 'auto' ? '2px solid #0052cc' : '1px solid #ddd',
                      background: theme === 'auto' ? 'white' : '#f5f5f5',
                      color: theme === 'auto' ? '#0052cc' : '#666',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: theme === 'auto' ? 500 : 400,
                      transition: 'all 0.2s',
                    }}>
                    🔄 Auto
                  </button>
                </div>
                <p style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  {theme === 'auto' ? 'Tema: Automático (según sistema)' : `Tema: ${theme === 'light' ? 'Claro' : 'Oscuro'}`}
                </p>
              </div>

              <button style={{
                width: '100%',
                padding: '10px',
                marginTop: '16px',
                background: '#0052cc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 500,
              }}>
                Guardar Cambios
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

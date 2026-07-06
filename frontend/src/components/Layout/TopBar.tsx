import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { ProviderSelector } from './ProviderSelector';
import { Provider } from '../../context/ProviderContext';
import { inAppNotificationsApi, InAppNotification } from '../../services/api';
import { formatTimeAgo } from '@/utils/dateFormat';
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
  '/': { title: 'Dashboard de Cumplimiento', subtitle: 'Vista general del estado de cumplimiento Norma 3100' },
  '/findings': { title: 'Hallazgos', subtitle: 'Gestión de hallazgos y no conformidades' },
  '/assessments': { title: 'Evaluaciones', subtitle: 'Auditorías y evaluaciones de cumplimiento' },
  '/invima': { title: 'Registros INVIMA', subtitle: 'Estándar TSMD — Medicamentos, Dispositivos Médicos e Insumos' },
  '/providers': { title: 'Prestadores', subtitle: 'Administración de proveedores' },
  '/notifications': { title: 'Centro de Notificaciones', subtitle: 'Gestión de notificaciones y comunicaciones' },
  '/notifications/email-templates': { title: 'Plantillas de Email', subtitle: 'Crear y editar plantillas de correo electrónico' },
  '/notifications/push-templates': { title: 'Plantillas Push', subtitle: 'Crear y editar notificaciones push' },
  '/notifications/preferences': { title: 'Preferencias', subtitle: 'Configuración de canales multicanal' },
  '/notifications/analytics': { title: 'Analíticas de Notificaciones', subtitle: 'Métricas y rendimiento de envíos' },
  '/notifications/delivery-status': { title: 'Estado de Entregas', subtitle: 'Seguimiento en tiempo real de notificaciones' },
};

const ALL_NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: '📊', description: 'Vista general del cumplimiento Norma 3100', roles: ['super_admin', 'auditor', 'provider_admin'] },
  { label: 'Evaluaciones', path: '/assessments', icon: '📋', description: 'Auditorías y evaluaciones de cumplimiento', roles: ['super_admin', 'auditor', 'provider_admin'] },
  { label: 'Hallazgos', path: '/findings', icon: '🔍', description: 'Gestión de hallazgos y no conformidades', roles: ['super_admin', 'auditor', 'provider_admin'] },
  { label: 'Prestadores', path: '/providers', icon: '🏥', description: 'Administración de prestadores de salud', roles: ['auditor'] },
  { label: 'Reportes', path: '/reports', icon: '📈', description: 'Descarga de reportes ejecutivos PDF / Excel', roles: ['auditor', 'provider_admin'] },
  { label: 'Documentos', path: '/documents', icon: '📄', description: 'Matriz documental Norma 3100', roles: ['super_admin', 'auditor', 'provider_admin'] },
  { label: 'Notificaciones', path: '/notifications', icon: '🔔', description: 'Centro de notificaciones y comunicaciones', roles: ['super_admin', 'auditor', 'provider_admin'] },
  { label: 'Usuarios', path: '/users', icon: '👥', description: 'Gestión de usuarios y roles del sistema', roles: ['super_admin'] },
  { label: 'Cuestionarios', path: '/questionnaires', icon: '📝', description: 'Cuestionarios de evaluación (512 criterios)', roles: ['super_admin'] },
  { label: 'INVIMA', path: '/invima', icon: '💊', description: 'Registros sanitarios INVIMA — dispositivos y medicamentos', roles: ['auditor', 'provider_admin'] },
  { label: 'REPS', path: '/reps', icon: '🏛️', description: 'Registro Especial de Prestadores de Salud (MINSALUD)', roles: ['auditor', 'provider_admin'] },
  { label: 'Nueva Evaluación', path: '/assessments/new', icon: '➕', description: 'Crear una nueva evaluación de cumplimiento', roles: ['super_admin', 'auditor', 'provider_admin'] },
  { label: 'Plantillas de Email', path: '/notifications/email-templates', icon: '✉️', description: 'Crear y editar plantillas de correo', roles: ['super_admin', 'auditor'] },
  { label: 'Preferencias de Notificación', path: '/notifications/preferences', icon: '⚙️', description: 'Configurar canales de notificación', roles: ['super_admin', 'auditor', 'provider_admin'] },
  { label: 'Analíticas de Notificaciones', path: '/notifications/analytics', icon: '📉', description: 'Métricas y rendimiento de envíos', roles: ['super_admin', 'auditor'] },
];

export const TopBar: React.FC<TopBarProps> = ({
  onMenuToggle,
  rightSlot,
  providers = [],
  selectedProvider = null,
  onSelectProvider = () => {},
  userRole = 'provider_admin',
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const meta = routeTitles[location.pathname] || routeTitles['/'];
  const { theme, setTheme } = useTheme();

  // Panels
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Command palette
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Notification bell state
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifPanelRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await inAppNotificationsApi.getUnreadCount();
      setUnreadCount(res.count ?? 0);
    } catch { /* silencioso — no hay sesión activa */ }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await inAppNotificationsApi.getAll();
      setNotifications(res.notifications ?? []);
    } catch { /* silencioso */ }
    finally { setNotifLoading(false); }
  }, []);

  // Diferir el primer fetch 4s para no competir con las llamadas de carga inicial de la página
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const initial = setTimeout(() => {
      void fetchUnreadCount();
      interval = setInterval(fetchUnreadCount, 60_000);
    }, 4000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [fetchUnreadCount]);

  // Cargar lista completa al abrir el panel
  useEffect(() => {
    if (showNotifications) fetchNotifications();
  }, [showNotifications, fetchNotifications]);

  // Cerrar panel al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifications]);

  const handleMarkAllRead = async () => {
    await inAppNotificationsApi.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleMarkRead = async (id: string) => {
    await inAppNotificationsApi.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const severityColor: Record<string, string> = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#d97706',
    low: '#6255A0',
  };


  // Settings state (persisted in localStorage)
  const [emailNotifs, setEmailNotifs] = useState(() => localStorage.getItem('pref_email_notifs') !== 'false');
  const [browserNotifs, setBrowserNotifs] = useState(() => localStorage.getItem('pref_browser_notifs') !== 'false');
  const [autoUpdate, setAutoUpdate] = useState(() => localStorage.getItem('pref_auto_update') === 'true');
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem('pref_compact') === 'true');
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Apply compact mode to body
  useEffect(() => {
    document.body.classList.toggle('compact-mode', compactMode);
  }, [compactMode]);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowHelp(false);
        setShowSettings(false);
        setSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setShowHelp(false);
        setShowSettings(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Focus input when palette opens
  useEffect(() => {
    if (searchOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setTimeout(() => searchInputRef.current?.focus(), 30);
    }
  }, [searchOpen]);

  // Filter nav items by role and query
  const navItems = ALL_NAV_ITEMS.filter(item => item.roles.includes(userRole));
  const filteredItems = searchQuery.trim()
    ? navItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : navItems;

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filteredItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      navigate(filteredItems[selectedIndex].path);
      setSearchOpen(false);
    } else if (e.key === 'Escape') {
      setSearchOpen(false);
    }
  };

  const saveSettings = () => {
    localStorage.setItem('pref_email_notifs', String(emailNotifs));
    localStorage.setItem('pref_browser_notifs', String(browserNotifs));
    localStorage.setItem('pref_auto_update', String(autoUpdate));
    localStorage.setItem('pref_compact', String(compactMode));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const shortcutLabel = isMac ? '⌘K' : 'Ctrl+K';

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

      {/* Search trigger — opens command palette */}
      <div className="topbar-center">
        <button
          type="button"
          className="topbar-search-trigger"
          onClick={() => setSearchOpen(true)}
          aria-label={`Buscar (${shortcutLabel})`}
        >
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="search-placeholder">Buscar hallazgos, proveedores, evaluaciones...</span>
          <kbd className="search-kbd">{shortcutLabel}</kbd>
        </button>
      </div>

      <div className="topbar-right">
        {/* Campanita de notificaciones */}
        <div className="notif-bell-wrap" ref={notifPanelRef}>
          <button
            type="button"
            className="topbar-icon-btn notif-bell-btn"
            title="Notificaciones"
            onClick={() => {
              setShowHelp(false);
              setShowSettings(false);
              setShowNotifications(prev => !prev);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>

          {/* Panel de notificaciones */}
          {showNotifications && (
            <div className="notif-panel">
              <div className="notif-panel-header">
                <span className="notif-panel-title">Notificaciones</span>
                {unreadCount > 0 && (
                  <button className="notif-mark-all" onClick={handleMarkAllRead}>
                    Marcar todo leído
                  </button>
                )}
              </div>

              <div className="notif-panel-body">
                {notifLoading && (
                  <div className="notif-empty">Cargando...</div>
                )}
                {!notifLoading && notifications.length === 0 && (
                  <div className="notif-empty">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, marginBottom: '8px' }}>
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    Sin notificaciones
                  </div>
                )}
                {!notifLoading && notifications.map(n => (
                  <div
                    key={n.id}
                    className={`notif-item${n.is_read ? '' : ' notif-item--unread'}`}
                    onClick={() => !n.is_read && handleMarkRead(n.id)}
                  >
                    <div
                      className="notif-item-dot"
                      style={{ background: severityColor[n.severity] || '#6255A0' }}
                    />
                    <div className="notif-item-body">
                      <div className="notif-item-title">{n.title}</div>
                      <div className="notif-item-msg">{n.message}</div>
                      <div className="notif-item-time">{formatTimeAgo(n.created_at)}</div>
                    </div>
                    {!n.is_read && <div className="notif-item-unread-dot" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button type="button" className="topbar-icon-btn" title="Ayuda" onClick={() => { setShowSettings(false); setShowHelp(!showHelp); setShowNotifications(false); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>
        <button type="button" className="topbar-icon-btn" title="Configuración" onClick={() => { setShowHelp(false); setShowSettings(!showSettings); setShowNotifications(false); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m17.66-6.34l-4.24 4.24m-6.84 6.84l-4.24 4.24m0-15.32l4.24 4.24m6.84 6.84l4.24 4.24" />
          </svg>
        </button>
        <div className="topbar-divider" />
        {rightSlot}
      </div>

      {/* ── Command Palette ─────────────────────────────── */}
      {searchOpen && (
        <>
          <div className="command-overlay" onClick={() => setSearchOpen(false)} />
          <div className="command-palette" role="dialog" aria-label="Buscar">
            <div className="command-search-wrap">
              <svg className="command-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                className="command-input"
                placeholder="Buscar páginas, secciones..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSelectedIndex(0); }}
                onKeyDown={handleSearchKeyDown}
                autoComplete="off"
              />
              <kbd className="command-esc-hint">Esc</kbd>
            </div>

            <div className="command-results">
              {filteredItems.length === 0 ? (
                <div className="command-empty">
                  Sin resultados para &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                <>
                  <div className="command-group-label">
                    {searchQuery.trim() ? 'Resultados' : 'Navegación'}
                  </div>
                  {filteredItems.map((item, idx) => (
                    <button
                      key={item.path}
                      type="button"
                      className={`command-item${idx === selectedIndex ? ' selected' : ''}`}
                      onClick={() => { navigate(item.path); setSearchOpen(false); }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <span className="command-item-icon">{item.icon}</span>
                      <div className="command-item-text">
                        <span className="command-item-label">{item.label}</span>
                        <span className="command-item-desc">{item.description}</span>
                      </div>
                      {idx === selectedIndex && <kbd className="command-item-enter">↵</kbd>}
                    </button>
                  ))}
                </>
              )}
            </div>

            <div className="command-footer">
              <span><kbd>↑↓</kbd> navegar</span>
              <span><kbd>↵</kbd> abrir</span>
              <span><kbd>Esc</kbd> cerrar</span>
            </div>
          </div>
        </>
      )}

      {/* ── Help Panel ───────────────────────────────────── */}
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
                <p><strong>HabilitaPro</strong> — Sistema de gestión de cumplimiento normativo bajo la Resolución 3100 de 2019 del Ministerio de Salud de Colombia. El auditor evalúa a los prestadores de salud frente a los 512 criterios de habilitación de forma estructurada y trazable. El prestador consulta los resultados y realiza el seguimiento a los planes de mejora.</p>
              </div>

              <div className="help-section">
                <h3>📋 Rol del Prestador</h3>
                <p>El prestador no realiza la evaluación. Su rol es consultar los resultados registrados por el auditor, cargar evidencias de cumplimiento y ejecutar el plan de mejora cuando se le asignen acciones correctivas.</p>
                <strong>Lo que puede hacer el prestador:</strong>
                <ol>
                  <li>Consultar las evaluaciones realizadas por el auditor sobre su institución</li>
                  <li>Ver el % de cumplimiento y el semáforo de cada estándar</li>
                  <li>Revisar los hallazgos y las acciones correctivas asignadas</li>
                  <li>Cargar evidencias de cierre y ejecutar el plan de mejora</li>
                </ol>
              </div>

              <div className="help-section">
                <h3>🔎 Evaluación y Auditoría</h3>
                <p>El auditor es quien crea, responde y gestiona todas las evaluaciones. Evalúa al prestador frente a los 512 criterios de la Norma 3100, valida hallazgos y genera los informes oficiales.</p>
                <strong>Flujo del auditor:</strong>
                <ol>
                  <li>Crea la evaluación y selecciona el prestador a verificar</li>
                  <li>Responde los 512 criterios (7 estándares) según la verificación realizada</li>
                  <li>El sistema calcula el % de cumplimiento y el semáforo en tiempo real</li>
                  <li>Valida o rechaza hallazgos con observaciones técnicas</li>
                  <li>Redacta acciones correctivas con plazos y responsables</li>
                  <li>Genera y descarga el informe de auditoría (PDF / Excel)</li>
                  <li>Cierra los hallazgos una vez verificadas las evidencias de mejora</li>
                </ol>
              </div>

              <div className="help-section">
                <h3>🔍 Hallazgos</h3>
                <p>Los hallazgos se generan automáticamente al someter la evaluación. Cada hallazgo corresponde a un criterio No Conforme e incluye severidad, estado y responsable.</p>
                <strong>Ciclo de vida:</strong>
                <ul>
                  <li>Abierto → En Progreso → Resuelto → Cerrado</li>
                </ul>
                <strong>Severidades:</strong>
                <ul>
                  <li><strong>Crítica</strong> — Riesgo inmediato para el paciente o la habilitación</li>
                  <li><strong>Alta</strong> — Corrección prioritaria requerida</li>
                  <li><strong>Media</strong> — Corrección en plazo acordado</li>
                  <li><strong>Baja</strong> — Oportunidad de mejora</li>
                </ul>
              </div>

              <div className="help-section">
                <h3>🔔 Alertas de Habilitación</h3>
                <p>El sistema notifica automáticamente cuando la fecha de vencimiento de la habilitación de un prestador se aproxima. Cada alerta se emite una sola vez por hito:</p>
                <ul>
                  <li>30 días antes — Aviso preventivo</li>
                  <li>15 días antes — Alerta prioritaria</li>
                  <li>7 días antes — Alerta crítica</li>
                  <li>Día de vencimiento — Alerta urgente</li>
                </ul>
              </div>

              <div className="help-section">
                <h3>📄 Documentos</h3>
                <p>Gestione la matriz documental requerida por la Norma 3100. El sistema controla vigencias y alerta ante documentos próximos a vencer.</p>
              </div>

              <div className="help-section">
                <h3>📈 Reportes</h3>
                <p>Descargue reportes ejecutivos en PDF o Excel con métricas de cumplimiento por estándar, estado de hallazgos y semáforo de riesgo.</p>
                <strong>Semáforo de cumplimiento:</strong>
                <ul>
                  <li>🟢 Verde — ≥ 80% criterios conformes</li>
                  <li>🟡 Naranja — 50 a 79%</li>
                  <li>🔴 Rojo — menos del 50%</li>
                </ul>
              </div>

              <div className="help-section">
                <h3>🔐 Roles y Accesos</h3>
                <ul>
                  <li><strong>Admin Prestador:</strong> Consulta las evaluaciones realizadas por el auditor sobre su institución, revisa hallazgos, carga evidencias y ejecuta el plan de mejora. No realiza evaluaciones ni tiene acceso a otros prestadores.</li>
                  <li><strong>Auditor:</strong> Crea y responde evaluaciones, valida hallazgos, redacta acciones correctivas y genera informes de auditoría. Tiene acceso a todos los prestadores.</li>
                  <li><strong>Super Admin:</strong> Administración total del sistema: usuarios, cuestionarios, prestadores y configuración.</li>
                </ul>
              </div>

              <div className="help-section">
                <h3>⌨️ Atajos de Teclado</h3>
                <ul>
                  <li><kbd style={{ background: '#f3f4f6', padding: '1px 6px', borderRadius: '4px', fontSize: '12px', border: '1px solid #e5e7eb' }}>{shortcutLabel}</kbd> — Buscador rápido de secciones</li>
                  <li><kbd style={{ background: '#f3f4f6', padding: '1px 6px', borderRadius: '4px', fontSize: '12px', border: '1px solid #e5e7eb' }}>Esc</kbd> — Cerrar paneles y diálogos</li>
                </ul>
              </div>

              <div className="help-section">
                <h3>❓ Preguntas Frecuentes</h3>
                <p><strong>¿Quién realiza la evaluación?</strong><br />El Auditor. Es el responsable de crear, responder y gestionar todas las evaluaciones frente a los 512 criterios de la Norma 3100.</p>
                <p><strong>¿Qué hace el prestador?</strong><br />El prestador solo consulta los resultados de las evaluaciones realizadas por el auditor, revisa sus hallazgos y ejecuta el plan de mejora cargando evidencias de cierre.</p>
                <p><strong>¿Cuántos criterios tiene la evaluación?</strong><br />512 criterios distribuidos en 7 estándares transversales, aplicables a todos los servicios de salud.</p>
                <p><strong>¿Qué ocurre al finalizar una evaluación?</strong><br />El sistema genera automáticamente los hallazgos por criterios No Conformes, los cuales quedan disponibles para revisión y seguimiento.</p>
                <p><strong>¿Cómo genero el informe de auditoría?</strong><br />El auditor, desde el módulo de &quot;Evaluaciones&quot; o &quot;Reportes&quot;, genera y descarga el informe en PDF o Excel una vez finalizada la verificación.</p>
                <p><strong>¿Cuáles son los niveles de severidad de un hallazgo?</strong><br />Crítica, Alta, Media y Baja. Se asignan automáticamente según el peso normativo del criterio No Conforme.</p>
              </div>

              <div className="help-section">
                <h3>📞 Soporte Técnico</h3>
                <p>Para asistencia técnica o consultas normativas: <strong>soporte@habilitapro.co</strong></p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Settings Panel ───────────────────────────────── */}
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
                <h4>Notificaciones</h4>
                <label className="settings-label">
                  <input type="checkbox" checked={emailNotifs} onChange={e => setEmailNotifs(e.target.checked)} />
                  <span>Notificaciones por correo</span>
                </label>
                <p className="settings-hint">Recibe actualizaciones de hallazgos y evaluaciones por email</p>

                <label className="settings-label" style={{ marginTop: '10px' }}>
                  <input type="checkbox" checked={browserNotifs} onChange={e => setBrowserNotifs(e.target.checked)} />
                  <span>Notificaciones del navegador</span>
                </label>
                <p className="settings-hint">Alertas en tiempo real dentro del sistema</p>
              </div>

              <div className="settings-section">
                <label className="settings-label">
                  <input type="checkbox" checked={autoUpdate} onChange={e => setAutoUpdate(e.target.checked)} />
                  <span>Auto-actualizar datos (cada 5 min)</span>
                </label>
                <p className="settings-hint">Mantén los datos siempre actualizados automáticamente</p>
              </div>

              <div className="settings-section">
                <label className="settings-label">
                  <input type="checkbox" checked={compactMode} onChange={e => setCompactMode(e.target.checked)} />
                  <span>Modo compacto</span>
                </label>
                <p className="settings-hint">Reduce el espaciado para ver más contenido en pantalla</p>
              </div>

              <div className="settings-section">
                <h4>Apariencia</h4>
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                  {(['light', 'dark', 'auto'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: theme === t ? '2px solid #8B5CF6' : '1px solid #ddd',
                        background: theme === t ? 'white' : '#f5f5f5',
                        color: theme === t ? '#8B5CF6' : '#666',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: theme === t ? 500 : 400,
                        transition: 'all 0.2s',
                        fontSize: '13px',
                      }}
                    >
                      {t === 'light' ? '☀️ Claro' : t === 'dark' ? '🌙 Oscuro' : '🔄 Auto'}
                    </button>
                  ))}
                </div>
                <p style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  {theme === 'auto' ? 'Tema: Automático (según sistema)' : `Tema: ${theme === 'light' ? 'Claro' : 'Oscuro'}`}
                </p>
              </div>

              <button
                onClick={saveSettings}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '8px',
                  background: settingsSaved ? '#10b981' : '#8B5CF6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '14px',
                  transition: 'background 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {settingsSaved ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Guardado
                  </>
                ) : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

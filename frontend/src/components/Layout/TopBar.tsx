/**
 * TopBar Component
 * Professional top navigation with breadcrumbs, search and quick actions
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import './TopBar.css';

interface TopBarProps {
  onMenuToggle: () => void;
  rightSlot?: React.ReactNode;
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
  '/providers': {
    title: 'Proveedores',
    subtitle: 'Administración de proveedores',
  },
  '/notifications/analytics': {
    title: 'Analíticas de Notificaciones',
    subtitle: 'Métricas y rendimiento de envíos',
  },
  '/notifications/delivery-status': {
    title: 'Estado de Entregas',
    subtitle: 'Seguimiento en tiempo real de notificaciones',
  },
  '/notifications/preferences': {
    title: 'Preferencias',
    subtitle: 'Configuración de canales multicanal',
  },
  '/notifications/templates/email': {
    title: 'Plantillas de Email',
    subtitle: 'Editor de plantillas de correo electrónico',
  },
  '/notifications/templates/sms': {
    title: 'Plantillas de SMS',
    subtitle: 'Editor de plantillas SMS',
  },
  '/notifications/templates/push': {
    title: 'Plantillas Push',
    subtitle: 'Editor de notificaciones push',
  },
};

export const TopBar: React.FC<TopBarProps> = ({ onMenuToggle, rightSlot }) => {
  const location = useLocation();
  const meta = routeTitles[location.pathname] || routeTitles['/'];

  const breadcrumbs = location.pathname.split('/').filter(Boolean);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-menu-btn"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="topbar-titles">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <span className="crumb">Norma 3100</span>
            {breadcrumbs.length > 0 && (
              <>
                <span className="crumb-separator">/</span>
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    <span className="crumb">{crumb.charAt(0).toUpperCase() + crumb.slice(1)}</span>
                    {idx < breadcrumbs.length - 1 && <span className="crumb-separator">/</span>}
                  </React.Fragment>
                ))}
              </>
            )}
          </nav>
          <h1 className="topbar-title">{meta.title}</h1>
        </div>
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
        <button type="button" className="topbar-icon-btn" title="Ayuda">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>
        <button type="button" className="topbar-icon-btn" title="Configuración">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m17.66-6.34l-4.24 4.24m-6.84 6.84l-4.24 4.24m0-15.32l4.24 4.24m6.84 6.84l4.24 4.24" />
          </svg>
        </button>
        <div className="topbar-divider" />
        {rightSlot}
      </div>
    </header>
  );
};

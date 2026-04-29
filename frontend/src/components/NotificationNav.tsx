/**
 * Notification Navigation Menu
 * Quick access to notification management features
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './NotificationNav.css';

interface NotificationNavProps {
  isOpen?: boolean;
}

export const NotificationNav: React.FC<NotificationNavProps> = ({ isOpen = false }) => {
  const [open, setOpen] = useState(isOpen);

  const toggleMenu = () => {
    setOpen(!open);
  };

  return (
    <div className="notification-nav">
      <button className="nav-toggle" onClick={toggleMenu} title="Gestión de Notificaciones">
        📬
      </button>

      {open && (
        <div className="nav-menu">
          <div className="nav-title">Gestión de Notificaciones</div>
          <nav className="nav-links">
            <Link to="/notifications/analytics" className="nav-link">
              📊 Analíticas
            </Link>
            <Link to="/notifications/delivery-status" className="nav-link">
              📋 Estado de Entregas
            </Link>
            <Link to="/notifications/preferences" className="nav-link">
              ⚙️ Preferencias
            </Link>
            <div className="nav-divider"></div>
            <div className="nav-subtitle">Plantillas</div>
            <Link to="/notifications/templates/email" className="nav-link">
              📧 Email
            </Link>
            <Link to="/notifications/templates/push" className="nav-link">
              🔔 Push
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
};

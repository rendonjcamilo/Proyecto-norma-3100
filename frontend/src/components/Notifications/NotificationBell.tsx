/**
 * Notification Bell Component
 * Bell icon with unread count badge
 */

import React from 'react';

interface NotificationBellProps {
  unreadCount: number;
  isConnected: boolean;
  isOpen: boolean;
  onClick: () => void;
}

/**
 * NotificationBell: Displays bell icon with unread badge
 */
export const NotificationBell: React.FC<NotificationBellProps> = ({
  unreadCount,
  isConnected,
  isOpen,
  onClick,
}) => {
  return (
    <button
      className={`notification-bell ${isOpen ? 'active' : ''}`}
      onClick={onClick}
      title={`${unreadCount} notificaciones sin leer`}
      aria-label="Notificaciones"
    >
      {/* Bell Icon */}
      <span className="bell-icon">🔔</span>

      {/* Unread Badge */}
      {unreadCount > 0 && (
        <span className="unread-badge">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {/* Connection Indicator */}
      <span
        className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}
        title={isConnected ? 'Conectado' : 'Desconectado'}
      />
    </button>
  );
};

export default NotificationBell;

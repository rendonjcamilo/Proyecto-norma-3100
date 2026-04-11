/**
 * Notification Toast Component
 * Toast notification displayed at top-right
 */

import React, { useEffect } from 'react';
import { Notification } from '../../hooks/useNotifications';

interface NotificationToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  onClick?: (notification: Notification) => void;
  autoDismiss?: boolean;
  duration?: number;
}

/**
 * NotificationToast: Toast notification display
 */
export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
  onClick,
  autoDismiss = true,
  duration = 5000,
}) => {
  useEffect(() => {
    if (!autoDismiss) return;

    const timer = setTimeout(() => {
      onDismiss(notification.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [notification.id, onDismiss, autoDismiss, duration]);

  const getSeverityIcon = (severity: string): string => {
    switch (severity) {
      case 'low':
        return 'ℹ️';
      case 'medium':
        return '⚠️';
      case 'high':
        return '🔴';
      case 'critical':
        return '🚨';
      default:
        return '📢';
    }
  };

  const getSeverityClass = (severity: string): string => {
    return `severity-${severity}`;
  };

  return (
    <div
      className={`notification-toast ${getSeverityClass(notification.severity)}`}
      onClick={() => onClick?.(notification)}
      role="alert"
    >
      <div className="toast-icon">
        {getSeverityIcon(notification.severity)}
      </div>

      <div className="toast-content">
        <div className="toast-title">{notification.title}</div>
        <div className="toast-message">{notification.message}</div>
      </div>

      <button
        className="toast-close"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(notification.id);
        }}
        aria-label="Cerrar"
      >
        ✕
      </button>

      {/* Progress bar */}
      <div className="toast-progress" style={{ animationDuration: `${duration}ms` }} />
    </div>
  );
};

export default NotificationToast;

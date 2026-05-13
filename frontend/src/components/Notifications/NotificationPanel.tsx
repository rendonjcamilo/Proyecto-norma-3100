/**
 * Notification Panel Component
 * Dropdown panel showing notification list
 */

import React, { useState } from 'react';
import { Notification } from '../../hooks/useNotifications';
import { formatTimeAgo } from '@/utils/dateFormat';

interface NotificationPanelProps {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  onNotificationClick: (notification: Notification) => void;
  onAcknowledge: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onLoadMore: () => void;
}

/**
 * NotificationPanel: Dropdown panel with notification list
 */
export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  unreadCount,
  loading,
  onNotificationClick,
  onAcknowledge,
  onDelete,
  onClose,
  onLoadMore,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'critical') return n.severity === 'critical' || n.severity === 'high';
    return true;
  });

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'low':
        return '#4caf50';
      case 'medium':
        return '#ff9800';
      case 'high':
        return '#f44336';
      case 'critical':
        return '#c62828';
      default:
        return '#999';
    }
  };

  const getSeverityLabel = (severity: string): string => {
    switch (severity) {
      case 'low':
        return 'Bajo';
      case 'medium':
        return 'Medio';
      case 'high':
        return 'Alto';
      case 'critical':
        return 'Crítico';
      default:
        return 'Desconocido';
    }
  };


  return (
    <div className="notification-panel" role="dialog" aria-label="Panel de notificaciones">
      {/* Header */}
      <div className="panel-header">
        <h3 className="panel-title">Notificaciones</h3>
        <button className="panel-close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
      </div>

      {/* Unread Badge */}
      {unreadCount > 0 && (
        <div className="panel-unread-banner">
          📌 Tienes {unreadCount} notificación{unreadCount !== 1 ? 'es' : ''} sin leer
        </div>
      )}

      {/* Filters */}
      <div className="panel-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todas
        </button>
        <button
          className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Sin leer ({unreadCount})
        </button>
        <button
          className={`filter-btn ${filter === 'critical' ? 'active' : ''}`}
          onClick={() => setFilter('critical')}
        >
          Críticas
        </button>
      </div>

      {/* Notifications List */}
      <div className="panel-content">
        {loading && (
          <div className="panel-loading">
            <span className="spinner">⏳</span> Cargando notificaciones...
          </div>
        )}

        {!loading && filteredNotifications.length === 0 && (
          <div className="panel-empty">
            <span className="empty-icon">📭</span>
            <p className="empty-message">
              {filter === 'all'
                ? 'No hay notificaciones'
                : filter === 'unread'
                ? 'Todas las notificaciones han sido leídas'
                : 'No hay notificaciones críticas'}
            </p>
          </div>
        )}

        {!loading &&
          filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
              onClick={() => onNotificationClick(notification)}
            >
              {/* Severity Indicator */}
              <div
                className="notification-severity"
                style={{ backgroundColor: getSeverityColor(notification.severity) }}
                title={getSeverityLabel(notification.severity)}
              />

              {/* Content */}
              <div className="notification-item-content">
                <div className="notification-item-title">{notification.title}</div>
                <div className="notification-item-message">{notification.message}</div>
                <div className="notification-item-meta">
                  <span className="notification-time">{formatTimeAgo(notification.createdAt)}</span>
                  <span className="notification-severity-label">
                    {getSeverityLabel(notification.severity)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="notification-item-actions">
                {!notification.isAcknowledged && (
                  <button
                    className="action-btn acknowledge-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAcknowledge(notification.id);
                    }}
                    title="Marcar como reconocida"
                  >
                    ✓
                  </button>
                )}
                <button
                  className="action-btn delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notification.id);
                  }}
                  title="Eliminar"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* Footer */}
      {filteredNotifications.length > 0 && filteredNotifications.length < 20 && (
        <button className="panel-load-more" onClick={onLoadMore} disabled={loading}>
          {loading ? 'Cargando...' : 'Cargar más'}
        </button>
      )}

      <div className="panel-footer">
        <a href="/notifications/history" className="footer-link">
          Ver historial completo →
        </a>
      </div>
    </div>
  );
};

export default NotificationPanel;

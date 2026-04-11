/**
 * Notification Center Component
 * Main component for managing and displaying notifications
 */

import React, { useEffect, useState } from 'react';
import { useNotifications, Notification } from '../../hooks/useNotifications';
import { NotificationBell } from './NotificationBell';
import { NotificationPanel } from './NotificationPanel';
import { NotificationToast } from './NotificationToast';
import './Notifications.css';

interface NotificationCenterProps {
  userId: string;
  providerId: string;
  role: 'auditor' | 'provider_admin' | 'provider';
  autoConnect?: boolean;
}

/**
 * NotificationCenter: Main notification management component
 */
export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  userId,
  providerId,
  role,
  autoConnect = true,
}) => {
  const {
    notifications,
    unreadCount,
    isConnected,
    loading,
    error,
    connect,
    disconnect,
    markAsRead,
    acknowledge,
    deleteNotification,
    loadNotifications,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [toastNotifications, setToastNotifications] = useState<Notification[]>([]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && userId && providerId) {
      connect(userId, providerId, role);
    }

    return () => {
      disconnect();
    };
  }, [userId, providerId, role, autoConnect, connect, disconnect]);

  // Show new notifications as toasts (latest 3)
  useEffect(() => {
    const recentNotifications = notifications.slice(0, 3).filter(n => !n.isRead);
    setToastNotifications(recentNotifications);
  }, [notifications]);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toastNotifications.length === 0) return;

    const timer = setTimeout(() => {
      setToastNotifications(prev => prev.slice(1));
    }, 5000);

    return () => clearTimeout(timer);
  }, [toastNotifications]);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification.id);
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    }
  };

  const handleAcknowledge = async (notificationId: string) => {
    try {
      await acknowledge(notificationId);
    } catch (err) {
      console.error('Failed to acknowledge:', err);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleDismissToast = (notificationId: string) => {
    setToastNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return (
    <div className="notification-center">
      {/* Connection status indicator */}
      {error && (
        <div className="notification-error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
          <button
            className="error-dismiss"
            onClick={() => {
              // Try to reconnect
              connect(userId, providerId, role);
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Notification Bell */}
      <NotificationBell
        unreadCount={unreadCount}
        isConnected={isConnected}
        isOpen={isOpen}
        onClick={handleBellClick}
      />

      {/* Notification Panel (Dropdown) */}
      {isOpen && (
        <NotificationPanel
          notifications={notifications}
          unreadCount={unreadCount}
          loading={loading}
          onNotificationClick={handleNotificationClick}
          onAcknowledge={handleAcknowledge}
          onDelete={handleDelete}
          onClose={() => setIsOpen(false)}
          onLoadMore={() => loadNotifications(20, notifications.length)}
        />
      )}

      {/* Toast Notifications (Top Right) */}
      <div className="notification-toasts">
        {toastNotifications.map(notification => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onDismiss={handleDismissToast}
            onClick={() => handleNotificationClick(notification)}
          />
        ))}
      </div>
    </div>
  );
};

export default NotificationCenter;

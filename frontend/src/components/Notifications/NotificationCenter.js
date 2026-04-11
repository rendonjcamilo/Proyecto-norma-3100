import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Notification Center Component
 * Main component for managing and displaying notifications
 */
import { useEffect, useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationBell } from './NotificationBell';
import { NotificationPanel } from './NotificationPanel';
import { NotificationToast } from './NotificationToast';
import './Notifications.css';
/**
 * NotificationCenter: Main notification management component
 */
export const NotificationCenter = ({ userId, providerId, role, autoConnect = true, }) => {
    const { notifications, unreadCount, isConnected, loading, error, connect, disconnect, markAsRead, acknowledge, deleteNotification, loadNotifications, } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const [toastNotifications, setToastNotifications] = useState([]);
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
        if (toastNotifications.length === 0)
            return;
        const timer = setTimeout(() => {
            setToastNotifications(prev => prev.slice(1));
        }, 5000);
        return () => clearTimeout(timer);
    }, [toastNotifications]);
    const handleBellClick = () => {
        setIsOpen(!isOpen);
    };
    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            try {
                await markAsRead(notification.id);
            }
            catch (err) {
                console.error('Failed to mark as read:', err);
            }
        }
    };
    const handleAcknowledge = async (notificationId) => {
        try {
            await acknowledge(notificationId);
        }
        catch (err) {
            console.error('Failed to acknowledge:', err);
        }
    };
    const handleDelete = async (notificationId) => {
        try {
            await deleteNotification(notificationId);
        }
        catch (err) {
            console.error('Failed to delete:', err);
        }
    };
    const handleDismissToast = (notificationId) => {
        setToastNotifications(prev => prev.filter(n => n.id !== notificationId));
    };
    return (_jsxs("div", { className: "notification-center", children: [error && (_jsxs("div", { className: "notification-error-banner", children: [_jsx("span", { className: "error-icon", children: "\u26A0\uFE0F" }), _jsx("span", { className: "error-message", children: error }), _jsx("button", { className: "error-dismiss", onClick: () => {
                            // Try to reconnect
                            connect(userId, providerId, role);
                        }, children: "Reintentar" })] })), _jsx(NotificationBell, { unreadCount: unreadCount, isConnected: isConnected, isOpen: isOpen, onClick: handleBellClick }), isOpen && (_jsx(NotificationPanel, { notifications: notifications, unreadCount: unreadCount, loading: loading, onNotificationClick: handleNotificationClick, onAcknowledge: handleAcknowledge, onDelete: handleDelete, onClose: () => setIsOpen(false), onLoadMore: () => loadNotifications(20, notifications.length) })), _jsx("div", { className: "notification-toasts", children: toastNotifications.map(notification => (_jsx(NotificationToast, { notification: notification, onDismiss: handleDismissToast, onClick: () => handleNotificationClick(notification) }, notification.id))) })] }));
};
export default NotificationCenter;
//# sourceMappingURL=NotificationCenter.js.map
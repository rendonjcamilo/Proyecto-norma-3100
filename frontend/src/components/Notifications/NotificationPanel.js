import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Notification Panel Component
 * Dropdown panel showing notification list
 */
import { useState } from 'react';
/**
 * NotificationPanel: Dropdown panel with notification list
 */
export const NotificationPanel = ({ notifications, unreadCount, loading, onNotificationClick, onAcknowledge, onDelete, onClose, onLoadMore, }) => {
    const [filter, setFilter] = useState('all');
    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread')
            return !n.isRead;
        if (filter === 'critical')
            return n.severity === 'critical' || n.severity === 'high';
        return true;
    });
    const getSeverityColor = (severity) => {
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
    const getSeverityLabel = (severity) => {
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
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            if (diffMins < 1)
                return 'Hace unos segundos';
            if (diffMins < 60)
                return `Hace ${diffMins}m`;
            if (diffHours < 24)
                return `Hace ${diffHours}h`;
            if (diffDays < 7)
                return `Hace ${diffDays}d`;
            return date.toLocaleDateString('es-CO');
        }
        catch {
            return 'Fecha desconocida';
        }
    };
    return (_jsxs("div", { className: "notification-panel", role: "dialog", "aria-label": "Panel de notificaciones", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h3", { className: "panel-title", children: "Notificaciones" }), _jsx("button", { className: "panel-close", onClick: onClose, "aria-label": "Cerrar", children: "\u2715" })] }), unreadCount > 0 && (_jsxs("div", { className: "panel-unread-banner", children: ["\uD83D\uDCCC Tienes ", unreadCount, " notificaci\u00F3n", unreadCount !== 1 ? 'es' : '', " sin leer"] })), _jsxs("div", { className: "panel-filters", children: [_jsx("button", { className: `filter-btn ${filter === 'all' ? 'active' : ''}`, onClick: () => setFilter('all'), children: "Todas" }), _jsxs("button", { className: `filter-btn ${filter === 'unread' ? 'active' : ''}`, onClick: () => setFilter('unread'), children: ["Sin leer (", unreadCount, ")"] }), _jsx("button", { className: `filter-btn ${filter === 'critical' ? 'active' : ''}`, onClick: () => setFilter('critical'), children: "Cr\u00EDticas" })] }), _jsxs("div", { className: "panel-content", children: [loading && (_jsxs("div", { className: "panel-loading", children: [_jsx("span", { className: "spinner", children: "\u23F3" }), " Cargando notificaciones..."] })), !loading && filteredNotifications.length === 0 && (_jsxs("div", { className: "panel-empty", children: [_jsx("span", { className: "empty-icon", children: "\uD83D\uDCED" }), _jsx("p", { className: "empty-message", children: filter === 'all'
                                    ? 'No hay notificaciones'
                                    : filter === 'unread'
                                        ? 'Todas las notificaciones han sido leídas'
                                        : 'No hay notificaciones críticas' })] })), !loading &&
                        filteredNotifications.map(notification => (_jsxs("div", { className: `notification-item ${notification.isRead ? 'read' : 'unread'}`, onClick: () => onNotificationClick(notification), children: [_jsx("div", { className: "notification-severity", style: { backgroundColor: getSeverityColor(notification.severity) }, title: getSeverityLabel(notification.severity) }), _jsxs("div", { className: "notification-item-content", children: [_jsx("div", { className: "notification-item-title", children: notification.title }), _jsx("div", { className: "notification-item-message", children: notification.message }), _jsxs("div", { className: "notification-item-meta", children: [_jsx("span", { className: "notification-time", children: formatDate(notification.createdAt) }), _jsx("span", { className: "notification-severity-label", children: getSeverityLabel(notification.severity) })] })] }), _jsxs("div", { className: "notification-item-actions", children: [!notification.isAcknowledged && (_jsx("button", { className: "action-btn acknowledge-btn", onClick: (e) => {
                                                e.stopPropagation();
                                                onAcknowledge(notification.id);
                                            }, title: "Marcar como reconocida", children: "\u2713" })), _jsx("button", { className: "action-btn delete-btn", onClick: (e) => {
                                                e.stopPropagation();
                                                onDelete(notification.id);
                                            }, title: "Eliminar", children: "\uD83D\uDDD1" })] })] }, notification.id)))] }), filteredNotifications.length > 0 && filteredNotifications.length < 20 && (_jsx("button", { className: "panel-load-more", onClick: onLoadMore, disabled: loading, children: loading ? 'Cargando...' : 'Cargar más' })), _jsx("div", { className: "panel-footer", children: _jsx("a", { href: "/notifications/history", className: "footer-link", children: "Ver historial completo \u2192" }) })] }));
};
export default NotificationPanel;
//# sourceMappingURL=NotificationPanel.js.map
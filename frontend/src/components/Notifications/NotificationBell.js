import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * NotificationBell: Displays bell icon with unread badge
 */
export const NotificationBell = ({ unreadCount, isConnected, isOpen, onClick, }) => {
    return (_jsxs("button", { className: `notification-bell ${isOpen ? 'active' : ''}`, onClick: onClick, title: `${unreadCount} notificaciones sin leer`, "aria-label": "Notificaciones", children: [_jsx("span", { className: "bell-icon", children: "\uD83D\uDD14" }), unreadCount > 0 && (_jsx("span", { className: "unread-badge", children: unreadCount > 99 ? '99+' : unreadCount })), _jsx("span", { className: `connection-indicator ${isConnected ? 'connected' : 'disconnected'}`, title: isConnected ? 'Conectado' : 'Desconectado' })] }));
};
export default NotificationBell;
//# sourceMappingURL=NotificationBell.js.map
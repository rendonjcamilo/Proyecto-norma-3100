import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Notification Toast Component
 * Toast notification displayed at top-right
 */
import { useEffect } from 'react';
/**
 * NotificationToast: Toast notification display
 */
export const NotificationToast = ({ notification, onDismiss, onClick, autoDismiss = true, duration = 5000, }) => {
    useEffect(() => {
        if (!autoDismiss)
            return;
        const timer = setTimeout(() => {
            onDismiss(notification.id);
        }, duration);
        return () => clearTimeout(timer);
    }, [notification.id, onDismiss, autoDismiss, duration]);
    const getSeverityIcon = (severity) => {
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
    const getSeverityClass = (severity) => {
        return `severity-${severity}`;
    };
    return (_jsxs("div", { className: `notification-toast ${getSeverityClass(notification.severity)}`, onClick: () => onClick?.(notification), role: "alert", children: [_jsx("div", { className: "toast-icon", children: getSeverityIcon(notification.severity) }), _jsxs("div", { className: "toast-content", children: [_jsx("div", { className: "toast-title", children: notification.title }), _jsx("div", { className: "toast-message", children: notification.message })] }), _jsx("button", { className: "toast-close", onClick: (e) => {
                    e.stopPropagation();
                    onDismiss(notification.id);
                }, "aria-label": "Cerrar", children: "\u2715" }), _jsx("div", { className: "toast-progress", style: { animationDuration: `${duration}ms` } })] }));
};
export default NotificationToast;
//# sourceMappingURL=NotificationToast.js.map
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Notification Navigation Menu
 * Quick access to notification management features
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import './NotificationNav.css';
export const NotificationNav = ({ isOpen = false }) => {
    const [open, setOpen] = useState(isOpen);
    const toggleMenu = () => {
        setOpen(!open);
    };
    return (_jsxs("div", { className: "notification-nav", children: [_jsx("button", { className: "nav-toggle", onClick: toggleMenu, title: "Notification Management", children: "\uD83D\uDCEC" }), open && (_jsxs("div", { className: "nav-menu", children: [_jsx("div", { className: "nav-title", children: "Gesti\u00F3n de Notificaciones" }), _jsxs("nav", { className: "nav-links", children: [_jsx(Link, { to: "/notifications/analytics", className: "nav-link", children: "\uD83D\uDCCA Anal\u00EDticas" }), _jsx(Link, { to: "/notifications/delivery-status", className: "nav-link", children: "\uD83D\uDCCB Estado de Entregas" }), _jsx(Link, { to: "/notifications/preferences", className: "nav-link", children: "\u2699\uFE0F Preferencias" }), _jsx("div", { className: "nav-divider" }), _jsx("div", { className: "nav-subtitle", children: "Plantillas" }), _jsx(Link, { to: "/notifications/templates/email", className: "nav-link", children: "\uD83D\uDCE7 Email" }), _jsx(Link, { to: "/notifications/templates/sms", className: "nav-link", children: "\uD83D\uDCAC SMS" }), _jsx(Link, { to: "/notifications/templates/push", className: "nav-link", children: "\uD83D\uDD14 Push" })] })] }))] }));
};
//# sourceMappingURL=NotificationNav.js.map
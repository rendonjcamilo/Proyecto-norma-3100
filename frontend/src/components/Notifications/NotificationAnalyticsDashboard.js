import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Notification Analytics Dashboard Component
 * Display delivery statistics for all channels
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import './NotificationAnalyticsDashboard.css';
export const NotificationAnalyticsDashboard = ({ userId, }) => {
    const [stats, setStats] = useState([]);
    const [queueHealth, setQueueHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedChannel, setSelectedChannel] = useState('all');
    const [days, setDays] = useState(7);
    useEffect(() => {
        fetchAnalytics();
    }, [userId, selectedChannel, days]);
    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            // Fetch channel statistics
            if (selectedChannel === 'all') {
                const emailResult = await axios.get(`/api/notifications/multichannel/stats/email?days=${days}`, { headers: { 'x-user-id': userId } });
                const smsResult = await axios.get(`/api/notifications/multichannel/stats/sms?days=${days}`, { headers: { 'x-user-id': userId } });
                const pushResult = await axios.get(`/api/notifications/multichannel/stats/push?days=${days}`, { headers: { 'x-user-id': userId } });
                setStats([
                    ...(emailResult.data.stats || []),
                    ...(smsResult.data.stats || []),
                    ...(pushResult.data.stats || []),
                ]);
            }
            else {
                const result = await axios.get(`/api/notifications/multichannel/stats/${selectedChannel}?days=${days}`, { headers: { 'x-user-id': userId } });
                setStats(result.data.stats || []);
            }
            // Fetch queue health
            const queueResult = await axios.get(`/api/multichannel/queue/health`);
            setQueueHealth(queueResult.data);
        }
        catch (error) {
            console.error('Failed to fetch analytics:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const getChannelIcon = (channel) => {
        switch (channel) {
            case 'email':
                return '📧';
            case 'sms':
                return '💬';
            case 'push':
                return '🔔';
            default:
                return '📊';
        }
    };
    const calculateAggregates = () => {
        return stats.reduce((acc, stat) => ({
            total: acc.total + (stat.total || 0),
            sent: acc.sent + (stat.sent || 0),
            failed: acc.failed + (stat.failed || 0),
        }), { total: 0, sent: 0, failed: 0 });
    };
    const aggregates = calculateAggregates();
    const successRate = aggregates.total > 0
        ? ((aggregates.sent / aggregates.total) * 100).toFixed(2)
        : '0';
    if (loading) {
        return _jsx("div", { className: "analytics-loading", children: "Cargando an\u00E1liticas..." });
    }
    return (_jsxs("div", { className: "analytics-dashboard", children: [_jsxs("div", { className: "analytics-header", children: [_jsx("h2", { children: "\uD83D\uDCCA Anal\u00EDticas de Notificaciones" }), _jsx("p", { children: "Estad\u00EDsticas de entrega de notificaciones por canal" })] }), _jsxs("div", { className: "analytics-controls", children: [_jsxs("div", { className: "control-group", children: [_jsx("label", { children: "Canal:" }), _jsxs("select", { value: selectedChannel, onChange: (e) => setSelectedChannel(e.target.value), children: [_jsx("option", { value: "all", children: "Todos los canales" }), _jsx("option", { value: "email", children: "\uD83D\uDCE7 Email" }), _jsx("option", { value: "sms", children: "\uD83D\uDCAC SMS" }), _jsx("option", { value: "push", children: "\uD83D\uDD14 Push" })] })] }), _jsxs("div", { className: "control-group", children: [_jsx("label", { children: "Per\u00EDodo:" }), _jsxs("select", { value: days, onChange: (e) => setDays(parseInt(e.target.value)), children: [_jsx("option", { value: 1, children: "\u00DAltimas 24 horas" }), _jsx("option", { value: 7, children: "\u00DAltimos 7 d\u00EDas" }), _jsx("option", { value: 30, children: "\u00DAltimos 30 d\u00EDas" }), _jsx("option", { value: 90, children: "\u00DAltimos 90 d\u00EDas" })] })] })] }), _jsxs("div", { className: "analytics-summary", children: [_jsxs("div", { className: "summary-card total", children: [_jsx("div", { className: "card-icon", children: "\uD83D\uDCE8" }), _jsxs("div", { className: "card-content", children: [_jsx("div", { className: "card-label", children: "Total Enviado" }), _jsx("div", { className: "card-value", children: aggregates.total.toLocaleString() })] })] }), _jsxs("div", { className: "summary-card success", children: [_jsx("div", { className: "card-icon", children: "\u2705" }), _jsxs("div", { className: "card-content", children: [_jsx("div", { className: "card-label", children: "Entregados" }), _jsx("div", { className: "card-value", children: aggregates.sent.toLocaleString() })] })] }), _jsxs("div", { className: "summary-card failed", children: [_jsx("div", { className: "card-icon", children: "\u274C" }), _jsxs("div", { className: "card-content", children: [_jsx("div", { className: "card-label", children: "Fallidos" }), _jsx("div", { className: "card-value", children: aggregates.failed.toLocaleString() })] })] }), _jsxs("div", { className: "summary-card rate", children: [_jsx("div", { className: "card-icon", children: "\uD83D\uDCC8" }), _jsxs("div", { className: "card-content", children: [_jsx("div", { className: "card-label", children: "Tasa de \u00C9xito" }), _jsxs("div", { className: "card-value", children: [successRate, "%"] })] })] })] }), queueHealth && (_jsxs("div", { className: "queue-health", children: [_jsx("h3", { children: "\uD83D\uDD04 Estado de la Cola" }), _jsxs("div", { className: "queue-metrics", children: [_jsxs("div", { className: "metric", children: [_jsx("span", { className: "metric-label", children: "Pendientes:" }), _jsx("span", { className: "metric-value pending", children: queueHealth.totalPending })] }), _jsxs("div", { className: "metric", children: [_jsx("span", { className: "metric-label", children: "Procesando:" }), _jsx("span", { className: "metric-value processing", children: queueHealth.totalProcessing })] }), _jsxs("div", { className: "metric", children: [_jsx("span", { className: "metric-label", children: "Fallidos:" }), _jsx("span", { className: "metric-value failed", children: queueHealth.totalFailed })] }), queueHealth.oldestPendingAge && (_jsxs("div", { className: "metric", children: [_jsx("span", { className: "metric-label", children: "Edad m\u00E1xima:" }), _jsxs("span", { className: "metric-value", children: [Math.floor(queueHealth.oldestPendingAge / 60), "m"] })] })), _jsxs("div", { className: "metric", children: [_jsx("span", { className: "metric-label", children: "Tiempo promedio:" }), _jsxs("span", { className: "metric-value", children: [queueHealth.avgProcessingTime.toFixed(2), "s"] })] })] })] })), _jsxs("div", { className: "analytics-table", children: [_jsx("h3", { children: "\uD83D\uDCCB Detalle por Fecha" }), _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Fecha" }), _jsx("th", { children: "Canal" }), _jsx("th", { children: "Total" }), _jsx("th", { children: "Entregados" }), _jsx("th", { children: "Fallidos" }), _jsx("th", { children: "Tasa de \u00C9xito" })] }) }), _jsx("tbody", { children: stats.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "no-data", children: "No hay datos disponibles" }) })) : (stats.map((stat, index) => (_jsxs("tr", { children: [_jsx("td", { children: new Date(stat.date).toLocaleDateString('es-CO') }), _jsx("td", { children: _jsxs("span", { className: "channel-badge", children: [getChannelIcon(stat.channel), " ", stat.channel] }) }), _jsx("td", { children: stat.total }), _jsx("td", { className: "success", children: stat.sent }), _jsx("td", { className: "failed", children: stat.failed }), _jsx("td", { children: _jsxs("span", { className: `success-rate ${stat.success_rate >= 95 ? 'high' : stat.success_rate >= 80 ? 'medium' : 'low'}`, children: [stat.success_rate.toFixed(2), "%"] }) })] }, index)))) })] })] }), _jsxs("div", { className: "analytics-footer", children: [_jsx("button", { className: "btn btn-primary", onClick: fetchAnalytics, children: "\uD83D\uDD04 Actualizar" }), _jsxs("small", { children: ["\u00DAltima actualizaci\u00F3n: ", new Date().toLocaleTimeString('es-CO')] })] })] }));
};
//# sourceMappingURL=NotificationAnalyticsDashboard.js.map
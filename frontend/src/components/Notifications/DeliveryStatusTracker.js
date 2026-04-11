import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Delivery Status Tracker Component
 * Monitor and track notification delivery status across channels
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import './DeliveryStatusTracker.css';
const getStatusIcon = (status) => {
    switch (status) {
        case 'pending':
            return '⏳';
        case 'processing':
            return '⚙️';
        case 'delivered':
            return '✅';
        case 'failed':
            return '❌';
        case 'bounced':
            return '↩️';
        default:
            return '•';
    }
};
const getStatusLabel = (status) => {
    switch (status) {
        case 'pending':
            return 'Pendiente';
        case 'processing':
            return 'Procesando';
        case 'delivered':
            return 'Entregado';
        case 'failed':
            return 'Fallido';
        case 'bounced':
            return 'Rebotado';
        default:
            return status;
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
            return '📨';
    }
};
export const DeliveryStatusTracker = ({ userId, }) => {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: 'all',
        channel: 'all',
        search: '',
    });
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 20,
    });
    const [message, setMessage] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    useEffect(() => {
        fetchDeliveries();
        const interval = setInterval(fetchDeliveries, 5000);
        return () => clearInterval(interval);
    }, [userId, filters, pagination]);
    const fetchDeliveries = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                pageSize: pagination.pageSize.toString(),
                ...(filters.status !== 'all' && { status: filters.status }),
                ...(filters.channel !== 'all' && { channel: filters.channel }),
                ...(filters.search && { search: filters.search }),
            });
            const response = await axios.get(`/api/multichannel/deliveries?${params.toString()}`, {
                headers: { 'x-user-id': userId },
            });
            setDeliveries(response.data.deliveries || []);
        }
        catch (error) {
            console.error('Failed to fetch deliveries:', error);
            setMessage('Error cargando estado de entregas');
        }
        finally {
            setLoading(false);
        }
    };
    const handleRetry = async (id) => {
        try {
            await axios.post(`/api/multichannel/deliveries/${id}/retry`, {}, {
                headers: { 'x-user-id': userId },
            });
            setMessage('✅ Reintento iniciado');
            setTimeout(() => setMessage(''), 2000);
            fetchDeliveries();
        }
        catch (error) {
            console.error('Failed to retry delivery:', error);
            setMessage('❌ Error al reintentar entrega');
        }
    };
    const filteredDeliveries = deliveries.filter((delivery) => {
        const matchStatus = filters.status === 'all' || delivery.status === filters.status;
        const matchChannel = filters.channel === 'all' || delivery.channel === filters.channel;
        const matchSearch = filters.search === '' ||
            delivery.recipient.toLowerCase().includes(filters.search.toLowerCase()) ||
            (delivery.subject &&
                delivery.subject.toLowerCase().includes(filters.search.toLowerCase()));
        return matchStatus && matchChannel && matchSearch;
    });
    const getStatusColor = (status) => {
        switch (status) {
            case 'delivered':
                return '#4caf50';
            case 'failed':
                return '#f44336';
            case 'processing':
                return '#2196f3';
            case 'bounced':
                return '#ff9800';
            case 'pending':
                return '#9e9e9e';
            default:
                return '#999';
        }
    };
    return (_jsxs("div", { className: "delivery-status-tracker", children: [_jsxs("div", { className: "tracker-header", children: [_jsx("h2", { children: "\uD83D\uDCCA Estado de Entregas" }), _jsx("p", { children: "Monitorea el estado de tus notificaciones en tiempo real" })] }), _jsxs("div", { className: "tracker-filters", children: [_jsxs("div", { className: "filter-group", children: [_jsx("label", { children: "Estado:" }), _jsxs("select", { value: filters.status, onChange: (e) => setFilters({ ...filters, status: e.target.value }), children: [_jsx("option", { value: "all", children: "Todos los estados" }), _jsx("option", { value: "pending", children: "Pendiente" }), _jsx("option", { value: "processing", children: "Procesando" }), _jsx("option", { value: "delivered", children: "Entregado" }), _jsx("option", { value: "failed", children: "Fallido" }), _jsx("option", { value: "bounced", children: "Rebotado" })] })] }), _jsxs("div", { className: "filter-group", children: [_jsx("label", { children: "Canal:" }), _jsxs("select", { value: filters.channel, onChange: (e) => setFilters({ ...filters, channel: e.target.value }), children: [_jsx("option", { value: "all", children: "Todos los canales" }), _jsx("option", { value: "email", children: "\uD83D\uDCE7 Email" }), _jsx("option", { value: "sms", children: "\uD83D\uDCAC SMS" }), _jsx("option", { value: "push", children: "\uD83D\uDD14 Push" })] })] }), _jsxs("div", { className: "filter-group", children: [_jsx("label", { children: "Buscar:" }), _jsx("input", { type: "text", value: filters.search, onChange: (e) => setFilters({ ...filters, search: e.target.value }), placeholder: "Buscar por destinatario o asunto...", className: "search-input" })] }), _jsx("button", { className: "btn btn-refresh", onClick: fetchDeliveries, disabled: loading, children: "\uD83D\uDD04 Actualizar" })] }), _jsx("div", { className: "status-summary", children: ['delivered', 'processing', 'pending', 'failed', 'bounced'].map((status) => {
                    const count = deliveries.filter((d) => d.status === status).length;
                    return (_jsxs("div", { className: "summary-card", children: [_jsx("div", { className: "card-icon", children: getStatusIcon(status) }), _jsxs("div", { className: "card-content", children: [_jsx("div", { className: "card-label", children: getStatusLabel(status) }), _jsx("div", { className: "card-value", children: count })] })] }, status));
                }) }), _jsx("div", { className: "tracker-content", children: loading && deliveries.length === 0 ? (_jsx("div", { className: "tracker-loading", children: "Cargando entregas..." })) : filteredDeliveries.length === 0 ? (_jsxs("div", { className: "no-deliveries", children: [_jsx("p", { children: "No hay entregas disponibles" }), _jsx("p", { children: "Las notificaciones aparecer\u00E1n aqu\u00ED conforme se env\u00EDen" })] })) : (_jsx("div", { className: "deliveries-list", children: filteredDeliveries.map((delivery) => (_jsxs("div", { className: `delivery-item delivery-${delivery.status}`, children: [_jsxs("div", { className: "delivery-row", onClick: () => setExpandedId(expandedId === delivery.id ? null : delivery.id), children: [_jsx("div", { className: "delivery-status", children: _jsx("span", { className: "status-badge", style: { backgroundColor: getStatusColor(delivery.status) }, children: getStatusIcon(delivery.status) }) }), _jsxs("div", { className: "delivery-info", children: [_jsxs("div", { className: "delivery-primary", children: [_jsx("span", { className: "channel-icon", children: getChannelIcon(delivery.channel) }), _jsx("span", { className: "recipient", children: delivery.recipient }), delivery.subject && (_jsxs("span", { className: "subject", children: ["\u2022 ", delivery.subject] }))] }), _jsxs("div", { className: "delivery-secondary", children: [_jsx("span", { className: "status-label", children: getStatusLabel(delivery.status) }), _jsx("span", { className: "timestamp", children: new Date(delivery.createdAt).toLocaleString('es-CO') })] })] }), _jsx("div", { className: "delivery-action", children: _jsx("span", { className: "expand-icon", children: expandedId === delivery.id ? '▼' : '▶' }) })] }), expandedId === delivery.id && (_jsxs("div", { className: "delivery-details", children: [_jsxs("div", { className: "detail-row", children: [_jsx("span", { className: "detail-label", children: "ID de Entrega:" }), _jsx("span", { className: "detail-value", children: delivery.id })] }), _jsxs("div", { className: "detail-row", children: [_jsx("span", { className: "detail-label", children: "Canal:" }), _jsxs("span", { className: "detail-value", children: [getChannelIcon(delivery.channel), " ", delivery.channel] })] }), _jsxs("div", { className: "detail-row", children: [_jsx("span", { className: "detail-label", children: "Destinatario:" }), _jsx("span", { className: "detail-value", children: delivery.recipient })] }), _jsxs("div", { className: "detail-row", children: [_jsx("span", { className: "detail-label", children: "Estado:" }), _jsxs("span", { className: "detail-value", style: { color: getStatusColor(delivery.status) }, children: [getStatusIcon(delivery.status), ' ', getStatusLabel(delivery.status)] })] }), _jsxs("div", { className: "detail-row", children: [_jsx("span", { className: "detail-label", children: "Creado:" }), _jsx("span", { className: "detail-value", children: new Date(delivery.createdAt).toLocaleString('es-CO') })] }), _jsxs("div", { className: "detail-row", children: [_jsx("span", { className: "detail-label", children: "Actualizado:" }), _jsx("span", { className: "detail-value", children: new Date(delivery.updatedAt).toLocaleString('es-CO') })] }), delivery.retryCount !== undefined && (_jsxs("div", { className: "detail-row", children: [_jsx("span", { className: "detail-label", children: "Reintentos:" }), _jsx("span", { className: "detail-value", children: delivery.retryCount })] })), delivery.error && (_jsxs("div", { className: "detail-row", children: [_jsx("span", { className: "detail-label", children: "Error:" }), _jsx("span", { className: "detail-value error", children: delivery.error })] })), delivery.nextRetry && (_jsxs("div", { className: "detail-row", children: [_jsx("span", { className: "detail-label", children: "Pr\u00F3ximo Reintento:" }), _jsx("span", { className: "detail-value", children: new Date(delivery.nextRetry).toLocaleString('es-CO') })] })), delivery.status === 'failed' && (_jsx("div", { className: "detail-actions", children: _jsx("button", { className: "btn btn-retry", onClick: () => handleRetry(delivery.id), children: "\uD83D\uDD04 Reintentar Ahora" }) }))] }))] }, delivery.id))) })) }), filteredDeliveries.length > 0 && (_jsxs("div", { className: "tracker-pagination", children: [_jsx("button", { className: "btn btn-pagination", onClick: () => setPagination({
                            ...pagination,
                            page: Math.max(1, pagination.page - 1),
                        }), disabled: pagination.page === 1, children: "\u2190 Anterior" }), _jsxs("span", { className: "page-info", children: ["P\u00E1gina ", pagination.page, " \u2022 ", filteredDeliveries.length, " resultados"] }), _jsx("button", { className: "btn btn-pagination", onClick: () => setPagination({
                            ...pagination,
                            page: pagination.page + 1,
                        }), disabled: filteredDeliveries.length < pagination.pageSize, children: "Siguiente \u2192" })] })), message && _jsx("div", { className: "tracker-message", children: message })] }));
};
//# sourceMappingURL=DeliveryStatusTracker.js.map
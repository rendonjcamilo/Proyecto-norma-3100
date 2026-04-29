/**
 * Delivery Status Tracker Component
 * Monitor and track notification delivery status across channels
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DeliveryStatusTracker.css';

interface NotificationDelivery {
  id: string;
  channel: 'email' | 'sms' | 'push';
  recipient: string;
  subject?: string;
  status: 'pending' | 'processing' | 'delivered' | 'failed' | 'bounced';
  createdAt: string;
  updatedAt: string;
  error?: string;
  retryCount?: number;
  nextRetry?: string;
}

interface DeliveryStatusTrackerProps {
  userId: string;
}

const getStatusIcon = (status: string) => {
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

const getStatusLabel = (status: string) => {
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

const getChannelIcon = (channel: string) => {
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

export const DeliveryStatusTracker: React.FC<DeliveryStatusTrackerProps> = ({
  userId,
}) => {
  const [deliveries, setDeliveries] = useState<NotificationDelivery[]>([]);
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

      const response = await axios.get(
        `/api/multichannel/deliveries?${params.toString()}`,
        {
          headers: { 'x-user-id': userId },
        }
      );
      setDeliveries(response.data.deliveries || []);
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
      setMessage('Error cargando estado de entregas');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await axios.post(
        `/api/multichannel/deliveries/${id}/retry`,
        {},
        {
          headers: { 'x-user-id': userId },
        }
      );
      setMessage('✅ Reintento iniciado');
      setTimeout(() => setMessage(''), 2000);
      fetchDeliveries();
    } catch (error) {
      console.error('Failed to retry delivery:', error);
      setMessage('❌ Error al reintentar entrega');
    }
  };

  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchStatus =
      filters.status === 'all' || delivery.status === filters.status;
    const matchChannel =
      filters.channel === 'all' || delivery.channel === filters.channel;
    const matchSearch =
      filters.search === '' ||
      delivery.recipient.toLowerCase().includes(filters.search.toLowerCase()) ||
      (delivery.subject &&
        delivery.subject.toLowerCase().includes(filters.search.toLowerCase()));

    return matchStatus && matchChannel && matchSearch;
  });

  const getStatusColor = (status: string) => {
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

  return (
    <div className="delivery-status-tracker">
      <div className="tracker-header">
        <h2>📊 Estado de Entregas</h2>
        <p>Monitorea el estado de tus notificaciones en tiempo real</p>
      </div>

      {/* Filters */}
      <div className="tracker-filters">
        <div className="filter-group">
          <label>Estado:</label>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value })
            }
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="processing">Procesando</option>
            <option value="delivered">Entregado</option>
            <option value="failed">Fallido</option>
            <option value="bounced">Rebotado</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Canal:</label>
          <select
            value={filters.channel}
            onChange={(e) =>
              setFilters({ ...filters, channel: e.target.value })
            }
          >
            <option value="all">Todos los canales</option>
            <option value="email">📧 Email</option>
            <option value="push">🔔 Push</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Buscar:</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value })
            }
            placeholder="Buscar por destinatario o asunto..."
            className="search-input"
          />
        </div>

        <button
          className="btn btn-refresh"
          onClick={fetchDeliveries}
          disabled={loading}
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Status Summary Cards */}
      <div className="status-summary">
        {['delivered', 'processing', 'pending', 'failed', 'bounced'].map((status) => {
          const count = deliveries.filter((d) => d.status === status).length;
          return (
            <div key={status} className="summary-card">
              <div className="card-icon">{getStatusIcon(status)}</div>
              <div className="card-content">
                <div className="card-label">{getStatusLabel(status)}</div>
                <div className="card-value">{count}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deliveries List */}
      <div className="tracker-content">
        {loading && deliveries.length === 0 ? (
          <div className="tracker-loading">Cargando entregas...</div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="no-deliveries">
            <p>No hay entregas disponibles</p>
            <p>Las notificaciones aparecerán aquí conforme se envíen</p>
          </div>
        ) : (
          <div className="deliveries-list">
            {filteredDeliveries.map((delivery) => (
              <div
                key={delivery.id}
                className={`delivery-item delivery-${delivery.status}`}
              >
                <div
                  className="delivery-row"
                  onClick={() =>
                    setExpandedId(
                      expandedId === delivery.id ? null : delivery.id
                    )
                  }
                >
                  <div className="delivery-status">
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(delivery.status) }}
                    >
                      {getStatusIcon(delivery.status)}
                    </span>
                  </div>

                  <div className="delivery-info">
                    <div className="delivery-primary">
                      <span className="channel-icon">
                        {getChannelIcon(delivery.channel)}
                      </span>
                      <span className="recipient">{delivery.recipient}</span>
                      {delivery.subject && (
                        <span className="subject">• {delivery.subject}</span>
                      )}
                    </div>
                    <div className="delivery-secondary">
                      <span className="status-label">
                        {getStatusLabel(delivery.status)}
                      </span>
                      <span className="timestamp">
                        {new Date(delivery.createdAt).toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>

                  <div className="delivery-action">
                    <span className="expand-icon">
                      {expandedId === delivery.id ? '▼' : '▶'}
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === delivery.id && (
                  <div className="delivery-details">
                    <div className="detail-row">
                      <span className="detail-label">ID de Entrega:</span>
                      <span className="detail-value">{delivery.id}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Canal:</span>
                      <span className="detail-value">
                        {getChannelIcon(delivery.channel)} {delivery.channel}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Destinatario:</span>
                      <span className="detail-value">{delivery.recipient}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Estado:</span>
                      <span
                        className="detail-value"
                        style={{ color: getStatusColor(delivery.status) }}
                      >
                        {getStatusIcon(delivery.status)}{' '}
                        {getStatusLabel(delivery.status)}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Creado:</span>
                      <span className="detail-value">
                        {new Date(delivery.createdAt).toLocaleString('es-CO')}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Actualizado:</span>
                      <span className="detail-value">
                        {new Date(delivery.updatedAt).toLocaleString('es-CO')}
                      </span>
                    </div>

                    {delivery.retryCount !== undefined && (
                      <div className="detail-row">
                        <span className="detail-label">Reintentos:</span>
                        <span className="detail-value">{delivery.retryCount}</span>
                      </div>
                    )}

                    {delivery.error && (
                      <div className="detail-row">
                        <span className="detail-label">Error:</span>
                        <span className="detail-value error">{delivery.error}</span>
                      </div>
                    )}

                    {delivery.nextRetry && (
                      <div className="detail-row">
                        <span className="detail-label">Próximo Reintento:</span>
                        <span className="detail-value">
                          {new Date(delivery.nextRetry).toLocaleString('es-CO')}
                        </span>
                      </div>
                    )}

                    {delivery.status === 'failed' && (
                      <div className="detail-actions">
                        <button
                          className="btn btn-retry"
                          onClick={() => handleRetry(delivery.id)}
                        >
                          🔄 Reintentar Ahora
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredDeliveries.length > 0 && (
        <div className="tracker-pagination">
          <button
            className="btn btn-pagination"
            onClick={() =>
              setPagination({
                ...pagination,
                page: Math.max(1, pagination.page - 1),
              })
            }
            disabled={pagination.page === 1}
          >
            ← Anterior
          </button>
          <span className="page-info">
            Página {pagination.page} • {filteredDeliveries.length} resultados
          </span>
          <button
            className="btn btn-pagination"
            onClick={() =>
              setPagination({
                ...pagination,
                page: pagination.page + 1,
              })
            }
            disabled={filteredDeliveries.length < pagination.pageSize}
          >
            Siguiente →
          </button>
        </div>
      )}

      {message && <div className="tracker-message">{message}</div>}
    </div>
  );
};

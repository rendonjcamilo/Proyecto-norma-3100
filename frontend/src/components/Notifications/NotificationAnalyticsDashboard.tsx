/**
 * Notification Analytics Dashboard Component
 * Display delivery statistics for all channels
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './NotificationAnalyticsDashboard.css';

interface ChannelStats {
  channel: string;
  date: string;
  total: number;
  sent: number;
  failed: number;
  success_rate: number;
}

interface QueueHealth {
  totalPending: number;
  totalProcessing: number;
  totalFailed: number;
  oldestPendingAge: number | null;
  avgProcessingTime: number;
}

interface NotificationAnalyticsDashboardProps {
  userId: string;
}

export const NotificationAnalyticsDashboard: React.FC<NotificationAnalyticsDashboardProps> = ({
  userId,
}) => {
  const [stats, setStats] = useState<ChannelStats[]>([]);
  const [queueHealth, setQueueHealth] = useState<QueueHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<'email' | 'sms' | 'push' | 'all'>(
    'all'
  );
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetchAnalytics();
  }, [userId, selectedChannel, days]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch channel statistics
      if (selectedChannel === 'all') {
        const emailResult = await axios.get(
          `/api/notifications/multichannel/stats/email?days=${days}`,
          { headers: { 'x-user-id': userId } }
        );
        const smsResult = await axios.get(
          `/api/notifications/multichannel/stats/sms?days=${days}`,
          { headers: { 'x-user-id': userId } }
        );
        const pushResult = await axios.get(
          `/api/notifications/multichannel/stats/push?days=${days}`,
          { headers: { 'x-user-id': userId } }
        );

        setStats([
          ...(emailResult.data.stats || []),
          ...(smsResult.data.stats || []),
          ...(pushResult.data.stats || []),
        ]);
      } else {
        const result = await axios.get(
          `/api/notifications/multichannel/stats/${selectedChannel}?days=${days}`,
          { headers: { 'x-user-id': userId } }
        );
        setStats(result.data.stats || []);
      }

      // Fetch queue health
      const queueResult = await axios.get(`/api/multichannel/queue/health`);
      setQueueHealth(queueResult.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
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
        return '📊';
    }
  };

  const calculateAggregates = () => {
    return stats.reduce(
      (acc, stat) => ({
        total: acc.total + (stat.total || 0),
        sent: acc.sent + (stat.sent || 0),
        failed: acc.failed + (stat.failed || 0),
      }),
      { total: 0, sent: 0, failed: 0 }
    );
  };

  const aggregates = calculateAggregates();
  const successRate =
    aggregates.total > 0
      ? ((aggregates.sent / aggregates.total) * 100).toFixed(2)
      : '0';

  if (loading) {
    return <div className="analytics-loading">Cargando análiticas...</div>;
  }

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h2>📊 Analíticas de Notificaciones</h2>
        <p>Estadísticas de entrega de notificaciones por canal</p>
      </div>

      {/* Controls */}
      <div className="analytics-controls">
        <div className="control-group">
          <label>Canal:</label>
          <select
            value={selectedChannel}
            onChange={(e) =>
              setSelectedChannel(
                e.target.value as 'email' | 'sms' | 'push' | 'all'
              )
            }
          >
            <option value="all">Todos los canales</option>
            <option value="email">📧 Email</option>
            <option value="sms">💬 SMS</option>
            <option value="push">🔔 Push</option>
          </select>
        </div>

        <div className="control-group">
          <label>Período:</label>
          <select value={days} onChange={(e) => setDays(parseInt(e.target.value))}>
            <option value={1}>Últimas 24 horas</option>
            <option value={7}>Últimos 7 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={90}>Últimos 90 días</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="analytics-summary">
        <div className="summary-card total">
          <div className="card-icon">📨</div>
          <div className="card-content">
            <div className="card-label">Total Enviado</div>
            <div className="card-value">{aggregates.total.toLocaleString()}</div>
          </div>
        </div>

        <div className="summary-card success">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <div className="card-label">Entregados</div>
            <div className="card-value">{aggregates.sent.toLocaleString()}</div>
          </div>
        </div>

        <div className="summary-card failed">
          <div className="card-icon">❌</div>
          <div className="card-content">
            <div className="card-label">Fallidos</div>
            <div className="card-value">{aggregates.failed.toLocaleString()}</div>
          </div>
        </div>

        <div className="summary-card rate">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <div className="card-label">Tasa de Éxito</div>
            <div className="card-value">{successRate}%</div>
          </div>
        </div>
      </div>

      {/* Queue Health */}
      {queueHealth && (
        <div className="queue-health">
          <h3>🔄 Estado de la Cola</h3>
          <div className="queue-metrics">
            <div className="metric">
              <span className="metric-label">Pendientes:</span>
              <span className="metric-value pending">{queueHealth.totalPending}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Procesando:</span>
              <span className="metric-value processing">{queueHealth.totalProcessing}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Fallidos:</span>
              <span className="metric-value failed">{queueHealth.totalFailed}</span>
            </div>
            {queueHealth.oldestPendingAge && (
              <div className="metric">
                <span className="metric-label">Edad máxima:</span>
                <span className="metric-value">
                  {Math.floor(queueHealth.oldestPendingAge / 60)}m
                </span>
              </div>
            )}
            <div className="metric">
              <span className="metric-label">Tiempo promedio:</span>
              <span className="metric-value">
                {queueHealth.avgProcessingTime.toFixed(2)}s
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Stats Table */}
      <div className="analytics-table">
        <h3>📋 Detalle por Fecha</h3>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Canal</th>
              <th>Total</th>
              <th>Entregados</th>
              <th>Fallidos</th>
              <th>Tasa de Éxito</th>
            </tr>
          </thead>
          <tbody>
            {stats.length === 0 ? (
              <tr>
                <td colSpan={6} className="no-data">
                  No hay datos disponibles
                </td>
              </tr>
            ) : (
              stats.map((stat, index) => (
                <tr key={index}>
                  <td>{new Date(stat.date).toLocaleDateString('es-CO')}</td>
                  <td>
                    <span className="channel-badge">
                      {getChannelIcon(stat.channel)} {stat.channel}
                    </span>
                  </td>
                  <td>{stat.total}</td>
                  <td className="success">{stat.sent}</td>
                  <td className="failed">{stat.failed}</td>
                  <td>
                    <span className={`success-rate ${
                      stat.success_rate >= 95 ? 'high' : stat.success_rate >= 80 ? 'medium' : 'low'
                    }`}>
                      {stat.success_rate.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="analytics-footer">
        <button className="btn-dashboard btn-dashboard-primary" onClick={fetchAnalytics}>
          🔄 Actualizar
        </button>
        <small>Última actualización: {new Date().toLocaleTimeString('es-CO')}</small>
      </div>
    </div>
  );
};

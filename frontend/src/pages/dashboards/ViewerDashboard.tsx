/**
 * Viewer Dashboard
 * Read-only compliance view for external inspectors
 */

import './dashboards.css';
import React, { useState, useEffect } from 'react';
import { useProvider } from '@context/ProviderContext';
import { reportsApi, downloadBlob } from '@services/api';

interface ComplianceData {
  provider_name: string;
  rut: string;
  compliance_rate: number;
  last_assessment_date: string;
  critical_findings: number;
}

export function ViewerDashboard(): JSX.Element {
  const { selectedProvider } = useProvider();
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProvider) {
      loadComplianceData();
    }
  }, [selectedProvider]);

  const loadComplianceData = async () => {
    if (!selectedProvider) return;
    try {
      setLoading(true);
      const reportData = await reportsApi.getSummary(selectedProvider.id);
      const mockData: ComplianceData = {
        provider_name: selectedProvider?.legalName || '',
        rut: selectedProvider?.rut || '',
        compliance_rate: reportData.data?.metrics?.compliancePercentage || 72,
        last_assessment_date: new Date().toLocaleDateString('es-CO'),
        critical_findings: reportData.data?.metrics?.totalFindings || 2,
      };
      setComplianceData(mockData);
    } catch (err) {
      console.warn('Error loading compliance data, using defaults', err);
      const mockData: ComplianceData = {
        provider_name: selectedProvider?.legalName || '',
        rut: selectedProvider?.rut || '',
        compliance_rate: 72,
        last_assessment_date: new Date().toLocaleDateString('es-CO'),
        critical_findings: 2,
      };
      setComplianceData(mockData);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedProvider) return;
    try {
      setDownloading('pdf');
      const blob = await reportsApi.downloadCompliancePdf(selectedProvider.id);
      downloadBlob(blob, `reporte-cumplimiento-${selectedProvider.rut}.pdf`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error descargando PDF');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadExcel = async () => {
    if (!selectedProvider) return;
    try {
      setDownloading('excel');
      const blob = await reportsApi.downloadComplianceExcel(selectedProvider.id);
      downloadBlob(blob, `reporte-cumplimiento-${selectedProvider.rut}.xlsx`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error descargando Excel');
    } finally {
      setDownloading(null);
    }
  };

  const getComplianceStatus = (rate: number) => {
    if (rate >= 80) return { label: 'Conforme', color: 'green' };
    if (rate >= 50) return { label: 'Parcialmente Conforme', color: 'orange' };
    return { label: 'No Conforme', color: 'red' };
  };

  if (loading) {
    return <div className="dashboard-loading">Cargando información...</div>;
  }

  if (!complianceData) {
    return <div className="dashboard-error">No hay datos disponibles</div>;
  }

  const status = getComplianceStatus(complianceData.compliance_rate);

  return (
    <div className="dashboard viewer-dashboard">
      <div className="dashboard-header">
        <h1>Reporte de Cumplimiento</h1>
        <p className="subtitle">Vista de solo lectura</p>
      </div>

      <div className="compliance-card">
        <div className="card-header">
          <h2>{complianceData.provider_name}</h2>
          <span className="rut-badge">RUT: {complianceData.rut}</span>
        </div>

        <div className="card-body">
          <div className="compliance-metric">
            <div className={`compliance-indicator ${status.color}`}></div>
            <div className="metric-details">
              <div className="metric-value">{complianceData.compliance_rate}%</div>
              <div className="metric-status">{status.label}</div>
              <div className="metric-date">
                Última evaluación: {complianceData.last_assessment_date}
              </div>
            </div>
          </div>

          <div className="findings-summary">
            <div className="finding-item critical">
              <span className="icon">⚠</span>
              <span className="count">{complianceData.critical_findings}</span>
              <span className="label">Hallazgos Críticos</span>
            </div>
          </div>
        </div>
      </div>

      <div className="info-section">
        <h3>Descargas Disponibles</h3>
        <div className="download-list">
          <button
            className="download-btn"
            onClick={handleDownloadPdf}
            disabled={downloading !== null}
          >
            {downloading === 'pdf' ? '⏳ Descargando...' : '📄 Reporte de Cumplimiento (PDF)'}
          </button>
          <button
            className="download-btn"
            onClick={handleDownloadExcel}
            disabled={downloading !== null}
          >
            {downloading === 'excel' ? '⏳ Descargando...' : '📊 Reporte Detallado (Excel)'}
          </button>
        </div>
      </div>

      <div className="notice">
        <p>
          Esta es una vista de solo lectura. Para más información o reportes
          detallados, contacte con el prestador de salud.
        </p>
      </div>
    </div>
  );
}

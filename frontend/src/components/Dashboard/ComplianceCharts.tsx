/**
 * Compliance Charts Component
 * Displays comparison charts across multiple locations
 */

import React from 'react';
import './ComplianceCharts.css';

interface PerStandardMetric {
  name: string;
  code: string;
  percent: number;
  color: 'verde' | 'naranja' | 'rojo';
}

interface LocationCompliance {
  locationId: string;
  locationName: string;
  overallCompliance: number;
  semaforo: 'verde' | 'naranja' | 'rojo';
  hallazgosCount: number;
  lastAssessmentDate?: string;
  perStandardMetrics: PerStandardMetric[];
}

interface ComplianceChartsProps {
  data: LocationCompliance[];
}

export const ComplianceCharts: React.FC<ComplianceChartsProps> = ({ data }) => {
  // Calculate average compliance
  const avgCompliance =
    data.reduce((sum, loc) => sum + loc.overallCompliance, 0) / data.length;

  // Get all unique standards and aggregate data
  const allStandardCodes = new Set<string>();
  data.forEach(loc => {
    loc.perStandardMetrics.forEach(std => {
      allStandardCodes.add(std.code);
    });
  });

  const standardAverages = Array.from(allStandardCodes)
    .map(code => {
      const standards = data
        .flatMap(loc => loc.perStandardMetrics)
        .filter(std => std.code === code);

      const avgPercent =
        standards.reduce((sum, std) => sum + std.percent, 0) / standards.length;

      const getSemaforoColor = (percent: number): 'verde' | 'naranja' | 'rojo' => {
        if (percent >= 80) return 'verde';
        if (percent >= 50) return 'naranja';
        return 'rojo';
      };

      return {
        code,
        name: standards[0]?.name || code,
        percent: avgPercent,
        color: getSemaforoColor(avgPercent),
      };
    })
    .sort((a, b) => b.percent - a.percent);

  // Count locations by semáforo
  const semaforoCount = {
    verde: data.filter(loc => loc.semaforo === 'verde').length,
    naranja: data.filter(loc => loc.semaforo === 'naranja').length,
    rojo: data.filter(loc => loc.semaforo === 'rojo').length,
  };

  return (
    <div className="compliance-charts">
      <h2>Análisis Comparativo</h2>

      <div className="charts-grid">
        {/* Overall Average Card */}
        <div className="chart-card average-card">
          <h3>Cumplimiento Promedio</h3>
          <div className="chart-content">
            <div className="large-percentage">
              <span className="value">{Math.round(avgCompliance)}%</span>
            </div>
            <p className="description">
              Promedio de todas las {data.length} ubicación{data.length !== 1 ? 'es' : ''}
            </p>
          </div>
        </div>

        {/* Semáforo Distribution */}
        <div className="chart-card semaforo-distribution">
          <h3>Distribución por Estado</h3>
          <div className="distribution-grid">
            <div className="distribution-item">
              <div className="distribution-bar">
                <div className="bar-label">Verde</div>
                <div className="bar-value">{semaforoCount.verde}</div>
              </div>
              <div className="bar-visual verde" style={{
                height: `${(semaforoCount.verde / data.length) * 100}%`,
                minHeight: '20px',
              }} />
            </div>
            <div className="distribution-item">
              <div className="distribution-bar">
                <div className="bar-label">Naranja</div>
                <div className="bar-value">{semaforoCount.naranja}</div>
              </div>
              <div className="bar-visual naranja" style={{
                height: `${(semaforoCount.naranja / data.length) * 100}%`,
                minHeight: '20px',
              }} />
            </div>
            <div className="distribution-item">
              <div className="distribution-bar">
                <div className="bar-label">Rojo</div>
                <div className="bar-value">{semaforoCount.rojo}</div>
              </div>
              <div className="bar-visual rojo" style={{
                height: `${(semaforoCount.rojo / data.length) * 100}%`,
                minHeight: '20px',
              }} />
            </div>
          </div>
        </div>

        {/* Location Comparison Bar Chart */}
        <div className="chart-card location-comparison">
          <h3>Cumplimiento por Ubicación</h3>
          <div className="bars-container">
            {data
              .sort((a, b) => b.overallCompliance - a.overallCompliance)
              .map(location => (
                <div key={location.locationId} className="bar-row">
                  <div className="location-label">{location.locationName}</div>
                  <div className="bar-wrapper">
                    <div
                      className={`bar-fill semaforo-${location.semaforo}`}
                      style={{
                        width: `${location.overallCompliance}%`,
                      }}
                    >
                      <span className="bar-text">{Math.round(location.overallCompliance)}%</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Top Standards */}
        <div className="chart-card top-standards">
          <h3>Estándares con Mayor Cumplimiento</h3>
          <div className="standards-ranking">
            {standardAverages.slice(0, 5).map((std, index) => (
              <div key={std.code} className="standard-rank">
                <div className="rank-number">#{index + 1}</div>
                <div className="rank-info">
                  <div className="rank-name">{std.code}</div>
                  <div className="rank-description">{std.name}</div>
                </div>
                <div className={`rank-percentage semaforo-${std.color}`}>
                  {Math.round(std.percent)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Standards Average Breakdown */}
        <div className="chart-card standards-breakdown full-width">
          <h3>Promedio por Estándar</h3>
          <div className="breakdown-grid">
            {standardAverages.map(std => (
              <div key={std.code} className="breakdown-item">
                <div className="breakdown-label">{std.code}</div>
                <div className={`breakdown-bar semaforo-${std.color}`}>
                  <div
                    className="breakdown-fill"
                    style={{
                      width: `${std.percent}%`,
                    }}
                  />
                </div>
                <div className="breakdown-percent">{Math.round(std.percent)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceCharts;

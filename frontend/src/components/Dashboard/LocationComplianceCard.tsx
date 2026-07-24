/**
 * Location Compliance Card Component
 * Displays compliance score for a single location with semáforo colors
 */

import React from 'react';
import { formatDate } from '@/utils/dateFormat';
import './LocationComplianceCard.css';

interface PerStandardMetric {
  name: string;
  code: string;
  percent: number;
  color: 'verde' | 'naranja' | 'rojo';
}

export interface LocationComplianceCardProps {
  compliance: {
    locationId: string;
    locationName: string;
    overallCompliance: number;
    semaforo: 'verde' | 'naranja' | 'rojo';
    hallazgosCount: number;
    lastAssessmentDate?: string;
    perStandardMetrics: PerStandardMetric[];
  };
  isSelected?: boolean;
  onClick?: () => void;
}

export const LocationComplianceCard: React.FC<LocationComplianceCardProps> = ({
  compliance,
  isSelected = false,
  onClick,
}) => {
  const getSemaforoLabel = (color: string): string => {
    const labels: Record<string, string> = {
      verde: 'Verde - Cumple',
      naranja: 'Naranja - Parcial',
      rojo: 'Rojo - No Cumple',
    };
    return labels[color] || color;
  };

  const getSemaforoDescription = (color: string): string => {
    const descriptions: Record<string, string> = {
      verde: 'Cumplimiento ≥ 80%',
      naranja: 'Cumplimiento 50-79%',
      rojo: 'Cumplimiento < 50%',
    };
    return descriptions[color] || '';
  };

  const getTopStandards = () => {
    return compliance.perStandardMetrics
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 3);
  };

  const topThreeStandards = getTopStandards();

  return (
    <div
      className={`location-compliance-card semaforo-${compliance.semaforo} ${
        isSelected ? 'selected' : ''
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.();
        }
      }}
    >
      <div className="card-header">
        <h3 className="location-name">{compliance.locationName}</h3>
        {isSelected && <div className="selection-badge">Seleccionada</div>}
      </div>

      <div className="overall-score">
        <div className="score-circle">
          <span className="score-value">{Math.round(compliance.overallCompliance)}%</span>
        </div>
        <div className="score-info">
          <div className="score-label">{getSemaforoLabel(compliance.semaforo)}</div>
          <div className="score-description">{getSemaforoDescription(compliance.semaforo)}</div>
        </div>
      </div>

      {compliance.hallazgosCount > 0 && (
        <div className="hallazgos-info">
          <span className="hallazgo-icon">⚠️</span>
          <span className="hallazgo-count">
            {compliance.hallazgosCount} incumplimiento{compliance.hallazgosCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {compliance.perStandardMetrics.length > 0 && (
        <div className="top-standards">
          <h4>Principales Estándares</h4>
          <div className="standards-list">
            {topThreeStandards.map(std => (
              <div key={std.code} className="standard-item">
                <span className={`standard-dot semaforo-${std.color}`} />
                <span className="standard-info">
                  <span className="standard-code">{std.code}</span>
                  <span className="standard-percent">{Math.round(std.percent)}%</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {compliance.lastAssessmentDate && (
        <div className="assessment-date">
          Evaluación: {formatDate(compliance.lastAssessmentDate)}
        </div>
      )}

      <div className="card-footer">
        <button className="view-details-btn" onClick={onClick}>Ver Detalles →</button>
      </div>
    </div>
  );
};

export default LocationComplianceCard;

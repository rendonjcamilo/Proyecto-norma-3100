/**
 * ScoresDisplay Component
 * Displays compliance scores with semáforo colors
 * Shows overall % and per-standard breakdown
 */

import React from 'react';
import './ScoresDisplay.css';

interface PerStandardMetric {
  name: string;
  code: string;
  percent: number;
  color: 'verde' | 'naranja' | 'rojo';
}

interface ScoresDisplayProps {
  compliance: number;
  semaforo: 'verde' | 'naranja' | 'rojo';
  perStandardMetrics?: PerStandardMetric[];
  hallazgosCount?: number;
}

const ScoresDisplay: React.FC<ScoresDisplayProps> = ({
  compliance,
  semaforo,
  perStandardMetrics = [],
  hallazgosCount = 0,
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

  return (
    <div className="scores-display">
      <div className={`overall-score semaforo-${semaforo}`}>
        <div className="score-value">
          {Math.round(compliance)}%
        </div>
        <div className="score-label">{getSemaforoLabel(semaforo)}</div>
        <div className="score-description">{getSemaforoDescription(semaforo)}</div>
        {hallazgosCount > 0 && (
          <div className="hallazgos-count">
            {hallazgosCount} incumplimiento{hallazgosCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {perStandardMetrics.length > 0 && (
        <div className="per-standard-scores">
          <h4>Cumplimiento por Estándar:</h4>
          <div className="standards-grid">
            {perStandardMetrics.map((std) => (
              <div key={std.code} className={`standard-score semaforo-${std.color}`}>
                <div className="standard-code">{std.code}</div>
                <div className="standard-name">{std.name}</div>
                <div className="standard-percent">{Math.round(std.percent)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoresDisplay;

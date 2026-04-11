/**
 * ProgressBar Component
 * Shows completion progress: X of Y criteria answered
 */

import React from 'react';
import './ProgressBar.css';

interface ProgressBarProps {
  completed: number;
  total: number;
  showLabel?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ completed, total, showLabel = true }) => {
  const percent = total > 0 ? (completed / total) * 100 : 0;

  const getProgressColor = (p: number): string => {
    if (p >= 80) return 'progress-verde';
    if (p >= 50) return 'progress-naranja';
    return 'progress-rojo';
  };

  return (
    <div className="progress-bar-container">
      {showLabel && (
        <div className="progress-label">
          <span className="label-text">Progreso de la evaluación:</span>
          <span className="label-count">{completed}/{total} criterios respondidos</span>
        </div>
      )}
      <div className="progress-bar">
        <div className={`progress-fill ${getProgressColor(percent)}`} style={{ width: `${percent}%` }}>
          <span className="progress-percent">{Math.round(percent)}%</span>
        </div>
      </div>
      {!showLabel && (
        <span className="progress-text">{completed}/{total}</span>
      )}
    </div>
  );
};

export default ProgressBar;

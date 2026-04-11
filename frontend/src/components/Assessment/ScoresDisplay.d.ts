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
declare const ScoresDisplay: React.FC<ScoresDisplayProps>;
export default ScoresDisplay;
//# sourceMappingURL=ScoresDisplay.d.ts.map
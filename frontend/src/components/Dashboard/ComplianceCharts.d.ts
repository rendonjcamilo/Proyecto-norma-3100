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
export declare const ComplianceCharts: React.FC<ComplianceChartsProps>;
export default ComplianceCharts;
//# sourceMappingURL=ComplianceCharts.d.ts.map
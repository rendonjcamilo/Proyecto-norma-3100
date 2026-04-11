/**
 * Multi-Location Compliance Dashboard
 * Displays compliance status across all provider locations
 * Shows semáforo colors (verde/naranja/rojo) and allows location comparison
 */
import React from 'react';
import './MultiLocationDashboard.css';
export interface Location {
    id: string;
    name: string;
    city: string;
    state: string;
}
export interface LocationCompliance {
    locationId: string;
    locationName: string;
    overallCompliance: number;
    semaforo: 'verde' | 'naranja' | 'rojo';
    hallazgosCount: number;
    lastAssessmentDate?: string;
    perStandardMetrics: {
        name: string;
        code: string;
        percent: number;
        color: 'verde' | 'naranja' | 'rojo';
    }[];
}
export declare const MultiLocationDashboard: React.FC;
export default MultiLocationDashboard;
//# sourceMappingURL=MultiLocationDashboard.d.ts.map
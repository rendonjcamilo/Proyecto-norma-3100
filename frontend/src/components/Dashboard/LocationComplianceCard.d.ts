/**
 * Location Compliance Card Component
 * Displays compliance score for a single location with semáforo colors
 */
import React from 'react';
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
export declare const LocationComplianceCard: React.FC<LocationComplianceCardProps>;
export default LocationComplianceCard;
//# sourceMappingURL=LocationComplianceCard.d.ts.map
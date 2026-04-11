/**
 * Findings List Component
 * Displays findings in a filterable table with status and severity color coding
 */
import React from 'react';
import './FindingsList.css';
interface Finding {
    id: string;
    finding_number: string;
    title: string;
    description: string;
    service_id?: string;
    standard_id?: string;
    status: 'abierta' | 'en_revision' | 'asignada' | 'en_progreso' | 'cerrada';
    severity: 'crítica' | 'alta' | 'media' | 'baja' | 'pendiente';
    risk_score: number;
    assigned_to?: string;
    created_date: Date;
    closed_date?: Date;
}
interface FindingsListProps {
    providerId?: string;
    onSelectFinding: (finding: Finding) => void;
    onCreateAction?: (finding: Finding) => void;
}
/**
 * Findings List Component
 */
export declare const FindingsList: React.FC<FindingsListProps>;
export {};
//# sourceMappingURL=FindingsList.d.ts.map
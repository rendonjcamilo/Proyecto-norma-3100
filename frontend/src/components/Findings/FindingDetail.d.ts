/**
 * Finding Detail Component
 * Shows full finding information with actions and event timeline
 */
import React from 'react';
import './FindingDetail.css';
interface Finding {
    id: string;
    finding_number: string;
    title: string;
    description: string;
    severity: string;
    status: string;
    risk_score: number;
    assigned_to?: string;
    created_date: Date;
    closed_date?: Date;
}
interface FindingDetailProps {
    findingId: string;
    onClose: () => void;
    onCreateAction?: (finding: Finding) => void;
}
/**
 * Finding Detail Component
 */
export declare const FindingDetail: React.FC<FindingDetailProps>;
export {};
//# sourceMappingURL=FindingDetail.d.ts.map
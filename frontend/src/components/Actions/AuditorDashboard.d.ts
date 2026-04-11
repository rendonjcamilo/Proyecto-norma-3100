/**
 * Auditor Dashboard Component
 * Read-only overview of all providers' actions with distribution, overdue count, and approval
 */
import React from 'react';
import './AuditorDashboard.css';
interface AuditorDashboardProps {
    onApprove?: (actionId: string) => Promise<void>;
    onReject?: (actionId: string, reason: string) => Promise<void>;
}
export declare const AuditorDashboard: React.FC<AuditorDashboardProps>;
export {};
//# sourceMappingURL=AuditorDashboard.d.ts.map
/**
 * Compliance Dashboard Component
 * Displays comprehensive compliance metrics, risk scoring, and action status
 * for both providers and auditors
 */
import React from 'react';
import './ComplianceDashboard.css';
interface ComplianceMetrics {
    providerId: string;
    providerName: string;
    totalFindings: number;
    openFindings: number;
    inProgressFindings: number;
    resolvedFindings: number;
    closedFindings: number;
    overdueFindingsCount: number;
    averageRiskScore: number;
    compliancePercentage: number;
    trendDirection: 'improving' | 'stable' | 'worsening';
}
interface RiskAlert {
    id: string;
    findingId: string;
    title: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
    daysOverdue: number;
}
interface DashboardProps {
    providerId?: string;
    providerName?: string;
    metrics?: ComplianceMetrics;
    riskAlerts?: RiskAlert[];
    loading?: boolean;
    onRefresh?: () => Promise<void>;
    userRole?: 'auditor' | 'provider_admin' | 'super_admin';
}
export declare const ComplianceDashboard: React.FC<DashboardProps>;
export default ComplianceDashboard;
//# sourceMappingURL=ComplianceDashboard.d.ts.map
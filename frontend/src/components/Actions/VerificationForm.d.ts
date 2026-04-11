/**
 * Action Verification Form Component
 * Auditor form for approving or rejecting corrective action evidence
 * Only shown when action status is 'resolved'
 */
import React from 'react';
import './VerificationForm.css';
export interface VerificationData {
    actionId: string;
    decision: 'approved' | 'rejected';
    comments: string;
}
interface VerificationFormProps {
    actionId: string;
    actionTitle: string;
    actionDescription: string;
    evidence: Array<{
        id: string;
        filename: string;
        fileSize: number;
    }>;
    onVerify: (data: VerificationData) => Promise<void>;
    onCancel?: () => void;
    loading?: boolean;
}
export declare const VerificationForm: React.FC<VerificationFormProps>;
export default VerificationForm;
//# sourceMappingURL=VerificationForm.d.ts.map
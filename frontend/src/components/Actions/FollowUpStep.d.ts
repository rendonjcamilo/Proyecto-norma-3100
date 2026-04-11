/**
 * Follow-Up Step Component
 * Individual step card showing progress, evidence, and comments
 */
import React from 'react';
import { ActionFollowup } from '../../stores/actionStore';
import './FollowUpStep.css';
interface FollowUpStepProps {
    followup: ActionFollowup;
    onUpdateStatus?: (followupId: string, status: 'pendiente' | 'en_progreso' | 'completado') => void;
    onAddEvidence?: (followupId: string, evidence: string) => void;
    onAddComment?: (followupId: string, comment: string) => void;
    readonly?: boolean;
}
export declare const FollowUpStep: React.FC<FollowUpStepProps>;
export {};
//# sourceMappingURL=FollowUpStep.d.ts.map
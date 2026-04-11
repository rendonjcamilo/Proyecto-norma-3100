/**
 * Progress Update Form Component
 * Modal/drawer for updating action progress with evidence and comments
 */
import React from 'react';
import { ActionFollowup } from '../../stores/actionStore';
import './ProgressUpdateForm.css';
interface ProgressUpdateFormProps {
    actionId: string;
    followups: ActionFollowup[];
    onSubmit: (data: ProgressUpdateData) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
}
export interface ProgressUpdateData {
    followupId: string;
    status: 'pendiente' | 'en_progreso' | 'completado';
    completionPercentage: number;
    evidence?: string;
    comment?: string;
    estimatedRemainingDays?: number;
}
export declare const ProgressUpdateForm: React.FC<ProgressUpdateFormProps>;
export {};
//# sourceMappingURL=ProgressUpdateForm.d.ts.map
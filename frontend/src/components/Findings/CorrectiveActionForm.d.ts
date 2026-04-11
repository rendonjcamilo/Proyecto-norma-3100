/**
 * Corrective Action Form Component
 * Form for creating corrective actions with 6 follow-up steps
 */
import React from 'react';
import './CorrectiveActionForm.css';
interface Finding {
    id: string;
    title: string;
    severity: string;
}
interface CorrectiveActionFormProps {
    finding: Finding;
    onSubmit: (action: any) => Promise<void>;
    onCancel: () => void;
}
/**
 * Corrective Action Form Component
 */
export declare const CorrectiveActionForm: React.FC<CorrectiveActionFormProps>;
export {};
//# sourceMappingURL=CorrectiveActionForm.d.ts.map
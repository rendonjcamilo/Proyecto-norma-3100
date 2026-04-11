/**
 * AssessmentForm Component
 * Renders the assessment execution form with criteria grouped by standard
 * Features:
 * - Display questionnaire criteria (40-80 total)
 * - Grouped by standard (7 transversales + service-specific)
 * - Support C/NC/NA responses
 * - Required hallazgo description for NC
 * - Optional comment for all responses
 * - Progress tracking
 * - Auto-save every 30s
 * - Manual save button
 * - Submit button (only if all criteria answered)
 */
import React from 'react';
import './AssessmentForm.css';
interface Assessment {
    id: string;
    providerId: string;
    serviceId: string;
    questionnaireId: string;
    assessmentVersion: string;
    status: 'in_progress' | 'submitted' | 'locked';
    startedDate: string;
    compliancePercent: number;
    semaforo: 'verde' | 'naranja' | 'rojo';
}
interface Criterion {
    id: string;
    code: string;
    name: string;
    description: string;
    evidenceRequirement: string;
    complexity: 'simple' | 'medium' | 'complex';
}
interface Standard {
    id: string;
    code: string;
    name: string;
    isTransversal: boolean;
    criteria: Criterion[];
}
interface Response {
    criterionId: string;
    status: 'C' | 'NC' | 'NA';
    description?: string;
    comments?: string;
}
export interface AssessmentFormProps {
    assessment: Assessment;
    questionnaiireData: {
        standards: Standard[];
    };
    onSave?: (responses: Response[]) => Promise<void>;
    onSubmit?: () => Promise<void>;
    readOnly?: boolean;
}
declare const AssessmentForm: React.FC<AssessmentFormProps>;
export default AssessmentForm;
//# sourceMappingURL=AssessmentForm.d.ts.map
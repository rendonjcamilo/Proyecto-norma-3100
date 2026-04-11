/**
 * CriterionInput Component
 * Renders a single criterion with:
 * - Radio buttons: Cumple / No Cumple / No Aplica
 * - For NC: required hallazgo description field
 * - Optional comment field
 * - Optional evidence upload
 */
import React from 'react';
import './CriterionInput.css';
interface Criterion {
    id: string;
    code: string;
    name: string;
    description: string;
    evidenceRequirement: string;
    complexity: 'simple' | 'medium' | 'complex';
}
interface CriterionResponse {
    criterionId: string;
    status: 'C' | 'NC' | 'NA';
    description?: string;
    comments?: string;
    evidenceFileIds?: string[];
}
interface CriterionInputProps {
    criterion: Criterion;
    number: number;
    response?: CriterionResponse;
    onChange: (response: CriterionResponse) => void;
    readOnly?: boolean;
}
declare const CriterionInput: React.FC<CriterionInputProps>;
export default CriterionInput;
//# sourceMappingURL=CriterionInput.d.ts.map
/**
 * Bulk Action Import Component
 * CSV file upload and import for creating multiple corrective actions
 * Format: provider_id, location_id, action_description, assigned_to, due_date
 */
import React from 'react';
import './BulkActionImport.css';
export interface ActionImportRow {
    provider_id: string;
    location_id: string;
    action_description: string;
    assigned_to: string;
    due_date: string;
}
export interface ImportResult {
    row_number: number;
    status: 'success' | 'error';
    message: string;
}
interface BulkActionImportProps {
    onImport: (actions: ActionImportRow[]) => Promise<ImportResult[]>;
    onClose?: () => void;
    loading?: boolean;
}
export declare const BulkActionImport: React.FC<BulkActionImportProps>;
export default BulkActionImport;
//# sourceMappingURL=BulkActionImport.d.ts.map
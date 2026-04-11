/**
 * Email Template Editor Component
 * Allows users to create and edit email notification templates
 */
import React from 'react';
import './EmailTemplateEditor.css';
interface EmailTemplate {
    id?: string;
    name: string;
    subject: string;
    body: string;
    variables?: string[];
    createdAt?: string;
    updatedAt?: string;
}
interface EmailTemplateEditorProps {
    userId: string;
    onSave?: (template: EmailTemplate) => void;
    templateId?: string;
}
export declare const EmailTemplateEditor: React.FC<EmailTemplateEditorProps>;
export {};
//# sourceMappingURL=EmailTemplateEditor.d.ts.map
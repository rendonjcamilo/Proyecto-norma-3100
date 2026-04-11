/**
 * SMS Template Editor Component
 * Allows users to create and edit SMS notification templates
 */
import React from 'react';
import './SmsTemplateEditor.css';
interface SmsTemplate {
    id?: string;
    name: string;
    content: string;
    variables?: string[];
    maxLength?: number;
    createdAt?: string;
    updatedAt?: string;
}
interface SmsTemplateEditorProps {
    userId: string;
    onSave?: (template: SmsTemplate) => void;
    templateId?: string;
}
export declare const SmsTemplateEditor: React.FC<SmsTemplateEditorProps>;
export {};
//# sourceMappingURL=SmsTemplateEditor.d.ts.map
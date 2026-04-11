/**
 * Push Template Editor Component
 * Allows users to create and edit push notification templates
 */
import React from 'react';
import './PushTemplateEditor.css';
interface PushTemplate {
    id?: string;
    name: string;
    title: string;
    body: string;
    icon?: string;
    image?: string;
    actionUrl?: string;
    variables?: string[];
    createdAt?: string;
    updatedAt?: string;
}
interface PushTemplateEditorProps {
    userId: string;
    onSave?: (template: PushTemplate) => void;
    templateId?: string;
}
export declare const PushTemplateEditor: React.FC<PushTemplateEditorProps>;
export {};
//# sourceMappingURL=PushTemplateEditor.d.ts.map
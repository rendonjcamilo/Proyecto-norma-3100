/**
 * Action Detail Component
 * Full detail view with timeline, follow-ups, edit capabilities
 */
import React from 'react';
import './ActionDetail.css';
interface ActionDetailProps {
    actionId: string;
    onClose?: () => void;
    readonly?: boolean;
}
export declare const ActionDetail: React.FC<ActionDetailProps>;
export {};
//# sourceMappingURL=ActionDetail.d.ts.map
/**
 * ProgressBar Component
 * Shows completion progress: X of Y criteria answered
 */
import React from 'react';
import './ProgressBar.css';
interface ProgressBarProps {
    completed: number;
    total: number;
    showLabel?: boolean;
}
declare const ProgressBar: React.FC<ProgressBarProps>;
export default ProgressBar;
//# sourceMappingURL=ProgressBar.d.ts.map
/**
 * Notification Center Component
 * Main component for managing and displaying notifications
 */
import React from 'react';
import './Notifications.css';
interface NotificationCenterProps {
    userId: string;
    providerId: string;
    role: 'auditor' | 'provider_admin' | 'provider';
    autoConnect?: boolean;
}
/**
 * NotificationCenter: Main notification management component
 */
export declare const NotificationCenter: React.FC<NotificationCenterProps>;
export default NotificationCenter;
//# sourceMappingURL=NotificationCenter.d.ts.map
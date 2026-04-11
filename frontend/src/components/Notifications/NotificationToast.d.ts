/**
 * Notification Toast Component
 * Toast notification displayed at top-right
 */
import React from 'react';
import { Notification } from '../../hooks/useNotifications';
interface NotificationToastProps {
    notification: Notification;
    onDismiss: (id: string) => void;
    onClick?: (notification: Notification) => void;
    autoDismiss?: boolean;
    duration?: number;
}
/**
 * NotificationToast: Toast notification display
 */
export declare const NotificationToast: React.FC<NotificationToastProps>;
export default NotificationToast;
//# sourceMappingURL=NotificationToast.d.ts.map
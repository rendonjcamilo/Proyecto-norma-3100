/**
 * Notification Bell Component
 * Bell icon with unread count badge
 */
import React from 'react';
interface NotificationBellProps {
    unreadCount: number;
    isConnected: boolean;
    isOpen: boolean;
    onClick: () => void;
}
/**
 * NotificationBell: Displays bell icon with unread badge
 */
export declare const NotificationBell: React.FC<NotificationBellProps>;
export default NotificationBell;
//# sourceMappingURL=NotificationBell.d.ts.map
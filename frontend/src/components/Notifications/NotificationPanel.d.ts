/**
 * Notification Panel Component
 * Dropdown panel showing notification list
 */
import React from 'react';
import { Notification } from '../../hooks/useNotifications';
interface NotificationPanelProps {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    onNotificationClick: (notification: Notification) => void;
    onAcknowledge: (id: string) => void;
    onDelete: (id: string) => void;
    onClose: () => void;
    onLoadMore: () => void;
}
/**
 * NotificationPanel: Dropdown panel with notification list
 */
export declare const NotificationPanel: React.FC<NotificationPanelProps>;
export default NotificationPanel;
//# sourceMappingURL=NotificationPanel.d.ts.map
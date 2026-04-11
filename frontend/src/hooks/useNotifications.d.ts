/**
 * useNotifications Hook
 * Manages WebSocket connection and notification state
 */
export interface Notification {
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    findingId?: string;
    actionId?: string;
    isRead: boolean;
    isAcknowledged?: boolean;
    createdAt: string;
    data?: Record<string, any>;
}
export interface NotificationPreference {
    enable_overdue: boolean;
    enable_high_risk: boolean;
    enable_verification: boolean;
    min_severity: 'low' | 'medium' | 'high' | 'critical';
    quiet_hours_start?: string;
    quiet_hours_end?: string;
}
export interface UseNotificationsReturn {
    notifications: Notification[];
    unreadCount: number;
    isConnected: boolean;
    loading: boolean;
    error: string | null;
    connect: (userId: string, providerId: string, role: string) => void;
    disconnect: () => void;
    markAsRead: (notificationId: string) => Promise<void>;
    acknowledge: (notificationId: string) => Promise<void>;
    deleteNotification: (notificationId: string) => Promise<void>;
    getPreferences: () => Promise<NotificationPreference>;
    updatePreferences: (prefs: Partial<NotificationPreference>) => Promise<void>;
    sendTestNotification: () => Promise<void>;
    loadNotifications: (limit?: number, offset?: number) => Promise<void>;
}
export declare function useNotifications(): UseNotificationsReturn;
//# sourceMappingURL=useNotifications.d.ts.map
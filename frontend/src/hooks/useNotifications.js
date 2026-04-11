/**
 * useNotifications Hook
 * Manages WebSocket connection and notification state
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';
export function useNotifications() {
    const socketRef = useRef(null);
    const apiRef = useRef(axios.create({ baseURL: API_URL }));
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // Fetch unread count
    const fetchUnreadCount = useCallback(async () => {
        try {
            const response = await apiRef.current.get('/notifications/unread/count');
            setUnreadCount(response.data.unreadCount);
        }
        catch (err) {
            console.error('Failed to fetch unread count:', err);
        }
    }, []);
    // Connect to WebSocket
    const connect = useCallback((userId, providerId, role) => {
        if (socketRef.current?.connected) {
            return;
        }
        setLoading(true);
        setError(null);
        try {
            socketRef.current = io(WS_URL, {
                auth: {
                    token: localStorage.getItem('authToken') || '',
                    userId,
                    providerId,
                    role,
                },
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5,
                transports: ['websocket', 'polling'],
            });
            // Connection established
            socketRef.current.on('connect', () => {
                console.log('WebSocket connected:', socketRef.current?.id);
                setIsConnected(true);
                setError(null);
                fetchUnreadCount();
                loadNotifications();
            });
            // Receive notification
            socketRef.current.on('notification', (event) => {
                const notification = {
                    id: event.id || `notif-${Date.now()}`,
                    type: event.type,
                    severity: event.severity,
                    title: event.title,
                    message: event.message,
                    findingId: event.findingId,
                    actionId: event.actionId,
                    isRead: false,
                    createdAt: event.timestamp || new Date().toISOString(),
                    data: event.data,
                };
                // Add to top of list
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);
                // Play sound notification if enabled
                playNotificationSound();
                // Show browser notification if permission granted
                if (Notification.permission === 'granted') {
                    new Notification(notification.title, {
                        body: notification.message,
                        icon: '/icon-notification.png',
                    });
                }
            });
            // Connection error
            socketRef.current.on('connect_error', (err) => {
                console.error('WebSocket connection error:', err);
                setError(`Conexión fallida: ${err.message}`);
                setIsConnected(false);
            });
            // Disconnection
            socketRef.current.on('disconnect', () => {
                console.log('WebSocket disconnected');
                setIsConnected(false);
            });
            // Reconnection
            socketRef.current.on('reconnect', () => {
                console.log('WebSocket reconnected');
                setIsConnected(true);
                setError(null);
                fetchUnreadCount();
            });
        }
        catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to connect';
            setError(errorMsg);
            console.error('WebSocket connection error:', err);
        }
        finally {
            setLoading(false);
        }
    }, [fetchUnreadCount]);
    // Disconnect from WebSocket
    const disconnect = useCallback(() => {
        if (socketRef.current?.connected) {
            socketRef.current.disconnect();
        }
        setIsConnected(false);
    }, []);
    // Load notifications from API
    const loadNotifications = useCallback(async (limit = 20, offset = 0) => {
        try {
            setLoading(true);
            const response = await apiRef.current.get('/notifications', {
                params: { limit, offset },
            });
            setNotifications(response.data.notifications);
            setError(null);
        }
        catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to load notifications';
            setError(errorMsg);
            console.error('Failed to load notifications:', err);
        }
        finally {
            setLoading(false);
        }
    }, []);
    // Mark notification as read
    const markAsRead = useCallback(async (notificationId) => {
        try {
            await apiRef.current.put(`/notifications/${notificationId}/read`);
            // Update local state
            setNotifications(prev => prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n)));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
        catch (err) {
            console.error('Failed to mark as read:', err);
            throw err;
        }
    }, []);
    // Acknowledge notification
    const acknowledge = useCallback(async (notificationId) => {
        try {
            await apiRef.current.put(`/notifications/${notificationId}/acknowledge`);
            // Update local state
            setNotifications(prev => prev.map(n => (n.id === notificationId ? { ...n, isAcknowledged: true } : n)));
        }
        catch (err) {
            console.error('Failed to acknowledge:', err);
            throw err;
        }
    }, []);
    // Delete notification
    const deleteNotification = useCallback(async (notificationId) => {
        try {
            await apiRef.current.delete(`/notifications/${notificationId}`);
            // Update local state
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
        }
        catch (err) {
            console.error('Failed to delete notification:', err);
            throw err;
        }
    }, []);
    // Get notification preferences
    const getPreferences = useCallback(async () => {
        try {
            const response = await apiRef.current.get('/notifications/preferences');
            return response.data;
        }
        catch (err) {
            console.error('Failed to get preferences:', err);
            throw err;
        }
    }, []);
    // Update notification preferences
    const updatePreferences = useCallback(async (prefs) => {
        try {
            await apiRef.current.put('/notifications/preferences', prefs);
        }
        catch (err) {
            console.error('Failed to update preferences:', err);
            throw err;
        }
    }, []);
    // Send test notification
    const sendTestNotification = useCallback(async () => {
        try {
            await apiRef.current.post('/notifications/test');
        }
        catch (err) {
            console.error('Failed to send test notification:', err);
            throw err;
        }
    }, []);
    // Request browser notification permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (socketRef.current?.connected) {
                socketRef.current.disconnect();
            }
        };
    }, []);
    return {
        notifications,
        unreadCount,
        isConnected,
        loading,
        error,
        connect,
        disconnect,
        markAsRead,
        acknowledge,
        deleteNotification,
        getPreferences,
        updatePreferences,
        sendTestNotification,
        loadNotifications,
    };
}
/**
 * Play notification sound
 */
function playNotificationSound() {
    try {
        // Use Web Audio API or simple beep
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.frequency.value = 800; // Hz
        oscillator.type = 'sine';
        gain.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }
    catch (err) {
        // Audio not available, silently fail
        console.debug('Audio notification not available:', err);
    }
}
//# sourceMappingURL=useNotifications.js.map
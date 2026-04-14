/**
 * useNotifications Hook Tests
 * Unit tests for WebSocket connection and notification state management
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotifications, NotificationPreference } from '../useNotifications';
import axios from 'axios';

// Mock socket.io-client
jest.mock('socket.io-client');
import { io as _io } from 'socket.io-client';
const mockIo = _io as jest.Mock;

// Mock axios
jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('useNotifications Hook', () => {
  let mockSocket: any;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Setup Socket.io mock
    mockSocket = {
      connected: false,
      id: 'socket-123',
      on: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
        mockSocket.handlers = mockSocket.handlers || {};
        mockSocket.handlers[event] = handler;
      }),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };

    mockIo.mockReturnValue(mockSocket);

    // Setup axios mock
    mockAxiosInstance = {
      get: jest.fn(),
      put: jest.fn(),
      post: jest.fn(),
      delete: jest.fn(),
    };

    mockAxios.create.mockReturnValue(mockAxiosInstance);

    // Clear localStorage
    localStorage.clear();
    localStorage.setItem('authToken', 'test-token');

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useNotifications());

      expect(result.current.notifications).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should have all required methods', () => {
      const { result } = renderHook(() => useNotifications());

      expect(typeof result.current.connect).toBe('function');
      expect(typeof result.current.disconnect).toBe('function');
      expect(typeof result.current.markAsRead).toBe('function');
      expect(typeof result.current.acknowledge).toBe('function');
      expect(typeof result.current.deleteNotification).toBe('function');
      expect(typeof result.current.getPreferences).toBe('function');
      expect(typeof result.current.updatePreferences).toBe('function');
      expect(typeof result.current.sendTestNotification).toBe('function');
      expect(typeof result.current.loadNotifications).toBe('function');
    });
  });

  describe('WebSocket Connection', () => {
    it('should connect to WebSocket with correct auth params', async () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.connect('user-1', 'prov-001', 'provider');
      });

      expect(mockIo).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          auth: expect.objectContaining({
            token: 'test-token',
            userId: 'user-1',
            providerId: 'prov-001',
            role: 'provider',
          }),
          reconnection: true,
          reconnectionAttempts: 5,
        })
      );
    });

    it('should set isConnected to true on socket connect', async () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.connect('user-1', 'prov-001', 'provider');
      });

      // Simulate socket connection
      act(() => {
        mockSocket.connected = true;
        mockSocket.handlers.connect();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });

    it('should not reconnect if already connected', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.connect('user-1', 'prov-001', 'provider');
      });

      mockSocket.connected = true;

      const initialCallCount = mockIo.mock.calls.length;

      act(() => {
        result.current.connect('user-1', 'prov-001', 'provider');
      });

      expect(mockIo.mock.calls.length).toBe(initialCallCount);
    });

    it('should handle connection errors', async () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.connect('user-1', 'prov-001', 'provider');
      });

      const errorMsg = 'Connection refused';

      act(() => {
        mockSocket.handlers.connect_error(new Error(errorMsg));
      });

      await waitFor(() => {
        expect(result.current.error).toContain('Conexión fallida');
        expect(result.current.isConnected).toBe(false);
      });
    });

    it('should handle reconnection', async () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.connect('user-1', 'prov-001', 'provider');
      });

      act(() => {
        mockSocket.handlers.reconnect();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Receiving Notifications', () => {
    it('should add received notification to list', async () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.connect('user-1', 'prov-001', 'provider');
      });

      const mockNotification = {
        id: 'notif-1',
        type: 'finding.overdue',
        severity: 'high',
        title: 'Test',
        message: 'Test message',
        timestamp: new Date().toISOString(),
        data: {},
      };

      act(() => {
        mockSocket.handlers.notification(mockNotification);
      });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
        expect(result.current.notifications[0].id).toBe('notif-1');
        expect(result.current.notifications[0].title).toBe('Test');
      });
    });

    it('should increment unread count on notification', async () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.connect('user-1', 'prov-001', 'provider');
      });

      act(() => {
        mockSocket.handlers.notification({
          id: 'notif-1',
          type: 'finding.overdue',
          severity: 'high',
          title: 'Test',
          message: 'Test message',
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(1);
      });
    });

    it('should add notification to top of list', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          notifications: [
            {
              id: 'notif-1',
              type: 'finding.overdue',
              severity: 'high',
              title: 'Old',
              message: 'Old message',
              isRead: false,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      });

      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.connect('user-1', 'prov-001', 'provider');
      });

      // Simulate initial load
      await act(async () => {
        await result.current.loadNotifications();
      });

      // Receive new notification
      act(() => {
        mockSocket.handlers.notification({
          id: 'notif-2',
          type: 'action.overdue',
          severity: 'medium',
          title: 'New',
          message: 'New message',
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(result.current.notifications[0].id).toBe('notif-2');
        expect(result.current.notifications[1].id).toBe('notif-1');
      });
    });
  });

  describe('Mark as Read', () => {
    it('should mark notification as read', async () => {
      const { result } = renderHook(() => useNotifications());

      mockAxiosInstance.put.mockResolvedValueOnce({});

      // Add initial notification
      act(() => {
        result.current.connect('user-1', 'prov-001', 'provider');
      });

      act(() => {
        mockSocket.handlers.notification({
          id: 'notif-1',
          type: 'finding.overdue',
          severity: 'high',
          title: 'Test',
          message: 'Test message',
          timestamp: new Date().toISOString(),
        });
      });

      await act(async () => {
        await result.current.markAsRead('notif-1');
      });

      expect(result.current.notifications[0].isRead).toBe(true);
    });

    it('should decrement unread count', async () => {
      const { result } = renderHook(() => useNotifications());

      mockAxiosInstance.put.mockResolvedValueOnce({});

      act(() => {
        result.current.connect('user-1', 'prov-001', 'provider');
      });

      act(() => {
        mockSocket.handlers.notification({
          id: 'notif-1',
          type: 'finding.overdue',
          severity: 'high',
          title: 'Test',
          message: 'Test message',
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(1);
      });

      await act(async () => {
        await result.current.markAsRead('notif-1');
      });

      expect(result.current.unreadCount).toBe(0);
    });

    it('should handle mark as read errors', async () => {
      const { result } = renderHook(() => useNotifications());

      mockAxiosInstance.put.mockRejectedValueOnce(new Error('API error'));

      act(() => {
        result.current.connect('user-1', 'prov-001', 'provider');
      });

      act(() => {
        mockSocket.handlers.notification({
          id: 'notif-1',
          type: 'finding.overdue',
          severity: 'high',
          title: 'Test',
          message: 'Test message',
          timestamp: new Date().toISOString(),
        });
      });

      await expect(result.current.markAsRead('notif-1')).rejects.toThrow('API error');
    });
  });

  describe('Acknowledge', () => {
    it('should acknowledge notification', async () => {
      const { result } = renderHook(() => useNotifications());

      mockAxiosInstance.put.mockResolvedValueOnce({});

      act(() => {
        result.current.connect('user-1', 'prov-001', 'provider');
      });

      act(() => {
        mockSocket.handlers.notification({
          id: 'notif-1',
          type: 'finding.overdue',
          severity: 'high',
          title: 'Test',
          message: 'Test message',
          timestamp: new Date().toISOString(),
        });
      });

      await act(async () => {
        await result.current.acknowledge('notif-1');
      });

      expect(result.current.notifications[0].isAcknowledged).toBe(true);
    });

    it('should handle acknowledge errors', async () => {
      const { result } = renderHook(() => useNotifications());

      mockAxiosInstance.put.mockRejectedValueOnce(new Error('API error'));

      await expect(result.current.acknowledge('notif-1')).rejects.toThrow('API error');
    });
  });

  describe('Delete Notification', () => {
    it('should delete notification', async () => {
      const { result } = renderHook(() => useNotifications());

      mockAxiosInstance.delete.mockResolvedValueOnce({});

      act(() => {
        result.current.connect('user-1', 'prov-001', 'provider');
      });

      act(() => {
        mockSocket.handlers.notification({
          id: 'notif-1',
          type: 'finding.overdue',
          severity: 'high',
          title: 'Test',
          message: 'Test message',
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
      });

      await act(async () => {
        await result.current.deleteNotification('notif-1');
      });

      expect(result.current.notifications).toHaveLength(0);
    });

    it('should handle delete errors', async () => {
      const { result } = renderHook(() => useNotifications());

      mockAxiosInstance.delete.mockRejectedValueOnce(new Error('API error'));

      await expect(result.current.deleteNotification('notif-1')).rejects.toThrow('API error');
    });
  });

  describe('Load Notifications', () => {
    it('should load notifications from API', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          type: 'finding.overdue',
          severity: 'high',
          title: 'Test 1',
          message: 'Test message 1',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'notif-2',
          type: 'action.overdue',
          severity: 'medium',
          title: 'Test 2',
          message: 'Test message 2',
          isRead: true,
          createdAt: new Date().toISOString(),
        },
      ];

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { notifications: mockNotifications },
      });

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.loadNotifications(20, 0);
      });

      expect(result.current.notifications).toHaveLength(2);
      expect(result.current.notifications[0].id).toBe('notif-1');
    });

    it('should handle load errors', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('API error'));

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.loadNotifications();
      });

      expect(result.current.error).toContain('API error');
    });
  });

  describe('Preferences', () => {
    it('should get preferences', async () => {
      const mockPrefs: NotificationPreference = {
        enable_overdue: true,
        enable_high_risk: false,
        enable_verification: true,
        min_severity: 'high',
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
      };

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: mockPrefs,
      });

      const { result } = renderHook(() => useNotifications());

      let preferences: NotificationPreference | undefined;

      await act(async () => {
        preferences = await result.current.getPreferences();
      });

      expect(preferences).toEqual(mockPrefs);
    });

    it('should update preferences', async () => {
      mockAxiosInstance.put.mockResolvedValueOnce({});

      const { result } = renderHook(() => useNotifications());

      const newPrefs: Partial<NotificationPreference> = {
        enable_overdue: false,
        min_severity: 'critical',
      };

      await act(async () => {
        await result.current.updatePreferences(newPrefs);
      });

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        '/notifications/preferences',
        newPrefs
      );
    });
  });

  describe('Test Notification', () => {
    it('should send test notification', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({});

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.sendTestNotification();
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/notifications/test');
    });
  });

  describe('Disconnect', () => {
    it('should disconnect from WebSocket', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.connect('user-1', 'prov-001', 'provider');
      });

      mockSocket.connected = true;

      act(() => {
        result.current.disconnect();
      });

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should disconnect on unmount', () => {
      const { unmount } = renderHook(() => useNotifications());

      mockSocket.connected = true;

      unmount();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });
});

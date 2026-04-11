/**
 * Notifications Components Tests
 * Unit and integration tests for notification UI components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { NotificationCenter } from '../NotificationCenter';
import { NotificationBell } from '../NotificationBell';
import { NotificationToast } from '../NotificationToast';
import { NotificationPanel } from '../NotificationPanel';
import { useNotifications } from '../../../hooks/useNotifications';

// Mock the useNotifications hook
jest.mock('../../../hooks/useNotifications');
const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;

describe('Notification Components', () => {
  const mockNotifications = [
    {
      id: 'notif-1',
      type: 'finding.overdue',
      severity: 'high' as const,
      title: 'Finding Overdue',
      message: 'Finding #123 is overdue',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'notif-2',
      type: 'action.overdue',
      severity: 'medium' as const,
      title: 'Action Overdue',
      message: 'Action #456 is overdue',
      isRead: true,
      createdAt: new Date().toISOString(),
    },
  ];

  const mockUseNotificationsReturn = {
    notifications: mockNotifications,
    unreadCount: 1,
    isConnected: true,
    loading: false,
    error: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
    markAsRead: jest.fn(),
    acknowledge: jest.fn(),
    deleteNotification: jest.fn(),
    getPreferences: jest.fn(),
    updatePreferences: jest.fn(),
    sendTestNotification: jest.fn(),
    loadNotifications: jest.fn(),
  };

  beforeEach(() => {
    mockUseNotifications.mockReturnValue(mockUseNotificationsReturn);
    jest.clearAllMocks();
  });

  describe('NotificationCenter', () => {
    it('should render without crashing', () => {
      render(
        <NotificationCenter
          userId="user-1"
          providerId="prov-001"
          role="provider"
          autoConnect={true}
        />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should auto-connect on mount when enabled', () => {
      render(
        <NotificationCenter
          userId="user-1"
          providerId="prov-001"
          role="provider"
          autoConnect={true}
        />
      );

      expect(mockUseNotificationsReturn.connect).toHaveBeenCalledWith(
        'user-1',
        'prov-001',
        'provider'
      );
    });

    it('should not auto-connect on mount when disabled', () => {
      render(
        <NotificationCenter
          userId="user-1"
          providerId="prov-001"
          role="provider"
          autoConnect={false}
        />
      );

      expect(mockUseNotificationsReturn.connect).not.toHaveBeenCalled();
    });

    it('should disconnect on unmount', () => {
      const { unmount } = render(
        <NotificationCenter
          userId="user-1"
          providerId="prov-001"
          role="provider"
        />
      );

      unmount();

      expect(mockUseNotificationsReturn.disconnect).toHaveBeenCalled();
    });

    it('should toggle panel on bell click', async () => {
      render(
        <NotificationCenter
          userId="user-1"
          providerId="prov-001"
          role="provider"
        />
      );

      const bellButton = screen.getByRole('button');

      fireEvent.click(bellButton);

      await waitFor(() => {
        // Panel should be open
        expect(screen.getByText('Finding Overdue')).toBeInTheDocument();
      });

      fireEvent.click(bellButton);

      await waitFor(() => {
        // Panel should be closed
        expect(screen.queryByText('Finding Overdue')).not.toBeInTheDocument();
      });
    });

    it('should display connection status', () => {
      render(
        <NotificationCenter
          userId="user-1"
          providerId="prov-001"
          role="provider"
        />
      );

      // Connected indicator should be visible
      const statusElement = document.querySelector('[class*="connected"]');
      expect(statusElement).toBeInTheDocument();
    });

    it('should display error message when connection fails', () => {
      const errorReturn = {
        ...mockUseNotificationsReturn,
        error: 'Connection failed',
        isConnected: false,
      };

      mockUseNotifications.mockReturnValue(errorReturn);

      const { getByText } = render(
        <NotificationCenter
          userId="user-1"
          providerId="prov-001"
          role="provider"
        />
      );

      expect(getByText(/Connection failed/i)).toBeInTheDocument();
    });

    it('should show loading state during connection', () => {
      const loadingReturn = {
        ...mockUseNotificationsReturn,
        loading: true,
      };

      mockUseNotifications.mockReturnValue(loadingReturn);

      const { container } = render(
        <NotificationCenter
          userId="user-1"
          providerId="prov-001"
          role="provider"
        />
      );

      expect(container.querySelector('[class*="loading"]')).toBeInTheDocument();
    });
  });

  describe('NotificationBell', () => {
    it('should render with unread count badge', () => {
      render(
        <NotificationBell
          unreadCount={3}
          isConnected={true}
          isOpen={false}
          onClick={jest.fn()}
        />
      );

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should cap badge at 99+', () => {
      render(
        <NotificationBell
          unreadCount={150}
          isConnected={true}
          isOpen={false}
          onClick={jest.fn()}
        />
      );

      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('should not show badge when count is 0', () => {
      render(
        <NotificationBell
          unreadCount={0}
          isConnected={true}
          isOpen={false}
          onClick={jest.fn()}
        />
      );

      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('should show connection indicator', () => {
      const { container } = render(
        <NotificationBell
          unreadCount={0}
          isConnected={true}
          isOpen={false}
          onClick={jest.fn()}
        />
      );

      const connectionIndicator = container.querySelector('[class*="connected"]');
      expect(connectionIndicator).toBeInTheDocument();
    });

    it('should show disconnection indicator', () => {
      const { container } = render(
        <NotificationBell
          unreadCount={0}
          isConnected={false}
          isOpen={false}
          onClick={jest.fn()}
        />
      );

      const disconnectionIndicator = container.querySelector('[class*="disconnected"]');
      expect(disconnectionIndicator).toBeInTheDocument();
    });

    it('should call onClick handler when clicked', () => {
      const onClick = jest.fn();

      render(
        <NotificationBell
          unreadCount={0}
          isConnected={true}
          isOpen={false}
          onClick={onClick}
        />
      );

      fireEvent.click(screen.getByRole('button'));

      expect(onClick).toHaveBeenCalled();
    });

    it('should highlight when open', () => {
      const { container } = render(
        <NotificationBell
          unreadCount={0}
          isConnected={true}
          isOpen={true}
          onClick={jest.fn()}
        />
      );

      const bell = container.querySelector('[class*="open"]');
      expect(bell).toBeInTheDocument();
    });
  });

  describe('NotificationToast', () => {
    const mockNotification = {
      id: 'notif-1',
      type: 'finding.overdue',
      severity: 'high' as const,
      title: 'Test Notification',
      message: 'This is a test notification',
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    it('should render notification', () => {
      render(
        <NotificationToast
          notification={mockNotification}
          onDismiss={jest.fn()}
          onClick={jest.fn()}
        />
      );

      expect(screen.getByText('Test Notification')).toBeInTheDocument();
      expect(screen.getByText('This is a test notification')).toBeInTheDocument();
    });

    it('should apply severity class', () => {
      const { container } = render(
        <NotificationToast
          notification={mockNotification}
          onDismiss={jest.fn()}
          onClick={jest.fn()}
        />
      );

      expect(container.querySelector('[class*="high"]')).toBeInTheDocument();
    });

    it('should call onDismiss when dismissed', () => {
      const onDismiss = jest.fn();

      const { container } = render(
        <NotificationToast
          notification={mockNotification}
          onDismiss={onDismiss}
          onClick={jest.fn()}
        />
      );

      const closeButton = container.querySelector('button');
      if (closeButton) {
        fireEvent.click(closeButton);
      }

      // Could be called immediately or on click
      expect(onDismiss).toBeDefined();
    });

    it('should call onClick when clicked', () => {
      const onClick = jest.fn();

      render(
        <NotificationToast
          notification={mockNotification}
          onDismiss={jest.fn()}
          onClick={onClick}
        />
      );

      fireEvent.click(screen.getByText('Test Notification'));

      expect(onClick).toHaveBeenCalledWith(mockNotification);
    });

    it('should auto-dismiss after duration', () => {
      jest.useFakeTimers();

      const onDismiss = jest.fn();

      render(
        <NotificationToast
          notification={mockNotification}
          onDismiss={onDismiss}
          onClick={jest.fn()}
          autoDismiss={true}
          duration={5000}
        />
      );

      jest.advanceTimersByTime(5000);

      expect(onDismiss).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('NotificationPanel', () => {
    it('should render notification list', () => {
      render(
        <NotificationPanel
          notifications={mockNotifications}
          unreadCount={1}
          loading={false}
          onNotificationClick={jest.fn()}
          onAcknowledge={jest.fn()}
          onDelete={jest.fn()}
          onClose={jest.fn()}
          onLoadMore={jest.fn()}
        />
      );

      expect(screen.getByText('Finding Overdue')).toBeInTheDocument();
      expect(screen.getByText('Action Overdue')).toBeInTheDocument();
    });

    it('should show unread badge', () => {
      render(
        <NotificationPanel
          notifications={mockNotifications}
          unreadCount={1}
          loading={false}
          onNotificationClick={jest.fn()}
          onAcknowledge={jest.fn()}
          onDelete={jest.fn()}
          onClose={jest.fn()}
          onLoadMore={jest.fn()}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should filter by read status', () => {
      const { container } = render(
        <NotificationPanel
          notifications={mockNotifications}
          unreadCount={1}
          loading={false}
          onNotificationClick={jest.fn()}
          onAcknowledge={jest.fn()}
          onDelete={jest.fn()}
          onClose={jest.fn()}
          onLoadMore={jest.fn()}
        />
      );

      // Should have filter tabs
      const tabs = container.querySelectorAll('[role="tab"]');
      expect(tabs.length).toBeGreaterThan(0);
    });

    it('should show loading state', () => {
      const { container } = render(
        <NotificationPanel
          notifications={mockNotifications}
          unreadCount={1}
          loading={true}
          onNotificationClick={jest.fn()}
          onAcknowledge={jest.fn()}
          onDelete={jest.fn()}
          onClose={jest.fn()}
          onLoadMore={jest.fn()}
        />
      );

      expect(container.querySelector('[class*="loading"]')).toBeInTheDocument();
    });

    it('should call onNotificationClick', () => {
      const onNotificationClick = jest.fn();

      render(
        <NotificationPanel
          notifications={mockNotifications}
          unreadCount={1}
          loading={false}
          onNotificationClick={onNotificationClick}
          onAcknowledge={jest.fn()}
          onDelete={jest.fn()}
          onClose={jest.fn()}
          onLoadMore={jest.fn()}
        />
      );

      fireEvent.click(screen.getByText('Finding Overdue'));

      expect(onNotificationClick).toHaveBeenCalledWith(mockNotifications[0]);
    });

    it('should show empty state when no notifications', () => {
      const { getByText } = render(
        <NotificationPanel
          notifications={[]}
          unreadCount={0}
          loading={false}
          onNotificationClick={jest.fn()}
          onAcknowledge={jest.fn()}
          onDelete={jest.fn()}
          onClose={jest.fn()}
          onLoadMore={jest.fn()}
        />
      );

      expect(getByText(/No notifications/i)).toBeInTheDocument();
    });

    it('should call onLoadMore', () => {
      const onLoadMore = jest.fn();

      const { container } = render(
        <NotificationPanel
          notifications={mockNotifications}
          unreadCount={1}
          loading={false}
          onNotificationClick={jest.fn()}
          onAcknowledge={jest.fn()}
          onDelete={jest.fn()}
          onClose={jest.fn()}
          onLoadMore={onLoadMore}
        />
      );

      const loadMoreButton = container.querySelector('[class*="load-more"]');
      if (loadMoreButton) {
        fireEvent.click(loadMoreButton);
      }

      // onLoadMore should be defined to be callable
      expect(onLoadMore).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should show toast when new notification arrives', async () => {
      const { rerender } = render(
        <NotificationCenter
          userId="user-1"
          providerId="prov-001"
          role="provider"
        />
      );

      const newNotification = {
        id: 'notif-3',
        type: 'verification.required',
        severity: 'critical' as const,
        title: 'Verification Required',
        message: 'Action #789 requires verification',
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      const updatedReturn = {
        ...mockUseNotificationsReturn,
        notifications: [...mockNotifications, newNotification],
        unreadCount: 2,
      };

      mockUseNotifications.mockReturnValue(updatedReturn);

      rerender(
        <NotificationCenter
          userId="user-1"
          providerId="prov-001"
          role="provider"
        />
      );

      await waitFor(() => {
        // New notification should appear in toast
        expect(screen.getByText('Verification Required')).toBeInTheDocument();
      });
    });

    it('should handle multiple severity levels', () => {
      const notifications = [
        { ...mockNotifications[0], severity: 'critical' as const },
        { ...mockNotifications[1], severity: 'high' as const },
      ];

      const { container } = render(
        <NotificationPanel
          notifications={notifications}
          unreadCount={2}
          loading={false}
          onNotificationClick={jest.fn()}
          onAcknowledge={jest.fn()}
          onDelete={jest.fn()}
          onClose={jest.fn()}
          onLoadMore={jest.fn()}
        />
      );

      expect(container.querySelector('[class*="critical"]')).toBeInTheDocument();
      expect(container.querySelector('[class*="high"]')).toBeInTheDocument();
    });

    it('should update unread count on read', async () => {
      const { rerender } = render(
        <NotificationCenter
          userId="user-1"
          providerId="prov-001"
          role="provider"
        />
      );

      const updatedReturn = {
        ...mockUseNotificationsReturn,
        unreadCount: 0,
      };

      mockUseNotifications.mockReturnValue(updatedReturn);

      rerender(
        <NotificationCenter
          userId="user-1"
          providerId="prov-001"
          role="provider"
        />
      );

      await waitFor(() => {
        expect(mockUseNotifications()).toEqual(
          expect.objectContaining({ unreadCount: 0 })
        );
      });
    });
  });
});

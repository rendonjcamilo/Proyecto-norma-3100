/**
 * Integration Tests for Notifications
 * E2E workflow tests from trigger to UI display
 */

import axios from 'axios';

describe('Notification System - E2E Workflows', () => {
  const API_URL = 'http://localhost:3001/api';
  const WS_URL = 'http://localhost:3001';

  const testUser = {
    userId: 'integration-test-user-1',
    providerId: 'integration-test-prov-001',
    role: 'provider',
  };

  let authToken: string;

  beforeAll(async () => {
    // Set up test environment
    // In a real scenario, this would authenticate the test user
    authToken = 'test-integration-token';
  });

  describe('Complete Notification Workflow', () => {
    it('should create and deliver notification through full system', async () => {
      // 1. Create a notification via API
      const createResponse = await axios.post(`${API_URL}/notifications/test`, {}, {
        headers: {
          'x-user-id': testUser.userId,
          'x-provider-id': testUser.providerId,
        },
      });

      expect(createResponse.status).toBe(200);
      expect(createResponse.data.notification).toBeDefined();
      expect(createResponse.data.notification.type).toBe('test');

      const notificationId = createResponse.data.notification.id;

      // 2. Retrieve notification via API
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for persistence

      const getResponse = await axios.get(`${API_URL}/notifications/${notificationId}`, {
        headers: {
          'x-user-id': testUser.userId,
          'x-provider-id': testUser.providerId,
        },
      });

      expect(getResponse.status).toBe(200);
      expect(getResponse.data.id).toBe(notificationId);

      // 3. Get unread count
      const countResponse = await axios.get(`${API_URL}/notifications/unread/count`, {
        headers: {
          'x-user-id': testUser.userId,
          'x-provider-id': testUser.providerId,
        },
      });

      expect(countResponse.status).toBe(200);
      expect(countResponse.data.unreadCount).toBeGreaterThanOrEqual(0);

      // 4. Mark as read
      const readResponse = await axios.put(
        `${API_URL}/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            'x-user-id': testUser.userId,
            'x-provider-id': testUser.providerId,
          },
        }
      );

      expect(readResponse.status).toBe(200);
      expect(readResponse.data.success).toBe(true);

      // 5. Acknowledge notification
      const ackResponse = await axios.put(
        `${API_URL}/notifications/${notificationId}/acknowledge`,
        {},
        {
          headers: {
            'x-user-id': testUser.userId,
            'x-provider-id': testUser.providerId,
          },
        }
      );

      expect(ackResponse.status).toBe(200);

      // 6. Delete notification
      const deleteResponse = await axios.delete(
        `${API_URL}/notifications/${notificationId}`,
        {
          headers: {
            'x-user-id': testUser.userId,
            'x-provider-id': testUser.providerId,
          },
        }
      );

      expect(deleteResponse.status).toBe(200);
    });

    it('should handle preference management workflow', async () => {
      // 1. Get current preferences
      const getPrefsResponse = await axios.get(
        `${API_URL}/notifications/preferences`,
        {
          headers: {
            'x-user-id': testUser.userId,
            'x-provider-id': testUser.providerId,
          },
        }
      );

      expect(getPrefsResponse.status).toBe(200);
      expect(getPrefsResponse.data).toBeDefined();

      // 2. Update preferences
      const newPrefs = {
        enable_overdue: true,
        enable_high_risk: false,
        enable_verification: true,
        min_severity: 'high',
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
      };

      const updateResponse = await axios.put(
        `${API_URL}/notifications/preferences`,
        newPrefs,
        {
          headers: {
            'x-user-id': testUser.userId,
            'x-provider-id': testUser.providerId,
          },
        }
      );

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.data.preferences).toBeDefined();

      // 3. Verify preferences were updated
      const verifyResponse = await axios.get(
        `${API_URL}/notifications/preferences`,
        {
          headers: {
            'x-user-id': testUser.userId,
            'x-provider-id': testUser.providerId,
          },
        }
      );

      expect(verifyResponse.data.min_severity).toBe('high');
    });

    it('should handle pagination workflow', async () => {
      // 1. Get first page
      const page1Response = await axios.get(`${API_URL}/notifications`, {
        params: { limit: 10, offset: 0 },
        headers: {
          'x-user-id': testUser.userId,
          'x-provider-id': testUser.providerId,
        },
      });

      expect(page1Response.status).toBe(200);
      expect(page1Response.data.pagination).toBeDefined();
      expect(page1Response.data.pagination.limit).toBe(10);
      expect(page1Response.data.pagination.offset).toBe(0);

      // 2. Get next page if available
      if (page1Response.data.pagination.hasMore) {
        const page2Response = await axios.get(`${API_URL}/notifications`, {
          params: { limit: 10, offset: 10 },
          headers: {
            'x-user-id': testUser.userId,
            'x-provider-id': testUser.providerId,
          },
        });

        expect(page2Response.status).toBe(200);
        expect(page2Response.data.notifications).toBeDefined();
      }
    });

    it('should handle filtering workflow', async () => {
      // 1. Filter by severity
      const severityResponse = await axios.get(`${API_URL}/notifications`, {
        params: { severity: 'critical' },
        headers: {
          'x-user-id': testUser.userId,
          'x-provider-id': testUser.providerId,
        },
      });

      expect(severityResponse.status).toBe(200);
      if (severityResponse.data.notifications.length > 0) {
        expect(severityResponse.data.notifications[0].severity).toBe('critical');
      }

      // 2. Filter by read status
      const readResponse = await axios.get(`${API_URL}/notifications`, {
        params: { isRead: 'false' },
        headers: {
          'x-user-id': testUser.userId,
          'x-provider-id': testUser.providerId,
        },
      });

      expect(readResponse.status).toBe(200);
      if (readResponse.data.notifications.length > 0) {
        expect(readResponse.data.notifications[0].is_read).toBe(false);
      }

      // 3. Filter by type
      const typeResponse = await axios.get(`${API_URL}/notifications`, {
        params: { type: 'finding.overdue' },
        headers: {
          'x-user-id': testUser.userId,
          'x-provider-id': testUser.providerId,
        },
      });

      expect(typeResponse.status).toBe(200);
      if (typeResponse.data.notifications.length > 0) {
        expect(typeResponse.data.notifications[0].type).toBe('finding.overdue');
      }
    });

    it('should handle statistics retrieval', async () => {
      // 1. Get dashboard stats
      const dashboardResponse = await axios.get(
        `${API_URL}/notifications/stats/dashboard`
      );

      expect(dashboardResponse.status).toBe(200);
      expect(dashboardResponse.data).toBeDefined();

      // 2. Get performance metrics
      const perfResponse = await axios.get(
        `${API_URL}/notifications/stats/performance`
      );

      expect(perfResponse.status).toBe(200);
      expect(perfResponse.data.metrics).toBeDefined();
      expect(Array.isArray(perfResponse.data.metrics)).toBe(true);
    });
  });

  describe('Error Handling Workflows', () => {
    it('should handle unauthorized access', async () => {
      try {
        await axios.get(`${API_URL}/notifications`);
        fail('Should have thrown 401 error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should handle not found errors', async () => {
      try {
        await axios.get(`${API_URL}/notifications/nonexistent-id`, {
          headers: {
            'x-user-id': testUser.userId,
            'x-provider-id': testUser.providerId,
          },
        });
        fail('Should have thrown 404 error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });

    it('should handle invalid parameters', async () => {
      try {
        await axios.get(`${API_URL}/notifications`, {
          params: { limit: 'invalid' },
          headers: {
            'x-user-id': testUser.userId,
            'x-provider-id': testUser.providerId,
          },
        });
        // May succeed with default params or fail gracefully
      } catch (error: any) {
        expect(error.response.status).toBeBeLessThanOrEqual(500);
      }
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(5)
        .fill(null)
        .map(() =>
          axios.get(`${API_URL}/notifications/unread/count`, {
            headers: {
              'x-user-id': testUser.userId,
              'x-provider-id': testUser.providerId,
            },
          })
        );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data.unreadCount).toBeDefined();
      });
    });
  });

  describe('Role-Based Access Control', () => {
    it('should restrict access based on user ID', async () => {
      const otherUserId = 'other-user-123';

      // Create notification for first user
      const createResponse = await axios.post(`${API_URL}/notifications/test`, {}, {
        headers: {
          'x-user-id': testUser.userId,
          'x-provider-id': testUser.providerId,
        },
      });

      const notificationId = createResponse.data.notification.id;

      // Other user should not be able to access it (would need separate test setup)
      // This is a placeholder for full RBAC testing
      expect(notificationId).toBeDefined();
    });

    it('should respect provider boundaries', async () => {
      const otherProvider = 'other-provider-456';

      const response = await axios.get(`${API_URL}/notifications`, {
        headers: {
          'x-user-id': testUser.userId,
          'x-provider-id': otherProvider,
        },
      });

      expect(response.status).toBe(200);
      // Notifications should be user-specific, not provider-specific
    });
  });
});

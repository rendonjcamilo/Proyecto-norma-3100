/**
 * WebSocketManager Tests
 * Unit tests for Socket.io connection management
 */

import { Server as HTTPServer } from 'http';
import { createServer } from 'http';
import { WebSocketManager, WebSocketEvent } from '../websocket-manager';
import { Socket as ClientSocket, io as ioClient } from 'socket.io-client';

describe('WebSocketManager', () => {
  let httpServer: HTTPServer;
  let wsManager: WebSocketManager;
  let clientSocket: ClientSocket;
  const testUrl = 'http://localhost:3002';
  const authToken = 'test-token-123';
  const userId = 'user-1';
  const providerId = 'prov-001';

  beforeEach(() => {
    httpServer = createServer();
    wsManager = new WebSocketManager(httpServer);
    httpServer.listen(3002);
  });

  afterEach(async () => {
    if (clientSocket?.connected) {
      clientSocket.disconnect();
    }
    wsManager.close();
    httpServer.close();
  });

  describe('Connection Management', () => {
    it('should accept valid authenticated connections', (done: jest.DoneCallback) => {
      clientSocket = ioClient(testUrl, {
        auth: {
          token: authToken,
          userId,
          providerId,
          role: 'provider',
        },
        reconnection: false,
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });

      clientSocket.on('connect_error', (err) => {
        done(err);
      });
    });

    it('should reject connections without authentication', (done: jest.DoneCallback) => {
      clientSocket = ioClient(testUrl, {
        reconnection: false,
      });

      clientSocket.on('connect_error', () => {
        expect(clientSocket.connected).toBe(false);
        done();
      });

      setTimeout(() => {
        if (!clientSocket.connected) {
          done();
        }
      }, 1000);
    });

    it('should handle disconnection gracefully', (done: jest.DoneCallback) => {
      clientSocket = ioClient(testUrl, {
        auth: { token: authToken, userId, providerId },
        reconnection: false,
      });

      clientSocket.on('connect', () => {
        clientSocket.disconnect();
        expect(clientSocket.connected).toBe(false);
        done();
      });
    });

    it('should track connected users', (done: jest.DoneCallback) => {
      clientSocket = ioClient(testUrl, {
        auth: { token: authToken, userId, providerId, role: 'provider' },
        reconnection: false,
      });

      clientSocket.on('connect', () => {
        const stats = wsManager.getStats();
        expect(stats.connectedUsers).toBeGreaterThan(0);
        done();
      });
    });

    it('should get connected user count', (done: jest.DoneCallback) => {
      clientSocket = ioClient(testUrl, {
        auth: { token: authToken, userId, providerId },
        reconnection: false,
      });

      clientSocket.on('connect', () => {
        const count = wsManager.getConnectedUsersCount();
        expect(count).toBeGreaterThan(0);
        done();
      });
    });
  });

  describe('Message Broadcasting', () => {
    it('should send notification to specific user', (done: jest.DoneCallback) => {
      clientSocket = ioClient(testUrl, {
        auth: { token: authToken, userId, providerId },
        reconnection: false,
      });

      const testEvent: WebSocketEvent = {
        id: 'evt-1',
        type: 'test',
        severity: 'low',
        providerId,
        title: 'Test',
        message: 'Test message',
        data: {},
        timestamp: new Date().toISOString(),
      };

      clientSocket.on('notification', (event) => {
        expect(event.type).toBe('test');
        expect(event.title).toBe('Test');
        done();
      });

      clientSocket.on('connect', () => {
        wsManager.sendToUser(userId, testEvent);
      });
    });

    it('should send notification to provider room', (done: jest.DoneCallback) => {
      clientSocket = ioClient(testUrl, {
        auth: { token: authToken, userId, providerId },
        reconnection: false,
      });

      const testEvent: WebSocketEvent = {
        type: 'action.overdue',
        severity: 'high',
        providerId,
        title: 'Action Overdue',
        message: 'Your action is overdue',
        data: {},
        timestamp: new Date().toISOString(),
      };

      clientSocket.on('notification', (event) => {
        expect(event.type).toBe('action.overdue');
        expect(event.severity).toBe('high');
        done();
      });

      clientSocket.on('connect', () => {
        wsManager.sendToProvider(providerId, testEvent);
      });
    });

    it('should send notification to auditors only', (done: jest.DoneCallback) => {
      const auditorSocket = ioClient(testUrl, {
        auth: { token: authToken, userId: 'auditor-1', providerId, role: 'auditor' },
        reconnection: false,
      });

      const testEvent: WebSocketEvent = {
        type: 'risk.alert',
        severity: 'critical',
        providerId,
        title: 'Critical Risk',
        message: 'Critical risk detected',
        data: {},
        timestamp: new Date().toISOString(),
      };

      auditorSocket.on('notification', (event) => {
        expect(event.type).toBe('risk.alert');
        expect(event.severity).toBe('critical');
        auditorSocket.disconnect();
        done();
      });

      auditorSocket.on('connect', () => {
        wsManager.sendToAuditors(testEvent);
      });
    });

    it('should broadcast to everyone', (done: jest.DoneCallback) => {
      clientSocket = ioClient(testUrl, {
        auth: { token: authToken, userId, providerId },
        reconnection: false,
      });

      const testEvent: WebSocketEvent = {
        type: 'system.announcement',
        severity: 'medium',
        providerId: 'system',
        title: 'System Announcement',
        message: 'System maintenance scheduled',
        data: {},
        timestamp: new Date().toISOString(),
      };

      clientSocket.on('notification', (event) => {
        expect(event.type).toBe('system.announcement');
        done();
      });

      clientSocket.on('connect', () => {
        wsManager.broadcast(testEvent);
      });
    });
  });

  describe('Room Management', () => {
    it('should handle finding subscription', (done: jest.DoneCallback) => {
      clientSocket = ioClient(testUrl, {
        auth: { token: authToken, userId, providerId },
        reconnection: false,
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('subscribe-finding', 'find-1');

        setTimeout(() => {
          const stats = wsManager.getStats();
          expect(stats.totalRooms).toBeGreaterThan(1);
          done();
        }, 100);
      });
    });

    it('should handle finding unsubscription', (done: jest.DoneCallback) => {
      clientSocket = ioClient(testUrl, {
        auth: { token: authToken, userId, providerId },
        reconnection: false,
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('subscribe-finding', 'find-1');

        setTimeout(() => {
          clientSocket.emit('unsubscribe-finding', 'find-1');
          done();
        }, 100);
      });
    });

    it('should get provider connected users', (done: jest.DoneCallback) => {
      clientSocket = ioClient(testUrl, {
        auth: { token: authToken, userId, providerId },
        reconnection: false,
      });

      clientSocket.on('connect', () => {
        const connectedUsers = wsManager.getProviderConnectedUsers(providerId);
        expect(connectedUsers.length).toBeGreaterThan(0);
        expect(connectedUsers[0].providerId).toBe(providerId);
        done();
      });
    });
  });

  describe('Server Statistics', () => {
    it('should return server stats', (done: jest.DoneCallback) => {
      clientSocket = ioClient(testUrl, {
        auth: { token: authToken, userId, providerId },
        reconnection: false,
      });

      clientSocket.on('connect', () => {
        const stats = wsManager.getStats();
        expect(stats).toHaveProperty('connectedUsers');
        expect(stats).toHaveProperty('providerRooms');
        expect(stats).toHaveProperty('totalRooms');
        expect(stats).toHaveProperty('uptime');
        expect(stats.connectedUsers).toBeGreaterThan(0);
        done();
      });
    });
  });

  describe('Test Notifications', () => {
    it('should handle test notification request', (done: jest.DoneCallback) => {
      clientSocket = ioClient(testUrl, {
        auth: { token: authToken, userId, providerId },
        reconnection: false,
      });

      clientSocket.on('notification', (event) => {
        expect(event.type).toBe('test');
        expect(event.title).toBe('Notificación de Prueba');
        done();
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('test-notification');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid token', (done: jest.DoneCallback) => {
      clientSocket = ioClient(testUrl, {
        auth: { token: 'invalid-token', userId, providerId },
        reconnection: false,
      });

      const timeout = setTimeout(() => {
        expect(clientSocket.connected).toBe(false);
        done();
      }, 1500);

      clientSocket.on('connect_error', () => {
        clearTimeout(timeout);
        expect(clientSocket.connected).toBe(false);
        done();
      });
    }, 10000);

    it('should handle missing userId', (done: jest.DoneCallback) => {
      clientSocket = ioClient(testUrl, {
        auth: { token: authToken, providerId },
        reconnection: false,
      });

      const timeout = setTimeout(() => {
        expect(clientSocket.connected).toBe(false);
        done();
      }, 1500);

      clientSocket.on('connect_error', () => {
        clearTimeout(timeout);
        expect(clientSocket.connected).toBe(false);
        done();
      });
    }, 10000);
  });
});

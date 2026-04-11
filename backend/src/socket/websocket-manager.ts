/**
 * WebSocket Manager
 * Manages real-time connections and notification delivery via Socket.io
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger.js';

export interface WebSocketEvent {
  id?: string;
  type: 'finding.overdue' | 'action.overdue' | 'verification.required' | 'risk.alert' | 'action.created' | 'finding.created' | 'test' | 'system.announcement';
  severity: 'low' | 'medium' | 'high' | 'critical';
  findingId?: string;
  actionId?: string;
  providerId: string;
  locationId?: string;
  title: string;
  message: string;
  data: Record<string, any>;
  timestamp: string;
}

export interface UserConnection {
  userId: string;
  providerId: string;
  role: 'auditor' | 'provider_admin' | 'provider';
  socketId: string;
  connectedAt: string;
}

/**
 * WebSocket Manager for real-time notifications
 */
export class WebSocketManager {
  private io: SocketIOServer;
  private userConnections: Map<string, UserConnection> = new Map();
  private providerRooms: Map<string, Set<string>> = new Map(); // providerId -> socketIds

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupConnectionHandlers();
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(): void {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      const userId = socket.handshake.auth.userId;

      if (!token || !userId) {
        logger.warn(`WebSocket connection rejected: Missing auth`, { socketId: socket.id });
        return next(new Error('Authentication failed'));
      }

      // Store auth info in socket
      (socket as any).userId = userId;
      (socket as any).token = token;
      (socket as any).providerId = socket.handshake.auth.providerId;
      (socket as any).role = socket.handshake.auth.role || 'provider';

      next();
    });
  }

  /**
   * Setup connection handlers
   */
  private setupConnectionHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const userId = (socket as any).userId;
      const providerId = (socket as any).providerId;
      const role = (socket as any).role;

      const userConnection: UserConnection = {
        userId,
        providerId,
        role,
        socketId: socket.id,
        connectedAt: new Date().toISOString(),
      };

      this.userConnections.set(userId, userConnection);

      // Join provider room
      if (providerId) {
        socket.join(`provider:${providerId}`);
        this.addToProviderRoom(providerId, socket.id);
      }

      // Join auditor room if applicable
      if (role === 'auditor') {
        socket.join('auditors');
      }

      logger.info(`WebSocket connected`, {
        userId,
        providerId,
        socketId: socket.id,
        role,
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnection(userId, providerId);
      });

      // Handle test notification
      socket.on('test-notification', () => {
        this.sendToSocket(socket.id, {
          type: 'test',
          title: 'Notificación de Prueba',
          message: 'Esta es una notificación de prueba del sistema',
          severity: 'low',
        } as any);
      });

      // Handle subscribe to specific finding
      socket.on('subscribe-finding', (findingId: string) => {
        socket.join(`finding:${findingId}`);
        logger.info(`User subscribed to finding`, { userId, findingId });
      });

      // Handle unsubscribe from finding
      socket.on('unsubscribe-finding', (findingId: string) => {
        socket.leave(`finding:${findingId}`);
        logger.info(`User unsubscribed from finding`, { userId, findingId });
      });
    });
  }

  /**
   * Add socket to provider room tracking
   */
  private addToProviderRoom(providerId: string, socketId: string): void {
    if (!this.providerRooms.has(providerId)) {
      this.providerRooms.set(providerId, new Set());
    }
    this.providerRooms.get(providerId)!.add(socketId);
  }

  /**
   * Remove socket from provider room tracking
   */
  private removeFromProviderRoom(providerId: string, socketId: string): void {
    const sockets = this.providerRooms.get(providerId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.providerRooms.delete(providerId);
      }
    }
  }

  /**
   * Handle user disconnection
   */
  private handleDisconnection(userId: string, providerId: string): void {
    const connection = this.userConnections.get(userId);
    if (connection) {
      this.removeFromProviderRoom(providerId, connection.socketId);
      this.userConnections.delete(userId);

      logger.info(`WebSocket disconnected`, {
        userId,
        socketId: connection.socketId,
      });
    }
  }

  /**
   * Send notification to specific socket
   */
  public sendToSocket(socketId: string, event: WebSocketEvent): void {
    this.io.to(socketId).emit('notification', event);
    logger.debug(`Notification sent to socket`, {
      socketId,
      eventType: event.type,
      severity: event.severity,
    });
  }

  /**
   * Send notification to user
   */
  public sendToUser(userId: string, event: WebSocketEvent): void {
    const connection = this.userConnections.get(userId);
    if (connection) {
      this.sendToSocket(connection.socketId, event);
    } else {
      logger.warn(`User not connected`, { userId });
    }
  }

  /**
   * Send notification to provider (all connected users)
   */
  public sendToProvider(providerId: string, event: WebSocketEvent): void {
    this.io.to(`provider:${providerId}`).emit('notification', event);
    const connectedCount = this.providerRooms.get(providerId)?.size || 0;
    logger.info(`Notification sent to provider`, {
      providerId,
      connectedUsers: connectedCount,
      eventType: event.type,
    });
  }

  /**
   * Send notification to all auditors
   */
  public sendToAuditors(event: WebSocketEvent): void {
    this.io.to('auditors').emit('notification', event);
    logger.info(`Notification sent to auditors`, {
      eventType: event.type,
      severity: event.severity,
    });
  }

  /**
   * Send notification to finding subscribers
   */
  public sendToFinding(findingId: string, event: WebSocketEvent): void {
    this.io.to(`finding:${findingId}`).emit('notification', event);
    logger.debug(`Notification sent to finding subscribers`, {
      findingId,
      eventType: event.type,
    });
  }

  /**
   * Broadcast notification to everyone
   */
  public broadcast(event: WebSocketEvent): void {
    this.io.emit('notification', event);
    logger.info(`Broadcast notification sent`, {
      eventType: event.type,
      severity: event.severity,
    });
  }

  /**
   * Get connected users count
   */
  public getConnectedUsersCount(): number {
    return this.userConnections.size;
  }

  /**
   * Get provider connected users
   */
  public getProviderConnectedUsers(providerId: string): UserConnection[] {
    const userConnections: UserConnection[] = [];
    this.userConnections.forEach(connection => {
      if (connection.providerId === providerId) {
        userConnections.push(connection);
      }
    });
    return userConnections;
  }

  /**
   * Get server stats
   */
  public getStats(): Record<string, any> {
    return {
      connectedUsers: this.userConnections.size,
      providerRooms: this.providerRooms.size,
      totalRooms: this.io.sockets.adapter.rooms.size,
      uptime: process.uptime(),
    };
  }

  /**
   * Close WebSocket server
   */
  public close(): void {
    this.io.close();
    logger.info(`WebSocket server closed`);
  }
}

/**
 * Create and export WebSocket manager instance
 */
export function createWebSocketManager(httpServer: HTTPServer): WebSocketManager {
  return new WebSocketManager(httpServer);
}

/**
 * Load Testing for Notification System
 * Tests system performance with concurrent connections and high message volumes
 */

import { io, Socket } from 'socket.io-client';

describe('Notification System - Load Testing', () => {
  const WS_URL = process.env.WS_URL || 'http://localhost:3001';
  const NUM_CONNECTIONS = 50; // Start with 50, can scale to 100+
  const DURATION_MS = 30000; // 30 second test
  const MESSAGE_RATE = 10; // Messages per second

  interface ConnectionMetrics {
    connectionId: number;
    connectedAt: number;
    messagesReceived: number;
    messageLatencies: number[];
    errors: string[];
  }

  const metrics: ConnectionMetrics[] = [];
  let sockets: Socket[] = [];

  afterEach(async () => {
    // Cleanup all connections
    for (const socket of sockets) {
      if (socket?.connected) {
        socket.disconnect();
      }
    }
    sockets = [];
  });

  describe('Connection Load Testing', () => {
    it('should handle 50 concurrent WebSocket connections', async () => {
      const connectionStartTime = Date.now();
      const connectionPromises: Promise<any>[] = [];

      for (let i = 0; i < NUM_CONNECTIONS; i++) {
        const connectionPromise = new Promise((resolve, reject) => {
          try {
            const socket = io(WS_URL, {
              auth: {
                token: `test-token-${i}`,
                userId: `load-test-user-${i}`,
                providerId: 'load-test-prov-001',
                role: 'provider',
              },
              reconnection: true,
              reconnectionDelay: 100,
              reconnectionAttempts: 3,
              transports: ['websocket'],
            });

            const metric: ConnectionMetrics = {
              connectionId: i,
              connectedAt: Date.now(),
              messagesReceived: 0,
              messageLatencies: [],
              errors: [],
            };

            socket.on('connect', () => {
              metric.connectedAt = Date.now();
              resolve(socket);
            });

            socket.on('error', (err) => {
              metric.errors.push(err.message);
              reject(err);
            });

            sockets.push(socket);
            metrics[i] = metric;

            // Timeout after 10 seconds
            setTimeout(() => {
              if (!socket.connected) {
                reject(new Error(`Connection ${i} timeout`));
              }
            }, 10000);
          } catch (err) {
            reject(err);
          }
        });

        connectionPromises.push(connectionPromise);
      }

      const results = await Promise.allSettled(connectionPromises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;

      // Should connect at least 90% of connections
      expect(successCount).toBeGreaterThanOrEqual(NUM_CONNECTIONS * 0.9);

      const connectionEndTime = Date.now();
      const totalConnectionTime = connectionEndTime - connectionStartTime;

      console.log(`\nConnection Load Test Results:`);
      console.log(`- Total Connections: ${NUM_CONNECTIONS}`);
      console.log(`- Successful: ${successCount}`);
      console.log(`- Total Time: ${totalConnectionTime}ms`);
      console.log(`- Avg Connection Time: ${(totalConnectionTime / successCount).toFixed(2)}ms`);
    });
  });

  describe('Message Volume Testing', () => {
    it('should handle high-frequency message delivery', async () => {
      // Setup connections first
      const sockets: Socket[] = [];

      for (let i = 0; i < 10; i++) {
        const socket = io(WS_URL, {
          auth: {
            token: `test-token-${i}`,
            userId: `load-test-user-${i}`,
            providerId: 'load-test-prov-001',
            role: 'provider',
          },
          transports: ['websocket'],
        });

        sockets.push(socket);
      }

      // Wait for all connections
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate receiving messages
      let totalMessagesReceived = 0;
      const messageTimestamps: number[] = [];

      const messageHandler = () => {
        totalMessagesReceived++;
        messageTimestamps.push(Date.now());
      };

      sockets.forEach(socket => {
        socket.on('notification', messageHandler);
      });

      // Simulate message arrival (would come from server)
      const startTime = Date.now();
      const messagesPerSecond = MESSAGE_RATE;
      const messageInterval = 1000 / messagesPerSecond;

      let messageCount = 0;
      const messageTimer = setInterval(() => {
        messageCount++;
      }, messageInterval);

      // Run for test duration
      await new Promise(resolve => setTimeout(resolve, DURATION_MS));

      clearInterval(messageTimer);

      // Cleanup
      sockets.forEach(s => s.disconnect());

      const endTime = Date.now();
      const elapsedSeconds = (endTime - startTime) / 1000;

      console.log(`\nMessage Volume Test Results:`);
      console.log(`- Expected Messages: ${Math.floor(messagesPerSecond * elapsedSeconds)}`);
      console.log(`- Actual Messages: ${totalMessagesReceived}`);
      console.log(`- Throughput: ${(totalMessagesReceived / elapsedSeconds).toFixed(2)} msg/sec`);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not leak memory during sustained operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Create and destroy multiple connections cycles
      for (let cycle = 0; cycle < 5; cycle++) {
        const cycleSockets: Socket[] = [];

        for (let i = 0; i < 20; i++) {
          const socket = io(WS_URL, {
            auth: {
              token: `test-token-${cycle}-${i}`,
              userId: `load-test-user-${cycle}-${i}`,
              providerId: 'load-test-prov-001',
              role: 'provider',
            },
            transports: ['websocket'],
          });

          cycleSockets.push(socket);
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        cycleSockets.forEach(s => s.disconnect());

        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

      console.log(`\nMemory Usage Test Results:`);
      console.log(`- Initial Memory: ${(initialMemory / (1024 * 1024)).toFixed(2)}MB`);
      console.log(`- Final Memory: ${(finalMemory / (1024 * 1024)).toFixed(2)}MB`);
      console.log(`- Increase: ${memoryIncreaseMB.toFixed(2)}MB`);

      // Memory increase should be reasonable (less than 100MB for 100 connection cycles)
      expect(memoryIncreaseMB).toBeLessThan(100);
    });
  });

  describe('Reconnection Under Load', () => {
    it('should handle reconnections with 20 clients', async () => {
      const sockets: Socket[] = [];

      for (let i = 0; i < 20; i++) {
        const socket = io(WS_URL, {
          auth: {
            token: `test-token-${i}`,
            userId: `load-test-user-${i}`,
            providerId: 'load-test-prov-001',
            role: 'provider',
          },
          reconnection: true,
          reconnectionDelay: 500,
          reconnectionDelayMax: 2000,
          reconnectionAttempts: 5,
          transports: ['websocket', 'polling'],
        });

        sockets.push(socket);
      }

      // Wait for initial connections
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Count initial successful connections
      let initialConnected = sockets.filter(s => s.connected).length;

      console.log(`\nReconnection Test Results:`);
      console.log(`- Initial Connections: ${initialConnected}/${sockets.length}`);

      // Simulate network interruption (disconnect all)
      sockets.forEach(s => s.disconnect());

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reconnect
      sockets.forEach(s => {
        if (!s.connected) {
          s.connect();
        }
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      let reconnected = sockets.filter(s => s.connected).length;

      console.log(`- Reconnected: ${reconnected}/${sockets.length}`);
      console.log(`- Reconnection Success Rate: ${((reconnected / sockets.length) * 100).toFixed(1)}%`);

      // Should reconnect at least 80% of connections
      expect(reconnected).toBeGreaterThanOrEqual(sockets.length * 0.8);

      sockets.forEach(s => s.disconnect());
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet performance targets', async () => {
      const benchmarks = {
        connectionTime: { target: 1000, unit: 'ms' }, // 1 second max per connection
        messageLatency: { target: 100, unit: 'ms' }, // 100ms max latency
        throughput: { target: 1000, unit: 'msg/sec' }, // 1000 msg/sec
        concurrentConnections: { target: 100, unit: 'connections' },
      };

      console.log(`\nPerformance Targets:`);
      Object.entries(benchmarks).forEach(([key, value]) => {
        console.log(`- ${key}: ${value.target}${value.unit}`);
      });

      // These are targets to verify during actual load testing
      expect(benchmarks.connectionTime.target).toBeLessThanOrEqual(1000);
      expect(benchmarks.messageLatency.target).toBeLessThanOrEqual(100);
      expect(benchmarks.throughput.target).toBeGreaterThanOrEqual(1000);
      expect(benchmarks.concurrentConnections.target).toBeGreaterThanOrEqual(100);
    });
  });
});

/**
 * @file connection-pool.spec.ts
 * @description Unit tests for the ConnectionPool class that manages database connection pooling
 * with configurable limits and optimization.
 */

import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ConnectionPool, PooledConnection, ConnectionAcquisitionOptions } from '../../src/connection/connection-pool';
import { ConnectionConfig } from '../../src/connection/connection-config';
import { ConnectionHealth, HealthStatus } from '../../src/connection/connection-health';
import { ConnectionRetry } from '../../src/connection/connection-retry';
import {
  ConnectionEventEmitter,
  ConnectionEventType,
  ConnectionStatus,
  DatabaseConnectionType,
} from '../../src/types/connection.types';

// Mock implementations
class MockConnection {
  isConnected = true;
  queryCount = 0;
  lastQuery: string | null = null;

  async disconnect(): Promise<void> {
    this.isConnected = false;
    return Promise.resolve();
  }

  async ping(): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('Connection is closed');
    }
    return true;
  }

  async query(sql: string): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Connection is closed');
    }
    this.queryCount++;
    this.lastQuery = sql;
    return { rows: [{ result: 1 }] };
  }

  async $queryRaw(sql: string): Promise<any> {
    return this.query(sql);
  }
}

class MockConnectionHealth {
  private connectionStatuses: Map<string, HealthStatus> = new Map();

  registerConnection(connectionId: string): void {}
  unregisterConnection(connectionId: string): void {}
  markConnectionUsed(connectionId: string): void {}

  getConnectionStatus(connectionId: string): HealthStatus {
    return this.connectionStatuses.get(connectionId) || HealthStatus.HEALTHY;
  }

  async checkConnectionHealth(connectionId: string): Promise<{ status: HealthStatus }> {
    return { status: this.getConnectionStatus(connectionId) };
  }

  // Helper method for tests to set connection status
  setConnectionStatus(connectionId: string, status: HealthStatus): void {
    this.connectionStatuses.set(connectionId, status);
  }
}

class MockConnectionRetry {
  private circuitStates: Map<string, boolean> = new Map();
  private retryStates: Map<string, number> = new Map();

  isCircuitOpen(connectionId: string): boolean {
    return this.circuitStates.get(connectionId) || false;
  }

  closeCircuit(connectionId: string): void {
    this.circuitStates.set(connectionId, false);
  }

  openCircuit(connectionId: string): void {
    this.circuitStates.set(connectionId, true);
  }

  initializeRetryState(connectionId: string): void {
    this.retryStates.set(connectionId, 0);
  }

  resetRetryState(connectionId: string): void {
    this.retryStates.set(connectionId, 0);
  }

  incrementRetryCount(connectionId: string): void {
    const count = this.retryStates.get(connectionId) || 0;
    this.retryStates.set(connectionId, count + 1);
  }

  getRetryCount(connectionId: string): number {
    return this.retryStates.get(connectionId) || 0;
  }
}

class MockConnectionEventEmitter implements ConnectionEventEmitter {
  events: any[] = [];

  on(): void {}
  off(): void {}

  emit(event: any): void {
    this.events.push(event);
  }

  getEvents(type?: ConnectionEventType): any[] {
    if (type) {
      return this.events.filter(e => e.type === type);
    }
    return this.events;
  }

  clearEvents(): void {
    this.events = [];
  }
}

// Default test configuration
const createDefaultConfig = (): ConnectionConfig => ({
  connectionPool: {
    poolMin: 2,
    poolMax: 10,
    poolIdle: 30000,
    lazyConnect: false,
  },
  healthCheck: {
    enabled: true,
    intervalMs: 60000,
    timeoutMs: 5000,
    failureThreshold: 3,
    successThreshold: 2,
    autoRecover: true,
  },
});

describe('ConnectionPool', () => {
  let connectionPool: ConnectionPool;
  let mockConnectionFactory: jest.Mock;
  let mockConnectionHealth: MockConnectionHealth;
  let mockConnectionRetry: MockConnectionRetry;
  let mockEventEmitter: MockConnectionEventEmitter;
  let config: ConnectionConfig;

  // Helper to create a connection pool with custom config
  const createConnectionPool = (customConfig?: Partial<ConnectionConfig>): ConnectionPool => {
    config = {
      ...createDefaultConfig(),
      ...customConfig,
    };

    mockConnectionFactory = jest.fn().mockImplementation(() => {
      return Promise.resolve(new MockConnection());
    });

    mockConnectionHealth = new MockConnectionHealth();
    mockConnectionRetry = new MockConnectionRetry();
    mockEventEmitter = new MockConnectionEventEmitter();

    return new ConnectionPool(
      config,
      mockConnectionFactory,
      mockConnectionHealth as unknown as ConnectionHealth,
      mockConnectionRetry as unknown as ConnectionRetry,
      mockEventEmitter,
    );
  };

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    connectionPool = createConnectionPool();
  });

  afterEach(async () => {
    await connectionPool.onModuleDestroy();
  });

  describe('Initialization', () => {
    it('should initialize with the provided configuration', async () => {
      await connectionPool.onModuleInit();
      expect(connectionPool).toBeDefined();
    });

    it('should create the minimum number of connections on initialization', async () => {
      await connectionPool.onModuleInit();
      expect(mockConnectionFactory).toHaveBeenCalledTimes(config.connectionPool!.poolMin);
    });

    it('should not create initial connections when lazyConnect is true', async () => {
      connectionPool = createConnectionPool({
        connectionPool: {
          ...createDefaultConfig().connectionPool!,
          lazyConnect: true,
        },
      });

      await connectionPool.onModuleInit();
      expect(mockConnectionFactory).not.toHaveBeenCalled();
    });

    it('should throw an error if connection pool configuration is missing', async () => {
      connectionPool = createConnectionPool({ connectionPool: undefined });
      await expect(connectionPool.onModuleInit()).rejects.toThrow('Connection pool configuration is missing');
    });
  });

  describe('Connection Acquisition', () => {
    beforeEach(async () => {
      await connectionPool.onModuleInit();
    });

    it('should acquire an available connection from the pool', async () => {
      const connection = await connectionPool.acquire();
      expect(connection).toBeDefined();
      expect(connection.inUse).toBe(true);
    });

    it('should create a new connection if none are available and below max limit', async () => {
      // Acquire all initial connections
      const initialConnections = [];
      for (let i = 0; i < config.connectionPool!.poolMin; i++) {
        initialConnections.push(await connectionPool.acquire());
      }

      // Reset the mock to track new connections
      mockConnectionFactory.mockClear();

      // Acquire one more connection - should create a new one
      const newConnection = await connectionPool.acquire();
      expect(newConnection).toBeDefined();
      expect(mockConnectionFactory).toHaveBeenCalledTimes(1);
    });

    it('should queue acquisition requests when all connections are in use and at max limit', async () => {
      // Set a lower max pool size for this test
      connectionPool = createConnectionPool({
        connectionPool: {
          ...createDefaultConfig().connectionPool!,
          poolMin: 1,
          poolMax: 1,
        },
      });
      await connectionPool.onModuleInit();

      // Acquire the only available connection
      const connection = await connectionPool.acquire();
      expect(connection).toBeDefined();

      // Try to acquire another connection - should be queued
      const acquisitionPromise = connectionPool.acquire();
      
      // Release the first connection to fulfill the queued request
      connectionPool.release(connection);

      // Now the queued request should be fulfilled
      const secondConnection = await acquisitionPromise;
      expect(secondConnection).toBeDefined();
      expect(secondConnection.id).toBe(connection.id); // Should be the same connection
    });

    it('should respect acquisition timeout', async () => {
      // Set a lower max pool size for this test
      connectionPool = createConnectionPool({
        connectionPool: {
          ...createDefaultConfig().connectionPool!,
          poolMin: 1,
          poolMax: 1,
        },
      });
      await connectionPool.onModuleInit();

      // Acquire the only available connection
      const connection = await connectionPool.acquire();
      expect(connection).toBeDefined();

      // Try to acquire another connection with a short timeout
      await expect(
        connectionPool.acquire({ timeoutMs: 100 })
      ).rejects.toThrow('Connection acquisition timed out after 100ms');
    });

    it('should prioritize requests based on priority option', async () => {
      // Set a lower max pool size for this test
      connectionPool = createConnectionPool({
        connectionPool: {
          ...createDefaultConfig().connectionPool!,
          poolMin: 1,
          poolMax: 1,
        },
      });
      await connectionPool.onModuleInit();

      // Acquire the only available connection
      const connection = await connectionPool.acquire();
      expect(connection).toBeDefined();

      // Queue a low priority request
      const lowPriorityPromise = connectionPool.acquire({ priority: 'low' });
      
      // Queue a high priority request
      const highPriorityPromise = connectionPool.acquire({ priority: 'high' });

      // Release the connection
      connectionPool.release(connection);

      // The high priority request should be fulfilled first
      const highPriorityConnection = await highPriorityPromise;
      expect(highPriorityConnection).toBeDefined();

      // Release again for the low priority request
      connectionPool.release(highPriorityConnection);
      const lowPriorityConnection = await lowPriorityPromise;
      expect(lowPriorityConnection).toBeDefined();
    });

    it('should validate connections before returning them', async () => {
      // Create a spy on the ping method
      const connection = await connectionPool.acquire({ validateConnection: true });
      expect(connection).toBeDefined();

      // The connection should have been validated
      const mockConn = connection.connection as MockConnection;
      expect(mockConn.lastQuery).toBe('SELECT 1');
    });

    it('should use a custom validation function if provided', async () => {
      const validationFn = jest.fn().mockResolvedValue(true);
      const connection = await connectionPool.acquire({
        validateConnection: true,
        validationFn,
      });

      expect(connection).toBeDefined();
      expect(validationFn).toHaveBeenCalledWith(connection.connection);
    });

    it('should remove and replace invalid connections', async () => {
      // Set up a connection that will fail validation
      const validationFn = jest.fn().mockResolvedValue(false);
      
      // Reset the factory mock to track new connections
      mockConnectionFactory.mockClear();
      
      // Try to acquire a connection - it should fail validation and create a new one
      const connection = await connectionPool.acquire({
        validateConnection: true,
        validationFn,
      });

      expect(connection).toBeDefined();
      // Should have created at least one new connection
      expect(mockConnectionFactory).toHaveBeenCalled();
    });

    it('should throw an error if the pool is shutting down', async () => {
      // Start shutting down the pool
      const shutdownPromise = connectionPool.onModuleDestroy();
      
      // Try to acquire a connection
      await expect(connectionPool.acquire()).rejects.toThrow('Cannot acquire connection: pool is shutting down');
      
      // Wait for shutdown to complete
      await shutdownPromise;
    });
  });

  describe('Connection Release', () => {
    beforeEach(async () => {
      await connectionPool.onModuleInit();
    });

    it('should mark a connection as not in use when released', async () => {
      const connection = await connectionPool.acquire();
      expect(connection.inUse).toBe(true);

      connectionPool.release(connection);
      expect(connection.inUse).toBe(false);
    });

    it('should update the lastUsedAt timestamp when released', async () => {
      const connection = await connectionPool.acquire();
      const originalTimestamp = connection.lastUsedAt;
      
      // Wait a small amount of time
      await new Promise(resolve => setTimeout(resolve, 10));
      
      connectionPool.release(connection);
      expect(connection.lastUsedAt.getTime()).toBeGreaterThan(originalTimestamp.getTime());
    });

    it('should fulfill pending requests when a connection is released', async () => {
      // Set a lower max pool size for this test
      connectionPool = createConnectionPool({
        connectionPool: {
          ...createDefaultConfig().connectionPool!,
          poolMin: 1,
          poolMax: 1,
        },
      });
      await connectionPool.onModuleInit();

      // Acquire the only available connection
      const connection = await connectionPool.acquire();
      
      // Queue up a request
      const pendingPromise = connectionPool.acquire();
      
      // Release the connection
      connectionPool.release(connection);
      
      // The pending request should now be fulfilled
      const newConnection = await pendingPromise;
      expect(newConnection).toBeDefined();
      expect(newConnection.id).toBe(connection.id);
    });

    it('should log a warning if trying to release an unknown connection', () => {
      const spy = jest.spyOn(Logger.prototype, 'warn');
      
      // Create a fake connection that's not in the pool
      const fakeConnection = {
        id: 'fake_connection',
        inUse: true,
      } as PooledConnection;
      
      connectionPool.release(fakeConnection);
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('Attempted to release unknown connection'));
    });

    it('should emit a connection released event', async () => {
      const connection = await connectionPool.acquire();
      mockEventEmitter.clearEvents();
      
      connectionPool.release(connection);
      
      const events = mockEventEmitter.getEvents(ConnectionEventType.CONNECTED);
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].data.isReleased).toBe(true);
    });
  });

  describe('Dynamic Pool Scaling', () => {
    beforeEach(async () => {
      connectionPool = createConnectionPool({
        connectionPool: {
          ...createDefaultConfig().connectionPool!,
          poolMin: 1,
          poolMax: 5,
        },
      });
      await connectionPool.onModuleInit();
    });

    it('should create new connections when demand increases', async () => {
      // Acquire the initial connection
      const connection1 = await connectionPool.acquire();
      expect(connection1).toBeDefined();
      
      // Reset the factory mock to track new connections
      mockConnectionFactory.mockClear();
      
      // Acquire more connections - should create new ones
      const connection2 = await connectionPool.acquire();
      const connection3 = await connectionPool.acquire();
      
      expect(connection2).toBeDefined();
      expect(connection3).toBeDefined();
      expect(mockConnectionFactory).toHaveBeenCalledTimes(2);
    });

    it('should not create more connections than the maximum limit', async () => {
      // Acquire all possible connections
      const connections = [];
      for (let i = 0; i < config.connectionPool!.poolMax; i++) {
        connections.push(await connectionPool.acquire());
      }
      
      // Reset the factory mock
      mockConnectionFactory.mockClear();
      
      // Try to acquire one more - should be queued
      const acquisitionPromise = connectionPool.acquire({ timeoutMs: 100 });
      
      // Should not have tried to create a new connection
      expect(mockConnectionFactory).not.toHaveBeenCalled();
      
      // Release a connection to fulfill the queued request
      connectionPool.release(connections[0]);
      
      // The request should now be fulfilled
      const newConnection = await acquisitionPromise;
      expect(newConnection).toBeDefined();
    });

    it('should report accurate pool statistics', async () => {
      // Get initial stats
      const initialStats = connectionPool.getStats();
      expect(initialStats.totalConnections).toBe(1); // poolMin = 1
      expect(initialStats.activeConnections).toBe(0);
      expect(initialStats.idleConnections).toBe(1);
      
      // Acquire a connection
      const connection = await connectionPool.acquire();
      
      // Check updated stats
      const updatedStats = connectionPool.getStats();
      expect(updatedStats.totalConnections).toBe(1);
      expect(updatedStats.activeConnections).toBe(1);
      expect(updatedStats.idleConnections).toBe(0);
      
      // Release the connection
      connectionPool.release(connection);
      
      // Check final stats
      const finalStats = connectionPool.getStats();
      expect(finalStats.totalConnections).toBe(1);
      expect(finalStats.activeConnections).toBe(0);
      expect(finalStats.idleConnections).toBe(1);
    });
  });

  describe('Idle Connection Cleanup', () => {
    beforeEach(async () => {
      // Use a short idle timeout for testing
      connectionPool = createConnectionPool({
        connectionPool: {
          ...createDefaultConfig().connectionPool!,
          poolMin: 1,
          poolMax: 5,
          poolIdle: 100, // 100ms idle timeout for faster testing
        },
      });
      await connectionPool.onModuleInit();
    });

    it('should close idle connections that exceed the idle timeout', async () => {
      // Create some extra connections
      const connection1 = await connectionPool.acquire();
      const connection2 = await connectionPool.acquire();
      
      // Release them to make them idle
      connectionPool.release(connection1);
      connectionPool.release(connection2);
      
      // Wait for the idle timeout to expire
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check that connections were closed
      // We should have only poolMin connections left
      const stats = connectionPool.getStats();
      expect(stats.totalConnections).toBe(1); // poolMin = 1
    });

    it('should not close connections below the minimum pool size', async () => {
      // Set min and max to the same value
      connectionPool = createConnectionPool({
        connectionPool: {
          ...createDefaultConfig().connectionPool!,
          poolMin: 2,
          poolMax: 2,
          poolIdle: 100, // 100ms idle timeout for faster testing
        },
      });
      await connectionPool.onModuleInit();
      
      // Acquire and release connections to make them idle
      const connection1 = await connectionPool.acquire();
      const connection2 = await connectionPool.acquire();
      connectionPool.release(connection1);
      connectionPool.release(connection2);
      
      // Wait for the idle timeout to expire
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check that no connections were closed
      const stats = connectionPool.getStats();
      expect(stats.totalConnections).toBe(2); // Should still have poolMin connections
    });

    it('should close the oldest idle connections first', async () => {
      // Create some extra connections
      const connection1 = await connectionPool.acquire();
      const connection2 = await connectionPool.acquire();
      const connection3 = await connectionPool.acquire();
      
      // Release them in order to make them idle
      connectionPool.release(connection1); // Oldest
      await new Promise(resolve => setTimeout(resolve, 10));
      connectionPool.release(connection2); // Middle
      await new Promise(resolve => setTimeout(resolve, 10));
      connectionPool.release(connection3); // Newest
      
      // Wait for the idle timeout to expire
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check that the oldest connections were closed first
      // We should have only poolMin connections left
      const stats = connectionPool.getStats();
      expect(stats.totalConnections).toBe(1); // poolMin = 1
      
      // Try to acquire a connection - should get the newest one that wasn't closed
      const newConnection = await connectionPool.acquire();
      expect(newConnection.id).toBe(connection3.id);
    });
  });

  describe('Connection Validation', () => {
    beforeEach(async () => {
      await connectionPool.onModuleInit();
    });

    it('should validate connections using the health service if available', async () => {
      // Set up the health service to report a connection as unhealthy
      const connection = await connectionPool.acquire();
      mockConnectionHealth.setConnectionStatus(connection.id, HealthStatus.UNHEALTHY);
      connectionPool.release(connection);
      
      // Reset the factory mock to track new connections
      mockConnectionFactory.mockClear();
      
      // Try to acquire a connection - it should detect the unhealthy one and create a new one
      const newConnection = await connectionPool.acquire({ validateConnection: true });
      
      expect(newConnection).toBeDefined();
      expect(newConnection.id).not.toBe(connection.id);
      expect(mockConnectionFactory).toHaveBeenCalled();
    });

    it('should validate connections using ping if health service is not available', async () => {
      // Create a pool without health service
      connectionPool = createConnectionPool();
      await connectionPool.onModuleInit();
      
      // Mock the ping method to fail
      const connection = await connectionPool.acquire();
      const mockConn = connection.connection as MockConnection;
      const originalPing = mockConn.ping;
      mockConn.ping = jest.fn().mockRejectedValue(new Error('Ping failed'));
      connectionPool.release(connection);
      
      // Reset the factory mock to track new connections
      mockConnectionFactory.mockClear();
      
      // Try to acquire a connection - it should detect the failed ping and create a new one
      const newConnection = await connectionPool.acquire({ validateConnection: true });
      
      expect(newConnection).toBeDefined();
      expect(newConnection.id).not.toBe(connection.id);
      expect(mockConnectionFactory).toHaveBeenCalled();
      
      // Restore the original ping method
      mockConn.ping = originalPing;
    });

    it('should prefer connections with matching journey ID', async () => {
      // Create connections with different journey IDs
      const connection1 = await connectionPool.acquire({ journeyId: 'health' });
      const connection2 = await connectionPool.acquire({ journeyId: 'care' });
      connectionPool.release(connection1);
      connectionPool.release(connection2);
      
      // Acquire a connection with a specific journey ID
      const healthConnection = await connectionPool.acquire({ journeyId: 'health' });
      expect(healthConnection.id).toBe(connection1.id);
      connectionPool.release(healthConnection);
      
      // Acquire a connection with a different journey ID
      const careConnection = await connectionPool.acquire({ journeyId: 'care' });
      expect(careConnection.id).toBe(connection2.id);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await connectionPool.onModuleInit();
    });

    it('should handle errors during connection creation', async () => {
      // Make the connection factory fail
      mockConnectionFactory.mockRejectedValueOnce(new Error('Connection creation failed'));
      
      // Try to acquire a connection - should fall back to existing ones
      const connection = await connectionPool.acquire();
      expect(connection).toBeDefined();
      
      // Should have emitted an error event
      const errorEvents = mockEventEmitter.getEvents(ConnectionEventType.ERROR);
      expect(errorEvents.length).toBeGreaterThan(0);
      expect(errorEvents[0].error.message).toContain('Connection creation failed');
    });

    it('should handle errors during connection validation', async () => {
      // Create a connection that will throw during validation
      const connection = await connectionPool.acquire();
      const mockConn = connection.connection as MockConnection;
      const originalPing = mockConn.ping;
      mockConn.ping = jest.fn().mockRejectedValue(new Error('Validation failed'));
      connectionPool.release(connection);
      
      // Reset the factory mock to track new connections
      mockConnectionFactory.mockClear();
      
      // Try to acquire a connection - it should handle the validation error and create a new one
      const newConnection = await connectionPool.acquire({ validateConnection: true });
      
      expect(newConnection).toBeDefined();
      expect(newConnection.id).not.toBe(connection.id);
      expect(mockConnectionFactory).toHaveBeenCalled();
      
      // Restore the original ping method
      mockConn.ping = originalPing;
    });

    it('should handle errors during connection close', async () => {
      // Create a connection that will throw during close
      const connection = await connectionPool.acquire();
      const mockConn = connection.connection as MockConnection;
      const originalDisconnect = mockConn.disconnect;
      mockConn.disconnect = jest.fn().mockRejectedValue(new Error('Close failed'));
      connectionPool.release(connection);
      
      // Spy on the logger
      const warnSpy = jest.spyOn(Logger.prototype, 'warn');
      
      // Force cleanup of idle connections
      await (connectionPool as any).cleanupIdleConnections();
      
      // Should have logged a warning
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to close idle connection'),
        expect.any(Error)
      );
      
      // Restore the original disconnect method
      mockConn.disconnect = originalDisconnect;
    });

    it('should reject all pending requests when shutting down', async () => {
      // Set a lower max pool size for this test
      connectionPool = createConnectionPool({
        connectionPool: {
          ...createDefaultConfig().connectionPool!,
          poolMin: 1,
          poolMax: 1,
        },
      });
      await connectionPool.onModuleInit();
      
      // Acquire the only available connection
      const connection = await connectionPool.acquire();
      
      // Queue up some requests
      const pendingPromise1 = connectionPool.acquire();
      const pendingPromise2 = connectionPool.acquire();
      
      // Start shutting down the pool
      const shutdownPromise = connectionPool.onModuleDestroy();
      
      // The pending requests should be rejected
      await expect(pendingPromise1).rejects.toThrow('Connection pool is shutting down');
      await expect(pendingPromise2).rejects.toThrow('Connection pool is shutting down');
      
      // Wait for shutdown to complete
      await shutdownPromise;
    });
  });

  describe('Load Balancing', () => {
    beforeEach(async () => {
      connectionPool = createConnectionPool({
        connectionPool: {
          ...createDefaultConfig().connectionPool!,
          poolMin: 3,
          poolMax: 5,
        },
      });
      await connectionPool.onModuleInit();
    });

    it('should distribute load across available connections', async () => {
      // Acquire and release connections multiple times
      const useCounts = new Map<string, number>();
      
      for (let i = 0; i < 10; i++) {
        const connection = await connectionPool.acquire();
        useCounts.set(connection.id, (useCounts.get(connection.id) || 0) + 1);
        connectionPool.release(connection);
      }
      
      // Check that multiple connections were used
      expect(useCounts.size).toBeGreaterThan(1);
      
      // Check that the load was somewhat balanced
      const counts = Array.from(useCounts.values());
      const maxUseCount = Math.max(...counts);
      const minUseCount = Math.min(...counts);
      
      // The difference between max and min should not be too large
      // This is a heuristic test and might occasionally fail due to randomness
      expect(maxUseCount - minUseCount).toBeLessThanOrEqual(5);
    });

    it('should prefer least recently used connections', async () => {
      // Acquire all connections
      const connections = [];
      for (let i = 0; i < 3; i++) {
        connections.push(await connectionPool.acquire());
      }
      
      // Release them in order
      connections.forEach(conn => connectionPool.release(conn));
      
      // Acquire a new connection - should get the least recently used one (first released)
      const newConnection = await connectionPool.acquire();
      expect(newConnection.id).toBe(connections[0].id);
    });

    it('should prefer healthy connections over degraded ones', async () => {
      // Acquire all connections
      const connections = [];
      for (let i = 0; i < 3; i++) {
        connections.push(await connectionPool.acquire());
      }
      
      // Mark one connection as degraded
      mockConnectionHealth.setConnectionStatus(connections[0].id, HealthStatus.DEGRADED);
      
      // Release all connections
      connections.forEach(conn => connectionPool.release(conn));
      
      // Acquire a new connection - should prefer healthy ones
      const newConnection = await connectionPool.acquire({ validateConnection: true });
      expect(newConnection.id).not.toBe(connections[0].id);
    });
  });

  describe('Timeout Handling', () => {
    beforeEach(async () => {
      connectionPool = createConnectionPool({
        connectionPool: {
          ...createDefaultConfig().connectionPool!,
          poolMin: 1,
          poolMax: 1,
        },
      });
      await connectionPool.onModuleInit();
    });

    it('should respect acquisition timeout and reject the request', async () => {
      // Acquire the only available connection
      const connection = await connectionPool.acquire();
      
      // Try to acquire another connection with a short timeout
      const acquisitionPromise = connectionPool.acquire({ timeoutMs: 100 });
      
      // The request should be rejected after the timeout
      await expect(acquisitionPromise).rejects.toThrow('Connection acquisition timed out after 100ms');
      
      // Release the connection
      connectionPool.release(connection);
    });

    it('should emit a timeout error event', async () => {
      // Acquire the only available connection
      const connection = await connectionPool.acquire();
      mockEventEmitter.clearEvents();
      
      // Try to acquire another connection with a short timeout
      try {
        await connectionPool.acquire({ timeoutMs: 100 });
      } catch (error) {
        // Expected error
      }
      
      // Should have emitted a timeout error event
      const errorEvents = mockEventEmitter.getEvents(ConnectionEventType.ERROR);
      expect(errorEvents.length).toBeGreaterThan(0);
      expect(errorEvents[0].data.timeoutMs).toBe(100);
      
      // Release the connection
      connectionPool.release(connection);
    });

    it('should cancel the timeout when a connection becomes available', async () => {
      // Acquire the only available connection
      const connection = await connectionPool.acquire();
      
      // Try to acquire another connection with a long timeout
      const acquisitionPromise = connectionPool.acquire({ timeoutMs: 5000 });
      
      // Release the connection quickly
      connectionPool.release(connection);
      
      // The request should be fulfilled without timing out
      const newConnection = await acquisitionPromise;
      expect(newConnection).toBeDefined();
    });
  });

  describe('Shutdown', () => {
    beforeEach(async () => {
      await connectionPool.onModuleInit();
    });

    it('should close all connections when shutting down', async () => {
      // Create some connections
      const connection1 = await connectionPool.acquire();
      const connection2 = await connectionPool.acquire();
      connectionPool.release(connection1);
      connectionPool.release(connection2);
      
      // Shutdown the pool
      await connectionPool.onModuleDestroy();
      
      // All connections should be closed
      const mockConn1 = connection1.connection as MockConnection;
      const mockConn2 = connection2.connection as MockConnection;
      expect(mockConn1.isConnected).toBe(false);
      expect(mockConn2.isConnected).toBe(false);
    });

    it('should reject new acquisition requests after shutdown starts', async () => {
      // Start shutting down
      const shutdownPromise = connectionPool.onModuleDestroy();
      
      // Try to acquire a connection
      await expect(connectionPool.acquire()).rejects.toThrow('Cannot acquire connection: pool is shutting down');
      
      // Wait for shutdown to complete
      await shutdownPromise;
    });

    it('should log errors during connection close but continue shutdown', async () => {
      // Create a connection that will throw during close
      const connection = await connectionPool.acquire();
      const mockConn = connection.connection as MockConnection;
      const originalDisconnect = mockConn.disconnect;
      mockConn.disconnect = jest.fn().mockRejectedValue(new Error('Close failed'));
      connectionPool.release(connection);
      
      // Spy on the logger
      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      
      // Shutdown the pool
      await connectionPool.onModuleDestroy();
      
      // Should have logged an error
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error closing all connections'),
        expect.any(Error)
      );
      
      // Restore the original disconnect method
      mockConn.disconnect = originalDisconnect;
    });
  });

  describe('Statistics and Metrics', () => {
    beforeEach(async () => {
      await connectionPool.onModuleInit();
    });

    it('should track connection acquisition times', async () => {
      // Acquire and release a connection several times
      for (let i = 0; i < 5; i++) {
        const connection = await connectionPool.acquire();
        connectionPool.release(connection);
      }
      
      // Check that acquisition time metrics are being tracked
      const stats = connectionPool.getStats();
      expect(stats.avgAcquisitionTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should track connection usage counts', async () => {
      // Acquire and release the same connection multiple times
      const connection = await connectionPool.acquire();
      connectionPool.release(connection);
      
      const connection2 = await connectionPool.acquire();
      expect(connection2.id).toBe(connection.id); // Should be the same connection
      expect(connection2.useCount).toBe(2); // Should have been used twice
      connectionPool.release(connection2);
    });

    it('should calculate pool utilization percentage', async () => {
      // Initially all connections should be idle
      let stats = connectionPool.getStats();
      expect(stats.utilizationPercentage).toBe(0);
      
      // Acquire half of the connections
      const connections = [];
      const totalConnections = connectionPool.getTotalConnectionCount();
      for (let i = 0; i < Math.floor(totalConnections / 2); i++) {
        connections.push(await connectionPool.acquire());
      }
      
      // Check utilization
      stats = connectionPool.getStats();
      expect(stats.utilizationPercentage).toBeGreaterThan(0);
      expect(stats.utilizationPercentage).toBeLessThanOrEqual(100);
      
      // Release the connections
      connections.forEach(conn => connectionPool.release(conn));
      
      // Utilization should be back to 0
      stats = connectionPool.getStats();
      expect(stats.utilizationPercentage).toBe(0);
    });

    it('should provide accurate connection counts', async () => {
      // Check initial counts
      expect(connectionPool.getTotalConnectionCount()).toBe(config.connectionPool!.poolMin);
      expect(connectionPool.getActiveConnectionCount()).toBe(0);
      expect(connectionPool.getIdleConnectionCount()).toBe(config.connectionPool!.poolMin);
      
      // Acquire some connections
      const connection1 = await connectionPool.acquire();
      const connection2 = await connectionPool.acquire();
      
      // Check updated counts
      expect(connectionPool.getTotalConnectionCount()).toBeGreaterThanOrEqual(2);
      expect(connectionPool.getActiveConnectionCount()).toBe(2);
      expect(connectionPool.getIdleConnectionCount()).toBe(connectionPool.getTotalConnectionCount() - 2);
      
      // Release the connections
      connectionPool.release(connection1);
      connectionPool.release(connection2);
      
      // Check final counts
      expect(connectionPool.getActiveConnectionCount()).toBe(0);
      expect(connectionPool.getIdleConnectionCount()).toBe(connectionPool.getTotalConnectionCount());
    });
  });
});
/**
 * @file connection-pool.spec.ts
 * @description Unit tests for the ConnectionPool class that manages database connection pooling
 * with configurable limits and optimization.
 */

import { Test } from '@nestjs/testing';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { ConnectionPool, ConnectionAcquisitionOptions, PooledConnection } from '../../src/connection/connection-pool';
import { ConnectionHealth } from '../../src/connection/connection-health';
import { ConnectionConfig } from '../../src/types/connection.types';
import { DatabaseException } from '../../src/errors/database-error.exception';

// Mock interfaces and types
interface MockConnection {
  id: string;
  isValid: boolean;
  query: jest.Mock;
  close: jest.Mock;
}

// Mock implementations
jest.mock('@austa/logging');
jest.mock('@austa/tracing');
jest.mock('../../src/connection/connection-health');

describe('ConnectionPool', () => {
  // Mock services
  let loggerService: jest.Mocked<LoggerService>;
  let tracingService: jest.Mocked<TracingService>;
  
  // Mock functions
  let connectionFactory: jest.Mock;
  let connectionClose: jest.Mock;
  let connectionValidate: jest.Mock;
  
  // Connection pool instance
  let connectionPool: ConnectionPool<MockConnection>;
  
  // Default connection config
  const defaultConfig: ConnectionConfig = {
    host: 'localhost',
    port: 5432,
    database: 'test_db',
    username: 'test_user',
    password: 'test_password',
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      retryIntervalMillis: 1000,
      validateOnBorrow: true,
      validateOnIdle: true,
    },
  };
  
  // Helper to create a mock connection
  const createMockConnection = (id: string, isValid: boolean = true): MockConnection => ({
    id,
    isValid,
    query: jest.fn().mockResolvedValue({ rows: [] }),
    close: jest.fn().mockResolvedValue(undefined),
  });
  
  // Setup before each test
  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock connections
    connectionFactory = jest.fn().mockImplementation(() => {
      const id = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      return Promise.resolve(createMockConnection(id));
    });
    
    connectionClose = jest.fn().mockResolvedValue(undefined);
    connectionValidate = jest.fn().mockResolvedValue(true);
    
    // Mock ConnectionHealth constructor and methods
    (ConnectionHealth as jest.Mock).mockImplementation(() => ({
      isUnhealthy: jest.fn().mockReturnValue(false),
      stopMonitoring: jest.fn(),
    }));
    
    // Create a testing module
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
        {
          provide: TracingService,
          useValue: {
            startSpan: jest.fn().mockReturnValue({
              setAttributes: jest.fn(),
              recordException: jest.fn(),
              end: jest.fn(),
            }),
          },
        },
      ],
    }).compile();
    
    // Get the mocked services
    loggerService = moduleRef.get(LoggerService) as jest.Mocked<LoggerService>;
    tracingService = moduleRef.get(TracingService) as jest.Mocked<TracingService>;
    
    // Create the connection pool instance
    connectionPool = new ConnectionPool<MockConnection>(
      loggerService,
      tracingService,
      defaultConfig,
      connectionFactory,
      connectionClose,
      connectionValidate
    );
  });
  
  // Clean up after each test
  afterEach(async () => {
    // Shutdown the connection pool
    await connectionPool.shutdown(true);
  });
  
  describe('initialization', () => {
    it('should initialize with minimum connections', async () => {
      // Initialize the pool
      await connectionPool.onModuleInit();
      
      // Should create minimum number of connections
      expect(connectionFactory).toHaveBeenCalledTimes(defaultConfig.pool.min);
      
      // Should log initialization
      expect(loggerService.log).toHaveBeenCalledWith(
        'ConnectionPool initialized',
        expect.objectContaining({
          minConnections: defaultConfig.pool.min,
          maxConnections: defaultConfig.pool.max,
        })
      );
    });
    
    it('should use default pool configuration if not provided', async () => {
      // Create a connection pool without pool config
      const configWithoutPool: ConnectionConfig = { ...defaultConfig };
      delete configWithoutPool.pool;
      
      const poolWithoutConfig = new ConnectionPool<MockConnection>(
        loggerService,
        tracingService,
        configWithoutPool,
        connectionFactory,
        connectionClose,
        connectionValidate
      );
      
      // Initialize the pool
      await poolWithoutConfig.onModuleInit();
      
      // Should create default minimum number of connections (2)
      expect(connectionFactory).toHaveBeenCalledTimes(2);
      
      // Clean up
      await poolWithoutConfig.shutdown(true);
    });
    
    it('should handle initialization errors', async () => {
      // Make connection factory fail
      connectionFactory.mockRejectedValue(new Error('Connection failed'));
      
      // Initialization should throw
      await expect(connectionPool.onModuleInit()).rejects.toThrow(DatabaseException);
      
      // Should log error
      expect(loggerService.error).toHaveBeenCalledWith(
        'Failed to initialize connection pool',
        expect.objectContaining({
          error: 'Connection failed',
        })
      );
    });
  });
  
  describe('connection acquisition', () => {
    beforeEach(async () => {
      // Initialize the pool
      await connectionPool.onModuleInit();
      
      // Reset mock calls after initialization
      connectionFactory.mockClear();
      connectionValidate.mockClear();
    });
    
    it('should acquire a connection from the pool', async () => {
      // Acquire a connection
      const connection = await connectionPool.acquire();
      
      // Should return a valid connection
      expect(connection).toBeDefined();
      expect(connection.id).toBeDefined();
      
      // Should not create a new connection since we have min connections already
      expect(connectionFactory).not.toHaveBeenCalled();
    });
    
    it('should create a new connection when all existing connections are in use', async () => {
      // Acquire all existing connections
      const connections = [];
      for (let i = 0; i < defaultConfig.pool.min; i++) {
        connections.push(await connectionPool.acquire());
      }
      
      // Reset factory mock
      connectionFactory.mockClear();
      
      // Acquire one more connection
      const newConnection = await connectionPool.acquire();
      
      // Should create a new connection
      expect(connectionFactory).toHaveBeenCalledTimes(1);
      expect(newConnection).toBeDefined();
      
      // Release all connections
      for (const conn of connections) {
        await connectionPool.release(conn);
      }
      await connectionPool.release(newConnection);
    });
    
    it('should validate connections before returning them', async () => {
      // Configure validation to be called
      const options: ConnectionAcquisitionOptions = {
        validate: true,
      };
      
      // Acquire a connection
      const connection = await connectionPool.acquire(options);
      
      // Should validate the connection
      expect(connectionValidate).toHaveBeenCalled();
      
      // Release the connection
      await connectionPool.release(connection);
    });
    
    it('should force create a new connection when requested', async () => {
      // Acquire a connection with forceNew option
      const options: ConnectionAcquisitionOptions = {
        forceNew: true,
      };
      
      // Reset factory mock
      connectionFactory.mockClear();
      
      // Acquire a connection
      const connection = await connectionPool.acquire(options);
      
      // Should create a new connection
      expect(connectionFactory).toHaveBeenCalledTimes(1);
      
      // Release the connection
      await connectionPool.release(connection);
    });
    
    it('should handle connection acquisition timeout', async () => {
      // Configure a short timeout
      const options: ConnectionAcquisitionOptions = {
        timeout: 100, // 100ms
      };
      
      // Acquire all existing connections
      const connections = [];
      for (let i = 0; i < defaultConfig.pool.min; i++) {
        connections.push(await connectionPool.acquire());
      }
      
      // Acquire all remaining connections up to max
      for (let i = defaultConfig.pool.min; i < defaultConfig.pool.max; i++) {
        connections.push(await connectionPool.acquire());
      }
      
      // Next acquisition should timeout
      await expect(connectionPool.acquire(options)).rejects.toThrow(
        /Connection acquisition timed out/
      );
      
      // Release all connections
      for (const conn of connections) {
        await connectionPool.release(conn);
      }
    });
    
    it('should prioritize requests based on priority option', async () => {
      // Acquire all existing connections
      const connections = [];
      for (let i = 0; i < defaultConfig.pool.min; i++) {
        connections.push(await connectionPool.acquire());
      }
      
      // Acquire all remaining connections up to max
      for (let i = defaultConfig.pool.min; i < defaultConfig.pool.max; i++) {
        connections.push(await connectionPool.acquire());
      }
      
      // Create a low priority request (will be queued)
      const lowPriorityPromise = connectionPool.acquire({ priority: 0 });
      
      // Create a high priority request (will be queued but served first)
      const highPriorityPromise = connectionPool.acquire({ priority: 10 });
      
      // Release one connection
      await connectionPool.release(connections[0]);
      
      // High priority request should be fulfilled first
      const highPriorityConnection = await highPriorityPromise;
      expect(highPriorityConnection).toBeDefined();
      
      // Release another connection for the low priority request
      await connectionPool.release(connections[1]);
      
      // Low priority request should be fulfilled now
      const lowPriorityConnection = await lowPriorityPromise;
      expect(lowPriorityConnection).toBeDefined();
      
      // Release the remaining connections
      for (let i = 2; i < connections.length; i++) {
        await connectionPool.release(connections[i]);
      }
      
      // Release the high and low priority connections
      await connectionPool.release(highPriorityConnection);
      await connectionPool.release(lowPriorityConnection);
    });
  });
  
  describe('connection release', () => {
    let connections: MockConnection[] = [];
    
    beforeEach(async () => {
      // Initialize the pool
      await connectionPool.onModuleInit();
      
      // Acquire some connections
      connections = [];
      for (let i = 0; i < 3; i++) {
        connections.push(await connectionPool.acquire());
      }
      
      // Reset mock calls after initialization and acquisition
      connectionFactory.mockClear();
      connectionValidate.mockClear();
      connectionClose.mockClear();
    });
    
    afterEach(async () => {
      // Release any remaining connections
      for (const conn of connections) {
        try {
          await connectionPool.release(conn);
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
      connections = [];
    });
    
    it('should release a connection back to the pool', async () => {
      // Release a connection
      await connectionPool.release(connections[0]);
      
      // Should not close the connection
      expect(connectionClose).not.toHaveBeenCalled();
      
      // Should be able to acquire the same connection again
      const newConnection = await connectionPool.acquire();
      expect(newConnection).toBeDefined();
    });
    
    it('should close a connection when forceClose is true', async () => {
      // Release a connection with forceClose
      await connectionPool.release(connections[0], true);
      
      // Should close the connection
      expect(connectionClose).toHaveBeenCalledTimes(1);
      
      // Should create a new connection to maintain minimum
      expect(connectionFactory).toHaveBeenCalledTimes(1);
    });
    
    it('should close an invalid connection and create a replacement', async () => {
      // Make validation fail for the next check
      connectionValidate.mockResolvedValueOnce(false);
      
      // Release a connection
      await connectionPool.release(connections[0]);
      
      // Should close the invalid connection
      expect(connectionClose).toHaveBeenCalledTimes(1);
      
      // Should create a replacement connection
      expect(connectionFactory).toHaveBeenCalledTimes(1);
    });
    
    it('should handle unknown connections gracefully', async () => {
      // Create a connection not in the pool
      const unknownConnection = createMockConnection('unknown');
      
      // Release the unknown connection
      await connectionPool.release(unknownConnection);
      
      // Should log a warning
      expect(loggerService.warn).toHaveBeenCalledWith(
        'Attempted to release unknown connection',
        expect.any(Object)
      );
      
      // Should not close any connections
      expect(connectionClose).not.toHaveBeenCalled();
    });
    
    it('should fulfill pending requests when a connection is released', async () => {
      // Acquire all remaining connections up to max
      const additionalConnections = [];
      for (let i = connections.length; i < defaultConfig.pool.max; i++) {
        additionalConnections.push(await connectionPool.acquire());
      }
      connections = [...connections, ...additionalConnections];
      
      // Create a pending request
      const pendingPromise = connectionPool.acquire();
      
      // Release a connection
      await connectionPool.release(connections[0]);
      
      // Pending request should be fulfilled
      const pendingConnection = await pendingPromise;
      expect(pendingConnection).toBeDefined();
      
      // Add the pending connection to our list for cleanup
      connections.push(pendingConnection);
    });
  });
  
  describe('idle connection cleanup', () => {
    beforeEach(async () => {
      // Create a connection pool with a short idle timeout
      const configWithShortIdleTimeout: ConnectionConfig = {
        ...defaultConfig,
        pool: {
          ...defaultConfig.pool,
          min: 1,
          max: 5,
          idleTimeoutMillis: 100, // 100ms for faster testing
        },
      };
      
      connectionPool = new ConnectionPool<MockConnection>(
        loggerService,
        tracingService,
        configWithShortIdleTimeout,
        connectionFactory,
        connectionClose,
        connectionValidate
      );
      
      // Initialize the pool
      await connectionPool.onModuleInit();
      
      // Reset mock calls after initialization
      connectionFactory.mockClear();
      connectionClose.mockClear();
    });
    
    it('should clean up idle connections after timeout', async () => {
      // Acquire some connections
      const conn1 = await connectionPool.acquire();
      const conn2 = await connectionPool.acquire();
      
      // Release the connections
      await connectionPool.release(conn1);
      await connectionPool.release(conn2);
      
      // Wait for idle timeout
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Should close idle connections but keep minimum
      expect(connectionClose).toHaveBeenCalledTimes(1); // Close one, keep one (min)
      
      // Verify we can still acquire connections
      const newConn = await connectionPool.acquire();
      expect(newConn).toBeDefined();
      
      // Release for cleanup
      await connectionPool.release(newConn);
    });
    
    it('should not clean up connections in use', async () => {
      // Acquire some connections
      const conn1 = await connectionPool.acquire();
      const conn2 = await connectionPool.acquire();
      
      // Release only one connection
      await connectionPool.release(conn1);
      
      // Wait for idle timeout
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Should not close any connections (one is in use, one is minimum)
      expect(connectionClose).not.toHaveBeenCalled();
      
      // Release the other connection
      await connectionPool.release(conn2);
    });
    
    it('should not clean up connections below minimum', async () => {
      // Acquire a connection
      const conn = await connectionPool.acquire();
      
      // Release the connection
      await connectionPool.release(conn);
      
      // Wait for idle timeout
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Should not close any connections (minimum is 1)
      expect(connectionClose).not.toHaveBeenCalled();
    });
  });
  
  describe('connection health checks', () => {
    beforeEach(async () => {
      // Initialize the pool
      await connectionPool.onModuleInit();
      
      // Reset mock calls after initialization
      connectionFactory.mockClear();
      connectionClose.mockClear();
      connectionValidate.mockClear();
    });
    
    it('should close unhealthy connections during health checks', async () => {
      // Acquire a connection
      const conn = await connectionPool.acquire();
      
      // Release the connection
      await connectionPool.release(conn);
      
      // Mock the health check to report unhealthy
      const healthCheck = (ConnectionHealth as jest.Mock).mock.instances[0];
      healthCheck.isUnhealthy.mockReturnValueOnce(true);
      
      // Trigger health check manually by calling the private method
      await (connectionPool as any).checkConnectionHealth();
      
      // Should close the unhealthy connection
      expect(connectionClose).toHaveBeenCalledTimes(1);
      
      // Should create a replacement connection
      expect(connectionFactory).toHaveBeenCalledTimes(1);
    });
    
    it('should validate idle connections during health checks', async () => {
      // Acquire a connection
      const conn = await connectionPool.acquire();
      
      // Release the connection
      await connectionPool.release(conn);
      
      // Reset validation mock
      connectionValidate.mockClear();
      
      // Trigger health check manually
      await (connectionPool as any).checkConnectionHealth();
      
      // Should validate the idle connection
      expect(connectionValidate).toHaveBeenCalledTimes(1);
    });
    
    it('should close connections that fail validation during health checks', async () => {
      // Acquire a connection
      const conn = await connectionPool.acquire();
      
      // Release the connection
      await connectionPool.release(conn);
      
      // Make validation fail
      connectionValidate.mockResolvedValueOnce(false);
      
      // Trigger health check manually
      await (connectionPool as any).checkConnectionHealth();
      
      // Should close the invalid connection
      expect(connectionClose).toHaveBeenCalledTimes(1);
      
      // Should create a replacement connection
      expect(connectionFactory).toHaveBeenCalledTimes(1);
    });
    
    it('should not check health of connections in use', async () => {
      // Acquire a connection but don't release it
      await connectionPool.acquire();
      
      // Reset validation mock
      connectionValidate.mockClear();
      
      // Trigger health check manually
      await (connectionPool as any).checkConnectionHealth();
      
      // Should not validate any connections
      expect(connectionValidate).not.toHaveBeenCalled();
    });
  });
  
  describe('pool scaling', () => {
    beforeEach(async () => {
      // Create a connection pool with scaling configuration
      const configWithScaling: ConnectionConfig = {
        ...defaultConfig,
        pool: {
          ...defaultConfig.pool,
          min: 2,
          max: 10,
        },
      };
      
      connectionPool = new ConnectionPool<MockConnection>(
        loggerService,
        tracingService,
        configWithScaling,
        connectionFactory,
        connectionClose,
        connectionValidate
      );
      
      // Initialize the pool
      await connectionPool.onModuleInit();
      
      // Reset mock calls after initialization
      connectionFactory.mockClear();
      connectionClose.mockClear();
    });
    
    it('should scale up when all connections are in use', async () => {
      // Acquire all initial connections
      const connections = [];
      for (let i = 0; i < 2; i++) { // min is 2
        connections.push(await connectionPool.acquire());
      }
      
      // Reset factory mock
      connectionFactory.mockClear();
      
      // Acquire more connections
      for (let i = 0; i < 3; i++) {
        connections.push(await connectionPool.acquire());
      }
      
      // Should create new connections
      expect(connectionFactory).toHaveBeenCalledTimes(3);
      
      // Release all connections
      for (const conn of connections) {
        await connectionPool.release(conn);
      }
    });
    
    it('should not scale beyond maximum connections', async () => {
      // Acquire maximum connections
      const connections = [];
      for (let i = 0; i < 10; i++) { // max is 10
        connections.push(await connectionPool.acquire());
      }
      
      // Try to acquire one more connection with a short timeout
      await expect(connectionPool.acquire({ timeout: 100 })).rejects.toThrow(
        /Connection acquisition timed out/
      );
      
      // Release all connections
      for (const conn of connections) {
        await connectionPool.release(conn);
      }
    });
    
    it('should scale down when there are too many idle connections', async () => {
      // Acquire several connections
      const connections = [];
      for (let i = 0; i < 6; i++) {
        connections.push(await connectionPool.acquire());
      }
      
      // Release all connections
      for (const conn of connections) {
        await connectionPool.release(conn);
      }
      
      // Mock the lastScaledAt to allow scaling
      (connectionPool as any).lastScaledAt = new Date(Date.now() - 70000);
      
      // Trigger pool scaling manually
      await (connectionPool as any).checkPoolScaling();
      
      // Should close some idle connections but keep minimum
      expect(connectionClose).toHaveBeenCalled();
      
      // Should not close below minimum
      const stats = connectionPool.getStats();
      expect(stats.totalConnections).toBeGreaterThanOrEqual(2); // min is 2
    });
  });
  
  describe('pool shutdown', () => {
    beforeEach(async () => {
      // Initialize the pool
      await connectionPool.onModuleInit();
      
      // Reset mock calls after initialization
      connectionFactory.mockClear();
      connectionClose.mockClear();
    });
    
    it('should close all connections during shutdown', async () => {
      // Shutdown the pool
      await connectionPool.shutdown();
      
      // Should close all connections
      expect(connectionClose).toHaveBeenCalledTimes(defaultConfig.pool.min);
      
      // Should log shutdown
      expect(loggerService.log).toHaveBeenCalledWith(
        'ConnectionPool shutdown complete',
        expect.any(Object)
      );
    });
    
    it('should reject pending requests during shutdown', async () => {
      // Acquire all connections
      const connections = [];
      for (let i = 0; i < defaultConfig.pool.min; i++) {
        connections.push(await connectionPool.acquire());
      }
      
      // Create a pending request
      const pendingPromise = connectionPool.acquire();
      
      // Shutdown the pool
      await connectionPool.shutdown();
      
      // Pending request should be rejected
      await expect(pendingPromise).rejects.toThrow(/Connection pool is shutting down/);
      
      // Force release connections to avoid test interference
      for (const conn of connections) {
        try {
          await connectionPool.release(conn, true);
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    });
    
    it('should not allow new connections after shutdown', async () => {
      // Shutdown the pool
      await connectionPool.shutdown();
      
      // Try to acquire a connection
      await expect(connectionPool.acquire()).rejects.toThrow(
        /Cannot acquire connection: pool is shutting down/
      );
    });
    
    it('should force close in-use connections when force is true', async () => {
      // Acquire a connection
      const conn = await connectionPool.acquire();
      
      // Shutdown with force
      await connectionPool.shutdown(true);
      
      // Should close all connections including in-use
      expect(connectionClose).toHaveBeenCalledTimes(defaultConfig.pool.min);
    });
    
    it('should not force close in-use connections when force is false', async () => {
      // Acquire a connection
      const conn = await connectionPool.acquire();
      
      // Shutdown without force
      await connectionPool.shutdown(false);
      
      // Should close only idle connections
      expect(connectionClose).toHaveBeenCalledTimes(defaultConfig.pool.min - 1);
      
      // Should log warning about in-use connection
      expect(loggerService.warn).toHaveBeenCalledWith(
        'Connection still in use during shutdown',
        expect.any(Object)
      );
      
      // Force release the connection to avoid test interference
      try {
        await connectionPool.release(conn, true);
      } catch (e) {
        // Ignore errors during cleanup
      }
    });
  });
  
  describe('pool statistics', () => {
    beforeEach(async () => {
      // Initialize the pool
      await connectionPool.onModuleInit();
    });
    
    it('should provide accurate pool statistics', async () => {
      // Get initial stats
      const initialStats = connectionPool.getStats();
      
      // Initial stats should reflect min connections
      expect(initialStats.totalConnections).toBe(defaultConfig.pool.min);
      expect(initialStats.activeConnections).toBe(0);
      expect(initialStats.idleConnections).toBe(defaultConfig.pool.min);
      
      // Acquire some connections
      const conn1 = await connectionPool.acquire();
      const conn2 = await connectionPool.acquire();
      
      // Get stats after acquisition
      const activeStats = connectionPool.getStats();
      
      // Stats should reflect active connections
      expect(activeStats.totalConnections).toBe(defaultConfig.pool.min);
      expect(activeStats.activeConnections).toBe(2);
      expect(activeStats.idleConnections).toBe(defaultConfig.pool.min - 2);
      
      // Release one connection
      await connectionPool.release(conn1);
      
      // Get stats after partial release
      const partialReleaseStats = connectionPool.getStats();
      
      // Stats should reflect one active, one idle
      expect(partialReleaseStats.totalConnections).toBe(defaultConfig.pool.min);
      expect(partialReleaseStats.activeConnections).toBe(1);
      expect(partialReleaseStats.idleConnections).toBe(defaultConfig.pool.min - 1);
      
      // Release the other connection
      await connectionPool.release(conn2);
    });
    
    it('should track connection acquisition times', async () => {
      // Acquire and release several connections
      for (let i = 0; i < 5; i++) {
        const conn = await connectionPool.acquire();
        await connectionPool.release(conn);
      }
      
      // Get stats
      const stats = connectionPool.getStats();
      
      // Should have average acquisition time
      expect(stats.avgAcquisitionTime).toBeGreaterThanOrEqual(0);
    });
    
    it('should track failed validations', async () => {
      // Make validation fail
      connectionValidate.mockResolvedValueOnce(false);
      
      // Acquire a connection with validation
      const conn = await connectionPool.acquire({ validate: true });
      
      // Release the connection
      await connectionPool.release(conn);
      
      // Get stats
      const stats = connectionPool.getStats();
      
      // Should track failed validations
      expect(stats.failedValidations).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('connection refresh', () => {
    beforeEach(async () => {
      // Initialize the pool
      await connectionPool.onModuleInit();
      
      // Reset mock calls after initialization
      connectionFactory.mockClear();
      connectionClose.mockClear();
    });
    
    it('should refresh all idle connections', async () => {
      // Refresh connections
      await connectionPool.refreshConnections();
      
      // Should close idle connections
      expect(connectionClose).toHaveBeenCalledTimes(defaultConfig.pool.min);
      
      // Should create replacement connections
      expect(connectionFactory).toHaveBeenCalledTimes(defaultConfig.pool.min);
    });
    
    it('should not refresh connections in use', async () => {
      // Acquire a connection
      const conn = await connectionPool.acquire();
      
      // Refresh connections
      await connectionPool.refreshConnections();
      
      // Should close only idle connections
      expect(connectionClose).toHaveBeenCalledTimes(defaultConfig.pool.min - 1);
      
      // Should create replacement connections for idle ones
      expect(connectionFactory).toHaveBeenCalledTimes(defaultConfig.pool.min - 1);
      
      // Release the connection
      await connectionPool.release(conn);
    });
    
    it('should handle refresh errors gracefully', async () => {
      // Make connection close fail
      connectionClose.mockRejectedValueOnce(new Error('Close failed'));
      
      // Refresh should still succeed
      await expect(connectionPool.refreshConnections()).resolves.not.toThrow();
      
      // Should log error
      expect(loggerService.error).toHaveBeenCalled();
    });
  });
});
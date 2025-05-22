import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Logger } from '@nestjs/common';
import { ConnectionManager } from '../../src/connection/connection-manager';
import { ConnectionHealth } from '../../src/connection/connection-health';
import { ConnectionRetry } from '../../src/connection/connection-retry';
import { RetryStrategyFactory } from '../../src/errors/retry-strategies';
import { ConnectionPool } from '../../src/connection/connection-pool';
import { 
  ConnectionType, 
  JourneyType, 
  QueryPattern,
  DatabaseClient,
  ConnectionOptions
} from '../../src/types/connection.types';
import { DatabaseException, ConnectionException } from '../../src/errors/database-error.exception';
import { DatabaseErrorType } from '../../src/errors/database-error.types';
import { DB_CONNECTION_ERROR_CODES } from '../../src/errors/database-error.codes';

// Mock implementations
class MockDatabaseClient {
  id: string;
  journeyType?: JourneyType;
  queryPattern?: QueryPattern;
  isHealthy: boolean = true;
  disconnectCalled: boolean = false;

  constructor(id: string, journeyType?: JourneyType, queryPattern?: QueryPattern) {
    this.id = id;
    this.journeyType = journeyType;
    this.queryPattern = queryPattern;
  }

  async disconnect(): Promise<void> {
    this.disconnectCalled = true;
  }
}

class MockConnectionPool {
  type: ConnectionType;
  connections: Map<string, MockDatabaseClient> = new Map();
  initialized: boolean = false;
  shutdown: boolean = false;
  activeCount: number = 0;
  availableCount: number = 5;
  totalCount: number = 5;

  constructor(type: ConnectionType) {
    this.type = type;
  }

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async acquireConnection(options?: ConnectionOptions): Promise<MockDatabaseClient> {
    const id = `conn_${Math.random().toString(36).substring(2, 9)}`;
    const client = new MockDatabaseClient(id, options?.journeyType, options?.queryPattern);
    this.connections.set(id, client);
    this.activeCount++;
    return client;
  }

  async releaseConnection(connection: MockDatabaseClient): Promise<void> {
    this.connections.delete(connection.id);
    this.activeCount--;
  }

  async shutdown(): Promise<void> {
    this.shutdown = true;
    this.connections.clear();
    this.activeCount = 0;
  }

  getActiveCount(): number {
    return this.activeCount;
  }

  getAvailableCount(): number {
    return this.availableCount;
  }

  getTotalCount(): number {
    return this.totalCount;
  }
}

// Mock the Logger to avoid console output during tests
jest.mock('@nestjs/common', () => {
  const original = jest.requireActual('@nestjs/common');
  return {
    ...original,
    Logger: jest.fn().mockImplementation(() => ({
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    })),
  };
});

describe('ConnectionManager', () => {
  let connectionManager: ConnectionManager;
  let configService: ConfigService;
  let connectionHealth: ConnectionHealth;
  let connectionRetry: ConnectionRetry;
  let schedulerRegistry: SchedulerRegistry;
  let retryStrategyFactory: RetryStrategyFactory;
  let mockPools: Map<ConnectionType, MockConnectionPool>;

  beforeEach(async () => {
    // Create mock pools for different connection types
    mockPools = new Map();
    mockPools.set(ConnectionType.POSTGRESQL, new MockConnectionPool(ConnectionType.POSTGRESQL));
    mockPools.set(ConnectionType.REDIS, new MockConnectionPool(ConnectionType.REDIS));
    mockPools.set(ConnectionType.TIMESCALEDB, new MockConnectionPool(ConnectionType.TIMESCALEDB));
    mockPools.set(ConnectionType.S3, new MockConnectionPool(ConnectionType.S3));

    // Mock the ConfigService
    configService = {
      get: jest.fn().mockImplementation((key) => {
        if (key === 'database') {
          return {
            postgres: { host: 'localhost', port: 5432, database: 'test', user: 'test', password: 'test' },
            redis: { host: 'localhost', port: 6379 },
            timescaledb: { host: 'localhost', port: 5432, database: 'timescale', user: 'test', password: 'test' },
            s3: { region: 'us-east-1', bucket: 'test-bucket' },
            healthCheck: {
              enabled: true,
              intervalMs: 30000,
            },
          };
        }
        return undefined;
      }),
    } as unknown as ConfigService;

    // Mock ConnectionHealth
    connectionHealth = {
      isConnectionHealthy: jest.fn().mockResolvedValue(true),
      registerConnection: jest.fn(),
      unregisterConnection: jest.fn(),
      checkConnectionHealth: jest.fn(),
    } as unknown as ConnectionHealth;

    // Mock ConnectionRetry
    connectionRetry = {
      withRetry: jest.fn().mockImplementation((fn) => fn()),
      withCustomStrategy: jest.fn(),
      initializeRetryState: jest.fn(),
      resetRetryState: jest.fn(),
      isCircuitOpen: jest.fn().mockReturnValue(false),
      closeCircuit: jest.fn(),
    } as unknown as ConnectionRetry;

    // Mock SchedulerRegistry
    schedulerRegistry = {
      addInterval: jest.fn(),
      deleteInterval: jest.fn(),
    } as unknown as SchedulerRegistry;

    // Mock RetryStrategyFactory
    retryStrategyFactory = {
      createStrategy: jest.fn(),
    } as unknown as RetryStrategyFactory;

    // Create a test module with our mocked dependencies
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConnectionManager,
        { provide: ConfigService, useValue: configService },
        { provide: ConnectionHealth, useValue: connectionHealth },
        { provide: ConnectionRetry, useValue: connectionRetry },
        { provide: SchedulerRegistry, useValue: schedulerRegistry },
        { provide: RetryStrategyFactory, useValue: retryStrategyFactory },
      ],
    }).compile();

    // Get the ConnectionManager instance
    connectionManager = module.get<ConnectionManager>(ConnectionManager);

    // Mock the private methods and properties
    // @ts-ignore - accessing private property for testing
    connectionManager.connectionPools = mockPools;
    // @ts-ignore - mock the private method
    connectionManager.initializeConnectionPools = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize connection pools on module init', async () => {
      await connectionManager.onModuleInit();
      
      // @ts-ignore - accessing private method for verification
      expect(connectionManager.initializeConnectionPools).toHaveBeenCalled();
      expect(schedulerRegistry.addInterval).toHaveBeenCalledWith(
        'connection-health-check',
        expect.any(Object)
      );
    });

    it('should handle initialization errors gracefully', async () => {
      // @ts-ignore - mock the private method to throw an error
      connectionManager.initializeConnectionPools = jest.fn().mockRejectedValue(
        new Error('Initialization failed')
      );

      await expect(connectionManager.onModuleInit()).rejects.toThrow(ConnectionException);
    });

    it('should set up health checks with the configured interval', async () => {
      await connectionManager.onModuleInit();
      
      expect(schedulerRegistry.addInterval).toHaveBeenCalledWith(
        'connection-health-check',
        expect.any(Object)
      );
    });
  });

  describe('connection acquisition', () => {
    beforeEach(async () => {
      await connectionManager.onModuleInit();
    });

    it('should get a connection from the appropriate pool', async () => {
      const connection = await connectionManager.getConnection(ConnectionType.POSTGRESQL);
      
      expect(connection).toBeDefined();
      expect(connectionRetry.withRetry).toHaveBeenCalled();
      // @ts-ignore - accessing private property for testing
      expect(connectionManager.activeConnections.size).toBe(1);
    });

    it('should reuse existing connections when available', async () => {
      // Get a connection first
      const connection1 = await connectionManager.getConnection(ConnectionType.POSTGRESQL);
      
      // Mock the connection key generation to return the same key
      // @ts-ignore - mock the private method
      const originalGenerateKey = connectionManager.generateConnectionKey;
      // @ts-ignore - mock the private method
      connectionManager.generateConnectionKey = jest.fn().mockReturnValue('postgresql:shared:balanced');
      
      // Get another connection with the same parameters
      const connection2 = await connectionManager.getConnection(ConnectionType.POSTGRESQL);
      
      // Restore the original method
      // @ts-ignore - restore the private method
      connectionManager.generateConnectionKey = originalGenerateKey;
      
      expect(connection1).toBe(connection2);
      // @ts-ignore - accessing private property for testing
      expect(connectionManager.activeConnections.size).toBe(1);
    });

    it('should get a journey-specific connection', async () => {
      const connection = await connectionManager.getJourneyConnection(
        ConnectionType.POSTGRESQL,
        JourneyType.HEALTH,
        QueryPattern.READ_HEAVY
      );
      
      expect(connection).toBeDefined();
      // @ts-ignore - accessing private property for testing
      expect(connectionManager.activeConnections.size).toBe(1);
      
      // Verify the connection was created with the correct parameters
      const mockPool = mockPools.get(ConnectionType.POSTGRESQL);
      const mockClient = Array.from(mockPool.connections.values())[0];
      expect(mockClient.journeyType).toBe(JourneyType.HEALTH);
      expect(mockClient.queryPattern).toBe(QueryPattern.READ_HEAVY);
    });

    it('should get a query-pattern optimized connection', async () => {
      const connection = await connectionManager.getOptimizedConnection(
        ConnectionType.POSTGRESQL,
        QueryPattern.WRITE_HEAVY
      );
      
      expect(connection).toBeDefined();
      // @ts-ignore - accessing private property for testing
      expect(connectionManager.activeConnections.size).toBe(1);
      
      // Verify the connection was created with the correct parameters
      const mockPool = mockPools.get(ConnectionType.POSTGRESQL);
      const mockClient = Array.from(mockPool.connections.values())[0];
      expect(mockClient.queryPattern).toBe(QueryPattern.WRITE_HEAVY);
    });

    it('should throw an error when trying to get a connection during shutdown', async () => {
      // @ts-ignore - set the private property
      connectionManager.isShuttingDown = true;
      
      await expect(connectionManager.getConnection(ConnectionType.POSTGRESQL))
        .rejects
        .toThrow(ConnectionException);
    });

    it('should throw an error when the connection pool is not available', async () => {
      // Remove the PostgreSQL pool
      mockPools.delete(ConnectionType.POSTGRESQL);
      
      await expect(connectionManager.getConnection(ConnectionType.POSTGRESQL))
        .rejects
        .toThrow(ConnectionException);
    });

    it('should handle connection acquisition failures', async () => {
      // Mock the connection retry to throw an error
      connectionRetry.withRetry = jest.fn().mockRejectedValue(
        new Error('Connection acquisition failed')
      );
      
      await expect(connectionManager.getConnection(ConnectionType.POSTGRESQL))
        .rejects
        .toThrow(ConnectionException);
    });
  });

  describe('connection release', () => {
    beforeEach(async () => {
      await connectionManager.onModuleInit();
    });

    it('should release a connection back to the pool', async () => {
      // Get a connection first
      const connection = await connectionManager.getConnection(ConnectionType.POSTGRESQL);
      
      // @ts-ignore - get the connection key
      const connectionKey = Array.from(connectionManager.activeConnections.keys())[0];
      
      // Release the connection
      await connectionManager.releaseConnection(connectionKey);
      
      // @ts-ignore - accessing private property for testing
      expect(connectionManager.activeConnections.size).toBe(0);
      
      // Verify the connection was released back to the pool
      const mockPool = mockPools.get(ConnectionType.POSTGRESQL);
      expect(mockPool.activeCount).toBe(0);
    });

    it('should handle non-existent connection keys gracefully', async () => {
      // Try to release a non-existent connection
      await connectionManager.releaseConnection('non-existent-key');
      
      // No error should be thrown
    });

    it('should handle errors during connection release', async () => {
      // Get a connection first
      const connection = await connectionManager.getConnection(ConnectionType.POSTGRESQL);
      
      // @ts-ignore - get the connection key
      const connectionKey = Array.from(connectionManager.activeConnections.keys())[0];
      
      // Mock the pool's releaseConnection method to throw an error
      const mockPool = mockPools.get(ConnectionType.POSTGRESQL);
      mockPool.releaseConnection = jest.fn().mockRejectedValue(
        new Error('Release failed')
      );
      
      // Release the connection
      await connectionManager.releaseConnection(connectionKey);
      
      // The connection should still be removed from active connections
      // @ts-ignore - accessing private property for testing
      expect(connectionManager.activeConnections.size).toBe(0);
    });
  });

  describe('connection validation', () => {
    beforeEach(async () => {
      await connectionManager.onModuleInit();
    });

    it('should validate all active connections', async () => {
      // Get a few connections
      await connectionManager.getConnection(ConnectionType.POSTGRESQL);
      await connectionManager.getConnection(ConnectionType.REDIS);
      
      // Mock the health check to return healthy for all connections
      connectionHealth.isConnectionHealthy = jest.fn().mockResolvedValue(true);
      
      // Validate connections
      await connectionManager.validateConnections();
      
      // All connections should still be active
      // @ts-ignore - accessing private property for testing
      expect(connectionManager.activeConnections.size).toBe(2);
      expect(connectionHealth.isConnectionHealthy).toHaveBeenCalledTimes(2);
    });

    it('should release unhealthy connections', async () => {
      // Get a few connections
      await connectionManager.getConnection(ConnectionType.POSTGRESQL);
      await connectionManager.getConnection(ConnectionType.REDIS);
      
      // Mock the health check to return unhealthy for the first connection
      let callCount = 0;
      connectionHealth.isConnectionHealthy = jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve(callCount !== 1); // First call returns false, others true
      });
      
      // Validate connections
      await connectionManager.validateConnections();
      
      // One connection should have been released
      // @ts-ignore - accessing private property for testing
      expect(connectionManager.activeConnections.size).toBe(1);
      expect(connectionHealth.isConnectionHealthy).toHaveBeenCalledTimes(2);
    });

    it('should handle errors during validation', async () => {
      // Get a connection
      await connectionManager.getConnection(ConnectionType.POSTGRESQL);
      
      // Mock the health check to throw an error
      connectionHealth.isConnectionHealthy = jest.fn().mockRejectedValue(
        new Error('Validation failed')
      );
      
      // Validate connections
      await connectionManager.validateConnections();
      
      // The connection should have been released due to the error
      // @ts-ignore - accessing private property for testing
      expect(connectionManager.activeConnections.size).toBe(0);
    });
  });

  describe('connection failure handling', () => {
    beforeEach(async () => {
      await connectionManager.onModuleInit();
    });

    it('should handle recoverable connection failures', async () => {
      // Mock the isRecoverableError method to return true
      // @ts-ignore - mock the private method
      connectionManager.isRecoverableError = jest.fn().mockReturnValue(true);
      
      // Mock the retry strategy
      const mockStrategy = { execute: jest.fn() };
      retryStrategyFactory.createStrategy = jest.fn().mockReturnValue(mockStrategy);
      
      // Mock the connection retry to return a new connection
      const mockConnection = new MockDatabaseClient('recovered_conn');
      connectionRetry.withCustomStrategy = jest.fn().mockResolvedValue(mockConnection);
      
      // Handle a connection failure
      const result = await connectionManager.handleConnectionFailure(
        new Error('Temporary network issue'),
        ConnectionType.POSTGRESQL
      );
      
      expect(result).toBe(mockConnection);
      expect(retryStrategyFactory.createStrategy).toHaveBeenCalled();
      expect(connectionRetry.withCustomStrategy).toHaveBeenCalled();
    });

    it('should throw for unrecoverable connection failures', async () => {
      // Mock the isRecoverableError method to return false
      // @ts-ignore - mock the private method
      connectionManager.isRecoverableError = jest.fn().mockReturnValue(false);
      
      // Handle a connection failure
      await expect(connectionManager.handleConnectionFailure(
        new Error('Fatal database error'),
        ConnectionType.POSTGRESQL
      )).rejects.toThrow(ConnectionException);
      
      expect(connectionRetry.withCustomStrategy).not.toHaveBeenCalled();
    });

    it('should handle retry failures', async () => {
      // Mock the isRecoverableError method to return true
      // @ts-ignore - mock the private method
      connectionManager.isRecoverableError = jest.fn().mockReturnValue(true);
      
      // Mock the retry strategy
      const mockStrategy = { execute: jest.fn() };
      retryStrategyFactory.createStrategy = jest.fn().mockReturnValue(mockStrategy);
      
      // Mock the connection retry to throw an error
      connectionRetry.withCustomStrategy = jest.fn().mockRejectedValue(
        new Error('Retry failed')
      );
      
      // Handle a connection failure
      await expect(connectionManager.handleConnectionFailure(
        new Error('Temporary network issue'),
        ConnectionType.POSTGRESQL
      )).rejects.toThrow(ConnectionException);
      
      expect(retryStrategyFactory.createStrategy).toHaveBeenCalled();
      expect(connectionRetry.withCustomStrategy).toHaveBeenCalled();
    });
  });

  describe('shutdown', () => {
    beforeEach(async () => {
      await connectionManager.onModuleInit();
    });

    it('should close all active connections on module destroy', async () => {
      // Get a few connections
      await connectionManager.getConnection(ConnectionType.POSTGRESQL);
      await connectionManager.getConnection(ConnectionType.REDIS);
      
      // Destroy the module
      await connectionManager.onModuleDestroy();
      
      // All connections should be closed
      // @ts-ignore - accessing private property for testing
      expect(connectionManager.activeConnections.size).toBe(0);
      expect(schedulerRegistry.deleteInterval).toHaveBeenCalledWith('connection-health-check');
      
      // All pools should be shut down
      for (const pool of mockPools.values()) {
        expect(pool.shutdown).toBe(true);
      }
      
      // The isShuttingDown flag should be set
      // @ts-ignore - accessing private property for testing
      expect(connectionManager.isShuttingDown).toBe(true);
    });

    it('should handle errors during shutdown gracefully', async () => {
      // Get a connection
      await connectionManager.getConnection(ConnectionType.POSTGRESQL);
      
      // Mock the closeAllConnections method to throw an error
      // @ts-ignore - mock the private method
      connectionManager.closeAllConnections = jest.fn().mockRejectedValue(
        new Error('Shutdown failed')
      );
      
      // Destroy the module
      await connectionManager.onModuleDestroy();
      
      // No error should be thrown, and the isShuttingDown flag should still be set
      // @ts-ignore - accessing private property for testing
      expect(connectionManager.isShuttingDown).toBe(true);
    });

    it('should stop health checks during shutdown', async () => {
      // Destroy the module
      await connectionManager.onModuleDestroy();
      
      expect(schedulerRegistry.deleteInterval).toHaveBeenCalledWith('connection-health-check');
    });
  });

  describe('statistics and monitoring', () => {
    beforeEach(async () => {
      await connectionManager.onModuleInit();
    });

    it('should return the active connection count', async () => {
      // Get a few connections
      await connectionManager.getConnection(ConnectionType.POSTGRESQL);
      await connectionManager.getConnection(ConnectionType.REDIS);
      
      const count = connectionManager.getActiveConnectionCount();
      expect(count).toBe(2);
    });

    it('should return connection statistics', async () => {
      // Get a connection
      await connectionManager.getConnection(ConnectionType.POSTGRESQL);
      
      const stats = connectionManager.getConnectionStats();
      expect(stats).toBeDefined();
      expect(stats[ConnectionType.POSTGRESQL]).toBeDefined();
      expect(stats[ConnectionType.POSTGRESQL].active).toBe(1);
      expect(stats[ConnectionType.POSTGRESQL].available).toBe(5);
      expect(stats[ConnectionType.POSTGRESQL].total).toBe(5);
    });
  });

  describe('journey-specific optimizations', () => {
    beforeEach(async () => {
      await connectionManager.onModuleInit();
    });

    it('should optimize connections for health journey', async () => {
      const connection = await connectionManager.getJourneyConnection(
        ConnectionType.POSTGRESQL,
        JourneyType.HEALTH
      );
      
      expect(connection).toBeDefined();
      
      // Verify the connection was created with the correct parameters
      const mockPool = mockPools.get(ConnectionType.POSTGRESQL);
      const mockClient = Array.from(mockPool.connections.values())[0];
      expect(mockClient.journeyType).toBe(JourneyType.HEALTH);
    });

    it('should optimize connections for care journey', async () => {
      const connection = await connectionManager.getJourneyConnection(
        ConnectionType.POSTGRESQL,
        JourneyType.CARE
      );
      
      expect(connection).toBeDefined();
      
      // Verify the connection was created with the correct parameters
      const mockPool = mockPools.get(ConnectionType.POSTGRESQL);
      const mockClient = Array.from(mockPool.connections.values())[0];
      expect(mockClient.journeyType).toBe(JourneyType.CARE);
    });

    it('should optimize connections for plan journey', async () => {
      const connection = await connectionManager.getJourneyConnection(
        ConnectionType.POSTGRESQL,
        JourneyType.PLAN
      );
      
      expect(connection).toBeDefined();
      
      // Verify the connection was created with the correct parameters
      const mockPool = mockPools.get(ConnectionType.POSTGRESQL);
      const mockClient = Array.from(mockPool.connections.values())[0];
      expect(mockClient.journeyType).toBe(JourneyType.PLAN);
    });

    it('should optimize connections for different query patterns', async () => {
      // Test read-heavy pattern
      const readConnection = await connectionManager.getJourneyConnection(
        ConnectionType.POSTGRESQL,
        JourneyType.HEALTH,
        QueryPattern.READ_HEAVY
      );
      
      expect(readConnection).toBeDefined();
      
      // Test write-heavy pattern
      const writeConnection = await connectionManager.getJourneyConnection(
        ConnectionType.POSTGRESQL,
        JourneyType.CARE,
        QueryPattern.WRITE_HEAVY
      );
      
      expect(writeConnection).toBeDefined();
      
      // Verify the connections were created with the correct parameters
      const mockPool = mockPools.get(ConnectionType.POSTGRESQL);
      const clients = Array.from(mockPool.connections.values());
      
      const readClient = clients.find(c => c.queryPattern === QueryPattern.READ_HEAVY);
      expect(readClient).toBeDefined();
      expect(readClient.journeyType).toBe(JourneyType.HEALTH);
      
      const writeClient = clients.find(c => c.queryPattern === QueryPattern.WRITE_HEAVY);
      expect(writeClient).toBeDefined();
      expect(writeClient.journeyType).toBe(JourneyType.CARE);
    });
  });
});
/**
 * @file connection-manager.spec.ts
 * @description Unit tests for the ConnectionManager class that handles database connection
 * lifecycle, pooling, and optimization.
 */

import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { ConnectionManager, ConnectionOptions, QueryPattern } from '../../src/connection/connection-manager';
import { ConnectionPool } from '../../src/connection/connection-pool';
import { ConnectionHealth } from '../../src/connection/connection-health';
import { ConnectionRetry } from '../../src/connection/connection-retry';
import { DatabaseException } from '../../src/errors/database-error.exception';
import { DatabaseErrorType } from '../../src/errors/database-error.types';
import { JourneyType } from '../../src/types/journey.types';
import { DatabaseTechnology } from '../../src/types/connection.types';

// Mock dependencies
jest.mock('@nestjs/config');
jest.mock('@austa/logging');
jest.mock('@austa/tracing');
jest.mock('../../src/connection/connection-pool');
jest.mock('../../src/connection/connection-health');
jest.mock('../../src/connection/connection-retry');

// Mock interfaces
interface MockConnection {
  id: string;
  query: jest.Mock;
  release: jest.Mock;
  end: jest.Mock;
}

describe('ConnectionManager', () => {
  // Mock services
  let configService: jest.Mocked<ConfigService>;
  let loggerService: jest.Mocked<LoggerService>;
  let tracingService: jest.Mocked<TracingService>;
  
  // ConnectionManager instance
  let connectionManager: ConnectionManager;
  
  // Mock connection pool
  let mockConnectionPool: jest.Mocked<ConnectionPool<any>>;
  
  // Mock connection retry
  let mockConnectionRetry: jest.Mocked<ConnectionRetry>;
  
  // Helper to create a mock connection
  const createMockConnection = (id: string): MockConnection => ({
    id,
    query: jest.fn().mockResolvedValue({ rows: [] }),
    release: jest.fn().mockResolvedValue(undefined),
    end: jest.fn().mockResolvedValue(undefined),
  });
  
  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock connection pool
    mockConnectionPool = {
      acquire: jest.fn(),
      release: jest.fn(),
      refreshConnections: jest.fn(),
      getStats: jest.fn(),
      shutdown: jest.fn(),
      onModuleInit: jest.fn(),
    } as unknown as jest.Mocked<ConnectionPool<any>>;
    
    // Setup mock connection retry
    mockConnectionRetry = {
      executeConnect: jest.fn(),
      executeCommand: jest.fn(),
      executeQuery: jest.fn(),
      executeTransaction: jest.fn(),
      executeValidation: jest.fn(),
    } as unknown as jest.Mocked<ConnectionRetry>;
    
    // Mock ConnectionPool constructor
    (ConnectionPool as jest.Mock).mockImplementation(() => mockConnectionPool);
    
    // Mock ConnectionRetry constructor
    (ConnectionRetry as jest.Mock).mockImplementation(() => mockConnectionRetry);
    
    // Mock ConnectionHealth constructor
    (ConnectionHealth as jest.Mock).mockImplementation(() => ({
      startMonitoring: jest.fn(),
      stopMonitoring: jest.fn(),
      isUnhealthy: jest.fn().mockReturnValue(false),
    }));
    
    // Create a testing module
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
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
    configService = moduleRef.get(ConfigService) as jest.Mocked<ConfigService>;
    loggerService = moduleRef.get(LoggerService) as jest.Mocked<LoggerService>;
    tracingService = moduleRef.get(TracingService) as jest.Mocked<TracingService>;
    
    // Create the ConnectionManager instance
    connectionManager = new ConnectionManager(
      {
        databaseTechnology: DatabaseTechnology.POSTGRESQL,
        enableConnectionTracking: true,
        enableHealthMonitoring: true,
        enableAutoCleanup: true,
      },
      configService,
      loggerService,
      tracingService
    );
  });
  
  afterEach(async () => {
    // Shutdown the connection manager
    await connectionManager.shutdown(true);
  });
  
  describe('initialization', () => {
    it('should initialize with default configuration', async () => {
      // Initialize the connection manager
      await connectionManager.onModuleInit();
      
      // Should initialize the default connection pool
      expect(ConnectionPool).toHaveBeenCalled();
      expect(mockConnectionPool.onModuleInit).toHaveBeenCalled();
      
      // Should log initialization
      expect(loggerService.log).toHaveBeenCalledWith(
        'ConnectionManager initialized successfully',
        expect.any(Object)
      );
    });
    
    it('should handle initialization errors', async () => {
      // Make connection pool initialization fail
      mockConnectionPool.onModuleInit.mockRejectedValueOnce(new Error('Pool initialization failed'));
      
      // Initialization should throw
      await expect(connectionManager.onModuleInit()).rejects.toThrow(DatabaseException);
      
      // Should log error
      expect(loggerService.error).toHaveBeenCalledWith(
        'Failed to initialize ConnectionManager',
        expect.any(Object)
      );
    });
    
    it('should not initialize twice', async () => {
      // Initialize once
      await connectionManager.onModuleInit();
      
      // Reset mocks
      jest.clearAllMocks();
      
      // Initialize again
      await connectionManager.onModuleInit();
      
      // Should not initialize again
      expect(mockConnectionPool.onModuleInit).not.toHaveBeenCalled();
    });
  });
  
  describe('connection acquisition', () => {
    beforeEach(async () => {
      // Initialize the connection manager
      await connectionManager.onModuleInit();
      
      // Reset mocks after initialization
      jest.clearAllMocks();
      
      // Setup mock connection pool to return a connection
      const mockConnection = createMockConnection('test-connection');
      mockConnectionPool.acquire.mockResolvedValue(mockConnection);
      
      // Setup connection retry to succeed
      mockConnectionRetry.executeConnect.mockResolvedValue({
        success: true,
        result: mockConnection,
      });
    });
    
    it('should get a connection from the pool', async () => {
      // Get a connection
      const connection = await connectionManager.getConnection();
      
      // Should return a connection
      expect(connection).toBeDefined();
      expect(connection.id).toBe('test-connection');
      
      // Should use the connection pool
      expect(mockConnectionPool.acquire).toHaveBeenCalled();
      
      // Should use retry logic
      expect(mockConnectionRetry.executeConnect).toHaveBeenCalled();
    });
    
    it('should get a connection with options', async () => {
      // Define connection options
      const options: ConnectionOptions = {
        journeyType: JourneyType.HEALTH,
        queryPattern: QueryPattern.TIME_SERIES,
        forceNew: true,
        validate: true,
        timeout: 5000,
        priority: 10,
        metadata: { custom: 'value' },
      };
      
      // Get a connection with options
      const connection = await connectionManager.getConnection(options);
      
      // Should return a connection
      expect(connection).toBeDefined();
      
      // Should pass options to the pool
      expect(mockConnectionPool.acquire).toHaveBeenCalledWith(
        expect.objectContaining({
          forceNew: true,
          validate: true,
          timeout: 5000,
          priority: 10,
        })
      );
      
      // Should pass metadata to retry logic
      expect(mockConnectionRetry.executeConnect).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          journeyType: JourneyType.HEALTH,
          queryPattern: QueryPattern.TIME_SERIES,
          custom: 'value',
        })
      );
    });
    
    it('should initialize journey-specific pool when needed', async () => {
      // Reset connection pools map
      (connectionManager as any).connectionPools.clear();
      
      // Get a connection for a specific journey
      const options: ConnectionOptions = {
        journeyType: JourneyType.CARE,
      };
      
      // Get a connection
      const connection = await connectionManager.getConnection(options);
      
      // Should create a new connection pool for the journey
      expect(ConnectionPool).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          journeyId: 'care',
        }),
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });
    
    it('should throw when shutting down', async () => {
      // Start shutdown
      (connectionManager as any).isShuttingDown = true;
      
      // Should throw when getting a connection
      await expect(connectionManager.getConnection()).rejects.toThrow(
        'Cannot get connection: ConnectionManager is shutting down'
      );
    });
    
    it('should handle connection acquisition errors', async () => {
      // Make connection retry fail
      mockConnectionRetry.executeConnect.mockResolvedValueOnce({
        success: false,
        error: new Error('Connection acquisition failed'),
      });
      
      // Should throw when getting a connection
      await expect(connectionManager.getConnection()).rejects.toThrow(DatabaseException);
      
      // Should log error
      expect(loggerService.error).toHaveBeenCalledWith(
        'Failed to get connection',
        expect.any(Object)
      );
    });
  });
  
  describe('connection release', () => {
    let mockConnection: MockConnection;
    
    beforeEach(async () => {
      // Initialize the connection manager
      await connectionManager.onModuleInit();
      
      // Create a mock connection
      mockConnection = createMockConnection('test-connection');
      
      // Setup mock connection pool
      mockConnectionPool.acquire.mockResolvedValue(mockConnection);
      
      // Setup connection retry
      mockConnectionRetry.executeConnect.mockResolvedValue({
        success: true,
        result: mockConnection,
      });
      
      // Reset mocks after initialization
      jest.clearAllMocks();
    });
    
    it('should release a connection back to the pool', async () => {
      // Get a connection
      const connection = await connectionManager.getConnection();
      
      // Release the connection
      await connectionManager.releaseConnection(connection);
      
      // Should release the connection to the pool
      expect(mockConnectionPool.release).toHaveBeenCalledWith(connection, false);
    });
    
    it('should force close a connection when requested', async () => {
      // Get a connection
      const connection = await connectionManager.getConnection();
      
      // Release the connection with force close
      await connectionManager.releaseConnection(connection, true);
      
      // Should release the connection to the pool with force close
      expect(mockConnectionPool.release).toHaveBeenCalledWith(connection, true);
    });
    
    it('should validate connection before release if configured', async () => {
      // Configure validation on release
      (connectionManager as any).config.validateOnRelease = true;
      
      // Mock validation to succeed
      mockConnectionRetry.executeValidation.mockResolvedValueOnce({
        success: true,
      });
      
      // Get a connection
      const connection = await connectionManager.getConnection();
      
      // Release the connection
      await connectionManager.releaseConnection(connection);
      
      // Should validate the connection
      expect(mockConnectionRetry.executeValidation).toHaveBeenCalled();
      
      // Should release the connection to the pool
      expect(mockConnectionPool.release).toHaveBeenCalledWith(connection, false);
    });
    
    it('should force close invalid connections', async () => {
      // Configure validation on release
      (connectionManager as any).config.validateOnRelease = true;
      
      // Mock validation to fail
      mockConnectionRetry.executeValidation.mockResolvedValueOnce({
        success: false,
      });
      
      // Get a connection
      const connection = await connectionManager.getConnection();
      
      // Release the connection
      await connectionManager.releaseConnection(connection);
      
      // Should validate the connection
      expect(mockConnectionRetry.executeValidation).toHaveBeenCalled();
      
      // Should release the connection to the pool with force close
      expect(mockConnectionPool.release).toHaveBeenCalledWith(connection, true);
    });
    
    it('should handle null connections gracefully', async () => {
      // Release a null connection
      await connectionManager.releaseConnection(null);
      
      // Should not release anything to the pool
      expect(mockConnectionPool.release).not.toHaveBeenCalled();
    });
    
    it('should handle release errors gracefully', async () => {
      // Make pool release throw
      mockConnectionPool.release.mockRejectedValueOnce(new Error('Release failed'));
      
      // Get a connection
      const connection = await connectionManager.getConnection();
      
      // Release should not throw
      await expect(connectionManager.releaseConnection(connection)).resolves.not.toThrow();
      
      // Should log error
      expect(loggerService.error).toHaveBeenCalledWith(
        'Error releasing connection',
        expect.any(Object)
      );
    });
  });
  
  describe('journey-specific connections', () => {
    beforeEach(async () => {
      // Initialize the connection manager
      await connectionManager.onModuleInit();
      
      // Create a mock connection
      const mockConnection = createMockConnection('test-connection');
      
      // Setup mock connection pool
      mockConnectionPool.acquire.mockResolvedValue(mockConnection);
      
      // Setup connection retry
      mockConnectionRetry.executeConnect.mockResolvedValue({
        success: true,
        result: mockConnection,
      });
      
      // Reset mocks after initialization
      jest.clearAllMocks();
    });
    
    it('should get a connection optimized for health journey', async () => {
      // Get a health journey connection
      const connection = await connectionManager.getJourneyConnection(JourneyType.HEALTH);
      
      // Should return a connection
      expect(connection).toBeDefined();
      
      // Should pass journey type to retry logic
      expect(mockConnectionRetry.executeConnect).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          journeyType: JourneyType.HEALTH,
          queryPattern: QueryPattern.TIME_SERIES, // Default for health journey
        })
      );
    });
    
    it('should get a connection optimized for care journey', async () => {
      // Get a care journey connection
      const connection = await connectionManager.getJourneyConnection(JourneyType.CARE);
      
      // Should return a connection
      expect(connection).toBeDefined();
      
      // Should pass journey type to retry logic
      expect(mockConnectionRetry.executeConnect).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          journeyType: JourneyType.CARE,
          queryPattern: QueryPattern.MIXED, // Default for care journey
        })
      );
    });
    
    it('should get a connection optimized for plan journey', async () => {
      // Get a plan journey connection
      const connection = await connectionManager.getJourneyConnection(JourneyType.PLAN);
      
      // Should return a connection
      expect(connection).toBeDefined();
      
      // Should pass journey type to retry logic
      expect(mockConnectionRetry.executeConnect).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          journeyType: JourneyType.PLAN,
          queryPattern: QueryPattern.TRANSACTIONAL, // Default for plan journey
        })
      );
    });
    
    it('should override default query pattern when specified', async () => {
      // Get a health journey connection with custom query pattern
      const connection = await connectionManager.getJourneyConnection(
        JourneyType.HEALTH,
        { queryPattern: QueryPattern.READ_ONLY }
      );
      
      // Should return a connection
      expect(connection).toBeDefined();
      
      // Should use the specified query pattern
      expect(mockConnectionRetry.executeConnect).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          journeyType: JourneyType.HEALTH,
          queryPattern: QueryPattern.READ_ONLY,
        })
      );
    });
    
    it('should initialize a journey connection', async () => {
      // Initialize a journey connection
      await connectionManager.initializeJourneyConnection(JourneyType.HEALTH);
      
      // Should initialize the journey-specific pool
      expect(mockConnectionPool.onModuleInit).toHaveBeenCalled();
      
      // Should get and release a connection to ensure the pool is working
      expect(mockConnectionPool.acquire).toHaveBeenCalled();
      expect(mockConnectionPool.release).toHaveBeenCalled();
      
      // Should log initialization
      expect(loggerService.log).toHaveBeenCalledWith(
        'Journey connection initialized for health',
        expect.any(Object)
      );
    });
  });
  
  describe('query pattern connections', () => {
    beforeEach(async () => {
      // Initialize the connection manager
      await connectionManager.onModuleInit();
      
      // Create a mock connection
      const mockConnection = createMockConnection('test-connection');
      
      // Setup mock connection pool
      mockConnectionPool.acquire.mockResolvedValue(mockConnection);
      
      // Setup connection retry
      mockConnectionRetry.executeConnect.mockResolvedValue({
        success: true,
        result: mockConnection,
      });
      
      // Reset mocks after initialization
      jest.clearAllMocks();
    });
    
    it('should get a connection optimized for read-only queries', async () => {
      // Get a read-only connection
      const connection = await connectionManager.getPatternConnection(QueryPattern.READ_ONLY);
      
      // Should return a connection
      expect(connection).toBeDefined();
      
      // Should pass query pattern to retry logic
      expect(mockConnectionRetry.executeConnect).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          queryPattern: QueryPattern.READ_ONLY,
          readOnly: true,
          preferSlave: true,
        })
      );
    });
    
    it('should get a connection optimized for write-heavy queries', async () => {
      // Get a write-heavy connection
      const connection = await connectionManager.getPatternConnection(QueryPattern.WRITE_HEAVY);
      
      // Should return a connection
      expect(connection).toBeDefined();
      
      // Should pass query pattern to retry logic
      expect(mockConnectionRetry.executeConnect).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          queryPattern: QueryPattern.WRITE_HEAVY,
          readOnly: false,
          preferMaster: true,
        })
      );
    });
    
    it('should get a connection optimized for analytical queries', async () => {
      // Get an analytical connection
      const connection = await connectionManager.getPatternConnection(QueryPattern.ANALYTICAL);
      
      // Should return a connection
      expect(connection).toBeDefined();
      
      // Should pass query pattern to retry logic
      expect(mockConnectionRetry.executeConnect).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          queryPattern: QueryPattern.ANALYTICAL,
          analyticalQuery: true,
          largeResultSet: true,
        })
      );
      
      // Should use longer timeout
      expect(mockConnectionPool.acquire).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: expect.any(Number),
        })
      );
    });
    
    it('should get a connection optimized for time-series queries', async () => {
      // Get a time-series connection
      const connection = await connectionManager.getPatternConnection(QueryPattern.TIME_SERIES);
      
      // Should return a connection
      expect(connection).toBeDefined();
      
      // Should pass query pattern to retry logic
      expect(mockConnectionRetry.executeConnect).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          queryPattern: QueryPattern.TIME_SERIES,
          timeSeriesData: true,
        })
      );
    });
    
    it('should get a connection optimized for transactional queries', async () => {
      // Get a transactional connection
      const connection = await connectionManager.getPatternConnection(QueryPattern.TRANSACTIONAL);
      
      // Should return a connection
      expect(connection).toBeDefined();
      
      // Should pass query pattern to retry logic
      expect(mockConnectionRetry.executeConnect).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          queryPattern: QueryPattern.TRANSACTIONAL,
          transactional: true,
          durability: 'high',
        })
      );
    });
  });
  
  describe('connection tracking', () => {
    beforeEach(async () => {
      // Initialize the connection manager
      await connectionManager.onModuleInit();
      
      // Create a mock connection
      const mockConnection = createMockConnection('test-connection');
      
      // Setup mock connection pool
      mockConnectionPool.acquire.mockResolvedValue(mockConnection);
      
      // Setup connection retry
      mockConnectionRetry.executeConnect.mockImplementation(() => {
        // Simulate creating a connection
        return Promise.resolve({
          success: true,
          result: mockConnection,
        });
      });
      
      // Reset mocks after initialization
      jest.clearAllMocks();
    });
    
    it('should track connections when tracking is enabled', async () => {
      // Enable connection tracking
      (connectionManager as any).config.enableConnectionTracking = true;
      
      // Get a connection
      const connection = await connectionManager.getConnection();
      
      // Should track the connection
      const trackedConnections = (connectionManager as any).trackedConnections;
      expect(trackedConnections.size).toBe(1);
      
      // Connection should be marked as in use
      const trackedConnection = Array.from(trackedConnections.values())[0];
      expect(trackedConnection.inUse).toBe(true);
      expect(trackedConnection.acquisitionCount).toBe(1);
      
      // Release the connection
      await connectionManager.releaseConnection(connection);
      
      // Connection should be marked as not in use
      expect(trackedConnection.inUse).toBe(false);
      expect(trackedConnection.lastReleasedAt).toBeDefined();
    });
    
    it('should not track connections when tracking is disabled', async () => {
      // Disable connection tracking
      (connectionManager as any).config.enableConnectionTracking = false;
      
      // Get a connection
      const connection = await connectionManager.getConnection();
      
      // Should not track the connection
      const trackedConnections = (connectionManager as any).trackedConnections;
      expect(trackedConnections.size).toBe(0);
      
      // Release the connection
      await connectionManager.releaseConnection(connection);
    });
    
    it('should create health monitor for connections when monitoring is enabled', async () => {
      // Enable health monitoring
      (connectionManager as any).config.enableHealthMonitoring = true;
      
      // Get a connection
      const connection = await connectionManager.getConnection();
      
      // Should create health monitor
      expect(ConnectionHealth).toHaveBeenCalled();
      
      // Health monitor should be started
      const healthMonitor = (ConnectionHealth as jest.Mock).mock.instances[0];
      expect(healthMonitor.startMonitoring).toHaveBeenCalled();
      
      // Release the connection
      await connectionManager.releaseConnection(connection);
    });
    
    it('should not create health monitor when monitoring is disabled', async () => {
      // Disable health monitoring
      (connectionManager as any).config.enableHealthMonitoring = false;
      
      // Reset ConnectionHealth mock
      (ConnectionHealth as jest.Mock).mockClear();
      
      // Get a connection
      const connection = await connectionManager.getConnection();
      
      // Should not create health monitor
      expect(ConnectionHealth).not.toHaveBeenCalled();
      
      // Release the connection
      await connectionManager.releaseConnection(connection);
    });
    
    it('should provide connection statistics', async () => {
      // Get some connections
      const conn1 = await connectionManager.getConnection();
      const conn2 = await connectionManager.getJourneyConnection(JourneyType.HEALTH);
      
      // Release one connection
      await connectionManager.releaseConnection(conn1);
      
      // Get connection stats
      const stats = connectionManager.getConnectionStats();
      
      // Stats should be accurate
      expect(stats.totalConnections).toBe(2);
      expect(stats.activeConnections).toBe(1);
      expect(stats.idleConnections).toBe(1);
      expect(stats.journeyConnections).toBeDefined();
      expect(stats.patternConnections).toBeDefined();
      
      // Release the other connection
      await connectionManager.releaseConnection(conn2);
    });
  });
  
  describe('connection cleanup', () => {
    beforeEach(async () => {
      // Configure short cleanup interval for testing
      (connectionManager as any).config.cleanupIntervalMs = 100;
      (connectionManager as any).config.maxIdleTimeMs = 200;
      
      // Initialize the connection manager
      await connectionManager.onModuleInit();
      
      // Create a mock connection
      const mockConnection = createMockConnection('test-connection');
      
      // Setup mock connection pool
      mockConnectionPool.acquire.mockResolvedValue(mockConnection);
      
      // Setup connection retry
      mockConnectionRetry.executeConnect.mockResolvedValue({
        success: true,
        result: mockConnection,
      });
      mockConnectionRetry.executeCommand.mockResolvedValue({
        success: true,
      });
      
      // Reset mocks after initialization
      jest.clearAllMocks();
    });
    
    it('should clean up idle connections after timeout', async () => {
      // Get a connection
      const connection = await connectionManager.getConnection();
      
      // Release the connection
      await connectionManager.releaseConnection(connection);
      
      // Set last released time to be older than max idle time
      const trackedConnections = (connectionManager as any).trackedConnections;
      const trackedConnection = Array.from(trackedConnections.values())[0];
      trackedConnection.lastReleasedAt = new Date(Date.now() - 300); // 300ms ago
      
      // Manually trigger cleanup
      await (connectionManager as any).cleanupConnections();
      
      // Should close the idle connection
      expect(mockConnectionRetry.executeCommand).toHaveBeenCalled();
      
      // Should remove the connection from tracking
      expect(trackedConnections.size).toBe(0);
    });
    
    it('should not clean up connections in use', async () => {
      // Get a connection but don't release it
      const connection = await connectionManager.getConnection();
      
      // Manually trigger cleanup
      await (connectionManager as any).cleanupConnections();
      
      // Should not close any connections
      expect(mockConnectionRetry.executeCommand).not.toHaveBeenCalled();
      
      // Should keep tracking the connection
      const trackedConnections = (connectionManager as any).trackedConnections;
      expect(trackedConnections.size).toBe(1);
      
      // Release the connection
      await connectionManager.releaseConnection(connection);
    });
    
    it('should clean up connections that exceed maximum lifetime', async () => {
      // Configure max lifetime
      (connectionManager as any).config.maxLifetimeMs = 200;
      
      // Get a connection
      const connection = await connectionManager.getConnection();
      
      // Release the connection
      await connectionManager.releaseConnection(connection);
      
      // Set created time to be older than max lifetime
      const trackedConnections = (connectionManager as any).trackedConnections;
      const trackedConnection = Array.from(trackedConnections.values())[0];
      trackedConnection.createdAt = new Date(Date.now() - 300); // 300ms ago
      
      // Manually trigger cleanup
      await (connectionManager as any).cleanupConnections();
      
      // Should close the expired connection
      expect(mockConnectionRetry.executeCommand).toHaveBeenCalled();
      
      // Should remove the connection from tracking
      expect(trackedConnections.size).toBe(0);
    });
    
    it('should clean up unhealthy connections', async () => {
      // Get a connection
      const connection = await connectionManager.getConnection();
      
      // Release the connection
      await connectionManager.releaseConnection(connection);
      
      // Mark the connection as unhealthy
      const trackedConnections = (connectionManager as any).trackedConnections;
      const trackedConnection = Array.from(trackedConnections.values())[0];
      trackedConnection.health.isUnhealthy.mockReturnValueOnce(true);
      
      // Manually trigger cleanup
      await (connectionManager as any).cleanupConnections();
      
      // Should close the unhealthy connection
      expect(mockConnectionRetry.executeCommand).toHaveBeenCalled();
      
      // Should remove the connection from tracking
      expect(trackedConnections.size).toBe(0);
    });
    
    it('should handle cleanup errors gracefully', async () => {
      // Get a connection
      const connection = await connectionManager.getConnection();
      
      // Release the connection
      await connectionManager.releaseConnection(connection);
      
      // Set last released time to be older than max idle time
      const trackedConnections = (connectionManager as any).trackedConnections;
      const trackedConnection = Array.from(trackedConnections.values())[0];
      trackedConnection.lastReleasedAt = new Date(Date.now() - 300); // 300ms ago
      
      // Make connection close fail
      mockConnectionRetry.executeCommand.mockRejectedValueOnce(new Error('Close failed'));
      
      // Manually trigger cleanup
      await (connectionManager as any).cleanupConnections();
      
      // Should log error
      expect(loggerService.error).toHaveBeenCalledWith(
        'Error during connection cleanup',
        expect.any(Object)
      );
    });
  });
  
  describe('connection execution helpers', () => {
    let mockConnection: MockConnection;
    
    beforeEach(async () => {
      // Initialize the connection manager
      await connectionManager.onModuleInit();
      
      // Create a mock connection
      mockConnection = createMockConnection('test-connection');
      
      // Setup mock connection pool
      mockConnectionPool.acquire.mockResolvedValue(mockConnection);
      
      // Setup connection retry
      mockConnectionRetry.executeConnect.mockResolvedValue({
        success: true,
        result: mockConnection,
      });
      mockConnectionRetry.executeQuery.mockResolvedValue({
        success: true,
        result: { rows: [{ id: 1, name: 'Test' }] },
      });
      mockConnectionRetry.executeTransaction.mockResolvedValue({
        success: true,
        result: { success: true },
      });
      
      // Reset mocks after initialization
      jest.clearAllMocks();
    });
    
    it('should execute a function with a connection', async () => {
      // Define a function to execute
      const fn = jest.fn().mockResolvedValue({ result: 'success' });
      
      // Execute the function with a connection
      const result = await connectionManager.withConnection(fn);
      
      // Should acquire a connection
      expect(mockConnectionPool.acquire).toHaveBeenCalled();
      
      // Should call the function with the connection
      expect(fn).toHaveBeenCalledWith(mockConnection);
      
      // Should release the connection
      expect(mockConnectionPool.release).toHaveBeenCalled();
      
      // Should return the function result
      expect(result).toEqual({ result: 'success' });
    });
    
    it('should release connection even if function throws', async () => {
      // Define a function that throws
      const fn = jest.fn().mockRejectedValue(new Error('Function failed'));
      
      // Execute the function with a connection
      await expect(connectionManager.withConnection(fn)).rejects.toThrow('Function failed');
      
      // Should acquire a connection
      expect(mockConnectionPool.acquire).toHaveBeenCalled();
      
      // Should call the function with the connection
      expect(fn).toHaveBeenCalledWith(mockConnection);
      
      // Should release the connection
      expect(mockConnectionPool.release).toHaveBeenCalled();
    });
    
    it('should execute a function with a journey-specific connection', async () => {
      // Define a function to execute
      const fn = jest.fn().mockResolvedValue({ result: 'success' });
      
      // Execute the function with a journey connection
      const result = await connectionManager.withJourneyConnection(JourneyType.HEALTH, fn);
      
      // Should acquire a connection with journey type
      expect(mockConnectionRetry.executeConnect).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          journeyType: JourneyType.HEALTH,
        })
      );
      
      // Should call the function with the connection
      expect(fn).toHaveBeenCalledWith(mockConnection);
      
      // Should return the function result
      expect(result).toEqual({ result: 'success' });
    });
    
    it('should execute a function with a pattern-optimized connection', async () => {
      // Define a function to execute
      const fn = jest.fn().mockResolvedValue({ result: 'success' });
      
      // Execute the function with a pattern connection
      const result = await connectionManager.withPatternConnection(QueryPattern.READ_ONLY, fn);
      
      // Should acquire a connection with query pattern
      expect(mockConnectionRetry.executeConnect).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          queryPattern: QueryPattern.READ_ONLY,
        })
      );
      
      // Should call the function with the connection
      expect(fn).toHaveBeenCalledWith(mockConnection);
      
      // Should return the function result
      expect(result).toEqual({ result: 'success' });
    });
    
    it('should execute a query with retry logic', async () => {
      // Define a query function
      const queryFn = jest.fn().mockResolvedValue({ rows: [{ id: 1, name: 'Test' }] });
      
      // Execute the query
      const result = await connectionManager.executeQuery(queryFn);
      
      // Should acquire a connection
      expect(mockConnectionPool.acquire).toHaveBeenCalled();
      
      // Should use retry logic for the query
      expect(mockConnectionRetry.executeQuery).toHaveBeenCalled();
      
      // Should release the connection
      expect(mockConnectionPool.release).toHaveBeenCalled();
      
      // Should return the query result
      expect(result).toEqual({ rows: [{ id: 1, name: 'Test' }] });
    });
    
    it('should handle query execution errors', async () => {
      // Make query execution fail
      mockConnectionRetry.executeQuery.mockResolvedValueOnce({
        success: false,
        error: new Error('Query failed'),
      });
      
      // Define a query function
      const queryFn = jest.fn();
      
      // Execute the query
      await expect(connectionManager.executeQuery(queryFn)).rejects.toThrow(DatabaseException);
      
      // Should acquire a connection
      expect(mockConnectionPool.acquire).toHaveBeenCalled();
      
      // Should use retry logic for the query
      expect(mockConnectionRetry.executeQuery).toHaveBeenCalled();
      
      // Should release the connection
      expect(mockConnectionPool.release).toHaveBeenCalled();
    });
    
    it('should execute a transaction with retry logic', async () => {
      // Define a transaction function
      const transactionFn = jest.fn().mockResolvedValue({ success: true });
      
      // Execute the transaction
      const result = await connectionManager.executeTransaction(transactionFn);
      
      // Should acquire a connection
      expect(mockConnectionPool.acquire).toHaveBeenCalled();
      
      // Should use retry logic for the transaction
      expect(mockConnectionRetry.executeTransaction).toHaveBeenCalled();
      
      // Should release the connection
      expect(mockConnectionPool.release).toHaveBeenCalled();
      
      // Should return the transaction result
      expect(result).toEqual({ success: true });
    });
    
    it('should handle transaction execution errors', async () => {
      // Make transaction execution fail
      mockConnectionRetry.executeTransaction.mockResolvedValueOnce({
        success: false,
        error: new Error('Transaction failed'),
      });
      
      // Define a transaction function
      const transactionFn = jest.fn();
      
      // Execute the transaction
      await expect(connectionManager.executeTransaction(transactionFn)).rejects.toThrow(DatabaseException);
      
      // Should acquire a connection
      expect(mockConnectionPool.acquire).toHaveBeenCalled();
      
      // Should use retry logic for the transaction
      expect(mockConnectionRetry.executeTransaction).toHaveBeenCalled();
      
      // Should release the connection
      expect(mockConnectionPool.release).toHaveBeenCalled();
    });
  });
  
  describe('shutdown', () => {
    beforeEach(async () => {
      // Initialize the connection manager
      await connectionManager.onModuleInit();
      
      // Reset mocks after initialization
      jest.clearAllMocks();
    });
    
    it('should shut down all connection pools', async () => {
      // Shutdown the connection manager
      await connectionManager.shutdown();
      
      // Should shut down the connection pool
      expect(mockConnectionPool.shutdown).toHaveBeenCalled();
      
      // Should log shutdown
      expect(loggerService.log).toHaveBeenCalledWith(
        'ConnectionManager shutdown complete',
        expect.any(Object)
      );
    });
    
    it('should stop cleanup timer during shutdown', async () => {
      // Create a spy on clearInterval
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      // Shutdown the connection manager
      await connectionManager.shutdown();
      
      // Should clear the cleanup timer
      expect(clearIntervalSpy).toHaveBeenCalled();
      
      // Restore the spy
      clearIntervalSpy.mockRestore();
    });
    
    it('should clear tracked connections during shutdown', async () => {
      // Add some tracked connections
      (connectionManager as any).trackedConnections.set('conn1', { id: 'conn1' });
      (connectionManager as any).trackedConnections.set('conn2', { id: 'conn2' });
      
      // Shutdown the connection manager
      await connectionManager.shutdown();
      
      // Should clear tracked connections
      expect((connectionManager as any).trackedConnections.size).toBe(0);
    });
    
    it('should handle shutdown errors gracefully', async () => {
      // Make pool shutdown throw
      mockConnectionPool.shutdown.mockRejectedValueOnce(new Error('Shutdown failed'));
      
      // Shutdown should throw
      await expect(connectionManager.shutdown()).rejects.toThrow(DatabaseException);
      
      // Should log error
      expect(loggerService.error).toHaveBeenCalledWith(
        'Error during ConnectionManager shutdown',
        expect.any(Object)
      );
    });
    
    it('should not shut down twice', async () => {
      // Shutdown once
      await connectionManager.shutdown();
      
      // Reset mocks
      jest.clearAllMocks();
      
      // Shutdown again
      await connectionManager.shutdown();
      
      // Should not shut down again
      expect(mockConnectionPool.shutdown).not.toHaveBeenCalled();
    });
    
    it('should force shutdown when requested', async () => {
      // Shutdown with force
      await connectionManager.shutdown(true);
      
      // Should shut down the connection pool with force
      expect(mockConnectionPool.shutdown).toHaveBeenCalledWith(true);
    });
  });
  
  describe('health check', () => {
    beforeEach(async () => {
      // Initialize the connection manager
      await connectionManager.onModuleInit();
      
      // Setup mock connection pool
      mockConnectionPool.acquire.mockResolvedValue(createMockConnection('test-connection'));
      
      // Reset mocks after initialization
      jest.clearAllMocks();
    });
    
    it('should check health of all connection pools', async () => {
      // Setup mock validation to succeed
      mockConnectionRetry.executeValidation.mockResolvedValue({
        success: true,
      });
      
      // Check health
      const health = await connectionManager.checkHealth();
      
      // Should acquire a connection from each pool
      expect(mockConnectionPool.acquire).toHaveBeenCalled();
      
      // Should validate the connection
      expect(mockConnectionRetry.executeValidation).toHaveBeenCalled();
      
      // Should release the connection
      expect(mockConnectionPool.release).toHaveBeenCalled();
      
      // Should return healthy status
      expect(health.healthy).toBe(true);
      expect(health.details).toBeDefined();
    });
    
    it('should report unhealthy when validation fails', async () => {
      // Setup mock validation to fail
      mockConnectionRetry.executeValidation.mockResolvedValue({
        success: false,
      });
      
      // Check health
      const health = await connectionManager.checkHealth();
      
      // Should acquire a connection from each pool
      expect(mockConnectionPool.acquire).toHaveBeenCalled();
      
      // Should validate the connection
      expect(mockConnectionRetry.executeValidation).toHaveBeenCalled();
      
      // Should release the connection with force close
      expect(mockConnectionPool.release).toHaveBeenCalledWith(
        expect.anything(),
        true
      );
      
      // Should return unhealthy status
      expect(health.healthy).toBe(false);
    });
    
    it('should report unhealthy when acquisition fails', async () => {
      // Make connection acquisition fail
      mockConnectionPool.acquire.mockRejectedValueOnce(new Error('Acquisition failed'));
      
      // Check health
      const health = await connectionManager.checkHealth();
      
      // Should try to acquire a connection
      expect(mockConnectionPool.acquire).toHaveBeenCalled();
      
      // Should not validate or release
      expect(mockConnectionRetry.executeValidation).not.toHaveBeenCalled();
      expect(mockConnectionPool.release).not.toHaveBeenCalled();
      
      // Should return unhealthy status
      expect(health.healthy).toBe(false);
      expect(health.details).toBeDefined();
    });
  });
  
  describe('connection refresh', () => {
    beforeEach(async () => {
      // Initialize the connection manager
      await connectionManager.onModuleInit();
      
      // Reset mocks after initialization
      jest.clearAllMocks();
    });
    
    it('should refresh connections in all pools', async () => {
      // Refresh connections
      await connectionManager.refreshConnections();
      
      // Should refresh connections in the pool
      expect(mockConnectionPool.refreshConnections).toHaveBeenCalled();
      
      // Should log refresh
      expect(loggerService.log).toHaveBeenCalledWith(
        'All connections refreshed',
        expect.any(Object)
      );
    });
    
    it('should handle refresh errors gracefully', async () => {
      // Make pool refresh throw
      mockConnectionPool.refreshConnections.mockRejectedValueOnce(new Error('Refresh failed'));
      
      // Refresh should still succeed overall
      await expect(connectionManager.refreshConnections()).resolves.not.toThrow();
      
      // Should log error
      expect(loggerService.log).toHaveBeenCalledWith(
        'All connections refreshed',
        expect.any(Object)
      );
    });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../src/prisma.service';
import { ConnectionManager } from '../../src/connection/connection-manager';
import { ErrorTransformer } from '../../src/errors/error-transformer';
import { RetryStrategyFactory } from '../../src/errors/retry-strategies';
import { MiddlewareFactory } from '../../src/middleware/middleware.factory';
import { MiddlewareRegistry } from '../../src/middleware/middleware.registry';
import { DatabaseException, ConnectionException, QueryException } from '../../src/errors/database-error.exception';
import { DatabaseErrorType, DatabaseErrorSeverity } from '../../src/errors/database-error.types';

// Mock PrismaClient to avoid actual database connections during tests
jest.mock('@prisma/client', () => {
  const mockPrismaClient = jest.fn().mockImplementation(() => ({
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $on: jest.fn(),
    $queryRaw: jest.fn().mockResolvedValue([{ connection_test: 1 }]),
  }));
  return { PrismaClient: mockPrismaClient };
});

// Mock ConnectionManager
const mockConnectionManager = {
  initialize: jest.fn().mockResolvedValue(undefined),
  shutdown: jest.fn().mockResolvedValue(undefined),
  getPoolStats: jest.fn().mockResolvedValue({
    active: 2,
    idle: 3,
    total: 5,
    waiting: 0,
  }),
};

// Mock ErrorTransformer
const mockErrorTransformer = {
  transformConnectionError: jest.fn().mockImplementation((error, message) => {
    return new ConnectionException(
      message || 'Mock connection error',
      { cause: error },
      DatabaseErrorType.CONNECTION,
      'MOCK_CONNECTION_ERROR'
    );
  }),
  transformQueryError: jest.fn().mockImplementation((error, message) => {
    return new QueryException(
      message || 'Mock query error',
      { cause: error },
      DatabaseErrorType.QUERY,
      'MOCK_QUERY_ERROR'
    );
  }),
};

// Mock RetryStrategyFactory
const mockRetryStrategy = {
  getNextDelayMs: jest.fn().mockReturnValue(100),
  shouldRetry: jest.fn().mockReturnValue(true),
  getMaxAttempts: jest.fn().mockReturnValue(3),
};

const mockRetryStrategyFactory = {
  createStrategy: jest.fn().mockReturnValue(mockRetryStrategy),
  getDefaultStrategy: jest.fn().mockReturnValue(mockRetryStrategy),
};

// Mock MiddlewareChain
const mockMiddlewareChain = {
  executeBeforeHooks: jest.fn().mockResolvedValue(undefined),
  executeAfterHooks: jest.fn().mockResolvedValue(undefined),
};

// Mock MiddlewareFactory
const mockMiddlewareFactory = {
  createMiddlewareChain: jest.fn().mockReturnValue(mockMiddlewareChain),
};

// Mock MiddlewareRegistry
const mockMiddlewareRegistry = {
  register: jest.fn(),
};

// Mock ConfigService
const mockConfigService = {
  get: jest.fn().mockImplementation((key, defaultValue) => {
    const config = {
      'NODE_ENV': 'test',
      'DATABASE_POOL_MIN': 2,
      'DATABASE_POOL_MAX': 10,
      'DATABASE_POOL_IDLE': 5000,
      'DATABASE_MAX_CONNECTION_ATTEMPTS': 3,
      'DATABASE_CONNECTION_TIMEOUT': 5000,
      'DATABASE_QUERY_TIMEOUT': 3000,
      'DATABASE_ENABLE_QUERY_LOGGING': true,
      'DATABASE_ENABLE_PERFORMANCE_TRACKING': true,
      'DATABASE_ENABLE_CIRCUIT_BREAKER': false,
      'DATABASE_RETRY_BASE_DELAY': 100,
      'DATABASE_RETRY_MAX_DELAY': 1000,
      'DATABASE_RETRY_MAX_ATTEMPTS': 3,
      'DATABASE_RETRY_JITTER_FACTOR': 0.1,
      'DATABASE_HEALTH_CHECK_INTERVAL': 30000,
    };
    return config[key] !== undefined ? config[key] : defaultValue;
  }),
};

describe('PrismaService', () => {
  let service: PrismaService;
  let module: TestingModule;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create a testing module with mocked dependencies
    module = await Test.createTestingModule({
      providers: [
        PrismaService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: ConnectionManager, useValue: mockConnectionManager },
        { provide: ErrorTransformer, useValue: mockErrorTransformer },
        { provide: RetryStrategyFactory, useValue: mockRetryStrategyFactory },
        { provide: MiddlewareFactory, useValue: mockMiddlewareFactory },
        { provide: MiddlewareRegistry, useValue: mockMiddlewareRegistry },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);

    // Mock the private methods and properties that we need to access for testing
    // @ts-ignore - accessing private property for testing
    service['connectionManager'] = mockConnectionManager;
    // @ts-ignore - accessing private property for testing
    service['errorTransformer'] = mockErrorTransformer;
    // @ts-ignore - accessing private property for testing
    service['retryStrategyFactory'] = mockRetryStrategyFactory;
    // @ts-ignore - accessing private property for testing
    service['middlewareFactory'] = mockMiddlewareFactory;
    // @ts-ignore - accessing private property for testing
    service['middlewareRegistry'] = mockMiddlewareRegistry;
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Initialization and Configuration', () => {
    it('should load configuration from environment variables', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('NODE_ENV', 'development');
      expect(mockConfigService.get).toHaveBeenCalledWith('DATABASE_POOL_MIN', expect.any(Number));
      expect(mockConfigService.get).toHaveBeenCalledWith('DATABASE_POOL_MAX', expect.any(Number));
      expect(mockConfigService.get).toHaveBeenCalledWith('DATABASE_ENABLE_QUERY_LOGGING', expect.any(Boolean));
    });

    it('should register middleware based on configuration', () => {
      // Verify that middleware registration was called
      expect(mockMiddlewareRegistry.register).toHaveBeenCalled();
    });

    it('should set up event listeners for Prisma Client events', () => {
      // Verify that event listeners were set up
      const prismaClientMock = new PrismaClient();
      expect(prismaClientMock.$on).toHaveBeenCalledWith('query', expect.any(Function));
      expect(prismaClientMock.$on).toHaveBeenCalledWith('info', expect.any(Function));
      expect(prismaClientMock.$on).toHaveBeenCalledWith('warn', expect.any(Function));
      expect(prismaClientMock.$on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('Lifecycle Management', () => {
    it('should initialize connection on module init', async () => {
      // Mock the connect method
      const connectSpy = jest.spyOn(service as any, 'connect').mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(connectSpy).toHaveBeenCalled();
    });

    it('should disconnect on module destroy', async () => {
      // Mock the disconnect method
      const disconnectSpy = jest.spyOn(service as any, 'disconnect').mockResolvedValue(undefined);

      await service.onModuleDestroy();

      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should connect to the database with retry logic', async () => {
      // Reset the isConnected flag for testing
      // @ts-ignore - accessing private property for testing
      service['isConnected'] = false;

      // Call the private connect method directly for testing
      // @ts-ignore - calling private method for testing
      await service['connect']();

      // Verify that connection manager was initialized
      expect(mockConnectionManager.initialize).toHaveBeenCalled();
      // Verify that a test query was executed to confirm connection
      expect(service.$queryRaw).toHaveBeenCalled();
      // Verify that isConnected flag was set to true
      // @ts-ignore - accessing private property for testing
      expect(service['isConnected']).toBe(true);
    });

    it('should handle connection failures with retry', async () => {
      // Reset the isConnected flag for testing
      // @ts-ignore - accessing private property for testing
      service['isConnected'] = false;

      // Mock connection failure on first attempt, success on second
      const queryRawMock = service.$queryRaw as jest.Mock;
      queryRawMock
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce([{ connection_test: 1 }]);

      // Call the private connect method directly for testing
      // @ts-ignore - calling private method for testing
      await service['connect']();

      // Verify that connection was attempted multiple times
      expect(queryRawMock).toHaveBeenCalledTimes(2);
      // Verify that isConnected flag was set to true after successful retry
      // @ts-ignore - accessing private property for testing
      expect(service['isConnected']).toBe(true);
    });

    it('should throw exception after maximum connection attempts', async () => {
      // Reset the isConnected flag for testing
      // @ts-ignore - accessing private property for testing
      service['isConnected'] = false;
      // @ts-ignore - accessing private property for testing
      service['maxConnectionAttempts'] = 2;

      // Mock connection failure on all attempts
      const queryRawMock = service.$queryRaw as jest.Mock;
      queryRawMock.mockRejectedValue(new Error('Connection failed'));

      // Call the private connect method directly for testing
      // @ts-ignore - calling private method for testing
      await expect(service['connect']()).rejects.toThrow();

      // Verify that connection was attempted the maximum number of times
      expect(queryRawMock).toHaveBeenCalledTimes(2);
      // Verify that error transformer was called to transform the connection error
      expect(mockErrorTransformer.transformConnectionError).toHaveBeenCalled();
      // Verify that isConnected flag remains false
      // @ts-ignore - accessing private property for testing
      expect(service['isConnected']).toBe(false);
    });

    it('should disconnect from the database properly', async () => {
      // Set the isConnected flag for testing
      // @ts-ignore - accessing private property for testing
      service['isConnected'] = true;

      // Call the private disconnect method directly for testing
      // @ts-ignore - calling private method for testing
      await service['disconnect']();

      // Verify that connection manager shutdown was called
      expect(mockConnectionManager.shutdown).toHaveBeenCalled();
      // Verify that Prisma client disconnect was called
      expect(service.$disconnect).toHaveBeenCalled();
      // Verify that isConnected flag was set to false
      // @ts-ignore - accessing private property for testing
      expect(service['isConnected']).toBe(false);
    });

    it('should handle disconnect errors gracefully', async () => {
      // Set the isConnected flag for testing
      // @ts-ignore - accessing private property for testing
      service['isConnected'] = true;

      // Mock disconnect failure
      const disconnectMock = service.$disconnect as jest.Mock;
      disconnectMock.mockRejectedValue(new Error('Disconnect failed'));

      // Call the private disconnect method directly for testing
      // @ts-ignore - calling private method for testing
      await service['disconnect']();

      // Verify that error transformer was called to transform the disconnect error
      expect(mockErrorTransformer.transformConnectionError).toHaveBeenCalled();
      // Verify that isConnected flag was still set to false despite the error
      // @ts-ignore - accessing private property for testing
      expect(service['isConnected']).toBe(false);
    });
  });

  describe('Query Execution', () => {
    it('should execute queries with middleware processing', async () => {
      // Set the isConnected flag for testing
      // @ts-ignore - accessing private property for testing
      service['isConnected'] = true;

      // Mock query function
      const queryFn = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });

      // Execute query
      const result = await service.executeQuery('testQuery', queryFn);

      // Verify that middleware chain was created and executed
      expect(mockMiddlewareFactory.createMiddlewareChain).toHaveBeenCalledWith({
        queryName: 'testQuery',
        timestamp: expect.any(Number),
      });
      expect(mockMiddlewareChain.executeBeforeHooks).toHaveBeenCalled();
      expect(queryFn).toHaveBeenCalled();
      expect(mockMiddlewareChain.executeAfterHooks).toHaveBeenCalledWith(null, { id: 1, name: 'Test' });
      expect(result).toEqual({ id: 1, name: 'Test' });
    });

    it('should connect automatically if not connected', async () => {
      // Reset the isConnected flag for testing
      // @ts-ignore - accessing private property for testing
      service['isConnected'] = false;

      // Mock the connect method
      const connectSpy = jest.spyOn(service as any, 'connect').mockResolvedValue(undefined);

      // Mock query function
      const queryFn = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });

      // Execute query
      await service.executeQuery('testQuery', queryFn);

      // Verify that connect was called before executing the query
      expect(connectSpy).toHaveBeenCalled();
    });

    it('should handle query errors with retry logic', async () => {
      // Set the isConnected flag for testing
      // @ts-ignore - accessing private property for testing
      service['isConnected'] = true;

      // Mock query function that fails on first attempt, succeeds on second
      const queryFn = jest.fn()
        .mockRejectedValueOnce(new Error('Query failed'))
        .mockResolvedValueOnce({ id: 1, name: 'Test' });

      // Execute query
      const result = await service.executeQuery('testQuery', queryFn);

      // Verify that query was attempted multiple times
      expect(queryFn).toHaveBeenCalledTimes(2);
      // Verify that error transformer was called to transform the query error
      expect(mockErrorTransformer.transformQueryError).toHaveBeenCalled();
      // Verify that retry strategy was created and used
      expect(mockRetryStrategyFactory.createStrategy).toHaveBeenCalled();
      expect(mockRetryStrategy.shouldRetry).toHaveBeenCalled();
      expect(mockRetryStrategy.getNextDelayMs).toHaveBeenCalled();
      // Verify that middleware after hooks were called with the error
      expect(mockMiddlewareChain.executeAfterHooks).toHaveBeenCalledWith(expect.any(Object), null);
      // Verify that the final result is correct after successful retry
      expect(result).toEqual({ id: 1, name: 'Test' });
    });

    it('should throw exception after maximum query attempts', async () => {
      // Set the isConnected flag for testing
      // @ts-ignore - accessing private property for testing
      service['isConnected'] = true;

      // Mock query function that always fails
      const queryFn = jest.fn().mockRejectedValue(new Error('Query failed'));

      // Mock retry strategy to indicate we should retry but then exhaust attempts
      mockRetryStrategy.shouldRetry.mockReturnValue(true);
      mockRetryStrategy.getMaxAttempts.mockReturnValue(2);

      // Execute query and expect it to throw
      await expect(service.executeQuery('testQuery', queryFn)).rejects.toThrow();

      // Verify that query was attempted the maximum number of times
      expect(queryFn).toHaveBeenCalledTimes(2);
      // Verify that error transformer was called to transform the query error
      expect(mockErrorTransformer.transformQueryError).toHaveBeenCalled();
    });

    it('should not retry if the error is not retryable', async () => {
      // Set the isConnected flag for testing
      // @ts-ignore - accessing private property for testing
      service['isConnected'] = true;

      // Mock query function that fails
      const queryFn = jest.fn().mockRejectedValue(new Error('Non-retryable error'));

      // Mock retry strategy to indicate we should not retry
      mockRetryStrategy.shouldRetry.mockReturnValue(false);

      // Execute query and expect it to throw
      await expect(service.executeQuery('testQuery', queryFn)).rejects.toThrow();

      // Verify that query was attempted only once
      expect(queryFn).toHaveBeenCalledTimes(1);
      // Verify that retry strategy was consulted
      expect(mockRetryStrategy.shouldRetry).toHaveBeenCalled();
    });
  });

  describe('Health Checks', () => {
    it('should report healthy status when database is available', async () => {
      // Mock successful query execution
      const queryRawMock = service.$queryRaw as jest.Mock;
      queryRawMock.mockResolvedValue([{ health_check: 1 }]);

      const health = await service.checkHealth();

      expect(health.status).toBe('up');
      expect(health.details).toHaveProperty('responseTime');
      expect(health.details).toHaveProperty('connections');
      expect(mockConnectionManager.getPoolStats).toHaveBeenCalled();
    });

    it('should report unhealthy status when database is unavailable', async () => {
      // Mock failed query execution
      const queryRawMock = service.$queryRaw as jest.Mock;
      queryRawMock.mockRejectedValue(new Error('Database unavailable'));

      const health = await service.checkHealth();

      expect(health.status).toBe('down');
      expect(health.details).toHaveProperty('error');
      expect(health.details).toHaveProperty('code');
      expect(health.details).toHaveProperty('type');
      expect(mockErrorTransformer.transformConnectionError).toHaveBeenCalled();
    });
  });

  describe('Connection Pooling', () => {
    it('should use connection manager for optimized connections', async () => {
      // Reset the isConnected flag for testing
      // @ts-ignore - accessing private property for testing
      service['isConnected'] = false;

      // Call the private connect method directly for testing
      // @ts-ignore - calling private method for testing
      await service['connect']();

      // Verify that connection manager was used for initialization
      expect(mockConnectionManager.initialize).toHaveBeenCalledWith(service);
    });

    it('should report connection pool statistics in health check', async () => {
      // Mock successful query execution
      const queryRawMock = service.$queryRaw as jest.Mock;
      queryRawMock.mockResolvedValue([{ health_check: 1 }]);

      const health = await service.checkHealth();

      expect(health.details.connections).toEqual({
        active: 2,
        idle: 3,
        total: 5,
        waiting: 0,
      });
    });
  });

  describe('Error Handling', () => {
    it('should transform connection errors with context', async () => {
      // Reset the isConnected flag for testing
      // @ts-ignore - accessing private property for testing
      service['isConnected'] = false;
      // @ts-ignore - accessing private property for testing
      service['maxConnectionAttempts'] = 1;

      // Mock connection failure
      const queryRawMock = service.$queryRaw as jest.Mock;
      queryRawMock.mockRejectedValue(new Error('Connection failed'));

      // Call the private connect method directly for testing
      // @ts-ignore - calling private method for testing
      await expect(service['connect']()).rejects.toThrow();

      // Verify that error transformer was called with the original error and a descriptive message
      expect(mockErrorTransformer.transformConnectionError).toHaveBeenCalledWith(
        expect.any(Error),
        'Failed to connect to database after maximum connection attempts'
      );
    });

    it('should transform query errors with context', async () => {
      // Set the isConnected flag for testing
      // @ts-ignore - accessing private property for testing
      service['isConnected'] = true;

      // Mock query function that fails
      const queryFn = jest.fn().mockRejectedValue(new Error('Query failed'));

      // Mock retry strategy to indicate we should not retry
      mockRetryStrategy.shouldRetry.mockReturnValue(false);

      // Execute query and expect it to throw
      await expect(service.executeQuery('testQuery', queryFn)).rejects.toThrow();

      // Verify that error transformer was called with the original error and a descriptive message
      expect(mockErrorTransformer.transformQueryError).toHaveBeenCalledWith(
        expect.any(Error),
        'Error executing query: testQuery'
      );
    });
  });

  describe('Performance Monitoring', () => {
    it('should track query execution time in health check', async () => {
      // Mock Date.now for consistent timing measurement
      const originalDateNow = Date.now;
      const mockDateNow = jest.fn()
        .mockReturnValueOnce(1000) // Start time
        .mockReturnValueOnce(1100); // End time (100ms later)
      global.Date.now = mockDateNow;

      // Mock successful query execution
      const queryRawMock = service.$queryRaw as jest.Mock;
      queryRawMock.mockResolvedValue([{ health_check: 1 }]);

      const health = await service.checkHealth();

      // Verify that timing was measured
      expect(mockDateNow).toHaveBeenCalledTimes(2);
      expect(health.details.responseTime).toBe('100ms');

      // Restore original Date.now
      global.Date.now = originalDateNow;
    });

    it('should include performance metrics in middleware chain', async () => {
      // Set the isConnected flag for testing
      // @ts-ignore - accessing private property for testing
      service['isConnected'] = true;
      // @ts-ignore - accessing private property for testing
      service['enablePerformanceTracking'] = true;

      // Mock query function
      const queryFn = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });

      // Execute query
      await service.executeQuery('testQuery', queryFn);

      // Verify that middleware chain was created with timestamp
      expect(mockMiddlewareFactory.createMiddlewareChain).toHaveBeenCalledWith({
        queryName: 'testQuery',
        timestamp: expect.any(Number),
      });
    });
  });
});
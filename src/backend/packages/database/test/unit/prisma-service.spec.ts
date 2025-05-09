import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService, PrismaServiceOptions } from '../../src/prisma.service';
import { ConnectionManager } from '../../src/connection/connection-manager';
import { ErrorTransformer } from '../../src/errors/error-transformer';
import { DatabaseException } from '../../src/errors/database-error.exception';
import { DatabaseErrorType } from '../../src/errors/database-error.types';
import { TransactionService } from '../../src/transactions/transaction.service';
import { TransactionIsolationLevel } from '../../src/types/transaction.types';
import { JourneyType } from '../../src/types/journey.types';
import { MiddlewareRegistry } from '../../src/middleware/middleware.registry';
import { MiddlewareFactory } from '../../src/middleware/middleware.factory';
import { Prisma, PrismaClient } from '@prisma/client';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const originalModule = jest.requireActual('@prisma/client');
  
  // Create a mock PrismaClient class
  const mockPrismaClient = jest.fn().mockImplementation(() => ({
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }]),
    $executeRaw: jest.fn().mockResolvedValue({ count: 1 }),
    $transaction: jest.fn().mockImplementation((fn) => fn()),
    $use: jest.fn(),
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: 1, name: 'Test User' }),
      findMany: jest.fn().mockResolvedValue([{ id: 1, name: 'Test User' }]),
      create: jest.fn().mockResolvedValue({ id: 1, name: 'Test User' }),
      update: jest.fn().mockResolvedValue({ id: 1, name: 'Test User' }),
      delete: jest.fn().mockResolvedValue({ id: 1, name: 'Test User' }),
    },
    // Add other models as needed
  }));
  
  return {
    ...originalModule,
    PrismaClient: mockPrismaClient,
  };
});

// Mock ConnectionManager
jest.mock('../../src/connection/connection-manager', () => {
  return {
    ConnectionManager: jest.fn().mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      shutdown: jest.fn().mockResolvedValue(undefined),
      getConnection: jest.fn().mockResolvedValue({}),
      releaseConnection: jest.fn(),
      getPool: jest.fn().mockReturnValue({
        getTotalConnectionCount: jest.fn().mockReturnValue(5),
        getActiveConnectionCount: jest.fn().mockReturnValue(2),
        getIdleConnectionCount: jest.fn().mockReturnValue(3),
        getWaitingRequestCount: jest.fn().mockReturnValue(0),
      }),
    })),
  };
});

// Mock ErrorTransformer
jest.mock('../../src/errors/error-transformer', () => {
  return {
    ErrorTransformer: {
      transformPrismaError: jest.fn().mockImplementation((error) => {
        if (error instanceof DatabaseException) {
          return error;
        }
        return new DatabaseException(
          'Transformed error',
          DatabaseErrorType.QUERY,
          'DB_TEST_001',
          'major',
          'permanent',
          { operation: 'test' },
          error
        );
      }),
    },
  };
});

// Mock TransactionService
jest.mock('../../src/transactions/transaction.service', () => {
  return {
    TransactionService: jest.fn().mockImplementation(() => ({
      startTransaction: jest.fn().mockResolvedValue({}),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

// Mock MiddlewareRegistry
jest.mock('../../src/middleware/middleware.registry', () => {
  return {
    MiddlewareRegistry: jest.fn().mockImplementation(() => ({
      executeWithMiddleware: jest.fn().mockImplementation((journeyContext, params, context, next) => next(params)),
    })),
  };
});

// Mock MiddlewareFactory
jest.mock('../../src/middleware/middleware.factory', () => {
  return {
    MiddlewareFactory: jest.fn().mockImplementation(() => ({
      createLoggingMiddleware: jest.fn(),
      createPerformanceMiddleware: jest.fn(),
      createCircuitBreakerMiddleware: jest.fn(),
      createTransformationMiddleware: jest.fn(),
      createStandardMiddlewareChain: jest.fn(),
    })),
  };
});

// Mock child_process.exec
jest.mock('child_process', () => {
  return {
    exec: jest.fn(),
  };
});

describe('PrismaService', () => {
  let service: PrismaService;
  let mockConnectionManager: jest.Mocked<ConnectionManager>;
  let mockTransactionService: jest.Mocked<TransactionService>;
  let mockMiddlewareRegistry: jest.Mocked<MiddlewareRegistry>;
  let mockMiddlewareFactory: jest.Mocked<MiddlewareFactory>;
  
  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => {
              if (key === 'database.url') return 'postgresql://user:password@localhost:5432/test';
              if (key === 'database.pool.min') return 2;
              if (key === 'database.pool.max') return 10;
              return undefined;
            }),
          },
        },
      ],
    }).compile();
    
    service = module.get<PrismaService>(PrismaService);
    
    // Get the mocked instances
    mockConnectionManager = service['connectionManager'] as unknown as jest.Mocked<ConnectionManager>;
    mockTransactionService = new TransactionService(service) as unknown as jest.Mocked<TransactionService>;
    mockMiddlewareRegistry = service['middlewareRegistry'] as unknown as jest.Mocked<MiddlewareRegistry>;
    mockMiddlewareFactory = service['middlewareFactory'] as unknown as jest.Mocked<MiddlewareFactory>;
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  });
  
  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
    
    it('should initialize with default options when none provided', () => {
      const defaultService = new PrismaService();
      expect(defaultService).toBeDefined();
      expect(defaultService['options']).toBeDefined();
      expect(defaultService['options'].enableLogging).toBeDefined();
    });
    
    it('should initialize with custom options when provided', () => {
      const customOptions: PrismaServiceOptions = {
        journeyType: JourneyType.HEALTH,
        enableLogging: false,
        connectionPool: {
          minConnections: 5,
          maxConnections: 20,
        },
      };
      
      const customService = new PrismaService(customOptions);
      expect(customService).toBeDefined();
      expect(customService['options'].journeyType).toBe(JourneyType.HEALTH);
      expect(customService['options'].enableLogging).toBe(false);
      expect(customService['options'].connectionPool?.minConnections).toBe(5);
      expect(customService['options'].connectionPool?.maxConnections).toBe(20);
    });
    
    it('should register middleware during initialization', () => {
      expect(service['middlewareRegistry']).toBeDefined();
      expect(service['middlewareFactory']).toBeDefined();
      expect(PrismaClient.prototype.$use).toHaveBeenCalled();
    });
  });
  
  describe('onModuleInit', () => {
    it('should connect to the database during initialization', async () => {
      await service.onModuleInit();
      
      expect(PrismaClient.prototype.$connect).toHaveBeenCalled();
      expect(service['isInitialized']).toBe(true);
    });
    
    it('should initialize the connection manager if not already initialized', async () => {
      service['connectionManager'] = undefined;
      await service.onModuleInit();
      
      expect(ConnectionManager).toHaveBeenCalled();
      expect(service['connectionManager']).toBeDefined();
      expect(mockConnectionManager?.initialize).toHaveBeenCalled();
    });
    
    it('should apply migrations if configured', async () => {
      service['options'].autoApplyMigrations = true;
      const spyApplyMigrations = jest.spyOn(service, 'applyMigrations').mockResolvedValue();
      
      await service.onModuleInit();
      
      expect(spyApplyMigrations).toHaveBeenCalled();
    });
    
    it('should handle errors during initialization', async () => {
      jest.spyOn(PrismaClient.prototype, '$connect').mockRejectedValue(new Error('Connection error'));
      
      await expect(service.onModuleInit()).rejects.toThrow(DatabaseException);
      expect(service['isInitialized']).toBe(false);
    });
  });
  
  describe('onModuleDestroy', () => {
    it('should disconnect from the database during shutdown', async () => {
      await service.onModuleDestroy();
      
      expect(PrismaClient.prototype.$disconnect).toHaveBeenCalled();
      expect(service['isShuttingDown']).toBe(true);
    });
    
    it('should shutdown the connection manager if initialized', async () => {
      service['connectionManager'] = new ConnectionManager() as unknown as ConnectionManager;
      await service.onModuleDestroy();
      
      expect(mockConnectionManager?.shutdown).toHaveBeenCalled();
    });
    
    it('should handle errors during shutdown', async () => {
      jest.spyOn(PrismaClient.prototype, '$disconnect').mockRejectedValue(new Error('Disconnect error'));
      const loggerSpy = jest.spyOn(service['logger'], 'error');
      
      await service.onModuleDestroy();
      
      expect(loggerSpy).toHaveBeenCalledWith('Error during PrismaService shutdown', expect.any(Error));
    });
  });
  
  describe('applyMigrations', () => {
    it('should execute prisma migrate deploy command', async () => {
      const { exec } = require('child_process');
      exec.mockImplementation((cmd, callback) => {
        callback(null, { stdout: 'Migration applied', stderr: '' });
      });
      
      await service.applyMigrations();
      
      expect(exec).toHaveBeenCalledWith('npx prisma migrate deploy', expect.any(Function));
    });
    
    it('should handle migration errors', async () => {
      const { exec } = require('child_process');
      exec.mockImplementation((cmd, callback) => {
        callback(new Error('Migration failed'), { stdout: '', stderr: 'Error' });
      });
      
      await expect(service.applyMigrations()).rejects.toThrow(DatabaseException);
    });
  });
  
  describe('$executeInTransaction', () => {
    it('should execute a function within a transaction', async () => {
      const fn = jest.fn().mockResolvedValue({ result: 'success' });
      
      const result = await service.$executeInTransaction(fn);
      
      expect(result).toEqual({ result: 'success' });
      expect(mockTransactionService.startTransaction).toHaveBeenCalled();
      expect(mockTransactionService.commitTransaction).toHaveBeenCalled();
      expect(mockTransactionService.rollbackTransaction).not.toHaveBeenCalled();
    });
    
    it('should rollback transaction on error', async () => {
      const error = new Error('Transaction error');
      const fn = jest.fn().mockRejectedValue(error);
      
      await expect(service.$executeInTransaction(fn)).rejects.toThrow('Transaction error');
      
      expect(mockTransactionService.startTransaction).toHaveBeenCalled();
      expect(mockTransactionService.commitTransaction).not.toHaveBeenCalled();
      expect(mockTransactionService.rollbackTransaction).toHaveBeenCalled();
    });
    
    it('should use specified isolation level', async () => {
      const fn = jest.fn().mockResolvedValue({ result: 'success' });
      
      await service.$executeInTransaction(fn, {
        isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
      });
      
      expect(mockTransactionService.startTransaction).toHaveBeenCalledWith({
        isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
        timeout: 5000,
        maxRetries: 3,
      });
    });
    
    it('should transform errors using ErrorTransformer', async () => {
      const error = new Error('Original error');
      const fn = jest.fn().mockRejectedValue(error);
      
      // Mock the errorTransformer
      service['errorTransformer'] = {
        transformPrismaError: jest.fn().mockReturnValue(new DatabaseException(
          'Transformed error',
          DatabaseErrorType.TRANSACTION,
          'DB_TRANS_001',
          'major',
          'permanent',
          { operation: 'transaction' },
          error
        )),
      } as any;
      
      await expect(service.$executeInTransaction(fn)).rejects.toThrow(DatabaseException);
      expect(service['errorTransformer'].transformPrismaError).toHaveBeenCalledWith(error);
    });
  });
  
  describe('executeWithRetry', () => {
    it('should execute an operation successfully', async () => {
      const operation = jest.fn().mockResolvedValue({ result: 'success' });
      
      const result = await service.executeWithRetry(operation);
      
      expect(result).toEqual({ result: 'success' });
      expect(operation).toHaveBeenCalledTimes(1);
    });
    
    it('should retry transient errors', async () => {
      const transientError = new Error('Transient error');
      const operation = jest.fn()
        .mockRejectedValueOnce(transientError)
        .mockRejectedValueOnce(transientError)
        .mockResolvedValueOnce({ result: 'success' });
      
      // Mock isRetryableError to return true
      jest.spyOn(service as any, 'isRetryableError').mockReturnValue(true);
      
      const result = await service.executeWithRetry(operation, {
        maxRetries: 3,
        baseDelay: 10, // Small delay for tests
      });
      
      expect(result).toEqual({ result: 'success' });
      expect(operation).toHaveBeenCalledTimes(3);
    });
    
    it('should not retry permanent errors', async () => {
      const permanentError = new Error('Permanent error');
      const operation = jest.fn().mockRejectedValue(permanentError);
      
      // Mock isRetryableError to return false
      jest.spyOn(service as any, 'isRetryableError').mockReturnValue(false);
      
      await expect(service.executeWithRetry(operation)).rejects.toThrow('Permanent error');
      expect(operation).toHaveBeenCalledTimes(1);
    });
    
    it('should give up after max retries', async () => {
      const transientError = new Error('Transient error');
      const operation = jest.fn().mockRejectedValue(transientError);
      
      // Mock isRetryableError to return true
      jest.spyOn(service as any, 'isRetryableError').mockReturnValue(true);
      
      await expect(service.executeWithRetry(operation, {
        maxRetries: 2,
        baseDelay: 10, // Small delay for tests
      })).rejects.toThrow('Transient error');
      
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
    
    it('should transform errors using ErrorTransformer', async () => {
      const error = new Error('Original error');
      const operation = jest.fn().mockRejectedValue(error);
      
      // Mock isRetryableError to return false
      jest.spyOn(service as any, 'isRetryableError').mockReturnValue(false);
      
      // Mock the errorTransformer
      service['errorTransformer'] = {
        transformPrismaError: jest.fn().mockReturnValue(new DatabaseException(
          'Transformed error',
          DatabaseErrorType.QUERY,
          'DB_QUERY_001',
          'major',
          'permanent',
          { operation: 'query' },
          error
        )),
      } as any;
      
      await expect(service.executeWithRetry(operation)).rejects.toThrow(DatabaseException);
      expect(service['errorTransformer'].transformPrismaError).toHaveBeenCalledWith(error);
    });
  });
  
  describe('isRetryableError', () => {
    it('should identify connection errors as retryable', () => {
      const connectionError = new Prisma.PrismaClientKnownRequestError(
        'Connection error',
        { code: 'P1001', clientVersion: '4.0.0' }
      );
      
      const result = service['isRetryableError'](connectionError);
      
      expect(result).toBe(true);
    });
    
    it('should identify timeout errors as retryable', () => {
      const timeoutError = new Prisma.PrismaClientKnownRequestError(
        'Timeout error',
        { code: 'P1008', clientVersion: '4.0.0' }
      );
      
      const result = service['isRetryableError'](timeoutError);
      
      expect(result).toBe(true);
    });
    
    it('should identify database exceptions with CONNECTION type as retryable', () => {
      const dbError = new DatabaseException(
        'Connection error',
        DatabaseErrorType.CONNECTION,
        'DB_CONN_001',
        'critical',
        'transient'
      );
      
      const result = service['isRetryableError'](dbError);
      
      expect(result).toBe(true);
    });
    
    it('should identify errors with specific messages as retryable', () => {
      const messageError = new Error('connection reset by peer');
      
      const result = service['isRetryableError'](messageError);
      
      expect(result).toBe(true);
    });
    
    it('should identify non-retryable errors', () => {
      const validationError = new Prisma.PrismaClientValidationError(
        'Validation error',
        { clientVersion: '4.0.0' }
      );
      
      const result = service['isRetryableError'](validationError);
      
      expect(result).toBe(false);
    });
  });
  
  describe('registerMiddleware', () => {
    it('should register middleware based on configuration', () => {
      service['options'].enableLogging = true;
      service['options'].enablePerformanceTracking = true;
      service['options'].enableCircuitBreaker = true;
      service['options'].enableTransformation = true;
      
      service['registerMiddleware']();
      
      expect(mockMiddlewareFactory.createLoggingMiddleware).toHaveBeenCalled();
      expect(mockMiddlewareFactory.createPerformanceMiddleware).toHaveBeenCalled();
      expect(mockMiddlewareFactory.createCircuitBreakerMiddleware).toHaveBeenCalled();
      expect(mockMiddlewareFactory.createTransformationMiddleware).toHaveBeenCalled();
    });
    
    it('should create journey-specific middleware if journeyType is specified', () => {
      service['options'].journeyType = JourneyType.HEALTH;
      
      service['registerMiddleware']();
      
      expect(mockMiddlewareFactory.createStandardMiddlewareChain).toHaveBeenCalledWith('health');
    });
    
    it('should register middleware with Prisma', () => {
      service['registerMiddleware']();
      
      expect(PrismaClient.prototype.$use).toHaveBeenCalled();
    });
  });
  
  describe('getJourneyContextFromType', () => {
    it('should return the correct journey context for HEALTH', () => {
      const result = service['getJourneyContextFromType'](JourneyType.HEALTH);
      expect(result).toBe('health');
    });
    
    it('should return the correct journey context for CARE', () => {
      const result = service['getJourneyContextFromType'](JourneyType.CARE);
      expect(result).toBe('care');
    });
    
    it('should return the correct journey context for PLAN', () => {
      const result = service['getJourneyContextFromType'](JourneyType.PLAN);
      expect(result).toBe('plan');
    });
    
    it('should return global for unknown journey types', () => {
      const result = service['getJourneyContextFromType']('UNKNOWN' as JourneyType);
      expect(result).toBe('global');
    });
    
    it('should return undefined if no journey type is provided', () => {
      const result = service['getJourneyContextFromType'](undefined);
      expect(result).toBeUndefined();
    });
  });
  
  describe('getJourneyContextFromParams', () => {
    it('should return the correct journey context for health models', () => {
      const params = { model: 'HealthMetric' };
      const result = service['getJourneyContextFromParams'](params);
      expect(result).toBe('health');
    });
    
    it('should return the correct journey context for care models', () => {
      const params = { model: 'Appointment' };
      const result = service['getJourneyContextFromParams'](params);
      expect(result).toBe('care');
    });
    
    it('should return the correct journey context for plan models', () => {
      const params = { model: 'Plan' };
      const result = service['getJourneyContextFromParams'](params);
      expect(result).toBe('plan');
    });
    
    it('should return undefined for unknown models', () => {
      const params = { model: 'UnknownModel' };
      const result = service['getJourneyContextFromParams'](params);
      expect(result).toBeUndefined();
    });
    
    it('should return undefined if no model is provided', () => {
      const params = {};
      const result = service['getJourneyContextFromParams'](params);
      expect(result).toBeUndefined();
    });
  });
  
  describe('getConnection', () => {
    it('should get a connection from the connection manager', async () => {
      const connection = await service.getConnection();
      
      expect(mockConnectionManager.getConnection).toHaveBeenCalled();
      expect(connection).toBeDefined();
    });
    
    it('should throw an error if connection manager is not initialized', async () => {
      service['connectionManager'] = undefined;
      
      await expect(service.getConnection()).rejects.toThrow(DatabaseException);
    });
  });
  
  describe('releaseConnection', () => {
    it('should release a connection back to the pool', () => {
      const connection = {};
      
      service.releaseConnection(connection);
      
      expect(mockConnectionManager.releaseConnection).toHaveBeenCalledWith(connection);
    });
    
    it('should log a warning if connection manager is not initialized', () => {
      service['connectionManager'] = undefined;
      const loggerSpy = jest.spyOn(service['logger'], 'warn');
      
      service.releaseConnection({});
      
      expect(loggerSpy).toHaveBeenCalledWith('Connection manager not initialized, cannot release connection');
    });
  });
  
  describe('checkHealth', () => {
    it('should return healthy status when database is connected', async () => {
      const result = await service.checkHealth();
      
      expect(result.healthy).toBe(true);
      expect(PrismaClient.prototype.$queryRaw).toHaveBeenCalled();
    });
    
    it('should check connection pool health if available', async () => {
      service['connectionManager'] = {
        getPool: jest.fn().mockReturnValue({
          getTotalConnectionCount: jest.fn().mockReturnValue(5),
          getActiveConnectionCount: jest.fn().mockReturnValue(2),
          getIdleConnectionCount: jest.fn().mockReturnValue(3),
          getWaitingRequestCount: jest.fn().mockReturnValue(0),
        }),
      } as any;
      
      const result = await service.checkHealth();
      
      expect(result.healthy).toBe(true);
      expect(service['connectionManager'].getPool).toHaveBeenCalled();
    });
    
    it('should return unhealthy status when database check fails', async () => {
      jest.spyOn(PrismaClient.prototype, '$queryRaw').mockRejectedValue(new Error('Database error'));
      
      const result = await service.checkHealth();
      
      expect(result.healthy).toBe(false);
      expect(result.details).toBeDefined();
      expect(result.details.error).toBe('Database error');
    });
  });
  
  describe('getConnectionStats', () => {
    it('should return connection statistics from the connection manager', () => {
      const stats = service.getConnectionStats();
      
      expect(stats).toEqual({
        total: 5,
        active: 2,
        idle: 3,
        waiting: 0,
      });
      expect(mockConnectionManager.getPool).toHaveBeenCalled();
    });
    
    it('should return zero stats if connection manager is not initialized', () => {
      service['connectionManager'] = undefined;
      
      const stats = service.getConnectionStats();
      
      expect(stats).toEqual({
        total: 0,
        active: 0,
        idle: 0,
        waiting: 0,
      });
    });
    
    it('should return zero stats if pool is not available', () => {
      service['connectionManager'] = {
        getPool: jest.fn().mockReturnValue(null),
      } as any;
      
      const stats = service.getConnectionStats();
      
      expect(stats).toEqual({
        total: 0,
        active: 0,
        idle: 0,
        waiting: 0,
      });
    });
  });
});
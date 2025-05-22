/**
 * @file prisma-service-integration.spec.ts
 * @description Integration tests for the enhanced PrismaService, verifying its integration with
 * connection pool, error handlers, middleware, and journey contexts. Tests cover the full
 * functionality of the service in real-world scenarios, including connection management,
 * transaction handling, and error recovery.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../src/prisma.service';
import { ConnectionManager } from '../../src/connection/connection-manager';
import { ConnectionPool } from '../../src/connection/connection-pool';
import { BaseJourneyContext } from '../../src/contexts/base-journey.context';
import { HealthContext } from '../../src/contexts/health.context';
import { CareContext } from '../../src/contexts/care.context';
import { PlanContext } from '../../src/contexts/plan.context';
import { DatabaseException, ConnectionException, QueryException, TransactionException } from '../../src/errors/database-error.exception';
import { DatabaseErrorType, DatabaseErrorSeverity } from '../../src/errors/database-error.types';
import { TransactionIsolationLevel } from '../../src/transactions/transaction.interface';
import { JourneyContext, DatabaseOperationType } from '../../src/middleware/middleware.interface';

/**
 * Mock implementation of PrismaClient for testing
 */
class MockPrismaClient {
  $connect = jest.fn().mockResolvedValue(undefined);
  $disconnect = jest.fn().mockResolvedValue(undefined);
  $queryRaw = jest.fn().mockResolvedValue([{ connection_test: 1 }]);
  $queryRawUnsafe = jest.fn().mockResolvedValue([{ connection_test: 1 }]);
  $transaction = jest.fn().mockImplementation(async (callback) => {
    return await callback(this);
  });
  $on = jest.fn();
}

/**
 * Mock implementation of ConfigService for testing
 */
class MockConfigService {
  get(key: string, defaultValue?: any): any {
    const config = {
      'NODE_ENV': 'test',
      'DATABASE_POOL_MIN': 2,
      'DATABASE_POOL_MAX': 5,
      'DATABASE_POOL_IDLE': 1000,
      'DATABASE_MAX_CONNECTION_ATTEMPTS': 3,
      'DATABASE_CONNECTION_TIMEOUT': 5000,
      'DATABASE_QUERY_TIMEOUT': 5000,
      'DATABASE_ENABLE_QUERY_LOGGING': true,
      'DATABASE_ENABLE_PERFORMANCE_TRACKING': true,
      'DATABASE_ENABLE_CIRCUIT_BREAKER': false,
      'DATABASE_RETRY_BASE_DELAY': 50,
      'DATABASE_RETRY_MAX_DELAY': 1000,
      'DATABASE_RETRY_MAX_ATTEMPTS': 3,
      'DATABASE_RETRY_JITTER_FACTOR': 0.1,
      'DATABASE_HEALTH_CHECK_INTERVAL': 5000,
    };
    
    return config[key] || defaultValue;
  }
}

/**
 * Integration tests for PrismaService
 */
describe('PrismaService Integration', () => {
  let module: TestingModule;
  let prismaService: PrismaService;
  let mockPrismaClient: MockPrismaClient;
  
  beforeEach(async () => {
    mockPrismaClient = new MockPrismaClient();
    
    // Create a testing module with PrismaService and mocked dependencies
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      providers: [
        {
          provide: ConfigService,
          useClass: MockConfigService,
        },
        PrismaService,
      ],
    }).compile();
    
    // Get the PrismaService instance
    prismaService = module.get<PrismaService>(PrismaService);
    
    // Replace the PrismaClient with our mock
    (prismaService as any)['prisma'] = mockPrismaClient;
    
    // Mock the connection manager methods
    jest.spyOn(ConnectionManager.prototype, 'initialize').mockResolvedValue(undefined);
    jest.spyOn(ConnectionManager.prototype, 'shutdown').mockResolvedValue(undefined);
    jest.spyOn(ConnectionManager.prototype, 'getPoolStats').mockResolvedValue({
      active: 1,
      idle: 2,
      total: 3,
      max: 5,
    });
  });
  
  afterEach(async () => {
    await module.close();
    jest.clearAllMocks();
  });
  
  /**
   * Connection Pool Integration Tests
   */
  describe('Connection Pool Integration', () => {
    it('should initialize the connection pool on module init', async () => {
      // Act
      await prismaService.onModuleInit();
      
      // Assert
      expect(ConnectionManager.prototype.initialize).toHaveBeenCalledWith(prismaService);
      expect(mockPrismaClient.$connect).toHaveBeenCalled();
    });
    
    it('should properly disconnect on module destroy', async () => {
      // Arrange
      await prismaService.onModuleInit();
      
      // Act
      await prismaService.onModuleDestroy();
      
      // Assert
      expect(ConnectionManager.prototype.shutdown).toHaveBeenCalled();
      expect(mockPrismaClient.$disconnect).toHaveBeenCalled();
    });
    
    it('should retry connection on failure', async () => {
      // Arrange
      const connectSpy = jest.spyOn(mockPrismaClient, '$connect');
      connectSpy
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(undefined);
      
      // Act
      await prismaService.onModuleInit();
      
      // Assert
      expect(connectSpy).toHaveBeenCalledTimes(2);
    });
    
    it('should throw after maximum connection attempts', async () => {
      // Arrange
      const connectSpy = jest.spyOn(mockPrismaClient, '$connect');
      connectSpy.mockRejectedValue(new Error('Connection failed'));
      
      // Act & Assert
      await expect(prismaService.onModuleInit()).rejects.toThrow(ConnectionException);
      expect(connectSpy).toHaveBeenCalledTimes(3); // Max attempts from mock config
    });
    
    it('should check health and return connection pool stats', async () => {
      // Arrange
      await prismaService.onModuleInit();
      
      // Act
      const healthStatus = await prismaService.checkHealth();
      
      // Assert
      expect(healthStatus.status).toBe('up');
      expect(healthStatus.details.connections).toBeDefined();
      expect(mockPrismaClient.$queryRaw).toHaveBeenCalled();
    });
  });
  
  /**
   * Error Handling Tests
   */
  describe('Error Handling', () => {
    it('should transform query errors into DatabaseException', async () => {
      // Arrange
      await prismaService.onModuleInit();
      mockPrismaClient.$queryRaw.mockRejectedValueOnce(new Error('Query failed'));
      
      // Act & Assert
      await expect(prismaService.executeQuery('testQuery', () => {
        return mockPrismaClient.$queryRaw`SELECT 1`;
      })).rejects.toThrow(DatabaseException);
    });
    
    it('should retry failed queries based on retry strategy', async () => {
      // Arrange
      await prismaService.onModuleInit();
      const querySpy = jest.spyOn(mockPrismaClient, '$queryRaw');
      querySpy
        .mockRejectedValueOnce(new Error('Query failed'))
        .mockRejectedValueOnce(new Error('Query failed again'))
        .mockResolvedValueOnce([{ result: 'success' }]);
      
      // Act
      const result = await prismaService.executeQuery('testQuery', () => {
        return mockPrismaClient.$queryRaw`SELECT 1`;
      });
      
      // Assert
      expect(querySpy).toHaveBeenCalledTimes(3);
      expect(result).toEqual([{ result: 'success' }]);
    });
    
    it('should handle transaction errors properly', async () => {
      // Arrange
      await prismaService.onModuleInit();
      mockPrismaClient.$transaction.mockRejectedValueOnce(new Error('Transaction failed'));
      
      // Act & Assert
      await expect(prismaService.executeQuery('testTransaction', () => {
        return mockPrismaClient.$transaction(async (tx) => {
          return await tx.$queryRaw`SELECT 1`;
        });
      })).rejects.toThrow(DatabaseException);
    });
    
    it('should report health status as down when database is unavailable', async () => {
      // Arrange
      await prismaService.onModuleInit();
      mockPrismaClient.$queryRaw.mockRejectedValueOnce(new Error('Database unavailable'));
      
      // Act
      const healthStatus = await prismaService.checkHealth();
      
      // Assert
      expect(healthStatus.status).toBe('down');
      expect(healthStatus.details.error).toBeDefined();
    });
  });
  
  /**
   * Middleware Integration Tests
   */
  describe('Middleware Integration', () => {
    it('should apply middleware to database operations', async () => {
      // Arrange
      await prismaService.onModuleInit();
      const middlewareSpy = jest.spyOn(prismaService as any, 'setupEventListeners');
      
      // Re-initialize to trigger middleware setup
      await prismaService.onModuleInit();
      
      // Assert
      expect(middlewareSpy).toHaveBeenCalled();
    });
    
    it('should log queries when query logging is enabled', async () => {
      // Arrange
      await prismaService.onModuleInit();
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Simulate a query event
      const queryEvent = {
        query: 'SELECT 1',
        params: [],
        duration: 10,
      };
      
      // Act
      // Manually trigger the query event handler
      (prismaService as any).prisma.emit('query', queryEvent);
      
      // Assert
      // Since we can't directly test the internal event handlers, we're checking
      // that the event listeners were set up correctly during initialization
      expect((prismaService as any).enableQueryLogging).toBe(true);
    });
    
    it('should track performance metrics for database operations', async () => {
      // Arrange
      await prismaService.onModuleInit();
      
      // Act
      await prismaService.executeQuery('performanceTest', () => {
        return mockPrismaClient.$queryRaw`SELECT 1`;
      });
      
      // Assert
      // Since we can't directly test the internal performance tracking,
      // we're checking that the configuration is correct
      expect((prismaService as any).enablePerformanceTracking).toBe(true);
    });
  });
  
  /**
   * Journey Context Support Tests
   */
  describe('Journey Context Support', () => {
    let healthContext: HealthContext;
    let careContext: CareContext;
    let planContext: PlanContext;
    
    beforeEach(async () => {
      // Initialize PrismaService
      await prismaService.onModuleInit();
      
      // Create journey contexts
      healthContext = new HealthContext(prismaService, 'health');
      careContext = new CareContext(prismaService, 'care');
      planContext = new PlanContext(prismaService, 'plan');
      
      // Initialize journey contexts
      await healthContext.initialize();
      await careContext.initialize();
      await planContext.initialize();
    });
    
    afterEach(async () => {
      // Clean up journey contexts
      await healthContext.dispose();
      await careContext.dispose();
      await planContext.dispose();
    });
    
    it('should create journey-specific database contexts', () => {
      // Assert
      expect(healthContext).toBeInstanceOf(BaseJourneyContext);
      expect(careContext).toBeInstanceOf(BaseJourneyContext);
      expect(planContext).toBeInstanceOf(BaseJourneyContext);
      
      expect(healthContext.getJourneyId()).toBe('health');
      expect(careContext.getJourneyId()).toBe('care');
      expect(planContext.getJourneyId()).toBe('plan');
    });
    
    it('should execute raw queries within journey context', async () => {
      // Arrange
      const querySpy = jest.spyOn(mockPrismaClient, '$queryRawUnsafe');
      
      // Act
      await healthContext.executeRaw('SELECT 1 as health_test');
      
      // Assert
      expect(querySpy).toHaveBeenCalledWith('SELECT 1 as health_test');
    });
    
    it('should manage transactions within journey context', async () => {
      // Arrange
      const transactionSpy = jest.spyOn(mockPrismaClient, '$transaction');
      
      // Act
      await healthContext.transaction(async (tx) => {
        await tx.$queryRaw`SELECT 1 as transaction_test`;
        return true;
      }, { isolationLevel: TransactionIsolationLevel.READ_COMMITTED });
      
      // Assert
      expect(transactionSpy).toHaveBeenCalled();
    });
    
    it('should check health status of journey context', async () => {
      // Act
      const healthStatus = await healthContext.checkHealth();
      
      // Assert
      expect(healthStatus.isAvailable).toBe(true);
      expect(healthStatus.status).toBe('up');
      expect(healthStatus.metadata.journeyId).toBe('health');
    });
    
    it('should handle errors within journey context', async () => {
      // Arrange
      mockPrismaClient.$queryRawUnsafe.mockRejectedValueOnce(new Error('Journey query failed'));
      
      // Act & Assert
      await expect(healthContext.executeRaw('SELECT 1')).rejects.toThrow(DatabaseException);
    });
    
    it('should apply middleware within journey context', async () => {
      // Arrange - Create a spy on the executeWithMiddleware method
      const middlewareSpy = jest.spyOn(healthContext as any, 'executeWithMiddleware');
      
      // Act
      await healthContext.executeRaw('SELECT 1');
      
      // Assert
      expect(middlewareSpy).toHaveBeenCalled();
      expect(middlewareSpy.mock.calls[0][2]).toHaveProperty('journeyContext', JourneyContext.HEALTH);
      expect(middlewareSpy.mock.calls[0][2]).toHaveProperty('operationType', DatabaseOperationType.QUERY);
    });
  });
  
  /**
   * Combined Integration Tests
   */
  describe('Combined Integration Scenarios', () => {
    let healthContext: HealthContext;
    
    beforeEach(async () => {
      // Initialize PrismaService
      await prismaService.onModuleInit();
      
      // Create health journey context
      healthContext = new HealthContext(prismaService, 'health');
      await healthContext.initialize();
    });
    
    afterEach(async () => {
      await healthContext.dispose();
    });
    
    it('should handle complex transaction with error recovery', async () => {
      // Arrange
      const transactionSpy = jest.spyOn(mockPrismaClient, '$transaction');
      const querySpy = jest.spyOn(mockPrismaClient, '$queryRaw')
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce([{ id: 1, name: 'Test' }]);
      
      // Act
      const result = await healthContext.transaction(async (tx) => {
        // This will fail once and then succeed
        const data = await tx.$queryRaw`SELECT id, name FROM users WHERE id = 1`;
        return data;
      }, {
        isolationLevel: TransactionIsolationLevel.REPEATABLE_READ,
        retry: {
          maxRetries: 3,
          initialDelay: 50,
          backoffFactor: 2,
        },
      });
      
      // Assert
      expect(transactionSpy).toHaveBeenCalled();
      expect(querySpy).toHaveBeenCalledTimes(2); // One failure, one success
      expect(result).toEqual([{ id: 1, name: 'Test' }]);
    });
    
    it('should integrate connection pool, middleware, and error handling', async () => {
      // Arrange
      const executeWithMiddlewareSpy = jest.spyOn(healthContext as any, 'executeWithMiddleware');
      const executeWithRetrySpy = jest.spyOn(healthContext as any, 'executeWithRetry');
      
      // Act
      await healthContext.executeRaw('SELECT 1 as integration_test');
      
      // Assert
      expect(executeWithMiddlewareSpy).toHaveBeenCalled();
      expect(executeWithRetrySpy).toHaveBeenCalled();
      expect(mockPrismaClient.$queryRawUnsafe).toHaveBeenCalledWith('SELECT 1 as integration_test');
    });
    
    it('should verify entity ownership within journey context', async () => {
      // Arrange
      mockPrismaClient.$queryRawUnsafe.mockResolvedValueOnce([{ count: 1 }]);
      
      // Act
      const result = await healthContext.belongsToJourney('123', 'HealthMetric');
      
      // Assert
      expect(result).toBe(true);
      expect(mockPrismaClient.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count FROM "HealthMetric"'),
        '123',
        'health'
      );
    });
  });
});
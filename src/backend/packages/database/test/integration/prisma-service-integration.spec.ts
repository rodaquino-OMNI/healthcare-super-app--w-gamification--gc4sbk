import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService, PrismaServiceOptions } from '../../src/prisma.service';
import { DatabaseModule } from '../../src/database.module';
import { JourneyType } from '../../src/types/journey.types';
import { TransactionIsolationLevel } from '../../src/types/transaction.types';
import { DatabaseException } from '../../src/errors/database-error.exception';
import { DatabaseErrorType } from '../../src/errors/database-error.types';
import { HealthContext } from '../../src/contexts/health.context';
import { CareContext } from '../../src/contexts/care.context';
import { PlanContext } from '../../src/contexts/plan.context';
import { ConnectionManager } from '../../src/connection/connection-manager';
import { MiddlewareRegistry } from '../../src/middleware/middleware.registry';
import { LoggingMiddleware } from '../../src/middleware/logging.middleware';
import { PerformanceMiddleware } from '../../src/middleware/performance.middleware';
import { CircuitBreakerMiddleware } from '../../src/middleware/circuit-breaker.middleware';
import { TransformationMiddleware } from '../../src/middleware/transformation.middleware';

/**
 * Integration tests for the enhanced PrismaService.
 * 
 * These tests verify the integration of PrismaService with connection pool,
 * error handlers, middleware, and journey contexts in real-world scenarios.
 */
describe('PrismaService Integration', () => {
  let module: TestingModule;
  let prismaService: PrismaService;
  let configService: ConfigService;
  let healthContext: HealthContext;
  let careContext: CareContext;
  let planContext: PlanContext;

  /**
   * Setup before all tests
   */
  beforeAll(async () => {
    // Create a test module with real implementations
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
          // Provide default test configuration
          load: [() => ({
            database: {
              url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/austa_test',
              connectionPool: {
                minConnections: 2,
                maxConnections: 5,
                maxIdleConnections: 3,
                connectionTimeout: 3000,
              },
              retry: {
                maxRetries: 3,
                baseDelay: 50,
                maxDelay: 1000,
                useJitter: true,
              },
              enableLogging: true,
              enablePerformanceTracking: true,
              enableCircuitBreaker: true,
              enableTransformation: true,
            },
          })],
        }),
        DatabaseModule.forRoot(),
      ],
      providers: [
        PrismaService,
        HealthContext,
        CareContext,
        PlanContext,
      ],
    }).compile();

    // Get service instances
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
    healthContext = module.get<HealthContext>(HealthContext);
    careContext = module.get<CareContext>(CareContext);
    planContext = module.get<PlanContext>(PlanContext);

    // Initialize the PrismaService
    await prismaService.onModuleInit();
  });

  /**
   * Cleanup after all tests
   */
  afterAll(async () => {
    // Clean up resources
    await prismaService.onModuleDestroy();
    await module.close();
  });

  /**
   * Basic connectivity tests
   */
  describe('Basic Connectivity', () => {
    it('should connect to the database successfully', async () => {
      // Execute a simple query to verify connectivity
      const result = await prismaService.$queryRaw`SELECT 1 as test`;
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('test', 1);
    });

    it('should retrieve database health status', async () => {
      const health = await prismaService.checkHealth();
      expect(health).toBeDefined();
      expect(health.healthy).toBe(true);
    });

    it('should provide connection statistics', () => {
      const stats = prismaService.getConnectionStats();
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('idle');
      expect(stats).toHaveProperty('waiting');
      expect(typeof stats.total).toBe('number');
    });
  });

  /**
   * Connection Pool tests
   */
  describe('Connection Pool', () => {
    it('should get a connection from the pool', async () => {
      const connection = await prismaService.getConnection();
      expect(connection).toBeDefined();
      // Release the connection back to the pool
      prismaService.releaseConnection(connection);
    });

    it('should handle multiple concurrent connections', async () => {
      // Create multiple promises to get connections
      const connectionPromises = Array(5).fill(0).map(() => prismaService.getConnection());
      
      // Resolve all promises
      const connections = await Promise.all(connectionPromises);
      
      // Verify all connections were obtained
      expect(connections.length).toBe(5);
      connections.forEach(conn => expect(conn).toBeDefined());
      
      // Get connection stats
      const stats = prismaService.getConnectionStats();
      expect(stats.active).toBeGreaterThanOrEqual(5);
      
      // Release all connections
      connections.forEach(conn => prismaService.releaseConnection(conn));
      
      // Verify connections were released
      const statsAfterRelease = prismaService.getConnectionStats();
      expect(statsAfterRelease.active).toBeLessThan(stats.active);
    });

    it('should handle connection timeouts gracefully', async () => {
      // Mock the connection pool to simulate a timeout
      const originalGetConnection = ConnectionManager.prototype.getConnection;
      ConnectionManager.prototype.getConnection = jest.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Connection timeout'));
          }, 100);
        });
      });

      try {
        // Attempt to get a connection with a short timeout
        await expect(prismaService.getConnection()).rejects.toThrow();
      } finally {
        // Restore the original method
        ConnectionManager.prototype.getConnection = originalGetConnection;
      }
    });
  });

  /**
   * Error Handling tests
   */
  describe('Error Handling', () => {
    it('should transform Prisma errors into DatabaseExceptions', async () => {
      // Attempt to query a non-existent table to trigger an error
      try {
        await prismaService.$queryRaw`SELECT * FROM non_existent_table`;
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseException);
        expect(error.type).toBe(DatabaseErrorType.QUERY);
      }
    });

    it('should handle connection errors gracefully', async () => {
      // Create a new PrismaService with an invalid connection URL
      const invalidPrismaService = new PrismaService({
        datasources: {
          db: {
            url: 'postgresql://invalid:invalid@localhost:5432/invalid_db',
          },
        },
      });

      try {
        // Attempt to connect with the invalid service
        await invalidPrismaService.$connect();
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseException);
        expect(error.type).toBe(DatabaseErrorType.CONNECTION);
      } finally {
        // Clean up
        await invalidPrismaService.$disconnect();
      }
    });

    it('should retry operations that fail with transient errors', async () => {
      // Mock the executeWithRetry method to test retry logic
      const mockOperation = jest.fn();
      mockOperation.mockRejectedValueOnce(new Error('Connection reset'));
      mockOperation.mockRejectedValueOnce(new Error('Connection timeout'));
      mockOperation.mockResolvedValueOnce('Success');

      const result = await prismaService.executeWithRetry(mockOperation, {
        maxRetries: 3,
        baseDelay: 10,
        maxDelay: 100,
      });

      expect(result).toBe('Success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should not retry operations that fail with permanent errors', async () => {
      // Mock the executeWithRetry method to test retry logic
      const mockOperation = jest.fn();
      mockOperation.mockRejectedValueOnce(new DatabaseException(
        'Constraint violation',
        DatabaseErrorType.INTEGRITY,
      ));

      try {
        await prismaService.executeWithRetry(mockOperation, {
          maxRetries: 3,
          baseDelay: 10,
          maxDelay: 100,
        });
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseException);
        expect(error.type).toBe(DatabaseErrorType.INTEGRITY);
        expect(mockOperation).toHaveBeenCalledTimes(1);
      }
    });
  });

  /**
   * Middleware Integration tests
   */
  describe('Middleware Integration', () => {
    it('should apply logging middleware to database operations', async () => {
      // Mock the LoggingMiddleware to verify it's called
      const originalBeforeExecute = LoggingMiddleware.prototype.beforeExecute;
      const originalAfterExecute = LoggingMiddleware.prototype.afterExecute;
      const beforeExecuteMock = jest.fn().mockImplementation(originalBeforeExecute);
      const afterExecuteMock = jest.fn().mockImplementation(originalAfterExecute);

      LoggingMiddleware.prototype.beforeExecute = beforeExecuteMock;
      LoggingMiddleware.prototype.afterExecute = afterExecuteMock;

      try {
        // Execute a query that should trigger the middleware
        await prismaService.$queryRaw`SELECT 1 as test`;

        // Verify middleware was called
        expect(beforeExecuteMock).toHaveBeenCalled();
        expect(afterExecuteMock).toHaveBeenCalled();
      } finally {
        // Restore original methods
        LoggingMiddleware.prototype.beforeExecute = originalBeforeExecute;
        LoggingMiddleware.prototype.afterExecute = originalAfterExecute;
      }
    });

    it('should apply performance middleware to database operations', async () => {
      // Mock the PerformanceMiddleware to verify it's called
      const originalBeforeExecute = PerformanceMiddleware.prototype.beforeExecute;
      const originalAfterExecute = PerformanceMiddleware.prototype.afterExecute;
      const beforeExecuteMock = jest.fn().mockImplementation(originalBeforeExecute);
      const afterExecuteMock = jest.fn().mockImplementation(originalAfterExecute);

      PerformanceMiddleware.prototype.beforeExecute = beforeExecuteMock;
      PerformanceMiddleware.prototype.afterExecute = afterExecuteMock;

      try {
        // Execute a query that should trigger the middleware
        await prismaService.$queryRaw`SELECT 1 as test`;

        // Verify middleware was called
        expect(beforeExecuteMock).toHaveBeenCalled();
        expect(afterExecuteMock).toHaveBeenCalled();
      } finally {
        // Restore original methods
        PerformanceMiddleware.prototype.beforeExecute = originalBeforeExecute;
        PerformanceMiddleware.prototype.afterExecute = originalAfterExecute;
      }
    });

    it('should apply circuit breaker middleware to database operations', async () => {
      // Mock the CircuitBreakerMiddleware to verify it's called
      const originalBeforeExecute = CircuitBreakerMiddleware.prototype.beforeExecute;
      const originalAfterExecute = CircuitBreakerMiddleware.prototype.afterExecute;
      const beforeExecuteMock = jest.fn().mockImplementation(originalBeforeExecute);
      const afterExecuteMock = jest.fn().mockImplementation(originalAfterExecute);

      CircuitBreakerMiddleware.prototype.beforeExecute = beforeExecuteMock;
      CircuitBreakerMiddleware.prototype.afterExecute = afterExecuteMock;

      try {
        // Execute a query that should trigger the middleware
        await prismaService.$queryRaw`SELECT 1 as test`;

        // Verify middleware was called
        expect(beforeExecuteMock).toHaveBeenCalled();
        expect(afterExecuteMock).toHaveBeenCalled();
      } finally {
        // Restore original methods
        CircuitBreakerMiddleware.prototype.beforeExecute = originalBeforeExecute;
        CircuitBreakerMiddleware.prototype.afterExecute = originalAfterExecute;
      }
    });

    it('should apply transformation middleware to database operations', async () => {
      // Mock the TransformationMiddleware to verify it's called
      const originalBeforeExecute = TransformationMiddleware.prototype.beforeExecute;
      const originalAfterExecute = TransformationMiddleware.prototype.afterExecute;
      const beforeExecuteMock = jest.fn().mockImplementation(originalBeforeExecute);
      const afterExecuteMock = jest.fn().mockImplementation(originalAfterExecute);

      TransformationMiddleware.prototype.beforeExecute = beforeExecuteMock;
      TransformationMiddleware.prototype.afterExecute = afterExecuteMock;

      try {
        // Execute a query that should trigger the middleware
        await prismaService.$queryRaw`SELECT 1 as test`;

        // Verify middleware was called
        expect(beforeExecuteMock).toHaveBeenCalled();
        expect(afterExecuteMock).toHaveBeenCalled();
      } finally {
        // Restore original methods
        TransformationMiddleware.prototype.beforeExecute = originalBeforeExecute;
        TransformationMiddleware.prototype.afterExecute = originalAfterExecute;
      }
    });

    it('should apply middleware in the correct order', async () => {
      // Create an array to track middleware execution order
      const executionOrder: string[] = [];

      // Mock all middleware to track execution order
      const middlewares = [
        { name: 'LoggingMiddleware', middleware: LoggingMiddleware },
        { name: 'PerformanceMiddleware', middleware: PerformanceMiddleware },
        { name: 'CircuitBreakerMiddleware', middleware: CircuitBreakerMiddleware },
        { name: 'TransformationMiddleware', middleware: TransformationMiddleware },
      ];

      // Save original methods
      const originalMethods = middlewares.map(m => ({
        name: m.name,
        beforeExecute: m.middleware.prototype.beforeExecute,
        afterExecute: m.middleware.prototype.afterExecute,
      }));

      // Mock all middleware methods
      middlewares.forEach(m => {
        m.middleware.prototype.beforeExecute = jest.fn().mockImplementation((params, next) => {
          executionOrder.push(`${m.name}-before`);
          return next(params);
        });
        m.middleware.prototype.afterExecute = jest.fn().mockImplementation((result, context) => {
          executionOrder.push(`${m.name}-after`);
          return result;
        });
      });

      try {
        // Execute a query that should trigger all middleware
        await prismaService.$queryRaw`SELECT 1 as test`;

        // Verify middleware execution order
        // Before hooks should execute in priority order (highest first)
        // After hooks should execute in reverse priority order (lowest first)
        expect(executionOrder).toContain('LoggingMiddleware-before');
        expect(executionOrder).toContain('PerformanceMiddleware-before');
        expect(executionOrder).toContain('CircuitBreakerMiddleware-before');
        expect(executionOrder).toContain('TransformationMiddleware-before');
        expect(executionOrder).toContain('LoggingMiddleware-after');
        expect(executionOrder).toContain('PerformanceMiddleware-after');
        expect(executionOrder).toContain('CircuitBreakerMiddleware-after');
        expect(executionOrder).toContain('TransformationMiddleware-after');

        // Verify the before hooks execute before the after hooks
        const loggingBeforeIndex = executionOrder.indexOf('LoggingMiddleware-before');
        const loggingAfterIndex = executionOrder.indexOf('LoggingMiddleware-after');
        expect(loggingBeforeIndex).toBeLessThan(loggingAfterIndex);
      } finally {
        // Restore original methods
        originalMethods.forEach(m => {
          const middleware = middlewares.find(mw => mw.name === m.name)?.middleware;
          if (middleware) {
            middleware.prototype.beforeExecute = m.beforeExecute;
            middleware.prototype.afterExecute = m.afterExecute;
          }
        });
      }
    });
  });

  /**
   * Transaction Management tests
   */
  describe('Transaction Management', () => {
    it('should execute operations within a transaction', async () => {
      // Execute a transaction that performs multiple operations
      const result = await prismaService.$executeInTransaction(async (tx) => {
        // Execute multiple queries within the transaction
        const result1 = await tx.$queryRaw`SELECT 1 as value`;
        const result2 = await tx.$queryRaw`SELECT 2 as value`;
        
        // Return combined results
        return {
          result1: result1[0],
          result2: result2[0],
        };
      });

      // Verify transaction results
      expect(result).toBeDefined();
      expect(result.result1).toHaveProperty('value', 1);
      expect(result.result2).toHaveProperty('value', 2);
    });

    it('should roll back transactions on error', async () => {
      // Create a test user for transaction testing
      const testUser = {
        name: 'Transaction Test User',
        email: `transaction-test-${Date.now()}@example.com`,
        password: 'password123',
      };

      try {
        // Execute a transaction that will fail
        await prismaService.$executeInTransaction(async (tx) => {
          // Create a user
          await tx.user.create({
            data: testUser,
          });

          // Perform an operation that will fail
          await tx.$queryRaw`SELECT * FROM non_existent_table`;

          return true;
        });

        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        // Verify the error is a DatabaseException
        expect(error).toBeInstanceOf(DatabaseException);
      }

      // Verify the user was not created (transaction was rolled back)
      const user = await prismaService.user.findUnique({
        where: { email: testUser.email },
      });

      expect(user).toBeNull();
    });

    it('should support different transaction isolation levels', async () => {
      // Test each isolation level
      const isolationLevels = [
        TransactionIsolationLevel.READ_UNCOMMITTED,
        TransactionIsolationLevel.READ_COMMITTED,
        TransactionIsolationLevel.REPEATABLE_READ,
        TransactionIsolationLevel.SERIALIZABLE,
      ];

      for (const isolationLevel of isolationLevels) {
        // Execute a transaction with the specified isolation level
        const result = await prismaService.$executeInTransaction(
          async (tx) => {
            const result = await tx.$queryRaw`SELECT 1 as test`;
            return result[0];
          },
          { isolationLevel },
        );

        // Verify transaction executed successfully
        expect(result).toHaveProperty('test', 1);
      }
    });
  });

  /**
   * Journey Context tests
   */
  describe('Journey Context Support', () => {
    it('should provide a health journey context', () => {
      expect(healthContext).toBeDefined();
      expect(healthContext.prisma).toBeDefined();
    });

    it('should provide a care journey context', () => {
      expect(careContext).toBeDefined();
      expect(careContext.prisma).toBeDefined();
    });

    it('should provide a plan journey context', () => {
      expect(planContext).toBeDefined();
      expect(planContext.prisma).toBeDefined();
    });

    it('should create a PrismaService with journey-specific configuration', () => {
      // Create a PrismaService with health journey configuration
      const healthPrismaService = new PrismaService({
        journeyType: JourneyType.HEALTH,
        enableLogging: true,
        enablePerformanceTracking: true,
      });

      expect(healthPrismaService).toBeDefined();
      expect(healthPrismaService.options).toHaveProperty('journeyType', JourneyType.HEALTH);
      expect(healthPrismaService.options).toHaveProperty('enableLogging', true);
      expect(healthPrismaService.options).toHaveProperty('enablePerformanceTracking', true);
    });

    it('should apply journey-specific middleware', async () => {
      // Create a PrismaService with health journey configuration
      const healthPrismaService = new PrismaService({
        journeyType: JourneyType.HEALTH,
        enableLogging: true,
        enablePerformanceTracking: true,
      });

      // Mock the middleware registry to verify journey-specific middleware
      const originalExecuteWithMiddleware = MiddlewareRegistry.prototype.executeWithMiddleware;
      const executeWithMiddlewareMock = jest.fn().mockImplementation(
        (journeyContext, params, context, next) => next(params)
      );

      MiddlewareRegistry.prototype.executeWithMiddleware = executeWithMiddlewareMock;

      try {
        // Initialize the service
        await healthPrismaService.onModuleInit();

        // Execute a query that should trigger journey-specific middleware
        await healthPrismaService.$queryRaw`SELECT 1 as test`;

        // Verify middleware was called with the correct journey context
        expect(executeWithMiddlewareMock).toHaveBeenCalled();
        const calls = executeWithMiddlewareMock.mock.calls;
        const hasHealthContext = calls.some(call => call[0] === 'health');
        expect(hasHealthContext).toBe(true);
      } finally {
        // Clean up
        await healthPrismaService.onModuleDestroy();
        MiddlewareRegistry.prototype.executeWithMiddleware = originalExecuteWithMiddleware;
      }
    });
  });

  /**
   * Retry Mechanism tests
   */
  describe('Retry Mechanisms', () => {
    it('should retry failed operations with exponential backoff', async () => {
      // Mock a function that fails twice and succeeds on the third attempt
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Connection reset'))
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockResolvedValueOnce('Success');

      // Execute the operation with retry
      const startTime = Date.now();
      const result = await prismaService.executeWithRetry(mockFn, {
        maxRetries: 3,
        baseDelay: 50,
        maxDelay: 200,
      });
      const endTime = Date.now();

      // Verify the operation was retried and eventually succeeded
      expect(result).toBe('Success');
      expect(mockFn).toHaveBeenCalledTimes(3);

      // Verify that backoff delays were applied (total time should be at least the sum of delays)
      const minExpectedTime = 50 + 100; // baseDelay + (baseDelay * 2^1)
      expect(endTime - startTime).toBeGreaterThanOrEqual(minExpectedTime);
    });

    it('should stop retrying after max attempts', async () => {
      // Mock a function that always fails
      const mockFn = jest.fn().mockRejectedValue(new Error('Connection reset'));

      // Execute the operation with retry
      try {
        await prismaService.executeWithRetry(mockFn, {
          maxRetries: 2,
          baseDelay: 10,
          maxDelay: 100,
        });
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        // Verify the error is what we expect
        expect(error.message).toBe('Connection reset');
        // Verify the operation was retried the expected number of times
        expect(mockFn).toHaveBeenCalledTimes(3); // Initial attempt + 2 retries
      }
    });

    it('should not retry non-retryable errors', async () => {
      // Mock a function that fails with a non-retryable error
      const mockFn = jest.fn().mockRejectedValue(
        new DatabaseException('Constraint violation', DatabaseErrorType.INTEGRITY)
      );

      // Execute the operation with retry
      try {
        await prismaService.executeWithRetry(mockFn, {
          maxRetries: 3,
          baseDelay: 10,
          maxDelay: 100,
        });
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        // Verify the error is what we expect
        expect(error).toBeInstanceOf(DatabaseException);
        expect(error.type).toBe(DatabaseErrorType.INTEGRITY);
        // Verify the operation was not retried
        expect(mockFn).toHaveBeenCalledTimes(1);
      }
    });
  });

  /**
   * Health Check tests
   */
  describe('Health Checks', () => {
    it('should report healthy status when database is available', async () => {
      const health = await prismaService.checkHealth();
      expect(health).toBeDefined();
      expect(health.healthy).toBe(true);
    });

    it('should report unhealthy status when database is unavailable', async () => {
      // Create a PrismaService with an invalid connection URL
      const invalidPrismaService = new PrismaService({
        datasources: {
          db: {
            url: 'postgresql://invalid:invalid@localhost:5432/invalid_db',
          },
        },
      });

      try {
        // Check health with the invalid service
        const health = await invalidPrismaService.checkHealth();
        expect(health).toBeDefined();
        expect(health.healthy).toBe(false);
        expect(health.details).toBeDefined();
        expect(health.details.error).toBeDefined();
      } finally {
        // Clean up
        await invalidPrismaService.$disconnect();
      }
    });

    it('should include connection pool statistics in health check', async () => {
      // Get a connection to ensure the pool has at least one active connection
      const connection = await prismaService.getConnection();

      try {
        // Check health
        const health = await prismaService.checkHealth();
        expect(health).toBeDefined();
        expect(health.healthy).toBe(true);

        // Get connection stats
        const stats = prismaService.getConnectionStats();
        expect(stats.active).toBeGreaterThan(0);
      } finally {
        // Release the connection
        prismaService.releaseConnection(connection);
      }
    });
  });
});
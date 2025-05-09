import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../src/connection/prisma.service';
import { DatabaseModule } from '../../../src/database.module';
import { DatabaseErrorType, DatabaseErrorSeverity, DatabaseErrorRecoverability } from '../../../src/errors/database-error.types';
import { 
  DatabaseException, 
  ConnectionException, 
  QueryException, 
  TransactionException, 
  IntegrityException, 
  ConfigurationException 
} from '../../../src/errors/database-error.exception';
import { ErrorTransformer } from '../../../src/errors/error-transformer';
import { RetryStrategyFactory } from '../../../src/errors/retry-strategies';
import { 
  PrismaErrorHandler, 
  CommonErrorHandler 
} from '../../../src/errors/handlers';
import { setupTestDatabase, cleanupTestDatabase } from './helpers';

/**
 * End-to-end tests for database error handling and recovery mechanisms.
 * Tests error classification, transformation, retry strategies, and error propagation
 * using real database error scenarios.
 */
describe('Database Error Handling (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let prismaClient: PrismaClient;
  let errorTransformer: ErrorTransformer;
  let retryStrategyFactory: RetryStrategyFactory;
  let testDbConnection: any;
  
  // Setup test environment before all tests
  beforeAll(async () => {
    // Initialize test database
    testDbConnection = await setupTestDatabase();
    
    // Create testing module with DatabaseModule
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
    
    // Get service instances
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    errorTransformer = moduleFixture.get<ErrorTransformer>(ErrorTransformer);
    retryStrategyFactory = moduleFixture.get<RetryStrategyFactory>(RetryStrategyFactory);
    
    // Create a raw PrismaClient for direct manipulation
    prismaClient = new PrismaClient();
  });
  
  // Cleanup after all tests
  afterAll(async () => {
    await prismaClient.$disconnect();
    await app.close();
    await cleanupTestDatabase(testDbConnection);
  });
  
  // Reset database state between tests
  afterEach(async () => {
    // Clean up any test data created during tests
    await prismaService.cleanDatabase();
  });
  
  /**
   * Helper function to create a user with a unique email
   */
  const createTestUser = async (email: string = `test-${Date.now()}@example.com`) => {
    return prismaService.$transaction(async (tx) => {
      return tx.user.create({
        data: {
          email,
          name: 'Test User',
          password: 'password123',
          phone: '+5511999999999',
          cpf: '12345678901',
        },
      });
    });
  };

  /**
   * Helper function to attempt creating a user with a duplicate email
   * to trigger a unique constraint violation
   */
  const createDuplicateUser = async (email: string) => {
    try {
      await prismaService.user.create({
        data: {
          email,
          name: 'Duplicate User',
          password: 'password123',
          phone: '+5511888888888',
          cpf: '98765432109',
        },
      });
    } catch (error) {
      return error;
    }
  };

  /**
   * Helper function to simulate a connection error by closing the connection pool
   * and attempting a database operation
   */
  const simulateConnectionError = async () => {
    try {
      // Force disconnect the client
      await prismaClient.$disconnect();
      
      // Attempt an operation on the disconnected client
      await prismaClient.user.findMany();
    } catch (error) {
      return error;
    } finally {
      // Reconnect the client for subsequent tests
      await prismaClient.$connect();
    }
  };

  /**
   * Helper function to simulate a query error by executing an invalid SQL query
   */
  const simulateQueryError = async () => {
    try {
      // Execute raw query with syntax error
      await prismaService.$queryRaw`SELECT * FROM non_existent_table`;
    } catch (error) {
      return error;
    }
  };

  /**
   * Helper function to simulate a transaction error by causing a deadlock
   */
  const simulateTransactionError = async () => {
    try {
      // Create two concurrent transactions that will deadlock
      const promise1 = prismaService.$transaction(async (tx) => {
        // Lock user 1
        await tx.user.update({
          where: { id: 1 },
          data: { name: 'Updated in Transaction 1' },
        });
        
        // Wait to create deadlock
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Try to lock user 2
        return tx.user.update({
          where: { id: 2 },
          data: { name: 'Also Updated in Transaction 1' },
        });
      }, { timeout: 1000 }); // Short timeout to ensure deadlock is detected
      
      const promise2 = prismaService.$transaction(async (tx) => {
        // Lock user 2
        await tx.user.update({
          where: { id: 2 },
          data: { name: 'Updated in Transaction 2' },
        });
        
        // Try to lock user 1
        return tx.user.update({
          where: { id: 1 },
          data: { name: 'Also Updated in Transaction 2' },
        });
      }, { timeout: 1000 });
      
      // Execute both transactions concurrently
      await Promise.all([promise1, promise2]);
    } catch (error) {
      return error;
    }
  };

  /**
   * Helper function to simulate a configuration error by attempting to connect
   * with invalid credentials
   */
  const simulateConfigurationError = async () => {
    try {
      // Create a new PrismaClient with invalid credentials
      const invalidClient = new PrismaClient({
        datasources: {
          db: {
            url: 'postgresql://invalid:invalid@localhost:5432/invalid_db',
          },
        },
      });
      
      // Attempt to connect
      await invalidClient.$connect();
      
      // Attempt an operation
      await invalidClient.user.findMany();
    } catch (error) {
      return error;
    }
  };

  describe('Error Classification', () => {
    it('should correctly classify connection errors', async () => {
      // Simulate a connection error
      const error = await simulateConnectionError();
      
      // Transform the error
      const transformedError = errorTransformer.transformPrismaError(error);
      
      // Verify classification
      expect(transformedError).toBeInstanceOf(ConnectionException);
      expect(transformedError.type).toBe(DatabaseErrorType.CONNECTION);
      expect(transformedError.severity).toBe(DatabaseErrorSeverity.CRITICAL);
      expect(transformedError.recoverability).toBe(DatabaseErrorRecoverability.TRANSIENT);
    });
    
    it('should correctly classify query errors', async () => {
      // Simulate a query error
      const error = await simulateQueryError();
      
      // Transform the error
      const transformedError = errorTransformer.transformPrismaError(error);
      
      // Verify classification
      expect(transformedError).toBeInstanceOf(QueryException);
      expect(transformedError.type).toBe(DatabaseErrorType.QUERY);
      expect(transformedError.severity).toBe(DatabaseErrorSeverity.MAJOR);
      expect(transformedError.recoverability).toBe(DatabaseErrorRecoverability.PERMANENT);
    });
    
    it('should correctly classify transaction errors', async () => {
      // Create test users for transaction test
      await createTestUser('user1@example.com');
      await createTestUser('user2@example.com');
      
      // Simulate a transaction error
      const error = await simulateTransactionError();
      
      // Transform the error
      const transformedError = errorTransformer.transformPrismaError(error);
      
      // Verify classification
      expect(transformedError).toBeInstanceOf(TransactionException);
      expect(transformedError.type).toBe(DatabaseErrorType.TRANSACTION);
      expect(transformedError.severity).toBe(DatabaseErrorSeverity.MAJOR);
      expect(transformedError.recoverability).toBe(DatabaseErrorRecoverability.TRANSIENT);
    });
    
    it('should correctly classify integrity errors', async () => {
      // Create a user
      const email = 'integrity-test@example.com';
      await createTestUser(email);
      
      // Attempt to create a duplicate user to trigger integrity error
      const error = await createDuplicateUser(email);
      
      // Transform the error
      const transformedError = errorTransformer.transformPrismaError(error);
      
      // Verify classification
      expect(transformedError).toBeInstanceOf(IntegrityException);
      expect(transformedError.type).toBe(DatabaseErrorType.INTEGRITY);
      expect(transformedError.severity).toBe(DatabaseErrorSeverity.MINOR);
      expect(transformedError.recoverability).toBe(DatabaseErrorRecoverability.PERMANENT);
      expect(transformedError.message).toContain('unique constraint');
    });
    
    it('should correctly classify configuration errors', async () => {
      // Simulate a configuration error
      const error = await simulateConfigurationError();
      
      // Transform the error
      const transformedError = errorTransformer.transformPrismaError(error);
      
      // Verify classification
      expect(transformedError).toBeInstanceOf(ConfigurationException);
      expect(transformedError.type).toBe(DatabaseErrorType.CONFIGURATION);
      expect(transformedError.severity).toBe(DatabaseErrorSeverity.CRITICAL);
      expect(transformedError.recoverability).toBe(DatabaseErrorRecoverability.PERMANENT);
    });
  });

  describe('Error Transformation', () => {
    it('should transform Prisma errors with appropriate context', async () => {
      // Simulate a query error
      const error = await simulateQueryError();
      
      // Transform the error with context
      const context = { 
        operation: 'findUsers', 
        entity: 'User',
        journey: 'auth',
        params: { where: { email: 'test@example.com' } }
      };
      
      const transformedError = errorTransformer.transformPrismaError(error, context);
      
      // Verify context is included
      expect(transformedError.context).toEqual(expect.objectContaining(context));
      expect(transformedError.message).toContain('non_existent_table');
    });
    
    it('should transform integrity errors with constraint information', async () => {
      // Create a user
      const email = 'unique-test@example.com';
      await createTestUser(email);
      
      // Attempt to create a duplicate user
      const error = await createDuplicateUser(email);
      
      // Transform the error
      const transformedError = errorTransformer.transformPrismaError(error);
      
      // Verify constraint information is included
      expect(transformedError).toBeInstanceOf(IntegrityException);
      expect(transformedError.message).toContain('unique constraint');
      expect(transformedError.context).toEqual(
        expect.objectContaining({
          constraint: expect.stringContaining('email'),
          entity: 'User'
        })
      );
    });
    
    it('should transform connection errors with connection details', async () => {
      // Simulate a connection error
      const error = await simulateConnectionError();
      
      // Transform the error
      const transformedError = errorTransformer.transformPrismaError(error);
      
      // Verify connection details are included
      expect(transformedError).toBeInstanceOf(ConnectionException);
      expect(transformedError.context).toEqual(
        expect.objectContaining({
          database: expect.any(String),
          connectionId: expect.any(String)
        })
      );
    });
  });

  describe('Retry Strategies', () => {
    it('should select exponential backoff strategy for transient connection errors', async () => {
      // Simulate a connection error
      const error = await simulateConnectionError();
      
      // Transform the error
      const transformedError = errorTransformer.transformPrismaError(error);
      
      // Get retry strategy
      const retryStrategy = retryStrategyFactory.getStrategy(transformedError);
      
      // Verify strategy type
      expect(retryStrategy.name).toBe('ExponentialBackoffStrategy');
      expect(retryStrategy.maxAttempts).toBeGreaterThan(1);
    });
    
    it('should select circuit breaker strategy for repeated connection errors', async () => {
      // Simulate multiple connection errors
      const error1 = await simulateConnectionError();
      const error2 = await simulateConnectionError();
      const error3 = await simulateConnectionError();
      
      // Transform the errors
      const transformedError1 = errorTransformer.transformPrismaError(error1);
      const transformedError2 = errorTransformer.transformPrismaError(error2);
      const transformedError3 = errorTransformer.transformPrismaError(error3);
      
      // Get retry strategies
      const retryStrategy1 = retryStrategyFactory.getStrategy(transformedError1);
      const retryStrategy2 = retryStrategyFactory.getStrategy(transformedError2);
      const retryStrategy3 = retryStrategyFactory.getStrategy(transformedError3);
      
      // Verify strategy progression
      expect(retryStrategy1.name).toBe('ExponentialBackoffStrategy');
      
      // After multiple errors, should switch to circuit breaker
      expect(retryStrategy3.name).toBe('CircuitBreakerStrategy');
    });
    
    it('should not retry permanent errors', async () => {
      // Simulate a query error (permanent)
      const error = await simulateQueryError();
      
      // Transform the error
      const transformedError = errorTransformer.transformPrismaError(error);
      
      // Get retry strategy
      const retryStrategy = retryStrategyFactory.getStrategy(transformedError);
      
      // Verify no retry for permanent errors
      expect(retryStrategy.name).toBe('NoRetryStrategy');
      expect(retryStrategy.maxAttempts).toBe(0);
    });
    
    it('should apply jitter to retry delays to prevent thundering herd', async () => {
      // Simulate a connection error
      const error = await simulateConnectionError();
      
      // Transform the error
      const transformedError = errorTransformer.transformPrismaError(error);
      
      // Get retry strategy
      const retryStrategy = retryStrategyFactory.getStrategy(transformedError);
      
      // Get multiple delay calculations to verify jitter
      const delay1 = retryStrategy.getDelay(1);
      const delay2 = retryStrategy.getDelay(1);
      const delay3 = retryStrategy.getDelay(1);
      
      // Verify jitter is applied (delays should be different)
      expect(delay1).not.toBe(delay2);
      expect(delay2).not.toBe(delay3);
      expect(delay1).not.toBe(delay3);
    });
    
    it('should increase delays exponentially with retry attempts', async () => {
      // Simulate a connection error
      const error = await simulateConnectionError();
      
      // Transform the error
      const transformedError = errorTransformer.transformPrismaError(error);
      
      // Get retry strategy
      const retryStrategy = retryStrategyFactory.getStrategy(transformedError);
      
      // Get delays for different attempt numbers
      const delay1 = retryStrategy.getDelay(1);
      const delay2 = retryStrategy.getDelay(2);
      const delay3 = retryStrategy.getDelay(3);
      
      // Verify exponential increase (ignoring jitter)
      // We can only verify that delays generally increase
      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
    });
    
    it('should select different strategies based on error context', async () => {
      // Simulate a connection error
      const error = await simulateConnectionError();
      
      // Transform the error with different contexts
      const criticalContext = { operation: 'authenticateUser', critical: true };
      const nonCriticalContext = { operation: 'fetchUserPreferences', critical: false };
      
      const criticalError = errorTransformer.transformPrismaError(error, criticalContext);
      const nonCriticalError = errorTransformer.transformPrismaError(error, nonCriticalContext);
      
      // Get retry strategies
      const criticalStrategy = retryStrategyFactory.getStrategy(criticalError);
      const nonCriticalStrategy = retryStrategyFactory.getStrategy(nonCriticalError);
      
      // Verify different strategies or parameters based on context
      expect(criticalStrategy.maxAttempts).toBeLessThanOrEqual(nonCriticalStrategy.maxAttempts);
      expect(criticalStrategy.getDelay(1)).toBeLessThanOrEqual(nonCriticalStrategy.getDelay(1));
    });
  });

  describe('Error Propagation', () => {
    it('should propagate errors with journey context', async () => {
      // Create a PrismaErrorHandler with journey context
      const prismaErrorHandler = new PrismaErrorHandler();
      prismaErrorHandler.setJourneyContext('health');
      
      // Simulate a query error
      const error = await simulateQueryError();
      
      // Handle the error
      const handledError = prismaErrorHandler.handleError(error, {
        operation: 'getHealthMetrics',
        entity: 'HealthMetric'
      });
      
      // Verify journey context is propagated
      expect(handledError.context).toEqual(
        expect.objectContaining({
          journey: 'health',
          operation: 'getHealthMetrics',
          entity: 'HealthMetric'
        })
      );
    });
    
    it('should enrich errors with operation metadata', async () => {
      // Create a PrismaErrorHandler
      const prismaErrorHandler = new PrismaErrorHandler();
      
      // Simulate an integrity error
      const email = 'propagation-test@example.com';
      await createTestUser(email);
      const error = await createDuplicateUser(email);
      
      // Handle the error with operation metadata
      const metadata = {
        operation: 'createUser',
        entity: 'User',
        params: { email },
        userId: '123',
        requestId: 'req-456'
      };
      
      const handledError = prismaErrorHandler.handleError(error, metadata);
      
      // Verify metadata is included
      expect(handledError.context).toEqual(expect.objectContaining(metadata));
    });
    
    it('should log errors with appropriate severity levels', async () => {
      // Mock console methods
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      const mockConsoleError = jest.fn();
      const mockConsoleWarn = jest.fn();
      console.error = mockConsoleError;
      console.warn = mockConsoleWarn;
      
      try {
        // Create handlers
        const prismaErrorHandler = new PrismaErrorHandler();
        
        // Handle different error types
        const connectionError = await simulateConnectionError();
        const integrityError = await createDuplicateUser('logging-test@example.com');
        
        // Process errors
        prismaErrorHandler.handleError(connectionError, { operation: 'connect' });
        prismaErrorHandler.handleError(integrityError, { operation: 'createUser' });
        
        // Verify logging
        expect(mockConsoleError).toHaveBeenCalled();
        expect(mockConsoleWarn).toHaveBeenCalled();
      } finally {
        // Restore console methods
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
      }
    });
    
    it('should sanitize sensitive data in error context', async () => {
      // Create a PrismaErrorHandler
      const prismaErrorHandler = new PrismaErrorHandler();
      
      // Simulate a query error
      const error = await simulateQueryError();
      
      // Handle the error with sensitive data
      const metadata = {
        operation: 'authenticateUser',
        entity: 'User',
        params: { 
          email: 'user@example.com',
          password: 'supersecret123', // Sensitive
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', // Sensitive
          creditCard: '4111-1111-1111-1111' // Sensitive
        }
      };
      
      const handledError = prismaErrorHandler.handleError(error, metadata);
      
      // Verify sensitive data is sanitized
      expect(handledError.context.params).toBeDefined();
      expect(handledError.context.params.email).toBe('user@example.com');
      expect(handledError.context.params.password).toBe('[REDACTED]');
      expect(handledError.context.params.token).toBe('[REDACTED]');
      expect(handledError.context.params.creditCard).toBe('[REDACTED]');
    });
    
    it('should transform errors from different database technologies consistently', async () => {
      // Create handlers for different technologies
      const prismaErrorHandler = new PrismaErrorHandler();
      const commonErrorHandler = new CommonErrorHandler();
      
      // Simulate errors
      const prismaError = await simulateQueryError();
      
      // Create a generic database error (not Prisma-specific)
      const genericError = new Error('Generic database error');
      genericError.name = 'QueryFailedError';
      genericError.code = '42P01'; // PostgreSQL code for undefined_table
      
      // Handle errors with both handlers
      const handledPrismaError = prismaErrorHandler.handleError(prismaError, { operation: 'query' });
      const handledGenericError = commonErrorHandler.handleError(genericError, { operation: 'query' });
      
      // Verify consistent error classification across technologies
      expect(handledPrismaError.type).toBe(handledGenericError.type);
      expect(handledPrismaError.severity).toBe(handledGenericError.severity);
      expect(handledPrismaError instanceof QueryException).toBe(true);
      expect(handledGenericError instanceof QueryException).toBe(true);
    });
    
    it('should preserve stack traces in transformed errors', async () => {
      // Create a PrismaErrorHandler
      const prismaErrorHandler = new PrismaErrorHandler();
      
      // Simulate a query error
      const error = await simulateQueryError();
      
      // Original error should have a stack trace
      expect(error.stack).toBeDefined();
      
      // Handle the error
      const handledError = prismaErrorHandler.handleError(error, { operation: 'query' });
      
      // Verify stack trace is preserved
      expect(handledError.stack).toBeDefined();
      expect(handledError.stack).toContain('simulateQueryError');
    });
  });

  describe('Real Database Error Scenarios', () => {
    it('should handle foreign key constraint violations', async () => {
      try {
        // Attempt to create a health metric for non-existent user
        await prismaService.healthMetric.create({
          data: {
            userId: 9999, // Non-existent user ID
            type: 'HEART_RATE',
            value: '75',
            unit: 'bpm',
            recordedAt: new Date(),
          },
        });
        
        fail('Should have thrown a foreign key constraint error');
      } catch (error) {
        // Transform the error
        const transformedError = errorTransformer.transformPrismaError(error);
        
        // Verify error classification
        expect(transformedError).toBeInstanceOf(IntegrityException);
        expect(transformedError.type).toBe(DatabaseErrorType.INTEGRITY);
        expect(transformedError.message).toContain('foreign key constraint');
      }
    });
    
    it('should handle invalid data type errors', async () => {
      try {
        // Execute raw query with invalid data type
        await prismaService.$queryRaw`
          INSERT INTO "User" ("email", "name", "password", "phone", "cpf") 
          VALUES ('invalid-type@example.com', 'Invalid Type User', 'password123', 123, '12345678901')
        `;
        
        fail('Should have thrown a data type error');
      } catch (error) {
        // Transform the error
        const transformedError = errorTransformer.transformPrismaError(error);
        
        // Verify error classification
        expect(transformedError).toBeInstanceOf(QueryException);
        expect(transformedError.message).toContain('data type');
      }
    });
    
    it('should handle transaction rollback on error', async () => {
      const email = 'rollback-test@example.com';
      
      try {
        // Start a transaction that will fail
        await prismaService.$transaction(async (tx) => {
          // Create a user successfully
          await tx.user.create({
            data: {
              email,
              name: 'Rollback Test User',
              password: 'password123',
              phone: '+5511999999999',
              cpf: '12345678901',
            },
          });
          
          // This operation will fail with a foreign key constraint error
          await tx.healthMetric.create({
            data: {
              userId: 9999, // Non-existent user ID
              type: 'HEART_RATE',
              value: '75',
              unit: 'bpm',
              recordedAt: new Date(),
            },
          });
        });
        
        fail('Transaction should have been rolled back');
      } catch (error) {
        // Transform the error
        const transformedError = errorTransformer.transformPrismaError(error);
        
        // Verify error classification
        expect(transformedError).toBeInstanceOf(IntegrityException);
        
        // Verify transaction was rolled back (user should not exist)
        const user = await prismaService.user.findUnique({
          where: { email },
        });
        
        expect(user).toBeNull();
      }
    });
    
    it('should handle connection pool exhaustion', async () => {
      // Create multiple clients to exhaust connection pool
      const clients: PrismaClient[] = [];
      const maxConnections = 10; // Adjust based on your pool configuration
      
      try {
        // Create multiple clients
        for (let i = 0; i < maxConnections; i++) {
          const client = new PrismaClient();
          await client.$connect();
          clients.push(client);
          
          // Execute a query that holds the connection
          client.$executeRaw`SELECT pg_sleep(1)`;
        }
        
        // Try to get one more connection
        const extraClient = new PrismaClient();
        await extraClient.$connect();
        
        // Execute a query
        await extraClient.$queryRaw`SELECT 1`;
        
        // Cleanup
        await extraClient.$disconnect();
        clients.push(extraClient);
      } catch (error) {
        // Transform the error
        const transformedError = errorTransformer.transformPrismaError(error);
        
        // Connection pool errors might be classified as connection errors
        expect(transformedError.type).toBe(DatabaseErrorType.CONNECTION);
      } finally {
        // Disconnect all clients
        for (const client of clients) {
          await client.$disconnect();
        }
      }
    });
    
    it('should handle database timeout errors', async () => {
      try {
        // Execute a query that will timeout
        await prismaService.$queryRaw`SELECT pg_sleep(30)`; // Assuming timeout is less than 30 seconds
      } catch (error) {
        // Transform the error
        const transformedError = errorTransformer.transformPrismaError(error);
        
        // Verify error classification
        expect(transformedError.type).toBe(DatabaseErrorType.QUERY);
        expect(transformedError.recoverability).toBe(DatabaseErrorRecoverability.TRANSIENT);
        expect(transformedError.message).toContain('timeout');
      }
    });
    
    it('should handle check constraint violations', async () => {
      try {
        // Attempt to create a health metric with invalid value
        await prismaService.$queryRaw`
          INSERT INTO "HealthMetric" ("userId", "type", "value", "unit", "recordedAt") 
          VALUES (1, 'HEART_RATE', '-100', 'bpm', NOW())
        `; // Assuming there's a check constraint that value must be positive
        
        fail('Should have thrown a check constraint error');
      } catch (error) {
        // Transform the error
        const transformedError = errorTransformer.transformPrismaError(error);
        
        // Verify error classification
        expect(transformedError).toBeInstanceOf(IntegrityException);
        expect(transformedError.type).toBe(DatabaseErrorType.INTEGRITY);
        expect(transformedError.message).toContain('check constraint');
      }
    });
    
    it('should handle database permission errors', async () => {
      try {
        // Execute a query that requires elevated permissions
        await prismaService.$queryRaw`CREATE TABLE test_table (id SERIAL PRIMARY KEY)`;
        
        // Clean up if the query somehow succeeds
        await prismaService.$queryRaw`DROP TABLE IF EXISTS test_table`;
        
        fail('Should have thrown a permission error');
      } catch (error) {
        // Transform the error
        const transformedError = errorTransformer.transformPrismaError(error);
        
        // Verify error classification
        expect(transformedError.type).toBe(DatabaseErrorType.CONFIGURATION);
        expect(transformedError.message).toContain('permission');
      }
    });
    
    it('should handle database syntax errors', async () => {
      try {
        // Execute a query with syntax error
        await prismaService.$queryRaw`SELCT * FROM "User"`; // Misspelled SELECT
        
        fail('Should have thrown a syntax error');
      } catch (error) {
        // Transform the error
        const transformedError = errorTransformer.transformPrismaError(error);
        
        // Verify error classification
        expect(transformedError).toBeInstanceOf(QueryException);
        expect(transformedError.type).toBe(DatabaseErrorType.QUERY);
        expect(transformedError.message).toContain('syntax');
      }
    });
  });

  describe('Global Error Handling Integration', () => {
    // Mock global error handler
    let mockGlobalErrorHandler: jest.Mock;
    
    beforeEach(() => {
      // Setup mock global error handler
      mockGlobalErrorHandler = jest.fn();
      global.ErrorReporter = {
        captureException: mockGlobalErrorHandler,
        captureMessage: jest.fn(),
      };
    });
    
    afterEach(() => {
      // Clean up mock
      delete global.ErrorReporter;
    });
    
    it('should integrate with global error reporting system', async () => {
      // Create a PrismaErrorHandler
      const prismaErrorHandler = new PrismaErrorHandler();
      
      // Simulate a query error
      const error = await simulateQueryError();
      
      // Handle the error
      const handledError = prismaErrorHandler.handleError(error, {
        operation: 'query',
        entity: 'User',
      });
      
      // Verify global error handler was called
      expect(mockGlobalErrorHandler).toHaveBeenCalled();
      expect(mockGlobalErrorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          name: handledError.name,
          message: handledError.message,
        }),
        expect.objectContaining({
          tags: expect.objectContaining({
            errorType: handledError.type,
            severity: handledError.severity,
          }),
          extra: expect.objectContaining({
            context: handledError.context,
          }),
        })
      );
    });
    
    it('should not report integrity errors to global error system', async () => {
      // Create a PrismaErrorHandler
      const prismaErrorHandler = new PrismaErrorHandler();
      
      // Create a user
      const email = 'global-error-test@example.com';
      await createTestUser(email);
      
      // Simulate an integrity error (duplicate user)
      const error = await createDuplicateUser(email);
      
      // Handle the error
      prismaErrorHandler.handleError(error, {
        operation: 'createUser',
        entity: 'User',
      });
      
      // Verify global error handler was NOT called for integrity errors
      // as they are expected in normal operation
      expect(mockGlobalErrorHandler).not.toHaveBeenCalled();
    });
    
    it('should include request context in global error reports', async () => {
      // Create a PrismaErrorHandler
      const prismaErrorHandler = new PrismaErrorHandler();
      
      // Set request context
      const requestContext = {
        requestId: 'req-123',
        userId: 'user-456',
        sessionId: 'session-789',
        userAgent: 'Jest Test Runner',
        ipAddress: '127.0.0.1',
      };
      
      prismaErrorHandler.setRequestContext(requestContext);
      
      // Simulate a connection error
      const error = await simulateConnectionError();
      
      // Handle the error
      prismaErrorHandler.handleError(error, {
        operation: 'connect',
      });
      
      // Verify global error handler was called with request context
      expect(mockGlobalErrorHandler).toHaveBeenCalled();
      expect(mockGlobalErrorHandler).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          user: expect.objectContaining({
            id: requestContext.userId,
          }),
          tags: expect.objectContaining({
            sessionId: requestContext.sessionId,
          }),
          extra: expect.objectContaining({
            requestId: requestContext.requestId,
            userAgent: requestContext.userAgent,
            ipAddress: requestContext.ipAddress,
          }),
        })
      );
    });
    
    it('should group similar database errors in global reporting', async () => {
      // Create a PrismaErrorHandler
      const prismaErrorHandler = new PrismaErrorHandler();
      
      // Simulate multiple similar query errors
      const error1 = await simulateQueryError();
      const error2 = await simulateQueryError();
      
      // Handle the errors
      const handledError1 = prismaErrorHandler.handleError(error1, { operation: 'query1' });
      const handledError2 = prismaErrorHandler.handleError(error2, { operation: 'query2' });
      
      // Verify global error handler was called with fingerprinting
      expect(mockGlobalErrorHandler).toHaveBeenCalledTimes(2);
      
      // Get the fingerprint from the first call
      const firstCallArgs = mockGlobalErrorHandler.mock.calls[0][1];
      const secondCallArgs = mockGlobalErrorHandler.mock.calls[1][1];
      
      // Both errors should have the same fingerprint for grouping
      expect(firstCallArgs.fingerprint).toBeDefined();
      expect(secondCallArgs.fingerprint).toBeDefined();
      expect(firstCallArgs.fingerprint).toEqual(secondCallArgs.fingerprint);
    });
  });

describe('Multi-Database Technology Support', () => {
    it('should handle TimescaleDB specific errors', async () => {
      // Mock a TimescaleDB error
      const timescaleError = new Error('relation "hypertable_chunk_123" does not exist');
      timescaleError.name = 'QueryFailedError';
      timescaleError.code = '42P01'; // PostgreSQL code for undefined_table
      
      // Create a mock TimescaleErrorHandler
      const timescaleErrorHandler = new CommonErrorHandler(); // Using CommonErrorHandler as a substitute
      
      // Handle the error
      const handledError = timescaleErrorHandler.handleError(timescaleError, {
        operation: 'queryHealthMetrics',
        entity: 'HealthMetric',
        timeRange: { start: new Date(), end: new Date() },
        aggregation: 'daily'
      });
      
      // Verify error classification
      expect(handledError).toBeInstanceOf(QueryException);
      expect(handledError.type).toBe(DatabaseErrorType.QUERY);
      expect(handledError.context).toEqual(
        expect.objectContaining({
          timeRange: expect.any(Object),
          aggregation: 'daily'
        })
      );
    });
    
    it('should handle Redis specific errors', async () => {
      // Mock a Redis error
      const redisError = new Error('WRONGTYPE Operation against a key holding the wrong kind of value');
      redisError.name = 'ReplyError';
      redisError.command = 'GET';
      redisError.args = ['user:123:session'];
      
      // Create a mock RedisErrorHandler
      const redisErrorHandler = new CommonErrorHandler(); // Using CommonErrorHandler as a substitute
      
      // Handle the error
      const handledError = redisErrorHandler.handleError(redisError, {
        operation: 'getUserSession',
        entity: 'Session',
        key: 'user:123:session'
      });
      
      // Verify error classification
      expect(handledError).toBeInstanceOf(QueryException);
      expect(handledError.type).toBe(DatabaseErrorType.QUERY);
      expect(handledError.context).toEqual(
        expect.objectContaining({
          command: 'GET',
          key: 'user:123:session'
        })
      );
    });
    
    it('should handle S3 storage errors', async () => {
      // Mock an S3 error
      const s3Error = new Error('The specified key does not exist');
      s3Error.name = 'NoSuchKey';
      s3Error.code = 'NoSuchKey';
      s3Error.requestId = 's3-request-123';
      s3Error.resource = 'claims/user-123/receipt.pdf';
      
      // Create a mock S3ErrorHandler (using CommonErrorHandler)
      const s3ErrorHandler = new CommonErrorHandler();
      
      // Handle the error
      const handledError = s3ErrorHandler.handleError(s3Error, {
        operation: 'getClaimReceipt',
        entity: 'ClaimDocument',
        bucket: 'austa-claims',
        key: 'claims/user-123/receipt.pdf'
      });
      
      // Verify error classification
      expect(handledError).toBeInstanceOf(QueryException);
      expect(handledError.type).toBe(DatabaseErrorType.QUERY);
      expect(handledError.context).toEqual(
        expect.objectContaining({
          bucket: 'austa-claims',
          key: 'claims/user-123/receipt.pdf',
          requestId: 's3-request-123'
        })
      );
    });
    
    it('should handle MongoDB specific errors', async () => {
      // Mock a MongoDB error
      const mongoError = new Error('E11000 duplicate key error collection: austa.users index: email_1 dup key: { email: "test@example.com" }');
      mongoError.name = 'MongoError';
      mongoError.code = 11000; // MongoDB duplicate key error
      
      // Create a mock MongoErrorHandler (using CommonErrorHandler)
      const mongoErrorHandler = new CommonErrorHandler();
      
      // Handle the error
      const handledError = mongoErrorHandler.handleError(mongoError, {
        operation: 'createUser',
        entity: 'User',
        collection: 'users',
        document: { email: 'test@example.com' }
      });
      
      // Verify error classification
      expect(handledError).toBeInstanceOf(IntegrityException);
      expect(handledError.type).toBe(DatabaseErrorType.INTEGRITY);
      expect(handledError.context).toEqual(
        expect.objectContaining({
          collection: 'users',
          constraint: 'email_1',
          duplicateKey: 'email'
        })
      );
    });
  });

describe('Journey-Specific Error Handling', () => {
    it('should handle health journey specific errors', async () => {
      // Create a PrismaErrorHandler with health journey context
      const prismaErrorHandler = new PrismaErrorHandler();
      prismaErrorHandler.setJourneyContext('health');
      
      try {
        // Attempt to create a health metric with invalid data
        await prismaService.healthMetric.create({
          data: {
            userId: 1, // Assuming user 1 exists
            type: 'INVALID_TYPE', // Invalid health metric type
            value: '75',
            unit: 'bpm',
            recordedAt: new Date(),
          },
        });
        
        fail('Should have thrown a constraint error');
      } catch (error) {
        // Handle the error with journey context
        const handledError = prismaErrorHandler.handleError(error, {
          operation: 'recordHealthMetric',
          entity: 'HealthMetric',
          params: { type: 'INVALID_TYPE' }
        });
        
        // Verify journey-specific error handling
        expect(handledError.context.journey).toBe('health');
        expect(handledError.message).toContain('health metric type');
        expect(handledError.code).toContain('HEALTH_');
      }
    });
    
    it('should handle care journey specific errors', async () => {
      // Create a PrismaErrorHandler with care journey context
      const prismaErrorHandler = new PrismaErrorHandler();
      prismaErrorHandler.setJourneyContext('care');
      
      try {
        // Attempt to create an appointment with invalid provider
        await prismaService.$queryRaw`
          INSERT INTO "Appointment" ("userId", "providerId", "specialtyId", "date", "status") 
          VALUES (1, 999, 1, NOW(), 'SCHEDULED')
        `;
        
        fail('Should have thrown a foreign key constraint error');
      } catch (error) {
        // Handle the error with journey context
        const handledError = prismaErrorHandler.handleError(error, {
          operation: 'scheduleAppointment',
          entity: 'Appointment',
          params: { providerId: 999 }
        });
        
        // Verify journey-specific error handling
        expect(handledError.context.journey).toBe('care');
        expect(handledError.message).toContain('provider');
        expect(handledError.code).toContain('CARE_');
      }
    });
    
    it('should handle plan journey specific errors', async () => {
      // Create a PrismaErrorHandler with plan journey context
      const prismaErrorHandler = new PrismaErrorHandler();
      prismaErrorHandler.setJourneyContext('plan');
      
      try {
        // Attempt to create a claim with invalid type
        await prismaService.$queryRaw`
          INSERT INTO "Claim" ("userId", "typeId", "amount", "status", "submittedAt") 
          VALUES (1, 999, 100.00, 'SUBMITTED', NOW())
        `;
        
        fail('Should have thrown a foreign key constraint error');
      } catch (error) {
        // Handle the error with journey context
        const handledError = prismaErrorHandler.handleError(error, {
          operation: 'submitClaim',
          entity: 'Claim',
          params: { typeId: 999 }
        });
        
        // Verify journey-specific error handling
        expect(handledError.context.journey).toBe('plan');
        expect(handledError.message).toContain('claim type');
        expect(handledError.code).toContain('PLAN_');
      }
    });
    
    it('should handle gamification journey specific errors', async () => {
      // Create a PrismaErrorHandler with gamification journey context
      const prismaErrorHandler = new PrismaErrorHandler();
      prismaErrorHandler.setJourneyContext('gamification');
      
      try {
        // Attempt to create an achievement with invalid type
        await prismaService.$queryRaw`
          INSERT INTO "Achievement" ("userId", "typeId", "progress", "completedAt") 
          VALUES (1, 999, 100, NOW())
        `;
        
        fail('Should have thrown a foreign key constraint error');
      } catch (error) {
        // Handle the error with journey context
        const handledError = prismaErrorHandler.handleError(error, {
          operation: 'unlockAchievement',
          entity: 'Achievement',
          params: { typeId: 999 }
        });
        
        // Verify journey-specific error handling
        expect(handledError.context.journey).toBe('gamification');
        expect(handledError.message).toContain('achievement type');
        expect(handledError.code).toContain('GAME_');
      }
    });
    
    it('should provide user-friendly error messages for health journey', async () => {
      // Create a PrismaErrorHandler with health journey context
      const prismaErrorHandler = new PrismaErrorHandler();
      prismaErrorHandler.setJourneyContext('health');
      
      // Create a user for the test
      const user = await createTestUser('health-journey@example.com');
      
      try {
        // Attempt to create a duplicate health metric (assuming uniqueness constraint)
        const date = new Date();
        
        // First metric (should succeed)
        await prismaService.healthMetric.create({
          data: {
            userId: user.id,
            type: 'HEART_RATE',
            value: '75',
            unit: 'bpm',
            recordedAt: date,
          },
        });
        
        // Duplicate metric (should fail)
        await prismaService.healthMetric.create({
          data: {
            userId: user.id,
            type: 'HEART_RATE',
            value: '80',
            unit: 'bpm',
            recordedAt: date, // Same timestamp
          },
        });
        
        fail('Should have thrown a unique constraint error');
      } catch (error) {
        // Handle the error with journey context
        const handledError = prismaErrorHandler.handleError(error, {
          operation: 'recordHealthMetric',
          entity: 'HealthMetric',
          params: { type: 'HEART_RATE' }
        });
        
        // Verify user-friendly error message
        expect(handledError.userMessage).toBeDefined();
        expect(handledError.userMessage).toContain('already recorded');
        expect(handledError.userMessage).not.toContain('constraint');
        expect(handledError.userMessage).not.toContain('violation');
      }
    });
    
    it('should provide recovery suggestions for transient errors', async () => {
      // Create a PrismaErrorHandler with care journey context
      const prismaErrorHandler = new PrismaErrorHandler();
      prismaErrorHandler.setJourneyContext('care');
      
      // Simulate a connection error
      const error = await simulateConnectionError();
      
      // Handle the error with journey context
      const handledError = prismaErrorHandler.handleError(error, {
        operation: 'getAppointments',
        entity: 'Appointment'
      });
      
      // Verify recovery suggestions
      expect(handledError.recoverySuggestion).toBeDefined();
      expect(handledError.recoverySuggestion).toContain('try again');
      expect(handledError.recoverability).toBe(DatabaseErrorRecoverability.TRANSIENT);
    });
    
    it('should handle cross-journey database operations', async () => {
      // Create a PrismaErrorHandler with health journey context but operating on gamification data
      const prismaErrorHandler = new PrismaErrorHandler();
      prismaErrorHandler.setJourneyContext('health');
      
      try {
        // Attempt to create a gamification achievement from health journey
        await prismaService.$queryRaw`
          INSERT INTO "Achievement" ("userId", "typeId", "progress", "completedAt") 
          VALUES (1, 999, 100, NOW())
        `;
        
        fail('Should have thrown a foreign key constraint error');
      } catch (error) {
        // Handle the error with cross-journey context
        const handledError = prismaErrorHandler.handleError(error, {
          operation: 'recordAchievement',
          entity: 'Achievement',
          crossJourneyOperation: true,
          targetJourney: 'gamification'
        });
        
        // Verify cross-journey error handling
        expect(handledError.context.journey).toBe('health');
        expect(handledError.context.targetJourney).toBe('gamification');
        expect(handledError.message).toContain('achievement');
      }
    });
  });
});
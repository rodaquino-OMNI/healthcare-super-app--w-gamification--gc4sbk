import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/connection/prisma.service';
import { DatabaseModule } from '../../src/database.module';
import { TransactionService } from '../../src/transactions/transaction.service';
import { 
  DatabaseException,
  ConnectionException,
  QueryException,
  TransactionException,
  IntegrityException,
  ConfigurationException
} from '../../src/errors/database-error.exception';
import { DatabaseErrorType, DatabaseErrorSeverity, DatabaseErrorRecoverability } from '../../src/errors/database-error.types';
import { RetryStrategyFactory } from '../../src/errors/retry-strategies';
import { ErrorTransformer } from '../../src/errors/error-transformer';
import { PrismaErrorHandler } from '../../src/errors/handlers/prisma-error.handler';
import { CommonErrorHandler } from '../../src/errors/handlers/common-error.handler';
import { 
  setupTestDatabase, 
  cleanupTestDatabase,
  generateUniqueId,
  createTestEntity,
  triggerDatabaseError
} from './helpers';

describe('Database Error Handling (E2E)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let transactionService: TransactionService;
  let retryStrategyFactory: RetryStrategyFactory;
  let errorTransformer: ErrorTransformer;
  let prismaErrorHandler: PrismaErrorHandler;
  let commonErrorHandler: CommonErrorHandler;

  beforeAll(async () => {
    // Set up test database
    await setupTestDatabase();

    // Create testing module
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get service instances
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    transactionService = moduleFixture.get<TransactionService>(TransactionService);
    retryStrategyFactory = moduleFixture.get<RetryStrategyFactory>(RetryStrategyFactory);
    errorTransformer = moduleFixture.get<ErrorTransformer>(ErrorTransformer);
    prismaErrorHandler = moduleFixture.get<PrismaErrorHandler>(PrismaErrorHandler);
    commonErrorHandler = moduleFixture.get<CommonErrorHandler>(CommonErrorHandler);
  });

  afterAll(async () => {
    // Clean up test database
    await cleanupTestDatabase();
    await app.close();
  });

  describe('Error Classification', () => {
    it('should classify connection errors correctly', async () => {
      // Simulate a connection error by providing invalid connection details
      try {
        await triggerDatabaseError('connection');
        fail('Expected connection error to be thrown');
      } catch (error) {
        // Verify error is transformed to a ConnectionException
        expect(error).toBeInstanceOf(ConnectionException);
        expect(error.errorType).toBe(DatabaseErrorType.CONNECTION);
        expect(error.severity).toBe(DatabaseErrorSeverity.CRITICAL);
        expect(error.recoverability).toBe(DatabaseErrorRecoverability.POTENTIALLY_RECOVERABLE);
        expect(error.code).toMatch(/^DB_CONN_/);
      }
    });

    it('should classify query errors correctly', async () => {
      // Simulate a query error by executing an invalid SQL query
      try {
        await triggerDatabaseError('query');
        fail('Expected query error to be thrown');
      } catch (error) {
        // Verify error is transformed to a QueryException
        expect(error).toBeInstanceOf(QueryException);
        expect(error.errorType).toBe(DatabaseErrorType.QUERY);
        expect(error.severity).toBe(DatabaseErrorSeverity.MAJOR);
        expect(error.code).toMatch(/^DB_QUERY_/);
      }
    });

    it('should classify transaction errors correctly', async () => {
      // Simulate a transaction error by causing a deadlock
      try {
        await triggerDatabaseError('transaction');
        fail('Expected transaction error to be thrown');
      } catch (error) {
        // Verify error is transformed to a TransactionException
        expect(error).toBeInstanceOf(TransactionException);
        expect(error.errorType).toBe(DatabaseErrorType.TRANSACTION);
        expect(error.severity).toBe(DatabaseErrorSeverity.MAJOR);
        expect(error.recoverability).toBe(DatabaseErrorRecoverability.RECOVERABLE);
        expect(error.code).toMatch(/^DB_TXN_/);
      }
    });

    it('should classify integrity errors correctly', async () => {
      // Simulate an integrity error by violating a unique constraint
      try {
        // Create an entity with a unique field
        const entity = await createTestEntity({ uniqueField: 'unique-value' });
        
        // Try to create another entity with the same unique field
        await createTestEntity({ uniqueField: 'unique-value' });
        fail('Expected integrity error to be thrown');
      } catch (error) {
        // Verify error is transformed to an IntegrityException
        expect(error).toBeInstanceOf(IntegrityException);
        expect(error.errorType).toBe(DatabaseErrorType.DATA_INTEGRITY);
        expect(error.severity).toBe(DatabaseErrorSeverity.MAJOR);
        expect(error.recoverability).toBe(DatabaseErrorRecoverability.NOT_RECOVERABLE);
        expect(error.code).toMatch(/^DB_INTEGRITY_/);
      }
    });

    it('should classify configuration errors correctly', async () => {
      // Simulate a configuration error
      try {
        await triggerDatabaseError('configuration');
        fail('Expected configuration error to be thrown');
      } catch (error) {
        // Verify error is transformed to a ConfigurationException
        expect(error).toBeInstanceOf(ConfigurationException);
        expect(error.errorType).toBe(DatabaseErrorType.CONFIGURATION);
        expect(error.severity).toBe(DatabaseErrorSeverity.CRITICAL);
        expect(error.code).toMatch(/^DB_CONFIG_/);
      }
    });
  });

  describe('Error Transformation', () => {
    it('should transform Prisma errors to appropriate DatabaseExceptions', async () => {
      // Test various Prisma error codes and verify transformation
      const prismaErrors = [
        { code: 'P1000', expectedType: ConnectionException },
        { code: 'P1001', expectedType: ConnectionException },
        { code: 'P1002', expectedType: ConnectionException },
        { code: 'P2002', expectedType: IntegrityException },
        { code: 'P2003', expectedType: IntegrityException },
        { code: 'P2025', expectedType: QueryException },
        { code: 'P2028', expectedType: QueryException },
        { code: 'P2034', expectedType: TransactionException },
      ];

      for (const testCase of prismaErrors) {
        const mockPrismaError = new Error('Prisma error');
        (mockPrismaError as any).code = testCase.code;
        
        const transformedError = errorTransformer.transformPrismaError(mockPrismaError);
        expect(transformedError).toBeInstanceOf(testCase.expectedType);
      }
    });

    it('should enrich errors with context information', async () => {
      // Create a mock error with context
      const mockError = new Error('Database error');
      const context = {
        operation: 'findUnique',
        model: 'User',
        args: { where: { id: 1 } },
        journey: 'health'
      };

      // Transform the error with context
      const transformedError = errorTransformer.transformWithContext(mockError, context);

      // Verify context is included in the transformed error
      expect(transformedError).toBeInstanceOf(DatabaseException);
      expect(transformedError.context).toEqual(expect.objectContaining({
        operation: 'findUnique',
        model: 'User',
        journey: 'health'
      }));
    });

    it('should include journey-specific information in transformed errors', async () => {
      // Test journey-specific error transformation for each journey
      const journeys = ['health', 'care', 'plan'];

      for (const journey of journeys) {
        const mockError = new Error('Database error');
        const context = { journey };

        const transformedError = errorTransformer.transformWithContext(mockError, context);

        expect(transformedError.context.journey).toBe(journey);
        // Journey-specific error codes should follow the pattern DB_<JOURNEY>_*
        if (transformedError.code.includes('_' + journey.toUpperCase() + '_')) {
          expect(transformedError.code).toMatch(new RegExp(`^DB_${journey.toUpperCase()}_`));
        }
      }
    });
  });

  describe('Retry Strategies', () => {
    it('should apply exponential backoff for transient errors', async () => {
      // Mock a transient error
      const transientError = new ConnectionException(
        'Temporary connection issue',
        {
          errorType: DatabaseErrorType.CONNECTION,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.RECOVERABLE,
          code: 'DB_CONN_TIMEOUT'
        }
      );

      // Get retry strategy for this error
      const retryStrategy = retryStrategyFactory.getStrategyForError(transientError);

      // Verify it's using exponential backoff
      expect(retryStrategy.constructor.name).toBe('ExponentialBackoffStrategy');
      
      // Test the backoff timing
      const delay1 = await retryStrategy.getNextDelay(1);
      const delay2 = await retryStrategy.getNextDelay(2);
      const delay3 = await retryStrategy.getNextDelay(3);

      // Verify exponential growth of delays
      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
      expect(delay3 / delay2).toBeCloseTo(delay2 / delay1, 0.5); // Roughly exponential
    });

    it('should use circuit breaker for severe connection issues', async () => {
      // Mock a severe connection error
      const severeError = new ConnectionException(
        'Severe connection failure',
        {
          errorType: DatabaseErrorType.CONNECTION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.POTENTIALLY_RECOVERABLE,
          code: 'DB_CONN_REFUSED'
        }
      );

      // Get retry strategy for this error
      const retryStrategy = retryStrategyFactory.getStrategyForError(severeError);

      // Verify it's using circuit breaker
      expect(retryStrategy.constructor.name).toBe('CircuitBreakerStrategy');
      
      // Simulate multiple failures to trip the circuit breaker
      for (let i = 0; i < 5; i++) {
        await retryStrategy.recordFailure();
      }

      // Verify circuit is open (no more retries)
      expect(await retryStrategy.shouldRetry()).toBe(false);
    });

    it('should not retry for non-recoverable errors', async () => {
      // Mock a non-recoverable error
      const nonRecoverableError = new IntegrityException(
        'Unique constraint violation',
        {
          errorType: DatabaseErrorType.DATA_INTEGRITY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.NOT_RECOVERABLE,
          code: 'DB_INTEGRITY_UNIQUE_VIOLATION'
        }
      );

      // Get retry strategy for this error
      const retryStrategy = retryStrategyFactory.getStrategyForError(nonRecoverableError);

      // Verify it's using no-retry strategy
      expect(retryStrategy.constructor.name).toBe('NoRetryStrategy');
      expect(await retryStrategy.shouldRetry()).toBe(false);
    });

    it('should adapt retry strategy based on operation context', async () => {
      // Create the same error type but with different operation contexts
      const baseError = new QueryException(
        'Query timeout',
        {
          errorType: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.RECOVERABLE,
          code: 'DB_QUERY_TIMEOUT'
        }
      );

      // Add different contexts
      const readContext = { ...baseError.context, operation: 'findMany', isReadOperation: true };
      const writeContext = { ...baseError.context, operation: 'create', isReadOperation: false };
      
      const readError = new QueryException(baseError.message, readContext);
      const writeError = new QueryException(baseError.message, writeContext);

      // Get retry strategies
      const readStrategy = retryStrategyFactory.getStrategyForError(readError);
      const writeStrategy = retryStrategyFactory.getStrategyForError(writeError);

      // Read operations should have more aggressive retry (more attempts)
      const readMaxAttempts = readStrategy['maxAttempts']; // Access private property for testing
      const writeMaxAttempts = writeStrategy['maxAttempts']; // Access private property for testing

      expect(readMaxAttempts).toBeGreaterThanOrEqual(writeMaxAttempts);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from transient connection errors with retry', async () => {
      // Set up a test that will fail on first attempt but succeed on retry
      let attempts = 0;
      const testFunctionWithRetry = async () => {
        try {
          if (attempts === 0) {
            attempts++;
            // Simulate a transient connection error on first attempt
            throw new ConnectionException(
              'Temporary connection issue',
              {
                errorType: DatabaseErrorType.CONNECTION,
                severity: DatabaseErrorSeverity.MAJOR,
                recoverability: DatabaseErrorRecoverability.RECOVERABLE,
                code: 'DB_CONN_TIMEOUT'
              }
            );
          }
          // Second attempt succeeds
          return { success: true };
        } catch (error) {
          // Apply retry strategy
          const retryStrategy = retryStrategyFactory.getStrategyForError(error);
          if (await retryStrategy.shouldRetry()) {
            const delay = await retryStrategy.getNextDelay(1);
            await new Promise(resolve => setTimeout(resolve, delay));
            // Retry the operation
            return testFunctionWithRetry();
          }
          throw error;
        }
      };

      const result = await testFunctionWithRetry();
      expect(result.success).toBe(true);
      expect(attempts).toBe(1); // Verify first attempt failed and triggered retry
    });

    it('should recover from deadlocks with transaction retry', async () => {
      // Set up a test that simulates a deadlock on first attempt
      let attempts = 0;
      const testTransactionWithRetry = async () => {
        try {
          return await transactionService.executeInTransaction(async (tx) => {
            if (attempts === 0) {
              attempts++;
              // Simulate a deadlock on first attempt
              throw new TransactionException(
                'Deadlock detected',
                {
                  errorType: DatabaseErrorType.TRANSACTION,
                  severity: DatabaseErrorSeverity.MAJOR,
                  recoverability: DatabaseErrorRecoverability.RECOVERABLE,
                  code: 'DB_TXN_DEADLOCK'
                }
              );
            }
            // Second attempt succeeds
            return { success: true };
          });
        } catch (error) {
          if (error instanceof TransactionException && 
              error.recoverability === DatabaseErrorRecoverability.RECOVERABLE) {
            // For deadlocks, we should retry the entire transaction
            const retryStrategy = retryStrategyFactory.getStrategyForError(error);
            if (await retryStrategy.shouldRetry()) {
              const delay = await retryStrategy.getNextDelay(1);
              await new Promise(resolve => setTimeout(resolve, delay));
              // Retry the transaction
              return testTransactionWithRetry();
            }
          }
          throw error;
        }
      };

      const result = await testTransactionWithRetry();
      expect(result.success).toBe(true);
      expect(attempts).toBe(1); // Verify first attempt failed and triggered retry
    });

    it('should handle connection pool exhaustion with queuing', async () => {
      // Simulate connection pool exhaustion by creating many concurrent requests
      const concurrentRequests = 50; // More than the default pool size
      const results = await Promise.all(
        Array(concurrentRequests).fill(0).map(async (_, index) => {
          try {
            // Simple query that should be queued if pool is exhausted
            const result = await prismaService.$queryRaw`SELECT ${index} as id`;
            return { success: true, id: result[0].id };
          } catch (error) {
            return { success: false, error };
          }
        })
      );

      // All requests should eventually succeed despite pool exhaustion
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBe(concurrentRequests);
      
      // Verify all IDs are returned correctly (in any order)
      const returnedIds = results.map(r => r.id).sort((a, b) => a - b);
      const expectedIds = Array(concurrentRequests).fill(0).map((_, i) => i).sort((a, b) => a - b);
      expect(returnedIds).toEqual(expectedIds);
    });

    it('should implement graceful degradation for partial system failures', async () => {
      // Simulate a scenario where one database operation fails but others succeed
      const operations = [
        // This operation will succeed
        prismaService.$queryRaw`SELECT 1 as success`,
        
        // This operation will fail with a syntax error
        prismaService.$queryRaw`INVALID SQL QUERY`.catch(error => {
          // Transform the error but don't throw it
          return { error: errorTransformer.transform(error) };
        }),
        
        // This operation will succeed
        prismaService.$queryRaw`SELECT 2 as success`
      ];

      const results = await Promise.all(operations);

      // First operation should succeed
      expect(results[0][0].success).toBe(1);
      
      // Second operation should fail but be handled
      expect(results[1].error).toBeInstanceOf(QueryException);
      
      // Third operation should succeed despite previous failure
      expect(results[2][0].success).toBe(2);
    });
  });

  describe('Error Propagation', () => {
    it('should propagate errors with appropriate context through layers', async () => {
      // Define a layered architecture simulation
      const dataAccessLayer = async () => {
        try {
          // Trigger a database error
          await triggerDatabaseError('query');
        } catch (error) {
          // Add data access layer context
          const enrichedError = errorTransformer.transformWithContext(error, {
            layer: 'data-access',
            repository: 'UserRepository',
            method: 'findById'
          });
          throw enrichedError;
        }
      };

      const servicelayer = async () => {
        try {
          await dataAccessLayer();
        } catch (error) {
          // Add service layer context
          const enrichedError = errorTransformer.transformWithContext(error, {
            layer: 'service',
            service: 'UserService',
            method: 'getUserProfile'
          });
          throw enrichedError;
        }
      };

      const controllerLayer = async () => {
        try {
          await servicelayer();
        } catch (error) {
          // Add controller layer context
          const enrichedError = errorTransformer.transformWithContext(error, {
            layer: 'controller',
            controller: 'UserController',
            endpoint: 'GET /users/:id'
          });
          throw enrichedError;
        }
      };

      try {
        await controllerLayer();
        fail('Expected error to be thrown');
      } catch (error) {
        // Verify error has context from all layers
        expect(error).toBeInstanceOf(QueryException);
        expect(error.context).toEqual(expect.objectContaining({
          layer: 'controller',
          controller: 'UserController',
          endpoint: 'GET /users/:id'
        }));
        
        // Error should maintain the original error properties
        expect(error.errorType).toBe(DatabaseErrorType.QUERY);
        expect(error.code).toMatch(/^DB_QUERY_/);
        
        // Error should have a stack trace
        expect(error.stack).toBeDefined();
        
        // Error should have a structured error path showing propagation
        expect(error.errorPath).toEqual(expect.arrayContaining([
          expect.objectContaining({ layer: 'data-access' }),
          expect.objectContaining({ layer: 'service' }),
          expect.objectContaining({ layer: 'controller' })
        ]));
      }
    });

    it('should maintain error identity through async boundaries', async () => {
      // Create a unique error identifier
      const errorId = generateUniqueId();
      
      // Function that creates an error and passes it through async boundaries
      const createErrorAsync = async () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            const error = new QueryException(
              'Async boundary test error',
              {
                errorType: DatabaseErrorType.QUERY,
                severity: DatabaseErrorSeverity.MAJOR,
                recoverability: DatabaseErrorRecoverability.RECOVERABLE,
                code: 'DB_QUERY_TEST',
                errorId
              }
            );
            resolve(error);
          }, 10);
        });
      };

      const propagateErrorAsync = async (error: any) => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(error);
          }, 10);
        });
      };

      try {
        const error = await createErrorAsync();
        await propagateErrorAsync(error);
        fail('Expected error to be thrown');
      } catch (error) {
        // Verify error maintains its identity through async boundaries
        expect(error).toBeInstanceOf(QueryException);
        expect(error.context.errorId).toBe(errorId);
      }
    });

    it('should convert errors to appropriate response formats', async () => {
      // Create a database error
      const dbError = new QueryException(
        'Invalid query parameter',
        {
          errorType: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.NOT_RECOVERABLE,
          code: 'DB_QUERY_INVALID_PARAMETER',
          parameter: 'userId',
          journey: 'health'
        }
      );

      // Convert to API response format
      const errorResponse = dbError.toResponse();

      // Verify response format is appropriate for clients
      expect(errorResponse).toEqual(expect.objectContaining({
        statusCode: expect.any(Number),
        error: expect.any(String),
        message: expect.any(String),
        code: 'DB_QUERY_INVALID_PARAMETER',
        journey: 'health'
      }));

      // Sensitive information should be excluded
      expect(errorResponse).not.toHaveProperty('stack');
      expect(errorResponse).not.toHaveProperty('severity');
      expect(errorResponse).not.toHaveProperty('recoverability');
    });
  });

  describe('Journey-Specific Error Handling', () => {
    it('should handle health journey specific database errors', async () => {
      // Simulate a health journey specific error (e.g., TimescaleDB hypertable error)
      try {
        await triggerDatabaseError('health-metrics');
        fail('Expected health journey error to be thrown');
      } catch (error) {
        // Verify error has health journey context
        expect(error).toBeInstanceOf(DatabaseException);
        expect(error.context.journey).toBe('health');
        expect(error.code).toMatch(/^DB_HEALTH_/);
      }
    });

    it('should handle care journey specific database errors', async () => {
      // Simulate a care journey specific error
      try {
        await triggerDatabaseError('care-appointment');
        fail('Expected care journey error to be thrown');
      } catch (error) {
        // Verify error has care journey context
        expect(error).toBeInstanceOf(DatabaseException);
        expect(error.context.journey).toBe('care');
        expect(error.code).toMatch(/^DB_CARE_/);
      }
    });

    it('should handle plan journey specific database errors', async () => {
      // Simulate a plan journey specific error
      try {
        await triggerDatabaseError('plan-claim');
        fail('Expected plan journey error to be thrown');
      } catch (error) {
        // Verify error has plan journey context
        expect(error).toBeInstanceOf(DatabaseException);
        expect(error.context.journey).toBe('plan');
        expect(error.code).toMatch(/^DB_PLAN_/);
      }
    });
  });
});
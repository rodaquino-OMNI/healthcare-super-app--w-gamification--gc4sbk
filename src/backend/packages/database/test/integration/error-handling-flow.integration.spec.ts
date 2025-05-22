import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { DatabaseModule } from '../../src/database.module';
import { PrismaService } from '../../src/connection/prisma.service';
import { RedisService } from '../../src/connection/redis.service';
import { ConnectionManager } from '../../src/connection/connection-manager';
import { RetryStrategyFactory } from '../../src/errors/retry-strategies';
import { CircuitBreakerService } from '../../src/errors/circuit-breaker.service';
import { ErrorTransformer } from '../../src/errors/error-transformer';
import {
  DatabaseException,
  ConnectionException,
  QueryException,
  TransactionException,
  IntegrityException,
  ConfigurationException
} from '../../src/errors/database-error.exception';
import { DatabaseErrorType, DatabaseErrorSeverity, DatabaseErrorRecoverability } from '../../src/errors/database-error.types';
import { TransactionService } from '../../src/transactions/transaction.service';
import { PrismaErrorHandler } from '../../src/errors/handlers/prisma-error.handler';
import { RedisErrorHandler } from '../../src/errors/handlers/redis-error.handler';
import { CommonErrorHandler } from '../../src/errors/handlers/common-error.handler';

// Mock implementations
class MockPrismaClient {
  async $connect() { return Promise.resolve(); }
  async $disconnect() { return Promise.resolve(); }
  async $executeRaw() { return Promise.resolve(1); }
  async $queryRaw() { return Promise.resolve([]); }
  async $transaction() { return Promise.resolve(); }
}

class MockRedisClient {
  async connect() { return Promise.resolve(); }
  async disconnect() { return Promise.resolve(); }
  async get() { return Promise.resolve(null); }
  async set() { return Promise.resolve('OK'); }
}

// Mock error factory to simulate different database errors
class ErrorFactory {
  static createPrismaConnectionError(): Error {
    const error = new Error('Connection refused');
    error['code'] = 'P1001';
    error['clientVersion'] = '4.5.0';
    return error;
  }

  static createPrismaQueryError(): Error {
    const error = new Error('Query failed');
    error['code'] = 'P2010';
    error['clientVersion'] = '4.5.0';
    error['meta'] = { target: 'users' };
    return error;
  }

  static createPrismaUniqueConstraintError(): Error {
    const error = new Error('Unique constraint violation');
    error['code'] = 'P2002';
    error['clientVersion'] = '4.5.0';
    error['meta'] = { target: ['email'] };
    return error;
  }

  static createRedisConnectionError(): Error {
    const error = new Error('Connection refused');
    error['name'] = 'ReplyError';
    error['command'] = 'GET';
    return error;
  }

  static createRedisCommandError(): Error {
    const error = new Error('WRONGTYPE Operation against a key holding the wrong kind of value');
    error['name'] = 'ReplyError';
    error['command'] = 'GET';
    return error;
  }

  static createGenericDatabaseError(): Error {
    return new Error('Database operation failed');
  }

  static createTransactionError(): Error {
    const error = new Error('Transaction aborted');
    error['code'] = 'P2034';
    error['clientVersion'] = '4.5.0';
    return error;
  }
}

describe('Database Error Handling Flow Integration', () => {
  let module: TestingModule;
  let prismaService: PrismaService;
  let redisService: RedisService;
  let connectionManager: ConnectionManager;
  let retryStrategyFactory: RetryStrategyFactory;
  let circuitBreakerService: CircuitBreakerService;
  let errorTransformer: ErrorTransformer;
  let transactionService: TransactionService;
  let prismaErrorHandler: PrismaErrorHandler;
  let redisErrorHandler: RedisErrorHandler;
  let commonErrorHandler: CommonErrorHandler;

  beforeEach(async () => {
    // Create a testing module with all required components
    module = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [
        {
          provide: PrismaClient,
          useClass: MockPrismaClient,
        },
        {
          provide: Redis,
          useClass: MockRedisClient,
        },
      ],
    }).compile();

    // Get service instances
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
    connectionManager = module.get<ConnectionManager>(ConnectionManager);
    retryStrategyFactory = module.get<RetryStrategyFactory>(RetryStrategyFactory);
    circuitBreakerService = module.get<CircuitBreakerService>(CircuitBreakerService);
    errorTransformer = module.get<ErrorTransformer>(ErrorTransformer);
    transactionService = module.get<TransactionService>(TransactionService);
    prismaErrorHandler = module.get<PrismaErrorHandler>(PrismaErrorHandler);
    redisErrorHandler = module.get<RedisErrorHandler>(RedisErrorHandler);
    commonErrorHandler = module.get<CommonErrorHandler>(CommonErrorHandler);

    // Setup spies
    jest.spyOn(prismaErrorHandler, 'handle');
    jest.spyOn(redisErrorHandler, 'handle');
    jest.spyOn(commonErrorHandler, 'handle');
    jest.spyOn(errorTransformer, 'transform');
    jest.spyOn(retryStrategyFactory, 'createStrategy');
    jest.spyOn(circuitBreakerService, 'isOpen');
    jest.spyOn(circuitBreakerService, 'recordSuccess');
    jest.spyOn(circuitBreakerService, 'recordFailure');
  });

  afterEach(async () => {
    await module.close();
    jest.clearAllMocks();
  });

  describe('Error Transformation Flow', () => {
    it('should transform Prisma connection errors into ConnectionException', async () => {
      // Arrange
      const originalError = ErrorFactory.createPrismaConnectionError();
      jest.spyOn(prismaService, '$connect').mockRejectedValueOnce(originalError);

      // Act & Assert
      await expect(connectionManager.getConnection('default')).rejects.toThrow(ConnectionException);
      expect(errorTransformer.transform).toHaveBeenCalled();
      expect(prismaErrorHandler.handle).toHaveBeenCalledWith(originalError, expect.any(Object));
    });

    it('should transform Prisma query errors into QueryException', async () => {
      // Arrange
      const originalError = ErrorFactory.createPrismaQueryError();
      jest.spyOn(prismaService, '$queryRaw').mockRejectedValueOnce(originalError);

      // Act & Assert
      await expect(prismaService.$queryRaw`SELECT * FROM users`).rejects.toThrow(QueryException);
      expect(errorTransformer.transform).toHaveBeenCalled();
      expect(prismaErrorHandler.handle).toHaveBeenCalledWith(originalError, expect.any(Object));
    });

    it('should transform Prisma unique constraint errors into IntegrityException', async () => {
      // Arrange
      const originalError = ErrorFactory.createPrismaUniqueConstraintError();
      jest.spyOn(prismaService, '$executeRaw').mockRejectedValueOnce(originalError);

      // Act & Assert
      await expect(prismaService.$executeRaw`INSERT INTO users (email) VALUES ('test@example.com')`).rejects.toThrow(IntegrityException);
      expect(errorTransformer.transform).toHaveBeenCalled();
      expect(prismaErrorHandler.handle).toHaveBeenCalledWith(originalError, expect.any(Object));
    });

    it('should transform Redis connection errors into ConnectionException', async () => {
      // Arrange
      const originalError = ErrorFactory.createRedisConnectionError();
      jest.spyOn(redisService, 'get').mockRejectedValueOnce(originalError);

      // Act & Assert
      await expect(redisService.get('test-key')).rejects.toThrow(ConnectionException);
      expect(errorTransformer.transform).toHaveBeenCalled();
      expect(redisErrorHandler.handle).toHaveBeenCalledWith(originalError, expect.any(Object));
    });

    it('should transform Redis command errors into QueryException', async () => {
      // Arrange
      const originalError = ErrorFactory.createRedisCommandError();
      jest.spyOn(redisService, 'get').mockRejectedValueOnce(originalError);

      // Act & Assert
      await expect(redisService.get('test-key')).rejects.toThrow(QueryException);
      expect(errorTransformer.transform).toHaveBeenCalled();
      expect(redisErrorHandler.handle).toHaveBeenCalledWith(originalError, expect.any(Object));
    });

    it('should transform generic database errors using CommonErrorHandler', async () => {
      // Arrange
      const originalError = ErrorFactory.createGenericDatabaseError();
      jest.spyOn(prismaService, '$queryRaw').mockRejectedValueOnce(originalError);

      // Act & Assert
      await expect(prismaService.$queryRaw`SELECT * FROM users`).rejects.toThrow(DatabaseException);
      expect(errorTransformer.transform).toHaveBeenCalled();
      expect(commonErrorHandler.handle).toHaveBeenCalledWith(originalError, expect.any(Object));
    });
  });

  describe('Error Classification Flow', () => {
    it('should correctly classify connection errors with appropriate severity and recoverability', async () => {
      // Arrange
      const originalError = ErrorFactory.createPrismaConnectionError();
      jest.spyOn(prismaService, '$connect').mockRejectedValueOnce(originalError);

      // Act
      try {
        await connectionManager.getConnection('default');
        fail('Expected error was not thrown');
      } catch (error) {
        // Assert
        expect(error).toBeInstanceOf(ConnectionException);
        expect(error.type).toBe(DatabaseErrorType.CONNECTION);
        expect(error.severity).toBe(DatabaseErrorSeverity.CRITICAL);
        expect(error.recoverability).toBe(DatabaseErrorRecoverability.TRANSIENT);
        expect(error.context).toHaveProperty('journey');
        expect(error.context).toHaveProperty('operation');
      }
    });

    it('should correctly classify integrity errors with appropriate severity and recoverability', async () => {
      // Arrange
      const originalError = ErrorFactory.createPrismaUniqueConstraintError();
      jest.spyOn(prismaService, '$executeRaw').mockRejectedValueOnce(originalError);

      // Act
      try {
        await prismaService.$executeRaw`INSERT INTO users (email) VALUES ('test@example.com')`;
        fail('Expected error was not thrown');
      } catch (error) {
        // Assert
        expect(error).toBeInstanceOf(IntegrityException);
        expect(error.type).toBe(DatabaseErrorType.INTEGRITY);
        expect(error.severity).toBe(DatabaseErrorSeverity.MAJOR);
        expect(error.recoverability).toBe(DatabaseErrorRecoverability.PERMANENT);
        expect(error.context).toHaveProperty('entity');
        expect(error.context).toHaveProperty('constraint');
      }
    });

    it('should correctly classify transaction errors with appropriate severity and recoverability', async () => {
      // Arrange
      const originalError = ErrorFactory.createTransactionError();
      jest.spyOn(transactionService, 'startTransaction').mockRejectedValueOnce(originalError);

      // Act
      try {
        await transactionService.startTransaction();
        fail('Expected error was not thrown');
      } catch (error) {
        // Assert
        expect(error).toBeInstanceOf(TransactionException);
        expect(error.type).toBe(DatabaseErrorType.TRANSACTION);
        expect(error.severity).toBe(DatabaseErrorSeverity.MAJOR);
        expect(error.recoverability).toBe(DatabaseErrorRecoverability.TRANSIENT);
        expect(error.context).toHaveProperty('transactionId');
      }
    });
  });

  describe('Retry Strategy Flow', () => {
    it('should select exponential backoff strategy for transient connection errors', async () => {
      // Arrange
      const originalError = ErrorFactory.createPrismaConnectionError();
      jest.spyOn(prismaService, '$connect')
        .mockRejectedValueOnce(originalError)
        .mockRejectedValueOnce(originalError)
        .mockResolvedValueOnce(undefined);

      // Mock the retry strategy to resolve after a few attempts
      jest.spyOn(retryStrategyFactory, 'createStrategy').mockImplementation(() => ({
        execute: jest.fn().mockImplementation(async (fn) => {
          // Simulate retry logic by calling the function again
          return fn();
        }),
        getMaxAttempts: jest.fn().mockReturnValue(3),
        getNextDelay: jest.fn().mockReturnValue(100),
      }));

      // Act
      await connectionManager.getConnection('default', { retry: true });

      // Assert
      expect(retryStrategyFactory.createStrategy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: DatabaseErrorType.CONNECTION,
          recoverability: DatabaseErrorRecoverability.TRANSIENT
        })
      );
      expect(prismaService.$connect).toHaveBeenCalledTimes(3);
    });

    it('should not retry permanent integrity errors', async () => {
      // Arrange
      const originalError = ErrorFactory.createPrismaUniqueConstraintError();
      jest.spyOn(prismaService, '$executeRaw').mockRejectedValueOnce(originalError);

      // Act & Assert
      await expect(prismaService.$executeRaw`INSERT INTO users (email) VALUES ('test@example.com')`).rejects.toThrow(IntegrityException);
      expect(retryStrategyFactory.createStrategy).not.toHaveBeenCalled();
      expect(prismaService.$executeRaw).toHaveBeenCalledTimes(1);
    });
  });

  describe('Circuit Breaker Flow', () => {
    it('should open circuit breaker after multiple connection failures', async () => {
      // Arrange
      const originalError = ErrorFactory.createPrismaConnectionError();
      jest.spyOn(prismaService, '$connect').mockRejectedValue(originalError);
      
      // Mock circuit breaker to open after 3 failures
      jest.spyOn(circuitBreakerService, 'isOpen')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      // Act
      try {
        await connectionManager.getConnection('default');
        fail('Expected error was not thrown');
      } catch (error) {
        // First attempt fails normally
        expect(error).toBeInstanceOf(ConnectionException);
      }

      // Record failures to trigger circuit breaker
      circuitBreakerService.recordFailure('database:connection:default');
      circuitBreakerService.recordFailure('database:connection:default');
      circuitBreakerService.recordFailure('database:connection:default');

      // Act again with circuit breaker open
      try {
        await connectionManager.getConnection('default');
        fail('Expected error was not thrown');
      } catch (error) {
        // Assert that we get a circuit breaker exception
        expect(error).toBeInstanceOf(ConnectionException);
        expect(error.message).toContain('Circuit breaker open');
        expect(circuitBreakerService.isOpen).toHaveBeenCalledWith('database:connection:default');
      }
    });

    it('should close circuit breaker after successful operation', async () => {
      // Arrange
      jest.spyOn(circuitBreakerService, 'isOpen').mockReturnValue(false);
      jest.spyOn(prismaService, '$connect').mockResolvedValue(undefined);

      // Act
      await connectionManager.getConnection('default');

      // Assert
      expect(circuitBreakerService.recordSuccess).toHaveBeenCalledWith('database:connection:default');
    });
  });

  describe('Context Enrichment Flow', () => {
    it('should enrich errors with operation context', async () => {
      // Arrange
      const originalError = ErrorFactory.createPrismaQueryError();
      const operationContext = {
        journey: 'health',
        entity: 'HealthMetric',
        operation: 'findMany',
        query: 'SELECT * FROM health_metrics WHERE user_id = ?',
        parameters: ['user123'],
      };

      jest.spyOn(prismaService, '$queryRaw').mockRejectedValueOnce(originalError);
      jest.spyOn(errorTransformer, 'transform').mockImplementation((error, context) => {
        const dbError = new QueryException('Query failed', {
          cause: error,
          context: { ...context, ...operationContext },
        });
        dbError.type = DatabaseErrorType.QUERY;
        dbError.severity = DatabaseErrorSeverity.MAJOR;
        dbError.recoverability = DatabaseErrorRecoverability.TRANSIENT;
        return dbError;
      });

      // Act
      try {
        await prismaService.$queryRaw`SELECT * FROM health_metrics WHERE user_id = ${operationContext.parameters[0]}`;
        fail('Expected error was not thrown');
      } catch (error) {
        // Assert
        expect(error).toBeInstanceOf(QueryException);
        expect(error.context).toMatchObject(operationContext);
      }
    });

    it('should enrich errors with journey-specific context', async () => {
      // Arrange
      const originalError = ErrorFactory.createPrismaUniqueConstraintError();
      const journeyContext = {
        journey: 'care',
        entity: 'Appointment',
        userId: 'user123',
        appointmentId: 'appt456',
        providerInfo: {
          id: 'provider789',
          specialty: 'Cardiology',
        },
      };

      jest.spyOn(prismaService, '$executeRaw').mockRejectedValueOnce(originalError);
      jest.spyOn(errorTransformer, 'transform').mockImplementation((error, context) => {
        const dbError = new IntegrityException('Unique constraint violation', {
          cause: error,
          context: { ...context, ...journeyContext },
        });
        dbError.type = DatabaseErrorType.INTEGRITY;
        dbError.severity = DatabaseErrorSeverity.MAJOR;
        dbError.recoverability = DatabaseErrorRecoverability.PERMANENT;
        return dbError;
      });

      // Act
      try {
        await prismaService.$executeRaw`INSERT INTO appointments (id, user_id, provider_id) VALUES ('appt456', 'user123', 'provider789')`;
        fail('Expected error was not thrown');
      } catch (error) {
        // Assert
        expect(error).toBeInstanceOf(IntegrityException);
        expect(error.context).toMatchObject(journeyContext);
      }
    });
  });

  describe('End-to-End Error Flow', () => {
    it('should handle the complete error flow from database error to application exception', async () => {
      // Arrange
      const originalError = ErrorFactory.createPrismaConnectionError();
      jest.spyOn(prismaService, '$connect').mockRejectedValueOnce(originalError);
      
      // Mock circuit breaker to be closed
      jest.spyOn(circuitBreakerService, 'isOpen').mockReturnValue(false);
      
      // Mock retry strategy to fail after attempts
      jest.spyOn(retryStrategyFactory, 'createStrategy').mockImplementation(() => ({
        execute: jest.fn().mockImplementation(async (fn) => {
          try {
            return await fn();
          } catch (error) {
            throw error;
          }
        }),
        getMaxAttempts: jest.fn().mockReturnValue(3),
        getNextDelay: jest.fn().mockReturnValue(100),
      }));

      // Act
      try {
        await connectionManager.getConnection('default', { 
          retry: true,
          context: {
            journey: 'health',
            operation: 'getHealthMetrics',
            userId: 'user123',
          }
        });
        fail('Expected error was not thrown');
      } catch (error) {
        // Assert
        // 1. Verify error transformation
        expect(error).toBeInstanceOf(ConnectionException);
        expect(errorTransformer.transform).toHaveBeenCalled();
        expect(prismaErrorHandler.handle).toHaveBeenCalled();
        
        // 2. Verify error classification
        expect(error.type).toBe(DatabaseErrorType.CONNECTION);
        expect(error.severity).toBe(DatabaseErrorSeverity.CRITICAL);
        expect(error.recoverability).toBe(DatabaseErrorRecoverability.TRANSIENT);
        
        // 3. Verify retry attempt
        expect(retryStrategyFactory.createStrategy).toHaveBeenCalled();
        
        // 4. Verify circuit breaker check
        expect(circuitBreakerService.isOpen).toHaveBeenCalled();
        expect(circuitBreakerService.recordFailure).toHaveBeenCalled();
        
        // 5. Verify context enrichment
        expect(error.context).toHaveProperty('journey', 'health');
        expect(error.context).toHaveProperty('operation', 'getHealthMetrics');
        expect(error.context).toHaveProperty('userId', 'user123');
        
        // 6. Verify original error is preserved
        expect(error.cause).toBe(originalError);
      }
    });
  });
});
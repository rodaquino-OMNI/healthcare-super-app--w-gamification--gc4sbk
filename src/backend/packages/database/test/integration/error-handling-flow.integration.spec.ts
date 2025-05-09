import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma.service';
import { DatabaseModule } from '../../src/database.module';
import {
  DatabaseException,
  ConnectionException,
  QueryException,
  TransactionException,
  IntegrityException,
  ConfigurationException,
  DatabaseErrorType,
  DatabaseErrorSeverity,
  DatabaseErrorRecoverability,
} from '../../src/errors/database-error.exception';
import { ErrorTransformer } from '../../src/errors/error-transformer';
import {
  RetryStrategy,
  ExponentialBackoffStrategy,
  CircuitBreakerStrategy,
  RetryStrategyFactory,
} from '../../src/errors/retry-strategies';
import { CircuitBreakerMiddleware } from '../../src/middleware/circuit-breaker.middleware';
import { TransactionService } from '../../src/transactions/transaction.service';
import { TransactionIsolationLevel } from '../../src/transactions/transaction.interface';
import { Prisma } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { databaseTestUtils } from '../utils';
import { journeyContextMock, prismaServiceMock } from '../mocks';

// Mock the PrismaClient to avoid actual database connections
jest.mock('@prisma/client', () => {
  const originalModule = jest.requireActual('@prisma/client');
  const mockPrismaClient = jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
    $on: jest.fn(),
    $use: jest.fn(),
  }));
  return {
    ...originalModule,
    PrismaClient: mockPrismaClient,
  };
});

describe('Error Handling Flow Integration', () => {
  let module: TestingModule;
  let prismaService: PrismaService;
  let errorTransformer: ErrorTransformer;
  let retryStrategyFactory: RetryStrategyFactory;
  let circuitBreakerMiddleware: CircuitBreakerMiddleware;
  let transactionService: TransactionService;
  let mockPrismaClient: DeepMockProxy<Prisma.TransactionClient>;

  beforeAll(async () => {
    // Create a test module with all necessary components
    module = await Test.createTestingModule({
      imports: [DatabaseModule.forRoot({ isTest: true })],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaServiceMock)
      .compile();

    // Get service instances
    prismaService = module.get<PrismaService>(PrismaService);
    errorTransformer = module.get<ErrorTransformer>(ErrorTransformer);
    retryStrategyFactory = module.get<RetryStrategyFactory>(RetryStrategyFactory);
    circuitBreakerMiddleware = module.get<CircuitBreakerMiddleware>(CircuitBreakerMiddleware);
    transactionService = module.get<TransactionService>(TransactionService);

    // Create a mock Prisma client for transaction testing
    mockPrismaClient = mockDeep<Prisma.TransactionClient>();
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockReset(mockPrismaClient);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Error Transformation Flow', () => {
    it('should transform Prisma connection errors to ConnectionException', async () => {
      // Arrange
      const prismaError = new PrismaClientKnownRequestError('Connection refused', {
        code: 'P1001',
        clientVersion: '4.8.0',
      });
      
      // Mock the PrismaService to throw the connection error
      jest.spyOn(prismaService, 'user').mockImplementation(() => {
        return {
          findUnique: jest.fn().mockRejectedValue(prismaError),
        } as any;
      });

      // Act & Assert
      await expect(prismaService.user.findUnique({ where: { id: 1 } }))
        .rejects
        .toThrow(ConnectionException);
      
      // Verify error properties
      try {
        await prismaService.user.findUnique({ where: { id: 1 } });
      } catch (error) {
        expect(error).toBeInstanceOf(ConnectionException);
        expect(error.errorType).toBe(DatabaseErrorType.CONNECTION);
        expect(error.severity).toBe(DatabaseErrorSeverity.CRITICAL);
        expect(error.recoverability).toBe(DatabaseErrorRecoverability.TRANSIENT);
        expect(error.context).toHaveProperty('operation');
        expect(error.context).toHaveProperty('query');
      }
    });

    it('should transform Prisma query errors to QueryException', async () => {
      // Arrange
      const prismaError = new PrismaClientKnownRequestError('Query interpretation error', {
        code: 'P2010',
        clientVersion: '4.8.0',
      });
      
      // Mock the PrismaService to throw the query error
      jest.spyOn(prismaService, 'user').mockImplementation(() => {
        return {
          findMany: jest.fn().mockRejectedValue(prismaError),
        } as any;
      });

      // Act & Assert
      await expect(prismaService.user.findMany())
        .rejects
        .toThrow(QueryException);
      
      // Verify error properties
      try {
        await prismaService.user.findMany();
      } catch (error) {
        expect(error).toBeInstanceOf(QueryException);
        expect(error.errorType).toBe(DatabaseErrorType.QUERY);
        expect(error.severity).toBe(DatabaseErrorSeverity.MAJOR);
        expect(error.recoverability).toBe(DatabaseErrorRecoverability.PERMANENT);
        expect(error.context).toHaveProperty('operation');
        expect(error.context).toHaveProperty('query');
      }
    });

    it('should transform Prisma validation errors to QueryException', async () => {
      // Arrange
      const prismaError = new PrismaClientValidationError('Invalid argument provided');
      
      // Mock the PrismaService to throw the validation error
      jest.spyOn(prismaService, 'user').mockImplementation(() => {
        return {
          create: jest.fn().mockRejectedValue(prismaError),
        } as any;
      });

      // Act & Assert
      await expect(prismaService.user.create({ data: {} as any }))
        .rejects
        .toThrow(QueryException);
      
      // Verify error properties
      try {
        await prismaService.user.create({ data: {} as any });
      } catch (error) {
        expect(error).toBeInstanceOf(QueryException);
        expect(error.errorType).toBe(DatabaseErrorType.QUERY);
        expect(error.severity).toBe(DatabaseErrorSeverity.MINOR);
        expect(error.recoverability).toBe(DatabaseErrorRecoverability.PERMANENT);
        expect(error.context).toHaveProperty('operation');
        expect(error.context).toHaveProperty('query');
      }
    });

    it('should transform Prisma constraint errors to IntegrityException', async () => {
      // Arrange
      const prismaError = new PrismaClientKnownRequestError('Unique constraint violation', {
        code: 'P2002',
        clientVersion: '4.8.0',
        meta: { target: ['email'] },
      });
      
      // Mock the PrismaService to throw the constraint error
      jest.spyOn(prismaService, 'user').mockImplementation(() => {
        return {
          create: jest.fn().mockRejectedValue(prismaError),
        } as any;
      });

      // Act & Assert
      await expect(prismaService.user.create({ 
        data: { email: 'existing@example.com', name: 'Test User' } as any 
      }))
        .rejects
        .toThrow(IntegrityException);
      
      // Verify error properties
      try {
        await prismaService.user.create({ 
          data: { email: 'existing@example.com', name: 'Test User' } as any 
        });
      } catch (error) {
        expect(error).toBeInstanceOf(IntegrityException);
        expect(error.errorType).toBe(DatabaseErrorType.INTEGRITY);
        expect(error.severity).toBe(DatabaseErrorSeverity.MAJOR);
        expect(error.recoverability).toBe(DatabaseErrorRecoverability.PERMANENT);
        expect(error.context).toHaveProperty('operation');
        expect(error.context).toHaveProperty('query');
        expect(error.context).toHaveProperty('constraint');
        expect(error.context.constraint).toEqual('email');
      }
    });
  });

  describe('Retry Strategy Flow', () => {
    it('should apply exponential backoff for transient connection errors', async () => {
      // Arrange
      const connectionError = new ConnectionException(
        'Connection refused',
        DatabaseErrorType.CONNECTION,
        DatabaseErrorSeverity.CRITICAL,
        DatabaseErrorRecoverability.TRANSIENT,
        { operation: 'findUnique', query: { where: { id: 1 } } }
      );
      
      // Mock the retry strategy
      const mockRetryStrategy = {
        shouldRetry: jest.fn().mockReturnValue(true),
        getNextRetryDelay: jest.fn().mockReturnValueOnce(100).mockReturnValueOnce(200).mockReturnValue(400),
        recordAttempt: jest.fn(),
      };
      
      jest.spyOn(retryStrategyFactory, 'createStrategy')
        .mockReturnValue(mockRetryStrategy as unknown as RetryStrategy);
      
      // Mock the PrismaService to throw the connection error on first two attempts, then succeed
      const findUniqueMock = jest.fn()
        .mockRejectedValueOnce(connectionError)
        .mockRejectedValueOnce(connectionError)
        .mockResolvedValueOnce({ id: 1, name: 'Test User' });
      
      jest.spyOn(prismaService, 'user').mockImplementation(() => {
        return {
          findUnique: findUniqueMock,
        } as any;
      });

      // Act
      const result = await prismaService.user.findUnique({ where: { id: 1 } });

      // Assert
      expect(result).toEqual({ id: 1, name: 'Test User' });
      expect(findUniqueMock).toHaveBeenCalledTimes(3);
      expect(mockRetryStrategy.shouldRetry).toHaveBeenCalledTimes(2);
      expect(mockRetryStrategy.getNextRetryDelay).toHaveBeenCalledTimes(2);
      expect(mockRetryStrategy.recordAttempt).toHaveBeenCalledTimes(2);
    });

    it('should not retry permanent errors', async () => {
      // Arrange
      const integrityError = new IntegrityException(
        'Unique constraint violation',
        DatabaseErrorType.INTEGRITY,
        DatabaseErrorSeverity.MAJOR,
        DatabaseErrorRecoverability.PERMANENT,
        { operation: 'create', query: { data: { email: 'test@example.com' } }, constraint: 'email' }
      );
      
      // Mock the retry strategy
      const mockRetryStrategy = {
        shouldRetry: jest.fn().mockReturnValue(false),
        getNextRetryDelay: jest.fn(),
        recordAttempt: jest.fn(),
      };
      
      jest.spyOn(retryStrategyFactory, 'createStrategy')
        .mockReturnValue(mockRetryStrategy as unknown as RetryStrategy);
      
      // Mock the PrismaService to throw the integrity error
      const createMock = jest.fn().mockRejectedValue(integrityError);
      
      jest.spyOn(prismaService, 'user').mockImplementation(() => {
        return {
          create: createMock,
        } as any;
      });

      // Act & Assert
      await expect(prismaService.user.create({ data: { email: 'test@example.com' } as any }))
        .rejects
        .toThrow(IntegrityException);
      
      expect(createMock).toHaveBeenCalledTimes(1);
      expect(mockRetryStrategy.shouldRetry).toHaveBeenCalledTimes(1);
      expect(mockRetryStrategy.getNextRetryDelay).not.toHaveBeenCalled();
    });

    it('should stop retrying after max attempts', async () => {
      // Arrange
      const connectionError = new ConnectionException(
        'Connection refused',
        DatabaseErrorType.CONNECTION,
        DatabaseErrorSeverity.CRITICAL,
        DatabaseErrorRecoverability.TRANSIENT,
        { operation: 'findUnique', query: { where: { id: 1 } } }
      );
      
      // Mock the retry strategy to allow 3 retries then stop
      const mockRetryStrategy = {
        shouldRetry: jest.fn()
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(true)
          .mockReturnValue(false),
        getNextRetryDelay: jest.fn().mockReturnValue(100),
        recordAttempt: jest.fn(),
      };
      
      jest.spyOn(retryStrategyFactory, 'createStrategy')
        .mockReturnValue(mockRetryStrategy as unknown as RetryStrategy);
      
      // Mock the PrismaService to always throw the connection error
      const findUniqueMock = jest.fn().mockRejectedValue(connectionError);
      
      jest.spyOn(prismaService, 'user').mockImplementation(() => {
        return {
          findUnique: findUniqueMock,
        } as any;
      });

      // Act & Assert
      await expect(prismaService.user.findUnique({ where: { id: 1 } }))
        .rejects
        .toThrow(ConnectionException);
      
      expect(findUniqueMock).toHaveBeenCalledTimes(4); // Initial + 3 retries
      expect(mockRetryStrategy.shouldRetry).toHaveBeenCalledTimes(4);
      expect(mockRetryStrategy.getNextRetryDelay).toHaveBeenCalledTimes(3);
    });
  });

  describe('Circuit Breaker Flow', () => {
    it('should open circuit after threshold failures', async () => {
      // Arrange
      const connectionError = new ConnectionException(
        'Connection refused',
        DatabaseErrorType.CONNECTION,
        DatabaseErrorSeverity.CRITICAL,
        DatabaseErrorRecoverability.TRANSIENT,
        { operation: 'findUnique', query: { where: { id: 1 } } }
      );
      
      // Mock the circuit breaker middleware
      const isCircuitOpenSpy = jest.spyOn(circuitBreakerMiddleware, 'isCircuitOpen')
        .mockReturnValueOnce(false) // First call - circuit closed
        .mockReturnValueOnce(false) // Second call - circuit closed
        .mockReturnValue(true);     // Subsequent calls - circuit open
      
      const recordFailureSpy = jest.spyOn(circuitBreakerMiddleware, 'recordFailure')
        .mockImplementation();
      
      // Mock the PrismaService to throw connection errors
      const findUniqueMock = jest.fn().mockRejectedValue(connectionError);
      
      jest.spyOn(prismaService, 'user').mockImplementation(() => {
        return {
          findUnique: findUniqueMock,
        } as any;
      });

      // Act - First call (circuit closed)
      await expect(prismaService.user.findUnique({ where: { id: 1 } }))
        .rejects
        .toThrow(ConnectionException);
      
      // Act - Second call (circuit closed)
      await expect(prismaService.user.findUnique({ where: { id: 1 } }))
        .rejects
        .toThrow(ConnectionException);
      
      // Act - Third call (circuit open)
      await expect(prismaService.user.findUnique({ where: { id: 1 } }))
        .rejects
        .toThrow(/Circuit is open/);
      
      // Assert
      expect(isCircuitOpenSpy).toHaveBeenCalledTimes(3);
      expect(recordFailureSpy).toHaveBeenCalledTimes(2);
      expect(findUniqueMock).toHaveBeenCalledTimes(2); // Only called when circuit closed
    });

    it('should test circuit after half-open timeout', async () => {
      // Arrange
      const connectionError = new ConnectionException(
        'Connection refused',
        DatabaseErrorType.CONNECTION,
        DatabaseErrorSeverity.CRITICAL,
        DatabaseErrorRecoverability.TRANSIENT,
        { operation: 'findUnique', query: { where: { id: 1 } } }
      );
      
      // Mock the circuit breaker middleware
      const isCircuitOpenSpy = jest.spyOn(circuitBreakerMiddleware, 'isCircuitOpen')
        .mockReturnValueOnce(true)  // First call - circuit open
        .mockReturnValueOnce(false) // Second call - circuit half-open for testing
        .mockReturnValue(false);    // Subsequent calls - circuit closed after successful test
      
      const shouldTestCircuitSpy = jest.spyOn(circuitBreakerMiddleware, 'shouldTestCircuit')
        .mockReturnValueOnce(false) // First call - not time to test yet
        .mockReturnValue(true);     // Subsequent calls - time to test
      
      const recordSuccessSpy = jest.spyOn(circuitBreakerMiddleware, 'recordSuccess')
        .mockImplementation();
      
      // Mock the PrismaService to throw error first, then succeed
      const findUniqueMock = jest.fn()
        .mockRejectedValueOnce(connectionError)
        .mockResolvedValue({ id: 1, name: 'Test User' });
      
      jest.spyOn(prismaService, 'user').mockImplementation(() => {
        return {
          findUnique: findUniqueMock,
        } as any;
      });

      // Act - First call (circuit open, not testing)
      await expect(prismaService.user.findUnique({ where: { id: 1 } }))
        .rejects
        .toThrow(/Circuit is open/);
      
      // Act - Second call (circuit half-open for testing, fails)
      await expect(prismaService.user.findUnique({ where: { id: 1 } }))
        .rejects
        .toThrow(ConnectionException);
      
      // Act - Third call (circuit half-open for testing, succeeds)
      const result = await prismaService.user.findUnique({ where: { id: 1 } });
      
      // Assert
      expect(result).toEqual({ id: 1, name: 'Test User' });
      expect(isCircuitOpenSpy).toHaveBeenCalledTimes(3);
      expect(shouldTestCircuitSpy).toHaveBeenCalledTimes(2);
      expect(recordSuccessSpy).toHaveBeenCalledTimes(1);
      expect(findUniqueMock).toHaveBeenCalledTimes(2); // Only called for testing and after success
    });
  });

  describe('Transaction Error Flow', () => {
    it('should properly handle and transform transaction errors', async () => {
      // Arrange
      const prismaError = new PrismaClientKnownRequestError('Transaction failed', {
        code: 'P2028',
        clientVersion: '4.8.0',
      });
      
      // Mock the transaction service
      jest.spyOn(transactionService, 'startTransaction').mockResolvedValue(mockPrismaClient);
      jest.spyOn(transactionService, 'commitTransaction').mockRejectedValue(prismaError);
      
      // Act & Assert
      await expect(async () => {
        await transactionService.executeInTransaction(async (tx) => {
          // Perform some operations in transaction
          return { success: true };
        }, { isolationLevel: TransactionIsolationLevel.READ_COMMITTED });
      }).rejects.toThrow(TransactionException);
      
      // Verify error properties
      try {
        await transactionService.executeInTransaction(async (tx) => {
          return { success: true };
        }, { isolationLevel: TransactionIsolationLevel.READ_COMMITTED });
      } catch (error) {
        expect(error).toBeInstanceOf(TransactionException);
        expect(error.errorType).toBe(DatabaseErrorType.TRANSACTION);
        expect(error.severity).toBe(DatabaseErrorSeverity.MAJOR);
        expect(error.context).toHaveProperty('operation');
        expect(error.context).toHaveProperty('isolationLevel');
      }
    });

    it('should automatically rollback transaction on error', async () => {
      // Arrange
      const operationError = new Error('Operation failed');
      
      // Mock the transaction service
      jest.spyOn(transactionService, 'startTransaction').mockResolvedValue(mockPrismaClient);
      const rollbackSpy = jest.spyOn(transactionService, 'rollbackTransaction').mockResolvedValue();
      
      // Act & Assert
      await expect(async () => {
        await transactionService.executeInTransaction(async (tx) => {
          throw operationError;
        }, { isolationLevel: TransactionIsolationLevel.READ_COMMITTED });
      }).rejects.toThrow('Operation failed');
      
      expect(rollbackSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Context Enrichment', () => {
    it('should enrich errors with journey context', async () => {
      // Arrange
      const prismaError = new PrismaClientKnownRequestError('Query failed', {
        code: 'P2010',
        clientVersion: '4.8.0',
      });
      
      // Mock the journey context
      const healthContextMock = journeyContextMock.healthContext;
      
      // Mock the PrismaService to throw the query error
      jest.spyOn(healthContextMock, 'healthMetric').mockImplementation(() => {
        return {
          findMany: jest.fn().mockRejectedValue(prismaError),
        } as any;
      });

      // Act & Assert
      await expect(healthContextMock.healthMetric.findMany())
        .rejects
        .toThrow(QueryException);
      
      // Verify error properties
      try {
        await healthContextMock.healthMetric.findMany();
      } catch (error) {
        expect(error).toBeInstanceOf(QueryException);
        expect(error.context).toHaveProperty('journey');
        expect(error.context.journey).toBe('health');
        expect(error.context).toHaveProperty('entity');
        expect(error.context.entity).toBe('healthMetric');
      }
    });

    it('should include query parameters in error context', async () => {
      // Arrange
      const prismaError = new PrismaClientKnownRequestError('Query failed', {
        code: 'P2010',
        clientVersion: '4.8.0',
      });
      
      // Mock the PrismaService to throw the query error
      jest.spyOn(prismaService, 'user').mockImplementation(() => {
        return {
          findUnique: jest.fn().mockRejectedValue(prismaError),
        } as any;
      });

      const queryParams = { where: { id: 1, email: 'test@example.com' } };

      // Act & Assert
      await expect(prismaService.user.findUnique(queryParams))
        .rejects
        .toThrow(QueryException);
      
      // Verify error properties
      try {
        await prismaService.user.findUnique(queryParams);
      } catch (error) {
        expect(error).toBeInstanceOf(QueryException);
        expect(error.context).toHaveProperty('query');
        expect(error.context.query).toEqual(queryParams);
        expect(error.context).toHaveProperty('operation');
        expect(error.context.operation).toBe('findUnique');
      }
    });

    it('should sanitize sensitive data in error context', async () => {
      // Arrange
      const prismaError = new PrismaClientKnownRequestError('Query failed', {
        code: 'P2010',
        clientVersion: '4.8.0',
      });
      
      // Mock the PrismaService to throw the query error
      jest.spyOn(prismaService, 'user').mockImplementation(() => {
        return {
          create: jest.fn().mockRejectedValue(prismaError),
        } as any;
      });

      const userData = { 
        data: { 
          email: 'test@example.com', 
          name: 'Test User', 
          password: 'supersecret123', 
          cpf: '12345678901' 
        } 
      };

      // Act & Assert
      await expect(prismaService.user.create(userData as any))
        .rejects
        .toThrow(QueryException);
      
      // Verify error properties
      try {
        await prismaService.user.create(userData as any);
      } catch (error) {
        expect(error).toBeInstanceOf(QueryException);
        expect(error.context).toHaveProperty('query');
        expect(error.context.query).toHaveProperty('data');
        expect(error.context.query.data).toHaveProperty('password');
        expect(error.context.query.data.password).toBe('[REDACTED]');
        expect(error.context.query.data).toHaveProperty('cpf');
        expect(error.context.query.data.cpf).toBe('[REDACTED]');
        expect(error.context.query.data).toHaveProperty('email');
        expect(error.context.query.data.email).toBe('test@example.com'); // Email not redacted
      }
    });
  });

  describe('End-to-End Error Flow', () => {
    it('should handle the complete error flow from database to application', async () => {
      // This test verifies the complete flow from low-level error to application exception
      // including transformation, retry, circuit breaker, and context enrichment
      
      // Arrange
      const prismaError = new PrismaClientKnownRequestError('Connection refused', {
        code: 'P1001',
        clientVersion: '4.8.0',
      });
      
      // Mock the retry strategy
      const mockRetryStrategy = {
        shouldRetry: jest.fn().mockReturnValueOnce(true).mockReturnValue(false),
        getNextRetryDelay: jest.fn().mockReturnValue(100),
        recordAttempt: jest.fn(),
      };
      
      jest.spyOn(retryStrategyFactory, 'createStrategy')
        .mockReturnValue(mockRetryStrategy as unknown as RetryStrategy);
      
      // Mock the circuit breaker middleware
      jest.spyOn(circuitBreakerMiddleware, 'isCircuitOpen').mockReturnValue(false);
      const recordFailureSpy = jest.spyOn(circuitBreakerMiddleware, 'recordFailure')
        .mockImplementation();
      
      // Mock the PrismaService to throw the connection error
      const findUniqueMock = jest.fn().mockRejectedValue(prismaError);
      
      jest.spyOn(prismaService, 'user').mockImplementation(() => {
        return {
          findUnique: findUniqueMock,
        } as any;
      });

      // Act & Assert
      await expect(prismaService.user.findUnique({ where: { id: 1 } }))
        .rejects
        .toThrow(ConnectionException);
      
      // Verify the complete flow
      expect(findUniqueMock).toHaveBeenCalledTimes(2); // Initial + 1 retry
      expect(mockRetryStrategy.shouldRetry).toHaveBeenCalledTimes(2);
      expect(mockRetryStrategy.getNextRetryDelay).toHaveBeenCalledTimes(1);
      expect(recordFailureSpy).toHaveBeenCalledTimes(2);
      
      // Verify error properties
      try {
        await prismaService.user.findUnique({ where: { id: 1 } });
      } catch (error) {
        expect(error).toBeInstanceOf(ConnectionException);
        expect(error.errorType).toBe(DatabaseErrorType.CONNECTION);
        expect(error.severity).toBe(DatabaseErrorSeverity.CRITICAL);
        expect(error.recoverability).toBe(DatabaseErrorRecoverability.TRANSIENT);
        expect(error.context).toHaveProperty('operation');
        expect(error.context).toHaveProperty('query');
        expect(error.context.query).toEqual({ where: { id: 1 } });
        expect(error.message).toContain('Connection refused');
      }
    });
  });
});
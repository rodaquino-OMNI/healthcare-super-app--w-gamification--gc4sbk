import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { PrismaClientKnownRequestError, PrismaClientUnknownRequestError, PrismaClientRustPanicError, PrismaClientInitializationError } from '@prisma/client/runtime/library';
import { JourneyType } from '@austa/interfaces/common';

import { DatabaseErrorHandlerService, DatabaseRetryStrategy } from '../../../../src/common/database/error-handler.service';
import { 
  DatabaseException,
  ConnectionException,
  TransactionException,
  ConstraintViolationException,
  ResourceNotFoundException
} from '../../../../src/common/exceptions/database.exception';
import { RetryUtils } from '../../../../src/common/exceptions/retry.utils';
import { ERROR_CLASSIFICATION, RETRY_STRATEGY } from '../../../../src/common/database/constants';

// Mock RetryUtils
jest.mock('../../../../src/common/exceptions/retry.utils', () => ({
  RetryUtils: {
    withRetry: jest.fn(),
  },
}));

// Mock Logger
jest.mock('@nestjs/common', () => ({
  ...jest.requireActual('@nestjs/common'),
  Logger: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  })),
}));

describe('DatabaseErrorHandlerService', () => {
  let service: DatabaseErrorHandlerService;
  let mockRetryUtils: jest.Mocked<typeof RetryUtils>;
  
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseErrorHandlerService],
    }).compile();

    service = module.get<DatabaseErrorHandlerService>(DatabaseErrorHandlerService);
    mockRetryUtils = RetryUtils as jest.Mocked<typeof RetryUtils>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleError', () => {
    it('should return the original error if it is already a DatabaseException', () => {
      const originalError = new DatabaseException('Test error', 'DATABASE_ERROR', 'UNKNOWN', 'MEDIUM');
      const result = service.handleError(originalError);
      expect(result).toBe(originalError);
    });

    it('should transform PrismaClientKnownRequestError to appropriate DatabaseException', () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '4.0.0' },
        { meta: { target: ['email'] } }
      );
      
      const result = service.handleError(prismaError);
      
      expect(result).toBeInstanceOf(ConstraintViolationException);
      expect(result.message).toContain('Constraint violation');
    });

    it('should transform PrismaClientUnknownRequestError to DatabaseException', () => {
      const prismaError = new PrismaClientUnknownRequestError(
        'Unknown error occurred during query execution',
        { clientVersion: '4.0.0' }
      );
      
      const result = service.handleError(prismaError);
      
      expect(result).toBeInstanceOf(DatabaseException);
    });

    it('should transform connection-related errors correctly', () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Connection failed',
        { code: 'P1002', clientVersion: '4.0.0' },
        {}
      );
      
      const result = service.handleError(prismaError);
      
      expect(result).toBeInstanceOf(ConnectionException);
      expect((result as ConnectionException).isTransient).toBe(true);
      expect((result as ConnectionException).isRecoverable).toBe(true);
    });

    it('should transform record not found errors correctly', () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: '4.0.0' },
        { meta: { modelName: 'User' } }
      );
      
      const result = service.handleError(prismaError);
      
      expect(result).toBeInstanceOf(ResourceNotFoundException);
      expect((result as ResourceNotFoundException).isTransient).toBe(false);
    });

    it('should add context information to transformed errors', () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Transaction failed',
        { code: 'P3000', clientVersion: '4.0.0' },
        {}
      );
      
      const context = { userId: '123', operation: 'createUser' };
      const result = service.handleError(prismaError, context) as TransactionException;
      
      expect(result).toBeInstanceOf(TransactionException);
      expect(result.context).toMatchObject(expect.objectContaining({
        userId: '123',
        operation: 'createUser',
      }));
    });
  });

  describe('isTransientError', () => {
    it('should identify connection errors as transient', () => {
      const error = new Error('Connection timeout occurred');
      expect(service.isTransientError(error)).toBe(true);
    });

    it('should identify non-transient errors correctly', () => {
      const error = new Error('Invalid input data');
      expect(service.isTransientError(error)).toBe(false);
    });

    it('should use DatabaseException.shouldRetry() for DatabaseExceptions', () => {
      const transientError = new ConnectionException(
        'Connection error',
        {},
        undefined,
        true,
        true
      );
      
      const permanentError = new ConstraintViolationException(
        'Constraint violation',
        {},
        undefined,
        false,
        false
      );
      
      expect(service.isTransientError(transientError)).toBe(true);
      expect(service.isTransientError(permanentError)).toBe(false);
    });
  });

  describe('getRetryStrategy', () => {
    it('should return journey-specific strategy when journey type is provided', () => {
      const error = new Error('Test error');
      const strategy = service.getRetryStrategy(error, JourneyType.HEALTH);
      
      expect(strategy).toBeInstanceOf(DatabaseRetryStrategy);
      expect(strategy.maxRetries).toBe(RETRY_STRATEGY.JOURNEY_RETRIES[JourneyType.HEALTH]);
    });

    it('should return critical operation strategy for critical errors', () => {
      const error = new DatabaseException(
        'Critical error',
        'CRITICAL_ERROR',
        'UNKNOWN',
        'CRITICAL'
      );
      
      const strategy = service.getRetryStrategy(error);
      
      expect(strategy).toBeInstanceOf(DatabaseRetryStrategy);
      expect(strategy.maxRetries).toBe(RETRY_STRATEGY.CRITICAL_OPERATION_MAX_RETRIES);
    });

    it('should return default strategy for regular errors', () => {
      const error = new Error('Regular error');
      const strategy = service.getRetryStrategy(error);
      
      expect(strategy).toBeInstanceOf(DatabaseRetryStrategy);
      expect(strategy.maxRetries).toBe(RETRY_STRATEGY.DEFAULT_MAX_RETRIES);
    });
  });

  describe('executeWithRetry', () => {
    it('should call RetryUtils.withRetry with correct parameters', async () => {
      const operation = jest.fn().mockResolvedValue('result');
      mockRetryUtils.withRetry.mockResolvedValue('result');
      
      await service.executeWithRetry(operation, { userId: '123' });
      
      expect(mockRetryUtils.withRetry).toHaveBeenCalledWith(
        operation,
        expect.objectContaining({
          maxAttempts: RETRY_STRATEGY.DEFAULT_MAX_RETRIES,
          baseDelayMs: RETRY_STRATEGY.BASE_DELAY_MS,
          maxDelayMs: RETRY_STRATEGY.MAX_DELAY_MS,
          jitterFactor: RETRY_STRATEGY.JITTER_FACTOR,
          retryableErrors: [DatabaseException],
        })
      );
    });

    it('should use journey-specific retry configuration when journey type is provided', async () => {
      const operation = jest.fn().mockResolvedValue('result');
      mockRetryUtils.withRetry.mockResolvedValue('result');
      
      await service.executeWithRetry(operation, { userId: '123' }, JourneyType.HEALTH);
      
      expect(mockRetryUtils.withRetry).toHaveBeenCalledWith(
        operation,
        expect.objectContaining({
          maxAttempts: RETRY_STRATEGY.JOURNEY_RETRIES[JourneyType.HEALTH],
        })
      );
    });

    it('should transform and throw errors that cannot be retried', async () => {
      const operation = jest.fn();
      const error = new Error('Non-retryable error');
      
      mockRetryUtils.withRetry.mockRejectedValue(error);
      
      await expect(service.executeWithRetry(operation)).rejects.toThrow();
    });
  });
});

describe('DatabaseRetryStrategy', () => {
  describe('calculateDelay', () => {
    it('should calculate exponential backoff correctly', () => {
      const strategy = new DatabaseRetryStrategy(
        3,
        100,
        5000,
        true,
        false // Disable jitter for deterministic testing
      );
      
      // First attempt: baseDelay * (backoffFactor^0) = 100 * 1 = 100
      expect(strategy.calculateDelay(1)).toBe(100);
      
      // Second attempt: baseDelay * (backoffFactor^1) = 100 * 2 = 200
      expect(strategy.calculateDelay(2)).toBe(200);
      
      // Third attempt: baseDelay * (backoffFactor^2) = 100 * 4 = 400
      expect(strategy.calculateDelay(3)).toBe(400);
    });

    it('should respect maximum delay', () => {
      const strategy = new DatabaseRetryStrategy(
        5,
        1000,
        2000, // Max delay of 2000ms
        true,
        false // Disable jitter for deterministic testing
      );
      
      // Fourth attempt would be 1000 * 2^3 = 8000, but capped at 2000
      expect(strategy.calculateDelay(4)).toBe(2000);
    });
  });

  describe('shouldRetry', () => {
    it('should not retry if max attempts exceeded', () => {
      const strategy = new DatabaseRetryStrategy(3);
      const error = new Error('Test error');
      
      expect(strategy.shouldRetry(error, 4)).toBe(false);
    });

    it('should use DatabaseException.shouldRetry() for DatabaseExceptions', () => {
      const strategy = new DatabaseRetryStrategy();
      
      const transientError = new ConnectionException(
        'Connection error',
        {},
        undefined,
        true,
        true
      );
      
      const permanentError = new ConstraintViolationException(
        'Constraint violation',
        {},
        undefined,
        false,
        false
      );
      
      expect(strategy.shouldRetry(transientError, 1)).toBe(true);
      expect(strategy.shouldRetry(permanentError, 1)).toBe(false);
    });

    it('should identify common transient error patterns', () => {
      const strategy = new DatabaseRetryStrategy();
      
      expect(strategy.shouldRetry(new Error('Connection timeout'), 1)).toBe(true);
      expect(strategy.shouldRetry(new Error('Network error'), 1)).toBe(true);
      expect(strategy.shouldRetry(new Error('Too many connections'), 1)).toBe(true);
      expect(strategy.shouldRetry(new Error('Invalid input'), 1)).toBe(false);
    });
  });

  describe('static factory methods', () => {
    it('forJourney should create journey-specific strategy', () => {
      const strategy = DatabaseRetryStrategy.forJourney(JourneyType.HEALTH);
      
      expect(strategy).toBeInstanceOf(DatabaseRetryStrategy);
      expect(strategy.maxRetries).toBe(RETRY_STRATEGY.JOURNEY_RETRIES[JourneyType.HEALTH]);
    });

    it('forCriticalOperation should create strategy with higher retry count', () => {
      const strategy = DatabaseRetryStrategy.forCriticalOperation();
      
      expect(strategy).toBeInstanceOf(DatabaseRetryStrategy);
      expect(strategy.maxRetries).toBe(RETRY_STRATEGY.CRITICAL_OPERATION_MAX_RETRIES);
    });
  });
});
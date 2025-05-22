/**
 * @file transaction-service.spec.ts
 * @description Unit tests for the TransactionService that manages database transactions
 * with support for different isolation levels, savepoints, and distributed transactions.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../../src/prisma.service';
import { TransactionService } from '../../src/transactions/transaction.service';
import { 
  TransactionIsolationLevel,
  TransactionClient,
  TransactionOptions,
  DistributedTransactionOptions
} from '../../src/types/transaction.types';
import {
  TransactionError,
  TransactionTimeoutError,
  DeadlockError,
  SerializationError,
  DistributedTransactionError,
  TransactionAbortedError,
  ConnectionLostError
} from '../../src/transactions/transaction.errors';

// Mock UUID to have predictable IDs in tests
jest.mock('uuid');
(uuidv4 as jest.Mock).mockImplementation(() => 'mock-transaction-id');

// Mock Logger to prevent console output during tests
jest.mock('@nestjs/common', () => {
  const original = jest.requireActual('@nestjs/common');
  return {
    ...original,
    Logger: jest.fn().mockImplementation(() => ({
      log: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    })),
  };
});

describe('TransactionService', () => {
  let service: TransactionService;
  let prismaService: PrismaService;
  let configService: ConfigService;
  let mockPrismaClient: jest.Mocked<PrismaClient>;
  let mockTransactionClient: jest.Mocked<TransactionClient>;

  // Mock transaction client for testing
  const createMockTransactionClient = () => {
    const mockClient = {
      $executeRaw: jest.fn(),
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      profile: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      // Add other models as needed
    } as unknown as jest.Mocked<TransactionClient>;
    return mockClient;
  };

  beforeEach(async () => {
    // Create mock transaction client
    mockTransactionClient = createMockTransactionClient();
    
    // Create mock PrismaClient
    mockPrismaClient = {
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(mockTransactionClient);
      }),
    } as unknown as jest.Mocked<PrismaClient>;

    // Create mock ConfigService
    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
        const config = {
          'DATABASE_TRANSACTION_TIMEOUT': 30000,
          'DATABASE_TRANSACTION_MAX_RETRIES': 3,
          'DATABASE_TRANSACTION_INITIAL_RETRY_DELAY': 100,
          'DATABASE_TRANSACTION_MAX_RETRY_DELAY': 5000,
          'DATABASE_ENABLE_DISTRIBUTED_TRANSACTIONS': true,
          'DATABASE_ENABLE_SAVEPOINTS': true,
          'DATABASE_ENABLE_TRANSACTION_METRICS': true,
        };
        return config[key] !== undefined ? config[key] : defaultValue;
      }),
    };

    // Create mock PrismaService
    const mockPrismaService = {
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(mockTransactionClient);
      }),
    } as unknown as jest.Mocked<PrismaService>;

    // Create testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    // Get service instances
    service = module.get<TransactionService>(TransactionService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should load configuration from ConfigService', () => {
      expect(configService.get).toHaveBeenCalledWith('DATABASE_TRANSACTION_TIMEOUT', 30000);
      expect(configService.get).toHaveBeenCalledWith('DATABASE_TRANSACTION_MAX_RETRIES', 3);
      expect(configService.get).toHaveBeenCalledWith('DATABASE_TRANSACTION_INITIAL_RETRY_DELAY', 100);
      expect(configService.get).toHaveBeenCalledWith('DATABASE_TRANSACTION_MAX_RETRY_DELAY', 5000);
      expect(configService.get).toHaveBeenCalledWith('DATABASE_ENABLE_DISTRIBUTED_TRANSACTIONS', false);
      expect(configService.get).toHaveBeenCalledWith('DATABASE_ENABLE_SAVEPOINTS', true);
      expect(configService.get).toHaveBeenCalledWith('DATABASE_ENABLE_TRANSACTION_METRICS', true);
    });
  });

  describe('executeTransaction', () => {
    it('should execute a callback within a transaction', async () => {
      // Arrange
      const mockCallback = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });
      
      // Act
      const result = await service.executeTransaction(mockCallback);
      
      // Assert
      expect(result).toEqual({ id: 1, name: 'Test' });
      expect(mockCallback).toHaveBeenCalled();
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should use the specified isolation level', async () => {
      // Arrange
      const mockCallback = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });
      const options: TransactionOptions = {
        isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
      };
      
      // Act
      await service.executeTransaction(mockCallback, options);
      
      // Assert
      expect(prismaService.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
        })
      );
    });

    it('should handle transaction timeout', async () => {
      // Arrange
      const mockCallback = jest.fn().mockImplementation(async () => {
        // Simulate a long-running operation that exceeds the timeout
        await new Promise(resolve => setTimeout(resolve, 100));
        return { id: 1, name: 'Test' };
      });
      
      const options: TransactionOptions = {
        timeout: 50, // Very short timeout for testing
      };
      
      // Mock the executeWithTimeout method to throw a timeout error
      jest.spyOn(service as any, 'executeWithTimeout').mockRejectedValueOnce(
        new TransactionTimeoutError('Transaction timed out', 50, 'execute')
      );
      
      // Act & Assert
      await expect(service.executeTransaction(mockCallback, options))
        .rejects
        .toThrow(TransactionTimeoutError);
    });

    it('should retry on retryable errors', async () => {
      // Arrange
      const mockCallback = jest.fn()
        .mockRejectedValueOnce(new DeadlockError('Deadlock detected', 'resource1', ['pid1']))
        .mockResolvedValueOnce({ id: 1, name: 'Test' });
      
      const options: TransactionOptions = {
        retry: {
          maxRetries: 3,
          initialDelay: 10,
          backoffFactor: 1,
          maxDelay: 100,
        },
      };
      
      // Mock shouldRetry to return true for the first call
      jest.spyOn(service as any, 'shouldRetry').mockReturnValueOnce(true);
      
      // Act
      const result = await service.executeTransaction(mockCallback, options);
      
      // Assert
      expect(result).toEqual({ id: 1, name: 'Test' });
      expect(mockCallback).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      // Arrange
      const mockError = new TransactionError('Non-retryable error');
      const mockCallback = jest.fn().mockRejectedValue(mockError);
      
      const options: TransactionOptions = {
        retry: {
          maxRetries: 3,
          initialDelay: 10,
          backoffFactor: 1,
          maxDelay: 100,
        },
      };
      
      // Mock shouldRetry to return false
      jest.spyOn(service as any, 'shouldRetry').mockReturnValue(false);
      
      // Act & Assert
      await expect(service.executeTransaction(mockCallback, options))
        .rejects
        .toThrow(mockError);
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('executeTransactionWithMetadata', () => {
    it('should return result with transaction metadata', async () => {
      // Arrange
      const mockCallback = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });
      
      // Act
      const result = await service.executeTransactionWithMetadata(mockCallback);
      
      // Assert
      expect(result.result).toEqual({ id: 1, name: 'Test' });
      expect(result.metadata).toBeDefined();
      expect(result.metadata.transactionId).toBe('mock-transaction-id');
      expect(result.metadata.success).toBe(true);
      expect(result.metadata.retryAttempts).toBe(0);
      expect(result.metadata.isolationLevel).toBe(TransactionIsolationLevel.READ_COMMITTED);
    });

    it('should include retry attempts in metadata', async () => {
      // Arrange
      const mockCallback = jest.fn()
        .mockRejectedValueOnce(new DeadlockError('Deadlock detected', 'resource1', ['pid1']))
        .mockResolvedValueOnce({ id: 1, name: 'Test' });
      
      const options: TransactionOptions = {
        retry: {
          maxRetries: 3,
          initialDelay: 10,
          backoffFactor: 1,
          maxDelay: 100,
        },
      };
      
      // Mock shouldRetry to return true for the first call
      jest.spyOn(service as any, 'shouldRetry').mockReturnValueOnce(true);
      
      // Act
      const result = await service.executeTransactionWithMetadata(mockCallback, options);
      
      // Assert
      expect(result.result).toEqual({ id: 1, name: 'Test' });
      expect(result.metadata.retryAttempts).toBe(1);
      expect(result.metadata.success).toBe(true);
    });
  });

  describe('createTransaction', () => {
    it('should create a transaction client', async () => {
      // Act
      const client = await service.createTransaction();
      
      // Assert
      expect(client).toBeDefined();
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should create a transaction with specified isolation level', async () => {
      // Arrange
      const options: TransactionOptions = {
        isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
      };
      
      // Act
      await service.createTransaction(options);
      
      // Assert
      expect(prismaService.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
        })
      );
    });

    it('should throw an error if transaction creation fails', async () => {
      // Arrange
      const mockError = new Error('Transaction creation failed');
      jest.spyOn(prismaService, '$transaction').mockRejectedValueOnce(mockError);
      
      // Act & Assert
      await expect(service.createTransaction())
        .rejects
        .toThrow(TransactionError);
    });
  });

  describe('commitTransaction', () => {
    it('should commit a transaction', async () => {
      // Arrange
      const client = await service.createTransaction();
      
      // Act
      await service.commitTransaction(client);
      
      // Assert
      // In our implementation, commit is handled implicitly by Prisma
      // so we're mainly testing that no error is thrown
      expect(true).toBe(true);
    });

    it('should throw an error if transaction is not found', async () => {
      // Arrange
      const unknownClient = createMockTransactionClient();
      
      // Act & Assert
      await expect(service.commitTransaction(unknownClient))
        .rejects
        .toThrow('Cannot commit transaction: transaction not found in active transactions');
    });
  });

  describe('rollbackTransaction', () => {
    it('should roll back a transaction', async () => {
      // Arrange
      const client = await service.createTransaction();
      
      // Act
      await service.rollbackTransaction(client);
      
      // Assert
      expect(mockTransactionClient.$executeRaw).toHaveBeenCalledWith(expect.stringContaining('ROLLBACK'));
    });

    it('should throw an error if transaction is not found', async () => {
      // Arrange
      const unknownClient = createMockTransactionClient();
      
      // Act & Assert
      await expect(service.rollbackTransaction(unknownClient))
        .rejects
        .toThrow('Cannot rollback transaction: transaction not found in active transactions');
    });

    it('should handle rollback errors', async () => {
      // Arrange
      const client = await service.createTransaction();
      const mockError = new Error('Rollback failed');
      mockTransactionClient.$executeRaw.mockRejectedValueOnce(mockError);
      
      // Act & Assert
      await expect(service.rollbackTransaction(client))
        .rejects
        .toThrow(TransactionError);
    });
  });

  describe('savepoint management', () => {
    it('should create a savepoint', async () => {
      // Arrange
      const client = await service.createTransaction();
      
      // Act
      const savepointName = await service.createSavepoint(client, 'test_savepoint');
      
      // Assert
      expect(savepointName).toBe('test_savepoint');
      expect(mockTransactionClient.$executeRaw).toHaveBeenCalledWith(
        expect.stringContaining('SAVEPOINT')
      );
    });

    it('should generate a savepoint name if not provided', async () => {
      // Arrange
      const client = await service.createTransaction();
      
      // Act
      const savepointName = await service.createSavepoint(client);
      
      // Assert
      expect(savepointName).toMatch(/sp_[a-f0-9]+/);
      expect(mockTransactionClient.$executeRaw).toHaveBeenCalledWith(
        expect.stringContaining('SAVEPOINT')
      );
    });

    it('should roll back to a savepoint', async () => {
      // Arrange
      const client = await service.createTransaction();
      const savepointName = await service.createSavepoint(client, 'test_savepoint');
      
      // Act
      await service.rollbackToSavepoint(client, savepointName);
      
      // Assert
      expect(mockTransactionClient.$executeRaw).toHaveBeenCalledWith(
        expect.stringContaining('ROLLBACK TO SAVEPOINT')
      );
    });

    it('should release a savepoint', async () => {
      // Arrange
      const client = await service.createTransaction();
      const savepointName = await service.createSavepoint(client, 'test_savepoint');
      
      // Act
      await service.releaseSavepoint(client, savepointName);
      
      // Assert
      expect(mockTransactionClient.$executeRaw).toHaveBeenCalledWith(
        expect.stringContaining('RELEASE SAVEPOINT')
      );
    });

    it('should throw an error if savepoints are disabled', async () => {
      // Arrange
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'DATABASE_ENABLE_SAVEPOINTS') return false;
        return null;
      });
      
      // Recreate service with updated config
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TransactionService,
          {
            provide: PrismaService,
            useValue: prismaService,
          },
          {
            provide: ConfigService,
            useValue: configService,
          },
        ],
      }).compile();
      
      const disabledService = module.get<TransactionService>(TransactionService);
      const client = await disabledService.createTransaction();
      
      // Act & Assert
      await expect(disabledService.createSavepoint(client))
        .rejects
        .toThrow('Savepoints are disabled in the current configuration');
    });
  });

  describe('distributed transactions', () => {
    it('should execute a distributed transaction', async () => {
      // Arrange
      const mockCallback = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });
      const options: DistributedTransactionOptions = {
        participants: ['service1', 'service2'],
        isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
      };
      
      // Mock prepare and commit methods
      jest.spyOn(service as any, 'prepareAllParticipants').mockResolvedValue([
        { participantId: 'service1', prepared: true },
        { participantId: 'service2', prepared: true },
      ]);
      
      jest.spyOn(service as any, 'commitAllParticipants').mockResolvedValue([
        { participantId: 'service1', committed: true },
        { participantId: 'service2', committed: true },
      ]);
      
      // Act
      const result = await service.executeDistributedTransaction(mockCallback, options);
      
      // Assert
      expect(result).toEqual({ id: 1, name: 'Test' });
      expect(mockCallback).toHaveBeenCalled();
      expect(service['prepareAllParticipants']).toHaveBeenCalledWith(
        'mock-transaction-id',
        ['service1', 'service2'],
        expect.any(Number)
      );
      expect(service['commitAllParticipants']).toHaveBeenCalledWith(
        'mock-transaction-id',
        ['service1', 'service2'],
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should abort if any participant fails to prepare', async () => {
      // Arrange
      const mockCallback = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });
      const options: DistributedTransactionOptions = {
        participants: ['service1', 'service2'],
        isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
        prepareFailureStrategy: 'abort',
      };
      
      // Mock prepare method to return a failed participant
      jest.spyOn(service as any, 'prepareAllParticipants').mockResolvedValue([
        { participantId: 'service1', prepared: true },
        { participantId: 'service2', prepared: false },
      ]);
      
      // Act & Assert
      await expect(service.executeDistributedTransaction(mockCallback, options))
        .rejects
        .toThrow(DistributedTransactionError);
      
      // Verify that the transaction was rolled back
      expect(mockTransactionClient.$executeRaw).toHaveBeenCalledWith(expect.stringContaining('ROLLBACK'));
    });

    it('should compensate if any participant fails to commit', async () => {
      // Arrange
      const mockCallback = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });
      const options: DistributedTransactionOptions = {
        participants: ['service1', 'service2'],
        isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
        commitFailureStrategy: 'compensate',
      };
      
      // Mock prepare method to return successful participants
      jest.spyOn(service as any, 'prepareAllParticipants').mockResolvedValue([
        { participantId: 'service1', prepared: true },
        { participantId: 'service2', prepared: true },
      ]);
      
      // Mock commit method to return a failed participant
      jest.spyOn(service as any, 'commitAllParticipants').mockResolvedValue([
        { participantId: 'service1', committed: true },
        { participantId: 'service2', committed: false },
      ]);
      
      // Mock compensate method
      jest.spyOn(service as any, 'compensateParticipants').mockResolvedValue(undefined);
      
      // Act & Assert
      await expect(service.executeDistributedTransaction(mockCallback, options))
        .rejects
        .toThrow(DistributedTransactionError);
      
      // Verify that compensation was attempted
      expect(service['compensateParticipants']).toHaveBeenCalledWith(
        'mock-transaction-id',
        ['service1']
      );
    });

    it('should throw an error if distributed transactions are disabled', async () => {
      // Arrange
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'DATABASE_ENABLE_DISTRIBUTED_TRANSACTIONS') return false;
        return null;
      });
      
      // Recreate service with updated config
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TransactionService,
          {
            provide: PrismaService,
            useValue: prismaService,
          },
          {
            provide: ConfigService,
            useValue: configService,
          },
        ],
      }).compile();
      
      const disabledService = module.get<TransactionService>(TransactionService);
      const mockCallback = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });
      const options: DistributedTransactionOptions = {
        participants: ['service1', 'service2'],
      };
      
      // Act & Assert
      await expect(disabledService.executeDistributedTransaction(mockCallback, options))
        .rejects
        .toThrow('Distributed transactions are disabled in the current configuration');
    });
  });

  describe('transaction timeout', () => {
    it('should execute a function with a timeout', async () => {
      // Arrange
      const mockFn = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });
      
      // Act
      const result = await service['executeWithTimeout'](mockFn, 1000, 'test-operation');
      
      // Assert
      expect(result).toEqual({ id: 1, name: 'Test' });
      expect(mockFn).toHaveBeenCalled();
    });

    it('should throw a timeout error if execution exceeds timeout', async () => {
      // Arrange
      jest.useFakeTimers();
      
      const mockFn = jest.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve({ id: 1, name: 'Test' }), 2000);
        });
      });
      
      // Create a promise that will be rejected by the timeout
      const promise = service['executeWithTimeout'](mockFn, 1000, 'test-operation');
      
      // Advance timers to trigger the timeout
      jest.advanceTimersByTime(1001);
      
      // Act & Assert
      await expect(promise).rejects.toThrow(TransactionTimeoutError);
      
      // Cleanup
      jest.useRealTimers();
    });
  });

  describe('error handling', () => {
    it('should transform Prisma errors to transaction errors', () => {
      // Arrange
      const prismaError = new Error('Prisma error');
      prismaError['code'] = 'P2028'; // Transaction API error
      
      // Act
      const transformedError = service['transformError'](prismaError, 'mock-transaction-id', 'execute');
      
      // Assert
      expect(transformedError).toBeInstanceOf(TransactionError);
      expect(transformedError.message).toContain('mock-transaction-id');
      expect(transformedError.message).toContain('execute');
    });

    it('should transform timeout errors', () => {
      // Arrange
      const timeoutError = new Error('Operation timed out');
      timeoutError.name = 'TimeoutError';
      
      // Act
      const transformedError = service['transformError'](timeoutError, 'mock-transaction-id', 'execute');
      
      // Assert
      expect(transformedError).toBeInstanceOf(TransactionTimeoutError);
      expect(transformedError.message).toContain('mock-transaction-id');
      expect(transformedError.message).toContain('timed out');
    });

    it('should transform connection errors', () => {
      // Arrange
      const connectionError = new Error('Connection closed unexpectedly');
      
      // Act
      const transformedError = service['transformError'](connectionError, 'mock-transaction-id', 'execute');
      
      // Assert
      expect(transformedError).toBeInstanceOf(TransactionError);
      expect(transformedError.message).toContain('mock-transaction-id');
      expect(transformedError.message).toContain('Connection closed');
    });
  });

  describe('retry logic', () => {
    it('should determine if an error is retryable', () => {
      // Arrange
      const deadlockError = new DeadlockError('Deadlock detected', 'resource1', ['pid1']);
      const nonRetryableError = new TransactionError('Non-retryable error');
      
      // Act & Assert
      expect(service['shouldRetry'](deadlockError, 0, { maxRetries: 3 })).toBe(true);
      expect(service['shouldRetry'](nonRetryableError, 0, { maxRetries: 3 })).toBe(false);
    });

    it('should not retry if max retries is exceeded', () => {
      // Arrange
      const deadlockError = new DeadlockError('Deadlock detected', 'resource1', ['pid1']);
      
      // Act & Assert
      expect(service['shouldRetry'](deadlockError, 3, { maxRetries: 3 })).toBe(false);
    });

    it('should calculate retry delay with exponential backoff', () => {
      // Act & Assert
      expect(service['calculateRetryDelay'](1, { initialDelay: 100, backoffFactor: 2 }))
        .toBeGreaterThanOrEqual(100);
      expect(service['calculateRetryDelay'](2, { initialDelay: 100, backoffFactor: 2 }))
        .toBeGreaterThanOrEqual(200);
      expect(service['calculateRetryDelay'](3, { initialDelay: 100, backoffFactor: 2 }))
        .toBeGreaterThanOrEqual(400);
    });

    it('should respect max delay', () => {
      // Act & Assert
      expect(service['calculateRetryDelay'](10, { initialDelay: 100, backoffFactor: 2, maxDelay: 1000 }))
        .toBeLessThanOrEqual(1000);
    });
  });
});
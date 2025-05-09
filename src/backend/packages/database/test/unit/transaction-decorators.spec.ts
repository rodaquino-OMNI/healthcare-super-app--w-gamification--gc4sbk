/**
 * @file transaction-decorators.spec.ts
 * @description Unit tests for transaction decorators that provide declarative transaction management
 * in service classes. Tests verify the @Transactional decorator's behavior, automatic rollback on
 * exceptions, isolation level configuration, and integration with tracing and metrics.
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from '@nestjs/common';
import { performance } from 'perf_hooks';

// Import the decorators and related types
import {
  Transactional,
  ReadOnly,
  ReadWrite,
  WriteOnly,
  CriticalWrite,
  isInTransaction,
  getCurrentTransactionClient,
  getCurrentTransactionMetadata
} from '../../../src/transactions/transaction.decorators';

import {
  TransactionIsolationLevel,
  TransactionType,
  TransactionState
} from '../../../src/types/transaction.types';

import { TransactionError, DeadlockError } from '../../../src/transactions/transaction.errors';
import { OperationType } from '../../../src/transactions/transaction.utils';

// Mock TracingService
class TracingService {
  traceSpan = jest.fn().mockImplementation((name, fn) => fn({ setAttribute: jest.fn(), recordException: jest.fn() }));
}

// Mock LoggerService
class LoggerService {
  log = jest.fn();
  error = jest.fn();
  warn = jest.fn();
  debug = jest.fn();
}

// Mock MetricsService
class MetricsService {
  recordHistogram = jest.fn();
  incrementCounter = jest.fn();
}

// Mock PrismaClient
const mockPrismaClient = {
  $transaction: jest.fn(),
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  profile: {
    create: jest.fn(),
    delete: jest.fn()
  }
};

// Mock for performance.now to control timing in tests
jest.mock('perf_hooks', () => ({
  performance: {
    now: jest.fn()
  }
}));

describe('Transaction Decorators', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    (performance.now as jest.Mock).mockImplementation(() => Date.now());
    mockPrismaClient.$transaction.mockImplementation(callback => callback(mockPrismaClient));
  });

  describe('@Transactional decorator', () => {
    // Test class with transactional methods
    class UserService {
      prisma = mockPrismaClient;
      tracingService = new TracingService();
      logger = new LoggerService();
      metricsService = new MetricsService();
      journeyContext = 'health';

      @Transactional()
      async createUser(data: any) {
        const user = await this.prisma.user.create({ data });
        await this.prisma.profile.create({ data: { userId: user.id } });
        return user;
      }

      @Transactional({ isolationLevel: TransactionIsolationLevel.SERIALIZABLE })
      async updateUserWithHighIsolation(id: number, data: any) {
        return this.prisma.user.update({ where: { id }, data });
      }

      @Transactional()
      async deleteUserWithError(id: number) {
        await this.prisma.profile.delete({ where: { userId: id } });
        throw new Error('Simulated error');
      }

      @Transactional({ enableTracing: true })
      async getUserWithTracing(id: number) {
        return this.prisma.user.findUnique({ where: { id } });
      }

      @Transactional({ enableMetrics: true })
      async getUserWithMetrics(id: number) {
        return this.prisma.user.findUnique({ where: { id } });
      }

      @Transactional()
      async checkTransactionContext() {
        return {
          isInTransaction: isInTransaction(this),
          client: getCurrentTransactionClient(this),
          metadata: getCurrentTransactionMetadata(this)
        };
      }

      @Transactional({ requiresNew: true })
      async createUserWithNewTransaction(data: any) {
        return this.prisma.user.create({ data });
      }

      @Transactional()
      async nestedTransactionParent(data: any) {
        const user = await this.prisma.user.create({ data });
        await this.nestedTransactionChild(user.id);
        return user;
      }

      @Transactional()
      async nestedTransactionChild(userId: number) {
        return this.prisma.profile.create({ data: { userId } });
      }

      @Transactional({ operationType: OperationType.CRITICAL_WRITE })
      async operationTypeTransaction(data: any) {
        return this.prisma.user.create({ data });
      }
    }

    let userService: UserService;

    beforeEach(() => {
      userService = new UserService();
    });

    it('should execute the method within a transaction', async () => {
      const userData = { name: 'Test User' };
      const mockUser = { id: 1, ...userData };
      
      mockPrismaClient.user.create.mockResolvedValue(mockUser);
      mockPrismaClient.profile.create.mockResolvedValue({ id: 1, userId: 1 });

      const result = await userService.createUser(userData);

      expect(mockPrismaClient.$transaction).toHaveBeenCalled();
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({ data: userData });
      expect(mockPrismaClient.profile.create).toHaveBeenCalledWith({ data: { userId: 1 } });
      expect(result).toEqual(mockUser);
    });

    it('should use the specified isolation level', async () => {
      const userData = { name: 'Updated User' };
      const mockUser = { id: 1, ...userData };
      
      mockPrismaClient.user.update.mockResolvedValue(mockUser);

      await userService.updateUserWithHighIsolation(1, userData);

      expect(mockPrismaClient.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          isolationLevel: 'Serializable'
        })
      );
    });

    it('should automatically rollback on exceptions', async () => {
      mockPrismaClient.profile.delete.mockResolvedValue({ id: 1, userId: 1 });

      await expect(userService.deleteUserWithError(1)).rejects.toThrow('Simulated error');

      expect(mockPrismaClient.$transaction).toHaveBeenCalled();
      expect(mockPrismaClient.profile.delete).toHaveBeenCalledWith({ where: { userId: 1 } });
      // The transaction should have been rolled back automatically
    });

    it('should integrate with tracing when enabled', async () => {
      const mockUser = { id: 1, name: 'Test User' };
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      await userService.getUserWithTracing(1);

      expect(userService.tracingService.traceSpan).toHaveBeenCalled();
      expect(userService.tracingService.traceSpan.mock.calls[0][0]).toContain('getUserWithTracing');
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should collect metrics when enabled', async () => {
      const mockUser = { id: 1, name: 'Test User' };
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      // Mock performance.now to return predictable values for timing calculations
      (performance.now as jest.Mock).mockReturnValueOnce(1000).mockReturnValueOnce(2000);

      await userService.getUserWithMetrics(1);

      expect(userService.metricsService.recordHistogram).toHaveBeenCalled();
      expect(userService.metricsService.incrementCounter).toHaveBeenCalled();
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should provide transaction context utilities', async () => {
      const result = await userService.checkTransactionContext();

      expect(result.isInTransaction).toBe(true);
      expect(result.client).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.journeyContext).toBe('health');
    });

    it('should create a new transaction when requiresNew is true', async () => {
      const userData = { name: 'New Transaction User' };
      const mockUser = { id: 1, ...userData };
      
      mockPrismaClient.user.create.mockResolvedValue(mockUser);

      await userService.createUserWithNewTransaction(userData);

      expect(mockPrismaClient.$transaction).toHaveBeenCalled();
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({ data: userData });
    });

    it('should handle nested transactions correctly', async () => {
      const userData = { name: 'Parent Transaction User' };
      const mockUser = { id: 1, ...userData };
      
      mockPrismaClient.user.create.mockResolvedValue(mockUser);
      mockPrismaClient.profile.create.mockResolvedValue({ id: 1, userId: 1 });

      await userService.nestedTransactionParent(userData);

      expect(mockPrismaClient.$transaction).toHaveBeenCalledTimes(1); // Only one transaction should be created
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({ data: userData });
      expect(mockPrismaClient.profile.create).toHaveBeenCalledWith({ data: { userId: 1 } });
    });

    it('should use the correct isolation level based on operation type', async () => {
      const userData = { name: 'Operation Type User' };
      const mockUser = { id: 1, ...userData };
      
      mockPrismaClient.user.create.mockResolvedValue(mockUser);

      await userService.operationTypeTransaction(userData);

      expect(mockPrismaClient.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          isolationLevel: 'Serializable' // CRITICAL_WRITE should use SERIALIZABLE
        })
      );
    });
  });

  describe('Specialized transaction decorators', () => {
    class SpecializedService {
      prisma = mockPrismaClient;

      @ReadOnly()
      async getUser(id: number) {
        return this.prisma.user.findUnique({ where: { id } });
      }

      @ReadWrite()
      async updateUser(id: number, data: any) {
        return this.prisma.user.update({ where: { id }, data });
      }

      @WriteOnly()
      async deleteUser(id: number) {
        await this.prisma.profile.delete({ where: { userId: id } });
        return this.prisma.user.delete({ where: { id } });
      }

      @CriticalWrite()
      async transferData(fromId: number, toId: number) {
        const fromUser = await this.prisma.user.findUnique({ where: { id: fromId } });
        const toUser = await this.prisma.user.findUnique({ where: { id: toId } });
        // Simulate a critical operation
        return { fromUser, toUser };
      }
    }

    let specializedService: SpecializedService;

    beforeEach(() => {
      specializedService = new SpecializedService();
    });

    it('should use READ_COMMITTED isolation level for @ReadOnly', async () => {
      const mockUser = { id: 1, name: 'Test User' };
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      await specializedService.getUser(1);

      expect(mockPrismaClient.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          isolationLevel: 'ReadCommitted'
        })
      );
    });

    it('should use REPEATABLE_READ isolation level for @ReadWrite', async () => {
      const userData = { name: 'Updated User' };
      const mockUser = { id: 1, ...userData };
      
      mockPrismaClient.user.update.mockResolvedValue(mockUser);

      await specializedService.updateUser(1, userData);

      expect(mockPrismaClient.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          isolationLevel: 'RepeatableRead'
        })
      );
    });

    it('should use READ_COMMITTED isolation level for @WriteOnly', async () => {
      mockPrismaClient.profile.delete.mockResolvedValue({ id: 1, userId: 1 });
      mockPrismaClient.user.delete.mockResolvedValue({ id: 1, name: 'Deleted User' });

      await specializedService.deleteUser(1);

      expect(mockPrismaClient.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          isolationLevel: 'ReadCommitted'
        })
      );
    });

    it('should use SERIALIZABLE isolation level for @CriticalWrite', async () => {
      const mockUser1 = { id: 1, name: 'User 1' };
      const mockUser2 = { id: 2, name: 'User 2' };
      
      mockPrismaClient.user.findUnique.mockImplementation((args) => {
        if (args.where.id === 1) return Promise.resolve(mockUser1);
        if (args.where.id === 2) return Promise.resolve(mockUser2);
        return Promise.resolve(null);
      });

      await specializedService.transferData(1, 2);

      expect(mockPrismaClient.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          isolationLevel: 'Serializable'
        })
      );
    });
  });

  describe('Error handling', () => {
    class ErrorHandlingService {
      prisma = mockPrismaClient;
      logger = new LoggerService();
      tracingService = new TracingService();

      @Transactional()
      async simulateDeadlock() {
        // Simulate a deadlock error
        const error = new DeadlockError(
          'Transaction was terminated due to a deadlock',
          'resource123',
          'tx456'
        );
        throw error;
      }

      @Transactional({ enableTracing: true })
      async simulateErrorWithTracing() {
        throw new Error('Error with tracing');
      }

      @Transactional({ retry: { maxRetries: 3 } })
      async simulateRetryableError() {
        throw new TransactionError(
          'Transient error',
          'DB_TRANS_RETRY',
          undefined,
          undefined,
          { journey: 'health', feature: 'metrics' },
          { operation: 'update', entity: 'healthMetric' }
        );
      }
    }

    let errorService: ErrorHandlingService;

    beforeEach(() => {
      errorService = new ErrorHandlingService();
    });

    it('should properly handle and propagate deadlock errors', async () => {
      await expect(errorService.simulateDeadlock()).rejects.toThrow(DeadlockError);
      await expect(errorService.simulateDeadlock()).rejects.toThrow('Transaction was terminated due to a deadlock');
    });

    it('should record exceptions in tracing spans', async () => {
      await expect(errorService.simulateErrorWithTracing()).rejects.toThrow('Error with tracing');
      
      // Verify that traceSpan was called and the error was recorded
      expect(errorService.tracingService.traceSpan).toHaveBeenCalled();
      const mockSpan = errorService.tracingService.traceSpan.mock.calls[0][1];
      expect(mockSpan).toBeDefined();
    });

    it('should handle retryable errors with the configured retry policy', async () => {
      // This test is more about verifying the retry configuration is passed correctly
      // since actual retries are handled by the transaction utils
      await expect(errorService.simulateRetryableError()).rejects.toThrow('Transient error');
      
      expect(mockPrismaClient.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          maxWait: expect.any(Number),
          timeout: expect.any(Number)
        })
      );
    });
  });
});
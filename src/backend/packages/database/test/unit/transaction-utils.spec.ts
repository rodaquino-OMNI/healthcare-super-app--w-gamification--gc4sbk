/**
 * @file transaction-utils.spec.ts
 * @description Unit tests for transaction utility functions
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { mockDeep, MockProxy } from 'jest-mock-extended';
import { Logger } from '@austa/logging';
import { TransactionError, DeadlockError, SerializationError } from '../../src/transactions/transaction.errors';
import {
  DEFAULT_TRANSACTION_OPTIONS,
  TransactionMetrics,
  executeInTransaction,
  executeWithRetry,
  recommendIsolationLevel,
  calculateBackoffDelay,
  isRetryableError,
  getTransactionMetrics,
  clearTransactionMetrics,
  calculateTransactionStats,
  createTransactionContext,
  generateTransactionId,
  sleep,
  debugTransaction
} from '../../src/transactions/transaction.utils';
import { TransactionIsolationLevel } from '../../src/transactions/transaction.interface';

// Mock dependencies
jest.mock('@austa/logging', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }))
}));

describe('Transaction Utilities', () => {
  let mockPrisma: MockProxy<PrismaClient> & PrismaClient;
  let mockTx: MockProxy<Prisma.TransactionClient> & Prisma.TransactionClient;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = mockDeep<PrismaClient>();
    mockTx = mockDeep<Prisma.TransactionClient>();
    
    // Setup the $transaction mock to execute the callback with the mock transaction client
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      return callback(mockTx);
    });
    
    // Clear transaction metrics before each test
    clearTransactionMetrics();
  });
  
  describe('Transaction ID Generation', () => {
    it('should generate unique transaction IDs', () => {
      const id1 = generateTransactionId();
      const id2 = generateTransactionId();
      
      expect(id1).toMatch(/^tx-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^tx-\d+-[a-z0-9]+$/);
      expect(id1).not.toEqual(id2);
    });
  });
  
  describe('Isolation Level Selection', () => {
    it('should recommend READ_COMMITTED for read-only operations', () => {
      const level = recommendIsolationLevel('read-only');
      expect(level).toBe(TransactionIsolationLevel.READ_COMMITTED);
    });
    
    it('should recommend READ_COMMITTED for standard write operations', () => {
      const level = recommendIsolationLevel('write');
      expect(level).toBe(TransactionIsolationLevel.READ_COMMITTED);
    });
    
    it('should recommend REPEATABLE_READ for critical write operations', () => {
      const level = recommendIsolationLevel('critical-write');
      expect(level).toBe(TransactionIsolationLevel.REPEATABLE_READ);
    });
    
    it('should recommend SERIALIZABLE for financial operations', () => {
      const level = recommendIsolationLevel('financial');
      expect(level).toBe(TransactionIsolationLevel.SERIALIZABLE);
    });
    
    it('should recommend SERIALIZABLE for payment operations', () => {
      const level = recommendIsolationLevel('payment');
      expect(level).toBe(TransactionIsolationLevel.SERIALIZABLE);
    });
    
    it('should recommend SERIALIZABLE for balance update operations', () => {
      const level = recommendIsolationLevel('balance-update');
      expect(level).toBe(TransactionIsolationLevel.SERIALIZABLE);
    });
    
    it('should default to READ_COMMITTED for unknown operation types', () => {
      const level = recommendIsolationLevel('unknown-operation');
      expect(level).toBe(TransactionIsolationLevel.READ_COMMITTED);
    });
    
    it('should be case-insensitive when determining isolation level', () => {
      const level = recommendIsolationLevel('FINANCIAL');
      expect(level).toBe(TransactionIsolationLevel.SERIALIZABLE);
    });
  });
  
  describe('Transaction Execution', () => {
    it('should execute a function within a transaction', async () => {
      const fn = jest.fn().mockResolvedValue('result');
      
      const result = await executeInTransaction(mockPrisma, fn);
      
      expect(result).toBe('result');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(fn).toHaveBeenCalledWith(expect.anything());
    });
    
    it('should use the recommended isolation level based on operation type', async () => {
      const fn = jest.fn().mockResolvedValue('result');
      
      await executeInTransaction(mockPrisma, fn, { operationType: 'financial' });
      
      expect(mockPrisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        { isolationLevel: TransactionIsolationLevel.SERIALIZABLE }
      );
    });
    
    it('should use the specified isolation level when provided', async () => {
      const fn = jest.fn().mockResolvedValue('result');
      
      await executeInTransaction(mockPrisma, fn, {
        isolationLevel: TransactionIsolationLevel.REPEATABLE_READ,
        operationType: 'financial' // This would normally recommend SERIALIZABLE
      });
      
      expect(mockPrisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        { isolationLevel: TransactionIsolationLevel.REPEATABLE_READ }
      );
    });
    
    it('should collect metrics when enabled', async () => {
      const fn = jest.fn().mockResolvedValue('result');
      
      await executeInTransaction(mockPrisma, fn, {
        operationType: 'read-only',
        enableMetrics: true
      });
      
      const metrics = getTransactionMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].operationType).toBe('read-only');
      expect(metrics[0].success).toBe(true);
      expect(metrics[0].isolationLevel).toBe(TransactionIsolationLevel.READ_COMMITTED);
    });
    
    it('should not collect metrics when disabled', async () => {
      const fn = jest.fn().mockResolvedValue('result');
      
      await executeInTransaction(mockPrisma, fn, {
        operationType: 'read-only',
        enableMetrics: false
      });
      
      const metrics = getTransactionMetrics();
      expect(metrics.length).toBe(0);
    });
    
    it('should handle errors and propagate them', async () => {
      const error = new Error('Transaction failed');
      const fn = jest.fn().mockRejectedValue(error);
      
      await expect(executeInTransaction(mockPrisma, fn)).rejects.toThrow('Transaction failed');
      
      const metrics = getTransactionMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].success).toBe(false);
      expect(metrics[0].error).toBe(error);
    });
    
    it('should handle transaction timeouts', async () => {
      // Mock setTimeout and clearTimeout
      jest.useFakeTimers();
      const originalSetTimeout = global.setTimeout;
      const originalClearTimeout = global.clearTimeout;
      
      try {
        // Mock setTimeout to immediately execute the callback
        global.setTimeout = jest.fn().mockImplementation((callback) => {
          callback();
          return 1 as unknown as NodeJS.Timeout;
        });
        global.clearTimeout = jest.fn();
        
        const fn = jest.fn().mockImplementation(() => new Promise((resolve) => {
          // This promise will never resolve, simulating a long-running transaction
        }));
        
        // Execute with a very short timeout
        const promise = executeInTransaction(mockPrisma, fn, { timeout: 1 });
        
        await expect(promise).rejects.toThrow(TransactionError);
        await expect(promise).rejects.toThrow(/timed out/);
      } finally {
        // Restore the original setTimeout and clearTimeout
        global.setTimeout = originalSetTimeout;
        global.clearTimeout = originalClearTimeout;
        jest.useRealTimers();
      }
    });
  });
  
  describe('Transaction Retry Utilities', () => {
    it('should calculate backoff delay with exponential growth', () => {
      const baseDelay = 100;
      
      const delay1 = calculateBackoffDelay(1, baseDelay);
      const delay2 = calculateBackoffDelay(2, baseDelay);
      const delay3 = calculateBackoffDelay(3, baseDelay);
      
      // With jitter, we can only check ranges
      expect(delay1).toBeGreaterThanOrEqual(baseDelay * 2 * 0.75); // 2^1 * 100 * 0.75 = 150
      expect(delay1).toBeLessThanOrEqual(baseDelay * 2); // 2^1 * 100 = 200
      
      expect(delay2).toBeGreaterThanOrEqual(baseDelay * 4 * 0.75); // 2^2 * 100 * 0.75 = 300
      expect(delay2).toBeLessThanOrEqual(baseDelay * 4); // 2^2 * 100 = 400
      
      expect(delay3).toBeGreaterThanOrEqual(baseDelay * 8 * 0.75); // 2^3 * 100 * 0.75 = 600
      expect(delay3).toBeLessThanOrEqual(baseDelay * 8); // 2^3 * 100 = 800
    });
    
    it('should identify retryable Prisma errors', () => {
      const retryableCodes = ['P1000', 'P1001', 'P1002', 'P1008', 'P1017', 'P2024', 'P2028'];
      
      for (const code of retryableCodes) {
        const error = new Prisma.PrismaClientKnownRequestError('Test error', {
          code,
          clientVersion: '4.0.0',
        });
        
        expect(isRetryableError(error)).toBe(true);
      }
    });
    
    it('should identify non-retryable Prisma errors', () => {
      const nonRetryableCodes = ['P2002', 'P2003', 'P2025'];
      
      for (const code of nonRetryableCodes) {
        const error = new Prisma.PrismaClientKnownRequestError('Test error', {
          code,
          clientVersion: '4.0.0',
        });
        
        expect(isRetryableError(error)).toBe(false);
      }
    });
    
    it('should identify PostgreSQL serialization failures as retryable', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Transaction serialization failure 40001',
        {
          code: 'P2034',
          clientVersion: '4.0.0',
        }
      );
      
      expect(isRetryableError(error)).toBe(true);
    });
    
    it('should identify PostgreSQL deadlock detection as retryable', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Deadlock detected 40P01',
        {
          code: 'P2034',
          clientVersion: '4.0.0',
        }
      );
      
      expect(isRetryableError(error)).toBe(true);
    });
    
    it('should identify connection-related errors as retryable', () => {
      const connectionErrors = [
        new Error('connection timeout'),
        new Error('connection closed'),
        new Error('connection terminated'),
        new Error('connection reset')
      ];
      
      for (const error of connectionErrors) {
        expect(isRetryableError(error)).toBe(true);
      }
    });
    
    it('should identify generic errors as non-retryable', () => {
      const error = new Error('Some random error');
      expect(isRetryableError(error)).toBe(false);
    });
  });
  
  describe('Transaction Retry Execution', () => {
    it('should retry a failed transaction up to maxRetries times', async () => {
      // Mock sleep to avoid waiting in tests
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return {} as any;
      });
      
      const error = new Prisma.PrismaClientKnownRequestError('Connection error', {
        code: 'P1001',
        clientVersion: '4.0.0',
      });
      
      const fn = jest.fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');
      
      const result = await executeWithRetry(mockPrisma, fn, {
        maxRetries: 3,
        retryDelay: 10,
        enableLogging: false
      });
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
      
      const metrics = getTransactionMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].retryCount).toBe(2);
      expect(metrics[0].success).toBe(true);
    });
    
    it('should fail after exhausting all retry attempts', async () => {
      // Mock sleep to avoid waiting in tests
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return {} as any;
      });
      
      const error = new Prisma.PrismaClientKnownRequestError('Connection error', {
        code: 'P1001',
        clientVersion: '4.0.0',
      });
      
      const fn = jest.fn().mockRejectedValue(error);
      
      await expect(executeWithRetry(mockPrisma, fn, {
        maxRetries: 2,
        retryDelay: 10,
        enableLogging: false
      })).rejects.toThrow('Connection error');
      
      expect(fn).toHaveBeenCalledTimes(3); // Initial attempt + 2 retries
      
      const metrics = getTransactionMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].retryCount).toBe(2);
      expect(metrics[0].success).toBe(false);
      expect(metrics[0].error).toBe(error);
    });
    
    it('should not retry non-retryable errors', async () => {
      const error = new Error('Non-retryable error');
      const fn = jest.fn().mockRejectedValue(error);
      
      await expect(executeWithRetry(mockPrisma, fn, {
        maxRetries: 3,
        retryDelay: 10,
        enableLogging: false
      })).rejects.toThrow('Non-retryable error');
      
      expect(fn).toHaveBeenCalledTimes(1); // Only the initial attempt, no retries
    });
  });
  
  describe('Transaction Metrics', () => {
    it('should collect and retrieve transaction metrics', async () => {
      const fn1 = jest.fn().mockResolvedValue('result1');
      const fn2 = jest.fn().mockResolvedValue('result2');
      const fn3 = jest.fn().mockRejectedValue(new Error('Failed'));
      
      await executeInTransaction(mockPrisma, fn1, { operationType: 'read-only' });
      await executeInTransaction(mockPrisma, fn2, { operationType: 'write' });
      await executeInTransaction(mockPrisma, fn3, { operationType: 'critical-write' }).catch(() => {});
      
      const metrics = getTransactionMetrics();
      
      expect(metrics.length).toBe(3);
      expect(metrics[0].operationType).toBe('read-only');
      expect(metrics[0].success).toBe(true);
      expect(metrics[1].operationType).toBe('write');
      expect(metrics[1].success).toBe(true);
      expect(metrics[2].operationType).toBe('critical-write');
      expect(metrics[2].success).toBe(false);
    });
    
    it('should clear transaction metrics', async () => {
      const fn = jest.fn().mockResolvedValue('result');
      
      await executeInTransaction(mockPrisma, fn);
      
      let metrics = getTransactionMetrics();
      expect(metrics.length).toBe(1);
      
      clearTransactionMetrics();
      
      metrics = getTransactionMetrics();
      expect(metrics.length).toBe(0);
    });
    
    it('should limit the number of metrics returned', async () => {
      const fn = jest.fn().mockResolvedValue('result');
      
      // Execute 5 transactions
      for (let i = 0; i < 5; i++) {
        await executeInTransaction(mockPrisma, fn, { operationType: `operation-${i}` });
      }
      
      // Get only the last 3 metrics
      const metrics = getTransactionMetrics(3);
      
      expect(metrics.length).toBe(3);
      expect(metrics[0].operationType).toBe('operation-2');
      expect(metrics[1].operationType).toBe('operation-3');
      expect(metrics[2].operationType).toBe('operation-4');
    });
    
    it('should calculate transaction statistics', async () => {
      const fn1 = jest.fn().mockResolvedValue('result1');
      const fn2 = jest.fn().mockResolvedValue('result2');
      const fn3 = jest.fn().mockRejectedValue(new Error('Failed'));
      const fn4 = jest.fn().mockResolvedValue('result4');
      
      // Mock Date.now to return consistent values for testing
      const originalDateNow = Date.now;
      let currentTime = 1000;
      Date.now = jest.fn().mockImplementation(() => {
        currentTime += 100;
        return currentTime;
      });
      
      try {
        await executeInTransaction(mockPrisma, fn1, {
          operationType: 'read-only',
          isolationLevel: TransactionIsolationLevel.READ_COMMITTED
        });
        
        await executeInTransaction(mockPrisma, fn2, {
          operationType: 'write',
          isolationLevel: TransactionIsolationLevel.READ_COMMITTED
        });
        
        await executeInTransaction(mockPrisma, fn3, {
          operationType: 'critical-write',
          isolationLevel: TransactionIsolationLevel.REPEATABLE_READ
        }).catch(() => {});
        
        await executeWithRetry(mockPrisma, fn4, {
          operationType: 'financial',
          isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
          maxRetries: 2,
          retryDelay: 10,
          enableLogging: false
        });
        
        const stats = calculateTransactionStats();
        
        expect(stats.totalTransactions).toBe(4);
        expect(stats.successRate).toBe(0.75); // 3 out of 4 succeeded
        expect(stats.errorRate).toBe(0.25); // 1 out of 4 failed
        expect(stats.transactionsByIsolationLevel).toEqual({
          [TransactionIsolationLevel.READ_COMMITTED]: 2,
          [TransactionIsolationLevel.REPEATABLE_READ]: 1,
          [TransactionIsolationLevel.SERIALIZABLE]: 1
        });
      } finally {
        // Restore the original Date.now
        Date.now = originalDateNow;
      }
    });
    
    it('should debug a specific transaction', async () => {
      const fn = jest.fn().mockResolvedValue('result');
      const mockLogger = new Logger('TransactionUtils');
      
      await executeInTransaction(mockPrisma, fn, { operationType: 'test-operation' });
      
      const metrics = getTransactionMetrics();
      const transactionId = metrics[0].transactionId;
      
      const result = debugTransaction(transactionId);
      
      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalled();
    });
    
    it('should return false when debugging a non-existent transaction', () => {
      const mockLogger = new Logger('TransactionUtils');
      
      const result = debugTransaction('non-existent-id');
      
      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });
  
  describe('Transaction Context Creation', () => {
    it('should create a transaction context with the correct properties', () => {
      const context = createTransactionContext('financial', {
        journeyType: 'health',
        userId: 'user-123',
        sessionId: 'session-456'
      });
      
      expect(context).toEqual({
        transactionId: expect.stringMatching(/^tx-\d+-[a-z0-9]+$/),
        operationType: 'financial',
        startTime: expect.any(Number),
        journeyContext: {
          journeyType: 'health',
          userId: 'user-123',
          sessionId: 'session-456'
        },
        isolationLevel: TransactionIsolationLevel.SERIALIZABLE // Recommended for financial operations
      });
    });
    
    it('should create a transaction context without journey context', () => {
      const context = createTransactionContext('read-only');
      
      expect(context).toEqual({
        transactionId: expect.stringMatching(/^tx-\d+-[a-z0-9]+$/),
        operationType: 'read-only',
        startTime: expect.any(Number),
        isolationLevel: TransactionIsolationLevel.READ_COMMITTED
      });
      expect(context.journeyContext).toBeUndefined();
    });
  });
  
  describe('Sleep Utility', () => {
    it('should resolve after the specified time', async () => {
      jest.useFakeTimers();
      
      const promise = sleep(100);
      
      // Fast-forward time
      jest.advanceTimersByTime(100);
      
      await promise; // This should resolve now
      
      jest.useRealTimers();
    });
  });
});
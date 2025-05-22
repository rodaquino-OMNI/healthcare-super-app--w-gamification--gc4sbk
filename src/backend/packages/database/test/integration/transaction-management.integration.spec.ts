/**
 * @file transaction-management.integration.spec.ts
 * @description Integration tests for transaction management across the database package.
 * Verifies interactions between TransactionService, transaction decorators, and utility functions.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Injectable, Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../src/prisma.service';
import { TransactionService } from '../../src/transactions/transaction.service';
import { Transactional, ReadOnly, Serializable } from '../../src/transactions/transaction.decorators';
import { TransactionIsolationLevel } from '../../src/transactions/transaction.interface';
import { 
  TransactionError, 
  TransactionTimeoutError, 
  DeadlockError, 
  SerializationError 
} from '../../src/transactions/transaction.errors';
import { 
  executeInTransaction, 
  executeWithRetry, 
  isRetryableError, 
  calculateBackoffDelay,
  getTransactionMetrics,
  clearTransactionMetrics
} from '../../src/transactions/transaction.utils';
import { 
  createTestDatabase, 
  cleanupTestDatabase,
  createTestUser,
  createTestRole,
  createTestPermission
} from '../utils/database-test.utils';

/**
 * Test service with transactional methods for testing transaction decorators
 */
@Injectable()
class TestTransactionService {
  constructor(public readonly prismaService: PrismaService) {}

  @Transactional()
  async createUserWithProfile(name: string, email: string): Promise<any> {
    const user = await this.prismaService.user.create({
      data: {
        name,
        email,
        password: 'password',
        phone: '+1234567890',
        cpf: '12345678901'
      }
    });

    // This would normally create a profile, but we're just returning the user for testing
    return user;
  }

  @ReadOnly()
  async getUserById(id: string): Promise<any> {
    return this.prismaService.user.findUnique({
      where: { id }
    });
  }

  @Serializable()
  async updateUserWithStrictIsolation(id: string, name: string): Promise<any> {
    return this.prismaService.user.update({
      where: { id },
      data: { name }
    });
  }

  @Transactional({ timeout: 100 })
  async longRunningOperation(): Promise<void> {
    // Simulate a long-running operation that exceeds the timeout
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  @Transactional()
  async operationThatFails(): Promise<void> {
    await this.prismaService.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
        phone: '+1234567890',
        cpf: '12345678901'
      }
    });

    // Throw an error to trigger rollback
    throw new Error('Intentional error to trigger rollback');
  }
}

/**
 * Test module for transaction management tests
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test',
    }),
  ],
  providers: [PrismaService, TransactionService, TestTransactionService],
  exports: [PrismaService, TransactionService, TestTransactionService],
})
class TestModule {}

describe('Transaction Management Integration', () => {
  let module: TestingModule;
  let prismaService: PrismaService;
  let transactionService: TransactionService;
  let testService: TestTransactionService;
  let configService: ConfigService;

  beforeAll(async () => {
    // Set up test database
    await createTestDatabase();

    // Create test module
    module = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
    transactionService = module.get<TransactionService>(TransactionService);
    testService = module.get<TestTransactionService>(TestTransactionService);
    configService = module.get<ConfigService>(ConfigService);

    // Clear any existing transaction metrics
    clearTransactionMetrics();
  });

  afterAll(async () => {
    // Clean up test database
    await cleanupTestDatabase();
    await module.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prismaService.cleanDatabase();
  });

  describe('TransactionService', () => {
    it('should successfully execute a transaction and commit changes', async () => {
      // Arrange
      const userData = {
        name: 'Transaction Test User',
        email: 'transaction-test@example.com',
        password: 'password',
        phone: '+1234567890',
        cpf: '12345678901'
      };

      // Act
      const result = await transactionService.executeTransaction(async (tx) => {
        const user = await tx.user.create({
          data: userData
        });
        return user;
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(userData.name);
      expect(result.email).toBe(userData.email);

      // Verify the user was actually committed to the database
      const savedUser = await prismaService.user.findUnique({
        where: { email: userData.email }
      });
      expect(savedUser).toBeDefined();
      expect(savedUser?.id).toBe(result.id);
    });

    it('should roll back a transaction when an error is thrown', async () => {
      // Arrange
      const userData = {
        name: 'Rollback Test User',
        email: 'rollback-test@example.com',
        password: 'password',
        phone: '+1234567890',
        cpf: '12345678901'
      };

      // Act & Assert
      await expect(transactionService.executeTransaction(async (tx) => {
        await tx.user.create({
          data: userData
        });
        throw new Error('Intentional error to trigger rollback');
      })).rejects.toThrow('Intentional error to trigger rollback');

      // Verify the user was not committed to the database
      const savedUser = await prismaService.user.findUnique({
        where: { email: userData.email }
      });
      expect(savedUser).toBeNull();
    });

    it('should return transaction metadata when using executeTransactionWithMetadata', async () => {
      // Act
      const { result, metadata } = await transactionService.executeTransactionWithMetadata(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: 'Metadata Test User',
            email: 'metadata-test@example.com',
            password: 'password',
            phone: '+1234567890',
            cpf: '12345678901'
          }
        });
        return user;
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe('Metadata Test User');
      
      expect(metadata).toBeDefined();
      expect(metadata.transactionId).toBeDefined();
      expect(metadata.startedAt).toBeInstanceOf(Date);
      expect(metadata.completedAt).toBeInstanceOf(Date);
      expect(metadata.durationMs).toBeGreaterThan(0);
      expect(metadata.success).toBe(true);
      expect(metadata.retryAttempts).toBe(0);
      expect(metadata.isolationLevel).toBe(TransactionIsolationLevel.READ_COMMITTED);
    });

    it('should support different isolation levels', async () => {
      // Test each isolation level
      for (const isolationLevel of Object.values(TransactionIsolationLevel)) {
        // Act
        const { metadata } = await transactionService.executeTransactionWithMetadata(
          async (tx) => {
            // Just a simple query to test the isolation level
            await tx.user.findMany();
            return true;
          },
          { isolationLevel }
        );

        // Assert
        expect(metadata.isolationLevel).toBe(isolationLevel);
      }
    });

    it('should handle transaction timeouts', async () => {
      // Arrange
      const shortTimeout = 100; // 100ms timeout

      // Act & Assert
      await expect(transactionService.executeTransaction(
        async (tx) => {
          // Simulate a long-running operation that exceeds the timeout
          await new Promise(resolve => setTimeout(resolve, shortTimeout * 2));
          return true;
        },
        { timeout: shortTimeout }
      )).rejects.toThrow(TransactionTimeoutError);
    });
  });

  describe('Savepoint Functionality', () => {
    it('should create and rollback to savepoints within a transaction', async () => {
      // Skip if savepoints are disabled in the configuration
      const enableSavepoints = configService.get<boolean>('DATABASE_ENABLE_SAVEPOINTS', true);
      if (!enableSavepoints) {
        console.log('Skipping savepoint test as savepoints are disabled');
        return;
      }

      // Arrange
      const user1Data = {
        name: 'Savepoint User 1',
        email: 'savepoint1@example.com',
        password: 'password',
        phone: '+1234567890',
        cpf: '12345678901'
      };

      const user2Data = {
        name: 'Savepoint User 2',
        email: 'savepoint2@example.com',
        password: 'password',
        phone: '+1234567890',
        cpf: '12345678902'
      };

      // Act
      await transactionService.executeTransaction(async (tx) => {
        // Create first user
        await tx.user.create({ data: user1Data });

        // Create a savepoint
        const savepointName = await transactionService.createSavepoint(tx);

        // Create second user
        await tx.user.create({ data: user2Data });

        // Rollback to the savepoint (should undo the second user creation)
        await transactionService.rollbackToSavepoint(tx, savepointName);

        // Transaction will commit with only the first user
      });

      // Assert
      const user1 = await prismaService.user.findUnique({
        where: { email: user1Data.email }
      });
      const user2 = await prismaService.user.findUnique({
        where: { email: user2Data.email }
      });

      expect(user1).toBeDefined();
      expect(user2).toBeNull(); // Should not exist due to savepoint rollback
    });

    it('should release savepoints when they are no longer needed', async () => {
      // Skip if savepoints are disabled in the configuration
      const enableSavepoints = configService.get<boolean>('DATABASE_ENABLE_SAVEPOINTS', true);
      if (!enableSavepoints) {
        console.log('Skipping savepoint test as savepoints are disabled');
        return;
      }

      // Act & Assert
      await transactionService.executeTransaction(async (tx) => {
        // Create a savepoint
        const savepointName = await transactionService.createSavepoint(tx);

        // Release the savepoint
        await transactionService.releaseSavepoint(tx, savepointName);

        // This should not throw an error
        await tx.user.findMany();
      });
    });
  });

  describe('Transaction Decorators', () => {
    it('should successfully execute a method with @Transactional decorator', async () => {
      // Act
      const user = await testService.createUserWithProfile('Decorator Test User', 'decorator-test@example.com');

      // Assert
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.name).toBe('Decorator Test User');

      // Verify the user was actually committed to the database
      const savedUser = await prismaService.user.findUnique({
        where: { id: user.id }
      });
      expect(savedUser).toBeDefined();
    });

    it('should roll back changes when a method with @Transactional decorator throws an error', async () => {
      // Act & Assert
      await expect(testService.operationThatFails()).rejects.toThrow('Intentional error to trigger rollback');

      // Verify no user was created
      const user = await prismaService.user.findUnique({
        where: { email: 'test@example.com' }
      });
      expect(user).toBeNull();
    });

    it('should execute a method with @ReadOnly decorator', async () => {
      // Arrange
      const user = await createTestUser(prismaService, {
        name: 'Read Only Test User',
        email: 'readonly-test@example.com'
      });

      // Act
      const result = await testService.getUserById(user.id);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(user.id);
      expect(result.name).toBe(user.name);
    });

    it('should execute a method with @Serializable decorator', async () => {
      // Arrange
      const user = await createTestUser(prismaService, {
        name: 'Serializable Test User',
        email: 'serializable-test@example.com'
      });

      // Act
      const result = await testService.updateUserWithStrictIsolation(user.id, 'Updated Name');

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(user.id);
      expect(result.name).toBe('Updated Name');

      // Verify the update was committed
      const updatedUser = await prismaService.user.findUnique({
        where: { id: user.id }
      });
      expect(updatedUser?.name).toBe('Updated Name');
    });

    it('should handle timeouts in methods with @Transactional decorator', async () => {
      // Act & Assert
      await expect(testService.longRunningOperation()).rejects.toThrow();
    });
  });

  describe('Transaction Utility Functions', () => {
    it('should execute a function within a transaction using executeInTransaction', async () => {
      // Arrange
      const userData = {
        name: 'Utility Test User',
        email: 'utility-test@example.com',
        password: 'password',
        phone: '+1234567890',
        cpf: '12345678901'
      };

      // Act
      const result = await executeInTransaction(prismaService, async (tx) => {
        const user = await tx.user.create({
          data: userData
        });
        return user;
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(userData.name);

      // Verify the user was committed
      const savedUser = await prismaService.user.findUnique({
        where: { email: userData.email }
      });
      expect(savedUser).toBeDefined();
    });

    it('should retry a transaction using executeWithRetry', async () => {
      // Arrange
      let attempts = 0;

      // Act
      const result = await executeWithRetry(prismaService, async (tx) => {
        attempts++;
        if (attempts === 1) {
          // Simulate a retryable error on first attempt
          const error = new Error('Connection terminated') as any;
          error.code = 'P1001'; // Can't reach database server (retryable)
          throw error;
        }
        return 'success';
      }, { maxRetries: 3 });

      // Assert
      expect(result).toBe('success');
      expect(attempts).toBe(2); // Should have retried once
    });

    it('should correctly identify retryable errors', () => {
      // Arrange
      const retryableErrors = [
        // Prisma connection errors
        { code: 'P1001', message: 'Can\'t reach database server' },
        { code: 'P1002', message: 'Database server closed the connection' },
        { code: 'P1008', message: 'Operations timed out' },
        { code: 'P1017', message: 'Server closed the connection' },
        { code: 'P2024', message: 'Timed out fetching a connection from the connection pool' },
        // Generic connection errors
        { message: 'Connection terminated unexpectedly' },
        { message: 'Connection timeout' },
      ];

      const nonRetryableErrors = [
        // Data validation errors
        { code: 'P2002', message: 'Unique constraint failed' },
        { code: 'P2003', message: 'Foreign key constraint failed' },
        // Generic errors
        { message: 'Invalid input data' },
        { message: 'Not found' },
      ];

      // Act & Assert
      for (const errorData of retryableErrors) {
        const error = new Error(errorData.message) as any;
        if (errorData.code) {
          error.code = errorData.code;
        }
        expect(isRetryableError(error)).toBe(true);
      }

      for (const errorData of nonRetryableErrors) {
        const error = new Error(errorData.message) as any;
        if (errorData.code) {
          error.code = errorData.code;
        }
        expect(isRetryableError(error)).toBe(false);
      }
    });

    it('should calculate backoff delay with exponential increase', () => {
      // Act & Assert
      const baseDelay = 100;
      expect(calculateBackoffDelay(1, baseDelay)).toBeGreaterThanOrEqual(baseDelay);
      expect(calculateBackoffDelay(2, baseDelay)).toBeGreaterThanOrEqual(baseDelay * 2);
      expect(calculateBackoffDelay(3, baseDelay)).toBeGreaterThanOrEqual(baseDelay * 4);
      expect(calculateBackoffDelay(4, baseDelay)).toBeGreaterThanOrEqual(baseDelay * 8);
    });
  });

  describe('Transaction Metrics', () => {
    it('should record transaction metrics', async () => {
      // Arrange
      clearTransactionMetrics();

      // Act - Execute several transactions
      await executeInTransaction(prismaService, async (tx) => {
        await tx.user.findMany();
        return true;
      }, { operationType: 'read-only', enableMetrics: true });

      await executeInTransaction(prismaService, async (tx) => {
        await tx.user.create({
          data: {
            name: 'Metrics Test User',
            email: 'metrics-test@example.com',
            password: 'password',
            phone: '+1234567890',
            cpf: '12345678901'
          }
        });
        return true;
      }, { operationType: 'write', enableMetrics: true });

      try {
        await executeInTransaction(prismaService, async () => {
          throw new Error('Intentional error for metrics test');
        }, { operationType: 'error-test', enableMetrics: true });
      } catch (error) {
        // Ignore the error, we just want to record the metrics
      }

      // Assert
      const metrics = getTransactionMetrics();
      expect(metrics.length).toBeGreaterThanOrEqual(3);

      // Check for successful transactions
      const successfulMetrics = metrics.filter(m => m.success);
      expect(successfulMetrics.length).toBeGreaterThanOrEqual(2);

      // Check for failed transactions
      const failedMetrics = metrics.filter(m => !m.success);
      expect(failedMetrics.length).toBeGreaterThanOrEqual(1);

      // Check for operation types
      expect(metrics.some(m => m.operationType === 'read-only')).toBe(true);
      expect(metrics.some(m => m.operationType === 'write')).toBe(true);
      expect(metrics.some(m => m.operationType === 'error-test')).toBe(true);
    });
  });

  describe('Concurrency and Isolation Levels', () => {
    it('should demonstrate READ_COMMITTED isolation level behavior', async () => {
      // This test demonstrates that READ_COMMITTED allows reading committed changes from other transactions
      
      // Arrange
      const userData = {
        name: 'Isolation Test User',
        email: 'isolation-test@example.com',
        password: 'password',
        phone: '+1234567890',
        cpf: '12345678901'
      };

      // Start a transaction but don't commit yet
      const tx1 = await transactionService.createTransaction({
        isolationLevel: TransactionIsolationLevel.READ_COMMITTED
      });

      // Create a user in the first transaction
      await tx1.user.create({ data: userData });

      // Start a second transaction
      const result = await transactionService.executeTransaction(async (tx2) => {
        // Try to read the user created in the first transaction (should not be visible yet)
        const userBeforeCommit = await tx2.user.findUnique({
          where: { email: userData.email }
        });
        
        // Commit the first transaction
        await transactionService.commitTransaction(tx1);
        
        // Now the user should be visible in the second transaction
        const userAfterCommit = await tx2.user.findUnique({
          where: { email: userData.email }
        });
        
        return { userBeforeCommit, userAfterCommit };
      }, { isolationLevel: TransactionIsolationLevel.READ_COMMITTED });

      // Assert
      expect(result.userBeforeCommit).toBeNull(); // Should not be visible before commit
      expect(result.userAfterCommit).toBeDefined(); // Should be visible after commit
      expect(result.userAfterCommit?.email).toBe(userData.email);
    });

    it('should demonstrate REPEATABLE_READ isolation level behavior', async () => {
      // This test demonstrates that REPEATABLE_READ prevents non-repeatable reads
      
      // Arrange
      const userData = {
        name: 'Repeatable Read User',
        email: 'repeatable-read@example.com',
        password: 'password',
        phone: '+1234567890',
        cpf: '12345678901'
      };

      // Create a user first
      await prismaService.user.create({ data: userData });

      // Start a transaction with REPEATABLE_READ
      const result = await transactionService.executeTransaction(async (tx1) => {
        // Read the user first time
        const userFirstRead = await tx1.user.findUnique({
          where: { email: userData.email }
        });
        
        // Update the user outside the transaction
        await prismaService.user.update({
          where: { email: userData.email },
          data: { name: 'Updated Name' }
        });
        
        // Read the user again in the same transaction
        const userSecondRead = await tx1.user.findUnique({
          where: { email: userData.email }
        });
        
        return { userFirstRead, userSecondRead };
      }, { isolationLevel: TransactionIsolationLevel.REPEATABLE_READ });

      // Assert
      expect(result.userFirstRead?.name).toBe(userData.name);
      expect(result.userSecondRead?.name).toBe(userData.name); // Should still see the original name
      
      // But outside the transaction, we should see the updated name
      const updatedUser = await prismaService.user.findUnique({
        where: { email: userData.email }
      });
      expect(updatedUser?.name).toBe('Updated Name');
    });
  });

  describe('Error Handling', () => {
    it('should properly handle and transform database errors', async () => {
      // Act & Assert - Duplicate key error
      const userData = {
        name: 'Error Test User',
        email: 'error-test@example.com',
        password: 'password',
        phone: '+1234567890',
        cpf: '12345678901'
      };

      // Create the user first
      await prismaService.user.create({ data: userData });

      // Try to create the same user again (should fail with unique constraint error)
      await expect(transactionService.executeTransaction(async (tx) => {
        await tx.user.create({ data: userData });
      })).rejects.toThrow();
    });

    it('should handle transaction aborts gracefully', async () => {
      // Act & Assert
      await expect(transactionService.executeTransaction(async () => {
        throw new Error('Intentional abort');
      })).rejects.toThrow('Intentional abort');

      // Verify we can still use the database after an aborted transaction
      const user = await prismaService.user.create({
        data: {
          name: 'After Abort User',
          email: 'after-abort@example.com',
          password: 'password',
          phone: '+1234567890',
          cpf: '12345678901'
        }
      });
      expect(user).toBeDefined();
    });
  });
});
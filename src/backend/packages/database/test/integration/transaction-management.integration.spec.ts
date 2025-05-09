import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma.service';
import { DatabaseModule } from '../../src/database.module';
import { TransactionService } from '../../src/transactions/transaction.service';
import { TransactionIsolationLevel } from '../../src/transactions/transaction.interface';
import { TransactionTimeoutError, DeadlockError } from '../../src/transactions/transaction.errors';
import { Transactional } from '../../src/transactions/transaction.decorators';
import * as transactionUtils from '../../src/transactions/transaction.utils';
import {
  setupTestDatabase,
  teardownTestDatabase,
  createTestTransaction,
  verifyTransactionIsolation,
  simulateDeadlock,
  simulateTimeout
} from '../utils/transaction.utils';
import {
  createTestUser,
  createTestUsers,
  verifyUserExists,
  verifyUserNotExists
} from '../utils/assertion.utils';
import { userFixture } from '../fixtures/common/users.fixtures';

describe('Transaction Management Integration', () => {
  let module: TestingModule;
  let prismaService: PrismaService;
  let transactionService: TransactionService;
  
  beforeAll(async () => {
    // Set up test database with clean state
    await setupTestDatabase();
    
    // Create test module with real implementations
    module = await Test.createTestingModule({
      imports: [DatabaseModule],
    }).compile();
    
    // Get service instances
    prismaService = module.get<PrismaService>(PrismaService);
    transactionService = module.get<TransactionService>(TransactionService);
  });
  
  afterAll(async () => {
    // Clean up test database
    await teardownTestDatabase();
    await module.close();
  });
  
  beforeEach(async () => {
    // Reset database state before each test
    await prismaService.cleanDatabase();
  });
  
  describe('Basic Transaction Operations', () => {
    it('should successfully commit a transaction', async () => {
      // Arrange
      const testUser = { ...userFixture.regularUser };
      
      // Act
      await transactionService.executeTransaction(async (tx) => {
        await tx.user.create({
          data: testUser
        });
      });
      
      // Assert
      await verifyUserExists(prismaService, testUser.email);
    });
    
    it('should successfully rollback a transaction on error', async () => {
      // Arrange
      const testUser = { ...userFixture.regularUser };
      
      // Act & Assert
      await expect(async () => {
        await transactionService.executeTransaction(async (tx) => {
          await tx.user.create({
            data: testUser
          });
          
          // Throw error to trigger rollback
          throw new Error('Test rollback');
        });
      }).rejects.toThrow('Test rollback');
      
      // Verify rollback occurred
      await verifyUserNotExists(prismaService, testUser.email);
    });
    
    it('should properly handle nested transactions', async () => {
      // Arrange
      const user1 = { ...userFixture.regularUser, email: 'user1@test.com' };
      const user2 = { ...userFixture.regularUser, email: 'user2@test.com' };
      
      // Act
      await transactionService.executeTransaction(async (outerTx) => {
        await outerTx.user.create({
          data: user1
        });
        
        // Nested transaction
        await transactionService.executeTransaction(async (innerTx) => {
          await innerTx.user.create({
            data: user2
          });
        });
      });
      
      // Assert
      await verifyUserExists(prismaService, user1.email);
      await verifyUserExists(prismaService, user2.email);
    });
  });
  
  describe('Transaction Isolation Levels', () => {
    it('should support READ UNCOMMITTED isolation level', async () => {
      // Verify that READ_UNCOMMITTED allows dirty reads
      const result = await verifyTransactionIsolation(
        prismaService,
        transactionService,
        TransactionIsolationLevel.READ_UNCOMMITTED
      );
      
      expect(result.allowsDirtyReads).toBe(true);
    });
    
    it('should support READ COMMITTED isolation level', async () => {
      // Verify that READ_COMMITTED prevents dirty reads but allows non-repeatable reads
      const result = await verifyTransactionIsolation(
        prismaService,
        transactionService,
        TransactionIsolationLevel.READ_COMMITTED
      );
      
      expect(result.allowsDirtyReads).toBe(false);
      expect(result.allowsNonRepeatableReads).toBe(true);
    });
    
    it('should support REPEATABLE READ isolation level', async () => {
      // Verify that REPEATABLE_READ prevents non-repeatable reads but allows phantom reads
      const result = await verifyTransactionIsolation(
        prismaService,
        transactionService,
        TransactionIsolationLevel.REPEATABLE_READ
      );
      
      expect(result.allowsDirtyReads).toBe(false);
      expect(result.allowsNonRepeatableReads).toBe(false);
      expect(result.allowsPhantomReads).toBe(true);
    });
    
    it('should support SERIALIZABLE isolation level', async () => {
      // Verify that SERIALIZABLE prevents all concurrency anomalies
      const result = await verifyTransactionIsolation(
        prismaService,
        transactionService,
        TransactionIsolationLevel.SERIALIZABLE
      );
      
      expect(result.allowsDirtyReads).toBe(false);
      expect(result.allowsNonRepeatableReads).toBe(false);
      expect(result.allowsPhantomReads).toBe(false);
    });
    
    it('should select appropriate isolation level based on operation type', async () => {
      // Spy on the utility function that selects isolation level
      const selectIsolationSpy = jest.spyOn(transactionUtils, 'selectAppropriateIsolationLevel');
      
      // Act - execute a read-heavy transaction
      await transactionService.executeTransaction(async (tx) => {
        await tx.user.findMany();
      }, { autoSelectIsolation: true });
      
      // Assert - should select READ_COMMITTED for read operations
      expect(selectIsolationSpy).toHaveBeenCalled();
      expect(selectIsolationSpy).toHaveReturnedWith(TransactionIsolationLevel.READ_COMMITTED);
      
      // Reset spy
      selectIsolationSpy.mockClear();
      
      // Act - execute a write-heavy transaction
      await transactionService.executeTransaction(async (tx) => {
        await tx.user.create({ data: userFixture.regularUser });
      }, { autoSelectIsolation: true });
      
      // Assert - should select REPEATABLE_READ for write operations
      expect(selectIsolationSpy).toHaveBeenCalled();
      expect(selectIsolationSpy).toHaveReturnedWith(TransactionIsolationLevel.REPEATABLE_READ);
    });
  });
  
  describe('Savepoint Functionality', () => {
    it('should create and release savepoints', async () => {
      // Arrange
      const user1 = { ...userFixture.regularUser, email: 'savepoint1@test.com' };
      const user2 = { ...userFixture.regularUser, email: 'savepoint2@test.com' };
      
      // Act
      await transactionService.executeTransaction(async (tx) => {
        // Create first user
        await tx.user.create({ data: user1 });
        
        // Create savepoint
        await transactionService.createSavepoint(tx, 'savepoint1');
        
        // Create second user
        await tx.user.create({ data: user2 });
        
        // Release savepoint (should have no effect on data)
        await transactionService.releaseSavepoint(tx, 'savepoint1');
      });
      
      // Assert
      await verifyUserExists(prismaService, user1.email);
      await verifyUserExists(prismaService, user2.email);
    });
    
    it('should rollback to savepoint without affecting prior operations', async () => {
      // Arrange
      const user1 = { ...userFixture.regularUser, email: 'before-savepoint@test.com' };
      const user2 = { ...userFixture.regularUser, email: 'after-savepoint@test.com' };
      
      // Act
      await transactionService.executeTransaction(async (tx) => {
        // Create first user
        await tx.user.create({ data: user1 });
        
        // Create savepoint
        await transactionService.createSavepoint(tx, 'savepoint1');
        
        // Create second user
        await tx.user.create({ data: user2 });
        
        // Rollback to savepoint (should undo second user creation)
        await transactionService.rollbackToSavepoint(tx, 'savepoint1');
      });
      
      // Assert - first user should exist, second should not
      await verifyUserExists(prismaService, user1.email);
      await verifyUserNotExists(prismaService, user2.email);
    });
    
    it('should support multiple savepoints with nested rollbacks', async () => {
      // Arrange
      const users = [
        { ...userFixture.regularUser, email: 'user1@test.com' },
        { ...userFixture.regularUser, email: 'user2@test.com' },
        { ...userFixture.regularUser, email: 'user3@test.com' },
      ];
      
      // Act
      await transactionService.executeTransaction(async (tx) => {
        // Create first user
        await tx.user.create({ data: users[0] });
        
        // Create first savepoint
        await transactionService.createSavepoint(tx, 'sp1');
        
        // Create second user
        await tx.user.create({ data: users[1] });
        
        // Create second savepoint
        await transactionService.createSavepoint(tx, 'sp2');
        
        // Create third user
        await tx.user.create({ data: users[2] });
        
        // Rollback to second savepoint (should undo third user creation)
        await transactionService.rollbackToSavepoint(tx, 'sp2');
      });
      
      // Assert
      await verifyUserExists(prismaService, users[0].email);
      await verifyUserExists(prismaService, users[1].email);
      await verifyUserNotExists(prismaService, users[2].email);
    });
  });
  
  describe('Transaction Timeout Handling', () => {
    it('should throw TransactionTimeoutError when transaction exceeds timeout', async () => {
      // Act & Assert
      await expect(async () => {
        await transactionService.executeTransaction(async (tx) => {
          // Simulate a long-running operation that exceeds timeout
          await simulateTimeout(tx);
        }, { timeout: 100 }); // 100ms timeout
      }).rejects.toThrow(TransactionTimeoutError);
    });
    
    it('should respect custom timeout settings', async () => {
      // Arrange - create a transaction with longer timeout
      const longTimeout = 5000; // 5 seconds
      
      // Act
      await transactionService.executeTransaction(async (tx) => {
        // Simulate operation that would exceed default timeout but not custom timeout
        await simulateTimeout(tx, 200); // 200ms operation
      }, { timeout: longTimeout });
      
      // Assert - transaction should complete without timeout error
      expect(true).toBe(true); // If we got here, no timeout occurred
    });
    
    it('should automatically retry transactions that timeout', async () => {
      // Spy on the retry function
      const retrySpy = jest.spyOn(transactionUtils, 'retryTransaction');
      
      // Arrange - mock the timeout simulation to fail once then succeed
      let attemptCount = 0;
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        attemptCount++;
        if (attemptCount === 1) {
          // First attempt - simulate timeout
          throw new TransactionTimeoutError('Transaction timeout', { timeout: 100 });
        } else {
          // Second attempt - succeed
          callback();
          return {} as any;
        }
      });
      
      // Act
      await transactionService.executeTransaction(async (tx) => {
        await tx.user.create({ data: userFixture.regularUser });
      }, { 
        timeout: 100,
        retry: { 
          attempts: 3,
          backoff: 'exponential'
        }
      });
      
      // Assert
      expect(retrySpy).toHaveBeenCalled();
      expect(attemptCount).toBe(2); // Should have retried once
      await verifyUserExists(prismaService, userFixture.regularUser.email);
      
      // Cleanup
      retrySpy.mockRestore();
      (global.setTimeout as jest.Mock).mockRestore();
    });
  });
  
  describe('Error Handling During Transactions', () => {
    it('should handle and transform database-specific errors', async () => {
      // Act & Assert
      await expect(async () => {
        await transactionService.executeTransaction(async (tx) => {
          // Create user with duplicate email to trigger unique constraint violation
          await tx.user.create({ data: userFixture.regularUser });
          await tx.user.create({ data: userFixture.regularUser }); // Same email, should fail
        });
      }).rejects.toThrow(/unique constraint/i);
    });
    
    it('should handle deadlock errors with appropriate retry strategy', async () => {
      // Spy on the retry function
      const retrySpy = jest.spyOn(transactionUtils, 'retryTransaction');
      
      // Arrange - simulate a deadlock scenario
      let attemptCount = 0;
      jest.spyOn(simulateDeadlock, 'mockImplementation').mockImplementation(async (tx) => {
        attemptCount++;
        if (attemptCount === 1) {
          // First attempt - simulate deadlock
          throw new DeadlockError('Deadlock detected', { 
            victimTransaction: 'test-tx',
            conflictingTransaction: 'other-tx'
          });
        } else {
          // Second attempt - succeed
          return;
        }
      });
      
      // Act
      await transactionService.executeTransaction(async (tx) => {
        await simulateDeadlock(tx);
        await tx.user.create({ data: userFixture.regularUser });
      }, { 
        retry: { 
          attempts: 3,
          backoff: 'exponential',
          retryableErrors: [DeadlockError]
        }
      });
      
      // Assert
      expect(retrySpy).toHaveBeenCalled();
      expect(attemptCount).toBe(2); // Should have retried once
      await verifyUserExists(prismaService, userFixture.regularUser.email);
      
      // Cleanup
      retrySpy.mockRestore();
      (simulateDeadlock.mockImplementation as jest.Mock).mockRestore();
    });
  });
  
  describe('Performance Monitoring Integration', () => {
    it('should track transaction duration and report metrics', async () => {
      // Spy on the performance monitoring function
      const monitorSpy = jest.spyOn(transactionUtils, 'monitorTransactionPerformance');
      
      // Act
      await transactionService.executeTransaction(async (tx) => {
        await tx.user.create({ data: userFixture.regularUser });
      }, { enableMetrics: true });
      
      // Assert
      expect(monitorSpy).toHaveBeenCalled();
      const metrics = monitorSpy.mock.results[0].value;
      expect(metrics).toHaveProperty('duration');
      expect(metrics).toHaveProperty('operations');
      expect(metrics.duration).toBeGreaterThan(0);
      
      // Cleanup
      monitorSpy.mockRestore();
    });
    
    it('should categorize transactions by type for monitoring', async () => {
      // Spy on the categorization function
      const categorizeSpy = jest.spyOn(transactionUtils, 'categorizeTransaction');
      
      // Act - read transaction
      await transactionService.executeTransaction(async (tx) => {
        await tx.user.findMany();
      }, { 
        enableMetrics: true,
        category: 'read'
      });
      
      // Assert
      expect(categorizeSpy).toHaveBeenCalledWith(expect.anything(), 'read');
      
      // Reset spy
      categorizeSpy.mockClear();
      
      // Act - write transaction
      await transactionService.executeTransaction(async (tx) => {
        await tx.user.create({ data: userFixture.regularUser });
      }, { 
        enableMetrics: true,
        category: 'write'
      });
      
      // Assert
      expect(categorizeSpy).toHaveBeenCalledWith(expect.anything(), 'write');
      
      // Cleanup
      categorizeSpy.mockRestore();
    });
  });
  
  describe('Transactional Decorator', () => {
    // Create a test class with @Transactional decorator
    class TestService {
      constructor(private readonly prisma: PrismaService) {}
      
      @Transactional()
      async createUser(userData: any) {
        return this.prisma.user.create({ data: userData });
      }
      
      @Transactional({ isolation: TransactionIsolationLevel.SERIALIZABLE })
      async createUserWithIsolation(userData: any) {
        return this.prisma.user.create({ data: userData });
      }
      
      @Transactional({ timeout: 500 })
      async createUserWithTimeout(userData: any) {
        return this.prisma.user.create({ data: userData });
      }
      
      @Transactional()
      async createUserWithError(userData: any) {
        await this.prisma.user.create({ data: userData });
        throw new Error('Test error');
      }
    }
    
    let testService: TestService;
    
    beforeEach(() => {
      testService = new TestService(prismaService);
    });
    
    it('should wrap method execution in a transaction', async () => {
      // Arrange
      const userData = { ...userFixture.regularUser, email: 'decorator-test@test.com' };
      
      // Act
      await testService.createUser(userData);
      
      // Assert
      await verifyUserExists(prismaService, userData.email);
    });
    
    it('should respect isolation level configuration', async () => {
      // Spy on the transaction service
      const executeSpy = jest.spyOn(transactionService, 'executeTransaction');
      
      // Arrange
      const userData = { ...userFixture.regularUser, email: 'isolation-test@test.com' };
      
      // Act
      await testService.createUserWithIsolation(userData);
      
      // Assert
      expect(executeSpy).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ isolation: TransactionIsolationLevel.SERIALIZABLE })
      );
      
      // Cleanup
      executeSpy.mockRestore();
    });
    
    it('should respect timeout configuration', async () => {
      // Spy on the transaction service
      const executeSpy = jest.spyOn(transactionService, 'executeTransaction');
      
      // Arrange
      const userData = { ...userFixture.regularUser, email: 'timeout-test@test.com' };
      
      // Act
      await testService.createUserWithTimeout(userData);
      
      // Assert
      expect(executeSpy).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ timeout: 500 })
      );
      
      // Cleanup
      executeSpy.mockRestore();
    });
    
    it('should automatically rollback on error', async () => {
      // Arrange
      const userData = { ...userFixture.regularUser, email: 'rollback-test@test.com' };
      
      // Act & Assert
      await expect(testService.createUserWithError(userData)).rejects.toThrow('Test error');
      
      // Verify rollback occurred
      await verifyUserNotExists(prismaService, userData.email);
    });
  });
  
  describe('Connection Cleanup', () => {
    it('should properly clean up connections during application shutdown', async () => {
      // Spy on the connection cleanup method
      const cleanupSpy = jest.spyOn(prismaService, '$disconnect');
      
      // Simulate application shutdown
      await module.close();
      
      // Assert
      expect(cleanupSpy).toHaveBeenCalled();
      
      // Cleanup - reconnect for other tests
      module = await Test.createTestingModule({
        imports: [DatabaseModule],
      }).compile();
      
      prismaService = module.get<PrismaService>(PrismaService);
      transactionService = module.get<TransactionService>(TransactionService);
    });
  });
});
/**
 * @file transactions.e2e-spec.ts
 * @description End-to-end tests for database transaction management across journey contexts.
 * Tests transaction isolation levels, savepoints, rollback mechanisms, and transaction timeout
 * handling with real database operations. Validates that transactions maintain data consistency
 * across complex operations and properly handle concurrent modifications.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { DatabaseModule } from '../../src/database.module';
import { PrismaService } from '../../src/prisma.service';
import { TransactionService } from '../../src/transactions/transaction.service';
import { HealthContext } from '../../src/contexts/health.context';
import { CareContext } from '../../src/contexts/care.context';
import { PlanContext } from '../../src/contexts/plan.context';
import { TransactionIsolationLevel } from '../../src/transactions/transaction.interface';
import { TransactionTimeoutError, DeadlockError, SerializationError } from '../../src/transactions/transaction.errors';

/**
 * Helper function to wait for a specified number of milliseconds
 */
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper function to generate a random string
 */
const randomString = () => Math.random().toString(36).substring(2, 15);

/**
 * Helper function to generate a random number within a range
 */
const randomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

describe('Transaction Management (E2E)', () => {
  let module: TestingModule;
  let prismaService: PrismaService;
  let transactionService: TransactionService;
  let healthContext: HealthContext;
  let careContext: CareContext;
  let planContext: PlanContext;
  let testUser: { id: string; name: string; email: string };

  beforeAll(async () => {
    // Create the testing module with the DatabaseModule
    module = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [
        PrismaService,
        TransactionService,
        {
          provide: HealthContext,
          useFactory: (prismaService: PrismaService) => new HealthContext(prismaService, 'health'),
          inject: [PrismaService],
        },
        {
          provide: CareContext,
          useFactory: (prismaService: PrismaService) => new CareContext(prismaService, 'care'),
          inject: [PrismaService],
        },
        {
          provide: PlanContext,
          useFactory: (prismaService: PrismaService) => new PlanContext(prismaService, 'plan'),
          inject: [PrismaService],
        },
      ],
    }).compile();

    // Get the required services
    prismaService = module.get<PrismaService>(PrismaService);
    transactionService = module.get<TransactionService>(TransactionService);
    healthContext = module.get<HealthContext>(HealthContext);
    careContext = module.get<CareContext>(CareContext);
    planContext = module.get<PlanContext>(PlanContext);

    // Initialize the journey contexts
    await healthContext.initialize();
    await careContext.initialize();
    await planContext.initialize();

    // Create a test user for use in all tests
    testUser = await prismaService.user.create({
      data: {
        name: 'Transaction Test User',
        email: `transaction-test-${randomString()}@example.com`,
        password: 'password123', // In a real app, this would be hashed
        phone: '+5511999999999',
        cpf: '12345678901',
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    try {
      await prismaService.user.delete({
        where: { id: testUser.id },
      });
    } catch (error) {
      console.error('Error cleaning up test user:', error);
    }

    // Dispose of the journey contexts
    await healthContext.dispose();
    await careContext.dispose();
    await planContext.dispose();

    // Close the database connection
    await prismaService.$disconnect();

    // Close the testing module
    await module.close();
  });

  describe('Transaction Isolation Levels', () => {
    /**
     * Test for READ_UNCOMMITTED isolation level
     * This test verifies that changes made in one transaction are visible to another
     * transaction before the first transaction is committed when using READ_UNCOMMITTED.
     */
    it('should allow dirty reads with READ_UNCOMMITTED isolation level', async () => {
      // Create a health metric type for testing
      const metricType = await prismaService.healthMetricType.create({
        data: {
          name: `TEST_METRIC_${randomString()}`,
          unit: 'units',
          normalRangeMin: 0,
          normalRangeMax: 100,
        },
      });

      // Start a transaction with READ_UNCOMMITTED isolation level
      const tx1 = await transactionService.createTransaction({
        isolationLevel: TransactionIsolationLevel.READ_UNCOMMITTED,
      });

      try {
        // Create a health metric in the first transaction but don't commit yet
        const metric = await tx1.healthMetric.create({
          data: {
            userId: testUser.id,
            typeId: metricType.id,
            value: 50,
            recordedAt: new Date(),
          },
        });

        // Start a second transaction with READ_UNCOMMITTED isolation level
        const result = await transactionService.executeTransaction(
          async (tx2) => {
            // Try to read the metric created in the first transaction
            const readMetric = await tx2.healthMetric.findUnique({
              where: { id: metric.id },
            });

            return readMetric;
          },
          { isolationLevel: TransactionIsolationLevel.READ_UNCOMMITTED }
        );

        // The second transaction should be able to see the uncommitted data
        expect(result).not.toBeNull();
        expect(result.id).toBe(metric.id);
        expect(result.value).toBe(50);

        // Now commit the first transaction
        await transactionService.commitTransaction(tx1);

        // Clean up
        await prismaService.healthMetric.delete({
          where: { id: metric.id },
        });
      } catch (error) {
        // Rollback the transaction if an error occurs
        await transactionService.rollbackTransaction(tx1);
        throw error;
      } finally {
        // Clean up the metric type
        await prismaService.healthMetricType.delete({
          where: { id: metricType.id },
        });
      }
    });

    /**
     * Test for READ_COMMITTED isolation level
     * This test verifies that changes made in one transaction are not visible to another
     * transaction until the first transaction is committed when using READ_COMMITTED.
     */
    it('should prevent dirty reads with READ_COMMITTED isolation level', async () => {
      // Create a health metric type for testing
      const metricType = await prismaService.healthMetricType.create({
        data: {
          name: `TEST_METRIC_${randomString()}`,
          unit: 'units',
          normalRangeMin: 0,
          normalRangeMax: 100,
        },
      });

      // Start a transaction with READ_COMMITTED isolation level
      const tx1 = await transactionService.createTransaction({
        isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
      });

      try {
        // Create a health metric in the first transaction but don't commit yet
        const metric = await tx1.healthMetric.create({
          data: {
            userId: testUser.id,
            typeId: metricType.id,
            value: 75,
            recordedAt: new Date(),
          },
        });

        // Start a second transaction with READ_COMMITTED isolation level
        const result = await transactionService.executeTransaction(
          async (tx2) => {
            // Try to read the metric created in the first transaction
            const readMetric = await tx2.healthMetric.findUnique({
              where: { id: metric.id },
            });

            return readMetric;
          },
          { isolationLevel: TransactionIsolationLevel.READ_COMMITTED }
        );

        // The second transaction should not be able to see the uncommitted data
        expect(result).toBeNull();

        // Now commit the first transaction
        await transactionService.commitTransaction(tx1);

        // Try to read the metric again after the first transaction is committed
        const afterCommitResult = await transactionService.executeTransaction(
          async (tx3) => {
            return await tx3.healthMetric.findUnique({
              where: { id: metric.id },
            });
          },
          { isolationLevel: TransactionIsolationLevel.READ_COMMITTED }
        );

        // Now the data should be visible
        expect(afterCommitResult).not.toBeNull();
        expect(afterCommitResult.id).toBe(metric.id);
        expect(afterCommitResult.value).toBe(75);

        // Clean up
        await prismaService.healthMetric.delete({
          where: { id: metric.id },
        });
      } catch (error) {
        // Rollback the transaction if an error occurs
        await transactionService.rollbackTransaction(tx1);
        throw error;
      } finally {
        // Clean up the metric type
        await prismaService.healthMetricType.delete({
          where: { id: metricType.id },
        });
      }
    });

    /**
     * Test for REPEATABLE_READ isolation level
     * This test verifies that a transaction with REPEATABLE_READ isolation level
     * will always see the same data even if another transaction modifies it.
     */
    it('should prevent non-repeatable reads with REPEATABLE_READ isolation level', async () => {
      // Create a health metric type for testing
      const metricType = await prismaService.healthMetricType.create({
        data: {
          name: `TEST_METRIC_${randomString()}`,
          unit: 'units',
          normalRangeMin: 0,
          normalRangeMax: 100,
        },
      });

      // Create a health metric for testing
      const metric = await prismaService.healthMetric.create({
        data: {
          userId: testUser.id,
          typeId: metricType.id,
          value: 25,
          recordedAt: new Date(),
        },
      });

      try {
        // Start a transaction with REPEATABLE_READ isolation level
        const result = await transactionService.executeTransaction(
          async (tx1) => {
            // Read the metric in the first transaction
            const firstRead = await tx1.healthMetric.findUnique({
              where: { id: metric.id },
            });

            // Update the metric outside the transaction
            await prismaService.healthMetric.update({
              where: { id: metric.id },
              data: { value: 75 },
            });

            // Read the metric again in the same transaction
            const secondRead = await tx1.healthMetric.findUnique({
              where: { id: metric.id },
            });

            return { firstRead, secondRead };
          },
          { isolationLevel: TransactionIsolationLevel.REPEATABLE_READ }
        );

        // Both reads should return the same value, even though the data was updated outside the transaction
        expect(result.firstRead.value).toBe(25);
        expect(result.secondRead.value).toBe(25);
        expect(result.firstRead.value).toBe(result.secondRead.value);

        // Verify that the data was actually updated in the database
        const updatedMetric = await prismaService.healthMetric.findUnique({
          where: { id: metric.id },
        });
        expect(updatedMetric.value).toBe(75);
      } finally {
        // Clean up
        await prismaService.healthMetric.delete({
          where: { id: metric.id },
        });
        await prismaService.healthMetricType.delete({
          where: { id: metricType.id },
        });
      }
    });

    /**
     * Test for SERIALIZABLE isolation level
     * This test verifies that a transaction with SERIALIZABLE isolation level
     * will prevent phantom reads (new rows appearing in a repeated query).
     */
    it('should prevent phantom reads with SERIALIZABLE isolation level', async () => {
      // Create a health metric type for testing
      const metricType = await prismaService.healthMetricType.create({
        data: {
          name: `TEST_METRIC_${randomString()}`,
          unit: 'units',
          normalRangeMin: 0,
          normalRangeMax: 100,
        },
      });

      try {
        // Start a transaction with SERIALIZABLE isolation level
        const result = await transactionService.executeTransaction(
          async (tx1) => {
            // Count the number of metrics for the test user
            const firstCount = await tx1.healthMetric.count({
              where: { userId: testUser.id, typeId: metricType.id },
            });

            // Create a new metric outside the transaction
            await prismaService.healthMetric.create({
              data: {
                userId: testUser.id,
                typeId: metricType.id,
                value: 50,
                recordedAt: new Date(),
              },
            });

            // Count the metrics again in the same transaction
            const secondCount = await tx1.healthMetric.count({
              where: { userId: testUser.id, typeId: metricType.id },
            });

            return { firstCount, secondCount };
          },
          { isolationLevel: TransactionIsolationLevel.SERIALIZABLE }
        );

        // Both counts should be the same, even though a new metric was added outside the transaction
        expect(result.firstCount).toBe(result.secondCount);

        // Verify that the new metric was actually added to the database
        const actualCount = await prismaService.healthMetric.count({
          where: { userId: testUser.id, typeId: metricType.id },
        });
        expect(actualCount).toBe(result.firstCount + 1);

        // Clean up the metrics
        await prismaService.healthMetric.deleteMany({
          where: { userId: testUser.id, typeId: metricType.id },
        });
      } finally {
        // Clean up the metric type
        await prismaService.healthMetricType.delete({
          where: { id: metricType.id },
        });
      }
    });
  });

  describe('Savepoints and Partial Rollbacks', () => {
    /**
     * Test for creating and rolling back to savepoints
     * This test verifies that savepoints can be created and used to roll back
     * to a specific point in a transaction without rolling back the entire transaction.
     */
    it('should support savepoints for partial rollbacks', async () => {
      // Create a health metric type for testing
      const metricType = await prismaService.healthMetricType.create({
        data: {
          name: `TEST_METRIC_${randomString()}`,
          unit: 'units',
          normalRangeMin: 0,
          normalRangeMax: 100,
        },
      });

      // Start a transaction
      const tx = await transactionService.createTransaction();

      try {
        // Create the first metric
        const metric1 = await tx.healthMetric.create({
          data: {
            userId: testUser.id,
            typeId: metricType.id,
            value: 10,
            recordedAt: new Date(),
          },
        });

        // Create a savepoint after the first metric
        const savepointName = await transactionService.createSavepoint(tx);

        // Create the second metric
        const metric2 = await tx.healthMetric.create({
          data: {
            userId: testUser.id,
            typeId: metricType.id,
            value: 20,
            recordedAt: new Date(),
          },
        });

        // Roll back to the savepoint (this should undo the second metric creation)
        await transactionService.rollbackToSavepoint(tx, savepointName);

        // Create a third metric after rolling back
        const metric3 = await tx.healthMetric.create({
          data: {
            userId: testUser.id,
            typeId: metricType.id,
            value: 30,
            recordedAt: new Date(),
          },
        });

        // Commit the transaction
        await transactionService.commitTransaction(tx);

        // Verify that the first and third metrics exist, but the second one doesn't
        const metrics = await prismaService.healthMetric.findMany({
          where: { userId: testUser.id, typeId: metricType.id },
          orderBy: { value: 'asc' },
        });

        expect(metrics.length).toBe(2);
        expect(metrics[0].value).toBe(10); // First metric
        expect(metrics[1].value).toBe(30); // Third metric

        // Clean up the metrics
        await prismaService.healthMetric.deleteMany({
          where: { userId: testUser.id, typeId: metricType.id },
        });
      } catch (error) {
        // Rollback the transaction if an error occurs
        await transactionService.rollbackTransaction(tx);
        throw error;
      } finally {
        // Clean up the metric type
        await prismaService.healthMetricType.delete({
          where: { id: metricType.id },
        });
      }
    });

    /**
     * Test for releasing savepoints
     * This test verifies that savepoints can be released when they are no longer needed.
     */
    it('should support releasing savepoints', async () => {
      // Create a health metric type for testing
      const metricType = await prismaService.healthMetricType.create({
        data: {
          name: `TEST_METRIC_${randomString()}`,
          unit: 'units',
          normalRangeMin: 0,
          normalRangeMax: 100,
        },
      });

      // Start a transaction
      const tx = await transactionService.createTransaction();

      try {
        // Create the first metric
        const metric1 = await tx.healthMetric.create({
          data: {
            userId: testUser.id,
            typeId: metricType.id,
            value: 10,
            recordedAt: new Date(),
          },
        });

        // Create a savepoint after the first metric
        const savepointName = await transactionService.createSavepoint(tx);

        // Create the second metric
        const metric2 = await tx.healthMetric.create({
          data: {
            userId: testUser.id,
            typeId: metricType.id,
            value: 20,
            recordedAt: new Date(),
          },
        });

        // Release the savepoint (this should make it impossible to roll back to it)
        await transactionService.releaseSavepoint(tx, savepointName);

        // Commit the transaction
        await transactionService.commitTransaction(tx);

        // Verify that both metrics exist
        const metrics = await prismaService.healthMetric.findMany({
          where: { userId: testUser.id, typeId: metricType.id },
          orderBy: { value: 'asc' },
        });

        expect(metrics.length).toBe(2);
        expect(metrics[0].value).toBe(10); // First metric
        expect(metrics[1].value).toBe(20); // Second metric

        // Clean up the metrics
        await prismaService.healthMetric.deleteMany({
          where: { userId: testUser.id, typeId: metricType.id },
        });
      } catch (error) {
        // Rollback the transaction if an error occurs
        await transactionService.rollbackTransaction(tx);
        throw error;
      } finally {
        // Clean up the metric type
        await prismaService.healthMetricType.delete({
          where: { id: metricType.id },
        });
      }
    });

    /**
     * Test for nested savepoints
     * This test verifies that savepoints can be nested and rolled back in the correct order.
     */
    it('should support nested savepoints', async () => {
      // Create a health metric type for testing
      const metricType = await prismaService.healthMetricType.create({
        data: {
          name: `TEST_METRIC_${randomString()}`,
          unit: 'units',
          normalRangeMin: 0,
          normalRangeMax: 100,
        },
      });

      // Start a transaction
      const tx = await transactionService.createTransaction();

      try {
        // Create the first metric
        const metric1 = await tx.healthMetric.create({
          data: {
            userId: testUser.id,
            typeId: metricType.id,
            value: 10,
            recordedAt: new Date(),
          },
        });

        // Create the first savepoint
        const savepoint1 = await transactionService.createSavepoint(tx);

        // Create the second metric
        const metric2 = await tx.healthMetric.create({
          data: {
            userId: testUser.id,
            typeId: metricType.id,
            value: 20,
            recordedAt: new Date(),
          },
        });

        // Create the second savepoint
        const savepoint2 = await transactionService.createSavepoint(tx);

        // Create the third metric
        const metric3 = await tx.healthMetric.create({
          data: {
            userId: testUser.id,
            typeId: metricType.id,
            value: 30,
            recordedAt: new Date(),
          },
        });

        // Roll back to the second savepoint (this should undo the third metric creation)
        await transactionService.rollbackToSavepoint(tx, savepoint2);

        // Create the fourth metric
        const metric4 = await tx.healthMetric.create({
          data: {
            userId: testUser.id,
            typeId: metricType.id,
            value: 40,
            recordedAt: new Date(),
          },
        });

        // Roll back to the first savepoint (this should undo the second and fourth metric creations)
        await transactionService.rollbackToSavepoint(tx, savepoint1);

        // Create the fifth metric
        const metric5 = await tx.healthMetric.create({
          data: {
            userId: testUser.id,
            typeId: metricType.id,
            value: 50,
            recordedAt: new Date(),
          },
        });

        // Commit the transaction
        await transactionService.commitTransaction(tx);

        // Verify that only the first and fifth metrics exist
        const metrics = await prismaService.healthMetric.findMany({
          where: { userId: testUser.id, typeId: metricType.id },
          orderBy: { value: 'asc' },
        });

        expect(metrics.length).toBe(2);
        expect(metrics[0].value).toBe(10); // First metric
        expect(metrics[1].value).toBe(50); // Fifth metric

        // Clean up the metrics
        await prismaService.healthMetric.deleteMany({
          where: { userId: testUser.id, typeId: metricType.id },
        });
      } catch (error) {
        // Rollback the transaction if an error occurs
        await transactionService.rollbackTransaction(tx);
        throw error;
      } finally {
        // Clean up the metric type
        await prismaService.healthMetricType.delete({
          where: { id: metricType.id },
        });
      }
    });
  });

  describe('Transaction Timeout Handling', () => {
    /**
     * Test for transaction timeout
     * This test verifies that a transaction will be automatically rolled back
     * if it exceeds the specified timeout.
     */
    it('should throw a TransactionTimeoutError when a transaction exceeds the timeout', async () => {
      // Set a very short timeout for this test
      const shortTimeout = 500; // 500ms

      // Expect the transaction to throw a TransactionTimeoutError
      await expect(
        transactionService.executeTransaction(
          async (tx) => {
            // Perform a simple operation
            await tx.$executeRaw`SELECT 1`;
            
            // Wait longer than the timeout
            await wait(shortTimeout * 2);
            
            // This operation should not be executed due to the timeout
            return await tx.$executeRaw`SELECT 2`;
          },
          { timeout: shortTimeout }
        )
      ).rejects.toThrow(TransactionTimeoutError);
    });

    /**
     * Test for transaction timeout with automatic rollback
     * This test verifies that changes made in a transaction that times out
     * are automatically rolled back.
     */
    it('should automatically roll back changes when a transaction times out', async () => {
      // Create a health metric type for testing
      const metricType = await prismaService.healthMetricType.create({
        data: {
          name: `TEST_METRIC_${randomString()}`,
          unit: 'units',
          normalRangeMin: 0,
          normalRangeMax: 100,
        },
      });

      // Set a very short timeout for this test
      const shortTimeout = 500; // 500ms

      try {
        // Start a transaction with a short timeout
        await expect(
          transactionService.executeTransaction(
            async (tx) => {
              // Create a health metric
              const metric = await tx.healthMetric.create({
                data: {
                  userId: testUser.id,
                  typeId: metricType.id,
                  value: 100,
                  recordedAt: new Date(),
                },
              });

              // Wait longer than the timeout
              await wait(shortTimeout * 2);

              // This operation should not be executed due to the timeout
              return metric;
            },
            { timeout: shortTimeout }
          )
        ).rejects.toThrow(TransactionTimeoutError);

        // Verify that the metric was not created (transaction was rolled back)
        const metrics = await prismaService.healthMetric.findMany({
          where: { userId: testUser.id, typeId: metricType.id },
        });

        expect(metrics.length).toBe(0);
      } finally {
        // Clean up the metric type
        await prismaService.healthMetricType.delete({
          where: { id: metricType.id },
        });
      }
    });
  });

  describe('Transaction Rollback and Recovery', () => {
    /**
     * Test for explicit transaction rollback
     * This test verifies that changes made in a transaction can be explicitly
     * rolled back when an error occurs.
     */
    it('should roll back all changes when a transaction is explicitly rolled back', async () => {
      // Create a health metric type for testing
      const metricType = await prismaService.healthMetricType.create({
        data: {
          name: `TEST_METRIC_${randomString()}`,
          unit: 'units',
          normalRangeMin: 0,
          normalRangeMax: 100,
        },
      });

      // Start a transaction
      const tx = await transactionService.createTransaction();

      try {
        // Create a health metric
        await tx.healthMetric.create({
          data: {
            userId: testUser.id,
            typeId: metricType.id,
            value: 100,
            recordedAt: new Date(),
          },
        });

        // Explicitly roll back the transaction
        await transactionService.rollbackTransaction(tx);

        // Verify that the metric was not created (transaction was rolled back)
        const metrics = await prismaService.healthMetric.findMany({
          where: { userId: testUser.id, typeId: metricType.id },
        });

        expect(metrics.length).toBe(0);
      } finally {
        // Clean up the metric type
        await prismaService.healthMetricType.delete({
          where: { id: metricType.id },
        });
      }
    });

    /**
     * Test for automatic transaction rollback on error
     * This test verifies that changes made in a transaction are automatically
     * rolled back when an error occurs during the transaction.
     */
    it('should automatically roll back all changes when an error occurs during a transaction', async () => {
      // Create a health metric type for testing
      const metricType = await prismaService.healthMetricType.create({
        data: {
          name: `TEST_METRIC_${randomString()}`,
          unit: 'units',
          normalRangeMin: 0,
          normalRangeMax: 100,
        },
      });

      try {
        // Start a transaction that will fail
        await expect(
          transactionService.executeTransaction(async (tx) => {
            // Create a health metric
            await tx.healthMetric.create({
              data: {
                userId: testUser.id,
                typeId: metricType.id,
                value: 100,
                recordedAt: new Date(),
              },
            });

            // Attempt an operation that will fail (invalid ID)
            await tx.healthMetric.update({
              where: { id: 'non-existent-id' },
              data: { value: 200 },
            });

            return true;
          })
        ).rejects.toThrow();

        // Verify that the metric was not created (transaction was rolled back)
        const metrics = await prismaService.healthMetric.findMany({
          where: { userId: testUser.id, typeId: metricType.id },
        });

        expect(metrics.length).toBe(0);
      } finally {
        // Clean up the metric type
        await prismaService.healthMetricType.delete({
          where: { id: metricType.id },
        });
      }
    });

    /**
     * Test for transaction retry on transient errors
     * This test verifies that a transaction can be automatically retried
     * when a transient error occurs.
     */
    it('should automatically retry a transaction when a transient error occurs', async () => {
      // Create a health metric type for testing
      const metricType = await prismaService.healthMetricType.create({
        data: {
          name: `TEST_METRIC_${randomString()}`,
          unit: 'units',
          normalRangeMin: 0,
          normalRangeMax: 100,
        },
      });

      // Mock a transient error for the first attempt
      let attempts = 0;
      const mockOperation = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts === 1) {
          // Simulate a serialization error on the first attempt
          throw new SerializationError('Simulated serialization error for testing');
        }
        
        // Succeed on subsequent attempts
        return await prismaService.healthMetric.create({
          data: {
            userId: testUser.id,
            typeId: metricType.id,
            value: 100,
            recordedAt: new Date(),
          },
        });
      });

      try {
        // Execute the transaction with retry
        const result = await transactionService.executeTransaction(
          async () => {
            return await mockOperation();
          },
          {
            retry: {
              maxRetries: 3,
              initialDelay: 50,
              backoffFactor: 2,
            },
          }
        );

        // Verify that the operation was retried and eventually succeeded
        expect(mockOperation).toHaveBeenCalledTimes(2);
        expect(result).toBeDefined();
        expect(result.userId).toBe(testUser.id);
        expect(result.typeId).toBe(metricType.id);
        expect(result.value).toBe(100);

        // Clean up the created metric
        await prismaService.healthMetric.delete({
          where: { id: result.id },
        });
      } finally {
        // Clean up the metric type
        await prismaService.healthMetricType.delete({
          where: { id: metricType.id },
        });
      }
    });
  });

  describe('Deadlock Detection and Handling', () => {
    /**
     * Test for deadlock detection and automatic retry
     * This test simulates a deadlock scenario and verifies that the transaction
     * is automatically retried when a deadlock is detected.
     */
    it('should detect deadlocks and automatically retry the transaction', async () => {
      // Create two health metric types for testing
      const metricType1 = await prismaService.healthMetricType.create({
        data: {
          name: `TEST_METRIC_A_${randomString()}`,
          unit: 'units',
          normalRangeMin: 0,
          normalRangeMax: 100,
        },
      });

      const metricType2 = await prismaService.healthMetricType.create({
        data: {
          name: `TEST_METRIC_B_${randomString()}`,
          unit: 'units',
          normalRangeMin: 0,
          normalRangeMax: 100,
        },
      });

      // Mock a deadlock scenario for the first attempt
      let attempts = 0;
      const mockOperation = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts === 1) {
          // Simulate a deadlock error on the first attempt
          throw new DeadlockError('Simulated deadlock error for testing');
        }
        
        // Succeed on subsequent attempts
        const metric1 = await prismaService.healthMetric.create({
          data: {
            userId: testUser.id,
            typeId: metricType1.id,
            value: 100,
            recordedAt: new Date(),
          },
        });
        
        const metric2 = await prismaService.healthMetric.create({
          data: {
            userId: testUser.id,
            typeId: metricType2.id,
            value: 200,
            recordedAt: new Date(),
          },
        });
        
        return { metric1, metric2 };
      });

      try {
        // Execute the transaction with retry
        const result = await transactionService.executeTransaction(
          async () => {
            return await mockOperation();
          },
          {
            retry: {
              maxRetries: 3,
              initialDelay: 50,
              backoffFactor: 2,
            },
          }
        );

        // Verify that the operation was retried and eventually succeeded
        expect(mockOperation).toHaveBeenCalledTimes(2);
        expect(result).toBeDefined();
        expect(result.metric1.userId).toBe(testUser.id);
        expect(result.metric1.typeId).toBe(metricType1.id);
        expect(result.metric1.value).toBe(100);
        expect(result.metric2.userId).toBe(testUser.id);
        expect(result.metric2.typeId).toBe(metricType2.id);
        expect(result.metric2.value).toBe(200);

        // Clean up the created metrics
        await prismaService.healthMetric.deleteMany({
          where: {
            id: { in: [result.metric1.id, result.metric2.id] },
          },
        });
      } finally {
        // Clean up the metric types
        await prismaService.healthMetricType.deleteMany({
          where: {
            id: { in: [metricType1.id, metricType2.id] },
          },
        });
      }
    });
  });

  describe('Transaction Performance Under Load', () => {
    /**
     * Test for transaction performance with multiple concurrent operations
     * This test verifies that the transaction system can handle multiple
     * concurrent operations without errors or data corruption.
     */
    it('should handle multiple concurrent transactions without errors', async () => {
      // Create a health metric type for testing
      const metricType = await prismaService.healthMetricType.create({
        data: {
          name: `TEST_METRIC_${randomString()}`,
          unit: 'units',
          normalRangeMin: 0,
          normalRangeMax: 100,
        },
      });

      try {
        // Number of concurrent transactions to run
        const concurrentTransactions = 10;
        
        // Create an array of transaction promises
        const transactionPromises = Array.from({ length: concurrentTransactions }).map((_, index) => {
          return transactionService.executeTransaction(async (tx) => {
            // Create a health metric with a unique value based on the index
            const metric = await tx.healthMetric.create({
              data: {
                userId: testUser.id,
                typeId: metricType.id,
                value: (index + 1) * 10,
                recordedAt: new Date(),
              },
            });
            
            return metric;
          });
        });
        
        // Execute all transactions concurrently
        const results = await Promise.all(transactionPromises);
        
        // Verify that all transactions completed successfully
        expect(results.length).toBe(concurrentTransactions);
        
        // Verify that all metrics were created with the correct values
        const metrics = await prismaService.healthMetric.findMany({
          where: { userId: testUser.id, typeId: metricType.id },
          orderBy: { value: 'asc' },
        });
        
        expect(metrics.length).toBe(concurrentTransactions);
        
        // Verify that each metric has the expected value
        for (let i = 0; i < concurrentTransactions; i++) {
          expect(metrics[i].value).toBe((i + 1) * 10);
        }
        
        // Clean up the created metrics
        await prismaService.healthMetric.deleteMany({
          where: { userId: testUser.id, typeId: metricType.id },
        });
      } finally {
        // Clean up the metric type
        await prismaService.healthMetricType.delete({
          where: { id: metricType.id },
        });
      }
    });

    /**
     * Test for transaction performance with a large number of operations
     * This test verifies that the transaction system can handle a large number
     * of operations within a single transaction without errors or timeouts.
     */
    it('should handle a large number of operations within a single transaction', async () => {
      // Create a health metric type for testing
      const metricType = await prismaService.healthMetricType.create({
        data: {
          name: `TEST_METRIC_${randomString()}`,
          unit: 'units',
          normalRangeMin: 0,
          normalRangeMax: 100,
        },
      });

      try {
        // Number of operations to perform within the transaction
        const operationCount = 50;
        
        // Execute a transaction with a large number of operations
        const result = await transactionService.executeTransaction(async (tx) => {
          const createdMetrics = [];
          
          // Create multiple health metrics within the same transaction
          for (let i = 0; i < operationCount; i++) {
            const metric = await tx.healthMetric.create({
              data: {
                userId: testUser.id,
                typeId: metricType.id,
                value: randomNumber(1, 100),
                recordedAt: new Date(),
              },
            });
            
            createdMetrics.push(metric);
          }
          
          return createdMetrics;
        });
        
        // Verify that all operations completed successfully
        expect(result.length).toBe(operationCount);
        
        // Verify that all metrics were created in the database
        const metrics = await prismaService.healthMetric.findMany({
          where: { userId: testUser.id, typeId: metricType.id },
        });
        
        expect(metrics.length).toBe(operationCount);
        
        // Clean up the created metrics
        await prismaService.healthMetric.deleteMany({
          where: { userId: testUser.id, typeId: metricType.id },
        });
      } finally {
        // Clean up the metric type
        await prismaService.healthMetricType.delete({
          where: { id: metricType.id },
        });
      }
    });

    /**
     * Test for transaction performance with mixed read/write operations
     * This test verifies that the transaction system can handle a mix of read and write
     * operations within a single transaction without errors or data inconsistencies.
     */
    it('should handle mixed read/write operations within a transaction', async () => {
      // Create a health metric type for testing
      const metricType = await prismaService.healthMetricType.create({
        data: {
          name: `TEST_METRIC_${randomString()}`,
          unit: 'units',
          normalRangeMin: 0,
          normalRangeMax: 100,
        },
      });

      // Create some initial metrics for reading
      const initialMetrics = [];
      for (let i = 0; i < 5; i++) {
        const metric = await prismaService.healthMetric.create({
          data: {
            userId: testUser.id,
            typeId: metricType.id,
            value: (i + 1) * 10,
            recordedAt: new Date(),
          },
        });
        initialMetrics.push(metric);
      }

      try {
        // Execute a transaction with mixed read/write operations
        const result = await transactionService.executeTransaction(async (tx) => {
          const operations = [];
          
          // Read all existing metrics
          const existingMetrics = await tx.healthMetric.findMany({
            where: { userId: testUser.id, typeId: metricType.id },
            orderBy: { value: 'asc' },
          });
          
          operations.push({ type: 'read', count: existingMetrics.length });
          
          // Update each existing metric
          for (const metric of existingMetrics) {
            const updatedMetric = await tx.healthMetric.update({
              where: { id: metric.id },
              data: { value: metric.value + 5 },
            });
            
            operations.push({ type: 'update', id: updatedMetric.id, oldValue: metric.value, newValue: updatedMetric.value });
          }
          
          // Create some new metrics
          for (let i = 0; i < 5; i++) {
            const newMetric = await tx.healthMetric.create({
              data: {
                userId: testUser.id,
                typeId: metricType.id,
                value: 100 + (i + 1) * 10,
                recordedAt: new Date(),
              },
            });
            
            operations.push({ type: 'create', id: newMetric.id, value: newMetric.value });
          }
          
          // Read all metrics again to verify consistency within the transaction
          const allMetrics = await tx.healthMetric.findMany({
            where: { userId: testUser.id, typeId: metricType.id },
            orderBy: { value: 'asc' },
          });
          
          operations.push({ type: 'read', count: allMetrics.length });
          
          return { operations, allMetrics };
        });
        
        // Verify that all operations completed successfully
        expect(result.operations.length).toBe(2 + initialMetrics.length + 5); // 2 reads + updates + creates
        
        // Verify that the final read within the transaction saw all changes
        expect(result.allMetrics.length).toBe(initialMetrics.length + 5); // initial + new metrics
        
        // Verify that all metrics were updated and created in the database
        const finalMetrics = await prismaService.healthMetric.findMany({
          where: { userId: testUser.id, typeId: metricType.id },
          orderBy: { value: 'asc' },
        });
        
        expect(finalMetrics.length).toBe(initialMetrics.length + 5);
        
        // Verify that the initial metrics were updated
        for (let i = 0; i < initialMetrics.length; i++) {
          const originalValue = (i + 1) * 10;
          const expectedUpdatedValue = originalValue + 5;
          const matchingMetric = finalMetrics.find(m => m.id === initialMetrics[i].id);
          
          expect(matchingMetric).toBeDefined();
          expect(matchingMetric.value).toBe(expectedUpdatedValue);
        }
        
        // Clean up all metrics
        await prismaService.healthMetric.deleteMany({
          where: { userId: testUser.id, typeId: metricType.id },
        });
      } finally {
        // Clean up the metric type
        await prismaService.healthMetricType.delete({
          where: { id: metricType.id },
        });
      }
    });
  });

  describe('Cross-Journey Transactions', () => {
    /**
     * Test for transactions across multiple journey contexts
     * This test verifies that transactions can span multiple journey contexts
     * while maintaining data consistency.
     */
    it('should maintain consistency across multiple journey contexts', async () => {
      // Create a health metric type for testing
      const metricType = await prismaService.healthMetricType.create({
        data: {
          name: `TEST_METRIC_${randomString()}`,
          unit: 'units',
          normalRangeMin: 0,
          normalRangeMax: 100,
        },
      });

      // Create a provider specialty for testing
      const specialty = await prismaService.providerSpecialty.create({
        data: {
          name: `TEST_SPECIALTY_${randomString()}`,
          description: 'Test specialty for cross-journey transactions',
        },
      });

      // Create a plan type for testing
      const planType = await prismaService.insurancePlanType.create({
        data: {
          name: `TEST_PLAN_${randomString()}`,
          description: 'Test plan for cross-journey transactions',
        },
      });

      try {
        // Execute a transaction that spans multiple journey contexts
        const result = await transactionService.executeTransaction(async (tx) => {
          // Create a health metric (Health journey)
          const healthMetric = await tx.healthMetric.create({
            data: {
              userId: testUser.id,
              typeId: metricType.id,
              value: 75,
              recordedAt: new Date(),
            },
          });

          // Create a provider (Care journey)
          const provider = await tx.provider.create({
            data: {
              name: 'Dr. Test Provider',
              specialtyId: specialty.id,
              email: `provider-${randomString()}@example.com`,
              phone: '+5511888888888',
              address: 'Test Address',
            },
          });

          // Create an insurance plan (Plan journey)
          const plan = await tx.insurancePlan.create({
            data: {
              userId: testUser.id,
              typeId: planType.id,
              planNumber: `PLAN-${randomString()}`,
              startDate: new Date(),
              endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
              status: 'ACTIVE',
            },
          });

          return { healthMetric, provider, plan };
        });

        // Verify that all entities were created successfully
        expect(result.healthMetric).toBeDefined();
        expect(result.healthMetric.userId).toBe(testUser.id);
        expect(result.healthMetric.typeId).toBe(metricType.id);

        expect(result.provider).toBeDefined();
        expect(result.provider.specialtyId).toBe(specialty.id);

        expect(result.plan).toBeDefined();
        expect(result.plan.userId).toBe(testUser.id);
        expect(result.plan.typeId).toBe(planType.id);

        // Clean up the created entities
        await prismaService.healthMetric.delete({
          where: { id: result.healthMetric.id },
        });

        await prismaService.provider.delete({
          where: { id: result.provider.id },
        });

        await prismaService.insurancePlan.delete({
          where: { id: result.plan.id },
        });
      } finally {
        // Clean up the test entities
        await prismaService.healthMetricType.delete({
          where: { id: metricType.id },
        });

        await prismaService.providerSpecialty.delete({
          where: { id: specialty.id },
        });

        await prismaService.insurancePlanType.delete({
          where: { id: planType.id },
        });
      }
    });

    /**
     * Test for rollback across multiple journey contexts
     * This test verifies that when a transaction fails, all changes across
     * multiple journey contexts are rolled back.
     */
    it('should roll back all changes across multiple journey contexts when an error occurs', async () => {
      // Create a health metric type for testing
      const metricType = await prismaService.healthMetricType.create({
        data: {
          name: `TEST_METRIC_${randomString()}`,
          unit: 'units',
          normalRangeMin: 0,
          normalRangeMax: 100,
        },
      });

      // Create a provider specialty for testing
      const specialty = await prismaService.providerSpecialty.create({
        data: {
          name: `TEST_SPECIALTY_${randomString()}`,
          description: 'Test specialty for cross-journey transactions',
        },
      });

      // Create a plan type for testing
      const planType = await prismaService.insurancePlanType.create({
        data: {
          name: `TEST_PLAN_${randomString()}`,
          description: 'Test plan for cross-journey transactions',
        },
      });

      try {
        // Execute a transaction that spans multiple journey contexts and will fail
        await expect(
          transactionService.executeTransaction(async (tx) => {
            // Create a health metric (Health journey)
            const healthMetric = await tx.healthMetric.create({
              data: {
                userId: testUser.id,
                typeId: metricType.id,
                value: 75,
                recordedAt: new Date(),
              },
            });

            // Create a provider (Care journey)
            const provider = await tx.provider.create({
              data: {
                name: 'Dr. Test Provider',
                specialtyId: specialty.id,
                email: `provider-${randomString()}@example.com`,
                phone: '+5511888888888',
                address: 'Test Address',
              },
            });

            // Attempt to create a plan with an invalid type ID (this will fail)
            const plan = await tx.insurancePlan.create({
              data: {
                userId: testUser.id,
                typeId: 'invalid-type-id', // This will cause the transaction to fail
                planNumber: `PLAN-${randomString()}`,
                startDate: new Date(),
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                status: 'ACTIVE',
              },
            });

            return { healthMetric, provider, plan };
          })
        ).rejects.toThrow();

        // Verify that no entities were created (all changes were rolled back)
        const healthMetrics = await prismaService.healthMetric.findMany({
          where: { userId: testUser.id, typeId: metricType.id },
        });
        expect(healthMetrics.length).toBe(0);

        const providers = await prismaService.provider.findMany({
          where: { specialtyId: specialty.id },
        });
        expect(providers.length).toBe(0);

        const plans = await prismaService.insurancePlan.findMany({
          where: { userId: testUser.id },
        });
        expect(plans.length).toBe(0);
      } finally {
        // Clean up the test entities
        await prismaService.healthMetricType.delete({
          where: { id: metricType.id },
        });

        await prismaService.providerSpecialty.delete({
          where: { id: specialty.id },
        });

        await prismaService.insurancePlanType.delete({
          where: { id: planType.id },
        });
      }
    });
  });
});
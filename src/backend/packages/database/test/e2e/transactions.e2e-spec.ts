/**
 * @file transactions.e2e-spec.ts
 * @description End-to-end tests for database transaction management across journey contexts.
 * Tests transaction isolation levels, savepoints, rollback mechanisms, and transaction timeout
 * handling with real database operations. Validates that transactions maintain data consistency
 * across complex operations and properly handle concurrent modifications.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { PrismaService } from '../../src/prisma.service';
import { TransactionService } from '../../src/transactions/transaction.service';
import { DatabaseModule } from '../../src/database.module';
import { HealthContext } from '../../src/contexts/health.context';
import { CareContext } from '../../src/contexts/care.context';
import { PlanContext } from '../../src/contexts/plan.context';
import { TransactionIsolationLevel, TransactionState, TransactionType } from '../../src/types/transaction.types';
import { TransactionError, TransactionTimeoutError, DeadlockError, SavepointError } from '../../src/transactions/transaction.errors';

import {
  createTestPrismaService,
  createTestEnvironment,
  cleanupTestDatabase,
  registerTestCleanup,
  assertRecordExists,
  assertRecordNotExists,
  assertRecordCount,
  assertRecordMatches
} from './helpers';

describe('Transaction Management (E2E)', () => {
  let module: TestingModule;
  let prismaService: PrismaService;
  let transactionService: TransactionService;
  let healthContext: HealthContext;
  let careContext: CareContext;
  let planContext: PlanContext;
  let testData: any;
  let testUserIds: string[] = [];

  beforeAll(async () => {
    // Create test module with real services
    module = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [
        EventEmitter2,
        {
          provide: PrismaService,
          useFactory: () => createTestPrismaService()
        },
        TransactionService,
        HealthContext,
        CareContext,
        PlanContext
      ],
    }).compile();

    // Get services
    prismaService = module.get<PrismaService>(PrismaService);
    transactionService = module.get<TransactionService>(TransactionService);
    healthContext = module.get<HealthContext>(HealthContext);
    careContext = module.get<CareContext>(CareContext);
    planContext = module.get<PlanContext>(PlanContext);

    // Clean database and create test data
    await cleanupTestDatabase(prismaService);
    testData = await createTestEnvironment(prismaService, { userCount: 2 });
    testUserIds = testData.users.map((user: any) => user.id);

    // Register cleanup
    registerTestCleanup(prismaService, { userIds: testUserIds });
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Basic Transaction Operations', () => {
    it('should successfully commit a transaction', async () => {
      // Create a transaction
      const transaction = await transactionService.createTransaction();
      await transaction.start();

      // Execute a query within the transaction
      const newMetric = await transaction.execute(async (client) => {
        return client.healthMetric.create({
          data: {
            userId: testUserIds[0],
            typeId: testData.health[0].metrics[0].typeId,
            value: '75',
            timestamp: new Date(),
            source: 'TEST',
            notes: 'Created in transaction test',
          },
        });
      });

      // Commit the transaction
      await transaction.commit();

      // Verify the metric was created
      const metric = await prismaService.healthMetric.findUnique({
        where: { id: newMetric.id },
      });

      expect(metric).toBeDefined();
      expect(metric?.value).toBe('75');
      expect(metric?.notes).toBe('Created in transaction test');
      expect(transaction.state).toBe(TransactionState.COMMITTED);
    });

    it('should successfully rollback a transaction', async () => {
      // Create a transaction
      const transaction = await transactionService.createTransaction();
      await transaction.start();

      // Execute a query within the transaction
      const newMetric = await transaction.execute(async (client) => {
        return client.healthMetric.create({
          data: {
            userId: testUserIds[0],
            typeId: testData.health[0].metrics[0].typeId,
            value: '85',
            timestamp: new Date(),
            source: 'TEST',
            notes: 'Should be rolled back',
          },
        });
      });

      // Rollback the transaction
      await transaction.rollback();

      // Verify the metric was not created
      const metric = await prismaService.healthMetric.findUnique({
        where: { id: newMetric.id },
      });

      expect(metric).toBeNull();
      expect(transaction.state).toBe(TransactionState.ROLLED_BACK);
    });

    it('should automatically rollback on error using executeTransaction', async () => {
      // Initial count of health metrics
      const initialCount = await prismaService.healthMetric.count({
        where: { userId: testUserIds[0] }
      });

      // Execute a transaction that will fail
      try {
        await transactionService.executeTransaction(async (client) => {
          // First create a valid metric
          await client.healthMetric.create({
            data: {
              userId: testUserIds[0],
              typeId: testData.health[0].metrics[0].typeId,
              value: '90',
              timestamp: new Date(),
              source: 'TEST',
              notes: 'Should be rolled back on error',
            },
          });

          // Then try to create an invalid metric (missing required fields)
          // @ts-ignore - Intentionally creating an error
          return client.healthMetric.create({
            data: {
              userId: testUserIds[0],
              // Missing typeId - will cause an error
              value: '95',
            },
          });
        });

        fail('Transaction should have failed');
      } catch (error) {
        // Expect an error
        expect(error).toBeDefined();
      }

      // Verify no metrics were added
      const finalCount = await prismaService.healthMetric.count({
        where: { userId: testUserIds[0] }
      });

      expect(finalCount).toBe(initialCount);
    });
  });

  describe('Transaction Isolation Levels', () => {
    it('should demonstrate READ_COMMITTED isolation level', async () => {
      // Create two transactions
      const transaction1 = await transactionService.createTransaction({
        isolationLevel: TransactionIsolationLevel.READ_COMMITTED
      });
      const transaction2 = await transactionService.createTransaction({
        isolationLevel: TransactionIsolationLevel.READ_COMMITTED
      });

      await transaction1.start();
      await transaction2.start();

      // Transaction 1 creates a new appointment
      const appointment = await transaction1.execute(async (client) => {
        return client.appointment.create({
          data: {
            userId: testUserIds[0],
            providerId: testData.care[0].providers[0].id,
            date: new Date(),
            time: '14:30',
            status: 'SCHEDULED',
            notes: 'Isolation level test',
            type: 'IN_PERSON',
            location: 'Test Clinic',
            reason: 'Isolation testing',
          },
        });
      });

      // Transaction 2 should not see the uncommitted appointment
      const uncommittedResult = await transaction2.execute(async (client) => {
        return client.appointment.findUnique({
          where: { id: appointment.id },
        });
      });

      expect(uncommittedResult).toBeNull();

      // Commit transaction 1
      await transaction1.commit();

      // Now transaction 2 should see the committed appointment
      const committedResult = await transaction2.execute(async (client) => {
        return client.appointment.findUnique({
          where: { id: appointment.id },
        });
      });

      expect(committedResult).not.toBeNull();
      expect(committedResult?.id).toBe(appointment.id);

      // Clean up
      await transaction2.commit();
    });

    it('should demonstrate REPEATABLE_READ isolation level', async () => {
      // Create a health goal for testing
      const goal = await prismaService.healthGoal.create({
        data: {
          userId: testUserIds[0],
          typeId: testData.health[0].metrics[0].typeId,
          targetValue: '100',
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
          notes: 'Repeatable read test',
        },
      });

      // Create a transaction with REPEATABLE_READ isolation
      const transaction = await transactionService.createTransaction({
        isolationLevel: TransactionIsolationLevel.REPEATABLE_READ
      });
      await transaction.start();

      // Read the goal in the transaction
      const initialRead = await transaction.execute(async (client) => {
        return client.healthGoal.findUnique({
          where: { id: goal.id },
        });
      });

      // Update the goal outside the transaction
      await prismaService.healthGoal.update({
        where: { id: goal.id },
        data: { targetValue: '120', notes: 'Updated outside transaction' },
      });

      // Read the goal again in the transaction
      const secondRead = await transaction.execute(async (client) => {
        return client.healthGoal.findUnique({
          where: { id: goal.id },
        });
      });

      // With REPEATABLE_READ, the second read should match the first read
      expect(secondRead?.targetValue).toBe(initialRead?.targetValue);
      expect(secondRead?.notes).toBe(initialRead?.notes);

      // Commit the transaction
      await transaction.commit();

      // Now we should see the updated values
      const finalRead = await prismaService.healthGoal.findUnique({
        where: { id: goal.id },
      });

      expect(finalRead?.targetValue).toBe('120');
      expect(finalRead?.notes).toBe('Updated outside transaction');
    });

    it('should demonstrate SERIALIZABLE isolation level', async () => {
      // Create a transaction with SERIALIZABLE isolation
      const transaction = await transactionService.createTransaction({
        isolationLevel: TransactionIsolationLevel.SERIALIZABLE
      });
      await transaction.start();

      // Get all health metrics for a user in the transaction
      const metrics = await transaction.execute(async (client) => {
        return client.healthMetric.findMany({
          where: { userId: testUserIds[0] },
          orderBy: { timestamp: 'desc' },
          take: 5,
        });
      });

      // Create a new metric outside the transaction
      await prismaService.healthMetric.create({
        data: {
          userId: testUserIds[0],
          typeId: testData.health[0].metrics[0].typeId,
          value: '110',
          timestamp: new Date(),
          source: 'TEST',
          notes: 'Created outside serializable transaction',
        },
      });

      // Get metrics again in the transaction
      const metricsAgain = await transaction.execute(async (client) => {
        return client.healthMetric.findMany({
          where: { userId: testUserIds[0] },
          orderBy: { timestamp: 'desc' },
          take: 5,
        });
      });

      // With SERIALIZABLE, the second query should return the same results
      // as the first query, even though a new record was added
      expect(metricsAgain.length).toBe(metrics.length);
      expect(metricsAgain.map(m => m.id)).toEqual(metrics.map(m => m.id));

      // Commit the transaction
      await transaction.commit();

      // Now we should see the new metric
      const finalMetrics = await prismaService.healthMetric.findMany({
        where: { userId: testUserIds[0] },
        orderBy: { timestamp: 'desc' },
        take: 5,
      });

      expect(finalMetrics.length).toBeGreaterThan(0);
      expect(finalMetrics[0].notes).toBe('Created outside serializable transaction');
    });
  });

  describe('Savepoints and Partial Rollbacks', () => {
    it('should create and rollback to savepoints', async () => {
      // Create a transaction
      const transaction = await transactionService.createTransaction({
        savepoint: { useSavepoints: true }
      });
      await transaction.start();

      // Create initial data
      const initialMetric = await transaction.execute(async (client) => {
        return client.healthMetric.create({
          data: {
            userId: testUserIds[0],
            typeId: testData.health[0].metrics[0].typeId,
            value: '100',
            timestamp: new Date(),
            source: 'TEST',
            notes: 'Initial metric before savepoint',
          },
        });
      });

      // Create a savepoint
      const savepointName = await transaction.createSavepoint('TEST_SAVEPOINT');

      // Create more data after the savepoint
      const afterSavepointMetric = await transaction.execute(async (client) => {
        return client.healthMetric.create({
          data: {
            userId: testUserIds[0],
            typeId: testData.health[0].metrics[0].typeId,
            value: '110',
            timestamp: new Date(),
            source: 'TEST',
            notes: 'Metric after savepoint - should be rolled back',
          },
        });
      });

      // Rollback to the savepoint
      await transaction.rollbackToSavepoint(savepointName);

      // Verify the data after the savepoint is not visible in the transaction
      const afterRollback = await transaction.execute(async (client) => {
        return client.healthMetric.findUnique({
          where: { id: afterSavepointMetric.id },
        });
      });

      // The metric created after the savepoint should not be visible
      expect(afterRollback).toBeNull();

      // But the initial metric should still be visible
      const initialStillVisible = await transaction.execute(async (client) => {
        return client.healthMetric.findUnique({
          where: { id: initialMetric.id },
        });
      });

      expect(initialStillVisible).not.toBeNull();
      expect(initialStillVisible?.id).toBe(initialMetric.id);

      // Commit the transaction
      await transaction.commit();

      // Verify final state
      const finalInitialMetric = await prismaService.healthMetric.findUnique({
        where: { id: initialMetric.id },
      });
      const finalAfterSavepointMetric = await prismaService.healthMetric.findUnique({
        where: { id: afterSavepointMetric.id },
      });

      expect(finalInitialMetric).not.toBeNull();
      expect(finalAfterSavepointMetric).toBeNull();
    });

    it('should handle multiple savepoints correctly', async () => {
      // Create a transaction
      const transaction = await transactionService.createTransaction({
        savepoint: { useSavepoints: true }
      });
      await transaction.start();

      // Initial state
      const initialMetric = await transaction.execute(async (client) => {
        return client.healthMetric.create({
          data: {
            userId: testUserIds[0],
            typeId: testData.health[0].metrics[0].typeId,
            value: '100',
            timestamp: new Date(),
            source: 'TEST',
            notes: 'Initial metric',
          },
        });
      });

      // First savepoint
      const savepoint1 = await transaction.createSavepoint('SAVEPOINT_1');

      // Create data after first savepoint
      const metric1 = await transaction.execute(async (client) => {
        return client.healthMetric.create({
          data: {
            userId: testUserIds[0],
            typeId: testData.health[0].metrics[0].typeId,
            value: '110',
            timestamp: new Date(),
            source: 'TEST',
            notes: 'Metric after savepoint 1',
          },
        });
      });

      // Second savepoint
      const savepoint2 = await transaction.createSavepoint('SAVEPOINT_2');

      // Create data after second savepoint
      const metric2 = await transaction.execute(async (client) => {
        return client.healthMetric.create({
          data: {
            userId: testUserIds[0],
            typeId: testData.health[0].metrics[0].typeId,
            value: '120',
            timestamp: new Date(),
            source: 'TEST',
            notes: 'Metric after savepoint 2',
          },
        });
      });

      // Rollback to second savepoint
      await transaction.rollbackToSavepoint(savepoint2);

      // Verify metric2 is gone but metric1 is still there
      const checkMetric2 = await transaction.execute(async (client) => {
        return client.healthMetric.findUnique({
          where: { id: metric2.id },
        });
      });

      const checkMetric1 = await transaction.execute(async (client) => {
        return client.healthMetric.findUnique({
          where: { id: metric1.id },
        });
      });

      expect(checkMetric2).toBeNull();
      expect(checkMetric1).not.toBeNull();

      // Create a new metric after rolling back to savepoint2
      const metric3 = await transaction.execute(async (client) => {
        return client.healthMetric.create({
          data: {
            userId: testUserIds[0],
            typeId: testData.health[0].metrics[0].typeId,
            value: '130',
            timestamp: new Date(),
            source: 'TEST',
            notes: 'Metric after rollback to savepoint 2',
          },
        });
      });

      // Now rollback to first savepoint
      await transaction.rollbackToSavepoint(savepoint1);

      // Verify metric1 and metric3 are gone but initialMetric is still there
      const checkMetric3 = await transaction.execute(async (client) => {
        return client.healthMetric.findUnique({
          where: { id: metric3.id },
        });
      });

      const checkMetric1Again = await transaction.execute(async (client) => {
        return client.healthMetric.findUnique({
          where: { id: metric1.id },
        });
      });

      const checkInitialMetric = await transaction.execute(async (client) => {
        return client.healthMetric.findUnique({
          where: { id: initialMetric.id },
        });
      });

      expect(checkMetric3).toBeNull();
      expect(checkMetric1Again).toBeNull();
      expect(checkInitialMetric).not.toBeNull();

      // Commit the transaction
      await transaction.commit();

      // Verify final state
      const finalInitialMetric = await prismaService.healthMetric.findUnique({
        where: { id: initialMetric.id },
      });
      const finalMetric1 = await prismaService.healthMetric.findUnique({
        where: { id: metric1.id },
      });
      const finalMetric2 = await prismaService.healthMetric.findUnique({
        where: { id: metric2.id },
      });
      const finalMetric3 = await prismaService.healthMetric.findUnique({
        where: { id: metric3.id },
      });

      expect(finalInitialMetric).not.toBeNull();
      expect(finalMetric1).toBeNull();
      expect(finalMetric2).toBeNull();
      expect(finalMetric3).toBeNull();
    });

    it('should throw an error when trying to rollback to a non-existent savepoint', async () => {
      // Create a transaction
      const transaction = await transactionService.createTransaction({
        savepoint: { useSavepoints: true }
      });
      await transaction.start();

      // Try to rollback to a non-existent savepoint
      await expect(transaction.rollbackToSavepoint('NON_EXISTENT_SAVEPOINT'))
        .rejects.toThrow(SavepointError);

      // Clean up
      await transaction.rollback();
    });
  });

  describe('Nested Transactions', () => {
    it('should support nested transactions with independent commit/rollback', async () => {
      // Create a parent transaction
      const parentTransaction = await transactionService.createTransaction();
      await parentTransaction.start();

      // Create a parent record
      const parentRecord = await parentTransaction.execute(async (client) => {
        return client.healthMetric.create({
          data: {
            userId: testUserIds[0],
            typeId: testData.health[0].metrics[0].typeId,
            value: '100',
            timestamp: new Date(),
            source: 'TEST',
            notes: 'Parent transaction record',
          },
        });
      });

      // Create a nested transaction
      const nestedTransaction = await parentTransaction.createNestedTransaction();

      // Create a nested record
      const nestedRecord = await nestedTransaction.execute(async (client) => {
        return client.healthMetric.create({
          data: {
            userId: testUserIds[0],
            typeId: testData.health[0].metrics[0].typeId,
            value: '110',
            timestamp: new Date(),
            source: 'TEST',
            notes: 'Nested transaction record',
          },
        });
      });

      // Verify both records are visible in the nested transaction
      const nestedCheck = await nestedTransaction.execute(async (client) => {
        const parent = await client.healthMetric.findUnique({
          where: { id: parentRecord.id },
        });
        const nested = await client.healthMetric.findUnique({
          where: { id: nestedRecord.id },
        });
        return { parent, nested };
      });

      expect(nestedCheck.parent).not.toBeNull();
      expect(nestedCheck.nested).not.toBeNull();

      // Rollback the nested transaction
      await nestedTransaction.rollback();

      // Verify the nested record is not visible in the parent transaction
      // but the parent record is still visible
      const parentCheck = await parentTransaction.execute(async (client) => {
        const parent = await client.healthMetric.findUnique({
          where: { id: parentRecord.id },
        });
        const nested = await client.healthMetric.findUnique({
          where: { id: nestedRecord.id },
        });
        return { parent, nested };
      });

      expect(parentCheck.parent).not.toBeNull();
      expect(parentCheck.nested).toBeNull();

      // Commit the parent transaction
      await parentTransaction.commit();

      // Verify final state
      const finalParentRecord = await prismaService.healthMetric.findUnique({
        where: { id: parentRecord.id },
      });
      const finalNestedRecord = await prismaService.healthMetric.findUnique({
        where: { id: nestedRecord.id },
      });

      expect(finalParentRecord).not.toBeNull();
      expect(finalNestedRecord).toBeNull();
    });

    it('should rollback parent transaction and all nested transactions', async () => {
      // Create a parent transaction
      const parentTransaction = await transactionService.createTransaction();
      await parentTransaction.start();

      // Create a parent record
      const parentRecord = await parentTransaction.execute(async (client) => {
        return client.healthMetric.create({
          data: {
            userId: testUserIds[0],
            typeId: testData.health[0].metrics[0].typeId,
            value: '100',
            timestamp: new Date(),
            source: 'TEST',
            notes: 'Parent transaction record for rollback test',
          },
        });
      });

      // Create a nested transaction
      const nestedTransaction = await parentTransaction.createNestedTransaction();

      // Create a nested record
      const nestedRecord = await nestedTransaction.execute(async (client) => {
        return client.healthMetric.create({
          data: {
            userId: testUserIds[0],
            typeId: testData.health[0].metrics[0].typeId,
            value: '110',
            timestamp: new Date(),
            source: 'TEST',
            notes: 'Nested transaction record for rollback test',
          },
        });
      });

      // Commit the nested transaction
      await nestedTransaction.commit();

      // Verify both records are visible in the parent transaction
      const parentCheck = await parentTransaction.execute(async (client) => {
        const parent = await client.healthMetric.findUnique({
          where: { id: parentRecord.id },
        });
        const nested = await client.healthMetric.findUnique({
          where: { id: nestedRecord.id },
        });
        return { parent, nested };
      });

      expect(parentCheck.parent).not.toBeNull();
      expect(parentCheck.nested).not.toBeNull();

      // Rollback the parent transaction
      await parentTransaction.rollback();

      // Verify neither record is visible after parent rollback
      const finalParentRecord = await prismaService.healthMetric.findUnique({
        where: { id: parentRecord.id },
      });
      const finalNestedRecord = await prismaService.healthMetric.findUnique({
        where: { id: nestedRecord.id },
      });

      expect(finalParentRecord).toBeNull();
      expect(finalNestedRecord).toBeNull();
    });
  });

  describe('Cross-Journey Transactions', () => {
    it('should maintain consistency across multiple journey contexts', async () => {
      // Create a transaction
      const transaction = await transactionService.createTransaction({
        journeyContext: 'cross-journey'
      });
      await transaction.start();

      // Create records in multiple journey contexts
      const healthMetric = await transaction.execute(async (client) => {
        return client.healthMetric.create({
          data: {
            userId: testUserIds[0],
            typeId: testData.health[0].metrics[0].typeId,
            value: '100',
            timestamp: new Date(),
            source: 'TEST',
            notes: 'Cross-journey health metric',
          },
        });
      });

      const careAppointment = await transaction.execute(async (client) => {
        return client.appointment.create({
          data: {
            userId: testUserIds[0],
            providerId: testData.care[0].providers[0].id,
            date: new Date(),
            time: '15:00',
            status: 'SCHEDULED',
            notes: 'Cross-journey appointment',
            type: 'IN_PERSON',
            location: 'Test Clinic',
            reason: 'Cross-journey testing',
          },
        });
      });

      const planClaim = await transaction.execute(async (client) => {
        return client.claim.create({
          data: {
            userId: testUserIds[0],
            planId: testData.plan[0].plans[0].id,
            typeId: (await client.claimType.findFirst()).id,
            serviceDate: new Date(),
            submissionDate: new Date(),
            amount: 150.00,
            status: 'PENDING',
            notes: 'Cross-journey claim',
            providerName: 'Test Provider',
            serviceDescription: 'Cross-journey service',
          },
        });
      });

      // Verify all records are visible in the transaction
      const check = await transaction.execute(async (client) => {
        const health = await client.healthMetric.findUnique({
          where: { id: healthMetric.id },
        });
        const care = await client.appointment.findUnique({
          where: { id: careAppointment.id },
        });
        const plan = await client.claim.findUnique({
          where: { id: planClaim.id },
        });
        return { health, care, plan };
      });

      expect(check.health).not.toBeNull();
      expect(check.care).not.toBeNull();
      expect(check.plan).not.toBeNull();

      // Rollback the transaction
      await transaction.rollback();

      // Verify no records are visible after rollback
      const finalHealthMetric = await prismaService.healthMetric.findUnique({
        where: { id: healthMetric.id },
      });
      const finalCareAppointment = await prismaService.appointment.findUnique({
        where: { id: careAppointment.id },
      });
      const finalPlanClaim = await prismaService.claim.findUnique({
        where: { id: planClaim.id },
      });

      expect(finalHealthMetric).toBeNull();
      expect(finalCareAppointment).toBeNull();
      expect(finalPlanClaim).toBeNull();
    });

    it('should use journey-specific contexts with a shared transaction', async () => {
      // Create a transaction
      const transaction = await transactionService.createTransaction();
      await transaction.start();

      // Get the transaction client
      const client = await transaction.execute(c => Promise.resolve(c));

      // Use journey-specific contexts with the transaction client
      const healthMetric = await healthContext.createHealthMetric(
        client,
        {
          userId: testUserIds[0],
          typeId: testData.health[0].metrics[0].typeId,
          value: '95',
          timestamp: new Date(),
          source: 'TEST',
          notes: 'Created via HealthContext in shared transaction',
        }
      );

      const appointment = await careContext.createAppointment(
        client,
        {
          userId: testUserIds[0],
          providerId: testData.care[0].providers[0].id,
          date: new Date(),
          time: '16:30',
          status: 'SCHEDULED',
          notes: 'Created via CareContext in shared transaction',
          type: 'IN_PERSON',
          location: 'Test Clinic',
          reason: 'Context testing',
        }
      );

      // Verify records are visible in the transaction
      const healthCheck = await healthContext.getHealthMetricById(client, healthMetric.id);
      const careCheck = await careContext.getAppointmentById(client, appointment.id);

      expect(healthCheck).not.toBeNull();
      expect(healthCheck?.notes).toBe('Created via HealthContext in shared transaction');
      expect(careCheck).not.toBeNull();
      expect(careCheck?.notes).toBe('Created via CareContext in shared transaction');

      // Commit the transaction
      await transaction.commit();

      // Verify records are visible after commit
      const finalHealthMetric = await healthContext.getHealthMetricById(prismaService, healthMetric.id);
      const finalAppointment = await careContext.getAppointmentById(prismaService, appointment.id);

      expect(finalHealthMetric).not.toBeNull();
      expect(finalAppointment).not.toBeNull();
    });
  });

  describe('Transaction Timeout Handling', () => {
    it('should handle transaction timeouts', async () => {
      // Create a transaction with a very short timeout
      const transaction = await transactionService.createTransaction({
        timeout: {
          timeoutMs: 100, // 100ms timeout
          autoRollbackOnTimeout: true
        }
      });
      await transaction.start();

      // Create a record
      const metric = await transaction.execute(async (client) => {
        return client.healthMetric.create({
          data: {
            userId: testUserIds[0],
            typeId: testData.health[0].metrics[0].typeId,
            value: '100',
            timestamp: new Date(),
            source: 'TEST',
            notes: 'Should be rolled back on timeout',
          },
        });
      });

      // Wait for the timeout to occur
      await new Promise(resolve => setTimeout(resolve, 200));

      // Try to use the transaction after timeout
      try {
        await transaction.execute(async (client) => {
          return client.healthMetric.findUnique({
            where: { id: metric.id },
          });
        });
        fail('Transaction should have timed out');
      } catch (error) {
        expect(error).toBeInstanceOf(TransactionError);
        expect(transaction.state).toBe(TransactionState.FAILED);
      }

      // Verify the record was rolled back
      const finalMetric = await prismaService.healthMetric.findUnique({
        where: { id: metric.id },
      });
      expect(finalMetric).toBeNull();
    });

    it('should retry transactions that fail with retryable errors', async () => {
      // Mock a function that fails once then succeeds
      let attempts = 0;
      const mockOperation = jest.fn().mockImplementation(async (client: PrismaClient) => {
        attempts++;
        if (attempts === 1) {
          // Simulate a deadlock error on first attempt
          const error = new DeadlockError(
            'Deadlock detected (mock)',
            { transactionId: 'test-transaction' }
          );
          throw error;
        }
        
        // Succeed on second attempt
        return client.healthMetric.create({
          data: {
            userId: testUserIds[0],
            typeId: testData.health[0].metrics[0].typeId,
            value: '100',
            timestamp: new Date(),
            source: 'TEST',
            notes: 'Created after retry',
          },
        });
      });

      // Execute with retry
      const result = await transactionService.executeTransactionWithRetry(
        mockOperation,
        {
          maxRetries: 3,
          baseDelayMs: 50,
          useJitter: false
        }
      );

      // Verify the operation was retried and succeeded
      expect(mockOperation).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
      expect(result.notes).toBe('Created after retry');

      // Verify the record was created
      const metric = await prismaService.healthMetric.findUnique({
        where: { id: result.id },
      });
      expect(metric).not.toBeNull();
    });
  });

  describe('Transaction Performance Under Load', () => {
    it('should handle multiple concurrent transactions', async () => {
      // Create multiple transactions
      const transactionCount = 5;
      const transactions = [];
      
      for (let i = 0; i < transactionCount; i++) {
        const transaction = await transactionService.createTransaction();
        await transaction.start();
        transactions.push(transaction);
      }

      // Execute operations in all transactions concurrently
      const operations = transactions.map((transaction, index) => {
        return transaction.execute(async (client) => {
          return client.healthMetric.create({
            data: {
              userId: testUserIds[0],
              typeId: testData.health[0].metrics[0].typeId,
              value: String(100 + index),
              timestamp: new Date(),
              source: 'TEST',
              notes: `Concurrent transaction ${index}`,
            },
          });
        });
      });

      // Wait for all operations to complete
      const results = await Promise.all(operations);

      // Commit all transactions
      await Promise.all(transactions.map(t => t.commit()));

      // Verify all records were created
      for (const result of results) {
        const metric = await prismaService.healthMetric.findUnique({
          where: { id: result.id },
        });
        expect(metric).not.toBeNull();
        expect(metric?.notes).toContain('Concurrent transaction');
      }
    });

    it('should handle a high volume of operations in a single transaction', async () => {
      // Create a transaction
      const transaction = await transactionService.createTransaction();
      await transaction.start();

      // Execute a large number of operations
      const operationCount = 50;
      const operations = [];
      
      for (let i = 0; i < operationCount; i++) {
        operations.push(
          transaction.execute(async (client) => {
            return client.healthMetric.create({
              data: {
                userId: testUserIds[0],
                typeId: testData.health[0].metrics[0].typeId,
                value: String(100 + i),
                timestamp: new Date(Date.now() + i * 1000), // Ensure unique timestamps
                source: 'TEST',
                notes: `High volume operation ${i}`,
              },
            });
          })
        );
      }

      // Wait for all operations to complete
      const results = await Promise.all(operations);

      // Commit the transaction
      await transaction.commit();

      // Verify all records were created
      const metrics = await prismaService.healthMetric.findMany({
        where: {
          userId: testUserIds[0],
          notes: { contains: 'High volume operation' }
        },
      });

      expect(metrics.length).toBe(operationCount);
    });
  });

  describe('Transaction Manager API', () => {
    it('should track active transactions', async () => {
      // Create multiple transactions
      const transaction1 = await transactionService.createTransaction({
        journeyContext: 'health'
      });
      const transaction2 = await transactionService.createTransaction({
        journeyContext: 'care'
      });
      const transaction3 = await transactionService.createTransaction({
        journeyContext: 'health'
      });
      
      await transaction1.start();
      await transaction2.start();
      await transaction3.start();

      // Get active transactions
      const allActive = await transactionService.getActiveTransactions();
      expect(allActive.length).toBeGreaterThanOrEqual(3);

      // Get transactions for a specific journey
      const healthTransactions = await transactionService.getJourneyTransactions('health');
      expect(healthTransactions.length).toBeGreaterThanOrEqual(2);

      const careTransactions = await transactionService.getJourneyTransactions('care');
      expect(careTransactions.length).toBeGreaterThanOrEqual(1);

      // Get a specific transaction by ID
      const retrievedTransaction = await transactionService.getTransaction(transaction1.id);
      expect(retrievedTransaction).not.toBeNull();
      expect(retrievedTransaction?.id).toBe(transaction1.id);

      // Clean up
      await transaction1.commit();
      await transaction2.commit();
      await transaction3.commit();

      // Verify transactions are removed after commit
      const afterCommit = await transactionService.getTransaction(transaction1.id);
      expect(afterCommit).toBeNull();
    });

    it('should support the simplified transaction API', async () => {
      // Start a transaction
      const client = await transactionService.startTransaction({
        isolationLevel: TransactionIsolationLevel.READ_COMMITTED
      });

      // Use the client directly
      const metric = await client.healthMetric.create({
        data: {
          userId: testUserIds[0],
          typeId: testData.health[0].metrics[0].typeId,
          value: '100',
          timestamp: new Date(),
          source: 'TEST',
          notes: 'Created with simplified API',
        },
      });

      // Commit the transaction
      await transactionService.commitTransaction(client);

      // Verify the record was created
      const finalMetric = await prismaService.healthMetric.findUnique({
        where: { id: metric.id },
      });
      expect(finalMetric).not.toBeNull();
      expect(finalMetric?.notes).toBe('Created with simplified API');
    });

    it('should support the simplified transaction API with rollback', async () => {
      // Start a transaction
      const client = await transactionService.startTransaction();

      // Use the client directly
      const metric = await client.healthMetric.create({
        data: {
          userId: testUserIds[0],
          typeId: testData.health[0].metrics[0].typeId,
          value: '100',
          timestamp: new Date(),
          source: 'TEST',
          notes: 'Should be rolled back with simplified API',
        },
      });

      // Rollback the transaction
      await transactionService.rollbackTransaction(client);

      // Verify the record was not created
      const finalMetric = await prismaService.healthMetric.findUnique({
        where: { id: metric.id },
      });
      expect(finalMetric).toBeNull();
    });
  });
});
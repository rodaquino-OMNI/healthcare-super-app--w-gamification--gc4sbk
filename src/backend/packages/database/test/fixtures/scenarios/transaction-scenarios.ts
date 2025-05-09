/**
 * @file transaction-scenarios.ts
 * @description Test fixtures for transaction management testing across journey services.
 * Provides scenarios for transaction commits, rollbacks, nested transactions, and cross-journey transactions.
 */

import { PrismaClient } from '@prisma/client';
import { BaseJourneyContext } from '../../../src/contexts/base-journey.context';
import { HealthContext } from '../../../src/contexts/health.context';
import { CareContext } from '../../../src/contexts/care.context';
import { PlanContext } from '../../../src/contexts/plan.context';
import { 
  TransactionIsolationLevel,
  TransactionOptions,
  TransactionType,
  TransactionState
} from '../../../src/transactions/transaction.interface';
import { TransactionError } from '../../../src/transactions/transaction.errors';
import { JourneyType } from '../../../src/types/journey.types';

/**
 * Interface for a transaction test scenario
 */
export interface TransactionScenario {
  /** Unique identifier for the scenario */
  id: string;
  
  /** Human-readable name of the scenario */
  name: string;
  
  /** Description of what the scenario tests */
  description: string;
  
  /** Journey types involved in the scenario */
  journeys: JourneyType[];
  
  /** Transaction options for the scenario */
  options?: Partial<TransactionOptions>;
  
  /** Function that sets up the scenario */
  setup?: () => Promise<any>;
  
  /** Function that executes the transaction scenario */
  execute: (contexts: Record<JourneyType, BaseJourneyContext>) => Promise<any>;
  
  /** Expected outcome of the scenario */
  expectedOutcome: {
    /** Expected final transaction state */
    state: TransactionState;
    
    /** Whether the scenario should throw an error */
    error?: boolean;
    
    /** Expected error type if the scenario should throw an error */
    errorType?: any;
    
    /** Expected database state after the scenario */
    databaseState?: Record<string, any>;
  };
  
  /** Function that validates the outcome of the scenario */
  validate?: (result: any, contexts: Record<JourneyType, BaseJourneyContext>) => Promise<boolean>;
  
  /** Function that cleans up after the scenario */
  cleanup?: () => Promise<void>;
}

/**
 * Mock data for health metrics used in transaction scenarios
 */
export const mockHealthMetrics = [
  {
    id: 'hm-1',
    userId: 'user-1',
    type: 'HEART_RATE',
    value: 75,
    unit: 'bpm',
    timestamp: new Date(),
    source: 'MANUAL',
    notes: 'Resting heart rate'
  },
  {
    id: 'hm-2',
    userId: 'user-1',
    type: 'BLOOD_PRESSURE',
    value: '120/80',
    unit: 'mmHg',
    timestamp: new Date(),
    source: 'DEVICE',
    notes: 'Morning measurement'
  },
  {
    id: 'hm-3',
    userId: 'user-1',
    type: 'WEIGHT',
    value: 70.5,
    unit: 'kg',
    timestamp: new Date(),
    source: 'DEVICE',
    notes: 'Weekly weigh-in'
  }
];

/**
 * Mock data for care appointments used in transaction scenarios
 */
export const mockAppointments = [
  {
    id: 'apt-1',
    userId: 'user-1',
    providerId: 'provider-1',
    specialtyId: 'specialty-1',
    date: new Date(Date.now() + 86400000), // Tomorrow
    status: 'SCHEDULED',
    notes: 'Annual check-up',
    location: 'Main Clinic'
  },
  {
    id: 'apt-2',
    userId: 'user-1',
    providerId: 'provider-2',
    specialtyId: 'specialty-2',
    date: new Date(Date.now() + 172800000), // Day after tomorrow
    status: 'SCHEDULED',
    notes: 'Follow-up appointment',
    location: 'Virtual'
  }
];

/**
 * Mock data for plan claims used in transaction scenarios
 */
export const mockClaims = [
  {
    id: 'claim-1',
    userId: 'user-1',
    planId: 'plan-1',
    typeId: 'type-1',
    amount: 150.0,
    currency: 'BRL',
    status: 'SUBMITTED',
    date: new Date(),
    description: 'Doctor visit',
    receiptUrl: 'https://storage.example.com/receipts/receipt-1.pdf'
  },
  {
    id: 'claim-2',
    userId: 'user-1',
    planId: 'plan-1',
    typeId: 'type-2',
    amount: 75.0,
    currency: 'BRL',
    status: 'SUBMITTED',
    date: new Date(),
    description: 'Prescription medication',
    receiptUrl: 'https://storage.example.com/receipts/receipt-2.pdf'
  }
];

/**
 * Mock data for gamification events used in transaction scenarios
 */
export const mockGamificationEvents = [
  {
    id: 'event-1',
    userId: 'user-1',
    type: 'HEALTH_METRIC_RECORDED',
    journey: 'health',
    points: 10,
    metadata: {
      metricType: 'HEART_RATE',
      streak: 3
    },
    timestamp: new Date()
  },
  {
    id: 'event-2',
    userId: 'user-1',
    type: 'APPOINTMENT_COMPLETED',
    journey: 'care',
    points: 25,
    metadata: {
      appointmentId: 'apt-1',
      providerId: 'provider-1'
    },
    timestamp: new Date()
  },
  {
    id: 'event-3',
    userId: 'user-1',
    type: 'CLAIM_SUBMITTED',
    journey: 'plan',
    points: 15,
    metadata: {
      claimId: 'claim-1',
      amount: 150.0
    },
    timestamp: new Date()
  }
];

/**
 * Helper function to create a transaction error for testing
 * @param message Error message
 * @param code Error code
 * @returns A TransactionError instance
 */
export function createTransactionError(message: string, code?: string): TransactionError {
  return new TransactionError(message, { code });
}

/**
 * Basic transaction scenario that successfully commits
 */
export const basicCommitScenario: TransactionScenario = {
  id: 'basic-commit',
  name: 'Basic Transaction Commit',
  description: 'Tests a basic transaction that successfully commits changes to the database',
  journeys: [JourneyType.HEALTH],
  options: {
    isolationLevel: TransactionIsolationLevel.READ_COMMITTED
  },
  execute: async (contexts) => {
    const healthContext = contexts[JourneyType.HEALTH] as HealthContext;
    
    return healthContext.executeTransaction(async (tx) => {
      // Create a health metric in the transaction
      const metric = await tx.healthMetric.create({
        data: mockHealthMetrics[0]
      });
      
      // Return the created metric
      return metric;
    });
  },
  expectedOutcome: {
    state: TransactionState.COMMITTED,
    databaseState: {
      healthMetrics: 1 // Expect one health metric to be created
    }
  },
  validate: async (result, contexts) => {
    const healthContext = contexts[JourneyType.HEALTH] as HealthContext;
    
    // Verify the metric was created
    const metric = await healthContext.findHealthMetricById(result.id);
    return !!metric && metric.id === result.id;
  },
  cleanup: async () => {
    // Clean up created data
    const prisma = new PrismaClient();
    await prisma.healthMetric.deleteMany({
      where: { id: mockHealthMetrics[0].id }
    });
    await prisma.$disconnect();
  }
};

/**
 * Basic transaction scenario that rolls back due to an error
 */
export const basicRollbackScenario: TransactionScenario = {
  id: 'basic-rollback',
  name: 'Basic Transaction Rollback',
  description: 'Tests a basic transaction that rolls back changes due to an error',
  journeys: [JourneyType.HEALTH],
  options: {
    isolationLevel: TransactionIsolationLevel.READ_COMMITTED
  },
  execute: async (contexts) => {
    const healthContext = contexts[JourneyType.HEALTH] as HealthContext;
    
    try {
      return await healthContext.executeTransaction(async (tx) => {
        // Create a health metric in the transaction
        await tx.healthMetric.create({
          data: mockHealthMetrics[0]
        });
        
        // Throw an error to trigger rollback
        throw new Error('Intentional error to trigger rollback');
      });
    } catch (error) {
      // Return the error for validation
      return error;
    }
  },
  expectedOutcome: {
    state: TransactionState.ROLLED_BACK,
    error: true,
    errorType: Error,
    databaseState: {
      healthMetrics: 0 // Expect no health metrics to be created due to rollback
    }
  },
  validate: async (result, contexts) => {
    const healthContext = contexts[JourneyType.HEALTH] as HealthContext;
    
    // Verify the error was thrown
    if (!(result instanceof Error)) {
      return false;
    }
    
    // Verify the metric was not created (rolled back)
    const metrics = await healthContext.findHealthMetrics({
      userId: mockHealthMetrics[0].userId
    });
    return metrics.length === 0;
  }
};

/**
 * Nested transaction scenario with savepoints
 */
export const nestedTransactionScenario: TransactionScenario = {
  id: 'nested-transaction',
  name: 'Nested Transaction with Savepoints',
  description: 'Tests nested transactions with savepoints for partial rollbacks',
  journeys: [JourneyType.HEALTH],
  options: {
    isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
    type: TransactionType.NESTED,
    savepoint: {
      useSavepoints: true
    }
  },
  execute: async (contexts) => {
    const healthContext = contexts[JourneyType.HEALTH] as HealthContext;
    
    return healthContext.executeTransaction(async (tx) => {
      // Create first health metric in the parent transaction
      const metric1 = await tx.healthMetric.create({
        data: mockHealthMetrics[0]
      });
      
      try {
        // Create a savepoint
        const savepointName = 'SAVEPOINT_1';
        await tx.$executeRaw`SAVEPOINT ${savepointName}`;
        
        // Create second health metric after savepoint
        await tx.healthMetric.create({
          data: mockHealthMetrics[1]
        });
        
        // Throw an error to trigger rollback to savepoint
        throw new Error('Intentional error to trigger savepoint rollback');
      } catch (error) {
        // Roll back to the savepoint
        await tx.$executeRaw`ROLLBACK TO SAVEPOINT SAVEPOINT_1`;
        
        // Create third health metric after rolling back to savepoint
        const metric3 = await tx.healthMetric.create({
          data: mockHealthMetrics[2]
        });
        
        // Return the metrics that should persist
        return { metric1, metric3 };
      }
    });
  },
  expectedOutcome: {
    state: TransactionState.COMMITTED,
    databaseState: {
      healthMetrics: 2 // Expect two health metrics (first and third) to be created
    }
  },
  validate: async (result, contexts) => {
    const healthContext = contexts[JourneyType.HEALTH] as HealthContext;
    
    // Verify the first and third metrics were created
    const metrics = await healthContext.findHealthMetrics({
      userId: mockHealthMetrics[0].userId
    });
    
    // Should have exactly 2 metrics
    if (metrics.length !== 2) {
      return false;
    }
    
    // Should have metrics with IDs matching the first and third mock metrics
    const metricIds = metrics.map(m => m.id).sort();
    const expectedIds = [mockHealthMetrics[0].id, mockHealthMetrics[2].id].sort();
    
    return metricIds.every((id, index) => id === expectedIds[index]);
  },
  cleanup: async () => {
    // Clean up created data
    const prisma = new PrismaClient();
    await prisma.healthMetric.deleteMany({
      where: {
        id: {
          in: [mockHealthMetrics[0].id, mockHealthMetrics[2].id]
        }
      }
    });
    await prisma.$disconnect();
  }
};

/**
 * Cross-journey transaction scenario involving multiple journey contexts
 */
export const crossJourneyTransactionScenario: TransactionScenario = {
  id: 'cross-journey-transaction',
  name: 'Cross-Journey Transaction',
  description: 'Tests a transaction that spans multiple journey contexts',
  journeys: [JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN],
  options: {
    isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
    distributed: {
      isDistributed: true,
      transactionId: 'cross-journey-tx-1'
    }
  },
  execute: async (contexts) => {
    const healthContext = contexts[JourneyType.HEALTH] as HealthContext;
    const careContext = contexts[JourneyType.CARE] as CareContext;
    const planContext = contexts[JourneyType.PLAN] as PlanContext;
    
    // Start a distributed transaction
    const transactionId = 'cross-journey-tx-1';
    
    try {
      // Phase 1: Prepare all participants
      const healthPrepared = await healthContext.prepareDistributedTransaction(transactionId);
      const carePrepared = await careContext.prepareDistributedTransaction(transactionId);
      const planPrepared = await planContext.prepareDistributedTransaction(transactionId);
      
      if (healthPrepared && carePrepared && planPrepared) {
        // Phase 2: Execute operations in each journey context
        const healthResult = await healthContext.executeInDistributedTransaction(
          transactionId,
          async (tx) => {
            return tx.healthMetric.create({
              data: mockHealthMetrics[0]
            });
          }
        );
        
        const careResult = await careContext.executeInDistributedTransaction(
          transactionId,
          async (tx) => {
            return tx.appointment.create({
              data: mockAppointments[0]
            });
          }
        );
        
        const planResult = await planContext.executeInDistributedTransaction(
          transactionId,
          async (tx) => {
            return tx.claim.create({
              data: mockClaims[0]
            });
          }
        );
        
        // Phase 3: Commit the distributed transaction
        await healthContext.commitDistributedTransaction(transactionId);
        await careContext.commitDistributedTransaction(transactionId);
        await planContext.commitDistributedTransaction(transactionId);
        
        return {
          health: healthResult,
          care: careResult,
          plan: planResult
        };
      } else {
        // If any participant failed to prepare, roll back all
        await healthContext.rollbackDistributedTransaction(transactionId);
        await careContext.rollbackDistributedTransaction(transactionId);
        await planContext.rollbackDistributedTransaction(transactionId);
        
        throw new Error('Failed to prepare all participants for distributed transaction');
      }
    } catch (error) {
      // Ensure rollback on any error
      await healthContext.rollbackDistributedTransaction(transactionId);
      await careContext.rollbackDistributedTransaction(transactionId);
      await planContext.rollbackDistributedTransaction(transactionId);
      
      throw error;
    }
  },
  expectedOutcome: {
    state: TransactionState.COMMITTED,
    databaseState: {
      healthMetrics: 1,
      appointments: 1,
      claims: 1
    }
  },
  validate: async (result, contexts) => {
    const healthContext = contexts[JourneyType.HEALTH] as HealthContext;
    const careContext = contexts[JourneyType.CARE] as CareContext;
    const planContext = contexts[JourneyType.PLAN] as PlanContext;
    
    // Verify entities were created in all journey contexts
    const healthMetric = await healthContext.findHealthMetricById(result.health.id);
    const appointment = await careContext.findAppointmentById(result.care.id);
    const claim = await planContext.findClaimById(result.plan.id);
    
    return !!healthMetric && !!appointment && !!claim;
  },
  cleanup: async () => {
    // Clean up created data
    const prisma = new PrismaClient();
    await prisma.healthMetric.deleteMany({
      where: { id: mockHealthMetrics[0].id }
    });
    await prisma.appointment.deleteMany({
      where: { id: mockAppointments[0].id }
    });
    await prisma.claim.deleteMany({
      where: { id: mockClaims[0].id }
    });
    await prisma.$disconnect();
  }
};

/**
 * Transaction scenario with partial failure and recovery
 */
export const partialFailureRecoveryScenario: TransactionScenario = {
  id: 'partial-failure-recovery',
  name: 'Partial Failure with Recovery',
  description: 'Tests a transaction that experiences a partial failure but recovers with retry',
  journeys: [JourneyType.HEALTH, JourneyType.CARE],
  options: {
    retry: {
      maxRetries: 3,
      baseDelayMs: 100,
      maxDelayMs: 1000,
      useJitter: true
    }
  },
  execute: async (contexts) => {
    const healthContext = contexts[JourneyType.HEALTH] as HealthContext;
    const careContext = contexts[JourneyType.CARE] as CareContext;
    
    // Counter to simulate a transient failure that succeeds on retry
    let attemptCount = 0;
    
    return healthContext.executeWithRetry(async (tx) => {
      // Create health metric
      const metric = await tx.healthMetric.create({
        data: mockHealthMetrics[0]
      });
      
      // Simulate a transient failure on the first attempt
      attemptCount++;
      if (attemptCount === 1) {
        throw createTransactionError('Simulated transient error', 'P1001');
      }
      
      // On retry, continue with the transaction
      const appointment = await careContext.executeTransaction(async (careTx) => {
        return careTx.appointment.create({
          data: mockAppointments[0]
        });
      });
      
      return { metric, appointment, attemptCount };
    }, {
      maxRetries: 3,
      baseDelayMs: 100,
      maxDelayMs: 1000
    });
  },
  expectedOutcome: {
    state: TransactionState.COMMITTED,
    databaseState: {
      healthMetrics: 1,
      appointments: 1
    }
  },
  validate: async (result, contexts) => {
    const healthContext = contexts[JourneyType.HEALTH] as HealthContext;
    const careContext = contexts[JourneyType.CARE] as CareContext;
    
    // Verify entities were created
    const healthMetric = await healthContext.findHealthMetricById(result.metric.id);
    const appointment = await careContext.findAppointmentById(result.appointment.id);
    
    // Verify that retry occurred (attemptCount should be 2)
    return !!healthMetric && !!appointment && result.attemptCount === 2;
  },
  cleanup: async () => {
    // Clean up created data
    const prisma = new PrismaClient();
    await prisma.healthMetric.deleteMany({
      where: { id: mockHealthMetrics[0].id }
    });
    await prisma.appointment.deleteMany({
      where: { id: mockAppointments[0].id }
    });
    await prisma.$disconnect();
  }
};

/**
 * Transaction scenario testing different isolation levels
 */
export const isolationLevelScenario: TransactionScenario = {
  id: 'isolation-level-test',
  name: 'Transaction Isolation Level Test',
  description: 'Tests transaction behavior with different isolation levels',
  journeys: [JourneyType.HEALTH],
  options: {
    isolationLevel: TransactionIsolationLevel.SERIALIZABLE
  },
  execute: async (contexts) => {
    const healthContext = contexts[JourneyType.HEALTH] as HealthContext;
    
    // Create a separate client for concurrent operations
    const concurrentPrisma = new PrismaClient();
    
    try {
      // Start a serializable transaction
      const result = await healthContext.executeTransaction(async (tx) => {
        // Create a health metric in the transaction
        const metric = await tx.healthMetric.create({
          data: mockHealthMetrics[0]
        });
        
        // Try to read the metric from a concurrent connection (should not be visible)
        const concurrentRead = await concurrentPrisma.healthMetric.findUnique({
          where: { id: metric.id }
        });
        
        // Update the metric in the transaction
        const updatedMetric = await tx.healthMetric.update({
          where: { id: metric.id },
          data: { value: 80 }
        });
        
        return {
          metric,
          updatedMetric,
          concurrentRead
        };
      }, TransactionIsolationLevel.SERIALIZABLE);
      
      // After transaction commits, read the metric from the concurrent connection
      const afterCommitRead = await concurrentPrisma.healthMetric.findUnique({
        where: { id: result.metric.id }
      });
      
      return {
        ...result,
        afterCommitRead
      };
    } finally {
      await concurrentPrisma.$disconnect();
    }
  },
  expectedOutcome: {
    state: TransactionState.COMMITTED,
    databaseState: {
      healthMetrics: 1
    }
  },
  validate: async (result) => {
    // Verify that the concurrent read during the transaction was null (serializable isolation)
    if (result.concurrentRead !== null) {
      return false;
    }
    
    // Verify that the after-commit read shows the updated value
    return (
      result.afterCommitRead !== null &&
      result.afterCommitRead.id === result.metric.id &&
      result.afterCommitRead.value === 80
    );
  },
  cleanup: async () => {
    // Clean up created data
    const prisma = new PrismaClient();
    await prisma.healthMetric.deleteMany({
      where: { id: mockHealthMetrics[0].id }
    });
    await prisma.$disconnect();
  }
};

/**
 * Transaction scenario with deadlock detection and recovery
 */
export const deadlockRecoveryScenario: TransactionScenario = {
  id: 'deadlock-recovery',
  name: 'Deadlock Detection and Recovery',
  description: 'Tests transaction behavior when a deadlock is detected, with automatic retry',
  journeys: [JourneyType.HEALTH, JourneyType.CARE],
  options: {
    retry: {
      maxRetries: 3,
      baseDelayMs: 100,
      maxDelayMs: 1000,
      useJitter: true,
      retryableErrors: ['P2034'] // Prisma deadlock error code
    }
  },
  execute: async (contexts) => {
    const healthContext = contexts[JourneyType.HEALTH] as HealthContext;
    const careContext = contexts[JourneyType.CARE] as CareContext;
    
    // Counter to track retry attempts
    let attemptCount = 0;
    
    // Simulate a deadlock scenario with automatic retry
    return healthContext.executeWithRetry(async (tx) => {
      // Create health metric
      const metric = await tx.healthMetric.create({
        data: mockHealthMetrics[0]
      });
      
      // Simulate a deadlock on the first attempt
      attemptCount++;
      if (attemptCount === 1) {
        throw createTransactionError('Deadlock detected', 'P2034');
      }
      
      // On retry, continue with the transaction
      const appointment = await careContext.executeTransaction(async (careTx) => {
        return careTx.appointment.create({
          data: mockAppointments[0]
        });
      });
      
      return { metric, appointment, attemptCount };
    }, {
      maxRetries: 3,
      baseDelayMs: 100,
      maxDelayMs: 1000
    });
  },
  expectedOutcome: {
    state: TransactionState.COMMITTED,
    databaseState: {
      healthMetrics: 1,
      appointments: 1
    }
  },
  validate: async (result, contexts) => {
    const healthContext = contexts[JourneyType.HEALTH] as HealthContext;
    const careContext = contexts[JourneyType.CARE] as CareContext;
    
    // Verify entities were created
    const healthMetric = await healthContext.findHealthMetricById(result.metric.id);
    const appointment = await careContext.findAppointmentById(result.appointment.id);
    
    // Verify that retry occurred (attemptCount should be 2)
    return !!healthMetric && !!appointment && result.attemptCount === 2;
  },
  cleanup: async () => {
    // Clean up created data
    const prisma = new PrismaClient();
    await prisma.healthMetric.deleteMany({
      where: { id: mockHealthMetrics[0].id }
    });
    await prisma.appointment.deleteMany({
      where: { id: mockAppointments[0].id }
    });
    await prisma.$disconnect();
  }
};

/**
 * Transaction scenario with timeout handling
 */
export const transactionTimeoutScenario: TransactionScenario = {
  id: 'transaction-timeout',
  name: 'Transaction Timeout Handling',
  description: 'Tests transaction behavior when a timeout occurs',
  journeys: [JourneyType.HEALTH],
  options: {
    timeout: {
      timeoutMs: 1000, // 1 second timeout
      autoRollbackOnTimeout: true
    }
  },
  execute: async (contexts) => {
    const healthContext = contexts[JourneyType.HEALTH] as HealthContext;
    
    try {
      return await healthContext.executeTransaction(async (tx) => {
        // Create a health metric in the transaction
        const metric = await tx.healthMetric.create({
          data: mockHealthMetrics[0]
        });
        
        // Simulate a long-running operation that exceeds the timeout
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds
        
        // This should not execute due to timeout
        return metric;
      });
    } catch (error) {
      // Return the error for validation
      return error;
    }
  },
  expectedOutcome: {
    state: TransactionState.ROLLED_BACK,
    error: true,
    errorType: TransactionError,
    databaseState: {
      healthMetrics: 0 // Expect no health metrics due to timeout rollback
    }
  },
  validate: async (result, contexts) => {
    const healthContext = contexts[JourneyType.HEALTH] as HealthContext;
    
    // Verify the error was a transaction timeout error
    if (!(result instanceof TransactionError) || !result.message.includes('timeout')) {
      return false;
    }
    
    // Verify the metric was not created (rolled back)
    const metrics = await healthContext.findHealthMetrics({
      userId: mockHealthMetrics[0].userId
    });
    return metrics.length === 0;
  }
};

/**
 * Export all transaction scenarios
 */
export const transactionScenarios: Record<string, TransactionScenario> = {
  basicCommit: basicCommitScenario,
  basicRollback: basicRollbackScenario,
  nestedTransaction: nestedTransactionScenario,
  crossJourneyTransaction: crossJourneyTransactionScenario,
  partialFailureRecovery: partialFailureRecoveryScenario,
  isolationLevelTest: isolationLevelScenario,
  deadlockRecovery: deadlockRecoveryScenario,
  transactionTimeout: transactionTimeoutScenario
};

/**
 * Default export for the transaction scenarios
 */
export default transactionScenarios;
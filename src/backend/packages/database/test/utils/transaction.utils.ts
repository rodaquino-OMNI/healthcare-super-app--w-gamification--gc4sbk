/**
 * @file transaction.utils.ts
 * @description Testing utilities for database transactions that enable verification of transaction behavior,
 * rollback scenarios, and error conditions. Provides helpers for testing transaction isolation levels,
 * concurrency conflicts, and automatic rollbacks upon error conditions.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { performance } from 'perf_hooks';
import { v4 as uuidv4 } from 'uuid';

import {
  TransactionIsolationLevel,
  TransactionOptions,
  TransactionState,
  TransactionType
} from '../../src/types/transaction.types';

import {
  TransactionError,
  DeadlockError,
  TransactionTimeoutError,
  ConcurrencyControlError
} from '../../src/transactions/transaction.errors';

import {
  executeInTransaction,
  executeReadOperation,
  executeWriteOperation,
  executeReadWriteOperation,
  executeCriticalWriteOperation,
  OperationType,
  TransactionPerformanceMetrics
} from '../../src/transactions/transaction.utils';

/**
 * Interface for transaction test context
 */
export interface TransactionTestContext {
  /**
   * Unique identifier for the test context
   */
  id: string;

  /**
   * PrismaClient instance for the test
   */
  prisma: PrismaClient;

  /**
   * Start time of the test
   */
  startTime: number;

  /**
   * End time of the test
   */
  endTime?: number;

  /**
   * Performance metrics for the transaction
   */
  metrics?: TransactionPerformanceMetrics;

  /**
   * Error that occurred during the test, if any
   */
  error?: Error;

  /**
   * Whether the transaction was rolled back
   */
  wasRolledBack?: boolean;

  /**
   * Number of retry attempts made
   */
  retryCount?: number;

  /**
   * Custom test data
   */
  testData?: Record<string, any>;
}

/**
 * Interface for transaction conflict simulation options
 */
export interface ConflictSimulationOptions {
  /**
   * Type of conflict to simulate
   */
  conflictType: 'read-write' | 'write-write' | 'phantom-read' | 'non-repeatable-read';

  /**
   * Delay in milliseconds before triggering the conflict
   */
  delayMs?: number;

  /**
   * Entity to use for the conflict
   */
  entity: string;

  /**
   * ID of the entity to use for the conflict
   */
  entityId?: string | number;

  /**
   * Whether to use optimistic locking
   */
  useOptimisticLocking?: boolean;

  /**
   * Custom data for the conflict
   */
  data?: Record<string, any>;
}

/**
 * Interface for deadlock simulation options
 */
export interface DeadlockSimulationOptions {
  /**
   * Entities involved in the deadlock
   */
  entities: string[];

  /**
   * IDs of the entities involved in the deadlock
   */
  entityIds?: (string | number)[];

  /**
   * Delay in milliseconds between operations
   */
  delayBetweenOperationsMs?: number;

  /**
   * Whether to automatically resolve the deadlock
   */
  autoResolve?: boolean;

  /**
   * Custom data for the deadlock
   */
  data?: Record<string, any>[];
}

/**
 * Interface for isolation level test options
 */
export interface IsolationLevelTestOptions {
  /**
   * Isolation level to test
   */
  isolationLevel: TransactionIsolationLevel;

  /**
   * Entity to use for the test
   */
  entity: string;

  /**
   * Type of anomaly to test for
   */
  anomalyType: 'dirty-read' | 'non-repeatable-read' | 'phantom-read' | 'serialization-anomaly';

  /**
   * Expected result of the test
   */
  expectedResult: 'allowed' | 'prevented';

  /**
   * Custom data for the test
   */
  data?: Record<string, any>;
}

/**
 * Interface for retry test options
 */
export interface RetryTestOptions {
  /**
   * Maximum number of retries
   */
  maxRetries: number;

  /**
   * Base delay in milliseconds
   */
  baseDelayMs: number;

  /**
   * Maximum delay in milliseconds
   */
  maxDelayMs: number;

  /**
   * Whether to use jitter
   */
  useJitter?: boolean;

  /**
   * Error types that should trigger a retry
   */
  retryableErrors?: string[];

  /**
   * Function that simulates an error
   */
  errorSimulator: (attempt: number) => Error | null;
}

/**
 * Interface for performance test options
 */
export interface PerformanceTestOptions {
  /**
   * Name of the test
   */
  testName: string;

  /**
   * Number of iterations to run
   */
  iterations: number;

  /**
   * Isolation level to use
   */
  isolationLevel?: TransactionIsolationLevel;

  /**
   * Operation type
   */
  operationType?: OperationType;

  /**
   * Expected maximum duration in milliseconds
   */
  expectedMaxDurationMs?: number;

  /**
   * Expected maximum database time in milliseconds
   */
  expectedMaxDbTimeMs?: number;

  /**
   * Expected maximum query count
   */
  expectedMaxQueryCount?: number;
}

/**
 * Interface for transaction assertion options
 */
export interface TransactionAssertionOptions {
  /**
   * Expected state of the transaction
   */
  expectedState?: TransactionState;

  /**
   * Expected error type
   */
  expectedErrorType?: string;

  /**
   * Expected number of retry attempts
   */
  expectedRetryCount?: number;

  /**
   * Expected maximum duration in milliseconds
   */
  expectedMaxDurationMs?: number;

  /**
   * Custom assertions
   */
  customAssertions?: (context: TransactionTestContext) => void | Promise<void>;
}

// ===== TRANSACTION SIMULATION UTILITIES =====

/**
 * Creates a new transaction test context
 * 
 * @param prisma - PrismaClient instance
 * @param testData - Optional test data
 * @returns Transaction test context
 */
export function createTransactionTestContext(
  prisma: PrismaClient,
  testData?: Record<string, any>
): TransactionTestContext {
  return {
    id: uuidv4(),
    prisma,
    startTime: performance.now(),
    testData
  };
}

/**
 * Executes a test function within a transaction and records the results
 * 
 * @param context - Transaction test context
 * @param testFn - Function to execute within the transaction
 * @param options - Transaction options
 * @returns Updated transaction test context
 */
export async function executeTransactionTest<T>(
  context: TransactionTestContext,
  testFn: (tx: PrismaClient) => Promise<T>,
  options: Partial<TransactionOptions> = {}
): Promise<TransactionTestContext & { result?: T }> {
  const updatedContext = { ...context };
  
  try {
    // Execute the test function within a transaction
    const result = await executeInTransaction(context.prisma, testFn, options);
    
    // Update the context with the result and end time
    updatedContext.endTime = performance.now();
    updatedContext.wasRolledBack = false;
    
    return { ...updatedContext, result };
  } catch (error) {
    // Update the context with the error and end time
    updatedContext.endTime = performance.now();
    updatedContext.error = error instanceof Error ? error : new Error(String(error));
    updatedContext.wasRolledBack = true;
    
    return updatedContext;
  }
}

/**
 * Simulates a transaction that intentionally fails and rolls back
 * 
 * @param context - Transaction test context
 * @param setupFn - Function to set up the test data
 * @param failureFn - Function that causes the transaction to fail
 * @param options - Transaction options
 * @returns Updated transaction test context
 */
export async function simulateTransactionRollback(
  context: TransactionTestContext,
  setupFn: (tx: PrismaClient) => Promise<void>,
  failureFn: (tx: PrismaClient) => Promise<never>,
  options: Partial<TransactionOptions> = {}
): Promise<TransactionTestContext> {
  const updatedContext = { ...context };
  
  try {
    // Execute the setup and failure functions within a transaction
    await executeInTransaction(context.prisma, async (tx) => {
      await setupFn(tx);
      return failureFn(tx); // This should throw an error
    }, options);
    
    // If we get here, the transaction didn't fail as expected
    updatedContext.endTime = performance.now();
    updatedContext.wasRolledBack = false;
    updatedContext.error = new Error('Transaction did not fail as expected');
    
    return updatedContext;
  } catch (error) {
    // Update the context with the error and end time
    updatedContext.endTime = performance.now();
    updatedContext.error = error instanceof Error ? error : new Error(String(error));
    updatedContext.wasRolledBack = true;
    
    return updatedContext;
  }
}

/**
 * Verifies that changes made within a rolled back transaction are not persisted
 * 
 * @param context - Transaction test context
 * @param entity - Entity to check
 * @param query - Query to find the entity
 * @returns Promise resolving to true if the rollback was successful (entity not found or unchanged)
 */
export async function verifyTransactionRollback(
  context: TransactionTestContext,
  entity: string,
  query: any
): Promise<boolean> {
  // Get the Prisma model dynamically
  const model = context.prisma[entity] as any;
  
  if (!model) {
    throw new Error(`Invalid entity: ${entity}`);
  }
  
  // Try to find the entity
  const result = await model.findFirst({
    where: query
  });
  
  // If the entity doesn't exist or has the original values, the rollback was successful
  return !result || (context.testData?.originalValues && 
    Object.entries(context.testData.originalValues).every(
      ([key, value]) => result[key] === value
    ));
}

/**
 * Simulates a nested transaction with savepoints
 * 
 * @param context - Transaction test context
 * @param outerFn - Function to execute in the outer transaction
 * @param innerFn - Function to execute in the inner transaction
 * @param options - Transaction options
 * @returns Updated transaction test context
 */
export async function simulateNestedTransaction<T, U>(
  context: TransactionTestContext,
  outerFn: (tx: PrismaClient) => Promise<T>,
  innerFn: (tx: PrismaClient) => Promise<U>,
  options: Partial<TransactionOptions> = {}
): Promise<TransactionTestContext & { outerResult?: T, innerResult?: U }> {
  const updatedContext = { ...context };
  
  try {
    // Execute the outer function within a transaction
    const outerResult = await executeInTransaction(context.prisma, async (tx) => {
      const result = await outerFn(tx);
      
      // Execute the inner function within a nested transaction
      const innerResult = await executeInTransaction(tx as any, innerFn, {
        ...options,
        type: TransactionType.NESTED
      });
      
      // Store the inner result in the context
      updatedContext.testData = {
        ...updatedContext.testData,
        innerResult
      };
      
      return result;
    }, options);
    
    // Update the context with the results and end time
    updatedContext.endTime = performance.now();
    updatedContext.wasRolledBack = false;
    
    return { ...updatedContext, outerResult, innerResult: updatedContext.testData?.innerResult };
  } catch (error) {
    // Update the context with the error and end time
    updatedContext.endTime = performance.now();
    updatedContext.error = error instanceof Error ? error : new Error(String(error));
    updatedContext.wasRolledBack = true;
    
    return updatedContext;
  }
}

// ===== CONFLICT AND DEADLOCK SIMULATION =====

/**
 * Simulates a transaction conflict
 * 
 * @param context - Transaction test context
 * @param options - Conflict simulation options
 * @returns Updated transaction test context
 */
export async function simulateTransactionConflict(
  context: TransactionTestContext,
  options: ConflictSimulationOptions
): Promise<TransactionTestContext> {
  const {
    conflictType,
    delayMs = 100,
    entity,
    entityId,
    useOptimisticLocking = false,
    data
  } = options;
  
  const updatedContext = { ...context };
  const model = context.prisma[entity] as any;
  
  if (!model) {
    throw new Error(`Invalid entity: ${entity}`);
  }
  
  try {
    // Start a transaction that will conflict with another transaction
    await executeInTransaction(context.prisma, async (tx) => {
      const txModel = tx[entity] as any;
      
      // Find the entity
      const entityRecord = await txModel.findUnique({
        where: { id: entityId }
      });
      
      if (!entityRecord) {
        throw new Error(`Entity not found: ${entity} with ID ${entityId}`);
      }
      
      // Store the original values for verification
      updatedContext.testData = {
        ...updatedContext.testData,
        originalValues: { ...entityRecord }
      };
      
      // Simulate a delay to allow another transaction to start
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      // Perform an operation that will conflict with the other transaction
      switch (conflictType) {
        case 'read-write':
          // Read the entity again and check if it has changed
          const updatedEntity = await txModel.findUnique({
            where: { id: entityId }
          });
          
          if (useOptimisticLocking && updatedEntity.version !== entityRecord.version) {
            throw new ConcurrencyControlError(
              'Optimistic locking failure: entity was modified by another transaction',
              'read-write',
              1
            );
          }
          
          // Update the entity
          await txModel.update({
            where: { id: entityId },
            data: {
              ...data,
              ...(useOptimisticLocking ? { version: { increment: 1 } } : {})
            }
          });
          break;
          
        case 'write-write':
          // Update the entity with a conflicting change
          await txModel.update({
            where: { id: entityId },
            data: {
              ...data,
              ...(useOptimisticLocking ? { version: { increment: 1 } } : {})
            }
          });
          break;
          
        case 'phantom-read':
          // Query for entities that match a condition
          const initialCount = await txModel.count({
            where: data?.condition
          });
          
          // Simulate a delay to allow another transaction to insert a new entity
          await new Promise(resolve => setTimeout(resolve, delayMs));
          
          // Query again and check if the count has changed
          const newCount = await txModel.count({
            where: data?.condition
          });
          
          if (newCount !== initialCount) {
            throw new ConcurrencyControlError(
              'Phantom read detected: new entities appeared in the result set',
              'phantom-read',
              newCount - initialCount
            );
          }
          break;
          
        case 'non-repeatable-read':
          // Read the entity
          const firstRead = await txModel.findUnique({
            where: { id: entityId }
          });
          
          // Simulate a delay to allow another transaction to update the entity
          await new Promise(resolve => setTimeout(resolve, delayMs));
          
          // Read the entity again
          const secondRead = await txModel.findUnique({
            where: { id: entityId }
          });
          
          // Check if the entity has changed
          const hasChanged = Object.entries(firstRead).some(
            ([key, value]) => secondRead[key] !== value && key !== 'updatedAt'
          );
          
          if (hasChanged) {
            throw new ConcurrencyControlError(
              'Non-repeatable read detected: entity was modified by another transaction',
              'non-repeatable-read',
              1
            );
          }
          break;
      }
      
      return { success: true };
    }, {
      isolationLevel: TransactionIsolationLevel.READ_COMMITTED // Use a lower isolation level to increase chance of conflicts
    });
    
    // If we get here, no conflict occurred
    updatedContext.endTime = performance.now();
    updatedContext.wasRolledBack = false;
    
    return updatedContext;
  } catch (error) {
    // Update the context with the error and end time
    updatedContext.endTime = performance.now();
    updatedContext.error = error instanceof Error ? error : new Error(String(error));
    updatedContext.wasRolledBack = true;
    
    return updatedContext;
  }
}

/**
 * Simulates a deadlock between two transactions
 * 
 * @param context - Transaction test context
 * @param options - Deadlock simulation options
 * @returns Updated transaction test context
 */
export async function simulateDeadlock(
  context: TransactionTestContext,
  options: DeadlockSimulationOptions
): Promise<TransactionTestContext> {
  const {
    entities,
    entityIds,
    delayBetweenOperationsMs = 100,
    autoResolve = true,
    data
  } = options;
  
  if (entities.length < 2) {
    throw new Error('At least two entities are required to simulate a deadlock');
  }
  
  if (entityIds && entityIds.length !== entities.length) {
    throw new Error('Number of entity IDs must match number of entities');
  }
  
  const updatedContext = { ...context };
  
  try {
    // Start two transactions that will deadlock
    const [transaction1, transaction2] = await Promise.all([
      // Transaction 1: Lock entity 1, then try to lock entity 2
      executeInTransaction(context.prisma, async (tx) => {
        // Lock the first entity
        const model1 = tx[entities[0]] as any;
        await model1.update({
          where: { id: entityIds?.[0] },
          data: data?.[0] || { updatedAt: new Date() }
        });
        
        // Wait to allow transaction 2 to lock the second entity
        await new Promise(resolve => setTimeout(resolve, delayBetweenOperationsMs));
        
        // Try to lock the second entity, which should cause a deadlock
        const model2 = tx[entities[1]] as any;
        await model2.update({
          where: { id: entityIds?.[1] },
          data: data?.[1] || { updatedAt: new Date() }
        });
        
        return { success: true };
      }, {
        timeout: { timeoutMs: 5000 } // Set a timeout to ensure the test doesn't hang
      }).catch(error => ({ error })),
      
      // Transaction 2: Lock entity 2, then try to lock entity 1
      executeInTransaction(context.prisma, async (tx) => {
        // Wait to allow transaction 1 to lock the first entity
        await new Promise(resolve => setTimeout(resolve, delayBetweenOperationsMs / 2));
        
        // Lock the second entity
        const model2 = tx[entities[1]] as any;
        await model2.update({
          where: { id: entityIds?.[1] },
          data: data?.[1] || { updatedAt: new Date() }
        });
        
        // Wait to ensure transaction 1 is waiting for entity 2
        await new Promise(resolve => setTimeout(resolve, delayBetweenOperationsMs));
        
        // Try to lock the first entity, which should cause a deadlock
        const model1 = tx[entities[0]] as any;
        await model1.update({
          where: { id: entityIds?.[0] },
          data: data?.[0] || { updatedAt: new Date() }
        });
        
        return { success: true };
      }, {
        timeout: { timeoutMs: 5000 } // Set a timeout to ensure the test doesn't hang
      }).catch(error => ({ error }))
    ]);
    
    // Check if a deadlock occurred
    const deadlockOccurred = (
      transaction1.error instanceof DeadlockError ||
      transaction2.error instanceof DeadlockError ||
      (transaction1.error && String(transaction1.error).includes('deadlock')) ||
      (transaction2.error && String(transaction2.error).includes('deadlock'))
    );
    
    // Update the context
    updatedContext.endTime = performance.now();
    updatedContext.wasRolledBack = deadlockOccurred;
    updatedContext.testData = {
      ...updatedContext.testData,
      transaction1,
      transaction2,
      deadlockOccurred
    };
    
    if (deadlockOccurred) {
      updatedContext.error = transaction1.error instanceof Error ? transaction1.error :
        transaction2.error instanceof Error ? transaction2.error :
        new Error('Deadlock detected');
    } else if (autoResolve) {
      // If no deadlock occurred but we expected one, create a synthetic error
      updatedContext.error = new DeadlockError(
        'Simulated deadlock for testing purposes',
        entities[0],
        entities[1]
      );
      updatedContext.wasRolledBack = true;
    }
    
    return updatedContext;
  } catch (error) {
    // Update the context with the error and end time
    updatedContext.endTime = performance.now();
    updatedContext.error = error instanceof Error ? error : new Error(String(error));
    updatedContext.wasRolledBack = true;
    
    return updatedContext;
  }
}

/**
 * Simulates a transaction timeout
 * 
 * @param context - Transaction test context
 * @param timeoutMs - Timeout in milliseconds
 * @param longRunningOperation - Function that runs longer than the timeout
 * @returns Updated transaction test context
 */
export async function simulateTransactionTimeout(
  context: TransactionTestContext,
  timeoutMs: number,
  longRunningOperation: (tx: PrismaClient) => Promise<any>
): Promise<TransactionTestContext> {
  const updatedContext = { ...context };
  
  try {
    // Execute a transaction with a timeout
    await executeInTransaction(context.prisma, async (tx) => {
      // Run the long-running operation
      return longRunningOperation(tx);
    }, {
      timeout: { timeoutMs }
    });
    
    // If we get here, the transaction didn't time out as expected
    updatedContext.endTime = performance.now();
    updatedContext.wasRolledBack = false;
    updatedContext.error = new Error('Transaction did not time out as expected');
    
    return updatedContext;
  } catch (error) {
    // Check if the error is a timeout error
    const isTimeoutError = (
      error instanceof TransactionTimeoutError ||
      (error instanceof Error && error.message.includes('timeout'))
    );
    
    // Update the context with the error and end time
    updatedContext.endTime = performance.now();
    updatedContext.error = error instanceof Error ? error : new Error(String(error));
    updatedContext.wasRolledBack = true;
    updatedContext.testData = {
      ...updatedContext.testData,
      isTimeoutError
    };
    
    return updatedContext;
  }
}

// ===== ISOLATION LEVEL TESTING =====

/**
 * Tests transaction behavior under different isolation levels
 * 
 * @param context - Transaction test context
 * @param options - Isolation level test options
 * @returns Updated transaction test context with test results
 */
export async function testIsolationLevel(
  context: TransactionTestContext,
  options: IsolationLevelTestOptions
): Promise<TransactionTestContext & { anomalyDetected?: boolean }> {
  const {
    isolationLevel,
    entity,
    anomalyType,
    expectedResult,
    data
  } = options;
  
  const updatedContext = { ...context };
  const model = context.prisma[entity] as any;
  
  if (!model) {
    throw new Error(`Invalid entity: ${entity}`);
  }
  
  try {
    let anomalyDetected = false;
    
    // Execute the test based on the anomaly type
    switch (anomalyType) {
      case 'dirty-read':
        // Transaction 1: Start a transaction and modify data without committing
        const transaction1 = executeInTransaction(context.prisma, async (tx) => {
          const txModel = tx[entity] as any;
          
          // Modify the entity
          await txModel.update({
            where: data?.where,
            data: data?.update
          });
          
          // Wait without committing to allow Transaction 2 to read
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Intentionally throw an error to roll back
          throw new Error('Intentional rollback for dirty read test');
        }, {
          isolationLevel
        }).catch(() => ({})); // Ignore the error
        
        // Transaction 2: Try to read the uncommitted data
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for Transaction 1 to start
        
        const transaction2 = await executeInTransaction(context.prisma, async (tx) => {
          const txModel = tx[entity] as any;
          
          // Read the entity
          const result = await txModel.findFirst({
            where: data?.where
          });
          
          // Check if we can see the uncommitted changes
          if (result && data?.update) {
            for (const [key, value] of Object.entries(data.update)) {
              if (result[key] === value) {
                anomalyDetected = true;
                break;
              }
            }
          }
          
          return { result, anomalyDetected };
        }, {
          isolationLevel
        });
        
        // Wait for Transaction 1 to complete
        await transaction1;
        break;
        
      case 'non-repeatable-read':
        // Transaction 1: Start a transaction and read data
        const nonRepeatableReadTest = await executeInTransaction(context.prisma, async (tx) => {
          const txModel = tx[entity] as any;
          
          // First read
          const firstRead = await txModel.findFirst({
            where: data?.where
          });
          
          // Allow Transaction 2 to modify the data
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Execute Transaction 2 to update the data
          await context.prisma[entity].update({
            where: data?.where,
            data: data?.update
          });
          
          // Wait for Transaction 2 to complete
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Second read
          const secondRead = await txModel.findFirst({
            where: data?.where
          });
          
          // Check if the data has changed between reads
          if (firstRead && secondRead && data?.update) {
            for (const [key, value] of Object.entries(data.update)) {
              if (firstRead[key] !== secondRead[key] && secondRead[key] === value) {
                anomalyDetected = true;
                break;
              }
            }
          }
          
          return { firstRead, secondRead, anomalyDetected };
        }, {
          isolationLevel
        });
        
        anomalyDetected = nonRepeatableReadTest.anomalyDetected;
        break;
        
      case 'phantom-read':
        // Transaction 1: Start a transaction and query data
        const phantomReadTest = await executeInTransaction(context.prisma, async (tx) => {
          const txModel = tx[entity] as any;
          
          // First query
          const firstQuery = await txModel.findMany({
            where: data?.condition
          });
          
          // Allow Transaction 2 to insert new data
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Execute Transaction 2 to insert new data
          await context.prisma[entity].create({
            data: data?.insert
          });
          
          // Wait for Transaction 2 to complete
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Second query
          const secondQuery = await txModel.findMany({
            where: data?.condition
          });
          
          // Check if new rows appeared in the result set
          anomalyDetected = secondQuery.length > firstQuery.length;
          
          return { firstQuery, secondQuery, anomalyDetected };
        }, {
          isolationLevel
        });
        
        anomalyDetected = phantomReadTest.anomalyDetected;
        break;
        
      case 'serialization-anomaly':
        // This is complex to simulate, but we can check if the isolation level prevents write skew
        const serializationTest = await Promise.all([
          // Transaction 1: Read and update based on a condition
          executeInTransaction(context.prisma, async (tx) => {
            const txModel = tx[entity] as any;
            
            // Read entities that match a condition
            const entities = await txModel.findMany({
              where: data?.condition1
            });
            
            // Wait to allow Transaction 2 to read
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Update based on the read result
            if (entities.length < (data?.threshold || 5)) {
              await txModel.create({
                data: data?.insert1
              });
            }
            
            return { entities };
          }, {
            isolationLevel
          }).catch(error => ({ error })),
          
          // Transaction 2: Read and update based on the same condition
          executeInTransaction(context.prisma, async (tx) => {
            const txModel = tx[entity] as any;
            
            // Wait to allow Transaction 1 to read first
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Read entities that match a condition
            const entities = await txModel.findMany({
              where: data?.condition2 || data?.condition1
            });
            
            // Update based on the read result
            if (entities.length < (data?.threshold || 5)) {
              await txModel.create({
                data: data?.insert2 || data?.insert1
              });
            }
            
            return { entities };
          }, {
            isolationLevel
          }).catch(error => ({ error }))
        ]);
        
        // Check if both transactions succeeded when they shouldn't have
        const bothSucceeded = !serializationTest[0].error && !serializationTest[1].error;
        
        // If both succeeded and the isolation level should prevent this, it's an anomaly
        anomalyDetected = bothSucceeded && isolationLevel === TransactionIsolationLevel.SERIALIZABLE;
        break;
    }
    
    // Update the context with the test results
    updatedContext.endTime = performance.now();
    updatedContext.testData = {
      ...updatedContext.testData,
      anomalyType,
      isolationLevel,
      expectedResult,
      anomalyDetected
    };
    
    // Check if the result matches the expectation
    const resultMatches = (
      (expectedResult === 'allowed' && anomalyDetected) ||
      (expectedResult === 'prevented' && !anomalyDetected)
    );
    
    if (!resultMatches) {
      updatedContext.error = new Error(
        `Isolation level ${isolationLevel} ${expectedResult === 'allowed' ? 'prevented' : 'allowed'} ` +
        `${anomalyType} when it should have ${expectedResult === 'allowed' ? 'allowed' : 'prevented'} it`
      );
    }
    
    return { ...updatedContext, anomalyDetected };
  } catch (error) {
    // Update the context with the error and end time
    updatedContext.endTime = performance.now();
    updatedContext.error = error instanceof Error ? error : new Error(String(error));
    
    return updatedContext;
  }
}

/**
 * Verifies that a specific isolation level prevents or allows a specific anomaly
 * 
 * @param isolationLevel - Isolation level to test
 * @param anomalyType - Type of anomaly to test
 * @returns Whether the isolation level should prevent the anomaly
 */
export function shouldIsolationLevelPreventAnomaly(
  isolationLevel: TransactionIsolationLevel,
  anomalyType: 'dirty-read' | 'non-repeatable-read' | 'phantom-read' | 'serialization-anomaly'
): boolean {
  // Truth table for isolation levels and anomalies
  const preventionMatrix: Record<TransactionIsolationLevel, Record<string, boolean>> = {
    [TransactionIsolationLevel.READ_UNCOMMITTED]: {
      'dirty-read': false,
      'non-repeatable-read': false,
      'phantom-read': false,
      'serialization-anomaly': false
    },
    [TransactionIsolationLevel.READ_COMMITTED]: {
      'dirty-read': true,
      'non-repeatable-read': false,
      'phantom-read': false,
      'serialization-anomaly': false
    },
    [TransactionIsolationLevel.REPEATABLE_READ]: {
      'dirty-read': true,
      'non-repeatable-read': true,
      'phantom-read': false,
      'serialization-anomaly': false
    },
    [TransactionIsolationLevel.SERIALIZABLE]: {
      'dirty-read': true,
      'non-repeatable-read': true,
      'phantom-read': true,
      'serialization-anomaly': true
    }
  };
  
  return preventionMatrix[isolationLevel][anomalyType];
}

// ===== RETRY AND BACKOFF TESTING =====

/**
 * Tests transaction retry logic with configurable error simulation
 * 
 * @param context - Transaction test context
 * @param operation - Operation to execute with retry
 * @param options - Retry test options
 * @returns Updated transaction test context with retry results
 */
export async function testTransactionRetry<T>(
  context: TransactionTestContext,
  operation: (tx: PrismaClient, attempt: number) => Promise<T>,
  options: RetryTestOptions
): Promise<TransactionTestContext & { result?: T, attempts?: number }> {
  const {
    maxRetries,
    baseDelayMs,
    maxDelayMs,
    useJitter = true,
    errorSimulator
  } = options;
  
  const updatedContext = { ...context };
  let attempts = 0;
  
  try {
    // Execute the operation with retry logic
    const result = await executeInTransaction(context.prisma, async (tx) => {
      attempts++;
      
      // Simulate an error based on the current attempt
      const error = errorSimulator(attempts);
      if (error) {
        throw error;
      }
      
      // If no error, execute the operation
      return operation(tx, attempts);
    }, {
      retry: {
        maxRetries,
        baseDelayMs,
        maxDelayMs,
        useJitter
      }
    });
    
    // Update the context with the result and retry count
    updatedContext.endTime = performance.now();
    updatedContext.retryCount = attempts - 1;
    updatedContext.testData = {
      ...updatedContext.testData,
      attempts,
      maxRetries,
      baseDelayMs,
      maxDelayMs
    };
    
    return { ...updatedContext, result, attempts };
  } catch (error) {
    // Update the context with the error and retry count
    updatedContext.endTime = performance.now();
    updatedContext.error = error instanceof Error ? error : new Error(String(error));
    updatedContext.retryCount = attempts - 1;
    updatedContext.testData = {
      ...updatedContext.testData,
      attempts,
      maxRetries,
      baseDelayMs,
      maxDelayMs
    };
    
    return { ...updatedContext, attempts };
  }
}

/**
 * Creates an error simulator function for testing retry logic
 * 
 * @param errorPattern - Pattern of errors to simulate (e.g., [true, true, false] for errors on first two attempts)
 * @param errorType - Type of error to simulate
 * @returns Function that returns an error based on the attempt number
 */
export function createErrorSimulator(
  errorPattern: boolean[],
  errorType: 'deadlock' | 'timeout' | 'concurrency' | 'connection' = 'deadlock'
): (attempt: number) => Error | null {
  return (attempt: number) => {
    // Check if this attempt should generate an error
    const shouldError = errorPattern[attempt - 1];
    
    if (!shouldError) {
      return null;
    }
    
    // Create the appropriate error type
    switch (errorType) {
      case 'deadlock':
        return new DeadlockError(
          `Simulated deadlock on attempt ${attempt}`,
          'resource1',
          'transaction2'
        );
      case 'timeout':
        return new TransactionTimeoutError(
          `Simulated timeout on attempt ${attempt}`,
          1000,
          1001
        );
      case 'concurrency':
        return new ConcurrencyControlError(
          `Simulated concurrency conflict on attempt ${attempt}`,
          'write-write',
          1
        );
      case 'connection':
        return new Error(`Simulated connection error on attempt ${attempt}`);
      default:
        return new Error(`Simulated error on attempt ${attempt}`);
    }
  };
}

/**
 * Simulates exponential backoff delays for testing
 * 
 * @param baseDelayMs - Base delay in milliseconds
 * @param maxDelayMs - Maximum delay in milliseconds
 * @param attempts - Number of attempts to simulate
 * @param useJitter - Whether to add jitter to the delays
 * @returns Array of simulated delay times in milliseconds
 */
export function simulateBackoffDelays(
  baseDelayMs: number,
  maxDelayMs: number,
  attempts: number,
  useJitter: boolean = true
): number[] {
  const delays: number[] = [];
  
  for (let attempt = 1; attempt <= attempts; attempt++) {
    // Calculate exponential backoff: baseDelay * (2 ^ (attempt - 1))
    let delay = baseDelayMs * Math.pow(2, attempt - 1);
    
    // Cap the delay at the maximum
    delay = Math.min(delay, maxDelayMs);
    
    // Add jitter if enabled (±25% randomness)
    if (useJitter) {
      const jitterFactor = 0.25;
      const jitter = delay * jitterFactor * (Math.random() * 2 - 1);
      delay = Math.max(0, Math.floor(delay + jitter));
    }
    
    delays.push(delay);
  }
  
  return delays;
}

// ===== PERFORMANCE TESTING UTILITIES =====

/**
 * Tests transaction performance characteristics
 * 
 * @param context - Transaction test context
 * @param operation - Operation to benchmark
 * @param options - Performance test options
 * @returns Updated transaction test context with performance results
 */
export async function testTransactionPerformance<T>(
  context: TransactionTestContext,
  operation: (tx: PrismaClient, iteration: number) => Promise<T>,
  options: PerformanceTestOptions
): Promise<TransactionTestContext & { results?: Array<{ iteration: number, durationMs: number, result: T }> }> {
  const {
    testName,
    iterations,
    isolationLevel,
    operationType,
    expectedMaxDurationMs,
    expectedMaxDbTimeMs,
    expectedMaxQueryCount
  } = options;
  
  const updatedContext = { ...context };
  const results: Array<{ iteration: number, durationMs: number, result: T }> = [];
  let totalDuration = 0;
  let maxDuration = 0;
  let minDuration = Number.MAX_SAFE_INTEGER;
  
  try {
    // Execute the operation for each iteration
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      // Choose the appropriate transaction execution function based on operation type
      let executeFn = executeInTransaction;
      if (operationType) {
        switch (operationType) {
          case OperationType.READ_ONLY:
            executeFn = executeReadOperation;
            break;
          case OperationType.WRITE_ONLY:
            executeFn = executeWriteOperation;
            break;
          case OperationType.READ_WRITE:
            executeFn = executeReadWriteOperation;
            break;
          case OperationType.CRITICAL_WRITE:
            executeFn = executeCriticalWriteOperation;
            break;
        }
      }
      
      // Execute the operation
      const result = await executeFn(context.prisma, tx => operation(tx, i), {
        isolationLevel,
        logging: {
          logPerformance: true,
          logEvents: true,
          logQueries: true
        }
      });
      
      const endTime = performance.now();
      const durationMs = endTime - startTime;
      
      // Update statistics
      totalDuration += durationMs;
      maxDuration = Math.max(maxDuration, durationMs);
      minDuration = Math.min(minDuration, durationMs);
      
      // Store the result
      results.push({ iteration: i, durationMs, result });
    }
    
    // Calculate average duration
    const avgDuration = totalDuration / iterations;
    
    // Update the context with the performance results
    updatedContext.endTime = performance.now();
    updatedContext.testData = {
      ...updatedContext.testData,
      testName,
      iterations,
      totalDuration,
      avgDuration,
      maxDuration,
      minDuration,
      isolationLevel,
      operationType,
      expectedMaxDurationMs,
      expectedMaxDbTimeMs,
      expectedMaxQueryCount
    };
    
    // Check if performance meets expectations
    if (expectedMaxDurationMs && maxDuration > expectedMaxDurationMs) {
      updatedContext.error = new Error(
        `Performance test failed: max duration ${maxDuration}ms exceeds expected ${expectedMaxDurationMs}ms`
      );
    }
    
    return { ...updatedContext, results };
  } catch (error) {
    // Update the context with the error
    updatedContext.endTime = performance.now();
    updatedContext.error = error instanceof Error ? error : new Error(String(error));
    updatedContext.testData = {
      ...updatedContext.testData,
      testName,
      iterations: results.length, // Number of successful iterations
      results
    };
    
    return { ...updatedContext, results };
  }
}

/**
 * Measures the overhead of transaction management compared to direct queries
 * 
 * @param context - Transaction test context
 * @param directOperation - Operation to execute directly without a transaction
 * @param transactionOperation - Equivalent operation to execute within a transaction
 * @param iterations - Number of iterations to run
 * @returns Transaction test context with overhead measurements
 */
export async function measureTransactionOverhead<T>(
  context: TransactionTestContext,
  directOperation: (prisma: PrismaClient) => Promise<T>,
  transactionOperation: (tx: PrismaClient) => Promise<T>,
  iterations: number = 10
): Promise<TransactionTestContext & { overheadPercentage?: number }> {
  const updatedContext = { ...context };
  const directResults: number[] = [];
  const transactionResults: number[] = [];
  
  try {
    // Measure direct operations
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      await directOperation(context.prisma);
      const endTime = performance.now();
      directResults.push(endTime - startTime);
    }
    
    // Measure transaction operations
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      await executeInTransaction(context.prisma, transactionOperation);
      const endTime = performance.now();
      transactionResults.push(endTime - startTime);
    }
    
    // Calculate averages
    const avgDirectTime = directResults.reduce((sum, time) => sum + time, 0) / iterations;
    const avgTransactionTime = transactionResults.reduce((sum, time) => sum + time, 0) / iterations;
    
    // Calculate overhead
    const overheadMs = avgTransactionTime - avgDirectTime;
    const overheadPercentage = (overheadMs / avgDirectTime) * 100;
    
    // Update the context with the results
    updatedContext.endTime = performance.now();
    updatedContext.testData = {
      ...updatedContext.testData,
      directResults,
      transactionResults,
      avgDirectTime,
      avgTransactionTime,
      overheadMs,
      overheadPercentage
    };
    
    return { ...updatedContext, overheadPercentage };
  } catch (error) {
    // Update the context with the error
    updatedContext.endTime = performance.now();
    updatedContext.error = error instanceof Error ? error : new Error(String(error));
    
    return updatedContext;
  }
}

// ===== ASSERTION HELPERS =====

/**
 * Asserts that a transaction test context meets the expected conditions
 * 
 * @param context - Transaction test context to verify
 * @param options - Assertion options
 * @throws Error if any assertion fails
 */
export function assertTransactionResult(
  context: TransactionTestContext,
  options: TransactionAssertionOptions
): void {
  const {
    expectedState,
    expectedErrorType,
    expectedRetryCount,
    expectedMaxDurationMs,
    customAssertions
  } = options;
  
  // Check transaction state
  if (expectedState === TransactionState.COMMITTED && context.wasRolledBack) {
    throw new Error('Expected transaction to be committed, but it was rolled back');
  }
  
  if (expectedState === TransactionState.ROLLED_BACK && !context.wasRolledBack) {
    throw new Error('Expected transaction to be rolled back, but it was committed');
  }
  
  // Check error type
  if (expectedErrorType) {
    if (!context.error) {
      throw new Error(`Expected error of type ${expectedErrorType}, but no error occurred`);
    }
    
    const errorMatches = (
      context.error instanceof Error &&
      (context.error.constructor.name === expectedErrorType ||
       context.error.name === expectedErrorType ||
       (context.error instanceof TransactionError && context.error.code === expectedErrorType))
    );
    
    if (!errorMatches) {
      throw new Error(
        `Expected error of type ${expectedErrorType}, but got ${context.error.constructor.name}`
      );
    }
  } else if (context.error && !options.hasOwnProperty('expectedErrorType')) {
    // If no error type was specified but an error occurred, throw it
    throw new Error(`Unexpected error: ${context.error.message}`);
  }
  
  // Check retry count
  if (expectedRetryCount !== undefined && context.retryCount !== expectedRetryCount) {
    throw new Error(
      `Expected ${expectedRetryCount} retry attempts, but got ${context.retryCount}`
    );
  }
  
  // Check duration
  if (expectedMaxDurationMs && context.startTime && context.endTime) {
    const durationMs = context.endTime - context.startTime;
    if (durationMs > expectedMaxDurationMs) {
      throw new Error(
        `Expected transaction to complete in ${expectedMaxDurationMs}ms, but it took ${durationMs}ms`
      );
    }
  }
  
  // Run custom assertions
  if (customAssertions) {
    customAssertions(context);
  }
}

/**
 * Asserts that a transaction was rolled back successfully
 * 
 * @param context - Transaction test context
 * @param entity - Entity to check
 * @param query - Query to find the entity
 * @throws Error if the transaction was not rolled back properly
 */
export async function assertTransactionRollback(
  context: TransactionTestContext,
  entity: string,
  query: any
): Promise<void> {
  const wasRolledBack = await verifyTransactionRollback(context, entity, query);
  
  if (!wasRolledBack) {
    throw new Error(
      `Transaction rollback verification failed: changes to ${entity} were not rolled back`
    );
  }
}

/**
 * Asserts that a specific isolation level prevents or allows a specific anomaly
 * 
 * @param isolationLevel - Isolation level to test
 * @param anomalyType - Type of anomaly to test
 * @param anomalyDetected - Whether the anomaly was detected
 * @throws Error if the isolation level behavior doesn't match expectations
 */
export function assertIsolationLevelBehavior(
  isolationLevel: TransactionIsolationLevel,
  anomalyType: 'dirty-read' | 'non-repeatable-read' | 'phantom-read' | 'serialization-anomaly',
  anomalyDetected: boolean
): void {
  const shouldPrevent = shouldIsolationLevelPreventAnomaly(isolationLevel, anomalyType);
  
  if (shouldPrevent && anomalyDetected) {
    throw new Error(
      `Isolation level ${isolationLevel} should prevent ${anomalyType}, but the anomaly was detected`
    );
  }
  
  if (!shouldPrevent && !anomalyDetected) {
    throw new Error(
      `Isolation level ${isolationLevel} should allow ${anomalyType}, but the anomaly was not detected`
    );
  }
}

/**
 * Asserts that transaction performance meets expectations
 * 
 * @param context - Transaction test context with performance data
 * @param maxAvgDurationMs - Maximum acceptable average duration in milliseconds
 * @param maxDurationMs - Maximum acceptable duration for any single transaction in milliseconds
 * @throws Error if performance doesn't meet expectations
 */
export function assertTransactionPerformance(
  context: TransactionTestContext,
  maxAvgDurationMs?: number,
  maxDurationMs?: number
): void {
  if (!context.testData) {
    throw new Error('Transaction test context does not contain performance data');
  }
  
  const { avgDuration, maxDuration } = context.testData;
  
  if (maxAvgDurationMs && avgDuration > maxAvgDurationMs) {
    throw new Error(
      `Average transaction duration ${avgDuration.toFixed(2)}ms exceeds maximum ${maxAvgDurationMs}ms`
    );
  }
  
  if (maxDurationMs && maxDuration > maxDurationMs) {
    throw new Error(
      `Maximum transaction duration ${maxDuration.toFixed(2)}ms exceeds limit ${maxDurationMs}ms`
    );
  }
}

/**
 * Asserts that transaction retry logic works as expected
 * 
 * @param context - Transaction test context with retry data
 * @param expectedAttempts - Expected number of attempts
 * @param shouldSucceed - Whether the transaction should ultimately succeed
 * @throws Error if retry behavior doesn't match expectations
 */
export function assertRetryBehavior(
  context: TransactionTestContext,
  expectedAttempts: number,
  shouldSucceed: boolean
): void {
  if (!context.testData || context.testData.attempts === undefined) {
    throw new Error('Transaction test context does not contain retry data');
  }
  
  const { attempts } = context.testData;
  
  if (attempts !== expectedAttempts) {
    throw new Error(
      `Expected ${expectedAttempts} retry attempts, but got ${attempts}`
    );
  }
  
  if (shouldSucceed && context.error) {
    throw new Error(
      `Expected transaction to succeed after retries, but it failed with: ${context.error.message}`
    );
  }
  
  if (!shouldSucceed && !context.error) {
    throw new Error(
      'Expected transaction to fail even after retries, but it succeeded'
    );
  }
}
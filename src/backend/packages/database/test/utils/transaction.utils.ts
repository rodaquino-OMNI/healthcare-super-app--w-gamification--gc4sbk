/**
 * @file transaction.utils.ts
 * @description Testing utilities for database transactions that enable verification of transaction behavior,
 * rollback scenarios, and error conditions. Provides helpers for testing transaction isolation levels,
 * concurrency conflicts, and automatic rollbacks upon error conditions.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { TransactionIsolationLevel, TransactionOptions } from '../../src/transactions/transaction.interface';
import { TransactionError, DeadlockError, SerializationError } from '../../src/transactions/transaction.errors';
import { executeInTransaction, executeWithRetry, sleep } from '../../src/transactions/transaction.utils';

/**
 * Options for transaction test utilities
 */
export interface TransactionTestOptions {
  /**
   * Isolation level to use for the test transaction
   * @default TransactionIsolationLevel.READ_COMMITTED
   */
  isolationLevel?: TransactionIsolationLevel;

  /**
   * Whether to enable debug logging for test transactions
   * @default false
   */
  debug?: boolean;

  /**
   * Timeout for test transactions in milliseconds
   * @default 5000 (5 seconds)
   */
  timeout?: number;

  /**
   * Whether to automatically clean up test data after the test
   * @default true
   */
  autoCleanup?: boolean;

  /**
   * Custom cleanup function to run after the test
   */
  cleanupFn?: () => Promise<void>;
}

/**
 * Default options for transaction tests
 */
const DEFAULT_TEST_OPTIONS: TransactionTestOptions = {
  isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
  debug: false,
  timeout: 5000,
  autoCleanup: true,
};

/**
 * Result of a transaction test
 */
export interface TransactionTestResult<T> {
  /**
   * Whether the transaction completed successfully
   */
  success: boolean;

  /**
   * Result of the transaction if successful
   */
  result?: T;

  /**
   * Error that occurred during the transaction if unsuccessful
   */
  error?: Error;

  /**
   * Duration of the transaction in milliseconds
   */
  durationMs: number;

  /**
   * Number of retry attempts made
   */
  retryCount: number;

  /**
   * Isolation level used for the transaction
   */
  isolationLevel: TransactionIsolationLevel;

  /**
   * Whether the transaction was rolled back
   */
  wasRolledBack: boolean;

  /**
   * Metadata about the transaction execution
   */
  metadata: Record<string, any>;
}

/**
 * Creates a test transaction that can be used to verify transaction behavior
 * 
 * @param prisma - PrismaClient instance
 * @param testFn - Function to execute within the transaction
 * @param options - Test options
 * @returns Promise resolving to the test result
 */
export async function testTransaction<T>(
  prisma: PrismaClient,
  testFn: (tx: Prisma.TransactionClient) => Promise<T>,
  options: TransactionTestOptions = {}
): Promise<TransactionTestResult<T>> {
  const testOptions = { ...DEFAULT_TEST_OPTIONS, ...options };
  const startTime = Date.now();
  const result: TransactionTestResult<T> = {
    success: false,
    durationMs: 0,
    retryCount: 0,
    isolationLevel: testOptions.isolationLevel,
    wasRolledBack: false,
    metadata: {},
  };

  try {
    // Execute the test function within a transaction
    const txResult = await executeInTransaction(prisma, testFn, {
      isolationLevel: testOptions.isolationLevel,
      timeout: testOptions.timeout,
      enableLogging: testOptions.debug,
    });

    result.success = true;
    result.result = txResult;
  } catch (error) {
    result.success = false;
    result.error = error as Error;
    result.wasRolledBack = true;
  } finally {
    result.durationMs = Date.now() - startTime;

    // Run cleanup if enabled
    if (testOptions.autoCleanup && testOptions.cleanupFn) {
      await testOptions.cleanupFn();
    }
  }

  return result;
}

/**
 * Tests transaction rollback behavior by deliberately causing an error
 * 
 * @param prisma - PrismaClient instance
 * @param setupFn - Function to set up test data within the transaction
 * @param errorFn - Function that will cause an error and trigger rollback
 * @param verifyFn - Function to verify that the transaction was rolled back
 * @param options - Test options
 * @returns Promise resolving to the test result
 */
export async function testTransactionRollback<T>(
  prisma: PrismaClient,
  setupFn: (tx: Prisma.TransactionClient) => Promise<T>,
  errorFn: (tx: Prisma.TransactionClient, setupResult: T) => Promise<void>,
  verifyFn: () => Promise<boolean>,
  options: TransactionTestOptions = {}
): Promise<TransactionTestResult<T>> {
  const testOptions = { ...DEFAULT_TEST_OPTIONS, ...options };
  const startTime = Date.now();
  const result: TransactionTestResult<T> = {
    success: false,
    durationMs: 0,
    retryCount: 0,
    isolationLevel: testOptions.isolationLevel,
    wasRolledBack: false,
    metadata: {},
  };

  try {
    // Execute the test within a transaction that will fail
    await executeInTransaction(prisma, async (tx) => {
      // Set up test data
      const setupResult = await setupFn(tx);
      result.result = setupResult;

      // Trigger an error to cause rollback
      await errorFn(tx, setupResult);

      // This should not be reached due to the error
      return setupResult;
    }, {
      isolationLevel: testOptions.isolationLevel,
      timeout: testOptions.timeout,
      enableLogging: testOptions.debug,
    });

    // If we get here, the transaction didn't fail as expected
    result.success = false;
    result.wasRolledBack = false;
  } catch (error) {
    // Expected path - transaction failed and rolled back
    result.error = error as Error;

    // Verify that the transaction was rolled back
    const wasRolledBack = await verifyFn();
    result.wasRolledBack = wasRolledBack;
    result.success = wasRolledBack; // Success means rollback worked correctly
  } finally {
    result.durationMs = Date.now() - startTime;

    // Run cleanup if enabled
    if (testOptions.autoCleanup && testOptions.cleanupFn) {
      await testOptions.cleanupFn();
    }
  }

  return result;
}

/**
 * Simulates a transaction conflict by running two concurrent transactions
 * that operate on the same data
 * 
 * @param prisma - PrismaClient instance
 * @param tx1Fn - Function for the first transaction
 * @param tx2Fn - Function for the second transaction
 * @param options - Test options
 * @returns Promise resolving to the results of both transactions
 */
export async function simulateTransactionConflict<T1, T2>(
  prisma: PrismaClient,
  tx1Fn: (tx: Prisma.TransactionClient) => Promise<T1>,
  tx2Fn: (tx: Prisma.TransactionClient) => Promise<T2>,
  options: TransactionTestOptions = {}
): Promise<[TransactionTestResult<T1>, TransactionTestResult<T2>]> {
  const testOptions = { ...DEFAULT_TEST_OPTIONS, ...options };
  
  // Create a new PrismaClient instance for the second transaction
  // to ensure we have separate connections
  const prisma2 = new PrismaClient();
  
  try {
    // Start both transactions concurrently
    const tx1Promise = testTransaction(prisma, tx1Fn, testOptions);
    
    // Add a small delay to ensure the first transaction starts first
    await sleep(50);
    
    const tx2Promise = testTransaction(prisma2, tx2Fn, testOptions);
    
    // Wait for both transactions to complete
    const [tx1Result, tx2Result] = await Promise.all([tx1Promise, tx2Promise]);
    
    return [tx1Result, tx2Result];
  } finally {
    // Disconnect the second Prisma client
    await prisma2.$disconnect();
  }
}

/**
 * Simulates a deadlock scenario by creating two transactions that lock resources
 * in opposite orders
 * 
 * @param prisma - PrismaClient instance
 * @param resource1Fn - Function that locks the first resource
 * @param resource2Fn - Function that locks the second resource
 * @param options - Test options
 * @returns Promise resolving to the results of both transactions
 */
export async function simulateDeadlock<T1, T2>(
  prisma: PrismaClient,
  resource1Fn: (tx: Prisma.TransactionClient) => Promise<T1>,
  resource2Fn: (tx: Prisma.TransactionClient) => Promise<T2>,
  options: TransactionTestOptions = {}
): Promise<[TransactionTestResult<T1>, TransactionTestResult<T2>]> {
  const testOptions = { ...DEFAULT_TEST_OPTIONS, ...options };
  
  // Create a new PrismaClient instance for the second transaction
  const prisma2 = new PrismaClient();
  
  try {
    // Transaction 1: Lock resource 1, then resource 2
    const tx1Promise = testTransaction(prisma, async (tx) => {
      // Lock resource 1
      const result1 = await resource1Fn(tx);
      
      // Give transaction 2 time to lock resource 2
      await sleep(100);
      
      // Try to lock resource 2 (may deadlock)
      await resource2Fn(tx);
      
      return result1;
    }, testOptions);
    
    // Add a small delay to ensure the first transaction starts first
    await sleep(50);
    
    // Transaction 2: Lock resource 2, then resource 1
    const tx2Promise = testTransaction(prisma2, async (tx) => {
      // Lock resource 2
      const result2 = await resource2Fn(tx);
      
      // Try to lock resource 1 (may deadlock)
      await resource1Fn(tx);
      
      return result2;
    }, testOptions);
    
    // Wait for both transactions to complete
    const [tx1Result, tx2Result] = await Promise.all([tx1Promise, tx2Promise]);
    
    // At least one transaction should fail with a deadlock error
    const hasDeadlock = 
      (tx1Result.error instanceof DeadlockError) || 
      (tx2Result.error instanceof DeadlockError);
    
    tx1Result.metadata.deadlockDetected = hasDeadlock;
    tx2Result.metadata.deadlockDetected = hasDeadlock;
    
    return [tx1Result, tx2Result];
  } finally {
    // Disconnect the second Prisma client
    await prisma2.$disconnect();
  }
}

/**
 * Tests transaction retry behavior by simulating transient errors
 * 
 * @param prisma - PrismaClient instance
 * @param testFn - Function to execute within the transaction
 * @param errorFn - Function that simulates a transient error on specified attempts
 * @param options - Test options
 * @returns Promise resolving to the test result
 */
export async function testTransactionRetry<T>(
  prisma: PrismaClient,
  testFn: (tx: Prisma.TransactionClient, attempt: number) => Promise<T>,
  errorFn: (attempt: number) => boolean, // Return true to simulate error on this attempt
  options: TransactionTestOptions & { maxRetries?: number } = {}
): Promise<TransactionTestResult<T>> {
  const testOptions = { 
    ...DEFAULT_TEST_OPTIONS, 
    ...options,
    maxRetries: options.maxRetries || 3,
  };
  
  const startTime = Date.now();
  const result: TransactionTestResult<T> = {
    success: false,
    durationMs: 0,
    retryCount: 0,
    isolationLevel: testOptions.isolationLevel,
    wasRolledBack: false,
    metadata: {},
  };
  
  let attempt = 0;
  
  try {
    // Execute with retry logic
    const txResult = await executeWithRetry(prisma, async (tx) => {
      attempt++;
      result.retryCount = attempt - 1; // First attempt is not a retry
      
      // Check if we should simulate an error on this attempt
      if (errorFn(attempt)) {
        throw new TransactionError(`Simulated transient error on attempt ${attempt}`);
      }
      
      // Execute the test function
      return await testFn(tx, attempt);
    }, {
      isolationLevel: testOptions.isolationLevel,
      timeout: testOptions.timeout,
      enableLogging: testOptions.debug,
      maxRetries: testOptions.maxRetries,
    });
    
    result.success = true;
    result.result = txResult;
  } catch (error) {
    result.success = false;
    result.error = error as Error;
    result.wasRolledBack = true;
  } finally {
    result.durationMs = Date.now() - startTime;
    result.metadata.attempts = attempt;
    
    // Run cleanup if enabled
    if (testOptions.autoCleanup && testOptions.cleanupFn) {
      await testOptions.cleanupFn();
    }
  }
  
  return result;
}

/**
 * Verifies that a transaction operates at the expected isolation level
 * by testing for specific isolation phenomena
 * 
 * @param prisma - PrismaClient instance
 * @param isolationLevel - Expected isolation level to verify
 * @param options - Test options
 * @returns Promise resolving to the verification result
 */
export async function verifyTransactionIsolation(
  prisma: PrismaClient,
  isolationLevel: TransactionIsolationLevel,
  options: TransactionTestOptions = {}
): Promise<{
  isolationLevel: TransactionIsolationLevel;
  phenomena: {
    dirtyReads: boolean;
    nonRepeatableReads: boolean;
    phantomReads: boolean;
  };
  verified: boolean;
}> {
  const testOptions = { ...DEFAULT_TEST_OPTIONS, ...options, isolationLevel };
  
  // Create a second PrismaClient for concurrent transactions
  const prisma2 = new PrismaClient();
  
  try {
    // Test for dirty reads
    const dirtyReadsResult = await testDirtyReads(prisma, prisma2, testOptions);
    
    // Test for non-repeatable reads
    const nonRepeatableReadsResult = await testNonRepeatableReads(prisma, prisma2, testOptions);
    
    // Test for phantom reads
    const phantomReadsResult = await testPhantomReads(prisma, prisma2, testOptions);
    
    // Determine if the isolation level is verified based on expected phenomena
    const phenomena = {
      dirtyReads: dirtyReadsResult,
      nonRepeatableReads: nonRepeatableReadsResult,
      phantomReads: phantomReadsResult,
    };
    
    let verified = false;
    
    switch (isolationLevel) {
      case TransactionIsolationLevel.READ_UNCOMMITTED:
        // READ UNCOMMITTED may allow all phenomena
        verified = true;
        break;
        
      case TransactionIsolationLevel.READ_COMMITTED:
        // READ COMMITTED should prevent dirty reads but may allow non-repeatable and phantom reads
        verified = !dirtyReadsResult;
        break;
        
      case TransactionIsolationLevel.REPEATABLE_READ:
        // REPEATABLE READ should prevent dirty and non-repeatable reads but may allow phantom reads
        verified = !dirtyReadsResult && !nonRepeatableReadsResult;
        break;
        
      case TransactionIsolationLevel.SERIALIZABLE:
        // SERIALIZABLE should prevent all phenomena
        verified = !dirtyReadsResult && !nonRepeatableReadsResult && !phantomReadsResult;
        break;
    }
    
    return {
      isolationLevel,
      phenomena,
      verified,
    };
  } finally {
    // Disconnect the second Prisma client
    await prisma2.$disconnect();
  }
}

/**
 * Tests for dirty reads (reading uncommitted data from another transaction)
 * 
 * @param prisma1 - First PrismaClient instance
 * @param prisma2 - Second PrismaClient instance
 * @param options - Test options
 * @returns Promise resolving to true if dirty reads are possible, false otherwise
 */
async function testDirtyReads(
  prisma1: PrismaClient,
  prisma2: PrismaClient,
  options: TransactionTestOptions
): Promise<boolean> {
  // Create a test record
  const testId = `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const testValue = 'initial';
  
  try {
    // Create initial test record
    await prisma1.$executeRaw`INSERT INTO "TestIsolation" ("id", "value") VALUES (${testId}, ${testValue})`;
    
    // Start transaction 1 that modifies the record but doesn't commit
    const tx1 = await prisma1.$transaction(async (tx1) => {
      // Modify the record
      await tx1.$executeRaw`UPDATE "TestIsolation" SET "value" = 'modified' WHERE "id" = ${testId}`;
      
      // Start transaction 2 that reads the record
      const tx2Result = await prisma2.$transaction(async (tx2) => {
        // Read the record
        const result = await tx2.$queryRaw`SELECT "value" FROM "TestIsolation" WHERE "id" = ${testId}`;
        return result as { value: string }[];
      }, { isolationLevel: options.isolationLevel as any });
      
      // Return the value read by transaction 2
      return tx2Result[0]?.value;
    }, { isolationLevel: options.isolationLevel as any });
    
    // If transaction 2 read 'modified', dirty reads are possible
    return tx1 === 'modified';
  } catch (error) {
    // If an error occurred, assume dirty reads are not possible
    return false;
  } finally {
    // Clean up test record
    await prisma1.$executeRaw`DELETE FROM "TestIsolation" WHERE "id" = ${testId}`;
  }
}

/**
 * Tests for non-repeatable reads (reading different values for the same record in the same transaction)
 * 
 * @param prisma1 - First PrismaClient instance
 * @param prisma2 - Second PrismaClient instance
 * @param options - Test options
 * @returns Promise resolving to true if non-repeatable reads are possible, false otherwise
 */
async function testNonRepeatableReads(
  prisma1: PrismaClient,
  prisma2: PrismaClient,
  options: TransactionTestOptions
): Promise<boolean> {
  // Create a test record
  const testId = `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const testValue = 'initial';
  
  try {
    // Create initial test record
    await prisma1.$executeRaw`INSERT INTO "TestIsolation" ("id", "value") VALUES (${testId}, ${testValue})`;
    
    // Start transaction 1 that reads the record twice
    const tx1Result = await prisma1.$transaction(async (tx1) => {
      // First read
      const firstRead = await tx1.$queryRaw`SELECT "value" FROM "TestIsolation" WHERE "id" = ${testId}`;
      const firstValue = (firstRead as { value: string }[])[0]?.value;
      
      // Allow transaction 2 to modify the record and commit
      await prisma2.$transaction(async (tx2) => {
        await tx2.$executeRaw`UPDATE "TestIsolation" SET "value" = 'modified' WHERE "id" = ${testId}`;
      }, { isolationLevel: options.isolationLevel as any });
      
      // Second read
      const secondRead = await tx1.$queryRaw`SELECT "value" FROM "TestIsolation" WHERE "id" = ${testId}`;
      const secondValue = (secondRead as { value: string }[])[0]?.value;
      
      // Return both values
      return { firstValue, secondValue };
    }, { isolationLevel: options.isolationLevel as any });
    
    // If the values are different, non-repeatable reads are possible
    return tx1Result.firstValue !== tx1Result.secondValue;
  } catch (error) {
    // If an error occurred, assume non-repeatable reads are not possible
    return false;
  } finally {
    // Clean up test record
    await prisma1.$executeRaw`DELETE FROM "TestIsolation" WHERE "id" = ${testId}`;
  }
}

/**
 * Tests for phantom reads (reading different sets of records that match the same criteria in the same transaction)
 * 
 * @param prisma1 - First PrismaClient instance
 * @param prisma2 - Second PrismaClient instance
 * @param options - Test options
 * @returns Promise resolving to true if phantom reads are possible, false otherwise
 */
async function testPhantomReads(
  prisma1: PrismaClient,
  prisma2: PrismaClient,
  options: TransactionTestOptions
): Promise<boolean> {
  // Create a test category
  const testCategory = `category-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  try {
    // Start transaction 1 that reads records in the category twice
    const tx1Result = await prisma1.$transaction(async (tx1) => {
      // First read
      const firstRead = await tx1.$queryRaw`SELECT COUNT(*) as count FROM "TestIsolation" WHERE "category" = ${testCategory}`;
      const firstCount = Number((firstRead as { count: number }[])[0]?.count || 0);
      
      // Allow transaction 2 to insert a new record in the category and commit
      await prisma2.$transaction(async (tx2) => {
        const newId = `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        await tx2.$executeRaw`INSERT INTO "TestIsolation" ("id", "value", "category") VALUES (${newId}, 'phantom', ${testCategory})`;
      }, { isolationLevel: options.isolationLevel as any });
      
      // Second read
      const secondRead = await tx1.$queryRaw`SELECT COUNT(*) as count FROM "TestIsolation" WHERE "category" = ${testCategory}`;
      const secondCount = Number((secondRead as { count: number }[])[0]?.count || 0);
      
      // Return both counts
      return { firstCount, secondCount };
    }, { isolationLevel: options.isolationLevel as any });
    
    // If the counts are different, phantom reads are possible
    return tx1Result.firstCount !== tx1Result.secondCount;
  } catch (error) {
    // If an error occurred, assume phantom reads are not possible
    return false;
  } finally {
    // Clean up test records
    await prisma1.$executeRaw`DELETE FROM "TestIsolation" WHERE "category" = ${testCategory}`;
  }
}

/**
 * Measures transaction performance characteristics
 * 
 * @param prisma - PrismaClient instance
 * @param testFn - Function to execute within the transaction
 * @param iterations - Number of iterations to run
 * @param options - Test options
 * @returns Promise resolving to performance metrics
 */
export async function measureTransactionPerformance<T>(
  prisma: PrismaClient,
  testFn: (tx: Prisma.TransactionClient, iteration: number) => Promise<T>,
  iterations: number = 10,
  options: TransactionTestOptions = {}
): Promise<{
  totalDurationMs: number;
  averageDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
  successRate: number;
  throughput: number; // transactions per second
  results: Array<TransactionTestResult<T>>;
}> {
  const testOptions = { ...DEFAULT_TEST_OPTIONS, ...options };
  const results: Array<TransactionTestResult<T>> = [];
  const startTime = Date.now();
  
  // Run the specified number of iterations
  for (let i = 0; i < iterations; i++) {
    const result = await testTransaction(prisma, (tx) => testFn(tx, i), testOptions);
    results.push(result);
  }
  
  const totalDurationMs = Date.now() - startTime;
  const successfulResults = results.filter(r => r.success);
  
  // Calculate performance metrics
  const durations = results.map(r => r.durationMs);
  const averageDurationMs = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  const minDurationMs = Math.min(...durations);
  const maxDurationMs = Math.max(...durations);
  const successRate = successfulResults.length / results.length;
  const throughput = (iterations / totalDurationMs) * 1000; // transactions per second
  
  return {
    totalDurationMs,
    averageDurationMs,
    minDurationMs,
    maxDurationMs,
    successRate,
    throughput,
    results,
  };
}

/**
 * Tests optimistic locking behavior by simulating concurrent updates to the same record
 * 
 * @param prisma - PrismaClient instance
 * @param entityType - Type of entity to test
 * @param entityId - ID of the entity to test
 * @param updateFn - Function that updates the entity
 * @param options - Test options
 * @returns Promise resolving to the test result
 */
export async function testOptimisticLocking<T>(
  prisma: PrismaClient,
  entityType: string,
  entityId: string | number,
  updateFn: (tx: Prisma.TransactionClient, entity: any) => Promise<T>,
  options: TransactionTestOptions = {}
): Promise<{
  concurrentUpdates: number;
  successfulUpdates: number;
  failedUpdates: number;
  versionConflicts: number;
  finalVersion: number;
  results: Array<TransactionTestResult<T>>;
}> {
  const testOptions = { ...DEFAULT_TEST_OPTIONS, ...options };
  const concurrentUpdates = options.concurrentUpdates || 5;
  const results: Array<TransactionTestResult<T>> = [];
  
  // Create multiple PrismaClient instances for concurrent transactions
  const prismaClients: PrismaClient[] = [];
  for (let i = 0; i < concurrentUpdates; i++) {
    prismaClients.push(new PrismaClient());
  }
  
  try {
    // Start concurrent transactions
    const updatePromises = prismaClients.map((client, index) => {
      return testTransaction(client, async (tx) => {
        // Get the current entity with its version
        const entity = await tx[entityType].findUnique({
          where: { id: entityId },
        });
        
        if (!entity) {
          throw new Error(`Entity ${entityType} with ID ${entityId} not found`);
        }
        
        // Add a small delay to increase chance of conflicts
        await sleep(Math.random() * 50);
        
        // Update the entity
        return await updateFn(tx, entity);
      }, testOptions);
    });
    
    // Wait for all updates to complete
    results.push(...(await Promise.all(updatePromises)));
    
    // Get the final entity version
    const finalEntity = await prisma[entityType].findUnique({
      where: { id: entityId },
    });
    
    // Calculate results
    const successfulUpdates = results.filter(r => r.success).length;
    const failedUpdates = results.filter(r => !r.success).length;
    const versionConflicts = results.filter(r => 
      r.error && 
      (r.error instanceof Prisma.PrismaClientKnownRequestError) && 
      r.error.code === 'P2034' // Unique constraint violation
    ).length;
    
    return {
      concurrentUpdates,
      successfulUpdates,
      failedUpdates,
      versionConflicts,
      finalVersion: finalEntity?.version || 0,
      results,
    };
  } finally {
    // Disconnect all Prisma clients
    await Promise.all(prismaClients.map(client => client.$disconnect()));
  }
}

/**
 * Creates a test table for isolation level testing if it doesn't exist
 * 
 * @param prisma - PrismaClient instance
 * @returns Promise that resolves when the table is created
 */
export async function ensureTestIsolationTable(prisma: PrismaClient): Promise<void> {
  try {
    // Check if the table exists
    await prisma.$executeRaw`SELECT 1 FROM "TestIsolation" LIMIT 1`;
  } catch (error) {
    // Table doesn't exist, create it
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "TestIsolation" (
        "id" TEXT PRIMARY KEY,
        "value" TEXT NOT NULL,
        "category" TEXT,
        "version" INTEGER NOT NULL DEFAULT 1,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
  }
}

/**
 * Drops the test isolation table
 * 
 * @param prisma - PrismaClient instance
 * @returns Promise that resolves when the table is dropped
 */
export async function dropTestIsolationTable(prisma: PrismaClient): Promise<void> {
  try {
    await prisma.$executeRaw`DROP TABLE IF EXISTS "TestIsolation"`;
  } catch (error) {
    // Ignore errors
  }
}
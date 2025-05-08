/**
 * @file transaction.utils.ts
 * @description Collection of utility functions for common transaction patterns and operations.
 * Includes helpers for executing functions within transactions, selecting appropriate isolation
 * levels based on operation type, monitoring transaction performance, and debugging transaction issues.
 * These utilities simplify complex transaction scenarios and provide consistent patterns for
 * transaction management across the AUSTA SuperApp.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { Logger } from '@nestjs/common';
import { performance } from 'perf_hooks';

import {
  TransactionIsolationLevel,
  TransactionOptions,
  TransactionCallback,
  TransactionType,
  TransactionRetryOptions,
  DEFAULT_TRANSACTION_OPTIONS,
  TransactionState,
  TransactionMetadata
} from '../types/transaction.types';

import {
  TransactionError,
  TransactionTimeoutError,
  DeadlockError,
  TransactionAbortedError,
  TransactionIsolationError,
  TransactionRollbackError,
  TransactionCommitError,
  ConcurrencyControlError
} from './transaction.errors';

import { DatabaseErrorType, JourneyContext, DatabaseOperationContext } from '../errors/database-error.types';
import { executeWithRetry, ExponentialBackoffStrategy, createRetryContext } from '../errors/retry-strategies';

// Private logger instance for transaction utilities
const logger = new Logger('TransactionUtils');

/**
 * Operation types for determining appropriate isolation levels
 */
export enum OperationType {
  READ_ONLY = 'READ_ONLY',
  READ_WRITE = 'READ_WRITE',
  WRITE_ONLY = 'WRITE_ONLY',
  CRITICAL_WRITE = 'CRITICAL_WRITE'
}

/**
 * Maps operation types to recommended isolation levels
 */
const OPERATION_ISOLATION_LEVEL_MAP: Record<OperationType, TransactionIsolationLevel> = {
  [OperationType.READ_ONLY]: TransactionIsolationLevel.READ_COMMITTED,
  [OperationType.READ_WRITE]: TransactionIsolationLevel.REPEATABLE_READ,
  [OperationType.WRITE_ONLY]: TransactionIsolationLevel.READ_COMMITTED,
  [OperationType.CRITICAL_WRITE]: TransactionIsolationLevel.SERIALIZABLE
};

/**
 * Interface for transaction performance metrics
 */
export interface TransactionPerformanceMetrics {
  /**
   * Unique identifier for the transaction
   */
  transactionId: string;

  /**
   * Total duration of the transaction in milliseconds
   */
  durationMs: number;

  /**
   * Time spent in the database (excluding JavaScript execution) in milliseconds
   */
  dbTimeMs: number;

  /**
   * Number of queries executed within the transaction
   */
  queryCount: number;

  /**
   * Number of rows affected by the transaction
   */
  rowCount: number;

  /**
   * Isolation level used for the transaction
   */
  isolationLevel: TransactionIsolationLevel;

  /**
   * Journey context for the transaction
   */
  journeyContext?: string;

  /**
   * Whether the transaction was successful
   */
  successful: boolean;

  /**
   * Number of retry attempts made
   */
  retryCount: number;

  /**
   * Error message if the transaction failed
   */
  errorMessage?: string;
}

/**
 * Interface for transaction debug information
 */
export interface TransactionDebugInfo {
  /**
   * Unique identifier for the transaction
   */
  transactionId: string;

  /**
   * Current state of the transaction
   */
  state: TransactionState;

  /**
   * Isolation level used for the transaction
   */
  isolationLevel: TransactionIsolationLevel;

  /**
   * Type of transaction (STANDARD, NESTED, DISTRIBUTED)
   */
  type: TransactionType;

  /**
   * Timestamp when the transaction was created
   */
  createdAt: Date;

  /**
   * Timestamp when the transaction was started
   */
  startedAt?: Date;

  /**
   * Timestamp when the transaction was completed
   */
  completedAt?: Date;

  /**
   * Duration of the transaction in milliseconds
   */
  durationMs?: number;

  /**
   * Queries executed within the transaction
   */
  queries?: string[];

  /**
   * Parameters used in the queries
   */
  parameters?: Record<string, any>[];

  /**
   * Stack trace at the time of transaction creation
   */
  stackTrace?: string;

  /**
   * Error that caused the transaction to fail, if any
   */
  error?: Error;

  /**
   * Journey context for the transaction
   */
  journeyContext?: string;
}

/**
 * Determines the appropriate isolation level based on the operation type
 * 
 * @param operationType - Type of operation being performed
 * @returns The recommended isolation level for the operation
 */
export function getIsolationLevelForOperation(operationType: OperationType): TransactionIsolationLevel {
  return OPERATION_ISOLATION_LEVEL_MAP[operationType];
}

/**
 * Executes a callback function within a transaction with the specified options
 * 
 * @param prisma - PrismaClient instance
 * @param callback - Function to execute within the transaction
 * @param options - Transaction options
 * @returns Promise resolving to the result of the callback function
 */
export async function executeInTransaction<T>(
  prisma: PrismaClient,
  callback: TransactionCallback<T>,
  options: Partial<TransactionOptions> = {}
): Promise<T> {
  const mergedOptions = mergeWithDefaultOptions(options);
  const transactionId = generateTransactionId();
  const metadata: TransactionMetadata = {
    id: transactionId,
    createdAt: new Date(),
    state: TransactionState.CREATED,
    type: mergedOptions.type,
    isolationLevel: mergedOptions.isolationLevel,
    journeyContext: mergedOptions.journeyContext || 'default',
    retryCount: 0
  };

  // Create operation context for error handling
  const operationContext: DatabaseOperationContext = {
    operation: 'transaction',
    entity: 'multiple',
    transactionId,
    isolationLevel: mergedOptions.isolationLevel
  };

  // Create journey context for error handling
  const journeyContext: JourneyContext = {
    journey: mergedOptions.journeyContext,
    feature: 'database'
  };

  // Start performance monitoring
  const startTime = performance.now();
  let dbStartTime: number;
  let dbEndTime: number;
  let queryCount = 0;
  let rowCount = 0;

  try {
    // Log transaction start if enabled
    if (mergedOptions.logging.logEvents) {
      logger.log(`Starting transaction ${transactionId} with isolation level ${mergedOptions.isolationLevel}`);
    }

    // Update metadata
    metadata.startedAt = new Date();
    metadata.state = TransactionState.ACTIVE;

    // Set up transaction timeout if configured
    const timeoutPromise = mergedOptions.timeout.timeoutMs > 0
      ? createTimeoutPromise(mergedOptions.timeout.timeoutMs, transactionId, journeyContext, operationContext)
      : Promise.resolve();

    // Execute the transaction with retry logic if configured
    const result = await executeWithRetryAndTimeout(
      prisma,
      callback,
      mergedOptions,
      transactionId,
      journeyContext,
      operationContext,
      timeoutPromise,
      (metrics) => {
        dbStartTime = metrics.dbStartTime;
        dbEndTime = metrics.dbEndTime;
        queryCount = metrics.queryCount;
        rowCount = metrics.rowCount;
      }
    );

    // Update metadata
    metadata.completedAt = new Date();
    metadata.state = TransactionState.COMMITTED;

    // Log transaction completion if enabled
    if (mergedOptions.logging.logEvents) {
      logger.log(`Successfully committed transaction ${transactionId}`);
    }

    // Log performance metrics if enabled
    if (mergedOptions.logging.logPerformance) {
      const endTime = performance.now();
      const metrics: TransactionPerformanceMetrics = {
        transactionId,
        durationMs: endTime - startTime,
        dbTimeMs: dbEndTime - dbStartTime,
        queryCount,
        rowCount,
        isolationLevel: mergedOptions.isolationLevel,
        journeyContext: mergedOptions.journeyContext,
        successful: true,
        retryCount: metadata.retryCount
      };
      logTransactionPerformance(metrics);
    }

    return result;
  } catch (error) {
    // Update metadata
    metadata.completedAt = new Date();
    metadata.state = TransactionState.FAILED;
    metadata.error = error instanceof Error ? error : new Error(String(error));

    // Log transaction failure if enabled
    if (mergedOptions.logging.logEvents) {
      logger.error(
        `Transaction ${transactionId} failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined
      );
    }

    // Log performance metrics if enabled
    if (mergedOptions.logging.logPerformance) {
      const endTime = performance.now();
      const metrics: TransactionPerformanceMetrics = {
        transactionId,
        durationMs: endTime - startTime,
        dbTimeMs: (dbEndTime || endTime) - (dbStartTime || startTime),
        queryCount,
        rowCount,
        isolationLevel: mergedOptions.isolationLevel,
        journeyContext: mergedOptions.journeyContext,
        successful: false,
        retryCount: metadata.retryCount,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
      logTransactionPerformance(metrics);
    }

    // Transform and rethrow the error
    throw transformTransactionError(error, journeyContext, operationContext);
  }
}

/**
 * Executes a callback function within a transaction with retry logic and timeout handling
 * 
 * @param prisma - PrismaClient instance
 * @param callback - Function to execute within the transaction
 * @param options - Transaction options
 * @param transactionId - Unique identifier for the transaction
 * @param journeyContext - Journey context for error handling
 * @param operationContext - Operation context for error handling
 * @param timeoutPromise - Promise that rejects when the transaction times out
 * @param metricsCallback - Callback function to receive transaction metrics
 * @returns Promise resolving to the result of the callback function
 */
async function executeWithRetryAndTimeout<T>(
  prisma: PrismaClient,
  callback: TransactionCallback<T>,
  options: Required<TransactionOptions>,
  transactionId: string,
  journeyContext: JourneyContext,
  operationContext: DatabaseOperationContext,
  timeoutPromise: Promise<void>,
  metricsCallback?: (metrics: { dbStartTime: number, dbEndTime: number, queryCount: number, rowCount: number }) => void
): Promise<T> {
  // Create retry strategy if retries are configured
  const retryStrategy = new ExponentialBackoffStrategy({
    maxRetries: options.retry.maxRetries,
    initialDelayMs: options.retry.baseDelayMs,
    maxDelayMs: options.retry.maxDelayMs,
    retryableErrorTypes: options.retry.retryableErrors
  });

  // Execute with retry logic
  return executeWithRetry(
    async () => {
      // Track database metrics
      let dbStartTime = performance.now();
      let dbEndTime = 0;
      let queryCount = 0;
      let rowCount = 0;

      // Create a race between the transaction and the timeout
      return Promise.race([
        // Transaction execution
        prisma.$transaction(async (tx) => {
          try {
            // Execute the callback within the transaction
            const result = await callback(tx as unknown as PrismaClient);
            
            // Update metrics
            dbEndTime = performance.now();
            
            // Provide metrics to the callback
            if (metricsCallback) {
              metricsCallback({
                dbStartTime,
                dbEndTime,
                queryCount,
                rowCount
              });
            }
            
            return result;
          } catch (error) {
            // Update metrics before rethrowing
            dbEndTime = performance.now();
            
            // Provide metrics to the callback
            if (metricsCallback) {
              metricsCallback({
                dbStartTime,
                dbEndTime,
                queryCount,
                rowCount
              });
            }
            
            throw error;
          }
        }, {
          isolationLevel: getPrismaIsolationLevel(options.isolationLevel),
          maxWait: options.timeout.timeoutMs,
          timeout: options.timeout.timeoutMs
        }),
        
        // Timeout handling
        timeoutPromise
      ]);
    },
    retryStrategy,
    'transaction',
    `transaction-${transactionId}`,
    journeyContext.journey,
    { isolationLevel: options.isolationLevel }
  );
}

/**
 * Creates a promise that rejects when a transaction times out
 * 
 * @param timeoutMs - Timeout in milliseconds
 * @param transactionId - Unique identifier for the transaction
 * @param journeyContext - Journey context for error handling
 * @param operationContext - Operation context for error handling
 * @returns Promise that rejects with a TransactionTimeoutError when the timeout is reached
 */
function createTimeoutPromise(
  timeoutMs: number,
  transactionId: string,
  journeyContext: JourneyContext,
  operationContext: DatabaseOperationContext
): Promise<void> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const enhancedOperationContext: DatabaseOperationContext = {
        ...operationContext,
        timeoutMs
      };
      
      reject(new TransactionTimeoutError(
        `Transaction ${transactionId} timed out after ${timeoutMs}ms`,
        timeoutMs,
        timeoutMs,
        journeyContext,
        enhancedOperationContext
      ));
    }, timeoutMs);
  });
}

/**
 * Executes a read-only operation within a transaction
 * 
 * @param prisma - PrismaClient instance
 * @param callback - Function to execute within the transaction
 * @param options - Transaction options
 * @returns Promise resolving to the result of the callback function
 */
export async function executeReadOperation<T>(
  prisma: PrismaClient,
  callback: TransactionCallback<T>,
  options: Partial<TransactionOptions> = {}
): Promise<T> {
  // Set appropriate isolation level for read operations if not specified
  const readOptions: Partial<TransactionOptions> = {
    ...options,
    isolationLevel: options.isolationLevel || getIsolationLevelForOperation(OperationType.READ_ONLY)
  };
  
  return executeInTransaction(prisma, callback, readOptions);
}

/**
 * Executes a write operation within a transaction
 * 
 * @param prisma - PrismaClient instance
 * @param callback - Function to execute within the transaction
 * @param options - Transaction options
 * @returns Promise resolving to the result of the callback function
 */
export async function executeWriteOperation<T>(
  prisma: PrismaClient,
  callback: TransactionCallback<T>,
  options: Partial<TransactionOptions> = {}
): Promise<T> {
  // Set appropriate isolation level for write operations if not specified
  const writeOptions: Partial<TransactionOptions> = {
    ...options,
    isolationLevel: options.isolationLevel || getIsolationLevelForOperation(OperationType.WRITE_ONLY)
  };
  
  return executeInTransaction(prisma, callback, writeOptions);
}

/**
 * Executes a read-write operation within a transaction
 * 
 * @param prisma - PrismaClient instance
 * @param callback - Function to execute within the transaction
 * @param options - Transaction options
 * @returns Promise resolving to the result of the callback function
 */
export async function executeReadWriteOperation<T>(
  prisma: PrismaClient,
  callback: TransactionCallback<T>,
  options: Partial<TransactionOptions> = {}
): Promise<T> {
  // Set appropriate isolation level for read-write operations if not specified
  const readWriteOptions: Partial<TransactionOptions> = {
    ...options,
    isolationLevel: options.isolationLevel || getIsolationLevelForOperation(OperationType.READ_WRITE)
  };
  
  return executeInTransaction(prisma, callback, readWriteOptions);
}

/**
 * Executes a critical write operation within a transaction with the highest isolation level
 * 
 * @param prisma - PrismaClient instance
 * @param callback - Function to execute within the transaction
 * @param options - Transaction options
 * @returns Promise resolving to the result of the callback function
 */
export async function executeCriticalWriteOperation<T>(
  prisma: PrismaClient,
  callback: TransactionCallback<T>,
  options: Partial<TransactionOptions> = {}
): Promise<T> {
  // Set appropriate isolation level for critical write operations if not specified
  const criticalWriteOptions: Partial<TransactionOptions> = {
    ...options,
    isolationLevel: options.isolationLevel || getIsolationLevelForOperation(OperationType.CRITICAL_WRITE)
  };
  
  return executeInTransaction(prisma, callback, criticalWriteOptions);
}

/**
 * Executes multiple operations in a batch within a single transaction
 * 
 * @param prisma - PrismaClient instance
 * @param operations - Array of operations to execute
 * @param options - Transaction options
 * @returns Promise resolving to an array of results from each operation
 */
export async function executeBatchOperations<T>(
  prisma: PrismaClient,
  operations: Array<TransactionCallback<T>>,
  options: Partial<TransactionOptions> = {}
): Promise<T[]> {
  return executeInTransaction(prisma, async (tx) => {
    const results: T[] = [];
    
    for (const operation of operations) {
      const result = await operation(tx);
      results.push(result);
    }
    
    return results;
  }, options);
}

/**
 * Retries a transaction with exponential backoff when transient errors occur
 * 
 * @param prisma - PrismaClient instance
 * @param callback - Function to execute within the transaction
 * @param retryOptions - Options for retry behavior
 * @param options - Transaction options
 * @returns Promise resolving to the result of the callback function
 */
export async function executeWithTransactionRetry<T>(
  prisma: PrismaClient,
  callback: TransactionCallback<T>,
  retryOptions: Partial<TransactionRetryOptions> = {},
  options: Partial<TransactionOptions> = {}
): Promise<T> {
  // Merge retry options with defaults
  const mergedRetryOptions: TransactionRetryOptions = {
    maxRetries: retryOptions.maxRetries ?? DEFAULT_TRANSACTION_OPTIONS.retry.maxRetries,
    baseDelayMs: retryOptions.baseDelayMs ?? DEFAULT_TRANSACTION_OPTIONS.retry.baseDelayMs,
    maxDelayMs: retryOptions.maxDelayMs ?? DEFAULT_TRANSACTION_OPTIONS.retry.maxDelayMs,
    useJitter: retryOptions.useJitter ?? DEFAULT_TRANSACTION_OPTIONS.retry.useJitter,
    retryableErrors: retryOptions.retryableErrors ?? DEFAULT_TRANSACTION_OPTIONS.retry.retryableErrors
  };
  
  // Create transaction options with the specified retry options
  const transactionOptions: Partial<TransactionOptions> = {
    ...options,
    retry: mergedRetryOptions
  };
  
  return executeInTransaction(prisma, callback, transactionOptions);
}

/**
 * Logs transaction performance metrics
 * 
 * @param metrics - Transaction performance metrics
 */
export function logTransactionPerformance(metrics: TransactionPerformanceMetrics): void {
  const { transactionId, durationMs, dbTimeMs, queryCount, isolationLevel, successful, retryCount, errorMessage } = metrics;
  
  const status = successful ? 'SUCCESSFUL' : 'FAILED';
  const journeyInfo = metrics.journeyContext ? ` [Journey: ${metrics.journeyContext}]` : '';
  const retryInfo = retryCount > 0 ? ` after ${retryCount} retries` : '';
  const errorInfo = errorMessage ? `: ${errorMessage}` : '';
  
  logger.log(
    `Transaction ${transactionId}${journeyInfo} ${status}${retryInfo}${errorInfo} - ` +
    `Duration: ${durationMs.toFixed(2)}ms, DB Time: ${dbTimeMs.toFixed(2)}ms, ` +
    `Queries: ${queryCount}, Isolation: ${isolationLevel}`
  );
  
  // Log slow transactions as warnings
  if (durationMs > 1000) {
    logger.warn(
      `Slow transaction detected: ${transactionId}${journeyInfo} took ${durationMs.toFixed(2)}ms ` +
      `with isolation level ${isolationLevel}`
    );
  }
}

/**
 * Creates debug information for a transaction
 * 
 * @param transactionId - Unique identifier for the transaction
 * @param metadata - Transaction metadata
 * @param queries - Queries executed within the transaction
 * @param parameters - Parameters used in the queries
 * @returns Transaction debug information
 */
export function createTransactionDebugInfo(
  transactionId: string,
  metadata: TransactionMetadata,
  queries: string[] = [],
  parameters: Record<string, any>[] = []
): TransactionDebugInfo {
  const { createdAt, startedAt, completedAt, state, type, isolationLevel, journeyContext, error } = metadata;
  
  // Calculate duration if start and end times are available
  let durationMs: number | undefined;
  if (startedAt && completedAt) {
    durationMs = completedAt.getTime() - startedAt.getTime();
  }
  
  // Get stack trace
  const stackTrace = new Error().stack;
  
  return {
    transactionId,
    state,
    isolationLevel,
    type,
    createdAt,
    startedAt,
    completedAt,
    durationMs,
    queries,
    parameters,
    stackTrace,
    error,
    journeyContext
  };
}

/**
 * Transforms a raw error into a specific transaction error type
 * 
 * @param error - The error to transform
 * @param journeyContext - Journey context for error handling
 * @param operationContext - Operation context for error handling
 * @returns Transformed transaction error
 */
export function transformTransactionError(
  error: unknown,
  journeyContext?: JourneyContext,
  operationContext?: DatabaseOperationContext
): Error {
  // If the error is already a TransactionError, return it
  if (error instanceof TransactionError) {
    return error;
  }
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Check for specific error patterns to create appropriate error types
  if (errorMessage.includes('deadlock')) {
    return new DeadlockError(
      `Transaction deadlock detected: ${errorMessage}`,
      undefined,
      undefined,
      journeyContext,
      operationContext,
      error instanceof Error ? error : undefined
    );
  }
  
  if (errorMessage.includes('timeout')) {
    const timeoutMs = operationContext?.timeoutMs || 30000;
    return new TransactionTimeoutError(
      `Transaction timed out: ${errorMessage}`,
      timeoutMs,
      timeoutMs,
      journeyContext,
      operationContext,
      error instanceof Error ? error : undefined
    );
  }
  
  if (errorMessage.includes('serialization') || errorMessage.includes('concurrent update')) {
    return new ConcurrencyControlError(
      `Transaction serialization failure: ${errorMessage}`,
      'write-write',
      undefined,
      journeyContext,
      operationContext,
      error instanceof Error ? error : undefined
    );
  }
  
  if (errorMessage.includes('aborted') || errorMessage.includes('rolled back')) {
    return new TransactionAbortedError(
      `Transaction aborted: ${errorMessage}`,
      errorMessage,
      journeyContext,
      operationContext,
      error instanceof Error ? error : undefined
    );
  }
  
  if (errorMessage.includes('isolation level')) {
    return new TransactionIsolationError(
      `Transaction isolation level violation: ${errorMessage}`,
      operationContext?.isolationLevel as any,
      undefined,
      journeyContext,
      operationContext,
      error instanceof Error ? error : undefined
    );
  }
  
  if (errorMessage.includes('commit')) {
    return new TransactionCommitError(
      `Transaction commit failed: ${errorMessage}`,
      undefined,
      journeyContext,
      operationContext,
      error instanceof Error ? error : undefined
    );
  }
  
  if (errorMessage.includes('rollback')) {
    return new TransactionRollbackError(
      `Transaction rollback failed: ${errorMessage}`,
      errorMessage,
      journeyContext,
      operationContext,
      error instanceof Error ? error : undefined
    );
  }
  
  // Default to generic TransactionError for unrecognized errors
  return new TransactionError(
    `Transaction error: ${errorMessage}`,
    'DB_TRANS_UNKNOWN',
    undefined,
    undefined,
    journeyContext,
    operationContext,
    'Retry the transaction. If the issue persists, check the database logs for more information.',
    error instanceof Error ? error : undefined
  );
}

/**
 * Merges provided transaction options with default options
 * 
 * @param options - Partial transaction options to merge with defaults
 * @returns Complete transaction options
 */
function mergeWithDefaultOptions(options: Partial<TransactionOptions>): Required<TransactionOptions> {
  return {
    isolationLevel: options.isolationLevel ?? DEFAULT_TRANSACTION_OPTIONS.isolationLevel,
    timeout: {
      ...DEFAULT_TRANSACTION_OPTIONS.timeout,
      ...options.timeout
    },
    retry: {
      ...DEFAULT_TRANSACTION_OPTIONS.retry,
      ...options.retry
    },
    logging: {
      ...DEFAULT_TRANSACTION_OPTIONS.logging,
      ...options.logging
    },
    savepoint: {
      ...DEFAULT_TRANSACTION_OPTIONS.savepoint,
      ...options.savepoint
    },
    distributed: {
      ...DEFAULT_TRANSACTION_OPTIONS.distributed,
      ...options.distributed
    },
    type: options.type ?? DEFAULT_TRANSACTION_OPTIONS.type,
    parent: options.parent,
    journeyContext: options.journeyContext ?? DEFAULT_TRANSACTION_OPTIONS.journeyContext
  };
}

/**
 * Converts our TransactionIsolationLevel to Prisma's TransactionIsolationLevel
 * 
 * @param isolationLevel - Our transaction isolation level
 * @returns Prisma's transaction isolation level
 */
function getPrismaIsolationLevel(isolationLevel: TransactionIsolationLevel): Prisma.TransactionIsolationLevel {
  switch (isolationLevel) {
    case TransactionIsolationLevel.READ_UNCOMMITTED:
      return 'ReadUncommitted';
    case TransactionIsolationLevel.READ_COMMITTED:
      return 'ReadCommitted';
    case TransactionIsolationLevel.REPEATABLE_READ:
      return 'RepeatableRead';
    case TransactionIsolationLevel.SERIALIZABLE:
      return 'Serializable';
    default:
      return 'ReadCommitted';
  }
}

/**
 * Generates a unique transaction ID
 * 
 * @returns Unique transaction ID
 */
function generateTransactionId(): string {
  return `tx-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Checks if an error is a transient database error that can be retried
 * 
 * @param error - The error to check
 * @returns Whether the error is transient and can be retried
 */
export function isTransientDatabaseError(error: unknown): boolean {
  if (!error) {
    return false;
  }
  
  // Check for specific error types
  if (error instanceof TransactionTimeoutError || 
      error instanceof DeadlockError || 
      error instanceof ConcurrencyControlError) {
    return true;
  }
  
  // Check error message for transient error patterns
  const errorMessage = error instanceof Error ? error.message : String(error);
  const transientPatterns = [
    'deadlock',
    'timeout',
    'serialization',
    'concurrent update',
    'connection',
    'temporarily unavailable',
    'too many connections',
    'connection reset',
    'connection refused',
    'resource busy',
    'lock timeout',
    'idle in transaction',
    'statement timeout',
    'server closed the connection unexpectedly'
  ];
  
  return transientPatterns.some(pattern => errorMessage.toLowerCase().includes(pattern));
}

/**
 * Determines if a transaction should be retried based on the error and retry count
 * 
 * @param error - The error that occurred
 * @param retryCount - Current retry count
 * @param maxRetries - Maximum number of retries allowed
 * @returns Whether the transaction should be retried
 */
export function shouldRetryTransaction(
  error: unknown,
  retryCount: number,
  maxRetries: number = DEFAULT_TRANSACTION_OPTIONS.retry.maxRetries
): boolean {
  // Don't retry if we've reached the maximum retry count
  if (retryCount >= maxRetries) {
    return false;
  }
  
  // Only retry transient errors
  return isTransientDatabaseError(error);
}

/**
 * Calculates the delay before the next retry attempt using exponential backoff
 * 
 * @param retryCount - Current retry count
 * @param baseDelayMs - Base delay in milliseconds
 * @param maxDelayMs - Maximum delay in milliseconds
 * @param useJitter - Whether to add jitter to the delay
 * @returns Delay in milliseconds before the next retry attempt
 */
export function calculateRetryDelay(
  retryCount: number,
  baseDelayMs: number = DEFAULT_TRANSACTION_OPTIONS.retry.baseDelayMs,
  maxDelayMs: number = DEFAULT_TRANSACTION_OPTIONS.retry.maxDelayMs,
  useJitter: boolean = DEFAULT_TRANSACTION_OPTIONS.retry.useJitter
): number {
  // Calculate exponential backoff: baseDelay * (2 ^ retryCount)
  let delay = baseDelayMs * Math.pow(2, retryCount);
  
  // Cap the delay at the maximum
  delay = Math.min(delay, maxDelayMs);
  
  // Add jitter if enabled (±25% randomness)
  if (useJitter) {
    const jitterFactor = 0.25;
    const jitter = delay * jitterFactor * (Math.random() * 2 - 1);
    delay = Math.max(0, Math.floor(delay + jitter));
  }
  
  return delay;
}

/**
 * Executes a transaction with automatic retry for transient errors
 * 
 * @param prisma - PrismaClient instance
 * @param callback - Function to execute within the transaction
 * @param options - Transaction options
 * @returns Promise resolving to the result of the callback function
 */
export async function executeTransactionWithRetry<T>(
  prisma: PrismaClient,
  callback: TransactionCallback<T>,
  options: Partial<TransactionOptions> = {}
): Promise<T> {
  const mergedOptions = mergeWithDefaultOptions(options);
  let retryCount = 0;
  let lastError: Error;
  
  while (true) {
    try {
      return await executeInTransaction(prisma, callback, {
        ...mergedOptions,
        retry: {
          ...mergedOptions.retry,
          maxRetries: 0 // Disable automatic retry in executeInTransaction
        }
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if we should retry
      if (!shouldRetryTransaction(error, retryCount, mergedOptions.retry.maxRetries)) {
        throw lastError;
      }
      
      // Calculate delay before next retry
      const delayMs = calculateRetryDelay(
        retryCount,
        mergedOptions.retry.baseDelayMs,
        mergedOptions.retry.maxDelayMs,
        mergedOptions.retry.useJitter
      );
      
      // Log retry attempt
      logger.log(
        `Retrying transaction after error: ${lastError.message}. ` +
        `Retry ${retryCount + 1}/${mergedOptions.retry.maxRetries} in ${delayMs}ms`
      );
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      // Increment retry count
      retryCount++;
    }
  }
}

/**
 * Executes a function with a timeout
 * 
 * @param fn - Function to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param timeoutMessage - Message for the timeout error
 * @returns Promise resolving to the result of the function
 */
export async function executeWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  // Create a promise that rejects after the timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });
  
  // Race the function execution against the timeout
  return Promise.race([fn(), timeoutPromise]);
}

/**
 * Executes a function with performance tracking
 * 
 * @param fn - Function to execute
 * @param operationName - Name of the operation for logging
 * @returns Promise resolving to the result of the function
 */
export async function executeWithPerformanceTracking<T>(
  fn: () => Promise<T>,
  operationName: string
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await fn();
    const endTime = performance.now();
    const durationMs = endTime - startTime;
    
    // Log performance information
    logger.log(`Operation ${operationName} completed in ${durationMs.toFixed(2)}ms`);
    
    // Log slow operations as warnings
    if (durationMs > 1000) {
      logger.warn(`Slow operation detected: ${operationName} took ${durationMs.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const durationMs = endTime - startTime;
    
    // Log error with performance information
    logger.error(
      `Operation ${operationName} failed after ${durationMs.toFixed(2)}ms: ` +
      `${error instanceof Error ? error.message : String(error)}`
    );
    
    throw error;
  }
}

/**
 * Executes a database operation with comprehensive error handling, retry logic, and performance tracking
 * 
 * @param prisma - PrismaClient instance
 * @param operationFn - Function to execute
 * @param operationName - Name of the operation for logging
 * @param journeyContext - Journey context for error handling
 * @param options - Transaction options
 * @returns Promise resolving to the result of the operation
 */
export async function executeDatabaseOperation<T>(
  prisma: PrismaClient,
  operationFn: (client: PrismaClient) => Promise<T>,
  operationName: string,
  journeyContext?: string,
  options: Partial<TransactionOptions> = {}
): Promise<T> {
  // Create operation context
  const operationContext: DatabaseOperationContext = {
    operation: operationName,
    entity: 'database'
  };
  
  // Create journey context
  const journeyCtx: JourneyContext = {
    journey: journeyContext || 'default',
    feature: 'database'
  };
  
  return executeWithPerformanceTracking(
    () => executeTransactionWithRetry(
      prisma,
      operationFn,
      {
        ...options,
        journeyContext: journeyContext || options.journeyContext
      }
    ),
    operationName
  ).catch(error => {
    // Transform and rethrow the error
    throw transformTransactionError(error, journeyCtx, operationContext);
  });
}
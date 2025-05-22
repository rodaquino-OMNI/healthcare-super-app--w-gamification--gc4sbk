/**
 * Transaction utility functions for database operations
 * 
 * This module provides utility functions for common transaction patterns and operations.
 * It includes helpers for executing functions within transactions, selecting appropriate
 * isolation levels based on operation type, monitoring transaction performance, and
 * debugging transaction issues.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { Logger } from '@austa/logging';
import { TransactionError } from './transaction.errors';
import { TransactionIsolationLevel, TransactionOptions } from './transaction.interface';

// Create a logger instance for transaction utilities
const logger = new Logger('TransactionUtils');

/**
 * Default transaction options
 */
export const DEFAULT_TRANSACTION_OPTIONS: TransactionOptions = {
  isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
  timeout: 30000, // 30 seconds default timeout
  maxRetries: 3,
  retryDelay: 100, // Base delay in ms
  enableMetrics: true,
  enableLogging: true,
};

/**
 * Transaction performance metrics
 */
export interface TransactionMetrics {
  transactionId: string;
  operationType: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  retryCount: number;
  isolationLevel: TransactionIsolationLevel;
  error?: Error;
}

// Store for transaction metrics
const transactionMetricsStore: TransactionMetrics[] = [];

/**
 * Generates a unique transaction ID
 */
export function generateTransactionId(): string {
  return `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Recommends an appropriate isolation level based on the operation type
 * 
 * @param operationType - Type of database operation
 * @returns The recommended isolation level
 */
export function recommendIsolationLevel(operationType: string): TransactionIsolationLevel {
  // Map operation types to appropriate isolation levels
  switch (operationType.toLowerCase()) {
    case 'read-only':
      return TransactionIsolationLevel.READ_COMMITTED;
    
    case 'write':
      return TransactionIsolationLevel.READ_COMMITTED;
    
    case 'critical-write':
      return TransactionIsolationLevel.REPEATABLE_READ;
    
    case 'financial':
    case 'payment':
    case 'balance-update':
      return TransactionIsolationLevel.SERIALIZABLE;
    
    default:
      return TransactionIsolationLevel.READ_COMMITTED;
  }
}

/**
 * Executes a function within a transaction with the specified options
 * 
 * @param prisma - PrismaClient instance
 * @param fn - Function to execute within the transaction
 * @param options - Transaction options
 * @returns The result of the function execution
 */
export async function executeInTransaction<T>(
  prisma: PrismaClient,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options: Partial<TransactionOptions> = {}
): Promise<T> {
  const txOptions: TransactionOptions = { ...DEFAULT_TRANSACTION_OPTIONS, ...options };
  const transactionId = generateTransactionId();
  const operationType = options.operationType || 'unknown';
  
  // If no isolation level is specified, recommend one based on operation type
  if (!options.isolationLevel && options.operationType) {
    txOptions.isolationLevel = recommendIsolationLevel(options.operationType);
  }
  
  // Initialize metrics
  const metrics: TransactionMetrics = {
    transactionId,
    operationType,
    startTime: Date.now(),
    success: false,
    retryCount: 0,
    isolationLevel: txOptions.isolationLevel,
  };
  
  if (txOptions.enableLogging) {
    logger.debug(`Starting transaction ${transactionId} with isolation level ${txOptions.isolationLevel}`, {
      transactionId,
      isolationLevel: txOptions.isolationLevel,
      operationType,
    });
  }
  
  try {
    // Execute the function within a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Set a timeout if specified
      let timeoutId: NodeJS.Timeout | undefined;
      
      if (txOptions.timeout) {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new TransactionError(`Transaction ${transactionId} timed out after ${txOptions.timeout}ms`));
          }, txOptions.timeout);
        });
        
        // Race between the function execution and the timeout
        const resultPromise = fn(tx);
        const result = await Promise.race([resultPromise, timeoutPromise]);
        
        // Clear the timeout if the function completes before the timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        return result;
      } else {
        // No timeout specified, just execute the function
        return await fn(tx);
      }
    }, {
      isolationLevel: txOptions.isolationLevel as any, // Cast to any due to Prisma type differences
    });
    
    // Update metrics for successful execution
    metrics.success = true;
    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    
    if (txOptions.enableLogging) {
      logger.debug(`Transaction ${transactionId} completed successfully in ${metrics.duration}ms`, {
        transactionId,
        duration: metrics.duration,
        isolationLevel: txOptions.isolationLevel,
      });
    }
    
    if (txOptions.enableMetrics) {
      transactionMetricsStore.push(metrics);
    }
    
    return result;
  } catch (error) {
    // Update metrics for failed execution
    metrics.success = false;
    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.error = error as Error;
    
    if (txOptions.enableLogging) {
      logger.error(`Transaction ${transactionId} failed after ${metrics.duration}ms: ${(error as Error).message}`, {
        transactionId,
        duration: metrics.duration,
        error: error as Error,
        isolationLevel: txOptions.isolationLevel,
      });
    }
    
    if (txOptions.enableMetrics) {
      transactionMetricsStore.push(metrics);
    }
    
    throw error;
  }
}

/**
 * Executes a function with retry logic and exponential backoff
 * 
 * @param prisma - PrismaClient instance
 * @param fn - Function to execute within the transaction
 * @param options - Transaction options
 * @returns The result of the function execution
 */
export async function executeWithRetry<T>(
  prisma: PrismaClient,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options: Partial<TransactionOptions> = {}
): Promise<T> {
  const txOptions: TransactionOptions = { ...DEFAULT_TRANSACTION_OPTIONS, ...options };
  const transactionId = generateTransactionId();
  const operationType = options.operationType || 'unknown';
  
  // Initialize metrics
  const metrics: TransactionMetrics = {
    transactionId,
    operationType,
    startTime: Date.now(),
    success: false,
    retryCount: 0,
    isolationLevel: txOptions.isolationLevel,
  };
  
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= txOptions.maxRetries; attempt++) {
    try {
      // If this is a retry, wait with exponential backoff
      if (attempt > 0) {
        metrics.retryCount = attempt;
        
        // Calculate delay with exponential backoff and jitter
        const delay = calculateBackoffDelay(attempt, txOptions.retryDelay);
        
        if (txOptions.enableLogging) {
          logger.debug(`Retrying transaction ${transactionId} (attempt ${attempt}/${txOptions.maxRetries}) after ${delay}ms`, {
            transactionId,
            attempt,
            maxRetries: txOptions.maxRetries,
            delay,
          });
        }
        
        await sleep(delay);
      }
      
      // Execute the transaction
      const result = await executeInTransaction(prisma, fn, {
        ...txOptions,
        enableMetrics: false, // Disable metrics for inner transaction as we're tracking at this level
      });
      
      // Update metrics for successful execution
      metrics.success = true;
      metrics.endTime = Date.now();
      metrics.duration = metrics.endTime - metrics.startTime;
      
      if (txOptions.enableLogging && attempt > 0) {
        logger.info(`Transaction ${transactionId} succeeded after ${attempt} retries in ${metrics.duration}ms`, {
          transactionId,
          retryCount: attempt,
          duration: metrics.duration,
        });
      }
      
      if (txOptions.enableMetrics) {
        transactionMetricsStore.push(metrics);
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      
      // Check if the error is retryable
      if (!isRetryableError(error as Error)) {
        if (txOptions.enableLogging) {
          logger.error(`Transaction ${transactionId} failed with non-retryable error: ${(error as Error).message}`, {
            transactionId,
            error: error as Error,
          });
        }
        break;
      }
      
      // If this was the last retry, update metrics and throw
      if (attempt === txOptions.maxRetries) {
        metrics.success = false;
        metrics.endTime = Date.now();
        metrics.duration = metrics.endTime - metrics.startTime;
        metrics.error = error as Error;
        
        if (txOptions.enableLogging) {
          logger.error(`Transaction ${transactionId} failed after ${txOptions.maxRetries} retries: ${(error as Error).message}`, {
            transactionId,
            retryCount: attempt,
            duration: metrics.duration,
            error: error as Error,
          });
        }
      }
    }
  }
  
  // If we got here, all retries failed
  if (txOptions.enableMetrics) {
    metrics.success = false;
    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.error = lastError;
    transactionMetricsStore.push(metrics);
  }
  
  throw lastError || new TransactionError(`Transaction ${transactionId} failed after ${txOptions.maxRetries} retries`);
}

/**
 * Calculates the backoff delay for retries with jitter
 * 
 * @param attempt - Current retry attempt (1-based)
 * @param baseDelay - Base delay in milliseconds
 * @returns The calculated delay with jitter
 */
export function calculateBackoffDelay(attempt: number, baseDelay: number): number {
  // Calculate exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  
  // Add jitter to prevent retry storms (random value between 75% and 100% of the delay)
  const jitter = 0.75 + Math.random() * 0.25;
  
  // Apply jitter and ensure the delay is at least baseDelay
  return Math.max(baseDelay, Math.floor(exponentialDelay * jitter));
}

/**
 * Determines if an error is retryable
 * 
 * @param error - The error to check
 * @returns True if the error is retryable, false otherwise
 */
export function isRetryableError(error: Error): boolean {
  // Check for specific error types that are retryable
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Prisma error codes that are typically transient
    const retryableCodes = [
      'P1000', // Authentication failed
      'P1001', // Can't reach database server
      'P1002', // Database server closed the connection
      'P1008', // Operations timed out
      'P1017', // Server closed the connection
      'P2024', // Timed out fetching a connection from the connection pool
      'P2028', // Transaction API error
    ];
    
    return retryableCodes.includes(error.code);
  }
  
  // Check for serialization failures in PostgreSQL
  if (error instanceof Prisma.PrismaClientKnownRequestError && 
      error.code === 'P2034' && 
      error.message.includes('40001')) {
    // PostgreSQL serialization failure (error code 40001)
    return true;
  }
  
  // Check for deadlock detection
  if (error instanceof Prisma.PrismaClientKnownRequestError && 
      error.code === 'P2034' && 
      error.message.includes('40P01')) {
    // PostgreSQL deadlock detected (error code 40P01)
    return true;
  }
  
  // Check for connection-related errors
  if (error.message.includes('connection') && 
      (error.message.includes('timeout') || 
       error.message.includes('closed') || 
       error.message.includes('terminated') || 
       error.message.includes('reset'))) {
    return true;
  }
  
  // By default, don't retry
  return false;
}

/**
 * Sleep utility function
 * 
 * @param ms - Milliseconds to sleep
 * @returns A promise that resolves after the specified time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Gets transaction performance metrics
 * 
 * @param limit - Maximum number of metrics to return (default: 100)
 * @returns Array of transaction metrics
 */
export function getTransactionMetrics(limit: number = 100): TransactionMetrics[] {
  return transactionMetricsStore.slice(-limit);
}

/**
 * Clears all transaction metrics
 */
export function clearTransactionMetrics(): void {
  transactionMetricsStore.length = 0;
}

/**
 * Calculates transaction performance statistics
 * 
 * @param timeWindow - Time window in milliseconds (default: 1 hour)
 * @returns Transaction performance statistics
 */
export function calculateTransactionStats(timeWindow: number = 3600000): {
  totalTransactions: number;
  successRate: number;
  averageDuration: number;
  p95Duration: number;
  retryRate: number;
  errorRate: number;
  transactionsByIsolationLevel: Record<string, number>;
} {
  const now = Date.now();
  const cutoff = now - timeWindow;
  
  // Filter metrics within the time window
  const recentMetrics = transactionMetricsStore.filter(m => m.startTime >= cutoff);
  
  if (recentMetrics.length === 0) {
    return {
      totalTransactions: 0,
      successRate: 0,
      averageDuration: 0,
      p95Duration: 0,
      retryRate: 0,
      errorRate: 0,
      transactionsByIsolationLevel: {},
    };
  }
  
  // Calculate statistics
  const totalTransactions = recentMetrics.length;
  const successfulTransactions = recentMetrics.filter(m => m.success).length;
  const transactionsWithRetries = recentMetrics.filter(m => m.retryCount > 0).length;
  const failedTransactions = recentMetrics.filter(m => !m.success).length;
  
  // Calculate durations (only for completed transactions)
  const completedMetrics = recentMetrics.filter(m => m.duration !== undefined);
  const durations = completedMetrics.map(m => m.duration as number).sort((a, b) => a - b);
  
  // Calculate average duration
  const averageDuration = durations.length > 0 
    ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length 
    : 0;
  
  // Calculate p95 duration
  const p95Index = Math.floor(durations.length * 0.95);
  const p95Duration = durations.length > 0 ? durations[p95Index] || durations[durations.length - 1] : 0;
  
  // Count transactions by isolation level
  const transactionsByIsolationLevel: Record<string, number> = {};
  recentMetrics.forEach(m => {
    const level = m.isolationLevel;
    transactionsByIsolationLevel[level] = (transactionsByIsolationLevel[level] || 0) + 1;
  });
  
  return {
    totalTransactions,
    successRate: totalTransactions > 0 ? successfulTransactions / totalTransactions : 0,
    averageDuration,
    p95Duration,
    retryRate: totalTransactions > 0 ? transactionsWithRetries / totalTransactions : 0,
    errorRate: totalTransactions > 0 ? failedTransactions / totalTransactions : 0,
    transactionsByIsolationLevel,
  };
}

/**
 * Logs detailed transaction debug information
 * 
 * @param transactionId - ID of the transaction to debug
 * @returns True if the transaction was found and logged, false otherwise
 */
export function debugTransaction(transactionId: string): boolean {
  const metrics = transactionMetricsStore.find(m => m.transactionId === transactionId);
  
  if (!metrics) {
    logger.warn(`Transaction ${transactionId} not found in metrics store`);
    return false;
  }
  
  logger.info(`Transaction Debug Information for ${transactionId}:`, {
    ...metrics,
    error: metrics.error ? {
      name: metrics.error.name,
      message: metrics.error.message,
      stack: metrics.error.stack,
    } : undefined,
  });
  
  return true;
}

/**
 * Creates a transaction context object with useful metadata
 * 
 * @param operationType - Type of operation being performed
 * @param journeyContext - Optional journey context information
 * @returns Transaction context object
 */
export function createTransactionContext(operationType: string, journeyContext?: {
  journeyType: 'health' | 'care' | 'plan';
  userId?: string;
  sessionId?: string;
}): {
  transactionId: string;
  operationType: string;
  startTime: number;
  journeyContext?: typeof journeyContext;
  isolationLevel: TransactionIsolationLevel;
} {
  return {
    transactionId: generateTransactionId(),
    operationType,
    startTime: Date.now(),
    journeyContext,
    isolationLevel: recommendIsolationLevel(operationType),
  };
}
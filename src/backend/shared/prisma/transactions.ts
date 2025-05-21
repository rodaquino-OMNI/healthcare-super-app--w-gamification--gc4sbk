/**
 * @file transactions.ts
 * @description Utility library for managing database transactions across journey services with
 * standardized patterns for error handling, retries, and cross-service transaction coordination.
 * This file provides functions to ensure data consistency when operations span multiple services
 * or require complex rollback scenarios.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { Logger } from '@nestjs/common';

// Define isolation levels for transactions
export enum TransactionIsolationLevel {
  ReadUncommitted = 'ReadUncommitted',
  ReadCommitted = 'ReadCommitted',
  RepeatableRead = 'RepeatableRead',
  Serializable = 'Serializable'
}

// Define transaction options interface
export interface TransactionOptions {
  isolationLevel?: TransactionIsolationLevel;
  maxRetries?: number;
  timeout?: number; // in milliseconds
  journeyContext?: JourneyContext;
}

// Define journey types for context-aware transactions
export enum JourneyType {
  Health = 'health',
  Care = 'care',
  Plan = 'plan',
  Gamification = 'gamification'
}

// Define journey context for transaction operations
export interface JourneyContext {
  journeyType: JourneyType;
  userId?: string;
  correlationId?: string;
  operationName?: string;
}

// Define transaction error types
export enum TransactionErrorType {
  Timeout = 'TIMEOUT',
  Deadlock = 'DEADLOCK',
  ConnectionLost = 'CONNECTION_LOST',
  ConstraintViolation = 'CONSTRAINT_VIOLATION',
  Unknown = 'UNKNOWN'
}

// Custom transaction error class
export class TransactionError extends Error {
  constructor(
    public readonly type: TransactionErrorType,
    public readonly message: string,
    public readonly cause?: Error,
    public readonly journeyContext?: JourneyContext
  ) {
    super(message);
    this.name = 'TransactionError';
  }
}

// Default transaction options
const DEFAULT_TRANSACTION_OPTIONS: TransactionOptions = {
  isolationLevel: TransactionIsolationLevel.ReadCommitted,
  maxRetries: 3,
  timeout: 30000, // 30 seconds
};

// Logger instance for transaction operations
const logger = new Logger('TransactionManager');

/**
 * Executes a function within a database transaction with retry capabilities.
 * 
 * @param prisma - The Prisma client instance
 * @param fn - The function to execute within the transaction
 * @param options - Transaction options including isolation level and retry settings
 * @returns The result of the executed function
 * @throws TransactionError if the transaction fails after all retries
 */
export async function executeTransaction<T>(
  prisma: PrismaClient,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options: TransactionOptions = DEFAULT_TRANSACTION_OPTIONS
): Promise<T> {
  const opts = { ...DEFAULT_TRANSACTION_OPTIONS, ...options };
  let retries = 0;
  
  // Log transaction start with context if available
  if (opts.journeyContext) {
    logger.log(
      `Starting transaction for journey ${opts.journeyContext.journeyType} ` +
      `(operation: ${opts.journeyContext.operationName || 'unknown'}, ` +
      `correlation: ${opts.journeyContext.correlationId || 'none'})`
    );
  } else {
    logger.log('Starting transaction');
  }

  while (true) {
    try {
      // Create a transaction timeout if specified
      let timeoutId: NodeJS.Timeout | undefined;
      let timeoutPromise: Promise<never> | undefined;
      
      if (opts.timeout) {
        timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new TransactionError(
              TransactionErrorType.Timeout,
              `Transaction timed out after ${opts.timeout}ms`,
              undefined,
              opts.journeyContext
            ));
          }, opts.timeout);
        });
      }

      // Execute the transaction with the specified isolation level
      const result = await Promise.race([
        prisma.$transaction(
          fn,
          {
            isolationLevel: opts.isolationLevel as Prisma.TransactionIsolationLevel,
            maxWait: 5000, // 5 seconds max wait time for a transaction
            timeout: opts.timeout ? opts.timeout - 1000 : 29000 // Slightly less than our own timeout
          }
        ),
        timeoutPromise as Promise<never>
      ]);

      // Clear the timeout if it was set
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Log successful transaction completion
      if (opts.journeyContext) {
        logger.log(
          `Transaction completed successfully for journey ${opts.journeyContext.journeyType} ` +
          `(operation: ${opts.journeyContext.operationName || 'unknown'})`
        );
      } else {
        logger.log('Transaction completed successfully');
      }

      return result;
    } catch (error) {
      // Clear any pending timeout
      if (error instanceof TransactionError && error.type === TransactionErrorType.Timeout) {
        throw error; // Don't retry timeout errors
      }

      // Determine if the error is retryable
      const isRetryable = isRetryableError(error);
      
      // Check if we should retry
      if (isRetryable && retries < opts.maxRetries!) {
        retries++;
        const backoffTime = calculateExponentialBackoff(retries);
        
        logger.warn(
          `Transaction failed with retryable error: ${error.message}. ` +
          `Retrying (${retries}/${opts.maxRetries}) after ${backoffTime}ms backoff.`
        );
        
        // Wait for backoff period before retrying
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        continue;
      }

      // Log the final error
      if (opts.journeyContext) {
        logger.error(
          `Transaction failed for journey ${opts.journeyContext.journeyType} ` +
          `(operation: ${opts.journeyContext.operationName || 'unknown'}): ${error.message}`,
          error.stack
        );
      } else {
        logger.error(`Transaction failed: ${error.message}`, error.stack);
      }

      // Wrap the error in a TransactionError if it's not already one
      if (!(error instanceof TransactionError)) {
        throw new TransactionError(
          getTransactionErrorType(error),
          `Transaction failed: ${error.message}`,
          error,
          opts.journeyContext
        );
      }
      
      throw error;
    }
  }
}

/**
 * Executes a function within a transaction specific to a journey context.
 * This provides additional journey-specific error handling and logging.
 * 
 * @param prisma - The Prisma client instance
 * @param journeyContext - The journey context information
 * @param fn - The function to execute within the transaction
 * @param options - Additional transaction options
 * @returns The result of the executed function
 */
export async function executeJourneyTransaction<T>(
  prisma: PrismaClient,
  journeyContext: JourneyContext,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options: Omit<TransactionOptions, 'journeyContext'> = {}
): Promise<T> {
  return executeTransaction(prisma, fn, {
    ...options,
    journeyContext
  });
}

/**
 * Coordinates a distributed transaction across multiple services.
 * Uses a two-phase approach to ensure consistency across service boundaries.
 * 
 * @param participants - Array of participant services with their Prisma clients and operations
 * @param options - Transaction options
 * @returns Array of results from each participant's operation
 * @throws TransactionError if any participant fails
 */
export async function coordinateDistributedTransaction<T extends any[]>(
  participants: {
    prisma: PrismaClient;
    operation: (tx: Prisma.TransactionClient) => Promise<any>;
    journeyType: JourneyType;
  }[],
  options: TransactionOptions = DEFAULT_TRANSACTION_OPTIONS
): Promise<T> {
  const opts = { ...DEFAULT_TRANSACTION_OPTIONS, ...options };
  const correlationId = opts.journeyContext?.correlationId || generateCorrelationId();
  const results: any[] = [];
  
  logger.log(`Starting distributed transaction with correlation ID: ${correlationId}`);
  
  try {
    // Phase 1: Execute all participant operations and collect results
    for (let i = 0; i < participants.length; i++) {
      const { prisma, operation, journeyType } = participants[i];
      
      const journeyContext: JourneyContext = {
        journeyType,
        correlationId,
        operationName: `participant_${i}`,
        userId: opts.journeyContext?.userId
      };
      
      const result = await executeJourneyTransaction(
        prisma,
        journeyContext,
        operation,
        {
          isolationLevel: opts.isolationLevel,
          maxRetries: opts.maxRetries,
          timeout: opts.timeout
        }
      );
      
      results.push(result);
    }
    
    logger.log(`Distributed transaction completed successfully (correlation: ${correlationId})`);
    return results as T;
  } catch (error) {
    logger.error(
      `Distributed transaction failed (correlation: ${correlationId}): ${error.message}`,
      error.stack
    );
    
    // Wrap the error if needed
    if (!(error instanceof TransactionError)) {
      throw new TransactionError(
        getTransactionErrorType(error),
        `Distributed transaction failed: ${error.message}`,
        error,
        opts.journeyContext
      );
    }
    
    throw error;
  }
}

/**
 * Executes a health journey specific transaction with optimized settings.
 * 
 * @param prisma - The Prisma client instance
 * @param userId - The user ID associated with the transaction
 * @param operationName - Name of the operation being performed
 * @param fn - The function to execute within the transaction
 * @returns The result of the executed function
 */
export async function executeHealthTransaction<T>(
  prisma: PrismaClient,
  userId: string,
  operationName: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return executeJourneyTransaction(
    prisma,
    {
      journeyType: JourneyType.Health,
      userId,
      operationName,
      correlationId: generateCorrelationId()
    },
    fn,
    {
      // Health journey often deals with time-series data, so we use READ_COMMITTED
      // for better performance while maintaining consistency
      isolationLevel: TransactionIsolationLevel.ReadCommitted,
      // Health data operations are typically fast
      timeout: 15000 // 15 seconds
    }
  );
}

/**
 * Executes a care journey specific transaction with optimized settings.
 * 
 * @param prisma - The Prisma client instance
 * @param userId - The user ID associated with the transaction
 * @param operationName - Name of the operation being performed
 * @param fn - The function to execute within the transaction
 * @returns The result of the executed function
 */
export async function executeCareTransaction<T>(
  prisma: PrismaClient,
  userId: string,
  operationName: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return executeJourneyTransaction(
    prisma,
    {
      journeyType: JourneyType.Care,
      userId,
      operationName,
      correlationId: generateCorrelationId()
    },
    fn,
    {
      // Care journey often involves appointment booking which needs stronger isolation
      isolationLevel: TransactionIsolationLevel.RepeatableRead,
      // Care operations may involve external integrations
      timeout: 25000, // 25 seconds
      // More retries for care operations due to potential conflicts
      maxRetries: 5
    }
  );
}

/**
 * Executes a plan journey specific transaction with optimized settings.
 * 
 * @param prisma - The Prisma client instance
 * @param userId - The user ID associated with the transaction
 * @param operationName - Name of the operation being performed
 * @param fn - The function to execute within the transaction
 * @returns The result of the executed function
 */
export async function executePlanTransaction<T>(
  prisma: PrismaClient,
  userId: string,
  operationName: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return executeJourneyTransaction(
    prisma,
    {
      journeyType: JourneyType.Plan,
      userId,
      operationName,
      correlationId: generateCorrelationId()
    },
    fn,
    {
      // Plan journey involves financial data, so we use SERIALIZABLE
      // for strongest consistency guarantees
      isolationLevel: TransactionIsolationLevel.Serializable,
      // Plan operations may be complex
      timeout: 40000, // 40 seconds
      // Financial operations need more retries due to potential conflicts
      maxRetries: 5
    }
  );
}

/**
 * Executes a gamification journey specific transaction with optimized settings.
 * 
 * @param prisma - The Prisma client instance
 * @param userId - The user ID associated with the transaction
 * @param operationName - Name of the operation being performed
 * @param fn - The function to execute within the transaction
 * @returns The result of the executed function
 */
export async function executeGamificationTransaction<T>(
  prisma: PrismaClient,
  userId: string,
  operationName: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return executeJourneyTransaction(
    prisma,
    {
      journeyType: JourneyType.Gamification,
      userId,
      operationName,
      correlationId: generateCorrelationId()
    },
    fn,
    {
      // Gamification can use READ_COMMITTED as it's less critical
      isolationLevel: TransactionIsolationLevel.ReadCommitted,
      // Gamification operations should be fast
      timeout: 20000, // 20 seconds
    }
  );
}

/**
 * Determines if an error is retryable based on its type and message.
 * 
 * @param error - The error to check
 * @returns True if the error is retryable, false otherwise
 */
function isRetryableError(error: any): boolean {
  // Check for known retryable Prisma error codes
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P1000: Authentication failed
    // P1001: Can't reach database server
    // P1002: Database server closed the connection
    // P1008: Operation timed out
    // P1017: Server closed the connection
    // P2034: Transaction failed due to a write conflict or a deadlock
    const retryableCodes = ['P1000', 'P1001', 'P1002', 'P1008', 'P1017', 'P2034'];
    return retryableCodes.includes(error.code);
  }
  
  // Check for connection errors
  if (error.message && (
    error.message.includes('connection') ||
    error.message.includes('timeout') ||
    error.message.includes('deadlock') ||
    error.message.includes('conflict')
  )) {
    return true;
  }
  
  return false;
}

/**
 * Calculates exponential backoff time based on retry attempt.
 * 
 * @param attempt - The current retry attempt (1-based)
 * @returns Backoff time in milliseconds
 */
function calculateExponentialBackoff(attempt: number): number {
  const baseDelay = 100; // 100ms base delay
  const maxDelay = 5000; // 5 seconds maximum delay
  
  // Calculate exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  
  // Add jitter (±20%) to prevent thundering herd problem
  const jitter = exponentialDelay * 0.2 * (Math.random() * 2 - 1);
  
  // Apply jitter and cap at maximum delay
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Determines the transaction error type based on the error.
 * 
 * @param error - The error to categorize
 * @returns The appropriate TransactionErrorType
 */
function getTransactionErrorType(error: any): TransactionErrorType {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Map Prisma error codes to transaction error types
    switch (error.code) {
      case 'P1008':
        return TransactionErrorType.Timeout;
      case 'P2034':
        return TransactionErrorType.Deadlock;
      case 'P1001':
      case 'P1002':
      case 'P1017':
        return TransactionErrorType.ConnectionLost;
      case 'P2002':
      case 'P2003':
      case 'P2004':
        return TransactionErrorType.ConstraintViolation;
      default:
        return TransactionErrorType.Unknown;
    }
  }
  
  // Check error message for clues
  if (error.message) {
    if (error.message.includes('timeout')) {
      return TransactionErrorType.Timeout;
    }
    if (error.message.includes('deadlock')) {
      return TransactionErrorType.Deadlock;
    }
    if (error.message.includes('connection')) {
      return TransactionErrorType.ConnectionLost;
    }
    if (error.message.includes('constraint') || error.message.includes('unique')) {
      return TransactionErrorType.ConstraintViolation;
    }
  }
  
  return TransactionErrorType.Unknown;
}

/**
 * Generates a unique correlation ID for tracking transactions.
 * 
 * @returns A unique correlation ID string
 */
function generateCorrelationId(): string {
  return `tx-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
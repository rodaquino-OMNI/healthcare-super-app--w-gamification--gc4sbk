import { PrismaClient, Prisma } from '@prisma/client';
import { Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

/**
 * Enum representing different transaction isolation levels.
 */
export enum TransactionIsolationLevel {
  READ_UNCOMMITTED = 'ReadUncommitted',
  READ_COMMITTED = 'ReadCommitted',
  REPEATABLE_READ = 'RepeatableRead',
  SERIALIZABLE = 'Serializable'
}

/**
 * Interface for transaction options.
 */
export interface TransactionOptions {
  maxRetries?: number;
  timeout?: number; // in milliseconds
  isolationLevel?: TransactionIsolationLevel;
  journeyContext?: string; // 'health', 'care', 'plan'
  label?: string; // For logging and monitoring
}

/**
 * Error types for transaction failures.
 */
export enum TransactionErrorType {
  TIMEOUT = 'TIMEOUT',
  DEADLOCK = 'DEADLOCK',
  CONNECTION = 'CONNECTION',
  CONSTRAINT = 'CONSTRAINT',
  DISTRIBUTED = 'DISTRIBUTED',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Custom error class for transaction failures.
 */
export class TransactionError extends Error {
  type: TransactionErrorType;
  retryable: boolean;
  transactionId?: string;
  journeyContext?: string;
  originalError?: Error;

  constructor(message: string, type: TransactionErrorType, retryable = false, originalError?: Error) {
    super(message);
    this.name = 'TransactionError';
    this.type = type;
    this.retryable = retryable;
    this.originalError = originalError;
  }
}

/**
 * Default transaction options.
 */
const DEFAULT_TRANSACTION_OPTIONS: TransactionOptions = {
  maxRetries: 3,
  timeout: 5000, // 5 seconds
  isolationLevel: TransactionIsolationLevel.READ_COMMITTED
};

/**
 * Utility class for managing database transactions across journey services.
 */
export class TransactionManager {
  private readonly logger = new Logger(TransactionManager.name);
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  /**
   * Executes a function within a transaction with retry capabilities.
   * 
   * @param fn The function to execute within the transaction
   * @param options Transaction options
   * @returns The result of the function execution
   * @throws TransactionError if the transaction fails after all retries
   */
  async executeInTransaction<T>(
    fn: (prisma: Prisma.TransactionClient) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const opts = { ...DEFAULT_TRANSACTION_OPTIONS, ...options };
    const transactionId = randomUUID();
    let retries = 0;
    
    // Log transaction start
    this.logger.debug(
      `Starting transaction ${transactionId} ${opts.label ? `(${opts.label})` : ''} ${opts.journeyContext ? `in ${opts.journeyContext} context` : ''}`,
      { transactionId, journeyContext: opts.journeyContext }
    );

    while (true) {
      try {
        // Create a timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new TransactionError(
              `Transaction ${transactionId} timed out after ${opts.timeout}ms`,
              TransactionErrorType.TIMEOUT,
              true
            ));
          }, opts.timeout);
        });

        // Create the transaction promise
        const transactionPromise = this.prisma.$transaction(
          async (tx) => {
            // Add transaction metadata to the transaction client
            const txWithMeta = this.addTransactionMetadata(tx, transactionId, opts);
            return await fn(txWithMeta);
          },
          {
            isolationLevel: opts.isolationLevel as Prisma.TransactionIsolationLevel,
            maxWait: opts.timeout,
            timeout: opts.timeout
          }
        );

        // Race between transaction and timeout
        const result = await Promise.race([transactionPromise, timeoutPromise]);
        
        // Log successful transaction
        this.logger.debug(
          `Transaction ${transactionId} completed successfully ${opts.journeyContext ? `in ${opts.journeyContext} context` : ''}`,
          { transactionId, journeyContext: opts.journeyContext, retries }
        );
        
        return result;
      } catch (error) {
        // Classify the error
        const classifiedError = this.classifyError(error, transactionId, opts.journeyContext);
        
        // Check if we should retry
        if (classifiedError.retryable && retries < opts.maxRetries) {
          retries++;
          const backoffTime = this.calculateBackoff(retries);
          
          this.logger.warn(
            `Transaction ${transactionId} failed with retryable error: ${classifiedError.message}. Retrying (${retries}/${opts.maxRetries}) after ${backoffTime}ms backoff...`,
            { transactionId, journeyContext: opts.journeyContext, errorType: classifiedError.type, retries }
          );
          
          // Wait for backoff period
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          continue;
        }
        
        // Log the final error
        this.logger.error(
          `Transaction ${transactionId} failed: ${classifiedError.message}`,
          { 
            transactionId, 
            journeyContext: opts.journeyContext, 
            errorType: classifiedError.type,
            retries,
            stack: classifiedError.stack
          }
        );
        
        throw classifiedError;
      }
    }
  }

  /**
   * Executes a function within a transaction specific to a journey context.
   * 
   * @param journeyContext The journey context ('health', 'care', 'plan')
   * @param fn The function to execute within the transaction
   * @param options Transaction options
   * @returns The result of the function execution
   */
  async executeInJourneyTransaction<T>(
    journeyContext: 'health' | 'care' | 'plan',
    fn: (prisma: Prisma.TransactionClient) => Promise<T>,
    options: Omit<TransactionOptions, 'journeyContext'> = {}
  ): Promise<T> {
    return this.executeInTransaction(fn, { ...options, journeyContext });
  }

  /**
   * Executes a distributed transaction across multiple journey contexts.
   * Uses a two-phase approach to ensure data consistency across services.
   * 
   * @param contexts Array of journey contexts involved in the transaction
   * @param fn The function to execute within the distributed transaction
   * @param options Transaction options
   * @returns The result of the function execution
   * @throws TransactionError if the distributed transaction fails
   */
  async executeDistributedTransaction<T>(
    contexts: Array<'health' | 'care' | 'plan'>,
    fn: (clients: Record<'health' | 'care' | 'plan', Prisma.TransactionClient>) => Promise<T>,
    options: Omit<TransactionOptions, 'journeyContext'> = {}
  ): Promise<T> {
    const transactionId = randomUUID();
    const opts = { ...DEFAULT_TRANSACTION_OPTIONS, ...options, label: options.label || 'distributed' };
    
    this.logger.debug(
      `Starting distributed transaction ${transactionId} across contexts: ${contexts.join(', ')}`,
      { transactionId, contexts }
    );
    
    // Phase 1: Prepare - Start transactions in all contexts
    const transactions: Record<string, Prisma.TransactionClient> = {};
    const transactionPromises: Promise<void>[] = [];
    
    try {
      // Start transactions in all contexts
      for (const context of contexts) {
        transactionPromises.push(
          this.prisma.$transaction(
            async (tx) => {
              const txWithMeta = this.addTransactionMetadata(tx, transactionId, { ...opts, journeyContext: context });
              transactions[context] = txWithMeta;
              
              // Prepare phase - create a savepoint
              await tx.$executeRawUnsafe(`SAVEPOINT distributed_tx_${transactionId.replace(/-/g, '_')}`);
            },
            {
              isolationLevel: opts.isolationLevel as Prisma.TransactionIsolationLevel,
              maxWait: opts.timeout,
              timeout: opts.timeout
            }
          )
        );
      }
      
      await Promise.all(transactionPromises);
      
      // Phase 2: Execute the transaction function
      const result = await fn(transactions as Record<'health' | 'care' | 'plan', Prisma.TransactionClient>);
      
      // Phase 3: Commit all transactions
      for (const context of contexts) {
        await transactions[context].$executeRawUnsafe('COMMIT');
      }
      
      this.logger.debug(
        `Distributed transaction ${transactionId} completed successfully across contexts: ${contexts.join(', ')}`,
        { transactionId, contexts }
      );
      
      return result;
    } catch (error) {
      // Rollback all transactions
      for (const context of contexts) {
        if (transactions[context]) {
          try {
            await transactions[context].$executeRawUnsafe(
              `ROLLBACK TO SAVEPOINT distributed_tx_${transactionId.replace(/-/g, '_')}`
            );
            await transactions[context].$executeRawUnsafe('ROLLBACK');
          } catch (rollbackError) {
            this.logger.error(
              `Failed to rollback transaction in context ${context}: ${rollbackError.message}`,
              { transactionId, context, error: rollbackError }
            );
          }
        }
      }
      
      const classifiedError = this.classifyError(
        error, 
        transactionId, 
        contexts.join(',')
      );
      
      classifiedError.type = TransactionErrorType.DISTRIBUTED;
      
      this.logger.error(
        `Distributed transaction ${transactionId} failed: ${classifiedError.message}`,
        { 
          transactionId, 
          contexts, 
          errorType: classifiedError.type,
          stack: classifiedError.stack
        }
      );
      
      throw classifiedError;
    }
  }

  /**
   * Adds metadata to a transaction client for tracking and debugging.
   * 
   * @param tx The transaction client
   * @param transactionId The transaction ID
   * @param options Transaction options
   * @returns The transaction client with metadata
   */
  private addTransactionMetadata(
    tx: Prisma.TransactionClient,
    transactionId: string,
    options: TransactionOptions
  ): Prisma.TransactionClient {
    // Add transaction metadata to the client for tracking
    // This is a non-standard extension but useful for debugging
    const txWithMeta = tx as Prisma.TransactionClient & {
      $transactionId: string;
      $journeyContext?: string;
      $label?: string;
      $startTime: number;
    };
    
    txWithMeta.$transactionId = transactionId;
    txWithMeta.$journeyContext = options.journeyContext;
    txWithMeta.$label = options.label;
    txWithMeta.$startTime = Date.now();
    
    return txWithMeta;
  }

  /**
   * Classifies a database error into a specific transaction error type.
   * 
   * @param error The original error
   * @param transactionId The transaction ID
   * @param journeyContext The journey context
   * @returns A classified TransactionError
   */
  private classifyError(error: any, transactionId: string, journeyContext?: string): TransactionError {
    // Already classified error
    if (error instanceof TransactionError) {
      error.transactionId = transactionId;
      error.journeyContext = journeyContext;
      return error;
    }
    
    // Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Unique constraint violation
      if (error.code === 'P2002') {
        return new TransactionError(
          `Unique constraint violation on ${error.meta?.target}`,
          TransactionErrorType.CONSTRAINT,
          false,
          error
        );
      }
      
      // Foreign key constraint violation
      if (error.code === 'P2003') {
        return new TransactionError(
          `Foreign key constraint violation on ${error.meta?.field_name}`,
          TransactionErrorType.CONSTRAINT,
          false,
          error
        );
      }
      
      // Record not found
      if (error.code === 'P2025') {
        return new TransactionError(
          `Record not found: ${error.meta?.cause}`,
          TransactionErrorType.CONSTRAINT,
          false,
          error
        );
      }
    }
    
    // Prisma connection errors
    if (error instanceof Prisma.PrismaClientInitializationError ||
        error instanceof Prisma.PrismaClientRustPanicError) {
      return new TransactionError(
        `Database connection error: ${error.message}`,
        TransactionErrorType.CONNECTION,
        true,
        error
      );
    }
    
    // Timeout errors
    if (error.message && error.message.includes('timeout')) {
      return new TransactionError(
        `Transaction timeout: ${error.message}`,
        TransactionErrorType.TIMEOUT,
        true,
        error
      );
    }
    
    // Deadlock errors - check for specific PostgreSQL error codes
    if (error.code === '40P01' || (error.message && error.message.toLowerCase().includes('deadlock'))) {
      return new TransactionError(
        `Deadlock detected: ${error.message}`,
        TransactionErrorType.DEADLOCK,
        true,
        error
      );
    }
    
    // Default to unknown error
    return new TransactionError(
      `Unknown transaction error: ${error.message || 'No error message'}`,
      TransactionErrorType.UNKNOWN,
      false,
      error
    );
  }

  /**
   * Calculates exponential backoff time for retries.
   * 
   * @param retryCount The current retry count
   * @returns Backoff time in milliseconds
   */
  private calculateBackoff(retryCount: number): number {
    // Exponential backoff with jitter
    const baseBackoff = Math.pow(2, retryCount) * 100; // 100ms, 200ms, 400ms, 800ms, etc.
    const jitter = Math.random() * 100; // Add up to 100ms of random jitter
    return Math.min(baseBackoff + jitter, 5000); // Cap at 5 seconds
  }
}

/**
 * Utility functions for common transaction patterns.
 */
export const transactionUtils = {
  /**
   * Determines the appropriate isolation level based on the operation type.
   * 
   * @param operationType The type of operation ('read', 'write', 'mixed')
   * @returns The recommended isolation level
   */
  getIsolationLevel(operationType: 'read' | 'write' | 'mixed'): TransactionIsolationLevel {
    switch (operationType) {
      case 'read':
        return TransactionIsolationLevel.READ_COMMITTED;
      case 'write':
        return TransactionIsolationLevel.REPEATABLE_READ;
      case 'mixed':
        return TransactionIsolationLevel.SERIALIZABLE;
      default:
        return TransactionIsolationLevel.READ_COMMITTED;
    }
  },
  
  /**
   * Creates a transaction manager instance with the provided Prisma client.
   * 
   * @param prismaClient The Prisma client instance
   * @returns A new TransactionManager instance
   */
  createTransactionManager(prismaClient: PrismaClient): TransactionManager {
    return new TransactionManager(prismaClient);
  },
  
  /**
   * Executes a function within a transaction with the provided Prisma client.
   * 
   * @param prismaClient The Prisma client instance
   * @param fn The function to execute within the transaction
   * @param options Transaction options
   * @returns The result of the function execution
   */
  async executeTransaction<T>(
    prismaClient: PrismaClient,
    fn: (prisma: Prisma.TransactionClient) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const manager = new TransactionManager(prismaClient);
    return manager.executeInTransaction(fn, options);
  },
  
  /**
   * Executes a function within a journey-specific transaction.
   * 
   * @param prismaClient The Prisma client instance
   * @param journeyContext The journey context ('health', 'care', 'plan')
   * @param fn The function to execute within the transaction
   * @param options Transaction options
   * @returns The result of the function execution
   */
  async executeJourneyTransaction<T>(
    prismaClient: PrismaClient,
    journeyContext: 'health' | 'care' | 'plan',
    fn: (prisma: Prisma.TransactionClient) => Promise<T>,
    options: Omit<TransactionOptions, 'journeyContext'> = {}
  ): Promise<T> {
    const manager = new TransactionManager(prismaClient);
    return manager.executeInJourneyTransaction(journeyContext, fn, options);
  },
  
  /**
   * Executes a distributed transaction across multiple journey contexts.
   * 
   * @param prismaClient The Prisma client instance
   * @param contexts Array of journey contexts involved in the transaction
   * @param fn The function to execute within the distributed transaction
   * @param options Transaction options
   * @returns The result of the function execution
   */
  async executeDistributedTransaction<T>(
    prismaClient: PrismaClient,
    contexts: Array<'health' | 'care' | 'plan'>,
    fn: (clients: Record<'health' | 'care' | 'plan', Prisma.TransactionClient>) => Promise<T>,
    options: Omit<TransactionOptions, 'journeyContext'> = {}
  ): Promise<T> {
    const manager = new TransactionManager(prismaClient);
    return manager.executeDistributedTransaction(contexts, fn, options);
  }
};

/**
 * Creates a transaction manager with the provided Prisma client.
 * 
 * @param prismaClient The Prisma client instance
 * @returns A new TransactionManager instance
 */
export function createTransactionManager(prismaClient: PrismaClient): TransactionManager {
  return new TransactionManager(prismaClient);
}

/**
 * Executes a function within a transaction with the provided Prisma client.
 * 
 * @param prismaClient The Prisma client instance
 * @param fn The function to execute within the transaction
 * @param options Transaction options
 * @returns The result of the function execution
 */
export async function executeTransaction<T>(
  prismaClient: PrismaClient,
  fn: (prisma: Prisma.TransactionClient) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const manager = new TransactionManager(prismaClient);
  return manager.executeInTransaction(fn, options);
}

/**
 * Executes a function within a journey-specific transaction.
 * 
 * @param prismaClient The Prisma client instance
 * @param journeyContext The journey context ('health', 'care', 'plan')
 * @param fn The function to execute within the transaction
 * @param options Transaction options
 * @returns The result of the function execution
 */
export async function executeJourneyTransaction<T>(
  prismaClient: PrismaClient,
  journeyContext: 'health' | 'care' | 'plan',
  fn: (prisma: Prisma.TransactionClient) => Promise<T>,
  options: Omit<TransactionOptions, 'journeyContext'> = {}
): Promise<T> {
  const manager = new TransactionManager(prismaClient);
  return manager.executeInJourneyTransaction(journeyContext, fn, options);
}

/**
 * Executes a distributed transaction across multiple journey contexts.
 * 
 * @param prismaClient The Prisma client instance
 * @param contexts Array of journey contexts involved in the transaction
 * @param fn The function to execute within the distributed transaction
 * @param options Transaction options
 * @returns The result of the function execution
 */
export async function executeDistributedTransaction<T>(
  prismaClient: PrismaClient,
  contexts: Array<'health' | 'care' | 'plan'>,
  fn: (clients: Record<'health' | 'care' | 'plan', Prisma.TransactionClient>) => Promise<T>,
  options: Omit<TransactionOptions, 'journeyContext'> = {}
): Promise<T> {
  const manager = new TransactionManager(prismaClient);
  return manager.executeDistributedTransaction(contexts, fn, options);
}
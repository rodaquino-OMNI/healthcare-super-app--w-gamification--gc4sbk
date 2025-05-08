/**
 * @file transaction.interface.ts
 * @description Defines core interfaces and types for database transaction management across the application.
 * These interfaces ensure type safety and consistent transaction management patterns across all services.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import {
  TransactionIsolationLevel,
  TransactionOptions,
  TransactionCallback,
  Transaction,
  TransactionState,
  TransactionType,
  TransactionMetadata,
  TransactionManager
} from '../types/transaction.types';

/**
 * Interface for a transaction client that can be used to execute database operations
 * within a transaction context. This provides a consistent API for transaction operations
 * across different database technologies.
 */
export interface TransactionClient {
  /**
   * The underlying Prisma transaction client
   */
  readonly prisma: Prisma.TransactionClient;

  /**
   * Unique identifier for the transaction
   */
  readonly id: string;

  /**
   * Current state of the transaction
   */
  readonly state: TransactionState;

  /**
   * Metadata about the transaction
   */
  readonly metadata: TransactionMetadata;

  /**
   * Executes a raw SQL query within the transaction
   * @param query The SQL query to execute
   * @param values Parameters for the query
   * @returns The query result
   */
  executeRaw(query: string, ...values: any[]): Promise<any>;

  /**
   * Executes a raw SQL query with named parameters within the transaction
   * @param query The SQL query to execute
   * @param values Named parameters for the query
   * @returns The query result
   */
  executeRawUnsafe(query: string, values?: Record<string, any>): Promise<any>;

  /**
   * Creates a savepoint within the transaction
   * @param name Optional name for the savepoint
   * @returns The name of the created savepoint
   */
  createSavepoint(name?: string): Promise<string>;

  /**
   * Rolls back to a previously created savepoint
   * @param name The name of the savepoint to roll back to
   */
  rollbackToSavepoint(name: string): Promise<void>;

  /**
   * Commits the transaction
   * This should only be called by the transaction manager
   */
  commit(): Promise<void>;

  /**
   * Rolls back the transaction
   * This should only be called by the transaction manager
   */
  rollback(): Promise<void>;
}

/**
 * Interface for a factory that creates transaction clients
 */
export interface TransactionClientFactory {
  /**
   * Creates a new transaction client with the specified options
   * @param options Options for the transaction
   * @returns The created transaction client
   */
  createTransactionClient(options?: Partial<TransactionOptions>): Promise<TransactionClient>;
}

/**
 * Interface for a service that executes operations within a transaction
 */
export interface TransactionExecutor {
  /**
   * Executes a callback function within a transaction
   * @param callback The function to execute within the transaction
   * @param options Options for the transaction
   * @returns The result of the callback function
   */
  executeInTransaction<T>(
    callback: (client: TransactionClient) => Promise<T>,
    options?: Partial<TransactionOptions>
  ): Promise<T>;

  /**
   * Executes a callback function within a transaction with retry logic for transient errors
   * @param callback The function to execute within the transaction
   * @param options Options for the transaction and retry
   * @returns The result of the callback function
   */
  executeWithRetry<T>(
    callback: (client: TransactionClient) => Promise<T>,
    options?: Partial<TransactionOptions> & {
      maxRetries?: number;
      baseDelayMs?: number;
      maxDelayMs?: number;
      useJitter?: boolean;
    }
  ): Promise<T>;
}

/**
 * Interface for a context that provides transaction management for a specific journey
 */
export interface TransactionContext {
  /**
   * The journey context identifier
   */
  readonly journeyContext: string;

  /**
   * Executes a callback function within a transaction
   * @param callback The function to execute within the transaction
   * @param options Options for the transaction
   * @returns The result of the callback function
   */
  executeTransaction<T>(
    callback: (client: TransactionClient) => Promise<T>,
    options?: Partial<TransactionOptions>
  ): Promise<T>;

  /**
   * Gets the current transaction client if executing within a transaction
   * @returns The current transaction client, or null if not in a transaction
   */
  getCurrentTransaction(): TransactionClient | null;

  /**
   * Checks if the current execution context is within a transaction
   * @returns True if executing within a transaction, false otherwise
   */
  isInTransaction(): boolean;
}

/**
 * Interface for a participant in a distributed transaction
 */
export interface DistributedTransactionParticipant {
  /**
   * Unique identifier for the participant
   */
  readonly participantId: string;

  /**
   * Prepares the participant for commit (Phase 1 of two-phase commit)
   * @returns True if the participant is prepared, false otherwise
   */
  prepare(): Promise<boolean>;

  /**
   * Commits the participant's changes (Phase 2 of two-phase commit)
   * @returns True if the commit was successful, false otherwise
   */
  commit(): Promise<boolean>;

  /**
   * Rolls back the participant's changes
   */
  rollback(): Promise<void>;
}

/**
 * Interface for a coordinator of distributed transactions
 */
export interface DistributedTransactionCoordinator {
  /**
   * Creates a new distributed transaction
   * @param transactionId Unique identifier for the distributed transaction
   * @param options Options for the transaction
   * @returns The created distributed transaction
   */
  createDistributedTransaction(
    transactionId: string,
    options?: Partial<TransactionOptions>
  ): Promise<Transaction<any>>;

  /**
   * Registers a participant in a distributed transaction
   * @param transactionId The ID of the distributed transaction
   * @param participant The participant to register
   */
  registerParticipant(
    transactionId: string,
    participant: DistributedTransactionParticipant
  ): Promise<void>;

  /**
   * Executes a callback function within a distributed transaction
   * @param transactionId The ID of the distributed transaction
   * @param callback The function to execute within the transaction
   * @param options Options for the transaction
   * @returns The result of the callback function
   */
  executeInDistributedTransaction<T>(
    transactionId: string,
    callback: (client: TransactionClient) => Promise<T>,
    options?: Partial<TransactionOptions>
  ): Promise<T>;
}

/**
 * Type for a function that determines if an error is retryable
 */
export type RetryableErrorDetector = (error: any) => boolean;

/**
 * Interface for a strategy that determines retry behavior for failed transactions
 */
export interface RetryStrategy {
  /**
   * Determines if a failed operation should be retried
   * @param error The error that caused the failure
   * @param attempt The current attempt number (1-based)
   * @returns True if the operation should be retried, false otherwise
   */
  shouldRetry(error: any, attempt: number): boolean;

  /**
   * Gets the delay in milliseconds before the next retry attempt
   * @param attempt The current attempt number (1-based)
   * @returns The delay in milliseconds
   */
  getDelay(attempt: number): number;
}

/**
 * Interface for a factory that creates retry strategies
 */
export interface RetryStrategyFactory {
  /**
   * Creates a retry strategy with the specified options
   * @param options Options for the retry strategy
   * @returns The created retry strategy
   */
  createRetryStrategy(options?: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    useJitter?: boolean;
    retryableErrorDetector?: RetryableErrorDetector;
  }): RetryStrategy;
}

/**
 * Re-export transaction types from transaction.types.ts for convenience
 */
export {
  TransactionIsolationLevel,
  TransactionOptions,
  TransactionCallback,
  Transaction,
  TransactionState,
  TransactionType,
  TransactionMetadata,
  TransactionManager
};
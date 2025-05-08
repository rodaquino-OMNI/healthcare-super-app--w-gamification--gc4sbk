/**
 * @file transaction.types.ts
 * @description Defines TypeScript interfaces and types for database transaction management,
 * providing strongly-typed options for isolation levels, timeout settings, and retry strategies.
 * These types ensure consistent transaction handling across all journey services and enable
 * proper error recovery during transaction failures.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { DatabaseErrorType } from '../errors/database-error.types';

/**
 * Enum representing the standard SQL transaction isolation levels.
 * Each level provides different guarantees for transaction behavior.
 */
export enum TransactionIsolationLevel {
  /**
   * Allows transactions to read uncommitted changes from other transactions.
   * May lead to dirty reads, non-repeatable reads, and phantom reads.
   */
  READ_UNCOMMITTED = 'READ UNCOMMITTED',

  /**
   * Prevents dirty reads but allows non-repeatable reads and phantom reads.
   * Default isolation level for most database systems.
   */
  READ_COMMITTED = 'READ COMMITTED',

  /**
   * Prevents dirty reads and non-repeatable reads but allows phantom reads.
   * Ensures that data read during a transaction will not change if read again.
   */
  REPEATABLE_READ = 'REPEATABLE READ',

  /**
   * Prevents dirty reads, non-repeatable reads, and phantom reads.
   * Provides the highest isolation but may lead to more contention.
   */
  SERIALIZABLE = 'SERIALIZABLE'
}

/**
 * Maps Prisma's transaction isolation levels to our standardized enum.
 * This ensures consistent usage across different database technologies.
 */
export const PRISMA_ISOLATION_LEVEL_MAP: Record<TransactionIsolationLevel, Prisma.TransactionIsolationLevel> = {
  [TransactionIsolationLevel.READ_UNCOMMITTED]: 'ReadUncommitted',
  [TransactionIsolationLevel.READ_COMMITTED]: 'ReadCommitted',
  [TransactionIsolationLevel.REPEATABLE_READ]: 'RepeatableRead',
  [TransactionIsolationLevel.SERIALIZABLE]: 'Serializable'
};

/**
 * Enum representing the possible states of a transaction.
 */
export enum TransactionState {
  /** Transaction has been created but not yet started */
  CREATED = 'CREATED',
  /** Transaction has been started and is active */
  ACTIVE = 'ACTIVE',
  /** Transaction has been committed successfully */
  COMMITTED = 'COMMITTED',
  /** Transaction has been rolled back */
  ROLLED_BACK = 'ROLLED_BACK',
  /** Transaction has failed due to an error */
  FAILED = 'FAILED'
}

/**
 * Enum representing the types of transactions supported by the system.
 */
export enum TransactionType {
  /** Standard database transaction */
  STANDARD = 'STANDARD',
  /** Nested transaction that is part of a parent transaction */
  NESTED = 'NESTED',
  /** Distributed transaction across multiple services */
  DISTRIBUTED = 'DISTRIBUTED'
}

/**
 * Interface for transaction timeout configuration.
 */
export interface TransactionTimeoutOptions {
  /**
   * Maximum time in milliseconds that a transaction can run before timing out.
   * Default is 30000 (30 seconds).
   */
  timeoutMs: number;

  /**
   * Whether to automatically rollback the transaction on timeout.
   * Default is true.
   */
  autoRollbackOnTimeout: boolean;
}

/**
 * Interface for transaction retry configuration.
 */
export interface TransactionRetryOptions {
  /**
   * Maximum number of retry attempts for a failed transaction.
   * Default is 3.
   */
  maxRetries: number;

  /**
   * Base delay in milliseconds between retry attempts.
   * Used for exponential backoff calculation.
   * Default is 100ms.
   */
  baseDelayMs: number;

  /**
   * Maximum delay in milliseconds between retry attempts.
   * Default is 5000ms (5 seconds).
   */
  maxDelayMs: number;

  /**
   * Whether to add jitter to retry delays to prevent thundering herd problems.
   * Default is true.
   */
  useJitter: boolean;

  /**
   * Types of database errors that should trigger a retry.
   * Default is connection and deadlock errors.
   */
  retryableErrors: DatabaseErrorType[];
}

/**
 * Interface for transaction logging configuration.
 */
export interface TransactionLoggingOptions {
  /**
   * Whether to log transaction events (start, commit, rollback).
   * Default is true.
   */
  logEvents: boolean;

  /**
   * Whether to log transaction queries for debugging.
   * Default is false in production, true in development.
   */
  logQueries: boolean;

  /**
   * Whether to log transaction performance metrics.
   * Default is true.
   */
  logPerformance: boolean;
}

/**
 * Interface for savepoint configuration in nested transactions.
 */
export interface SavepointOptions {
  /**
   * Whether to use savepoints for nested transactions.
   * Default is true.
   */
  useSavepoints: boolean;

  /**
   * Prefix to use for savepoint names.
   * Default is 'SP'.
   */
  savepointPrefix: string;
}

/**
 * Interface for distributed transaction configuration.
 */
export interface DistributedTransactionOptions {
  /**
   * Whether this transaction is part of a distributed transaction.
   * Default is false.
   */
  isDistributed: boolean;

  /**
   * Unique identifier for the distributed transaction.
   * Required if isDistributed is true.
   */
  transactionId?: string;

  /**
   * Timeout in milliseconds for the prepare phase of a two-phase commit.
   * Default is 5000ms (5 seconds).
   */
  prepareTimeoutMs: number;

  /**
   * Timeout in milliseconds for the commit phase of a two-phase commit.
   * Default is 5000ms (5 seconds).
   */
  commitTimeoutMs: number;
}

/**
 * Comprehensive interface for transaction configuration options.
 */
export interface TransactionOptions {
  /**
   * The isolation level for the transaction.
   * Default is READ_COMMITTED.
   */
  isolationLevel?: TransactionIsolationLevel;

  /**
   * Configuration for transaction timeouts.
   */
  timeout?: Partial<TransactionTimeoutOptions>;

  /**
   * Configuration for transaction retries.
   */
  retry?: Partial<TransactionRetryOptions>;

  /**
   * Configuration for transaction logging.
   */
  logging?: Partial<TransactionLoggingOptions>;

  /**
   * Configuration for savepoints in nested transactions.
   */
  savepoint?: Partial<SavepointOptions>;

  /**
   * Configuration for distributed transactions.
   */
  distributed?: Partial<DistributedTransactionOptions>;

  /**
   * The type of transaction.
   * Default is STANDARD.
   */
  type?: TransactionType;

  /**
   * Reference to the parent transaction for nested transactions.
   */
  parent?: Transaction<any>;

  /**
   * Journey context for the transaction.
   */
  journeyContext?: string;
}

/**
 * Default transaction options used when no options are provided.
 */
export const DEFAULT_TRANSACTION_OPTIONS: Required<TransactionOptions> = {
  isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
  timeout: {
    timeoutMs: 30000, // 30 seconds
    autoRollbackOnTimeout: true
  },
  retry: {
    maxRetries: 3,
    baseDelayMs: 100,
    maxDelayMs: 5000,
    useJitter: true,
    retryableErrors: [DatabaseErrorType.CONNECTION, DatabaseErrorType.TRANSACTION]
  },
  logging: {
    logEvents: true,
    logQueries: process.env.NODE_ENV !== 'production',
    logPerformance: true
  },
  savepoint: {
    useSavepoints: true,
    savepointPrefix: 'SP'
  },
  distributed: {
    isDistributed: false,
    prepareTimeoutMs: 5000,
    commitTimeoutMs: 5000
  },
  type: TransactionType.STANDARD,
  parent: undefined,
  journeyContext: 'default'
};

/**
 * Interface for transaction metadata.
 */
export interface TransactionMetadata {
  /**
   * Unique identifier for the transaction.
   */
  id: string;

  /**
   * Timestamp when the transaction was created.
   */
  createdAt: Date;

  /**
   * Timestamp when the transaction was started.
   */
  startedAt?: Date;

  /**
   * Timestamp when the transaction was completed (committed or rolled back).
   */
  completedAt?: Date;

  /**
   * Current state of the transaction.
   */
  state: TransactionState;

  /**
   * Type of the transaction.
   */
  type: TransactionType;

  /**
   * Isolation level of the transaction.
   */
  isolationLevel: TransactionIsolationLevel;

  /**
   * Journey context for the transaction.
   */
  journeyContext: string;

  /**
   * Parent transaction ID for nested transactions.
   */
  parentId?: string;

  /**
   * Number of retry attempts made for this transaction.
   */
  retryCount: number;

  /**
   * Error that caused the transaction to fail, if any.
   */
  error?: Error;
}

/**
 * Type for a function that executes within a transaction and returns a result.
 * @template T The type of the result returned by the function.
 */
export type TransactionCallback<T> = (client: PrismaClient) => Promise<T>;

/**
 * Interface for a transaction object that manages a database transaction.
 * @template T The type of the result returned by the transaction.
 */
export interface Transaction<T> {
  /**
   * Unique identifier for the transaction.
   */
  readonly id: string;

  /**
   * Current state of the transaction.
   */
  readonly state: TransactionState;

  /**
   * Metadata about the transaction.
   */
  readonly metadata: TransactionMetadata;

  /**
   * Options used to configure the transaction.
   */
  readonly options: Required<TransactionOptions>;

  /**
   * Starts the transaction.
   * @returns A promise that resolves when the transaction has started.
   */
  start(): Promise<void>;

  /**
   * Commits the transaction.
   * @returns A promise that resolves when the transaction has been committed.
   */
  commit(): Promise<void>;

  /**
   * Rolls back the transaction.
   * @returns A promise that resolves when the transaction has been rolled back.
   */
  rollback(): Promise<void>;

  /**
   * Executes a callback function within the transaction.
   * @param callback The function to execute within the transaction.
   * @returns A promise that resolves with the result of the callback function.
   */
  execute(callback: TransactionCallback<T>): Promise<T>;

  /**
   * Creates a savepoint within the transaction.
   * @param name Optional name for the savepoint. If not provided, a name will be generated.
   * @returns A promise that resolves with the name of the created savepoint.
   */
  createSavepoint(name?: string): Promise<string>;

  /**
   * Rolls back to a previously created savepoint.
   * @param name The name of the savepoint to roll back to.
   * @returns A promise that resolves when the rollback to the savepoint is complete.
   */
  rollbackToSavepoint(name: string): Promise<void>;

  /**
   * Creates a nested transaction within this transaction.
   * @param options Options for the nested transaction.
   * @returns A promise that resolves with the nested transaction.
   */
  createNestedTransaction<U>(options?: Partial<TransactionOptions>): Promise<Transaction<U>>;
}

/**
 * Interface for a transaction manager that creates and manages transactions.
 */
export interface TransactionManager {
  /**
   * Creates a new transaction with the specified options.
   * @param options Options for the transaction.
   * @returns A promise that resolves with the created transaction.
   */
  createTransaction<T>(options?: Partial<TransactionOptions>): Promise<Transaction<T>>;

  /**
   * Executes a callback function within a transaction.
   * @param callback The function to execute within the transaction.
   * @param options Options for the transaction.
   * @returns A promise that resolves with the result of the callback function.
   */
  executeTransaction<T>(
    callback: TransactionCallback<T>,
    options?: Partial<TransactionOptions>
  ): Promise<T>;

  /**
   * Creates a distributed transaction that spans multiple services.
   * @param transactionId Unique identifier for the distributed transaction.
   * @param options Options for the transaction.
   * @returns A promise that resolves with the created distributed transaction.
   */
  createDistributedTransaction<T>(
    transactionId: string,
    options?: Partial<TransactionOptions>
  ): Promise<Transaction<T>>;

  /**
   * Gets an active transaction by its ID.
   * @param transactionId The ID of the transaction to get.
   * @returns A promise that resolves with the transaction, or null if not found.
   */
  getTransaction(transactionId: string): Promise<Transaction<any> | null>;

  /**
   * Gets all active transactions.
   * @returns A promise that resolves with an array of all active transactions.
   */
  getActiveTransactions(): Promise<Transaction<any>[]>;

  /**
   * Gets all active transactions for a specific journey context.
   * @param journeyContext The journey context to filter by.
   * @returns A promise that resolves with an array of active transactions for the journey.
   */
  getJourneyTransactions(journeyContext: string): Promise<Transaction<any>[]>;
}
/**
 * @file transaction.interface.ts
 * @description Defines core interfaces and types for database transaction management across the application.
 * Contains the TransactionClient interface with methods for transaction operations, TransactionOptions
 * interface for configuration, and TransactionIsolationLevel enum for specifying isolation levels.
 */

import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Standard SQL transaction isolation levels.
 * Defines the behavior of concurrent transactions and how they interact with each other.
 */
export enum TransactionIsolationLevel {
  /**
   * Allows transactions to read uncommitted data from other transactions.
   * Provides the highest level of concurrency but the lowest level of isolation.
   * May lead to dirty reads, non-repeatable reads, and phantom reads.
   */
  READ_UNCOMMITTED = 'READ UNCOMMITTED',

  /**
   * Prevents dirty reads but allows non-repeatable reads and phantom reads.
   * Each transaction only sees committed data from other transactions.
   * Default isolation level for most database systems.
   */
  READ_COMMITTED = 'READ COMMITTED',

  /**
   * Prevents dirty reads and non-repeatable reads but allows phantom reads.
   * Ensures that if a transaction reads a row, that row will remain unchanged
   * until the transaction completes.
   */
  REPEATABLE_READ = 'REPEATABLE READ',

  /**
   * Provides the highest level of isolation by preventing dirty reads,
   * non-repeatable reads, and phantom reads.
   * Transactions are completely isolated from each other.
   * May lead to more contention and potential deadlocks.
   */
  SERIALIZABLE = 'SERIALIZABLE'
}

/**
 * Retry strategy for failed transactions.
 * Defines how transaction failures should be handled and retried.
 */
export interface TransactionRetryStrategy {
  /**
   * Maximum number of retry attempts before giving up.
   * @default 3
   */
  maxRetries?: number;

  /**
   * Initial delay in milliseconds before the first retry attempt.
   * @default 100
   */
  initialDelay?: number;

  /**
   * Factor by which the delay increases with each retry attempt (exponential backoff).
   * @default 2
   */
  backoffFactor?: number;

  /**
   * Maximum delay in milliseconds between retry attempts.
   * @default 5000
   */
  maxDelay?: number;

  /**
   * List of error types that should trigger a retry attempt.
   * If not specified, all transient errors will be retried.
   */
  retryableErrors?: Array<string | RegExp>;

  /**
   * List of error types that should never be retried, regardless of other settings.
   */
  nonRetryableErrors?: Array<string | RegExp>;

  /**
   * Optional callback to determine if a specific error should be retried.
   * Takes precedence over retryableErrors and nonRetryableErrors if provided.
   * @param error The error that occurred during the transaction
   * @param attempt The current retry attempt (0-based)
   * @returns True if the error should be retried, false otherwise
   */
  shouldRetry?: (error: Error, attempt: number) => boolean;

  /**
   * Optional callback to calculate the delay before the next retry attempt.
   * If provided, overrides the default exponential backoff calculation.
   * @param attempt The current retry attempt (0-based)
   * @param error The error that occurred during the transaction
   * @returns Delay in milliseconds before the next retry attempt
   */
  calculateDelay?: (attempt: number, error: Error) => number;
}

/**
 * Options for configuring transaction behavior.
 */
export interface TransactionOptions {
  /**
   * Isolation level for the transaction.
   * @default TransactionIsolationLevel.READ_COMMITTED
   */
  isolationLevel?: TransactionIsolationLevel;

  /**
   * Maximum time in milliseconds that the transaction is allowed to run.
   * If the transaction exceeds this time, it will be automatically rolled back.
   * @default 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Retry strategy for handling transaction failures.
   * If not provided, failed transactions will not be automatically retried.
   */
  retry?: TransactionRetryStrategy;

  /**
   * Whether to use a read-only transaction.
   * Read-only transactions can be optimized by the database for better performance.
   * @default false
   */
  readOnly?: boolean;

  /**
   * Whether to defer the start of the transaction until the first database operation.
   * This can be useful for optimizing transaction usage when it's not certain
   * if a transaction will be needed.
   * @default false
   */
  deferUntilFirstOperation?: boolean;

  /**
   * Type of operation being performed in this transaction.
   * Used for logging, metrics, and to recommend appropriate isolation levels.
   * Examples: 'read-only', 'write', 'critical-write', 'financial'
   */
  operationType?: string;

  /**
   * Whether to enable metrics collection for this transaction.
   * @default true
   */
  enableMetrics?: boolean;

  /**
   * Whether to enable logging for this transaction.
   * @default true
   */
  enableLogging?: boolean;

  /**
   * Journey context for the transaction.
   * Used to associate the transaction with a specific user journey.
   */
  journeyContext?: {
    journeyType: 'health' | 'care' | 'plan';
    userId?: string;
    sessionId?: string;
  };
}

/**
 * Represents a client that can be used within a transaction.
 * This is typically a Prisma client instance with an active transaction.
 */
export type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>;

/**
 * Callback function that executes within a transaction context.
 * @template T The return type of the callback function
 * @param tx The transaction client to use for database operations
 * @returns A promise that resolves to the result of the callback
 */
export type TransactionCallback<T> = (tx: TransactionClient) => Promise<T>;

/**
 * Result of a transaction execution, including metadata about the transaction.
 */
export interface TransactionResult<T> {
  /**
   * The result value returned by the transaction callback.
   */
  result: T;

  /**
   * Metadata about the transaction execution.
   */
  metadata: {
    /**
     * Unique identifier for the transaction.
     */
    transactionId: string;

    /**
     * Time when the transaction was started.
     */
    startedAt: Date;

    /**
     * Time when the transaction was completed.
     */
    completedAt: Date;

    /**
     * Duration of the transaction in milliseconds.
     */
    durationMs: number;

    /**
     * Number of retry attempts that were made, if any.
     */
    retryAttempts: number;

    /**
     * Whether the transaction was successful.
     */
    success: boolean;

    /**
     * Error that occurred during the transaction, if any.
     */
    error?: Error;

    /**
     * Isolation level that was used for the transaction.
     */
    isolationLevel: TransactionIsolationLevel;

    /**
     * Whether the transaction was read-only.
     */
    readOnly: boolean;

    /**
     * Journey context associated with the transaction, if any.
     */
    journeyContext?: {
      journeyType: 'health' | 'care' | 'plan';
      userId?: string;
      sessionId?: string;
    };
  };
}

/**
 * Interface for a transaction manager that handles transaction execution and lifecycle.
 */
export interface TransactionManager {
  /**
   * Executes a callback function within a transaction context.
   * @template T The return type of the callback function
   * @param callback The function to execute within the transaction
   * @param options Options for configuring the transaction behavior
   * @returns A promise that resolves to the result of the callback
   */
  executeTransaction<T>(callback: TransactionCallback<T>, options?: TransactionOptions): Promise<T>;

  /**
   * Executes a callback function within a transaction context and returns detailed transaction metadata.
   * @template T The return type of the callback function
   * @param callback The function to execute within the transaction
   * @param options Options for configuring the transaction behavior
   * @returns A promise that resolves to the result of the callback along with transaction metadata
   */
  executeTransactionWithMetadata<T>(
    callback: TransactionCallback<T>,
    options?: TransactionOptions
  ): Promise<TransactionResult<T>>;

  /**
   * Creates a new transaction client that can be used for database operations.
   * @param options Options for configuring the transaction behavior
   * @returns A promise that resolves to a transaction client
   */
  createTransaction(options?: TransactionOptions): Promise<TransactionClient>;

  /**
   * Commits a transaction that was created with createTransaction.
   * @param client The transaction client to commit
   * @returns A promise that resolves when the transaction is committed
   */
  commitTransaction(client: TransactionClient): Promise<void>;

  /**
   * Rolls back a transaction that was created with createTransaction.
   * @param client The transaction client to roll back
   * @returns A promise that resolves when the transaction is rolled back
   */
  rollbackTransaction(client: TransactionClient): Promise<void>;

  /**
   * Creates a savepoint within an existing transaction.
   * Savepoints allow for partial rollbacks within a transaction.
   * @param client The transaction client to create a savepoint for
   * @param name Optional name for the savepoint (auto-generated if not provided)
   * @returns A promise that resolves to the savepoint name
   */
  createSavepoint(client: TransactionClient, name?: string): Promise<string>;

  /**
   * Rolls back to a previously created savepoint.
   * @param client The transaction client to roll back
   * @param name The name of the savepoint to roll back to
   * @returns A promise that resolves when the rollback is complete
   */
  rollbackToSavepoint(client: TransactionClient, name: string): Promise<void>;

  /**
   * Releases a previously created savepoint.
   * @param client The transaction client to release the savepoint for
   * @param name The name of the savepoint to release
   * @returns A promise that resolves when the savepoint is released
   */
  releaseSavepoint(client: TransactionClient, name: string): Promise<void>;
}

/**
 * Options for configuring a distributed transaction across multiple services.
 */
export interface DistributedTransactionOptions extends TransactionOptions {
  /**
   * List of service names that participate in the distributed transaction.
   */
  participants: string[];

  /**
   * Timeout in milliseconds for the prepare phase of the two-phase commit protocol.
   * @default 5000 (5 seconds)
   */
  prepareTimeout?: number;

  /**
   * Timeout in milliseconds for the commit phase of the two-phase commit protocol.
   * @default 5000 (5 seconds)
   */
  commitTimeout?: number;

  /**
   * Strategy to use when a participant fails during the prepare phase.
   * - 'abort': Abort the entire transaction (default)
   * - 'continue': Continue with the remaining participants
   * @default 'abort'
   */
  prepareFailureStrategy?: 'abort' | 'continue';

  /**
   * Strategy to use when a participant fails during the commit phase.
   * - 'retry': Retry the commit operation until it succeeds (default)
   * - 'compensate': Execute compensation actions for already committed participants
   * @default 'retry'
   */
  commitFailureStrategy?: 'retry' | 'compensate';

  /**
   * Maximum number of retry attempts for the commit phase if commitFailureStrategy is 'retry'.
   * @default 10
   */
  maxCommitRetries?: number;
}

/**
 * Interface for a distributed transaction coordinator that manages transactions across multiple services.
 */
export interface DistributedTransactionCoordinator {
  /**
   * Executes a callback function within a distributed transaction context.
   * @template T The return type of the callback function
   * @param callback The function to execute within the distributed transaction
   * @param options Options for configuring the distributed transaction behavior
   * @returns A promise that resolves to the result of the callback
   */
  executeDistributedTransaction<T>(
    callback: TransactionCallback<T>,
    options: DistributedTransactionOptions
  ): Promise<T>;

  /**
   * Prepares a participant for a distributed transaction (first phase of two-phase commit).
   * @param transactionId The ID of the distributed transaction
   * @param participantId The ID of the participant
   * @returns A promise that resolves to true if the participant is prepared, false otherwise
   */
  prepareParticipant(transactionId: string, participantId: string): Promise<boolean>;

  /**
   * Commits a participant in a distributed transaction (second phase of two-phase commit).
   * @param transactionId The ID of the distributed transaction
   * @param participantId The ID of the participant
   * @returns A promise that resolves when the participant is committed
   */
  commitParticipant(transactionId: string, participantId: string): Promise<void>;

  /**
   * Aborts a participant in a distributed transaction.
   * @param transactionId The ID of the distributed transaction
   * @param participantId The ID of the participant
   * @returns A promise that resolves when the participant is aborted
   */
  abortParticipant(transactionId: string, participantId: string): Promise<void>;

  /**
   * Gets the status of a distributed transaction.
   * @param transactionId The ID of the distributed transaction
   * @returns A promise that resolves to the status of the distributed transaction
   */
  getTransactionStatus(transactionId: string): Promise<'preparing' | 'prepared' | 'committing' | 'committed' | 'aborting' | 'aborted' | 'unknown'>;
}
/**
 * @file transaction.service.ts
 * @description Injectable NestJS service that implements transaction management functionality.
 * Provides methods for starting, committing, and rolling back transactions with support for
 * different isolation levels, savepoints, and distributed transactions.
 */

import { Injectable, Logger, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma.service';
import {
  TransactionManager,
  TransactionClient,
  TransactionCallback,
  TransactionOptions,
  TransactionIsolationLevel,
  TransactionResult,
  NestedTransaction,
  DistributedTransactionOptions,
  DistributedTransactionCoordinator,
  TransactionRetryStrategy
} from '../types/transaction.types';
import {
  TransactionError,
  TransactionTimeoutError,
  DeadlockError,
  SerializationError,
  DistributedTransactionError,
  TransactionAbortedError,
  ConnectionLostError
} from './transaction.errors';
import { calculateBackoffDelay, isRetryableError, sleep } from './transaction.utils';

/**
 * Default transaction options
 */
const DEFAULT_TRANSACTION_OPTIONS: TransactionOptions = {
  isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
  timeout: 30000, // 30 seconds
  readOnly: false,
  deferUntilFirstOperation: false,
  retry: {
    maxRetries: 3,
    initialDelay: 100,
    backoffFactor: 2,
    maxDelay: 5000
  }
};

/**
 * Default distributed transaction options
 */
const DEFAULT_DISTRIBUTED_TRANSACTION_OPTIONS: DistributedTransactionOptions = {
  ...DEFAULT_TRANSACTION_OPTIONS,
  participants: [],
  prepareTimeout: 5000,
  commitTimeout: 5000,
  prepareFailureStrategy: 'abort',
  commitFailureStrategy: 'retry',
  maxCommitRetries: 10
};

/**
 * Map of PostgreSQL error codes to transaction error types
 */
const PG_ERROR_CODE_MAP = {
  '40001': SerializationError, // serialization_failure
  '40P01': DeadlockError, // deadlock_detected
  '57014': TransactionTimeoutError, // query_canceled due to statement_timeout
  '57P01': TransactionAbortedError, // admin_shutdown
  '57P02': TransactionAbortedError, // crash_shutdown
  '57P03': TransactionAbortedError, // cannot_connect_now
  '08000': ConnectionLostError, // connection_exception
  '08003': ConnectionLostError, // connection_does_not_exist
  '08006': ConnectionLostError, // connection_failure
  '08001': ConnectionLostError, // sqlclient_unable_to_establish_sqlconnection
  '08004': ConnectionLostError, // sqlserver_rejected_establishment_of_sqlconnection
  '08007': ConnectionLostError, // transaction_resolution_unknown
};

/**
 * Active transaction store for tracking nested transactions
 */
interface ActiveTransactionStore {
  [key: string]: NestedTransaction;
}

/**
 * Injectable NestJS service that implements transaction management functionality.
 * Provides methods for starting, committing, and rolling back transactions with support for
 * different isolation levels, savepoints, and distributed transactions.
 */
@Injectable({ scope: Scope.DEFAULT })
export class TransactionService implements TransactionManager, DistributedTransactionCoordinator {
  private readonly logger = new Logger(TransactionService.name);
  private readonly activeTransactions: ActiveTransactionStore = {};
  private readonly defaultTimeout: number;
  private readonly maxRetries: number;
  private readonly initialRetryDelay: number;
  private readonly maxRetryDelay: number;
  private readonly enableDistributedTransactions: boolean;
  private readonly enableSavepoints: boolean;
  private readonly enableMetrics: boolean;

  /**
   * Creates a new instance of TransactionService.
   * 
   * @param prismaService The PrismaService instance for database operations
   * @param configService The ConfigService for retrieving configuration values
   */
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService
  ) {
    // Load configuration from environment variables
    this.defaultTimeout = this.configService.get<number>('DATABASE_TRANSACTION_TIMEOUT', 30000);
    this.maxRetries = this.configService.get<number>('DATABASE_TRANSACTION_MAX_RETRIES', 3);
    this.initialRetryDelay = this.configService.get<number>('DATABASE_TRANSACTION_INITIAL_RETRY_DELAY', 100);
    this.maxRetryDelay = this.configService.get<number>('DATABASE_TRANSACTION_MAX_RETRY_DELAY', 5000);
    this.enableDistributedTransactions = this.configService.get<boolean>('DATABASE_ENABLE_DISTRIBUTED_TRANSACTIONS', false);
    this.enableSavepoints = this.configService.get<boolean>('DATABASE_ENABLE_SAVEPOINTS', true);
    this.enableMetrics = this.configService.get<boolean>('DATABASE_ENABLE_TRANSACTION_METRICS', true);

    this.logger.log('TransactionService initialized with configuration:', {
      defaultTimeout: this.defaultTimeout,
      maxRetries: this.maxRetries,
      initialRetryDelay: this.initialRetryDelay,
      maxRetryDelay: this.maxRetryDelay,
      enableDistributedTransactions: this.enableDistributedTransactions,
      enableSavepoints: this.enableSavepoints,
      enableMetrics: this.enableMetrics
    });
  }

  /**
   * Executes a callback function within a transaction context.
   * 
   * @template T The return type of the callback function
   * @param callback The function to execute within the transaction
   * @param options Options for configuring the transaction behavior
   * @returns A promise that resolves to the result of the callback
   * 
   * @example
   * ```typescript
   * const result = await transactionService.executeTransaction(async (tx) => {
   *   const user = await tx.user.create({ data: { name: 'John' } });
   *   const profile = await tx.profile.create({ data: { userId: user.id } });
   *   return { user, profile };
   * });
   * ```
   */
  async executeTransaction<T>(
    callback: TransactionCallback<T>,
    options?: TransactionOptions
  ): Promise<T> {
    const result = await this.executeTransactionWithMetadata(callback, options);
    return result.result;
  }

  /**
   * Executes a callback function within a transaction context and returns detailed transaction metadata.
   * 
   * @template T The return type of the callback function
   * @param callback The function to execute within the transaction
   * @param options Options for configuring the transaction behavior
   * @returns A promise that resolves to the result of the callback along with transaction metadata
   * 
   * @example
   * ```typescript
   * const { result, metadata } = await transactionService.executeTransactionWithMetadata(async (tx) => {
   *   const user = await tx.user.create({ data: { name: 'John' } });
   *   return user;
   * });
   * 
   * console.log(`Transaction ${metadata.transactionId} completed in ${metadata.durationMs}ms`);
   * ```
   */
  async executeTransactionWithMetadata<T>(
    callback: TransactionCallback<T>,
    options?: TransactionOptions
  ): Promise<TransactionResult<T>> {
    const mergedOptions = this.mergeOptions(options);
    const transactionId = uuidv4();
    const startedAt = new Date();
    let retryAttempts = 0;
    let lastError: Error | null = null;
    let result: T | null = null;
    let success = false;

    this.logger.debug(`Starting transaction ${transactionId}`, {
      transactionId,
      isolationLevel: mergedOptions.isolationLevel,
      readOnly: mergedOptions.readOnly,
      timeout: mergedOptions.timeout,
      journeyContext: mergedOptions.journeyContext
    });

    // Execute transaction with retry logic
    while (retryAttempts <= (mergedOptions.retry?.maxRetries ?? 0)) {
      try {
        // Create transaction client
        const client = await this.createTransaction(mergedOptions);

        try {
          // Execute callback within transaction
          result = await this.executeWithTimeout(
            () => callback(client),
            mergedOptions.timeout,
            transactionId
          );

          // Commit transaction
          await this.commitTransaction(client);
          success = true;

          // Break out of retry loop on success
          break;
        } catch (error) {
          // Rollback transaction on error
          try {
            await this.rollbackTransaction(client);
          } catch (rollbackError) {
            this.logger.error(`Error rolling back transaction ${transactionId}`, rollbackError);
          }

          // Rethrow the original error
          throw error;
        }
      } catch (error) {
        lastError = this.transformError(error, transactionId, 'execute');

        // Check if we should retry
        if (this.shouldRetry(lastError, retryAttempts, mergedOptions.retry)) {
          retryAttempts++;
          const delay = this.calculateRetryDelay(retryAttempts, mergedOptions.retry);

          this.logger.debug(`Retrying transaction ${transactionId} (attempt ${retryAttempts})`, {
            transactionId,
            retryAttempts,
            delay,
            error: lastError.message
          });

          await sleep(delay);
        } else {
          // No more retries, rethrow the error
          throw lastError;
        }
      }
    }

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    this.logger.debug(`Transaction ${transactionId} completed`, {
      transactionId,
      success,
      durationMs,
      retryAttempts
    });

    if (this.enableMetrics) {
      this.recordTransactionMetrics(transactionId, startedAt, completedAt, retryAttempts, success, lastError, mergedOptions);
    }

    return {
      result: result as T, // We know result is not null here because success is true
      metadata: {
        transactionId,
        startedAt,
        completedAt,
        durationMs,
        retryAttempts,
        success,
        error: lastError,
        isolationLevel: mergedOptions.isolationLevel,
        readOnly: mergedOptions.readOnly ?? false,
        journeyContext: mergedOptions.journeyContext
      }
    };
  }

  /**
   * Creates a new transaction client that can be used for database operations.
   * 
   * @param options Options for configuring the transaction behavior
   * @returns A promise that resolves to a transaction client
   * 
   * @example
   * ```typescript
   * const tx = await transactionService.createTransaction();
   * try {
   *   const user = await tx.user.create({ data: { name: 'John' } });
   *   await transactionService.commitTransaction(tx);
   *   return user;
   * } catch (error) {
   *   await transactionService.rollbackTransaction(tx);
   *   throw error;
   * }
   * ```
   */
  async createTransaction(options?: TransactionOptions): Promise<TransactionClient> {
    const mergedOptions = this.mergeOptions(options);
    const transactionId = uuidv4();

    try {
      // Start a new Prisma transaction
      const tx = await this.prismaService.$transaction(
        async (prismaClient) => prismaClient,
        {
          isolationLevel: mergedOptions.isolationLevel as any, // Cast to any due to Prisma type differences
          maxWait: 5000, // Maximum time to wait for a transaction to start
          timeout: mergedOptions.timeout // Transaction timeout
        }
      );

      // Create a nested transaction object
      const nestedTx: NestedTransaction = {
        id: transactionId,
        depth: 0,
        client: tx as TransactionClient,
        options: mergedOptions,
        startedAt: new Date(),
        status: 'active'
      };

      // Store the transaction in the active transactions store
      this.activeTransactions[transactionId] = nestedTx;

      this.logger.debug(`Created transaction ${transactionId}`, {
        transactionId,
        isolationLevel: mergedOptions.isolationLevel,
        readOnly: mergedOptions.readOnly,
        timeout: mergedOptions.timeout
      });

      return tx as TransactionClient;
    } catch (error) {
      const transformedError = this.transformError(error, transactionId, 'create');
      this.logger.error(`Failed to create transaction ${transactionId}`, transformedError);
      throw transformedError;
    }
  }

  /**
   * Commits a transaction that was created with createTransaction.
   * 
   * @param client The transaction client to commit
   * @returns A promise that resolves when the transaction is committed
   * 
   * @example
   * ```typescript
   * const tx = await transactionService.createTransaction();
   * try {
   *   const user = await tx.user.create({ data: { name: 'John' } });
   *   await transactionService.commitTransaction(tx);
   *   return user;
   * } catch (error) {
   *   await transactionService.rollbackTransaction(tx);
   *   throw error;
   * }
   * ```
   */
  async commitTransaction(client: TransactionClient): Promise<void> {
    const transactionId = this.getTransactionIdFromClient(client);
    if (!transactionId) {
      throw new TransactionError('Cannot commit transaction: transaction not found in active transactions');
    }

    const transaction = this.activeTransactions[transactionId];
    if (!transaction) {
      throw new TransactionError(`Cannot commit transaction ${transactionId}: transaction not found in active transactions`);
    }

    try {
      // In Prisma, transactions are automatically committed when the transaction callback completes
      // Since we're using the $transaction API in a non-standard way, we don't need to explicitly commit
      // However, we need to update our transaction state

      transaction.status = 'committed';
      delete this.activeTransactions[transactionId];

      this.logger.debug(`Committed transaction ${transactionId}`, {
        transactionId,
        duration: new Date().getTime() - transaction.startedAt.getTime()
      });
    } catch (error) {
      const transformedError = this.transformError(error, transactionId, 'commit');
      transaction.status = 'error';
      transaction.error = transformedError;
      delete this.activeTransactions[transactionId];

      this.logger.error(`Failed to commit transaction ${transactionId}`, transformedError);
      throw transformedError;
    }
  }

  /**
   * Rolls back a transaction that was created with createTransaction.
   * 
   * @param client The transaction client to roll back
   * @returns A promise that resolves when the transaction is rolled back
   * 
   * @example
   * ```typescript
   * const tx = await transactionService.createTransaction();
   * try {
   *   const user = await tx.user.create({ data: { name: 'John' } });
   *   await transactionService.commitTransaction(tx);
   *   return user;
   * } catch (error) {
   *   await transactionService.rollbackTransaction(tx);
   *   throw error;
   * }
   * ```
   */
  async rollbackTransaction(client: TransactionClient): Promise<void> {
    const transactionId = this.getTransactionIdFromClient(client);
    if (!transactionId) {
      throw new TransactionError('Cannot rollback transaction: transaction not found in active transactions');
    }

    const transaction = this.activeTransactions[transactionId];
    if (!transaction) {
      throw new TransactionError(`Cannot rollback transaction ${transactionId}: transaction not found in active transactions`);
    }

    try {
      // In Prisma, transactions are automatically rolled back when an error is thrown in the transaction callback
      // Since we're using the $transaction API in a non-standard way, we need to explicitly throw an error to trigger a rollback
      await (client as any).$executeRaw`ROLLBACK`;

      transaction.status = 'rolled_back';
      delete this.activeTransactions[transactionId];

      this.logger.debug(`Rolled back transaction ${transactionId}`, {
        transactionId,
        duration: new Date().getTime() - transaction.startedAt.getTime()
      });
    } catch (error) {
      const transformedError = this.transformError(error, transactionId, 'rollback');
      transaction.status = 'error';
      transaction.error = transformedError;
      delete this.activeTransactions[transactionId];

      this.logger.error(`Failed to rollback transaction ${transactionId}`, transformedError);
      throw transformedError;
    }
  }

  /**
   * Creates a savepoint within an existing transaction.
   * Savepoints allow for partial rollbacks within a transaction.
   * 
   * @param client The transaction client to create a savepoint for
   * @param name Optional name for the savepoint (auto-generated if not provided)
   * @returns A promise that resolves to the savepoint name
   * 
   * @example
   * ```typescript
   * const tx = await transactionService.createTransaction();
   * try {
   *   const user = await tx.user.create({ data: { name: 'John' } });
   *   
   *   // Create a savepoint before a risky operation
   *   const savepointName = await transactionService.createSavepoint(tx);
   *   
   *   try {
   *     // Perform a risky operation
   *     await tx.profile.create({ data: { userId: user.id } });
   *   } catch (error) {
   *     // Rollback to the savepoint if the risky operation fails
   *     await transactionService.rollbackToSavepoint(tx, savepointName);
   *   }
   *   
   *   await transactionService.commitTransaction(tx);
   *   return user;
   * } catch (error) {
   *   await transactionService.rollbackTransaction(tx);
   *   throw error;
   * }
   * ```
   */
  async createSavepoint(client: TransactionClient, name?: string): Promise<string> {
    if (!this.enableSavepoints) {
      throw new TransactionError('Savepoints are disabled in the current configuration');
    }

    const transactionId = this.getTransactionIdFromClient(client);
    if (!transactionId) {
      throw new TransactionError('Cannot create savepoint: transaction not found in active transactions');
    }

    const transaction = this.activeTransactions[transactionId];
    if (!transaction) {
      throw new TransactionError(`Cannot create savepoint: transaction ${transactionId} not found in active transactions`);
    }

    if (transaction.status !== 'active') {
      throw new TransactionError(`Cannot create savepoint: transaction ${transactionId} is not active (status: ${transaction.status})`);
    }

    // Generate a savepoint name if not provided
    const savepointName = name || `sp_${uuidv4().replace(/-/g, '')}`;

    try {
      // Create a savepoint using raw SQL
      await (client as any).$executeRaw`SAVEPOINT ${Prisma.raw(savepointName)}`;

      this.logger.debug(`Created savepoint ${savepointName} in transaction ${transactionId}`, {
        transactionId,
        savepointName
      });

      return savepointName;
    } catch (error) {
      const transformedError = this.transformError(error, transactionId, 'create_savepoint');
      this.logger.error(`Failed to create savepoint ${savepointName} in transaction ${transactionId}`, transformedError);
      throw transformedError;
    }
  }

  /**
   * Rolls back to a previously created savepoint.
   * 
   * @param client The transaction client to roll back
   * @param name The name of the savepoint to roll back to
   * @returns A promise that resolves when the rollback is complete
   * 
   * @example
   * ```typescript
   * const tx = await transactionService.createTransaction();
   * try {
   *   const user = await tx.user.create({ data: { name: 'John' } });
   *   
   *   // Create a savepoint before a risky operation
   *   const savepointName = await transactionService.createSavepoint(tx);
   *   
   *   try {
   *     // Perform a risky operation
   *     await tx.profile.create({ data: { userId: user.id } });
   *   } catch (error) {
   *     // Rollback to the savepoint if the risky operation fails
   *     await transactionService.rollbackToSavepoint(tx, savepointName);
   *   }
   *   
   *   await transactionService.commitTransaction(tx);
   *   return user;
   * } catch (error) {
   *   await transactionService.rollbackTransaction(tx);
   *   throw error;
   * }
   * ```
   */
  async rollbackToSavepoint(client: TransactionClient, name: string): Promise<void> {
    if (!this.enableSavepoints) {
      throw new TransactionError('Savepoints are disabled in the current configuration');
    }

    const transactionId = this.getTransactionIdFromClient(client);
    if (!transactionId) {
      throw new TransactionError('Cannot rollback to savepoint: transaction not found in active transactions');
    }

    const transaction = this.activeTransactions[transactionId];
    if (!transaction) {
      throw new TransactionError(`Cannot rollback to savepoint: transaction ${transactionId} not found in active transactions`);
    }

    if (transaction.status !== 'active') {
      throw new TransactionError(`Cannot rollback to savepoint: transaction ${transactionId} is not active (status: ${transaction.status})`);
    }

    try {
      // Rollback to the savepoint using raw SQL
      await (client as any).$executeRaw`ROLLBACK TO SAVEPOINT ${Prisma.raw(name)}`;

      this.logger.debug(`Rolled back to savepoint ${name} in transaction ${transactionId}`, {
        transactionId,
        savepointName: name
      });
    } catch (error) {
      const transformedError = this.transformError(error, transactionId, 'rollback_to_savepoint');
      this.logger.error(`Failed to rollback to savepoint ${name} in transaction ${transactionId}`, transformedError);
      throw transformedError;
    }
  }

  /**
   * Releases a previously created savepoint.
   * 
   * @param client The transaction client to release the savepoint for
   * @param name The name of the savepoint to release
   * @returns A promise that resolves when the savepoint is released
   * 
   * @example
   * ```typescript
   * const tx = await transactionService.createTransaction();
   * try {
   *   const user = await tx.user.create({ data: { name: 'John' } });
   *   
   *   // Create a savepoint before a risky operation
   *   const savepointName = await transactionService.createSavepoint(tx);
   *   
   *   // Perform a risky operation successfully
   *   await tx.profile.create({ data: { userId: user.id } });
   *   
   *   // Release the savepoint since we don't need it anymore
   *   await transactionService.releaseSavepoint(tx, savepointName);
   *   
   *   await transactionService.commitTransaction(tx);
   *   return user;
   * } catch (error) {
   *   await transactionService.rollbackTransaction(tx);
   *   throw error;
   * }
   * ```
   */
  async releaseSavepoint(client: TransactionClient, name: string): Promise<void> {
    if (!this.enableSavepoints) {
      throw new TransactionError('Savepoints are disabled in the current configuration');
    }

    const transactionId = this.getTransactionIdFromClient(client);
    if (!transactionId) {
      throw new TransactionError('Cannot release savepoint: transaction not found in active transactions');
    }

    const transaction = this.activeTransactions[transactionId];
    if (!transaction) {
      throw new TransactionError(`Cannot release savepoint: transaction ${transactionId} not found in active transactions`);
    }

    if (transaction.status !== 'active') {
      throw new TransactionError(`Cannot release savepoint: transaction ${transactionId} is not active (status: ${transaction.status})`);
    }

    try {
      // Release the savepoint using raw SQL
      await (client as any).$executeRaw`RELEASE SAVEPOINT ${Prisma.raw(name)}`;

      this.logger.debug(`Released savepoint ${name} in transaction ${transactionId}`, {
        transactionId,
        savepointName: name
      });
    } catch (error) {
      const transformedError = this.transformError(error, transactionId, 'release_savepoint');
      this.logger.error(`Failed to release savepoint ${name} in transaction ${transactionId}`, transformedError);
      throw transformedError;
    }
  }

  /**
   * Executes a callback function within a distributed transaction context.
   * 
   * @template T The return type of the callback function
   * @param callback The function to execute within the distributed transaction
   * @param options Options for configuring the distributed transaction behavior
   * @returns A promise that resolves to the result of the callback
   * 
   * @example
   * ```typescript
   * const result = await transactionService.executeDistributedTransaction(async (tx) => {
   *   // Perform operations across multiple services
   *   const user = await userService.createUser(tx, userData);
   *   const payment = await paymentService.processPayment(tx, paymentData);
   *   return { user, payment };
   * }, {
   *   participants: ['user-service', 'payment-service'],
   *   isolationLevel: TransactionIsolationLevel.SERIALIZABLE
   * });
   * ```
   */
  async executeDistributedTransaction<T>(
    callback: TransactionCallback<T>,
    options: DistributedTransactionOptions
  ): Promise<T> {
    if (!this.enableDistributedTransactions) {
      throw new TransactionError('Distributed transactions are disabled in the current configuration');
    }

    const mergedOptions = { ...DEFAULT_DISTRIBUTED_TRANSACTION_OPTIONS, ...options };
    const transactionId = uuidv4();
    const startedAt = new Date();

    if (!mergedOptions.participants || mergedOptions.participants.length === 0) {
      throw new TransactionError('Distributed transaction requires at least one participant');
    }

    this.logger.debug(`Starting distributed transaction ${transactionId}`, {
      transactionId,
      participants: mergedOptions.participants,
      isolationLevel: mergedOptions.isolationLevel,
      timeout: mergedOptions.timeout
    });

    // Create a transaction client for the local participant
    const client = await this.createTransaction(mergedOptions);

    try {
      // Prepare phase: prepare all participants
      const prepareResults = await this.prepareAllParticipants(transactionId, mergedOptions.participants, mergedOptions.prepareTimeout);

      // Check if all participants are prepared
      const allPrepared = prepareResults.every(result => result.prepared);
      if (!allPrepared && mergedOptions.prepareFailureStrategy === 'abort') {
        // Abort the transaction if any participant failed to prepare
        const failedParticipants = prepareResults
          .filter(result => !result.prepared)
          .map(result => result.participantId);

        throw new DistributedTransactionError(
          `Failed to prepare all participants for distributed transaction ${transactionId}`,
          failedParticipants,
          'prepare'
        );
      }

      // Execute the callback within the transaction
      const result = await this.executeWithTimeout(
        () => callback(client),
        mergedOptions.timeout,
        transactionId
      );

      // Commit phase: commit all prepared participants
      const commitResults = await this.commitAllParticipants(
        transactionId,
        prepareResults.filter(result => result.prepared).map(result => result.participantId),
        mergedOptions.commitTimeout,
        mergedOptions.commitFailureStrategy === 'retry' ? mergedOptions.maxCommitRetries : 1
      );

      // Check if all participants are committed
      const allCommitted = commitResults.every(result => result.committed);
      if (!allCommitted && mergedOptions.commitFailureStrategy === 'compensate') {
        // Compensate for committed participants if any participant failed to commit
        const committedParticipants = commitResults
          .filter(result => result.committed)
          .map(result => result.participantId);

        await this.compensateParticipants(transactionId, committedParticipants);

        const failedParticipants = commitResults
          .filter(result => !result.committed)
          .map(result => result.participantId);

        throw new DistributedTransactionError(
          `Failed to commit all participants for distributed transaction ${transactionId}`,
          failedParticipants,
          'commit'
        );
      }

      // Commit the local transaction
      await this.commitTransaction(client);

      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();

      this.logger.debug(`Distributed transaction ${transactionId} completed successfully`, {
        transactionId,
        durationMs,
        participants: mergedOptions.participants
      });

      return result;
    } catch (error) {
      // Rollback the local transaction
      try {
        await this.rollbackTransaction(client);
      } catch (rollbackError) {
        this.logger.error(`Error rolling back local transaction ${transactionId}`, rollbackError);
      }

      // Abort all participants
      try {
        await this.abortAllParticipants(transactionId, mergedOptions.participants);
      } catch (abortError) {
        this.logger.error(`Error aborting participants for distributed transaction ${transactionId}`, abortError);
      }

      const transformedError = this.transformError(error, transactionId, 'distributed_transaction');
      this.logger.error(`Distributed transaction ${transactionId} failed`, transformedError);
      throw transformedError;
    }
  }

  /**
   * Prepares a participant for a distributed transaction (first phase of two-phase commit).
   * 
   * @param transactionId The ID of the distributed transaction
   * @param participantId The ID of the participant
   * @returns A promise that resolves to true if the participant is prepared, false otherwise
   */
  async prepareParticipant(transactionId: string, participantId: string): Promise<boolean> {
    if (!this.enableDistributedTransactions) {
      throw new TransactionError('Distributed transactions are disabled in the current configuration');
    }

    this.logger.debug(`Preparing participant ${participantId} for distributed transaction ${transactionId}`, {
      transactionId,
      participantId
    });

    try {
      // In a real implementation, this would communicate with the participant service
      // For now, we'll simulate a successful preparation
      return true;
    } catch (error) {
      const transformedError = this.transformError(error, transactionId, 'prepare_participant');
      this.logger.error(`Failed to prepare participant ${participantId} for distributed transaction ${transactionId}`, transformedError);
      return false;
    }
  }

  /**
   * Commits a participant in a distributed transaction (second phase of two-phase commit).
   * 
   * @param transactionId The ID of the distributed transaction
   * @param participantId The ID of the participant
   * @returns A promise that resolves when the participant is committed
   */
  async commitParticipant(transactionId: string, participantId: string): Promise<void> {
    if (!this.enableDistributedTransactions) {
      throw new TransactionError('Distributed transactions are disabled in the current configuration');
    }

    this.logger.debug(`Committing participant ${participantId} for distributed transaction ${transactionId}`, {
      transactionId,
      participantId
    });

    try {
      // In a real implementation, this would communicate with the participant service
      // For now, we'll simulate a successful commit
    } catch (error) {
      const transformedError = this.transformError(error, transactionId, 'commit_participant');
      this.logger.error(`Failed to commit participant ${participantId} for distributed transaction ${transactionId}`, transformedError);
      throw transformedError;
    }
  }

  /**
   * Aborts a participant in a distributed transaction.
   * 
   * @param transactionId The ID of the distributed transaction
   * @param participantId The ID of the participant
   * @returns A promise that resolves when the participant is aborted
   */
  async abortParticipant(transactionId: string, participantId: string): Promise<void> {
    if (!this.enableDistributedTransactions) {
      throw new TransactionError('Distributed transactions are disabled in the current configuration');
    }

    this.logger.debug(`Aborting participant ${participantId} for distributed transaction ${transactionId}`, {
      transactionId,
      participantId
    });

    try {
      // In a real implementation, this would communicate with the participant service
      // For now, we'll simulate a successful abort
    } catch (error) {
      const transformedError = this.transformError(error, transactionId, 'abort_participant');
      this.logger.error(`Failed to abort participant ${participantId} for distributed transaction ${transactionId}`, transformedError);
      throw transformedError;
    }
  }

  /**
   * Gets the status of a distributed transaction.
   * 
   * @param transactionId The ID of the distributed transaction
   * @returns A promise that resolves to the status of the distributed transaction
   */
  async getTransactionStatus(transactionId: string): Promise<'preparing' | 'prepared' | 'committing' | 'committed' | 'aborting' | 'aborted' | 'unknown'> {
    if (!this.enableDistributedTransactions) {
      throw new TransactionError('Distributed transactions are disabled in the current configuration');
    }

    // In a real implementation, this would retrieve the status from a transaction coordinator
    // For now, we'll return 'unknown' for any transaction ID
    return 'unknown';
  }

  /**
   * Prepares all participants for a distributed transaction.
   * 
   * @param transactionId The ID of the distributed transaction
   * @param participants The IDs of the participants
   * @param timeout Timeout in milliseconds for the prepare phase
   * @returns A promise that resolves to an array of prepare results
   */
  private async prepareAllParticipants(
    transactionId: string,
    participants: string[],
    timeout: number
  ): Promise<Array<{ participantId: string; prepared: boolean }>> {
    this.logger.debug(`Preparing all participants for distributed transaction ${transactionId}`, {
      transactionId,
      participants,
      timeout
    });

    // Create a promise for each participant with a timeout
    const preparePromises = participants.map(async (participantId) => {
      try {
        const prepared = await this.executeWithTimeout(
          () => this.prepareParticipant(transactionId, participantId),
          timeout,
          `${transactionId}-prepare-${participantId}`
        );
        return { participantId, prepared };
      } catch (error) {
        this.logger.error(`Failed to prepare participant ${participantId} for distributed transaction ${transactionId}`, error);
        return { participantId, prepared: false };
      }
    });

    // Wait for all prepare promises to resolve
    return Promise.all(preparePromises);
  }

  /**
   * Commits all prepared participants in a distributed transaction.
   * 
   * @param transactionId The ID of the distributed transaction
   * @param participants The IDs of the prepared participants
   * @param timeout Timeout in milliseconds for the commit phase
   * @param maxRetries Maximum number of retry attempts for commit failures
   * @returns A promise that resolves to an array of commit results
   */
  private async commitAllParticipants(
    transactionId: string,
    participants: string[],
    timeout: number,
    maxRetries: number
  ): Promise<Array<{ participantId: string; committed: boolean }>> {
    this.logger.debug(`Committing all participants for distributed transaction ${transactionId}`, {
      transactionId,
      participants,
      timeout,
      maxRetries
    });

    // Create a promise for each participant with a timeout and retry logic
    const commitPromises = participants.map(async (participantId) => {
      let retryAttempts = 0;
      let committed = false;

      while (retryAttempts <= maxRetries) {
        try {
          await this.executeWithTimeout(
            () => this.commitParticipant(transactionId, participantId),
            timeout,
            `${transactionId}-commit-${participantId}`
          );
          committed = true;
          break;
        } catch (error) {
          retryAttempts++;
          if (retryAttempts <= maxRetries) {
            const delay = this.calculateRetryDelay(retryAttempts);
            this.logger.warn(
              `Failed to commit participant ${participantId} for distributed transaction ${transactionId}. ` +
              `Retrying (${retryAttempts}/${maxRetries}) after ${delay}ms...`,
              error
            );
            await sleep(delay);
          } else {
            this.logger.error(
              `Failed to commit participant ${participantId} for distributed transaction ${transactionId} ` +
              `after ${maxRetries} retry attempts`,
              error
            );
          }
        }
      }

      return { participantId, committed };
    });

    // Wait for all commit promises to resolve
    return Promise.all(commitPromises);
  }

  /**
   * Aborts all participants in a distributed transaction.
   * 
   * @param transactionId The ID of the distributed transaction
   * @param participants The IDs of the participants
   * @returns A promise that resolves when all participants are aborted
   */
  private async abortAllParticipants(
    transactionId: string,
    participants: string[]
  ): Promise<void> {
    this.logger.debug(`Aborting all participants for distributed transaction ${transactionId}`, {
      transactionId,
      participants
    });

    // Create a promise for each participant
    const abortPromises = participants.map(async (participantId) => {
      try {
        await this.abortParticipant(transactionId, participantId);
      } catch (error) {
        this.logger.error(`Failed to abort participant ${participantId} for distributed transaction ${transactionId}`, error);
      }
    });

    // Wait for all abort promises to resolve
    await Promise.all(abortPromises);
  }

  /**
   * Compensates for committed participants in a distributed transaction.
   * 
   * @param transactionId The ID of the distributed transaction
   * @param participants The IDs of the committed participants
   * @returns A promise that resolves when all participants are compensated
   */
  private async compensateParticipants(
    transactionId: string,
    participants: string[]
  ): Promise<void> {
    this.logger.debug(`Compensating committed participants for distributed transaction ${transactionId}`, {
      transactionId,
      participants
    });

    // In a real implementation, this would execute compensation actions for each participant
    // For now, we'll just log the compensation
    this.logger.warn(`Compensation required for distributed transaction ${transactionId}`, {
      transactionId,
      participants
    });
  }

  /**
   * Executes a function with a timeout.
   * 
   * @template T The return type of the function
   * @param fn The function to execute
   * @param timeoutMs The timeout in milliseconds
   * @param operationId An identifier for the operation (for logging)
   * @returns A promise that resolves to the result of the function
   * @throws {TransactionTimeoutError} If the function execution exceeds the timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number = this.defaultTimeout,
    operationId: string
  ): Promise<T> {
    // Create a promise that rejects after the timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new TransactionTimeoutError(
          `Operation ${operationId} timed out after ${timeoutMs}ms`,
          timeoutMs,
          operationId
        ));
      }, timeoutMs);

      // Ensure the timeout is cleared if the promise is garbage collected
      (timeoutPromise as any).timeoutId = timeoutId;
    });

    try {
      // Race the function execution against the timeout
      return await Promise.race([fn(), timeoutPromise]);
    } finally {
      // Clear the timeout to prevent memory leaks
      clearTimeout((timeoutPromise as any).timeoutId);
    }
  }

  /**
   * Transforms a raw error into a typed transaction error.
   * 
   * @param error The raw error to transform
   * @param transactionId The ID of the transaction where the error occurred
   * @param operation The operation that was being performed when the error occurred
   * @returns A typed transaction error
   */
  private transformError(error: any, transactionId: string, operation: string): Error {
    // If the error is already a TransactionError, return it as is
    if (error instanceof TransactionError) {
      return error;
    }

    // Check for Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Extract PostgreSQL error code from Prisma error
      const pgErrorCode = this.extractPgErrorCode(error);
      if (pgErrorCode && PG_ERROR_CODE_MAP[pgErrorCode]) {
        const ErrorClass = PG_ERROR_CODE_MAP[pgErrorCode];
        return new ErrorClass(
          `Transaction ${transactionId} failed during ${operation}: ${error.message}`,
          error
        );
      }

      // Handle specific Prisma error codes
      switch (error.code) {
        case 'P2024': // Timed out fetching a connection from the connection pool
          return new TransactionTimeoutError(
            `Transaction ${transactionId} timed out while fetching a connection: ${error.message}`,
            this.defaultTimeout,
            'connection_acquisition',
            error
          );
        case 'P2028': // Transaction API error
          return new TransactionError(
            `Transaction ${transactionId} API error during ${operation}: ${error.message}`,
            error
          );
        default:
          return new TransactionError(
            `Transaction ${transactionId} failed during ${operation} with Prisma error ${error.code}: ${error.message}`,
            error
          );
      }
    }

    // Handle timeout errors
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return new TransactionTimeoutError(
        `Transaction ${transactionId} timed out during ${operation}: ${error.message}`,
        this.defaultTimeout,
        operation,
        error
      );
    }

    // Handle connection errors
    if (
      error.message.includes('connection') &&
      (error.message.includes('closed') ||
       error.message.includes('terminated') ||
       error.message.includes('dropped'))
    ) {
      return new ConnectionLostError(
        `Transaction ${transactionId} lost connection during ${operation}: ${error.message}`,
        operation as any,
        error
      );
    }

    // Default to generic TransactionError
    return new TransactionError(
      `Transaction ${transactionId} failed during ${operation}: ${error.message}`,
      error
    );
  }

  /**
   * Extracts the PostgreSQL error code from a Prisma error.
   * 
   * @param error The Prisma error
   * @returns The PostgreSQL error code, or null if not found
   */
  private extractPgErrorCode(error: Prisma.PrismaClientKnownRequestError): string | null {
    // Check for PostgreSQL error code in the error message
    const pgErrorCodeMatch = error.message.match(/\(code: (\w+)\)/);
    if (pgErrorCodeMatch && pgErrorCodeMatch[1]) {
      return pgErrorCodeMatch[1];
    }

    // Check for PostgreSQL error code in the error meta
    if (error.meta && typeof error.meta === 'object' && 'code' in error.meta) {
      return String(error.meta.code);
    }

    return null;
  }

  /**
   * Gets the transaction ID from a transaction client.
   * 
   * @param client The transaction client
   * @returns The transaction ID, or null if not found
   */
  private getTransactionIdFromClient(client: TransactionClient): string | null {
    // Find the transaction ID by checking the active transactions store
    for (const [id, transaction] of Object.entries(this.activeTransactions)) {
      if (transaction.client === client) {
        return id;
      }
    }
    return null;
  }

  /**
   * Merges transaction options with default options.
   * 
   * @param options The options to merge
   * @returns The merged options
   */
  private mergeOptions(options?: TransactionOptions): TransactionOptions {
    return {
      ...DEFAULT_TRANSACTION_OPTIONS,
      ...options,
      retry: {
        ...DEFAULT_TRANSACTION_OPTIONS.retry,
        ...options?.retry
      }
    };
  }

  /**
   * Determines if a transaction should be retried based on the error and retry configuration.
   * 
   * @param error The error that occurred
   * @param attempt The current retry attempt (0-based)
   * @param retryStrategy The retry strategy configuration
   * @returns True if the transaction should be retried, false otherwise
   */
  private shouldRetry(error: Error, attempt: number, retryStrategy?: TransactionRetryStrategy): boolean {
    if (!retryStrategy) {
      return false;
    }

    const maxRetries = retryStrategy.maxRetries ?? 3;
    if (attempt >= maxRetries) {
      return false;
    }

    // Use the shouldRetry callback if provided
    if (retryStrategy.shouldRetry) {
      return retryStrategy.shouldRetry(error, attempt);
    }

    // Check if the error is in the non-retryable errors list
    if (retryStrategy.nonRetryableErrors) {
      for (const pattern of retryStrategy.nonRetryableErrors) {
        if (typeof pattern === 'string') {
          if (error.message.includes(pattern)) {
            return false;
          }
        } else if (pattern instanceof RegExp) {
          if (pattern.test(error.message)) {
            return false;
          }
        }
      }
    }

    // Check if the error is in the retryable errors list
    if (retryStrategy.retryableErrors) {
      for (const pattern of retryStrategy.retryableErrors) {
        if (typeof pattern === 'string') {
          if (error.message.includes(pattern)) {
            return true;
          }
        } else if (pattern instanceof RegExp) {
          if (pattern.test(error.message)) {
            return true;
          }
        }
      }
      // If retryableErrors is specified but none matched, don't retry
      return false;
    }

    // Default to checking if the error is a retryable error type
    return isRetryableError(error);
  }

  /**
   * Calculates the delay before the next retry attempt.
   * 
   * @param attempt The current retry attempt (1-based)
   * @param retryStrategy The retry strategy configuration
   * @returns The delay in milliseconds
   */
  private calculateRetryDelay(attempt: number, retryStrategy?: TransactionRetryStrategy): number {
    if (!retryStrategy) {
      return this.initialRetryDelay * Math.pow(2, attempt - 1);
    }

    // Use the calculateDelay callback if provided
    if (retryStrategy.calculateDelay) {
      return retryStrategy.calculateDelay(attempt - 1, new Error('Retry calculation'));
    }

    const initialDelay = retryStrategy.initialDelay ?? this.initialRetryDelay;
    const backoffFactor = retryStrategy.backoffFactor ?? 2;
    const maxDelay = retryStrategy.maxDelay ?? this.maxRetryDelay;

    return calculateBackoffDelay(attempt, initialDelay, backoffFactor, maxDelay);
  }

  /**
   * Records transaction metrics for monitoring and analysis.
   * 
   * @param transactionId The ID of the transaction
   * @param startedAt The time when the transaction started
   * @param completedAt The time when the transaction completed
   * @param retryAttempts The number of retry attempts
   * @param success Whether the transaction was successful
   * @param error The error that occurred, if any
   * @param options The transaction options
   */
  private recordTransactionMetrics(
    transactionId: string,
    startedAt: Date,
    completedAt: Date,
    retryAttempts: number,
    success: boolean,
    error: Error | null,
    options: TransactionOptions
  ): void {
    // In a real implementation, this would send metrics to a monitoring system
    // For now, we'll just log the metrics
    const durationMs = completedAt.getTime() - startedAt.getTime();
    const isolationLevel = options.isolationLevel;
    const readOnly = options.readOnly ?? false;
    const journeyType = options.journeyContext?.journeyType;

    this.logger.debug('Transaction metrics', {
      transactionId,
      durationMs,
      retryAttempts,
      success,
      error: error ? { name: error.name, message: error.message } : null,
      isolationLevel,
      readOnly,
      journeyType
    });
  }
}
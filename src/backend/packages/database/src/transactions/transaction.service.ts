/**
 * @file transaction.service.ts
 * @description Injectable NestJS service that implements transaction management functionality
 * for the application. Provides methods for starting, committing, and rolling back transactions
 * with support for different isolation levels, savepoints, and distributed transactions.
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { PrismaService } from '../prisma.service';
import { DatabaseException } from '../errors/database-error.exception';
import { DatabaseErrorType } from '../errors/database-error.types';
import { 
  Transaction,
  TransactionCallback,
  TransactionIsolationLevel,
  TransactionManager,
  TransactionMetadata,
  TransactionOptions,
  TransactionState,
  TransactionType,
  DEFAULT_TRANSACTION_OPTIONS,
  PRISMA_ISOLATION_LEVEL_MAP
} from '../types/transaction.types';

/**
 * Error classes for transaction-specific errors
 */
import {
  TransactionError,
  TransactionTimeoutError,
  DeadlockError,
  DistributedTransactionError,
  SavepointError,
  TransactionAbortedError
} from './transaction.errors';

/**
 * Implementation of a database transaction that manages transaction state and operations
 */
class TransactionImpl<T> implements Transaction<T> {
  public readonly id: string;
  public readonly metadata: TransactionMetadata;
  public readonly options: Required<TransactionOptions>;
  private client: Prisma.TransactionClient | null = null;
  private timeoutId: NodeJS.Timeout | null = null;
  private savepoints: Map<string, string> = new Map();
  private readonly logger = new Logger(TransactionImpl.name);
  private readonly prismaService: PrismaService;
  private readonly eventEmitter: EventEmitter2;

  constructor(
    prismaService: PrismaService,
    eventEmitter: EventEmitter2,
    options?: Partial<TransactionOptions>
  ) {
    this.id = uuidv4();
    this.prismaService = prismaService;
    this.eventEmitter = eventEmitter;
    
    // Merge provided options with defaults
    this.options = {
      ...DEFAULT_TRANSACTION_OPTIONS,
      ...options,
      timeout: {
        ...DEFAULT_TRANSACTION_OPTIONS.timeout,
        ...options?.timeout,
      },
      retry: {
        ...DEFAULT_TRANSACTION_OPTIONS.retry,
        ...options?.retry,
      },
      logging: {
        ...DEFAULT_TRANSACTION_OPTIONS.logging,
        ...options?.logging,
      },
      savepoint: {
        ...DEFAULT_TRANSACTION_OPTIONS.savepoint,
        ...options?.savepoint,
      },
      distributed: {
        ...DEFAULT_TRANSACTION_OPTIONS.distributed,
        ...options?.distributed,
      },
    };

    // Initialize metadata
    this.metadata = {
      id: this.id,
      createdAt: new Date(),
      state: TransactionState.CREATED,
      type: this.options.type || TransactionType.STANDARD,
      isolationLevel: this.options.isolationLevel || TransactionIsolationLevel.READ_COMMITTED,
      journeyContext: this.options.journeyContext || 'default',
      parentId: this.options.parent?.id,
      retryCount: 0,
    };

    // Log transaction creation if enabled
    if (this.options.logging.logEvents) {
      this.logger.debug(
        `Transaction ${this.id} created with isolation level ${this.metadata.isolationLevel} ` +
        `for journey ${this.metadata.journeyContext}`
      );
    }

    // Emit transaction created event
    this.eventEmitter.emit('transaction.created', {
      transactionId: this.id,
      metadata: this.metadata,
      options: this.options,
    });
  }

  /**
   * Gets the current state of the transaction
   */
  get state(): TransactionState {
    return this.metadata.state;
  }

  /**
   * Starts the transaction
   */
  async start(): Promise<void> {
    // Check if transaction is already started
    if (this.metadata.state !== TransactionState.CREATED) {
      throw new TransactionError(
        `Cannot start transaction ${this.id} in state ${this.metadata.state}`,
        { transactionId: this.id }
      );
    }

    try {
      // Start transaction with the specified isolation level
      this.client = await this.prismaService.$transaction(
        { isolationLevel: PRISMA_ISOLATION_LEVEL_MAP[this.metadata.isolationLevel] },
        { maxWait: this.options.timeout.timeoutMs }
      ) as unknown as Prisma.TransactionClient;

      // Update metadata
      this.metadata.state = TransactionState.ACTIVE;
      this.metadata.startedAt = new Date();

      // Set up transaction timeout if configured
      if (this.options.timeout.timeoutMs > 0) {
        this.timeoutId = setTimeout(() => {
          this.handleTimeout();
        }, this.options.timeout.timeoutMs);
      }

      // Log transaction start if enabled
      if (this.options.logging.logEvents) {
        this.logger.debug(
          `Transaction ${this.id} started with isolation level ${this.metadata.isolationLevel}`
        );
      }

      // Emit transaction started event
      this.eventEmitter.emit('transaction.started', {
        transactionId: this.id,
        metadata: this.metadata,
      });
    } catch (error) {
      // Update metadata on error
      this.metadata.state = TransactionState.FAILED;
      this.metadata.error = error;

      // Log error if enabled
      if (this.options.logging.logEvents) {
        this.logger.error(
          `Failed to start transaction ${this.id}: ${error.message}`,
          error.stack
        );
      }

      // Emit transaction failed event
      this.eventEmitter.emit('transaction.failed', {
        transactionId: this.id,
        metadata: this.metadata,
        error,
      });

      // Throw appropriate error
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2028') {
          throw new TransactionError(
            `Transaction API error: ${error.message}`,
            { transactionId: this.id, cause: error }
          );
        } else if (error.code === 'P2034') {
          throw new TransactionTimeoutError(
            `Transaction timed out: ${error.message}`,
            { transactionId: this.id, cause: error }
          );
        }
      }

      throw new TransactionError(
        `Failed to start transaction: ${error.message}`,
        { transactionId: this.id, cause: error }
      );
    }
  }

  /**
   * Commits the transaction
   */
  async commit(): Promise<void> {
    // Check if transaction is active
    if (this.metadata.state !== TransactionState.ACTIVE) {
      throw new TransactionError(
        `Cannot commit transaction ${this.id} in state ${this.metadata.state}`,
        { transactionId: this.id }
      );
    }

    try {
      // Clear timeout if set
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }

      // Commit the transaction
      if (this.client) {
        await (this.client as any).$commit();
      }

      // Update metadata
      this.metadata.state = TransactionState.COMMITTED;
      this.metadata.completedAt = new Date();

      // Log transaction commit if enabled
      if (this.options.logging.logEvents) {
        this.logger.debug(`Transaction ${this.id} committed successfully`);
      }

      // Log performance metrics if enabled
      if (this.options.logging.logPerformance && this.metadata.startedAt) {
        const duration = this.metadata.completedAt.getTime() - this.metadata.startedAt.getTime();
        this.logger.debug(`Transaction ${this.id} completed in ${duration}ms`);
      }

      // Emit transaction committed event
      this.eventEmitter.emit('transaction.committed', {
        transactionId: this.id,
        metadata: this.metadata,
      });
    } catch (error) {
      // Update metadata on error
      this.metadata.state = TransactionState.FAILED;
      this.metadata.error = error;

      // Log error if enabled
      if (this.options.logging.logEvents) {
        this.logger.error(
          `Failed to commit transaction ${this.id}: ${error.message}`,
          error.stack
        );
      }

      // Emit transaction failed event
      this.eventEmitter.emit('transaction.failed', {
        transactionId: this.id,
        metadata: this.metadata,
        error,
      });

      // Throw appropriate error
      throw new TransactionError(
        `Failed to commit transaction: ${error.message}`,
        { transactionId: this.id, cause: error }
      );
    } finally {
      // Clean up resources
      this.client = null;
    }
  }

  /**
   * Rolls back the transaction
   */
  async rollback(): Promise<void> {
    // Check if transaction is active
    if (this.metadata.state !== TransactionState.ACTIVE) {
      throw new TransactionError(
        `Cannot rollback transaction ${this.id} in state ${this.metadata.state}`,
        { transactionId: this.id }
      );
    }

    try {
      // Clear timeout if set
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }

      // Rollback the transaction
      if (this.client) {
        await (this.client as any).$rollback();
      }

      // Update metadata
      this.metadata.state = TransactionState.ROLLED_BACK;
      this.metadata.completedAt = new Date();

      // Log transaction rollback if enabled
      if (this.options.logging.logEvents) {
        this.logger.debug(`Transaction ${this.id} rolled back successfully`);
      }

      // Emit transaction rolled back event
      this.eventEmitter.emit('transaction.rolledBack', {
        transactionId: this.id,
        metadata: this.metadata,
      });
    } catch (error) {
      // Update metadata on error
      this.metadata.state = TransactionState.FAILED;
      this.metadata.error = error;

      // Log error if enabled
      if (this.options.logging.logEvents) {
        this.logger.error(
          `Failed to rollback transaction ${this.id}: ${error.message}`,
          error.stack
        );
      }

      // Emit transaction failed event
      this.eventEmitter.emit('transaction.failed', {
        transactionId: this.id,
        metadata: this.metadata,
        error,
      });

      // Throw appropriate error
      throw new TransactionError(
        `Failed to rollback transaction: ${error.message}`,
        { transactionId: this.id, cause: error }
      );
    } finally {
      // Clean up resources
      this.client = null;
    }
  }

  /**
   * Executes a callback function within the transaction
   * @param callback The function to execute within the transaction
   * @returns The result of the callback function
   */
  async execute(callback: TransactionCallback<T>): Promise<T> {
    // Check if transaction is active
    if (this.metadata.state !== TransactionState.ACTIVE) {
      throw new TransactionError(
        `Cannot execute in transaction ${this.id} in state ${this.metadata.state}`,
        { transactionId: this.id }
      );
    }

    try {
      // Execute the callback with the transaction client
      if (!this.client) {
        throw new TransactionError(
          `Transaction client is not available for transaction ${this.id}`,
          { transactionId: this.id }
        );
      }

      return await callback(this.client as unknown as PrismaClient);
    } catch (error) {
      // Log error if enabled
      if (this.options.logging.logEvents) {
        this.logger.error(
          `Error executing in transaction ${this.id}: ${error.message}`,
          error.stack
        );
      }

      // Emit transaction error event
      this.eventEmitter.emit('transaction.error', {
        transactionId: this.id,
        metadata: this.metadata,
        error,
      });

      // Throw appropriate error
      throw error;
    }
  }

  /**
   * Creates a savepoint within the transaction
   * @param name Optional name for the savepoint
   * @returns The name of the created savepoint
   */
  async createSavepoint(name?: string): Promise<string> {
    // Check if transaction is active
    if (this.metadata.state !== TransactionState.ACTIVE) {
      throw new TransactionError(
        `Cannot create savepoint in transaction ${this.id} in state ${this.metadata.state}`,
        { transactionId: this.id }
      );
    }

    // Check if savepoints are enabled
    if (!this.options.savepoint.useSavepoints) {
      throw new SavepointError(
        `Savepoints are disabled for transaction ${this.id}`,
        { transactionId: this.id }
      );
    }

    try {
      // Generate savepoint name if not provided
      const savepointName = name || `${this.options.savepoint.savepointPrefix}_${uuidv4().replace(/-/g, '')}`;
      
      // Create savepoint using raw SQL
      if (this.client) {
        await this.client.$executeRawUnsafe(`SAVEPOINT ${savepointName}`);
      }

      // Store savepoint name
      this.savepoints.set(savepointName, savepointName);

      // Log savepoint creation if enabled
      if (this.options.logging.logEvents) {
        this.logger.debug(`Created savepoint ${savepointName} in transaction ${this.id}`);
      }

      // Emit savepoint created event
      this.eventEmitter.emit('transaction.savepoint.created', {
        transactionId: this.id,
        savepointName,
      });

      return savepointName;
    } catch (error) {
      // Log error if enabled
      if (this.options.logging.logEvents) {
        this.logger.error(
          `Failed to create savepoint in transaction ${this.id}: ${error.message}`,
          error.stack
        );
      }

      // Throw appropriate error
      throw new SavepointError(
        `Failed to create savepoint: ${error.message}`,
        { transactionId: this.id, cause: error }
      );
    }
  }

  /**
   * Rolls back to a previously created savepoint
   * @param name The name of the savepoint to roll back to
   */
  async rollbackToSavepoint(name: string): Promise<void> {
    // Check if transaction is active
    if (this.metadata.state !== TransactionState.ACTIVE) {
      throw new TransactionError(
        `Cannot rollback to savepoint in transaction ${this.id} in state ${this.metadata.state}`,
        { transactionId: this.id }
      );
    }

    // Check if savepoint exists
    if (!this.savepoints.has(name)) {
      throw new SavepointError(
        `Savepoint ${name} does not exist in transaction ${this.id}`,
        { transactionId: this.id }
      );
    }

    try {
      // Rollback to savepoint using raw SQL
      if (this.client) {
        await this.client.$executeRawUnsafe(`ROLLBACK TO SAVEPOINT ${name}`);
      }

      // Log savepoint rollback if enabled
      if (this.options.logging.logEvents) {
        this.logger.debug(`Rolled back to savepoint ${name} in transaction ${this.id}`);
      }

      // Emit savepoint rolled back event
      this.eventEmitter.emit('transaction.savepoint.rolledBack', {
        transactionId: this.id,
        savepointName: name,
      });
    } catch (error) {
      // Log error if enabled
      if (this.options.logging.logEvents) {
        this.logger.error(
          `Failed to rollback to savepoint ${name} in transaction ${this.id}: ${error.message}`,
          error.stack
        );
      }

      // Throw appropriate error
      throw new SavepointError(
        `Failed to rollback to savepoint ${name}: ${error.message}`,
        { transactionId: this.id, cause: error }
      );
    }
  }

  /**
   * Creates a nested transaction within this transaction
   * @param options Options for the nested transaction
   * @returns The nested transaction
   */
  async createNestedTransaction<U>(options?: Partial<TransactionOptions>): Promise<Transaction<U>> {
    // Check if transaction is active
    if (this.metadata.state !== TransactionState.ACTIVE) {
      throw new TransactionError(
        `Cannot create nested transaction in transaction ${this.id} in state ${this.metadata.state}`,
        { transactionId: this.id }
      );
    }

    // Create nested transaction options
    const nestedOptions: Partial<TransactionOptions> = {
      ...options,
      type: TransactionType.NESTED,
      parent: this,
      journeyContext: options?.journeyContext || this.options.journeyContext,
    };

    // Create nested transaction
    const nestedTransaction = new TransactionImpl<U>(
      this.prismaService,
      this.eventEmitter,
      nestedOptions
    );

    // If savepoints are enabled, create a savepoint for the nested transaction
    if (this.options.savepoint.useSavepoints) {
      const savepointName = await this.createSavepoint(`NESTED_${nestedTransaction.id}`);
      
      // Store the savepoint name in the nested transaction metadata
      (nestedTransaction as any).savepointName = savepointName;
    }

    // Log nested transaction creation if enabled
    if (this.options.logging.logEvents) {
      this.logger.debug(
        `Created nested transaction ${nestedTransaction.id} in transaction ${this.id}`
      );
    }

    // Emit nested transaction created event
    this.eventEmitter.emit('transaction.nested.created', {
      parentTransactionId: this.id,
      nestedTransactionId: nestedTransaction.id,
    });

    return nestedTransaction;
  }

  /**
   * Handles transaction timeout
   */
  private handleTimeout(): Promise<void> {
    // Check if transaction is still active
    if (this.metadata.state !== TransactionState.ACTIVE) {
      return Promise.resolve();
    }

    // Create timeout error
    const timeoutError = new TransactionTimeoutError(
      `Transaction ${this.id} timed out after ${this.options.timeout.timeoutMs}ms`,
      { transactionId: this.id }
    );

    // Update metadata
    this.metadata.state = TransactionState.FAILED;
    this.metadata.error = timeoutError;
    this.metadata.completedAt = new Date();

    // Log timeout if enabled
    if (this.options.logging.logEvents) {
      this.logger.error(
        `Transaction ${this.id} timed out after ${this.options.timeout.timeoutMs}ms`
      );
    }

    // Emit transaction timeout event
    this.eventEmitter.emit('transaction.timeout', {
      transactionId: this.id,
      metadata: this.metadata,
      error: timeoutError,
    });

    // Rollback transaction if configured
    if (this.options.timeout.autoRollbackOnTimeout) {
      return this.rollback().catch((error) => {
        this.logger.error(
          `Failed to rollback transaction ${this.id} after timeout: ${error.message}`,
          error.stack
        );
      });
    }

    return Promise.resolve();
  }
}

/**
 * Implementation of a distributed transaction that coordinates transactions across multiple services
 */
class DistributedTransactionImpl<T> implements Transaction<T> {
  public readonly id: string;
  public readonly metadata: TransactionMetadata;
  public readonly options: Required<TransactionOptions>;
  private localTransaction: TransactionImpl<T> | null = null;
  private participants: Map<string, any> = new Map();
  private preparePromises: Map<string, Promise<boolean>> = new Map();
  private commitPromises: Map<string, Promise<boolean>> = new Map();
  private readonly logger = new Logger(DistributedTransactionImpl.name);
  private readonly prismaService: PrismaService;
  private readonly eventEmitter: EventEmitter2;

  constructor(
    prismaService: PrismaService,
    eventEmitter: EventEmitter2,
    transactionId: string,
    options?: Partial<TransactionOptions>
  ) {
    this.id = transactionId;
    this.prismaService = prismaService;
    this.eventEmitter = eventEmitter;
    
    // Merge provided options with defaults
    this.options = {
      ...DEFAULT_TRANSACTION_OPTIONS,
      ...options,
      distributed: {
        ...DEFAULT_TRANSACTION_OPTIONS.distributed,
        ...options?.distributed,
        isDistributed: true,
        transactionId: transactionId,
      },
      type: TransactionType.DISTRIBUTED,
    };

    // Initialize metadata
    this.metadata = {
      id: this.id,
      createdAt: new Date(),
      state: TransactionState.CREATED,
      type: TransactionType.DISTRIBUTED,
      isolationLevel: this.options.isolationLevel || TransactionIsolationLevel.READ_COMMITTED,
      journeyContext: this.options.journeyContext || 'default',
      retryCount: 0,
    };

    // Log transaction creation if enabled
    if (this.options.logging.logEvents) {
      this.logger.debug(
        `Distributed transaction ${this.id} created for journey ${this.metadata.journeyContext}`
      );
    }

    // Emit transaction created event
    this.eventEmitter.emit('transaction.distributed.created', {
      transactionId: this.id,
      metadata: this.metadata,
      options: this.options,
    });
  }

  /**
   * Gets the current state of the transaction
   */
  get state(): TransactionState {
    return this.metadata.state;
  }

  /**
   * Starts the distributed transaction
   */
  async start(): Promise<void> {
    // Check if transaction is already started
    if (this.metadata.state !== TransactionState.CREATED) {
      throw new DistributedTransactionError(
        `Cannot start distributed transaction ${this.id} in state ${this.metadata.state}`,
        { transactionId: this.id }
      );
    }

    try {
      // Create local transaction
      this.localTransaction = new TransactionImpl<T>(
        this.prismaService,
        this.eventEmitter,
        {
          ...this.options,
          type: TransactionType.STANDARD,
        }
      );

      // Start local transaction
      await this.localTransaction.start();

      // Update metadata
      this.metadata.state = TransactionState.ACTIVE;
      this.metadata.startedAt = new Date();

      // Log transaction start if enabled
      if (this.options.logging.logEvents) {
        this.logger.debug(`Distributed transaction ${this.id} started`);
      }

      // Emit transaction started event
      this.eventEmitter.emit('transaction.distributed.started', {
        transactionId: this.id,
        metadata: this.metadata,
      });
    } catch (error) {
      // Update metadata on error
      this.metadata.state = TransactionState.FAILED;
      this.metadata.error = error;

      // Log error if enabled
      if (this.options.logging.logEvents) {
        this.logger.error(
          `Failed to start distributed transaction ${this.id}: ${error.message}`,
          error.stack
        );
      }

      // Emit transaction failed event
      this.eventEmitter.emit('transaction.distributed.failed', {
        transactionId: this.id,
        metadata: this.metadata,
        error,
      });

      // Throw appropriate error
      throw new DistributedTransactionError(
        `Failed to start distributed transaction: ${error.message}`,
        { transactionId: this.id, cause: error }
      );
    }
  }

  /**
   * Registers a participant in the distributed transaction
   * @param participantId Unique identifier for the participant
   * @param participant Participant object with prepare and commit methods
   */
  registerParticipant(participantId: string, participant: any): void {
    // Check if transaction is active
    if (this.metadata.state !== TransactionState.ACTIVE) {
      throw new DistributedTransactionError(
        `Cannot register participant in distributed transaction ${this.id} in state ${this.metadata.state}`,
        { transactionId: this.id }
      );
    }

    // Check if participant has required methods
    if (!participant.prepare || !participant.commit || !participant.rollback) {
      throw new DistributedTransactionError(
        `Participant ${participantId} does not implement required methods (prepare, commit, rollback)`,
        { transactionId: this.id }
      );
    }

    // Register participant
    this.participants.set(participantId, participant);

    // Log participant registration if enabled
    if (this.options.logging.logEvents) {
      this.logger.debug(
        `Registered participant ${participantId} in distributed transaction ${this.id}`
      );
    }

    // Emit participant registered event
    this.eventEmitter.emit('transaction.distributed.participantRegistered', {
      transactionId: this.id,
      participantId,
    });
  }

  /**
   * Commits the distributed transaction using two-phase commit protocol
   */
  async commit(): Promise<void> {
    // Check if transaction is active
    if (this.metadata.state !== TransactionState.ACTIVE) {
      throw new DistributedTransactionError(
        `Cannot commit distributed transaction ${this.id} in state ${this.metadata.state}`,
        { transactionId: this.id }
      );
    }

    try {
      // Phase 1: Prepare all participants
      const prepareResult = await this.prepareAll();

      // If any participant failed to prepare, rollback the transaction
      if (!prepareResult) {
        await this.rollback();
        throw new DistributedTransactionError(
          `Failed to prepare all participants for distributed transaction ${this.id}`,
          { transactionId: this.id }
        );
      }

      // Phase 2: Commit all participants
      await this.commitAll();

      // Commit local transaction
      if (this.localTransaction) {
        await this.localTransaction.commit();
      }

      // Update metadata
      this.metadata.state = TransactionState.COMMITTED;
      this.metadata.completedAt = new Date();

      // Log transaction commit if enabled
      if (this.options.logging.logEvents) {
        this.logger.debug(`Distributed transaction ${this.id} committed successfully`);
      }

      // Log performance metrics if enabled
      if (this.options.logging.logPerformance && this.metadata.startedAt) {
        const duration = this.metadata.completedAt.getTime() - this.metadata.startedAt.getTime();
        this.logger.debug(`Distributed transaction ${this.id} completed in ${duration}ms`);
      }

      // Emit transaction committed event
      this.eventEmitter.emit('transaction.distributed.committed', {
        transactionId: this.id,
        metadata: this.metadata,
      });
    } catch (error) {
      // Update metadata on error
      this.metadata.state = TransactionState.FAILED;
      this.metadata.error = error;

      // Log error if enabled
      if (this.options.logging.logEvents) {
        this.logger.error(
          `Failed to commit distributed transaction ${this.id}: ${error.message}`,
          error.stack
        );
      }

      // Emit transaction failed event
      this.eventEmitter.emit('transaction.distributed.failed', {
        transactionId: this.id,
        metadata: this.metadata,
        error,
      });

      // Throw appropriate error
      throw new DistributedTransactionError(
        `Failed to commit distributed transaction: ${error.message}`,
        { transactionId: this.id, cause: error }
      );
    }
  }

  /**
   * Rolls back the distributed transaction
   */
  async rollback(): Promise<void> {
    // Check if transaction is active or failed
    if (this.metadata.state !== TransactionState.ACTIVE && this.metadata.state !== TransactionState.FAILED) {
      throw new DistributedTransactionError(
        `Cannot rollback distributed transaction ${this.id} in state ${this.metadata.state}`,
        { transactionId: this.id }
      );
    }

    try {
      // Rollback all participants
      await this.rollbackAll();

      // Rollback local transaction
      if (this.localTransaction && this.localTransaction.state === TransactionState.ACTIVE) {
        await this.localTransaction.rollback();
      }

      // Update metadata
      this.metadata.state = TransactionState.ROLLED_BACK;
      this.metadata.completedAt = new Date();

      // Log transaction rollback if enabled
      if (this.options.logging.logEvents) {
        this.logger.debug(`Distributed transaction ${this.id} rolled back successfully`);
      }

      // Emit transaction rolled back event
      this.eventEmitter.emit('transaction.distributed.rolledBack', {
        transactionId: this.id,
        metadata: this.metadata,
      });
    } catch (error) {
      // Update metadata on error
      this.metadata.state = TransactionState.FAILED;
      this.metadata.error = error;

      // Log error if enabled
      if (this.options.logging.logEvents) {
        this.logger.error(
          `Failed to rollback distributed transaction ${this.id}: ${error.message}`,
          error.stack
        );
      }

      // Emit transaction failed event
      this.eventEmitter.emit('transaction.distributed.failed', {
        transactionId: this.id,
        metadata: this.metadata,
        error,
      });

      // Throw appropriate error
      throw new DistributedTransactionError(
        `Failed to rollback distributed transaction: ${error.message}`,
        { transactionId: this.id, cause: error }
      );
    }
  }

  /**
   * Executes a callback function within the transaction
   * @param callback The function to execute within the transaction
   * @returns The result of the callback function
   */
  async execute(callback: TransactionCallback<T>): Promise<T> {
    // Check if transaction is active
    if (this.metadata.state !== TransactionState.ACTIVE) {
      throw new DistributedTransactionError(
        `Cannot execute in distributed transaction ${this.id} in state ${this.metadata.state}`,
        { transactionId: this.id }
      );
    }

    // Execute callback in local transaction
    if (!this.localTransaction) {
      throw new DistributedTransactionError(
        `Local transaction is not available for distributed transaction ${this.id}`,
        { transactionId: this.id }
      );
    }

    return this.localTransaction.execute(callback);
  }

  /**
   * Creates a savepoint within the transaction
   * @param name Optional name for the savepoint
   * @returns The name of the created savepoint
   */
  async createSavepoint(name?: string): Promise<string> {
    // Check if transaction is active
    if (this.metadata.state !== TransactionState.ACTIVE) {
      throw new DistributedTransactionError(
        `Cannot create savepoint in distributed transaction ${this.id} in state ${this.metadata.state}`,
        { transactionId: this.id }
      );
    }

    // Create savepoint in local transaction
    if (!this.localTransaction) {
      throw new DistributedTransactionError(
        `Local transaction is not available for distributed transaction ${this.id}`,
        { transactionId: this.id }
      );
    }

    return this.localTransaction.createSavepoint(name);
  }

  /**
   * Rolls back to a previously created savepoint
   * @param name The name of the savepoint to roll back to
   */
  async rollbackToSavepoint(name: string): Promise<void> {
    // Check if transaction is active
    if (this.metadata.state !== TransactionState.ACTIVE) {
      throw new DistributedTransactionError(
        `Cannot rollback to savepoint in distributed transaction ${this.id} in state ${this.metadata.state}`,
        { transactionId: this.id }
      );
    }

    // Rollback to savepoint in local transaction
    if (!this.localTransaction) {
      throw new DistributedTransactionError(
        `Local transaction is not available for distributed transaction ${this.id}`,
        { transactionId: this.id }
      );
    }

    return this.localTransaction.rollbackToSavepoint(name);
  }

  /**
   * Creates a nested transaction within this transaction
   * @param options Options for the nested transaction
   * @returns The nested transaction
   */
  async createNestedTransaction<U>(options?: Partial<TransactionOptions>): Promise<Transaction<U>> {
    // Check if transaction is active
    if (this.metadata.state !== TransactionState.ACTIVE) {
      throw new DistributedTransactionError(
        `Cannot create nested transaction in distributed transaction ${this.id} in state ${this.metadata.state}`,
        { transactionId: this.id }
      );
    }

    // Create nested transaction in local transaction
    if (!this.localTransaction) {
      throw new DistributedTransactionError(
        `Local transaction is not available for distributed transaction ${this.id}`,
        { transactionId: this.id }
      );
    }

    return this.localTransaction.createNestedTransaction<U>(options);
  }

  /**
   * Prepares all participants for commit (Phase 1 of two-phase commit)
   * @returns True if all participants are prepared, false otherwise
   */
  private async prepareAll(): Promise<boolean> {
    // Log prepare phase if enabled
    if (this.options.logging.logEvents) {
      this.logger.debug(
        `Preparing ${this.participants.size} participants for distributed transaction ${this.id}`
      );
    }

    // Prepare all participants with timeout
    for (const [participantId, participant] of this.participants.entries()) {
      try {
        // Create prepare promise with timeout
        const preparePromise = Promise.race([
          participant.prepare(),
          new Promise<boolean>((_, reject) => {
            setTimeout(() => {
              reject(new DistributedTransactionError(
                `Prepare timeout for participant ${participantId}`,
                { transactionId: this.id }
              ));
            }, this.options.distributed.prepareTimeoutMs);
          }),
        ]);

        // Store prepare promise
        this.preparePromises.set(participantId, preparePromise);
      } catch (error) {
        // Log error if enabled
        if (this.options.logging.logEvents) {
          this.logger.error(
            `Failed to prepare participant ${participantId} for distributed transaction ${this.id}: ${error.message}`,
            error.stack
          );
        }

        // Emit participant prepare failed event
        this.eventEmitter.emit('transaction.distributed.participantPrepareFailed', {
          transactionId: this.id,
          participantId,
          error,
        });

        return false;
      }
    }

    // Wait for all prepare promises to resolve
    try {
      const prepareResults = await Promise.all(Array.from(this.preparePromises.values()));
      const allPrepared = prepareResults.every(result => result === true);

      // Log prepare results if enabled
      if (this.options.logging.logEvents) {
        this.logger.debug(
          `Prepare phase ${allPrepared ? 'succeeded' : 'failed'} for distributed transaction ${this.id}`
        );
      }

      // Emit prepare phase completed event
      this.eventEmitter.emit('transaction.distributed.preparePhaseCompleted', {
        transactionId: this.id,
        success: allPrepared,
      });

      return allPrepared;
    } catch (error) {
      // Log error if enabled
      if (this.options.logging.logEvents) {
        this.logger.error(
          `Prepare phase failed for distributed transaction ${this.id}: ${error.message}`,
          error.stack
        );
      }

      // Emit prepare phase failed event
      this.eventEmitter.emit('transaction.distributed.preparePhaseFailed', {
        transactionId: this.id,
        error,
      });

      return false;
    }
  }

  /**
   * Commits all participants (Phase 2 of two-phase commit)
   */
  private async commitAll(): Promise<void> {
    // Log commit phase if enabled
    if (this.options.logging.logEvents) {
      this.logger.debug(
        `Committing ${this.participants.size} participants for distributed transaction ${this.id}`
      );
    }

    // Commit all participants with timeout
    for (const [participantId, participant] of this.participants.entries()) {
      try {
        // Create commit promise with timeout
        const commitPromise = Promise.race([
          participant.commit(),
          new Promise<boolean>((_, reject) => {
            setTimeout(() => {
              reject(new DistributedTransactionError(
                `Commit timeout for participant ${participantId}`,
                { transactionId: this.id }
              ));
            }, this.options.distributed.commitTimeoutMs);
          }),
        ]);

        // Store commit promise
        this.commitPromises.set(participantId, commitPromise);
      } catch (error) {
        // Log error if enabled
        if (this.options.logging.logEvents) {
          this.logger.error(
            `Failed to commit participant ${participantId} for distributed transaction ${this.id}: ${error.message}`,
            error.stack
          );
        }

        // Emit participant commit failed event
        this.eventEmitter.emit('transaction.distributed.participantCommitFailed', {
          transactionId: this.id,
          participantId,
          error,
        });

        throw error;
      }
    }

    // Wait for all commit promises to resolve
    try {
      await Promise.all(Array.from(this.commitPromises.values()));

      // Log commit results if enabled
      if (this.options.logging.logEvents) {
        this.logger.debug(
          `Commit phase succeeded for distributed transaction ${this.id}`
        );
      }

      // Emit commit phase completed event
      this.eventEmitter.emit('transaction.distributed.commitPhaseCompleted', {
        transactionId: this.id,
        success: true,
      });
    } catch (error) {
      // Log error if enabled
      if (this.options.logging.logEvents) {
        this.logger.error(
          `Commit phase failed for distributed transaction ${this.id}: ${error.message}`,
          error.stack
        );
      }

      // Emit commit phase failed event
      this.eventEmitter.emit('transaction.distributed.commitPhaseFailed', {
        transactionId: this.id,
        error,
      });

      throw error;
    }
  }

  /**
   * Rolls back all participants
   */
  private async rollbackAll(): Promise<void> {
    // Log rollback if enabled
    if (this.options.logging.logEvents) {
      this.logger.debug(
        `Rolling back ${this.participants.size} participants for distributed transaction ${this.id}`
      );
    }

    // Rollback all participants
    const rollbackPromises: Promise<void>[] = [];
    const rollbackErrors: Error[] = [];

    for (const [participantId, participant] of this.participants.entries()) {
      try {
        // Create rollback promise
        const rollbackPromise = participant.rollback().catch((error: Error) => {
          // Log error if enabled
          if (this.options.logging.logEvents) {
            this.logger.error(
              `Failed to rollback participant ${participantId} for distributed transaction ${this.id}: ${error.message}`,
              error.stack
            );
          }

          // Emit participant rollback failed event
          this.eventEmitter.emit('transaction.distributed.participantRollbackFailed', {
            transactionId: this.id,
            participantId,
            error,
          });

          // Store error for later
          rollbackErrors.push(error);
        });

        rollbackPromises.push(rollbackPromise);
      } catch (error) {
        // Log error if enabled
        if (this.options.logging.logEvents) {
          this.logger.error(
            `Failed to initiate rollback for participant ${participantId} for distributed transaction ${this.id}: ${error.message}`,
            error.stack
          );
        }

        // Store error for later
        rollbackErrors.push(error);
      }
    }

    // Wait for all rollback promises to resolve
    await Promise.all(rollbackPromises);

    // If there were any errors, throw a combined error
    if (rollbackErrors.length > 0) {
      throw new DistributedTransactionError(
        `Failed to rollback all participants for distributed transaction ${this.id}`,
        { transactionId: this.id, cause: rollbackErrors[0] }
      );
    }

    // Log rollback results if enabled
    if (this.options.logging.logEvents) {
      this.logger.debug(
        `Rollback succeeded for distributed transaction ${this.id}`
      );
    }

    // Emit rollback completed event
    this.eventEmitter.emit('transaction.distributed.rollbackCompleted', {
      transactionId: this.id,
      success: true,
    });
  }
}

/**
 * Injectable service that implements transaction management functionality for the application.
 * Provides methods for starting, committing, and rolling back transactions with support for
 * different isolation levels, savepoints, and distributed transactions.
 */
@Injectable()
export class TransactionService implements TransactionManager, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TransactionService.name);
  private readonly activeTransactions = new Map<string, Transaction<any>>();
  private readonly journeyTransactions = new Map<string, Set<string>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Initializes the transaction service when the application starts
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing TransactionService...');

    // Set up event listeners
    this.setupEventListeners();

    // Set up cleanup interval for abandoned transactions
    this.cleanupInterval = setInterval(() => {
      this.cleanupAbandonedTransactions();
    }, 60000); // Check every minute

    this.logger.log('TransactionService initialized successfully');
  }

  /**
   * Cleans up resources when the application shuts down
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down TransactionService...');

    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Rollback all active transactions
    const activeTransactionIds = Array.from(this.activeTransactions.keys());
    if (activeTransactionIds.length > 0) {
      this.logger.warn(
        `Rolling back ${activeTransactionIds.length} active transactions during shutdown`
      );

      for (const transactionId of activeTransactionIds) {
        try {
          const transaction = this.activeTransactions.get(transactionId);
          if (transaction && transaction.state === TransactionState.ACTIVE) {
            await transaction.rollback();
          }
        } catch (error) {
          this.logger.error(
            `Failed to rollback transaction ${transactionId} during shutdown: ${error.message}`,
            error.stack
          );
        }
      }
    }

    this.logger.log('TransactionService shut down successfully');
  }

  /**
   * Creates a new transaction with the specified options
   * @param options Options for the transaction
   * @returns The created transaction
   */
  async createTransaction<T>(options?: Partial<TransactionOptions>): Promise<Transaction<T>> {
    // Create transaction
    const transaction = new TransactionImpl<T>(
      this.prismaService,
      this.eventEmitter,
      options
    );

    // Store transaction
    this.activeTransactions.set(transaction.id, transaction);

    // Store journey transaction mapping
    const journeyContext = options?.journeyContext || 'default';
    if (!this.journeyTransactions.has(journeyContext)) {
      this.journeyTransactions.set(journeyContext, new Set());
    }
    this.journeyTransactions.get(journeyContext)?.add(transaction.id);

    return transaction;
  }

  /**
   * Executes a callback function within a transaction
   * @param callback The function to execute within the transaction
   * @param options Options for the transaction
   * @returns The result of the callback function
   */
  async executeTransaction<T>(
    callback: TransactionCallback<T>,
    options?: Partial<TransactionOptions>
  ): Promise<T> {
    // Create transaction
    const transaction = await this.createTransaction<T>(options);

    try {
      // Start transaction
      await transaction.start();

      // Execute callback
      const result = await transaction.execute(callback);

      // Commit transaction
      await transaction.commit();

      return result;
    } catch (error) {
      // Rollback transaction on error
      if (transaction.state === TransactionState.ACTIVE) {
        try {
          await transaction.rollback();
        } catch (rollbackError) {
          this.logger.error(
            `Failed to rollback transaction ${transaction.id} after error: ${rollbackError.message}`,
            rollbackError.stack
          );
        }
      }

      // Throw original error
      throw error;
    } finally {
      // Remove transaction from active transactions
      this.removeTransaction(transaction.id);
    }
  }

  /**
   * Executes a callback function within a transaction with retry logic for transient errors
   * @param callback The function to execute within the transaction
   * @param options Options for the transaction and retry
   * @returns The result of the callback function
   */
  async executeTransactionWithRetry<T>(
    callback: TransactionCallback<T>,
    options?: Partial<TransactionOptions> & {
      maxRetries?: number;
      baseDelayMs?: number;
      maxDelayMs?: number;
      useJitter?: boolean;
    }
  ): Promise<T> {
    // Extract retry options
    const maxRetries = options?.maxRetries || options?.retry?.maxRetries || DEFAULT_TRANSACTION_OPTIONS.retry.maxRetries;
    const baseDelayMs = options?.baseDelayMs || options?.retry?.baseDelayMs || DEFAULT_TRANSACTION_OPTIONS.retry.baseDelayMs;
    const maxDelayMs = options?.maxDelayMs || options?.retry?.maxDelayMs || DEFAULT_TRANSACTION_OPTIONS.retry.maxDelayMs;
    const useJitter = options?.useJitter !== undefined ? options.useJitter : 
      (options?.retry?.useJitter !== undefined ? options.retry.useJitter : DEFAULT_TRANSACTION_OPTIONS.retry.useJitter);

    let attempt = 0;
    let lastError: any;

    while (attempt <= maxRetries) {
      try {
        return await this.executeTransaction(callback, options);
      } catch (error) {
        lastError = error;
        attempt++;

        // Check if error is retryable
        const isRetryable = this.isRetryableError(error);

        if (!isRetryable || attempt > maxRetries) {
          throw error;
        }

        // Calculate delay with exponential backoff and optional jitter
        const baseDelay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1));
        const delay = useJitter ? baseDelay * (0.5 + Math.random() * 0.5) : baseDelay;

        this.logger.warn(
          `Transaction failed (attempt ${attempt}/${maxRetries + 1}). ` +
          `Retrying in ${Math.round(delay)}ms...`,
          error
        );

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // This should never happen, but TypeScript requires a return statement
    throw lastError;
  }

  /**
   * Creates a distributed transaction that spans multiple services
   * @param transactionId Unique identifier for the distributed transaction
   * @param options Options for the transaction
   * @returns The created distributed transaction
   */
  async createDistributedTransaction<T>(
    transactionId: string,
    options?: Partial<TransactionOptions>
  ): Promise<Transaction<T>> {
    // Create distributed transaction
    const transaction = new DistributedTransactionImpl<T>(
      this.prismaService,
      this.eventEmitter,
      transactionId,
      options
    );

    // Store transaction
    this.activeTransactions.set(transaction.id, transaction);

    // Store journey transaction mapping
    const journeyContext = options?.journeyContext || 'default';
    if (!this.journeyTransactions.has(journeyContext)) {
      this.journeyTransactions.set(journeyContext, new Set());
    }
    this.journeyTransactions.get(journeyContext)?.add(transaction.id);

    return transaction;
  }

  /**
   * Gets an active transaction by its ID
   * @param transactionId The ID of the transaction to get
   * @returns The transaction, or null if not found
   */
  async getTransaction(transactionId: string): Promise<Transaction<any> | null> {
    return this.activeTransactions.get(transactionId) || null;
  }

  /**
   * Gets all active transactions
   * @returns An array of all active transactions
   */
  async getActiveTransactions(): Promise<Transaction<any>[]> {
    return Array.from(this.activeTransactions.values()).filter(
      transaction => transaction.state === TransactionState.ACTIVE
    );
  }

  /**
   * Gets all active transactions for a specific journey context
   * @param journeyContext The journey context to filter by
   * @returns An array of active transactions for the journey
   */
  async getJourneyTransactions(journeyContext: string): Promise<Transaction<any>[]> {
    const transactionIds = this.journeyTransactions.get(journeyContext) || new Set();
    return Array.from(transactionIds)
      .map(id => this.activeTransactions.get(id))
      .filter(transaction => transaction && transaction.state === TransactionState.ACTIVE) as Transaction<any>[];
  }

  /**
   * Starts a transaction with the specified options
   * @param options Options for the transaction
   * @returns The started transaction client
   */
  async startTransaction(options?: Partial<TransactionOptions>): Promise<Prisma.TransactionClient> {
    // Create transaction
    const transaction = await this.createTransaction(options);

    // Start transaction
    await transaction.start();

    // Return transaction client
    return transaction.execute(client => Promise.resolve(client)) as Promise<Prisma.TransactionClient>;
  }

  /**
   * Commits a transaction
   * @param client The transaction client to commit
   */
  async commitTransaction(client: Prisma.TransactionClient): Promise<void> {
    // Find transaction by client
    const transaction = await this.findTransactionByClient(client);
    if (!transaction) {
      throw new TransactionError(
        'Cannot commit transaction: transaction not found',
        { transactionId: 'unknown' }
      );
    }

    try {
      // Commit transaction
      await transaction.commit();
    } finally {
      // Remove transaction from active transactions
      this.removeTransaction(transaction.id);
    }
  }

  /**
   * Rolls back a transaction
   * @param client The transaction client to roll back
   */
  async rollbackTransaction(client: Prisma.TransactionClient): Promise<void> {
    // Find transaction by client
    const transaction = await this.findTransactionByClient(client);
    if (!transaction) {
      throw new TransactionError(
        'Cannot rollback transaction: transaction not found',
        { transactionId: 'unknown' }
      );
    }

    try {
      // Rollback transaction
      await transaction.rollback();
    } finally {
      // Remove transaction from active transactions
      this.removeTransaction(transaction.id);
    }
  }

  /**
   * Creates a savepoint within a transaction
   * @param client The transaction client
   * @param name Optional name for the savepoint
   * @returns The name of the created savepoint
   */
  async createSavepoint(client: Prisma.TransactionClient, name?: string): Promise<string> {
    // Find transaction by client
    const transaction = await this.findTransactionByClient(client);
    if (!transaction) {
      throw new SavepointError(
        'Cannot create savepoint: transaction not found',
        { transactionId: 'unknown' }
      );
    }

    // Create savepoint
    return transaction.createSavepoint(name);
  }

  /**
   * Rolls back to a previously created savepoint
   * @param client The transaction client
   * @param name The name of the savepoint to roll back to
   */
  async rollbackToSavepoint(client: Prisma.TransactionClient, name: string): Promise<void> {
    // Find transaction by client
    const transaction = await this.findTransactionByClient(client);
    if (!transaction) {
      throw new SavepointError(
        'Cannot rollback to savepoint: transaction not found',
        { transactionId: 'unknown' }
      );
    }

    // Rollback to savepoint
    return transaction.rollbackToSavepoint(name);
  }

  /**
   * Finds a transaction by its client
   * @param client The transaction client
   * @returns The transaction, or null if not found
   */
  private async findTransactionByClient(client: Prisma.TransactionClient): Promise<Transaction<any> | null> {
    // Get client ID from client object
    const clientId = (client as any)?._clientId || (client as any)?.__id;
    if (!clientId) {
      return null;
    }

    // Find transaction by client ID
    for (const transaction of this.activeTransactions.values()) {
      const transactionClient = await transaction.execute(c => Promise.resolve(c));
      const transactionClientId = (transactionClient as any)?._clientId || (transactionClient as any)?.__id;

      if (transactionClientId === clientId) {
        return transaction;
      }
    }

    return null;
  }

  /**
   * Removes a transaction from active transactions
   * @param transactionId The ID of the transaction to remove
   */
  private removeTransaction(transactionId: string): void {
    // Get transaction
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      return;
    }

    // Remove from active transactions
    this.activeTransactions.delete(transactionId);

    // Remove from journey transactions
    const journeyContext = transaction.metadata.journeyContext;
    const journeyTransactions = this.journeyTransactions.get(journeyContext);
    if (journeyTransactions) {
      journeyTransactions.delete(transactionId);
      if (journeyTransactions.size === 0) {
        this.journeyTransactions.delete(journeyContext);
      }
    }
  }

  /**
   * Cleans up abandoned transactions
   */
  private cleanupAbandonedTransactions(): void {
    const now = Date.now();
    const abandonedTransactions: Transaction<any>[] = [];

    // Find abandoned transactions
    for (const transaction of this.activeTransactions.values()) {
      if (transaction.state === TransactionState.ACTIVE && transaction.metadata.startedAt) {
        const transactionAge = now - transaction.metadata.startedAt.getTime();
        const timeoutMs = transaction.options.timeout.timeoutMs;

        // Consider transaction abandoned if it's been active for more than twice its timeout
        if (transactionAge > timeoutMs * 2) {
          abandonedTransactions.push(transaction);
        }
      }
    }

    // Rollback abandoned transactions
    if (abandonedTransactions.length > 0) {
      this.logger.warn(`Found ${abandonedTransactions.length} abandoned transactions to clean up`);

      for (const transaction of abandonedTransactions) {
        this.logger.warn(
          `Rolling back abandoned transaction ${transaction.id} ` +
          `(age: ${now - (transaction.metadata.startedAt?.getTime() || 0)}ms)`
        );

        transaction.rollback().catch(error => {
          this.logger.error(
            `Failed to rollback abandoned transaction ${transaction.id}: ${error.message}`,
            error.stack
          );
        });
      }
    }
  }

  /**
   * Sets up event listeners for transaction events
   */
  private setupEventListeners(): void {
    // Listen for transaction events
    this.eventEmitter.on('transaction.committed', ({ transactionId }) => {
      this.removeTransaction(transactionId);
    });

    this.eventEmitter.on('transaction.rolledBack', ({ transactionId }) => {
      this.removeTransaction(transactionId);
    });

    this.eventEmitter.on('transaction.failed', ({ transactionId }) => {
      this.removeTransaction(transactionId);
    });

    this.eventEmitter.on('transaction.timeout', ({ transactionId }) => {
      this.removeTransaction(transactionId);
    });

    // Listen for distributed transaction events
    this.eventEmitter.on('transaction.distributed.committed', ({ transactionId }) => {
      this.removeTransaction(transactionId);
    });

    this.eventEmitter.on('transaction.distributed.rolledBack', ({ transactionId }) => {
      this.removeTransaction(transactionId);
    });

    this.eventEmitter.on('transaction.distributed.failed', ({ transactionId }) => {
      this.removeTransaction(transactionId);
    });
  }

  /**
   * Checks if an error is retryable
   * @param error The error to check
   * @returns True if the error is retryable, false otherwise
   */
  private isRetryableError(error: any): boolean {
    // Check if error is a transaction error
    if (error instanceof TransactionError) {
      // Deadlock errors are retryable
      if (error instanceof DeadlockError) {
        return true;
      }

      // Transaction timeout errors are retryable
      if (error instanceof TransactionTimeoutError) {
        return true;
      }

      // Transaction aborted errors are retryable
      if (error instanceof TransactionAbortedError) {
        return true;
      }
    }

    // Check if error is a Prisma error
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Connection errors (P1000, P1001, P1002)
      if (['P1000', 'P1001', 'P1002'].includes(error.code)) {
        return true;
      }

      // Timeout errors (P1008)
      if (error.code === 'P1008') {
        return true;
      }

      // Transaction errors (P2028, P2034)
      if (['P2028', 'P2034'].includes(error.code)) {
        return true;
      }

      // Deadlock errors (P2043)
      if (error.code === 'P2043') {
        return true;
      }
    }

    // Check if error is a database exception
    if (error instanceof DatabaseException) {
      // Connection errors are retryable
      if (error.type === DatabaseErrorType.CONNECTION) {
        return true;
      }

      // Transaction errors are retryable
      if (error.type === DatabaseErrorType.TRANSACTION) {
        return true;
      }

      // Deadlock errors are retryable
      if (error.type === DatabaseErrorType.DEADLOCK) {
        return true;
      }
    }

    // Check for specific error messages that indicate transient issues
    if (error.message && (
      error.message.includes('deadlock') ||
      error.message.includes('lock timeout') ||
      error.message.includes('serialization failure') ||
      error.message.includes('connection') ||
      error.message.includes('timeout') ||
      error.message.includes('too many connections') ||
      error.message.includes('connection reset') ||
      error.message.includes('connection refused')
    )) {
      return true;
    }

    return false;
  }
}
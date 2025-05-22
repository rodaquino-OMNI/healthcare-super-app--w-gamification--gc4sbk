/**
 * @file transaction.mock.ts
 * @description Provides mock implementations of transaction management components for testing.
 * Includes mock versions of TransactionService, transaction decorators, and utility functions
 * to enable testing of transaction-dependent code without requiring actual database transactions.
 */

import { Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { 
  TransactionManager,
  TransactionClient,
  TransactionCallback,
  TransactionOptions,
  TransactionIsolationLevel,
  TransactionResult,
  DistributedTransactionOptions,
  DistributedTransactionCoordinator,
  TransactionRetryStrategy
} from '../../src/transactions/transaction.interface';
import {
  TransactionError,
  TransactionTimeoutError,
  DeadlockError,
  SerializationError,
  DistributedTransactionError,
  TransactionAbortedError,
  ConnectionLostError
} from '../../src/transactions/transaction.errors';

/**
 * Transaction state for tracking mock transactions
 */
export enum MockTransactionState {
  ACTIVE = 'active',
  COMMITTED = 'committed',
  ROLLED_BACK = 'rolled_back',
  FAILED = 'failed',
  TIMED_OUT = 'timed_out'
}

/**
 * Configuration for simulating transaction failures
 */
export interface MockTransactionFailureConfig {
  /**
   * Whether to simulate a transaction failure
   */
  shouldFail?: boolean;

  /**
   * The type of error to simulate
   */
  errorType?: 'timeout' | 'deadlock' | 'serialization' | 'connection' | 'distributed' | 'generic';

  /**
   * The operation during which the error should occur
   */
  failDuring?: 'begin' | 'execute' | 'commit' | 'rollback';

  /**
   * Custom error message for the simulated error
   */
  errorMessage?: string;

  /**
   * Delay in milliseconds before the error occurs
   */
  errorDelay?: number;

  /**
   * Number of operations to allow before failing
   * (e.g., allow 2 successful operations before failing on the 3rd)
   */
  failAfterOperations?: number;
}

/**
 * Mock transaction record for tracking transaction state
 */
export interface MockTransactionRecord {
  /**
   * Unique identifier for the transaction
   */
  id: string;

  /**
   * Current state of the transaction
   */
  state: MockTransactionState;

  /**
   * Time when the transaction was started
   */
  startedAt: Date;

  /**
   * Time when the transaction was completed (committed or rolled back)
   */
  completedAt?: Date;

  /**
   * Isolation level used for the transaction
   */
  isolationLevel: TransactionIsolationLevel;

  /**
   * Whether the transaction is read-only
   */
  readOnly: boolean;

  /**
   * Operations performed within the transaction
   */
  operations: Array<{
    type: string;
    entity?: string;
    params?: any;
    timestamp: Date;
    success: boolean;
    error?: Error;
  }>;

  /**
   * Error that occurred during the transaction, if any
   */
  error?: Error;

  /**
   * Savepoints created within the transaction
   */
  savepoints: Array<{
    name: string;
    createdAt: Date;
    operations: number; // Index of operations array at time of savepoint creation
  }>;

  /**
   * Number of retry attempts for this transaction
   */
  retryAttempts: number;

  /**
   * Journey context associated with the transaction, if any
   */
  journeyContext?: {
    journeyType: 'health' | 'care' | 'plan';
    userId?: string;
    sessionId?: string;
  };
}

/**
 * Mock implementation of a transaction client for testing
 */
export class MockTransactionClient implements TransactionClient {
  private transactionId: string;
  private transactionState: MockTransactionState;
  private operations: MockTransactionRecord['operations'] = [];
  private failureConfig?: MockTransactionFailureConfig;
  private operationCount = 0;

  /**
   * Creates a new MockTransactionClient
   * 
   * @param transactionId - Unique identifier for the transaction
   * @param failureConfig - Configuration for simulating transaction failures
   */
  constructor(transactionId: string, failureConfig?: MockTransactionFailureConfig) {
    this.transactionId = transactionId;
    this.transactionState = MockTransactionState.ACTIVE;
    this.failureConfig = failureConfig;
  }

  /**
   * Records an operation performed within the transaction
   * 
   * @param type - Type of operation (e.g., 'create', 'update', 'delete')
   * @param entity - Entity being operated on (e.g., 'user', 'profile')
   * @param params - Parameters for the operation
   * @returns The result of the operation (simulated)
   * @throws Error if the transaction is not active or if a failure is simulated
   */
  public recordOperation<T>(type: string, entity?: string, params?: any): T {
    if (this.transactionState !== MockTransactionState.ACTIVE) {
      throw new TransactionError(`Cannot perform operation: transaction is not active (state: ${this.transactionState})`);
    }

    this.operationCount++;

    // Check if we should simulate a failure during execution
    if (this.shouldSimulateFailure('execute')) {
      const error = this.createSimulatedError();
      this.operations.push({
        type,
        entity,
        params,
        timestamp: new Date(),
        success: false,
        error
      });
      throw error;
    }

    // Record the successful operation
    this.operations.push({
      type,
      entity,
      params,
      timestamp: new Date(),
      success: true
    });

    // Return a mock result
    return {
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...params
    } as T;
  }

  /**
   * Gets the operations performed within this transaction
   */
  public getOperations(): MockTransactionRecord['operations'] {
    return [...this.operations];
  }

  /**
   * Gets the current state of the transaction
   */
  public getState(): MockTransactionState {
    return this.transactionState;
  }

  /**
   * Sets the state of the transaction
   * 
   * @param state - New state for the transaction
   */
  public setState(state: MockTransactionState): void {
    this.transactionState = state;
  }

  /**
   * Gets the ID of the transaction
   */
  public getTransactionId(): string {
    return this.transactionId;
  }

  /**
   * Checks if a failure should be simulated for the current operation
   * 
   * @param operation - The operation being performed
   * @returns True if a failure should be simulated, false otherwise
   */
  private shouldSimulateFailure(operation: 'begin' | 'execute' | 'commit' | 'rollback'): boolean {
    if (!this.failureConfig || !this.failureConfig.shouldFail) {
      return false;
    }

    // Check if we should fail during this specific operation
    if (this.failureConfig.failDuring && this.failureConfig.failDuring !== operation) {
      return false;
    }

    // Check if we should fail after a certain number of operations
    if (this.failureConfig.failAfterOperations !== undefined && 
        this.operationCount <= this.failureConfig.failAfterOperations) {
      return false;
    }

    // If we have an error delay, simulate it
    if (this.failureConfig.errorDelay) {
      setTimeout(() => {}, this.failureConfig.errorDelay);
    }

    return true;
  }

  /**
   * Creates a simulated error based on the failure configuration
   * 
   * @returns The simulated error
   */
  private createSimulatedError(): Error {
    if (!this.failureConfig || !this.failureConfig.errorType) {
      return new TransactionError('Simulated transaction error');
    }

    const message = this.failureConfig.errorMessage || 'Simulated transaction error';

    switch (this.failureConfig.errorType) {
      case 'timeout':
        return new TransactionTimeoutError(
          message,
          5000,
          'execute',
        );
      case 'deadlock':
        return new DeadlockError(
          message,
          'resource1',
          ['tx-123']
        );
      case 'serialization':
        return new SerializationError(
          message,
          ['tx-456']
        );
      case 'connection':
        return new ConnectionLostError(
          message,
          'execute'
        );
      case 'distributed':
        return new DistributedTransactionError(
          message,
          ['service1', 'service2'],
          'prepare'
        );
      default:
        return new TransactionError(message);
    }
  }
}

/**
 * Mock implementation of TransactionService for testing
 */
export class MockTransactionService implements TransactionManager, DistributedTransactionCoordinator {
  private readonly logger = new Logger(MockTransactionService.name);
  private readonly activeTransactions: Record<string, MockTransactionRecord> = {};
  private readonly transactionHistory: MockTransactionRecord[] = [];
  private failureConfig?: MockTransactionFailureConfig;
  private defaultIsolationLevel: TransactionIsolationLevel = TransactionIsolationLevel.READ_COMMITTED;
  private defaultTimeout: number = 30000;
  private enableSavepoints: boolean = true;
  private enableDistributedTransactions: boolean = true;

  /**
   * Creates a new MockTransactionService
   * 
   * @param failureConfig - Configuration for simulating transaction failures
   */
  constructor(failureConfig?: MockTransactionFailureConfig) {
    this.failureConfig = failureConfig;
  }

  /**
   * Configures the mock transaction service
   * 
   * @param config - Configuration options
   */
  configure(config: {
    failureConfig?: MockTransactionFailureConfig;
    defaultIsolationLevel?: TransactionIsolationLevel;
    defaultTimeout?: number;
    enableSavepoints?: boolean;
    enableDistributedTransactions?: boolean;
  }): void {
    if (config.failureConfig !== undefined) {
      this.failureConfig = config.failureConfig;
    }
    if (config.defaultIsolationLevel !== undefined) {
      this.defaultIsolationLevel = config.defaultIsolationLevel;
    }
    if (config.defaultTimeout !== undefined) {
      this.defaultTimeout = config.defaultTimeout;
    }
    if (config.enableSavepoints !== undefined) {
      this.enableSavepoints = config.enableSavepoints;
    }
    if (config.enableDistributedTransactions !== undefined) {
      this.enableDistributedTransactions = config.enableDistributedTransactions;
    }
  }

  /**
   * Executes a callback function within a transaction context
   * 
   * @param callback - The function to execute within the transaction
   * @param options - Options for configuring the transaction behavior
   * @returns A promise that resolves to the result of the callback
   */
  async executeTransaction<T>(
    callback: TransactionCallback<T>,
    options?: TransactionOptions
  ): Promise<T> {
    const result = await this.executeTransactionWithMetadata(callback, options);
    return result.result;
  }

  /**
   * Executes a callback function within a transaction context and returns detailed transaction metadata
   * 
   * @param callback - The function to execute within the transaction
   * @param options - Options for configuring the transaction behavior
   * @returns A promise that resolves to the result of the callback along with transaction metadata
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
            () => callback(client as unknown as TransactionClient),
            mergedOptions.timeout,
            transactionId
          );

          // Commit transaction
          await this.commitTransaction(client as unknown as TransactionClient);
          success = true;

          // Break out of retry loop on success
          break;
        } catch (error) {
          // Rollback transaction on error
          try {
            await this.rollbackTransaction(client as unknown as TransactionClient);
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

          await this.sleep(delay);
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
   * Creates a new transaction client that can be used for database operations
   * 
   * @param options - Options for configuring the transaction behavior
   * @returns A promise that resolves to a transaction client
   */
  async createTransaction(options?: TransactionOptions): Promise<MockTransactionClient> {
    const mergedOptions = this.mergeOptions(options);
    const transactionId = uuidv4();

    // Check if we should simulate a failure during transaction creation
    if (this.failureConfig?.shouldFail && this.failureConfig.failDuring === 'begin') {
      const error = this.createSimulatedError();
      this.logger.error(`Failed to create transaction ${transactionId}`, error);
      throw error;
    }

    // Create a new mock transaction client
    const client = new MockTransactionClient(transactionId, this.failureConfig);

    // Create a transaction record
    const transaction: MockTransactionRecord = {
      id: transactionId,
      state: MockTransactionState.ACTIVE,
      startedAt: new Date(),
      isolationLevel: mergedOptions.isolationLevel,
      readOnly: mergedOptions.readOnly ?? false,
      operations: [],
      savepoints: [],
      retryAttempts: 0,
      journeyContext: mergedOptions.journeyContext
    };

    // Store the transaction in the active transactions store
    this.activeTransactions[transactionId] = transaction;

    this.logger.debug(`Created transaction ${transactionId}`, {
      transactionId,
      isolationLevel: mergedOptions.isolationLevel,
      readOnly: mergedOptions.readOnly,
      timeout: mergedOptions.timeout
    });

    return client;
  }

  /**
   * Commits a transaction that was created with createTransaction
   * 
   * @param client - The transaction client to commit
   * @returns A promise that resolves when the transaction is committed
   */
  async commitTransaction(client: TransactionClient): Promise<void> {
    const mockClient = client as unknown as MockTransactionClient;
    const transactionId = mockClient.getTransactionId();
    const transaction = this.activeTransactions[transactionId];

    if (!transaction) {
      throw new TransactionError(`Cannot commit transaction ${transactionId}: transaction not found in active transactions`);
    }

    // Check if we should simulate a failure during commit
    if (this.failureConfig?.shouldFail && this.failureConfig.failDuring === 'commit') {
      const error = this.createSimulatedError();
      transaction.state = MockTransactionState.FAILED;
      transaction.error = error;
      transaction.completedAt = new Date();
      mockClient.setState(MockTransactionState.FAILED);

      // Move the transaction from active to history
      delete this.activeTransactions[transactionId];
      this.transactionHistory.push(transaction);

      this.logger.error(`Failed to commit transaction ${transactionId}`, error);
      throw error;
    }

    // Commit the transaction
    transaction.state = MockTransactionState.COMMITTED;
    transaction.completedAt = new Date();
    mockClient.setState(MockTransactionState.COMMITTED);

    // Move the transaction from active to history
    delete this.activeTransactions[transactionId];
    this.transactionHistory.push(transaction);

    this.logger.debug(`Committed transaction ${transactionId}`, {
      transactionId,
      duration: transaction.completedAt.getTime() - transaction.startedAt.getTime()
    });
  }

  /**
   * Rolls back a transaction that was created with createTransaction
   * 
   * @param client - The transaction client to roll back
   * @returns A promise that resolves when the transaction is rolled back
   */
  async rollbackTransaction(client: TransactionClient): Promise<void> {
    const mockClient = client as unknown as MockTransactionClient;
    const transactionId = mockClient.getTransactionId();
    const transaction = this.activeTransactions[transactionId];

    if (!transaction) {
      throw new TransactionError(`Cannot rollback transaction ${transactionId}: transaction not found in active transactions`);
    }

    // Check if we should simulate a failure during rollback
    if (this.failureConfig?.shouldFail && this.failureConfig.failDuring === 'rollback') {
      const error = this.createSimulatedError();
      transaction.state = MockTransactionState.FAILED;
      transaction.error = error;
      transaction.completedAt = new Date();
      mockClient.setState(MockTransactionState.FAILED);

      // Move the transaction from active to history
      delete this.activeTransactions[transactionId];
      this.transactionHistory.push(transaction);

      this.logger.error(`Failed to rollback transaction ${transactionId}`, error);
      throw error;
    }

    // Rollback the transaction
    transaction.state = MockTransactionState.ROLLED_BACK;
    transaction.completedAt = new Date();
    mockClient.setState(MockTransactionState.ROLLED_BACK);

    // Move the transaction from active to history
    delete this.activeTransactions[transactionId];
    this.transactionHistory.push(transaction);

    this.logger.debug(`Rolled back transaction ${transactionId}`, {
      transactionId,
      duration: transaction.completedAt.getTime() - transaction.startedAt.getTime()
    });
  }

  /**
   * Creates a savepoint within an existing transaction
   * 
   * @param client - The transaction client to create a savepoint for
   * @param name - Optional name for the savepoint (auto-generated if not provided)
   * @returns A promise that resolves to the savepoint name
   */
  async createSavepoint(client: TransactionClient, name?: string): Promise<string> {
    if (!this.enableSavepoints) {
      throw new TransactionError('Savepoints are disabled in the current configuration');
    }

    const mockClient = client as unknown as MockTransactionClient;
    const transactionId = mockClient.getTransactionId();
    const transaction = this.activeTransactions[transactionId];

    if (!transaction) {
      throw new TransactionError(`Cannot create savepoint: transaction ${transactionId} not found in active transactions`);
    }

    if (transaction.state !== MockTransactionState.ACTIVE) {
      throw new TransactionError(`Cannot create savepoint: transaction ${transactionId} is not active (state: ${transaction.state})`);
    }

    // Generate a savepoint name if not provided
    const savepointName = name || `sp_${uuidv4().replace(/-/g, '')}`;

    // Create a savepoint
    transaction.savepoints.push({
      name: savepointName,
      createdAt: new Date(),
      operations: transaction.operations.length
    });

    this.logger.debug(`Created savepoint ${savepointName} in transaction ${transactionId}`, {
      transactionId,
      savepointName
    });

    return savepointName;
  }

  /**
   * Rolls back to a previously created savepoint
   * 
   * @param client - The transaction client to roll back
   * @param name - The name of the savepoint to roll back to
   * @returns A promise that resolves when the rollback is complete
   */
  async rollbackToSavepoint(client: TransactionClient, name: string): Promise<void> {
    if (!this.enableSavepoints) {
      throw new TransactionError('Savepoints are disabled in the current configuration');
    }

    const mockClient = client as unknown as MockTransactionClient;
    const transactionId = mockClient.getTransactionId();
    const transaction = this.activeTransactions[transactionId];

    if (!transaction) {
      throw new TransactionError(`Cannot rollback to savepoint: transaction ${transactionId} not found in active transactions`);
    }

    if (transaction.state !== MockTransactionState.ACTIVE) {
      throw new TransactionError(`Cannot rollback to savepoint: transaction ${transactionId} is not active (state: ${transaction.state})`);
    }

    // Find the savepoint
    const savepoint = transaction.savepoints.find(sp => sp.name === name);
    if (!savepoint) {
      throw new TransactionError(`Cannot rollback to savepoint: savepoint ${name} not found in transaction ${transactionId}`);
    }

    // Rollback to the savepoint by truncating the operations array
    transaction.operations = transaction.operations.slice(0, savepoint.operations);

    this.logger.debug(`Rolled back to savepoint ${name} in transaction ${transactionId}`, {
      transactionId,
      savepointName: name
    });
  }

  /**
   * Releases a previously created savepoint
   * 
   * @param client - The transaction client to release the savepoint for
   * @param name - The name of the savepoint to release
   * @returns A promise that resolves when the savepoint is released
   */
  async releaseSavepoint(client: TransactionClient, name: string): Promise<void> {
    if (!this.enableSavepoints) {
      throw new TransactionError('Savepoints are disabled in the current configuration');
    }

    const mockClient = client as unknown as MockTransactionClient;
    const transactionId = mockClient.getTransactionId();
    const transaction = this.activeTransactions[transactionId];

    if (!transaction) {
      throw new TransactionError(`Cannot release savepoint: transaction ${transactionId} not found in active transactions`);
    }

    if (transaction.state !== MockTransactionState.ACTIVE) {
      throw new TransactionError(`Cannot release savepoint: transaction ${transactionId} is not active (state: ${transaction.state})`);
    }

    // Find the savepoint
    const savepointIndex = transaction.savepoints.findIndex(sp => sp.name === name);
    if (savepointIndex === -1) {
      throw new TransactionError(`Cannot release savepoint: savepoint ${name} not found in transaction ${transactionId}`);
    }

    // Remove the savepoint
    transaction.savepoints.splice(savepointIndex, 1);

    this.logger.debug(`Released savepoint ${name} in transaction ${transactionId}`, {
      transactionId,
      savepointName: name
    });
  }

  /**
   * Executes a callback function within a distributed transaction context
   * 
   * @param callback - The function to execute within the distributed transaction
   * @param options - Options for configuring the distributed transaction behavior
   * @returns A promise that resolves to the result of the callback
   */
  async executeDistributedTransaction<T>(
    callback: TransactionCallback<T>,
    options: DistributedTransactionOptions
  ): Promise<T> {
    if (!this.enableDistributedTransactions) {
      throw new TransactionError('Distributed transactions are disabled in the current configuration');
    }

    const transactionId = uuidv4();
    const startedAt = new Date();

    if (!options.participants || options.participants.length === 0) {
      throw new TransactionError('Distributed transaction requires at least one participant');
    }

    this.logger.debug(`Starting distributed transaction ${transactionId}`, {
      transactionId,
      participants: options.participants,
      isolationLevel: options.isolationLevel,
      timeout: options.timeout
    });

    // Create a transaction client for the local participant
    const client = await this.createTransaction(options);

    try {
      // Prepare phase: prepare all participants
      const prepareResults = await this.prepareAllParticipants(transactionId, options.participants, options.prepareTimeout);

      // Check if all participants are prepared
      const allPrepared = prepareResults.every(result => result.prepared);
      if (!allPrepared && options.prepareFailureStrategy === 'abort') {
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
        () => callback(client as unknown as TransactionClient),
        options.timeout,
        transactionId
      );

      // Commit phase: commit all prepared participants
      const commitResults = await this.commitAllParticipants(
        transactionId,
        prepareResults.filter(result => result.prepared).map(result => result.participantId),
        options.commitTimeout,
        options.commitFailureStrategy === 'retry' ? options.maxCommitRetries : 1
      );

      // Check if all participants are committed
      const allCommitted = commitResults.every(result => result.committed);
      if (!allCommitted && options.commitFailureStrategy === 'compensate') {
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
      await this.commitTransaction(client as unknown as TransactionClient);

      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();

      this.logger.debug(`Distributed transaction ${transactionId} completed successfully`, {
        transactionId,
        durationMs,
        participants: options.participants
      });

      return result;
    } catch (error) {
      // Rollback the local transaction
      try {
        await this.rollbackTransaction(client as unknown as TransactionClient);
      } catch (rollbackError) {
        this.logger.error(`Error rolling back local transaction ${transactionId}`, rollbackError);
      }

      // Abort all participants
      try {
        await this.abortAllParticipants(transactionId, options.participants);
      } catch (abortError) {
        this.logger.error(`Error aborting participants for distributed transaction ${transactionId}`, abortError);
      }

      const transformedError = this.transformError(error, transactionId, 'distributed_transaction');
      this.logger.error(`Distributed transaction ${transactionId} failed`, transformedError);
      throw transformedError;
    }
  }

  /**
   * Prepares a participant for a distributed transaction (first phase of two-phase commit)
   * 
   * @param transactionId - The ID of the distributed transaction
   * @param participantId - The ID of the participant
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

    // Simulate participant preparation (always succeeds unless failure is configured)
    if (this.failureConfig?.shouldFail && 
        this.failureConfig.errorType === 'distributed' && 
        this.failureConfig.failDuring === 'prepare') {
      this.logger.error(`Failed to prepare participant ${participantId} for distributed transaction ${transactionId}`, {
        transactionId,
        participantId,
        error: this.failureConfig.errorMessage || 'Simulated prepare failure'
      });
      return false;
    }

    return true;
  }

  /**
   * Commits a participant in a distributed transaction (second phase of two-phase commit)
   * 
   * @param transactionId - The ID of the distributed transaction
   * @param participantId - The ID of the participant
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

    // Simulate participant commit (fails if failure is configured)
    if (this.failureConfig?.shouldFail && 
        this.failureConfig.errorType === 'distributed' && 
        this.failureConfig.failDuring === 'commit') {
      const error = new DistributedTransactionError(
        this.failureConfig.errorMessage || `Failed to commit participant ${participantId}`,
        [participantId],
        'commit'
      );
      this.logger.error(`Failed to commit participant ${participantId} for distributed transaction ${transactionId}`, error);
      throw error;
    }
  }

  /**
   * Aborts a participant in a distributed transaction
   * 
   * @param transactionId - The ID of the distributed transaction
   * @param participantId - The ID of the participant
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

    // Simulate participant abort (always succeeds)
  }

  /**
   * Gets the status of a distributed transaction
   * 
   * @param transactionId - The ID of the distributed transaction
   * @returns A promise that resolves to the status of the distributed transaction
   */
  async getTransactionStatus(transactionId: string): Promise<'preparing' | 'prepared' | 'committing' | 'committed' | 'aborting' | 'aborted' | 'unknown'> {
    if (!this.enableDistributedTransactions) {
      throw new TransactionError('Distributed transactions are disabled in the current configuration');
    }

    // In a real implementation, this would retrieve the status from a transaction coordinator
    // For the mock, we'll return 'unknown' for any transaction ID
    return 'unknown';
  }

  /**
   * Gets all active transactions
   * 
   * @returns A copy of the active transactions record
   */
  getActiveTransactions(): Record<string, MockTransactionRecord> {
    return { ...this.activeTransactions };
  }

  /**
   * Gets the transaction history
   * 
   * @returns A copy of the transaction history array
   */
  getTransactionHistory(): MockTransactionRecord[] {
    return [...this.transactionHistory];
  }

  /**
   * Gets a specific transaction by ID
   * 
   * @param transactionId - The ID of the transaction to retrieve
   * @returns The transaction record, or undefined if not found
   */
  getTransaction(transactionId: string): MockTransactionRecord | undefined {
    return this.activeTransactions[transactionId] || 
           this.transactionHistory.find(tx => tx.id === transactionId);
  }

  /**
   * Clears all transaction history and active transactions
   */
  clearTransactions(): void {
    Object.keys(this.activeTransactions).forEach(key => {
      delete this.activeTransactions[key];
    });
    this.transactionHistory.length = 0;
  }

  /**
   * Prepares all participants for a distributed transaction
   * 
   * @param transactionId - The ID of the distributed transaction
   * @param participants - The IDs of the participants
   * @param timeout - Timeout in milliseconds for the prepare phase
   * @returns A promise that resolves to an array of prepare results
   */
  private async prepareAllParticipants(
    transactionId: string,
    participants: string[],
    timeout?: number
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
   * Commits all prepared participants in a distributed transaction
   * 
   * @param transactionId - The ID of the distributed transaction
   * @param participants - The IDs of the prepared participants
   * @param timeout - Timeout in milliseconds for the commit phase
   * @param maxRetries - Maximum number of retry attempts for commit failures
   * @returns A promise that resolves to an array of commit results
   */
  private async commitAllParticipants(
    transactionId: string,
    participants: string[],
    timeout?: number,
    maxRetries: number = 1
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
            await this.sleep(delay);
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
   * Aborts all participants in a distributed transaction
   * 
   * @param transactionId - The ID of the distributed transaction
   * @param participants - The IDs of the participants
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
   * Compensates for committed participants in a distributed transaction
   * 
   * @param transactionId - The ID of the distributed transaction
   * @param participants - The IDs of the committed participants
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
    // For the mock, we'll just log the compensation
    this.logger.warn(`Compensation required for distributed transaction ${transactionId}`, {
      transactionId,
      participants
    });
  }

  /**
   * Executes a function with a timeout
   * 
   * @param fn - The function to execute
   * @param timeoutMs - The timeout in milliseconds
   * @param operationId - An identifier for the operation (for logging)
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
   * Transforms a raw error into a typed transaction error
   * 
   * @param error - The raw error to transform
   * @param transactionId - The ID of the transaction where the error occurred
   * @param operation - The operation that was being performed when the error occurred
   * @returns A typed transaction error
   */
  private transformError(error: any, transactionId: string, operation: string): Error {
    // If the error is already a TransactionError, return it as is
    if (error instanceof TransactionError) {
      return error;
    }

    // Default to generic TransactionError
    return new TransactionError(
      `Transaction ${transactionId} failed during ${operation}: ${error.message}`,
      error
    );
  }

  /**
   * Merges transaction options with default options
   * 
   * @param options - The options to merge
   * @returns The merged options
   */
  private mergeOptions(options?: TransactionOptions): TransactionOptions {
    return {
      isolationLevel: this.defaultIsolationLevel,
      timeout: this.defaultTimeout,
      readOnly: false,
      deferUntilFirstOperation: false,
      retry: {
        maxRetries: 3,
        initialDelay: 100,
        backoffFactor: 2,
        maxDelay: 5000
      },
      ...options,
      retry: {
        maxRetries: 3,
        initialDelay: 100,
        backoffFactor: 2,
        maxDelay: 5000,
        ...options?.retry
      }
    };
  }

  /**
   * Determines if a transaction should be retried based on the error and retry configuration
   * 
   * @param error - The error that occurred
   * @param attempt - The current retry attempt (0-based)
   * @param retryStrategy - The retry strategy configuration
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

    // Default to retrying for certain error types
    return (
      error instanceof TransactionTimeoutError ||
      error instanceof DeadlockError ||
      error instanceof SerializationError
    );
  }

  /**
   * Calculates the delay before the next retry attempt
   * 
   * @param attempt - The current retry attempt (1-based)
   * @param retryStrategy - The retry strategy configuration
   * @returns The delay in milliseconds
   */
  private calculateRetryDelay(attempt: number, retryStrategy?: TransactionRetryStrategy): number {
    if (!retryStrategy) {
      return 100 * Math.pow(2, attempt - 1);
    }

    // Use the calculateDelay callback if provided
    if (retryStrategy.calculateDelay) {
      return retryStrategy.calculateDelay(attempt - 1, new Error('Retry calculation'));
    }

    const initialDelay = retryStrategy.initialDelay ?? 100;
    const backoffFactor = retryStrategy.backoffFactor ?? 2;
    const maxDelay = retryStrategy.maxDelay ?? 5000;

    // Calculate exponential backoff with jitter
    const exponentialDelay = initialDelay * Math.pow(backoffFactor, attempt - 1);
    const jitter = 0.75 + Math.random() * 0.25; // Random value between 0.75 and 1
    return Math.min(maxDelay, Math.floor(exponentialDelay * jitter));
  }

  /**
   * Creates a simulated error based on the failure configuration
   * 
   * @returns The simulated error
   */
  private createSimulatedError(): Error {
    if (!this.failureConfig || !this.failureConfig.errorType) {
      return new TransactionError('Simulated transaction error');
    }

    const message = this.failureConfig.errorMessage || 'Simulated transaction error';

    switch (this.failureConfig.errorType) {
      case 'timeout':
        return new TransactionTimeoutError(
          message,
          5000,
          'execute',
        );
      case 'deadlock':
        return new DeadlockError(
          message,
          'resource1',
          ['tx-123']
        );
      case 'serialization':
        return new SerializationError(
          message,
          ['tx-456']
        );
      case 'connection':
        return new ConnectionLostError(
          message,
          'execute'
        );
      case 'distributed':
        return new DistributedTransactionError(
          message,
          ['service1', 'service2'],
          'prepare'
        );
      default:
        return new TransactionError(message);
    }
  }

  /**
   * Sleep utility function
   * 
   * @param ms - Milliseconds to sleep
   * @returns A promise that resolves after the specified time
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Mock implementation of the @Transactional decorator for testing
 */
export function MockTransactional(options: any = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const methodName = propertyKey;
    const className = target.constructor.name;

    descriptor.value = async function (...args: any[]) {
      // Get the MockTransactionService instance from the service instance (this)
      const transactionService = this.transactionService as MockTransactionService;
      if (!transactionService) {
        throw new Error(
          `@MockTransactional decorator requires the class to have a 'transactionService' property of type MockTransactionService. ` +
          `Please inject MockTransactionService in the constructor and assign it to 'this.transactionService'.`
        );
      }

      // Execute the method within a transaction
      return transactionService.executeTransaction(
        async (tx) => {
          // Replace the transactionService with the transaction client for the duration of the method
          const originalClient = this.client;
          this.client = tx;
          
          try {
            // Execute the original method with the transaction client
            return await originalMethod.apply(this, args);
          } finally {
            // Restore the original client
            this.client = originalClient;
          }
        },
        options
      );
    };

    return descriptor;
  };
}

/**
 * Mock implementation of the @ReadOnly decorator for testing
 */
export function MockReadOnly(options: any = {}) {
  return MockTransactional({
    ...options,
    isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
    readOnly: true
  });
}

/**
 * Mock implementation of the @Serializable decorator for testing
 */
export function MockSerializable(options: any = {}) {
  return MockTransactional({
    ...options,
    isolationLevel: TransactionIsolationLevel.SERIALIZABLE
  });
}

/**
 * Utility functions for transaction testing
 */
export const MockTransactionTestUtils = {
  /**
   * Creates a mock transaction service with the specified configuration
   * 
   * @param failureConfig - Configuration for simulating transaction failures
   * @returns A new MockTransactionService instance
   */
  createMockTransactionService(failureConfig?: MockTransactionFailureConfig): MockTransactionService {
    return new MockTransactionService(failureConfig);
  },

  /**
   * Creates a mock transaction client with the specified configuration
   * 
   * @param transactionId - Unique identifier for the transaction
   * @param failureConfig - Configuration for simulating transaction failures
   * @returns A new MockTransactionClient instance
   */
  createMockTransactionClient(transactionId: string = uuidv4(), failureConfig?: MockTransactionFailureConfig): MockTransactionClient {
    return new MockTransactionClient(transactionId, failureConfig);
  },

  /**
   * Asserts that a transaction is in the expected state
   * 
   * @param service - The MockTransactionService instance
   * @param transactionId - The ID of the transaction to check
   * @param expectedState - The expected state of the transaction
   * @throws Error if the transaction is not in the expected state
   */
  assertTransactionState(service: MockTransactionService, transactionId: string, expectedState: MockTransactionState): void {
    const transaction = service.getTransaction(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }
    if (transaction.state !== expectedState) {
      throw new Error(`Transaction ${transactionId} is in state ${transaction.state}, expected ${expectedState}`);
    }
  },

  /**
   * Asserts that a transaction has the expected number of operations
   * 
   * @param service - The MockTransactionService instance
   * @param transactionId - The ID of the transaction to check
   * @param expectedCount - The expected number of operations
   * @throws Error if the transaction does not have the expected number of operations
   */
  assertOperationCount(service: MockTransactionService, transactionId: string, expectedCount: number): void {
    const transaction = service.getTransaction(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }
    if (transaction.operations.length !== expectedCount) {
      throw new Error(`Transaction ${transactionId} has ${transaction.operations.length} operations, expected ${expectedCount}`);
    }
  },

  /**
   * Asserts that a transaction has an operation of the expected type
   * 
   * @param service - The MockTransactionService instance
   * @param transactionId - The ID of the transaction to check
   * @param operationType - The expected operation type
   * @param entity - The expected entity type (optional)
   * @throws Error if the transaction does not have an operation of the expected type
   */
  assertHasOperation(service: MockTransactionService, transactionId: string, operationType: string, entity?: string): void {
    const transaction = service.getTransaction(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }
    const hasOperation = transaction.operations.some(op => {
      if (op.type !== operationType) {
        return false;
      }
      if (entity && op.entity !== entity) {
        return false;
      }
      return true;
    });
    if (!hasOperation) {
      throw new Error(`Transaction ${transactionId} does not have an operation of type ${operationType}${entity ? ` on entity ${entity}` : ''}`);
    }
  },

  /**
   * Asserts that a transaction has completed successfully
   * 
   * @param service - The MockTransactionService instance
   * @param transactionId - The ID of the transaction to check
   * @throws Error if the transaction has not completed successfully
   */
  assertTransactionSucceeded(service: MockTransactionService, transactionId: string): void {
    const transaction = service.getTransaction(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }
    if (transaction.state !== MockTransactionState.COMMITTED) {
      throw new Error(`Transaction ${transactionId} has not completed successfully (state: ${transaction.state})`);
    }
  },

  /**
   * Asserts that a transaction has failed
   * 
   * @param service - The MockTransactionService instance
   * @param transactionId - The ID of the transaction to check
   * @param errorType - The expected error type (optional)
   * @throws Error if the transaction has not failed or has failed with an unexpected error type
   */
  assertTransactionFailed(service: MockTransactionService, transactionId: string, errorType?: string): void {
    const transaction = service.getTransaction(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }
    if (transaction.state !== MockTransactionState.FAILED && transaction.state !== MockTransactionState.ROLLED_BACK) {
      throw new Error(`Transaction ${transactionId} has not failed (state: ${transaction.state})`);
    }
    if (errorType && transaction.error && transaction.error.constructor.name !== errorType) {
      throw new Error(`Transaction ${transactionId} failed with error type ${transaction.error.constructor.name}, expected ${errorType}`);
    }
  }
};
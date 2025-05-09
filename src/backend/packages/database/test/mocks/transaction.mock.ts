/**
 * @file transaction.mock.ts
 * @description Provides mock implementations of transaction management components for testing purposes.
 * Includes mock versions of TransactionService, transaction decorators, and utility functions.
 * Enables testing of transaction-dependent code without requiring actual database transactions.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';

import {
  Transaction,
  TransactionCallback,
  TransactionIsolationLevel,
  TransactionManager,
  TransactionMetadata,
  TransactionOptions,
  TransactionState,
  TransactionType,
  DEFAULT_TRANSACTION_OPTIONS
} from '../../src/types/transaction.types';

import {
  TransactionError,
  TransactionTimeoutError,
  DeadlockError,
  DistributedTransactionError,
  SavepointError,
  TransactionAbortedError
} from '../../src/transactions/transaction.errors';

import { JourneyContext, DatabaseOperationContext } from '../../src/errors/database-error.types';

// ========================================================================
// Mock Transaction Interfaces and Types
// ========================================================================

/**
 * Configuration options for the mock transaction behavior
 */
export interface MockTransactionOptions {
  /**
   * Whether transactions should automatically succeed
   * @default true
   */
  autoSucceed?: boolean;

  /**
   * Whether to simulate transaction timeouts
   * @default false
   */
  simulateTimeout?: boolean;

  /**
   * Whether to simulate deadlocks
   * @default false
   */
  simulateDeadlock?: boolean;

  /**
   * Whether to simulate serialization failures
   * @default false
   */
  simulateSerializationFailure?: boolean;

  /**
   * Whether to simulate connection failures
   * @default false
   */
  simulateConnectionFailure?: boolean;

  /**
   * Whether to track transaction operations for testing
   * @default true
   */
  trackOperations?: boolean;

  /**
   * Custom error to throw during transaction execution
   */
  customError?: Error;

  /**
   * Delay in milliseconds to simulate transaction processing time
   * @default 0
   */
  delayMs?: number;

  /**
   * Callback to execute before transaction commit
   */
  beforeCommit?: () => void | Promise<void>;

  /**
   * Callback to execute after transaction commit
   */
  afterCommit?: () => void | Promise<void>;

  /**
   * Callback to execute before transaction rollback
   */
  beforeRollback?: () => void | Promise<void>;

  /**
   * Callback to execute after transaction rollback
   */
  afterRollback?: () => void | Promise<void>;

  /**
   * Number of retries to simulate before success
   * @default 0
   */
  retriesBeforeSuccess?: number;
}

/**
 * Default mock transaction options
 */
const DEFAULT_MOCK_TRANSACTION_OPTIONS: Required<MockTransactionOptions> = {
  autoSucceed: true,
  simulateTimeout: false,
  simulateDeadlock: false,
  simulateSerializationFailure: false,
  simulateConnectionFailure: false,
  trackOperations: true,
  customError: undefined,
  delayMs: 0,
  beforeCommit: undefined,
  afterCommit: undefined,
  beforeRollback: undefined,
  afterRollback: undefined,
  retriesBeforeSuccess: 0
};

/**
 * Represents a tracked operation within a mock transaction
 */
export interface TrackedOperation {
  /**
   * Type of operation
   */
  type: 'query' | 'execute' | 'commit' | 'rollback' | 'savepoint' | 'rollbackToSavepoint';

  /**
   * Timestamp when the operation was executed
   */
  timestamp: Date;

  /**
   * SQL query or operation details
   */
  details?: string;

  /**
   * Parameters for the operation
   */
  params?: any[];
}

/**
 * Global registry for tracking mock transactions across tests
 */
export class MockTransactionRegistry {
  private static transactions = new Map<string, MockTransactionImpl<any>>();
  private static operations: TrackedOperation[] = [];
  private static mockOptions: Required<MockTransactionOptions> = { ...DEFAULT_MOCK_TRANSACTION_OPTIONS };

  /**
   * Registers a transaction in the registry
   */
  static registerTransaction(transaction: MockTransactionImpl<any>): void {
    this.transactions.set(transaction.id, transaction);
  }

  /**
   * Removes a transaction from the registry
   */
  static removeTransaction(transactionId: string): void {
    this.transactions.delete(transactionId);
  }

  /**
   * Gets a transaction by ID
   */
  static getTransaction(transactionId: string): MockTransactionImpl<any> | undefined {
    return this.transactions.get(transactionId);
  }

  /**
   * Gets all registered transactions
   */
  static getAllTransactions(): MockTransactionImpl<any>[] {
    return Array.from(this.transactions.values());
  }

  /**
   * Tracks an operation
   */
  static trackOperation(operation: TrackedOperation): void {
    this.operations.push(operation);
  }

  /**
   * Gets all tracked operations
   */
  static getOperations(): TrackedOperation[] {
    return [...this.operations];
  }

  /**
   * Gets operations for a specific transaction
   */
  static getTransactionOperations(transactionId: string): TrackedOperation[] {
    const transaction = this.getTransaction(transactionId);
    return transaction ? transaction.getOperations() : [];
  }

  /**
   * Sets global mock options for all new transactions
   */
  static setMockOptions(options: MockTransactionOptions): void {
    this.mockOptions = { ...DEFAULT_MOCK_TRANSACTION_OPTIONS, ...options };
  }

  /**
   * Gets the current global mock options
   */
  static getMockOptions(): Required<MockTransactionOptions> {
    return { ...this.mockOptions };
  }

  /**
   * Resets the registry, clearing all transactions and operations
   */
  static reset(): void {
    this.transactions.clear();
    this.operations = [];
    this.mockOptions = { ...DEFAULT_MOCK_TRANSACTION_OPTIONS };
  }
}

// ========================================================================
// Mock Transaction Client Implementation
// ========================================================================

/**
 * Mock implementation of a Prisma transaction client for testing
 */
export class MockPrismaClient implements Partial<PrismaClient> {
  private transactionId: string;
  private operations: TrackedOperation[] = [];
  private mockOptions: Required<MockTransactionOptions>;

  constructor(transactionId: string, mockOptions: Required<MockTransactionOptions>) {
    this.transactionId = transactionId;
    this.mockOptions = mockOptions;
  }

  /**
   * Tracks an operation
   */
  private trackOperation(operation: TrackedOperation): void {
    if (this.mockOptions.trackOperations) {
      this.operations.push(operation);
      MockTransactionRegistry.trackOperation({
        ...operation,
        details: `${this.transactionId}: ${operation.details}`
      });
    }
  }

  /**
   * Simulates a delay if configured
   */
  private async simulateDelay(): Promise<void> {
    if (this.mockOptions.delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.mockOptions.delayMs));
    }
  }

  /**
   * Simulates errors if configured
   */
  private simulateErrors(): void {
    if (this.mockOptions.customError) {
      throw this.mockOptions.customError;
    }

    if (this.mockOptions.simulateTimeout) {
      throw new TransactionTimeoutError(
        'Mock transaction timeout',
        30000,
        30000,
        { journey: 'test', feature: 'database' },
        { operation: 'test', transactionId: this.transactionId }
      );
    }

    if (this.mockOptions.simulateDeadlock) {
      throw new DeadlockError(
        'Mock deadlock detected',
        'resource1',
        'tx2',
        { journey: 'test', feature: 'database' },
        { operation: 'test', transactionId: this.transactionId }
      );
    }

    if (this.mockOptions.simulateSerializationFailure) {
      throw new TransactionError(
        'Mock serialization failure',
        'DB_TRANS_PG_SERIALIZATION',
        undefined,
        undefined,
        { journey: 'test', feature: 'database' },
        { operation: 'test', transactionId: this.transactionId }
      );
    }

    if (this.mockOptions.simulateConnectionFailure) {
      throw new TransactionError(
        'Mock connection failure',
        'DB_TRANS_PG_CONNECTION',
        undefined,
        undefined,
        { journey: 'test', feature: 'database' },
        { operation: 'test', transactionId: this.transactionId }
      );
    }
  }

  /**
   * Executes a raw SQL query
   */
  async $executeRaw(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Promise<number> {
    await this.simulateDelay();
    
    this.trackOperation({
      type: 'query',
      timestamp: new Date(),
      details: typeof query === 'string' ? query : query.toString(),
      params: values
    });

    this.simulateErrors();
    
    return 1; // Mock affected rows
  }

  /**
   * Executes a raw SQL query with named parameters
   */
  async $executeRawUnsafe(query: string, values?: Record<string, any>): Promise<number> {
    await this.simulateDelay();
    
    this.trackOperation({
      type: 'query',
      timestamp: new Date(),
      details: query,
      params: values ? [values] : undefined
    });

    this.simulateErrors();
    
    return 1; // Mock affected rows
  }

  /**
   * Commits the transaction
   */
  async $commit(): Promise<void> {
    await this.simulateDelay();
    
    this.trackOperation({
      type: 'commit',
      timestamp: new Date()
    });

    this.simulateErrors();
  }

  /**
   * Rolls back the transaction
   */
  async $rollback(): Promise<void> {
    await this.simulateDelay();
    
    this.trackOperation({
      type: 'rollback',
      timestamp: new Date()
    });

    // Don't simulate errors during rollback to avoid complicating tests
  }

  /**
   * Gets all tracked operations
   */
  getOperations(): TrackedOperation[] {
    return [...this.operations];
  }
}

/**
 * Mock implementation of a transaction for testing
 */
export class MockTransactionImpl<T> implements Transaction<T> {
  public readonly id: string;
  public readonly metadata: TransactionMetadata;
  public readonly options: Required<TransactionOptions>;
  private mockOptions: Required<MockTransactionOptions>;
  private client: MockPrismaClient | null = null;
  private operations: TrackedOperation[] = [];
  private savepoints: Map<string, string> = new Map();
  private retryCount = 0;
  private readonly logger = new Logger(MockTransactionImpl.name);

  constructor(
    id: string,
    options?: Partial<TransactionOptions>,
    mockOptions?: MockTransactionOptions
  ) {
    this.id = id;
    
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

    // Merge mock options with registry defaults and provided options
    this.mockOptions = {
      ...MockTransactionRegistry.getMockOptions(),
      ...mockOptions
    };

    // Initialize metadata
    this.metadata = {
      id: this.id,
      createdAt: new Date(),
      state: TransactionState.CREATED,
      type: this.options.type || TransactionType.STANDARD,
      isolationLevel: this.options.isolationLevel || TransactionIsolationLevel.READ_COMMITTED,
      journeyContext: this.options.journeyContext || 'default',
      retryCount: 0,
    };

    // Register this transaction in the registry
    MockTransactionRegistry.registerTransaction(this);
  }

  /**
   * Gets the current state of the transaction
   */
  get state(): TransactionState {
    return this.metadata.state;
  }

  /**
   * Tracks an operation
   */
  private trackOperation(operation: TrackedOperation): void {
    if (this.mockOptions.trackOperations) {
      this.operations.push(operation);
      MockTransactionRegistry.trackOperation(operation);
    }
  }

  /**
   * Simulates a delay if configured
   */
  private async simulateDelay(): Promise<void> {
    if (this.mockOptions.delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.mockOptions.delayMs));
    }
  }

  /**
   * Simulates errors if configured
   */
  private simulateErrors(): void {
    // Skip error simulation if we've reached the retry success threshold
    if (this.mockOptions.retriesBeforeSuccess > 0 && 
        this.retryCount >= this.mockOptions.retriesBeforeSuccess) {
      return;
    }

    if (this.mockOptions.customError) {
      throw this.mockOptions.customError;
    }

    if (this.mockOptions.simulateTimeout) {
      throw new TransactionTimeoutError(
        'Mock transaction timeout',
        30000,
        30000,
        { journey: 'test', feature: 'database' },
        { operation: 'test', transactionId: this.id }
      );
    }

    if (this.mockOptions.simulateDeadlock) {
      throw new DeadlockError(
        'Mock deadlock detected',
        'resource1',
        'tx2',
        { journey: 'test', feature: 'database' },
        { operation: 'test', transactionId: this.id }
      );
    }

    if (this.mockOptions.simulateSerializationFailure) {
      throw new TransactionError(
        'Mock serialization failure',
        'DB_TRANS_PG_SERIALIZATION',
        undefined,
        undefined,
        { journey: 'test', feature: 'database' },
        { operation: 'test', transactionId: this.id }
      );
    }

    if (this.mockOptions.simulateConnectionFailure) {
      throw new TransactionError(
        'Mock connection failure',
        'DB_TRANS_PG_CONNECTION',
        undefined,
        undefined,
        { journey: 'test', feature: 'database' },
        { operation: 'test', transactionId: this.id }
      );
    }
  }

  /**
   * Starts the transaction
   */
  async start(): Promise<void> {
    // Check if transaction is already started
    if (this.metadata.state !== TransactionState.CREATED) {
      throw new TransactionError(
        `Cannot start transaction ${this.id} in state ${this.metadata.state}`,
        'DB_TRANS_INVALID_STATE',
        undefined,
        undefined,
        { journey: this.metadata.journeyContext, feature: 'database' },
        { operation: 'start', transactionId: this.id }
      );
    }

    await this.simulateDelay();
    this.trackOperation({ type: 'execute', timestamp: new Date(), details: 'start' });

    try {
      // Simulate errors if configured
      this.simulateErrors();

      // Create mock client
      this.client = new MockPrismaClient(this.id, this.mockOptions);

      // Update metadata
      this.metadata.state = TransactionState.ACTIVE;
      this.metadata.startedAt = new Date();
    } catch (error) {
      // Update metadata on error
      this.metadata.state = TransactionState.FAILED;
      this.metadata.error = error instanceof Error ? error : new Error(String(error));

      // Throw the error
      throw error;
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
        'DB_TRANS_INVALID_STATE',
        undefined,
        undefined,
        { journey: this.metadata.journeyContext, feature: 'database' },
        { operation: 'commit', transactionId: this.id }
      );
    }

    await this.simulateDelay();
    this.trackOperation({ type: 'commit', timestamp: new Date() });

    try {
      // Execute beforeCommit hook if provided
      if (this.mockOptions.beforeCommit) {
        await this.mockOptions.beforeCommit();
      }

      // Simulate errors if configured
      this.simulateErrors();

      // Commit the transaction
      if (this.client) {
        await this.client.$commit();
      }

      // Update metadata
      this.metadata.state = TransactionState.COMMITTED;
      this.metadata.completedAt = new Date();

      // Execute afterCommit hook if provided
      if (this.mockOptions.afterCommit) {
        await this.mockOptions.afterCommit();
      }
    } catch (error) {
      // Update metadata on error
      this.metadata.state = TransactionState.FAILED;
      this.metadata.error = error instanceof Error ? error : new Error(String(error));

      // Throw the error
      throw error;
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
        'DB_TRANS_INVALID_STATE',
        undefined,
        undefined,
        { journey: this.metadata.journeyContext, feature: 'database' },
        { operation: 'rollback', transactionId: this.id }
      );
    }

    await this.simulateDelay();
    this.trackOperation({ type: 'rollback', timestamp: new Date() });

    try {
      // Execute beforeRollback hook if provided
      if (this.mockOptions.beforeRollback) {
        await this.mockOptions.beforeRollback();
      }

      // Rollback the transaction
      if (this.client) {
        await this.client.$rollback();
      }

      // Update metadata
      this.metadata.state = TransactionState.ROLLED_BACK;
      this.metadata.completedAt = new Date();

      // Execute afterRollback hook if provided
      if (this.mockOptions.afterRollback) {
        await this.mockOptions.afterRollback();
      }
    } catch (error) {
      // Update metadata on error
      this.metadata.state = TransactionState.FAILED;
      this.metadata.error = error instanceof Error ? error : new Error(String(error));

      // Throw the error
      throw error;
    } finally {
      // Clean up resources
      this.client = null;
    }
  }

  /**
   * Executes a callback function within the transaction
   */
  async execute(callback: TransactionCallback<T>): Promise<T> {
    // Check if transaction is active
    if (this.metadata.state !== TransactionState.ACTIVE) {
      throw new TransactionError(
        `Cannot execute in transaction ${this.id} in state ${this.metadata.state}`,
        'DB_TRANS_INVALID_STATE',
        undefined,
        undefined,
        { journey: this.metadata.journeyContext, feature: 'database' },
        { operation: 'execute', transactionId: this.id }
      );
    }

    await this.simulateDelay();
    this.trackOperation({ type: 'execute', timestamp: new Date(), details: 'callback' });

    try {
      // Simulate errors if configured
      this.simulateErrors();

      // Execute the callback with the transaction client
      if (!this.client) {
        throw new TransactionError(
          `Transaction client is not available for transaction ${this.id}`,
          'DB_TRANS_CLIENT_UNAVAILABLE',
          undefined,
          undefined,
          { journey: this.metadata.journeyContext, feature: 'database' },
          { operation: 'execute', transactionId: this.id }
        );
      }

      // Increment retry count for testing retry logic
      this.retryCount++;
      this.metadata.retryCount = this.retryCount;

      return await callback(this.client as unknown as PrismaClient);
    } catch (error) {
      // Throw the error
      throw error;
    }
  }

  /**
   * Creates a savepoint within the transaction
   */
  async createSavepoint(name?: string): Promise<string> {
    // Check if transaction is active
    if (this.metadata.state !== TransactionState.ACTIVE) {
      throw new TransactionError(
        `Cannot create savepoint in transaction ${this.id} in state ${this.metadata.state}`,
        'DB_TRANS_INVALID_STATE',
        undefined,
        undefined,
        { journey: this.metadata.journeyContext, feature: 'database' },
        { operation: 'createSavepoint', transactionId: this.id }
      );
    }

    // Check if savepoints are enabled
    if (!this.options.savepoint.useSavepoints) {
      throw new SavepointError(
        `Savepoints are disabled for transaction ${this.id}`,
        'DB_TRANS_SAVEPOINT_DISABLED',
        undefined,
        undefined,
        { journey: this.metadata.journeyContext, feature: 'database' },
        { operation: 'createSavepoint', transactionId: this.id }
      );
    }

    await this.simulateDelay();

    try {
      // Generate savepoint name if not provided
      const savepointName = name || `${this.options.savepoint.savepointPrefix}_${Date.now()}`;
      
      this.trackOperation({
        type: 'savepoint',
        timestamp: new Date(),
        details: `create ${savepointName}`
      });

      // Simulate errors if configured
      this.simulateErrors();

      // Create savepoint using raw SQL
      if (this.client) {
        await this.client.$executeRawUnsafe(`SAVEPOINT ${savepointName}`);
      }

      // Store savepoint name
      this.savepoints.set(savepointName, savepointName);

      return savepointName;
    } catch (error) {
      // Throw the error
      throw error;
    }
  }

  /**
   * Rolls back to a previously created savepoint
   */
  async rollbackToSavepoint(name: string): Promise<void> {
    // Check if transaction is active
    if (this.metadata.state !== TransactionState.ACTIVE) {
      throw new TransactionError(
        `Cannot rollback to savepoint in transaction ${this.id} in state ${this.metadata.state}`,
        'DB_TRANS_INVALID_STATE',
        undefined,
        undefined,
        { journey: this.metadata.journeyContext, feature: 'database' },
        { operation: 'rollbackToSavepoint', transactionId: this.id }
      );
    }

    // Check if savepoint exists
    if (!this.savepoints.has(name)) {
      throw new SavepointError(
        `Savepoint ${name} does not exist in transaction ${this.id}`,
        'DB_TRANS_SAVEPOINT_NOT_FOUND',
        undefined,
        undefined,
        { journey: this.metadata.journeyContext, feature: 'database' },
        { operation: 'rollbackToSavepoint', transactionId: this.id }
      );
    }

    await this.simulateDelay();

    try {
      this.trackOperation({
        type: 'rollbackToSavepoint',
        timestamp: new Date(),
        details: `rollback to ${name}`
      });

      // Simulate errors if configured
      this.simulateErrors();

      // Rollback to savepoint using raw SQL
      if (this.client) {
        await this.client.$executeRawUnsafe(`ROLLBACK TO SAVEPOINT ${name}`);
      }
    } catch (error) {
      // Throw the error
      throw error;
    }
  }

  /**
   * Creates a nested transaction within this transaction
   */
  async createNestedTransaction<U>(options?: Partial<TransactionOptions>): Promise<Transaction<U>> {
    // Check if transaction is active
    if (this.metadata.state !== TransactionState.ACTIVE) {
      throw new TransactionError(
        `Cannot create nested transaction in transaction ${this.id} in state ${this.metadata.state}`,
        'DB_TRANS_INVALID_STATE',
        undefined,
        undefined,
        { journey: this.metadata.journeyContext, feature: 'database' },
        { operation: 'createNestedTransaction', transactionId: this.id }
      );
    }

    await this.simulateDelay();

    // Create nested transaction options
    const nestedOptions: Partial<TransactionOptions> = {
      ...options,
      type: TransactionType.NESTED,
      parent: this,
      journeyContext: options?.journeyContext || this.options.journeyContext,
    };

    // Create nested transaction
    const nestedId = `${this.id}_nested_${Date.now()}`;
    const nestedTransaction = new MockTransactionImpl<U>(
      nestedId,
      nestedOptions,
      this.mockOptions
    );

    this.trackOperation({
      type: 'execute',
      timestamp: new Date(),
      details: `create nested transaction ${nestedId}`
    });

    // If savepoints are enabled, create a savepoint for the nested transaction
    if (this.options.savepoint.useSavepoints) {
      const savepointName = await this.createSavepoint(`NESTED_${nestedTransaction.id}`);
      
      // Store the savepoint name in the nested transaction metadata
      (nestedTransaction as any).savepointName = savepointName;
    }

    return nestedTransaction;
  }

  /**
   * Gets all tracked operations
   */
  getOperations(): TrackedOperation[] {
    const clientOperations = this.client ? this.client.getOperations() : [];
    return [...this.operations, ...clientOperations];
  }

  /**
   * Sets mock options for this transaction
   */
  setMockOptions(options: MockTransactionOptions): void {
    this.mockOptions = { ...this.mockOptions, ...options };
  }

  /**
   * Gets the current mock options
   */
  getMockOptions(): Required<MockTransactionOptions> {
    return { ...this.mockOptions };
  }
}

// ========================================================================
// Mock Transaction Service Implementation
// ========================================================================

/**
 * Mock implementation of the TransactionService for testing
 */
export class MockTransactionService implements TransactionManager {
  private readonly activeTransactions = new Map<string, Transaction<any>>();
  private readonly journeyTransactions = new Map<string, Set<string>>();
  private mockOptions: Required<MockTransactionOptions>;
  private readonly logger = new Logger(MockTransactionService.name);

  constructor(mockOptions?: MockTransactionOptions) {
    this.mockOptions = { ...DEFAULT_MOCK_TRANSACTION_OPTIONS, ...mockOptions };
  }

  /**
   * Creates a new transaction with the specified options
   */
  async createTransaction<T>(options?: Partial<TransactionOptions>): Promise<Transaction<T>> {
    const transactionId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    const transaction = new MockTransactionImpl<T>(transactionId, options, this.mockOptions);

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
            `Failed to rollback transaction ${transaction.id} after error: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`,
            rollbackError instanceof Error ? rollbackError.stack : undefined
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
   */
  async createDistributedTransaction<T>(
    transactionId: string,
    options?: Partial<TransactionOptions>
  ): Promise<Transaction<T>> {
    const distributedOptions: Partial<TransactionOptions> = {
      ...options,
      type: TransactionType.DISTRIBUTED,
      distributed: {
        ...options?.distributed,
        isDistributed: true,
        transactionId
      }
    };

    const transaction = new MockTransactionImpl<T>(transactionId, distributedOptions, this.mockOptions);

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
   */
  async getTransaction(transactionId: string): Promise<Transaction<any> | null> {
    return this.activeTransactions.get(transactionId) || null;
  }

  /**
   * Gets all active transactions
   */
  async getActiveTransactions(): Promise<Transaction<any>[]> {
    return Array.from(this.activeTransactions.values()).filter(
      transaction => transaction.state === TransactionState.ACTIVE
    );
  }

  /**
   * Gets all active transactions for a specific journey context
   */
  async getJourneyTransactions(journeyContext: string): Promise<Transaction<any>[]> {
    const transactionIds = this.journeyTransactions.get(journeyContext) || new Set();
    return Array.from(transactionIds)
      .map(id => this.activeTransactions.get(id))
      .filter(transaction => transaction && transaction.state === TransactionState.ACTIVE) as Transaction<any>[];
  }

  /**
   * Removes a transaction from active transactions
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
   * Checks if an error is retryable
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

  /**
   * Sets mock options for this service
   */
  setMockOptions(options: MockTransactionOptions): void {
    this.mockOptions = { ...this.mockOptions, ...options };
  }

  /**
   * Gets the current mock options
   */
  getMockOptions(): Required<MockTransactionOptions> {
    return { ...this.mockOptions };
  }

  /**
   * Resets the service, clearing all transactions
   */
  reset(): void {
    this.activeTransactions.clear();
    this.journeyTransactions.clear();
    this.mockOptions = { ...DEFAULT_MOCK_TRANSACTION_OPTIONS };
  }
}

// ========================================================================
// Mock Transaction Decorators
// ========================================================================

/**
 * Options for the mock @Transactional decorator
 */
export interface MockTransactionalOptions {
  /**
   * Whether the decorated method should succeed
   * @default true
   */
  succeed?: boolean;

  /**
   * Custom error to throw during execution
   */
  error?: Error;

  /**
   * Delay in milliseconds to simulate processing time
   * @default 0
   */
  delayMs?: number;

  /**
   * Number of retries to simulate before success
   * @default 0
   */
  retriesBeforeSuccess?: number;

  /**
   * Whether to track method calls
   * @default true
   */
  trackCalls?: boolean;
}

/**
 * Tracked method call information
 */
export interface TrackedMethodCall {
  /**
   * Method name
   */
  method: string;

  /**
   * Arguments passed to the method
   */
  args: any[];

  /**
   * Timestamp when the method was called
   */
  timestamp: Date;

  /**
   * Whether the method call succeeded
   */
  succeeded: boolean;

  /**
   * Error that occurred during the method call, if any
   */
  error?: Error;

  /**
   * Duration of the method call in milliseconds
   */
  durationMs: number;
}

/**
 * Registry for tracking method calls across tests
 */
export class MockMethodRegistry {
  private static methodCalls: TrackedMethodCall[] = [];

  /**
   * Tracks a method call
   */
  static trackMethodCall(call: TrackedMethodCall): void {
    this.methodCalls.push(call);
  }

  /**
   * Gets all tracked method calls
   */
  static getMethodCalls(): TrackedMethodCall[] {
    return [...this.methodCalls];
  }

  /**
   * Gets method calls for a specific method
   */
  static getMethodCallsByName(methodName: string): TrackedMethodCall[] {
    return this.methodCalls.filter(call => call.method === methodName);
  }

  /**
   * Resets the registry, clearing all method calls
   */
  static reset(): void {
    this.methodCalls = [];
  }
}

/**
 * Mock implementation of the @Transactional decorator for testing
 */
export function MockTransactional(options: MockTransactionalOptions = {}): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const methodName = propertyKey.toString();

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      let succeeded = true;
      let error: Error | undefined;

      try {
        // Simulate delay if configured
        if (options.delayMs && options.delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, options.delayMs));
        }

        // Simulate error if configured
        if (options.error) {
          succeeded = false;
          error = options.error;
          throw error;
        }

        // Simulate failure if configured
        if (options.succeed === false) {
          succeeded = false;
          error = new Error(`Mock transaction failure in ${methodName}`);
          throw error;
        }

        // Simulate retries if configured
        if (options.retriesBeforeSuccess && options.retriesBeforeSuccess > 0) {
          const retryCount = (this.__retryCount = (this.__retryCount || 0) + 1);
          if (retryCount <= options.retriesBeforeSuccess) {
            succeeded = false;
            error = new DeadlockError(
              `Mock deadlock detected (retry ${retryCount}/${options.retriesBeforeSuccess})`,
              'resource1',
              'tx2'
            );
            throw error;
          }
        }

        // Execute the original method
        const result = await originalMethod.apply(this, args);

        return result;
      } catch (err) {
        succeeded = false;
        error = err instanceof Error ? err : new Error(String(err));
        throw err;
      } finally {
        const endTime = Date.now();
        const durationMs = endTime - startTime;

        // Track method call if configured
        if (options.trackCalls !== false) {
          const call: TrackedMethodCall = {
            method: methodName,
            args,
            timestamp: new Date(),
            succeeded,
            error,
            durationMs
          };

          MockMethodRegistry.trackMethodCall(call);
        }
      }
    };

    return descriptor;
  };
}

/**
 * Mock implementation of the @ReadOnly decorator for testing
 */
export function MockReadOnly(options: MockTransactionalOptions = {}): MethodDecorator {
  return MockTransactional(options);
}

/**
 * Mock implementation of the @ReadWrite decorator for testing
 */
export function MockReadWrite(options: MockTransactionalOptions = {}): MethodDecorator {
  return MockTransactional(options);
}

/**
 * Mock implementation of the @WriteOnly decorator for testing
 */
export function MockWriteOnly(options: MockTransactionalOptions = {}): MethodDecorator {
  return MockTransactional(options);
}

/**
 * Mock implementation of the @CriticalWrite decorator for testing
 */
export function MockCriticalWrite(options: MockTransactionalOptions = {}): MethodDecorator {
  return MockTransactional(options);
}

/**
 * Mock implementation of the @RequiresNewTransaction decorator for testing
 */
export function MockRequiresNewTransaction(options: MockTransactionalOptions = {}): MethodDecorator {
  return MockTransactional(options);
}

// ========================================================================
// Utility Functions for Testing
// ========================================================================

/**
 * Creates a mock transaction for testing
 */
export function createMockTransaction<T>(
  options?: Partial<TransactionOptions>,
  mockOptions?: MockTransactionOptions
): MockTransactionImpl<T> {
  const transactionId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  return new MockTransactionImpl<T>(transactionId, options, mockOptions);
}

/**
 * Creates a mock transaction service for testing
 */
export function createMockTransactionService(
  mockOptions?: MockTransactionOptions
): MockTransactionService {
  return new MockTransactionService(mockOptions);
}

/**
 * Resets all mock registries
 */
export function resetAllMocks(): void {
  MockTransactionRegistry.reset();
  MockMethodRegistry.reset();
}

/**
 * Gets all tracked operations across all transactions
 */
export function getAllTrackedOperations(): TrackedOperation[] {
  return MockTransactionRegistry.getOperations();
}

/**
 * Gets all tracked method calls
 */
export function getAllTrackedMethodCalls(): TrackedMethodCall[] {
  return MockMethodRegistry.getMethodCalls();
}

/**
 * Gets operations for a specific transaction
 */
export function getTransactionOperations(transactionId: string): TrackedOperation[] {
  return MockTransactionRegistry.getTransactionOperations(transactionId);
}

/**
 * Gets method calls for a specific method
 */
export function getMethodCallsByName(methodName: string): TrackedMethodCall[] {
  return MockMethodRegistry.getMethodCallsByName(methodName);
}

/**
 * Sets global mock options for all new transactions
 */
export function setGlobalMockOptions(options: MockTransactionOptions): void {
  MockTransactionRegistry.setMockOptions(options);
}

/**
 * Creates a mock PrismaClient for testing
 */
export function createMockPrismaClient(
  transactionId: string = `tx-${Date.now()}`,
  mockOptions: MockTransactionOptions = {}
): MockPrismaClient {
  return new MockPrismaClient(
    transactionId,
    { ...DEFAULT_MOCK_TRANSACTION_OPTIONS, ...mockOptions }
  );
}
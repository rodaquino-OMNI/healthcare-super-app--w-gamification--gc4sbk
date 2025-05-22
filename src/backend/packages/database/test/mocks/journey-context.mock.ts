/**
 * @file journey-context.mock.ts
 * @description Base mock implementation for journey-specific database contexts that provides
 * common testing utilities and mock functionality. Serves as the foundation for journey-specific
 * context mocks with customizable behavior for query responses, transaction handling, and error simulation.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { BaseJourneyContext } from '../../src/contexts/base-journey.context';
import { PrismaService } from '../../src/prisma.service';
import { JourneyId, JourneyMetadata, JourneyContextConfig } from '../../src/types/journey.types';
import { DatabaseHealthStatus } from '../../src/types/context.types';
import { DatabaseErrorType, DatabaseErrorSeverity } from '../../src/errors/database-error.types';
import { DatabaseException, TransactionException } from '../../src/errors/database-error.exception';
import { JourneyContext, DatabaseOperationType, MiddlewareContext } from '../../src/middleware/middleware.interface';
import { TransactionCallback, TransactionOptions, TransactionIsolationLevel } from '../../src/transactions/transaction.interface';

/**
 * Configuration for mock responses in journey context mocks
 */
export interface MockResponseConfig<T = any> {
  /**
   * The operation name to mock
   */
  operation: string;

  /**
   * The model or entity type the operation applies to
   */
  model?: string;

  /**
   * The arguments to match for this mock response
   * If provided, the mock will only be used when the arguments match
   */
  args?: Record<string, any>;

  /**
   * The response to return when the operation is called
   * Can be a value or a function that returns a value
   */
  response: T | ((args: Record<string, any>) => T);

  /**
   * The number of times this mock should be used
   * If not provided, the mock will be used indefinitely
   */
  times?: number;

  /**
   * The delay in milliseconds before returning the response
   * Useful for testing timeout handling
   */
  delay?: number;
}

/**
 * Configuration for simulated errors in journey context mocks
 */
export interface MockErrorConfig {
  /**
   * The operation name to simulate an error for
   */
  operation: string;

  /**
   * The model or entity type the operation applies to
   */
  model?: string;

  /**
   * The arguments to match for this error simulation
   * If provided, the error will only be simulated when the arguments match
   */
  args?: Record<string, any>;

  /**
   * The error to throw when the operation is called
   * Can be an error instance or a function that returns an error
   */
  error: Error | ((args: Record<string, any>) => Error);

  /**
   * The number of times this error should be simulated
   * If not provided, the error will be simulated indefinitely
   */
  times?: number;

  /**
   * The delay in milliseconds before throwing the error
   * Useful for testing timeout handling
   */
  delay?: number;

  /**
   * The type of database error to simulate
   */
  errorType?: DatabaseErrorType;

  /**
   * The severity of the database error to simulate
   */
  severity?: DatabaseErrorSeverity;
}

/**
 * Configuration for simulated transaction behavior in journey context mocks
 */
export interface MockTransactionConfig {
  /**
   * Whether transactions should succeed or fail
   * @default true
   */
  shouldSucceed?: boolean;

  /**
   * The error to throw when a transaction fails
   * Only used if shouldSucceed is false
   */
  error?: Error;

  /**
   * The delay in milliseconds before completing the transaction
   * Useful for testing timeout handling
   */
  delay?: number;

  /**
   * The type of database error to simulate for transaction failures
   * Only used if shouldSucceed is false
   * @default DatabaseErrorType.TRANSACTION_COMMIT_FAILED
   */
  errorType?: DatabaseErrorType;

  /**
   * The severity of the database error to simulate for transaction failures
   * Only used if shouldSucceed is false
   * @default DatabaseErrorSeverity.MAJOR
   */
  severity?: DatabaseErrorSeverity;

  /**
   * Whether to simulate a deadlock
   * @default false
   */
  simulateDeadlock?: boolean;

  /**
   * Whether to simulate a timeout
   * @default false
   */
  simulateTimeout?: boolean;
}

/**
 * Base mock implementation for journey-specific database contexts
 * Provides common testing utilities and mock functionality
 */
@Injectable()
export class MockJourneyContext extends BaseJourneyContext {
  /**
   * Mock responses for operations
   */
  protected mockResponses: MockResponseConfig[] = [];

  /**
   * Mock errors for operations
   */
  protected mockErrors: MockErrorConfig[] = [];

  /**
   * Mock transaction configuration
   */
  protected mockTransactionConfig: MockTransactionConfig = {
    shouldSucceed: true,
  };

  /**
   * Mock database client
   */
  protected mockClient: Partial<PrismaClient> = {};

  /**
   * Mock health status
   */
  protected mockHealthStatus: DatabaseHealthStatus = {
    isAvailable: true,
    status: 'up',
    responseTimeMs: 5,
    lastSuccessfulConnection: new Date(),
    connectionPool: {
      active: 1,
      idle: 4,
      total: 5,
      max: 10,
    },
    metadata: {
      journeyId: this.journeyId,
      journeyName: this.journeyMetadata.name,
    },
  };

  /**
   * Operation history for verification in tests
   */
  protected operationHistory: {
    operation: string;
    model?: string;
    args: Record<string, any>;
    result?: any;
    error?: Error;
    timestamp: Date;
  }[] = [];

  /**
   * Transaction history for verification in tests
   */
  protected transactionHistory: {
    callback: TransactionCallback<any>;
    options?: TransactionOptions;
    result?: any;
    error?: Error;
    timestamp: Date;
  }[] = [];

  /**
   * Creates a new instance of MockJourneyContext
   * 
   * @param prismaService The PrismaService instance (can be a mock)
   * @param journeyId The journey ID for this context
   * @param config Configuration options for the journey context
   */
  constructor(
    protected readonly prismaService: PrismaService,
    journeyId: JourneyId,
    config?: Partial<JourneyContextConfig>,
  ) {
    super(prismaService, journeyId, config);
    this.initializeMockClient();
  }

  /**
   * Initializes the mock database client
   */
  protected initializeMockClient(): void {
    // Create a basic mock client that can be extended by journey-specific mocks
    this.mockClient = {
      $queryRaw: jest.fn().mockImplementation(async (query: string, ...params: any[]) => {
        return this.handleMockOperation('$queryRaw', undefined, { query, params });
      }),
      $executeRaw: jest.fn().mockImplementation(async (query: string, ...params: any[]) => {
        return this.handleMockOperation('$executeRaw', undefined, { query, params });
      }),
      $transaction: jest.fn().mockImplementation(async (callback: TransactionCallback<any>) => {
        return this.handleMockTransaction(callback);
      }),
    };
  }

  /**
   * Gets the mock database client
   * @returns The mock database client
   */
  getClient(): PrismaClient {
    return this.mockClient as PrismaClient;
  }

  /**
   * Executes a raw query against the database
   * @param query The raw query to execute
   * @param params The parameters for the query
   * @returns A promise that resolves to the query result
   */
  async executeRaw<T = any>(query: string, params?: any[]): Promise<T> {
    return this.executeWithMiddleware(
      'executeRaw',
      async () => {
        return this.handleMockOperation('executeRaw', undefined, { query, params }) as T;
      },
      {
        operationType: DatabaseOperationType.QUERY,
        journeyContext: this.mapJourneyIdToContext(),
        operation: 'executeRaw',
        args: { query, params },
      }
    );
  }

  /**
   * Executes a function within a transaction
   * @param callback The function to execute within the transaction
   * @param options Options for the transaction
   * @returns A promise that resolves to the result of the callback
   */
  async transaction<T>(
    callback: TransactionCallback<T>,
    options?: TransactionOptions
  ): Promise<T> {
    const transactionName = options?.operationType || 'transaction';
    
    return this.executeWithMiddleware(
      transactionName,
      async () => {
        return this.handleMockTransaction(callback, options);
      },
      {
        operationType: DatabaseOperationType.TRANSACTION,
        journeyContext: this.mapJourneyIdToContext(),
        operation: transactionName,
        args: { options },
      }
    );
  }

  /**
   * Checks the health of the database connection
   * @returns A promise that resolves to a health status object
   */
  async checkHealth(): Promise<DatabaseHealthStatus> {
    return this.mockHealthStatus;
  }

  /**
   * Configures the mock health status
   * @param status The mock health status to use
   */
  setMockHealthStatus(status: Partial<DatabaseHealthStatus>): void {
    this.mockHealthStatus = {
      ...this.mockHealthStatus,
      ...status,
    };
  }

  /**
   * Configures a mock response for an operation
   * @param config The mock response configuration
   */
  mockResponse<T>(config: MockResponseConfig<T>): void {
    this.mockResponses.push(config);
  }

  /**
   * Configures multiple mock responses
   * @param configs The mock response configurations
   */
  mockResponses<T>(configs: MockResponseConfig<T>[]): void {
    configs.forEach(config => this.mockResponse(config));
  }

  /**
   * Configures a mock error for an operation
   * @param config The mock error configuration
   */
  mockError(config: MockErrorConfig): void {
    this.mockErrors.push(config);
  }

  /**
   * Configures multiple mock errors
   * @param configs The mock error configurations
   */
  mockErrors(configs: MockErrorConfig[]): void {
    configs.forEach(config => this.mockError(config));
  }

  /**
   * Configures mock transaction behavior
   * @param config The mock transaction configuration
   */
  mockTransaction(config: MockTransactionConfig): void {
    this.mockTransactionConfig = {
      ...this.mockTransactionConfig,
      ...config,
    };
  }

  /**
   * Resets all mock configurations
   */
  resetMocks(): void {
    this.mockResponses = [];
    this.mockErrors = [];
    this.mockTransactionConfig = {
      shouldSucceed: true,
    };
    this.operationHistory = [];
    this.transactionHistory = [];
  }

  /**
   * Gets the operation history for verification in tests
   * @returns The operation history
   */
  getOperationHistory(): typeof this.operationHistory {
    return this.operationHistory;
  }

  /**
   * Gets the transaction history for verification in tests
   * @returns The transaction history
   */
  getTransactionHistory(): typeof this.transactionHistory {
    return this.transactionHistory;
  }

  /**
   * Verifies that an operation was called with specific arguments
   * @param operation The operation name to verify
   * @param model Optional model or entity type
   * @param args Optional arguments to match
   * @returns True if the operation was called with matching arguments, false otherwise
   */
  verifyOperation(operation: string, model?: string, args?: Record<string, any>): boolean {
    return this.operationHistory.some(entry => {
      if (entry.operation !== operation) return false;
      if (model && entry.model !== model) return false;
      if (args) {
        return Object.entries(args).every(([key, value]) => {
          return JSON.stringify(entry.args[key]) === JSON.stringify(value);
        });
      }
      return true;
    });
  }

  /**
   * Verifies that a transaction was executed
   * @param options Optional transaction options to match
   * @returns True if a transaction was executed with matching options, false otherwise
   */
  verifyTransaction(options?: Partial<TransactionOptions>): boolean {
    return this.transactionHistory.some(entry => {
      if (!options) return true;
      return Object.entries(options).every(([key, value]) => {
        return JSON.stringify(entry.options?.[key]) === JSON.stringify(value);
      });
    });
  }

  /**
   * Handles a mock operation by finding and applying the appropriate mock response or error
   * @param operation The operation name
   * @param model Optional model or entity type
   * @param args The operation arguments
   * @returns The mock response or throws a mock error
   */
  protected async handleMockOperation(operation: string, model?: string, args: Record<string, any> = {}): Promise<any> {
    // Record the operation in history
    const historyEntry = {
      operation,
      model,
      args,
      timestamp: new Date(),
    };
    this.operationHistory.push(historyEntry);

    // Check if we should simulate an error
    const errorConfig = this.findMatchingMockError(operation, model, args);
    if (errorConfig) {
      // Apply delay if configured
      if (errorConfig.delay) {
        await new Promise(resolve => setTimeout(resolve, errorConfig.delay));
      }

      // Decrement the times counter if set
      if (errorConfig.times !== undefined) {
        errorConfig.times -= 1;
        if (errorConfig.times <= 0) {
          this.mockErrors = this.mockErrors.filter(e => e !== errorConfig);
        }
      }

      // Get the error to throw
      let error: Error;
      if (typeof errorConfig.error === 'function') {
        error = errorConfig.error(args);
      } else {
        error = errorConfig.error;
      }

      // If it's not already a DatabaseException, wrap it
      if (!(error instanceof DatabaseException)) {
        error = new DatabaseException(
          error.message,
          {
            operation,
            model,
            args,
            originalError: error,
          },
          errorConfig.errorType || DatabaseErrorType.QUERY_EXECUTION_FAILED,
          errorConfig.severity || DatabaseErrorSeverity.MAJOR
        );
      }

      // Update history entry with the error
      historyEntry.error = error;

      throw error;
    }

    // Find a matching mock response
    const responseConfig = this.findMatchingMockResponse(operation, model, args);
    if (responseConfig) {
      // Apply delay if configured
      if (responseConfig.delay) {
        await new Promise(resolve => setTimeout(resolve, responseConfig.delay));
      }

      // Decrement the times counter if set
      if (responseConfig.times !== undefined) {
        responseConfig.times -= 1;
        if (responseConfig.times <= 0) {
          this.mockResponses = this.mockResponses.filter(r => r !== responseConfig);
        }
      }

      // Get the response
      let response: any;
      if (typeof responseConfig.response === 'function') {
        response = responseConfig.response(args);
      } else {
        response = responseConfig.response;
      }

      // Update history entry with the result
      historyEntry.result = response;

      return response;
    }

    // If no mock is found, return a default value based on the operation
    const defaultResponse = this.getDefaultResponse(operation, model, args);
    historyEntry.result = defaultResponse;
    return defaultResponse;
  }

  /**
   * Handles a mock transaction by applying the configured transaction behavior
   * @param callback The transaction callback
   * @param options The transaction options
   * @returns The result of the transaction callback or throws an error
   */
  protected async handleMockTransaction<T>(
    callback: TransactionCallback<T>,
    options?: TransactionOptions
  ): Promise<T> {
    // Record the transaction in history
    const historyEntry = {
      callback,
      options,
      timestamp: new Date(),
    };
    this.transactionHistory.push(historyEntry);

    // Apply delay if configured
    if (this.mockTransactionConfig.delay) {
      await new Promise(resolve => setTimeout(resolve, this.mockTransactionConfig.delay));
    }

    // Check if we should simulate a transaction failure
    if (!this.mockTransactionConfig.shouldSucceed) {
      let error: Error;

      // Determine the type of error to throw
      if (this.mockTransactionConfig.simulateDeadlock) {
        error = new TransactionException(
          'Transaction deadlock detected',
          { options },
          DatabaseErrorType.TRANSACTION_DEADLOCK,
          DatabaseErrorSeverity.MAJOR
        );
      } else if (this.mockTransactionConfig.simulateTimeout) {
        error = new TransactionException(
          'Transaction timeout exceeded',
          { options },
          DatabaseErrorType.TRANSACTION_TIMEOUT,
          DatabaseErrorSeverity.MAJOR
        );
      } else if (this.mockTransactionConfig.error) {
        error = this.mockTransactionConfig.error;
        
        // If it's not already a TransactionException, wrap it
        if (!(error instanceof TransactionException)) {
          error = new TransactionException(
            error.message,
            {
              options,
              originalError: error,
            },
            this.mockTransactionConfig.errorType || DatabaseErrorType.TRANSACTION_COMMIT_FAILED,
            this.mockTransactionConfig.severity || DatabaseErrorSeverity.MAJOR
          );
        }
      } else {
        error = new TransactionException(
          'Transaction failed',
          { options },
          this.mockTransactionConfig.errorType || DatabaseErrorType.TRANSACTION_COMMIT_FAILED,
          this.mockTransactionConfig.severity || DatabaseErrorSeverity.MAJOR
        );
      }

      // Update history entry with the error
      historyEntry.error = error;

      throw error;
    }

    try {
      // Execute the callback with the mock client
      const result = await callback(this.mockClient as any);
      
      // Update history entry with the result
      historyEntry.result = result;
      
      return result;
    } catch (error) {
      // Update history entry with the error
      historyEntry.error = error as Error;
      
      throw error;
    }
  }

  /**
   * Finds a matching mock response for an operation
   * @param operation The operation name
   * @param model Optional model or entity type
   * @param args The operation arguments
   * @returns The matching mock response configuration or undefined if none matches
   */
  protected findMatchingMockResponse(
    operation: string,
    model?: string,
    args: Record<string, any> = {}
  ): MockResponseConfig | undefined {
    return this.mockResponses.find(mock => {
      if (mock.operation !== operation) return false;
      if (mock.model && mock.model !== model) return false;
      if (mock.args) {
        return Object.entries(mock.args).every(([key, value]) => {
          return JSON.stringify(args[key]) === JSON.stringify(value);
        });
      }
      return true;
    });
  }

  /**
   * Finds a matching mock error for an operation
   * @param operation The operation name
   * @param model Optional model or entity type
   * @param args The operation arguments
   * @returns The matching mock error configuration or undefined if none matches
   */
  protected findMatchingMockError(
    operation: string,
    model?: string,
    args: Record<string, any> = {}
  ): MockErrorConfig | undefined {
    return this.mockErrors.find(mock => {
      if (mock.operation !== operation) return false;
      if (mock.model && mock.model !== model) return false;
      if (mock.args) {
        return Object.entries(mock.args).every(([key, value]) => {
          return JSON.stringify(args[key]) === JSON.stringify(value);
        });
      }
      return true;
    });
  }

  /**
   * Gets a default response for an operation when no mock is configured
   * @param operation The operation name
   * @param model Optional model or entity type
   * @param args The operation arguments
   * @returns A default response appropriate for the operation
   */
  protected getDefaultResponse(operation: string, model?: string, args: Record<string, any> = {}): any {
    // Default responses based on common operation patterns
    if (operation.startsWith('find') || operation.startsWith('get')) {
      // For find operations, return an empty array or null for single item
      return operation.includes('Many') ? [] : null;
    } else if (operation.startsWith('create')) {
      // For create operations, return the input data with an ID
      return {
        id: uuidv4(),
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else if (operation.startsWith('update')) {
      // For update operations, return the input data with updated timestamp
      return {
        id: args.where?.id || uuidv4(),
        ...args.data,
        updatedAt: new Date(),
      };
    } else if (operation.startsWith('delete')) {
      // For delete operations, return a success indicator
      return { success: true, deleted: true };
    } else if (operation.startsWith('count')) {
      // For count operations, return zero
      return 0;
    } else if (operation === 'executeRaw' || operation === '$executeRaw') {
      // For raw execution, return affected rows count
      return 0;
    } else if (operation === '$queryRaw' || operation === 'queryRaw') {
      // For raw queries, return empty array
      return [];
    } else {
      // For unknown operations, return null
      return null;
    }
  }

  /**
   * Creates test data for the specified model
   * @param model The model to create test data for
   * @param count The number of test data items to create
   * @param overrides Optional property overrides for the test data
   * @returns An array of test data items
   */
  createTestData<T = any>(model: string, count: number = 1, overrides: Partial<T> = {}): T[] {
    const results: T[] = [];
    
    for (let i = 0; i < count; i++) {
      const baseData = this.getBaseTestData<T>(model, i);
      results.push({
        ...baseData,
        ...overrides,
      });
    }
    
    return results;
  }

  /**
   * Gets base test data for a model
   * @param model The model to get base test data for
   * @param index The index of the test data item
   * @returns Base test data for the model
   */
  protected getBaseTestData<T = any>(model: string, index: number): T {
    // Common fields for all models
    const baseData: Record<string, any> = {
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      journeyId: this.journeyId,
    };
    
    // Journey-specific base implementations should override this method
    // to provide model-specific test data
    return baseData as T;
  }

  /**
   * Creates a mock database exception
   * @param message The error message
   * @param metadata Additional error metadata
   * @param errorType The type of database error
   * @param severity The severity of the database error
   * @returns A DatabaseException instance
   */
  createMockDatabaseException(
    message: string,
    metadata: Record<string, any> = {},
    errorType: DatabaseErrorType = DatabaseErrorType.UNKNOWN,
    severity: DatabaseErrorSeverity = DatabaseErrorSeverity.MAJOR
  ): DatabaseException {
    return new DatabaseException(message, metadata, errorType, severity);
  }

  /**
   * Creates a mock transaction exception
   * @param message The error message
   * @param metadata Additional error metadata
   * @param errorType The type of transaction error
   * @param severity The severity of the transaction error
   * @returns A TransactionException instance
   */
  createMockTransactionException(
    message: string,
    metadata: Record<string, any> = {},
    errorType: DatabaseErrorType = DatabaseErrorType.TRANSACTION_COMMIT_FAILED,
    severity: DatabaseErrorSeverity = DatabaseErrorSeverity.MAJOR
  ): TransactionException {
    return new TransactionException(message, metadata, errorType, severity);
  }
}
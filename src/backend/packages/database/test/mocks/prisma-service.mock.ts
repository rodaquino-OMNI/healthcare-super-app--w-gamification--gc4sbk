import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseException } from '../../src/errors/database-error.exception';
import { DatabaseErrorType } from '../../src/errors/database-error.types';
import { TransactionIsolationLevel } from '../../src/types/transaction.types';

/**
 * Mock implementation of PrismaClient for testing purposes
 */
export class PrismaClientMock {
  // Mock for all Prisma models
  [modelName: string]: any;

  constructor() {
    // Create proxy for all model access to return mock implementations
    return new Proxy(this, {
      get: (target, prop) => {
        // Handle special methods
        if (prop === '$connect' || prop === '$disconnect' || prop === '$on') {
          return jest.fn().mockResolvedValue(undefined);
        }

        if (prop === '$transaction') {
          return jest.fn((callback) => {
            if (typeof callback === 'function') {
              return callback(this);
            }
            return Promise.resolve(this);
          });
        }

        if (prop === '$queryRaw' || prop === '$executeRaw') {
          return jest.fn().mockResolvedValue([]);
        }

        if (prop === '$queryRawUnsafe' || prop === '$executeRawUnsafe') {
          return jest.fn().mockResolvedValue([]);
        }

        // Create model mock if it doesn't exist
        if (!target[prop]) {
          target[prop] = createModelMock();
        }

        return target[prop];
      },
    });
  }
}

/**
 * Creates a mock implementation of a Prisma model
 */
function createModelMock() {
  const modelMock = {
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockImplementation((args) => Promise.resolve({ id: uuidv4(), ...args?.data })),
    update: jest.fn().mockImplementation((args) => Promise.resolve({ id: args?.where?.id, ...args?.data })),
    upsert: jest.fn().mockImplementation((args) => Promise.resolve({ id: args?.where?.id || uuidv4(), ...args?.create })),
    delete: jest.fn().mockResolvedValue({ id: 'deleted-id' }),
    deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    count: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue({}),
    groupBy: jest.fn().mockResolvedValue([]),
  };

  return modelMock;
}

/**
 * Configuration options for PrismaServiceMock
 */
export interface PrismaServiceMockOptions {
  /**
   * Whether to simulate successful connections
   * @default true
   */
  simulateSuccessfulConnection?: boolean;

  /**
   * Whether to simulate successful transactions
   * @default true
   */
  simulateSuccessfulTransactions?: boolean;

  /**
   * Whether to log mock operations
   * @default false
   */
  enableLogging?: boolean;

  /**
   * Custom error to throw on connection
   */
  connectionError?: Error;

  /**
   * Custom error to throw on transaction
   */
  transactionError?: Error;

  /**
   * Delay in ms to simulate database operations
   * @default 0
   */
  operationDelay?: number;

  /**
   * Probability (0-1) of simulating a transient error
   * @default 0
   */
  transientErrorProbability?: number;
}

/**
 * Mock implementation of the enhanced PrismaService for testing purposes.
 * Provides test-friendly versions of connection pooling, lifecycle management,
 * and error handling features without requiring database connectivity.
 *
 * @example
 * // In your test file
 * const prismaServiceMock = new PrismaServiceMock();
 * 
 * // Mock a specific query response
 * prismaServiceMock.mockResponse('user', 'findUnique', { id: '1', name: 'Test User' });
 * 
 * // Simulate an error for a specific operation
 * prismaServiceMock.mockError('user', 'create', new DatabaseException(
 *   'Unique constraint violation',
 *   'DB_INTEG_001',
 *   DatabaseErrorSeverity.MAJOR
 * ));
 */
@Injectable()
export class PrismaServiceMock extends PrismaClientMock implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaServiceMock.name);
  private readonly options: Required<PrismaServiceMockOptions>;
  private readonly mockResponses = new Map<string, any>();
  private readonly mockErrors = new Map<string, Error>();
  private isInitialized = false;
  private isShuttingDown = false;
  private connectionStats = {
    total: 0,
    active: 0,
    idle: 0,
    waiting: 0,
  };

  /**
   * Creates a new instance of PrismaServiceMock
   * @param options Configuration options for the mock
   */
  constructor(options: PrismaServiceMockOptions = {}) {
    super();

    // Set default options
    this.options = {
      simulateSuccessfulConnection: options.simulateSuccessfulConnection !== false,
      simulateSuccessfulTransactions: options.simulateSuccessfulTransactions !== false,
      enableLogging: options.enableLogging || false,
      connectionError: options.connectionError,
      transactionError: options.transactionError,
      operationDelay: options.operationDelay || 0,
      transientErrorProbability: options.transientErrorProbability || 0,
    };

    // Initialize connection stats
    this.resetConnectionStats();

    if (this.options.enableLogging) {
      this.logger.log('PrismaServiceMock initialized with options:', this.options);
    }
  }

  /**
   * Initializes the PrismaServiceMock when the application starts
   */
  async onModuleInit(): Promise<void> {
    if (this.options.enableLogging) {
      this.logger.log('Initializing PrismaServiceMock...');
    }

    try {
      // Simulate connection error if configured
      if (this.options.connectionError) {
        throw this.options.connectionError;
      }

      // Simulate connection failure if configured
      if (!this.options.simulateSuccessfulConnection) {
        throw new DatabaseException(
          'Failed to connect to database (simulated)',
          'DB_CONN_001',
          undefined,
          undefined,
          { journey: 'test' },
        );
      }

      // Simulate connection delay if configured
      if (this.options.operationDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, this.options.operationDelay));
      }

      // Update connection stats to simulate connections
      this.connectionStats.total = 5;
      this.connectionStats.idle = 3;
      this.connectionStats.active = 2;

      this.isInitialized = true;

      if (this.options.enableLogging) {
        this.logger.log('PrismaServiceMock initialized successfully');
      }
    } catch (error) {
      if (this.options.enableLogging) {
        this.logger.error('Failed to initialize PrismaServiceMock', error);
      }
      throw error;
    }
  }

  /**
   * Cleans up resources when the application shuts down
   */
  async onModuleDestroy(): Promise<void> {
    if (this.options.enableLogging) {
      this.logger.log('Shutting down PrismaServiceMock...');
    }

    this.isShuttingDown = true;

    // Reset connection stats
    this.resetConnectionStats();

    if (this.options.enableLogging) {
      this.logger.log('PrismaServiceMock shut down successfully');
    }
  }

  /**
   * Mocks a response for a specific model and operation
   * @param model The model name (e.g., 'user', 'post')
   * @param operation The operation name (e.g., 'findUnique', 'create')
   * @param response The response to return
   */
  mockResponse(model: string, operation: string, response: any): void {
    const key = `${model}.${operation}`;
    this.mockResponses.set(key, response);

    // Override the model operation with the mock response
    if (this[model] && typeof this[model][operation] === 'function') {
      this[model][operation] = jest.fn().mockImplementation(async () => {
        // Simulate operation delay if configured
        if (this.options.operationDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, this.options.operationDelay));
        }

        // Check if we should simulate a transient error
        if (this.shouldSimulateTransientError()) {
          throw new DatabaseException(
            'Transient error (simulated)',
            'DB_CONN_002',
            undefined,
            undefined,
            { journey: 'test' },
          );
        }

        // Check if there's a mock error for this operation
        const errorKey = `${model}.${operation}`;
        if (this.mockErrors.has(errorKey)) {
          throw this.mockErrors.get(errorKey);
        }

        return response;
      });
    }

    if (this.options.enableLogging) {
      this.logger.log(`Mocked response for ${key}:`, response);
    }
  }

  /**
   * Mocks an error for a specific model and operation
   * @param model The model name (e.g., 'user', 'post')
   * @param operation The operation name (e.g., 'findUnique', 'create')
   * @param error The error to throw
   */
  mockError(model: string, operation: string, error: Error): void {
    const key = `${model}.${operation}`;
    this.mockErrors.set(key, error);

    // Override the model operation with the mock error
    if (this[model] && typeof this[model][operation] === 'function') {
      this[model][operation] = jest.fn().mockImplementation(async () => {
        // Simulate operation delay if configured
        if (this.options.operationDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, this.options.operationDelay));
        }

        throw error;
      });
    }

    if (this.options.enableLogging) {
      this.logger.log(`Mocked error for ${key}:`, error);
    }
  }

  /**
   * Resets all mock responses and errors
   */
  resetMocks(): void {
    this.mockResponses.clear();
    this.mockErrors.clear();

    // Reset all model operations
    Object.keys(this).forEach(key => {
      if (typeof this[key] === 'object' && this[key] !== null) {
        Object.keys(this[key]).forEach(operation => {
          if (typeof this[key][operation] === 'function') {
            this[key][operation] = jest.fn();
          }
        });
      }
    });

    if (this.options.enableLogging) {
      this.logger.log('Reset all mocks');
    }
  }

  /**
   * Executes a function within a transaction
   * @param fn The function to execute within the transaction
   * @param options Transaction options including isolation level
   * @returns The result of the function execution
   */
  async $executeInTransaction<T>(
    fn: (prisma: Prisma.TransactionClient) => Promise<T>,
    options?: {
      isolationLevel?: TransactionIsolationLevel;
      timeout?: number;
      maxRetries?: number;
    },
  ): Promise<T> {
    if (this.options.enableLogging) {
      this.logger.log('Executing in transaction with options:', options);
    }

    try {
      // Simulate transaction error if configured
      if (this.options.transactionError) {
        throw this.options.transactionError;
      }

      // Simulate transaction failure if configured
      if (!this.options.simulateSuccessfulTransactions) {
        throw new DatabaseException(
          'Transaction failed (simulated)',
          'DB_TRANS_001',
          undefined,
          undefined,
          { journey: 'test' },
        );
      }

      // Simulate operation delay if configured
      if (this.options.operationDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, this.options.operationDelay));
      }

      // Create a transaction client mock
      const transactionClient = this.createTransactionClientMock();

      // Execute the function with the transaction client
      const result = await fn(transactionClient as unknown as Prisma.TransactionClient);

      return result;
    } catch (error) {
      if (this.options.enableLogging) {
        this.logger.error('Transaction failed:', error);
      }
      throw error;
    }
  }

  /**
   * Executes a database operation with retry logic for transient errors
   * @param operation The database operation to execute
   * @param options Retry options
   * @returns The result of the operation
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options?: {
      maxRetries?: number;
      baseDelay?: number;
      maxDelay?: number;
      useJitter?: boolean;
    },
  ): Promise<T> {
    const maxRetries = options?.maxRetries || 3;
    const baseDelay = options?.baseDelay || 100;
    const maxDelay = options?.maxDelay || 5000;
    const useJitter = options?.useJitter !== false;

    if (this.options.enableLogging) {
      this.logger.log('Executing with retry:', { maxRetries, baseDelay, maxDelay, useJitter });
    }

    let attempt = 0;
    let lastError: any;

    while (attempt <= maxRetries) {
      try {
        // Simulate operation delay if configured
        if (this.options.operationDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, this.options.operationDelay));
        }

        // Check if we should simulate a transient error on this attempt
        // but allow the last attempt to succeed if we've reached max retries
        if (this.shouldSimulateTransientError() && attempt < maxRetries) {
          throw new DatabaseException(
            `Transient error on attempt ${attempt + 1} (simulated)`,
            'DB_CONN_003',
            undefined,
            undefined,
            { journey: 'test' },
          );
        }

        return await operation();
      } catch (error) {
        lastError = error;
        attempt++;

        // If we've reached max retries, throw the error
        if (attempt > maxRetries) {
          throw error;
        }

        // Calculate delay for the next retry
        const delay = Math.min(maxDelay, baseDelay * Math.pow(2, attempt - 1));
        const jitteredDelay = useJitter ? delay * (0.5 + Math.random() * 0.5) : delay;

        if (this.options.enableLogging) {
          this.logger.warn(
            `Operation failed (attempt ${attempt}/${maxRetries + 1}). ` +
            `Retrying in ${Math.round(jitteredDelay)}ms...`,
            error,
          );
        }

        // Wait before the next retry
        await new Promise(resolve => setTimeout(resolve, jitteredDelay));
      }
    }

    // This should never happen, but TypeScript requires a return statement
    throw lastError;
  }

  /**
   * Gets a connection from the connection pool
   * @returns A promise that resolves to a database connection
   */
  async getConnection(): Promise<any> {
    if (this.options.enableLogging) {
      this.logger.log('Getting connection from pool');
    }

    // Simulate connection error if configured
    if (this.options.connectionError) {
      throw this.options.connectionError;
    }

    // Simulate connection failure if configured
    if (!this.options.simulateSuccessfulConnection) {
      throw new DatabaseException(
        'Failed to get connection from pool (simulated)',
        'DB_CONN_004',
        undefined,
        undefined,
        { journey: 'test' },
      );
    }

    // Simulate operation delay if configured
    if (this.options.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.options.operationDelay));
    }

    // Update connection stats
    this.connectionStats.active++;
    this.connectionStats.idle--;

    // Return a mock connection
    return { id: uuidv4(), isActive: true };
  }

  /**
   * Releases a connection back to the pool
   * @param connection The connection to release
   */
  releaseConnection(connection: any): void {
    if (this.options.enableLogging) {
      this.logger.log('Releasing connection back to pool:', connection);
    }

    // Update connection stats
    this.connectionStats.active--;
    this.connectionStats.idle++;
  }

  /**
   * Checks the health of the database connection
   * @returns A promise that resolves to a health check result
   */
  async checkHealth(): Promise<{ healthy: boolean; details?: any }> {
    if (this.options.enableLogging) {
      this.logger.log('Checking database health');
    }

    // Simulate connection error if configured
    if (this.options.connectionError) {
      return {
        healthy: false,
        details: {
          error: this.options.connectionError.message,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Simulate connection failure if configured
    if (!this.options.simulateSuccessfulConnection) {
      return {
        healthy: false,
        details: {
          error: 'Database connection failed (simulated)',
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Simulate operation delay if configured
    if (this.options.operationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.options.operationDelay));
    }

    return {
      healthy: true,
      details: {
        connections: this.connectionStats,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Gets the current connection pool statistics
   * @returns Connection pool statistics
   */
  getConnectionStats(): {
    total: number;
    active: number;
    idle: number;
    waiting: number;
  } {
    return { ...this.connectionStats };
  }

  /**
   * Sets the connection pool statistics for testing
   * @param stats The connection stats to set
   */
  setConnectionStats(stats: Partial<{
    total: number;
    active: number;
    idle: number;
    waiting: number;
  }>): void {
    this.connectionStats = {
      ...this.connectionStats,
      ...stats,
    };

    if (this.options.enableLogging) {
      this.logger.log('Updated connection stats:', this.connectionStats);
    }
  }

  /**
   * Resets the connection pool statistics
   */
  resetConnectionStats(): void {
    this.connectionStats = {
      total: 0,
      active: 0,
      idle: 0,
      waiting: 0,
    };

    if (this.options.enableLogging) {
      this.logger.log('Reset connection stats');
    }
  }

  /**
   * Creates a mock transaction client
   * @returns A mock transaction client
   */
  private createTransactionClientMock(): any {
    // Create a new instance of PrismaClientMock to use as transaction client
    const transactionClient = new PrismaClientMock();

    // Add transaction-specific methods
    (transactionClient as any).$commit = jest.fn().mockResolvedValue(undefined);
    (transactionClient as any).$rollback = jest.fn().mockResolvedValue(undefined);
    (transactionClient as any)._clientId = uuidv4();

    return transactionClient;
  }

  /**
   * Determines if a transient error should be simulated based on configured probability
   * @returns True if a transient error should be simulated
   */
  private shouldSimulateTransientError(): boolean {
    return Math.random() < this.options.transientErrorProbability;
  }
}

/**
 * Creates a mock transaction for testing
 * @param options Options for the mock transaction
 * @returns A mock transaction object
 */
export function createMockTransaction(options: {
  id?: string;
  state?: string;
  isolationLevel?: string;
  journeyContext?: string;
  startedAt?: Date;
  completedAt?: Date;
  error?: Error;
} = {}): any {
  return {
    id: options.id || uuidv4(),
    metadata: {
      id: options.id || uuidv4(),
      state: options.state || 'ACTIVE',
      isolationLevel: options.isolationLevel || 'READ_COMMITTED',
      journeyContext: options.journeyContext || 'test',
      startedAt: options.startedAt || new Date(),
      completedAt: options.completedAt,
      error: options.error,
    },
    options: {
      isolationLevel: options.isolationLevel || 'READ_COMMITTED',
      timeout: { timeoutMs: 5000 },
      retry: { maxRetries: 3 },
      logging: { logEvents: false },
    },
    start: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    execute: jest.fn().mockImplementation((fn) => fn(new PrismaClientMock())),
    createSavepoint: jest.fn().mockResolvedValue('sp1'),
    rollbackToSavepoint: jest.fn().mockResolvedValue(undefined),
  };
}
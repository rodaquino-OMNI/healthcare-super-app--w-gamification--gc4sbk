import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { MockPrismaClient } from './prisma-client.mock';

/**
 * Error types that can be simulated by the mock PrismaService
 */
export enum MockDatabaseErrorType {
  CONNECTION = 'connection',
  QUERY = 'query',
  TRANSACTION = 'transaction',
  TIMEOUT = 'timeout',
  CONSTRAINT = 'constraint',
  FOREIGN_KEY = 'foreignKey',
  UNIQUE = 'unique',
  NOT_FOUND = 'notFound',
  PERMISSION = 'permission',
}

/**
 * Configuration options for the MockPrismaService
 */
export interface MockPrismaServiceOptions {
  /**
   * Whether to simulate successful connection
   * @default true
   */
  shouldConnect?: boolean;

  /**
   * Maximum number of simulated connections
   * @default 10
   */
  maxConnections?: number;

  /**
   * Delay in ms to simulate connection time
   * @default 0
   */
  connectionDelay?: number;

  /**
   * Errors to simulate during operations
   */
  simulatedErrors?: {
    type: MockDatabaseErrorType;
    /**
     * Model name to apply the error to (if applicable)
     */
    model?: string;
    /**
     * Operation to apply the error to (if applicable)
     */
    operation?: string;
    /**
     * Error message to include
     */
    message?: string;
    /**
     * Prisma error code to simulate
     */
    code?: string;
    /**
     * Whether to always trigger this error or randomly
     * @default false (always trigger)
     */
    random?: boolean;
    /**
     * Probability of error occurring if random is true (0-1)
     * @default 0.5
     */
    probability?: number;
  }[];

  /**
   * Custom responses for specific queries
   */
  mockResponses?: Record<string, any>;
}

/**
 * Mock implementation of the enhanced PrismaService that extends the PrismaClient mock.
 * Provides test-friendly versions of connection pooling, lifecycle management, and error handling
 * features without requiring database connectivity.
 */
@Injectable()
export class MockPrismaService extends MockPrismaClient implements OnModuleInit, OnModuleDestroy {
  private isConnected = false;
  private activeConnections = 0;
  private options: MockPrismaServiceOptions;
  private mockResponses: Record<string, any> = {};

  /**
   * Creates a new instance of MockPrismaService
   * @param configService Optional NestJS ConfigService for configuration
   * @param options Mock configuration options
   */
  constructor(
    private readonly configService?: ConfigService,
    options?: MockPrismaServiceOptions,
  ) {
    super();
    this.options = {
      shouldConnect: true,
      maxConnections: 10,
      connectionDelay: 0,
      simulatedErrors: [],
      ...options,
    };
    this.mockResponses = this.options.mockResponses || {};

    // Override the $transaction method to handle transaction mocking
    this.$transaction = this.mockTransaction.bind(this);
  }

  /**
   * Initializes the PrismaService when the module is initialized
   * Implements NestJS OnModuleInit interface
   */
  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  /**
   * Cleans up resources when the module is destroyed
   * Implements NestJS OnModuleDestroy interface
   */
  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  /**
   * Simulates connecting to the database
   * @returns Promise that resolves when connected
   * @throws Error if connection fails
   */
  async connect(): Promise<void> {
    // Simulate connection delay if specified
    if (this.options.connectionDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.options.connectionDelay));
    }

    // Check if we should simulate a connection error
    const connectionError = this.getSimulatedError(MockDatabaseErrorType.CONNECTION);
    if (connectionError) {
      throw new Error(`Failed to connect to database: ${connectionError.message || 'Connection error'}`);
    }

    // Check if we should simulate a successful connection
    if (!this.options.shouldConnect) {
      throw new Error('Database connection failed: Connection refused');
    }

    this.isConnected = true;
  }

  /**
   * Simulates disconnecting from the database
   * @returns Promise that resolves when disconnected
   */
  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.activeConnections = 0;
  }

  /**
   * Simulates acquiring a connection from the pool
   * @returns A connection object (simulated)
   * @throws Error if max connections reached
   */
  async acquireConnection(): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Cannot acquire connection: Not connected to database');
    }

    if (this.activeConnections >= this.options.maxConnections) {
      throw new Error(`Connection pool exhausted: Max connections (${this.options.maxConnections}) reached`);
    }

    this.activeConnections++;
    return { id: `mock-connection-${this.activeConnections}` };
  }

  /**
   * Simulates releasing a connection back to the pool
   * @param connection The connection to release
   */
  releaseConnection(connection: any): void {
    if (this.activeConnections > 0) {
      this.activeConnections--;
    }
  }

  /**
   * Gets the current number of active connections
   * @returns Number of active connections
   */
  getActiveConnections(): number {
    return this.activeConnections;
  }

  /**
   * Checks if the service is connected to the database
   * @returns True if connected, false otherwise
   */
  isConnectedToDatabase(): boolean {
    return this.isConnected;
  }

  /**
   * Simulates cleaning the database (for testing)
   * @returns Promise that resolves when database is cleaned
   */
  async cleanDatabase(): Promise<void> {
    // This is a mock implementation that doesn't actually clean anything
    // but simulates the behavior for testing
    return Promise.resolve();
  }

  /**
   * Mocks transaction execution with proper typing
   * @param tx The transaction function or array of operations
   * @returns Result of the transaction
   */
  private async mockTransaction<R>(
    tx: Prisma.PrismaPromise<any>[] | ((prisma: Prisma.TransactionClient) => Promise<R>),
  ): Promise<R> {
    // Check if we should simulate a transaction error
    const txError = this.getSimulatedError(MockDatabaseErrorType.TRANSACTION);
    if (txError) {
      throw new Error(`Transaction failed: ${txError.message || 'Transaction error'}`);
    }

    try {
      // If tx is a function, execute it with this as the transaction client
      if (typeof tx === 'function') {
        return await tx(this as unknown as Prisma.TransactionClient);
      }

      // If tx is an array of promises, resolve them sequentially
      // and return the last result
      let result: any;
      for (const promise of tx) {
        result = await promise;
      }
      return result;
    } catch (error) {
      // Simulate transaction rollback
      throw error;
    }
  }

  /**
   * Checks if an operation should trigger a simulated error
   * @param type The type of error to check for
   * @param model Optional model name to check
   * @param operation Optional operation name to check
   * @returns The error configuration if an error should be triggered, null otherwise
   */
  private getSimulatedError(
    type: MockDatabaseErrorType,
    model?: string,
    operation?: string,
  ): MockPrismaServiceOptions['simulatedErrors'][0] | null {
    const matchingErrors = this.options.simulatedErrors.filter(error => {
      // Check if the error type matches
      if (error.type !== type) return false;

      // If model is specified, check if it matches
      if (model && error.model && error.model !== model) return false;

      // If operation is specified, check if it matches
      if (operation && error.operation && error.operation !== operation) return false;

      // If random is true, determine if the error should trigger based on probability
      if (error.random) {
        const probability = error.probability || 0.5;
        return Math.random() < probability;
      }

      // If we got here, the error should trigger
      return true;
    });

    return matchingErrors.length > 0 ? matchingErrors[0] : null;
  }

  /**
   * Configures the mock service with new options
   * @param options The options to apply
   */
  setOptions(options: Partial<MockPrismaServiceOptions>): void {
    this.options = {
      ...this.options,
      ...options,
    };

    if (options.mockResponses) {
      this.mockResponses = {
        ...this.mockResponses,
        ...options.mockResponses,
      };
    }
  }

  /**
   * Adds a simulated error to the service
   * @param error The error configuration to add
   */
  addSimulatedError(error: MockPrismaServiceOptions['simulatedErrors'][0]): void {
    this.options.simulatedErrors.push(error);
  }

  /**
   * Clears all simulated errors
   */
  clearSimulatedErrors(): void {
    this.options.simulatedErrors = [];
  }

  /**
   * Sets a mock response for a specific query
   * @param key The query key (usually model.operation)
   * @param response The response to return
   */
  setMockResponse(key: string, response: any): void {
    this.mockResponses[key] = response;
  }

  /**
   * Gets a mock response for a specific query
   * @param key The query key
   * @returns The mock response or undefined if not found
   */
  getMockResponse(key: string): any {
    return this.mockResponses[key];
  }

  /**
   * Clears all mock responses
   */
  clearMockResponses(): void {
    this.mockResponses = {};
  }

  /**
   * Resets the mock service to its initial state
   */
  reset(): void {
    this.isConnected = false;
    this.activeConnections = 0;
    this.clearSimulatedErrors();
    this.clearMockResponses();
    this.options = {
      shouldConnect: true,
      maxConnections: 10,
      connectionDelay: 0,
      simulatedErrors: [],
    };
  }
}

/**
 * Creates a new instance of MockPrismaService with the given options
 * @param options Configuration options for the mock service
 * @returns A new MockPrismaService instance
 */
export function createMockPrismaService(options?: MockPrismaServiceOptions): MockPrismaService {
  return new MockPrismaService(undefined, options);
}
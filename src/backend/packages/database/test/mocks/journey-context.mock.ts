import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

import { BaseJourneyContext } from '../../src/contexts/base-journey.context';
import { JourneyType } from '../../src/types/journey.types';
import { DatabaseContextOptions } from '../../src/types/context.types';
import { FilterOptions, SortOptions, PaginationOptions } from '../../src/types/query.types';
import { TransactionIsolationLevel } from '../../src/transactions/transaction.interface';
import { DatabaseException, ConnectionException, QueryException, TransactionException } from '../../src/errors/database-error.exception';
import { DatabaseErrorType, DatabaseErrorSeverity, DatabaseErrorRecoverability } from '../../src/errors/database-error.types';

/**
 * Configuration options for the mock journey context
 */
export interface MockJourneyContextOptions {
  /** Whether to simulate successful operations (default: true) */
  simulateSuccess?: boolean;
  
  /** Whether to simulate connection errors (default: false) */
  simulateConnectionError?: boolean;
  
  /** Whether to simulate query errors (default: false) */
  simulateQueryError?: boolean;
  
  /** Whether to simulate transaction errors (default: false) */
  simulateTransactionError?: boolean;
  
  /** Delay in milliseconds to simulate operation latency (default: 0) */
  simulateDelay?: number;
  
  /** Custom error to throw when simulating errors */
  customError?: Error;
  
  /** Custom mock data for specific operations */
  mockResponses?: Record<string, any>;
  
  /** Journey-specific mock options */
  journeyOptions?: Record<string, any>;
}

/**
 * Type for mock operation handlers
 */
type MockOperationHandler<T> = () => T | Promise<T>;

/**
 * Base mock implementation for journey-specific database contexts.
 * Provides common testing utilities and mock functionality for all journey contexts.
 * 
 * This class serves as the foundation for journey-specific context mocks with
 * customizable behavior for query responses, transaction handling, and error simulation.
 */
export abstract class BaseMockJourneyContext extends BaseJourneyContext {
  /** Map of mock responses for specific operations */
  protected mockResponses: Map<string, any> = new Map();
  
  /** Map of mock operation handlers */
  protected mockOperationHandlers: Map<string, MockOperationHandler<any>> = new Map();
  
  /** Mock options for configuring behavior */
  protected mockOptions: MockJourneyContextOptions;
  
  /** Mock transaction client for transaction testing */
  protected mockTransactionClient: PrismaClient;
  
  /** Flag indicating if a transaction is active */
  protected isInTransaction: boolean = false;
  
  /** Mock transaction ID for the current transaction */
  protected currentTransactionId: string | null = null;
  
  /** Collection of operations performed in the current transaction */
  protected transactionOperations: Array<{ operation: string; params: any }> = [];
  
  /** Collection of all operations performed by this context */
  protected operationHistory: Array<{ 
    operation: string; 
    params: any; 
    result?: any; 
    error?: Error; 
    timestamp: Date;
    transactionId?: string;
  }> = [];
  
  /**
   * Creates a new instance of BaseMockJourneyContext.
   * 
   * @param configService - NestJS ConfigService for accessing environment configuration
   * @param options - Optional configuration options for the database context
   * @param mockOptions - Options for configuring mock behavior
   */
  constructor(
    protected readonly configService: ConfigService,
    protected readonly options: DatabaseContextOptions = {},
    mockOptions: MockJourneyContextOptions = {}
  ) {
    super(configService, options);
    
    // Set default mock options
    this.mockOptions = {
      simulateSuccess: true,
      simulateConnectionError: false,
      simulateQueryError: false,
      simulateTransactionError: false,
      simulateDelay: 0,
      mockResponses: {},
      journeyOptions: {},
      ...mockOptions
    };
    
    // Initialize mock responses from options
    if (this.mockOptions.mockResponses) {
      Object.entries(this.mockOptions.mockResponses).forEach(([key, value]) => {
        this.mockResponses.set(key, value);
      });
    }
    
    // Create mock transaction client
    this.mockTransactionClient = this.createMockTransactionClient();
    
    // Register default mock operation handlers
    this.registerDefaultMockOperationHandlers();
  }
  
  /**
   * Lifecycle hook that runs when the module is initialized.
   * In the mock implementation, this simulates database connection.
   */
  async onModuleInit(): Promise<void> {
    this.logger.log(`Initializing mock ${this.journeyType} journey database context`);
    
    // Simulate connection delay
    await this.simulateDelay();
    
    // Simulate connection error if configured
    if (this.mockOptions.simulateConnectionError) {
      const error = this.mockOptions.customError || new Error('Mock connection error');
      throw new ConnectionException(
        `Failed to connect to database for ${this.journeyType} journey`,
        {
          cause: error,
          journeyType: this.journeyType,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
        }
      );
    }
    
    this.logger.log(`Mock ${this.journeyType} journey database context initialized successfully`);
  }
  
  /**
   * Lifecycle hook that runs when the module is destroyed.
   * In the mock implementation, this simulates closing database connections.
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log(`Closing mock ${this.journeyType} journey database context`);
    
    // Simulate delay
    await this.simulateDelay();
    
    this.logger.log(`Mock ${this.journeyType} journey database context closed successfully`);
  }
  
  /**
   * Executes a function within a mock database transaction.
   * 
   * @param fn - The function to execute within the transaction
   * @param isolationLevel - Optional transaction isolation level
   * @returns The result of the function execution
   */
  async executeTransaction<T>(
    fn: (tx: PrismaClient) => Promise<T>,
    isolationLevel: TransactionIsolationLevel = TransactionIsolationLevel.READ_COMMITTED
  ): Promise<T> {
    return this.executeMockOperation('executeTransaction', { fn, isolationLevel }, async () => {
      // Simulate transaction error if configured
      if (this.mockOptions.simulateTransactionError) {
        const error = this.mockOptions.customError || new Error('Mock transaction error');
        throw new TransactionException(
          `Transaction failed for ${this.journeyType} journey: ${error.message}`,
          {
            cause: error,
            journeyType: this.journeyType,
            severity: DatabaseErrorSeverity.MAJOR,
            recoverability: DatabaseErrorRecoverability.TRANSIENT,
          }
        );
      }
      
      try {
        // Begin mock transaction
        this.beginMockTransaction();
        
        // Execute the function with the mock transaction client
        const result = await fn(this.mockTransactionClient);
        
        // Commit mock transaction
        this.commitMockTransaction();
        
        return result;
      } catch (error) {
        // Rollback mock transaction
        this.rollbackMockTransaction();
        throw error;
      }
    });
  }
  
  /**
   * Executes a function within a nested mock transaction.
   * 
   * @param fn - The function to execute within the nested transaction
   * @param parent - The parent transaction
   * @returns The result of the function execution
   */
  async executeNestedTransaction<T>(
    fn: (tx: PrismaClient) => Promise<T>,
    parent: PrismaClient
  ): Promise<T> {
    return this.executeMockOperation('executeNestedTransaction', { fn }, async () => {
      // Simulate transaction error if configured
      if (this.mockOptions.simulateTransactionError) {
        const error = this.mockOptions.customError || new Error('Mock nested transaction error');
        throw new TransactionException(
          `Nested transaction failed for ${this.journeyType} journey: ${error.message}`,
          {
            cause: error,
            journeyType: this.journeyType,
            severity: DatabaseErrorSeverity.MAJOR,
            recoverability: DatabaseErrorRecoverability.TRANSIENT,
          }
        );
      }
      
      try {
        // Begin mock nested transaction (using same transaction client)
        const savePointId = this.beginMockNestedTransaction();
        
        // Execute the function with the mock transaction client
        const result = await fn(this.mockTransactionClient);
        
        // Commit mock nested transaction
        this.commitMockNestedTransaction(savePointId);
        
        return result;
      } catch (error) {
        // Rollback mock nested transaction
        this.rollbackMockNestedTransaction();
        throw error;
      }
    });
  }
  
  /**
   * Finds an entity by ID with optional relations.
   * 
   * @param id - The ID of the entity to find
   * @param options - Optional query options
   * @returns The found entity or null if not found
   */
  async findById<T>(id: string | number, options?: Record<string, any>): Promise<T> {
    return this.executeMockOperation('findById', { id, options }, async () => {
      // Get mock response for this specific ID if available
      const mockResponseKey = `findById:${id}`;
      if (this.mockResponses.has(mockResponseKey)) {
        return this.mockResponses.get(mockResponseKey);
      }
      
      // Get mock response for findById operation
      if (this.mockResponses.has('findById')) {
        return this.mockResponses.get('findById');
      }
      
      // Generate mock data if no specific mock response is configured
      return this.generateMockData('entity', { id }) as T;
    });
  }
  
  /**
   * Finds multiple entities with filtering, sorting, and pagination.
   * 
   * @param filter - Optional filter criteria
   * @param sort - Optional sort criteria
   * @param pagination - Optional pagination options
   * @returns Array of found entities
   */
  async findMany<T>(
    filter?: FilterOptions,
    sort?: SortOptions,
    pagination?: PaginationOptions
  ): Promise<T[]> {
    return this.executeMockOperation('findMany', { filter, sort, pagination }, async () => {
      // Get mock response for findMany operation
      if (this.mockResponses.has('findMany')) {
        return this.mockResponses.get('findMany');
      }
      
      // Generate mock data if no specific mock response is configured
      const count = pagination?.limit || 10;
      return Array.from({ length: count }, (_, index) => 
        this.generateMockData('entity', { id: `mock-id-${index + 1}` })
      ) as T[];
    });
  }
  
  /**
   * Creates a new entity.
   * 
   * @param data - The data for the new entity
   * @returns The created entity
   */
  async create<T>(data: Record<string, any>): Promise<T> {
    return this.executeMockOperation('create', { data }, async () => {
      // Get mock response for create operation
      if (this.mockResponses.has('create')) {
        return this.mockResponses.get('create');
      }
      
      // Generate mock data with the provided data and a generated ID
      return {
        id: `mock-id-${uuidv4()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      } as T;
    });
  }
  
  /**
   * Updates an existing entity.
   * 
   * @param id - The ID of the entity to update
   * @param data - The data to update
   * @returns The updated entity
   */
  async update<T>(id: string | number, data: Record<string, any>): Promise<T> {
    return this.executeMockOperation('update', { id, data }, async () => {
      // Get mock response for this specific ID if available
      const mockResponseKey = `update:${id}`;
      if (this.mockResponses.has(mockResponseKey)) {
        return this.mockResponses.get(mockResponseKey);
      }
      
      // Get mock response for update operation
      if (this.mockResponses.has('update')) {
        return this.mockResponses.get('update');
      }
      
      // Generate mock data with the provided data and ID
      return {
        id,
        updatedAt: new Date(),
        ...data,
      } as T;
    });
  }
  
  /**
   * Deletes an entity.
   * 
   * @param id - The ID of the entity to delete
   * @returns The deleted entity
   */
  async delete<T>(id: string | number): Promise<T> {
    return this.executeMockOperation('delete', { id }, async () => {
      // Get mock response for this specific ID if available
      const mockResponseKey = `delete:${id}`;
      if (this.mockResponses.has(mockResponseKey)) {
        return this.mockResponses.get(mockResponseKey);
      }
      
      // Get mock response for delete operation
      if (this.mockResponses.has('delete')) {
        return this.mockResponses.get('delete');
      }
      
      // Generate mock deleted entity
      return {
        id,
        deletedAt: new Date(),
      } as T;
    });
  }
  
  /**
   * Counts entities based on filter criteria.
   * 
   * @param filter - Optional filter criteria
   * @returns Count of matching entities
   */
  async count(filter?: FilterOptions): Promise<number> {
    return this.executeMockOperation('count', { filter }, async () => {
      // Get mock response for count operation
      if (this.mockResponses.has('count')) {
        return this.mockResponses.get('count');
      }
      
      // Return default count
      return 10;
    });
  }
  
  /**
   * Sets a mock response for a specific operation.
   * 
   * @param operationKey - The operation key (e.g., 'findById', 'findById:123')
   * @param response - The mock response to return
   * @returns This context instance for chaining
   */
  setMockResponse(operationKey: string, response: any): this {
    this.mockResponses.set(operationKey, response);
    return this;
  }
  
  /**
   * Sets a mock operation handler for a specific operation.
   * 
   * @param operationKey - The operation key
   * @param handler - The mock operation handler function
   * @returns This context instance for chaining
   */
  setMockOperationHandler<T>(operationKey: string, handler: MockOperationHandler<T>): this {
    this.mockOperationHandlers.set(operationKey, handler);
    return this;
  }
  
  /**
   * Configures the mock context to simulate success or failure.
   * 
   * @param options - Mock options to update
   * @returns This context instance for chaining
   */
  configureMock(options: Partial<MockJourneyContextOptions>): this {
    this.mockOptions = {
      ...this.mockOptions,
      ...options,
    };
    
    // Update mock responses if provided
    if (options.mockResponses) {
      Object.entries(options.mockResponses).forEach(([key, value]) => {
        this.mockResponses.set(key, value);
      });
    }
    
    return this;
  }
  
  /**
   * Gets the operation history for this mock context.
   * 
   * @returns Array of operations performed by this context
   */
  getOperationHistory(): Array<{ 
    operation: string; 
    params: any; 
    result?: any; 
    error?: Error; 
    timestamp: Date;
    transactionId?: string;
  }> {
    return [...this.operationHistory];
  }
  
  /**
   * Gets the transaction operations for the current transaction.
   * 
   * @returns Array of operations performed in the current transaction
   */
  getTransactionOperations(): Array<{ operation: string; params: any }> {
    return [...this.transactionOperations];
  }
  
  /**
   * Clears the operation history for this mock context.
   * 
   * @returns This context instance for chaining
   */
  clearOperationHistory(): this {
    this.operationHistory = [];
    return this;
  }
  
  /**
   * Clears all mock responses.
   * 
   * @returns This context instance for chaining
   */
  clearMockResponses(): this {
    this.mockResponses.clear();
    return this;
  }
  
  /**
   * Resets the mock context to its initial state.
   * 
   * @returns This context instance for chaining
   */
  reset(): this {
    this.mockResponses.clear();
    this.mockOperationHandlers.clear();
    this.operationHistory = [];
    this.transactionOperations = [];
    this.isInTransaction = false;
    this.currentTransactionId = null;
    
    // Reset mock options to defaults
    this.mockOptions = {
      simulateSuccess: true,
      simulateConnectionError: false,
      simulateQueryError: false,
      simulateTransactionError: false,
      simulateDelay: 0,
      mockResponses: {},
      journeyOptions: {},
    };
    
    // Register default mock operation handlers
    this.registerDefaultMockOperationHandlers();
    
    return this;
  }
  
  /**
   * Generates mock data for testing.
   * 
   * @param type - The type of data to generate
   * @param overrides - Optional property overrides
   * @returns Generated mock data
   */
  protected generateMockData(type: string, overrides: Record<string, any> = {}): any {
    // Base mock entity with common properties
    const baseMockEntity = {
      id: overrides.id || `mock-id-${uuidv4()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Generate journey-specific mock data
    const journeyData = this.generateJourneySpecificMockData(type, overrides);
    
    // Merge base entity with journey-specific data and overrides
    return {
      ...baseMockEntity,
      ...journeyData,
      ...overrides,
    };
  }
  
  /**
   * Generates journey-specific mock data for testing.
   * This method should be overridden by journey-specific mock implementations.
   * 
   * @param type - The type of data to generate
   * @param overrides - Optional property overrides
   * @returns Generated journey-specific mock data
   */
  protected abstract generateJourneySpecificMockData(type: string, overrides?: Record<string, any>): any;
  
  /**
   * Executes a mock operation with error handling and history tracking.
   * 
   * @param operation - The operation name
   * @param params - The operation parameters
   * @param defaultHandler - The default handler for the operation
   * @returns The result of the operation
   */
  protected async executeMockOperation<T>(
    operation: string,
    params: any,
    defaultHandler: () => Promise<T>
  ): Promise<T> {
    const operationRecord = {
      operation,
      params,
      timestamp: new Date(),
      transactionId: this.currentTransactionId,
    };
    
    try {
      // Simulate delay
      await this.simulateDelay();
      
      // Simulate query error if configured
      if (this.mockOptions.simulateQueryError) {
        const error = this.mockOptions.customError || new Error(`Mock query error for ${operation}`);
        throw new QueryException(
          `Query failed for ${this.journeyType} journey: ${error.message}`,
          {
            cause: error,
            journeyType: this.journeyType,
            severity: DatabaseErrorSeverity.MAJOR,
            recoverability: DatabaseErrorRecoverability.TRANSIENT,
          }
        );
      }
      
      // Check if there's a custom handler for this operation
      if (this.mockOperationHandlers.has(operation)) {
        const handler = this.mockOperationHandlers.get(operation);
        const result = await handler();
        
        // Record the operation in history
        this.operationHistory.push({
          ...operationRecord,
          result,
        });
        
        // Record the operation in transaction history if in a transaction
        if (this.isInTransaction) {
          this.transactionOperations.push({ operation, params });
        }
        
        return result;
      }
      
      // Execute the default handler
      const result = await defaultHandler();
      
      // Record the operation in history
      this.operationHistory.push({
        ...operationRecord,
        result,
      });
      
      // Record the operation in transaction history if in a transaction
      if (this.isInTransaction) {
        this.transactionOperations.push({ operation, params });
      }
      
      return result;
    } catch (error) {
      // Record the operation error in history
      this.operationHistory.push({
        ...operationRecord,
        error: error as Error,
      });
      
      // Rethrow the error
      throw error;
    }
  }
  
  /**
   * Simulates a delay for mock operations.
   */
  protected async simulateDelay(): Promise<void> {
    const delay = this.mockOptions.simulateDelay || 0;
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  /**
   * Creates a mock transaction client for transaction testing.
   * 
   * @returns A mock PrismaClient for transactions
   */
  protected createMockTransactionClient(): PrismaClient {
    // Create a proxy object that simulates a PrismaClient
    return new Proxy({} as PrismaClient, {
      get: (target, prop) => {
        // For any property access, return a function that records the operation
        if (typeof prop === 'string' && prop !== 'then') {
          return (...args: any[]) => {
            const operation = `transaction.${String(prop)}`;
            const params = args;
            
            // Record the operation in transaction history
            this.transactionOperations.push({ operation, params });
            
            // Return a mock result based on the operation
            return this.generateMockData(String(prop));
          };
        }
        return undefined;
      },
    });
  }
  
  /**
   * Begins a mock transaction.
   */
  protected beginMockTransaction(): void {
    this.isInTransaction = true;
    this.currentTransactionId = `tx-${uuidv4()}`;
    this.transactionOperations = [];
    this.logger.debug(`Beginning mock transaction ${this.currentTransactionId}`);
  }
  
  /**
   * Commits a mock transaction.
   */
  protected commitMockTransaction(): void {
    this.logger.debug(`Committing mock transaction ${this.currentTransactionId} with ${this.transactionOperations.length} operations`);
    this.isInTransaction = false;
    this.currentTransactionId = null;
    this.transactionOperations = [];
  }
  
  /**
   * Rolls back a mock transaction.
   */
  protected rollbackMockTransaction(): void {
    this.logger.debug(`Rolling back mock transaction ${this.currentTransactionId}`);
    this.isInTransaction = false;
    this.currentTransactionId = null;
    this.transactionOperations = [];
  }
  
  /**
   * Begins a mock nested transaction.
   * 
   * @returns A savepoint ID for the nested transaction
   */
  protected beginMockNestedTransaction(): string {
    const savePointId = `sp-${uuidv4()}`;
    this.logger.debug(`Creating savepoint ${savePointId} in transaction ${this.currentTransactionId}`);
    return savePointId;
  }
  
  /**
   * Commits a mock nested transaction.
   * 
   * @param savePointId - The savepoint ID for the nested transaction
   */
  protected commitMockNestedTransaction(savePointId: string): void {
    this.logger.debug(`Releasing savepoint ${savePointId} in transaction ${this.currentTransactionId}`);
  }
  
  /**
   * Rolls back a mock nested transaction.
   */
  protected rollbackMockNestedTransaction(): void {
    this.logger.debug(`Rolling back to savepoint in transaction ${this.currentTransactionId}`);
  }
  
  /**
   * Registers default mock operation handlers.
   */
  protected registerDefaultMockOperationHandlers(): void {
    // Default implementation registers no handlers
    // Journey-specific mock implementations should override this method
  }
}

/**
 * Factory for creating journey-specific mock contexts.
 */
export class MockJourneyContextFactory {
  /**
   * Creates a mock context for the specified journey type.
   * 
   * @param journeyType - The journey type
   * @param configService - NestJS ConfigService
   * @param options - Database context options
   * @param mockOptions - Mock options
   * @returns A journey-specific mock context
   */
  static createMockContext(
    journeyType: JourneyType,
    configService: ConfigService,
    options: DatabaseContextOptions = {},
    mockOptions: MockJourneyContextOptions = {}
  ): BaseMockJourneyContext {
    switch (journeyType) {
      case JourneyType.HEALTH:
        return new HealthMockJourneyContext(configService, options, mockOptions);
      case JourneyType.CARE:
        return new CareMockJourneyContext(configService, options, mockOptions);
      case JourneyType.PLAN:
        return new PlanMockJourneyContext(configService, options, mockOptions);
      default:
        throw new Error(`Unsupported journey type: ${journeyType}`);
    }
  }
}

/**
 * Mock implementation for the Health journey context.
 */
export class HealthMockJourneyContext extends BaseMockJourneyContext {
  protected getJourneyType(): JourneyType {
    return JourneyType.HEALTH;
  }
  
  protected generateJourneySpecificMockData(type: string, overrides: Record<string, any> = {}): any {
    switch (type) {
      case 'healthMetric':
        return {
          userId: overrides.userId || `user-${uuidv4()}`,
          metricType: overrides.metricType || 'HEART_RATE',
          value: overrides.value || 75,
          timestamp: overrides.timestamp || new Date(),
          metadata: overrides.metadata || {},
        };
      case 'healthGoal':
        return {
          userId: overrides.userId || `user-${uuidv4()}`,
          goalType: overrides.goalType || 'STEPS',
          targetValue: overrides.targetValue || 10000,
          currentValue: overrides.currentValue || 5000,
          startDate: overrides.startDate || new Date(),
          endDate: overrides.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: overrides.status || 'IN_PROGRESS',
        };
      case 'deviceConnection':
        return {
          userId: overrides.userId || `user-${uuidv4()}`,
          deviceType: overrides.deviceType || 'SMARTWATCH',
          deviceId: overrides.deviceId || `device-${uuidv4()}`,
          connectionData: overrides.connectionData || { token: `token-${uuidv4()}` },
          lastSyncDate: overrides.lastSyncDate || new Date(),
          status: overrides.status || 'CONNECTED',
        };
      case 'medicalEvent':
        return {
          userId: overrides.userId || `user-${uuidv4()}`,
          eventType: overrides.eventType || 'DOCTOR_VISIT',
          eventDate: overrides.eventDate || new Date(),
          provider: overrides.provider || { name: 'Dr. Smith', specialty: 'Cardiologist' },
          details: overrides.details || { diagnosis: 'Healthy', notes: 'Regular checkup' },
          attachmentIds: overrides.attachmentIds || [],
        };
      default:
        return {};
    }
  }
  
  protected registerDefaultMockOperationHandlers(): void {
    super.registerDefaultMockOperationHandlers();
    
    // Register Health journey-specific operation handlers
    this.setMockOperationHandler('storeHealthMetric', () => {
      return this.generateMockData('healthMetric');
    });
    
    this.setMockOperationHandler('queryHealthMetrics', () => {
      return Array.from({ length: 10 }, () => this.generateMockData('healthMetric'));
    });
    
    this.setMockOperationHandler('upsertHealthGoal', () => {
      return this.generateMockData('healthGoal');
    });
    
    this.setMockOperationHandler('trackGoalProgress', () => {
      return this.generateMockData('healthGoal', { currentValue: 7500 });
    });
    
    this.setMockOperationHandler('connectDevice', () => {
      return this.generateMockData('deviceConnection');
    });
    
    this.setMockOperationHandler('syncDeviceData', () => {
      return { syncedMetrics: 15, errors: [] };
    });
    
    this.setMockOperationHandler('storeMedicalEvent', () => {
      return this.generateMockData('medicalEvent');
    });
    
    this.setMockOperationHandler('generateHealthInsights', () => {
      return Array.from({ length: 3 }, () => ({
        id: `insight-${uuidv4()}`,
        userId: `user-${uuidv4()}`,
        insightType: 'TREND',
        title: 'Improving Heart Rate',
        description: 'Your resting heart rate has improved over the last 30 days.',
        data: { startValue: 80, currentValue: 72, improvement: '10%' },
        createdAt: new Date(),
      }));
    });
  }
}

/**
 * Mock implementation for the Care journey context.
 */
export class CareMockJourneyContext extends BaseMockJourneyContext {
  protected getJourneyType(): JourneyType {
    return JourneyType.CARE;
  }
  
  protected generateJourneySpecificMockData(type: string, overrides: Record<string, any> = {}): any {
    switch (type) {
      case 'appointment':
        return {
          userId: overrides.userId || `user-${uuidv4()}`,
          providerId: overrides.providerId || `provider-${uuidv4()}`,
          startTime: overrides.startTime || new Date(Date.now() + 24 * 60 * 60 * 1000),
          endTime: overrides.endTime || new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
          appointmentType: overrides.appointmentType || 'CONSULTATION',
          status: overrides.status || 'SCHEDULED',
          notes: overrides.notes || 'Regular checkup',
        };
      case 'provider':
        return {
          id: overrides.id || `provider-${uuidv4()}`,
          name: overrides.name || 'Dr. Jane Smith',
          specialtyId: overrides.specialtyId || `specialty-${uuidv4()}`,
          specialty: overrides.specialty || 'Cardiologist',
          location: overrides.location || { address: '123 Medical St', city: 'São Paulo', state: 'SP' },
          rating: overrides.rating || 4.8,
          availableDays: overrides.availableDays || ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
        };
      case 'medication':
        return {
          userId: overrides.userId || `user-${uuidv4()}`,
          name: overrides.name || 'Medication Name',
          dosage: overrides.dosage || '10mg',
          frequency: overrides.frequency || 'DAILY',
          startDate: overrides.startDate || new Date(),
          endDate: overrides.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          instructions: overrides.instructions || 'Take with food',
          status: overrides.status || 'ACTIVE',
        };
      case 'treatmentPlan':
        return {
          userId: overrides.userId || `user-${uuidv4()}`,
          providerId: overrides.providerId || `provider-${uuidv4()}`,
          diagnosis: overrides.diagnosis || { code: 'I10', description: 'Essential hypertension' },
          treatments: overrides.treatments || [
            { type: 'MEDICATION', details: { name: 'Medication A', dosage: '10mg', frequency: 'DAILY' } },
            { type: 'EXERCISE', details: { activity: 'Walking', duration: '30 minutes', frequency: 'DAILY' } },
          ],
          startDate: overrides.startDate || new Date(),
          endDate: overrides.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          status: overrides.status || 'ACTIVE',
        };
      case 'telemedicineSession':
        return {
          userId: overrides.userId || `user-${uuidv4()}`,
          providerId: overrides.providerId || `provider-${uuidv4()}`,
          scheduledTime: overrides.scheduledTime || new Date(Date.now() + 24 * 60 * 60 * 1000),
          sessionType: overrides.sessionType || 'VIDEO',
          status: overrides.status || 'SCHEDULED',
          sessionUrl: overrides.sessionUrl || `https://telemedicine.austa.com.br/session/${uuidv4()}`,
          metadata: overrides.metadata || {},
        };
      default:
        return {};
    }
  }
  
  protected registerDefaultMockOperationHandlers(): void {
    super.registerDefaultMockOperationHandlers();
    
    // Register Care journey-specific operation handlers
    this.setMockOperationHandler('findAvailableAppointmentSlots', () => {
      return Array.from({ length: 5 }, (_, index) => ({
        id: `slot-${uuidv4()}`,
        providerId: `provider-${uuidv4()}`,
        startTime: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
        isAvailable: true,
      }));
    });
    
    this.setMockOperationHandler('bookAppointment', () => {
      return this.generateMockData('appointment');
    });
    
    this.setMockOperationHandler('getMedicationAdherence', () => {
      return {
        userId: `user-${uuidv4()}`,
        period: { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() },
        overallAdherence: 0.85,
        medications: [
          { id: `medication-${uuidv4()}`, name: 'Medication A', adherence: 0.9 },
          { id: `medication-${uuidv4()}`, name: 'Medication B', adherence: 0.8 },
        ],
        missedDoses: 3,
        totalDoses: 60,
      };
    });
    
    this.setMockOperationHandler('recordMedicationIntake', () => {
      return {
        id: `intake-${uuidv4()}`,
        userId: `user-${uuidv4()}`,
        medicationId: `medication-${uuidv4()}`,
        intakeTime: new Date(),
        dosage: 1,
        notes: '',
        createdAt: new Date(),
      };
    });
    
    this.setMockOperationHandler('findProviders', () => {
      return Array.from({ length: 3 }, () => this.generateMockData('provider'));
    });
    
    this.setMockOperationHandler('upsertTreatmentPlan', () => {
      return this.generateMockData('treatmentPlan');
    });
    
    this.setMockOperationHandler('trackTreatmentProgress', () => {
      return {
        id: `progress-${uuidv4()}`,
        treatmentPlanId: `treatment-${uuidv4()}`,
        progressData: { adherence: 0.9, notes: 'Feeling better' },
        recordedAt: new Date(),
        createdAt: new Date(),
      };
    });
    
    this.setMockOperationHandler('createTelemedicineSession', () => {
      return this.generateMockData('telemedicineSession');
    });
    
    this.setMockOperationHandler('updateTelemedicineSessionStatus', () => {
      return this.generateMockData('telemedicineSession', { status: 'COMPLETED' });
    });
    
    this.setMockOperationHandler('processSymptomCheckerInput', () => {
      return {
        id: `symptom-check-${uuidv4()}`,
        userId: `user-${uuidv4()}`,
        timestamp: new Date(),
        symptoms: ['headache', 'fever'],
        possibleConditions: [
          { name: 'Common Cold', probability: 0.7, urgency: 'LOW' },
          { name: 'Influenza', probability: 0.3, urgency: 'MEDIUM' },
        ],
        recommendedAction: 'REST_AND_HYDRATE',
        shouldSeekMedicalAttention: false,
      };
    });
  }
}

/**
 * Mock implementation for the Plan journey context.
 */
export class PlanMockJourneyContext extends BaseMockJourneyContext {
  protected getJourneyType(): JourneyType {
    return JourneyType.PLAN;
  }
  
  protected generateJourneySpecificMockData(type: string, overrides: Record<string, any> = {}): any {
    switch (type) {
      case 'plan':
        return {
          userId: overrides.userId || `user-${uuidv4()}`,
          planId: overrides.planId || `plan-${uuidv4()}`,
          planType: overrides.planType || 'PREMIUM',
          planName: overrides.planName || 'Plano Premium',
          coverageStart: overrides.coverageStart || new Date(),
          coverageEnd: overrides.coverageEnd || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: overrides.status || 'ACTIVE',
          monthlyPremium: overrides.monthlyPremium || 500.0,
          dependents: overrides.dependents || [],
        };
      case 'claim':
        return {
          userId: overrides.userId || `user-${uuidv4()}`,
          claimId: overrides.claimId || `claim-${uuidv4()}`,
          claimType: overrides.claimType || 'MEDICAL',
          serviceDate: overrides.serviceDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          providerName: overrides.providerName || 'Hospital São Paulo',
          amount: overrides.amount || 350.0,
          status: overrides.status || 'SUBMITTED',
          submissionDate: overrides.submissionDate || new Date(),
          documentIds: overrides.documentIds || [`document-${uuidv4()}`],
        };
      case 'benefit':
        return {
          planId: overrides.planId || `plan-${uuidv4()}`,
          benefitId: overrides.benefitId || `benefit-${uuidv4()}`,
          benefitType: overrides.benefitType || 'MEDICAL',
          name: overrides.name || 'Consultas Médicas',
          description: overrides.description || 'Cobertura para consultas médicas',
          coverage: overrides.coverage || { type: 'PERCENTAGE', value: 80 },
          limits: overrides.limits || { type: 'ANNUAL', value: 12 },
          used: overrides.used || 3,
          remaining: overrides.remaining || 9,
        };
      case 'document':
        return {
          userId: overrides.userId || `user-${uuidv4()}`,
          documentId: overrides.documentId || `document-${uuidv4()}`,
          documentType: overrides.documentType || 'RECEIPT',
          filename: overrides.filename || 'receipt.pdf',
          contentType: overrides.contentType || 'application/pdf',
          size: overrides.size || 1024 * 1024,
          uploadDate: overrides.uploadDate || new Date(),
          metadata: overrides.metadata || { relatedEntityType: 'CLAIM', relatedEntityId: `claim-${uuidv4()}` },
        };
      default:
        return {};
    }
  }
  
  protected registerDefaultMockOperationHandlers(): void {
    super.registerDefaultMockOperationHandlers();
    
    // Register Plan journey-specific operation handlers
    this.setMockOperationHandler('getUserPlanDetails', () => {
      return this.generateMockData('plan');
    });
    
    this.setMockOperationHandler('submitClaim', () => {
      return this.generateMockData('claim');
    });
    
    this.setMockOperationHandler('getBenefitUtilization', () => {
      return {
        userId: `user-${uuidv4()}`,
        planId: `plan-${uuidv4()}`,
        year: new Date().getFullYear(),
        benefits: Array.from({ length: 3 }, () => this.generateMockData('benefit')),
        overallUtilization: 0.35,
      };
    });
    
    this.setMockOperationHandler('comparePlans', () => {
      return {
        plans: Array.from({ length: 2 }, (_, index) => this.generateMockData('plan', {
          planType: index === 0 ? 'STANDARD' : 'PREMIUM',
          planName: index === 0 ? 'Plano Standard' : 'Plano Premium',
          monthlyPremium: index === 0 ? 300.0 : 500.0,
        })),
        comparisonPoints: [
          { feature: 'Consultas', values: ['8 por ano', '12 por ano'] },
          { feature: 'Cobertura Hospitalar', values: ['80%', '100%'] },
          { feature: 'Rede Credenciada', values: ['Regional', 'Nacional'] },
        ],
        recommendedPlan: 'PREMIUM',
      };
    });
    
    this.setMockOperationHandler('enrollInPlan', () => {
      return this.generateMockData('plan');
    });
    
    this.setMockOperationHandler('storeDocument', () => {
      return this.generateMockData('document');
    });
    
    this.setMockOperationHandler('retrieveDocument', () => {
      return {
        data: Buffer.from('mock document content'),
        metadata: {
          documentId: `document-${uuidv4()}`,
          documentType: 'RECEIPT',
          filename: 'receipt.pdf',
          contentType: 'application/pdf',
          size: 1024 * 1024,
          uploadDate: new Date(),
          relatedEntityType: 'CLAIM',
          relatedEntityId: `claim-${uuidv4()}`,
        },
      };
    });
    
    this.setMockOperationHandler('checkCoverage', () => {
      return {
        userId: `user-${uuidv4()}`,
        serviceCode: 'CONSULT_GP',
        isCovered: true,
        coverage: { type: 'PERCENTAGE', value: 80 },
        estimatedOutOfPocket: 50.0,
        inNetwork: true,
        requiresPreAuthorization: false,
        remainingBenefits: 8,
      };
    });
    
    this.setMockOperationHandler('trackClaimStatus', () => {
      return {
        status: 'PROCESSING',
        history: [
          { status: 'SUBMITTED', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
          { status: 'RECEIVED', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
          { status: 'PROCESSING', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        ],
        details: {
          claimId: `claim-${uuidv4()}`,
          expectedCompletionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          assignedTo: 'Equipe de Análise',
          notes: 'Em análise pela equipe técnica',
        },
      };
    });
    
    this.setMockOperationHandler('calculateOutOfPocketExpenses', () => {
      return {
        total: 1250.0,
        byCategory: {
          'MEDICAL': 800.0,
          'PHARMACY': 300.0,
          'LABORATORY': 150.0,
        },
        remaining: 3750.0,
      };
    });
  }
}
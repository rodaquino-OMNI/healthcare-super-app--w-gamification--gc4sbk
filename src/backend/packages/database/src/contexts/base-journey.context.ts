/**
 * @file base-journey.context.ts
 * @description Abstract base class that provides common database context functionality for all
 * journey-specific contexts, including transaction management, error handling, and connection
 * optimization. It serves as the foundation for all journey-specific database operations and
 * implements shared patterns that are consistent across journeys.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../prisma.service';
import { ConnectionManager } from '../connection/connection-manager';
import { ErrorTransformer } from '../errors/error-transformer';
import { RetryStrategyFactory } from '../errors/retry-strategies';
import { DatabaseException, TransactionException } from '../errors/database-error.exception';
import { DatabaseErrorType, DatabaseErrorSeverity } from '../errors/database-error.types';
import { MiddlewareFactory } from '../middleware/middleware.factory';
import { MiddlewareRegistry } from '../middleware/middleware.registry';
import { LoggingMiddleware } from '../middleware/logging.middleware';
import { PerformanceMiddleware } from '../middleware/performance.middleware';
import { TransformationMiddleware } from '../middleware/transformation.middleware';
import { CircuitBreakerMiddleware } from '../middleware/circuit-breaker.middleware';
import { DatabaseMiddleware, MiddlewareContext, JourneyContext, DatabaseOperationType } from '../middleware/middleware.interface';
import { TransactionManager, TransactionOptions, TransactionCallback, TransactionIsolationLevel } from '../transactions/transaction.interface';
import { TransactionService } from '../transactions/transaction.service';
import { JourneyId, JourneyMetadata, JourneyContextConfig, JourneyDatabaseOperations } from '../types/journey.types';
import { DatabaseContext, DatabaseHealthStatus, DatabaseContextOptions } from '../types/context.types';

/**
 * Abstract base class that provides common database context functionality for all
 * journey-specific contexts. This class implements shared patterns for transaction
 * management, error handling, connection optimization, and standardized database access.
 * 
 * Journey-specific contexts should extend this class and implement the abstract methods
 * to provide journey-specific functionality.
 */
@Injectable()
export abstract class BaseJourneyContext implements JourneyDatabaseOperations, DatabaseContext {
  protected readonly logger: Logger;
  protected readonly journeyId: JourneyId;
  protected readonly journeyMetadata: JourneyMetadata;
  protected readonly config: JourneyContextConfig;
  protected readonly middlewareRegistry: MiddlewareRegistry;
  protected readonly middlewareFactory: MiddlewareFactory;
  protected readonly transactionService: TransactionService;
  protected readonly connectionManager: ConnectionManager;
  protected readonly errorTransformer: ErrorTransformer;
  protected readonly retryStrategyFactory: RetryStrategyFactory;

  /**
   * Creates a new instance of BaseJourneyContext.
   * 
   * @param prismaService The PrismaService instance for database access
   * @param journeyId The ID of the journey this context is for
   * @param config Configuration options for the journey context
   */
  constructor(
    protected readonly prismaService: PrismaService,
    journeyId: JourneyId,
    config?: Partial<JourneyContextConfig>,
  ) {
    this.journeyId = journeyId;
    this.journeyMetadata = this.buildJourneyMetadata(journeyId);
    this.logger = new Logger(`${this.journeyMetadata.name}JourneyContext`);
    
    // Initialize configuration with defaults and provided config
    this.config = this.initializeConfig(journeyId, config);
    
    // Initialize supporting services
    this.middlewareRegistry = new MiddlewareRegistry();
    this.middlewareFactory = new MiddlewareFactory(this.middlewareRegistry);
    this.transactionService = new TransactionService(prismaService);
    this.connectionManager = new ConnectionManager(this.buildConnectionConfig());
    this.errorTransformer = new ErrorTransformer();
    this.retryStrategyFactory = new RetryStrategyFactory({
      baseDelayMs: this.config.maxRetryAttempts || 100,
      maxDelayMs: 5000,
      maxAttempts: this.config.maxRetryAttempts || 3,
      jitterFactor: 0.1,
    });
    
    // Register journey-specific middleware
    this.registerMiddleware();
    
    this.logger.log(`Initialized ${this.journeyMetadata.name} journey context`);
  }

  /**
   * Initializes the database context.
   * Sets up connections and prepares the context for use.
   */
  async initialize(): Promise<void> {
    try {
      this.logger.log(`Initializing ${this.journeyMetadata.name} journey context...`);
      await this.connectionManager.initialize(this.prismaService);
      this.logger.log(`${this.journeyMetadata.name} journey context initialized successfully`);
    } catch (error) {
      const transformedError = this.errorTransformer.transformConnectionError(
        error,
        `Failed to initialize ${this.journeyMetadata.name} journey context`,
      );
      this.logger.error(`Failed to initialize journey context: ${transformedError.message}`, transformedError);
      throw transformedError;
    }
  }

  /**
   * Disposes of the database context.
   * Cleans up resources and connections.
   */
  async dispose(): Promise<void> {
    try {
      this.logger.log(`Disposing ${this.journeyMetadata.name} journey context...`);
      await this.connectionManager.shutdown();
      this.logger.log(`${this.journeyMetadata.name} journey context disposed successfully`);
    } catch (error) {
      const transformedError = this.errorTransformer.transformConnectionError(
        error,
        `Failed to dispose ${this.journeyMetadata.name} journey context`,
      );
      this.logger.error(`Failed to dispose journey context: ${transformedError.message}`, transformedError);
      // Don't throw here to avoid issues during application shutdown
    }
  }

  /**
   * Gets the journey ID associated with this context.
   * 
   * @returns The journey ID
   */
  getJourneyId(): JourneyId {
    return this.journeyId;
  }

  /**
   * Gets the journey metadata associated with this context.
   * 
   * @returns The journey metadata
   */
  getJourneyMetadata(): JourneyMetadata {
    return this.journeyMetadata;
  }

  /**
   * Gets the configuration for this journey context.
   * 
   * @returns The journey context configuration
   */
  getConfig(): JourneyContextConfig {
    return this.config;
  }

  /**
   * Gets the database client used by this context.
   * 
   * @returns The PrismaClient instance
   */
  getClient(): PrismaClient {
    return this.prismaService;
  }

  /**
   * Checks if an entity belongs to this journey.
   * 
   * @param entityId ID of the entity to check
   * @param entityType Type of the entity to check
   * @returns A promise that resolves to true if the entity belongs to this journey, false otherwise
   */
  async belongsToJourney(entityId: string, entityType: string): Promise<boolean> {
    try {
      // This is a base implementation that should be overridden by journey-specific contexts
      // with more specific logic for checking entity ownership
      return await this.executeWithMiddleware(
        'belongsToJourney',
        async () => {
          // Default implementation checks if the entity has a journeyId field that matches this journey
          const result = await this.executeRaw(
            `SELECT COUNT(*) as count FROM "${entityType}" WHERE id = $1 AND "journeyId" = $2`,
            [entityId, this.journeyId]
          );
          
          return result[0]?.count > 0;
        },
        {
          operationType: DatabaseOperationType.QUERY,
          journeyContext: this.mapJourneyIdToContext(),
          model: entityType,
          operation: 'belongsToJourney',
          args: { entityId, entityType },
        }
      );
    } catch (error) {
      this.logger.error(
        `Failed to check if entity belongs to journey: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Executes a raw query against the database.
   * 
   * @param query The raw query to execute
   * @param params The parameters for the query
   * @returns A promise that resolves to the query result
   */
  async executeRaw<T = any>(query: string, params?: any[]): Promise<T> {
    return this.executeWithMiddleware(
      'executeRaw',
      async () => {
        return await this.prismaService.$queryRawUnsafe<T>(query, ...(params || []));
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
   * Executes a database operation with middleware processing.
   * This method applies all registered middleware to the operation,
   * providing consistent handling for logging, performance tracking,
   * error handling, and other cross-cutting concerns.
   * 
   * @param operationName A descriptive name for the operation
   * @param operation The operation function to execute
   * @param context Additional context for middleware processing
   * @returns A promise that resolves to the operation result
   */
  async executeWithMiddleware<T = any>(
    operationName: string,
    operation: () => Promise<T>,
    context?: Partial<MiddlewareContext>
  ): Promise<T> {
    // Create a complete context object with defaults
    const fullContext: MiddlewareContext = {
      operationId: uuidv4(),
      operation: operationName,
      operationType: DatabaseOperationType.QUERY,
      journeyContext: this.mapJourneyIdToContext(),
      args: {},
      startTime: Date.now(),
      ...context,
    };

    // Create middleware chain for this operation
    const middlewareChain = this.middlewareFactory.createMiddlewareChain(fullContext);

    try {
      // Apply before middleware
      await middlewareChain.executeBeforeHooks();
      
      // Execute the operation
      const result = await this.executeWithRetry(operationName, operation);
      
      // Apply after middleware with success
      fullContext.endTime = Date.now();
      fullContext.duration = fullContext.endTime - fullContext.startTime;
      fullContext.result = result;
      
      await middlewareChain.executeAfterHooks(null, result);
      
      return result;
    } catch (error) {
      // Transform the error for consistent handling
      const transformedError = this.errorTransformer.transformQueryError(
        error,
        `Error executing operation: ${operationName}`,
      );
      
      // Apply after middleware with error
      fullContext.endTime = Date.now();
      fullContext.duration = fullContext.endTime - fullContext.startTime;
      fullContext.error = transformedError;
      
      await middlewareChain.executeAfterHooks(transformedError, null);
      
      throw transformedError;
    }
  }

  /**
   * Executes a database operation with retry logic for transient errors.
   * 
   * @param operationName A descriptive name for the operation
   * @param operation The operation function to execute
   * @returns A promise that resolves to the operation result
   */
  protected async executeWithRetry<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    let attempts = 0;
    const maxAttempts = this.config.maxRetryAttempts || 3;
    let lastError: Error | null = null;

    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Transform the error for consistent handling
        const transformedError = this.errorTransformer.transformQueryError(
          error,
          `Error executing operation: ${operationName} (attempt ${attempts}/${maxAttempts})`,
        );
        
        // Determine if we should retry based on the error type
        const retryableErrorTypes = this.config.retryableErrorTypes || [
          DatabaseErrorType.CONNECTION,
          DatabaseErrorType.TRANSACTION,
        ];
        
        const shouldRetry = retryableErrorTypes.includes(transformedError.errorType) && 
                           attempts < maxAttempts;
        
        if (shouldRetry) {
          const retryStrategy = this.retryStrategyFactory.createStrategy({
            errorType: transformedError.errorType,
            severity: transformedError.severity || DatabaseErrorSeverity.MAJOR,
            attempt: attempts,
          });
          
          const delayMs = retryStrategy.getNextDelayMs();
          
          this.logger.warn(
            `Operation '${operationName}' failed (attempt ${attempts}/${maxAttempts}). ` +
            `Retrying in ${delayMs}ms...`,
            transformedError,
          );
          
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else {
          this.logger.error(
            `Operation '${operationName}' failed after ${attempts} attempts.`,
            transformedError,
          );
          
          throw transformedError;
        }
      }
    }

    // This should never happen due to the throw in the catch block,
    // but TypeScript requires a return statement
    throw new DatabaseException(
      'Maximum operation attempts exceeded',
      {
        operationName,
        attempts,
        originalError: lastError,
      },
    );
  }

  /**
   * Executes a function within a transaction.
   * Automatically handles transaction creation, commit, and rollback.
   * 
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
        try {
          // Set default isolation level if not provided
          const isolationLevel = options?.isolationLevel || TransactionIsolationLevel.READ_COMMITTED;
          
          // Execute the transaction
          const result = await this.transactionService.executeTransaction(callback, {
            isolationLevel,
            timeout: options?.timeout || this.config.transactionTimeout || 30000,
            retry: options?.retry,
            journeyContext: {
              journeyType: this.mapJourneyIdToJourneyType(),
              userId: options?.journeyContext?.userId,
              sessionId: options?.journeyContext?.sessionId,
            },
            ...options,
          });
          
          return result;
        } catch (error) {
          // Transform the error for consistent handling
          // Note: transformTransactionError method should be implemented in ErrorTransformer class
          // For now, we'll use transformQueryError as a fallback
          const transformError = this.errorTransformer.transformTransactionError || 
                               this.errorTransformer.transformQueryError;
          
          const transformedError = transformError.call(
            this.errorTransformer,
            error,
            `Error executing transaction: ${transactionName}`,
          );
          
          this.logger.error(
            `Transaction '${transactionName}' failed: ${transformedError.message}`,
            transformedError,
          );
          
          throw transformedError;
        }
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
   * Checks the health of the database connection.
   * 
   * @returns A promise that resolves to a health status object
   */
  async checkHealth(): Promise<DatabaseHealthStatus> {
    try {
      const startTime = Date.now();
      
      // Execute a simple query to verify connection
      await this.executeRaw('SELECT 1 as health_check');
      
      const responseTimeMs = Date.now() - startTime;
      const poolStats = await this.connectionManager.getPoolStats();
      
      return {
        isAvailable: true,
        status: 'up',
        responseTimeMs,
        lastSuccessfulConnection: new Date(),
        connectionPool: {
          active: poolStats.active,
          idle: poolStats.idle,
          total: poolStats.total,
          max: poolStats.max,
        },
        metadata: {
          journeyId: this.journeyId,
          journeyName: this.journeyMetadata.name,
        },
      };
    } catch (error) {
      const transformedError = this.errorTransformer.transformConnectionError(
        error,
        `Health check failed for ${this.journeyMetadata.name} journey context`,
      );
      
      return {
        isAvailable: false,
        status: 'down',
        error: {
          message: transformedError.message,
          code: transformedError.code,
          type: transformedError.errorType,
        },
        metadata: {
          journeyId: this.journeyId,
          journeyName: this.journeyMetadata.name,
        },
      };
    }
  }

  /**
   * Registers middleware for this journey context.
   * Journey-specific contexts can override this method to register
   * additional middleware specific to their journey.
   */
  protected registerMiddleware(): void {
    // Always register transformation middleware
    this.middlewareRegistry.register(
      new TransformationMiddleware(),
    );
    
    // Conditionally register other middleware based on configuration
    if (this.config.enableLogging !== false) {
      this.middlewareRegistry.register(
        new LoggingMiddleware(this.logger),
      );
    }
    
    // Register performance tracking middleware
    this.middlewareRegistry.register(
      new PerformanceMiddleware(),
    );
    
    // Register circuit breaker middleware in production
    if (process.env.NODE_ENV === 'production' && this.config.enableCircuitBreaker !== false) {
      this.middlewareRegistry.register(
        new CircuitBreakerMiddleware(),
      );
    }
  }

  /**
   * Initializes the configuration for this journey context.
   * Combines default values with provided configuration.
   * 
   * @param journeyId The journey ID
   * @param config Partial configuration provided by the consumer
   * @returns Complete journey context configuration
   */
  protected initializeConfig(journeyId: JourneyId, config?: Partial<JourneyContextConfig>): JourneyContextConfig {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Default configuration values
    const defaultConfig: JourneyContextConfig = {
      journeyId,
      maxConnections: isProduction ? 10 : 5,
      enableLogging: !isProduction,
      transactionTimeout: 30000, // 30 seconds
      retryableErrorTypes: [
        DatabaseErrorType.CONNECTION,
        DatabaseErrorType.TRANSACTION,
      ],
      maxRetryAttempts: 3,
      enableCircuitBreaker: isProduction,
    };
    
    // Merge with provided configuration
    return {
      ...defaultConfig,
      ...config,
    };
  }

  /**
   * Builds the connection configuration for this journey context.
   * 
   * @returns Connection configuration
   */
  protected buildConnectionConfig(): any {
    return {
      poolMin: 1,
      poolMax: this.config.maxConnections || 10,
      poolIdle: 10000, // 10 seconds
      maxConnectionAttempts: 5,
      connectionTimeout: 30000, // 30 seconds
      queryTimeout: this.config.transactionTimeout || 30000,
      enableQueryLogging: this.config.enableLogging !== false,
      enablePerformanceTracking: true,
      enableCircuitBreaker: this.config.enableCircuitBreaker !== false,
      retryConfig: {
        baseDelayMs: 100,
        maxDelayMs: 5000,
        maxAttempts: this.config.maxRetryAttempts || 3,
        jitterFactor: 0.1,
      },
      healthCheckInterval: 60000, // 1 minute
    };
  }

  /**
   * Builds journey metadata based on the journey ID.
   * 
   * @param journeyId The journey ID
   * @returns Journey metadata
   */
  protected buildJourneyMetadata(journeyId: JourneyId): JourneyMetadata {
    // Define journey metadata constants
    // Note: In a real implementation, these should be imported from a shared constants file
    const JOURNEY_NAMES: Record<string, string> = {
      health: 'Minha Saúde',
      care: 'Cuidar-me Agora',
      plan: 'Meu Plano & Benefícios'
    };
    
    const JOURNEY_COLORS: Record<string, any> = {
      health: {
        primary: '#4CAF50',
        secondary: '#81C784',
        accent: '#2E7D32',
        background: '#E8F5E9'
      },
      care: {
        primary: '#2196F3',
        secondary: '#64B5F6',
        accent: '#1565C0',
        background: '#E3F2FD'
      },
      plan: {
        primary: '#9C27B0',
        secondary: '#BA68C8',
        accent: '#7B1FA2',
        background: '#F3E5F5'
      }
    };
    
    const JOURNEY_ICONS: Record<string, string> = {
      health: 'heart',
      care: 'medical-bag',
      plan: 'account-card-details'
    };
    
    const JOURNEY_ROUTES: Record<string, string> = {
      health: '/health',
      care: '/care',
      plan: '/plan'
    };
    
    return {
      id: journeyId,
      name: JOURNEY_NAMES[journeyId] || `Unknown Journey (${journeyId})`,
      color: JOURNEY_COLORS[journeyId] || {
        primary: '#757575',
        secondary: '#BDBDBD',
        accent: '#424242',
        background: '#F5F5F5'
      },
      icon: JOURNEY_ICONS[journeyId] || 'help-circle',
      route: JOURNEY_ROUTES[journeyId] || '/'
    };
  }

  /**
   * Maps the journey ID to a JourneyContext enum value.
   * 
   * @returns The corresponding JourneyContext enum value
   */
  protected mapJourneyIdToContext(): JourneyContext {
    const journeyMap: Record<JourneyId, JourneyContext> = {
      health: JourneyContext.HEALTH,
      care: JourneyContext.CARE,
      plan: JourneyContext.PLAN,
    } as Record<JourneyId, JourneyContext>;
    
    return journeyMap[this.journeyId] || JourneyContext.SYSTEM;
  }

  /**
   * Maps the journey ID to a journey type string for transaction context.
   * 
   * @returns The journey type string
   */
  protected mapJourneyIdToJourneyType(): 'health' | 'care' | 'plan' {
    const journeyMap: Record<JourneyId, 'health' | 'care' | 'plan'> = {
      health: 'health',
      care: 'care',
      plan: 'plan',
    } as Record<JourneyId, 'health' | 'care' | 'plan'>;
    
    return journeyMap[this.journeyId] || 'health';
  }
}
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { ConnectionManager } from './connection/connection-manager';
import { ConnectionPool } from './connection/connection-pool';
import { ConnectionHealth } from './connection/connection-health';
import { ConnectionRetry } from './connection/connection-retry';
import { ErrorTransformer } from './errors/error-transformer';
import { DatabaseException } from './errors/database-error.exception';
import { DatabaseErrorType } from './errors/database-error.types';
import { MiddlewareRegistry } from './middleware/middleware.registry';
import { MiddlewareFactory } from './middleware/middleware.factory';
import { LoggingMiddleware } from './middleware/logging.middleware';
import { PerformanceMiddleware } from './middleware/performance.middleware';
import { CircuitBreakerMiddleware } from './middleware/circuit-breaker.middleware';
import { TransformationMiddleware } from './middleware/transformation.middleware';
import { JourneyType } from './types/journey.types';
import { TransactionService } from './transactions/transaction.service';
import { TransactionIsolationLevel } from './types/transaction.types';
import { RetryStrategy, ExponentialBackoffStrategy } from './errors/retry-strategies';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Configuration options for PrismaService
 */
export interface PrismaServiceOptions extends Prisma.PrismaClientOptions {
  /**
   * The journey type this service belongs to (Health, Care, Plan)
   * Used to provide journey-specific optimizations
   */
  journeyType?: JourneyType;

  /**
   * Connection pool configuration
   */
  connectionPool?: {
    /**
     * Minimum number of connections to keep in the pool
     * @default 2
     */
    minConnections?: number;

    /**
     * Maximum number of connections allowed in the pool
     * @default 10
     */
    maxConnections?: number;

    /**
     * Maximum number of idle connections to keep in the pool
     * @default 5
     */
    maxIdleConnections?: number;

    /**
     * Connection timeout in milliseconds
     * @default 5000
     */
    connectionTimeout?: number;
  };

  /**
   * Retry configuration for database operations
   */
  retry?: {
    /**
     * Maximum number of retry attempts
     * @default 3
     */
    maxRetries?: number;

    /**
     * Base delay between retries in milliseconds
     * @default 100
     */
    baseDelay?: number;

    /**
     * Maximum delay between retries in milliseconds
     * @default 5000
     */
    maxDelay?: number;

    /**
     * Whether to use jitter to prevent retry storms
     * @default true
     */
    useJitter?: boolean;
  };

  /**
   * Whether to enable query logging
   * @default true in development, false in production
   */
  enableLogging?: boolean;

  /**
   * Whether to enable performance tracking
   * @default true
   */
  enablePerformanceTracking?: boolean;

  /**
   * Whether to enable the circuit breaker pattern
   * @default true
   */
  enableCircuitBreaker?: boolean;

  /**
   * Whether to enable query transformation
   * @default true
   */
  enableTransformation?: boolean;

  /**
   * Whether to automatically apply database migrations on module init
   * @default false
   */
  autoApplyMigrations?: boolean;
}

/**
 * Default options for PrismaService
 */
const defaultOptions: PrismaServiceOptions = {
  enableLogging: process.env.NODE_ENV !== 'production',
  enablePerformanceTracking: true,
  enableCircuitBreaker: true,
  enableTransformation: true,
  autoApplyMigrations: false,
  connectionPool: {
    minConnections: 2,
    maxConnections: 10,
    maxIdleConnections: 5,
    connectionTimeout: 5000,
  },
  retry: {
    maxRetries: 3,
    baseDelay: 100,
    maxDelay: 5000,
    useJitter: true,
  },
  log: process.env.NODE_ENV !== 'production'
    ? ['query', 'info', 'warn', 'error']
    : ['warn', 'error'],
};

/**
 * Enhanced PrismaService that extends PrismaClient with connection pooling, error handling,
 * and lifecycle management. It provides optimized database connections for all microservices
 * with environment-aware logging, proper connection handling, and robust error management.
 *
 * Features:
 * - Connection pooling with configurable maximum connections
 * - Comprehensive error handling with typed exceptions
 * - Integration with NestJS lifecycle for proper connection management
 * - Support for query logging and performance tracking
 * - Middleware support for cross-cutting concerns
 * - Transaction management with isolation level support
 * - Journey-specific optimizations
 *
 * @example
 * // Basic usage in a NestJS module
 * @Module({
 *   providers: [PrismaService],
 * })
 * export class AppModule {}
 *
 * @example
 * // Usage in a service
 * @Injectable()
 * export class UserService {
 *   constructor(private prisma: PrismaService) {}
 *
 *   async getUsers() {
 *     return this.prisma.user.findMany();
 *   }
 * }
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly options: PrismaServiceOptions;
  private connectionManager?: ConnectionManager;
  private middlewareRegistry?: MiddlewareRegistry;
  private middlewareFactory?: MiddlewareFactory;
  private errorTransformer?: ErrorTransformer;
  private retryStrategy?: RetryStrategy;
  private isInitialized = false;
  private isShuttingDown = false;

  /**
   * Creates a new instance of PrismaService
   * @param options Configuration options for PrismaService
   */
  constructor(options: PrismaServiceOptions = {}) {
    // Merge default options with provided options
    const mergedOptions = { ...defaultOptions, ...options };
    super(mergedOptions);
    this.options = mergedOptions;

    // Initialize error transformer
    this.errorTransformer = new ErrorTransformer();

    // Initialize retry strategy
    this.retryStrategy = new ExponentialBackoffStrategy({
      maxRetries: this.options.retry?.maxRetries || 3,
      baseDelay: this.options.retry?.baseDelay || 100,
      maxDelay: this.options.retry?.maxDelay || 5000,
      useJitter: this.options.retry?.useJitter !== false,
    });

    // Register middleware
    this.registerMiddleware();
  }

  /**
   * Initializes the PrismaService when the application starts
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing PrismaService...');

    try {
      // Connect to the database
      await this.$connect();

      // Initialize connection manager if not already initialized
      if (!this.connectionManager) {
        this.connectionManager = new ConnectionManager({
          poolConfig: {
            minConnections: this.options.connectionPool?.minConnections || 2,
            maxConnections: this.options.connectionPool?.maxConnections || 10,
            maxIdleConnections: this.options.connectionPool?.maxIdleConnections || 5,
            connectionTimeout: this.options.connectionPool?.connectionTimeout || 5000,
          },
          retryConfig: {
            maxRetries: this.options.retry?.maxRetries || 3,
            baseDelay: this.options.retry?.baseDelay || 100,
            maxDelay: this.options.retry?.maxDelay || 5000,
            useJitter: this.options.retry?.useJitter !== false,
          },
        });

        await this.connectionManager.initialize();
      }

      // Apply migrations if configured
      if (this.options.autoApplyMigrations) {
        await this.applyMigrations();
      }

      this.isInitialized = true;
      this.logger.log('PrismaService initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize PrismaService', error);
      throw new DatabaseException(
        'Failed to initialize PrismaService',
        DatabaseErrorType.CONNECTION,
        { cause: error },
      );
    }
  }

  /**
   * Cleans up database resources when the application shuts down
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down PrismaService...');
    this.isShuttingDown = true;

    try {
      // Shutdown connection manager if initialized
      if (this.connectionManager) {
        await this.connectionManager.shutdown();
      }

      // Disconnect from the database
      await this.$disconnect();

      this.logger.log('PrismaService shut down successfully');
    } catch (error) {
      this.logger.error('Error during PrismaService shutdown', error);
    }
  }

  /**
   * Applies database migrations using Prisma Migrate
   * @returns A promise that resolves when migrations are applied
   */
  async applyMigrations(): Promise<void> {
    this.logger.log('Applying database migrations...');

    try {
      // Execute prisma migrate deploy command
      const { stdout, stderr } = await execAsync('npx prisma migrate deploy');
      
      if (stdout) {
        this.logger.log(`Migration output: ${stdout}`);
      }
      
      if (stderr) {
        this.logger.warn(`Migration warnings: ${stderr}`);
      }
      
      this.logger.log('Database migrations applied successfully');
    } catch (error) {
      this.logger.error('Failed to apply database migrations', error);
      throw new DatabaseException(
        'Failed to apply database migrations',
        DatabaseErrorType.CONFIGURATION,
        { cause: error },
      );
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
    // Set default options
    const isolationLevel = options?.isolationLevel || TransactionIsolationLevel.READ_COMMITTED;
    const timeout = options?.timeout || 5000;
    const maxRetries = options?.maxRetries || this.options.retry?.maxRetries || 3;
    
    // Create a transaction service if needed
    const txService = new TransactionService(this);
    
    try {
      // Start a transaction with the specified isolation level
      const tx = await txService.startTransaction({
        isolationLevel,
        timeout,
        maxRetries,
      });
      
      try {
        // Execute the function within the transaction
        const result = await fn(tx);
        
        // Commit the transaction
        await txService.commitTransaction(tx);
        
        return result;
      } catch (error) {
        // Rollback the transaction on error
        await txService.rollbackTransaction(tx);
        throw error;
      }
    } catch (error) {
      // Transform the error if needed
      if (this.errorTransformer) {
        throw this.errorTransformer.transformPrismaError(error);
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
    // Create a retry strategy if needed
    const retryStrategy = this.retryStrategy || new ExponentialBackoffStrategy({
      maxRetries: options?.maxRetries || this.options.retry?.maxRetries || 3,
      baseDelay: options?.baseDelay || this.options.retry?.baseDelay || 100,
      maxDelay: options?.maxDelay || this.options.retry?.maxDelay || 5000,
      useJitter: options?.useJitter !== undefined ? options.useJitter : this.options.retry?.useJitter !== false,
    });
    
    let attempt = 0;
    let lastError: any;
    
    while (attempt <= retryStrategy.maxRetries) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Check if the error is retryable
        const isRetryable = this.isRetryableError(error);
        
        if (!isRetryable || attempt >= retryStrategy.maxRetries) {
          // Transform the error if needed
          if (this.errorTransformer) {
            throw this.errorTransformer.transformPrismaError(error);
          }
          throw error;
        }
        
        // Calculate delay for the next retry
        const delay = retryStrategy.getDelay(attempt);
        
        this.logger.warn(
          `Database operation failed (attempt ${attempt + 1}/${retryStrategy.maxRetries + 1}). ` +
          `Retrying in ${delay}ms...`,
          error,
        );
        
        // Wait before the next retry
        await new Promise(resolve => setTimeout(resolve, delay));
        
        attempt++;
      }
    }
    
    // This should never happen, but TypeScript requires a return statement
    throw lastError;
  }

  /**
   * Checks if an error is retryable
   * @param error The error to check
   * @returns True if the error is retryable, false otherwise
   */
  private isRetryableError(error: any): boolean {
    // Check if the error is a Prisma error
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Connection errors (P1000, P1001, P1002)
      if (['P1000', 'P1001', 'P1002'].includes(error.code)) {
        return true;
      }
      
      // Timeout errors (P1008)
      if (error.code === 'P1008') {
        return true;
      }
      
      // Database server errors (P2000-P2999)
      if (error.code.startsWith('P2') && [
        // Connection errors
        'P2024', // Connection pool timeout
        'P2025', // Record not found (might be due to replication lag)
        'P2028', // Transaction API error
        'P2034', // Transaction timeout
      ].includes(error.code)) {
        return true;
      }
    }
    
    // Check if the error is a Prisma client initialization error
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return true;
    }
    
    // Check if the error is a Prisma client runtime error
    if (error instanceof Prisma.PrismaClientRustPanicError) {
      return true;
    }
    
    // Check if the error is a database connection error
    if (error instanceof DatabaseException && 
        error.type === DatabaseErrorType.CONNECTION) {
      return true;
    }
    
    // Check for specific error messages that indicate transient issues
    if (error.message && (
      error.message.includes('connection') ||
      error.message.includes('timeout') ||
      error.message.includes('deadlock') ||
      error.message.includes('serialization') ||
      error.message.includes('too many connections') ||
      error.message.includes('connection reset') ||
      error.message.includes('connection refused')
    )) {
      return true;
    }
    
    return false;
  }

  /**
   * Registers middleware for query interception
   */
  private registerMiddleware(): void {
    // Initialize middleware registry and factory
    this.middlewareRegistry = new MiddlewareRegistry(new ConfigService());
    this.middlewareFactory = new MiddlewareFactory(this.middlewareRegistry, new ConfigService());
    
    // Register middleware based on configuration
    if (this.options.enableLogging) {
      this.middlewareFactory.createLoggingMiddleware({
        id: 'prisma-logging-middleware',
        enabled: true,
        priority: 100, // High priority for logging
        journeyContexts: ['global'],
        environmentProfiles: ['development', 'test', 'production'],
        options: {
          logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
          includeParameters: process.env.NODE_ENV !== 'production',
          redactSensitiveData: process.env.NODE_ENV === 'production',
        },
      });
    }
    
    if (this.options.enablePerformanceTracking) {
      this.middlewareFactory.createPerformanceMiddleware({
        id: 'prisma-performance-middleware',
        enabled: true,
        priority: 90, // High priority but after logging
        journeyContexts: ['global'],
        environmentProfiles: ['development', 'test', 'production'],
        options: {
          slowQueryThreshold: 1000, // 1 second
          enableMetrics: true,
          trackStackTrace: process.env.NODE_ENV !== 'production',
        },
      });
    }
    
    if (this.options.enableCircuitBreaker) {
      this.middlewareFactory.createCircuitBreakerMiddleware({
        id: 'prisma-circuit-breaker-middleware',
        enabled: true,
        priority: 80, // Medium-high priority
        journeyContexts: ['global'],
        environmentProfiles: ['development', 'test', 'production'],
        options: {
          failureThreshold: 5,
          resetTimeout: 30000, // 30 seconds
          halfOpenMaxCalls: 3,
        },
      });
    }
    
    if (this.options.enableTransformation) {
      this.middlewareFactory.createTransformationMiddleware({
        id: 'prisma-transformation-middleware',
        enabled: true,
        priority: 70, // Medium priority
        journeyContexts: ['global'],
        environmentProfiles: ['development', 'test', 'production'],
      });
    }
    
    // If a journey type is specified, create journey-specific middleware
    if (this.options.journeyType) {
      const journeyContext = this.getJourneyContextFromType(this.options.journeyType);
      if (journeyContext) {
        this.middlewareFactory.createStandardMiddlewareChain(journeyContext);
      }
    }
    
    // Register middleware with Prisma
    this.$use(async (params, next) => {
      // Skip middleware if shutting down
      if (this.isShuttingDown) {
        return next(params);
      }
      
      // Determine the journey context from the model name or the service's journey type
      const journeyContext = this.getJourneyContextFromParams(params) || 
        this.getJourneyContextFromType(this.options.journeyType) || 
        'global';
      
      // Create middleware context
      const context = {
        operationType: params.action,
        entityName: params.model,
        journeyContext,
        metadata: {
          startTime: Date.now(),
          params,
        },
      };
      
      // Execute the operation with middleware
      try {
        if (this.middlewareRegistry) {
          return await this.middlewareRegistry.executeWithMiddleware(
            journeyContext,
            params,
            context,
            async (modifiedParams) => {
              // Execute the query with potentially modified params
              return await next(modifiedParams);
            },
          );
        } else {
          // If no middleware registry, just execute the query
          return await next(params);
        }
      } catch (error) {
        // Transform the error if needed
        if (this.errorTransformer) {
          throw this.errorTransformer.transformPrismaError(error);
        }
        throw error;
      }
    });
  }
  
  /**
   * Gets the journey context from the journey type
   * @param journeyType The journey type
   * @returns The journey context or undefined if not found
   */
  private getJourneyContextFromType(journeyType?: JourneyType): string | undefined {
    if (!journeyType) {
      return undefined;
    }
    
    switch (journeyType) {
      case JourneyType.HEALTH:
        return 'health';
      case JourneyType.CARE:
        return 'care';
      case JourneyType.PLAN:
        return 'plan';
      default:
        return 'global';
    }
  }
  
  /**
   * Gets the journey context from the Prisma params
   * @param params The Prisma params
   * @returns The journey context or undefined if not found
   */
  private getJourneyContextFromParams(params: any): string | undefined {
    // Determine the journey context from the model name
    if (!params.model) {
      return undefined;
    }
    
    // Health journey models
    const healthModels = [
      'HealthMetric',
      'HealthGoal',
      'DeviceConnection',
      'MedicalEvent',
    ];
    
    // Care journey models
    const careModels = [
      'Appointment',
      'Provider',
      'Medication',
      'Treatment',
      'TelemedicineSession',
    ];
    
    // Plan journey models
    const planModels = [
      'Plan',
      'Benefit',
      'Coverage',
      'Claim',
      'Document',
    ];
    
    if (healthModels.includes(params.model)) {
      return 'health';
    } else if (careModels.includes(params.model)) {
      return 'care';
    } else if (planModels.includes(params.model)) {
      return 'plan';
    }
    
    return undefined;
  }

  /**
   * Gets a connection from the connection pool
   * @returns A promise that resolves to a database connection
   */
  async getConnection(): Promise<any> {
    if (!this.connectionManager) {
      throw new DatabaseException(
        'Connection manager not initialized',
        DatabaseErrorType.CONNECTION,
      );
    }
    
    return this.connectionManager.getConnection();
  }

  /**
   * Releases a connection back to the pool
   * @param connection The connection to release
   */
  releaseConnection(connection: any): void {
    if (!this.connectionManager) {
      this.logger.warn('Connection manager not initialized, cannot release connection');
      return;
    }
    
    this.connectionManager.releaseConnection(connection);
  }

  /**
   * Checks the health of the database connection
   * @returns A promise that resolves to a health check result
   */
  async checkHealth(): Promise<{ healthy: boolean; details?: any }> {
    try {
      // Execute a simple query to check database connectivity
      await this.$queryRaw`SELECT 1`;
      
      // Check connection pool health if available
      if (this.connectionManager) {
        const connectionHealth = new ConnectionHealth();
        return await connectionHealth.checkHealth();
      }
      
      return { healthy: true };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      
      return {
        healthy: false,
        details: {
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      };
    }
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
    if (!this.connectionManager) {
      return {
        total: 0,
        active: 0,
        idle: 0,
        waiting: 0,
      };
    }
    
    const pool = this.connectionManager.getPool();
    
    if (!pool) {
      return {
        total: 0,
        active: 0,
        idle: 0,
        waiting: 0,
      };
    }
    
    return {
      total: pool.getTotalConnectionCount(),
      active: pool.getActiveConnectionCount(),
      idle: pool.getIdleConnectionCount(),
      waiting: pool.getWaitingRequestCount(),
    };
  }
}
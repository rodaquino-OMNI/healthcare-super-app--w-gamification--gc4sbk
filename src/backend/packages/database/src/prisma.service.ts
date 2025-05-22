import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { ConnectionManager } from './connection/connection-manager';
import { ConnectionConfig } from './connection/connection-config';
import { DatabaseErrorType, DatabaseErrorSeverity } from './errors/database-error.types';
import { DatabaseException, ConnectionException, QueryException } from './errors/database-error.exception';
import { ErrorTransformer } from './errors/error-transformer';
import { RetryStrategyFactory } from './errors/retry-strategies';
import { MiddlewareFactory } from './middleware/middleware.factory';
import { MiddlewareRegistry } from './middleware/middleware.registry';
import { LoggingMiddleware } from './middleware/logging.middleware';
import { PerformanceMiddleware } from './middleware/performance.middleware';
import { CircuitBreakerMiddleware } from './middleware/circuit-breaker.middleware';
import { TransformationMiddleware } from './middleware/transformation.middleware';

/**
 * Enhanced PrismaService that extends PrismaClient with connection pooling,
 * error handling, and lifecycle management.
 * 
 * This service provides optimized database connections for all microservices
 * with environment-aware logging, proper connection handling, and robust error management.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly connectionManager: ConnectionManager;
  private readonly errorTransformer: ErrorTransformer;
  private readonly retryStrategyFactory: RetryStrategyFactory;
  private readonly middlewareFactory: MiddlewareFactory;
  private readonly middlewareRegistry: MiddlewareRegistry;
  private isConnected = false;
  private connectionAttempts = 0;
  private readonly maxConnectionAttempts: number;
  private readonly enableQueryLogging: boolean;
  private readonly enablePerformanceTracking: boolean;
  private readonly enableCircuitBreaker: boolean;

  /**
   * Creates a new instance of PrismaService with enhanced capabilities.
   * 
   * @param configService NestJS ConfigService for retrieving configuration values
   */
  constructor(private readonly configService: ConfigService) {
    // Initialize PrismaClient with enhanced logging and error handling
    super({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'info', emit: 'event' },
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
      errorFormat: 'pretty',
    });

    // Load configuration from environment
    const connectionConfig = this.loadConnectionConfig();
    this.maxConnectionAttempts = connectionConfig.maxConnectionAttempts;
    this.enableQueryLogging = connectionConfig.enableQueryLogging;
    this.enablePerformanceTracking = connectionConfig.enablePerformanceTracking;
    this.enableCircuitBreaker = connectionConfig.enableCircuitBreaker;

    // Initialize supporting services
    this.connectionManager = new ConnectionManager(connectionConfig);
    this.errorTransformer = new ErrorTransformer();
    this.retryStrategyFactory = new RetryStrategyFactory(connectionConfig.retryConfig);
    this.middlewareRegistry = new MiddlewareRegistry();
    this.middlewareFactory = new MiddlewareFactory(this.middlewareRegistry);

    // Register middleware based on configuration
    this.registerMiddleware();

    // Set up event listeners for Prisma Client events
    this.setupEventListeners();
  }

  /**
   * Initializes the PrismaService when the module is initialized.
   * Establishes database connection with retry logic and connection pooling.
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing PrismaService...');
    await this.connect();
    this.logger.log('PrismaService initialized successfully');
  }

  /**
   * Cleans up resources when the module is destroyed.
   * Ensures proper disconnection from the database to prevent connection leaks.
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down PrismaService...');
    await this.disconnect();
    this.logger.log('PrismaService shut down successfully');
  }

  /**
   * Establishes connection to the database with retry logic.
   * Uses connection pooling for optimized performance.
   * 
   * @throws {ConnectionException} If connection fails after maximum attempts
   */
  private async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    this.connectionAttempts = 0;
    let lastError: Error | null = null;

    while (this.connectionAttempts < this.maxConnectionAttempts) {
      try {
        this.connectionAttempts++;
        this.logger.log(`Connecting to database (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})...`);
        
        // Use connection manager to get an optimized connection
        await this.connectionManager.initialize(this);
        
        // Verify connection with a simple query
        await this.$queryRaw`SELECT 1 as connection_test`;
        
        this.isConnected = true;
        this.logger.log('Successfully connected to database');
        return;
      } catch (error) {
        lastError = error;
        const retryStrategy = this.retryStrategyFactory.createStrategy({
          errorType: DatabaseErrorType.CONNECTION,
          severity: DatabaseErrorSeverity.CRITICAL,
          attempt: this.connectionAttempts,
        });

        if (this.connectionAttempts < this.maxConnectionAttempts) {
          const delayMs = retryStrategy.getNextDelayMs();
          this.logger.warn(
            `Database connection failed (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts}). ` +
            `Retrying in ${delayMs}ms...`,
            error,
          );
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    // If we've exhausted all connection attempts, throw a connection exception
    const transformedError = this.errorTransformer.transformConnectionError(
      lastError,
      'Failed to connect to database after maximum connection attempts',
    );
    
    this.logger.error(
      `Database connection failed after ${this.maxConnectionAttempts} attempts. Giving up.`,
      transformedError,
    );
    
    throw transformedError;
  }

  /**
   * Safely disconnects from the database, ensuring all queries are completed
   * and resources are properly released.
   */
  private async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.connectionManager.shutdown();
      await this.$disconnect();
      this.isConnected = false;
      this.logger.log('Successfully disconnected from database');
    } catch (error) {
      const transformedError = this.errorTransformer.transformConnectionError(
        error,
        'Error disconnecting from database',
      );
      this.logger.error('Failed to disconnect from database cleanly', transformedError);
    }
  }

  /**
   * Loads database connection configuration from environment variables
   * with sensible defaults for development and production environments.
   */
  private loadConnectionConfig(): ConnectionConfig {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const isProduction = nodeEnv === 'production';

    return {
      // Connection pool settings
      poolMin: this.configService.get<number>('DATABASE_POOL_MIN', isProduction ? 5 : 2),
      poolMax: this.configService.get<number>('DATABASE_POOL_MAX', isProduction ? 20 : 10),
      poolIdle: this.configService.get<number>('DATABASE_POOL_IDLE', isProduction ? 10000 : 5000),
      
      // Connection retry settings
      maxConnectionAttempts: this.configService.get<number>('DATABASE_MAX_CONNECTION_ATTEMPTS', 5),
      connectionTimeout: this.configService.get<number>('DATABASE_CONNECTION_TIMEOUT', 30000),
      
      // Query settings
      queryTimeout: this.configService.get<number>('DATABASE_QUERY_TIMEOUT', 30000),
      
      // Feature flags
      enableQueryLogging: this.configService.get<boolean>('DATABASE_ENABLE_QUERY_LOGGING', !isProduction),
      enablePerformanceTracking: this.configService.get<boolean>('DATABASE_ENABLE_PERFORMANCE_TRACKING', true),
      enableCircuitBreaker: this.configService.get<boolean>('DATABASE_ENABLE_CIRCUIT_BREAKER', isProduction),
      
      // Retry configuration
      retryConfig: {
        baseDelayMs: this.configService.get<number>('DATABASE_RETRY_BASE_DELAY', 100),
        maxDelayMs: this.configService.get<number>('DATABASE_RETRY_MAX_DELAY', 5000),
        maxAttempts: this.configService.get<number>('DATABASE_RETRY_MAX_ATTEMPTS', 3),
        jitterFactor: this.configService.get<number>('DATABASE_RETRY_JITTER_FACTOR', 0.1),
      },
      
      // Health check settings
      healthCheckInterval: this.configService.get<number>('DATABASE_HEALTH_CHECK_INTERVAL', 60000),
    };
  }

  /**
   * Registers middleware components based on configuration.
   * Middleware provides cross-cutting concerns like logging, performance tracking,
   * and circuit breaking for database operations.
   */
  private registerMiddleware(): void {
    // Always register transformation middleware for consistent query handling
    this.middlewareRegistry.register(
      new TransformationMiddleware(),
    );

    // Conditionally register other middleware based on configuration
    if (this.enableQueryLogging) {
      this.middlewareRegistry.register(
        new LoggingMiddleware(this.logger),
      );
    }

    if (this.enablePerformanceTracking) {
      this.middlewareRegistry.register(
        new PerformanceMiddleware(),
      );
    }

    if (this.enableCircuitBreaker) {
      this.middlewareRegistry.register(
        new CircuitBreakerMiddleware(),
      );
    }
  }

  /**
   * Sets up event listeners for Prisma Client events.
   * These listeners provide logging, performance tracking, and error handling
   * for database operations.
   */
  private setupEventListeners(): void {
    // Log queries in development mode
    if (this.enableQueryLogging) {
      this.$on('query', (event) => {
        this.logger.debug(`Query: ${event.query}`, {
          params: event.params,
          duration: event.duration,
        });
      });
    }

    // Log info events
    this.$on('info', (event) => {
      this.logger.log(`Prisma Info: ${event.message}`);
    });

    // Log warning events
    this.$on('warn', (event) => {
      this.logger.warn(`Prisma Warning: ${event.message}`);
    });

    // Log error events
    this.$on('error', (event) => {
      const transformedError = this.errorTransformer.transformQueryError(
        new Error(event.message),
        'Prisma encountered an error during query execution',
      );
      this.logger.error(`Prisma Error: ${event.message}`, transformedError);
    });
  }

  /**
   * Executes a database query with enhanced error handling, retry logic,
   * and middleware processing.
   * 
   * @param queryName A descriptive name for the query for logging and monitoring
   * @param queryFn The function that executes the actual database query
   * @returns The result of the query
   * @throws {DatabaseException} If the query fails after retries
   */
  async executeQuery<T>(queryName: string, queryFn: () => Promise<T>): Promise<T> {
    if (!this.isConnected) {
      await this.connect();
    }

    let attempts = 0;
    const maxAttempts = this.retryStrategyFactory.getDefaultStrategy().getMaxAttempts();
    let lastError: Error | null = null;

    // Create middleware chain for this query
    const middlewareChain = this.middlewareFactory.createMiddlewareChain({
      queryName,
      timestamp: Date.now(),
    });

    // Execute query with retry logic
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        // Apply before middleware
        await middlewareChain.executeBeforeHooks();
        
        // Execute the query
        const result = await queryFn();
        
        // Apply after middleware with success
        await middlewareChain.executeAfterHooks(null, result);
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Transform the error for consistent handling
        const transformedError = this.errorTransformer.transformQueryError(
          error,
          `Error executing query: ${queryName}`,
        );
        
        // Apply after middleware with error
        await middlewareChain.executeAfterHooks(transformedError, null);
        
        // Determine if we should retry based on the error type
        const retryStrategy = this.retryStrategyFactory.createStrategy({
          errorType: transformedError.errorType || DatabaseErrorType.QUERY,
          severity: transformedError.severity || DatabaseErrorSeverity.MAJOR,
          attempt: attempts,
        });
        
        // If the error is retryable and we haven't exceeded max attempts, retry
        if (retryStrategy.shouldRetry() && attempts < maxAttempts) {
          const delayMs = retryStrategy.getNextDelayMs();
          this.logger.warn(
            `Query '${queryName}' failed (attempt ${attempts}/${maxAttempts}). ` +
            `Retrying in ${delayMs}ms...`,
            transformedError,
          );
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else {
          // We've exhausted retries or the error is not retryable
          this.logger.error(
            `Query '${queryName}' failed after ${attempts} attempts.`,
            transformedError,
          );
          throw transformedError;
        }
      }
    }

    // This should never happen due to the throw in the catch block,
    // but TypeScript requires a return statement
    throw new QueryException(
      'Maximum query attempts exceeded',
      {
        queryName,
        attempts,
        originalError: lastError,
      },
    );
  }

  /**
   * Checks the health of the database connection.
   * Used by health check endpoints to verify database availability.
   * 
   * @returns An object containing the health status and connection details
   */
  async checkHealth(): Promise<{ status: 'up' | 'down', details: Record<string, any> }> {
    try {
      // Execute a simple query to verify connection
      const startTime = Date.now();
      await this.$queryRaw`SELECT 1 as health_check`;
      const duration = Date.now() - startTime;

      // Get connection pool statistics
      const poolStats = await this.connectionManager.getPoolStats();

      return {
        status: 'up',
        details: {
          responseTime: `${duration}ms`,
          connections: poolStats,
        },
      };
    } catch (error) {
      const transformedError = this.errorTransformer.transformConnectionError(
        error,
        'Health check failed',
      );

      return {
        status: 'down',
        details: {
          error: transformedError.message,
          code: transformedError.code,
          type: transformedError.errorType,
        },
      };
    }
  }
}
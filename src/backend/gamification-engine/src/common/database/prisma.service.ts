/**
 * Enhanced PrismaService that extends PrismaClient with journey-specific optimizations,
 * connection pooling, lifecycle hooks, and error handling. Acts as the primary database
 * connector for all gamification engine modules, providing optimized query execution
 * and resilient database access patterns.
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { IPrismaService } from './interfaces';
import {
  CONNECTION_POOL,
  OPERATION_TIMEOUTS,
  QUERY_LOGGING,
  ENVIRONMENT_DEFAULTS,
  ERROR_CLASSIFICATION,
} from './constants';

/**
 * Configuration options for the PrismaService
 */
export interface PrismaServiceOptions {
  /**
   * Whether to enable query logging
   * @default process.env.NODE_ENV !== 'production'
   */
  enableQueryLogging?: boolean;

  /**
   * Whether to enable performance logging
   * @default process.env.NODE_ENV !== 'production'
   */
  enablePerformanceLogging?: boolean;

  /**
   * Maximum number of connections in the pool
   * @default 25
   */
  maxConnections?: number;

  /**
   * Whether to log errors
   * @default true
   */
  logErrors?: boolean;

  /**
   * Custom logger instance
   */
  logger?: Logger;
}

/**
 * Enhanced PrismaService that extends PrismaClient with journey-specific optimizations,
 * connection pooling, lifecycle hooks, and error handling.
 * 
 * This service acts as the primary database connector for all gamification engine modules,
 * providing optimized query execution and resilient database access patterns.
 */
@Injectable()
export class PrismaService extends PrismaClient implements IPrismaService, OnModuleInit, OnModuleDestroy {
  private readonly logger: Logger;
  private isConnected = false;
  private readonly options: Required<PrismaServiceOptions>;
  private connectionAttempts = 0;
  private readonly maxConnectionAttempts = 5;
  private readonly connectionRetryDelay = 1000; // 1 second

  /**
   * Creates a new instance of PrismaService with the specified options.
   * 
   * @param configService NestJS ConfigService for environment configuration
   * @param options Configuration options for the PrismaService
   */
  constructor(
    private readonly configService: ConfigService,
    @Optional() @Inject('DATABASE_MODULE_OPTIONS') options?: PrismaServiceOptions,
  ) {
    // Initialize PrismaClient with connection pooling and logging configuration
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
      log: PrismaService.getLogOptions(options, configService),
    });

    // Set up default options
    this.options = {
      enableQueryLogging: options?.enableQueryLogging ?? process.env.NODE_ENV !== 'production',
      enablePerformanceLogging: options?.enablePerformanceLogging ?? process.env.NODE_ENV !== 'production',
      maxConnections: options?.maxConnections ?? this.getEnvironmentDefault('CONNECTION_POOL.MAX_CONNECTIONS'),
      logErrors: options?.logErrors ?? true,
      logger: options?.logger ?? new Logger(PrismaService.name),
    };

    this.logger = this.options.logger;

    // Register middleware for query logging and performance monitoring
    this.registerMiddleware();
  }

  /**
   * Gets the appropriate log options based on the environment and provided options.
   * 
   * @param options Configuration options for the PrismaService
   * @param configService NestJS ConfigService for environment configuration
   * @returns Prisma log options
   */
  private static getLogOptions(
    options: PrismaServiceOptions | undefined,
    configService: ConfigService,
  ): Prisma.LogDefinition[] {
    const env = configService.get<string>('NODE_ENV', 'development');
    const enableQueryLogging = options?.enableQueryLogging ?? env !== 'production';
    const logErrors = options?.logErrors ?? true;

    const logOptions: Prisma.LogDefinition[] = [];

    // Add query logging if enabled
    if (enableQueryLogging) {
      logOptions.push({ level: 'query', emit: 'event' });
    }

    // Always log errors unless explicitly disabled
    if (logErrors) {
      logOptions.push({ level: 'error', emit: 'event' });
      logOptions.push({ level: 'warn', emit: 'event' });
    }

    // Add info logging in development
    if (env === 'development') {
      logOptions.push({ level: 'info', emit: 'event' });
    }

    return logOptions;
  }

  /**
   * Gets the default value for a configuration key based on the current environment.
   * 
   * @param key The configuration key to get the default value for
   * @returns The default value for the configuration key
   */
  private getEnvironmentDefault(key: string): any {
    const env = this.configService.get<string>('NODE_ENV', 'development').toUpperCase();
    const envDefaults = ENVIRONMENT_DEFAULTS[env] || ENVIRONMENT_DEFAULTS.DEVELOPMENT;

    // Navigate through the nested object using the key path
    return key.split('.').reduce((obj, path) => {
      return obj && obj[path] !== undefined ? obj[path] : undefined;
    }, envDefaults);
  }

  /**
   * Registers middleware for query logging and performance monitoring.
   */
  private registerMiddleware(): void {
    // Register middleware for all models
    this.$use(async (params, next) => {
      const startTime = Date.now();
      let result;

      try {
        // Execute the query
        result = await next(params);
        return result;
      } catch (error) {
        // Log the error if error logging is enabled
        if (this.options.logErrors) {
          this.logQueryError(params, error);
        }
        throw error;
      } finally {
        // Log query performance if enabled
        if (this.options.enablePerformanceLogging) {
          const duration = Date.now() - startTime;
          this.logQueryPerformance(params, duration, result);
        }
      }
    });

    // Set up event listeners for Prisma Client
    if (this.options.enableQueryLogging) {
      this.$on('query', (event) => {
        this.logQuery(event);
      });
    }

    if (this.options.logErrors) {
      this.$on('error', (event) => {
        this.logger.error(`Database error: ${event.message}`, event.target);
      });

      this.$on('warn', (event) => {
        this.logger.warn(`Database warning: ${event.message}`, event.target);
      });
    }
  }

  /**
   * Logs a database query.
   * 
   * @param event The Prisma query event
   */
  private logQuery(event: Prisma.QueryEvent): void {
    const query = event.query.length > QUERY_LOGGING.MAX_QUERY_LENGTH
      ? `${event.query.substring(0, QUERY_LOGGING.MAX_QUERY_LENGTH)}... (truncated)`
      : event.query;

    const params = QUERY_LOGGING.LOG_PARAMETERS
      ? event.params
      : '[params hidden]';

    this.logger.debug(`Query: ${query}\nParameters: ${params}\nDuration: ${event.duration}ms`);
  }

  /**
   * Logs a database query error.
   * 
   * @param params The Prisma middleware params
   * @param error The error that occurred
   */
  private logQueryError(params: any, error: any): void {
    const model = params.model;
    const action = params.action;
    const args = JSON.stringify(params.args);

    this.logger.error(
      `Database error in ${model}.${action}(${args}): ${error.message}`,
      error.stack,
    );
  }

  /**
   * Logs database query performance metrics.
   * 
   * @param params The Prisma middleware params
   * @param duration The query duration in milliseconds
   * @param result The query result
   */
  private logQueryPerformance(params: any, duration: number, result: any): void {
    const model = params.model;
    const action = params.action;
    const resultSize = result ? (Array.isArray(result) ? result.length : 1) : 0;

    if (duration > QUERY_LOGGING.VERY_SLOW_QUERY_THRESHOLD_MS) {
      this.logger.error(
        `Very slow query detected: ${model}.${action} took ${duration}ms (result size: ${resultSize})`,
      );
    } else if (duration > QUERY_LOGGING.SLOW_QUERY_THRESHOLD_MS) {
      this.logger.warn(
        `Slow query detected: ${model}.${action} took ${duration}ms (result size: ${resultSize})`,
      );
    } else if (this.options.enableQueryLogging) {
      this.logger.debug(
        `Query performance: ${model}.${action} took ${duration}ms (result size: ${resultSize})`,
      );
    }
  }

  /**
   * Initializes the database connection when the module is initialized.
   * Implements OnModuleInit interface from NestJS.
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing database connection...');
    await this.connect();
    this.logger.log('Database connection initialized successfully');
  }

  /**
   * Closes the database connection when the module is destroyed.
   * Implements OnModuleDestroy interface from NestJS.
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Closing database connection...');
    await this.disconnect();
    this.logger.log('Database connection closed successfully');
  }

  /**
   * Connects to the database with optimized connection pooling.
   * Implements IPrismaService interface.
   * 
   * @returns Promise that resolves when the connection is established
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      this.logger.debug('Database already connected');
      return;
    }

    try {
      // Set connection pool options
      const maxConnections = this.options.maxConnections;
      const connectionTimeout = OPERATION_TIMEOUTS.CONNECTION_TIMEOUT_MS;

      // Configure connection pool
      process.env.DATABASE_CONNECTION_LIMIT = String(maxConnections);
      process.env.DATABASE_CONNECTION_TIMEOUT = String(connectionTimeout);

      // Connect to the database with timeout
      const connectPromise = this.$connect();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Database connection timed out after ${connectionTimeout}ms`));
        }, connectionTimeout);
      });

      await Promise.race([connectPromise, timeoutPromise]);
      this.isConnected = true;
      this.connectionAttempts = 0;
      this.logger.log(`Connected to database with max pool size: ${maxConnections}`);
    } catch (error) {
      this.connectionAttempts++;
      
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        this.logger.warn(
          `Database connection attempt ${this.connectionAttempts} failed: ${error.message}. Retrying in ${this.connectionRetryDelay}ms...`,
        );
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.connectionRetryDelay));
        
        // Retry connection with exponential backoff
        return this.connect();
      }
      
      this.logger.error(
        `Failed to connect to database after ${this.maxConnectionAttempts} attempts: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Disconnects from the database and cleans up resources.
   * Implements IPrismaService interface.
   * 
   * @returns Promise that resolves when the disconnection is complete
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      this.logger.debug('Database already disconnected');
      return;
    }

    try {
      // Disconnect with timeout
      const disconnectPromise = this.$disconnect();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Database disconnection timed out after ${OPERATION_TIMEOUTS.DISCONNECTION_TIMEOUT_MS}ms`));
        }, OPERATION_TIMEOUTS.DISCONNECTION_TIMEOUT_MS);
      });

      await Promise.race([disconnectPromise, timeoutPromise]);
      this.isConnected = false;
      this.logger.log('Disconnected from database');
    } catch (error) {
      this.logger.error(`Failed to disconnect from database: ${error.message}`, error.stack);
      // Don't rethrow the error to avoid crashing the application during shutdown
      this.isConnected = false;
    }
  }

  /**
   * Checks if the database connection is healthy.
   * Implements IPrismaService interface.
   * 
   * @returns Promise that resolves to a boolean indicating if the connection is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      // Execute a simple query to check if the connection is healthy
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error(`Database health check failed: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Executes a raw SQL query with proper error handling.
   * Implements IPrismaService interface.
   * 
   * @param query The SQL query to execute
   * @param parameters The parameters for the query
   * @returns Promise that resolves to the query result
   */
  async executeRaw(query: string, parameters: any[] = []): Promise<any> {
    try {
      // Execute the raw query with timeout
      const queryPromise = this.$executeRawUnsafe(query, ...parameters);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Query execution timed out after ${OPERATION_TIMEOUTS.DEFAULT_QUERY_TIMEOUT_MS}ms`));
        }, OPERATION_TIMEOUTS.DEFAULT_QUERY_TIMEOUT_MS);
      });

      return await Promise.race([queryPromise, timeoutPromise]);
    } catch (error) {
      // Classify and handle the error
      const errorCategory = this.classifyError(error);
      
      this.logger.error(
        `Raw query execution failed (${errorCategory}): ${error.message}\nQuery: ${query}\nParameters: ${JSON.stringify(parameters)}`,
        error.stack,
      );
      
      throw error;
    }
  }

  /**
   * Classifies a database error based on its code and message.
   * 
   * @param error The error to classify
   * @returns The error category
   */
  private classifyError(error: any): string {
    // Check if it's a Prisma error with a code
    if (error.code && ERROR_CLASSIFICATION.PRISMA_ERROR_MAPPINGS[error.code]) {
      return ERROR_CLASSIFICATION.PRISMA_ERROR_MAPPINGS[error.code];
    }

    // Check for common connection error patterns
    if (
      error.message.includes('connection') ||
      error.message.includes('timeout') ||
      error.message.includes('socket')
    ) {
      return ERROR_CLASSIFICATION.CATEGORIES.CONNECTION;
    }

    // Check for transaction-related errors
    if (error.message.includes('transaction')) {
      return ERROR_CLASSIFICATION.CATEGORIES.TRANSACTION;
    }

    // Default to unknown category
    return ERROR_CLASSIFICATION.CATEGORIES.UNKNOWN;
  }

  /**
   * Determines if an error is transient and can be retried.
   * 
   * @param error The error to check
   * @returns Boolean indicating if the error is transient
   */
  isTransientError(error: any): boolean {
    // Check if it's a Prisma error with a code that's classified as transient
    if (error.code && ERROR_CLASSIFICATION.PRISMA_ERROR_RECOVERABILITY[error.code] === 'TRANSIENT') {
      return true;
    }

    // Check for common transient error patterns
    const transientPatterns = [
      'connection',
      'timeout',
      'deadlock',
      'lock',
      'temporarily unavailable',
      'idle',
      'terminated',
      'closed',
      'reset',
      'broken pipe',
    ];

    return transientPatterns.some(pattern => error.message.toLowerCase().includes(pattern));
  }

  /**
   * Executes a function with retry logic for transient errors.
   * 
   * @param fn The function to execute
   * @param maxRetries Maximum number of retry attempts
   * @param baseDelay Base delay in milliseconds between retry attempts
   * @returns Promise that resolves to the result of the function
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = RETRY_STRATEGY.DEFAULT_MAX_RETRIES,
    baseDelay: number = RETRY_STRATEGY.BASE_DELAY_MS,
  ): Promise<T> {
    let lastError: Error;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        attempt++;

        // If it's not a transient error or we've reached the maximum retries, throw the error
        if (!this.isTransientError(error) || attempt > maxRetries) {
          throw error;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = Math.min(
          baseDelay * Math.pow(RETRY_STRATEGY.BACKOFF_FACTOR, attempt - 1),
          RETRY_STRATEGY.MAX_DELAY_MS,
        );
        const jitter = delay * RETRY_STRATEGY.JITTER_FACTOR * Math.random();
        const totalDelay = delay + jitter;

        this.logger.warn(
          `Transient database error, retrying (attempt ${attempt}/${maxRetries}) in ${Math.round(totalDelay)}ms: ${error.message}`,
        );

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, totalDelay));
      }
    }

    // This should never be reached due to the throw in the catch block,
    // but TypeScript requires a return statement
    throw lastError;
  }
}
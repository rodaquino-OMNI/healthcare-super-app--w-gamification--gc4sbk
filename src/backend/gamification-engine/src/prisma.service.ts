import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import {
  DatabaseErrorType,
  DatabaseException,
  ConnectionException,
  QueryException,
  TransactionException,
} from '@austa/database/errors';
import { RetryStrategyFactory } from '@austa/database/errors/retry-strategies';
import { ErrorTransformer } from '@austa/database/errors/error-transformer';
import { JourneyType } from '@austa/interfaces/common';

/**
 * Configuration options for the PrismaService
 */
export interface PrismaServiceOptions {
  /**
   * Maximum number of connections in the pool
   * @default 10
   */
  maxConnections?: number;

  /**
   * Enable query logging for debugging
   * @default false in production, true in development
   */
  enableLogging?: boolean;

  /**
   * Log queries that exceed this duration (in ms)
   * @default 500
   */
  slowQueryThreshold?: number;

  /**
   * Maximum retry attempts for transient errors
   * @default 3
   */
  maxRetryAttempts?: number;

  /**
   * Connection timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  connectionTimeout?: number;
}

/**
 * Enhanced Prisma service with proper connection pooling, comprehensive error handling,
 * and transaction management. Provides database access for all gamification engine modules
 * with improved reliability.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly retryFactory: RetryStrategyFactory;
  private readonly errorTransformer: ErrorTransformer;
  private readonly options: PrismaServiceOptions;
  private isConnected = false;

  constructor(private configService: ConfigService) {
    // Initialize PrismaClient with middleware for logging and error handling
    super({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'info', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
      errorFormat: 'colorless',
    });

    // Initialize options with defaults from config or environment
    this.options = {
      maxConnections: configService.get<number>('DATABASE_MAX_CONNECTIONS') || 10,
      enableLogging: configService.get<string>('NODE_ENV') !== 'production',
      slowQueryThreshold: configService.get<number>('DATABASE_SLOW_QUERY_THRESHOLD') || 500,
      maxRetryAttempts: configService.get<number>('DATABASE_MAX_RETRY_ATTEMPTS') || 3,
      connectionTimeout: configService.get<number>('DATABASE_CONNECTION_TIMEOUT') || 30000,
    };

    // Initialize error handling utilities
    this.retryFactory = new RetryStrategyFactory();
    this.errorTransformer = new ErrorTransformer();

    // Set up query logging if enabled
    if (this.options.enableLogging) {
      this.setupQueryLogging();
    }

    // Set up middleware for connection pooling and error handling
    this.setupMiddleware();
  }

  /**
   * Initialize the Prisma client when the module is initialized
   */
  async onModuleInit() {
    try {
      this.logger.log('Connecting to database...');
      await this.connect();
      this.isConnected = true;
      this.logger.log('Successfully connected to database');
    } catch (error) {
      const transformedError = this.errorTransformer.transformPrismaError(error);
      this.logger.error(`Failed to connect to database: ${transformedError.message}`, transformedError.stack);
      throw transformedError;
    }
  }

  /**
   * Disconnect from the database when the module is destroyed
   */
  async onModuleDestroy() {
    try {
      if (this.isConnected) {
        this.logger.log('Disconnecting from database...');
        await this.disconnect();
        this.isConnected = false;
        this.logger.log('Successfully disconnected from database');
      }
    } catch (error) {
      const transformedError = this.errorTransformer.transformPrismaError(error);
      this.logger.error(`Error during database disconnection: ${transformedError.message}`, transformedError.stack);
      // Don't throw here to avoid crashing the application during shutdown
    }
  }

  /**
   * Set up query logging middleware
   */
  private setupQueryLogging() {
    // @ts-ignore - Prisma types don't include the $on method properly
    this.$on('query', (e: { query: string; params: string; duration: number; timestamp: string }) => {
      if (e.duration >= this.options.slowQueryThreshold) {
        this.logger.warn(
          `Slow query detected (${e.duration}ms): ${e.query}`,
          `Params: ${e.params}`
        );
      } else if (this.options.enableLogging) {
        this.logger.debug(
          `Query (${e.duration}ms): ${e.query}`,
          `Params: ${e.params}`
        );
      }
    });
  }

  /**
   * Set up middleware for connection pooling and error handling
   */
  private setupMiddleware() {
    this.$use(async (params, next) => {
      const startTime = Date.now();
      try {
        // Execute the query
        const result = await next(params);
        
        // Log performance metrics for monitoring
        const duration = Date.now() - startTime;
        if (duration > this.options.slowQueryThreshold) {
          this.logger.warn(
            `Slow operation detected: ${params.model}.${params.action} took ${duration}ms`
          );
        }
        
        return result;
      } catch (error) {
        // Transform the error to a standardized database exception
        const transformedError = this.errorTransformer.transformPrismaError(error);
        
        // Determine if we should retry based on error type
        if (this.isRetryableError(transformedError)) {
          return this.handleRetryableError(params, next, transformedError);
        }
        
        // Log the error with context
        this.logger.error(
          `Database error in ${params.model}.${params.action}: ${transformedError.message}`,
          { params: params.args, error: transformedError }
        );
        
        throw transformedError;
      }
    });
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: DatabaseException): boolean {
    // Connection errors and certain query errors are retryable
    if (error instanceof ConnectionException) {
      return true;
    }
    
    if (error instanceof QueryException) {
      // Only retry specific query errors like deadlocks or connection issues
      return error.type === DatabaseErrorType.QUERY_TIMEOUT || 
             error.type === DatabaseErrorType.CONNECTION_LOST;
    }
    
    return false;
  }

  /**
   * Handle retryable errors with appropriate backoff strategy
   */
  private async handleRetryableError(params: any, next: any, error: DatabaseException, attempt = 1) {
    if (attempt > this.options.maxRetryAttempts) {
      this.logger.error(
        `Max retry attempts (${this.options.maxRetryAttempts}) reached for operation ${params.model}.${params.action}`,
        { params: params.args, error }
      );
      throw error;
    }
    
    // Get appropriate retry strategy based on error type
    const retryStrategy = this.retryFactory.getStrategy(error.type);
    const delayMs = retryStrategy.getDelayMs(attempt);
    
    this.logger.log(
      `Retrying operation ${params.model}.${params.action} after ${delayMs}ms (attempt ${attempt}/${this.options.maxRetryAttempts})`
    );
    
    // Wait for the calculated delay
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    try {
      // Retry the operation
      return await next(params);
    } catch (retryError) {
      // Transform the error and try again if retryable
      const transformedRetryError = this.errorTransformer.transformPrismaError(retryError);
      if (this.isRetryableError(transformedRetryError)) {
        return this.handleRetryableError(params, next, transformedRetryError, attempt + 1);
      }
      throw transformedRetryError;
    }
  }

  /**
   * Execute a function within a transaction
   * 
   * @param fn Function to execute within the transaction
   * @returns Result of the function execution
   */
  async executeTransaction<T>(fn: (prisma: PrismaService) => Promise<T>): Promise<T> {
    try {
      return await this.$transaction(async (tx) => {
        // Create a transaction proxy that wraps the transaction context
        const txPrisma = this.createTransactionProxy(tx);
        return await fn(txPrisma);
      });
    } catch (error) {
      const transformedError = this.errorTransformer.transformPrismaError(error);
      if (transformedError instanceof TransactionException) {
        this.logger.error(`Transaction error: ${transformedError.message}`, transformedError.stack);
      }
      throw transformedError;
    }
  }

  /**
   * Create a proxy that wraps a transaction context
   * 
   * @param tx Transaction context from Prisma
   * @returns Proxied PrismaService that uses the transaction context
   */
  private createTransactionProxy(tx: any): PrismaService {
    // Create a proxy that redirects all model operations to the transaction
    const handler = {
      get: (target: any, prop: string | symbol) => {
        if (prop in tx) {
          return tx[prop];
        }
        return target[prop];
      }
    };
    
    return new Proxy(this, handler) as PrismaService;
  }

  /**
   * Get a journey-specific database context
   * 
   * @param journeyType Type of journey (health, care, plan)
   * @returns PrismaService with journey-specific context
   */
  getJourneyContext(journeyType: JourneyType): PrismaService {
    // Create a proxy that adds journey context to all operations
    const handler = {
      get: (target: any, prop: string | symbol) => {
        const original = target[prop];
        
        // If this is a model property (e.g., user, profile, etc.)
        if (typeof original === 'object' && original !== null && !Array.isArray(original)) {
          // Create a proxy for the model to add journey context to queries
          return new Proxy(original, {
            get: (modelTarget: any, modelProp: string | symbol) => {
              const modelMethod = modelTarget[modelProp];
              
              // If this is a method on the model (e.g., findMany, create, etc.)
              if (typeof modelMethod === 'function') {
                // Return a function that adds journey context to the query
                return function(...args: any[]) {
                  // Add journey filter to the query if applicable
                  if (args.length > 0 && typeof args[0] === 'object') {
                    // Only add journey context if the model supports it
                    // This is determined by checking if the model has a journeyType field
                    const hasJourneyField = modelTarget.fields?.some(
                      (field: any) => field.name === 'journeyType'
                    );
                    
                    if (hasJourneyField) {
                      args[0] = {
                        ...args[0],
                        where: {
                          ...args[0]?.where,
                          journeyType,
                        },
                      };
                    }
                  }
                  
                  return modelMethod.apply(modelTarget, args);
                };
              }
              
              return modelMethod;
            },
          });
        }
        
        // For methods like $transaction, wrap them to maintain journey context
        if (typeof original === 'function' && prop === '$transaction') {
          return function(...args: any[]) {
            // If the first argument is a function, wrap it to provide journey context
            if (typeof args[0] === 'function') {
              const originalFn = args[0];
              args[0] = (tx: any) => {
                const journeyTx = target.createTransactionProxy(tx);
                return originalFn(target.getJourneyContext(journeyType).createTransactionProxy(journeyTx));
              };
            }
            
            return original.apply(target, args);
          };
        }
        
        return original;
      },
    };
    
    return new Proxy(this, handler) as PrismaService;
  }
}
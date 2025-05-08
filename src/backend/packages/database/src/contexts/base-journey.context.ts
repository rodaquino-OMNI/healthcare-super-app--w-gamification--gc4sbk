import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

import { ConnectionManager } from '../connection/connection-manager';
import { ConnectionPool } from '../connection/connection-pool';
import { ConnectionHealth } from '../connection/connection-health';
import { ConnectionRetry } from '../connection/connection-retry';
import { ConnectionConfig } from '../connection/connection-config';

import { TransactionService } from '../transactions/transaction.service';
import { TransactionIsolationLevel } from '../transactions/transaction.interface';
import { TransactionError } from '../transactions/transaction.errors';

import { DatabaseException, ConnectionException, QueryException, TransactionException } from '../errors/database-error.exception';
import { DatabaseErrorType, DatabaseErrorSeverity, DatabaseErrorRecoverability } from '../errors/database-error.types';
import { ErrorTransformer } from '../errors/error-transformer';
import { RetryStrategyFactory } from '../errors/retry-strategies';

import { MiddlewareRegistry } from '../middleware/middleware.registry';
import { MiddlewareFactory } from '../middleware/middleware.factory';
import { DatabaseMiddleware } from '../middleware/middleware.interface';
import { LoggingMiddleware } from '../middleware/logging.middleware';
import { PerformanceMiddleware } from '../middleware/performance.middleware';
import { CircuitBreakerMiddleware } from '../middleware/circuit-breaker.middleware';
import { TransformationMiddleware } from '../middleware/transformation.middleware';

import { FilterOptions, SortOptions, PaginationOptions } from '../types/query.types';
import { JourneyType, JourneyContext } from '../types/journey.types';
import { DatabaseContextOptions } from '../types/context.types';

/**
 * Abstract base class that provides common database context functionality for all journey-specific contexts.
 * Implements shared patterns for transaction management, error handling, and connection optimization.
 * 
 * This class serves as the foundation for all journey-specific database operations and ensures
 * consistent behavior across Health, Care, and Plan journeys.
 */
@Injectable()
export abstract class BaseJourneyContext implements OnModuleInit, OnModuleDestroy {
  protected readonly logger: Logger;
  protected readonly prisma: PrismaClient;
  protected readonly connectionManager: ConnectionManager;
  protected readonly connectionPool: ConnectionPool;
  protected readonly connectionHealth: ConnectionHealth;
  protected readonly connectionRetry: ConnectionRetry;
  protected readonly transactionService: TransactionService;
  protected readonly errorTransformer: ErrorTransformer;
  protected readonly retryStrategyFactory: RetryStrategyFactory;
  protected readonly middlewareRegistry: MiddlewareRegistry;
  protected readonly middlewareFactory: MiddlewareFactory;
  protected readonly journeyType: JourneyType;
  protected readonly middlewares: DatabaseMiddleware[] = [];
  
  /**
   * Creates a new instance of BaseJourneyContext.
   * 
   * @param configService - NestJS ConfigService for accessing environment configuration
   * @param options - Optional configuration options for the database context
   */
  constructor(
    protected readonly configService: ConfigService,
    protected readonly options: DatabaseContextOptions = {}
  ) {
    this.journeyType = this.getJourneyType();
    this.logger = new Logger(`${this.journeyType}JourneyContext`);
    
    // Initialize Prisma client with connection pooling
    this.prisma = new PrismaClient({
      log: this.getLogLevels(),
      errorFormat: 'pretty',
    });
    
    // Initialize connection management components
    const connectionConfig = new ConnectionConfig(this.configService, this.journeyType);
    this.connectionPool = new ConnectionPool(connectionConfig);
    this.connectionHealth = new ConnectionHealth(connectionConfig);
    this.connectionRetry = new ConnectionRetry(connectionConfig);
    this.connectionManager = new ConnectionManager(
      this.connectionPool,
      this.connectionHealth,
      this.connectionRetry,
      connectionConfig
    );
    
    // Initialize transaction management
    this.transactionService = new TransactionService(this.prisma, this.logger);
    
    // Initialize error handling components
    this.errorTransformer = new ErrorTransformer();
    this.retryStrategyFactory = new RetryStrategyFactory();
    
    // Initialize middleware components
    this.middlewareRegistry = new MiddlewareRegistry();
    this.middlewareFactory = new MiddlewareFactory(this.middlewareRegistry);
    
    // Register default middlewares
    this.registerDefaultMiddlewares();
  }
  
  /**
   * Lifecycle hook that runs when the module is initialized.
   * Establishes database connections and validates connectivity.
   */
  async onModuleInit(): Promise<void> {
    try {
      this.logger.log(`Initializing ${this.journeyType} journey database context`);
      await this.connectionManager.connect();
      await this.validateConnection();
      this.logger.log(`${this.journeyType} journey database context initialized successfully`);
    } catch (error) {
      const transformedError = this.errorTransformer.transformConnectionError(error);
      this.logger.error(
        `Failed to initialize ${this.journeyType} journey database context: ${transformedError.message}`,
        transformedError.stack
      );
      throw transformedError;
    }
  }
  
  /**
   * Lifecycle hook that runs when the module is destroyed.
   * Closes database connections and performs cleanup.
   */
  async onModuleDestroy(): Promise<void> {
    try {
      this.logger.log(`Closing ${this.journeyType} journey database context`);
      await this.connectionManager.disconnect();
      this.logger.log(`${this.journeyType} journey database context closed successfully`);
    } catch (error) {
      const transformedError = this.errorTransformer.transformConnectionError(error);
      this.logger.error(
        `Error closing ${this.journeyType} journey database context: ${transformedError.message}`,
        transformedError.stack
      );
    }
  }
  
  /**
   * Validates the database connection by performing a simple query.
   * Throws an exception if the connection is invalid.
   */
  protected async validateConnection(): Promise<void> {
    try {
      // Execute a simple query to validate the connection
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      const transformedError = this.errorTransformer.transformConnectionError(error);
      this.logger.error(
        `Connection validation failed for ${this.journeyType} journey: ${transformedError.message}`,
        transformedError.stack
      );
      throw new ConnectionException(
        `Failed to validate database connection for ${this.journeyType} journey`,
        {
          cause: transformedError,
          journeyType: this.journeyType,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.TRANSIENT,
        }
      );
    }
  }
  
  /**
   * Executes a database operation with error handling, retry mechanisms, and middleware processing.
   * 
   * @param operation - The database operation to execute
   * @param context - Additional context for the operation
   * @returns The result of the operation
   */
  protected async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    context: Record<string, any> = {}
  ): Promise<T> {
    const operationContext = {
      journeyType: this.journeyType,
      ...context,
    };
    
    // Apply middleware before execution
    const middlewares = this.middlewareFactory.createMiddlewareChain(
      this.middlewares,
      operationContext
    );
    
    try {
      // Execute middleware pipeline before operation
      for (const middleware of middlewares) {
        await middleware.beforeExecute(operationContext);
      }
      
      // Execute the operation
      const result = await operation();
      
      // Execute middleware pipeline after operation
      for (const middleware of middlewares.reverse()) {
        await middleware.afterExecute(operationContext, null, result);
      }
      
      return result;
    } catch (error) {
      // Transform the error to a standardized database exception
      const transformedError = this.errorTransformer.transformError(error, operationContext);
      
      // Execute middleware pipeline after operation (with error)
      for (const middleware of middlewares.reverse()) {
        await middleware.afterExecute(operationContext, transformedError, null);
      }
      
      // Check if the error is recoverable and should be retried
      if (transformedError.recoverability === DatabaseErrorRecoverability.TRANSIENT) {
        const retryStrategy = this.retryStrategyFactory.createStrategy(
          transformedError.type,
          operationContext
        );
        
        if (retryStrategy.shouldRetry(transformedError)) {
          this.logger.debug(
            `Retrying operation for ${this.journeyType} journey due to transient error: ${transformedError.message}`
          );
          return retryStrategy.execute(() => this.executeWithErrorHandling(operation, context));
        }
      }
      
      // Log the error
      this.logger.error(
        `Database operation failed for ${this.journeyType} journey: ${transformedError.message}`,
        {
          error: transformedError,
          context: operationContext,
          stack: transformedError.stack,
        }
      );
      
      // Rethrow the transformed error
      throw transformedError;
    }
  }
  
  /**
   * Executes a function within a database transaction.
   * 
   * @param fn - The function to execute within the transaction
   * @param isolationLevel - Optional transaction isolation level
   * @returns The result of the function execution
   */
  async executeTransaction<T>(
    fn: (tx: PrismaClient) => Promise<T>,
    isolationLevel: TransactionIsolationLevel = TransactionIsolationLevel.READ_COMMITTED
  ): Promise<T> {
    return this.executeWithErrorHandling(
      async () => {
        try {
          return await this.transactionService.executeTransaction(fn, isolationLevel);
        } catch (error) {
          if (error instanceof TransactionError) {
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
          throw error;
        }
      },
      { isolationLevel, operationType: 'transaction' }
    );
  }
  
  /**
   * Executes a function within a nested transaction.
   * 
   * @param fn - The function to execute within the nested transaction
   * @param parent - The parent transaction
   * @returns The result of the function execution
   */
  async executeNestedTransaction<T>(
    fn: (tx: PrismaClient) => Promise<T>,
    parent: PrismaClient
  ): Promise<T> {
    return this.executeWithErrorHandling(
      async () => {
        try {
          return await this.transactionService.executeNestedTransaction(fn, parent);
        } catch (error) {
          if (error instanceof TransactionError) {
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
          throw error;
        }
      },
      { operationType: 'nestedTransaction' }
    );
  }
  
  /**
   * Registers default middleware components for the journey context.
   */
  protected registerDefaultMiddlewares(): void {
    // Add logging middleware
    this.middlewares.push(
      new LoggingMiddleware(this.logger, {
        journeyType: this.journeyType,
        logLevel: this.configService.get('DATABASE_LOG_LEVEL', 'error'),
      })
    );
    
    // Add performance monitoring middleware
    this.middlewares.push(
      new PerformanceMiddleware({
        journeyType: this.journeyType,
        slowQueryThreshold: this.configService.get('DATABASE_SLOW_QUERY_THRESHOLD', 1000),
      })
    );
    
    // Add circuit breaker middleware
    this.middlewares.push(
      new CircuitBreakerMiddleware({
        journeyType: this.journeyType,
        failureThreshold: this.configService.get('DATABASE_CIRCUIT_BREAKER_THRESHOLD', 5),
        resetTimeout: this.configService.get('DATABASE_CIRCUIT_BREAKER_RESET', 30000),
      })
    );
    
    // Add transformation middleware
    this.middlewares.push(
      new TransformationMiddleware({
        journeyType: this.journeyType,
      })
    );
  }
  
  /**
   * Gets the log levels for Prisma client based on environment configuration.
   */
  protected getLogLevels(): any[] {
    const logLevel = this.configService.get('DATABASE_LOG_LEVEL', 'error');
    
    switch (logLevel) {
      case 'debug':
        return ['query', 'info', 'warn', 'error'];
      case 'info':
        return ['info', 'warn', 'error'];
      case 'warn':
        return ['warn', 'error'];
      case 'error':
      default:
        return ['error'];
    }
  }
  
  /**
   * Abstract method to get the journey type for this context.
   * Must be implemented by derived classes.
   */
  protected abstract getJourneyType(): JourneyType;
  
  /**
   * Abstract method to find an entity by ID with optional relations.
   * Must be implemented by derived classes.
   * 
   * @param id - The ID of the entity to find
   * @param options - Optional query options
   */
  abstract findById<T>(id: string | number, options?: Record<string, any>): Promise<T>;
  
  /**
   * Abstract method to find multiple entities with filtering, sorting, and pagination.
   * Must be implemented by derived classes.
   * 
   * @param filter - Optional filter criteria
   * @param sort - Optional sort criteria
   * @param pagination - Optional pagination options
   */
  abstract findMany<T>(
    filter?: FilterOptions,
    sort?: SortOptions,
    pagination?: PaginationOptions
  ): Promise<T[]>;
  
  /**
   * Abstract method to create a new entity.
   * Must be implemented by derived classes.
   * 
   * @param data - The data for the new entity
   */
  abstract create<T>(data: Record<string, any>): Promise<T>;
  
  /**
   * Abstract method to update an existing entity.
   * Must be implemented by derived classes.
   * 
   * @param id - The ID of the entity to update
   * @param data - The data to update
   */
  abstract update<T>(id: string | number, data: Record<string, any>): Promise<T>;
  
  /**
   * Abstract method to delete an entity.
   * Must be implemented by derived classes.
   * 
   * @param id - The ID of the entity to delete
   */
  abstract delete<T>(id: string | number): Promise<T>;
  
  /**
   * Abstract method to count entities based on filter criteria.
   * Must be implemented by derived classes.
   * 
   * @param filter - Optional filter criteria
   */
  abstract count(filter?: FilterOptions): Promise<number>;
}
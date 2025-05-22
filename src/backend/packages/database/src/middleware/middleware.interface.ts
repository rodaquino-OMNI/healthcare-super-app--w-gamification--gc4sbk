/**
 * @file middleware.interface.ts
 * @description Defines the core interfaces for database middleware components used across the AUSTA SuperApp.
 * This file establishes a middleware pipeline pattern where each middleware can intercept and modify
 * database operations before and after execution.
 */

import { PrismaClient } from '@prisma/client';
import { DatabaseErrorType, DatabaseErrorSeverity } from '../errors/database-error.types';
import { DatabaseException } from '../errors/database-error.exception';

/**
 * Represents the journey context for database operations.
 * This allows middleware to apply journey-specific optimizations and rules.
 */
export enum JourneyContext {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  GAMIFICATION = 'gamification',
  NOTIFICATION = 'notification',
  AUTH = 'auth',
  SYSTEM = 'system'
}

/**
 * Represents the type of database operation being performed.
 * This allows middleware to apply operation-specific logic.
 */
export enum DatabaseOperationType {
  QUERY = 'query',
  MUTATION = 'mutation',
  TRANSACTION = 'transaction',
  CONNECTION = 'connection',
  BATCH = 'batch'
}

/**
 * Represents the context for a database operation.
 * This context is passed through the middleware pipeline and can be
 * enriched by each middleware in the chain.
 */
export interface MiddlewareContext<T = any> {
  /**
   * The model or table being accessed
   */
  model?: string;
  
  /**
   * The specific operation being performed (e.g., findUnique, create, update)
   */
  operation: string;
  
  /**
   * The type of operation (query, mutation, transaction, etc.)
   */
  operationType: DatabaseOperationType;
  
  /**
   * The journey context for the operation
   */
  journeyContext?: JourneyContext;
  
  /**
   * The arguments passed to the operation
   */
  args: Record<string, any>;
  
  /**
   * The result of the operation (available in afterExecute)
   */
  result?: T;
  
  /**
   * The error that occurred during the operation (if any)
   */
  error?: Error | DatabaseException;
  
  /**
   * The start time of the operation
   */
  startTime?: number;
  
  /**
   * The end time of the operation
   */
  endTime?: number;
  
  /**
   * The duration of the operation in milliseconds
   */
  duration?: number;
  
  /**
   * A unique identifier for the operation
   */
  operationId: string;
  
  /**
   * A correlation ID for tracing requests across services
   */
  correlationId?: string;
  
  /**
   * The user ID associated with the operation (if available)
   */
  userId?: string;
  
  /**
   * Additional metadata for the operation
   */
  metadata?: Record<string, any>;
  
  /**
   * Indicates whether the operation should be skipped
   */
  skip?: boolean;
  
  /**
   * Indicates whether the operation should be retried
   */
  retry?: boolean;
  
  /**
   * The number of retry attempts made
   */
  retryCount?: number;
  
  /**
   * The maximum number of retry attempts allowed
   */
  maxRetries?: number;
}

/**
 * Represents the result of a middleware execution.
 * This allows middleware to modify the operation arguments or result,
 * or to indicate that the operation should be skipped or retried.
 */
export interface MiddlewareResult<T = any> {
  /**
   * The context after middleware execution
   */
  context: MiddlewareContext<T>;
  
  /**
   * The modified arguments for the operation
   */
  args?: Record<string, any>;
  
  /**
   * The modified result of the operation
   */
  result?: T;
  
  /**
   * Indicates whether the operation should be skipped
   */
  skip?: boolean;
  
  /**
   * Indicates whether the operation should be retried
   */
  retry?: boolean;
  
  /**
   * The error that occurred during middleware execution (if any)
   */
  error?: Error | DatabaseException;
}

/**
 * Represents a middleware for database operations.
 * Middleware can intercept and modify database operations before and after execution.
 */
export interface DatabaseMiddleware<T = any> {
  /**
   * The name of the middleware
   */
  readonly name: string;
  
  /**
   * The priority of the middleware (lower values execute first)
   */
  readonly priority: number;
  
  /**
   * Executes before the database operation.
   * Can modify the operation arguments or skip the operation entirely.
   * 
   * @param context The operation context
   * @param next The next middleware in the chain
   * @returns A promise resolving to the middleware result
   */
  beforeExecute(context: MiddlewareContext<T>, next: NextMiddlewareFunction<T>): Promise<MiddlewareResult<T>>;
  
  /**
   * Executes after the database operation.
   * Can modify the operation result or handle errors.
   * 
   * @param context The operation context with result or error
   * @param next The next middleware in the chain
   * @returns A promise resolving to the middleware result
   */
  afterExecute(context: MiddlewareContext<T>, next: NextMiddlewareFunction<T>): Promise<MiddlewareResult<T>>;
}

/**
 * Represents the function signature for the next middleware in the chain.
 * 
 * @param context The operation context
 * @returns A promise resolving to the middleware result
 */
export type NextMiddlewareFunction<T = any> = (context: MiddlewareContext<T>) => Promise<MiddlewareResult<T>>;

/**
 * Represents a middleware specifically for logging database operations.
 * Extends the base DatabaseMiddleware with logging-specific functionality.
 */
export interface LoggingMiddleware<T = any> extends DatabaseMiddleware<T> {
  /**
   * Configures the logging level for the middleware.
   * 
   * @param level The logging level to use
   * @returns The middleware instance for chaining
   */
  setLogLevel(level: string): LoggingMiddleware<T>;
  
  /**
   * Configures whether to log sensitive data.
   * 
   * @param redact Whether to redact sensitive data
   * @returns The middleware instance for chaining
   */
  redactSensitiveData(redact: boolean): LoggingMiddleware<T>;
  
  /**
   * Configures journey-specific logging settings.
   * 
   * @param journey The journey context
   * @param options Journey-specific logging options
   * @returns The middleware instance for chaining
   */
  configureForJourney(journey: JourneyContext, options: Record<string, any>): LoggingMiddleware<T>;
}

/**
 * Represents a middleware specifically for monitoring database performance.
 * Extends the base DatabaseMiddleware with performance-specific functionality.
 */
export interface PerformanceMiddleware<T = any> extends DatabaseMiddleware<T> {
  /**
   * Configures the slow query threshold in milliseconds.
   * 
   * @param threshold The threshold in milliseconds
   * @returns The middleware instance for chaining
   */
  setSlowQueryThreshold(threshold: number): PerformanceMiddleware<T>;
  
  /**
   * Configures whether to collect query metrics.
   * 
   * @param collect Whether to collect metrics
   * @returns The middleware instance for chaining
   */
  collectMetrics(collect: boolean): PerformanceMiddleware<T>;
  
  /**
   * Configures journey-specific performance thresholds.
   * 
   * @param journey The journey context
   * @param threshold The threshold in milliseconds for the journey
   * @returns The middleware instance for chaining
   */
  setJourneyThreshold(journey: JourneyContext, threshold: number): PerformanceMiddleware<T>;
}

/**
 * Represents a middleware specifically for transforming database operations.
 * Extends the base DatabaseMiddleware with transformation-specific functionality.
 */
export interface TransformationMiddleware<T = any> extends DatabaseMiddleware<T> {
  /**
   * Adds a transformation rule for a specific model and operation.
   * 
   * @param model The model to apply the transformation to
   * @param operation The operation to apply the transformation to
   * @param transform The transformation function
   * @returns The middleware instance for chaining
   */
  addTransformation(
    model: string,
    operation: string,
    transform: (args: Record<string, any>) => Record<string, any>
  ): TransformationMiddleware<T>;
  
  /**
   * Adds a journey-specific transformation rule.
   * 
   * @param journey The journey context
   * @param model The model to apply the transformation to
   * @param operation The operation to apply the transformation to
   * @param transform The transformation function
   * @returns The middleware instance for chaining
   */
  addJourneyTransformation(
    journey: JourneyContext,
    model: string,
    operation: string,
    transform: (args: Record<string, any>) => Record<string, any>
  ): TransformationMiddleware<T>;
}

/**
 * Represents a middleware specifically for implementing circuit breaker pattern.
 * Extends the base DatabaseMiddleware with circuit breaker functionality.
 */
export interface CircuitBreakerMiddleware<T = any> extends DatabaseMiddleware<T> {
  /**
   * Configures the failure threshold for opening the circuit.
   * 
   * @param threshold The failure threshold
   * @returns The middleware instance for chaining
   */
  setFailureThreshold(threshold: number): CircuitBreakerMiddleware<T>;
  
  /**
   * Configures the reset timeout for the circuit breaker.
   * 
   * @param timeout The reset timeout in milliseconds
   * @returns The middleware instance for chaining
   */
  setResetTimeout(timeout: number): CircuitBreakerMiddleware<T>;
  
  /**
   * Configures journey-specific circuit breaker settings.
   * 
   * @param journey The journey context
   * @param options Journey-specific circuit breaker options
   * @returns The middleware instance for chaining
   */
  configureForJourney(journey: JourneyContext, options: Record<string, any>): CircuitBreakerMiddleware<T>;
  
  /**
   * Gets the current state of the circuit breaker.
   * 
   * @returns The current state (open, closed, half-open)
   */
  getState(): 'open' | 'closed' | 'half-open';
}

/**
 * Represents a middleware specifically for error handling in database operations.
 * Extends the base DatabaseMiddleware with error handling functionality.
 */
export interface ErrorHandlingMiddleware<T = any> extends DatabaseMiddleware<T> {
  /**
   * Registers an error handler for a specific error type.
   * 
   * @param errorType The type of error to handle
   * @param handler The error handler function
   * @returns The middleware instance for chaining
   */
  registerErrorHandler(
    errorType: DatabaseErrorType,
    handler: (error: Error, context: MiddlewareContext<T>) => Promise<MiddlewareResult<T>>
  ): ErrorHandlingMiddleware<T>;
  
  /**
   * Configures journey-specific error handling.
   * 
   * @param journey The journey context
   * @param errorType The type of error to handle
   * @param handler The error handler function
   * @returns The middleware instance for chaining
   */
  registerJourneyErrorHandler(
    journey: JourneyContext,
    errorType: DatabaseErrorType,
    handler: (error: Error, context: MiddlewareContext<T>) => Promise<MiddlewareResult<T>>
  ): ErrorHandlingMiddleware<T>;
}

/**
 * Represents a chain of middleware for database operations.
 * Middleware is executed in order of priority (lower values first).
 */
export interface MiddlewareChain<T = any> {
  /**
   * Adds a middleware to the chain.
   * 
   * @param middleware The middleware to add
   * @returns The middleware chain for chaining
   */
  use(middleware: DatabaseMiddleware<T>): MiddlewareChain<T>;
  
  /**
   * Executes the middleware chain for a database operation.
   * 
   * @param context The operation context
   * @param operation The database operation to execute
   * @returns A promise resolving to the operation result
   */
  execute<R = any>(context: MiddlewareContext<T>, operation: () => Promise<R>): Promise<R>;
}

/**
 * Configuration options for middleware.
 */
export interface MiddlewareOptions {
  /**
   * Whether the middleware is enabled
   */
  enabled?: boolean;
  
  /**
   * The priority of the middleware (lower values execute first)
   */
  priority?: number;
  
  /**
   * Journey-specific configuration
   */
  journeyConfig?: Record<JourneyContext, Record<string, any>>;
  
  /**
   * Operation-specific configuration
   */
  operationConfig?: Record<DatabaseOperationType, Record<string, any>>;
  
  /**
   * Additional middleware-specific options
   */
  [key: string]: any;
}

/**
 * Factory function type for creating middleware instances.
 */
export type MiddlewareFactory<T = any> = (options?: MiddlewareOptions) => DatabaseMiddleware<T>;
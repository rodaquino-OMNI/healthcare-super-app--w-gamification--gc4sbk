/**
 * @file middleware.interface.ts
 * @description Defines the core interfaces for database middleware components used across the AUSTA SuperApp.
 * This file establishes a middleware pipeline pattern where each middleware can intercept and modify
 * database operations before and after execution.
 *
 * The middleware system enables cross-cutting concerns like logging, performance monitoring,
 * error handling, and query transformation to be applied consistently across all database
 * operations in all journey services.
 */

import { PrismaClient } from '@prisma/client';
import { DatabaseErrorType, DatabaseErrorSeverity, DatabaseErrorRecoverability } from '../errors/database-error.types';
import { DatabaseException, ConnectionException, QueryException, TransactionException } from '../errors/database-error.exception';
import { JourneyType } from '../types/journey.types';
import { TransactionOptions } from '../types/transaction.types';

/**
 * Represents the context of a database operation, providing metadata about the operation
 * being executed and the environment in which it's running.
 */
export interface MiddlewareContext<T = any> {
  /**
   * The name of the model being operated on (e.g., 'User', 'HealthMetric', 'Appointment')
   */
  model: string;
  
  /**
   * The type of operation being performed (e.g., 'findUnique', 'create', 'update', 'delete')
   */
  operation: string;
  
  /**
   * The arguments passed to the database operation
   */
  args: any;
  
  /**
   * The journey context in which this operation is being performed
   * This allows for journey-specific middleware behavior
   */
  journey?: JourneyType;
  
  /**
   * The start time of the operation, automatically set by the middleware pipeline
   * Used for performance tracking and logging
   */
  startTime?: number;
  
  /**
   * The result of the operation, available in the afterExecute phase
   */
  result?: T;
  
  /**
   * Any error that occurred during the operation, available in the afterExecute phase
   */
  error?: Error | DatabaseException;
  
  /**
   * Additional metadata that can be attached by middleware components
   * Useful for passing information between middleware in the pipeline
   */
  metadata?: Record<string, any>;
  
  /**
   * The user ID associated with this operation, if available
   * Used for audit logging and access control
   */
  userId?: string;
  
  /**
   * A unique identifier for this database operation
   * Used for correlating logs and traces across the system
   */
  operationId?: string;
  
  /**
   * The trace ID for distributed tracing, if available
   * Used to correlate this database operation with the broader request context
   */
  traceId?: string;
  
  /**
   * Whether this operation is part of a transaction
   */
  isTransaction?: boolean;
  
  /**
   * The transaction ID if this operation is part of a transaction
   */
  transactionId?: string;
  
  /**
   * Whether this is a read-only operation
   * Used for optimization and caching decisions
   */
  isReadOnly?: boolean;
  
  /**
   * The service name that initiated this database operation
   * Useful for cross-service tracing and debugging
   */
  serviceName?: string;
  
  /**
   * The environment in which this operation is being executed
   * (e.g., 'development', 'staging', 'production')
   */
  environment?: string;
}

/**
 * The core interface for all database middleware components.
 * Middleware can intercept and modify database operations before and after execution.
 */
export interface DatabaseMiddleware {
  /**
   * Unique identifier for this middleware instance
   */
  readonly id: string;
  
  /**
   * Human-readable name for this middleware
   */
  readonly name: string;
  
  /**
   * Optional priority value that determines the order of middleware execution
   * Lower values execute earlier in the beforeExecute phase and later in the afterExecute phase
   * Default is 100
   */
  readonly priority?: number;
  
  /**
   * Executed before the database operation is performed
   * Can modify the operation arguments or context
   * Can short-circuit the middleware pipeline by throwing an exception
   * 
   * @param params The operation parameters
   * @param context The middleware context
   * @returns Modified params or the original params
   * @throws DatabaseException if the operation should be aborted
   */
  beforeExecute<T extends any>(params: T, context: MiddlewareContext): Promise<T>;
  
  /**
   * Executed after the database operation is performed
   * Can modify the operation result or handle errors
   * 
   * @param result The operation result or null if an error occurred
   * @param context The middleware context, including the error if one occurred
   * @returns Modified result or the original result
   * @throws DatabaseException if error handling fails
   */
  afterExecute<T extends any>(result: T | null, context: MiddlewareContext): Promise<T | null>;
}

/**
 * Configuration options for middleware components
 */
export interface MiddlewareOptions {
  /**
   * Whether this middleware is enabled
   * Default is true
   */
  enabled?: boolean;
  
  /**
   * Priority value that determines the order of middleware execution
   * Lower values execute earlier in the beforeExecute phase and later in the afterExecute phase
   * Default is 100
   */
  priority?: number;
  
  /**
   * Journey types this middleware applies to
   * If not specified, applies to all journeys
   */
  journeys?: JourneyType[];
  
  /**
   * Model names this middleware applies to
   * If not specified, applies to all models
   */
  models?: string[];
  
  /**
   * Operation types this middleware applies to
   * If not specified, applies to all operations
   */
  operations?: string[];
  
  /**
   * Whether to apply this middleware to read operations
   * Default is true
   */
  applyToReadOperations?: boolean;
  
  /**
   * Whether to apply this middleware to write operations
   * Default is true
   */
  applyToWriteOperations?: boolean;
  
  /**
   * Whether to apply this middleware to transactions
   * Default is true
   */
  applyToTransactions?: boolean;
  
  /**
   * Environment(s) in which this middleware should be active
   * If not specified, active in all environments
   */
  environments?: string[];
  
  /**
   * Additional configuration options specific to the middleware implementation
   */
  [key: string]: any;
}

/**
 * Interface for logging middleware that captures and logs database operations
 */
export interface LoggingMiddleware extends DatabaseMiddleware {
  /**
   * Configuration for logging behavior
   */
  options: LoggingMiddlewareOptions;
}

/**
 * Configuration options specific to logging middleware
 */
export interface LoggingMiddlewareOptions extends MiddlewareOptions {
  /**
   * Log level to use for database operations
   * Default is 'debug'
   */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  
  /**
   * Whether to log query parameters
   * May contain sensitive data, so use with caution
   * Default is false
   */
  logParams?: boolean;
  
  /**
   * Whether to log query results
   * May contain sensitive data, so use with caution
   * Default is false
   */
  logResults?: boolean;
  
  /**
   * Maximum size of logged parameters or results
   * Objects larger than this will be truncated
   * Default is 1000 characters
   */
  maxLogSize?: number;
  
  /**
   * Fields to redact from logs for privacy/security
   * Default includes common sensitive fields like 'password', 'token', etc.
   */
  sensitiveFields?: string[];
}

/**
 * Interface for performance monitoring middleware that tracks query execution times
 */
export interface PerformanceMiddleware extends DatabaseMiddleware {
  /**
   * Configuration for performance monitoring behavior
   */
  options: PerformanceMiddlewareOptions;
  
  /**
   * Reports a slow query to the monitoring system
   * 
   * @param context The middleware context with timing information
   * @param duration The query duration in milliseconds
   */
  reportSlowQuery(context: MiddlewareContext, duration: number): Promise<void>;
}

/**
 * Configuration options specific to performance middleware
 */
export interface PerformanceMiddlewareOptions extends MiddlewareOptions {
  /**
   * Threshold in milliseconds above which a query is considered slow
   * Default is 100ms
   */
  slowQueryThreshold?: number;
  
  /**
   * Whether to collect query execution metrics
   * Default is true
   */
  collectMetrics?: boolean;
  
  /**
   * Whether to track query patterns for optimization suggestions
   * Default is true
   */
  trackQueryPatterns?: boolean;
  
  /**
   * Journey-specific performance thresholds
   * Allows for different performance expectations per journey
   */
  journeyThresholds?: Record<JourneyType, number>;
}

/**
 * Interface for transformation middleware that modifies database operations
 */
export interface TransformationMiddleware extends DatabaseMiddleware {
  /**
   * Configuration for transformation behavior
   */
  options: TransformationMiddlewareOptions;
}

/**
 * Configuration options specific to transformation middleware
 */
export interface TransformationMiddlewareOptions extends MiddlewareOptions {
  /**
   * Whether to apply soft deletion transformation
   * Automatically adds isDeleted=false to queries
   * Default is true
   */
  applySoftDeletion?: boolean;
  
  /**
   * Whether to apply automatic timestamps
   * Adds createdAt and updatedAt fields
   * Default is true
   */
  applyTimestamps?: boolean;
  
  /**
   * Whether to apply tenant isolation
   * Automatically adds tenantId to queries
   * Default is false
   */
  applyTenantIsolation?: boolean;
  
  /**
   * Custom transformers to apply to specific models or operations
   */
  customTransformers?: Record<string, (params: any, context: MiddlewareContext) => Promise<any>>;
}

/**
 * Interface for circuit breaker middleware that prevents cascading failures
 */
export interface CircuitBreakerMiddleware extends DatabaseMiddleware {
  /**
   * Configuration for circuit breaker behavior
   */
  options: CircuitBreakerOptions;
  
  /**
   * Current state of the circuit breaker
   */
  readonly state: 'closed' | 'open' | 'half-open';
  
  /**
   * Opens the circuit, preventing further operations
   */
  openCircuit(): void;
  
  /**
   * Closes the circuit, allowing operations to proceed normally
   */
  closeCircuit(): void;
  
  /**
   * Transitions to half-open state to test if the system has recovered
   */
  halfOpenCircuit(): void;
}

/**
 * Configuration options specific to circuit breaker middleware
 */
export interface CircuitBreakerOptions extends MiddlewareOptions {
  /**
   * Number of failures required to open the circuit
   * Default is 5
   */
  failureThreshold?: number;
  
  /**
   * Time in milliseconds to keep the circuit open before testing recovery
   * Default is 30000 (30 seconds)
   */
  resetTimeout?: number;
  
  /**
   * Number of successful operations required to close the circuit
   * Default is 3
   */
  successThreshold?: number;
  
  /**
   * Types of errors that should count as failures
   * Default is all error types except client errors
   */
  failureErrorTypes?: DatabaseErrorType[];
}

/**
 * Interface for retry middleware that automatically retries failed operations
 */
export interface RetryMiddleware extends DatabaseMiddleware {
  /**
   * Configuration for retry behavior
   */
  options: RetryOptions;
  
  /**
   * Determines if an operation should be retried based on the error
   * 
   * @param error The error that occurred
   * @param context The middleware context
   * @param attempt The current attempt number (1-based)
   * @returns True if the operation should be retried, false otherwise
   */
  shouldRetry(error: Error | DatabaseException, context: MiddlewareContext, attempt: number): Promise<boolean>;
  
  /**
   * Calculates the delay before the next retry attempt
   * 
   * @param attempt The current attempt number (1-based)
   * @returns The delay in milliseconds before the next retry
   */
  calculateRetryDelay(attempt: number): Promise<number>;
}

/**
 * Configuration options specific to retry middleware
 */
export interface RetryOptions extends MiddlewareOptions {
  /**
   * Maximum number of retry attempts
   * Default is 3
   */
  maxAttempts?: number;
  
  /**
   * Base delay in milliseconds between retry attempts
   * Default is 100ms
   */
  baseDelay?: number;
  
  /**
   * Whether to use exponential backoff for retry delays
   * Default is true
   */
  useExponentialBackoff?: boolean;
  
  /**
   * Whether to add jitter to retry delays to prevent thundering herd
   * Default is true
   */
  useJitter?: boolean;
  
  /**
   * Types of errors that should be retried
   * Default is transient errors like connection and timeout issues
   */
  retryableErrorTypes?: DatabaseErrorType[];
}

/**
 * Interface for caching middleware that caches query results
 */
export interface CachingMiddleware extends DatabaseMiddleware {
  /**
   * Configuration for caching behavior
   */
  options: CachingOptions;
  
  /**
   * Invalidates cache entries for a specific model
   * 
   * @param model The model name to invalidate
   * @param id Optional specific entity ID to invalidate
   */
  invalidateCache(model: string, id?: string | number): Promise<void>;
}

/**
 * Configuration options specific to caching middleware
 */
export interface CachingOptions extends MiddlewareOptions {
  /**
   * TTL (time to live) for cache entries in seconds
   * Default is 300 (5 minutes)
   */
  ttl?: number;
  
  /**
   * Maximum number of entries to cache per model
   * Default is 1000
   */
  maxEntries?: number;
  
  /**
   * Whether to cache query results
   * Default is true
   */
  cacheQueries?: boolean;
  
  /**
   * Operations that should be cached
   * Default is ['findUnique', 'findFirst', 'findMany']
   */
  cacheableOperations?: string[];
  
  /**
   * Models that should not be cached
   * Default is empty array
   */
  excludedModels?: string[];
}

/**
 * Interface for audit logging middleware that records database changes for compliance
 */
export interface AuditMiddleware extends DatabaseMiddleware {
  /**
   * Configuration for audit behavior
   */
  options: AuditOptions;
}

/**
 * Configuration options specific to audit middleware
 */
export interface AuditOptions extends MiddlewareOptions {
  /**
   * Whether to record the previous state of entities
   * Default is true
   */
  recordPreviousState?: boolean;
  
  /**
   * Whether to record the user who made the change
   * Default is true
   */
  recordUser?: boolean;
  
  /**
   * Fields to exclude from audit logs for privacy/security
   * Default includes common sensitive fields
   */
  excludedFields?: string[];
  
  /**
   * Models that require audit logging
   * If empty, all models are audited
   */
  auditedModels?: string[];
  
  /**
   * Operations that should be audited
   * Default is ['create', 'update', 'delete']
   */
  auditedOperations?: string[];
}

/**
 * Factory interface for creating middleware instances
 */
export interface MiddlewareFactory<T extends DatabaseMiddleware = DatabaseMiddleware> {
  /**
   * Creates a new middleware instance with the specified options
   * 
   * @param options Configuration options for the middleware
   * @returns A configured middleware instance
   */
  create(options?: MiddlewareOptions): T;
  
  /**
   * The type of middleware this factory creates
   */
  readonly middlewareType: string;
  
  /**
   * Default options for this middleware type
   */
  readonly defaultOptions: MiddlewareOptions;
}

/**
 * Registry interface for managing middleware instances
 */
export interface MiddlewareRegistry {
  /**
   * Registers a middleware instance with the registry
   * 
   * @param middleware The middleware instance to register
   */
  register(middleware: DatabaseMiddleware): void;
  
  /**
   * Unregisters a middleware instance from the registry
   * 
   * @param middlewareId The ID of the middleware to unregister
   */
  unregister(middlewareId: string): void;
  
  /**
   * Gets all registered middleware instances
   * 
   * @returns Array of registered middleware instances
   */
  getAll(): DatabaseMiddleware[];
  
  /**
   * Gets middleware instances applicable to a specific context
   * 
   * @param context The middleware context to filter by
   * @returns Array of applicable middleware instances, sorted by priority
   */
  getApplicable(context: MiddlewareContext): DatabaseMiddleware[];
  
  /**
   * Gets middleware instances of a specific type
   * 
   * @param type The middleware type to filter by
   * @returns Array of middleware instances of the specified type
   */
  getByType<T extends DatabaseMiddleware>(type: new (...args: any[]) => T): T[];
  
  /**
   * Gets a middleware instance by ID
   * 
   * @param id The middleware ID
   * @returns The middleware instance or undefined if not found
   */
  getById(id: string): DatabaseMiddleware | undefined;
  
  /**
   * Registers a middleware factory with the registry
   * 
   * @param factory The middleware factory to register
   */
  registerFactory<T extends DatabaseMiddleware>(factory: MiddlewareFactory<T>): void;
  
  /**
   * Creates a middleware instance from a registered factory
   * 
   * @param type The middleware type
   * @param options Configuration options for the middleware
   * @returns A configured middleware instance
   */
  createMiddleware<T extends DatabaseMiddleware>(type: string, options?: MiddlewareOptions): T;
}

/**
 * Middleware pipeline that executes a chain of middleware for a database operation
 */
export interface MiddlewarePipeline {
  /**
   * Executes the database operation with all applicable middleware
   * 
   * @param client The Prisma client instance
   * @param model The model being operated on
   * @param operation The operation being performed
   * @param args The operation arguments
   * @param context Additional context for the operation
   * @returns The result of the operation after middleware processing
   */
  execute<T = any>(
    client: PrismaClient,
    model: string,
    operation: string,
    args: any,
    context?: Partial<MiddlewareContext>
  ): Promise<T>;
  
  /**
   * Executes a database transaction with middleware support
   * 
   * @param client The Prisma client instance
   * @param callback The transaction callback function
   * @param options Transaction options
   * @param context Additional context for the transaction
   * @returns The result of the transaction
   */
  executeTransaction<T = any>(
    client: PrismaClient,
    callback: (tx: PrismaClient) => Promise<T>,
    options?: TransactionOptions,
    context?: Partial<MiddlewareContext>
  ): Promise<T>;
  
  /**
   * Adds a middleware to the pipeline
   * 
   * @param middleware The middleware to add
   */
  addMiddleware(middleware: DatabaseMiddleware): void;
  
  /**
   * Removes a middleware from the pipeline
   * 
   * @param middlewareId The ID of the middleware to remove
   */
  removeMiddleware(middlewareId: string): void;
}
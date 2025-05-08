import { Injectable, Logger } from '@nestjs/common';
import { PrismaClientKnownRequestError, PrismaClientUnknownRequestError, PrismaClientRustPanicError, PrismaClientInitializationError } from '@prisma/client/runtime/library';
import { JourneyType } from '@austa/interfaces/common';

import { IDatabaseErrorHandler, IRetryStrategy } from './interfaces';
import { ERROR_CLASSIFICATION, RETRY_STRATEGY, ENVIRONMENT_DEFAULTS } from './constants';
import { 
  DatabaseException, 
  ConnectionException,
  TransactionException,
  QueryException,
  ConstraintViolationException,
  ResourceNotFoundException,
  SchemaException
} from '../exceptions/database.exception';
import { RetryUtils } from '../exceptions/retry.utils';

/**
 * Retry strategy implementation for database operations
 */
@Injectable()
export class DatabaseRetryStrategy implements IRetryStrategy {
  /**
   * Maximum number of retry attempts
   */
  public readonly maxRetries: number;

  /**
   * Base delay in milliseconds between retry attempts
   */
  public readonly baseDelay: number;

  /**
   * Maximum delay in milliseconds between retry attempts
   */
  public readonly maxDelay: number;

  /**
   * Whether to use exponential backoff for retry delays
   */
  public readonly useExponentialBackoff: boolean;

  /**
   * Whether to add jitter to retry delays to prevent thundering herd problems
   */
  public readonly useJitter: boolean;

  /**
   * Creates a new DatabaseRetryStrategy with the specified configuration
   * 
   * @param maxRetries Maximum number of retry attempts
   * @param baseDelay Base delay in milliseconds between retry attempts
   * @param maxDelay Maximum delay in milliseconds between retry attempts
   * @param useExponentialBackoff Whether to use exponential backoff for retry delays
   * @param useJitter Whether to add jitter to retry delays
   */
  constructor(
    maxRetries: number = RETRY_STRATEGY.DEFAULT_MAX_RETRIES,
    baseDelay: number = RETRY_STRATEGY.BASE_DELAY_MS,
    maxDelay: number = RETRY_STRATEGY.MAX_DELAY_MS,
    useExponentialBackoff: boolean = true,
    useJitter: boolean = true,
  ) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
    this.useExponentialBackoff = useExponentialBackoff;
    this.useJitter = useJitter;
  }

  /**
   * Calculate the delay for a specific retry attempt
   * 
   * @param attempt The current retry attempt number (1-based)
   * @returns The delay in milliseconds before the next retry
   */
  calculateDelay(attempt: number): number {
    // Start with base delay
    let delay = this.baseDelay;

    // Apply exponential backoff if enabled
    if (this.useExponentialBackoff) {
      delay = delay * Math.pow(RETRY_STRATEGY.BACKOFF_FACTOR, attempt - 1);
    }

    // Apply jitter if enabled to prevent thundering herd problem
    if (this.useJitter) {
      const jitterFactor = 1 + (Math.random() * 2 - 1) * RETRY_STRATEGY.JITTER_FACTOR;
      delay = delay * jitterFactor;
    }

    // Cap at maximum delay
    return Math.min(delay, this.maxDelay);
  }

  /**
   * Determine if a retry should be attempted based on the error and attempt number
   * 
   * @param error The error that occurred
   * @param attempt The current retry attempt number (1-based)
   * @returns Boolean indicating if a retry should be attempted
   */
  shouldRetry(error: Error, attempt: number): boolean {
    // Don't retry if we've exceeded max attempts
    if (attempt >= this.maxRetries) {
      return false;
    }

    // Use DatabaseException's built-in shouldRetry if available
    if (error instanceof DatabaseException) {
      return error.shouldRetry();
    }

    // Check for known transient error patterns in the message
    const errorMessage = error.message.toLowerCase();
    return (
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('network') ||
      errorMessage.includes('temporarily unavailable') ||
      errorMessage.includes('deadlock') ||
      errorMessage.includes('too many connections') ||
      errorMessage.includes('connection pool') ||
      errorMessage.includes('throttled')
    );
  }

  /**
   * Create a journey-specific retry strategy
   * 
   * @param journeyType The journey type to create a strategy for
   * @returns A retry strategy configured for the specified journey
   */
  static forJourney(journeyType: JourneyType): DatabaseRetryStrategy {
    const maxRetries = RETRY_STRATEGY.JOURNEY_RETRIES[journeyType] || 
                       RETRY_STRATEGY.DEFAULT_MAX_RETRIES;
    
    return new DatabaseRetryStrategy(
      maxRetries,
      RETRY_STRATEGY.BASE_DELAY_MS,
      RETRY_STRATEGY.MAX_DELAY_MS,
      true,
      true
    );
  }

  /**
   * Create a retry strategy for critical operations
   * 
   * @returns A retry strategy configured for critical operations
   */
  static forCriticalOperation(): DatabaseRetryStrategy {
    return new DatabaseRetryStrategy(
      RETRY_STRATEGY.CRITICAL_OPERATION_MAX_RETRIES,
      RETRY_STRATEGY.BASE_DELAY_MS,
      RETRY_STRATEGY.MAX_DELAY_MS,
      true,
      true
    );
  }
}

/**
 * Service for handling database errors in the gamification engine
 * Implements comprehensive error handling, classification, and retry strategies
 */
@Injectable()
export class DatabaseErrorHandlerService implements IDatabaseErrorHandler {
  private readonly logger = new Logger(DatabaseErrorHandlerService.name);
  private readonly defaultRetryStrategy: DatabaseRetryStrategy;
  private readonly journeyRetryStrategies: Map<JourneyType, DatabaseRetryStrategy>;
  private readonly environment: string;

  constructor() {
    this.defaultRetryStrategy = new DatabaseRetryStrategy();
    this.journeyRetryStrategies = new Map<JourneyType, DatabaseRetryStrategy>();
    
    // Initialize journey-specific retry strategies
    Object.values(JourneyType).forEach(journeyType => {
      this.journeyRetryStrategies.set(
        journeyType,
        DatabaseRetryStrategy.forJourney(journeyType)
      );
    });

    // Get current environment
    this.environment = process.env.NODE_ENV || 'development';
  }

  /**
   * Handle a database error and transform it into an application-specific error
   * 
   * @param error The original database error
   * @param context Additional context information for the error
   * @returns The transformed error
   */
  handleError(error: Error, context: Record<string, any> = {}): Error {
    // If already a DatabaseException, just add context and return
    if (error instanceof DatabaseException) {
      this.logError(error, context);
      return error;
    }

    // Transform Prisma errors into DatabaseExceptions
    let transformedError: Error;

    if (
      error instanceof PrismaClientKnownRequestError ||
      error instanceof PrismaClientUnknownRequestError ||
      error instanceof PrismaClientRustPanicError ||
      error instanceof PrismaClientInitializationError
    ) {
      transformedError = this.transformPrismaError(error, context);
    } else {
      // Generic error transformation
      transformedError = this.transformGenericError(error, context);
    }

    // Log the transformed error
    this.logError(transformedError, context);

    return transformedError;
  }

  /**
   * Determine if an error is a transient error that can be retried
   * 
   * @param error The error to check
   * @returns Boolean indicating if the error is transient
   */
  isTransientError(error: Error): boolean {
    // If it's a DatabaseException, use its built-in method
    if (error instanceof DatabaseException) {
      return error.shouldRetry();
    }

    // For Prisma errors, check the error code
    if (error instanceof PrismaClientKnownRequestError) {
      const recoverability = ERROR_CLASSIFICATION.PRISMA_ERROR_RECOVERABILITY[error.code];
      return recoverability === ERROR_CLASSIFICATION.RECOVERABILITY.TRANSIENT;
    }

    // For other errors, check common patterns in the message
    const errorMessage = error.message.toLowerCase();
    return (
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('network') ||
      errorMessage.includes('temporarily unavailable') ||
      errorMessage.includes('deadlock') ||
      errorMessage.includes('too many connections') ||
      errorMessage.includes('connection pool') ||
      errorMessage.includes('throttled')
    );
  }

  /**
   * Get a retry strategy for a specific error
   * 
   * @param error The error to get a retry strategy for
   * @param journeyType Optional journey type for context-specific strategies
   * @returns The retry strategy configuration
   */
  getRetryStrategy(error: Error, journeyType?: JourneyType): IRetryStrategy {
    // If a journey type is provided, use its specific strategy
    if (journeyType && this.journeyRetryStrategies.has(journeyType)) {
      return this.journeyRetryStrategies.get(journeyType)!;
    }

    // For critical errors, use a more aggressive retry strategy
    if (error instanceof DatabaseException && 
        error.severity === 'CRITICAL') {
      return DatabaseRetryStrategy.forCriticalOperation();
    }

    // Default strategy
    return this.defaultRetryStrategy;
  }

  /**
   * Log a database error with appropriate context
   * 
   * @param error The error to log
   * @param context Additional context information for the error
   */
  logError(error: Error, context: Record<string, any> = {}): void {
    // Prepare context for logging
    const logContext = {
      ...context,
      errorType: error.constructor.name,
    };

    // Add metadata from DatabaseException if available
    if (error instanceof DatabaseException) {
      Object.assign(logContext, {
        category: error.category,
        severity: error.severity,
        isTransient: error.isTransient,
        isRecoverable: error.isRecoverable,
        databaseContext: error.context,
      });

      // Log based on severity
      switch (error.severity) {
        case 'CRITICAL':
          this.logger.error(
            `CRITICAL DATABASE ERROR: ${error.message}`,
            error.stack,
            logContext
          );
          break;
        case 'HIGH':
          this.logger.error(
            `DATABASE ERROR: ${error.message}`,
            error.stack,
            logContext
          );
          break;
        case 'MEDIUM':
          this.logger.warn(
            `Database warning: ${error.message}`,
            logContext
          );
          break;
        case 'LOW':
          this.logger.log(
            `Database notice: ${error.message}`,
            logContext
          );
          break;
        default:
          this.logger.warn(
            `Database error: ${error.message}`,
            logContext
          );
      }
    } else {
      // Generic error logging
      this.logger.error(
        `Database error: ${error.message}`,
        error.stack,
        logContext
      );
    }
  }

  /**
   * Execute a database operation with automatic retry for transient errors
   * 
   * @param operation Function to execute
   * @param context Context information for error handling
   * @param journeyType Optional journey type for context-specific retry strategies
   * @returns Promise resolving to the operation result
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: Record<string, any> = {},
    journeyType?: JourneyType
  ): Promise<T> {
    try {
      return await RetryUtils.withRetry(
        operation,
        {
          maxAttempts: journeyType ? 
            RETRY_STRATEGY.JOURNEY_RETRIES[journeyType] : 
            RETRY_STRATEGY.DEFAULT_MAX_RETRIES,
          baseDelayMs: RETRY_STRATEGY.BASE_DELAY_MS,
          maxDelayMs: RETRY_STRATEGY.MAX_DELAY_MS,
          jitterFactor: RETRY_STRATEGY.JITTER_FACTOR,
          retryableErrors: [DatabaseException],
          onRetry: (error, attempt, delay) => {
            this.logger.warn(
              `Retrying database operation after error (attempt ${attempt}): ${error.message}`,
              {
                ...context,
                attempt,
                delay,
                errorType: error.constructor.name,
              }
            );
          },
        }
      );
    } catch (error) {
      // Transform and log the error before rethrowing
      throw this.handleError(error instanceof Error ? error : new Error(String(error)), context);
    }
  }

  /**
   * Transform a Prisma error into a DatabaseException
   * 
   * @param error The Prisma error to transform
   * @param context Additional context information
   * @returns Transformed DatabaseException
   */
  private transformPrismaError(error: Error, context: Record<string, any> = {}): Error {
    // For known request errors with error codes
    if (error instanceof PrismaClientKnownRequestError) {
      return this.transformPrismaKnownError(error, context);
    }
    
    // For unknown request errors
    if (error instanceof PrismaClientUnknownRequestError) {
      return this.transformPrismaUnknownError(error, context);
    }
    
    // For Rust panic errors (critical internal errors)
    if (error instanceof PrismaClientRustPanicError) {
      return new DatabaseException(
        `Critical database engine error: ${error.message}`,
        'CRITICAL_ERROR',
        'UNKNOWN',
        'CRITICAL',
        this.createErrorContext(error, context),
        error,
        false, // Not transient
        false  // Not recoverable
      );
    }
    
    // For initialization errors
    if (error instanceof PrismaClientInitializationError) {
      return this.transformPrismaInitializationError(error, context);
    }
    
    // Fallback for other Prisma errors
    return new DatabaseException(
      `Database error: ${error.message}`,
      'DATABASE_ERROR',
      'UNKNOWN',
      'MEDIUM',
      this.createErrorContext(error, context),
      error,
      this.isTransientError(error),
      this.isTransientError(error)
    );
  }

  /**
   * Transform a Prisma known request error into a DatabaseException
   * 
   * @param error The Prisma known request error
   * @param context Additional context information
   * @returns Transformed DatabaseException
   */
  private transformPrismaKnownError(
    error: PrismaClientKnownRequestError,
    context: Record<string, any>
  ): Error {
    // Get error category from mappings
    const category = ERROR_CLASSIFICATION.PRISMA_ERROR_MAPPINGS[error.code] || 'UNKNOWN';
    
    // Get recoverability classification
    const recoverability = ERROR_CLASSIFICATION.PRISMA_ERROR_RECOVERABILITY[error.code] || 
                          ERROR_CLASSIFICATION.RECOVERABILITY.PERMANENT;
    
    // Determine if error is transient based on recoverability
    const isTransient = recoverability === ERROR_CLASSIFICATION.RECOVERABILITY.TRANSIENT;
    
    // Create error context with Prisma-specific information
    const errorContext = this.createErrorContext(error, {
      ...context,
      prismaCode: error.code,
      model: error.meta?.model,
      field: error.meta?.field_name,
      target: error.meta?.target,
    });
    
    // Map to specific exception types based on category
    switch (category) {
      case ERROR_CLASSIFICATION.CATEGORIES.CONNECTION:
        return new ConnectionException(
          `Database connection error: ${error.message}`,
          errorContext,
          error,
          isTransient,
          isTransient // Recoverable if transient
        );
        
      case ERROR_CLASSIFICATION.CATEGORIES.TRANSACTION:
        return new TransactionException(
          `Database transaction error: ${error.message}`,
          errorContext,
          error,
          isTransient,
          isTransient // Recoverable if transient
        );
        
      case ERROR_CLASSIFICATION.CATEGORIES.QUERY:
        // Special handling for not found errors
        if (error.code === 'P2001' || error.code === 'P2025') {
          return new ResourceNotFoundException(
            `Resource not found: ${error.message}`,
            errorContext,
            error,
            false, // Not transient
            false  // Not recoverable
          );
        }
        
        // Special handling for constraint violations
        if (error.code === 'P2002' || error.code === 'P2003' || 
            error.code === 'P2004' || error.code === 'P2011') {
          return new ConstraintViolationException(
            `Constraint violation: ${error.message}`,
            errorContext,
            error,
            false, // Not transient
            false  // Not recoverable
          );
        }
        
        return new QueryException(
          `Query error: ${error.message}`,
          errorContext,
          error,
          isTransient,
          isTransient // Recoverable if transient
        );
        
      case ERROR_CLASSIFICATION.CATEGORIES.DATA_INTEGRITY:
        return new ConstraintViolationException(
          `Data integrity error: ${error.message}`,
          errorContext,
          error,
          false, // Not transient
          false  // Not recoverable
        );
        
      case ERROR_CLASSIFICATION.CATEGORIES.CONFIGURATION:
        return new SchemaException(
          `Database configuration error: ${error.message}`,
          errorContext,
          error,
          false, // Not transient
          false  // Not recoverable
        );
        
      default:
        return new DatabaseException(
          `Database error: ${error.message}`,
          'DATABASE_ERROR',
          'UNKNOWN',
          'MEDIUM',
          errorContext,
          error,
          isTransient,
          isTransient // Recoverable if transient
        );
    }
  }

  /**
   * Transform a Prisma unknown request error into a DatabaseException
   * 
   * @param error The Prisma unknown request error
   * @param context Additional context information
   * @returns Transformed DatabaseException
   */
  private transformPrismaUnknownError(
    error: PrismaClientUnknownRequestError,
    context: Record<string, any>
  ): Error {
    const errorMessage = error.message.toLowerCase();
    const errorContext = this.createErrorContext(error, context);
    
    // Try to categorize based on error message patterns
    if (errorMessage.includes('connection') || 
        errorMessage.includes('network') || 
        errorMessage.includes('timeout')) {
      return new ConnectionException(
        `Database connection error: ${error.message}`,
        errorContext,
        error,
        true,  // Transient
        true   // Recoverable
      );
    }
    
    if (errorMessage.includes('transaction')) {
      return new TransactionException(
        `Database transaction error: ${error.message}`,
        errorContext,
        error,
        true,  // Transient
        true   // Recoverable
      );
    }
    
    if (errorMessage.includes('constraint') || 
        errorMessage.includes('violation') || 
        errorMessage.includes('duplicate')) {
      return new ConstraintViolationException(
        `Constraint violation: ${error.message}`,
        errorContext,
        error,
        false, // Not transient
        false  // Not recoverable
      );
    }
    
    if (errorMessage.includes('not found') || 
        errorMessage.includes('does not exist')) {
      return new ResourceNotFoundException(
        `Resource not found: ${error.message}`,
        errorContext,
        error,
        false, // Not transient
        false  // Not recoverable
      );
    }
    
    // Default to unknown database error
    return new DatabaseException(
      `Database error: ${error.message}`,
      'DATABASE_ERROR',
      'UNKNOWN',
      'MEDIUM',
      errorContext,
      error,
      this.isTransientError(error),
      this.isTransientError(error)
    );
  }

  /**
   * Transform a Prisma initialization error into a DatabaseException
   * 
   * @param error The Prisma initialization error
   * @param context Additional context information
   * @returns Transformed DatabaseException
   */
  private transformPrismaInitializationError(
    error: PrismaClientInitializationError,
    context: Record<string, any>
  ): Error {
    const errorMessage = error.message.toLowerCase();
    const errorContext = this.createErrorContext(error, context);
    
    // Categorize based on error message patterns
    if (errorMessage.includes('connection') || 
        errorMessage.includes('connect')) {
      return new ConnectionException(
        `Database connection initialization failed: ${error.message}`,
        errorContext,
        error,
        true,  // Transient
        true   // Recoverable
      );
    }
    
    if (errorMessage.includes('schema') || 
        errorMessage.includes('migration')) {
      return new SchemaException(
        `Database schema initialization failed: ${error.message}`,
        errorContext,
        error,
        false, // Not transient
        false  // Not recoverable
      );
    }
    
    // Default initialization error
    return new DatabaseException(
      `Database initialization failed: ${error.message}`,
      'INITIALIZATION_ERROR',
      'UNKNOWN',
      'CRITICAL',
      errorContext,
      error,
      false, // Not transient
      false  // Not recoverable
    );
  }

  /**
   * Transform a generic error into a DatabaseException
   * 
   * @param error The generic error to transform
   * @param context Additional context information
   * @returns Transformed DatabaseException
   */
  private transformGenericError(error: Error, context: Record<string, any> = {}): Error {
    const errorMessage = error.message.toLowerCase();
    const errorContext = this.createErrorContext(error, context);
    const isTransient = this.isTransientError(error);
    
    // Try to categorize based on error message patterns
    if (errorMessage.includes('connection') || 
        errorMessage.includes('network') || 
        errorMessage.includes('timeout')) {
      return new ConnectionException(
        `Database connection error: ${error.message}`,
        errorContext,
        error,
        isTransient,
        isTransient
      );
    }
    
    if (errorMessage.includes('transaction')) {
      return new TransactionException(
        `Database transaction error: ${error.message}`,
        errorContext,
        error,
        isTransient,
        isTransient
      );
    }
    
    // Default to generic database error
    return new DatabaseException(
      `Database error: ${error.message}`,
      'DATABASE_ERROR',
      'UNKNOWN',
      'MEDIUM',
      errorContext,
      error,
      isTransient,
      isTransient
    );
  }

  /**
   * Create a standardized error context object
   * 
   * @param error The original error
   * @param additionalContext Additional context information
   * @returns Standardized error context object
   */
  private createErrorContext(error: Error, additionalContext: Record<string, any> = {}): Record<string, any> {
    return {
      errorType: error.constructor.name,
      timestamp: new Date().toISOString(),
      environment: this.environment,
      ...additionalContext,
    };
  }
}
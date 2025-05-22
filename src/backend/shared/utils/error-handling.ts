/**
 * Error Handling Utilities
 * 
 * This module provides utilities for consistent error handling across all backend services.
 * It implements the error classification system described in the technical specification,
 * with utilities for categorizing errors, generating standardized error responses,
 * and implementing recovery strategies like retries and fallbacks.
 */

import { BaseError, ErrorType, ErrorCategory } from '@austa/errors';
import { Logger } from '@austa/logging';

// Constants for retry configuration
const DEFAULT_RETRY_OPTIONS = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffFactor: 2,
  jitter: true,
};

// Constants for circuit breaker configuration
const DEFAULT_CIRCUIT_BREAKER_OPTIONS = {
  failureThreshold: 5,
  resetTimeoutMs: 30000,
  halfOpenSuccessThreshold: 2,
};

/**
 * Options for retry operations
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay between retries in milliseconds */
  initialDelayMs: number;
  /** Maximum delay between retries in milliseconds */
  maxDelayMs: number;
  /** Exponential backoff multiplier */
  backoffFactor: number;
  /** Whether to add random jitter to retry delays */
  jitter: boolean;
}

/**
 * Options for circuit breaker operations
 */
export interface CircuitBreakerOptions {
  /** Number of failures before opening the circuit */
  failureThreshold: number;
  /** Time in milliseconds before attempting to close the circuit */
  resetTimeoutMs: number;
  /** Number of successful operations in half-open state to close the circuit */
  halfOpenSuccessThreshold: number;
}

/**
 * Options for fallback operations
 */
export interface FallbackOptions<T> {
  /** Default value to return if operation fails */
  defaultValue?: T;
  /** Function to retrieve cached data */
  getCachedData?: () => Promise<T>;
  /** Whether to throw the original error after applying fallback */
  throwOriginalError?: boolean;
}

/**
 * Context for error handling operations
 */
export interface ErrorHandlingContext {
  /** Logger instance for error logging */
  logger?: Logger;
  /** Correlation ID for tracking errors across services */
  correlationId?: string;
  /** User ID associated with the error */
  userId?: string;
  /** Journey context (health, care, plan) */
  journeyContext?: string;
  /** Additional metadata for error context */
  metadata?: Record<string, unknown>;
}

/**
 * Classifies an error based on its type and properties
 * 
 * @param error The error to classify
 * @returns The error category (CLIENT, SYSTEM, TRANSIENT, EXTERNAL)
 */
export function classifyError(error: unknown): ErrorCategory {
  // If it's already a BaseError from our framework, use its classification
  if (error instanceof BaseError) {
    return error.category;
  }

  // Handle standard HTTP errors
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    if (status >= 400 && status < 500) {
      return ErrorCategory.CLIENT;
    } else if (status >= 500) {
      return ErrorCategory.SYSTEM;
    }
  }

  // Handle network or timeout errors (likely transient)
  if (
    error instanceof Error && 
    (error.message.includes('timeout') || 
     error.message.includes('network') ||
     error.message.includes('connection') ||
     error.message.toLowerCase().includes('econnrefused') ||
     error.message.toLowerCase().includes('econnreset'))
  ) {
    return ErrorCategory.TRANSIENT;
  }

  // Handle external service errors
  if (
    error instanceof Error && 
    (error.message.includes('external') ||
     error.message.includes('third-party') ||
     error.message.includes('service unavailable'))
  ) {
    return ErrorCategory.EXTERNAL;
  }

  // Default to system error for unknown errors
  return ErrorCategory.SYSTEM;
}

/**
 * Determines if an error is retryable based on its category
 * 
 * @param error The error to check
 * @returns Whether the error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const category = classifyError(error);
  return category === ErrorCategory.TRANSIENT || category === ErrorCategory.EXTERNAL;
}

/**
 * Calculates the delay for the next retry attempt using exponential backoff
 * 
 * @param attempt Current attempt number (0-based)
 * @param options Retry options
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(attempt: number, options: Partial<RetryOptions> = {}): number {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  
  // Calculate exponential backoff
  let delay = opts.initialDelayMs * Math.pow(opts.backoffFactor, attempt);
  
  // Apply maximum delay cap
  delay = Math.min(delay, opts.maxDelayMs);
  
  // Add jitter if enabled (±20% randomness)
  if (opts.jitter) {
    const jitterFactor = 0.8 + (Math.random() * 0.4); // 0.8-1.2 range for ±20%
    delay = Math.floor(delay * jitterFactor);
  }
  
  return delay;
}

/**
 * Executes a function with retry logic using exponential backoff
 * 
 * @param fn Function to execute with retry logic
 * @param options Retry configuration options
 * @param context Error handling context
 * @returns Promise resolving to the function result
 * @throws The last error encountered if all retries fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  context: ErrorHandlingContext = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  const logger = context.logger;
  const correlationId = context.correlationId || 'unknown';
  
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      // First attempt (attempt=0) or retry attempts
      if (attempt > 0 && logger) {
        logger.debug(
          `Retry attempt ${attempt}/${opts.maxRetries} for operation`,
          { correlationId, attempt, maxRetries: opts.maxRetries, ...context.metadata }
        );
      }
      
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Log the error
      if (logger) {
        logger.warn(
          `Operation failed${attempt < opts.maxRetries ? ', will retry' : ', no more retries'}`,
          { 
            correlationId,
            attempt, 
            maxRetries: opts.maxRetries,
            error: error instanceof Error ? error.message : String(error),
            errorType: error instanceof BaseError ? error.type : 'unknown',
            errorCategory: classifyError(error),
            ...context.metadata
          }
        );
      }
      
      // If this was the last attempt or the error is not retryable, throw
      if (attempt >= opts.maxRetries || !isRetryableError(error)) {
        throw error;
      }
      
      // Calculate and wait for the backoff delay
      const delay = calculateBackoffDelay(attempt, opts);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached due to the throw in the loop,
  // but TypeScript needs it for type safety
  throw lastError;
}

/**
 * Circuit breaker state
 */
enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation, requests pass through
  OPEN = 'OPEN',         // Circuit is open, requests fail fast
  HALF_OPEN = 'HALF_OPEN' // Testing if the circuit can be closed again
}

/**
 * Simple in-memory circuit breaker implementation
 * For production use, consider a distributed circuit breaker with Redis
 */
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastStateChange = Date.now();
  private readonly options: CircuitBreakerOptions;
  private readonly name: string;
  private readonly logger?: Logger;
  
  constructor(name: string, options: Partial<CircuitBreakerOptions> = {}, logger?: Logger) {
    this.name = name;
    this.options = { ...DEFAULT_CIRCUIT_BREAKER_OPTIONS, ...options };
    this.logger = logger;
  }
  
  /**
   * Executes a function with circuit breaker protection
   * 
   * @param fn Function to execute
   * @returns Promise resolving to the function result
   * @throws Error if circuit is open or the function throws
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.checkState();
    
    // If circuit is open, fail fast
    if (this.state === CircuitState.OPEN) {
      this.logStateEvent('Circuit is OPEN, failing fast');
      throw new Error(`Circuit breaker '${this.name}' is open`);
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }
  
  /**
   * Handles successful execution
   */
  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      if (this.successCount >= this.options.halfOpenSuccessThreshold) {
        this.setState(CircuitState.CLOSED);
      }
    }
    
    // Reset failure count in closed state
    if (this.state === CircuitState.CLOSED) {
      this.failureCount = 0;
    }
  }
  
  /**
   * Handles execution failure
   */
  private onFailure(error: unknown): void {
    // In half-open state, any failure reopens the circuit
    if (this.state === CircuitState.HALF_OPEN) {
      this.setState(CircuitState.OPEN);
      return;
    }
    
    // In closed state, increment failure count
    if (this.state === CircuitState.CLOSED) {
      this.failureCount++;
      
      if (this.failureCount >= this.options.failureThreshold) {
        this.setState(CircuitState.OPEN);
      }
    }
  }
  
  /**
   * Checks and potentially updates the circuit state based on timing
   */
  private checkState(): void {
    // If circuit is open and reset timeout has elapsed, transition to half-open
    if (
      this.state === CircuitState.OPEN && 
      Date.now() - this.lastStateChange >= this.options.resetTimeoutMs
    ) {
      this.setState(CircuitState.HALF_OPEN);
    }
  }
  
  /**
   * Updates the circuit state
   */
  private setState(newState: CircuitState): void {
    if (this.state !== newState) {
      this.logStateEvent(`Circuit state changing from ${this.state} to ${newState}`);
      
      this.state = newState;
      this.lastStateChange = Date.now();
      
      // Reset counters on state change
      if (newState === CircuitState.HALF_OPEN) {
        this.successCount = 0;
      } else if (newState === CircuitState.CLOSED) {
        this.failureCount = 0;
      }
    }
  }
  
  /**
   * Logs circuit breaker state events
   */
  private logStateEvent(message: string): void {
    if (this.logger) {
      this.logger.info(`CircuitBreaker '${this.name}': ${message}`, {
        circuitBreaker: this.name,
        state: this.state,
        failureCount: this.failureCount,
        successCount: this.successCount,
        lastStateChange: new Date(this.lastStateChange).toISOString()
      });
    }
  }
}

// In-memory store of circuit breakers
const circuitBreakers = new Map<string, CircuitBreaker>();

/**
 * Gets or creates a circuit breaker instance
 * 
 * @param name Unique name for the circuit breaker
 * @param options Circuit breaker configuration options
 * @param logger Logger instance
 * @returns Circuit breaker instance
 */
export function getCircuitBreaker(
  name: string,
  options: Partial<CircuitBreakerOptions> = {},
  logger?: Logger
): CircuitBreaker {
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, new CircuitBreaker(name, options, logger));
  }
  
  return circuitBreakers.get(name)!;
}

/**
 * Executes a function with circuit breaker protection
 * 
 * @param name Unique name for the circuit breaker
 * @param fn Function to execute
 * @param options Circuit breaker configuration options
 * @param context Error handling context
 * @returns Promise resolving to the function result
 * @throws Error if circuit is open or the function throws
 */
export async function withCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  options: Partial<CircuitBreakerOptions> = {},
  context: ErrorHandlingContext = {}
): Promise<T> {
  const circuitBreaker = getCircuitBreaker(name, options, context.logger);
  return circuitBreaker.execute(fn);
}

/**
 * Executes a function with fallback strategies if it fails
 * 
 * @param fn Function to execute
 * @param options Fallback configuration options
 * @param context Error handling context
 * @returns Promise resolving to the function result or fallback value
 * @throws Original error if throwOriginalError is true and all fallbacks fail
 */
export async function withFallback<T>(
  fn: () => Promise<T>,
  options: FallbackOptions<T>,
  context: ErrorHandlingContext = {}
): Promise<T> {
  const logger = context.logger;
  const correlationId = context.correlationId || 'unknown';
  
  try {
    return await fn();
  } catch (error) {
    if (logger) {
      logger.warn(
        'Operation failed, attempting fallback strategies',
        {
          correlationId,
          error: error instanceof Error ? error.message : String(error),
          errorCategory: classifyError(error),
          ...context.metadata
        }
      );
    }
    
    // Try to get cached data if available
    if (options.getCachedData) {
      try {
        const cachedData = await options.getCachedData();
        
        if (logger) {
          logger.info(
            'Successfully retrieved cached data as fallback',
            { correlationId, usedCachedData: true, ...context.metadata }
          );
        }
        
        return cachedData;
      } catch (cacheError) {
        if (logger) {
          logger.warn(
            'Failed to retrieve cached data for fallback',
            {
              correlationId,
              cacheError: cacheError instanceof Error ? cacheError.message : String(cacheError),
              ...context.metadata
            }
          );
        }
      }
    }
    
    // Use default value if provided
    if ('defaultValue' in options) {
      if (logger) {
        logger.info(
          'Using default value as fallback',
          { correlationId, usedDefaultValue: true, ...context.metadata }
        );
      }
      
      return options.defaultValue as T;
    }
    
    // If we should throw the original error or no fallbacks were successful
    if (options.throwOriginalError !== false) {
      throw error;
    }
    
    // This should only be reached if throwOriginalError is explicitly false
    // and no fallbacks were successful
    throw new Error('All fallback strategies failed');
  }
}

/**
 * Creates a standardized error response object
 * 
 * @param error The error to format
 * @param context Error handling context
 * @returns Standardized error response object
 */
export function createErrorResponse(
  error: unknown,
  context: ErrorHandlingContext = {}
): Record<string, unknown> {
  // Default error information
  const response: Record<string, unknown> = {
    success: false,
    error: {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      category: ErrorCategory.SYSTEM,
      correlationId: context.correlationId || 'unknown'
    }
  };
  
  // Enhance with BaseError information if available
  if (error instanceof BaseError) {
    response.error = {
      message: error.message,
      code: error.code,
      type: error.type,
      category: error.category,
      correlationId: context.correlationId || error.correlationId || 'unknown',
      journey: context.journeyContext || error.journey || undefined
    };
    
    // Add additional context if available
    if (error.context && Object.keys(error.context).length > 0) {
      response.error.context = error.context;
    }
  } else if (error instanceof Error) {
    // Handle standard Error objects
    response.error = {
      message: error.message,
      code: 'SYSTEM_ERROR',
      category: classifyError(error),
      correlationId: context.correlationId || 'unknown',
      journey: context.journeyContext
    };
    
    // Add stack trace in development environments
    if (process.env.NODE_ENV !== 'production') {
      response.error.stack = error.stack;
    }
  }
  
  // Add journey context if available
  if (context.journeyContext && !response.error.journey) {
    response.error.journey = context.journeyContext;
  }
  
  // Add user context if available and appropriate
  if (context.userId && classifyError(error) !== ErrorCategory.CLIENT) {
    response.error.userId = context.userId;
  }
  
  return response;
}

/**
 * Logs an error with consistent formatting and context
 * 
 * @param error The error to log
 * @param context Error handling context
 */
export function logError(
  error: unknown,
  context: ErrorHandlingContext = {}
): void {
  const logger = context.logger;
  if (!logger) return;
  
  const errorCategory = classifyError(error);
  const logLevel = errorCategory === ErrorCategory.CLIENT ? 'warn' : 'error';
  
  const logContext: Record<string, unknown> = {
    correlationId: context.correlationId || 'unknown',
    errorCategory
  };
  
  // Add journey context if available
  if (context.journeyContext) {
    logContext.journey = context.journeyContext;
  }
  
  // Add user context if available
  if (context.userId) {
    logContext.userId = context.userId;
  }
  
  // Add additional metadata
  if (context.metadata) {
    Object.assign(logContext, context.metadata);
  }
  
  // Log BaseError with its context
  if (error instanceof BaseError) {
    logContext.errorType = error.type;
    logContext.errorCode = error.code;
    
    if (error.context) {
      logContext.errorContext = error.context;
    }
    
    logger[logLevel](error.message, logContext);
  } else if (error instanceof Error) {
    // Log standard Error
    logContext.errorType = 'Error';
    logContext.stack = error.stack;
    
    logger[logLevel](error.message, logContext);
  } else {
    // Log unknown error
    logger[logLevel]('Unknown error occurred', {
      ...logContext,
      error: String(error)
    });
  }
}

/**
 * Wraps a function with comprehensive error handling
 * 
 * This utility combines classification, logging, retry, circuit breaking,
 * and fallback strategies in a single function.
 * 
 * @param fn Function to execute
 * @param options Configuration options
 * @returns Promise resolving to the function result
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  options: {
    retry?: Partial<RetryOptions>;
    circuitBreaker?: {
      name: string;
      options?: Partial<CircuitBreakerOptions>;
    };
    fallback?: FallbackOptions<T>;
    context?: ErrorHandlingContext;
  } = {}
): Promise<T> {
  const context = options.context || {};
  
  try {
    // Apply circuit breaker if configured
    if (options.circuitBreaker) {
      return await withCircuitBreaker(
        options.circuitBreaker.name,
        // Apply retry if configured
        options.retry
          ? () => withRetry(fn, options.retry, context)
          : fn,
        options.circuitBreaker.options,
        context
      );
    }
    
    // Apply retry if configured (without circuit breaker)
    if (options.retry) {
      return await withRetry(fn, options.retry, context);
    }
    
    // Execute function directly if no circuit breaker or retry
    return await fn();
  } catch (error) {
    // Log the error
    logError(error, context);
    
    // Apply fallback if configured
    if (options.fallback) {
      return await withFallback(
        () => Promise.reject(error), // Already failed, so just reject
        options.fallback,
        context
      );
    }
    
    // Re-throw the error if no fallback or fallback fails
    throw error;
  }
}
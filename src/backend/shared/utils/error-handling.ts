/**
 * Error handling utilities for consistent error management across backend services.
 * 
 * This module provides utilities for error classification, recovery strategies,
 * and standardized error responses. It serves as a lightweight alternative to the
 * more comprehensive @austa/errors package and can be used independently for
 * basic error handling needs.
 * 
 * Key features:
 * - Error classification (client, system, transient, external)
 * - Recovery strategies (retry, circuit breaker, fallback)
 * - Standardized error responses
 * - Journey-specific error context handling
 * 
 * @module error-handling
 */

import { Logger } from '@nestjs/common';

// Try to import from @austa/errors if available, otherwise use local implementation
let austaErrors: any;
try {
  austaErrors = require('@austa/errors');
} catch (e) {
  // @austa/errors package not available, will use local implementation
  austaErrors = null;
}

/**
 * Enum representing the different journeys in the AUSTA SuperApp.
 */
export enum Journey {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan'
}

// ===== Error Classification =====

/**
 * Enum representing the different types of errors that can occur in the application.
 */
export enum ErrorType {
  /** Errors related to invalid input or client requests */
  CLIENT = 'client',
  /** Errors related to internal system failures */
  SYSTEM = 'system',
  /** Temporary errors that may resolve on retry */
  TRANSIENT = 'transient',
  /** Errors from external dependencies or third-party services */
  EXTERNAL = 'external'
}

/**
 * Interface for standardized error responses.
 */
export interface ErrorResponse {
  /** Unique error code for identifying the error */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details (optional) */
  details?: Record<string, any>;
  /** HTTP status code */
  statusCode?: number;
  /** Error type classification */
  type: ErrorType;
  /** Related journey (if applicable) */
  journey?: Journey;
  /** Stack trace (only included in development) */
  stack?: string;
}

/**
 * Options for classifying an error.
 */
export interface ClassifyErrorOptions {
  /** Default error type if classification fails */
  defaultType?: ErrorType;
  /** Whether to include stack trace in development */
  includeStack?: boolean;
  /** Additional context to include in the error details */
  context?: Record<string, any>;
  /** Related journey for the error */
  journey?: Journey;
}

/**
 * Determines the type of an error based on its properties and class.
 * 
 * @param error - The error to classify
 * @param options - Classification options
 * @returns The error type
 */
export function classifyError(error: Error, options: ClassifyErrorOptions = {}): ErrorType {
  const { defaultType = ErrorType.SYSTEM } = options;
  
  // Use @austa/errors classification if available
  if (austaErrors && typeof austaErrors.classifyError === 'function') {
    try {
      return austaErrors.classifyError(error, options);
    } catch (e) {
      // Fall back to local implementation if @austa/errors fails
    }
  }
  
  // Check for known error types from @austa/errors package
  if (error['type'] && Object.values(ErrorType).includes(error['type'])) {
    return error['type'];
  }
  
  // Check for HTTP status code in error
  if (error['statusCode'] || error['status']) {
    const statusCode = error['statusCode'] || error['status'];
    if (statusCode >= 400 && statusCode < 500) {
      return ErrorType.CLIENT;
    } else if (statusCode >= 500) {
      return ErrorType.SYSTEM;
    }
  }
  
  // Check for common transient errors
  if (
    error.message.includes('timeout') ||
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('ECONNRESET') ||
    error.message.includes('ETIMEDOUT') ||
    error.message.toLowerCase().includes('too many requests') ||
    error.message.toLowerCase().includes('rate limit')
  ) {
    return ErrorType.TRANSIENT;
  }
  
  // Check for external dependency errors
  if (
    error.message.includes('API') ||
    error.message.includes('external') ||
    error.name.includes('External') ||
    error['isAxiosError'] === true
  ) {
    return ErrorType.EXTERNAL;
  }
  
  // Check for journey-specific error patterns
  if (error.message.includes('health') || error.name.includes('Health')) {
    error['journey'] = Journey.HEALTH;
  } else if (error.message.includes('care') || error.name.includes('Care')) {
    error['journey'] = Journey.CARE;
  } else if (error.message.includes('plan') || error.name.includes('Plan')) {
    error['journey'] = Journey.PLAN;
  }
  
  // Apply journey from options if provided
  if (options.journey) {
    error['journey'] = options.journey;
  }
  
  return defaultType;
}

/**
 * Checks if an error is retryable based on its type and properties.
 * 
 * @param error - The error to check
 * @returns Whether the error is retryable
 */
export function isRetryableError(error: Error): boolean {
  const errorType = classifyError(error);
  
  // Transient errors are always retryable
  if (errorType === ErrorType.TRANSIENT) {
    return true;
  }
  
  // Some external errors are retryable
  if (errorType === ErrorType.EXTERNAL) {
    // Check for specific status codes that indicate retryable external errors
    const statusCode = error['statusCode'] || error['status'];
    if (statusCode && [429, 502, 503, 504].includes(statusCode)) {
      return true;
    }
  }
  
  // Client and system errors are generally not retryable
  return false;
}

/**
 * Gets the journey associated with an error, if any.
 * 
 * @param error - The error to check
 * @returns The associated journey or undefined
 */
export function getErrorJourney(error: Error): Journey | undefined {
  return error['journey'];
}

/**
 * Sets the journey context for an error.
 * 
 * @param error - The error to modify
 * @param journey - The journey to associate with the error
 * @returns The modified error
 */
export function setErrorJourney(error: Error, journey: Journey): Error {
  error['journey'] = journey;
  return error;
}

// ===== Recovery Strategies =====

/**
 * Options for retry operations.
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts?: number;
  /** Initial delay in milliseconds */
  initialDelayMs?: number;
  /** Maximum delay in milliseconds */
  maxDelayMs?: number;
  /** Factor to multiply delay by after each attempt */
  backoffFactor?: number;
  /** Whether to add jitter to the delay */
  jitter?: boolean;
  /** Function to determine if an error is retryable */
  retryableErrorFn?: (error: Error) => boolean;
  /** Logger instance for retry attempts */
  logger?: Logger;
}

/**
 * Retries an asynchronous operation with exponential backoff.
 * 
 * @param operation - The async operation to retry
 * @param options - Retry options
 * @returns The result of the operation
 * @throws The last error encountered if all retries fail
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 100,
    maxDelayMs = 5000,
    backoffFactor = 2,
    jitter = true,
    retryableErrorFn = isRetryableError,
    logger
  } = options;
  
  let lastError: Error;
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if the error is retryable
      if (!retryableErrorFn(error)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      let delay = initialDelayMs * Math.pow(backoffFactor, attempt);
      delay = Math.min(delay, maxDelayMs);
      
      // Add jitter if enabled (±25%)
      if (jitter) {
        const jitterFactor = 0.75 + Math.random() * 0.5; // 0.75 to 1.25
        delay = Math.floor(delay * jitterFactor);
      }
      
      // Log retry attempt
      if (logger) {
        logger.warn(
          `Retry attempt ${attempt + 1}/${maxAttempts} after ${delay}ms: ${error.message}`,
          { error, attempt, delay, maxAttempts }
        );
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }
  
  // If we get here, all retries failed
  throw lastError;
}

/**
 * Options for fallback operations.
 */
export interface FallbackOptions {
  /** Logger instance for fallback operations */
  logger?: Logger;
  /** Context information for logging */
  context?: Record<string, any>;
}

/**
 * Executes an operation with a fallback in case of failure.
 * 
 * @param primaryOperation - The primary operation to execute
 * @param fallbackOperation - The fallback operation to execute if primary fails
 * @param options - Fallback options
 * @returns The result of either the primary or fallback operation
 */
export async function withFallback<T>(
  primaryOperation: () => Promise<T>,
  fallbackOperation: () => Promise<T>,
  options: FallbackOptions = {}
): Promise<T> {
  const { logger, context } = options;
  
  try {
    return await primaryOperation();
  } catch (error) {
    // Log the primary operation failure
    if (logger) {
      logger.warn(
        `Primary operation failed, using fallback: ${error.message}`,
        { error, context }
      );
    }
    
    // Execute fallback operation
    return await fallbackOperation();
  }
}

/**
 * A simple in-memory cache for the cacheWithFallback function.
 */
const fallbackCache = new Map<string, { data: any; timestamp: number }>();

/**
 * Circuit breaker states.
 */
export enum CircuitState {
  CLOSED = 'closed',   // Normal operation, requests pass through
  OPEN = 'open',       // Circuit is open, requests fail fast
  HALF_OPEN = 'half-open' // Testing if the service has recovered
}

/**
 * Options for circuit breaker.
 */
export interface CircuitBreakerOptions {
  /** Failure threshold before opening the circuit */
  failureThreshold?: number;
  /** Success threshold in half-open state to close the circuit */
  successThreshold?: number;
  /** Timeout in milliseconds before transitioning from open to half-open */
  resetTimeoutMs?: number;
  /** Logger instance for circuit breaker events */
  logger?: Logger;
  /** Name for this circuit breaker instance */
  name?: string;
}

/**
 * Simple implementation of the Circuit Breaker pattern.
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastError: Error | null = null;
  private nextAttemptTime = 0;
  
  private readonly failureThreshold: number;
  private readonly successThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly logger?: Logger;
  private readonly name: string;
  
  /**
   * Creates a new CircuitBreaker instance.
   * 
   * @param options - Circuit breaker options
   */
  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.resetTimeoutMs = options.resetTimeoutMs || 30000;
    this.logger = options.logger;
    this.name = options.name || 'circuit-breaker';
  }
  
  /**
   * Executes an operation with circuit breaker protection.
   * 
   * @param operation - The operation to execute
   * @returns The result of the operation
   * @throws Error if the circuit is open or the operation fails
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      // Check if it's time to try again
      if (Date.now() >= this.nextAttemptTime) {
        this.toHalfOpen();
      } else {
        // Circuit is open, fail fast
        const error = new Error(`Circuit breaker '${this.name}' is open`);
        error['originalError'] = this.lastError;
        error['circuitState'] = this.state;
        throw error;
      }
    }
    
    try {
      // Execute the operation
      const result = await operation();
      
      // Record success
      this.onSuccess();
      
      return result;
    } catch (error) {
      // Record failure
      this.onFailure(error);
      
      // Rethrow the original error
      throw error;
    }
  }
  
  /**
   * Gets the current state of the circuit breaker.
   * 
   * @returns The current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }
  
  /**
   * Resets the circuit breaker to closed state.
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastError = null;
    this.nextAttemptTime = 0;
    
    if (this.logger) {
      this.logger.log(`Circuit breaker '${this.name}' manually reset to CLOSED state`);
    }
  }
  
  /**
   * Handles successful operation execution.
   */
  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      if (this.successCount >= this.successThreshold) {
        this.toClosed();
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success in closed state
      this.failureCount = 0;
    }
  }
  
  /**
   * Handles operation failure.
   * 
   * @param error - The error that occurred
   */
  private onFailure(error: Error): void {
    this.lastError = error;
    
    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open state opens the circuit again
      this.toOpen();
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount++;
      
      if (this.failureCount >= this.failureThreshold) {
        this.toOpen();
      }
    }
  }
  
  /**
   * Transitions the circuit to open state.
   */
  private toOpen(): void {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = Date.now() + this.resetTimeoutMs;
    
    if (this.logger) {
      this.logger.warn(
        `Circuit breaker '${this.name}' OPEN: Too many failures (${this.failureCount}/${this.failureThreshold})`,
        {
          circuitName: this.name,
          failureCount: this.failureCount,
          failureThreshold: this.failureThreshold,
          resetTimeout: this.resetTimeoutMs,
          nextAttemptTime: new Date(this.nextAttemptTime).toISOString(),
          lastError: this.lastError ? this.lastError.message : null
        }
      );
    }
  }
  
  /**
   * Transitions the circuit to half-open state.
   */
  private toHalfOpen(): void {
    this.state = CircuitState.HALF_OPEN;
    this.successCount = 0;
    
    if (this.logger) {
      this.logger.log(
        `Circuit breaker '${this.name}' HALF-OPEN: Testing if service has recovered`,
        { circuitName: this.name }
      );
    }
  }
  
  /**
   * Transitions the circuit to closed state.
   */
  private toClosed(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    
    if (this.logger) {
      this.logger.log(
        `Circuit breaker '${this.name}' CLOSED: Service has recovered`,
        { circuitName: this.name }
      );
    }
  }
}

/**
 * Options for cached fallback operations.
 */
export interface CachedFallbackOptions extends FallbackOptions {
  /** Cache key for storing the result */
  cacheKey: string;
  /** Time-to-live for cached data in milliseconds */
  ttlMs?: number;
}

/**
 * Executes an operation with a cached fallback in case of failure.
 * 
 * @param operation - The operation to execute
 * @param options - Cached fallback options
 * @returns The result of the operation or cached data
 */
export async function cacheWithFallback<T>(
  operation: () => Promise<T>,
  options: CachedFallbackOptions
): Promise<T> {
  const { cacheKey, ttlMs = 60000, logger, context } = options;
  
  try {
    // Try to execute the primary operation
    const result = await operation();
    
    // Cache the successful result
    fallbackCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
  } catch (error) {
    // Check if we have cached data
    const cachedEntry = fallbackCache.get(cacheKey);
    
    if (cachedEntry) {
      const age = Date.now() - cachedEntry.timestamp;
      
      // Check if the cached data is still valid
      if (age < ttlMs) {
        // Log the fallback to cache
        if (logger) {
          logger.warn(
            `Operation failed, using cached data (age: ${age}ms): ${error.message}`,
            { error, cacheKey, cacheAge: age, context }
          );
        }
        
        return cachedEntry.data;
      }
    }
    
    // No valid cache entry, rethrow the error
    throw error;
  }
}

// ===== Error Reporting =====

/**
 * Options for creating error responses.
 */
export interface CreateErrorResponseOptions {
  /** HTTP status code for the error */
  statusCode?: number;
  /** Additional error details */
  details?: Record<string, any>;
  /** Whether to include stack trace in development */
  includeStack?: boolean;
  /** Related journey for the error */
  journey?: Journey;
}

/**
 * Creates a standardized error response object.
 * 
 * @param error - The error to create a response for
 * @param options - Response creation options
 * @returns Standardized error response
 */
export function createErrorResponse(error: Error, options: CreateErrorResponseOptions = {}): ErrorResponse {
  // Use @austa/errors if available
  if (austaErrors && typeof austaErrors.createErrorResponse === 'function') {
    try {
      return austaErrors.createErrorResponse(error, options);
    } catch (e) {
      // Fall back to local implementation if @austa/errors fails
    }
  }
  
  const { statusCode, details = {}, includeStack = process.env.NODE_ENV !== 'production', journey } = options;
  
  // Determine error type
  const type = classifyError(error, { journey });
  
  // Get journey from error or options
  const errorJourney = error['journey'] || journey;
  
  // Determine appropriate status code based on error type
  let derivedStatusCode = statusCode;
  if (!derivedStatusCode) {
    switch (type) {
      case ErrorType.CLIENT:
        derivedStatusCode = error['statusCode'] || 400;
        break;
      case ErrorType.SYSTEM:
        derivedStatusCode = error['statusCode'] || 500;
        break;
      case ErrorType.TRANSIENT:
        derivedStatusCode = error['statusCode'] || 503;
        break;
      case ErrorType.EXTERNAL:
        derivedStatusCode = error['statusCode'] || 502;
        break;
      default:
        derivedStatusCode = 500;
    }
  }
  
  // Create error code with journey prefix if available
  let errorCode = error['code'];
  if (!errorCode) {
    if (errorJourney) {
      errorCode = `${errorJourney.toUpperCase()}_ERR_${type.toUpperCase()}`;
    } else {
      errorCode = `ERR_${type.toUpperCase()}`;
    }
  }
  
  // Create the error response
  const response: ErrorResponse = {
    code: errorCode,
    message: error.message,
    details: { ...details },
    statusCode: derivedStatusCode,
    type
  };
  
  // Include journey if available
  if (errorJourney) {
    response.journey = errorJourney;
  }
  
  // Include stack trace in development
  if (includeStack && error.stack) {
    response.stack = error.stack;
  }
  
  return response;
}

/**
 * Formats an error for logging with consistent structure.
 * 
 * @param error - The error to format
 * @param context - Additional context information
 * @returns Formatted error object for logging
 */
export function formatErrorForLogging(error: Error, context?: Record<string, any>): Record<string, any> {
  // Use @austa/errors if available
  if (austaErrors && typeof austaErrors.formatErrorForLogging === 'function') {
    try {
      return austaErrors.formatErrorForLogging(error, context);
    } catch (e) {
      // Fall back to local implementation if @austa/errors fails
    }
  }
  
  const errorType = classifyError(error);
  const errorJourney = error['journey'];
  
  const logObject: Record<string, any> = {
    message: error.message,
    name: error.name,
    type: errorType,
    ...(context || {})
  };
  
  // Include journey information if available
  if (errorJourney) {
    logObject.journey = errorJourney;
  }
  
  // Include error-specific properties
  if (error['code']) logObject.code = error['code'];
  if (error['statusCode']) logObject.statusCode = error['statusCode'];
  if (error['path']) logObject.path = error['path'];
  if (error['details']) logObject.details = error['details'];
  if (error['originalError']) {
    logObject.originalError = {
      message: error['originalError'].message,
      name: error['originalError'].name
    };
  }
  
  // Include request information if available
  if (error['request']) {
    logObject.request = {
      method: error['request'].method,
      url: error['request'].url,
      headers: sanitizeHeaders(error['request'].headers)
    };
  }
  
  // Include stack in development
  if (process.env.NODE_ENV !== 'production' && error.stack) {
    logObject.stack = error.stack.split('\n');
  }
  
  return logObject;
}

/**
 * Sanitizes request headers to remove sensitive information.
 * 
 * @param headers - The headers to sanitize
 * @returns Sanitized headers
 */
function sanitizeHeaders(headers: Record<string, any> = {}): Record<string, any> {
  const sanitized = { ...headers };
  
  // Remove sensitive headers
  const sensitiveHeaders = [
    'authorization',
    'cookie',
    'set-cookie',
    'x-api-key',
    'x-auth-token'
  ];
  
  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

/**
 * Wraps a function to catch and handle errors consistently.
 * 
 * @param fn - The function to wrap
 * @param errorHandler - Function to handle errors
 * @returns Wrapped function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorHandler: (error: Error, ...args: Parameters<T>) => Promise<ReturnType<T>>
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      return errorHandler(error, ...args);
    }
  };
}

/**
 * Creates a custom error with additional properties.
 * 
 * @param message - Error message
 * @param properties - Additional properties to add to the error
 * @returns Custom error object
 */
export function createCustomError(
  message: string,
  properties: Record<string, any> = {}
): Error & Record<string, any> {
  // Use @austa/errors if available
  if (austaErrors && typeof austaErrors.createCustomError === 'function') {
    try {
      return austaErrors.createCustomError(message, properties);
    } catch (e) {
      // Fall back to local implementation if @austa/errors fails
    }
  }
  
  const error = new Error(message) as Error & Record<string, any>;
  
  // Add additional properties
  Object.keys(properties).forEach(key => {
    error[key] = properties[key];
  });
  
  return error;
}

/**
 * Creates a journey-specific error with appropriate context.
 * 
 * @param message - Error message
 * @param journey - The journey associated with this error
 * @param properties - Additional properties to add to the error
 * @returns Custom error with journey context
 */
export function createJourneyError(
  message: string,
  journey: Journey,
  properties: Record<string, any> = {}
): Error & Record<string, any> {
  // Use @austa/errors if available
  if (austaErrors && typeof austaErrors.createJourneyError === 'function') {
    try {
      return austaErrors.createJourneyError(message, journey, properties);
    } catch (e) {
      // Fall back to local implementation if @austa/errors fails
    }
  }
  
  return createCustomError(message, {
    journey,
    ...properties,
    code: properties.code || `${journey.toUpperCase()}_ERROR`
  });
}

/**
 * Wraps an error with additional context while preserving the original error.
 * 
 * @param originalError - The original error
 * @param message - New error message
 * @param properties - Additional properties to add
 * @returns Wrapped error with original as cause
 */
export function wrapError(
  originalError: Error,
  message: string,
  properties: Record<string, any> = {}
): Error & Record<string, any> {
  // Use @austa/errors if available
  if (austaErrors && typeof austaErrors.wrapError === 'function') {
    try {
      return austaErrors.wrapError(originalError, message, properties);
    } catch (e) {
      // Fall back to local implementation if @austa/errors fails
    }
  }
  
  const error = createCustomError(message, {
    ...properties,
    originalError,
    cause: originalError
  });
  
  // Preserve stack trace if possible
  if (originalError.stack) {
    const currentStack = error.stack || '';
    error.stack = `${currentStack}\nCaused by: ${originalError.stack}`;
  }
  
  return error;
}
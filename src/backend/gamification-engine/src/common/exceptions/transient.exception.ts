import { HttpStatus } from '@nestjs/common';
import { calculateBackoffDelay, DEFAULT_RETRY_POLICIES, JitterStrategy, RetryPolicy } from './retry.utils';

/**
 * Interface for structured metadata specific to transient errors.
 * Extends the base error metadata with retry-specific information.
 */
export interface ITransientErrorMetadata {
  // Error identification
  errorCode?: string;          // Unique error code for reference
  source?: string;             // Component that generated the error
  
  // Context information
  correlationId?: string;      // Trace/correlation ID for distributed tracing
  operationId?: string;        // ID of the operation being performed
  operationType?: string;      // Type of operation (e.g., 'kafka', 'database', 'http')
  journeyType?: string;        // Journey context (Health, Care, Plan)
  userId?: string;             // User associated with the operation
  
  // Error details
  details?: Record<string, any>; // Additional error-specific details
  stack?: string;               // Stack trace (sanitized for production)
  cause?: Error | unknown;       // Original cause of the error
  timestamp?: Date;              // When the error occurred
  
  // Retry information
  retryCount: number;           // Current retry attempt (0-based)
  maxRetries: number;           // Maximum number of retry attempts
  retryAfterMs?: number;        // Suggested delay before retry (ms)
  retryPolicy?: RetryPolicy;    // The retry policy being used
  retryExhausted?: boolean;     // Whether retry attempts are exhausted
  dlqEligible?: boolean;        // Whether this should go to DLQ after exhaustion
}

/**
 * Specialized exception class for handling transient errors that are candidates for automatic retry.
 * Implements retry count tracking, exponential backoff calculation, and threshold determination
 * to manage retry attempts across services.
 */
export class TransientException extends Error {
  /**
   * The HTTP status code associated with this error type.
   * Typically 503 Service Unavailable for transient errors.
   */
  public readonly statusCode: HttpStatus;
  
  /**
   * Timestamp when the error occurred.
   */
  public readonly timestamp: Date;
  
  /**
   * Structured metadata providing context about the error.
   */
  public readonly metadata: ITransientErrorMetadata;
  
  /**
   * Flag indicating this is a retryable error.
   * Used by the retry utilities to identify retryable errors.
   */
  public readonly retryable: boolean = true;
  
  /**
   * Creates a new TransientException instance.
   * 
   * @param message Human-readable error message
   * @param metadata Additional error context and retry information
   * @param cause The original error that caused this exception, if any
   */
  constructor(
    message: string,
    metadata: Partial<ITransientErrorMetadata> = {},
    cause?: Error | unknown
  ) {
    super(message);
    
    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, new.target.prototype);
    
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.statusCode = HttpStatus.SERVICE_UNAVAILABLE;
    
    // Determine the operation type for retry policy selection
    const operationType = metadata.operationType || 'default';
    const retryPolicy = metadata.retryPolicy || DEFAULT_RETRY_POLICIES[operationType] || DEFAULT_RETRY_POLICIES.default;
    
    // Initialize retry count if not provided
    const retryCount = metadata.retryCount !== undefined ? metadata.retryCount : 0;
    const maxRetries = metadata.maxRetries !== undefined ? metadata.maxRetries : retryPolicy.maxAttempts;
    
    // Calculate backoff delay if not provided
    const retryAfterMs = metadata.retryAfterMs !== undefined
      ? metadata.retryAfterMs
      : this.calculateBackoffDelay(retryCount, retryPolicy);
    
    // Determine if retry attempts are exhausted
    const retryExhausted = retryCount >= maxRetries;
    
    // Merge provided metadata with defaults
    this.metadata = {
      retryCount,
      maxRetries,
      retryAfterMs,
      retryPolicy,
      retryExhausted,
      dlqEligible: retryExhausted, // Eligible for DLQ if retries are exhausted
      errorCode: metadata.errorCode || 'TRANSIENT_ERROR',
      timestamp: this.timestamp,
      stack: this.stack,
      cause,
      ...metadata
    };
    
    // Preserve the stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TransientException);
    }
  }
  
  /**
   * Calculates the backoff delay for the next retry attempt.
   * 
   * @param retryCount Current retry attempt (0-based)
   * @param policy Retry policy to use
   * @returns Delay in milliseconds before the next retry attempt
   */
  private calculateBackoffDelay(retryCount: number, policy: RetryPolicy): number {
    // Convert to 1-based for the calculation function
    const attempt = retryCount + 1;
    return calculateBackoffDelay(attempt, policy);
  }
  
  /**
   * Creates a new TransientException for the next retry attempt.
   * Increments the retry count and recalculates the backoff delay.
   * 
   * @returns A new TransientException with updated retry information
   */
  public nextRetry(): TransientException {
    const nextRetryCount = this.metadata.retryCount + 1;
    const retryExhausted = nextRetryCount >= this.metadata.maxRetries;
    
    return new TransientException(this.message, {
      ...this.metadata,
      retryCount: nextRetryCount,
      retryExhausted,
      dlqEligible: retryExhausted,
      // Recalculate backoff delay for the next attempt
      retryAfterMs: this.calculateBackoffDelay(
        nextRetryCount,
        this.metadata.retryPolicy || DEFAULT_RETRY_POLICIES.default
      )
    }, this.metadata.cause);
  }
  
  /**
   * Checks if retry attempts are exhausted for this exception.
   * 
   * @returns True if retry attempts are exhausted, false otherwise
   */
  public isRetryExhausted(): boolean {
    return this.metadata.retryExhausted || false;
  }
  
  /**
   * Checks if this exception should be sent to a dead letter queue.
   * 
   * @returns True if the exception should be sent to a DLQ, false otherwise
   */
  public isDLQEligible(): boolean {
    return this.metadata.dlqEligible || false;
  }
  
  /**
   * Gets the recommended delay before the next retry attempt.
   * 
   * @returns Delay in milliseconds before the next retry attempt
   */
  public getRetryDelay(): number {
    return this.metadata.retryAfterMs || 0;
  }
  
  /**
   * Gets the current retry count.
   * 
   * @returns Current retry attempt (0-based)
   */
  public getRetryCount(): number {
    return this.metadata.retryCount;
  }
  
  /**
   * Gets the maximum number of retry attempts.
   * 
   * @returns Maximum number of retry attempts
   */
  public getMaxRetries(): number {
    return this.metadata.maxRetries;
  }
  
  /**
   * Creates a TransientException from another error.
   * Useful for wrapping non-transient errors that should be retried.
   * 
   * @param error The error to convert
   * @param message Optional custom message (defaults to error's message)
   * @param metadata Additional metadata to include
   * @returns A new TransientException
   */
  public static fromError(
    error: Error | unknown,
    message?: string,
    metadata: Partial<ITransientErrorMetadata> = {}
  ): TransientException {
    const errorMessage = message || (error instanceof Error ? error.message : 'Unknown error');
    
    return new TransientException(errorMessage, {
      cause: error,
      stack: error instanceof Error ? error.stack : undefined,
      ...metadata
    });
  }
  
  /**
   * Serializes the exception to a JSON-compatible object for logging.
   * Includes detailed information for troubleshooting.
   * 
   * @returns A structured representation of the error for logging systems
   */
  public toLog(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      ...this.metadata,
      // Include retry-specific information
      retryable: this.retryable,
      retryCount: this.metadata.retryCount,
      maxRetries: this.metadata.maxRetries,
      retryAfterMs: this.metadata.retryAfterMs,
      retryExhausted: this.metadata.retryExhausted,
      dlqEligible: this.metadata.dlqEligible,
      // Ensure stack is included for logging but sanitized if needed
      stack: this.stack,
      // Include cause if available
      cause: this.metadata.cause instanceof Error
        ? {
            name: this.metadata.cause.name,
            message: this.metadata.cause.message,
            stack: this.metadata.cause.stack
          }
        : this.metadata.cause
    };
  }
  
  /**
   * Serializes the exception to a client-safe response object.
   * Filters sensitive information that shouldn't be exposed to clients.
   * 
   * @returns A client-safe representation of the error
   */
  public toResponse(): Record<string, any> {
    // Create a client-safe error response
    const response: Record<string, any> = {
      statusCode: this.statusCode,
      message: this.message,
      error: this.name,
      timestamp: this.timestamp.toISOString(),
    };
    
    // Include error code if available
    if (this.metadata.errorCode) {
      response.code = this.metadata.errorCode;
    }
    
    // Include operation ID if available for reference
    if (this.metadata.operationId) {
      response.operationId = this.metadata.operationId;
    }
    
    // Include correlation ID for tracking the request through the system
    if (this.metadata.correlationId) {
      response.correlationId = this.metadata.correlationId;
    }
    
    // Include retry information
    response.retryable = this.retryable;
    response.retryAfter = this.metadata.retryAfterMs;
    
    return response;
  }
}
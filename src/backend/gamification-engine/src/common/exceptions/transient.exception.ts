import { HttpStatus } from '@nestjs/common';
import { AppExceptionBase } from './app-exception.base';
import { ErrorType, ErrorMetadata, ErrorContext, isTransientError } from './error-types.enum';

/**
 * Configuration options for transient error handling
 */
export interface TransientErrorOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Base delay in milliseconds for exponential backoff */
  baseDelayMs?: number;
  /** Maximum delay in milliseconds */
  maxDelayMs?: number;
  /** Jitter factor (0-1) to add randomness to retry delays */
  jitterFactor?: number;
  /** Current retry attempt (0-based) */
  currentAttempt?: number;
}

/**
 * Default configuration for transient errors
 */
const DEFAULT_TRANSIENT_OPTIONS: Required<TransientErrorOptions> = {
  maxRetries: 3,
  baseDelayMs: 100,
  maxDelayMs: 30000,
  jitterFactor: 0.5,
  currentAttempt: 0,
};

/**
 * Specialized exception class for handling transient errors that are candidates for automatic retry.
 * Implements retry count tracking, exponential backoff calculation, and threshold determination
 * to manage retry attempts across services.
 */
export class TransientException extends AppExceptionBase {
  private readonly retryOptions: Required<TransientErrorOptions>;
  
  /**
   * Creates a new TransientException instance
   * 
   * @param message Human-readable error message
   * @param errorType Error type classification (must be a transient error type)
   * @param cause Original error that caused this exception
   * @param options Retry configuration options
   * @param metadata Additional error metadata
   * @param context Error context information
   */
  constructor(
    message: string,
    errorType: ErrorType,
    cause?: Error,
    options: TransientErrorOptions = {},
    metadata: ErrorMetadata = {},
    context: ErrorContext = {},
  ) {
    // Validate that the error type is actually transient
    if (!isTransientError(errorType)) {
      throw new Error(`Error type ${errorType} is not a transient error type`);
    }
    
    // Determine appropriate HTTP status code based on the error type
    // Most transient errors should be 503 Service Unavailable
    const statusCode = HttpStatus.SERVICE_UNAVAILABLE;
    
    // Call parent constructor
    super(message, errorType, statusCode, cause, metadata, context);
    
    // Initialize retry options with defaults
    this.retryOptions = { ...DEFAULT_TRANSIENT_OPTIONS, ...options };
    
    // Add retry-specific metadata
    this.addMetadata('retryable', true);
    this.addMetadata('currentAttempt', this.retryOptions.currentAttempt);
    this.addMetadata('maxRetries', this.retryOptions.maxRetries);
    this.addMetadata('nextRetryDelayMs', this.calculateRetryDelay());
  }
  
  /**
   * Determines if this error can be retried again
   * 
   * @returns True if retry attempts are not exhausted
   */
  canRetry(): boolean {
    return this.retryOptions.currentAttempt < this.retryOptions.maxRetries;
  }
  
  /**
   * Gets the current retry attempt (0-based)
   * 
   * @returns Current retry attempt
   */
  getCurrentAttempt(): number {
    return this.retryOptions.currentAttempt;
  }
  
  /**
   * Gets the maximum number of retry attempts
   * 
   * @returns Maximum retry attempts
   */
  getMaxRetries(): number {
    return this.retryOptions.maxRetries;
  }
  
  /**
   * Calculates the delay before the next retry attempt using exponential backoff with jitter
   * 
   * @returns Delay in milliseconds
   */
  calculateRetryDelay(): number {
    // If we can't retry, return 0
    if (!this.canRetry()) {
      return 0;
    }
    
    // Calculate exponential backoff: baseDelay * 2^attempt
    const nextAttempt = this.retryOptions.currentAttempt + 1;
    const exponentialDelay = this.retryOptions.baseDelayMs * Math.pow(2, nextAttempt);
    
    // Add jitter to prevent thundering herd problem
    // Random factor between (1-jitterFactor) and (1+jitterFactor)
    const jitter = 1 + (Math.random() * 2 - 1) * this.retryOptions.jitterFactor;
    
    // Apply jitter and cap at maximum delay
    return Math.min(exponentialDelay * jitter, this.retryOptions.maxDelayMs);
  }
  
  /**
   * Creates a new instance of this exception for the next retry attempt
   * 
   * @returns New TransientException with incremented attempt counter
   */
  incrementRetry(): TransientException {
    if (!this.canRetry()) {
      throw new Error('Cannot increment retry: maximum retries exceeded');
    }
    
    // Create new options with incremented attempt counter
    const newOptions: TransientErrorOptions = {
      ...this.retryOptions,
      currentAttempt: this.retryOptions.currentAttempt + 1,
    };
    
    // Create new exception with incremented counter
    return new TransientException(
      this.message,
      this.errorType,
      this.cause,
      newOptions,
      this.metadata,
      this.context,
    );
  }
  
  /**
   * Determines if this exception represents a transient error that can be retried
   * 
   * @returns Always true for TransientException
   */
  override isTransientError(): boolean {
    return true;
  }
  
  /**
   * Gets a client-safe error message
   * 
   * @returns Client-safe error message
   */
  override getClientMessage(): string {
    return 'The service is temporarily unavailable. Please try again later.';
  }
  
  /**
   * Gets safe metadata that can be included in client responses
   * 
   * @returns Safe metadata for client responses
   */
  override getSafeMetadataForResponse(): Record<string, any> | null {
    // Only include retry-related information that's safe for clients
    if (this.canRetry()) {
      return {
        retryAfterMs: this.calculateRetryDelay(),
      };
    }
    return null;
  }
  
  /**
   * Creates a TransientException for network-related errors
   * 
   * @param message Error message
   * @param cause Original error
   * @param options Retry options
   * @returns TransientException instance
   */
  static createNetworkError(
    message: string,
    cause?: Error,
    options?: TransientErrorOptions,
  ): TransientException {
    return new TransientException(
      message,
      ErrorType.NETWORK_ERROR,
      cause,
      options,
      { errorSubtype: 'network' },
    );
  }
  
  /**
   * Creates a TransientException for timeout-related errors
   * 
   * @param message Error message
   * @param cause Original error
   * @param options Retry options
   * @returns TransientException instance
   */
  static createTimeoutError(
    message: string,
    cause?: Error,
    options?: TransientErrorOptions,
  ): TransientException {
    return new TransientException(
      message,
      ErrorType.TIMEOUT_ERROR,
      cause,
      options,
      { errorSubtype: 'timeout' },
    );
  }
  
  /**
   * Creates a TransientException for connection-related errors
   * 
   * @param message Error message
   * @param cause Original error
   * @param options Retry options
   * @returns TransientException instance
   */
  static createConnectionError(
    message: string,
    cause?: Error,
    options?: TransientErrorOptions,
  ): TransientException {
    return new TransientException(
      message,
      ErrorType.CONNECTION_ERROR,
      cause,
      options,
      { errorSubtype: 'connection' },
    );
  }
  
  /**
   * Creates a TransientException for event publishing errors
   * 
   * @param message Error message
   * @param cause Original error
   * @param options Retry options
   * @returns TransientException instance
   */
  static createEventPublishingError(
    message: string,
    cause?: Error,
    options?: TransientErrorOptions,
  ): TransientException {
    return new TransientException(
      message,
      ErrorType.EVENT_PUBLISHING_ERROR,
      cause,
      options,
      { errorSubtype: 'event_publishing' },
    );
  }
  
  /**
   * Creates a TransientException for event consumption errors
   * 
   * @param message Error message
   * @param cause Original error
   * @param options Retry options
   * @returns TransientException instance
   */
  static createEventConsumptionError(
    message: string,
    cause?: Error,
    options?: TransientErrorOptions,
  ): TransientException {
    return new TransientException(
      message,
      ErrorType.EVENT_CONSUMPTION_ERROR,
      cause,
      options,
      { errorSubtype: 'event_consumption' },
    );
  }
  
  /**
   * Determines if an error is a transient error that can be retried
   * 
   * @param error Error to check
   * @returns True if the error is a TransientException or has transient characteristics
   */
  static isTransient(error: Error): boolean {
    // Check if it's already a TransientException
    if (error instanceof TransientException) {
      return true;
    }
    
    // Check error message for common transient error patterns
    const errorMessage = error.message.toLowerCase();
    return (
      errorMessage.includes('timeout') ||
      errorMessage.includes('temporary') ||
      errorMessage.includes('transient') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('network') ||
      errorMessage.includes('unavailable') ||
      errorMessage.includes('too many requests') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('overloaded')
    );
  }
  
  /**
   * Wraps an error in a TransientException if it's not already one
   * 
   * @param error Error to wrap
   * @param defaultMessage Default message if the error doesn't have one
   * @param options Retry options
   * @returns TransientException instance
   */
  static from(
    error: Error,
    defaultMessage = 'A transient error occurred',
    options?: TransientErrorOptions,
  ): TransientException {
    // If it's already a TransientException, return it
    if (error instanceof TransientException) {
      return error;
    }
    
    // Determine the most likely error type based on the error message
    const errorMessage = error.message.toLowerCase();
    let errorType = ErrorType.NETWORK_ERROR; // Default
    
    if (errorMessage.includes('timeout')) {
      errorType = ErrorType.TIMEOUT_ERROR;
    } else if (errorMessage.includes('connection')) {
      errorType = ErrorType.CONNECTION_ERROR;
    } else if (errorMessage.includes('event') && errorMessage.includes('publish')) {
      errorType = ErrorType.EVENT_PUBLISHING_ERROR;
    } else if (errorMessage.includes('event') && errorMessage.includes('consum')) {
      errorType = ErrorType.EVENT_CONSUMPTION_ERROR;
    }
    
    // Create a new TransientException
    return new TransientException(
      error.message || defaultMessage,
      errorType,
      error,
      options,
    );
  }
}
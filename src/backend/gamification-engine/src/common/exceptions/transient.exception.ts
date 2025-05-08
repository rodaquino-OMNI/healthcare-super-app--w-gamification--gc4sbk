import { HttpStatus } from '@nestjs/common';
import { ErrorType, ErrorMetadata, ErrorContext } from './error-types.enum';
import { SystemException } from './system.exception';

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  maxAttempts: number;  // Maximum number of retry attempts
  currentAttempt: number; // Current attempt number (1-based)
  baseDelayMs: number;  // Base delay in milliseconds
  maxDelayMs: number;   // Maximum delay in milliseconds
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  currentAttempt: 1,
  baseDelayMs: 100,
  maxDelayMs: 30000,
};

/**
 * Specialized exception class for handling transient errors that are candidates for automatic retry.
 * Implements retry count tracking, exponential backoff calculation, and threshold determination
 * to manage retry attempts across services.
 */
export class TransientException extends SystemException {
  public readonly retryConfig: RetryConfig;
  
  /**
   * Creates a new TransientException instance
   * 
   * @param message Human-readable error message
   * @param errorType Error type classification
   * @param statusCode HTTP status code
   * @param cause Original error that caused this exception
   * @param retryConfig Configuration for retry behavior
   * @param metadata Additional error metadata
   * @param context Error context information
   */
  constructor(
    message: string,
    errorType: ErrorType = ErrorType.TIMEOUT_ERROR,
    statusCode: HttpStatus = HttpStatus.SERVICE_UNAVAILABLE,
    cause?: Error,
    retryConfig: Partial<RetryConfig> = {},
    metadata: ErrorMetadata = {},
    context: ErrorContext = {},
  ) {
    super(message, errorType, statusCode, cause, metadata, context);
    
    // Merge provided retry config with defaults
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    
    // Add retry information to metadata
    this.addMetadata('isTransient', true);
    this.addMetadata('retryAttempt', this.retryConfig.currentAttempt);
    this.addMetadata('maxRetryAttempts', this.retryConfig.maxAttempts);
    this.addMetadata('retryExhausted', this.isRetryExhausted());
  }
  
  /**
   * Creates a new instance for the next retry attempt
   * 
   * @returns New TransientException with incremented attempt count
   */
  nextAttempt(): TransientException {
    return new TransientException(
      this.message,
      this.errorType,
      this.getStatus(),
      this.cause,
      {
        ...this.retryConfig,
        currentAttempt: this.retryConfig.currentAttempt + 1,
      },
      this.metadata,
      this.context,
    );
  }
  
  /**
   * Checks if retry attempts have been exhausted
   * 
   * @returns True if maximum retry attempts have been reached
   */
  isRetryExhausted(): boolean {
    return this.retryConfig.currentAttempt >= this.retryConfig.maxAttempts;
  }
  
  /**
   * Calculates the delay before the next retry attempt using exponential backoff with jitter
   * 
   * @returns Delay in milliseconds
   */
  getRetryDelay(): number {
    if (this.isRetryExhausted()) {
      return 0; // No more retries
    }
    
    // Exponential backoff: baseDelay * 2^(attempt-1)
    const exponentialDelay = this.retryConfig.baseDelayMs * 
      Math.pow(2, this.retryConfig.currentAttempt - 1);
    
    // Add jitter: random factor between 0.5 and 1.5
    const jitter = 0.5 + Math.random();
    
    // Calculate final delay with jitter
    const delay = exponentialDelay * jitter;
    
    // Cap at maximum delay
    return Math.min(delay, this.retryConfig.maxDelayMs);
  }
  
  /**
   * Gets client-safe metadata for responses
   * For transient errors, we can include retry information
   * 
   * @returns Safe metadata for client responses
   */
  getSafeMetadataForResponse(): Record<string, any> | null {
    return {
      retryable: !this.isRetryExhausted(),
      retryAfter: this.getRetryDelay(),
    };
  }
  
  /**
   * Gets client-friendly message
   * 
   * @returns Client-safe error message
   */
  getClientMessage(): string {
    return this.isRetryExhausted()
      ? `Service temporarily unavailable. Please try again later.`
      : `Service temporarily unavailable. Please retry in ${Math.ceil(this.getRetryDelay() / 1000)} seconds.`;
  }
}
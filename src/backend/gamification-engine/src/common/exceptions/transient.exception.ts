import { HttpStatus } from '@nestjs/common';
import { BaseError, ErrorType } from '@austa/errors';

/**
 * Specialized exception class for handling transient errors that are candidates for automatic retry.
 * 
 * Transient errors are temporary failures that may resolve themselves after a retry,
 * such as network timeouts, temporary service unavailability, or database connection issues.
 * 
 * This exception implements retry count tracking, exponential backoff calculation,
 * and threshold determination to manage retry attempts across services.
 */
export class TransientException extends BaseError {
  /**
   * Number of retry attempts made so far
   */
  readonly retryCount: number;

  /**
   * Type of operation that failed (used for retry configuration)
   */
  readonly operationType: string;

  /**
   * Maximum number of retries allowed for this exception
   */
  readonly maxRetries: number;

  /**
   * Creates a new TransientException
   * 
   * @param message Error message
   * @param options Additional options
   */
  constructor(message: string, options: {
    code?: string;
    cause?: Error;
    details?: Record<string, any>;
    retryCount?: number;
    operationType?: string;
    maxRetries?: number;
  } = {}) {
    super(message, {
      type: ErrorType.TRANSIENT,
      code: options.code || 'GAMIFICATION_TRANSIENT_ERROR',
      cause: options.cause,
      details: options.details,
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
    });

    this.retryCount = options.retryCount || 0;
    this.operationType = options.operationType || 'default';
    this.maxRetries = options.maxRetries || 3;

    // Set retry-after header value based on exponential backoff
    this.details.retryAfter = this.calculateRetryAfter();
  }

  /**
   * Creates a new TransientException with an incremented retry count
   * 
   * @returns A new TransientException with retry count incremented
   */
  incrementRetry(): TransientException {
    return new TransientException(this.message, {
      code: this.code,
      cause: this.cause,
      details: this.details,
      retryCount: this.retryCount + 1,
      operationType: this.operationType,
      maxRetries: this.maxRetries,
    });
  }

  /**
   * Checks if the maximum number of retries has been reached
   * 
   * @returns True if max retries reached, false otherwise
   */
  isMaxRetriesReached(): boolean {
    return this.retryCount >= this.maxRetries;
  }

  /**
   * Calculates the retry-after time in seconds based on exponential backoff
   * 
   * @returns Retry-after time in seconds
   */
  private calculateRetryAfter(): number {
    // Simple exponential backoff: 2^retryCount seconds
    const baseDelay = 1; // 1 second
    const exponentialDelay = baseDelay * Math.pow(2, this.retryCount);
    const maxDelay = 30; // 30 seconds max
    
    return Math.min(exponentialDelay, maxDelay);
  }
}

// Export the TransientException as the default export
export default TransientException;
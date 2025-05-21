import { Injectable } from '@nestjs/common';
import { TransientException } from '../../../common/exceptions/transient.exception';
import { ErrorType } from '../../../common/exceptions/error-types.enum';

/**
 * Configuration options for retry behavior
 */
export interface RetryConfig {
  /** Maximum number of retry attempts before moving to dead-letter queue */
  maxRetries: number;
  /** Base delay in milliseconds for exponential backoff calculation */
  baseDelayMs: number;
  /** Maximum delay in milliseconds between retry attempts */
  maxDelayMs: number;
  /** Jitter factor (0-1) to add randomness to retry delays to prevent thundering herd */
  jitterFactor: number;
}

/**
 * Default retry configuration values
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  baseDelayMs: 1000, // 1 second
  maxDelayMs: 60000, // 1 minute
  jitterFactor: 0.2, // 20% randomness
};

/**
 * Specialized exception for transient errors in event processing that should be retried.
 * Implements retry count tracking, backoff calculation, and threshold determination
 * to decide when to stop retrying and move to a dead-letter queue.
 */
@Injectable()
export class EventRetryableException extends TransientException {
  /** Current retry attempt count */
  private _retryCount: number = 0;
  
  /** Retry configuration */
  private _retryConfig: RetryConfig;

  /** Original error that caused this exception */
  private _originalError: Error | null = null;

  /** Kafka topic to use for retry, if applicable */
  private _retryTopic: string | null = null;

  /**
   * Creates a new EventRetryableException
   * 
   * @param message Error message
   * @param errorCode Specific error code
   * @param originalError Original error that caused this exception (optional)
   * @param retryConfig Custom retry configuration (optional)
   */
  constructor(
    message: string,
    errorCode: string = 'EVENT_PROCESSING_TRANSIENT_ERROR',
    originalError?: Error,
    retryConfig?: Partial<RetryConfig>,
  ) {
    super(message, errorCode, ErrorType.TRANSIENT);
    
    this._retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...retryConfig,
    };

    if (originalError) {
      this._originalError = originalError;
      this.stack = originalError.stack;
    }
  }

  /**
   * Gets the current retry attempt count
   */
  get retryCount(): number {
    return this._retryCount;
  }

  /**
   * Gets the original error that caused this exception
   */
  get originalError(): Error | null {
    return this._originalError;
  }

  /**
   * Gets the retry topic for Kafka, if set
   */
  get retryTopic(): string | null {
    return this._retryTopic;
  }

  /**
   * Sets the retry topic for Kafka
   */
  setRetryTopic(topic: string): this {
    this._retryTopic = topic;
    return this;
  }

  /**
   * Increments the retry count and returns the updated count
   */
  incrementRetryCount(): number {
    return ++this._retryCount;
  }

  /**
   * Determines if the maximum retry attempts have been reached
   */
  hasExceededMaxRetries(): boolean {
    return this._retryCount >= this._retryConfig.maxRetries;
  }

  /**
   * Calculates the delay in milliseconds before the next retry attempt
   * using exponential backoff with jitter
   */
  calculateBackoffDelay(): number {
    // Exponential backoff: baseDelay * 2^retryCount
    const exponentialDelay = this._retryConfig.baseDelayMs * Math.pow(2, this._retryCount);
    
    // Apply maximum delay cap
    const cappedDelay = Math.min(exponentialDelay, this._retryConfig.maxDelayMs);
    
    // Apply jitter to prevent thundering herd problem
    // Formula: delay = cappedDelay * (1 ± jitterFactor)
    const jitterRange = cappedDelay * this._retryConfig.jitterFactor;
    const jitter = Math.random() * jitterRange * 2 - jitterRange; // Random value between -jitterRange and +jitterRange
    
    return Math.max(0, Math.floor(cappedDelay + jitter));
  }

  /**
   * Creates metadata object with retry-specific information
   */
  override getMetadata(): Record<string, any> {
    return {
      ...super.getMetadata(),
      retryCount: this._retryCount,
      maxRetries: this._retryConfig.maxRetries,
      nextRetryDelay: this.hasExceededMaxRetries() ? null : this.calculateBackoffDelay(),
      retryExhausted: this.hasExceededMaxRetries(),
      retryTopic: this._retryTopic,
      originalError: this._originalError ? {
        name: this._originalError.name,
        message: this._originalError.message,
      } : null,
    };
  }

  /**
   * Factory method to create an EventRetryableException from an existing error
   * 
   * @param error Original error to convert
   * @param message Optional custom message (defaults to original error message)
   * @param retryConfig Optional retry configuration
   */
  static fromError(error: Error, message?: string, retryConfig?: Partial<RetryConfig>): EventRetryableException {
    return new EventRetryableException(
      message || `Transient error in event processing: ${error.message}`,
      'EVENT_PROCESSING_TRANSIENT_ERROR',
      error,
      retryConfig
    );
  }

  /**
   * Factory method to create a network-related retryable exception
   * 
   * @param error Original network error
   * @param retryConfig Optional retry configuration
   */
  static networkError(error: Error, retryConfig?: Partial<RetryConfig>): EventRetryableException {
    return new EventRetryableException(
      `Network error in event processing: ${error.message}`,
      'EVENT_PROCESSING_NETWORK_ERROR',
      error,
      retryConfig
    );
  }

  /**
   * Factory method to create a Kafka-related retryable exception
   * 
   * @param error Original Kafka error
   * @param retryConfig Optional retry configuration
   */
  static kafkaError(error: Error, retryConfig?: Partial<RetryConfig>): EventRetryableException {
    return new EventRetryableException(
      `Kafka error in event processing: ${error.message}`,
      'EVENT_PROCESSING_KAFKA_ERROR',
      error,
      retryConfig
    );
  }

  /**
   * Factory method to create a database-related retryable exception
   * 
   * @param error Original database error
   * @param retryConfig Optional retry configuration
   */
  static databaseError(error: Error, retryConfig?: Partial<RetryConfig>): EventRetryableException {
    return new EventRetryableException(
      `Database error in event processing: ${error.message}`,
      'EVENT_PROCESSING_DATABASE_ERROR',
      error,
      retryConfig
    );
  }
}
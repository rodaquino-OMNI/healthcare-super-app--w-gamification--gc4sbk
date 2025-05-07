import { HttpStatus } from '@nestjs/common';
import { BaseEventException } from './base-event.exception';

/**
 * Configuration options for retry behavior
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts before moving to dead-letter queue
   * @default 3
   */
  maxRetries?: number;

  /**
   * Initial delay in milliseconds before the first retry
   * @default 1000 (1 second)
   */
  initialDelayMs?: number;

  /**
   * Maximum delay in milliseconds between retries
   * @default 60000 (1 minute)
   */
  maxDelayMs?: number;

  /**
   * Factor by which the delay increases with each retry attempt
   * @default 2 (doubles each time)
   */
  backoffFactor?: number;

  /**
   * Random jitter factor (0-1) to add to delay calculations to prevent thundering herd
   * @default 0.1 (10% jitter)
   */
  jitter?: number;

  /**
   * Kafka topic to use for retry messages
   * If not provided, the original topic with a ".retry" suffix will be used
   */
  retryTopic?: string;
}

/**
 * Default retry configuration values
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 60000, // 1 minute
  backoffFactor: 2,
  jitter: 0.1, // 10% jitter
  retryTopic: null,
};

/**
 * Exception for transient errors that should be retried with backoff strategies.
 * 
 * This exception is used for errors that are likely to be resolved by retrying the operation,
 * such as network timeouts, temporary service unavailability, or rate limiting.
 * 
 * It includes retry count tracking, backoff calculation, and threshold determination
 * to decide when to stop retrying and move to a dead-letter queue.
 */
export class EventRetryableException extends BaseEventException {
  /**
   * Current retry attempt count (0-based)
   */
  private retryCount: number;

  /**
   * Configuration options for retry behavior
   */
  private retryOptions: Required<RetryOptions>;

  /**
   * Original error that caused this exception
   */
  private originalError: Error;

  /**
   * Timestamp when the error first occurred
   */
  private firstErrorTimestamp: Date;

  /**
   * History of retry attempts with timestamps and delays
   */
  private retryHistory: Array<{
    timestamp: Date;
    delayMs: number;
    error?: Error;
  }>;

  /**
   * Creates a new EventRetryableException
   * 
   * @param message Error message
   * @param originalError Original error that caused this exception
   * @param options Retry configuration options
   * @param retryCount Current retry count (defaults to 0 for new errors)
   * @param metadata Additional context metadata
   */
  constructor(
    message: string,
    originalError?: Error,
    options?: RetryOptions,
    retryCount = 0,
    metadata?: Record<string, any>,
  ) {
    // Pass message and metadata to parent class
    super(message, {
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      errorType: 'TRANSIENT',
      ...metadata,
    });

    // Initialize retry properties
    this.retryCount = retryCount;
    this.originalError = originalError;
    this.firstErrorTimestamp = new Date();
    this.retryHistory = [];
    
    // Merge provided options with defaults
    this.retryOptions = {
      ...DEFAULT_RETRY_OPTIONS,
      ...options,
    };

    // Set name explicitly for better error identification
    this.name = 'EventRetryableException';
  }

  /**
   * Get the current retry count
   */
  public getRetryCount(): number {
    return this.retryCount;
  }

  /**
   * Get the original error that caused this exception
   */
  public getOriginalError(): Error {
    return this.originalError;
  }

  /**
   * Get the retry history
   */
  public getRetryHistory(): Array<{
    timestamp: Date;
    delayMs: number;
    error?: Error;
  }> {
    return [...this.retryHistory];
  }

  /**
   * Get the configured retry options
   */
  public getRetryOptions(): Required<RetryOptions> {
    return { ...this.retryOptions };
  }

  /**
   * Determine if the operation should be retried based on retry count and max retries
   */
  public shouldRetry(): boolean {
    return this.retryCount < this.retryOptions.maxRetries;
  }

  /**
   * Calculate the next retry time using exponential backoff with jitter
   * 
   * @returns Delay in milliseconds before the next retry attempt
   */
  public calculateNextRetryDelay(): number {
    // Base delay calculation using exponential backoff
    const baseDelay = Math.min(
      this.retryOptions.initialDelayMs * Math.pow(this.retryOptions.backoffFactor, this.retryCount),
      this.retryOptions.maxDelayMs
    );

    // Add jitter to prevent thundering herd problem
    const jitterAmount = baseDelay * this.retryOptions.jitter;
    const jitter = Math.random() * jitterAmount * 2 - jitterAmount; // Random value between -jitterAmount and +jitterAmount

    // Ensure delay is positive and within bounds
    return Math.max(0, Math.min(baseDelay + jitter, this.retryOptions.maxDelayMs));
  }

  /**
   * Prepare for the next retry attempt
   * 
   * @param error Optional error from the previous retry attempt
   * @returns A new EventRetryableException with incremented retry count
   */
  public prepareForRetry(error?: Error): EventRetryableException {
    // Calculate delay for this retry attempt
    const delayMs = this.calculateNextRetryDelay();

    // Record this attempt in history
    this.retryHistory.push({
      timestamp: new Date(),
      delayMs,
      error,
    });

    // Create a new instance with incremented retry count
    const nextException = new EventRetryableException(
      this.message,
      this.originalError || error,
      this.retryOptions,
      this.retryCount + 1,
      this.metadata
    );

    // Copy retry history to new instance
    nextException.retryHistory = [...this.retryHistory];
    nextException.firstErrorTimestamp = this.firstErrorTimestamp;

    return nextException;
  }

  /**
   * Get the Kafka topic to use for retry messages
   * 
   * @param originalTopic The original Kafka topic
   * @returns The retry topic name
   */
  public getRetryTopic(originalTopic: string): string {
    // Use configured retry topic if available
    if (this.retryOptions.retryTopic) {
      return this.retryOptions.retryTopic;
    }

    // Otherwise, append .retry suffix to original topic
    return `${originalTopic}.retry`;
  }

  /**
   * Get total elapsed time since first error in milliseconds
   */
  public getTotalElapsedTimeMs(): number {
    return new Date().getTime() - this.firstErrorTimestamp.getTime();
  }

  /**
   * Serialize the exception for logging and monitoring
   */
  public toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      retryCount: this.retryCount,
      maxRetries: this.retryOptions.maxRetries,
      shouldRetry: this.shouldRetry(),
      nextRetryDelayMs: this.shouldRetry() ? this.calculateNextRetryDelay() : null,
      totalElapsedTimeMs: this.getTotalElapsedTimeMs(),
      retryHistory: this.retryHistory.map(entry => ({
        timestamp: entry.timestamp.toISOString(),
        delayMs: entry.delayMs,
        error: entry.error ? entry.error.message : undefined,
      })),
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack,
      } : null,
    };
  }
}
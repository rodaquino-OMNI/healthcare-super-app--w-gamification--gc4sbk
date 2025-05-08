/**
 * Interfaces for configuring retry operations in the notification service.
 * These interfaces define the parameters for different retry strategies,
 * including fixed delay and exponential backoff.
 */

/**
 * Base interface for retry options that are common across all retry policies.
 */
export interface IRetryOptions {
  /**
   * Maximum number of retry attempts before giving up and potentially
   * moving the operation to a dead-letter queue.
   */
  maxRetries: number;

  /**
   * Initial delay in milliseconds before the first retry attempt.
   */
  initialDelay: number;

  /**
   * Maximum delay in milliseconds between retry attempts.
   * This caps the delay for exponential backoff strategies to prevent
   * excessively long waits.
   */
  maxDelay?: number;

  /**
   * Whether to add random jitter to the delay to prevent thundering herd problems.
   * When multiple operations fail at the same time, jitter helps distribute
   * retry attempts over time.
   */
  jitter?: boolean;

  /**
   * The amount of jitter to apply, as a factor of the calculated delay.
   * For example, a value of 0.2 means the actual delay will be between
   * 80% and 120% of the calculated delay.
   */
  jitterFactor?: number;

  /**
   * Timeout in milliseconds for the operation before it's considered failed.
   * This is used to determine when a request should be aborted and retried.
   */
  timeout?: number;

  /**
   * Optional channel-specific configuration to apply different retry
   * strategies based on the notification channel (email, SMS, push, etc.)
   */
  channelSpecific?: {
    [channel: string]: Partial<IRetryOptions>;
  };

  /**
   * List of error types that should be retried.
   * If not specified, all errors will be considered retryable.
   */
  retryableErrors?: string[];

  /**
   * List of error types that should not be retried.
   * These errors will immediately fail the operation without retry.
   */
  nonRetryableErrors?: string[];
}

/**
 * Options specific to the fixed delay retry policy.
 * This policy uses the same delay between each retry attempt.
 */
export interface IFixedDelayOptions extends IRetryOptions {
  /**
   * The fixed delay in milliseconds between retry attempts.
   * This overrides the initialDelay for all attempts after the first.
   * 
   * Note: If not specified, initialDelay will be used as the fixed delay.
   */
  delay?: number;
}

/**
 * Options specific to the exponential backoff retry policy.
 * This policy increases the delay exponentially between retry attempts.
 */
export interface IExponentialBackoffOptions extends IRetryOptions {
  /**
   * The base multiplier for the exponential calculation.
   * The delay is calculated as: initialDelay * (backoffFactor ^ attemptNumber)
   * Default is 2, which doubles the delay with each attempt.
   */
  backoffFactor: number;

  /**
   * Whether to use full jitter, which randomizes the entire delay value
   * rather than just adding a small random factor.
   * Full jitter is more effective at preventing thundering herd problems
   * but results in less predictable retry timing.
   */
  useFullJitter?: boolean;
}
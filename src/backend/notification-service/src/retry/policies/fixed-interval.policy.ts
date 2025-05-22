import { Injectable } from '@nestjs/common';
import { IRetryPolicy } from '../interfaces/retry-policy.interface';
import { IFixedDelayOptions } from '../interfaces/retry-options.interface';
import { RetryStatus } from '../interfaces/retry-status.enum';

/**
 * Implements a fixed interval retry policy with configurable parameters.
 * 
 * This policy applies the same delay duration for each retry regardless of the attempt count,
 * which is useful for consistently spaced retries or when a fixed rate limit must be observed.
 * Optional jitter can be applied to prevent the "thundering herd" problem where many clients
 * retry simultaneously.
 */
@Injectable()
export class FixedIntervalPolicy implements IRetryPolicy {
  private readonly defaultOptions: IFixedDelayOptions = {
    maxRetries: 3,
    delay: 2000, // 2 seconds in milliseconds
    jitter: 0.1, // 10% jitter by default
  };

  /**
   * Creates a new instance of FixedIntervalPolicy.
   * 
   * @param options - Configuration options for the fixed interval policy
   */
  constructor(private readonly options: IFixedDelayOptions = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  /**
   * Gets the name of this retry policy.
   * 
   * @returns The policy name
   */
  getName(): string {
    return 'fixed-interval';
  }

  /**
   * Calculates the next retry time based on the fixed delay value.
   * Applies optional jitter to prevent synchronized retry attempts across multiple clients.
   * 
   * @param attempt - The current retry attempt number (0-based)
   * @returns The delay in milliseconds before the next retry attempt
   */
  calculateNextRetryTime(attempt: number): number {
    const { delay, jitter } = this.options;
    
    // Start with the fixed delay value
    let nextRetryDelay = delay;
    
    // Apply jitter to prevent the "thundering herd" problem
    if (jitter > 0) {
      // Calculate jitter range (delay * jitter)
      const jitterRange = delay * jitter;
      // Apply random jitter within the range [-jitterRange/2, +jitterRange/2]
      nextRetryDelay += (Math.random() - 0.5) * jitterRange;
    }
    
    return Math.max(0, nextRetryDelay); // Ensure delay is never negative
  }

  /**
   * Determines whether a retry should be attempted based on the error type,
   * current attempt number, and maximum retry limit.
   * 
   * @param error - The error that occurred during the operation
   * @param attempt - The current retry attempt number (0-based)
   * @returns True if the operation should be retried, false otherwise
   */
  shouldRetry(error: Error, attempt: number): boolean {
    // Check if we've exceeded the maximum number of retries
    if (attempt >= this.options.maxRetries) {
      return false;
    }

    // Determine if the error is retryable based on its type
    return this.isRetryableError(error);
  }

  /**
   * Determines the retry status based on the error and attempt number.
   * 
   * @param error - The error that occurred during the operation
   * @param attempt - The current retry attempt number (0-based)
   * @returns The retry status (PENDING, FAILED, or EXHAUSTED)
   */
  getRetryStatus(error: Error, attempt: number): RetryStatus {
    if (!this.isRetryableError(error)) {
      return RetryStatus.EXHAUSTED; // Non-retryable errors are immediately exhausted
    }

    if (attempt >= this.options.maxRetries) {
      return RetryStatus.EXHAUSTED; // Max retries reached
    }

    return RetryStatus.PENDING; // Eligible for retry
  }

  /**
   * Determines if an error is retryable based on its type and properties.
   * 
   * @param error - The error to check
   * @returns True if the error is retryable, false otherwise
   * @private
   */
  private isRetryableError(error: Error): boolean {
    // Check for network-related errors (common transient failures)
    if (
      error.name === 'NetworkError' ||
      error.name === 'TimeoutError' ||
      error.name === 'ConnectionError' ||
      error.message.includes('timeout') ||
      error.message.includes('network') ||
      error.message.includes('connection')
    ) {
      return true;
    }

    // Check for rate limiting or service unavailability (typically temporary)
    if (
      error.name === 'RateLimitError' ||
      error.name === 'ServiceUnavailableError' ||
      error.message.includes('rate limit') ||
      error.message.includes('too many requests') ||
      error.message.includes('service unavailable') ||
      error.message.includes('503') // Service Unavailable status code
    ) {
      return true;
    }

    // Check for custom error properties that indicate retryability
    if (
      (error as any).isRetryable === true ||
      (error as any).temporary === true ||
      (error as any).transient === true
    ) {
      return true;
    }

    // Check for HTTP status codes that typically indicate transient issues
    const statusCode = (error as any).statusCode || (error as any).status;
    if (statusCode) {
      // 408 Request Timeout, 429 Too Many Requests, 5xx Server Errors (except 501 Not Implemented)
      return statusCode === 408 || statusCode === 429 || (statusCode >= 500 && statusCode !== 501);
    }

    // By default, don't retry if we can't determine the error type
    return false;
  }
}
import { Injectable } from '@nestjs/common';
import { IRetryPolicy } from '../interfaces/retry-policy.interface';
import { IExponentialBackoffOptions } from '../interfaces/retry-options.interface';
import { RetryStatus } from '../interfaces/retry-status.enum';

/**
 * Implements an exponential backoff retry policy with configurable parameters.
 * 
 * This policy calculates delays that grow exponentially with each successive retry
 * using the formula: initialDelay * (backoffFactor^attempt), with optional jitter
 * to prevent the "thundering herd" problem. It's optimal for handling transient
 * failures like network issues or service overloads by giving systems progressively
 * more time to recover between attempts.
 */
@Injectable()
export class ExponentialBackoffPolicy implements IRetryPolicy {
  private readonly defaultOptions: IExponentialBackoffOptions = {
    maxRetries: 3,
    initialDelay: 1000, // 1 second in milliseconds
    maxDelay: 30000, // 30 seconds in milliseconds
    backoffFactor: 2,
    jitter: 0.2, // 20% jitter by default
  };

  /**
   * Creates a new instance of ExponentialBackoffPolicy.
   * 
   * @param options - Configuration options for the exponential backoff policy
   */
  constructor(private readonly options: IExponentialBackoffOptions = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  /**
   * Gets the name of this retry policy.
   * 
   * @returns The policy name
   */
  getName(): string {
    return 'exponential-backoff';
  }

  /**
   * Calculates the next retry time based on the attempt number and the exponential backoff formula.
   * Applies jitter to prevent synchronized retry attempts across multiple clients.
   * 
   * @param attempt - The current retry attempt number (0-based)
   * @returns The delay in milliseconds before the next retry attempt
   */
  calculateNextRetryTime(attempt: number): number {
    const { initialDelay, backoffFactor, maxDelay, jitter } = this.options;
    
    // Calculate base delay using exponential backoff formula: initialDelay * (backoffFactor^attempt)
    let delay = initialDelay * Math.pow(backoffFactor, attempt);
    
    // Apply jitter to prevent the "thundering herd" problem
    if (jitter > 0) {
      // Calculate jitter range (delay * jitter)
      const jitterRange = delay * jitter;
      // Apply random jitter within the range [-jitterRange/2, +jitterRange/2]
      delay += (Math.random() - 0.5) * jitterRange;
    }
    
    // Ensure delay doesn't exceed the maximum allowed delay
    return Math.min(delay, maxDelay);
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
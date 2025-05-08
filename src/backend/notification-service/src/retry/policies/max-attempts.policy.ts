import { ErrorType, isRetryableErrorType, getRecommendedMaxRetries } from '../constants/error-types.constants';
import { RetryStatus } from '../interfaces/retry-status.enum';

/**
 * Interface for MaxAttemptsPolicy options.
 */
export interface IMaxAttemptsOptions {
  /**
   * Maximum number of retry attempts before giving up.
   */
  maxRetries: number;
}

/**
 * A simple retry policy that focuses solely on limiting the maximum number of retry attempts
 * without modifying delay times. This policy can be used as a standalone basic policy or
 * combined with other policies via the CompositePolicy to enforce a maximum retry limit
 * regardless of the delay calculation strategy.
 */
export class MaxAttemptsPolicy implements IRetryPolicy {
  private readonly name = 'max-attempts';
  private readonly options: IMaxAttemptsOptions;

  /**
   * Creates an instance of MaxAttemptsPolicy.
   * 
   * @param options - Configuration options for the policy
   */
  constructor(options: IMaxAttemptsOptions) {
    this.options = {
      maxRetries: options.maxRetries || 3, // Default to 3 retries if not specified
    };
  }

  /**
   * Gets the name of the policy.
   * 
   * @returns The policy name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Determines if a retry should be attempted based on the error and attempt count.
   * This policy only checks if the maximum number of retries has been reached and
   * if the error type is retryable.
   * 
   * @param error - The error that occurred
   * @param attemptCount - The current attempt count
   * @param options - Optional retry options that can override the default options
   * @returns True if a retry should be attempted, false otherwise
   */
  shouldRetry(error: Error, attemptCount: number, options?: IMaxAttemptsOptions): boolean {
    // Use provided options or fall back to instance options
    const maxRetries = options?.maxRetries || this.options.maxRetries;
    
    // Check if we've reached the maximum number of retries
    if (attemptCount >= maxRetries) {
      return false;
    }

    // Determine error type for more intelligent retry decisions
    const errorType = this.classifyError(error);
    
    // Check if the error type is retryable
    if (!isRetryableErrorType(errorType)) {
      return false;
    }

    // For more sophisticated implementations, we could also check if
    // the error type's recommended max retries has been exceeded
    const recommendedMaxRetries = getRecommendedMaxRetries(errorType);
    if (attemptCount >= recommendedMaxRetries) {
      return false;
    }

    return true;
  }

  /**
   * Calculates the next retry time. Since this policy doesn't modify delay times,
   * it simply returns the current time plus a small default delay (1 second).
   * When used in combination with other policies via CompositePolicy, the other
   * policy's calculateNextRetryTime method would be used instead.
   * 
   * @param attemptCount - The current attempt count
   * @param options - Optional retry options (not used in this implementation)
   * @returns The timestamp for the next retry
   */
  calculateNextRetryTime(attemptCount: number, options?: any): number {
    // This policy doesn't modify delay times, so we just return
    // the current time plus a small default delay (1 second)
    // When used in combination with other policies via CompositePolicy,
    // the other policy's calculateNextRetryTime method would be used
    return Date.now() + 1000; // 1 second delay
  }

  /**
   * Classifies an error into one of the defined error types.
   * This is a simple implementation that could be enhanced with more
   * sophisticated error classification logic.
   * 
   * @param error - The error to classify
   * @returns The classified error type
   * @private
   */
  private classifyError(error: Error): ErrorType {
    // Simple error classification based on error name and message
    // In a real implementation, this would be more sophisticated
    
    // Check for client errors
    if (
      error.name === 'ValidationError' ||
      error.name === 'BadRequestError' ||
      error.message.includes('invalid') ||
      error.message.includes('not found')
    ) {
      return ErrorType.CLIENT;
    }
    
    // Check for transient errors
    if (
      error.name === 'NetworkError' ||
      error.name === 'TimeoutError' ||
      error.message.includes('timeout') ||
      error.message.includes('connection') ||
      error.message.includes('network') ||
      error.message.includes('temporary')
    ) {
      return ErrorType.TRANSIENT;
    }
    
    // Check for external dependency errors
    if (
      error.name === 'ExternalServiceError' ||
      error.message.includes('service unavailable') ||
      error.message.includes('external') ||
      error.message.includes('third-party') ||
      error.message.includes('provider')
    ) {
      return ErrorType.EXTERNAL;
    }
    
    // Default to system error
    return ErrorType.SYSTEM;
  }

  /**
   * Gets the retry status based on the attempt count and maximum retries.
   * 
   * @param attemptCount - The current attempt count
   * @param maxRetries - The maximum number of retries
   * @returns The current retry status
   */
  getRetryStatus(attemptCount: number, maxRetries: number = this.options.maxRetries): RetryStatus {
    if (attemptCount === 0) {
      return RetryStatus.PENDING;
    } else if (attemptCount >= maxRetries) {
      return RetryStatus.EXHAUSTED;
    } else {
      return RetryStatus.FAILED; // Will be retried
    }
  }
}

/**
 * Interface for retry policies.
 * This interface defines the contract that all retry policies must implement.
 */
export interface IRetryPolicy {
  /**
   * Gets the name of the policy.
   * 
   * @returns The policy name
   */
  getName(): string;
  
  /**
   * Determines if a retry should be attempted based on the error and attempt count.
   * 
   * @param error - The error that occurred
   * @param attemptCount - The current attempt count
   * @param options - Optional retry options
   * @returns True if a retry should be attempted, false otherwise
   */
  shouldRetry(error: Error, attemptCount: number, options?: any): boolean;
  
  /**
   * Calculates the next retry time based on the attempt count and options.
   * 
   * @param attemptCount - The current attempt count
   * @param options - Optional retry options
   * @returns The timestamp for the next retry
   */
  calculateNextRetryTime(attemptCount: number, options?: any): number;
}
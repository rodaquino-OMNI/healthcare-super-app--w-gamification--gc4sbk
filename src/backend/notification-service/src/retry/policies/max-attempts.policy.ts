import { Injectable } from '@nestjs/common';
import { ErrorType, classifyError } from '../constants/error-types.constants';
import { RetryStatus } from '../interfaces/retry-status.enum';
import { IRetryPolicy } from '../interfaces/retry-policy.interface';

/**
 * Interface for retry policy options focused on maximum attempts
 */
interface IMaxAttemptsOptions {
  /**
   * Maximum number of retry attempts before giving up
   */
  maxRetries: number;

  /**
   * Optional map of error types to their specific max retry values
   * This allows different retry limits for different error types
   */
  errorTypeMaxRetries?: Record<ErrorType, number>;
}

/**
 * A simple retry policy that focuses solely on limiting the maximum number of retry attempts
 * without modifying delay times. This policy can be used as a standalone basic policy or
 * combined with other policies via the CompositePolicy to enforce a maximum retry limit
 * regardless of the delay calculation strategy.
 *
 * @example
 * // Basic usage with default max retries
 * const policy = new MaxAttemptsPolicy({ maxRetries: 3 });
 *
 * @example
 * // Advanced usage with error-specific retry limits
 * const policy = new MaxAttemptsPolicy({
 *   maxRetries: 3,
 *   errorTypeMaxRetries: {
 *     [ErrorType.TRANSIENT]: 5,
 *     [ErrorType.SYSTEM]: 2,
 *     [ErrorType.EXTERNAL]: 4,
 *     [ErrorType.CLIENT]: 0
 *   }
 * });
 */
@Injectable()
export class MaxAttemptsPolicy implements IRetryPolicy {
  private readonly options: IMaxAttemptsOptions;

  /**
   * Creates a new MaxAttemptsPolicy instance
   * @param options Configuration options for the policy
   */
  constructor(options: IMaxAttemptsOptions) {
    this.options = {
      maxRetries: options.maxRetries,
      errorTypeMaxRetries: options.errorTypeMaxRetries || {
        [ErrorType.TRANSIENT]: options.maxRetries,
        [ErrorType.SYSTEM]: Math.min(options.maxRetries, 3),
        [ErrorType.EXTERNAL]: options.maxRetries,
        [ErrorType.CLIENT]: 0 // Client errors are not retried by default
      }
    };
  }

  /**
   * Calculates the time for the next retry attempt.
   * This policy doesn't modify delay times, so it returns 0 if retry is allowed,
   * or null if no more retries are allowed.
   * 
   * @param attempt Current attempt number (1-based)
   * @param error Error that occurred during the last attempt
   * @returns 0 if retry is allowed, null if no more retries
   */
  calculateNextRetryTime(attempt: number, error: Error): number | null {
    if (this.shouldRetry(attempt, error)) {
      return 0; // Return 0 to indicate retry is allowed but with no delay
    }
    return null; // Return null to indicate no more retries
  }

  /**
   * Determines if an operation should be retried based on the error and attempt count
   * 
   * @param attempt Current attempt number (1-based)
   * @param error Error that occurred during the last attempt
   * @returns True if the operation should be retried, false otherwise
   */
  shouldRetry(attempt: number, error: Error): boolean {
    // Classify the error to determine the appropriate max retries
    const errorType = this.classifyError(error);
    
    // Get the max retries for this error type
    const maxRetries = this.getMaxRetriesForErrorType(errorType);
    
    // Check if we've exceeded the max retries for this error type
    return attempt <= maxRetries;
  }

  /**
   * Gets the name of the policy for logging and debugging
   * 
   * @returns The policy name
   */
  getName(): string {
    return 'MaxAttemptsPolicy';
  }

  /**
   * Gets the maximum number of retries for a specific error type
   * 
   * @param errorType The type of error
   * @returns The maximum number of retries for the error type
   * @private
   */
  private getMaxRetriesForErrorType(errorType: ErrorType): number {
    return this.options.errorTypeMaxRetries?.[errorType] ?? this.options.maxRetries;
  }

  /**
   * Classifies an error to determine its type for retry decisions
   * 
   * @param error The error to classify
   * @returns The classified error type
   * @private
   */
  private classifyError(error: Error): ErrorType {
    // Use the HTTP status code if available (for HttpException or similar)
    const statusCode = (error as any).status || (error as any).statusCode;
    
    // Use the error message for classification
    const errorMessage = error.message;
    
    // Use the utility function from error-types.constants.ts
    return classifyError(statusCode, errorMessage);
  }

  /**
   * Determines the retry status based on the attempt count and error
   * 
   * @param attempt Current attempt number (1-based)
   * @param error Error that occurred during the last attempt
   * @returns The current retry status
   */
  getRetryStatus(attempt: number, error: Error): RetryStatus {
    if (!error) {
      return RetryStatus.SUCCEEDED;
    }
    
    if (this.shouldRetry(attempt, error)) {
      return RetryStatus.FAILED; // Failed but eligible for retry
    }
    
    return RetryStatus.EXHAUSTED; // Failed and no more retries
  }
}
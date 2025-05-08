import { ErrorType } from '../constants/error-types.constants';
import { IRetryOptions } from './retry-options.interface';
import { IRetryableOperationError, IRetryableOperationMetadata } from './retryable-operation.interface';

/**
 * Interface defining the contract for retry policies in the notification service.
 * 
 * Retry policies determine when and how to retry failed operations based on
 * configurable strategies such as fixed delay or exponential backoff.
 * 
 * Implementations of this interface provide specific retry behaviors while
 * maintaining a consistent API for the retry service to use.
 */
export interface IRetryPolicy {
  /**
   * Calculates the timestamp for the next retry attempt based on the current
   * attempt number and policy configuration.
   * 
   * @param currentAttempt - The current retry attempt number (0-based, where 0 is the initial attempt)
   * @param options - Configuration options for the retry policy
   * @param metadata - Metadata about the operation being retried
   * @returns Date object representing when the next retry should be attempted
   */
  calculateNextRetryTime(
    currentAttempt: number,
    options: IRetryOptions,
    metadata?: IRetryableOperationMetadata
  ): Date;

  /**
   * Determines whether a retry should be attempted based on the error information,
   * current attempt count, and maximum retry limit.
   * 
   * @param error - Information about the error that occurred
   * @param currentAttempt - The current retry attempt number (0-based)
   * @param maxRetries - The maximum number of retry attempts allowed
   * @param metadata - Metadata about the operation being retried
   * @returns True if the operation should be retried, false otherwise
   */
  shouldRetry(
    error: IRetryableOperationError,
    currentAttempt: number,
    maxRetries: number,
    metadata?: IRetryableOperationMetadata
  ): boolean;

  /**
   * Gets the unique name of this retry policy for identification and logging.
   * 
   * @returns The name of the retry policy
   */
  getName(): string;

  /**
   * Determines if this policy is applicable for the given error type.
   * This allows for error-specific policy selection in composite policies.
   * 
   * @param errorType - The type of error to check
   * @param context - Additional context that might influence applicability
   * @returns True if this policy should handle the given error type, false otherwise
   */
  isApplicableForErrorType(
    errorType: ErrorType,
    context?: Record<string, any>
  ): boolean;

  /**
   * Gets the maximum number of retries supported by this policy.
   * This may be different from the configured maxRetries in options
   * if the policy has its own internal limits.
   * 
   * @param options - Configuration options for the retry policy
   * @returns The maximum number of retries supported
   */
  getMaxRetries(options: IRetryOptions): number;

  /**
   * Validates the provided options for this retry policy.
   * Implementations should check that all required options are present
   * and have valid values.
   * 
   * @param options - Configuration options to validate
   * @returns True if the options are valid, false otherwise
   */
  validateOptions(options: IRetryOptions): boolean;

  /**
   * Gets a description of this retry policy, including its configuration.
   * This is useful for logging and debugging.
   * 
   * @param options - Configuration options for the retry policy
   * @returns A human-readable description of the policy
   */
  getDescription(options: IRetryOptions): string;

  /**
   * Calculates the delay in milliseconds until the next retry attempt.
   * This is different from calculateNextRetryTime in that it returns the
   * raw delay value rather than a Date object.
   * 
   * @param currentAttempt - The current retry attempt number (0-based)
   * @param options - Configuration options for the retry policy
   * @param metadata - Metadata about the operation being retried
   * @returns The delay in milliseconds until the next retry attempt
   */
  calculateDelayMs(
    currentAttempt: number,
    options: IRetryOptions,
    metadata?: IRetryableOperationMetadata
  ): number;
}
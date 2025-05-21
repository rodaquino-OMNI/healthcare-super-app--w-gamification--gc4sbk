import { RetryPolicyType } from '../constants/policy-types.constants';
import { ErrorType } from '../constants/error-types.constants';
import { RetryOptions } from './retry-options.interface';
import { RetryableOperationErrorContext, RetryableOperationMetadata } from './retryable-operation.interface';

/**
 * Interface defining the contract for retry policies in the notification service.
 * 
 * A retry policy determines when and how to retry failed operations based on
 * configurable parameters and error context. Different implementations of this
 * interface can provide various retry strategies such as fixed delay, linear backoff,
 * or exponential backoff.
 *
 * This interface enables:
 * - Policy registration in a central registry
 * - Policy switching based on error types and operation context
 * - Consistent application of retry logic across the notification service
 * - Runtime selection of appropriate policies for different scenarios
 */
export interface IRetryPolicy {
  /**
   * Calculates the timestamp for the next retry attempt based on the current attempt number,
   * policy configuration, and operation metadata.
   *
   * @param attemptNumber - The current attempt number (1-based, where 1 is the first retry)
   * @param metadata - Metadata about the operation being retried
   * @returns The timestamp (Date object) when the next retry should be executed
   */
  calculateNextRetryTime(attemptNumber: number, metadata: RetryableOperationMetadata): Date;

  /**
   * Determines whether a failed operation should be retried based on the error context,
   * attempt number, and operation metadata.
   *
   * @param errorContext - Context about the error that occurred
   * @param attemptNumber - The current attempt number (0-based, where 0 is the initial attempt)
   * @param metadata - Metadata about the operation being retried
   * @returns True if the operation should be retried, false otherwise
   */
  shouldRetry(errorContext: RetryableOperationErrorContext, attemptNumber: number, metadata: RetryableOperationMetadata): boolean;

  /**
   * Gets the unique name of this retry policy for identification and logging purposes.
   * This name should be descriptive of the policy's behavior.
   *
   * @returns The policy name as a string
   */
  getName(): string;

  /**
   * Gets the type of this retry policy (fixed, linear, exponential backoff).
   * This allows for categorization and appropriate handling of different policy types.
   *
   * @returns The policy type
   */
  getType(): RetryPolicyType;

  /**
   * Gets the configuration options for this retry policy.
   * These options control the behavior of the policy, such as delays and maximum retries.
   *
   * @returns The policy configuration options
   */
  getOptions(): RetryOptions;

  /**
   * Determines if this policy is appropriate for the given error type.
   * Different policies may be better suited for different types of errors.
   *
   * @param errorType - The type of error that occurred
   * @returns True if this policy is appropriate for the error type, false otherwise
   */
  isApplicableForErrorType(errorType: ErrorType): boolean;

  /**
   * Calculates the delay in milliseconds before the next retry attempt.
   * This is used internally by calculateNextRetryTime but can also be useful
   * for logging and monitoring purposes.
   *
   * @param attemptNumber - The current attempt number (1-based, where 1 is the first retry)
   * @returns The delay in milliseconds
   */
  calculateDelayMs(attemptNumber: number): number;

  /**
   * Applies jitter (randomness) to a delay value to prevent synchronized retries
   * from multiple clients, which can cause additional load spikes.
   *
   * @param delayMs - The base delay in milliseconds
   * @returns The delay with jitter applied
   */
  applyJitter(delayMs: number): number;

  /**
   * Gets the maximum number of retry attempts allowed by this policy.
   *
   * @returns The maximum number of retry attempts
   */
  getMaxRetries(): number;

  /**
   * Determines if the maximum number of retry attempts has been reached.
   *
   * @param attemptNumber - The current attempt number (0-based, where 0 is the initial attempt)
   * @returns True if the maximum number of retries has been reached, false otherwise
   */
  isMaxRetriesReached(attemptNumber: number): boolean;

  /**
   * Gets a human-readable description of this policy for logging and debugging.
   * This should include the policy type and key configuration parameters.
   *
   * @returns A string description of the policy
   */
  getDescription(): string;

  /**
   * Validates that the policy configuration is valid and consistent.
   * This can be used to check for configuration errors during initialization.
   *
   * @throws Error if the configuration is invalid
   */
  validateConfiguration(): void;
}
import { ErrorType } from '../constants/error-types.constants';
import { RetryStatus } from './retry-status.enum';

/**
 * Metadata for a retryable operation, providing context for retry decisions.
 * This information helps the retry service determine appropriate retry policies
 * and track the operation throughout its lifecycle.
 */
export interface RetryableOperationMetadata {
  /**
   * Unique identifier for the operation instance
   */
  operationId: string;

  /**
   * The type of operation (e.g., 'send-push-notification', 'send-email')
   */
  operationType: string;

  /**
   * The notification channel used for this operation (e.g., 'push', 'email', 'sms', 'in-app')
   */
  channel?: string;

  /**
   * The priority of this operation (higher priority operations may have different retry policies)
   */
  priority?: 'high' | 'medium' | 'low';

  /**
   * The timestamp when this operation was created
   */
  createdAt: Date;

  /**
   * The timestamp when this operation was last attempted
   */
  lastAttemptAt?: Date;

  /**
   * The number of attempts that have been made so far
   */
  attemptCount: number;

  /**
   * The current status of the retry operation
   */
  status: RetryStatus;

  /**
   * User ID associated with this operation, if applicable
   */
  userId?: string;

  /**
   * Journey context (health, care, plan) for this operation, if applicable
   */
  journeyContext?: string;

  /**
   * Additional metadata specific to this operation type
   */
  [key: string]: any;
}

/**
 * Error context for a failed operation, providing details about the failure
 * to help with retry decisions and error reporting.
 */
export interface RetryableOperationErrorContext {
  /**
   * The error that caused the operation to fail
   */
  error: Error;

  /**
   * The classified type of error (transient, client, system, external)
   */
  errorType: ErrorType;

  /**
   * HTTP status code, if applicable
   */
  statusCode?: number;

  /**
   * Error code or reason code for more specific error classification
   */
  errorCode?: string;

  /**
   * Timestamp when the error occurred
   */
  timestamp: Date;

  /**
   * The attempt number when this error occurred
   */
  attemptNumber: number;

  /**
   * Whether this error is considered retryable based on its type and context
   */
  isRetryable: boolean;

  /**
   * Additional context about the error
   */
  context?: Record<string, any>;
}

/**
 * Interface for operations that can be retried.
 * 
 * This interface defines the contract for operations that are eligible for retry handling,
 * such as sending notifications through different channels. It provides methods for
 * executing the operation, accessing metadata, and handling results or errors.
 * 
 * @template TParams - The type of parameters required to execute the operation
 * @template TResult - The type of result returned by the operation
 */
export interface IRetryableOperation<TParams = any, TResult = any> {
  /**
   * Executes the operation with the given parameters.
   * 
   * @param params - Parameters required to execute the operation
   * @returns A promise that resolves with the operation result or rejects with an error
   */
  execute(params: TParams): Promise<TResult>;
  
  /**
   * Gets the unique identifier for this operation instance.
   * This ID is used to track the operation throughout its lifecycle.
   * 
   * @returns The operation ID
   */
  getOperationId(): string;
  
  /**
   * Gets metadata about the operation for retry decision-making.
   * This metadata includes information like operation type, channel,
   * priority, and timestamps.
   * 
   * @returns Metadata about the operation
   */
  getMetadata(): RetryableOperationMetadata;
  
  /**
   * Gets the maximum number of retry attempts for this operation.
   * This may vary based on operation type, channel, and priority.
   * 
   * @returns The maximum number of retry attempts
   */
  getMaxRetries(): number;
  
  /**
   * Handles a successful result from the operation.
   * This method is called when the operation succeeds, either on the
   * initial attempt or after one or more retries.
   * 
   * @param result - The successful result
   * @returns A promise that resolves when the success handling is complete
   */
  handleSuccess(result: TResult): Promise<void>;
  
  /**
   * Handles an error from the operation.
   * This method is called when the operation fails and determines whether
   * the operation should be retried based on the error and attempt number.
   * 
   * @param error - The error that occurred
   * @param attempt - The attempt number (1 for first attempt, 2 for first retry, etc.)
   * @returns A promise that resolves with the error context, including whether to retry
   */
  handleError(error: Error, attempt: number): Promise<RetryableOperationErrorContext>;
  
  /**
   * Updates the status of the operation.
   * This method is called by the retry service to update the operation's status
   * as it progresses through the retry lifecycle.
   * 
   * @param status - The new status
   * @returns A promise that resolves when the status update is complete
   */
  updateStatus(status: RetryStatus): Promise<void>;
  
  /**
   * Gets the parameters for the next retry attempt.
   * This allows operations to modify their parameters between retry attempts
   * if needed (e.g., to use a different endpoint or authentication method).
   * 
   * @param lastParams - The parameters used in the previous attempt
   * @param attempt - The upcoming attempt number
   * @returns A promise that resolves with the parameters for the next attempt
   */
  getNextAttemptParams(lastParams: TParams, attempt: number): Promise<TParams>;
  
  /**
   * Performs cleanup when all retry attempts are exhausted.
   * This method is called when the operation has failed and no more retries
   * will be attempted, allowing for final cleanup or fallback actions.
   * 
   * @param lastError - The last error that occurred
   * @returns A promise that resolves when the cleanup is complete
   */
  handleExhaustedRetries(lastError: Error): Promise<void>;
  
  /**
   * Gets the context for this operation for debugging and monitoring.
   * This context includes information about the operation, its parameters,
   * and its execution environment.
   * 
   * @returns The operation context
   */
  getContext(): Record<string, any>;
}
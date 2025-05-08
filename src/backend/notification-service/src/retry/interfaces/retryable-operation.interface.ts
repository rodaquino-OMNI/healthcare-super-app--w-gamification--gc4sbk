import { ErrorType } from '../constants/error-types.constants';
import { RetryStatus } from './retry-status.enum';

/**
 * Interface for metadata about a retryable operation.
 * This information is used by the retry service to make decisions about retry behavior.
 */
export interface IRetryableOperationMetadata {
  /** Unique identifier for the operation */
  operationId: string;
  
  /** Type of operation (e.g., 'send-push-notification', 'send-email', etc.) */
  operationType: string;
  
  /** Channel used for the operation (e.g., 'push', 'email', 'sms', 'in-app') */
  channel?: string;
  
  /** User ID associated with the operation */
  userId?: string;
  
  /** Journey context (e.g., 'health', 'care', 'plan', 'game') */
  journeyContext?: string;
  
  /** Priority level of the operation (higher priority may get more retry attempts) */
  priority?: 'high' | 'medium' | 'low';
  
  /** Maximum number of retry attempts for this operation */
  maxRetries?: number;
  
  /** Current retry attempt number (0 for first attempt) */
  currentAttempt: number;
  
  /** Timestamp when the operation was first attempted */
  firstAttemptAt: Date;
  
  /** Timestamp when the operation was last attempted */
  lastAttemptAt?: Date;
  
  /** Timestamp when the next retry should be attempted */
  nextAttemptAt?: Date;
  
  /** Current status of the retry operation */
  status: RetryStatus;
  
  /** Additional context information for the operation */
  context?: Record<string, any>;
}

/**
 * Interface for error information captured during a failed operation.
 * This provides structured error data for analysis and retry decision-making.
 */
export interface IRetryableOperationError {
  /** Error message */
  message: string;
  
  /** Error code or name */
  code?: string;
  
  /** Stack trace if available */
  stack?: string;
  
  /** Classification of the error type */
  type: ErrorType;
  
  /** Whether this error is considered retryable */
  isRetryable: boolean;
  
  /** Timestamp when the error occurred */
  timestamp: Date;
  
  /** Additional error context */
  context?: Record<string, any>;
  
  /** The underlying error object if available */
  originalError?: Error;
}

/**
 * Interface for a retryable operation.
 * 
 * This interface defines the contract for operations that can be retried by the retry service.
 * It provides methods for executing operations, accessing operation metadata, and handling
 * results or errors.
 * 
 * @template TParams - The type of parameters required by the operation
 * @template TResult - The type of result returned by the operation
 */
export interface IRetryableOperation<TParams, TResult> {
  /**
   * Executes the operation with the provided parameters.
   * 
   * @param params - Parameters required by the operation
   * @returns A promise that resolves with the operation result or rejects with an error
   */
  execute(params: TParams): Promise<TResult>;
  
  /**
   * Gets metadata about the operation for retry decision-making.
   * 
   * @returns Metadata about the operation
   */
  getMetadata(): IRetryableOperationMetadata;
  
  /**
   * Updates the metadata for the operation.
   * This is typically called by the retry service to update retry attempt information.
   * 
   * @param metadata - Updated metadata for the operation
   */
  updateMetadata(metadata: Partial<IRetryableOperationMetadata>): void;
  
  /**
   * Gets the parameters for the operation.
   * 
   * @returns The parameters required by the operation
   */
  getParams(): TParams;
  
  /**
   * Gets the result of the operation if it has completed successfully.
   * 
   * @returns The result of the operation or undefined if not yet successful
   */
  getResult(): TResult | undefined;
  
  /**
   * Gets the error information if the operation has failed.
   * 
   * @returns Error information or undefined if the operation hasn't failed
   */
  getError(): IRetryableOperationError | undefined;
  
  /**
   * Sets the error information for a failed operation.
   * This is typically called by the retry service when an operation fails.
   * 
   * @param error - Error information for the failed operation
   */
  setError(error: IRetryableOperationError): void;
  
  /**
   * Sets the result for a successful operation.
   * This is typically called by the retry service when an operation succeeds.
   * 
   * @param result - Result of the successful operation
   */
  setResult(result: TResult): void;
  
  /**
   * Determines if the operation should be retried based on its current state and error information.
   * 
   * @returns True if the operation should be retried, false otherwise
   */
  shouldRetry(): boolean;
  
  /**
   * Creates a clone of this operation with the same parameters and metadata.
   * This is useful for creating a new operation instance for retry attempts.
   * 
   * @returns A new operation instance with the same parameters and metadata
   */
  clone(): IRetryableOperation<TParams, TResult>;
  
  /**
   * Handles successful completion of the operation.
   * This method is called by the retry service when an operation succeeds.
   * 
   * @param result - Result of the successful operation
   */
  onSuccess(result: TResult): Promise<void>;
  
  /**
   * Handles permanent failure of the operation after all retry attempts are exhausted.
   * This method is called by the retry service when an operation permanently fails.
   * 
   * @param error - Error information for the failed operation
   */
  onExhausted(error: IRetryableOperationError): Promise<void>;
  
  /**
   * Handles temporary failure of the operation before retry.
   * This method is called by the retry service when an operation fails but will be retried.
   * 
   * @param error - Error information for the failed operation
   * @param nextAttemptAt - Timestamp when the next retry will be attempted
   */
  onRetry(error: IRetryableOperationError, nextAttemptAt: Date): Promise<void>;
  
  /**
   * Validates the operation parameters before execution.
   * This method is called by the retry service before executing the operation.
   * 
   * @param params - Parameters to validate
   * @returns True if the parameters are valid, false otherwise
   */
  validateParams(params: TParams): boolean;
  
  /**
   * Gets a string representation of the operation for logging purposes.
   * 
   * @returns A string representation of the operation
   */
  toString(): string;
}
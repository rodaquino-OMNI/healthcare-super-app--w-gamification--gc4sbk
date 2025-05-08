/**
 * Error type classifications for the notification service retry mechanism.
 * These classifications determine the appropriate retry behavior for different types of errors.
 */

/**
 * Enum representing the different types of errors that can occur in the notification service.
 * Each error type has specific characteristics and retry behaviors.
 */
export enum ErrorType {
  /**
   * Transient errors are temporary issues that are likely to be resolved by retrying.
   * 
   * Characteristics:
   * - Temporary in nature
   * - Usually resolve themselves after some time
   * - Appropriate for retry with exponential backoff
   * 
   * Examples:
   * - Network timeouts
   * - Temporary service unavailability
   * - Connection reset errors
   * - Rate limiting (temporary)
   * - Database connection timeouts
   */
  TRANSIENT = 'TRANSIENT',

  /**
   * Client errors are caused by issues with the client request and will not be resolved by retrying.
   * 
   * Characteristics:
   * - Caused by invalid input or client configuration
   * - Will fail consistently with the same input
   * - Not appropriate for automatic retry
   * 
   * Examples:
   * - Invalid notification payload
   * - Missing required fields
   * - Authentication failures
   * - Authorization issues
   * - Invalid recipient information
   */
  CLIENT = 'CLIENT',

  /**
   * System errors are internal issues within the notification service or its infrastructure.
   * 
   * Characteristics:
   * - Caused by internal system failures
   * - May be resolved by retrying after system recovery
   * - May require manual intervention
   * - Limited retry attempts with longer intervals
   * 
   * Examples:
   * - Database errors (not connection-related)
   * - Out of memory errors
   * - Unhandled exceptions
   * - Configuration errors
   * - Resource exhaustion
   */
  SYSTEM = 'SYSTEM',

  /**
   * External errors are caused by failures in external dependencies or third-party services.
   * 
   * Characteristics:
   * - Caused by external service failures
   * - May be resolved by retrying after the external service recovers
   * - May require fallback to alternative services
   * - Appropriate for retry with circuit breaker pattern
   * 
   * Examples:
   * - Email service provider failures
   * - SMS gateway errors
   * - Push notification service outages
   * - Third-party API failures
   * - External authentication service issues
   */
  EXTERNAL = 'EXTERNAL'
}

/**
 * Interface for error classification metadata.
 * Provides additional information about each error type to assist with classification and handling.
 */
export interface ErrorTypeMetadata {
  /** Whether this error type should be automatically retried */
  isRetryable: boolean;
  /** Maximum number of retry attempts recommended for this error type */
  recommendedMaxRetries: number;
  /** Whether to use exponential backoff for retries */
  useExponentialBackoff: boolean;
  /** Whether to apply circuit breaker pattern */
  applyCircuitBreaker: boolean;
  /** Description of the error type */
  description: string;
}

/**
 * Metadata for each error type to guide retry behavior and error handling.
 */
export const ERROR_TYPE_METADATA: Record<ErrorType, ErrorTypeMetadata> = {
  [ErrorType.TRANSIENT]: {
    isRetryable: true,
    recommendedMaxRetries: 5,
    useExponentialBackoff: true,
    applyCircuitBreaker: false,
    description: 'Temporary error that may resolve with retry'
  },
  [ErrorType.CLIENT]: {
    isRetryable: false,
    recommendedMaxRetries: 0,
    useExponentialBackoff: false,
    applyCircuitBreaker: false,
    description: 'Client-side error that will not resolve with retry'
  },
  [ErrorType.SYSTEM]: {
    isRetryable: true,
    recommendedMaxRetries: 3,
    useExponentialBackoff: true,
    applyCircuitBreaker: true,
    description: 'Internal system error that may require intervention'
  },
  [ErrorType.EXTERNAL]: {
    isRetryable: true,
    recommendedMaxRetries: 4,
    useExponentialBackoff: true,
    applyCircuitBreaker: true,
    description: 'External dependency error that may resolve with retry or require fallback'
  }
};

/**
 * Helper function to determine if an error should be retried based on its type.
 * 
 * @param errorType The type of error to check
 * @returns True if the error type is retryable, false otherwise
 */
export function isRetryableErrorType(errorType: ErrorType): boolean {
  return ERROR_TYPE_METADATA[errorType].isRetryable;
}

/**
 * Helper function to get the recommended maximum number of retry attempts for an error type.
 * 
 * @param errorType The type of error to check
 * @returns The recommended maximum number of retry attempts
 */
export function getRecommendedMaxRetries(errorType: ErrorType): number {
  return ERROR_TYPE_METADATA[errorType].recommendedMaxRetries;
}

/**
 * Helper function to determine if exponential backoff should be used for an error type.
 * 
 * @param errorType The type of error to check
 * @returns True if exponential backoff should be used, false otherwise
 */
export function shouldUseExponentialBackoff(errorType: ErrorType): boolean {
  return ERROR_TYPE_METADATA[errorType].useExponentialBackoff;
}

/**
 * Helper function to determine if circuit breaker pattern should be applied for an error type.
 * 
 * @param errorType The type of error to check
 * @returns True if circuit breaker should be applied, false otherwise
 */
export function shouldApplyCircuitBreaker(errorType: ErrorType): boolean {
  return ERROR_TYPE_METADATA[errorType].applyCircuitBreaker;
}
/**
 * Error type classifications for the notification service retry mechanism.
 * These classifications determine the appropriate retry behavior for different types of errors.
 */

/**
 * Enum representing different error types for retry classification.
 */
export enum ErrorType {
  /**
   * Transient errors are temporary issues that are likely to resolve on their own.
   * Examples: Network timeouts, temporary service unavailability, connection reset.
   * Retry strategy: Should be retried with exponential backoff.
   */
  TRANSIENT = 'TRANSIENT',

  /**
   * Client errors are caused by invalid client requests or authentication issues.
   * Examples: Invalid input data, missing required fields, authentication failures.
   * Retry strategy: Should NOT be retried as the error is deterministic and will persist.
   */
  CLIENT = 'CLIENT',

  /**
   * System errors are internal server errors within our application.
   * Examples: Database errors, unhandled exceptions, memory issues.
   * Retry strategy: Limited retries with monitoring and alerting.
   */
  SYSTEM = 'SYSTEM',

  /**
   * External dependency errors are failures in third-party systems we integrate with.
   * Examples: External API failures, third-party service outages.
   * Retry strategy: Retry with backoff and circuit breaker pattern.
   */
  EXTERNAL = 'EXTERNAL'
}

/**
 * Characteristics of each error type to help with automatic classification.
 */
export const ERROR_TYPE_CHARACTERISTICS = {
  [ErrorType.TRANSIENT]: {
    statusCodes: [408, 429, 503, 504],
    errorMessages: [
      'timeout', 
      'connection reset', 
      'temporarily unavailable', 
      'too many requests',
      'service unavailable',
      'gateway timeout'
    ],
    isRetryable: true,
    maxRetries: 5,
    backoffFactor: 2, // Exponential backoff
    initialDelayMs: 100
  },
  [ErrorType.CLIENT]: {
    statusCodes: [400, 401, 403, 404, 422],
    errorMessages: [
      'invalid input', 
      'unauthorized', 
      'forbidden', 
      'not found',
      'validation failed',
      'invalid credentials'
    ],
    isRetryable: false,
    maxRetries: 0,
    backoffFactor: 1,
    initialDelayMs: 0
  },
  [ErrorType.SYSTEM]: {
    statusCodes: [500, 501, 502, 507],
    errorMessages: [
      'internal server error', 
      'not implemented', 
      'bad gateway',
      'database error',
      'insufficient storage'
    ],
    isRetryable: true,
    maxRetries: 3,
    backoffFactor: 1.5,
    initialDelayMs: 200
  },
  [ErrorType.EXTERNAL]: {
    statusCodes: [502, 503, 504],
    errorMessages: [
      'external service unavailable', 
      'third-party error', 
      'integration failed',
      'external api error',
      'dependency failed'
    ],
    isRetryable: true,
    maxRetries: 4,
    backoffFactor: 2,
    initialDelayMs: 150,
    circuitBreakerThreshold: 5 // Number of failures before circuit opens
  }
};

/**
 * Maps HTTP status codes to their most likely error type.
 * Note: This is a heuristic and may need to be combined with error message analysis
 * for more accurate classification.
 */
export const HTTP_STATUS_TO_ERROR_TYPE: Record<number, ErrorType> = {
  400: ErrorType.CLIENT,  // Bad Request
  401: ErrorType.CLIENT,  // Unauthorized
  403: ErrorType.CLIENT,  // Forbidden
  404: ErrorType.CLIENT,  // Not Found
  408: ErrorType.TRANSIENT, // Request Timeout
  422: ErrorType.CLIENT,  // Unprocessable Entity
  429: ErrorType.TRANSIENT, // Too Many Requests
  500: ErrorType.SYSTEM,  // Internal Server Error
  501: ErrorType.SYSTEM,  // Not Implemented
  502: ErrorType.EXTERNAL, // Bad Gateway
  503: ErrorType.TRANSIENT, // Service Unavailable
  504: ErrorType.TRANSIENT, // Gateway Timeout
  507: ErrorType.SYSTEM   // Insufficient Storage
};

/**
 * Utility function to classify an error based on status code and error message.
 * @param statusCode - HTTP status code if available
 * @param errorMessage - Error message string
 * @returns The classified ErrorType
 */
export function classifyError(statusCode?: number, errorMessage?: string): ErrorType {
  // If we have a status code, use it as primary classification method
  if (statusCode && HTTP_STATUS_TO_ERROR_TYPE[statusCode]) {
    return HTTP_STATUS_TO_ERROR_TYPE[statusCode];
  }
  
  // If we have an error message, check for characteristic patterns
  if (errorMessage) {
    const lowerCaseMessage = errorMessage.toLowerCase();
    
    // Check each error type for matching message patterns
    for (const [errorType, characteristics] of Object.entries(ERROR_TYPE_CHARACTERISTICS)) {
      if (characteristics.errorMessages.some(pattern => 
        lowerCaseMessage.includes(pattern.toLowerCase())
      )) {
        return errorType as ErrorType;
      }
    }
  }
  
  // Default to SYSTEM error if we can't classify
  return ErrorType.SYSTEM;
}
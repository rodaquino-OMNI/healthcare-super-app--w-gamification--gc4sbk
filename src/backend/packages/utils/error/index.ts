/**
 * @file Error handling utilities for the AUSTA SuperApp
 * 
 * This module provides a comprehensive set of error handling utilities
 * to help build robust and resilient applications. It includes tools for
 * circuit breaking, error classification, and standardized error handling.
 * 
 * @module @austa/utils/error
 */

/**
 * Circuit Breaker Pattern
 * 
 * Utilities for implementing the circuit breaker pattern to prevent
 * cascading failures when interacting with failing services or dependencies.
 */
export {
  CircuitBreaker,
  CircuitBreakerError,
  CircuitBreakerState,
  CircuitBreakerEvents,
  type CircuitBreakerOptions,
  type CircuitBreakerMetrics
} from './circuit-breaker';

/**
 * Error Types and Classification
 * 
 * Standardized error types and base exception classes for consistent
 * error handling across the application.
 */
export { ErrorType } from '@austa/interfaces';

/**
 * Base exception class for application-specific errors.
 * All custom exceptions in the AUSTA SuperApp should extend this class
 * to ensure consistent error handling and responses across all journeys.
 */
export class AppException extends Error {
  /**
   * Creates a new AppException instance.
   * 
   * @param message - Human-readable error message
   * @param type - Type of error from ErrorType enum
   * @param code - Error code for more specific categorization (e.g., "HEALTH_001")
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly message: string,
    public readonly type: ErrorType,
    public readonly code: string,
    public readonly details?: any,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppException.prototype);
  }

  /**
   * Returns a JSON representation of the exception.
   * Used for consistent error responses across the application.
   * 
   * @returns JSON object with standardized error structure
   */
  toJSON(): Record<string, any> {
    return {
      error: {
        type: this.type,
        code: this.code,
        message: this.message,
        details: this.details
      }
    };
  }

  /**
   * Converts the AppException to an HttpException for NestJS.
   * Maps error types to appropriate HTTP status codes.
   * 
   * @returns An HttpException instance that can be thrown in NestJS controllers
   */
  toHttpException(): any { // Using 'any' to avoid direct dependency on NestJS
    // This implementation will be provided by the NestJS adapter
    throw new Error('Method not implemented. Use the NestJS adapter for this functionality.');
  }
}

/**
 * Specialized exception classes for common error scenarios
 */

/**
 * Thrown when a validation error occurs, such as invalid input data.
 * Maps to HTTP 400 Bad Request.
 */
export class ValidationException extends AppException {
  constructor(
    message: string,
    code: string,
    details?: any,
    cause?: Error
  ) {
    super(message, ErrorType.VALIDATION, code, details, cause);
  }
}

/**
 * Thrown when a business rule is violated.
 * Maps to HTTP 422 Unprocessable Entity.
 */
export class BusinessException extends AppException {
  constructor(
    message: string,
    code: string,
    details?: any,
    cause?: Error
  ) {
    super(message, ErrorType.BUSINESS, code, details, cause);
  }
}

/**
 * Thrown when an unexpected technical error occurs.
 * Maps to HTTP 500 Internal Server Error.
 */
export class TechnicalException extends AppException {
  constructor(
    message: string,
    code: string,
    details?: any,
    cause?: Error
  ) {
    super(message, ErrorType.TECHNICAL, code, details, cause);
  }
}

/**
 * Thrown when an error occurs in an external system or dependency.
 * Maps to HTTP 502 Bad Gateway.
 */
export class ExternalException extends AppException {
  constructor(
    message: string,
    code: string,
    details?: any,
    cause?: Error
  ) {
    super(message, ErrorType.EXTERNAL, code, details, cause);
  }
}

/**
 * Utility functions for error handling
 */

/**
 * Determines if an error is an instance of AppException.
 * 
 * @param error - The error to check
 * @returns true if the error is an AppException, false otherwise
 */
export function isAppException(error: unknown): error is AppException {
  return error instanceof AppException;
}

/**
 * Wraps an error in an AppException if it isn't already one.
 * 
 * @param error - The error to wrap
 * @param defaultMessage - Default message to use if the error doesn't have one
 * @param defaultCode - Default code to use
 * @param defaultType - Default error type to use
 * @returns An AppException
 */
export function wrapError(
  error: unknown,
  defaultMessage = 'An unexpected error occurred',
  defaultCode = 'UNKNOWN_ERROR',
  defaultType = ErrorType.TECHNICAL
): AppException {
  if (isAppException(error)) {
    return error;
  }
  
  const message = error instanceof Error ? error.message : defaultMessage;
  return new AppException(message, defaultType, defaultCode, undefined, error instanceof Error ? error : undefined);
}
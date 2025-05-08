import { HttpException, HttpStatus } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

/**
 * Error classification types for the application
 */
export enum ErrorType {
  // Client errors (4xx)
  VALIDATION = 'VALIDATION',       // Input validation failures
  AUTHENTICATION = 'AUTHENTICATION', // Auth failures
  AUTHORIZATION = 'AUTHORIZATION',   // Permission issues
  NOT_FOUND = 'NOT_FOUND',         // Resource not found
  CONFLICT = 'CONFLICT',           // Resource conflict
  BAD_REQUEST = 'BAD_REQUEST',     // General client error
  
  // System errors (5xx)
  INTERNAL = 'INTERNAL',           // Unexpected internal errors
  DATABASE = 'DATABASE',           // Database operation failures
  CONFIGURATION = 'CONFIGURATION', // System config issues
  
  // External dependency errors
  EXTERNAL = 'EXTERNAL',           // Generic external system error
  INTEGRATION = 'INTEGRATION',     // Integration point failures
  KAFKA = 'KAFKA',                // Kafka-specific issues
  
  // Transient errors (retryable)
  TRANSIENT = 'TRANSIENT',         // Temporary failures
  TIMEOUT = 'TIMEOUT',             // Operation timeouts
  RATE_LIMIT = 'RATE_LIMIT',       // Rate limiting issues
}

/**
 * Error context interface for capturing additional metadata
 */
export interface ErrorContext {
  requestId?: string;      // Correlation ID for request tracing
  userId?: string;         // User ID for user-specific errors
  journey?: string;        // Journey context (health, care, plan)
  source?: string;         // Source of the error (service, component)
  timestamp?: Date;        // When the error occurred
  [key: string]: any;      // Additional context properties
}

/**
 * Error response interface for serialization
 */
export interface ErrorResponse {
  errorId: string;         // Unique error instance ID
  errorCode: string;       // Application error code
  errorType: ErrorType;    // Error classification
  message: string;         // User-friendly error message
  timestamp: string;       // ISO timestamp of error
  path?: string;           // API path where error occurred
  details?: any;           // Additional error details (safe for client)
}

/**
 * Base exception class for the application
 * All other exceptions should extend this class
 */
export abstract class AppException extends HttpException {
  /**
   * Unique identifier for this error instance
   */
  readonly errorId: string;

  /**
   * Application-specific error code
   */
  readonly errorCode: string;

  /**
   * Classification of the error
   */
  readonly errorType: ErrorType;

  /**
   * Timestamp when the error occurred
   */
  readonly timestamp: Date;

  /**
   * Additional context for the error
   */
  readonly context: ErrorContext;

  /**
   * Whether this error is retryable
   */
  readonly isRetryable: boolean;

  /**
   * Creates a new AppException
   * 
   * @param message User-friendly error message
   * @param errorCode Application error code
   * @param errorType Classification of the error
   * @param statusCode HTTP status code
   * @param context Additional error context
   * @param isRetryable Whether this error can be retried
   */
  constructor(
    message: string,
    errorCode: string,
    errorType: ErrorType,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    context: ErrorContext = {},
    isRetryable: boolean = false,
  ) {
    // Create the response object for the HttpException base class
    const response = {
      statusCode,
      message,
      errorCode,
      errorType,
    };

    super(response, statusCode);

    this.errorId = uuidv4();
    this.errorCode = errorCode;
    this.errorType = errorType;
    this.timestamp = new Date();
    this.context = {
      ...context,
      timestamp: this.timestamp,
    };
    this.isRetryable = isRetryable;

    // Preserve the prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppException.prototype);
  }

  /**
   * Determines if this is a client error (4xx)
   */
  isClientError(): boolean {
    return [
      ErrorType.VALIDATION,
      ErrorType.AUTHENTICATION,
      ErrorType.AUTHORIZATION,
      ErrorType.NOT_FOUND,
      ErrorType.CONFLICT,
      ErrorType.BAD_REQUEST,
    ].includes(this.errorType);
  }

  /**
   * Determines if this is a system error (5xx)
   */
  isSystemError(): boolean {
    return [
      ErrorType.INTERNAL,
      ErrorType.DATABASE,
      ErrorType.CONFIGURATION,
    ].includes(this.errorType);
  }

  /**
   * Determines if this is an external dependency error
   */
  isExternalError(): boolean {
    return [
      ErrorType.EXTERNAL,
      ErrorType.INTEGRATION,
      ErrorType.KAFKA,
    ].includes(this.errorType);
  }

  /**
   * Determines if this is a transient error
   */
  isTransientError(): boolean {
    return [
      ErrorType.TRANSIENT,
      ErrorType.TIMEOUT,
      ErrorType.RATE_LIMIT,
    ].includes(this.errorType) || this.isRetryable;
  }

  /**
   * Serializes the error for API responses
   * Only includes information safe for clients
   */
  toResponse(includeDetails: boolean = false): ErrorResponse {
    const response: ErrorResponse = {
      errorId: this.errorId,
      errorCode: this.errorCode,
      errorType: this.errorType,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
    };

    // Include path if available
    if (this.context.path) {
      response.path = this.context.path;
    }

    // Include safe details if requested and available
    if (includeDetails && this.context.details) {
      response.details = this.sanitizeDetails(this.context.details);
    }

    return response;
  }

  /**
   * Serializes the error for logging
   * Includes all context for internal debugging
   */
  toLog(): Record<string, any> {
    return {
      errorId: this.errorId,
      errorCode: this.errorCode,
      errorType: this.errorType,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      isRetryable: this.isRetryable,
      context: this.context,
      stack: this.stack,
    };
  }

  /**
   * Enriches the error with additional context
   * @param additionalContext Additional context to add
   */
  withContext(additionalContext: ErrorContext): this {
    this.context = {
      ...this.context,
      ...additionalContext,
    };
    return this;
  }

  /**
   * Sanitizes error details for client responses
   * Removes sensitive information
   * @param details Raw error details
   */
  private sanitizeDetails(details: any): any {
    // If details is not an object, return as is
    if (typeof details !== 'object' || details === null) {
      return details;
    }

    // Create a copy to avoid modifying the original
    const sanitized = Array.isArray(details) ? [...details] : { ...details };

    // List of sensitive fields to remove
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'authorization',
      'credential', 'ssn', 'creditCard', 'accessToken', 'refreshToken',
    ];

    // Remove sensitive fields
    if (!Array.isArray(sanitized)) {
      for (const field of sensitiveFields) {
        if (field in sanitized) {
          delete sanitized[field];
        }
      }

      // Recursively sanitize nested objects
      for (const key in sanitized) {
        if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
          sanitized[key] = this.sanitizeDetails(sanitized[key]);
        }
      }
    } else {
      // Handle arrays by sanitizing each element
      for (let i = 0; i < sanitized.length; i++) {
        if (typeof sanitized[i] === 'object' && sanitized[i] !== null) {
          sanitized[i] = this.sanitizeDetails(sanitized[i]);
        }
      }
    }

    return sanitized;
  }
}
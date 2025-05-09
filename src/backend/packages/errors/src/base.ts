import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Enhanced enum representing different types of errors in the application.
 * Used to categorize exceptions for consistent error handling across services.
 */
export enum ErrorType {
  /**
   * Validation errors - input data fails validation requirements
   * Maps to HTTP 400 Bad Request
   */
  VALIDATION = 'validation',
  
  /**
   * Authentication errors - user is not authenticated or session is invalid
   * Maps to HTTP 401 Unauthorized
   */
  AUTHENTICATION = 'authentication',
  
  /**
   * Authorization errors - user lacks permission for the requested operation
   * Maps to HTTP 403 Forbidden
   */
  AUTHORIZATION = 'authorization',
  
  /**
   * Not found errors - requested resource does not exist
   * Maps to HTTP 404 Not Found
   */
  NOT_FOUND = 'not_found',
  
  /**
   * Conflict errors - operation cannot be performed due to resource state
   * Maps to HTTP 409 Conflict
   */
  CONFLICT = 'conflict',
  
  /**
   * Business logic errors - operation cannot be completed due to business rules
   * Maps to HTTP 422 Unprocessable Entity
   */
  BUSINESS = 'business',
  
  /**
   * Rate limit errors - too many requests from client
   * Maps to HTTP 429 Too Many Requests
   */
  RATE_LIMIT = 'rate_limit',
  
  /**
   * Technical errors - unexpected system errors and exceptions
   * Maps to HTTP 500 Internal Server Error
   */
  TECHNICAL = 'technical',
  
  /**
   * External system errors - failures in external services or dependencies
   * Maps to HTTP 502 Bad Gateway
   */
  EXTERNAL = 'external',
  
  /**
   * Service unavailable errors - service is temporarily unavailable
   * Maps to HTTP 503 Service Unavailable
   */
  UNAVAILABLE = 'unavailable',
  
  /**
   * Timeout errors - operation timed out
   * Maps to HTTP 504 Gateway Timeout
   */
  TIMEOUT = 'timeout'
}

/**
 * Represents the journey context in which an error occurred.
 * Used for better error categorization and client-friendly responses.
 */
export enum JourneyContext {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  GAMIFICATION = 'gamification',
  AUTH = 'auth',
  NOTIFICATION = 'notification',
  SYSTEM = 'system'
}

/**
 * Interface for error context information.
 * Provides additional metadata about the error for better debugging and tracking.
 */
export interface ErrorContext {
  /**
   * The journey context in which the error occurred
   */
  journey?: JourneyContext;
  
  /**
   * User ID associated with the error, if applicable
   */
  userId?: string;
  
  /**
   * Request ID for tracking the error across services
   */
  requestId?: string;
  
  /**
   * Trace ID for distributed tracing integration
   */
  traceId?: string;
  
  /**
   * Span ID for distributed tracing integration
   */
  spanId?: string;
  
  /**
   * Timestamp when the error occurred
   */
  timestamp?: Date;
  
  /**
   * Additional contextual data specific to the error
   */
  [key: string]: any;
}

/**
 * Interface for serialized error response.
 * Defines the structure of error responses sent to clients.
 */
export interface SerializedError {
  error: {
    type: string;
    code: string;
    message: string;
    journey?: string;
    requestId?: string;
    timestamp?: string;
    details?: any;
    path?: string;
    suggestion?: string;
  };
}

/**
 * Base class for all application-specific errors in the AUSTA SuperApp.
 * Provides enhanced error handling with proper context tracking, serialization,
 * and integration with observability tools.
 */
export class BaseError extends Error {
  /**
   * Creates a new BaseError instance.
   * 
   * @param message - Human-readable error message
   * @param type - Type of error from ErrorType enum
   * @param code - Error code for more specific categorization (e.g., "HEALTH_001")
   * @param context - Additional context information about the error
   * @param details - Additional details about the error (optional)
   * @param suggestion - Suggested action to resolve the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly message: string,
    public readonly type: ErrorType,
    public readonly code: string,
    public readonly context: ErrorContext = {},
    public readonly details?: any,
    public readonly suggestion?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // Set default timestamp if not provided
    if (!this.context.timestamp) {
      this.context.timestamp = new Date();
    }
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BaseError.prototype);
  }

  /**
   * Returns a JSON representation of the error.
   * Used for consistent error responses across the application.
   * 
   * @returns JSON object with standardized error structure
   */
  toJSON(): SerializedError {
    return {
      error: {
        type: this.type,
        code: this.code,
        message: this.message,
        journey: this.context.journey,
        requestId: this.context.requestId,
        timestamp: this.context.timestamp?.toISOString(),
        details: this.details,
        suggestion: this.suggestion
      }
    };
  }

  /**
   * Converts the BaseError to an HttpException for NestJS.
   * Maps error types to appropriate HTTP status codes.
   * 
   * @returns An HttpException instance that can be thrown in NestJS controllers
   */
  toHttpException(): HttpException {
    const statusCode = this.getHttpStatusCode();
    return new HttpException(this.toJSON(), statusCode);
  }

  /**
   * Creates a new BaseError with additional context information.
   * Useful for enriching errors as they propagate through the system.
   * 
   * @param additionalContext - Additional context to add to the error
   * @returns A new BaseError instance with combined context
   */
  withContext(additionalContext: Partial<ErrorContext>): BaseError {
    return new BaseError(
      this.message,
      this.type,
      this.code,
      { ...this.context, ...additionalContext },
      this.details,
      this.suggestion,
      this.cause
    );
  }

  /**
   * Creates a new BaseError with additional details.
   * Useful for adding more information about the error.
   * 
   * @param additionalDetails - Additional details to add to the error
   * @returns A new BaseError instance with combined details
   */
  withDetails(additionalDetails: any): BaseError {
    return new BaseError(
      this.message,
      this.type,
      this.code,
      this.context,
      { ...this.details, ...additionalDetails },
      this.suggestion,
      this.cause
    );
  }

  /**
   * Creates a new BaseError with a suggestion for resolving the error.
   * Useful for providing guidance to users or developers.
   * 
   * @param suggestion - Suggestion for resolving the error
   * @returns A new BaseError instance with the suggestion
   */
  withSuggestion(suggestion: string): BaseError {
    return new BaseError(
      this.message,
      this.type,
      this.code,
      this.context,
      this.details,
      suggestion,
      this.cause
    );
  }

  /**
   * Creates a new BaseError with a cause.
   * Useful for wrapping lower-level errors with more context.
   * 
   * @param cause - The error that caused this error
   * @returns A new BaseError instance with the cause
   */
  withCause(cause: Error): BaseError {
    return new BaseError(
      this.message,
      this.type,
      this.code,
      this.context,
      this.details,
      this.suggestion,
      cause
    );
  }

  /**
   * Determines if the error is a client error (4xx).
   * 
   * @returns True if the error is a client error, false otherwise
   */
  isClientError(): boolean {
    const statusCode = this.getHttpStatusCode();
    return statusCode >= 400 && statusCode < 500;
  }

  /**
   * Determines if the error is a server error (5xx).
   * 
   * @returns True if the error is a server error, false otherwise
   */
  isServerError(): boolean {
    const statusCode = this.getHttpStatusCode();
    return statusCode >= 500;
  }

  /**
   * Determines if the error is retryable.
   * Generally, server errors and some specific client errors are retryable.
   * 
   * @returns True if the error is retryable, false otherwise
   */
  isRetryable(): boolean {
    // Server errors (except 501 Not Implemented) are generally retryable
    if (this.isServerError() && this.getHttpStatusCode() !== HttpStatus.NOT_IMPLEMENTED) {
      return true;
    }
    
    // Some specific client errors are retryable
    return this.type === ErrorType.RATE_LIMIT || this.type === ErrorType.TIMEOUT;
  }

  /**
   * Determines the appropriate HTTP status code based on the error type.
   */
  getHttpStatusCode(): HttpStatus {
    switch (this.type) {
      case ErrorType.VALIDATION:
        return HttpStatus.BAD_REQUEST;
      case ErrorType.AUTHENTICATION:
        return HttpStatus.UNAUTHORIZED;
      case ErrorType.AUTHORIZATION:
        return HttpStatus.FORBIDDEN;
      case ErrorType.NOT_FOUND:
        return HttpStatus.NOT_FOUND;
      case ErrorType.CONFLICT:
        return HttpStatus.CONFLICT;
      case ErrorType.BUSINESS:
        return HttpStatus.UNPROCESSABLE_ENTITY;
      case ErrorType.RATE_LIMIT:
        return HttpStatus.TOO_MANY_REQUESTS;
      case ErrorType.EXTERNAL:
        return HttpStatus.BAD_GATEWAY;
      case ErrorType.UNAVAILABLE:
        return HttpStatus.SERVICE_UNAVAILABLE;
      case ErrorType.TIMEOUT:
        return HttpStatus.GATEWAY_TIMEOUT;
      case ErrorType.TECHNICAL:
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  /**
   * Creates a standardized log entry for the error.
   * Useful for consistent error logging across the application.
   * 
   * @returns Object suitable for logging
   */
  toLogEntry(): Record<string, any> {
    return {
      error: {
        name: this.name,
        type: this.type,
        code: this.code,
        message: this.message,
        stack: this.stack,
        cause: this.cause ? {
          name: this.cause.name,
          message: this.cause.message,
          stack: this.cause.stack
        } : undefined,
        details: this.details
      },
      context: this.context,
      timestamp: this.context.timestamp?.toISOString() || new Date().toISOString(),
      httpStatus: this.getHttpStatusCode()
    };
  }

  /**
   * Factory method to create a BaseError from any error.
   * Useful for standardizing error handling for errors from external sources.
   * 
   * @param error - The error to convert
   * @param defaultType - Default error type if not determinable from the error
   * @param defaultCode - Default error code if not determinable from the error
   * @param context - Additional context information
   * @returns A new BaseError instance
   */
  static from(
    error: unknown,
    defaultType: ErrorType = ErrorType.TECHNICAL,
    defaultCode: string = 'UNKNOWN_ERROR',
    context: ErrorContext = {}
  ): BaseError {
    // If it's already a BaseError, just add the context
    if (error instanceof BaseError) {
      return error.withContext(context);
    }
    
    // If it's a standard Error, convert it
    if (error instanceof Error) {
      return new BaseError(
        error.message,
        defaultType,
        defaultCode,
        context,
        undefined,
        undefined,
        error
      );
    }
    
    // For non-Error objects or primitives
    const errorMessage = typeof error === 'string' 
      ? error 
      : `Unknown error: ${JSON.stringify(error)}`;
    
    return new BaseError(
      errorMessage,
      defaultType,
      defaultCode,
      context
    );
  }
}
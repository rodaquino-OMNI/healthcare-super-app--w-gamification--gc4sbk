import { HttpException, HttpStatus } from '@nestjs/common';
import { context, trace, SpanStatusCode } from '@opentelemetry/api';

/**
 * Enum representing different types of errors in the application.
 * Used to categorize exceptions for consistent error handling across services.
 */
export enum ErrorType {
  /**
   * Validation errors - input data fails validation requirements
   * Maps to HTTP 400 Bad Request
   */
  VALIDATION = 'validation',
  
  /**
   * Business logic errors - operation cannot be completed due to business rules
   * Maps to HTTP 422 Unprocessable Entity
   */
  BUSINESS = 'business',
  
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
   * Authentication errors - user is not authenticated or session is invalid
   * Maps to HTTP 401 Unauthorized
   */
  AUTHENTICATION = 'authentication',

  /**
   * Authorization errors - user does not have permission to access a resource
   * Maps to HTTP 403 Forbidden
   */
  AUTHORIZATION = 'authorization',

  /**
   * Not found errors - requested resource does not exist
   * Maps to HTTP 404 Not Found
   */
  NOT_FOUND = 'not_found',

  /**
   * Conflict errors - request conflicts with current state of the server
   * Maps to HTTP 409 Conflict
   */
  CONFLICT = 'conflict',

  /**
   * Rate limit errors - too many requests in a given amount of time
   * Maps to HTTP 429 Too Many Requests
   */
  RATE_LIMIT = 'rate_limit',

  /**
   * Timeout errors - request took too long to process
   * Maps to HTTP 504 Gateway Timeout
   */
  TIMEOUT = 'timeout'
}

/**
 * Enum representing the different journeys in the AUSTA SuperApp.
 * Used to provide context for errors and facilitate journey-specific error handling.
 */
export enum JourneyType {
  /**
   * Health journey - related to health metrics, goals, and insights
   */
  HEALTH = 'health',

  /**
   * Care journey - related to appointments, medications, and treatments
   */
  CARE = 'care',

  /**
   * Plan journey - related to insurance plans, benefits, and claims
   */
  PLAN = 'plan',

  /**
   * Gamification - related to achievements, rewards, and quests
   */
  GAMIFICATION = 'gamification',

  /**
   * Authentication - related to user authentication and authorization
   */
  AUTH = 'auth',

  /**
   * Notification - related to user notifications
   */
  NOTIFICATION = 'notification',

  /**
   * System - related to system-wide operations
   */
  SYSTEM = 'system'
}

/**
 * Interface for error context information.
 * Provides additional metadata about the error to aid in debugging and monitoring.
 */
/**
 * Interface for client-friendly error response.
 * This is what gets returned to the client in API responses.
 */
export interface ErrorResponse {
  /**
   * Error type for categorization
   */
  type: string;
  
  /**
   * Error code for more specific categorization
   */
  code: string;
  
  /**
   * Human-readable error message
   */
  message: string;
  
  /**
   * Additional details about the error
   */
  details?: any;
  
  /**
   * Journey context where the error occurred
   */
  journey?: string;
  
  /**
   * Request ID for reference
   */
  requestId?: string;
  
  /**
   * Timestamp when the error occurred
   */
  timestamp?: string;
  
  /**
   * User guidance for resolving the error, if applicable
   */
  userGuidance?: string;
  
  /**
   * Link to documentation or help resources, if applicable
   */
  helpLink?: string;
}

/**
 * Base class for all errors in the AUSTA SuperApp.
 * Provides enhanced error handling with context tracking, serialization,
 * and integration with observability tools.
 */
export class BaseError extends Error {
  /**
   * Error context with additional metadata
   */
  public readonly context: ErrorContext;

  /**
   * Creates a new BaseError instance.
   * 
   * @param message - Human-readable error message
   * @param type - Type of error from ErrorType enum
   * @param code - Error code for more specific categorization (e.g., "HEALTH_001")
   * @param context - Additional context information about the error
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    public readonly message: string,
    public readonly type: ErrorType,
    public readonly code: string,
    context?: Partial<ErrorContext>,
    public readonly details?: any,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BaseError.prototype);

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Initialize context with defaults and provided values
    this.context = {
      timestamp: new Date(),
      stack: this.stack,
      ...this.captureTraceContext(),
      ...context
    };

    // Record error in current span if available
    this.recordErrorInSpan();
  }

  /**
   * Captures the current OpenTelemetry trace context if available.
   * @private
   * @returns Object containing traceId and spanId if available
   */
  private captureTraceContext(): Pick<ErrorContext, 'traceId' | 'spanId'> {
    const result: Pick<ErrorContext, 'traceId' | 'spanId'> = {};
    
    const activeSpan = trace.getSpan(context.active());
    if (activeSpan) {
      const spanContext = activeSpan.spanContext();
      result.traceId = spanContext.traceId;
      result.spanId = spanContext.spanId;
    }
    
    return result;
  }

  /**
   * Records the error in the current OpenTelemetry span if available.
   * @private
   */
  private recordErrorInSpan(): void {
    const activeSpan = trace.getSpan(context.active());
    if (activeSpan) {
      activeSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: this.message
      });
      
      activeSpan.recordException({
        name: this.name,
        message: this.message,
        stack: this.stack,
        code: this.code,
        type: this.type
      });
      
      // Add error attributes to the span for better filtering in observability tools
      activeSpan.setAttribute('error.type', this.type);
      activeSpan.setAttribute('error.code', this.code);
      
      if (this.context.journey) {
        activeSpan.setAttribute('error.journey', this.context.journey);
      }
      
      if (this.context.component) {
        activeSpan.setAttribute('error.component', this.context.component);
      }
      
      if (this.context.operation) {
        activeSpan.setAttribute('error.operation', this.context.operation);
      }
      
      if (this.context.isTransient) {
        activeSpan.setAttribute('error.transient', true);
      }
    }
  }
  
  /**
   * Returns a JSON representation of the error for client responses.
   * Used for consistent error responses across the application.
   * 
   * @returns JSON object with standardized error structure
   */
  toJSON(): { error: ErrorResponse } {
    return {
      error: {
        type: this.type,
        code: this.code,
        message: this.message,
        details: this.details,
        journey: this.context.journey,
        requestId: this.context.requestId,
        timestamp: this.context.timestamp?.toISOString()
      }
    };
  }
  
  /**
   * Returns a detailed JSON representation of the error for logging and debugging.
   * Includes all context information and is not meant for client responses.
   * 
   * @returns Detailed JSON object with all error information
   */
  toDetailedJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      code: this.code,
      details: this.details,
      context: {
        ...this.context,
        timestamp: this.context.timestamp?.toISOString()
      },
      cause: this.cause ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack
      } : undefined
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
   * Determines the appropriate HTTP status code based on the error type.
   * @private
   */
  private getHttpStatusCode(): HttpStatus {
    switch (this.type) {
      case ErrorType.VALIDATION:
        return HttpStatus.BAD_REQUEST;
      case ErrorType.BUSINESS:
        return HttpStatus.UNPROCESSABLE_ENTITY;
      case ErrorType.EXTERNAL:
        return HttpStatus.BAD_GATEWAY;
      case ErrorType.AUTHENTICATION:
        return HttpStatus.UNAUTHORIZED;
      case ErrorType.AUTHORIZATION:
        return HttpStatus.FORBIDDEN;
      case ErrorType.NOT_FOUND:
        return HttpStatus.NOT_FOUND;
      case ErrorType.CONFLICT:
        return HttpStatus.CONFLICT;
      case ErrorType.RATE_LIMIT:
        return HttpStatus.TOO_MANY_REQUESTS;
      case ErrorType.TIMEOUT:
        return HttpStatus.GATEWAY_TIMEOUT;
      case ErrorType.TECHNICAL:
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
  
  /**
   * Creates a new BaseError from an existing error or unknown object.
   * Useful for wrapping unknown errors with proper context.
   * 
   * @param error - The error to wrap
   * @param defaultMessage - Default message to use if error doesn't have one
   * @param defaultType - Default error type to use
   * @param defaultCode - Default error code to use
   * @param context - Additional context to add to the error
   * @returns A new BaseError instance
   */
  static from(
    error: unknown,
    defaultMessage = 'An unexpected error occurred',
    defaultType = ErrorType.TECHNICAL,
    defaultCode = 'UNKNOWN_ERROR',
    context?: Partial<ErrorContext>
  ): BaseError {
    // If it's already a BaseError, just add the new context
    if (error instanceof BaseError) {
      if (context) {
        error.context = { ...error.context, ...context };
      }
      return error;
    }
    
    // If it's a standard Error, extract information from it
    if (error instanceof Error) {
      return new BaseError(
        error.message || defaultMessage,
        defaultType,
        defaultCode,
        context,
        undefined,
        error
      );
    }
    
    // For other types, convert to string if possible
    let errorMessage = defaultMessage;
    try {
      if (error !== null && error !== undefined) {
        const stringified = String(error);
        if (stringified !== '[object Object]') {
          errorMessage = stringified;
        }
      }
    } catch {
      // Ignore conversion errors
    }
    
    return new BaseError(errorMessage, defaultType, defaultCode, context);
  }
  
  /**
   * Creates a transient error that can be retried.
   * 
   * @param message - Error message
   * @param code - Error code
   * @param retryStrategy - Retry strategy configuration
   * @param context - Additional error context
   * @param details - Error details
   * @param cause - Original error that caused this exception
   * @returns A new BaseError instance marked as transient
   */
  static transient(
    message: string,
    code: string,
    retryStrategy: ErrorContext['retryStrategy'],
    context?: Partial<ErrorContext>,
    details?: any,
    cause?: Error
  ): BaseError {
    return new BaseError(
      message,
      ErrorType.TECHNICAL,
      code,
      {
        isTransient: true,
        retryStrategy,
        ...context
      },
      details,
      cause
    );
  }
  
  /**
   * Creates a journey-specific error with appropriate context.
   * 
   * @param message - Error message
   * @param type - Error type
   * @param code - Error code
   * @param journey - Journey type
   * @param context - Additional error context
   * @param details - Error details
   * @param cause - Original error that caused this exception
   * @returns A new BaseError instance with journey context
   */
  static journeyError(
    message: string,
    type: ErrorType,
    code: string,
    journey: JourneyType,
    context?: Partial<ErrorContext>,
    details?: any,
    cause?: Error
  ): BaseError {
    return new BaseError(
      message,
      type,
      code,
      {
        journey,
        ...context
      },
      details,
      cause
    );
  }
  
  /**
   * Creates a validation error with appropriate context.
   * 
   * @param message - Error message
   * @param code - Error code
   * @param details - Validation error details
   * @param context - Additional error context
   * @param cause - Original error that caused this exception
   * @returns A new BaseError instance for validation errors
   */
  static validation(
    message: string,
    code: string,
    details?: any,
    context?: Partial<ErrorContext>,
    cause?: Error
  ): BaseError {
    return new BaseError(
      message,
      ErrorType.VALIDATION,
      code,
      context,
      details,
      cause
    );
  }
  
  /**
   * Creates a business logic error with appropriate context.
   * 
   * @param message - Error message
   * @param code - Error code
   * @param details - Business error details
   * @param context - Additional error context
   * @param cause - Original error that caused this exception
   * @returns A new BaseError instance for business errors
   */
  static business(
    message: string,
    code: string,
    details?: any,
    context?: Partial<ErrorContext>,
    cause?: Error
  ): BaseError {
    return new BaseError(
      message,
      ErrorType.BUSINESS,
      code,
      context,
      details,
      cause
    );
  }
  
  /**
   * Creates an external system error with appropriate context.
   * 
   * @param message - Error message
   * @param code - Error code
   * @param details - External system error details
   * @param context - Additional error context
   * @param cause - Original error that caused this exception
   * @returns A new BaseError instance for external system errors
   */
  static external(
    message: string,
    code: string,
    details?: any,
    context?: Partial<ErrorContext>,
    cause?: Error
  ): BaseError {
    return new BaseError(
      message,
      ErrorType.EXTERNAL,
      code,
      context,
      details,
      cause
    );
  }
  
  /**
   * Creates a not found error with appropriate context.
   * 
   * @param message - Error message
   * @param code - Error code
   * @param details - Not found error details
   * @param context - Additional error context
   * @param cause - Original error that caused this exception
   * @returns A new BaseError instance for not found errors
   */
  static notFound(
    message: string,
    code: string,
    details?: any,
    context?: Partial<ErrorContext>,
    cause?: Error
  ): BaseError {
    return new BaseError(
      message,
      ErrorType.NOT_FOUND,
      code,
      context,
      details,
      cause
    );
  }

/**
 * Interface for error context information.
 * Provides additional metadata about the error to aid in debugging and monitoring.
 */
export interface ErrorContext {
  /**
   * Request ID for tracing the error across services
   */
  requestId?: string;

  /**
   * User ID associated with the error, if applicable
   */
  userId?: string;

  /**
   * Journey context where the error occurred
   */
  journey?: JourneyType;

  /**
   * Operation being performed when the error occurred
   */
  operation?: string;

  /**
   * Component or service where the error occurred
   */
  component?: string;

  /**
   * Additional metadata relevant to the error
   */
  metadata?: Record<string, any>;

  /**
   * Timestamp when the error occurred
   */
  timestamp?: Date;

  /**
   * Trace ID for distributed tracing
   */
  traceId?: string;

  /**
   * Span ID for distributed tracing
   */
  spanId?: string;

  /**
   * Stack trace of the error
   */
  stack?: string;

  /**
   * Flag indicating if this is a transient error that can be retried
   */
  isTransient?: boolean;

  /**
   * Suggested retry strategy for transient errors
   */
  retryStrategy?: {
    /**
     * Maximum number of retry attempts
     */
    maxAttempts: number;
    
    /**
     * Base delay in milliseconds between retry attempts
     */
    baseDelayMs: number;
    
    /**
     * Whether to use exponential backoff for retries
     */
    useExponentialBackoff: boolean;
  };
}
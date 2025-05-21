import { HttpStatus } from '@nestjs/common';

/**
 * Enum representing the different types of event errors that can occur.
 * Used for error classification and appropriate handling strategies.
 */
export enum EventErrorType {
  // Client errors (4xx) - Issues caused by invalid client input or requests
  VALIDATION = 'VALIDATION',           // Invalid event data format or schema
  INVALID_EVENT_TYPE = 'INVALID_EVENT_TYPE', // Unsupported or unknown event type
  UNAUTHORIZED = 'UNAUTHORIZED',       // Unauthorized access to event processing
  NOT_FOUND = 'NOT_FOUND',            // Referenced entity not found
  
  // System errors (5xx) - Internal issues within the event processing system
  PROCESSING = 'PROCESSING',           // Error during event processing logic
  DATABASE = 'DATABASE',               // Database operation failure
  INTERNAL = 'INTERNAL',               // Unexpected internal error
  
  // Transient errors - Temporary issues that may resolve with retry
  TRANSIENT = 'TRANSIENT',             // Generic transient error
  TIMEOUT = 'TIMEOUT',                 // Operation timeout
  RATE_LIMITED = 'RATE_LIMITED',       // Rate limiting applied
  
  // External dependency errors - Issues with external systems
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE', // External service failure
  KAFKA = 'KAFKA',                     // Kafka-specific issues
  INTEGRATION = 'INTEGRATION',         // Other integration failures
}

/**
 * Interface for structured error metadata to provide additional context
 * for debugging and troubleshooting event-related errors.
 */
export interface IEventErrorMetadata {
  // Error identification
  errorCode?: string;          // Unique error code for reference
  errorType: EventErrorType;   // Classification of the error
  source?: string;             // Component that generated the error
  
  // Context information
  eventId?: string;            // ID of the event being processed
  eventType?: string;          // Type of event being processed
  journeyType?: string;        // Journey context (Health, Care, Plan)
  userId?: string;             // User associated with the event
  correlationId?: string;      // Trace/correlation ID for distributed tracing
  
  // Error details
  details?: Record<string, any>; // Additional error-specific details
  stack?: string;               // Stack trace (sanitized for production)
  cause?: Error | unknown;       // Original cause of the error
  timestamp?: Date;              // When the error occurred
  
  // Recovery information
  retryable?: boolean;          // Whether the operation can be retried
  retryCount?: number;          // Number of retry attempts made
  retryAfter?: number;          // Suggested delay before retry (ms)
  suggestedAction?: string;     // Recommended action to resolve
}

/**
 * Abstract base class for all event-related exceptions in the gamification engine.
 * Provides a consistent error structure with standardized properties and methods
 * for uniform error handling, logging, and serialization.
 */
export abstract class BaseEventException extends Error {
  /**
   * The HTTP status code associated with this error type.
   * Used for API responses when the error reaches the controller layer.
   */
  public readonly statusCode: HttpStatus;
  
  /**
   * Timestamp when the error occurred.
   */
  public readonly timestamp: Date;
  
  /**
   * Structured metadata providing context about the error.
   */
  public readonly metadata: IEventErrorMetadata;
  
  /**
   * Creates a new BaseEventException instance.
   * 
   * @param message Human-readable error message
   * @param errorType Classification of the error
   * @param metadata Additional error context and details
   */
  constructor(
    message: string,
    errorType: EventErrorType,
    metadata: Partial<IEventErrorMetadata> = {}
  ) {
    super(message);
    
    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, new.target.prototype);
    
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.statusCode = this.mapErrorTypeToStatusCode(errorType);
    
    // Merge provided metadata with defaults
    this.metadata = {
      errorType,
      timestamp: this.timestamp,
      stack: this.stack,
      retryable: this.isRetryable(errorType),
      ...metadata,
    };
  }
  
  /**
   * Maps error types to appropriate HTTP status codes.
   * Used for consistent HTTP responses across the API surface.
   * 
   * @param errorType The type of error that occurred
   * @returns The corresponding HTTP status code
   */
  private mapErrorTypeToStatusCode(errorType: EventErrorType): HttpStatus {
    switch (errorType) {
      // Client errors (4xx)
      case EventErrorType.VALIDATION:
        return HttpStatus.BAD_REQUEST;
      case EventErrorType.INVALID_EVENT_TYPE:
        return HttpStatus.BAD_REQUEST;
      case EventErrorType.UNAUTHORIZED:
        return HttpStatus.UNAUTHORIZED;
      case EventErrorType.NOT_FOUND:
        return HttpStatus.NOT_FOUND;
      
      // Rate limiting (429)
      case EventErrorType.RATE_LIMITED:
        return HttpStatus.TOO_MANY_REQUESTS;
      
      // Transient errors (503)
      case EventErrorType.TRANSIENT:
      case EventErrorType.TIMEOUT:
        return HttpStatus.SERVICE_UNAVAILABLE;
      
      // External dependency errors (502)
      case EventErrorType.EXTERNAL_SERVICE:
      case EventErrorType.KAFKA:
      case EventErrorType.INTEGRATION:
        return HttpStatus.BAD_GATEWAY;
      
      // System errors (500)
      case EventErrorType.PROCESSING:
      case EventErrorType.DATABASE:
      case EventErrorType.INTERNAL:
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
  
  /**
   * Determines if an error type is considered retryable.
   * Used to implement retry policies for transient failures.
   * 
   * @param errorType The type of error to check
   * @returns True if the error is retryable, false otherwise
   */
  private isRetryable(errorType: EventErrorType): boolean {
    // Transient errors are always retryable
    if (
      errorType === EventErrorType.TRANSIENT ||
      errorType === EventErrorType.TIMEOUT ||
      errorType === EventErrorType.RATE_LIMITED
    ) {
      return true;
    }
    
    // Some external dependency errors may be retryable
    if (
      errorType === EventErrorType.EXTERNAL_SERVICE ||
      errorType === EventErrorType.KAFKA
    ) {
      return true;
    }
    
    // Database errors might be retryable in some cases
    if (errorType === EventErrorType.DATABASE) {
      return true;
    }
    
    // Client errors and other system errors are generally not retryable
    return false;
  }
  
  /**
   * Serializes the exception to a JSON-compatible object for logging.
   * Includes detailed information for troubleshooting.
   * 
   * @returns A structured representation of the error for logging systems
   */
  public toLog(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      ...this.metadata,
      // Ensure stack is included for logging but sanitized if needed
      stack: this.stack,
    };
  }
  
  /**
   * Serializes the exception to a client-safe response object.
   * Filters sensitive information that shouldn't be exposed to clients.
   * 
   * @returns A client-safe representation of the error
   */
  public toResponse(): Record<string, any> {
    // Create a client-safe error response
    const response: Record<string, any> = {
      statusCode: this.statusCode,
      message: this.message,
      error: this.name,
      timestamp: this.timestamp.toISOString(),
    };
    
    // Include error code if available
    if (this.metadata.errorCode) {
      response.code = this.metadata.errorCode;
    }
    
    // Include event ID if available for reference
    if (this.metadata.eventId) {
      response.eventId = this.metadata.eventId;
    }
    
    // Include correlation ID for tracking the request through the system
    if (this.metadata.correlationId) {
      response.correlationId = this.metadata.correlationId;
    }
    
    // Include retry information for retryable errors
    if (this.metadata.retryable) {
      response.retryable = true;
      
      if (this.metadata.retryAfter) {
        response.retryAfter = this.metadata.retryAfter;
      }
    }
    
    // Include suggested action if available
    if (this.metadata.suggestedAction) {
      response.suggestedAction = this.metadata.suggestedAction;
    }
    
    return response;
  }
}
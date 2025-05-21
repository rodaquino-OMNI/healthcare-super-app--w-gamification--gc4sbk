import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorType, ErrorSeverity, SystemErrorCategory } from './error-types.enum';

/**
 * Interface for system error metadata providing additional context
 * for troubleshooting and monitoring of system-level errors.
 */
export interface ISystemErrorMetadata {
  // Error identification and classification
  timestamp: string;           // When the error occurred
  correlationId?: string;      // For tracing across services
  component?: string;          // System component that failed
  source?: string;             // Source file or module
  category?: SystemErrorCategory; // More specific error category
  
  // Monitoring and alerting
  requiresAlert?: boolean;     // Whether this error should trigger alerts
  severity?: ErrorSeverity | string; // Error severity
  
  // Troubleshooting context
  context?: Record<string, any>; // Additional context about what was happening
  originalError?: Error;        // Original error that caused this exception
  
  // Recovery information
  recoverable?: boolean;       // Whether the system can recover automatically
  retryable?: boolean;         // Whether the operation can be retried
  suggestedAction?: string;    // Recommended action for operators
}

/**
 * Base class for all system error exceptions (HTTP 5xx) in the application.
 * Handles internal server errors, implementation bugs, and infrastructure issues,
 * providing detailed context for troubleshooting while presenting appropriate
 * messages to clients.
 * 
 * System exceptions represent errors that are not the fault of the client and
 * typically require technical intervention to resolve.
 */
export class SystemException extends HttpException {
  /**
   * The error code that uniquely identifies this type of error.
   * Used for error tracking, documentation, and client reference.
   */
  private readonly code: string;
  
  /**
   * The error type classification from the ErrorType enum.
   * System errors are typically TECHNICAL or EXTERNAL.
   */
  private readonly type: ErrorType;
  
  /**
   * Metadata providing additional context about the error.
   * Used for troubleshooting, monitoring, and alerting.
   */
  private readonly metadata: ISystemErrorMetadata;
  
  /**
   * Creates a new SystemException instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for tracking and documentation
   * @param type - Error type classification
   * @param metadata - Additional error context and details
   * @param cause - Original error that caused this exception
   */
  constructor(
    message: string,
    code: string,
    type: ErrorType = ErrorType.TECHNICAL,
    metadata: Partial<ISystemErrorMetadata> = {},
    cause?: Error
  ) {
    // Create a response object for the HttpException base class
    const response = {
      statusCode: SystemException.mapTypeToStatusCode(type),
      message: message,
      error: 'System Error',
      code: code,
      timestamp: new Date().toISOString()
    };
    
    // Call the HttpException constructor with the response and status code
    super(response, SystemException.mapTypeToStatusCode(type));
    
    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, SystemException.prototype);
    
    this.name = this.constructor.name;
    this.code = code;
    this.type = type;
    
    // Merge provided metadata with defaults
    this.metadata = {
      timestamp: new Date().toISOString(),
      requiresAlert: true, // System errors typically require alerting
      severity: ErrorSeverity.HIGH, // Default to high severity for system errors
      recoverable: false,  // Default to non-recoverable
      retryable: false,    // Default to non-retryable
      originalError: cause,
      ...metadata
    };
    
    // Preserve the original stack trace if a cause is provided
    if (cause && cause.stack) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
  
  /**
   * Maps error types to appropriate HTTP status codes for system errors.
   * 
   * @param type - The error type classification
   * @returns The corresponding HTTP status code
   */
  private static mapTypeToStatusCode(type: ErrorType): HttpStatus {
    switch (type) {
      case ErrorType.EXTERNAL:
        return HttpStatus.BAD_GATEWAY; // 502 Bad Gateway
      
      case ErrorType.TECHNICAL:
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR; // 500 Internal Server Error
    }
  }
  
  /**
   * Gets the error code associated with this exception.
   * 
   * @returns The error code string
   */
  getCode(): string {
    return this.code;
  }
  
  /**
   * Gets the error type classification for this exception.
   * 
   * @returns The error type enum value
   */
  getType(): ErrorType {
    return this.type;
  }
  
  /**
   * Gets the HTTP status code associated with this exception.
   * 
   * @returns The HTTP status code
   */
  getStatus(): HttpStatus {
    return super.getStatus();
  }
  
  /**
   * Gets the metadata associated with this exception.
   * 
   * @returns The error metadata object
   */
  getMetadata(): ISystemErrorMetadata {
    return this.metadata;
  }
  
  /**
   * Serializes the exception to a JSON-compatible object for logging.
   * Includes detailed information for troubleshooting.
   * 
   * @returns A structured representation of the error for logging systems
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      type: this.type,
      statusCode: this.getStatus(),
      stack: this.stack,
      metadata: this.metadata,
      // Include original error details if available
      cause: this.metadata.originalError ? {
        name: this.metadata.originalError.name,
        message: this.metadata.originalError.message,
        stack: this.metadata.originalError.stack
      } : undefined
    };
  }
  
  /**
   * Serializes the exception to a format suitable for logging systems.
   * Includes detailed information for troubleshooting.
   * 
   * @returns A structured representation of the error for logging systems
   */
  toLog(): Record<string, any> {
    return this.toJSON();
  }
  
  /**
   * Serializes the exception to a client-safe response object.
   * Filters sensitive information that shouldn't be exposed to clients.
   * 
   * @returns A client-safe representation of the error
   */
  toResponse(): Record<string, any> {
    // Create a client-safe error response
    const response: Record<string, any> = {
      statusCode: this.getStatus(),
      message: this.sanitizeMessageForClient(this.message),
      error: this.name,
      code: this.code,
      timestamp: this.metadata.timestamp
    };
    
    // Include correlation ID for tracking the request through the system
    if (this.metadata.correlationId) {
      response.correlationId = this.metadata.correlationId;
    }
    
    // Include suggested action if available and appropriate for clients
    if (this.metadata.suggestedAction) {
      response.suggestedAction = this.metadata.suggestedAction;
    }
    
    return response;
  }
  
  /**
   * Sanitizes error messages to ensure no sensitive information is leaked to clients.
   * 
   * @param message - The original error message
   * @returns A sanitized version of the message
   */
  private sanitizeMessageForClient(message: string): string {
    // For system errors, we often want to provide a generic message to clients
    // rather than exposing internal details that might contain sensitive information
    if (this.metadata.severity === ErrorSeverity.CRITICAL || this.metadata.severity === 'critical') {
      return 'A critical system error occurred. Our team has been notified.';
    }
    
    // Remove potential sensitive information like stack traces, file paths, etc.
    let sanitized = message
      // Remove file paths
      .replace(/(?:\/[\w\.\-]+)+/g, '[PATH]')
      // Remove potential SQL queries
      .replace(/(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER)\s+.+?(?:FROM|INTO|TABLE|DATABASE)/gi, '[SQL QUERY]')
      // Remove potential connection strings
      .replace(/(?:mongodb|postgres|mysql|redis):\/\/[^\s]+/gi, '[CONNECTION STRING]')
      // Remove potential API keys, tokens, etc.
      .replace(/(?:api[_-]?key|token|secret|password|auth)\s*[:=]\s*['"](.*?)['"]/, '$1=[REDACTED]');
    
    // If the message is too detailed or technical, provide a more generic one
    if (sanitized.length > 200 || /exception|error|stack|trace/i.test(sanitized)) {
      return 'An internal system error occurred. Please try again later.';
    }
    
    return sanitized;
  }
  
  /**
   * Adds correlation ID context to the exception.
   * Useful for tracking the error across distributed services.
   * 
   * @param correlationId - The correlation ID to add
   * @returns This exception instance for method chaining
   */
  withCorrelationId(correlationId: string): SystemException {
    this.metadata.correlationId = correlationId;
    return this;
  }
  
  /**
   * Adds additional context information to the exception.
   * Useful for providing more details about what was happening when the error occurred.
   * 
   * @param context - Additional context information
   * @returns This exception instance for method chaining
   */
  withContext(context: Record<string, any>): SystemException {
    this.metadata.context = {
      ...this.metadata.context,
      ...context
    };
    return this;
  }
  
  /**
   * Sets the severity level of the exception.
   * Affects alerting behavior and message sanitization.
   * 
   * @param severity - The severity level
   * @returns This exception instance for method chaining
   */
  withSeverity(severity: ErrorSeverity | string): SystemException {
    this.metadata.severity = severity;
    return this;
  }
  
  /**
   * Marks the exception as requiring immediate alerting.
   * 
   * @param requiresAlert - Whether an alert should be triggered
   * @returns This exception instance for method chaining
   */
  withAlert(requiresAlert: boolean = true): SystemException {
    this.metadata.requiresAlert = requiresAlert;
    return this;
  }
  
  /**
   * Indicates whether the system can recover automatically from this error.
   * 
   * @param recoverable - Whether the error is recoverable
   * @param suggestedAction - Optional action to suggest for recovery
   * @returns This exception instance for method chaining
   */
  withRecoveryInfo(recoverable: boolean, suggestedAction?: string): SystemException {
    this.metadata.recoverable = recoverable;
    if (suggestedAction) {
      this.metadata.suggestedAction = suggestedAction;
    }
    return this;
  }
  
  /**
   * Sets the specific system error category for more detailed classification.
   * 
   * @param category - The system error category
   * @returns This exception instance for method chaining
   */
  withCategory(category: SystemErrorCategory): SystemException {
    this.metadata.category = category;
    return this;
  }
  
  /**
   * Marks the exception as retryable, indicating that the operation can be retried.
   * 
   * @param retryable - Whether the operation can be retried
   * @returns This exception instance for method chaining
   */
  withRetryable(retryable: boolean = true): SystemException {
    this.metadata.retryable = retryable;
    return this;
  }
}
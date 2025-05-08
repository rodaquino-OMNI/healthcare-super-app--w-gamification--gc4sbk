import { HttpStatus } from '@nestjs/common';
import { ErrorType, ErrorMetadata, ErrorContext } from './error-types.enum';
import { AppExceptionBase } from './app-exception.base';

/**
 * Base class for all system error exceptions (HTTP 5xx) in the application.
 * Handles internal server errors, implementation bugs, and infrastructure issues,
 * providing detailed context for troubleshooting while presenting appropriate messages to clients.
 */
export class SystemException extends AppExceptionBase {
  /**
   * Creates a new SystemException instance
   * 
   * @param message Human-readable error message
   * @param errorType Error type classification
   * @param statusCode HTTP status code (defaults to 500 Internal Server Error)
   * @param cause Original error that caused this exception
   * @param metadata Additional error metadata
   * @param context Error context information
   */
  constructor(
    message: string,
    errorType: ErrorType = ErrorType.INTERNAL_ERROR,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    cause?: Error,
    metadata: ErrorMetadata = {},
    context: ErrorContext = {},
  ) {
    super(message, errorType, statusCode, cause, metadata, context);
    
    // Add system error flag for filtering in logs and monitoring
    this.addMetadata('isSystemError', true);
    
    // Capture stack trace for debugging
    if (cause && cause.stack) {
      this.addMetadata('originalStack', cause.stack);
    }
    
    // Add timestamp for error occurrence
    this.addMetadata('timestamp', new Date().toISOString());
  }
  
  /**
   * Creates a SystemException from an unknown error
   * 
   * @param error Original error
   * @param message Optional custom message
   * @returns SystemException instance
   */
  static fromError(error: Error, message?: string): SystemException {
    return new SystemException(
      message || `System error: ${error.message}`,
      ErrorType.INTERNAL_ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR,
      error,
    );
  }
  
  /**
   * Creates a critical SystemException that requires immediate attention
   * 
   * @param message Error message
   * @param cause Original error
   * @returns SystemException instance with critical severity
   */
  static critical(message: string, cause?: Error): SystemException {
    const exception = new SystemException(
      message,
      ErrorType.CRITICAL_ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR,
      cause,
    );
    
    exception.addMetadata('severity', 'CRITICAL');
    exception.addMetadata('requiresImmediate', true);
    
    return exception;
  }
  
  /**
   * Sanitizes the error message for client responses
   * Removes sensitive information and implementation details
   * 
   * @returns Client-safe error message
   */
  getClientMessage(): string {
    // For system errors, we don't want to expose internal details to clients
    return 'An internal server error occurred. Please try again later.';
  }
  
  /**
   * Gets detailed information for logging and monitoring
   * 
   * @returns Detailed error information for internal use
   */
  getDetailedInformation(): Record<string, any> {
    return {
      message: this.message,
      errorType: this.errorType,
      statusCode: this.statusCode,
      metadata: this.metadata,
      context: this.context,
      stack: this.stack,
      cause: this.cause ? {
        message: this.cause.message,
        name: this.cause.name,
        stack: this.cause.stack,
      } : undefined,
    };
  }
  
  /**
   * Determines if this error should trigger an alert
   * 
   * @returns True if this error requires alerting
   */
  shouldAlert(): boolean {
    return this.errorType === ErrorType.CRITICAL_ERROR ||
           this.metadata.severity === 'CRITICAL' ||
           this.metadata.requiresImmediate === true;
  }
}
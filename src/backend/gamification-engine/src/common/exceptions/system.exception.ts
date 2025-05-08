import { HttpStatus } from '@nestjs/common';
import { AppException, ErrorType, ErrorContext } from './app-exception.base';

/**
 * Base class for all system error exceptions (HTTP 5xx) in the application.
 * Handles internal server errors, implementation bugs, and infrastructure issues,
 * providing detailed context for troubleshooting while presenting appropriate
 * messages to clients.
 */
export class SystemException extends AppException {
  /**
   * Creates a new SystemException instance
   * 
   * @param message Human-readable error message
   * @param errorCode Application error code
   * @param errorType Error type classification
   * @param statusCode HTTP status code (defaults to 500 Internal Server Error)
   * @param context Error context information
   * @param isRetryable Whether this error can be retried
   */
  constructor(
    message: string,
    errorCode: string,
    errorType: ErrorType = ErrorType.INTERNAL,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    context: ErrorContext = {},
    isRetryable: boolean = false,
  ) {
    super(message, errorCode, errorType, statusCode, context, isRetryable);
    
    // Capture stack trace if not already captured
    if (!this.stack) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * Gets client-safe details that can be included in responses
   * For system errors, we limit the information to avoid exposing internal details
   * 
   * @returns Safe details for client responses
   */
  getSafeDetailsForResponse(): Record<string, any> | null {
    const safeDetails: Record<string, any> = {};
    
    // Include error reference ID (which is our errorId)
    safeDetails.referenceId = this.errorId;
    
    // Include retry information if applicable
    if (this.isRetryable) {
      safeDetails.canRetry = true;
      if (this.context.retryAfter) {
        safeDetails.retryAfter = this.context.retryAfter;
      }
    }
    
    return safeDetails;
  }
  
  /**
   * Override toResponse to provide a generic message for system errors
   * and include minimal safe details
   */
  toResponse(includeDetails: boolean = false): any {
    const response = super.toResponse(false);
    
    // For system errors, we provide a generic message to avoid exposing internal details
    response.message = this.getGenericClientMessage();
    
    // Include minimal safe details
    response.details = this.getSafeDetailsForResponse();
    
    return response;
  }
  
  /**
   * Gets a generic client-safe message based on the error type
   * For system errors, we avoid exposing internal details
   * 
   * @returns Client-safe error message
   */
  getGenericClientMessage(): string {
    // Default generic messages based on error type
    switch (this.errorType) {
      case ErrorType.DATABASE:
        return 'A database error occurred. Please try again later.';
        
      case ErrorType.TIMEOUT:
        return 'The operation timed out. Please try again later.';
        
      case ErrorType.EXTERNAL:
      case ErrorType.INTEGRATION:
        return 'An error occurred while communicating with an external service. Please try again later.';
        
      case ErrorType.KAFKA:
        return 'An error occurred while processing your request. Please try again later.';
        
      case ErrorType.CONFIGURATION:
        return 'A system configuration error occurred. Our team has been notified and is working to resolve the issue.';
        
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  }
  
  /**
   * Determines if this exception should trigger an alert
   * Used for monitoring and alerting systems
   * 
   * @returns True if this error should trigger an alert
   */
  shouldTriggerAlert(): boolean {
    // Check for specific context that might indicate alert-worthy conditions
    if (this.context.triggerAlert === true) {
      return true;
    }
    
    // Critical system errors should always trigger alerts
    return [
      ErrorType.INTERNAL,
      ErrorType.DATABASE,
      ErrorType.CONFIGURATION,
    ].includes(this.errorType);
  }
  
  /**
   * Creates a system exception from an unknown error
   * Useful for wrapping unexpected errors in a consistent format
   * 
   * @param error Unknown error to wrap
   * @param context Additional context information
   * @returns SystemException instance
   */
  static fromError(error: unknown, context: ErrorContext = {}): SystemException {
    if (error instanceof SystemException) {
      // If it's already a SystemException, just add the context
      return error.withContext(context) as SystemException;
    }
    
    // Determine error message
    let message = 'An unknown error occurred';
    
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error !== null && typeof error === 'object' && 'message' in error) {
      message = String(error.message);
    }
    
    // Create a new SystemException
    return new SystemException(
      message,
      'GAMIFICATION_INTERNAL_ERROR',
      ErrorType.INTERNAL,
      HttpStatus.INTERNAL_SERVER_ERROR,
      {
        ...context,
        originalError: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }
    );
  }
  
  /**
   * Creates a database exception
   * 
   * @param message Error message
   * @param context Additional context information
   * @returns SystemException instance
   */
  static database(message: string, context: ErrorContext = {}): SystemException {
    return new SystemException(
      message,
      'GAMIFICATION_DATABASE_ERROR',
      ErrorType.DATABASE,
      HttpStatus.INTERNAL_SERVER_ERROR,
      context,
      true // Database errors are often transient and retryable
    );
  }
  
  /**
   * Creates a configuration exception
   * 
   * @param message Error message
   * @param context Additional context information
   * @returns SystemException instance
   */
  static configuration(message: string, context: ErrorContext = {}): SystemException {
    return new SystemException(
      message,
      'GAMIFICATION_CONFIGURATION_ERROR',
      ErrorType.CONFIGURATION,
      HttpStatus.INTERNAL_SERVER_ERROR,
      {
        ...context,
        triggerAlert: true, // Configuration errors should always trigger alerts
      },
      false // Configuration errors are not retryable without intervention
    );
  }
}
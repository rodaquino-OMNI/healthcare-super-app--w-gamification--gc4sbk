import { HttpStatus } from '@nestjs/common';
import { ErrorType, ErrorMetadata, ErrorContext, isCriticalError } from './error-types.enum';
import { AppExceptionBase } from './app-exception.base';

/**
 * Base class for all system error exceptions (HTTP 5xx) in the application.
 * Handles internal server errors, implementation bugs, and infrastructure issues,
 * providing detailed context for troubleshooting while presenting appropriate
 * messages to clients.
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
    
    // Add critical flag if this is a critical error
    if (isCriticalError(errorType)) {
      this.addMetadata('isCritical', true);
    }
    
    // Capture stack trace if not already captured
    if (!this.stack) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * Gets client-safe metadata that can be included in responses
   * For system errors, we limit the information to avoid exposing internal details
   * 
   * @returns Safe metadata for client responses
   */
  getSafeMetadataForResponse(): Record<string, any> | null {
    const safeMetadata: Record<string, any> = {};
    
    // Include error reference ID if present
    if (this.metadata.referenceId) {
      safeMetadata.referenceId = this.metadata.referenceId;
    }
    
    // Include retry information if applicable
    if (this.metadata.canRetry) {
      safeMetadata.canRetry = true;
      if (this.metadata.retryAfter) {
        safeMetadata.retryAfter = this.metadata.retryAfter;
      }
    }
    
    return Object.keys(safeMetadata).length > 0 ? safeMetadata : null;
  }
  
  /**
   * Gets the client message
   * For system errors, we provide a generic message to avoid exposing internal details
   * 
   * @returns Client-safe error message
   */
  getClientMessage(): string {
    // For system errors, we may want to provide a more generic message to the client
    // rather than exposing internal details that might contain sensitive information
    if (this.metadata.clientMessage) {
      return this.metadata.clientMessage as string;
    }
    
    // Default generic messages based on error type
    switch (this.errorType) {
      case ErrorType.DATABASE_ERROR:
      case ErrorType.QUERY_ERROR:
      case ErrorType.TRANSACTION_ERROR:
        return 'A database error occurred. Please try again later.';
        
      case ErrorType.CONNECTION_ERROR:
      case ErrorType.NETWORK_ERROR:
        return 'A connection error occurred. Please check your network and try again.';
        
      case ErrorType.TIMEOUT_ERROR:
        return 'The operation timed out. Please try again later.';
        
      case ErrorType.EXTERNAL_SERVICE_ERROR:
      case ErrorType.API_ERROR:
        return 'An error occurred while communicating with an external service. Please try again later.';
        
      case ErrorType.EVENT_PROCESSING_ERROR:
      case ErrorType.EVENT_PUBLISHING_ERROR:
      case ErrorType.EVENT_CONSUMPTION_ERROR:
        return 'An error occurred while processing your request. Please try again later.';
        
      case ErrorType.CRITICAL_ERROR:
      case ErrorType.INITIALIZATION_ERROR:
      case ErrorType.CONFIGURATION_ERROR:
        return 'A critical system error occurred. Our team has been notified and is working to resolve the issue.';
        
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
    // Critical errors should always trigger alerts
    if (isCriticalError(this.errorType)) {
      return true;
    }
    
    // Check for specific metadata that might indicate alert-worthy conditions
    if (this.metadata.triggerAlert === true) {
      return true;
    }
    
    // Other conditions that might warrant alerts
    return [
      ErrorType.DATABASE_ERROR,
      ErrorType.CONNECTION_ERROR,
      ErrorType.TRANSACTION_ERROR,
      ErrorType.SCHEMA_ERROR,
    ].includes(this.errorType);
  }
  
  /**
   * Sanitizes the error message and context to remove sensitive information
   * Used when logging or sending to monitoring systems
   * 
   * @returns Sanitized error data safe for logging
   */
  sanitizeForLogging(): Record<string, any> {
    const sanitized = this.serialize();
    
    // Remove potentially sensitive information
    if (sanitized.context) {
      // Remove sensitive fields from context
      const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'credentials'];
      sensitiveFields.forEach(field => {
        if (field in sanitized.context) {
          sanitized.context[field] = '[REDACTED]';
        }
      });
      
      // Sanitize nested objects
      Object.keys(sanitized.context).forEach(key => {
        if (typeof sanitized.context[key] === 'object' && sanitized.context[key] !== null) {
          sensitiveFields.forEach(field => {
            if (field in sanitized.context[key]) {
              sanitized.context[key][field] = '[REDACTED]';
            }
          });
        }
      });
    }
    
    return sanitized;
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
      Object.entries(context).forEach(([key, value]) => {
        error.addContext(key, value);
      });
      return error;
    }
    
    // Determine error message
    let message = 'An unknown error occurred';
    let cause: Error | undefined;
    
    if (error instanceof Error) {
      message = error.message;
      cause = error;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error !== null && typeof error === 'object' && 'message' in error) {
      message = String(error.message);
    }
    
    // Create a new SystemException
    return new SystemException(
      message,
      ErrorType.INTERNAL_ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR,
      cause,
      {},
      context
    );
  }
}
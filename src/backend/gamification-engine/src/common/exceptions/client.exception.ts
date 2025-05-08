import { HttpStatus } from '@nestjs/common';
import { AppException, ErrorType, ErrorContext } from './app-exception.base';

/**
 * Base class for all client error exceptions (HTTP 4xx) in the application.
 * Provides consistent handling for errors caused by client input, implementing
 * appropriate HTTP status codes and response formats for invalid requests,
 * not found resources, and authorization issues.
 */
export class ClientException extends AppException {
  /**
   * Creates a new ClientException instance
   * 
   * @param message Human-readable error message
   * @param errorCode Application error code
   * @param errorType Error type classification
   * @param statusCode HTTP status code (defaults to 400 Bad Request)
   * @param context Error context information
   * @param isRetryable Whether this error can be retried
   */
  constructor(
    message: string,
    errorCode: string,
    errorType: ErrorType = ErrorType.BAD_REQUEST,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
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
   * For client errors, we can include more details to help the client correct the issue
   * 
   * @returns Safe details for client responses
   */
  getSafeDetailsForResponse(): Record<string, any> | null {
    const safeDetails: Record<string, any> = {};
    
    // Include validation errors if present
    if (this.context.validationErrors) {
      safeDetails.validationErrors = this.context.validationErrors;
    }
    
    // Include field errors if present
    if (this.context.fieldErrors) {
      safeDetails.fieldErrors = this.context.fieldErrors;
    }
    
    // Include resource information for not found errors
    if (this.errorType === ErrorType.NOT_FOUND) {
      if (this.context.resourceType) {
        safeDetails.resourceType = this.context.resourceType;
      }
      if (this.context.resourceId) {
        safeDetails.resourceId = this.context.resourceId;
      }
    }
    
    // Include conflict information
    if (this.errorType === ErrorType.CONFLICT) {
      if (this.context.conflictReason) {
        safeDetails.conflictReason = this.context.conflictReason;
      }
    }
    
    // Include journey context if available
    if (this.context.journey) {
      safeDetails.journey = this.context.journey;
    }
    
    return Object.keys(safeDetails).length > 0 ? safeDetails : null;
  }
  
  /**
   * Override toResponse to include safe details for client errors
   */
  toResponse(includeDetails: boolean = true): any {
    const response = super.toResponse(false);
    
    if (includeDetails) {
      const safeDetails = this.getSafeDetailsForResponse();
      if (safeDetails) {
        response.details = safeDetails;
      }
    }
    
    return response;
  }
  
  /**
   * Adds validation errors to the exception context
   * 
   * @param validationErrors Object containing validation errors
   * @returns This exception instance for chaining
   */
  addValidationErrors(validationErrors: Record<string, string[]>): ClientException {
    return this.withContext({ validationErrors }) as ClientException;
  }
  
  /**
   * Adds field errors to the exception context
   * 
   * @param fieldErrors Object containing field-specific errors
   * @returns This exception instance for chaining
   */
  addFieldErrors(fieldErrors: Record<string, string>): ClientException {
    return this.withContext({ fieldErrors }) as ClientException;
  }
  
  /**
   * Creates a client exception for a not found resource
   * 
   * @param resourceType Type of resource that was not found
   * @param resourceId Identifier of the resource that was not found
   * @param message Custom error message (optional)
   * @param context Additional context information
   * @returns ClientException instance
   */
  static notFound(
    resourceType: string,
    resourceId: string | number,
    message?: string,
    context: ErrorContext = {},
  ): ClientException {
    const errorMessage = message || `${resourceType} with ID ${resourceId} not found`;
    const errorCode = `GAMIFICATION_NOT_FOUND_${resourceType.toUpperCase()}`;
    
    return new ClientException(
      errorMessage,
      errorCode,
      ErrorType.NOT_FOUND,
      HttpStatus.NOT_FOUND,
      {
        ...context,
        resourceType,
        resourceId,
      }
    );
  }
  
  /**
   * Creates a client exception for validation errors
   * 
   * @param validationErrors Object containing validation errors
   * @param message Custom error message (optional)
   * @param context Additional context information
   * @returns ClientException instance
   */
  static validation(
    validationErrors: Record<string, string[]>,
    message?: string,
    context: ErrorContext = {},
  ): ClientException {
    const errorMessage = message || 'Validation failed';
    const errorCode = 'GAMIFICATION_VALIDATION_ERROR';
    
    return new ClientException(
      errorMessage,
      errorCode,
      ErrorType.VALIDATION,
      HttpStatus.BAD_REQUEST,
      {
        ...context,
        validationErrors,
      }
    );
  }
  
  /**
   * Creates a client exception for unauthorized access
   * 
   * @param message Custom error message (optional)
   * @param context Additional context information
   * @returns ClientException instance
   */
  static unauthorized(
    message?: string,
    context: ErrorContext = {},
  ): ClientException {
    const errorMessage = message || 'Unauthorized access';
    const errorCode = 'GAMIFICATION_UNAUTHORIZED';
    
    return new ClientException(
      errorMessage,
      errorCode,
      ErrorType.AUTHENTICATION,
      HttpStatus.UNAUTHORIZED,
      context
    );
  }
  
  /**
   * Creates a client exception for forbidden access
   * 
   * @param message Custom error message (optional)
   * @param context Additional context information
   * @returns ClientException instance
   */
  static forbidden(
    message?: string,
    context: ErrorContext = {},
  ): ClientException {
    const errorMessage = message || 'Forbidden access';
    const errorCode = 'GAMIFICATION_FORBIDDEN';
    
    return new ClientException(
      errorMessage,
      errorCode,
      ErrorType.AUTHORIZATION,
      HttpStatus.FORBIDDEN,
      context
    );
  }
  
  /**
   * Creates a client exception for conflict errors
   * 
   * @param conflictReason Reason for the conflict
   * @param message Custom error message (optional)
   * @param context Additional context information
   * @returns ClientException instance
   */
  static conflict(
    conflictReason: string,
    message?: string,
    context: ErrorContext = {},
  ): ClientException {
    const errorMessage = message || 'Resource conflict';
    const errorCode = 'GAMIFICATION_CONFLICT';
    
    return new ClientException(
      errorMessage,
      errorCode,
      ErrorType.CONFLICT,
      HttpStatus.CONFLICT,
      {
        ...context,
        conflictReason,
      }
    );
  }
  
  /**
   * Creates a client exception from an unknown client error
   * 
   * @param error Unknown error to wrap
   * @param context Additional context information
   * @returns ClientException instance
   */
  static fromError(error: unknown, context: ErrorContext = {}): ClientException {
    if (error instanceof ClientException) {
      // If it's already a ClientException, just add the context
      return error.withContext(context) as ClientException;
    }
    
    // Determine error message
    let message = 'An error occurred with your request';
    
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error !== null && typeof error === 'object' && 'message' in error) {
      message = String(error.message);
    }
    
    // Create a new ClientException
    return new ClientException(
      message,
      'GAMIFICATION_BAD_REQUEST',
      ErrorType.BAD_REQUEST,
      HttpStatus.BAD_REQUEST,
      {
        ...context,
        originalError: error instanceof Error ? error.message : String(error),
      }
    );
  }
}
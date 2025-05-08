import { HttpStatus } from '@nestjs/common';
import { ErrorType, ErrorMetadata, ErrorContext } from './error-types.enum';
import { AppExceptionBase } from './app-exception.base';

/**
 * Base class for all client error exceptions (HTTP 4xx) in the application.
 * Provides consistent handling for errors caused by client input, implementing
 * appropriate HTTP status codes and response formats for invalid requests,
 * not found resources, and authorization issues.
 */
export class ClientException extends AppExceptionBase {
  /**
   * Creates a new ClientException instance
   * 
   * @param message Human-readable error message
   * @param errorType Error type classification
   * @param statusCode HTTP status code (defaults to 400 Bad Request)
   * @param cause Original error that caused this exception
   * @param metadata Additional error metadata
   * @param context Error context information
   */
  constructor(
    message: string,
    errorType: ErrorType = ErrorType.BAD_REQUEST_ERROR,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    cause?: Error,
    metadata: ErrorMetadata = {},
    context: ErrorContext = {},
  ) {
    super(message, errorType, statusCode, cause, metadata, context);
    
    // Add client error flag for filtering in logs and monitoring
    this.addMetadata('isClientError', true);
    
    // Capture stack trace if not already captured
    if (!this.stack) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * Gets client-safe metadata that can be included in responses
   * For client errors, we can include more details to help the client correct the issue
   * 
   * @returns Safe metadata for client responses
   */
  getSafeMetadataForResponse(): Record<string, any> | null {
    const safeMetadata: Record<string, any> = {};
    
    // Include validation errors if present
    if (this.metadata.validationErrors) {
      safeMetadata.validationErrors = this.metadata.validationErrors;
    }
    
    // Include field errors if present
    if (this.metadata.fieldErrors) {
      safeMetadata.fieldErrors = this.metadata.fieldErrors;
    }
    
    // Include resource information for not found errors
    if (this.errorType === ErrorType.NOT_FOUND_ERROR || this.errorType === ErrorType.RESOURCE_NOT_FOUND) {
      if (this.metadata.resourceType) {
        safeMetadata.resourceType = this.metadata.resourceType;
      }
      if (this.metadata.resourceId) {
        safeMetadata.resourceId = this.metadata.resourceId;
      }
    }
    
    // Include conflict information
    if (this.errorType === ErrorType.CONFLICT_ERROR) {
      if (this.metadata.conflictReason) {
        safeMetadata.conflictReason = this.metadata.conflictReason;
      }
    }
    
    // Include journey context if available
    if (this.context.journeyType) {
      safeMetadata.journeyType = this.context.journeyType;
    }
    
    return Object.keys(safeMetadata).length > 0 ? safeMetadata : null;
  }
  
  /**
   * Gets the client message
   * For client errors, we provide detailed messages to help the client correct the issue
   * 
   * @returns Client-safe error message
   */
  getClientMessage(): string {
    // If a specific client message is provided in metadata, use it
    if (this.metadata.clientMessage) {
      return this.metadata.clientMessage as string;
    }
    
    // Otherwise, use the original message as it should be client-safe for client errors
    return this.message;
  }
  
  /**
   * Adds validation errors to the exception metadata
   * 
   * @param validationErrors Object containing validation errors
   * @returns This exception instance for chaining
   */
  addValidationErrors(validationErrors: Record<string, string[]>): ClientException {
    this.addMetadata('validationErrors', validationErrors);
    return this;
  }
  
  /**
   * Adds field errors to the exception metadata
   * 
   * @param fieldErrors Object containing field-specific errors
   * @returns This exception instance for chaining
   */
  addFieldErrors(fieldErrors: Record<string, string>): ClientException {
    this.addMetadata('fieldErrors', fieldErrors);
    return this;
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
    
    return new ClientException(
      errorMessage,
      ErrorType.NOT_FOUND_ERROR,
      HttpStatus.NOT_FOUND,
      undefined,
      {
        resourceType,
        resourceId,
      },
      context
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
    
    return new ClientException(
      errorMessage,
      ErrorType.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
      undefined,
      { validationErrors },
      context
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
    
    return new ClientException(
      errorMessage,
      ErrorType.AUTHENTICATION_ERROR,
      HttpStatus.UNAUTHORIZED,
      undefined,
      {},
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
    
    return new ClientException(
      errorMessage,
      ErrorType.AUTHORIZATION_ERROR,
      HttpStatus.FORBIDDEN,
      undefined,
      {},
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
    
    return new ClientException(
      errorMessage,
      ErrorType.CONFLICT_ERROR,
      HttpStatus.CONFLICT,
      undefined,
      { conflictReason },
      context
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
      Object.entries(context).forEach(([key, value]) => {
        error.addContext(key, value);
      });
      return error;
    }
    
    // Determine error message
    let message = 'An error occurred with your request';
    let cause: Error | undefined;
    
    if (error instanceof Error) {
      message = error.message;
      cause = error;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error !== null && typeof error === 'object' && 'message' in error) {
      message = String(error.message);
    }
    
    // Create a new ClientException
    return new ClientException(
      message,
      ErrorType.BAD_REQUEST_ERROR,
      HttpStatus.BAD_REQUEST,
      cause,
      {},
      context
    );
  }
}
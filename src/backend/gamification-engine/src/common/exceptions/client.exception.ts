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
  }
  
  /**
   * Gets client-safe metadata that can be included in responses
   * For client errors, we can include more details to help the client fix the issue
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
    
    // Include error code if present
    if (this.metadata.errorCode) {
      safeMetadata.errorCode = this.metadata.errorCode;
    }
    
    return Object.keys(safeMetadata).length > 0 ? safeMetadata : null;
  }
  
  /**
   * Gets the client message
   * For client errors, we can return the actual message as it's intended for the client
   * 
   * @returns Client-safe error message
   */
  getClientMessage(): string {
    return this.message;
  }
}
import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorType, ErrorMetadata, ErrorContext } from './error-types.enum';

/**
 * Foundational abstract exception class that all other exceptions in the application will extend.
 * Implements a consistent error structure with standardized properties including error code,
 * message, timestamp, and metadata for logging and serialization across the gamification engine.
 */
export abstract class AppExceptionBase extends HttpException {
  public readonly errorType: ErrorType;
  public readonly metadata: ErrorMetadata;
  public readonly context: ErrorContext;
  public readonly cause?: Error;
  public readonly timestamp: Date;
  
  /**
   * Creates a new AppExceptionBase instance
   * 
   * @param message Human-readable error message
   * @param errorType Error type classification
   * @param statusCode HTTP status code
   * @param cause Original error that caused this exception
   * @param metadata Additional error metadata
   * @param context Error context information
   */
  constructor(
    message: string,
    errorType: ErrorType,
    statusCode: HttpStatus,
    cause?: Error,
    metadata: ErrorMetadata = {},
    context: ErrorContext = {},
  ) {
    // Create response object for HttpException
    const response = {
      statusCode,
      message,
      error: errorType,
      timestamp: new Date().toISOString(),
    };
    
    super(response, statusCode);
    
    this.errorType = errorType;
    this.cause = cause;
    this.metadata = { ...metadata };
    this.context = { ...context };
    this.timestamp = new Date();
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
  
  /**
   * Adds metadata to the exception
   * 
   * @param key Metadata key
   * @param value Metadata value
   */
  addMetadata(key: string, value: any): void {
    this.metadata[key] = value;
  }
  
  /**
   * Adds context information to the exception
   * 
   * @param key Context key
   * @param value Context value
   */
  addContext(key: string, value: any): void {
    this.context[key] = value;
  }
  
  /**
   * Serializes the exception for logging and monitoring
   * 
   * @returns Serialized exception object
   */
  serialize(): Record<string, any> {
    return {
      message: this.message,
      errorType: this.errorType,
      statusCode: this.getStatus(),
      timestamp: this.timestamp.toISOString(),
      metadata: this.metadata,
      context: this.context,
      stack: this.stack,
      cause: this.cause ? {
        message: this.cause.message,
        name: this.cause.name,
      } : undefined,
    };
  }
  
  /**
   * Creates a response object for HTTP responses
   * 
   * @returns Response object suitable for HTTP responses
   */
  toResponse(): Record<string, any> {
    return {
      statusCode: this.getStatus(),
      message: this.getClientMessage(),
      error: this.errorType,
      timestamp: this.timestamp.toISOString(),
      // Include only safe metadata for client responses
      ...(this.getSafeMetadataForResponse() ? { metadata: this.getSafeMetadataForResponse() } : {}),
    };
  }
  
  /**
   * Gets a client-safe error message
   * Override in subclasses to provide specific client messages
   * 
   * @returns Client-safe error message
   */
  getClientMessage(): string {
    return this.message;
  }
  
  /**
   * Gets safe metadata that can be included in client responses
   * Override in subclasses to provide specific safe metadata
   * 
   * @returns Safe metadata for client responses
   */
  getSafeMetadataForResponse(): Record<string, any> | null {
    return null;
  }
  
  /**
   * Determines if this exception represents a transient error that can be retried
   * Override in subclasses to provide specific retry logic
   * 
   * @returns True if this error is transient and can be retried
   */
  isTransientError(): boolean {
    return false;
  }
}
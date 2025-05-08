import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorType, ErrorMetadata, ErrorContext, errorTypeToStatusCode } from './error-types.enum';

/**
 * Abstract base class for HTTP-specific exceptions that maps internal error types
 * to appropriate HTTP status codes. Ensures consistent HTTP response generation
 * across the API surface while maintaining detailed internal error context.
 */
export abstract class HttpExceptionBase extends HttpException {
  public readonly errorType: ErrorType;
  public readonly metadata: ErrorMetadata;
  public readonly context: ErrorContext;
  public readonly timestamp: Date;
  
  /**
   * Creates a new HttpExceptionBase instance
   * 
   * @param message Human-readable error message
   * @param errorType Error type classification
   * @param metadata Additional error metadata
   * @param context Error context information
   */
  constructor(
    message: string,
    errorType: ErrorType,
    metadata: ErrorMetadata = {},
    context: ErrorContext = {},
  ) {
    // Determine HTTP status code from error type
    const statusCode = errorTypeToStatusCode[errorType] || HttpStatus.INTERNAL_SERVER_ERROR;
    
    // Create response object for HttpException
    const response = {
      statusCode,
      message,
      error: errorType,
      timestamp: new Date().toISOString(),
    };
    
    super(response, statusCode);
    
    this.errorType = errorType;
    this.metadata = { ...metadata };
    this.context = { ...context };
    this.timestamp = new Date();
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
   * Gets a client-safe error message
   * Override in subclasses to provide specific client messages
   * 
   * @returns Client-safe error message
   */
  abstract getClientMessage(): string;
  
  /**
   * Gets HTTP headers to include in the response
   * Override in subclasses to provide specific headers
   * 
   * @returns HTTP headers for the response
   */
  getResponseHeaders(): Record<string, string> {
    return {};
  }
}
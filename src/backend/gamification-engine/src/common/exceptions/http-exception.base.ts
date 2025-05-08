import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorType, ErrorMetadata, ErrorContext, errorTypeToStatusCode, HttpStatusCode } from './error-types.enum';
import { AppExceptionBase } from './app-exception.base';

/**
 * Abstract base class for HTTP-specific exceptions that maps internal error types
 * to appropriate HTTP status codes. Ensures consistent HTTP response generation
 * across the API surface while maintaining detailed internal error context.
 */
export abstract class HttpExceptionBase extends AppExceptionBase {
  /**
   * HTTP headers to include in the response
   */
  protected headers: Record<string, string | string[]> = {};

  /**
   * Creates a new HttpExceptionBase instance
   * 
   * @param message Human-readable error message
   * @param errorType Error type classification
   * @param statusCode HTTP status code (defaults to mapping from errorType)
   * @param cause Original error that caused this exception
   * @param metadata Additional error metadata
   * @param context Error context information
   * @param headers HTTP headers to include in the response
   */
  constructor(
    message: string,
    errorType: ErrorType,
    statusCode?: HttpStatus,
    cause?: Error,
    metadata: ErrorMetadata = {},
    context: ErrorContext = {},
    headers: Record<string, string | string[]> = {},
  ) {
    // If statusCode is not provided, map from errorType
    const resolvedStatusCode = statusCode || mapErrorTypeToHttpStatus(errorType);
    
    super(message, errorType, resolvedStatusCode, cause, metadata, context);
    
    // Store headers
    this.headers = { ...headers };
    
    // Add HTTP-specific metadata
    this.addMetadata('httpStatusCode', resolvedStatusCode);
    this.addMetadata('isHttpException', true);
    
    // Capture stack trace if not already captured
    if (!this.stack) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * Adds an HTTP header to the response
   * 
   * @param name Header name
   * @param value Header value
   * @returns This exception instance for chaining
   */
  addHeader(name: string, value: string | string[]): this {
    this.headers[name] = value;
    return this;
  }
  
  /**
   * Gets all HTTP headers
   * 
   * @returns HTTP headers object
   */
  getHeaders(): Record<string, string | string[]> {
    return { ...this.headers };
  }
  
  /**
   * Gets a specific HTTP header
   * 
   * @param name Header name
   * @returns Header value or undefined if not found
   */
  getHeader(name: string): string | string[] | undefined {
    return this.headers[name];
  }
  
  /**
   * Creates a response object for HTTP responses with headers
   * 
   * @returns Response object suitable for HTTP responses
   */
  toHttpResponse(): {
    statusCode: number;
    message: string;
    error: string;
    timestamp: string;
    metadata?: Record<string, any>;
    headers: Record<string, string | string[]>;
  } {
    const baseResponse = this.toResponse();
    
    return {
      ...baseResponse,
      headers: this.getHeaders(),
    };
  }
  
  /**
   * Serializes the exception for logging and monitoring
   * Includes HTTP-specific information
   * 
   * @returns Serialized exception object
   */
  serialize(): Record<string, any> {
    const baseSerialize = super.serialize();
    
    return {
      ...baseSerialize,
      headers: this.getHeaders(),
    };
  }
  
  /**
   * Determines if this is a client error (4xx)
   * 
   * @returns True if this is a client error
   */
  isClientError(): boolean {
    const statusCode = this.getStatus();
    return statusCode >= 400 && statusCode < 500;
  }
  
  /**
   * Determines if this is a server error (5xx)
   * 
   * @returns True if this is a server error
   */
  isServerError(): boolean {
    const statusCode = this.getStatus();
    return statusCode >= 500 && statusCode < 600;
  }
  
  /**
   * Determines if this exception should be reported to error tracking systems
   * Client errors are typically not reported, while server errors are
   * 
   * @returns True if this exception should be reported
   */
  shouldReport(): boolean {
    // Server errors should always be reported
    if (this.isServerError()) {
      return true;
    }
    
    // Some client errors might need reporting based on metadata
    if (this.metadata.shouldReport === true) {
      return true;
    }
    
    // By default, don't report client errors
    return false;
  }
}

/**
 * Maps an error type to an HTTP status code
 * 
 * @param errorType Error type to map
 * @returns Appropriate HTTP status code
 */
function mapErrorTypeToHttpStatus(errorType: ErrorType): HttpStatus {
  // Use the mapping from error-types.enum.ts
  const mappedStatus = errorTypeToStatusCode[errorType];
  
  // If mapping exists, return it
  if (mappedStatus) {
    return mappedStatus;
  }
  
  // Default to internal server error for unknown error types
  return HttpStatus.INTERNAL_SERVER_ERROR;
}
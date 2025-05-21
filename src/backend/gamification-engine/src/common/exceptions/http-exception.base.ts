/**
 * @file HTTP Exception Base Class
 * @description Abstract base class for HTTP-specific exceptions that maps internal error types to appropriate HTTP status codes.
 * Ensures consistent HTTP response generation across the API surface while maintaining detailed internal error context.
 */

import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, ErrorType, IErrorMetadata } from './error-types.enum';

/**
 * Interface for HTTP-specific error metadata that extends the base error metadata
 * with HTTP-specific context information.
 */
export interface IHttpErrorMetadata extends IErrorMetadata {
  // HTTP-specific information
  statusCode: HttpStatus;      // HTTP status code
  headers?: Record<string, string>; // HTTP headers to include in response
  path?: string;              // Request path that caused the error
  method?: string;            // HTTP method used (GET, POST, etc.)
  
  // Response formatting
  responseBody?: Record<string, any>; // Custom response body
  includeStack?: boolean;     // Whether to include stack trace in response
}

/**
 * Abstract base class for HTTP-specific exceptions that maps internal error types
 * to appropriate HTTP status codes. Ensures consistent HTTP response generation
 * across the API surface while maintaining detailed internal error context.
 */
export abstract class HttpExceptionBase extends HttpException {
  /**
   * The error code identifying this specific error type.
   */
  protected readonly errorCode: ErrorCode;
  
  /**
   * The error type classification.
   */
  protected readonly errorType: ErrorType;
  
  /**
   * Structured metadata providing context about the error.
   */
  protected readonly metadata: IHttpErrorMetadata;
  
  /**
   * Creates a new HttpExceptionBase instance.
   * 
   * @param message Human-readable error message
   * @param statusCode HTTP status code
   * @param errorCode Error code identifying this error type
   * @param errorType Error type classification
   * @param metadata Additional error context and details
   */
  constructor(
    message: string,
    statusCode: HttpStatus,
    errorCode: ErrorCode,
    errorType: ErrorType,
    metadata: Partial<IHttpErrorMetadata> = {}
  ) {
    // Create a response object for the HttpException base class
    const response = {
      statusCode,
      message,
      error: HttpExceptionBase.getErrorName(statusCode),
      code: errorCode.toString(),
      timestamp: new Date().toISOString()
    };
    
    // Call the HttpException constructor with the response and status code
    super(response, statusCode);
    
    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, new.target.prototype);
    
    this.name = this.constructor.name;
    this.errorCode = errorCode;
    this.errorType = errorType;
    
    // Merge provided metadata with defaults
    this.metadata = {
      timestamp: new Date().toISOString(),
      statusCode,
      ...metadata
    };
  }
  
  /**
   * Gets a standardized error name for an HTTP status code.
   * 
   * @param statusCode The HTTP status code
   * @returns A standardized error name
   */
  protected static getErrorName(statusCode: HttpStatus): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad Request';
      case HttpStatus.UNAUTHORIZED:
        return 'Unauthorized';
      case HttpStatus.PAYMENT_REQUIRED:
        return 'Payment Required';
      case HttpStatus.FORBIDDEN:
        return 'Forbidden';
      case HttpStatus.NOT_FOUND:
        return 'Not Found';
      case HttpStatus.METHOD_NOT_ALLOWED:
        return 'Method Not Allowed';
      case HttpStatus.NOT_ACCEPTABLE:
        return 'Not Acceptable';
      case HttpStatus.PROXY_AUTHENTICATION_REQUIRED:
        return 'Proxy Authentication Required';
      case HttpStatus.REQUEST_TIMEOUT:
        return 'Request Timeout';
      case HttpStatus.CONFLICT:
        return 'Conflict';
      case HttpStatus.GONE:
        return 'Gone';
      case HttpStatus.LENGTH_REQUIRED:
        return 'Length Required';
      case HttpStatus.PRECONDITION_FAILED:
        return 'Precondition Failed';
      case HttpStatus.PAYLOAD_TOO_LARGE:
        return 'Payload Too Large';
      case HttpStatus.URI_TOO_LONG:
        return 'URI Too Long';
      case HttpStatus.UNSUPPORTED_MEDIA_TYPE:
        return 'Unsupported Media Type';
      case HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE:
        return 'Range Not Satisfiable';
      case HttpStatus.EXPECTATION_FAILED:
        return 'Expectation Failed';
      case HttpStatus.I_AM_A_TEAPOT:
        return 'I Am a Teapot';
      case HttpStatus.MISDIRECTED_REQUEST:
        return 'Misdirected Request';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'Unprocessable Entity';
      case HttpStatus.LOCKED:
        return 'Locked';
      case HttpStatus.FAILED_DEPENDENCY:
        return 'Failed Dependency';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'Too Many Requests';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'Internal Server Error';
      case HttpStatus.NOT_IMPLEMENTED:
        return 'Not Implemented';
      case HttpStatus.BAD_GATEWAY:
        return 'Bad Gateway';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'Service Unavailable';
      case HttpStatus.GATEWAY_TIMEOUT:
        return 'Gateway Timeout';
      case HttpStatus.HTTP_VERSION_NOT_SUPPORTED:
        return 'HTTP Version Not Supported';
      default:
        return 'Unknown Error';
    }
  }
  
  /**
   * Gets the error code associated with this exception.
   * 
   * @returns The error code
   */
  getErrorCode(): ErrorCode {
    return this.errorCode;
  }
  
  /**
   * Gets the error type classification for this exception.
   * 
   * @returns The error type
   */
  getErrorType(): ErrorType {
    return this.errorType;
  }
  
  /**
   * Gets the metadata associated with this exception.
   * 
   * @returns The error metadata
   */
  getMetadata(): IHttpErrorMetadata {
    return this.metadata;
  }
  
  /**
   * Gets HTTP headers that should be included in the response.
   * 
   * @returns HTTP headers as a record of key-value pairs
   */
  getHeaders(): Record<string, string> {
    return this.metadata.headers || {};
  }
  
  /**
   * Adds HTTP headers to be included in the response.
   * 
   * @param headers HTTP headers as a record of key-value pairs
   * @returns This exception instance for method chaining
   */
  withHeaders(headers: Record<string, string>): this {
    this.metadata.headers = {
      ...this.metadata.headers,
      ...headers
    };
    return this;
  }
  
  /**
   * Adds a single HTTP header to be included in the response.
   * 
   * @param name Header name
   * @param value Header value
   * @returns This exception instance for method chaining
   */
  withHeader(name: string, value: string): this {
    if (!this.metadata.headers) {
      this.metadata.headers = {};
    }
    this.metadata.headers[name] = value;
    return this;
  }
  
  /**
   * Adds request path information to the exception metadata.
   * 
   * @param path Request path
   * @param method HTTP method
   * @returns This exception instance for method chaining
   */
  withRequest(path: string, method: string): this {
    this.metadata.path = path;
    this.metadata.method = method;
    return this;
  }
  
  /**
   * Adds correlation ID context to the exception.
   * Useful for tracking the error across distributed services.
   * 
   * @param correlationId The correlation ID to add
   * @returns This exception instance for method chaining
   */
  withCorrelationId(correlationId: string): this {
    this.metadata.correlationId = correlationId;
    return this;
  }
  
  /**
   * Adds additional context information to the exception.
   * Useful for providing more details about what was happening when the error occurred.
   * 
   * @param context Additional context information
   * @returns This exception instance for method chaining
   */
  withContext(context: Record<string, any>): this {
    this.metadata.context = {
      ...this.metadata.context,
      ...context
    };
    return this;
  }
  
  /**
   * Serializes the exception to a JSON-compatible object for logging.
   * Includes detailed information for troubleshooting.
   * 
   * @returns A structured representation of the error for logging systems
   */
  toLog(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.metadata.statusCode,
      errorCode: this.errorCode.toString(),
      errorType: this.errorType,
      timestamp: this.metadata.timestamp,
      path: this.metadata.path,
      method: this.metadata.method,
      correlationId: this.metadata.correlationId,
      context: this.metadata.context,
      stack: this.stack,
      headers: this.metadata.headers
    };
  }
  
  /**
   * Serializes the exception to a client-safe response object.
   * Filters sensitive information that shouldn't be exposed to clients.
   * 
   * @returns A client-safe representation of the error
   */
  toResponse(): Record<string, any> {
    // If a custom response body is provided, use it
    if (this.metadata.responseBody) {
      return this.metadata.responseBody;
    }
    
    // Create a client-safe error response
    const response: Record<string, any> = {
      statusCode: this.metadata.statusCode,
      message: this.message,
      error: HttpExceptionBase.getErrorName(this.metadata.statusCode),
      code: this.errorCode.toString(),
      timestamp: this.metadata.timestamp
    };
    
    // Include correlation ID for tracking the request through the system
    if (this.metadata.correlationId) {
      response.correlationId = this.metadata.correlationId;
    }
    
    // Include request path if available
    if (this.metadata.path) {
      response.path = this.metadata.path;
    }
    
    // Include stack trace if explicitly enabled and not in production
    if (this.metadata.includeStack && process.env.NODE_ENV !== 'production') {
      response.stack = this.stack;
    }
    
    // Include suggested action if available
    if (this.metadata.suggestedAction) {
      response.suggestedAction = this.metadata.suggestedAction;
    }
    
    return response;
  }
  
  /**
   * Sets a custom response body to be returned to the client.
   * Overrides the default response format.
   * 
   * @param body Custom response body
   * @returns This exception instance for method chaining
   */
  withResponseBody(body: Record<string, any>): this {
    this.metadata.responseBody = body;
    return this;
  }
  
  /**
   * Enables or disables including the stack trace in the response.
   * Stack traces are never included in production environments.
   * 
   * @param include Whether to include the stack trace
   * @returns This exception instance for method chaining
   */
  withStackTrace(include: boolean = true): this {
    this.metadata.includeStack = include;
    return this;
  }
}
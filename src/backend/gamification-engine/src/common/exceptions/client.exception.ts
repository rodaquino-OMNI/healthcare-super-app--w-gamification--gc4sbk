import { HttpStatus } from '@nestjs/common';
import { ErrorCode, ErrorType, IErrorMetadata } from './error-types.enum';

/**
 * Interface for client error metadata that extends the base error metadata
 * with client-specific context information.
 */
export interface IClientErrorMetadata extends IErrorMetadata {
  // Client request information
  requestPath?: string;       // The API path that was requested
  requestMethod?: string;    // The HTTP method used (GET, POST, etc.)
  requestParams?: Record<string, any>; // Query parameters or path parameters
  requestBody?: Record<string, any>;   // Request body (sanitized for sensitive data)
  
  // Validation context
  validationErrors?: Record<string, string[]>; // Field-specific validation errors
  invalidFields?: string[];  // List of fields that failed validation
  
  // Resource context
  resourceType?: string;     // Type of resource being accessed
  resourceId?: string;       // ID of resource being accessed
  
  // Authentication/Authorization context
  requiredPermissions?: string[]; // Permissions required for the operation
  requiredRoles?: string[];      // Roles required for the operation
}

/**
 * Enum representing different types of client errors.
 * Used for more specific classification of 4xx errors.
 */
export enum ClientErrorType {
  // 400 Bad Request errors
  VALIDATION = 'validation',           // Input validation failures
  MALFORMED_REQUEST = 'malformed_request', // Malformed request syntax
  INVALID_PARAMETERS = 'invalid_parameters', // Invalid request parameters
  
  // 401 Unauthorized errors
  UNAUTHORIZED = 'unauthorized',       // Authentication required
  INVALID_CREDENTIALS = 'invalid_credentials', // Invalid credentials
  EXPIRED_TOKEN = 'expired_token',     // Expired authentication token
  
  // 403 Forbidden errors
  FORBIDDEN = 'forbidden',             // Insufficient permissions
  INSUFFICIENT_SCOPE = 'insufficient_scope', // Insufficient OAuth scope
  
  // 404 Not Found errors
  NOT_FOUND = 'not_found',             // Resource not found
  
  // 409 Conflict errors
  CONFLICT = 'conflict',               // Resource conflict
  DUPLICATE = 'duplicate',             // Duplicate resource
  
  // 422 Unprocessable Entity errors
  UNPROCESSABLE_ENTITY = 'unprocessable_entity', // Semantic errors
  BUSINESS_RULE_VIOLATION = 'business_rule_violation', // Business rule violations
  
  // 429 Too Many Requests errors
  RATE_LIMITED = 'rate_limited',       // Rate limit exceeded
}

/**
 * Maps client error types to appropriate HTTP status codes.
 * 
 * @param errorType The client error type
 * @returns The corresponding HTTP status code
 */
function mapClientErrorTypeToStatusCode(errorType: ClientErrorType): HttpStatus {
  switch (errorType) {
    // 400 Bad Request errors
    case ClientErrorType.VALIDATION:
    case ClientErrorType.MALFORMED_REQUEST:
    case ClientErrorType.INVALID_PARAMETERS:
      return HttpStatus.BAD_REQUEST;
    
    // 401 Unauthorized errors
    case ClientErrorType.UNAUTHORIZED:
    case ClientErrorType.INVALID_CREDENTIALS:
    case ClientErrorType.EXPIRED_TOKEN:
      return HttpStatus.UNAUTHORIZED;
    
    // 403 Forbidden errors
    case ClientErrorType.FORBIDDEN:
    case ClientErrorType.INSUFFICIENT_SCOPE:
      return HttpStatus.FORBIDDEN;
    
    // 404 Not Found errors
    case ClientErrorType.NOT_FOUND:
      return HttpStatus.NOT_FOUND;
    
    // 409 Conflict errors
    case ClientErrorType.CONFLICT:
    case ClientErrorType.DUPLICATE:
      return HttpStatus.CONFLICT;
    
    // 422 Unprocessable Entity errors
    case ClientErrorType.UNPROCESSABLE_ENTITY:
    case ClientErrorType.BUSINESS_RULE_VIOLATION:
      return HttpStatus.UNPROCESSABLE_ENTITY;
    
    // 429 Too Many Requests errors
    case ClientErrorType.RATE_LIMITED:
      return HttpStatus.TOO_MANY_REQUESTS;
    
    // Default to 400 Bad Request for unknown client error types
    default:
      return HttpStatus.BAD_REQUEST;
  }
}

/**
 * Base class for all client error exceptions (HTTP 4xx) in the application.
 * Provides consistent handling for errors caused by client input, implementing
 * appropriate HTTP status codes and response formats for invalid requests,
 * not found resources, and authorization issues.
 */
export class ClientException extends Error {
  /**
   * The HTTP status code associated with this error type.
   * Used for API responses when the error reaches the controller layer.
   */
  public readonly statusCode: HttpStatus;
  
  /**
   * Timestamp when the error occurred.
   */
  public readonly timestamp: Date;
  
  /**
   * The error code identifying this specific error type.
   */
  public readonly errorCode: ErrorCode;
  
  /**
   * The client error type for more specific classification.
   */
  public readonly clientErrorType: ClientErrorType;
  
  /**
   * Structured metadata providing context about the error.
   */
  public readonly metadata: IClientErrorMetadata;
  
  /**
   * Creates a new ClientException instance.
   * 
   * @param message Human-readable error message
   * @param clientErrorType Specific type of client error
   * @param errorCode Error code identifying this error type
   * @param metadata Additional error context and details
   */
  constructor(
    message: string,
    clientErrorType: ClientErrorType,
    errorCode: ErrorCode,
    metadata: Partial<IClientErrorMetadata> = {}
  ) {
    super(message);
    
    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, new.target.prototype);
    
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.statusCode = mapClientErrorTypeToStatusCode(clientErrorType);
    this.errorCode = errorCode;
    this.clientErrorType = clientErrorType;
    
    // Merge provided metadata with defaults
    this.metadata = {
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
      retryable: false, // Client errors are generally not retryable
      recoverable: true, // Client can typically recover by fixing their request
      severity: 'low', // Client errors are typically low severity for the system
      ...metadata,
    };
  }
  
  /**
   * Creates a validation error instance for invalid input data.
   * 
   * @param message Human-readable error message
   * @param validationErrors Field-specific validation errors
   * @param errorCode Error code identifying this error type
   * @param metadata Additional error context and details
   * @returns A new ClientException instance for validation errors
   */
  static validation(
    message: string,
    validationErrors: Record<string, string[]>,
    errorCode: ErrorCode = ErrorCode.gamification('400'),
    metadata: Partial<IClientErrorMetadata> = {}
  ): ClientException {
    return new ClientException(
      message,
      ClientErrorType.VALIDATION,
      errorCode,
      {
        validationErrors,
        invalidFields: Object.keys(validationErrors),
        ...metadata,
      }
    );
  }
  
  /**
   * Creates a not found error instance for missing resources.
   * 
   * @param resourceType Type of resource that was not found
   * @param resourceId ID of resource that was not found
   * @param errorCode Error code identifying this error type
   * @param metadata Additional error context and details
   * @returns A new ClientException instance for not found errors
   */
  static notFound(
    resourceType: string,
    resourceId: string,
    errorCode: ErrorCode = ErrorCode.gamification('404'),
    metadata: Partial<IClientErrorMetadata> = {}
  ): ClientException {
    const message = `${resourceType} with ID ${resourceId} not found`;
    
    return new ClientException(
      message,
      ClientErrorType.NOT_FOUND,
      errorCode,
      {
        resourceType,
        resourceId,
        ...metadata,
      }
    );
  }
  
  /**
   * Creates an unauthorized error instance for authentication failures.
   * 
   * @param message Human-readable error message
   * @param errorCode Error code identifying this error type
   * @param metadata Additional error context and details
   * @returns A new ClientException instance for unauthorized errors
   */
  static unauthorized(
    message: string = 'Authentication required',
    errorCode: ErrorCode = ErrorCode.gamification('401'),
    metadata: Partial<IClientErrorMetadata> = {}
  ): ClientException {
    return new ClientException(
      message,
      ClientErrorType.UNAUTHORIZED,
      errorCode,
      metadata
    );
  }
  
  /**
   * Creates a forbidden error instance for authorization failures.
   * 
   * @param message Human-readable error message
   * @param requiredPermissions Permissions required for the operation
   * @param errorCode Error code identifying this error type
   * @param metadata Additional error context and details
   * @returns A new ClientException instance for forbidden errors
   */
  static forbidden(
    message: string = 'Insufficient permissions',
    requiredPermissions: string[] = [],
    errorCode: ErrorCode = ErrorCode.gamification('403'),
    metadata: Partial<IClientErrorMetadata> = {}
  ): ClientException {
    return new ClientException(
      message,
      ClientErrorType.FORBIDDEN,
      errorCode,
      {
        requiredPermissions,
        ...metadata,
      }
    );
  }
  
  /**
   * Creates a conflict error instance for resource conflicts.
   * 
   * @param resourceType Type of resource with conflict
   * @param details Details about the conflict
   * @param errorCode Error code identifying this error type
   * @param metadata Additional error context and details
   * @returns A new ClientException instance for conflict errors
   */
  static conflict(
    resourceType: string,
    details: Record<string, any>,
    errorCode: ErrorCode = ErrorCode.gamification('409'),
    metadata: Partial<IClientErrorMetadata> = {}
  ): ClientException {
    const message = `Conflict with existing ${resourceType}`;
    
    return new ClientException(
      message,
      ClientErrorType.CONFLICT,
      errorCode,
      {
        resourceType,
        details,
        ...metadata,
      }
    );
  }
  
  /**
   * Creates a rate limited error instance when request limits are exceeded.
   * 
   * @param message Human-readable error message
   * @param retryAfter Seconds until the client can retry
   * @param errorCode Error code identifying this error type
   * @param metadata Additional error context and details
   * @returns A new ClientException instance for rate limited errors
   */
  static rateLimited(
    message: string = 'Rate limit exceeded',
    retryAfter: number,
    errorCode: ErrorCode = ErrorCode.gamification('429'),
    metadata: Partial<IClientErrorMetadata> = {}
  ): ClientException {
    return new ClientException(
      message,
      ClientErrorType.RATE_LIMITED,
      errorCode,
      {
        retryable: true,
        retryAfter,
        ...metadata,
      }
    );
  }
  
  /**
   * Creates a business rule violation error instance.
   * 
   * @param message Human-readable error message
   * @param rule Name of the business rule that was violated
   * @param details Details about the violation
   * @param errorCode Error code identifying this error type
   * @param metadata Additional error context and details
   * @returns A new ClientException instance for business rule violations
   */
  static businessRuleViolation(
    message: string,
    rule: string,
    details: Record<string, any>,
    errorCode: ErrorCode = ErrorCode.gamification('422'),
    metadata: Partial<IClientErrorMetadata> = {}
  ): ClientException {
    return new ClientException(
      message,
      ClientErrorType.BUSINESS_RULE_VIOLATION,
      errorCode,
      {
        context: { rule, ...details },
        ...metadata,
      }
    );
  }
  
  /**
   * Serializes the exception to a JSON-compatible object for logging.
   * Includes detailed information for troubleshooting.
   * 
   * @returns A structured representation of the error for logging systems
   */
  public toLog(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode.toString(),
      errorType: ErrorType.VALIDATION, // Client errors are validation errors in the broader classification
      clientErrorType: this.clientErrorType,
      timestamp: this.timestamp.toISOString(),
      ...this.metadata,
      // Ensure stack is included for logging but sanitized if needed
      stack: this.stack,
    };
  }
  
  /**
   * Serializes the exception to a client-safe response object.
   * Filters sensitive information that shouldn't be exposed to clients.
   * 
   * @returns A client-safe representation of the error
   */
  public toResponse(): Record<string, any> {
    // Create a client-safe error response
    const response: Record<string, any> = {
      statusCode: this.statusCode,
      message: this.message,
      error: this.name,
      code: this.errorCode.toString(),
      timestamp: this.timestamp.toISOString(),
    };
    
    // Include correlation ID for tracking the request through the system
    if (this.metadata.correlationId) {
      response.correlationId = this.metadata.correlationId;
    }
    
    // Include request ID if available
    if (this.metadata.requestId) {
      response.requestId = this.metadata.requestId;
    }
    
    // Include validation errors if available
    if (this.metadata.validationErrors) {
      response.validationErrors = this.metadata.validationErrors;
    }
    
    // Include resource information for not found errors
    if (this.clientErrorType === ClientErrorType.NOT_FOUND) {
      response.resourceType = this.metadata.resourceType;
      response.resourceId = this.metadata.resourceId;
    }
    
    // Include retry information for rate limited errors
    if (this.clientErrorType === ClientErrorType.RATE_LIMITED && this.metadata.retryAfter) {
      response.retryAfter = this.metadata.retryAfter;
    }
    
    // Include suggested action if available
    if (this.metadata.suggestedAction) {
      response.suggestedAction = this.metadata.suggestedAction;
    }
    
    return response;
  }
}
import { AppException, ErrorType } from '../../../../../shared/src/exceptions/exceptions.types';

/**
 * Interface defining the context for FHIR-related errors
 * Captures essential information about FHIR operations and resources
 */
export interface FhirErrorContext {
  /** The FHIR resource type involved (e.g., 'Patient', 'Observation') */
  resourceType?: string;
  
  /** The operation being performed (e.g., 'read', 'search', 'create') */
  operation?: string;
  
  /** The FHIR endpoint being accessed */
  endpoint?: string;
  
  /** The resource ID if applicable */
  resourceId?: string;
  
  /** Additional context-specific information */
  additionalInfo?: Record<string, any>;
}

/**
 * Base class for all FHIR-related errors in the Health journey
 * Extends AppException with FHIR-specific context
 */
export abstract class FhirError extends AppException {
  /**
   * Creates a new FHIR error instance
   * 
   * @param message - Human-readable error message
   * @param type - Type of error from ErrorType enum
   * @param code - Error code with HEALTH_FHIR_ prefix
   * @param context - FHIR-specific error context
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    type: ErrorType,
    code: string,
    public readonly context: FhirErrorContext,
    cause?: Error
  ) {
    super(message, type, code, undefined, cause);
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, FhirError.prototype);
  }

  /**
   * Returns a JSON representation of the FHIR error
   * Extends the base toJSON method with FHIR-specific context
   * 
   * @returns JSON object with standardized error structure including FHIR context
   */
  override toJSON(): Record<string, any> {
    const baseJson = super.toJSON();
    
    // Add FHIR context to the details
    baseJson.error.details = {
      fhir: {
        resourceType: this.context.resourceType,
        operation: this.context.operation,
        endpoint: this.context.endpoint,
        resourceId: this.context.resourceId
      },
      ...(this.context.additionalInfo ? { additionalInfo: this.context.additionalInfo } : {})
    };
    
    return baseJson;
  }
}

/**
 * Error thrown when a connection to a FHIR server fails
 * Covers network issues, authentication failures, and server unavailability
 */
export class FhirConnectionFailureError extends FhirError {
  /**
   * Creates a new FHIR connection failure error
   * 
   * @param message - Human-readable error message
   * @param context - FHIR-specific error context
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    context: FhirErrorContext,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.EXTERNAL,
      'HEALTH_FHIR_CONNECTION_FAILURE',
      context,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, FhirConnectionFailureError.prototype);
  }
}

/**
 * Error thrown when authentication with a FHIR server fails
 * Covers invalid credentials, expired tokens, and insufficient permissions
 */
export class FhirAuthenticationError extends FhirError {
  /**
   * Creates a new FHIR authentication error
   * 
   * @param message - Human-readable error message
   * @param context - FHIR-specific error context
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    context: FhirErrorContext,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.EXTERNAL,
      'HEALTH_FHIR_AUTHENTICATION_FAILURE',
      context,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, FhirAuthenticationError.prototype);
  }
}

/**
 * Error thrown when a FHIR resource fails validation
 * Covers malformed resources, missing required fields, and schema violations
 */
export class InvalidResourceError extends FhirError {
  /**
   * Creates a new invalid FHIR resource error
   * 
   * @param message - Human-readable error message
   * @param context - FHIR-specific error context
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    context: FhirErrorContext,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.VALIDATION,
      'HEALTH_FHIR_INVALID_RESOURCE',
      context,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, InvalidResourceError.prototype);
  }
}

/**
 * Error thrown when a FHIR resource type is not supported by the application
 * Covers unsupported resource types and operations
 */
export class UnsupportedResourceTypeError extends FhirError {
  /**
   * Creates a new unsupported FHIR resource type error
   * 
   * @param message - Human-readable error message
   * @param context - FHIR-specific error context
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    context: FhirErrorContext,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.VALIDATION,
      'HEALTH_FHIR_UNSUPPORTED_RESOURCE_TYPE',
      context,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, UnsupportedResourceTypeError.prototype);
  }
}

/**
 * Error thrown when parsing a FHIR resource fails
 * Covers JSON parsing errors, unexpected data formats, and mapping failures
 */
export class ResourceParsingError extends FhirError {
  /**
   * Creates a new FHIR resource parsing error
   * 
   * @param message - Human-readable error message
   * @param context - FHIR-specific error context
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    context: FhirErrorContext,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      'HEALTH_FHIR_PARSING_FAILURE',
      context,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ResourceParsingError.prototype);
  }
}

/**
 * Error thrown when a FHIR operation times out
 * Covers slow server responses and network latency issues
 */
export class FhirOperationTimeoutError extends FhirError {
  /**
   * Creates a new FHIR operation timeout error
   * 
   * @param message - Human-readable error message
   * @param context - FHIR-specific error context
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    context: FhirErrorContext,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.EXTERNAL,
      'HEALTH_FHIR_OPERATION_TIMEOUT',
      context,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, FhirOperationTimeoutError.prototype);
  }
}

/**
 * Error thrown when a FHIR resource is not found
 * Covers missing resources and invalid resource IDs
 */
export class ResourceNotFoundError extends FhirError {
  /**
   * Creates a new FHIR resource not found error
   * 
   * @param message - Human-readable error message
   * @param context - FHIR-specific error context
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    context: FhirErrorContext,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      'HEALTH_FHIR_RESOURCE_NOT_FOUND',
      context,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ResourceNotFoundError.prototype);
  }
}

/**
 * Error thrown when a FHIR operation is not permitted due to business rules
 * Covers permission issues, conflicting operations, and business constraints
 */
export class FhirOperationNotPermittedError extends FhirError {
  /**
   * Creates a new FHIR operation not permitted error
   * 
   * @param message - Human-readable error message
   * @param context - FHIR-specific error context
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    context: FhirErrorContext,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.BUSINESS,
      'HEALTH_FHIR_OPERATION_NOT_PERMITTED',
      context,
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, FhirOperationNotPermittedError.prototype);
  }
}

/**
 * Error thrown when a FHIR server returns an unexpected response
 * Covers unexpected status codes, malformed responses, and server errors
 */
export class UnexpectedFhirResponseError extends FhirError {
  /**
   * Creates a new unexpected FHIR response error
   * 
   * @param message - Human-readable error message
   * @param context - FHIR-specific error context
   * @param statusCode - HTTP status code from the FHIR server, if available
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    context: FhirErrorContext,
    statusCode?: number,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.EXTERNAL,
      'HEALTH_FHIR_UNEXPECTED_RESPONSE',
      {
        ...context,
        additionalInfo: {
          ...(context.additionalInfo || {}),
          statusCode
        }
      },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, UnexpectedFhirResponseError.prototype);
  }
}

/**
 * Utility function to create the appropriate FHIR error based on HTTP status code
 * 
 * @param message - Human-readable error message
 * @param context - FHIR-specific error context
 * @param statusCode - HTTP status code from the FHIR server
 * @param cause - Original error that caused this exception, if any
 * @returns The appropriate FHIR error instance
 */
export function createFhirErrorFromStatusCode(
  message: string,
  context: FhirErrorContext,
  statusCode: number,
  cause?: Error
): FhirError {
  switch (statusCode) {
    case 401:
    case 403:
      return new FhirAuthenticationError(message, context, cause);
    case 404:
      return new ResourceNotFoundError(message, context, cause);
    case 408:
    case 504:
      return new FhirOperationTimeoutError(message, context, cause);
    case 422:
      return new InvalidResourceError(message, context, cause);
    case 400:
      return new InvalidResourceError(message, context, cause);
    case 405:
    case 409:
      return new FhirOperationNotPermittedError(message, context, cause);
    case 500:
    case 502:
    case 503:
    default:
      return new UnexpectedFhirResponseError(message, context, statusCode, cause);
  }
}
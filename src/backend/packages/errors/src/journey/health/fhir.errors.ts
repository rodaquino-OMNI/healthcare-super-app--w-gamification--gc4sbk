import { AppException, ErrorType } from '../../../../shared/src/exceptions/exceptions.types';

/**
 * Interface for FHIR resource context in error details
 * Captures essential information about the FHIR resource involved in the error
 * while ensuring PHI/PII protection
 */
export interface FhirResourceErrorContext {
  /** Type of FHIR resource (Patient, Observation, etc.) */
  resourceType: string;
  /** Resource ID (if available) - should not contain PHI */
  resourceId?: string;
  /** Operation being performed when the error occurred */
  operation: 'create' | 'read' | 'update' | 'delete' | 'search' | 'validate' | 'batch' | 'transaction' | string;
  /** Additional context about the error (non-PHI) */
  context?: Record<string, any>;
}

/**
 * Interface for FHIR endpoint context in error details
 * Captures information about the FHIR endpoint involved in the error
 */
export interface FhirEndpointErrorContext {
  /** Endpoint URL (with sensitive parts redacted) */
  endpoint: string;
  /** HTTP method used in the request */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | string;
  /** HTTP status code returned (if available) */
  statusCode?: number;
  /** Additional context about the endpoint (non-PHI) */
  context?: Record<string, any>;
}

/**
 * Base class for all FHIR-related errors in the Health journey
 * Provides common functionality and structure for FHIR errors
 */
export abstract class FhirError extends AppException {
  /**
   * Creates a new FHIR error instance
   * 
   * @param message - Human-readable error message
   * @param type - Type of error from ErrorType enum
   * @param code - Error code with HEALTH_FHIR_ prefix
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    type: ErrorType,
    code: string,
    details?: any,
    cause?: Error
  ) {
    super(message, type, code, details, cause);
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, FhirError.prototype);
  }

  /**
   * Sanitizes error details to ensure no PHI/PII is included
   * Override in subclasses if needed for specific error types
   * 
   * @returns Sanitized error details safe for logging and monitoring
   */
  protected sanitizeDetails(): Record<string, any> {
    // Base implementation returns the details as is
    // Subclasses should override to implement specific sanitization logic
    return this.details || {};
  }

  /**
   * Returns a JSON representation of the exception with sanitized details
   * Ensures PHI/PII protection in error reporting
   * 
   * @returns JSON object with standardized error structure and sanitized details
   */
  override toJSON(): Record<string, any> {
    const json = super.toJSON();
    json.error.details = this.sanitizeDetails();
    return json;
  }
}

/**
 * Error thrown when a connection to a FHIR endpoint fails
 * Captures details about the endpoint and the nature of the connection failure
 */
export class FhirConnectionFailureError extends FhirError {
  /**
   * Creates a new FHIR connection failure error
   * 
   * @param message - Human-readable error message
   * @param endpointContext - Context about the FHIR endpoint
   * @param cause - Original error that caused the connection failure
   */
  constructor(
    message: string,
    public readonly endpointContext: FhirEndpointErrorContext,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.EXTERNAL,
      'HEALTH_FHIR_CONNECTION_FAILURE',
      { endpoint: endpointContext },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, FhirConnectionFailureError.prototype);
  }

  /**
   * Sanitizes endpoint details to ensure no sensitive information is included
   * Redacts authentication tokens and other sensitive parts of the endpoint URL
   */
  protected override sanitizeDetails(): Record<string, any> {
    const sanitized = { ...this.details };
    
    if (sanitized.endpoint?.endpoint) {
      // Redact any authentication tokens or sensitive parts from the URL
      sanitized.endpoint.endpoint = sanitized.endpoint.endpoint
        .replace(/(\/\/[^:]+:)[^@]+(@)/, '$1*****$2') // Redact basic auth credentials
        .replace(/([?&](?:token|apiKey|secret|auth)=)[^&]+/gi, '$1*****'); // Redact query params
    }
    
    return sanitized;
  }
}

/**
 * Error thrown when authentication with a FHIR endpoint fails
 * Captures details about the endpoint and the nature of the authentication failure
 */
export class FhirAuthenticationError extends FhirError {
  /**
   * Creates a new FHIR authentication error
   * 
   * @param message - Human-readable error message
   * @param endpointContext - Context about the FHIR endpoint
   * @param cause - Original error that caused the authentication failure
   */
  constructor(
    message: string,
    public readonly endpointContext: FhirEndpointErrorContext,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.EXTERNAL,
      'HEALTH_FHIR_AUTHENTICATION_FAILURE',
      { endpoint: endpointContext },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, FhirAuthenticationError.prototype);
  }

  /**
   * Sanitizes authentication details to ensure no credentials are included
   */
  protected override sanitizeDetails(): Record<string, any> {
    const sanitized = { ...this.details };
    
    if (sanitized.endpoint?.endpoint) {
      // Redact any authentication tokens or sensitive parts from the URL
      sanitized.endpoint.endpoint = sanitized.endpoint.endpoint
        .replace(/(\/\/[^:]+:)[^@]+(@)/, '$1*****$2') // Redact basic auth credentials
        .replace(/([?&](?:token|apiKey|secret|auth)=)[^&]+/gi, '$1*****'); // Redact query params
    }
    
    // Remove any authentication headers or tokens from the context
    if (sanitized.endpoint?.context) {
      const { authorization, token, apiKey, ...safeContext } = sanitized.endpoint.context;
      sanitized.endpoint.context = safeContext;
    }
    
    return sanitized;
  }
}

/**
 * Error thrown when a FHIR resource is invalid or malformed
 * Captures details about the resource and the nature of the validation failure
 */
export class InvalidFhirResourceError extends FhirError {
  /**
   * Creates a new invalid FHIR resource error
   * 
   * @param message - Human-readable error message
   * @param resourceContext - Context about the FHIR resource
   * @param validationErrors - Specific validation errors encountered
   * @param cause - Original error that caused the validation failure
   */
  constructor(
    message: string,
    public readonly resourceContext: FhirResourceErrorContext,
    public readonly validationErrors?: string[],
    cause?: Error
  ) {
    super(
      message,
      ErrorType.VALIDATION,
      'HEALTH_FHIR_INVALID_RESOURCE',
      { resource: resourceContext, validationErrors },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, InvalidFhirResourceError.prototype);
  }

  /**
   * Sanitizes resource details to ensure no PHI is included
   */
  protected override sanitizeDetails(): Record<string, any> {
    const sanitized = { ...this.details };
    
    // Ensure validation errors don't contain PHI
    if (sanitized.validationErrors) {
      sanitized.validationErrors = sanitized.validationErrors.map((error: string) => {
        // Replace any potential PHI in validation error messages
        // This is a simplified approach - in a real implementation, more sophisticated
        // PHI detection and redaction would be needed
        return error.replace(/"[^"]+"/, '"[REDACTED]"');
      });
    }
    
    return sanitized;
  }
}

/**
 * Error thrown when a FHIR resource violates the FHIR schema
 * Captures details about the schema violation
 */
export class FhirSchemaViolationError extends FhirError {
  /**
   * Creates a new FHIR schema violation error
   * 
   * @param message - Human-readable error message
   * @param resourceContext - Context about the FHIR resource
   * @param schemaErrors - Specific schema validation errors
   * @param cause - Original error that caused the schema violation
   */
  constructor(
    message: string,
    public readonly resourceContext: FhirResourceErrorContext,
    public readonly schemaErrors?: Record<string, any>[],
    cause?: Error
  ) {
    super(
      message,
      ErrorType.VALIDATION,
      'HEALTH_FHIR_SCHEMA_VIOLATION',
      { resource: resourceContext, schemaErrors },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, FhirSchemaViolationError.prototype);
  }

  /**
   * Sanitizes schema error details to ensure no PHI is included
   */
  protected override sanitizeDetails(): Record<string, any> {
    const sanitized = { ...this.details };
    
    // Ensure schema errors don't contain PHI
    if (sanitized.schemaErrors && Array.isArray(sanitized.schemaErrors)) {
      sanitized.schemaErrors = sanitized.schemaErrors.map((error: Record<string, any>) => {
        const { path, message, keyword } = error;
        // Only include safe fields, excluding any that might contain PHI
        return { path, message, keyword };
      });
    }
    
    return sanitized;
  }
}

/**
 * Error thrown when parsing a FHIR resource fails
 * Captures details about the parsing failure
 */
export class FhirParsingError extends FhirError {
  /**
   * Creates a new FHIR parsing error
   * 
   * @param message - Human-readable error message
   * @param resourceContext - Context about the FHIR resource
   * @param parsingDetails - Details about the parsing failure
   * @param cause - Original error that caused the parsing failure
   */
  constructor(
    message: string,
    public readonly resourceContext: FhirResourceErrorContext,
    public readonly parsingDetails?: Record<string, any>,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.TECHNICAL,
      'HEALTH_FHIR_PARSING_FAILURE',
      { resource: resourceContext, parsingDetails },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, FhirParsingError.prototype);
  }

  /**
   * Sanitizes parsing error details to ensure no PHI is included
   */
  protected override sanitizeDetails(): Record<string, any> {
    const sanitized = { ...this.details };
    
    // Remove any raw data from parsing details that might contain PHI
    if (sanitized.parsingDetails) {
      const { rawData, content, body, ...safeDetails } = sanitized.parsingDetails;
      sanitized.parsingDetails = safeDetails;
    }
    
    return sanitized;
  }
}

/**
 * Error thrown when an unsupported FHIR resource type is encountered
 * Captures details about the unsupported resource type
 */
export class UnsupportedFhirResourceTypeError extends FhirError {
  /**
   * Creates a new unsupported FHIR resource type error
   * 
   * @param message - Human-readable error message
   * @param resourceType - The unsupported FHIR resource type
   * @param supportedTypes - List of supported FHIR resource types
   * @param operationContext - Context about the operation being performed
   */
  constructor(
    message: string,
    public readonly resourceType: string,
    public readonly supportedTypes: string[],
    public readonly operationContext?: Record<string, any>
  ) {
    super(
      message,
      ErrorType.VALIDATION,
      'HEALTH_FHIR_UNSUPPORTED_RESOURCE_TYPE',
      { resourceType, supportedTypes, operationContext },
      undefined
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, UnsupportedFhirResourceTypeError.prototype);
  }
}

/**
 * Error thrown when a FHIR operation fails
 * Captures details about the operation and the nature of the failure
 */
export class FhirOperationError extends FhirError {
  /**
   * Creates a new FHIR operation error
   * 
   * @param message - Human-readable error message
   * @param resourceContext - Context about the FHIR resource
   * @param operationOutcome - FHIR OperationOutcome resource (if available)
   * @param cause - Original error that caused the operation failure
   */
  constructor(
    message: string,
    public readonly resourceContext: FhirResourceErrorContext,
    public readonly operationOutcome?: Record<string, any>,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.EXTERNAL,
      'HEALTH_FHIR_OPERATION_FAILURE',
      { resource: resourceContext, operationOutcome },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, FhirOperationError.prototype);
  }

  /**
   * Sanitizes operation outcome details to ensure no PHI is included
   */
  protected override sanitizeDetails(): Record<string, any> {
    const sanitized = { ...this.details };
    
    // Extract only safe fields from the OperationOutcome
    if (sanitized.operationOutcome) {
      const safeOutcome: Record<string, any> = {
        resourceType: sanitized.operationOutcome.resourceType,
        issue: []
      };
      
      // Extract only the issue details without any PHI
      if (sanitized.operationOutcome.issue && Array.isArray(sanitized.operationOutcome.issue)) {
        safeOutcome.issue = sanitized.operationOutcome.issue.map((issue: Record<string, any>) => {
          const { severity, code, details } = issue;
          return { severity, code, details: details?.text ? { text: details.text } : undefined };
        });
      }
      
      sanitized.operationOutcome = safeOutcome;
    }
    
    return sanitized;
  }
}

/**
 * Error thrown when a FHIR rate limit is exceeded
 * Captures details about the rate limit and retry options
 */
export class FhirRateLimitExceededError extends FhirError {
  /**
   * Creates a new FHIR rate limit exceeded error
   * 
   * @param message - Human-readable error message
   * @param endpointContext - Context about the FHIR endpoint
   * @param retryAfterSeconds - Seconds to wait before retrying (if available)
   * @param cause - Original error that caused the rate limit error
   */
  constructor(
    message: string,
    public readonly endpointContext: FhirEndpointErrorContext,
    public readonly retryAfterSeconds?: number,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.EXTERNAL,
      'HEALTH_FHIR_RATE_LIMIT_EXCEEDED',
      { endpoint: endpointContext, retryAfter: retryAfterSeconds },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, FhirRateLimitExceededError.prototype);
  }

  /**
   * Sanitizes rate limit details to ensure no sensitive information is included
   */
  protected override sanitizeDetails(): Record<string, any> {
    const sanitized = { ...this.details };
    
    if (sanitized.endpoint?.endpoint) {
      // Redact any authentication tokens or sensitive parts from the URL
      sanitized.endpoint.endpoint = sanitized.endpoint.endpoint
        .replace(/(\/\/[^:]+:)[^@]+(@)/, '$1*****$2') // Redact basic auth credentials
        .replace(/([?&](?:token|apiKey|secret|auth)=)[^&]+/gi, '$1*****'); // Redact query params
    }
    
    return sanitized;
  }
}

/**
 * Error thrown when a FHIR transaction fails
 * Captures details about the transaction and the nature of the failure
 */
export class FhirTransactionError extends FhirError {
  /**
   * Creates a new FHIR transaction error
   * 
   * @param message - Human-readable error message
   * @param transactionDetails - Details about the transaction
   * @param failedResources - List of resources that failed in the transaction
   * @param cause - Original error that caused the transaction failure
   */
  constructor(
    message: string,
    public readonly transactionDetails: Record<string, any>,
    public readonly failedResources?: FhirResourceErrorContext[],
    cause?: Error
  ) {
    super(
      message,
      ErrorType.EXTERNAL,
      'HEALTH_FHIR_TRANSACTION_FAILURE',
      { transaction: transactionDetails, failedResources },
      cause
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, FhirTransactionError.prototype);
  }

  /**
   * Sanitizes transaction details to ensure no PHI is included
   */
  protected override sanitizeDetails(): Record<string, any> {
    const sanitized = { ...this.details };
    
    // Remove any raw data from transaction details that might contain PHI
    if (sanitized.transaction) {
      const { bundle, rawData, content, body, ...safeDetails } = sanitized.transaction;
      sanitized.transaction = safeDetails;
      
      // Include only the count of resources in the bundle, not the actual resources
      if (bundle?.entry && Array.isArray(bundle.entry)) {
        sanitized.transaction.resourceCount = bundle.entry.length;
      }
    }
    
    return sanitized;
  }
}
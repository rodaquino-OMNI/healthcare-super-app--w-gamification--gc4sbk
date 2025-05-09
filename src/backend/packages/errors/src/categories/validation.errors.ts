import { BaseError, ErrorType, JourneyContext } from '../base';

/**
 * Base class for all validation-related errors.
 * Used for errors related to input validation failures.
 */
export class ValidationError extends BaseError {
  /**
   * Creates a new ValidationError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param details - Additional details about the validation error
   * @param context - Additional context information about the error
   * @param suggestion - Suggested action to resolve the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string,
    details?: any,
    context: { journey?: JourneyContext; [key: string]: any } = {},
    suggestion?: string,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.VALIDATION,
      code,
      context,
      details,
      suggestion,
      cause
    );
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error thrown when a required parameter is missing.
 */
export class MissingParameterError extends ValidationError {
  /**
   * Creates a new MissingParameterError instance.
   * 
   * @param paramName - Name of the missing parameter
   * @param context - Additional context information about the error
   */
  constructor(
    paramName: string,
    context: { journey?: JourneyContext; [key: string]: any } = {}
  ) {
    super(
      `Missing required parameter: ${paramName}`,
      'MISSING_PARAMETER',
      { paramName },
      context,
      `Please provide the required parameter: ${paramName}`
    );
    this.name = 'MissingParameterError';
    Object.setPrototypeOf(this, MissingParameterError.prototype);
  }
}

/**
 * Error thrown when a parameter has an invalid value.
 */
export class InvalidParameterError extends ValidationError {
  /**
   * Creates a new InvalidParameterError instance.
   * 
   * @param paramName - Name of the invalid parameter
   * @param value - The invalid value
   * @param reason - Reason why the value is invalid
   * @param context - Additional context information about the error
   */
  constructor(
    paramName: string,
    value: any,
    reason: string,
    context: { journey?: JourneyContext; [key: string]: any } = {}
  ) {
    super(
      `Invalid parameter ${paramName}: ${reason}`,
      'INVALID_PARAMETER',
      { paramName, value, reason },
      context,
      `Please provide a valid value for ${paramName}`
    );
    this.name = 'InvalidParameterError';
    Object.setPrototypeOf(this, InvalidParameterError.prototype);
  }
}

/**
 * Error thrown when a request is malformed.
 */
export class MalformedRequestError extends ValidationError {
  /**
   * Creates a new MalformedRequestError instance.
   * 
   * @param message - Human-readable error message
   * @param details - Additional details about the malformed request
   * @param context - Additional context information about the error
   */
  constructor(
    message: string,
    details?: any,
    context: { journey?: JourneyContext; [key: string]: any } = {}
  ) {
    super(
      message,
      'MALFORMED_REQUEST',
      details,
      context,
      'Please check the request format and try again'
    );
    this.name = 'MalformedRequestError';
    Object.setPrototypeOf(this, MalformedRequestError.prototype);
  }
}

/**
 * Error thrown when credentials are invalid.
 */
export class InvalidCredentialsError extends ValidationError {
  /**
   * Creates a new InvalidCredentialsError instance.
   * 
   * @param message - Human-readable error message
   * @param details - Additional details about the invalid credentials
   * @param context - Additional context information about the error
   */
  constructor(
    message: string = 'Invalid credentials provided',
    details?: any,
    context: { journey?: JourneyContext; [key: string]: any } = {}
  ) {
    super(
      message,
      'INVALID_CREDENTIALS',
      details,
      context,
      'Please check your credentials and try again'
    );
    this.name = 'InvalidCredentialsError';
    Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
  }
}

/**
 * Error thrown when schema validation fails.
 */
export class SchemaValidationError extends ValidationError {
  /**
   * Creates a new SchemaValidationError instance.
   * 
   * @param errors - Validation errors from the schema validator
   * @param context - Additional context information about the error
   */
  constructor(
    errors: any[],
    context: { journey?: JourneyContext; [key: string]: any } = {}
  ) {
    super(
      'Schema validation failed',
      'SCHEMA_VALIDATION',
      { errors },
      context,
      'Please check the input data against the schema requirements'
    );
    this.name = 'SchemaValidationError';
    Object.setPrototypeOf(this, SchemaValidationError.prototype);
  }
}
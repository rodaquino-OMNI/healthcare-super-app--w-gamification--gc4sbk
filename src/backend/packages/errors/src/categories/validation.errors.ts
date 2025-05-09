/**
 * @file validation.errors.ts
 * @description Defines specialized error classes for validation-related errors.
 * These errors extend the BaseError with ErrorType.VALIDATION and provide
 * specific error handling for different types of validation failures.
 */

import { BaseError, ErrorContext, ErrorType, JourneyContext } from '../base';
import { ERROR_CODE_PREFIXES, ERROR_MESSAGES, AUTH_ERROR_MESSAGES } from '../constants';

/**
 * Interface for field-level validation error details.
 * Used by SchemaValidationError to provide structured validation errors.
 */
export interface ValidationErrorDetail {
  /**
   * Field path that failed validation (e.g., 'user.email', 'address[0].zipCode')
   */
  field: string;
  
  /**
   * Error message for this specific field
   */
  message: string;
  
  /**
   * Validation rule that failed (e.g., 'required', 'minLength', 'pattern')
   */
  rule?: string;
  
  /**
   * Expected value or constraint
   */
  expected?: any;
  
  /**
   * Actual value that failed validation
   */
  actual?: any;
}

/**
 * Error thrown when a required parameter is missing from a request.
 * Maps to HTTP 400 Bad Request.
 */
export class MissingParameterError extends BaseError {
  /**
   * Creates a new MissingParameterError instance.
   * 
   * @param field - Name of the missing parameter/field
   * @param context - Additional context information about the error
   * @param code - Custom error code (defaults to GEN_VALIDATION_001)
   */
  constructor(
    public readonly field: string,
    context: ErrorContext = {},
    code: string = `${ERROR_CODE_PREFIXES.GENERAL}_VALIDATION_001`
  ) {
    const message = ERROR_MESSAGES.VALIDATION.MISSING_REQUIRED_FIELD.replace('{field}', field);
    super(message, ErrorType.VALIDATION, code, context);
  }

  /**
   * Creates a MissingParameterError with journey-specific context.
   * 
   * @param field - Name of the missing parameter/field
   * @param journey - Journey context (health, care, plan, etc.)
   * @param context - Additional context information
   * @returns A new MissingParameterError with journey context
   */
  static forJourney(
    field: string,
    journey: JourneyContext,
    context: ErrorContext = {}
  ): MissingParameterError {
    const journeyPrefix = ERROR_CODE_PREFIXES[journey] || ERROR_CODE_PREFIXES.GENERAL;
    const code = `${journeyPrefix}_VALIDATION_001`;
    return new MissingParameterError(field, { ...context, journey }, code);
  }
}

/**
 * Error thrown when a parameter has an invalid value.
 * Maps to HTTP 400 Bad Request.
 */
export class InvalidParameterError extends BaseError {
  /**
   * Creates a new InvalidParameterError instance.
   * 
   * @param field - Name of the invalid parameter/field
   * @param value - The invalid value (will be converted to string for the message)
   * @param context - Additional context information about the error
   * @param code - Custom error code (defaults to GEN_VALIDATION_002)
   */
  constructor(
    public readonly field: string,
    public readonly value: any,
    context: ErrorContext = {},
    code: string = `${ERROR_CODE_PREFIXES.GENERAL}_VALIDATION_002`
  ) {
    const message = ERROR_MESSAGES.VALIDATION.INVALID_VALUE
      .replace('{field}', field)
      .replace('{value}', String(value));
    super(message, ErrorType.VALIDATION, code, context);
  }

  /**
   * Creates an InvalidParameterError with a custom message.
   * 
   * @param field - Name of the invalid parameter/field
   * @param value - The invalid value
   * @param customMessage - Custom error message
   * @param context - Additional context information
   * @returns A new InvalidParameterError with a custom message
   */
  static withCustomMessage(
    field: string,
    value: any,
    customMessage: string,
    context: ErrorContext = {}
  ): InvalidParameterError {
    const error = new InvalidParameterError(field, value, context);
    return new BaseError(
      customMessage,
      ErrorType.VALIDATION,
      error.code,
      error.context,
      { field, value }
    ) as InvalidParameterError;
  }

  /**
   * Creates an InvalidParameterError for an invalid enum value.
   * 
   * @param field - Name of the field with invalid enum value
   * @param value - The invalid value
   * @param allowedValues - Array of allowed enum values
   * @param context - Additional context information
   * @returns A new InvalidParameterError for invalid enum value
   */
  static forInvalidEnum(
    field: string,
    value: any,
    allowedValues: any[],
    context: ErrorContext = {}
  ): InvalidParameterError {
    const error = new InvalidParameterError(field, value, context);
    const message = ERROR_MESSAGES.VALIDATION.INVALID_ENUM_VALUE
      .replace('{field}', field)
      .replace('{value}', String(value));
    
    return new BaseError(
      message,
      ErrorType.VALIDATION,
      error.code,
      error.context,
      { field, value, allowedValues }
    ) as InvalidParameterError;
  }

  /**
   * Creates an InvalidParameterError with journey-specific context.
   * 
   * @param field - Name of the invalid parameter/field
   * @param value - The invalid value
   * @param journey - Journey context (health, care, plan, etc.)
   * @param context - Additional context information
   * @returns A new InvalidParameterError with journey context
   */
  static forJourney(
    field: string,
    value: any,
    journey: JourneyContext,
    context: ErrorContext = {}
  ): InvalidParameterError {
    const journeyPrefix = ERROR_CODE_PREFIXES[journey] || ERROR_CODE_PREFIXES.GENERAL;
    const code = `${journeyPrefix}_VALIDATION_002`;
    return new InvalidParameterError(field, value, { ...context, journey }, code);
  }
}

/**
 * Error thrown when a request is malformed or has invalid format.
 * Maps to HTTP 400 Bad Request.
 */
export class MalformedRequestError extends BaseError {
  /**
   * Creates a new MalformedRequestError instance.
   * 
   * @param message - Description of the format error
   * @param context - Additional context information about the error
   * @param code - Custom error code (defaults to GEN_VALIDATION_003)
   * @param details - Additional details about the error
   */
  constructor(
    message: string,
    context: ErrorContext = {},
    code: string = `${ERROR_CODE_PREFIXES.GENERAL}_VALIDATION_003`,
    details?: any
  ) {
    super(message, ErrorType.VALIDATION, code, context, details);
  }

  /**
   * Creates a MalformedRequestError for invalid JSON.
   * 
   * @param context - Additional context information
   * @returns A new MalformedRequestError for invalid JSON
   */
  static forInvalidJson(context: ErrorContext = {}): MalformedRequestError {
    return new MalformedRequestError(
      'The request body contains invalid JSON',
      context,
      `${ERROR_CODE_PREFIXES.GENERAL}_VALIDATION_004`
    );
  }

  /**
   * Creates a MalformedRequestError for missing request body.
   * 
   * @param context - Additional context information
   * @returns A new MalformedRequestError for missing request body
   */
  static forMissingBody(context: ErrorContext = {}): MalformedRequestError {
    return new MalformedRequestError(
      'Request body is required but was not provided',
      context,
      `${ERROR_CODE_PREFIXES.GENERAL}_VALIDATION_005`
    );
  }

  /**
   * Creates a MalformedRequestError with journey-specific context.
   * 
   * @param message - Description of the format error
   * @param journey - Journey context (health, care, plan, etc.)
   * @param context - Additional context information
   * @returns A new MalformedRequestError with journey context
   */
  static forJourney(
    message: string,
    journey: JourneyContext,
    context: ErrorContext = {}
  ): MalformedRequestError {
    const journeyPrefix = ERROR_CODE_PREFIXES[journey] || ERROR_CODE_PREFIXES.GENERAL;
    const code = `${journeyPrefix}_VALIDATION_003`;
    return new MalformedRequestError(message, { ...context, journey }, code);
  }
}

/**
 * Error thrown when authentication credentials are invalid.
 * Maps to HTTP 401 Unauthorized.
 */
export class InvalidCredentialsError extends BaseError {
  /**
   * Creates a new InvalidCredentialsError instance.
   * 
   * @param message - Custom message (defaults to standard invalid credentials message)
   * @param context - Additional context information about the error
   * @param code - Custom error code (defaults to AUTH_VALIDATION_001)
   */
  constructor(
    message: string = AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS,
    context: ErrorContext = {},
    code: string = `${ERROR_CODE_PREFIXES.AUTH}_VALIDATION_001`
  ) {
    super(message, ErrorType.VALIDATION, code, context);
  }

  /**
   * Creates an InvalidCredentialsError for a specific authentication method.
   * 
   * @param method - Authentication method (e.g., 'password', 'oauth', 'mfa')
   * @param context - Additional context information
   * @returns A new InvalidCredentialsError for the specified method
   */
  static forMethod(
    method: string,
    context: ErrorContext = {}
  ): InvalidCredentialsError {
    const methodMap: Record<string, string> = {
      password: `${ERROR_CODE_PREFIXES.AUTH}_VALIDATION_001`,
      oauth: `${ERROR_CODE_PREFIXES.AUTH}_VALIDATION_002`,
      mfa: `${ERROR_CODE_PREFIXES.AUTH}_VALIDATION_003`,
      token: `${ERROR_CODE_PREFIXES.AUTH}_VALIDATION_004`,
      refresh: `${ERROR_CODE_PREFIXES.AUTH}_VALIDATION_005`
    };

    const code = methodMap[method] || `${ERROR_CODE_PREFIXES.AUTH}_VALIDATION_001`;
    let message = AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS;
    
    if (method === 'token') {
      message = AUTH_ERROR_MESSAGES.INVALID_TOKEN;
    } else if (method === 'refresh') {
      message = AUTH_ERROR_MESSAGES.INVALID_REFRESH_TOKEN;
    }

    return new InvalidCredentialsError(message, { ...context, method }, code);
  }
}

/**
 * Error thrown when a request fails schema validation.
 * Provides detailed field-level validation errors.
 * Maps to HTTP 400 Bad Request.
 */
export class SchemaValidationError extends BaseError {
  /**
   * Creates a new SchemaValidationError instance.
   * 
   * @param errors - Array of validation error details for specific fields
   * @param schemaName - Name of the schema that failed validation (e.g., 'UserDTO')
   * @param context - Additional context information about the error
   * @param code - Custom error code (defaults to GEN_VALIDATION_006)
   */
  constructor(
    public readonly errors: ValidationErrorDetail[],
    public readonly schemaName: string,
    context: ErrorContext = {},
    code: string = `${ERROR_CODE_PREFIXES.GENERAL}_VALIDATION_006`
  ) {
    const message = `Validation failed for ${schemaName} with ${errors.length} error(s)`;
    super(message, ErrorType.VALIDATION, code, context, { errors });
  }

  /**
   * Creates a SchemaValidationError from class-validator errors.
   * Converts class-validator validation errors to the internal format.
   * 
   * @param validationErrors - Array of class-validator validation errors
   * @param schemaName - Name of the schema/DTO that failed validation
   * @param context - Additional context information
   * @returns A new SchemaValidationError with formatted validation errors
   */
  static fromClassValidator(
    validationErrors: any[],
    schemaName: string,
    context: ErrorContext = {}
  ): SchemaValidationError {
    const formattedErrors: ValidationErrorDetail[] = validationErrors.map(error => {
      const constraints = error.constraints || {};
      const firstConstraint = Object.keys(constraints)[0] || 'unknown';
      
      return {
        field: error.property,
        message: constraints[firstConstraint] || 'Invalid value',
        rule: firstConstraint,
        actual: error.value
      };
    });

    return new SchemaValidationError(formattedErrors, schemaName, context);
  }

  /**
   * Creates a SchemaValidationError from Zod validation errors.
   * Converts Zod validation errors to the internal format.
   * 
   * @param zodError - Zod validation error object
   * @param schemaName - Name of the schema that failed validation
   * @param context - Additional context information
   * @returns A new SchemaValidationError with formatted validation errors
   */
  static fromZod(
    zodError: any,
    schemaName: string,
    context: ErrorContext = {}
  ): SchemaValidationError {
    const formattedErrors: ValidationErrorDetail[] = [];
    
    if (zodError.errors && Array.isArray(zodError.errors)) {
      zodError.errors.forEach((error: any) => {
        formattedErrors.push({
          field: error.path.join('.'),
          message: error.message,
          rule: error.code,
          expected: error.expected,
          actual: error.received
        });
      });
    }

    return new SchemaValidationError(formattedErrors, schemaName, context);
  }

  /**
   * Creates a SchemaValidationError from Joi validation errors.
   * Converts Joi validation errors to the internal format.
   * 
   * @param joiError - Joi validation error object
   * @param schemaName - Name of the schema that failed validation
   * @param context - Additional context information
   * @returns A new SchemaValidationError with formatted validation errors
   */
  static fromJoi(
    joiError: any,
    schemaName: string,
    context: ErrorContext = {}
  ): SchemaValidationError {
    const formattedErrors: ValidationErrorDetail[] = [];
    
    if (joiError.details && Array.isArray(joiError.details)) {
      joiError.details.forEach((detail: any) => {
        formattedErrors.push({
          field: detail.path.join('.'),
          message: detail.message,
          rule: detail.type,
          actual: detail.context?.value
        });
      });
    }

    return new SchemaValidationError(formattedErrors, schemaName, context);
  }

  /**
   * Creates a SchemaValidationError from Yup validation errors.
   * Converts Yup validation errors to the internal format.
   * 
   * @param yupError - Yup validation error object
   * @param schemaName - Name of the schema that failed validation
   * @param context - Additional context information
   * @returns A new SchemaValidationError with formatted validation errors
   */
  static fromYup(
    yupError: any,
    schemaName: string,
    context: ErrorContext = {}
  ): SchemaValidationError {
    const formattedErrors: ValidationErrorDetail[] = [];
    
    if (yupError.inner && Array.isArray(yupError.inner)) {
      yupError.inner.forEach((error: any) => {
        formattedErrors.push({
          field: error.path || '',
          message: error.message || 'Invalid value',
          rule: error.type || 'validation',
          actual: error.value
        });
      });
    } else if (yupError.path && yupError.message) {
      // Handle single error case
      formattedErrors.push({
        field: yupError.path,
        message: yupError.message,
        rule: yupError.type || 'validation',
        actual: yupError.value
      });
    }

    return new SchemaValidationError(formattedErrors, schemaName, context);
  }

  /**
   * Creates a SchemaValidationError with journey-specific context.
   * 
   * @param errors - Array of validation error details
   * @param schemaName - Name of the schema that failed validation
   * @param journey - Journey context (health, care, plan, etc.)
   * @param context - Additional context information
   * @returns A new SchemaValidationError with journey context
   */
  static forJourney(
    errors: ValidationErrorDetail[],
    schemaName: string,
    journey: JourneyContext,
    context: ErrorContext = {}
  ): SchemaValidationError {
    const journeyPrefix = ERROR_CODE_PREFIXES[journey] || ERROR_CODE_PREFIXES.GENERAL;
    const code = `${journeyPrefix}_VALIDATION_006`;
    return new SchemaValidationError(errors, schemaName, { ...context, journey }, code);
  }

  /**
   * Gets a user-friendly summary of the validation errors.
   * Useful for logging or displaying a simplified error message.
   * 
   * @returns A string with a summary of the validation errors
   */
  getSummary(): string {
    if (!this.errors || this.errors.length === 0) {
      return `Validation failed for ${this.schemaName}`;
    }

    const fieldErrors = this.errors.map(error => 
      `${error.field}: ${error.message}`
    ).join('; ');

    return `Validation failed for ${this.schemaName}: ${fieldErrors}`;
  }
}
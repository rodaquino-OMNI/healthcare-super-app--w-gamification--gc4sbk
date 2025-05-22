/**
 * @file validation.errors.ts
 * @description Specialized error classes for validation-related errors
 * 
 * This file defines concrete error classes for various validation scenarios,
 * providing consistent error handling for input validation across all services.
 * Each error class extends BaseError with ErrorType.VALIDATION and includes
 * appropriate default messages and error codes.
 */

import { BaseError, ErrorType, JourneyType } from '../base';
import { COMMON_ERROR_CODES, ERROR_CODE_PREFIXES } from '../constants';

/**
 * Error thrown when a required parameter is missing from a request.
 */
export class MissingParameterError extends BaseError {
  /**
   * Creates a new MissingParameterError instance.
   * 
   * @param paramName - Name of the missing parameter
   * @param journeyType - Optional journey context where the error occurred
   * @param details - Optional additional details about the error
   */
  constructor(
    paramName: string,
    journeyType?: JourneyType,
    details?: any
  ) {
    const message = `Missing required parameter: ${paramName}`;
    const code = `${COMMON_ERROR_CODES.VALIDATION_ERROR}_MISSING_PARAMETER`;
    
    super(message, ErrorType.VALIDATION, code, {
      journey: journeyType,
      metadata: {
        paramName
      }
    }, details);
  }
}

/**
 * Error thrown when a parameter has an invalid value.
 */
export class InvalidParameterError extends BaseError {
  /**
   * Creates a new InvalidParameterError instance.
   * 
   * @param paramName - Name of the invalid parameter
   * @param reason - Optional reason why the parameter is invalid
   * @param journeyType - Optional journey context where the error occurred
   * @param details - Optional additional details about the error
   */
  constructor(
    paramName: string,
    reason?: string,
    journeyType?: JourneyType,
    details?: any
  ) {
    const message = reason
      ? `Invalid parameter '${paramName}': ${reason}`
      : `Invalid parameter: ${paramName}`;
    const code = `${COMMON_ERROR_CODES.VALIDATION_ERROR}_INVALID_PARAMETER`;
    
    super(message, ErrorType.VALIDATION, code, {
      journey: journeyType,
      metadata: {
        paramName,
        reason
      }
    }, details);
  }
}

/**
 * Error thrown when a request is malformed and cannot be processed.
 */
export class MalformedRequestError extends BaseError {
  /**
   * Creates a new MalformedRequestError instance.
   * 
   * @param reason - Optional reason why the request is malformed
   * @param journeyType - Optional journey context where the error occurred
   * @param details - Optional additional details about the error
   */
  constructor(
    reason?: string,
    journeyType?: JourneyType,
    details?: any
  ) {
    const message = reason
      ? `Malformed request: ${reason}`
      : 'Malformed request';
    const code = `${COMMON_ERROR_CODES.VALIDATION_ERROR}_MALFORMED_REQUEST`;
    
    super(message, ErrorType.VALIDATION, code, {
      journey: journeyType,
      metadata: {
        reason
      }
    }, details);
  }
}

/**
 * Error thrown when provided credentials are invalid.
 */
export class InvalidCredentialsError extends BaseError {
  /**
   * Creates a new InvalidCredentialsError instance.
   * 
   * @param message - Optional custom error message
   * @param details - Optional additional details about the error
   */
  constructor(
    message: string = 'Invalid credentials provided',
    details?: any
  ) {
    const code = `${ERROR_CODE_PREFIXES.AUTH}${COMMON_ERROR_CODES.VALIDATION_ERROR}_INVALID_CREDENTIALS`;
    
    super(message, ErrorType.VALIDATION, code, {
      journey: JourneyType.AUTH
    }, details);
  }
}

/**
 * Interface for field-level validation errors.
 */
export interface FieldValidationError {
  /**
   * Field name that failed validation
   */
  field: string;
  
  /**
   * Error message for this field
   */
  message: string;
  
  /**
   * Optional validation constraint that failed
   */
  constraint?: string;
  
  /**
   * Optional expected value or pattern
   */
  expected?: any;
  
  /**
   * Optional received value
   */
  received?: any;
}

/**
 * Error thrown when schema validation fails.
 */
export class SchemaValidationError extends BaseError {
  /**
   * Creates a new SchemaValidationError instance.
   * 
   * @param fieldErrors - Array of field-level validation errors
   * @param schemaName - Optional name of the schema that failed validation
   * @param journeyType - Optional journey context where the error occurred
   */
  constructor(
    public readonly fieldErrors: FieldValidationError[],
    schemaName?: string,
    journeyType?: JourneyType
  ) {
    const message = schemaName
      ? `Validation failed for schema: ${schemaName}`
      : 'Schema validation failed';
    const code = `${COMMON_ERROR_CODES.VALIDATION_ERROR}_SCHEMA_VALIDATION`;
    
    super(message, ErrorType.VALIDATION, code, {
      journey: journeyType,
      metadata: {
        schemaName
      }
    }, {
      fieldErrors: fieldErrors.map(error => ({
        field: error.field,
        message: error.message,
        constraint: error.constraint,
        expected: error.expected,
        received: error.received
      }))
    });
  }

  /**
   * Creates a SchemaValidationError from class-validator errors.
   * 
   * @param validationErrors - Array of class-validator ValidationError objects
   * @param schemaName - Optional name of the schema that failed validation
   * @param journeyType - Optional journey context where the error occurred
   * @returns A new SchemaValidationError instance
   */
  static fromClassValidator(
    validationErrors: any[],
    schemaName?: string,
    journeyType?: JourneyType
  ): SchemaValidationError {
    const fieldErrors: FieldValidationError[] = validationErrors.flatMap(error => {
      const constraints = error.constraints || {};
      
      return Object.entries(constraints).map(([constraint, message]) => ({
        field: error.property,
        message: message as string,
        constraint,
        expected: error.target?.[error.property],
        received: error.value
      }));
    });
    
    return new SchemaValidationError(fieldErrors, schemaName, journeyType);
  }

  /**
   * Creates a SchemaValidationError from Zod validation errors.
   * 
   * @param zodError - Zod error object
   * @param schemaName - Optional name of the schema that failed validation
   * @param journeyType - Optional journey context where the error occurred
   * @returns A new SchemaValidationError instance
   */
  static fromZod(
    zodError: any,
    schemaName?: string,
    journeyType?: JourneyType
  ): SchemaValidationError {
    const fieldErrors: FieldValidationError[] = zodError.errors?.map(error => ({
      field: error.path.join('.'),
      message: error.message,
      constraint: error.code,
      expected: error.expected,
      received: error.received
    })) || [];
    
    return new SchemaValidationError(fieldErrors, schemaName, journeyType);
  }

  /**
   * Creates a SchemaValidationError from Joi validation errors.
   * 
   * @param joiError - Joi error object
   * @param schemaName - Optional name of the schema that failed validation
   * @param journeyType - Optional journey context where the error occurred
   * @returns A new SchemaValidationError instance
   */
  static fromJoi(
    joiError: any,
    schemaName?: string,
    journeyType?: JourneyType
  ): SchemaValidationError {
    const fieldErrors: FieldValidationError[] = joiError.details?.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      constraint: detail.type,
      expected: detail.context?.limit,
      received: detail.context?.value
    })) || [];
    
    return new SchemaValidationError(fieldErrors, schemaName, journeyType);
  }

  /**
   * Creates a SchemaValidationError from Yup validation errors.
   * 
   * @param yupError - Yup error object
   * @param schemaName - Optional name of the schema that failed validation
   * @param journeyType - Optional journey context where the error occurred
   * @returns A new SchemaValidationError instance
   */
  static fromYup(
    yupError: any,
    schemaName?: string,
    journeyType?: JourneyType
  ): SchemaValidationError {
    const fieldErrors: FieldValidationError[] = yupError.inner?.map(error => ({
      field: error.path || '',
      message: error.message,
      constraint: error.type,
      expected: error.params?.expected,
      received: error.params?.value
    })) || [];
    
    return new SchemaValidationError(fieldErrors, schemaName, journeyType);
  }
}

/**
 * Error thrown when a date parameter is invalid.
 */
export class InvalidDateError extends InvalidParameterError {
  /**
   * Creates a new InvalidDateError instance.
   * 
   * @param paramName - Name of the invalid date parameter
   * @param reason - Optional reason why the date is invalid
   * @param journeyType - Optional journey context where the error occurred
   * @param details - Optional additional details about the error
   */
  constructor(
    paramName: string,
    reason?: string,
    journeyType?: JourneyType,
    details?: any
  ) {
    const specificReason = reason || 'Invalid date format or value';
    super(paramName, specificReason, journeyType, details);
    this.name = 'InvalidDateError';
  }
}

/**
 * Error thrown when a numeric parameter is invalid.
 */
export class InvalidNumericValueError extends InvalidParameterError {
  /**
   * Creates a new InvalidNumericValueError instance.
   * 
   * @param paramName - Name of the invalid numeric parameter
   * @param reason - Optional reason why the numeric value is invalid
   * @param journeyType - Optional journey context where the error occurred
   * @param details - Optional additional details about the error
   */
  constructor(
    paramName: string,
    reason?: string,
    journeyType?: JourneyType,
    details?: any
  ) {
    const specificReason = reason || 'Invalid numeric value';
    super(paramName, specificReason, journeyType, details);
    this.name = 'InvalidNumericValueError';
  }
}

/**
 * Error thrown when an enum parameter has an invalid value.
 */
export class InvalidEnumValueError extends InvalidParameterError {
  /**
   * Creates a new InvalidEnumValueError instance.
   * 
   * @param paramName - Name of the invalid enum parameter
   * @param allowedValues - Array of allowed enum values
   * @param receivedValue - The invalid value that was received
   * @param journeyType - Optional journey context where the error occurred
   * @param details - Optional additional details about the error
   */
  constructor(
    paramName: string,
    allowedValues: string[],
    receivedValue: any,
    journeyType?: JourneyType,
    details?: any
  ) {
    const reason = `Expected one of [${allowedValues.join(', ')}], but received: ${receivedValue}`;
    super(paramName, reason, journeyType, details);
    this.name = 'InvalidEnumValueError';
  }
}

/**
 * Error thrown when a format validation fails (e.g., email, URL, etc.).
 */
export class InvalidFormatError extends InvalidParameterError {
  /**
   * Creates a new InvalidFormatError instance.
   * 
   * @param paramName - Name of the parameter with invalid format
   * @param expectedFormat - Expected format description (e.g., 'email', 'URL')
   * @param journeyType - Optional journey context where the error occurred
   * @param details - Optional additional details about the error
   */
  constructor(
    paramName: string,
    expectedFormat: string,
    journeyType?: JourneyType,
    details?: any
  ) {
    const reason = `Expected format: ${expectedFormat}`;
    super(paramName, reason, journeyType, details);
    this.name = 'InvalidFormatError';
  }
}
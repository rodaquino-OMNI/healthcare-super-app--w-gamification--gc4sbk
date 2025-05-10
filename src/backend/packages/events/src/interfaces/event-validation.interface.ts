/**
 * Event Validation Interfaces
 * 
 * This file defines interfaces for event data validation throughout the event processing pipeline.
 * It includes IEventValidator for implementing validation logic and ValidationResult for structured
 * validation outcomes. These interfaces ensure that all events are properly validated before processing,
 * reducing errors and improving system reliability.
 * 
 * The validation interfaces support both schema-based validation (Zod/class-validator) and custom
 * business logic validation, providing a flexible framework for ensuring data integrity across
 * all event types in the AUSTA SuperApp.
 */

import { ZodSchema, ZodError } from 'zod';
import { ValidatorOptions, ValidationError as ClassValidatorError } from 'class-validator';

/**
 * Standard error codes used across validation errors
 */
export enum ValidationErrorCode {
  INVALID_TYPE = 'INVALID_TYPE',
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_VALUE = 'INVALID_VALUE',
  INVALID_ENUM = 'INVALID_ENUM',
  CUSTOM_ERROR = 'CUSTOM_ERROR',
  BUSINESS_RULE = 'BUSINESS_RULE',
  JOURNEY_SPECIFIC = 'JOURNEY_SPECIFIC'
}

/**
 * Represents a validation error with detailed information
 */
export interface ValidationError {
  /**
   * Error code for programmatic handling
   */
  code: string;

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * Path to the field that failed validation (for nested objects)
   * @example ['user', 'address', 'zipCode']
   */
  path?: string[];

  /**
   * Additional metadata about the error
   */
  metadata?: Record<string, any>;

  /**
   * Journey context for the error (health, care, plan)
   * Allows for journey-specific error handling
   */
  journey?: string;
}

/**
 * Represents the result of a validation operation
 */
export interface ValidationResult<T = any> {
  /**
   * Whether the validation was successful
   */
  valid: boolean;

  /**
   * Array of validation errors (empty if validation was successful)
   */
  errors: ValidationError[];

  /**
   * The validated data (only present if validation was successful)
   */
  data?: T;
}

/**
 * Options for validation operations
 */
export interface ValidationOptions {
  /**
   * Whether to abort validation on the first error
   * @default false
   */
  abortEarly?: boolean;

  /**
   * Journey context for the validation (health, care, plan)
   */
  journey?: string;

  /**
   * Additional options for class-validator (when using class-validator)
   */
  classValidatorOptions?: ValidatorOptions;

  /**
   * Custom error messages to override defaults
   */
  customMessages?: Record<string, string>;
}

/**
 * Interface for implementing event validation logic
 * @template T - The type of event being validated
 * @template R - The type of the validated result (defaults to T)
 */
export interface IEventValidator<T = any, R = T> {
  /**
   * Validates the event data synchronously
   * @param data - The event data to validate
   * @param options - Optional validation options
   * @returns ValidationResult with validation status and errors
   */
  validate(data: unknown, options?: ValidationOptions): ValidationResult<R>;

  /**
   * Validates the event data asynchronously
   * @param data - The event data to validate
   * @param options - Optional validation options
   * @returns Promise resolving to ValidationResult with validation status and errors
   */
  validateAsync(data: unknown, options?: ValidationOptions): Promise<ValidationResult<R>>;

  /**
   * Gets the schema used for validation (if applicable)
   * @returns The validation schema or undefined if not using schema-based validation
   */
  getSchema?(): ZodSchema<T> | undefined;
}

/**
 * Interface for schema-based event validators using Zod
 * @template T - The type of event being validated
 * @template R - The type of the validated result (defaults to T)
 */
export interface IZodEventValidator<T = any, R = T> extends IEventValidator<T, R> {
  /**
   * Gets the Zod schema used for validation
   * @returns The Zod validation schema
   */
  getSchema(): ZodSchema<T>;
}

/**
 * Interface for class-validator based event validators
 * @template T - The type of event being validated
 * @template R - The type of the validated result (defaults to T)
 */
export interface IClassEventValidator<T = any, R = T> extends IEventValidator<T, R> {
  /**
   * Gets the class constructor used for validation
   * @returns The class constructor
   */
  getClass(): new () => T;

  /**
   * Transforms plain object to class instance for validation
   * @param data - Plain object data
   * @returns Class instance
   */
  transformToClass(data: unknown): T;
}

/**
 * Interface for custom business logic validators that don't use schemas
 * @template T - The type of event being validated
 * @template R - The type of the validated result (defaults to T)
 */
export interface ICustomEventValidator<T = any, R = T> extends IEventValidator<T, R> {
  /**
   * Custom validation logic implementation
   * @param data - The data to validate
   * @param options - Optional validation options
   * @returns ValidationResult with validation status and errors
   */
  validateCustom(data: T, options?: ValidationOptions): ValidationResult<R>;

  /**
   * Custom asynchronous validation logic implementation
   * @param data - The data to validate
   * @param options - Optional validation options
   * @returns Promise resolving to ValidationResult with validation status and errors
   */
  validateCustomAsync(data: T, options?: ValidationOptions): Promise<ValidationResult<R>>;
}

/**
 * Creates a successful validation result
 * @param data - The validated data
 * @returns A successful ValidationResult
 */
export function createSuccessValidation<T>(data: T): ValidationResult<T> {
  return {
    valid: true,
    errors: [],
    data
  };
}

/**
 * Creates a failed validation result
 * @param errors - The validation errors
 * @returns A failed ValidationResult
 */
export function createFailedValidation(errors: ValidationError[]): ValidationResult {
  return {
    valid: false,
    errors
  };
}

/**
 * Creates a validation error
 * @param code - Error code
 * @param message - Error message
 * @param path - Path to the field that failed validation
 * @param metadata - Additional error metadata
 * @param journey - Journey context for the error
 * @returns A ValidationError object
 */
export function createValidationError(
  code: string,
  message: string,
  path?: string[],
  metadata?: Record<string, any>,
  journey?: string
): ValidationError {
  return {
    code,
    message,
    path,
    metadata,
    journey
  };
}

/**
 * Converts a Zod error to a ValidationResult
 * @param error - The Zod error
 * @param journey - Optional journey context
 * @returns A failed ValidationResult with converted errors
 */
export function zodErrorToValidationResult(error: ZodError, journey?: string): ValidationResult {
  const errors: ValidationError[] = error.errors.map(issue => ({
    code: mapZodErrorCodeToValidationErrorCode(issue.code),
    message: issue.message,
    path: issue.path.map(p => p.toString()),
    journey
  }));

  return createFailedValidation(errors);
}

/**
 * Maps Zod error codes to ValidationErrorCode
 * @param zodCode - The Zod error code
 * @returns The corresponding ValidationErrorCode
 */
function mapZodErrorCodeToValidationErrorCode(zodCode: string): string {
  const codeMap: Record<string, ValidationErrorCode> = {
    'invalid_type': ValidationErrorCode.INVALID_TYPE,
    'required': ValidationErrorCode.REQUIRED_FIELD,
    'invalid_string': ValidationErrorCode.INVALID_FORMAT,
    'invalid_enum_value': ValidationErrorCode.INVALID_ENUM,
    'custom': ValidationErrorCode.CUSTOM_ERROR
  };

  return codeMap[zodCode] || ValidationErrorCode.CUSTOM_ERROR;
}

/**
 * Converts class-validator errors to a ValidationResult
 * @param errors - The class-validator errors
 * @param journey - Optional journey context
 * @returns A failed ValidationResult with converted errors
 */
export function classValidatorErrorsToValidationResult(
  errors: ClassValidatorError[],
  journey?: string
): ValidationResult {
  const validationErrors: ValidationError[] = errors.map(error => {
    const constraints = error.constraints || {};
    const firstConstraint = Object.keys(constraints)[0] || 'unknown';
    
    return {
      code: mapClassValidatorConstraintToErrorCode(firstConstraint),
      message: constraints[firstConstraint] || 'Validation failed',
      path: error.property ? [error.property] : undefined,
      metadata: { constraints: error.constraints },
      journey
    };
  });

  return createFailedValidation(validationErrors);
}

/**
 * Maps class-validator constraint names to ValidationErrorCode
 * @param constraint - The class-validator constraint name
 * @returns The corresponding ValidationErrorCode
 */
function mapClassValidatorConstraintToErrorCode(constraint: string): string {
  const constraintMap: Record<string, ValidationErrorCode> = {
    'isNotEmpty': ValidationErrorCode.REQUIRED_FIELD,
    'isString': ValidationErrorCode.INVALID_TYPE,
    'isNumber': ValidationErrorCode.INVALID_TYPE,
    'isBoolean': ValidationErrorCode.INVALID_TYPE,
    'isDate': ValidationErrorCode.INVALID_TYPE,
    'isEmail': ValidationErrorCode.INVALID_FORMAT,
    'isEnum': ValidationErrorCode.INVALID_ENUM,
    'isIn': ValidationErrorCode.INVALID_ENUM,
    'matches': ValidationErrorCode.INVALID_FORMAT,
    'isUrl': ValidationErrorCode.INVALID_FORMAT
  };

  return constraintMap[constraint] || ValidationErrorCode.CUSTOM_ERROR;
}

/**
 * Combines multiple validation results into a single result
 * @param results - Array of validation results to combine
 * @returns A combined ValidationResult
 */
export function combineValidationResults<T>(
  results: ValidationResult[]
): ValidationResult<T> {
  // If any result is invalid, the combined result is invalid
  const hasInvalidResult = results.some(result => !result.valid);
  
  if (hasInvalidResult) {
    // Collect all errors from invalid results
    const allErrors = results
      .filter(result => !result.valid)
      .flatMap(result => result.errors);
    
    return createFailedValidation(allErrors);
  }
  
  // All results are valid, return the data from the last result
  const lastResult = results[results.length - 1];
  return createSuccessValidation<T>(lastResult.data as T);
}

/**
 * Creates a validation result from a business rule check
 * @param isValid - Whether the business rule check passed
 * @param errorMessage - Error message if the check failed
 * @param errorCode - Error code if the check failed (defaults to BUSINESS_RULE)
 * @param path - Path to the field that failed validation
 * @param journey - Journey context for the error
 * @returns A ValidationResult based on the business rule check
 */
export function createBusinessRuleValidation<T>(
  isValid: boolean,
  errorMessage: string,
  data?: T,
  errorCode: string = ValidationErrorCode.BUSINESS_RULE,
  path?: string[],
  journey?: string
): ValidationResult<T> {
  if (isValid) {
    return createSuccessValidation<T>(data as T);
  }
  
  const error = createValidationError(
    errorCode,
    errorMessage,
    path,
    undefined,
    journey
  );
  
  return createFailedValidation([error]);
}

/**
 * Creates a journey-specific validation error
 * @param journey - Journey identifier (health, care, plan)
 * @param message - Error message
 * @param code - Error code (defaults to JOURNEY_SPECIFIC)
 * @param path - Path to the field that failed validation
 * @param metadata - Additional error metadata
 * @returns A journey-specific ValidationError
 */
export function createJourneyValidationError(
  journey: string,
  message: string,
  code: string = ValidationErrorCode.JOURNEY_SPECIFIC,
  path?: string[],
  metadata?: Record<string, any>
): ValidationError {
  return createValidationError(
    code,
    message,
    path,
    metadata,
    journey
  );
}

/**
 * Interface for a validator factory that creates validators for specific event types
 */
export interface IEventValidatorFactory {
  /**
   * Creates a validator for the specified event type
   * @param eventType - The type of event to create a validator for
   * @returns An event validator for the specified event type
   */
  createValidator<T = any, R = T>(eventType: string): IEventValidator<T, R>;
  
  /**
   * Checks if a validator exists for the specified event type
   * @param eventType - The event type to check
   * @returns True if a validator exists for the event type, false otherwise
   */
  hasValidator(eventType: string): boolean;
  
  /**
   * Registers a validator for a specific event type
   * @param eventType - The event type to register a validator for
   * @param validator - The validator to register
   */
  registerValidator<T = any, R = T>(eventType: string, validator: IEventValidator<T, R>): void;
}

/**
 * Interface for a validator registry that manages validators for different event types
 */
export interface IEventValidatorRegistry {
  /**
   * Gets a validator for the specified event type
   * @param eventType - The type of event to get a validator for
   * @returns An event validator for the specified event type, or undefined if not found
   */
  getValidator<T = any, R = T>(eventType: string): IEventValidator<T, R> | undefined;
  
  /**
   * Registers a validator for a specific event type
   * @param eventType - The event type to register a validator for
   * @param validator - The validator to register
   */
  registerValidator<T = any, R = T>(eventType: string, validator: IEventValidator<T, R>): void;
  
  /**
   * Checks if a validator exists for the specified event type
   * @param eventType - The event type to check
   * @returns True if a validator exists for the event type, false otherwise
   */
  hasValidator(eventType: string): boolean;
  
  /**
   * Gets all registered event types
   * @returns Array of registered event types
   */
  getRegisteredEventTypes(): string[];
}

/**
 * Interface for a composite validator that combines multiple validators
 */
export interface ICompositeEventValidator<T = any, R = T> extends IEventValidator<T, R> {
  /**
   * Adds a validator to the composite
   * @param validator - The validator to add
   * @returns The composite validator instance for chaining
   */
  addValidator(validator: IEventValidator<T, any>): ICompositeEventValidator<T, R>;
  
  /**
   * Gets all validators in the composite
   * @returns Array of validators
   */
  getValidators(): IEventValidator<T, any>[];
}
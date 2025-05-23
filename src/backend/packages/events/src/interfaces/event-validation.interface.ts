/**
 * @file event-validation.interface.ts
 * @description Defines interfaces for event data validation throughout the event processing pipeline.
 * These interfaces ensure that all events are properly validated before processing,
 * reducing errors and improving system reliability.
 */

/**
 * Represents the result of a validation operation.
 * Provides a standardized structure for validation outcomes across the system.
 */
export interface ValidationResult {
  /**
   * Indicates whether the validation was successful.
   */
  isValid: boolean;

  /**
   * Array of validation errors if validation failed.
   * Empty array if validation was successful.
   */
  errors: ValidationError[];

  /**
   * Optional metadata about the validation process.
   * Can include information about the validator used, validation context, etc.
   */
  metadata?: Record<string, any>;
}

/**
 * Represents a validation error with detailed information.
 */
export interface ValidationError {
  /**
   * Error code for categorizing the validation error.
   * Useful for client-side error handling and internationalization.
   */
  code: string;

  /**
   * Human-readable error message describing the validation failure.
   */
  message: string;

  /**
   * Path to the property that failed validation.
   * For nested objects, this can be a dot-notation path (e.g., 'user.address.city').
   */
  path?: string;

  /**
   * Additional context about the validation error.
   * Can include information about expected values, constraints, etc.
   */
  context?: Record<string, any>;
}

/**
 * Interface for implementing event validation logic.
 * Validators can be implemented using schema-based validation (Zod, class-validator)
 * or custom business logic validation.
 */
export interface IEventValidator<T = any> {
  /**
   * Validates the provided event data synchronously.
   * 
   * @param data - The event data to validate
   * @returns ValidationResult with validation outcome
   */
  validate(data: T): ValidationResult;

  /**
   * Validates the provided event data asynchronously.
   * Useful for validations that require database lookups or external service calls.
   * 
   * @param data - The event data to validate
   * @returns Promise resolving to ValidationResult with validation outcome
   */
  validateAsync(data: T): Promise<ValidationResult>;

  /**
   * Returns the schema or validation rules used by this validator.
   * This can be a Zod schema, class-validator metadata, or custom validation rules.
   * 
   * @returns The validation schema or rules
   */
  getSchema(): any;
}

/**
 * Interface for schema-based validators using Zod.
 * Provides a specialized implementation for Zod schema validation.
 */
export interface IZodEventValidator<T = any> extends IEventValidator<T> {
  /**
   * Returns the Zod schema used for validation.
   * 
   * @returns The Zod schema
   */
  getSchema(): any; // Zod.Schema<T> in actual implementation
}

/**
 * Interface for schema-based validators using class-validator.
 * Provides a specialized implementation for class-validator decorators.
 */
export interface IClassValidatorEventValidator<T = any> extends IEventValidator<T> {
  /**
   * Returns the validation class with class-validator decorators.
   * 
   * @returns The validation class constructor
   */
  getSchema(): any; // Constructor<T> in actual implementation
}

/**
 * Factory function type for creating event validators.
 * Allows for dependency injection and dynamic validator creation.
 */
export type EventValidatorFactory<T = any> = () => IEventValidator<T>;

/**
 * Options for configuring validation behavior.
 */
export interface ValidationOptions {
  /**
   * Whether to abort validation on the first error.
   * If true, only the first error will be returned.
   * If false, all errors will be collected and returned.
   */
  abortEarly?: boolean;

  /**
   * Whether to strip unknown properties from the validated object.
   * If true, properties not defined in the schema will be removed.
   * If false, unknown properties will be preserved.
   */
  stripUnknown?: boolean;

  /**
   * Custom error messages to override default messages.
   * Keys are error codes, values are message templates.
   */
  messages?: Record<string, string>;

  /**
   * Context data to be passed to validation functions.
   * Useful for conditional validation based on external factors.
   */
  context?: Record<string, any>;
}
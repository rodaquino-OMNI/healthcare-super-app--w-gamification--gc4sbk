/**
 * Event Validation Interfaces - Defines standardized interfaces for validating events
 * throughout the event processing pipeline in the AUSTA SuperApp.
 *
 * These interfaces ensure that all events are properly validated before processing,
 * reducing errors and improving system reliability across all journey services.
 */

import { ValidationError } from '../errors/validation.error';

/**
 * Severity levels for validation issues
 */
export enum ValidationSeverity {
  /**
   * Error that prevents event processing
   */
  ERROR = 'error',
  
  /**
   * Warning that allows processing but should be logged
   */
  WARNING = 'warning',
  
  /**
   * Informational message that doesn't affect processing
   */
  INFO = 'info'
}

/**
 * Represents a single validation issue
 */
export interface ValidationIssue {
  /**
   * Unique error code for the validation issue
   * @example 'EVENT_001'
   */
  code: string;
  
  /**
   * Human-readable error message
   */
  message: string;
  
  /**
   * Path to the field that caused the validation issue
   * @example 'payload.userId'
   */
  field?: string;
  
  /**
   * Severity level of the validation issue
   * @default ValidationSeverity.ERROR
   */
  severity: ValidationSeverity;
  
  /**
   * Additional context or metadata about the validation issue
   */
  context?: Record<string, any>;
}

/**
 * Result of a validation operation
 */
export interface ValidationResult {
  /**
   * Whether the validation passed
   */
  isValid: boolean;
  
  /**
   * List of validation issues found
   */
  issues: ValidationIssue[];
  
  /**
   * Journey context for the validation (health, care, plan)
   * Allows for journey-specific validation handling
   */
  journey?: string;
  
  /**
   * Get all validation issues as ValidationError instances
   */
  getErrors(): ValidationError[];
  
  /**
   * Get all validation issues with a specific severity
   * @param severity The severity level to filter by
   */
  getIssuesBySeverity(severity: ValidationSeverity): ValidationIssue[];
  
  /**
   * Check if there are any issues with a specific severity
   * @param severity The severity level to check for
   */
  hasIssuesWithSeverity(severity: ValidationSeverity): boolean;
}

/**
 * Interface for implementing event validators
 * @template T The type of event being validated
 */
export interface IEventValidator<T = any> {
  /**
   * Validate an event synchronously
   * @param event The event to validate
   * @returns Validation result
   */
  validate(event: T): ValidationResult;
  
  /**
   * Validate an event asynchronously
   * @param event The event to validate
   * @returns Promise resolving to validation result
   */
  validateAsync(event: T): Promise<ValidationResult>;
  
  /**
   * Check if this validator can handle the given event type
   * @param eventType The type of event to check
   * @returns Whether this validator can handle the event type
   */
  canValidate(eventType: string): boolean;
  
  /**
   * Get the event types this validator can handle
   * @returns Array of supported event types
   */
  getSupportedEventTypes(): string[];
}

/**
 * Interface for schema-based validators (e.g., using Zod, class-validator)
 * @template T The type of event being validated
 * @template S The schema type used for validation
 */
export interface ISchemaValidator<T = any, S = any> extends IEventValidator<T> {
  /**
   * Get the schema used for validation
   * @returns The validation schema
   */
  getSchema(): S;
  
  /**
   * Convert schema validation errors to standard ValidationIssue format
   * @param errors The schema-specific validation errors
   * @returns Standardized validation issues
   */
  mapSchemaErrorsToIssues(errors: any[]): ValidationIssue[];
}

/**
 * Factory for creating empty validation results
 */
export const ValidationResultFactory = {
  /**
   * Create a valid result with no issues
   * @param journey Optional journey context
   */
  valid: (journey?: string): ValidationResult => ({
    isValid: true,
    issues: [],
    journey,
    getErrors: () => [],
    getIssuesBySeverity: (severity: ValidationSeverity) => [],
    hasIssuesWithSeverity: (severity: ValidationSeverity) => false
  }),
  
  /**
   * Create an invalid result with the specified issues
   * @param issues Validation issues
   * @param journey Optional journey context
   */
  invalid: (issues: ValidationIssue[], journey?: string): ValidationResult => ({
    isValid: false,
    issues,
    journey,
    getErrors: () => issues.map(issue => new ValidationError(issue.message, issue.code, issue.field, issue.context)),
    getIssuesBySeverity: (severity: ValidationSeverity) => issues.filter(issue => issue.severity === severity),
    hasIssuesWithSeverity: (severity: ValidationSeverity) => issues.some(issue => issue.severity === severity)
  })
};

/**
 * Composite validator that combines multiple validators
 * @template T The type of event being validated
 */
export interface ICompositeValidator<T = any> extends IEventValidator<T> {
  /**
   * Add a validator to the composite
   * @param validator The validator to add
   */
  addValidator(validator: IEventValidator<T>): void;
  
  /**
   * Get all validators in the composite
   * @returns Array of validators
   */
  getValidators(): IEventValidator<T>[];
  
  /**
   * Set the validation strategy (e.g., fail-fast, collect-all-errors)
   * @param strategy The validation strategy to use
   */
  setValidationStrategy(strategy: ValidationStrategy): void;
}

/**
 * Validation strategy for composite validators
 */
export enum ValidationStrategy {
  /**
   * Stop at the first validation failure
   */
  FAIL_FAST = 'fail-fast',
  
  /**
   * Collect all validation errors before returning
   */
  COLLECT_ALL = 'collect-all'
}
/**
 * @austa/utils/validation
 * 
 * Comprehensive validation utilities for ensuring data integrity across all AUSTA SuperApp services.
 * This module provides standardized validation functions for various data types and structures,
 * with consistent error handling and localization support.
 * 
 * @packageDocumentation
 */

/**
 * String validation utilities for validating text-based data including Brazilian CPF numbers,
 * email addresses, URLs, and pattern matching.
 * 
 * @example
 * ```typescript
 * import { string } from '@austa/utils/validation';
 * 
 * // Validate a Brazilian CPF number
 * if (string.isValidCPF('123.456.789-09')) {
 *   // Process valid CPF
 * }
 * 
 * // Validate an email address
 * if (string.isValidEmail('user@example.com')) {
 *   // Process valid email
 * }
 * ```
 */
import * as stringValidator from './string.validator';
export const string = stringValidator;

/**
 * Date validation utilities for ensuring date integrity, including validation for date ranges,
 * future/past dates, business days, and timezone-specific validation.
 * 
 * @example
 * ```typescript
 * import { date } from '@austa/utils/validation';
 * 
 * // Check if a date is valid
 * if (date.isValidDate('2023-01-15')) {
 *   // Process valid date
 * }
 * 
 * // Check if a date is within a range
 * if (date.isDateInRange(someDate, startDate, endDate)) {
 *   // Date is within range
 * }
 * ```
 */
import * as dateValidator from './date.validator';
export const date = dateValidator;

/**
 * Number validation utilities for validating numeric values, including range validation,
 * integer validation, positive/negative number validation, and currency validation.
 * 
 * @example
 * ```typescript
 * import { number } from '@austa/utils/validation';
 * 
 * // Check if a number is within a range
 * if (number.isInRange(value, 1, 100)) {
 *   // Number is within range
 * }
 * 
 * // Validate Brazilian currency format
 * if (number.isValidCurrency('R$ 1.234,56')) {
 *   // Valid currency format
 * }
 * ```
 */
import * as numberValidator from './number.validator';
export const number = numberValidator;

/**
 * Object validation utilities for validating object structures, checking property existence,
 * validating nested properties, and performing type checking.
 * 
 * @example
 * ```typescript
 * import { object } from '@austa/utils/validation';
 * 
 * // Check if an object has required properties
 * if (object.hasRequiredProperties(data, ['id', 'name', 'email'])) {
 *   // Object has all required properties
 * }
 * 
 * // Validate nested property
 * if (object.hasValidNestedProperty(data, 'user.profile.email', (email) => string.isValidEmail(email))) {
 *   // Nested property is valid
 * }
 * ```
 */
import * as objectValidator from './object.validator';
export const object = objectValidator;

/**
 * Schema validation utilities for creating and working with validation schemas using Zod and class-validator.
 * Provides a bridge between different validation approaches for seamless integration.
 * 
 * @example
 * ```typescript
 * import { schema } from '@austa/utils/validation';
 * import { z } from 'zod';
 * 
 * // Create a schema with pre-configured error messages
 * const userSchema = schema.createSchema({
 *   name: z.string().min(2).max(50),
 *   email: z.string().email(),
 *   age: z.number().min(18)
 * });
 * 
 * // Validate data against schema
 * const result = schema.validate(userSchema, userData);
 * if (result.success) {
 *   // Data is valid
 * } else {
 *   // Handle validation errors
 *   console.error(result.errors);
 * }
 * ```
 */
import * as schemaValidator from './schema.validator';
export const schema = schemaValidator;

/**
 * Common validation utilities for general-purpose validation, including Brazilian-specific identifiers,
 * phone numbers, postal codes, and common patterns.
 * 
 * @example
 * ```typescript
 * import { common } from '@austa/utils/validation';
 * 
 * // Validate a Brazilian CNPJ
 * if (common.isValidCNPJ('12.345.678/0001-90')) {
 *   // Valid CNPJ
 * }
 * 
 * // Validate a Brazilian phone number
 * if (common.isValidPhoneNumber('+55 11 98765-4321')) {
 *   // Valid phone number
 * }
 * ```
 */
import * as commonValidator from './common.validator';
export const common = commonValidator;

/**
 * Type definitions for validation options, results, and error formats.
 * These types provide consistent interfaces for all validation functions.
 */
export interface ValidationOptions {
  /** Whether to throw an error on validation failure instead of returning false */
  throwOnError?: boolean;
  /** Custom error message to use when validation fails */
  errorMessage?: string;
  /** Context information to include in error messages */
  context?: Record<string, any>;
}

/**
 * Result of a validation operation that includes success status and any validation errors.
 */
export interface ValidationResult {
  /** Whether the validation was successful */
  success: boolean;
  /** Validation errors if any */
  errors?: ValidationError[];
  /** Validated and potentially transformed data */
  data?: any;
}

/**
 * Structured validation error with field, message, and optional context.
 */
export interface ValidationError {
  /** Field or property that failed validation */
  field: string;
  /** Error message describing the validation failure */
  message: string;
  /** Error code for programmatic handling */
  code?: string;
  /** Additional context about the validation error */
  context?: Record<string, any>;
}

/**
 * Convenience re-exports of commonly used validators for direct import.
 * These allow importing frequently used validators without namespace.
 */

// String validators
export const { isValidCPF, isValidEmail, isValidUrl } = string;

// Date validators
export const { isValidDate, isDateInRange, isFutureDate, isPastDate } = date;

// Number validators
export const { isInRange, isInteger, isPositive, isNegative } = number;

// Object validators
export const { hasRequiredProperties, isValidType } = object;

// Common validators
export const { isValidCNPJ, isValidPhoneNumber, isValidPostalCode } = common;

/**
 * Default export for backwards compatibility.
 * @deprecated Use named exports instead.
 */
export default {
  string,
  date,
  number,
  object,
  schema,
  common,
};
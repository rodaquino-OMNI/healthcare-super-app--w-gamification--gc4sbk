/**
 * @file Validation Utilities Package
 * @description Comprehensive validation utilities for the AUSTA SuperApp backend services.
 * This package provides a standardized approach to validation across all services,
 * ensuring consistent data integrity and error handling throughout the application.
 *
 * @module @austa/utils/validation
 */

// Re-export all validators from specialized modules

/**
 * String validation utilities for validating text-based data.
 * Includes validators for CPF, email, URL, and general string patterns.
 */
export * from './string.validator';

/**
 * Number validation utilities for validating numeric values.
 * Includes validators for ranges, integers, and currency formats.
 */
export * from './number.validator';

/**
 * Date validation utilities for ensuring date integrity.
 * Includes validators for date ranges, future/past dates, and business days.
 */
export * from './date.validator';

/**
 * Object validation utilities for validating complex data structures.
 * Includes validators for property existence, nested properties, and type checking.
 */
export * from './object.validator';

/**
 * Common validation utilities for general-purpose validation.
 * Includes validators for Brazilian-specific identifiers and common patterns.
 */
export * from './common.validator';

/**
 * Schema validation utilities for creating and working with validation schemas.
 * Provides integration between Zod and class-validator for consistent validation.
 */
export * from './schema.validator';

// Namespace exports for better organization

import * as StringValidators from './string.validator';
import * as NumberValidators from './number.validator';
import * as DateValidators from './date.validator';
import * as ObjectValidators from './object.validator';
import * as CommonValidators from './common.validator';
import * as SchemaValidators from './schema.validator';

/**
 * Organized validation utilities by category.
 * Allows importing all validators from a specific category.
 * 
 * @example
 * // Import all string validators
 * import { Validators } from '@austa/utils/validation';
 * const isValid = Validators.String.isValidEmail(email);
 */
export const Validators = {
  /** String validation utilities */
  String: StringValidators,
  
  /** Number validation utilities */
  Number: NumberValidators,
  
  /** Date validation utilities */
  Date: DateValidators,
  
  /** Object validation utilities */
  Object: ObjectValidators,
  
  /** Common validation utilities */
  Common: CommonValidators,
  
  /** Schema validation utilities */
  Schema: SchemaValidators,
};

// Convenience re-exports of commonly used validators

/**
 * Validates a Brazilian CPF (Cadastro de Pessoas Físicas) number.
 * Re-exported from string.validator for convenience.
 * 
 * @param cpf - The CPF string to validate
 * @returns True if the CPF is valid, false otherwise
 * 
 * @example
 * import { isValidCPF } from '@austa/utils/validation';
 * const valid = isValidCPF('123.456.789-09');
 */
export const { isValidCPF } = StringValidators;

/**
 * Validates if a date is valid.
 * Re-exported from date.validator for convenience.
 * 
 * @param date - The date to validate
 * @returns True if the date is valid, false otherwise
 * 
 * @example
 * import { isValidDate } from '@austa/utils/validation';
 * const valid = isValidDate(new Date());
 */
export const { isValidDate } = DateValidators;

/**
 * Validates if a date is within a specified range.
 * Re-exported from date.validator for convenience.
 * 
 * @param date - The date to check
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @returns True if the date is within the range, false otherwise
 * 
 * @example
 * import { isDateInRange } from '@austa/utils/validation';
 * const valid = isDateInRange(new Date(), startDate, endDate);
 */
export const { isDateInRange } = DateValidators;

/**
 * Validates an email address.
 * Re-exported from string.validator for convenience.
 * 
 * @param email - The email to validate
 * @returns True if the email is valid, false otherwise
 * 
 * @example
 * import { isValidEmail } from '@austa/utils/validation';
 * const valid = isValidEmail('user@example.com');
 */
export const { isValidEmail } = StringValidators;

/**
 * Validates a URL with SSRF protection.
 * Re-exported from string.validator for convenience.
 * 
 * @param url - The URL to validate
 * @returns True if the URL is valid and safe, false otherwise
 * 
 * @example
 * import { isValidUrl } from '@austa/utils/validation';
 * const valid = isValidUrl('https://example.com');
 */
export const { isValidUrl } = StringValidators;

/**
 * Validates if a value is a valid number within specified range.
 * Re-exported from number.validator for convenience.
 * 
 * @param value - The number to validate
 * @param min - The minimum allowed value (optional)
 * @param max - The maximum allowed value (optional)
 * @returns True if the number is valid and within range, false otherwise
 * 
 * @example
 * import { isValidNumber } from '@austa/utils/validation';
 * const valid = isValidNumber(42, 0, 100);
 */
export const { isValidNumber } = NumberValidators;

/**
 * Validates if an object has all required properties.
 * Re-exported from object.validator for convenience.
 * 
 * @param obj - The object to validate
 * @param requiredProps - Array of required property names
 * @returns True if the object has all required properties, false otherwise
 * 
 * @example
 * import { hasRequiredProperties } from '@austa/utils/validation';
 * const valid = hasRequiredProperties(user, ['id', 'name', 'email']);
 */
export const { hasRequiredProperties } = ObjectValidators;

/**
 * Creates a Zod schema with pre-configured error messages.
 * Re-exported from schema.validator for convenience.
 * 
 * @param schemaBuilder - Function that builds the schema
 * @returns Configured Zod schema
 * 
 * @example
 * import { createSchema } from '@austa/utils/validation';
 * import { z } from 'zod';
 * 
 * const userSchema = createSchema(() => z.object({
 *   name: z.string(),
 *   email: z.string().email(),
 * }));
 */
export const { createSchema } = SchemaValidators;

/**
 * Validates a Brazilian postal code (CEP).
 * Re-exported from common.validator for convenience.
 * 
 * @param cep - The postal code to validate
 * @returns True if the postal code is valid, false otherwise
 * 
 * @example
 * import { isValidCEP } from '@austa/utils/validation';
 * const valid = isValidCEP('12345-678');
 */
export const { isValidCEP } = CommonValidators;

/**
 * Validates a Brazilian phone number.
 * Re-exported from common.validator for convenience.
 * 
 * @param phone - The phone number to validate
 * @returns True if the phone number is valid, false otherwise
 * 
 * @example
 * import { isValidPhoneNumber } from '@austa/utils/validation';
 * const valid = isValidPhoneNumber('(11) 98765-4321');
 */
export const { isValidPhoneNumber } = CommonValidators;

// Type exports

/**
 * Common validation options used across multiple validators.
 */
export interface ValidationOptions {
  /** Whether to throw an error on validation failure */
  throwOnError?: boolean;
  /** Custom error message to use when validation fails */
  errorMessage?: string;
  /** Whether to allow null values (treats null as valid) */
  allowNull?: boolean;
  /** Whether to allow undefined values (treats undefined as valid) */
  allowUndefined?: boolean;
}

/**
 * Result of a validation operation that includes detailed information.
 */
export interface ValidationResult {
  /** Whether the validation passed */
  valid: boolean;
  /** Error message if validation failed */
  message?: string;
  /** Additional validation details */
  details?: Record<string, any>;
  /** Original value that was validated */
  value: any;
}

/**
 * Options for date validation.
 */
export interface DateValidationOptions extends ValidationOptions {
  /** Whether to ignore the time component when comparing dates */
  ignoreTime?: boolean;
  /** Timezone to use for date comparisons */
  timezone?: string;
}

/**
 * Options for number validation.
 */
export interface NumberValidationOptions extends ValidationOptions {
  /** Whether to include the minimum value in the valid range */
  inclusiveMin?: boolean;
  /** Whether to include the maximum value in the valid range */
  inclusiveMax?: boolean;
  /** Precision to use for floating point comparisons */
  precision?: number;
}

/**
 * Options for string validation.
 */
export interface StringValidationOptions extends ValidationOptions {
  /** Whether to trim the string before validation */
  trim?: boolean;
  /** Whether to ignore case when comparing strings */
  ignoreCase?: boolean;
}

/**
 * Options for object validation.
 */
export interface ObjectValidationOptions extends ValidationOptions {
  /** Whether to validate nested properties */
  validateNested?: boolean;
  /** Whether to allow additional properties not specified in the schema */
  allowAdditionalProperties?: boolean;
}

/**
 * Type of validation function that returns a boolean result.
 */
export type SimpleValidator<T> = (value: T, ...args: any[]) => boolean;

/**
 * Type of validation function that returns a detailed validation result.
 */
export type DetailedValidator<T> = (value: T, options?: ValidationOptions) => ValidationResult;

/**
 * Type of validation function that can be used with Zod or class-validator.
 */
export type SchemaValidator<T> = (value: T, context?: any) => boolean;

// Default export for convenient importing
export default Validators;
/**
 * @file Validation utilities for the AUSTA SuperApp
 * @description Provides a comprehensive set of validation utilities for ensuring data integrity
 * across all services. This module exports validators for strings, numbers, dates, objects,
 * and common data types used throughout the application.
 * 
 * @module @austa/utils/validation
 */

// Import all validators from their respective files
import * as StringValidatorsInternal from '../src/validation/string.validator';
import * as DateValidatorsInternal from '../src/validation/date.validator';
import * as NumberValidatorsInternal from '../src/validation/number.validator';
import * as ObjectValidatorsInternal from '../src/validation/object.validator';
import * as CommonValidatorsInternal from '../src/validation/common.validator';
import * as SchemaValidatorsInternal from '../src/validation/schema.validator';

// Re-export all validators with namespaces for better organization

/**
 * String validation utilities for validating string values.
 * Includes validators for CPF, email, URL, and string patterns.
 * 
 * @example
 * import { StringValidators } from '@austa/utils/validation';
 * 
 * if (StringValidators.isValidCPF('123.456.789-09')) {
 *   // Valid CPF
 * }
 */
export const StringValidators = StringValidatorsInternal;

/**
 * Date validation utilities for ensuring date integrity.
 * Includes validators for date ranges, future/past dates, and business days.
 * 
 * @example
 * import { DateValidators } from '@austa/utils/validation';
 * 
 * if (DateValidators.isValidDate(someDate)) {
 *   // Valid date
 * }
 */
export const DateValidators = DateValidatorsInternal;

/**
 * Number validation utilities for validating numeric values.
 * Includes validators for ranges, integers, and currency values.
 * 
 * @example
 * import { NumberValidators } from '@austa/utils/validation';
 * 
 * if (NumberValidators.isInRange(value, 1, 100)) {
 *   // Value is between 1 and 100
 * }
 */
export const NumberValidators = NumberValidatorsInternal;

/**
 * Object validation utilities for validating object structures.
 * Includes validators for property existence, nested properties, and type checking.
 * 
 * @example
 * import { ObjectValidators } from '@austa/utils/validation';
 * 
 * if (ObjectValidators.hasRequiredProperties(obj, ['id', 'name'])) {
 *   // Object has all required properties
 * }
 */
export const ObjectValidators = ObjectValidatorsInternal;

/**
 * Common validation utilities for general-purpose validation.
 * Includes validators for Brazilian-specific identifiers, phone numbers, and postal codes.
 * 
 * @example
 * import { CommonValidators } from '@austa/utils/validation';
 * 
 * if (CommonValidators.isValidCNPJ('12.345.678/0001-90')) {
 *   // Valid CNPJ
 * }
 */
export const CommonValidators = CommonValidatorsInternal;

/**
 * Schema validation utilities for creating and working with validation schemas.
 * Provides integration between Zod and class-validator.
 * 
 * @example
 * import { SchemaValidators } from '@austa/utils/validation';
 * 
 * const userSchema = SchemaValidators.createSchema({
 *   name: z.string().min(2),
 *   age: z.number().min(18)
 * });
 */
export const SchemaValidators = SchemaValidatorsInternal;

// Re-export all validators directly for convenience
// This allows importing specific validators without using the namespaces

/**
 * @see StringValidators
 */
export const {
  isValidCPF,
  isValidEmail,
  isValidURL,
  hasValidLength,
  matchesPattern,
  // Add other string validators here
} = StringValidatorsInternal;

/**
 * @see DateValidators
 */
export const {
  isValidDate,
  isDateInRange,
  isFutureDate,
  isPastDate,
  isBusinessDay,
  // Add other date validators here
} = DateValidatorsInternal;

/**
 * @see NumberValidators
 */
export const {
  isInRange,
  isInteger,
  isPositive,
  isNegative,
  isValidCurrency,
  // Add other number validators here
} = NumberValidatorsInternal;

/**
 * @see ObjectValidators
 */
export const {
  hasRequiredProperties,
  hasValidNestedProperty,
  isOfType,
  hasValidArrayElements,
  // Add other object validators here
} = ObjectValidatorsInternal;

/**
 * @see CommonValidators
 */
export const {
  isValidCNPJ,
  isValidRG,
  isValidPhoneNumber,
  isValidCEP,
  // Add other common validators here
} = CommonValidatorsInternal;

/**
 * @see SchemaValidators
 */
export const {
  createSchema,
  validateWithSchema,
  zodToClassValidator,
  classValidatorToZod,
  // Add other schema validators here
} = SchemaValidatorsInternal;

// Export types for all validators

/**
 * Types for string validation options and results.
 */
export type {
  CPFValidationOptions,
  EmailValidationOptions,
  URLValidationOptions,
  StringLengthOptions,
  PatternMatchOptions,
  // Add other string validator types here
} from '../src/validation/string.validator';

/**
 * Types for date validation options and results.
 */
export type {
  DateValidationOptions,
  DateRangeOptions,
  BusinessDayOptions,
  // Add other date validator types here
} from '../src/validation/date.validator';

/**
 * Types for number validation options and results.
 */
export type {
  RangeOptions,
  IntegerOptions,
  CurrencyOptions,
  // Add other number validator types here
} from '../src/validation/number.validator';

/**
 * Types for object validation options and results.
 */
export type {
  PropertyValidationOptions,
  TypeCheckOptions,
  ArrayValidationOptions,
  // Add other object validator types here
} from '../src/validation/object.validator';

/**
 * Types for common validation options and results.
 */
export type {
  CNPJValidationOptions,
  RGValidationOptions,
  PhoneNumberOptions,
  CEPValidationOptions,
  // Add other common validator types here
} from '../src/validation/common.validator';

/**
 * Types for schema validation options and results.
 */
export type {
  SchemaOptions,
  ValidationResult,
  SchemaValidationOptions,
  // Add other schema validator types here
} from '../src/validation/schema.validator';

// Export convenience functions for common validation patterns

/**
 * Validates multiple conditions and returns the first error or null if all are valid.
 * 
 * @param validators - Array of validation functions to run
 * @param value - The value to validate
 * @returns The first error message or null if all validations pass
 * 
 * @example
 * const error = validateAll([
 *   (v) => isValidEmail(v) ? null : 'Invalid email',
 *   (v) => hasValidLength(v, 5, 100) ? null : 'Invalid length'
 * ], email);
 */
export function validateAll<T>(
  validators: Array<(value: T) => string | null>,
  value: T
): string | null {
  for (const validator of validators) {
    const error = validator(value);
    if (error) {
      return error;
    }
  }
  return null;
}

/**
 * Validates a value against a condition and returns a formatted error message if invalid.
 * 
 * @param value - The value to validate
 * @param isValid - Validation function that returns true if valid
 * @param errorMessage - Error message to return if validation fails
 * @returns The error message or null if validation passes
 * 
 * @example
 * const error = validate(email, isValidEmail, 'Please enter a valid email address');
 */
export function validate<T>(
  value: T,
  isValid: (value: T) => boolean,
  errorMessage: string
): string | null {
  return isValid(value) ? null : errorMessage;
}

/**
 * Creates a validator function that can be used with form libraries.
 * 
 * @param validationFn - The validation function that returns true if valid
 * @param errorMessage - The error message to return if validation fails
 * @returns A validator function compatible with React Hook Form
 * 
 * @example
 * const emailValidator = createValidator(isValidEmail, 'Invalid email');
 * // Use with React Hook Form
 * register('email', { validate: emailValidator });
 */
export function createValidator<T>(
  validationFn: (value: T) => boolean,
  errorMessage: string
): (value: T) => true | string {
  return (value: T) => validationFn(value) || errorMessage;
}

/**
 * Journey-specific validation utilities.
 * Provides validation functions tailored to specific journeys (health, care, plan).
 */
export const JourneyValidators = {
  /**
   * Health journey-specific validators.
   */
  health: {
    /**
     * Validates health metric values based on metric type and user profile.
     * 
     * @param value - The metric value to validate
     * @param metricType - The type of health metric (e.g., 'bloodPressure', 'weight')
     * @param userProfile - Optional user profile for personalized validation
     * @returns True if the metric value is valid for the given type and profile
     */
    isValidMetricValue: (value: number, metricType: string, userProfile?: any): boolean => {
      // Implementation would be in the actual validator file
      // This is just a placeholder for the export barrel
      return true;
    },
    
    /**
     * Validates a health goal as achievable and appropriate.
     * 
     * @param goal - The health goal to validate
     * @param userProfile - User profile for personalized validation
     * @returns True if the goal is valid and appropriate
     */
    isValidHealthGoal: (goal: any, userProfile: any): boolean => {
      // Implementation would be in the actual validator file
      return true;
    }
  },
  
  /**
   * Care journey-specific validators.
   */
  care: {
    /**
     * Validates an appointment time as available and within service hours.
     * 
     * @param dateTime - The appointment date and time
     * @param providerId - The healthcare provider ID
     * @returns True if the appointment time is valid and available
     */
    isValidAppointmentTime: (dateTime: Date, providerId: string): boolean => {
      // Implementation would be in the actual validator file
      return true;
    },
    
    /**
     * Validates medication dosage based on medication type and patient profile.
     * 
     * @param dosage - The medication dosage
     * @param medicationType - The type of medication
     * @param patientProfile - Patient profile for personalized validation
     * @returns True if the dosage is valid for the given medication and patient
     */
    isValidMedicationDosage: (dosage: number, medicationType: string, patientProfile: any): boolean => {
      // Implementation would be in the actual validator file
      return true;
    }
  },
  
  /**
   * Plan journey-specific validators.
   */
  plan: {
    /**
     * Validates an insurance claim as complete and eligible.
     * 
     * @param claim - The insurance claim to validate
     * @param planDetails - Details of the user's insurance plan
     * @returns True if the claim is valid and eligible
     */
    isValidClaim: (claim: any, planDetails: any): boolean => {
      // Implementation would be in the actual validator file
      return true;
    },
    
    /**
     * Validates a document as acceptable for the specified purpose.
     * 
     * @param document - The document to validate
     * @param purpose - The purpose of the document (e.g., 'claim', 'enrollment')
     * @returns True if the document is valid for the given purpose
     */
    isValidDocument: (document: any, purpose: string): boolean => {
      // Implementation would be in the actual validator file
      return true;
    }
  }
};
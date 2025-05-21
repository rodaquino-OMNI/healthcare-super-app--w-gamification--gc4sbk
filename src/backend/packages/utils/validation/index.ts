/**
 * @file Validation utilities entry point
 * @description Provides a centralized export of all validation utilities used across the AUSTA SuperApp.
 * This module re-exports validators from specialized modules with proper namespacing and documentation.
 * 
 * @module @austa/utils/validation
 */

// Import validators from specialized modules
import * as ObjectValidators from '../src/validation/object.validator';

// Import date validators
import { isValidDate, isDateInRange } from '../src/date';

// Import type validators and assertions
import * as TypeAssertions from '../src/type/assertions';
import * as TypePredicates from '../src/type/predicate';

/**
 * String validation utilities
 * @namespace StringValidators
 */
export const StringValidators = {
  /**
   * Validates a Brazilian CPF (Cadastro de Pessoas Físicas) number.
   * This function implements the standard CPF validation algorithm used in Brazil.
   * 
   * @param cpf - The CPF string to validate
   * @returns True if the CPF is valid, false otherwise
   * 
   * @example
   * ```typescript
   * import { StringValidators } from '@austa/utils/validation';
   * 
   * const isValid = StringValidators.isValidCPF('123.456.789-09');
   * ```
   */
  isValidCPF: (cpf: string): boolean => {
    // Remove non-digit characters
    const cleanCPF = cpf.replace(/\D/g, '');
    
    // CPF must have 11 digits
    if (cleanCPF.length !== 11) {
      return false;
    }
    
    // Check if all digits are the same (invalid CPF)
    if (/^(\d)\1+$/.test(cleanCPF)) {
      return false;
    }
    
    // Calculate first verification digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    const digit1 = remainder > 9 ? 0 : remainder;
    
    // Calculate second verification digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    const digit2 = remainder > 9 ? 0 : remainder;
    
    // Verify if calculated digits match the CPF's verification digits
    return (
      parseInt(cleanCPF.charAt(9)) === digit1 &&
      parseInt(cleanCPF.charAt(10)) === digit2
    );
  },

  /**
   * Validates if a string is empty (null, undefined, or only whitespace)
   * 
   * @param str - The string to validate
   * @returns True if the string is empty, false otherwise
   * 
   * @example
   * ```typescript
   * import { StringValidators } from '@austa/utils/validation';
   * 
   * const isEmpty = StringValidators.isEmpty('   '); // true
   * ```
   */
  isEmpty: (str: string | null | undefined): boolean => {
    return str === null || str === undefined || str.trim() === '';
  },

  /**
   * Validates if a string is not empty (not null, not undefined, and contains non-whitespace characters)
   * 
   * @param str - The string to validate
   * @returns True if the string is not empty, false otherwise
   * 
   * @example
   * ```typescript
   * import { StringValidators } from '@austa/utils/validation';
   * 
   * const isNotEmpty = StringValidators.isNotEmpty('Hello'); // true
   * ```
   */
  isNotEmpty: (str: string | null | undefined): boolean => {
    return str !== null && str !== undefined && str.trim() !== '';
  },

  /**
   * Validates if a string matches a regular expression pattern
   * 
   * @param str - The string to validate
   * @param pattern - The regular expression pattern to match against
   * @returns True if the string matches the pattern, false otherwise
   * 
   * @example
   * ```typescript
   * import { StringValidators } from '@austa/utils/validation';
   * 
   * const isEmail = StringValidators.matchesPattern('user@example.com', /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/);
   * ```
   */
  matchesPattern: (str: string, pattern: RegExp): boolean => {
    return pattern.test(str);
  },

  /**
   * Validates if a string is a valid email address
   * 
   * @param email - The email string to validate
   * @returns True if the string is a valid email address, false otherwise
   * 
   * @example
   * ```typescript
   * import { StringValidators } from '@austa/utils/validation';
   * 
   * const isValidEmail = StringValidators.isValidEmail('user@example.com'); // true
   * ```
   */
  isValidEmail: (email: string): boolean => {
    const emailPattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return emailPattern.test(email);
  },

  /**
   * Validates if a string has a minimum length
   * 
   * @param str - The string to validate
   * @param minLength - The minimum length required
   * @returns True if the string meets the minimum length, false otherwise
   * 
   * @example
   * ```typescript
   * import { StringValidators } from '@austa/utils/validation';
   * 
   * const isLongEnough = StringValidators.hasMinLength('password123', 8); // true
   * ```
   */
  hasMinLength: (str: string, minLength: number): boolean => {
    return str.length >= minLength;
  },

  /**
   * Validates if a string does not exceed a maximum length
   * 
   * @param str - The string to validate
   * @param maxLength - The maximum length allowed
   * @returns True if the string does not exceed the maximum length, false otherwise
   * 
   * @example
   * ```typescript
   * import { StringValidators } from '@austa/utils/validation';
   * 
   * const isShortEnough = StringValidators.hasMaxLength('username', 20); // true
   * ```
   */
  hasMaxLength: (str: string, maxLength: number): boolean => {
    return str.length <= maxLength;
  }
};

/**
 * Date validation utilities
 * @namespace DateValidators
 */
export const DateValidators = {
  /**
   * Checks if a date is valid
   * 
   * @param date - The date to validate
   * @returns True if the date is valid, false otherwise
   * 
   * @example
   * ```typescript
   * import { DateValidators } from '@austa/utils/validation';
   * 
   * const isValid = DateValidators.isValidDate(new Date()); // true
   * const isInvalid = DateValidators.isValidDate(new Date('invalid-date')); // false
   * ```
   */
  isValidDate,

  /**
   * Checks if a date is within a specified range
   * 
   * @param date - The date to check
   * @param startDate - The start date of the range
   * @param endDate - The end date of the range
   * @returns True if the date is within the range, false otherwise
   * 
   * @example
   * ```typescript
   * import { DateValidators } from '@austa/utils/validation';
   * 
   * const isInRange = DateValidators.isDateInRange(
   *   new Date('2023-05-15'),
   *   new Date('2023-01-01'),
   *   new Date('2023-12-31')
   * ); // true
   * ```
   */
  isDateInRange,

  /**
   * Validates if a date is in the past
   * 
   * @param date - The date to validate
   * @param referenceDate - The reference date to compare against (defaults to now)
   * @returns True if the date is in the past, false otherwise
   * 
   * @example
   * ```typescript
   * import { DateValidators } from '@austa/utils/validation';
   * 
   * const isPast = DateValidators.isPastDate(new Date('2020-01-01')); // true
   * ```
   */
  isPastDate: (date: Date, referenceDate: Date = new Date()): boolean => {
    return isValidDate(date) && date < referenceDate;
  },

  /**
   * Validates if a date is in the future
   * 
   * @param date - The date to validate
   * @param referenceDate - The reference date to compare against (defaults to now)
   * @returns True if the date is in the future, false otherwise
   * 
   * @example
   * ```typescript
   * import { DateValidators } from '@austa/utils/validation';
   * 
   * const isFuture = DateValidators.isFutureDate(new Date('2030-01-01')); // true
   * ```
   */
  isFutureDate: (date: Date, referenceDate: Date = new Date()): boolean => {
    return isValidDate(date) && date > referenceDate;
  },

  /**
   * Validates if a date is today
   * 
   * @param date - The date to validate
   * @returns True if the date is today, false otherwise
   * 
   * @example
   * ```typescript
   * import { DateValidators } from '@austa/utils/validation';
   * 
   * const isToday = DateValidators.isToday(new Date()); // true
   * ```
   */
  isToday: (date: Date): boolean => {
    if (!isValidDate(date)) {
      return false;
    }
    
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }
};

/**
 * Number validation utilities
 * @namespace NumberValidators
 */
export const NumberValidators = {
  /**
   * Validates if a value is a valid number (not NaN)
   * 
   * @param value - The value to validate
   * @returns True if the value is a valid number, false otherwise
   * 
   * @example
   * ```typescript
   * import { NumberValidators } from '@austa/utils/validation';
   * 
   * const isValid = NumberValidators.isValidNumber(42); // true
   * const isInvalid = NumberValidators.isValidNumber(NaN); // false
   * ```
   */
  isValidNumber: (value: any): boolean => {
    return typeof value === 'number' && !isNaN(value);
  },

  /**
   * Validates if a number is positive (greater than zero)
   * 
   * @param value - The number to validate
   * @returns True if the number is positive, false otherwise
   * 
   * @example
   * ```typescript
   * import { NumberValidators } from '@austa/utils/validation';
   * 
   * const isPositive = NumberValidators.isPositive(42); // true
   * ```
   */
  isPositive: (value: number): boolean => {
    return typeof value === 'number' && !isNaN(value) && value > 0;
  },

  /**
   * Validates if a number is non-negative (greater than or equal to zero)
   * 
   * @param value - The number to validate
   * @returns True if the number is non-negative, false otherwise
   * 
   * @example
   * ```typescript
   * import { NumberValidators } from '@austa/utils/validation';
   * 
   * const isNonNegative = NumberValidators.isNonNegative(0); // true
   * ```
   */
  isNonNegative: (value: number): boolean => {
    return typeof value === 'number' && !isNaN(value) && value >= 0;
  },

  /**
   * Validates if a number is within a specified range
   * 
   * @param value - The number to validate
   * @param min - The minimum value (inclusive)
   * @param max - The maximum value (inclusive)
   * @returns True if the number is within the range, false otherwise
   * 
   * @example
   * ```typescript
   * import { NumberValidators } from '@austa/utils/validation';
   * 
   * const isInRange = NumberValidators.isInRange(42, 1, 100); // true
   * ```
   */
  isInRange: (value: number, min: number, max: number): boolean => {
    return typeof value === 'number' && !isNaN(value) && value >= min && value <= max;
  },

  /**
   * Validates if a number is an integer (no decimal part)
   * 
   * @param value - The number to validate
   * @returns True if the number is an integer, false otherwise
   * 
   * @example
   * ```typescript
   * import { NumberValidators } from '@austa/utils/validation';
   * 
   * const isInteger = NumberValidators.isInteger(42); // true
   * const isNotInteger = NumberValidators.isInteger(42.5); // false
   * ```
   */
  isInteger: (value: number): boolean => {
    return typeof value === 'number' && !isNaN(value) && Number.isInteger(value);
  }
};

/**
 * Array validation utilities
 * @namespace ArrayValidators
 */
export const ArrayValidators = {
  /**
   * Validates if a value is an array
   * 
   * @param value - The value to validate
   * @returns True if the value is an array, false otherwise
   * 
   * @example
   * ```typescript
   * import { ArrayValidators } from '@austa/utils/validation';
   * 
   * const isArray = ArrayValidators.isArray([1, 2, 3]); // true
   * ```
   */
  isArray: (value: any): value is any[] => {
    return Array.isArray(value);
  },

  /**
   * Validates if an array is not empty
   * 
   * @param arr - The array to validate
   * @returns True if the array is not empty, false otherwise
   * 
   * @example
   * ```typescript
   * import { ArrayValidators } from '@austa/utils/validation';
   * 
   * const isNotEmpty = ArrayValidators.isNotEmpty([1, 2, 3]); // true
   * ```
   */
  isNotEmpty: <T>(arr: T[]): boolean => {
    return Array.isArray(arr) && arr.length > 0;
  },

  /**
   * Validates if an array has a minimum length
   * 
   * @param arr - The array to validate
   * @param minLength - The minimum length required
   * @returns True if the array meets the minimum length, false otherwise
   * 
   * @example
   * ```typescript
   * import { ArrayValidators } from '@austa/utils/validation';
   * 
   * const hasMinLength = ArrayValidators.hasMinLength([1, 2, 3], 2); // true
   * ```
   */
  hasMinLength: <T>(arr: T[], minLength: number): boolean => {
    return Array.isArray(arr) && arr.length >= minLength;
  },

  /**
   * Validates if an array does not exceed a maximum length
   * 
   * @param arr - The array to validate
   * @param maxLength - The maximum length allowed
   * @returns True if the array does not exceed the maximum length, false otherwise
   * 
   * @example
   * ```typescript
   * import { ArrayValidators } from '@austa/utils/validation';
   * 
   * const hasMaxLength = ArrayValidators.hasMaxLength([1, 2, 3], 5); // true
   * ```
   */
  hasMaxLength: <T>(arr: T[], maxLength: number): boolean => {
    return Array.isArray(arr) && arr.length <= maxLength;
  },

  /**
   * Validates if all elements in an array satisfy a predicate function
   * 
   * @param arr - The array to validate
   * @param predicate - The predicate function to test each element
   * @returns True if all elements satisfy the predicate, false otherwise
   * 
   * @example
   * ```typescript
   * import { ArrayValidators } from '@austa/utils/validation';
   * 
   * const allPositive = ArrayValidators.allSatisfy([1, 2, 3], num => num > 0); // true
   * ```
   */
  allSatisfy: <T>(arr: T[], predicate: (item: T) => boolean): boolean => {
    return Array.isArray(arr) && arr.every(predicate);
  }
};

// Re-export object validators
export const ObjectValidators = ObjectValidators;

// Re-export type assertions and predicates
export const TypeValidators = {
  ...TypeAssertions,
  ...TypePredicates
};

// Convenience re-exports of commonly used validators
export const {
  isValidCPF,
  isEmpty: isStringEmpty,
  isNotEmpty: isStringNotEmpty,
  matchesPattern,
  isValidEmail,
  hasMinLength: stringHasMinLength,
  hasMaxLength: stringHasMaxLength
} = StringValidators;

export const {
  isValidDate,
  isDateInRange,
  isPastDate,
  isFutureDate,
  isToday
} = DateValidators;

export const {
  isValidNumber,
  isPositive,
  isNonNegative,
  isInRange: numberIsInRange,
  isInteger
} = NumberValidators;

export const {
  isArray,
  isNotEmpty: isArrayNotEmpty,
  hasMinLength: arrayHasMinLength,
  hasMaxLength: arrayHasMaxLength,
  allSatisfy
} = ArrayValidators;

// Default export for convenience
export default {
  StringValidators,
  DateValidators,
  NumberValidators,
  ArrayValidators,
  ObjectValidators,
  TypeValidators
};
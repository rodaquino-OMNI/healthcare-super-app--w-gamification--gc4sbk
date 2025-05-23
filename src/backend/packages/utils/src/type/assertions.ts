/**
 * @file assertions.ts
 * @description Type assertion utilities for runtime type checking
 * 
 * This file provides utility functions for enforcing type constraints at runtime
 * by throwing descriptive errors when values don't match expected types.
 * These assertion functions help detect type errors early in the execution flow
 * rather than allowing invalid data to propagate through the system.
 */

import { 
  InvalidParameterError, 
  MissingParameterError,
  InvalidEnumValueError,
  InvalidNumericValueError,
  InvalidDateError,
  InvalidFormatError
} from '@austa/errors/categories/validation.errors';
import { JourneyType } from '@austa/errors/base';

/**
 * Asserts that a value is defined (not null or undefined).
 * 
 * @param value - The value to check
 * @param paramName - Name of the parameter for error reporting
 * @param message - Optional custom error message
 * @param journeyType - Optional journey context for error reporting
 * @throws {MissingParameterError} If the value is null or undefined
 */
export function assertDefined<T>(
  value: T | null | undefined,
  paramName: string,
  message?: string,
  journeyType?: JourneyType
): asserts value is T {
  if (value === null || value === undefined) {
    throw new MissingParameterError(paramName, journeyType);
  }
}

/**
 * Asserts that a value is of a specific type.
 * 
 * @param value - The value to check
 * @param expectedType - Expected type name ('string', 'number', 'boolean', 'object', 'function')
 * @param paramName - Name of the parameter for error reporting
 * @param message - Optional custom error message
 * @param journeyType - Optional journey context for error reporting
 * @throws {InvalidParameterError} If the value is not of the expected type
 */
export function assertType(
  value: any,
  expectedType: 'string' | 'number' | 'boolean' | 'object' | 'function' | 'symbol' | 'bigint' | 'undefined',
  paramName: string,
  message?: string,
  journeyType?: JourneyType
): void {
  if (typeof value !== expectedType) {
    const actualType = typeof value;
    const reason = message || `Expected type '${expectedType}' but received '${actualType}'`;
    throw new InvalidParameterError(paramName, reason, journeyType, {
      expected: expectedType,
      actual: actualType
    });
  }
}

/**
 * Asserts that a value is a string.
 * 
 * @param value - The value to check
 * @param paramName - Name of the parameter for error reporting
 * @param message - Optional custom error message
 * @param journeyType - Optional journey context for error reporting
 * @throws {InvalidParameterError} If the value is not a string
 */
export function assertString(
  value: any,
  paramName: string,
  message?: string,
  journeyType?: JourneyType
): asserts value is string {
  assertType(value, 'string', paramName, message, journeyType);
}

/**
 * Asserts that a value is a non-empty string.
 * 
 * @param value - The value to check
 * @param paramName - Name of the parameter for error reporting
 * @param message - Optional custom error message
 * @param journeyType - Optional journey context for error reporting
 * @throws {InvalidParameterError} If the value is not a string or is an empty string
 */
export function assertNonEmptyString(
  value: any,
  paramName: string,
  message?: string,
  journeyType?: JourneyType
): asserts value is string {
  assertString(value, paramName, message, journeyType);
  if (value.trim() === '') {
    const reason = message || 'String cannot be empty';
    throw new InvalidParameterError(paramName, reason, journeyType);
  }
}

/**
 * Asserts that a value is a number.
 * 
 * @param value - The value to check
 * @param paramName - Name of the parameter for error reporting
 * @param message - Optional custom error message
 * @param journeyType - Optional journey context for error reporting
 * @throws {InvalidParameterError} If the value is not a number
 */
export function assertNumber(
  value: any,
  paramName: string,
  message?: string,
  journeyType?: JourneyType
): asserts value is number {
  assertType(value, 'number', paramName, message, journeyType);
  if (Number.isNaN(value)) {
    const reason = message || 'Value cannot be NaN';
    throw new InvalidNumericValueError(paramName, reason, journeyType);
  }
}

/**
 * Asserts that a value is a finite number.
 * 
 * @param value - The value to check
 * @param paramName - Name of the parameter for error reporting
 * @param message - Optional custom error message
 * @param journeyType - Optional journey context for error reporting
 * @throws {InvalidParameterError} If the value is not a finite number
 */
export function assertFiniteNumber(
  value: any,
  paramName: string,
  message?: string,
  journeyType?: JourneyType
): asserts value is number {
  assertNumber(value, paramName, message, journeyType);
  if (!Number.isFinite(value)) {
    const reason = message || 'Value must be a finite number';
    throw new InvalidNumericValueError(paramName, reason, journeyType);
  }
}

/**
 * Asserts that a number is within a specified range.
 * 
 * @param value - The value to check
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (inclusive)
 * @param paramName - Name of the parameter for error reporting
 * @param message - Optional custom error message
 * @param journeyType - Optional journey context for error reporting
 * @throws {InvalidParameterError} If the value is not within the specified range
 */
export function assertNumberInRange(
  value: number,
  min: number,
  max: number,
  paramName: string,
  message?: string,
  journeyType?: JourneyType
): void {
  assertNumber(value, paramName, message, journeyType);
  if (value < min || value > max) {
    const reason = message || `Value must be between ${min} and ${max}`;
    throw new InvalidNumericValueError(paramName, reason, journeyType, {
      min,
      max,
      actual: value
    });
  }
}

/**
 * Asserts that a value is a boolean.
 * 
 * @param value - The value to check
 * @param paramName - Name of the parameter for error reporting
 * @param message - Optional custom error message
 * @param journeyType - Optional journey context for error reporting
 * @throws {InvalidParameterError} If the value is not a boolean
 */
export function assertBoolean(
  value: any,
  paramName: string,
  message?: string,
  journeyType?: JourneyType
): asserts value is boolean {
  assertType(value, 'boolean', paramName, message, journeyType);
}

/**
 * Asserts that a value is a Date object.
 * 
 * @param value - The value to check
 * @param paramName - Name of the parameter for error reporting
 * @param message - Optional custom error message
 * @param journeyType - Optional journey context for error reporting
 * @throws {InvalidParameterError} If the value is not a Date object or is an invalid date
 */
export function assertDate(
  value: any,
  paramName: string,
  message?: string,
  journeyType?: JourneyType
): asserts value is Date {
  if (!(value instanceof Date)) {
    const reason = message || 'Value must be a Date object';
    throw new InvalidDateError(paramName, reason, journeyType, {
      expected: 'Date',
      actual: typeof value
    });
  }
  
  if (isNaN(value.getTime())) {
    const reason = message || 'Date is invalid';
    throw new InvalidDateError(paramName, reason, journeyType);
  }
}

/**
 * Asserts that a value is an array.
 * 
 * @param value - The value to check
 * @param paramName - Name of the parameter for error reporting
 * @param message - Optional custom error message
 * @param journeyType - Optional journey context for error reporting
 * @throws {InvalidParameterError} If the value is not an array
 */
export function assertArray(
  value: any,
  paramName: string,
  message?: string,
  journeyType?: JourneyType
): asserts value is any[] {
  if (!Array.isArray(value)) {
    const reason = message || 'Value must be an array';
    throw new InvalidParameterError(paramName, reason, journeyType, {
      expected: 'array',
      actual: typeof value
    });
  }
}

/**
 * Asserts that an array has a specific length.
 * 
 * @param array - The array to check
 * @param length - Expected length of the array
 * @param paramName - Name of the parameter for error reporting
 * @param message - Optional custom error message
 * @param journeyType - Optional journey context for error reporting
 * @throws {InvalidParameterError} If the array does not have the expected length
 */
export function assertArrayLength<T>(
  array: T[],
  length: number,
  paramName: string,
  message?: string,
  journeyType?: JourneyType
): void {
  assertArray(array, paramName, message, journeyType);
  if (array.length !== length) {
    const reason = message || `Array must have exactly ${length} elements`;
    throw new InvalidParameterError(paramName, reason, journeyType, {
      expectedLength: length,
      actualLength: array.length
    });
  }
}

/**
 * Asserts that an array is not empty.
 * 
 * @param array - The array to check
 * @param paramName - Name of the parameter for error reporting
 * @param message - Optional custom error message
 * @param journeyType - Optional journey context for error reporting
 * @throws {InvalidParameterError} If the array is empty
 */
export function assertNonEmptyArray<T>(
  array: T[],
  paramName: string,
  message?: string,
  journeyType?: JourneyType
): void {
  assertArray(array, paramName, message, journeyType);
  if (array.length === 0) {
    const reason = message || 'Array cannot be empty';
    throw new InvalidParameterError(paramName, reason, journeyType);
  }
}

/**
 * Asserts that a value is an object (not null, not an array).
 * 
 * @param value - The value to check
 * @param paramName - Name of the parameter for error reporting
 * @param message - Optional custom error message
 * @param journeyType - Optional journey context for error reporting
 * @throws {InvalidParameterError} If the value is not an object
 */
export function assertObject(
  value: any,
  paramName: string,
  message?: string,
  journeyType?: JourneyType
): asserts value is Record<string, any> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    const reason = message || 'Value must be an object';
    throw new InvalidParameterError(paramName, reason, journeyType, {
      expected: 'object',
      actual: Array.isArray(value) ? 'array' : typeof value
    });
  }
}

/**
 * Asserts that an object has a specific property.
 * 
 * @param obj - The object to check
 * @param prop - The property name to check for
 * @param paramName - Name of the parameter for error reporting
 * @param message - Optional custom error message
 * @param journeyType - Optional journey context for error reporting
 * @throws {InvalidParameterError} If the object does not have the specified property
 */
export function assertObjectHasProperty<T extends Record<string, any>, K extends string>(
  obj: T,
  prop: K,
  paramName: string,
  message?: string,
  journeyType?: JourneyType
): asserts obj is T & Record<K, any> {
  assertObject(obj, paramName, message, journeyType);
  if (!(prop in obj)) {
    const reason = message || `Object must have property '${prop}'`;
    throw new InvalidParameterError(paramName, reason, journeyType, {
      missingProperty: prop
    });
  }
}

/**
 * Asserts that a value is a valid enum value.
 * 
 * @param value - The value to check
 * @param enumObject - The enum object to check against
 * @param paramName - Name of the parameter for error reporting
 * @param message - Optional custom error message
 * @param journeyType - Optional journey context for error reporting
 * @throws {InvalidEnumValueError} If the value is not a valid enum value
 */
export function assertEnum<T extends Record<string, string | number>>(
  value: any,
  enumObject: T,
  paramName: string,
  message?: string,
  journeyType?: JourneyType
): asserts value is T[keyof T] {
  const enumValues = Object.values(enumObject);
  if (!enumValues.includes(value)) {
    throw new InvalidEnumValueError(
      paramName,
      enumValues.map(String),
      String(value),
      journeyType
    );
  }
}

/**
 * Asserts that a value matches a regular expression pattern.
 * 
 * @param value - The value to check
 * @param pattern - Regular expression pattern to match against
 * @param paramName - Name of the parameter for error reporting
 * @param formatName - Name of the expected format (e.g., 'email', 'URL')
 * @param message - Optional custom error message
 * @param journeyType - Optional journey context for error reporting
 * @throws {InvalidFormatError} If the value does not match the pattern
 */
export function assertPattern(
  value: string,
  pattern: RegExp,
  paramName: string,
  formatName: string,
  message?: string,
  journeyType?: JourneyType
): void {
  assertString(value, paramName, message, journeyType);
  if (!pattern.test(value)) {
    throw new InvalidFormatError(paramName, formatName, journeyType, {
      pattern: pattern.toString(),
      value
    });
  }
}

/**
 * Asserts that a value is a valid email address.
 * 
 * @param value - The value to check
 * @param paramName - Name of the parameter for error reporting
 * @param message - Optional custom error message
 * @param journeyType - Optional journey context for error reporting
 * @throws {InvalidFormatError} If the value is not a valid email address
 */
export function assertEmail(
  value: string,
  paramName: string,
  message?: string,
  journeyType?: JourneyType
): void {
  // RFC 5322 compliant email regex
  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  assertPattern(value, emailPattern, paramName, 'email', message, journeyType);
}

/**
 * Asserts that a value is a valid URL.
 * 
 * @param value - The value to check
 * @param paramName - Name of the parameter for error reporting
 * @param message - Optional custom error message
 * @param journeyType - Optional journey context for error reporting
 * @throws {InvalidFormatError} If the value is not a valid URL
 */
export function assertUrl(
  value: string,
  paramName: string,
  message?: string,
  journeyType?: JourneyType
): void {
  assertString(value, paramName, message, journeyType);
  try {
    new URL(value);
  } catch (error) {
    throw new InvalidFormatError(paramName, 'URL', journeyType, {
      value
    });
  }
}

/**
 * Asserts that a condition is true.
 * 
 * @param condition - The condition to check
 * @param paramName - Name of the parameter for error reporting
 * @param message - Error message to use if the condition is false
 * @param journeyType - Optional journey context for error reporting
 * @throws {InvalidParameterError} If the condition is false
 */
export function assertCondition(
  condition: boolean,
  paramName: string,
  message: string,
  journeyType?: JourneyType
): void {
  if (!condition) {
    throw new InvalidParameterError(paramName, message, journeyType);
  }
}

/**
 * Utility function for exhaustive switch statement checking.
 * Used to ensure all cases in a switch statement are handled.
 * 
 * @param value - The value that should never be reached
 * @throws {Error} Always throws an error if called
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled discriminated union member: ${JSON.stringify(value)}`);
}

/**
 * Asserts that a value is one of the allowed values.
 * 
 * @param value - The value to check
 * @param allowedValues - Array of allowed values
 * @param paramName - Name of the parameter for error reporting
 * @param message - Optional custom error message
 * @param journeyType - Optional journey context for error reporting
 * @throws {InvalidParameterError} If the value is not one of the allowed values
 */
export function assertOneOf<T>(
  value: any,
  allowedValues: T[],
  paramName: string,
  message?: string,
  journeyType?: JourneyType
): asserts value is T {
  if (!allowedValues.includes(value)) {
    const reason = message || `Value must be one of: [${allowedValues.join(', ')}]`;
    throw new InvalidParameterError(paramName, reason, journeyType, {
      allowedValues,
      actual: value
    });
  }
}

/**
 * Asserts that a value is an instance of a specific class.
 * 
 * @param value - The value to check
 * @param constructor - The constructor function to check against
 * @param paramName - Name of the parameter for error reporting
 * @param message - Optional custom error message
 * @param journeyType - Optional journey context for error reporting
 * @throws {InvalidParameterError} If the value is not an instance of the specified class
 */
export function assertInstanceOf<T>(
  value: any,
  constructor: new (...args: any[]) => T,
  paramName: string,
  message?: string,
  journeyType?: JourneyType
): asserts value is T {
  if (!(value instanceof constructor)) {
    const expectedType = constructor.name;
    const actualType = value === null ? 'null' : value === undefined ? 'undefined' : value.constructor?.name || typeof value;
    const reason = message || `Expected instance of ${expectedType} but received ${actualType}`;
    throw new InvalidParameterError(paramName, reason, journeyType, {
      expected: expectedType,
      actual: actualType
    });
  }
}
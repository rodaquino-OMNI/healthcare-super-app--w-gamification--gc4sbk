/**
 * Type guard utility functions for runtime type checking.
 * These guards improve type safety by allowing consistent type checking across the codebase,
 * especially for values from external sources like API calls or user inputs.
 * 
 * These utilities are used across all journey services (Health, Care, Plan) to ensure
 * consistent type validation and error handling when processing data from external sources.
 */

/**
 * Checks if a value is a string.
 * 
 * @param value - The value to check
 * @returns True if the value is a string, false otherwise
 */
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

/**
 * Checks if a value is a number.
 * 
 * @param value - The value to check
 * @returns True if the value is a number and not NaN, false otherwise
 */
export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

/**
 * Checks if a value is a boolean.
 * 
 * @param value - The value to check
 * @returns True if the value is a boolean, false otherwise
 */
export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

/**
 * Checks if a value is undefined.
 * 
 * @param value - The value to check
 * @returns True if the value is undefined, false otherwise
 */
export const isUndefined = (value: unknown): value is undefined => {
  return typeof value === 'undefined';
};

/**
 * Checks if a value is null.
 * 
 * @param value - The value to check
 * @returns True if the value is null, false otherwise
 */
export const isNull = (value: unknown): value is null => {
  return value === null;
};

/**
 * Checks if a value is null or undefined.
 * 
 * @param value - The value to check
 * @returns True if the value is null or undefined, false otherwise
 */
export const isNullOrUndefined = (value: unknown): value is null | undefined => {
  return isNull(value) || isUndefined(value);
};

/**
 * Checks if a value is an array.
 * 
 * @param value - The value to check
 * @returns True if the value is an array, false otherwise
 */
export const isArray = <T = unknown>(value: unknown): value is Array<T> => {
  return Array.isArray(value);
};

/**
 * Checks if a value is an object (excluding arrays and null).
 * Provides more robust object type checking that properly excludes arrays and null values.
 * 
 * @param value - The value to check
 * @returns True if the value is an object (not null and not an array), false otherwise
 */
export const isObject = <T = Record<string, unknown>>(value: unknown): value is T => {
  return (
    typeof value === 'object' && 
    value !== null && 
    !Array.isArray(value)
  );
};

/**
 * Checks if a value is a function.
 * 
 * @param value - The value to check
 * @returns True if the value is a function, false otherwise
 */
export const isFunction = (value: unknown): value is Function => {
  return typeof value === 'function';
};

/**
 * Checks if a value is a Date object.
 * 
 * @param value - The value to check
 * @returns True if the value is a valid Date object, false otherwise
 */
export const isDate = (value: unknown): value is Date => {
  return value instanceof Date && !isNaN(value.getTime());
};

/**
 * Checks if a value is a Promise.
 * Added for better async operation handling across journey services.
 * 
 * @param value - The value to check
 * @returns True if the value is a Promise, false otherwise
 */
export const isPromise = <T = unknown>(value: unknown): value is Promise<T> => {
  return (
    value !== null &&
    typeof value === 'object' &&
    'then' in value &&
    isFunction(value.then)
  );
};

/**
 * Checks if a value is empty (empty string, empty array, empty object, null, or undefined).
 * Provides improved empty value detection with proper null/undefined handling.
 * 
 * @param value - The value to check
 * @returns True if the value is empty, false otherwise
 */
export const isEmpty = (value: unknown): boolean => {
  if (isNullOrUndefined(value)) {
    return true;
  }
  
  if (isString(value)) {
    return value.trim().length === 0;
  }
  
  if (isArray(value)) {
    return value.length === 0;
  }
  
  if (isObject(value)) {
    return Object.keys(value).length === 0;
  }
  
  return false;
};

/**
 * Checks if a value is not empty (not empty string, not empty array, not empty object, not null, not undefined).
 * 
 * @param value - The value to check
 * @returns True if the value is not empty, false otherwise
 */
export const isNotEmpty = (value: unknown): boolean => {
  return !isEmpty(value);
};

/**
 * Checks if a value is a plain object (created by object literal or Object.create(null)).
 * 
 * @param value - The value to check
 * @returns True if the value is a plain object, false otherwise
 */
export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!isObject(value)) {
    return false;
  }
  
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
};

/**
 * Checks if a value is a valid number or a string that can be converted to a number.
 * 
 * @param value - The value to check
 * @returns True if the value is a number or can be converted to a number, false otherwise
 */
export const isNumeric = (value: unknown): boolean => {
  if (isNumber(value)) {
    return true;
  }
  
  if (isString(value)) {
    return !isNaN(Number(value)) && !isNaN(parseFloat(value));
  }
  
  return false;
};

/**
 * Checks if a value is an integer (a number with no decimal part).
 * 
 * @param value - The value to check
 * @returns True if the value is an integer, false otherwise
 */
export const isInteger = (value: unknown): value is number => {
  return isNumber(value) && Number.isInteger(value);
};

/**
 * Checks if a value is a positive number (greater than zero).
 * 
 * @param value - The value to check
 * @returns True if the value is a positive number, false otherwise
 */
export const isPositive = (value: unknown): value is number => {
  return isNumber(value) && value > 0;
};

/**
 * Checks if a value is a negative number (less than zero).
 * 
 * @param value - The value to check
 * @returns True if the value is a negative number, false otherwise
 */
export const isNegative = (value: unknown): value is number => {
  return isNumber(value) && value < 0;
};

/**
 * Checks if a value is a non-empty array.
 * 
 * @param value - The value to check
 * @returns True if the value is a non-empty array, false otherwise
 */
export const isNonEmptyArray = <T = unknown>(value: unknown): value is Array<T> => {
  return isArray<T>(value) && value.length > 0;
};

/**
 * Checks if a value is a non-empty string.
 * 
 * @param value - The value to check
 * @returns True if the value is a non-empty string, false otherwise
 */
export const isNonEmptyString = (value: unknown): value is string => {
  return isString(value) && value.trim().length > 0;
};

/**
 * Checks if a value is a valid email address format.
 * 
 * @param value - The value to check
 * @returns True if the value is a valid email address format, false otherwise
 */
export const isEmail = (value: unknown): value is string => {
  if (!isString(value)) {
    return false;
  }
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

/**
 * Checks if a value is a valid URL format.
 * 
 * @param value - The value to check
 * @returns True if the value is a valid URL format, false otherwise
 */
export const isUrl = (value: unknown): value is string => {
  if (!isString(value)) {
    return false;
  }
  
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * Type guard for checking if a value is of a specific primitive type.
 * Part of the standardized type guard functions for consistent type checking across all journey services.
 * 
 * @param value - The value to check
 * @param type - The expected type ('string', 'number', 'boolean', etc.)
 * @returns True if the value is of the specified type, false otherwise
 */
export const isPrimitiveType = (
  value: unknown,
  type: 'string' | 'number' | 'boolean' | 'undefined' | 'symbol' | 'bigint' | 'function' | 'object'
): boolean => {
  return typeof value === type;
};

/**
 * Checks if all items in an array satisfy a predicate function.
 * Useful for validating arrays of specific types in journey services.
 * 
 * @param value - The array to check
 * @param predicate - The function to test each item against
 * @returns True if all items satisfy the predicate, false otherwise
 * 
 * @example
 * // Check if all items are strings
 * const allStrings = isArrayOf(value, isString);
 * 
 * // Check if all items are valid health metrics
 * const allMetrics = isArrayOf(value, isHealthMetric);
 */
export const isArrayOf = <T>(
  value: unknown,
  predicate: (item: unknown) => item is T
): value is T[] => {
  return isArray(value) && value.every(predicate);
};

/**
 * Checks if a value is a Record with string keys and values of a specific type.
 * Essential for validating configuration objects and API responses in journey services.
 * 
 * @param value - The value to check
 * @param predicate - The function to test each value against
 * @returns True if the value is a Record with values that satisfy the predicate, false otherwise
 * 
 * @example
 * // Check if all values are numbers
 * const allNumbers = isRecordOf(config, isNumber);
 * 
 * // Check if all values are valid journey settings
 * const validSettings = isRecordOf(settings, isJourneySetting);
 */
export const isRecordOf = <T>(
  value: unknown,
  predicate: (item: unknown) => item is T
): value is Record<string, T> => {
  if (!isObject(value)) {
    return false;
  }
  
  return Object.values(value).every(predicate);
};
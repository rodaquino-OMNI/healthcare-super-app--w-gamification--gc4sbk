/**
 * Type assertion utilities that enforce type constraints at runtime.
 * These utilities throw standardized errors when values don't match expected types,
 * helping to detect type errors early in the execution flow.
 */

import { ValidationError } from '@austa/errors';
import { ErrorType } from '@austa/errors';

/**
 * Error codes for type assertion failures.
 * These codes follow the standardized error code format for the AUSTA SuperApp.
 */
enum TypeAssertionErrorCode {
  INVALID_STRING = 'TYPE_001',
  INVALID_NUMBER = 'TYPE_002',
  INVALID_BOOLEAN = 'TYPE_003',
  INVALID_OBJECT = 'TYPE_004',
  INVALID_ARRAY = 'TYPE_005',
  INVALID_DATE = 'TYPE_006',
  INVALID_FUNCTION = 'TYPE_007',
  UNDEFINED_VALUE = 'TYPE_008',
  NULL_VALUE = 'TYPE_009',
  EXHAUSTIVE_CHECK_FAILED = 'TYPE_010',
  TYPE_MISMATCH = 'TYPE_011',
}

/**
 * Options for assertion functions.
 */
interface AssertionOptions {
  /**
   * Custom error message to use instead of the default.
   */
  message?: string;
  
  /**
   * Journey identifier to include in the error context.
   * Used for journey-specific error handling and reporting.
   */
  journeyId?: 'health' | 'care' | 'plan';
  
  /**
   * Additional context information to include in the error.
   */
  context?: Record<string, any>;
}

/**
 * Creates a detailed error message for type assertion failures.
 * 
 * @param expected - The expected type description
 * @param actual - The actual value that failed the assertion
 * @param customMessage - Optional custom message to include
 * @returns A formatted error message
 */
function createErrorMessage(expected: string, actual: any, customMessage?: string): string {
  const actualType = actual === null ? 'null' : 
                    actual === undefined ? 'undefined' : 
                    Array.isArray(actual) ? 'array' : 
                    typeof actual;
  
  const baseMessage = `Expected ${expected}, but received ${actualType}`;
  
  return customMessage ? `${customMessage}. ${baseMessage}` : baseMessage;
}

/**
 * Creates a ValidationError with standardized structure for type assertion failures.
 * 
 * @param code - The error code from TypeAssertionErrorCode
 * @param message - The error message
 * @param options - Additional options for the error
 * @param value - The value that failed validation
 * @returns A ValidationError instance
 */
function createValidationError(
  code: TypeAssertionErrorCode,
  message: string,
  options?: AssertionOptions,
  value?: any
): ValidationError {
  return new ValidationError({
    message,
    code,
    details: {
      value,
      ...options?.context
    },
    journeyId: options?.journeyId
  });
}

/**
 * Asserts that a value is a string.
 * 
 * @param value - The value to check
 * @param options - Assertion options
 * @throws ValidationError if the value is not a string
 */
export function assertString(value: any, options?: AssertionOptions): asserts value is string {
  if (typeof value !== 'string') {
    const message = createErrorMessage('string', value, options?.message);
    throw createValidationError(TypeAssertionErrorCode.INVALID_STRING, message, options, value);
  }
}

/**
 * Asserts that a value is a number.
 * 
 * @param value - The value to check
 * @param options - Assertion options
 * @throws ValidationError if the value is not a number or is NaN
 */
export function assertNumber(value: any, options?: AssertionOptions): asserts value is number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    const message = createErrorMessage('number', value, options?.message);
    throw createValidationError(TypeAssertionErrorCode.INVALID_NUMBER, message, options, value);
  }
}

/**
 * Asserts that a value is a boolean.
 * 
 * @param value - The value to check
 * @param options - Assertion options
 * @throws ValidationError if the value is not a boolean
 */
export function assertBoolean(value: any, options?: AssertionOptions): asserts value is boolean {
  if (typeof value !== 'boolean') {
    const message = createErrorMessage('boolean', value, options?.message);
    throw createValidationError(TypeAssertionErrorCode.INVALID_BOOLEAN, message, options, value);
  }
}

/**
 * Asserts that a value is an object (not null, not an array).
 * 
 * @param value - The value to check
 * @param options - Assertion options
 * @throws ValidationError if the value is not an object
 */
export function assertObject(value: any, options?: AssertionOptions): asserts value is object {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    const message = createErrorMessage('object', value, options?.message);
    throw createValidationError(TypeAssertionErrorCode.INVALID_OBJECT, message, options, value);
  }
}

/**
 * Asserts that a value is an array.
 * 
 * @param value - The value to check
 * @param options - Assertion options
 * @throws ValidationError if the value is not an array
 */
export function assertArray(value: any, options?: AssertionOptions): asserts value is any[] {
  if (!Array.isArray(value)) {
    const message = createErrorMessage('array', value, options?.message);
    throw createValidationError(TypeAssertionErrorCode.INVALID_ARRAY, message, options, value);
  }
}

/**
 * Asserts that a value is a valid Date object.
 * 
 * @param value - The value to check
 * @param options - Assertion options
 * @throws ValidationError if the value is not a valid Date
 */
export function assertDate(value: any, options?: AssertionOptions): asserts value is Date {
  if (!(value instanceof Date) || isNaN(value.getTime())) {
    const message = createErrorMessage('valid Date', value, options?.message);
    throw createValidationError(TypeAssertionErrorCode.INVALID_DATE, message, options, value);
  }
}

/**
 * Asserts that a value is a function.
 * 
 * @param value - The value to check
 * @param options - Assertion options
 * @throws ValidationError if the value is not a function
 */
export function assertFunction(value: any, options?: AssertionOptions): asserts value is Function {
  if (typeof value !== 'function') {
    const message = createErrorMessage('function', value, options?.message);
    throw createValidationError(TypeAssertionErrorCode.INVALID_FUNCTION, message, options, value);
  }
}

/**
 * Asserts that a value is defined (not undefined).
 * 
 * @param value - The value to check
 * @param options - Assertion options
 * @throws ValidationError if the value is undefined
 */
export function assertDefined<T>(value: T, options?: AssertionOptions): asserts value is NonNullable<T> {
  if (value === undefined) {
    const message = options?.message || 'Value is undefined';
    throw createValidationError(TypeAssertionErrorCode.UNDEFINED_VALUE, message, options, value);
  }
}

/**
 * Asserts that a value is not null.
 * 
 * @param value - The value to check
 * @param options - Assertion options
 * @throws ValidationError if the value is null
 */
export function assertNonNull<T>(value: T, options?: AssertionOptions): asserts value is NonNullable<T> {
  if (value === null) {
    const message = options?.message || 'Value is null';
    throw createValidationError(TypeAssertionErrorCode.NULL_VALUE, message, options, value);
  }
}

/**
 * Asserts that a value is neither null nor undefined.
 * 
 * @param value - The value to check
 * @param options - Assertion options
 * @throws ValidationError if the value is null or undefined
 */
export function assertNonNullable<T>(value: T, options?: AssertionOptions): asserts value is NonNullable<T> {
  if (value === null) {
    const message = options?.message || 'Value is null';
    throw createValidationError(TypeAssertionErrorCode.NULL_VALUE, message, options, value);
  }
  
  if (value === undefined) {
    const message = options?.message || 'Value is undefined';
    throw createValidationError(TypeAssertionErrorCode.UNDEFINED_VALUE, message, options, value);
  }
}

/**
 * Asserts that a value is of a specific type.
 * 
 * @param value - The value to check
 * @param expectedType - The expected type as a string ('string', 'number', etc.)
 * @param options - Assertion options
 * @throws ValidationError if the value is not of the expected type
 */
export function assertType(
  value: any, 
  expectedType: 'string' | 'number' | 'boolean' | 'object' | 'function' | 'undefined' | 'symbol' | 'bigint',
  options?: AssertionOptions
): void {
  if (typeof value !== expectedType) {
    const message = createErrorMessage(expectedType, value, options?.message);
    throw createValidationError(TypeAssertionErrorCode.TYPE_MISMATCH, message, options, value);
  }
  
  // Additional check for NaN when expectedType is 'number'
  if (expectedType === 'number' && Number.isNaN(value)) {
    const message = options?.message || 'Expected a valid number, but received NaN';
    throw createValidationError(TypeAssertionErrorCode.INVALID_NUMBER, message, options, value);
  }
}

/**
 * Asserts that a value is an instance of a specific class.
 * 
 * @param value - The value to check
 * @param expectedClass - The expected class constructor
 * @param options - Assertion options
 * @throws ValidationError if the value is not an instance of the expected class
 */
export function assertInstanceOf<T>(
  value: any,
  expectedClass: new (...args: any[]) => T,
  options?: AssertionOptions
): asserts value is T {
  if (!(value instanceof expectedClass)) {
    const className = expectedClass.name || 'specified class';
    const message = createErrorMessage(`instance of ${className}`, value, options?.message);
    throw createValidationError(TypeAssertionErrorCode.TYPE_MISMATCH, message, options, value);
  }
}

/**
 * Utility for exhaustive type checking in switch statements.
 * This function should never be called at runtime if all cases are handled.
 * 
 * @param value - The value that should never occur
 * @param options - Assertion options
 * @throws ValidationError if this function is called
 */
export function assertNever(value: never, options?: AssertionOptions): never {
  const message = options?.message || `Unexpected value: ${String(value)}`;
  throw createValidationError(
    TypeAssertionErrorCode.EXHAUSTIVE_CHECK_FAILED,
    message,
    options,
    value
  );
}

/**
 * Asserts that a condition is true.
 * 
 * @param condition - The condition to check
 * @param options - Assertion options with required message
 * @throws ValidationError if the condition is false
 */
export function assert(
  condition: boolean,
  options: AssertionOptions & { message: string }
): asserts condition {
  if (!condition) {
    throw createValidationError(
      TypeAssertionErrorCode.TYPE_MISMATCH,
      options.message,
      options,
      undefined
    );
  }
}

/**
 * Asserts that a value is one of the allowed values.
 * 
 * @param value - The value to check
 * @param allowedValues - Array of allowed values
 * @param options - Assertion options
 * @throws ValidationError if the value is not one of the allowed values
 */
export function assertOneOf<T>(
  value: any,
  allowedValues: readonly T[],
  options?: AssertionOptions
): asserts value is T {
  if (!allowedValues.includes(value as T)) {
    const allowedValuesStr = allowedValues.map(v => String(v)).join(', ');
    const message = options?.message || `Expected one of [${allowedValuesStr}], but received ${String(value)}`;
    throw createValidationError(
      TypeAssertionErrorCode.TYPE_MISMATCH,
      message,
      options,
      value
    );
  }
}
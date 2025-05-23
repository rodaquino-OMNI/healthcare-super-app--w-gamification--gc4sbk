/**
 * Type guard utilities for runtime type checking.
 * 
 * This module provides standardized type guard functions that check if values match
 * specific types at runtime. These guards improve type safety by allowing consistent
 * type checking across the codebase, especially for values from external sources
 * like API calls or user inputs.
 * 
 * @module
 */

/**
 * Checks if a value is a string.
 * 
 * @param value - The value to check
 * @returns True if the value is a string, false otherwise
 * 
 * @example
 * ```typescript
 * isString('hello'); // true
 * isString(123); // false
 * isString(null); // false
 * ```
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Checks if a value is a number.
 * 
 * @param value - The value to check
 * @returns True if the value is a number (including 0, excluding NaN), false otherwise
 * 
 * @example
 * ```typescript
 * isNumber(123); // true
 * isNumber(0); // true
 * isNumber(NaN); // false
 * isNumber('123'); // false
 * ```
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Checks if a value is a boolean.
 * 
 * @param value - The value to check
 * @returns True if the value is a boolean, false otherwise
 * 
 * @example
 * ```typescript
 * isBoolean(true); // true
 * isBoolean(false); // true
 * isBoolean(0); // false
 * isBoolean('true'); // false
 * ```
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Checks if a value is a function.
 * 
 * @param value - The value to check
 * @returns True if the value is a function, false otherwise
 * 
 * @example
 * ```typescript
 * isFunction(() => {}); // true
 * isFunction(function() {}); // true
 * isFunction(class {}); // true
 * isFunction({}); // false
 * ```
 */
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

/**
 * Checks if a value is null.
 * 
 * @param value - The value to check
 * @returns True if the value is null, false otherwise
 * 
 * @example
 * ```typescript
 * isNull(null); // true
 * isNull(undefined); // false
 * isNull(0); // false
 * ```
 */
export function isNull(value: unknown): value is null {
  return value === null;
}

/**
 * Checks if a value is undefined.
 * 
 * @param value - The value to check
 * @returns True if the value is undefined, false otherwise
 * 
 * @example
 * ```typescript
 * isUndefined(undefined); // true
 * isUndefined(null); // false
 * isUndefined(''); // false
 * ```
 */
export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

/**
 * Checks if a value is null or undefined.
 * 
 * @param value - The value to check
 * @returns True if the value is null or undefined, false otherwise
 * 
 * @example
 * ```typescript
 * isNullOrUndefined(null); // true
 * isNullOrUndefined(undefined); // true
 * isNullOrUndefined(''); // false
 * isNullOrUndefined(0); // false
 * ```
 */
export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Checks if a value is an array.
 * 
 * @param value - The value to check
 * @returns True if the value is an array, false otherwise
 * 
 * @example
 * ```typescript
 * isArray([]); // true
 * isArray([1, 2, 3]); // true
 * isArray({}); // false
 * isArray('array'); // false
 * ```
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Checks if a value is an object (excluding null and arrays).
 * 
 * @param value - The value to check
 * @returns True if the value is an object (not null, not an array), false otherwise
 * 
 * @example
 * ```typescript
 * isObject({}); // true
 * isObject({ key: 'value' }); // true
 * isObject([]); // false
 * isObject(null); // false
 * isObject('object'); // false
 * ```
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Checks if a value is a Date object.
 * 
 * @param value - The value to check
 * @returns True if the value is a Date object, false otherwise
 * 
 * @example
 * ```typescript
 * isDate(new Date()); // true
 * isDate('2023-01-01'); // false
 * isDate({}); // false
 * ```
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date;
}

/**
 * Checks if a value is a RegExp object.
 * 
 * @param value - The value to check
 * @returns True if the value is a RegExp object, false otherwise
 * 
 * @example
 * ```typescript
 * isRegExp(/test/); // true
 * isRegExp(new RegExp('test')); // true
 * isRegExp('test'); // false
 * ```
 */
export function isRegExp(value: unknown): value is RegExp {
  return value instanceof RegExp;
}

/**
 * Checks if a value is a Promise.
 * 
 * @param value - The value to check
 * @returns True if the value is a Promise, false otherwise
 * 
 * @example
 * ```typescript
 * isPromise(Promise.resolve()); // true
 * isPromise(new Promise(() => {})); // true
 * isPromise({ then: () => {} }); // false (missing catch method)
 * ```
 */
export function isPromise(value: unknown): value is Promise<unknown> {
  return (
    value !== null &&
    value !== undefined &&
    typeof (value as any).then === 'function' &&
    typeof (value as any).catch === 'function'
  );
}

/**
 * Checks if a value is a Symbol.
 * 
 * @param value - The value to check
 * @returns True if the value is a Symbol, false otherwise
 * 
 * @example
 * ```typescript
 * isSymbol(Symbol('test')); // true
 * isSymbol(Symbol.for('test')); // true
 * isSymbol('symbol'); // false
 * ```
 */
export function isSymbol(value: unknown): value is symbol {
  return typeof value === 'symbol';
}

/**
 * Checks if a value is a BigInt.
 * 
 * @param value - The value to check
 * @returns True if the value is a BigInt, false otherwise
 * 
 * @example
 * ```typescript
 * isBigInt(BigInt(123)); // true
 * isBigInt(123n); // true
 * isBigInt(123); // false
 * ```
 */
export function isBigInt(value: unknown): value is bigint {
  return typeof value === 'bigint';
}

/**
 * Checks if a value is a primitive type (string, number, boolean, symbol, bigint, null, undefined).
 * 
 * @param value - The value to check
 * @returns True if the value is a primitive type, false otherwise
 * 
 * @example
 * ```typescript
 * isPrimitive('string'); // true
 * isPrimitive(123); // true
 * isPrimitive(true); // true
 * isPrimitive(null); // true
 * isPrimitive(undefined); // true
 * isPrimitive({}); // false
 * isPrimitive([]); // false
 * ```
 */
export function isPrimitive(
  value: unknown
): value is string | number | boolean | symbol | bigint | null | undefined {
  return (
    isNull(value) ||
    isUndefined(value) ||
    isString(value) ||
    isNumber(value) ||
    isBoolean(value) ||
    isSymbol(value) ||
    isBigInt(value)
  );
}

/**
 * Checks if a value is empty (null, undefined, empty string, empty array, or empty object).
 * 
 * @param value - The value to check
 * @returns True if the value is empty, false otherwise
 * 
 * @example
 * ```typescript
 * isEmpty(null); // true
 * isEmpty(undefined); // true
 * isEmpty(''); // true
 * isEmpty([]); // true
 * isEmpty({}); // true
 * isEmpty('text'); // false
 * isEmpty([1, 2]); // false
 * isEmpty({ key: 'value' }); // false
 * ```
 */
export function isEmpty(value: unknown): boolean {
  if (isNullOrUndefined(value)) {
    return true;
  }

  if (isString(value)) {
    return value.trim() === '';
  }

  if (isArray(value)) {
    return value.length === 0;
  }

  if (isObject(value)) {
    return Object.keys(value).length === 0;
  }

  return false;
}

/**
 * Checks if a value is a plain object (created by object literals, Object.create(null), or new Object()).
 * 
 * @param value - The value to check
 * @returns True if the value is a plain object, false otherwise
 * 
 * @example
 * ```typescript
 * isPlainObject({}); // true
 * isPlainObject({ key: 'value' }); // true
 * isPlainObject(Object.create(null)); // true
 * isPlainObject(new Object()); // true
 * isPlainObject([]); // false
 * isPlainObject(new Date()); // false
 * isPlainObject(null); // false
 * ```
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!isObject(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return (
    prototype === null ||
    prototype === Object.prototype ||
    Object.getPrototypeOf(prototype) === null
  );
}

/**
 * Checks if a value is a finite number (not NaN, not Infinity).
 * 
 * @param value - The value to check
 * @returns True if the value is a finite number, false otherwise
 * 
 * @example
 * ```typescript
 * isFinite(123); // true
 * isFinite(0); // true
 * isFinite(Infinity); // false
 * isFinite(NaN); // false
 * isFinite('123'); // false
 * ```
 */
export function isFinite(value: unknown): value is number {
  return isNumber(value) && Number.isFinite(value);
}

/**
 * Checks if a value is an integer.
 * 
 * @param value - The value to check
 * @returns True if the value is an integer, false otherwise
 * 
 * @example
 * ```typescript
 * isInteger(123); // true
 * isInteger(0); // true
 * isInteger(123.45); // false
 * isInteger(NaN); // false
 * isInteger('123'); // false
 * ```
 */
export function isInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value);
}

/**
 * Checks if a value is a valid number or numeric string.
 * 
 * @param value - The value to check
 * @returns True if the value is a number or can be parsed as a number, false otherwise
 * 
 * @example
 * ```typescript
 * isNumeric(123); // true
 * isNumeric('123'); // true
 * isNumeric('123.45'); // true
 * isNumeric('123abc'); // false
 * isNumeric(null); // false
 * ```
 */
export function isNumeric(value: unknown): boolean {
  if (isNumber(value)) {
    return true;
  }

  if (isString(value)) {
    // Remove commas from strings like "1,000.50"
    const normalizedValue = value.replace(/,/g, '');
    return !isEmpty(normalizedValue) && !isNaN(Number(normalizedValue));
  }

  return false;
}

/**
 * Checks if a value is a non-empty string (contains at least one non-whitespace character).
 * 
 * @param value - The value to check
 * @returns True if the value is a non-empty string, false otherwise
 * 
 * @example
 * ```typescript
 * isNonEmptyString('hello'); // true
 * isNonEmptyString(' '); // false
 * isNonEmptyString(''); // false
 * isNonEmptyString(null); // false
 * ```
 */
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim() !== '';
}

/**
 * Checks if a value is a valid email address format.
 * 
 * @param value - The value to check
 * @returns True if the value is a valid email address format, false otherwise
 * 
 * @example
 * ```typescript
 * isEmail('user@example.com'); // true
 * isEmail('invalid-email'); // false
 * isEmail(null); // false
 * ```
 */
export function isEmail(value: unknown): value is string {
  if (!isString(value)) {
    return false;
  }

  // RFC 5322 compliant email regex
  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailPattern.test(value);
}

/**
 * Checks if a value is a valid URL format.
 * 
 * @param value - The value to check
 * @returns True if the value is a valid URL format, false otherwise
 * 
 * @example
 * ```typescript
 * isUrl('https://example.com'); // true
 * isUrl('invalid-url'); // false
 * isUrl(null); // false
 * ```
 */
export function isUrl(value: unknown): value is string {
  if (!isString(value)) {
    return false;
  }

  try {
    new URL(value);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Checks if a value is a valid UUID format (v1-v5).
 * 
 * @param value - The value to check
 * @returns True if the value is a valid UUID format, false otherwise
 * 
 * @example
 * ```typescript
 * isUuid('123e4567-e89b-12d3-a456-426614174000'); // true
 * isUuid('invalid-uuid'); // false
 * isUuid(null); // false
 * ```
 */
export function isUuid(value: unknown): value is string {
  if (!isString(value)) {
    return false;
  }

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(value);
}

/**
 * Checks if a value is a valid ISO date string format.
 * 
 * @param value - The value to check
 * @returns True if the value is a valid ISO date string format, false otherwise
 * 
 * @example
 * ```typescript
 * isIsoDateString('2023-01-01T12:00:00Z'); // true
 * isIsoDateString('2023-01-01'); // true
 * isIsoDateString('01/01/2023'); // false
 * isIsoDateString(null); // false
 * ```
 */
export function isIsoDateString(value: unknown): value is string {
  if (!isString(value)) {
    return false;
  }

  // ISO 8601 date format regex (simplified)
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
  if (!isoDatePattern.test(value)) {
    return false;
  }

  // Additional validation by attempting to parse the date
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Checks if a value is a valid Brazilian CPF number format.
 * 
 * @param value - The value to check
 * @returns True if the value is a valid CPF format, false otherwise
 * 
 * @example
 * ```typescript
 * isCpf('123.456.789-09'); // true (if valid CPF)
 * isCpf('12345678909'); // true (if valid CPF)
 * isCpf('invalid-cpf'); // false
 * isCpf(null); // false
 * ```
 */
export function isCpf(value: unknown): value is string {
  if (!isString(value)) {
    return false;
  }

  // Remove non-digit characters
  const cleanCPF = value.replace(/\D/g, '');
  
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
}

/**
 * Checks if a value is a valid JSON string.
 * 
 * @param value - The value to check
 * @returns True if the value is a valid JSON string, false otherwise
 * 
 * @example
 * ```typescript
 * isJsonString('{"key":"value"}'); // true
 * isJsonString('invalid-json'); // false
 * isJsonString(null); // false
 * ```
 */
export function isJsonString(value: unknown): value is string {
  if (!isString(value)) {
    return false;
  }

  try {
    JSON.parse(value);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Checks if a value is a Map object.
 * 
 * @param value - The value to check
 * @returns True if the value is a Map object, false otherwise
 * 
 * @example
 * ```typescript
 * isMap(new Map()); // true
 * isMap({}); // false
 * isMap(null); // false
 * ```
 */
export function isMap(value: unknown): value is Map<unknown, unknown> {
  return value instanceof Map;
}

/**
 * Checks if a value is a Set object.
 * 
 * @param value - The value to check
 * @returns True if the value is a Set object, false otherwise
 * 
 * @example
 * ```typescript
 * isSet(new Set()); // true
 * isSet([]); // false
 * isSet(null); // false
 * ```
 */
export function isSet(value: unknown): value is Set<unknown> {
  return value instanceof Set;
}

/**
 * Checks if a value is a WeakMap object.
 * 
 * @param value - The value to check
 * @returns True if the value is a WeakMap object, false otherwise
 * 
 * @example
 * ```typescript
 * isWeakMap(new WeakMap()); // true
 * isWeakMap(new Map()); // false
 * isWeakMap(null); // false
 * ```
 */
export function isWeakMap(value: unknown): value is WeakMap<object, unknown> {
  return value instanceof WeakMap;
}

/**
 * Checks if a value is a WeakSet object.
 * 
 * @param value - The value to check
 * @returns True if the value is a WeakSet object, false otherwise
 * 
 * @example
 * ```typescript
 * isWeakSet(new WeakSet()); // true
 * isWeakSet(new Set()); // false
 * isWeakSet(null); // false
 * ```
 */
export function isWeakSet(value: unknown): value is WeakSet<object> {
  return value instanceof WeakSet;
}

/**
 * Checks if a value is an Error object or a subclass of Error.
 * 
 * @param value - The value to check
 * @returns True if the value is an Error object, false otherwise
 * 
 * @example
 * ```typescript
 * isError(new Error()); // true
 * isError(new TypeError()); // true
 * isError({ message: 'error' }); // false
 * isError(null); // false
 * ```
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Checks if a value is a valid finite number and is positive (greater than zero).
 * 
 * @param value - The value to check
 * @returns True if the value is a positive number, false otherwise
 * 
 * @example
 * ```typescript
 * isPositiveNumber(123); // true
 * isPositiveNumber(0); // false
 * isPositiveNumber(-123); // false
 * isPositiveNumber(Infinity); // false
 * isPositiveNumber(null); // false
 * ```
 */
export function isPositiveNumber(value: unknown): value is number {
  return isFinite(value) && value > 0;
}

/**
 * Checks if a value is a valid finite number and is negative (less than zero).
 * 
 * @param value - The value to check
 * @returns True if the value is a negative number, false otherwise
 * 
 * @example
 * ```typescript
 * isNegativeNumber(-123); // true
 * isNegativeNumber(0); // false
 * isNegativeNumber(123); // false
 * isNegativeNumber(-Infinity); // false
 * isNegativeNumber(null); // false
 * ```
 */
export function isNegativeNumber(value: unknown): value is number {
  return isFinite(value) && value < 0;
}

/**
 * Checks if a value is a valid finite number and is non-negative (greater than or equal to zero).
 * 
 * @param value - The value to check
 * @returns True if the value is a non-negative number, false otherwise
 * 
 * @example
 * ```typescript
 * isNonNegativeNumber(123); // true
 * isNonNegativeNumber(0); // true
 * isNonNegativeNumber(-123); // false
 * isNonNegativeNumber(Infinity); // false
 * isNonNegativeNumber(null); // false
 * ```
 */
export function isNonNegativeNumber(value: unknown): value is number {
  return isFinite(value) && value >= 0;
}

/**
 * Checks if a value is a valid finite number and is non-positive (less than or equal to zero).
 * 
 * @param value - The value to check
 * @returns True if the value is a non-positive number, false otherwise
 * 
 * @example
 * ```typescript
 * isNonPositiveNumber(-123); // true
 * isNonPositiveNumber(0); // true
 * isNonPositiveNumber(123); // false
 * isNonPositiveNumber(-Infinity); // false
 * isNonPositiveNumber(null); // false
 * ```
 */
export function isNonPositiveNumber(value: unknown): value is number {
  return isFinite(value) && value <= 0;
}

/**
 * Checks if a value is a valid finite number within a specified range (inclusive).
 * 
 * @param value - The value to check
 * @param min - The minimum allowed value (inclusive)
 * @param max - The maximum allowed value (inclusive)
 * @returns True if the value is within the specified range, false otherwise
 * 
 * @example
 * ```typescript
 * isNumberInRange(5, 1, 10); // true
 * isNumberInRange(0, 1, 10); // false
 * isNumberInRange(11, 1, 10); // false
 * isNumberInRange(null, 1, 10); // false
 * ```
 */
export function isNumberInRange(
  value: unknown,
  min: number,
  max: number
): value is number {
  return isFinite(value) && value >= min && value <= max;
}

/**
 * Checks if a value is one of the specified allowed values.
 * 
 * @param value - The value to check
 * @param allowedValues - Array of allowed values
 * @returns True if the value is one of the allowed values, false otherwise
 * 
 * @example
 * ```typescript
 * isOneOf('apple', ['apple', 'banana', 'orange']); // true
 * isOneOf('grape', ['apple', 'banana', 'orange']); // false
 * isOneOf(null, ['apple', 'banana', 'orange']); // false
 * ```
 */
export function isOneOf<T>(value: unknown, allowedValues: readonly T[]): value is T {
  return allowedValues.includes(value as T);
}

/**
 * Checks if a value is a valid date object with a valid date (not Invalid Date).
 * 
 * @param value - The value to check
 * @returns True if the value is a valid date object, false otherwise
 * 
 * @example
 * ```typescript
 * isValidDate(new Date()); // true
 * isValidDate(new Date('invalid')); // false
 * isValidDate('2023-01-01'); // false
 * isValidDate(null); // false
 * ```
 */
export function isValidDate(value: unknown): value is Date {
  return isDate(value) && !isNaN(value.getTime());
}

/**
 * Checks if a value is a valid array buffer.
 * 
 * @param value - The value to check
 * @returns True if the value is an array buffer, false otherwise
 * 
 * @example
 * ```typescript
 * isArrayBuffer(new ArrayBuffer(8)); // true
 * isArrayBuffer(new Uint8Array(8)); // false
 * isArrayBuffer(null); // false
 * ```
 */
export function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return value instanceof ArrayBuffer;
}

/**
 * Checks if a value is a typed array (Uint8Array, Int32Array, etc.).
 * 
 * @param value - The value to check
 * @returns True if the value is a typed array, false otherwise
 * 
 * @example
 * ```typescript
 * isTypedArray(new Uint8Array(8)); // true
 * isTypedArray(new Int32Array(8)); // true
 * isTypedArray([]); // false
 * isTypedArray(null); // false
 * ```
 */
export function isTypedArray(value: unknown): value is ArrayBufferView {
  return (
    value instanceof Int8Array ||
    value instanceof Uint8Array ||
    value instanceof Uint8ClampedArray ||
    value instanceof Int16Array ||
    value instanceof Uint16Array ||
    value instanceof Int32Array ||
    value instanceof Uint32Array ||
    value instanceof Float32Array ||
    value instanceof Float64Array ||
    value instanceof BigInt64Array ||
    value instanceof BigUint64Array
  );
}

/**
 * Checks if a value is a valid FormData object.
 * 
 * @param value - The value to check
 * @returns True if the value is a FormData object, false otherwise
 * 
 * @example
 * ```typescript
 * isFormData(new FormData()); // true
 * isFormData({}); // false
 * isFormData(null); // false
 * ```
 */
export function isFormData(value: unknown): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

/**
 * Checks if a value is a valid Blob object.
 * 
 * @param value - The value to check
 * @returns True if the value is a Blob object, false otherwise
 * 
 * @example
 * ```typescript
 * isBlob(new Blob(['content'])); // true
 * isBlob({}); // false
 * isBlob(null); // false
 * ```
 */
export function isBlob(value: unknown): value is Blob {
  return typeof Blob !== 'undefined' && value instanceof Blob;
}

/**
 * Checks if a value is a valid File object.
 * 
 * @param value - The value to check
 * @returns True if the value is a File object, false otherwise
 * 
 * @example
 * ```typescript
 * isFile(new File(['content'], 'filename.txt')); // true
 * isFile(new Blob(['content'])); // false
 * isFile(null); // false
 * ```
 */
export function isFile(value: unknown): value is File {
  return typeof File !== 'undefined' && value instanceof File;
}

/**
 * Checks if a value is a valid Stream object (Node.js).
 * 
 * @param value - The value to check
 * @returns True if the value is a Stream object, false otherwise
 * 
 * @example
 * ```typescript
 * isStream(fs.createReadStream('file.txt')); // true
 * isStream({}); // false
 * isStream(null); // false
 * ```
 */
export function isStream(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as any).pipe === 'function'
  );
}

/**
 * Checks if a value is a valid URL object.
 * 
 * @param value - The value to check
 * @returns True if the value is a URL object, false otherwise
 * 
 * @example
 * ```typescript
 * isUrlObject(new URL('https://example.com')); // true
 * isUrlObject('https://example.com'); // false
 * isUrlObject(null); // false
 * ```
 */
export function isUrlObject(value: unknown): value is URL {
  return typeof URL !== 'undefined' && value instanceof URL;
}

/**
 * Checks if a value is a valid URLSearchParams object.
 * 
 * @param value - The value to check
 * @returns True if the value is a URLSearchParams object, false otherwise
 * 
 * @example
 * ```typescript
 * isUrlSearchParams(new URLSearchParams('key=value')); // true
 * isUrlSearchParams('key=value'); // false
 * isUrlSearchParams(null); // false
 * ```
 */
export function isUrlSearchParams(value: unknown): value is URLSearchParams {
  return typeof URLSearchParams !== 'undefined' && value instanceof URLSearchParams;
}

/**
 * Checks if a value is a valid DOM element.
 * 
 * @param value - The value to check
 * @returns True if the value is a DOM element, false otherwise
 * 
 * @example
 * ```typescript
 * isDomElement(document.createElement('div')); // true
 * isDomElement({}); // false
 * isDomElement(null); // false
 * ```
 */
export function isDomElement(value: unknown): value is Element {
  return (
    typeof Element !== 'undefined' &&
    value instanceof Element
  );
}

/**
 * Checks if the current environment is a browser.
 * 
 * @returns True if the current environment is a browser, false otherwise
 * 
 * @example
 * ```typescript
 * if (isBrowser()) {
 *   // Browser-specific code
 * } else {
 *   // Node.js-specific code
 * }
 * ```
 */
export function isBrowser(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined'
  );
}

/**
 * Checks if the current environment is Node.js.
 * 
 * @returns True if the current environment is Node.js, false otherwise
 * 
 * @example
 * ```typescript
 * if (isNode()) {
 *   // Node.js-specific code
 * } else {
 *   // Browser-specific code
 * }
 * ```
 */
export function isNode(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null
  );
}

/**
 * Checks if a value is a valid iterable object (can be used in for...of loops).
 * 
 * @param value - The value to check
 * @returns True if the value is an iterable object, false otherwise
 * 
 * @example
 * ```typescript
 * isIterable([1, 2, 3]); // true
 * isIterable(new Set([1, 2, 3])); // true
 * isIterable('string'); // true
 * isIterable({}); // false
 * isIterable(null); // false
 * ```
 */
export function isIterable(value: unknown): value is Iterable<unknown> {
  return (
    value !== null &&
    value !== undefined &&
    typeof (value as any)[Symbol.iterator] === 'function'
  );
}

/**
 * Checks if a value is a valid async iterable object (can be used in for await...of loops).
 * 
 * @param value - The value to check
 * @returns True if the value is an async iterable object, false otherwise
 * 
 * @example
 * ```typescript
 * isAsyncIterable((async function* () { yield 1; })()) // true
 * isAsyncIterable([1, 2, 3]); // false
 * isAsyncIterable(null); // false
 * ```
 */
export function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return (
    value !== null &&
    value !== undefined &&
    typeof (value as any)[Symbol.asyncIterator] === 'function'
  );
}

/**
 * Checks if a value is a valid generator object.
 * 
 * @param value - The value to check
 * @returns True if the value is a generator object, false otherwise
 * 
 * @example
 * ```typescript
 * isGenerator((function* () { yield 1; })()); // true
 * isGenerator([]); // false
 * isGenerator(null); // false
 * ```
 */
export function isGenerator(value: unknown): value is Generator {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as any).next === 'function' &&
    typeof (value as any).throw === 'function' &&
    typeof (value as any).return === 'function'
  );
}

/**
 * Checks if a value is a valid async generator object.
 * 
 * @param value - The value to check
 * @returns True if the value is an async generator object, false otherwise
 * 
 * @example
 * ```typescript
 * isAsyncGenerator((async function* () { yield 1; })()); // true
 * isAsyncGenerator((function* () { yield 1; })()); // false
 * isAsyncGenerator(null); // false
 * ```
 */
export function isAsyncGenerator(value: unknown): value is AsyncGenerator {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as any).next === 'function' &&
    typeof (value as any).throw === 'function' &&
    typeof (value as any).return === 'function' &&
    isPromise((value as any).next())
  );
}

/**
 * Checks if a value is a valid thenable object (has a then method).
 * 
 * @param value - The value to check
 * @returns True if the value is a thenable object, false otherwise
 * 
 * @example
 * ```typescript
 * isThenable(Promise.resolve()); // true
 * isThenable({ then: () => {} }); // true
 * isThenable({}); // false
 * isThenable(null); // false
 * ```
 */
export function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    value !== null &&
    value !== undefined &&
    typeof (value as any).then === 'function'
  );
}

/**
 * Checks if a value is a valid observable object (has subscribe method).
 * 
 * @param value - The value to check
 * @returns True if the value is an observable object, false otherwise
 * 
 * @example
 * ```typescript
 * isObservable(rxjs.of(1, 2, 3)); // true
 * isObservable({ subscribe: () => {} }); // true
 * isObservable({}); // false
 * isObservable(null); // false
 * ```
 */
export function isObservable(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as any).subscribe === 'function'
  );
}

/**
 * Checks if a value is a valid readable stream (has pipe method).
 * 
 * @param value - The value to check
 * @returns True if the value is a readable stream, false otherwise
 * 
 * @example
 * ```typescript
 * isReadableStream(fs.createReadStream('file.txt')); // true
 * isReadableStream({ pipe: () => {} }); // true
 * isReadableStream({}); // false
 * isReadableStream(null); // false
 * ```
 */
export function isReadableStream(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as any).pipe === 'function'
  );
}

/**
 * Checks if a value is a valid writable stream (has write method).
 * 
 * @param value - The value to check
 * @returns True if the value is a writable stream, false otherwise
 * 
 * @example
 * ```typescript
 * isWritableStream(fs.createWriteStream('file.txt')); // true
 * isWritableStream({ write: () => {} }); // true
 * isWritableStream({}); // false
 * isWritableStream(null); // false
 * ```
 */
export function isWritableStream(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as any).write === 'function'
  );
}

/**
 * Checks if a value is a valid duplex stream (has both pipe and write methods).
 * 
 * @param value - The value to check
 * @returns True if the value is a duplex stream, false otherwise
 * 
 * @example
 * ```typescript
 * isDuplexStream(new stream.Duplex()); // true
 * isDuplexStream({ pipe: () => {}, write: () => {} }); // true
 * isDuplexStream({}); // false
 * isDuplexStream(null); // false
 * ```
 */
export function isDuplexStream(value: unknown): boolean {
  return (
    isReadableStream(value) &&
    isWritableStream(value)
  );
}
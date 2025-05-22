/**
 * Type guard utilities for checking value types.
 * 
 * This module provides TypeScript type guards for checking the types of values
 * at runtime. These functions help with type narrowing and validation throughout
 * the application, ensuring type safety for data exchanges.
 * 
 * @module type-guards
 */

/**
 * Checks if a value is null or undefined
 * @param value The value to check
 * @returns True if the value is null or undefined, false otherwise
 */
export function isNil(value: any): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Checks if a value is a string
 * @param value The value to check
 * @returns True if the value is a string, false otherwise
 */
export function isString(value: any): value is string {
  return typeof value === 'string';
}

/**
 * Checks if a value is a number
 * @param value The value to check
 * @returns True if the value is a number and not NaN, false otherwise
 */
export function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Checks if a value is a boolean
 * @param value The value to check
 * @returns True if the value is a boolean, false otherwise
 */
export function isBoolean(value: any): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Checks if a value is a Date object
 * @param value The value to check
 * @returns True if the value is a valid Date object, false otherwise
 */
export function isDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Checks if a value is an object
 * @param value The value to check
 * @returns True if the value is an object and not null, false otherwise
 */
export function isObject(value: any): value is object {
  return typeof value === 'object' && value !== null;
}

/**
 * Checks if a value is an array
 * @param value The value to check
 * @returns True if the value is an array, false otherwise
 */
export function isArray(value: any): value is any[] {
  return Array.isArray(value);
}

/**
 * Checks if a value is a function
 * @param value The value to check
 * @returns True if the value is a function, false otherwise
 */
export function isFunction(value: any): value is Function {
  return typeof value === 'function';
}

/**
 * Checks if a value is a plain object (not an array, Date, etc.)
 * @param value The value to check
 * @returns True if the value is a plain object, false otherwise
 */
export function isPlainObject(value: any): value is Record<string, any> {
  if (!isObject(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
}

/**
 * Checks if a value is empty (empty string, array, object, or null/undefined)
 * @param value The value to check
 * @returns True if the value is empty, false otherwise
 */
export function isEmpty(value: any): boolean {
  if (isNil(value)) return true;
  if (isString(value)) return value.trim().length === 0;
  if (isArray(value)) return value.length === 0;
  if (isPlainObject(value)) return Object.keys(value).length === 0;
  return false;
}

/**
 * Checks if a value is a valid ISO date string
 * @param value The value to check
 * @returns True if the value is a valid ISO date string, false otherwise
 */
export function isISODateString(value: any): value is string {
  if (!isString(value)) return false;
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/;
  return isoDatePattern.test(value) && !isNaN(Date.parse(value));
}

/**
 * Checks if a value is a valid Brazilian date string (DD/MM/YYYY)
 * @param value The value to check
 * @returns True if the value is a valid Brazilian date string, false otherwise
 */
export function isBrazilianDateString(value: any): value is string {
  if (!isString(value)) return false;
  const brDatePattern = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!brDatePattern.test(value)) return false;
  
  const [day, month, year] = value.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day;
}

/**
 * Checks if a value is a valid UUID string
 * @param value The value to check
 * @returns True if the value is a valid UUID string, false otherwise
 */
export function isUUID(value: any): value is string {
  if (!isString(value)) return false;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(value);
}

/**
 * Checks if a value is a valid email address
 * @param value The value to check
 * @returns True if the value is a valid email address, false otherwise
 */
export function isEmail(value: any): value is string {
  if (!isString(value)) return false;
  // Basic email validation - for more comprehensive validation, use a library
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(value);
}

/**
 * Checks if a value is a valid URL
 * @param value The value to check
 * @returns True if the value is a valid URL, false otherwise
 */
export function isURL(value: any): value is string {
  if (!isString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a value is a valid Brazilian CPF number
 * @param value The value to check
 * @returns True if the value is a valid CPF, false otherwise
 */
export function isCPF(value: any): value is string {
  if (!isString(value)) return false;
  
  // Remove non-numeric characters
  const cpf = value.replace(/[^\d]/g, '');
  
  // Check if it has 11 digits
  if (cpf.length !== 11) return false;
  
  // Check if all digits are the same
  if (/^(\d)\1+$/.test(cpf)) return false;
  
  // Validate check digits
  let sum = 0;
  let remainder;
  
  // First check digit
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;
  
  // Second check digit
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;
  
  return true;
}
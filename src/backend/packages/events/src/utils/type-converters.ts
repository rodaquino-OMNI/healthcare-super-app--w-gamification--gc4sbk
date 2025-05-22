/**
 * Type conversion utilities for safely handling different data types in events.
 * 
 * This module provides functions for converting between various data types with robust
 * error handling and validation. It ensures that data conversions are performed consistently
 * across all services, preventing type-related errors during event processing.
 * 
 * @module type-converters
 */

import { isNil, isString, isNumber, isBoolean, isDate, isObject } from '../utils/type-guards';
import { ValidationError } from '../errors/validation.error';

/**
 * Options for type conversion operations
 */
export interface ConversionOptions {
  /** Whether to throw an error on conversion failure (default: true) */
  throwOnError?: boolean;
  /** Custom error message for conversion failures */
  errorMessage?: string;
  /** Default value to return on conversion failure (if throwOnError is false) */
  defaultValue?: any;
  /** Whether to allow null/undefined values (default: false) */
  allowNil?: boolean;
  /** Journey context for journey-specific error messages */
  journeyContext?: string;
}

/**
 * Default conversion options
 */
const defaultOptions: ConversionOptions = {
  throwOnError: true,
  allowNil: false,
};

/**
 * Error messages for type conversion failures
 */
const errorMessages = {
  string: 'Failed to convert value to string',
  number: 'Failed to convert value to number',
  boolean: 'Failed to convert value to boolean',
  date: 'Failed to convert value to date',
  object: 'Failed to convert value to object',
  array: 'Failed to convert value to array',
  nil: 'Value is null or undefined',
};

/**
 * Creates a validation error with the appropriate message and context
 * @param message Error message
 * @param value The value that failed conversion
 * @param targetType The target type for conversion
 * @param options Conversion options
 * @returns ValidationError instance
 */
function createConversionError(
  message: string,
  value: any,
  targetType: string,
  options?: ConversionOptions
): ValidationError {
  const errorMessage = options?.errorMessage || message;
  const journeyContext = options?.journeyContext || 'events';
  
  return new ValidationError(
    errorMessage,
    {
      value,
      targetType,
      journeyContext,
    }
  );
}

/**
 * Handles the result of a conversion operation based on the provided options
 * @param result The conversion result
 * @param value The original value
 * @param targetType The target type for conversion
 * @param options Conversion options
 * @returns The conversion result or default value
 */
function handleConversionResult<T>(
  result: T | null,
  value: any,
  targetType: string,
  options?: ConversionOptions
): T | null | undefined {
  const mergedOptions = { ...defaultOptions, ...options };
  
  if (result === null) {
    if (mergedOptions.throwOnError) {
      throw createConversionError(
        errorMessages[targetType as keyof typeof errorMessages] || `Failed to convert value to ${targetType}`,
        value,
        targetType,
        mergedOptions
      );
    }
    return mergedOptions.defaultValue as T;
  }
  
  return result;
}

/**
 * Handles null or undefined values based on the provided options
 * @param value The value to check
 * @param targetType The target type for conversion
 * @param options Conversion options
 * @returns true if the value should be handled as nil, false otherwise
 */
function handleNilValue(
  value: any,
  targetType: string,
  options?: ConversionOptions
): boolean {
  const mergedOptions = { ...defaultOptions, ...options };
  
  if (isNil(value)) {
    if (mergedOptions.allowNil) {
      return true;
    }
    
    if (mergedOptions.throwOnError) {
      throw createConversionError(
        errorMessages.nil,
        value,
        targetType,
        mergedOptions
      );
    }
    return true;
  }
  
  return false;
}

/**
 * Converts a value to a string with validation and error handling
 * @param value The value to convert
 * @param options Conversion options
 * @returns The converted string or null/default value
 */
export function toString(
  value: any,
  options?: ConversionOptions
): string | null | undefined {
  if (handleNilValue(value, 'string', options)) {
    return options?.defaultValue as string;
  }
  
  if (isString(value)) {
    return value;
  }
  
  try {
    // Handle special cases
    if (isDate(value)) {
      return value.toISOString();
    }
    
    if (isObject(value)) {
      return JSON.stringify(value);
    }
    
    // Default string conversion
    const result = String(value);
    return result;
  } catch (error) {
    return handleConversionResult(null, value, 'string', options);
  }
}

/**
 * Converts a value to a number with validation and error handling
 * @param value The value to convert
 * @param options Conversion options
 * @returns The converted number or null/default value
 */
export function toNumber(
  value: any,
  options?: ConversionOptions
): number | null | undefined {
  if (handleNilValue(value, 'number', options)) {
    return options?.defaultValue as number;
  }
  
  if (isNumber(value)) {
    return value;
  }
  
  try {
    // Handle string conversion
    if (isString(value)) {
      // Remove non-numeric characters for currency strings (e.g., "R$ 1.234,56")
      if (value.includes('R$')) {
        value = value.replace(/[^\d,.-]/g, '')
                     .replace(',', '.');
      }
      
      const num = Number(value);
      if (isNaN(num)) {
        return handleConversionResult(null, value, 'number', options);
      }
      return num;
    }
    
    // Handle boolean conversion
    if (isBoolean(value)) {
      return value ? 1 : 0;
    }
    
    // Handle date conversion
    if (isDate(value)) {
      return value.getTime();
    }
    
    // Default conversion
    const num = Number(value);
    if (isNaN(num)) {
      return handleConversionResult(null, value, 'number', options);
    }
    return num;
  } catch (error) {
    return handleConversionResult(null, value, 'number', options);
  }
}

/**
 * Converts a value to an integer with validation and error handling
 * @param value The value to convert
 * @param options Conversion options
 * @returns The converted integer or null/default value
 */
export function toInteger(
  value: any,
  options?: ConversionOptions
): number | null | undefined {
  const num = toNumber(value, options);
  if (isNil(num)) {
    return num;
  }
  
  return Math.floor(num);
}

/**
 * Converts a value to a boolean with validation and error handling
 * @param value The value to convert
 * @param options Conversion options
 * @returns The converted boolean or null/default value
 */
export function toBoolean(
  value: any,
  options?: ConversionOptions
): boolean | null | undefined {
  if (handleNilValue(value, 'boolean', options)) {
    return options?.defaultValue as boolean;
  }
  
  if (isBoolean(value)) {
    return value;
  }
  
  try {
    // Handle string conversion with common boolean strings
    if (isString(value)) {
      const normalized = value.toLowerCase().trim();
      if (['true', 'yes', 'y', '1', 'sim', 's'].includes(normalized)) {
        return true;
      }
      if (['false', 'no', 'n', '0', 'não', 'nao'].includes(normalized)) {
        return false;
      }
      return handleConversionResult(null, value, 'boolean', options);
    }
    
    // Handle number conversion
    if (isNumber(value)) {
      // Only 0 and 1 are valid number-to-boolean conversions to avoid ambiguity
      if (value === 0) return false;
      if (value === 1) return true;
      return handleConversionResult(null, value, 'boolean', options);
    }
    
    // Default conversion
    return Boolean(value);
  } catch (error) {
    return handleConversionResult(null, value, 'boolean', options);
  }
}

/**
 * Converts a value to a Date with validation and error handling
 * @param value The value to convert
 * @param options Conversion options
 * @returns The converted Date or null/default value
 */
export function toDate(
  value: any,
  options?: ConversionOptions
): Date | null | undefined {
  if (handleNilValue(value, 'date', options)) {
    return options?.defaultValue as Date;
  }
  
  if (isDate(value)) {
    return value;
  }
  
  try {
    // Handle number conversion (timestamp)
    if (isNumber(value)) {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return handleConversionResult(null, value, 'date', options);
      }
      return date;
    }
    
    // Handle string conversion
    if (isString(value)) {
      // Handle Brazilian date format (DD/MM/YYYY)
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        const [day, month, year] = value.split('/').map(Number);
        const date = new Date(year, month - 1, day);
        if (isNaN(date.getTime())) {
          return handleConversionResult(null, value, 'date', options);
        }
        return date;
      }
      
      // Standard ISO date parsing
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return handleConversionResult(null, value, 'date', options);
      }
      return date;
    }
    
    return handleConversionResult(null, value, 'date', options);
  } catch (error) {
    return handleConversionResult(null, value, 'date', options);
  }
}

/**
 * Converts a value to an array with validation and error handling
 * @param value The value to convert
 * @param itemConverter Optional converter function for array items
 * @param options Conversion options
 * @returns The converted array or null/default value
 */
export function toArray<T>(
  value: any,
  itemConverter?: (item: any, index: number) => T,
  options?: ConversionOptions
): T[] | null | undefined {
  if (handleNilValue(value, 'array', options)) {
    return options?.defaultValue as T[];
  }
  
  try {
    // Handle array conversion
    if (Array.isArray(value)) {
      if (itemConverter) {
        return value.map((item, index) => itemConverter(item, index));
      }
      return value as T[];
    }
    
    // Handle string conversion (JSON array)
    if (isString(value) && value.trim().startsWith('[') && value.trim().endsWith(']')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          if (itemConverter) {
            return parsed.map((item, index) => itemConverter(item, index));
          }
          return parsed as T[];
        }
      } catch {
        // Fall through to default handling
      }
    }
    
    // Convert single item to array
    const result = [value];
    if (itemConverter) {
      return result.map((item, index) => itemConverter(item, index));
    }
    return result as T[];
  } catch (error) {
    return handleConversionResult(null, value, 'array', options);
  }
}

/**
 * Converts a value to an object with validation and error handling
 * @param value The value to convert
 * @param options Conversion options
 * @returns The converted object or null/default value
 */
export function toObject<T extends object = Record<string, any>>(
  value: any,
  options?: ConversionOptions
): T | null | undefined {
  if (handleNilValue(value, 'object', options)) {
    return options?.defaultValue as T;
  }
  
  if (isObject(value) && !isDate(value) && !Array.isArray(value)) {
    return value as T;
  }
  
  try {
    // Handle string conversion (JSON object)
    if (isString(value)) {
      try {
        const parsed = JSON.parse(value);
        if (isObject(parsed) && !Array.isArray(parsed)) {
          return parsed as T;
        }
      } catch {
        return handleConversionResult(null, value, 'object', options);
      }
    }
    
    return handleConversionResult(null, value, 'object', options);
  } catch (error) {
    return handleConversionResult(null, value, 'object', options);
  }
}

/**
 * Safely converts a value to the specified type with validation
 * @param value The value to convert
 * @param targetType The target type for conversion
 * @param options Conversion options
 * @returns The converted value or null/default value
 */
export function convertTo<T>(
  value: any,
  targetType: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array',
  options?: ConversionOptions
): T | null | undefined {
  switch (targetType) {
    case 'string':
      return toString(value, options) as unknown as T;
    case 'number':
      return toNumber(value, options) as unknown as T;
    case 'boolean':
      return toBoolean(value, options) as unknown as T;
    case 'date':
      return toDate(value, options) as unknown as T;
    case 'object':
      return toObject(value, options) as unknown as T;
    case 'array':
      return toArray(value, undefined, options) as unknown as T;
    default:
      if (options?.throwOnError) {
        throw createConversionError(
          `Unsupported target type: ${targetType}`,
          value,
          targetType,
          options
        );
      }
      return options?.defaultValue as T;
  }
}

/**
 * Converts a value to a nullable type (allowing null/undefined values)
 * @param value The value to convert
 * @param converter The converter function to use
 * @param options Conversion options
 * @returns The converted value, null, or undefined
 */
export function toNullable<T>(
  value: any,
  converter: (value: any, options?: ConversionOptions) => T,
  options?: ConversionOptions
): T | null | undefined {
  return converter(value, { ...options, allowNil: true });
}

/**
 * Converts a value with a default fallback value
 * @param value The value to convert
 * @param converter The converter function to use
 * @param defaultValue The default value to use if conversion fails
 * @param options Conversion options
 * @returns The converted value or default value
 */
export function toDefault<T>(
  value: any,
  converter: (value: any, options?: ConversionOptions) => T,
  defaultValue: T,
  options?: ConversionOptions
): T {
  return converter(value, { 
    ...options, 
    throwOnError: false, 
    defaultValue 
  }) as T;
}

/**
 * Type guard utilities for checking types
 * These are re-exported from type-guards.ts for convenience
 */
export { isNil, isString, isNumber, isBoolean, isDate, isObject };
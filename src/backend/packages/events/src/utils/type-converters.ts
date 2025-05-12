/**
 * Type conversion utilities for safely handling different data types in events.
 * 
 * This module provides functions for converting between various data types
 * (strings, numbers, dates, booleans, etc.) with robust error handling and validation.
 * It ensures that data conversions are performed consistently across all services,
 * preventing type-related errors during event processing.
 */

import { isISO8601 } from 'class-validator';

/**
 * Error thrown when a type conversion fails.
 */
export class TypeConversionError extends Error {
  constructor(
    public readonly value: unknown,
    public readonly targetType: string,
    message?: string,
  ) {
    super(message || `Failed to convert value '${value}' to type ${targetType}`);
    this.name = 'TypeConversionError';
  }
}

/**
 * Options for string conversion.
 */
export interface StringConversionOptions {
  /** Trim whitespace from the result */
  trim?: boolean;
  /** Convert empty strings to null */
  emptyAsNull?: boolean;
  /** Maximum allowed length */
  maxLength?: number;
  /** Minimum allowed length */
  minLength?: number;
}

/**
 * Options for number conversion.
 */
export interface NumberConversionOptions {
  /** Minimum allowed value (inclusive) */
  min?: number;
  /** Maximum allowed value (inclusive) */
  max?: number;
  /** Allow only integers */
  integer?: boolean;
  /** Allow only positive numbers */
  positive?: boolean;
  /** Allow only negative numbers */
  negative?: boolean;
}

/**
 * Options for date conversion.
 */
export interface DateConversionOptions {
  /** Minimum allowed date (inclusive) */
  min?: Date;
  /** Maximum allowed date (inclusive) */
  max?: Date;
  /** Allow only future dates (relative to now) */
  future?: boolean;
  /** Allow only past dates (relative to now) */
  past?: boolean;
}

/**
 * Options for boolean conversion.
 */
export interface BooleanConversionOptions {
  /** Custom truthy values */
  truthyValues?: unknown[];
  /** Custom falsy values */
  falsyValues?: unknown[];
}

/**
 * Safely converts a value to a string with validation.
 * 
 * @param value - The value to convert
 * @param options - String conversion options
 * @returns The converted string
 * @throws {TypeConversionError} If conversion fails or validation fails
 */
export function toString(
  value: unknown,
  options: StringConversionOptions = {}
): string {
  // Handle null and undefined
  if (value === null || value === undefined) {
    throw new TypeConversionError(value, 'string', 'Cannot convert null or undefined to string');
  }

  // Convert to string
  let result = String(value);

  // Apply trim if requested
  if (options.trim) {
    result = result.trim();
  }

  // Handle empty strings
  if (result === '' && options.emptyAsNull) {
    throw new TypeConversionError(value, 'string', 'Empty string converted to null');
  }

  // Validate length constraints
  if (options.maxLength !== undefined && result.length > options.maxLength) {
    throw new TypeConversionError(
      value,
      'string',
      `String exceeds maximum length of ${options.maxLength} characters`
    );
  }

  if (options.minLength !== undefined && result.length < options.minLength) {
    throw new TypeConversionError(
      value,
      'string',
      `String below minimum length of ${options.minLength} characters`
    );
  }

  return result;
}

/**
 * Safely converts a value to a number with validation.
 * 
 * @param value - The value to convert
 * @param options - Number conversion options
 * @returns The converted number
 * @throws {TypeConversionError} If conversion fails or validation fails
 */
export function toNumber(
  value: unknown,
  options: NumberConversionOptions = {}
): number {
  // Handle null and undefined
  if (value === null || value === undefined) {
    throw new TypeConversionError(value, 'number', 'Cannot convert null or undefined to number');
  }

  // Convert to number
  let result: number;

  if (typeof value === 'number') {
    result = value;
  } else if (typeof value === 'string') {
    // Try to parse the string as a number
    const trimmed = value.trim();
    if (trimmed === '') {
      throw new TypeConversionError(value, 'number', 'Cannot convert empty string to number');
    }

    result = Number(trimmed);

    // Check if the conversion was successful
    if (isNaN(result)) {
      throw new TypeConversionError(value, 'number', `Invalid number format: '${value}'`);
    }
  } else if (typeof value === 'boolean') {
    // Convert boolean to 0 or 1
    result = value ? 1 : 0;
  } else {
    throw new TypeConversionError(value, 'number', `Cannot convert ${typeof value} to number`);
  }

  // Validate integer constraint
  if (options.integer && !Number.isInteger(result)) {
    throw new TypeConversionError(value, 'integer', `Value '${value}' is not an integer`);
  }

  // Validate range constraints
  if (options.min !== undefined && result < options.min) {
    throw new TypeConversionError(
      value,
      'number',
      `Number ${result} is less than minimum value ${options.min}`
    );
  }

  if (options.max !== undefined && result > options.max) {
    throw new TypeConversionError(
      value,
      'number',
      `Number ${result} is greater than maximum value ${options.max}`
    );
  }

  // Validate sign constraints
  if (options.positive && result <= 0) {
    throw new TypeConversionError(value, 'positive number', `Number ${result} is not positive`);
  }

  if (options.negative && result >= 0) {
    throw new TypeConversionError(value, 'negative number', `Number ${result} is not negative`);
  }

  return result;
}

/**
 * Safely converts a value to a boolean with validation.
 * 
 * @param value - The value to convert
 * @param options - Boolean conversion options
 * @returns The converted boolean
 * @throws {TypeConversionError} If conversion fails
 */
export function toBoolean(
  value: unknown,
  options: BooleanConversionOptions = {}
): boolean {
  // Handle null and undefined
  if (value === null || value === undefined) {
    throw new TypeConversionError(value, 'boolean', 'Cannot convert null or undefined to boolean');
  }

  // Default truthy values
  const truthyValues = options.truthyValues || [true, 'true', 'yes', 'y', '1', 1];
  // Default falsy values
  const falsyValues = options.falsyValues || [false, 'false', 'no', 'n', '0', 0];

  // Check if the value is in the truthy list
  if (truthyValues.some(v => v === value)) {
    return true;
  }

  // Check if the value is in the falsy list
  if (falsyValues.some(v => v === value)) {
    return false;
  }

  // If the value is not in either list, throw an error
  throw new TypeConversionError(
    value,
    'boolean',
    `Cannot convert value '${value}' to boolean. Expected one of: ${[...truthyValues, ...falsyValues].join(', ')}`
  );
}

/**
 * Safely converts a value to a Date with validation.
 * 
 * @param value - The value to convert
 * @param options - Date conversion options
 * @returns The converted Date
 * @throws {TypeConversionError} If conversion fails or validation fails
 */
export function toDate(
  value: unknown,
  options: DateConversionOptions = {}
): Date {
  // Handle null and undefined
  if (value === null || value === undefined) {
    throw new TypeConversionError(value, 'Date', 'Cannot convert null or undefined to Date');
  }

  let result: Date;

  // Convert to Date based on the type
  if (value instanceof Date) {
    result = new Date(value.getTime()); // Create a new Date to avoid reference issues
  } else if (typeof value === 'string') {
    // Check if it's an ISO 8601 date string
    if (isISO8601(value)) {
      result = new Date(value);
    } else {
      // Try to parse the string as a date
      result = new Date(value);
    }

    // Check if the conversion was successful
    if (isNaN(result.getTime())) {
      throw new TypeConversionError(value, 'Date', `Invalid date format: '${value}'`);
    }
  } else if (typeof value === 'number') {
    // Assume it's a timestamp
    result = new Date(value);

    // Check if the conversion was successful
    if (isNaN(result.getTime())) {
      throw new TypeConversionError(value, 'Date', `Invalid timestamp: ${value}`);
    }
  } else {
    throw new TypeConversionError(value, 'Date', `Cannot convert ${typeof value} to Date`);
  }

  // Validate range constraints
  if (options.min !== undefined && result < options.min) {
    throw new TypeConversionError(
      value,
      'Date',
      `Date ${result.toISOString()} is before minimum date ${options.min.toISOString()}`
    );
  }

  if (options.max !== undefined && result > options.max) {
    throw new TypeConversionError(
      value,
      'Date',
      `Date ${result.toISOString()} is after maximum date ${options.max.toISOString()}`
    );
  }

  // Validate future/past constraints
  const now = new Date();
  if (options.future && result <= now) {
    throw new TypeConversionError(
      value,
      'future Date',
      `Date ${result.toISOString()} is not in the future`
    );
  }

  if (options.past && result >= now) {
    throw new TypeConversionError(
      value,
      'past Date',
      `Date ${result.toISOString()} is not in the past`
    );
  }

  return result;
}

/**
 * Safely converts a value to an array with validation.
 * 
 * @param value - The value to convert
 * @param itemConverter - Function to convert each item in the array
 * @returns The converted array
 * @throws {TypeConversionError} If conversion fails
 */
export function toArray<T>(
  value: unknown,
  itemConverter: (item: unknown, index: number) => T
): T[] {
  // Handle null and undefined
  if (value === null || value === undefined) {
    throw new TypeConversionError(value, 'array', 'Cannot convert null or undefined to array');
  }

  // If it's already an array, convert each item
  if (Array.isArray(value)) {
    return value.map((item, index) => {
      try {
        return itemConverter(item, index);
      } catch (error) {
        if (error instanceof TypeConversionError) {
          throw new TypeConversionError(
            item,
            'array item',
            `Failed to convert array item at index ${index}: ${error.message}`
          );
        }
        throw error;
      }
    });
  }

  // If it's a string, try to parse it as JSON
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item, index) => {
          try {
            return itemConverter(item, index);
          } catch (error) {
            if (error instanceof TypeConversionError) {
              throw new TypeConversionError(
                item,
                'array item',
                `Failed to convert array item at index ${index}: ${error.message}`
              );
            }
            throw error;
          }
        });
      }
      throw new TypeConversionError(value, 'array', 'Parsed JSON is not an array');
    } catch (error) {
      if (error instanceof TypeConversionError) {
        throw error;
      }
      throw new TypeConversionError(value, 'array', `Failed to parse string as JSON array: ${error.message}`);
    }
  }

  // For any other type, wrap it in an array and convert
  try {
    return [itemConverter(value, 0)];
  } catch (error) {
    if (error instanceof TypeConversionError) {
      throw new TypeConversionError(
        value,
        'array item',
        `Failed to convert single value to array item: ${error.message}`
      );
    }
    throw error;
  }
}

/**
 * Safely converts a value to an object with validation.
 * 
 * @param value - The value to convert
 * @returns The converted object
 * @throws {TypeConversionError} If conversion fails
 */
export function toObject(
  value: unknown
): Record<string, unknown> {
  // Handle null and undefined
  if (value === null || value === undefined) {
    throw new TypeConversionError(value, 'object', 'Cannot convert null or undefined to object');
  }

  // If it's already an object, return it
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  // If it's a string, try to parse it as JSON
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      throw new TypeConversionError(value, 'object', 'Parsed JSON is not an object');
    } catch (error) {
      if (error instanceof TypeConversionError) {
        throw error;
      }
      throw new TypeConversionError(value, 'object', `Failed to parse string as JSON object: ${error.message}`);
    }
  }

  throw new TypeConversionError(value, 'object', `Cannot convert ${typeof value} to object`);
}

/**
 * Safely handles nullable values by applying a converter function or returning null.
 * 
 * @param value - The value to convert
 * @param converter - Function to convert the value if it's not null or undefined
 * @returns The converted value or null
 */
export function toNullable<T>(
  value: unknown,
  converter: (value: unknown) => T
): T | null {
  if (value === null || value === undefined) {
    return null;
  }

  return converter(value);
}

/**
 * Safely handles optional values by applying a converter function or returning undefined.
 * 
 * @param value - The value to convert
 * @param converter - Function to convert the value if it's not undefined
 * @returns The converted value or undefined
 */
export function toOptional<T>(
  value: unknown,
  converter: (value: unknown) => T
): T | undefined {
  if (value === undefined) {
    return undefined;
  }

  return converter(value);
}

/**
 * Safely handles values with a default by applying a converter function or returning the default.
 * 
 * @param value - The value to convert
 * @param converter - Function to convert the value if it's not null or undefined
 * @param defaultValue - Default value to return if the input is null or undefined
 * @returns The converted value or the default value
 */
export function toDefault<T>(
  value: unknown,
  converter: (value: unknown) => T,
  defaultValue: T
): T {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  try {
    return converter(value);
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Safely converts a value to an enum value with validation.
 * 
 * @param value - The value to convert
 * @param enumObject - The enum object to convert to
 * @returns The converted enum value
 * @throws {TypeConversionError} If conversion fails
 */
export function toEnum<T extends Record<string, string | number>>(
  value: unknown,
  enumObject: T
): T[keyof T] {
  // Handle null and undefined
  if (value === null || value === undefined) {
    throw new TypeConversionError(value, 'enum', 'Cannot convert null or undefined to enum');
  }

  // Get all possible enum values
  const enumValues = Object.values(enumObject);

  // Check if the value is a valid enum value
  if (enumValues.includes(value as T[keyof T])) {
    return value as T[keyof T];
  }

  // If the value is a string, try to match it case-insensitively
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase();
    for (const enumValue of enumValues) {
      if (typeof enumValue === 'string' && enumValue.toLowerCase() === lowerValue) {
        return enumValue as T[keyof T];
      }
    }
  }

  // If the value is a number or string number, try to match it as a numeric enum value
  const numericValue = typeof value === 'string' ? Number(value) : value;
  if (typeof numericValue === 'number' && !isNaN(numericValue)) {
    if (enumValues.includes(numericValue as T[keyof T])) {
      return numericValue as T[keyof T];
    }
  }

  throw new TypeConversionError(
    value,
    'enum',
    `Invalid enum value: '${value}'. Expected one of: ${enumValues.join(', ')}`
  );
}

/**
 * Safely converts a value to a specific type based on the target type name.
 * 
 * @param value - The value to convert
 * @param targetType - The name of the target type
 * @param options - Conversion options
 * @returns The converted value
 * @throws {TypeConversionError} If conversion fails
 */
export function convertTo(
  value: unknown,
  targetType: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array',
  options?: StringConversionOptions | NumberConversionOptions | BooleanConversionOptions | DateConversionOptions
): unknown {
  switch (targetType) {
    case 'string':
      return toString(value, options as StringConversionOptions);
    case 'number':
      return toNumber(value, options as NumberConversionOptions);
    case 'boolean':
      return toBoolean(value, options as BooleanConversionOptions);
    case 'date':
      return toDate(value, options as DateConversionOptions);
    case 'object':
      return toObject(value);
    case 'array':
      return toArray(value, item => item);
    default:
      throw new TypeConversionError(value, targetType, `Unsupported target type: ${targetType}`);
  }
}
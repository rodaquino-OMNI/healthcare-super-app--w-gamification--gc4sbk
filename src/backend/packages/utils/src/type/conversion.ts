/**
 * Type conversion utilities that safely transform values between different types.
 * Unlike native type casting, these functions handle edge cases like null values,
 * invalid inputs, and type mismatches, preventing runtime errors during data processing.
 */

import { isValidDate } from '@backend/packages/utils/src/date';

/**
 * Safely converts a value to a string.
 * 
 * @param value - The value to convert to a string
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns The string representation of the value, or the default value if conversion fails
 */
export function toString(value: any, defaultValue: string = ''): string {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.join(',');
  }

  try {
    return String(value);
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Safely converts a value to a number.
 * 
 * @param value - The value to convert to a number
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns The numeric representation of the value, or the default value if conversion fails
 */
export function toNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  if (typeof value === 'string') {
    // Handle empty strings
    if (value.trim() === '') {
      return defaultValue;
    }

    // Handle numeric strings with commas (e.g., "1,000.50")
    const normalizedValue = value.replace(/,/g, '');
    
    // Try parsing as a number
    const parsedValue = Number(normalizedValue);
    
    // Check if the result is a valid number
    if (!isNaN(parsedValue) && isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return defaultValue;
}

/**
 * Safely converts a value to a boolean.
 * 
 * @param value - The value to convert to a boolean
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns The boolean representation of the value, or the default value if conversion fails
 */
export function toBoolean(value: any, defaultValue: boolean = false): boolean {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const lowercaseValue = value.toLowerCase().trim();
    
    // Handle common string representations of boolean values
    if (['true', 'yes', 'y', '1', 'on'].includes(lowercaseValue)) {
      return true;
    }
    
    if (['false', 'no', 'n', '0', 'off'].includes(lowercaseValue)) {
      return false;
    }
    
    // If the string is not a recognized boolean value, return the default
    return defaultValue;
  }

  return Boolean(value);
}

/**
 * Safely converts a value to a Date object.
 * 
 * @param value - The value to convert to a Date
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns The Date representation of the value, or the default value if conversion fails
 */
export function toDate(value: any, defaultValue: Date | null = null): Date | null {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  if (value instanceof Date) {
    return isValidDate(value) ? value : defaultValue;
  }

  if (typeof value === 'number') {
    const date = new Date(value);
    return isValidDate(date) ? date : defaultValue;
  }

  if (typeof value === 'string') {
    // Handle empty strings
    if (value.trim() === '') {
      return defaultValue;
    }

    try {
      // Try parsing as ISO date string
      const date = new Date(value);
      return isValidDate(date) ? date : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }

  return defaultValue;
}

/**
 * Safely converts a value to an array.
 * 
 * @param value - The value to convert to an array
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns The array representation of the value, or the default value if conversion fails
 */
export function toArray<T = any>(value: any, defaultValue: T[] = []): T[] {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  if (Array.isArray(value)) {
    return value as T[];
  }

  if (typeof value === 'string') {
    // Handle empty strings
    if (value.trim() === '') {
      return defaultValue;
    }

    // Split comma-separated string into array
    return value.split(',').map(item => item.trim()) as unknown as T[];
  }

  // For other types, wrap in an array
  try {
    return [value] as T[];
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Safely converts a value to an integer.
 * 
 * @param value - The value to convert to an integer
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns The integer representation of the value, or the default value if conversion fails
 */
export function toInteger(value: any, defaultValue: number = 0): number {
  const num = toNumber(value, defaultValue);
  return Math.floor(num);
}

/**
 * Safely converts a value to a float with specified precision.
 * 
 * @param value - The value to convert to a float
 * @param precision - Number of decimal places (default: 2)
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns The float representation of the value with specified precision, or the default value if conversion fails
 */
export function toFloat(value: any, precision: number = 2, defaultValue: number = 0): number {
  const num = toNumber(value, defaultValue);
  const multiplier = Math.pow(10, precision);
  return Math.round(num * multiplier) / multiplier;
}

/**
 * Safely converts a value to a JSON string.
 * 
 * @param value - The value to convert to a JSON string
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns The JSON string representation of the value, or the default value if conversion fails
 */
export function toJson(value: any, defaultValue: string = '{}'): string {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  try {
    return JSON.stringify(value);
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Safely parses a JSON string to an object.
 * 
 * @param value - The JSON string to parse
 * @param defaultValue - Optional default value to return if parsing fails
 * @returns The parsed object, or the default value if parsing fails
 */
export function fromJson<T = any>(value: string, defaultValue: T | null = null): T | null {
  if (value === null || value === undefined || value.trim() === '') {
    return defaultValue;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Safely converts a value to a Map.
 * 
 * @param value - The value to convert to a Map (object or array of [key, value] pairs)
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns The Map representation of the value, or the default value if conversion fails
 */
export function toMap<K = string, V = any>(value: any, defaultValue: Map<K, V> = new Map<K, V>()): Map<K, V> {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  if (value instanceof Map) {
    return value as Map<K, V>;
  }

  try {
    if (Array.isArray(value)) {
      // Handle array of [key, value] pairs
      return new Map(value) as Map<K, V>;
    }

    if (typeof value === 'object') {
      // Handle plain object
      return new Map(Object.entries(value)) as unknown as Map<K, V>;
    }
  } catch (error) {
    return defaultValue;
  }

  return defaultValue;
}

/**
 * Safely converts a value to a Set.
 * 
 * @param value - The value to convert to a Set (array or comma-separated string)
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns The Set representation of the value, or the default value if conversion fails
 */
export function toSet<T = any>(value: any, defaultValue: Set<T> = new Set<T>()): Set<T> {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  if (value instanceof Set) {
    return value as Set<T>;
  }

  try {
    if (Array.isArray(value)) {
      return new Set(value) as Set<T>;
    }

    if (typeof value === 'string') {
      // Handle comma-separated string
      if (value.trim() === '') {
        return defaultValue;
      }
      return new Set(value.split(',').map(item => item.trim())) as unknown as Set<T>;
    }

    // For other types, create a set with a single value
    return new Set([value]) as Set<T>;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Safely converts a value to a specific enum type.
 * 
 * @param enumType - The enum type to convert to
 * @param value - The value to convert
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns The enum value, or the default value if conversion fails
 */
export function toEnum<T extends object>(enumType: T, value: any, defaultValue: T[keyof T]): T[keyof T] {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  // Check if the value exists in the enum
  const enumValues = Object.values(enumType);
  if (enumValues.includes(value)) {
    return value as T[keyof T];
  }

  // If the value is a string, try to match it to an enum key (case-insensitive)
  if (typeof value === 'string') {
    const normalizedValue = value.toLowerCase();
    const enumKeys = Object.keys(enumType).filter(k => isNaN(Number(k)));
    
    for (const key of enumKeys) {
      if (key.toLowerCase() === normalizedValue) {
        return enumType[key as keyof T];
      }
    }
  }

  return defaultValue;
}

/**
 * Safely converts a value to a URL object.
 * 
 * @param value - The value to convert to a URL
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns The URL object, or the default value if conversion fails
 */
export function toUrl(value: any, defaultValue: URL | null = null): URL | null {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  if (value instanceof URL) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      return new URL(value);
    } catch (error) {
      return defaultValue;
    }
  }

  return defaultValue;
}

/**
 * Safely converts a value to a specific type based on the target type name.
 * 
 * @param value - The value to convert
 * @param targetType - The name of the target type ('string', 'number', 'boolean', 'date', etc.)
 * @param defaultValue - Optional default value to return if conversion fails
 * @returns The converted value, or the default value if conversion fails
 */
export function convertTo<T = any>(value: any, targetType: string, defaultValue?: T): T {
  switch (targetType.toLowerCase()) {
    case 'string':
      return toString(value, defaultValue as string) as unknown as T;
    case 'number':
      return toNumber(value, defaultValue as number) as unknown as T;
    case 'boolean':
      return toBoolean(value, defaultValue as boolean) as unknown as T;
    case 'date':
      return toDate(value, defaultValue as Date | null) as unknown as T;
    case 'array':
      return toArray(value, defaultValue as any[]) as unknown as T;
    case 'integer':
      return toInteger(value, defaultValue as number) as unknown as T;
    case 'float':
      return toFloat(value, 2, defaultValue as number) as unknown as T;
    case 'json':
      return toJson(value, defaultValue as string) as unknown as T;
    case 'map':
      return toMap(value, defaultValue as Map<any, any>) as unknown as T;
    case 'set':
      return toSet(value, defaultValue as Set<any>) as unknown as T;
    case 'url':
      return toUrl(value, defaultValue as URL | null) as unknown as T;
    default:
      return (value === null || value === undefined) ? (defaultValue as T) : (value as T);
  }
}
/**
 * Type conversion utilities for safely transforming values between different types.
 * These utilities handle edge cases like null values, invalid inputs, and type mismatches,
 * preventing runtime errors during data processing across all journey services.
 *
 * @module conversion
 */

import { isValid } from 'date-fns';

/**
 * Checks if a value is null or undefined
 * 
 * @param value - The value to check
 * @returns True if the value is null or undefined, false otherwise
 */
export const isNullOrUndefined = (value: any): boolean => {
  return value === null || value === undefined;
};

/**
 * Safely converts a value to a string
 * 
 * @param value - The value to convert to a string
 * @param defaultValue - The default value to return if conversion fails (defaults to '')
 * @returns The string representation of the value or the default value
 */
export const toString = (value: any, defaultValue: string = ''): string => {
  if (isNullOrUndefined(value)) {
    return defaultValue;
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  try {
    // Handle objects and arrays
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    // Convert other primitive types
    return String(value);
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Safely converts a value to a number
 * 
 * @param value - The value to convert to a number
 * @param defaultValue - The default value to return if conversion fails (defaults to 0)
 * @returns The numeric representation of the value or the default value
 */
export const toNumber = (value: any, defaultValue: number = 0): number => {
  if (isNullOrUndefined(value)) {
    return defaultValue;
  }
  
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  
  if (value === '') {
    return defaultValue;
  }
  
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  
  if (value instanceof Date) {
    return value.getTime();
  }
  
  try {
    const converted = Number(value);
    return isNaN(converted) ? defaultValue : converted;
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Safely converts a value to an integer
 * 
 * @param value - The value to convert to an integer
 * @param defaultValue - The default value to return if conversion fails (defaults to 0)
 * @returns The integer representation of the value or the default value
 */
export const toInteger = (value: any, defaultValue: number = 0): number => {
  const num = toNumber(value, defaultValue);
  return Math.floor(num);
};

/**
 * Safely converts a value to a float
 * 
 * @param value - The value to convert to a float
 * @param defaultValue - The default value to return if conversion fails (defaults to 0)
 * @param precision - The number of decimal places to round to (optional)
 * @returns The float representation of the value or the default value
 */
export const toFloat = (value: any, defaultValue: number = 0, precision?: number): number => {
  const num = toNumber(value, defaultValue);
  
  if (precision !== undefined) {
    const multiplier = Math.pow(10, precision);
    return Math.round(num * multiplier) / multiplier;
  }
  
  return num;
};

/**
 * Safely converts a value to a boolean
 * 
 * @param value - The value to convert to a boolean
 * @param defaultValue - The default value to return if conversion fails (defaults to false)
 * @returns The boolean representation of the value or the default value
 */
export const toBoolean = (value: any, defaultValue: boolean = false): boolean => {
  if (isNullOrUndefined(value)) {
    return defaultValue;
  }
  
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim();
    
    // Handle common string representations of boolean values
    if (['true', 't', 'yes', 'y', '1', 'sim', 's'].includes(normalized)) {
      return true;
    }
    
    if (['false', 'f', 'no', 'n', '0', 'não', 'nao'].includes(normalized)) {
      return false;
    }
    
    return defaultValue;
  }
  
  return Boolean(value);
};

/**
 * Safely converts a value to a Date object
 * 
 * @param value - The value to convert to a Date
 * @param defaultValue - The default value to return if conversion fails (defaults to null)
 * @returns The Date representation of the value or the default value
 */
export const toDate = (value: any, defaultValue: Date | null = null): Date | null => {
  if (isNullOrUndefined(value)) {
    return defaultValue;
  }
  
  if (value instanceof Date) {
    return isValid(value) ? value : defaultValue;
  }
  
  try {
    if (typeof value === 'number') {
      const date = new Date(value);
      return isValid(date) ? date : defaultValue;
    }
    
    if (typeof value === 'string') {
      // Try parsing ISO format first
      const date = new Date(value);
      if (isValid(date)) {
        return date;
      }
      
      // Try parsing common date formats (DD/MM/YYYY)
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
        const [day, month, year] = value.split('/').map(Number);
        const parsedDate = new Date(year, month - 1, day);
        return isValid(parsedDate) ? parsedDate : defaultValue;
      }
      
      return defaultValue;
    }
    
    return defaultValue;
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Safely converts a value to an array
 * 
 * @param value - The value to convert to an array
 * @param defaultValue - The default value to return if conversion fails (defaults to empty array)
 * @returns The array representation of the value or the default value
 */
export const toArray = <T>(value: any, defaultValue: T[] = []): T[] => {
  if (isNullOrUndefined(value)) {
    return defaultValue;
  }
  
  if (Array.isArray(value)) {
    return value as T[];
  }
  
  try {
    // Handle string JSON arrays
    if (typeof value === 'string' && value.trim().startsWith('[') && value.trim().endsWith(']')) {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value] as unknown as T[];
      } catch {
        return [value] as unknown as T[];
      }
    }
    
    // Handle other values by wrapping in array
    return [value] as unknown as T[];
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Safely converts a value to an object
 * 
 * @param value - The value to convert to an object
 * @param defaultValue - The default value to return if conversion fails (defaults to empty object)
 * @returns The object representation of the value or the default value
 */
export const toObject = <T extends object>(value: any, defaultValue: T = {} as T): T => {
  if (isNullOrUndefined(value)) {
    return defaultValue;
  }
  
  if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
    return value as T;
  }
  
  try {
    // Handle string JSON objects
    if (typeof value === 'string' && value.trim().startsWith('{') && value.trim().endsWith('}')) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return defaultValue;
      }
    }
    
    return defaultValue;
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Safely converts a value to a Map
 * 
 * @param value - The value to convert to a Map
 * @param defaultValue - The default value to return if conversion fails (defaults to empty Map)
 * @returns The Map representation of the value or the default value
 */
export const toMap = <K, V>(value: any, defaultValue: Map<K, V> = new Map<K, V>()): Map<K, V> => {
  if (isNullOrUndefined(value)) {
    return defaultValue;
  }
  
  if (value instanceof Map) {
    return value as Map<K, V>;
  }
  
  try {
    // Convert object to Map
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      return new Map(Object.entries(value)) as unknown as Map<K, V>;
    }
    
    // Handle string JSON objects
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null) {
          return new Map(Object.entries(parsed)) as unknown as Map<K, V>;
        }
      } catch {
        return defaultValue;
      }
    }
    
    return defaultValue;
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Safely converts a value to a Set
 * 
 * @param value - The value to convert to a Set
 * @param defaultValue - The default value to return if conversion fails (defaults to empty Set)
 * @returns The Set representation of the value or the default value
 */
export const toSet = <T>(value: any, defaultValue: Set<T> = new Set<T>()): Set<T> => {
  if (isNullOrUndefined(value)) {
    return defaultValue;
  }
  
  if (value instanceof Set) {
    return value as Set<T>;
  }
  
  try {
    // Convert array to Set
    if (Array.isArray(value)) {
      return new Set(value) as Set<T>;
    }
    
    // Handle string JSON arrays
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return new Set(parsed) as Set<T>;
        }
      } catch {
        // If not a valid JSON, create a set with the string as a single item
        return new Set([value]) as unknown as Set<T>;
      }
    }
    
    // For other values, create a set with the value as a single item
    return new Set([value]) as unknown as Set<T>;
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Safely converts a value to an enum value
 * 
 * @param value - The value to convert to an enum value
 * @param enumObject - The enum object to convert to
 * @param defaultValue - The default value to return if conversion fails
 * @returns The enum value or the default value
 */
export const toEnum = <T extends object>(value: any, enumObject: T, defaultValue: T[keyof T]): T[keyof T] => {
  if (isNullOrUndefined(value)) {
    return defaultValue;
  }
  
  // Check if the value is a valid enum value
  const enumValues = Object.values(enumObject);
  if (enumValues.includes(value)) {
    return value as T[keyof T];
  }
  
  // Check if the value is a valid enum key (case insensitive)
  if (typeof value === 'string') {
    const normalizedValue = value.toLowerCase();
    const enumKeys = Object.keys(enumObject);
    
    for (const key of enumKeys) {
      if (key.toLowerCase() === normalizedValue) {
        return enumObject[key as keyof T];
      }
    }
  }
  
  return defaultValue;
};

/**
 * Safely converts a value to a URL
 * 
 * @param value - The value to convert to a URL
 * @param defaultValue - The default value to return if conversion fails (defaults to null)
 * @returns The URL object or the default value
 */
export const toURL = (value: any, defaultValue: URL | null = null): URL | null => {
  if (isNullOrUndefined(value)) {
    return defaultValue;
  }
  
  if (value instanceof URL) {
    return value;
  }
  
  try {
    if (typeof value === 'string') {
      return new URL(value);
    }
    
    return defaultValue;
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Safely converts a value to a journey-specific format
 * 
 * @param value - The value to convert
 * @param journeyId - The journey identifier (health, care, plan)
 * @param type - The target type to convert to
 * @param defaultValue - The default value to return if conversion fails
 * @returns The converted value in a journey-specific format or the default value
 */
export const toJourneyFormat = <T>(value: any, journeyId: string, type: string, defaultValue: T): T => {
  if (isNullOrUndefined(value)) {
    return defaultValue;
  }
  
  try {
    // Journey-specific conversions
    switch (journeyId.toLowerCase()) {
      case 'health':
        // Health journey specific conversions
        if (type === 'date' && (typeof value === 'string' || value instanceof Date)) {
          const date = toDate(value);
          if (date) {
            // Format for health metrics (with time)
            return date.toISOString() as unknown as T;
          }
        }
        break;
        
      case 'care':
        // Care journey specific conversions
        if (type === 'date' && (typeof value === 'string' || value instanceof Date)) {
          const date = toDate(value);
          if (date) {
            // Format for appointments (date only)
            return date.toISOString().split('T')[0] as unknown as T;
          }
        }
        break;
        
      case 'plan':
        // Plan journey specific conversions
        if (type === 'currency' && (typeof value === 'string' || typeof value === 'number')) {
          const number = toNumber(value);
          // Format as BRL currency
          return number.toFixed(2) as unknown as T;
        }
        break;
    }
    
    // Default conversions based on type
    switch (type) {
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
      case 'object':
        return toObject(value, defaultValue as object) as unknown as T;
      default:
        return defaultValue;
    }
  } catch (error) {
    return defaultValue;
  }
};

// Circuit breaker state (shared across all calls)
const circuitState = {
  failures: 0,
  isOpen: false,
  lastFailureTime: 0
};

/**
 * Safely converts a value with retry mechanism for flaky operations
 * 
 * @param value - The value to convert
 * @param conversionFn - The conversion function to apply
 * @param defaultValue - The default value to return if all retries fail
 * @param maxRetries - Maximum number of retry attempts (defaults to 3)
 * @param delayMs - Delay between retries in milliseconds (defaults to 100)
 * @returns The converted value or the default value
 */
export const withRetry = async <T, U>(
  value: T,
  conversionFn: (val: T) => Promise<U>,
  defaultValue: U,
  maxRetries: number = 3,
  delayMs: number = 100
): Promise<U> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await conversionFn(value);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Wait before next retry
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt))); // Exponential backoff
      }
    }
  }
  
  console.error(`Conversion failed after ${maxRetries} retries:`, lastError);
  return defaultValue;
};

/**
 * Safely converts a value with optimistic locking for concurrent operations
 * 
 * @param value - The value to convert
 * @param conversionFn - The conversion function to apply
 * @param versionFn - Function to get the current version of the value
 * @param updateFn - Function to update the value if version matches
 * @param defaultValue - The default value to return if update fails
 * @param maxRetries - Maximum number of retry attempts (defaults to 3)
 * @returns The converted value or the default value
 */
export const withOptimisticLock = async <T, U>(
  value: T,
  conversionFn: (val: T) => Promise<U>,
  versionFn: (val: T) => Promise<number>,
  updateFn: (val: U, version: number) => Promise<boolean>,
  defaultValue: U,
  maxRetries: number = 3
): Promise<U> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Get current version
      const version = await versionFn(value);
      
      // Perform conversion
      const converted = await conversionFn(value);
      
      // Try to update with version check
      const success = await updateFn(converted, version);
      
      if (success) {
        return converted;
      }
      
      // If update failed due to version mismatch, retry
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt))); // Exponential backoff
      }
    } catch (error) {
      console.error(`Optimistic lock attempt ${attempt + 1} failed:`, error);
      
      if (attempt >= maxRetries - 1) {
        return defaultValue;
      }
    }
  }
  
  return defaultValue;
};

/**
 * Safely converts a value with circuit breaker pattern for unreliable operations
 * 
 * @param value - The value to convert
 * @param conversionFn - The conversion function to apply
 * @param defaultValue - The default value to return if circuit is open
 * @param options - Circuit breaker options
 * @returns The converted value or the default value
 */
export const withCircuitBreaker = async <T, U>(
  value: T,
  conversionFn: (val: T) => Promise<U>,
  defaultValue: U,
  options: {
    failureThreshold: number;
    resetTimeout: number;
    fallbackFn?: (val: T) => Promise<U>;
  } = { failureThreshold: 5, resetTimeout: 30000 }
): Promise<U> => {
  // Check if circuit is open
  if (circuitState.isOpen) {
    const now = Date.now();
    if (now - circuitState.lastFailureTime > options.resetTimeout) {
      // Reset circuit after timeout
      circuitState.isOpen = false;
      circuitState.failures = 0;
    } else {
      // Circuit is open, use fallback or default
      if (options.fallbackFn) {
        try {
          return await options.fallbackFn(value);
        } catch {
          return defaultValue;
        }
      }
      return defaultValue;
    }
  }
  
  try {
    // Attempt conversion
    const result = await conversionFn(value);
    
    // Successful call, reset failure count
    circuitState.failures = 0;
    return result;
  } catch (error) {
    // Increment failure count
    circuitState.failures++;
    circuitState.lastFailureTime = Date.now();
    
    // Check if threshold reached
    if (circuitState.failures >= options.failureThreshold) {
      circuitState.isOpen = true;
    }
    
    // Use fallback or default
    if (options.fallbackFn) {
      try {
        return await options.fallbackFn(value);
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  }
};
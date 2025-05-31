/**
 * Environment variable transformation utilities
 * 
 * This module provides functions for transforming environment variables from
 * string values to strongly-typed values (numbers, booleans, arrays, JSON objects).
 * These utilities ensure consistent parsing and transformation of environment
 * variables across services.
 */

import { z } from 'zod';

/**
 * Parses a string value to a boolean
 * 
 * Accepts various string representations of boolean values:
 * - true values: "true", "yes", "1", "on"
 * - false values: "false", "no", "0", "off"
 * 
 * @param value - The string value to parse
 * @param defaultValue - Optional default value if parsing fails
 * @returns The parsed boolean value
 * @throws Error if the value cannot be parsed and no default is provided
 */
export const parseBoolean = (value: string | undefined, defaultValue?: boolean): boolean => {
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error('Cannot parse undefined or empty string to boolean');
  }

  const normalizedValue = value.toLowerCase().trim();
  
  if (['true', 'yes', '1', 'on'].includes(normalizedValue)) {
    return true;
  }
  
  if (['false', 'no', '0', 'off'].includes(normalizedValue)) {
    return false;
  }
  
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  
  throw new Error(`Cannot parse value "${value}" to boolean`);
};

/**
 * Parses a string value to a number
 * 
 * @param value - The string value to parse
 * @param options - Optional configuration
 * @param options.min - Minimum allowed value (inclusive)
 * @param options.max - Maximum allowed value (inclusive)
 * @param options.defaultValue - Default value if parsing fails
 * @returns The parsed number value
 * @throws Error if the value cannot be parsed or is outside the specified range
 */
export const parseNumber = (
  value: string | undefined,
  options?: {
    min?: number;
    max?: number;
    defaultValue?: number;
  }
): number => {
  const { min, max, defaultValue } = options || {};
  
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error('Cannot parse undefined or empty string to number');
  }
  
  const trimmedValue = value.trim();
  const parsedValue = Number(trimmedValue);
  
  if (isNaN(parsedValue)) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Cannot parse value "${value}" to number`);
  }
  
  if (min !== undefined && parsedValue < min) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Value ${parsedValue} is less than minimum allowed value ${min}`);
  }
  
  if (max !== undefined && parsedValue > max) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Value ${parsedValue} is greater than maximum allowed value ${max}`);
  }
  
  return parsedValue;
};

/**
 * Parses a string value to an array
 * 
 * Supports multiple delimiter formats:
 * - CSV format: "value1,value2,value3"
 * - Semicolon format: "value1;value2;value3"
 * - Space format: "value1 value2 value3"
 * - JSON array format: "[\"value1\",\"value2\",\"value3\"]"
 * 
 * @param value - The string value to parse
 * @param options - Optional configuration
 * @param options.delimiter - Custom delimiter (defaults to auto-detection)
 * @param options.transform - Function to transform each item in the array
 * @param options.defaultValue - Default value if parsing fails
 * @returns The parsed array
 * @throws Error if the value cannot be parsed
 */
export const parseArray = <T = string>(
  value: string | undefined,
  options?: {
    delimiter?: string;
    transform?: (item: string) => T;
    defaultValue?: T[];
  }
): T[] => {
  const { delimiter, transform, defaultValue } = options || {};
  
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error('Cannot parse undefined or empty string to array');
  }
  
  // Try to parse as JSON array first
  if (value.trim().startsWith('[') && value.trim().endsWith(']')) {
    try {
      const parsedArray = JSON.parse(value);
      if (Array.isArray(parsedArray)) {
        return transform ? parsedArray.map(item => transform(String(item))) : parsedArray as unknown as T[];
      }
    } catch (error) {
      // If JSON parsing fails, continue with other methods
    }
  }
  
  // Determine delimiter if not provided
  let effectiveDelimiter = delimiter;
  if (!effectiveDelimiter) {
    if (value.includes(',')) {
      effectiveDelimiter = ',';
    } else if (value.includes(';')) {
      effectiveDelimiter = ';';
    } else {
      effectiveDelimiter = ' ';
    }
  }
  
  const items = value
    .split(effectiveDelimiter)
    .map(item => item.trim())
    .filter(item => item.length > 0);
  
  if (transform) {
    return items.map(transform);
  }
  
  return items as unknown as T[];
};

/**
 * Parses a string value to a JSON object
 * 
 * @param value - The string value to parse
 * @param schema - Optional Zod schema for validation
 * @param defaultValue - Default value if parsing fails
 * @returns The parsed JSON object
 * @throws Error if the value cannot be parsed or fails schema validation
 */
export const parseJson = <T = any>(
  value: string | undefined,
  schema?: z.ZodType<T>,
  defaultValue?: T
): T => {
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error('Cannot parse undefined or empty string to JSON');
  }
  
  try {
    const parsedValue = JSON.parse(value);
    
    if (schema) {
      try {
        return schema.parse(parsedValue);
      } catch (validationError) {
        if (defaultValue !== undefined) {
          return defaultValue;
        }
        if (validationError instanceof z.ZodError) {
          const formattedErrors = validationError.errors
            .map(err => `${err.path.join('.')}: ${err.message}`)
            .join(', ');
          throw new Error(`JSON validation failed: ${formattedErrors}`);
        }
        throw validationError;
      }
    }
    
    return parsedValue as T;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('JSON validation failed')) {
      throw error;
    }
    
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    
    throw new Error(`Cannot parse value to JSON: ${(error as Error).message}`);
  }
};

/**
 * Parses a string value to a URL
 * 
 * @param value - The string value to parse
 * @param options - Optional configuration
 * @param options.protocols - Allowed protocols (e.g., ['http', 'https'])
 * @param options.requireTld - Whether to require a top-level domain
 * @param options.defaultValue - Default value if parsing fails
 * @returns The parsed URL object
 * @throws Error if the value cannot be parsed or doesn't meet requirements
 */
export const parseUrl = (
  value: string | undefined,
  options?: {
    protocols?: string[];
    requireTld?: boolean;
    defaultValue?: URL;
  }
): URL => {
  const { protocols, requireTld = true, defaultValue } = options || {};
  
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error('Cannot parse undefined or empty string to URL');
  }
  
  try {
    const url = new URL(value);
    
    // Validate protocol if specified
    if (protocols && protocols.length > 0) {
      const urlProtocol = url.protocol.replace(':', '');
      if (!protocols.includes(urlProtocol)) {
        if (defaultValue !== undefined) {
          return defaultValue;
        }
        throw new Error(`URL protocol "${urlProtocol}" is not allowed. Allowed protocols: ${protocols.join(', ')}`);
      }
    }
    
    // Validate TLD if required
    if (requireTld && !url.hostname.includes('.')) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error('URL must include a top-level domain');
    }
    
    return url;
  } catch (error) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    
    if (error instanceof Error && (error.message.includes('protocol') || error.message.includes('top-level domain'))) {
      throw error;
    }
    
    throw new Error(`Invalid URL: ${value}`);
  }
};

/**
 * Parses a string value to a numeric range
 * 
 * Supports formats:
 * - Single number: "5" (becomes [5, 5])
 * - Range with hyphen: "5-10" (becomes [5, 10])
 * - Range with separator: "5:10" (becomes [5, 10])
 * 
 * @param value - The string value to parse
 * @param options - Optional configuration
 * @param options.separator - Custom range separator (defaults to '-')
 * @param options.min - Minimum allowed value (inclusive)
 * @param options.max - Maximum allowed value (inclusive)
 * @param options.defaultValue - Default value if parsing fails
 * @returns The parsed range as [min, max]
 * @throws Error if the value cannot be parsed or is outside allowed bounds
 */
export const parseRange = (
  value: string | undefined,
  options?: {
    separator?: string;
    min?: number;
    max?: number;
    defaultValue?: [number, number];
  }
): [number, number] => {
  const { separator = '-', min, max, defaultValue } = options || {};
  
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error('Cannot parse undefined or empty string to range');
  }
  
  const trimmedValue = value.trim();
  
  // Handle single number case
  if (!trimmedValue.includes(separator) && !trimmedValue.includes(':')) {
    const singleValue = parseNumber(trimmedValue);
    
    if (min !== undefined && singleValue < min) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Value ${singleValue} is less than minimum allowed value ${min}`);
    }
    
    if (max !== undefined && singleValue > max) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Value ${singleValue} is greater than maximum allowed value ${max}`);
    }
    
    return [singleValue, singleValue];
  }
  
  // Handle range case
  const effectiveSeparator = trimmedValue.includes(separator) ? separator : ':';
  const [minStr, maxStr] = trimmedValue.split(effectiveSeparator, 2);
  
  const minValue = parseNumber(minStr);
  const maxValue = parseNumber(maxStr);
  
  if (minValue > maxValue) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Invalid range: minimum value ${minValue} is greater than maximum value ${maxValue}`);
  }
  
  if (min !== undefined && minValue < min) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Minimum value ${minValue} is less than allowed minimum ${min}`);
  }
  
  if (max !== undefined && maxValue > max) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Maximum value ${maxValue} is greater than allowed maximum ${max}`);
  }
  
  return [minValue, maxValue];
};

/**
 * Parses a string value to an enum value
 * 
 * @param value - The string value to parse
 * @param enumValues - Array of allowed enum values
 * @param options - Optional configuration
 * @param options.caseSensitive - Whether comparison is case-sensitive (default: false)
 * @param options.defaultValue - Default value if parsing fails
 * @returns The parsed enum value
 * @throws Error if the value is not in the allowed enum values
 */
export const parseEnum = <T extends string>(
  value: string | undefined,
  enumValues: readonly T[],
  options?: {
    caseSensitive?: boolean;
    defaultValue?: T;
  }
): T => {
  const { caseSensitive = false, defaultValue } = options || {};
  
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Cannot parse undefined or empty string to enum. Allowed values: ${enumValues.join(', ')}`);
  }
  
  const normalizedValue = caseSensitive ? value.trim() : value.trim().toLowerCase();
  const normalizedEnumValues = caseSensitive 
    ? enumValues 
    : enumValues.map(v => v.toLowerCase()) as unknown as readonly T[];
  
  const index = normalizedEnumValues.indexOf(normalizedValue as T);
  
  if (index !== -1) {
    return enumValues[index];
  }
  
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  
  throw new Error(`Value "${value}" is not in allowed enum values: ${enumValues.join(', ')}`);
};
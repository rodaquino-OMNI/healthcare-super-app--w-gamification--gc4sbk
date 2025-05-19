/**
 * Environment Variable Transformation Utilities
 * 
 * This module provides utilities for transforming environment variables from strings
 * to various data types with comprehensive error handling and type safety.
 */

/**
 * Parses a string value to a boolean
 * 
 * @param value - The string value to parse
 * @returns The parsed boolean value
 * 
 * @example
 * // Returns true
 * parseBoolean('true')
 * parseBoolean('TRUE')
 * parseBoolean('1')
 * parseBoolean('yes')
 * 
 * // Returns false
 * parseBoolean('false')
 * parseBoolean('FALSE')
 * parseBoolean('0')
 * parseBoolean('no')
 */
export const parseBoolean = (value: string): boolean => {
  if (!value) return false;
  
  const normalizedValue = value.toLowerCase().trim();
  
  return [
    'true', 'yes', '1', 'y', 'on'
  ].includes(normalizedValue);
};

/**
 * Parses a string value to a number
 * 
 * @param value - The string value to parse
 * @param defaultValue - Optional default value if parsing fails
 * @returns The parsed number value or the default value if provided
 * @throws Error if parsing fails and no default value is provided
 * 
 * @example
 * // Returns 42
 * parseNumber('42')
 * 
 * // Returns 3.14
 * parseNumber('3.14')
 * 
 * // Returns 0 (default value) when parsing fails
 * parseNumber('not-a-number', 0)
 */
export const parseNumber = (value: string, defaultValue?: number): number => {
  if (value === undefined || value === null || value.trim() === '') {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Cannot parse empty value to number`);
  }
  
  const parsedValue = Number(value);
  
  if (isNaN(parsedValue)) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Cannot parse value "${value}" to number`);
  }
  
  return parsedValue;
};

/**
 * Parses a string value to an array by splitting on a delimiter
 * 
 * @param value - The string value to parse
 * @param delimiter - The delimiter to split on (default: ',')
 * @returns The parsed array of strings
 * 
 * @example
 * // Returns ['a', 'b', 'c']
 * parseArray('a,b,c')
 * 
 * // Returns ['a', 'b', 'c'] with custom delimiter
 * parseArray('a|b|c', '|')
 * 
 * // Returns [] for empty string
 * parseArray('')
 */
export const parseArray = (value: string, delimiter: string = ','): string[] => {
  if (!value) return [];
  
  return value
    .split(delimiter)
    .map(item => item.trim())
    .filter(item => item.length > 0);
};

/**
 * Parses a string value to an array of numbers
 * 
 * @param value - The string value to parse
 * @param delimiter - The delimiter to split on (default: ',')
 * @returns The parsed array of numbers
 * @throws Error if any value in the array cannot be parsed to a number
 * 
 * @example
 * // Returns [1, 2, 3]
 * parseNumberArray('1,2,3')
 * 
 * // Returns [1.1, 2.2, 3.3] with custom delimiter
 * parseNumberArray('1.1|2.2|3.3', '|')
 */
export const parseNumberArray = (value: string, delimiter: string = ','): number[] => {
  const stringArray = parseArray(value, delimiter);
  
  return stringArray.map((item, index) => {
    const parsedValue = Number(item);
    
    if (isNaN(parsedValue)) {
      throw new Error(`Cannot parse array item at index ${index} ("${item}") to number`);
    }
    
    return parsedValue;
  });
};

/**
 * Parses a string value to a JSON object
 * 
 * @param value - The string value to parse
 * @param defaultValue - Optional default value if parsing fails
 * @returns The parsed JSON object or the default value if provided
 * @throws Error if parsing fails and no default value is provided
 * 
 * @example
 * // Returns { name: 'test' }
 * parseJson('{"name":"test"}')
 * 
 * // Returns default value when parsing fails
 * parseJson('invalid-json', { default: true })
 */
export const parseJson = <T = any>(value: string, defaultValue?: T): T => {
  if (!value) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error('Cannot parse empty value to JSON');
  }
  
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Cannot parse value to JSON: ${(error as Error).message}`);
  }
};

/**
 * Parses a CSV string to an array of objects
 * 
 * @param value - The CSV string to parse
 * @param options - Optional parsing options
 * @returns Array of objects parsed from CSV
 * 
 * @example
 * // Returns [{name: 'John', age: '30'}, {name: 'Jane', age: '25'}]
 * parseCSV('name,age\nJohn,30\nJane,25')
 * 
 * // With custom delimiter
 * parseCSV('name;age\nJohn;30\nJane;25', { delimiter: ';' })
 */
export const parseCSV = <T = Record<string, string>>(
  value: string,
  options: { delimiter?: string; headerRow?: boolean } = {}
): T[] => {
  if (!value) return [];
  
  const delimiter = options.delimiter || ',';
  const headerRow = options.headerRow !== false; // Default to true
  
  const lines = value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  if (lines.length === 0) return [];
  
  // If no header row, return array of string arrays
  if (!headerRow) {
    return lines.map(line => {
      const values = line.split(delimiter).map(val => val.trim());
      return values as unknown as T;
    });
  }
  
  // Parse with header row
  const headers = lines[0].split(delimiter).map(header => header.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(delimiter).map(val => val.trim());
    const obj: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    
    return obj as unknown as T;
  });
};

/**
 * Parses a string value representing a numeric range
 * 
 * @param value - The string value to parse (format: 'min-max' or 'min:max')
 * @param delimiter - The delimiter separating min and max values (default: '-')
 * @returns Object with min and max values
 * @throws Error if the range format is invalid
 * 
 * @example
 * // Returns { min: 1, max: 10 }
 * parseRange('1-10')
 * 
 * // Returns { min: 1.5, max: 10.5 } with custom delimiter
 * parseRange('1.5:10.5', ':')
 */
export const parseRange = (
  value: string,
  delimiter: string = '-'
): { min: number; max: number } => {
  if (!value || !value.includes(delimiter)) {
    throw new Error(`Invalid range format: ${value}. Expected format: min${delimiter}max`);
  }
  
  const [minStr, maxStr] = value.split(delimiter, 2);
  const min = parseNumber(minStr);
  const max = parseNumber(maxStr);
  
  if (min > max) {
    throw new Error(`Invalid range: min (${min}) cannot be greater than max (${max})`);
  }
  
  return { min, max };
};

/**
 * Validates if a value is within a specified numeric range
 * 
 * @param value - The number to validate
 * @param min - The minimum allowed value
 * @param max - The maximum allowed value
 * @returns True if the value is within range, false otherwise
 * 
 * @example
 * // Returns true
 * isInRange(5, 1, 10)
 * 
 * // Returns false
 * isInRange(15, 1, 10)
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * Parses and validates a URL string
 * 
 * @param value - The URL string to parse
 * @param options - Optional validation options
 * @returns The parsed URL object
 * @throws Error if the URL is invalid or doesn't meet validation criteria
 * 
 * @example
 * // Returns URL object
 * parseUrl('https://example.com')
 * 
 * // Validates protocol
 * parseUrl('https://example.com', { protocols: ['https'] })
 */
export const parseUrl = (
  value: string,
  options: { protocols?: string[]; requireTld?: boolean } = {}
): URL => {
  if (!value) {
    throw new Error('URL cannot be empty');
  }
  
  let url: URL;
  
  try {
    url = new URL(value);
  } catch (error) {
    throw new Error(`Invalid URL: ${value}`);
  }
  
  // Validate protocol if specified
  if (options.protocols && options.protocols.length > 0) {
    const protocol = url.protocol.replace(':', '');
    if (!options.protocols.includes(protocol)) {
      throw new Error(
        `Invalid URL protocol: ${protocol}. Expected one of: ${options.protocols.join(', ')}`
      );
    }
  }
  
  // Validate TLD if required
  if (options.requireTld !== false) {
    const hostnameParts = url.hostname.split('.');
    if (hostnameParts.length < 2 || hostnameParts[hostnameParts.length - 1] === '') {
      throw new Error('URL must have a valid top-level domain');
    }
  }
  
  return url;
};

/**
 * Parses a string value to an enum value
 * 
 * @param value - The string value to parse
 * @param enumObject - The enum object to match against
 * @param defaultValue - Optional default value if parsing fails
 * @returns The matched enum value or the default value if provided
 * @throws Error if parsing fails and no default value is provided
 * 
 * @example
 * enum Color { Red = 'red', Blue = 'blue' }
 * 
 * // Returns Color.Red
 * parseEnum('red', Color)
 * 
 * // Returns default value when parsing fails
 * parseEnum('yellow', Color, Color.Blue)
 */
export const parseEnum = <T extends Record<string, string | number>>(
  value: string,
  enumObject: T,
  defaultValue?: T[keyof T]
): T[keyof T] => {
  if (!value) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error('Cannot parse empty value to enum');
  }
  
  const normalizedValue = value.toLowerCase().trim();
  
  // Check if the value exists in the enum
  const enumValues = Object.values(enumObject) as Array<string | number>;
  const enumKeys = Object.keys(enumObject);
  
  // First try direct value match
  const valueIndex = enumValues.findIndex(
    enumValue => String(enumValue).toLowerCase() === normalizedValue
  );
  
  if (valueIndex !== -1) {
    return enumValues[valueIndex] as T[keyof T];
  }
  
  // Then try key match (case insensitive)
  const keyIndex = enumKeys.findIndex(
    key => key.toLowerCase() === normalizedValue
  );
  
  if (keyIndex !== -1) {
    return enumObject[enumKeys[keyIndex]] as T[keyof T];
  }
  
  // Return default or throw error
  if (defaultValue !== undefined) return defaultValue;
  
  throw new Error(
    `Invalid enum value: ${value}. Expected one of: ${enumValues.join(', ')}`
  );
};

/**
 * Parses a duration string to milliseconds
 * 
 * @param value - The duration string (e.g., '1d', '2h', '30m', '45s', '500ms')
 * @returns The duration in milliseconds
 * @throws Error if the duration format is invalid
 * 
 * @example
 * // Returns 86400000 (1 day in ms)
 * parseDuration('1d')
 * 
 * // Returns 7200000 (2 hours in ms)
 * parseDuration('2h')
 * 
 * // Returns 1800000 (30 minutes in ms)
 * parseDuration('30m')
 */
export const parseDuration = (value: string): number => {
  if (!value) {
    throw new Error('Duration string cannot be empty');
  }
  
  const durationRegex = /^(\d+)([dhms]+)$/i;
  const match = value.match(durationRegex);
  
  if (!match) {
    // Try parsing as plain milliseconds
    const ms = parseNumber(value, NaN);
    if (!isNaN(ms)) return ms;
    
    throw new Error(
      `Invalid duration format: ${value}. Expected format: <number><unit> (e.g., 1d, 2h, 30m, 45s, 500ms)`
    );
  }
  
  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  
  switch (unit) {
    case 'd':
      return amount * 24 * 60 * 60 * 1000; // days to ms
    case 'h':
      return amount * 60 * 60 * 1000; // hours to ms
    case 'm':
      return amount * 60 * 1000; // minutes to ms
    case 's':
      return amount * 1000; // seconds to ms
    case 'ms':
      return amount; // already in ms
    default:
      throw new Error(`Unknown duration unit: ${unit}`);
  }
};

/**
 * Parses a memory size string to bytes
 * 
 * @param value - The memory size string (e.g., '1B', '2KB', '5MB', '1GB')
 * @returns The size in bytes
 * @throws Error if the size format is invalid
 * 
 * @example
 * // Returns 1024 (1KB in bytes)
 * parseMemorySize('1KB')
 * 
 * // Returns 5242880 (5MB in bytes)
 * parseMemorySize('5MB')
 */
export const parseMemorySize = (value: string): number => {
  if (!value) {
    throw new Error('Memory size string cannot be empty');
  }
  
  const sizeRegex = /^(\d+(?:\.\d+)?)\s*([BKMGT]B?)$/i;
  const match = value.match(sizeRegex);
  
  if (!match) {
    // Try parsing as plain bytes
    const bytes = parseNumber(value, NaN);
    if (!isNaN(bytes)) return bytes;
    
    throw new Error(
      `Invalid memory size format: ${value}. Expected format: <number><unit> (e.g., 1B, 2KB, 5MB, 1GB)`
    );
  }
  
  const amount = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  
  switch (unit) {
    case 'B':
      return amount;
    case 'KB':
    case 'K':
      return amount * 1024;
    case 'MB':
    case 'M':
      return amount * 1024 * 1024;
    case 'GB':
    case 'G':
      return amount * 1024 * 1024 * 1024;
    case 'TB':
    case 'T':
      return amount * 1024 * 1024 * 1024 * 1024;
    default:
      throw new Error(`Unknown memory size unit: ${unit}`);
  }
};

/**
 * Transforms a string value using a custom transformation function
 * 
 * @param value - The string value to transform
 * @param transformFn - The transformation function
 * @param defaultValue - Optional default value if transformation fails
 * @returns The transformed value or the default value if provided
 * @throws Error if transformation fails and no default value is provided
 * 
 * @example
 * // Returns transformed value
 * transform('value', (val) => val.toUpperCase())
 * 
 * // Returns default value when transformation fails
 * transform('value', (val) => { throw new Error() }, 'default')
 */
export const transform = <T>(
  value: string,
  transformFn: (value: string) => T,
  defaultValue?: T
): T => {
  if (value === undefined || value === null) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error('Cannot transform undefined or null value');
  }
  
  try {
    return transformFn(value);
  } catch (error) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(
      `Transformation failed: ${(error as Error).message || 'Unknown error'}`
    );
  }
};
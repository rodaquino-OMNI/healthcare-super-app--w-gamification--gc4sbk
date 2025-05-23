/**
 * @file String formatting utilities for consistent text manipulation across all backend services.
 * @module utils/string/format
 * @description Provides pure functions for string transformation and formatting operations.
 */

/**
 * Capitalizes the first letter of a string.
 * 
 * @example
 * ```typescript
 * capitalizeFirstLetter('hello world'); // Returns 'Hello world'
 * capitalizeFirstLetter(''); // Returns ''
 * capitalizeFirstLetter(null); // Returns ''
 * ```
 * 
 * @param str - The input string to capitalize
 * @returns The string with the first letter capitalized or an empty string for invalid inputs
 * @throws {TypeError} If the input is not a string (when not null/undefined)
 */
export const capitalizeFirstLetter = (str: string | null | undefined): string => {
  // Handle null/undefined inputs
  if (str === null || str === undefined) {
    return '';
  }
  
  // Validate input type
  if (typeof str !== 'string') {
    throw new TypeError('Input must be a string');
  }
  
  // Handle empty string
  if (str.length === 0) {
    return '';
  }
  
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Truncates a string to a specified length, adding an ellipsis if the string exceeds the length.
 * 
 * @example
 * ```typescript
 * truncate('Hello world', 5); // Returns 'Hello...'
 * truncate('Hello', 10); // Returns 'Hello'
 * truncate('', 5); // Returns ''
 * truncate(null, 5); // Returns ''
 * ```
 * 
 * @param str - The input string to truncate
 * @param length - The maximum length of the returned string (excluding the ellipsis)
 * @param ellipsis - The string to append when truncating (defaults to '...')
 * @returns The truncated string with ellipsis if needed or an empty string for invalid inputs
 * @throws {TypeError} If the input is not a string (when not null/undefined)
 * @throws {RangeError} If the length parameter is negative
 */
export const truncate = (
  str: string | null | undefined, 
  length: number,
  ellipsis = '...'
): string => {
  // Handle null/undefined inputs
  if (str === null || str === undefined) {
    return '';
  }
  
  // Validate input type
  if (typeof str !== 'string') {
    throw new TypeError('Input must be a string');
  }
  
  // Validate length parameter
  if (length < 0) {
    throw new RangeError('Length parameter must be a non-negative number');
  }
  
  // No need to truncate if string is shorter than or equal to the specified length
  if (str.length <= length) {
    return str;
  }
  
  return str.slice(0, length) + ellipsis;
};

/**
 * Formats a string by replacing placeholders with provided values.
 * 
 * @example
 * ```typescript
 * formatString('Hello {name}', { name: 'World' }); // Returns 'Hello World'
 * formatString('Count: {count}', { count: 42 }); // Returns 'Count: 42'
 * formatString('No placeholders'); // Returns 'No placeholders'
 * formatString('Missing {value}', {}); // Returns 'Missing {value}'
 * ```
 * 
 * @param template - The template string containing placeholders in the format {placeholderName}
 * @param values - An object containing key-value pairs to replace in the template
 * @returns The formatted string with placeholders replaced by their values
 * @throws {TypeError} If the template is not a string or values is not an object
 */
export const formatString = (
  template: string,
  values?: Record<string, string | number | boolean>
): string => {
  // Validate template parameter
  if (typeof template !== 'string') {
    throw new TypeError('Template must be a string');
  }
  
  // If no values provided, return the template as is
  if (!values || Object.keys(values).length === 0) {
    return template;
  }
  
  // Validate values parameter
  if (typeof values !== 'object' || values === null) {
    throw new TypeError('Values must be an object');
  }
  
  // Replace all placeholders with their corresponding values
  return template.replace(/{([\w]+)}/g, (match, key) => {
    return values[key] !== undefined ? String(values[key]) : match;
  });
};
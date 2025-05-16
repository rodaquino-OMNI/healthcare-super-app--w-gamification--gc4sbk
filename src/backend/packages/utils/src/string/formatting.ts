/**
 * @file String formatting utility functions for consistent text transformation across all journey services.
 * @module utils/string/formatting
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
 * @returns The string with the first letter capitalized or an empty string for null/undefined inputs
 */
export const capitalizeFirstLetter = (str: string | null | undefined): string => {
  if (!str || typeof str !== 'string' || str.length === 0) {
    return '';
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Truncates a string to a specified length, adding an ellipsis if the string exceeds the length.
 * 
 * @example
 * ```typescript
 * truncate('This is a long text', 10); // Returns 'This is a ...'
 * truncate('Short', 10); // Returns 'Short'
 * truncate(null, 10); // Returns ''
 * truncate('Text', -5); // Returns ''
 * ```
 * 
 * @param str - The input string to truncate
 * @param length - The maximum length of the returned string (excluding the ellipsis)
 * @param ellipsis - Optional custom ellipsis string (defaults to '...')
 * @returns The truncated string with ellipsis if needed, or an empty string for invalid inputs
 */
export const truncate = (
  str: string | null | undefined, 
  length: number, 
  ellipsis: string = '...'
): string => {
  // Handle invalid inputs
  if (str === null || str === undefined || typeof str !== 'string') {
    return '';
  }
  
  // Handle invalid length
  if (typeof length !== 'number' || length < 0) {
    return '';
  }
  
  // No truncation needed
  if (str.length <= length) {
    return str;
  }
  
  // Truncate and add ellipsis
  return str.slice(0, length) + ellipsis;
};
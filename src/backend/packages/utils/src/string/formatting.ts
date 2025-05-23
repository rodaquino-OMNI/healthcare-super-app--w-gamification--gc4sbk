/**
 * @file String formatting utility functions for consistent text transformation across all journey services.
 * @module utils/string/formatting
 * @description Provides standardized string formatting operations to ensure consistent text presentation
 * across all platform components and journey services.
 */

/**
 * Capitalizes the first letter of a string while leaving the rest unchanged.
 * 
 * @example
 * ```typescript
 * capitalizeFirstLetter('hello world'); // Returns 'Hello world'
 * capitalizeFirstLetter(''); // Returns ''
 * capitalizeFirstLetter(null); // Returns ''
 * ```
 * 
 * @param {string | null | undefined} str - The input string to capitalize
 * @returns {string} The string with the first letter capitalized or an empty string for null/undefined/empty inputs
 */
export const capitalizeFirstLetter = (str: string | null | undefined): string => {
  // Return empty string for null, undefined, or empty string inputs
  if (!str || str.length === 0) {
    return '';
  }
  
  // Capitalize the first letter and concatenate with the rest of the string
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Truncates a string to a specified length, adding an ellipsis if the string exceeds the length.
 * Handles null and undefined inputs gracefully by returning an empty string.
 * 
 * @example
 * ```typescript
 * truncate('This is a long text that needs truncation', 10); // Returns 'This is a ...'
 * truncate('Short text', 20); // Returns 'Short text' (no truncation needed)
 * truncate(null, 10); // Returns ''
 * ```
 * 
 * @param {string | null | undefined} str - The input string to truncate
 * @param {number} length - The maximum length of the returned string (excluding the ellipsis)
 * @param {string} [ellipsis='...'] - The ellipsis string to append (defaults to '...')
 * @returns {string} The truncated string with ellipsis if needed, or the original string if shorter than the specified length
 * @throws {Error} If length is negative
 */
export const truncate = (
  str: string | null | undefined, 
  length: number,
  ellipsis: string = '...'
): string => {
  // Validate length parameter
  if (length < 0) {
    throw new Error('Length parameter must be a non-negative number');
  }
  
  // Return empty string for null or undefined inputs
  if (str === null || str === undefined) {
    return '';
  }
  
  // Convert to string in case a non-string value was passed
  const strValue = String(str);
  
  // Return the original string if it's shorter than or equal to the specified length
  if (strValue.length <= length) {
    return strValue;
  }
  
  // Truncate the string and append the ellipsis
  return strValue.slice(0, length) + ellipsis;
};
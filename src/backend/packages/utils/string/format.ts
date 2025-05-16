/**
 * @file String formatting utilities for consistent text manipulation across all backend services.
 * @module @austa/utils/string/format
 * 
 * This module provides pure functions for string transformation and formatting operations.
 * These utilities ensure standardized string handling for display purposes throughout the application.
 */

/**
 * Capitalizes the first letter of a string.
 * 
 * @param str - The input string to capitalize
 * @returns The string with the first letter capitalized or an empty string for invalid inputs
 * 
 * @example
 * ```ts
 * capitalizeFirstLetter('hello'); // 'Hello'
 * capitalizeFirstLetter(''); // ''
 * capitalizeFirstLetter(null); // ''
 * ```
 */
export const capitalizeFirstLetter = (str: string | null | undefined): string => {
  // Return empty string for null, undefined, or empty string inputs
  if (str === null || str === undefined || str.length === 0) {
    return '';
  }
  
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Truncates a string to a specified length, adding an ellipsis if the string exceeds the length.
 * 
 * @param str - The input string to truncate
 * @param length - The maximum length of the returned string (excluding the ellipsis)
 * @returns The truncated string with ellipsis if needed, or an empty string for invalid inputs
 * @throws {Error} If length is negative
 * 
 * @example
 * ```ts
 * truncate('Hello world', 5); // 'Hello...'
 * truncate('Hello', 10); // 'Hello'
 * truncate('', 5); // ''
 * truncate(null, 5); // ''
 * ```
 */
export const truncate = (str: string | null | undefined, length: number): string => {
  // Validate length parameter
  if (length < 0) {
    throw new Error('Length parameter must be a non-negative number');
  }
  
  // Return empty string for null or undefined inputs
  if (str === null || str === undefined) {
    return '';
  }
  
  // Convert to string in case a non-string was passed
  const strValue = String(str);
  
  // Return the string as is if it's shorter than or equal to the specified length
  if (strValue.length <= length) {
    return strValue;
  }
  
  // Truncate the string and add ellipsis
  return strValue.slice(0, length) + '...';
};
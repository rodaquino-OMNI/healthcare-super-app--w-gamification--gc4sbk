/**
 * Utility functions for string formatting and manipulation.
 * This module provides consistent string formatting across all journey services.
 */

/**
 * Capitalizes the first letter of a string.
 * 
 * @param str - The input string to capitalize
 * @returns The string with the first letter capitalized
 */
export const capitalizeFirstLetter = (str: string): string => {
  if (!str || str.length === 0) {
    return '';
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Truncates a string to a specified length, adding an ellipsis if the string exceeds the length.
 * 
 * @param str - The input string to truncate
 * @param length - The maximum length of the returned string (excluding the ellipsis)
 * @returns The truncated string with ellipsis if needed
 */
export const truncate = (str: string, length: number): string => {
  if (str === null || str === undefined) {
    return '';
  }
  
  if (str.length <= length) {
    return str;
  }
  
  return str.slice(0, length) + '...';
};
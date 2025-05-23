/**
 * Date Parsing Utilities
 * 
 * This module provides functions for parsing date strings into Date objects
 * according to specified formats and locales. These utilities are critical for
 * converting user inputs and API data into proper Date objects that can be
 * manipulated by other utility functions.
 * 
 * @packageDocumentation
 */

import { 
  parseDate as _parseDate,
  safeParse as _safeParse,
  parseWithMultipleFormats as _parseWithMultipleFormats,
  parseISODate as _parseISODate,
  safeParseISODate as _safeParseISODate
} from '../src/date/parse';

/**
 * Parses a date string according to the specified format and locale
 * 
 * @param dateStr - The date string to parse
 * @param formatStr - The format string (defaults to dd/MM/yyyy)
 * @param locale - The locale to use for parsing (defaults to pt-BR)
 * @returns The parsed date object
 * @throws Error if the date string cannot be parsed
 * 
 * @example
 * ```typescript
 * // Parse a date string with default format (dd/MM/yyyy) and locale (pt-BR)
 * const date = parseDate('01/01/2023');
 * 
 * // Parse a date string with a specific format
 * const dateWithFormat = parseDate('2023-01-01', 'yyyy-MM-dd');
 * 
 * // Parse a date string with a specific locale
 * const dateWithLocale = parseDate('01/01/2023', 'dd/MM/yyyy', 'en-US');
 * ```
 */
export const parseDate = _parseDate;

/**
 * Safely parses a date string according to the specified format and locale
 * Returns null instead of throwing an error if parsing fails
 * 
 * @param dateStr - The date string to parse
 * @param formatStr - The format string (defaults to dd/MM/yyyy)
 * @param locale - The locale to use for parsing (defaults to pt-BR)
 * @returns The parsed date object or null if parsing fails
 * 
 * @example
 * ```typescript
 * // Safely parse a date string (returns null if invalid)
 * const date = safeParse('01/01/2023');
 * 
 * // Safely parse with a specific format (returns null if format doesn't match)
 * const dateWithFormat = safeParse('2023-01-01', 'yyyy-MM-dd');
 * 
 * // Handle the null case
 * const parsedDate = safeParse('invalid-date');
 * if (parsedDate === null) {
 *   console.log('Invalid date provided');
 * }
 * ```
 */
export const safeParse = _safeParse;

/**
 * Attempts to parse a date string using multiple formats
 * Tries each format in order until one succeeds or all fail
 * 
 * @param dateStr - The date string to parse
 * @param formatStrs - Array of format strings to try
 * @param locale - The locale to use for parsing (defaults to pt-BR)
 * @returns The parsed date object or null if all parsing attempts fail
 * 
 * @example
 * ```typescript
 * // Try parsing with multiple formats
 * const date = parseWithMultipleFormats(
 *   '01/01/2023',
 *   ['dd/MM/yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy']
 * );
 * 
 * // Useful for handling user input with unknown format
 * const userInputDate = parseWithMultipleFormats(
 *   userInput,
 *   ['dd/MM/yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy']
 * );
 * if (userInputDate === null) {
 *   console.log('Please enter a valid date format');
 * }
 * ```
 */
export const parseWithMultipleFormats = _parseWithMultipleFormats;

/**
 * Parses an ISO date string (YYYY-MM-DD or full ISO format)
 * 
 * @param isoDateStr - The ISO date string to parse
 * @returns The parsed date object
 * @throws Error if the date string is not a valid ISO format
 * 
 * @example
 * ```typescript
 * // Parse an ISO date string (YYYY-MM-DD)
 * const date = parseISODate('2023-01-01');
 * 
 * // Parse a full ISO date-time string
 * const dateTime = parseISODate('2023-01-01T12:30:00Z');
 * ```
 */
export const parseISODate = _parseISODate;

/**
 * Safely parses an ISO date string
 * Returns null instead of throwing an error if parsing fails
 * 
 * @param isoDateStr - The ISO date string to parse
 * @returns The parsed date object or null if parsing fails
 * 
 * @example
 * ```typescript
 * // Safely parse an ISO date string
 * const date = safeParseISODate('2023-01-01');
 * 
 * // Handle invalid ISO format
 * const invalidDate = safeParseISODate('not-an-iso-date');
 * if (invalidDate === null) {
 *   console.log('Please provide a valid ISO date');
 * }
 * ```
 */
export const safeParseISODate = _safeParseISODate;
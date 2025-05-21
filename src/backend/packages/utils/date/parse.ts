/**
 * @file parse.ts
 * @description Provides a convenient entry point for date parsing utilities.
 * These functions are critical for converting string representations of dates
 * into Date objects, with support for locale-specific parsing formats.
 */

import { parseDate } from '../src/date';

/**
 * Re-export the parseDate function from the implementation folder.
 * This function parses a date string according to the specified format and locale.
 *
 * @param dateStr - The date string to parse
 * @param formatStr - The format string (defaults to dd/MM/yyyy)
 * @param locale - The locale to use for parsing (defaults to pt-BR)
 * @returns The parsed date object
 * @throws Error if the date string cannot be parsed
 *
 * @example
 * // Parse a date string using the default format (dd/MM/yyyy) and locale (pt-BR)
 * const date = parseDate('31/12/2023');
 *
 * @example
 * // Parse a date string using a custom format and the en-US locale
 * const date = parseDate('12/31/2023', 'MM/dd/yyyy', 'en-US');
 */
export { parseDate };
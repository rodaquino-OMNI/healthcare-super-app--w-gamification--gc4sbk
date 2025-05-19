/**
 * Date parsing utilities
 * 
 * This module provides functions for parsing date strings into Date objects
 * according to specified formats and locales.
 */

import { parse, isValid } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

// Default format strings
export const DEFAULT_DATE_FORMAT = 'dd/MM/yyyy';
export const DEFAULT_TIME_FORMAT = 'HH:mm';
export const DEFAULT_DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const DEFAULT_LOCALE = 'pt-BR';

// Locale mapping
const LOCALE_MAP: Record<string, Locale> = {
  'pt-BR': ptBR,
  'en-US': enUS
};

/**
 * Error thrown when date parsing fails
 */
export class DateParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DateParseError';
  }
}

/**
 * Parses a date string according to the specified format and locale
 * 
 * @param dateStr - The date string to parse
 * @param formatStr - The format string (defaults to dd/MM/yyyy)
 * @param locale - The locale to use for parsing (defaults to pt-BR)
 * @returns The parsed date object
 * @throws DateParseError if the date string cannot be parsed
 * 
 * @example
 * // Parse a date in default format (dd/MM/yyyy)
 * const date = parseDate('25/12/2023');
 * 
 * @example
 * // Parse a date with custom format
 * const date = parseDate('2023-12-25', 'yyyy-MM-dd');
 * 
 * @example
 * // Parse a date with US locale
 * const date = parseDate('12/25/2023', 'MM/dd/yyyy', 'en-US');
 */
export const parseDate = (
  dateStr: string,
  formatStr: string = DEFAULT_DATE_FORMAT,
  locale: string = DEFAULT_LOCALE
): Date => {
  if (!dateStr) {
    throw new DateParseError('Date string cannot be empty');
  }

  try {
    // Get locale object or default to pt-BR if not found
    const localeObj = LOCALE_MAP[locale] || LOCALE_MAP[DEFAULT_LOCALE];
    
    // Parse the date string
    const parsedDate = parse(dateStr, formatStr, new Date(), { locale: localeObj });
    
    // Validate the parsed date
    if (!isValid(parsedDate)) {
      throw new DateParseError(
        `Invalid date string: "${dateStr}" does not match format: "${formatStr}"`
      );
    }
    
    return parsedDate;
  } catch (error) {
    // Handle errors from date-fns or our own validation
    if (error instanceof DateParseError) {
      throw error;
    }
    
    // Handle unexpected errors from date-fns
    throw new DateParseError(
      `Failed to parse date "${dateStr}" with format "${formatStr}": ${(error as Error).message}`
    );
  }
};

/**
 * Safely attempts to parse a date string, returning null instead of throwing an error
 * 
 * @param dateStr - The date string to parse
 * @param formatStr - The format string (defaults to dd/MM/yyyy)
 * @param locale - The locale to use for parsing (defaults to pt-BR)
 * @returns The parsed date object or null if parsing fails
 * 
 * @example
 * // Safely parse a date, handling potential errors
 * const date = safeParse('invalid-date');
 * if (date === null) {
 *   console.log('Invalid date provided');
 * }
 */
export const safeParse = (
  dateStr: string,
  formatStr: string = DEFAULT_DATE_FORMAT,
  locale: string = DEFAULT_LOCALE
): Date | null => {
  try {
    return parseDate(dateStr, formatStr, locale);
  } catch (error) {
    return null;
  }
};

/**
 * Validates if a string can be parsed as a date with the given format
 * 
 * @param dateStr - The date string to validate
 * @param formatStr - The format string (defaults to dd/MM/yyyy)
 * @param locale - The locale to use for validation (defaults to pt-BR)
 * @returns True if the string is a valid date in the specified format, false otherwise
 * 
 * @example
 * // Check if a string is a valid date
 * if (isValidDateString('25/12/2023')) {
 *   console.log('Valid date string');
 * }
 */
export const isValidDateString = (
  dateStr: string,
  formatStr: string = DEFAULT_DATE_FORMAT,
  locale: string = DEFAULT_LOCALE
): boolean => {
  return safeParse(dateStr, formatStr, locale) !== null;
};
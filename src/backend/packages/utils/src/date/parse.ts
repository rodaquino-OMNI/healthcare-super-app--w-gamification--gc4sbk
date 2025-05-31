/**
 * Date parsing utilities for converting string dates to Date objects
 * with support for different formats and locales.
 */
import { parse, isValid } from 'date-fns';
import { pt as ptBR, enUS } from 'date-fns/locale';

// Default format strings
export const DEFAULT_DATE_FORMAT = 'dd/MM/yyyy';
export const DEFAULT_TIME_FORMAT = 'HH:mm';
export const DEFAULT_DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const DEFAULT_LOCALE = 'pt-BR';

// Locale mapping
export const LOCALE_MAP: Record<string, Locale> = {
  'pt-BR': ptBR,
  'en-US': enUS
};

/**
 * Interface for parse options to enhance type safety
 */
export interface ParseDateOptions {
  formatStr?: string;
  locale?: string;
  referenceDate?: Date;
}

/**
 * Parses a date string according to the specified format and locale
 * 
 * @param dateStr - The date string to parse
 * @param options - Optional configuration for parsing
 * @param options.formatStr - The format string (defaults to dd/MM/yyyy)
 * @param options.locale - The locale to use for parsing (defaults to pt-BR)
 * @param options.referenceDate - The reference date to use for relative parsing (defaults to current date)
 * @returns The parsed date object
 * @throws Error if the date string cannot be parsed
 */
export const parseDate = (
  dateStr: string,
  options?: ParseDateOptions
): Date => {
  try {
    if (!dateStr || typeof dateStr !== 'string') {
      throw new Error('Invalid date string: input must be a non-empty string');
    }

    const {
      formatStr = DEFAULT_DATE_FORMAT,
      locale = DEFAULT_LOCALE,
      referenceDate = new Date()
    } = options || {};

    // Get locale object, fallback to default if not found
    const localeObj = LOCALE_MAP[locale] || LOCALE_MAP[DEFAULT_LOCALE];
    if (!localeObj) {
      throw new Error(`Unsupported locale: ${locale}`);
    }
    
    // Attempt to parse the date string
    const parsedDate = parse(dateStr, formatStr, referenceDate, { locale: localeObj });
    
    // Validate the parsed date
    if (!isValid(parsedDate)) {
      throw new Error(`Invalid date string: "${dateStr}" does not match format: "${formatStr}"`);
    }
    
    return parsedDate;
  } catch (error) {
    // Enhance error message with more context
    if (error instanceof Error) {
      throw new Error(`Date parsing failed: ${error.message}`);
    }
    // Fallback for non-Error exceptions
    throw new Error(`Date parsing failed: Unknown error occurred while parsing "${dateStr}"`);
  }
};

/**
 * Safely attempts to parse a date string without throwing exceptions
 * 
 * @param dateStr - The date string to parse
 * @param options - Optional configuration for parsing
 * @returns The parsed date object or null if parsing fails
 */
export const tryParseDate = (
  dateStr: string,
  options?: ParseDateOptions
): Date | null => {
  try {
    return parseDate(dateStr, options);
  } catch (error) {
    return null;
  }
};

/**
 * Validates if a string can be parsed as a date with the given format
 * 
 * @param dateStr - The date string to validate
 * @param options - Optional configuration for validation
 * @returns True if the string can be parsed as a valid date, false otherwise
 */
export const isValidDateString = (
  dateStr: string,
  options?: ParseDateOptions
): boolean => {
  return tryParseDate(dateStr, options) !== null;
};
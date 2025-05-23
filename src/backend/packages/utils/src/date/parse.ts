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

import { parse, isValid } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { isValidDate } from './validation';

// Default format strings and locale mapping imported from constants
import { 
  DEFAULT_DATE_FORMAT,
  DEFAULT_LOCALE,
  LOCALE_MAP
} from './constants';

/**
 * Parses a date string according to the specified format and locale
 * 
 * @param dateStr - The date string to parse
 * @param formatStr - The format string (defaults to dd/MM/yyyy)
 * @param locale - The locale to use for parsing (defaults to pt-BR)
 * @returns The parsed date object
 * @throws Error if the date string cannot be parsed
 */
export const parseDate = (
  dateStr: string,
  formatStr: string = DEFAULT_DATE_FORMAT,
  locale: string = DEFAULT_LOCALE
): Date => {
  if (!dateStr) {
    throw new Error('Date string is required');
  }

  try {
    const localeObj = LOCALE_MAP[locale] || LOCALE_MAP[DEFAULT_LOCALE];
    
    const parsedDate = parse(dateStr, formatStr, new Date(), { locale: localeObj });
    
    if (!isValid(parsedDate)) {
      throw new Error(`Invalid date string: ${dateStr} for format: ${formatStr}`);
    }
    
    return parsedDate;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse date: ${error.message}`);
    }
    throw new Error(`Failed to parse date: ${dateStr} with format: ${formatStr}`);
  }
};

/**
 * Safely parses a date string according to the specified format and locale
 * Returns null instead of throwing an error if parsing fails
 * 
 * @param dateStr - The date string to parse
 * @param formatStr - The format string (defaults to dd/MM/yyyy)
 * @param locale - The locale to use for parsing (defaults to pt-BR)
 * @returns The parsed date object or null if parsing fails
 */
export const safeParse = (
  dateStr: string,
  formatStr: string = DEFAULT_DATE_FORMAT,
  locale: string = DEFAULT_LOCALE
): Date | null => {
  if (!dateStr) {
    return null;
  }

  try {
    return parseDate(dateStr, formatStr, locale);
  } catch (error) {
    return null;
  }
};

/**
 * Attempts to parse a date string using multiple formats
 * Tries each format in order until one succeeds or all fail
 * 
 * @param dateStr - The date string to parse
 * @param formatStrs - Array of format strings to try
 * @param locale - The locale to use for parsing (defaults to pt-BR)
 * @returns The parsed date object or null if all parsing attempts fail
 */
export const parseWithMultipleFormats = (
  dateStr: string,
  formatStrs: string[],
  locale: string = DEFAULT_LOCALE
): Date | null => {
  if (!dateStr || !formatStrs || formatStrs.length === 0) {
    return null;
  }

  for (const formatStr of formatStrs) {
    const parsedDate = safeParse(dateStr, formatStr, locale);
    if (parsedDate !== null) {
      return parsedDate;
    }
  }

  return null;
};

/**
 * Parses an ISO date string (YYYY-MM-DD or full ISO format)
 * 
 * @param isoDateStr - The ISO date string to parse
 * @returns The parsed date object
 * @throws Error if the date string is not a valid ISO format
 */
export const parseISODate = (isoDateStr: string): Date => {
  if (!isoDateStr) {
    throw new Error('ISO date string is required');
  }

  try {
    const parsedDate = new Date(isoDateStr);
    
    if (!isValidDate(parsedDate)) {
      throw new Error(`Invalid ISO date string: ${isoDateStr}`);
    }
    
    return parsedDate;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse ISO date: ${error.message}`);
    }
    throw new Error(`Failed to parse ISO date: ${isoDateStr}`);
  }
};

/**
 * Safely parses an ISO date string
 * Returns null instead of throwing an error if parsing fails
 * 
 * @param isoDateStr - The ISO date string to parse
 * @returns The parsed date object or null if parsing fails
 */
export const safeParseISODate = (isoDateStr: string): Date | null => {
  if (!isoDateStr) {
    return null;
  }

  try {
    return parseISODate(isoDateStr);
  } catch (error) {
    return null;
  }
};
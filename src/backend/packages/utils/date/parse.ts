/**
 * @file parse.ts
 * @description Provides date parsing utilities for converting string representations of dates into Date objects.
 * Supports locale-specific parsing formats for both pt-BR and en-US.
 */

import { parse, isValid } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

// Default format strings
const DEFAULT_DATE_FORMAT = 'dd/MM/yyyy';
const DEFAULT_LOCALE = 'pt-BR';

// Locale mapping
const LOCALE_MAP = {
  'pt-BR': ptBR,
  'en-US': enUS
};

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
  const localeObj = LOCALE_MAP[locale] || LOCALE_MAP[DEFAULT_LOCALE];
  
  const parsedDate = parse(dateStr, formatStr, new Date(), { locale: localeObj });
  
  if (!isValid(parsedDate)) {
    throw new Error(`Invalid date string: ${dateStr} for format: ${formatStr}`);
  }
  
  return parsedDate;
};
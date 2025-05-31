import { format, formatRelative, isValid } from '@date-fns/core'; // date-fns version: 3.3.1
import { ptBR } from '@date-fns/locale/ptBR'; // date-fns version: 3.3.1

/**
 * Formats a date object into a string using the specified format and locale.
 * Uses Brazilian Portuguese (ptBR) as the default locale.
 * 
 * @param date - The date to format
 * @param formatStr - The format string to use
 * @returns The formatted date string or an empty string if the date is invalid
 */
export function formatDate(date: Date | number | string, formatStr: string): string {
  try {
    if (!isValid(date)) {
      console.error('Invalid date provided to formatDate');
      return '';
    }
    return format(date, formatStr, { locale: ptBR });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Formats a date object into a string that represents the relative time from the current time.
 * For example: "2 days ago", "yesterday", "in 3 hours", etc.
 * Uses Brazilian Portuguese (ptBR) as the locale.
 * 
 * @param date - The date to format relative to now
 * @returns The formatted relative date string or an empty string if the date is invalid
 */
export function formatRelativeDate(date: Date | number | string): string {
  try {
    if (!isValid(date)) {
      console.error('Invalid date provided to formatRelativeDate');
      return '';
    }
    return formatRelative(date, new Date(), { locale: ptBR });
  } catch (error) {
    console.error('Error formatting relative date:', error);
    return '';
  }
}
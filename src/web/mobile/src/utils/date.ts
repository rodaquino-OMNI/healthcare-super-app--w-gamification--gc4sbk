import { format, formatRelative, isValid } from 'date-fns'; // date-fns version: 3.3.1
import { ptBR } from 'date-fns/locale/ptBR'; // date-fns version: 3.3.1

/**
 * Formats a date object into a string using the specified format and locale.
 * Uses Brazilian Portuguese (ptBR) as the default locale.
 * 
 * @param date - The date to format
 * @param formatStr - The format string to use
 * @returns The formatted date string or an error message if the date is invalid
 */
export function formatDate(date: Date | number | string, formatStr: string): string {
  try {
    if (!date) {
      throw new Error('Invalid date: date is null or undefined');
    }
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (!isValid(dateObj)) {
      throw new Error('Invalid date: could not parse date');
    }
    
    return format(dateObj, formatStr, { locale: ptBR });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Data inválida';
  }
}

/**
 * Formats a date object into a string that represents the relative time from the current time.
 * For example: "2 days ago", "yesterday", "in 3 hours", etc.
 * Uses Brazilian Portuguese (ptBR) as the locale.
 * 
 * @param date - The date to format relative to now
 * @returns The formatted relative date string or an error message if the date is invalid
 */
export function formatRelativeDate(date: Date | number | string): string {
  try {
    if (!date) {
      throw new Error('Invalid date: date is null or undefined');
    }
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (!isValid(dateObj)) {
      throw new Error('Invalid date: could not parse date');
    }
    
    return formatRelative(dateObj, new Date(), { locale: ptBR });
  } catch (error) {
    console.error('Error formatting relative date:', error);
    return 'Data inválida';
  }
}
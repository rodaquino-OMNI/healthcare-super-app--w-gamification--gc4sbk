/**
 * Date formatting utilities
 * 
 * This module provides functions for formatting dates in various formats with localization support.
 * It uses date-fns 3.3.1 for all date operations and supports both Portuguese and English locales.
 */

import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import type { Locale } from 'date-fns';

// Default format strings
export const DEFAULT_DATE_FORMAT = 'dd/MM/yyyy';
export const DEFAULT_TIME_FORMAT = 'HH:mm';
export const DEFAULT_DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const DEFAULT_LOCALE = 'pt-BR';

// Locale mapping with type safety
type SupportedLocale = 'pt-BR' | 'en-US';

const LOCALE_MAP: Record<SupportedLocale, Locale> = {
  'pt-BR': ptBR,
  'en-US': enUS
};

/**
 * Type for date input that can be formatted
 */
export type DateInput = Date | string | number;

/**
 * Validates if a date is valid
 * 
 * @param date - The date to validate
 * @returns True if the date is valid, false otherwise
 */
const isValidDate = (date: unknown): boolean => {
  if (date === null || date === undefined) {
    return false;
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date instanceof Date ? date : null;
  
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

/**
 * Converts a date input to a Date object
 * 
 * @param date - The date input to convert
 * @returns A Date object
 */
const toDateObject = (date: DateInput): Date => {
  return typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
};

/**
 * Formats a date according to the specified format and locale
 * 
 * @param date - The date to format
 * @param formatStr - The format string (defaults to dd/MM/yyyy)
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns The formatted date string or empty string if date is invalid
 */
export const formatDate = (
  date: DateInput,
  formatStr: string = DEFAULT_DATE_FORMAT,
  locale: SupportedLocale = DEFAULT_LOCALE as SupportedLocale
): string => {
  if (!isValidDate(date)) {
    return '';
  }

  try {
    const dateObj = toDateObject(date);
    const localeObj = LOCALE_MAP[locale] || LOCALE_MAP[DEFAULT_LOCALE as SupportedLocale];

    return format(dateObj, formatStr, { locale: localeObj });
  } catch (error) {
    console.error(`Error formatting date: ${error instanceof Error ? error.message : String(error)}`);
    return '';
  }
};

/**
 * Formats a time according to the specified format and locale
 * 
 * @param date - The date/time to format
 * @param formatStr - The format string (defaults to HH:mm)
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns The formatted time string or empty string if date is invalid
 */
export const formatTime = (
  date: DateInput,
  formatStr: string = DEFAULT_TIME_FORMAT,
  locale: SupportedLocale = DEFAULT_LOCALE as SupportedLocale
): string => {
  if (!isValidDate(date)) {
    return '';
  }

  try {
    const dateObj = toDateObject(date);
    const localeObj = LOCALE_MAP[locale] || LOCALE_MAP[DEFAULT_LOCALE as SupportedLocale];

    return format(dateObj, formatStr, { locale: localeObj });
  } catch (error) {
    console.error(`Error formatting time: ${error instanceof Error ? error.message : String(error)}`);
    return '';
  }
};

/**
 * Formats a date and time according to the specified format and locale
 * 
 * @param date - The date/time to format
 * @param formatStr - The format string (defaults to dd/MM/yyyy HH:mm)
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns The formatted date and time string or empty string if date is invalid
 */
export const formatDateTime = (
  date: DateInput,
  formatStr: string = DEFAULT_DATETIME_FORMAT,
  locale: SupportedLocale = DEFAULT_LOCALE as SupportedLocale
): string => {
  if (!isValidDate(date)) {
    return '';
  }

  try {
    const dateObj = toDateObject(date);
    const localeObj = LOCALE_MAP[locale] || LOCALE_MAP[DEFAULT_LOCALE as SupportedLocale];

    return format(dateObj, formatStr, { locale: localeObj });
  } catch (error) {
    console.error(`Error formatting date time: ${error instanceof Error ? error.message : String(error)}`);
    return '';
  }
};

/**
 * Formats a date range as a string
 * 
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @param formatStr - The format string for dates (defaults to dd/MM/yyyy)
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns Formatted date range string or empty string if either date is invalid
 */
export const formatDateRange = (
  startDate: DateInput,
  endDate: DateInput,
  formatStr: string = DEFAULT_DATE_FORMAT,
  locale: SupportedLocale = DEFAULT_LOCALE as SupportedLocale
): string => {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return '';
  }
  
  try {
    const formattedStartDate = formatDate(startDate, formatStr, locale);
    const formattedEndDate = formatDate(endDate, formatStr, locale);
    
    return `${formattedStartDate} - ${formattedEndDate}`;
  } catch (error) {
    console.error(`Error formatting date range: ${error instanceof Error ? error.message : String(error)}`);
    return '';
  }
};

/**
 * Formats a date relative to the current date (today, yesterday, etc.)
 * 
 * @param date - The date to format
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns Relative date string or empty string if date is invalid
 */
export const formatRelativeDate = (
  date: DateInput,
  locale: SupportedLocale = DEFAULT_LOCALE as SupportedLocale
): string => {
  if (!isValidDate(date)) {
    return '';
  }
  
  try {
    const dateObj = toDateObject(date);
    const today = new Date();
    
    // Localized relative terms
    const terms = locale === 'pt-BR' ? {
      today: 'Hoje',
      yesterday: 'Ontem',
      daysAgo: 'dias atrás',
      thisMonth: 'Este mês',
      lastMonth: 'Mês passado'
    } : {
      today: 'Today',
      yesterday: 'Yesterday',
      daysAgo: 'days ago',
      thisMonth: 'This month',
      lastMonth: 'Last month'
    };
    
    // Check if date is today
    if (isSameDay(dateObj, today)) {
      return terms.today;
    }
    
    // Check if date is yesterday
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (isSameDay(dateObj, yesterday)) {
      return terms.yesterday;
    }
    
    // Calculate days difference
    const diffDays = Math.floor((today.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} ${terms.daysAgo}`;
    }
    
    // For older dates, return formatted date
    return formatDate(dateObj, DEFAULT_DATE_FORMAT, locale);
  } catch (error) {
    console.error(`Error formatting relative date: ${error instanceof Error ? error.message : String(error)}`);
    return '';
  }
};

/**
 * Checks if two dates are the same day
 * 
 * @param dateA - The first date
 * @param dateB - The second date
 * @returns True if dates are the same day, false otherwise
 */
const isSameDay = (dateA: Date, dateB: Date): boolean => {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
};

/**
 * Formats a date according to journey-specific requirements
 * 
 * @param date - The date to format
 * @param journeyId - The journey identifier (health, care, plan)
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns Journey-specific formatted date or empty string if date is invalid
 */
export const formatJourneyDate = (
  date: DateInput,
  journeyId: string,
  locale: SupportedLocale = DEFAULT_LOCALE as SupportedLocale
): string => {
  if (!isValidDate(date)) {
    return '';
  }
  
  try {
    const dateObj = toDateObject(date);
    
    // Journey-specific formats
    switch (journeyId.toLowerCase()) {
      case 'health':
        // Health journey uses detailed format with time for metrics
        return formatDateTime(dateObj, 'dd/MM/yyyy HH:mm', locale);
        
      case 'care':
        // Care journey uses appointment-friendly format
        return formatDate(dateObj, 'EEE, dd MMM yyyy', locale);
        
      case 'plan':
        // Plan journey uses formal date format for claims and documents
        return formatDate(dateObj, 'dd/MM/yyyy', locale);
        
      default:
        // Default format
        return formatDate(dateObj, DEFAULT_DATE_FORMAT, locale);
    }
  } catch (error) {
    console.error(`Error formatting journey date: ${error instanceof Error ? error.message : String(error)}`);
    return '';
  }
};
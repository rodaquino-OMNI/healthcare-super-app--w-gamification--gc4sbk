/**
 * Date formatting utilities
 * 
 * This module provides functions for formatting Date objects into strings with various formats.
 * It supports localization for Portuguese (pt-BR) and English (en-US).
 */

import { format } from 'date-fns/format';
import { enUS, ptBR } from 'date-fns/locale';
import { isValid } from 'date-fns/isValid';
import { differenceInDays } from 'date-fns/differenceInDays';
import { differenceInMonths } from 'date-fns/differenceInMonths';
import { differenceInYears } from 'date-fns/differenceInYears';
import { subDays } from 'date-fns/subDays';
import { isSameDay } from 'date-fns/isSameDay';

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
 * Type for supported date input formats
 */
export type DateInput = Date | string | number;

/**
 * Formats a date according to the specified format and locale
 * 
 * @param date - The date to format
 * @param formatStr - The format string (defaults to dd/MM/yyyy)
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns The formatted date string or empty string for invalid dates
 */
export const formatDate = (
  date: DateInput,
  formatStr: string = DEFAULT_DATE_FORMAT,
  locale: string = DEFAULT_LOCALE
): string => {
  try {
    if (!isValidDate(date)) {
      return '';
    }

    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const localeObj = LOCALE_MAP[locale] || LOCALE_MAP[DEFAULT_LOCALE];

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
 * @returns The formatted time string or empty string for invalid dates
 */
export const formatTime = (
  date: DateInput,
  formatStr: string = DEFAULT_TIME_FORMAT,
  locale: string = DEFAULT_LOCALE
): string => {
  try {
    if (!isValidDate(date)) {
      return '';
    }

    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const localeObj = LOCALE_MAP[locale] || LOCALE_MAP[DEFAULT_LOCALE];

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
 * @returns The formatted date and time string or empty string for invalid dates
 */
export const formatDateTime = (
  date: DateInput,
  formatStr: string = DEFAULT_DATETIME_FORMAT,
  locale: string = DEFAULT_LOCALE
): string => {
  try {
    if (!isValidDate(date)) {
      return '';
    }

    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const localeObj = LOCALE_MAP[locale] || LOCALE_MAP[DEFAULT_LOCALE];

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
  locale: string = DEFAULT_LOCALE
): string => {
  try {
    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return '';
    }
    
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
 * @returns Relative date string or empty string for invalid dates
 */
export const formatRelativeDate = (
  date: DateInput,
  locale: string = DEFAULT_LOCALE
): string => {
  try {
    if (!isValidDate(date)) {
      return '';
    }
    
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const today = new Date();
    const yesterday = subDays(today, 1);
    
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
    
    if (isSameDay(dateObj, today)) {
      return terms.today;
    }
    
    if (isSameDay(dateObj, yesterday)) {
      return terms.yesterday;
    }
    
    const diffDays = differenceInDays(today, dateObj);
    
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
 * Formats a date according to journey-specific requirements
 * 
 * @param date - The date to format
 * @param journeyId - The journey identifier (health, care, plan)
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns Journey-specific formatted date or empty string for invalid dates
 */
export const formatJourneyDate = (
  date: DateInput,
  journeyId: string,
  locale: string = DEFAULT_LOCALE
): string => {
  try {
    if (!isValidDate(date)) {
      return '';
    }
    
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    
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

/**
 * Returns a human-readable string representing time elapsed since the given date
 * 
 * @param date - The date to calculate time elapsed from
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns Human-readable time ago string or empty string for invalid dates
 */
export const getTimeAgo = (
  date: DateInput,
  locale: string = DEFAULT_LOCALE
): string => {
  try {
    if (!isValidDate(date)) {
      return '';
    }
    
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const now = new Date();
    
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    // Localized time units
    const timeUnits = locale === 'pt-BR' ? {
      seconds: 'segundos',
      minute: 'minuto',
      minutes: 'minutos',
      hour: 'hora',
      hours: 'horas',
      day: 'dia',
      days: 'dias',
      week: 'semana',
      weeks: 'semanas',
      month: 'mês',
      months: 'meses',
      year: 'ano',
      years: 'anos',
      ago: 'atrás'
    } : {
      seconds: 'seconds',
      minute: 'minute',
      minutes: 'minutes',
      hour: 'hour',
      hours: 'hours',
      day: 'day',
      days: 'days',
      week: 'week',
      weeks: 'weeks',
      month: 'month',
      months: 'months',
      year: 'year',
      years: 'years',
      ago: 'ago'
    };
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} ${timeUnits.seconds} ${timeUnits.ago}`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return diffInMinutes === 1
        ? `1 ${timeUnits.minute} ${timeUnits.ago}`
        : `${diffInMinutes} ${timeUnits.minutes} ${timeUnits.ago}`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return diffInHours === 1
        ? `1 ${timeUnits.hour} ${timeUnits.ago}`
        : `${diffInHours} ${timeUnits.hours} ${timeUnits.ago}`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return diffInDays === 1
        ? `1 ${timeUnits.day} ${timeUnits.ago}`
        : `${diffInDays} ${timeUnits.days} ${timeUnits.ago}`;
    }
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return diffInWeeks === 1
        ? `1 ${timeUnits.week} ${timeUnits.ago}`
        : `${diffInWeeks} ${timeUnits.weeks} ${timeUnits.ago}`;
    }
    
    const diffInMonths = differenceInMonths(now, dateObj);
    if (diffInMonths < 12) {
      return diffInMonths === 1
        ? `1 ${timeUnits.month} ${timeUnits.ago}`
        : `${diffInMonths} ${timeUnits.months} ${timeUnits.ago}`;
    }
    
    const diffInYears = differenceInYears(now, dateObj);
    return diffInYears === 1
      ? `1 ${timeUnits.year} ${timeUnits.ago}`
      : `${diffInYears} ${timeUnits.years} ${timeUnits.ago}`;
  } catch (error) {
    console.error(`Error calculating time ago: ${error instanceof Error ? error.message : String(error)}`);
    return '';
  }
};

/**
 * Checks if a date is valid
 * 
 * @param date - The date to validate
 * @returns True if the date is valid, false otherwise
 */
const isValidDate = (date: unknown): boolean => {
  if (date === null || date === undefined) {
    return false;
  }
  
  if (date instanceof Date) {
    return isValid(date);
  }
  
  if (typeof date === 'string' || typeof date === 'number') {
    const dateObj = new Date(date);
    return isValid(dateObj);
  }
  
  return false;
};
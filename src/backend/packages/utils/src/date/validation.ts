/**
 * Date validation utilities
 * 
 * This module provides functions to validate date objects, strings, and numbers
 * before processing them with other date utilities. These validation functions
 * help prevent errors from invalid date operations and provide clear error messages.
 */

import { isValid, isBefore, isAfter, isWithinInterval, parse } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

// Type definitions for better type safety
type DateInput = Date | string | number | null | undefined;
type DateFormat = string;
type LocaleKey = 'pt-BR' | 'en-US';

// Locale mapping
const LOCALE_MAP = {
  'pt-BR': ptBR,
  'en-US': enUS
};

/**
 * Checks if a value is a valid date
 * 
 * This function validates that a given value can be properly converted to a valid Date object.
 * It handles various input types including Date objects, strings, and numbers.
 * 
 * @param date - The value to validate as a date
 * @returns True if the value is a valid date, false otherwise
 * 
 * @example
 * ```typescript
 * isValidDate(new Date()); // true
 * isValidDate('2023-01-01'); // true
 * isValidDate('invalid date'); // false
 * isValidDate(null); // false
 * ```
 */
export const isValidDate = (date: DateInput): boolean => {
  if (date === null || date === undefined) {
    return false;
  }
  
  if (date instanceof Date) {
    return isValid(date) && !isNaN(date.getTime());
  }
  
  if (typeof date === 'string') {
    // Handle empty strings
    if (date.trim() === '') {
      return false;
    }
    
    const dateObj = new Date(date);
    return isValid(dateObj) && !isNaN(dateObj.getTime());
  }
  
  if (typeof date === 'number') {
    // Handle invalid timestamps (e.g., NaN, Infinity)
    if (!isFinite(date)) {
      return false;
    }
    
    const dateObj = new Date(date);
    return isValid(dateObj) && !isNaN(dateObj.getTime());
  }
  
  return false;
};

/**
 * Validates a date string against a specific format
 * 
 * @param dateStr - The date string to validate
 * @param formatStr - The expected format of the date string
 * @param locale - The locale to use for parsing (defaults to pt-BR)
 * @returns True if the date string is valid according to the format, false otherwise
 * 
 * @example
 * ```typescript
 * isValidDateString('29/02/2020', 'dd/MM/yyyy'); // true (leap year)
 * isValidDateString('29/02/2021', 'dd/MM/yyyy'); // false (not a leap year)
 * isValidDateString('31/04/2021', 'dd/MM/yyyy'); // false (April has 30 days)
 * ```
 */
export const isValidDateString = (
  dateStr: string,
  formatStr: DateFormat,
  locale: LocaleKey = 'pt-BR'
): boolean => {
  if (!dateStr || typeof dateStr !== 'string') {
    return false;
  }
  
  try {
    const localeObj = LOCALE_MAP[locale] || LOCALE_MAP['pt-BR'];
    const parsedDate = parse(dateStr, formatStr, new Date(), { locale: localeObj });
    
    return isValid(parsedDate) && !isNaN(parsedDate.getTime());
  } catch (error) {
    return false;
  }
};

/**
 * Validates an ISO date string (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)
 * 
 * @param dateStr - The ISO date string to validate
 * @returns True if the string is a valid ISO date, false otherwise
 * 
 * @example
 * ```typescript
 * isValidISODateString('2021-04-30'); // true
 * isValidISODateString('2021-04-31'); // false (April has 30 days)
 * isValidISODateString('2021-02-29'); // false (not a leap year)
 * isValidISODateString('2020-02-29'); // true (leap year)
 * ```
 */
export const isValidISODateString = (dateStr: string): boolean => {
  if (!dateStr || typeof dateStr !== 'string') {
    return false;
  }
  
  // ISO date format regex (basic validation)
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?)?$/;
  
  if (!isoDateRegex.test(dateStr)) {
    return false;
  }
  
  const dateObj = new Date(dateStr);
  return isValid(dateObj) && !isNaN(dateObj.getTime());
};

/**
 * Checks if a date is in the past
 * 
 * @param date - The date to check
 * @param referenceDate - The reference date to compare against (defaults to now)
 * @returns True if the date is in the past, false otherwise or if the date is invalid
 * 
 * @example
 * ```typescript
 * isDateInPast(new Date('2020-01-01')); // true (assuming current date is after 2020-01-01)
 * isDateInPast(new Date('2099-01-01')); // false (future date)
 * ```
 */
export const isDateInPast = (
  date: DateInput,
  referenceDate: Date = new Date()
): boolean => {
  if (!isValidDate(date)) {
    return false;
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date as Date;
  
  return isBefore(dateObj, referenceDate);
};

/**
 * Checks if a date is in the future
 * 
 * @param date - The date to check
 * @param referenceDate - The reference date to compare against (defaults to now)
 * @returns True if the date is in the future, false otherwise or if the date is invalid
 * 
 * @example
 * ```typescript
 * isDateInFuture(new Date('2099-01-01')); // true (future date)
 * isDateInFuture(new Date('2020-01-01')); // false (assuming current date is after 2020-01-01)
 * ```
 */
export const isDateInFuture = (
  date: DateInput,
  referenceDate: Date = new Date()
): boolean => {
  if (!isValidDate(date)) {
    return false;
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date as Date;
  
  return isAfter(dateObj, referenceDate);
};

/**
 * Validates that a date range is valid (start date is before or equal to end date)
 * 
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @returns True if the range is valid, false otherwise or if either date is invalid
 * 
 * @example
 * ```typescript
 * isValidDateRange(new Date('2021-01-01'), new Date('2021-01-31')); // true
 * isValidDateRange(new Date('2021-01-31'), new Date('2021-01-01')); // false (end before start)
 * ```
 */
export const isValidDateRange = (
  startDate: DateInput,
  endDate: DateInput
): boolean => {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return false;
  }
  
  const startDateObj = typeof startDate === 'string' || typeof startDate === 'number' ? new Date(startDate) : startDate as Date;
  const endDateObj = typeof endDate === 'string' || typeof endDate === 'number' ? new Date(endDate) : endDate as Date;
  
  return isBefore(startDateObj, endDateObj) || startDateObj.getTime() === endDateObj.getTime();
};

/**
 * Checks if a date is within a specified range (inclusive)
 * 
 * @param date - The date to check
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @returns True if the date is within the range, false otherwise or if any date is invalid
 * 
 * @example
 * ```typescript
 * isDateInRange(new Date('2021-01-15'), new Date('2021-01-01'), new Date('2021-01-31')); // true
 * isDateInRange(new Date('2021-02-01'), new Date('2021-01-01'), new Date('2021-01-31')); // false
 * ```
 */
export const isDateInRange = (
  date: DateInput,
  startDate: DateInput,
  endDate: DateInput
): boolean => {
  if (!isValidDate(date) || !isValidDate(startDate) || !isValidDate(endDate)) {
    return false;
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date as Date;
  const startDateObj = typeof startDate === 'string' || typeof startDate === 'number' ? new Date(startDate) : startDate as Date;
  const endDateObj = typeof endDate === 'string' || typeof endDate === 'number' ? new Date(endDate) : endDate as Date;
  
  try {
    return isWithinInterval(dateObj, { start: startDateObj, end: endDateObj });
  } catch (error) {
    // Handle the case where the interval is invalid (start date after end date)
    return false;
  }
};

/**
 * Validates a date for a specific journey context
 * 
 * Different journeys may have different date validation requirements.
 * This function applies journey-specific validation rules.
 * 
 * @param date - The date to validate
 * @param journeyId - The journey identifier (health, care, plan)
 * @returns True if the date is valid for the specified journey, false otherwise
 * 
 * @example
 * ```typescript
 * isValidJourneyDate(new Date(), 'health'); // Validates according to health journey rules
 * ```
 */
export const isValidJourneyDate = (
  date: DateInput,
  journeyId: string
): boolean => {
  if (!isValidDate(date)) {
    return false;
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date as Date;
  
  // Journey-specific validation rules
  switch (journeyId.toLowerCase()) {
    case 'health':
      // Health journey: dates cannot be in the future (can't log future metrics)
      return !isDateInFuture(dateObj);
      
    case 'care':
      // Care journey: appointments can be in the future but not more than 1 year ahead
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      return !isAfter(dateObj, oneYearFromNow);
      
    case 'plan':
      // Plan journey: claims cannot be for dates more than 5 years in the past
      const fiveYearsAgo = new Date();
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
      return !isBefore(dateObj, fiveYearsAgo);
      
    default:
      // Default validation just checks if it's a valid date
      return true;
  }
};
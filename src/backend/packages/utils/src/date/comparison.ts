/**
 * Date comparison utilities for the AUSTA SuperApp
 * 
 * @module @austa/utils/date/comparison
 */

import {
  isSameDay as fnIsSameDay,
  isBefore,
  isAfter,
  isEqual,
  isValid
} from 'date-fns';

/**
 * DateInput type represents all possible date input formats
 * that can be used with comparison functions
 */
export type DateInput = Date | string | number;

/**
 * DateRange type represents a range between two dates
 */
export interface DateRange {
  startDate: DateInput;
  endDate: DateInput;
}

/**
 * Validates if the provided value is a valid date
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

/**
 * Normalizes a date input to a Date object
 * 
 * @param date - The date input to normalize
 * @returns A Date object or null if the input is invalid
 */
const normalizeDate = (date: DateInput): Date | null => {
  if (!isValidDate(date)) {
    return null;
  }
  
  return typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
};

/**
 * Checks if two dates are the same day
 * 
 * @param dateA - The first date
 * @param dateB - The second date
 * @returns True if dates are the same day, false otherwise
 * @example
 * ```typescript
 * isSameDay(new Date(2023, 0, 1), new Date(2023, 0, 1, 23, 59)); // true
 * isSameDay('2023-01-01', '2023-01-02'); // false
 * ```
 */
export const isSameDay = (
  dateA: DateInput,
  dateB: DateInput
): boolean => {
  const normalizedDateA = normalizeDate(dateA);
  const normalizedDateB = normalizeDate(dateB);
  
  if (!normalizedDateA || !normalizedDateB) {
    return false;
  }
  
  return fnIsSameDay(normalizedDateA, normalizedDateB);
};

/**
 * Checks if a date is within a specified range (inclusive)
 * 
 * @param date - The date to check
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @returns True if the date is within the range, false otherwise
 * @example
 * ```typescript
 * isDateInRange(
 *   new Date(2023, 0, 15),
 *   new Date(2023, 0, 1),
 *   new Date(2023, 0, 31)
 * ); // true
 * ```
 */
export const isDateInRange = (
  date: DateInput,
  startDate: DateInput,
  endDate: DateInput
): boolean => {
  const normalizedDate = normalizeDate(date);
  const normalizedStartDate = normalizeDate(startDate);
  const normalizedEndDate = normalizeDate(endDate);
  
  if (!normalizedDate || !normalizedStartDate || !normalizedEndDate) {
    return false;
  }
  
  const isAfterOrEqualStart = isAfter(normalizedDate, normalizedStartDate) || 
                              isEqual(normalizedDate, normalizedStartDate);
  const isBeforeOrEqualEnd = isBefore(normalizedDate, normalizedEndDate) || 
                             isEqual(normalizedDate, normalizedEndDate);
  
  return isAfterOrEqualStart && isBeforeOrEqualEnd;
};

/**
 * Checks if a date is before another date
 * 
 * @param dateA - The date to check
 * @param dateB - The date to compare against
 * @returns True if dateA is before dateB, false otherwise
 * @example
 * ```typescript
 * isDateBefore(new Date(2023, 0, 1), new Date(2023, 0, 2)); // true
 * ```
 */
export const isDateBefore = (
  dateA: DateInput,
  dateB: DateInput
): boolean => {
  const normalizedDateA = normalizeDate(dateA);
  const normalizedDateB = normalizeDate(dateB);
  
  if (!normalizedDateA || !normalizedDateB) {
    return false;
  }
  
  return isBefore(normalizedDateA, normalizedDateB);
};

/**
 * Checks if a date is after another date
 * 
 * @param dateA - The date to check
 * @param dateB - The date to compare against
 * @returns True if dateA is after dateB, false otherwise
 * @example
 * ```typescript
 * isDateAfter(new Date(2023, 0, 2), new Date(2023, 0, 1)); // true
 * ```
 */
export const isDateAfter = (
  dateA: DateInput,
  dateB: DateInput
): boolean => {
  const normalizedDateA = normalizeDate(dateA);
  const normalizedDateB = normalizeDate(dateB);
  
  if (!normalizedDateA || !normalizedDateB) {
    return false;
  }
  
  return isAfter(normalizedDateA, normalizedDateB);
};

/**
 * Checks if a date is equal to another date (exact timestamp match)
 * 
 * @param dateA - The first date
 * @param dateB - The second date
 * @returns True if dates are exactly equal, false otherwise
 * @example
 * ```typescript
 * isDateEqual(new Date(2023, 0, 1, 12, 0), new Date(2023, 0, 1, 12, 0)); // true
 * isDateEqual(new Date(2023, 0, 1, 12, 0), new Date(2023, 0, 1, 12, 1)); // false
 * ```
 */
export const isDateEqual = (
  dateA: DateInput,
  dateB: DateInput
): boolean => {
  const normalizedDateA = normalizeDate(dateA);
  const normalizedDateB = normalizeDate(dateB);
  
  if (!normalizedDateA || !normalizedDateB) {
    return false;
  }
  
  return isEqual(normalizedDateA, normalizedDateB);
};

/**
 * Checks if a date is today
 * 
 * @param date - The date to check
 * @returns True if the date is today, false otherwise
 * @example
 * ```typescript
 * isToday(new Date()); // true
 * ```
 */
export const isToday = (date: DateInput): boolean => {
  const normalizedDate = normalizeDate(date);
  
  if (!normalizedDate) {
    return false;
  }
  
  return isSameDay(normalizedDate, new Date());
};

/**
 * Checks if a date is within a DateRange object
 * 
 * @param date - The date to check
 * @param range - The date range object with startDate and endDate properties
 * @returns True if the date is within the range, false otherwise
 * @example
 * ```typescript
 * isDateInDateRange(
 *   new Date(2023, 0, 15),
 *   { startDate: new Date(2023, 0, 1), endDate: new Date(2023, 0, 31) }
 * ); // true
 * ```
 */
export const isDateInDateRange = (
  date: DateInput,
  range: DateRange
): boolean => {
  return isDateInRange(date, range.startDate, range.endDate);
};
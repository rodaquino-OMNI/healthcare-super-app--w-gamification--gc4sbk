/**
 * Date comparison utilities for journey services
 * 
 * @module date/comparison
 */

import {
  isSameDay as fnIsSameDay,
  isBefore,
  isAfter,
  isEqual,
  isWithinInterval,
  isValid
} from 'date-fns';

/**
 * Date-like type that can be a Date object, string, or number
 */
export type DateLike = Date | string | number;

/**
 * Validates if a date is valid
 * 
 * @param date - The date to validate
 * @returns True if the date is valid, false otherwise
 */
export const isValidDate = (date: unknown): boolean => {
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
 * Normalizes a date-like value to a Date object
 * 
 * @param date - The date to normalize
 * @returns The normalized Date object or null if invalid
 */
export const normalizeDate = (date: DateLike): Date | null => {
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
 */
export const isSameDay = (
  dateA: DateLike,
  dateB: DateLike
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
 */
export const isDateInRange = (
  date: DateLike,
  startDate: DateLike,
  endDate: DateLike
): boolean => {
  const normalizedDate = normalizeDate(date);
  const normalizedStartDate = normalizeDate(startDate);
  const normalizedEndDate = normalizeDate(endDate);
  
  if (!normalizedDate || !normalizedStartDate || !normalizedEndDate) {
    return false;
  }
  
  try {
    return isWithinInterval(normalizedDate, {
      start: normalizedStartDate,
      end: normalizedEndDate
    });
  } catch (error) {
    // Handle the case where start date is after end date
    if (error instanceof RangeError) {
      return false;
    }
    throw error;
  }
};

/**
 * Checks if a date is before another date
 * 
 * @param date - The date to check
 * @param dateToCompare - The date to compare against
 * @returns True if the date is before the comparison date, false otherwise
 */
export const isBeforeDate = (
  date: DateLike,
  dateToCompare: DateLike
): boolean => {
  const normalizedDate = normalizeDate(date);
  const normalizedDateToCompare = normalizeDate(dateToCompare);
  
  if (!normalizedDate || !normalizedDateToCompare) {
    return false;
  }
  
  return isBefore(normalizedDate, normalizedDateToCompare);
};

/**
 * Checks if a date is after another date
 * 
 * @param date - The date to check
 * @param dateToCompare - The date to compare against
 * @returns True if the date is after the comparison date, false otherwise
 */
export const isAfterDate = (
  date: DateLike,
  dateToCompare: DateLike
): boolean => {
  const normalizedDate = normalizeDate(date);
  const normalizedDateToCompare = normalizeDate(dateToCompare);
  
  if (!normalizedDate || !normalizedDateToCompare) {
    return false;
  }
  
  return isAfter(normalizedDate, normalizedDateToCompare);
};

/**
 * Checks if a date is the same as another date (exact match including time)
 * 
 * @param dateA - The first date
 * @param dateB - The second date
 * @returns True if dates are exactly the same, false otherwise
 */
export const isSameDate = (
  dateA: DateLike,
  dateB: DateLike
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
 */
export const isToday = (date: DateLike): boolean => {
  const normalizedDate = normalizeDate(date);
  
  if (!normalizedDate) {
    return false;
  }
  
  return isSameDay(normalizedDate, new Date());
};

/**
 * Checks if a date is in the past
 * 
 * @param date - The date to check
 * @returns True if the date is in the past, false otherwise
 */
export const isPast = (date: DateLike): boolean => {
  const normalizedDate = normalizeDate(date);
  
  if (!normalizedDate) {
    return false;
  }
  
  return isBefore(normalizedDate, new Date());
};

/**
 * Checks if a date is in the future
 * 
 * @param date - The date to check
 * @returns True if the date is in the future, false otherwise
 */
export const isFuture = (date: DateLike): boolean => {
  const normalizedDate = normalizeDate(date);
  
  if (!normalizedDate) {
    return false;
  }
  
  return isAfter(normalizedDate, new Date());
};
/**
 * Date comparison utilities for checking relationships between dates
 * @module
 */

import {
  isSameDay as fnIsSameDay,
  isBefore,
  isAfter,
  isValid
} from 'date-fns';

/**
 * Date input type that can be a Date object, string, or number timestamp
 */
export type DateInput = Date | string | number;

/**
 * Checks if a value is a valid date
 * 
 * @param date - The value to check
 * @returns True if the value is a valid date, false otherwise
 * @internal
 */
const isValidDate = (date: any): boolean => {
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
 * Checks if two dates represent the same day
 * 
 * @param dateA - The first date (can be Date object, string, or timestamp)
 * @param dateB - The second date (can be Date object, string, or timestamp)
 * @returns True if both dates represent the same day, false otherwise
 * @example
 * // Check if two dates are the same day
 * isSameDay(new Date(2023, 0, 1), new Date(2023, 0, 1, 23, 59)); // true
 * isSameDay('2023-01-01', '2023-01-02'); // false
 */
export const isSameDay = (
  dateA: DateInput,
  dateB: DateInput
): boolean => {
  if (!isValidDate(dateA) || !isValidDate(dateB)) {
    return false;
  }
  
  const dateAObj = typeof dateA === 'string' || typeof dateA === 'number' ? new Date(dateA) : dateA;
  const dateBObj = typeof dateB === 'string' || typeof dateB === 'number' ? new Date(dateB) : dateB;
  
  return fnIsSameDay(dateAObj, dateBObj);
};

/**
 * Checks if a date is within a specified range (inclusive)
 * 
 * @param date - The date to check (can be Date object, string, or timestamp)
 * @param startDate - The start date of the range (can be Date object, string, or timestamp)
 * @param endDate - The end date of the range (can be Date object, string, or timestamp)
 * @returns True if the date is within the range (inclusive), false otherwise
 * @example
 * // Check if a date is within a range
 * isDateInRange(
 *   new Date(2023, 0, 15),
 *   new Date(2023, 0, 1),
 *   new Date(2023, 0, 31)
 * ); // true
 * 
 * // Works with string dates too
 * isDateInRange('2023-01-15', '2023-01-01', '2023-01-31'); // true
 */
export const isDateInRange = (
  date: DateInput,
  startDate: DateInput,
  endDate: DateInput
): boolean => {
  if (!isValidDate(date) || !isValidDate(startDate) || !isValidDate(endDate)) {
    return false;
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const startDateObj = typeof startDate === 'string' || typeof startDate === 'number' ? new Date(startDate) : startDate;
  const endDateObj = typeof endDate === 'string' || typeof endDate === 'number' ? new Date(endDate) : endDate;
  
  const isAfterOrEqualStart = isAfter(dateObj, startDateObj) || fnIsSameDay(dateObj, startDateObj);
  const isBeforeOrEqualEnd = isBefore(dateObj, endDateObj) || fnIsSameDay(dateObj, endDateObj);
  
  return isAfterOrEqualStart && isBeforeOrEqualEnd;
};
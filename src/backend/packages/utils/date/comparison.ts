/**
 * Date Comparison Utilities
 * 
 * This module provides functions for comparing dates, determining if dates fall on the same day,
 * and checking if a date is within a specified range. These utilities help ensure consistent
 * date comparison logic across the application.
 * 
 * @packageDocumentation
 */

import { 
  isSameDay as _isSameDay,
  isDateInRange as _isDateInRange,
  isBefore as _isBefore,
  isAfter as _isAfter,
  isSameMonth as _isSameMonth,
  isSameYear as _isSameYear
} from '../src/date/comparison';

/**
 * Checks if two dates are the same day
 * 
 * @param dateA - The first date (can be Date object, string, or number)
 * @param dateB - The second date (can be Date object, string, or number)
 * @returns True if dates are the same day, false otherwise
 * 
 * @example
 * ```typescript
 * // Check if two dates are the same day
 * const isSame = isSameDay(
 *   new Date('2023-01-01T10:00:00'),
 *   new Date('2023-01-01T15:30:00')
 * ); // true (both dates are on January 1, 2023)
 * 
 * // Works with different time parts
 * const isSameWithTime = isSameDay(
 *   new Date('2023-01-01T00:00:00'),
 *   new Date('2023-01-01T23:59:59')
 * ); // true (both dates are on January 1, 2023)
 * 
 * // Works with date strings too
 * const isSameString = isSameDay('2023-01-01', '2023-01-01'); // true
 * 
 * // Returns false for different days
 * const isDifferent = isSameDay(
 *   new Date('2023-01-01'),
 *   new Date('2023-01-02')
 * ); // false
 * ```
 */
export const isSameDay = _isSameDay;

/**
 * Checks if a date is within a specified range
 * 
 * @param date - The date to check (can be Date object, string, or number)
 * @param startDate - The start date of the range (can be Date object, string, or number)
 * @param endDate - The end date of the range (can be Date object, string, or number)
 * @returns True if the date is within the range (inclusive), false otherwise
 * 
 * @example
 * ```typescript
 * // Check if a date is within a range
 * const isInRange = isDateInRange(
 *   new Date('2023-01-15'),
 *   new Date('2023-01-01'),
 *   new Date('2023-01-31')
 * ); // true
 * 
 * // Works with date strings too
 * const isInRangeString = isDateInRange(
 *   '2023-01-15',
 *   '2023-01-01',
 *   '2023-01-31'
 * ); // true
 * 
 * // Range is inclusive of start and end dates
 * const isStartDateInRange = isDateInRange(
 *   new Date('2023-01-01'),
 *   new Date('2023-01-01'),
 *   new Date('2023-01-31')
 * ); // true
 * 
 * const isEndDateInRange = isDateInRange(
 *   new Date('2023-01-31'),
 *   new Date('2023-01-01'),
 *   new Date('2023-01-31')
 * ); // true
 * 
 * // Returns false for dates outside the range
 * const isOutsideRange = isDateInRange(
 *   new Date('2023-02-01'),
 *   new Date('2023-01-01'),
 *   new Date('2023-01-31')
 * ); // false
 * ```
 */
export const isDateInRange = _isDateInRange;

/**
 * Checks if a date is before another date
 * 
 * @param dateA - The date to check (can be Date object, string, or number)
 * @param dateB - The date to compare against (can be Date object, string, or number)
 * @returns True if dateA is before dateB, false otherwise
 * 
 * @example
 * ```typescript
 * // Check if a date is before another date
 * const isBefore = isBefore(
 *   new Date('2023-01-01'),
 *   new Date('2023-01-02')
 * ); // true
 * 
 * // Works with date strings too
 * const isBeforeString = isBefore('2023-01-01', '2023-01-02'); // true
 * 
 * // Returns false for same day or after
 * const isNotBefore = isBefore(
 *   new Date('2023-01-02'),
 *   new Date('2023-01-01')
 * ); // false
 * ```
 */
export const isBefore = _isBefore;

/**
 * Checks if a date is after another date
 * 
 * @param dateA - The date to check (can be Date object, string, or number)
 * @param dateB - The date to compare against (can be Date object, string, or number)
 * @returns True if dateA is after dateB, false otherwise
 * 
 * @example
 * ```typescript
 * // Check if a date is after another date
 * const isAfter = isAfter(
 *   new Date('2023-01-02'),
 *   new Date('2023-01-01')
 * ); // true
 * 
 * // Works with date strings too
 * const isAfterString = isAfter('2023-01-02', '2023-01-01'); // true
 * 
 * // Returns false for same day or before
 * const isNotAfter = isAfter(
 *   new Date('2023-01-01'),
 *   new Date('2023-01-02')
 * ); // false
 * ```
 */
export const isAfter = _isAfter;

/**
 * Checks if two dates are in the same month
 * 
 * @param dateA - The first date (can be Date object, string, or number)
 * @param dateB - The second date (can be Date object, string, or number)
 * @returns True if dates are in the same month and year, false otherwise
 * 
 * @example
 * ```typescript
 * // Check if two dates are in the same month
 * const isSame = isSameMonth(
 *   new Date('2023-01-01'),
 *   new Date('2023-01-31')
 * ); // true (both dates are in January 2023)
 * 
 * // Works with date strings too
 * const isSameString = isSameMonth('2023-01-01', '2023-01-15'); // true
 * 
 * // Returns false for different months
 * const isDifferent = isSameMonth(
 *   new Date('2023-01-01'),
 *   new Date('2023-02-01')
 * ); // false
 * ```
 */
export const isSameMonth = _isSameMonth;

/**
 * Checks if two dates are in the same year
 * 
 * @param dateA - The first date (can be Date object, string, or number)
 * @param dateB - The second date (can be Date object, string, or number)
 * @returns True if dates are in the same year, false otherwise
 * 
 * @example
 * ```typescript
 * // Check if two dates are in the same year
 * const isSame = isSameYear(
 *   new Date('2023-01-01'),
 *   new Date('2023-12-31')
 * ); // true (both dates are in 2023)
 * 
 * // Works with date strings too
 * const isSameString = isSameYear('2023-01-01', '2023-06-15'); // true
 * 
 * // Returns false for different years
 * const isDifferent = isSameYear(
 *   new Date('2023-01-01'),
 *   new Date('2024-01-01')
 * ); // false
 * ```
 */
export const isSameYear = _isSameYear;
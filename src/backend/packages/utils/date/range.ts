/**
 * Date range utilities for working with date ranges, generating arrays of dates,
 * and retrieving predefined date ranges.
 * 
 * @module
 */

import { getDateRange as getDateRangeImpl, getDatesBetween as getDatesBetweenImpl, isDateInRange as isDateInRangeImpl } from '../../src/date/range';

/**
 * Predefined date range types supported by the getDateRange function.
 */
export type DateRangeType = 
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'lastYear'
  | 'last7Days'
  | 'last30Days'
  | 'last90Days'
  | 'last365Days';

/**
 * Date range object containing start and end dates.
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Gets the start and end dates for a specified range type.
 * 
 * @param rangeType - The type of range (today, thisWeek, thisMonth, etc.)
 * @param referenceDate - The reference date (defaults to today)
 * @returns Object with start and end dates for the range
 * 
 * @example
 * ```typescript
 * // Get the date range for this week
 * const thisWeek = getDateRange('thisWeek');
 * console.log(thisWeek.startDate, thisWeek.endDate);
 * 
 * // Get the date range for last month relative to a specific date
 * const lastMonth = getDateRange('lastMonth', new Date('2023-06-15'));
 * ```
 */
export const getDateRange = (
  rangeType: DateRangeType | string,
  referenceDate: Date = new Date()
): DateRange => {
  return getDateRangeImpl(rangeType, referenceDate);
};

/**
 * Gets an array of dates between start and end dates (inclusive).
 * 
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns Array of dates between start and end dates
 * @throws Error if dates are invalid or if start date is after end date
 * 
 * @example
 * ```typescript
 * // Get all dates in January 2023
 * const dates = getDatesBetween(
 *   new Date('2023-01-01'),
 *   new Date('2023-01-31')
 * );
 * ```
 */
export const getDatesBetween = (startDate: Date, endDate: Date): Date[] => {
  return getDatesBetweenImpl(startDate, endDate);
};

/**
 * Checks if a date is within a specified range.
 * 
 * @param date - The date to check
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @returns True if the date is within the range, false otherwise
 * 
 * @example
 * ```typescript
 * // Check if a date is within a specific range
 * const isInRange = isDateInRange(
 *   new Date('2023-02-15'),
 *   new Date('2023-02-01'),
 *   new Date('2023-02-28')
 * ); // true
 * ```
 */
export const isDateInRange = (
  date: Date | string | number,
  startDate: Date | string | number,
  endDate: Date | string | number
): boolean => {
  return isDateInRangeImpl(date, startDate, endDate);
};
/**
 * Date Range Utilities
 * 
 * This module provides utilities for working with date ranges, including
 * generating arrays of dates and retrieving predefined date ranges.
 * 
 * @packageDocumentation
 */

import { getDateRange as getDateRangeImpl } from '../src/date';
import { getDatesBetween as getDatesBetweenImpl } from '../src/date';

/**
 * Gets the start and end dates for a specified range type
 * 
 * @param rangeType - The type of range (today, thisWeek, thisMonth, etc.)
 * @param referenceDate - The reference date (defaults to today)
 * @returns Object with start and end dates for the range
 * 
 * @example
 * ```typescript
 * // Get the date range for the current week
 * const { startDate, endDate } = getDateRange('thisWeek');
 * 
 * // Get the date range for last month relative to a specific date
 * const { startDate, endDate } = getDateRange('lastMonth', new Date('2023-06-15'));
 * ```
 */
export const getDateRange = getDateRangeImpl;

/**
 * Gets an array of dates between start and end dates (inclusive)
 * 
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns Array of dates between start and end dates
 * 
 * @example
 * ```typescript
 * // Get all dates in the current month
 * const { startDate, endDate } = getDateRange('thisMonth');
 * const datesInMonth = getDatesBetween(startDate, endDate);
 * ```
 */
export const getDatesBetween = getDatesBetweenImpl;
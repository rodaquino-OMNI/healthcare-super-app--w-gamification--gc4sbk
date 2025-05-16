/**
 * Date range utilities for working with date ranges, generating arrays of dates,
 * and retrieving predefined date ranges.
 * 
 * @packageDocumentation
 */

import {
  addDays,
  subDays,
  subMonths,
  subYears,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isBefore,
  isAfter,
  isSameDay as fnIsSameDay
} from 'date-fns';

import { isValidDate } from './validation';

/**
 * Represents the available predefined date range types
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
 * Represents a date range with start and end dates
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Gets the start and end dates for a specified range type
 * 
 * @param rangeType - The type of range (today, thisWeek, thisMonth, etc.)
 * @param referenceDate - The reference date (defaults to today)
 * @returns Object with start and end dates for the range
 */
export const getDateRange = (
  rangeType: DateRangeType,
  referenceDate: Date = new Date()
): DateRange => {
  const today = referenceDate || new Date();
  
  switch (rangeType) {
    case 'today':
      return {
        startDate: startOfDay(today),
        endDate: endOfDay(today)
      };
      
    case 'yesterday':
      const yesterday = subDays(today, 1);
      return {
        startDate: startOfDay(yesterday),
        endDate: endOfDay(yesterday)
      };
      
    case 'thisWeek':
      return {
        startDate: startOfWeek(today, { weekStartsOn: 0 }), // 0 = Sunday
        endDate: endOfWeek(today, { weekStartsOn: 0 })
      };
      
    case 'lastWeek':
      const lastWeek = subDays(today, 7);
      return {
        startDate: startOfWeek(lastWeek, { weekStartsOn: 0 }),
        endDate: endOfWeek(lastWeek, { weekStartsOn: 0 })
      };
      
    case 'thisMonth':
      return {
        startDate: startOfMonth(today),
        endDate: endOfMonth(today)
      };
      
    case 'lastMonth':
      const lastMonth = subMonths(today, 1);
      return {
        startDate: startOfMonth(lastMonth),
        endDate: endOfMonth(lastMonth)
      };
      
    case 'thisYear':
      return {
        startDate: startOfYear(today),
        endDate: endOfYear(today)
      };
      
    case 'lastYear':
      const lastYear = subYears(today, 1);
      return {
        startDate: startOfYear(lastYear),
        endDate: endOfYear(lastYear)
      };
      
    case 'last7Days':
      return {
        startDate: startOfDay(subDays(today, 6)),
        endDate: endOfDay(today)
      };
      
    case 'last30Days':
      return {
        startDate: startOfDay(subDays(today, 29)),
        endDate: endOfDay(today)
      };
      
    case 'last90Days':
      return {
        startDate: startOfDay(subDays(today, 89)),
        endDate: endOfDay(today)
      };
      
    case 'last365Days':
      return {
        startDate: startOfDay(subDays(today, 364)),
        endDate: endOfDay(today)
      };
      
    default:
      return {
        startDate: startOfDay(today),
        endDate: endOfDay(today)
      };
  }
};

/**
 * Gets an array of dates between start and end dates (inclusive)
 * 
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns Array of dates between start and end dates
 * @throws Error if invalid date range is provided or if start date is after end date
 */
export const getDatesBetween = (startDate: Date, endDate: Date): Date[] => {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    throw new Error('Invalid date range provided');
  }
  
  if (!isBefore(startDate, endDate) && !fnIsSameDay(startDate, endDate)) {
    throw new Error('Start date must be before or the same as end date');
  }
  
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  
  while (isBefore(currentDate, endDate) || fnIsSameDay(currentDate, endDate)) {
    dates.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }
  
  return dates;
};

/**
 * Checks if a date is within a specified range
 * 
 * @param date - The date to check
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @returns True if the date is within the range, false otherwise
 */
export const isDateInRange = (
  date: Date | string | number,
  startDate: Date | string | number,
  endDate: Date | string | number
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
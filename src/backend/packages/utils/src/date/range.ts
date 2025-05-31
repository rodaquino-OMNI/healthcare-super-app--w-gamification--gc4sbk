/**
 * Date range utilities for working with date ranges across the application
 * 
 * @module date/range
 */

import {
  format,
  addDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  subMonths,
  subYears,
  isBefore,
  isSameDay
} from 'date-fns';

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
  | 'last365Days'
  | 'currentQuarter'
  | 'lastQuarter'
  | 'yearToDate'
  | 'custom';

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
 * @throws Error if an invalid range type is provided
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

    case 'currentQuarter':
      const currentMonth = today.getMonth();
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
      const quarterStart = new Date(today.getFullYear(), quarterStartMonth, 1);
      const quarterEnd = new Date(today.getFullYear(), quarterStartMonth + 3, 0);
      
      return {
        startDate: startOfDay(quarterStart),
        endDate: endOfDay(quarterEnd)
      };

    case 'lastQuarter':
      const month = today.getMonth();
      const lastQuarterStartMonth = (Math.floor(month / 3) - 1 + 4) % 4 * 3;
      const lastQuarterYear = lastQuarterStartMonth > month ? today.getFullYear() - 1 : today.getFullYear();
      const lastQuarterStart = new Date(lastQuarterYear, lastQuarterStartMonth, 1);
      const lastQuarterEnd = new Date(lastQuarterYear, lastQuarterStartMonth + 3, 0);
      
      return {
        startDate: startOfDay(lastQuarterStart),
        endDate: endOfDay(lastQuarterEnd)
      };

    case 'yearToDate':
      return {
        startDate: startOfYear(today),
        endDate: endOfDay(today)
      };

    case 'custom':
      // For custom range, return the reference date as both start and end
      // The actual custom range should be set by the consumer
      return {
        startDate: startOfDay(today),
        endDate: endOfDay(today)
      };
      
    default:
      throw new Error(`Invalid date range type: ${rangeType}`);
  }
};

/**
 * Gets an array of dates between start and end dates (inclusive)
 * 
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns Array of dates between start and end dates
 * @throws Error if invalid date range or if start date is after end date
 */
export const getDatesBetween = (startDate: Date, endDate: Date): Date[] => {
  // Validate inputs
  if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
    throw new Error('Invalid date objects provided');
  }
  
  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('Invalid date range provided');
  }
  
  if (!isBefore(startDate, endDate) && !isSameDay(startDate, endDate)) {
    throw new Error('Start date must be before or the same as end date');
  }
  
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  
  while (isBefore(currentDate, endDate) || isSameDay(currentDate, endDate)) {
    dates.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }
  
  return dates;
};

/**
 * Formats a date range as a string
 * 
 * @param range - The date range to format
 * @param formatStr - The format string for dates (defaults to dd/MM/yyyy)
 * @returns Formatted date range string
 */
export const formatDateRange = (
  range: DateRange,
  formatStr: string = 'dd/MM/yyyy'
): string => {
  if (!range || !range.startDate || !range.endDate) {
    return '';
  }
  
  const formattedStartDate = format(range.startDate, formatStr);
  const formattedEndDate = format(range.endDate, formatStr);
  
  return `${formattedStartDate} - ${formattedEndDate}`;
};

/**
 * Checks if a date is within a specified range
 * 
 * @param date - The date to check
 * @param range - The date range to check against
 * @returns True if the date is within the range, false otherwise
 */
export const isDateInRange = (
  date: Date,
  range: DateRange
): boolean => {
  if (!date || !range || !range.startDate || !range.endDate) {
    return false;
  }
  
  const dateObj = new Date(date);
  const startDateObj = new Date(range.startDate);
  const endDateObj = new Date(range.endDate);
  
  const isAfterOrEqualStart = dateObj >= startDateObj;
  const isBeforeOrEqualEnd = dateObj <= endDateObj;
  
  return isAfterOrEqualStart && isBeforeOrEqualEnd;
};

/**
 * Creates a custom date range
 * 
 * @param startDate - The start date of the custom range
 * @param endDate - The end date of the custom range
 * @returns A custom date range object
 * @throws Error if invalid date range or if start date is after end date
 */
export const createCustomDateRange = (startDate: Date, endDate: Date): DateRange => {
  // Validate inputs
  if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
    throw new Error('Invalid date objects provided');
  }
  
  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('Invalid date range provided');
  }
  
  if (!isBefore(startDate, endDate) && !isSameDay(startDate, endDate)) {
    throw new Error('Start date must be before or the same as end date');
  }
  
  return {
    startDate: startOfDay(startDate),
    endDate: endOfDay(endDate)
  };
};
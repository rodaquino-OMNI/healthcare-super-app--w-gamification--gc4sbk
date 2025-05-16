/**
 * Date range utilities for working with date ranges across journey services
 * @module @austa/utils/date/range
 */

import {
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
  isSameDay,
} from 'date-fns';

/**
 * Predefined date range types
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
  | 'ytd' // Year to date
  | 'custom';

/**
 * Date range object with start and end dates
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Error thrown when an invalid date range is specified
 */
export class InvalidDateRangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDateRangeError';
  }
}

/**
 * Gets the start and end dates for a specified range type
 * 
 * @param rangeType - The type of range (today, thisWeek, thisMonth, etc.)
 * @param referenceDate - The reference date (defaults to today)
 * @returns Object with start and end dates for the range
 * @throws {InvalidDateRangeError} If an invalid range type is provided
 */
export const getDateRange = (
  rangeType: DateRangeType,
  referenceDate: Date = new Date()
): DateRange => {
  if (!referenceDate || !(referenceDate instanceof Date) || isNaN(referenceDate.getTime())) {
    throw new InvalidDateRangeError('Invalid reference date provided');
  }
  
  const today = new Date(referenceDate);
  
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
      const currentQuarter = Math.floor(month / 3);
      const lastQuarterStartMonth = ((currentQuarter + 3) % 4) * 3;
      const lastQuarterYear = currentQuarter === 0 ? today.getFullYear() - 1 : today.getFullYear();
      
      const lastQuarterStart = new Date(lastQuarterYear, lastQuarterStartMonth, 1);
      const lastQuarterEnd = new Date(lastQuarterYear, lastQuarterStartMonth + 3, 0);
      
      return {
        startDate: startOfDay(lastQuarterStart),
        endDate: endOfDay(lastQuarterEnd)
      };

    case 'ytd': // Year to date
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
      throw new InvalidDateRangeError(`Invalid range type: ${rangeType}`);
  }
};

/**
 * Gets an array of dates between start and end dates (inclusive)
 * 
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns Array of dates between start and end dates
 * @throws {InvalidDateRangeError} If invalid dates are provided or if start date is after end date
 */
export const getDatesBetween = (startDate: Date, endDate: Date): Date[] => {
  // Validate input dates
  if (!startDate || !(startDate instanceof Date) || isNaN(startDate.getTime())) {
    throw new InvalidDateRangeError('Invalid start date provided');
  }
  
  if (!endDate || !(endDate instanceof Date) || isNaN(endDate.getTime())) {
    throw new InvalidDateRangeError('Invalid end date provided');
  }
  
  if (!isBefore(startDate, endDate) && !isSameDay(startDate, endDate)) {
    throw new InvalidDateRangeError('Start date must be before or the same as end date');
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
 * Checks if a date range is valid
 * 
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @returns True if the date range is valid, false otherwise
 */
export const isValidDateRange = (startDate: Date, endDate: Date): boolean => {
  if (!startDate || !(startDate instanceof Date) || isNaN(startDate.getTime())) {
    return false;
  }
  
  if (!endDate || !(endDate instanceof Date) || isNaN(endDate.getTime())) {
    return false;
  }
  
  return isBefore(startDate, endDate) || isSameDay(startDate, endDate);
};

/**
 * Creates a custom date range
 * 
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @returns A DateRange object with the specified start and end dates
 * @throws {InvalidDateRangeError} If invalid dates are provided or if start date is after end date
 */
export const createCustomDateRange = (startDate: Date, endDate: Date): DateRange => {
  if (!isValidDateRange(startDate, endDate)) {
    throw new InvalidDateRangeError('Invalid date range provided');
  }
  
  return {
    startDate: startOfDay(startDate),
    endDate: endOfDay(endDate)
  };
};
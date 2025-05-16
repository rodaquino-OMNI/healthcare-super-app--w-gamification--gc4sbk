/**
 * Tests for date range utilities
 * 
 * This file contains tests for date range generation functions including getDateRange and getDatesBetween,
 * verifying that predefined ranges (today, yesterday, thisWeek, etc.) and custom date ranges work correctly.
 * These functions are essential for reporting, data filtering, and analytics across journey services.
 */

import {
  getDateRange,
  getDatesBetween,
  isValidDateRange,
  createCustomDateRange,
  DateRangeType,
  InvalidDateRangeError
} from '../../../src/date/range';

import {
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
  isSameDay,
  isEqual
} from 'date-fns';

describe('Date Range Utilities', () => {
  // Test fixtures
  const referenceDate = new Date(2023, 0, 15); // January 15, 2023 (a Sunday)
  
  // Mock current date for consistent testing
  const originalNow = Date.now;
  
  beforeAll(() => {
    // Mock Date.now for consistent testing
    Date.now = jest.fn(() => referenceDate.getTime());
  });
  
  afterAll(() => {
    // Restore original Date.now
    Date.now = originalNow;
  });

  describe('getDateRange', () => {
    describe('Predefined range types', () => {
      test('today returns current day range', () => {
        const range = getDateRange('today', referenceDate);
        
        expect(isEqual(range.startDate, startOfDay(referenceDate))).toBe(true);
        expect(isEqual(range.endDate, endOfDay(referenceDate))).toBe(true);
      });
      
      test('yesterday returns previous day range', () => {
        const range = getDateRange('yesterday', referenceDate);
        const yesterday = subDays(referenceDate, 1);
        
        expect(isEqual(range.startDate, startOfDay(yesterday))).toBe(true);
        expect(isEqual(range.endDate, endOfDay(yesterday))).toBe(true);
      });
      
      test('thisWeek returns current week range', () => {
        const range = getDateRange('thisWeek', referenceDate);
        
        expect(isEqual(range.startDate, startOfWeek(referenceDate, { weekStartsOn: 0 }))).toBe(true);
        expect(isEqual(range.endDate, endOfWeek(referenceDate, { weekStartsOn: 0 }))).toBe(true);
      });
      
      test('lastWeek returns previous week range', () => {
        const range = getDateRange('lastWeek', referenceDate);
        const lastWeek = subDays(referenceDate, 7);
        
        expect(isEqual(range.startDate, startOfWeek(lastWeek, { weekStartsOn: 0 }))).toBe(true);
        expect(isEqual(range.endDate, endOfWeek(lastWeek, { weekStartsOn: 0 }))).toBe(true);
      });
      
      test('thisMonth returns current month range', () => {
        const range = getDateRange('thisMonth', referenceDate);
        
        expect(isEqual(range.startDate, startOfMonth(referenceDate))).toBe(true);
        expect(isEqual(range.endDate, endOfMonth(referenceDate))).toBe(true);
      });
      
      test('lastMonth returns previous month range', () => {
        const range = getDateRange('lastMonth', referenceDate);
        const lastMonth = subMonths(referenceDate, 1);
        
        expect(isEqual(range.startDate, startOfMonth(lastMonth))).toBe(true);
        expect(isEqual(range.endDate, endOfMonth(lastMonth))).toBe(true);
      });
      
      test('thisYear returns current year range', () => {
        const range = getDateRange('thisYear', referenceDate);
        
        expect(isEqual(range.startDate, startOfYear(referenceDate))).toBe(true);
        expect(isEqual(range.endDate, endOfYear(referenceDate))).toBe(true);
      });
      
      test('lastYear returns previous year range', () => {
        const range = getDateRange('lastYear', referenceDate);
        const lastYear = subYears(referenceDate, 1);
        
        expect(isEqual(range.startDate, startOfYear(lastYear))).toBe(true);
        expect(isEqual(range.endDate, endOfYear(lastYear))).toBe(true);
      });
      
      test('last7Days returns range for last 7 days', () => {
        const range = getDateRange('last7Days', referenceDate);
        
        expect(isEqual(range.startDate, startOfDay(subDays(referenceDate, 6)))).toBe(true);
        expect(isEqual(range.endDate, endOfDay(referenceDate))).toBe(true);
      });
      
      test('last30Days returns range for last 30 days', () => {
        const range = getDateRange('last30Days', referenceDate);
        
        expect(isEqual(range.startDate, startOfDay(subDays(referenceDate, 29)))).toBe(true);
        expect(isEqual(range.endDate, endOfDay(referenceDate))).toBe(true);
      });
      
      test('last90Days returns range for last 90 days', () => {
        const range = getDateRange('last90Days', referenceDate);
        
        expect(isEqual(range.startDate, startOfDay(subDays(referenceDate, 89)))).toBe(true);
        expect(isEqual(range.endDate, endOfDay(referenceDate))).toBe(true);
      });
      
      test('last365Days returns range for last 365 days', () => {
        const range = getDateRange('last365Days', referenceDate);
        
        expect(isEqual(range.startDate, startOfDay(subDays(referenceDate, 364)))).toBe(true);
        expect(isEqual(range.endDate, endOfDay(referenceDate))).toBe(true);
      });
      
      test('currentQuarter returns range for current quarter', () => {
        const range = getDateRange('currentQuarter', referenceDate);
        
        // January 15, 2023 is in Q1 (Jan-Mar)
        const quarterStart = new Date(2023, 0, 1); // Jan 1
        const quarterEnd = new Date(2023, 2, 31); // Mar 31
        
        expect(isEqual(range.startDate, startOfDay(quarterStart))).toBe(true);
        expect(isEqual(range.endDate, endOfDay(quarterEnd))).toBe(true);
      });
      
      test('lastQuarter returns range for previous quarter', () => {
        const range = getDateRange('lastQuarter', referenceDate);
        
        // For January 15, 2023, the last quarter is Q4 of previous year (Oct-Dec 2022)
        const lastQuarterStart = new Date(2022, 9, 1); // Oct 1, 2022
        const lastQuarterEnd = new Date(2022, 11, 31); // Dec 31, 2022
        
        expect(isEqual(range.startDate, startOfDay(lastQuarterStart))).toBe(true);
        expect(isEqual(range.endDate, endOfDay(lastQuarterEnd))).toBe(true);
      });
      
      test('ytd returns range from start of year to current date', () => {
        const range = getDateRange('ytd', referenceDate);
        
        expect(isEqual(range.startDate, startOfYear(referenceDate))).toBe(true);
        expect(isEqual(range.endDate, endOfDay(referenceDate))).toBe(true);
      });
      
      test('custom returns range with reference date as both start and end', () => {
        const range = getDateRange('custom', referenceDate);
        
        expect(isEqual(range.startDate, startOfDay(referenceDate))).toBe(true);
        expect(isEqual(range.endDate, endOfDay(referenceDate))).toBe(true);
      });
    });
    
    describe('Different reference dates', () => {
      test('handles different months correctly', () => {
        // Test with April 15, 2023
        const aprilDate = new Date(2023, 3, 15);
        const range = getDateRange('thisMonth', aprilDate);
        
        expect(range.startDate.getMonth()).toBe(3); // April (0-indexed)
        expect(range.endDate.getMonth()).toBe(3); // April (0-indexed)
        expect(range.startDate.getDate()).toBe(1); // 1st day of month
        expect(range.endDate.getDate()).toBe(30); // Last day of April
      });
      
      test('handles leap years correctly', () => {
        // Test with February 2024 (leap year)
        const leapYearDate = new Date(2024, 1, 15); // February 15, 2024
        const range = getDateRange('thisMonth', leapYearDate);
        
        expect(range.startDate.getMonth()).toBe(1); // February (0-indexed)
        expect(range.endDate.getMonth()).toBe(1); // February (0-indexed)
        expect(range.startDate.getDate()).toBe(1); // 1st day of month
        expect(range.endDate.getDate()).toBe(29); // Last day of February in leap year
      });
      
      test('handles year boundaries correctly', () => {
        // Test with December 31, 2023
        const yearEndDate = new Date(2023, 11, 31);
        const range = getDateRange('last7Days', yearEndDate);
        
        // Should include dates from previous year
        expect(range.startDate.getFullYear()).toBe(2023);
        expect(range.startDate.getMonth()).toBe(11); // December (0-indexed)
        expect(range.startDate.getDate()).toBe(25); // December 25
        
        expect(range.endDate.getFullYear()).toBe(2023);
        expect(range.endDate.getMonth()).toBe(11); // December (0-indexed)
        expect(range.endDate.getDate()).toBe(31); // December 31
      });
    });
    
    describe('Error handling', () => {
      test('throws InvalidDateRangeError for invalid range type', () => {
        expect(() => {
          getDateRange('invalidRangeType' as DateRangeType);
        }).toThrow(InvalidDateRangeError);
      });
      
      test('throws InvalidDateRangeError for null reference date', () => {
        expect(() => {
          getDateRange('today', null as unknown as Date);
        }).toThrow(InvalidDateRangeError);
      });
      
      test('throws InvalidDateRangeError for invalid Date object', () => {
        expect(() => {
          getDateRange('today', new Date('invalid'));
        }).toThrow(InvalidDateRangeError);
      });
    });
  });

  describe('getDatesBetween', () => {
    describe('Valid date ranges', () => {
      test('returns array of dates between start and end (inclusive)', () => {
        const startDate = new Date(2023, 0, 1); // January 1, 2023
        const endDate = new Date(2023, 0, 5); // January 5, 2023
        
        const dates = getDatesBetween(startDate, endDate);
        
        expect(dates.length).toBe(5); // 5 days including start and end
        expect(dates[0].getDate()).toBe(1);
        expect(dates[1].getDate()).toBe(2);
        expect(dates[2].getDate()).toBe(3);
        expect(dates[3].getDate()).toBe(4);
        expect(dates[4].getDate()).toBe(5);
      });
      
      test('returns single date when start and end are the same day', () => {
        const sameDate = new Date(2023, 0, 15); // January 15, 2023
        
        const dates = getDatesBetween(sameDate, sameDate);
        
        expect(dates.length).toBe(1);
        expect(isSameDay(dates[0], sameDate)).toBe(true);
      });
      
      test('handles month boundaries correctly', () => {
        const startDate = new Date(2023, 0, 30); // January 30, 2023
        const endDate = new Date(2023, 1, 2); // February 2, 2023
        
        const dates = getDatesBetween(startDate, endDate);
        
        expect(dates.length).toBe(4); // Jan 30, 31, Feb 1, 2
        expect(dates[0].getMonth()).toBe(0); // January (0-indexed)
        expect(dates[0].getDate()).toBe(30);
        expect(dates[1].getMonth()).toBe(0); // January (0-indexed)
        expect(dates[1].getDate()).toBe(31);
        expect(dates[2].getMonth()).toBe(1); // February (0-indexed)
        expect(dates[2].getDate()).toBe(1);
        expect(dates[3].getMonth()).toBe(1); // February (0-indexed)
        expect(dates[3].getDate()).toBe(2);
      });
      
      test('handles year boundaries correctly', () => {
        const startDate = new Date(2022, 11, 30); // December 30, 2022
        const endDate = new Date(2023, 0, 2); // January 2, 2023
        
        const dates = getDatesBetween(startDate, endDate);
        
        expect(dates.length).toBe(4); // Dec 30, 31, Jan 1, 2
        expect(dates[0].getFullYear()).toBe(2022);
        expect(dates[0].getMonth()).toBe(11); // December (0-indexed)
        expect(dates[1].getFullYear()).toBe(2022);
        expect(dates[1].getMonth()).toBe(11); // December (0-indexed)
        expect(dates[2].getFullYear()).toBe(2023);
        expect(dates[2].getMonth()).toBe(0); // January (0-indexed)
        expect(dates[3].getFullYear()).toBe(2023);
        expect(dates[3].getMonth()).toBe(0); // January (0-indexed)
      });
      
      test('returns dates with time set to midnight', () => {
        const startDate = new Date(2023, 0, 1, 10, 30); // January 1, 2023, 10:30 AM
        const endDate = new Date(2023, 0, 2, 15, 45); // January 2, 2023, 3:45 PM
        
        const dates = getDatesBetween(startDate, endDate);
        
        expect(dates.length).toBe(2);
        // Time components should be preserved in the returned dates
        expect(dates[0].getHours()).toBe(10);
        expect(dates[0].getMinutes()).toBe(30);
        expect(dates[1].getHours()).toBe(15);
        expect(dates[1].getMinutes()).toBe(45);
      });
    });
    
    describe('Error handling', () => {
      test('throws InvalidDateRangeError for null start date', () => {
        expect(() => {
          getDatesBetween(null as unknown as Date, new Date());
        }).toThrow(InvalidDateRangeError);
      });
      
      test('throws InvalidDateRangeError for null end date', () => {
        expect(() => {
          getDatesBetween(new Date(), null as unknown as Date);
        }).toThrow(InvalidDateRangeError);
      });
      
      test('throws InvalidDateRangeError for invalid start Date object', () => {
        expect(() => {
          getDatesBetween(new Date('invalid'), new Date());
        }).toThrow(InvalidDateRangeError);
      });
      
      test('throws InvalidDateRangeError for invalid end Date object', () => {
        expect(() => {
          getDatesBetween(new Date(), new Date('invalid'));
        }).toThrow(InvalidDateRangeError);
      });
      
      test('throws InvalidDateRangeError when end date is before start date', () => {
        const startDate = new Date(2023, 0, 15); // January 15, 2023
        const endDate = new Date(2023, 0, 10); // January 10, 2023 (before start)
        
        expect(() => {
          getDatesBetween(startDate, endDate);
        }).toThrow(InvalidDateRangeError);
      });
    });
  });

  describe('isValidDateRange', () => {
    test('returns true for valid date range with different dates', () => {
      const startDate = new Date(2023, 0, 1); // January 1, 2023
      const endDate = new Date(2023, 0, 15); // January 15, 2023
      
      expect(isValidDateRange(startDate, endDate)).toBe(true);
    });
    
    test('returns true when start and end dates are the same', () => {
      const sameDate = new Date(2023, 0, 15); // January 15, 2023
      
      expect(isValidDateRange(sameDate, sameDate)).toBe(true);
    });
    
    test('returns false when end date is before start date', () => {
      const startDate = new Date(2023, 0, 15); // January 15, 2023
      const endDate = new Date(2023, 0, 1); // January 1, 2023 (before start)
      
      expect(isValidDateRange(startDate, endDate)).toBe(false);
    });
    
    test('returns false for null start date', () => {
      expect(isValidDateRange(null as unknown as Date, new Date())).toBe(false);
    });
    
    test('returns false for null end date', () => {
      expect(isValidDateRange(new Date(), null as unknown as Date)).toBe(false);
    });
    
    test('returns false for invalid start Date object', () => {
      expect(isValidDateRange(new Date('invalid'), new Date())).toBe(false);
    });
    
    test('returns false for invalid end Date object', () => {
      expect(isValidDateRange(new Date(), new Date('invalid'))).toBe(false);
    });
  });

  describe('createCustomDateRange', () => {
    test('creates custom date range with valid dates', () => {
      const startDate = new Date(2023, 0, 1); // January 1, 2023
      const endDate = new Date(2023, 0, 31); // January 31, 2023
      
      const range = createCustomDateRange(startDate, endDate);
      
      expect(isEqual(range.startDate, startOfDay(startDate))).toBe(true);
      expect(isEqual(range.endDate, endOfDay(endDate))).toBe(true);
    });
    
    test('creates custom date range when start and end dates are the same', () => {
      const sameDate = new Date(2023, 0, 15); // January 15, 2023
      
      const range = createCustomDateRange(sameDate, sameDate);
      
      expect(isEqual(range.startDate, startOfDay(sameDate))).toBe(true);
      expect(isEqual(range.endDate, endOfDay(sameDate))).toBe(true);
    });
    
    test('normalizes dates to start of day and end of day', () => {
      const startDate = new Date(2023, 0, 1, 10, 30); // January 1, 2023, 10:30 AM
      const endDate = new Date(2023, 0, 31, 15, 45); // January 31, 2023, 3:45 PM
      
      const range = createCustomDateRange(startDate, endDate);
      
      // Start date should be set to start of day
      expect(range.startDate.getHours()).toBe(0);
      expect(range.startDate.getMinutes()).toBe(0);
      expect(range.startDate.getSeconds()).toBe(0);
      expect(range.startDate.getMilliseconds()).toBe(0);
      
      // End date should be set to end of day
      expect(range.endDate.getHours()).toBe(23);
      expect(range.endDate.getMinutes()).toBe(59);
      expect(range.endDate.getSeconds()).toBe(59);
      expect(range.endDate.getMilliseconds()).toBe(999);
    });
    
    test('throws InvalidDateRangeError when end date is before start date', () => {
      const startDate = new Date(2023, 0, 15); // January 15, 2023
      const endDate = new Date(2023, 0, 1); // January 1, 2023 (before start)
      
      expect(() => {
        createCustomDateRange(startDate, endDate);
      }).toThrow(InvalidDateRangeError);
    });
    
    test('throws InvalidDateRangeError for null start date', () => {
      expect(() => {
        createCustomDateRange(null as unknown as Date, new Date());
      }).toThrow(InvalidDateRangeError);
    });
    
    test('throws InvalidDateRangeError for null end date', () => {
      expect(() => {
        createCustomDateRange(new Date(), null as unknown as Date);
      }).toThrow(InvalidDateRangeError);
    });
    
    test('throws InvalidDateRangeError for invalid start Date object', () => {
      expect(() => {
        createCustomDateRange(new Date('invalid'), new Date());
      }).toThrow(InvalidDateRangeError);
    });
    
    test('throws InvalidDateRangeError for invalid end Date object', () => {
      expect(() => {
        createCustomDateRange(new Date(), new Date('invalid'));
      }).toThrow(InvalidDateRangeError);
    });
  });
});
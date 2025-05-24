import { getDateRange, getDatesBetween } from '../range';

describe('Date Range Utilities', () => {
  describe('getDateRange', () => {
    const testDate = new Date('2023-05-15T12:00:00Z'); // Tuesday, May 15, 2023

    test('should return correct range for today', () => {
      const range = getDateRange('today', testDate);
      
      // Start date should be the beginning of the test date
      expect(range.startDate.getFullYear()).toBe(2023);
      expect(range.startDate.getMonth()).toBe(4); // May is month 4 (0-indexed)
      expect(range.startDate.getDate()).toBe(15);
      expect(range.startDate.getHours()).toBe(0);
      expect(range.startDate.getMinutes()).toBe(0);
      expect(range.startDate.getSeconds()).toBe(0);
      
      // End date should be the end of the test date
      expect(range.endDate.getFullYear()).toBe(2023);
      expect(range.endDate.getMonth()).toBe(4);
      expect(range.endDate.getDate()).toBe(15);
      expect(range.endDate.getHours()).toBe(23);
      expect(range.endDate.getMinutes()).toBe(59);
      expect(range.endDate.getSeconds()).toBe(59);
    });

    test('should return correct range for yesterday', () => {
      const range = getDateRange('yesterday', testDate);
      
      // Start date should be the beginning of the previous day
      expect(range.startDate.getFullYear()).toBe(2023);
      expect(range.startDate.getMonth()).toBe(4);
      expect(range.startDate.getDate()).toBe(14);
      expect(range.startDate.getHours()).toBe(0);
      expect(range.startDate.getMinutes()).toBe(0);
      expect(range.startDate.getSeconds()).toBe(0);
      
      // End date should be the end of the previous day
      expect(range.endDate.getFullYear()).toBe(2023);
      expect(range.endDate.getMonth()).toBe(4);
      expect(range.endDate.getDate()).toBe(14);
      expect(range.endDate.getHours()).toBe(23);
      expect(range.endDate.getMinutes()).toBe(59);
      expect(range.endDate.getSeconds()).toBe(59);
    });

    test('should return correct range for thisWeek', () => {
      const range = getDateRange('thisWeek', testDate);
      
      // Start date should be the beginning of the week (Sunday)
      expect(range.startDate.getFullYear()).toBe(2023);
      expect(range.startDate.getMonth()).toBe(4);
      expect(range.startDate.getDate()).toBe(14); // Sunday, May 14, 2023
      expect(range.startDate.getHours()).toBe(0);
      expect(range.startDate.getMinutes()).toBe(0);
      expect(range.startDate.getSeconds()).toBe(0);
      
      // End date should be the end of the week (Saturday)
      expect(range.endDate.getFullYear()).toBe(2023);
      expect(range.endDate.getMonth()).toBe(4);
      expect(range.endDate.getDate()).toBe(20); // Saturday, May 20, 2023
      expect(range.endDate.getHours()).toBe(23);
      expect(range.endDate.getMinutes()).toBe(59);
      expect(range.endDate.getSeconds()).toBe(59);
    });

    test('should return correct range for lastWeek', () => {
      const range = getDateRange('lastWeek', testDate);
      
      // Start date should be the beginning of the previous week
      expect(range.startDate.getFullYear()).toBe(2023);
      expect(range.startDate.getMonth()).toBe(4);
      expect(range.startDate.getDate()).toBe(7); // Sunday, May 7, 2023
      expect(range.startDate.getHours()).toBe(0);
      expect(range.startDate.getMinutes()).toBe(0);
      expect(range.startDate.getSeconds()).toBe(0);
      
      // End date should be the end of the previous week
      expect(range.endDate.getFullYear()).toBe(2023);
      expect(range.endDate.getMonth()).toBe(4);
      expect(range.endDate.getDate()).toBe(13); // Saturday, May 13, 2023
      expect(range.endDate.getHours()).toBe(23);
      expect(range.endDate.getMinutes()).toBe(59);
      expect(range.endDate.getSeconds()).toBe(59);
    });

    test('should return correct range for thisMonth', () => {
      const range = getDateRange('thisMonth', testDate);
      
      // Start date should be the beginning of the month
      expect(range.startDate.getFullYear()).toBe(2023);
      expect(range.startDate.getMonth()).toBe(4);
      expect(range.startDate.getDate()).toBe(1); // May 1, 2023
      expect(range.startDate.getHours()).toBe(0);
      expect(range.startDate.getMinutes()).toBe(0);
      expect(range.startDate.getSeconds()).toBe(0);
      
      // End date should be the end of the month
      expect(range.endDate.getFullYear()).toBe(2023);
      expect(range.endDate.getMonth()).toBe(4);
      expect(range.endDate.getDate()).toBe(31); // May 31, 2023
      expect(range.endDate.getHours()).toBe(23);
      expect(range.endDate.getMinutes()).toBe(59);
      expect(range.endDate.getSeconds()).toBe(59);
    });

    test('should return correct range for lastMonth', () => {
      const range = getDateRange('lastMonth', testDate);
      
      // Start date should be the beginning of the previous month
      expect(range.startDate.getFullYear()).toBe(2023);
      expect(range.startDate.getMonth()).toBe(3); // April is month 3 (0-indexed)
      expect(range.startDate.getDate()).toBe(1); // April 1, 2023
      expect(range.startDate.getHours()).toBe(0);
      expect(range.startDate.getMinutes()).toBe(0);
      expect(range.startDate.getSeconds()).toBe(0);
      
      // End date should be the end of the previous month
      expect(range.endDate.getFullYear()).toBe(2023);
      expect(range.endDate.getMonth()).toBe(3);
      expect(range.endDate.getDate()).toBe(30); // April 30, 2023
      expect(range.endDate.getHours()).toBe(23);
      expect(range.endDate.getMinutes()).toBe(59);
      expect(range.endDate.getSeconds()).toBe(59);
    });

    test('should return correct range for thisYear', () => {
      const range = getDateRange('thisYear', testDate);
      
      // Start date should be the beginning of the year
      expect(range.startDate.getFullYear()).toBe(2023);
      expect(range.startDate.getMonth()).toBe(0); // January is month 0
      expect(range.startDate.getDate()).toBe(1); // January 1, 2023
      expect(range.startDate.getHours()).toBe(0);
      expect(range.startDate.getMinutes()).toBe(0);
      expect(range.startDate.getSeconds()).toBe(0);
      
      // End date should be the end of the year
      expect(range.endDate.getFullYear()).toBe(2023);
      expect(range.endDate.getMonth()).toBe(11); // December is month 11
      expect(range.endDate.getDate()).toBe(31); // December 31, 2023
      expect(range.endDate.getHours()).toBe(23);
      expect(range.endDate.getMinutes()).toBe(59);
      expect(range.endDate.getSeconds()).toBe(59);
    });

    test('should return correct range for lastYear', () => {
      const range = getDateRange('lastYear', testDate);
      
      // Start date should be the beginning of the previous year
      expect(range.startDate.getFullYear()).toBe(2022);
      expect(range.startDate.getMonth()).toBe(0);
      expect(range.startDate.getDate()).toBe(1); // January 1, 2022
      expect(range.startDate.getHours()).toBe(0);
      expect(range.startDate.getMinutes()).toBe(0);
      expect(range.startDate.getSeconds()).toBe(0);
      
      // End date should be the end of the previous year
      expect(range.endDate.getFullYear()).toBe(2022);
      expect(range.endDate.getMonth()).toBe(11);
      expect(range.endDate.getDate()).toBe(31); // December 31, 2022
      expect(range.endDate.getHours()).toBe(23);
      expect(range.endDate.getMinutes()).toBe(59);
      expect(range.endDate.getSeconds()).toBe(59);
    });

    test('should return correct range for last7Days', () => {
      const range = getDateRange('last7Days', testDate);
      
      // Start date should be 6 days before the test date
      expect(range.startDate.getFullYear()).toBe(2023);
      expect(range.startDate.getMonth()).toBe(4);
      expect(range.startDate.getDate()).toBe(9); // May 9, 2023
      expect(range.startDate.getHours()).toBe(0);
      expect(range.startDate.getMinutes()).toBe(0);
      expect(range.startDate.getSeconds()).toBe(0);
      
      // End date should be the end of the test date
      expect(range.endDate.getFullYear()).toBe(2023);
      expect(range.endDate.getMonth()).toBe(4);
      expect(range.endDate.getDate()).toBe(15); // May 15, 2023
      expect(range.endDate.getHours()).toBe(23);
      expect(range.endDate.getMinutes()).toBe(59);
      expect(range.endDate.getSeconds()).toBe(59);
    });

    test('should return correct range for last30Days', () => {
      const range = getDateRange('last30Days', testDate);
      
      // Start date should be 29 days before the test date
      expect(range.startDate.getFullYear()).toBe(2023);
      expect(range.startDate.getMonth()).toBe(3); // April
      expect(range.startDate.getDate()).toBe(16); // April 16, 2023
      expect(range.startDate.getHours()).toBe(0);
      expect(range.startDate.getMinutes()).toBe(0);
      expect(range.startDate.getSeconds()).toBe(0);
      
      // End date should be the end of the test date
      expect(range.endDate.getFullYear()).toBe(2023);
      expect(range.endDate.getMonth()).toBe(4);
      expect(range.endDate.getDate()).toBe(15); // May 15, 2023
      expect(range.endDate.getHours()).toBe(23);
      expect(range.endDate.getMinutes()).toBe(59);
      expect(range.endDate.getSeconds()).toBe(59);
    });

    test('should return correct range for last90Days', () => {
      const range = getDateRange('last90Days', testDate);
      
      // Start date should be 89 days before the test date
      expect(range.startDate.getFullYear()).toBe(2023);
      expect(range.startDate.getMonth()).toBe(1); // February
      expect(range.startDate.getDate()).toBe(15); // February 15, 2023
      expect(range.startDate.getHours()).toBe(0);
      expect(range.startDate.getMinutes()).toBe(0);
      expect(range.startDate.getSeconds()).toBe(0);
      
      // End date should be the end of the test date
      expect(range.endDate.getFullYear()).toBe(2023);
      expect(range.endDate.getMonth()).toBe(4);
      expect(range.endDate.getDate()).toBe(15); // May 15, 2023
      expect(range.endDate.getHours()).toBe(23);
      expect(range.endDate.getMinutes()).toBe(59);
      expect(range.endDate.getSeconds()).toBe(59);
    });

    test('should return correct range for last365Days', () => {
      const range = getDateRange('last365Days', testDate);
      
      // Start date should be 364 days before the test date
      expect(range.startDate.getFullYear()).toBe(2022);
      expect(range.startDate.getMonth()).toBe(4); // May
      expect(range.startDate.getDate()).toBe(16); // May 16, 2022
      expect(range.startDate.getHours()).toBe(0);
      expect(range.startDate.getMinutes()).toBe(0);
      expect(range.startDate.getSeconds()).toBe(0);
      
      // End date should be the end of the test date
      expect(range.endDate.getFullYear()).toBe(2023);
      expect(range.endDate.getMonth()).toBe(4);
      expect(range.endDate.getDate()).toBe(15); // May 15, 2023
      expect(range.endDate.getHours()).toBe(23);
      expect(range.endDate.getMinutes()).toBe(59);
      expect(range.endDate.getSeconds()).toBe(59);
    });

    test('should use default range (today) for invalid range type', () => {
      const range = getDateRange('invalidRangeType', testDate);
      
      // Should default to today's range
      expect(range.startDate.getFullYear()).toBe(2023);
      expect(range.startDate.getMonth()).toBe(4);
      expect(range.startDate.getDate()).toBe(15);
      expect(range.startDate.getHours()).toBe(0);
      expect(range.startDate.getMinutes()).toBe(0);
      expect(range.startDate.getSeconds()).toBe(0);
      
      expect(range.endDate.getFullYear()).toBe(2023);
      expect(range.endDate.getMonth()).toBe(4);
      expect(range.endDate.getDate()).toBe(15);
      expect(range.endDate.getHours()).toBe(23);
      expect(range.endDate.getMinutes()).toBe(59);
      expect(range.endDate.getSeconds()).toBe(59);
    });
  });

  describe('getDatesBetween', () => {
    test('should return array of dates between start and end dates (inclusive)', () => {
      const startDate = new Date('2023-05-15');
      const endDate = new Date('2023-05-18');
      
      const dates = getDatesBetween(startDate, endDate);
      
      expect(dates.length).toBe(4); // 4 days including start and end dates
      
      // Check each date in the array
      expect(dates[0].getFullYear()).toBe(2023);
      expect(dates[0].getMonth()).toBe(4);
      expect(dates[0].getDate()).toBe(15);
      
      expect(dates[1].getFullYear()).toBe(2023);
      expect(dates[1].getMonth()).toBe(4);
      expect(dates[1].getDate()).toBe(16);
      
      expect(dates[2].getFullYear()).toBe(2023);
      expect(dates[2].getMonth()).toBe(4);
      expect(dates[2].getDate()).toBe(17);
      
      expect(dates[3].getFullYear()).toBe(2023);
      expect(dates[3].getMonth()).toBe(4);
      expect(dates[3].getDate()).toBe(18);
    });

    test('should return single date when start and end dates are the same', () => {
      const sameDate = new Date('2023-05-15');
      
      const dates = getDatesBetween(sameDate, sameDate);
      
      expect(dates.length).toBe(1);
      expect(dates[0].getFullYear()).toBe(2023);
      expect(dates[0].getMonth()).toBe(4);
      expect(dates[0].getDate()).toBe(15);
    });

    test('should throw error when start date is after end date', () => {
      const startDate = new Date('2023-05-18');
      const endDate = new Date('2023-05-15');
      
      expect(() => getDatesBetween(startDate, endDate)).toThrow('Start date must be before or the same as end date');
    });

    test('should throw error when invalid dates are provided', () => {
      const validDate = new Date('2023-05-15');
      const invalidDate = new Date('invalid-date');
      
      expect(() => getDatesBetween(invalidDate, validDate)).toThrow('Invalid date range provided');
      expect(() => getDatesBetween(validDate, invalidDate)).toThrow('Invalid date range provided');
      expect(() => getDatesBetween(invalidDate, invalidDate)).toThrow('Invalid date range provided');
    });
  });
});
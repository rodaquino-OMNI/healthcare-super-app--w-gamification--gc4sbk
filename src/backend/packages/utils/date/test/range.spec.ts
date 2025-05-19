/**
 * Tests for date range utility re-exports
 * @group unit
 * @group utils
 * @group date
 */

import { getDateRange, getDatesBetween, isDateInRange, DateRangeType, DateRange } from '../range';
import { InvalidDateRangeError } from '../../src/date/range';

describe('Date Range Utilities', () => {
  describe('getDateRange', () => {
    it('should be properly exported', () => {
      expect(getDateRange).toBeDefined();
      expect(typeof getDateRange).toBe('function');
    });

    it('should return correct range for today', () => {
      const today = new Date('2023-05-15T12:00:00Z');
      const result = getDateRange('today', today);

      expect(result).toBeDefined();
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
      
      // Start date should be the beginning of the day
      expect(result.startDate.getHours()).toBe(0);
      expect(result.startDate.getMinutes()).toBe(0);
      expect(result.startDate.getSeconds()).toBe(0);
      expect(result.startDate.getMilliseconds()).toBe(0);
      
      // End date should be the end of the day
      expect(result.endDate.getHours()).toBe(23);
      expect(result.endDate.getMinutes()).toBe(59);
      expect(result.endDate.getSeconds()).toBe(59);
      expect(result.endDate.getMilliseconds()).toBe(999);
      
      // Both dates should be on the same day
      expect(result.startDate.getDate()).toBe(today.getDate());
      expect(result.startDate.getMonth()).toBe(today.getMonth());
      expect(result.startDate.getFullYear()).toBe(today.getFullYear());
      expect(result.endDate.getDate()).toBe(today.getDate());
      expect(result.endDate.getMonth()).toBe(today.getMonth());
      expect(result.endDate.getFullYear()).toBe(today.getFullYear());
    });

    it('should return correct range for yesterday', () => {
      const today = new Date('2023-05-15T12:00:00Z');
      const result = getDateRange('yesterday', today);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      expect(result).toBeDefined();
      expect(result.startDate.getDate()).toBe(yesterday.getDate());
      expect(result.startDate.getMonth()).toBe(yesterday.getMonth());
      expect(result.startDate.getFullYear()).toBe(yesterday.getFullYear());
      expect(result.endDate.getDate()).toBe(yesterday.getDate());
      expect(result.endDate.getMonth()).toBe(yesterday.getMonth());
      expect(result.endDate.getFullYear()).toBe(yesterday.getFullYear());
    });

    it('should return correct range for thisWeek', () => {
      const wednesday = new Date('2023-05-17T12:00:00Z'); // Wednesday
      const result = getDateRange('thisWeek', wednesday);
      
      // Week should start on Sunday (May 14) and end on Saturday (May 20)
      expect(result.startDate.getDate()).toBe(14);
      expect(result.startDate.getMonth()).toBe(4); // May is 4 (0-indexed)
      expect(result.startDate.getFullYear()).toBe(2023);
      expect(result.endDate.getDate()).toBe(20);
      expect(result.endDate.getMonth()).toBe(4);
      expect(result.endDate.getFullYear()).toBe(2023);
    });

    it('should return correct range for thisMonth', () => {
      const midMonth = new Date('2023-05-15T12:00:00Z');
      const result = getDateRange('thisMonth', midMonth);
      
      // Month should start on May 1 and end on May 31
      expect(result.startDate.getDate()).toBe(1);
      expect(result.startDate.getMonth()).toBe(4); // May is 4 (0-indexed)
      expect(result.startDate.getFullYear()).toBe(2023);
      expect(result.endDate.getDate()).toBe(31);
      expect(result.endDate.getMonth()).toBe(4);
      expect(result.endDate.getFullYear()).toBe(2023);
    });

    it('should return correct range for thisYear', () => {
      const midYear = new Date('2023-06-15T12:00:00Z');
      const result = getDateRange('thisYear', midYear);
      
      // Year should start on January 1 and end on December 31
      expect(result.startDate.getDate()).toBe(1);
      expect(result.startDate.getMonth()).toBe(0); // January is 0
      expect(result.startDate.getFullYear()).toBe(2023);
      expect(result.endDate.getDate()).toBe(31);
      expect(result.endDate.getMonth()).toBe(11); // December is 11
      expect(result.endDate.getFullYear()).toBe(2023);
    });

    it('should return correct range for last7Days', () => {
      const today = new Date('2023-05-15T12:00:00Z');
      const result = getDateRange('last7Days', today);
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      
      // Should start 6 days ago and end today
      expect(result.startDate.getDate()).toBe(sevenDaysAgo.getDate());
      expect(result.startDate.getMonth()).toBe(sevenDaysAgo.getMonth());
      expect(result.startDate.getFullYear()).toBe(sevenDaysAgo.getFullYear());
      expect(result.endDate.getDate()).toBe(today.getDate());
      expect(result.endDate.getMonth()).toBe(today.getMonth());
      expect(result.endDate.getFullYear()).toBe(today.getFullYear());
    });

    it('should throw an error for invalid range type', () => {
      expect(() => {
        // @ts-expect-error Testing invalid range type
        getDateRange('invalidRange');
      }).toThrow(InvalidDateRangeError);
    });

    it('should throw an error for invalid reference date', () => {
      expect(() => {
        // @ts-expect-error Testing invalid date
        getDateRange('today', 'not-a-date');
      }).toThrow(InvalidDateRangeError);

      expect(() => {
        getDateRange('today', new Date('invalid-date'));
      }).toThrow(InvalidDateRangeError);
    });
  });

  describe('getDatesBetween', () => {
    it('should be properly exported', () => {
      expect(getDatesBetween).toBeDefined();
      expect(typeof getDatesBetween).toBe('function');
    });

    it('should return an array of dates between start and end dates', () => {
      const startDate = new Date('2023-05-01');
      const endDate = new Date('2023-05-05');
      const result = getDatesBetween(startDate, endDate);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5); // 5 days including start and end dates
      
      // Check each date in the array
      expect(result[0].getDate()).toBe(1);
      expect(result[1].getDate()).toBe(2);
      expect(result[2].getDate()).toBe(3);
      expect(result[3].getDate()).toBe(4);
      expect(result[4].getDate()).toBe(5);
      
      // All dates should be in May 2023
      result.forEach(date => {
        expect(date.getMonth()).toBe(4); // May is 4 (0-indexed)
        expect(date.getFullYear()).toBe(2023);
      });
    });

    it('should return a single date when start and end dates are the same', () => {
      const sameDate = new Date('2023-05-15');
      const result = getDatesBetween(sameDate, sameDate);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].getDate()).toBe(sameDate.getDate());
      expect(result[0].getMonth()).toBe(sameDate.getMonth());
      expect(result[0].getFullYear()).toBe(sameDate.getFullYear());
    });

    it('should throw an error when start date is after end date', () => {
      const startDate = new Date('2023-05-15');
      const endDate = new Date('2023-05-10'); // Before start date
      
      expect(() => {
        getDatesBetween(startDate, endDate);
      }).toThrow(InvalidDateRangeError);
    });

    it('should throw an error for invalid start date', () => {
      const endDate = new Date('2023-05-15');
      
      expect(() => {
        // @ts-expect-error Testing invalid date
        getDatesBetween('not-a-date', endDate);
      }).toThrow(InvalidDateRangeError);

      expect(() => {
        getDatesBetween(new Date('invalid-date'), endDate);
      }).toThrow(InvalidDateRangeError);
    });

    it('should throw an error for invalid end date', () => {
      const startDate = new Date('2023-05-10');
      
      expect(() => {
        // @ts-expect-error Testing invalid date
        getDatesBetween(startDate, 'not-a-date');
      }).toThrow(InvalidDateRangeError);

      expect(() => {
        getDatesBetween(startDate, new Date('invalid-date'));
      }).toThrow(InvalidDateRangeError);
    });
  });

  describe('isDateInRange', () => {
    it('should be properly exported', () => {
      expect(isDateInRange).toBeDefined();
      expect(typeof isDateInRange).toBe('function');
    });

    it('should return true when date is within range', () => {
      const startDate = new Date('2023-05-01');
      const endDate = new Date('2023-05-31');
      const dateInRange = new Date('2023-05-15');
      
      expect(isDateInRange(dateInRange, startDate, endDate)).toBe(true);
    });

    it('should return true when date is at start of range', () => {
      const startDate = new Date('2023-05-01');
      const endDate = new Date('2023-05-31');
      
      expect(isDateInRange(startDate, startDate, endDate)).toBe(true);
    });

    it('should return true when date is at end of range', () => {
      const startDate = new Date('2023-05-01');
      const endDate = new Date('2023-05-31');
      
      expect(isDateInRange(endDate, startDate, endDate)).toBe(true);
    });

    it('should return false when date is before range', () => {
      const startDate = new Date('2023-05-01');
      const endDate = new Date('2023-05-31');
      const dateBeforeRange = new Date('2023-04-15');
      
      expect(isDateInRange(dateBeforeRange, startDate, endDate)).toBe(false);
    });

    it('should return false when date is after range', () => {
      const startDate = new Date('2023-05-01');
      const endDate = new Date('2023-05-31');
      const dateAfterRange = new Date('2023-06-15');
      
      expect(isDateInRange(dateAfterRange, startDate, endDate)).toBe(false);
    });

    it('should return false for invalid dates', () => {
      const validDate = new Date('2023-05-15');
      
      // @ts-expect-error Testing invalid date
      expect(isDateInRange('not-a-date', validDate, validDate)).toBe(false);
      // @ts-expect-error Testing invalid date
      expect(isDateInRange(validDate, 'not-a-date', validDate)).toBe(false);
      // @ts-expect-error Testing invalid date
      expect(isDateInRange(validDate, validDate, 'not-a-date')).toBe(false);
      
      expect(isDateInRange(new Date('invalid-date'), validDate, validDate)).toBe(false);
      expect(isDateInRange(validDate, new Date('invalid-date'), validDate)).toBe(false);
      expect(isDateInRange(validDate, validDate, new Date('invalid-date'))).toBe(false);
    });
  });

  describe('Types', () => {
    it('should export DateRangeType type', () => {
      // Create a variable with DateRangeType to verify it's exported
      const rangeType: DateRangeType = 'today';
      expect(rangeType).toBe('today');
      
      // Test with other valid range types
      const validRangeTypes: DateRangeType[] = [
        'today',
        'yesterday',
        'thisWeek',
        'lastWeek',
        'thisMonth',
        'lastMonth',
        'thisYear',
        'lastYear',
        'last7Days',
        'last30Days',
        'last90Days',
        'last365Days',
        'currentQuarter',
        'lastQuarter',
        'ytd',
        'custom'
      ];
      
      validRangeTypes.forEach(type => {
        expect(() => {
          const result = getDateRange(type);
          expect(result).toBeDefined();
          expect(result.startDate).toBeInstanceOf(Date);
          expect(result.endDate).toBeInstanceOf(Date);
        }).not.toThrow();
      });
    });

    it('should export DateRange interface', () => {
      // Create a variable with DateRange to verify it's exported
      const range: DateRange = {
        startDate: new Date(),
        endDate: new Date()
      };
      
      expect(range).toBeDefined();
      expect(range.startDate).toBeInstanceOf(Date);
      expect(range.endDate).toBeInstanceOf(Date);
    });
  });
});
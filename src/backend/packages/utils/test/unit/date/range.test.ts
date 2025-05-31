/**
 * Test suite for date range utility functions
 * 
 * Tests the following functions:
 * - getDateRange: Returns a date range (startDate, endDate) for predefined range types
 * - getDatesBetween: Returns an array of dates between a start and end date
 * - isDateInRange: Checks if a date is within a given range
 */

import { MockDate } from 'mockdate';
import {
  getDateRange,
  getDatesBetween,
  isDateInRange
} from '../../../src/date/range';

import {
  REFERENCE_DATES,
  EXPECTED_RANGES,
  RANGE_TYPE_MAPPING,
  DATE_RANGE_INCLUSION_TESTS,
  DATES_BETWEEN_TESTS,
  JOURNEY_DATE_RANGES,
  EDGE_CASE_FIXTURES
} from '../../fixtures/date/range';

describe('Date Range Utilities', () => {
  // Set up date mocking for deterministic tests
  beforeAll(() => {
    // Set the fixed date to our standard reference date
    MockDate.set(REFERENCE_DATES.STANDARD);
  });

  afterAll(() => {
    // Reset the date mock after all tests
    MockDate.reset();
  });

  describe('getDateRange', () => {
    describe('Predefined Range Types', () => {
      // Test each predefined range type
      Object.entries(RANGE_TYPE_MAPPING).forEach(([rangeType, expectedRangeKey]) => {
        it(`should return correct range for ${rangeType}`, () => {
          const expectedRange = EXPECTED_RANGES[expectedRangeKey];
          const result = getDateRange(rangeType);
          
          expect(result.startDate).toEqual(expectedRange.startDate);
          expect(result.endDate).toEqual(expectedRange.endDate);
        });
      });

      it('should throw an error for invalid range type', () => {
        expect(() => getDateRange('invalidRangeType')).toThrow();
      });
    });

    describe('Custom Date Ranges', () => {
      it('should return correct range for custom start and end dates', () => {
        const startDate = new Date('2023-01-01T00:00:00Z');
        const endDate = new Date('2023-01-31T23:59:59.999Z');
        
        const result = getDateRange('custom', { startDate, endDate });
        
        expect(result.startDate).toEqual(startDate);
        expect(result.endDate).toEqual(endDate);
      });

      it('should throw an error if custom range is requested without dates', () => {
        expect(() => getDateRange('custom')).toThrow();
      });

      it('should throw an error if end date is before start date', () => {
        const startDate = new Date('2023-01-31T00:00:00Z');
        const endDate = new Date('2023-01-01T00:00:00Z');
        
        expect(() => getDateRange('custom', { startDate, endDate })).toThrow();
      });
    });

    describe('Reference Date Parameter', () => {
      it('should use provided reference date instead of current date', () => {
        const referenceDate = REFERENCE_DATES.JANUARY;
        const result = getDateRange('today', null, referenceDate);
        
        // Should be January 15, 2023 (00:00:00 to 23:59:59)
        expect(result.startDate).toEqual(new Date('2023-01-15T00:00:00Z'));
        expect(result.endDate).toEqual(new Date('2023-01-15T23:59:59.999Z'));
      });

      it('should calculate relative ranges from reference date', () => {
        const referenceDate = REFERENCE_DATES.JANUARY;
        const result = getDateRange('last7Days', null, referenceDate);
        
        // Should be January 9-15, 2023
        expect(result.startDate).toEqual(new Date('2023-01-09T00:00:00Z'));
        expect(result.endDate).toEqual(new Date('2023-01-15T23:59:59.999Z'));
      });
    });
  });

  describe('getDatesBetween', () => {
    DATES_BETWEEN_TESTS.forEach(test => {
      it(`should return correct dates for ${test.description}`, () => {
        const result = getDatesBetween(test.startDate, test.endDate);
        
        expect(result.length).toBe(test.expectedCount);
        expect(result[0]).toEqual(test.expectedFirstDate);
        expect(result[result.length - 1]).toEqual(test.expectedLastDate);
      });
    });

    it('should return dates with the specified interval', () => {
      const startDate = new Date('2023-01-01T00:00:00Z');
      const endDate = new Date('2023-01-31T23:59:59.999Z');
      
      // Test with 7-day interval
      const result = getDatesBetween(startDate, endDate, { days: 7 });
      
      // Should return 5 dates: Jan 1, 8, 15, 22, 29
      expect(result.length).toBe(5);
      expect(result[0]).toEqual(new Date('2023-01-01T00:00:00Z'));
      expect(result[1]).toEqual(new Date('2023-01-08T00:00:00Z'));
      expect(result[2]).toEqual(new Date('2023-01-15T00:00:00Z'));
      expect(result[3]).toEqual(new Date('2023-01-22T00:00:00Z'));
      expect(result[4]).toEqual(new Date('2023-01-29T00:00:00Z'));
    });

    it('should handle intervals specified in hours', () => {
      const startDate = new Date('2023-01-01T00:00:00Z');
      const endDate = new Date('2023-01-01T23:59:59.999Z');
      
      // Test with 6-hour interval
      const result = getDatesBetween(startDate, endDate, { hours: 6 });
      
      // Should return 4 dates: 00:00, 06:00, 12:00, 18:00
      expect(result.length).toBe(4);
      expect(result[0]).toEqual(new Date('2023-01-01T00:00:00Z'));
      expect(result[1]).toEqual(new Date('2023-01-01T06:00:00Z'));
      expect(result[2]).toEqual(new Date('2023-01-01T12:00:00Z'));
      expect(result[3]).toEqual(new Date('2023-01-01T18:00:00Z'));
    });

    it('should throw an error if end date is before start date', () => {
      const startDate = new Date('2023-01-31T00:00:00Z');
      const endDate = new Date('2023-01-01T00:00:00Z');
      
      expect(() => getDatesBetween(startDate, endDate)).toThrow();
    });

    it('should handle a single day (same start and end date)', () => {
      const startDate = new Date('2023-01-01T00:00:00Z');
      const endDate = new Date('2023-01-01T23:59:59.999Z');
      
      const result = getDatesBetween(startDate, endDate);
      
      expect(result.length).toBe(1);
      expect(result[0]).toEqual(startDate);
    });
  });

  describe('isDateInRange', () => {
    DATE_RANGE_INCLUSION_TESTS.forEach(test => {
      it(`should return ${test.expectedResult} when ${test.description}`, () => {
        const result = isDateInRange(test.date, test.range);
        expect(result).toBe(test.expectedResult);
      });
    });

    it('should respect inclusivity options for range boundaries', () => {
      const date = new Date('2023-06-01T00:00:00Z');
      const range = {
        startDate: new Date('2023-06-01T00:00:00Z'),
        endDate: new Date('2023-06-30T23:59:59.999Z')
      };
      
      // Default behavior (inclusive)
      expect(isDateInRange(date, range)).toBe(true);
      
      // Exclusive start date
      expect(isDateInRange(date, range, { includeStart: false })).toBe(false);
      
      // Exclusive end date (shouldn't affect this test case)
      expect(isDateInRange(date, range, { includeEnd: false })).toBe(true);
      
      // Both exclusive
      expect(isDateInRange(date, range, { includeStart: false, includeEnd: false })).toBe(false);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle leap year dates correctly', () => {
      const leapYearDate = EDGE_CASE_FIXTURES.LEAP_YEAR_DATE;
      
      // Set mock date to leap year date
      MockDate.set(leapYearDate);
      
      const result = getDateRange('today');
      
      expect(result.startDate).toEqual(new Date('2024-02-29T00:00:00Z'));
      expect(result.endDate).toEqual(new Date('2024-02-29T23:59:59.999Z'));
      
      // Reset mock date to standard reference date
      MockDate.set(REFERENCE_DATES.STANDARD);
    });

    it('should handle daylight saving time transitions correctly', () => {
      // Test with DST start date
      MockDate.set(EDGE_CASE_FIXTURES.DST_START);
      
      const dstStartResult = getDateRange('today');
      
      expect(dstStartResult.startDate).toEqual(new Date('2023-10-15T00:00:00Z'));
      expect(dstStartResult.endDate).toEqual(new Date('2023-10-15T23:59:59.999Z'));
      
      // Test with DST end date
      MockDate.set(EDGE_CASE_FIXTURES.DST_END);
      
      const dstEndResult = getDateRange('today');
      
      expect(dstEndResult.startDate).toEqual(new Date('2023-02-26T00:00:00Z'));
      expect(dstEndResult.endDate).toEqual(new Date('2023-02-26T23:59:59.999Z'));
      
      // Reset mock date to standard reference date
      MockDate.set(REFERENCE_DATES.STANDARD);
    });

    it('should handle month boundaries correctly', () => {
      // Test with last day of a 31-day month
      MockDate.set(EDGE_CASE_FIXTURES.LONG_MONTH_END);
      
      const longMonthResult = getDateRange('thisMonth');
      
      expect(longMonthResult.startDate).toEqual(new Date('2023-01-01T00:00:00Z'));
      expect(longMonthResult.endDate).toEqual(new Date('2023-01-31T23:59:59.999Z'));
      
      // Test with last day of a 30-day month
      MockDate.set(EDGE_CASE_FIXTURES.SHORT_MONTH_END);
      
      const shortMonthResult = getDateRange('thisMonth');
      
      expect(shortMonthResult.startDate).toEqual(new Date('2023-04-01T00:00:00Z'));
      expect(shortMonthResult.endDate).toEqual(new Date('2023-04-30T23:59:59.999Z'));
      
      // Reset mock date to standard reference date
      MockDate.set(REFERENCE_DATES.STANDARD);
    });

    it('should handle year boundaries correctly', () => {
      // Test with last day of the year
      MockDate.set(EDGE_CASE_FIXTURES.YEAR_BOUNDARY_START);
      
      const yearEndResult = getDateRange('thisYear');
      
      expect(yearEndResult.startDate).toEqual(new Date('2022-01-01T00:00:00Z'));
      expect(yearEndResult.endDate).toEqual(new Date('2022-12-31T23:59:59.999Z'));
      
      // Test with first day of the year
      MockDate.set(EDGE_CASE_FIXTURES.YEAR_BOUNDARY_END);
      
      const yearStartResult = getDateRange('thisYear');
      
      expect(yearStartResult.startDate).toEqual(new Date('2023-01-01T00:00:00Z'));
      expect(yearStartResult.endDate).toEqual(new Date('2023-12-31T23:59:59.999Z'));
      
      // Reset mock date to standard reference date
      MockDate.set(REFERENCE_DATES.STANDARD);
    });

    it('should throw an error for invalid date range (end before start)', () => {
      expect(() => {
        isDateInRange(
          new Date('2023-06-15T12:00:00Z'),
          EDGE_CASE_FIXTURES.INVALID_RANGE
        );
      }).toThrow();
    });
  });

  describe('Journey-Specific Date Ranges', () => {
    describe('Health Journey', () => {
      Object.entries(JOURNEY_DATE_RANGES.HEALTH).forEach(([rangeKey, expectedRange]) => {
        it(`should return correct range for ${rangeKey}`, () => {
          const result = getDateRange('health', { journeyRangeType: rangeKey });
          
          expect(result.startDate).toEqual(expectedRange.startDate);
          expect(result.endDate).toEqual(expectedRange.endDate);
        });
      });

      it('should throw an error for invalid health journey range type', () => {
        expect(() => getDateRange('health', { journeyRangeType: 'INVALID' })).toThrow();
      });
    });

    describe('Care Journey', () => {
      Object.entries(JOURNEY_DATE_RANGES.CARE).forEach(([rangeKey, expectedRange]) => {
        it(`should return correct range for ${rangeKey}`, () => {
          const result = getDateRange('care', { journeyRangeType: rangeKey });
          
          expect(result.startDate).toEqual(expectedRange.startDate);
          expect(result.endDate).toEqual(expectedRange.endDate);
        });
      });

      it('should throw an error for invalid care journey range type', () => {
        expect(() => getDateRange('care', { journeyRangeType: 'INVALID' })).toThrow();
      });
    });

    describe('Plan Journey', () => {
      Object.entries(JOURNEY_DATE_RANGES.PLAN).forEach(([rangeKey, expectedRange]) => {
        it(`should return correct range for ${rangeKey}`, () => {
          const result = getDateRange('plan', { journeyRangeType: rangeKey });
          
          expect(result.startDate).toEqual(expectedRange.startDate);
          expect(result.endDate).toEqual(expectedRange.endDate);
        });
      });

      it('should throw an error for invalid plan journey range type', () => {
        expect(() => getDateRange('plan', { journeyRangeType: 'INVALID' })).toThrow();
      });
    });

    it('should throw an error for invalid journey type', () => {
      expect(() => getDateRange('invalidJourney')).toThrow();
    });
  });
});
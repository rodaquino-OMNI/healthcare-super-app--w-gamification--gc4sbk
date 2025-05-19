/**
 * Tests for date comparison utilities
 * 
 * This file contains tests for all date comparison functions, ensuring they correctly
 * compare dates across various formats, edge cases, and boundary conditions.
 */

import {
  isSameDay,
  isDateInRange,
  isDateBefore,
  isDateAfter,
  isDateEqual,
  isToday,
  isDateInDateRange,
  DateRange
} from '../../../src/date/comparison';

describe('Date Comparison Utilities', () => {
  describe('isSameDay', () => {
    describe('Same day comparisons', () => {
      test('identifies same day with Date objects', () => {
        const dateA = new Date(2023, 0, 15, 10, 30); // January 15, 2023, 10:30
        const dateB = new Date(2023, 0, 15, 14, 45); // January 15, 2023, 14:45
        expect(isSameDay(dateA, dateB)).toBe(true);
      });

      test('identifies same day with ISO strings', () => {
        expect(isSameDay('2023-01-15T10:30:00', '2023-01-15T14:45:00')).toBe(true);
      });

      test('identifies same day with timestamps', () => {
        const timestampA = new Date(2023, 0, 15, 10, 30).getTime();
        const timestampB = new Date(2023, 0, 15, 14, 45).getTime();
        expect(isSameDay(timestampA, timestampB)).toBe(true);
      });

      test('identifies same day with mixed types (Date and string)', () => {
        const dateA = new Date(2023, 0, 15, 10, 30); // January 15, 2023, 10:30
        expect(isSameDay(dateA, '2023-01-15T14:45:00')).toBe(true);
      });

      test('identifies same day with mixed types (string and timestamp)', () => {
        const timestampB = new Date(2023, 0, 15, 14, 45).getTime();
        expect(isSameDay('2023-01-15T10:30:00', timestampB)).toBe(true);
      });

      test('identifies same day at day boundaries', () => {
        const startOfDay = new Date(2023, 0, 15, 0, 0, 0, 0); // January 15, 2023, 00:00:00.000
        const endOfDay = new Date(2023, 0, 15, 23, 59, 59, 999); // January 15, 2023, 23:59:59.999
        expect(isSameDay(startOfDay, endOfDay)).toBe(true);
      });
    });

    describe('Different day comparisons', () => {
      test('identifies different days with Date objects', () => {
        const dateA = new Date(2023, 0, 15); // January 15, 2023
        const dateB = new Date(2023, 0, 16); // January 16, 2023
        expect(isSameDay(dateA, dateB)).toBe(false);
      });

      test('identifies different days with ISO strings', () => {
        expect(isSameDay('2023-01-15', '2023-01-16')).toBe(false);
      });

      test('identifies different days with timestamps', () => {
        const timestampA = new Date(2023, 0, 15).getTime();
        const timestampB = new Date(2023, 0, 16).getTime();
        expect(isSameDay(timestampA, timestampB)).toBe(false);
      });

      test('identifies different days with mixed types (Date and string)', () => {
        const dateA = new Date(2023, 0, 15); // January 15, 2023
        expect(isSameDay(dateA, '2023-01-16')).toBe(false);
      });

      test('identifies different days with mixed types (string and timestamp)', () => {
        const timestampB = new Date(2023, 0, 16).getTime();
        expect(isSameDay('2023-01-15', timestampB)).toBe(false);
      });

      test('identifies different days at adjacent day boundaries', () => {
        const endOfDay = new Date(2023, 0, 15, 23, 59, 59, 999); // January 15, 2023, 23:59:59.999
        const startOfNextDay = new Date(2023, 0, 16, 0, 0, 0, 0); // January 16, 2023, 00:00:00.000
        expect(isSameDay(endOfDay, startOfNextDay)).toBe(false);
      });
    });

    describe('Edge cases', () => {
      test('handles null values', () => {
        const validDate = new Date(2023, 0, 15);
        expect(isSameDay(null, validDate)).toBe(false);
        expect(isSameDay(validDate, null)).toBe(false);
        expect(isSameDay(null, null)).toBe(false);
      });

      test('handles undefined values', () => {
        const validDate = new Date(2023, 0, 15);
        expect(isSameDay(undefined, validDate)).toBe(false);
        expect(isSameDay(validDate, undefined)).toBe(false);
        expect(isSameDay(undefined, undefined)).toBe(false);
      });

      test('handles invalid date strings', () => {
        const validDate = new Date(2023, 0, 15);
        expect(isSameDay('not-a-date', validDate)).toBe(false);
        expect(isSameDay(validDate, 'not-a-date')).toBe(false);
        expect(isSameDay('not-a-date', 'also-not-a-date')).toBe(false);
      });

      test('handles empty strings', () => {
        const validDate = new Date(2023, 0, 15);
        expect(isSameDay('', validDate)).toBe(false);
        expect(isSameDay(validDate, '')).toBe(false);
        expect(isSameDay('', '')).toBe(false);
      });

      test('handles invalid timestamps (NaN)', () => {
        const validDate = new Date(2023, 0, 15);
        expect(isSameDay(NaN, validDate)).toBe(false);
        expect(isSameDay(validDate, NaN)).toBe(false);
        expect(isSameDay(NaN, NaN)).toBe(false);
      });
    });
  });

  describe('isDateInRange', () => {
    describe('Dates within range', () => {
      test('identifies date within range with Date objects', () => {
        const startDate = new Date(2023, 0, 1); // January 1, 2023
        const endDate = new Date(2023, 0, 31); // January 31, 2023
        const testDate = new Date(2023, 0, 15); // January 15, 2023
        expect(isDateInRange(testDate, startDate, endDate)).toBe(true);
      });

      test('identifies date within range with ISO strings', () => {
        expect(isDateInRange('2023-01-15', '2023-01-01', '2023-01-31')).toBe(true);
      });

      test('identifies date within range with timestamps', () => {
        const startTimestamp = new Date(2023, 0, 1).getTime();
        const endTimestamp = new Date(2023, 0, 31).getTime();
        const testTimestamp = new Date(2023, 0, 15).getTime();
        expect(isDateInRange(testTimestamp, startTimestamp, endTimestamp)).toBe(true);
      });

      test('identifies date within range with mixed types', () => {
        const startDate = new Date(2023, 0, 1); // January 1, 2023
        const endTimestamp = new Date(2023, 0, 31).getTime();
        expect(isDateInRange('2023-01-15', startDate, endTimestamp)).toBe(true);
      });

      test('identifies date equal to start date (inclusive range)', () => {
        const startDate = new Date(2023, 0, 1); // January 1, 2023
        const endDate = new Date(2023, 0, 31); // January 31, 2023
        expect(isDateInRange(startDate, startDate, endDate)).toBe(true);
      });

      test('identifies date equal to end date (inclusive range)', () => {
        const startDate = new Date(2023, 0, 1); // January 1, 2023
        const endDate = new Date(2023, 0, 31); // January 31, 2023
        expect(isDateInRange(endDate, startDate, endDate)).toBe(true);
      });
    });

    describe('Dates outside range', () => {
      test('rejects date before range with Date objects', () => {
        const startDate = new Date(2023, 0, 1); // January 1, 2023
        const endDate = new Date(2023, 0, 31); // January 31, 2023
        const testDate = new Date(2022, 11, 31); // December 31, 2022
        expect(isDateInRange(testDate, startDate, endDate)).toBe(false);
      });

      test('rejects date after range with Date objects', () => {
        const startDate = new Date(2023, 0, 1); // January 1, 2023
        const endDate = new Date(2023, 0, 31); // January 31, 2023
        const testDate = new Date(2023, 1, 1); // February 1, 2023
        expect(isDateInRange(testDate, startDate, endDate)).toBe(false);
      });

      test('rejects date before range with ISO strings', () => {
        expect(isDateInRange('2022-12-31', '2023-01-01', '2023-01-31')).toBe(false);
      });

      test('rejects date after range with ISO strings', () => {
        expect(isDateInRange('2023-02-01', '2023-01-01', '2023-01-31')).toBe(false);
      });

      test('rejects date before range with timestamps', () => {
        const startTimestamp = new Date(2023, 0, 1).getTime();
        const endTimestamp = new Date(2023, 0, 31).getTime();
        const testTimestamp = new Date(2022, 11, 31).getTime();
        expect(isDateInRange(testTimestamp, startTimestamp, endTimestamp)).toBe(false);
      });

      test('rejects date after range with timestamps', () => {
        const startTimestamp = new Date(2023, 0, 1).getTime();
        const endTimestamp = new Date(2023, 0, 31).getTime();
        const testTimestamp = new Date(2023, 1, 1).getTime();
        expect(isDateInRange(testTimestamp, startTimestamp, endTimestamp)).toBe(false);
      });
    });

    describe('Boundary conditions', () => {
      test('handles dates at day boundaries', () => {
        const startDate = new Date(2023, 0, 1, 0, 0, 0, 0); // January 1, 2023, 00:00:00.000
        const endDate = new Date(2023, 0, 31, 23, 59, 59, 999); // January 31, 2023, 23:59:59.999
        
        // Test start boundary
        const startBoundary = new Date(2023, 0, 1, 0, 0, 0, 0); // January 1, 2023, 00:00:00.000
        expect(isDateInRange(startBoundary, startDate, endDate)).toBe(true);
        
        // Test end boundary
        const endBoundary = new Date(2023, 0, 31, 23, 59, 59, 999); // January 31, 2023, 23:59:59.999
        expect(isDateInRange(endBoundary, startDate, endDate)).toBe(true);
        
        // Test just before start boundary
        const beforeStart = new Date(2022, 11, 31, 23, 59, 59, 999); // December 31, 2022, 23:59:59.999
        expect(isDateInRange(beforeStart, startDate, endDate)).toBe(false);
        
        // Test just after end boundary
        const afterEnd = new Date(2023, 1, 1, 0, 0, 0, 0); // February 1, 2023, 00:00:00.000
        expect(isDateInRange(afterEnd, startDate, endDate)).toBe(false);
      });

      test('handles millisecond precision at boundaries', () => {
        const startDate = new Date(2023, 0, 15, 12, 0, 0, 0); // January 15, 2023, 12:00:00.000
        const endDate = new Date(2023, 0, 15, 12, 0, 0, 10); // January 15, 2023, 12:00:00.010
        
        // Test exactly at start (inclusive)
        const exactlyAtStart = new Date(2023, 0, 15, 12, 0, 0, 0); // January 15, 2023, 12:00:00.000
        expect(isDateInRange(exactlyAtStart, startDate, endDate)).toBe(true);
        
        // Test exactly at end (inclusive)
        const exactlyAtEnd = new Date(2023, 0, 15, 12, 0, 0, 10); // January 15, 2023, 12:00:00.010
        expect(isDateInRange(exactlyAtEnd, startDate, endDate)).toBe(true);
        
        // Test 1ms before start
        const justBeforeStart = new Date(2023, 0, 15, 11, 59, 59, 999); // January 15, 2023, 11:59:59.999
        expect(isDateInRange(justBeforeStart, startDate, endDate)).toBe(false);
        
        // Test 1ms after end
        const justAfterEnd = new Date(2023, 0, 15, 12, 0, 0, 11); // January 15, 2023, 12:00:00.011
        expect(isDateInRange(justAfterEnd, startDate, endDate)).toBe(false);
      });
    });

    describe('Invalid ranges', () => {
      test('rejects when start date is after end date', () => {
        const startDate = new Date(2023, 0, 31); // January 31, 2023
        const endDate = new Date(2023, 0, 1); // January 1, 2023
        const testDate = new Date(2023, 0, 15); // January 15, 2023
        expect(isDateInRange(testDate, startDate, endDate)).toBe(false);
      });

      test('rejects when dates are equal but start is after end due to time', () => {
        const startDate = new Date(2023, 0, 15, 12, 0, 0); // January 15, 2023, 12:00:00
        const endDate = new Date(2023, 0, 15, 10, 0, 0); // January 15, 2023, 10:00:00
        const testDate = new Date(2023, 0, 15, 11, 0, 0); // January 15, 2023, 11:00:00
        expect(isDateInRange(testDate, startDate, endDate)).toBe(false);
      });
    });

    describe('Edge cases', () => {
      test('handles null values', () => {
        const validDate = new Date(2023, 0, 15);
        const startDate = new Date(2023, 0, 1);
        const endDate = new Date(2023, 0, 31);
        
        expect(isDateInRange(null, startDate, endDate)).toBe(false);
        expect(isDateInRange(validDate, null, endDate)).toBe(false);
        expect(isDateInRange(validDate, startDate, null)).toBe(false);
        expect(isDateInRange(null, null, null)).toBe(false);
      });

      test('handles undefined values', () => {
        const validDate = new Date(2023, 0, 15);
        const startDate = new Date(2023, 0, 1);
        const endDate = new Date(2023, 0, 31);
        
        expect(isDateInRange(undefined, startDate, endDate)).toBe(false);
        expect(isDateInRange(validDate, undefined, endDate)).toBe(false);
        expect(isDateInRange(validDate, startDate, undefined)).toBe(false);
        expect(isDateInRange(undefined, undefined, undefined)).toBe(false);
      });

      test('handles invalid date strings', () => {
        expect(isDateInRange('not-a-date', '2023-01-01', '2023-01-31')).toBe(false);
        expect(isDateInRange('2023-01-15', 'not-a-date', '2023-01-31')).toBe(false);
        expect(isDateInRange('2023-01-15', '2023-01-01', 'not-a-date')).toBe(false);
      });

      test('handles empty strings', () => {
        expect(isDateInRange('', '2023-01-01', '2023-01-31')).toBe(false);
        expect(isDateInRange('2023-01-15', '', '2023-01-31')).toBe(false);
        expect(isDateInRange('2023-01-15', '2023-01-01', '')).toBe(false);
      });

      test('handles invalid timestamps (NaN)', () => {
        const validDate = new Date(2023, 0, 15).getTime();
        const startDate = new Date(2023, 0, 1).getTime();
        const endDate = new Date(2023, 0, 31).getTime();
        
        expect(isDateInRange(NaN, startDate, endDate)).toBe(false);
        expect(isDateInRange(validDate, NaN, endDate)).toBe(false);
        expect(isDateInRange(validDate, startDate, NaN)).toBe(false);
      });
    });
  });

  describe('isDateBefore', () => {
    describe('Valid comparisons', () => {
      test('identifies date before another with Date objects', () => {
        const dateA = new Date(2023, 0, 1); // January 1, 2023
        const dateB = new Date(2023, 0, 15); // January 15, 2023
        expect(isDateBefore(dateA, dateB)).toBe(true);
      });

      test('identifies date before another with ISO strings', () => {
        expect(isDateBefore('2023-01-01', '2023-01-15')).toBe(true);
      });

      test('identifies date before another with timestamps', () => {
        const timestampA = new Date(2023, 0, 1).getTime();
        const timestampB = new Date(2023, 0, 15).getTime();
        expect(isDateBefore(timestampA, timestampB)).toBe(true);
      });

      test('identifies date before another with mixed types', () => {
        const dateA = new Date(2023, 0, 1); // January 1, 2023
        expect(isDateBefore(dateA, '2023-01-15')).toBe(true);
        expect(isDateBefore('2023-01-01', new Date(2023, 0, 15))).toBe(true);
      });

      test('identifies date not before another with Date objects', () => {
        const dateA = new Date(2023, 0, 15); // January 15, 2023
        const dateB = new Date(2023, 0, 1); // January 1, 2023
        expect(isDateBefore(dateA, dateB)).toBe(false);
      });

      test('identifies date not before another with ISO strings', () => {
        expect(isDateBefore('2023-01-15', '2023-01-01')).toBe(false);
      });

      test('identifies equal dates as not before', () => {
        const dateA = new Date(2023, 0, 15, 12, 0, 0); // January 15, 2023, 12:00:00
        const dateB = new Date(2023, 0, 15, 12, 0, 0); // January 15, 2023, 12:00:00
        expect(isDateBefore(dateA, dateB)).toBe(false);
      });
    });

    describe('Precision tests', () => {
      test('identifies millisecond precision before', () => {
        const dateA = new Date(2023, 0, 15, 12, 0, 0, 0); // January 15, 2023, 12:00:00.000
        const dateB = new Date(2023, 0, 15, 12, 0, 0, 1); // January 15, 2023, 12:00:00.001
        expect(isDateBefore(dateA, dateB)).toBe(true);
      });

      test('identifies second precision before', () => {
        const dateA = new Date(2023, 0, 15, 12, 0, 0); // January 15, 2023, 12:00:00
        const dateB = new Date(2023, 0, 15, 12, 0, 1); // January 15, 2023, 12:00:01
        expect(isDateBefore(dateA, dateB)).toBe(true);
      });

      test('identifies minute precision before', () => {
        const dateA = new Date(2023, 0, 15, 12, 0); // January 15, 2023, 12:00
        const dateB = new Date(2023, 0, 15, 12, 1); // January 15, 2023, 12:01
        expect(isDateBefore(dateA, dateB)).toBe(true);
      });
    });

    describe('Edge cases', () => {
      test('handles null values', () => {
        const validDate = new Date(2023, 0, 15);
        expect(isDateBefore(null, validDate)).toBe(false);
        expect(isDateBefore(validDate, null)).toBe(false);
        expect(isDateBefore(null, null)).toBe(false);
      });

      test('handles undefined values', () => {
        const validDate = new Date(2023, 0, 15);
        expect(isDateBefore(undefined, validDate)).toBe(false);
        expect(isDateBefore(validDate, undefined)).toBe(false);
        expect(isDateBefore(undefined, undefined)).toBe(false);
      });

      test('handles invalid date strings', () => {
        const validDate = new Date(2023, 0, 15);
        expect(isDateBefore('not-a-date', validDate)).toBe(false);
        expect(isDateBefore(validDate, 'not-a-date')).toBe(false);
        expect(isDateBefore('not-a-date', 'also-not-a-date')).toBe(false);
      });
    });
  });

  describe('isDateAfter', () => {
    describe('Valid comparisons', () => {
      test('identifies date after another with Date objects', () => {
        const dateA = new Date(2023, 0, 15); // January 15, 2023
        const dateB = new Date(2023, 0, 1); // January 1, 2023
        expect(isDateAfter(dateA, dateB)).toBe(true);
      });

      test('identifies date after another with ISO strings', () => {
        expect(isDateAfter('2023-01-15', '2023-01-01')).toBe(true);
      });

      test('identifies date after another with timestamps', () => {
        const timestampA = new Date(2023, 0, 15).getTime();
        const timestampB = new Date(2023, 0, 1).getTime();
        expect(isDateAfter(timestampA, timestampB)).toBe(true);
      });

      test('identifies date after another with mixed types', () => {
        const dateA = new Date(2023, 0, 15); // January 15, 2023
        expect(isDateAfter(dateA, '2023-01-01')).toBe(true);
        expect(isDateAfter('2023-01-15', new Date(2023, 0, 1))).toBe(true);
      });

      test('identifies date not after another with Date objects', () => {
        const dateA = new Date(2023, 0, 1); // January 1, 2023
        const dateB = new Date(2023, 0, 15); // January 15, 2023
        expect(isDateAfter(dateA, dateB)).toBe(false);
      });

      test('identifies date not after another with ISO strings', () => {
        expect(isDateAfter('2023-01-01', '2023-01-15')).toBe(false);
      });

      test('identifies equal dates as not after', () => {
        const dateA = new Date(2023, 0, 15, 12, 0, 0); // January 15, 2023, 12:00:00
        const dateB = new Date(2023, 0, 15, 12, 0, 0); // January 15, 2023, 12:00:00
        expect(isDateAfter(dateA, dateB)).toBe(false);
      });
    });

    describe('Precision tests', () => {
      test('identifies millisecond precision after', () => {
        const dateA = new Date(2023, 0, 15, 12, 0, 0, 1); // January 15, 2023, 12:00:00.001
        const dateB = new Date(2023, 0, 15, 12, 0, 0, 0); // January 15, 2023, 12:00:00.000
        expect(isDateAfter(dateA, dateB)).toBe(true);
      });

      test('identifies second precision after', () => {
        const dateA = new Date(2023, 0, 15, 12, 0, 1); // January 15, 2023, 12:00:01
        const dateB = new Date(2023, 0, 15, 12, 0, 0); // January 15, 2023, 12:00:00
        expect(isDateAfter(dateA, dateB)).toBe(true);
      });

      test('identifies minute precision after', () => {
        const dateA = new Date(2023, 0, 15, 12, 1); // January 15, 2023, 12:01
        const dateB = new Date(2023, 0, 15, 12, 0); // January 15, 2023, 12:00
        expect(isDateAfter(dateA, dateB)).toBe(true);
      });
    });

    describe('Edge cases', () => {
      test('handles null values', () => {
        const validDate = new Date(2023, 0, 15);
        expect(isDateAfter(null, validDate)).toBe(false);
        expect(isDateAfter(validDate, null)).toBe(false);
        expect(isDateAfter(null, null)).toBe(false);
      });

      test('handles undefined values', () => {
        const validDate = new Date(2023, 0, 15);
        expect(isDateAfter(undefined, validDate)).toBe(false);
        expect(isDateAfter(validDate, undefined)).toBe(false);
        expect(isDateAfter(undefined, undefined)).toBe(false);
      });

      test('handles invalid date strings', () => {
        const validDate = new Date(2023, 0, 15);
        expect(isDateAfter('not-a-date', validDate)).toBe(false);
        expect(isDateAfter(validDate, 'not-a-date')).toBe(false);
        expect(isDateAfter('not-a-date', 'also-not-a-date')).toBe(false);
      });
    });
  });

  describe('isDateEqual', () => {
    describe('Equal dates', () => {
      test('identifies equal dates with Date objects', () => {
        const dateA = new Date(2023, 0, 15, 12, 30, 45, 500); // January 15, 2023, 12:30:45.500
        const dateB = new Date(2023, 0, 15, 12, 30, 45, 500); // January 15, 2023, 12:30:45.500
        expect(isDateEqual(dateA, dateB)).toBe(true);
      });

      test('identifies equal dates with ISO strings', () => {
        expect(isDateEqual('2023-01-15T12:30:45.500Z', '2023-01-15T12:30:45.500Z')).toBe(true);
      });

      test('identifies equal dates with timestamps', () => {
        const timestamp = new Date(2023, 0, 15, 12, 30, 45, 500).getTime();
        expect(isDateEqual(timestamp, timestamp)).toBe(true);
      });

      test('identifies equal dates with mixed types', () => {
        const dateA = new Date(2023, 0, 15, 12, 30, 45, 500); // January 15, 2023, 12:30:45.500
        const timestamp = dateA.getTime();
        const isoString = dateA.toISOString();
        
        expect(isDateEqual(dateA, timestamp)).toBe(true);
        expect(isDateEqual(dateA, isoString)).toBe(true);
        expect(isDateEqual(timestamp, isoString)).toBe(true);
      });
    });

    describe('Non-equal dates', () => {
      test('identifies different dates with Date objects', () => {
        const dateA = new Date(2023, 0, 15, 12, 30, 45, 500); // January 15, 2023, 12:30:45.500
        const dateB = new Date(2023, 0, 15, 12, 30, 45, 501); // January 15, 2023, 12:30:45.501
        expect(isDateEqual(dateA, dateB)).toBe(false);
      });

      test('identifies different dates with ISO strings', () => {
        expect(isDateEqual('2023-01-15T12:30:45.500Z', '2023-01-15T12:30:45.501Z')).toBe(false);
      });

      test('identifies different dates with timestamps', () => {
        const timestampA = new Date(2023, 0, 15, 12, 30, 45, 500).getTime();
        const timestampB = new Date(2023, 0, 15, 12, 30, 45, 501).getTime();
        expect(isDateEqual(timestampA, timestampB)).toBe(false);
      });

      test('identifies same day but different time as not equal', () => {
        const dateA = new Date(2023, 0, 15, 12, 0); // January 15, 2023, 12:00
        const dateB = new Date(2023, 0, 15, 14, 0); // January 15, 2023, 14:00
        expect(isDateEqual(dateA, dateB)).toBe(false);
      });
    });

    describe('Precision tests', () => {
      test('identifies millisecond precision differences', () => {
        const dateA = new Date(2023, 0, 15, 12, 0, 0, 0); // January 15, 2023, 12:00:00.000
        const dateB = new Date(2023, 0, 15, 12, 0, 0, 1); // January 15, 2023, 12:00:00.001
        expect(isDateEqual(dateA, dateB)).toBe(false);
      });

      test('identifies second precision differences', () => {
        const dateA = new Date(2023, 0, 15, 12, 0, 0); // January 15, 2023, 12:00:00
        const dateB = new Date(2023, 0, 15, 12, 0, 1); // January 15, 2023, 12:00:01
        expect(isDateEqual(dateA, dateB)).toBe(false);
      });

      test('identifies minute precision differences', () => {
        const dateA = new Date(2023, 0, 15, 12, 0); // January 15, 2023, 12:00
        const dateB = new Date(2023, 0, 15, 12, 1); // January 15, 2023, 12:01
        expect(isDateEqual(dateA, dateB)).toBe(false);
      });
    });

    describe('Edge cases', () => {
      test('handles null values', () => {
        const validDate = new Date(2023, 0, 15);
        expect(isDateEqual(null, validDate)).toBe(false);
        expect(isDateEqual(validDate, null)).toBe(false);
        expect(isDateEqual(null, null)).toBe(false);
      });

      test('handles undefined values', () => {
        const validDate = new Date(2023, 0, 15);
        expect(isDateEqual(undefined, validDate)).toBe(false);
        expect(isDateEqual(validDate, undefined)).toBe(false);
        expect(isDateEqual(undefined, undefined)).toBe(false);
      });

      test('handles invalid date strings', () => {
        const validDate = new Date(2023, 0, 15);
        expect(isDateEqual('not-a-date', validDate)).toBe(false);
        expect(isDateEqual(validDate, 'not-a-date')).toBe(false);
        expect(isDateEqual('not-a-date', 'also-not-a-date')).toBe(false);
      });
    });
  });

  describe('isToday', () => {
    // Mock current date for consistent testing
    const originalNow = Date.now;
    const mockToday = new Date(2023, 0, 15); // January 15, 2023
    
    beforeAll(() => {
      // Mock Date.now
      Date.now = jest.fn(() => mockToday.getTime());
    });
    
    afterAll(() => {
      // Restore original Date.now
      Date.now = originalNow;
    });

    describe('Today dates', () => {
      test('identifies today with Date object', () => {
        const today = new Date(2023, 0, 15, 12, 30); // January 15, 2023, 12:30
        expect(isToday(today)).toBe(true);
      });

      test('identifies today with ISO string', () => {
        expect(isToday('2023-01-15T12:30:00')).toBe(true);
      });

      test('identifies today with timestamp', () => {
        const todayTimestamp = new Date(2023, 0, 15, 12, 30).getTime();
        expect(isToday(todayTimestamp)).toBe(true);
      });

      test('identifies start of today', () => {
        const startOfToday = new Date(2023, 0, 15, 0, 0, 0, 0); // January 15, 2023, 00:00:00.000
        expect(isToday(startOfToday)).toBe(true);
      });

      test('identifies end of today', () => {
        const endOfToday = new Date(2023, 0, 15, 23, 59, 59, 999); // January 15, 2023, 23:59:59.999
        expect(isToday(endOfToday)).toBe(true);
      });
    });

    describe('Non-today dates', () => {
      test('rejects yesterday with Date object', () => {
        const yesterday = new Date(2023, 0, 14, 12, 30); // January 14, 2023, 12:30
        expect(isToday(yesterday)).toBe(false);
      });

      test('rejects tomorrow with Date object', () => {
        const tomorrow = new Date(2023, 0, 16, 12, 30); // January 16, 2023, 12:30
        expect(isToday(tomorrow)).toBe(false);
      });

      test('rejects yesterday with ISO string', () => {
        expect(isToday('2023-01-14T12:30:00')).toBe(false);
      });

      test('rejects tomorrow with ISO string', () => {
        expect(isToday('2023-01-16T12:30:00')).toBe(false);
      });
    });

    describe('Edge cases', () => {
      test('handles null value', () => {
        expect(isToday(null)).toBe(false);
      });

      test('handles undefined value', () => {
        expect(isToday(undefined)).toBe(false);
      });

      test('handles invalid date string', () => {
        expect(isToday('not-a-date')).toBe(false);
      });

      test('handles empty string', () => {
        expect(isToday('')).toBe(false);
      });
    });
  });

  describe('isDateInDateRange', () => {
    describe('Dates within range object', () => {
      test('identifies date within range with Date objects', () => {
        const range: DateRange = {
          startDate: new Date(2023, 0, 1), // January 1, 2023
          endDate: new Date(2023, 0, 31), // January 31, 2023
        };
        const testDate = new Date(2023, 0, 15); // January 15, 2023
        expect(isDateInDateRange(testDate, range)).toBe(true);
      });

      test('identifies date within range with ISO strings', () => {
        const range: DateRange = {
          startDate: '2023-01-01',
          endDate: '2023-01-31',
        };
        expect(isDateInDateRange('2023-01-15', range)).toBe(true);
      });

      test('identifies date within range with timestamps', () => {
        const range: DateRange = {
          startDate: new Date(2023, 0, 1).getTime(),
          endDate: new Date(2023, 0, 31).getTime(),
        };
        const testTimestamp = new Date(2023, 0, 15).getTime();
        expect(isDateInDateRange(testTimestamp, range)).toBe(true);
      });

      test('identifies date within range with mixed types', () => {
        const range: DateRange = {
          startDate: new Date(2023, 0, 1), // January 1, 2023
          endDate: new Date(2023, 0, 31).getTime(), // January 31, 2023 as timestamp
        };
        expect(isDateInDateRange('2023-01-15', range)).toBe(true);
      });

      test('identifies date equal to start date (inclusive range)', () => {
        const range: DateRange = {
          startDate: new Date(2023, 0, 1), // January 1, 2023
          endDate: new Date(2023, 0, 31), // January 31, 2023
        };
        expect(isDateInDateRange(new Date(2023, 0, 1), range)).toBe(true);
      });

      test('identifies date equal to end date (inclusive range)', () => {
        const range: DateRange = {
          startDate: new Date(2023, 0, 1), // January 1, 2023
          endDate: new Date(2023, 0, 31), // January 31, 2023
        };
        expect(isDateInDateRange(new Date(2023, 0, 31), range)).toBe(true);
      });
    });

    describe('Dates outside range object', () => {
      test('rejects date before range with Date objects', () => {
        const range: DateRange = {
          startDate: new Date(2023, 0, 1), // January 1, 2023
          endDate: new Date(2023, 0, 31), // January 31, 2023
        };
        const testDate = new Date(2022, 11, 31); // December 31, 2022
        expect(isDateInDateRange(testDate, range)).toBe(false);
      });

      test('rejects date after range with Date objects', () => {
        const range: DateRange = {
          startDate: new Date(2023, 0, 1), // January 1, 2023
          endDate: new Date(2023, 0, 31), // January 31, 2023
        };
        const testDate = new Date(2023, 1, 1); // February 1, 2023
        expect(isDateInDateRange(testDate, range)).toBe(false);
      });

      test('rejects date before range with ISO strings', () => {
        const range: DateRange = {
          startDate: '2023-01-01',
          endDate: '2023-01-31',
        };
        expect(isDateInDateRange('2022-12-31', range)).toBe(false);
      });

      test('rejects date after range with ISO strings', () => {
        const range: DateRange = {
          startDate: '2023-01-01',
          endDate: '2023-01-31',
        };
        expect(isDateInDateRange('2023-02-01', range)).toBe(false);
      });
    });

    describe('Invalid ranges', () => {
      test('rejects when start date is after end date', () => {
        const range: DateRange = {
          startDate: new Date(2023, 0, 31), // January 31, 2023
          endDate: new Date(2023, 0, 1), // January 1, 2023
        };
        const testDate = new Date(2023, 0, 15); // January 15, 2023
        expect(isDateInDateRange(testDate, range)).toBe(false);
      });
    });

    describe('Edge cases', () => {
      test('handles null date', () => {
        const range: DateRange = {
          startDate: new Date(2023, 0, 1),
          endDate: new Date(2023, 0, 31),
        };
        expect(isDateInDateRange(null, range)).toBe(false);
      });

      test('handles undefined date', () => {
        const range: DateRange = {
          startDate: new Date(2023, 0, 1),
          endDate: new Date(2023, 0, 31),
        };
        expect(isDateInDateRange(undefined, range)).toBe(false);
      });

      test('handles null range', () => {
        const testDate = new Date(2023, 0, 15);
        expect(isDateInDateRange(testDate, null as any)).toBe(false);
      });

      test('handles undefined range', () => {
        const testDate = new Date(2023, 0, 15);
        expect(isDateInDateRange(testDate, undefined as any)).toBe(false);
      });

      test('handles range with null startDate', () => {
        const range: DateRange = {
          startDate: null as any,
          endDate: new Date(2023, 0, 31),
        };
        const testDate = new Date(2023, 0, 15);
        expect(isDateInDateRange(testDate, range)).toBe(false);
      });

      test('handles range with null endDate', () => {
        const range: DateRange = {
          startDate: new Date(2023, 0, 1),
          endDate: null as any,
        };
        const testDate = new Date(2023, 0, 15);
        expect(isDateInDateRange(testDate, range)).toBe(false);
      });

      test('handles invalid date string', () => {
        const range: DateRange = {
          startDate: new Date(2023, 0, 1),
          endDate: new Date(2023, 0, 31),
        };
        expect(isDateInDateRange('not-a-date', range)).toBe(false);
      });
    });
  });
});
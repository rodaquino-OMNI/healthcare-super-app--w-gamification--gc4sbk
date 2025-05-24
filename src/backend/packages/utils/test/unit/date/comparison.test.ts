import { isSameDay, isDateInRange } from '../../../src/date/comparison';
import { isValid } from 'date-fns';

describe('Date Comparison Utilities', () => {
  describe('isSameDay', () => {
    it('should return true when two Date objects represent the same day', () => {
      const dateA = new Date(2023, 5, 15, 9, 30, 0); // June 15, 2023 9:30 AM
      const dateB = new Date(2023, 5, 15, 18, 45, 0); // June 15, 2023 6:45 PM
      
      expect(isSameDay(dateA, dateB)).toBe(true);
    });

    it('should return false when two Date objects represent different days', () => {
      const dateA = new Date(2023, 5, 15, 23, 59, 59); // June 15, 2023 11:59:59 PM
      const dateB = new Date(2023, 5, 16, 0, 0, 1); // June 16, 2023 00:00:01 AM
      
      expect(isSameDay(dateA, dateB)).toBe(false);
    });

    it('should handle string date inputs correctly', () => {
      const dateA = '2023-06-15T09:30:00Z';
      const dateB = '2023-06-15T18:45:00Z';
      const dateC = '2023-06-16T09:30:00Z';
      
      expect(isSameDay(dateA, dateB)).toBe(true);
      expect(isSameDay(dateA, dateC)).toBe(false);
    });

    it('should handle timestamp (number) inputs correctly', () => {
      const dateA = new Date(2023, 5, 15, 9, 30, 0).getTime(); // June 15, 2023 timestamp
      const dateB = new Date(2023, 5, 15, 18, 45, 0).getTime(); // June 15, 2023 timestamp
      const dateC = new Date(2023, 5, 16, 9, 30, 0).getTime(); // June 16, 2023 timestamp
      
      expect(isSameDay(dateA, dateB)).toBe(true);
      expect(isSameDay(dateA, dateC)).toBe(false);
    });

    it('should handle mixed input types correctly', () => {
      const dateObj = new Date(2023, 5, 15, 9, 30, 0); // June 15, 2023 9:30 AM
      const dateStr = '2023-06-15T18:45:00Z'; // June 15, 2023 6:45 PM UTC
      const dateTimestamp = new Date(2023, 5, 15, 12, 0, 0).getTime(); // June 15, 2023 12:00 PM
      
      expect(isSameDay(dateObj, dateStr)).toBe(true);
      expect(isSameDay(dateObj, dateTimestamp)).toBe(true);
      expect(isSameDay(dateStr, dateTimestamp)).toBe(true);
    });

    it('should return false for invalid date inputs', () => {
      const validDate = new Date(2023, 5, 15);
      const invalidDate = new Date('Invalid Date');
      const invalidString = 'not-a-date';
      
      expect(isSameDay(validDate, invalidDate)).toBe(false);
      expect(isSameDay(validDate, invalidString)).toBe(false);
      expect(isSameDay(invalidDate, invalidString)).toBe(false);
      expect(isSameDay(invalidDate, invalidDate)).toBe(false);
    });

    it('should handle date objects from different timezones correctly', () => {
      // These represent the same day in different timezones
      const dateUTC = new Date('2023-06-15T23:30:00Z'); // June 15, 2023 11:30 PM UTC
      const dateBRT = new Date('2023-06-15T20:30:00-03:00'); // June 15, 2023 8:30 PM BRT (UTC-3)
      
      expect(isSameDay(dateUTC, dateBRT)).toBe(true);
    });

    it('should handle edge cases around day boundaries', () => {
      const endOfDay = new Date(2023, 5, 15, 23, 59, 59, 999); // June 15, 2023 11:59:59.999 PM
      const startOfNextDay = new Date(2023, 5, 16, 0, 0, 0, 0); // June 16, 2023 12:00:00.000 AM
      
      expect(isSameDay(endOfDay, startOfNextDay)).toBe(false);
      
      // Just 1 millisecond difference, but different days
      const almostMidnight = new Date(2023, 5, 15, 23, 59, 59, 999); // June 15, 2023 11:59:59.999 PM
      const midnight = new Date(2023, 5, 16, 0, 0, 0, 0); // June 16, 2023 12:00:00.000 AM
      
      expect(isSameDay(almostMidnight, midnight)).toBe(false);
    });
  });

  describe('isDateInRange', () => {
    it('should return true when date is within the range (inclusive)', () => {
      const startDate = new Date(2023, 5, 15); // June 15, 2023
      const endDate = new Date(2023, 5, 20); // June 20, 2023
      const testDate = new Date(2023, 5, 17); // June 17, 2023
      
      expect(isDateInRange(testDate, startDate, endDate)).toBe(true);
    });

    it('should return true when date is exactly at the start of the range', () => {
      const startDate = new Date(2023, 5, 15); // June 15, 2023
      const endDate = new Date(2023, 5, 20); // June 20, 2023
      const testDate = new Date(2023, 5, 15); // June 15, 2023
      
      expect(isDateInRange(testDate, startDate, endDate)).toBe(true);
    });

    it('should return true when date is exactly at the end of the range', () => {
      const startDate = new Date(2023, 5, 15); // June 15, 2023
      const endDate = new Date(2023, 5, 20); // June 20, 2023
      const testDate = new Date(2023, 5, 20); // June 20, 2023
      
      expect(isDateInRange(testDate, startDate, endDate)).toBe(true);
    });

    it('should return false when date is before the range', () => {
      const startDate = new Date(2023, 5, 15); // June 15, 2023
      const endDate = new Date(2023, 5, 20); // June 20, 2023
      const testDate = new Date(2023, 5, 14); // June 14, 2023
      
      expect(isDateInRange(testDate, startDate, endDate)).toBe(false);
    });

    it('should return false when date is after the range', () => {
      const startDate = new Date(2023, 5, 15); // June 15, 2023
      const endDate = new Date(2023, 5, 20); // June 20, 2023
      const testDate = new Date(2023, 5, 21); // June 21, 2023
      
      expect(isDateInRange(testDate, startDate, endDate)).toBe(false);
    });

    it('should handle string date inputs correctly', () => {
      const startDate = '2023-06-15T00:00:00Z'; // June 15, 2023
      const endDate = '2023-06-20T23:59:59Z'; // June 20, 2023
      const testDateInRange = '2023-06-17T12:00:00Z'; // June 17, 2023
      const testDateOutOfRange = '2023-06-21T12:00:00Z'; // June 21, 2023
      
      expect(isDateInRange(testDateInRange, startDate, endDate)).toBe(true);
      expect(isDateInRange(testDateOutOfRange, startDate, endDate)).toBe(false);
    });

    it('should handle timestamp (number) inputs correctly', () => {
      const startDate = new Date(2023, 5, 15).getTime(); // June 15, 2023 timestamp
      const endDate = new Date(2023, 5, 20).getTime(); // June 20, 2023 timestamp
      const testDateInRange = new Date(2023, 5, 17).getTime(); // June 17, 2023 timestamp
      const testDateOutOfRange = new Date(2023, 5, 21).getTime(); // June 21, 2023 timestamp
      
      expect(isDateInRange(testDateInRange, startDate, endDate)).toBe(true);
      expect(isDateInRange(testDateOutOfRange, startDate, endDate)).toBe(false);
    });

    it('should handle mixed input types correctly', () => {
      const startDate = new Date(2023, 5, 15); // June 15, 2023
      const endDate = '2023-06-20T23:59:59Z'; // June 20, 2023
      const testDateInRange = new Date(2023, 5, 17).getTime(); // June 17, 2023 timestamp
      
      expect(isDateInRange(testDateInRange, startDate, endDate)).toBe(true);
    });

    it('should return false for invalid date inputs', () => {
      const startDate = new Date(2023, 5, 15);
      const endDate = new Date(2023, 5, 20);
      const invalidDate = new Date('Invalid Date');
      const invalidString = 'not-a-date';
      
      expect(isDateInRange(invalidDate, startDate, endDate)).toBe(false);
      expect(isDateInRange(invalidString, startDate, endDate)).toBe(false);
      expect(isDateInRange(startDate, invalidDate, endDate)).toBe(false);
      expect(isDateInRange(startDate, startDate, invalidDate)).toBe(false);
    });

    it('should handle date objects from different timezones correctly', () => {
      const startDate = new Date('2023-06-15T00:00:00Z'); // June 15, 2023 UTC
      const endDate = new Date('2023-06-20T23:59:59Z'); // June 20, 2023 UTC
      const testDateBRT = new Date('2023-06-17T12:00:00-03:00'); // June 17, 2023 BRT (UTC-3)
      
      expect(isDateInRange(testDateBRT, startDate, endDate)).toBe(true);
    });

    it('should handle edge cases around day boundaries', () => {
      const startDate = new Date(2023, 5, 15, 0, 0, 0, 0); // June 15, 2023 12:00:00.000 AM
      const endDate = new Date(2023, 5, 20, 23, 59, 59, 999); // June 20, 2023 11:59:59.999 PM
      
      const justBeforeStart = new Date(2023, 5, 14, 23, 59, 59, 999); // June 14, 2023 11:59:59.999 PM
      const exactlyAtStart = new Date(2023, 5, 15, 0, 0, 0, 0); // June 15, 2023 12:00:00.000 AM
      const exactlyAtEnd = new Date(2023, 5, 20, 23, 59, 59, 999); // June 20, 2023 11:59:59.999 PM
      const justAfterEnd = new Date(2023, 5, 21, 0, 0, 0, 0); // June 21, 2023 12:00:00.000 AM
      
      expect(isDateInRange(justBeforeStart, startDate, endDate)).toBe(false);
      expect(isDateInRange(exactlyAtStart, startDate, endDate)).toBe(true);
      expect(isDateInRange(exactlyAtEnd, startDate, endDate)).toBe(true);
      expect(isDateInRange(justAfterEnd, startDate, endDate)).toBe(false);
    });

    // Tests for the new inclusivity/exclusivity options
    it('should respect inclusivity options for start date', () => {
      const startDate = new Date(2023, 5, 15); // June 15, 2023
      const endDate = new Date(2023, 5, 20); // June 20, 2023
      const exactlyAtStart = new Date(2023, 5, 15); // June 15, 2023
      
      // Default behavior (inclusive)
      expect(isDateInRange(exactlyAtStart, startDate, endDate)).toBe(true);
      
      // Exclusive start date
      expect(isDateInRange(exactlyAtStart, startDate, endDate, { includeStart: false })).toBe(false);
    });

    it('should respect inclusivity options for end date', () => {
      const startDate = new Date(2023, 5, 15); // June 15, 2023
      const endDate = new Date(2023, 5, 20); // June 20, 2023
      const exactlyAtEnd = new Date(2023, 5, 20); // June 20, 2023
      
      // Default behavior (inclusive)
      expect(isDateInRange(exactlyAtEnd, startDate, endDate)).toBe(true);
      
      // Exclusive end date
      expect(isDateInRange(exactlyAtEnd, startDate, endDate, { includeEnd: false })).toBe(false);
    });

    it('should handle both inclusivity options together', () => {
      const startDate = new Date(2023, 5, 15); // June 15, 2023
      const endDate = new Date(2023, 5, 20); // June 20, 2023
      const exactlyAtStart = new Date(2023, 5, 15); // June 15, 2023
      const exactlyAtEnd = new Date(2023, 5, 20); // June 20, 2023
      const inMiddle = new Date(2023, 5, 17); // June 17, 2023
      
      // Fully exclusive range
      const options = { includeStart: false, includeEnd: false };
      
      expect(isDateInRange(exactlyAtStart, startDate, endDate, options)).toBe(false);
      expect(isDateInRange(exactlyAtEnd, startDate, endDate, options)).toBe(false);
      expect(isDateInRange(inMiddle, startDate, endDate, options)).toBe(true);
    });

    it('should handle single-day ranges with inclusivity options', () => {
      const sameDay = new Date(2023, 5, 15); // June 15, 2023
      
      // Default behavior (inclusive)
      expect(isDateInRange(sameDay, sameDay, sameDay)).toBe(true);
      
      // Exclusive start
      expect(isDateInRange(sameDay, sameDay, sameDay, { includeStart: false })).toBe(false);
      
      // Exclusive end
      expect(isDateInRange(sameDay, sameDay, sameDay, { includeEnd: false })).toBe(false);
      
      // Both exclusive
      expect(isDateInRange(sameDay, sameDay, sameDay, { includeStart: false, includeEnd: false })).toBe(false);
    });
  });
});
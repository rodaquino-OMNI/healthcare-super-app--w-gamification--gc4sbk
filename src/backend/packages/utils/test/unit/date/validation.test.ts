import { isValidDate } from '../../../src/date/validation';

describe('Date Validation', () => {
  describe('isValidDate', () => {
    describe('with null or undefined values', () => {
      test('should return false for null', () => {
        expect(isValidDate(null)).toBe(false);
      });

      test('should return false for undefined', () => {
        expect(isValidDate(undefined)).toBe(false);
      });
    });

    describe('with Date objects', () => {
      test('should return true for valid Date objects', () => {
        expect(isValidDate(new Date())).toBe(true);
        expect(isValidDate(new Date('2023-01-01'))).toBe(true);
        expect(isValidDate(new Date(2023, 0, 1))).toBe(true);
      });

      test('should return false for invalid Date objects', () => {
        // Invalid date (e.g., February 30th)
        expect(isValidDate(new Date('2023-02-30'))).toBe(false);
        // Invalid date string
        expect(isValidDate(new Date('not-a-date'))).toBe(false);
      });
    });

    describe('with string values', () => {
      test('should return true for valid ISO date strings', () => {
        expect(isValidDate('2023-01-01')).toBe(true);
        expect(isValidDate('2023-01-01T12:00:00Z')).toBe(true);
        expect(isValidDate('2023-01-01T12:00:00.000Z')).toBe(true);
      });

      test('should return true for valid date strings in different formats', () => {
        expect(isValidDate('01/01/2023')).toBe(true);
        expect(isValidDate('Jan 1, 2023')).toBe(true);
        expect(isValidDate('January 1, 2023')).toBe(true);
      });

      test('should return false for invalid date strings', () => {
        expect(isValidDate('')).toBe(false);
        expect(isValidDate('not-a-date')).toBe(false);
        expect(isValidDate('2023/13/01')).toBe(false); // Invalid month
        expect(isValidDate('2023/01/32')).toBe(false); // Invalid day
      });

      test('should handle leap year edge cases correctly', () => {
        // February 29 in leap year (valid)
        expect(isValidDate('2020-02-29')).toBe(true);
        // February 29 in non-leap year (invalid)
        expect(isValidDate('2023-02-29')).toBe(false);
      });
    });

    describe('with number values', () => {
      test('should return true for valid timestamps', () => {
        // January 1, 2023 timestamp
        expect(isValidDate(1672531200000)).toBe(true);
        // Current timestamp
        expect(isValidDate(Date.now())).toBe(true);
        // Unix epoch (January 1, 1970)
        expect(isValidDate(0)).toBe(true);
      });

      test('should return true for negative timestamps (dates before 1970)', () => {
        // December 31, 1969 (one day before Unix epoch)
        expect(isValidDate(-86400000)).toBe(true);
      });

      test('should return false for invalid number values', () => {
        // NaN is not a valid date
        expect(isValidDate(NaN)).toBe(false);
        // Infinity is not a valid date
        expect(isValidDate(Infinity)).toBe(false);
        expect(isValidDate(-Infinity)).toBe(false);
      });
    });

    describe('with other types', () => {
      test('should return false for arrays', () => {
        expect(isValidDate([])).toBe(false);
        expect(isValidDate([2023, 0, 1])).toBe(false);
      });

      test('should return false for objects', () => {
        expect(isValidDate({})).toBe(false);
        expect(isValidDate({ year: 2023, month: 0, day: 1 })).toBe(false);
      });

      test('should return false for functions', () => {
        expect(isValidDate(() => {})).toBe(false);
        expect(isValidDate(function() {})).toBe(false);
      });

      test('should return false for boolean values', () => {
        expect(isValidDate(true)).toBe(false);
        expect(isValidDate(false)).toBe(false);
      });
    });

    describe('edge cases', () => {
      test('should handle date boundaries correctly', () => {
        // Minimum date (varies by browser/environment)
        const minDate = new Date(-8640000000000000); // Approximately 100 million days before 1970
        expect(isValidDate(minDate)).toBe(true);

        // Maximum date (varies by browser/environment)
        const maxDate = new Date(8640000000000000); // Approximately 100 million days after 1970
        expect(isValidDate(maxDate)).toBe(true);
      });

      test('should handle timezone edge cases', () => {
        // Date with timezone offset
        expect(isValidDate('2023-01-01T00:00:00+01:00')).toBe(true);
        expect(isValidDate('2023-01-01T00:00:00-01:00')).toBe(true);
      });

      test('should handle daylight saving time transitions', () => {
        // Dates during DST transitions (implementation-dependent)
        expect(isValidDate('2023-03-26T02:30:00+01:00')).toBe(true); // Spring forward in Europe
        expect(isValidDate('2023-11-05T01:30:00-04:00')).toBe(true); // Fall back in US Eastern
      });
    });
  });
});
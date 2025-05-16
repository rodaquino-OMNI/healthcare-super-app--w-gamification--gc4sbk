/**
 * Tests for date parsing utilities
 * 
 * This file contains tests for all date parsing functions, ensuring they correctly
 * parse date strings according to specified formats and locales across various input types and edge cases.
 */

import {
  parseDate,
  safeParse,
  isValidDateString,
  DateParseError,
  DEFAULT_DATE_FORMAT,
  DEFAULT_TIME_FORMAT,
  DEFAULT_DATETIME_FORMAT,
  DEFAULT_LOCALE
} from '../../../src/date/parse';

describe('Date Parsing Utilities', () => {
  // Test fixtures
  const validDateStr = '15/01/2023'; // January 15, 2023 (pt-BR format)
  const validDateStrUS = '01/15/2023'; // January 15, 2023 (en-US format)
  const validDateStrISO = '2023-01-15'; // January 15, 2023 (ISO format)
  const validTimeStr = '14:30'; // 2:30 PM
  const validDateTimeStr = '15/01/2023 14:30'; // January 15, 2023, 2:30 PM
  const invalidDateStr = 'not-a-date';
  const invalidFormatDateStr = '2023/01/15'; // Valid date but wrong format for DEFAULT_DATE_FORMAT

  describe('parseDate', () => {
    describe('Valid dates with default format and locale', () => {
      test('parses date string in default format (dd/MM/yyyy)', () => {
        const result = parseDate(validDateStr);
        expect(result).toBeInstanceOf(Date);
        expect(result.getFullYear()).toBe(2023);
        expect(result.getMonth()).toBe(0); // January is 0
        expect(result.getDate()).toBe(15);
      });
    });

    describe('Valid dates with custom formats', () => {
      test('parses date with yyyy-MM-dd format', () => {
        const result = parseDate(validDateStrISO, 'yyyy-MM-dd');
        expect(result).toBeInstanceOf(Date);
        expect(result.getFullYear()).toBe(2023);
        expect(result.getMonth()).toBe(0);
        expect(result.getDate()).toBe(15);
      });

      test('parses date with MM/dd/yyyy format', () => {
        const result = parseDate(validDateStrUS, 'MM/dd/yyyy');
        expect(result).toBeInstanceOf(Date);
        expect(result.getFullYear()).toBe(2023);
        expect(result.getMonth()).toBe(0);
        expect(result.getDate()).toBe(15);
      });

      test('parses datetime with dd/MM/yyyy HH:mm format', () => {
        const result = parseDate(validDateTimeStr, 'dd/MM/yyyy HH:mm');
        expect(result).toBeInstanceOf(Date);
        expect(result.getFullYear()).toBe(2023);
        expect(result.getMonth()).toBe(0);
        expect(result.getDate()).toBe(15);
        expect(result.getHours()).toBe(14);
        expect(result.getMinutes()).toBe(30);
      });

      test('parses time with HH:mm format', () => {
        // When parsing only time, the date will be set to the current date
        const today = new Date();
        const result = parseDate(validTimeStr, 'HH:mm');
        expect(result).toBeInstanceOf(Date);
        expect(result.getFullYear()).toBe(today.getFullYear());
        expect(result.getMonth()).toBe(today.getMonth());
        expect(result.getDate()).toBe(today.getDate());
        expect(result.getHours()).toBe(14);
        expect(result.getMinutes()).toBe(30);
      });
    });

    describe('Locale-specific parsing', () => {
      test('parses date in Portuguese (pt-BR)', () => {
        const result = parseDate(validDateStr, DEFAULT_DATE_FORMAT, 'pt-BR');
        expect(result).toBeInstanceOf(Date);
        expect(result.getFullYear()).toBe(2023);
        expect(result.getMonth()).toBe(0);
        expect(result.getDate()).toBe(15);
      });

      test('parses date in English (en-US)', () => {
        const result = parseDate(validDateStrUS, 'MM/dd/yyyy', 'en-US');
        expect(result).toBeInstanceOf(Date);
        expect(result.getFullYear()).toBe(2023);
        expect(result.getMonth()).toBe(0);
        expect(result.getDate()).toBe(15);
      });

      test('parses date with month name in Portuguese', () => {
        const dateWithMonthName = '15 de janeiro de 2023';
        const result = parseDate(dateWithMonthName, "dd 'de' MMMM 'de' yyyy", 'pt-BR');
        expect(result).toBeInstanceOf(Date);
        expect(result.getFullYear()).toBe(2023);
        expect(result.getMonth()).toBe(0);
        expect(result.getDate()).toBe(15);
      });

      test('parses date with month name in English', () => {
        const dateWithMonthName = 'January 15, 2023';
        const result = parseDate(dateWithMonthName, 'MMMM d, yyyy', 'en-US');
        expect(result).toBeInstanceOf(Date);
        expect(result.getFullYear()).toBe(2023);
        expect(result.getMonth()).toBe(0);
        expect(result.getDate()).toBe(15);
      });
    });

    describe('Error handling', () => {
      test('throws DateParseError for empty date string', () => {
        expect(() => parseDate('')).toThrow(DateParseError);
        expect(() => parseDate('')).toThrow('Date string cannot be empty');
      });

      test('throws DateParseError for null date string', () => {
        expect(() => parseDate(null as any)).toThrow(DateParseError);
      });

      test('throws DateParseError for undefined date string', () => {
        expect(() => parseDate(undefined as any)).toThrow(DateParseError);
      });

      test('throws DateParseError for invalid date string', () => {
        expect(() => parseDate(invalidDateStr)).toThrow(DateParseError);
        expect(() => parseDate(invalidDateStr)).toThrow(/Invalid date string/);
      });

      test('throws DateParseError for date string in wrong format', () => {
        expect(() => parseDate(invalidFormatDateStr)).toThrow(DateParseError);
        expect(() => parseDate(invalidFormatDateStr)).toThrow(/does not match format/);
      });

      test('throws DateParseError for invalid format string', () => {
        expect(() => parseDate(validDateStr, 'invalid-format')).toThrow(DateParseError);
      });

      test('handles invalid locale by falling back to default', () => {
        // This should not throw but use the default locale
        const result = parseDate(validDateStr, DEFAULT_DATE_FORMAT, 'invalid-locale' as any);
        expect(result).toBeInstanceOf(Date);
        expect(result.getFullYear()).toBe(2023);
        expect(result.getMonth()).toBe(0);
        expect(result.getDate()).toBe(15);
      });
    });
  });

  describe('safeParse', () => {
    describe('Valid dates', () => {
      test('parses valid date string and returns Date object', () => {
        const result = safeParse(validDateStr);
        expect(result).toBeInstanceOf(Date);
        expect(result?.getFullYear()).toBe(2023);
        expect(result?.getMonth()).toBe(0);
        expect(result?.getDate()).toBe(15);
      });

      test('parses valid date string with custom format', () => {
        const result = safeParse(validDateStrISO, 'yyyy-MM-dd');
        expect(result).toBeInstanceOf(Date);
        expect(result?.getFullYear()).toBe(2023);
        expect(result?.getMonth()).toBe(0);
        expect(result?.getDate()).toBe(15);
      });

      test('parses valid date string with custom locale', () => {
        const result = safeParse(validDateStrUS, 'MM/dd/yyyy', 'en-US');
        expect(result).toBeInstanceOf(Date);
        expect(result?.getFullYear()).toBe(2023);
        expect(result?.getMonth()).toBe(0);
        expect(result?.getDate()).toBe(15);
      });
    });

    describe('Invalid dates', () => {
      test('returns null for empty date string', () => {
        const result = safeParse('');
        expect(result).toBeNull();
      });

      test('returns null for null date string', () => {
        const result = safeParse(null as any);
        expect(result).toBeNull();
      });

      test('returns null for undefined date string', () => {
        const result = safeParse(undefined as any);
        expect(result).toBeNull();
      });

      test('returns null for invalid date string', () => {
        const result = safeParse(invalidDateStr);
        expect(result).toBeNull();
      });

      test('returns null for date string in wrong format', () => {
        const result = safeParse(invalidFormatDateStr);
        expect(result).toBeNull();
      });

      test('returns null for invalid format string', () => {
        const result = safeParse(validDateStr, 'invalid-format');
        expect(result).toBeNull();
      });
    });
  });

  describe('isValidDateString', () => {
    describe('Valid date strings', () => {
      test('returns true for valid date string in default format', () => {
        expect(isValidDateString(validDateStr)).toBe(true);
      });

      test('returns true for valid date string with custom format', () => {
        expect(isValidDateString(validDateStrISO, 'yyyy-MM-dd')).toBe(true);
      });

      test('returns true for valid date string with custom locale', () => {
        expect(isValidDateString(validDateStrUS, 'MM/dd/yyyy', 'en-US')).toBe(true);
      });

      test('returns true for valid datetime string', () => {
        expect(isValidDateString(validDateTimeStr, 'dd/MM/yyyy HH:mm')).toBe(true);
      });
    });

    describe('Invalid date strings', () => {
      test('returns false for empty date string', () => {
        expect(isValidDateString('')).toBe(false);
      });

      test('returns false for null date string', () => {
        expect(isValidDateString(null as any)).toBe(false);
      });

      test('returns false for undefined date string', () => {
        expect(isValidDateString(undefined as any)).toBe(false);
      });

      test('returns false for invalid date string', () => {
        expect(isValidDateString(invalidDateStr)).toBe(false);
      });

      test('returns false for date string in wrong format', () => {
        expect(isValidDateString(invalidFormatDateStr)).toBe(false);
      });

      test('returns false for valid date with invalid format string', () => {
        expect(isValidDateString(validDateStr, 'invalid-format')).toBe(false);
      });
    });
  });

  describe('DateParseError', () => {
    test('creates error with correct name and message', () => {
      const errorMessage = 'Test error message';
      const error = new DateParseError(errorMessage);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('DateParseError');
      expect(error.message).toBe(errorMessage);
    });

    test('can be caught and identified by name', () => {
      try {
        throw new DateParseError('Test error');
      } catch (error) {
        expect(error).toBeInstanceOf(DateParseError);
        expect((error as Error).name).toBe('DateParseError');
      }
    });
  });

  describe('Edge cases', () => {
    test('handles leap year dates correctly', () => {
      // February 29, 2020 (leap year)
      const leapYearDate = '29/02/2020';
      const result = parseDate(leapYearDate);
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2020);
      expect(result.getMonth()).toBe(1); // February is 1
      expect(result.getDate()).toBe(29);
    });

    test('throws error for invalid leap year date', () => {
      // February 29, 2023 (not a leap year)
      const invalidLeapYearDate = '29/02/2023';
      expect(() => parseDate(invalidLeapYearDate)).toThrow(DateParseError);
    });

    test('handles date with single-digit day and month', () => {
      const singleDigitDate = '1/2/2023'; // February 1, 2023
      // This should fail with default format (dd/MM/yyyy) which expects leading zeros
      expect(() => parseDate(singleDigitDate)).toThrow(DateParseError);
      
      // But should work with a format that allows single digits
      const result = parseDate(singleDigitDate, 'd/M/yyyy');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(1); // February is 1
      expect(result.getDate()).toBe(1);
    });

    test('handles date at month boundaries', () => {
      // January 31, 2023
      const endOfJanuary = '31/01/2023';
      const result1 = parseDate(endOfJanuary);
      expect(result1).toBeInstanceOf(Date);
      expect(result1.getFullYear()).toBe(2023);
      expect(result1.getMonth()).toBe(0);
      expect(result1.getDate()).toBe(31);

      // April 30, 2023 (30 days in April)
      const endOfApril = '30/04/2023';
      const result2 = parseDate(endOfApril);
      expect(result2).toBeInstanceOf(Date);
      expect(result2.getFullYear()).toBe(2023);
      expect(result2.getMonth()).toBe(3); // April is 3
      expect(result2.getDate()).toBe(30);
    });

    test('throws error for invalid month boundary date', () => {
      // April 31, 2023 (April only has 30 days)
      const invalidAprilDate = '31/04/2023';
      expect(() => parseDate(invalidAprilDate)).toThrow(DateParseError);
    });
  });
});
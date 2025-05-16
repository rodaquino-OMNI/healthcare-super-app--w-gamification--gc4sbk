/**
 * Tests for date formatting utilities
 * 
 * This file contains tests for all date formatting functions, ensuring they correctly
 * format dates according to specified formats and locales across various input types and edge cases.
 */

import {
  formatDate,
  formatTime,
  formatDateTime,
  formatDateRange,
  formatRelativeDate,
  formatJourneyDate,
  DEFAULT_DATE_FORMAT,
  DEFAULT_TIME_FORMAT,
  DEFAULT_DATETIME_FORMAT,
  DEFAULT_LOCALE
} from '../../../src/date/format';

describe('Date Formatting Utilities', () => {
  // Test fixtures
  const validDateObj = new Date(2023, 0, 15, 14, 30, 45); // January 15, 2023, 14:30:45
  const validDateStr = '2023-01-15T14:30:45';
  const validDateTimestamp = validDateObj.getTime();
  const invalidDateStr = 'not-a-date';
  
  // Mock current date for relative date testing
  const currentDate = new Date(2023, 0, 20); // January 20, 2023
  const originalNow = Date.now;
  
  beforeAll(() => {
    // Mock Date.now for consistent testing of relative dates
    Date.now = jest.fn(() => currentDate.getTime());
  });
  
  afterAll(() => {
    // Restore original Date.now
    Date.now = originalNow;
  });

  describe('formatDate', () => {
    describe('Valid dates with default format', () => {
      test('formats Date object correctly', () => {
        expect(formatDate(validDateObj)).toBe('15/01/2023');
      });
      
      test('formats ISO date string correctly', () => {
        expect(formatDate(validDateStr)).toBe('15/01/2023');
      });
      
      test('formats timestamp correctly', () => {
        expect(formatDate(validDateTimestamp)).toBe('15/01/2023');
      });
    });
    
    describe('Valid dates with custom formats', () => {
      test('formats with yyyy-MM-dd format', () => {
        expect(formatDate(validDateObj, 'yyyy-MM-dd')).toBe('2023-01-15');
      });
      
      test('formats with dd MMM yyyy format', () => {
        expect(formatDate(validDateObj, 'dd MMM yyyy')).toBe('15 jan 2023');
      });
      
      test('formats with full month name', () => {
        expect(formatDate(validDateObj, 'dd \\de MMMM \\de yyyy')).toBe('15 de janeiro de 2023');
      });
      
      test('formats with day of week', () => {
        expect(formatDate(validDateObj, 'EEEE, dd/MM/yyyy')).toBe('domingo, 15/01/2023');
      });
    });
    
    describe('Locale-specific formatting', () => {
      test('formats date in Portuguese (pt-BR)', () => {
        expect(formatDate(validDateObj, 'EEEE, dd \\de MMMM \\de yyyy', 'pt-BR'))
          .toBe('domingo, 15 de janeiro de 2023');
      });
      
      test('formats date in English (en-US)', () => {
        expect(formatDate(validDateObj, 'EEEE, MMMM d, yyyy', 'en-US'))
          .toBe('Sunday, January 15, 2023');
      });
      
      test('formats date with US date format (MM/dd/yyyy)', () => {
        expect(formatDate(validDateObj, 'MM/dd/yyyy', 'en-US'))
          .toBe('01/15/2023');
      });
    });
    
    describe('Edge cases and error handling', () => {
      test('returns empty string for null input', () => {
        expect(formatDate(null as any)).toBe('');
      });
      
      test('returns empty string for undefined input', () => {
        expect(formatDate(undefined as any)).toBe('');
      });
      
      test('returns empty string for invalid date string', () => {
        expect(formatDate(invalidDateStr)).toBe('');
      });
      
      test('returns empty string for invalid Date object', () => {
        expect(formatDate(new Date('invalid'))).toBe('');
      });
      
      test('handles empty format string by using default', () => {
        expect(formatDate(validDateObj, '')).toBe('15/01/2023');
      });
      
      test('handles invalid locale by falling back to default', () => {
        expect(formatDate(validDateObj, DEFAULT_DATE_FORMAT, 'invalid-locale' as any))
          .toBe('15/01/2023');
      });
      
      test('handles invalid format pattern gracefully', () => {
        // This should not throw but return empty string due to try/catch
        expect(formatDate(validDateObj, 'invalid-format')).toBe('');
      });
    });
  });

  describe('formatTime', () => {
    describe('Valid times with default format', () => {
      test('formats Date object correctly', () => {
        expect(formatTime(validDateObj)).toBe('14:30');
      });
      
      test('formats ISO date string correctly', () => {
        expect(formatTime(validDateStr)).toBe('14:30');
      });
      
      test('formats timestamp correctly', () => {
        expect(formatTime(validDateTimestamp)).toBe('14:30');
      });
    });
    
    describe('Valid times with custom formats', () => {
      test('formats with HH:mm:ss format', () => {
        expect(formatTime(validDateObj, 'HH:mm:ss')).toBe('14:30:45');
      });
      
      test('formats with h:mm a format (12-hour)', () => {
        expect(formatTime(validDateObj, 'h:mm a')).toBe('2:30 PM');
      });
      
      test('formats with full time words', () => {
        expect(formatTime(validDateObj, "'às' HH'h'mm")).toBe('às 14h30');
      });
    });
    
    describe('Locale-specific formatting', () => {
      test('formats time in Portuguese (pt-BR)', () => {
        expect(formatTime(validDateObj, 'HH:mm:ss', 'pt-BR'))
          .toBe('14:30:45');
      });
      
      test('formats time in English (en-US)', () => {
        expect(formatTime(validDateObj, 'h:mm a', 'en-US'))
          .toBe('2:30 PM');
      });
    });
    
    describe('Edge cases and error handling', () => {
      test('returns empty string for null input', () => {
        expect(formatTime(null as any)).toBe('');
      });
      
      test('returns empty string for undefined input', () => {
        expect(formatTime(undefined as any)).toBe('');
      });
      
      test('returns empty string for invalid date string', () => {
        expect(formatTime(invalidDateStr)).toBe('');
      });
      
      test('returns empty string for invalid Date object', () => {
        expect(formatTime(new Date('invalid'))).toBe('');
      });
      
      test('handles empty format string by using default', () => {
        expect(formatTime(validDateObj, '')).toBe('14:30');
      });
      
      test('handles invalid locale by falling back to default', () => {
        expect(formatTime(validDateObj, DEFAULT_TIME_FORMAT, 'invalid-locale' as any))
          .toBe('14:30');
      });
      
      test('handles invalid format pattern gracefully', () => {
        // This should not throw but return empty string due to try/catch
        expect(formatTime(validDateObj, 'invalid-format')).toBe('');
      });
    });
  });

  describe('formatDateTime', () => {
    describe('Valid datetimes with default format', () => {
      test('formats Date object correctly', () => {
        expect(formatDateTime(validDateObj)).toBe('15/01/2023 14:30');
      });
      
      test('formats ISO date string correctly', () => {
        expect(formatDateTime(validDateStr)).toBe('15/01/2023 14:30');
      });
      
      test('formats timestamp correctly', () => {
        expect(formatDateTime(validDateTimestamp)).toBe('15/01/2023 14:30');
      });
    });
    
    describe('Valid datetimes with custom formats', () => {
      test('formats with yyyy-MM-dd HH:mm:ss format', () => {
        expect(formatDateTime(validDateObj, 'yyyy-MM-dd HH:mm:ss')).toBe('2023-01-15 14:30:45');
      });
      
      test('formats with full date and time words', () => {
        expect(formatDateTime(validDateObj, "dd/MM/yyyy 'às' HH'h'mm")).toBe('15/01/2023 às 14h30');
      });
      
      test('formats with day of week and 12-hour time', () => {
        expect(formatDateTime(validDateObj, 'EEEE, dd/MM/yyyy h:mm a')).toBe('domingo, 15/01/2023 2:30 PM');
      });
    });
    
    describe('Locale-specific formatting', () => {
      test('formats datetime in Portuguese (pt-BR)', () => {
        expect(formatDateTime(validDateObj, "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH'h'mm", 'pt-BR'))
          .toBe("domingo, 15 de janeiro de 2023 às 14h30");
      });
      
      test('formats datetime in English (en-US)', () => {
        expect(formatDateTime(validDateObj, 'EEEE, MMMM d, yyyy h:mm a', 'en-US'))
          .toBe('Sunday, January 15, 2023 2:30 PM');
      });
    });
    
    describe('Edge cases and error handling', () => {
      test('returns empty string for null input', () => {
        expect(formatDateTime(null as any)).toBe('');
      });
      
      test('returns empty string for undefined input', () => {
        expect(formatDateTime(undefined as any)).toBe('');
      });
      
      test('returns empty string for invalid date string', () => {
        expect(formatDateTime(invalidDateStr)).toBe('');
      });
      
      test('returns empty string for invalid Date object', () => {
        expect(formatDateTime(new Date('invalid'))).toBe('');
      });
      
      test('handles empty format string by using default', () => {
        expect(formatDateTime(validDateObj, '')).toBe('15/01/2023 14:30');
      });
      
      test('handles invalid locale by falling back to default', () => {
        expect(formatDateTime(validDateObj, DEFAULT_DATETIME_FORMAT, 'invalid-locale' as any))
          .toBe('15/01/2023 14:30');
      });
      
      test('handles invalid format pattern gracefully', () => {
        // This should not throw but return empty string due to try/catch
        expect(formatDateTime(validDateObj, 'invalid-format')).toBe('');
      });
    });
  });

  describe('formatDateRange', () => {
    const startDate = new Date(2023, 0, 1); // January 1, 2023
    const endDate = new Date(2023, 0, 31); // January 31, 2023
    
    describe('Valid date ranges with default format', () => {
      test('formats Date objects correctly', () => {
        expect(formatDateRange(startDate, endDate)).toBe('01/01/2023 - 31/01/2023');
      });
      
      test('formats ISO date strings correctly', () => {
        expect(formatDateRange('2023-01-01', '2023-01-31')).toBe('01/01/2023 - 31/01/2023');
      });
      
      test('formats timestamps correctly', () => {
        expect(formatDateRange(startDate.getTime(), endDate.getTime())).toBe('01/01/2023 - 31/01/2023');
      });
      
      test('formats mixed input types correctly', () => {
        expect(formatDateRange(startDate, '2023-01-31')).toBe('01/01/2023 - 31/01/2023');
        expect(formatDateRange('2023-01-01', endDate)).toBe('01/01/2023 - 31/01/2023');
      });
    });
    
    describe('Valid date ranges with custom formats', () => {
      test('formats with yyyy-MM-dd format', () => {
        expect(formatDateRange(startDate, endDate, 'yyyy-MM-dd')).toBe('2023-01-01 - 2023-01-31');
      });
      
      test('formats with dd MMM yyyy format', () => {
        expect(formatDateRange(startDate, endDate, 'dd MMM yyyy')).toBe('01 jan 2023 - 31 jan 2023');
      });
      
      test('formats with full month name', () => {
        expect(formatDateRange(startDate, endDate, 'dd \\de MMMM'))
          .toBe('01 de janeiro - 31 de janeiro');
      });
    });
    
    describe('Locale-specific formatting', () => {
      test('formats date range in Portuguese (pt-BR)', () => {
        expect(formatDateRange(startDate, endDate, 'dd \\de MMMM \\de yyyy', 'pt-BR'))
          .toBe('01 de janeiro de 2023 - 31 de janeiro de 2023');
      });
      
      test('formats date range in English (en-US)', () => {
        expect(formatDateRange(startDate, endDate, 'MMMM d, yyyy', 'en-US'))
          .toBe('January 1, 2023 - January 31, 2023');
      });
    });
    
    describe('Edge cases and error handling', () => {
      test('returns empty string when start date is null', () => {
        expect(formatDateRange(null as any, endDate)).toBe('');
      });
      
      test('returns empty string when end date is null', () => {
        expect(formatDateRange(startDate, null as any)).toBe('');
      });
      
      test('returns empty string when both dates are null', () => {
        expect(formatDateRange(null as any, null as any)).toBe('');
      });
      
      test('returns empty string when start date is invalid', () => {
        expect(formatDateRange(invalidDateStr, endDate)).toBe('');
      });
      
      test('returns empty string when end date is invalid', () => {
        expect(formatDateRange(startDate, invalidDateStr)).toBe('');
      });
      
      test('handles empty format string by using default', () => {
        expect(formatDateRange(startDate, endDate, '')).toBe('01/01/2023 - 31/01/2023');
      });
      
      test('handles invalid locale by falling back to default', () => {
        expect(formatDateRange(startDate, endDate, DEFAULT_DATE_FORMAT, 'invalid-locale' as any))
          .toBe('01/01/2023 - 31/01/2023');
      });
      
      test('handles invalid format pattern gracefully', () => {
        // This should not throw but return empty string due to try/catch
        expect(formatDateRange(startDate, endDate, 'invalid-format')).toBe('');
      });
      
      test('works correctly when start date equals end date', () => {
        const sameDate = new Date(2023, 0, 15); // January 15, 2023
        expect(formatDateRange(sameDate, sameDate)).toBe('15/01/2023 - 15/01/2023');
      });
      
      test('works correctly when end date is before start date', () => {
        // This should still format correctly even if the range is invalid
        expect(formatDateRange(endDate, startDate)).toBe('31/01/2023 - 01/01/2023');
      });
    });
  });

  describe('formatRelativeDate', () => {
    // Current date is mocked as January 20, 2023
    
    describe('Portuguese locale (default)', () => {
      test('formats today correctly', () => {
        const today = new Date(2023, 0, 20); // January 20, 2023 (same as mocked current date)
        expect(formatRelativeDate(today)).toBe('Hoje');
      });
      
      test('formats yesterday correctly', () => {
        const yesterday = new Date(2023, 0, 19); // January 19, 2023
        expect(formatRelativeDate(yesterday)).toBe('Ontem');
      });
      
      test('formats days ago correctly', () => {
        const daysAgo = new Date(2023, 0, 15); // January 15, 2023 (5 days ago)
        expect(formatRelativeDate(daysAgo)).toBe('5 dias atrás');
      });
      
      test('formats older dates with full date format', () => {
        const olderDate = new Date(2022, 11, 1); // December 1, 2022 (more than 30 days ago)
        expect(formatRelativeDate(olderDate)).toBe('01/12/2022');
      });
    });
    
    describe('English locale', () => {
      test('formats today correctly', () => {
        const today = new Date(2023, 0, 20); // January 20, 2023 (same as mocked current date)
        expect(formatRelativeDate(today, 'en-US')).toBe('Today');
      });
      
      test('formats yesterday correctly', () => {
        const yesterday = new Date(2023, 0, 19); // January 19, 2023
        expect(formatRelativeDate(yesterday, 'en-US')).toBe('Yesterday');
      });
      
      test('formats days ago correctly', () => {
        const daysAgo = new Date(2023, 0, 15); // January 15, 2023 (5 days ago)
        expect(formatRelativeDate(daysAgo, 'en-US')).toBe('5 days ago');
      });
      
      test('formats older dates with full date format', () => {
        const olderDate = new Date(2022, 11, 1); // December 1, 2022 (more than 30 days ago)
        expect(formatRelativeDate(olderDate, 'en-US')).toBe('12/01/2022');
      });
    });
    
    describe('Edge cases and error handling', () => {
      test('returns empty string for null input', () => {
        expect(formatRelativeDate(null as any)).toBe('');
      });
      
      test('returns empty string for undefined input', () => {
        expect(formatRelativeDate(undefined as any)).toBe('');
      });
      
      test('returns empty string for invalid date string', () => {
        expect(formatRelativeDate(invalidDateStr)).toBe('');
      });
      
      test('returns empty string for invalid Date object', () => {
        expect(formatRelativeDate(new Date('invalid'))).toBe('');
      });
      
      test('handles invalid locale by falling back to default', () => {
        const yesterday = new Date(2023, 0, 19); // January 19, 2023
        expect(formatRelativeDate(yesterday, 'invalid-locale' as any)).toBe('Ontem');
      });
      
      test('handles future dates correctly', () => {
        const futureDate = new Date(2023, 1, 1); // February 1, 2023 (future date)
        // Future dates should be formatted as regular dates
        expect(formatRelativeDate(futureDate)).toBe('01/02/2023');
      });
    });
  });

  describe('formatJourneyDate', () => {
    describe('Health journey formatting', () => {
      test('formats date for health journey correctly', () => {
        expect(formatJourneyDate(validDateObj, 'health')).toBe('15/01/2023 14:30');
      });
      
      test('formats date for health journey with English locale', () => {
        expect(formatJourneyDate(validDateObj, 'health', 'en-US')).toBe('01/15/2023 02:30 PM');
      });
    });
    
    describe('Care journey formatting', () => {
      test('formats date for care journey correctly', () => {
        expect(formatJourneyDate(validDateObj, 'care')).toBe('dom, 15 jan 2023');
      });
      
      test('formats date for care journey with English locale', () => {
        expect(formatJourneyDate(validDateObj, 'care', 'en-US')).toBe('Sun, Jan 15 2023');
      });
    });
    
    describe('Plan journey formatting', () => {
      test('formats date for plan journey correctly', () => {
        expect(formatJourneyDate(validDateObj, 'plan')).toBe('15/01/2023');
      });
      
      test('formats date for plan journey with English locale', () => {
        expect(formatJourneyDate(validDateObj, 'plan', 'en-US')).toBe('01/15/2023');
      });
    });
    
    describe('Default journey formatting', () => {
      test('formats date for unknown journey using default format', () => {
        expect(formatJourneyDate(validDateObj, 'unknown-journey')).toBe('15/01/2023');
      });
    });
    
    describe('Case insensitivity', () => {
      test('handles journey ID with different case (HEALTH)', () => {
        expect(formatJourneyDate(validDateObj, 'HEALTH')).toBe('15/01/2023 14:30');
      });
      
      test('handles journey ID with mixed case (CaRe)', () => {
        expect(formatJourneyDate(validDateObj, 'CaRe')).toBe('dom, 15 jan 2023');
      });
    });
    
    describe('Edge cases and error handling', () => {
      test('returns empty string for null input', () => {
        expect(formatJourneyDate(null as any, 'health')).toBe('');
      });
      
      test('returns empty string for undefined input', () => {
        expect(formatJourneyDate(undefined as any, 'health')).toBe('');
      });
      
      test('returns empty string for invalid date string', () => {
        expect(formatJourneyDate(invalidDateStr, 'health')).toBe('');
      });
      
      test('returns empty string for invalid Date object', () => {
        expect(formatJourneyDate(new Date('invalid'), 'health')).toBe('');
      });
      
      test('handles null journey ID by using default format', () => {
        expect(formatJourneyDate(validDateObj, null as any)).toBe('15/01/2023');
      });
      
      test('handles empty journey ID by using default format', () => {
        expect(formatJourneyDate(validDateObj, '')).toBe('15/01/2023');
      });
      
      test('handles invalid locale by falling back to default', () => {
        expect(formatJourneyDate(validDateObj, 'health', 'invalid-locale' as any))
          .toBe('15/01/2023 14:30');
      });
    });
  });
});
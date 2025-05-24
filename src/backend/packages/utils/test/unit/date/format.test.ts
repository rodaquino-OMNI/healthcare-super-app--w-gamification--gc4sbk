import {
  formatDate,
  formatTime,
  formatDateTime,
  formatDateRange,
  formatRelativeDate
} from '../../../src/date/format';
import {
  DEFAULT_DATE_FORMAT,
  DEFAULT_TIME_FORMAT,
  DEFAULT_DATETIME_FORMAT,
  DEFAULT_LOCALE
} from '../../../src/date/constants';

describe('Date Formatting Utilities', () => {
  // Fixed test date to ensure consistent results
  const testDate = new Date(2023, 5, 15, 14, 30, 0); // June 15, 2023, 14:30:00

  describe('formatDate', () => {
    it('should format a date with default format and locale', () => {
      expect(formatDate(testDate)).toBe('15/06/2023');
    });

    it('should format a date with custom format', () => {
      expect(formatDate(testDate, 'yyyy-MM-dd')).toBe('2023-06-15');
      expect(formatDate(testDate, 'dd MMM yyyy')).toBe('15 jun 2023');
      expect(formatDate(testDate, 'EEEE, dd MMMM yyyy')).toBe('quinta-feira, 15 junho 2023');
    });

    it('should format a date with English locale', () => {
      expect(formatDate(testDate, DEFAULT_DATE_FORMAT, 'en-US')).toBe('06/15/2023');
      expect(formatDate(testDate, 'EEEE, MMMM dd, yyyy', 'en-US')).toBe('Thursday, June 15, 2023');
    });

    it('should format a date string', () => {
      expect(formatDate('2023-06-15T14:30:00.000Z')).toBe('15/06/2023');
    });

    it('should format a timestamp', () => {
      const timestamp = testDate.getTime();
      expect(formatDate(timestamp)).toBe('15/06/2023');
    });

    it('should return empty string for invalid date', () => {
      expect(formatDate('invalid-date')).toBe('');
      expect(formatDate(null as any)).toBe('');
      expect(formatDate(undefined as any)).toBe('');
    });

    it('should use default locale if provided locale is invalid', () => {
      expect(formatDate(testDate, DEFAULT_DATE_FORMAT, 'invalid-locale')).toBe('15/06/2023');
    });
  });

  describe('formatTime', () => {
    it('should format time with default format and locale', () => {
      expect(formatTime(testDate)).toBe('14:30');
    });

    it('should format time with custom format', () => {
      expect(formatTime(testDate, 'h:mm a')).toBe('2:30 PM');
      expect(formatTime(testDate, 'HH:mm:ss')).toBe('14:30:00');
    });

    it('should format time with English locale', () => {
      expect(formatTime(testDate, 'h:mm a', 'en-US')).toBe('2:30 PM');
    });

    it('should format a time string', () => {
      expect(formatTime('2023-06-15T14:30:00.000Z')).toBe('14:30');
    });

    it('should format a timestamp', () => {
      const timestamp = testDate.getTime();
      expect(formatTime(timestamp)).toBe('14:30');
    });

    it('should return empty string for invalid time', () => {
      expect(formatTime('invalid-time')).toBe('');
      expect(formatTime(null as any)).toBe('');
      expect(formatTime(undefined as any)).toBe('');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time with default format and locale', () => {
      expect(formatDateTime(testDate)).toBe('15/06/2023 14:30');
    });

    it('should format date and time with custom format', () => {
      expect(formatDateTime(testDate, 'yyyy-MM-dd HH:mm')).toBe('2023-06-15 14:30');
      expect(formatDateTime(testDate, 'dd MMM yyyy, h:mm a')).toBe('15 jun 2023, 2:30 PM');
    });

    it('should format date and time with English locale', () => {
      expect(formatDateTime(testDate, DEFAULT_DATETIME_FORMAT, 'en-US')).toBe('06/15/2023 14:30');
      expect(formatDateTime(testDate, 'EEEE, MMMM dd, yyyy h:mm a', 'en-US')).toBe('Thursday, June 15, 2023 2:30 PM');
    });

    it('should format a date-time string', () => {
      expect(formatDateTime('2023-06-15T14:30:00.000Z')).toBe('15/06/2023 14:30');
    });

    it('should format a timestamp', () => {
      const timestamp = testDate.getTime();
      expect(formatDateTime(timestamp)).toBe('15/06/2023 14:30');
    });

    it('should return empty string for invalid date-time', () => {
      expect(formatDateTime('invalid-datetime')).toBe('');
      expect(formatDateTime(null as any)).toBe('');
      expect(formatDateTime(undefined as any)).toBe('');
    });
  });

  describe('formatDateRange', () => {
    const startDate = new Date(2023, 5, 15); // June 15, 2023
    const endDate = new Date(2023, 5, 20); // June 20, 2023

    it('should format date range with default format and locale', () => {
      expect(formatDateRange(startDate, endDate)).toBe('15/06/2023 - 20/06/2023');
    });

    it('should format date range with custom format', () => {
      expect(formatDateRange(startDate, endDate, 'yyyy-MM-dd')).toBe('2023-06-15 - 2023-06-20');
      expect(formatDateRange(startDate, endDate, 'dd MMM')).toBe('15 jun - 20 jun');
    });

    it('should format date range with English locale', () => {
      expect(formatDateRange(startDate, endDate, DEFAULT_DATE_FORMAT, 'en-US')).toBe('06/15/2023 - 06/20/2023');
      expect(formatDateRange(startDate, endDate, 'MMM dd, yyyy', 'en-US')).toBe('Jun 15, 2023 - Jun 20, 2023');
    });

    it('should return empty string if either date is invalid', () => {
      expect(formatDateRange(new Date('invalid'), endDate)).toBe('');
      expect(formatDateRange(startDate, new Date('invalid'))).toBe('');
      expect(formatDateRange(null as any, endDate)).toBe('');
      expect(formatDateRange(startDate, null as any)).toBe('');
    });

    it('should handle same start and end dates', () => {
      const sameDate = new Date(2023, 5, 15);
      expect(formatDateRange(sameDate, sameDate)).toBe('15/06/2023 - 15/06/2023');
    });

    it('should handle end date before start date', () => {
      // The function should still format the dates, even if end date is before start date
      // It's not the formatter's responsibility to validate the date range logic
      const earlierDate = new Date(2023, 5, 10);
      expect(formatDateRange(startDate, earlierDate)).toBe('15/06/2023 - 10/06/2023');
    });
  });

  describe('formatRelativeDate', () => {
    // Mock current date for consistent testing
    let originalDate: DateConstructor;
    
    beforeEach(() => {
      originalDate = global.Date;
      // Mock current date as June 15, 2023
      const mockDate = new Date(2023, 5, 15, 12, 0, 0) as any;
      global.Date = class extends Date {
        constructor(...args: any[]) {
          if (args.length === 0) {
            return mockDate;
          }
          return new originalDate(...args);
        }
      } as DateConstructor;
    });

    afterEach(() => {
      global.Date = originalDate;
    });

    it('should format today in Portuguese', () => {
      const today = new Date(2023, 5, 15, 10, 0, 0); // Same day, different time
      expect(formatRelativeDate(today, 'pt-BR')).toBe('Hoje');
    });

    it('should format today in English', () => {
      const today = new Date(2023, 5, 15, 10, 0, 0); // Same day, different time
      expect(formatRelativeDate(today, 'en-US')).toBe('Today');
    });

    it('should format yesterday in Portuguese', () => {
      const yesterday = new Date(2023, 5, 14, 10, 0, 0);
      expect(formatRelativeDate(yesterday, 'pt-BR')).toBe('Ontem');
    });

    it('should format yesterday in English', () => {
      const yesterday = new Date(2023, 5, 14, 10, 0, 0);
      expect(formatRelativeDate(yesterday, 'en-US')).toBe('Yesterday');
    });

    it('should format days ago in Portuguese', () => {
      const daysAgo = new Date(2023, 5, 10, 10, 0, 0); // 5 days ago
      expect(formatRelativeDate(daysAgo, 'pt-BR')).toBe('5 dias atrás');
    });

    it('should format days ago in English', () => {
      const daysAgo = new Date(2023, 5, 10, 10, 0, 0); // 5 days ago
      expect(formatRelativeDate(daysAgo, 'en-US')).toBe('5 days ago');
    });

    it('should format older dates with standard date format', () => {
      const olderDate = new Date(2023, 4, 1, 10, 0, 0); // May 1, 2023 (more than 30 days ago)
      expect(formatRelativeDate(olderDate, 'pt-BR')).toBe('01/05/2023');
      expect(formatRelativeDate(olderDate, 'en-US')).toBe('05/01/2023');
    });

    it('should return empty string for invalid date', () => {
      expect(formatRelativeDate('invalid-date')).toBe('');
      expect(formatRelativeDate(null as any)).toBe('');
      expect(formatRelativeDate(undefined as any)).toBe('');
    });

    it('should use default locale if provided locale is invalid', () => {
      const yesterday = new Date(2023, 5, 14, 10, 0, 0);
      expect(formatRelativeDate(yesterday, 'invalid-locale')).toBe('Ontem'); // Default is pt-BR
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle Date objects at the edge of valid ranges', () => {
      // Test with minimum and maximum valid dates
      const minDate = new Date(-8640000000000000); // Minimum date value
      const maxDate = new Date(8640000000000000); // Maximum date value
      
      expect(formatDate(minDate)).not.toBe('');
      expect(formatDate(maxDate)).not.toBe('');
    });

    it('should handle timezone edge cases', () => {
      // Test date near DST transitions
      const dstTransitionDate = new Date(2023, 2, 26, 1, 30, 0); // Around DST transition in many regions
      expect(formatDateTime(dstTransitionDate)).not.toBe('');
    });

    it('should handle various input types consistently', () => {
      const dateStr = '2023-06-15T14:30:00.000Z';
      const dateObj = new Date(dateStr);
      const timestamp = dateObj.getTime();
      
      const formattedFromStr = formatDate(dateStr);
      const formattedFromObj = formatDate(dateObj);
      const formattedFromTimestamp = formatDate(timestamp);
      
      // All three input types should produce the same output
      expect(formattedFromStr).toBe(formattedFromObj);
      expect(formattedFromObj).toBe(formattedFromTimestamp);
    });

    it('should handle empty format strings by using defaults', () => {
      expect(formatDate(testDate, '')).toBe(formatDate(testDate, DEFAULT_DATE_FORMAT));
      expect(formatTime(testDate, '')).toBe(formatTime(testDate, DEFAULT_TIME_FORMAT));
      expect(formatDateTime(testDate, '')).toBe(formatDateTime(testDate, DEFAULT_DATETIME_FORMAT));
    });
  });
});
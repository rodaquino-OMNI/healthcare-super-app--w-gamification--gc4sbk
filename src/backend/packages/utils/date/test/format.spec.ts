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
} from '../format';

describe('Date Format Module Re-exports', () => {
  describe('Constants', () => {
    test('should export DEFAULT_DATE_FORMAT', () => {
      expect(DEFAULT_DATE_FORMAT).toBeDefined();
      expect(DEFAULT_DATE_FORMAT).toBe('dd/MM/yyyy');
    });

    test('should export DEFAULT_TIME_FORMAT', () => {
      expect(DEFAULT_TIME_FORMAT).toBeDefined();
      expect(DEFAULT_TIME_FORMAT).toBe('HH:mm');
    });

    test('should export DEFAULT_DATETIME_FORMAT', () => {
      expect(DEFAULT_DATETIME_FORMAT).toBeDefined();
      expect(DEFAULT_DATETIME_FORMAT).toBe('dd/MM/yyyy HH:mm');
    });

    test('should export DEFAULT_LOCALE', () => {
      expect(DEFAULT_LOCALE).toBeDefined();
      expect(DEFAULT_LOCALE).toBe('pt-BR');
    });
  });

  describe('Functions', () => {
    const testDate = new Date(2023, 0, 15, 14, 30); // January 15, 2023, 14:30

    test('should export formatDate function', () => {
      expect(formatDate).toBeDefined();
      expect(typeof formatDate).toBe('function');
      
      // Basic functionality test
      expect(formatDate(testDate)).toBe('15/01/2023');
      expect(formatDate(testDate, 'yyyy-MM-dd')).toBe('2023-01-15');
      expect(formatDate(testDate, DEFAULT_DATE_FORMAT, 'en-US')).toBe('15/01/2023');
      expect(formatDate('invalid date')).toBe('');
    });

    test('should export formatTime function', () => {
      expect(formatTime).toBeDefined();
      expect(typeof formatTime).toBe('function');
      
      // Basic functionality test
      expect(formatTime(testDate)).toBe('14:30');
      expect(formatTime(testDate, 'h:mm a')).toBe('2:30 PM');
      expect(formatTime(testDate, DEFAULT_TIME_FORMAT, 'en-US')).toBe('14:30');
      expect(formatTime('invalid date')).toBe('');
    });

    test('should export formatDateTime function', () => {
      expect(formatDateTime).toBeDefined();
      expect(typeof formatDateTime).toBe('function');
      
      // Basic functionality test
      expect(formatDateTime(testDate)).toBe('15/01/2023 14:30');
      expect(formatDateTime(testDate, 'yyyy-MM-dd HH:mm')).toBe('2023-01-15 14:30');
      expect(formatDateTime(testDate, DEFAULT_DATETIME_FORMAT, 'en-US')).toBe('15/01/2023 14:30');
      expect(formatDateTime('invalid date')).toBe('');
    });

    test('should export formatDateRange function', () => {
      expect(formatDateRange).toBeDefined();
      expect(typeof formatDateRange).toBe('function');
      
      const startDate = new Date(2023, 0, 15); // January 15, 2023
      const endDate = new Date(2023, 0, 20); // January 20, 2023
      
      // Basic functionality test
      expect(formatDateRange(startDate, endDate)).toBe('15/01/2023 - 20/01/2023');
      expect(formatDateRange(startDate, endDate, 'yyyy-MM-dd')).toBe('2023-01-15 - 2023-01-20');
      expect(formatDateRange(startDate, endDate, DEFAULT_DATE_FORMAT, 'en-US')).toBe('15/01/2023 - 20/01/2023');
      expect(formatDateRange('invalid date', endDate)).toBe('');
      expect(formatDateRange(startDate, 'invalid date')).toBe('');
    });

    test('should export formatRelativeDate function', () => {
      expect(formatRelativeDate).toBeDefined();
      expect(typeof formatRelativeDate).toBe('function');
      
      // Mock current date for consistent testing
      const realDate = global.Date;
      const mockDate = new Date(2023, 0, 15); // January 15, 2023
      global.Date = class extends Date {
        constructor(...args) {
          if (args.length === 0) {
            return new realDate(mockDate);
          }
          return new realDate(...args);
        }
      };
      
      const today = new Date(2023, 0, 15); // January 15, 2023 (today)
      const yesterday = new Date(2023, 0, 14); // January 14, 2023 (yesterday)
      const threeDaysAgo = new Date(2023, 0, 12); // January 12, 2023 (3 days ago)
      const lastMonth = new Date(2022, 11, 15); // December 15, 2022 (last month)
      
      // Basic functionality test
      expect(formatRelativeDate(today, 'pt-BR')).toBe('Hoje');
      expect(formatRelativeDate(yesterday, 'pt-BR')).toBe('Ontem');
      expect(formatRelativeDate(threeDaysAgo, 'pt-BR')).toBe('3 dias atrás');
      expect(formatRelativeDate(lastMonth, 'pt-BR')).toBe('15/12/2022');
      
      expect(formatRelativeDate(today, 'en-US')).toBe('Today');
      expect(formatRelativeDate(yesterday, 'en-US')).toBe('Yesterday');
      expect(formatRelativeDate(threeDaysAgo, 'en-US')).toBe('3 days ago');
      expect(formatRelativeDate(lastMonth, 'en-US')).toBe('15/12/2022');
      
      expect(formatRelativeDate('invalid date')).toBe('');
      
      // Restore original Date
      global.Date = realDate;
    });

    test('should export formatJourneyDate function', () => {
      expect(formatJourneyDate).toBeDefined();
      expect(typeof formatJourneyDate).toBe('function');
      
      // Basic functionality test
      expect(formatJourneyDate(testDate, 'health')).toBe('15/01/2023 14:30');
      expect(formatJourneyDate(testDate, 'care')).toBe('dom, 15 jan 2023');
      expect(formatJourneyDate(testDate, 'plan')).toBe('15/01/2023');
      expect(formatJourneyDate(testDate, 'unknown')).toBe('15/01/2023');
      expect(formatJourneyDate('invalid date', 'health')).toBe('');
    });
  });
});
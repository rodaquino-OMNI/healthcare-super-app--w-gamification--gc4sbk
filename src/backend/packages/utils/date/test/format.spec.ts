import { formatDate, formatTime, formatDateTime, formatDateRange, formatRelativeDate } from '../format';

describe('Date Format Module', () => {
  // Test date to use across all tests
  const testDate = new Date('2023-05-15T14:30:00');
  const testEndDate = new Date('2023-05-20T16:45:00');

  describe('formatDate function', () => {
    it('should be properly exported from format module', () => {
      expect(formatDate).toBeDefined();
      expect(typeof formatDate).toBe('function');
    });

    it('should format a date correctly with default format', () => {
      const result = formatDate(testDate);
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/); // dd/MM/yyyy format
      expect(result).toBe('15/05/2023');
    });

    it('should handle custom format strings', () => {
      const result = formatDate(testDate, 'yyyy-MM-dd');
      expect(result).toBe('2023-05-15');
    });

    it('should support different locales', () => {
      const ptResult = formatDate(testDate, 'MMMM', 'pt-BR');
      const enResult = formatDate(testDate, 'MMMM', 'en-US');
      
      // Month names should be different in different locales
      expect(ptResult.toLowerCase()).toBe('maio');
      expect(enResult.toLowerCase()).toBe('may');
    });
  });

  describe('formatTime function', () => {
    it('should be properly exported from format module', () => {
      expect(formatTime).toBeDefined();
      expect(typeof formatTime).toBe('function');
    });

    it('should format time correctly with default format', () => {
      const result = formatTime(testDate);
      expect(result).toMatch(/^\d{2}:\d{2}$/); // HH:mm format
      expect(result).toBe('14:30');
    });

    it('should handle custom format strings', () => {
      const result = formatTime(testDate, 'h:mm a');
      expect(result).toMatch(/\d{1,2}:\d{2} [AP]M/i);
      expect(result.toLowerCase()).toBe('2:30 pm');
    });
  });

  describe('formatDateTime function', () => {
    it('should be properly exported from format module', () => {
      expect(formatDateTime).toBeDefined();
      expect(typeof formatDateTime).toBe('function');
    });

    it('should format date and time correctly with default format', () => {
      const result = formatDateTime(testDate);
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/); // dd/MM/yyyy HH:mm format
      expect(result).toBe('15/05/2023 14:30');
    });

    it('should handle custom format strings', () => {
      const result = formatDateTime(testDate, 'yyyy-MM-dd HH:mm:ss');
      expect(result).toBe('2023-05-15 14:30:00');
    });
  });

  describe('formatDateRange function', () => {
    it('should be properly exported from format module', () => {
      expect(formatDateRange).toBeDefined();
      expect(typeof formatDateRange).toBe('function');
    });

    it('should format date range correctly with default format', () => {
      const result = formatDateRange(testDate, testEndDate);
      expect(result).toBe('15/05/2023 - 20/05/2023');
    });

    it('should handle custom format strings', () => {
      const result = formatDateRange(testDate, testEndDate, 'yyyy-MM-dd');
      expect(result).toBe('2023-05-15 - 2023-05-20');
    });

    it('should support different locales', () => {
      const result = formatDateRange(testDate, testEndDate, 'dd MMM', 'en-US');
      expect(result).toBe('15 May - 20 May');
    });
  });

  describe('formatRelativeDate function', () => {
    it('should be properly exported from format module', () => {
      expect(formatRelativeDate).toBeDefined();
      expect(typeof formatRelativeDate).toBe('function');
    });

    it('should format relative dates correctly', () => {
      // Mock current date to ensure consistent test results
      const realDate = global.Date;
      const mockDate = new Date('2023-05-16T10:00:00'); // One day after testDate
      global.Date = class extends Date {
        constructor(...args) {
          if (args.length === 0) {
            return new realDate(mockDate);
          }
          return new realDate(...args);
        }
      };

      try {
        // Test with a date from yesterday (relative to mock date)
        const result = formatRelativeDate(testDate, 'pt-BR');
        expect(result).toBe('Ontem');

        // Test with English locale
        const enResult = formatRelativeDate(testDate, 'en-US');
        expect(enResult).toBe('Yesterday');

        // Test with a date from 5 days ago (relative to mock date)
        const olderDate = new Date('2023-05-11T10:00:00');
        const daysAgoResult = formatRelativeDate(olderDate, 'pt-BR');
        expect(daysAgoResult).toBe('5 dias atrás');

        // Test with English locale
        const enDaysAgoResult = formatRelativeDate(olderDate, 'en-US');
        expect(enDaysAgoResult).toBe('5 days ago');
      } finally {
        // Restore the original Date
        global.Date = realDate;
      }
    });
  });
});
import * as dateUtils from '../index';

describe('@austa/utils/date barrel exports', () => {
  describe('constants', () => {
    it('should export DEFAULT_DATE_FORMAT as string', () => {
      expect(dateUtils.DEFAULT_DATE_FORMAT).toBeDefined();
      expect(typeof dateUtils.DEFAULT_DATE_FORMAT).toBe('string');
    });

    it('should export DEFAULT_TIME_FORMAT as string', () => {
      expect(dateUtils.DEFAULT_TIME_FORMAT).toBeDefined();
      expect(typeof dateUtils.DEFAULT_TIME_FORMAT).toBe('string');
    });

    it('should export DEFAULT_DATETIME_FORMAT as string', () => {
      expect(dateUtils.DEFAULT_DATETIME_FORMAT).toBeDefined();
      expect(typeof dateUtils.DEFAULT_DATETIME_FORMAT).toBe('string');
    });

    it('should export DEFAULT_LOCALE as string', () => {
      expect(dateUtils.DEFAULT_LOCALE).toBeDefined();
      expect(typeof dateUtils.DEFAULT_LOCALE).toBe('string');
    });
  });

  describe('formatting functions', () => {
    it('should export formatDate as function', () => {
      expect(dateUtils.formatDate).toBeDefined();
      expect(typeof dateUtils.formatDate).toBe('function');
    });

    it('should export formatTime as function', () => {
      expect(dateUtils.formatTime).toBeDefined();
      expect(typeof dateUtils.formatTime).toBe('function');
    });

    it('should export formatDateTime as function', () => {
      expect(dateUtils.formatDateTime).toBeDefined();
      expect(typeof dateUtils.formatDateTime).toBe('function');
    });

    it('should export formatDateRange as function', () => {
      expect(dateUtils.formatDateRange).toBeDefined();
      expect(typeof dateUtils.formatDateRange).toBe('function');
    });

    it('should export formatRelativeDate as function', () => {
      expect(dateUtils.formatRelativeDate).toBeDefined();
      expect(typeof dateUtils.formatRelativeDate).toBe('function');
    });

    it('should export formatJourneyDate as function', () => {
      expect(dateUtils.formatJourneyDate).toBeDefined();
      expect(typeof dateUtils.formatJourneyDate).toBe('function');
    });
  });

  describe('parsing functions', () => {
    it('should export parseDate as function', () => {
      expect(dateUtils.parseDate).toBeDefined();
      expect(typeof dateUtils.parseDate).toBe('function');
    });
  });

  describe('validation functions', () => {
    it('should export isValidDate as function', () => {
      expect(dateUtils.isValidDate).toBeDefined();
      expect(typeof dateUtils.isValidDate).toBe('function');
    });
  });

  describe('range functions', () => {
    it('should export getDateRange as function', () => {
      expect(dateUtils.getDateRange).toBeDefined();
      expect(typeof dateUtils.getDateRange).toBe('function');
    });

    it('should export getDatesBetween as function', () => {
      expect(dateUtils.getDatesBetween).toBeDefined();
      expect(typeof dateUtils.getDatesBetween).toBe('function');
    });

    it('should export isDateInRange as function', () => {
      expect(dateUtils.isDateInRange).toBeDefined();
      expect(typeof dateUtils.isDateInRange).toBe('function');
    });
  });

  describe('comparison functions', () => {
    it('should export isSameDay as function', () => {
      expect(dateUtils.isSameDay).toBeDefined();
      expect(typeof dateUtils.isSameDay).toBe('function');
    });
  });

  describe('calculation functions', () => {
    it('should export calculateAge as function', () => {
      expect(dateUtils.calculateAge).toBeDefined();
      expect(typeof dateUtils.calculateAge).toBe('function');
    });

    it('should export getTimeAgo as function', () => {
      expect(dateUtils.getTimeAgo).toBeDefined();
      expect(typeof dateUtils.getTimeAgo).toBe('function');
    });
  });

  describe('timezone functions', () => {
    it('should export getLocalTimezone as function', () => {
      expect(dateUtils.getLocalTimezone).toBeDefined();
      expect(typeof dateUtils.getLocalTimezone).toBe('function');
    });
  });

  describe('backward compatibility', () => {
    it('should maintain all exports from original date.util.ts', () => {
      // This test ensures that all functions from the original utility are exported
      const expectedExports = [
        // Constants
        'DEFAULT_DATE_FORMAT',
        'DEFAULT_TIME_FORMAT',
        'DEFAULT_DATETIME_FORMAT',
        'DEFAULT_LOCALE',
        // Functions
        'formatDate',
        'formatTime',
        'formatDateTime',
        'parseDate',
        'isValidDate',
        'getDateRange',
        'calculateAge',
        'formatDateRange',
        'getTimeAgo',
        'getDatesBetween',
        'isSameDay',
        'getLocalTimezone',
        'formatRelativeDate',
        'formatJourneyDate',
        'isDateInRange'
      ];

      expectedExports.forEach(exportName => {
        expect(dateUtils).toHaveProperty(exportName);
      });
    });
  });
});
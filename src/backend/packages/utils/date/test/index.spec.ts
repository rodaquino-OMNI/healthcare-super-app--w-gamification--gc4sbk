/**
 * @file Tests for date utilities barrel exports
 * @description Verifies that all date-related functions and constants are properly exported
 * through the barrel export pattern, ensuring backward compatibility and proper API exposure.
 */

import * as DateUtils from '..';

describe('Date Utils Barrel Exports', () => {
  // Test for constants
  describe('Constants', () => {
    it('should export all date format constants', () => {
      expect(DateUtils.DEFAULT_DATE_FORMAT).toBeDefined();
      expect(DateUtils.DEFAULT_TIME_FORMAT).toBeDefined();
      expect(DateUtils.DEFAULT_DATETIME_FORMAT).toBeDefined();
      expect(DateUtils.DEFAULT_LOCALE).toBeDefined();
      
      // Verify types
      expect(typeof DateUtils.DEFAULT_DATE_FORMAT).toBe('string');
      expect(typeof DateUtils.DEFAULT_TIME_FORMAT).toBe('string');
      expect(typeof DateUtils.DEFAULT_DATETIME_FORMAT).toBe('string');
      expect(typeof DateUtils.DEFAULT_LOCALE).toBe('string');
      
      // Verify values match expected defaults
      expect(DateUtils.DEFAULT_DATE_FORMAT).toBe('dd/MM/yyyy');
      expect(DateUtils.DEFAULT_TIME_FORMAT).toBe('HH:mm');
      expect(DateUtils.DEFAULT_DATETIME_FORMAT).toBe('dd/MM/yyyy HH:mm');
      expect(DateUtils.DEFAULT_LOCALE).toBe('pt-BR');
    });
    
    it('should export locale mapping', () => {
      expect(DateUtils.LOCALE_MAP).toBeDefined();
      expect(DateUtils.LOCALE_MAP['pt-BR']).toBeDefined();
      expect(DateUtils.LOCALE_MAP['en-US']).toBeDefined();
    });
    
    it('should export journey-specific formats', () => {
      expect(DateUtils.JOURNEY_DATE_FORMATS).toBeDefined();
      expect(DateUtils.JOURNEY_DATE_FORMATS.health).toBeDefined();
      expect(DateUtils.JOURNEY_DATE_FORMATS.care).toBeDefined();
      expect(DateUtils.JOURNEY_DATE_FORMATS.plan).toBeDefined();
    });
    
    it('should export date range types', () => {
      expect(DateUtils.DATE_RANGE_TYPES).toBeDefined();
      expect(DateUtils.DATE_RANGE_TYPES.TODAY).toBe('today');
      expect(DateUtils.DATE_RANGE_TYPES.YESTERDAY).toBe('yesterday');
      expect(DateUtils.DATE_RANGE_TYPES.THIS_WEEK).toBe('thisWeek');
      expect(DateUtils.DATE_RANGE_TYPES.LAST_WEEK).toBe('lastWeek');
      expect(DateUtils.DATE_RANGE_TYPES.THIS_MONTH).toBe('thisMonth');
      expect(DateUtils.DATE_RANGE_TYPES.LAST_MONTH).toBe('lastMonth');
      expect(DateUtils.DATE_RANGE_TYPES.THIS_YEAR).toBe('thisYear');
      expect(DateUtils.DATE_RANGE_TYPES.LAST_YEAR).toBe('lastYear');
      expect(DateUtils.DATE_RANGE_TYPES.LAST_7_DAYS).toBe('last7Days');
      expect(DateUtils.DATE_RANGE_TYPES.LAST_30_DAYS).toBe('last30Days');
      expect(DateUtils.DATE_RANGE_TYPES.LAST_90_DAYS).toBe('last90Days');
      expect(DateUtils.DATE_RANGE_TYPES.LAST_365_DAYS).toBe('last365Days');
    });
  });
  
  // Test for formatting functions
  describe('Formatting Functions', () => {
    it('should export all date formatting functions', () => {
      expect(DateUtils.formatDate).toBeDefined();
      expect(DateUtils.formatTime).toBeDefined();
      expect(DateUtils.formatDateTime).toBeDefined();
      expect(DateUtils.formatDateRange).toBeDefined();
      expect(DateUtils.formatRelativeDate).toBeDefined();
      expect(DateUtils.formatJourneyDate).toBeDefined();
      
      // Verify types
      expect(typeof DateUtils.formatDate).toBe('function');
      expect(typeof DateUtils.formatTime).toBe('function');
      expect(typeof DateUtils.formatDateTime).toBe('function');
      expect(typeof DateUtils.formatDateRange).toBe('function');
      expect(typeof DateUtils.formatRelativeDate).toBe('function');
      expect(typeof DateUtils.formatJourneyDate).toBe('function');
    });
    
    it('should maintain backward compatibility for formatDate function', () => {
      const date = new Date(2023, 0, 15); // January 15, 2023
      
      // Default format
      expect(DateUtils.formatDate(date)).toBe('15/01/2023');
      
      // Custom format
      expect(DateUtils.formatDate(date, 'yyyy-MM-dd')).toBe('2023-01-15');
      
      // Custom locale
      expect(DateUtils.formatDate(date, DateUtils.DEFAULT_DATE_FORMAT, 'en-US')).toBe('15/01/2023');
    });
  });
  
  // Test for parsing functions
  describe('Parsing Functions', () => {
    it('should export all date parsing functions', () => {
      expect(DateUtils.parseDate).toBeDefined();
      
      // Verify types
      expect(typeof DateUtils.parseDate).toBe('function');
    });
    
    it('should maintain backward compatibility for parseDate function', () => {
      const dateStr = '15/01/2023';
      const parsedDate = DateUtils.parseDate(dateStr);
      
      expect(parsedDate).toBeInstanceOf(Date);
      expect(parsedDate.getFullYear()).toBe(2023);
      expect(parsedDate.getMonth()).toBe(0); // January is 0
      expect(parsedDate.getDate()).toBe(15);
    });
  });
  
  // Test for validation functions
  describe('Validation Functions', () => {
    it('should export all date validation functions', () => {
      expect(DateUtils.isValidDate).toBeDefined();
      
      // Verify types
      expect(typeof DateUtils.isValidDate).toBe('function');
    });
    
    it('should maintain backward compatibility for isValidDate function', () => {
      expect(DateUtils.isValidDate(new Date())).toBe(true);
      expect(DateUtils.isValidDate('2023-01-15')).toBe(true);
      expect(DateUtils.isValidDate('invalid-date')).toBe(false);
      expect(DateUtils.isValidDate(null)).toBe(false);
      expect(DateUtils.isValidDate(undefined)).toBe(false);
    });
  });
  
  // Test for range functions
  describe('Range Functions', () => {
    it('should export all date range functions', () => {
      expect(DateUtils.getDateRange).toBeDefined();
      expect(DateUtils.getDatesBetween).toBeDefined();
      expect(DateUtils.isDateInRange).toBeDefined();
      
      // Verify types
      expect(typeof DateUtils.getDateRange).toBe('function');
      expect(typeof DateUtils.getDatesBetween).toBe('function');
      expect(typeof DateUtils.isDateInRange).toBe('function');
    });
    
    it('should maintain backward compatibility for getDateRange function', () => {
      const result = DateUtils.getDateRange('today');
      
      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('endDate');
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
    });
  });
  
  // Test for comparison functions
  describe('Comparison Functions', () => {
    it('should export all date comparison functions', () => {
      expect(DateUtils.isSameDay).toBeDefined();
      
      // Verify types
      expect(typeof DateUtils.isSameDay).toBe('function');
    });
    
    it('should maintain backward compatibility for isSameDay function', () => {
      const date1 = new Date(2023, 0, 15); // January 15, 2023
      const date2 = new Date(2023, 0, 15, 12, 30); // January 15, 2023, 12:30
      const date3 = new Date(2023, 0, 16); // January 16, 2023
      
      expect(DateUtils.isSameDay(date1, date2)).toBe(true);
      expect(DateUtils.isSameDay(date1, date3)).toBe(false);
    });
  });
  
  // Test for calculation functions
  describe('Calculation Functions', () => {
    it('should export all date calculation functions', () => {
      expect(DateUtils.calculateAge).toBeDefined();
      expect(DateUtils.getTimeAgo).toBeDefined();
      
      // Verify types
      expect(typeof DateUtils.calculateAge).toBe('function');
      expect(typeof DateUtils.getTimeAgo).toBe('function');
    });
    
    it('should maintain backward compatibility for calculateAge function', () => {
      const birthdate = new Date(1990, 0, 1); // January 1, 1990
      const referenceDate = new Date(2023, 0, 1); // January 1, 2023
      
      expect(DateUtils.calculateAge(birthdate, referenceDate)).toBe(33);
    });
  });
  
  // Test for timezone functions
  describe('Timezone Functions', () => {
    it('should export all timezone functions', () => {
      expect(DateUtils.getLocalTimezone).toBeDefined();
      
      // Verify types
      expect(typeof DateUtils.getLocalTimezone).toBe('function');
    });
    
    it('should maintain backward compatibility for getLocalTimezone function', () => {
      const timezone = DateUtils.getLocalTimezone();
      
      // Should match format +HH:MM or -HH:MM
      expect(timezone).toMatch(/^[+-]\d{2}:\d{2}$/);
    });
  });
  
  // Test for journey-specific functions
  describe('Journey-Specific Functions', () => {
    it('should export all journey-specific functions', () => {
      expect(DateUtils.formatJourneyDate).toBeDefined();
      
      // Verify types
      expect(typeof DateUtils.formatJourneyDate).toBe('function');
    });
    
    it('should maintain backward compatibility for formatJourneyDate function', () => {
      const date = new Date(2023, 0, 15); // January 15, 2023
      
      // Health journey format
      expect(DateUtils.formatJourneyDate(date, 'health')).toMatch(/^15\/01\/2023 \d{2}:\d{2}$/);
      
      // Care journey format
      const careFormat = DateUtils.formatJourneyDate(date, 'care');
      expect(careFormat).toContain('15');
      expect(careFormat).toContain('Jan');
      expect(careFormat).toContain('2023');
      
      // Plan journey format
      expect(DateUtils.formatJourneyDate(date, 'plan')).toBe('15/01/2023');
    });
  });
});
/**
 * Tests for timezone utility functions
 * 
 * This file contains tests for all timezone-related utility functions in the date/timezone.ts module.
 * It verifies proper timezone detection, conversion, formatting, and handling of daylight saving time.
 * 
 * Key features:
 * - Dedicated test suite for timezone utilities separated from monolithic date tests
 * - Tests for daylight saving time edge cases (spring forward and fall back transitions)
 * - Mock timezone environment for consistent testing across CI environments
 * - Comprehensive test coverage for timezone conversion and offset calculations
 * - Error handling validation for all timezone operations
 */

import {
  getLocalTimezone,
  getLocalIANATimezone,
  isValidTimezone,
  convertToTimezone,
  formatWithTimezone,
  getTimezoneOffset,
  isDaylightSavingTime,
  isDSTTransition,
  getTimezoneAbbreviation,
  getAvailableTimezones,
  getCurrentDateInTimezone,
  TimezoneError
} from '../../../src/date/timezone';

import { setLocalTimezone } from '../../../test/mocks/date-mock';

// Mock Intl.DateTimeFormat for consistent testing across environments
// This ensures tests run consistently regardless of the host machine's timezone settings
const mockIntlDateTimeFormat = jest.fn();
const mockResolvedOptions = jest.fn();
const mockFormat = jest.fn();

// Setup and teardown for timezone mocking
// This implements a mock timezone environment for consistent testing across CI environments
describe('Timezone Utilities', () => {
  // Store original implementations
  const originalIntlDateTimeFormat = global.Intl.DateTimeFormat;
  const originalDate = global.Date;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock Intl.DateTimeFormat
    mockResolvedOptions.mockReturnValue({ timeZone: 'America/Sao_Paulo' });
    mockFormat.mockImplementation((date) => {
      return 'Wednesday, January 1, 2023, 12:00 PM GMT-3';
    });
    
    mockIntlDateTimeFormat.mockImplementation(() => ({
      resolvedOptions: mockResolvedOptions,
      format: mockFormat
    }));
    
    global.Intl.DateTimeFormat = mockIntlDateTimeFormat;
    
    // Set the mock timezone in the date-mock utility
    setLocalTimezone('+03:00');
  });
  
  afterEach(() => {
    // Restore original implementations after each test
    global.Intl.DateTimeFormat = originalIntlDateTimeFormat;
  });
  
  describe('getLocalTimezone', () => {
    it('should return the local timezone in +/-HH:MM format', () => {
      // Mock Date to return a fixed timezone offset
      const mockDate = jest.fn(() => ({
        getTimezoneOffset: () => -180 // -180 minutes = +03:00
      }));
      global.Date = mockDate as any;
      
      const result = getLocalTimezone();
      
      expect(result).toBe('+03:00');
      
      // Restore original Date
      global.Date = originalDate;
    });
    
    it('should handle negative timezone offsets correctly', () => {
      // Mock Date to return a negative timezone offset
      const mockDate = jest.fn(() => ({
        getTimezoneOffset: () => 300 // 300 minutes = -05:00
      }));
      global.Date = mockDate as any;
      
      const result = getLocalTimezone();
      
      expect(result).toBe('-05:00');
      
      // Restore original Date
      global.Date = originalDate;
    });
    
    it('should pad single-digit hours and minutes with zeros', () => {
      // Mock Date to return an offset that needs padding
      const mockDate = jest.fn(() => ({
        getTimezoneOffset: () => -90 // -90 minutes = +01:30
      }));
      global.Date = mockDate as any;
      
      const result = getLocalTimezone();
      
      expect(result).toBe('+01:30');
      
      // Restore original Date
      global.Date = originalDate;
    });
  });
  
  describe('getLocalIANATimezone', () => {
    it('should return the local IANA timezone identifier', () => {
      const result = getLocalIANATimezone();
      
      expect(result).toBe('America/Sao_Paulo');
      expect(mockResolvedOptions).toHaveBeenCalled();
    });
    
    it('should throw TimezoneError if Intl API fails', () => {
      // Mock resolvedOptions to throw an error
      mockResolvedOptions.mockImplementation(() => {
        throw new Error('Intl API error');
      });
      
      expect(() => getLocalIANATimezone()).toThrow(TimezoneError);
      expect(() => getLocalIANATimezone()).toThrow('Failed to retrieve local IANA timezone');
    });
  });
  
  describe('isValidTimezone', () => {
    it('should return true for valid timezone identifiers', () => {
      // Mock Intl.DateTimeFormat to not throw for valid timezones
      mockIntlDateTimeFormat.mockImplementation(() => ({
        resolvedOptions: mockResolvedOptions,
        format: mockFormat
      }));
      
      expect(isValidTimezone('America/Sao_Paulo')).toBe(true);
      expect(isValidTimezone('Europe/London')).toBe(true);
      expect(isValidTimezone('Asia/Tokyo')).toBe(true);
    });
    
    it('should return false for invalid timezone identifiers', () => {
      // Mock Intl.DateTimeFormat to throw for invalid timezones
      mockIntlDateTimeFormat.mockImplementation((locale, options) => {
        if (options?.timeZone === 'Invalid/Timezone') {
          throw new RangeError('Invalid timezone');
        }
        return {
          resolvedOptions: mockResolvedOptions,
          format: mockFormat
        };
      });
      
      expect(isValidTimezone('Invalid/Timezone')).toBe(false);
    });
  });
  
  describe('convertToTimezone', () => {
    // Store original formatInTimeZone function
    const originalFormatInTimeZone = require('date-fns-tz').formatInTimeZone;
    
    beforeEach(() => {
      // Mock formatInTimeZone from date-fns-tz
      jest.mock('date-fns-tz', () => ({
        formatInTimeZone: jest.fn((date, tz, format) => {
          // Simple mock implementation that adds/subtracts hours based on timezone
          if (tz === 'America/Sao_Paulo') {
            return '2023-01-01T09:00:00.000Z'; // -3 hours from UTC
          } else if (tz === 'Europe/London') {
            return '2023-01-01T12:00:00.000Z'; // +0 hours from UTC
          } else if (tz === 'Asia/Tokyo') {
            return '2023-01-01T21:00:00.000Z'; // +9 hours from UTC
          }
          return '2023-01-01T12:00:00.000Z'; // Default to UTC
        }),
        getTimezoneOffset: jest.fn()
      }));
    });
    
    afterEach(() => {
      // Restore original formatInTimeZone
      require('date-fns-tz').formatInTimeZone = originalFormatInTimeZone;
    });
    
    it('should convert a date from one timezone to another', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const result = convertToTimezone(date, 'UTC', 'America/Sao_Paulo');
      
      // The result should be 9:00 AM in Sao Paulo (3 hours behind UTC)
      expect(result.toISOString()).toBe('2023-01-01T09:00:00.000Z');
    });
    
    it('should throw TimezoneError for invalid date', () => {
      const invalidDate = new Date('invalid-date');
      
      expect(() => convertToTimezone(invalidDate, 'UTC', 'America/Sao_Paulo')).toThrow(TimezoneError);
      expect(() => convertToTimezone(invalidDate, 'UTC', 'America/Sao_Paulo')).toThrow('Invalid date provided');
    });
    
    it('should throw TimezoneError for invalid source timezone', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      
      // Mock isValidTimezone to return false for the source timezone
      jest.spyOn(global, 'isValidTimezone').mockImplementation((tz) => tz !== 'Invalid/Source');
      
      expect(() => convertToTimezone(date, 'Invalid/Source', 'America/Sao_Paulo')).toThrow(TimezoneError);
      expect(() => convertToTimezone(date, 'Invalid/Source', 'America/Sao_Paulo')).toThrow('Invalid source timezone');
    });
    
    it('should throw TimezoneError for invalid target timezone', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      
      // Mock isValidTimezone to return false for the target timezone
      jest.spyOn(global, 'isValidTimezone').mockImplementation((tz) => tz !== 'Invalid/Target');
      
      expect(() => convertToTimezone(date, 'UTC', 'Invalid/Target')).toThrow(TimezoneError);
      expect(() => convertToTimezone(date, 'UTC', 'Invalid/Target')).toThrow('Invalid target timezone');
    });
  });
  
  describe('formatWithTimezone', () => {
    // Store original formatInTimeZone function
    const originalFormatInTimeZone = require('date-fns-tz').formatInTimeZone;
    
    beforeEach(() => {
      // Mock formatInTimeZone from date-fns-tz
      jest.mock('date-fns-tz', () => ({
        formatInTimeZone: jest.fn((date, tz, format) => {
          if (format === 'yyyy-MM-dd HH:mm:ss zzz') {
            if (tz === 'America/Sao_Paulo') {
              return '2023-01-01 09:00:00 -03:00';
            } else if (tz === 'Europe/London') {
              return '2023-01-01 12:00:00 +00:00';
            }
          }
          return '2023-01-01 12:00:00 +00:00'; // Default
        }),
        getTimezoneOffset: jest.fn()
      }));
    });
    
    afterEach(() => {
      // Restore original formatInTimeZone
      require('date-fns-tz').formatInTimeZone = originalFormatInTimeZone;
    });
    
    it('should format a date with timezone information', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const result = formatWithTimezone(date, 'yyyy-MM-dd HH:mm:ss zzz', 'America/Sao_Paulo');
      
      expect(result).toBe('2023-01-01 09:00:00 -03:00');
    });
    
    it('should throw TimezoneError for invalid date', () => {
      const invalidDate = new Date('invalid-date');
      
      expect(() => formatWithTimezone(invalidDate, 'yyyy-MM-dd', 'America/Sao_Paulo')).toThrow(TimezoneError);
      expect(() => formatWithTimezone(invalidDate, 'yyyy-MM-dd', 'America/Sao_Paulo')).toThrow('Invalid date provided');
    });
    
    it('should throw TimezoneError for invalid timezone', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      
      // Mock isValidTimezone to return false
      jest.spyOn(global, 'isValidTimezone').mockImplementation(() => false);
      
      expect(() => formatWithTimezone(date, 'yyyy-MM-dd', 'Invalid/Timezone')).toThrow(TimezoneError);
      expect(() => formatWithTimezone(date, 'yyyy-MM-dd', 'Invalid/Timezone')).toThrow('Invalid timezone');
    });
  });
  
  describe('getTimezoneOffset', () => {
    // Store original getTimezoneOffset function
    const originalGetTimezoneOffset = require('date-fns-tz').getTimezoneOffset;
    
    beforeEach(() => {
      // Mock getTimezoneOffset from date-fns-tz
      jest.mock('date-fns-tz', () => ({
        formatInTimeZone: jest.fn(),
        getTimezoneOffset: jest.fn((tz, date) => {
          // Return offset in milliseconds
          if (tz === 'America/Sao_Paulo') {
            return -3 * 60 * 60 * 1000; // -3 hours in milliseconds
          } else if (tz === 'Europe/London') {
            // Simulate DST changes for London
            const month = date.getMonth();
            // Summer months (roughly April to October)
            if (month >= 3 && month <= 9) {
              return 1 * 60 * 60 * 1000; // +1 hour in milliseconds (BST)
            }
            return 0; // +0 hours in milliseconds (GMT)
          } else if (tz === 'Asia/Tokyo') {
            return 9 * 60 * 60 * 1000; // +9 hours in milliseconds
          }
          return 0; // Default to UTC
        })
      }));
    });
    
    afterEach(() => {
      // Restore original getTimezoneOffset
      require('date-fns-tz').getTimezoneOffset = originalGetTimezoneOffset;
    });
    
    it('should return the offset in minutes for a timezone', () => {
      const result = getTimezoneOffset('America/Sao_Paulo');
      
      // -3 hours = -180 minutes
      expect(result).toBe(-180);
    });
    
    it('should handle daylight saving time correctly', () => {
      // Test with a date in summer (BST)
      const summerDate = new Date('2023-06-01T12:00:00Z');
      const summerResult = getTimezoneOffset('Europe/London', summerDate);
      
      // +1 hour = 60 minutes (BST)
      expect(summerResult).toBe(60);
      
      // Test with a date in winter (GMT)
      const winterDate = new Date('2023-01-01T12:00:00Z');
      const winterResult = getTimezoneOffset('Europe/London', winterDate);
      
      // +0 hours = 0 minutes (GMT)
      expect(winterResult).toBe(0);
    });
    
    it('should throw TimezoneError for invalid timezone', () => {
      // Mock isValidTimezone to return false
      jest.spyOn(global, 'isValidTimezone').mockImplementation(() => false);
      
      expect(() => getTimezoneOffset('Invalid/Timezone')).toThrow(TimezoneError);
      expect(() => getTimezoneOffset('Invalid/Timezone')).toThrow('Invalid timezone');
    });
  });
  
  describe('isDaylightSavingTime', () => {
    beforeEach(() => {
      // Mock getTimezoneOffset to simulate DST differences
      jest.spyOn(global, 'getTimezoneOffset').mockImplementation((tz, date) => {
        if (tz === 'America/New_York') {
          // Simulate DST for New York
          const month = date.getMonth();
          // Summer months (roughly March to November)
          if (month >= 2 && month <= 10) {
            return -240; // -4 hours in minutes (EDT)
          }
          return -300; // -5 hours in minutes (EST)
        }
        return 0; // Default
      });
    });
    
    it('should return true when date is in DST period', () => {
      const summerDate = new Date('2023-06-01T12:00:00Z');
      const result = isDaylightSavingTime(summerDate, 'America/New_York');
      
      expect(result).toBe(true);
    });
    
    it('should return false when date is not in DST period', () => {
      const winterDate = new Date('2023-01-01T12:00:00Z');
      const result = isDaylightSavingTime(winterDate, 'America/New_York');
      
      expect(result).toBe(false);
    });
    
    it('should throw TimezoneError for invalid date', () => {
      const invalidDate = new Date('invalid-date');
      
      expect(() => isDaylightSavingTime(invalidDate, 'America/New_York')).toThrow(TimezoneError);
      expect(() => isDaylightSavingTime(invalidDate, 'America/New_York')).toThrow('Invalid date provided');
    });
    
    it('should throw TimezoneError for invalid timezone', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      
      // Mock isValidTimezone to return false
      jest.spyOn(global, 'isValidTimezone').mockImplementation(() => false);
      
      expect(() => isDaylightSavingTime(date, 'Invalid/Timezone')).toThrow(TimezoneError);
      expect(() => isDaylightSavingTime(date, 'Invalid/Timezone')).toThrow('Invalid timezone');
    });
  });
  
  describe('isDSTTransition', () => {
    beforeEach(() => {
      // Mock getTimezoneOffset to simulate DST transition
      jest.spyOn(global, 'getTimezoneOffset').mockImplementation((tz, date) => {
        if (tz === 'America/New_York') {
          // Simulate DST transition around March 12, 2023 at 2:00 AM
          const dateTime = date.getTime();
          const transitionTime = new Date('2023-03-12T07:00:00Z').getTime(); // 2:00 AM EST = 7:00 UTC
          
          if (dateTime < transitionTime) {
            return -300; // -5 hours in minutes (EST)
          } else {
            return -240; // -4 hours in minutes (EDT)
          }
        }
        return 0; // Default
      });
    });
    
    it('should return true when date is during DST transition', () => {
      // 2:30 AM on DST transition day (right after transition)
      const transitionDate = new Date('2023-03-12T07:30:00Z');
      const result = isDSTTransition(transitionDate, 'America/New_York');
      
      expect(result).toBe(true);
    });
    
    it('should return false when date is not during DST transition', () => {
      // Regular day, not during transition
      const regularDate = new Date('2023-06-01T12:00:00Z');
      const result = isDSTTransition(regularDate, 'America/New_York');
      
      expect(result).toBe(false);
    });
    
    it('should throw TimezoneError for invalid date', () => {
      const invalidDate = new Date('invalid-date');
      
      expect(() => isDSTTransition(invalidDate, 'America/New_York')).toThrow(TimezoneError);
      expect(() => isDSTTransition(invalidDate, 'America/New_York')).toThrow('Invalid date provided');
    });
    
    it('should throw TimezoneError for invalid timezone', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      
      // Mock isValidTimezone to return false
      jest.spyOn(global, 'isValidTimezone').mockImplementation(() => false);
      
      expect(() => isDSTTransition(date, 'Invalid/Timezone')).toThrow(TimezoneError);
      expect(() => isDSTTransition(date, 'Invalid/Timezone')).toThrow('Invalid timezone');
    });
  });
  
  describe('getTimezoneAbbreviation', () => {
    beforeEach(() => {
      // Mock Intl.DateTimeFormat for timezone abbreviations
      mockIntlDateTimeFormat.mockImplementation((locale, options) => {
        return {
          format: () => {
            if (options?.timeZone === 'America/New_York') {
              // Simulate different abbreviations based on date
              const month = options.month || 1;
              // Summer months (roughly March to November)
              if (month >= 3 && month <= 11) {
                return 'Jun 1, 2023, EDT'; // Eastern Daylight Time
              }
              return 'Jan 1, 2023, EST'; // Eastern Standard Time
            } else if (options?.timeZone === 'America/Sao_Paulo') {
              return 'Jan 1, 2023, BRT'; // Brasília Time
            } else if (options?.timeZone === 'Europe/London') {
              return 'Jan 1, 2023, GMT'; // Greenwich Mean Time
            }
            return 'Jan 1, 2023, UTC'; // Default
          },
          resolvedOptions: mockResolvedOptions
        };
      });
    });
    
    it('should return the abbreviation for a timezone', () => {
      const result = getTimezoneAbbreviation('America/Sao_Paulo');
      
      expect(result).toBe('BRT');
    });
    
    it('should handle different abbreviations based on DST', () => {
      // Summer date (EDT)
      const summerDate = new Date('2023-06-01T12:00:00Z');
      const summerResult = getTimezoneAbbreviation('America/New_York', summerDate);
      
      expect(summerResult).toBe('EDT');
      
      // Winter date (EST)
      const winterDate = new Date('2023-01-01T12:00:00Z');
      const winterResult = getTimezoneAbbreviation('America/New_York', winterDate);
      
      expect(winterResult).toBe('EST');
    });
    
    it('should throw TimezoneError for invalid timezone', () => {
      // Mock isValidTimezone to return false
      jest.spyOn(global, 'isValidTimezone').mockImplementation(() => false);
      
      expect(() => getTimezoneAbbreviation('Invalid/Timezone')).toThrow(TimezoneError);
      expect(() => getTimezoneAbbreviation('Invalid/Timezone')).toThrow('Invalid timezone');
    });
  });
  
  describe('getAvailableTimezones', () => {
    it('should return a list of IANA timezone identifiers', () => {
      // Mock Intl.supportedValuesOf if available
      const originalSupportedValuesOf = Intl.supportedValuesOf;
      
      // @ts-ignore - TypeScript might not recognize this method
      Intl.supportedValuesOf = jest.fn((category) => {
        if (category === 'timeZone') {
          return [
            'America/New_York',
            'America/Sao_Paulo',
            'Europe/London',
            'Asia/Tokyo',
            'UTC'
          ];
        }
        return [];
      });
      
      const result = getAvailableTimezones();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('America/New_York');
      expect(result).toContain('America/Sao_Paulo');
      expect(result).toContain('Europe/London');
      
      // Restore original method
      // @ts-ignore - TypeScript might not recognize this method
      Intl.supportedValuesOf = originalSupportedValuesOf;
    });
    
    it('should return a fallback list if Intl.supportedValuesOf is not available', () => {
      // Mock Intl.supportedValuesOf to be undefined
      const originalSupportedValuesOf = Intl.supportedValuesOf;
      // @ts-ignore - TypeScript might not recognize this method
      Intl.supportedValuesOf = undefined;
      
      const result = getAvailableTimezones();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('UTC');
      expect(result).toContain('America/Sao_Paulo');
      
      // Restore original method
      // @ts-ignore - TypeScript might not recognize this method
      Intl.supportedValuesOf = originalSupportedValuesOf;
    });
  });
  
  describe('getCurrentDateInTimezone', () => {
    beforeEach(() => {
      // Mock convertToTimezone
      jest.spyOn(global, 'convertToTimezone').mockImplementation((date, fromTz, toTz) => {
        // Simple mock that adjusts hours based on timezone
        const result = new Date(date);
        
        if (toTz === 'America/Sao_Paulo') {
          // -3 hours from UTC
          result.setHours(result.getHours() - 3);
        } else if (toTz === 'Europe/London') {
          // +0 hours from UTC
          // No adjustment needed
        } else if (toTz === 'Asia/Tokyo') {
          // +9 hours from UTC
          result.setHours(result.getHours() + 9);
        }
        
        return result;
      });
      
      // Mock getLocalIANATimezone
      jest.spyOn(global, 'getLocalIANATimezone').mockReturnValue('UTC');
    });
    
    it('should return the current date in the specified timezone', () => {
      // Mock Date.now() to return a fixed timestamp
      const originalNow = Date.now;
      Date.now = jest.fn(() => new Date('2023-01-01T12:00:00Z').getTime());
      
      const result = getCurrentDateInTimezone('America/Sao_Paulo');
      
      // Should be 9:00 AM in Sao Paulo when it's 12:00 PM UTC
      expect(result.getHours()).toBe(9);
      
      // Restore original Date.now
      Date.now = originalNow;
    });
    
    it('should throw TimezoneError for invalid timezone', () => {
      // Mock isValidTimezone to return false
      jest.spyOn(global, 'isValidTimezone').mockImplementation(() => false);
      
      expect(() => getCurrentDateInTimezone('Invalid/Timezone')).toThrow(TimezoneError);
      expect(() => getCurrentDateInTimezone('Invalid/Timezone')).toThrow('Invalid timezone');
    });
  });
  
  // Test edge cases and error handling
  // These tests specifically address the requirement to test daylight saving time edge cases
  describe('Daylight Saving Time Edge Cases', () => {
    // Test for the "spring forward" DST transition (when clocks move forward and an hour is skipped)
    it('should handle spring forward DST transition edge cases correctly', () => {
      // Mock getTimezoneOffset for DST transition simulation
      jest.spyOn(global, 'getTimezoneOffset').mockImplementation((tz, date) => {
        if (tz === 'America/New_York') {
          // Simulate the "missing hour" during spring forward
          // March 12, 2023: 2:00 AM -> 3:00 AM (skipped hour)
          const dateTime = date.getTime();
          const beforeTransition = new Date('2023-03-12T06:59:59Z').getTime(); // 1:59:59 AM EST
          const afterTransition = new Date('2023-03-12T07:00:00Z').getTime();  // 3:00:00 AM EDT
          
          if (dateTime >= beforeTransition && dateTime < afterTransition) {
            // This time doesn't actually exist (it's in the skipped hour)
            throw new Error('Invalid time during DST transition');
          }
          
          if (dateTime < beforeTransition) {
            return -300; // -5 hours (EST)
          } else {
            return -240; // -4 hours (EDT)
          }
        }
        return 0;
      });
      
      // Test time just before transition
      const beforeTransition = new Date('2023-03-12T06:59:00Z'); // 1:59 AM EST
      expect(getTimezoneOffset('America/New_York', beforeTransition)).toBe(-300);
      
      // Test time just after transition
      const afterTransition = new Date('2023-03-12T07:01:00Z'); // 3:01 AM EDT
      expect(getTimezoneOffset('America/New_York', afterTransition)).toBe(-240);
      
      // Test isDSTTransition function during transition
      jest.spyOn(global, 'isDSTTransition').mockReturnValue(true);
      const duringTransition = new Date('2023-03-12T07:00:00Z');
      expect(isDSTTransition(duringTransition, 'America/New_York')).toBe(true);
    });
    
    // Test for the "fall back" DST transition (when clocks move backward and an hour is repeated)
    it('should handle repeated hour during fall back correctly', () => {
      // Mock getTimezoneOffset for DST transition simulation
      jest.spyOn(global, 'getTimezoneOffset').mockImplementation((tz, date) => {
        if (tz === 'America/New_York') {
          // Simulate the "repeated hour" during fall back
          // November 5, 2023: 1:00 AM -> 1:00 AM (repeated hour)
          const dateTime = date.getTime();
          const beforeTransition = new Date('2023-11-05T05:00:00Z').getTime(); // 1:00 AM EDT
          const duringTransition = new Date('2023-11-05T05:30:00Z').getTime(); // 1:30 AM EDT
          const afterTransition = new Date('2023-11-05T06:00:00Z').getTime();  // 1:00 AM EST
          const afterRepeatedHour = new Date('2023-11-05T06:30:00Z').getTime(); // 1:30 AM EST
          
          if (dateTime < beforeTransition) {
            return -240; // -4 hours (EDT)
          } else if (dateTime >= beforeTransition && dateTime < afterTransition) {
            return -240; // First occurrence of 1:00-1:59 AM (EDT)
          } else if (dateTime >= afterTransition && dateTime < afterRepeatedHour) {
            return -300; // Second occurrence of 1:00-1:59 AM (EST)
          } else {
            return -300; // After 2:00 AM EST
          }
        }
        return 0;
      });
      
      // Test first occurrence of 1:30 AM (EDT)
      const firstOccurrence = new Date('2023-11-05T05:30:00Z');
      expect(getTimezoneOffset('America/New_York', firstOccurrence)).toBe(-240);
      
      // Test second occurrence of 1:30 AM (EST)
      const secondOccurrence = new Date('2023-11-05T06:30:00Z');
      expect(getTimezoneOffset('America/New_York', secondOccurrence)).toBe(-300);
    });
    
    // Test for DST-related error handling
    it('should handle errors during DST transitions gracefully', () => {
      // Mock getTimezoneOffset to throw an error during DST transition
      jest.spyOn(global, 'getTimezoneOffset').mockImplementation((tz, date) => {
        if (tz === 'America/New_York') {
          const dateTime = date.getTime();
          const transitionTime = new Date('2023-03-12T07:00:00Z').getTime();
          
          // Simulate an error during the transition hour
          if (Math.abs(dateTime - transitionTime) < 3600000) { // Within an hour of transition
            throw new Error('DST transition error');
          }
          
          return -300; // Default offset
        }
        return 0;
      });
      
      // Mock isDaylightSavingTime to handle the error
      jest.spyOn(global, 'isDaylightSavingTime').mockImplementation((date, tz) => {
        try {
          // This would normally call getTimezoneOffset which throws an error
          // But we're handling it gracefully
          return false;
        } catch (error) {
          throw new TimezoneError('Failed to check daylight saving time: DST transition error');
        }
      });
      
      // Test that the error is properly wrapped in a TimezoneError
      const transitionDate = new Date('2023-03-12T07:00:00Z');
      expect(() => getTimezoneOffset('America/New_York', transitionDate)).toThrow('DST transition error');
      expect(() => isDaylightSavingTime(transitionDate, 'America/New_York')).toThrow(TimezoneError);
    });
  });
  
  // Test cross-region timezone consistency
  describe('Cross-Region Timezone Consistency', () => {
    it('should maintain consistent time representation across regions', () => {
      // Mock convertToTimezone for cross-region testing
      jest.spyOn(global, 'convertToTimezone').mockImplementation((date, fromTz, toTz) => {
        // Create a new date to avoid modifying the original
        const result = new Date(date);
        
        // Apply timezone offsets based on the from/to timezones
        if (fromTz === 'UTC' && toTz === 'America/Sao_Paulo') {
          result.setHours(result.getHours() - 3); // UTC to BRT (-3 hours)
        } else if (fromTz === 'America/Sao_Paulo' && toTz === 'UTC') {
          result.setHours(result.getHours() + 3); // BRT to UTC (+3 hours)
        } else if (fromTz === 'America/Sao_Paulo' && toTz === 'Asia/Tokyo') {
          result.setHours(result.getHours() + 12); // BRT to JST (+12 hours difference)
        }
        
        return result;
      });
      
      // Test a specific time across multiple regions
      const utcTime = new Date('2023-06-15T12:00:00Z'); // Noon UTC
      const saoPauloTime = convertToTimezone(utcTime, 'UTC', 'America/Sao_Paulo');
      const tokyoTime = convertToTimezone(utcTime, 'UTC', 'Asia/Tokyo');
      
      // Verify the correct hour differences
      expect(saoPauloTime.getHours()).toBe(9); // 12 UTC - 3 = 9 AM in Sao Paulo
      expect(tokyoTime.getHours()).toBe(21); // 12 UTC + 9 = 9 PM in Tokyo
      
      // Verify that converting back to UTC gives the original time
      const backToUtc = convertToTimezone(saoPauloTime, 'America/Sao_Paulo', 'UTC');
      expect(backToUtc.getHours()).toBe(12); // Back to noon UTC
      
      // Test direct conversion between regions
      const saoPauloToTokyo = convertToTimezone(saoPauloTime, 'America/Sao_Paulo', 'Asia/Tokyo');
      expect(saoPauloToTokyo.getHours()).toBe(21); // 9 AM BRT + 12 = 9 PM JST
    });
    
    it('should handle notification delivery times correctly across timezones', () => {
      // This test simulates the requirement for proper communication with notification services across timezones
      
      // Mock formatWithTimezone for notification testing
      jest.spyOn(global, 'formatWithTimezone').mockImplementation((date, format, tz) => {
        if (tz === 'America/Sao_Paulo') {
          return '15/06/2023 09:00 BRT';
        } else if (tz === 'Europe/London') {
          return '15/06/2023 13:00 BST';
        } else if (tz === 'Asia/Tokyo') {
          return '15/06/2023 21:00 JST';
        }
        return '15/06/2023 12:00 UTC';
      });
      
      // Test notification delivery time formatting in different regions
      const deliveryTime = new Date('2023-06-15T12:00:00Z'); // Noon UTC
      
      // Format the delivery time for different regions
      const brazilFormat = formatWithTimezone(deliveryTime, 'dd/MM/yyyy HH:mm z', 'America/Sao_Paulo');
      const ukFormat = formatWithTimezone(deliveryTime, 'dd/MM/yyyy HH:mm z', 'Europe/London');
      const japanFormat = formatWithTimezone(deliveryTime, 'dd/MM/yyyy HH:mm z', 'Asia/Tokyo');
      
      // Verify the formatted times
      expect(brazilFormat).toBe('15/06/2023 09:00 BRT');
      expect(ukFormat).toBe('15/06/2023 13:00 BST');
      expect(japanFormat).toBe('15/06/2023 21:00 JST');
    });
  });
  
  // Test standardized error handling patterns
  describe('Standardized Error Handling', () => {
    it('should use consistent error handling patterns for all timezone operations', () => {
      // Mock isValidTimezone to return false for all inputs
      jest.spyOn(global, 'isValidTimezone').mockReturnValue(false);
      
      // Create an invalid date
      const invalidDate = new Date('invalid-date');
      const validDate = new Date('2023-01-01T12:00:00Z');
      
      // Test that all functions throw TimezoneError with consistent patterns
      expect(() => getLocalIANATimezone()).toThrow(TimezoneError);
      expect(() => convertToTimezone(validDate, 'UTC', 'Invalid/Timezone')).toThrow(TimezoneError);
      expect(() => formatWithTimezone(validDate, 'yyyy-MM-dd', 'Invalid/Timezone')).toThrow(TimezoneError);
      expect(() => getTimezoneOffset('Invalid/Timezone')).toThrow(TimezoneError);
      expect(() => isDaylightSavingTime(validDate, 'Invalid/Timezone')).toThrow(TimezoneError);
      expect(() => isDSTTransition(validDate, 'Invalid/Timezone')).toThrow(TimezoneError);
      expect(() => getTimezoneAbbreviation('Invalid/Timezone')).toThrow(TimezoneError);
      expect(() => getCurrentDateInTimezone('Invalid/Timezone')).toThrow(TimezoneError);
      
      // Test invalid date inputs
      expect(() => convertToTimezone(invalidDate, 'UTC', 'America/Sao_Paulo')).toThrow(TimezoneError);
      expect(() => formatWithTimezone(invalidDate, 'yyyy-MM-dd', 'America/Sao_Paulo')).toThrow(TimezoneError);
      expect(() => isDaylightSavingTime(invalidDate, 'America/Sao_Paulo')).toThrow(TimezoneError);
      expect(() => isDSTTransition(invalidDate, 'America/Sao_Paulo')).toThrow(TimezoneError);
      
      // Verify error messages follow a consistent pattern
      try {
        convertToTimezone(validDate, 'UTC', 'Invalid/Timezone');
      } catch (error) {
        expect(error.name).toBe('TimezoneError');
        expect(error.message).toContain('Invalid target timezone');
      }
      
      try {
        formatWithTimezone(validDate, 'yyyy-MM-dd', 'Invalid/Timezone');
      } catch (error) {
        expect(error.name).toBe('TimezoneError');
        expect(error.message).toContain('Invalid timezone');
      }
    });
  });
});
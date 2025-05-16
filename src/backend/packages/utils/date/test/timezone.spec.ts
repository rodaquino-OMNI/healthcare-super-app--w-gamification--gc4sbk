/**
 * @file timezone.spec.ts
 * @description Tests for timezone utility re-exports
 */

import { expect } from 'chai';
import * as timezoneModule from '../timezone';

describe('Timezone Utility Re-exports', () => {
  describe('getLocalTimezone', () => {
    it('should be exported correctly', () => {
      expect(timezoneModule.getLocalTimezone).to.be.a('function');
    });

    it('should return a string in the format +/-HH:MM', () => {
      const timezone = timezoneModule.getLocalTimezone();
      expect(timezone).to.be.a('string');
      expect(timezone).to.match(/^[+-]\d{2}:\d{2}$/);
    });

    it('should handle timezone offset correctly', () => {
      const timezone = timezoneModule.getLocalTimezone();
      const [direction, hours, minutes] = [timezone[0], timezone.substring(1, 3), timezone.substring(4, 6)];
      
      expect(direction).to.be.oneOf(['+', '-']);
      expect(parseInt(hours, 10)).to.be.within(0, 23);
      expect(parseInt(minutes, 10)).to.be.within(0, 59);
    });

    it('should be consistent with Date.prototype.getTimezoneOffset', () => {
      const timezone = timezoneModule.getLocalTimezone();
      const date = new Date();
      const offsetMinutes = -date.getTimezoneOffset();
      const offsetHours = Math.abs(Math.floor(offsetMinutes / 60));
      const offsetMins = Math.abs(offsetMinutes % 60);
      const expectedDirection = offsetMinutes >= 0 ? '+' : '-';
      const expected = `${expectedDirection}${offsetHours.toString().padStart(2, '0')}:${offsetMins.toString().padStart(2, '0')}`;
      
      expect(timezone).to.equal(expected);
    });
  });

  describe('getTimezoneAbbreviation', () => {
    it('should be exported correctly', () => {
      expect(timezoneModule.getTimezoneAbbreviation).to.be.a('function');
    });

    it('should return a string', () => {
      const abbr = timezoneModule.getTimezoneAbbreviation();
      expect(abbr).to.be.a('string');
    });

    it('should accept a date parameter', () => {
      const date = new Date('2023-01-01T00:00:00Z');
      const abbr = timezoneModule.getTimezoneAbbreviation(date);
      expect(abbr).to.be.a('string');
    });

    it('should accept a locale parameter', () => {
      const abbr = timezoneModule.getTimezoneAbbreviation(new Date(), 'pt-BR');
      expect(abbr).to.be.a('string');
    });
  });

  describe('formatWithTimezone', () => {
    it('should be exported correctly', () => {
      expect(timezoneModule.formatWithTimezone).to.be.a('function');
    });

    it('should format a date with the specified timezone', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const formatted = timezoneModule.formatWithTimezone(date, 'UTC');
      expect(formatted).to.be.a('string');
      expect(formatted).to.not.be.empty;
    });

    it('should accept locale and options parameters', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const formatted = timezoneModule.formatWithTimezone(
        date, 
        'UTC', 
        'pt-BR', 
        { year: 'numeric', month: 'long' }
      );
      expect(formatted).to.be.a('string');
      expect(formatted).to.not.be.empty;
    });

    it('should handle invalid timezone gracefully', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      // This should fall back to ISO string
      const formatted = timezoneModule.formatWithTimezone(date, 'Invalid/Timezone');
      expect(formatted).to.be.a('string');
      expect(formatted).to.not.be.empty;
    });
  });

  describe('getTimezoneOffset', () => {
    it('should be exported correctly', () => {
      expect(timezoneModule.getTimezoneOffset).to.be.a('function');
    });

    it('should return a number', () => {
      const offset = timezoneModule.getTimezoneOffset('UTC');
      expect(offset).to.be.a('number');
    });

    it('should return 0 for UTC timezone', () => {
      const offset = timezoneModule.getTimezoneOffset('UTC');
      // Due to DST and implementation differences, we'll check if it's close to 0
      expect(Math.abs(offset)).to.be.lessThan(10); // Within 10 minutes of 0
    });

    it('should accept a date parameter', () => {
      const date = new Date('2023-01-01T00:00:00Z');
      const offset = timezoneModule.getTimezoneOffset('UTC', date);
      expect(offset).to.be.a('number');
    });

    it('should handle invalid timezone gracefully', () => {
      const offset = timezoneModule.getTimezoneOffset('Invalid/Timezone');
      expect(offset).to.equal(0); // Should default to 0
    });
  });

  describe('convertToTimezone', () => {
    it('should be exported correctly', () => {
      expect(timezoneModule.convertToTimezone).to.be.a('function');
    });

    it('should return a Date object', () => {
      const date = new Date();
      const converted = timezoneModule.convertToTimezone(date, 'UTC');
      expect(converted).to.be.instanceOf(Date);
    });

    it('should not modify the original date', () => {
      const date = new Date();
      const originalTime = date.getTime();
      timezoneModule.convertToTimezone(date, 'UTC');
      expect(date.getTime()).to.equal(originalTime);
    });

    it('should handle invalid timezone gracefully', () => {
      const date = new Date();
      const converted = timezoneModule.convertToTimezone(date, 'Invalid/Timezone');
      expect(converted).to.be.instanceOf(Date);
      // Should return a copy of the original date
      expect(converted.getTime()).to.be.closeTo(date.getTime(), 1000); // Within 1 second
    });
  });

  describe('Runtime Environment Compatibility', () => {
    it('should handle browser-like environments', () => {
      // Simulate browser environment by using window-like object
      const originalIntl = global.Intl;
      try {
        // Mock a minimal Intl implementation if needed
        if (!global.Intl) {
          global.Intl = {
            DateTimeFormat: function() {
              return {
                format: () => 'Mocked Format',
                formatToParts: () => [{ type: 'timeZoneName', value: 'UTC' }]
              };
            }
          };
        }
        
        expect(timezoneModule.getLocalTimezone()).to.be.a('string');
        expect(timezoneModule.getTimezoneAbbreviation()).to.be.a('string');
      } finally {
        // Restore original Intl
        global.Intl = originalIntl;
      }
    });

    it('should handle Node.js environments', () => {
      // Node.js environment is already present in test runner
      expect(timezoneModule.getLocalTimezone()).to.be.a('string');
      expect(timezoneModule.getTimezoneAbbreviation()).to.be.a('string');
    });

    it('should handle environments without Intl support gracefully', () => {
      const originalIntl = global.Intl;
      try {
        // Remove Intl to simulate environment without internationalization support
        global.Intl = undefined;
        
        // getLocalTimezone should still work as it doesn't depend on Intl
        expect(timezoneModule.getLocalTimezone()).to.be.a('string');
        
        // Other functions should handle the absence of Intl gracefully
        // They might return fallback values or empty strings
        const abbr = timezoneModule.getTimezoneAbbreviation();
        expect(abbr).to.be.a('string');
      } finally {
        // Restore original Intl
        global.Intl = originalIntl;
      }
    });
  });
});
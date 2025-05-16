/**
 * @file parse.spec.ts
 * @description Tests for the date parsing utility re-exports
 */

import { parseDate } from '../parse';

describe('Date Parse Utilities', () => {
  describe('parseDate', () => {
    it('should parse a date string with default format (dd/MM/yyyy)', () => {
      const dateStr = '25/12/2023';
      const result = parseDate(dateStr);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getDate()).toBe(25);
      expect(result.getMonth()).toBe(11); // December is 11 (0-based)
      expect(result.getFullYear()).toBe(2023);
    });

    it('should parse a date string with custom format', () => {
      const dateStr = '2023-12-25';
      const format = 'yyyy-MM-dd';
      const result = parseDate(dateStr, format);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getDate()).toBe(25);
      expect(result.getMonth()).toBe(11); // December is 11 (0-based)
      expect(result.getFullYear()).toBe(2023);
    });

    it('should parse a date string with time components', () => {
      const dateStr = '25/12/2023 14:30';
      const format = 'dd/MM/yyyy HH:mm';
      const result = parseDate(dateStr, format);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getDate()).toBe(25);
      expect(result.getMonth()).toBe(11); // December is 11 (0-based)
      expect(result.getFullYear()).toBe(2023);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
    });

    it('should parse a date string with pt-BR locale', () => {
      const dateStr = '25/dez/2023'; // Portuguese abbreviated month
      const format = 'dd/MMM/yyyy';
      const locale = 'pt-BR';
      const result = parseDate(dateStr, format, locale);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getDate()).toBe(25);
      expect(result.getMonth()).toBe(11); // December is 11 (0-based)
      expect(result.getFullYear()).toBe(2023);
    });

    it('should parse a date string with en-US locale', () => {
      const dateStr = '25/Dec/2023'; // English abbreviated month
      const format = 'dd/MMM/yyyy';
      const locale = 'en-US';
      const result = parseDate(dateStr, format, locale);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getDate()).toBe(25);
      expect(result.getMonth()).toBe(11); // December is 11 (0-based)
      expect(result.getFullYear()).toBe(2023);
    });

    it('should throw an error for invalid date string', () => {
      const dateStr = 'invalid-date';
      
      expect(() => {
        parseDate(dateStr);
      }).toThrow('Invalid date string: invalid-date for format: dd/MM/yyyy');
    });

    it('should throw an error when date string does not match format', () => {
      const dateStr = '2023-12-25';
      const format = 'dd/MM/yyyy';
      
      expect(() => {
        parseDate(dateStr, format);
      }).toThrow(`Invalid date string: ${dateStr} for format: ${format}`);
    });

    it('should handle edge cases like leap years correctly', () => {
      // February 29 in a leap year
      const leapYearStr = '29/02/2020';
      const leapYearResult = parseDate(leapYearStr);
      
      expect(leapYearResult).toBeInstanceOf(Date);
      expect(leapYearResult.getDate()).toBe(29);
      expect(leapYearResult.getMonth()).toBe(1); // February is 1 (0-based)
      expect(leapYearResult.getFullYear()).toBe(2020);
      
      // February 29 in a non-leap year should throw an error
      const nonLeapYearStr = '29/02/2023';
      
      expect(() => {
        parseDate(nonLeapYearStr);
      }).toThrow(`Invalid date string: ${nonLeapYearStr} for format: dd/MM/yyyy`);
    });

    it('should handle different day and month positions based on locale', () => {
      // MM/dd/yyyy format with en-US locale
      const usDateStr = '12/25/2023';
      const usFormat = 'MM/dd/yyyy';
      const usLocale = 'en-US';
      const usResult = parseDate(usDateStr, usFormat, usLocale);
      
      expect(usResult).toBeInstanceOf(Date);
      expect(usResult.getDate()).toBe(25);
      expect(usResult.getMonth()).toBe(11); // December is 11 (0-based)
      expect(usResult.getFullYear()).toBe(2023);
      
      // dd/MM/yyyy format with pt-BR locale
      const brDateStr = '25/12/2023';
      const brFormat = 'dd/MM/yyyy';
      const brLocale = 'pt-BR';
      const brResult = parseDate(brDateStr, brFormat, brLocale);
      
      expect(brResult).toBeInstanceOf(Date);
      expect(brResult.getDate()).toBe(25);
      expect(brResult.getMonth()).toBe(11); // December is 11 (0-based)
      expect(brResult.getFullYear()).toBe(2023);
    });
  });
});
import { parseDate } from '../parse';

describe('Date Parse Module', () => {
  describe('parseDate function', () => {
    it('should be properly exported from parse module', () => {
      expect(parseDate).toBeDefined();
      expect(typeof parseDate).toBe('function');
    });

    it('should parse date strings with default format (dd/MM/yyyy)', () => {
      const dateStr = '15/01/2023';
      const parsedDate = parseDate(dateStr);
      
      expect(parsedDate).toBeInstanceOf(Date);
      expect(parsedDate.getDate()).toBe(15);
      expect(parsedDate.getMonth()).toBe(0); // January is 0
      expect(parsedDate.getFullYear()).toBe(2023);
    });

    it('should parse date strings with custom format', () => {
      const dateStr = '2023-01-15';
      const formatStr = 'yyyy-MM-dd';
      const parsedDate = parseDate(dateStr, formatStr);
      
      expect(parsedDate).toBeInstanceOf(Date);
      expect(parsedDate.getDate()).toBe(15);
      expect(parsedDate.getMonth()).toBe(0); // January is 0
      expect(parsedDate.getFullYear()).toBe(2023);
    });

    it('should parse date strings with time components', () => {
      const dateStr = '15/01/2023 14:30';
      const formatStr = 'dd/MM/yyyy HH:mm';
      const parsedDate = parseDate(dateStr, formatStr);
      
      expect(parsedDate).toBeInstanceOf(Date);
      expect(parsedDate.getDate()).toBe(15);
      expect(parsedDate.getMonth()).toBe(0); // January is 0
      expect(parsedDate.getFullYear()).toBe(2023);
      expect(parsedDate.getHours()).toBe(14);
      expect(parsedDate.getMinutes()).toBe(30);
    });

    it('should parse date strings with pt-BR locale', () => {
      const dateStr = 'segunda-feira, 15 de janeiro de 2023';
      const formatStr = 'EEEE, dd \\de MMMM \\de yyyy';
      const locale = 'pt-BR';
      const parsedDate = parseDate(dateStr, formatStr, locale);
      
      expect(parsedDate).toBeInstanceOf(Date);
      expect(parsedDate.getDate()).toBe(15);
      expect(parsedDate.getMonth()).toBe(0); // January is 0
      expect(parsedDate.getFullYear()).toBe(2023);
    });

    it('should parse date strings with en-US locale', () => {
      const dateStr = 'Monday, January 15, 2023';
      const formatStr = 'EEEE, MMMM dd, yyyy';
      const locale = 'en-US';
      const parsedDate = parseDate(dateStr, formatStr, locale);
      
      expect(parsedDate).toBeInstanceOf(Date);
      expect(parsedDate.getDate()).toBe(15);
      expect(parsedDate.getMonth()).toBe(0); // January is 0
      expect(parsedDate.getFullYear()).toBe(2023);
    });

    it('should throw an error for invalid date strings', () => {
      const invalidDateStr = 'not-a-date';
      
      expect(() => {
        parseDate(invalidDateStr);
      }).toThrow(Error);
      expect(() => {
        parseDate(invalidDateStr);
      }).toThrow(`Invalid date string: ${invalidDateStr} for format: dd/MM/yyyy`);
    });

    it('should throw an error for date strings that do not match the format', () => {
      const dateStr = '2023-01-15';
      const formatStr = 'dd/MM/yyyy'; // Format doesn't match the date string
      
      expect(() => {
        parseDate(dateStr, formatStr);
      }).toThrow(Error);
      expect(() => {
        parseDate(dateStr, formatStr);
      }).toThrow(`Invalid date string: ${dateStr} for format: ${formatStr}`);
    });

    it('should throw an error for invalid dates (e.g., February 30)', () => {
      const invalidDateStr = '30/02/2023'; // February 30 doesn't exist
      
      expect(() => {
        parseDate(invalidDateStr);
      }).toThrow(Error);
    });

    it('should handle leap year edge cases correctly', () => {
      // February 29 in leap year (valid)
      const leapYearDateStr = '29/02/2020';
      const leapYearDate = parseDate(leapYearDateStr);
      
      expect(leapYearDate).toBeInstanceOf(Date);
      expect(leapYearDate.getDate()).toBe(29);
      expect(leapYearDate.getMonth()).toBe(1); // February is 1
      expect(leapYearDate.getFullYear()).toBe(2020);
      
      // February 29 in non-leap year (invalid)
      const nonLeapYearDateStr = '29/02/2023';
      
      expect(() => {
        parseDate(nonLeapYearDateStr);
      }).toThrow(Error);
    });

    it('should parse dates with different separators', () => {
      // Using hyphens
      const hyphenDateStr = '15-01-2023';
      const hyphenFormatStr = 'dd-MM-yyyy';
      const hyphenDate = parseDate(hyphenDateStr, hyphenFormatStr);
      
      expect(hyphenDate).toBeInstanceOf(Date);
      expect(hyphenDate.getDate()).toBe(15);
      expect(hyphenDate.getMonth()).toBe(0); // January is 0
      expect(hyphenDate.getFullYear()).toBe(2023);
      
      // Using dots
      const dotDateStr = '15.01.2023';
      const dotFormatStr = 'dd.MM.yyyy';
      const dotDate = parseDate(dotDateStr, dotFormatStr);
      
      expect(dotDate).toBeInstanceOf(Date);
      expect(dotDate.getDate()).toBe(15);
      expect(dotDate.getMonth()).toBe(0); // January is 0
      expect(dotDate.getFullYear()).toBe(2023);
    });

    it('should parse dates with different format patterns', () => {
      // Year first (ISO format)
      const isoDateStr = '2023-01-15';
      const isoFormatStr = 'yyyy-MM-dd';
      const isoDate = parseDate(isoDateStr, isoFormatStr);
      
      expect(isoDate).toBeInstanceOf(Date);
      expect(isoDate.getDate()).toBe(15);
      expect(isoDate.getMonth()).toBe(0); // January is 0
      expect(isoDate.getFullYear()).toBe(2023);
      
      // Month first (US format)
      const usDateStr = '01/15/2023';
      const usFormatStr = 'MM/dd/yyyy';
      const usDate = parseDate(usDateStr, usFormatStr);
      
      expect(usDate).toBeInstanceOf(Date);
      expect(usDate.getDate()).toBe(15);
      expect(usDate.getMonth()).toBe(0); // January is 0
      expect(usDate.getFullYear()).toBe(2023);
    });
  });
});
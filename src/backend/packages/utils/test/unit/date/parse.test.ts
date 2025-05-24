import { parseDate } from '../../../src/date/parse';
import {
  DEFAULT_DATE_FORMAT,
  DEFAULT_LOCALE,
  LOCALE_MAP
} from '../../../src/date/constants';

describe('Date Parsing Utilities', () => {
  describe('parseDate', () => {
    describe('with default format and locale', () => {
      it('should parse a valid date string with default format (dd/MM/yyyy)', () => {
        const dateStr = '15/06/2023';
        const parsedDate = parseDate(dateStr);
        
        expect(parsedDate).toBeInstanceOf(Date);
        expect(parsedDate.getFullYear()).toBe(2023);
        expect(parsedDate.getMonth()).toBe(5); // June is month 5 (zero-based)
        expect(parsedDate.getDate()).toBe(15);
      });

      it('should parse dates with single-digit day and month', () => {
        const dateStr = '01/01/2023';
        const parsedDate = parseDate(dateStr);
        
        expect(parsedDate).toBeInstanceOf(Date);
        expect(parsedDate.getFullYear()).toBe(2023);
        expect(parsedDate.getMonth()).toBe(0); // January
        expect(parsedDate.getDate()).toBe(1);
      });

      it('should parse dates at month boundaries', () => {
        // Last day of month
        const lastDayOfJan = '31/01/2023';
        const parsedLastDay = parseDate(lastDayOfJan);
        
        expect(parsedLastDay).toBeInstanceOf(Date);
        expect(parsedLastDay.getFullYear()).toBe(2023);
        expect(parsedLastDay.getMonth()).toBe(0); // January
        expect(parsedLastDay.getDate()).toBe(31);

        // First day of month
        const firstDayOfFeb = '01/02/2023';
        const parsedFirstDay = parseDate(firstDayOfFeb);
        
        expect(parsedFirstDay).toBeInstanceOf(Date);
        expect(parsedFirstDay.getFullYear()).toBe(2023);
        expect(parsedFirstDay.getMonth()).toBe(1); // February
        expect(parsedFirstDay.getDate()).toBe(1);
      });
    });

    describe('with custom formats', () => {
      it('should parse date with yyyy-MM-dd format', () => {
        const dateStr = '2023-06-15';
        const parsedDate = parseDate(dateStr, 'yyyy-MM-dd');
        
        expect(parsedDate).toBeInstanceOf(Date);
        expect(parsedDate.getFullYear()).toBe(2023);
        expect(parsedDate.getMonth()).toBe(5); // June
        expect(parsedDate.getDate()).toBe(15);
      });

      it('should parse date with dd MMM yyyy format', () => {
        const dateStr = '15 jun 2023';
        const parsedDate = parseDate(dateStr, 'dd MMM yyyy');
        
        expect(parsedDate).toBeInstanceOf(Date);
        expect(parsedDate.getFullYear()).toBe(2023);
        expect(parsedDate.getMonth()).toBe(5); // June
        expect(parsedDate.getDate()).toBe(15);
      });

      it('should parse date with EEEE, dd MMMM yyyy format', () => {
        const dateStr = 'quinta-feira, 15 junho 2023';
        const parsedDate = parseDate(dateStr, 'EEEE, dd MMMM yyyy');
        
        expect(parsedDate).toBeInstanceOf(Date);
        expect(parsedDate.getFullYear()).toBe(2023);
        expect(parsedDate.getMonth()).toBe(5); // June
        expect(parsedDate.getDate()).toBe(15);
      });

      it('should parse date and time with yyyy-MM-dd HH:mm:ss format', () => {
        const dateTimeStr = '2023-06-15 14:30:45';
        const parsedDateTime = parseDate(dateTimeStr, 'yyyy-MM-dd HH:mm:ss');
        
        expect(parsedDateTime).toBeInstanceOf(Date);
        expect(parsedDateTime.getFullYear()).toBe(2023);
        expect(parsedDateTime.getMonth()).toBe(5); // June
        expect(parsedDateTime.getDate()).toBe(15);
        expect(parsedDateTime.getHours()).toBe(14);
        expect(parsedDateTime.getMinutes()).toBe(30);
        expect(parsedDateTime.getSeconds()).toBe(45);
      });
    });

    describe('with different locales', () => {
      it('should parse date with pt-BR locale (default)', () => {
        const dateStr = '15/06/2023';
        const parsedDate = parseDate(dateStr, DEFAULT_DATE_FORMAT, 'pt-BR');
        
        expect(parsedDate).toBeInstanceOf(Date);
        expect(parsedDate.getFullYear()).toBe(2023);
        expect(parsedDate.getMonth()).toBe(5); // June
        expect(parsedDate.getDate()).toBe(15);
      });

      it('should parse date with en-US locale and MM/dd/yyyy format', () => {
        const dateStr = '06/15/2023';
        const parsedDate = parseDate(dateStr, 'MM/dd/yyyy', 'en-US');
        
        expect(parsedDate).toBeInstanceOf(Date);
        expect(parsedDate.getFullYear()).toBe(2023);
        expect(parsedDate.getMonth()).toBe(5); // June
        expect(parsedDate.getDate()).toBe(15);
      });

      it('should parse date with en-US locale and MMMM dd, yyyy format', () => {
        const dateStr = 'June 15, 2023';
        const parsedDate = parseDate(dateStr, 'MMMM dd, yyyy', 'en-US');
        
        expect(parsedDate).toBeInstanceOf(Date);
        expect(parsedDate.getFullYear()).toBe(2023);
        expect(parsedDate.getMonth()).toBe(5); // June
        expect(parsedDate.getDate()).toBe(15);
      });

      it('should parse date with pt-BR locale and full text format', () => {
        const dateStr = 'quinta-feira, 15 de junho de 2023';
        const parsedDate = parseDate(dateStr, 'EEEE, dd \\de MMMM \\de yyyy', 'pt-BR');
        
        expect(parsedDate).toBeInstanceOf(Date);
        expect(parsedDate.getFullYear()).toBe(2023);
        expect(parsedDate.getMonth()).toBe(5); // June
        expect(parsedDate.getDate()).toBe(15);
      });

      it('should use default locale if provided locale is invalid', () => {
        const dateStr = '15/06/2023';
        const parsedDate = parseDate(dateStr, DEFAULT_DATE_FORMAT, 'invalid-locale');
        
        expect(parsedDate).toBeInstanceOf(Date);
        expect(parsedDate.getFullYear()).toBe(2023);
        expect(parsedDate.getMonth()).toBe(5); // June
        expect(parsedDate.getDate()).toBe(15);
      });
    });

    describe('error handling', () => {
      it('should throw error for invalid date string', () => {
        expect(() => {
          parseDate('invalid-date');
        }).toThrow();
      });

      it('should throw error for date string that does not match format', () => {
        expect(() => {
          parseDate('2023-06-15', 'dd/MM/yyyy');
        }).toThrow();
      });

      it('should throw error for invalid day in month', () => {
        expect(() => {
          parseDate('31/02/2023'); // February 31st doesn't exist
        }).toThrow();
      });

      it('should throw error for invalid month', () => {
        expect(() => {
          parseDate('15/13/2023'); // Month 13 doesn't exist
        }).toThrow();
      });

      it('should throw error with descriptive message', () => {
        try {
          parseDate('invalid-date');
          fail('Expected parseDate to throw an error');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Invalid date string');
          expect((error as Error).message).toContain('invalid-date');
        }
      });

      it('should throw error with format information in message', () => {
        try {
          parseDate('2023-06-15', 'dd/MM/yyyy');
          fail('Expected parseDate to throw an error');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Invalid date string');
          expect((error as Error).message).toContain('2023-06-15');
          expect((error as Error).message).toContain('dd/MM/yyyy');
        }
      });
    });

    describe('edge cases', () => {
      it('should handle leap year dates correctly', () => {
        // February 29 in leap year (valid)
        const leapYearDate = '29/02/2020';
        const parsedLeapDate = parseDate(leapYearDate);
        
        expect(parsedLeapDate).toBeInstanceOf(Date);
        expect(parsedLeapDate.getFullYear()).toBe(2020);
        expect(parsedLeapDate.getMonth()).toBe(1); // February
        expect(parsedLeapDate.getDate()).toBe(29);

        // February 29 in non-leap year (invalid)
        expect(() => {
          parseDate('29/02/2023');
        }).toThrow();
      });

      it('should handle different century years correctly', () => {
        // 20th century
        const date20thCentury = '15/06/1950';
        const parsed20thCentury = parseDate(date20thCentury);
        
        expect(parsed20thCentury).toBeInstanceOf(Date);
        expect(parsed20thCentury.getFullYear()).toBe(1950);
        expect(parsed20thCentury.getMonth()).toBe(5); // June
        expect(parsed20thCentury.getDate()).toBe(15);

        // 21st century
        const date21stCentury = '15/06/2023';
        const parsed21stCentury = parseDate(date21stCentury);
        
        expect(parsed21stCentury).toBeInstanceOf(Date);
        expect(parsed21stCentury.getFullYear()).toBe(2023);
        expect(parsed21stCentury.getMonth()).toBe(5); // June
        expect(parsed21stCentury.getDate()).toBe(15);
      });

      it('should handle two-digit years according to date-fns rules', () => {
        // Two-digit year (interpreted based on date-fns rules)
        const twoDigitYear = '15/06/23';
        const parsedTwoDigitYear = parseDate(twoDigitYear, 'dd/MM/yy');
        
        expect(parsedTwoDigitYear).toBeInstanceOf(Date);
        // date-fns typically interprets '23' as 2023, not 1923
        expect(parsedTwoDigitYear.getFullYear()).toBe(2023);
        expect(parsedTwoDigitYear.getMonth()).toBe(5); // June
        expect(parsedTwoDigitYear.getDate()).toBe(15);
      });

      it('should handle date with timezone information', () => {
        const dateWithTimezone = '2023-06-15T14:30:00+02:00';
        const parsedDateWithTimezone = parseDate(dateWithTimezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
        
        expect(parsedDateWithTimezone).toBeInstanceOf(Date);
        // Note: The actual hour might be adjusted based on the local timezone
        expect(parsedDateWithTimezone.getFullYear()).toBe(2023);
        expect(parsedDateWithTimezone.getMonth()).toBe(5); // June
        expect(parsedDateWithTimezone.getDate()).toBe(15);
      });

      it('should handle dates at DST transitions', () => {
        // A date during DST transition (implementation-dependent)
        // This test might need adjustment based on the specific behavior of date-fns
        const dstTransitionDate = '26/03/2023 02:30'; // Spring forward in Europe
        const parsedDstDate = parseDate(dstTransitionDate, 'dd/MM/yyyy HH:mm');
        
        expect(parsedDstDate).toBeInstanceOf(Date);
        expect(parsedDstDate.getFullYear()).toBe(2023);
        expect(parsedDstDate.getMonth()).toBe(2); // March
        expect(parsedDstDate.getDate()).toBe(26);
        // The hour might be adjusted based on the local timezone and DST rules
      });
    });
  });
});
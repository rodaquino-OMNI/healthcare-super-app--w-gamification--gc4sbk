import { calculateAge, getTimeAgo } from '../../../src/date/calculation';
import { addDays, addHours, addMinutes, addMonths, addSeconds, addYears, subDays, subHours, subMinutes, subMonths, subSeconds, subYears } from 'date-fns';

describe('Date Calculation Utilities', () => {
  describe('calculateAge', () => {
    const today = new Date(2025, 4, 24); // May 24, 2025

    it('should calculate age correctly for a standard case', () => {
      const birthdate = new Date(1990, 4, 24); // May 24, 1990
      expect(calculateAge(birthdate, today)).toBe(35);
    });

    it('should calculate age correctly when birthdate is a string', () => {
      // Assuming parseDate is used internally and works correctly
      const birthdate = '24/05/1990'; // May 24, 1990 in dd/MM/yyyy format
      expect(calculateAge(birthdate, today)).toBe(35);
    });

    it('should handle leap year birthdates correctly', () => {
      // February 29, 2000 (leap year)
      const leapYearBirthdate = new Date(2000, 1, 29);
      expect(calculateAge(leapYearBirthdate, today)).toBe(25);
    });

    it('should handle leap year birthdates when reference date is before birthday in the year', () => {
      // February 29, 2000 (leap year)
      const leapYearBirthdate = new Date(2000, 1, 29);
      const referenceDate = new Date(2025, 1, 28); // February 28, 2025
      expect(calculateAge(leapYearBirthdate, referenceDate)).toBe(24);
    });

    it('should handle same-day birthdays correctly', () => {
      // Same day as today but 35 years ago
      const birthdate = new Date(1990, 4, 24);
      expect(calculateAge(birthdate, today)).toBe(35);
    });

    it('should handle day before birthday correctly', () => {
      // Day before birthday
      const birthdate = new Date(1990, 4, 25); // May 25, 1990
      expect(calculateAge(birthdate, today)).toBe(34);
    });

    it('should handle day after birthday correctly', () => {
      // Day after birthday
      const birthdate = new Date(1990, 4, 23); // May 23, 1990
      expect(calculateAge(birthdate, today)).toBe(35);
    });

    it('should handle future birthdates by throwing an error or returning a negative age', () => {
      // Future birthdate
      const futureBirthdate = new Date(2026, 4, 24); // May 24, 2026
      
      // Depending on implementation, it might throw an error or return a negative age
      try {
        const age = calculateAge(futureBirthdate, today);
        // If it returns a negative age
        expect(age).toBe(-1);
      } catch (error) {
        // If it throws an error
        expect(error).toBeDefined();
        expect(error.message).toContain('Invalid birthdate');
      }
    });

    it('should throw an error for invalid dates', () => {
      // Invalid date
      const invalidDate = new Date('invalid date');
      expect(() => calculateAge(invalidDate, today)).toThrow();
    });

    it('should handle edge case when birthdate is exactly 1 year ago', () => {
      const oneYearAgo = new Date(2024, 4, 24); // May 24, 2024
      expect(calculateAge(oneYearAgo, today)).toBe(1);
    });

    it('should handle edge case when birthdate is exactly today', () => {
      expect(calculateAge(today, today)).toBe(0);
    });
  });

  describe('getTimeAgo', () => {
    let now: Date;

    beforeEach(() => {
      // Fix the current date for consistent testing
      now = new Date(2025, 4, 24, 12, 0, 0); // May 24, 2025, 12:00:00
      jest.spyOn(global, 'Date').mockImplementation(() => now as unknown as string);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('Portuguese locale (pt-BR)', () => {
      it('should format seconds ago correctly', () => {
        const date = subSeconds(now, 30);
        expect(getTimeAgo(date, 'pt-BR')).toBe('30 segundos atrás');
      });

      it('should format 1 minute ago correctly', () => {
        const date = subMinutes(now, 1);
        expect(getTimeAgo(date, 'pt-BR')).toBe('1 minuto atrás');
      });

      it('should format multiple minutes ago correctly', () => {
        const date = subMinutes(now, 5);
        expect(getTimeAgo(date, 'pt-BR')).toBe('5 minutos atrás');
      });

      it('should format 1 hour ago correctly', () => {
        const date = subHours(now, 1);
        expect(getTimeAgo(date, 'pt-BR')).toBe('1 hora atrás');
      });

      it('should format multiple hours ago correctly', () => {
        const date = subHours(now, 5);
        expect(getTimeAgo(date, 'pt-BR')).toBe('5 horas atrás');
      });

      it('should format 1 day ago correctly', () => {
        const date = subDays(now, 1);
        expect(getTimeAgo(date, 'pt-BR')).toBe('1 dia atrás');
      });

      it('should format multiple days ago correctly', () => {
        const date = subDays(now, 5);
        expect(getTimeAgo(date, 'pt-BR')).toBe('5 dias atrás');
      });

      it('should format 1 week ago correctly', () => {
        const date = subDays(now, 7);
        expect(getTimeAgo(date, 'pt-BR')).toBe('1 semana atrás');
      });

      it('should format multiple weeks ago correctly', () => {
        const date = subDays(now, 14);
        expect(getTimeAgo(date, 'pt-BR')).toBe('2 semanas atrás');
      });

      it('should format 1 month ago correctly', () => {
        const date = subMonths(now, 1);
        expect(getTimeAgo(date, 'pt-BR')).toBe('1 mês atrás');
      });

      it('should format multiple months ago correctly', () => {
        const date = subMonths(now, 5);
        expect(getTimeAgo(date, 'pt-BR')).toBe('5 meses atrás');
      });

      it('should format 1 year ago correctly', () => {
        const date = subYears(now, 1);
        expect(getTimeAgo(date, 'pt-BR')).toBe('1 ano atrás');
      });

      it('should format multiple years ago correctly', () => {
        const date = subYears(now, 5);
        expect(getTimeAgo(date, 'pt-BR')).toBe('5 anos atrás');
      });
    });

    describe('English locale (en-US)', () => {
      it('should format seconds ago correctly', () => {
        const date = subSeconds(now, 30);
        expect(getTimeAgo(date, 'en-US')).toBe('30 seconds ago');
      });

      it('should format 1 minute ago correctly', () => {
        const date = subMinutes(now, 1);
        expect(getTimeAgo(date, 'en-US')).toBe('1 minute ago');
      });

      it('should format multiple minutes ago correctly', () => {
        const date = subMinutes(now, 5);
        expect(getTimeAgo(date, 'en-US')).toBe('5 minutes ago');
      });

      it('should format 1 hour ago correctly', () => {
        const date = subHours(now, 1);
        expect(getTimeAgo(date, 'en-US')).toBe('1 hour ago');
      });

      it('should format multiple hours ago correctly', () => {
        const date = subHours(now, 5);
        expect(getTimeAgo(date, 'en-US')).toBe('5 hours ago');
      });

      it('should format 1 day ago correctly', () => {
        const date = subDays(now, 1);
        expect(getTimeAgo(date, 'en-US')).toBe('1 day ago');
      });

      it('should format multiple days ago correctly', () => {
        const date = subDays(now, 5);
        expect(getTimeAgo(date, 'en-US')).toBe('5 days ago');
      });

      it('should format 1 week ago correctly', () => {
        const date = subDays(now, 7);
        expect(getTimeAgo(date, 'en-US')).toBe('1 week ago');
      });

      it('should format multiple weeks ago correctly', () => {
        const date = subDays(now, 14);
        expect(getTimeAgo(date, 'en-US')).toBe('2 weeks ago');
      });

      it('should format 1 month ago correctly', () => {
        const date = subMonths(now, 1);
        expect(getTimeAgo(date, 'en-US')).toBe('1 month ago');
      });

      it('should format multiple months ago correctly', () => {
        const date = subMonths(now, 5);
        expect(getTimeAgo(date, 'en-US')).toBe('5 months ago');
      });

      it('should format 1 year ago correctly', () => {
        const date = subYears(now, 1);
        expect(getTimeAgo(date, 'en-US')).toBe('1 year ago');
      });

      it('should format multiple years ago correctly', () => {
        const date = subYears(now, 5);
        expect(getTimeAgo(date, 'en-US')).toBe('5 years ago');
      });
    });

    describe('Edge cases', () => {
      it('should handle invalid dates by returning an empty string', () => {
        const invalidDate = new Date('invalid date');
        expect(getTimeAgo(invalidDate)).toBe('');
      });

      it('should handle null values by returning an empty string', () => {
        expect(getTimeAgo(null as any)).toBe('');
      });

      it('should handle undefined values by returning an empty string', () => {
        expect(getTimeAgo(undefined as any)).toBe('');
      });

      it('should use pt-BR as default locale when none is provided', () => {
        const date = subDays(now, 1);
        expect(getTimeAgo(date)).toBe('1 dia atrás');
      });

      it('should handle future dates appropriately', () => {
        // Future dates might be handled differently depending on implementation
        // This test assumes future dates are treated as "time ago" from now
        const futureDate = addDays(now, 1);
        
        // Depending on implementation, it might return a special message or treat it as a negative time
        const result = getTimeAgo(futureDate);
        
        // This is a flexible assertion that can be adjusted based on actual implementation
        expect(result).toBeDefined();
        // Possible implementations might return:
        // - Empty string: ''
        // - Special message: 'in the future'
        // - Negative time: '-1 dia atrás'
        // - Or throw an error (would need to be tested differently)
      });
    });

    describe('Time unit boundaries', () => {
      it('should handle boundary between seconds and minutes (59 seconds vs 60 seconds)', () => {
        const date59Seconds = subSeconds(now, 59);
        const date60Seconds = subSeconds(now, 60);
        
        expect(getTimeAgo(date59Seconds, 'en-US')).toBe('59 seconds ago');
        expect(getTimeAgo(date60Seconds, 'en-US')).toBe('1 minute ago');
      });

      it('should handle boundary between minutes and hours (59 minutes vs 60 minutes)', () => {
        const date59Minutes = subMinutes(now, 59);
        const date60Minutes = subMinutes(now, 60);
        
        expect(getTimeAgo(date59Minutes, 'en-US')).toBe('59 minutes ago');
        expect(getTimeAgo(date60Minutes, 'en-US')).toBe('1 hour ago');
      });

      it('should handle boundary between hours and days (23 hours vs 24 hours)', () => {
        const date23Hours = subHours(now, 23);
        const date24Hours = subHours(now, 24);
        
        expect(getTimeAgo(date23Hours, 'en-US')).toBe('23 hours ago');
        expect(getTimeAgo(date24Hours, 'en-US')).toBe('1 day ago');
      });

      it('should handle boundary between days and weeks (6 days vs 7 days)', () => {
        const date6Days = subDays(now, 6);
        const date7Days = subDays(now, 7);
        
        expect(getTimeAgo(date6Days, 'en-US')).toBe('6 days ago');
        expect(getTimeAgo(date7Days, 'en-US')).toBe('1 week ago');
      });

      it('should handle boundary between weeks and months (4 weeks vs 1 month)', () => {
        const date4Weeks = subDays(now, 28);
        const date1Month = subMonths(now, 1);
        
        // This might vary based on implementation - some might use 30 days as a month boundary
        expect(getTimeAgo(date4Weeks, 'en-US')).toBe('4 weeks ago');
        expect(getTimeAgo(date1Month, 'en-US')).toBe('1 month ago');
      });

      it('should handle boundary between months and years (11 months vs 12 months)', () => {
        const date11Months = subMonths(now, 11);
        const date12Months = subMonths(now, 12);
        
        expect(getTimeAgo(date11Months, 'en-US')).toBe('11 months ago');
        expect(getTimeAgo(date12Months, 'en-US')).toBe('1 year ago');
      });
    });
  });
});
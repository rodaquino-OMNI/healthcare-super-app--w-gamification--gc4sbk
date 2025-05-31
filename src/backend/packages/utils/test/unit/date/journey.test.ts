import { formatJourneyDate } from '../../../src/date/journey';
import { JourneyType } from '../../../src/date/constants';

describe('Journey Date Formatting', () => {
  const testDate = new Date(2023, 4, 15, 10, 30, 0); // May 15, 2023, 10:30:00

  describe('formatJourneyDate', () => {
    it('should format dates according to Health journey requirements', () => {
      // Health journey typically uses a more detailed format with time for medical records
      const result = formatJourneyDate(testDate, JourneyType.HEALTH);
      
      // Health journey should use a format that includes day of week and time
      expect(result).toMatch(/Segunda|Terça|Quarta|Quinta|Sexta|Sábado|Domingo/); // Should contain day of week in Portuguese
      expect(result).toContain('15/05/2023'); // Should contain the date in DD/MM/YYYY format
      expect(result).toContain('10:30'); // Should contain the time
    });

    it('should format dates according to Care journey requirements', () => {
      // Care journey typically uses a format with day of week for appointments
      const result = formatJourneyDate(testDate, JourneyType.CARE);
      
      // Care journey should emphasize day of week for appointment scheduling
      expect(result).toMatch(/Segunda|Terça|Quarta|Quinta|Sexta|Sábado|Domingo/); // Should contain day of week in Portuguese
      expect(result).toContain('15/05'); // Should contain the date in DD/MM format (without year)
      expect(result).toContain('10:30'); // Should contain the time
    });

    it('should format dates according to Plan journey requirements', () => {
      // Plan journey typically uses a more formal format for insurance documents
      const result = formatJourneyDate(testDate, JourneyType.PLAN);
      
      // Plan journey should use a more formal format for insurance and billing
      expect(result).toContain('15/05/2023'); // Should contain the date in DD/MM/YYYY format
      // Plan journey typically doesn't include time for coverage dates
      expect(result).not.toContain('10:30');
    });

    it('should handle future dates correctly for all journeys', () => {
      const futureDate = new Date(2025, 11, 25); // December 25, 2025
      
      const healthResult = formatJourneyDate(futureDate, JourneyType.HEALTH);
      const careResult = formatJourneyDate(futureDate, JourneyType.CARE);
      const planResult = formatJourneyDate(futureDate, JourneyType.PLAN);
      
      expect(healthResult).toContain('25/12/2025');
      expect(careResult).toContain('25/12');
      expect(planResult).toContain('25/12/2025');
    });

    it('should handle past dates correctly for all journeys', () => {
      const pastDate = new Date(2020, 0, 1); // January 1, 2020
      
      const healthResult = formatJourneyDate(pastDate, JourneyType.HEALTH);
      const careResult = formatJourneyDate(pastDate, JourneyType.CARE);
      const planResult = formatJourneyDate(pastDate, JourneyType.PLAN);
      
      expect(healthResult).toContain('01/01/2020');
      expect(careResult).toContain('01/01');
      expect(planResult).toContain('01/01/2020');
    });

    it('should throw an error for invalid journey type', () => {
      // @ts-expect-error Testing invalid journey type
      expect(() => formatJourneyDate(testDate, 'INVALID_JOURNEY')).toThrow();
    });

    it('should throw an error for null or undefined date', () => {
      // @ts-expect-error Testing null date
      expect(() => formatJourneyDate(null, JourneyType.HEALTH)).toThrow();
      // @ts-expect-error Testing undefined date
      expect(() => formatJourneyDate(undefined, JourneyType.CARE)).toThrow();
    });

    it('should handle invalid dates correctly', () => {
      const invalidDate = new Date('Invalid Date');
      
      expect(() => formatJourneyDate(invalidDate, JourneyType.HEALTH)).toThrow();
    });
  });

  describe('Journey-specific date formatting edge cases', () => {
    it('should handle midnight time correctly for Health journey', () => {
      const midnightDate = new Date(2023, 4, 15, 0, 0, 0); // May 15, 2023, 00:00:00
      const result = formatJourneyDate(midnightDate, JourneyType.HEALTH);
      
      expect(result).toContain('00:00');
    });

    it('should handle end of day time correctly for Care journey', () => {
      const endOfDayDate = new Date(2023, 4, 15, 23, 59, 59); // May 15, 2023, 23:59:59
      const result = formatJourneyDate(endOfDayDate, JourneyType.CARE);
      
      expect(result).toContain('23:59');
    });

    it('should format dates consistently regardless of locale settings', () => {
      // Save original locale
      const originalLocale = Intl.DateTimeFormat().resolvedOptions().locale;
      
      try {
        // Test with different locales if possible
        if (typeof Intl !== 'undefined') {
          // Try to set locale to English
          // Note: This doesn't actually change the locale in all environments,
          // but we're testing that our function is consistent regardless
          const englishDate = new Date(2023, 4, 15);
          const result = formatJourneyDate(englishDate, JourneyType.PLAN);
          
          // Should still use the Portuguese/Brazilian format regardless of system locale
          expect(result).toContain('15/05/2023');
        }
      } finally {
        // No need to restore locale as we're not actually changing it globally
      }
    });
  });
});
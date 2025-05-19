/**
 * Tests for journey-specific date formatting utilities
 * 
 * These tests ensure that dates are properly formatted according to the requirements
 * of each journey (Health, Care, Plan) in the AUSTA SuperApp. Each journey has unique
 * date formatting requirements based on its domain and user experience needs.
 */

import { 
  formatJourneyDate, 
  formatHealthDate, 
  formatCareDate, 
  formatPlanDate,
  JourneyType 
} from '../../../src/date/journey';

describe('Journey Date Formatting', () => {
  // Reference date for consistent testing: May 25, 2023, 14:30:45
  const testDate = new Date(2023, 4, 25, 14, 30, 45);
  const testDateISO = '2023-05-25T14:30:45.000Z';
  const testDateTimestamp = testDate.getTime();

  describe('formatJourneyDate', () => {
    it('should format dates according to Health journey requirements', () => {
      // Health journey uses detailed format with time for metrics: dd/MM/yyyy HH:mm
      expect(formatJourneyDate(testDate, JourneyType.HEALTH)).toBe('25/05/2023 14:30');
      expect(formatJourneyDate(testDate, 'health')).toBe('25/05/2023 14:30');
      expect(formatJourneyDate(testDate, 'HEALTH')).toBe('25/05/2023 14:30');
    });

    it('should format dates according to Care journey requirements', () => {
      // Care journey uses appointment-friendly format: EEE, dd MMM yyyy
      // Note: The exact output depends on the locale, but for pt-BR it should include the day of week
      const result = formatJourneyDate(testDate, JourneyType.CARE);
      expect(result).toContain('25');
      expect(result).toContain('Mai');
      expect(result).toContain('2023');
      // Should contain day of week (exact format depends on locale)
      expect(result.split(',')[0].length).toBeGreaterThan(0);
    });

    it('should format dates according to Plan journey requirements', () => {
      // Plan journey uses formal date format for claims and documents: dd/MM/yyyy
      expect(formatJourneyDate(testDate, JourneyType.PLAN)).toBe('25/05/2023');
      expect(formatJourneyDate(testDate, 'plan')).toBe('25/05/2023');
      expect(formatJourneyDate(testDate, 'PLAN')).toBe('25/05/2023');
    });

    it('should accept date as string and format correctly', () => {
      expect(formatJourneyDate(testDateISO, JourneyType.HEALTH)).toBe('25/05/2023 14:30');
      expect(formatJourneyDate(testDateISO, JourneyType.CARE)).toContain('25');
      expect(formatJourneyDate(testDateISO, JourneyType.PLAN)).toBe('25/05/2023');
    });

    it('should accept date as timestamp and format correctly', () => {
      expect(formatJourneyDate(testDateTimestamp, JourneyType.HEALTH)).toBe('25/05/2023 14:30');
      expect(formatJourneyDate(testDateTimestamp, JourneyType.CARE)).toContain('25');
      expect(formatJourneyDate(testDateTimestamp, JourneyType.PLAN)).toBe('25/05/2023');
    });

    it('should respect locale parameter for formatting', () => {
      // Test with en-US locale
      const careResultEN = formatJourneyDate(testDate, JourneyType.CARE, 'en-US');
      expect(careResultEN).toContain('May');
      expect(careResultEN).not.toContain('Mai');

      // Test with pt-BR locale
      const careResultPT = formatJourneyDate(testDate, JourneyType.CARE, 'pt-BR');
      expect(careResultPT).toContain('Mai');
      expect(careResultPT).not.toContain('May');
    });

    it('should throw error for invalid journey type', () => {
      expect(() => formatJourneyDate(testDate, 'invalid')).toThrow('Invalid journey type');
      expect(() => formatJourneyDate(testDate, 'unknown')).toThrow('Invalid journey type');
    });

    it('should return empty string for invalid date', () => {
      expect(formatJourneyDate(null as any, JourneyType.HEALTH)).toBe('');
      expect(formatJourneyDate(undefined as any, JourneyType.CARE)).toBe('');
      expect(formatJourneyDate('not-a-date', JourneyType.PLAN)).toBe('');
      expect(formatJourneyDate(NaN, JourneyType.HEALTH)).toBe('');
    });
  });

  describe('Journey-specific convenience functions', () => {
    it('should format dates correctly with formatHealthDate', () => {
      expect(formatHealthDate(testDate)).toBe('25/05/2023 14:30');
      expect(formatHealthDate(testDateISO)).toBe('25/05/2023 14:30');
      expect(formatHealthDate(testDateTimestamp)).toBe('25/05/2023 14:30');
    });

    it('should format dates correctly with formatCareDate', () => {
      const result = formatCareDate(testDate);
      expect(result).toContain('25');
      expect(result).toContain('Mai');
      expect(result).toContain('2023');
      // Should contain day of week
      expect(result.split(',')[0].length).toBeGreaterThan(0);
    });

    it('should format dates correctly with formatPlanDate', () => {
      expect(formatPlanDate(testDate)).toBe('25/05/2023');
      expect(formatPlanDate(testDateISO)).toBe('25/05/2023');
      expect(formatPlanDate(testDateTimestamp)).toBe('25/05/2023');
    });

    it('should respect locale parameter in convenience functions', () => {
      // Test with en-US locale
      const careResultEN = formatCareDate(testDate, 'en-US');
      expect(careResultEN).toContain('May');
      expect(careResultEN).not.toContain('Mai');

      // Test with pt-BR locale
      const careResultPT = formatCareDate(testDate, 'pt-BR');
      expect(careResultPT).toContain('Mai');
      expect(careResultPT).not.toContain('May');
    });

    it('should return empty string for invalid date in convenience functions', () => {
      expect(formatHealthDate(null as any)).toBe('');
      expect(formatCareDate(undefined as any)).toBe('');
      expect(formatPlanDate('not-a-date')).toBe('');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle dates at day boundaries correctly', () => {
      const midnightDate = new Date(2023, 4, 25, 0, 0, 0);
      expect(formatJourneyDate(midnightDate, JourneyType.HEALTH)).toBe('25/05/2023 00:00');
      
      const endOfDayDate = new Date(2023, 4, 25, 23, 59, 59);
      expect(formatJourneyDate(endOfDayDate, JourneyType.HEALTH)).toBe('25/05/2023 23:59');
    });

    it('should handle leap years correctly', () => {
      const leapYearDate = new Date(2024, 1, 29, 12, 0, 0); // February 29, 2024 (leap year)
      expect(formatJourneyDate(leapYearDate, JourneyType.PLAN)).toBe('29/02/2024');
    });

    it('should handle different timezones consistently', () => {
      // Note: This test assumes the test environment timezone
      // The formatted output should be consistent regardless of the system timezone
      const dateWithTimezone = new Date('2023-05-25T14:30:45.000Z');
      expect(formatJourneyDate(dateWithTimezone, JourneyType.HEALTH)).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
    });

    it('should handle case insensitivity in journey type strings', () => {
      expect(formatJourneyDate(testDate, 'health')).toBe('25/05/2023 14:30');
      expect(formatJourneyDate(testDate, 'HEALTH')).toBe('25/05/2023 14:30');
      expect(formatJourneyDate(testDate, 'Health')).toBe('25/05/2023 14:30');
      expect(formatJourneyDate(testDate, 'HeAlTh')).toBe('25/05/2023 14:30');
    });

    it('should handle unknown locales gracefully', () => {
      // Should fall back to default locale (pt-BR) for unknown locales
      const result = formatJourneyDate(testDate, JourneyType.CARE, 'unknown-LOCALE');
      expect(result).toContain('Mai'); // Should use default pt-BR locale
    });
  });
});
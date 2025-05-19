/**
 * Tests for journey-specific date utility re-exports
 * 
 * This file tests the journey-specific date utility re-exports to ensure that
 * functions like formatJourneyDate are properly exposed through the journey module.
 * This validation ensures that journey-specific date formatting is consistently
 * available across all services.
 */

import { formatJourneyDate, JourneyType } from '../journey';

describe('Journey Date Utilities', () => {
  const testDate = new Date(2023, 4, 25, 14, 30); // May 25, 2023, 14:30

  describe('formatJourneyDate', () => {
    it('should be properly exported', () => {
      expect(formatJourneyDate).toBeDefined();
      expect(typeof formatJourneyDate).toBe('function');
    });

    it('should format dates for health journey correctly', () => {
      // Health journey uses detailed format with time for metrics (dd/MM/yyyy HH:mm)
      const formattedDate = formatJourneyDate(testDate, 'health');
      expect(formattedDate).toBe('25/05/2023 14:30');
    });

    it('should format dates for care journey correctly', () => {
      // Care journey uses appointment-friendly format (EEE, dd MMM yyyy)
      const formattedDate = formatJourneyDate(testDate, 'care');
      expect(formattedDate).toBe('qui, 25 mai 2023');
    });

    it('should format dates for plan journey correctly', () => {
      // Plan journey uses formal date format for claims and documents (dd/MM/yyyy)
      const formattedDate = formatJourneyDate(testDate, 'plan');
      expect(formattedDate).toBe('25/05/2023');
    });

    it('should accept journey type as string (case insensitive)', () => {
      const healthFormatted = formatJourneyDate(testDate, 'HEALTH');
      const careFormatted = formatJourneyDate(testDate, 'Care');
      const planFormatted = formatJourneyDate(testDate, 'Plan');

      expect(healthFormatted).toBe('25/05/2023 14:30');
      expect(careFormatted).toBe('qui, 25 mai 2023');
      expect(planFormatted).toBe('25/05/2023');
    });

    it('should accept journey type as JourneyType enum', () => {
      const healthFormatted = formatJourneyDate(testDate, JourneyType.health);
      const careFormatted = formatJourneyDate(testDate, JourneyType.care);
      const planFormatted = formatJourneyDate(testDate, JourneyType.plan);

      expect(healthFormatted).toBe('25/05/2023 14:30');
      expect(careFormatted).toBe('qui, 25 mai 2023');
      expect(planFormatted).toBe('25/05/2023');
    });

    it('should support English locale', () => {
      const healthFormatted = formatJourneyDate(testDate, 'health', 'en-US');
      const careFormatted = formatJourneyDate(testDate, 'care', 'en-US');
      const planFormatted = formatJourneyDate(testDate, 'plan', 'en-US');

      expect(healthFormatted).toBe('05/25/2023 14:30');
      expect(careFormatted).toBe('Thu, 25 May 2023');
      expect(planFormatted).toBe('05/25/2023');
    });

    it('should handle string date input', () => {
      const dateString = '2023-05-25T14:30:00';
      const formattedDate = formatJourneyDate(dateString, 'health');
      expect(formattedDate).toBe('25/05/2023 14:30');
    });

    it('should handle timestamp date input', () => {
      const timestamp = testDate.getTime();
      const formattedDate = formatJourneyDate(timestamp, 'health');
      expect(formattedDate).toBe('25/05/2023 14:30');
    });

    it('should return empty string for invalid date', () => {
      const invalidDate = 'not-a-date';
      const formattedDate = formatJourneyDate(invalidDate, 'health');
      expect(formattedDate).toBe('');
    });

    it('should throw error for invalid journey type', () => {
      expect(() => {
        formatJourneyDate(testDate, 'invalid-journey');
      }).toThrow('Invalid journey type provided');
    });
  });
});
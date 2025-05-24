import { formatJourneyDate } from '../journey';

describe('Journey Date Utils', () => {
  const testDate = new Date('2023-05-15T14:30:00');

  describe('formatJourneyDate', () => {
    it('should be exported correctly', () => {
      expect(formatJourneyDate).toBeDefined();
      expect(typeof formatJourneyDate).toBe('function');
    });

    it('should format dates for health journey with time (dd/MM/yyyy HH:mm)', () => {
      const formattedDate = formatJourneyDate(testDate, 'health');
      expect(formattedDate).toBe('15/05/2023 14:30');
    });

    it('should format dates for care journey with day of week (EEE, dd MMM yyyy)', () => {
      const formattedDate = formatJourneyDate(testDate, 'care');
      // Monday in Portuguese is 'seg'
      expect(formattedDate).toBe('seg, 15 mai 2023');
    });

    it('should format dates for plan journey formally (dd/MM/yyyy)', () => {
      const formattedDate = formatJourneyDate(testDate, 'plan');
      expect(formattedDate).toBe('15/05/2023');
    });

    it('should use default format for unknown journey types', () => {
      const formattedDate = formatJourneyDate(testDate, 'unknown');
      expect(formattedDate).toBe('15/05/2023');
    });

    it('should handle string date inputs', () => {
      const dateString = '2023-05-15T14:30:00';
      const formattedDate = formatJourneyDate(dateString, 'health');
      expect(formattedDate).toBe('15/05/2023 14:30');
    });

    it('should handle timestamp date inputs', () => {
      const timestamp = testDate.getTime();
      const formattedDate = formatJourneyDate(timestamp, 'health');
      expect(formattedDate).toBe('15/05/2023 14:30');
    });

    it('should return empty string for invalid dates', () => {
      const formattedDate = formatJourneyDate('invalid-date', 'health');
      expect(formattedDate).toBe('');
    });

    it('should support English locale', () => {
      const formattedDate = formatJourneyDate(testDate, 'care', 'en-US');
      // Monday in English is 'Mon'
      expect(formattedDate).toBe('Mon, 15 May 2023');
    });

    it('should preserve the three distinct user journeys formatting', () => {
      // Health journey - "Minha Saúde"
      const healthFormatted = formatJourneyDate(testDate, 'health');
      expect(healthFormatted).toBe('15/05/2023 14:30');

      // Care journey - "Cuidar-me Agora"
      const careFormatted = formatJourneyDate(testDate, 'care');
      expect(careFormatted).toBe('seg, 15 mai 2023');

      // Plan journey - "Meu Plano & Benefícios"
      const planFormatted = formatJourneyDate(testDate, 'plan');
      expect(planFormatted).toBe('15/05/2023');
    });
  });
});
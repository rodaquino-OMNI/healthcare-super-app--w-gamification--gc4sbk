import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  isDateObject,
  isValidDate,
  normalizeDate,
  isDateInRange,
  isFutureDate,
  isPastDate,
  isBrazilianHoliday,
  isBusinessDay,
  isValidJourneyDate,
  isValidJourneyDateRange,
  isValidDateInTimezone,
  getNextBusinessDay,
  isWithinBusinessHours
} from '../../../src/validation/date.validator';

describe('Date Validation Utilities', () => {
  let referenceDate: Date;

  beforeEach(() => {
    // Use a fixed reference date for consistent testing
    referenceDate = new Date(2023, 5, 15, 12, 0, 0); // June 15, 2023, 12:00:00
    jest.useFakeTimers();
    jest.setSystemTime(referenceDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('isDateObject', () => {
    it('should return true for valid Date objects', () => {
      expect(isDateObject(new Date())).toBe(true);
      expect(isDateObject(new Date('2023-01-01'))).toBe(true);
    });

    it('should return false for invalid Date objects', () => {
      expect(isDateObject(new Date('invalid-date'))).toBe(false);
    });

    it('should return false for non-Date values', () => {
      expect(isDateObject('2023-01-01')).toBe(false);
      expect(isDateObject(123456789)).toBe(false);
      expect(isDateObject({})).toBe(false);
      expect(isDateObject(null)).toBe(false);
      expect(isDateObject(undefined)).toBe(false);
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid Date objects', () => {
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate(new Date('2023-01-01'))).toBe(true);
    });

    it('should return true for valid date strings', () => {
      expect(isValidDate('2023-01-01')).toBe(true);
      expect(isValidDate('2023-01-01T12:00:00Z')).toBe(true);
    });

    it('should return true for valid timestamps', () => {
      expect(isValidDate(Date.now())).toBe(true);
      expect(isValidDate(new Date('2023-01-01').getTime())).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(isValidDate(new Date('invalid-date'))).toBe(false);
      expect(isValidDate('invalid-date')).toBe(false);
      expect(isValidDate({})).toBe(false);
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
    });
  });

  describe('normalizeDate', () => {
    it('should return a Date object for valid Date input', () => {
      const date = new Date('2023-01-01');
      const result = normalizeDate(date);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(date.getTime());
    });

    it('should convert valid string to Date object', () => {
      const result = normalizeDate('2023-01-01');
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString().startsWith('2023-01-01')).toBe(true);
    });

    it('should convert valid timestamp to Date object', () => {
      const timestamp = new Date('2023-01-01').getTime();
      const result = normalizeDate(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(timestamp);
    });

    it('should return null for invalid inputs', () => {
      expect(normalizeDate('invalid-date')).toBeNull();
      expect(normalizeDate(null as any)).toBeNull();
      expect(normalizeDate(undefined as any)).toBeNull();
      expect(normalizeDate({} as any)).toBeNull();
    });
  });

  describe('isDateInRange', () => {
    let startDate: Date;
    let endDate: Date;
    let middleDate: Date;
    let beforeStartDate: Date;
    let afterEndDate: Date;

    beforeEach(() => {
      startDate = new Date(2023, 0, 1); // Jan 1, 2023
      endDate = new Date(2023, 0, 31); // Jan 31, 2023
      middleDate = new Date(2023, 0, 15); // Jan 15, 2023
      beforeStartDate = new Date(2022, 11, 31); // Dec 31, 2022
      afterEndDate = new Date(2023, 1, 1); // Feb 1, 2023
    });

    it('should return true for dates within range (inclusive boundaries)', () => {
      expect(isDateInRange(middleDate, startDate, endDate)).toBe(true);
      expect(isDateInRange(startDate, startDate, endDate)).toBe(true);
      expect(isDateInRange(endDate, startDate, endDate)).toBe(true);
    });

    it('should return false for dates outside range (inclusive boundaries)', () => {
      expect(isDateInRange(beforeStartDate, startDate, endDate)).toBe(false);
      expect(isDateInRange(afterEndDate, startDate, endDate)).toBe(false);
    });

    it('should return true for dates within range (exclusive boundaries)', () => {
      expect(isDateInRange(middleDate, startDate, endDate, { inclusive: false })).toBe(true);
    });

    it('should return false for boundary dates with exclusive boundaries', () => {
      expect(isDateInRange(startDate, startDate, endDate, { inclusive: false })).toBe(false);
      expect(isDateInRange(endDate, startDate, endDate, { inclusive: false })).toBe(false);
    });

    it('should handle string date inputs', () => {
      expect(isDateInRange('2023-01-15', '2023-01-01', '2023-01-31')).toBe(true);
      expect(isDateInRange('2022-12-31', '2023-01-01', '2023-01-31')).toBe(false);
    });

    it('should handle timestamp inputs', () => {
      expect(isDateInRange(middleDate.getTime(), startDate.getTime(), endDate.getTime())).toBe(true);
      expect(isDateInRange(beforeStartDate.getTime(), startDate.getTime(), endDate.getTime())).toBe(false);
    });

    it('should return false for invalid date inputs', () => {
      expect(isDateInRange('invalid', startDate, endDate)).toBe(false);
      expect(isDateInRange(middleDate, 'invalid', endDate)).toBe(false);
      expect(isDateInRange(middleDate, startDate, 'invalid')).toBe(false);
      expect(isDateInRange(null as any, startDate, endDate)).toBe(false);
    });
  });

  describe('isFutureDate', () => {
    it('should return true for dates in the future', () => {
      const futureDate = new Date(referenceDate);
      futureDate.setDate(futureDate.getDate() + 1);
      expect(isFutureDate(futureDate)).toBe(true);
    });

    it('should return false for dates in the past', () => {
      const pastDate = new Date(referenceDate);
      pastDate.setDate(pastDate.getDate() - 1);
      expect(isFutureDate(pastDate)).toBe(false);
    });

    it('should return false for the current date', () => {
      expect(isFutureDate(referenceDate)).toBe(false);
    });

    it('should respect threshold in days', () => {
      const slightlyFutureDate = new Date(referenceDate);
      slightlyFutureDate.setDate(slightlyFutureDate.getDate() + 2);
      
      const farFutureDate = new Date(referenceDate);
      farFutureDate.setDate(farFutureDate.getDate() + 10);
      
      expect(isFutureDate(slightlyFutureDate, { threshold: 5, thresholdUnit: 'days' })).toBe(false);
      expect(isFutureDate(farFutureDate, { threshold: 5, thresholdUnit: 'days' })).toBe(true);
    });

    it('should respect threshold in months', () => {
      const slightlyFutureDate = new Date(referenceDate);
      slightlyFutureDate.setMonth(slightlyFutureDate.getMonth() + 1);
      
      const farFutureDate = new Date(referenceDate);
      farFutureDate.setMonth(farFutureDate.getMonth() + 3);
      
      expect(isFutureDate(slightlyFutureDate, { threshold: 2, thresholdUnit: 'months' })).toBe(false);
      expect(isFutureDate(farFutureDate, { threshold: 2, thresholdUnit: 'months' })).toBe(true);
    });

    it('should respect threshold in years', () => {
      const slightlyFutureDate = new Date(referenceDate);
      slightlyFutureDate.setFullYear(slightlyFutureDate.getFullYear() + 1);
      
      const farFutureDate = new Date(referenceDate);
      farFutureDate.setFullYear(farFutureDate.getFullYear() + 3);
      
      expect(isFutureDate(slightlyFutureDate, { threshold: 2, thresholdUnit: 'years' })).toBe(false);
      expect(isFutureDate(farFutureDate, { threshold: 2, thresholdUnit: 'years' })).toBe(true);
    });

    it('should use custom reference date if provided', () => {
      const customReferenceDate = new Date(2022, 0, 1); // Jan 1, 2022
      const testDate = new Date(2022, 5, 1); // June 1, 2022
      
      expect(isFutureDate(testDate, { referenceDate: customReferenceDate })).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(isFutureDate('invalid-date')).toBe(false);
      expect(isFutureDate(null as any)).toBe(false);
      expect(isFutureDate(undefined as any)).toBe(false);
    });
  });

  describe('isPastDate', () => {
    it('should return true for dates in the past', () => {
      const pastDate = new Date(referenceDate);
      pastDate.setDate(pastDate.getDate() - 1);
      expect(isPastDate(pastDate)).toBe(true);
    });

    it('should return false for dates in the future', () => {
      const futureDate = new Date(referenceDate);
      futureDate.setDate(futureDate.getDate() + 1);
      expect(isPastDate(futureDate)).toBe(false);
    });

    it('should return false for the current date', () => {
      expect(isPastDate(referenceDate)).toBe(false);
    });

    it('should respect threshold in days', () => {
      const slightlyPastDate = new Date(referenceDate);
      slightlyPastDate.setDate(slightlyPastDate.getDate() - 2);
      
      const farPastDate = new Date(referenceDate);
      farPastDate.setDate(farPastDate.getDate() - 10);
      
      expect(isPastDate(slightlyPastDate, { threshold: 5, thresholdUnit: 'days' })).toBe(false);
      expect(isPastDate(farPastDate, { threshold: 5, thresholdUnit: 'days' })).toBe(true);
    });

    it('should respect threshold in months', () => {
      const slightlyPastDate = new Date(referenceDate);
      slightlyPastDate.setMonth(slightlyPastDate.getMonth() - 1);
      
      const farPastDate = new Date(referenceDate);
      farPastDate.setMonth(farPastDate.getMonth() - 3);
      
      expect(isPastDate(slightlyPastDate, { threshold: 2, thresholdUnit: 'months' })).toBe(false);
      expect(isPastDate(farPastDate, { threshold: 2, thresholdUnit: 'months' })).toBe(true);
    });

    it('should respect threshold in years', () => {
      const slightlyPastDate = new Date(referenceDate);
      slightlyPastDate.setFullYear(slightlyPastDate.getFullYear() - 1);
      
      const farPastDate = new Date(referenceDate);
      farPastDate.setFullYear(farPastDate.getFullYear() - 3);
      
      expect(isPastDate(slightlyPastDate, { threshold: 2, thresholdUnit: 'years' })).toBe(false);
      expect(isPastDate(farPastDate, { threshold: 2, thresholdUnit: 'years' })).toBe(true);
    });

    it('should use custom reference date if provided', () => {
      const customReferenceDate = new Date(2023, 0, 1); // Jan 1, 2023
      const testDate = new Date(2022, 5, 1); // June 1, 2022
      
      expect(isPastDate(testDate, { referenceDate: customReferenceDate })).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(isPastDate('invalid-date')).toBe(false);
      expect(isPastDate(null as any)).toBe(false);
      expect(isPastDate(undefined as any)).toBe(false);
    });
  });

  describe('isBrazilianHoliday', () => {
    it('should return true for Brazilian holidays in 2023', () => {
      expect(isBrazilianHoliday(new Date(2023, 0, 1))).toBe(true); // New Year's Day
      expect(isBrazilianHoliday(new Date(2023, 1, 20))).toBe(true); // Carnival Monday
      expect(isBrazilianHoliday(new Date(2023, 1, 21))).toBe(true); // Carnival Tuesday
      expect(isBrazilianHoliday(new Date(2023, 3, 7))).toBe(true); // Good Friday
      expect(isBrazilianHoliday(new Date(2023, 11, 25))).toBe(true); // Christmas
    });

    it('should return true for Brazilian holidays in 2024', () => {
      expect(isBrazilianHoliday(new Date(2024, 0, 1))).toBe(true); // New Year's Day
      expect(isBrazilianHoliday(new Date(2024, 1, 12))).toBe(true); // Carnival Monday
      expect(isBrazilianHoliday(new Date(2024, 1, 13))).toBe(true); // Carnival Tuesday
      expect(isBrazilianHoliday(new Date(2024, 10, 20))).toBe(true); // National Day of Zumbi and Black Consciousness
      expect(isBrazilianHoliday(new Date(2024, 11, 25))).toBe(true); // Christmas
    });

    it('should return false for non-holiday dates', () => {
      expect(isBrazilianHoliday(new Date(2023, 0, 2))).toBe(false); // Jan 2, 2023
      expect(isBrazilianHoliday(new Date(2023, 5, 15))).toBe(false); // June 15, 2023
      expect(isBrazilianHoliday(new Date(2024, 3, 1))).toBe(false); // April 1, 2024
    });

    it('should handle string date inputs', () => {
      expect(isBrazilianHoliday('2023-01-01')).toBe(true); // New Year's Day
      expect(isBrazilianHoliday('2023-06-15')).toBe(false); // Regular day
    });

    it('should handle timestamp inputs', () => {
      expect(isBrazilianHoliday(new Date(2023, 0, 1).getTime())).toBe(true); // New Year's Day
      expect(isBrazilianHoliday(new Date(2023, 5, 15).getTime())).toBe(false); // Regular day
    });

    it('should return false for invalid dates', () => {
      expect(isBrazilianHoliday('invalid-date')).toBe(false);
      expect(isBrazilianHoliday(null as any)).toBe(false);
      expect(isBrazilianHoliday(undefined as any)).toBe(false);
    });
  });

  describe('isBusinessDay', () => {
    it('should return false for weekends', () => {
      expect(isBusinessDay(new Date(2023, 5, 17))).toBe(false); // Saturday, June 17, 2023
      expect(isBusinessDay(new Date(2023, 5, 18))).toBe(false); // Sunday, June 18, 2023
    });

    it('should return false for Brazilian holidays', () => {
      expect(isBusinessDay(new Date(2023, 0, 1))).toBe(false); // New Year's Day
      expect(isBusinessDay(new Date(2023, 1, 20))).toBe(false); // Carnival Monday
      expect(isBusinessDay(new Date(2023, 11, 25))).toBe(false); // Christmas
    });

    it('should return true for regular business days', () => {
      expect(isBusinessDay(new Date(2023, 5, 15))).toBe(true); // Thursday, June 15, 2023
      expect(isBusinessDay(new Date(2023, 5, 16))).toBe(true); // Friday, June 16, 2023
    });

    it('should handle different country codes', () => {
      // For non-BR country codes, only weekends should be considered non-business days
      const brazilianHoliday = new Date(2023, 0, 1); // New Year's Day
      expect(isBusinessDay(brazilianHoliday, { countryCode: 'BR' })).toBe(false);
      expect(isBusinessDay(brazilianHoliday, { countryCode: 'US' })).toBe(true); // Only checks weekends
    });

    it('should handle timezone adjustments', () => {
      // Create a date that's a weekend in Brazil but might be a weekday in another timezone
      const saturdayInBrazil = new Date(2023, 5, 17, 10, 0, 0); // Saturday in Brazil
      
      expect(isBusinessDay(saturdayInBrazil, { timezone: 'America/Sao_Paulo' })).toBe(false);
      // Note: This test is simplified as timezone testing is complex and would require mocking
    });

    it('should handle string date inputs', () => {
      expect(isBusinessDay('2023-06-15')).toBe(true); // Thursday
      expect(isBusinessDay('2023-06-17')).toBe(false); // Saturday
    });

    it('should handle timestamp inputs', () => {
      expect(isBusinessDay(new Date(2023, 5, 15).getTime())).toBe(true); // Thursday
      expect(isBusinessDay(new Date(2023, 5, 17).getTime())).toBe(false); // Saturday
    });

    it('should return false for invalid dates', () => {
      expect(isBusinessDay('invalid-date')).toBe(false);
      expect(isBusinessDay(null as any)).toBe(false);
      expect(isBusinessDay(undefined as any)).toBe(false);
    });
  });

  describe('isValidJourneyDate', () => {
    it('should validate health journey dates', () => {
      // Health journey allows past dates but limits future dates
      const pastDate = new Date(2022, 0, 1); // Jan 1, 2022
      const nearFutureDate = new Date(referenceDate);
      nearFutureDate.setDate(nearFutureDate.getDate() + 10);
      const farFutureDate = new Date(referenceDate);
      farFutureDate.setDate(farFutureDate.getDate() + 100);
      
      expect(isValidJourneyDate(pastDate, 'health')).toBe(true);
      expect(isValidJourneyDate(nearFutureDate, 'health')).toBe(true);
      expect(isValidJourneyDate(farFutureDate, 'health', { maxFutureDays: 30 })).toBe(false);
    });

    it('should validate care journey dates', () => {
      // Care journey requires business days and limits both past and future
      const businessDay = new Date(2023, 5, 16); // Friday, June 16, 2023
      const weekend = new Date(2023, 5, 17); // Saturday, June 17, 2023
      const holiday = new Date(2023, 0, 1); // New Year's Day
      const farPastDate = new Date(2022, 0, 1); // Jan 1, 2022
      const farFutureDate = new Date(2024, 0, 1); // Jan 1, 2024
      
      expect(isValidJourneyDate(businessDay, 'care', { businessDaysOnly: true })).toBe(true);
      expect(isValidJourneyDate(weekend, 'care', { businessDaysOnly: true })).toBe(false);
      expect(isValidJourneyDate(holiday, 'care', { businessDaysOnly: true })).toBe(false);
      expect(isValidJourneyDate(farPastDate, 'care', { maxPastDays: 30 })).toBe(false);
      expect(isValidJourneyDate(farFutureDate, 'care', { maxFutureDays: 30 })).toBe(false);
    });

    it('should validate plan journey dates', () => {
      // Plan journey allows past dates but limits how far in the past
      const recentPastDate = new Date(referenceDate);
      recentPastDate.setDate(recentPastDate.getDate() - 10);
      const farPastDate = new Date(referenceDate);
      farPastDate.setDate(farPastDate.getDate() - 100);
      
      expect(isValidJourneyDate(recentPastDate, 'plan')).toBe(true);
      expect(isValidJourneyDate(farPastDate, 'plan', { maxPastDays: 30 })).toBe(false);
    });

    it('should handle timezone adjustments', () => {
      // Create a date that's a weekend in Brazil but might be a weekday in another timezone
      const saturdayInBrazil = new Date(2023, 5, 17, 10, 0, 0); // Saturday in Brazil
      
      expect(isValidJourneyDate(saturdayInBrazil, 'care', { 
        businessDaysOnly: true, 
        timezone: 'America/Sao_Paulo' 
      })).toBe(false);
      // Note: This test is simplified as timezone testing is complex and would require mocking
    });

    it('should handle string date inputs', () => {
      expect(isValidJourneyDate('2023-06-15', 'health')).toBe(true);
      expect(isValidJourneyDate('2023-06-17', 'care', { businessDaysOnly: true })).toBe(false); // Saturday
    });

    it('should return false for invalid dates', () => {
      expect(isValidJourneyDate('invalid-date', 'health')).toBe(false);
      expect(isValidJourneyDate(null as any, 'care')).toBe(false);
      expect(isValidJourneyDate(undefined as any, 'plan')).toBe(false);
    });
  });

  describe('isValidJourneyDateRange', () => {
    it('should validate that start date is before end date', () => {
      const startDate = new Date(2023, 0, 1); // Jan 1, 2023
      const endDate = new Date(2023, 0, 31); // Jan 31, 2023
      const reversedStartDate = new Date(2023, 1, 1); // Feb 1, 2023
      const reversedEndDate = new Date(2023, 0, 1); // Jan 1, 2023
      
      expect(isValidJourneyDateRange(startDate, endDate, 'health')).toBe(true);
      expect(isValidJourneyDateRange(reversedStartDate, reversedEndDate, 'health')).toBe(false);
    });

    it('should validate range length', () => {
      const startDate = new Date(2023, 0, 1); // Jan 1, 2023
      const endDateShortRange = new Date(2023, 0, 10); // Jan 10, 2023 (9 days)
      const endDateLongRange = new Date(2023, 1, 1); // Feb 1, 2023 (31 days)
      
      expect(isValidJourneyDateRange(startDate, endDateShortRange, 'health', { maxRangeDays: 10 })).toBe(true);
      expect(isValidJourneyDateRange(startDate, endDateLongRange, 'health', { maxRangeDays: 10 })).toBe(false);
    });

    it('should validate both dates according to journey rules', () => {
      // For care journey with businessDaysOnly
      const businessDayStart = new Date(2023, 5, 15); // Thursday, June 15, 2023
      const businessDayEnd = new Date(2023, 5, 16); // Friday, June 16, 2023
      const weekendStart = new Date(2023, 5, 17); // Saturday, June 17, 2023
      const weekendEnd = new Date(2023, 5, 18); // Sunday, June 18, 2023
      
      expect(isValidJourneyDateRange(businessDayStart, businessDayEnd, 'care', { businessDaysOnly: true })).toBe(true);
      expect(isValidJourneyDateRange(weekendStart, businessDayEnd, 'care', { businessDaysOnly: true })).toBe(false);
      expect(isValidJourneyDateRange(businessDayStart, weekendEnd, 'care', { businessDaysOnly: true })).toBe(false);
    });

    it('should handle timezone adjustments', () => {
      const businessDayStart = new Date(2023, 5, 15); // Thursday, June 15, 2023
      const businessDayEnd = new Date(2023, 5, 16); // Friday, June 16, 2023
      
      expect(isValidJourneyDateRange(businessDayStart, businessDayEnd, 'care', { 
        businessDaysOnly: true, 
        timezone: 'America/Sao_Paulo' 
      })).toBe(true);
      // Note: This test is simplified as timezone testing is complex and would require mocking
    });

    it('should handle string date inputs', () => {
      expect(isValidJourneyDateRange('2023-06-15', '2023-06-16', 'health')).toBe(true);
      expect(isValidJourneyDateRange('2023-06-17', '2023-06-18', 'care', { businessDaysOnly: true })).toBe(false); // Weekend
    });

    it('should return false for invalid dates', () => {
      expect(isValidJourneyDateRange('invalid-date', '2023-06-16', 'health')).toBe(false);
      expect(isValidJourneyDateRange('2023-06-15', 'invalid-date', 'health')).toBe(false);
      expect(isValidJourneyDateRange(null as any, '2023-06-16', 'care')).toBe(false);
      expect(isValidJourneyDateRange('2023-06-15', null as any, 'care')).toBe(false);
    });
  });

  describe('isValidDateInTimezone', () => {
    it('should validate dates in specific timezones', () => {
      const date = new Date(2023, 5, 15, 12, 0, 0); // June 15, 2023, 12:00:00 UTC
      
      expect(isValidDateInTimezone(date, 'America/Sao_Paulo')).toBe(true);
      expect(isValidDateInTimezone(date, 'Europe/London')).toBe(true);
      expect(isValidDateInTimezone(date, 'Asia/Tokyo')).toBe(true);
    });

    it('should validate business days in specific timezones', () => {
      const weekday = new Date(2023, 5, 15, 12, 0, 0); // Thursday, June 15, 2023
      const weekend = new Date(2023, 5, 17, 12, 0, 0); // Saturday, June 17, 2023
      
      expect(isValidDateInTimezone(weekday, 'America/Sao_Paulo', { businessDay: true })).toBe(true);
      expect(isValidDateInTimezone(weekend, 'America/Sao_Paulo', { businessDay: true })).toBe(false);
    });

    it('should validate against min and max dates', () => {
      const date = new Date(2023, 5, 15, 12, 0, 0); // June 15, 2023
      const minDate = new Date(2023, 5, 10); // June 10, 2023
      const maxDate = new Date(2023, 5, 20); // June 20, 2023
      const earlierDate = new Date(2023, 5, 5); // June 5, 2023
      const laterDate = new Date(2023, 5, 25); // June 25, 2023
      
      expect(isValidDateInTimezone(date, 'America/Sao_Paulo', { minDate, maxDate })).toBe(true);
      expect(isValidDateInTimezone(earlierDate, 'America/Sao_Paulo', { minDate, maxDate })).toBe(false);
      expect(isValidDateInTimezone(laterDate, 'America/Sao_Paulo', { minDate, maxDate })).toBe(false);
    });

    it('should handle string date inputs', () => {
      expect(isValidDateInTimezone('2023-06-15', 'America/Sao_Paulo')).toBe(true);
      expect(isValidDateInTimezone('2023-06-17', 'America/Sao_Paulo', { businessDay: true })).toBe(false); // Weekend
    });

    it('should return false for invalid dates or timezones', () => {
      expect(isValidDateInTimezone('invalid-date', 'America/Sao_Paulo')).toBe(false);
      expect(isValidDateInTimezone(new Date(), 'Invalid/Timezone')).toBe(false);
      expect(isValidDateInTimezone(null as any, 'America/Sao_Paulo')).toBe(false);
    });
  });

  describe('getNextBusinessDay', () => {
    it('should return the next business day', () => {
      // Thursday, June 15, 2023 -> Friday, June 16, 2023
      const thursday = new Date(2023, 5, 15);
      const expectedFriday = new Date(2023, 5, 16);
      const result = getNextBusinessDay(thursday, { skipToday: true });
      
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(expectedFriday.getFullYear());
      expect(result?.getMonth()).toBe(expectedFriday.getMonth());
      expect(result?.getDate()).toBe(expectedFriday.getDate());
    });

    it('should skip weekends', () => {
      // Friday, June 16, 2023 -> Monday, June 19, 2023
      const friday = new Date(2023, 5, 16);
      const expectedMonday = new Date(2023, 5, 19);
      const result = getNextBusinessDay(friday, { skipToday: true });
      
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(expectedMonday.getFullYear());
      expect(result?.getMonth()).toBe(expectedMonday.getMonth());
      expect(result?.getDate()).toBe(expectedMonday.getDate());
    });

    it('should skip holidays', () => {
      // December 24, 2023 (Sunday) -> December 26, 2023 (Tuesday, after Christmas)
      const beforeChristmas = new Date(2023, 11, 24);
      const expectedAfterChristmas = new Date(2023, 11, 26);
      const result = getNextBusinessDay(beforeChristmas, { skipToday: true });
      
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(expectedAfterChristmas.getFullYear());
      expect(result?.getMonth()).toBe(expectedAfterChristmas.getMonth());
      expect(result?.getDate()).toBe(expectedAfterChristmas.getDate());
    });

    it('should not skip today if skipToday is false', () => {
      // Thursday, June 15, 2023 -> Thursday, June 15, 2023 (same day)
      const thursday = new Date(2023, 5, 15);
      const result = getNextBusinessDay(thursday, { skipToday: false });
      
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(thursday.getFullYear());
      expect(result?.getMonth()).toBe(thursday.getMonth());
      expect(result?.getDate()).toBe(thursday.getDate());
    });

    it('should respect maxAttempts', () => {
      // Create a scenario where finding a business day would require many attempts
      // For example, a long holiday period
      const date = new Date(2023, 11, 24); // Start of Christmas/New Year period
      
      // With limited attempts, it might not find a business day
      const resultLimitedAttempts = getNextBusinessDay(date, { maxAttempts: 1 });
      expect(resultLimitedAttempts).toBeNull();
      
      // With more attempts, it should find a business day
      const resultMoreAttempts = getNextBusinessDay(date, { maxAttempts: 10 });
      expect(resultMoreAttempts).toBeInstanceOf(Date);
    });

    it('should handle string date inputs', () => {
      const result = getNextBusinessDay('2023-06-15', { skipToday: true });
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(16); // Next day is Friday, June 16
    });

    it('should return null for invalid dates', () => {
      expect(getNextBusinessDay('invalid-date')).toBeNull();
      expect(getNextBusinessDay(null as any)).toBeNull();
      expect(getNextBusinessDay(undefined as any)).toBeNull();
    });
  });

  describe('isWithinBusinessHours', () => {
    it('should return true for dates within business hours', () => {
      // Thursday, June 15, 2023, 10:00 AM (within default 9 AM - 5 PM)
      const withinHours = new Date(2023, 5, 15, 10, 0, 0);
      expect(isWithinBusinessHours(withinHours)).toBe(true);
    });

    it('should return false for dates outside business hours', () => {
      // Thursday, June 15, 2023, 7:00 AM (before default 9 AM start)
      const beforeHours = new Date(2023, 5, 15, 7, 0, 0);
      // Thursday, June 15, 2023, 6:00 PM (after default 5 PM end)
      const afterHours = new Date(2023, 5, 15, 18, 0, 0);
      
      expect(isWithinBusinessHours(beforeHours)).toBe(false);
      expect(isWithinBusinessHours(afterHours)).toBe(false);
    });

    it('should respect custom business hours', () => {
      // Thursday, June 15, 2023, 7:30 AM
      const earlyMorning = new Date(2023, 5, 15, 7, 30, 0);
      // Custom hours: 7 AM - 3 PM
      const customOptions = { startHour: 7, endHour: 15, startMinute: 0, endMinute: 0 };
      
      expect(isWithinBusinessHours(earlyMorning)).toBe(false); // Outside default hours
      expect(isWithinBusinessHours(earlyMorning, customOptions)).toBe(true); // Within custom hours
    });

    it('should return false for non-business days', () => {
      // Saturday, June 17, 2023, 10:00 AM (weekend)
      const weekend = new Date(2023, 5, 17, 10, 0, 0);
      // January 1, 2023, 10:00 AM (holiday)
      const holiday = new Date(2023, 0, 1, 10, 0, 0);
      
      expect(isWithinBusinessHours(weekend)).toBe(false);
      expect(isWithinBusinessHours(holiday)).toBe(false);
    });

    it('should handle timezone adjustments', () => {
      // Create a date that's within business hours in one timezone but not in another
      const date = new Date(2023, 5, 15, 10, 0, 0); // 10:00 AM UTC
      
      expect(isWithinBusinessHours(date, { timezone: 'America/Sao_Paulo' })).toBe(true);
      // Note: This test is simplified as timezone testing is complex and would require mocking
    });

    it('should handle string date inputs', () => {
      expect(isWithinBusinessHours('2023-06-15T10:00:00Z')).toBe(true);
      expect(isWithinBusinessHours('2023-06-15T20:00:00Z')).toBe(false); // 8 PM
    });

    it('should return false for invalid dates', () => {
      expect(isWithinBusinessHours('invalid-date')).toBe(false);
      expect(isWithinBusinessHours(null as any)).toBe(false);
      expect(isWithinBusinessHours(undefined as any)).toBe(false);
    });
  });
});
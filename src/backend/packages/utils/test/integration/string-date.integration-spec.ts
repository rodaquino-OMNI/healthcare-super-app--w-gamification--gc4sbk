/**
 * Integration Test Suite for String and Date Utilities
 * 
 * This test suite verifies the interaction between string utilities and date utilities
 * in the AUSTA SuperApp. It tests scenarios where string manipulation is used with date
 * formatting, parsing and validation. This ensures consistent behavior when processing
 * date strings across different locales, formats, and journey-specific requirements.
 */

import { format, parse, addDays, subDays } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

// Import string utilities
import * as stringUtils from '../../src/string';
import { capitalizeFirstLetter, truncate } from '../../src/string/formatting';

// Import date utilities
import * as dateUtils from '../../src/date';
import {
  formatDate,
  formatTime,
  formatDateTime,
  formatDateRange,
  formatRelativeDate,
  formatJourneyDate,
  getTimeAgo
} from '../../src/date/format';

// Import test helpers
import testHelpers, {
  IntegrationTestContext,
  JourneyType,
  createTestContext,
  setupHealthJourneyTest,
  setupCareJourneyTest,
  setupPlanJourneyTest
} from './helpers';

describe('String and Date Utilities Integration', () => {
  let context: IntegrationTestContext;

  beforeEach(() => {
    context = createTestContext();
  });

  afterEach(() => {
    context.cleanup();
  });

  describe('String Truncation with Formatted Dates', () => {
    it('should truncate formatted dates correctly', () => {
      const testDate = new Date(2025, 4, 23); // May 23, 2025
      
      // Format date in different formats
      const shortFormat = formatDate(testDate); // Default format: dd/MM/yyyy
      const longFormat = formatDate(testDate, 'EEEE, dd MMMM yyyy'); // e.g., "Friday, 23 May 2025"
      const timeFormat = formatDateTime(testDate); // Default format: dd/MM/yyyy HH:mm
      
      // Test truncation with different lengths
      expect(truncate(shortFormat, 5)).toBe('23/05...');
      expect(truncate(longFormat, 10)).toBe('Friday, 23...');
      expect(truncate(timeFormat, 8)).toBe('23/05/20...');
      
      // Test with custom ellipsis
      expect(truncate(shortFormat, 5, ' [...]')).toBe('23/05 [...]');
      expect(truncate(longFormat, 12, ' (more)')).toBe('Friday, 23 M (more)');
    });

    it('should handle truncation of date ranges', () => {
      const startDate = new Date(2025, 4, 23); // May 23, 2025
      const endDate = new Date(2025, 5, 15);   // June 15, 2025
      
      // Format date range
      const dateRange = formatDateRange(startDate, endDate);
      const longDateRange = formatDateRange(
        startDate, 
        endDate, 
        'EEEE, dd MMMM yyyy'
      );
      
      // Test truncation
      expect(truncate(dateRange, 10)).toBe('23/05/202...');
      expect(truncate(longDateRange, 20)).toBe('Friday, 23 May 202...');
    });

    it('should handle truncation of relative dates', () => {
      const yesterday = subDays(new Date(), 1);
      const lastWeek = subDays(new Date(), 7);
      
      // Format relative dates
      const yesterdayRelative = formatRelativeDate(yesterday);
      const lastWeekRelative = formatRelativeDate(lastWeek);
      
      // Test truncation
      expect(truncate(yesterdayRelative, 3)).toBe('Ont...');
      expect(truncate(lastWeekRelative, 5)).toBe('7 dia...');
    });

    it('should handle truncation of time ago strings', () => {
      const oneHourAgo = new Date(Date.now() - 3600000);
      const oneDayAgo = new Date(Date.now() - 86400000);
      
      // Format time ago
      const hourAgo = getTimeAgo(oneHourAgo);
      const dayAgo = getTimeAgo(oneDayAgo);
      
      // Test truncation
      expect(truncate(hourAgo, 5)).toBe('1 hor...');
      expect(truncate(dayAgo, 4)).toBe('1 di...');
    });
  });

  describe('Capitalizing Month and Day Names', () => {
    it('should capitalize month names in Portuguese correctly', () => {
      const months = [
        new Date(2025, 0, 1),  // January
        new Date(2025, 1, 1),  // February
        new Date(2025, 2, 1),  // March
        new Date(2025, 3, 1),  // April
        new Date(2025, 4, 1),  // May
        new Date(2025, 5, 1),  // June
        new Date(2025, 6, 1),  // July
        new Date(2025, 7, 1),  // August
        new Date(2025, 8, 1),  // September
        new Date(2025, 9, 1),  // October
        new Date(2025, 10, 1), // November
        new Date(2025, 11, 1)  // December
      ];
      
      // Test each month in Portuguese
      months.forEach(date => {
        const monthName = formatDate(date, 'MMMM', 'pt-BR');
        const capitalizedMonth = capitalizeFirstLetter(monthName);
        
        // Ensure first letter is uppercase and the rest is unchanged
        expect(capitalizedMonth.charAt(0)).toBe(monthName.charAt(0).toUpperCase());
        expect(capitalizedMonth.slice(1)).toBe(monthName.slice(1));
        
        // Ensure the month name is properly capitalized
        expect(capitalizedMonth).toBe(monthName.charAt(0).toUpperCase() + monthName.slice(1));
      });
    });

    it('should capitalize month names in English correctly', () => {
      const months = [
        new Date(2025, 0, 1),  // January
        new Date(2025, 1, 1),  // February
        new Date(2025, 2, 1),  // March
        new Date(2025, 3, 1),  // April
        new Date(2025, 4, 1),  // May
        new Date(2025, 5, 1),  // June
        new Date(2025, 6, 1),  // July
        new Date(2025, 7, 1),  // August
        new Date(2025, 8, 1),  // September
        new Date(2025, 9, 1),  // October
        new Date(2025, 10, 1), // November
        new Date(2025, 11, 1)  // December
      ];
      
      // Test each month in English
      months.forEach(date => {
        const monthName = formatDate(date, 'MMMM', 'en-US');
        const capitalizedMonth = capitalizeFirstLetter(monthName);
        
        // English month names are already capitalized, so they should be unchanged
        expect(capitalizedMonth).toBe(monthName);
      });
    });

    it('should capitalize day names in Portuguese correctly', () => {
      // Create dates for each day of the week
      const daysOfWeek = [
        new Date(2025, 4, 18), // Sunday
        new Date(2025, 4, 19), // Monday
        new Date(2025, 4, 20), // Tuesday
        new Date(2025, 4, 21), // Wednesday
        new Date(2025, 4, 22), // Thursday
        new Date(2025, 4, 23), // Friday
        new Date(2025, 4, 24)  // Saturday
      ];
      
      // Test each day in Portuguese
      daysOfWeek.forEach(date => {
        const dayName = formatDate(date, 'EEEE', 'pt-BR');
        const capitalizedDay = capitalizeFirstLetter(dayName);
        
        // Ensure first letter is uppercase and the rest is unchanged
        expect(capitalizedDay.charAt(0)).toBe(dayName.charAt(0).toUpperCase());
        expect(capitalizedDay.slice(1)).toBe(dayName.slice(1));
        
        // Ensure the day name is properly capitalized
        expect(capitalizedDay).toBe(dayName.charAt(0).toUpperCase() + dayName.slice(1));
      });
    });

    it('should capitalize day names in English correctly', () => {
      // Create dates for each day of the week
      const daysOfWeek = [
        new Date(2025, 4, 18), // Sunday
        new Date(2025, 4, 19), // Monday
        new Date(2025, 4, 20), // Tuesday
        new Date(2025, 4, 21), // Wednesday
        new Date(2025, 4, 22), // Thursday
        new Date(2025, 4, 23), // Friday
        new Date(2025, 4, 24)  // Saturday
      ];
      
      // Test each day in English
      daysOfWeek.forEach(date => {
        const dayName = formatDate(date, 'EEEE', 'en-US');
        const capitalizedDay = capitalizeFirstLetter(dayName);
        
        // English day names are already capitalized, so they should be unchanged
        expect(capitalizedDay).toBe(dayName);
      });
    });

    it('should handle capitalization of full date strings', () => {
      const testDate = new Date(2025, 4, 23); // May 23, 2025 (Friday)
      
      // Format date with day and month names in different locales
      const ptDate = formatDate(testDate, 'EEEE, d \\de MMMM \\de yyyy', 'pt-BR');
      const enDate = formatDate(testDate, 'EEEE, MMMM d, yyyy', 'en-US');
      
      // Test capitalization
      const capitalizedPtDate = capitalizeFirstLetter(ptDate);
      const capitalizedEnDate = capitalizeFirstLetter(enDate);
      
      // Portuguese date should be capitalized
      expect(capitalizedPtDate.charAt(0)).toBe(ptDate.charAt(0).toUpperCase());
      expect(capitalizedPtDate).not.toBe(ptDate);
      
      // English date should remain the same (already capitalized)
      expect(capitalizedEnDate).toBe(enDate);
    });
  });

  describe('Date Range String Representations', () => {
    it('should format date ranges with different formats', () => {
      const startDate = new Date(2025, 4, 23); // May 23, 2025
      const endDate = new Date(2025, 5, 15);   // June 15, 2025
      
      // Test with default format
      const defaultRange = formatDateRange(startDate, endDate);
      expect(defaultRange).toBe('23/05/2025 - 15/06/2025');
      
      // Test with custom format
      const customRange = formatDateRange(startDate, endDate, 'dd MMM yyyy');
      expect(customRange).toBe('23 mai 2025 - 15 jun 2025');
      
      // Test with English locale
      const enRange = formatDateRange(startDate, endDate, 'MMM d, yyyy', 'en-US');
      expect(enRange).toBe('May 23, 2025 - Jun 15, 2025');
    });

    it('should handle same-month date ranges correctly', () => {
      const startDate = new Date(2025, 4, 23); // May 23, 2025
      const endDate = new Date(2025, 4, 30);   // May 30, 2025
      
      // Test with month-day format
      const monthDayRange = formatDateRange(startDate, endDate, 'dd MMM');
      expect(monthDayRange).toBe('23 mai - 30 mai');
      
      // Custom formatting to show month only once for same-month ranges
      const formattedStart = formatDate(startDate, 'dd');
      const formattedEnd = formatDate(endDate, 'dd \\de MMMM');
      const sameMonthRange = `${formattedStart} - ${formattedEnd}`;
      
      expect(sameMonthRange).toBe('23 - 30 de maio');
    });

    it('should handle same-year date ranges correctly', () => {
      const startDate = new Date(2025, 4, 23); // May 23, 2025
      const endDate = new Date(2025, 7, 15);   // August 15, 2025
      
      // Test with month-day format
      const monthDayRange = formatDateRange(startDate, endDate, 'dd MMM');
      expect(monthDayRange).toBe('23 mai - 15 ago');
      
      // Custom formatting to show year only once for same-year ranges
      const formattedStart = formatDate(startDate, 'dd/MM');
      const formattedEnd = formatDate(endDate, 'dd/MM/yyyy');
      const sameYearRange = `${formattedStart} - ${formattedEnd}`;
      
      expect(sameYearRange).toBe('23/05 - 15/08/2025');
    });

    it('should handle cross-year date ranges correctly', () => {
      const startDate = new Date(2025, 11, 23); // December 23, 2025
      const endDate = new Date(2026, 1, 15);    // February 15, 2026
      
      // Test with default format
      const defaultRange = formatDateRange(startDate, endDate);
      expect(defaultRange).toBe('23/12/2025 - 15/02/2026');
      
      // Test with custom format
      const customRange = formatDateRange(startDate, endDate, 'MMM yyyy');
      expect(customRange).toBe('dez 2025 - fev 2026');
    });
  });

  describe('Journey-Specific Date Formatting', () => {
    it('should format dates according to Health journey requirements', () => {
      // Set up health journey test context
      setupHealthJourneyTest(context);
      
      const testDate = new Date(2025, 4, 23, 14, 30); // May 23, 2025, 14:30
      
      // Format date for Health journey
      const healthDate = formatJourneyDate(testDate, JourneyType.HEALTH);
      
      // Health journey uses detailed format with time
      expect(healthDate).toContain('23/05/2025');
      expect(healthDate).toContain('14:30');
      
      // Test truncation for display in limited space
      const truncatedHealthDate = truncate(healthDate, 10);
      expect(truncatedHealthDate).toBe('23/05/202...');
      
      // Test capitalization for header display
      const capitalizedHealthDate = capitalizeFirstLetter(
        formatDate(testDate, 'EEEE, d \\de MMMM', 'pt-BR')
      );
      expect(capitalizedHealthDate.charAt(0)).toBe(
        capitalizedHealthDate.charAt(0).toUpperCase()
      );
    });

    it('should format dates according to Care journey requirements', () => {
      // Set up care journey test context
      setupCareJourneyTest(context);
      
      const testDate = new Date(2025, 4, 23, 14, 30); // May 23, 2025, 14:30
      
      // Format date for Care journey
      const careDate = formatJourneyDate(testDate, JourneyType.CARE);
      
      // Care journey uses appointment-friendly format
      expect(careDate).toContain('23');
      expect(careDate).toContain('mai');
      expect(careDate).toContain('2025');
      
      // Test truncation for display in appointment list
      const truncatedCareDate = truncate(careDate, 12);
      expect(truncatedCareDate.length).toBeLessThanOrEqual(15); // 12 + ellipsis
      
      // Test capitalization for header display
      const dayName = formatDate(testDate, 'EEEE', 'pt-BR');
      const capitalizedDayName = capitalizeFirstLetter(dayName);
      expect(capitalizedDayName.charAt(0)).toBe(
        capitalizedDayName.charAt(0).toUpperCase()
      );
    });

    it('should format dates according to Plan journey requirements', () => {
      // Set up plan journey test context
      setupPlanJourneyTest(context);
      
      const testDate = new Date(2025, 4, 23); // May 23, 2025
      
      // Format date for Plan journey
      const planDate = formatJourneyDate(testDate, JourneyType.PLAN);
      
      // Plan journey uses formal date format
      expect(planDate).toBe('23/05/2025');
      
      // Test date range formatting for coverage periods
      const startDate = new Date(2025, 0, 1);  // January 1, 2025
      const endDate = new Date(2025, 11, 31); // December 31, 2025
      
      const coveragePeriod = formatDateRange(startDate, endDate);
      expect(coveragePeriod).toBe('01/01/2025 - 31/12/2025');
      
      // Test truncation for display in claim list
      const truncatedPlanDate = truncate(planDate, 8);
      expect(truncatedPlanDate).toBe('23/05/20...');
    });

    it('should ensure consistent behavior across all journey services', () => {
      // Create test date
      const testDate = new Date(2025, 4, 23, 14, 30); // May 23, 2025, 14:30
      
      // Format date for each journey
      const healthDate = formatJourneyDate(testDate, JourneyType.HEALTH);
      const careDate = formatJourneyDate(testDate, JourneyType.CARE);
      const planDate = formatJourneyDate(testDate, JourneyType.PLAN);
      
      // Each journey has different format requirements, but all should include the date
      expect(healthDate).toContain('23/05/2025');
      expect(careDate).toContain('23');
      expect(careDate).toContain('mai');
      expect(planDate).toBe('23/05/2025');
      
      // Test that truncation works consistently across all formats
      const truncatedHealthDate = truncate(healthDate, 10);
      const truncatedCareDate = truncate(careDate, 10);
      const truncatedPlanDate = truncate(planDate, 10);
      
      expect(truncatedHealthDate.length).toBeLessThanOrEqual(13); // 10 + ellipsis
      expect(truncatedCareDate.length).toBeLessThanOrEqual(13); // 10 + ellipsis
      expect(truncatedPlanDate).toBe('23/05/202...');
      
      // Test that capitalization works consistently across all formats
      const dayName = formatDate(testDate, 'EEEE', 'pt-BR');
      const capitalizedDayName = capitalizeFirstLetter(dayName);
      
      expect(capitalizedDayName).not.toBe(dayName); // Should be different (capitalized)
      expect(capitalizedDayName.charAt(0)).toBe(dayName.charAt(0).toUpperCase());
    });
  });

  describe('Complex String and Date Interactions', () => {
    it('should handle truncation of date ranges with capitalized month names', () => {
      const startDate = new Date(2025, 4, 23); // May 23, 2025
      const endDate = new Date(2025, 5, 15);   // June 15, 2025
      
      // Format date range with full month names
      const dateRange = formatDateRange(
        startDate, 
        endDate, 
        'd \\de MMMM \\de yyyy', 
        'pt-BR'
      );
      
      // Capitalize the first letter of the date range
      const capitalizedDateRange = capitalizeFirstLetter(dateRange);
      
      // The first letter should be capitalized (the day number doesn't change)
      expect(capitalizedDateRange).toBe(dateRange);
      
      // Now format with month name first
      const monthFirstRange = formatDateRange(
        startDate, 
        endDate, 
        'MMMM d, yyyy', 
        'pt-BR'
      );
      
      // Capitalize the first letter
      const capitalizedMonthFirstRange = capitalizeFirstLetter(monthFirstRange);
      
      // The first letter should be capitalized (the month name)
      expect(capitalizedMonthFirstRange.charAt(0)).toBe(
        monthFirstRange.charAt(0).toUpperCase()
      );
      
      // Truncate the capitalized date range
      const truncatedCapitalizedRange = truncate(capitalizedMonthFirstRange, 15);
      expect(truncatedCapitalizedRange.length).toBeLessThanOrEqual(18); // 15 + ellipsis
    });

    it('should handle formatting and truncation of time ago strings with different locales', () => {
      const oneHourAgo = new Date(Date.now() - 3600000);
      const oneDayAgo = new Date(Date.now() - 86400000);
      const oneWeekAgo = new Date(Date.now() - 604800000);
      
      // Format time ago in different locales
      const ptHourAgo = getTimeAgo(oneHourAgo, 'pt-BR');
      const enHourAgo = getTimeAgo(oneHourAgo, 'en-US');
      
      const ptDayAgo = getTimeAgo(oneDayAgo, 'pt-BR');
      const enDayAgo = getTimeAgo(oneDayAgo, 'en-US');
      
      const ptWeekAgo = getTimeAgo(oneWeekAgo, 'pt-BR');
      const enWeekAgo = getTimeAgo(oneWeekAgo, 'en-US');
      
      // Test that time units are correctly localized
      expect(ptHourAgo).toContain('hora');
      expect(enHourAgo).toContain('hour');
      
      expect(ptDayAgo).toContain('dia');
      expect(enDayAgo).toContain('day');
      
      expect(ptWeekAgo).toContain('semana');
      expect(enWeekAgo).toContain('week');
      
      // Test truncation of localized time ago strings
      const truncatedPtHourAgo = truncate(ptHourAgo, 8);
      const truncatedEnHourAgo = truncate(enHourAgo, 8);
      
      expect(truncatedPtHourAgo.length).toBeLessThanOrEqual(11); // 8 + ellipsis
      expect(truncatedEnHourAgo.length).toBeLessThanOrEqual(11); // 8 + ellipsis
    });

    it('should handle capitalization of relative date strings', () => {
      const yesterday = subDays(new Date(), 1);
      const lastWeek = subDays(new Date(), 7);
      
      // Format relative dates in different locales
      const ptYesterday = formatRelativeDate(yesterday, 'pt-BR');
      const enYesterday = formatRelativeDate(yesterday, 'en-US');
      
      const ptLastWeek = formatRelativeDate(lastWeek, 'pt-BR');
      const enLastWeek = formatRelativeDate(lastWeek, 'en-US');
      
      // Test capitalization
      const capitalizedPtYesterday = capitalizeFirstLetter(ptYesterday);
      const capitalizedEnYesterday = capitalizeFirstLetter(enYesterday);
      
      // Both should already be capitalized in the original format
      expect(capitalizedPtYesterday).toBe(ptYesterday);
      expect(capitalizedEnYesterday).toBe(enYesterday);
      
      // Test with last week (contains numbers)
      const capitalizedPtLastWeek = capitalizeFirstLetter(ptLastWeek);
      const capitalizedEnLastWeek = capitalizeFirstLetter(enLastWeek);
      
      // These should be unchanged since they start with numbers
      expect(capitalizedPtLastWeek).toBe(ptLastWeek);
      expect(capitalizedEnLastWeek).toBe(enLastWeek);
    });

    it('should handle journey-specific date formatting with string manipulations', () => {
      // Create test date
      const appointmentDate = new Date(2025, 4, 23, 14, 30); // May 23, 2025, 14:30
      
      // Format for Care journey (appointments)
      const careDate = formatJourneyDate(appointmentDate, JourneyType.CARE, 'pt-BR');
      
      // Extract day name for display in header
      const dayName = formatDate(appointmentDate, 'EEEE', 'pt-BR');
      const capitalizedDayName = capitalizeFirstLetter(dayName);
      
      // Create a custom appointment display string
      const appointmentDisplay = `${capitalizedDayName}: ${careDate} - Consulta Médica`;
      
      // Test truncation for different display contexts
      const shortDisplay = truncate(appointmentDisplay, 20);
      const mediumDisplay = truncate(appointmentDisplay, 30);
      const longDisplay = truncate(appointmentDisplay, 40);
      
      expect(shortDisplay.length).toBeLessThanOrEqual(23); // 20 + ellipsis
      expect(mediumDisplay.length).toBeLessThanOrEqual(33); // 30 + ellipsis
      expect(longDisplay.length).toBeLessThanOrEqual(43); // 40 + ellipsis
      
      // Ensure the capitalized day name is preserved in the medium and long displays
      expect(mediumDisplay).toContain(capitalizedDayName);
      expect(longDisplay).toContain(capitalizedDayName);
    });
  });
});
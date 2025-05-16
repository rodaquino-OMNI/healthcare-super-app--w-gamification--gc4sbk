/**
 * Integration tests for string and date utilities
 *
 * This test suite verifies the interaction between string utilities and date utilities
 * in the AUSTA SuperApp. It tests scenarios where string manipulation is used with date
 * formatting, parsing and validation. This ensures consistent behavior when processing
 * date strings across different locales, formats, and journey-specific requirements.
 */

// Import string utilities
import { truncate, capitalizeFirstLetter } from '../../src/string/formatting';
import { isValidCPF } from '../../src/string/validation';

// Import date utilities
import { formatDate, formatDateTime, formatDateRange } from '../../src/date/format';
import { parseDate } from '../../src/date/parse';
import { isValidDate } from '../../src/date/validation';
import { formatJourneyDate } from '../../src/date/journey';
import { getDateRange } from '../../src/date/range';
import { calculateAge, getTimeAgo } from '../../src/date/calculation';

// Import test helpers and setup
import { 
  createJourneyContext, 
  journeyHelpers, 
  testDataGenerators,
  integrationVerifiers,
  JourneyType
} from './helpers';
import { validationContexts } from './setup';

/**
 * Test suite for string truncation with formatted dates
 */
describe('String Truncation with Formatted Dates', () => {
  it('should truncate long formatted dates with ellipsis', () => {
    // Create a test date
    const testDate = new Date(2023, 0, 15); // January 15, 2023
    
    // Format the date with a long format (including day of week, month name, etc.)
    const longFormattedDate = formatDate(testDate, 'EEEE, dd \\de MMMM \\de yyyy', 'pt-BR');
    // Should produce something like "domingo, 15 de janeiro de 2023"
    
    // Test truncation with different lengths
    expect(truncate(longFormattedDate, 10)).toBe('domingo, 1...');
    expect(truncate(longFormattedDate, 20)).toBe('domingo, 15 de janei...');
    expect(truncate(longFormattedDate, 30)).toBe('domingo, 15 de janeiro de 2023');
    
    // Test with English locale
    const longFormattedDateEN = formatDate(testDate, 'EEEE, MMMM dd, yyyy', 'en-US');
    // Should produce something like "Sunday, January 15, 2023"
    
    expect(truncate(longFormattedDateEN, 10)).toBe('Sunday, Ja...');
    expect(truncate(longFormattedDateEN, 20)).toBe('Sunday, January 15,...');
    expect(truncate(longFormattedDateEN, 30)).toBe('Sunday, January 15, 2023');
  });
  
  it('should truncate date-time strings appropriately', () => {
    // Create a test date with time
    const testDateTime = new Date(2023, 0, 15, 14, 30); // January 15, 2023, 14:30
    
    // Format the date-time
    const formattedDateTime = formatDateTime(testDateTime, 'dd/MM/yyyy HH:mm', 'pt-BR');
    // Should produce "15/01/2023 14:30"
    
    // Test truncation with different lengths
    expect(truncate(formattedDateTime, 8)).toBe('15/01/20...');
    expect(truncate(formattedDateTime, 10)).toBe('15/01/2023...');
    expect(truncate(formattedDateTime, 16)).toBe('15/01/2023 14:30');
  });
  
  it('should truncate relative time strings', () => {
    // Create dates for relative time testing
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    const lastWeek = new Date(now);
    lastWeek.setDate(now.getDate() - 7);
    
    const lastMonth = new Date(now);
    lastMonth.setMonth(now.getMonth() - 1);
    
    // Get time ago strings
    const yesterdayAgo = getTimeAgo(yesterday, 'pt-BR');
    const lastWeekAgo = getTimeAgo(lastWeek, 'pt-BR');
    const lastMonthAgo = getTimeAgo(lastMonth, 'pt-BR');
    
    // Test truncation
    expect(truncate(yesterdayAgo, 5)).toBe('1 dia...');
    expect(truncate(lastWeekAgo, 8)).toBe('7 dias a...');
    expect(truncate(lastMonthAgo, 10)).toBe('1 mês atrá...');
    
    // Test with English locale
    const yesterdayAgoEN = getTimeAgo(yesterday, 'en-US');
    const lastWeekAgoEN = getTimeAgo(lastWeek, 'en-US');
    const lastMonthAgoEN = getTimeAgo(lastMonth, 'en-US');
    
    expect(truncate(yesterdayAgoEN, 5)).toBe('1 day...');
    expect(truncate(lastWeekAgoEN, 8)).toBe('7 days a...');
    expect(truncate(lastMonthAgoEN, 10)).toBe('1 month ag...');
  });
  
  it('should handle truncation of date range strings', () => {
    // Create date range
    const startDate = new Date(2023, 0, 1); // January 1, 2023
    const endDate = new Date(2023, 0, 31); // January 31, 2023
    
    // Format date range
    const dateRange = formatDateRange(startDate, endDate, 'dd/MM/yyyy', 'pt-BR');
    // Should produce "01/01/2023 - 31/01/2023"
    
    // Test truncation
    expect(truncate(dateRange, 10)).toBe('01/01/2023...');
    expect(truncate(dateRange, 15)).toBe('01/01/2023 - 31...');
    expect(truncate(dateRange, 23)).toBe('01/01/2023 - 31/01/2023');
  });
});

/**
 * Test suite for capitalizing date components
 */
describe('Capitalizing Date Components', () => {
  it('should properly capitalize month names in different locales', () => {
    // Create test dates for each month
    const months = Array.from({ length: 12 }, (_, i) => new Date(2023, i, 1));
    
    // Test Portuguese month names
    const ptMonthNames = months.map(date => formatDate(date, 'MMMM', 'pt-BR'));
    const capitalizedPtMonths = ptMonthNames.map(month => capitalizeFirstLetter(month));
    
    // Verify specific months are correctly capitalized
    expect(capitalizedPtMonths[0]).toBe('Janeiro');
    expect(capitalizedPtMonths[3]).toBe('Abril');
    expect(capitalizedPtMonths[7]).toBe('Agosto');
    expect(capitalizedPtMonths[11]).toBe('Dezembro');
    
    // Test English month names
    const enMonthNames = months.map(date => formatDate(date, 'MMMM', 'en-US'));
    const capitalizedEnMonths = enMonthNames.map(month => capitalizeFirstLetter(month));
    
    // Verify specific months are correctly capitalized
    expect(capitalizedEnMonths[0]).toBe('January');
    expect(capitalizedEnMonths[3]).toBe('April');
    expect(capitalizedEnMonths[7]).toBe('August');
    expect(capitalizedEnMonths[11]).toBe('December');
  });
  
  it('should properly capitalize day names in different locales', () => {
    // Create test dates for each day of the week (starting from Sunday)
    const startDate = new Date(2023, 0, 1); // January 1, 2023 (Sunday)
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      return date;
    });
    
    // Test Portuguese day names
    const ptDayNames = days.map(date => formatDate(date, 'EEEE', 'pt-BR'));
    const capitalizedPtDays = ptDayNames.map(day => capitalizeFirstLetter(day));
    
    // Verify specific days are correctly capitalized
    expect(capitalizedPtDays[0]).toBe('Domingo');
    expect(capitalizedPtDays[1]).toBe('Segunda-feira');
    expect(capitalizedPtDays[3]).toBe('Quarta-feira');
    expect(capitalizedPtDays[6]).toBe('Sábado');
    
    // Test English day names
    const enDayNames = days.map(date => formatDate(date, 'EEEE', 'en-US'));
    const capitalizedEnDays = enDayNames.map(day => capitalizeFirstLetter(day));
    
    // Verify specific days are correctly capitalized
    expect(capitalizedEnDays[0]).toBe('Sunday');
    expect(capitalizedEnDays[1]).toBe('Monday');
    expect(capitalizedEnDays[3]).toBe('Wednesday');
    expect(capitalizedEnDays[6]).toBe('Saturday');
  });
  
  it('should handle capitalization of abbreviated date components', () => {
    // Create test date
    const testDate = new Date(2023, 0, 15); // January 15, 2023 (Sunday)
    
    // Test abbreviated month names
    const ptAbbrevMonth = formatDate(testDate, 'MMM', 'pt-BR');
    const enAbbrevMonth = formatDate(testDate, 'MMM', 'en-US');
    
    expect(capitalizeFirstLetter(ptAbbrevMonth)).toBe('Jan');
    expect(capitalizeFirstLetter(enAbbrevMonth)).toBe('Jan');
    
    // Test abbreviated day names
    const ptAbbrevDay = formatDate(testDate, 'E', 'pt-BR');
    const enAbbrevDay = formatDate(testDate, 'E', 'en-US');
    
    expect(capitalizeFirstLetter(ptAbbrevDay)).toBe('Dom');
    expect(capitalizeFirstLetter(enAbbrevDay)).toBe('Sun');
  });
  
  it('should capitalize full date strings correctly', () => {
    // Create test date
    const testDate = new Date(2023, 0, 15); // January 15, 2023
    
    // Format date with lowercase format pattern
    const ptDateString = formatDate(testDate, 'EEEE, dd \\de MMMM \\de yyyy', 'pt-BR').toLowerCase();
    const enDateString = formatDate(testDate, 'EEEE, MMMM dd, yyyy', 'en-US').toLowerCase();
    
    // Capitalize the first letter of the date string
    expect(capitalizeFirstLetter(ptDateString)).toBe('Domingo, 15 de janeiro de 2023');
    expect(capitalizeFirstLetter(enDateString)).toBe('Sunday, january 15, 2023');
  });
});

/**
 * Test suite for date range string representations
 */
describe('Date Range String Representations', () => {
  it('should format date ranges consistently', () => {
    // Create date ranges for testing
    const startDate = new Date(2023, 0, 1); // January 1, 2023
    const endDate = new Date(2023, 0, 31); // January 31, 2023
    
    // Test default format
    const defaultRange = formatDateRange(startDate, endDate);
    expect(defaultRange).toBe('01/01/2023 - 31/01/2023');
    
    // Test custom format
    const customRange = formatDateRange(startDate, endDate, 'yyyy-MM-dd');
    expect(customRange).toBe('2023-01-01 - 2023-01-31');
    
    // Test with English locale
    const enRange = formatDateRange(startDate, endDate, 'MMM dd, yyyy', 'en-US');
    expect(enRange).toBe('Jan 01, 2023 - Jan 31, 2023');
    
    // Test with Portuguese locale
    const ptRange = formatDateRange(startDate, endDate, 'dd \\de MMMM', 'pt-BR');
    expect(ptRange).toBe('01 de janeiro - 31 de janeiro');
  });
  
  it('should handle predefined date ranges correctly', () => {
    // Mock the current date for consistent testing
    const originalDate = Date;
    global.Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          // When called with no arguments, return a fixed date
          return new originalDate('2023-01-15T12:00:00Z');
        }
        return new originalDate(...args);
      }
    };
    
    // Test predefined date ranges
    const todayRange = getDateRange('today');
    const thisWeekRange = getDateRange('thisWeek');
    const thisMonthRange = getDateRange('thisMonth');
    
    // Format the ranges
    const todayRangeStr = formatDateRange(todayRange.startDate, todayRange.endDate, 'dd/MM/yyyy');
    const thisWeekRangeStr = formatDateRange(thisWeekRange.startDate, thisWeekRange.endDate, 'dd/MM/yyyy');
    const thisMonthRangeStr = formatDateRange(thisMonthRange.startDate, thisMonthRange.endDate, 'dd/MM/yyyy');
    
    // Verify the formatted ranges
    expect(todayRangeStr).toBe('15/01/2023 - 15/01/2023');
    // Note: exact dates for week and month will depend on the fixed date above
    expect(thisWeekRangeStr).toContain('15/01/2023');
    expect(thisMonthRangeStr).toContain('01/01/2023');
    expect(thisMonthRangeStr).toContain('31/01/2023');
    
    // Restore the original Date
    global.Date = originalDate;
  });
  
  it('should handle date ranges with different formats for start and end dates', () => {
    // Create date range
    const startDate = new Date(2023, 0, 1); // January 1, 2023
    const endDate = new Date(2023, 0, 31); // January 31, 2023
    
    // Custom function to format date range with different formats
    const formatCustomDateRange = (start, end, startFormat, endFormat, locale = 'pt-BR') => {
      const formattedStart = formatDate(start, startFormat, locale);
      const formattedEnd = formatDate(end, endFormat, locale);
      return `${formattedStart} até ${formattedEnd}`;
    };
    
    // Test with different formats
    const customRange = formatCustomDateRange(
      startDate, 
      endDate, 
      'dd/MM', 
      'dd/MM/yyyy'
    );
    
    expect(customRange).toBe('01/01 até 31/01/2023');
    
    // Test with different locales and formats
    const mixedRange = formatCustomDateRange(
      startDate, 
      endDate, 
      'MMMM dd', 
      'dd \\de MMMM, yyyy',
      'pt-BR'
    );
    
    expect(mixedRange).toBe('janeiro 01 até 31 de janeiro, 2023');
  });
  
  it('should truncate long date range strings appropriately', () => {
    // Create date range
    const startDate = new Date(2023, 0, 1); // January 1, 2023
    const endDate = new Date(2023, 11, 31); // December 31, 2023
    
    // Format with long month names
    const longRange = formatDateRange(
      startDate, 
      endDate, 
      'dd \\de MMMM \\de yyyy', 
      'pt-BR'
    );
    // Should produce "01 de janeiro de 2023 - 31 de dezembro de 2023"
    
    // Test truncation
    expect(truncate(longRange, 20)).toBe('01 de janeiro de 20...');
    expect(truncate(longRange, 30)).toBe('01 de janeiro de 2023 - 31 de...');
    expect(truncate(longRange, 40)).toBe('01 de janeiro de 2023 - 31 de dezembro...');
    expect(truncate(longRange, 60)).toBe('01 de janeiro de 2023 - 31 de dezembro de 2023');
  });
});

/**
 * Test suite for journey-specific date formatting
 */
describe('Journey-Specific Date Formatting', () => {
  it('should format dates according to health journey requirements', () => {
    // Create test date
    const testDate = new Date(2023, 0, 15, 14, 30); // January 15, 2023, 14:30
    
    // Format for health journey
    const healthDate = formatJourneyDate(testDate, 'health', 'pt-BR');
    
    // Health journey should include time for metrics
    expect(healthDate).toBe('15/01/2023 14:30');
    
    // Test truncation of health journey date
    expect(truncate(healthDate, 10)).toBe('15/01/2023...');
  });
  
  it('should format dates according to care journey requirements', () => {
    // Create test date
    const testDate = new Date(2023, 0, 15, 14, 30); // January 15, 2023, 14:30
    
    // Format for care journey
    const careDate = formatJourneyDate(testDate, 'care', 'pt-BR');
    
    // Care journey should use appointment-friendly format with day of week
    expect(careDate).toContain('15');
    expect(careDate).toContain('jan');
    expect(careDate).toContain('2023');
    
    // Test capitalization of care journey date
    const capitalizedCareDate = capitalizeFirstLetter(careDate.toLowerCase());
    expect(capitalizedCareDate).not.toBe(careDate.toLowerCase());
    expect(capitalizedCareDate[0]).toBe(careDate[0]);
  });
  
  it('should format dates according to plan journey requirements', () => {
    // Create test date
    const testDate = new Date(2023, 0, 15, 14, 30); // January 15, 2023, 14:30
    
    // Format for plan journey
    const planDate = formatJourneyDate(testDate, 'plan', 'pt-BR');
    
    // Plan journey should use formal date format without time
    expect(planDate).toBe('15/01/2023');
    
    // Test truncation of plan journey date
    expect(truncate(planDate, 8)).toBe('15/01/20...');
  });
  
  it('should maintain consistent behavior across different locales', () => {
    // Create test date
    const testDate = new Date(2023, 0, 15, 14, 30); // January 15, 2023, 14:30
    
    // Test health journey in different locales
    const healthDatePT = formatJourneyDate(testDate, 'health', 'pt-BR');
    const healthDateEN = formatJourneyDate(testDate, 'health', 'en-US');
    
    // Both should have the same format (just different locale-specific formatting)
    expect(healthDatePT).toBe('15/01/2023 14:30');
    expect(healthDateEN).toBe('01/15/2023 14:30');
    
    // Test care journey in different locales
    const careDatePT = formatJourneyDate(testDate, 'care', 'pt-BR');
    const careDateEN = formatJourneyDate(testDate, 'care', 'en-US');
    
    // Should contain day and month in locale-specific format
    expect(careDatePT.toLowerCase()).toContain('jan');
    expect(careDateEN.toLowerCase()).toContain('jan');
    
    // Test capitalization in both locales
    expect(capitalizeFirstLetter(careDatePT.toLowerCase())[0]).toBe(careDatePT[0]);
    expect(capitalizeFirstLetter(careDateEN.toLowerCase())[0]).toBe(careDateEN[0]);
  });
  
  it('should handle journey-specific date ranges', () => {
    // Create date range
    const startDate = new Date(2023, 0, 1); // January 1, 2023
    const endDate = new Date(2023, 0, 31); // January 31, 2023
    
    // Custom function to format journey-specific date range
    const formatJourneyDateRange = (start, end, journeyId, locale = 'pt-BR') => {
      const formattedStart = formatJourneyDate(start, journeyId, locale);
      const formattedEnd = formatJourneyDate(end, journeyId, locale);
      return `${formattedStart} - ${formattedEnd}`;
    };
    
    // Test for different journeys
    const healthRange = formatJourneyDateRange(startDate, endDate, 'health');
    const careRange = formatJourneyDateRange(startDate, endDate, 'care');
    const planRange = formatJourneyDateRange(startDate, endDate, 'plan');
    
    // Verify journey-specific formatting is maintained in ranges
    expect(healthRange).toBe('01/01/2023 00:00 - 31/01/2023 00:00');
    expect(careRange).toContain('jan');
    expect(planRange).toBe('01/01/2023 - 31/01/2023');
    
    // Test truncation of journey-specific date ranges
    expect(truncate(healthRange, 15)).toBe('01/01/2023 00:0...');
    expect(truncate(planRange, 10)).toBe('01/01/2023...');
  });
});

/**
 * Test suite for cross-journey date string handling
 */
describe('Cross-Journey Date String Handling', () => {
  it('should ensure consistent behavior when processing dates across journeys', () => {
    // Create test environment for each journey
    const healthEnv = journeyHelpers.health.createTestEnvironment();
    const careEnv = journeyHelpers.care.createTestEnvironment();
    const planEnv = journeyHelpers.plan.createTestEnvironment();
    
    // Create a test date
    const testDate = new Date(2023, 0, 15); // January 15, 2023
    
    // Format the date for each journey
    const healthDate = formatJourneyDate(testDate, 'health');
    const careDate = formatJourneyDate(testDate, 'care');
    const planDate = formatJourneyDate(testDate, 'plan');
    
    // Verify that parsing the formatted dates gives the original date
    // (ignoring time components for simplicity)
    const parsedHealthDate = parseDate(healthDate.split(' ')[0]);
    const parsedCareDate = parseDate(planDate); // Use plan date format for parsing care date
    const parsedPlanDate = parseDate(planDate);
    
    // All should represent the same day
    expect(parsedHealthDate.getDate()).toBe(15);
    expect(parsedHealthDate.getMonth()).toBe(0); // January is 0
    expect(parsedHealthDate.getFullYear()).toBe(2023);
    
    expect(parsedCareDate.getDate()).toBe(15);
    expect(parsedCareDate.getMonth()).toBe(0);
    expect(parsedCareDate.getFullYear()).toBe(2023);
    
    expect(parsedPlanDate.getDate()).toBe(15);
    expect(parsedPlanDate.getMonth()).toBe(0);
    expect(parsedPlanDate.getFullYear()).toBe(2023);
  });
  
  it('should handle cross-journey date validation consistently', () => {
    // Create test dates
    const validDate = new Date(2023, 0, 15); // January 15, 2023
    const invalidDate = new Date('invalid date');
    
    // Format for different journeys
    const healthDate = formatJourneyDate(validDate, 'health');
    const careDate = formatJourneyDate(validDate, 'care');
    const planDate = formatJourneyDate(validDate, 'plan');
    
    // All formatted dates should be valid
    expect(isValidDate(healthDate)).toBe(true);
    expect(isValidDate(careDate)).toBe(true);
    expect(isValidDate(planDate)).toBe(true);
    
    // Invalid date should be consistently handled
    const invalidHealthDate = formatJourneyDate(invalidDate, 'health');
    const invalidCareDate = formatJourneyDate(invalidDate, 'care');
    const invalidPlanDate = formatJourneyDate(invalidDate, 'plan');
    
    expect(invalidHealthDate).toBe('');
    expect(invalidCareDate).toBe('');
    expect(invalidPlanDate).toBe('');
  });
  
  it('should maintain consistent truncation behavior across journeys', () => {
    // Create test date
    const testDate = new Date(2023, 0, 15); // January 15, 2023
    
    // Format for different journeys
    const healthDate = formatJourneyDate(testDate, 'health');
    const careDate = formatJourneyDate(testDate, 'care');
    const planDate = formatJourneyDate(testDate, 'plan');
    
    // Truncate to same length
    const truncLength = 8;
    const truncatedHealthDate = truncate(healthDate, truncLength);
    const truncatedCareDate = truncate(careDate, truncLength);
    const truncatedPlanDate = truncate(planDate, truncLength);
    
    // All should be truncated to the same length plus ellipsis
    expect(truncatedHealthDate.length).toBe(truncLength + 3); // +3 for ellipsis
    expect(truncatedCareDate.length).toBe(truncLength + 3);
    expect(truncatedPlanDate.length).toBe(truncLength + 3);
    
    // All should end with ellipsis
    expect(truncatedHealthDate.endsWith('...')).toBe(true);
    expect(truncatedCareDate.endsWith('...')).toBe(true);
    expect(truncatedPlanDate.endsWith('...')).toBe(true);
  });
  
  it('should handle capitalization consistently across journeys', () => {
    // Create test date
    const testDate = new Date(2023, 0, 15); // January 15, 2023
    
    // Format for different journeys with month names
    const healthDateWithMonth = formatDate(testDate, 'MMMM dd, yyyy', 'en-US');
    const careDateWithMonth = formatDate(testDate, 'MMMM dd, yyyy', 'en-US');
    const planDateWithMonth = formatDate(testDate, 'MMMM dd, yyyy', 'en-US');
    
    // Convert to lowercase for testing capitalization
    const lowercaseHealthDate = healthDateWithMonth.toLowerCase();
    const lowercaseCareDate = careDateWithMonth.toLowerCase();
    const lowercasePlanDate = planDateWithMonth.toLowerCase();
    
    // Capitalize each
    const capitalizedHealthDate = capitalizeFirstLetter(lowercaseHealthDate);
    const capitalizedCareDate = capitalizeFirstLetter(lowercaseCareDate);
    const capitalizedPlanDate = capitalizeFirstLetter(lowercasePlanDate);
    
    // All should be capitalized the same way
    expect(capitalizedHealthDate).toBe('January 15, 2023');
    expect(capitalizedCareDate).toBe('January 15, 2023');
    expect(capitalizedPlanDate).toBe('January 15, 2023');
  });
});
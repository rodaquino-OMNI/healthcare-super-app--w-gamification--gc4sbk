/**
 * Tests for date validation utilities
 * 
 * This file contains tests for all date validation functions, ensuring they correctly
 * identify valid and invalid dates across various formats and edge cases.
 */

import {
  isValidDate,
  isValidDateString,
  isValidISODateString,
  isDateInPast,
  isDateInFuture,
  isValidDateRange,
  isDateInRange,
  isValidJourneyDate
} from '../../../src/date/validation';

import {
  allValidDateFixtures,
  allInvalidDateFixtures,
  validDateObjects,
  validISOStrings,
  validFormattedStrings,
  validTimestamps,
  invalidDateObjects,
  invalidStrings,
  invalidTimestamps,
  otherInvalidTypes,
  timezoneEdgeCases,
  leapYearEdgeCases,
  getFixturesByTag,
  getFixturesByAllTags
} from '../../fixtures/date/validation';

describe('Date Validation Utilities', () => {
  describe('isValidDate', () => {
    describe('Valid dates', () => {
      test.each(allValidDateFixtures.map(fixture => [
        fixture.description,
        fixture.input,
        fixture.expected
      ]))(
        '%s',
        (description, input, expected) => {
          expect(isValidDate(input)).toBe(expected);
        }
      );
    });

    describe('Invalid dates', () => {
      test.each(allInvalidDateFixtures.map(fixture => [
        fixture.description,
        fixture.input,
        fixture.expected
      ]))(
        '%s',
        (description, input, expected) => {
          expect(isValidDate(input)).toBe(expected);
        }
      );
    });

    describe('Edge cases', () => {
      test('handles null value', () => {
        expect(isValidDate(null)).toBe(false);
      });

      test('handles undefined value', () => {
        expect(isValidDate(undefined)).toBe(false);
      });

      test('handles empty string', () => {
        expect(isValidDate('')).toBe(false);
      });

      test('handles whitespace string', () => {
        expect(isValidDate('   ')).toBe(false);
      });

      test('handles NaN', () => {
        expect(isValidDate(NaN)).toBe(false);
      });

      test('handles Infinity', () => {
        expect(isValidDate(Infinity)).toBe(false);
      });
    });
  });

  describe('isValidDateString', () => {
    describe('Valid date strings with correct format', () => {
      test('validates DD/MM/YYYY format', () => {
        expect(isValidDateString('15/01/2023', 'dd/MM/yyyy')).toBe(true);
      });

      test('validates MM/DD/YYYY format', () => {
        expect(isValidDateString('01/15/2023', 'MM/dd/yyyy', 'en-US')).toBe(true);
      });

      test('validates YYYY-MM-DD format', () => {
        expect(isValidDateString('2023-01-15', 'yyyy-MM-dd')).toBe(true);
      });

      test('validates date with time format', () => {
        expect(isValidDateString('15/01/2023 14:30', 'dd/MM/yyyy HH:mm')).toBe(true);
      });

      test('validates date with month name', () => {
        expect(isValidDateString('15 de janeiro de 2023', 'dd 'de' MMMM 'de' yyyy', 'pt-BR')).toBe(true);
      });

      test('validates English date with month name', () => {
        expect(isValidDateString('January 15, 2023', 'MMMM d, yyyy', 'en-US')).toBe(true);
      });
    });

    describe('Invalid date strings with correct format', () => {
      test('rejects non-existent date (31/04/2023)', () => {
        expect(isValidDateString('31/04/2023', 'dd/MM/yyyy')).toBe(false);
      });

      test('rejects February 29 in non-leap year', () => {
        expect(isValidDateString('29/02/2023', 'dd/MM/yyyy')).toBe(false);
      });

      test('accepts February 29 in leap year', () => {
        expect(isValidDateString('29/02/2020', 'dd/MM/yyyy')).toBe(true);
      });

      test('rejects invalid month (13)', () => {
        expect(isValidDateString('15/13/2023', 'dd/MM/yyyy')).toBe(false);
      });

      test('rejects invalid day (32)', () => {
        expect(isValidDateString('32/01/2023', 'dd/MM/yyyy')).toBe(false);
      });
    });

    describe('Format mismatch cases', () => {
      test('rejects date string with incorrect format', () => {
        expect(isValidDateString('2023-01-15', 'dd/MM/yyyy')).toBe(false);
      });

      test('rejects date string with partial format match', () => {
        expect(isValidDateString('15/01', 'dd/MM/yyyy')).toBe(false);
      });

      test('rejects date string with extra characters', () => {
        expect(isValidDateString('15/01/2023 extra', 'dd/MM/yyyy')).toBe(false);
      });
    });

    describe('Edge cases', () => {
      test('handles null value', () => {
        expect(isValidDateString(null as any, 'dd/MM/yyyy')).toBe(false);
      });

      test('handles undefined value', () => {
        expect(isValidDateString(undefined as any, 'dd/MM/yyyy')).toBe(false);
      });

      test('handles empty string', () => {
        expect(isValidDateString('', 'dd/MM/yyyy')).toBe(false);
      });

      test('handles whitespace string', () => {
        expect(isValidDateString('   ', 'dd/MM/yyyy')).toBe(false);
      });

      test('handles empty format string', () => {
        expect(isValidDateString('15/01/2023', '')).toBe(false);
      });

      test('handles invalid locale', () => {
        // Should fall back to default locale
        expect(isValidDateString('15/01/2023', 'dd/MM/yyyy', 'invalid-locale' as any)).toBe(true);
      });
    });
  });

  describe('isValidISODateString', () => {
    describe('Valid ISO date strings', () => {
      test.each(validISOStrings.map(fixture => [
        fixture.description,
        fixture.input
      ]))(
        '%s',
        (description, input) => {
          expect(isValidISODateString(input as string)).toBe(true);
        }
      );

      test('validates basic ISO date (YYYY-MM-DD)', () => {
        expect(isValidISODateString('2023-01-15')).toBe(true);
      });

      test('validates ISO datetime (YYYY-MM-DDTHH:MM:SS)', () => {
        expect(isValidISODateString('2023-01-15T14:30:45')).toBe(true);
      });

      test('validates ISO datetime with Z timezone (YYYY-MM-DDTHH:MM:SSZ)', () => {
        expect(isValidISODateString('2023-01-15T14:30:45Z')).toBe(true);
      });

      test('validates ISO datetime with offset timezone (YYYY-MM-DDTHH:MM:SS+HH:MM)', () => {
        expect(isValidISODateString('2023-01-15T14:30:45+03:00')).toBe(true);
      });

      test('validates ISO datetime with milliseconds', () => {
        expect(isValidISODateString('2023-01-15T14:30:45.123Z')).toBe(true);
      });
    });

    describe('Invalid ISO date strings', () => {
      test('rejects non-ISO format', () => {
        expect(isValidISODateString('15/01/2023')).toBe(false);
      });

      test('rejects invalid month in ISO format', () => {
        expect(isValidISODateString('2023-13-15')).toBe(false);
      });

      test('rejects invalid day in ISO format', () => {
        expect(isValidISODateString('2023-01-32')).toBe(false);
      });

      test('rejects February 29 in non-leap year', () => {
        expect(isValidISODateString('2023-02-29')).toBe(false);
      });

      test('rejects invalid time format', () => {
        expect(isValidISODateString('2023-01-15T25:30:45')).toBe(false);
      });

      test('rejects invalid timezone offset', () => {
        expect(isValidISODateString('2023-01-15T14:30:45+25:00')).toBe(false);
      });
    });

    describe('Edge cases', () => {
      test('handles null value', () => {
        expect(isValidISODateString(null as any)).toBe(false);
      });

      test('handles undefined value', () => {
        expect(isValidISODateString(undefined as any)).toBe(false);
      });

      test('handles empty string', () => {
        expect(isValidISODateString('')).toBe(false);
      });

      test('handles whitespace string', () => {
        expect(isValidISODateString('   ')).toBe(false);
      });

      test('handles non-string type', () => {
        expect(isValidISODateString(123 as any)).toBe(false);
      });
    });
  });

  describe('isDateInPast', () => {
    // Create a fixed reference date for consistent testing
    const referenceDate = new Date(2023, 0, 15); // January 15, 2023

    describe('Past dates', () => {
      test('identifies date object in the past', () => {
        const pastDate = new Date(2022, 0, 1); // January 1, 2022
        expect(isDateInPast(pastDate, referenceDate)).toBe(true);
      });

      test('identifies ISO string date in the past', () => {
        expect(isDateInPast('2022-01-01', referenceDate)).toBe(true);
      });

      test('identifies timestamp in the past', () => {
        const pastTimestamp = new Date(2022, 0, 1).getTime(); // January 1, 2022
        expect(isDateInPast(pastTimestamp, referenceDate)).toBe(true);
      });

      test('identifies date one day before reference', () => {
        const oneDayBefore = new Date(2023, 0, 14); // January 14, 2023
        expect(isDateInPast(oneDayBefore, referenceDate)).toBe(true);
      });

      test('identifies date one minute before reference', () => {
        const oneMinuteBefore = new Date(2023, 0, 15, 0, -1); // January 15, 2023, 23:59 previous day
        expect(isDateInPast(oneMinuteBefore, referenceDate)).toBe(true);
      });
    });

    describe('Non-past dates', () => {
      test('rejects current date (same as reference)', () => {
        const sameDate = new Date(2023, 0, 15); // January 15, 2023
        expect(isDateInPast(sameDate, referenceDate)).toBe(false);
      });

      test('rejects future date', () => {
        const futureDate = new Date(2023, 1, 1); // February 1, 2023
        expect(isDateInPast(futureDate, referenceDate)).toBe(false);
      });

      test('rejects future ISO string date', () => {
        expect(isDateInPast('2023-02-01', referenceDate)).toBe(false);
      });

      test('rejects future timestamp', () => {
        const futureTimestamp = new Date(2023, 1, 1).getTime(); // February 1, 2023
        expect(isDateInPast(futureTimestamp, referenceDate)).toBe(false);
      });
    });

    describe('Edge cases', () => {
      test('handles null value', () => {
        expect(isDateInPast(null, referenceDate)).toBe(false);
      });

      test('handles undefined value', () => {
        expect(isDateInPast(undefined, referenceDate)).toBe(false);
      });

      test('handles invalid date string', () => {
        expect(isDateInPast('not-a-date', referenceDate)).toBe(false);
      });

      test('uses current date as default reference if not provided', () => {
        // This test is time-dependent, so we mock Date.now
        const originalNow = Date.now;
        Date.now = jest.fn(() => new Date(2023, 0, 15).getTime());

        const pastDate = new Date(2022, 0, 1); // January 1, 2022
        expect(isDateInPast(pastDate)).toBe(true);

        // Restore original Date.now
        Date.now = originalNow;
      });
    });
  });

  describe('isDateInFuture', () => {
    // Create a fixed reference date for consistent testing
    const referenceDate = new Date(2023, 0, 15); // January 15, 2023

    describe('Future dates', () => {
      test('identifies date object in the future', () => {
        const futureDate = new Date(2023, 1, 1); // February 1, 2023
        expect(isDateInFuture(futureDate, referenceDate)).toBe(true);
      });

      test('identifies ISO string date in the future', () => {
        expect(isDateInFuture('2023-02-01', referenceDate)).toBe(true);
      });

      test('identifies timestamp in the future', () => {
        const futureTimestamp = new Date(2023, 1, 1).getTime(); // February 1, 2023
        expect(isDateInFuture(futureTimestamp, referenceDate)).toBe(true);
      });

      test('identifies date one day after reference', () => {
        const oneDayAfter = new Date(2023, 0, 16); // January 16, 2023
        expect(isDateInFuture(oneDayAfter, referenceDate)).toBe(true);
      });

      test('identifies date one minute after reference', () => {
        const oneMinuteAfter = new Date(2023, 0, 15, 0, 1); // January 15, 2023, 00:01
        expect(isDateInFuture(oneMinuteAfter, referenceDate)).toBe(true);
      });
    });

    describe('Non-future dates', () => {
      test('rejects current date (same as reference)', () => {
        const sameDate = new Date(2023, 0, 15); // January 15, 2023
        expect(isDateInFuture(sameDate, referenceDate)).toBe(false);
      });

      test('rejects past date', () => {
        const pastDate = new Date(2022, 0, 1); // January 1, 2022
        expect(isDateInFuture(pastDate, referenceDate)).toBe(false);
      });

      test('rejects past ISO string date', () => {
        expect(isDateInFuture('2022-01-01', referenceDate)).toBe(false);
      });

      test('rejects past timestamp', () => {
        const pastTimestamp = new Date(2022, 0, 1).getTime(); // January 1, 2022
        expect(isDateInFuture(pastTimestamp, referenceDate)).toBe(false);
      });
    });

    describe('Edge cases', () => {
      test('handles null value', () => {
        expect(isDateInFuture(null, referenceDate)).toBe(false);
      });

      test('handles undefined value', () => {
        expect(isDateInFuture(undefined, referenceDate)).toBe(false);
      });

      test('handles invalid date string', () => {
        expect(isDateInFuture('not-a-date', referenceDate)).toBe(false);
      });

      test('uses current date as default reference if not provided', () => {
        // This test is time-dependent, so we mock Date.now
        const originalNow = Date.now;
        Date.now = jest.fn(() => new Date(2023, 0, 15).getTime());

        const futureDate = new Date(2023, 1, 1); // February 1, 2023
        expect(isDateInFuture(futureDate)).toBe(true);

        // Restore original Date.now
        Date.now = originalNow;
      });
    });
  });

  describe('isValidDateRange', () => {
    describe('Valid date ranges', () => {
      test('validates range with start before end (Date objects)', () => {
        const startDate = new Date(2023, 0, 1); // January 1, 2023
        const endDate = new Date(2023, 0, 31); // January 31, 2023
        expect(isValidDateRange(startDate, endDate)).toBe(true);
      });

      test('validates range with start before end (ISO strings)', () => {
        expect(isValidDateRange('2023-01-01', '2023-01-31')).toBe(true);
      });

      test('validates range with start before end (timestamps)', () => {
        const startTimestamp = new Date(2023, 0, 1).getTime();
        const endTimestamp = new Date(2023, 0, 31).getTime();
        expect(isValidDateRange(startTimestamp, endTimestamp)).toBe(true);
      });

      test('validates range with same start and end date', () => {
        const sameDate = new Date(2023, 0, 15); // January 15, 2023
        expect(isValidDateRange(sameDate, sameDate)).toBe(true);
      });

      test('validates range with start one minute before end', () => {
        const startDate = new Date(2023, 0, 15, 14, 29); // January 15, 2023, 14:29
        const endDate = new Date(2023, 0, 15, 14, 30); // January 15, 2023, 14:30
        expect(isValidDateRange(startDate, endDate)).toBe(true);
      });
    });

    describe('Invalid date ranges', () => {
      test('rejects range with end before start (Date objects)', () => {
        const startDate = new Date(2023, 0, 31); // January 31, 2023
        const endDate = new Date(2023, 0, 1); // January 1, 2023
        expect(isValidDateRange(startDate, endDate)).toBe(false);
      });

      test('rejects range with end before start (ISO strings)', () => {
        expect(isValidDateRange('2023-01-31', '2023-01-01')).toBe(false);
      });

      test('rejects range with end before start (timestamps)', () => {
        const startTimestamp = new Date(2023, 0, 31).getTime();
        const endTimestamp = new Date(2023, 0, 1).getTime();
        expect(isValidDateRange(startTimestamp, endTimestamp)).toBe(false);
      });
    });

    describe('Edge cases', () => {
      test('handles null start date', () => {
        const endDate = new Date(2023, 0, 31); // January 31, 2023
        expect(isValidDateRange(null, endDate)).toBe(false);
      });

      test('handles null end date', () => {
        const startDate = new Date(2023, 0, 1); // January 1, 2023
        expect(isValidDateRange(startDate, null)).toBe(false);
      });

      test('handles undefined start date', () => {
        const endDate = new Date(2023, 0, 31); // January 31, 2023
        expect(isValidDateRange(undefined, endDate)).toBe(false);
      });

      test('handles undefined end date', () => {
        const startDate = new Date(2023, 0, 1); // January 1, 2023
        expect(isValidDateRange(startDate, undefined)).toBe(false);
      });

      test('handles invalid start date string', () => {
        expect(isValidDateRange('not-a-date', '2023-01-31')).toBe(false);
      });

      test('handles invalid end date string', () => {
        expect(isValidDateRange('2023-01-01', 'not-a-date')).toBe(false);
      });
    });
  });

  describe('isDateInRange', () => {
    describe('Dates within range', () => {
      test('identifies date within range (Date objects)', () => {
        const startDate = new Date(2023, 0, 1); // January 1, 2023
        const endDate = new Date(2023, 0, 31); // January 31, 2023
        const testDate = new Date(2023, 0, 15); // January 15, 2023
        expect(isDateInRange(testDate, startDate, endDate)).toBe(true);
      });

      test('identifies date within range (ISO strings)', () => {
        expect(isDateInRange('2023-01-15', '2023-01-01', '2023-01-31')).toBe(true);
      });

      test('identifies date within range (timestamps)', () => {
        const startTimestamp = new Date(2023, 0, 1).getTime();
        const endTimestamp = new Date(2023, 0, 31).getTime();
        const testTimestamp = new Date(2023, 0, 15).getTime();
        expect(isDateInRange(testTimestamp, startTimestamp, endTimestamp)).toBe(true);
      });

      test('identifies date equal to start date', () => {
        const startDate = new Date(2023, 0, 1); // January 1, 2023
        const endDate = new Date(2023, 0, 31); // January 31, 2023
        expect(isDateInRange(startDate, startDate, endDate)).toBe(true);
      });

      test('identifies date equal to end date', () => {
        const startDate = new Date(2023, 0, 1); // January 1, 2023
        const endDate = new Date(2023, 0, 31); // January 31, 2023
        expect(isDateInRange(endDate, startDate, endDate)).toBe(true);
      });
    });

    describe('Dates outside range', () => {
      test('rejects date before range (Date objects)', () => {
        const startDate = new Date(2023, 0, 1); // January 1, 2023
        const endDate = new Date(2023, 0, 31); // January 31, 2023
        const testDate = new Date(2022, 11, 31); // December 31, 2022
        expect(isDateInRange(testDate, startDate, endDate)).toBe(false);
      });

      test('rejects date after range (Date objects)', () => {
        const startDate = new Date(2023, 0, 1); // January 1, 2023
        const endDate = new Date(2023, 0, 31); // January 31, 2023
        const testDate = new Date(2023, 1, 1); // February 1, 2023
        expect(isDateInRange(testDate, startDate, endDate)).toBe(false);
      });

      test('rejects date before range (ISO strings)', () => {
        expect(isDateInRange('2022-12-31', '2023-01-01', '2023-01-31')).toBe(false);
      });

      test('rejects date after range (ISO strings)', () => {
        expect(isDateInRange('2023-02-01', '2023-01-01', '2023-01-31')).toBe(false);
      });
    });

    describe('Invalid ranges', () => {
      test('rejects when start date is after end date', () => {
        const startDate = new Date(2023, 0, 31); // January 31, 2023
        const endDate = new Date(2023, 0, 1); // January 1, 2023
        const testDate = new Date(2023, 0, 15); // January 15, 2023
        expect(isDateInRange(testDate, startDate, endDate)).toBe(false);
      });
    });

    describe('Edge cases', () => {
      test('handles null test date', () => {
        const startDate = new Date(2023, 0, 1); // January 1, 2023
        const endDate = new Date(2023, 0, 31); // January 31, 2023
        expect(isDateInRange(null, startDate, endDate)).toBe(false);
      });

      test('handles null start date', () => {
        const testDate = new Date(2023, 0, 15); // January 15, 2023
        const endDate = new Date(2023, 0, 31); // January 31, 2023
        expect(isDateInRange(testDate, null, endDate)).toBe(false);
      });

      test('handles null end date', () => {
        const testDate = new Date(2023, 0, 15); // January 15, 2023
        const startDate = new Date(2023, 0, 1); // January 1, 2023
        expect(isDateInRange(testDate, startDate, null)).toBe(false);
      });

      test('handles invalid test date string', () => {
        expect(isDateInRange('not-a-date', '2023-01-01', '2023-01-31')).toBe(false);
      });

      test('handles invalid start date string', () => {
        expect(isDateInRange('2023-01-15', 'not-a-date', '2023-01-31')).toBe(false);
      });

      test('handles invalid end date string', () => {
        expect(isDateInRange('2023-01-15', '2023-01-01', 'not-a-date')).toBe(false);
      });
    });
  });

  describe('isValidJourneyDate', () => {
    // Create a fixed reference date for consistent testing
    const currentDate = new Date(2023, 0, 15); // January 15, 2023
    const originalNow = Date.now;

    beforeAll(() => {
      // Mock Date.now for consistent testing
      Date.now = jest.fn(() => currentDate.getTime());
    });

    afterAll(() => {
      // Restore original Date.now
      Date.now = originalNow;
    });

    describe('Health journey validation', () => {
      test('accepts past date for health journey', () => {
        const pastDate = new Date(2022, 0, 1); // January 1, 2022
        expect(isValidJourneyDate(pastDate, 'health')).toBe(true);
      });

      test('accepts current date for health journey', () => {
        const today = new Date(currentDate);
        expect(isValidJourneyDate(today, 'health')).toBe(true);
      });

      test('rejects future date for health journey', () => {
        const futureDate = new Date(2023, 1, 1); // February 1, 2023
        expect(isValidJourneyDate(futureDate, 'health')).toBe(false);
      });
    });

    describe('Care journey validation', () => {
      test('accepts past date for care journey', () => {
        const pastDate = new Date(2022, 0, 1); // January 1, 2022
        expect(isValidJourneyDate(pastDate, 'care')).toBe(true);
      });

      test('accepts current date for care journey', () => {
        const today = new Date(currentDate);
        expect(isValidJourneyDate(today, 'care')).toBe(true);
      });

      test('accepts future date within 1 year for care journey', () => {
        const futureWithinYear = new Date(2023, 11, 31); // December 31, 2023
        expect(isValidJourneyDate(futureWithinYear, 'care')).toBe(true);
      });

      test('rejects future date beyond 1 year for care journey', () => {
        const futureBeyondYear = new Date(2024, 1, 1); // February 1, 2024
        expect(isValidJourneyDate(futureBeyondYear, 'care')).toBe(false);
      });
    });

    describe('Plan journey validation', () => {
      test('accepts current date for plan journey', () => {
        const today = new Date(currentDate);
        expect(isValidJourneyDate(today, 'plan')).toBe(true);
      });

      test('accepts date within past 5 years for plan journey', () => {
        const withinFiveYears = new Date(2018, 1, 1); // February 1, 2018
        expect(isValidJourneyDate(withinFiveYears, 'plan')).toBe(true);
      });

      test('rejects date beyond past 5 years for plan journey', () => {
        const beyondFiveYears = new Date(2017, 0, 14); // January 14, 2017
        expect(isValidJourneyDate(beyondFiveYears, 'plan')).toBe(false);
      });
    });

    describe('Unknown journey validation', () => {
      test('accepts valid date for unknown journey (default validation)', () => {
        const validDate = new Date(2023, 0, 15); // January 15, 2023
        expect(isValidJourneyDate(validDate, 'unknown-journey')).toBe(true);
      });

      test('rejects invalid date for unknown journey', () => {
        expect(isValidJourneyDate('not-a-date', 'unknown-journey')).toBe(false);
      });
    });

    describe('Case insensitivity', () => {
      test('handles journey ID with different case (HEALTH)', () => {
        const pastDate = new Date(2022, 0, 1); // January 1, 2022
        expect(isValidJourneyDate(pastDate, 'HEALTH')).toBe(true);
      });

      test('handles journey ID with mixed case (CaRe)', () => {
        const futureWithinYear = new Date(2023, 11, 31); // December 31, 2023
        expect(isValidJourneyDate(futureWithinYear, 'CaRe')).toBe(true);
      });
    });

    describe('Edge cases', () => {
      test('handles null date', () => {
        expect(isValidJourneyDate(null, 'health')).toBe(false);
      });

      test('handles undefined date', () => {
        expect(isValidJourneyDate(undefined, 'health')).toBe(false);
      });

      test('handles invalid date string', () => {
        expect(isValidJourneyDate('not-a-date', 'health')).toBe(false);
      });

      test('handles empty journey ID', () => {
        const validDate = new Date(2023, 0, 15); // January 15, 2023
        expect(isValidJourneyDate(validDate, '')).toBe(true); // Should use default validation
      });
    });
  });
});
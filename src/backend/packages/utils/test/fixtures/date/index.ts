/**
 * Date Test Fixtures
 * 
 * This barrel file exports all date-related test fixtures from the date fixtures directory,
 * providing a single import point for date-related test cases. It simplifies test fixture imports
 * and ensures consistent typing across all date utility tests.
 * 
 * @module date-fixtures
 */

/**
 * Common date fixtures used across multiple test files
 * 
 * These fixtures provide standardized date values in various formats to ensure
 * consistency across tests and reduce duplication.
 */
export * from './common-dates';

/**
 * Date formatting test fixtures
 * 
 * Fixtures for testing date formatting functions (formatDate, formatTime, formatDateTime,
 * formatDateRange, formatRelativeDate) with various locales and formats.
 */
export * from './format';

/**
 * Date parsing test fixtures
 * 
 * Fixtures for testing date parsing functions (parseDate) with various string formats,
 * locales, and validation scenarios.
 */
export * from './parse';

/**
 * Date validation test fixtures
 * 
 * Fixtures for testing date validation functions (isValidDate) with various
 * date representations and edge cases.
 */
export * from './validation';

/**
 * Date comparison test fixtures
 * 
 * Fixtures for testing date comparison functions (isSameDay, isDateInRange)
 * with various date pairs and ranges.
 */
export * from './comparison';

/**
 * Date calculation test fixtures
 * 
 * Fixtures for testing date calculation functions (calculateAge, getTimeAgo)
 * with various dates and expected results.
 */
export * from './calculation';

/**
 * Date range test fixtures
 * 
 * Fixtures for testing date range functions (getDateRange, getDatesBetween)
 * with various range types and reference dates.
 */
export * from './range';

/**
 * Journey-specific date formatting test fixtures
 * 
 * Fixtures for testing journey-specific date formatting functions (formatJourneyDate)
 * with dates for each journey context (Health, Care, Plan).
 */
export * from './journey';

/**
 * Timezone utility test fixtures
 * 
 * Fixtures for testing timezone utilities (getLocalTimezone) with various
 * timezone offsets and expected string formats.
 */
export * from './timezone';

/**
 * Categorized fixture collections
 * 
 * These collections group fixtures by their utility category for easier access
 * in test files. Import these objects to get all fixtures for a specific category.
 */
import * as commonDates from './common-dates';
import * as formatFixtures from './format';
import * as parseFixtures from './parse';
import * as validationFixtures from './validation';
import * as comparisonFixtures from './comparison';
import * as calculationFixtures from './calculation';
import * as rangeFixtures from './range';
import * as journeyFixtures from './journey';
import * as timezoneFixtures from './timezone';

/**
 * All date fixtures organized by category
 * 
 * This object provides access to all date fixtures grouped by their utility category.
 * Use this for importing multiple fixture categories at once.
 */
export const dateFixtures = {
  /** Common date fixtures used across tests */
  common: commonDates,
  
  /** Date formatting function fixtures */
  format: formatFixtures,
  
  /** Date parsing function fixtures */
  parse: parseFixtures,
  
  /** Date validation function fixtures */
  validation: validationFixtures,
  
  /** Date comparison function fixtures */
  comparison: comparisonFixtures,
  
  /** Date calculation function fixtures */
  calculation: calculationFixtures,
  
  /** Date range function fixtures */
  range: rangeFixtures,
  
  /** Journey-specific date formatting fixtures */
  journey: journeyFixtures,
  
  /** Timezone utility fixtures */
  timezone: timezoneFixtures
};

/**
 * Helper function to get all fixtures for a specific test type
 * 
 * @param testType - The type of test fixtures to retrieve
 * @returns All fixtures for the specified test type
 */
export function getFixturesByType(testType: keyof typeof dateFixtures) {
  return dateFixtures[testType];
}

/**
 * Helper function to get fixtures by tags across all categories
 * 
 * @param tags - Array of tags to filter by
 * @param matchAll - If true, all tags must match (AND logic), otherwise any tag can match (OR logic)
 * @returns Array of fixtures matching the specified tags
 */
export function getFixturesByTags(tags: string[], matchAll: boolean = true): any[] {
  // Collect all fixtures that have a tags property
  const allFixtures = Object.values(dateFixtures)
    .flatMap(category => Object.values(category))
    .filter(fixture => 
      Array.isArray(fixture) ? 
        fixture.some(item => item && typeof item === 'object' && 'tags' in item) :
        fixture && typeof fixture === 'object' && 'tags' in fixture
    );
  
  // Filter fixtures by tags
  return allFixtures.filter(fixture => {
    if (Array.isArray(fixture)) {
      return fixture.some(item => {
        if (item && typeof item === 'object' && 'tags' in item) {
          const itemTags = item.tags as string[];
          return matchAll ? 
            tags.every(tag => itemTags.includes(tag)) :
            tags.some(tag => itemTags.includes(tag));
        }
        return false;
      });
    } else if (fixture && typeof fixture === 'object' && 'tags' in fixture) {
      const fixtureTags = fixture.tags as string[];
      return matchAll ? 
        tags.every(tag => fixtureTags.includes(tag)) :
        tags.some(tag => fixtureTags.includes(tag));
    }
    return false;
  });
}
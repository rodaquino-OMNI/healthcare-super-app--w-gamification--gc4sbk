/**
 * Central barrel file that exports all date test fixtures
 * This file provides a single import point for date-related test cases
 */

// Export all date fixtures
export * from './calculation';
export * from './common-dates';
export * from './comparison';
export * from './format';
export * from './journey';
export * from './parse';
export * from './range';
export * from './timezone';
export * from './validation';

/**
 * Grouped exports by utility category for better organization
 */
import * as calculationFixtures from './calculation';
import * as commonDateFixtures from './common-dates';
import * as comparisonFixtures from './comparison';
import * as formatFixtures from './format';
import * as journeyFixtures from './journey';
import * as parseFixtures from './parse';
import * as rangeFixtures from './range';
import * as timezoneFixtures from './timezone';
import * as validationFixtures from './validation';

/**
 * Organized fixture groups for easier imports
 */
export const dateFixtures = {
  calculation: calculationFixtures,
  commonDates: commonDateFixtures,
  comparison: comparisonFixtures,
  format: formatFixtures,
  journey: journeyFixtures,
  parse: parseFixtures,
  range: rangeFixtures,
  timezone: timezoneFixtures,
  validation: validationFixtures
};

/**
 * Default export for simplified importing
 */
export default dateFixtures;
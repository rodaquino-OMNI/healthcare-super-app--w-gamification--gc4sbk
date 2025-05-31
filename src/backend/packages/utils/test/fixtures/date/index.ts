/**
 * @file Date Test Fixtures Index
 * 
 * This barrel file exports all date-related test fixtures from the date fixtures directory,
 * providing a single import point for date-related test cases. This simplifies test fixture
 * imports and ensures consistent typing across all date utility tests.
 * 
 * The fixtures are organized by utility category (format, parse, validation, etc.) to make
 * it easier to find and use the appropriate fixtures for each test case.
 */

/**
 * Common date fixtures used across multiple test files
 * 
 * These fixtures provide a set of standardized date values in various formats
 * to ensure consistency and reduce duplication in date-related tests.
 */
export * from './common-dates';

/**
 * Date formatting fixtures
 * 
 * Fixtures for testing date formatting functions (formatDate, formatTime, formatDateTime,
 * formatDateRange, formatRelativeDate) with expected formatted outputs.
 */
export * from './format';

/**
 * Date parsing fixtures
 * 
 * Fixtures for testing date parsing functions (parseDate) with string dates in
 * various formats paired with their expected Date object representations.
 */
export * from './parse';

/**
 * Date validation fixtures
 * 
 * Fixtures for testing date validation functions (isValidDate) with various
 * valid and invalid date representations.
 */
export * from './validation';

/**
 * Date comparison fixtures
 * 
 * Fixtures for testing date comparison functions (isSameDay, isDateInRange)
 * with date pairs for equality testing and date ranges.
 */
export * from './comparison';

/**
 * Date calculation fixtures
 * 
 * Fixtures for testing date calculation functions (calculateAge, getTimeAgo)
 * with birthdates, reference dates, and expected outputs.
 */
export * from './calculation';

/**
 * Date range fixtures
 * 
 * Fixtures for testing date range functions (getDateRange, getDatesBetween)
 * with predefined range types and expected start/end dates.
 */
export * from './range';

/**
 * Journey-specific date fixtures
 * 
 * Fixtures for testing journey-specific date formatting functions (formatJourneyDate)
 * with dates and expected outputs for each journey context.
 */
export * from './journey';

/**
 * Timezone fixtures
 * 
 * Fixtures for testing timezone utilities (getLocalTimezone) with dates
 * in different timezones and expected timezone string formats.
 */
export * from './timezone';

/**
 * Namespace for all date test fixtures
 * 
 * This namespace provides a structured way to access all date test fixtures
 * when more explicit imports are needed.
 */
export namespace DateFixtures {
  export * from './common-dates';
  export * from './format';
  export * from './parse';
  export * from './validation';
  export * from './comparison';
  export * from './calculation';
  export * from './range';
  export * from './journey';
  export * from './timezone';
}
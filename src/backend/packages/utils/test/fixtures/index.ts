/**
 * @file Central export point for all test fixtures used in the utils package tests.
 * 
 * This barrel file provides a single import point for all test fixtures, organized by utility category.
 * It simplifies test implementation by allowing developers to import all needed fixtures through a
 * single import statement, while maintaining proper TypeScript typing and documentation.
 * 
 * @example
 * // Import all fixtures
 * import * as fixtures from '@austa/utils/test/fixtures';
 * 
 * // Use specific fixture categories
 * import { arrayFixtures, dateFixtures } from '@austa/utils/test/fixtures';
 * 
 * // Import specific fixture types directly
 * import { basicArrays, formatDateFixtures } from '@austa/utils/test/fixtures';
 */

// Re-export all fixtures from subdirectories

/**
 * Array utility test fixtures for testing array manipulation functions.
 * Includes fixtures for basic arrays, filtering, mapping, sorting, and edge cases.
 */
export * as arrayFixtures from './array';
export * from './array';

/**
 * Date utility test fixtures for testing date manipulation, formatting, parsing, and validation.
 * Includes fixtures for various date formats, timezones, and locale-specific scenarios.
 */
export * as dateFixtures from './date';
export * from './date';

/**
 * Environment utility test fixtures for testing environment variable handling.
 * Includes mock environments, validation cases, and transformation scenarios.
 */
export * as envFixtures from './env';
export * from './env';

/**
 * HTTP utility test fixtures for testing HTTP client functionality.
 * Includes request/response objects, headers, URLs, and error scenarios.
 */
export * as httpFixtures from './http';
export * from './http';

/**
 * Object utility test fixtures for testing object manipulation functions.
 * Includes fixtures for object transformation, comparison, and property access.
 */
export * as objectFixtures from './object';
export * from './object';

/**
 * String utility test fixtures for testing string manipulation and validation.
 * Includes fixtures for formatting, validation, and special string handling like CPF validation.
 */
export * as stringFixtures from './string';
export * from './string';

/**
 * Type utility test fixtures for testing type guards, assertions, and conversions.
 * Includes fixtures for type checking, validation, and transformation.
 */
export * as typeFixtures from './type';
export * from './type';

/**
 * Validation utility test fixtures for testing input validation functions.
 * Includes fixtures for various validation scenarios including journey-specific validation,
 * input sanitization, configuration validation, and data format validation.
 */
export * as validationFixtures from './validation';
export * from './validation';

/**
 * All test fixtures combined into a single namespace for convenience.
 * This allows importing all fixtures as a single object when needed.
 * 
 * @example
 * import { allFixtures } from '@austa/utils/test/fixtures';
 * const { arrayFixtures, dateFixtures } = allFixtures;
 */
export const allFixtures = {
  arrayFixtures,
  dateFixtures,
  envFixtures,
  httpFixtures,
  objectFixtures,
  stringFixtures,
  typeFixtures,
  validationFixtures,
};
/**
 * @file Central export point for all test fixtures used in the utils package tests.
 * 
 * This barrel file provides a single import point for all test fixtures, organized by utility category.
 * It enables consistent and simplified importing of fixtures across all test files while maintaining
 * proper TypeScript typing for improved developer experience.
 * 
 * @example
 * // Import all fixtures from a specific category
 * import { arrayFixtures } from '@austa/utils/test/fixtures';
 * 
 * // Import specific fixtures directly
 * import { basicArrays, sortArrays } from '@austa/utils/test/fixtures';
 * 
 * // Import from a specific category with destructuring
 * import { dateFixtures } from '@austa/utils/test/fixtures';
 * const { formatFixtures, parseFixtures } = dateFixtures;
 */

// Array fixtures
export * from './array';
export * as arrayFixtures from './array';

// Date fixtures
export * from './date';
export * as dateFixtures from './date';

// Environment fixtures
export * from './env';
export * as envFixtures from './env';

// HTTP fixtures
export * from './http';
export * as httpFixtures from './http';

// Object fixtures
export * from './object';
export * as objectFixtures from './object';

// String fixtures
export * from './string';
export * as stringFixtures from './string';

// Type fixtures
export * from './type';
export * as typeFixtures from './type';

// Validation fixtures
export * from './validation';
export * as validationFixtures from './validation';

/**
 * Comprehensive collection of all test fixtures organized by utility category.
 * This object provides a structured way to access all fixtures when needed as a group.
 */
export const fixtures = {
  array: arrayFixtures,
  date: dateFixtures,
  env: envFixtures,
  http: httpFixtures,
  object: objectFixtures,
  string: stringFixtures,
  type: typeFixtures,
  validation: validationFixtures
};

/**
 * @typedef {Object} FixtureCollection
 * @property {typeof arrayFixtures} array - Array manipulation test fixtures
 * @property {typeof dateFixtures} date - Date handling test fixtures
 * @property {typeof envFixtures} env - Environment variable test fixtures
 * @property {typeof httpFixtures} http - HTTP request/response test fixtures
 * @property {typeof objectFixtures} object - Object manipulation test fixtures
 * @property {typeof stringFixtures} string - String manipulation test fixtures
 * @property {typeof typeFixtures} type - Type checking and conversion test fixtures
 * @property {typeof validationFixtures} validation - Input validation test fixtures
 */

// Type declaration for the fixtures object to improve IDE support
export type FixtureCollection = typeof fixtures;
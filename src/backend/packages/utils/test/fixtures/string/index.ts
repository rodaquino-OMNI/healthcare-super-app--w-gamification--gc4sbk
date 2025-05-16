/**
 * Barrel file for string test fixtures
 * 
 * This file exports all string test fixtures from both formatting and validation modules,
 * providing a single import point for test suites. This enables consistent and simplified
 * importing of string fixtures across all test files.
 *
 * @module StringTestFixtures
 */

// Export all types and fixtures from the formatting module
export * from './formatting.fixtures';

// Export all types and fixtures from the validation module
export * from './validation.fixtures';

// Re-export specific fixtures with namespace for more explicit imports
import { formattingFixtures } from './formatting.fixtures';
import { validationFixtures } from './validation.fixtures';

/**
 * Combined string test fixtures object that includes all fixture categories
 * This allows importing all fixtures at once with a single import statement
 */
export const stringFixtures = {
  formatting: formattingFixtures,
  validation: validationFixtures
};

/**
 * @example
 * // Import all fixtures
 * import { stringFixtures } from '@austa/utils/test/fixtures/string';
 * 
 * // Use formatting fixtures
 * const { input, expected } = stringFixtures.formatting.capitalize.normal[0];
 * 
 * // Use validation fixtures
 * const validCPF = stringFixtures.validation.cpf.valid.formatted[0];
 *
 * // Or import specific fixture categories directly
 * import { capitalizeFixtures, truncateFixtures } from '@austa/utils/test/fixtures/string';
 * import { cpfFixtures } from '@austa/utils/test/fixtures/string';
 */
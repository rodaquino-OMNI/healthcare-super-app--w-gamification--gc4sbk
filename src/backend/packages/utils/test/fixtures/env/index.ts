/**
 * Environment Test Fixtures
 * 
 * This module exports all environment test fixtures used for testing the environment
 * utilities in the @austa/utils package. It provides a centralized interface for importing
 * test fixtures, promoting cleaner and more maintainable test code.
 * 
 * Usage example:
 * ```typescript
 * import { mockEnvironments, validationCases } from '@austa/utils/test/fixtures/env';
 * 
 * describe('Environment Utilities', () => {
 *   it('should validate environment variables correctly', () => {
 *     const { valid, invalid } = validationCases.stringValidation;
 *     // Test implementation using fixtures
 *   });
 * });
 * ```
 */

// Export all environment test fixtures
export * from './mock-environments';
export * from './error-cases';
export * from './journey-cases';
export * from './transformation-cases';
export * from './validation-cases';
export * from './contexts';

// Re-export with more descriptive names for better discoverability
import * as mockEnvs from './mock-environments';
import * as errorCases from './error-cases';
import * as journeyCases from './journey-cases';
import * as transformCases from './transformation-cases';
import * as validateCases from './validation-cases';
import * as contextEnvs from './contexts';

/**
 * Complete mock environment objects for integration testing
 */
export const mockEnvironments = mockEnvs;

/**
 * Test cases for environment variable error handling scenarios
 */
export const environmentErrorCases = errorCases;

/**
 * Test fixtures for journey-specific environment variables
 */
export const journeyEnvironmentCases = journeyCases;

/**
 * Test cases for environment variable type transformations
 */
export const transformationCases = transformCases;

/**
 * Test cases for validating environment variables
 */
export const validationCases = validateCases;

/**
 * Mock environment objects representing different deployment contexts
 */
export const environmentContexts = contextEnvs;

/**
 * Categorized fixtures for easier consumption in tests
 */
export const fixtures = {
  /**
   * Complete environment objects for different scenarios
   */
  environments: {
    mock: mockEnvs,
    contexts: contextEnvs,
    journeys: journeyCases
  },
  
  /**
   * Test cases for validation and transformation
   */
  testCases: {
    validation: validateCases,
    transformation: transformCases,
    errors: errorCases
  }
};
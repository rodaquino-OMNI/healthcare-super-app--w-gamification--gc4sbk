/**
 * Barrel file that exports all environment test fixtures.
 * This provides a centralized access point for test fixtures used in environment utility tests,
 * promoting cleaner and more maintainable test code through consistent import patterns.
 */

// Export complete mock environment objects for integration testing
export * from './mock-environments';

// Export error handling test cases
export * from './error-cases';

// Export journey-specific environment variable test fixtures
export * from './journey-cases';

// Export type transformation test cases
export * from './transformation-cases';

// Export environment validation test cases
export * from './validation-cases';

// Export deployment context mock environments
export * from './contexts';

/**
 * Usage example in tests:
 * 
 * ```typescript
 * import { 
 *   developmentEnv,
 *   productionEnv,
 *   missingRequiredVarsCase,
 *   healthJourneyEnv,
 *   stringToNumberCases,
 *   urlValidationCases 
 * } from '../fixtures/env';
 * 
 * describe('Environment Utilities', () => {
 *   it('should properly validate environment variables', () => {
 *     // Test with the imported fixtures
 *   });
 * });
 * ```
 */
/**
 * @file Environment Variable Testing Utilities
 * 
 * This module provides a comprehensive set of utilities for testing environment variable
 * handling, validation, and configuration across the AUSTA SuperApp backend services.
 * 
 * These utilities enable consistent, isolated testing of environment-dependent code
 * without polluting the actual test environment, supporting the journey-centered
 * architecture's configuration needs.
 */

// Mock Environment Utilities
import {
  mockEnv,
  mockMultipleEnv,
  createEnvSnapshot,
  EnvSnapshot,
  MockEnvOptions,
} from './mock-env';

// Environment Restoration Utilities
import {
  restoreEnv,
  restoreEnvVariables,
  setupEnvRestoration,
  verifyMockedEnvironment,
} from './restore-env';

// Environment Fixtures
import {
  developmentEnvFixtures,
  stagingEnvFixtures,
  productionEnvFixtures,
  healthJourneyFixtures,
  careJourneyFixtures,
  planJourneyFixtures,
  errorCaseFixtures,
  integrationFixtures,
  featureFlagFixtures,
} from './fixtures';

// Journey-specific Testing Helpers
import {
  mockJourneyEnv,
  testJourneyPrefixing,
  testJourneyNamespaceIsolation,
  testCrossJourneyConfig,
  testJourneyDefaults,
  JourneyEnvOptions,
} from './journey-helpers';

// Validation Testing Helpers
import {
  testSchemaValidation,
  testTypeValidation,
  testPredicateValidation,
  validationErrorMatchers,
  testValidationErrorAggregation,
  ValidationTestOptions,
} from './validation-helpers';

/**
 * Mock a single environment variable for testing purposes.
 * 
 * @param key - The environment variable name to mock
 * @param value - The value to set for the environment variable
 * @param options - Optional configuration for the mocking behavior
 * 
 * @example
 * ```typescript
 * // Mock DATABASE_URL for testing
 * mockEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test_db');
 * 
 * // Mock with options to prevent overwriting existing variables
 * mockEnv('API_KEY', 'test-key', { overwrite: false });
 * ```
 * 
 * @returns An EnvSnapshot that can be used to restore the original environment
 */
export { mockEnv };

/**
 * Mock multiple environment variables at once for testing purposes.
 * 
 * @param envVariables - Object containing key-value pairs of environment variables to mock
 * @param options - Optional configuration for the mocking behavior
 * 
 * @example
 * ```typescript
 * // Mock multiple environment variables for database testing
 * mockMultipleEnv({
 *   DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
 *   DATABASE_POOL_SIZE: '5',
 *   DATABASE_CONNECTION_TIMEOUT: '5000'
 * });
 * ```
 * 
 * @returns An EnvSnapshot that can be used to restore the original environment
 */
export { mockMultipleEnv };

/**
 * Create a snapshot of the current environment variables for later restoration.
 * 
 * @example
 * ```typescript
 * // Create a snapshot before modifying environment
 * const snapshot = createEnvSnapshot();
 * 
 * // Modify environment for testing
 * process.env.TEST_VAR = 'test';
 * 
 * // Later restore the original environment
 * snapshot.restore();
 * ```
 * 
 * @returns An EnvSnapshot object with methods to restore the environment
 */
export { createEnvSnapshot };

/**
 * Type definition for environment snapshot objects.
 */
export type { EnvSnapshot };

/**
 * Configuration options for environment mocking functions.
 */
export type { MockEnvOptions };

/**
 * Restore the environment to its original state after testing.
 * 
 * @param snapshot - The environment snapshot to restore from
 * 
 * @example
 * ```typescript
 * // Create a snapshot and modify environment
 * const snapshot = createEnvSnapshot();
 * process.env.TEST_VAR = 'test';
 * 
 * // Restore the original environment
 * restoreEnv(snapshot);
 * ```
 */
export { restoreEnv };

/**
 * Restore specific environment variables to their original values.
 * 
 * @param snapshot - The environment snapshot to restore from
 * @param keys - Array of environment variable names to restore
 * 
 * @example
 * ```typescript
 * // Create a snapshot and modify multiple variables
 * const snapshot = createEnvSnapshot();
 * process.env.TEST_VAR1 = 'test1';
 * process.env.TEST_VAR2 = 'test2';
 * 
 * // Only restore TEST_VAR1
 * restoreEnvVariables(snapshot, ['TEST_VAR1']);
 * ```
 */
export { restoreEnvVariables };

/**
 * Set up automatic environment restoration with Jest afterEach/afterAll hooks.
 * 
 * @param options - Configuration options for the restoration behavior
 * 
 * @example
 * ```typescript
 * // In a Jest test file
 * beforeAll(() => {
 *   setupEnvRestoration({ useAfterEach: true });
 * });
 * 
 * test('environment test', () => {
 *   mockEnv('TEST_VAR', 'test');
 *   // Test with mocked environment
 *   // Environment will be automatically restored after test
 * });
 * ```
 */
export { setupEnvRestoration };

/**
 * Verify that the environment has been properly mocked before restoration.
 * 
 * @param snapshot - The environment snapshot to verify
 * 
 * @example
 * ```typescript
 * const snapshot = createEnvSnapshot();
 * // ... test code ...
 * 
 * // Verify environment was mocked before restoring
 * verifyMockedEnvironment(snapshot);
 * restoreEnv(snapshot);
 * ```
 * 
 * @throws Error if the environment snapshot is invalid or not from a mocked environment
 */
export { verifyMockedEnvironment };

/**
 * Environment fixtures for development environment testing.
 * 
 * @example
 * ```typescript
 * // Use development fixtures in a test
 * test('development config test', () => {
 *   mockMultipleEnv(developmentEnvFixtures.common);
 *   // Test with development environment variables
 * });
 * ```
 */
export { developmentEnvFixtures };

/**
 * Environment fixtures for staging environment testing.
 * 
 * @example
 * ```typescript
 * // Use staging fixtures in a test
 * test('staging config test', () => {
 *   mockMultipleEnv(stagingEnvFixtures.common);
 *   // Test with staging environment variables
 * });
 * ```
 */
export { stagingEnvFixtures };

/**
 * Environment fixtures for production environment testing.
 * 
 * @example
 * ```typescript
 * // Use production fixtures in a test
 * test('production config test', () => {
 *   mockMultipleEnv(productionEnvFixtures.common);
 *   // Test with production environment variables
 * });
 * ```
 */
export { productionEnvFixtures };

/**
 * Environment fixtures specific to the Health journey.
 * 
 * @example
 * ```typescript
 * // Use health journey fixtures in a test
 * test('health journey config test', () => {
 *   mockMultipleEnv(healthJourneyFixtures.common);
 *   // Test with health journey environment variables
 * });
 * ```
 */
export { healthJourneyFixtures };

/**
 * Environment fixtures specific to the Care journey.
 * 
 * @example
 * ```typescript
 * // Use care journey fixtures in a test
 * test('care journey config test', () => {
 *   mockMultipleEnv(careJourneyFixtures.common);
 *   // Test with care journey environment variables
 * });
 * ```
 */
export { careJourneyFixtures };

/**
 * Environment fixtures specific to the Plan journey.
 * 
 * @example
 * ```typescript
 * // Use plan journey fixtures in a test
 * test('plan journey config test', () => {
 *   mockMultipleEnv(planJourneyFixtures.common);
 *   // Test with plan journey environment variables
 * });
 * ```
 */
export { planJourneyFixtures };

/**
 * Environment fixtures for testing error cases and validation.
 * 
 * @example
 * ```typescript
 * // Use error case fixtures in a test
 * test('validation error test', () => {
 *   mockMultipleEnv(errorCaseFixtures.missingRequired);
 *   // Test validation error handling
 * });
 * ```
 */
export { errorCaseFixtures };

/**
 * Environment fixtures for external integration testing (Kafka, Redis, etc.).
 * 
 * @example
 * ```typescript
 * // Use Kafka integration fixtures
 * test('kafka config test', () => {
 *   mockMultipleEnv(integrationFixtures.kafka);
 *   // Test Kafka configuration handling
 * });
 * ```
 */
export { integrationFixtures };

/**
 * Environment fixtures for feature flag testing.
 * 
 * @example
 * ```typescript
 * // Use feature flag fixtures
 * test('feature flag test', () => {
 *   mockMultipleEnv(featureFlagFixtures.allEnabled);
 *   // Test with all feature flags enabled
 * });
 * ```
 */
export { featureFlagFixtures };

/**
 * Mock journey-specific environment variables for testing.
 * 
 * @param journey - The journey name ('health', 'care', or 'plan')
 * @param variables - Object containing journey-specific variables to mock
 * @param options - Optional configuration for the mocking behavior
 * 
 * @example
 * ```typescript
 * // Mock health journey environment variables
 * mockJourneyEnv('health', {
 *   API_URL: 'https://health-api.example.com',
 *   FEATURE_WEARABLES_SYNC: 'true'
 * });
 * ```
 * 
 * @returns An EnvSnapshot that can be used to restore the original environment
 */
export { mockJourneyEnv };

/**
 * Test that journey-specific environment variables are properly prefixed.
 * 
 * @param journey - The journey name to test
 * @param variables - Object containing variables that should be prefixed
 * 
 * @example
 * ```typescript
 * // Test that health journey variables are properly prefixed
 * testJourneyPrefixing('health', {
 *   API_URL: 'https://health-api.example.com',
 *   FEATURE_WEARABLES_SYNC: 'true'
 * });
 * ```
 */
export { testJourneyPrefixing };

/**
 * Test that journey namespaces are properly isolated from each other.
 * 
 * @param journeys - Array of journey names to test isolation between
 * 
 * @example
 * ```typescript
 * // Test isolation between health and care journeys
 * testJourneyNamespaceIsolation(['health', 'care']);
 * ```
 */
export { testJourneyNamespaceIsolation };

/**
 * Test that cross-journey shared configuration works correctly.
 * 
 * @param sharedConfig - Object containing shared configuration variables
 * @param journeys - Array of journey names that should share the configuration
 * 
 * @example
 * ```typescript
 * // Test shared configuration across all journeys
 * testCrossJourneyConfig(
 *   { LOG_LEVEL: 'info', TELEMETRY_ENABLED: 'true' },
 *   ['health', 'care', 'plan']
 * );
 * ```
 */
export { testCrossJourneyConfig };

/**
 * Test that journey-specific default values are applied correctly.
 * 
 * @param journey - The journey name to test
 * @param defaults - Object containing expected default values
 * 
 * @example
 * ```typescript
 * // Test default values for health journey
 * testJourneyDefaults('health', {
 *   METRICS_RETENTION_DAYS: '90',
 *   SYNC_INTERVAL: '15'
 * });
 * ```
 */
export { testJourneyDefaults };

/**
 * Configuration options for journey environment testing.
 */
export type { JourneyEnvOptions };

/**
 * Test that environment schema validation works correctly.
 * 
 * @param schema - The validation schema to test
 * @param validInput - Valid environment variables that should pass validation
 * @param invalidInput - Invalid environment variables that should fail validation
 * @param options - Optional configuration for the validation test
 * 
 * @example
 * ```typescript
 * // Test schema validation for database configuration
 * testSchemaValidation(
 *   databaseEnvSchema,
 *   { DATABASE_URL: 'postgresql://user:pass@localhost:5432/db' },
 *   { DATABASE_URL: 'invalid-url' }
 * );
 * ```
 */
export { testSchemaValidation };

/**
 * Test that type-specific environment validation works correctly.
 * 
 * @param validator - The type validator function to test
 * @param validValues - Array of values that should pass validation
 * @param invalidValues - Array of values that should fail validation
 * @param options - Optional configuration for the validation test
 * 
 * @example
 * ```typescript
 * // Test number validation
 * testTypeValidation(
 *   validateNumber,
 *   ['123', '456.78'],
 *   ['abc', '']  
 * );
 * ```
 */
export { testTypeValidation };

/**
 * Test that predicate-based environment validation works correctly.
 * 
 * @param predicate - The validation predicate function to test
 * @param validValues - Array of values that should pass the predicate
 * @param invalidValues - Array of values that should fail the predicate
 * @param options - Optional configuration for the validation test
 * 
 * @example
 * ```typescript
 * // Test port number validation
 * testPredicateValidation(
 *   isValidPort,
 *   ['80', '8080', '443'],
 *   ['0', '70000', '-1']
 * );
 * ```
 */
export { testPredicateValidation };

/**
 * Jest matchers for testing validation error patterns.
 * 
 * @example
 * ```typescript
 * // Use validation error matchers in a test
 * test('validation error test', () => {
 *   expect(() => validateEnv(invalidEnv))
 *     .toThrow(validationErrorMatchers.missingRequired('DATABASE_URL'));
 * });
 * ```
 */
export { validationErrorMatchers };

/**
 * Test that validation errors are properly aggregated.
 * 
 * @param validator - The validator function that should aggregate errors
 * @param invalidInput - Invalid input that should produce multiple errors
 * @param expectedErrors - Array of expected error messages or patterns
 * 
 * @example
 * ```typescript
 * // Test error aggregation
 * testValidationErrorAggregation(
 *   validateDatabaseConfig,
 *   { DATABASE_URL: 'invalid', DATABASE_POOL_SIZE: 'abc' },
 *   ['Invalid DATABASE_URL format', 'DATABASE_POOL_SIZE must be a number']
 * );
 * ```
 */
export { testValidationErrorAggregation };

/**
 * Configuration options for validation testing.
 */
export type { ValidationTestOptions };
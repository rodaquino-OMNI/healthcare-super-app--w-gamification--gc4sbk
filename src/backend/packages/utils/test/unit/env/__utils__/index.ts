/**
 * @file Environment Variable Testing Utilities
 * @description Centralized export point for all environment variable testing utilities.
 * These utilities enable consistent, isolated testing of environment-dependent code
 * across the AUSTA SuperApp backend services.
 */

/**
 * @module MockEnv
 * @description Utilities for safely mocking Node.js process.env during tests.
 * 
 * @example
 * // Mock a single environment variable
 * import { mockEnv, restoreEnv } from '@austa/utils/test/unit/env/__utils__';
 * 
 * describe('Environment-dependent tests', () => {
 *   afterEach(() => {
 *     restoreEnv();
 *   });
 * 
 *   it('should use mocked environment variable', () => {
 *     mockEnv('API_KEY', 'test-api-key');
 *     expect(process.env.API_KEY).toBe('test-api-key');
 *   });
 * });
 */
export * from './mock-env';

/**
 * @module RestoreEnv
 * @description Utilities for restoring the Node.js process.env to its original state
 * after tests that mock environment variables.
 * 
 * @example
 * // Automatically restore environment after each test
 * import { mockEnv, setupEnvRestore } from '@austa/utils/test/unit/env/__utils__';
 * 
 * describe('Environment tests', () => {
 *   // Setup automatic environment restoration
 *   setupEnvRestore();
 * 
 *   it('should mock and automatically restore env', () => {
 *     mockEnv('DEBUG', 'true');
 *     // Test runs with DEBUG=true
 *   });
 * 
 *   it('should have original env restored', () => {
 *     // DEBUG is back to its original value
 *     expect(process.env.DEBUG).not.toBe('true');
 *   });
 * });
 */
export * from './restore-env';

/**
 * @module Fixtures
 * @description Standardized environment variable fixtures for consistent testing
 * across different environments and journey contexts.
 * 
 * @example
 * // Use predefined environment fixtures
 * import { mockMultipleEnv, devEnvFixture } from '@austa/utils/test/unit/env/__utils__';
 * 
 * describe('Service with environment configuration', () => {
 *   it('should configure for development environment', () => {
 *     mockMultipleEnv(devEnvFixture);
 *     const service = new MyService();
 *     expect(service.isDevelopment()).toBe(true);
 *   });
 * });
 */
export * from './fixtures';

/**
 * @module ValidationHelpers
 * @description Utilities for testing environment variable validation logic,
 * including schema-based validators and validation error matchers.
 * 
 * @example
 * // Test environment validation
 * import { 
 *   mockEnv, 
 *   expectMissingEnvError,
 *   expectInvalidFormatError 
 * } from '@austa/utils/test/unit/env/__utils__';
 * 
 * describe('Environment validation', () => {
 *   it('should detect missing required variables', () => {
 *     mockEnv('REQUIRED_VAR', undefined);
 *     expectMissingEnvError(() => {
 *       validateEnvironment();
 *     }, 'REQUIRED_VAR');
 *   });
 * 
 *   it('should validate numeric format', () => {
 *     mockEnv('PORT', 'not-a-number');
 *     expectInvalidFormatError(() => {
 *       validateEnvironment();
 *     }, 'PORT', 'number');
 *   });
 * });
 */
export * from './validation-helpers';

/**
 * @module JourneyHelpers
 * @description Specialized utilities for testing journey-specific environment
 * variables across Health, Care, and Plan journeys.
 * 
 * @example
 * // Test journey-specific environment configuration
 * import { 
 *   mockJourneyEnv,
 *   expectJourneyIsolation 
 * } from '@austa/utils/test/unit/env/__utils__';
 * 
 * describe('Journey environment configuration', () => {
 *   it('should isolate journey-specific variables', () => {
 *     mockJourneyEnv('health', 'API_ENDPOINT', 'https://health-api.example.com');
 *     mockJourneyEnv('care', 'API_ENDPOINT', 'https://care-api.example.com');
 *     
 *     expectJourneyIsolation('API_ENDPOINT', ['health', 'care']);
 *   });
 * });
 */
export * from './journey-helpers';
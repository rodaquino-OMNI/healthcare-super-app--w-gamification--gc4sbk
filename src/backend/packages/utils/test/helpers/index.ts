/**
 * @file Test Helpers Index
 * 
 * This barrel file exports all test helper functions from utility-specific helper files,
 * providing a convenient single import point for test utilities. This enables consistent
 * and simplified imports across all utility tests, reducing import complexity and ensuring
 * standardized testing patterns.
 * 
 * The exports are organized by utility category to mirror the structure of the utils package.
 */

// Common helpers used across all utility categories
export * from './common.helpers';

// Array utility test helpers
export * as arrayHelpers from './array.helpers';

// Date utility test helpers
export * as dateHelpers from './date.helpers';

// Environment utility test helpers
export * as envHelpers from './env.helpers';

// HTTP utility test helpers
export * as httpHelpers from './http.helpers';

// Object utility test helpers
export * as objectHelpers from './object.helpers';

// String utility test helpers
export * as stringHelpers from './string.helpers';

// Type utility test helpers
export * as typeHelpers from './type.helpers';

// Validation utility test helpers
export * as validationHelpers from './validation.helpers';

/**
 * Re-export all helpers in a flat structure for backward compatibility
 * with existing tests that may be using the old import pattern.
 */
export {
  // Array helpers
  createTestArray,
  generateArrayOfSize,
  createNestedArray,
  compareArrays,
  createArrayWithNulls,
  mockArrayTransformation,
} from './array.helpers';

// Date helpers
export {
  createTestDate,
  mockTimezone,
  createDateRange,
  compareDates,
  createFixedDate,
  mockDateFunctions,
} from './date.helpers';

// Environment helpers
export {
  mockEnvVariable,
  restoreEnvVariables,
  createTestConfig,
  mockJourneyEnv,
  withMockedEnv,
} from './env.helpers';

// HTTP helpers
export {
  createMockAxiosInstance,
  mockHttpResponse,
  createRequestInterceptor,
  mockSsrfProtection,
  simulateNetworkError,
} from './http.helpers';

// Object helpers
export {
  createTestObject,
  generateNestedObject,
  compareObjects,
  createObjectWithNulls,
  mockObjectTransformation,
} from './object.helpers';

// String helpers
export {
  generateRandomString,
  generateValidCpf,
  generateInvalidCpf,
  createStringOfLength,
  mockStringTransformation,
} from './string.helpers';

// Type helpers
export {
  createValueOfType,
  mockTypeGuard,
  testTypeAssertion,
  createMixedTypeArray,
  mockTypeConversion,
} from './type.helpers';

// Validation helpers
export {
  createValidationSchema,
  generateValidData,
  generateInvalidData,
  mockValidator,
  testSchemaValidation,
} from './validation.helpers';
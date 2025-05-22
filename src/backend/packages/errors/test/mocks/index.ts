/**
 * @file Centralized export point for all mock implementations used in testing the error handling framework.
 * 
 * This barrel file simplifies importing mock services in test files by providing a single entry point,
 * promoting consistent testing patterns across the codebase. It exports all mock implementations
 * including LoggerMock, TracingMock, HttpClientMock, NestComponentsMock, and KafkaMock, along with
 * their related factory functions and testing utilities.
 */

// Logger mock exports
export * from './logger.mock';

// Tracing mock exports
export * from './tracing.mock';

// HTTP client mock exports
export * from './http-client.mock';

// NestJS components mock exports
export * from './nest-components.mock';

// Kafka mock exports
export * from './kafka.mock';

/**
 * Utility function to create a complete test environment with all mocks pre-configured.
 * This is useful for integration tests that need multiple mocked services.
 * 
 * @example
 * ```typescript
 * const { loggerMock, tracingMock, httpClientMock, kafkaMock } = createTestEnvironment();
 * 
 * // Use mocks in your test
 * expect(loggerMock.error).toHaveBeenCalledWith('Error message');
 * expect(tracingMock.recordError).toHaveBeenCalledWith(expect.any(Error));
 * ```
 * 
 * @returns An object containing all pre-configured mock instances
 */
export function createTestEnvironment() {
  // Import specific factory functions from individual mock files
  const { createLoggerMock } = require('./logger.mock');
  const { createTracingMock } = require('./tracing.mock');
  const { createHttpClientMock } = require('./http-client.mock');
  const { createNestExecutionContext } = require('./nest-components.mock');
  const { createKafkaMock } = require('./kafka.mock');

  return {
    loggerMock: createLoggerMock(),
    tracingMock: createTracingMock(),
    httpClientMock: createHttpClientMock(),
    executionContextMock: createNestExecutionContext(),
    kafkaMock: createKafkaMock(),
  };
}

/**
 * Utility function to reset all mocks in a test environment.
 * This is useful for cleaning up between tests.
 * 
 * @example
 * ```typescript
 * const testEnv = createTestEnvironment();
 * 
 * // After test
 * resetTestEnvironment(testEnv);
 * ```
 * 
 * @param testEnv The test environment object returned by createTestEnvironment
 */
export function resetTestEnvironment(testEnv: ReturnType<typeof createTestEnvironment>) {
  // Reset each mock
  testEnv.loggerMock.clearLogs();
  testEnv.tracingMock.clearSpans();
  testEnv.httpClientMock.clearRequests();
  testEnv.kafkaMock.clearMessages();
}

/**
 * Utility type that represents a complete mock test environment.
 * Useful for typing test setup functions.
 */
export type TestEnvironment = ReturnType<typeof createTestEnvironment>;

/**
 * Utility function to create error scenarios for testing error handling.
 * This provides common error patterns that can be used across tests.
 * 
 * @example
 * ```typescript
 * const { networkError, timeoutError, validationError } = createErrorScenarios();
 * 
 * // Use in tests
 * httpClientMock.mockRejectedValue(networkError);
 * ```
 * 
 * @returns An object containing pre-configured error instances for different scenarios
 */
export function createErrorScenarios() {
  return {
    networkError: new Error('Network error'),
    timeoutError: new Error('Request timeout'),
    validationError: new Error('Validation failed'),
    unauthorizedError: new Error('Unauthorized'),
    notFoundError: new Error('Resource not found'),
    serverError: new Error('Internal server error'),
  };
}
/**
 * @file Centralized export point for all mock implementations used in testing the error handling framework.
 * 
 * This barrel file simplifies importing mock services in test files by providing a single entry point,
 * promoting consistent testing patterns across the codebase. It exports all mock implementations
 * including LoggerMock, TracingMock, HttpClientMock, NestComponentsMock, and KafkaMock, along with
 * their related factory functions and testing utilities.
 */

// Logger mocks for testing error logging behavior
export * from './logger.mock';

// Tracing mocks for testing error span recording
export * from './tracing.mock';

// HTTP client mocks for testing external system error handling
export * from './http-client.mock';

// NestJS component mocks for testing exception filters and interceptors
export * from './nest-components.mock';

// Kafka mocks for testing event processing error handling
export * from './kafka.mock';

/**
 * Utility function to create a complete test environment with all mocks pre-configured.
 * This provides a convenient way to set up a consistent testing environment across test suites.
 * 
 * @example
 * ```typescript
 * const { loggerMock, tracingMock, httpClientMock, nestMocks, kafkaMock } = createTestEnvironment();
 * 
 * // Use mocks in your tests
 * test('should log error with proper context', () => {
 *   const error = new BaseError('Test error');
 *   errorHandler.handleError(error);
 *   
 *   expect(loggerMock.error).toHaveBeenCalledWith(
 *     expect.stringContaining('Test error'),
 *     expect.objectContaining({ errorId: expect.any(String) })
 *   );
 * });
 * ```
 * 
 * @returns An object containing all pre-configured mocks for testing
 */
export function createTestEnvironment() {
  // Import individual factory functions from each mock file
  const { createLoggerMock } = require('./logger.mock');
  const { createTracingMock } = require('./tracing.mock');
  const { createHttpClientMock } = require('./http-client.mock');
  const { createNestMocks } = require('./nest-components.mock');
  const { createKafkaMock } = require('./kafka.mock');

  // Create instances of each mock
  const loggerMock = createLoggerMock();
  const tracingMock = createTracingMock();
  const httpClientMock = createHttpClientMock();
  const nestMocks = createNestMocks();
  const kafkaMock = createKafkaMock();

  return {
    loggerMock,
    tracingMock,
    httpClientMock,
    nestMocks,
    kafkaMock,
    // Add utility functions for common testing scenarios
    resetAllMocks: () => {
      loggerMock.clearLogs();
      tracingMock.clearSpans();
      httpClientMock.clearRequests();
      kafkaMock.clearMessages();
    },
    // Helper for verifying error propagation across services
    verifyErrorPropagation: (error: any) => {
      const errorWasLogged = loggerMock.getLogEntries().some(
        entry => entry.level === 'error' && entry.message.includes(error.message)
      );
      
      const errorWasTraced = tracingMock.getRecordedErrors().some(
        e => e.message === error.message
      );
      
      return { errorWasLogged, errorWasTraced };
    },
    // Helper for journey-specific error testing
    createJourneyContext: (journey: 'health' | 'care' | 'plan', userId?: string) => {
      return {
        journey,
        userId: userId || 'test-user-id',
        requestId: 'test-request-id',
        sessionId: 'test-session-id'
      };
    }
  };
}

/**
 * Re-export common test utilities that are useful when working with error mocks
 */
export const testUtils = {
  /**
   * Creates a mock HTTP response object for testing exception filters
   * 
   * @param overrides Custom properties to override in the mock response
   * @returns A mock HTTP response object with testing utility methods
   */
  createMockResponse: (overrides = {}) => {
    const { createMockResponse } = require('./nest-components.mock');
    return createMockResponse(overrides);
  },
  
  /**
   * Creates a mock HTTP request object for testing exception filters
   * 
   * @param overrides Custom properties to override in the mock request
   * @returns A mock HTTP request object
   */
  createMockRequest: (overrides = {}) => {
    const { createMockRequest } = require('./nest-components.mock');
    return createMockRequest(overrides);
  },
  
  /**
   * Creates a mock Kafka message for testing event error handling
   * 
   * @param payload The message payload
   * @param headers Optional Kafka headers
   * @returns A mock Kafka message object
   */
  createMockKafkaMessage: (payload: any, headers = {}) => {
    const { createMockKafkaMessage } = require('./kafka.mock');
    return createMockKafkaMessage(payload, headers);
  },
  
  /**
   * Creates a mock HTTP error for testing HTTP client error handling
   * 
   * @param status HTTP status code
   * @param data Response data
   * @returns A mock HTTP error object
   */
  createMockHttpError: (status: number, data: any) => {
    const { createMockHttpError } = require('./http-client.mock');
    return createMockHttpError(status, data);
  }
};
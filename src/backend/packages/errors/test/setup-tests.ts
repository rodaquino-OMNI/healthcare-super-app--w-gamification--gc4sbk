/**
 * Global setup and configuration for all tests in the error handling framework.
 * This file runs before tests execution to configure the testing environment,
 * set up global mocks for external dependencies, define custom matchers for
 * easier error assertions, and initialize the testing database if needed.
 */

import { jest } from '@jest/globals';

// Mock implementations for external dependencies

/**
 * Mock implementation of the Logger service
 */
const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  // Utility methods for testing
  getLogEntries: jest.fn().mockReturnValue([]),
  clearLogs: jest.fn(),
};

/**
 * Mock implementation of the Tracing service
 */
const mockTracer = {
  createSpan: jest.fn().mockImplementation((name, fn) => fn()),
  recordError: jest.fn(),
  getCurrentSpan: jest.fn(),
  getTraceId: jest.fn().mockReturnValue('mock-trace-id'),
  // Utility methods for testing
  getRecordedErrors: jest.fn().mockReturnValue([]),
  clearRecordedErrors: jest.fn(),
};

// Global mocks setup
jest.mock('@austa/logging', () => ({
  Logger: mockLogger,
  LogLevel: {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    FATAL: 'FATAL',
  },
}));

jest.mock('@austa/tracing', () => ({
  Tracer: mockTracer,
  SpanStatus: {
    OK: 'OK',
    ERROR: 'ERROR',
  },
}));

// Custom matchers for error assertions
declare global {
  namespace jest {
    interface Matchers<R> {
      /**
       * Checks if the received value is an error of the specified type
       */
      toBeErrorType(expectedType: string): R;
      
      /**
       * Checks if the received error contains the specified error code
       */
      toHaveErrorCode(expectedCode: string): R;
      
      /**
       * Checks if the received error has journey context with the specified journey
       */
      toHaveJourneyContext(expectedJourney: 'health' | 'care' | 'plan'): R;
      
      /**
       * Checks if the received error serializes to the expected response structure
       */
      toMatchErrorResponse(expectedResponse: Record<string, any>): R;
      
      /**
       * Checks if the received error has the expected HTTP status code
       */
      toHaveHttpStatus(expectedStatus: number): R;
    }
  }
}

// Implement custom matchers
expect.extend({
  toBeErrorType(received, expectedType) {
    const pass = received && 
                 received.errorType && 
                 received.errorType === expectedType;
    
    if (pass) {
      return {
        message: () => `Expected error not to be of type ${expectedType}`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected error to be of type ${expectedType}, but got ${received?.errorType || 'undefined'}`,
        pass: false,
      };
    }
  },
  
  toHaveErrorCode(received, expectedCode) {
    const pass = received && 
                 received.code && 
                 received.code === expectedCode;
    
    if (pass) {
      return {
        message: () => `Expected error not to have code ${expectedCode}`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected error to have code ${expectedCode}, but got ${received?.code || 'undefined'}`,
        pass: false,
      };
    }
  },
  
  toHaveJourneyContext(received, expectedJourney) {
    const pass = received && 
                 received.context && 
                 received.context.journey === expectedJourney;
    
    if (pass) {
      return {
        message: () => `Expected error not to have journey context for ${expectedJourney}`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected error to have journey context for ${expectedJourney}, but got ${received?.context?.journey || 'undefined'}`,
        pass: false,
      };
    }
  },
  
  toMatchErrorResponse(received, expectedResponse) {
    // Get serialized error response
    const serialized = received && typeof received.toResponse === 'function' 
      ? received.toResponse() 
      : received;
    
    // Check if all expected properties exist with correct values
    const missingKeys = [];
    const mismatchedValues = [];
    
    for (const key in expectedResponse) {
      if (!(key in serialized)) {
        missingKeys.push(key);
      } else if (JSON.stringify(serialized[key]) !== JSON.stringify(expectedResponse[key])) {
        mismatchedValues.push({
          key,
          expected: expectedResponse[key],
          received: serialized[key],
        });
      }
    }
    
    const pass = missingKeys.length === 0 && mismatchedValues.length === 0;
    
    if (pass) {
      return {
        message: () => `Expected error response not to match ${JSON.stringify(expectedResponse)}`,
        pass: true,
      };
    } else {
      let message = `Expected error response to match ${JSON.stringify(expectedResponse)}, but `;
      
      if (missingKeys.length > 0) {
        message += `missing keys: ${missingKeys.join(', ')}. `;
      }
      
      if (mismatchedValues.length > 0) {
        message += `mismatched values: ${JSON.stringify(mismatchedValues)}. `;
      }
      
      return {
        message: () => message,
        pass: false,
      };
    }
  },
  
  toHaveHttpStatus(received, expectedStatus) {
    const status = received && 
                  (received.statusCode || 
                   (received.getStatus && received.getStatus()) || 
                   (received.httpStatus));
    
    const pass = status === expectedStatus;
    
    if (pass) {
      return {
        message: () => `Expected error not to have HTTP status ${expectedStatus}`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected error to have HTTP status ${expectedStatus}, but got ${status || 'undefined'}`,
        pass: false,
      };
    }
  },
});

// Global error serialization utilities
global.serializeError = (error: any) => {
  if (error && typeof error.toResponse === 'function') {
    return error.toResponse();
  }
  return error;
};

// Cleanup between tests
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  // Clear mock logger and tracer data
  mockLogger.clearLogs();
  mockTracer.clearRecordedErrors();
});

// Export mock instances for direct access in tests
export { mockLogger, mockTracer };
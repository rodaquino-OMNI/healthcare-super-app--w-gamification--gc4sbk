/**
 * Global test setup for the @austa/errors package
 * 
 * This file configures the testing environment for all tests in the error handling framework.
 * It sets up global mocks for external dependencies, defines custom matchers for error assertions,
 * and ensures consistent test behavior across all test suites.
 *
 * Features:
 * - Configures custom Jest matchers for error assertions
 * - Sets up global mocks for external dependencies (logger, tracing, HTTP, Kafka)
 * - Provides journey-specific error testing utilities
 * - Ensures cleanup between tests to prevent test pollution
 * - Configures error serialization for snapshot testing
 */

import { LoggerMock } from './mocks/logger.mock';
import { TracingMock } from './mocks/tracing.mock';
import { HttpClientMock } from './mocks/http-client.mock';
import { KafkaMock } from './mocks/kafka.mock';
import { NestComponentsMock } from './mocks/nest-components.mock';
import { configureTestMatchers } from './helpers/test-matchers';
import { createErrorFactory } from './helpers/error-factory';

// Extend Jest with custom error matchers
configureTestMatchers();

// Create global mock instances
const loggerMock = new LoggerMock();
const tracingMock = new TracingMock();
const httpClientMock = HttpClientMock.createDefault();
const kafkaMock = new KafkaMock();
const nestComponentsMock = new NestComponentsMock();

// Create journey-specific error factories
const errorFactory = createErrorFactory();
const healthErrorFactory = createErrorFactory('health');
const careErrorFactory = createErrorFactory('care');
const planErrorFactory = createErrorFactory('plan');

// Make mocks and utilities available globally
global.__mocks__ = {
  logger: loggerMock,
  tracing: tracingMock,
  httpClient: httpClientMock,
  kafka: kafkaMock,
  nest: nestComponentsMock,
  errorFactory,
  journeyErrors: {
    health: healthErrorFactory,
    care: careErrorFactory,
    plan: planErrorFactory,
  },
};

// Mock external modules
jest.mock('@austa/logging', () => ({
  LoggerService: jest.fn().mockImplementation(() => loggerMock),
  getLogger: jest.fn().mockReturnValue(loggerMock),
  createLogger: jest.fn().mockReturnValue(loggerMock),
}));

jest.mock('@austa/tracing', () => ({
  TracingService: jest.fn().mockImplementation(() => tracingMock),
  getTracer: jest.fn().mockReturnValue(tracingMock),
  createTracer: jest.fn().mockReturnValue(tracingMock),
  SpanStatusCode: {
    ERROR: 'ERROR',
    OK: 'OK',
  },
}));

// Mock axios for HTTP client tests
jest.mock('axios', () => httpClientMock);

// Mock Kafka client
jest.mock('@nestjs/microservices', () => {
  const original = jest.requireActual('@nestjs/microservices');
  return {
    ...original,
    ClientKafka: jest.fn().mockImplementation(() => kafkaMock),
  };
});

// Mock NestJS common modules
jest.mock('@nestjs/common', () => {
  const original = jest.requireActual('@nestjs/common');
  return {
    ...original,
    ArgumentsHost: jest.fn().mockImplementation(() => nestComponentsMock.createArgumentsHost()),
    ExecutionContext: jest.fn().mockImplementation(() => nestComponentsMock.createExecutionContext()),
  };
});

// Mock database-related errors
jest.mock('@austa/database', () => {
  const original = jest.requireActual('@austa/database');
  return {
    ...original,
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      code: string;
      meta?: Record<string, any>;
      clientVersion: string;
      
      constructor(message: string, { code, meta, clientVersion }: any) {
        super(message);
        this.name = 'PrismaClientKnownRequestError';
        this.code = code;
        this.meta = meta;
        this.clientVersion = clientVersion;
      }
    },
    PrismaClientValidationError: class PrismaClientValidationError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'PrismaClientValidationError';
      }
    },
  };
});

// Set up environment variables for testing
process.env.NODE_ENV = 'test';

// This line is now moved to the section below
process.env.LOG_LEVEL = 'error'; // Reduce noise in test output
process.env.DISABLE_ERROR_TRACKING = 'true'; // Disable external error tracking in tests

// Clean up mocks between tests
beforeEach(() => {
  // Reset all mock implementations and history
  jest.clearAllMocks();
  
  // Reset logger mock history
  loggerMock.clearLogs();
  
  // Reset tracing mock history
  tracingMock.clearSpans();
  
  // Reset HTTP client mock
  httpClientMock.reset();
  
  // Reset Kafka mock
  kafkaMock.clearMessages();
  
  // Reset NestJS components mock
  nestComponentsMock.reset();
});

// Global teardown after all tests
afterAll(() => {
  // Perform any necessary cleanup after all tests have run
  jest.restoreAllMocks();
});

/**
 * Helper function to access the global mocks in tests
 * 
 * @example
 * // In a test file:
 * const { logger, tracing } = getMocks();
 * expect(logger.error).toHaveBeenCalledWith('Error message');
 */
export const getMocks = () => global.__mocks__;

/**
 * Helper function to create a test error with the appropriate journey context
 * 
 * @example
 * // In a test file:
 * const error = createTestError('health', 'VALIDATION_ERROR', 'Invalid health metric');
 * expect(error.journeyContext).toBe('health');
 */
export const createTestError = (journey: 'health' | 'care' | 'plan', code: string, message: string) => {
  return global.__mocks__.journeyErrors[journey].create(code, message);
};

/**
 * Helper function to simulate a database error for testing error handling
 * 
 * @example
 * // In a test file:
 * const dbError = createDatabaseError('P2002', { target: ['email'] });
 * // Test how your code handles unique constraint violations
 */
export const createDatabaseError = (code: string, meta?: Record<string, any>) => {
  const { PrismaClientKnownRequestError } = jest.requireMock('@austa/database');
  return new PrismaClientKnownRequestError(
    `Database error with code ${code}`,
    { code, meta, clientVersion: '4.7.0' }
  );
};

// Type definitions for global mocks
declare global {
  // eslint-disable-next-line no-var
  var __mocks__: {
    logger: LoggerMock;
    tracing: TracingMock;
    httpClient: HttpClientMock;
    kafka: KafkaMock;
    nest: NestComponentsMock;
    errorFactory: ReturnType<typeof createErrorFactory>;
    journeyErrors: {
      health: ReturnType<typeof createErrorFactory>;
      care: ReturnType<typeof createErrorFactory>;
      plan: ReturnType<typeof createErrorFactory>;
    };
  };
}

// Set up serialization utilities for error objects
// This ensures that error objects can be properly compared in test assertions
expect.addSnapshotSerializer({
  test: (val) => val instanceof Error,
  print: (val, serialize) => {
    const error = val as Error;
    const serialized = {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n')[0] || '',
      // Include additional properties for custom error types
      ...(error as any),
    };
    
    // Remove non-serializable properties and functions
    delete serialized.stack;
    Object.keys(serialized).forEach(key => {
      if (typeof serialized[key] === 'function') {
        delete serialized[key];
      }
    });
    
    return serialize(serialized);
  },
});

// Configure global test timeout (useful for async error tests with retries)
jest.setTimeout(10000);

/**
 * Utility to wait for async operations in tests
 * Useful when testing retry mechanisms or delayed error handling
 * 
 * @param ms Time to wait in milliseconds
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Utility to create a mock HTTP response for testing error handling
 * 
 * @param status HTTP status code
 * @param data Response data
 * @param headers Response headers
 */
export const createMockHttpResponse = (status: number, data: any, headers: Record<string, string> = {}) => {
  return {
    status,
    data,
    headers,
    config: {},
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
  };
};

// Export all test helpers for convenience
export * from './helpers/assertion-helpers';
export * from './helpers/error-factory';
export * from './helpers/test-matchers';
export * from './helpers/mock-error-handler';
export * from './helpers/network-error-simulator';
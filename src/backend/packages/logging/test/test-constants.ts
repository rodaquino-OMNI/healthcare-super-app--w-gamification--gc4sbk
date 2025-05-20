/**
 * Test constants and fixtures for the logging package tests.
 * 
 * This file provides reusable test data for all logging package tests, including
 * sample log entries, context objects, error instances, and configuration settings.
 * Using these shared constants ensures consistency across tests and simplifies
 * test maintenance.
 */

import { LogLevel } from '../src/interfaces/log-level.enum';
import { LoggingContext } from '../src/context/context.interface';
import { JourneyContext } from '../src/context/journey-context.interface';
import { UserContext } from '../src/context/user-context.interface';
import { RequestContext } from '../src/context/request-context.interface';
import { LoggerConfig } from '../src/interfaces/log-config.interface';

// ===== LOG LEVELS =====

/**
 * Sample log level values for testing different logging scenarios
 */
export const TEST_LOG_LEVELS = {
  DEBUG: LogLevel.DEBUG,
  INFO: LogLevel.INFO,
  WARN: LogLevel.WARN,
  ERROR: LogLevel.ERROR,
  FATAL: LogLevel.FATAL,
};

// ===== LOG ENTRIES =====

/**
 * Sample log messages for different log levels
 */
export const TEST_LOG_MESSAGES = {
  DEBUG: 'This is a debug message for testing',
  INFO: 'This is an info message for testing',
  WARN: 'This is a warning message for testing',
  ERROR: 'This is an error message for testing',
  FATAL: 'This is a fatal error message for testing',
};

/**
 * Sample log entry for testing formatters and transports
 */
export const TEST_LOG_ENTRY = {
  level: LogLevel.INFO,
  message: 'Test log entry for formatter testing',
  timestamp: new Date('2025-05-20T10:30:00Z'),
  context: {
    correlationId: 'test-correlation-id-123',
    requestId: 'test-request-id-456',
    service: 'test-service',
    userId: 'test-user-id-789',
  },
  metadata: {
    duration: 123,
    path: '/api/test',
    method: 'GET',
  },
};

/**
 * Sample log entries for different log levels
 */
export const TEST_LOG_ENTRIES = {
  DEBUG: {
    ...TEST_LOG_ENTRY,
    level: LogLevel.DEBUG,
    message: TEST_LOG_MESSAGES.DEBUG,
  },
  INFO: {
    ...TEST_LOG_ENTRY,
    level: LogLevel.INFO,
    message: TEST_LOG_MESSAGES.INFO,
  },
  WARN: {
    ...TEST_LOG_ENTRY,
    level: LogLevel.WARN,
    message: TEST_LOG_MESSAGES.WARN,
  },
  ERROR: {
    ...TEST_LOG_ENTRY,
    level: LogLevel.ERROR,
    message: TEST_LOG_MESSAGES.ERROR,
    error: new Error('Test error for ERROR level'),
  },
  FATAL: {
    ...TEST_LOG_ENTRY,
    level: LogLevel.FATAL,
    message: TEST_LOG_MESSAGES.FATAL,
    error: new Error('Test error for FATAL level'),
  },
};

// ===== CONTEXT OBJECTS =====

/**
 * Base logging context for testing
 */
export const TEST_BASE_CONTEXT: LoggingContext = {
  correlationId: 'test-correlation-id-123',
  requestId: 'test-request-id-456',
  timestamp: new Date('2025-05-20T10:30:00Z'),
  service: 'test-service',
  environment: 'test',
  version: '1.0.0',
};

/**
 * Journey types for the AUSTA SuperApp
 */
export enum TEST_JOURNEY_TYPE {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

/**
 * Sample journey contexts for different journey types
 */
export const TEST_JOURNEY_CONTEXTS: Record<TEST_JOURNEY_TYPE, JourneyContext> = {
  [TEST_JOURNEY_TYPE.HEALTH]: {
    ...TEST_BASE_CONTEXT,
    journeyType: TEST_JOURNEY_TYPE.HEALTH,
    journeyState: {
      currentMetric: 'blood_pressure',
      goalId: 'goal-123',
      deviceId: 'device-456',
    },
  },
  [TEST_JOURNEY_TYPE.CARE]: {
    ...TEST_BASE_CONTEXT,
    journeyType: TEST_JOURNEY_TYPE.CARE,
    journeyState: {
      appointmentId: 'appointment-123',
      providerId: 'provider-456',
      careType: 'telemedicine',
    },
  },
  [TEST_JOURNEY_TYPE.PLAN]: {
    ...TEST_BASE_CONTEXT,
    journeyType: TEST_JOURNEY_TYPE.PLAN,
    journeyState: {
      planId: 'plan-123',
      claimId: 'claim-456',
      benefitType: 'dental',
    },
  },
};

/**
 * Sample user contexts with different user types
 */
export const TEST_USER_CONTEXTS: Record<string, UserContext> = {
  STANDARD: {
    ...TEST_BASE_CONTEXT,
    userId: 'user-123',
    isAuthenticated: true,
    roles: ['user'],
    preferences: {
      language: 'pt-BR',
      theme: 'light',
    },
  },
  ADMIN: {
    ...TEST_BASE_CONTEXT,
    userId: 'admin-123',
    isAuthenticated: true,
    roles: ['user', 'admin'],
    preferences: {
      language: 'en-US',
      theme: 'dark',
    },
  },
  UNAUTHENTICATED: {
    ...TEST_BASE_CONTEXT,
    userId: undefined,
    isAuthenticated: false,
    roles: [],
    preferences: {
      language: 'pt-BR',
      theme: 'light',
    },
  },
};

/**
 * Sample HTTP request contexts for testing
 */
export const TEST_REQUEST_CONTEXTS: Record<string, RequestContext> = {
  GET: {
    ...TEST_BASE_CONTEXT,
    method: 'GET',
    url: 'https://api.austa.health/health/metrics',
    path: '/health/metrics',
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    headers: {
      'accept-language': 'pt-BR',
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      'x-request-id': 'test-request-id-456',
    },
    params: {
      metricType: 'blood_pressure',
      period: '7d',
    },
  },
  POST: {
    ...TEST_BASE_CONTEXT,
    method: 'POST',
    url: 'https://api.austa.health/care/appointments',
    path: '/care/appointments',
    ip: '192.168.1.2',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    headers: {
      'accept-language': 'en-US',
      'content-type': 'application/json',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'x-request-id': 'test-request-id-789',
    },
    body: {
      providerId: 'provider-123',
      date: '2025-06-01',
      time: '14:30',
      type: 'telemedicine',
    },
  },
};

// ===== ERROR OBJECTS =====

/**
 * Creates an error with a predictable stack trace for testing
 * @param message Error message
 * @param name Error name
 * @returns Error object with stack trace
 */
export function createTestError(message: string, name = 'Error'): Error {
  const error = new Error(message);
  error.name = name;
  
  // Set a predictable stack trace for testing
  error.stack = `${name}: ${message}
    at TestFunction (/src/test/function.ts:123:45)
    at Context.<anonymous> (/src/test/test-file.spec.ts:67:89)
    at processTicksAndRejections (internal/process/task_queues.js:95:5)`;
  
  return error;
}

/**
 * Sample error objects for testing error logging
 */
export const TEST_ERRORS = {
  STANDARD: createTestError('Standard test error'),
  VALIDATION: createTestError('Validation failed: Field is required', 'ValidationError'),
  DATABASE: createTestError('Database connection failed', 'DatabaseError'),
  NETWORK: createTestError('Network request timeout', 'NetworkError'),
  AUTHENTICATION: createTestError('Invalid credentials', 'AuthenticationError'),
  AUTHORIZATION: createTestError('Insufficient permissions', 'AuthorizationError'),
};

/**
 * Sample error with cause for testing nested error logging
 */
export const TEST_ERROR_WITH_CAUSE = (() => {
  const cause = createTestError('Original database connection error', 'ConnectionError');
  const error = createTestError('Failed to fetch user data', 'DatabaseError');
  (error as any).cause = cause; // TypeScript 4.5+ supports Error.cause natively
  return error;
})();

// ===== TRACE CONTEXT =====

/**
 * Sample trace context for testing distributed tracing integration
 */
export const TEST_TRACE_CONTEXT = {
  traceId: '1234567890abcdef1234567890abcdef',
  spanId: 'abcdef1234567890',
  traceFlags: 1, // Sampled
  traceState: 'vendor=value',
};

/**
 * Sample AWS X-Ray trace context for testing AWS integration
 */
export const TEST_XRAY_TRACE_CONTEXT = {
  traceId: '1-5f85e699-684a7e5520b33d5eb1957a33',
  segmentId: '5b9e4ff66a3e815c',
  sampled: true,
};

// ===== CONFIGURATION =====

/**
 * Sample logger configurations for different environments
 */
export const TEST_LOGGER_CONFIGS: Record<string, LoggerConfig> = {
  DEVELOPMENT: {
    level: LogLevel.DEBUG,
    service: 'test-service',
    environment: 'development',
    formatter: 'text',
    transports: [
      {
        type: 'console',
        level: LogLevel.DEBUG,
        colorize: true,
      },
    ],
    context: {
      version: '1.0.0',
    },
  },
  PRODUCTION: {
    level: LogLevel.INFO,
    service: 'test-service',
    environment: 'production',
    formatter: 'json',
    transports: [
      {
        type: 'console',
        level: LogLevel.INFO,
        colorize: false,
      },
      {
        type: 'cloudwatch',
        level: LogLevel.INFO,
        logGroup: '/austa/test-service',
        logStream: 'application-logs',
        region: 'us-east-1',
      },
    ],
    context: {
      version: '1.0.0',
    },
  },
  TESTING: {
    level: LogLevel.DEBUG,
    service: 'test-service',
    environment: 'test',
    formatter: 'json',
    transports: [
      {
        type: 'console',
        level: LogLevel.DEBUG,
        colorize: false,
      },
    ],
    context: {
      version: '1.0.0',
    },
  },
};

// ===== MOCK OBJECTS =====

/**
 * Mock transport for testing that captures logs instead of writing them
 */
export const createMockTransport = () => {
  const logs: any[] = [];
  
  return {
    logs,
    write: jest.fn((entry) => {
      logs.push(entry);
      return Promise.resolve();
    }),
    initialize: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  };
};

/**
 * Mock formatter for testing that returns a predictable string
 */
export const createMockFormatter = () => {
  return {
    format: jest.fn((entry) => {
      return JSON.stringify(entry);
    }),
  };
};

/**
 * Mock trace service for testing distributed tracing integration
 */
export const createMockTraceService = () => {
  return {
    getCurrentTraceContext: jest.fn().mockReturnValue(TEST_TRACE_CONTEXT),
    startSpan: jest.fn().mockImplementation((name, options) => ({
      name,
      end: jest.fn(),
      setAttributes: jest.fn(),
      recordException: jest.fn(),
    })),
    getTraceContextFromRequest: jest.fn().mockReturnValue(TEST_TRACE_CONTEXT),
    injectTraceContext: jest.fn(),
  };
};
/**
 * Test Constants for Logging Package
 * 
 * This file contains constants, fixtures, and mock objects used throughout the logging package tests.
 * It provides consistent test data to ensure reliable and maintainable tests.
 */

import { LogLevel } from '../src/interfaces/log-level.enum';

/**
 * Sample log messages for different scenarios
 */
export const TEST_LOG_MESSAGES = {
  INFO: 'This is an informational message',
  ERROR: 'An error occurred during operation',
  WARN: 'Warning: approaching rate limit',
  DEBUG: 'Debug information for troubleshooting',
  VERBOSE: 'Detailed trace information',
  WITH_PLACEHOLDERS: 'User {userId} performed action {actionType}',
};

/**
 * Sample error objects with stack traces for testing error logging
 */
export const TEST_ERRORS = {
  VALIDATION: new Error('Validation failed: Invalid input format'),
  DATABASE: new Error('Database connection failed: timeout'),
  NETWORK: new Error('Network request failed: 504 Gateway Timeout'),
  PERMISSION: new Error('Permission denied: Insufficient privileges'),
  BUSINESS_LOGIC: new Error('Business rule violation: Cannot schedule appointment in the past'),
  // Error with custom properties
  CUSTOM: Object.assign(new Error('Custom error with additional properties'), {
    code: 'ERR_CUSTOM',
    details: { field: 'email', constraint: 'format' },
    httpStatus: 400
  }),
};

// Add stack traces to all errors
Object.values(TEST_ERRORS).forEach(error => {
  if (!error.stack) {
    Error.captureStackTrace(error);
  }
});

/**
 * Sample user IDs for testing user context
 */
export const TEST_USER_IDS = {
  STANDARD: 'usr_123456789',
  ADMIN: 'adm_987654321',
  PROVIDER: 'prv_456789123',
  ANONYMOUS: 'anonymous',
};

/**
 * Sample request IDs for testing request context
 */
export const TEST_REQUEST_IDS = {
  STANDARD: 'req_abcdef123456',
  LONG_RUNNING: 'req_longrunning789012',
  MOBILE: 'req_mobile345678',
  WEB: 'req_web901234',
};

/**
 * Sample trace context objects for testing distributed tracing integration
 */
export const TEST_TRACE_CONTEXTS = {
  STANDARD: {
    traceId: '1234567890abcdef1234567890abcdef',
    spanId: 'abcdef1234567890',
    parentSpanId: '1234567890abcdef',
    sampled: true,
  },
  UNSAMPLED: {
    traceId: 'fedcba0987654321fedcba0987654321',
    spanId: '0987654321fedcba',
    parentSpanId: null,
    sampled: false,
  },
  MOBILE_REQUEST: {
    traceId: 'aabbccddeeff11223344556677889900',
    spanId: '1122334455667788',
    parentSpanId: 'aabbccddeeff1122',
    sampled: true,
    attributes: {
      'device.type': 'mobile',
      'device.os': 'iOS',
      'app.version': '2.1.0',
    },
  },
  WEB_REQUEST: {
    traceId: '00998877665544332211ffeeddccbbaa',
    spanId: '8877665544332211',
    parentSpanId: '00998877665544',
    sampled: true,
    attributes: {
      'device.type': 'web',
      'browser': 'Chrome',
      'browser.version': '98.0.4758.102',
    },
  },
};

/**
 * Sample journey context objects for testing journey-specific logging
 */
export const TEST_JOURNEY_CONTEXTS = {
  HEALTH: {
    journeyId: 'health',
    journeyName: 'Minha Saúde',
    metadata: {
      metricId: 'met_123456',
      goalId: 'goal_789012',
      deviceId: 'dev_345678',
    },
  },
  CARE: {
    journeyId: 'care',
    journeyName: 'Cuidar-me Agora',
    metadata: {
      appointmentId: 'apt_123456',
      providerId: 'prv_789012',
      medicationId: 'med_345678',
    },
  },
  PLAN: {
    journeyId: 'plan',
    journeyName: 'Meu Plano & Benefícios',
    metadata: {
      planId: 'pln_123456',
      benefitId: 'ben_789012',
      claimId: 'clm_345678',
    },
  },
  CROSS_JOURNEY: {
    journeyId: 'cross_journey',
    journeyName: 'Cross Journey',
    metadata: {
      sourceJourneyId: 'health',
      targetJourneyId: 'care',
      interactionId: 'int_123456',
    },
  },
};

/**
 * Sample log entry objects for testing formatters and transports
 */
export const TEST_LOG_ENTRIES = {
  INFO: {
    message: TEST_LOG_MESSAGES.INFO,
    level: LogLevel.INFO,
    timestamp: new Date('2023-06-15T10:30:00Z'),
    context: {
      requestId: TEST_REQUEST_IDS.STANDARD,
      userId: TEST_USER_IDS.STANDARD,
      journey: TEST_JOURNEY_CONTEXTS.HEALTH,
    },
    trace: TEST_TRACE_CONTEXTS.STANDARD,
    metadata: {
      service: 'health-service',
      environment: 'test',
    },
  },
  ERROR: {
    message: TEST_LOG_MESSAGES.ERROR,
    level: LogLevel.ERROR,
    timestamp: new Date('2023-06-15T10:35:00Z'),
    context: {
      requestId: TEST_REQUEST_IDS.STANDARD,
      userId: TEST_USER_IDS.STANDARD,
      journey: TEST_JOURNEY_CONTEXTS.CARE,
    },
    trace: TEST_TRACE_CONTEXTS.STANDARD,
    error: TEST_ERRORS.DATABASE,
    metadata: {
      service: 'care-service',
      environment: 'test',
    },
  },
  WARN: {
    message: TEST_LOG_MESSAGES.WARN,
    level: LogLevel.WARN,
    timestamp: new Date('2023-06-15T10:40:00Z'),
    context: {
      requestId: TEST_REQUEST_IDS.STANDARD,
      userId: TEST_USER_IDS.STANDARD,
      journey: TEST_JOURNEY_CONTEXTS.PLAN,
    },
    trace: TEST_TRACE_CONTEXTS.STANDARD,
    metadata: {
      service: 'plan-service',
      environment: 'test',
      rateLimit: {
        current: 95,
        max: 100,
        resetAt: '2023-06-15T11:00:00Z',
      },
    },
  },
  DEBUG: {
    message: TEST_LOG_MESSAGES.DEBUG,
    level: LogLevel.DEBUG,
    timestamp: new Date('2023-06-15T10:45:00Z'),
    context: {
      requestId: TEST_REQUEST_IDS.STANDARD,
      userId: TEST_USER_IDS.ADMIN,
      journey: TEST_JOURNEY_CONTEXTS.HEALTH,
    },
    trace: TEST_TRACE_CONTEXTS.STANDARD,
    metadata: {
      service: 'health-service',
      environment: 'test',
      debugInfo: {
        query: 'SELECT * FROM health_metrics WHERE user_id = ?',
        params: ['usr_123456789'],
        executionTime: 45.2,
      },
    },
  },
  VERBOSE: {
    message: TEST_LOG_MESSAGES.VERBOSE,
    level: LogLevel.VERBOSE,
    timestamp: new Date('2023-06-15T10:50:00Z'),
    context: {
      requestId: TEST_REQUEST_IDS.STANDARD,
      userId: TEST_USER_IDS.STANDARD,
      journey: TEST_JOURNEY_CONTEXTS.CARE,
    },
    trace: TEST_TRACE_CONTEXTS.STANDARD,
    metadata: {
      service: 'care-service',
      environment: 'test',
      httpRequest: {
        method: 'GET',
        url: '/api/care/appointments',
        headers: {
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
          'content-type': 'application/json',
        },
        query: { status: 'upcoming', limit: 10 },
      },
    },
  },
  MOBILE: {
    message: 'Mobile app launched',
    level: LogLevel.INFO,
    timestamp: new Date('2023-06-15T11:00:00Z'),
    context: {
      requestId: TEST_REQUEST_IDS.MOBILE,
      userId: TEST_USER_IDS.STANDARD,
      journey: TEST_JOURNEY_CONTEXTS.CROSS_JOURNEY,
    },
    trace: TEST_TRACE_CONTEXTS.MOBILE_REQUEST,
    metadata: {
      service: 'mobile-app',
      environment: 'test',
      device: {
        model: 'iPhone 12',
        os: 'iOS 15.4.1',
        appVersion: '2.1.0',
      },
    },
  },
  WEB: {
    message: 'Web app loaded',
    level: LogLevel.INFO,
    timestamp: new Date('2023-06-15T11:05:00Z'),
    context: {
      requestId: TEST_REQUEST_IDS.WEB,
      userId: TEST_USER_IDS.STANDARD,
      journey: TEST_JOURNEY_CONTEXTS.CROSS_JOURNEY,
    },
    trace: TEST_TRACE_CONTEXTS.WEB_REQUEST,
    metadata: {
      service: 'web-app',
      environment: 'test',
      browser: {
        name: 'Chrome',
        version: '98.0.4758.102',
        platform: 'Windows',
      },
    },
  },
};

/**
 * Sample logger configuration objects for testing different configurations
 */
export const TEST_LOGGER_CONFIGS = {
  DEFAULT: {
    level: LogLevel.INFO,
    service: 'test-service',
    environment: 'test',
    transports: ['console'],
    format: 'json',
  },
  DEVELOPMENT: {
    level: LogLevel.DEBUG,
    service: 'test-service',
    environment: 'development',
    transports: ['console'],
    format: 'pretty',
    includeStackTrace: true,
    logToFile: true,
    filePath: './logs/development.log',
  },
  PRODUCTION: {
    level: LogLevel.WARN,
    service: 'test-service',
    environment: 'production',
    transports: ['console', 'cloudwatch'],
    format: 'json',
    includeStackTrace: false,
    cloudwatch: {
      logGroupName: '/austa/test-service',
      logStreamName: 'production',
      region: 'us-east-1',
    },
  },
  HEALTH_JOURNEY: {
    level: LogLevel.INFO,
    service: 'health-service',
    environment: 'test',
    transports: ['console'],
    format: 'json',
    defaultContext: {
      journey: TEST_JOURNEY_CONTEXTS.HEALTH,
    },
  },
  CARE_JOURNEY: {
    level: LogLevel.INFO,
    service: 'care-service',
    environment: 'test',
    transports: ['console'],
    format: 'json',
    defaultContext: {
      journey: TEST_JOURNEY_CONTEXTS.CARE,
    },
  },
  PLAN_JOURNEY: {
    level: LogLevel.INFO,
    service: 'plan-service',
    environment: 'test',
    transports: ['console'],
    format: 'json',
    defaultContext: {
      journey: TEST_JOURNEY_CONTEXTS.PLAN,
    },
  },
};

/**
 * Sample transport configuration objects for testing different transports
 */
export const TEST_TRANSPORT_CONFIGS = {
  CONSOLE: {
    type: 'console',
    level: LogLevel.INFO,
    format: 'pretty',
  },
  FILE: {
    type: 'file',
    level: LogLevel.DEBUG,
    format: 'json',
    filePath: './logs/test.log',
    maxSize: '10m',
    maxFiles: 5,
  },
  CLOUDWATCH: {
    type: 'cloudwatch',
    level: LogLevel.INFO,
    format: 'json',
    logGroupName: '/austa/test',
    logStreamName: 'test-stream',
    region: 'us-east-1',
    batchSize: 20,
    interval: 5000,
  },
  HTTP: {
    type: 'http',
    level: LogLevel.INFO,
    format: 'json',
    endpoint: 'https://logging.example.com/ingest',
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json',
    },
    batchSize: 10,
    interval: 2000,
  },
};

/**
 * Sample formatter configuration objects for testing different formatters
 */
export const TEST_FORMATTER_CONFIGS = {
  JSON: {
    type: 'json',
    includeTimestamp: true,
    includeLevel: true,
    includeContext: true,
    includeTrace: true,
    includeMetadata: true,
  },
  PRETTY: {
    type: 'pretty',
    colors: true,
    includeTimestamp: true,
    timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
    includeLevel: true,
    includeContext: true,
    includeTrace: false,
  },
  SIMPLE: {
    type: 'simple',
    includeTimestamp: true,
    timestampFormat: 'HH:mm:ss',
    includeLevel: true,
    includeContext: false,
    includeTrace: false,
  },
};

/**
 * Sample context manager objects for testing context management
 */
export const TEST_CONTEXT_MANAGERS = {
  EMPTY: {
    current: {},
    getContext: () => ({}),
    setContext: () => {},
    clearContext: () => {},
  },
  WITH_REQUEST: {
    current: {
      requestId: TEST_REQUEST_IDS.STANDARD,
    },
    getContext: () => ({ requestId: TEST_REQUEST_IDS.STANDARD }),
    setContext: () => {},
    clearContext: () => {},
  },
  WITH_USER: {
    current: {
      requestId: TEST_REQUEST_IDS.STANDARD,
      userId: TEST_USER_IDS.STANDARD,
    },
    getContext: () => ({
      requestId: TEST_REQUEST_IDS.STANDARD,
      userId: TEST_USER_IDS.STANDARD,
    }),
    setContext: () => {},
    clearContext: () => {},
  },
  WITH_JOURNEY: {
    current: {
      requestId: TEST_REQUEST_IDS.STANDARD,
      userId: TEST_USER_IDS.STANDARD,
      journey: TEST_JOURNEY_CONTEXTS.HEALTH,
    },
    getContext: () => ({
      requestId: TEST_REQUEST_IDS.STANDARD,
      userId: TEST_USER_IDS.STANDARD,
      journey: TEST_JOURNEY_CONTEXTS.HEALTH,
    }),
    setContext: () => {},
    clearContext: () => {},
  },
};

/**
 * Sample mock functions for testing
 */
export const TEST_MOCKS = {
  CONSOLE_TRANSPORT: {
    write: jest.fn().mockResolvedValue(undefined),
    initialize: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  },
  FILE_TRANSPORT: {
    write: jest.fn().mockResolvedValue(undefined),
    initialize: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  },
  CLOUDWATCH_TRANSPORT: {
    write: jest.fn().mockResolvedValue(undefined),
    initialize: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  },
  JSON_FORMATTER: {
    format: jest.fn().mockImplementation((entry) => JSON.stringify(entry)),
  },
  PRETTY_FORMATTER: {
    format: jest.fn().mockImplementation((entry) => `[${entry.level}] ${entry.message}`),
  },
  TRACING_SERVICE: {
    getCurrentTraceContext: jest.fn().mockReturnValue(TEST_TRACE_CONTEXTS.STANDARD),
    startSpan: jest.fn().mockImplementation((name, options) => ({
      name,
      context: TEST_TRACE_CONTEXTS.STANDARD,
      end: jest.fn(),
    })),
  },
};
/**
 * Test constants and fixtures for the logging package tests.
 * 
 * This file provides standardized test data that can be reused across all test files
 * in the logging package, ensuring consistency and reducing duplication.
 */

import { LogLevel } from '../src/interfaces/log-level.enum';
import { LogEntry } from '../src/interfaces/log-entry.interface';
import { LoggerConfig } from '../src/interfaces/log-config.interface';
import { JourneyType } from '../src/context/context.constants';

// ===== Sample Log Entries =====

/**
 * Sample log entries for different log levels
 */
export const TEST_LOG_ENTRIES: Record<LogLevel, LogEntry> = {
  [LogLevel.DEBUG]: {
    message: 'Debug message for testing',
    level: LogLevel.DEBUG,
    timestamp: new Date('2023-05-15T10:30:00Z'),
    context: { service: 'test-service' },
  },
  [LogLevel.INFO]: {
    message: 'Info message for testing',
    level: LogLevel.INFO,
    timestamp: new Date('2023-05-15T10:31:00Z'),
    context: { service: 'test-service' },
  },
  [LogLevel.WARN]: {
    message: 'Warning message for testing',
    level: LogLevel.WARN,
    timestamp: new Date('2023-05-15T10:32:00Z'),
    context: { service: 'test-service' },
  },
  [LogLevel.ERROR]: {
    message: 'Error message for testing',
    level: LogLevel.ERROR,
    timestamp: new Date('2023-05-15T10:33:00Z'),
    context: { service: 'test-service' },
    error: new Error('Test error'),
  },
  [LogLevel.FATAL]: {
    message: 'Fatal message for testing',
    level: LogLevel.FATAL,
    timestamp: new Date('2023-05-15T10:34:00Z'),
    context: { service: 'test-service' },
    error: new Error('Test fatal error'),
  },
};

/**
 * Sample log entry with all possible fields populated
 */
export const COMPLETE_LOG_ENTRY: LogEntry = {
  message: 'Complete log entry for testing',
  level: LogLevel.INFO,
  timestamp: new Date('2023-05-15T10:35:00Z'),
  context: {
    service: 'test-service',
    requestId: '12345-abcde-67890',
    userId: 'user-123',
    journeyType: JourneyType.HEALTH,
    journeyContext: { action: 'view-metrics' },
    traceId: 'trace-123',
    spanId: 'span-456',
    environment: 'test',
    version: '1.0.0',
    correlationId: 'corr-789',
  },
  error: new Error('Test error with complete context'),
  metadata: {
    duration: 123,
    resourceId: 'resource-456',
    tags: ['test', 'complete', 'entry'],
  },
};

// ===== Context Objects =====

/**
 * Sample journey context objects for different journey types
 */
export const TEST_JOURNEY_CONTEXTS = {
  [JourneyType.HEALTH]: {
    journeyType: JourneyType.HEALTH,
    journeyContext: {
      action: 'view-health-metrics',
      metricType: 'heart-rate',
      deviceId: 'device-123',
    },
  },
  [JourneyType.CARE]: {
    journeyType: JourneyType.CARE,
    journeyContext: {
      action: 'schedule-appointment',
      providerId: 'provider-456',
      specialtyId: 'cardiology',
    },
  },
  [JourneyType.PLAN]: {
    journeyType: JourneyType.PLAN,
    journeyContext: {
      action: 'view-benefits',
      planId: 'plan-789',
      benefitType: 'medical',
    },
  },
};

/**
 * Sample user context object
 */
export const TEST_USER_CONTEXT = {
  userId: 'user-123',
  username: 'testuser',
  email: 'test@example.com',
  roles: ['user', 'premium'],
  isAuthenticated: true,
  preferences: {
    language: 'pt-BR',
    notifications: true,
  },
};

/**
 * Sample request context object
 */
export const TEST_REQUEST_CONTEXT = {
  requestId: 'req-123-456-789',
  method: 'GET',
  url: '/api/health/metrics',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0 (Test User Agent)',
  params: { metricId: '123' },
  headers: {
    'content-type': 'application/json',
    'accept-language': 'pt-BR',
  },
};

/**
 * Sample trace context object for distributed tracing
 */
export const TEST_TRACE_CONTEXT = {
  traceId: 'trace-abc-123',
  spanId: 'span-def-456',
  parentSpanId: 'span-parent-789',
  sampled: true,
  flags: 1,
};

// ===== Error Objects =====

/**
 * Creates a sample error with a predictable stack trace for testing
 */
export function createTestError(message: string, name = 'Error'): Error {
  const error = new Error(message);
  error.name = name;
  error.stack = `${name}: ${message}
    at TestFunction (/test/file.ts:123:45)
    at Context.<anonymous> (/test/test-file.spec.ts:67:89)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)`;
  return error;
};

/**
 * Sample error objects for different error types
 */
export const TEST_ERRORS = {
  basic: createTestError('Basic test error'),
  validation: createTestError('Validation failed: Field is required', 'ValidationError'),
  database: createTestError('Database connection failed', 'DatabaseError'),
  network: createTestError('Network request timeout', 'NetworkError'),
  auth: createTestError('Authentication failed: Invalid credentials', 'AuthError'),
  notFound: createTestError('Resource not found', 'NotFoundError'),
};

/**
 * Sample error with nested cause for testing error chaining
 */
export const NESTED_ERROR = (() => {
  const rootCause = createTestError('Root cause error', 'RootError');
  const midLevel = createTestError('Mid-level error', 'MidError');
  const topLevel = createTestError('Top-level error', 'TopError');
  
  // @ts-ignore - TypeScript doesn't recognize cause property but it's standard in Node.js
  midLevel.cause = rootCause;
  // @ts-ignore
  topLevel.cause = midLevel;
  
  return topLevel;
})();

// ===== Configuration Objects =====

/**
 * Sample logger configurations for different environments
 */
export const TEST_LOGGER_CONFIGS: Record<string, LoggerConfig> = {
  development: {
    level: LogLevel.DEBUG,
    formatter: 'text',
    transports: [{ type: 'console' }],
    context: {
      service: 'test-service',
      environment: 'development',
      version: '1.0.0',
    },
  },
  test: {
    level: LogLevel.DEBUG,
    formatter: 'json',
    transports: [{ type: 'console' }],
    context: {
      service: 'test-service',
      environment: 'test',
      version: '1.0.0',
    },
  },
  production: {
    level: LogLevel.INFO,
    formatter: 'json',
    transports: [
      { type: 'console' },
      {
        type: 'cloudwatch',
        options: {
          logGroupName: '/austa/test-service',
          logStreamName: 'application-logs',
          region: 'us-east-1',
        },
      },
    ],
    context: {
      service: 'test-service',
      environment: 'production',
      version: '1.0.0',
    },
  },
};

/**
 * Sample transport configurations for different transport types
 */
export const TEST_TRANSPORT_CONFIGS = {
  console: {
    type: 'console',
    options: {
      colorize: true,
    },
  },
  file: {
    type: 'file',
    options: {
      filename: 'test-logs.log',
      directory: '/tmp/logs',
      maxSize: '10m',
      maxFiles: 5,
      compress: true,
    },
  },
  cloudwatch: {
    type: 'cloudwatch',
    options: {
      logGroupName: '/austa/test-service',
      logStreamName: 'application-logs',
      region: 'us-east-1',
      batchSize: 20,
      retryCount: 3,
      retryDelay: 100,
    },
  },
};

// ===== Mock Functions and Classes =====

/**
 * Mock console methods for testing console transport
 */
export const mockConsole = {
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

/**
 * Mock file system methods for testing file transport
 */
export const mockFs = {
  writeFile: jest.fn(),
  appendFile: jest.fn(),
  mkdir: jest.fn(),
  stat: jest.fn(),
  readdir: jest.fn(),
  unlink: jest.fn(),
};

/**
 * Mock AWS SDK methods for testing CloudWatch transport
 */
export const mockCloudWatchLogs = {
  putLogEvents: jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({
      nextSequenceToken: 'next-token-123',
    }),
  }),
  createLogGroup: jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({}),
  }),
  createLogStream: jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({}),
  }),
};

/**
 * Mock tracing service for testing trace context integration
 */
export const mockTracingService = {
  getCurrentTraceContext: jest.fn().mockReturnValue(TEST_TRACE_CONTEXT),
  startSpan: jest.fn().mockReturnValue({
    end: jest.fn(),
    context: jest.fn().mockReturnValue(TEST_TRACE_CONTEXT),
  }),
  getTraceId: jest.fn().mockReturnValue(TEST_TRACE_CONTEXT.traceId),
  getSpanId: jest.fn().mockReturnValue(TEST_TRACE_CONTEXT.spanId),
};
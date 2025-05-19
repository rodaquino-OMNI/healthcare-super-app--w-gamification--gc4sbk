/**
 * Constants used for configuring the test NestJS application in e2e tests.
 * These constants allow tests to be run with different configurations to verify
 * logging behavior across development, staging, and production environments.
 */

import { LogLevel } from '../../../src/interfaces/log-level.enum';

/**
 * Environment types supported in the test application
 */
export enum TestEnvironment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

/**
 * Service information for context enrichment
 */
export const TEST_SERVICE_INFO = {
  name: 'test-logging-service',
  version: '1.0.0',
  nodeEnv: process.env.NODE_ENV || 'test',
};

/**
 * Journey types for testing journey-specific logging
 */
export enum TestJourney {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

/**
 * Log level configuration by environment
 */
export const LOG_LEVELS_BY_ENV = {
  [TestEnvironment.DEVELOPMENT]: LogLevel.DEBUG,
  [TestEnvironment.STAGING]: LogLevel.INFO,
  [TestEnvironment.PRODUCTION]: LogLevel.WARN,
};

/**
 * Transport types available for testing
 */
export enum TestTransportType {
  CONSOLE = 'console',
  FILE = 'file',
  CLOUDWATCH = 'cloudwatch',
  NONE = 'none',
}

/**
 * Default transport configuration for each environment
 */
export const DEFAULT_TRANSPORTS_BY_ENV = {
  [TestEnvironment.DEVELOPMENT]: [TestTransportType.CONSOLE],
  [TestEnvironment.STAGING]: [TestTransportType.CONSOLE, TestTransportType.FILE],
  [TestEnvironment.PRODUCTION]: [TestTransportType.CONSOLE, TestTransportType.CLOUDWATCH],
};

/**
 * Formatter types available for testing
 */
export enum TestFormatterType {
  JSON = 'json',
  TEXT = 'text',
  CLOUDWATCH = 'cloudwatch',
}

/**
 * Default formatter configuration for each environment
 */
export const DEFAULT_FORMATTERS_BY_ENV = {
  [TestEnvironment.DEVELOPMENT]: TestFormatterType.TEXT,
  [TestEnvironment.STAGING]: TestFormatterType.JSON,
  [TestEnvironment.PRODUCTION]: TestFormatterType.CLOUDWATCH,
};

/**
 * Feature flags for conditional logging behavior tests
 */
export const TEST_FEATURE_FLAGS = {
  enableTracing: true,
  enableRequestLogging: true,
  enableResponseLogging: true,
  enableErrorLogging: true,
  enableSanitization: true,
  enableJourneyContext: true,
  enablePerformanceLogging: true,
};

/**
 * Test file transport configuration
 */
export const TEST_FILE_TRANSPORT_CONFIG = {
  directory: './logs',
  filename: 'test-app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true,
};

/**
 * Test CloudWatch transport configuration
 */
export const TEST_CLOUDWATCH_TRANSPORT_CONFIG = {
  logGroupName: '/austa/test-logging',
  logStreamName: 'test-stream-{date}',
  awsRegion: 'us-east-1',
  messageFormatter: TestFormatterType.CLOUDWATCH,
  retentionInDays: 14,
};

/**
 * Test environment variables for different test scenarios
 */
export const TEST_ENV_VARS = {
  [TestEnvironment.DEVELOPMENT]: {
    LOG_LEVEL: 'debug',
    LOG_FORMAT: 'text',
    LOG_TRANSPORTS: 'console',
    ENABLE_REQUEST_LOGGING: 'true',
    ENABLE_RESPONSE_LOGGING: 'true',
    ENABLE_TRACING: 'true',
  },
  [TestEnvironment.STAGING]: {
    LOG_LEVEL: 'info',
    LOG_FORMAT: 'json',
    LOG_TRANSPORTS: 'console,file',
    ENABLE_REQUEST_LOGGING: 'true',
    ENABLE_RESPONSE_LOGGING: 'true',
    ENABLE_TRACING: 'true',
  },
  [TestEnvironment.PRODUCTION]: {
    LOG_LEVEL: 'warn',
    LOG_FORMAT: 'json',
    LOG_TRANSPORTS: 'console,cloudwatch',
    ENABLE_REQUEST_LOGGING: 'false',
    ENABLE_RESPONSE_LOGGING: 'false',
    ENABLE_TRACING: 'true',
  },
};

/**
 * Journey-specific log level overrides for testing
 */
export const JOURNEY_LOG_LEVEL_OVERRIDES = {
  [TestJourney.HEALTH]: {
    [TestEnvironment.DEVELOPMENT]: LogLevel.DEBUG,
    [TestEnvironment.STAGING]: LogLevel.DEBUG,
    [TestEnvironment.PRODUCTION]: LogLevel.INFO,
  },
  [TestJourney.CARE]: {
    [TestEnvironment.DEVELOPMENT]: LogLevel.DEBUG,
    [TestEnvironment.STAGING]: LogLevel.INFO,
    [TestEnvironment.PRODUCTION]: LogLevel.INFO,
  },
  [TestJourney.PLAN]: {
    [TestEnvironment.DEVELOPMENT]: LogLevel.DEBUG,
    [TestEnvironment.STAGING]: LogLevel.INFO,
    [TestEnvironment.PRODUCTION]: LogLevel.WARN,
  },
};

/**
 * Sample context data for testing context enrichment
 */
export const TEST_CONTEXT_DATA = {
  requestId: 'test-request-123',
  userId: 'test-user-456',
  sessionId: 'test-session-789',
  journeyId: 'test-journey-abc',
  traceId: 'test-trace-def',
  spanId: 'test-span-ghi',
};

/**
 * Test application configuration for different environments
 */
export const TEST_APP_CONFIG = {
  [TestEnvironment.DEVELOPMENT]: {
    service: TEST_SERVICE_INFO,
    environment: TestEnvironment.DEVELOPMENT,
    logLevel: LOG_LEVELS_BY_ENV[TestEnvironment.DEVELOPMENT],
    transports: DEFAULT_TRANSPORTS_BY_ENV[TestEnvironment.DEVELOPMENT],
    formatter: DEFAULT_FORMATTERS_BY_ENV[TestEnvironment.DEVELOPMENT],
    features: TEST_FEATURE_FLAGS,
    journeyOverrides: JOURNEY_LOG_LEVEL_OVERRIDES,
  },
  [TestEnvironment.STAGING]: {
    service: TEST_SERVICE_INFO,
    environment: TestEnvironment.STAGING,
    logLevel: LOG_LEVELS_BY_ENV[TestEnvironment.STAGING],
    transports: DEFAULT_TRANSPORTS_BY_ENV[TestEnvironment.STAGING],
    formatter: DEFAULT_FORMATTERS_BY_ENV[TestEnvironment.STAGING],
    features: {
      ...TEST_FEATURE_FLAGS,
      enablePerformanceLogging: false,
    },
    journeyOverrides: JOURNEY_LOG_LEVEL_OVERRIDES,
  },
  [TestEnvironment.PRODUCTION]: {
    service: TEST_SERVICE_INFO,
    environment: TestEnvironment.PRODUCTION,
    logLevel: LOG_LEVELS_BY_ENV[TestEnvironment.PRODUCTION],
    transports: DEFAULT_TRANSPORTS_BY_ENV[TestEnvironment.PRODUCTION],
    formatter: DEFAULT_FORMATTERS_BY_ENV[TestEnvironment.PRODUCTION],
    features: {
      ...TEST_FEATURE_FLAGS,
      enableRequestLogging: false,
      enableResponseLogging: false,
      enablePerformanceLogging: false,
    },
    journeyOverrides: JOURNEY_LOG_LEVEL_OVERRIDES,
  },
};
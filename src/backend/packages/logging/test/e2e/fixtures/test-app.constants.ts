/**
 * Constants used for configuring the test NestJS application in e2e tests.
 * These constants simulate different environments and configurations to verify
 * logging behavior across development, staging, and production scenarios.
 */

import { LogLevel } from '../../../src/interfaces/log-level.enum';

/**
 * Service information for context enrichment
 */
export const TEST_SERVICE_INFO = {
  name: 'test-logging-service',
  version: '1.0.0',
  environment: 'test',
};

/**
 * Environment configurations for different test scenarios
 */
export enum TestEnvironment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

/**
 * Log level configurations for different environments
 */
export const LOG_LEVELS_BY_ENVIRONMENT = {
  [TestEnvironment.DEVELOPMENT]: LogLevel.DEBUG,
  [TestEnvironment.STAGING]: LogLevel.INFO,
  [TestEnvironment.PRODUCTION]: LogLevel.WARN,
};

/**
 * Transport types for testing different output formats
 */
export enum TransportType {
  CONSOLE = 'console',
  FILE = 'file',
  CLOUDWATCH = 'cloudwatch',
  MEMORY = 'memory', // Special transport for testing that stores logs in memory
}

/**
 * Transport configuration options for different output formats
 */
export const TRANSPORT_CONFIGS = {
  [TransportType.CONSOLE]: {
    type: TransportType.CONSOLE,
    prettyPrint: true,
    colorize: true,
  },
  [TransportType.FILE]: {
    type: TransportType.FILE,
    filename: 'test-logs.log',
    maxFiles: 3,
    maxSize: '1m',
  },
  [TransportType.CLOUDWATCH]: {
    type: TransportType.CLOUDWATCH,
    logGroupName: '/austa/test',
    logStreamName: 'test-stream',
    region: 'us-east-1',
  },
  [TransportType.MEMORY]: {
    type: TransportType.MEMORY,
    maxSize: 100, // Maximum number of log entries to store
  },
};

/**
 * Feature flags for conditional logging behavior tests
 */
export const FEATURE_FLAGS = {
  enableTraceCorrelation: true,
  enableJourneyContext: true,
  enableSanitization: true,
  enableErrorStackTraces: {
    [TestEnvironment.DEVELOPMENT]: true,
    [TestEnvironment.STAGING]: true,
    [TestEnvironment.PRODUCTION]: false,
  },
  enablePerformanceMetrics: {
    [TestEnvironment.DEVELOPMENT]: false,
    [TestEnvironment.STAGING]: true,
    [TestEnvironment.PRODUCTION]: true,
  },
};

/**
 * Journey-specific configuration options
 */
export const JOURNEY_CONFIG = {
  health: {
    name: 'Minha Saúde',
    logLevel: LogLevel.DEBUG,
    contextPrefix: 'health',
  },
  care: {
    name: 'Cuidar-me Agora',
    logLevel: LogLevel.INFO,
    contextPrefix: 'care',
  },
  plan: {
    name: 'Meu Plano & Benefícios',
    logLevel: LogLevel.INFO,
    contextPrefix: 'plan',
  },
};

/**
 * Test environment variables for configuration testing
 */
export const TEST_ENV_VARS = {
  [TestEnvironment.DEVELOPMENT]: {
    LOG_LEVEL: 'debug',
    LOG_FORMAT: 'pretty',
    LOG_TRANSPORTS: 'console',
    ENABLE_REQUEST_LOGGING: 'true',
    ENABLE_QUERY_LOGGING: 'true',
    ENABLE_TRACE_CORRELATION: 'true',
    HEALTH_JOURNEY_LOG_LEVEL: 'debug',
    CARE_JOURNEY_LOG_LEVEL: 'debug',
    PLAN_JOURNEY_LOG_LEVEL: 'debug',
  },
  [TestEnvironment.STAGING]: {
    LOG_LEVEL: 'info',
    LOG_FORMAT: 'json',
    LOG_TRANSPORTS: 'console,file',
    ENABLE_REQUEST_LOGGING: 'true',
    ENABLE_QUERY_LOGGING: 'true',
    ENABLE_TRACE_CORRELATION: 'true',
    HEALTH_JOURNEY_LOG_LEVEL: 'debug',
    CARE_JOURNEY_LOG_LEVEL: 'info',
    PLAN_JOURNEY_LOG_LEVEL: 'info',
  },
  [TestEnvironment.PRODUCTION]: {
    LOG_LEVEL: 'warn',
    LOG_FORMAT: 'json',
    LOG_TRANSPORTS: 'console,cloudwatch',
    ENABLE_REQUEST_LOGGING: 'false',
    ENABLE_QUERY_LOGGING: 'false',
    ENABLE_TRACE_CORRELATION: 'true',
    HEALTH_JOURNEY_LOG_LEVEL: 'info',
    CARE_JOURNEY_LOG_LEVEL: 'warn',
    PLAN_JOURNEY_LOG_LEVEL: 'warn',
  },
};

/**
 * Sample request contexts for testing context enrichment
 */
export const TEST_REQUEST_CONTEXTS = {
  standard: {
    requestId: 'req-123456789',
    method: 'GET',
    url: '/api/test',
    userAgent: 'Mozilla/5.0 (Test Agent)',
    ip: '127.0.0.1',
  },
  authenticated: {
    requestId: 'req-987654321',
    method: 'POST',
    url: '/api/secure/test',
    userAgent: 'Mozilla/5.0 (Test Agent)',
    ip: '127.0.0.1',
    userId: 'user-123',
    roles: ['user'],
  },
  withJourney: {
    requestId: 'req-567891234',
    method: 'GET',
    url: '/api/health/metrics',
    userAgent: 'Mozilla/5.0 (Test Agent)',
    ip: '127.0.0.1',
    userId: 'user-456',
    roles: ['user'],
    journeyType: 'health',
    journeyId: 'journey-789',
  },
};

/**
 * Sample trace contexts for testing trace correlation
 */
export const TEST_TRACE_CONTEXTS = {
  simple: {
    traceId: 'trace-123456789',
    spanId: 'span-123456789',
  },
  withParent: {
    traceId: 'trace-987654321',
    spanId: 'span-987654321',
    parentSpanId: 'span-parent-123',
  },
  complete: {
    traceId: 'trace-567891234',
    spanId: 'span-567891234',
    parentSpanId: 'span-parent-456',
    serviceName: 'api-gateway',
    operationName: 'process-request',
    startTime: Date.now(),
  },
};

/**
 * Test configuration for different log formats
 */
export enum LogFormat {
  JSON = 'json',
  PRETTY = 'pretty',
  SIMPLE = 'simple',
}

/**
 * Format configuration options
 */
export const FORMAT_CONFIGS = {
  [LogFormat.JSON]: {
    type: LogFormat.JSON,
    includeTimestamp: true,
    includeLevel: true,
  },
  [LogFormat.PRETTY]: {
    type: LogFormat.PRETTY,
    colorize: true,
    includeTimestamp: true,
    includeLevel: true,
  },
  [LogFormat.SIMPLE]: {
    type: LogFormat.SIMPLE,
    includeTimestamp: false,
    includeLevel: true,
  },
};
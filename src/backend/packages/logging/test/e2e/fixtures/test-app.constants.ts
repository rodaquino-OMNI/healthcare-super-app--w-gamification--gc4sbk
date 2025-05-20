/**
 * @file test-app.constants.ts
 * @description Constants used by the test-app.module.ts for configuring the test NestJS application
 * used in e2e tests. These constants allow tests to be run with different configurations to verify
 * logging behavior across development, staging, and production environments.
 */

import { LogLevel } from '../../../src/interfaces/log-level.enum';
import { FormatterType, TransportType, LoggerConfig } from '../../../src/interfaces/log-config.interface';

/**
 * Service information for test application
 */
export const TEST_SERVICE_INFO = {
  name: 'test-logging-service',
  version: '1.0.0',
  description: 'Test service for logging e2e tests',
};

/**
 * Environment names for testing different configurations
 */
export enum TestEnvironment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test',
}

/**
 * Journey types for testing journey-specific logging
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

/**
 * Base logger configuration for tests
 * This provides a foundation that can be extended for specific test scenarios
 */
export const BASE_LOGGER_CONFIG: LoggerConfig = {
  level: LogLevel.INFO,
  formatter: FormatterType.JSON,
  transports: [
    {
      type: TransportType.CONSOLE,
      console: {
        colorize: true,
        prettyPrint: true,
        timestamp: true,
      },
    },
  ],
  context: {
    application: 'austa-superapp',
    service: TEST_SERVICE_INFO.name,
    version: TEST_SERVICE_INFO.version,
    environment: TestEnvironment.TEST,
    additional: {
      testing: true,
    },
  },
  enableTracing: true,
  redactSensitiveData: true,
  sensitiveFields: ['password', 'token', 'secret', 'authorization', 'cookie'],
  maxObjectDepth: 5,
  handleExceptions: true,
  exitOnError: false,
  silent: false,
};

/**
 * Development environment logger configuration
 */
export const DEVELOPMENT_LOGGER_CONFIG: LoggerConfig = {
  ...BASE_LOGGER_CONFIG,
  level: LogLevel.DEBUG,
  formatter: FormatterType.TEXT,
  context: {
    ...BASE_LOGGER_CONFIG.context,
    environment: TestEnvironment.DEVELOPMENT,
  },
  transports: [
    {
      type: TransportType.CONSOLE,
      console: {
        colorize: true,
        prettyPrint: true,
        timestamp: true,
      },
    },
    {
      type: TransportType.FILE,
      file: {
        filename: './logs/test-dev.log',
        maxSize: 1024 * 1024, // 1MB
        maxFiles: 3,
        compress: false,
        append: true,
      },
    },
  ],
  journeys: {
    health: {
      level: LogLevel.DEBUG,
      context: {
        journeyName: 'Minha Saúde',
      },
    },
    care: {
      level: LogLevel.DEBUG,
      context: {
        journeyName: 'Cuidar-me Agora',
      },
    },
    plan: {
      level: LogLevel.DEBUG,
      context: {
        journeyName: 'Meu Plano & Benefícios',
      },
    },
  },
};

/**
 * Staging environment logger configuration
 */
export const STAGING_LOGGER_CONFIG: LoggerConfig = {
  ...BASE_LOGGER_CONFIG,
  level: LogLevel.INFO,
  formatter: FormatterType.JSON,
  context: {
    ...BASE_LOGGER_CONFIG.context,
    environment: TestEnvironment.STAGING,
  },
  transports: [
    {
      type: TransportType.CONSOLE,
      console: {
        colorize: false,
        prettyPrint: false,
        timestamp: true,
      },
    },
    {
      type: TransportType.FILE,
      file: {
        filename: './logs/test-staging.log',
        maxSize: 5 * 1024 * 1024, // 5MB
        maxFiles: 5,
        compress: true,
        append: true,
      },
    },
    {
      type: TransportType.CLOUDWATCH,
      cloudWatch: {
        region: 'us-east-1',
        logGroupName: '/austa-superapp/test-logging-service',
        logStreamName: 'staging',
        retries: 3,
        batchSize: 10000,
        flushInterval: 1000,
      },
    },
  ],
  journeys: {
    health: {
      level: LogLevel.INFO,
      context: {
        journeyName: 'Minha Saúde',
      },
    },
    care: {
      level: LogLevel.INFO,
      context: {
        journeyName: 'Cuidar-me Agora',
      },
    },
    plan: {
      level: LogLevel.INFO,
      context: {
        journeyName: 'Meu Plano & Benefícios',
      },
    },
  },
};

/**
 * Production environment logger configuration
 */
export const PRODUCTION_LOGGER_CONFIG: LoggerConfig = {
  ...BASE_LOGGER_CONFIG,
  level: LogLevel.WARN,
  formatter: FormatterType.JSON,
  context: {
    ...BASE_LOGGER_CONFIG.context,
    environment: TestEnvironment.PRODUCTION,
  },
  transports: [
    {
      type: TransportType.CONSOLE,
      level: LogLevel.ERROR,
      console: {
        colorize: false,
        prettyPrint: false,
        timestamp: true,
      },
    },
    {
      type: TransportType.CLOUDWATCH,
      cloudWatch: {
        region: 'us-east-1',
        logGroupName: '/austa-superapp/test-logging-service',
        logStreamName: 'production',
        retries: 5,
        batchSize: 10000,
        flushInterval: 1000,
      },
    },
  ],
  redactSensitiveData: true,
  sensitiveFields: [
    'password',
    'token',
    'secret',
    'authorization',
    'cookie',
    'ssn',
    'creditCard',
    'healthId',
  ],
  maxObjectDepth: 3,
  handleExceptions: true,
  exitOnError: true,
  journeys: {
    health: {
      level: LogLevel.WARN,
      context: {
        journeyName: 'Minha Saúde',
      },
    },
    care: {
      level: LogLevel.WARN,
      context: {
        journeyName: 'Cuidar-me Agora',
      },
    },
    plan: {
      level: LogLevel.WARN,
      context: {
        journeyName: 'Meu Plano & Benefícios',
      },
    },
  },
};

/**
 * Test-specific logger configuration with memory transport for assertions
 */
export const TEST_LOGGER_CONFIG: LoggerConfig = {
  ...BASE_LOGGER_CONFIG,
  level: LogLevel.DEBUG,
  formatter: FormatterType.JSON,
  context: {
    ...BASE_LOGGER_CONFIG.context,
    environment: TestEnvironment.TEST,
    additional: {
      testing: true,
      testSuite: 'e2e',
    },
  },
  // In-memory transport is handled by the LoggerModule.forRoot({ useTestTransport: true })
  transports: [
    {
      type: TransportType.CONSOLE,
      console: {
        colorize: false,
        prettyPrint: false,
        timestamp: true,
      },
    },
  ],
  silent: false, // Ensure logs are captured for assertions
  journeys: {
    health: {
      level: LogLevel.DEBUG,
      context: {
        journeyName: 'Minha Saúde',
      },
    },
    care: {
      level: LogLevel.DEBUG,
      context: {
        journeyName: 'Cuidar-me Agora',
      },
    },
    plan: {
      level: LogLevel.DEBUG,
      context: {
        journeyName: 'Meu Plano & Benefícios',
      },
    },
  },
};

/**
 * Feature flags for testing conditional logging behavior
 */
export const TEST_FEATURE_FLAGS = {
  enableTracing: true,
  enableJourneyContext: true,
  enableCloudWatchTransport: false,
  enableFileTransport: true,
  enableRedaction: true,
  enableExceptionHandling: true,
};

/**
 * Environment variables for different test scenarios
 */
export const TEST_ENV_VARS = {
  development: {
    NODE_ENV: TestEnvironment.DEVELOPMENT,
    LOG_LEVEL: 'debug',
    LOG_FORMAT: 'text',
    LOG_TRANSPORTS: 'console,file',
    ENABLE_TRACING: 'true',
    ENABLE_CLOUDWATCH: 'false',
    SERVICE_NAME: TEST_SERVICE_INFO.name,
    SERVICE_VERSION: TEST_SERVICE_INFO.version,
  },
  staging: {
    NODE_ENV: TestEnvironment.STAGING,
    LOG_LEVEL: 'info',
    LOG_FORMAT: 'json',
    LOG_TRANSPORTS: 'console,file,cloudwatch',
    ENABLE_TRACING: 'true',
    ENABLE_CLOUDWATCH: 'true',
    SERVICE_NAME: TEST_SERVICE_INFO.name,
    SERVICE_VERSION: TEST_SERVICE_INFO.version,
    AWS_REGION: 'us-east-1',
    CLOUDWATCH_LOG_GROUP: '/austa-superapp/test-logging-service',
    CLOUDWATCH_LOG_STREAM: 'staging',
  },
  production: {
    NODE_ENV: TestEnvironment.PRODUCTION,
    LOG_LEVEL: 'warn',
    LOG_FORMAT: 'json',
    LOG_TRANSPORTS: 'console,cloudwatch',
    ENABLE_TRACING: 'true',
    ENABLE_CLOUDWATCH: 'true',
    SERVICE_NAME: TEST_SERVICE_INFO.name,
    SERVICE_VERSION: TEST_SERVICE_INFO.version,
    AWS_REGION: 'us-east-1',
    CLOUDWATCH_LOG_GROUP: '/austa-superapp/test-logging-service',
    CLOUDWATCH_LOG_STREAM: 'production',
    EXIT_ON_ERROR: 'true',
  },
  test: {
    NODE_ENV: TestEnvironment.TEST,
    LOG_LEVEL: 'debug',
    LOG_FORMAT: 'json',
    LOG_TRANSPORTS: 'console',
    ENABLE_TRACING: 'true',
    ENABLE_CLOUDWATCH: 'false',
    SERVICE_NAME: TEST_SERVICE_INFO.name,
    SERVICE_VERSION: TEST_SERVICE_INFO.version,
    CAPTURE_LOGS_FOR_TESTING: 'true',
    SILENT_LOGS: 'false',
  },
};

/**
 * Test data for journey-specific logging
 */
export const TEST_JOURNEY_DATA = {
  health: {
    journeyId: 'health-journey-123',
    journeyName: 'Minha Saúde',
    userId: 'user-123',
    metrics: ['steps', 'heartRate', 'sleep'],
    devices: ['fitbit', 'appleHealth'],
    goals: ['10000 steps', '8 hours sleep'],
  },
  care: {
    journeyId: 'care-journey-456',
    journeyName: 'Cuidar-me Agora',
    userId: 'user-456',
    appointments: ['checkup', 'specialist'],
    providers: ['dr-smith', 'dr-jones'],
    medications: ['medication-1', 'medication-2'],
  },
  plan: {
    journeyId: 'plan-journey-789',
    journeyName: 'Meu Plano & Benefícios',
    userId: 'user-789',
    planId: 'premium-plan',
    benefits: ['dental', 'vision', 'wellness'],
    claims: ['claim-1', 'claim-2'],
  },
};

/**
 * Test data for error scenarios
 */
export const TEST_ERROR_DATA = {
  validation: {
    type: 'validation',
    message: 'Validation failed',
    details: { field: 'testField', error: 'Invalid value' },
  },
  business: {
    type: 'business',
    message: 'Business rule violation',
    details: { rule: 'businessRule', context: 'operation' },
  },
  technical: {
    type: 'technical',
    message: 'Internal server error',
    details: { component: 'database', operation: 'query' },
  },
  external: {
    type: 'external',
    message: 'External service unavailable',
    details: { service: 'payment-gateway', endpoint: '/process' },
  },
  http: {
    type: 'http',
    message: 'HTTP exception',
    status: 400,
    details: { path: '/api/test', method: 'GET' },
  },
};

/**
 * Test data for trace contexts
 */
export const TEST_TRACE_DATA = {
  traceId: '1234567890abcdef1234567890abcdef',
  spanId: 'abcdef1234567890',
  parentSpanId: '1234567890abcdef',
  serviceName: TEST_SERVICE_INFO.name,
  operationName: 'test-operation',
};
import { LoggerConfig } from '../../src/interfaces/log-config.interface';
import { LogLevel } from '../../src/interfaces/log-level.enum';

/**
 * Sample logger configuration options for different environments and scenarios.
 * These fixtures are used for testing the LoggerModule's configuration handling
 * and ensuring proper logger initialization across environments.
 */

/**
 * Development environment configuration with console output
 * - Uses text formatter with colors and pretty printing
 * - Logs DEBUG level and above to console
 * - Disables CloudWatch integration
 * - Captures all journey contexts
 */
export const developmentConfig: LoggerConfig = {
  level: LogLevel.DEBUG,
  enabled: true,
  debug: true,
  captureExceptions: true,
  captureRejections: true,
  exitOnError: false,
  transports: {
    console: {
      enabled: true,
      colorize: true,
      prettyPrint: true,
      level: LogLevel.DEBUG,
    },
    file: {
      enabled: true,
      directory: './logs',
      filename: 'dev-app',
      maxSize: 10485760, // 10MB
      maxFiles: 5,
      compress: false,
      level: LogLevel.INFO,
    },
    cloudWatch: {
      enabled: false,
    },
  },
  formatters: {
    default: 'text',
    prettyPrint: true,
    includeStacktraces: true,
    maxObjectDepth: 10,
  },
  context: {
    enabled: true,
    serviceName: 'dev-service',
    appName: 'austa-superapp',
    environment: 'development',
    sanitizeFields: ['password', 'token', 'secret', 'authorization', 'apiKey'],
    includeRequestContext: true,
    includeUserContext: true,
    includeJourneyContext: true,
  },
  journeys: {
    health: {
      level: LogLevel.DEBUG,
      additionalContext: {
        journeyVersion: '1.0.0',
        enableDetailedMetrics: true,
      },
    },
    care: {
      level: LogLevel.DEBUG,
      additionalContext: {
        journeyVersion: '1.0.0',
        enableDetailedMetrics: true,
      },
    },
    plan: {
      level: LogLevel.DEBUG,
      additionalContext: {
        journeyVersion: '1.0.0',
        enableDetailedMetrics: true,
      },
    },
  },
  tracing: {
    enabled: true,
    traceIdField: 'traceId',
    spanIdField: 'spanId',
    xrayFormat: false,
  },
  maxBufferSize: 1000,
};

/**
 * Production environment configuration with structured JSON and CloudWatch integration
 * - Uses JSON formatter without pretty printing
 * - Logs INFO level and above to console and CloudWatch
 * - Enables CloudWatch integration with batching
 * - Captures all journey contexts
 */
export const productionConfig: LoggerConfig = {
  level: LogLevel.INFO,
  enabled: true,
  debug: false,
  captureExceptions: true,
  captureRejections: true,
  exitOnError: true,
  transports: {
    console: {
      enabled: true,
      colorize: false,
      prettyPrint: false,
      level: LogLevel.INFO,
    },
    file: {
      enabled: false,
    },
    cloudWatch: {
      enabled: true,
      region: 'us-east-1',
      logGroupName: 'austa-superapp',
      logStreamName: 'production-service',
      batchSize: 50,
      flushInterval: 5000,
      maxRetries: 3,
      level: LogLevel.INFO,
    },
  },
  formatters: {
    default: 'json',
    prettyPrint: false,
    includeStacktraces: true,
    maxObjectDepth: 5,
  },
  context: {
    enabled: true,
    serviceName: 'production-service',
    appName: 'austa-superapp',
    environment: 'production',
    sanitizeFields: ['password', 'token', 'secret', 'authorization', 'apiKey'],
    includeRequestContext: true,
    includeUserContext: true,
    includeJourneyContext: true,
  },
  journeys: {
    health: {
      level: LogLevel.INFO,
      additionalContext: {
        journeyVersion: '1.0.0',
        enableDetailedMetrics: false,
      },
    },
    care: {
      level: LogLevel.INFO,
      additionalContext: {
        journeyVersion: '1.0.0',
        enableDetailedMetrics: false,
      },
    },
    plan: {
      level: LogLevel.INFO,
      additionalContext: {
        journeyVersion: '1.0.0',
        enableDetailedMetrics: false,
      },
    },
  },
  tracing: {
    enabled: true,
    traceIdField: 'traceId',
    spanIdField: 'spanId',
    xrayFormat: true,
  },
  maxBufferSize: 5000,
};

/**
 * Testing environment configuration optimized for automated tests
 * - Uses text formatter with minimal output
 * - Only logs ERROR level and above to console
 * - Disables all other transports
 * - Disables exception capturing to allow tests to fail properly
 */
export const testingConfig: LoggerConfig = {
  level: LogLevel.ERROR,
  enabled: true,
  debug: false,
  captureExceptions: false,
  captureRejections: false,
  exitOnError: false,
  transports: {
    console: {
      enabled: true,
      colorize: true,
      prettyPrint: false,
      level: LogLevel.ERROR,
    },
    file: {
      enabled: false,
    },
    cloudWatch: {
      enabled: false,
    },
  },
  formatters: {
    default: 'text',
    prettyPrint: false,
    includeStacktraces: false,
    maxObjectDepth: 3,
  },
  context: {
    enabled: true,
    serviceName: 'test-service',
    appName: 'austa-superapp',
    environment: 'test',
    sanitizeFields: ['password', 'token', 'secret', 'authorization', 'apiKey'],
    includeRequestContext: false,
    includeUserContext: false,
    includeJourneyContext: true,
  },
  journeys: {
    health: {
      level: LogLevel.ERROR,
      additionalContext: {
        journeyVersion: '1.0.0',
        testMode: true,
      },
    },
    care: {
      level: LogLevel.ERROR,
      additionalContext: {
        journeyVersion: '1.0.0',
        testMode: true,
      },
    },
    plan: {
      level: LogLevel.ERROR,
      additionalContext: {
        journeyVersion: '1.0.0',
        testMode: true,
      },
    },
  },
  tracing: {
    enabled: false,
  },
  maxBufferSize: 100,
};

/**
 * Health journey specific configuration for production
 * - Specialized configuration for the Health journey
 * - Uses CloudWatch integration with health-specific log group
 * - Includes health-specific context fields
 */
export const healthJourneyConfig: LoggerConfig = {
  level: LogLevel.INFO,
  enabled: true,
  debug: false,
  captureExceptions: true,
  captureRejections: true,
  exitOnError: true,
  transports: {
    console: {
      enabled: true,
      colorize: false,
      prettyPrint: false,
      level: LogLevel.INFO,
    },
    file: {
      enabled: false,
    },
    cloudWatch: {
      enabled: true,
      region: 'us-east-1',
      logGroupName: 'austa-superapp-health-journey',
      logStreamName: 'health-service',
      batchSize: 50,
      flushInterval: 5000,
      maxRetries: 3,
      level: LogLevel.INFO,
    },
  },
  formatters: {
    default: 'json',
    prettyPrint: false,
    includeStacktraces: true,
    maxObjectDepth: 5,
  },
  context: {
    enabled: true,
    serviceName: 'health-service',
    appName: 'austa-superapp',
    environment: 'production',
    sanitizeFields: ['password', 'token', 'secret', 'authorization', 'apiKey', 'healthData'],
    includeRequestContext: true,
    includeUserContext: true,
    includeJourneyContext: true,
  },
  journeys: {
    health: {
      level: LogLevel.DEBUG, // More detailed logging for this specific journey
      additionalContext: {
        journeyVersion: '1.0.0',
        journeyType: 'health',
        dataCategories: ['metrics', 'goals', 'devices'],
        sensitiveDataPresent: true,
      },
    },
  },
  tracing: {
    enabled: true,
    traceIdField: 'traceId',
    spanIdField: 'spanId',
    xrayFormat: true,
  },
  maxBufferSize: 5000,
};

/**
 * Care journey specific configuration for production
 * - Specialized configuration for the Care journey
 * - Uses CloudWatch integration with care-specific log group
 * - Includes care-specific context fields
 */
export const careJourneyConfig: LoggerConfig = {
  level: LogLevel.INFO,
  enabled: true,
  debug: false,
  captureExceptions: true,
  captureRejections: true,
  exitOnError: true,
  transports: {
    console: {
      enabled: true,
      colorize: false,
      prettyPrint: false,
      level: LogLevel.INFO,
    },
    file: {
      enabled: false,
    },
    cloudWatch: {
      enabled: true,
      region: 'us-east-1',
      logGroupName: 'austa-superapp-care-journey',
      logStreamName: 'care-service',
      batchSize: 50,
      flushInterval: 5000,
      maxRetries: 3,
      level: LogLevel.INFO,
    },
  },
  formatters: {
    default: 'json',
    prettyPrint: false,
    includeStacktraces: true,
    maxObjectDepth: 5,
  },
  context: {
    enabled: true,
    serviceName: 'care-service',
    appName: 'austa-superapp',
    environment: 'production',
    sanitizeFields: ['password', 'token', 'secret', 'authorization', 'apiKey', 'medicalData'],
    includeRequestContext: true,
    includeUserContext: true,
    includeJourneyContext: true,
  },
  journeys: {
    care: {
      level: LogLevel.DEBUG, // More detailed logging for this specific journey
      additionalContext: {
        journeyVersion: '1.0.0',
        journeyType: 'care',
        dataCategories: ['appointments', 'providers', 'medications'],
        sensitiveDataPresent: true,
      },
    },
  },
  tracing: {
    enabled: true,
    traceIdField: 'traceId',
    spanIdField: 'spanId',
    xrayFormat: true,
  },
  maxBufferSize: 5000,
};

/**
 * Plan journey specific configuration for production
 * - Specialized configuration for the Plan journey
 * - Uses CloudWatch integration with plan-specific log group
 * - Includes plan-specific context fields
 */
export const planJourneyConfig: LoggerConfig = {
  level: LogLevel.INFO,
  enabled: true,
  debug: false,
  captureExceptions: true,
  captureRejections: true,
  exitOnError: true,
  transports: {
    console: {
      enabled: true,
      colorize: false,
      prettyPrint: false,
      level: LogLevel.INFO,
    },
    file: {
      enabled: false,
    },
    cloudWatch: {
      enabled: true,
      region: 'us-east-1',
      logGroupName: 'austa-superapp-plan-journey',
      logStreamName: 'plan-service',
      batchSize: 50,
      flushInterval: 5000,
      maxRetries: 3,
      level: LogLevel.INFO,
    },
  },
  formatters: {
    default: 'json',
    prettyPrint: false,
    includeStacktraces: true,
    maxObjectDepth: 5,
  },
  context: {
    enabled: true,
    serviceName: 'plan-service',
    appName: 'austa-superapp',
    environment: 'production',
    sanitizeFields: ['password', 'token', 'secret', 'authorization', 'apiKey', 'financialData'],
    includeRequestContext: true,
    includeUserContext: true,
    includeJourneyContext: true,
  },
  journeys: {
    plan: {
      level: LogLevel.DEBUG, // More detailed logging for this specific journey
      additionalContext: {
        journeyVersion: '1.0.0',
        journeyType: 'plan',
        dataCategories: ['benefits', 'claims', 'coverage'],
        sensitiveDataPresent: true,
      },
    },
  },
  tracing: {
    enabled: true,
    traceIdField: 'traceId',
    spanIdField: 'spanId',
    xrayFormat: true,
  },
  maxBufferSize: 5000,
};

/**
 * Minimal configuration for testing edge cases
 * - Minimal configuration with only required fields
 * - Tests logger's ability to use defaults for missing options
 */
export const minimalConfig: LoggerConfig = {
  level: LogLevel.INFO,
  enabled: true,
};

/**
 * Configuration with all transports disabled
 * - Tests logger's behavior when all transports are disabled
 * - Should fall back to console transport with warnings
 */
export const noTransportsConfig: LoggerConfig = {
  level: LogLevel.WARN,
  enabled: true,
  transports: {
    console: {
      enabled: false,
    },
    file: {
      enabled: false,
    },
    cloudWatch: {
      enabled: false,
    },
  },
};

/**
 * Configuration with invalid formatter
 * - Tests logger's error handling for invalid formatter configuration
 * - Should fall back to default formatter with warnings
 */
export const invalidFormatterConfig: LoggerConfig = {
  level: LogLevel.INFO,
  enabled: true,
  formatters: {
    // @ts-ignore - Intentionally using invalid formatter for testing
    default: 'invalid-formatter',
  },
};

/**
 * Configuration with extremely verbose settings
 * - Tests logger's performance with maximum verbosity
 * - Includes all possible context fields and debug information
 */
export const verboseConfig: LoggerConfig = {
  level: LogLevel.DEBUG,
  enabled: true,
  debug: true,
  captureExceptions: true,
  captureRejections: true,
  exitOnError: false,
  transports: {
    console: {
      enabled: true,
      colorize: true,
      prettyPrint: true,
      level: LogLevel.DEBUG,
    },
    file: {
      enabled: true,
      directory: './logs',
      filename: 'verbose-app',
      maxSize: 104857600, // 100MB
      maxFiles: 20,
      compress: true,
      level: LogLevel.DEBUG,
    },
    cloudWatch: {
      enabled: true,
      region: 'us-east-1',
      logGroupName: 'austa-superapp-verbose',
      logStreamName: 'verbose-service',
      batchSize: 10, // Smaller batch for more frequent sending
      flushInterval: 1000, // Flush every second
      maxRetries: 5,
      level: LogLevel.DEBUG,
    },
  },
  formatters: {
    default: 'json',
    prettyPrint: true,
    includeStacktraces: true,
    maxObjectDepth: 20, // Very deep object serialization
  },
  context: {
    enabled: true,
    serviceName: 'verbose-service',
    appName: 'austa-superapp',
    environment: 'development',
    sanitizeFields: ['password', 'token', 'secret', 'authorization', 'apiKey'],
    includeRequestContext: true,
    includeUserContext: true,
    includeJourneyContext: true,
  },
  journeys: {
    health: {
      level: LogLevel.DEBUG,
      additionalContext: {
        journeyVersion: '1.0.0',
        enableDetailedMetrics: true,
        debugMode: true,
        traceAllOperations: true,
      },
    },
    care: {
      level: LogLevel.DEBUG,
      additionalContext: {
        journeyVersion: '1.0.0',
        enableDetailedMetrics: true,
        debugMode: true,
        traceAllOperations: true,
      },
    },
    plan: {
      level: LogLevel.DEBUG,
      additionalContext: {
        journeyVersion: '1.0.0',
        enableDetailedMetrics: true,
        debugMode: true,
        traceAllOperations: true,
      },
    },
  },
  tracing: {
    enabled: true,
    traceIdField: 'traceId',
    spanIdField: 'spanId',
    xrayFormat: false,
  },
  maxBufferSize: 10000, // Very large buffer
};

/**
 * Configuration for high-throughput production environment
 * - Optimized for high log volume environments
 * - Uses batching and compression for efficiency
 * - Minimizes context to reduce log size
 */
export const highThroughputConfig: LoggerConfig = {
  level: LogLevel.INFO,
  enabled: true,
  debug: false,
  captureExceptions: true,
  captureRejections: true,
  exitOnError: true,
  transports: {
    console: {
      enabled: false, // Disable console in high-throughput environments
    },
    file: {
      enabled: false,
    },
    cloudWatch: {
      enabled: true,
      region: 'us-east-1',
      logGroupName: 'austa-superapp',
      logStreamName: 'high-throughput-service',
      batchSize: 500, // Larger batch size for efficiency
      flushInterval: 10000, // Longer flush interval (10 seconds)
      maxRetries: 3,
      level: LogLevel.INFO,
    },
  },
  formatters: {
    default: 'json',
    prettyPrint: false,
    includeStacktraces: false, // Disable stacktraces to reduce log size
    maxObjectDepth: 3, // Limit object depth to reduce log size
  },
  context: {
    enabled: true,
    serviceName: 'high-throughput-service',
    appName: 'austa-superapp',
    environment: 'production',
    sanitizeFields: ['password', 'token', 'secret', 'authorization', 'apiKey'],
    includeRequestContext: true,
    includeUserContext: false, // Minimize context to reduce log size
    includeJourneyContext: true,
  },
  journeys: {
    health: {
      level: LogLevel.WARN, // Higher threshold to reduce log volume
      additionalContext: {
        journeyVersion: '1.0.0',
      },
    },
    care: {
      level: LogLevel.WARN, // Higher threshold to reduce log volume
      additionalContext: {
        journeyVersion: '1.0.0',
      },
    },
    plan: {
      level: LogLevel.WARN, // Higher threshold to reduce log volume
      additionalContext: {
        journeyVersion: '1.0.0',
      },
    },
  },
  tracing: {
    enabled: true,
    traceIdField: 'traceId',
    spanIdField: 'spanId',
    xrayFormat: true,
  },
  maxBufferSize: 10000, // Larger buffer for high throughput
};
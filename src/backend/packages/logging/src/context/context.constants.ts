/**
 * Constants and enums related to logging contexts in the AUSTA SuperApp.
 * These constants ensure consistent naming and values throughout the logging system,
 * particularly for journey types which are central to the application's architecture.
 */

/**
 * Enum representing the three main journey types in the AUSTA SuperApp.
 * These journeys form the foundation of the application's user experience model.
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

/**
 * Namespace for context-related constants used in the logging system.
 */
export namespace LoggingContext {
  /**
   * Keys for standard context properties that should be included in all logs.
   */
  export const KEYS = {
    REQUEST_ID: 'requestId',
    CORRELATION_ID: 'correlationId',
    USER_ID: 'userId',
    JOURNEY_TYPE: 'journeyType',
    SERVICE_NAME: 'serviceName',
    ENVIRONMENT: 'environment',
    VERSION: 'version',
    TRACE_ID: 'traceId',
    SPAN_ID: 'spanId',
  } as const;

  /**
   * Default values for context fields when not explicitly provided.
   */
  export const DEFAULTS = {
    JOURNEY_TYPE: null,
    SERVICE_NAME: 'unknown-service',
    ENVIRONMENT: process.env.NODE_ENV || 'development',
    VERSION: process.env.APP_VERSION || '0.0.0',
  } as const;

  /**
   * Maximum length constraints for context values to prevent oversized logs.
   */
  export const MAX_LENGTHS = {
    REQUEST_ID: 36, // UUID length
    CORRELATION_ID: 36,
    USER_ID: 36,
    SERVICE_NAME: 50,
    JOURNEY_TYPE: 10,
  } as const;
}

/**
 * Standard logging levels used throughout the application.
 * Follows industry standard severity ordering.
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * Numeric values associated with each log level for filtering and comparison.
 * Higher numbers indicate higher severity.
 */
export const LOG_LEVEL_VALUES = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
  [LogLevel.FATAL]: 4,
} as const;

/**
 * Default log level to use when not explicitly specified.
 */
export const DEFAULT_LOG_LEVEL = LogLevel.INFO;
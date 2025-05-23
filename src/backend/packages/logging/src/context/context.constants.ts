/**
 * Constants and enums related to logging contexts in the AUSTA SuperApp.
 * This file defines standardized values used throughout the logging system,
 * ensuring consistent naming and values across all services.
 */

/**
 * Enum representing the three main journey types in the AUSTA SuperApp.
 * These journey types are central to the application's architecture and
 * are used to categorize logs by their relevant business domain.
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

/**
 * Keys used for context properties in structured logs.
 * These keys are used consistently across all services to ensure
 * that logs can be properly filtered and analyzed.
 */
export const CONTEXT_KEYS = {
  REQUEST_ID: 'requestId',
  CORRELATION_ID: 'correlationId',
  USER_ID: 'userId',
  JOURNEY_TYPE: 'journeyType',
  SERVICE_NAME: 'serviceName',
  COMPONENT: 'component',
  TRANSACTION_ID: 'transactionId',
  SESSION_ID: 'sessionId',
  ENVIRONMENT: 'environment',
};

/**
 * Default values for context fields when not explicitly provided.
 */
export const DEFAULT_CONTEXT_VALUES = {
  journeyType: 'unknown',
  serviceName: 'unknown-service',
  component: 'unknown-component',
  environment: 'development',
};

/**
 * Namespace for context-related constants to avoid naming collisions.
 * @deprecated Use CONTEXT_KEYS and DEFAULT_CONTEXT_VALUES instead
 */
export namespace LogContext {
  /**
   * Keys used for context properties in structured logs.
   * @deprecated Use CONTEXT_KEYS instead
   */
  export enum Keys {
    REQUEST_ID = 'requestId',
    CORRELATION_ID = 'correlationId',
    USER_ID = 'userId',
    JOURNEY_TYPE = 'journeyType',
    SERVICE_NAME = 'serviceName',
    COMPONENT = 'component',
    TRANSACTION_ID = 'transactionId',
    SESSION_ID = 'sessionId',
    ENVIRONMENT = 'environment',
  }

  /**
   * Default values for context fields when not explicitly provided.
   * @deprecated Use DEFAULT_CONTEXT_VALUES instead
   */
  export const Defaults = {
    JOURNEY_TYPE: 'unknown',
    SERVICE_NAME: 'unknown-service',
    COMPONENT: 'unknown-component',
    ENVIRONMENT: 'development',
  };
}

/**
 * Log levels used throughout the application.
 * These match the standard log levels used in most logging frameworks
 * and provide a way to categorize logs by severity.
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * Export log levels as a constant for use in index.ts
 */
export const LOG_LEVELS = LogLevel;

/**
 * Constants related to log formatting and structure.
 */
export const LogFormat = {
  /**
   * Timestamp format used in logs (ISO 8601).
   */
  TIMESTAMP_FORMAT: 'yyyy-MM-dd\'T\'HH:mm:ss.SSSXXX',
  
  /**
   * Maximum length for log message before truncation.
   */
  MAX_MESSAGE_LENGTH: 10000,
};
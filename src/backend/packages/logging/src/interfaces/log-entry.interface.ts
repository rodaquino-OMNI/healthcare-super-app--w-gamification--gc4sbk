/**
 * Interface representing a log entry before it is formatted by a formatter.
 * This interface includes all necessary fields for comprehensive logging,
 * including message, level, timestamp, context, trace IDs, and journey information.
 */
export interface LogEntry {
  /**
   * The log message
   */
  message: string;

  /**
   * The log level
   */
  level: LogLevel;

  /**
   * Timestamp when the log was created
   */
  timestamp: Date;

  /**
   * The service that generated the log
   */
  service: string;

  /**
   * Additional context information
   */
  context?: Record<string, any>;

  /**
   * Unique identifier for the request
   */
  requestId?: string;

  /**
   * Identifier of the user associated with the log
   */
  userId?: string;

  /**
   * Unique identifier for distributed tracing
   */
  traceId?: string;

  /**
   * Identifier for a specific operation within a trace
   */
  spanId?: string;

  /**
   * Identifier of the parent span
   */
  parentSpanId?: string;

  /**
   * The journey associated with the log
   */
  journey?: JourneyType;

  /**
   * Additional journey-specific context information
   */
  journeyContext?: JourneyContext;

  /**
   * Structured error object with details about any error
   */
  error?: ErrorObject;
}

/**
 * Enum representing the available log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

/**
 * Enum representing the available journey types
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  CROSS_JOURNEY = 'cross_journey'
}

/**
 * Interface representing journey-specific context information
 */
export interface JourneyContext {
  /**
   * The journey ID
   */
  journeyId?: string;

  /**
   * The journey step or action
   */
  step?: string;

  /**
   * Health journey specific context
   */
  health?: {
    /**
     * The health metric type
     */
    metricType?: string;

    /**
     * The device ID
     */
    deviceId?: string;

    /**
     * The goal ID
     */
    goalId?: string;
  };

  /**
   * Care journey specific context
   */
  care?: {
    /**
     * The appointment ID
     */
    appointmentId?: string;

    /**
     * The provider ID
     */
    providerId?: string;

    /**
     * The telemedicine session ID
     */
    sessionId?: string;

    /**
     * The medication ID
     */
    medicationId?: string;
  };

  /**
   * Plan journey specific context
   */
  plan?: {
    /**
     * The plan ID
     */
    planId?: string;

    /**
     * The claim ID
     */
    claimId?: string;

    /**
     * The benefit ID
     */
    benefitId?: string;
  };
}

/**
 * Interface representing a structured error object
 */
export interface ErrorObject {
  /**
   * The error message
   */
  message: string;

  /**
   * The error name or type
   */
  name: string;

  /**
   * The error stack trace
   */
  stack?: string;

  /**
   * The error code
   */
  code?: string | number;

  /**
   * The HTTP status code associated with the error
   */
  statusCode?: number;

  /**
   * Whether the error is operational (expected) or programmatic (unexpected)
   */
  isOperational?: boolean;

  /**
   * Additional error details
   */
  details?: Record<string, any>;

  /**
   * The original error that caused this error
   */
  cause?: ErrorObject;
}
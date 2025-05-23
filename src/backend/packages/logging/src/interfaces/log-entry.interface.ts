/**
 * Interface representing the structure of a log entry before it is formatted.
 * This provides a standardized format for all log entries across the AUSTA SuperApp.
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
   * The name of the service generating the log
   */
  serviceName?: string;

  /**
   * The context where the log was generated (e.g., class name, function name)
   */
  context?: string;

  /**
   * Additional contextual information as key-value pairs
   */
  contextData?: Record<string, any>;

  /**
   * Unique identifier for the request
   */
  requestId?: string;

  /**
   * Unique identifier for the user
   */
  userId?: string;

  /**
   * Unique identifier for the user session
   */
  sessionId?: string;

  /**
   * IP address of the client
   */
  clientIp?: string;

  /**
   * User agent of the client
   */
  userAgent?: string;

  /**
   * Unique identifier for the trace (for distributed tracing)
   */
  traceId?: string;

  /**
   * Unique identifier for the span within a trace
   */
  spanId?: string;

  /**
   * Identifier of the parent span
   */
  parentSpanId?: string;

  /**
   * The journey context (health, care, plan)
   */
  journey?: JourneyContext;

  /**
   * Error object if the log is for an error
   */
  error?: ErrorInfo;

  /**
   * Additional metadata as key-value pairs
   */
  metadata?: Record<string, any>;
}

import { LogLevel } from './log-level.enum';

/**
 * Interface representing journey-specific context information
 */
export interface JourneyContext {
  /**
   * The type of journey (health, care, plan)
   */
  type: JourneyType;

  /**
   * Journey-specific identifier (e.g., appointment ID, claim ID, health record ID)
   */
  resourceId?: string;

  /**
   * The specific action being performed within the journey
   */
  action?: string;

  /**
   * Additional journey-specific data
   */
  data?: Record<string, any>;
}

/**
 * Enum representing the available journey types
 */
export enum JourneyType {
  HEALTH = 'health',  // "Minha Saúde"
  CARE = 'care',      // "Cuidar-me Agora"
  PLAN = 'plan'       // "Meu Plano & Benefícios"
}

/**
 * Interface representing structured error information
 */
export interface ErrorInfo {
  /**
   * The error message
   */
  message: string;

  /**
   * The error name or type
   */
  name?: string;

  /**
   * Error code (if available)
   */
  code?: string | number;

  /**
   * Stack trace as a string
   */
  stack?: string;

  /**
   * Original error object
   */
  originalError?: any;

  /**
   * Whether this is a transient error that might resolve on retry
   */
  isTransient?: boolean;

  /**
   * Whether this error was caused by a client issue (vs. system issue)
   */
  isClientError?: boolean;

  /**
   * Whether this error was caused by an external system
   */
  isExternalError?: boolean;
}
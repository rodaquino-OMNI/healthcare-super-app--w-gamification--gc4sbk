import { LoggerService as NestLoggerService } from '@nestjs/common';

/**
 * Represents the context of a log entry in the AUSTA SuperApp.
 * Provides structured metadata for enhanced observability and tracing.
 */
export interface LogContext {
  /**
   * The journey context (health, care, plan)
   */
  journey?: 'health' | 'care' | 'plan' | 'shared';

  /**
   * The user ID associated with the log entry
   */
  userId?: string;

  /**
   * The request ID for tracking a request across services
   */
  requestId?: string;

  /**
   * The correlation ID for connecting logs, traces, and metrics
   */
  correlationId?: string;

  /**
   * The trace ID for distributed tracing
   */
  traceId?: string;

  /**
   * The span ID for distributed tracing
   */
  spanId?: string;

  /**
   * Additional metadata to include in the log entry
   */
  metadata?: Record<string, any>;

  /**
   * The service or component name
   */
  service?: string;

  /**
   * The operation being performed
   */
  operation?: string;
}

/**
 * Extended Logger interface for the AUSTA SuperApp.
 * Builds upon NestJS's LoggerService interface with additional methods for context-aware logging
 * in the journey-based architecture.
 */
export interface Logger extends NestLoggerService {
  /**
   * Logs a message with the INFO level.
   * @param message The message to log
   * @param context Optional context for the log
   */
  log(message: string, context?: string | LogContext): void;

  /**
   * Logs a message with the ERROR level.
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param context Optional context for the log
   */
  error(message: string, trace?: string | Error, context?: string | LogContext): void;

  /**
   * Logs a message with the WARN level.
   * @param message The message to log
   * @param context Optional context for the log
   */
  warn(message: string, context?: string | LogContext): void;

  /**
   * Logs a message with the DEBUG level.
   * @param message The message to log
   * @param context Optional context for the log
   */
  debug(message: string, context?: string | LogContext): void;

  /**
   * Logs a message with the VERBOSE level.
   * @param message The message to log
   * @param context Optional context for the log
   */
  verbose(message: string, context?: string | LogContext): void;

  /**
   * Logs a message with the FATAL level.
   * @param message The message to log
   * @param context Optional context for the log
   */
  fatal(message: string, context?: string | LogContext): void;

  /**
   * Creates a new logger instance with the provided context.
   * This context will be included in all log entries created by the returned logger.
   * @param context The context to attach to all log entries
   */
  withContext(context: LogContext): Logger;

  /**
   * Creates a new logger instance with the provided journey context.
   * This is a convenience method for setting the journey context.
   * @param journey The journey context (health, care, plan)
   */
  forJourney(journey: 'health' | 'care' | 'plan'): Logger;

  /**
   * Creates a new logger instance with the provided user context.
   * This is a convenience method for setting the user ID.
   * @param userId The user ID to attach to all log entries
   */
  forUser(userId: string): Logger;

  /**
   * Creates a new logger instance with the provided request context.
   * This is a convenience method for setting the request ID and correlation ID.
   * @param requestId The request ID to attach to all log entries
   * @param correlationId Optional correlation ID to attach to all log entries
   */
  forRequest(requestId: string, correlationId?: string): Logger;

  /**
   * Creates a new logger instance with the provided trace context.
   * This is a convenience method for setting the trace ID and span ID.
   * @param traceId The trace ID to attach to all log entries
   * @param spanId Optional span ID to attach to all log entries
   */
  withTracing(traceId: string, spanId?: string): Logger;

  /**
   * Logs a health journey-specific message with the INFO level.
   * @param message The message to log
   * @param context Optional additional context for the log
   */
  logHealth(message: string, context?: Omit<LogContext, 'journey'>): void;

  /**
   * Logs a care journey-specific message with the INFO level.
   * @param message The message to log
   * @param context Optional additional context for the log
   */
  logCare(message: string, context?: Omit<LogContext, 'journey'>): void;

  /**
   * Logs a plan journey-specific message with the INFO level.
   * @param message The message to log
   * @param context Optional additional context for the log
   */
  logPlan(message: string, context?: Omit<LogContext, 'journey'>): void;

  /**
   * Logs a health journey-specific message with the ERROR level.
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param context Optional additional context for the log
   */
  errorHealth(message: string, trace?: string | Error, context?: Omit<LogContext, 'journey'>): void;

  /**
   * Logs a care journey-specific message with the ERROR level.
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param context Optional additional context for the log
   */
  errorCare(message: string, trace?: string | Error, context?: Omit<LogContext, 'journey'>): void;

  /**
   * Logs a plan journey-specific message with the ERROR level.
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param context Optional additional context for the log
   */
  errorPlan(message: string, trace?: string | Error, context?: Omit<LogContext, 'journey'>): void;

  /**
   * Logs a health journey-specific message with the WARN level.
   * @param message The message to log
   * @param context Optional additional context for the log
   */
  warnHealth(message: string, context?: Omit<LogContext, 'journey'>): void;

  /**
   * Logs a care journey-specific message with the WARN level.
   * @param message The message to log
   * @param context Optional additional context for the log
   */
  warnCare(message: string, context?: Omit<LogContext, 'journey'>): void;

  /**
   * Logs a plan journey-specific message with the WARN level.
   * @param message The message to log
   * @param context Optional additional context for the log
   */
  warnPlan(message: string, context?: Omit<LogContext, 'journey'>): void;

  /**
   * Logs a health journey-specific message with the DEBUG level.
   * @param message The message to log
   * @param context Optional additional context for the log
   */
  debugHealth(message: string, context?: Omit<LogContext, 'journey'>): void;

  /**
   * Logs a care journey-specific message with the DEBUG level.
   * @param message The message to log
   * @param context Optional additional context for the log
   */
  debugCare(message: string, context?: Omit<LogContext, 'journey'>): void;

  /**
   * Logs a plan journey-specific message with the DEBUG level.
   * @param message The message to log
   * @param context Optional additional context for the log
   */
  debugPlan(message: string, context?: Omit<LogContext, 'journey'>): void;

  /**
   * Attaches the current trace context from OpenTelemetry to the log entry.
   * This method automatically extracts the trace ID and span ID from the current context.
   */
  withCurrentTraceContext(): Logger;
}
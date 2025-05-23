/**
 * @file Logger Interface
 * @description Defines the extended Logger interface that builds upon NestJS's LoggerService
 * interface with additional methods for context-aware logging in the journey-based architecture.
 *
 * @module @austa/logging/interfaces
 */

import { LoggerService } from '@nestjs/common';
import { LogLevel } from './log-level.enum';
import { JourneyContext, ErrorInfo } from './log-entry.interface';

/**
 * Context object for log entries
 */
export interface LogContext {
  /**
   * The context where the log was generated (e.g., class name, function name)
   */
  context?: string;

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
   * Additional contextual information as key-value pairs
   */
  [key: string]: any;
}

/**
 * Extended Logger interface that builds upon NestJS's LoggerService interface
 * with additional methods for context-aware logging in the journey-based architecture.
 */
export interface Logger extends LoggerService {
  /**
   * Gets the current log level of the logger
   */
  getLogLevel(): LogLevel;

  /**
   * Sets the log level of the logger
   * @param level The log level to set
   */
  setLogLevel(level: LogLevel): void;

  /**
   * Checks if a specific log level is enabled
   * @param level The log level to check
   */
  isLevelEnabled(level: LogLevel): boolean;

  /**
   * Creates a child logger with inherited configuration and additional context
   * @param context Additional context for the child logger
   */
  createChildLogger(context: LogContext): Logger;

  /**
   * Sets the context for subsequent log entries
   * @param context The context to set
   */
  setContext(context: LogContext): void;

  /**
   * Adds context to the current logger context
   * @param context Additional context to add
   */
  addContext(context: LogContext): void;

  /**
   * Clears the current context
   */
  clearContext(): void;

  /**
   * Gets the current context
   */
  getContext(): LogContext;

  /**
   * Logs a message with the DEBUG level
   * @param message The message to log
   * @param context Optional context for the log
   */
  debug(message: string, context?: string | LogContext): void;

  /**
   * Logs a message with the INFO level
   * @param message The message to log
   * @param context Optional context for the log
   */
  log(message: string, context?: string | LogContext): void;

  /**
   * Logs a message with the INFO level (alias for log)
   * @param message The message to log
   * @param context Optional context for the log
   */
  info(message: string, context?: string | LogContext): void;

  /**
   * Logs a message with the WARN level
   * @param message The message to log
   * @param context Optional context for the log
   */
  warn(message: string, context?: string | LogContext): void;

  /**
   * Logs a message with the ERROR level
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param context Optional context for the log
   */
  error(message: string, trace?: string | Error, context?: string | LogContext): void;

  /**
   * Logs a message with the FATAL level
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param context Optional context for the log
   */
  fatal(message: string, trace?: string | Error, context?: string | LogContext): void;

  /**
   * Logs a structured error with the ERROR level
   * @param error The error object or message
   * @param context Optional context for the log
   */
  logError(error: Error | string, context?: string | LogContext): void;

  /**
   * Logs a structured error with the FATAL level
   * @param error The error object or message
   * @param context Optional context for the log
   */
  logFatal(error: Error | string, context?: string | LogContext): void;

  /**
   * Logs a message with the DEBUG level in the Health journey context
   * @param message The message to log
   * @param resourceId Optional resource ID within the Health journey
   * @param context Optional additional context for the log
   */
  debugHealth(message: string, resourceId?: string, context?: string | LogContext): void;

  /**
   * Logs a message with the INFO level in the Health journey context
   * @param message The message to log
   * @param resourceId Optional resource ID within the Health journey
   * @param context Optional additional context for the log
   */
  logHealth(message: string, resourceId?: string, context?: string | LogContext): void;

  /**
   * Logs a message with the WARN level in the Health journey context
   * @param message The message to log
   * @param resourceId Optional resource ID within the Health journey
   * @param context Optional additional context for the log
   */
  warnHealth(message: string, resourceId?: string, context?: string | LogContext): void;

  /**
   * Logs a message with the ERROR level in the Health journey context
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param resourceId Optional resource ID within the Health journey
   * @param context Optional additional context for the log
   */
  errorHealth(message: string, trace?: string | Error, resourceId?: string, context?: string | LogContext): void;

  /**
   * Logs a structured error with the ERROR level in the Health journey context
   * @param error The error object or message
   * @param resourceId Optional resource ID within the Health journey
   * @param context Optional additional context for the log
   */
  logErrorHealth(error: Error | string, resourceId?: string, context?: string | LogContext): void;

  /**
   * Logs a message with the DEBUG level in the Care journey context
   * @param message The message to log
   * @param resourceId Optional resource ID within the Care journey
   * @param context Optional additional context for the log
   */
  debugCare(message: string, resourceId?: string, context?: string | LogContext): void;

  /**
   * Logs a message with the INFO level in the Care journey context
   * @param message The message to log
   * @param resourceId Optional resource ID within the Care journey
   * @param context Optional additional context for the log
   */
  logCare(message: string, resourceId?: string, context?: string | LogContext): void;

  /**
   * Logs a message with the WARN level in the Care journey context
   * @param message The message to log
   * @param resourceId Optional resource ID within the Care journey
   * @param context Optional additional context for the log
   */
  warnCare(message: string, resourceId?: string, context?: string | LogContext): void;

  /**
   * Logs a message with the ERROR level in the Care journey context
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param resourceId Optional resource ID within the Care journey
   * @param context Optional additional context for the log
   */
  errorCare(message: string, trace?: string | Error, resourceId?: string, context?: string | LogContext): void;

  /**
   * Logs a structured error with the ERROR level in the Care journey context
   * @param error The error object or message
   * @param resourceId Optional resource ID within the Care journey
   * @param context Optional additional context for the log
   */
  logErrorCare(error: Error | string, resourceId?: string, context?: string | LogContext): void;

  /**
   * Logs a message with the DEBUG level in the Plan journey context
   * @param message The message to log
   * @param resourceId Optional resource ID within the Plan journey
   * @param context Optional additional context for the log
   */
  debugPlan(message: string, resourceId?: string, context?: string | LogContext): void;

  /**
   * Logs a message with the INFO level in the Plan journey context
   * @param message The message to log
   * @param resourceId Optional resource ID within the Plan journey
   * @param context Optional additional context for the log
   */
  logPlan(message: string, resourceId?: string, context?: string | LogContext): void;

  /**
   * Logs a message with the WARN level in the Plan journey context
   * @param message The message to log
   * @param resourceId Optional resource ID within the Plan journey
   * @param context Optional additional context for the log
   */
  warnPlan(message: string, resourceId?: string, context?: string | LogContext): void;

  /**
   * Logs a message with the ERROR level in the Plan journey context
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param resourceId Optional resource ID within the Plan journey
   * @param context Optional additional context for the log
   */
  errorPlan(message: string, trace?: string | Error, resourceId?: string, context?: string | LogContext): void;

  /**
   * Logs a structured error with the ERROR level in the Plan journey context
   * @param error The error object or message
   * @param resourceId Optional resource ID within the Plan journey
   * @param context Optional additional context for the log
   */
  logErrorPlan(error: Error | string, resourceId?: string, context?: string | LogContext): void;

  /**
   * Logs a message with the specified level
   * @param level The log level
   * @param message The message to log
   * @param context Optional context for the log
   */
  logWithLevel(level: LogLevel, message: string, context?: string | LogContext): void;

  /**
   * Logs a message with the specified level and journey context
   * @param level The log level
   * @param journeyType The journey type
   * @param message The message to log
   * @param resourceId Optional resource ID within the journey
   * @param context Optional additional context for the log
   */
  logWithJourney(level: LogLevel, journeyType: 'health' | 'care' | 'plan', message: string, resourceId?: string, context?: string | LogContext): void;

  /**
   * Starts a timer and returns a function that, when called, logs the elapsed time
   * @param label Label for the timer
   * @param level Log level to use when logging the elapsed time
   * @param context Optional context for the log
   * @returns A function that, when called, logs the elapsed time
   */
  startTimer(label: string, level?: LogLevel, context?: string | LogContext): () => void;

  /**
   * Logs the start of an operation and returns a function that, when called, logs the end of the operation
   * @param operation Name of the operation
   * @param context Optional context for the log
   * @returns A function that, when called, logs the end of the operation
   */
  logOperation(operation: string, context?: string | LogContext): (result?: string) => void;

  /**
   * Logs the start of an operation in the specified journey context and returns a function that, when called, logs the end of the operation
   * @param journeyType The journey type
   * @param operation Name of the operation
   * @param resourceId Optional resource ID within the journey
   * @param context Optional additional context for the log
   * @returns A function that, when called, logs the end of the operation
   */
  logJourneyOperation(journeyType: 'health' | 'care' | 'plan', operation: string, resourceId?: string, context?: string | LogContext): (result?: string) => void;

  /**
   * Flushes any buffered log entries
   * @returns A promise that resolves when all buffered entries have been written
   */
  flush(): Promise<void>;
}
/**
 * @file Mock Logger Service
 * @description Mock implementation of the LoggerService for testing components that depend on logging functionality.
 * Provides a simplified logger with tracking of logged messages at different levels and configurable behavior.
 *
 * @module @austa/logging/test/mocks
 */

import { LoggerService } from '@nestjs/common';
import { Logger, LogContext } from '../../src/interfaces/logger.interface';
import { LogLevel, LogLevelString, LogLevelUtils } from '../../src/interfaces/log-level.enum';
import { JourneyType, JourneyContext, ErrorInfo } from '../../src/interfaces/log-entry.interface';

/**
 * Interface representing a logged message for testing verification
 */
export interface LoggedMessage {
  /** The log level */
  level: LogLevel;
  /** The log level as a string */
  levelString: LogLevelString;
  /** The message content */
  message: string;
  /** Optional trace information (for error logs) */
  trace?: string | Error;
  /** Optional context information */
  context?: string | LogContext;
  /** Journey information if applicable */
  journey?: {
    type: JourneyType;
    resourceId?: string;
  };
  /** Timestamp when the log was created */
  timestamp: Date;
}

/**
 * Mock implementation of the Logger interface for testing.
 * Tracks all logged messages and provides methods to inspect and reset them.
 */
export class MockLoggerService implements Logger {
  /** Stores all logged messages for inspection */
  private messages: LoggedMessage[] = [];
  
  /** Current log level */
  private currentLogLevel: LogLevel = LogLevel.DEBUG;
  
  /** Current context */
  private currentContext: LogContext = {};

  /**
   * Gets all logged messages
   */
  getMessages(): LoggedMessage[] {
    return [...this.messages];
  }

  /**
   * Gets messages filtered by log level
   * @param level The log level to filter by
   */
  getMessagesByLevel(level: LogLevel): LoggedMessage[] {
    return this.messages.filter(msg => msg.level === level);
  }

  /**
   * Gets messages filtered by journey type
   * @param journeyType The journey type to filter by
   */
  getMessagesByJourney(journeyType: JourneyType): LoggedMessage[] {
    return this.messages.filter(msg => msg.journey?.type === journeyType);
  }

  /**
   * Gets messages filtered by content
   * @param substring The substring to search for in messages
   */
  getMessagesByContent(substring: string): LoggedMessage[] {
    return this.messages.filter(msg => msg.message.includes(substring));
  }

  /**
   * Clears all logged messages
   */
  reset(): void {
    this.messages = [];
    this.currentContext = {};
  }

  /**
   * Gets the current log level of the logger
   */
  getLogLevel(): LogLevel {
    return this.currentLogLevel;
  }

  /**
   * Sets the log level of the logger
   * @param level The log level to set
   */
  setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
  }

  /**
   * Checks if a specific log level is enabled
   * @param level The log level to check
   */
  isLevelEnabled(level: LogLevel): boolean {
    return LogLevelUtils.isEnabled(level, this.currentLogLevel);
  }

  /**
   * Creates a child logger with inherited configuration and additional context
   * @param context Additional context for the child logger
   */
  createChildLogger(context: LogContext): Logger {
    const childLogger = new MockLoggerService();
    childLogger.setLogLevel(this.currentLogLevel);
    childLogger.setContext({ ...this.currentContext, ...context });
    return childLogger;
  }

  /**
   * Sets the context for subsequent log entries
   * @param context The context to set
   */
  setContext(context: LogContext): void {
    this.currentContext = { ...context };
  }

  /**
   * Adds context to the current logger context
   * @param context Additional context to add
   */
  addContext(context: LogContext): void {
    this.currentContext = { ...this.currentContext, ...context };
  }

  /**
   * Clears the current context
   */
  clearContext(): void {
    this.currentContext = {};
  }

  /**
   * Gets the current context
   */
  getContext(): LogContext {
    return { ...this.currentContext };
  }

  /**
   * Logs a message with the DEBUG level
   * @param message The message to log
   * @param context Optional context for the log
   */
  debug(message: string, context?: string | LogContext): void {
    this.logWithLevel(LogLevel.DEBUG, message, context);
  }

  /**
   * Logs a message with the INFO level
   * @param message The message to log
   * @param context Optional context for the log
   */
  log(message: string, context?: string | LogContext): void {
    this.logWithLevel(LogLevel.INFO, message, context);
  }

  /**
   * Logs a message with the INFO level (alias for log)
   * @param message The message to log
   * @param context Optional context for the log
   */
  info(message: string, context?: string | LogContext): void {
    this.log(message, context);
  }

  /**
   * Logs a message with the WARN level
   * @param message The message to log
   * @param context Optional context for the log
   */
  warn(message: string, context?: string | LogContext): void {
    this.logWithLevel(LogLevel.WARN, message, context);
  }

  /**
   * Logs a message with the ERROR level
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param context Optional context for the log
   */
  error(message: string, trace?: string | Error, context?: string | LogContext): void {
    if (!this.isLevelEnabled(LogLevel.ERROR)) return;

    this.messages.push({
      level: LogLevel.ERROR,
      levelString: LogLevelUtils.toString(LogLevel.ERROR),
      message,
      trace,
      context: typeof context === 'string' ? { context } : context,
      timestamp: new Date()
    });
  }

  /**
   * Logs a message with the FATAL level
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param context Optional context for the log
   */
  fatal(message: string, trace?: string | Error, context?: string | LogContext): void {
    if (!this.isLevelEnabled(LogLevel.FATAL)) return;

    this.messages.push({
      level: LogLevel.FATAL,
      levelString: LogLevelUtils.toString(LogLevel.FATAL),
      message,
      trace,
      context: typeof context === 'string' ? { context } : context,
      timestamp: new Date()
    });
  }

  /**
   * Logs a structured error with the ERROR level
   * @param error The error object or message
   * @param context Optional context for the log
   */
  logError(error: Error | string, context?: string | LogContext): void {
    const message = typeof error === 'string' ? error : error.message;
    const trace = typeof error === 'string' ? undefined : error;
    this.error(message, trace, context);
  }

  /**
   * Logs a structured error with the FATAL level
   * @param error The error object or message
   * @param context Optional context for the log
   */
  logFatal(error: Error | string, context?: string | LogContext): void {
    const message = typeof error === 'string' ? error : error.message;
    const trace = typeof error === 'string' ? undefined : error;
    this.fatal(message, trace, context);
  }

  /**
   * Logs a message with the DEBUG level in the Health journey context
   * @param message The message to log
   * @param resourceId Optional resource ID within the Health journey
   * @param context Optional additional context for the log
   */
  debugHealth(message: string, resourceId?: string, context?: string | LogContext): void {
    this.logWithJourney(LogLevel.DEBUG, JourneyType.HEALTH, message, resourceId, context);
  }

  /**
   * Logs a message with the INFO level in the Health journey context
   * @param message The message to log
   * @param resourceId Optional resource ID within the Health journey
   * @param context Optional additional context for the log
   */
  logHealth(message: string, resourceId?: string, context?: string | LogContext): void {
    this.logWithJourney(LogLevel.INFO, JourneyType.HEALTH, message, resourceId, context);
  }

  /**
   * Logs a message with the WARN level in the Health journey context
   * @param message The message to log
   * @param resourceId Optional resource ID within the Health journey
   * @param context Optional additional context for the log
   */
  warnHealth(message: string, resourceId?: string, context?: string | LogContext): void {
    this.logWithJourney(LogLevel.WARN, JourneyType.HEALTH, message, resourceId, context);
  }

  /**
   * Logs a message with the ERROR level in the Health journey context
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param resourceId Optional resource ID within the Health journey
   * @param context Optional additional context for the log
   */
  errorHealth(message: string, trace?: string | Error, resourceId?: string, context?: string | LogContext): void {
    if (!this.isLevelEnabled(LogLevel.ERROR)) return;

    this.messages.push({
      level: LogLevel.ERROR,
      levelString: LogLevelUtils.toString(LogLevel.ERROR),
      message,
      trace,
      context: typeof context === 'string' ? { context } : context,
      journey: {
        type: JourneyType.HEALTH,
        resourceId
      },
      timestamp: new Date()
    });
  }

  /**
   * Logs a structured error with the ERROR level in the Health journey context
   * @param error The error object or message
   * @param resourceId Optional resource ID within the Health journey
   * @param context Optional additional context for the log
   */
  logErrorHealth(error: Error | string, resourceId?: string, context?: string | LogContext): void {
    const message = typeof error === 'string' ? error : error.message;
    const trace = typeof error === 'string' ? undefined : error;
    this.errorHealth(message, trace, resourceId, context);
  }

  /**
   * Logs a message with the DEBUG level in the Care journey context
   * @param message The message to log
   * @param resourceId Optional resource ID within the Care journey
   * @param context Optional additional context for the log
   */
  debugCare(message: string, resourceId?: string, context?: string | LogContext): void {
    this.logWithJourney(LogLevel.DEBUG, JourneyType.CARE, message, resourceId, context);
  }

  /**
   * Logs a message with the INFO level in the Care journey context
   * @param message The message to log
   * @param resourceId Optional resource ID within the Care journey
   * @param context Optional additional context for the log
   */
  logCare(message: string, resourceId?: string, context?: string | LogContext): void {
    this.logWithJourney(LogLevel.INFO, JourneyType.CARE, message, resourceId, context);
  }

  /**
   * Logs a message with the WARN level in the Care journey context
   * @param message The message to log
   * @param resourceId Optional resource ID within the Care journey
   * @param context Optional additional context for the log
   */
  warnCare(message: string, resourceId?: string, context?: string | LogContext): void {
    this.logWithJourney(LogLevel.WARN, JourneyType.CARE, message, resourceId, context);
  }

  /**
   * Logs a message with the ERROR level in the Care journey context
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param resourceId Optional resource ID within the Care journey
   * @param context Optional additional context for the log
   */
  errorCare(message: string, trace?: string | Error, resourceId?: string, context?: string | LogContext): void {
    if (!this.isLevelEnabled(LogLevel.ERROR)) return;

    this.messages.push({
      level: LogLevel.ERROR,
      levelString: LogLevelUtils.toString(LogLevel.ERROR),
      message,
      trace,
      context: typeof context === 'string' ? { context } : context,
      journey: {
        type: JourneyType.CARE,
        resourceId
      },
      timestamp: new Date()
    });
  }

  /**
   * Logs a structured error with the ERROR level in the Care journey context
   * @param error The error object or message
   * @param resourceId Optional resource ID within the Care journey
   * @param context Optional additional context for the log
   */
  logErrorCare(error: Error | string, resourceId?: string, context?: string | LogContext): void {
    const message = typeof error === 'string' ? error : error.message;
    const trace = typeof error === 'string' ? undefined : error;
    this.errorCare(message, trace, resourceId, context);
  }

  /**
   * Logs a message with the DEBUG level in the Plan journey context
   * @param message The message to log
   * @param resourceId Optional resource ID within the Plan journey
   * @param context Optional additional context for the log
   */
  debugPlan(message: string, resourceId?: string, context?: string | LogContext): void {
    this.logWithJourney(LogLevel.DEBUG, JourneyType.PLAN, message, resourceId, context);
  }

  /**
   * Logs a message with the INFO level in the Plan journey context
   * @param message The message to log
   * @param resourceId Optional resource ID within the Plan journey
   * @param context Optional additional context for the log
   */
  logPlan(message: string, resourceId?: string, context?: string | LogContext): void {
    this.logWithJourney(LogLevel.INFO, JourneyType.PLAN, message, resourceId, context);
  }

  /**
   * Logs a message with the WARN level in the Plan journey context
   * @param message The message to log
   * @param resourceId Optional resource ID within the Plan journey
   * @param context Optional additional context for the log
   */
  warnPlan(message: string, resourceId?: string, context?: string | LogContext): void {
    this.logWithJourney(LogLevel.WARN, JourneyType.PLAN, message, resourceId, context);
  }

  /**
   * Logs a message with the ERROR level in the Plan journey context
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param resourceId Optional resource ID within the Plan journey
   * @param context Optional additional context for the log
   */
  errorPlan(message: string, trace?: string | Error, resourceId?: string, context?: string | LogContext): void {
    if (!this.isLevelEnabled(LogLevel.ERROR)) return;

    this.messages.push({
      level: LogLevel.ERROR,
      levelString: LogLevelUtils.toString(LogLevel.ERROR),
      message,
      trace,
      context: typeof context === 'string' ? { context } : context,
      journey: {
        type: JourneyType.PLAN,
        resourceId
      },
      timestamp: new Date()
    });
  }

  /**
   * Logs a structured error with the ERROR level in the Plan journey context
   * @param error The error object or message
   * @param resourceId Optional resource ID within the Plan journey
   * @param context Optional additional context for the log
   */
  logErrorPlan(error: Error | string, resourceId?: string, context?: string | LogContext): void {
    const message = typeof error === 'string' ? error : error.message;
    const trace = typeof error === 'string' ? undefined : error;
    this.errorPlan(message, trace, resourceId, context);
  }

  /**
   * Logs a message with the specified level
   * @param level The log level
   * @param message The message to log
   * @param context Optional context for the log
   */
  logWithLevel(level: LogLevel, message: string, context?: string | LogContext): void {
    if (!this.isLevelEnabled(level)) return;

    this.messages.push({
      level,
      levelString: LogLevelUtils.toString(level),
      message,
      context: typeof context === 'string' ? { context } : context,
      timestamp: new Date()
    });
  }

  /**
   * Logs a message with the specified level and journey context
   * @param level The log level
   * @param journeyType The journey type
   * @param message The message to log
   * @param resourceId Optional resource ID within the journey
   * @param context Optional additional context for the log
   */
  logWithJourney(level: LogLevel, journeyType: JourneyType, message: string, resourceId?: string, context?: string | LogContext): void {
    if (!this.isLevelEnabled(level)) return;

    this.messages.push({
      level,
      levelString: LogLevelUtils.toString(level),
      message,
      context: typeof context === 'string' ? { context } : context,
      journey: {
        type: journeyType,
        resourceId
      },
      timestamp: new Date()
    });
  }

  /**
   * Starts a timer and returns a function that, when called, logs the elapsed time
   * @param label Label for the timer
   * @param level Log level to use when logging the elapsed time
   * @param context Optional context for the log
   * @returns A function that, when called, logs the elapsed time
   */
  startTimer(label: string, level: LogLevel = LogLevel.INFO, context?: string | LogContext): () => void {
    const start = Date.now();
    return () => {
      const elapsed = Date.now() - start;
      this.logWithLevel(level, `${label}: ${elapsed}ms`, context);
    };
  }

  /**
   * Logs the start of an operation and returns a function that, when called, logs the end of the operation
   * @param operation Name of the operation
   * @param context Optional context for the log
   * @returns A function that, when called, logs the end of the operation
   */
  logOperation(operation: string, context?: string | LogContext): (result?: string) => void {
    this.log(`Started operation: ${operation}`, context);
    const timer = this.startTimer(`Operation ${operation} completed`, LogLevel.INFO, context);
    return (result?: string) => {
      timer();
      if (result) {
        this.log(`Operation ${operation} result: ${result}`, context);
      }
    };
  }

  /**
   * Logs the start of an operation in the specified journey context and returns a function that, when called, logs the end of the operation
   * @param journeyType The journey type
   * @param operation Name of the operation
   * @param resourceId Optional resource ID within the journey
   * @param context Optional additional context for the log
   * @returns A function that, when called, logs the end of the operation
   */
  logJourneyOperation(journeyType: JourneyType, operation: string, resourceId?: string, context?: string | LogContext): (result?: string) => void {
    this.logWithJourney(LogLevel.INFO, journeyType, `Started operation: ${operation}`, resourceId, context);
    const start = Date.now();
    return (result?: string) => {
      const elapsed = Date.now() - start;
      this.logWithJourney(
        LogLevel.INFO,
        journeyType,
        `Operation ${operation} completed in ${elapsed}ms${result ? `: ${result}` : ''}`,
        resourceId,
        context
      );
    };
  }

  /**
   * Flushes any buffered log entries
   * @returns A promise that resolves when all buffered entries have been written
   */
  async flush(): Promise<void> {
    // Mock implementation - nothing to flush
    return Promise.resolve();
  }

  /**
   * NestJS verbose method (alias for debug)
   * @param message The message to log
   * @param context Optional context for the log
   */
  verbose(message: string, context?: string): void {
    this.debug(message, context);
  }
}
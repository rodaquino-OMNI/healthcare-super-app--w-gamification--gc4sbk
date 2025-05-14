import { LoggerService as NestLoggerService } from '@nestjs/common';
import { Logger, LogContext } from '../../src/interfaces/logger.interface';
import { LogLevel } from '../../src/interfaces/log-level.enum';

/**
 * Interface for a logged message entry used for test verification
 */
export interface LoggedMessage {
  /** The log level of the message */
  level: LogLevel;
  /** The message content */
  message: string;
  /** Optional trace information (for error logs) */
  trace?: string | Error;
  /** Optional context information */
  context?: string | LogContext;
  /** Timestamp when the log was created */
  timestamp: Date;
}

/**
 * Mock implementation of the Logger interface for testing.
 * Provides tracking of logged messages and configurable behavior.
 */
export class LoggerServiceMock implements Logger {
  /** Stores all logged messages for verification */
  private messages: LoggedMessage[] = [];
  
  /** Current context that will be merged with any provided context */
  private currentContext: LogContext = {};

  /** Flag to control whether the mock actually logs to console */
  private consoleOutput: boolean = false;

  /**
   * Creates a new LoggerServiceMock instance
   * @param consoleOutput Whether to also output logs to console (default: false)
   */
  constructor(consoleOutput = false) {
    this.consoleOutput = consoleOutput;
  }

  /**
   * Logs a message with the INFO level
   * @param message The message to log
   * @param context Optional context for the log
   */
  log(message: string, context?: string | LogContext): void {
    this.addLoggedMessage(LogLevel.INFO, message, undefined, context);
    if (this.consoleOutput) {
      console.log(message, context || '');
    }
  }

  /**
   * Logs a message with the ERROR level
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param context Optional context for the log
   */
  error(message: string, trace?: string | Error, context?: string | LogContext): void {
    this.addLoggedMessage(LogLevel.ERROR, message, trace, context);
    if (this.consoleOutput) {
      console.error(message, trace || '', context || '');
    }
  }

  /**
   * Logs a message with the WARN level
   * @param message The message to log
   * @param context Optional context for the log
   */
  warn(message: string, context?: string | LogContext): void {
    this.addLoggedMessage(LogLevel.WARN, message, undefined, context);
    if (this.consoleOutput) {
      console.warn(message, context || '');
    }
  }

  /**
   * Logs a message with the DEBUG level
   * @param message The message to log
   * @param context Optional context for the log
   */
  debug(message: string, context?: string | LogContext): void {
    this.addLoggedMessage(LogLevel.DEBUG, message, undefined, context);
    if (this.consoleOutput) {
      console.debug(message, context || '');
    }
  }

  /**
   * Logs a message with the VERBOSE level
   * @param message The message to log
   * @param context Optional context for the log
   */
  verbose(message: string, context?: string | LogContext): void {
    // Map VERBOSE to DEBUG since LogLevel enum doesn't have VERBOSE
    this.addLoggedMessage(LogLevel.DEBUG, message, undefined, context);
    if (this.consoleOutput) {
      console.debug(`[VERBOSE] ${message}`, context || '');
    }
  }

  /**
   * Logs a message with the FATAL level
   * @param message The message to log
   * @param context Optional context for the log
   */
  fatal(message: string, context?: string | LogContext): void {
    this.addLoggedMessage(LogLevel.FATAL, message, undefined, context);
    if (this.consoleOutput) {
      console.error(`[FATAL] ${message}`, context || '');
    }
  }

  /**
   * Creates a new logger instance with the provided context
   * @param context The context to attach to all log entries
   */
  withContext(context: LogContext): Logger {
    const newLogger = new LoggerServiceMock(this.consoleOutput);
    newLogger.currentContext = { ...this.currentContext, ...context };
    newLogger.messages = this.messages; // Share the same messages array for tracking
    return newLogger;
  }

  /**
   * Creates a new logger instance with the provided journey context
   * @param journey The journey context (health, care, plan)
   */
  forJourney(journey: 'health' | 'care' | 'plan'): Logger {
    return this.withContext({ journey });
  }

  /**
   * Creates a new logger instance with the provided user context
   * @param userId The user ID to attach to all log entries
   */
  forUser(userId: string): Logger {
    return this.withContext({ userId });
  }

  /**
   * Creates a new logger instance with the provided request context
   * @param requestId The request ID to attach to all log entries
   * @param correlationId Optional correlation ID to attach to all log entries
   */
  forRequest(requestId: string, correlationId?: string): Logger {
    return this.withContext({ requestId, correlationId });
  }

  /**
   * Creates a new logger instance with the provided trace context
   * @param traceId The trace ID to attach to all log entries
   * @param spanId Optional span ID to attach to all log entries
   */
  withTracing(traceId: string, spanId?: string): Logger {
    return this.withContext({ traceId, spanId });
  }

  /**
   * Logs a health journey-specific message with the INFO level
   * @param message The message to log
   * @param context Optional additional context for the log
   */
  logHealth(message: string, context?: Omit<LogContext, 'journey'>): void {
    this.log(message, { ...context, journey: 'health' });
  }

  /**
   * Logs a care journey-specific message with the INFO level
   * @param message The message to log
   * @param context Optional additional context for the log
   */
  logCare(message: string, context?: Omit<LogContext, 'journey'>): void {
    this.log(message, { ...context, journey: 'care' });
  }

  /**
   * Logs a plan journey-specific message with the INFO level
   * @param message The message to log
   * @param context Optional additional context for the log
   */
  logPlan(message: string, context?: Omit<LogContext, 'journey'>): void {
    this.log(message, { ...context, journey: 'plan' });
  }

  /**
   * Logs a health journey-specific message with the ERROR level
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param context Optional additional context for the log
   */
  errorHealth(message: string, trace?: string | Error, context?: Omit<LogContext, 'journey'>): void {
    this.error(message, trace, { ...context, journey: 'health' });
  }

  /**
   * Logs a care journey-specific message with the ERROR level
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param context Optional additional context for the log
   */
  errorCare(message: string, trace?: string | Error, context?: Omit<LogContext, 'journey'>): void {
    this.error(message, trace, { ...context, journey: 'care' });
  }

  /**
   * Logs a plan journey-specific message with the ERROR level
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param context Optional additional context for the log
   */
  errorPlan(message: string, trace?: string | Error, context?: Omit<LogContext, 'journey'>): void {
    this.error(message, trace, { ...context, journey: 'plan' });
  }

  /**
   * Logs a health journey-specific message with the WARN level
   * @param message The message to log
   * @param context Optional additional context for the log
   */
  warnHealth(message: string, context?: Omit<LogContext, 'journey'>): void {
    this.warn(message, { ...context, journey: 'health' });
  }

  /**
   * Logs a care journey-specific message with the WARN level
   * @param message The message to log
   * @param context Optional additional context for the log
   */
  warnCare(message: string, context?: Omit<LogContext, 'journey'>): void {
    this.warn(message, { ...context, journey: 'care' });
  }

  /**
   * Logs a plan journey-specific message with the WARN level
   * @param message The message to log
   * @param context Optional additional context for the log
   */
  warnPlan(message: string, context?: Omit<LogContext, 'journey'>): void {
    this.warn(message, { ...context, journey: 'plan' });
  }

  /**
   * Logs a health journey-specific message with the DEBUG level
   * @param message The message to log
   * @param context Optional additional context for the log
   */
  debugHealth(message: string, context?: Omit<LogContext, 'journey'>): void {
    this.debug(message, { ...context, journey: 'health' });
  }

  /**
   * Logs a care journey-specific message with the DEBUG level
   * @param message The message to log
   * @param context Optional additional context for the log
   */
  debugCare(message: string, context?: Omit<LogContext, 'journey'>): void {
    this.debug(message, { ...context, journey: 'care' });
  }

  /**
   * Logs a plan journey-specific message with the DEBUG level
   * @param message The message to log
   * @param context Optional additional context for the log
   */
  debugPlan(message: string, context?: Omit<LogContext, 'journey'>): void {
    this.debug(message, { ...context, journey: 'plan' });
  }

  /**
   * Attaches the current trace context from OpenTelemetry to the log entry.
   * In the mock implementation, this is a no-op that returns the same logger.
   */
  withCurrentTraceContext(): Logger {
    // In a mock, we don't have actual OpenTelemetry context, so just return this
    return this;
  }

  /**
   * Adds a logged message to the internal tracking array
   * @param level The log level
   * @param message The message content
   * @param trace Optional trace information
   * @param context Optional context information
   */
  private addLoggedMessage(level: LogLevel, message: string, trace?: string | Error, context?: string | LogContext): void {
    let mergedContext: string | LogContext | undefined = context;
    
    // If we have a current context and the provided context is an object, merge them
    if (Object.keys(this.currentContext).length > 0 && typeof context === 'object') {
      mergedContext = { ...this.currentContext, ...context };
    } 
    // If we have a current context and no context was provided, use the current context
    else if (Object.keys(this.currentContext).length > 0 && context === undefined) {
      mergedContext = { ...this.currentContext };
    }
    // Otherwise, use the provided context as is

    this.messages.push({
      level,
      message,
      trace,
      context: mergedContext,
      timestamp: new Date(),
    });
  }

  /**
   * Resets the logged messages array, clearing all tracked logs.
   * Useful for clearing state between tests.
   */
  reset(): void {
    this.messages = [];
    this.currentContext = {};
  }

  /**
   * Gets all logged messages for verification in tests
   */
  getMessages(): LoggedMessage[] {
    return [...this.messages];
  }

  /**
   * Gets all logged messages of a specific level
   * @param level The log level to filter by
   */
  getMessagesByLevel(level: LogLevel): LoggedMessage[] {
    return this.messages.filter(msg => msg.level === level);
  }

  /**
   * Gets all logged messages for a specific journey
   * @param journey The journey to filter by
   */
  getMessagesByJourney(journey: 'health' | 'care' | 'plan' | 'shared'): LoggedMessage[] {
    return this.messages.filter(msg => {
      if (typeof msg.context === 'object' && msg.context !== null) {
        return (msg.context as LogContext).journey === journey;
      }
      return false;
    });
  }

  /**
   * Gets all logged messages containing a specific substring
   * @param substring The substring to search for in messages
   */
  getMessagesByContent(substring: string): LoggedMessage[] {
    return this.messages.filter(msg => msg.message.includes(substring));
  }

  /**
   * Gets all logged messages for a specific user
   * @param userId The user ID to filter by
   */
  getMessagesByUser(userId: string): LoggedMessage[] {
    return this.messages.filter(msg => {
      if (typeof msg.context === 'object' && msg.context !== null) {
        return (msg.context as LogContext).userId === userId;
      }
      return false;
    });
  }

  /**
   * Gets all logged messages for a specific request
   * @param requestId The request ID to filter by
   */
  getMessagesByRequest(requestId: string): LoggedMessage[] {
    return this.messages.filter(msg => {
      if (typeof msg.context === 'object' && msg.context !== null) {
        return (msg.context as LogContext).requestId === requestId;
      }
      return false;
    });
  }

  /**
   * Checks if a specific message was logged
   * @param level The log level to check
   * @param messageSubstring The substring to search for in messages
   */
  hasLoggedMessage(level: LogLevel, messageSubstring: string): boolean {
    return this.messages.some(msg => 
      msg.level === level && msg.message.includes(messageSubstring)
    );
  }

  /**
   * Gets the count of logged messages
   */
  getMessageCount(): number {
    return this.messages.length;
  }

  /**
   * Gets the count of logged messages of a specific level
   * @param level The log level to count
   */
  getMessageCountByLevel(level: LogLevel): number {
    return this.getMessagesByLevel(level).length;
  }
}
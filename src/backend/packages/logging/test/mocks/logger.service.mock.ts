import { LoggerService as NestLoggerService } from '@nestjs/common';

/**
 * Log level enum for the AUSTA SuperApp logging system.
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
  VERBOSE = 'verbose',
}

/**
 * Interface representing a logged message with its level and context.
 */
export interface LoggedMessage {
  level: LogLevel;
  message: string;
  context?: any;
  trace?: any;
  timestamp: Date;
  journeyId?: string;
  requestId?: string;
  userId?: string;
}

/**
 * Mock implementation of the LoggerService for testing purposes.
 * Provides tracking of logged messages and context-aware logging methods.
 */
export class LoggerServiceMock implements NestLoggerService {
  private messages: LoggedMessage[] = [];

  /**
   * Logs a message with the INFO level.
   * @param message The message to log
   * @param context Optional context for the log
   */
  log(message: string, context?: any): void {
    this.addLoggedMessage(LogLevel.INFO, message, context);
  }

  /**
   * Logs a message with the ERROR level.
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param context Optional context for the log
   */
  error(message: string, trace?: any, context?: any): void {
    this.addLoggedMessage(LogLevel.ERROR, message, context, trace);
  }

  /**
   * Logs a message with the WARN level.
   * @param message The message to log
   * @param context Optional context for the log
   */
  warn(message: string, context?: any): void {
    this.addLoggedMessage(LogLevel.WARN, message, context);
  }

  /**
   * Logs a message with the DEBUG level.
   * @param message The message to log
   * @param context Optional context for the log
   */
  debug(message: string, context?: any): void {
    this.addLoggedMessage(LogLevel.DEBUG, message, context);
  }

  /**
   * Logs a message with the VERBOSE level.
   * @param message The message to log
   * @param context Optional context for the log
   */
  verbose(message: string, context?: any): void {
    this.addLoggedMessage(LogLevel.VERBOSE, message, context);
  }

  /**
   * Logs a message with the FATAL level.
   * @param message The message to log
   * @param context Optional context for the log
   */
  fatal(message: string, context?: any): void {
    this.addLoggedMessage(LogLevel.FATAL, message, context);
  }

  /**
   * Logs a message with journey context.
   * @param journeyId The journey identifier
   * @param level The log level
   * @param message The message to log
   * @param context Optional additional context
   */
  logWithJourney(journeyId: string, level: LogLevel, message: string, context?: any): void {
    this.addLoggedMessage(level, message, context, undefined, journeyId);
  }

  /**
   * Logs a message with request context.
   * @param requestId The request identifier
   * @param level The log level
   * @param message The message to log
   * @param context Optional additional context
   */
  logWithRequest(requestId: string, level: LogLevel, message: string, context?: any): void {
    this.addLoggedMessage(level, message, context, undefined, undefined, requestId);
  }

  /**
   * Logs a message with user context.
   * @param userId The user identifier
   * @param level The log level
   * @param message The message to log
   * @param context Optional additional context
   */
  logWithUser(userId: string, level: LogLevel, message: string, context?: any): void {
    this.addLoggedMessage(level, message, context, undefined, undefined, undefined, userId);
  }

  /**
   * Logs a message with complete context (journey, request, and user).
   * @param journeyId The journey identifier
   * @param requestId The request identifier
   * @param userId The user identifier
   * @param level The log level
   * @param message The message to log
   * @param context Optional additional context
   */
  logWithContext(
    journeyId: string,
    requestId: string,
    userId: string,
    level: LogLevel,
    message: string,
    context?: any
  ): void {
    this.addLoggedMessage(level, message, context, undefined, journeyId, requestId, userId);
  }

  /**
   * Adds a logged message to the internal messages array.
   */
  private addLoggedMessage(
    level: LogLevel,
    message: string,
    context?: any,
    trace?: any,
    journeyId?: string,
    requestId?: string,
    userId?: string
  ): void {
    this.messages.push({
      level,
      message,
      context,
      trace,
      timestamp: new Date(),
      journeyId,
      requestId,
      userId,
    });
  }

  /**
   * Gets all logged messages.
   * @returns Array of logged messages
   */
  getMessages(): LoggedMessage[] {
    return [...this.messages];
  }

  /**
   * Gets messages of a specific log level.
   * @param level The log level to filter by
   * @returns Array of logged messages with the specified level
   */
  getMessagesByLevel(level: LogLevel): LoggedMessage[] {
    return this.messages.filter((msg) => msg.level === level);
  }

  /**
   * Gets messages containing a specific string.
   * @param text The text to search for in messages
   * @returns Array of logged messages containing the specified text
   */
  getMessagesByText(text: string): LoggedMessage[] {
    return this.messages.filter((msg) => msg.message.includes(text));
  }

  /**
   * Gets messages for a specific journey.
   * @param journeyId The journey identifier to filter by
   * @returns Array of logged messages for the specified journey
   */
  getMessagesByJourney(journeyId: string): LoggedMessage[] {
    return this.messages.filter((msg) => msg.journeyId === journeyId);
  }

  /**
   * Gets messages for a specific request.
   * @param requestId The request identifier to filter by
   * @returns Array of logged messages for the specified request
   */
  getMessagesByRequest(requestId: string): LoggedMessage[] {
    return this.messages.filter((msg) => msg.requestId === requestId);
  }

  /**
   * Gets messages for a specific user.
   * @param userId The user identifier to filter by
   * @returns Array of logged messages for the specified user
   */
  getMessagesByUser(userId: string): LoggedMessage[] {
    return this.messages.filter((msg) => msg.userId === userId);
  }

  /**
   * Checks if a specific message was logged.
   * @param level The log level to check
   * @param messageText The message text to check for
   * @returns True if the message was logged, false otherwise
   */
  hasLoggedMessage(level: LogLevel, messageText: string): boolean {
    return this.messages.some(
      (msg) => msg.level === level && msg.message.includes(messageText)
    );
  }

  /**
   * Clears all logged messages.
   * Useful for resetting the mock between tests.
   */
  reset(): void {
    this.messages = [];
  }
}
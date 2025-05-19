import { LoggerService as NestLoggerService, LogLevel } from '@nestjs/common';

/**
 * Interface representing a logged message with its metadata
 */
export interface LoggedMessage {
  message: string;
  context?: string;
  trace?: string;
  timestamp: Date;
  journeyId?: string;
  requestId?: string;
  userId?: string;
}

/**
 * Mock implementation of NestJS Logger and LoggerService for testing
 * Provides a simplified Logger with tracking of logged messages and configurable behavior
 */
export class MockLogger implements NestLoggerService {
  private readonly logs: Record<string, LoggedMessage[]> = {
    log: [],
    error: [],
    warn: [],
    debug: [],
    verbose: [],
    fatal: [], // Added FATAL level for comprehensive logging
  };

  private contextName?: string;
  private journeyId?: string;
  private requestId?: string;
  private userId?: string;

  /**
   * Creates a new MockLogger instance
   * @param context Optional context name for the logger
   * @param options Optional configuration options
   */
  constructor(context?: string, options?: { journeyId?: string; requestId?: string; userId?: string }) {
    this.contextName = context;
    this.journeyId = options?.journeyId;
    this.requestId = options?.requestId;
    this.userId = options?.userId;
  }

  /**
   * Logs a message with the INFO level
   * @param message The message to log
   * @param context Optional context for the log
   * @param metadata Optional additional metadata
   */
  log(message: any, context?: string, metadata?: Record<string, any>): void {
    this.logs.log.push({
      message: this.formatMessage(message),
      context: context || this.contextName,
      timestamp: new Date(),
      journeyId: metadata?.journeyId || this.journeyId,
      requestId: metadata?.requestId || this.requestId,
      userId: metadata?.userId || this.userId,
      ...metadata
    });
  }

  /**
   * Logs a message with the ERROR level
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param context Optional context for the log
   * @param metadata Optional additional metadata
   */
  error(message: any, trace?: string, context?: string, metadata?: Record<string, any>): void {
    this.logs.error.push({
      message: this.formatMessage(message),
      trace,
      context: context || this.contextName,
      timestamp: new Date(),
      journeyId: metadata?.journeyId || this.journeyId,
      requestId: metadata?.requestId || this.requestId,
      userId: metadata?.userId || this.userId,
      ...metadata
    });
  }

  /**
   * Logs a message with the WARN level
   * @param message The message to log
   * @param context Optional context for the log
   * @param metadata Optional additional metadata
   */
  warn(message: any, context?: string, metadata?: Record<string, any>): void {
    this.logs.warn.push({
      message: this.formatMessage(message),
      context: context || this.contextName,
      timestamp: new Date(),
      journeyId: metadata?.journeyId || this.journeyId,
      requestId: metadata?.requestId || this.requestId,
      userId: metadata?.userId || this.userId,
      ...metadata
    });
  }

  /**
   * Logs a message with the DEBUG level
   * @param message The message to log
   * @param context Optional context for the log
   * @param metadata Optional additional metadata
   */
  debug(message: any, context?: string, metadata?: Record<string, any>): void {
    this.logs.debug.push({
      message: this.formatMessage(message),
      context: context || this.contextName,
      timestamp: new Date(),
      journeyId: metadata?.journeyId || this.journeyId,
      requestId: metadata?.requestId || this.requestId,
      userId: metadata?.userId || this.userId,
      ...metadata
    });
  }

  /**
   * Logs a message with the VERBOSE level
   * @param message The message to log
   * @param context Optional context for the log
   * @param metadata Optional additional metadata
   */
  verbose(message: any, context?: string, metadata?: Record<string, any>): void {
    this.logs.verbose.push({
      message: this.formatMessage(message),
      context: context || this.contextName,
      timestamp: new Date(),
      journeyId: metadata?.journeyId || this.journeyId,
      requestId: metadata?.requestId || this.requestId,
      userId: metadata?.userId || this.userId,
      ...metadata
    });
  }
  
  /**
   * Logs a message with the FATAL level
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param context Optional context for the log
   * @param metadata Optional additional metadata
   */
  fatal(message: any, trace?: string, context?: string, metadata?: Record<string, any>): void {
    this.logs.fatal.push({
      message: this.formatMessage(message),
      trace,
      context: context || this.contextName,
      timestamp: new Date(),
      journeyId: metadata?.journeyId || this.journeyId,
      requestId: metadata?.requestId || this.requestId,
      userId: metadata?.userId || this.userId,
      ...metadata
    });
  }

  /**
   * Sets the log levels to be logged
   * This is a required method for the NestLoggerService interface but is a no-op in the mock
   * @param levels The log levels to log
   */
  setLogLevels(levels: LogLevel[]): void {
    // No-op for the mock implementation
  }

  /**
   * Formats the message to ensure it's a string
   * @param message The message to format
   * @returns The formatted message as a string
   */
  private formatMessage(message: any): string {
    if (typeof message === 'object') {
      return JSON.stringify(message);
    }
    return String(message);
  }

  /**
   * Gets all logged messages of a specific level
   * @param level The log level to retrieve
   * @returns Array of logged messages for the specified level
   */
  getLogsByLevel(level: 'log' | 'error' | 'warn' | 'debug' | 'verbose' | 'fatal'): LoggedMessage[] {
    return [...this.logs[level]];
  }

  /**
   * Gets all logged messages across all levels
   * @returns Record of all logged messages by level
   */
  getAllLogs(): Record<string, LoggedMessage[]> {
    return {
      log: [...this.logs.log],
      error: [...this.logs.error],
      warn: [...this.logs.warn],
      debug: [...this.logs.debug],
      verbose: [...this.logs.verbose],
      fatal: [...this.logs.fatal],
    };
  }

  /**
   * Checks if a specific message was logged at a given level
   * @param level The log level to check
   * @param messageSubstring Substring to search for in logged messages
   * @param options Optional filtering options
   * @returns True if the message was logged, false otherwise
   */
  hasLoggedMessage(
    level: 'log' | 'error' | 'warn' | 'debug' | 'verbose' | 'fatal', 
    messageSubstring: string, 
    options?: { context?: string; journeyId?: string; requestId?: string; userId?: string }
  ): boolean {
    return this.logs[level].some(log => 
      log.message.includes(messageSubstring) && 
      (!options?.context || log.context === options.context) &&
      (!options?.journeyId || log.journeyId === options.journeyId) &&
      (!options?.requestId || log.requestId === options.requestId) &&
      (!options?.userId || log.userId === options.userId)
    );
  }

  /**
   * Finds all logged messages that match the given criteria
   * @param level The log level to search
   * @param messageSubstring Substring to search for in logged messages
   * @param options Optional filtering options
   * @returns Array of matching logged messages
   */
  findLoggedMessages(
    level: 'log' | 'error' | 'warn' | 'debug' | 'verbose' | 'fatal', 
    messageSubstring: string, 
    options?: { context?: string; journeyId?: string; requestId?: string; userId?: string }
  ): LoggedMessage[] {
    return this.logs[level].filter(log => 
      log.message.includes(messageSubstring) && 
      (!options?.context || log.context === options.context) &&
      (!options?.journeyId || log.journeyId === options.journeyId) &&
      (!options?.requestId || log.requestId === options.requestId) &&
      (!options?.userId || log.userId === options.userId)
    );
  }

  /**
   * Counts how many times a specific message was logged at a given level
   * @param level The log level to check
   * @param messageSubstring Substring to search for in logged messages
   * @param options Optional filtering options
   * @returns Number of matching log entries
   */
  countLoggedMessages(
    level: 'log' | 'error' | 'warn' | 'debug' | 'verbose' | 'fatal', 
    messageSubstring: string, 
    options?: { context?: string; journeyId?: string; requestId?: string; userId?: string }
  ): number {
    return this.findLoggedMessages(level, messageSubstring, options).length;
  }

  /**
   * Clears all logged messages
   * Useful for resetting the mock between tests
   */
  reset(): void {
    this.logs.log = [];
    this.logs.error = [];
    this.logs.warn = [];
    this.logs.debug = [];
    this.logs.verbose = [];
    this.logs.fatal = [];
  }
  
  /**
   * Gets logs in a standardized JSON format
   * @returns Array of logs in JSON format
   */
  getLogsAsJson(): string {
    const allLogs = Object.values(this.logs).flat();
    return JSON.stringify(allLogs, null, 2);
  }
}

/**
 * Factory function to create a new MockLogger instance
 * @param context Optional context name for the logger
 * @param options Optional configuration options
 * @returns A new MockLogger instance
 */
export function createMockLogger(
  context?: string, 
  options?: { journeyId?: string; requestId?: string; userId?: string }
): MockLogger {
  return new MockLogger(context, options);
}

/**
 * Type definition for log levels supported by the mock logger
 */
export type MockLogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose' | 'fatal';
import { LoggerService as NestLoggerService, LogLevel } from '@nestjs/common';

/**
 * Interface representing a logged message for testing purposes
 */
export interface LoggedMessage {
  level: LogLevel;
  message: string;
  optionalParams: any[];
  timestamp: Date;
}

/**
 * Mock implementation of NestJS Logger for testing
 * Tracks all logged messages and provides methods to inspect them
 */
export class MockLogger implements NestLoggerService {
  private logs: LoggedMessage[] = [];
  private contextName?: string;

  /**
   * Creates a new MockLogger instance
   * @param context Optional context name for the logger
   */
  constructor(context?: string) {
    this.contextName = context;
  }

  /**
   * Logs a message with INFO level
   * @param message The message to log
   * @param optionalParams Optional parameters (context, etc.)
   */
  log(message: any, ...optionalParams: any[]): void {
    this.addLog('log', message, optionalParams);
  }

  /**
   * Logs a message with ERROR level
   * @param message The message to log
   * @param optionalParams Optional parameters (trace, context, etc.)
   */
  error(message: any, ...optionalParams: any[]): void {
    this.addLog('error', message, optionalParams);
  }

  /**
   * Logs a message with WARN level
   * @param message The message to log
   * @param optionalParams Optional parameters (context, etc.)
   */
  warn(message: any, ...optionalParams: any[]): void {
    this.addLog('warn', message, optionalParams);
  }

  /**
   * Logs a message with DEBUG level
   * @param message The message to log
   * @param optionalParams Optional parameters (context, etc.)
   */
  debug(message: any, ...optionalParams: any[]): void {
    this.addLog('debug', message, optionalParams);
  }

  /**
   * Logs a message with VERBOSE level
   * @param message The message to log
   * @param optionalParams Optional parameters (context, etc.)
   */
  verbose(message: any, ...optionalParams: any[]): void {
    this.addLog('verbose', message, optionalParams);
  }

  /**
   * Adds a log entry to the internal logs array
   * @param level The log level
   * @param message The message to log
   * @param optionalParams Optional parameters
   */
  private addLog(level: LogLevel, message: any, optionalParams: any[]): void {
    this.logs.push({
      level,
      message,
      optionalParams,
      timestamp: new Date(),
    });
  }

  /**
   * Resets the logged messages
   * Used to clear logs between tests
   */
  reset(): void {
    this.logs = [];
  }

  /**
   * Gets all logged messages
   * @returns Array of all logged messages
   */
  getLoggedMessages(): LoggedMessage[] {
    return [...this.logs];
  }

  /**
   * Gets logged messages of a specific level
   * @param level The log level to filter by
   * @returns Array of logged messages with the specified level
   */
  getLogsByLevel(level: LogLevel): LoggedMessage[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Checks if a specific message was logged
   * @param level The log level to check
   * @param messageSubstring Substring to search for in messages
   * @returns True if a matching message was found
   */
  hasLoggedMessage(level: LogLevel, messageSubstring: string): boolean {
    return this.logs.some(
      log => log.level === level && log.message.includes(messageSubstring)
    );
  }

  /**
   * Gets the context name for this logger
   * @returns The context name or undefined if none was set
   */
  getContextName(): string | undefined {
    return this.contextName;
  }

  /**
   * Sets the context name for this logger
   * @param context The new context name
   */
  setContextName(context: string): void {
    this.contextName = context;
  }
}
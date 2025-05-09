import { LoggerService as NestLoggerService } from '@nestjs/common';

/**
 * Log entry structure for capturing logs in tests
 */
export interface LogEntry {
  level: 'log' | 'error' | 'warn' | 'debug' | 'verbose';
  message: string;
  context?: any;
  trace?: any;
  timestamp: Date;
  journeyContext?: {
    journeyType?: 'health' | 'care' | 'plan';
    userId?: string;
    correlationId?: string;
  };
}

/**
 * Mock implementation of LoggerService for testing purposes.
 * Captures log entries in memory rather than writing to console or external services.
 * Provides methods to retrieve and clear log history for test assertions.
 */
export class MockLoggerService implements NestLoggerService {
  private static logEntries: LogEntry[] = [];
  private journeyContext?: {
    journeyType?: 'health' | 'care' | 'plan';
    userId?: string;
    correlationId?: string;
  };

  /**
   * Creates a new instance of MockLoggerService
   * @param context Optional journey context to include with all log entries
   */
  constructor(context?: {
    journeyType?: 'health' | 'care' | 'plan';
    userId?: string;
    correlationId?: string;
  }) {
    this.journeyContext = context;
  }

  /**
   * Logs a message with the INFO level and stores it in memory
   * @param message The message to log
   * @param context Optional context for the log
   */
  log(message: string, context?: any): void {
    MockLoggerService.logEntries.push({
      level: 'log',
      message,
      context,
      timestamp: new Date(),
      journeyContext: this.journeyContext,
    });
  }

  /**
   * Logs a message with the ERROR level and stores it in memory
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param context Optional context for the log
   */
  error(message: string, trace?: any, context?: any): void {
    MockLoggerService.logEntries.push({
      level: 'error',
      message,
      trace,
      context,
      timestamp: new Date(),
      journeyContext: this.journeyContext,
    });
  }

  /**
   * Logs a message with the WARN level and stores it in memory
   * @param message The message to log
   * @param context Optional context for the log
   */
  warn(message: string, context?: any): void {
    MockLoggerService.logEntries.push({
      level: 'warn',
      message,
      context,
      timestamp: new Date(),
      journeyContext: this.journeyContext,
    });
  }

  /**
   * Logs a message with the DEBUG level and stores it in memory
   * @param message The message to log
   * @param context Optional context for the log
   */
  debug(message: string, context?: any): void {
    MockLoggerService.logEntries.push({
      level: 'debug',
      message,
      context,
      timestamp: new Date(),
      journeyContext: this.journeyContext,
    });
  }

  /**
   * Logs a message with the VERBOSE level and stores it in memory
   * @param message The message to log
   * @param context Optional context for the log
   */
  verbose(message: string, context?: any): void {
    MockLoggerService.logEntries.push({
      level: 'verbose',
      message,
      context,
      timestamp: new Date(),
      journeyContext: this.journeyContext,
    });
  }

  /**
   * Retrieves all captured log entries
   * @returns Array of log entries
   */
  static getLogEntries(): LogEntry[] {
    return [...MockLoggerService.logEntries];
  }

  /**
   * Retrieves log entries filtered by level
   * @param level The log level to filter by
   * @returns Array of filtered log entries
   */
  static getLogEntriesByLevel(level: LogEntry['level']): LogEntry[] {
    return MockLoggerService.logEntries.filter(entry => entry.level === level);
  }

  /**
   * Retrieves log entries filtered by journey type
   * @param journeyType The journey type to filter by
   * @returns Array of filtered log entries
   */
  static getLogEntriesByJourney(journeyType: 'health' | 'care' | 'plan'): LogEntry[] {
    return MockLoggerService.logEntries.filter(
      entry => entry.journeyContext?.journeyType === journeyType
    );
  }

  /**
   * Checks if a specific message was logged
   * @param message The message to search for
   * @param level Optional log level to filter by
   * @returns True if the message was found, false otherwise
   */
  static hasLoggedMessage(message: string, level?: LogEntry['level']): boolean {
    return MockLoggerService.logEntries.some(
      entry => entry.message.includes(message) && (!level || entry.level === level)
    );
  }

  /**
   * Clears all captured log entries
   */
  static clearLogs(): void {
    MockLoggerService.logEntries = [];
  }

  /**
   * Sets the journey context for this logger instance
   * @param context The journey context to set
   */
  setJourneyContext(context: {
    journeyType?: 'health' | 'care' | 'plan';
    userId?: string;
    correlationId?: string;
  }): void {
    this.journeyContext = context;
  }
}
import { LoggerService as NestLoggerService } from '@nestjs/common';

/**
 * Interface representing a log entry for testing purposes
 */
export interface LogEntry {
  level: 'log' | 'error' | 'warn' | 'debug' | 'verbose';
  message: string;
  context?: any;
  trace?: any;
  timestamp: Date;
  journeyContext?: 'health' | 'care' | 'plan';
  metadata?: Record<string, any>;
}

/**
 * Mock implementation of the LoggerService for testing purposes.
 * Captures log entries in memory rather than writing to console or external services.
 * Provides methods to retrieve and clear logs for test assertions.
 *
 * This mock is designed for unit and integration testing of the error handling framework,
 * allowing tests to verify that appropriate log messages are generated without side effects.
 */
export class MockLoggerService implements NestLoggerService {
  private logs: LogEntry[] = [];
  
  /**
   * Creates a new instance of MockLoggerService.
   * @param options Optional configuration options
   */
  constructor(private options: { captureStackTraces?: boolean } = {}) {}

  /**
   * Logs a message with the INFO level.
   * @param message The message to log
   * @param context Optional context for the log
   */
  log(message: string, context?: any): void {
    this.addLogEntry('log', message, context);
  }

  /**
   * Logs a message with the ERROR level.
   * @param message The message to log
   * @param trace Optional stack trace or error object
   * @param context Optional context for the log
   */
  error(message: string, trace?: any, context?: any): void {
    this.addLogEntry('error', message, context, trace);
  }

  /**
   * Logs a message with the WARN level.
   * @param message The message to log
   * @param context Optional context for the log
   */
  warn(message: string, context?: any): void {
    this.addLogEntry('warn', message, context);
  }

  /**
   * Logs a message with the DEBUG level.
   * @param message The message to log
   * @param context Optional context for the log
   */
  debug(message: string, context?: any): void {
    this.addLogEntry('debug', message, context);
  }

  /**
   * Logs a message with the VERBOSE level.
   * @param message The message to log
   * @param context Optional context for the log
   */
  verbose(message: string, context?: any): void {
    this.addLogEntry('verbose', message, context);
  }

  /**
   * Adds a log entry to the internal logs array.
   * @param level The log level
   * @param message The message to log
   * @param context Optional context for the log
   * @param trace Optional stack trace or error object
   */
  private addLogEntry(level: LogEntry['level'], message: string, context?: any, trace?: any): void {
    // Extract journey context from the context object if available
    let journeyContext: 'health' | 'care' | 'plan' | undefined;
    let metadata: Record<string, any> | undefined;
    
    if (context && typeof context === 'object') {
      if (context.journey && ['health', 'care', 'plan'].includes(context.journey)) {
        journeyContext = context.journey as 'health' | 'care' | 'plan';
      }
      
      // Extract additional metadata if available
      if (context.metadata && typeof context.metadata === 'object') {
        metadata = { ...context.metadata };
      }
    }
    
    // Process trace if it's an Error object
    let processedTrace = trace;
    if (trace instanceof Error && !this.options.captureStackTraces) {
      // Only capture error message and name by default to avoid large objects in test output
      processedTrace = {
        name: trace.name,
        message: trace.message
      };
    }
    
    this.logs.push({
      level,
      message,
      context,
      trace: processedTrace,
      timestamp: new Date(),
      journeyContext,
      metadata,
    });
  }

  /**
   * Returns all captured log entries.
   * @returns Array of log entries
   */
  getLogEntries(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Returns log entries filtered by level.
   * @param level The log level to filter by
   * @returns Array of filtered log entries
   */
  getLogEntriesByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Returns log entries that contain the specified text in their message.
   * @param text The text to search for in log messages
   * @returns Array of filtered log entries
   */
  getLogEntriesByText(text: string): LogEntry[] {
    return this.logs.filter(log => log.message.includes(text));
  }

  /**
   * Returns log entries that match the specified journey context.
   * @param journeyContext The journey context to filter by
   * @returns Array of filtered log entries
   */
  getLogEntriesByJourneyContext(journeyContext: 'health' | 'care' | 'plan'): LogEntry[] {
    return this.logs.filter(log => log.journeyContext === journeyContext);
  }

  /**
   * Clears all captured log entries.
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Returns the count of log entries by level.
   * @returns Object with counts for each log level
   */
  getLogCounts(): Record<LogEntry['level'], number> {
    const counts = {
      log: 0,
      error: 0,
      warn: 0,
      debug: 0,
      verbose: 0,
    };

    this.logs.forEach(log => {
      counts[log.level]++;
    });

    return counts;
  }
  
  /**
   * Returns log entries that contain the specified metadata key-value pair.
   * @param key The metadata key to search for
   * @param value The metadata value to match (optional)
   * @returns Array of filtered log entries
   */
  getLogEntriesByMetadata(key: string, value?: any): LogEntry[] {
    return this.logs.filter(log => {
      if (!log.metadata) return false;
      if (value === undefined) return key in log.metadata;
      return log.metadata[key] === value;
    });
  }
  
  /**
   * Returns the most recent log entry.
   * @returns The most recent log entry or undefined if no logs exist
   */
  getLastLogEntry(): LogEntry | undefined {
    if (this.logs.length === 0) return undefined;
    return this.logs[this.logs.length - 1];
  }
  
  /**
   * Returns the most recent log entry of the specified level.
   * @param level The log level to filter by
   * @returns The most recent log entry of the specified level or undefined if none exists
   */
  getLastLogEntryByLevel(level: LogEntry['level']): LogEntry | undefined {
    const filtered = this.getLogEntriesByLevel(level);
    if (filtered.length === 0) return undefined;
    return filtered[filtered.length - 1];
  }
}
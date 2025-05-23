import { LoggerService } from '@nestjs/common';

/**
 * Interface for a log entry that captures all information passed to the logger
 */
export interface LogEntry {
  level: 'log' | 'error' | 'warn' | 'debug';
  message: any;
  trace?: string;
  context?: string;
  timestamp: Date;
}

/**
 * Mock implementation of NestJS LoggerService for testing the tracing module.
 * This mock simulates logging operations without requiring actual logging infrastructure.
 * It tracks all log messages for verification in tests.
 */
export class MockLoggerService implements LoggerService {
  /**
   * Array of all log entries captured by this mock logger
   */
  public readonly logs: LogEntry[] = [];

  /**
   * Logs a message at the 'log' level
   * @param message The message to log
   * @param context Optional context for the log message
   */
  log(message: any, context?: string): void {
    this.logs.push({
      level: 'log',
      message,
      context,
      timestamp: new Date(),
    });
  }

  /**
   * Logs a message at the 'error' level
   * @param message The error message to log
   * @param trace Optional stack trace for the error
   * @param context Optional context for the log message
   */
  error(message: any, trace?: string, context?: string): void {
    this.logs.push({
      level: 'error',
      message,
      trace,
      context,
      timestamp: new Date(),
    });
  }

  /**
   * Logs a message at the 'warn' level
   * @param message The warning message to log
   * @param context Optional context for the log message
   */
  warn(message: any, context?: string): void {
    this.logs.push({
      level: 'warn',
      message,
      context,
      timestamp: new Date(),
    });
  }

  /**
   * Logs a message at the 'debug' level
   * @param message The debug message to log
   * @param context Optional context for the log message
   */
  debug(message: any, context?: string): void {
    this.logs.push({
      level: 'debug',
      message,
      context,
      timestamp: new Date(),
    });
  }

  /**
   * Clears all captured logs
   */
  clear(): void {
    this.logs.length = 0;
  }

  /**
   * Finds logs that match the given criteria
   * @param criteria Partial log entry to match against
   * @returns Array of matching log entries
   */
  findLogs(criteria: Partial<LogEntry>): LogEntry[] {
    return this.logs.filter(log => {
      for (const [key, value] of Object.entries(criteria)) {
        if (log[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Checks if a log matching the given criteria exists
   * @param criteria Partial log entry to match against
   * @returns True if a matching log exists, false otherwise
   */
  hasLog(criteria: Partial<LogEntry>): boolean {
    return this.findLogs(criteria).length > 0;
  }

  /**
   * Gets the most recent log entry
   * @returns The most recent log entry or undefined if no logs exist
   */
  getLastLog(): LogEntry | undefined {
    return this.logs.length > 0 ? this.logs[this.logs.length - 1] : undefined;
  }
}
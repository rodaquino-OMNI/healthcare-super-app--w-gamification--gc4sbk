import { LoggerService as NestLoggerService } from '@nestjs/common';
import { LoggerService } from '@austa/logging';

/**
 * Mock implementation of LoggerService for testing purposes.
 * Captures logs in memory for later inspection in tests.
 */
export class MockLoggerService implements LoggerService {
  private logs: any[] = [];

  constructor() {
    this.reset();
  }

  /**
   * Reset all captured logs
   */
  reset(): void {
    this.logs = [];
  }

  /**
   * Get all captured logs
   */
  getLogs(): any[] {
    return this.logs;
  }

  /**
   * Log a message at the 'log' level
   */
  log(message: any, context?: string): void {
    this.addLog('info', message, context);
  }

  /**
   * Log a message at the 'error' level
   */
  error(message: any, trace?: string, context?: string): void {
    this.addLog('error', message, context, trace);
  }

  /**
   * Log a message at the 'warn' level
   */
  warn(message: any, context?: string): void {
    this.addLog('warn', message, context);
  }

  /**
   * Log a message at the 'debug' level
   */
  debug(message: any, context?: string): void {
    this.addLog('debug', message, context);
  }

  /**
   * Log a message at the 'verbose' level
   */
  verbose(message: any, context?: string): void {
    this.addLog('verbose', message, context);
  }

  /**
   * Log an error with journey context
   */
  logError(error: Error, context: any = {}): void {
    this.logs.push({
      timestamp: new Date(),
      level: 'error',
      message: error.message,
      context,
      error
    });
  }

  /**
   * Add a log entry with the specified level
   */
  private addLog(level: string, message: any, context?: string, trace?: string): void {
    const logEntry = {
      timestamp: new Date(),
      level,
      message,
      context: context ? { service: context } : {},
    };

    if (trace) {
      logEntry['stack'] = trace;
    }

    this.logs.push(logEntry);
  }

  /**
   * Set the context for subsequent log entries
   */
  setContext(context: Record<string, any>): void {
    // This method is intentionally left empty in the mock
  }

  /**
   * Create a child logger with additional context
   */
  createChildLogger(childContext: Record<string, any>): LoggerService {
    return this;
  }
}
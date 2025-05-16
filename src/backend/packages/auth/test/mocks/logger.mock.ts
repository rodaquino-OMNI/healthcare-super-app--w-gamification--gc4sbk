import { LoggerService } from '@nestjs/common';

/**
 * Interface representing a captured log entry
 */
export interface LogEntry {
  level: string;
  message: any;
  context?: string;
  params: any[];
  timestamp: Date;
  formattedMessage?: string;
}

/**
 * Mock implementation of the LoggerService for testing purposes.
 * Captures log output without producing actual logs and provides methods
 * to inspect logged messages for assertions and verification.
 */
export class LoggerMock implements LoggerService {
  private readonly context?: string;
  private logs: LogEntry[] = [];

  /**
   * Creates a new LoggerMock instance.
   * @param context Optional context name for the logger
   */
  constructor(context?: string) {
    this.context = context;
  }

  /**
   * Logs a message at the 'log' level.
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  log(message: any, ...optionalParams: any[]): void {
    this.addLog('log', message, optionalParams);
  }

  /**
   * Logs a message at the 'error' level.
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  error(message: any, ...optionalParams: any[]): void {
    this.addLog('error', message, optionalParams);
  }

  /**
   * Logs a message at the 'warn' level.
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  warn(message: any, ...optionalParams: any[]): void {
    this.addLog('warn', message, optionalParams);
  }

  /**
   * Logs a message at the 'debug' level.
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  debug(message: any, ...optionalParams: any[]): void {
    this.addLog('debug', message, optionalParams);
  }

  /**
   * Logs a message at the 'verbose' level.
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  verbose(message: any, ...optionalParams: any[]): void {
    this.addLog('verbose', message, optionalParams);
  }

  /**
   * Adds a log entry to the internal logs array.
   * @param level The log level
   * @param message The message to log
   * @param params Additional parameters
   */
  private addLog(level: string, message: any, params: any[]): void {
    // Extract context if it's provided as the last parameter in a specific format
    let context = this.context;
    let actualParams = [...params];

    // Check if the last parameter is an object with a context property
    if (params.length > 0 && typeof params[params.length - 1] === 'object' && params[params.length - 1]?.context) {
      context = params[params.length - 1].context;
      actualParams = params.slice(0, -1);
    }

    // Format the message with parameters if it's a string with format specifiers
    let formattedMessage: string | undefined;
    if (typeof message === 'string' && actualParams.length > 0) {
      formattedMessage = this.formatMessage(message, actualParams);
    }

    this.logs.push({
      level,
      message,
      context,
      params: actualParams,
      timestamp: new Date(),
      formattedMessage,
    });
  }

  /**
   * Formats a message with parameters, similar to how the real logger would.
   * Supports %s, %d, %i, %f, %j, %o, %O format specifiers.
   * @param message The message template with format specifiers
   * @param params The parameters to insert into the template
   * @returns The formatted message
   */
  private formatMessage(message: string, params: any[]): string {
    if (params.length === 0) return message;

    // Simple implementation of format specifiers
    let formattedMessage = message;
    let paramIndex = 0;

    // Replace format specifiers with their corresponding values
    formattedMessage = formattedMessage.replace(/%[sdifjoO]/g, (match) => {
      if (paramIndex >= params.length) return match;
      const param = params[paramIndex++];

      switch (match) {
        case '%s': // String
          return String(param);
        case '%d': // Number (integer)
        case '%i': // Number (integer)
          return parseInt(param, 10).toString();
        case '%f': // Number (float)
          return parseFloat(param).toString();
        case '%j': // JSON
          return JSON.stringify(param);
        case '%o': // Object
        case '%O': // Object (expanded)
          return typeof param === 'object' ? JSON.stringify(param) : String(param);
        default:
          return match;
      }
    });

    return formattedMessage;
  }

  /**
   * Gets all logs captured by this mock.
   * @returns Array of all captured logs
   */
  getLogs(): LogEntry[] {
    return this.logs;
  }

  /**
   * Gets logs of a specific level captured by this mock.
   * @param level The log level to filter by
   * @returns Array of logs with the specified level
   */
  getLogsByLevel(level: string): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Gets the most recent log entry.
   * @returns The most recent log entry or undefined if no logs exist
   */
  getLastLog(): LogEntry | undefined {
    return this.logs.length > 0 ? this.logs[this.logs.length - 1] : undefined;
  }

  /**
   * Gets the most recent log entry at a specific level.
   * @param level The log level to filter by
   * @returns The most recent log entry at the specified level or undefined if no matching logs exist
   */
  getLastLogAtLevel(level: string): LogEntry | undefined {
    const logsAtLevel = this.getLogsByLevel(level);
    return logsAtLevel.length > 0 ? logsAtLevel[logsAtLevel.length - 1] : undefined;
  }

  /**
   * Counts the total number of logs captured.
   * @returns The total number of logs
   */
  countLogs(): number {
    return this.logs.length;
  }

  /**
   * Counts the number of logs at a specific level.
   * @param level The log level to count
   * @returns The number of logs at the specified level
   */
  countLogsByLevel(level: string): number {
    return this.getLogsByLevel(level).length;
  }

  /**
   * Checks if a specific message was logged at any level.
   * @param message The message to check for
   * @returns True if the message was logged, false otherwise
   */
  hasMessage(message: any): boolean {
    return this.logs.some((log) => {
      if (typeof message === 'string' && typeof log.message === 'string') {
        return log.message.includes(message);
      }
      return log.message === message;
    });
  }

  /**
   * Checks if a specific message was logged at a specific level.
   * @param level The log level to check
   * @param message The message to check for
   * @returns True if the message was logged at the specified level, false otherwise
   */
  hasMessageAtLevel(level: string, message: any): boolean {
    return this.logs.some((log) => {
      if (log.level !== level) return false;
      
      if (typeof message === 'string' && typeof log.message === 'string') {
        return log.message.includes(message);
      }
      return log.message === message;
    });
  }

  /**
   * Checks if any log message matches a regular expression pattern.
   * @param pattern The regular expression pattern to match against
   * @returns True if any log message matches the pattern, false otherwise
   */
  hasMessageMatching(pattern: RegExp): boolean {
    return this.logs.some((log) => {
      if (typeof log.message === 'string') {
        return pattern.test(log.message);
      }
      if (log.formattedMessage) {
        return pattern.test(log.formattedMessage);
      }
      return false;
    });
  }

  /**
   * Checks if any log message at a specific level matches a regular expression pattern.
   * @param level The log level to check
   * @param pattern The regular expression pattern to match against
   * @returns True if any log message at the specified level matches the pattern, false otherwise
   */
  hasMessageMatchingAtLevel(level: string, pattern: RegExp): boolean {
    return this.logs.some((log) => {
      if (log.level !== level) return false;

      if (typeof log.message === 'string') {
        return pattern.test(log.message);
      }
      if (log.formattedMessage) {
        return pattern.test(log.formattedMessage);
      }
      return false;
    });
  }

  /**
   * Finds all logs that match a specific condition.
   * @param predicate A function that tests each log entry
   * @returns Array of log entries that satisfy the condition
   */
  findLogs(predicate: (log: LogEntry) => boolean): LogEntry[] {
    return this.logs.filter(predicate);
  }

  /**
   * Clears all captured logs.
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Creates a new LoggerMock instance with the specified context.
   * @param context The context for the new logger
   * @returns A new LoggerMock instance with the specified context
   */
  static forContext(context: string): LoggerMock {
    return new LoggerMock(context);
  }

  /**
   * Asserts that a specific message was logged at a specific level.
   * Throws an error if the assertion fails.
   * @param level The expected log level
   * @param message The expected message content
   * @throws Error if the assertion fails
   */
  assertLogged(level: string, message: string): void {
    if (!this.hasMessageAtLevel(level, message)) {
      const logs = this.getLogsByLevel(level).map(log => 
        log.formattedMessage || log.message
      ).join('\n  ');
      throw new Error(
        `Expected message "${message}" to be logged at level "${level}", but it wasn't.\n` +
        `Actual logs at level "${level}":\n  ${logs || 'No logs at this level'}`
      );
    }
  }

  /**
   * Asserts that a specific message was not logged at a specific level.
   * Throws an error if the assertion fails.
   * @param level The log level to check
   * @param message The message that should not be logged
   * @throws Error if the assertion fails
   */
  assertNotLogged(level: string, message: string): void {
    if (this.hasMessageAtLevel(level, message)) {
      throw new Error(`Expected message "${message}" NOT to be logged at level "${level}", but it was.`);
    }
  }

  /**
   * Asserts that a specific number of logs were recorded at a specific level.
   * Throws an error if the assertion fails.
   * @param level The log level to check
   * @param count The expected number of logs
   * @throws Error if the assertion fails
   */
  assertLogCount(level: string, count: number): void {
    const actualCount = this.countLogsByLevel(level);
    if (actualCount !== count) {
      throw new Error(
        `Expected ${count} logs at level "${level}", but found ${actualCount}.`
      );
    }
  }

  /**
   * Returns a string representation of all logs for debugging purposes.
   * @returns A formatted string containing all logs
   */
  toString(): string {
    if (this.logs.length === 0) {
      return 'No logs recorded';
    }

    return this.logs.map(log => {
      const timestamp = log.timestamp.toISOString();
      const context = log.context ? `[${log.context}] ` : '';
      const message = log.formattedMessage || log.message;
      return `${timestamp} ${log.level.toUpperCase()} ${context}${message}`;
    }).join('\n');
  }
}
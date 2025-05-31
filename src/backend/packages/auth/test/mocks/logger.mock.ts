import { LoggerService } from '@nestjs/common';

/**
 * Mock implementation of the LoggerService for testing purposes.
 * This mock captures log messages instead of producing actual logs,
 * allowing for assertions on logged content during tests.
 */
export class MockLoggerService implements LoggerService {
  // Store logs by level for inspection during tests
  private logs: Record<string, any[]> = {
    log: [],
    error: [],
    warn: [],
    debug: [],
    fatal: [],
  };

  /**
   * Clears all captured logs
   */
  clear(): void {
    Object.keys(this.logs).forEach((key) => {
      this.logs[key] = [];
    });
  }

  /**
   * Get all logs of a specific level
   * @param level The log level to retrieve
   * @returns Array of log entries for the specified level
   */
  getLogsByLevel(level: string): any[] {
    return this.logs[level] || [];
  }

  /**
   * Get all captured logs across all levels
   * @returns Record of all logs by level
   */
  getAllLogs(): Record<string, any[]> {
    return this.logs;
  }

  /**
   * Check if a specific message was logged at any level
   * @param message The message to search for
   * @returns boolean indicating if the message was found
   */
  hasMessage(message: string): boolean {
    return Object.values(this.logs).some((logs) =>
      logs.some((log) => {
        if (typeof log === 'string') {
          return log.includes(message);
        } else if (log && typeof log === 'object' && 'message' in log) {
          return log.message.includes(message);
        }
        return false;
      }),
    );
  }

  /**
   * Check if a specific message was logged at a specific level
   * @param level The log level to check
   * @param message The message to search for
   * @returns boolean indicating if the message was found at the specified level
   */
  hasMessageAtLevel(level: string, message: string): boolean {
    const logs = this.getLogsByLevel(level);
    return logs.some((log) => {
      if (typeof log === 'string') {
        return log.includes(message);
      } else if (log && typeof log === 'object' && 'message' in log) {
        return log.message.includes(message);
      }
      return false;
    });
  }

  /**
   * Implementation of log method from LoggerService
   * @param message The message to log
   * @param optionalParams Additional parameters
   */
  log(message: any, ...optionalParams: any[]): any {
    this.logs.log.push({ message, params: optionalParams });
  }

  /**
   * Implementation of error method from LoggerService
   * @param message The error message to log
   * @param optionalParams Additional parameters (trace, context, etc.)
   */
  error(message: any, ...optionalParams: any[]): any {
    this.logs.error.push({ message, params: optionalParams });
  }

  /**
   * Implementation of warn method from LoggerService
   * @param message The warning message to log
   * @param optionalParams Additional parameters
   */
  warn(message: any, ...optionalParams: any[]): any {
    this.logs.warn.push({ message, params: optionalParams });
  }

  /**
   * Implementation of debug method from LoggerService (optional in interface)
   * @param message The debug message to log
   * @param optionalParams Additional parameters
   */
  debug(message: any, ...optionalParams: any[]): any {
    this.logs.debug.push({ message, params: optionalParams });
  }

  /**
   * Implementation of fatal method from LoggerService (optional in interface)
   * @param message The fatal message to log
   * @param optionalParams Additional parameters
   */
  fatal(message: any, ...optionalParams: any[]): any {
    this.logs.fatal.push({ message, params: optionalParams });
  }

  /**
   * Implementation of setLogLevels method from LoggerService (optional in interface)
   * @param levels Array of log levels to enable
   */
  setLogLevels(levels: string[]): any {
    // In the mock implementation, we don't actually filter logs
    // but we could implement this if needed for specific tests
  }
}
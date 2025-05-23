/**
 * Enum representing standardized log levels across the AUSTA SuperApp backend services.
 * Includes numeric values for ordering and utility methods for level comparison and conversion.
 */
export enum LogLevel {
  /**
   * Debug level for detailed troubleshooting information.
   * Lowest priority, most verbose level.
   */
  DEBUG = 0,

  /**
   * Info level for general operational information.
   */
  INFO = 1,

  /**
   * Warning level for potentially harmful situations that don't prevent normal operation.
   */
  WARN = 2,

  /**
   * Error level for runtime errors that don't prevent the application from running.
   */
  ERROR = 3,

  /**
   * Fatal level for severe errors that prevent the application from continuing.
   * Highest priority, least verbose level.
   */
  FATAL = 4
}

/**
 * Type representing valid log level string names.
 */
export type LogLevelString = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Utility functions for working with LogLevel enum.
 */
export const LogLevelUtils = {
  /**
   * Converts a LogLevel enum value to its string representation.
   * @param level The LogLevel enum value
   * @returns The string representation of the log level
   */
  toString(level: LogLevel): LogLevelString {
    switch (level) {
      case LogLevel.DEBUG: return 'debug';
      case LogLevel.INFO: return 'info';
      case LogLevel.WARN: return 'warn';
      case LogLevel.ERROR: return 'error';
      case LogLevel.FATAL: return 'fatal';
      default: throw new Error(`Invalid log level: ${level}`);
    }
  },

  /**
   * Converts a string representation to its corresponding LogLevel enum value.
   * @param levelString The string representation of the log level
   * @returns The corresponding LogLevel enum value
   * @throws Error if the string is not a valid log level
   */
  fromString(levelString: string): LogLevel {
    switch (levelString.toLowerCase()) {
      case 'debug': return LogLevel.DEBUG;
      case 'info': return LogLevel.INFO;
      case 'warn': case 'warning': return LogLevel.WARN;
      case 'error': return LogLevel.ERROR;
      case 'fatal': case 'critical': return LogLevel.FATAL;
      default: throw new Error(`Invalid log level string: ${levelString}`);
    }
  },

  /**
   * Checks if a given log level is enabled based on the minimum level.
   * @param level The log level to check
   * @param minimumLevel The minimum log level that is enabled
   * @returns True if the log level is enabled, false otherwise
   */
  isEnabled(level: LogLevel, minimumLevel: LogLevel): boolean {
    return level >= minimumLevel;
  },

  /**
   * Compares two log levels and returns a number indicating their relative order.
   * @param levelA The first log level
   * @param levelB The second log level
   * @returns A negative number if levelA is less than levelB, zero if they are equal,
   *          or a positive number if levelA is greater than levelB
   */
  compare(levelA: LogLevel, levelB: LogLevel): number {
    return levelA - levelB;
  },

  /**
   * Gets all available log levels.
   * @returns An array of all log levels
   */
  getAllLevels(): LogLevel[] {
    return [
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
      LogLevel.FATAL
    ];
  },

  /**
   * Gets all available log level strings.
   * @returns An array of all log level strings
   */
  getAllLevelStrings(): LogLevelString[] {
    return [
      'debug',
      'info',
      'warn',
      'error',
      'fatal'
    ];
  }
};
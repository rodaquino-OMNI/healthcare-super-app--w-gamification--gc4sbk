/**
 * Standardized log levels for the AUSTA SuperApp backend services.
 * Provides consistent log level definitions across all services to ensure
 * proper log filtering and prioritization.
 */
export enum LogLevel {
  /**
   * Debug level for detailed troubleshooting information.
   * Only used during development or when investigating specific issues.
   */
  DEBUG = 0,

  /**
   * Info level for general operational information.
   * Used for normal application flow and successful operations.
   */
  INFO = 1,

  /**
   * Warning level for potential issues that don't affect normal operation.
   * Used for deprecated features, suboptimal usage, or potential future problems.
   */
  WARN = 2,

  /**
   * Error level for runtime errors that don't require immediate action.
   * Used for handled exceptions, failed operations, or unexpected conditions.
   */
  ERROR = 3,

  /**
   * Fatal level for critical errors that require immediate attention.
   * Used for unrecoverable situations that may cause system failure.
   */
  FATAL = 4,
}

/**
 * Type representing valid log level string names.
 * Used for configuration and API consistency.
 */
export type LogLevelString = keyof typeof LogLevel;

/**
 * Utility functions for working with LogLevel enum.
 */
export const LogLevelUtils = {
  /**
   * Converts a LogLevel enum value to its string representation.
   * @param level The LogLevel enum value to convert
   * @returns The string representation of the log level
   */
  toString(level: LogLevel): LogLevelString {
    return LogLevel[level] as LogLevelString;
  },

  /**
   * Converts a string representation to its corresponding LogLevel enum value.
   * @param levelString The string representation of the log level
   * @returns The corresponding LogLevel enum value, or undefined if invalid
   */
  fromString(levelString: string): LogLevel | undefined {
    const normalizedString = levelString.toUpperCase();
    return LogLevel[normalizedString as keyof typeof LogLevel];
  },

  /**
   * Checks if a given log level is enabled based on the minimum log level.
   * @param level The log level to check
   * @param minLevel The minimum log level that is enabled
   * @returns True if the log level is enabled, false otherwise
   */
  isLevelEnabled(level: LogLevel, minLevel: LogLevel): boolean {
    return level >= minLevel;
  },

  /**
   * Returns all available log levels as an array of strings.
   * @returns Array of log level strings
   */
  getAllLevels(): LogLevelString[] {
    return Object.keys(LogLevel).filter(
      (key) => isNaN(Number(key))
    ) as LogLevelString[];
  },

  /**
   * Returns all available log levels as an array of enum values.
   * @returns Array of LogLevel enum values
   */
  getAllLevelValues(): LogLevel[] {
    return this.getAllLevels().map(
      (levelString) => LogLevel[levelString as keyof typeof LogLevel]
    );
  },
};
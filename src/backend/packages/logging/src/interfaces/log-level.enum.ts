/**
 * Standardized log levels for the AUSTA SuperApp backend services.
 * Provides consistent logging levels across all services to ensure
 * proper log filtering and aggregation in centralized logging systems.
 */
export enum LogLevel {
  /**
   * Debug information, useful for development and troubleshooting.
   * Most verbose level, contains detailed information about application flow.
   */
  DEBUG = 0,

  /**
   * Informational messages that highlight the progress of the application.
   * Normal operational messages that require no action.
   */
  INFO = 1,

  /**
   * Warning messages that indicate potential issues or unexpected behavior.
   * The application can continue to function but requires attention.
   */
  WARN = 2,

  /**
   * Error messages that indicate failures that should be investigated.
   * The application can continue to function but with degraded capabilities.
   */
  ERROR = 3,

  /**
   * Critical failures that prevent the application from functioning properly.
   * Requires immediate attention and intervention.
   */
  FATAL = 4,
}

/**
 * Type definition for log level string representation.
 * Used for type safety when converting between string and enum values.
 */
export type LogLevelString = keyof typeof LogLevel;

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
    return LogLevel[level] as LogLevelString;
  },

  /**
   * Converts a string to its corresponding LogLevel enum value.
   * @param levelString The string representation of the log level
   * @returns The LogLevel enum value or undefined if the string is not a valid log level
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
   * Gets all log levels as an array of strings.
   * @returns Array of log level strings
   */
  getAllLevels(): LogLevelString[] {
    return Object.keys(LogLevel).filter(
      (key) => isNaN(Number(key))
    ) as LogLevelString[];
  },

  /**
   * Gets all log levels as an array of enum values.
   * @returns Array of log level enum values
   */
  getAllLevelValues(): LogLevel[] {
    return this.getAllLevels().map(
      (levelString) => LogLevel[levelString as keyof typeof LogLevel]
    );
  },
};
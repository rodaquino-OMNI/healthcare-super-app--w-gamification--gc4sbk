/**
 * Utilities for working with log levels throughout the logging system.
 * Provides functions for converting between string and enum log levels,
 * determining if a level should be logged based on configuration,
 * getting numeric values for comparison, and parsing levels from environment variables.
 */

import { LogLevel } from '../interfaces/log-level.enum';

/**
 * Maps string log level names to their corresponding enum values.
 * Case-insensitive for better usability.
 */
const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
  fatal: LogLevel.FATAL,
};

/**
 * Maps journey names to their default log levels if not specified in configuration.
 */
const JOURNEY_DEFAULT_LEVELS: Record<string, LogLevel> = {
  health: LogLevel.INFO,
  care: LogLevel.INFO,
  plan: LogLevel.INFO,
  gamification: LogLevel.INFO,
  default: LogLevel.INFO,
};

/**
 * Numeric values for each log level to enable comparison operations.
 * Higher values indicate higher severity.
 */
const LOG_LEVEL_VALUES: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
  [LogLevel.FATAL]: 4,
};

/**
 * Converts a string log level to its corresponding enum value.
 * Case-insensitive for better usability.
 * 
 * @param level - The string log level to convert
 * @returns The corresponding LogLevel enum value, or LogLevel.INFO if not found
 */
export function parseLogLevel(level: string): LogLevel {
  if (!level) {
    return LogLevel.INFO;
  }
  
  const normalizedLevel = level.toLowerCase();
  return LOG_LEVEL_MAP[normalizedLevel] ?? LogLevel.INFO;
}

/**
 * Converts a LogLevel enum value to its string representation.
 * 
 * @param level - The LogLevel enum value to convert
 * @returns The string representation of the log level
 */
export function logLevelToString(level: LogLevel): string {
  return LogLevel[level];
}

/**
 * Gets the numeric value of a log level for comparison operations.
 * Higher values indicate higher severity.
 * 
 * @param level - The LogLevel to get the numeric value for
 * @returns The numeric value of the log level
 */
export function getLogLevelValue(level: LogLevel): number {
  return LOG_LEVEL_VALUES[level];
}

/**
 * Determines if a message with the given level should be logged based on the configured minimum level.
 * A message is logged if its level is equal to or more severe than the minimum level.
 * 
 * @param messageLevel - The level of the message being logged
 * @param minLevel - The minimum level that should be logged
 * @returns True if the message should be logged, false otherwise
 */
export function shouldLog(messageLevel: LogLevel, minLevel: LogLevel): boolean {
  return getLogLevelValue(messageLevel) >= getLogLevelValue(minLevel);
}

/**
 * Parses a log level from an environment variable.
 * Falls back to a default level if the environment variable is not set or invalid.
 * 
 * @param envVar - The environment variable to parse
 * @param defaultLevel - The default level to use if the environment variable is not set or invalid
 * @returns The parsed LogLevel
 */
export function parseLogLevelFromEnv(envVar: string, defaultLevel: LogLevel = LogLevel.INFO): LogLevel {
  const envValue = process.env[envVar];
  if (!envValue) {
    return defaultLevel;
  }
  
  return parseLogLevel(envValue);
}

/**
 * Gets the appropriate log level for a specific journey based on configuration.
 * Falls back to journey-specific defaults if not configured, then to the global default.
 * 
 * @param journey - The journey name (health, care, plan, etc.)
 * @param configuredLevels - Optional map of journey-specific configured levels
 * @param globalLevel - The global default log level
 * @returns The appropriate LogLevel for the journey
 */
export function getJourneyLogLevel(
  journey: string,
  configuredLevels?: Record<string, LogLevel>,
  globalLevel?: LogLevel
): LogLevel {
  if (!journey) {
    return globalLevel ?? LogLevel.INFO;
  }
  
  // Check if there's a specific configuration for this journey
  if (configuredLevels && configuredLevels[journey]) {
    return configuredLevels[journey];
  }
  
  // Fall back to journey-specific defaults
  const journeyDefault = JOURNEY_DEFAULT_LEVELS[journey.toLowerCase()];
  if (journeyDefault) {
    return journeyDefault;
  }
  
  // Fall back to global level or the default INFO level
  return globalLevel ?? JOURNEY_DEFAULT_LEVELS.default;
}

/**
 * Parses journey-specific log levels from environment variables.
 * Environment variables should be in the format: LOG_LEVEL_JOURNEY_NAME (e.g., LOG_LEVEL_HEALTH).
 * 
 * @returns A record mapping journey names to their log levels from environment variables
 */
export function parseJourneyLogLevelsFromEnv(): Record<string, LogLevel> {
  const journeyLevels: Record<string, LogLevel> = {};
  const LOG_LEVEL_PREFIX = 'LOG_LEVEL_';
  
  // Find all environment variables that start with LOG_LEVEL_
  Object.keys(process.env)
    .filter(key => key.startsWith(LOG_LEVEL_PREFIX))
    .forEach(key => {
      // Extract the journey name (everything after LOG_LEVEL_)
      const journey = key.substring(LOG_LEVEL_PREFIX.length).toLowerCase();
      if (journey) {
        journeyLevels[journey] = parseLogLevel(process.env[key] || '');
      }
    });
  
  return journeyLevels;
}

/**
 * Creates a filter function that can be used to filter log entries based on their level.
 * 
 * @param minLevel - The minimum level that should pass the filter
 * @returns A filter function that returns true for log entries that should be included
 */
export function createLogLevelFilter(minLevel: LogLevel): (level: LogLevel) => boolean {
  return (level: LogLevel) => shouldLog(level, minLevel);
}
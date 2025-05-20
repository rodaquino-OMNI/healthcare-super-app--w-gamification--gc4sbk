/**
 * Utilities for working with log levels throughout the logging system.
 * Provides functions for converting between string and enum log levels,
 * determining if a level should be logged based on configuration,
 * getting numeric values for comparison, and parsing levels from environment variables.
 */

import { LogLevel } from '../interfaces/log-level.enum';

/**
 * Default log level to use if none is specified
 */
export const DEFAULT_LOG_LEVEL = LogLevel.INFO;

/**
 * Journey-specific log level environment variable prefix
 */
export const JOURNEY_LOG_LEVEL_PREFIX = 'AUSTA_JOURNEY_';

/**
 * Global log level environment variable name
 */
export const LOG_LEVEL_ENV_VAR = 'AUSTA_LOG_LEVEL';

/**
 * Maps string log level names to their corresponding enum values
 * @param levelName The string name of the log level
 * @returns The corresponding LogLevel enum value, or DEFAULT_LOG_LEVEL if not found
 */
export function parseLogLevel(levelName: string): LogLevel {
  if (!levelName) {
    return DEFAULT_LOG_LEVEL;
  }
  
  const normalizedLevel = levelName.toUpperCase();
  
  // Check if the level name is a valid enum key
  if (Object.keys(LogLevel).includes(normalizedLevel)) {
    return LogLevel[normalizedLevel as keyof typeof LogLevel];
  }
  
  // Handle numeric string values
  const numericLevel = parseInt(levelName, 10);
  if (!isNaN(numericLevel) && numericLevel >= 0 && numericLevel <= 4) {
    return numericLevel as LogLevel;
  }
  
  return DEFAULT_LOG_LEVEL;
}

/**
 * Converts a LogLevel enum value to its string representation
 * @param level The LogLevel enum value
 * @returns The string representation of the log level
 */
export function logLevelToString(level: LogLevel): string {
  return LogLevel[level];
}

/**
 * Gets the numeric value of a log level for comparison
 * @param level The LogLevel enum value
 * @returns The numeric value of the log level
 */
export function getLogLevelValue(level: LogLevel): number {
  return level as number;
}

/**
 * Determines if a message with the given level should be logged based on the configured minimum level
 * @param messageLevel The level of the message being logged
 * @param configuredLevel The minimum level configured for logging
 * @returns True if the message should be logged, false otherwise
 */
export function shouldLog(messageLevel: LogLevel, configuredLevel: LogLevel): boolean {
  return getLogLevelValue(messageLevel) >= getLogLevelValue(configuredLevel);
}

/**
 * Parses the log level from environment variables
 * @param defaultLevel The default level to use if no environment variable is set
 * @returns The parsed LogLevel
 */
export function getLogLevelFromEnv(defaultLevel: LogLevel = DEFAULT_LOG_LEVEL): LogLevel {
  const envLevel = process.env[LOG_LEVEL_ENV_VAR];
  return envLevel ? parseLogLevel(envLevel) : defaultLevel;
}

/**
 * Gets a journey-specific log level from environment variables
 * @param journeyName The name of the journey (e.g., 'HEALTH', 'CARE', 'PLAN')
 * @param defaultLevel The default level to use if no journey-specific level is set
 * @returns The journey-specific log level, or the default if not found
 */
export function getJourneyLogLevel(journeyName: string, defaultLevel: LogLevel = DEFAULT_LOG_LEVEL): LogLevel {
  if (!journeyName) {
    return defaultLevel;
  }
  
  const normalizedJourneyName = journeyName.toUpperCase();
  const journeyEnvVar = `${JOURNEY_LOG_LEVEL_PREFIX}${normalizedJourneyName}_LOG_LEVEL`;
  const journeyLevel = process.env[journeyEnvVar];
  
  if (journeyLevel) {
    return parseLogLevel(journeyLevel);
  }
  
  // Fall back to global log level if journey-specific not found
  return getLogLevelFromEnv(defaultLevel);
}

/**
 * Creates a log level filter function that can be used to filter log entries
 * @param configuredLevel The minimum level to log
 * @returns A function that takes a LogLevel and returns true if it should be logged
 */
export function createLogLevelFilter(configuredLevel: LogLevel): (level: LogLevel) => boolean {
  return (level: LogLevel) => shouldLog(level, configuredLevel);
}

/**
 * Parses log levels for all journeys from environment variables
 * @param journeys Array of journey names
 * @param defaultLevel Default log level to use if not specified
 * @returns An object mapping journey names to their log levels
 */
export function parseJourneyLogLevels(
  journeys: string[] = ['HEALTH', 'CARE', 'PLAN'],
  defaultLevel: LogLevel = DEFAULT_LOG_LEVEL
): Record<string, LogLevel> {
  const globalLevel = getLogLevelFromEnv(defaultLevel);
  
  return journeys.reduce((levels, journey) => {
    const normalizedJourney = journey.toUpperCase();
    levels[normalizedJourney] = getJourneyLogLevel(normalizedJourney, globalLevel);
    return levels;
  }, {} as Record<string, LogLevel>);
}
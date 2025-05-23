/**
 * Utilities for working with log levels throughout the logging system.
 * Provides functions for converting between string and enum log levels,
 * determining if a level should be logged based on configuration,
 * getting numeric values for comparison, and parsing levels from environment variables.
 */

import { LogLevel } from '../interfaces/log-level.enum';

/**
 * Maps LogLevel enum values to their numeric values for comparison.
 * Higher values indicate more severe log levels.
 */
const LOG_LEVEL_VALUES: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
  [LogLevel.FATAL]: 4,
};

/**
 * Maps string representations of log levels to their enum values.
 */
const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
  fatal: LogLevel.FATAL,
};

/**
 * Default log level to use if none is specified.
 */
export const DEFAULT_LOG_LEVEL = LogLevel.INFO;

/**
 * Journey-specific environment variable prefixes for log level configuration.
 */
export const JOURNEY_ENV_PREFIXES = {
  HEALTH: 'HEALTH_JOURNEY',
  CARE: 'CARE_JOURNEY',
  PLAN: 'PLAN_JOURNEY',
};

/**
 * Converts a string representation of a log level to its enum value.
 * Case-insensitive and returns the default log level if the string is invalid.
 *
 * @param levelStr - String representation of the log level
 * @param defaultLevel - Default log level to return if the string is invalid
 * @returns The corresponding LogLevel enum value
 */
export function parseLogLevel(levelStr: string | undefined, defaultLevel: LogLevel = DEFAULT_LOG_LEVEL): LogLevel {
  if (!levelStr) {
    return defaultLevel;
  }

  const normalizedLevel = levelStr.toLowerCase();
  return LOG_LEVEL_MAP[normalizedLevel] ?? defaultLevel;
}

/**
 * Converts a LogLevel enum value to its string representation.
 *
 * @param level - The LogLevel enum value
 * @returns The string representation of the log level
 */
export function logLevelToString(level: LogLevel): string {
  return LogLevel[level].toLowerCase();
}

/**
 * Gets the numeric value of a log level for comparison.
 * Higher values indicate more severe log levels.
 *
 * @param level - The LogLevel enum value
 * @returns The numeric value of the log level
 */
export function getLogLevelValue(level: LogLevel): number {
  return LOG_LEVEL_VALUES[level];
}

/**
 * Determines if a message with the given level should be logged based on the configured minimum level.
 * A message is logged if its level is equal to or more severe than the minimum level.
 *
 * @param messageLevel - The level of the message to be logged
 * @param configuredLevel - The minimum level configured for logging
 * @returns True if the message should be logged, false otherwise
 */
export function isLevelEnabled(messageLevel: LogLevel, configuredLevel: LogLevel): boolean {
  return getLogLevelValue(messageLevel) >= getLogLevelValue(configuredLevel);
}

/**
 * Parses a log level from an environment variable.
 * If the environment variable is not set or invalid, returns the default level.
 *
 * @param envVarName - The name of the environment variable
 * @param defaultLevel - The default level to return if the environment variable is not set or invalid
 * @returns The parsed LogLevel enum value
 */
export function parseLogLevelFromEnv(envVarName: string, defaultLevel: LogLevel = DEFAULT_LOG_LEVEL): LogLevel {
  return parseLogLevel(process.env[envVarName], defaultLevel);
}

/**
 * Gets the log level for a specific journey from environment variables.
 * Checks for journey-specific environment variables before falling back to the global log level.
 *
 * @param journeyPrefix - The journey-specific environment variable prefix
 * @param defaultLevel - The default level to return if no journey-specific level is configured
 * @returns The journey-specific LogLevel enum value
 */
export function getJourneyLogLevel(journeyPrefix: string, defaultLevel: LogLevel = DEFAULT_LOG_LEVEL): LogLevel {
  // First check for journey-specific log level
  const journeyEnvVar = `${journeyPrefix}_LOG_LEVEL`;
  const journeyLevel = parseLogLevelFromEnv(journeyEnvVar);
  
  if (journeyLevel !== defaultLevel) {
    return journeyLevel;
  }
  
  // Fall back to global log level
  return parseLogLevelFromEnv('LOG_LEVEL', defaultLevel);
}

/**
 * Gets the log level for the Health journey.
 *
 * @param defaultLevel - The default level to return if no Health journey-specific level is configured
 * @returns The Health journey-specific LogLevel enum value
 */
export function getHealthJourneyLogLevel(defaultLevel: LogLevel = DEFAULT_LOG_LEVEL): LogLevel {
  return getJourneyLogLevel(JOURNEY_ENV_PREFIXES.HEALTH, defaultLevel);
}

/**
 * Gets the log level for the Care journey.
 *
 * @param defaultLevel - The default level to return if no Care journey-specific level is configured
 * @returns The Care journey-specific LogLevel enum value
 */
export function getCareJourneyLogLevel(defaultLevel: LogLevel = DEFAULT_LOG_LEVEL): LogLevel {
  return getJourneyLogLevel(JOURNEY_ENV_PREFIXES.CARE, defaultLevel);
}

/**
 * Gets the log level for the Plan journey.
 *
 * @param defaultLevel - The default level to return if no Plan journey-specific level is configured
 * @returns The Plan journey-specific LogLevel enum value
 */
export function getPlanJourneyLogLevel(defaultLevel: LogLevel = DEFAULT_LOG_LEVEL): LogLevel {
  return getJourneyLogLevel(JOURNEY_ENV_PREFIXES.PLAN, defaultLevel);
}

/**
 * Compares two log levels and returns true if the first level is more severe than the second.
 *
 * @param levelA - The first LogLevel enum value
 * @param levelB - The second LogLevel enum value
 * @returns True if levelA is more severe than levelB, false otherwise
 */
export function isMoreSevere(levelA: LogLevel, levelB: LogLevel): boolean {
  return getLogLevelValue(levelA) > getLogLevelValue(levelB);
}

/**
 * Compares two log levels and returns true if the first level is less severe than the second.
 *
 * @param levelA - The first LogLevel enum value
 * @param levelB - The second LogLevel enum value
 * @returns True if levelA is less severe than levelB, false otherwise
 */
export function isLessSevere(levelA: LogLevel, levelB: LogLevel): boolean {
  return getLogLevelValue(levelA) < getLogLevelValue(levelB);
}

/**
 * Gets the most severe log level from an array of levels.
 *
 * @param levels - An array of LogLevel enum values
 * @returns The most severe LogLevel enum value from the array
 */
export function getMostSevereLevel(levels: LogLevel[]): LogLevel {
  if (levels.length === 0) {
    return DEFAULT_LOG_LEVEL;
  }
  
  return levels.reduce((mostSevere, current) => {
    return isMoreSevere(current, mostSevere) ? current : mostSevere;
  }, levels[0]);
}
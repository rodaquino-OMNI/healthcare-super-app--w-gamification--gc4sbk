/**
 * Environment-specific configuration management
 * Provides safe fallbacks and consistent naming conventions
 */

import { JOURNEY_IDS } from '@app/shared/constants/journey.constants';
import { DEFAULT_SERVER_CONFIG, DEFAULT_AUTH_CONFIG, DEFAULT_CORS_CONFIG, 
         DEFAULT_RATE_LIMIT_CONFIG, DEFAULT_GRAPHQL_CONFIG, DEFAULT_CACHE_CONFIG, 
         DEFAULT_LOGGING_CONFIG, DEFAULT_TRACING_CONFIG, DEFAULT_SERVICE_ENDPOINTS,
         DEFAULT_SERVICE_DISCOVERY, ENV_VARS } from './constants';

/**
 * Gets an environment variable with type conversion and fallback
 * @param name Environment variable name
 * @param defaultValue Default value if environment variable is not set
 * @param converter Function to convert string value to desired type
 * @returns The environment variable value or default value
 */
export function getEnvVar<T>(
  name: string, 
  defaultValue: T, 
  converter?: (value: string) => T
): T {
  const value = process.env[name];
  
  if (value === undefined) {
    return defaultValue;
  }
  
  if (converter) {
    try {
      return converter(value);
    } catch (error) {
      console.warn(`Error converting environment variable ${name}: ${error.message}`);
      return defaultValue;
    }
  }
  
  return value as unknown as T;
}

/**
 * Converts a string to a number
 * @param value String value to convert
 * @returns Converted number
 */
export function toNumber(value: string): number {
  const result = parseInt(value, 10);
  if (isNaN(result)) {
    throw new Error(`Cannot convert '${value}' to a number`);
  }
  return result;
}

/**
 * Converts a string to a boolean
 * @param value String value to convert
 * @returns Converted boolean
 */
export function toBoolean(value: string): boolean {
  return value.toLowerCase() === 'true';
}

/**
 * Converts a comma-separated string to an array
 * @param value String value to convert
 * @returns Array of strings
 */
export function toStringArray(value: string): string[] {
  return value.split(',').map(item => item.trim());
}

/**
 * Converts a string to a RegExp or string array based on content
 * @param value String value to convert
 * @returns Array of strings and/or RegExp
 */
export function toCorsOrigin(value: string): (string | RegExp)[] {
  return value.split(',').map(item => {
    const trimmed = item.trim();
    // If it looks like a RegExp pattern (starts and ends with /)
    if (trimmed.startsWith('/') && trimmed.endsWith('/')) {
      const pattern = trimmed.slice(1, -1);
      return new RegExp(pattern);
    }
    return trimmed;
  });
}

/**
 * Gets the server environment (development, staging, production, test)
 * @returns The current server environment
 */
export function getServerEnvironment(): 'development' | 'staging' | 'production' | 'test' {
  const env = getEnvVar(ENV_VARS.NODE_ENV, DEFAULT_SERVER_CONFIG.ENV);
  
  if (['development', 'staging', 'production', 'test'].includes(env)) {
    return env as 'development' | 'staging' | 'production' | 'test';
  }
  
  console.warn(`Invalid environment '${env}', falling back to 'development'`);
  return 'development';
}

/**
 * Gets journey-specific rate limits from environment variables
 * @returns Record of journey IDs to rate limits
 */
export function getJourneyRateLimits(): Record<string, number> {
  return {
    [JOURNEY_IDS.HEALTH]: getEnvVar(ENV_VARS.RATE_LIMIT_HEALTH, DEFAULT_RATE_LIMIT_CONFIG.JOURNEY_LIMITS[JOURNEY_IDS.HEALTH], toNumber),
    [JOURNEY_IDS.CARE]: getEnvVar(ENV_VARS.RATE_LIMIT_CARE, DEFAULT_RATE_LIMIT_CONFIG.JOURNEY_LIMITS[JOURNEY_IDS.CARE], toNumber),
    [JOURNEY_IDS.PLAN]: getEnvVar(ENV_VARS.RATE_LIMIT_PLAN, DEFAULT_RATE_LIMIT_CONFIG.JOURNEY_LIMITS[JOURNEY_IDS.PLAN], toNumber),
  };
}

/**
 * Gets journey-specific cache TTLs from environment variables
 * @returns Record of journey IDs to cache TTLs
 */
export function getJourneyCacheTTLs(): Record<string, string> {
  return {
    [JOURNEY_IDS.HEALTH]: getEnvVar(ENV_VARS.CACHE_TTL_HEALTH, DEFAULT_CACHE_CONFIG.TTL[JOURNEY_IDS.HEALTH]),
    [JOURNEY_IDS.CARE]: getEnvVar(ENV_VARS.CACHE_TTL_CARE, DEFAULT_CACHE_CONFIG.TTL[JOURNEY_IDS.CARE]),
    [JOURNEY_IDS.PLAN]: getEnvVar(ENV_VARS.CACHE_TTL_PLAN, DEFAULT_CACHE_CONFIG.TTL[JOURNEY_IDS.PLAN]),
  };
}
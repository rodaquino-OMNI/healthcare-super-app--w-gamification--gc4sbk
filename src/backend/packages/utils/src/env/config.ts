/**
 * Core environment variable access module
 * 
 * This module provides type-safe functions for retrieving and caching environment variables.
 * It offers getEnv, getRequiredEnv, and getOptionalEnv functions with built-in type conversion,
 * validation, and error handling, allowing services to safely access environment configuration
 * while enforcing proper error handling for missing or malformed variables.
 */

import {
  MissingEnvironmentVariableError,
  InvalidEnvironmentVariableError,
  EnvironmentVariableTypeError,
  withEnvErrorFallback
} from './error';
import { EnvVarPrimitiveType, CachedEnvVar, CacheOptions, EnvAccessOptions } from './types';

/**
 * Default cache TTL in milliseconds (5 minutes)
 */
const DEFAULT_CACHE_TTL = 5 * 60 * 1000;

/**
 * In-memory cache for environment variables
 */
const envCache: Record<string, CachedEnvVar<any>> = {};

/**
 * Default cache configuration
 */
const defaultCacheOptions: CacheOptions = {
  enabled: true,
  ttl: DEFAULT_CACHE_TTL
};

/**
 * Clears the environment variable cache
 * 
 * @param key - Optional specific key to clear from cache. If not provided, clears entire cache.
 */
export function clearEnvCache(key?: string): void {
  if (key) {
    delete envCache[key];
  } else {
    Object.keys(envCache).forEach(cacheKey => {
      delete envCache[cacheKey];
    });
  }
}

/**
 * Gets a value from the environment variable cache
 * 
 * @param key - The cache key
 * @returns The cached value, or undefined if not in cache or expired
 */
function getFromCache<T extends EnvVarPrimitiveType>(key: string): T | undefined {
  const cached = envCache[key];
  
  if (!cached) {
    return undefined;
  }
  
  const now = Date.now();
  if (now - cached.timestamp > cached.ttl) {
    // Cache entry has expired
    delete envCache[key];
    return undefined;
  }
  
  return cached.value as T;
}

/**
 * Stores a value in the environment variable cache
 * 
 * @param key - The cache key
 * @param value - The value to cache
 * @param options - Cache options
 */
function storeInCache<T extends EnvVarPrimitiveType>(
  key: string,
  value: T,
  options: CacheOptions = defaultCacheOptions
): void {
  if (!options.enabled) {
    return;
  }
  
  envCache[key] = {
    value,
    timestamp: Date.now(),
    ttl: options.ttl
  };
}

/**
 * Gets an environment variable with type conversion
 * 
 * @param key - The environment variable name
 * @param options - Access options
 * @returns The environment variable value
 * @throws MissingEnvironmentVariableError if the variable is required but not set
 * @throws InvalidEnvironmentVariableError if the variable fails validation
 */
export function getEnv<T extends EnvVarPrimitiveType = string>(
  key: string,
  options: EnvAccessOptions = {}
): T {
  const {
    cache = true,
    required = true,
    defaultValue,
    transform = (value: string) => value as unknown as T,
    validate
  } = options;
  
  // Check cache first if enabled
  if (cache) {
    const cachedValue = getFromCache<T>(key);
    if (cachedValue !== undefined) {
      return cachedValue;
    }
  }
  
  // Get from process.env
  const value = process.env[key];
  
  // Handle missing value
  if (value === undefined || value === '') {
    if (required) {
      throw new MissingEnvironmentVariableError(key);
    }
    
    if (defaultValue !== undefined) {
      // Cache default value if caching is enabled
      if (cache) {
        storeInCache(key, defaultValue as T, {
          enabled: true,
          ttl: DEFAULT_CACHE_TTL
        });
      }
      return defaultValue as T;
    }
    
    throw new MissingEnvironmentVariableError(key);
  }
  
  // Transform value
  let transformedValue: T;
  try {
    transformedValue = transform(value);
  } catch (error) {
    if (error instanceof Error) {
      throw new EnvironmentVariableTypeError(
        key,
        value,
        typeof defaultValue !== 'undefined' ? typeof defaultValue : 'unknown',
        `Error transforming environment variable ${key}: ${error.message}`,
        undefined,
        undefined,
        error
      );
    }
    throw error;
  }
  
  // Validate value if validator provided
  if (validate) {
    const validationResult = validate(transformedValue);
    if (validationResult !== true && typeof validationResult === 'string') {
      throw new InvalidEnvironmentVariableError(
        key,
        value,
        validationResult,
        `Environment variable ${key} failed validation: ${validationResult}`
      );
    }
  }
  
  // Cache the result if caching is enabled
  if (cache) {
    storeInCache(key, transformedValue, {
      enabled: true,
      ttl: DEFAULT_CACHE_TTL
    });
  }
  
  return transformedValue;
}

/**
 * Gets a required environment variable
 * 
 * @param key - The environment variable name
 * @param options - Access options
 * @returns The environment variable value
 * @throws MissingEnvironmentVariableError if the variable is not set
 * @throws InvalidEnvironmentVariableError if the variable fails validation
 */
export function getRequiredEnv<T extends EnvVarPrimitiveType = string>(
  key: string,
  options: Omit<EnvAccessOptions, 'required'> = {}
): T {
  return getEnv<T>(key, { ...options, required: true });
}

/**
 * Gets an optional environment variable with a default value
 * 
 * @param key - The environment variable name
 * @param defaultValue - The default value to use if the variable is not set
 * @param options - Access options
 * @returns The environment variable value or the default value
 * @throws InvalidEnvironmentVariableError if the variable fails validation
 */
export function getOptionalEnv<T extends EnvVarPrimitiveType = string>(
  key: string,
  defaultValue: T,
  options: Omit<EnvAccessOptions, 'required' | 'defaultValue'> = {}
): T {
  return getEnv<T>(key, { ...options, required: false, defaultValue });
}

/**
 * Gets an environment variable with a namespace prefix
 * 
 * @param namespace - The namespace prefix
 * @param key - The environment variable name (without prefix)
 * @param options - Access options
 * @returns The environment variable value
 */
export function getNamespacedEnv<T extends EnvVarPrimitiveType = string>(
  namespace: string,
  key: string,
  options: EnvAccessOptions = {}
): T {
  const namespacedKey = `${namespace}_${key}`;
  return getEnv<T>(namespacedKey, options);
}

/**
 * Gets a required environment variable with a namespace prefix
 * 
 * @param namespace - The namespace prefix
 * @param key - The environment variable name (without prefix)
 * @param options - Access options
 * @returns The environment variable value
 */
export function getRequiredNamespacedEnv<T extends EnvVarPrimitiveType = string>(
  namespace: string,
  key: string,
  options: Omit<EnvAccessOptions, 'required'> = {}
): T {
  const namespacedKey = `${namespace}_${key}`;
  return getRequiredEnv<T>(namespacedKey, options);
}

/**
 * Gets an optional environment variable with a namespace prefix
 * 
 * @param namespace - The namespace prefix
 * @param key - The environment variable name (without prefix)
 * @param defaultValue - The default value to use if the variable is not set
 * @param options - Access options
 * @returns The environment variable value or the default value
 */
export function getOptionalNamespacedEnv<T extends EnvVarPrimitiveType = string>(
  namespace: string,
  key: string,
  defaultValue: T,
  options: Omit<EnvAccessOptions, 'required' | 'defaultValue'> = {}
): T {
  const namespacedKey = `${namespace}_${key}`;
  return getOptionalEnv<T>(namespacedKey, defaultValue, options);
}

/**
 * Gets a boolean environment variable
 * 
 * @param key - The environment variable name
 * @param options - Access options
 * @returns The boolean value
 */
export function getBooleanEnv(
  key: string,
  options: Omit<EnvAccessOptions, 'transform'> = {}
): boolean {
  return getEnv<boolean>(key, {
    ...options,
    transform: (value: string) => {
      const normalizedValue = value.toLowerCase().trim();
      if (['true', 'yes', '1', 'on'].includes(normalizedValue)) {
        return true;
      }
      if (['false', 'no', '0', 'off'].includes(normalizedValue)) {
        return false;
      }
      throw new Error(`Cannot parse value "${value}" to boolean`);
    }
  });
}

/**
 * Gets a numeric environment variable
 * 
 * @param key - The environment variable name
 * @param options - Access options
 * @returns The numeric value
 */
export function getNumberEnv(
  key: string,
  options: Omit<EnvAccessOptions, 'transform'> & { min?: number; max?: number } = {}
): number {
  const { min, max, ...restOptions } = options;
  
  return getEnv<number>(key, {
    ...restOptions,
    transform: (value: string) => {
      const parsedValue = Number(value.trim());
      if (isNaN(parsedValue)) {
        throw new Error(`Cannot parse value "${value}" to number`);
      }
      if (min !== undefined && parsedValue < min) {
        throw new Error(`Value ${parsedValue} is less than minimum allowed value ${min}`);
      }
      if (max !== undefined && parsedValue > max) {
        throw new Error(`Value ${parsedValue} is greater than maximum allowed value ${max}`);
      }
      return parsedValue;
    }
  });
}

/**
 * Gets an array environment variable
 * 
 * @param key - The environment variable name
 * @param options - Access options
 * @returns The array value
 */
export function getArrayEnv<T = string>(
  key: string,
  options: Omit<EnvAccessOptions, 'transform'> & {
    delimiter?: string;
    itemTransform?: (item: string) => T;
  } = {}
): T[] {
  const { delimiter = ',', itemTransform, ...restOptions } = options;
  
  return getEnv<T[]>(key, {
    ...restOptions,
    transform: (value: string) => {
      // Try to parse as JSON array first
      if (value.trim().startsWith('[') && value.trim().endsWith(']')) {
        try {
          const parsedArray = JSON.parse(value);
          if (Array.isArray(parsedArray)) {
            return itemTransform
              ? parsedArray.map(item => itemTransform(String(item)))
              : parsedArray as unknown as T[];
          }
        } catch (error) {
          // If JSON parsing fails, continue with delimiter-based parsing
        }
      }
      
      const items = value
        .split(delimiter)
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      return itemTransform
        ? items.map(itemTransform)
        : items as unknown as T[];
    }
  });
}

/**
 * Gets a JSON environment variable
 * 
 * @param key - The environment variable name
 * @param options - Access options
 * @returns The parsed JSON value
 */
export function getJsonEnv<T extends Record<string, any>>(
  key: string,
  options: Omit<EnvAccessOptions, 'transform'> = {}
): T {
  return getEnv<T>(key, {
    ...options,
    transform: (value: string) => {
      try {
        return JSON.parse(value) as T;
      } catch (error) {
        throw new Error(`Cannot parse value to JSON: ${(error as Error).message}`);
      }
    }
  });
}

/**
 * Gets a URL environment variable
 * 
 * @param key - The environment variable name
 * @param options - Access options
 * @returns The URL object
 */
export function getUrlEnv(
  key: string,
  options: Omit<EnvAccessOptions, 'transform'> & {
    protocols?: string[];
    requireTld?: boolean;
  } = {}
): URL {
  const { protocols, requireTld = true, ...restOptions } = options;
  
  return getEnv<URL>(key, {
    ...restOptions,
    transform: (value: string) => {
      try {
        const url = new URL(value);
        
        // Validate protocol if specified
        if (protocols && protocols.length > 0) {
          const urlProtocol = url.protocol.replace(':', '');
          if (!protocols.includes(urlProtocol)) {
            throw new Error(`URL protocol "${urlProtocol}" is not allowed. Allowed protocols: ${protocols.join(', ')}`);
          }
        }
        
        // Validate TLD if required
        if (requireTld && !url.hostname.includes('.')) {
          throw new Error('URL must include a top-level domain');
        }
        
        return url;
      } catch (error) {
        if (error instanceof Error && (error.message.includes('protocol') || error.message.includes('top-level domain'))) {
          throw error;
        }
        
        throw new Error(`Invalid URL: ${value}`);
      }
    }
  });
}

/**
 * Gets an enum environment variable
 * 
 * @param key - The environment variable name
 * @param enumValues - Array of allowed enum values
 * @param options - Access options
 * @returns The enum value
 */
export function getEnumEnv<T extends string>(
  key: string,
  enumValues: readonly T[],
  options: Omit<EnvAccessOptions, 'transform'> & {
    caseSensitive?: boolean;
  } = {}
): T {
  const { caseSensitive = false, ...restOptions } = options;
  
  return getEnv<T>(key, {
    ...restOptions,
    transform: (value: string) => {
      const normalizedValue = caseSensitive ? value.trim() : value.trim().toLowerCase();
      const normalizedEnumValues = caseSensitive
        ? enumValues
        : enumValues.map(v => v.toLowerCase()) as unknown as readonly T[];
      
      const index = normalizedEnumValues.indexOf(normalizedValue as T);
      
      if (index !== -1) {
        return enumValues[index];
      }
      
      throw new Error(`Value "${value}" is not in allowed enum values: ${enumValues.join(', ')}`);
    }
  });
}

/**
 * Gets a feature flag environment variable
 * 
 * @param key - The feature flag name
 * @param defaultValue - Default value if the flag is not set
 * @returns Boolean indicating if the feature is enabled
 */
export function getFeatureFlag(key: string, defaultValue = false): boolean {
  const flagKey = `FEATURE_${key.toUpperCase()}`;
  
  return withEnvErrorFallback(
    () => getBooleanEnv(flagKey, { required: false, defaultValue }),
    defaultValue
  );
}

/**
 * Gets a journey-specific environment variable
 * 
 * @param journey - The journey identifier (health, care, plan)
 * @param key - The environment variable name
 * @param options - Access options
 * @returns The environment variable value
 */
export function getJourneyEnv<T extends EnvVarPrimitiveType = string>(
  journey: string,
  key: string,
  options: EnvAccessOptions = {}
): T {
  const journeyPrefix = journey.toUpperCase();
  return getNamespacedEnv<T>(journeyPrefix, key, options);
}

/**
 * Gets a required journey-specific environment variable
 * 
 * @param journey - The journey identifier (health, care, plan)
 * @param key - The environment variable name
 * @param options - Access options
 * @returns The environment variable value
 */
export function getRequiredJourneyEnv<T extends EnvVarPrimitiveType = string>(
  journey: string,
  key: string,
  options: Omit<EnvAccessOptions, 'required'> = {}
): T {
  const journeyPrefix = journey.toUpperCase();
  return getRequiredNamespacedEnv<T>(journeyPrefix, key, options);
}

/**
 * Gets an optional journey-specific environment variable
 * 
 * @param journey - The journey identifier (health, care, plan)
 * @param key - The environment variable name
 * @param defaultValue - The default value to use if the variable is not set
 * @param options - Access options
 * @returns The environment variable value or the default value
 */
export function getOptionalJourneyEnv<T extends EnvVarPrimitiveType = string>(
  journey: string,
  key: string,
  defaultValue: T,
  options: Omit<EnvAccessOptions, 'required' | 'defaultValue'> = {}
): T {
  const journeyPrefix = journey.toUpperCase();
  return getOptionalNamespacedEnv<T>(journeyPrefix, key, defaultValue, options);
}

/**
 * Gets a journey-specific feature flag
 * 
 * @param journey - The journey identifier (health, care, plan)
 * @param key - The feature flag name
 * @param defaultValue - Default value if the flag is not set
 * @returns Boolean indicating if the feature is enabled
 */
export function getJourneyFeatureFlag(journey: string, key: string, defaultValue = false): boolean {
  const journeyPrefix = journey.toUpperCase();
  const flagKey = `${journeyPrefix}_FEATURE_${key.toUpperCase()}`;
  
  return withEnvErrorFallback(
    () => getBooleanEnv(flagKey, { required: false, defaultValue }),
    defaultValue
  );
}

/**
 * Gets all environment variables with a specific prefix
 * 
 * @param prefix - The prefix to filter environment variables
 * @param options - Whether to transform keys by removing the prefix and converting to camelCase
 * @returns Object containing all matching environment variables
 */
export function getAllEnvWithPrefix(
  prefix: string,
  options: {
    transformKeys?: boolean;
    removePrefix?: boolean;
  } = {}
): Record<string, string> {
  const { transformKeys = false, removePrefix = true } = options;
  const result: Record<string, string> = {};
  const normalizedPrefix = prefix.endsWith('_') ? prefix : `${prefix}_`;
  
  Object.keys(process.env).forEach(key => {
    if (key.startsWith(normalizedPrefix)) {
      let resultKey = key;
      
      if (removePrefix) {
        resultKey = key.substring(normalizedPrefix.length);
      }
      
      if (transformKeys) {
        // Convert to camelCase
        resultKey = resultKey.toLowerCase().replace(/(_[a-z])/g, group =>
          group.replace('_', '').toUpperCase()
        );
      }
      
      result[resultKey] = process.env[key] || '';
    }
  });
  
  return result;
}

/**
 * Gets all journey-specific environment variables
 * 
 * @param journey - The journey identifier (health, care, plan)
 * @param options - Whether to transform keys by removing the prefix and converting to camelCase
 * @returns Object containing all journey-specific environment variables
 */
export function getAllJourneyEnv(
  journey: string,
  options: {
    transformKeys?: boolean;
    removePrefix?: boolean;
  } = {}
): Record<string, string> {
  const journeyPrefix = journey.toUpperCase();
  return getAllEnvWithPrefix(journeyPrefix, options);
}

/**
 * Validates that all required environment variables are present
 * 
 * @param requiredVars - Array of required environment variable names
 * @throws MissingEnvironmentVariableError if any required variable is missing
 */
export function validateRequiredEnv(requiredVars: string[]): void {
  const missingVars = requiredVars.filter(key => {
    const value = process.env[key];
    return value === undefined || value === '';
  });
  
  if (missingVars.length > 0) {
    if (missingVars.length === 1) {
      throw new MissingEnvironmentVariableError(missingVars[0]);
    }
    
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
}

/**
 * Validates that all required journey-specific environment variables are present
 * 
 * @param journey - The journey identifier (health, care, plan)
 * @param requiredVars - Array of required environment variable names (without journey prefix)
 * @throws MissingEnvironmentVariableError if any required variable is missing
 */
export function validateRequiredJourneyEnv(journey: string, requiredVars: string[]): void {
  const journeyPrefix = journey.toUpperCase();
  const prefixedVars = requiredVars.map(key => `${journeyPrefix}_${key}`);
  
  try {
    validateRequiredEnv(prefixedVars);
  } catch (error) {
    if (error instanceof MissingEnvironmentVariableError) {
      // Convert to journey-specific error
      const varName = error.variableName;
      if (varName && varName.startsWith(`${journeyPrefix}_`)) {
        const unprefixedName = varName.substring(journeyPrefix.length + 1);
        throw MissingEnvironmentVariableError.forJourney(unprefixedName, journey);
      }
    }
    throw error;
  }
}
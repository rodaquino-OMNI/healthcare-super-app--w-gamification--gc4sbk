/**
 * Environment variable management system that provides type-safe access to configuration values.
 * Implements caching, validation, and error handling for environment variables across all services.
 */

/**
 * Cache for environment variables to avoid repeated process.env access
 */
const envCache: Record<string, any> = {};

/**
 * Error thrown when a required environment variable is missing
 */
export class MissingEnvironmentVariableError extends Error {
  constructor(key: string, namespace?: string) {
    const fullKey = namespace ? `${namespace}_${key}` : key;
    super(`Required environment variable '${fullKey}' is missing`);
    this.name = 'MissingEnvironmentVariableError';
  }
}

/**
 * Error thrown when an environment variable has an invalid format
 */
export class InvalidEnvironmentVariableError extends Error {
  constructor(key: string, expectedType: string, namespace?: string) {
    const fullKey = namespace ? `${namespace}_${key}` : key;
    super(`Environment variable '${fullKey}' has invalid format. Expected type: ${expectedType}`);
    this.name = 'InvalidEnvironmentVariableError';
  }
}

/**
 * Available environment variable types for conversion
 */
export type EnvVarType = 'string' | 'number' | 'boolean' | 'json' | 'array';

/**
 * Type mapping for environment variable types
 */
type TypeMapping = {
  string: string;
  number: number;
  boolean: boolean;
  json: Record<string, any>;
  array: string[];
};

/**
 * Options for environment variable retrieval
 */
interface EnvOptions {
  /** Cache the environment variable value for future retrievals */
  cache?: boolean;
  /** Namespace prefix for the environment variable */
  namespace?: string;
}

/**
 * Converts a string value to the specified type
 * 
 * @param value - The string value to convert
 * @param type - The target type to convert to
 * @returns The converted value
 * @throws {InvalidEnvironmentVariableError} If the value cannot be converted to the specified type
 */
function convertValue<T extends EnvVarType>(value: string, type: T, key: string, namespace?: string): TypeMapping[T] {
  try {
    switch (type) {
      case 'string':
        return value as unknown as TypeMapping[T];
      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          throw new Error('Not a number');
        }
        return num as unknown as TypeMapping[T];
      case 'boolean':
        if (value.toLowerCase() === 'true') return true as unknown as TypeMapping[T];
        if (value.toLowerCase() === 'false') return false as unknown as TypeMapping[T];
        if (value === '1') return true as unknown as TypeMapping[T];
        if (value === '0') return false as unknown as TypeMapping[T];
        throw new Error('Not a boolean');
      case 'json':
        return JSON.parse(value) as unknown as TypeMapping[T];
      case 'array':
        return value.split(',').map(item => item.trim()) as unknown as TypeMapping[T];
      default:
        return value as unknown as TypeMapping[T];
    }
  } catch (error) {
    throw new InvalidEnvironmentVariableError(key, type, namespace);
  }
}

/**
 * Gets the full environment variable key with optional namespace
 * 
 * @param key - The environment variable key
 * @param namespace - Optional namespace prefix
 * @returns The full environment variable key
 */
function getFullKey(key: string, namespace?: string): string {
  return namespace ? `${namespace}_${key}` : key;
}

/**
 * Gets an environment variable with type conversion
 * 
 * @param key - The environment variable key
 * @param type - The type to convert the value to
 * @param options - Additional options for retrieval
 * @returns The environment variable value converted to the specified type
 * @throws {MissingEnvironmentVariableError} If the environment variable is not defined
 * @throws {InvalidEnvironmentVariableError} If the environment variable cannot be converted to the specified type
 */
export function getEnv<T extends EnvVarType>(
  key: string,
  type: T,
  options: EnvOptions = {}
): TypeMapping[T] {
  const { cache = true, namespace } = options;
  const fullKey = getFullKey(key, namespace);
  
  // Check cache first if enabled
  if (cache && fullKey in envCache) {
    return envCache[fullKey] as TypeMapping[T];
  }
  
  const value = process.env[fullKey];
  
  if (value === undefined) {
    throw new MissingEnvironmentVariableError(key, namespace);
  }
  
  const convertedValue = convertValue(value, type, key, namespace);
  
  // Cache the result if enabled
  if (cache) {
    envCache[fullKey] = convertedValue;
  }
  
  return convertedValue;
}

/**
 * Gets a required environment variable with type conversion
 * Alias for getEnv for semantic clarity
 * 
 * @param key - The environment variable key
 * @param type - The type to convert the value to
 * @param options - Additional options for retrieval
 * @returns The environment variable value converted to the specified type
 * @throws {MissingEnvironmentVariableError} If the environment variable is not defined
 * @throws {InvalidEnvironmentVariableError} If the environment variable cannot be converted to the specified type
 */
export function getRequiredEnv<T extends EnvVarType>(
  key: string,
  type: T,
  options: EnvOptions = {}
): TypeMapping[T] {
  return getEnv(key, type, options);
}

/**
 * Gets an optional environment variable with type conversion and default value
 * 
 * @param key - The environment variable key
 * @param type - The type to convert the value to
 * @param defaultValue - The default value to return if the environment variable is not defined
 * @param options - Additional options for retrieval
 * @returns The environment variable value converted to the specified type, or the default value
 * @throws {InvalidEnvironmentVariableError} If the environment variable cannot be converted to the specified type
 */
export function getOptionalEnv<T extends EnvVarType>(
  key: string,
  type: T,
  defaultValue: TypeMapping[T],
  options: EnvOptions = {}
): TypeMapping[T] {
  const { cache = true, namespace } = options;
  const fullKey = getFullKey(key, namespace);
  
  // Check cache first if enabled
  if (cache && fullKey in envCache) {
    return envCache[fullKey] as TypeMapping[T];
  }
  
  const value = process.env[fullKey];
  
  if (value === undefined) {
    // Cache the default value if enabled
    if (cache) {
      envCache[fullKey] = defaultValue;
    }
    return defaultValue;
  }
  
  const convertedValue = convertValue(value, type, key, namespace);
  
  // Cache the result if enabled
  if (cache) {
    envCache[fullKey] = convertedValue;
  }
  
  return convertedValue;
}

/**
 * Clears the environment variable cache
 * Useful for testing or when environment variables change at runtime
 * 
 * @param key - Optional specific key to clear from cache
 * @param namespace - Optional namespace to clear from cache
 */
export function clearEnvCache(key?: string, namespace?: string): void {
  if (key) {
    const fullKey = getFullKey(key, namespace);
    delete envCache[fullKey];
  } else {
    // Clear all cache if no key specified
    Object.keys(envCache).forEach(k => delete envCache[k]);
  }
}

/**
 * Gets all environment variables with a specific namespace prefix
 * 
 * @param namespace - The namespace prefix to filter environment variables
 * @returns Record of environment variables with the namespace prefix
 */
export function getNamespacedEnv(namespace: string): Record<string, string> {
  const prefix = `${namespace}_`;
  const result: Record<string, string> = {};
  
  Object.keys(process.env).forEach(key => {
    if (key.startsWith(prefix)) {
      // Remove the namespace prefix from the key
      const shortKey = key.substring(prefix.length);
      result[shortKey] = process.env[key] as string;
    }
  });
  
  return result;
}

/**
 * Validates that all required environment variables are present
 * 
 * @param requiredVars - Array of required environment variable keys
 * @param namespace - Optional namespace for the environment variables
 * @throws {MissingEnvironmentVariableError} If any required environment variable is missing
 */
export function validateRequiredEnv(requiredVars: string[], namespace?: string): void {
  const missingVars: string[] = [];
  
  requiredVars.forEach(key => {
    const fullKey = getFullKey(key, namespace);
    if (process.env[fullKey] === undefined) {
      missingVars.push(fullKey);
    }
  });
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

/**
 * Gets a boolean environment variable
 * Convenience wrapper around getEnv
 * 
 * @param key - The environment variable key
 * @param options - Additional options for retrieval
 * @returns The boolean value of the environment variable
 */
export function getBooleanEnv(key: string, options: EnvOptions = {}): boolean {
  return getEnv(key, 'boolean', options);
}

/**
 * Gets an optional boolean environment variable with default value
 * Convenience wrapper around getOptionalEnv
 * 
 * @param key - The environment variable key
 * @param defaultValue - The default value to return if the environment variable is not defined
 * @param options - Additional options for retrieval
 * @returns The boolean value of the environment variable or the default value
 */
export function getOptionalBooleanEnv(key: string, defaultValue: boolean, options: EnvOptions = {}): boolean {
  return getOptionalEnv(key, 'boolean', defaultValue, options);
}

/**
 * Gets a number environment variable
 * Convenience wrapper around getEnv
 * 
 * @param key - The environment variable key
 * @param options - Additional options for retrieval
 * @returns The number value of the environment variable
 */
export function getNumberEnv(key: string, options: EnvOptions = {}): number {
  return getEnv(key, 'number', options);
}

/**
 * Gets an optional number environment variable with default value
 * Convenience wrapper around getOptionalEnv
 * 
 * @param key - The environment variable key
 * @param defaultValue - The default value to return if the environment variable is not defined
 * @param options - Additional options for retrieval
 * @returns The number value of the environment variable or the default value
 */
export function getOptionalNumberEnv(key: string, defaultValue: number, options: EnvOptions = {}): number {
  return getOptionalEnv(key, 'number', defaultValue, options);
}

/**
 * Gets a JSON environment variable
 * Convenience wrapper around getEnv
 * 
 * @param key - The environment variable key
 * @param options - Additional options for retrieval
 * @returns The parsed JSON value of the environment variable
 */
export function getJsonEnv(key: string, options: EnvOptions = {}): Record<string, any> {
  return getEnv(key, 'json', options);
}

/**
 * Gets an optional JSON environment variable with default value
 * Convenience wrapper around getOptionalEnv
 * 
 * @param key - The environment variable key
 * @param defaultValue - The default value to return if the environment variable is not defined
 * @param options - Additional options for retrieval
 * @returns The parsed JSON value of the environment variable or the default value
 */
export function getOptionalJsonEnv(
  key: string,
  defaultValue: Record<string, any>,
  options: EnvOptions = {}
): Record<string, any> {
  return getOptionalEnv(key, 'json', defaultValue, options);
}

/**
 * Gets an array environment variable (comma-separated values)
 * Convenience wrapper around getEnv
 * 
 * @param key - The environment variable key
 * @param options - Additional options for retrieval
 * @returns The array value of the environment variable
 */
export function getArrayEnv(key: string, options: EnvOptions = {}): string[] {
  return getEnv(key, 'array', options);
}

/**
 * Gets an optional array environment variable with default value
 * Convenience wrapper around getOptionalEnv
 * 
 * @param key - The environment variable key
 * @param defaultValue - The default value to return if the environment variable is not defined
 * @param options - Additional options for retrieval
 * @returns The array value of the environment variable or the default value
 */
export function getOptionalArrayEnv(key: string, defaultValue: string[], options: EnvOptions = {}): string[] {
  return getOptionalEnv(key, 'array', defaultValue, options);
}

/**
 * Gets a journey-specific environment variable
 * Uses the journey ID as the namespace
 * 
 * @param journeyId - The journey identifier (health, care, plan)
 * @param key - The environment variable key
 * @param type - The type to convert the value to
 * @param options - Additional options for retrieval
 * @returns The environment variable value converted to the specified type
 */
export function getJourneyEnv<T extends EnvVarType>(
  journeyId: 'health' | 'care' | 'plan',
  key: string,
  type: T,
  options: Omit<EnvOptions, 'namespace'> = {}
): TypeMapping[T] {
  return getEnv(key, type, { ...options, namespace: journeyId.toUpperCase() });
}

/**
 * Gets an optional journey-specific environment variable with default value
 * Uses the journey ID as the namespace
 * 
 * @param journeyId - The journey identifier (health, care, plan)
 * @param key - The environment variable key
 * @param type - The type to convert the value to
 * @param defaultValue - The default value to return if the environment variable is not defined
 * @param options - Additional options for retrieval
 * @returns The environment variable value converted to the specified type or the default value
 */
export function getOptionalJourneyEnv<T extends EnvVarType>(
  journeyId: 'health' | 'care' | 'plan',
  key: string,
  type: T,
  defaultValue: TypeMapping[T],
  options: Omit<EnvOptions, 'namespace'> = {}
): TypeMapping[T] {
  return getOptionalEnv(key, type, defaultValue, { ...options, namespace: journeyId.toUpperCase() });
}

/**
 * Gets a feature flag environment variable
 * Feature flags are boolean environment variables with the FF_ prefix
 * 
 * @param flagName - The feature flag name
 * @param defaultValue - The default value if the feature flag is not defined
 * @returns The boolean value of the feature flag
 */
export function getFeatureFlag(flagName: string, defaultValue = false): boolean {
  return getOptionalEnv(`FF_${flagName}`, 'boolean', defaultValue, { namespace: undefined });
}
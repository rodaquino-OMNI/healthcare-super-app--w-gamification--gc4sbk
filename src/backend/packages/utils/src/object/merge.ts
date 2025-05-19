/**
 * Utilities for deep merging objects, essential for combining configuration objects,
 * state updates, and data structures across journey services.
 * 
 * This module provides functions to intelligently combine nested objects while
 * preserving immutability, with support for different merge strategies.
 */

/**
 * Defines the strategy to use when merging arrays.
 */
export enum MergeStrategy {
  /**
   * Replace the target array with the source array.
   */
  REPLACE = 'replace',
  
  /**
   * Combine arrays, removing duplicates (based on strict equality).
   */
  COMBINE = 'combine',
  
  /**
   * Append source array items to the target array (may contain duplicates).
   */
  APPEND = 'append'
}

/**
 * Options for controlling the deep merge behavior.
 */
export interface DeepMergeOptions {
  /**
   * Strategy to use when merging arrays.
   * @default MergeStrategy.REPLACE
   */
  arrayStrategy?: MergeStrategy;
  
  /**
   * Maximum depth to traverse when merging objects.
   * Use to prevent stack overflow with deeply nested objects.
   * @default 100
   */
  maxDepth?: number;
  
  /**
   * Current depth in the merge operation (used internally).
   * @internal
   */
  _currentDepth?: number;
}

/**
 * Type guard to check if a value is a plain object (not null, not an array, not a date, etc.)
 * 
 * @param value - The value to check
 * @returns True if the value is a plain object
 */
function isPlainObject(value: unknown): value is Record<string, any> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

/**
 * Deeply merges two or more objects together, with configurable merge strategies.
 * 
 * This function intelligently combines nested objects while preserving immutability.
 * It supports different strategies for merging arrays and handles edge cases like
 * null values, circular references (up to maxDepth), and type mismatches.
 * 
 * @param target - The target object to merge into
 * @param sources - One or more source objects to merge from
 * @param options - Options to control merge behavior
 * @returns A new object with the merged properties
 * 
 * @example
 * // Basic merge
 * const result = deepMerge({ a: 1 }, { b: 2 });
 * // result: { a: 1, b: 2 }
 * 
 * @example
 * // Nested merge
 * const result = deepMerge(
 *   { user: { name: 'John', age: 30 } },
 *   { user: { age: 31, role: 'admin' } }
 * );
 * // result: { user: { name: 'John', age: 31, role: 'admin' } }
 * 
 * @example
 * // Array merge with different strategies
 * const target = { tags: ['important', 'urgent'] };
 * const source = { tags: ['approved', 'urgent'] };
 * 
 * // Replace strategy (default)
 * deepMerge(target, source);
 * // result: { tags: ['approved', 'urgent'] }
 * 
 * // Combine strategy (removes duplicates)
 * deepMerge(target, source, { arrayStrategy: MergeStrategy.COMBINE });
 * // result: { tags: ['important', 'urgent', 'approved'] }
 * 
 * // Append strategy (keeps duplicates)
 * deepMerge(target, source, { arrayStrategy: MergeStrategy.APPEND });
 * // result: { tags: ['important', 'urgent', 'approved', 'urgent'] }
 */
export function deepMerge<T extends Record<string, any>, S extends Record<string, any>[]>(
  target: T,
  ...sources: S
): T & S[number] {
  // Handle case with no sources
  if (sources.length === 0) {
    return { ...target } as T & S[number];
  }
  
  return deepMergeWithOptions(target, sources, {});
}

/**
 * Deeply merges two or more objects together with explicit options.
 * 
 * @param target - The target object to merge into
 * @param sources - One or more source objects to merge from
 * @param options - Options to control merge behavior
 * @returns A new object with the merged properties
 */
export function deepMergeWithOptions<T extends Record<string, any>, S extends Record<string, any>[]>(
  target: T,
  sources: S,
  options: DeepMergeOptions
): T & S[number] {
  if (!isPlainObject(target)) {
    throw new TypeError('Target must be a plain object');
  }
  
  const {
    arrayStrategy = MergeStrategy.REPLACE,
    maxDepth = 100,
    _currentDepth = 0
  } = options;
  
  // Prevent stack overflow with deeply nested objects
  if (_currentDepth > maxDepth) {
    throw new Error(`Maximum merge depth of ${maxDepth} exceeded. Possible circular reference detected.`);
  }
  
  // Create a new object to avoid mutating the target
  const result = { ...target } as Record<string, any>;
  
  // Process each source object
  for (const source of sources) {
    // Skip null or undefined sources
    if (source == null) {
      continue;
    }
    
    if (!isPlainObject(source)) {
      throw new TypeError('Source must be a plain object');
    }
    
    // Merge each property from the source object
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const targetValue = result[key];
        const sourceValue = source[key];
        
        // Handle different value types
        if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
          // Recursively merge nested objects
          result[key] = deepMergeWithOptions(
            targetValue,
            [sourceValue],
            {
              arrayStrategy,
              maxDepth,
              _currentDepth: _currentDepth + 1
            }
          );
        } else if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
          // Handle arrays according to the specified strategy
          switch (arrayStrategy) {
            case MergeStrategy.REPLACE:
              result[key] = [...sourceValue];
              break;
              
            case MergeStrategy.COMBINE:
              // Combine arrays, removing duplicates
              const combined = [...targetValue];
              for (const item of sourceValue) {
                if (!combined.includes(item)) {
                  combined.push(item);
                }
              }
              result[key] = combined;
              break;
              
            case MergeStrategy.APPEND:
              // Append source array to target array
              result[key] = [...targetValue, ...sourceValue];
              break;
              
            default:
              throw new Error(`Unknown array merge strategy: ${arrayStrategy}`);
          }
        } else if (sourceValue === undefined) {
          // Skip undefined values to allow for partial updates
          continue;
        } else {
          // For all other types, use the source value
          result[key] = sourceValue;
        }
      }
    }
  }
  
  return result as T & S[number];
}

/**
 * Merges configuration objects with special handling for environment-specific overrides.
 * 
 * This is a specialized version of deepMerge optimized for configuration objects.
 * It automatically applies environment-specific overrides based on the current NODE_ENV.
 * 
 * @param baseConfig - The base configuration object
 * @param envConfigs - Environment-specific configuration overrides
 * @returns The merged configuration with environment overrides applied
 * 
 * @example
 * const config = mergeConfig(
 *   { apiUrl: 'https://api.example.com', timeout: 5000 },
 *   {
 *     development: { apiUrl: 'http://localhost:3000', debug: true },
 *     production: { timeout: 3000 }
 *   }
 * );
 * 
 * // In development environment:
 * // { apiUrl: 'http://localhost:3000', timeout: 5000, debug: true }
 * 
 * // In production environment:
 * // { apiUrl: 'https://api.example.com', timeout: 3000 }
 */
export function mergeConfig<T extends Record<string, any>>(
  baseConfig: T,
  envConfigs: Record<string, Partial<T>> = {}
): T {
  if (!isPlainObject(baseConfig)) {
    throw new TypeError('Base configuration must be a plain object');
  }
  
  // Get current environment
  const env = process.env.NODE_ENV || 'development';
  
  // Get environment-specific config
  const envConfig = envConfigs[env] || {};
  
  // Merge base config with environment-specific overrides
  return deepMergeWithOptions(baseConfig, [envConfig], {
    arrayStrategy: MergeStrategy.REPLACE
  });
}

/**
 * Merges journey-specific configuration with base configuration.
 * 
 * This function is specialized for the journey-centered architecture of the AUSTA SuperApp.
 * It allows each journey (Health, Care, Plan) to have its own configuration that extends
 * the base application configuration.
 * 
 * @param baseConfig - The base application configuration
 * @param journeyConfig - Journey-specific configuration overrides
 * @param options - Options to control merge behavior
 * @returns The merged configuration with journey-specific overrides applied
 * 
 * @example
 * const appConfig = { theme: 'light', apiTimeout: 5000 };
 * const healthJourneyConfig = { theme: 'health-theme', metrics: { refresh: 60 } };
 * 
 * const config = mergeJourneyConfig(appConfig, healthJourneyConfig);
 * // { theme: 'health-theme', apiTimeout: 5000, metrics: { refresh: 60 } }
 */
export function mergeJourneyConfig<T extends Record<string, any>, J extends Record<string, any>>(
  baseConfig: T,
  journeyConfig: J,
  options: DeepMergeOptions = {}
): T & J {
  if (!isPlainObject(baseConfig)) {
    throw new TypeError('Base configuration must be a plain object');
  }
  
  if (!isPlainObject(journeyConfig)) {
    throw new TypeError('Journey configuration must be a plain object');
  }
  
  return deepMergeWithOptions(baseConfig, [journeyConfig], {
    arrayStrategy: options.arrayStrategy || MergeStrategy.REPLACE,
    maxDepth: options.maxDepth || 100
  });
}
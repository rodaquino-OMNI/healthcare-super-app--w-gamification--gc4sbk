/**
 * Object merging utilities for combining configuration objects, state updates, and data structures.
 * These utilities provide deep merging capabilities with configurable strategies for handling arrays
 * and nested objects while preserving immutability.
 */

/**
 * Determines if a value is a plain object (not an array, null, or built-in object type).
 * 
 * @param {unknown} value - The value to check
 * @returns {boolean} True if the value is a plain object, false otherwise
 */
const isPlainObject = (value: unknown): value is Record<string, any> => {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

/**
 * Strategy to use when merging arrays.
 */
export enum ArrayMergeStrategy {
  /**
   * Replace the target array with the source array
   */
  REPLACE = 'replace',
  
  /**
   * Combine arrays, removing duplicates (for primitive values only)
   */
  COMBINE = 'combine',
  
  /**
   * Append source array items to the target array
   */
  APPEND = 'append',
  
  /**
   * Merge arrays by index (objects at the same index position will be deep merged)
   */
  MERGE_BY_INDEX = 'mergeByIndex'
}

/**
 * Options for configuring the deep merge behavior.
 */
export interface MergeOptions {
  /**
   * Strategy to use when merging arrays
   * @default ArrayMergeStrategy.REPLACE
   */
  arrayMergeStrategy?: ArrayMergeStrategy;
  
  /**
   * Maximum depth for deep merging (to prevent issues with circular references)
   * @default 100
   */
  maxDepth?: number;
  
  /**
   * Whether to clone the source objects during merge to ensure complete immutability
   * @default false
   */
  clone?: boolean;
  
  /**
   * Custom merge function for specific object types or properties
   * Return undefined to use the default merge strategy
   */
  customMerge?: (key: string, target: any, source: any, options: MergeOptions) => any | undefined;
}

/**
 * Default merge options.
 */
const defaultMergeOptions: MergeOptions = {
  arrayMergeStrategy: ArrayMergeStrategy.REPLACE,
  maxDepth: 100,
  clone: false
};

/**
 * Merges arrays based on the specified strategy.
 * 
 * @template T - The type of array elements
 * @param {T[]} target - The target array
 * @param {T[]} source - The source array
 * @param {MergeOptions} options - Merge options
 * @param {number} depth - Current recursion depth
 * @returns {T[]} The merged array
 */
const mergeArrays = <T>(
  target: T[],
  source: T[],
  options: MergeOptions,
  depth: number
): T[] => {
  const { arrayMergeStrategy } = options;
  
  switch (arrayMergeStrategy) {
    case ArrayMergeStrategy.REPLACE:
      return options.clone ? [...source] : source;
      
    case ArrayMergeStrategy.COMBINE:
      // For primitive values, remove duplicates
      const targetSet = new Set(target);
      source.forEach(item => targetSet.add(item));
      return Array.from(targetSet);
      
    case ArrayMergeStrategy.APPEND:
      return [...target, ...source];
      
    case ArrayMergeStrategy.MERGE_BY_INDEX:
      const result = [...target];
      
      source.forEach((sourceItem, index) => {
        if (index < result.length) {
          // If both items at this index are objects, deep merge them
          if (isPlainObject(result[index]) && isPlainObject(sourceItem)) {
            result[index] = deepMergeInternal(
              result[index],
              sourceItem,
              options,
              depth + 1
            );
          } else {
            // Otherwise replace the target item with the source item
            result[index] = sourceItem;
          }
        } else {
          // If the source array is longer, append the remaining items
          result.push(sourceItem);
        }
      });
      
      return result;
      
    default:
      return options.clone ? [...source] : source;
  }
};

/**
 * Internal implementation of deep merge with depth tracking.
 * 
 * @template T - The type of the target object
 * @template S - The type of the source object
 * @param {T} target - The target object
 * @param {S} source - The source object
 * @param {MergeOptions} options - Merge options
 * @param {number} depth - Current recursion depth
 * @returns {T & S} The merged object
 */
const deepMergeInternal = <T extends Record<string, any>, S extends Record<string, any>>(
  target: T,
  source: S,
  options: MergeOptions,
  depth: number
): T & S => {
  // Prevent infinite recursion
  if (depth > (options.maxDepth || defaultMergeOptions.maxDepth!)) {
    throw new Error(`Maximum merge depth of ${options.maxDepth} exceeded. Possible circular reference.`);
  }
  
  const result: Record<string, any> = { ...target };
  
  for (const key in source) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) {
      continue;
    }
    
    // Apply custom merge function if provided
    if (options.customMerge) {
      const customResult = options.customMerge(key, target[key], source[key], options);
      if (customResult !== undefined) {
        result[key] = customResult;
        continue;
      }
    }
    
    // If the key doesn't exist in target, just assign the source value
    if (!(key in target)) {
      result[key] = options.clone && (isPlainObject(source[key]) || Array.isArray(source[key]))
        ? JSON.parse(JSON.stringify(source[key]))
        : source[key];
      continue;
    }
    
    // Handle arrays
    if (Array.isArray(target[key]) && Array.isArray(source[key])) {
      result[key] = mergeArrays(target[key], source[key], options, depth);
      continue;
    }
    
    // Handle nested objects
    if (isPlainObject(target[key]) && isPlainObject(source[key])) {
      result[key] = deepMergeInternal(
        target[key],
        source[key],
        options,
        depth + 1
      );
      continue;
    }
    
    // For all other cases, source value overwrites target value
    result[key] = source[key];
  }
  
  return result as T & S;
};

/**
 * Deeply merges multiple objects together, with later objects overriding properties from earlier ones.
 * Unlike the simple merge function, this performs a deep merge, recursively merging nested objects and
 * providing configurable strategies for handling arrays.
 * 
 * @template T - The type of the merged object
 * @param {MergeOptions} [options] - Options to configure merge behavior
 * @param {...Record<string, any>[]} objects - Objects to merge
 * @returns {T} A new object with deeply merged properties
 * @throws {Error} If any input is not an object or if maximum recursion depth is exceeded
 * 
 * @example
 * // Basic usage
 * const defaults = { theme: { colors: { primary: 'blue', secondary: 'gray' } }, fontSize: 12 };
 * const userPrefs = { theme: { colors: { primary: 'dark' } } };
 * const settings = deepMerge(defaults, userPrefs);
 * // { theme: { colors: { primary: 'dark', secondary: 'gray' } }, fontSize: 12 }
 * 
 * @example
 * // With array merge strategy
 * const baseConfig = { features: ['basic', 'advanced'], limits: { users: 5 } };
 * const extendedConfig = { features: ['premium'], limits: { storage: 100 } };
 * const config = deepMerge({ arrayMergeStrategy: ArrayMergeStrategy.APPEND }, baseConfig, extendedConfig);
 * // { features: ['basic', 'advanced', 'premium'], limits: { users: 5, storage: 100 } }
 */
export const deepMerge = <T extends Record<string, any>>(
  ...args: (Record<string, any> | MergeOptions)[]
): T => {
  // Extract options if provided as first argument
  let options: MergeOptions = { ...defaultMergeOptions };
  let objectsToMerge: Record<string, any>[] = [...args];
  
  if (args.length > 0 && !isPlainObject(args[0]) && typeof args[0] === 'object') {
    options = { ...defaultMergeOptions, ...args[0] };
    objectsToMerge = args.slice(1);
  }
  
  // Validate inputs
  if (objectsToMerge.length === 0) {
    return {} as T;
  }
  
  if (objectsToMerge.some(obj => obj === null || typeof obj !== 'object')) {
    throw new Error('All inputs must be non-null objects');
  }
  
  // Handle single object case
  if (objectsToMerge.length === 1) {
    return options.clone 
      ? JSON.parse(JSON.stringify(objectsToMerge[0])) 
      : { ...objectsToMerge[0] } as T;
  }
  
  // Merge all objects sequentially
  return objectsToMerge.reduce((result, obj) => {
    return deepMergeInternal(result, obj, options, 0);
  }, {}) as T;
};

/**
 * Deeply merges two objects together, with the source object overriding properties from the target.
 * This is a convenience function that calls deepMerge with exactly two objects.
 * 
 * @template T - The type of the target object
 * @template S - The type of the source object
 * @param {T} target - The target object
 * @param {S} source - The source object
 * @param {MergeOptions} [options] - Options to configure merge behavior
 * @returns {T & S} A new object with deeply merged properties
 * @throws {Error} If any input is not an object or if maximum recursion depth is exceeded
 * 
 * @example
 * const baseUser = { id: 1, profile: { name: 'John', settings: { theme: 'light' } } };
 * const updates = { profile: { settings: { theme: 'dark', fontSize: 14 } } };
 * const updatedUser = deepMergeObjects(baseUser, updates);
 * // { id: 1, profile: { name: 'John', settings: { theme: 'dark', fontSize: 14 } } }
 */
export const deepMergeObjects = <T extends Record<string, any>, S extends Record<string, any>>(
  target: T,
  source: S,
  options?: MergeOptions
): T & S => {
  // Validate inputs
  if (target === null || typeof target !== 'object') {
    throw new Error('Target must be a non-null object');
  }
  
  if (source === null || typeof source !== 'object') {
    throw new Error('Source must be a non-null object');
  }
  
  const mergeOptions = { ...defaultMergeOptions, ...options };
  return deepMergeInternal(target, source, mergeOptions, 0);
};
/**
 * Utility functions for deep object comparison and difference detection.
 * These utilities are crucial for change detection, equality testing, and diffing operations
 * across journey services.
 */

/**
 * Type representing the differences between two objects.
 * Each key represents a path to a property that differs, and the value is an object
 * containing the original and new values.
 */
export interface ObjectDifferences {
  [path: string]: {
    oldValue: any;
    newValue: any;
  };
}

/**
 * Options for controlling the behavior of comparison operations.
 */
export interface ComparisonOptions {
  /**
   * Whether to ignore undefined properties in the comparison.
   * If true, properties that are undefined in one object but not in the other
   * will not be considered different.
   * @default false
   */
  ignoreUndefined?: boolean;

  /**
   * Whether to perform strict equality checks for primitive values.
   * If true, uses === for comparison; if false, performs type coercion (==).
   * @default true
   */
  strict?: boolean;

  /**
   * Array of property paths to exclude from comparison.
   * Paths use dot notation, e.g., ['user.metadata', 'timestamps.created'].
   * @default []
   */
  excludePaths?: string[];
}

/**
 * Default comparison options.
 */
const defaultOptions: ComparisonOptions = {
  ignoreUndefined: false,
  strict: true,
  excludePaths: [],
};

/**
 * Checks if a value is a plain object (not an array, null, or a primitive).
 * 
 * @param value - The value to check
 * @returns True if the value is a plain object, false otherwise
 */
export const isPlainObject = (value: unknown): value is Record<string, any> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
};

/**
 * Checks if a path should be excluded from comparison based on the excludePaths option.
 * 
 * @param path - The current property path
 * @param excludePaths - Array of paths to exclude
 * @returns True if the path should be excluded, false otherwise
 */
const shouldExcludePath = (path: string, excludePaths: string[] = []): boolean => {
  if (!excludePaths.length) return false;
  
  return excludePaths.some(excludePath => {
    // Exact match
    if (path === excludePath) return true;
    
    // Path starts with exclude path followed by a dot
    if (path.startsWith(`${excludePath}.`)) return true;
    
    // Exclude path contains wildcards (e.g., 'users.*.metadata')
    if (excludePath.includes('*')) {
      const excludeRegex = new RegExp(
        `^${excludePath.replace(/\./g, '\\.').replace(/\*/g, '[^.]+')}`
      );
      return excludeRegex.test(path);
    }
    
    return false;
  });
};

/**
 * Performs a deep comparison between two values to determine if they are equivalent.
 * 
 * This function handles primitive values, arrays, and objects, performing a recursive
 * comparison for nested structures. It can be configured to ignore undefined properties,
 * use strict or loose equality, and exclude specific paths from comparison.
 * 
 * @param a - First value to compare
 * @param b - Second value to compare
 * @param options - Comparison options
 * @param path - Current property path (used internally for recursion)
 * @returns True if the values are equal according to the specified options, false otherwise
 * 
 * @example
 * // Basic comparison
 * isEqual({a: 1, b: 2}, {a: 1, b: 2}); // true
 * 
 * @example
 * // Nested objects
 * isEqual(
 *   {user: {name: 'John', age: 30}},
 *   {user: {name: 'John', age: 30}}
 * ); // true
 * 
 * @example
 * // With options
 * isEqual(
 *   {a: 1, b: undefined},
 *   {a: 1},
 *   {ignoreUndefined: true}
 * ); // true
 */
export const isEqual = (
  a: unknown,
  b: unknown,
  options: ComparisonOptions = {},
  path: string = ''
): boolean => {
  const opts = { ...defaultOptions, ...options };
  
  // Check if current path should be excluded
  if (path && shouldExcludePath(path, opts.excludePaths)) {
    return true;
  }
  
  // Handle strict equality for primitives, null, and undefined
  if (a === b) return true;
  
  // If either value is null or undefined, they're not equal (we already checked strict equality)
  if (a == null || b == null) return false;
  
  // Handle non-strict equality if specified
  if (!opts.strict && a == b) return true;
  
  // Handle different types
  if (typeof a !== typeof b) return false;
  
  // Handle dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  
  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    
    for (let i = 0; i < a.length; i++) {
      const itemPath = path ? `${path}[${i}]` : `[${i}]`;
      if (!isEqual(a[i], b[i], opts, itemPath)) return false;
    }
    
    return true;
  }
  
  // Handle plain objects
  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    // If ignoring undefined, filter out keys with undefined values
    const filteredKeysA = opts.ignoreUndefined
      ? keysA.filter(key => a[key] !== undefined)
      : keysA;
    
    const filteredKeysB = opts.ignoreUndefined
      ? keysB.filter(key => b[key] !== undefined)
      : keysB;
    
    // Check if the filtered key sets are different
    if (filteredKeysA.length !== filteredKeysB.length) return false;
    
    // Check if all keys in A exist in B
    if (!filteredKeysA.every(key => filteredKeysB.includes(key))) return false;
    
    // Check each property recursively
    for (const key of filteredKeysA) {
      const propPath = path ? `${path}.${key}` : key;
      if (!isEqual(a[key], b[key], opts, propPath)) return false;
    }
    
    return true;
  }
  
  // For all other types, they're not equal
  return false;
};

/**
 * Gets the differences between two objects, returning a map of property paths to
 * their old and new values.
 * 
 * This function performs a deep comparison and tracks all differences between the objects.
 * It handles nested structures and can be configured with the same options as isEqual.
 * 
 * @param oldObj - The original object
 * @param newObj - The new object to compare against
 * @param options - Comparison options
 * @returns An object mapping property paths to their differences
 * 
 * @example
 * // Basic usage
 * const differences = getDifferences(
 *   {name: 'John', age: 30},
 *   {name: 'John', age: 31}
 * );
 * // Result: {'age': {oldValue: 30, newValue: 31}}
 * 
 * @example
 * // Nested objects
 * const differences = getDifferences(
 *   {user: {name: 'John', contact: {email: 'john@example.com'}}},
 *   {user: {name: 'John', contact: {email: 'john.doe@example.com'}}}
 * );
 * // Result: {'user.contact.email': {oldValue: 'john@example.com', newValue: 'john.doe@example.com'}}
 */
export const getDifferences = (
  oldObj: Record<string, any>,
  newObj: Record<string, any>,
  options: ComparisonOptions = {}
): ObjectDifferences => {
  const opts = { ...defaultOptions, ...options };
  const differences: ObjectDifferences = {};
  
  // Helper function to collect differences recursively
  const collectDifferences = (
    oldValue: any,
    newValue: any,
    path: string = ''
  ): void => {
    // Skip excluded paths
    if (path && shouldExcludePath(path, opts.excludePaths)) {
      return;
    }
    
    // If values are equal, no difference to record
    if (isEqual(oldValue, newValue, opts, path)) {
      return;
    }
    
    // Handle different types or non-objects
    if (
      typeof oldValue !== typeof newValue ||
      oldValue === null ||
      newValue === null ||
      typeof oldValue !== 'object' ||
      typeof newValue !== 'object' ||
      Array.isArray(oldValue) !== Array.isArray(newValue)
    ) {
      differences[path] = { oldValue, newValue };
      return;
    }
    
    // Handle arrays
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      if (oldValue.length !== newValue.length) {
        differences[path] = { oldValue, newValue };
        return;
      }
      
      // Check array items
      for (let i = 0; i < oldValue.length; i++) {
        const itemPath = path ? `${path}[${i}]` : `[${i}]`;
        collectDifferences(oldValue[i], newValue[i], itemPath);
      }
      
      return;
    }
    
    // Handle objects
    if (isPlainObject(oldValue) && isPlainObject(newValue)) {
      // Get all unique keys from both objects
      const allKeys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);
      
      for (const key of allKeys) {
        // Skip undefined values if ignoreUndefined is true
        if (
          opts.ignoreUndefined &&
          (oldValue[key] === undefined || newValue[key] === undefined)
        ) {
          continue;
        }
        
        const propPath = path ? `${path}.${key}` : key;
        
        // Handle keys that exist in only one object
        if (!(key in oldValue)) {
          differences[propPath] = { oldValue: undefined, newValue: newValue[key] };
        } else if (!(key in newValue)) {
          differences[propPath] = { oldValue: oldValue[key], newValue: undefined };
        } else {
          // Recursively check nested properties
          collectDifferences(oldValue[key], newValue[key], propPath);
        }
      }
    }
  };
  
  collectDifferences(oldObj, newObj);
  return differences;
};

/**
 * Checks if an object has any differences compared to another object.
 * This is a more efficient version of getDifferences when you only need to know
 * if there are any differences, but don't need the specific differences.
 * 
 * @param oldObj - The original object
 * @param newObj - The new object to compare against
 * @param options - Comparison options
 * @returns True if there are any differences, false otherwise
 * 
 * @example
 * // Basic usage
 * const hasDifferences = hasDifferences(
 *   {name: 'John', age: 30},
 *   {name: 'John', age: 31}
 * ); // true
 */
export const hasDifferences = (
  oldObj: Record<string, any>,
  newObj: Record<string, any>,
  options: ComparisonOptions = {}
): boolean => {
  return !isEqual(oldObj, newObj, options);
};

/**
 * Type guard that checks if two objects are equal.
 * This is useful for narrowing types after a comparison.
 * 
 * @param a - First value to compare
 * @param b - Second value to compare
 * @param options - Comparison options
 * @returns Type predicate indicating if the objects are equal
 * 
 * @example
 * const obj1 = {id: 1, name: 'Test'};
 * const obj2 = {id: 1, name: 'Test'};
 * 
 * if (objectsAreEqual(obj1, obj2)) {
 *   // TypeScript knows obj1 and obj2 are equal here
 *   console.log('Objects are equal');
 * }
 */
export function objectsAreEqual<T, U>(
  a: T,
  b: U,
  options: ComparisonOptions = {}
): b is T & U {
  return isEqual(a, b, options);
};
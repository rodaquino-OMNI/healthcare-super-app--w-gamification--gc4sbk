/**
 * Object cloning utilities for creating deep copies of objects.
 * These utilities ensure immutable operations across the application by providing
 * true copies of complex nested objects without reference sharing.
 */

/**
 * Creates a deep clone of an object, creating new instances of nested objects and arrays.
 * This function handles circular references and a wide range of object types.
 * 
 * @template T - The type of the object to clone
 * @param {T} value - The value to clone
 * @returns {T} A deep clone of the input value
 * 
 * @example
 * const original = { user: { name: 'John', scores: [10, 20] } };
 * const clone = deepClone(original); // Creates a completely new object with the same structure and values
 * 
 * // Handles circular references
 * const circular = { name: 'Circular' };
 * circular.self = circular;
 * const clonedCircular = deepClone(circular); // Properly clones with the circular reference preserved
 */
export function deepClone<T>(value: T): T {
  // Handle null, undefined, and primitive types
  if (value === null || value === undefined || typeof value !== 'object') {
    return value;
  }

  // Use a WeakMap to track objects we've already cloned to handle circular references
  const cloneMap = new WeakMap<object, any>();
  
  function cloneInternal(item: any): any {
    // Handle null, undefined, and primitive types
    if (item === null || item === undefined || typeof item !== 'object') {
      return item;
    }
    
    // Check if we've already cloned this object (circular reference)
    if (cloneMap.has(item)) {
      return cloneMap.get(item);
    }
    
    // Handle Date objects
    if (item instanceof Date) {
      return new Date(item.getTime());
    }
    
    // Handle RegExp objects
    if (item instanceof RegExp) {
      return new RegExp(item.source, item.flags);
    }
    
    // Handle Map objects
    if (item instanceof Map) {
      const mapClone = new Map();
      cloneMap.set(item, mapClone);
      item.forEach((value, key) => {
        mapClone.set(cloneInternal(key), cloneInternal(value));
      });
      return mapClone;
    }
    
    // Handle Set objects
    if (item instanceof Set) {
      const setClone = new Set();
      cloneMap.set(item, setClone);
      item.forEach(value => {
        setClone.add(cloneInternal(value));
      });
      return setClone;
    }
    
    // Handle Array objects
    if (Array.isArray(item)) {
      const arrClone: any[] = [];
      cloneMap.set(item, arrClone);
      item.forEach((value, index) => {
        arrClone[index] = cloneInternal(value);
      });
      return arrClone;
    }
    
    // Handle plain objects (including those with custom prototypes)
    const objClone = Object.create(Object.getPrototypeOf(item));
    cloneMap.set(item, objClone);
    
    // Clone all enumerable properties
    Object.entries(item).forEach(([key, value]) => {
      objClone[key] = cloneInternal(value);
    });
    
    return objClone;
  }
  
  return cloneInternal(value);
}

/**
 * Creates a deep clone of an object using the native structuredClone API when available,
 * or falls back to a custom implementation for older environments.
 * 
 * The native structuredClone API can handle a wider range of built-in objects and
 * circular references, but has limitations with functions and DOM nodes.
 * 
 * @template T - The type of the object to clone
 * @param {T} value - The value to clone
 * @returns {T} A deep clone of the input value
 * @throws {Error} If the value contains types that cannot be cloned (e.g., functions, symbols)
 * 
 * @example
 * const original = { user: { name: 'John', scores: [10, 20], lastLogin: new Date() } };
 * const clone = structuredClone(original); // Creates a completely new object with the same structure and values
 */
export function structuredClone<T>(value: T): T {
  // Use native structuredClone if available (modern browsers and Node.js 17+)
  if (typeof globalThis.structuredClone === 'function') {
    try {
      return globalThis.structuredClone(value);
    } catch (error) {
      // If native structuredClone fails (e.g., with functions), fall back to custom implementation
      if (error instanceof TypeError && /function|symbol/.test(error.message)) {
        throw new Error(
          `Cannot clone value containing functions or symbols. ${error.message}`
        );
      }
      // For other errors, continue to fallback implementation
    }
  }
  
  // Fallback implementation for environments without native structuredClone
  try {
    // First try using JSON parse/stringify for simple objects (fastest method)
    // This won't work for circular references, dates will be strings, and some types will be lost
    if (
      value === null ||
      value === undefined ||
      typeof value === 'number' ||
      typeof value === 'string' ||
      typeof value === 'boolean'
    ) {
      return value;
    }
    
    // Check if the object is a plain object or array without circular references or special types
    const isSimpleObject = (() => {
      try {
        JSON.stringify(value);
        return true;
      } catch {
        return false;
      }
    })();
    
    if (isSimpleObject) {
      return JSON.parse(JSON.stringify(value));
    }
    
    // For complex objects, use our custom deepClone implementation
    return deepClone(value);
  } catch (error) {
    throw new Error(`Failed to clone object: ${error instanceof Error ? error.message : String(error)}`);
  }
}
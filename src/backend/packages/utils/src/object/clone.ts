/**
 * Utility functions for deep cloning objects that ensure immutable operations across the application.
 * These utilities create true copies of complex nested objects without reference sharing,
 * preventing unintended side effects when objects are passed between components and services.
 */

/**
 * Type guard to check if a value is a plain object (not null, not an array, not a built-in object type)
 * 
 * @param value - The value to check
 * @returns True if the value is a plain object, false otherwise
 */
const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
};

/**
 * Creates a deep clone of an object using a recursive approach with circular reference detection.
 * This function handles various types including objects, arrays, dates, regular expressions, and primitive values.
 * 
 * @template T - The type of the value to clone
 * @param {T} value - The value to clone
 * @param {WeakMap<object, unknown>} [refs=new WeakMap()] - WeakMap used for circular reference detection (used internally for recursion)
 * @returns {T} A deep clone of the input value
 * @throws {Error} If the input contains unsupported types or if a circular reference is detected and can't be resolved
 * 
 * @example
 * // Returns a deep clone of a nested object
 * const original = { user: { name: 'John', scores: [10, 20, 30] } };
 * const clone = deepClone(original);
 * clone.user.name = 'Jane'; // Doesn't affect original.user.name
 * clone.user.scores.push(40); // Doesn't affect original.user.scores
 */
export const deepClone = <T>(value: T, refs: WeakMap<object, unknown> = new WeakMap()): T => {
  // Handle null or undefined
  if (value === null || value === undefined) {
    return value;
  }

  // Handle primitive types (string, number, boolean, symbol, bigint)
  if (typeof value !== 'object') {
    return value;
  }

  // Handle Date objects
  if (value instanceof Date) {
    return new Date(value.getTime()) as unknown as T;
  }

  // Handle RegExp objects
  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as unknown as T;
  }

  // Handle Map objects
  if (value instanceof Map) {
    const clonedMap = new Map();
    const originalMap = value as Map<unknown, unknown>;

    // Check for circular references
    if (refs.has(value as object)) {
      return refs.get(value as object) as T;
    }
    refs.set(value as object, clonedMap);

    originalMap.forEach((val, key) => {
      clonedMap.set(
        deepClone(key, refs),
        deepClone(val, refs)
      );
    });

    return clonedMap as unknown as T;
  }

  // Handle Set objects
  if (value instanceof Set) {
    const clonedSet = new Set();
    const originalSet = value as Set<unknown>;

    // Check for circular references
    if (refs.has(value as object)) {
      return refs.get(value as object) as T;
    }
    refs.set(value as object, clonedSet);

    originalSet.forEach((val) => {
      clonedSet.add(deepClone(val, refs));
    });

    return clonedSet as unknown as T;
  }

  // Handle Arrays
  if (Array.isArray(value)) {
    // Check for circular references
    if (refs.has(value)) {
      return refs.get(value) as T;
    }

    const clonedArray: unknown[] = [];
    refs.set(value, clonedArray);

    for (let i = 0; i < value.length; i++) {
      clonedArray[i] = deepClone(value[i], refs);
    }

    return clonedArray as unknown as T;
  }

  // Handle plain objects
  if (isPlainObject(value)) {
    // Check for circular references
    if (refs.has(value)) {
      return refs.get(value) as T;
    }

    const clonedObj: Record<string, unknown> = {};
    refs.set(value, clonedObj);

    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        clonedObj[key] = deepClone((value as Record<string, unknown>)[key], refs);
      }
    }

    return clonedObj as unknown as T;
  }

  // Handle other types that can be safely copied by reference
  // (e.g., functions, DOM nodes, class instances)
  try {
    // For class instances, try to use the constructor if available
    const constructor = (value as object).constructor;
    if (typeof constructor === 'function' && constructor !== Object) {
      return new constructor(value) as unknown as T;
    }
  } catch (error) {
    // If constructor approach fails, fall back to returning the original
    // This is safer than throwing an error for unsupported types
    console.warn(`Could not clone value of type ${(value as object).constructor.name}. Returning reference.`);
  }

  // For unsupported types, return the original (reference)
  return value;
};

/**
 * Creates a deep clone of an object using the native structuredClone API when available,
 * with a fallback to the custom deepClone implementation.
 * 
 * The native structuredClone provides better performance and handles more types,
 * but may not be available in all environments (particularly older browsers).
 * 
 * @template T - The type of the value to clone
 * @param {T} value - The value to clone
 * @returns {T} A deep clone of the input value
 * @throws {Error} If the input contains unsupported types or if a circular reference is detected and can't be resolved
 * 
 * @example
 * // Returns a deep clone using the most efficient available method
 * const original = { user: { name: 'John', metadata: new Map() } };
 * const clone = safeStructuredClone(original);
 */
export const safeStructuredClone = <T>(value: T): T => {
  // Use native structuredClone if available (modern browsers and Node.js 17+)
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch (error) {
      // Fall back to custom implementation if structuredClone fails
      // (e.g., for unsupported types like functions)
      console.warn('Native structuredClone failed, falling back to custom implementation:', error);
      return deepClone(value);
    }
  }

  // Fall back to custom implementation if structuredClone is not available
  return deepClone(value);
};

/**
 * Creates a shallow clone of an object, copying only the top-level properties.
 * This is faster than deep cloning but doesn't create independent copies of nested objects.
 * 
 * @template T - The type of the object to clone
 * @param {T} obj - The object to clone
 * @returns {T} A shallow clone of the input object
 * @throws {Error} If the input is not an object
 * 
 * @example
 * // Returns a shallow clone of an object
 * const original = { name: 'John', scores: [10, 20, 30] };
 * const clone = shallowClone(original);
 * clone.name = 'Jane'; // Doesn't affect original.name
 * clone.scores.push(40); // DOES affect original.scores because it's a reference
 */
export const shallowClone = <T extends object>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    throw new Error('Input must be an object');
  }

  if (Array.isArray(obj)) {
    return [...obj] as unknown as T;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as unknown as T;
  }

  if (obj instanceof Map) {
    return new Map(obj) as unknown as T;
  }

  if (obj instanceof Set) {
    return new Set(obj) as unknown as T;
  }

  // For plain objects, use Object.assign for shallow copy
  return Object.assign({}, obj);
};

/**
 * Creates a clone of an object with a specified depth of cloning.
 * This allows for more control over how deep the cloning operation should go.
 * 
 * @template T - The type of the value to clone
 * @param {T} value - The value to clone
 * @param {number} [depth=Infinity] - The maximum depth to clone (0 = shallow clone, Infinity = deep clone)
 * @param {WeakMap<object, unknown>} [refs=new WeakMap()] - WeakMap used for circular reference detection (used internally for recursion)
 * @returns {T} A clone of the input value with the specified depth
 * @throws {Error} If the input contains unsupported types or if a circular reference is detected and can't be resolved
 * 
 * @example
 * // Clone an object with nested properties up to 2 levels deep
 * const original = { 
 *   user: { 
 *     name: 'John', 
 *     address: { city: 'New York', zip: '10001' } 
 *   } 
 * };
 * const clone = cloneWithDepth(original, 2);
 * // Changes to clone.user.name won't affect original
 * // Changes to clone.user.address.city WILL affect original because it's beyond the clone depth
 */
export const cloneWithDepth = <T>(
  value: T,
  depth: number = Infinity,
  refs: WeakMap<object, unknown> = new WeakMap()
): T => {
  // Handle null, undefined, or primitive types
  if (value === null || value === undefined || typeof value !== 'object') {
    return value;
  }

  // If we've reached the maximum depth, return a shallow clone
  if (depth <= 0) {
    if (Array.isArray(value)) {
      return [...value] as unknown as T;
    }
    if (isPlainObject(value)) {
      return { ...value } as unknown as T;
    }
    // For other object types at depth 0, use appropriate shallow clone
    return shallowClone(value as object) as T;
  }

  // For deeper cloning, use the same approach as deepClone but with depth control
  // Handle Date objects
  if (value instanceof Date) {
    return new Date(value.getTime()) as unknown as T;
  }

  // Handle RegExp objects
  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as unknown as T;
  }

  // Handle Map objects
  if (value instanceof Map) {
    const clonedMap = new Map();
    const originalMap = value as Map<unknown, unknown>;

    // Check for circular references
    if (refs.has(value as object)) {
      return refs.get(value as object) as T;
    }
    refs.set(value as object, clonedMap);

    originalMap.forEach((val, key) => {
      clonedMap.set(
        cloneWithDepth(key, depth - 1, refs),
        cloneWithDepth(val, depth - 1, refs)
      );
    });

    return clonedMap as unknown as T;
  }

  // Handle Set objects
  if (value instanceof Set) {
    const clonedSet = new Set();
    const originalSet = value as Set<unknown>;

    // Check for circular references
    if (refs.has(value as object)) {
      return refs.get(value as object) as T;
    }
    refs.set(value as object, clonedSet);

    originalSet.forEach((val) => {
      clonedSet.add(cloneWithDepth(val, depth - 1, refs));
    });

    return clonedSet as unknown as T;
  }

  // Handle Arrays
  if (Array.isArray(value)) {
    // Check for circular references
    if (refs.has(value)) {
      return refs.get(value) as T;
    }

    const clonedArray: unknown[] = [];
    refs.set(value, clonedArray);

    for (let i = 0; i < value.length; i++) {
      clonedArray[i] = cloneWithDepth(value[i], depth - 1, refs);
    }

    return clonedArray as unknown as T;
  }

  // Handle plain objects
  if (isPlainObject(value)) {
    // Check for circular references
    if (refs.has(value)) {
      return refs.get(value) as T;
    }

    const clonedObj: Record<string, unknown> = {};
    refs.set(value, clonedObj);

    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        clonedObj[key] = cloneWithDepth((value as Record<string, unknown>)[key], depth - 1, refs);
      }
    }

    return clonedObj as unknown as T;
  }

  // For other types, use the same approach as deepClone
  try {
    const constructor = (value as object).constructor;
    if (typeof constructor === 'function' && constructor !== Object) {
      return new constructor(value) as unknown as T;
    }
  } catch (error) {
    console.warn(`Could not clone value of type ${(value as object).constructor.name}. Returning reference.`);
  }

  return value;
};
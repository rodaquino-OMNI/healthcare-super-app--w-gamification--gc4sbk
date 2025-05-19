/**
 * Utility functions for transforming arrays into different data structures.
 * These functions are essential for reshaping data across all journey services,
 * particularly for normalizing health metrics data, preparing care provider information
 * for display, transforming plan coverage details, and processing gamification events.
 */

/**
 * Recursively flattens an array of nested arrays to a single-level array.
 * 
 * @template T - The type of elements in the array
 * @param {Array<T | Array<T>>} arr - The array to flatten, which may contain nested arrays
 * @returns {T[]} A new array with all nested arrays flattened
 * @throws {Error} If the input is not an array
 * 
 * @example
 * // Returns [1, 2, 3, 4, 5, 6]
 * flattenDeep([1, [2, [3, 4], 5], 6]);
 */
export const flattenDeep = <T>(arr: Array<T | any[]>): T[] => {
  if (!Array.isArray(arr)) {
    throw new Error('Input must be an array');
  }

  return arr.reduce<T[]>((result, item) => {
    if (Array.isArray(item)) {
      // Recursively flatten nested arrays and concatenate with the result
      return result.concat(flattenDeep(item));
    } else {
      // Add non-array items directly to the result
      return result.concat(item as T);
    }
  }, []);
};

/**
 * Transforms an array of objects into a key-value object using a specified key and optional value mapper.
 * 
 * @template T - The type of objects in the input array
 * @template K - The type of keys in the resulting object
 * @template V - The type of values in the resulting object
 * @param {T[]} arr - The array of objects to transform
 * @param {(item: T) => K} keyFn - Function to extract the key from each object
 * @param {(item: T) => V} [valueFn] - Optional function to transform each object into a value
 *                                     If not provided, the original object is used as the value
 * @returns {Record<K & (string | number | symbol), V>} An object mapping keys to values
 * @throws {Error} If the input is not an array or if keyFn is not a function
 * 
 * @example
 * // Returns { '1': { id: 1, name: 'Alice' }, '2': { id: 2, name: 'Bob' } }
 * mapByKey([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }], item => item.id);
 * 
 * // Returns { '1': 'Alice', '2': 'Bob' }
 * mapByKey([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }], item => item.id, item => item.name);
 */
export const mapByKey = <T, K extends string | number | symbol, V = T>(
  arr: T[],
  keyFn: (item: T) => K,
  valueFn?: (item: T) => V
): Record<K, V> => {
  if (!Array.isArray(arr)) {
    throw new Error('Input must be an array');
  }

  if (typeof keyFn !== 'function') {
    throw new Error('Key function must be a function');
  }

  return arr.reduce<Record<K, V>>((result, item) => {
    const key = keyFn(item);
    const value = valueFn ? valueFn(item) : item as unknown as V;
    result[key] = value;
    return result;
  }, {} as Record<K, V>);
};

/**
 * Creates a lookup object from an array of objects, using a specified property or function to generate keys.
 * Optimized for fast access by key, useful for large datasets that need frequent lookups.
 * 
 * @template T - The type of objects in the input array
 * @template K - The type of the key to index by (string, number, or symbol)
 * @param {T[]} arr - The array of objects to index
 * @param {keyof T | ((item: T) => K)} keySelector - Property name or function to extract the key
 * @returns {Record<string | number | symbol, T>} An object mapping keys to the original objects
 * @throws {Error} If the input is not an array or if keySelector is invalid
 * 
 * @example
 * // Returns { '1': { id: 1, name: 'Alice' }, '2': { id: 2, name: 'Bob' } }
 * indexBy([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }], 'id');
 * 
 * // Returns { 'alice': { id: 1, name: 'Alice' }, 'bob': { id: 2, name: 'Bob' } }
 * indexBy([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }], item => item.name.toLowerCase());
 */
export const indexBy = <T, K extends string | number | symbol>(
  arr: T[],
  keySelector: keyof T | ((item: T) => K)
): Record<string | number | symbol, T> => {
  if (!Array.isArray(arr)) {
    throw new Error('Input must be an array');
  }

  if (typeof keySelector !== 'string' && typeof keySelector !== 'number' && typeof keySelector !== 'symbol' && typeof keySelector !== 'function') {
    throw new Error('Key selector must be a property name or a function');
  }

  return arr.reduce<Record<string | number | symbol, T>>((result, item) => {
    const key = typeof keySelector === 'function'
      ? keySelector(item)
      : item[keySelector] as unknown as string | number | symbol;
    
    if (key === undefined || key === null) {
      throw new Error(`Key selector returned undefined or null for item: ${JSON.stringify(item)}`);
    }
    
    result[key] = item;
    return result;
  }, {});
};

/**
 * Extracts a specific property from each object in an array.
 * 
 * @template T - The type of objects in the input array
 * @template K - The type of the property to extract
 * @param {T[]} arr - The array of objects to process
 * @param {keyof T} property - The name of the property to extract from each object
 * @returns {Array<T[K]>} An array containing the specified property from each object
 * @throws {Error} If the input is not an array or if property is invalid
 * 
 * @example
 * // Returns ['Alice', 'Bob']
 * pluck([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }], 'name');
 * 
 * // Returns [1, 2]
 * pluck([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }], 'id');
 */
export const pluck = <T, K extends keyof T>(
  arr: T[],
  property: K
): Array<T[K]> => {
  if (!Array.isArray(arr)) {
    throw new Error('Input must be an array');
  }

  if (property === undefined || property === null) {
    throw new Error('Property must be specified');
  }

  return arr.map(item => {
    if (typeof item !== 'object' || item === null) {
      throw new Error(`Expected object but got ${typeof item}`);
    }
    
    return item[property];
  });
};

/**
 * Transforms an array into a nested object based on a hierarchy of keys.
 * Useful for creating tree structures from flat data.
 * 
 * @template T - The type of objects in the input array
 * @param {T[]} arr - The array of objects to transform
 * @param {Array<keyof T | ((item: T) => string | number)>} keys - Array of property names or functions to extract keys for each level
 * @returns {Record<string | number, any>} A nested object representing the hierarchy
 * @throws {Error} If the input is not an array or if keys is not an array
 * 
 * @example
 * // Returns { 'health': { 'metrics': { 'heart_rate': [...], 'steps': [...] } } }
 * nestByKeys(
 *   [
 *     { journey: 'health', category: 'metrics', type: 'heart_rate', value: 75 },
 *     { journey: 'health', category: 'metrics', type: 'steps', value: 10000 }
 *   ],
 *   ['journey', 'category', 'type']
 * );
 */
export const nestByKeys = <T>(
  arr: T[],
  keys: Array<keyof T | ((item: T) => string | number)>
): Record<string | number, any> => {
  if (!Array.isArray(arr)) {
    throw new Error('Input must be an array');
  }

  if (!Array.isArray(keys) || keys.length === 0) {
    throw new Error('Keys must be a non-empty array');
  }

  const result: Record<string | number, any> = {};

  arr.forEach(item => {
    let current = result;
    
    // Process all keys except the last one to build the nested structure
    for (let i = 0; i < keys.length - 1; i++) {
      const keySelector = keys[i];
      const key = typeof keySelector === 'function'
        ? keySelector(item)
        : item[keySelector] as unknown as string | number;
      
      if (key === undefined || key === null) {
        throw new Error(`Key selector at index ${i} returned undefined or null for item: ${JSON.stringify(item)}`);
      }
      
      current[key] = current[key] || {};
      current = current[key];
    }
    
    // Process the last key to store the item
    const lastKeySelector = keys[keys.length - 1];
    const lastKey = typeof lastKeySelector === 'function'
      ? lastKeySelector(item)
      : item[lastKeySelector] as unknown as string | number;
    
    if (lastKey === undefined || lastKey === null) {
      throw new Error(`Last key selector returned undefined or null for item: ${JSON.stringify(item)}`);
    }
    
    // If the key already exists, convert it to an array or add to existing array
    if (current[lastKey]) {
      if (Array.isArray(current[lastKey])) {
        current[lastKey].push(item);
      } else {
        current[lastKey] = [current[lastKey], item];
      }
    } else {
      current[lastKey] = item;
    }
  });

  return result;
};
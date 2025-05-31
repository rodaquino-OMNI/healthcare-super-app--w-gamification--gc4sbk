/**
 * Object transformation utilities for data mapping, filtering, and restructuring.
 * These utilities are used across journey services to standardize common object manipulations
 * while maintaining immutability.
 */

/**
 * Picks specified properties from an object and returns a new object with only those properties.
 * 
 * @template T - The type of the source object
 * @template K - The type of the keys to pick (must be keys of T)
 * @param {T} obj - The source object
 * @param {K[]} keys - Array of keys to pick from the object
 * @returns {Pick<T, K>} A new object containing only the picked properties
 * @throws {Error} If the input is not an object or keys is not an array
 * 
 * @example
 * const user = { id: 1, name: 'John', email: 'john@example.com', role: 'admin' };
 * const userBasic = pick(user, ['id', 'name']); // { id: 1, name: 'John' }
 */
export const pick = <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    throw new Error('Input must be a non-null object');
  }
  
  if (!Array.isArray(keys)) {
    throw new Error('Keys must be an array');
  }

  return keys.reduce((result, key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
    return result;
  }, {} as Pick<T, K>);
};

/**
 * Omits specified properties from an object and returns a new object without those properties.
 * 
 * @template T - The type of the source object
 * @template K - The type of the keys to omit (must be keys of T)
 * @param {T} obj - The source object
 * @param {K[]} keys - Array of keys to omit from the object
 * @returns {Omit<T, K>} A new object containing all properties except the omitted ones
 * @throws {Error} If the input is not an object or keys is not an array
 * 
 * @example
 * const user = { id: 1, name: 'John', email: 'john@example.com', password: 'secret' };
 * const safeUser = omit(user, ['password']); // { id: 1, name: 'John', email: 'john@example.com' }
 */
export const omit = <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    throw new Error('Input must be a non-null object');
  }
  
  if (!Array.isArray(keys)) {
    throw new Error('Keys must be an array');
  }

  const keysSet = new Set(keys);
  return Object.entries(obj).reduce((result, [key, value]) => {
    if (!keysSet.has(key as K)) {
      result[key as keyof Omit<T, K>] = value as any;
    }
    return result;
  }, {} as Omit<T, K>);
};

/**
 * Maps the values of an object using a transformation function while keeping the same keys.
 * 
 * @template T - The type of the source object
 * @template R - The type of the transformed values
 * @param {T} obj - The source object
 * @param {(value: T[keyof T], key: string, obj: T) => R} fn - Transformation function applied to each value
 * @returns {Record<keyof T, R>} A new object with the same keys but transformed values
 * @throws {Error} If the input is not an object or fn is not a function
 * 
 * @example
 * const prices = { apple: 1.25, banana: 0.75, orange: 1.00 };
 * const discountedPrices = mapValues(prices, price => price * 0.9); // { apple: 1.125, banana: 0.675, orange: 0.9 }
 */
export const mapValues = <T extends object, R>(
  obj: T,
  fn: (value: T[keyof T], key: string, obj: T) => R
): Record<keyof T, R> => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    throw new Error('Input must be a non-null object');
  }
  
  if (typeof fn !== 'function') {
    throw new Error('Transformation function must be provided');
  }

  return Object.entries(obj).reduce((result, [key, value]) => {
    result[key as keyof T] = fn(value as T[keyof T], key, obj);
    return result;
  }, {} as Record<keyof T, R>);
};

/**
 * Filters an object by its keys based on a predicate function.
 * 
 * @template T - The type of the source object
 * @param {T} obj - The source object
 * @param {(key: string, value: T[keyof T], obj: T) => boolean} predicate - Function to test each key-value pair
 * @returns {Partial<T>} A new object containing only the key-value pairs that passed the test
 * @throws {Error} If the input is not an object or predicate is not a function
 * 
 * @example
 * const data = { name: 'John', age: 30, email: '', phone: null };
 * const nonEmptyData = filterKeys(data, (_, value) => value !== '' && value !== null); // { name: 'John', age: 30 }
 */
export const filterKeys = <T extends object>(
  obj: T,
  predicate: (key: string, value: T[keyof T], obj: T) => boolean
): Partial<T> => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    throw new Error('Input must be a non-null object');
  }
  
  if (typeof predicate !== 'function') {
    throw new Error('Predicate function must be provided');
  }

  return Object.entries(obj).reduce((result, [key, value]) => {
    if (predicate(key, value as T[keyof T], obj)) {
      result[key as keyof T] = value as T[keyof T];
    }
    return result;
  }, {} as Partial<T>);
};

/**
 * Creates a deep clone of an object, creating new instances of nested objects and arrays.
 * 
 * @template T - The type of the object to clone
 * @param {T} obj - The object to clone
 * @returns {T} A deep clone of the input object
 * @throws {Error} If the input cannot be cloned (e.g., contains functions, symbols, etc.)
 * 
 * @example
 * const original = { user: { name: 'John', scores: [10, 20] } };
 * const clone = deepClone(original); // Creates a completely new object with the same structure and values
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle primitive types
  if (typeof obj !== 'object') {
    return obj;
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  // Handle Array objects
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }

  // Handle plain objects
  if (Object.getPrototypeOf(obj) === Object.prototype) {
    const result = {} as Record<string, any>;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = deepClone((obj as Record<string, any>)[key]);
      }
    }
    return result as T;
  }

  throw new Error(`Cannot clone object of type ${Object.prototype.toString.call(obj)}`);
};

/**
 * Merges multiple objects together, with later objects overriding properties from earlier ones.
 * Only performs a shallow merge at each level.
 * 
 * @template T - The type of the merged object
 * @param {...object[]} objects - Objects to merge
 * @returns {T} A new object with merged properties
 * @throws {Error} If any input is not an object
 * 
 * @example
 * const defaults = { theme: 'light', fontSize: 12 };
 * const userPrefs = { theme: 'dark' };
 * const settings = merge(defaults, userPrefs); // { theme: 'dark', fontSize: 12 }
 */
export const merge = <T extends object>(...objects: object[]): T => {
  if (objects.some(obj => obj === null || typeof obj !== 'object')) {
    throw new Error('All inputs must be non-null objects');
  }

  return objects.reduce((result, obj) => {
    return { ...result, ...obj };
  }, {}) as T;
};

/**
 * Groups an array of items by a key or a function that returns a key.
 * 
 * @template T - The type of items in the array
 * @template K - The type of the grouping key
 * @param {T[]} array - The array to group
 * @param {((item: T) => K) | keyof T} keyOrFn - Property name or function to get the grouping key
 * @returns {Record<string, T[]>} An object with keys as group names and values as arrays of items
 * @throws {Error} If the input is not an array
 * 
 * @example
 * const users = [
 *   { id: 1, role: 'admin', name: 'John' },
 *   { id: 2, role: 'user', name: 'Jane' },
 *   { id: 3, role: 'admin', name: 'Mike' }
 * ];
 * const usersByRole = groupBy(users, 'role');
 * // { admin: [{ id: 1, role: 'admin', name: 'John' }, { id: 3, role: 'admin', name: 'Mike' }], 
 * //   user: [{ id: 2, role: 'user', name: 'Jane' }] }
 */
export const groupBy = <T, K extends string | number | symbol>(
  array: T[],
  keyOrFn: ((item: T) => K) | keyof T
): Record<string, T[]> => {
  if (!Array.isArray(array)) {
    throw new Error('Input must be an array');
  }

  const getKey = typeof keyOrFn === 'function'
    ? keyOrFn as (item: T) => K
    : (item: T) => item[keyOrFn as keyof T] as unknown as K;

  return array.reduce((result, item) => {
    const key = String(getKey(item));
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

/**
 * Flattens a nested object structure into a single-level object with dot-notation keys.
 * 
 * @template T - The type of the nested object
 * @param {T} obj - The nested object to flatten
 * @param {string} [prefix=''] - The prefix to use for keys (used internally for recursion)
 * @returns {Record<string, any>} A flattened object with dot-notation keys
 * @throws {Error} If the input is not an object
 * 
 * @example
 * const nested = { user: { name: 'John', address: { city: 'New York', zip: '10001' } } };
 * const flat = flatten(nested);
 * // { 'user.name': 'John', 'user.address.city': 'New York', 'user.address.zip': '10001' }
 */
export const flatten = <T extends object>(
  obj: T,
  prefix: string = ''
): Record<string, any> => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    throw new Error('Input must be a non-null object');
  }

  return Object.entries(obj).reduce((result, [key, value]) => {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0) {
      Object.assign(result, flatten(value as object, newKey));
    } else {
      result[newKey] = value;
    }
    
    return result;
  }, {} as Record<string, any>);
};
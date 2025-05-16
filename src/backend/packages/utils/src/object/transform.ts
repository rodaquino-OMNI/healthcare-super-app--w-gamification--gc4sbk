/**
 * Utility functions for object transformation used across journey services for data mapping,
 * filtering, and restructuring. These utilities standardize common object manipulations
 * and ensure consistent behavior throughout the application while maintaining immutability.
 */

/**
 * Creates a new object with only the specified properties from the source object.
 * 
 * @template T - The type of the source object
 * @template K - The type of keys to pick (must be keys of T)
 * @param {T} obj - The source object
 * @param {K[]} keys - Array of keys to pick from the source object
 * @returns {Pick<T, K>} A new object containing only the specified properties
 * @throws {Error} If the input is not an object or if keys is not an array
 * 
 * @example
 * // Returns { name: 'John', age: 30 }
 * pick({ name: 'John', age: 30, address: '123 Main St' }, ['name', 'age']);
 */
export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  if (obj === null || typeof obj !== 'object') {
    throw new Error('Input must be an object');
  }

  if (!Array.isArray(keys)) {
    throw new Error('Keys must be an array');
  }

  return keys.reduce<Pick<T, K>>((result, key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
    return result;
  }, {} as Pick<T, K>);
};

/**
 * Creates a new object excluding the specified properties from the source object.
 * 
 * @template T - The type of the source object
 * @template K - The type of keys to omit (must be keys of T)
 * @param {T} obj - The source object
 * @param {K[]} keys - Array of keys to exclude from the source object
 * @returns {Omit<T, K>} A new object without the specified properties
 * @throws {Error} If the input is not an object or if keys is not an array
 * 
 * @example
 * // Returns { address: '123 Main St' }
 * omit({ name: 'John', age: 30, address: '123 Main St' }, ['name', 'age']);
 */
export const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  if (obj === null || typeof obj !== 'object') {
    throw new Error('Input must be an object');
  }

  if (!Array.isArray(keys)) {
    throw new Error('Keys must be an array');
  }

  const keysSet = new Set(keys);
  const result = {} as Omit<T, K>;

  // More efficient than using reduce for large objects
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && !keysSet.has(key as K)) {
      (result as any)[key] = obj[key];
    }
  }

  return result;
};

/**
 * Creates a new object with the same keys but transformed values based on a mapping function.
 * 
 * @template T - The type of the source object
 * @template V - The type of the transformed values
 * @param {T} obj - The source object
 * @param {(value: T[keyof T], key: string, obj: T) => V} fn - Function to transform each value
 * @returns {Record<keyof T, V>} A new object with transformed values
 * @throws {Error} If the input is not an object or if the mapping function is not provided
 * 
 * @example
 * // Returns { name: 'JOHN', age: '30 years' }
 * mapValues({ name: 'John', age: 30 }, (value, key) => {
 *   return key === 'name' ? value.toUpperCase() : `${value} years`;
 * });
 */
export const mapValues = <T extends object, V>(
  obj: T,
  fn: (value: T[keyof T], key: string, obj: T) => V
): Record<keyof T, V> => {
  if (obj === null || typeof obj !== 'object') {
    throw new Error('Input must be an object');
  }

  if (typeof fn !== 'function') {
    throw new Error('Mapping function must be provided');
  }

  const result = {} as Record<keyof T, V>;

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key as keyof T] = fn(obj[key as keyof T], key, obj);
    }
  }

  return result;
};

/**
 * Creates a new object with only the keys that pass a predicate function.
 * 
 * @template T - The type of the source object
 * @param {T} obj - The source object
 * @param {(key: string, value: T[keyof T], obj: T) => boolean} predicate - Function to test each key-value pair
 * @returns {Partial<T>} A new object with only the key-value pairs that passed the predicate
 * @throws {Error} If the input is not an object or if the predicate is not a function
 * 
 * @example
 * // Returns { age: 30 }
 * filterKeys({ name: 'John', age: 30, address: null }, (key, value) => value !== null);
 */
export const filterKeys = <T extends object>(
  obj: T,
  predicate: (key: string, value: T[keyof T], obj: T) => boolean
): Partial<T> => {
  if (obj === null || typeof obj !== 'object') {
    throw new Error('Input must be an object');
  }

  if (typeof predicate !== 'function') {
    throw new Error('Predicate must be a function');
  }

  const result = {} as Partial<T>;

  for (const key in obj) {
    if (
      Object.prototype.hasOwnProperty.call(obj, key) &&
      predicate(key, obj[key as keyof T], obj)
    ) {
      result[key as keyof T] = obj[key as keyof T];
    }
  }

  return result;
};

/**
 * Renames keys in an object based on a mapping object.
 * 
 * @template T - The type of the source object
 * @template R - The type of the renamed keys mapping
 * @param {T} obj - The source object
 * @param {Record<keyof T & string, string>} keysMap - Object mapping original keys to new keys
 * @returns {Record<string, unknown>} A new object with renamed keys
 * @throws {Error} If the input is not an object or if keysMap is not an object
 * 
 * @example
 * // Returns { firstName: 'John', userAge: 30 }
 * renameKeys({ name: 'John', age: 30 }, { name: 'firstName', age: 'userAge' });
 */
export const renameKeys = <T extends object, R extends Record<keyof T & string, string>>(
  obj: T,
  keysMap: R
): Record<string, unknown> => {
  if (obj === null || typeof obj !== 'object') {
    throw new Error('Input must be an object');
  }

  if (keysMap === null || typeof keysMap !== 'object') {
    throw new Error('Keys map must be an object');
  }

  const result: Record<string, unknown> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = Object.prototype.hasOwnProperty.call(keysMap, key)
        ? keysMap[key as keyof T & string]
        : key;
      result[newKey] = obj[key as keyof T];
    }
  }

  return result;
};

/**
 * Flattens a nested object structure into a single-level object with path-based keys.
 * 
 * @param {Record<string, any>} obj - The nested object to flatten
 * @param {string} [prefix=''] - The prefix to use for keys (used in recursion)
 * @param {string} [delimiter='.'] - The delimiter to use between path segments
 * @returns {Record<string, any>} A flattened object with path-based keys
 * @throws {Error} If the input is not an object
 * 
 * @example
 * // Returns { 'user.name': 'John', 'user.address.city': 'New York', 'user.address.zip': '10001' }
 * flattenObject({
 *   user: {
 *     name: 'John',
 *     address: {
 *       city: 'New York',
 *       zip: '10001'
 *     }
 *   }
 * });
 */
export const flattenObject = (
  obj: Record<string, any>,
  prefix: string = '',
  delimiter: string = '.'
): Record<string, any> => {
  if (obj === null || typeof obj !== 'object') {
    throw new Error('Input must be an object');
  }

  const result: Record<string, any> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = prefix ? `${prefix}${delimiter}${key}` : key;
      
      if (
        obj[key] !== null &&
        typeof obj[key] === 'object' &&
        !Array.isArray(obj[key]) &&
        Object.keys(obj[key]).length > 0
      ) {
        // Recursively flatten nested objects
        Object.assign(result, flattenObject(obj[key], newKey, delimiter));
      } else {
        // Add leaf values directly
        result[newKey] = obj[key];
      }
    }
  }

  return result;
};

/**
 * Transforms an object by applying a transformation function to each key-value pair.
 * Unlike mapValues, this function allows transforming both keys and values.
 * 
 * @template T - The type of the source object
 * @template R - The type of the result object
 * @param {T} obj - The source object
 * @param {(key: string, value: any, obj: T) => [string, any]} transformFn - Function to transform each key-value pair
 * @returns {R} A new object with transformed keys and values
 * @throws {Error} If the input is not an object or if transformFn is not a function
 * 
 * @example
 * // Returns { 'NAME': 'JOHN', 'AGE': 30 }
 * transformObject({ name: 'John', age: 30 }, (key, value) => [
 *   key.toUpperCase(),
 *   typeof value === 'string' ? value.toUpperCase() : value
 * ]);
 */
export const transformObject = <T extends object, R extends object>(
  obj: T,
  transformFn: (key: string, value: any, obj: T) => [string, any]
): R => {
  if (obj === null || typeof obj !== 'object') {
    throw new Error('Input must be an object');
  }

  if (typeof transformFn !== 'function') {
    throw new Error('Transform function must be provided');
  }

  const result = {} as R;

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const [newKey, newValue] = transformFn(key, obj[key as keyof T], obj);
      if (newKey !== undefined && newKey !== null) {
        (result as any)[newKey] = newValue;
      }
    }
  }

  return result;
};

/**
 * Converts an object's values to a specific type using a conversion function.
 * Useful for ensuring consistent value types across an object.
 * 
 * @template T - The type of the source object
 * @template V - The type to convert values to
 * @param {Record<keyof T, any>} obj - The source object
 * @param {(value: any, key: string) => V} convertFn - Function to convert each value
 * @returns {Record<keyof T, V>} A new object with converted values
 * @throws {Error} If the input is not an object or if convertFn is not a function
 * 
 * @example
 * // Returns { count: 5, total: 10, average: 2 }
 * convertValues({ count: '5', total: 10, average: '2.0' }, value => 
 *   typeof value === 'string' ? parseInt(value, 10) : value
 * );
 */
export const convertValues = <T extends object, V>(
  obj: T,
  convertFn: (value: any, key: string) => V
): Record<keyof T, V> => {
  if (obj === null || typeof obj !== 'object') {
    throw new Error('Input must be an object');
  }

  if (typeof convertFn !== 'function') {
    throw new Error('Conversion function must be provided');
  }

  const result = {} as Record<keyof T, V>;

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key as keyof T] = convertFn(obj[key as keyof T], key);
    }
  }

  return result;
};
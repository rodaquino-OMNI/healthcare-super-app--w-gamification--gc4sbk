/**
 * Utility functions for array transformations used across all journey services.
 * These functions provide consistent ways to reshape and transform array data
 * for health metrics, care provider information, plan coverage details, and gamification events.
 */

/**
 * Recursively flattens nested arrays of any depth into a single-level array.
 * 
 * @param arr - The array to flatten, which may contain nested arrays
 * @returns A new array with all nested arrays flattened
 * @example
 * flattenDeep([1, [2, [3, 4], 5]]); // returns [1, 2, 3, 4, 5]
 */
export const flattenDeep = <T>(arr: any[]): T[] => {
  if (!Array.isArray(arr)) {
    throw new Error('Input must be an array');
  }

  return arr.reduce((acc: T[], val: any) => {
    return acc.concat(
      Array.isArray(val) ? flattenDeep(val) : val
    );
  }, []);
};

/**
 * Transforms an array of objects into a key-value object using a specified key and optional value mapping function.
 * 
 * @param arr - The array of objects to transform
 * @param key - The property name to use as the key in the resulting object
 * @param valueMapper - Optional function to transform each object before adding to the result
 * @returns An object with keys derived from the specified property and corresponding values
 * @example
 * const users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
 * mapByKey(users, 'id'); // returns { '1': { id: 1, name: 'Alice' }, '2': { id: 2, name: 'Bob' } }
 * mapByKey(users, 'id', user => user.name); // returns { '1': 'Alice', '2': 'Bob' }
 */
export const mapByKey = <T extends Record<string, any>, K extends keyof T, V>(
  arr: T[],
  key: K,
  valueMapper?: (item: T) => V
): Record<string, V | T> => {
  if (!Array.isArray(arr)) {
    throw new Error('Input must be an array');
  }

  if (typeof key !== 'string' && typeof key !== 'number' && typeof key !== 'symbol') {
    throw new Error('Key must be a valid object property');
  }

  return arr.reduce((result: Record<string, V | T>, item: T) => {
    if (item === null || item === undefined) {
      return result;
    }

    const keyValue = String(item[key]);
    
    if (keyValue === undefined || keyValue === null) {
      return result;
    }

    result[keyValue] = valueMapper ? valueMapper(item) : item;
    return result;
  }, {});
};

/**
 * Creates a lookup object from an array of objects, using a specified property as the key.
 * Optimized for fast access by key. Unlike mapByKey, this function is specifically designed
 * for creating efficient lookup tables.
 * 
 * @param arr - The array of objects to index
 * @param key - The property name to use as the index key
 * @returns An object mapping keys to their corresponding objects
 * @example
 * const users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
 * indexBy(users, 'id'); // returns { '1': { id: 1, name: 'Alice' }, '2': { id: 2, name: 'Bob' } }
 */
export const indexBy = <T extends Record<string, any>, K extends keyof T>(
  arr: T[],
  key: K
): Record<string, T> => {
  if (!Array.isArray(arr)) {
    throw new Error('Input must be an array');
  }

  if (typeof key !== 'string' && typeof key !== 'number' && typeof key !== 'symbol') {
    throw new Error('Key must be a valid object property');
  }

  return arr.reduce((result: Record<string, T>, item: T) => {
    if (item === null || item === undefined) {
      return result;
    }

    const keyValue = String(item[key]);
    
    if (keyValue === undefined || keyValue === null) {
      return result;
    }

    result[keyValue] = item;
    return result;
  }, {});
};

/**
 * Extracts a specific property from each object in an array.
 * 
 * @param arr - The array of objects to process
 * @param key - The property name to extract from each object
 * @returns An array containing the values of the specified property from each object
 * @example
 * const users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
 * pluck(users, 'name'); // returns ['Alice', 'Bob']
 */
export const pluck = <T extends Record<string, any>, K extends keyof T>(
  arr: T[],
  key: K
): T[K][] => {
  if (!Array.isArray(arr)) {
    throw new Error('Input must be an array');
  }

  if (typeof key !== 'string' && typeof key !== 'number' && typeof key !== 'symbol') {
    throw new Error('Key must be a valid object property');
  }

  return arr
    .filter(item => item !== null && item !== undefined)
    .map(item => item[key]);
};

/**
 * Groups an array of objects by a specified key.
 * 
 * @param arr - The array of objects to group
 * @param key - The property name to group by
 * @returns An object with keys derived from the specified property and values as arrays of objects
 * @example
 * const users = [{ role: 'admin', name: 'Alice' }, { role: 'user', name: 'Bob' }, { role: 'admin', name: 'Charlie' }];
 * groupBy(users, 'role'); // returns { 'admin': [{ role: 'admin', name: 'Alice' }, { role: 'admin', name: 'Charlie' }], 'user': [{ role: 'user', name: 'Bob' }] }
 */
export const groupBy = <T extends Record<string, any>, K extends keyof T>(
  arr: T[],
  key: K
): Record<string, T[]> => {
  if (!Array.isArray(arr)) {
    throw new Error('Input must be an array');
  }

  if (typeof key !== 'string' && typeof key !== 'number' && typeof key !== 'symbol') {
    throw new Error('Key must be a valid object property');
  }

  return arr.reduce((result: Record<string, T[]>, item: T) => {
    if (item === null || item === undefined) {
      return result;
    }

    const keyValue = String(item[key]);
    
    if (keyValue === undefined || keyValue === null) {
      return result;
    }

    if (!result[keyValue]) {
      result[keyValue] = [];
    }

    result[keyValue].push(item);
    return result;
  }, {});
};

/**
 * Chunks an array into smaller arrays of a specified size.
 * 
 * @param arr - The array to chunk
 * @param size - The size of each chunk (must be greater than 0)
 * @returns An array of chunks, each containing up to 'size' elements
 * @example
 * chunk([1, 2, 3, 4, 5], 2); // returns [[1, 2], [3, 4], [5]]
 */
export const chunk = <T>(arr: T[], size: number): T[][] => {
  if (!Array.isArray(arr)) {
    throw new Error('Input must be an array');
  }

  if (!Number.isInteger(size) || size <= 0) {
    throw new Error('Chunk size must be a positive integer');
  }

  const result: T[][] = [];
  
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  
  return result;
};

/**
 * Removes duplicate values from an array.
 * For objects, a key function can be provided to determine uniqueness.
 * 
 * @param arr - The array to remove duplicates from
 * @param keyFn - Optional function to generate a unique key for each item
 * @returns A new array with duplicate values removed
 * @example
 * unique([1, 2, 2, 3, 1]); // returns [1, 2, 3]
 * unique([{id: 1, name: 'Alice'}, {id: 1, name: 'Bob'}], item => item.id); // returns [{id: 1, name: 'Alice'}]
 */
export const unique = <T>(
  arr: T[],
  keyFn?: (item: T) => string | number
): T[] => {
  if (!Array.isArray(arr)) {
    throw new Error('Input must be an array');
  }

  if (keyFn) {
    const seen = new Set<string | number>();
    return arr.filter(item => {
      const key = keyFn(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  return [...new Set(arr)];
};
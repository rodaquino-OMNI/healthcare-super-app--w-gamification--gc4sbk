/**
 * Utility functions for grouping array elements by various criteria.
 * These functions are essential for data aggregation and organization across all journey services,
 * including organizing health metrics by date, grouping care appointments by provider,
 * categorizing plan benefits, and segmenting gamification achievements.
 */

/**
 * Groups an array of objects by a specified key or selector function.
 * 
 * @param arr - The array of objects to group
 * @param keyOrSelector - The property name or selector function to group by
 * @returns An object with keys derived from the specified property and values as arrays of objects
 * @example
 * // Group by string key
 * const users = [{ role: 'admin', name: 'Alice' }, { role: 'user', name: 'Bob' }, { role: 'admin', name: 'Charlie' }];
 * groupBy(users, 'role'); 
 * // returns { 'admin': [{ role: 'admin', name: 'Alice' }, { role: 'admin', name: 'Charlie' }], 'user': [{ role: 'user', name: 'Bob' }] }
 * 
 * // Group by selector function
 * const metrics = [{ date: '2023-01-01', value: 10 }, { date: '2023-01-02', value: 20 }, { date: '2023-01-01', value: 30 }];
 * groupBy(metrics, item => item.date.substring(0, 7)); 
 * // returns { '2023-01': [{ date: '2023-01-01', value: 10 }, { date: '2023-01-02', value: 20 }, { date: '2023-01-01', value: 30 }] }
 */
export const groupBy = <T>(arr: T[], keyOrSelector: keyof T | ((item: T) => string | number)): Record<string, T[]> => {
  if (!Array.isArray(arr)) {
    throw new Error('Input must be an array');
  }

  if (keyOrSelector === undefined || keyOrSelector === null) {
    throw new Error('Key or selector function must be provided');
  }

  const selector = typeof keyOrSelector === 'function'
    ? keyOrSelector
    : (item: T) => {
        if (item === null || item === undefined) {
          throw new Error('Cannot access property of null or undefined');
        }
        return String((item as any)[keyOrSelector]);
      };

  return arr.reduce((result: Record<string, T[]>, item: T) => {
    if (item === null || item === undefined) {
      return result;
    }

    try {
      const key = String(selector(item));
      
      if (key === undefined || key === null) {
        return result;
      }

      if (!result[key]) {
        result[key] = [];
      }

      result[key].push(item);
    } catch (error) {
      // Skip items that cause errors in the selector function
      console.warn('Error in groupBy selector:', error);
    }
    
    return result;
  }, {});
};

/**
 * Partitions an array into two groups based on a predicate function.
 * 
 * @param arr - The array to partition
 * @param predicate - The function to determine which group an item belongs to
 * @returns An array containing two arrays: items that pass the predicate and items that fail
 * @example
 * const numbers = [1, 2, 3, 4, 5, 6];
 * partitionBy(numbers, n => n % 2 === 0); 
 * // returns [[2, 4, 6], [1, 3, 5]]
 * 
 * const users = [{ name: 'Alice', active: true }, { name: 'Bob', active: false }, { name: 'Charlie', active: true }];
 * partitionBy(users, user => user.active); 
 * // returns [[{ name: 'Alice', active: true }, { name: 'Charlie', active: true }], [{ name: 'Bob', active: false }]]
 */
export const partitionBy = <T>(arr: T[], predicate: (item: T) => boolean): [T[], T[]] => {
  if (!Array.isArray(arr)) {
    throw new Error('Input must be an array');
  }

  if (typeof predicate !== 'function') {
    throw new Error('Predicate must be a function');
  }

  const passing: T[] = [];
  const failing: T[] = [];

  for (const item of arr) {
    try {
      if (predicate(item)) {
        passing.push(item);
      } else {
        failing.push(item);
      }
    } catch (error) {
      // If predicate throws an error, consider it a failing case
      failing.push(item);
      console.warn('Error in partitionBy predicate:', error);
    }
  }

  return [passing, failing];
};

/**
 * Transforms an array of objects into a lookup object using a specified key or selector function.
 * Similar to indexBy but with support for selector functions.
 * 
 * @param arr - The array of objects to transform
 * @param keyOrSelector - The property name or selector function to use as the key
 * @returns An object mapping keys to their corresponding objects
 * @example
 * // Key by string property
 * const users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
 * keyBy(users, 'id'); 
 * // returns { '1': { id: 1, name: 'Alice' }, '2': { id: 2, name: 'Bob' } }
 * 
 * // Key by selector function
 * const appointments = [{ date: '2023-01-01', doctor: 'Smith' }, { date: '2023-01-02', doctor: 'Jones' }];
 * keyBy(appointments, item => `${item.date}-${item.doctor}`);
 * // returns { '2023-01-01-Smith': { date: '2023-01-01', doctor: 'Smith' }, '2023-01-02-Jones': { date: '2023-01-02', doctor: 'Jones' } }
 */
export const keyBy = <T>(arr: T[], keyOrSelector: keyof T | ((item: T) => string | number)): Record<string, T> => {
  if (!Array.isArray(arr)) {
    throw new Error('Input must be an array');
  }

  if (keyOrSelector === undefined || keyOrSelector === null) {
    throw new Error('Key or selector function must be provided');
  }

  const selector = typeof keyOrSelector === 'function'
    ? keyOrSelector
    : (item: T) => {
        if (item === null || item === undefined) {
          throw new Error('Cannot access property of null or undefined');
        }
        return String((item as any)[keyOrSelector]);
      };

  return arr.reduce((result: Record<string, T>, item: T) => {
    if (item === null || item === undefined) {
      return result;
    }

    try {
      const key = String(selector(item));
      
      if (key === undefined || key === null) {
        return result;
      }

      result[key] = item;
    } catch (error) {
      // Skip items that cause errors in the selector function
      console.warn('Error in keyBy selector:', error);
    }
    
    return result;
  }, {});
};

/**
 * Groups an array of objects by multiple keys, creating a nested structure.
 * 
 * @param arr - The array of objects to group
 * @param keys - An array of property names or selector functions to group by, in order of nesting
 * @returns A nested object structure grouped by the specified keys
 * @example
 * const data = [
 *   { year: 2023, month: 'Jan', day: 1, value: 10 },
 *   { year: 2023, month: 'Jan', day: 2, value: 20 },
 *   { year: 2023, month: 'Feb', day: 1, value: 30 },
 *   { year: 2024, month: 'Jan', day: 1, value: 40 }
 * ];
 * groupByMultiple(data, ['year', 'month']);
 * // returns {
 * //   '2023': {
 * //     'Jan': [{ year: 2023, month: 'Jan', day: 1, value: 10 }, { year: 2023, month: 'Jan', day: 2, value: 20 }],
 * //     'Feb': [{ year: 2023, month: 'Feb', day: 1, value: 30 }]
 * //   },
 * //   '2024': {
 * //     'Jan': [{ year: 2024, month: 'Jan', day: 1, value: 40 }]
 * //   }
 * // }
 */
export const groupByMultiple = <T>(
  arr: T[], 
  keys: (keyof T | ((item: T) => string | number))[]
): Record<string, any> => {
  if (!Array.isArray(arr)) {
    throw new Error('Input must be an array');
  }

  if (!Array.isArray(keys) || keys.length === 0) {
    throw new Error('Keys must be a non-empty array');
  }

  if (keys.length === 1) {
    return groupBy(arr, keys[0]);
  }

  const firstKey = keys[0];
  const remainingKeys = keys.slice(1);
  const grouped = groupBy(arr, firstKey);

  // Process each group with the remaining keys
  Object.keys(grouped).forEach(key => {
    grouped[key] = groupByMultiple(grouped[key], remainingKeys);
  });

  return grouped;
};

/**
 * Counts occurrences of each unique value in an array, optionally using a key or selector function for objects.
 * 
 * @param arr - The array to count values in
 * @param keyOrSelector - Optional property name or selector function for objects
 * @returns An object mapping unique values to their counts
 * @example
 * // Count primitive values
 * countBy([1, 2, 2, 3, 1, 1]); 
 * // returns { '1': 3, '2': 2, '3': 1 }
 * 
 * // Count by object property
 * const users = [{ role: 'admin', name: 'Alice' }, { role: 'user', name: 'Bob' }, { role: 'admin', name: 'Charlie' }];
 * countBy(users, 'role'); 
 * // returns { 'admin': 2, 'user': 1 }
 * 
 * // Count by selector function
 * const dates = ['2023-01-01', '2023-01-15', '2023-02-01'];
 * countBy(dates, date => date.substring(0, 7)); 
 * // returns { '2023-01': 2, '2023-02': 1 }
 */
export const countBy = <T>(
  arr: T[], 
  keyOrSelector?: keyof T | ((item: T) => string | number)
): Record<string, number> => {
  if (!Array.isArray(arr)) {
    throw new Error('Input must be an array');
  }

  const selector = keyOrSelector
    ? (typeof keyOrSelector === 'function'
      ? keyOrSelector
      : (item: T) => {
          if (item === null || item === undefined) {
            throw new Error('Cannot access property of null or undefined');
          }
          return String((item as any)[keyOrSelector]);
        })
    : (item: T) => String(item);

  return arr.reduce((result: Record<string, number>, item: T) => {
    if (item === null || item === undefined) {
      return result;
    }

    try {
      const key = String(selector(item));
      
      if (key === undefined || key === null) {
        return result;
      }

      result[key] = (result[key] || 0) + 1;
    } catch (error) {
      // Skip items that cause errors in the selector function
      console.warn('Error in countBy selector:', error);
    }
    
    return result;
  }, {});
};
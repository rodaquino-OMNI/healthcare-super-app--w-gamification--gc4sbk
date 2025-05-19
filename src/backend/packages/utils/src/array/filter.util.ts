/**
 * Advanced filtering utilities for arrays that go beyond standard JavaScript filter functionality.
 * These functions provide consistent filtering behavior for complex data structures across all journey services,
 * particularly for filtering health metrics, care providers, and insurance plans.
 */

/**
 * Filters an array to keep only unique elements based on a key or selector function.
 * 
 * @template T - The type of elements in the array
 * @template K - The type of the key used for uniqueness comparison
 * @param {T[]} array - The array to filter for unique elements
 * @param {keyof T | ((item: T) => K)} [keyOrSelector] - Optional key or function to determine uniqueness
 *                                                      If not provided, strict equality is used
 * @returns {T[]} A new array with only unique elements
 * @throws {Error} If the array is null or undefined
 * 
 * @example
 * // Returns unique primitive values
 * uniqueBy([1, 2, 2, 3, 1, 4]); // [1, 2, 3, 4]
 * 
 * @example
 * // Returns users with unique IDs
 * uniqueBy([
 *   { id: 1, name: 'Alice' },
 *   { id: 2, name: 'Bob' },
 *   { id: 1, name: 'Alice (duplicate)' }
 * ], 'id'); // [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
 * 
 * @example
 * // Returns users with unique names (using selector function)
 * uniqueBy([
 *   { id: 1, name: 'Alice' },
 *   { id: 2, name: 'Bob' },
 *   { id: 3, name: 'alice' }
 * ], user => user.name.toLowerCase()); // [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
 */
export const uniqueBy = <T, K = T>(array: T[], keyOrSelector?: keyof T | ((item: T) => K)): T[] => {
  if (!array) {
    throw new Error('Cannot filter undefined or null array');
  }

  // If no key or selector is provided, use the item itself for comparison
  if (keyOrSelector === undefined) {
    return [...new Set(array)];
  }

  const seen = new Set<string>();
  return array.filter(item => {
    // Determine the key for this item
    const key = typeof keyOrSelector === 'function'
      ? (keyOrSelector as (item: T) => K)(item)
      : item[keyOrSelector as keyof T];
    
    // Convert the key to a string for Set storage
    const keyString = typeof key === 'object' ? JSON.stringify(key) : String(key);
    
    // If we've seen this key before, filter it out
    if (seen.has(keyString)) {
      return false;
    }
    
    // Otherwise, mark it as seen and keep it
    seen.add(keyString);
    return true;
  });
};

/**
 * Type for property matching options in filterByProperties
 */
export type PropertyMatcher<T = any> = {
  exact?: T;                  // Exact match (===)
  contains?: string;          // String contains (for string properties)
  startsWith?: string;        // String starts with (for string properties)
  endsWith?: string;          // String ends with (for string properties)
  in?: T[];                   // Value is in array
  notIn?: T[];                // Value is not in array
  gt?: number;                // Greater than (for numeric properties)
  gte?: number;               // Greater than or equal (for numeric properties)
  lt?: number;                // Less than (for numeric properties)
  lte?: number;               // Less than or equal (for numeric properties)
  between?: [number, number]; // Between two values, inclusive (for numeric properties)
  exists?: boolean;           // Property exists and is not null/undefined
  regex?: RegExp;             // Matches regular expression (for string properties)
};

/**
 * Type for the properties object in filterByProperties
 */
export type FilterProperties<T> = {
  [K in keyof T]?: T[K] | PropertyMatcher<T[K]>;
};

/**
 * Filters an array of objects by property values with flexible matching options.
 * 
 * @template T - The type of objects in the array
 * @param {T[]} array - The array of objects to filter
 * @param {FilterProperties<T>} properties - Object with properties to match against
 * @param {boolean} [matchAll=true] - If true, all properties must match (AND logic)
 *                                   If false, at least one property must match (OR logic)
 * @returns {T[]} A new array with objects that match the criteria
 * @throws {Error} If the array is null or undefined
 * 
 * @example
 * // Filter users by exact name match
 * filterByProperties(users, { name: 'Alice' });
 * 
 * @example
 * // Filter users by age range and name pattern
 * filterByProperties(users, {
 *   age: { between: [25, 35] },
 *   name: { startsWith: 'A' }
 * });
 * 
 * @example
 * // Filter metrics by value threshold and type
 * filterByProperties(healthMetrics, {
 *   value: { gt: 120 },
 *   type: { in: ['heart_rate', 'blood_pressure'] }
 * });
 */
export const filterByProperties = <T>(array: T[], properties: FilterProperties<T>, matchAll: boolean = true): T[] => {
  if (!array) {
    throw new Error('Cannot filter undefined or null array');
  }

  if (!properties || Object.keys(properties).length === 0) {
    return [...array]; // Return a copy of the original array if no properties specified
  }

  return array.filter(item => {
    // Check each property against the item
    const propertyResults = Object.entries(properties).map(([key, matcher]) => {
      const value = item[key as keyof T];
      
      // If matcher is a PropertyMatcher object
      if (matcher !== null && typeof matcher === 'object' && !Array.isArray(matcher)) {
        const propertyMatcher = matcher as PropertyMatcher;
        
        // Check each matcher condition
        if (propertyMatcher.exact !== undefined) {
          return value === propertyMatcher.exact;
        }
        
        if (propertyMatcher.contains !== undefined && typeof value === 'string') {
          return value.includes(propertyMatcher.contains);
        }
        
        if (propertyMatcher.startsWith !== undefined && typeof value === 'string') {
          return value.startsWith(propertyMatcher.startsWith);
        }
        
        if (propertyMatcher.endsWith !== undefined && typeof value === 'string') {
          return value.endsWith(propertyMatcher.endsWith);
        }
        
        if (propertyMatcher.in !== undefined) {
          return propertyMatcher.in.includes(value as any);
        }
        
        if (propertyMatcher.notIn !== undefined) {
          return !propertyMatcher.notIn.includes(value as any);
        }
        
        if (propertyMatcher.gt !== undefined && typeof value === 'number') {
          return value > propertyMatcher.gt;
        }
        
        if (propertyMatcher.gte !== undefined && typeof value === 'number') {
          return value >= propertyMatcher.gte;
        }
        
        if (propertyMatcher.lt !== undefined && typeof value === 'number') {
          return value < propertyMatcher.lt;
        }
        
        if (propertyMatcher.lte !== undefined && typeof value === 'number') {
          return value <= propertyMatcher.lte;
        }
        
        if (propertyMatcher.between !== undefined && typeof value === 'number') {
          const [min, max] = propertyMatcher.between;
          return value >= min && value <= max;
        }
        
        if (propertyMatcher.exists !== undefined) {
          return propertyMatcher.exists ? value !== undefined && value !== null : value === undefined || value === null;
        }
        
        if (propertyMatcher.regex !== undefined && typeof value === 'string') {
          return propertyMatcher.regex.test(value);
        }
        
        // If no conditions matched, consider it a non-match
        return false;
      }
      
      // Simple equality check for direct value matchers
      return value === matcher;
    });
    
    // Determine if the item matches based on matchAll flag
    return matchAll 
      ? propertyResults.every(result => result) // AND logic - all must be true
      : propertyResults.some(result => result);  // OR logic - at least one must be true
  });
};

/**
 * Inverse of filterByProperties - removes objects that match the criteria.
 * 
 * @template T - The type of objects in the array
 * @param {T[]} array - The array of objects to filter
 * @param {FilterProperties<T>} properties - Object with properties to match against
 * @param {boolean} [matchAll=true] - If true, all properties must match to reject (AND logic)
 *                                   If false, any matching property causes rejection (OR logic)
 * @returns {T[]} A new array with objects that do NOT match the criteria
 * @throws {Error} If the array is null or undefined
 * 
 * @example
 * // Remove users with name 'Alice'
 * rejectByProperties(users, { name: 'Alice' });
 * 
 * @example
 * // Remove users outside a specific age range
 * rejectByProperties(users, {
 *   age: { lt: 18, gt: 65 }
 * }, false); // OR logic - reject if age < 18 OR age > 65
 */
export const rejectByProperties = <T>(array: T[], properties: FilterProperties<T>, matchAll: boolean = true): T[] => {
  if (!array) {
    throw new Error('Cannot filter undefined or null array');
  }

  // Use filterByProperties with inverted result
  const matchingItems = filterByProperties(array, properties, matchAll);
  return array.filter(item => !matchingItems.includes(item));
};

/**
 * Returns elements from the first array that are not in the second array,
 * based on a key or selector function for comparison.
 * 
 * @template T - The type of elements in the arrays
 * @template K - The type of the key used for comparison
 * @param {T[]} array - The source array
 * @param {T[]} otherArray - The array to compare against
 * @param {keyof T | ((item: T) => K)} [keyOrSelector] - Optional key or function for comparison
 *                                                      If not provided, strict equality is used
 * @returns {T[]} Elements from the first array that are not in the second array
 * @throws {Error} If either array is null or undefined
 * 
 * @example
 * // Returns [3, 4] (elements in first array not in second)
 * differenceBy([1, 2, 3, 4], [1, 2, 5]);
 * 
 * @example
 * // Returns users from first array not in second array, compared by ID
 * differenceBy(
 *   [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }, { id: 3, name: 'Charlie' }],
 *   [{ id: 1, name: 'Alice' }, { id: 2, name: 'Robert' }],
 *   'id'
 * ); // [{ id: 3, name: 'Charlie' }]
 * 
 * @example
 * // Compare users by lowercase name using a selector function
 * differenceBy(
 *   [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
 *   [{ id: 3, name: 'alice' }],
 *   user => user.name.toLowerCase()
 * ); // [{ id: 2, name: 'Bob' }]
 */
export const differenceBy = <T, K = T>(array: T[], otherArray: T[], keyOrSelector?: keyof T | ((item: T) => K)): T[] => {
  if (!array) {
    throw new Error('Cannot compare undefined or null source array');
  }
  
  if (!otherArray) {
    throw new Error('Cannot compare against undefined or null array');
  }

  // If no key or selector is provided, use the item itself for comparison
  if (keyOrSelector === undefined) {
    return array.filter(item => !otherArray.includes(item));
  }

  // Create a set of keys from the second array for efficient lookup
  const otherKeys = new Set<string>();
  
  otherArray.forEach(item => {
    const key = typeof keyOrSelector === 'function'
      ? (keyOrSelector as (item: T) => K)(item)
      : item[keyOrSelector as keyof T];
    
    const keyString = typeof key === 'object' ? JSON.stringify(key) : String(key);
    otherKeys.add(keyString);
  });

  // Filter the first array to keep only items whose keys are not in the set
  return array.filter(item => {
    const key = typeof keyOrSelector === 'function'
      ? (keyOrSelector as (item: T) => K)(item)
      : item[keyOrSelector as keyof T];
    
    const keyString = typeof key === 'object' ? JSON.stringify(key) : String(key);
    return !otherKeys.has(keyString);
  });
};

/**
 * Returns elements that are in both arrays, based on a key or selector function for comparison.
 * 
 * @template T - The type of elements in the arrays
 * @template K - The type of the key used for comparison
 * @param {T[]} array - The first array
 * @param {T[]} otherArray - The second array
 * @param {keyof T | ((item: T) => K)} [keyOrSelector] - Optional key or function for comparison
 *                                                      If not provided, strict equality is used
 * @returns {T[]} Elements that exist in both arrays (from the first array)
 * @throws {Error} If either array is null or undefined
 * 
 * @example
 * // Returns [1, 2] (elements in both arrays)
 * intersectionBy([1, 2, 3], [1, 2, 4]);
 * 
 * @example
 * // Returns users that exist in both arrays, compared by ID
 * intersectionBy(
 *   [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
 *   [{ id: 1, name: 'Alice Smith' }, { id: 3, name: 'Charlie' }],
 *   'id'
 * ); // [{ id: 1, name: 'Alice' }]
 */
export const intersectionBy = <T, K = T>(array: T[], otherArray: T[], keyOrSelector?: keyof T | ((item: T) => K)): T[] => {
  if (!array) {
    throw new Error('Cannot compare undefined or null first array');
  }
  
  if (!otherArray) {
    throw new Error('Cannot compare against undefined or null second array');
  }

  // If no key or selector is provided, use the item itself for comparison
  if (keyOrSelector === undefined) {
    return array.filter(item => otherArray.includes(item));
  }

  // Create a set of keys from the second array for efficient lookup
  const otherKeys = new Set<string>();
  
  otherArray.forEach(item => {
    const key = typeof keyOrSelector === 'function'
      ? (keyOrSelector as (item: T) => K)(item)
      : item[keyOrSelector as keyof T];
    
    const keyString = typeof key === 'object' ? JSON.stringify(key) : String(key);
    otherKeys.add(keyString);
  });

  // Filter the first array to keep only items whose keys are in the set
  return array.filter(item => {
    const key = typeof keyOrSelector === 'function'
      ? (keyOrSelector as (item: T) => K)(item)
      : item[keyOrSelector as keyof T];
    
    const keyString = typeof key === 'object' ? JSON.stringify(key) : String(key);
    return otherKeys.has(keyString);
  });
};

/**
 * Filters out null and undefined values from an array.
 * 
 * @template T - The type of elements in the array
 * @param {Array<T | null | undefined>} array - The array to filter
 * @returns {T[]} A new array with null and undefined values removed
 * @throws {Error} If the array is null or undefined
 * 
 * @example
 * // Returns [1, 2, 3]
 * compact([1, null, 2, undefined, 3]);
 */
export const compact = <T>(array: Array<T | null | undefined>): T[] => {
  if (!array) {
    throw new Error('Cannot filter undefined or null array');
  }

  return array.filter((item): item is T => item !== null && item !== undefined);
};

/**
 * Filters an array to keep only elements that satisfy a predicate function,
 * with additional context about the filtering process.
 * 
 * @template T - The type of elements in the array
 * @param {T[]} array - The array to filter
 * @param {(item: T, index: number, array: T[]) => boolean} predicate - Function to test each element
 * @returns {Object} An object containing the filtered array and rejected elements
 * @throws {Error} If the array is null or undefined
 * 
 * @example
 * // Filter even numbers
 * const { filtered, rejected } = filterWithRejections([1, 2, 3, 4, 5], num => num % 2 === 0);
 * // filtered: [2, 4], rejected: [1, 3, 5]
 */
export const filterWithRejections = <T>(
  array: T[],
  predicate: (item: T, index: number, array: T[]) => boolean
): { filtered: T[]; rejected: T[] } => {
  if (!array) {
    throw new Error('Cannot filter undefined or null array');
  }

  const filtered: T[] = [];
  const rejected: T[] = [];

  array.forEach((item, index) => {
    if (predicate(item, index, array)) {
      filtered.push(item);
    } else {
      rejected.push(item);
    }
  });

  return { filtered, rejected };
};
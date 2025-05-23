/**
 * Advanced array filtering utilities that go beyond standard JavaScript filter functionality.
 * These functions provide consistent filtering behavior for complex data structures across
 * all journey services, particularly for filtering health metrics, care providers, and insurance plans.
 */

/**
 * Returns a new array with unique elements based on a key or selector function.
 * 
 * @template T - The type of elements in the array
 * @param {T[]} array - The input array to filter for unique elements
 * @param {string | ((item: T) => any)} keyOrSelector - Property name or selector function to determine uniqueness
 * @returns {T[]} A new array with only unique elements based on the key or selector
 * @throws {Error} If the array is not valid or the key/selector is invalid
 * 
 * @example
 * // Using a property name
 * const uniqueUsers = uniqueBy(users, 'id');
 * 
 * @example
 * // Using a selector function
 * const uniqueAddresses = uniqueBy(locations, item => `${item.latitude}-${item.longitude}`);
 */
export const uniqueBy = <T>(array: T[], keyOrSelector: string | ((item: T) => any)): T[] => {
  if (!Array.isArray(array)) {
    throw new Error('Input must be an array');
  }

  if (!keyOrSelector) {
    throw new Error('Key or selector function must be provided');
  }

  const selector = typeof keyOrSelector === 'string'
    ? (item: T) => item[keyOrSelector as keyof T]
    : keyOrSelector;

  const seen = new Set();
  return array.filter(item => {
    if (item === null || item === undefined) {
      return false;
    }
    
    try {
      const key = selector(item);
      const serializedKey = typeof key === 'object' ? JSON.stringify(key) : String(key);
      
      if (seen.has(serializedKey)) {
        return false;
      }
      
      seen.add(serializedKey);
      return true;
    } catch (error) {
      // If selector throws an error (e.g., property doesn't exist), skip the item
      return false;
    }
  });
};

/**
 * Options for filtering objects by properties
 */
export interface FilterByPropertiesOptions {
  /**
   * Determines how string values are matched
   * - 'exact': Exact match (default)
   * - 'partial': Contains the value
   * - 'startsWith': Starts with the value
   * - 'endsWith': Ends with the value
   */
  matchMode?: 'exact' | 'partial' | 'startsWith' | 'endsWith';
  
  /**
   * Whether string matching should be case-sensitive
   * @default true
   */
  caseSensitive?: boolean;
}

/**
 * Filters an array of objects by matching property values.
 * 
 * @template T - The type of elements in the array
 * @param {T[]} array - The input array of objects to filter
 * @param {Record<string, any>} properties - Object with key-value pairs to match against items
 * @param {FilterByPropertiesOptions} [options] - Options for controlling the matching behavior
 * @returns {T[]} A new array containing only the elements that match the specified properties
 * @throws {Error} If the array is not valid or properties is not an object
 * 
 * @example
 * // Exact match (default)
 * const activeUsers = filterByProperties(users, { status: 'active', role: 'admin' });
 * 
 * @example
 * // Partial match, case-insensitive
 * const brazilianUsers = filterByProperties(
 *   users, 
 *   { address: 'brazil' }, 
 *   { matchMode: 'partial', caseSensitive: false }
 * );
 */
export const filterByProperties = <T extends Record<string, any>>(
  array: T[],
  properties: Record<string, any>,
  options?: FilterByPropertiesOptions
): T[] => {
  if (!Array.isArray(array)) {
    throw new Error('Input must be an array');
  }

  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
    throw new Error('Properties must be a non-array object');
  }

  const { matchMode = 'exact', caseSensitive = true } = options || {};
  const propertyKeys = Object.keys(properties);

  if (propertyKeys.length === 0) {
    return [...array]; // Return a copy of the original array if no properties to match
  }

  return array.filter(item => {
    if (!item || typeof item !== 'object') {
      return false;
    }

    return propertyKeys.every(key => {
      const itemValue = item[key];
      const propertyValue = properties[key];

      // Handle null/undefined values
      if (propertyValue === null || propertyValue === undefined) {
        return itemValue === propertyValue;
      }

      // Handle string values with different match modes
      if (typeof propertyValue === 'string' && typeof itemValue === 'string') {
        const itemStr = caseSensitive ? itemValue : itemValue.toLowerCase();
        const propStr = caseSensitive ? propertyValue : propertyValue.toLowerCase();

        switch (matchMode) {
          case 'partial':
            return itemStr.includes(propStr);
          case 'startsWith':
            return itemStr.startsWith(propStr);
          case 'endsWith':
            return itemStr.endsWith(propStr);
          case 'exact':
          default:
            return itemStr === propStr;
        }
      }

      // Handle arrays by checking if the property value is included in the item's array
      if (Array.isArray(itemValue)) {
        return itemValue.some(val => 
          val === propertyValue || 
          (typeof val === 'object' && val !== null && JSON.stringify(val) === JSON.stringify(propertyValue))
        );
      }

      // Handle dates
      if (propertyValue instanceof Date && itemValue instanceof Date) {
        return propertyValue.getTime() === itemValue.getTime();
      }

      // Handle objects by comparing stringified versions
      if (typeof propertyValue === 'object' && typeof itemValue === 'object') {
        return JSON.stringify(propertyValue) === JSON.stringify(itemValue);
      }

      // Default comparison for other types
      return itemValue === propertyValue;
    });
  });
};

/**
 * Filters an array to exclude objects that match the specified properties.
 * This is the inverse operation of filterByProperties.
 * 
 * @template T - The type of elements in the array
 * @param {T[]} array - The input array of objects to filter
 * @param {Record<string, any>} properties - Object with key-value pairs to match against items for exclusion
 * @param {FilterByPropertiesOptions} [options] - Options for controlling the matching behavior
 * @returns {T[]} A new array containing only the elements that do NOT match the specified properties
 * @throws {Error} If the array is not valid or properties is not an object
 * 
 * @example
 * // Exclude all admin users
 * const nonAdminUsers = rejectByProperties(users, { role: 'admin' });
 * 
 * @example
 * // Exclude users with 'test' in their email, case-insensitive
 * const productionUsers = rejectByProperties(
 *   users, 
 *   { email: 'test' }, 
 *   { matchMode: 'partial', caseSensitive: false }
 * );
 */
export const rejectByProperties = <T extends Record<string, any>>(
  array: T[],
  properties: Record<string, any>,
  options?: FilterByPropertiesOptions
): T[] => {
  if (!Array.isArray(array)) {
    throw new Error('Input must be an array');
  }

  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
    throw new Error('Properties must be a non-array object');
  }

  const matchedItems = filterByProperties(array, properties, options);
  const matchedItemsSet = new Set(matchedItems.map(item => JSON.stringify(item)));

  return array.filter(item => !matchedItemsSet.has(JSON.stringify(item)));
};

/**
 * Returns elements in the first array that are not in the second array,
 * based on a key or selector function.
 * 
 * @template T - The type of elements in the arrays
 * @param {T[]} array - The source array
 * @param {T[]} values - The array of values to exclude
 * @param {string | ((item: T) => any)} keyOrSelector - Property name or selector function to determine uniqueness
 * @returns {T[]} A new array with elements from the first array that are not in the second array
 * @throws {Error} If either array is not valid or the key/selector is invalid
 * 
 * @example
 * // Using a property name
 * const newUsers = differenceBy(allUsers, existingUsers, 'id');
 * 
 * @example
 * // Using a selector function
 * const newLocations = differenceBy(
 *   allLocations, 
 *   existingLocations, 
 *   item => `${item.latitude}-${item.longitude}`
 * );
 */
export const differenceBy = <T>(
  array: T[],
  values: T[],
  keyOrSelector: string | ((item: T) => any)
): T[] => {
  if (!Array.isArray(array)) {
    throw new Error('First argument must be an array');
  }

  if (!Array.isArray(values)) {
    throw new Error('Second argument must be an array');
  }

  if (!keyOrSelector) {
    throw new Error('Key or selector function must be provided');
  }

  if (values.length === 0) {
    return [...array]; // Return a copy of the original array if no values to exclude
  }

  const selector = typeof keyOrSelector === 'string'
    ? (item: T) => item[keyOrSelector as keyof T]
    : keyOrSelector;

  // Create a set of keys from the values array for efficient lookup
  const valueKeys = new Set();
  values.forEach(item => {
    if (item !== null && item !== undefined) {
      try {
        const key = selector(item);
        const serializedKey = typeof key === 'object' ? JSON.stringify(key) : String(key);
        valueKeys.add(serializedKey);
      } catch (error) {
        // Skip items that throw errors when applying the selector
      }
    }
  });

  // Filter the array to include only items whose keys are not in the valueKeys set
  return array.filter(item => {
    if (item === null || item === undefined) {
      return false;
    }
    
    try {
      const key = selector(item);
      const serializedKey = typeof key === 'object' ? JSON.stringify(key) : String(key);
      return !valueKeys.has(serializedKey);
    } catch (error) {
      // If selector throws an error (e.g., property doesn't exist), skip the item
      return false;
    }
  });
};
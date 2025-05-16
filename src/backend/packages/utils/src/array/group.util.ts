/**
 * Utility functions for grouping and organizing array elements.
 * These utilities are essential for data aggregation and organization across all journey services.
 */

/**
 * Groups array elements by a specified key or selector function.
 * 
 * @template T - The type of elements in the array
 * @template K - The type of the grouping key (must be a valid object property key)
 * @param array - The array to group
 * @param keyOrSelector - The key to group by or a function that returns a grouping key for each item
 * @returns An object where keys are group identifiers and values are arrays of items in that group
 * @throws Error if the array is null or undefined
 * 
 * @example
 * // Group users by role
 * const usersByRole = groupBy(users, 'role');
 * 
 * @example
 * // Group appointments by month using a selector function
 * const appointmentsByMonth = groupBy(appointments, 
 *   appointment => formatDate(appointment.date, 'MM/yyyy')
 * );
 */
export const groupBy = <T, K extends PropertyKey>(
  array: T[],
  keyOrSelector: keyof T | ((item: T) => K)
): Record<string, T[]> => {
  if (!array) {
    throw new Error('Cannot group undefined or null array');
  }

  return array.reduce((result, item) => {
    // Determine the key for this item
    const key = typeof keyOrSelector === 'function'
      ? (keyOrSelector as (item: T) => K)(item)
      : item[keyOrSelector as keyof T];
    
    // Convert the key to string to ensure it can be used as an object key
    const keyString = String(key);
    
    // Initialize the array for this key if it doesn't exist
    if (!result[keyString]) {
      result[keyString] = [];
    }
    
    // Add the item to the appropriate group
    result[keyString].push(item);
    
    return result;
  }, {} as Record<string, T[]>);
};

/**
 * Partitions an array into two groups based on a predicate function.
 * 
 * @template T - The type of elements in the array
 * @param array - The array to partition
 * @param predicate - A function that determines whether an item passes the condition
 * @returns A tuple containing two arrays: [passing, failing]
 * @throws Error if the array is null or undefined
 * 
 * @example
 * // Partition health metrics into normal and abnormal readings
 * const [normalReadings, abnormalReadings] = partitionBy(
 *   healthMetrics,
 *   metric => metric.value >= metric.minNormal && metric.value <= metric.maxNormal
 * );
 * 
 * @example
 * // Partition appointments into past and upcoming
 * const [pastAppointments, upcomingAppointments] = partitionBy(
 *   appointments,
 *   appointment => new Date(appointment.date) < new Date()
 * );
 */
export const partitionBy = <T>(
  array: T[],
  predicate: (item: T) => boolean
): [T[], T[]] => {
  if (!array) {
    throw new Error('Cannot partition undefined or null array');
  }

  return array.reduce(
    (result, item) => {
      // Add the item to either the passing or failing array based on the predicate
      result[predicate(item) ? 0 : 1].push(item);
      return result;
    },
    [[], []] as [T[], T[]]
  );
};

/**
 * Transforms an array into an object where each item is indexed by the specified key.
 * 
 * @template T - The type of elements in the array
 * @template K - The type of the key (must be a valid object property key)
 * @param array - The array to transform
 * @param keyOrSelector - The key to index by or a function that returns a key for each item
 * @returns An object where keys are derived from each item and values are the items themselves
 * @throws Error if the array is null or undefined or if duplicate keys are found
 * 
 * @example
 * // Create a lookup object for users by ID
 * const usersById = keyBy(users, 'id');
 * 
 * @example
 * // Create a lookup for health metrics by type and date
 * const metricsByTypeAndDate = keyBy(healthMetrics, 
 *   metric => `${metric.type}_${formatDate(metric.date, 'yyyyMMdd')}`
 * );
 */
export const keyBy = <T, K extends PropertyKey>(
  array: T[],
  keyOrSelector: keyof T | ((item: T) => K)
): Record<string, T> => {
  if (!array) {
    throw new Error('Cannot index undefined or null array');
  }

  return array.reduce((result, item) => {
    // Determine the key for this item
    const key = typeof keyOrSelector === 'function'
      ? (keyOrSelector as (item: T) => K)(item)
      : item[keyOrSelector as keyof T];
    
    // Convert the key to string to ensure it can be used as an object key
    const keyString = String(key);
    
    // Check for duplicate keys
    if (result[keyString] !== undefined) {
      throw new Error(`Duplicate key "${keyString}" found when creating lookup object`);
    }
    
    // Add the item to the result object
    result[keyString] = item;
    
    return result;
  }, {} as Record<string, T>);
};

/**
 * Creates a lookup object from an array with custom key and value selectors.
 * 
 * @template T - The type of elements in the array
 * @template K - The type of the key (must be a valid object property key)
 * @template V - The type of the values in the resulting object
 * @param array - The array to transform
 * @param keySelector - A function that returns a key for each item
 * @param valueSelector - A function that returns a value for each item
 * @returns An object where keys and values are derived from each item
 * @throws Error if the array is null or undefined or if duplicate keys are found
 * 
 * @example
 * // Create a lookup of user names by ID
 * const userNamesById = indexBy(
 *   users,
 *   user => user.id,
 *   user => user.fullName
 * );
 */
export const indexBy = <T, K extends PropertyKey, V>(
  array: T[],
  keySelector: (item: T) => K,
  valueSelector: (item: T) => V
): Record<string, V> => {
  if (!array) {
    throw new Error('Cannot index undefined or null array');
  }

  return array.reduce((result, item) => {
    // Determine the key and value for this item
    const key = keySelector(item);
    const value = valueSelector(item);
    
    // Convert the key to string to ensure it can be used as an object key
    const keyString = String(key);
    
    // Check for duplicate keys
    if (result[keyString] !== undefined) {
      throw new Error(`Duplicate key "${keyString}" found when creating lookup object`);
    }
    
    // Add the entry to the result object
    result[keyString] = value;
    
    return result;
  }, {} as Record<string, V>);
};

/**
 * Counts occurrences of each unique value in an array based on a key or selector function.
 * 
 * @template T - The type of elements in the array
 * @template K - The type of the grouping key (must be a valid object property key)
 * @param array - The array to analyze
 * @param keyOrSelector - The key to count by or a function that returns a key for each item
 * @returns An object where keys are unique values and values are the counts of occurrences
 * @throws Error if the array is null or undefined
 * 
 * @example
 * // Count appointments by status
 * const appointmentCountsByStatus = countBy(appointments, 'status');
 * 
 * @example
 * // Count health metrics by month
 * const metricCountsByMonth = countBy(healthMetrics, 
 *   metric => formatDate(metric.date, 'MM/yyyy')
 * );
 */
export const countBy = <T, K extends PropertyKey>(
  array: T[],
  keyOrSelector: keyof T | ((item: T) => K)
): Record<string, number> => {
  if (!array) {
    throw new Error('Cannot count undefined or null array');
  }

  return array.reduce((result, item) => {
    // Determine the key for this item
    const key = typeof keyOrSelector === 'function'
      ? (keyOrSelector as (item: T) => K)(item)
      : item[keyOrSelector as keyof T];
    
    // Convert the key to string to ensure it can be used as an object key
    const keyString = String(key);
    
    // Initialize or increment the count for this key
    result[keyString] = (result[keyString] || 0) + 1;
    
    return result;
  }, {} as Record<string, number>);
};
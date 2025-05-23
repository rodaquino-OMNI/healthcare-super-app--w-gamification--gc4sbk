/**
 * Array utility functions for consistent, centralized access across all journey services.
 * This module provides a clean public API for all array manipulation utilities,
 * enabling standardized import patterns and reducing potential circular dependencies.
 * 
 * @module array
 */

// Import all array utility functions
import {
  chunk as chunkUtil,
  chunkBySize,
  chunkByPredicate,
  chunkByMaxSize,
  chunkByBoundary
} from './chunk.util';

import {
  uniqueBy,
  filterByProperties,
  rejectByProperties,
  differenceBy,
  FilterByPropertiesOptions
} from './filter.util';

import {
  groupBy as groupByUtil,
  partitionBy,
  keyBy,
  groupByMultiple,
  countBy
} from './group.util';

import {
  flattenDeep,
  mapByKey,
  indexBy,
  pluck,
  unique
} from './transform.util';

/**
 * @category Chunking
 * Functions for splitting arrays into smaller chunks with various strategies
 */

/**
 * Splits an array into chunks of a specified size.
 * 
 * @param arr - The array to split into chunks
 * @param size - The size of each chunk (must be greater than 0)
 * @returns An array of chunks, each containing up to 'size' elements
 * @example
 * chunk([1, 2, 3, 4, 5], 2); // returns [[1, 2], [3, 4], [5]]
 */
export const chunk = chunkUtil;

/**
 * Splits an array into a specified number of chunks of approximately equal size.
 * 
 * @param arr - The array to split into chunks
 * @param numChunks - The number of chunks to create (must be greater than 0)
 * @returns An array of chunks with approximately equal size
 * @example
 * chunkBySize([1, 2, 3, 4, 5], 2); // returns [[1, 2, 3], [4, 5]]
 */
export { chunkBySize };

/**
 * Splits an array into chunks based on a predicate function.
 * 
 * @param arr - The array to split into chunks
 * @param predicate - A function that determines the chunk an element belongs to
 * @returns An array of chunks grouped by predicate result
 * @example
 * chunkByPredicate([1, 2, 3, 4, 5], n => n % 2 === 0); // returns [[2, 4], [1, 3, 5]]
 */
export { chunkByPredicate };

/**
 * Splits an array into chunks, ensuring that the total size of elements in each chunk
 * does not exceed a specified maximum size based on a size calculation function.
 * 
 * @param arr - The array to split into chunks
 * @param maxSize - The maximum total size for each chunk
 * @param sizeCalculator - A function that calculates the size of an element
 * @returns An array of chunks, each with a total size not exceeding maxSize
 */
export { chunkByMaxSize };

/**
 * Splits an array into chunks based on a boundary condition.
 * 
 * @param arr - The array to split into chunks
 * @param isBoundary - A function that determines if a new chunk should start between two elements
 * @returns An array of chunks separated by boundary conditions
 */
export { chunkByBoundary };

/**
 * @category Filtering
 * Functions for advanced filtering operations beyond standard JavaScript filter
 */

/**
 * Options for filtering objects by properties
 */
export { FilterByPropertiesOptions };

/**
 * Returns a new array with unique elements based on a key or selector function.
 * 
 * @param array - The input array to filter for unique elements
 * @param keyOrSelector - Property name or selector function to determine uniqueness
 * @returns A new array with only unique elements based on the key or selector
 * @example
 * uniqueBy(users, 'id'); // returns users with unique IDs
 */
export { uniqueBy };

/**
 * Filters an array of objects by matching property values.
 * 
 * @param array - The input array of objects to filter
 * @param properties - Object with key-value pairs to match against items
 * @param options - Options for controlling the matching behavior
 * @returns A new array containing only the elements that match the specified properties
 * @example
 * filterByProperties(users, { status: 'active', role: 'admin' }); // returns active admin users
 */
export { filterByProperties };

/**
 * Filters an array to exclude objects that match the specified properties.
 * 
 * @param array - The input array of objects to filter
 * @param properties - Object with key-value pairs to match against items for exclusion
 * @param options - Options for controlling the matching behavior
 * @returns A new array containing only the elements that do NOT match the specified properties
 * @example
 * rejectByProperties(users, { role: 'admin' }); // returns non-admin users
 */
export { rejectByProperties };

/**
 * Returns elements in the first array that are not in the second array,
 * based on a key or selector function.
 * 
 * @param array - The source array
 * @param values - The array of values to exclude
 * @param keyOrSelector - Property name or selector function to determine uniqueness
 * @returns A new array with elements from the first array that are not in the second array
 * @example
 * differenceBy(allUsers, existingUsers, 'id'); // returns users not in existingUsers
 */
export { differenceBy };

/**
 * Removes duplicate values from an array.
 * For objects, a key function can be provided to determine uniqueness.
 * 
 * @param arr - The array to remove duplicates from
 * @param keyFn - Optional function to generate a unique key for each item
 * @returns A new array with duplicate values removed
 * @example
 * unique([1, 2, 2, 3, 1]); // returns [1, 2, 3]
 */
export { unique };

/**
 * @category Grouping
 * Functions for organizing array elements by various criteria
 */

/**
 * Groups an array of objects by a specified key or selector function.
 * 
 * @param arr - The array of objects to group
 * @param keyOrSelector - The property name or selector function to group by
 * @returns An object with keys derived from the specified property and values as arrays of objects
 * @example
 * groupBy(users, 'role'); // returns { 'admin': [...], 'user': [...] }
 */
export const groupBy = groupByUtil;

/**
 * Partitions an array into two groups based on a predicate function.
 * 
 * @param arr - The array to partition
 * @param predicate - The function to determine which group an item belongs to
 * @returns An array containing two arrays: items that pass the predicate and items that fail
 * @example
 * partitionBy(numbers, n => n % 2 === 0); // returns [[even numbers], [odd numbers]]
 */
export { partitionBy };

/**
 * Transforms an array of objects into a lookup object using a specified key or selector function.
 * 
 * @param arr - The array of objects to transform
 * @param keyOrSelector - The property name or selector function to use as the key
 * @returns An object mapping keys to their corresponding objects
 * @example
 * keyBy(users, 'id'); // returns { '1': user1, '2': user2, ... }
 */
export { keyBy };

/**
 * Groups an array of objects by multiple keys, creating a nested structure.
 * 
 * @param arr - The array of objects to group
 * @param keys - An array of property names or selector functions to group by, in order of nesting
 * @returns A nested object structure grouped by the specified keys
 * @example
 * groupByMultiple(data, ['year', 'month']); // returns { '2023': { 'Jan': [...], 'Feb': [...] }, '2024': { ... } }
 */
export { groupByMultiple };

/**
 * Counts occurrences of each unique value in an array, optionally using a key or selector function for objects.
 * 
 * @param arr - The array to count values in
 * @param keyOrSelector - Optional property name or selector function for objects
 * @returns An object mapping unique values to their counts
 * @example
 * countBy(users, 'role'); // returns { 'admin': 2, 'user': 3, ... }
 */
export { countBy };

/**
 * @category Transformation
 * Functions for reshaping and transforming array data structures
 */

/**
 * Recursively flattens nested arrays of any depth into a single-level array.
 * 
 * @param arr - The array to flatten, which may contain nested arrays
 * @returns A new array with all nested arrays flattened
 * @example
 * flattenDeep([1, [2, [3, 4], 5]]); // returns [1, 2, 3, 4, 5]
 */
export { flattenDeep };

/**
 * Transforms an array of objects into a key-value object using a specified key and optional value mapping function.
 * 
 * @param arr - The array of objects to transform
 * @param key - The property name to use as the key in the resulting object
 * @param valueMapper - Optional function to transform each object before adding to the result
 * @returns An object with keys derived from the specified property and corresponding values
 * @example
 * mapByKey(users, 'id'); // returns { '1': user1, '2': user2, ... }
 * mapByKey(users, 'id', user => user.name); // returns { '1': 'Alice', '2': 'Bob', ... }
 */
export { mapByKey };

/**
 * Creates a lookup object from an array of objects, using a specified property as the key.
 * Optimized for fast access by key.
 * 
 * @param arr - The array of objects to index
 * @param key - The property name to use as the index key
 * @returns An object mapping keys to their corresponding objects
 * @example
 * indexBy(users, 'id'); // returns { '1': user1, '2': user2, ... }
 */
export { indexBy };

/**
 * Extracts a specific property from each object in an array.
 * 
 * @param arr - The array of objects to process
 * @param key - The property name to extract from each object
 * @returns An array containing the values of the specified property from each object
 * @example
 * pluck(users, 'name'); // returns ['Alice', 'Bob', ...]
 */
export { pluck };
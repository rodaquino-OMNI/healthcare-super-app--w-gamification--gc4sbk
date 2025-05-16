/**
 * Array Test Fixtures
 * 
 * This barrel file exports all array test fixtures from the directory,
 * providing a single import point for array test data. This approach simplifies
 * test implementation by enabling developers to import all array fixtures
 * through a single import statement.
 * 
 * The exports are organized into namespaces to prevent naming collisions
 * between different fixture categories while maintaining a clean import pattern.
 * 
 * @module test/fixtures/array
 */

/**
 * Basic array fixtures for testing fundamental array operations.
 * Includes empty arrays, arrays of primitive types, and arrays of objects.
 */
export * as BasicArrays from './basic-arrays';

/**
 * Edge case array fixtures for testing boundary conditions and error handling.
 * Includes arrays with null values, undefined elements, NaN values, and mixed types.
 */
export * as EdgeCaseArrays from './edge-case-arrays';

/**
 * Filter array fixtures specifically designed for testing array filtering operations.
 * Includes arrays with elements that match various filtering criteria.
 */
export * as FilterArrays from './filter-arrays';

/**
 * Find array fixtures for testing array search operations.
 * Includes arrays with specific elements that can be found by value, condition, or property.
 */
export * as FindArrays from './find-arrays';

/**
 * Map array fixtures for testing array transformation operations.
 * Includes arrays with elements that can be transformed in predictable ways.
 */
export * as MapArrays from './map-arrays';

/**
 * Reduce array fixtures for testing array reduction operations.
 * Includes arrays that can be summed, averaged, or otherwise reduced to single values.
 */
export * as ReduceArrays from './reduce-arrays';

/**
 * Sort array fixtures for testing array sorting operations.
 * Includes pre-sorted arrays, reverse-sorted arrays, and arrays with custom sort orders.
 */
export * as SortArrays from './sort-arrays';

/**
 * Convenience re-exports of commonly used fixtures across all categories.
 * This allows direct import of frequently used fixtures without namespace qualification.
 */
export {
  // Basic arrays
  emptyArray,
  numberArray,
  stringArray,
  booleanArray,
  objectArray
} from './basic-arrays';

export {
  // Edge case arrays
  arrayWithNulls,
  arrayWithUndefined,
  arrayWithMixedTypes,
  arrayWithNaN
} from './edge-case-arrays';

/**
 * Type definitions for array fixtures to ensure type safety in tests.
 * These types provide proper typing for fixture objects and expected results.
 */
export type {
  TestObject,
  ArrayFixture,
  FilterFixture,
  SortFixture,
  MapFixture,
  ReduceFixture
} from './basic-arrays';
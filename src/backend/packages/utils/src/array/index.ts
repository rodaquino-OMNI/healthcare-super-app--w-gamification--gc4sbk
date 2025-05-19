/**
 * Array utility functions for consistent, centralized access across all journey services.
 * This module provides a clean public API for all array manipulation utilities,
 * enabling standardized import patterns and reducing potential circular dependencies.
 * 
 * @module array
 */

/**
 * Chunking utilities for splitting arrays into smaller pieces with various strategies.
 * Useful for batch processing, pagination, and optimizing performance with large datasets.
 */
export {
  chunk,
  chunkBySize,
  chunkByPredicate,
  chunkByKey,
  chunkForParallel
} from './chunk.util';

/**
 * Filtering utilities that go beyond standard JavaScript filter functionality.
 * Provides consistent filtering behavior for complex data structures across all journey services.
 */
export {
  uniqueBy,
  filterByProperties,
  rejectByProperties,
  differenceBy,
  intersectionBy,
  compact,
  filterWithRejections
} from './filter.util';

/**
 * Type definitions for advanced filtering operations.
 * These types provide type safety for filtering operations with complex criteria.
 */
export type {
  PropertyMatcher,
  FilterProperties
} from './filter.util';

/**
 * Grouping utilities for organizing array elements by various criteria.
 * Essential for data aggregation and organization across all journey services.
 */
export {
  groupBy,
  partitionBy,
  keyBy,
  countBy
} from './group.util';

/**
 * Transformation utilities for reshaping arrays into different data structures.
 * Critical for normalizing data across journey services and preparing it for display or processing.
 */
export {
  flattenDeep,
  mapByKey,
  pluck,
  nestByKeys
} from './transform.util';

/**
 * Re-export indexBy from transform.util.ts to avoid duplication.
 * This function creates a lookup object from an array of objects, optimized for fast access by key.
 */
export { indexBy } from './transform.util';
/**
 * Object manipulation utilities for the AUSTA SuperApp.
 * 
 * This module provides a comprehensive set of utilities for working with objects
 * across all journey services. These utilities ensure consistent object handling,
 * transformation, comparison, and cloning throughout the application.
 * 
 * The utilities are organized into logical categories:
 * - Transformation: Functions for picking, omitting, mapping, and filtering object properties
 * - Comparison: Functions for deep equality testing and difference detection
 * - Merging: Functions for combining objects with configurable strategies
 * - Cloning: Functions for creating deep copies of objects
 * 
 * @module @austa/utils/object
 */

// Re-export all utilities from specialized modules

// Transformation utilities
export { 
  pick,
  omit,
  mapValues,
  filterKeys,
  groupBy,
  flatten
} from './transform';

// Comparison utilities
export type { ObjectDifferences } from './comparison';
export {
  isEqual,
  getDifferences,
  hasDifferences,
  isPlainObject,
  isSubset
} from './comparison';

// Merging utilities
export type { MergeOptions } from './merge';
export {
  deepMerge,
  deepMergeObjects,
  ArrayMergeStrategy
} from './merge';

// Cloning utilities
export {
  deepClone,
  structuredClone
} from './clone';

// Re-export the simple merge from transform.ts with a more specific name to avoid confusion with deepMerge
import { merge as simpleMerge } from './transform';
export { simpleMerge as shallowMerge };
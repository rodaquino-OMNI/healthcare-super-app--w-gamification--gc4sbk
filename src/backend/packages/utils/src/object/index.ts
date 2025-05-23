/**
 * Central barrel file that exports all object manipulation utilities.
 * This file provides a clean, organized API for importing object utilities.
 */

// Export all utilities from the transform module
export {
  pick,
  omit,
  mapValues,
  filterKeys,
  deepClone,
  merge,
  groupBy,
  flatten
} from './transform';

// Export all utilities from the comparison module
export {
  isEqual,
  getDifferences,
  hasDifferences,
  isPlainObject,
  isSubset,
  type ObjectDifferences
} from './comparison';

// Export all utilities from the merge module
export {
  deepMerge,
  type MergeOptions
} from './merge';

// Export all utilities from the clone module
export {
  deepClone as cloneDeep,
  structuredClone
} from './clone';
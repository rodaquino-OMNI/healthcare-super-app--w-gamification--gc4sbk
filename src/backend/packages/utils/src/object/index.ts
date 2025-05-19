/**
 * @file Object manipulation utilities for the AUSTA SuperApp.
 * 
 * This module provides a comprehensive set of utilities for working with objects
 * across all journey services. These utilities ensure consistent object handling,
 * immutability, and type safety throughout the application.
 * 
 * The utilities are organized into logical categories:
 * - Transformation: Functions for selecting, filtering, and transforming object properties
 * - Comparison: Functions for deep equality checking and difference detection
 * - Merging: Functions for combining objects with various strategies
 * - Cloning: Functions for creating deep and shallow copies of objects
 * 
 * @module @austa/utils/object
 */

/**
 * Object transformation utilities for selecting, filtering, and transforming properties.
 * These utilities help with data mapping, filtering, and restructuring while maintaining immutability.
 */
export {
  /**
   * Creates a new object with only the specified properties from the source object.
   */
  pick,

  /**
   * Creates a new object excluding the specified properties from the source object.
   */
  omit,

  /**
   * Creates a new object with the same keys but transformed values based on a mapping function.
   */
  mapValues,

  /**
   * Creates a new object with only the keys that pass a predicate function.
   */
  filterKeys,

  /**
   * Renames keys in an object based on a mapping object.
   */
  renameKeys,

  /**
   * Flattens a nested object structure into a single-level object with path-based keys.
   */
  flattenObject,

  /**
   * Transforms an object by applying a transformation function to each key-value pair.
   */
  transformObject,

  /**
   * Converts an object's values to a specific type using a conversion function.
   */
  convertValues,
} from './transform';

/**
 * Object comparison utilities for deep equality checking and difference detection.
 * These utilities are crucial for change detection, equality testing, and diffing operations.
 */
export {
  /**
   * Performs a deep comparison between two values to determine if they are equivalent.
   */
  isEqual,

  /**
   * Gets the differences between two objects, returning a map of property paths to their old and new values.
   */
  getDifferences,

  /**
   * Checks if an object has any differences compared to another object.
   */
  hasDifferences,

  /**
   * Type guard that checks if two objects are equal.
   */
  objectsAreEqual,

  /**
   * Checks if a value is a plain object (not an array, null, or a primitive).
   */
  isPlainObject,

  /**
   * Options for controlling the behavior of comparison operations.
   */
  type ComparisonOptions,

  /**
   * Type representing the differences between two objects.
   */
  type ObjectDifferences,
} from './comparison';

/**
 * Object merging utilities for combining objects with various strategies.
 * These utilities are essential for configuration management, state updates, and data integration.
 */
export {
  /**
   * Deeply merges two or more objects together, with configurable merge strategies.
   */
  deepMerge,

  /**
   * Deeply merges two or more objects together with explicit options.
   */
  deepMergeWithOptions,

  /**
   * Merges configuration objects with special handling for environment-specific overrides.
   */
  mergeConfig,

  /**
   * Merges journey-specific configuration with base configuration.
   */
  mergeJourneyConfig,

  /**
   * Defines the strategy to use when merging arrays.
   */
  MergeStrategy,

  /**
   * Options for controlling the deep merge behavior.
   */
  type DeepMergeOptions,
} from './merge';

/**
 * Object cloning utilities for creating deep and shallow copies of objects.
 * These utilities ensure immutable operations by preventing unintended side effects.
 */
export {
  /**
   * Creates a deep clone of an object using a recursive approach with circular reference detection.
   */
  deepClone,

  /**
   * Creates a deep clone of an object using the native structuredClone API when available,
   * with a fallback to the custom deepClone implementation.
   */
  safeStructuredClone,

  /**
   * Creates a shallow clone of an object, copying only the top-level properties.
   */
  shallowClone,

  /**
   * Creates a clone of an object with a specified depth of cloning.
   */
  cloneWithDepth,
} from './clone';
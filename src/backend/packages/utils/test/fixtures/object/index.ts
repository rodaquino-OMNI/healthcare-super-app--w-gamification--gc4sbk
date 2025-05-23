/**
 * @file Object Test Fixtures Barrel File
 * 
 * This barrel file exports all object test fixtures from a single point,
 * enabling easy imports of test data for object utility tests. It uses
 * namespaced exports to prevent naming collisions between fixture categories.
 */

// Re-export all object fixture files
// These exports anticipate the creation of these fixture files in the future

/**
 * Fixtures for testing object transformation utilities (pick, omit, mapValues, filterKeys)
 */
export * as transformFixtures from './transform-objects';

/**
 * Fixtures for testing deep object comparison utilities (isEqual, getDifferences)
 */
export * as comparisonFixtures from './comparison-objects';

/**
 * Fixtures for testing object merging utilities (deepMerge with various strategies)
 */
export * as mergeFixtures from './merge-objects';

/**
 * Fixtures for testing object cloning utilities (deepClone, structuredClone)
 */
export * as cloneFixtures from './clone-objects';

/**
 * Fixtures for testing basic object operations and edge cases
 */
export * as basicFixtures from './basic-objects';

/**
 * Fixtures containing objects with special edge cases (circular references, prototypes, etc.)
 */
export * as edgeCaseFixtures from './edge-case-objects';